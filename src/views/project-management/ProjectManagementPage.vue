<template>
  <div class="project-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          type="text"
          class="back-btn"
        >
          返回智能大脑
        </el-button>
        <div class="title-section">
          <h1 class="page-title">项目管理</h1>
          <p class="page-subtitle">管理所有项目及其任务</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="refreshData" :icon="Refresh" type="default" :loading="loading">
          刷新数据
        </el-button>
        <el-button @click="exportData" :icon="Download" type="primary">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片区 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total-projects">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalProjects }}</div>
            <div class="stat-label">总项目数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon active-projects">🟢</div>
          <div class="stat-info">
            <div class="stat-value">{{ activeProjectsCount }}</div>
            <div class="stat-label">进行中项目</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon completed-projects">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ completedProjectsCount }}</div>
            <div class="stat-label">已完成项目</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon total-tasks">🎯</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalTasksCount }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索项目名称、项目编号..."
          clearable
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="statusFilter"
          placeholder="选择项目状态"
          clearable
          style="width: 200px; margin-left: 16px"
          @change="handleStatusFilter"
        >
          <el-option label="进行中" value="ACTIVE" />
          <el-option label="已完成" value="COMPLETED" />
          <el-option label="已暂停" value="PAUSED" />
          <el-option label="失败" value="FAILED" />
        </el-select>
      </div>
      <div class="filter-right">
        <el-button @click="resetFilters" type="default">重置筛选</el-button>
      </div>
    </div>

    <!-- 项目表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="paginatedProjects"
        v-loading="loading"
        style="width: 100%"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
        stripe
        border
        @sort-change="handleSortChange"
      >
        <!-- 项目编号 -->
        <el-table-column
          prop="projectCode"
          label="项目编号"
          width="150"
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="project-code-cell">
              <strong>{{ row.projectCode }}</strong>
            </div>
          </template>
        </el-table-column>

        <!-- 项目名称 -->
        <el-table-column
          prop="projectName"
          label="项目名称"
          min-width="200"
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="project-name-cell">
              <div class="project-name">{{ row.projectName }}</div>
              <div class="project-description" v-if="row.description">
                {{ row.description }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 任务统计 -->
        <el-table-column label="任务统计" width="300" align="center">
          <template #default="{ row }">
            <div class="task-stats-cell">
              <div class="task-stat-item contract">
                <span class="stat-icon">📋</span>
                <span class="stat-text">{{ row.contractTasks }}</span>
                <span class="stat-desc">合同</span>
              </div>
              <div class="task-stat-item supplier">
                <span class="stat-icon">📦</span>
                <span class="stat-text">{{ row.supplierMaterialTasks }}</span>
                <span class="stat-desc">乙供</span>
              </div>
              <div class="task-stat-item owner">
                <span class="stat-icon">🏗️</span>
                <span class="stat-text">{{ row.ownerMaterialTasks }}</span>
                <span class="stat-desc">甲供</span>
              </div>
              <div class="task-stat-item total">
                <span class="stat-icon">🎯</span>
                <span class="stat-text">{{ row.totalTasks }}</span>
                <span class="stat-desc">总计</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 完成进度 -->
        <el-table-column label="完成进度" width="150" align="center">
          <template #default="{ row }">
            <div class="progress-cell">
              <el-progress
                :percentage="getProgressPercentage(row)"
                :color="getProgressColor(getProgressPercentage(row))"
                :stroke-width="8"
              />
              <div class="progress-text">
                {{ row.completedTasks }}/{{ row.totalTasks }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 项目状态 -->
        <el-table-column prop="status" label="项目状态" width="120" align="center" sortable="custom">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="180"
          sortable="custom"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="viewProjectDetail(row)"
              >
                查看详情
              </el-button>
              <el-dropdown @command="handleAction" trigger="click">
                <el-button type="default" size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'export', row }">
                      导出项目数据
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'tasks', row }">
                      查看任务列表
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'statistics', row }">
                      查看统计报表
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页器 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredProjects.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  Download,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'

// 导入常量和工具函数
import {
  PROJECT_STATUS_OPTIONS,
  SORT_OPTIONS,
  DEFAULT_PAGINATION,
  PROJECT_STATUS_MAP
} from './constants.js'
import {
  formatDateTime,
  formatProjectStatus,
  exportProjectsToCSV,
  downloadCSV
} from './utils.js'

const router = useRouter()
const projectStore = useProjectStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')
const sortField = ref('createTime')
const sortOrder = ref('desc')

