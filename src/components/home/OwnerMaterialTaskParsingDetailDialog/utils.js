// OwnerMaterialTaskParsingDetailDialog 组件工具函数
import { ElMessage } from 'element-plus'
import smartBrainService from '@/services/SmartBrainService.js'
import { 
  TASK_DETAIL_STATUS_MAP, 
  DEFAULT_VALUES, 
  MESSAGE_LABELS
} from './constants.js'

/**
 * 格式化任务详情状态
 * @param {string|number} status - 状态值
 * @param {string} errorReason - 错误原因（可选）
 * @returns {string} 格式化后的状态文本
 */
export const formatTaskDetailStatus = (status, errorReason) => {
  // 当 errorReason 不为空且 taskDetailStatus 为 -1 时，标记为解析失败
  if (errorReason && Number(status) === -1) {
    return '解析失败'
  }
  
  return TASK_DETAIL_STATUS_MAP[status] || DEFAULT_VALUES.UNKNOWN_STATUS_TEXT
}

/**
 * 格式化时间显示
 * @param {string} time - 时间字符串
 * @param {string} defaultText - 默认显示文本
 * @returns {string} 格式化后的时间
 */
export const formatTime = (time, defaultText) => {
  return time ? new Date(time).toLocaleString() : defaultText
}

/**
 * 格式化开始时间
 * @param {string} startTime - 开始时间
 * @returns {string} 格式化后的开始时间
 */
export const formatStartTime = (startTime) => {
  return formatTime(startTime, DEFAULT_VALUES.NOT_STARTED_TEXT)
}

/**
 * 格式化结束时间
 * @param {string} endTime - 结束时间
 * @returns {string} 格式化后的结束时间
 */
export const formatEndTime = (endTime) => {
  return formatTime(endTime, DEFAULT_VALUES.NOT_ENDED_TEXT)
}

/**
 * 格式化错误原因
 * @param {string} errorReason - 错误原因
 * @returns {string} 格式化后的错误原因
 */
export const formatErrorReason = (errorReason) => {
  return errorReason || DEFAULT_VALUES.NO_ERROR_TEXT
}

/**
 * 获取任务详情列表
 * @param {string} taskId - 任务ID
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 获取结果 { tableData, total }
 */
export const fetchDetailList = async (taskId, params) => {
  try {
    console.log('【调试】fetchDetailList - 入参检查:', { taskId, params })
    
    // 验证taskId是否存在
    if (!taskId) {
      console.error('【错误】fetchDetailList - taskId为空或未定义!')
      throw new Error('任务ID不能为空')
    }
    
    // 调用后端接口获取任务详情列表，页码从0开始
    const apiParams = {
      page: params.pageNumber - 1, // 前端页码从1开始，后端从0开始
      size: params.pageSize
    }
    
    console.log('【调试】fetchDetailList - 准备调用API:', { taskId, apiParams })
    
    const result = await smartBrainService.getTaskDetailsList(taskId, apiParams)
    
    console.log('【调试】甲供物资任务详情列表数据:', result)
    console.log('【调试】任务详情列表第一项:', result.content?.[0])
    
    return {
      tableData: result.content || [],
      total: result.totalElements || 0
    }
  } catch (error) {
    console.error('获取甲供物资解析详情列表失败:', error)
    ElMessage.error(`${MESSAGE_LABELS.FETCH_ERROR}: ${error.message || '未知错误'}`)
    return { tableData: [], total: 0 }
  }
}

/**
 * 查看详情操作
 * @param {Object} row - 行数据
 * @param {string} taskId - 任务ID
 * @param {Function} emit - 事件发射器
 */
export const viewDetail = (row, taskId, emit) => {
  console.log('【调试】甲供物资详情查看 - row对象:', row)
  
  try {
    // 甲供物资应该使用对话框显示详情，而不是路由跳转
    // 发出事件让父组件处理详情显示
    emit('view-detail', {
      taskId: taskId,
      detailId: row.id || row.taskDetailId || row.detailId,
      row: row
    })
    
    console.log('【调试】已发出 view-detail 事件')
  } catch (error) {
    console.error('查看甲供物资详情失败:', error)
    ElMessage.error(`${MESSAGE_LABELS.VIEW_DETAIL_ERROR}: ${error.message || '未知错误'}`)
  }
}

/**
 * 下载文件操作
 * @param {Object} row - 行数据
 */
export const downloadFile = async (row) => {
  console.log('下载源文件:', row)
  
  try {
    // 动态导入文件下载工具函数
    const { downloadSourceFile } = await import('@/utils/fileDownload.js')
    downloadSourceFile(row)
  } catch (error) {
    console.error('导入文件下载工具失败:', error)
    ElMessage.error(MESSAGE_LABELS.DOWNLOAD_ERROR)
  }
}

/**
 * 处理分页页码变化
 * @param {number} page - 新页码
 * @param {Function} setCurrentPage - 设置当前页函数
 * @param {Function} fetchData - 获取数据函数
 */
export const onCurrentChange = (page, setCurrentPage, fetchData) => {
  setCurrentPage(page)
  fetchData()
}

/**
 * 处理分页大小变化
 * @param {number} size - 新分页大小
 * @param {Function} setPageSize - 设置分页大小函数
 * @param {Function} setCurrentPage - 设置当前页函数
 * @param {Function} fetchData - 获取数据函数
 */
export const onSizeChange = (size, setPageSize, setCurrentPage, fetchData) => {
  setPageSize(size)
  setCurrentPage(1) // 改变每页大小时重置到第一页
  fetchData()
}

/**
 * 创建获取数据的函数
 * @param {Object} params - 参数对象
 * @returns {Function} 获取数据函数
 */
export const createFetchDataFunction = ({ 
  taskId, 
  currentPage, 
  pageSize, 
  setLoading, 
  setTableData, 
  setTotal 
}) => {
  return async () => {
    setLoading(true)
    
    try {
      const params = {
        pageNumber: currentPage.value,
        pageSize: pageSize.value
      }
      
      const { tableData, total } = await fetchDetailList(taskId.value, params)
      setTableData(tableData)
      setTotal(total)
    } finally {
      setLoading(false)
    }
  }
}

/**
 * 检查是否应该获取数据
 * @param {boolean} dialogVisible - 对话框是否可见
 * @param {string|number} taskId - 任务ID
 * @returns {boolean} 是否应该获取数据
 */
export const shouldFetchData = (dialogVisible, taskId) => {
  return dialogVisible && taskId
}