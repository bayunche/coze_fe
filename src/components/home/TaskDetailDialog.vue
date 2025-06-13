<template>
  <el-dialog
    v-model="dialogVisible"
    title="任务解析详情"
    width="80%"
    :before-close="handleClose"
    custom-class="result-detail-dialog"
  >
    <div v-loading="isFetchingDetails" class="result-detail-content">
      <el-table
        v-if="tableData.length > 0"
        :data="tableData"
        style="width: 100%"
        class="result-table"
        max-height="60vh"
      >
        <template v-for="column in tableColumns" :key="column.prop">
          <el-table-column :prop="column.prop" :label="column.label" />
        </template>
      </el-table>
      <el-empty v-else-if="!isFetchingDetails" description="没有可展示的表格数据" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEditResult" :disabled="isEditDisabled">编辑</el-button>
        <el-button type="success" @click="handleConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import CozeService from '@/uitls/coze.js'

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

const emit = defineEmits(['update:show'])

const cozeService = new CozeService(
  'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
)

const isFetchingDetails = ref(false)
const tableData = ref([])
const tableColumns = ref([])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const isEditDisabled = computed(() => {
  return props.task?.confirm_status === true
})

const fetchTaskDetails = async (taskId) => {
  if (!taskId) return

  isFetchingDetails.value = true
  tableData.value = []
  tableColumns.value = []

  try {
    const result = await cozeService.runTableGenerationWorkflow(taskId)
    if (result && result.data) {
      const jsonString = result.data.replace(/("id":\s*)(\d{16,})/g, '$1"$2"')
      const parsedData = JSON.parse(jsonString)?.output

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableColumns.value = Object.keys(parsedData[0]).map((key) => ({
          prop: key,
          label: key // You might want a translation mapping here later
        }))
        tableData.value = parsedData
      } else {
        throw new Error('解析后的数据格式不正确或为空。')
      }
    } else {
      throw new Error('任务未返回有效的表格数据。')
    }
  } catch (error) {
    console.error('获取任务详情失败:', error)
    ElMessage.error(`获取任务详情失败: ${error.message}`)
  } finally {
    isFetchingDetails.value = false
  }
}

watch(
  () => props.task,
  (newTask) => {
    console.log('Task changed:', newTask)
    // We only act when we get a new, valid task object
    if (newTask && newTask.task_number) {
      fetchTaskDetails(newTask.task_number)
    } else {
      // If the task is cleared, we clear the data
      tableData.value = []
      tableColumns.value = []
    }
  },
  // deep: true might be useful if task properties change without the object itself changing
  // immediate: true ensures it runs on component creation
  { immediate: true, deep: true }
)

const handleClose = () => {
  dialogVisible.value = false
}

const handleEditResult = () => {
  ElMessage.info('编辑功能待实现。')
}

const handleConfirm = () => {
  ElMessage.info('确认功能待实现。')
}
</script>

<style scoped>
.result-detail-dialog .el-dialog__body {
  padding: 20px;
}
.result-table {
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
</style>