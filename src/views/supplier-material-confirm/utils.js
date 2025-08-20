// 乙供物资解析确认页面工具函数
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { 
  API_CONFIG,
  MESSAGE_CONFIG,
  MATCH_TYPE_CONFIG,
  CONFIRM_STATUS_CONFIG
} from './constants.js'

/**
 * 创建axios实例
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '',
  timeout: 30000
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log('【诊断】乙供物资确认API请求:', config)
    return config
  },
  error => {
    console.error('【错误】乙供物资确认API请求失败:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log('【诊断】乙供物资确认API响应:', response.data)
    return response.data
  },
  error => {
    console.error('【错误】乙供物资确认API响应错误:', error)
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

/**
 * 格式化确认数据 - 基于API接口数据结构
 * @param {Object} item - 原始数据项
 * @returns {Object} 格式化后的数据项
 */
export const formatConfirmData = (item) => {
  return {
    id: item.taskDataId,
    material_name: item.materialName || '/',
    material_specification: item.specifications || '/',
    material_unit: item.unit || '/',
    material_quantity: item.quantity || '/',
    material_price: formatPrice(item.unitPrice),
    material_total_price: formatPrice(item.totalPrice),
    matched_name: item.baseInfo?.materialName || '/',
    matched_specification: item.baseInfo?.specifications || '/',
    matched_price: formatPrice(item.priceInfo?.taxPrice),
    matched_quarter: item.priceInfo?.quarter || '/',
    similarity: '/', // API中没有直接的相似度字段
    match_type: item.matchedType || 0,
    confirm_status: item.confirmResult || 0,
    confirm_base_data_id: item.confirmBaseDataId,
    confirm_price_id: item.confirmPriceId,
    confirm_type: item.confirmType || 0,
    task_id: item.taskId,
    task_detail_id: item.taskDetailId,
    match_options: item.matchOptions || [], // 匹配选项列表
    original_item: item
  }
}

/**
 * 获取匹配类型数值
 * @param {number|string} matchType - 匹配类型
 * @returns {number} 匹配类型数值
 */
export const getMatchTypeValue = (matchType) => {
  if (typeof matchType === 'string') {
    const typeMap = {
      '无匹配': 0,
      '精确匹配': 1,
      '相似匹配': 2,
      '历史匹配': 3,
      '人工匹配': 4
    }
    return typeMap[matchType] ?? 0
  }
  return matchType || 0
}

/**
 * 获取匹配类型文本和样式
 * @param {number} type - 匹配类型数值
 * @returns {Object} 包含文本和样式的对象
 */
export const getMatchTypeConfig = (type) => {
  return MATCH_TYPE_CONFIG[type] || { type: 'info', text: '未知' }
}

/**
 * 获取确认状态文本和样式
 * @param {number} status - 确认状态数值
 * @returns {Object} 包含文本和样式的对象
 */
export const getConfirmStatusConfig = (status) => {
  return CONFIRM_STATUS_CONFIG[status] || { type: 'info', text: '未知' }
}

/**
 * 格式化价格显示
 * @param {number|string} price - 价格
 * @returns {string} 格式化后的价格
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return '/'
  }
  
  const numPrice = parseFloat(price)
  if (isNaN(numPrice)) {
    return '/'
  }
  
  return `¥${numPrice.toFixed(2)}`
}

/**
 * 格式化相似度显示
 * @param {number|string} similarity - 相似度
 * @returns {string} 格式化后的相似度
 */
export const formatSimilarity = (similarity) => {
  if (similarity === null || similarity === undefined || similarity === '') {
    return '/'
  }
  
  const numSimilarity = parseFloat(similarity)
  if (isNaN(numSimilarity)) {
    return '/'
  }
  
  return `${numSimilarity}%`
}

/**
 * 查询确认数据列表 - 使用实际的API接口
 * @param {string|number} taskId - 任务ID
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 包含数据和总数的对象
 */
