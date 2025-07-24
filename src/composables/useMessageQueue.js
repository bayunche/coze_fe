import { ref, watch, nextTick, onMounted } from 'vue'

/**
 * 消息队列管理组合式函数
 * 处理消息的队列化显示、动画控制等逻辑
 */
export function useMessageQueue(filteredMessages) {
  // 消息队列状态
  const displayedMessages = ref([])
  const messageQueue = ref([])
  const isProcessingQueue = ref(false)

  /**
   * 滚动到底部
   */
  const scrollToBottom = (messageContainer) => {
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  }

  /**
   * 处理消息队列
   */
  const processQueue = (messageContainer) => {
    if (import.meta.env.DEV) {
      console.log('🚀 [useMessageQueue] processQueue called:')
      console.log('  - isProcessingQueue:', isProcessingQueue.value)
      console.log('  - messageQueue length:', messageQueue.value.length)
      console.log('  - displayedMessages length:', displayedMessages.value.length)
    }
    
    if (isProcessingQueue.value || messageQueue.value.length === 0) {
      if (import.meta.env.DEV) {
        console.log('🚀 [useMessageQueue] processQueue early return')
      }
      return
    }
    
    isProcessingQueue.value = true
    const nextMessage = messageQueue.value.shift()
    
    if (import.meta.env.DEV) {
      console.log('🚀 [useMessageQueue] Processing message:', nextMessage)
    }
    
    displayedMessages.value.push(nextMessage)
    scrollToBottom(messageContainer)

    // 如果是 loading 消息，我们不等待 animation-end，而是通过 watch 来解锁
    // 对于非 loading 消息，animation-end 会负责解锁
    if (nextMessage.type === 'loading') {
      // 标记正在处理，但允许 watch 解锁
    }
  }

  /**
   * 处理动画结束
   */
  const handleAnimationEnd = (messageContainer) => {
    isProcessingQueue.value = false
    processQueue(messageContainer)
  }

  /**
   * 重置队列状态
   */
  const resetQueue = () => {
    messageQueue.value = []
    displayedMessages.value = []
    isProcessingQueue.value = false
  }

  /**
   * 初始化队列
   */
  const initializeQueue = (messageContainer) => {
    if (import.meta.env.DEV) {
      console.log('🔄 [useMessageQueue] initializeQueue called with:', filteredMessages.value.length, 'messages')
    }
    
    nextTick(() => {
      messageQueue.value.push(...filteredMessages.value)
      
      if (import.meta.env.DEV) {
        console.log('🔄 [useMessageQueue] Queue initialized, starting processQueue')
      }
      
      processQueue(messageContainer)
    })
  }

  /**
   * 处理过滤消息变化的函数，需要在组件中调用
   */
  const handleFilteredMessagesChange = (newMessages, oldMessages, messageContainer) => {
    if (import.meta.env.DEV) {
      console.log('⚡ [useMessageQueue] handleFilteredMessagesChange called:')
      console.log('  - newMessages:', newMessages.length, 'messages')
      console.log('  - oldMessages:', oldMessages?.length || 0, 'messages')
      console.log('  - displayedMessages:', displayedMessages.value.length, 'messages')
      console.log('  - messageQueue:', messageQueue.value.length, 'messages')
    }

    // 1. 更新已显示消息的状态（特别是 loading 进度）
    const updatedDisplayedMessages = displayedMessages.value
      .map((dMsg) => {
        const updatedVersion = newMessages.find((nMsg) => nMsg.id === dMsg.id)
        return updatedVersion ? { ...updatedVersion } : null
      })
      .filter(Boolean)

    if (JSON.stringify(updatedDisplayedMessages) !== JSON.stringify(displayedMessages.value)) {
      if (import.meta.env.DEV) {
        console.log('⚡ [useMessageQueue] Updating displayed messages')
      }
      displayedMessages.value = updatedDisplayedMessages
    }

    // 2. 检查 loading 消息是否完成
    const lastDisplayed = displayedMessages.value[displayedMessages.value.length - 1]
    if (isProcessingQueue.value && lastDisplayed && lastDisplayed.type === 'loading') {
      const correspondingNewMessage = newMessages.find((m) => m.id === lastDisplayed.id)
      if (!correspondingNewMessage || correspondingNewMessage.type !== 'loading') {
        if (import.meta.env.DEV) {
          console.log('⚡ [useMessageQueue] Loading message completed, unlocking queue')
        }
        isProcessingQueue.value = false
        processQueue(messageContainer)
      }
    }

    // 3. 将新消息添加到队列
    const displayedIds = new Set(displayedMessages.value.map((m) => m.id))
    const queuedIds = new Set(messageQueue.value.map((m) => m.id))
    const newIncomingMessages = newMessages.filter(
      (m) => !displayedIds.has(m.id) && !queuedIds.has(m.id)
    )

    if (import.meta.env.DEV) {
      console.log('⚡ [useMessageQueue] New incoming messages:', newIncomingMessages.length)
    }

    if (newIncomingMessages.length > 0) {
      messageQueue.value.push(...newIncomingMessages)
      processQueue(messageContainer)
    }

    // 4. 处理消息清空
    if (newMessages.length === 0 && oldMessages.length > 0) {
      if (import.meta.env.DEV) {
        console.log('⚡ [useMessageQueue] Messages cleared, resetting queue')
      }
      resetQueue()
    }
  }

  return {
    displayedMessages,
    messageQueue,
    isProcessingQueue,
    scrollToBottom,
    processQueue,
    handleAnimationEnd,
    resetQueue,
    initializeQueue,
    handleFilteredMessagesChange,
  }
}