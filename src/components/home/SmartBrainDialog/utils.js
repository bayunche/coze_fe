// SmartBrainDialog 组件工具函数
import { nextTick } from 'vue'
import { AGENT_TYPES } from './constants.js'

/**
 * 获取智能体任务数据
 * @param {Object} tasksByAgent - 按智能体分组的任务数据
 * @param {string} agentId - 智能体ID
 * @returns {Object} 任务数据对象
 */
export const getAgentTasks = (tasksByAgent, agentId) => {
  return tasksByAgent[agentId] || { 
    all: [], 
    completed: [], 
    inProgress: [] 
  }
}

/**
 * 重置对话框状态
 * @param {Object} dialogStates - 对话框状态对象
 */
export const resetDialogStates = (dialogStates) => {
  Object.keys(dialogStates).forEach(key => {
    if (key.startsWith('is') && key.endsWith('Parsing')) {
      dialogStates[key].value = false
    }
  })
}

/**
 * 设置智能体对话框状态
 * @param {string} agentId - 智能体ID
 * @param {Object} dialogStates - 对话框状态对象
 * @param {Object} dialogVisibility - 对话框可见性对象
 */
export const setAgentDialogState = async (agentId, dialogStates, dialogVisibility) => {
  // 重置所有状态
  resetDialogStates(dialogStates)
  
  // 等待DOM更新
  await nextTick()
  
  // 根据智能体类型设置对应状态
  switch (agentId) {
    case AGENT_TYPES.CONTRACT_PARSING:
      dialogStates.isContractParsing.value = true
      dialogVisibility.taskParsingResultDialogVisible.value = true
      break
      
    case AGENT_TYPES.SUPPLIER_MATERIAL_PARSING:
      dialogStates.isSupplierMaterialParsing.value = true
      dialogVisibility.supplierMaterialParsingResultDialogVisible.value = true
      break
      
    case AGENT_TYPES.OWNER_MATERIAL_PARSING:
      dialogStates.isOwnerMaterialParsing.value = true
      dialogVisibility.ownerMaterialParsingResultDialogVisible.value = true
      break
      
    default:
      console.warn(`Unknown agent type: ${agentId}`)
  }
}

/**
 * 处理智能体卡片点击事件
 * @param {Object} agent - 智能体对象
 * @param {Object} tasksByAgent - 按智能体分组的任务数据
 * @param {Object} selectedTasks - 选中任务的引用
 * @param {Object} dialogStates - 对话框状态对象
 * @param {Object} dialogVisibility - 对话框可见性对象
 */
export const onAgentCardClick = async (
  agent,
  tasksByAgent,
  selectedTasks,
  dialogStates,
  dialogVisibility
) => {
  // 获取智能体的任务数据
  selectedTasks.value = getAgentTasks(tasksByAgent, agent.id)
  
  // 设置对话框状态
  await setAgentDialogState(agent.id, dialogStates, dialogVisibility)
}

/**
 * 关闭主对话框
 * @param {Function} emit - Vue emit函数
 */
export const closeMainDialog = (emit) => {
  emit('update:show', false)
}

/**
 * 格式化统计数据显示
 * @param {number} value - 数值
 * @returns {string} 格式化后的字符串
 */
export const formatStatValue = (value) => {
  if (typeof value !== 'number') {
    return '0'
  }
  
  return value.toLocaleString()
}

/**
 * 计算智能体状态样式类
 * @param {string} status - 状态值
 * @returns {string} CSS类名
 */
export const getAgentStatusClass = (status) => {
  return `agent-status-${status}`
}

/**
 * 检查智能体是否在线
 * @param {Object} agent - 智能体对象
 * @returns {boolean} 是否在线
 */
export const isAgentOnline = (agent) => {
  return agent.status === AGENT_TYPES.ONLINE
}

/**
 * 获取智能体进度百分比
 * @param {Object} agent - 智能体对象
 * @returns {number} 进度百分比
 */
export const getAgentProgress = (agent) => {
  const { completed, total } = agent.tasks
  
  if (!total || total === 0) {
    return 0
  }
  
  return Math.round((completed / total) * 100)
}

/**
 * 验证智能体数据结构
 * @param {Object} agent - 智能体对象
 * @returns {boolean} 是否有效
 */
export const validateAgentData = (agent) => {
  if (!agent || typeof agent !== 'object') {
    return false
  }
  
  const requiredFields = ['id', 'name', 'status', 'tasks']
  
  for (const field of requiredFields) {
    if (!(field in agent)) {
      return false
    }
  }
  
  const { tasks } = agent
  if (!tasks || typeof tasks !== 'object') {
    return false
  }
  
  const requiredTaskFields = ['completed', 'inProgress', 'total']
  for (const field of requiredTaskFields) {
    if (!(field in tasks) || typeof tasks[field] !== 'number') {
      return false
    }
  }
  
  return true
}

/**
 * 过滤有效的智能体数据
 * @param {Array} agents - 智能体数组
 * @returns {Array} 过滤后的有效智能体数组
 */
export const filterValidAgents = (agents) => {
  if (!Array.isArray(agents)) {
    return []
  }
  
  return agents.filter(validateAgentData)
}