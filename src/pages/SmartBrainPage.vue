<template>
  <div class="smart-brain-page">
    <!-- 顶部信息区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">🧠 智能大脑</h1>
      </div>
      <div class="header-right">
        <el-tag :type="authStore.isAdmin ? 'success' : 'info'" size="large">
          {{ authStore.isAdmin ? '管理员' : '普通用户' }}
        </el-tag>
        <!-- 临时权限切换按钮 -->
        <el-button 
          @click="authStore.toggleRole()" 
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
      <el-card class="overview-card">
        <div class="card-content">
          <div class="card-icon">📊</div>
          <div class="card-info">
            <div class="card-title">总任务数</div>
            <div class="card-value">{{ overviewData.totalTasks }}</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <div class="card-content">
          <div class="card-icon">⏳</div>
          <div class="card-info">
            <div class="card-title">进行中</div>
            <div class="card-value">{{ overviewData.inProgressTasks }}</div>
          </div>
        </div>
      </el-card>
      
      <el-card class="overview-card">
        <div class="card-content">
          <div class="card-icon">✅</div>
          <div class="card-info">
            <div class="card-title">已完成</div>
            <div class="card-value">{{ overviewData.completedTasks }}</div>
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
          class="management-card"
          shadow="hover"
          @click="goToMaterialManagement"
        >
          <div class="management-content">
            <div class="management-icon">📦</div>
            <div class="management-info">
              <div class="management-title">物资名称管理</div>
              <div class="management-desc">管理基础物资信息</div>
            </div>
          </div>
        </el-card>
        
        <el-card 
          class="management-card"
          shadow="hover"
        >
          <div class="management-content">
            <div class="management-icon">🗄️</div>
            <div class="management-info">
              <div class="management-title">向量库数据管理</div>
              <div class="management-desc">管理AI训练数据</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 历史操作记录区 -->
    <div class="history-section">
      <h2 class="section-title">历史操作记录</h2>
      <el-table :data="executionHistory" style="width: 100%">
        <el-table-column prop="workflow" label="工作流" width="150" />
        <el-table-column prop="function" label="功能模块" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="80" />
        <el-table-column prop="timestamp" label="执行时间" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 任务详情弹窗 -->
    <TaskParsingResultDialog
      v-if="isContractParsing"
      v-model:show="taskParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
    <MaterialParsingResultDialog
      v-if="isSupplierMaterialParsing"
      v-model:show="supplierMaterialParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
    <OwnerMaterialParsingResultDialog
      v-if="isOwnerMaterialParsing"
      v-model:show="ownerMaterialParsingResultDialogVisible"
      :tasks="selectedTasks"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import TaskParsingResultDialog from '@/components/home/TaskParsingResultDialog.vue'
import MaterialParsingResultDialog from '@/components/home/MaterialParsingResultDialog.vue'
import OwnerMaterialParsingResultDialog from '@/components/home/OwnerMaterialParsingResultDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()

// 弹窗状态
const taskParsingResultDialogVisible = ref(false)
const supplierMaterialParsingResultDialogVisible = ref(false)
const ownerMaterialParsingResultDialogVisible = ref(false)

const isContractParsing = ref(false)
const isSupplierMaterialParsing = ref(false)
const isOwnerMaterialParsing = ref(false)

const selectedTasks = ref({})

// 智能体数据 - 保留原有逻辑
const smartAgents = computed(() => workflowStore.smartAgents)

// 总览数据
const overviewData = computed(() => {
  const agents = smartAgents.value
  let totalTasks = 0
  let inProgressTasks = 0
  let completedTasks = 0

  agents.forEach(agent => {
    totalTasks += agent.tasks.total || 0
    inProgressTasks += agent.tasks.inProgress || 0
    completedTasks += agent.tasks.completed || 0
  })

  return {
    totalTasks,
    inProgressTasks,
    completedTasks
  }
})

// 历史记录数据
const executionHistory = ref([
  {
    id: 1,
    workflow: '合同解析',
    function: '文档处理',
    status: 'success',
    duration: '2.3s',
    timestamp: '2024-01-15 14:30:25'
  },
  {
    id: 2,
    workflow: '物资解析',
    function: '数据提取',
    status: 'success',
    duration: '1.8s',
    timestamp: '2024-01-15 14:25:10'
  }
])

// 打开智能体详情弹窗
const openAgentDialog = async (agent) => {
  isContractParsing.value = false
  isSupplierMaterialParsing.value = false
  isOwnerMaterialParsing.value = false

  // 使用原有的 tasksByAgent 数据
  selectedTasks.value = workflowStore.tasksByAgent[agent.id] || { 
    all: [], 
    completed: [], 
    inProgress: [] 
  }

  await nextTick()

  if (agent.id === 'contractParsing') {
    isContractParsing.value = true
    taskParsingResultDialogVisible.value = true
  } else if (agent.id === 'supplierMaterialParsing') {
    isSupplierMaterialParsing.value = true
    supplierMaterialParsingResultDialogVisible.value = true
  } else if (agent.id === 'ownerSuppliedMaterialParsing') {
    isOwnerMaterialParsing.value = true
    ownerMaterialParsingResultDialogVisible.value = true
  }
}

// 跳转到物资管理页面
const goToMaterialManagement = () => {
  router.push('/smart-brain/material-management')
}

// 页面加载时获取数据 - 保留原有逻辑
onMounted(() => {
  // 调用原有的智能大脑数据获取逻辑
  workflowStore.handleSmartBrain()
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