<template>
  <div class="project-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          type="text"
          class="back-btn"
        >
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">项目任务详情</h1>
          <p class="page-subtitle">{{ currentProject?.projectName || '项目详情' }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :icon="Refresh" type="default">
          刷新数据
        </el-button>
        <el-button @click="handleExportAll" :icon="Download" type="primary" :loading="exportLoading">
          导出全部数据
        </el-button>
      </div>
    </div>

    <!-- 项目统计卡片 -->
    <div class="project-stats">
      <el-card class="stats-card" v-for="stat in projectStatistics" :key="stat.key">
        <div class="stat-content">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="24">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 按行分栏任务展示 -->
    <div class="tasks-container" v-loading="loading">
      <!-- 合同解析任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Document />
            </el-icon>
            合同解析任务
          </h3>
          <div class="row-stats">
            <el-badge :value="contractTasks.length" class="task-count-badge" />
          </div>
        </div>

        <div class="task-list" v-loading="contractTasksLoading">
          <el-empty v-if="contractTasks.length === 0" description="暂无合同解析任务" />
          <div v-else class="task-cards">
            <el-card
              v-for="task in contractTasks"
              :key="task.taskId"
              class="task-card"
              :class="{
                'status-completed': task.taskStatus === 2,
                'status-running': task.taskStatus === 1,
                'status-failed': task.taskStatus === 3
              }"
              @click="handleTaskClick(task, 'contract')"
            >
              <div class="task-content">
                <div class="task-header">
                  <div class="task-title">{{ task.title || `合同解析任务 ${task.id.slice(-6)}` }}</div>
                  <el-tag
                    :type="getTaskStatusType(task.taskStatus)"
                    size="small"
                    class="task-status"
                  >
                    {{ getTaskStatusText(task.taskStatus) }}
                  </el-tag>
                </div>

                <div class="task-info">
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatDateTime(task.createdTime) }}
                    </span>
                    <span class="meta-item" v-if="task.endTime">
                      <el-icon><Check /></el-icon>
                      {{ formatDateTime(task.endTime) }}
                    </span>
                  </div>

                  <div class="task-files" v-if="task.fileCount && task.fileCount > 0">
                    <el-icon><Folder /></el-icon>
                    {{ task.fileCount }} 个文件
                    <span v-if="task.fileErrorCount > 0" class="error-count">
                      ({{ task.fileErrorCount }} 个错误)
                    </span>
                  </div>
                </div>

                <div class="task-actions">
                  <el-button size="small" type="primary" plain>
                    查看详情
                  </el-button>
                  <el-button
                    v-if="task.taskStatus === 2"
                    size="small"
                    type="success"
                    plain
                  >
                    下载结果
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <!-- 乙供物资任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Box />
            </el-icon>
            乙供物资任务
          </h3>
          <div class="row-stats">
            <el-badge :value="supplierMaterialTasks.length" class="task-count-badge" />
          </div>
        </div>

        <div class="task-list" v-loading="supplierMaterialTasksLoading">
          <el-empty v-if="supplierMaterialTasks.length === 0" description="暂无乙供物资任务" />
          <div v-else class="task-cards">
            <el-card
              v-for="task in supplierMaterialTasks"
              :key="task.taskId"
              class="task-card"
              :class="{
                'status-completed': task.taskStatus === 2,
                'status-running': task.taskStatus === 1,
                'status-failed': task.taskStatus === 3
              }"
              @click="handleTaskClick(task, 'supplier_material')"
            >
              <div class="task-content">
                <div class="task-header">
                  <div class="task-title">{{ task.title || `乙供物资任务 ${task.id.slice(-6)}` }}</div>
                  <el-tag
                    :type="getTaskStatusType(task.status)"
                    size="small"
                    class="task-status"
                  >
                    {{ getTaskStatusText(task.status) }}
                  </el-tag>
                </div>

                <div class="task-info">
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatDateTime(task.createTime) }}
                    </span>
                    <span class="meta-item" v-if="task.finishTime">
                      <el-icon><Check /></el-icon>
                      {{ formatDateTime(task.finishTime) }}
                    </span>
                  </div>

                  <div class="task-files" v-if="task.files && task.files.length > 0">
                    <el-icon><Folder /></el-icon>
                    {{ task.files.length }} 个文件
                  </div>
                </div>

                <div class="task-actions">
                  <el-button size="small" type="primary" plain>
                    查看详情
                  </el-button>
                  <el-button
                    v-if="task.status === 'COMPLETED'"
                    size="small"
                    type="success"
                    plain
                  >
                    下载结果
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>

      <!-- 甲供物资任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Goods />
            </el-icon>
            甲供物资任务
          </h3>
          <div class="row-stats">
            <el-badge :value="ownerMaterialTasks.length" class="task-count-badge" />
          </div>
        </div>

        <div class="task-list" v-loading="ownerMaterialTasksLoading">
          <el-empty v-if="ownerMaterialTasks.length === 0" description="暂无甲供物资任务" />
          <div v-else class="task-cards">
            <el-card
              v-for="task in ownerMaterialTasks"
              :key="task.taskId"
              class="task-card"
              :class="{
                'status-completed': task.taskStatus === 2,
                'status-running': task.taskStatus === 1,
                'status-failed': task.taskStatus === 3
              }"
              @click="handleTaskClick(task, 'owner_material')"
            >
              <div class="task-content">
                <div class="task-header">
                  <div class="task-title">{{ task.title || `甲供物资任务 ${task.id.slice(-6)}` }}</div>
                  <el-tag
                    :type="getTaskStatusType(task.status)"
                    size="small"
                    class="task-status"
                  >
                    {{ getTaskStatusText(task.status) }}
                  </el-tag>
                </div>

                <div class="task-info">
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ formatDateTime(task.createTime) }}
                    </span>
                    <span class="meta-item" v-if="task.finishTime">
                      <el-icon><Check /></el-icon>
                      {{ formatDateTime(task.finishTime) }}
                    </span>
                  </div>

                  <div class="task-files" v-if="task.files && task.files.length > 0">
                    <el-icon><Folder /></el-icon>
                    {{ task.files.length }} 个文件
                  </div>
                </div>

                <div class="task-actions">
                  <el-button size="small" type="primary" plain>
                    查看详情
                  </el-button>
                  <el-button
                    v-if="task.status === 'COMPLETED'"
                    size="small"
                    type="success"
                    plain
                  >
                    下载结果
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  Refresh,
  Download,
  Document,
  Box,
  Goods,
  Clock,
  Check,
  Folder
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 导入项目状态管理
import { useProjectStore } from '@/stores/project.js'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()

