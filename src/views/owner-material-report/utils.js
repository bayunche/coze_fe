/**
 * 甲供物资报告页面工具函数
 */

import { HIGH_QUANTITY_THRESHOLD, STATISTICS_METRICS } from './constants.js'

/**
 * 格式化报告数据
 * @param {Array} data - 原始物资数据
 * @returns {Array} 格式化后的数据
 */
export const formatReportData = (data) => {
  if (!Array.isArray(data)) {
    return []
  }
  
  return data.map(item => ({
    ...item,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    totalPrice: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
  }))
}

/**
 * 计算统计数据
 * @param {Array} materials - 物资数据
 * @returns {Object} 统计结果
 */
export const calculateStatistics = (materials) => {
  if (!Array.isArray(materials) || materials.length === 0) {
    return {
      [STATISTICS_METRICS.TOTAL_MATERIALS]: 0,
      [STATISTICS_METRICS.ZERO_QUANTITY_MATERIALS]: 0,
      [STATISTICS_METRICS.HIGH_QUANTITY_MATERIALS]: 0,
      [STATISTICS_METRICS.UNIQUE_SUPPLIERS]: 0,
      [STATISTICS_METRICS.TOTAL_VALUE]: 0
    }
  }

  const formattedMaterials = formatReportData(materials)
  
  const stats = {
    [STATISTICS_METRICS.TOTAL_MATERIALS]: formattedMaterials.length,
    [STATISTICS_METRICS.ZERO_QUANTITY_MATERIALS]: formattedMaterials.filter(m => m.quantity === 0).length,
    [STATISTICS_METRICS.HIGH_QUANTITY_MATERIALS]: formattedMaterials.filter(m => m.quantity > HIGH_QUANTITY_THRESHOLD).length,
    [STATISTICS_METRICS.UNIQUE_SUPPLIERS]: new Set(
      formattedMaterials.map(m => m.supplier || m.supplierName).filter(Boolean)
    ).size,
    [STATISTICS_METRICS.TOTAL_VALUE]: formattedMaterials.reduce((sum, m) => sum + m.totalPrice, 0)
  }
  
  return stats
}

/**
 * 生成完整报告数据
 * @param {Array} materials - 物资数据
 * @param {Object} projectInfo - 项目信息
 * @returns {Object} 完整报告数据
 */
export const generateReport = (materials, projectInfo = {}) => {
  const formattedMaterials = formatReportData(materials)
  const statistics = calculateStatistics(formattedMaterials)
  
  return {
    projectInfo,
    statistics,
    materials: formattedMaterials,
    summary: generateSummary(statistics),
    generatedAt: new Date().toLocaleString('zh-CN')
  }
}

/**
 * 生成报告摘要
 * @param {Object} statistics - 统计数据
 * @returns {Object} 报告摘要
 */
export const generateSummary = (statistics) => {
  const totalMaterials = statistics[STATISTICS_METRICS.TOTAL_MATERIALS]
  const zeroQuantityMaterials = statistics[STATISTICS_METRICS.ZERO_QUANTITY_MATERIALS]
  const highQuantityMaterials = statistics[STATISTICS_METRICS.HIGH_QUANTITY_MATERIALS]
  
  return {
    totalItems: totalMaterials,
    zeroQuantityRatio: totalMaterials > 0 ? (zeroQuantityMaterials / totalMaterials * 100).toFixed(1) + '%' : '0%',
    highQuantityRatio: totalMaterials > 0 ? (highQuantityMaterials / totalMaterials * 100).toFixed(1) + '%' : '0%',
    totalValue: statistics[STATISTICS_METRICS.TOTAL_VALUE],
    formattedTotalValue: `¥${statistics[STATISTICS_METRICS.TOTAL_VALUE].toLocaleString()}`
  }
}

/**
 * 处理打印功能
 * @param {string} projectName - 项目名称
 * @param {function} onSuccess - 成功回调
 * @param {function} onError - 错误回调
 */
export const handlePrint = (projectName = '项目', onSuccess, onError) => {
  try {
    const originalTitle = document.title
    const newTitle = `甲供物资解析报告_${projectName}_${new Date().toLocaleDateString('zh-CN')}`
    
    // 设置文档标题
    document.title = newTitle
    
    // 添加打印样式类
    document.body.classList.add('printing')
    
    // 执行打印
    window.print()
    
    // 恢复原始状态
    setTimeout(() => {
      document.title = originalTitle
      document.body.classList.remove('printing')
    }, 1000)
    
    if (onSuccess) {
      onSuccess('打印对话框已打开，请选择"另存为PDF"来保存报告，或选择打印机进行打印')
    }
  } catch (error) {
    console.error('打印失败:', error)
    if (onError) {
      onError('打印失败，请重试')
    }
  }
}

/**
 * 格式化数值显示
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数值字符串
 */
export const formatNumber = (value, decimals = 0) => {
  const num = Number(value) || 0
  return decimals > 0 ? num.toFixed(decimals) : num.toString()
}

/**
 * 格式化货币显示
 * @param {number} value - 货币数值
 * @returns {string} 格式化后的货币字符串
 */
export const formatCurrency = (value) => {
  const num = Number(value) || 0
  return `¥${num.toLocaleString()}`
}

/**
 * 格式化百分比显示
 * @param {number} value - 数值
 * @param {number} total - 总数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  const percentage = (value / total * 100).toFixed(decimals)
  return `${percentage}%`
}

/**
 * 检查是否有AI分析报告数据
 * @param {*} llmReport - AI分析数据
 * @returns {boolean} 是否有有效的AI报告数据
 */
export const hasValidLlmReport = (llmReport) => {
  return llmReport && 
         typeof llmReport === 'object' && 
         Object.keys(llmReport).length > 0 &&
         Object.values(llmReport).some(content => content && content.toString().trim().length > 0)
}

/**
 * 处理AI报告数据格式化
 * @param {Object} llmReport - AI分析数据
 * @returns {Array} 格式化后的报告章节
 */
export const formatLlmReportSections = (llmReport) => {
  if (!hasValidLlmReport(llmReport)) {
    return []
  }
  
  return Object.entries(llmReport).map(([category, content]) => ({
    title: category,
    content: content,
    type: typeof content === 'object' ? 'object' : 'text'
  }))
}