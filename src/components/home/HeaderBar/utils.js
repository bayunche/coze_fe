// HeaderBar 组件工具函数

/**
 * 构建面包屑路径
 * @param {string} currentFunctionName - 当前功能名称
 * @returns {Array} 面包屑数组
 */
export const buildBreadcrumbPath = (currentFunctionName) => {
  const basePath = [
    { label: '智能体控制台', path: '/' }
  ]
  
  if (currentFunctionName) {
    basePath.push({
      label: currentFunctionName,
      path: '#'
    })
  }
  
  return basePath
}

/**
 * 格式化执行日志计数显示
 * @param {number} count - 日志数量
 * @returns {string} 格式化后的显示文本
 */
export const formatLogsCount = (count) => {
  if (count === 0) return '0'
  if (count >= 1000) return '999+'
  return count.toString()
}

/**
 * 获取功能状态标识
 * @param {string} activeFunction - 当前激活的功能
 * @returns {Object} 状态对象
 */
export const getFunctionStatus = (activeFunction) => {
  const statusMap = {
    contractParsing: { 
      label: '合同解析', 
      status: 'active',
      color: 'var(--theme-primary)'
    },
    supplierMaterialParsing: { 
      label: '乙供物资解析', 
      status: 'active',
      color: 'var(--theme-success)'
    },
    ownerSuppliedMaterialParsing: { 
      label: '甲供物资解析', 
      status: 'active',
      color: 'var(--theme-warning)'
    }
  }
  
  return statusMap[activeFunction] || { 
    label: '未选择功能', 
    status: 'inactive',
    color: 'var(--theme-text-secondary)'
  }
}