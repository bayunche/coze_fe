// ThemeManager 组件工具函数

import { DISPLAY_MODES, DEFAULT_CONFIG, POPUP_TYPES, PLACEMENT_OPTIONS } from './constants.js'

/**
 * 处理主题选择
 * @param {string} themeId - 主题ID
 * @param {Object} themeStore - 主题store实例
 */
export const selectTheme = (themeId, themeStore) => {
  const { setTheme, setAutoTheme } = themeStore
  
  // 如果开启了自动主题，先关闭
  if (themeStore.autoTheme) {
    setAutoTheme(false)
  }
  
  setTheme(themeId)
}

/**
 * 处理自动主题切换
 * @param {boolean} value - 是否开启自动主题
 * @param {Object} themeStore - 主题store实例
 */
export const toggleAutoTheme = (value, themeStore) => {
  const { setAutoTheme } = themeStore
  setAutoTheme(value)
}

/**
 * 处理暗黑模式切换
 * @param {Object} themeStore - 主题store实例
 */
export const toggleDarkMode = (themeStore) => {
  const { currentTheme, autoTheme, setTheme, setAutoTheme } = themeStore
  
  // 如果开启了自动主题，先关闭
  if (autoTheme) {
    setAutoTheme(false)
  }
  
  // 在暗黑和浅色之间切换
  const isDark = currentTheme === 'dark' || currentTheme === 'tech-blue'
  setTheme(isDark ? 'light' : 'dark')
}

/**
 * 检查是否为暗黑主题
 * @param {string} theme - 当前主题
 * @returns {boolean} 是否为暗黑主题
 */
export const isDarkTheme = (theme) => {
  const darkThemes = ['dark', 'tech-blue', 'purple-dream']
  return darkThemes.includes(theme)
}

/**
 * 检查主题是否处于激活状态
 * @param {string} currentTheme - 当前主题
 * @param {string} mode - 显示模式
 * @returns {boolean} 是否激活
 */
export const isThemeActive = (currentTheme, mode) => {
  if (mode === DISPLAY_MODES.COMPACT) {
    return currentTheme !== 'light' && currentTheme !== 'dark'
  }
  return false
}

/**
 * 获取当前主题信息
 * @param {string} themeId - 主题ID
 * @param {Array} themes - 主题列表
 * @returns {Object} 主题信息
 */
export const getCurrentThemeInfo = (themeId, themes) => {
  return themes.find(theme => theme.id === themeId) || themes[0]
}

/**
 * 格式化主题网格数据
 * @param {Array} themes - 原始主题数据
 * @returns {Array} 格式化后的主题数据
 */
export const formatThemeGrid = (themes) => {
  return themes.map(theme => ({
    ...theme,
    preview: theme.colors || {}
  }))
}

/**
 * 验证组件配置
 * @param {Object} config - 组件配置
 * @returns {Object} 验证后的配置
 */
export const validateConfig = (config) => {
  // 常量已在文件顶部导入
  
  return {
    mode: Object.values(DISPLAY_MODES).includes(config.mode) ? config.mode : DEFAULT_CONFIG.MODE,
    popupType: Object.values(POPUP_TYPES).includes(config.popupType) ? config.popupType : DEFAULT_CONFIG.POPUP_TYPE,
    placement: Object.values(PLACEMENT_OPTIONS).includes(config.placement) ? config.placement : DEFAULT_CONFIG.PLACEMENT,
    size: config.size || DEFAULT_CONFIG.SIZE,
    width: config.width || DEFAULT_CONFIG.WIDTH,
    circle: config.circle !== undefined ? config.circle : DEFAULT_CONFIG.CIRCLE
  }
}