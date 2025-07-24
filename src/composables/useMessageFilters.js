import { computed } from 'vue'

/**
 * 消息过滤和增强组合式函数
 * 处理消息的分类过滤和增强逻辑
 */
export function useMessageFilters(messages, activeTab) {
  /**
   * 增强消息，添加必要的按钮和交互元素
   * @param {Object} msg - 原始消息对象
   * @returns {Object} 增强后的消息对象
   */
  const enhanceMessage = (msg) => {
    const isParsingWorkflow =
      msg.workflow && ['乙供物资解析', '甲供物资解析', '甲供物资重新解析', '合同解析'].includes(msg.workflow.name)
    const needConfirm =
      isParsingWorkflow &&
      typeof msg.content === 'string' &&
      msg.content.includes('存在无法匹配的物资信息，请人工介入') &&
      msg.task

    if (needConfirm) {
      const hasButton =
        Array.isArray(msg.buttons) &&
        msg.buttons.some((b) => b.action === 'confirm-material-alignment')
      if (!hasButton) {
        return {
          ...msg,
          buttons: [
            ...(msg.buttons || []),
            {
              text: '物资信息确认',
              action: 'confirm-material-alignment',
              data: { taskId: msg.task }
            }
          ]
        }
      }
    }
    return msg
  }

  /**
   * 根据激活的标签页过滤消息
   */
  const filteredMessages = computed(() => {
    let filtered = messages.value
    
    // 添加调试日志
    if (import.meta.env.DEV) {
      console.log('🔍 [useMessageFilters] 当前标签页:', activeTab.value)
      console.log('🔍 [useMessageFilters] 原始消息数量:', messages.value.length)
      console.log('🔍 [useMessageFilters] 原始消息:', messages.value)
    }
    
    if (activeTab.value === 'contract') {
      filtered = messages.value.filter((m) => 
        m.workflow?.name === '合同解析'
      )
    } else if (activeTab.value === 'material') {
      filtered = messages.value.filter((m) => 
        m.workflow?.name === '乙供物资解析'
      )
    } else if (activeTab.value === 'j_material') {
      filtered = messages.value.filter((m) => 
        m.workflow?.name === '甲供物资解析'
      )
    } else if (activeTab.value === 'dialogue') {
      filtered = messages.value.filter((m) => m.from === 'user' || !m.workflow)
    }
    
    // 添加调试日志
    if (import.meta.env.DEV) {
      console.log('🔍 [useMessageFilters] 筛选后消息数量:', filtered.length)
      console.log('🔍 [useMessageFilters] 筛选后消息:', filtered)
    }
    
    return filtered.map(enhanceMessage)
  })

  return {
    filteredMessages,
    enhanceMessage,
  }
}