// 从项目store中获取数据
const {
  currentProject
} = storeToRefs(projectStore)

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const contractTasksLoading = ref(false)
const supplierMaterialTasksLoading = ref(false)
const ownerMaterialTasksLoading = ref(false)

const contractTasks = ref([])
const supplierMaterialTasks = ref([])
const ownerMaterialTasks = ref([])

// 计算属性
const projectStatistics = computed(() => {
  if (!currentProject.value) return []

  return [
    {
      key: 'totalTasks',
      label: '任务总数',
      value: currentProject.value.totalTasks || 0,
      icon: 'List',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      key: 'completedTasks',
      label: '已完成',
      value: currentProject.value.completedTasks || 0,
      icon: 'CircleCheck',
      color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      key: 'inProgressTasks',
      label: '进行中',
      value: currentProject.value.inProgressTasks || 0,
      icon: 'Loading',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      key: 'contractTasks',
      label: '合同任务',
      value: currentProject.value.contractTasks || 0,
      icon: 'Document',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ]
})

// 方法定义
const loadProjectTasks = async () => {
  try {
    loading.value = true

    const projectId = route.params.projectId

    // 从项目列表缓存中获取项目基本信息
    const cachedProject = projectStore.getProjectById(projectId)
    if (cachedProject) {
      currentProject.value = cachedProject
    } else {
      // 如果缓存中没有，设置基本信息
      currentProject.value = {
        projectId: projectId,
        projectName: `项目 ${projectId}`,
        projectCode: projectId,
        totalTasks: 0,
        contractTasks: 0,
        supplierMaterialTasks: 0,
        ownerMaterialTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        failedTasks: 0
      }
    }

    // 加载各类型任务
    await Promise.all([
      loadContractTasks(projectId),
      loadSupplierMaterialTasks(projectId),
      loadOwnerMaterialTasks(projectId)
    ])

    // 从任务数据中获取项目信息（如果缓存中没有的话）
    if (!cachedProject) {
      extractProjectInfoFromTasks()
    }

    // 根据任务数据更新项目统计
    updateProjectStatistics()

  } catch (error) {
    console.error('加载项目任务失败:', error)
    ElMessage.error('加载项目任务失败')
  } finally {
    loading.value = false
  }
}

const loadContractTasks = async (projectId) => {
  try {
    contractTasksLoading.value = true

    // 使用智能体任务API查询合同任务
    const response = await projectStore.getAgentTasks({
      agentLabels: 'contract',
      projectId: projectId,
      page: 0,
      size: 100
    })
    contractTasks.value = response.content || []
    return response

  } catch (error) {
    console.error('加载合同任务失败:', error)
    contractTasks.value = []
    return { content: [] }
  } finally {
    contractTasksLoading.value = false
  }
}

const loadSupplierMaterialTasks = async (projectId) => {
  try {
    supplierMaterialTasksLoading.value = true

    // 使用智能体任务API查询乙供物资任务
    const response = await projectStore.getAgentTasks({
      agentLabels: 'y_material',
      projectId: projectId,
      page: 0,
      size: 100
    })
    supplierMaterialTasks.value = response.content || []
    return response

  } catch (error) {
    console.error('加载乙供物资任务失败:', error)
    supplierMaterialTasks.value = []
    return { content: [] }
  } finally {
    supplierMaterialTasksLoading.value = false
  }
}

const loadOwnerMaterialTasks = async (projectId) => {
  try {
    ownerMaterialTasksLoading.value = true

    // 使用智能体任务API查询甲供物资任务
    const response = await projectStore.getAgentTasks({
      agentLabels: 'j_material',
      projectId: projectId,
      page: 0,
      size: 100
    })
    ownerMaterialTasks.value = response.content || []
    return response

  } catch (error) {
    console.error('加载甲供物资任务失败:', error)
    ownerMaterialTasks.value = []
    return { content: [] }
  } finally {
    ownerMaterialTasksLoading.value = false
  }
}

// 从任务数据中提取项目信息
const extractProjectInfoFromTasks = () => {
  if (!currentProject.value) return

  const allTasks = [
    ...contractTasks.value,
    ...supplierMaterialTasks.value,
    ...ownerMaterialTasks.value
  ]

  // 从第一个任务中获取项目信息
  if (allTasks.length > 0) {
    const firstTask = allTasks[0]
    if (firstTask.projectInfo) {
      currentProject.value.projectName = firstTask.projectInfo.projectName || currentProject.value.projectName
      currentProject.value.projectCode = firstTask.projectInfo.projectCode || currentProject.value.projectCode
      currentProject.value.engineeringName = firstTask.projectInfo.engineeringName
      currentProject.value.engineeringCode = firstTask.projectInfo.engineeringCode
      currentProject.value.contractCode = firstTask.projectInfo.contractCode
      currentProject.value.contractName = firstTask.projectInfo.contractName
    }
  }
}

// 根据任务数据更新项目统计
const updateProjectStatistics = () => {
  if (!currentProject.value) return

  const allTasks = [
    ...contractTasks.value,
    ...supplierMaterialTasks.value,
    ...ownerMaterialTasks.value
  ]

  // 统计各种状态的任务数量
  let completedCount = 0
  let inProgressCount = 0
  let failedCount = 0

  allTasks.forEach(task => {
    if (task.taskStatus === 2) {
      completedCount++
    } else if (task.taskStatus === 1) {
      inProgressCount++
    } else if (task.taskStatus === 3) {
      failedCount++
    }
  })

  // 更新项目统计
  currentProject.value.totalTasks = allTasks.length
  currentProject.value.contractTasks = contractTasks.value.length
  currentProject.value.supplierMaterialTasks = supplierMaterialTasks.value.length
  currentProject.value.ownerMaterialTasks = ownerMaterialTasks.value.length
  currentProject.value.completedTasks = completedCount
  currentProject.value.inProgressTasks = inProgressCount
  currentProject.value.failedTasks = failedCount

  console.log('【项目详情】更新项目统计:', currentProject.value)
}

const goBack = () => {
  router.push('/project-management')
}

const handleRefresh = async () => {
  await loadProjectTasks()
  ElMessage.success('数据刷新成功')
}

const handleExportAll = async () => {
  try {
    exportLoading.value = true

    const allTasks = [
      ...contractTasks.value,
      ...supplierMaterialTasks.value,
      ...ownerMaterialTasks.value
    ]

    // 这里实现导出逻辑
    console.log('导出所有任务数据:', allTasks)
    ElMessage.success('导出成功')

  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const handleTaskClick = (task, taskType) => {
  console.log('点击任务:', task, taskType)

  // 根据任务类型跳转到对应的详情页面
  switch (taskType) {
    case 'contract':
      // 跳转到合同解析详情页
      router.push(`/contract-detail/${task.id}`)
      break
    case 'supplier_material':
      // 跳转到乙供物资详情页
      router.push(`/material-detail/${task.id}`)
      break
    case 'owner_material':
      // 跳转到甲供物资详情页
      router.push(`/owner-material-detail/${task.id}`)
      break
    default:
      console.warn('未知任务类型:', taskType)
  }
}

// 工具方法
const formatDateTime = (dateString) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

const getTaskStatusType = (taskStatus) => {
  // taskStatus: 1-运行中, 2-已完成, 3-失败, 0-待处理
  const statusMap = {
    2: 'success',  // 已完成
    1: 'warning',  // 运行中
    3: 'danger',   // 失败
    0: 'info'      // 待处理
  }
  return statusMap[taskStatus] || 'info'
}

const getTaskStatusText = (taskStatus) => {
  // taskStatus: 1-运行中, 2-已完成, 3-失败, 0-待处理
  const statusMap = {
    2: '已完成',
    1: '运行中',
    3: '失败',
    0: '待处理'
  }
  return statusMap[taskStatus] || '未知'
}

// 生命周期
onMounted(async () => {
  await loadProjectTasks()
})
</script>

<style scoped>
.project-detail-page {
  background: var(--theme-bg-primary);
  min-height: 100vh;
  padding: 24px;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin: 0;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 项目统计卡片 */
.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient, linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light)));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--theme-card-hover-shadow);
}

