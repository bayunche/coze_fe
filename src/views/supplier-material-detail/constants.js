// 乙供物资解析详情页面常量配置

/**
 * 页面配置
 */
export const PAGE_CONFIG = {
  title: '乙供物资解析详情',
  subtitle: '查看和编辑乙供物资解析结果',
  breadcrumb: ['智能大脑', '任务详情', '乙供物资解析详情']
}

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = [
  {
    type: 'index',
    label: '序号',
    width: 60
  },
  {
    prop: 'material_name',
    label: '乙供物资名称',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'material_specification',
    label: '乙供物资规格型号',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'material_price',
    label: '乙供物资价格',
    width: 120,
    align: 'right'
  },
  {
    prop: 'matched_name',
    label: '匹配物资名称',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'matched_specification',
    label: '匹配规格型号',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'matched_price',
    label: '匹配价格',
    width: 120,
    align: 'right'
  },
  {
    prop: 'similarity',
    label: '相似度',
    width: 100,
    align: 'center'
  },
  {
    prop: 'match_type',
    label: '匹配类型',
    width: 120,
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
 * 匹配类型标签配置
 */
export const MATCH_TYPE_CONFIG = {
  '精确匹配': {
    type: 'success',
    text: '精确匹配'
  },
  '相似匹配': {
    type: 'warning',
    text: '相似匹配'
  },
  '无匹配': {
    type: 'danger',
    text: '无匹配'
  },
  '未知': {
    type: 'info',
    text: '未知'
  }
}

/**
 * 匹配类型映射
 */
export const MATCH_TYPE_MAP = {
  0: '无匹配',
  1: '精确匹配',
  2: '相似匹配',
  3: '历史匹配',
  4: '人工匹配'
}

/**
 * 物资匹配状态定义 V2 (v1.3.3新状态定义逻辑)
 */
export const MATERIAL_STATUS_V2 = {
  EXACT_MATCH: 1,        // 精确匹配
  INFO_PENDING: 2,       // 信息待确认
  MATERIAL_PENDING: 3    // 物资信息待处理
}

/**
 * 物资匹配状态映射 V2
 */
export const MATERIAL_STATUS_V2_MAP = {
  [MATERIAL_STATUS_V2.EXACT_MATCH]: {
    label: '精确匹配',
    description: '完全匹配通过，表格价格≤数据库价格',
    type: 'success',
    color: '#67C23A'
  },
  [MATERIAL_STATUS_V2.INFO_PENDING]: {
    label: '信息待确认',
    description: '表格价格>数据库价格，或已确认的相似/历史匹配',
    type: 'warning',
    color: '#E6A23C'
  },
  [MATERIAL_STATUS_V2.MATERIAL_PENDING]: {
    label: '物资信息待处理',
    description: '物资未找到、相似匹配未确认',
    type: 'danger',
    color: '#F56C6C'
  }
}

/**
 * 表格类型定义 V2
 */
export const TABLE_TYPES_V2 = {
  ALL: 'all',
  EXACT_MATCH: 'exactMatch',      // 精确匹配
  INFO_PENDING: 'infoPending',    // 信息待确认
  MATERIAL_PENDING: 'materialPending'  // 物资信息待处理
}

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  page_sizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  default_page_size: 10
}

/**
 * 工作流ID配置
 */
export const WORKFLOW_IDS = {
  DETAIL: '7519045874770657299', // 获取详情数据的工作流ID
  SELECTION: '7519455533105184809', // 获取匹配选择数据的工作流ID
  SAVE: '7519356799683919872' // 保存解析结果的工作流ID
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
    text: '批量确认',
    icon: 'Check'
  }
}

/**
 * 操作按钮配置
 */
export const ACTION_BUTTONS = {
  EXACT_MATCH: {
    text: '已精确匹配',
    type: 'info',
    disabled: true
  },
  EDIT: {
    text: '修改',
    type: 'primary',
    size: 'small'
  },
  SAVE_EDIT: {
    text: '保存',
    type: 'success',
    size: 'small'
  },
  CANCEL_EDIT: {
    text: '取消',
    type: 'default',
    size: 'small'
  }
}

/**
 * 消息提示配置
 */
export const MESSAGE_CONFIG = {
  LOAD_SUCCESS: '数据加载成功',
  LOAD_ERROR: '数据加载失败',
  SAVE_SUCCESS: '保存成功',
  SAVE_ERROR: '保存失败',
  NO_DATA: '未获取到有效的详情数据',
  NO_CHANGES: '未检测到修改的数据，无需保存',
  EXPORT_SUCCESS: '导出成功',
  EXPORT_ERROR: '导出失败'
}

/**
 * 默认值配置
 */
export const DEFAULT_VALUES = {
  EMPTY_TEXT: '/',
  UNKNOWN_STATUS: '未知',
  NOT_STARTED: '未开始',
  NOT_ENDED: '未结束',
  NO_ERROR: '无'
}

/**
 * 样式类名配置
 */
export const CSS_CLASSES = {
  PAGE_CONTAINER: 'supplier-material-detail-page',
  PAGE_HEADER: 'page-header',
  PAGE_CONTENT: 'page-content',
  BACK_BUTTON: 'back-btn',
  TITLE_SECTION: 'title-section',
  INFO_SECTION: 'info-section',
  TABLE_SECTION: 'table-section',
  ACTION_SECTION: 'action-section'
}