/**
 * 甲供物资报告页面常量定义
 */

// 报告类型
export const REPORT_TYPES = {
  SUMMARY: 'summary',           // 汇总报告
  DETAILED: 'detailed',         // 详细报告
  STATISTICAL: 'statistical',   // 统计报告
  COMPARISON: 'comparison'      // 对比报告
}

// 报告类型文本映射
export const REPORT_TYPE_TEXT = {
  [REPORT_TYPES.SUMMARY]: '汇总报告',
  [REPORT_TYPES.DETAILED]: '详细报告',
  [REPORT_TYPES.STATISTICAL]: '统计报告',
  [REPORT_TYPES.COMPARISON]: '对比报告'
}

// 报告状态
export const REPORT_STATUS = {
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

// 报告状态文本映射
export const REPORT_STATUS_TEXT = {
  [REPORT_STATUS.GENERATING]: '生成中',
  [REPORT_STATUS.COMPLETED]: '已完成',
  [REPORT_STATUS.FAILED]: '生成失败'
}

// 报告状态颜色映射
export const REPORT_STATUS_COLOR = {
  [REPORT_STATUS.GENERATING]: 'warning',
  [REPORT_STATUS.COMPLETED]: 'success',
  [REPORT_STATUS.FAILED]: 'danger'
}

// 图表类型
export const CHART_TYPES = {
  BAR: 'bar',           // 柱状图
  PIE: 'pie',           // 饼图
  LINE: 'line',         // 折线图
  RADAR: 'radar',       // 雷达图
  SCATTER: 'scatter'    // 散点图
}

// 统计维度
export const STATISTICS_DIMENSIONS = {
  BY_CATEGORY: 'category',      // 按类别统计
  BY_SUPPLIER: 'supplier',      // 按供应商统计
  BY_STATUS: 'status',          // 按状态统计
  BY_PRICE_RANGE: 'priceRange', // 按价格区间统计
  BY_TIME: 'time'               // 按时间统计
}

// 统计维度文本映射
export const STATISTICS_DIMENSIONS_TEXT = {
  [STATISTICS_DIMENSIONS.BY_CATEGORY]: '按类别统计',
  [STATISTICS_DIMENSIONS.BY_SUPPLIER]: '按供应商统计',
  [STATISTICS_DIMENSIONS.BY_STATUS]: '按状态统计',
  [STATISTICS_DIMENSIONS.BY_PRICE_RANGE]: '按价格区间统计',
  [STATISTICS_DIMENSIONS.BY_TIME]: '按时间统计'
}

// 导出格式
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  WORD: 'word',
  IMAGE: 'image'
}

// 导出格式文本映射
export const EXPORT_FORMAT_TEXT = {
  [EXPORT_FORMATS.PDF]: 'PDF报告',
  [EXPORT_FORMATS.EXCEL]: 'Excel表格',
  [EXPORT_FORMATS.WORD]: 'Word文档',
  [EXPORT_FORMATS.IMAGE]: '图片格式'
}

// 报告配置选项
export const REPORT_CONFIG_OPTIONS = {
  includeCharts: { label: '包含图表', default: true },
  includeDetails: { label: '包含详细数据', default: true },
  includeStatistics: { label: '包含统计信息', default: true },
  includeSummary: { label: '包含汇总信息', default: true }
}

// 时间范围选项
export const TIME_RANGE_OPTIONS = [
  { label: '最近7天', value: 7 },
  { label: '最近30天', value: 30 },
  { label: '最近90天', value: 90 },
  { label: '自定义', value: 'custom' }
]

// 价格区间配置
export const PRICE_RANGES = [
  { label: '0-1000元', min: 0, max: 1000 },
  { label: '1000-5000元', min: 1000, max: 5000 },
  { label: '5000-10000元', min: 5000, max: 10000 },
  { label: '10000元以上', min: 10000, max: null }
]