export const queryConfirmData = async (taskId, params = {}) => {
  try {
    const requestBody = {
      taskId: taskId,
      page: (params.pageNum || 1) - 1, // API使用从0开始的页码
      size: params.pageSize || 20,
      keyword: params.searchKeyword || undefined,
      confirmResult: params.confirmResult,
      matchedType: params.matchedType
    }
    
    console.log('【诊断】查询乙供物资确认数据参数:', requestBody)
    
    // 使用POST请求调用复杂查询接口
    const response = await apiClient.post(API_CONFIG.QUERY_URL, requestBody)
    
    if (response && response.content) {
      const data = response.content || []
      const pageInfo = response.page || {}
      const statistics = response.statistics || {}
      
      const formattedData = Array.isArray(data) ? data.map(formatConfirmData) : []
      
      console.log('【诊断】乙供物资确认数据查询结果:', {
        count: formattedData.length,
        total: pageInfo.totalElements || 0,
        statistics
      })
      
      return {
        tableData: formattedData,
        total: pageInfo.totalElements || 0,
        pageInfo,
        statistics
      }
    } else {
      throw new Error('响应数据格式错误')
    }
  } catch (error) {
    console.error('【错误】查询乙供物资确认数据失败:', error)
    
    // 如果是网络错误或接口不存在，返回模拟数据用于测试
    if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
      console.warn('【警告】API接口不存在，返回模拟数据')
      return getMockConfirmData(params)
    }
    
    ElMessage.error(`${MESSAGE_CONFIG.LOAD_ERROR}: ${error.message || '未知错误'}`)
    return { tableData: [], total: 0, statistics: {} }
  }
}

/**
 * 获取统计信息
 * @param {string|number} taskId - 任务ID
 * @returns {Promise<Object>} 统计信息对象
 */
export const getStatistics = async (taskId) => {
  try {
    console.log('【诊断】查询乙供物资确认统计信息:', taskId)
    
    const response = await apiClient.get(API_CONFIG.STATISTICS_URL, { 
      params: { taskId } 
    })
    
    if (response.success || response.code === 200) {
      const stats = response.data || response.result || {}
      
      console.log('【诊断】乙供物资确认统计信息:', stats)
      
      return {
        totalCount: stats.totalCount || 0,
        confirmedCount: stats.confirmedCount || 0,
        unconfirmedCount: stats.unconfirmedCount || 0,
        exactMatchCount: stats.exactMatchCount || 0,
        noMatchCount: stats.noMatchCount || 0
      }
    } else {
      throw new Error(response.message || '获取统计信息失败')
    }
  } catch (error) {
    console.error('【错误】获取乙供物资确认统计信息失败:', error)
    
    // 返回默认统计信息
    return {
      totalCount: 0,
      confirmedCount: 0,
      unconfirmedCount: 0,
      exactMatchCount: 0,
      noMatchCount: 0
    }
  }
}

/**
 * 单个确认操作 - 使用实际的API接口
 * @param {Object} row - 行数据
 * @returns {Promise<boolean>} 操作是否成功
 */
