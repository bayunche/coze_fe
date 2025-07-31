// ExecutionHistory 组件工具函数

export const formatExecutionTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    running: 'blue',
    success: 'green', 
    error: 'red'
  }
  return colors[status] || 'gray'
}