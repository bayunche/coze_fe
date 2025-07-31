// StreamingMessage 组件相关常量

/**
 * 流式消息类型
 */
export const STREAMING_TYPES = {
  TEXT: 'text',
  LOADING: 'loading',
  ERROR: 'error',
  COMPLETE: 'complete'
}

/**
 * 动画配置
 */
export const STREAMING_ANIMATION = {
  TYPING_SPEED: 50, // 打字机效果速度(ms)
  CURSOR_BLINK: 500, // 光标闪烁间隔(ms)
  FADE_DURATION: 200 // 淡入淡出时长(ms)
}

/**
 * 流式状态配置
 */
export const STREAMING_STATUS = {
  IDLE: 'idle',
  STREAMING: 'streaming',
  PAUSED: 'paused',
  FINISHED: 'finished'
}