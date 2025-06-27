<template>
  <el-card class="execution-panel-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="header-info">
          <span class="card-title">智能体交互</span>
          <el-tag v-if="currentWorkflow" type="primary" size="small" class="workflow-tag">
            {{ currentWorkflow.name }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="card-body-wrapper">
      <el-tabs v-model="activeTab" class="message-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="所有消息" name="all"></el-tab-pane>
        <el-tab-pane label="合同解析" name="contract"></el-tab-pane>
        <el-tab-pane label="乙供物资解析" name="material"></el-tab-pane>
        <el-tab-pane label="对话流" name="dialogue"></el-tab-pane>
      </el-tabs>

      <div ref="messageContainer" class="message-container">
        <div v-if="!messagesToRender.length" class="no-messages">
          <el-empty description="当前分类下没有消息" />
        </div>

        <template v-for="(message, index) in messagesToRender" :key="message.id">
          <div :class="['message-item', `message-from-${message.from}`]">
            <div class="message-bubble">
              <div class="message-sender" v-if="message.from !== 'user'">
                <strong>{{ message.sender }}</strong>
                <span v-if="message.workflow" class="workflow-info-tag">
                  (智能体功能: {{ message.workflow.name }})
                </span>
              </div>
              <div class="message-content">
                <StreamingMessage
                  :text="message.content"
                  :is-streaming="!!message.isStreaming"
                  :skip-animation="!message.isStreaming"
                  :force-animation="
                    message.from === 'system' &&
                    isDisplaying &&
                    displayedMessages.length > 0 &&
                    message.id === displayedMessages[displayedMessages.length - 1].id
                  "
                  @done="handleMessageDisplayed(index)"
                />
                <div v-if="message.type === 'loading'" class="loading-progress-container">
                  <el-progress
                    :percentage="message.progress"
                    :stroke-width="8"
                    striped
                    striped-flow
                    :duration="20"
                  />
                </div>
              </div>
              <div class="message-actions" v-if="message.showViewResultButton">
                <el-button type="primary" size="small" @click="handleViewResultDetail(message)">
                  查看解析结果
                </el-button>
              </div>
              <div class="message-timestamp">{{ message.timestamp }}</div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import StreamingMessage from './StreamingMessage.vue'

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  currentWorkflow: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['view-result-detail', 'message-displayed'])

const messageContainer = ref(null)
const displayedMessages = ref([])
const isDisplaying = ref(false) // 控制非流式消息的逐条显示动画
const streamingMessageId = ref(null) // 跟踪当前正在流式传输的消息ID
const activeTab = ref('all') // 'all', 'contract', 'dialogue'

// 计算属性，根据激活的 tab 过滤要显示的消息
const messagesToRender = computed(() => {
  if (activeTab.value === 'all') {
    return displayedMessages.value
  }
  if (activeTab.value === 'contract') {
    return displayedMessages.value.filter((m) => m.workflow && m.workflow.name === '合同解析')
  }
  if (activeTab.value === 'material') {
    return displayedMessages.value.filter((m) => m.workflow && m.workflow.name === '乙供物资解析')
  }
  if (activeTab.value === 'dialogue') {
    return displayedMessages.value.filter((m) => m.from === 'user' || !m.workflow)
  }
  return []
})

const handleTabClick = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const displayNextMessage = () => {
  const nextMessageInProps = props.messages.find(
    (msg) =>
      !displayedMessages.value.some((dMsg) => dMsg.id === msg.id) &&
      msg.id !== streamingMessageId.value
  )

  if (nextMessageInProps) {
    // 只有当没有消息正在显示时才开始显示下一条
    // 如果 isDisplaying 已经是 true，说明有消息正在动画，等待其完成
    if (!isDisplaying.value) {
      isDisplaying.value = true // 标记有消息正在显示/动画
      displayedMessages.value.push(nextMessageInProps)

      if (nextMessageInProps.isStreaming) {
        streamingMessageId.value = nextMessageInProps.id
      }
    }
  } else {
    isDisplaying.value = false // 没有更多消息需要显示
  }
}

const handleMessageDisplayed = (index) => {
  // 无论是否流式消息，只要 StreamingMessage 完成，就尝试显示下一条
  isDisplaying.value = false // 当前消息显示完成，重置状态
  streamingMessageId.value = null // 如果是流式消息，也在这里清除ID

  // 延迟一小段时间，确保 DOM 更新完成，然后尝试显示下一条消息
  nextTick(() => {
    displayNextMessage()
    emit('message-displayed') // 通知父组件消息已显示，以便继续处理队列
  })
}

watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    // 遍历新消息，处理流式更新和新消息添加
    newMessages.forEach((newMessage) => {
      const existingMessageIndex = displayedMessages.value.findIndex(
        (dMsg) => dMsg.id === newMessage.id
      )

      if (newMessage.isStreaming) {
        // 如果是流式消息
        if (existingMessageIndex !== -1) {
          // 更新现有流式消息的内容和状态
          displayedMessages.value[existingMessageIndex].content = newMessage.content
          displayedMessages.value[existingMessageIndex].isStreaming = newMessage.isStreaming
          displayedMessages.value[existingMessageIndex].showViewResultButton =
            newMessage.showViewResultButton
        } else {
          // 如果是新的流式消息，添加到 displayedMessages
          // 注意：这里直接添加原始消息对象，以保持响应性
          displayedMessages.value.push(newMessage)
          streamingMessageId.value = newMessage.id
          // 新的流式消息，立即尝试显示
          if (!isDisplaying.value) {
            displayNextMessage()
          }
        }
      } else {
        // 非流式消息或流式结束的消息
        if (existingMessageIndex !== -1) {
          // 更新内容和状态，确保isStreaming为false
          displayedMessages.value[existingMessageIndex].content = newMessage.content
          displayedMessages.value[existingMessageIndex].isStreaming = false
          displayedMessages.value[existingMessageIndex].showViewResultButton =
            newMessage.showViewResultButton
          // 如果是当前正在流式传输的消息结束，清除 streamingMessageId
          if (streamingMessageId.value === newMessage.id) {
            streamingMessageId.value = null
            // 流式结束，尝试显示下一条非流式消息
            if (!isDisplaying.value) {
              // 确保在流式消息结束后，如果当前没有其他消息在显示，则尝试显示下一条
              displayNextMessage()
            }
          }
        } else {
          // 新的非流式消息，如果当前没有消息正在显示，则立即显示
          if (!isDisplaying.value && streamingMessageId.value === null) {
            displayNextMessage()
          }
        }
      }
    })

    // 如果 newMessages 变为空，清空 displayedMessages
    if (newMessages.length === 0) {
      displayedMessages.value = []
      isDisplaying.value = false
      streamingMessageId.value = null
    }

    // 确保滚动到底部
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { deep: true, immediate: true } // 深度监听，并立即执行一次
)

watch(
  displayedMessages,
  () => {
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  if (props.messages.length > 0) {
    displayNextMessage()
  }
})

const handleViewResultDetail = (message) => {
  // 根据消息的 workflow.name 决定触发哪个事件
  if (message.workflow && message.workflow.name === '合同解析') {
    // 对于合同解析，触发 view-result-detail 事件，并传递 message.task (即 taskId)
    emit('view-result-detail', message.task)
  } else if (message.workflow && message.workflow.name === '乙供物资解析') {
    // 对于乙供物资解析，触发 view-material-result-detail 事件，并传递 message.task (即 taskId)
    emit('view-material-result-detail', message.task)
  } else {
    // 对于其他未知类型的解析结果，可以触发一个默认的 view-result-detail 事件，不带参数或带通用参数
    // 这里为了兼容性，仍然触发 view-result-detail，但不传递 task，让 HomeView 决定如何处理
    emit('view-result-detail')
  }
}
</script>

<style scoped>
.card-body-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.message-tabs {
  padding: 0 20px;
  flex-shrink: 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.execution-panel-card {
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.workflow-tag {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  border: none;
  color: white;
}

.message-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f9fafb;
  /* border-radius: 12px; */
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(60vh - 40px); /* Adjust height to account for tabs */
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.message-item {
  display: flex;
  max-width: 85%;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
  width: fit-content;
}

.message-sender {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.workflow-info-tag {
  font-style: italic;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-actions {
  margin-top: 10px;
}

.loading-progress-container {
  margin-top: 12px;
}

.message-timestamp {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 6px;
  text-align: right;
}

/* User messages */
.message-from-user {
  align-self: flex-end;
}
.message-from-user .message-bubble {
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

/* Agent/System messages */
.message-from-agent,
.message-from-system {
  align-self: flex-start;
}
.message-from-agent .message-bubble,
.message-from-system .message-bubble {
  background: #e5e7eb;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}
</style>
