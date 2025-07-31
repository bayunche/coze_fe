// SidebarNav 组件工具函数

/**
 * 处理功能选择事件
 * @param {string} key - 选择的功能键
 * @param {Function} emit - Vue emit 函数
 */
export const selectFunction = (key, emit) => {
  emit('select', key)
}

/**
 * 获取功能图标类名
 * @param {string} functionId - 功能ID
 * @returns {string} 图标类名
 */
export const getFunctionIconClass = (functionId) => {
  const iconClassMap = {
    contractParsing: 'contract-icon',
    supplierMaterialParsing: 'supplier-icon',
    ownerSuppliedMaterialParsing: 'owner-icon',
    smartBrain: 'brain-icon'
  }
  
  return iconClassMap[functionId] || 'default-icon'
}

/**
 * 检查功能是否可用
 * @param {string} functionId - 功能ID
 * @returns {boolean} 是否可用
 */
export const isFunctionEnabled = (functionId) => {
  const enabledFunctions = [
    'contractParsing',
    'supplierMaterialParsing', 
    'ownerSuppliedMaterialParsing',
    'smartBrain'
  ]
  
  return enabledFunctions.includes(functionId)
}

/**
 * 格式化功能显示名称
 * @param {string} functionName - 原始功能名称
 * @returns {string} 格式化后的显示名称
 */
export const formatFunctionName = (functionName) => {
  if (!functionName) return ''
  
  const nameMap = {
    contractParsing: '合同解析',
    supplierMaterialParsing: '乙供物资解析',
    ownerSuppliedMaterialParsing: '甲供物资解析',
    smartBrain: '智能大脑'
  }
  
  return nameMap[functionName] || functionName
}