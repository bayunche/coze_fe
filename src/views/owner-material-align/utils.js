/**
 * 甲供物资对平页面工具函数
 */
import { ALIGN_STATUS_TEXT, ALIGN_STATUS_COLOR } from './constants'

/**
 * 格式化对平状态显示
 * @param {number} status 状态值
 * @returns {Object} 包含文本和颜色的对象
 */
export function formatAlignStatus(status) {
  return {
    text: ALIGN_STATUS_TEXT[status] || '未知状态',
    color: ALIGN_STATUS_COLOR[status] || 'info'
  }
}

/**
 * 格式化金额显示
 * @param {number} amount 金额
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '-'
  }
  return Number(amount).toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  })
}

/**
 * 格式化数量显示
 * @param {number} quantity 数量
 * @param {string} unit 单位
 * @returns {string} 格式化后的数量字符串
 */
export function formatQuantity(quantity, unit = '') {
  if (quantity === null || quantity === undefined || quantity === '') {
    return '-'
  }
  return `${Number(quantity).toLocaleString()} ${unit}`.trim()
}

/**
 * 计算总价
 * @param {number} quantity 数量
 * @param {number} unitPrice 单价
 * @returns {number} 总价
 */
export function calculateTotalPrice(quantity, unitPrice) {
  if (!quantity || !unitPrice) return 0
  return Number(quantity) * Number(unitPrice)
}

/**
 * 验证物资数据
 * @param {Object} material 物资数据
 * @returns {Object} 验证结果
 */
export function validateMaterial(material) {
  const errors = []
  
  if (!material.materialName?.trim()) {
    errors.push('物资名称不能为空')
  }
  
  if (!material.specification?.trim()) {
    errors.push('规格型号不能为空')
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
    errors
  }
}

/**
 * 导出数据到Excel格式
 * @param {Array} data 要导出的数据
 * @param {string} filename 文件名
 */
export function exportToExcel(data, filename = '甲供物资对平数据') {
  // 这里可以集成第三方Excel导出库，如 xlsx
  console.log('导出Excel功能待实现', { data, filename })
}

/**
 * 导出数据到PDF格式
 * @param {Array} data 要导出的数据
 * @param {string} filename 文件名
 */
export function exportToPDF(data, filename = '甲供物资对平报告') {
  // 这里可以集成第三方PDF导出库，如 jsPDF
  console.log('导出PDF功能待实现', { data, filename })
}

/**
 * 深度克隆对象
 * @param {Object} obj 要克隆的对象
 * @returns {Object} 克隆后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}