import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorkflowStore } from './workflow'
import { useChatStore } from './chat' // 引入 chat store
import { translateHeader, formatCellValue } from '@/utils/helpers'
import {
  getContractAnalysisResults,
  editSupplierMaterialParsingResults,
  confirmSupplierMaterialParsingResults,
  updateContractAnalysisResult
} from '@/utils/backendWorkflow.js'

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
  /** @type {import('vue').Ref<boolean>} */
  const showTaskDetail = ref(false)
  /** @type {import('vue').Ref<string | null>} */
  const taskId = ref(null) // 新增 taskId
  /** @type {import('vue').Ref<string | null>} */
  const currentTaskDetailId = ref(null) // 当前任务详情ID
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
  /** @type {import('vue').Ref<boolean>} */
  const isSupplierMaterialMode = ref(false) // 标识当前是否为乙供物资模式

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
        if (
          Object.prototype.hasOwnProperty.call(item, 'result_json') &&
          typeof item.result_json === 'string'
        ) {
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
   * 处理查看任务详情列表的逻辑。
   * @param {string} specificTaskId - 要查看的任务ID。
   */
  const viewTaskDetail = async (specificTaskId = null) => {
    const workflowStore = useWorkflowStore()
    let taskIdToUse = specificTaskId

    if (!taskIdToUse) {
      // 如果没有传入 specificTaskId，则从 workflowStore 获取
      taskIdToUse = workflowStore.taskId
    }

    if (!taskIdToUse) {
      console.warn('缺少任务ID，无法显示任务详情列表')
      return
    }

    // 设置任务ID并显示任务详情弹窗
    taskId.value = taskIdToUse
    showTaskDetail.value = true
    console.log('显示任务详情列表弹窗，任务ID:', taskIdToUse)
  }

  /**
   * 处理查看解析结果详情的逻辑。
   * @param {string} taskIdToFetch - 要获取详情的任务ID。
   */
  const viewResultDetail = async (options = {}) => {
    const { isSupplierMaterial = false, specificTaskId = null } = options
    const workflowStore = useWorkflowStore()
    let taskIdToFetch = specificTaskId // 优先使用传入的 specificTaskId

    if (!taskIdToFetch) {
      // 如果没有传入 specificTaskId，则根据 isSupplierMaterial 从 workflowStore 获取
      taskIdToFetch = isSupplierMaterial ? workflowStore.supplierTaskId : workflowStore.taskId
    }

    if (isSupplierMaterial) {
      if (workflowStore.supplierFileDetailIds?.length > 0) {
        // 乙供物资有详情ID可用
      } else {
        ElMessage.warning('没有可供解析的乙供物资详情ID。')
        return
      }
    }

    if (!taskIdToFetch) {
      // ElMessage.warning('没有可供解析的结果任务ID。')
      return
    }

    showResultDetail.value = true
    isFetchingDetails.value = true
    tableData.value = []
    tableColumns.value = []
    editFormModels.value = [] // 确保清空

    try {
      console.log('【诊断】正在获取任务ID:', taskIdToFetch, '是否为乙供物资:', isSupplierMaterial)

      // 记录当前的工作流类型和任务ID
      isSupplierMaterialMode.value = isSupplierMaterial
      taskId.value = taskIdToFetch

      let tableJsonData = []

      if (isSupplierMaterial) {
        // 乙供物资解析 - 暂时使用模拟数据
        console.warn('乙供物资解析功能暂时使用模拟数据，需要后端提供对应API支持')

        tableJsonData = [
          {
            id: '1',
            name: '示例乙供物资',
            specification: '规格型号待补充',
            unit: '个',
            quantity: 100,
            status: '待后端API支持'
          }
        ]
      } else {
        // 合同解析 - 使用新的后端接口
        console.log('【诊断】调用合同解析聚合结果接口')

        const result = await getContractAnalysisResults(taskIdToFetch)
        console.log('【诊断】合同解析接口返回结果:', result)

        // 处理新的返回体结构 {code: 200, data: [...], message: 'Success'}
        const resultJson = result?.data

        if (resultJson && Array.isArray(resultJson)) {
          // 将聚合后的数据转换为表格格式
          tableJsonData = resultJson.map((item) => ({
            ...item, // 展开所有字段，包括taskDetailId、taskId、resultStatus等
            editing: false
          }))
          console.log('【诊断】转换后的表格数据:', tableJsonData)

          // 保存任务ID作为当前任务详情ID（合同解析使用任务级别ID）
          currentTaskDetailId.value = taskIdToFetch
        } else {
          console.warn('合同解析接口返回数据格式异常:', result)
          console.warn('期望的 resultJson 数组:', resultJson)
          tableJsonData = []
        }
      }

      if (Array.isArray(tableJsonData) && tableJsonData.length > 0) {
        tableColumns.value = Object.keys(tableJsonData[0])
          .filter((key) => !['editing', 'taskDetailId', 'taskId'].includes(key)) // 过滤掉内部字段
          .map((key) => ({
            prop: key,
            label: translateHeader(key)
          }))
        console.log('【诊断】生成的 tableColumns:', tableColumns.value)

        const rawData = tableJsonData.map((item) => ({ ...item, editing: false }))
        tableData.value = JSON.parse(JSON.stringify(rawData))
        editFormModels.value = JSON.parse(JSON.stringify(rawData))
        console.log('【诊断】tableData.value 已更新:', tableData.value)
      } else {
        ElMessage.info('结果为空或解析后无数据，暂无数据展示。')
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
    // 检查确认状态，已确认的记录不允许编辑
    if (row.resultStatus === 1) {
      ElMessage.warning('已确认的记录不允许修改，该状态由后端控制')
      return
    }
    
    row.editing = true
  }

  /**
   * 取消行编辑模式，并恢复原始数据。
   * @param {TableDataItem} row - 要取消编辑的行数据。
   */
  const cancelRowEdit = (row) => {
    const indexInEditModels = editFormModels.value.findIndex((item) => item.taskDetailId === row.taskDetailId)
    const indexInTableData = tableData.value.findIndex((item) => item.taskDetailId === row.taskDetailId)

    if (indexInEditModels !== -1 && indexInTableData !== -1) {
      const originalRow = JSON.parse(JSON.stringify(tableData.value[indexInTableData]))
      editFormModels.value[indexInEditModels] = { ...originalRow, editing: false }
      // 确保 tableData 中的对应项也同步更新 editing 状态
      tableData.value[indexInTableData].editing = false
    }
  }

  /**
   * 保存行编辑结果（暂存）。
   * @param {TableDataItem} row - 已编辑的行数据。
   */
  const saveRowEdit = (row) => {
    const indexInEditModels = editFormModels.value.findIndex((item) => item.taskDetailId === row.taskDetailId)
    const indexInTableData = tableData.value.findIndex((item) => item.taskDetailId === row.taskDetailId)

    if (indexInEditModels !== -1 && indexInTableData !== -1) {
      // 将 editFormModels 中的最新数据同步到 tableData
      tableData.value[indexInTableData] = JSON.parse(
        JSON.stringify(editFormModels.value[indexInEditModels])
      )
      tableData.value[indexInTableData].editing = false // 确保 tableData 中的 editing 状态也更新
    }
    row.editing = false // 设置当前行的 editing 状态为 false
    ElMessage.info('此行更改已暂存，请点击"提交修改"以提交。')
  }

  /**
   * 保存并确认单行编辑结果。
   * @param {TableDataItem} row - 已编辑的行数据。
   */
  const saveAndConfirmRowEdit = async (row) => {
    if (!row.taskDetailId) {
      ElMessage.error('缺少任务详情ID，无法保存')
      return
    }

    try {
      // 构造字段数据
      const fieldData = []
      Object.keys(row).forEach((key) => {
        if (key !== 'editing' && key !== 'taskDetailId' && key !== 'taskId' && key !== 'resultStatus') {
          fieldData.push({
            columnCode: key,
            columnName: translateHeader(key),
            columnValue: row[key] || ''
          })
        }
      })

      const updateData = {
        taskDetailId: row.taskDetailId,
        resultStatus: 1, // 设置为已确认
        fieldData: fieldData,
        remark: '单行修改确认'
      }

      console.log('【诊断】单行保存并确认数据:', updateData)

      let result
      if (isSupplierMaterialMode.value) {
        // 乙供物资暂时不支持，显示提示
        ElMessage.warning('乙供物资单行确认功能待后端实现')
        return
      } else {
        // 合同解析使用新接口
        result = await updateContractAnalysisResult(updateData)
      }

      if (result && result.success) {
        ElMessage.success(`成功确认 ${result.updatedFieldCount || 0} 个字段`)
        chatStore.addMessage(`已确认单行解析结果`, 'system')

        // 更新本地数据状态
        const indexInEditModels = editFormModels.value.findIndex((item) => item.taskDetailId === row.taskDetailId)
        const indexInTableData = tableData.value.findIndex((item) => item.taskDetailId === row.taskDetailId)

        if (indexInEditModels !== -1 && indexInTableData !== -1) {
          // 更新状态为已确认
          editFormModels.value[indexInEditModels].resultStatus = 1
          editFormModels.value[indexInEditModels].editing = false
          tableData.value[indexInTableData].resultStatus = 1
          tableData.value[indexInTableData].editing = false
        }
      } else {
        ElMessage.error(result?.message || '确认失败')
      }
    } catch (error) {
      console.error('保存并确认单行编辑失败:', error)
      ElMessage.error(`确认失败: ${error.message}`)
    }
  }

  /**
   * 提交所有修改到后端。
   */
  const saveAll = async () => {
    savingAllEdits.value = true
    try {
      // 过滤掉已确认的记录，只提交未确认的记录
      const unconfirmedRecords = editFormModels.value.filter(item => item.resultStatus !== 1)
      
      if (unconfirmedRecords.length === 0) {
        ElMessage.info('没有可以提交的未确认记录，已确认的记录不允许修改')
        savingAllEdits.value = false
        return
      }
      
      const payloads = unconfirmedRecords.map((item) => {
        const payload = { ...item }
        delete payload.editing
        return payload
      })

      let results
      if (isSupplierMaterialMode.value) {
        // 乙供物资解析结果编辑
        results = await editSupplierMaterialParsingResults(payloads)
      } else {
        // 合同解析结果编辑 - 批量调用单行修改接口
        console.log('【诊断】saveAll: 开始批量调用单行修改接口保存编辑')
        
        // 批量调用单行修改接口
        const updatePromises = payloads.map(async (item) => {
          try {
            // 构造字段数据
            const fieldData = []
            Object.keys(item).forEach((key) => {
              if (key !== 'editing' && key !== 'taskDetailId' && key !== 'taskId' && key !== 'resultStatus') {
                fieldData.push({
                  columnCode: key,
                  columnName: translateHeader(key),
                  columnValue: item[key] || ''
                })
              }
            })
            
            const updateData = {
              taskDetailId: item.taskDetailId,
              resultStatus: item.resultStatus || 0, // 保持原有状态，不强制确认
              fieldData: fieldData,
              remark: '批量保存合同解析结果编辑'
            }
            
            const result = await updateContractAnalysisResult(updateData)
            return {
              success: result && result.success,
              item: item,
              result: result,
              error: null
            }
          } catch (error) {
            console.error(`保存记录失败 (taskDetailId: ${item.taskDetailId}):`, error)
            return {
              success: false,
              item: item,
              result: null,
              error: error
            }
          }
        })
        
        // 等待所有请求完成
        const updateResults = await Promise.allSettled(updatePromises)
        
        // 统计结果
        let successCount = 0
        let failureCount = 0
        const failureDetails = []
        
        updateResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++
          } else {
            failureCount++
            const item = payloads[index]
            const errorMsg = result.status === 'fulfilled' 
              ? (result.value.result?.message || result.value.error?.message || '未知错误')
              : result.reason?.message || '请求失败'
            failureDetails.push(`记录 ${item.taskDetailId}: ${errorMsg}`)
          }
        })
        
        // 模拟原有的返回格式
        if (failureCount === 0) {
          results = { code: 200, message: '成功' }
        } else {
          results = { 
            code: failureCount === payloads.length ? 500 : 206, // 206 表示部分成功
            message: failureCount === payloads.length ? '全部失败' : '部分成功',
            successCount,
            failureCount,
            failureDetails
          }
          
          if (failureCount < payloads.length) {
            console.warn('批量保存失败详情:', failureDetails)
          } else {
            console.error('批量保存失败详情:', failureDetails)
          }
        }
      }

      if (results && results.code === 200) {
        ElMessage.success(`成功保存了 ${payloads.length} 条未确认的解析结果！`)
        const resultType = isSupplierMaterialMode.value ? '乙供物资' : '合同'
        const confirmedCount = editFormModels.value.length - unconfirmedRecords.length
        const message = confirmedCount > 0 
          ? `已保存${payloads.length}个${resultType}解析结果（跳过了${confirmedCount}个已确认记录）`
          : `已保存${payloads.length}个${resultType}解析结果`
        chatStore.addMessage(message, 'system')

        // 更新本地数据
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
      } else {
        ElMessage.error(results?.message || '保存失败')
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
  const confirm = async () => {
    if (!tableData.value || tableData.value.length === 0) {
      ElMessage.warning('没有可确认的数据。')
      return
    }

    if (!taskId.value) {
      ElMessage.error('缺少任务ID，无法批量确认')
      return
    }

    isConfirming.value = true

    try {
      let results
      if (isSupplierMaterialMode.value) {
        // 乙供物资解析结果确认 - 暂时保持原有逻辑
        const confirmData = tableData.value.map((item) => {
          const confirmItem = { ...item }
          delete confirmItem.editing
          return confirmItem
        })
        results = await confirmSupplierMaterialParsingResults(confirmData)

        if (results && results.code === 200) {
          ElMessage.success(`所有 ${confirmData.length} 条乙供物资解析记录均已成功确认！`)
          chatStore.addMessage(`已确认${confirmData.length}个乙供物资解析结果`, 'system')
          showResultDetail.value = false
        } else {
          ElMessage.error(results?.message || '确认失败')
        }
      } else {
        // 合同解析结果确认 - 批量调用单行修改接口
        console.log('【诊断】开始批量调用单行修改接口进行确认')
        
        // 过滤出需要确认的记录（未确认的记录）
        const recordsToConfirm = tableData.value.filter(item => item.resultStatus !== 1)
        
        if (recordsToConfirm.length === 0) {
          ElMessage.info('所有记录已经确认，无需重复操作')
          showResultDetail.value = false
          return
        }
        
        console.log(`【诊断】需要确认的记录数量: ${recordsToConfirm.length}`)
        
        // 批量调用单行修改接口
        const updatePromises = recordsToConfirm.map(async (item) => {
          try {
            // 构造字段数据
            const fieldData = []
            Object.keys(item).forEach((key) => {
              if (key !== 'editing' && key !== 'taskDetailId' && key !== 'taskId' && key !== 'resultStatus') {
                fieldData.push({
                  columnCode: key,
                  columnName: translateHeader(key),
                  columnValue: item[key] || ''
                })
              }
            })
            
            const updateData = {
              taskDetailId: item.taskDetailId,
              resultStatus: 1, // 设置为已确认
              fieldData: fieldData,
              remark: '批量确认合同解析结果'
            }
            
            const result = await updateContractAnalysisResult(updateData)
            return {
              success: result && result.success,
              item: item,
              result: result,
              error: null
            }
          } catch (error) {
            console.error(`确认记录失败 (taskDetailId: ${item.taskDetailId}):`, error)
            return {
              success: false,
              item: item,
              result: null,
              error: error
            }
          }
        })
        
        // 等待所有请求完成
        const updateResults = await Promise.allSettled(updatePromises)
        
        // 统计结果
        let successCount = 0
        let failureCount = 0
        const failureDetails = []
        
        updateResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++
            // 更新本地数据状态为已确认
            const item = recordsToConfirm[index]
            const tableIndex = tableData.value.findIndex(t => t.taskDetailId === item.taskDetailId)
            const editIndex = editFormModels.value.findIndex(t => t.taskDetailId === item.taskDetailId)
            
            if (tableIndex !== -1) {
              tableData.value[tableIndex].resultStatus = 1
            }
            if (editIndex !== -1) {
              editFormModels.value[editIndex].resultStatus = 1
            }
          } else {
            failureCount++
            const item = recordsToConfirm[index]
            const errorMsg = result.status === 'fulfilled' 
              ? (result.value.result?.message || result.value.error?.message || '未知错误')
              : result.reason?.message || '请求失败'
            failureDetails.push(`记录 ${item.taskDetailId}: ${errorMsg}`)
          }
        })
        
        // 显示结果
        if (failureCount === 0) {
          ElMessage.success(`批量确认成功！共处理 ${successCount} 条合同解析记录`)
          chatStore.addMessage(`已批量确认${successCount}个合同解析结果`, 'system')
          showResultDetail.value = false
        } else if (successCount > 0) {
          ElMessage.warning(
            `部分确认成功：成功 ${successCount} 条，失败 ${failureCount} 条。详情请查看控制台`
          )
          console.warn('批量确认失败详情:', failureDetails)
          chatStore.addMessage(`批量确认部分成功：${successCount}成功，${failureCount}失败`, 'system')
        } else {
          ElMessage.error(`批量确认失败！所有 ${failureCount} 条记录都处理失败`)
          console.error('批量确认失败详情:', failureDetails)
        }
      }
    } catch (error) {
      console.error('执行确认工作流时发生意外错误:', error)
      ElMessage.error(`确认过程中发生错误: ${error.message}`)
    } finally {
      isConfirming.value = false
    }
  }

  return {
    showResultDetail,
    showTaskDetail,
    taskId,
    currentTaskDetailId,
    tableData,
    tableColumns,
    editFormModels,
    isFetchingDetails,
    savingAllEdits,
    isConfirming,
    isSupplierMaterialMode,
    longTextEditVisible,
    longTextValue,
    editableRow,
    editableField,
    editableFieldProp,
    parseResultJsonData,
    viewTaskDetail,
    viewResultDetail,
    isLongText,
    openEditPopup,
    saveLongText,
    startRowEdit,
    cancelRowEdit,
    saveRowEdit,
    saveAndConfirmRowEdit,
    saveAll,
    confirm,
    // 导出辅助函数，因为它们在 ResultDetailTableDialog.vue 中被直接使用
    translateHeader,
    formatCellValue
  }
})
