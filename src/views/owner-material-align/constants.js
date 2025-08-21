/**
 * 甲供物资对平页面常量定义
 */

// 对平状态
export const ALIGN_STATUS = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: -1
}

// 对平状态文本映射
export const ALIGN_STATUS_TEXT = {
  [ALIGN_STATUS.PENDING]: '待对平',
  [ALIGN_STATUS.PROCESSING]: '对平中',
  [ALIGN_STATUS.COMPLETED]: '已完成',
  [ALIGN_STATUS.FAILED]: '对平失败'
}

// 对平状态颜色映射
export const ALIGN_STATUS_COLOR = {
  [ALIGN_STATUS.PENDING]: 'info',
  [ALIGN_STATUS.PROCESSING]: 'warning',
  [ALIGN_STATUS.COMPLETED]: 'success',
  [ALIGN_STATUS.FAILED]: 'danger'
}

// 表格列配置
export const TABLE_COLUMNS = [
  { prop: 'materialName', label: '物资名称', width: 200 },
  { prop: 'specification', label: '规格型号', width: 150 },
  { prop: 'unit', label: '单位', width: 80 },
  { prop: 'quantity', label: '数量', width: 100 },
  { prop: 'unitPrice', label: '单价', width: 120 },
  { prop: 'totalPrice', label: '总价', width: 120 },
  { prop: 'status', label: '状态', width: 100 }
]

// 导出格式
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  PDF: 'pdf'
}

// 操作按钮配置
export const ACTION_BUTTONS = {
  SAVE: { text: '保存', type: 'primary' },
  EXPORT: { text: '导出', type: 'success' },
  RESET: { text: '重置', type: 'warning' }
}