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
        v-if="editFormModels.length > 0"
        :data="editFormModels"
        stripe
        class="result-table"
        max-height="60vh"
      >
        <template v-for="column in tableColumns" :key="column.prop">
          <el-table-column
            v-if="headerMapping[column.prop]"
            :prop="column.prop"
            :label="translateHeader(column.prop)"
          >
            <template #default="scope">
              <span v-if="!scope.row.editing">{{
                formatCellValue(scope.row[column.prop], column.prop)
              }}</span>
              <template v-else>
                <div v-if="isLongText(scope.row[column.prop])">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="openEditPopup(scope.row, column.prop)"
                  >
                    编辑长文本
                  </el-button>
                </div>
                <el-input
                  v-else
                  v-model="scope.row[column.prop]"
                  :placeholder="`请输入${translateHeader(column.prop)}`"
                ></el-input>
              </template>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.editing">
              <el-button type="success" size="small" @click="saveRowEdit(scope.row)"
                >保存</el-button
              >
              <el-button size="small" @click="cancelRowEdit(scope.row)">取消</el-button>
            </div>
            <el-button
              v-if="!scope.row.editing && scope.row.result_status == '0'"
              type="primary"
              size="small"
              @click="startRowEdit(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!isFetchingDetails" description="没有可展示的表格数据" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleSaveAll" :loading="savingAllEdits">
          提交编辑
        </el-button>
        <!-- <el-button
          v-if="!hasResultStatusOne"
          type="success"
          @click="handleConfirm"
          :loading="isConfirming"
        >
          确认全部
        </el-button> -->
      </span>
    </template>
  </el-dialog>

  <!-- 编辑长文本的对话框 -->
  <el-dialog v-model="longTextEditVisible" :title="`编辑 ${editableField}`" width="40%">
    <el-input v-model="longTextValue" type="textarea" :rows="10" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="longTextEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLongText">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CozeService from '@/utils/coze.js'
import { useChatStore } from '@/stores/chat.js'

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

const chatStore = useChatStore()

const hasResultStatusOne = computed(() => {
  return editFormModels.value.some((item) => Number(item.result_status) === 1)
})
const cozeService = new CozeService(import.meta.env.VITE_COZE_API_KEY)

const isFetchingDetails = ref(false)
const tableData = ref([]) // 原始数据
const tableColumns = ref([])
const editFormModels = ref([]) // 用于编辑的表单数据模型

// 编辑功能
const isConfirming = ref(false)
const longTextEditVisible = ref(false)
const longTextValue = ref('')
const editableRow = ref(null)
const editableField = ref('')
const editableFieldProp = ref('')
const savingAllEdits = ref(false)

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
  id: '编号',
  task_id: '任务ID',
  status: '状态',
  created_at: '创建时间',
  updated_at: '更新时间',
  description: '描述',
  result: '结果',
  total_documents_count: '总文档数',
  processed_documents_count: '处理文档数',
  error_documents_count: '失败文档数',
  progress: '进度',
  file_count: '文件总数',
  file_done_count: '已完成文件数量',
  contract_name: '合同名称',
  contract_number: '合同编号',
  contract_amount: '合同金额',
  pay_result: '付款依据',
  signing_time: '签订时间',
  fixed_rate: '包干率',
  safety_rate: '安全文明施工费是否下浮',
  temporary_rate: '临时设施费是否下浮',
  result_status: '解析状态',
  salary: '薪水',
  hire_date: '入职日期',
  ID: 'ID',
  contract_name: '合同名称',
  contract_number: '合同编号',
  contract_amount: '合同金额',
  pay_result: '付款依据',
  signing_time: '签订时间',
  fixed_rate: '包干率',
  safety_rate: '安全文明施工费是否下浮',
  temporary_rate: '临时设施费是否下浮',
  result_status: '解析状态',
  position: '职位',
  salary: '薪水',
  hire_date: '入职日期'
}

const translateHeader = (prop) => {
  return headerMapping[prop] || prop
}

