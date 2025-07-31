// LogsDrawer 组件工具函数

export const formatLogEntry = (log) => {
  return {
    ...log,
    timestamp: new Date(log.timestamp).toLocaleTimeString(),
    levelColor: getLevelColor(log.level)
  }
}

export const getLevelColor = (level) => {
  const colors = {
    debug: '#909399',
    info: '#409eff',
    warn: '#e6a23c',
    error: '#f56c6c'
  }
  return colors[level] || colors.info
}