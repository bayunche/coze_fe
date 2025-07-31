// TaskStatusWatcher 组件工具函数

export const createWatcher = (taskId, onStatusChange, config = {}) => {
  const {
    pollInterval = 3000,
    maxRetries = 10,
    timeout = 30000
  } = config
  
  let retryCount = 0
  let intervalId = null
  
  const startWatching = () => {
    intervalId = setInterval(async () => {
      try {
        const status = await fetchTaskStatus(taskId)
        onStatusChange(status)
        
        // 重置重试计数
        retryCount = 0
        
        // 如果任务完成，停止监听
        if (isTaskComplete(status)) {
          stopWatching()
        }
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          onStatusChange({ error: 'Max retries exceeded' })
          stopWatching()
        }
      }
    }, pollInterval)
    
    // 设置超时
    setTimeout(() => {
      if (intervalId) {
        onStatusChange({ error: 'Timeout' })
        stopWatching()
      }
    }, timeout)
  }
  
  const stopWatching = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
  
  return { startWatching, stopWatching }
}

const fetchTaskStatus = async (taskId) => {
  // 模拟API调用
  const response = await fetch(`/api/tasks/${taskId}/status`)
  return response.json()
}

const isTaskComplete = (status) => {
  return ['success', 'error', 'cancelled'].includes(status.status)
}