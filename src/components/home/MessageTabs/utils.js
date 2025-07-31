// MessageTabs 组件工具函数

export const filterMessages = (messages, activeTab) => {
  if (activeTab === 'all') return messages
  return messages.filter(msg => msg.from === activeTab)
}

export const getTabCount = (messages, tabType) => {
  if (tabType === 'all') return messages.length
  return messages.filter(msg => msg.from === tabType).length
}