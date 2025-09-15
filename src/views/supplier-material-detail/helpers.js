/**
 * 供应商物资详情页辅助函数
 *
 * 文件说明：
 * 用于提取和整理页面中的重复逻辑，提高代码的可维护性和复用性
 *
 * 主要功能：
 * 1. 价格状态判断辅助函数
 * 2. 物资数据处理辅助函数
 * 3. 操作状态判断辅助函数
 * 4. 数据格式化辅助函数
 */

// ===== 价格状态判断辅助函数 =====
export const PriceStatusHelper = {
  /**
   * 获取价格匹配状态
   * @param {Object} row - 表格行数据
   * @returns {number|null} 价格匹配状态
   */
  getPriceStatus(row) {
    // 优先使用与matchOptions同级的priceMatchedStatus字段
    return row.priceMatchedStatus ||
           (row.matchOptions?.[0]?.priceMatchedStatus) ||
           null
  },

  /**
   * 判断是否为价格不存在状态
   * @param {Object} row - 表格行数据
   * @returns {boolean} 是否价格不存在
   */
  isPriceNotFound(row) {
    const priceStatus = this.getPriceStatus(row)
    return priceStatus === -1
  },

  /**
   * 判断是否为价格不一致状态
   * @param {Object} row - 表格行数据
   * @returns {boolean} 是否价格不一致
   */
  isPriceMismatch(row) {
    const priceStatus = this.getPriceStatus(row)
    return priceStatus === 2
  },

  /**
   * 判断是否为价格精确匹配状态
   * @param {Object} row - 表格行数据
   * @returns {boolean} 是否价格精确匹配
   */
  isPriceExactMatch(row) {
    const priceStatus = this.getPriceStatus(row)
    return priceStatus === 1
  },

  /**
   * 获取价格状态的描述文本
   * @param {Object} row - 表格行数据
   * @returns {string} 价格状态描述
   */
  getPriceStatusText(row) {
    const priceStatus = this.getPriceStatus(row)

    switch (priceStatus) {
      case -1:
        return '价格信息不存在'
      case 1:
        return '精确匹配'
      case 2:
        return '价格不一致'
      default:
        return '未知状态'
    }
  }
}

// ===== 物资数据处理辅助函数 =====
export const MaterialDataHelper = {
  /**
   * 从行数据中提取基础物资信息
   * @param {Object} row - 表格行数据
   * @returns {Object} 基础物资信息
   */
  extractBaseInfo(row) {
    if (!row) {
      return {
        id: null,
        materialName: '',
        specifications: '',
        unit: '',
        displayName: '',
        displaySpec: '',
        displayUnit: ''
      }
    }

    return {
      // 基础ID
      id: row.baseInfo?.id || null,

      // 原始信息
      materialName: row.materialName || '',
      specifications: row.specifications || '',
      unit: row.unit || '',

      // 显示用信息（优先使用baseInfo中的信息）
      displayName: row.baseInfo?.materialName || row.materialName || '',
      displaySpec: row.baseInfo?.specifications || row.specifications || '',
      displayUnit: row.baseInfo?.unit || row.unit || '',

      // 保留原始行数据引用
      originalRow: row
    }
  },

  /**
   * 检查基础物资信息是否完整
   * @param {Object} row - 表格行数据
   * @returns {boolean} 是否信息完整
   */
  isBaseInfoComplete(row) {
    const baseInfo = this.extractBaseInfo(row)
    return !!(baseInfo.id && baseInfo.displayName)
  },

  /**
   * 获取物资显示名称（带规格）
   * @param {Object} row - 表格行数据
   * @returns {string} 完整的物资显示名称
   */
  getFullDisplayName(row) {
    const baseInfo = this.extractBaseInfo(row)
    const name = baseInfo.displayName
    const spec = baseInfo.displaySpec

    if (spec && spec !== '-') {
      return `${name} (${spec})`
    }
    return name
  }
}

// ===== 操作状态判断辅助函数 =====
export const OperationStatusHelper = {
  /**
   * 判断操作行应该显示的操作类型
   * @param {Object} row - 表格行数据
   * @returns {string} 操作类型
   */
  getOperationType(row) {
    // 已确认状态
    if (Number(row.confirmResult) === 1) {
      return 'confirmed'
    }

    // 未匹配状态
    if (Number(row.matchedType) === 0) {
      return row.hasUserSelectedData ? 'no-match-selected' : 'no-match-unselected'
    }

    // 价格不存在状态（新增）
    if (PriceStatusHelper.isPriceNotFound(row)) {
      return 'price-not-found'
    }

    // 价格不一致状态
    if (PriceStatusHelper.isPriceMismatch(row)) {
      return 'price-mismatch'
    }

    // 精确匹配状态
    if (Number(row.matchedType) === 1) {
      return 'exact-match'
    }

    // 相似匹配状态
    if ([2, 3, 4].includes(Number(row.matchedType))) {
      return 'similar-match'
    }

    // 其他状态
    return 'other'
  },

  /**
   * 判断是否可以进行快速确认
   * @param {Object} row - 表格行数据
   * @returns {boolean} 是否可以快速确认
   */
  canQuickConfirm(row) {
    return Number(row.matchedType) === 1 &&
           !PriceStatusHelper.isPriceMismatch(row) &&
           !PriceStatusHelper.isPriceNotFound(row)
  },

  /**
   * 判断是否需要显示操作按钮
   * @returns {boolean} 是否需要显示操作按钮
   */
  shouldShowOperationButtons() {
    // 已确认的状态仍然显示重选按钮
    return true
  }
}

