/**
 * 甲供物资报告页面相关常量定义
 */

// 页面配置
export const PAGE_CONFIG = {
  TITLE: '甲供物资解析报告',
  LOADING_TEXT: '加载中...'
}

// 分析类型常量
export const ANALYSIS_TYPES = {
  MATERIAL_APPLICATION: 'material_application',
  SUPPLIER_ANALYSIS: 'supplier_analysis',
  COST_ANALYSIS: 'cost_analysis',
  DATA_ACCURACY: 'data_accuracy'
}

// 统计指标常量
export const STATISTICS_METRICS = {
  TOTAL_MATERIALS: 'totalMaterials',
  ZERO_QUANTITY_MATERIALS: 'zeroQuantityMaterials',
  HIGH_QUANTITY_MATERIALS: 'highQuantityMaterials',
  UNIQUE_SUPPLIERS: 'uniqueSuppliers',
  TOTAL_VALUE: 'totalValue'
}

// 报告模板章节
export const REPORT_SECTIONS = [
  {
    key: 'material_application',
    title: '物资申领情况分析',
    badge: '关键发现',
    icon: 'Document'
  },
  {
    key: 'supplier_analysis',
    title: '供应商分析',
    badge: '优化建议',
    icon: 'Shop'
  },
  {
    key: 'cost_analysis',
    title: '成本分析',
    badge: '成本优化',
    icon: 'Coin'
  },
  {
    key: 'data_accuracy',
    title: '数据准确性分析',
    badge: '数据质量',
    icon: 'DataAnalysis'
  }
]

// 分析项类型
export const ANALYSIS_ITEM_TYPES = {
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  DANGER: 'danger'
}

// 统计卡片样式类型
export const STAT_ITEM_TYPES = {
  DEFAULT: '',
  WARNING: 'warning',
  SUCCESS: 'success',
  INFO: 'info',
  PRIMARY: 'primary'
}

// 高需求物资阈值
export const HIGH_QUANTITY_THRESHOLD = 100

// 打印配置
export const PRINT_CONFIG = {
  TITLE_PREFIX: '甲供物资解析报告',
  DATE_FORMAT: 'zh-CN',
  PRINT_DELAY: 1000 // 毫秒
}