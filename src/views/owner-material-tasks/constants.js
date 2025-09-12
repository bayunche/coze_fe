// 甲供物资解析任务列表页面常量配置

export const PAGE_CONFIG = {
  TITLE: '甲供物资解析任务列表',
  AGENT_LABELS: 'j_material'
}

export const TAB_CONFIG = [
  { name: 'all', label: '全部' },
  { name: 'inProgress', label: '进行中' },
  { name: 'completed', label: '已完成' }
]

export const TABLE_COLUMNS = [
  { prop: 'id', label: 'ID', width: '100' },
  { prop: 'taskName', label: '任务名称', minWidth: '200', showOverflowTooltip: true },
  { prop: 'createdTime', label: '创建时间', width: '180' },
  { label: '状态', width: '100' },
  { label: '进度', width: '150' },
  { label: '操作', width: '120', fixed: 'right' }
]

export const BUTTON_LABELS = {
  VIEW_DETAILS: '查看详情',
  REFRESH: '刷新',
  BACK: '返回智能大脑'
}

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100]
}

export const TASK_STATUS_MAP = {
  0: { text: '排队中', type: 'info' },
  1: { text: '处理中', type: 'warning' },
  2: { text: '处理完成', type: 'success' },
  3: { text: '已确认', type: 'success' },
  [-1]: { text: '处理失败', type: 'danger' }
}

export const DEFAULT_VALUES = {
  UNKNOWN_STATUS_TEXT: '未知状态'
}