// 乙供物资审批管理页面工具函数

import { ElMessage, ElMessageBox } from 'element-plus'
import { MESSAGE_CONFIG } from './constants'

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化金额
 * @param {number|string} amount - 金额
 * @param {string} prefix - 前缀符号
 * @returns {string} 格式化后的金额字符串
 */
export const formatAmount = (amount, prefix = '¥') => {
  if (amount === null || amount === undefined || amount === '') return '-'
  const num = parseFloat(amount)
  if (isNaN(num)) return '-'
  return `${prefix}${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * 格式化数量
 * @param {number|string} quantity - 数量
 * @returns {string} 格式化后的数量字符串
 */
export const formatQuantity = (quantity) => {
  if (quantity === null || quantity === undefined || quantity === '') return '-'
  const num = parseFloat(quantity)
  if (isNaN(num)) return '-'
  return num.toLocaleString()
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-100）
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const num = parseFloat(value)
  if (isNaN(num)) return '-'
  return `${num.toFixed(1)}%`
}

/**
 * 确认转正操作
 * @param {Array|Object} selection - 选中的记录
 * @returns {Promise<Object>} 确认结果
 */
export const confirmPromote = async (selection) => {
  const isBatch = Array.isArray(selection)
  const count = isBatch ? selection.length : 1
  
  if (isBatch && count === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return { confirmed: false }
  }
  
  try {
    await ElMessageBox.confirm(
      `${MESSAGE_CONFIG.CONFIRM_PROMOTE}\n选中${isBatch ? `的 ${count} 条` : '该条'}记录将转为正式数据。`,
      '转正确认',
      {
        confirmButtonText: '确定转正',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    return {
      confirmed: true
    }
  } catch (error) {
    return { confirmed: false }
  }
}

/**
 * 确认删除操作
 * @param {Array|Object} selection - 选中的记录
 * @returns {Promise<Object>} 确认结果
 */
export const confirmDelete = async (selection) => {
  const isBatch = Array.isArray(selection)
  const count = isBatch ? selection.length : 1
  
  if (isBatch && count === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return { confirmed: false }
  }
  
  try {
    await ElMessageBox.confirm(
      `${MESSAGE_CONFIG.CONFIRM_DELETE}\n选中${isBatch ? `的 ${count} 条` : '该条'}记录将被永久删除。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    return {
      confirmed: true
    }
  } catch (error) {
    return { confirmed: false }
  }
}

/**
 * 导出数据到Excel
 * @param {Array} data - 要导出的数据
 * @param {string} filename - 文件名
 */
export const exportToExcel = async (data, filename = '临时数据记录') => {
  // 使用filename参数避免ESLint警告
  const exportFileName = filename
  try {
    // 这里应该调用实际的导出API或使用前端导出库
    // 暂时使用模拟实现
    console.log('导出数据:', data, '文件名:', exportFileName)
    
    // 模拟导出延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(MESSAGE_CONFIG.EXPORT_SUCCESS)
    return true
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error(MESSAGE_CONFIG.EXPORT_ERROR)
    return false
  }
}

/**
 * 格式化临时数据显示
 * @param {Object} item - 数据项
 * @param {String} type - 数据类型 ('baseInfo' | 'price')
 * @returns {Object} 格式化后的数据
 */
export const formatTemporaryData = (item, type) => {
  const baseFormat = {
    id: item.id,
    associatedTaskId: item.associatedTaskId,
    dataType: type,
    createTime: formatDateTime(item.bstudioCreateTime)
  }
  
  if (type === 'baseInfo') {
    return {
      ...baseFormat,
      materialName: item.materialName || '-',
      specificationModel: item.specificationModel || '-',
      unit: item.unit || '-',
      materialCode: item.materialCode || '-',
      priceCode: item.priceCode || '-',
      businessDomain: item.businessDomain || '-',
      serialNumber: item.serialNumber || '-',
      type: item.type || '-'
    }
  } else if (type === 'price') {
    return {
      ...baseFormat,
      baseInfoId: item.baseInfoId || '-',
      quarter: item.quarter || '-',
      taxPrice: item.taxPrice,
      taxExcludedPrice: item.taxExcludedPrice,
      priceUnit: item.unit || '-'
    }
  }
  
  return baseFormat
}

