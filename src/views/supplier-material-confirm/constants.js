// 乙供物资解析确认页面常量配置

/**
 * 页面配置
 */
export const PAGE_CONFIG = {
  title: '乙供物资解析确认',
  subtitle: '确认乙供物资解析结果，支持批量操作',
  breadcrumb: ['智能大脑', '任务详情', '乙供物资解析确认']
}

/**
 * 统计卡片配置
 */
export const STATISTICS_CONFIG = {
  TOTAL: {
    key: 'totalCount',
    label: '总记录数',
    icon: '📊',
    color: '#409EFF'
  },
  CONFIRMED: {
    key: 'confirmedCount',
    label: '已确认',
    icon: '✅',
    color: '#67C23A'
  },
  UNCONFIRMED: {
    key: 'unconfirmedCount',
    label: '待确认',
    icon: '⏳',
    color: '#E6A23C'
  },
  EXACT_MATCH: {
    key: 'exactMatchCount',
    label: '精确匹配',
    icon: '🎯',
    color: '#67C23A'
  },
  NO_MATCH: {
    key: 'noMatchCount',
    label: '无匹配',
    icon: '❌',
    color: '#F56C6C'
  }
}

/**
 * 表格列配置 - 与现有组件保持一致
 */
export const TABLE_COLUMNS = [
  {
    type: 'index',
    label: '序号',
    width: 60,
    fixed: 'left'
  },
  {
    prop: 'material_name',
    label: '物资名称',
    minWidth: 140,
    showOverflowTooltip: true
  },
  {
    prop: 'material_specification',
    label: '规格型号',
    minWidth: 140,
    showOverflowTooltip: true
  },
  {
    prop: 'material_unit',
    label: '单位',
    width: 80
  },
  {
    prop: 'material_quantity',
    label: '数量',
    width: 100
  },
  {
    label: '匹配基础数据',
    minWidth: 160,
    showOverflowTooltip: true
  },
  {
    label: '价格信息',
    width: 140
  },
  {
    label: '匹配类型',
    width: 100,
    align: 'center'
  },
  {
    label: '确认状态',
    width: 100,
    align: 'center'
  },
  {
    label: '操作',
    width: 200,
    fixed: 'right',
    align: 'center'
  }
]

/**
 * 筛选选项配置
 */
export const FILTER_OPTIONS = {
  CONFIRM_STATUS: [
    { label: '全部状态', value: undefined },
    { label: '未确认', value: 0 },
    { label: '已确认', value: 1 }
  ],
  MATCH_TYPE: [
    { label: '全部类型', value: undefined },
    { label: '无匹配', value: 0 },
    { label: '精确匹配', value: 1 },
    { label: '相似匹配', value: 2 },
    { label: '历史匹配', value: 3 },
    { label: '人工匹配', value: 4 }
  ]
}

/**
 * 匹配类型标签配置
 */
export const MATCH_TYPE_CONFIG = {
  0: { type: 'danger', text: '无匹配' },
  1: { type: 'success', text: '精确匹配' },
  2: { type: 'warning', text: '相似匹配' },
  3: { type: 'info', text: '历史匹配' },
  4: { type: 'primary', text: '人工匹配' }
}

/**
 * 确认状态标签配置
 */
export const CONFIRM_STATUS_CONFIG = {
  0: { type: 'warning', text: '待确认' },
  1: { type: 'success', text: '已确认' }
}

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  page_sizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  default_page_size: 20
}

/**
 * 按钮配置
 */
export const BUTTON_CONFIG = {
  BACK: {
    text: '返回',
    icon: 'ArrowLeft'
  },
  REFRESH: {
    text: '刷新数据',
    icon: 'Refresh'
  },
  EXPORT: {
    text: '导出数据',
    icon: 'Download'
  },
  BATCH_CONFIRM: {
    text: '批量确认选中',
    icon: 'Check'
  },
  BATCH_CONFIRM_ALL: {
    text: '批量确认全部',
    icon: 'CircleCheck'
  },
  TO_DETAIL: {
    text: '查看详情',
    icon: 'View'
  }
}

/**
 * 操作按钮配置
 */
export const ACTION_BUTTONS = {
  CONFIRM: {
    text: '确认',
    type: 'success',
    size: 'small'
  },
  CANCEL_CONFIRM: {
    text: '取消确认',
    type: 'warning',
    size: 'small'
  }
}

/**
 * API配置 - 基于实际的后端接口
 */
export const API_CONFIG = {
  QUERY_URL: '/materials/partyb/query',           // 乙供物资复杂查询接口
  MANUAL_CONFIRM_URL: '/materials/partyb/manual-confirm'  // 乙供物资解析数据人工修改确认接口
}

/**
 * 消息提示配置
 */
export const MESSAGE_CONFIG = {
  LOAD_SUCCESS: '数据加载成功',
  LOAD_ERROR: '数据加载失败',
  CONFIRM_SUCCESS: '确认成功',
  CONFIRM_ERROR: '确认失败',
  BATCH_CONFIRM_SUCCESS: '批量确认成功',
  BATCH_CONFIRM_ERROR: '批量确认失败',
  CANCEL_CONFIRM_SUCCESS: '取消确认成功',
  CANCEL_CONFIRM_ERROR: '取消确认失败',
  NO_SELECTION: '请先选择要操作的记录',
  EXPORT_SUCCESS: '导出成功',
  EXPORT_ERROR: '导出失败',
  NO_DATA: '暂无数据'
}

/**
 * 默认查询参数
 */
export const DEFAULT_QUERY_PARAMS = {
  pageNum: 1,
  pageSize: 20,
  confirmResult: undefined, // 确认状态筛选
  matchedType: undefined,   // 匹配类型筛选
  searchKeyword: ''         // 搜索关键词
}

/**
 * 样式类名配置
 */
export const CSS_CLASSES = {
  PAGE_CONTAINER: 'supplier-material-confirm-page',
  PAGE_HEADER: 'page-header',
  PAGE_CONTENT: 'page-content',
  BACK_BUTTON: 'back-btn',
  TITLE_SECTION: 'title-section',
  STATISTICS_SECTION: 'statistics-section',
  TOOLBAR_SECTION: 'toolbar-section',
  TABLE_SECTION: 'table-section',
  BATCH_ACTIONS: 'batch-actions'
}

/**
 * 动画配置
 */
export const ANIMATION_CONFIG = {
  DURATION: 300,
  TRANSITION: 'all 0.3s ease'
}