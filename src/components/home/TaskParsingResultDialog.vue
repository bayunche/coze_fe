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
            <span style="font-size: 12px; color: #909399">
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
.task-parsing-result-dialog .el-dialog__body {
  padding: 20px 30px;
}
</style>
