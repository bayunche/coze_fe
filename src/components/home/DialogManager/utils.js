// DialogManager 组件工具函数

/**
 * 管理对话框状态
 * @param {Object} dialogStates - 对话框状态对象
 * @param {string} dialogType - 对话框类型
 * @param {boolean} visible - 是否可见
 */
export const manageDialogState = (dialogStates, dialogType, visible) => {
  if (dialogStates[dialogType] !== undefined) {
    dialogStates[dialogType] = visible
  }
}

/**
 * 关闭所有对话框
 * @param {Object} dialogStates - 对话框状态对象
 */
export const closeAllDialogs = (dialogStates) => {
  Object.keys(dialogStates).forEach(key => {
    dialogStates[key] = false
  })
}

/**
 * 检查是否有对话框打开
 * @param {Object} dialogStates - 对话框状态对象
 * @returns {boolean} 是否有对话框打开
 */
export const hasOpenDialog = (dialogStates) => {
  return Object.values(dialogStates).some(state => state === true)
}

/**
 * 获取当前打开的对话框类型
 * @param {Object} dialogStates - 对话框状态对象
 * @returns {string|null} 对话框类型或null
 */
export const getCurrentOpenDialog = (dialogStates) => {
  const openDialog = Object.entries(dialogStates).find(([, value]) => value === true)
  return openDialog ? openDialog[0] : null
}