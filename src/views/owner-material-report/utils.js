/**
 * 甲供物资报告页面工具函数
 */
import { 
  REPORT_STATUS_TEXT, 
  REPORT_STATUS_COLOR,
  STATISTICS_DIMENSIONS,
  PRICE_RANGES 
} from './constants'

/**
 * 格式化报告状态显示
 * @param {string} status 状态值
 * @returns {Object} 包含文本和颜色的对象
 */
export function formatReportStatus(status) {
  return {
    text: REPORT_STATUS_TEXT[status] || '未知状态',
    color: REPORT_STATUS_COLOR[status] || 'info'
  }
}

/**
 * 格式化日期显示
 * @param {Date|string} date 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 计算物资统计数据
 * @param {Array} materials 物资列表
 * @param {string} dimension 统计维度
 * @returns {Object} 统计结果
 */
export function calculateStatistics(materials, dimension) {
  if (!materials || !Array.isArray(materials)) return {}

  switch (dimension) {
    case STATISTICS_DIMENSIONS.BY_CATEGORY:
      return calculateByCategoryStatistics(materials)
    case STATISTICS_DIMENSIONS.BY_SUPPLIER:
      return calculateBySupplierStatistics(materials)
    case STATISTICS_DIMENSIONS.BY_STATUS:
      return calculateByStatusStatistics(materials)
    case STATISTICS_DIMENSIONS.BY_PRICE_RANGE:
      return calculateByPriceRangeStatistics(materials)
    case STATISTICS_DIMENSIONS.BY_TIME:
      return calculateByTimeStatistics(materials)
    default:
      return {}
  }
}

/**
 * 按类别统计
 * @param {Array} materials 物资列表
 * @returns {Object} 统计结果
 */
function calculateByCategoryStatistics(materials) {
  const stats = {}
  materials.forEach(material => {
    const category = material.category || '未分类'
    if (!stats[category]) {
      stats[category] = { count: 0, totalAmount: 0 }
    }
    stats[category].count += 1
    stats[category].totalAmount += Number(material.totalPrice) || 0
  })
  return stats
}

/**
 * 按供应商统计
 * @param {Array} materials 物资列表
 * @returns {Object} 统计结果
 */
function calculateBySupplierStatistics(materials) {
  const stats = {}
  materials.forEach(material => {
    const supplier = material.supplier || '未知供应商'
    if (!stats[supplier]) {
      stats[supplier] = { count: 0, totalAmount: 0 }
    }
    stats[supplier].count += 1
    stats[supplier].totalAmount += Number(material.totalPrice) || 0
  })
  return stats
}

/**
 * 按状态统计
 * @param {Array} materials 物资列表
 * @returns {Object} 统计结果
 */
function calculateByStatusStatistics(materials) {
  const stats = {}
  materials.forEach(material => {
    const status = material.status !== undefined ? material.status : '未知状态'
    if (!stats[status]) {
      stats[status] = { count: 0, totalAmount: 0 }
    }
    stats[status].count += 1
    stats[status].totalAmount += Number(material.totalPrice) || 0
  })
  return stats
}

/**
 * 按价格区间统计
 * @param {Array} materials 物资列表
 * @returns {Object} 统计结果
 */
function calculateByPriceRangeStatistics(materials) {
  const stats = {}
  
  // 初始化价格区间
  PRICE_RANGES.forEach(range => {
    stats[range.label] = { count: 0, totalAmount: 0 }
  })
  
  materials.forEach(material => {
    const price = Number(material.unitPrice) || 0
    const range = PRICE_RANGES.find(r => {
      if (r.max === null) {
        return price >= r.min
      }
      return price >= r.min && price < r.max
    })
    
    if (range) {
      stats[range.label].count += 1
      stats[range.label].totalAmount += Number(material.totalPrice) || 0
    }
  })
  
  return stats
}

/**
 * 按时间统计
 * @param {Array} materials 物资列表
 * @returns {Object} 统计结果
 */
