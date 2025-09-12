<template>
  <div class="page-container">
    <div class="owner-material-tasks-page">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item 
                v-for="item in breadcrumbItems" 
                :key="item.text"
                :to="item.to"
              >
                {{ item.text }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <h1 class="page-title">{{ PAGE_CONFIG.TITLE }}</h1>
        </div>
        <div class="header-right">
          <el-button @click="refreshData" :loading="loading" size="default">
            {{ BUTTON_LABELS.REFRESH }}
          </el-button>
          <el-button @click="goBackToSmartBrain(router)" size="default">
            {{ BUTTON_LABELS.BACK }}
          </el-button>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="tabs-section">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane 
            v-for="tab in TAB_CONFIG" 
            :key="tab.name" 
            :label="tab.label" 
            :name="tab.name" 
          />
        </el-tabs>
      </div>

      <!-- 卡片列表区域 -->
      <div class="cards-section" v-loading="loading">
        <div v-if="taskData.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">🏠</div>
          <div class="empty-text">暂无甲供物资解析任务数据</div>
        </div>
        
        <div v-else class="cards-grid">
          <el-card 
            v-for="item in taskData" 
            :key="item.id" 
            class="task-card"
            shadow="hover"
            @click="handleViewDetails(item, router)"
          >
            <!-- 卡片头部 -->
            <template #header>
              <div class="card-header">
                <div class="task-info">
                  <h3 class="task-title">{{ item.taskName || '甲供物资解析任务' }}</h3>
                  <div class="task-meta">
                    <span class="task-id">ID: {{ item.id }}</span>
                  </div>
                </div>
                <div class="task-status">
                  <el-tag :type="getTaskStatus(item).type" size="large">
                    {{ getTaskStatus(item).text }}
                  </el-tag>
                </div>
              </div>
            </template>
            
            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="content-row">
                <div class="content-item">
                  <span class="label">创建时间:</span>
                  <span class="value">{{ formatTimestamp(item.createdTime) }}</span>
                </div>
                <div class="content-item">
                  <span class="label">文件数量:</span>
                  <span class="value">{{ item.fileCount || 0 }} 个</span>
                </div>
              </div>
              
              <div class="content-row">
                <div class="content-item full-width">
                  <span class="label">处理进度:</span>
                  <div class="progress-container">
                    <el-progress
                      :percentage="calculateProgress(item.fileCount, item.fileDoneCount)"
                      :stroke-width="8"
                      class="progress-bar"
                    />
                    <span class="progress-text">
                      {{ item.fileDoneCount || 0 }} / {{ item.fileCount || 0 }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="content-row">
                <div class="content-item full-width">
                  <span class="label">任务描述:</span>
                  <span class="value description">{{ item.description || '无描述信息' }}</span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="card-actions">
                <el-button 
                  type="primary"
                  size="small"
                  @click.stop="handleViewDetails(item, router)"
                >
                  {{ BUTTON_LABELS.VIEW_DETAILS }}
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 分页组件 -->
      <div class="pagination-section">
        <el-pagination
          v-if="total > 0"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :page-sizes="PAGINATION_CONFIG.PAGE_SIZES"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          @size-change="fetchTasks"
          @current-change="fetchTasks"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SmartBrainService from '@/services/SmartBrainService'

// 导入常量和工具函数
import {
  PAGE_CONFIG,
  TAB_CONFIG,
  TABLE_COLUMNS,
  BUTTON_LABELS,
  PAGINATION_CONFIG
} from './constants.js'

import {
  formatTimestamp,
  getTaskStatus,
  calculateProgress,
  handleViewDetails,
  getStatusFilter,
  goBackToSmartBrain,
  createBreadcrumbItems
} from './utils.js'

// 路由
const router = useRouter()

// 响应式数据
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
const loading = ref(false)
const taskData = ref([])
const total = ref(0)

// 计算属性
const breadcrumbItems = computed(() => createBreadcrumbItems())

/**
 * 获取任务列表数据
 */
const fetchTasks = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1, // 前端页码从1开始，后端从0开始
      size: pageSize.value
    }

    const statusFilter = getStatusFilter(activeTab.value)
    if (statusFilter) {
      params.statusList = statusFilter.join(',')
    }

    const result = await SmartBrainService.getAgentTasksList(PAGE_CONFIG.AGENT_LABELS, params)

    if (result && result.content && Array.isArray(result.content)) {
      taskData.value = result.content
      total.value = result.totalElements || 0
    } else {
      taskData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取甲供物资解析任务列表失败:', error)
    ElMessage.error('获取任务列表失败: ' + (error.message || '未知错误'))
    taskData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 处理标签页切换
 */
const handleTabClick = () => {
  currentPage.value = 1
  fetchTasks()
}

/**
 * 刷新数据
 */
const refreshData = () => {
  fetchTasks()
}

// 页面初始化
onMounted(() => {
  fetchTasks()
})

// 监听路由参数变化
watch(() => router.currentRoute.value, () => {
  // 可在此处处理路由参数变化
}, { deep: true })
</script>

<style scoped>
.owner-material-tasks-page {
  padding: 24px;
  background: var(--theme-bg-primary);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breadcrumb {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.tabs-section {
  margin-bottom: 24px;
}

.cards-section {
  margin-bottom: 24px;
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--theme-text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.task-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.task-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.task-id {
  padding: 2px 6px;
  background: var(--theme-bg-tertiary);
  border-radius: 4px;
  font-family: monospace;
}

.task-status {
  flex-shrink: 0;
}

.card-content {
  padding: 0;
}

.content-row {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}

.content-row:last-of-type {
  margin-bottom: 16px;
}

.content-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.content-item.full-width {
  flex: none;
  width: 100%;
}

.label {
  font-size: 12px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: var(--theme-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value.description {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.progress-bar {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: var(--theme-text-secondary);
  white-space: nowrap;
  min-width: 50px;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border-secondary);
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

/* 主题适配样式 */
:deep(.el-tabs__item) {
  color: var(--theme-text-secondary);
}

:deep(.el-tabs__item.is-active) {
  color: var(--theme-primary);
}

:deep(.el-tabs__active-bar) {
  background-color: var(--theme-primary);
}

:deep(.el-table) {
  background-color: var(--theme-card-bg);
  color: var(--theme-text-primary);
}

:deep(.el-table th) {
  background-color: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border-color: var(--theme-border-primary);
}

:deep(.el-table td) {
  border-color: var(--theme-border-primary);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: var(--theme-bg-tertiary);
}

:deep(.el-pagination) {
  --el-pagination-bg-color: var(--theme-card-bg);
  --el-pagination-text-color: var(--theme-text-primary);
  --el-pagination-border-color: var(--theme-border-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .owner-material-tasks-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .task-card {
    margin-bottom: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .content-row {
    flex-direction: column;
    gap: 12px;
  }

  .card-actions {
    justify-content: center;
  }
}
</style>