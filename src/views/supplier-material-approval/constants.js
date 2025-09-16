/**
 * 乙供物资审批页面常量配置
 */

// 筛选卡片配置
export const FILTER_CARDS_CONFIG = {
  manual: {
    queryType: 1,
    key: 'manualCount',
    title: '人工修改物资',
    icon: '✋',
    color: '#409eff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: 'confirmResult=1 且 confirmType∈(2,3)'
  },
  auto: {
    queryType: 2,
    key: 'autoCount',
    title: '系统自动匹配',
    icon: '🤖',
    color: '#67c23a',
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    description: '系统自动匹配的物资数据'
  },
  all: {
    queryType: 3,
    key: 'totalCount',
    title: '查看全部',
    icon: '📋',
    color: '#606266',
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    description: '所有物资数据（含人工+自动）'
  }
}

// 匹配类型映射
export const MATCH_TYPE_MAP = {
  0: { text: '无匹配', color: 'info' },
  1: { text: '精确匹配', color: 'success' },
  2: { text: '相似匹配', color: 'warning' },
  3: { text: '历史匹配', color: 'primary' },
  4: { text: '人工匹配', color: 'danger' }
}

// 确认类型映射
export const CONFIRM_TYPE_MAP = {
  1: { text: '系统确认', color: 'success' },
  2: { text: '人工确认', color: 'primary' },
  3: { text: '修改确认', color: 'warning' },
  4: { text: '自动确认', color: 'info' }
}

// 审批状态
export const APPROVAL_STATUS = {
  PENDING: 0,    // 待审批
  APPROVED: 1,   // 已通过
  REJECTED: 2    // 已拒绝
}

// 确认结果
export const CONFIRM_RESULT = {
  UNCONFIRMED: 0,  // 未确认
  CONFIRMED: 1     // 已确认
}

// 表格列配置
export const TABLE_COLUMNS = [
  { prop: 'materialName', label: '物资名称', minWidth: 150 },
  { prop: 'specifications', label: '规格型号', minWidth: 150 },
  { prop: 'unit', label: '单位', width: 80 },
  { prop: 'quantity', label: '数量', width: 100, align: 'right' },
  { prop: 'unitPrice', label: '单价', width: 120, align: 'right' },
  { prop: 'totalPrice', label: '总价', width: 120, align: 'right' },
  { prop: 'matchedType', label: '匹配类型', width: 120 },
  { prop: 'confirmType', label: '确认类型', width: 120 }
]

// 分页大小选项
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 默认分页配置
export const DEFAULT_PAGINATION = {
  currentPage: 1,
  pageSize: 20,
  total: 0
}