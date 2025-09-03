// OverviewStatsDialog 组件工具函数

/**
 * 获取任务状态对应的 Element Plus 标签类型
 * @param {string} status - 任务状态
 * @returns {string} Element Plus 标签类型
 */
export const getTaskStatusType = (status) => {
  const statusMap = {
    'success': 'success',
    'error': 'danger',
    'pending': 'warning'
  }
  return statusMap[status] || 'info'
}

/**
 * 获取任务状态显示文本
 * @param {string} status - 任务状态
 * @returns {string} 状态显示文本
 */
export const getTaskStatusText = (status) => {
  const statusMap = {
    'success': '已完成',
    'error': '执行失败', 
    'pending': '进行中'
  }
  return statusMap[status] || status
}

/**
 * 格式化时间显示
 * @param {string} timeString - 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timeString) => {
  if (!timeString) return '-'
  
  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    console.error('时间格式化错误:', error)
    return timeString
  }
}

/**
 * 计算实时进度条颜色
 * @param {number} percentage - 进度百分比
 * @returns {string} 进度条颜色
 */
export const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return '#f56c6c' // 红色
  } else if (percentage < 60) {
    return '#e6a23c' // 黄色
  } else if (percentage < 90) {
    return '#409eff' // 蓝色
  } else {
    return '#67c23a' // 绿色
  }
}

/**
 * 导出数据为 CSV 格式
 * @param {Array} data - 要导出的数据
 * @param {Array} columns - 表格列配置
 * @param {string} filename - 文件名前缀
 */
export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) {
    console.warn('没有数据可导出')
    return
  }

  try {
    // 创建 CSV 内容
    const headers = columns.map(col => col.label).join(',')
    const rows = data.map(row => {
      return columns.map(col => {
        let value = row[col.prop] || ''
        
        // 处理特殊字段
        if (col.prop === 'status') {
          value = getTaskStatusText(value)
        } else if (col.prop === 'createTime' || col.prop === 'finishTime') {
          value = formatTime(value)
        }
        
        // 处理包含逗号的值
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`
        }
        
        return value
      }).join(',')
    })

    const csvContent = [headers, ...rows].join('\n')

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${getCurrentTimestamp()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
  }
}

/**
 * 获取当前时间戳字符串
 * @returns {string} 格式化的时间戳
 */
export const getCurrentTimestamp = () => {
  const now = new Date()
  return now.toISOString()
    .replace(/[:\-T]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .slice(0, 15) // YYYYMMDD_HHmmss 格式
}

/**
 * 过滤表格数据
 * @param {Array} data - 原始数据
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 过滤后的数据
 */
export const filterTableData = (data, keyword) => {
  if (!keyword || !keyword.trim()) {
    return data
  }

  const searchKey = keyword.toLowerCase()
  return data.filter(item => {
    return Object.values(item).some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchKey)
      }
      return false
    })
  })
}

/**
 * 获取任务优先级颜色
 * @param {string} priority - 任务优先级
 * @returns {string} 对应的颜色
 */
export const getPriorityColor = (priority) => {
  const colorMap = {
    'high': '#f56c6c',
    'medium': '#e6a23c', 
    'low': '#67c23a'
  }
  return colorMap[priority] || '#909399'
}

/**
 * 验证表格数据格式
 * @param {Array} data - 要验证的数据
 * @returns {boolean} 是否为有效格式
 */
export const validateTableData = (data) => {
  if (!Array.isArray(data)) {
    return false
  }
  
  if (data.length === 0) {
    return true // 空数组是有效的
  }
  
  // 检查每条数据是否包含必要字段
  const requiredFields = ['id', 'taskName', 'agentName', 'status']
  return data.every(item => {
    return requiredFields.every(field => field in item)
  })
}

/**
 * 处理错误信息显示
 * @param {string} errorMessage - 错误信息
 * @param {number} maxLength - 最大显示长度
 * @returns {string} 处理后的错误信息
 */
export const processErrorMessage = (errorMessage, maxLength = 100) => {
  if (!errorMessage) return '-'
  
  if (errorMessage.length <= maxLength) {
    return errorMessage
  }
  
  return errorMessage.substring(0, maxLength) + '...'
}

/**
 * 获取任务类型图标
 * @param {string} taskType - 任务类型
 * @returns {string} 对应的图标
 */
export const getTaskTypeIcon = (taskType) => {
  const iconMap = {
    'contract': '📄',
    'material': '📦',
    'parsing': '🔍',
    'analysis': '📊'
  }
  return iconMap[taskType] || '📝'
}