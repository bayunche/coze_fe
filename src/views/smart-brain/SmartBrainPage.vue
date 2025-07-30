<template>
  <div class="smart-brain-page">
    <!-- 顶部信息区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">🧠 智能大脑</h1>
      </div>
      <div class="header-right">
        <el-tag :type="userRoleTag.type" size="large">
          {{ userRoleTag.text }}
        </el-tag>
        <!-- 临时权限切换按钮 -->
        <el-button 
          @click="toggleUserRole" 
          size="small" 
          type="primary"
          style="margin-left: 12px"
        >
          切换角色
        </el-button>
      </div>
    </div>

    <!-- 总览数据卡片区 -->
    <div class="overview-cards">
      <el-card 
        v-for="(config, key) in OVERVIEW_CARD_CONFIG" 
        :key="key"
        class="overview-card"
      >
        <div class="card-content">
          <div class="card-icon">{{ config.icon }}</div>
          <div class="card-info">
            <div class="card-title">{{ config.title }}</div>
            <div class="card-value">{{ overviewData[config.key] }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 智能体监控区 -->
    <div class="agents-section">
      <h2 class="section-title">智能体监控</h2>
      <div class="agents-grid">
        <el-card
          v-for="agent in smartAgents"
          :key="agent.id"
          class="agent-card"
          shadow="hover"
          @click="openAgentDialog(agent)"
        >
          <template #header>
            <div class="agent-header">
              <span class="agent-name">{{ agent.name }}</span>
              <el-tag type="success" size="small">在线</el-tag>
            </div>
          </template>
          
          <div class="agent-stats">
            <div class="stat-item">
              <span class="stat-value">{{ agent.tasks.completed }}</span>
              <span class="stat-label">已完成</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ agent.tasks.inProgress }}</span>
              <span class="stat-label">进行中</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ agent.tasks.total }}</span>
              <span class="stat-label">总任务</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 管理功能入口区（仅管理员可见） -->
    <div v-if="authStore.isAdmin" class="management-section">
      <h2 class="section-title">管理功能</h2>
      <div class="management-grid">
        <el-card 
          v-for="(feature, key) in availableFeatures"
          :key="key"
          class="management-card"
          shadow="hover"
          @click="navigateToFeature(feature.route)"
        >
          <div class="management-content">
            <div class="management-icon">{{ feature.icon }}</div>
            <div class="management-info">
              <div class="management-title">{{ feature.title }}</div>
              <div class="management-desc">{{ feature.description }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 历史操作记录区 -->
    <div class="history-section">
      <h2 class="section-title">历史操作记录</h2>
      <el-table :data="executionHistory" style="width: 100%">
        <el-table-column 
          v-for="column in TABLE_CONFIG.COLUMNS"
          :key="column.prop || column.label"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
        >
          <template v-if="column.prop === 'status'" #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
          <template v-else-if="column.label === '操作'" #default="{ row }">
            <el-button size="small" type="primary" link @click="viewHistoryDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 任务详情弹窗 -->
    <TaskParsingResultDialog
      v-if="dialogStates.isContractParsing"
      v-model:show="dialogStates.taskParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
    <MaterialParsingResultDialog
      v-if="dialogStates.isSupplierMaterialParsing"
      v-model:show="dialogStates.supplierMaterialParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
    <OwnerMaterialParsingResultDialog
      v-if="dialogStates.isOwnerMaterialParsing"
      v-model:show="dialogStates.ownerMaterialParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import TaskParsingResultDialog from '@/components/home/TaskParsingResultDialog/TaskParsingResultDialog.vue'
import MaterialParsingResultDialog from '@/components/home/MaterialParsingResultDialog/MaterialParsingResultDialog.vue'
import OwnerMaterialParsingResultDialog from '@/components/home/OwnerMaterialParsingResultDialog.vue'

import { 
  OVERVIEW_CARD_CONFIG,
  MANAGEMENT_FEATURES,
  TABLE_CONFIG,
  MOCK_EXECUTION_HISTORY
} from './constants.js'
import { 
  calculateOverviewData,
  getDialogTypeByAgentId,
  getStatusLabel,
  getStatusType,
  formatAgentTasks,
  isFeatureAvailable,
  getUserRoleTag,
  createRouteNavigator,
  resetDialogStates
} from './utils.js'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

// 创建路由导航函数
const navigateToFeature = createRouteNavigator(router)

// 对话框状态管理
const dialogStates = reactive(resetDialogStates())
const selectedTasks = ref({})

// 计算属性
const smartAgents = computed(() => workflowStore.smartAgents)
const overviewData = computed(() => calculateOverviewData(smartAgents.value))
const userRoleTag = computed(() => getUserRoleTag(authStore.isAdmin))

// 可用功能列表（仅显示可用功能）
const availableFeatures = computed(() => {
  return Object.fromEntries(
    Object.entries(MANAGEMENT_FEATURES).filter(([, feature]) => isFeatureAvailable(feature))
  )
})

// 历史记录数据（可以后续替换为从API获取）
const executionHistory = ref(MOCK_EXECUTION_HISTORY)

// 事件处理方法
const toggleUserRole = () => {
  authStore.toggleRole()
}

const openAgentDialog = async (agent) => {
  // 重置所有对话框状态
  Object.assign(dialogStates, resetDialogStates())
  
  // 格式化任务数据
  selectedTasks.value = formatAgentTasks(workflowStore.taskListsByAgent, agent.id)
  
  await nextTick()

  // 根据智能体类型显示对应对话框
  const dialogType = getDialogTypeByAgentId(agent.id)
  if (dialogType) {
    switch (dialogType) {
      case 'contractParsing':
        dialogStates.isContractParsing = true
        dialogStates.taskParsingResultDialogVisible = true
        break
      case 'supplierMaterialParsing':
        dialogStates.isSupplierMaterialParsing = true
        dialogStates.supplierMaterialParsingResultDialogVisible = true
        break
      case 'ownerSuppliedMaterialParsing':
        dialogStates.isOwnerMaterialParsing = true
        dialogStates.ownerMaterialParsingResultDialogVisible = true
        break
    }
  }
}

const viewHistoryDetail = (row) => {
  // TODO: 实现历史详情查看逻辑
  console.log('查看历史详情:', row)
}

// 页面初始化
const initializePage = async () => {
  try {
    await workflowStore.handleSmartBrain()
  } catch (error) {
    console.error('初始化智能大脑数据失败:', error)
  }
}

onMounted(() => {
  initializePage()
})
</script>

<style scoped>
.smart-brain-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--theme-bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.overview-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-tertiary);
  border-radius: 12px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-primary);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin-bottom: 20px;
}

.agents-section {
  margin-bottom: 40px;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.agent-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-name {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.agent-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

.management-section {
  margin-bottom: 40px;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.management-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
}

.management-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.management-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.management-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-bg-tertiary);
  border-radius: 12px;
}

.management-info {
  flex: 1;
}

.management-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin-bottom: 4px;
}

.management-desc {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.history-section {
  margin-bottom: 40px;
}

/* Element Plus 表格样式覆盖 */
:deep(.el-table) {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-primary);
  border-radius: 8px;
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg);
  color: var(--theme-text-primary);
  border-color: var(--theme-table-border);
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border);
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg);
}

/* 卡片样式优化 */
:deep(.el-card__header) {
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
  color: var(--theme-text-primary);
}

:deep(.el-card__body) {
  background: var(--theme-bg-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .smart-brain-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .agents-grid {
    grid-template-columns: 1fr;
  }
  
  .management-grid {
    grid-template-columns: 1fr;
  }
}
</style>