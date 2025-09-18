<template>
  <div class="page-container">
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
          <el-button @click="toggleUserRole" size="small" type="primary" style="margin-left: 12px">
            切换角色
          </el-button>
          <!-- 返回首页按钮 -->
          <el-button @click="goToHome" size="small" style="margin-left: 12px"> 返回首页 </el-button>
        </div>
      </div>

      <!-- 总览数据卡片区 -->
      <div class="overview-cards">
        <el-card 
          v-for="(config, key) in OVERVIEW_CARD_CONFIG" 
          :key="key" 
          class="overview-card clickable-card"
          @click="openStatsDialog(config.dialogType)"
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

      <!-- 项目监控区 -->
      <div class="projects-section">
        <div class="section-header">
          <h2 class="section-title">项目监控</h2>
          <div class="section-actions">
            <el-button
              @click="goToProjectManagement"
              type="primary"
              size="small"
            >
              查看所有项目
            </el-button>
            <el-button
              @click="refreshProjects"
              :loading="projectLoading"
              size="small"
            >
              刷新数据
            </el-button>
          </div>
        </div>

        <!-- 项目列表 -->
        <div class="projects-list" v-loading="projectLoading">
          <!-- 空状态 -->
          <div v-if="topThreeProjects.length === 0 && !projectLoading" class="empty-state">
            <div class="empty-icon">📊</div>
            <div class="empty-text">暂无项目数据</div>
            <el-button @click="refreshProjects" type="primary" size="small">
              重新加载
            </el-button>
          </div>

          <!-- 项目列表项 -->
          <div
            v-for="project in topThreeProjects"
            :key="project.projectId"
            class="project-item"
            @click="openProjectDetail(project)"
          >
            <div class="project-main">
              <div class="project-info">
                <div class="project-header">
                  <h3 class="project-name">{{ project.projectName }}</h3>
                  <el-tag
                    :type="getProjectStatusType(project.status)"
                    size="small"
                    class="project-status"
                  >
                    {{ getProjectStatusText(project.status) }}
                  </el-tag>
                </div>
                <p class="project-code">{{ project.projectCode }}</p>
              </div>

              <div class="project-stats">
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-icon">📋</span>
                    <span class="stat-count">{{ project.contractTasks }}</span>
                    <span class="stat-label">合同</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">📦</span>
                    <span class="stat-count">{{ project.supplierMaterialTasks }}</span>
                    <span class="stat-label">乙供</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">🏗️</span>
                    <span class="stat-count">{{ project.ownerMaterialTasks }}</span>
                    <span class="stat-label">甲供</span>
                  </div>
                  <div class="stat-item total">
                    <span class="stat-icon">🎯</span>
                    <span class="stat-count">{{ project.totalTasks }}</span>
                    <span class="stat-label">总数</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="project-progress">
              <div class="progress-header">
                <span class="progress-label">进度</span>
                <span class="progress-percentage">{{ project.progressPercentage }}%</span>
              </div>
              <el-progress
                :percentage="project.progressPercentage"
                :stroke-width="4"
                :show-text="false"
                :color="getProgressColor(project.progressPercentage)"
              />
            </div>

            <div class="project-actions">
              <el-button
                size="small"
                type="primary"
                @click.stop="openProjectDetail(project)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 待办事项区（仅管理员可见） -->
      <TodoSection />

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
      <!-- <div class="history-section">
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
    </div> -->

      
      <!-- 统计弹窗 -->
      <OverviewStatsDialog
        v-model:show="statsDialogVisible"
        :dialog-type="currentStatsDialogType"
        :data="currentStatsData"
        @refresh="handleStatsRefresh"
      />
    </div>
    
    <!-- 添加DialogManager组件，用于显示各种弹窗 -->
    <DialogManager />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWorkflowStore } from '@/stores/workflow'
import { useProjectStore } from '@/stores/project'
import DialogManager from '@/components/home/DialogManager'
import OverviewStatsDialog from '@/components/home/OverviewStatsDialog'
import TodoSection from '@/components/todo/TodoSection.vue'

import {
  OVERVIEW_CARD_CONFIG,
  MANAGEMENT_FEATURES
} from './constants.js'
import {
  calculateOverviewData,
  isFeatureAvailable,
  getUserRoleTag,
  createRouteNavigator,
  getStatsDialogMockData
} from './utils.js'

const router = useRouter()
const authStore = useAuthStore()
const workflowStore = useWorkflowStore()
const projectStore = useProjectStore()

// 创建路由导航函数
const navigateToFeature = createRouteNavigator(router)

// 统计弹窗相关状态
const statsDialogVisible = ref(false)
const currentStatsDialogType = ref('total')
const currentStatsData = ref([])

// 项目相关状态
const projectLoading = ref(false)

// 计算属性
const smartAgents = computed(() => workflowStore.smartAgents)
const overviewData = computed(() => calculateOverviewData(smartAgents.value))
const userRoleTag = computed(() => getUserRoleTag(authStore.isAdmin))

// 项目相关计算属性
const projectsWithStats = computed(() => projectStore.projectsWithStats)

// 只显示前三个项目
const topThreeProjects = computed(() => {
  return projectsWithStats.value.slice(0, 3)
})