/**
 * 生成Mock数据（用于开发测试）
 * @param {number} count - 生成数量
 * @returns {Array} Mock数据数组
 */
export const generateMockData = (count = 20) => {
  const mockData = []
  const statuses = [0, 1, 2]
  const dataTypes = [0, 1, 2, 3, 4] // 临时数据、已验证、待验证、历史数据、手动添加
  const users = ['张三', '李四', '王五', '赵六', '临时用户']
  const materials = ['临时物资A', '临时物资B', '测试设备', '样品材料', '临时工具', '临时配件']
  const specs = ['TEMP-001', 'TEST-002', 'SAMPLE-003', 'TEMP-004', 'MANUAL-005']
  const units = ['个', '台', '套', '件', '批']
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)]
    
    mockData.push({
      id: `TEMP${String(i).padStart(6, '0')}`,
      taskId: `DATA${String(Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`,
      taskName: `临时数据任务_${Math.floor(Math.random() * 100) + 1}`,
      submitTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      submitter: users[Math.floor(Math.random() * users.length)],
      
      materialName: materials[Math.floor(Math.random() * materials.length)],
      specifications: specs[Math.floor(Math.random() * specs.length)],
      unit: units[Math.floor(Math.random() * units.length)],
      quantity: Math.floor(Math.random() * 500) + 10,
      unitPrice: (Math.random() * 500 + 10).toFixed(2),
      
      matchedType: dataType,
      matchScore: dataType === 0 ? Math.floor(Math.random() * 60) + 20 : Math.floor(Math.random() * 30) + 70,
      confirmedBy: users[Math.floor(Math.random() * users.length)],
      confirmTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      
      approvalStatus: status,
      approvedBy: status === 0 ? null : users[Math.floor(Math.random() * users.length)],
      approvalTime: status === 0 ? null : new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      approvalRemark: status === 0 ? null : (status === 1 ? '数据验证通过，可以使用' : '数据不完整，需要补充')
    })
  }
  
  return mockData
}

/**
 * 过滤临时数据
 * @param {Array} data - 原始数据
 * @param {Object} filters - 筛选条件
 * @returns {Array} 过滤后的数据
 */
export const filterTemporaryData = (data, filters) => {
  return data.filter(item => {
    // 数据类型筛选
    if (filters.dataType !== '' && filters.dataType !== undefined) {
      if (item.dataType !== filters.dataType) return false
    }
    
    // 任务ID筛选
    if (filters.taskId) {
      if (item.associatedTaskId !== filters.taskId) return false
    }
    
    // 关键词搜索 - 根据数据类型搜索不同字段
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      let searchFields = [
        item.id,
        item.associatedTaskId
      ]
      
      if (item.dataType === 'baseInfo') {
        searchFields = searchFields.concat([
          item.materialName,
          item.specificationModel,
          item.materialCode,
          item.priceCode
        ])
      } else if (item.dataType === 'price') {
        searchFields = searchFields.concat([
          item.baseInfoId,
          item.quarter,
          item.priceUnit
        ])
      }
      
      const matched = searchFields.some(field => 
        field && field.toString().toLowerCase().includes(keyword)
      )
      
      if (!matched) return false
    }
    
    // 日期范围筛选
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange
      const createTime = new Date(item.createTime)
      if (createTime < start || createTime > end) return false
    }
    
    return true
  })
}

/**
 * 计算临时数据统计
 * @param {Array} data - 数据数组
 * @returns {Object} 统计结果
 */
export const calculateTemporaryDataStatistics = (data) => {
  const stats = {
    total: data.length,
    baseInfoCount: 0,
    priceCount: 0,
    pendingCount: data.length // 临时数据都是待处理状态
  }
  
  data.forEach(item => {
    if (item.dataType === 'baseInfo') {
      stats.baseInfoCount++
    } else if (item.dataType === 'price') {
      stats.priceCount++
    }
  })
  
  return stats
}