function calculateByTimeStatistics(materials) {
  const stats = {}
  materials.forEach(material => {
    const date = material.createdAt ? new Date(material.createdAt) : new Date()
    const dateKey = date.toLocaleDateString('zh-CN')
    
    if (!stats[dateKey]) {
      stats[dateKey] = { count: 0, totalAmount: 0 }
    }
    stats[dateKey].count += 1
    stats[dateKey].totalAmount += Number(material.totalPrice) || 0
  })
  return stats
}

/**
 * 生成图表数据
 * @param {Object} statistics 统计数据
 * @param {string} chartType 图表类型
 * @returns {Object} 图表配置
 */
export function generateChartData(statistics, chartType) {
  const labels = Object.keys(statistics)
  const counts = labels.map(label => statistics[label].count)
  const amounts = labels.map(label => statistics[label].totalAmount)

  switch (chartType) {
    case 'bar':
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '数量',
              data: counts,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: '金额',
              data: amounts,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '物资统计图表'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      }
    
    case 'pie':
      return {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '物资分布图'
            }
          }
        }
      }
    
    default:
      return null
  }
}

/**
 * 生成报告摘要
 * @param {Array} materials 物资列表
 * @returns {Object} 报告摘要
 */
export function generateReportSummary(materials) {
  if (!materials || !Array.isArray(materials)) {
    return {
      totalCount: 0,
      totalAmount: 0,
      averagePrice: 0,
      categories: 0,
      suppliers: 0
    }
  }

  const totalCount = materials.length
  const totalAmount = materials.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)
  const averagePrice = totalCount > 0 ? totalAmount / totalCount : 0
  
  const categories = new Set(materials.map(item => item.category).filter(Boolean)).size
  const suppliers = new Set(materials.map(item => item.supplier).filter(Boolean)).size

  return {
    totalCount,
    totalAmount,
    averagePrice,
    categories,
    suppliers
  }
}

/**
 * 导出报告
 * @param {Object} reportData 报告数据
 * @param {string} format 导出格式
 * @param {string} filename 文件名
 */
export function exportReport(reportData, format, filename = '甲供物资报告') {
  switch (format) {
    case 'pdf':
      exportToPDF(reportData, filename)
      break
    case 'excel':
      exportToExcel(reportData, filename)
      break
    case 'word':
      exportToWord(reportData, filename)
      break
    case 'image':
      exportToImage(reportData, filename)
      break
    default:
      console.warn('不支持的导出格式:', format)
  }
}

/**
 * 导出为PDF
 * @param {Object} data 报告数据
 * @param {string} filename 文件名
 */
function exportToPDF(data, filename) {
  // 这里可以集成第三方PDF导出库，如 jsPDF
  console.log('导出PDF功能待实现', { data, filename })
}

/**
 * 导出为Excel
 * @param {Object} data 报告数据
 * @param {string} filename 文件名
 */
function exportToExcel(data, filename) {
  // 这里可以集成第三方Excel导出库，如 xlsx
  console.log('导出Excel功能待实现', { data, filename })
}

/**
 * 导出为Word
 * @param {Object} data 报告数据
 * @param {string} filename 文件名
 */
function exportToWord(data, filename) {
  // 这里可以集成第三方Word导出库，如 docx
  console.log('导出Word功能待实现', { data, filename })
}

/**
 * 导出为图片
 * @param {Object} data 报告数据
 * @param {string} filename 文件名
 */
function exportToImage(data, filename) {
  // 这里可以实现图片导出逻辑，如html2canvas
  console.log('导出图片功能待实现', { data, filename })
}

/**
 * 验证报告配置
 * @param {Object} config 报告配置
 * @returns {Object} 验证结果
 */
export function validateReportConfig(config) {
  const errors = []
  
  if (!config.title?.trim()) {
    errors.push('报告标题不能为空')
  }
  
  if (!config.dateRange?.start || !config.dateRange?.end) {
    errors.push('请选择报告时间范围')
  }
  
  if (config.dateRange?.start && config.dateRange?.end && 
      new Date(config.dateRange.start) > new Date(config.dateRange.end)) {
    errors.push('开始时间不能晚于结束时间')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}