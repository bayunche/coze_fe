import { DIALOG_TYPES, STATUS_TYPES, STATUS_LABELS, MOCK_TASK_DETAILS } from './constants.js'

/**
 * 计算总览数据
 * @param {Array} smartAgents - 智能体列表
 * @returns {Object} 总览数据对象
 */
export const calculateOverviewData = (smartAgents) => {
  let totalTasks = 0
  let inProgressTasks = 0
  let completedTasks = 0
  let failedTasks = 0 // TODO: 后续需要从真实 API 获取失败任务数

  smartAgents.forEach(agent => {
    totalTasks += agent.tasks.total || 0
    inProgressTasks += agent.tasks.inProgress || 0
    completedTasks += agent.tasks.completed || 0
    // TODO: 暂时使用 mock 数据，后续需要添加真实的失败任务统计
    failedTasks += agent.tasks.failed || 0
  })

  // TODO: 暂时使用 mock 数据，后续需要替换为真实数据
  if (failedTasks === 0) {
    failedTasks = 1 // 暂时显示 1 个失败任务作为示例
  }

  return {
    totalTasks,
    inProgressTasks,
    completedTasks,
    failedTasks
  }
}

/**
 * 根据智能体ID确定对话框类型
 * @param {string} agentId - 智能体ID
 * @returns {string|null} 对话框类型
 */
export const getDialogTypeByAgentId = (agentId) => {
  switch (agentId) {
    case DIALOG_TYPES.CONTRACT_PARSING:
      return DIALOG_TYPES.CONTRACT_PARSING
    case DIALOG_TYPES.SUPPLIER_MATERIAL_PARSING:
      return DIALOG_TYPES.SUPPLIER_MATERIAL_PARSING
    case DIALOG_TYPES.OWNER_MATERIAL_PARSING:
      return DIALOG_TYPES.OWNER_MATERIAL_PARSING
    default:
      return null
  }
}

/**
 * 获取状态显示标签
 * @param {string} status - 状态值
 * @returns {string} 状态标签
 */
export const getStatusLabel = (status) => {
  return STATUS_LABELS[status] || status
}

/**
 * 获取状态类型（用于Element Plus标签类型）
 * @param {string} status - 状态值
 * @returns {string} Element Plus标签类型
 */
export const getStatusType = (status) => {
  switch (status) {
    case STATUS_TYPES.SUCCESS:
      return 'success'
    case STATUS_TYPES.ERROR:
      return 'danger'
    case STATUS_TYPES.PENDING:
      return 'warning'
    default:
      return 'info'
  }
}


/**
 * 判断功能是否可用
 * @param {Object} feature - 功能配置对象
 * @returns {boolean} 是否可用
 */
export const isFeatureAvailable = (feature) => {
  return feature.available === true
}

/**
 * 获取用户角色标签
 * @param {boolean} isAdmin - 是否为管理员
 * @returns {Object} 标签配置对象
 */
export const getUserRoleTag = (isAdmin) => {
  return {
    type: isAdmin ? 'success' : 'info',
    text: isAdmin ? '管理员' : '普通用户'
  }
}

/**
 * 生成路由跳转处理函数
 * @param {Object} router - Vue Router实例
 * @returns {Function} 路由跳转函数
 */
export const createRouteNavigator = (router) => {
  return (route) => {
    router.push(route)
  }
}

/**
 * 格式化智能体任务数据
 * @param {Object} taskListsByAgent - 按智能体分组的任务列表
 * @param {string} agentId - 智能体ID
 * @returns {Object} 格式化后的任务数据
 */
export const formatAgentTasks = (taskListsByAgent, agentId) => {
  return taskListsByAgent[agentId] || {
    all: [],
    completed: [],
    inProgress: []
  }
}

/**
 * 重置对话框状态
 * @returns {Object} 重置后的状态对象
 */
export const resetDialogStates = () => {
  return {
    isContractParsing: false,
    isSupplierMaterialParsing: false,
    isOwnerMaterialParsing: false,
    taskParsingResultDialogVisible: false,
    supplierMaterialParsingResultDialogVisible: false,
    ownerMaterialParsingResultDialogVisible: false,
    // 新增统计弹窗状态
    overviewStatsDialogVisible: false
  }
}

/**
 * 获取统计弹窗的 mock 数据
 * @param {string} dialogType - 弹窗类型 (total, completed, inProgress, failed)
 * @returns {Array} 统计数据列表
 */
export const getStatsDialogMockData = (dialogType) => {
  // TODO: 后续需要替换为真实 API 数据
  return MOCK_TASK_DETAILS[dialogType] || []
}

/**
 * 获取统计弹窗的标题
 * @param {string} dialogType - 弹窗类型
 * @returns {string} 弹窗标题
 */
export const getStatsDialogTitle = (dialogType) => {
  const titleMap = {
    total: '总任务数详情',
    completed: '已完成任务详情',
    inProgress: '进行中任务详情',
    failed: '执行失败任务详情'
  }
  return titleMap[dialogType] || '任务详情'
}

/**
 * 格式化持续时间显示
 * @param {string} createTime - 创建时间
 * @returns {string} 格式化后的持续时间
 */
export const formatDurationFromCreate = (createTime) => {
  if (!createTime) return '-'
  
  const now = new Date()
  const create = new Date(createTime)
  const diffMs = now.getTime() - create.getTime()
  
  if (diffMs < 60000) {
    return `${Math.floor(diffMs / 1000)}s`
  } else if (diffMs < 3600000) {
    return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`
  } else {
    const hours = Math.floor(diffMs / 3600000)
    const minutes = Math.floor((diffMs % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }
}