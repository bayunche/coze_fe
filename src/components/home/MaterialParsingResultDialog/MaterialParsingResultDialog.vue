<template>
  <el-dialog
    v-model="dialogVisible"
    :title="DIALOG_CONFIG.TITLE"
    :width="DIALOG_CONFIG.WIDTH"
    :before-close="() => closeDialog(emit)"
    :custom-class="DIALOG_CONFIG.CUSTOM_CLASS"
    append-to-body
    top="5vh"
  >
    <el-tabs v-model="activeTab" @tab-click="() => switchTab(() => (currentPage = 1))">
      <el-tab-pane v-for="tab in TAB_CONFIG" :key="tab.name" :label="tab.label" :name="tab.name" />
    </el-tabs>
    <div style="height: 40vh">
      <el-table :data="taskData" style="width: 100%; height: 100%" v-loading="loading">
        <el-table-column
          v-for="column in TABLE_COLUMNS"
          :key="column.prop || column.label"
          v-bind="column"
        >
          <template v-if="column.prop === 'createdTime'" #default="{ row }">
            <span>{{ formatTimestamp(row.createdTime) }}</span>
          </template>

          <template v-else-if="column.label === '状态'" #default="{ row }">
            <el-tag :type="getTaskStatus(row).type" size="small">
              {{ getTaskStatus(row).text }}
            </el-tag>
          </template>

          <template v-else-if="column.label === '进度'" #default="{ row }">
            <div style="display: flex; align-items: center">
              <el-progress
                :percentage="calculateProgress(row.fileCount, row.fileDoneCount)"
                :stroke-width="8"
                style="flex-grow: 1; margin-right: 10px"
              />
              <span style="font-size: 12px; color: var(--theme-text-secondary)">
                {{ row.fileDoneCount || 0 }} / {{ row.fileCount || 0 }}
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
    </div>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import OwnerMaterialTaskParsingDetailDialog from '@/components/home/OwnerMaterialTaskParsingDetailDialog'
import SmartBrainService from '@/services/SmartBrainService'
import { useWorkflowStore } from '@/stores/workflow'

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
  viewTaskDetails,
  closeDialog,
  navigateToDetail
} from './utils.js'

// Props定义
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  agentId: {
    type: String,
    required: true
  }
})

// Emits定义
const emit = defineEmits(['update:show'])

// Store
const workflowStore = useWorkflowStore()

// 路由
const router = useRouter()

// 响应式数据
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE)
const showOwnerMaterialTaskParsingDetailDialog = ref(false)
const currentTaskIdForDetail = ref(null)
const loading = ref(false)
const taskData = ref([])
const total = ref(0)

// 计算属性 - 主对话框可见性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 获取任务状态过滤条件
const getStatusFilter = () => {
  switch (activeTab.value) {
    case 'inProgress':
      return [0, 1] // 排队中、处理中
    case 'completed':
      return [2, 3] // 处理完成、已确认
    default:
      return null // 全部
  }
}

// 获取任务列表
const fetchTasks = async () => {
  const domain = workflowStore.getBusinessDomain(props.agentId)
  if (!domain) return

  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      sort: 'created_time,desc'
    }

    const statusFilter = getStatusFilter()
    if (statusFilter) {
      params.taskStatus = statusFilter.join(',')
    }

    const result = await SmartBrainService.getAgentTasksList(domain, params)
    taskData.value = result.content || []
    total.value = result.totalElements || 0
  } catch (error) {
    console.error('获取任务列表失败:', error)
    taskData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示状态，显示时加载数据
watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      currentPage.value = 1
      fetchTasks()
    }
  },
  { immediate: true }
)

// 监听标签切换
watch(activeTab, () => {
  currentPage.value = 1
  fetchTasks()
})

// 监听页码变化
watch(currentPage, () => {
  fetchTasks()
})

// 业务方法
const setCurrentTaskId = (taskId) => {
  currentTaskIdForDetail.value = taskId
}

const setOwnerDialogVisible = (visible) => {
  showOwnerMaterialTaskParsingDetailDialog.value = visible
}

const switchTab = () => {
  // 标签切换逻辑已在watch中处理
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
  height: 40vh;
  overflow-y: auto;
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
