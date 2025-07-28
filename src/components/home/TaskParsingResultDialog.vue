<template>
  <el-dialog
    v-model="dialogVisible"
    title="智能体任务列表"
    width="60%"
    :before-close="handleClose"
    custom-class="task-parsing-result-dialog"
  >
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="全部" name="all"></el-tab-pane>
      <el-tab-pane label="已完成" name="completed"></el-tab-pane>
      <el-tab-pane label="进行中" name="inProgress"></el-tab-pane>
    </el-tabs>
    <el-table :data="paginatedData" style="width: 100%" v-loading="loading">
      <el-table-column prop="ID" label="任务编号" width="180"></el-table-column>
      <el-table-column prop="CREATED_TIME" label="任务创建时间" width="200">
        <template #default="scope">
          <span>{{ formatTimestamp(scope.row.CREATED_TIME) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getTaskStatus(scope.row).type" size="small">
            {{ getTaskStatus(scope.row).text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度" min-width="200">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <el-progress
              :percentage="calculateProgress(scope.row.file_count, scope.row.file_done_count)"
              :stroke-width="8"
              style="flex-grow: 1; margin-right: 10px"
            />
            <span style="font-size: 12px; color: var(--theme-text-secondary)">
              {{ scope.row.file_done_count || 0 }} /
              {{ scope.row.file_count || 0 }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="file_error_count" label="失败数" width="100"></el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="viewTaskDetails(scope.row)"
            >查看详情</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="filteredTasks.length > pageSize"
      background
      layout="prev, pager, next"
      :total="filteredTasks.length"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      style="margin-top: 20px; text-align: right"
    >
    </el-pagination>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
  <TaskDetailDialog v-if="selectedTask" v-model:show="showTaskDetailDialog" :task="selectedTask" />
</template>

<script setup>
import { ref, computed } from 'vue'
import TaskDetailDialog from './TaskDetailDialog.vue'

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

const emit = defineEmits(['update:show'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const activeTab = ref('all')
const showTaskDetailDialog = ref(false)
const selectedTask = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

const filteredTasks = computed(() => {
  return props.tasks[activeTab.value] || []
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  console.log(filteredTasks.value)
  return filteredTasks.value.slice(start, end)
})

const handleTabClick = () => {
  currentPage.value = 1
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const cleanTimestamp = timestamp.split(' +')[0]
  const date = new Date(cleanTimestamp)
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  const hours = ('0' + date.getHours()).slice(-2)
  const minutes = ('0' + date.getMinutes()).slice(-2)
  const seconds = ('0' + date.getSeconds()).slice(-2)
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getTaskStatus = (task) => {
  const total = parseInt(task.file_count, 10) || 0
  const processed = parseInt(task.file_done_count, 10) || 0
  const failed = parseInt(task.file_error_count, 10) || 0

  if (processed < total) {
    return { text: '进行中', type: 'primary' }
  }
  if (processed === total) {
    if (failed > 0) {
      return { text: '部分失败', type: 'warning' }
    }
    return { text: '已完成', type: 'success' }
  }
  return { text: '未知', type: 'info' }
}

const calculateProgress = (total, processed) => {
  const totalNum = parseInt(total, 10) || 0
  const processedNum = parseInt(processed, 10) || 0
  if (totalNum === 0) {
    return 0
  }
  return Math.round((processedNum / totalNum) * 100)
}

const viewTaskDetails = (task) => {
  selectedTask.value = task
  showTaskDetailDialog.value = true
}

const handleClose = () => {
  dialogVisible.value = false
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
