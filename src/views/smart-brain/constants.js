// SmartBrainPage 页面相关常量

export const DIALOG_TYPES = {
  CONTRACT_PARSING: 'contractParsing',
  SUPPLIER_MATERIAL_PARSING: 'supplierMaterialParsing',
  OWNER_MATERIAL_PARSING: 'ownerSuppliedMaterialParsing'
}

export const CARD_ICONS = {
  TOTAL_TASKS: '📊',
  IN_PROGRESS: '⏳',
  FAILED: '❌',
  COMPLETED: '✅'
}

export const MANAGEMENT_ICONS = {
  MATERIAL_MANAGEMENT: '📦',
  VECTOR_DATABASE: '🗄️',
  DATA_MANAGEMENT: '📊',
  APPROVAL_MANAGEMENT: '✅',
  BACKUP_RESTORE: '💾',
  SYSTEM_CONFIG: '⚙️',
  LOG_ANALYSIS: '📋'
}

export const OVERVIEW_CARD_CONFIG = {
  TOTAL_TASKS: {
    icon: CARD_ICONS.TOTAL_TASKS,
    title: '总任务数',
    key: 'totalTasks',
    dialogType: 'total'
  },
  IN_PROGRESS: {
    icon: CARD_ICONS.IN_PROGRESS,
    title: '进行中',
    key: 'inProgressTasks',
    dialogType: 'inProgress'
  },
  FAILED: {
    icon: CARD_ICONS.FAILED,
    title: '执行失败',
    key: 'failedTasks',
    dialogType: 'failed'
  },
  COMPLETED: {
    icon: CARD_ICONS.COMPLETED,
    title: '已完成',
    key: 'completedTasks',
    dialogType: 'completed'
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
  PROJECT_DATA: {
    icon: MANAGEMENT_ICONS.DATA_MANAGEMENT,
    title: '项目数据管理',
    description: '管理项目相关的数据信息',
    route: '/project-data-management',
    available: true
  },
  TEMPORARY_DATA_MANAGEMENT: {
    icon: MANAGEMENT_ICONS.APPROVAL_MANAGEMENT,
    title: '临时数据管理',
    description: '管理和审批所有临时数据信息',
    route: '/temporary-data-management',
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
  // 数据管理功能已移至管理功能区
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

// TODO: 以下为各统计弹窗的 mock 数据，后续需要替换为真实 API 数据
export const MOCK_TASK_DETAILS = {
  total: [
    {
      id: 1,
      taskName: '合同001解析任务',
      agentName: '合同解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:30:25',
      finishTime: '2024-01-15 14:32:55',
      duration: '2m 30s',
      description: '解析建筑工程合同，提取关键信息'
    },
    {
      id: 2,
      taskName: '物资清单002解析',
      agentName: '乙供物资解析智能体',
      status: STATUS_TYPES.PENDING,
      createTime: '2024-01-15 14:35:10',
      finishTime: null,
      duration: '进行中...',
      description: '解析电气设备物资清单'
    },
    {
      id: 3,
      taskName: '甲供物资003处理',
      agentName: '甲供物资解析智能体',
      status: STATUS_TYPES.ERROR,
      createTime: '2024-01-15 14:20:15',
      finishTime: '2024-01-15 14:21:30',
      duration: '1m 15s',
      description: '处理钢材类甲供物资信息',
      errorMessage: '文档格式不支持'
    },
    {
      id: 4,
      taskName: '合同004解析任务',
      agentName: '合同解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:10:20',
      finishTime: '2024-01-15 14:13:45',
      duration: '3m 25s',
      description: '解析装修工程合同'
    },
    {
      id: 5,
      taskName: '物资清单005解析',
      agentName: '乙供物资解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:00:30',
      finishTime: '2024-01-15 14:02:10',
      duration: '1m 40s',
      description: '解析机械设备物资清单'
    }
  ],
  completed: [
    {
      id: 1,
      taskName: '合同001解析任务',
      agentName: '合同解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:30:25',
      finishTime: '2024-01-15 14:32:55',
      duration: '2m 30s',
      description: '解析建筑工程合同，提取关键信息'
    },
    {
      id: 4,
      taskName: '合同004解析任务',
      agentName: '合同解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:10:20',
      finishTime: '2024-01-15 14:13:45',
      duration: '3m 25s',
      description: '解析装修工程合同'
    },
    {
      id: 5,
      taskName: '物资清单005解析',
      agentName: '乙供物资解析智能体',
      status: STATUS_TYPES.SUCCESS,
      createTime: '2024-01-15 14:00:30',
      finishTime: '2024-01-15 14:02:10',
      duration: '1m 40s',
      description: '解析机械设备物资清单'
    }
  ],
  inProgress: [
    {
      id: 2,
      taskName: '物资清单002解析',
      agentName: '乙供物资解析智能体',
      status: STATUS_TYPES.PENDING,
      createTime: '2024-01-15 14:35:10',
      finishTime: null,
      duration: '进行中...',
      description: '解析电气设备物资清单',
      progress: 65
    }
  ],
  failed: [
    {
      id: 3,
      taskName: '甲供物资003处理',
      agentName: '甲供物资解析智能体',
      status: STATUS_TYPES.ERROR,
      createTime: '2024-01-15 14:20:15',
      finishTime: '2024-01-15 14:21:30',
      duration: '1m 15s',
      description: '处理钢材类甲供物资信息',
      errorMessage: '文档格式不支持，请检查上传文件是否为支持的格式(.pdf, .docx, .xlsx)'
    }
  ]
}
