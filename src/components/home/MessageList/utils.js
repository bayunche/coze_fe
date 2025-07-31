// MessageList 组件工具函数

export const scrollToBottom = (container) => {
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

export const formatMessageTime = (timestamp) => {
  return timestamp || new Date().toLocaleTimeString()
}