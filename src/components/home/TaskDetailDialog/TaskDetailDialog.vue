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
import { ElMessage } from 'element-plus'
import CozeService from '@/utils/coze.js'
import smartBrainService from '@/services/SmartBrainService.js'
import { useChatStore } from '@/stores/chat'

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

const cozeService = new CozeService(import.meta.env.VITE_COZE_API_KEY)

const isFetchingDetails = ref(false)
const tableData = ref([]) // 原始数据
const tableColumns = ref([])
const editFormModels = ref([]) // 用于编辑的表单数据模型

// 编辑功能
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
  // 后端接口返回的WmesTasksDetailDO字段映射
  id: '详情记录ID',
  taskId: '任务ID',
  taskDetailStatus: '任务状态',
  errorReason: '错误原因',
  startTime: '开始时间',
  endTime: '结束时间',
  fileGroup: '文件组',
  createdBy: '创建人',
  createdTime: '创建时间',
  updatedBy: '更新人',
  updatedTime: '更新时间',
  fileName: '文件名称',
  fileUrl: '文件地址',
  
  // 保留原有的合同解析相关映射
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
  signing_time: '签订时间',
  safety_rate: '安全文明施工费是否下浮',
  temporary_rate: '临时设施费是否下浮',
  result_status: '解析状态',
  ID: 'ID'
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
  if (prop === 'taskDetailStatus') {
    switch (Number(value)) {
      case 0: return '排队中'
      case 1: return '处理中'
      case 2: return '处理完成'
      case 3: return '已确认'
      case -1: return '错误中断'
      default: return value
    }
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
    // 调用后端接口获取任务详情列表，默认获取所有数据
    const result = await smartBrainService.getTaskDetailsList(taskId, {
      page: 0,
      size: 1000 // 获取大量数据以展示在表格中
    })

    if (result && result.content && Array.isArray(result.content)) {
      const tableJsonData = result.content

      if (tableJsonData.length > 0) {
        // 根据返回的数据生成表格列
        tableColumns.value = Object.keys(tableJsonData[0]).map((key) => ({
          prop: key,
          label: key
        }))
        
        // 为每个数据项添加editing标志
        const rawData = tableJsonData.map((item) => ({ ...item, editing: false }))
        tableData.value = JSON.parse(JSON.stringify(rawData))
        // 为编辑创建一个深拷贝
        editFormModels.value = JSON.parse(JSON.stringify(rawData))
      } else {
        // 没有数据时清空表格
        tableColumns.value = []
        tableData.value = []
        editFormModels.value = []
      }
    } else {
      throw new Error('后端接口未返回有效的任务详情数据。')
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
