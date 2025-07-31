// ThemeManager 组件相关常量

/**
 * 主题管理器显示模式
 */
export const DISPLAY_MODES = {
  COMPACT: 'compact',      // 紧凑模式 - 仅显示按钮
  TOGGLE: 'toggle',        // 切换模式 - 暗黑/浅色切换
  FULL: 'full'            // 完整模式 - 显示所有主题选项
}

/**
 * 弹出框类型配置
 */
export const POPUP_TYPES = {
  POPOVER: 'popover',     // 使用 Popover
  DROPDOWN: 'dropdown'    // 使用 Dropdown
}

/**
 * 弹出框位置配置
 */
export const PLACEMENT_OPTIONS = {
  TOP_START: 'top-start',
  TOP_END: 'top-end',
  BOTTOM_START: 'bottom-start',
  BOTTOM_END: 'bottom-end'
}

/**
 * 按钮尺寸配置
 */
export const BUTTON_SIZES = {
  SMALL: 'small',
  DEFAULT: 'default',
  LARGE: 'large'
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  MODE: DISPLAY_MODES.COMPACT,
  POPUP_TYPE: POPUP_TYPES.DROPDOWN,
  PLACEMENT: PLACEMENT_OPTIONS.TOP_START,
  SIZE: BUTTON_SIZES.DEFAULT,
  WIDTH: 240,
  CIRCLE: true
}

/**
 * 主题按钮配置
 */
export const THEME_BUTTON_CONFIG = {
  TITLE: '选择主题',
  ACTIVE_CLASS: 'active',
  THEME_CLASS: 'theme-button'
}

/**
 * 切换按钮配置
 */
export const TOGGLE_BUTTON_CONFIG = {
  LIGHT_TOOLTIP: '切换到暗黑模式',
  DARK_TOOLTIP: '切换到浅色模式',
  TOGGLE_CLASS: 'toggle-button'
}