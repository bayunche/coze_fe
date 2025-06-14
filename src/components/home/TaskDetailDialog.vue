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
        stripe
        class="result-table"
        max-height="60vh"
      >
        <template v-for="column in tableColumns" :key="column.prop">
          <el-table-column
            v-if="headerMapping[column.prop]"
            width="280"
            :prop="column.prop"
            :label="translateHeader(column.prop)"
          >
            <template #default="scope">
              <span>{{ formatCellValue(scope.row[column.prop]) }}</span>
            </template>
          </el-table-column>
        </template>
      </el-table>
      <el-empty v-else-if="!isFetchingDetails" description="没有可展示的表格数据" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
                  <el-button type="primary" @click="handleEditResult">编辑</el-button>
          <el-button type="success" @click="handleConfirm" :loading="isConfirming">确认</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 编辑解析结果对话框 -->
  <el-dialog
    v-model="showEditDialog"
    title="编辑解析结果"
    width="60%"
    custom-class="edit-result-dialog"
  >
    <el-form label-width="120px">
      <el-collapse v-model="activeCollapse">
        <el-collapse-item
          v-for="(formModel, index) in editFormModels"
          :key="formModel.id"
          :title="`条目 ${index + 1}: ${formModel.name || ''}`"
          :name="formModel.id"
        >
          <template v-for="key in Object.keys(formModel)" :key="key">
            <el-form-item v-if="headerMapping[key]" :label="translateHeader(key)">
              <el-input v-model="formModel[key]" />
            </el-form-item>
          </template>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="isSaving">保存</el-button>
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

// 编辑功能
const showEditDialog = ref(false)
const editFormModels = ref([]) // 表单绑定的对象数组
const activeCollapse = ref([]) // 控制折叠面板的展开
const isSaving = ref(false)
const isConfirming = ref(false)

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 表头中英文映射
const headerMapping = {
  name: '合同名称',
  number: '合同编号',
  money: '合同金额',
  pay_result: '付款依据',
  sign_time: '签订时间',
  fixed_rate: '包干率',
  anquan_rate: '安全文明施工费是否下浮',
  linshi_rate: '临时设施费是否下浮',
  position: '职位',
  salary: '薪水',
  hire_date: '入职日期',
  bstudio_id: 'ID',
  // ... 在这里可以添加更多的映射
}

const translateHeader = (prop) => {
  return headerMapping[prop] || prop
}

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '/'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return value
}

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
          label: key
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
    if (newTask && newTask.task_number) {
      fetchTaskDetails(newTask.task_number)
    } else {
      tableData.value = []
      tableColumns.value = []
    }
  },
  { immediate: true, deep: true }
)

const handleEditResult = () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有可编辑的数据。')
    return
  }
  // 深拷贝数据用于编辑，避免直接修改原始数据
  editFormModels.value = JSON.parse(JSON.stringify(tableData.value))

  // 默认展开所有折叠项
  activeCollapse.value = editFormModels.value.map((item) => item.id)

  showEditDialog.value = true
}

const cancelEdit = () => {
  showEditDialog.value = false
}

const saveEdit = async () => {
  isSaving.value = true
  try {
    const editPromises = editFormModels.value.map((item) => cozeService.runEditWorkflow(item))
    await Promise.all(editPromises)
    // 深拷贝数据以更新表格
    tableData.value = JSON.parse(JSON.stringify(editFormModels.value))
    ElMessage.success('保存成功，所有条目更新')
    showEditDialog.value = false
  } catch (error) {
    console.error('保存编辑时出错:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}

const handleConfirm = async () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有可确认的数据。')
    return
  }

  isConfirming.value = true

  try {
    const confirmPromises = tableData.value.map((item) =>
      cozeService.runConfirmWorkflow({ id: item.id })
    )

    const results = await Promise.allSettled(confirmPromises)

    let successCount = 0
    let failureCount = 0

    results.forEach((result, index) => {
      const item = tableData.value[index]
      if (result.status === 'fulfilled') {
        successCount++
      } else {
        failureCount++
        console.error(`确认失败 (ID: ${item.id}):`, result.reason)
      }
    })

    if (failureCount > 0) {
      ElMessage.warning(`${successCount} 条记录确认成功，${failureCount} 条失败。`)
    } else {
      ElMessage.success(`所有 ${successCount} 条记录均已成功确认！`)
    }
    handleClose() // 关闭对话框
  } catch (error) {
    console.error('执行确认工作流时发生意外错误:', error)
    ElMessage.error(`确认过程中发生错误: ${error.message}`)
  } finally {
    isConfirming.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
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