// 分页数据
const pagination = ref({
  currentPage: 1,
  pageSize: 20
})

// 计算属性
const projects = computed(() => projectStore.projects)
const totalProjects = computed(() => projects.value.length)

const activeProjectsCount = computed(() =>
  projects.value.filter(p => p.status === 'ACTIVE' || p.status === 'RUNNING').length
)

const completedProjectsCount = computed(() =>
  projects.value.filter(p => p.status === 'COMPLETED').length
)

const totalTasksCount = computed(() =>
  projects.value.reduce((total, project) => total + project.totalTasks, 0)
)

// 筛选后的项目
const filteredProjects = computed(() => {
  let result = [...projects.value]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(project =>
      project.projectName?.toLowerCase().includes(keyword) ||
      project.projectCode?.toLowerCase().includes(keyword) ||
      project.description?.toLowerCase().includes(keyword)
    )
  }

  // 状态筛选
  if (statusFilter.value) {
    result = result.filter(project => project.status === statusFilter.value)
  }

  // 排序
  result.sort((a, b) => {
    const aVal = a[sortField.value]
    const bVal = b[sortField.value]

    if (sortOrder.value === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
    } else {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    }
  })

  return result
})

// 分页后的项目
const paginatedProjects = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredProjects.value.slice(start, end)
})

// 方法
const refreshData = async () => {
  try {
    loading.value = true
    await projectStore.fetchProjects({}, true)
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.currentPage = 1
}

const handleStatusFilter = () => {
  pagination.value.currentPage = 1
}

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  pagination.value.currentPage = 1
}

const handleSortChange = ({ prop, order }) => {
  sortField.value = prop
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

const handlePageChange = (page) => {
  pagination.value.currentPage = page
}

const getProgressPercentage = (project) => {
  if (project.totalTasks === 0) return 0
  return Math.round((project.completedTasks / project.totalTasks) * 100)
}

const getStatusType = (status) => {
  const statusInfo = formatProjectStatus(status)
  return statusInfo.type
}

const getStatusText = (status) => {
  const statusInfo = formatProjectStatus(status)
  return statusInfo.label
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  if (percentage >= 40) return '#f56c6c'
  return '#909399'
}

const viewProjectDetail = (project) => {
  console.log('查看项目详情:', project)
  // 跳转到项目详情页
  router.push(`/project-detail/${project.projectId || project.projectCode}`)
}

const handleAction = ({ action, row }) => {
  switch (action) {
    case 'view':
      viewProjectDetail(row)
      break
    case 'export':
      const csvContent = exportProjectsToCSV([row])
      downloadCSV(csvContent, `${row.projectName}-数据.csv`)
      ElMessage.success('导出成功')
      break
    default:
      console.warn('未知操作:', action)
  }
}

const exportData = async () => {
  try {
    const csvContent = exportProjectsToCSV(filteredProjects.value)
    downloadCSV(csvContent, 'projects.csv')
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const goBack = () => {
  router.push('/smart-brain')
}

// 生命周期
onMounted(async () => {
  if (projects.value.length === 0) {
    await refreshData()
  }
})
</script>

<style scoped>
.project-management-page {
  padding: 24px;
  background-color: var(--theme-bg-page);
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: var(--theme-card-bg);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  color: var(--theme-text-secondary);
  padding: 8px;
}

.back-btn:hover {
  color: var(--theme-primary-color);
  background-color: var(--theme-bg-hover);
}

.title-section {
  min-width: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.stat-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.total-projects {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
}

.active-projects {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
}

.completed-projects {
  background: linear-gradient(135deg, rgba(144, 147, 153, 0.1) 0%, rgba(144, 147, 153, 0.05) 100%);
}

.total-tasks {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.05) 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 表格卡片 */
.table-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
}

/* 表格单元格样式 */
.project-code-cell {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.project-name-cell {
  max-width: 200px;
}

.project-name {
  font-weight: 600;
  color: var(--theme-text-primary);
  margin-bottom: 4px;
}

.project-description {
  font-size: 12px;
  color: var(--theme-text-secondary);
  line-height: 1.4;
}

.task-stats-cell {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 12px;
}

.task-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.task-stat-item .stat-icon {
  font-size: 16px;
}

.task-stat-item .stat-text {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.task-stat-item .stat-desc {
  font-size: 11px;
  color: var(--theme-text-secondary);
}

.progress-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 分页器 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid var(--theme-border-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-management-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filter-section {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .filter-left {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .task-stats-cell {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>