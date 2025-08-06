// SmartBrainPage 页面相关常量

export const DIALOG_TYPES = {
  CONTRACT_PARSING: 'contractParsing',
  SUPPLIER_MATERIAL_PARSING: 'supplierMaterialParsing', 
  OWNER_MATERIAL_PARSING: 'ownerSuppliedMaterialParsing'
}

export const CARD_ICONS = {
  TOTAL_TASKS: '📊',
  IN_PROGRESS: '⏳',
  COMPLETED: '✅'
}

export const MANAGEMENT_ICONS = {
  MATERIAL_MANAGEMENT: '📦',
  VECTOR_DATABASE: '🗄️',
  DATA_MANAGEMENT: '📊',
  BACKUP_RESTORE: '💾',
  SYSTEM_CONFIG: '⚙️',
  LOG_ANALYSIS: '📋'
}

export const OVERVIEW_CARD_CONFIG = {
  TOTAL_TASKS: {
    icon: CARD_ICONS.TOTAL_TASKS,
    title: '总任务数',
    key: 'totalTasks'
  },
  IN_PROGRESS: {
    icon: CARD_ICONS.IN_PROGRESS,
    title: '进行中',
    key: 'inProgressTasks'
  },
  COMPLETED: {
    icon: CARD_ICONS.COMPLETED,
    title: '已完成',
    key: 'completedTasks'
  }
}

export const MANAGEMENT_FEATURES = {
  MATERIAL: {
    icon: MANAGEMENT_ICONS.MATERIAL_MANAGEMENT,
    title: '物资名称管理',
    description: '管理基础物资信息',
    route: '/smart-brain/material-management',
    available: true
  },
  VECTOR_DB: {
    icon: MANAGEMENT_ICONS.VECTOR_DATABASE,
    title: '向量库数据管理',
    description: '管理AI训练数据',
    route: '/smart-brain/vector-management',
    available: false
  }
}

export const DATA_MANAGEMENT_FEATURES = {
  PROJECT_DATA: {
    icon: MANAGEMENT_ICONS.DATA_MANAGEMENT,
    title: '项目数据管理',
    description: '管理项目相关的数据信息',
    route: '/project-data-management',
    available: true
  }
}

export const TABLE_CONFIG = {
  COLUMNS: [
    { prop: 'workflow', label: '工作流', width: 150 },
    { prop: 'function', label: '功能模块', width: 120 },
    { prop: 'status', label: '状态', width: 100 },
    { prop: 'duration', label: '耗时', width: 80 },
    { prop: 'timestamp', label: '执行时间' },
    { label: '操作', width: 120 }
  ]
}

export const STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending'
}

export const STATUS_LABELS = {
  [STATUS_TYPES.SUCCESS]: '成功',
  [STATUS_TYPES.ERROR]: '失败',
  [STATUS_TYPES.PENDING]: '进行中'
}

export const MOCK_EXECUTION_HISTORY = [
  {
    id: 1,
    workflow: '合同解析',
    function: '文档处理',
    status: STATUS_TYPES.SUCCESS,
    duration: '2.3s',
    timestamp: '2024-01-15 14:30:25'
  },
  {
    id: 2,
    workflow: '物资解析',
    function: '数据提取',
    status: STATUS_TYPES.SUCCESS,
    duration: '1.8s',
    timestamp: '2024-01-15 14:25:10'
  }
]