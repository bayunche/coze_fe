// 乙供物资解析任务详情页面工具函数

import { ElMessage } from 'element-plus'

/**
 * 格式化任务详情状态
 * @param {number} status - 任务状态
 * @param {string} errorReason - 错误原因
 * @returns {string} 格式化后的状态文本
 */
export const formatTaskDetailStatus = (status, errorReason) => {
  if (errorReason && Number(status) === -1) {
    return '解析失败'
  }
  
  const statusMap = {
    0: '排队中',
    1: '处理中', 
    2: '处理完成',
    3: '已确认',
    [-1]: '处理失败'
  }
  
  return statusMap[status] || '未知状态'
}

/**
 * 格式化时间
 * @param {string} timeStr - 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timeStr) => {
  return timeStr ? new Date(timeStr).toLocaleString() : '未开始'
}

/**
 * 处理查看详情
 * @param {Object} row - 表格行数据
 * @param {string} taskId - 任务ID
 * @param {Function} router - Vue路由器实例
 */
export const handleViewDetail = (row, taskId, router) => {
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
    
    // 获取详情ID，优先使用 id，如果没有则使用 taskDetailId
    const detailId = row.id || row.taskDetailId
    if (!detailId) {
      ElMessage.error('无法获取详情ID，请重试')
      return
    }
    
    console.log('跳转到乙供物资解析详情:', { taskId, detailId })
    
    // 跳转到乙供物资详情页面
    router.push({
      name: 'supplier-material-detail',
      params: {
        taskId: String(taskId),
        detailId: String(detailId)
      }
    })
  } catch (error) {
    console.error('跳转乙供物资解析详情失败:', error)
    ElMessage.error('跳转详情页面失败: ' + (error.message || '未知错误'))
  }
}

/**
 * 处理下载文件
 * @param {Object} row - 表格行数据
 */
export const handleDownloadFile = (row) => {
  if (row.fileUrl) {
    window.open(row.fileUrl, '_blank')
  } else {
    ElMessage.warning('该记录没有关联的文件')
  }
}

/**
 * 返回任务列表
 * @param {Object} router - Vue Router实例
 */
export const goBackToTaskList = (router) => {
  router.push('/smart-brain/supplier-material-tasks')
}

/**
 * 创建面包屑导航项
 * @param {string|number} taskId - 任务ID
 * @returns {Array} 面包屑导航数组
 */
export const createBreadcrumbItems = (taskId) => {
  return [
    { text: '智能大脑', to: '/smart-brain' },
    { text: '乙供物资解析任务', to: '/smart-brain/supplier-material-tasks' },
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