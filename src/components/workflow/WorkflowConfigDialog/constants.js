// WorkflowConfigDialog 组件相关常量

export const WORKFLOW_NAMES = {
  OWNER_MATERIAL: '甲供物资解析',
  SUPPLIER_MATERIAL: '乙供物资解析', 
  CONTRACT_PARSING: '合同解析'
}

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50, // MB
  DEFAULT_LIMIT: 10,
  SINGLE_FILE_LIMIT: 1
}

export const FILE_TYPES = {
  EXCEL: ['.xls', '.xlsx'],
  PDF: ['.pdf'],
  DOCUMENT: ['.pdf', '.docx', '.txt']
}

export const OWNER_MATERIAL_EXCEL_TYPES = {
  APPLY_EXCEL: 'applyExcelFile',
  USE_MATERIAL_PDF: 'useMaterualPdfUrl',
  BACK_MATERIAL_PDF: 'backMaterualPdfUrl',
  OTHER: 'other'
}

export const UPLOAD_LABELS = {
  COMPREHENSIVE_CLAIM: '综合申领 (Excel)',
  ACTUAL_USAGE_1: '实际用料 (PDF, 必填)',
  ACTUAL_USAGE_2: '实际退料 (PDF, 必填)',
  OTHER_FILES: '其他文件 (选填)'
}

export const PARAM_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  BOOLEAN: 'boolean'
}

export const EMIT_EVENTS = {
  UPDATE_SHOW: 'update:show',
  CLOSE: 'close',
  START_WORKFLOW: 'start-workflow'
}

export const VALIDATION_MESSAGES = {
  COMPREHENSIVE_CLAIM_REQUIRED: '请上传"综合申领 (Excel)"文件',
  ACTUAL_USAGE_1_REQUIRED: '请上传第一个"实际用料 (PDF, 必填)"文件',
  ACTUAL_USAGE_2_REQUIRED: '请上传"实际退料 (PDF, 必填)"文件',
  FILE_SIZE_EXCEEDED: '文件大小不能超过 50MB!',
  FILE_TYPE_ERROR: '文件类型不符合要求，只支持 {types} 格式!'
}