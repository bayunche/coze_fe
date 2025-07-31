<template>
  <el-dialog
    v-model="dialogVisible"
    :title="DIALOG_CONFIG.TITLE"
    :width="DIALOG_CONFIG.WIDTH"
    :before-close="() => closeDialog(emit)"
    :custom-class="DIALOG_CONFIG.CUSTOM_CLASS"
  >
    <el-tabs v-model="activeTab" @tab-click="() => switchTab(() => (currentPage = 1))">
      <el-tab-pane v-for="tab in TAB_CONFIG" :key="tab.name" :label="tab.label" :name="tab.name" />
    </el-tabs>

    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column
        v-for="column in TABLE_COLUMNS"
        :key="column.prop || column.label"
        v-bind="column"
      >
        <template v-if="column.prop === 'CREATED_TIME'" #default="{ row }">
          <span>{{ formatTimestamp(row.CREATED_TIME) }}</span>
        </template>

        <template v-else-if="column.label === '状态'" #default="{ row }">
          <el-tag :type="getTaskStatus(row).type" size="small">
            {{ getTaskStatus(row).text }}
          </el-tag>
        </template>

        <template v-else-if="column.label === '进度'" #default="{ row }">
          <div style="display: flex; align-items: center">
            <el-progress
              :percentage="calculateProgress(row.file_count, row.file_done_count)"
              :stroke-width="8"
              style="flex-grow: 1; margin-right: 10px"
            />
            <span style="font-size: 12px; color: var(--theme-text-secondary)">
              {{ row.file_done_count || 0 }} / {{ row.file_count || 0 }}
            </span>
          </div>
        </template>

        <template v-else-if="column.label === '操作'" #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="() => viewTaskDetails(row, setCurrentTaskId, setOwnerDialogVisible)"
          >
            {{ BUTTON_LABELS.VIEW_DETAILS }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="filteredTasks.length > PAGINATION_CONFIG.DEFAULT_PAGE_SIZE"
      background
      :layout="PAGINATION_CONFIG.LAYOUT"
      :total="filteredTasks.length"
      :page-size="PAGINATION_CONFIG.DEFAULT_PAGE_SIZE"
      v-model:current-page="currentPage"
      style="margin-top: 20px; text-align: right"
    />

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="() => closeDialog(emit)">
          {{ BUTTON_LABELS.CLOSE }}
        </el-button>
      </span>
    </template>
  </el-dialog>

  <OwnerMaterialTaskParsingDetailDialog
    v-model="showOwnerMaterialTaskParsingDetailDialog"
    :taskId="currentTaskIdForDetail"
    @view-detail="(params) => navigateToDetail(params, router)"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import OwnerMaterialTaskParsingDetailDialog from '@/components/home/OwnerMaterialTaskParsingDetailDialog/OwnerMaterialTaskParsingDetailDialog.vue'

// 导入常量和工具函数
import {
  DIALOG_CONFIG,
  TAB_CONFIG,
  TABLE_COLUMNS,
  BUTTON_LABELS,
  PAGINATION_CONFIG
} from './constants.js'

import {
  formatTimestamp,
  getTaskStatus,
  calculateProgress,
  filterTasks,
  paginateData,
  switchTab,
  viewTaskDetails,
  closeDialog,
  navigateToDetail,
  getSafeTasksData
} from './utils.js'

// Props定义
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  tasks: {
    type: Object,
    required: true,
    default: () => ({ all: [], completed: [], inProgress: [] })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Emits定义
const emit = defineEmits(['update:show'])

// 路由
const router = useRouter()

// 响应式数据
const activeTab = ref('all')
const currentPage = ref(1)
const showOwnerMaterialTaskParsingDetailDialog = ref(false)
const currentTaskIdForDetail = ref(null)

// 计算属性 - 主对话框可见性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 计算属性 - 安全的任务数据
const safeTasksData = computed(() => {
  return getSafeTasksData(props.tasks)
})

// 计算属性 - 过滤后的任务
const filteredTasks = computed(() => {
  return filterTasks(safeTasksData.value, activeTab.value)
})

// 计算属性 - 分页数据
const paginatedData = computed(() => {
  return paginateData(filteredTasks.value, currentPage.value, PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
})

// 业务方法
const setCurrentTaskId = (taskId) => {
  currentTaskIdForDetail.value = taskId
}

const setOwnerDialogVisible = (visible) => {
  showOwnerMaterialTaskParsingDetailDialog.value = visible
}
</script>

<style scoped>
/* 对话框主题样式 */
:deep(.task-parsing-result-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
}

:deep(.task-parsing-result-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.task-parsing-result-dialog .el-dialog__body) {
  padding: 20px 30px;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

:deep(.task-parsing-result-dialog .el-dialog__footer) {
  background: var(--theme-dialog-header-bg);
  border-top: 1px solid var(--theme-border-secondary);
}

/* 表格样式 */
:deep(.el-table) {
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border) !important;
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

/* 标签样式 */
:deep(.el-tag) {
  background: var(--theme-tag-bg) !important;
  color: var(--theme-tag-text) !important;
  border-color: var(--theme-border-primary) !important;
}

:deep(.el-tag--success) {
  background: var(--theme-success) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--primary) {
  background: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--warning) {
  background: var(--theme-warning) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--info) {
  background: var(--theme-info) !important;
  color: var(--theme-text-inverse) !important;
}

/* 按钮样式 */
:deep(.el-button) {
  background: var(--theme-bg-tertiary);
  border-color: var(--theme-border-primary);
  color: var(--theme-text-primary);
}

:deep(.el-button--primary) {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

:deep(.el-button:hover) {
  opacity: 0.8;
}

/* 分页器样式 */
:deep(.el-pagination) {
  color: var(--theme-text-primary);
}

:deep(.el-pagination .el-pager li) {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-primary);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

:deep(.el-pagination button) {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-primary);
}

:deep(.el-pagination button:hover) {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  background: var(--theme-bg-tertiary);
  border: 1px solid var(--theme-border-primary);
}

:deep(.el-progress-bar__inner) {
  background: var(--theme-primary);
}

/* Tabs 样式 */
:deep(.el-tabs__header) {
  background: transparent;
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.el-tabs__item) {
  color: var(--theme-text-secondary);
}

:deep(.el-tabs__item.is-active) {
  color: var(--theme-primary);
}

:deep(.el-tabs__active-bar) {
  background: var(--theme-primary);
}
</style>
