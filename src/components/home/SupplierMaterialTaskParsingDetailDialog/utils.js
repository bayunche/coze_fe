// SupplierMaterialTaskParsingDetailDialog 组件工具函数
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import CozeService from '@/utils/coze.js'
import smartBrainService from '@/services/SmartBrainService.js'
import { 
  TASK_DETAIL_STATUS_MAP, 
  DEFAULT_VALUES, 
  MESSAGE_LABELS
} from './constants.js'

/**
 * 格式化任务详情状态
 * @param {string} status - 状态值
 * @returns {string} 格式化后的状态文本
 */
export const formatTaskDetailStatus = (status) => {
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
 * 创建 Coze 服务实例
 * @param {string} apiKey - API密钥
 * @returns {CozeService} Coze服务实例
 */
export const createCozeService = (apiKey) => {
  return new CozeService(apiKey)
}


/**
 * 获取任务详情列表
 * @param {string} taskId - 任务ID
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} 获取结果 { tableData, total }
 */
export const fetchDetailList = async (taskId, params) => {
  try {
    // 调用后端接口获取任务详情列表，页码从0开始
    const apiParams = {
      page: params.pageNumber - 1, // 前端页码从1开始，后端从0开始
      size: params.pageSize
    }
    
    const result = await smartBrainService.getTaskDetailsList(taskId, apiParams)
    
    return {
      tableData: result.content || [],
      total: result.totalElements || 0
    }
  } catch (error) {
    console.error('获取乙供物资解析详情列表失败:', error)
    ElMessage.error(`${MESSAGE_LABELS.FETCH_ERROR}: ${error.message || '未知错误'}`)
    return { tableData: [], total: 0 }
  }
}

/**
 * 创建路由导航函数
 * @returns {Function} 路由导航函数
 */
export const createRouter = () => {
  return useRouter()
}

/**
 * 查看详情操作
 * @param {Object} row - 行数据
 * @param {Object} router - 路由对象
 * @param {Function} closeDialog - 关闭对话框函数
 */
export const viewDetail = (row, router, closeDialog) => {
  router.push({
    name: 'owner-material-detail',
    query: {
      taskId: row.taskId,
      detailId: row.id
    }
  })
  closeDialog()
}

/**
 * 下载文件操作
 * @param {Object} row - 行数据
 */
export const downloadFile = (row) => {
  console.log('下载源文件:', row)
  
  // 导入文件下载工具函数
  import('@/utils/fileDownload.js').then(({ downloadSourceFile }) => {
    downloadSourceFile(row)
  }).catch(error => {
    console.error('导入文件下载工具失败:', error)
    ElMessage.error('下载功能加载失败')
  })
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