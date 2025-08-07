// 项目详情页面常量配置

// 页面标题配置
export const PAGE_CONFIG = {
  title: '项目详情',
  subtitle: '查看项目完整信息'
}

// 区块配置
export const SECTION_CONFIG = {
  PROJECT_INFO: {
    id: 'project-info',
    title: '项目基础信息',
    icon: '🏢'
  },
  CONTRACT_INFO: {
    id: 'contract-info',
    title: '合同信息',
    icon: '📄'
  },
  OWNER_MATERIAL: {
    id: 'owner-material',
    title: '甲供物资信息',
    icon: '📦'
  },
  SUPPLIER_MATERIAL: {
    id: 'supplier-material',
    title: '乙供物资信息',
    icon: '🚛'
  }
}

// 项目基础信息字段配置
export const PROJECT_INFO_FIELDS = [
  { key: 'projectId', label: '项目ID', type: 'text' },
  { key: 'projectCode', label: '项目编码', type: 'text' },
  { key: 'projectName', label: '项目名称', type: 'text' },
  { key: 'projectType', label: '项目类型', type: 'tag' },
  { key: 'startDate', label: '开始时间', type: 'date' },
  { key: 'endDate', label: '结束时间', type: 'date' },
  { key: 'budget', label: '项目预算', type: 'currency' }
]

// 合同信息字段配置
export const CONTRACT_INFO_FIELDS = [
  { key: 'contractCode', label: '合同编号', type: 'text' },
  { key: 'contractName', label: '合同名称', type: 'text' },
  { key: 'contractType', label: '合同类型', type: 'tag' },
  { key: 'partyA', label: '甲方', type: 'text' },
  { key: 'partyB', label: '乙方', type: 'text' },
  { key: 'totalAmount', label: '合同金额', type: 'currency' },
  { key: 'signDate', label: '签订日期', type: 'date' }
]

// 甲供物资表格列配置
export const OWNER_MATERIAL_COLUMNS = [
  { prop: 'materialId', label: '物资ID', width: '120', fixed: 'left' },
  { prop: 'materialName', label: '物资名称', minWidth: '150', showOverflowTooltip: true },
  { prop: 'specification', label: '规格型号', minWidth: '150', showOverflowTooltip: true },
  { prop: 'unit', label: '单位', width: '80' },
  { prop: 'quantity', label: '数量', width: '100', align: 'right' },
  { prop: 'unitPrice', label: '单价(元)', width: '120', align: 'right' },
  { prop: 'totalPrice', label: '总价(元)', width: '140', align: 'right' },
  { prop: 'supplier', label: '供应商', minWidth: '150', showOverflowTooltip: true },
  { prop: 'deliveryDate', label: '交付日期', width: '120' },
  { prop: 'materialStatus', label: '匹配状态', width: '100' },
  { prop: 'remark', label: '备注', minWidth: '150', showOverflowTooltip: true }
]

// 乙供物资表格列配置
export const SUPPLIER_MATERIAL_COLUMNS = [
  { prop: 'materialId', label: '物资ID', width: '120', fixed: 'left' },
  { prop: 'materialName', label: '物资名称', minWidth: '150', showOverflowTooltip: true },
  { prop: 'specification', label: '规格型号', minWidth: '150', showOverflowTooltip: true },
  { prop: 'unit', label: '单位', width: '80' },
  { prop: 'quantity', label: '数量', width: '100', align: 'right' },
  { prop: 'estimatedPrice', label: '预估单价(元)', width: '140', align: 'right' },
  { prop: 'actualPrice', label: '实际单价(元)', width: '140', align: 'right' },
  { prop: 'totalCost', label: '总成本(元)', width: '140', align: 'right' },
  { prop: 'contractor', label: '承包商', minWidth: '150', showOverflowTooltip: true },
  { prop: 'matchingStatus', label: '匹配状态', width: '100' },
  { prop: 'remark', label: '备注', minWidth: '150', showOverflowTooltip: true }
]

// 统计卡片配置
export const STATS_CONFIG = {
  OWNER_MATERIAL: [
    { key: 'totalCount', label: '物资总数', icon: '📦', unit: '项' },
    { key: 'matchedCount', label: '已匹配', icon: '✅', unit: '项' },
    { key: 'unmatchedCount', label: '未匹配', icon: '❌', unit: '项' },
    { key: 'matchRate', label: '匹配率', icon: '📊', unit: '%' }
  ],
  SUPPLIER_MATERIAL: [
    { key: 'totalCount', label: '物资总数', icon: '🚛', unit: '项' },
    { key: 'matchedCount', label: '已匹配', icon: '✅', unit: '项' },
    { key: 'unmatchedCount', label: '未匹配', icon: '❌', unit: '项' },
    { key: 'matchRate', label: '匹配率', icon: '📊', unit: '%' }
  ]
}

// 状态配置
export const STATUS_CONFIG = {
  PROJECT: {
    active: { type: 'success', text: '进行中' },
    completed: { type: 'info', text: '已完成' },
    pending: { type: 'warning', text: '待开始' },
    suspended: { type: 'danger', text: '已暂停' }
  },
  MATERIAL: {
    matched: { type: 'success', text: '已拉平' },
    unmatched: { type: 'warning', text: '未拉平' },
    partial: { type: 'info', text: '部分拉平' }
  }
}

// 分页配置
export const PAGINATION_CONFIG = {
  pageSize: 20,
  pageSizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper'
}