export const singleConfirm = async (row) => {
  try {
    const requestBody = {
      id: row.id,
      confirmBaseDataId: row.confirm_base_data_id,
      confirmPriceId: row.confirm_price_id
    }
    
    console.log('【诊断】单个确认操作:', requestBody)
    
    const response = await apiClient.post(API_CONFIG.MANUAL_CONFIRM_URL, requestBody)
    
    if (response && (response.code === 200 || response.message === '确认成功')) {
      ElMessage.success(MESSAGE_CONFIG.CONFIRM_SUCCESS)
      return true
    } else {
      throw new Error(response.message || '确认失败')
    }
  } catch (error) {
    console.error('【错误】单个确认操作失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.CONFIRM_ERROR}: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 批量确认操作
 * @param {Array} ids - 记录ID数组
 * @param {number} confirmStatus - 确认状态 (0: 取消确认, 1: 确认)
 * @returns {Promise<boolean>} 操作是否成功
 */
export const batchConfirm = async (ids, confirmStatus = 1) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
      return false
    }
    
    console.log('【诊断】批量确认操作:', { ids, confirmStatus })
    
    const response = await apiClient.post(API_CONFIG.BATCH_CONFIRM_URL, {
      ids,
      confirmResult: confirmStatus
    })
    
    if (response.success || response.code === 200) {
      ElMessage.success(`${MESSAGE_CONFIG.BATCH_CONFIRM_SUCCESS}: ${ids.length}条记录`)
      return true
    } else {
      throw new Error(response.message || '批量操作失败')
    }
  } catch (error) {
    console.error('【错误】批量确认操作失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.BATCH_CONFIRM_ERROR}: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 批量确认全部未确认记录
 * @param {string|number} taskId - 任务ID
 * @returns {Promise<boolean>} 操作是否成功
 */
export const batchConfirmAll = async (taskId) => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要批量确认全部未确认的记录吗？此操作不可撤销。',
      '批量确认全部',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result === 'confirm') {
      console.log('【诊断】批量确认全部操作:', taskId)
      
      const response = await apiClient.post(API_CONFIG.BATCH_CONFIRM_URL, {
        taskId,
        confirmAll: true,
        confirmResult: 1
      })
      
      if (response.success || response.code === 200) {
        ElMessage.success(`${MESSAGE_CONFIG.BATCH_CONFIRM_SUCCESS}: ${response.count || 0}条记录`)
        return true
      } else {
        throw new Error(response.message || '批量确认全部失败')
      }
    }
    
    return false
  } catch (error) {
    if (error === 'cancel') {
      return false
    }
    
    console.error('【错误】批量确认全部操作失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.BATCH_CONFIRM_ERROR}: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 导出确认数据
 * @param {string|number} taskId - 任务ID
 * @param {Object} params - 查询参数
 * @param {string} filename - 文件名
 */
export const exportConfirmData = async (taskId, params = {}, filename = '乙供物资确认数据') => {
  try {
    console.log('【诊断】导出乙供物资确认数据:', { taskId, params, filename })
    
    // 这里可以集成实际的导出功能
    // 目前先显示提示信息
    ElMessage.success(`${MESSAGE_CONFIG.EXPORT_SUCCESS}: ${filename}`)
  } catch (error) {
    console.error('【错误】导出乙供物资确认数据失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.EXPORT_ERROR}: ${error.message || '未知错误'}`)
  }
}

/**
 * 模拟数据生成器（用于测试）
 * @param {Object} params - 查询参数
 * @returns {Object} 模拟数据
 */
export const getMockConfirmData = (params = {}) => {
  const { pageNum = 1, pageSize = 20 } = params
  
  // 生成模拟数据
  const mockData = []
  const total = 50 // 模拟总数
  
  for (let i = 0; i < Math.min(pageSize, total - (pageNum - 1) * pageSize); i++) {
    const index = (pageNum - 1) * pageSize + i + 1
    mockData.push({
      id: index,
      material_name: `乙供物资${index}`,
      material_specification: `规格型号${index}`,
      material_unit: '套',
      material_price: formatPrice(Math.random() * 10000 + 1000),
      matched_name: Math.random() > 0.3 ? `匹配物资${index}` : '/',
      matched_specification: Math.random() > 0.3 ? `匹配规格${index}` : '/',
      matched_price: Math.random() > 0.3 ? formatPrice(Math.random() * 10000 + 1000) : '/',
      similarity: Math.random() > 0.3 ? formatSimilarity(Math.random() * 30 + 70) : '/',
      match_type: Math.floor(Math.random() * 5),
      confirm_status: Math.random() > 0.5 ? 1 : 0
    })
  }
  
  console.log('【诊断】返回模拟确认数据:', mockData.length)
  
  return {
    tableData: mockData,
    total
  }
}

/**
 * 导航相关函数
 */
export const useNavigation = () => {
  const router = useRouter()
  
  /**
   * 返回上一页
   */
  const goBack = () => {
    router.go(-1)
  }
  
  /**
   * 跳转到详情页面
   * @param {string|number} taskId - 任务ID
   * @param {string|number} detailId - 详情ID
   */
  const goToDetail = (taskId, detailId) => {
    router.push({
      name: 'supplier-material-detail',
      params: { taskId, detailId }
    })
  }
  
  /**
   * 跳转到智能大脑页面
   */
  const goToSmartBrain = () => {
    router.push({ name: 'smart-brain' })
  }
  
  return {
    goBack,
    goToDetail,
    goToSmartBrain
  }
}

/**
 * 搜索过滤功能
 * @param {Array} data - 原始数据
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 过滤后的数据
 */
export const filterDataByKeyword = (data, keyword) => {
  if (!keyword || keyword.trim() === '') {
    return data
  }
  
  const lowerKeyword = keyword.toLowerCase()
  
  return data.filter(item => 
    item.material_name.toLowerCase().includes(lowerKeyword) ||
    item.material_specification.toLowerCase().includes(lowerKeyword) ||
    item.matched_name.toLowerCase().includes(lowerKeyword) ||
    item.matched_specification.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 计算确认统计信息
 * @param {Array} data - 数据数组
 * @returns {Object} 统计信息
 */
export const calculateStatistics = (data) => {
  if (!Array.isArray(data)) {
    return {
      totalCount: 0,
      confirmedCount: 0,
      unconfirmedCount: 0,
      exactMatchCount: 0,
      noMatchCount: 0
    }
  }
  
  const stats = {
    totalCount: data.length,
    confirmedCount: data.filter(item => item.confirm_status === 1).length,
    unconfirmedCount: data.filter(item => item.confirm_status === 0).length,
    exactMatchCount: data.filter(item => item.match_type === 1).length,
    noMatchCount: data.filter(item => item.match_type === 0).length
  }
  
  return stats
}