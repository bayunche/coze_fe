// OwnerMaterialParsingResultDialog 组件相关常量

export const DIALOG_CONFIG = {
  TITLE: '甲供物资解析任务列表',
  WIDTH: '60%',
  CUSTOM_CLASS: 'task-parsing-result-dialog'
}

export const TAB_NAMES = {
  ALL: 'all',
  COMPLETED: 'completed',
  IN_PROGRESS: 'inProgress'
}

export const TAB_CONFIG = [
  { name: TAB_NAMES.ALL, label: '全部' },
  { name: TAB_NAMES.COMPLETED, label: '已完成' },
  { name: TAB_NAMES.IN_PROGRESS, label: '进行中' }
]

export const TABLE_COLUMNS = [
  { prop: 'id', label: '任务编号', width: 180 },
  { prop: 'projectCode', label: '项目编号', width: 150 },
  { prop: 'projectName', label: '项目名称', width: 200 },
  { prop: 'createdTime', label: '任务创建时间', width: 200 },
  { label: '状态', width: 120 },
  { label: '进度', minWidth: 200 },
  { prop: 'fileErrorCount', label: '失败数', width: 100 },
  { label: '操作', width: 120, fixed: 'right' }
]

export const TASK_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PARTIAL_FAILED: 'partial_failed',
  UNKNOWN: 'unknown'
}

export const TASK_STATUS_CONFIG = {
  [TASK_STATUS.IN_PROGRESS]: { text: '进行中', type: 'primary' },
  [TASK_STATUS.COMPLETED]: { text: '已完成', type: 'success' },
  [TASK_STATUS.PARTIAL_FAILED]: { text: '部分失败', type: 'warning' },
  [TASK_STATUS.UNKNOWN]: { text: '未知', type: 'info' }
}

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50],
  LAYOUT: 'prev, pager, next'
}

export const BUTTON_LABELS = {
  VIEW_DETAILS: '查看详情',
  CLOSE: '关闭'
}

export const PROGRESS_CONFIG = {
  STROKE_WIDTH: 8,
  TEXT_COLOR: '#909399'
}