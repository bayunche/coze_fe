// ChatInputArea 组件工具函数

export const validateInput = (input) => {
  return input && input.trim().length > 0
}

export const clearInput = (inputRef) => {
  if (inputRef) {
    inputRef.value = ''
  }
}