// 可用功能列表（仅显示可用功能）
const availableFeatures = computed(() => {
  return Object.fromEntries(
    Object.entries(MANAGEMENT_FEATURES).filter(([, feature]) => isFeatureAvailable(feature))
  )
})


// TODO: 后续需要从真实 API 获取各类统计数据，替换 mock 数据

// 事件处理方法
const toggleUserRole = () => {
  authStore.toggleRole()
}

const goToHome = () => {
  router.push('/home')
}

// 项目相关方法
const refreshProjects = async () => {
  try {
    projectLoading.value = true
    await projectStore.fetchProjects({}, true)
  } catch (error) {
    console.error('刷新项目数据失败:', error)
  } finally {
    projectLoading.value = false
  }
}

const openProjectDetail = (project) => {
  console.log('打开项目详情:', project)
  // 跳转到项目详情页
  router.push(`/project-detail/${project.projectId || project.projectCode}`)
}

const goToProjectManagement = () => {
  console.log('跳转到项目管理页面')
  // 跳转到项目管理页面
  router.push('/project-management')
}

// 项目状态相关工具函数
const getProjectStatusType = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'RUNNING':
      return 'success'
    case 'COMPLETED':
      return 'info'
    case 'PAUSED':
      return 'warning'
    case 'FAILED':
    case 'ERROR':
      return 'danger'
    default:
      return 'info'
  }
}

const getProjectStatusText = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return '进行中'
    case 'RUNNING':
      return '运行中'
    case 'COMPLETED':
      return '已完成'
    case 'PAUSED':
      return '已暂停'
    case 'FAILED':
      return '失败'
    case 'ERROR':
      return '错误'
    default:
      return '未知状态'
  }
}

const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 70) return '#409eff'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

/**
 * 打开统计弹窗
 * @param {string} dialogType - 弹窗类型 (total, completed, inProgress, failed)
 */
const openStatsDialog = (dialogType) => {
  // TODO: 后续需要替换为真实 API 数据获取
  currentStatsDialogType.value = dialogType
  currentStatsData.value = getStatsDialogMockData(dialogType)
  statsDialogVisible.value = true
  
  console.log(`打开${dialogType}类型的统计弹窗, 数据条数:`, currentStatsData.value.length)
}

/**
 * 处理统计数据刷新
 * @param {string} dialogType - 需要刷新的弹窗类型
 */
const handleStatsRefresh = (dialogType) => {
  // TODO: 后续需要调用真实 API 刷新数据
  console.log(`刷新${dialogType}类型的统计数据`)
  
  // 暂时重新获取 mock 数据
  if (dialogType === currentStatsDialogType.value) {
    currentStatsData.value = getStatsDialogMockData(dialogType)
  }
}

// 页面初始化
const initializePage = async () => {
  try {
    // 同时加载工作流数据和项目数据
    await Promise.all([
      workflowStore.executeSmartBrain(),
      refreshProjects()
    ])
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

/* 可点击卡片样式 */
.clickable-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.clickable-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.clickable-card:active {
  transform: translateY(-1px) scale(1.01);
  transition-duration: 0.1s;
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

/* 项目监控区 */
.projects-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

/* 项目列表样式 */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--theme-card-bg);
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 24px;
}

.project-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.project-main {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

/* 项目信息区域 */
.project-info {
  min-width: 200px;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 12px;
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.project-code {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.project-status {
  flex-shrink: 0;
}

.project-content {
  padding: 0;
}

.task-stats {
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--theme-bg-light, #f8f9fa);
  border-radius: 8px;
  min-height: 60px;
}

.stat-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.stat-details {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-text-primary);
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
  line-height: 1.2;
}

/* 不同类型任务的颜色主题 */
.contract-stat {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.supplier-stat {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
  border: 1px solid rgba(103, 194, 58, 0.2);
}

.owner-stat {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 100%);
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.total-stat {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.05) 100%);
  border: 1px solid rgba(230, 162, 60, 0.2);
}

.progress-section {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.status-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.status-item.completed {
  color: var(--el-color-success);
}

.status-item.in-progress {
  color: var(--el-color-primary);
}

.status-item.failed {
  color: var(--el-color-danger);
}

.project-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: var(--theme-bg-light, #f8f9fa);
  border-top: 1px solid var(--theme-border-light);
  margin: 0 -20px -20px -20px;
}

.project-actions .el-button {
  flex: 1;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: var(--theme-text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 20px;
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
.page-container {
  background: var(--theme-bg-primary);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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

  .projects-list {
    gap: 12px;
  }

  .project-item {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px;
  }

  .project-main {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .project-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .management-grid {
    grid-template-columns: 1fr;
  }
}

/* 新增项目列表相关样式 */
.project-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0;
  flex: 1;
}

.project-code {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.project-status {
  flex-shrink: 0;
}

/* 项目统计样式 */
.project-stats {
  flex: 1;
  max-width: 300px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--theme-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: var(--theme-bg-hover);
  border-color: var(--theme-primary);
}

.stat-item.total {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.05));
  border-color: var(--theme-primary);
}

.stat-icon {
  font-size: 16px;
}

.stat-count {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

/* 项目进度样式 */
.project-progress {
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.progress-percentage {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

/* 项目操作样式 */
.project-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
