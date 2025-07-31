// TaskStatusWatcher 组件相关常量

export const WATCH_CONFIG = {
  POLL_INTERVAL: 3000, // 3秒轮询一次
  MAX_RETRIES: 10, // 最大重试次数
  TIMEOUT: 30000 // 30秒超时
}

export const WATCHER_STATUS = {
  IDLE: 'idle',
  WATCHING: 'watching',
  PAUSED: 'paused',
  ERROR: 'error'
}