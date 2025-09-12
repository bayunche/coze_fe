// 合同解析任务详情页面常量配置

export const PAGE_CONFIG = {
  TITLE: '合同解析任务详情'
}

export const TABLE_COLUMNS = [
  { type: 'index', label: '序号', width: '60' },
  { prop: 'fileName', label: '文件名称', minWidth: '200', showOverflowTooltip: true },
  { prop: 'startTime', label: '开始时间', width: '180' },
  { prop: 'endTime', label: '结束时间', width: '180' },
  { prop: 'taskDetailStatus', label: '任务解析状态', width: '120' },
  { prop: 'errorReason', label: '失败原因', minWidth: '150', showOverflowTooltip: true },
  { label: '操作', width: '200', fixed: 'right' }
]

export const BUTTON_LABELS = {
  VIEW_DETAIL: '查看详情',
  VIEW_SOURCE_FILE: '查看源文件',
  BACK: '返回任务列表',
  REFRESH: '刷新'
}

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100]
}

export const TASK_DETAIL_STATUS_MAP = {
  0: '排队中',
  1: '处理中',
  2: '处理完成',
  3: '已确认',
  [-1]: '处理失败'
}

export const DEFAULT_VALUES = {
  UNKNOWN_STATUS_TEXT: '未知状态'
}