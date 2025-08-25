<template>
  <el-dialog
    v-model="dialogVisible"
    :title="DIALOG_CONFIG.TITLE"
    :width="DIALOG_CONFIG.WIDTH"
    :close-on-click-modal="DIALOG_CONFIG.CLOSE_ON_CLICK_MODAL"
    append-to-body
  >
    <el-table 
      :data="tableData" 
      v-loading="loading" 
      style="width: 100%"
    >
      <el-table-column 
        v-for="column in TABLE_COLUMNS"
        :key="column.prop || column.label"
        v-bind="column"
      >
        <!-- 开始时间列 -->
        <template v-if="column.prop === 'startTime'" #default="{ row }">
          <span>{{ formatStartTime(row.startTime) }}</span>
        </template>
        
        <!-- 结束时间列 -->
        <template v-else-if="column.prop === 'endTime'" #default="{ row }">
          <span>{{ formatEndTime(row.endTime) }}</span>
        </template>
        
        <!-- 任务解析状态列 -->
        <template v-else-if="column.prop === 'taskDetailStatus'" #default="{ row }">
          <span>{{ formatTaskDetailStatus(row.taskDetailStatus, row.errorReason) }}</span>
        </template>
        
        <!-- 失败原因列 -->
        <template v-else-if="column.prop === 'errorReason'" #default="{ row }">
          <span>{{ formatErrorReason(row.errorReason) }}</span>
        </template>
        
        <!-- 操作列 -->
        <template v-else-if="column.label === '操作'" #default="{ row }">
          <div class="action-buttons-container">
            <!-- 查看详情按钮：当解析失败时隐藏（errorReason不为空且taskDetailStatus为-1） -->
            <el-button 
              v-if="!(row.errorReason && row.taskDetailStatus == -1)"
              type="text" 
              size="small"
              @click="() => onViewDetail(row)"
              class="action-btn"
            >
              {{ BUTTON_LABELS.VIEW_DETAIL }}
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click="() => onDownloadFile(row)"
              class="action-btn"
            >
              {{ BUTTON_LABELS.VIEW_SOURCE_FILE }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
      :current-page="currentPage"
      :page-sizes="PAGINATION_CONFIG.PAGE_SIZES"
      :page-size="pageSize"
      :layout="PAGINATION_CONFIG.LAYOUT"
      :total="total"
      :background="PAGINATION_CONFIG.BACKGROUND"
      :style="PAGINATION_CONFIG.STYLE"
    />
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// 导入常量和工具函数
import {
  DIALOG_CONFIG,
  TABLE_COLUMNS,
  BUTTON_LABELS,
  PAGINATION_CONFIG
} from './constants.js'

import {
  formatTaskDetailStatus,
  formatStartTime,
  formatEndTime,
  formatErrorReason,
  viewDetail,
  downloadFile,
  onCurrentChange as utilOnCurrentChange,
  onSizeChange as utilOnSizeChange,
  createFetchDataFunction,
  shouldFetchData
} from './utils.js'

// Props定义
const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

console.log('OwnerMaterialTaskParsingDetailDialog setup - initial modelValue:', props.modelValue)

// Emits定义
const emit = defineEmits(['update:modelValue', 'view-detail'])

// 计算属性 - 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 响应式数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 数据设置函数
const setLoading = (value) => { loading.value = value }
const setTableData = (data) => { tableData.value = data }
const setTotal = (value) => { total.value = value }
const setCurrentPage = (page) => { currentPage.value = page }
const setPageSize = (size) => { pageSize.value = size }

// 创建获取数据函数
const fetchDetailList = createFetchDataFunction({
  taskId: computed(() => props.taskId),
  currentPage,
  pageSize,
  setLoading,
  setTableData,
  setTotal
})

// 事件处理函数
const onViewDetail = (row) => {
  // 传递 props 中的 taskId 和 row 中的信息
  viewDetail(row, props.taskId, emit)
}

const onDownloadFile = (row) => {
  downloadFile(row)
}

const onCurrentChange = (page) => {
  utilOnCurrentChange(page, setCurrentPage, fetchDetailList)
}

const onSizeChange = (size) => {
  utilOnSizeChange(size, setPageSize, setCurrentPage, fetchDetailList)
}

// 监听对话框显示和任务ID变化
watch(
  [dialogVisible, () => props.taskId],
  ([newDialogVisible, newTaskId]) => {
    console.log('OwnerMaterialTaskParsingDetailDialog - watch trigger:', {
      newDialogVisible,
      newTaskId
    })
    
    if (shouldFetchData(newDialogVisible, newTaskId)) {
      setCurrentPage(1) // 重置页码
      fetchDetailList()
    }
  },
  { immediate: true } // 确保在组件初始化时如果条件满足就立即执行
)
</script>

<style scoped>
/* OwnerMaterialTaskParsingDetailDialog 组件样式 */

/* 对话框主体样式 */
:deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

:deep(.el-dialog__close) {
  color: white !important;
  font-size: 18px;
}

:deep(.el-dialog__close:hover) {
  color: #f0f0f0 !important;
}

:deep(.el-dialog__body) {
  padding: 24px;
  background: #fafafa;
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background: #f8f9fa !important;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-table td) {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
}

:deep(.el-table tr:hover > td) {
  background: #f8f9ff !important;
}

/* 按钮样式 */
:deep(.el-button--text) {
  color: #667eea;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

:deep(.el-button--text:hover) {
  background: rgba(102, 126, 234, 0.1);
  color: #5a6fd8;
}

/* 分页器样式 */
:deep(.el-pagination) {
  margin-top: 24px;
  text-align: right;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background: white;
  color: #666;
}

:deep(.el-pagination .el-pager li.active) {
  background: #667eea;
  color: white;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #667eea;
}

/* 加载状态样式 */
:deep(.el-loading-mask) {
  border-radius: 6px;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-processing {
  background: #e3f2fd;
  color: #1976d2;
}

.status-completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-failed {
  background: #ffebee;
  color: #c62828;
}

.status-confirmed {
  background: #f3e5f5;
  color: #7b1fa2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 16px;
  }
  
  :deep(.el-table) {
    font-size: 13px;
  }
  
  :deep(.el-pagination) {
    text-align: center;
  }
}

/* 操作按钮容器样式 - 确保按钮并排展示 */
.action-buttons-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  min-width: 200px; /* 确保有足够空间容纳两个按钮 */
}

/* 操作按钮样式 */
.action-btn {
  white-space: nowrap; /* 防止按钮文字换行 */
  flex-shrink: 0; /* 防止按钮被压缩 */
  margin: 0 !important; /* 移除默认间距 */
  padding: 4px 8px;
  font-size: 12px;
  min-width: auto;
}

/* 文本按钮样式优化 */
:deep(.el-button--text) {
  padding: 4px 8px;
  min-height: auto;
  font-size: 12px;
  color: #409eff;
}

:deep(.el-button--text:hover) {
  color: #66b1ff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 专门针对操作列的样式 */
:deep(.el-table__body .el-table__row .el-table__cell:last-child) {
  min-width: 220px; /* 操作列最小宽度 */
  width: auto;
}

/* 确保操作列内容不会溢出 */
:deep(.el-table__body .el-table__row .el-table__cell:last-child .cell) {
  overflow: visible;
  text-overflow: initial;
  white-space: nowrap;
}

/* 操作按钮区域样式（保留向后兼容性） */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin-left: 0 !important;
  margin-right: 8px;
}
</style>
