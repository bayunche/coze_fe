// Home 页面工具函数

/**
 * 初始化页面状态
 */
export const initPageState = () => {
  return {
    isLoading: false,
    hasError: false,
    errorMessage: ''
  }
}

/**
 * 处理页面错误
 * @param {Error} error - 错误对象
 * @returns {Object} 错误状态
 */
export const processPageError = (error) => {
  console.error('Home page error:', error)
  return {
    hasError: true,
    errorMessage: error.message || '页面加载失败'
  }
}

/**
 * 重置页面状态
 * @param {Object} state - 页面状态对象
 */
export const resetPageState = (state) => {
  state.isLoading = false
  state.hasError = false
  state.errorMessage = ''
}

/**
 * 格式化功能名称
 * @param {string} functionKey - 功能键
 * @returns {string} 格式化后的名称
 */
export const formatFunctionName = (functionKey) => {
  const nameMap = {
    contractParsing: '合同解析',
    supplierMaterialParsing: '乙供物资解析',
    ownerSuppliedMaterialParsing: '甲供物资解析',
    smartBrain: '智能大脑'
  }
  
  return nameMap[functionKey] || functionKey
}

/**
 * 检查功能是否可用
 * @param {string} functionKey - 功能键
 * @returns {boolean} 是否可用
 */
export const isFunctionAvailable = (functionKey) => {
  const availableFunctions = [
    'contractParsing',
    'supplierMaterialParsing',
    'ownerSuppliedMaterialParsing',
    'smartBrain'
  ]
  
  return availableFunctions.includes(functionKey)
}