// MainLayout 组件工具函数
import { SPECIAL_FUNCTIONS, ROUTES, LAYOUT_CONFIG } from './constants.js'

/**
 * 处理自定义函数选择
 * @param {string} key - 选择的函数键
 * @param {Object} router - Vue Router 实例
 * @param {Function} handleFunctionSelect - 处理函数选择的方法
 * @param {Function} addMessage - 添加消息的方法
 */
export const handleCustomFunctionSelect = (key, router, handleFunctionSelect, addMessage) => {
  if (key === SPECIAL_FUNCTIONS.SMART_BRAIN) {
    // 跳转到智能大脑页面
    router.push(ROUTES.SMART_BRAIN)
  } else {
    // 其他功能保持原有逻辑
    handleFunctionSelect(key, addMessage)
  }
}

/**
 * 切换侧边栏状态
 * @param {import('vue').Ref<boolean>} isSidebarOpen - 侧边栏开启状态的响应式引用
 */
export const toggleSidebar = (isSidebarOpen) => {
  isSidebarOpen.value = !isSidebarOpen.value
}

/**
 * 获取侧边栏宽度
 * @param {boolean} isOpen - 侧边栏是否开启
 * @returns {string} 侧边栏宽度
 */
export const getSidebarWidth = (isOpen) => {
  return isOpen ? LAYOUT_CONFIG.SIDEBAR_WIDTH_OPEN : LAYOUT_CONFIG.SIDEBAR_WIDTH_CLOSED
}

/**
 * 获取切换按钮位置
 * @param {boolean} isSidebarOpen - 侧边栏是否开启
 * @returns {string} 按钮左边距位置
 */
export const getToggleButtonPosition = (isSidebarOpen) => {
  return isSidebarOpen ? LAYOUT_CONFIG.TOGGLE_BUTTON_POSITION.OPEN : LAYOUT_CONFIG.TOGGLE_BUTTON_POSITION.CLOSED
}

/**
 * 创建切换侧边栏的函数
 * @param {import('vue').Ref<boolean>} isSidebarOpen - 侧边栏开启状态的响应式引用
 * @returns {Function} 切换函数
 */
export const createToggleSidebar = (isSidebarOpen) => {
  return () => toggleSidebar(isSidebarOpen)
}

/**
 * 创建自定义函数选择处理器
 * @param {Object} router - Vue Router 实例
 * @param {Function} handleFunctionSelect - 处理函数选择的方法
 * @param {Function} addMessage - 添加消息的方法
 * @returns {Function} 自定义函数选择处理器
 */
export const createCustomFunctionSelectHandler = (router, handleFunctionSelect, addMessage) => {
  return (key) => handleCustomFunctionSelect(key, router, handleFunctionSelect, addMessage)
}