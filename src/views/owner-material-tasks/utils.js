import { TASK_STATUS_MAP, DEFAULT_VALUES } from './constants.js'

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '未知时间'
  return new Date(timestamp).toLocaleString()
}

/**
 * 获取任务状态标签信息
 * @param {Object} row - 表格行数据
 * @returns {Object} 包含text和type的状态对象
 */
export const getTaskStatus = (row) => {
  return TASK_STATUS_MAP[row.status] || { text: DEFAULT_VALUES.UNKNOWN_STATUS_TEXT, type: 'info' }
}

/**
 * 计算进度百分比
 * @param {number} fileCount - 总文件数
 * @param {number} fileDoneCount - 已完成文件数
 * @returns {number} 进度百分比
 */
export const calculateProgress = (fileCount, fileDoneCount) => {
  if (!fileCount || fileCount === 0) return 0
  const progress = Math.round((fileDoneCount || 0) / fileCount * 100)
  return Math.max(0, Math.min(100, progress))
}

/**
 * 处理查看详情操作
 * @param {Object} row - 表格行数据
 * @param {Function} router - Vue路由器实例
 */
export const handleViewDetails = (row, router) => {
  if (!row.id) {
    console.error('任务ID不存在')
    return
  }
  
  router.push({
    name: 'owner-material-task-detail',
    params: { taskId: row.id }
  })
}

/**
 * 获取任务状态筛选条件
 * @param {string} activeTab - 当前激活的tab
 * @returns {Array|null} 状态筛选条件数组或null
 */
export const getStatusFilter = (activeTab) => {
  switch (activeTab) {
    case 'inProgress':
      return [0, 1] // 排队中、处理中
    case 'completed':
      return [2, 3] // 处理完成、已确认
    default:
      return null // 全部
  }
}

/**
 * 处理返回智能大脑
 * @param {Function} router - Vue路由器实例
 */
export const goBackToSmartBrain = (router) => {
  router.push('/smart-brain')
}

/**
 * 创建面包屑导航数据
 * @returns {Array} 面包屑数据
 */
export const createBreadcrumbItems = () => {
  return [
    { text: '智能大脑', to: '/smart-brain' },
    { text: '甲供物资解析任务', to: null }
  ]
}