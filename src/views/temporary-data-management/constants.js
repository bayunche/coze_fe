// 临时数据管理页面常量配置

/**
 * 页面配置
 */
export const PAGE_CONFIG = {
  title: '临时数据管理',
  subtitle: '管理和审批所有临时数据信息',
  breadcrumb: ['智能大脑', '数据管理', '临时数据']
}

/**
 * 审批状态枚举
 */
export const APPROVAL_STATUS = {
  PENDING: 0,    // 待审批
  APPROVED: 1,   // 已通过
  REJECTED: 2    // 已拒绝
}

/**
 * 审批状态配置
 */
export const APPROVAL_STATUS_CONFIG = {
  [APPROVAL_STATUS.PENDING]: {
    label: '待审批',
    type: 'warning',
    icon: 'Clock'
  },
  [APPROVAL_STATUS.APPROVED]: {
    label: '已通过',
    type: 'success',
    icon: 'CircleCheck'
  },
  [APPROVAL_STATUS.REJECTED]: {
    label: '已拒绝',
    type: 'danger',
    icon: 'CircleClose'
  }
}

/**
 * 数据类型枚举
 */
export const DATA_TYPE = {
  BASE_INFO: 'baseInfo',
  PRICE: 'price'
}

/**
 * 数据类型配置
 */
export const DATA_TYPE_CONFIG = {
  [DATA_TYPE.BASE_INFO]: {
    label: '基础信息',
    type: 'primary',
    icon: 'Box'
  },
  [DATA_TYPE.PRICE]: {
    label: '价格信息',
    type: 'success',
    icon: 'Money'
  }
}

/**
 * 匹配类型映射
 */
export const MATCH_TYPE_MAP = {
  0: { label: '临时数据', type: 'info' },
  1: { label: '已验证', type: 'success' },
  2: { label: '待验证', type: 'warning' },
  3: { label: '历史数据', type: 'primary' },
  4: { label: '手动添加', type: 'danger' }
}

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = {
  // 基础信息列
  taskInfo: {
    taskId: { label: '任务ID', width: 120, showOverflowTooltip: true },
    dataType: { label: '数据类型', width: 100, align: 'center' },
    createTime: { label: '创建时间', width: 160 }
  },
  // 物资基础信息列
  baseInfo: {
    materialName: { label: '物资名称', minWidth: 180, showOverflowTooltip: true },
    specificationModel: { label: '规格型号', minWidth: 150, showOverflowTooltip: true },
    unit: { label: '单位', width: 80 },
    materialCode: { label: '物资编码', width: 120, showOverflowTooltip: true },
    priceCode: { label: '信息价编码', width: 120, showOverflowTooltip: true }
  },
  // 价格信息列
  priceInfo: {
    baseInfoId: { label: '基础信息ID', width: 120, showOverflowTooltip: true },
    quarter: { label: '季度', width: 120 },
    taxPrice: { label: '含税价', width: 100, align: 'right' },
    taxExcludedPrice: { label: '不含税价', width: 100, align: 'right' },
    priceUnit: { label: '价格单位', width: 100 }
  },
  // 通用列
  common: {
    id: { label: 'ID', width: 100, showOverflowTooltip: true },
    associatedTaskId: { label: '关联任务', width: 120, showOverflowTooltip: true },
    status: { label: '状态', width: 100, align: 'center' }
  }
}

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  pageSizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  defaultPageSize: 20
}

/**
 * 按钮配置
 */
export const BUTTON_CONFIG = {
  REFRESH: {
    text: '刷新',
    icon: 'Refresh',
    type: 'default'
  },
  EXPORT: {
    text: '导出数据',
    icon: 'Download',
    type: 'default'
  },
  CREATE_BASE_INFO: {
    text: '新增基础信息',
    icon: 'Plus',
    type: 'primary'
  },
  CREATE_PRICE: {
    text: '新增价格信息',
    icon: 'Plus',
    type: 'success'
  },
  BATCH_PROMOTE: {
    text: '批量转正',
    icon: 'CircleCheck',
    type: 'success'
  },
  BATCH_DELETE: {
    text: '批量删除',
    icon: 'Delete',
    type: 'danger'
  },
  PROMOTE: {
    text: '转正',
    type: 'success',
    size: 'small'
  },
  DELETE: {
    text: '删除',
    type: 'danger',
    size: 'small'
  },
  DETAIL: {
    text: '详情',
    type: 'primary',
    size: 'small',
    link: true
  }
}

