// MessageItem 组件相关常量

export const MESSAGE_TYPES = {
  LOADING: 'loading',
  TEXT: 'text',
  STREAMING: 'streaming'
}

export const MESSAGE_FROM = {
  USER: 'user',
  AGENT: 'agent',
  SYSTEM: 'system'
}

export const BUTTON_TYPES = {
  VIEW_RESULT: 'view-result',
  CUSTOM: 'custom'
}

export const UI_CONFIG = {
  PROGRESS_STROKE_WIDTH: 8,
  PROGRESS_DURATION: 20,
  MESSAGE_MAX_WIDTH_USER: '85%',
  MESSAGE_MAX_WIDTH_AGENT: '100%'
}

export const EMIT_EVENTS = {
  ANIMATION_END: 'animation-end',
  VIEW_RESULT_DETAIL: 'view-result-detail', 
  CUSTOM_BUTTON_CLICK: 'custom-button-click'
}