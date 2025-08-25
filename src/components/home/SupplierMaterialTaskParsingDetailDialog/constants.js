// SupplierMaterialTaskParsingDetailDialog 组件相关常量

export const DIALOG_CONFIG = {
  TITLE: '乙供物资解析任务详情列表',
  WIDTH: '60%',
  CLOSE_ON_CLICK_MODAL: false
}

export const TABLE_COLUMNS = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'fileName', label: '文件名称' },
  { prop: 'startTime', label: '开始时间', width: 140 },
  { prop: 'endTime', label: '结束时间', width: 140 },
  { prop: 'taskDetailStatus', label: '任务解析状态', width: 120 },
  { prop: 'errorReason', label: '失败原因' },
  { label: '操作', width: 300, fixed: 'right' }
]

export const TASK_DETAIL_STATUS = {
  NOT_STARTED: '0',
  IN_PROGRESS: '1',
  COMPLETED: '2',
  FAILED: '-1'
}

export const TASK_DETAIL_STATUS_MAP = {
  [TASK_DETAIL_STATUS.NOT_STARTED]: '未开始',
  [TASK_DETAIL_STATUS.IN_PROGRESS]: '进行中', 
  [TASK_DETAIL_STATUS.COMPLETED]: '已完成',
  [TASK_DETAIL_STATUS.FAILED]: '失败'
}

export const PAGINATION_CONFIG = {
  PAGE_SIZES: [10, 20, 50, 100],
  LAYOUT: 'total, sizes, prev, pager, next, jumper',
  BACKGROUND: true,
  STYLE: {
    marginTop: '20px',
    textAlign: 'right'
  }
}

export const BUTTON_LABELS = {
  VIEW_DETAIL: '查看详情',
  VIEW_SOURCE_FILE: '查看源文件',
  CONFIRM_RESULTS: '确认解析结果'
}

export const MESSAGE_LABELS = {
  PARSE_ERROR: '解析数据失败',
  FETCH_ERROR: '获取乙供物资解析详情列表失败',
  NO_FILE_URL: '文件URL不存在'
}

export const DEFAULT_VALUES = {
  NOT_STARTED_TEXT: '未开始',
  NOT_ENDED_TEXT: '未结束',
  NO_ERROR_TEXT: '无',
  UNKNOWN_STATUS_TEXT: '未知状态'
}