// TaskDetailDialog 组件相关常量

export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
}

export const TASK_TYPES = {
  CONTRACT_PARSING: 'contractParsing',
  MATERIAL_PARSING: 'materialParsing',
  OWNER_MATERIAL: 'ownerMaterial'
}
export const TASK_DETAIL_STATUS_MAP = {
  [TASK_DETAIL_STATUS.NOT_STARTED]: '未开始',
  [TASK_DETAIL_STATUS.IN_PROGRESS]: '进行中',
  [TASK_DETAIL_STATUS.COMPLETED]: '已完成',
  [TASK_DETAIL_STATUS.FAILED]: '失败'
}
export const DEFAULT_VALUES = {
  NOT_STARTED_TEXT: '未开始',
  NOT_ENDED_TEXT: '未结束',
  NO_ERROR_TEXT: '无',
  UNKNOWN_STATUS_TEXT: '未知状态'
}
export const DIALOG_CONFIG = {
  WIDTH: '80%',
  MAX_WIDTH: '1200px'
}
