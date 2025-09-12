import { ElMessage } from 'element-plus'
import { TASK_DETAIL_STATUS_MAP, DEFAULT_VALUES } from './constants.js'
import { downloadSourceFile } from '@/utils/fileDownload.js'

/**
 * 格式化任务详情状态
 * @param {number} status - 状态码
 * @param {string} errorReason - 错误原因
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
 * 格式化时间
 * @param {string} time - 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatTime = (time) => {
  if (!time) return '未开始'
  return new Date(time).toLocaleString()
}

/**
 * 处理查看详情按钮点击
 * @param {Object} row - 表格行数据
 * @param {string} taskId - 主任务ID
 * @param {Function} router - Vue路由器实例
 */
export const handleViewDetail = async (row, taskId, router) => {
  // 检查任务状态，只有处理完成或已确认的任务才能查看解析结果详情
  if (row.taskDetailStatus !== 2 && row.taskDetailStatus !== 3) {
    ElMessage.warning('只有处理完成或已确认的任务才能查看解析结果详情')
    return
  }

  try {
    if (!taskId) {
      ElMessage.error('无法获取任务ID，请重试')
      return
    }
    
    // 跳转到合同解析结果详情页面（通用物资详情页面）
    router.push({
      name: 'material-detail',
      params: { taskId: taskId }
    })
  } catch (error) {
    console.error('跳转合同解析结果详情失败:', error)
    ElMessage.error('跳转详情页面失败: ' + (error.message || '未知错误'))
  }
}

/**
 * 处理查看源文件按钮点击
 * @param {Object} row - 表格行数据
 */
export const handleDownloadFile = (row) => {
  if (row.fileUrl) {
    downloadSourceFile(row)
  } else {
    ElMessage.warning('该记录没有关联的文件')
  }
}

/**
 * 处理返回任务列表
 * @param {Function} router - Vue路由器实例
 */
export const goBackToTaskList = (router) => {
  router.push('/smart-brain/contract-tasks')
}

/**
 * 创建面包屑导航数据
 * @param {string} taskId - 任务ID
 * @returns {Array} 面包屑数据
 */
export const createBreadcrumbItems = (taskId) => {
  return [
    { text: '智能大脑', to: '/smart-brain' },
    { text: '合同解析任务', to: '/smart-brain/contract-tasks' },
    { text: `任务详情 (${taskId})`, to: null }
  ]
}

/**
 * 根据任务状态获取标签类型
 * @param {number} status - 任务状态
 * @param {string} errorReason - 错误原因
 * @returns {string} 标签类型
 */
export const getTaskStatusType = (status, errorReason) => {
  if (errorReason && Number(status) === -1) {
    return 'danger'
  }
  
  const statusTypeMap = {
    0: 'info',      // 排队中
    1: 'warning',   // 处理中
    2: 'success',   // 处理完成
    3: 'success',   // 已确认
    [-1]: 'danger'  // 处理失败
  }
  
  return statusTypeMap[status] || 'info'
}