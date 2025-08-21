/**
 * 甲供物资详情页面工具函数
 */
import { MATERIAL_STATUS_TEXT, MATERIAL_STATUS_COLOR } from './constants'

/**
 * 格式化物资状态显示
 * @param {number} status 状态值
 * @returns {Object} 包含文本和颜色的对象
 */
export function formatMaterialStatus(status) {
  return {
    text: MATERIAL_STATUS_TEXT[status] || '未知状态',
    color: MATERIAL_STATUS_COLOR[status] || 'info'
  }
}

/**
 * 格式化货币显示
 * @param {number} amount 金额
 * @param {string} currency 货币单位
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, currency = 'CNY') {
  if (amount === null || amount === undefined || amount === '') {
    return '-'
  }
  return Number(amount).toLocaleString('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  })
}

/**
 * 格式化数字显示
 * @param {number} number 数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined || number === '') {
    return '-'
  }
  return Number(number).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 过滤物资数据
 * @param {Array} materials 物资列表
 * @param {Object} filters 过滤条件
 * @returns {Array} 过滤后的物资列表
 */
export function filterMaterials(materials, filters) {
  if (!materials || !Array.isArray(materials)) return []
  
  return materials.filter(material => {
    // 状态过滤
    if (filters.status !== undefined && filters.status !== '' && material.status !== filters.status) {
      return false
    }
    
    // 关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const searchFields = filters.searchField ? [filters.searchField] : ['materialName', 'specification', 'brand', 'supplier']
      
      return searchFields.some(field => {
        const value = material[field]
        return value && value.toString().toLowerCase().includes(keyword)
      })
    }
    
    // 价格范围过滤
    if (filters.priceRange) {
      const { min, max } = filters.priceRange
      const price = Number(material.unitPrice)
      if (min !== undefined && price < min) return false
      if (max !== undefined && price > max) return false
    }
    
    return true
  })
}

/**
 * 排序物资数据
 * @param {Array} materials 物资列表
 * @param {string} sortField 排序字段
 * @param {string} sortOrder 排序顺序 ('asc' | 'desc')
 * @returns {Array} 排序后的物资列表
 */
export function sortMaterials(materials, sortField, sortOrder = 'asc') {
  if (!materials || !Array.isArray(materials) || !sortField) return materials
  
  return [...materials].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]
    
    // 处理数字类型
    if (typeof aValue === 'string' && !isNaN(aValue)) {
      aValue = Number(aValue)
    }
    if (typeof bValue === 'string' && !isNaN(bValue)) {
      bValue = Number(bValue)
    }
    
    // 处理null/undefined值
    if (aValue === null || aValue === undefined) aValue = ''
    if (bValue === null || bValue === undefined) bValue = ''
    
    let result = 0
    if (aValue < bValue) result = -1
    if (aValue > bValue) result = 1
    
    return sortOrder === 'desc' ? -result : result
  })
}

/**
 * 计算统计信息
 * @param {Array} materials 物资列表
 * @returns {Object} 统计信息
 */
export function calculateStatistics(materials) {
  if (!materials || !Array.isArray(materials)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      averagePrice: 0,
      statusCounts: {}
    }
  }
  
  const stats = {
    totalCount: materials.length,
    totalAmount: 0,
    averagePrice: 0,
    statusCounts: {}
  }
  
  materials.forEach(material => {
    // 计算总金额
    const totalPrice = Number(material.totalPrice) || 0
    stats.totalAmount += totalPrice
    
    // 统计状态数量
    const status = material.status
    stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1
  })
  
  // 计算平均价格
  stats.averagePrice = stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0
  
  return stats
}

/**
 * 导出物资数据
 * @param {Array} materials 物资数据
 * @param {string} format 导出格式
 * @param {string} filename 文件名
 */
export function exportMaterialData(materials, format = 'excel', filename = '甲供物资详情') {
  switch (format) {
    case 'excel':
      exportToExcel(materials, filename)
      break
    case 'pdf':
      exportToPDF(materials, filename)
      break
    case 'csv':
      exportToCSV(materials, filename)
      break
    default:
      console.warn('不支持的导出格式:', format)
  }
}

/**
 * 导出为Excel格式
 * @param {Array} data 数据
 * @param {string} filename 文件名
 */
function exportToExcel(data, filename) {
  // 这里可以集成第三方Excel导出库，如 xlsx
  console.log('导出Excel功能待实现', { data, filename })
}

/**
 * 导出为PDF格式
 * @param {Array} data 数据
 * @param {string} filename 文件名
 */
function exportToPDF(data, filename) {
  // 这里可以集成第三方PDF导出库，如 jsPDF
  console.log('导出PDF功能待实现', { data, filename })
}

/**
 * 导出为CSV格式
 * @param {Array} data 数据
 * @param {string} filename 文件名
 */
function exportToCSV(data, filename) {
  // 这里可以实现CSV导出逻辑
  console.log('导出CSV功能待实现', { data, filename })
}

/**
 * 验证物资数据完整性
 * @param {Object} material 物资数据
 * @returns {Object} 验证结果
 */
export function validateMaterialData(material) {
  const errors = []
  const warnings = []
  
  // 必填字段验证
  if (!material.materialName?.trim()) {
    errors.push('物资名称不能为空')
  }
  
  if (!material.specification?.trim()) {
    warnings.push('建议填写规格型号')
  }
  
  if (!material.unit?.trim()) {
    errors.push('单位不能为空')
  }
  
  if (!material.quantity || Number(material.quantity) <= 0) {
    errors.push('数量必须大于0')
  }
  
  if (!material.unitPrice || Number(material.unitPrice) <= 0) {
    errors.push('单价必须大于0')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}