import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkflowStore } from './workflow'
import { useChatStore } from './chat' // 引入 chat store
import CozeParsingService from '@/services/CozeParsingService'
import { translateHeader, formatCellValue } from '@/utils/helpers'

/**
 * @typedef {Object} TableColumn
 * @property {string} prop - 列的字段名
 * @property {string} label - 列的显示名称
 */

/**
 * @typedef {Object} TableDataItem
 * @property {string} id - 数据项ID
 * @property {boolean} [editing] - 是否处于编辑状态
 * @property {string} [result_json] - 原始JSON字符串（如果存在）
 * @property {Object.<string, any>} [rest] - 其他动态属性
 */

export const useParsingResultStore = defineStore('parsingResult', () => {
  /** @type {import('vue').Ref<boolean>} */
  const showResultDetail = ref(false)
  /** @type {import('vue').Ref<string | null>} */
  const taskId = ref(null) // 新增 taskId
  /** @type {import('vue').Ref<TableDataItem[]>} */
  const tableData = ref([]) // 原始数据
  /** @type {import('vue').Ref<TableColumn[]>} */
  const tableColumns = ref([])
  /** @type {import('vue').Ref<TableDataItem[]>} */
  const editFormModels = ref([]) // 用于编辑的表单数据模型
  /** @type {import('vue').Ref<boolean>} */
  const isFetchingDetails = ref(false)
  /** @type {import('vue').Ref<boolean>} */
  const savingAllEdits = ref(false)
  /** @type {import('vue').Ref<boolean>} */
  const isConfirming = ref(false)

  // 编辑功能
  /** @type {import('vue').Ref<boolean>} */
  const longTextEditVisible = ref(false)
  /** @type {import('vue').Ref<string>} */
  const longTextValue = ref('')
  /** @type {import('vue').Ref<TableDataItem | null>} */
  const editableRow = ref(null)
  /** @type {import('vue').Ref<string>} */
  const editableField = ref('')
  /** @type {import('vue').Ref<string>} */
  const editableFieldProp = ref('')

  const cozeParsingService = new CozeParsingService()
  const chatStore = useChatStore() // 初始化 chat store

  // Actions
  /**
   * 解析从Coze服务返回的原始数据，提取表格所需JSON数据。
   * @param {Array<Object>} parsedData - 包含 result_json 字段的原始数据数组。
   * @returns {Array<Object>} 提取并解析后的表格数据数组。
   */
  const parseResultJsonData = (parsedData) => {
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return []
    }

    const tableJsonData = []
    for (const item of parsedData) {
      if (item && typeof item === 'object') {
        if (item.hasOwnProperty('result_json') && typeof item.result_json === 'string') {
          try {
            const parsedResult = JSON.parse(item.result_json)
            if (Array.isArray(parsedResult)) {
              tableJsonData.push(...parsedResult)
            } else if (parsedResult && typeof parsedResult === 'object') {
              tableJsonData.push(parsedResult)
            }
          } catch (e) {
            console.warn('Failed to parse result_json for item:', item, e)
            // 解析失败则忽略该项
          }
        } else {
          // 如果没有 result_json 字段，或者 result_json 不是字符串，则直接添加整个item
          tableJsonData.push(item)
        }
      }
    }
    return tableJsonData
  }

  /**
   * 处理查看解析结果详情的逻辑。
   * @param {string} taskIdToFetch - 要获取详情的任务ID。
   */
  const handleViewResultDetail = async (options = {}) => {
    const { isSupplierMaterial = false, specificTaskId = null } = options
    const workflowStore = useWorkflowStore()
    let taskIdToFetch = specificTaskId // 优先使用传入的 specificTaskId
    let detailId = null

    if (!taskIdToFetch) {
      // 如果没有传入 specificTaskId，则根据 isSupplierMaterial 从 workflowStore 获取
      taskIdToFetch = isSupplierMaterial ? workflowStore.supplierTaskId : workflowStore.taskId
    }

    if (isSupplierMaterial) {
      if (workflowStore.supplierFileDetailIds?.length > 0) {
        detailId = workflowStore.supplierFileDetailIds[0]
      } else {
        ElMessage.warning('没有可供解析的乙供物资详情ID。')
        return
      }
    }

    if (!taskIdToFetch) {
      ElMessage.warning('没有可供解析的结果任务ID。')
      return
    }

    showResultDetail.value = true
    isFetchingDetails.value = true
    tableData.value = []
    tableColumns.value = []
    editFormModels.value = [] // 确保清空

    try {
      const workflowId = '7517294942201610281' // 合同解析的实际工作流ID
      const result = await cozeParsingService.runTableGenerationWorkflow(workflowId, taskIdToFetch)
      if (result && result.data) {
        // 移除 replace，因为 Coze API 返回的 ID 可能是大数字，JSON.parse 应该能处理
        // 如果后端返回的 ID 确实是字符串，则不需要 replace
        // const jsonString = result.data.replace(/("id":\s*)(\d{16,})/g, '$1"$2"');
        const parsedData = JSON.parse(result.data)?.output
        const tableJsonData = parseResultJsonData(parsedData)
        console.log('【诊断】解析后的表格数据:', tableJsonData)
        if (Array.isArray(tableJsonData) && tableJsonData.length > 0) {
          tableColumns.value = Object.keys(tableJsonData[0]).map((key) => ({
            prop: key,
            label: translateHeader(key)
          }))
          const rawData = tableJsonData.map((item) => ({ ...item, editing: false }))
          tableData.value = JSON.parse(JSON.stringify(rawData))
          editFormModels.value = JSON.parse(JSON.stringify(rawData))
        } else {
          ElMessage.info('结果为空或解析后无数据，暂无数据展示。')
        }
      } else {
        throw new Error('任务未返回有效的表格数据。')
      }
    } catch (error) {
      console.error('处理表格数据时出错:', error)
      ElMessage.error(`获取表格数据失败: ${error.message}`)
    } finally {
      isFetchingDetails.value = false
    }
  }

  /**
   * 判断文本是否为长文本（多行或长度超过50）。
   * @param {string} text - 要判断的文本。
   * @returns {boolean} 是否为长文本。
   */
  const isLongText = (text) => {
    if (typeof text !== 'string') return false
    const lineCount = (text.match(/\n/g) || []).length + 1
    return lineCount > 3 || text.length > 50
  }

  /**
   * 打开长文本编辑弹窗。
   * @param {TableDataItem} row - 当前编辑的行数据。
   * @param {string} field - 当前编辑的字段名。
   */
  const openEditPopup = (row, field) => {
    editableRow.value = row
    editableFieldProp.value = field
    editableField.value = translateHeader(field)
    longTextValue.value = row[field]
    longTextEditVisible.value = true
  }

  /**
   * 保存长文本编辑结果。
   */
  const saveLongText = () => {
    if (editableRow.value && editableFieldProp.value) {
      editableRow.value[editableFieldProp.value] = longTextValue.value
    }
    longTextEditVisible.value = false
    editableFieldProp.value = ''
    editableField.value = ''
  }

  /**
   * 启用行编辑模式。
   * @param {TableDataItem} row - 要编辑的行数据。
   */
  const startRowEdit = (row) => {
    row.editing = true
  }

  /**
   * 取消行编辑模式，并恢复原始数据。
   * @param {TableDataItem} row - 要取消编辑的行数据。
   */
  const cancelRowEdit = (row) => {
    const index = editFormModels.value.findIndex((item) => item.id === row.id)
    if (index !== -1) {
      const originalRow = tableData.value.find((item) => item.id === row.id)
      if (originalRow) {
        editFormModels.value[index] = JSON.parse(JSON.stringify(originalRow))
        editFormModels.value[index].editing = false
      }
    }
  }

  /**
   * 保存行编辑结果（暂存）。
   * @param {TableDataItem} row - 已编辑的行数据。
   */
  const saveRowEdit = (row) => {
    row.editing = false
    ElMessage.info('此行更改已暂存，请点击“提交修改”以提交。')
  }

  /**
   * 提交所有修改到后端。
   */
  const handleSaveAll = async () => {
    savingAllEdits.value = true
    try {
      const payloads = editFormModels.value.map((item) => {
        const payload = { ...item }
        delete payload.editing
        return payload
      })

      const editWorkflowId = 'your_edit_workflow_id' // 替换为实际的编辑工作流ID
      const editPromises = payloads.map((item) =>
        cozeParsingService.runEditWorkflow(editWorkflowId, item)
      )

      const results = await Promise.allSettled(editPromises)

      const successCount = results.filter((r) => r.status === 'fulfilled').length
      const failureCount = results.length - successCount

      if (failureCount > 0) {
        ElMessage.error(`${failureCount} 个条目保存失败，请检查控制台日志。`)
      } else {
        ElMessage.success('全部解析结果已成功保存！')
        const savedCount = successCount
        const resultType = '合同' // 根据对话框标题确定类型
        chatStore.addMessage(`已保存${savedCount}个${resultType}解析结果`, 'system')
        tableData.value = JSON.parse(
          JSON.stringify(
            editFormModels.value.map((item) => {
              const cleanItem = { ...item }
              delete cleanItem.editing
              return cleanItem
            })
          )
        )
        showResultDetail.value = false
      }
    } catch (error) {
      console.error('保存全部时发生意外错误:', error)
      ElMessage.error(`保存失败: ${error.message}`)
    } finally {
      savingAllEdits.value = false
    }
  }

  /**
   * 确认所有解析结果。
   */
  const handleConfirm = async () => {
    if (!tableData.value || tableData.value.length === 0) {
      ElMessage.warning('没有可确认的数据。')
      return
    }

    isConfirming.value = true

    try {
      const confirmWorkflowId = 'your_confirm_workflow_id' // 替换为实际的确认工作流ID
      const confirmPromises = tableData.value.map((item) =>
        cozeParsingService.runConfirmWorkflow(confirmWorkflowId, { id: item.id })
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

      showResultDetail.value = false
    } catch (error) {
      console.error('执行确认工作流时发生意外错误:', error)
      ElMessage.error(`确认过程中发生错误: ${error.message}`)
    } finally {
      isConfirming.value = false
    }
  }

  return {
    showResultDetail,
    taskId,
    tableData,
    tableColumns,
    editFormModels,
    isFetchingDetails,
    savingAllEdits,
    isConfirming,
    longTextEditVisible,
    longTextValue,
    editableRow,
    editableField,
    editableFieldProp,
    parseResultJsonData,
    handleViewResultDetail,
    isLongText,
    openEditPopup,
    saveLongText,
    startRowEdit,
    cancelRowEdit,
    saveRowEdit,
    handleSaveAll,
    handleConfirm,
    // 导出辅助函数，因为它们在 ResultDetailTableDialog.vue 中被直接使用
    translateHeader,
    formatCellValue
  }
})