const formatCellValue = (value, prop) => {
  if (value === null || value === undefined || value === '') {
    return '/'
  }
  if (prop === 'result_status') {
    if (Number(value) === 0) return '未确认'
    if (Number(value) === 1) return '已确认'
    return value
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
        // 判断parsedData的结构是否包含result_json字段，表示表格数据多包了一层
        let tableJsonData = null
        if (parsedData[0].hasOwnProperty('result_json')) {
          // 当result_json字段是字符串形式的JSON数组时，将所有解析合并为一个大数组
          tableJsonData = []
          for (const item of parsedData) {
            if (item.result_json) {
              try {
                const parsedResult = JSON.parse(item.result_json)
                if (Array.isArray(parsedResult)) {
                  tableJsonData.push(...parsedResult)
                } else if (parsedResult && typeof parsedResult === 'object') {
                  tableJsonData.push(parsedResult)
                }
              } catch {
                // 解析失败则忽略
              }
            }
          }
        } else {
          tableJsonData = parsedData
        }

        if (Array.isArray(tableJsonData) && tableJsonData.length > 0) {
          tableColumns.value = Object.keys(tableJsonData[0]).map((key) => ({
            prop: key,
            label: key
          }))
          const rawData = tableJsonData.map((item) => ({ ...item, editing: false }))
          tableData.value = JSON.parse(JSON.stringify(rawData))
          // 为编辑创建一个深拷贝
          editFormModels.value = JSON.parse(JSON.stringify(rawData))
        } else {
          throw new Error('解析后的result_json格式不正确或为空。')
        }
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
    if (newTask && newTask.ID) {
      fetchTaskDetails(newTask.ID)
    } else {
      tableData.value = []
      tableColumns.value = []
      editFormModels.value = []
    }
  },
  { immediate: true, deep: true }
)

const isLongText = (text) => {
  if (typeof text !== 'string') return false
  // 当文本行数大于3或字符数超过50时，被认为是长文本
  const lineCount = (text.match(/\n/g) || []).length + 1
  return lineCount > 3 || text.length > 50
}

const openEditPopup = (row, field) => {
  editableRow.value = row
  editableFieldProp.value = field
  editableField.value = translateHeader(field)
  longTextValue.value = row[field]
  longTextEditVisible.value = true
}

const saveLongText = () => {
  if (editableRow.value && editableFieldProp.value) {
    editableRow.value[editableFieldProp.value] = longTextValue.value
  }
  longTextEditVisible.value = false
  editableFieldProp.value = ''
  editableField.value = ''
}

const startRowEdit = (row) => {
  // 只需设置编辑状态，因为原始数据在 tableData 中
  row.editing = true
}

const cancelRowEdit = (row) => {
  const index = editFormModels.value.findIndex((item) => item.id === row.id)
  if (index !== -1) {
    // 从原始数据中恢复
    const originalRow = tableData.value.find((item) => item.id === row.id)
    if (originalRow) {
      editFormModels.value[index] = JSON.parse(JSON.stringify(originalRow))
      editFormModels.value[index].editing = false // 确保取消后 editing 状态也复原
    }
  }
}

const saveRowEdit = (row) => {
  // 仅在本地确认更改并退出编辑模式，不调用保存服务
  row.editing = false
  ElMessage.info('此行更改已暂存，请点击“提交修改”以提交。')
}

const handleSaveAll = async () => {
  savingAllEdits.value = true
  try {
    // 准备要提交的数据，移除 'editing' 标志
    const payloads = editFormModels.value.map((item) => {
      const payload = { ...item }
      delete payload.editing
      return payload
    })

    const editPromises = payloads.map((item) => cozeService.runEditWorkflow(item))

    const results = await Promise.allSettled(editPromises)

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount

    if (failureCount > 0) {
      ElMessage.error(`${failureCount} 个条目保存失败，请检查控制台日志。`)
    } else {
      ElMessage.success('全部解析结果已成功保存！')
      // 更新原始数据
      tableData.value = JSON.parse(
        JSON.stringify(
          editFormModels.value.map((item) => {
            const cleanItem = { ...item }
            delete cleanItem.editing
            return cleanItem
          })
        )
      )
      chatStore.addMessage(`已保存 ${successCount} 个合同解析结果`, 'system')
      handleClose() // 保存成功后关闭对话框
    }
  } catch (error) {
    console.error('保存全部时发生意外错误:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    savingAllEdits.value = false
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
      chatStore.addMessage(
        `已确认 ${successCount} 个 ${props.task?.name || '未知'} 解析结果`,
        'system'
      )
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
