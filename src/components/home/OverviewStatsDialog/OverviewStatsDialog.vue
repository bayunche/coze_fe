<template>
  <el-dialog
    v-model="dialogVisible"
    :title="currentDialogConfig.title"
    :width="DIALOG_CONFIG.WIDTH"
    :custom-class="DIALOG_CONFIG.CUSTOM_CLASS"
    :before-close="handleClose"
  >
    <!-- 顶部操作栏 -->
    <div class="dialog-header-actions">
      <div class="header-info">
        <el-tag :type="getDialogTagType(dialogType)" size="large">
          {{ currentDialogConfig.title }}
        </el-tag>
        <span class="task-count">共 {{ tableData.length }} 项</span>
      </div>
      <div class="header-actions">
        <!-- 搜索框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索任务名称、智能体、描述..."
          prefix-icon="Search"
          clearable
          style="width: 280px; margin-right: 12px"
        />
        <!-- 导出按钮 -->
        <el-button
          type="primary"
          icon="Download"
          @click="handleExport"
          :disabled="filteredTableData.length === 0"
        >
          导出数据
        </el-button>
        <!-- 刷新按钮 -->
        <el-button
          icon="Refresh"
          @click="handleRefresh"
          style="margin-left: 8px"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      :data="filteredTableData"
      stripe
      border
      style="width: 100%; margin-top: 16px"
      :empty-text="currentDialogConfig.emptyText"
      max-height="500"
    >
      <!-- 动态渲染表格列 -->
      <el-table-column
        v-for="column in currentDialogConfig.columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align || 'left'"
        :show-overflow-tooltip="column.showOverflowTooltip"
      >
        <template #default="{ row }">
          <!-- 状态列特殊处理 -->
          <el-tag
            v-if="column.prop === 'status'"
            :type="getTaskStatusType(row.status)"
            size="small"
          >
            {{ getTaskStatusText(row.status) }}
          </el-tag>
          
          <!-- 进度列特殊处理 -->
          <div
            v-else-if="column.prop === 'progress'"
            class="progress-container"
          >
            <el-progress
              :percentage="row.progress || 0"
              :stroke-width="12"
              :color="getProgressColor(row.progress || 0)"
              :format="(percentage) => `${percentage}%`"
            />
          </div>
          
          <!-- 时间列特殊处理 -->
          <span
            v-else-if="column.prop === 'createTime' || column.prop === 'finishTime'"
          >
            {{ formatTime(row[column.prop]) }}
          </span>
          
          <!-- 错误信息列特殊处理 -->
          <div
            v-else-if="column.prop === 'errorMessage'"
            class="error-message"
          >
            <el-tooltip
              :content="row.errorMessage"
              placement="top"
              :disabled="!row.errorMessage || row.errorMessage.length <= 50"
            >
              <span class="error-text">
                {{ processErrorMessage(row.errorMessage, 50) }}
              </span>
            </el-tooltip>
          </div>
          
          <!-- 普通文本列 -->
          <span v-else>{{ row[column.prop] || '-' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部操作栏 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <!-- TODO: 后续可以添加统计信息，如成功率、平均耗时等 -->
          <span class="info-text">
            显示 {{ filteredTableData.length }} 项，共 {{ tableData.length }} 项
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">关闭</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  DIALOG_CONFIG,
  DIALOG_TYPE_CONFIG
} from './constants.js'
import {
  getTaskStatusType,
  getTaskStatusText,
  formatTime,
  getProgressColor,
  exportToCSV,
  filterTableData,
  processErrorMessage
} from './utils.js'

// Props 定义
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  dialogType: {
    type: String,
    required: true,
    validator: (value) => ['total', 'completed', 'inProgress', 'failed'].includes(value)
  },
  data: {
    type: Array,
    default: () => []
  }
})

// Emits 定义
const emit = defineEmits(['update:show', 'refresh'])

// 响应式数据
const searchKeyword = ref('')

// 计算属性 - 对话框可见性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 计算属性 - 当前对话框配置
const currentDialogConfig = computed(() => {
  return DIALOG_TYPE_CONFIG[props.dialogType] || DIALOG_TYPE_CONFIG.total
})

