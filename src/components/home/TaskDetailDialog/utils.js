// TaskDetailDialog 组件工具函数

export const formatTaskStatus = (status) => {
  const statusMap = {
    pending: { text: '等待中', color: 'orange' },
    running: { text: '执行中', color: 'blue' },
    success: { text: '成功', color: 'green' },
    error: { text: '失败', color: 'red' },
    cancelled: { text: '已取消', color: 'gray' }
  }
  
  return statusMap[status] || statusMap.pending
}

export const calculateProgress = (current, total) => {
  if (!total || total === 0) return 0
  return Math.round((current / total) * 100)
}

export const formatDuration = (startTime, endTime) => {
  if (!startTime) return '-'
  
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const duration = end - start
  
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}