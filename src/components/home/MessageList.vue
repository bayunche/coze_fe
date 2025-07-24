<template>
  <div ref="messageContainer" class="message-container">
    <div v-if="!displayedMessages.length" class="no-messages">
      <el-empty description="当前分类下没有消息" />
    </div>

    <transition-group name="message-fade" tag="div" class="message-list">
      <MessageItem
        v-for="message in displayedMessages"
        :key="message.id"
        :message="message"
        :skip-animation="props.activeTab !== 'all'"
        @animation-end="handleAnimationEnd"
        @view-result-detail="$emit('view-result-detail', $event)"
        @custom-button-click="$emit('custom-button-click', $event)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed, toRef } from 'vue'
import MessageItem from './MessageItem.vue'
import { useMessageQueue } from '@/composables/useMessageQueue'
import { useMessageFilters } from '@/composables/useMessageFilters'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['view-result-detail', 'custom-button-click'])

// 引用
const messageContainer = ref(null)

// 使用组合式函数 - 直接使用props的toRef，保持响应性
const { filteredMessages } = useMessageFilters(toRef(props, 'messages'), toRef(props, 'activeTab'))
const {
  displayedMessages,
  messageQueue,
  isProcessingQueue,
  scrollToBottom,
  processQueue,
  handleAnimationEnd: handleQueueAnimationEnd,
  resetQueue,
  initializeQueue,
  handleFilteredMessagesChange
} = useMessageQueue(filteredMessages)

// 处理动画结束
const handleAnimationEnd = () => {
  handleQueueAnimationEnd(messageContainer)
}

// 监听activeTab变化以重置队列
watch(
  () => props.activeTab,
  (newActiveTab) => {
    if (import.meta.env.DEV) {
      console.log('🔧 [MessageList] Active tab changed to:', newActiveTab)
    }
    resetQueue()
    initializeQueue(messageContainer)
  }
)

// 监听过滤消息变化
watch(
  filteredMessages,
  (newMessages, oldMessages) => {
    if (import.meta.env.DEV) {
      console.log('🔧 [MessageList] Filtered messages changed:')
      console.log('  - Old count:', oldMessages?.length || 0)
      console.log('  - New count:', newMessages?.length || 0)
      console.log('  - New messages:', newMessages)
    }
    handleFilteredMessagesChange(newMessages, oldMessages, messageContainer)
  },
  { deep: true }
)

// 添加displayedMessages的监听器来调试渲染问题
watch(
  displayedMessages,
  (newDisplayed) => {
    if (import.meta.env.DEV) {
      console.log('🔧 [MessageList] Displayed messages changed:')
      console.log('  - Count:', newDisplayed.length)
      console.log('  - Messages:', newDisplayed)
    }
  },
  { deep: true }
)

// 添加调试计算属性
const debugInfo = computed(() => {
  if (import.meta.env.DEV) {
    return {
      propsMessages: props.messages.length,
      filteredMessages: filteredMessages.value.length,
      displayedMessages: displayedMessages.value.length,
      messageQueue: messageQueue.value.length,
      isProcessingQueue: isProcessingQueue.value
    }
  }
  return null
})

// 监听调试信息变化
watch(
  debugInfo,
  (info) => {
    if (import.meta.env.DEV && info) {
      console.log('🔍 [MessageList] Debug Info:', info)
    }
  },
  { deep: true }
)

// 滚动到底部
const scrollToBottomMethod = () => {
  scrollToBottom(messageContainer)
}

// 挂载时初始化
onMounted(() => {
  if (props.messages.length > 0) {
    initializeQueue(messageContainer)
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom: scrollToBottomMethod
})
</script>

<style scoped>
/* Transition Animation */
.message-fade-enter-active,
.message-fade-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.message-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 40px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(80vh - 4rem);

  /* 响应式居中布局逻辑 */
  --max-width-layout-container-width: 100vw;
  --max-width-layout-large-padding: 24px;
  --max-width-layout-small-padding: 16px;
  --center-content-max-width: 1200px;

  --left-side-width: 0px;
  --right-side-width: 0px;

  --width: calc(
    var(--max-width-layout-container-width) - var(--left-side-width) - var(--right-side-width)
  );
  --center-content: min(var(--width), var(--center-content-max-width));
  --total-side: calc(
    var(--max-width-layout-container-width) - var(--center-content) - var(--left-side-width) -
      var(--right-side-width)
  );
  --left-side: calc(var(--total-side) / 2);
  --content-left: calc(var(--left-side) + var(--left-side-width));

  --padding: clamp(
    var(--max-width-layout-small-padding),
    calc(50vw - 500px - var(--left-side-width) / 2 - var(--right-side-width) / 2),
    var(--max-width-layout-large-padding)
  );

  padding-left: calc(var(--content-left) + var(--padding));
  padding-right: calc(
    var(--left-side) + var(--padding) + var(--right-side-width) - var(--scrollbar-width, 0px)
  );

  background: #ffffff;
}

/* 隐藏滚动条，保持光滑滚动 */
.message-container::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