// 计算属性 - 表格数据
const tableData = computed(() => {
  return Array.isArray(props.data) ? props.data : []
})

// 计算属性 - 过滤后的表格数据
const filteredTableData = computed(() => {
  return filterTableData(tableData.value, searchKeyword.value)
})

// 监听对话框显示状态，重置搜索关键词
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      searchKeyword.value = ''
    }
  }
)

// 事件处理函数

/**
 * 获取对话框标签类型
 * @param {string} type - 对话框类型
 * @returns {string} 标签类型
 */
const getDialogTagType = (type) => {
  const typeMap = {
    total: 'info',
    completed: 'success',
    inProgress: 'warning',
    failed: 'danger'
  }
  return typeMap[type] || 'info'
}

/**
 * 处理对话框关闭
 */
const handleClose = () => {
  dialogVisible.value = false
}

/**
 * 处理数据导出
 */
const handleExport = () => {
  try {
    const filename = `${props.dialogType}_tasks`
    exportToCSV(
      filteredTableData.value,
      currentDialogConfig.value.columns,
      filename
    )
    
    // TODO: 后续可以添加导出成功的提示
    console.log('数据导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    // TODO: 后续可以添加错误提示
  }
}

/**
 * 处理数据刷新
 */
const handleRefresh = () => {
  // TODO: 后续需要调用真实的 API 刷新数据
  emit('refresh', props.dialogType)
  console.log(`刷新${props.dialogType}类型的数据`)
}

</script>

<style scoped>
/* 对话框整体样式 */
:deep(.overview-stats-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
  border-radius: 12px;
}

:deep(.overview-stats-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
  border-radius: 12px 12px 0 0;
  padding: 20px 30px 16px;
}

:deep(.overview-stats-dialog .el-dialog__body) {
  padding: 0 30px 20px;
  background-color: var(--theme-bg-secondary);
}

:deep(.overview-stats-dialog .el-dialog__footer) {
  background: var(--theme-dialog-header-bg);
  border-top: 1px solid var(--theme-border-secondary);
  border-radius: 0 0 12px 12px;
  padding: 16px 30px;
}

/* 顶部操作栏样式 */
.dialog-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-top: 20px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-count {
  font-size: 14px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

/* 进度条容器样式 */
.progress-container {
  padding: 4px 0;
}

/* 错误信息样式 */
.error-message {
  max-width: 200px;
}

.error-text {
  color: var(--theme-danger);
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

/* 底部操作栏样式 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info .info-text {
  font-size: 13px;
  color: var(--theme-text-secondary);
}

.footer-actions {
  display: flex;
  gap: 12px;
}

/* 表格样式优化 */
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
  font-weight: 600;
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

/* 搜索框样式 */
:deep(.el-input__wrapper) {
  background: var(--theme-input-bg);
  border-color: var(--theme-input-border);
}

:deep(.el-input__inner) {
  color: var(--theme-text-primary);
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

/* 进度条样式优化 */
:deep(.el-progress-bar__outer) {
  border-radius: 6px;
  background: var(--theme-bg-tertiary);
}

:deep(.el-progress-bar__inner) {
  border-radius: 6px;
}

:deep(.el-progress__text) {
  font-size: 12px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  :deep(.overview-stats-dialog) {
    width: 95% !important;
  }
  
  .dialog-header-actions {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  :deep(.overview-stats-dialog .el-dialog__body) {
    padding: 0 20px 20px;
  }
  
  :deep(.overview-stats-dialog .el-dialog__header) {
    padding: 16px 20px 12px;
  }
  
  :deep(.overview-stats-dialog .el-dialog__footer) {
    padding: 12px 20px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 12px;
  }
}

/* 动画效果 */
:deep(.el-dialog) {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 可访问性增强 */
:deep(.el-button:focus) {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
}

/* 加载状态样式 */
:deep(.el-table.is-loading) {
  opacity: 0.7;
}

/* 空状态样式 */
:deep(.el-table__empty-block) {
  background: var(--theme-bg-secondary);
}

:deep(.el-table__empty-text) {
  color: var(--theme-text-secondary);
}
</style>