/**
 * 消息提示配置
 */
export const MESSAGE_CONFIG = {
  LOAD_SUCCESS: '数据加载成功',
  LOAD_ERROR: '数据加载失败，请稍后重试',
  PROMOTE_SUCCESS: '转正成功',
  PROMOTE_ERROR: '转正操作失败',
  DELETE_SUCCESS: '删除成功',
  DELETE_ERROR: '删除操作失败',
  BATCH_PROMOTE_SUCCESS: '批量转正成功',
  BATCH_DELETE_SUCCESS: '批量删除成功',
  NO_SELECTION: '请先选择要操作的记录',
  CONFIRM_PROMOTE: '确定要将选中的数据转为正式数据吗？',
  CONFIRM_DELETE: '确定要删除选中的记录吗？删除后不可恢复！',
  DELETE_REASON_REQUIRED: '请输入删除理由',
  EXPORT_SUCCESS: '导出成功',
  EXPORT_ERROR: '导出失败',
  CREATE_SUCCESS: '创建成功',
  CREATE_ERROR: '创建失败',
  TASK_ID_REQUIRED: '请输入任务ID'
}

/**
 * 统计卡片配置
 */
export const STATS_CARDS = [
  {
    key: 'total',
    label: '总记录数',
    icon: 'DataAnalysis',
    color: '#165dff',
    bgColor: 'rgba(22, 93, 255, 0.1)',
    filterType: '' // 空字符串表示显示全部
  },
  {
    key: 'baseInfoCount',
    label: '基础信息',
    icon: 'Box',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    filterType: DATA_TYPE.BASE_INFO
  },
  {
    key: 'priceCount',
    label: '价格信息',
    icon: 'Money',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    filterType: DATA_TYPE.PRICE
  },
  {
    key: 'pendingCount',
    label: '待处理',
    icon: 'Clock',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    filterType: '' // 这个卡片暂时也显示全部，后续可以根据需要调整
  }
]

/**
 * 筛选选项配置
 */
export const FILTER_OPTIONS = {
  dataType: [
    { label: '全部类型', value: '' },
    { label: '基础信息', value: DATA_TYPE.BASE_INFO },
    { label: '价格信息', value: DATA_TYPE.PRICE }
  ],
  taskId: {
    placeholder: '输入任务ID筛选（可选）'
  },
  dateRange: {
    shortcuts: [
      {
        text: '今天',
        value: () => {
          const end = new Date()
          const start = new Date()
          start.setHours(0, 0, 0, 0)
          return [start, end]
        }
      },
      {
        text: '最近一周',
        value: () => {
          const end = new Date()
          const start = new Date()
          start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
          return [start, end]
        }
      },
      {
        text: '最近一个月',
        value: () => {
          const end = new Date()
          const start = new Date()
          start.setMonth(start.getMonth() - 1)
          return [start, end]
        }
      }
    ]
  }
}

/**
 * 默认值配置
 */
export const DEFAULT_VALUES = {
  EMPTY_TEXT: '-',
  NO_DATA_TEXT: '暂无数据',
  LOADING_TEXT: '加载中...'
}

/**
 * 样式类名配置
 */
export const CSS_CLASSES = {
  PAGE_CONTAINER: 'temporary-data-management-page',
  PAGE_HEADER: 'page-header',
  STATS_SECTION: 'stats-section',
  FILTER_SECTION: 'filter-section',
  TABLE_SECTION: 'table-section',
  BATCH_ACTIONS: 'batch-actions'
}