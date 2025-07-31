// StreamingMessage 组件工具函数

/**
 * 模拟打字机效果
 * @param {string} text - 要显示的文本
 * @param {number} speed - 打字速度(ms)
 * @param {Function} onUpdate - 更新回调
 * @param {Function} onComplete - 完成回调
 */
export const simulateTyping = (text, speed = 50, onUpdate, onComplete) => {
  let index = 0
  const timer = setInterval(() => {
    if (index < text.length) {
      onUpdate(text.substring(0, index + 1))
      index++
    } else {
      clearInterval(timer)
      onComplete && onComplete()
    }
  }, speed)
  
  return timer
}

/**
 * 格式化流式消息内容
 * @param {string} content - 原始内容
 * @returns {string} 格式化后的内容
 */
export const formatStreamingContent = (content) => {
  if (!content) return ''
  
  // 处理换行符
  return content.replace(/\n/g, '<br>')
}

/**
 * 检查是否为完整消息
 * @param {Object} message - 消息对象
 * @returns {boolean} 是否完整
 */
export const isCompleteMessage = (message) => {
  return message && !message.isStreaming && message.content
}

/**
 * 获取消息状态指示器
 * @param {Object} message - 消息对象
 * @returns {string} 状态指示器
 */
export const getMessageStatusIndicator = (message) => {
  if (!message) return ''
  
  if (message.isStreaming) {
    return '⌨️ 正在输入...'
  } else if (message.error) {
    return '❌ 发送失败'
  } else {
    return '✅ 已发送'
  }
}