import { DIALOG_TYPES, STATUS_TYPES, STATUS_LABELS } from './constants.js'

/**
 * 计算总览数据
 * @param {Array} smartAgents - 智能体列表
 * @returns {Object} 总览数据对象
 */
export const calculateOverviewData = (smartAgents) => {
  let totalTasks = 0
  let inProgressTasks = 0
  let completedTasks = 0

  smartAgents.forEach(agent => {
    totalTasks += agent.tasks.total || 0
    inProgressTasks += agent.tasks.inProgress || 0
    completedTasks += agent.tasks.completed || 0
  })

  return {
    totalTasks,
    inProgressTasks,
    completedTasks
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
    ownerMaterialParsingResultDialogVisible: false
  }
}