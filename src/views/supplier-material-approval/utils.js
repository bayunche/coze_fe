/**
 * 乙供物资审批页面工具函数
 */
import { MATCH_TYPE_MAP, CONFIRM_TYPE_MAP } from './constants.js'

/**
 * 获取匹配类型文本
 * @param {number} matchedType - 匹配类型
 * @returns {string} 匹配类型文本
 */
export function getMatchTypeText(matchedType) {
  return MATCH_TYPE_MAP[matchedType]?.text || '未知'
}

/**
 * 获取匹配类型颜色
 * @param {number} matchedType - 匹配类型
 * @returns {string} Element Plus tag 颜色类型
 */
export function getMatchTypeColor(matchedType) {
  return MATCH_TYPE_MAP[matchedType]?.color || 'info'
}

/**
 * 获取确认类型文本
 * @param {number} confirmType - 确认类型
 * @returns {string} 确认类型文本
 */
export function getConfirmTypeText(confirmType) {
  return CONFIRM_TYPE_MAP[confirmType]?.text || '未知'
}

/**
 * 获取确认类型颜色
 * @param {number} confirmType - 确认类型
 * @returns {string} Element Plus tag 颜色类型
 */
export function getConfirmTypeColor(confirmType) {
  return CONFIRM_TYPE_MAP[confirmType]?.color || 'info'
}

/**
 * 格式化价格显示
 * @param {string|number} price - 价格
 * @param {boolean} showCurrency - 是否显示货币符号
 * @returns {string} 格式化后的价格
 */
export function formatPrice(price, showCurrency = true) {
  if (!price || isNaN(price)) return '-'

  const numPrice = parseFloat(price)
  const formattedPrice = numPrice.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return showCurrency ? `¥${formattedPrice}` : formattedPrice
}

/**
 * 格式化数量显示
 * @param {string|number} quantity - 数量
 * @returns {string} 格式化后的数量
 */
export function formatQuantity(quantity) {
  if (!quantity || isNaN(quantity)) return '-'

  const numQuantity = parseFloat(quantity)

  // 如果是整数，不显示小数点
  if (numQuantity % 1 === 0) {
    return numQuantity.toString()
  }

  // 保留2位小数，去掉末尾的0
  return numQuantity.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * 验证任务ID
 * @param {string} taskId - 任务ID
 * @returns {boolean} 是否有效
 */
export function validateTaskId(taskId) {
  return taskId && typeof taskId === 'string' && taskId.trim().length > 0
}

/**
 * 构建查询参数
 * @param {Object} params - 参数对象
 * @returns {Object} 清理后的参数对象
 */
export function buildQueryParams(params) {
  const cleanParams = {}

  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value
    }
  })

  return cleanParams
}

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @returns {string} 错误消息
 */
export function handleApiError(error) {
  console.error('API错误:', error)

  if (error.response) {
    // 服务器响应错误
    const { status, data } = error.response

    switch (status) {
      case 400:
        return data?.message || '请求参数错误'
      case 401:
        return '未授权访问'
      case 403:
        return '禁止访问'
      case 404:
        return '请求的资源不存在'
      case 500:
        return '服务器内部错误'
      default:
        return data?.message || `请求失败 (${status})`
    }
  } else if (error.request) {
    // 网络错误
    return '网络连接失败，请检查网络设置'
  } else {
    // 其他错误
    return error.message || '操作失败'
  }
}

/**
 * 验证审批数据
 * @param {Array} items - 待审批项目
 * @param {string} type - 审批类型 'approve' | 'reject'
 * @param {Object} formData - 表单数据
 * @returns {Object} 验证结果
 */
export function validateApprovalData(items, type, formData) {
  const errors = []

  if (!items || items.length === 0) {
    errors.push('请选择要审批的项目')
  }

  if (type === 'reject' && (!formData.reason || formData.reason.trim().length === 0)) {
    errors.push('拒绝时必须填写拒绝理由')
  }

  if (type === 'reject' && formData.reason && formData.reason.length > 500) {
    errors.push('拒绝理由不能超过500字符')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 生成批量操作确认信息
 * @param {string} action - 操作类型
 * @param {Array} items - 操作项目
 * @returns {string} 确认信息
 */
export function generateBatchConfirmMessage(action, items) {
  const count = items.length
  const actionText = action === 'approve' ? '审批通过' : '拒绝'

  return `确定要${actionText} ${count} 个物资项目吗？此操作不可撤销。`
}

/**
 * 计算统计数据
 * @param {Array} data - 数据列表
 * @returns {Object} 统计结果
 */
export function calculateStatistics(data) {
  if (!Array.isArray(data)) {
    return {
      manualCount: 0,
      autoCount: 0,
      totalCount: 0
    }
  }

  let manualCount = 0
  let autoCount = 0

  data.forEach(item => {
    // 根据API文档的逻辑判断是否为人工修改物资
    if (item.confirmResult === 1 && [2, 3].includes(item.confirmType)) {
      manualCount++
    } else if ([1, 4].includes(item.confirmType) ||
               ([1, 3].includes(item.comparisonResult) &&
                !(item.confirmResult === 1 && [2, 3].includes(item.confirmType)))) {
      autoCount++
    }
  })

  return {
    manualCount,
    autoCount,
    totalCount: data.length
  }
}