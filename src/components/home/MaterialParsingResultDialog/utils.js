// MaterialParsingResultDialog 组件工具函数
import { TASK_STATUS, TASK_STATUS_CONFIG } from './constants.js'

/**
 * 格式化时间戳
 * @param {string} timestamp - 时间戳字符串
 * @returns {string} 格式化后的时间字符串
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  
  const cleanTimestamp = timestamp.split(' +')[0]
  const date = new Date(cleanTimestamp)
  
  if (isNaN(date.getTime())) return timestamp
  
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  const hours = ('0' + date.getHours()).slice(-2)
  const minutes = ('0' + date.getMinutes()).slice(-2)
  const seconds = ('0' + date.getSeconds()).slice(-2)
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 获取任务状态
 * @param {Object} task - 任务对象
 * @returns {Object} 状态配置对象
 */
export const getTaskStatus = (task) => {
  const total = parseInt(task.file_count, 10) || 0
  const processed = parseInt(task.file_done_count, 10) || 0
  const failed = parseInt(task.file_error_count, 10) || 0

  if (processed < total) {
    return TASK_STATUS_CONFIG[TASK_STATUS.IN_PROGRESS]
  }
  
  if (processed === total) {
    if (failed > 0) {
      return TASK_STATUS_CONFIG[TASK_STATUS.PARTIAL_FAILED]
    }
    return TASK_STATUS_CONFIG[TASK_STATUS.COMPLETED]
  }
  
  return TASK_STATUS_CONFIG[TASK_STATUS.UNKNOWN]
}

/**
 * 计算任务进度百分比
 * @param {number|string} total - 总数
 * @param {number|string} processed - 已处理数
 * @returns {number} 进度百分比
 */
export const calculateProgress = (total, processed) => {
  const totalNum = parseInt(total, 10) || 0
  const processedNum = parseInt(processed, 10) || 0
  
  if (totalNum === 0) {
    return 0
  }
  
  return Math.round((processedNum / totalNum) * 100)
}

/**
 * 过滤任务数据
 * @param {Object} tasks - 任务数据对象
 * @param {string} activeTab - 当前活动标签
 * @returns {Array} 过滤后的任务数组
 */
export const filterTasks = (tasks, activeTab) => {
  return tasks[activeTab] || []
}

/**
 * 分页处理数据
 * @param {Array} data - 数据数组
 * @param {number} currentPage - 当前页码
 * @param {number} pageSize - 每页大小
 * @returns {Array} 分页后的数据
 */
export const paginateData = (data, currentPage, pageSize) => {
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  return data.slice(start, end)
}

/**
 * 切换标签页
 * @param {Function} setCurrentPage - 设置当前页的函数
 */
export const switchTab = (setCurrentPage) => {
  setCurrentPage(1)
}

/**
 * 查看任务详情
 * @param {Object} task - 任务对象
 * @param {Function} setCurrentTaskId - 设置当前任务ID的函数
 * @param {Function} setDialogVisible - 设置对话框可见性的函数
 */
export const viewTaskDetails = (task, setCurrentTaskId, setDialogVisible) => {
  setCurrentTaskId(task.ID)
  setDialogVisible(true)
  console.log('查看详情', task.ID)
}

/**
 * 关闭对话框
 * @param {Function} emit - Vue emit函数
 */
export const closeDialog = (emit) => {
  emit('update:show', false)
}

/**
 * 处理详情页面跳转
 * @param {Object} params - 跳转参数
 * @param {Function} router - Vue router实例
 */
export const navigateToDetail = ({ detailId, taskId }, router) => {
  router.push({
    path: '/material-detail',
    query: { taskId, detailId }
  })
}

/**
 * 验证任务数据结构
 * @param {Object} tasks - 任务数据
 * @returns {boolean} 是否有效
 */
export const validateTasksData = (tasks) => {
  if (!tasks || typeof tasks !== 'object') {
    return false
  }
  
  const requiredFields = ['all', 'completed', 'inProgress']
  
  for (const field of requiredFields) {
    if (!(field in tasks) || !Array.isArray(tasks[field])) {
      return false
    }
  }
  
  return true
}

/**
 * 获取安全的任务数据
 * @param {Object} tasks - 原始任务数据
 * @returns {Object} 安全的任务数据
 */
export const getSafeTasksData = (tasks) => {
  if (validateTasksData(tasks)) {
    return tasks
  }
  
  return {
    all: [],
    completed: [],
    inProgress: []
  }
}