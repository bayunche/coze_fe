/**
 * 甲供物资详情页面常量定义
 */

// 物资状态
export const MATERIAL_STATUS = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: -1
}

// 物资状态文本映射
export const MATERIAL_STATUS_TEXT = {
  [MATERIAL_STATUS.PENDING]: '待处理',
  [MATERIAL_STATUS.PROCESSING]: '处理中',
  [MATERIAL_STATUS.COMPLETED]: '已完成',
  [MATERIAL_STATUS.FAILED]: '处理失败'
}

// 物资状态颜色映射
export const MATERIAL_STATUS_COLOR = {
  [MATERIAL_STATUS.PENDING]: 'info',
  [MATERIAL_STATUS.PROCESSING]: 'warning',
  [MATERIAL_STATUS.COMPLETED]: 'success',
  [MATERIAL_STATUS.FAILED]: 'danger'
}

// 详情页面表格列配置
export const DETAIL_TABLE_COLUMNS = [
  { prop: 'materialName', label: '物资名称', width: 200, sortable: true },
  { prop: 'specification', label: '规格型号', width: 150 },
  { prop: 'brand', label: '品牌', width: 120 },
  { prop: 'unit', label: '单位', width: 80 },
  { prop: 'quantity', label: '数量', width: 100, sortable: true },
  { prop: 'unitPrice', label: '单价(元)', width: 120, sortable: true },
  { prop: 'totalPrice', label: '总价(元)', width: 120, sortable: true },
  { prop: 'supplier', label: '供应商', width: 150 },
  { prop: 'status', label: '状态', width: 100 }
]

// 搜索字段选项
export const SEARCH_FIELDS = [
  { label: '物资名称', value: 'materialName' },
  { label: '规格型号', value: 'specification' },
  { label: '品牌', value: 'brand' },
  { label: '供应商', value: 'supplier' }
]

// 筛选选项
export const FILTER_OPTIONS = {
  status: [
    { label: '全部状态', value: '' },
    { label: '待处理', value: MATERIAL_STATUS.PENDING },
    { label: '处理中', value: MATERIAL_STATUS.PROCESSING },
    { label: '已完成', value: MATERIAL_STATUS.COMPLETED },
    { label: '处理失败', value: MATERIAL_STATUS.FAILED }
  ]
}

// 分页配置
export const PAGINATION_CONFIG = {
  pageSizes: [10, 20, 50, 100],
  defaultPageSize: 20
}

// 导出配置
export const EXPORT_CONFIG = {
  formats: [
    { label: 'Excel格式', value: 'excel' },
    { label: 'PDF格式', value: 'pdf' },
    { label: 'CSV格式', value: 'csv' }
  ]
}

// 操作类型
export const ACTION_TYPES = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  EXPORT: 'export'
}