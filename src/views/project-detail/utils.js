// 项目详情页面业务逻辑工具函数

import { ElMessage } from 'element-plus'

/**
 * 获取项目详情Mock数据
 * @param {string} projectId - 项目ID
 * @returns {Object} 项目详情数据
 */
export const getProjectDetailMockData = (projectId) => {
  const baseDate = new Date()
  
  return {
    // 项目基础信息
    projectId: projectId || 'PRJ2024001',
    projectCode: `CODE-${projectId || 'PRJ2024001'}`,
    projectName: `${projectId || 'PRJ2024001'} 智能大厦建设项目`,
    projectType: '建筑工程',
    startDate: new Date(baseDate.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date(baseDate.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: 15000000, // 1500万
    
    // 合同信息 - 支持一个项目对应多个合同（一对多）
    contracts: [
      {
        contractId: `CONTRACT-001`,
        contractCode: `CONT-2024-001`,
        contractName: `智慧园区综合开发总承包合同`,
        contractType: '施工总承包',
        partyA: '某地产开发有限公司',
        partyB: '某建筑工程有限公司',
        contractAmount: 32000000, // 合同金额
        signDate: new Date(baseDate.getTime() - 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '项目主体建设总承包合同'
      },
      {
        contractId: `CONTRACT-002`,
        contractCode: `CONT-2024-008`,
        contractName: `专业设备采购安装合同`,
        contractType: '采购安装合同',
        partyA: '某地产开发有限公司',
        partyB: '设备供应安装有限公司',
        contractAmount: 15000000, // 合同金额
        signDate: new Date(baseDate.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '专业设备采购和安装服务合同'
      },
      {
        contractId: `CONTRACT-003`,
        contractCode: `CONT-2024-015`,
        contractName: `智能化系统集成合同`,
        contractType: '系统集成合同',
        partyA: '某地产开发有限公司',
        partyB: '智能化系统有限公司',
        contractAmount: 8500000, // 合同金额
        signDate: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '楼宇智能化系统集成合同'
      },
      {
        contractId: `CONTRACT-004`,
        contractCode: `CONT-2024-022`,
        contractName: `景观绿化工程合同`,
        contractType: '绿化工程合同',
        partyA: '某地产开发有限公司',
        partyB: '园林绿化有限公司',
        contractAmount: 3200000, // 合同金额
        signDate: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '项目周边景观绿化工程合同'
      }
    ],
    
    // 统计信息
    ownerMaterialStats: {
      totalCount: 8,
      matchedCount: 6,
      unmatchedCount: 2,
      matchRate: 75
    },
    supplierMaterialStats: {
      totalCount: 12,
      matchedCount: 6,
      unmatchedCount: 6,
      matchRate: 50
    }
  }
}

/**
 * 获取甲供物资Mock数据
 * @returns {Array} 甲供物资列表
 */
export const getOwnerMaterialMockData = () => {
  return [
    {
      materialId: 'OM001',
      materialName: '高强度钢筋',
      specification: 'HRB400 φ32',
      unit: '吨',
      quantity: 500,
      unitPrice: 4500,
      totalPrice: 2250000,
      supplier: '钢铁集团有限公司',
      deliveryDate: '2024-03-15',
      materialStatus: 'matched',
      remark: '按计划交付，质量符合要求'
    },
    {
      materialId: 'OM002',
      materialName: '混凝土预制板',
      specification: 'C30 200×50×10cm',
      unit: '块',
      quantity: 1000,
      unitPrice: 280,
      totalPrice: 280000,
      supplier: '预制构件有限公司',
      deliveryDate: '2024-04-20',
      materialStatus: 'matched',
      remark: '预计按期到达现场'
    },
    {
      materialId: 'OM003',
      materialName: '防水材料',
      specification: 'SBS改性沥青防水卷材',
      unit: '平方米',
      quantity: 5000,
      unitPrice: 85,
      totalPrice: 425000,
      supplier: '防水材料有限公司',
      deliveryDate: '2024-05-10',
      materialStatus: 'matched',
      remark: '等待供应商排产'
    },
    {
      materialId: 'OM004',
      materialName: '铝合金门窗',
      specification: '断桥铝合金 70系列',
      unit: '平方米',
      quantity: 800,
      unitPrice: 450,
      totalPrice: 360000,
      supplier: '门窗制造有限公司',
      deliveryDate: '2024-06-15',
      materialStatus: 'matched',
      remark: '定制产品，生产周期较长'
    },
    {
      materialId: 'OM005',
      materialName: '保温板材',
      specification: 'XPS挤塑聚苯乙烯保温板',
      unit: '立方米',
      quantity: 200,
      unitPrice: 320,
      totalPrice: 64000,
      supplier: '保温材料有限公司',
      deliveryDate: '2024-04-25',
      materialStatus: 'matched',
      remark: '环保型材料，符合标准'
    },
    {
      materialId: 'OM006',
      materialName: '电梯设备',
      specification: '客梯 1600kg 1.75m/s',
      unit: '部',
      quantity: 4,
      unitPrice: 350000,
      totalPrice: 1400000,
      supplier: '电梯制造有限公司',
      deliveryDate: '2024-07-20',
      materialStatus: 'matched',
      remark: '高档电梯，含安装调试'
    },
    {
      materialId: 'OM007',
      materialName: '石材幕墙',
      specification: '花岗岩幕墙 30mm厚',
      unit: '平方米',
      quantity: 1200,
      unitPrice: 800,
      totalPrice: 960000,
      supplier: '幕墙工程有限公司',
      deliveryDate: '2024-08-10',
      materialStatus: 'unmatched',
      remark: '待确认石材颜色和纹理'
    },
    {
      materialId: 'OM008',
      materialName: '中央空调设备',
      specification: '水冷螺杆机组 800RT',
      unit: '台',
      quantity: 2,
      unitPrice: 1200000,
      totalPrice: 2400000,
      supplier: '空调设备有限公司',
      deliveryDate: '2024-09-15',
      materialStatus: 'unmatched',
      remark: '大型设备，需要专业安装队伍'
    }
  ]
}

/**
 * 获取乙供物资Mock数据
 * @returns {Array} 乙供物资列表
 */
export const getSupplierMaterialMockData = () => {
  return [
    {
      materialId: 'SM001',
      materialName: '电缆线材',
      specification: 'YJV22-3×240+1×120',
      unit: '米',
      quantity: 2000,
      estimatedPrice: 120,
      actualPrice: 115,
      totalCost: 230000,
      contractor: '电力工程有限公司',
      matchingStatus: 'matched',
      remark: '按计划进行，预计本月底完成'
    },
    {
      materialId: 'SM002',
      materialName: '通风设备',
      specification: '轴流风机 φ800mm',
      unit: '台',
      quantity: 12,
      estimatedPrice: 8500,
      actualPrice: 8200,
      totalCost: 98400,
      contractor: '通风工程有限公司',
      matchingStatus: 'matched',
      remark: '已验收合格'
    },
    {
      materialId: 'SM003',
      materialName: '给排水管材',
      specification: 'PPR热水管 DN25',
      unit: '米',
      quantity: 3000,
      estimatedPrice: 45,
      actualPrice: 42,
      totalCost: 126000,
      contractor: '管道工程有限公司',
      matchingStatus: 'matched',
      remark: '安装进度良好'
    },
    {
      materialId: 'SM004',
      materialName: '照明灯具',
      specification: 'LED筒灯 15W',
      unit: '套',
      quantity: 500,
      estimatedPrice: 180,
      actualPrice: 175,
      totalCost: 87500,
      contractor: '照明工程有限公司',
      matchingStatus: 'partial',
      remark: '部分区域已完成安装'
    },
    {
      materialId: 'SM005',
      materialName: '消防设备',
      specification: '烟感探测器',
      unit: '个',
      quantity: 200,
      estimatedPrice: 150,
      actualPrice: 145,
      totalCost: 29000,
      contractor: '消防工程有限公司',
      matchingStatus: 'unmatched',
      remark: '等待消防验收'
    },
    {
      materialId: 'SM006',
      materialName: '地面材料',
      specification: '复合地板 12mm',
      unit: '平方米',
      quantity: 8000,
      estimatedPrice: 120,
      actualPrice: 118,
      totalCost: 944000,
      contractor: '装饰工程有限公司',
      matchingStatus: 'partial',
      remark: '办公区域优先施工'
    },
    {
      materialId: 'SM007',
      materialName: '墙面涂料',
      specification: '乳胶漆 内墙专用',
      unit: '桶',
      quantity: 100,
      estimatedPrice: 280,
      actualPrice: 275,
      totalCost: 27500,
      contractor: '涂装工程有限公司',
      matchingStatus: 'matched',
      remark: '大部分区域已完工'
    },
    {
      materialId: 'SM008',
      materialName: '弱电系统',
      specification: '综合布线系统',
      unit: '套',
      quantity: 1,
      estimatedPrice: 450000,
      actualPrice: 435000,
      totalCost: 435000,
      contractor: '弱电工程有限公司',
      matchingStatus: 'matched',
      remark: '网络设备已安装完成'
    },
    {
      materialId: 'SM009',
      materialName: '卫浴设备',
      specification: '卫浴三件套',
      unit: '套',
      quantity: 50,
      estimatedPrice: 1200,
      actualPrice: 1180,
      totalCost: 59000,
      contractor: '卫浴安装有限公司',
      matchingStatus: 'unmatched',
      remark: '部分楼层开始安装'
    },
    {
      materialId: 'SM010',
      materialName: '安全设施',
      specification: '防护栏杆 不锈钢',
      unit: '米',
      quantity: 500,
      estimatedPrice: 350,
      actualPrice: 340,
      totalCost: 170000,
      contractor: '安全设施有限公司',
      matchingStatus: 'matched',
      remark: '基本安装完成'
    },
    {
      materialId: 'SM011',
      materialName: '智能化系统',
      specification: '楼宇自控系统',
      unit: '套',
      quantity: 1,
      estimatedPrice: 800000,
      actualPrice: 750000,
      totalCost: 750000,
      contractor: '智能化工程有限公司',
      matchingStatus: 'partial',
      remark: '软件调试阶段'
    },
    {
      materialId: 'SM012',
      materialName: '景观绿化',
      specification: '绿化工程',
      unit: '项',
      quantity: 1,
      estimatedPrice: 200000,
      actualPrice: 195000,
      totalCost: 195000,
      contractor: '园林绿化有限公司',
      matchingStatus: 'unmatched',
      remark: '等待合适植树季节'
    }
  ]
}

/**
 * 格式化货币金额
 * @param {number} amount - 金额
 * @returns {string} 格式化后的金额字符串
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-'
  return `¥${amount.toLocaleString('zh-CN')}`
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式类型 'date' | 'datetime'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'date') => {
  if (!date) return '-'
  
  try {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    
    if (format === 'datetime') {
      const hours = d.getHours().toString().padStart(2, '0')
      const minutes = d.getMinutes().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }
    
    return `${year}-${month}-${day}`
  } catch {
    return date.toString()
  }
}

/**
 * 格式化百分比
 * @param {number} value - 数值
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercentage = (value) => {
  if (!value && value !== 0) return '-'
  return `${value}%`
}

/**
 * 获取状态标签配置
 * @param {string} type - 状态类型
 * @param {string} status - 状态值
 * @returns {Object} 状态配置对象
 */
export const getStatusConfig = (type, status) => {
  const configs = {
    project: {
      active: { type: 'success', text: '进行中' },
      completed: { type: 'info', text: '已完成' },
      pending: { type: 'warning', text: '待开始' },
      suspended: { type: 'danger', text: '已暂停' }
    },
    material: {
      matched: { type: 'success', text: '已匹配' },
      unmatched: { type: 'danger', text: '未匹配' },
      partial: { type: 'warning', text: '部分匹配' }
    }
  }
  
  return configs[type]?.[status] || { type: 'info', text: status || '-' }
}

/**
 * 计算统计数据
 * @param {Array} data - 数据列表
 * @param {string} type - 统计类型 'owner' | 'supplier'
 * @returns {Object} 统计结果
 */
export const calculateStats = (data, type) => {
  if (!data || data.length === 0) {
    return type === 'owner' 
      ? { totalCount: 0, matchedCount: 0, unmatchedCount: 0, matchRate: 0 }
      : { totalCount: 0, completedCount: 0, inProgressCount: 0, avgCompletionRate: 0 }
  }
  
  if (type === 'owner') {
    const totalCount = data.length
    const matchedCount = data.filter(item => item.materialStatus === 'matched').length
    const unmatchedCount = totalCount - matchedCount
    const matchRate = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0
    
    return { totalCount, matchedCount, unmatchedCount, matchRate }
  }
  
  if (type === 'supplier') {
    const totalCount = data.length
    const matchedCount = data.filter(item => item.matchingStatus === 'matched').length
    const unmatchedCount = data.filter(item => item.matchingStatus === 'unmatched').length
    const partialCount = totalCount - matchedCount - unmatchedCount
    const matchRate = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0
    
    return { totalCount, matchedCount, unmatchedCount, partialCount, matchRate }
  }
  
  return {}
}

/**
 * 导出数据到Excel（模拟）
 * @param {Array} data - 数据列表  
 * @param {string} filename - 文件名
 * @returns {Promise<void>}
 */
export const exportToExcel = async (data, filename) => {
  try {
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success(`${filename} 导出成功！`)
  } catch (error) {
    ElMessage.error('导出失败，请重试')
    throw error
  }
}

/**
 * 处理数据加载错误
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 */
export const handleDataLoadError = (error, context = '数据加载') => {
  console.error(`${context}失败:`, error)
  ElMessage.error(`${context}失败，请刷新页面重试`)
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}