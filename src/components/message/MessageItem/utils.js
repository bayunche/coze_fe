import { MESSAGE_FROM, MESSAGE_TYPES } from './constants.js'

/**
 * 判断是否为用户消息
 * @param {string} from - 消息来源
 * @returns {boolean}
 */
export const isUserMessage = (from) => {
  return from === MESSAGE_FROM.USER
}

/**
 * 判断是否为系统或代理消息
 * @param {string} from - 消息来源
 * @returns {boolean}
 */
export const isSystemOrAgentMessage = (from) => {
  return from === MESSAGE_FROM.AGENT || from === MESSAGE_FROM.SYSTEM
}

/**
 * 判断是否为加载状态消息
 * @param {string} type - 消息类型
 * @returns {boolean}
 */
export const isLoadingMessage = (type) => {
  return type === MESSAGE_TYPES.LOADING
}

/**
 * 判断是否显示发送者信息
 * @param {string} from - 消息来源
 * @returns {boolean}
 */
export const shouldShowSender = (from) => {
  return !isUserMessage(from)
}

/**
 * 判断是否显示操作按钮
 * @param {Object} message - 消息对象
 * @returns {boolean}
 */
export const shouldShowActions = (message) => {
  return message.showViewResultButton || (message.buttons && message.buttons.length > 0)
}

/**
 * 获取消息气泡的CSS类名
 * @param {string} from - 消息来源
 * @returns {string}
 */
export const getMessageItemClass = (from) => {
  return `message-from-${from}`
}

/**
 * 格式化工作流信息
 * @param {Object} workflow - 工作流对象
 * @returns {string}
 */
export const formatWorkflowInfo = (workflow) => {
  return workflow ? `(智能体功能: ${workflow.name})` : ''
}