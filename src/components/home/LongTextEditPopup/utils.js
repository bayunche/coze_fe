// LongTextEditPopup 组件工具函数

export const validateTextLength = (text, maxLength = 5000) => {
  return text.length <= maxLength
}

export const formatTextForDisplay = (text) => {
  return text.replace(/\n/g, '<br>')
}

export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}