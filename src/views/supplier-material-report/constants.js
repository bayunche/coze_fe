/**
 * 乙供物资报告页面相关常量配置
 */

// 页面信息配置
export const PAGE_CONFIG = {
  TITLE: '乙供物资解析报告',
  EXPORT_TITLE_PREFIX: '乙供物资解析报告'
}

// 默认报告模板配置
export const DEFAULT_REPORT_SECTIONS = [
  {
    title: '物资解析情况分析',
    badge: '解析结果',
    icon: 'Document'
  },
  {
    title: '价格匹配分析',
    badge: '价格对比',
    icon: 'Coin'
  },
  {
    title: '供应商分析',
    badge: '供应商评估',
    icon: 'Shop'
  },
  {
    title: '数据质量分析',
    badge: '质量评估',
    icon: 'DataAnalysis'
  }
]