.stats-card:hover::before {
  opacity: 1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 按行分栏任务容器 */
.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: calc(100vh - 300px);
}

/* 任务行 */
.task-row {
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.01));
  border-bottom: 2px solid var(--theme-border-secondary);
}

.row-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
}

.row-icon {
  font-size: 20px;
  color: var(--theme-primary);
}

.row-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-count-badge {
  font-size: 14px;
}

.task-list {
  flex: 1;
  padding: 20px;
  overflow-x: auto;
  overflow-y: hidden;
}

.task-cards {
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding-bottom: 10px;
}

/* 任务卡片 */
.task-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

/* 任务状态样式 */
.task-card.status-completed {
  border-left: 4px solid #67c23a;
}

.task-card.status-running {
  border-left: 4px solid #e6a23c;
}

.task-card.status-failed {
  border-left: 4px solid #f56c6c;
}

.task-content {
  padding: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-primary);
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status {
  font-size: 12px;
  border-radius: 4px;
}

.task-info {
  margin-bottom: 16px;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.meta-item .el-icon {
  font-size: 14px;
}

.task-files {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.task-files .error-count {
  color: #f56c6c;
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.task-actions .el-button {
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 6px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: none;
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-badge__content) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
  font-weight: 600;
}

:deep(.el-tag) {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

:deep(.el-empty) {
  padding: 40px 20px;
}

:deep(.el-empty__description) {
  color: var(--theme-text-secondary);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .tasks-container {
    gap: 20px;
  }

  .project-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .task-card {
    min-width: 260px;
    max-width: 300px;
  }
}

@media (max-width: 1200px) {
  .tasks-container {
    gap: 20px;
  }

  .task-row {
    max-height: 400px;
  }

  .task-list {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .task-card {
    min-width: 240px;
    max-width: 280px;
  }
}

@media (max-width: 768px) {
  .project-detail-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px;
  }

  .header-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .project-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-content {
    gap: 12px;
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 20px;
  }

  .tasks-container {
    gap: 16px;
  }

  .row-header {
    padding: 16px 20px;
  }

  .row-title {
    font-size: 16px;
  }

  .task-list {
    padding: 16px;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .task-card {
    min-width: 220px;
    max-width: 260px;
  }

  .task-cards {
    gap: 12px;
  }

  .task-content {
    padding: 12px;
  }

  .task-title {
    font-size: 13px;
  }

  .meta-item {
    font-size: 11px;
  }

  .task-files {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .project-detail-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .project-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-content {
    padding: 12px;
  }

  .tasks-container {
    gap: 12px;
  }

  .row-header {
    padding: 12px 16px;
  }

  .row-title {
    font-size: 15px;
  }

  .task-list {
    padding: 12px;
  }

  .task-actions {
    flex-direction: column;
    gap: 6px;
  }

  .task-actions .el-button {
    width: 100%;
    justify-content: center;
  }
}
</style>