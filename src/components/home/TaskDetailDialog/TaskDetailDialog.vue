<template>
  <el-dialog
    title="合同解析任务详情列表"
    v-model="dialogVisible"
    width="60%"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <!-- 序号 -->
      <el-table-column type="index" prop="" label="序号" width="60"></el-table-column>

      <el-table-column prop="fileName" label="文件名称"></el-table-column>
      <el-table-column prop="startTime" label="开始时间">
        <template #default="{ row }">
          {{ row.startTime ? new Date(row.startTime).toLocaleString() : '未开始' }}
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间">
        <template #default="{ row }">
          {{ row.endTime ? new Date(row.endTime).toLocaleString() : '未结束' }}
        </template>
      </el-table-column>
      <el-table-column prop="taskDetailStatus" label="任务解析状态">
        <template #default="{ row }">
          {{ formatTaskDetailStatus(row.taskDetailStatus, row.errorReason) }}
        </template>
      </el-table-column>
      <el-table-column prop="errorReason" label="失败原因">
        <template #default="{ row }">
          {{ row.errorReason || '无' }}
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="handleViewDetail(row)">查看详情</el-button>
          <el-button type="text" @click="downloadFile(row)">查看源文件</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      background
      style="margin-top: 20px; text-align: right"
    >
    </el-pagination>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import smartBrainService from '@/services/SmartBrainService.js'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'view-detail'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 数据状态
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

/**
 * 格式化任务详情状态
 * @param {number} status - 状态码
 * @param {string} errorReason - 错误原因
 * @returns {string} 格式化后的状态文本
 */
const formatTaskDetailStatus = (status, errorReason) => {
  // 当 errorReason 不为空且 taskDetailStatus 为 -1 时，标记为解析失败
  if (errorReason && Number(status) === -1) {
    return '解析失败'
  }

  return TASK_DETAIL_STATUS_MAP[status] || DEFAULT_VALUES.UNKNOWN_STATUS_TEXT
}

/**
 * 获取任务详情列表数据
 */
const fetchDetailList = async () => {
  if (!props.task?.id && !props.task?.ID) return

  loading.value = true
  try {
    // 调用后端接口获取任务详情列表，页码从0开始
    const params = {
      page: currentPage.value - 1, // 前端页码从1开始，后端从0开始
      size: pageSize.value
    }

    const taskId = props.task.id || props.task.ID
    const result = await smartBrainService.getTaskDetailsList(taskId, params)

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
 * 处理查看详情按钮点击
 * @param {Object} row - 表格行数据
 */
const handleViewDetail = (row) => {
  console.log('【调试】合同解析任务详情查看 - row对象:', row)

  // 发出事件让父组件处理详情显示
  emit('view-detail', {
    taskId: props.task.id || props.task.ID,
    detailId: row.id || row.taskDetailId || row.detailId,
    row: row
  })
}

/**
 * 处理查看源文件按钮点击
 * @param {Object} row - 表格行数据
 */
const downloadFile = (row) => {
  console.log('【调试】下载文件 - row对象:', row)

  import('@/utils/fileDownload.js')
    .then(({ downloadSourceFile }) => {
      downloadSourceFile(row)
    })
    .catch((error) => {
      console.error('导入文件下载工具失败:', error)
      ElMessage.error('下载功能加载失败')
    })
}

/**
 * 处理分页大小改变
 * @param {number} val - 新的分页大小
 */
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
  fetchDetailList()
}

/**
 * 处理当前页改变
 * @param {number} val - 新的当前页
 */
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDetailList()
}

// 监听 task 变化，重新获取数据
watch(
  () => props.task,
  (newTask) => {
    if (newTask && (newTask.id || newTask.ID)) {
      currentPage.value = 1 // 重置到第一页
      fetchDetailList()
    } else {
      tableData.value = []
      total.value = 0
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
/* 基础样式保持简洁 */
</style>