// ===== 数据格式化辅助函数 =====
export const DataFormatHelper = {
  /**
   * 格式化价格显示
   * @param {number|string} price - 价格值
   * @param {number} precision - 精度，默认2位小数
   * @returns {string} 格式化后的价格字符串
   */
  formatPrice(price, precision = 2) {
    if (price === null || price === undefined || price === '') {
      return '-'
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price)

    if (isNaN(numPrice)) {
      return '-'
    }

    return `¥${numPrice.toFixed(precision)}`
  },

  /**
   * 格式化季度显示
   * @param {string} quarter - 季度字符串（如2024Q1）
   * @returns {string} 格式化后的季度显示
   */
  formatQuarter(quarter) {
    if (!quarter) {
      return '-'
    }

    const match = quarter.match(/^(\d{4})Q(\d)$/)
    if (match) {
      const [, year, q] = match
      const quarterNames = ['', '第一季度', '第二季度', '第三季度', '第四季度']
      return `${year}年${quarterNames[parseInt(q)] || '未知季度'}`
    }

    return quarter
  },

  /**
   * 格式化税率显示
   * @param {number} taxRate - 税率（0-1之间的小数）
   * @returns {string} 格式化后的税率显示
   */
  formatTaxRate(taxRate) {
    if (taxRate === null || taxRate === undefined) {
      return '-'
    }

    const rate = typeof taxRate === 'number' ? taxRate : parseFloat(taxRate)

    if (isNaN(rate)) {
      return '-'
    }

    return `${(rate * 100).toFixed(2)}%`
  }
}

// ===== 验证辅助函数 =====
export const ValidationHelper = {
  /**
   * 验证基础物资信息是否可以新增价格
   * @param {Object} row - 表格行数据
   * @returns {Object} 验证结果 { isValid: boolean, message: string }
   */
  validateForPriceAddition(row) {
    // 检查基础物资信息是否存在
    if (!MaterialDataHelper.isBaseInfoComplete(row)) {
      return {
        isValid: false,
        message: '物资基础信息不完整，无法新增价格'
      }
    }

    // 检查是否为价格不存在状态
    if (!PriceStatusHelper.isPriceNotFound(row)) {
      return {
        isValid: false,
        message: '当前状态不需要新增价格'
      }
    }

    return {
      isValid: true,
      message: '可以新增价格'
    }
  },

  /**
   * 验证季度格式
   * @param {string} quarter - 季度字符串
   * @returns {boolean} 是否为有效的季度格式
   */
  isValidQuarter(quarter) {
    return /^\d{4}Q[1-4]$/.test(quarter)
  },

  /**
   * 验证价格值
   * @param {number|string} price - 价格值
   * @returns {boolean} 是否为有效的价格
   */
  isValidPrice(price) {
    if (price === null || price === undefined || price === '') {
      return false
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price)
    return !isNaN(numPrice) && numPrice > 0
  }
}

// ===== 调试辅助函数 =====
export const DebugHelper = {
  /**
   * 输出行数据的关键信息（用于调试）
   * @param {Object} row - 表格行数据
   * @param {string} context - 调试上下文
   */
  logRowInfo(row, context = '') {
    if (!row) {
      console.log(`【调试${context}】行数据为空`)
      return
    }

    const info = {
      context,
      materialName: row.materialName,
      matchedType: row.matchedType,
      confirmResult: row.confirmResult,
      priceStatus: PriceStatusHelper.getPriceStatus(row),
      operationType: OperationStatusHelper.getOperationType(row),
      baseInfoId: row.baseInfo?.id
    }

    console.log(`【调试${context}】行信息:`, info)
  },

  /**
   * 输出价格相关信息（用于调试）
   * @param {Object} row - 表格行数据
   * @param {string} context - 调试上下文
   */
  logPriceInfo(row, context = '') {
    if (!row) {
      console.log(`【价格调试${context}】行数据为空`)
      return
    }

    const info = {
      context,
      priceStatus: PriceStatusHelper.getPriceStatus(row),
      isPriceNotFound: PriceStatusHelper.isPriceNotFound(row),
      isPriceMismatch: PriceStatusHelper.isPriceMismatch(row),
      unitPrice: row.unitPrice,
      taxPrice: row.taxPrice,
      priceInfo: row.priceInfo
    }

    console.log(`【价格调试${context}】价格信息:`, info)
  }
}

// ===== 默认导出 =====
export default {
  PriceStatusHelper,
  MaterialDataHelper,
  OperationStatusHelper,
  DataFormatHelper,
  ValidationHelper,
  DebugHelper
}