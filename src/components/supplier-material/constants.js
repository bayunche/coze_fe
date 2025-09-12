// 乙供物资表格组件常量配置

/**
 * 表格类型配置
 */
export const TABLE_TYPES = {
  ALL: 'total',           // 全部数据
  MATCHED: 'matched',     // 已匹配
  PRICE_MISMATCH: 'priceMismatch',  // 价格不匹配
  UNMATCHED: 'unmatched'  // 未找到物资
}

/**
 * 表格列配置 - 根据表格类型决定显示哪些列
 */
export const TABLE_COLUMNS_CONFIG = {
  [TABLE_TYPES.ALL]: {
    showPriceMatchStatus: true,     // 显示价格匹配状态列
    showMaterialMatchStatus: false, // 不显示物资匹配状态列
    showReasonRow: false            // 不显示原因解释行
  },
  [TABLE_TYPES.MATCHED]: {
    showPriceMatchStatus: true,     // 显示价格匹配状态列
    showMaterialMatchStatus: true,  // 显示物资匹配状态列
    showReasonRow: false            // 不显示原因解释行
  },
  [TABLE_TYPES.PRICE_MISMATCH]: {
    showPriceMatchStatus: true,     // 显示价格匹配状态列
    showMaterialMatchStatus: false, // 不显示物资匹配状态列
    showReasonRow: false            // 不显示原因解释行
  },
  [TABLE_TYPES.UNMATCHED]: {
    showPriceMatchStatus: false,    // 不显示价格匹配状态列
    showMaterialMatchStatus: true,  // 显示物资匹配状态列
    showReasonRow: true             // 显示原因解释行
  }
}

/**
 * 物资匹配状态配置
 */
export const MATERIAL_MATCH_STATUS = {
  EXACT_MATCH: {
    text: '精确匹配',
    type: 'success'
  },
  SIMILAR_MATCH: {
    text: '相似匹配',
    type: 'warning'
  },
  HISTORY_MATCH: {
    text: '历史匹配',
    type: 'info'
  },
  MANUAL_MATCH: {
    text: '人工匹配',
    type: 'primary'
  },
  NO_MATCH: {
    text: '未匹配',
    type: 'danger'
  }
}

/**
 * 价格匹配状态配置 
 */
export const PRICE_MATCH_STATUS = {
  MATCHED: {
    text: '已匹配',
    type: 'success'
  },
  MISMATCH: {
    text: '价格不匹配',
    type: 'warning'
  },
  NOT_FOUND: {
    text: '未找到物资',
    type: 'danger'
  }
}

/**
 * 原因解释配置
 */
export const REASON_EXPLANATIONS = {
  SIMILAR_MATCH: `🧠 AI大模型智能分析推荐：
通过深度学习算法分析您的物资数据，在海量数据库中找到最匹配的相似物资。
📊 建议您仔细核对推荐的物资信息和价格数据是否符合预期，如需调整可重新选择。`,
  NO_MATCH: `🔍 AI智能搜索结果：
大模型已扫描全部数据库记录，暂未发现与您解析物资相匹配的数据项。
💡 建议从右侧按钮手动选择最接近的物资类型，或联系管理员录入新的标准数据。`
}

/**
 * 表格行类型
 */
export const ROW_TYPES = {
  DATA: 'data',           // 数据行
  ACTION: 'action',       // 操作行
  SEPARATOR: 'separator', // 分隔行
  REASON: 'reason'        // 原因解释行
}

/**
 * 匹配类型映射
 */
export const MATCH_TYPE_MAP = {
  0: 'NO_MATCH',      // 无匹配
  1: 'EXACT_MATCH',   // 精确匹配
  2: 'SIMILAR_MATCH', // 相似匹配
  3: 'HISTORY_MATCH', // 历史匹配
  4: 'MANUAL_MATCH'   // 人工匹配
}

/**
 * 表格默认配置
 */
export const TABLE_DEFAULT_CONFIG = {
  stripe: true,
  border: true,
  maxHeight: '60vh',
  emptyText: '暂无数据'
}

/**
 * 操作按钮配置
 */
export const OPERATION_BUTTONS = {
  CONFIRM: {
    text: '确认',
    type: 'primary',
    icon: 'Check'
  },
  RE_SELECT: {
    text: '重选',
    type: 'warning',
    icon: 'Edit',
    plain: true
  },
  SELECT: {
    text: '从库选择',
    type: 'primary',
    icon: 'Plus',
    plain: true
  },
  RE_CHOOSE: {
    text: '重新选择',
    type: 'warning',
    icon: 'Edit',
    plain: true
  },
  SELECT_CONFIRM: {
    text: '选择确认',
    type: 'primary',
    icon: 'Edit'
  }
}

/**
 * 表格样式类名
 */
export const TABLE_CSS_CLASSES = {
  TABLE_CONTAINER: 'supplier-material-table',
  DATA_CELL: 'data-cell',
  ACTION_CELL: 'action-cell',
  SEPARATOR_CELL: 'separator-cell',
  REASON_CELL: 'reason-cell',
  OPERATION_COLUMN: 'operation-column',
  PRICE_MISMATCH_HINT: 'price-mismatch-hint',
  WARNING_ICON: 'warning-icon'
}