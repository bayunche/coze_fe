<template>
  <div class="page-container">
    <div class="contract-task-detail-page">
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
          <el-button @click="goBackToTaskList(router)" size="default">
            {{ BUTTON_LABELS.BACK }}
          </el-button>
        </div>
      </div>

      <!-- 卡片列表区域 -->
      <div class="cards-section" v-loading="loading">
        <div v-if="tableData.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">📄</div>
          <div class="empty-text">暂无任务详情数据</div>
        </div>
        
        <div v-else class="cards-grid">
          <el-card 
            v-for="item in tableData" 
            :key="item.id || item.fileName" 
            class="detail-card"
            shadow="hover"
          >
            <!-- 卡片头部 -->
            <template #header>
              <div class="card-header">
                <div class="file-info">
                  <h3 class="file-title">{{ item.fileName || '未知文件' }}</h3>
                  <div class="file-meta">
                    <span class="file-size" v-if="item.fileSize">大小: {{ item.fileSize }}</span>
                  </div>
                </div>
                <div class="task-status">
                  <el-tag 
                    :type="getTaskStatusType(item.taskDetailStatus, item.errorReason)" 
                    size="large"
                  >
                    {{ formatTaskDetailStatus(item.taskDetailStatus, item.errorReason) }}
                  </el-tag>
                </div>
              </div>
            </template>
            
            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="content-row">
                <div class="content-item">
                  <span class="label">开始时间:</span>
                  <span class="value">{{ formatTime(item.startTime) }}</span>
                </div>
                <div class="content-item">
                  <span class="label">结束时间:</span>
                  <span class="value">{{ formatTime(item.endTime) }}</span>
                </div>
              </div>
              
              <div class="content-row" v-if="item.errorReason">
                <div class="content-item full-width error-reason">
                  <span class="label">失败原因:</span>
                  <span class="value error-text">{{ item.errorReason }}</span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="card-actions">
                <el-button 
                  type="primary"
                  size="small"
                  @click="handleViewDetail(item, taskId)"
                >
                  {{ BUTTON_LABELS.VIEW_DETAIL }}
                </el-button>
                <el-button 
                  type="default"
                  size="small"
                  @click="handleDownloadFile(item)"
                >
                  {{ BUTTON_LABELS.VIEW_SOURCE_FILE }}
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
          @size-change="fetchDetailList"
          @current-change="fetchDetailList"
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
  BUTTON_LABELS,
  PAGINATION_CONFIG
} from './constants.js'

import {
  formatTaskDetailStatus,
  formatTime,
  handleViewDetail,
  handleDownloadFile,
  goBackToTaskList,
  createBreadcrumbItems,
  getTaskStatusType
} from './utils.js'

// Props
const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  }
})

// 路由
const router = useRouter()

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 计算属性
const breadcrumbItems = computed(() => createBreadcrumbItems(props.taskId))

/**
 * 获取任务详情列表数据
 */
const fetchDetailList = async () => {
  if (!props.taskId) return

  loading.value = true
  try {
    // 调用后端接口获取任务详情列表，页码从0开始
    const params = {
      page: currentPage.value - 1, // 前端页码从1开始，后端从0开始
      size: pageSize.value
    }

    const result = await SmartBrainService.getTaskDetailsList(props.taskId, params)

    if (result && result.content && Array.isArray(result.content)) {
      tableData.value = result.content
      total.value = result.totalElements || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取合同解析任务详情列表失败:', error)
    ElMessage.error('获取合同解析任务详情列表失败: ' + (error.message || '未知错误'))
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 刷新数据
 */
const refreshData = () => {
  fetchDetailList()
}

// 监听taskId变化，重新获取数据
watch(() => props.taskId, (newTaskId) => {
  if (newTaskId) {
    currentPage.value = 1 // 重置到第一页
    fetchDetailList()
  } else {
    tableData.value = []
    total.value = 0
  }
}, { immediate: true })

// 页面初始化
onMounted(() => {
  if (props.taskId) {
    fetchDetailList()
  }
})
</script>

<style scoped>
.contract-task-detail-page {
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

.detail-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  overflow: hidden;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.file-size {
  padding: 2px 6px;
  background: var(--theme-bg-tertiary);
  border-radius: 4px;
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

.content-item.error-reason {
  background: var(--theme-bg-tertiary);
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
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

.error-text {
  color: #f56c6c;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
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
  .contract-task-detail-page {
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

  .detail-card {
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