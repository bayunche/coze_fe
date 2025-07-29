// SmartBrainDialog 组件相关常量

export const AGENT_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
}

export const AGENT_STATUS_LABELS = {
  [AGENT_STATUS.ONLINE]: '在线',
  [AGENT_STATUS.OFFLINE]: '离线'
}

export const AGENT_STATUS_TYPES = {
  [AGENT_STATUS.ONLINE]: 'success',
  [AGENT_STATUS.OFFLINE]: 'info'
}

export const AGENT_TYPES = {
  CONTRACT_PARSING: 'contractParsing',
  SUPPLIER_MATERIAL_PARSING: 'supplierMaterialParsing',
  OWNER_MATERIAL_PARSING: 'ownerSuppliedMaterialParsing'
}

export const DIALOG_CONFIG = {
  TITLE: '智能大脑状态中心',
  WIDTH: '70%',
  CUSTOM_CLASS: 'smart-brain-dialog'
}

export const STAT_LABELS = {
  COMPLETED: '已完成',
  IN_PROGRESS: '进行中',
  TOTAL: '总任务'
}

export const GRID_CONFIG = {
  MIN_CARD_WIDTH: '280px',
  GAP: '20px'
}

export const ANIMATION_CONFIG = {
  HOVER_TRANSLATE_Y: '-5px',
  TRANSITION_DURATION: '0.3s'
}