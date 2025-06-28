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

        <template v-for="message in messagesToRender" :key="message.id">
          <div :class="['message-item', `message-from-${message.from}`]">
            <div class="message-bubble">
              <div class="message-sender" v-if="message.from !== 'user'">
                <strong style="font-size: 18px">{{ message.sender }}</strong>
                <span v-if="message.workflow" class="workflow-info-tag">
                  (智能体功能: {{ message.workflow.name }})
                </span>
              </div>
              <div class="message-content">
                <StreamingMessage
                  :text="message.content"
                  :is-streaming="message.isStreaming && message.id === streamingMessageId"
                  :skip-animation="
                    activeTab !== 'all' ||
                    (message.id !== streamingMessageId && !message.isStreaming)
                  "
                  @done="handleMessageDisplayed(message.id)"
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

const emit = defineEmits(['view-result-detail', 'message-displayed', 'view-material-result-detail'])

const messageContainer = ref(null)
const displayedMessages = ref([])
const messageQueue = ref([]) // 消息队列，用于存储待显示的消息
const isProcessingMessage = ref(false) // 标记是否有消息正在处理（流式或非流式动画）
const streamingMessageId = ref(null) // 跟踪当前正在流式传输的消息ID
const isAppending = ref(false) // 标记是否正在追加消息内容
const activeTab = ref('all') // 'all', 'contract', 'dialogue'

// 计算属性，根据激活的 tab 过滤要显示的消息
const messagesToRender = computed(() => {
  if (activeTab.value === 'all') {
    return displayedMessages.value
  } else {
    // 在非 'all' 标签页时，直接从 props.messages 过滤并显示
    let filteredMessages = props.messages
    if (activeTab.value === 'contract') {
      filteredMessages = filteredMessages.filter(
        (m) => m.workflow && m.workflow.name === '合同解析'
      )
    } else if (activeTab.value === 'material') {
      filteredMessages = filteredMessages.filter(
        (m) => m.workflow && m.workflow.name === '乙供物资解析'
      )
    } else if (activeTab.value === 'dialogue') {
      filteredMessages = filteredMessages.filter((m) => m.from === 'user' || !m.workflow)
    }
    // 在这些特定标签页下，消息的 isStreaming 状态应该保持其原始值，以便 StreamingMessage 能够根据实际情况进行流式或追加显示。
    // 同时，确保在这些筛选标签页下，消息仍然是立即完整显示（非逐条动画）。
    return filteredMessages
  }
})

const processNextMessage = () => {
  if (isAppending.value) {
    console.log('【诊断】WorkflowExecutionPanel - 正在追加消息，暂停处理队列。')
    return
  }

  if (messageQueue.value.length > 0 && !isProcessingMessage.value) {
    const nextMessage = messageQueue.value.shift() // 从队列中取出下一条消息
    console.log(
      `【诊断】WorkflowExecutionPanel - 处理下一条消息: ID=${nextMessage.id}, isStreaming=${nextMessage.isStreaming}`
    )

    // 检查消息是否已存在于 displayedMessages，如果存在则更新，否则添加
    const existingIndex = displayedMessages.value.findIndex((m) => m.id === nextMessage.id)
    if (existingIndex !== -1) {
      // 如果消息已存在，更新其内容和流式状态
      displayedMessages.value[existingIndex] = {
        ...displayedMessages.value[existingIndex],
        ...nextMessage
      }
    } else {
      // 新消息，添加到 displayedMessages
      displayedMessages.value.push(nextMessage)
    }

    isProcessingMessage.value = true // 标记为正在处理

    if (nextMessage.isStreaming) {
      streamingMessageId.value = nextMessage.id
      console.log(
        `【诊断】WorkflowExecutionPanel - 设置当前流式消息ID: ${streamingMessageId.value}`
      )
    } else {
      // 对于非流式消息，立即解除处理状态并尝试处理下一条
      isProcessingMessage.value = false
      streamingMessageId.value = null
      console.log(`【诊断】WorkflowExecutionPanel - 非流式消息，立即解除处理状态。`)
      nextTick(() => {
        processNextMessage()
      })
    }
  } else if (messageQueue.value.length === 0 && !streamingMessageId.value && !isAppending.value) {
    // 如果队列为空且没有流式消息正在进行，且没有追加操作，则表示所有消息都已处理
    isProcessingMessage.value = false
    console.log(
      '【诊断】WorkflowExecutionPanel - 消息队列为空，且无流式消息/追加操作，isProcessingMessage=false'
    )
  } else {
    console.log(
      `【诊断】WorkflowExecutionPanel - 无法处理下一条消息: 队列长度=${messageQueue.value.length}, isProcessingMessage=${isProcessingMessage.value}, streamingMessageId=${streamingMessageId.value}, isAppending=${isAppending.value}`
    )
  }
}

const handleTabClick = (tab) => {
  if (tab.paneName !== 'all') {
    // 切换到非 'all' 标签页时，清空 displayedMessages，确保瞬间显示
    displayedMessages.value = []
    messageQueue.value = [] // 清空队列
    isProcessingMessage.value = false
    streamingMessageId.value = null
  } else {
    // 切换回 'all' 标签页时，重新初始化队列并开始处理
    displayedMessages.value = [] // 清空已显示的
    messageQueue.value = [...props.messages] // 将所有消息加入队列
    isProcessingMessage.value = false // 重置状态，准备开始处理
    streamingMessageId.value = null

    processNextMessage() // 开始处理第一条消息
  }
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

const handleMessageDisplayed = (messageId) => {
  console.log(`【诊断】WorkflowExecutionPanel - 消息显示完成，消息ID: ${messageId}`)

  if (isAppending.value) {
    isAppending.value = false
    console.log('【诊断】WorkflowExecutionPanel - 追加内容打印完成，恢复队列处理。')
    processNextMessage() // 恢复处理队列
  } else if (streamingMessageId.value === messageId) {
    // 只有当完成的消息是当前正在流式传输的消息时，才解除处理状态
    isProcessingMessage.value = false
    streamingMessageId.value = null
    console.log(`【诊断】WorkflowExecutionPanel - 流式消息 ${messageId} 完成，解除处理状态。`)
    nextTick(() => {
      processNextMessage() // 尝试处理队列中的下一条消息
    })
  }
  emit('message-displayed') // 通知父组件消息已显示
}

watch(
  () => props.messages,
  (newMessages, oldMessages) => {
    if (activeTab.value === 'all') {
      const newMessagesToAdd = []
      newMessages.forEach((newMessage) => {
        const existingDisplayedMessageIndex = displayedMessages.value.findIndex(
          (dMsg) => dMsg.id === newMessage.id
        )
        const existingQueueMessageIndex = messageQueue.value.findIndex(
          (qMsg) => qMsg.id === newMessage.id
        )

        if (existingDisplayedMessageIndex !== -1) {
          // 消息已在 displayedMessages 中，更新其内容和状态
          const displayedMsg = displayedMessages.value[existingDisplayedMessageIndex]
          if (displayedMsg.content !== newMessage.content) {
            // 内容有更新，可能是追加内容
            displayedMsg.content = newMessage.content
            displayedMsg.isStreaming = newMessage.isStreaming
            displayedMsg.showViewResultButton = newMessage.showViewResultButton
            if (displayedMsg.id === streamingMessageId.value) {
              // 如果是当前正在流式传输的消息，并且内容更新，则标记为正在追加
              isAppending.value = true
              console.log(
                `【诊断】WorkflowExecutionPanel - 消息 ${newMessage.id} 内容更新，标记为追加中。`
              )
            }
          } else {
            // 内容未更新，但状态可能更新
            displayedMsg.isStreaming = newMessage.isStreaming
            displayedMsg.showViewResultButton = newMessage.showViewResultButton
          }
          // 如果更新的消息不再是流式传输，且是当前流式消息，则清除 streamingMessageId
          if (!newMessage.isStreaming && streamingMessageId.value === newMessage.id) {
            streamingMessageId.value = null
            isProcessingMessage.value = false // 流式消息完成，解除处理状态
            console.log(
              `【诊断】WorkflowExecutionPanel - 流式消息 ${newMessage.id} 完成，解除处理状态。`
            )
            nextTick(() => processNextMessage()) // 尝试处理下一条
          }
        } else if (existingQueueMessageIndex !== -1) {
          // 消息已在 messageQueue 中，更新其内容和状态
          const queueMsg = messageQueue.value[existingQueueMessageIndex]
          queueMsg.content = newMessage.content
          queueMsg.isStreaming = newMessage.isStreaming
          queueMsg.showViewResultButton = newMessage.showViewResultButton
        } else {
          // 全新消息，添加到待处理队列
          newMessagesToAdd.push(newMessage)
          console.log(`【诊断】WorkflowExecutionPanel - 新消息 ${newMessage.id} 加入队列。`)
        }
      })

      // 将新消息添加到队列
      if (newMessagesToAdd.length > 0) {
        messageQueue.value.push(...newMessagesToAdd)
      }

      // 如果 props.messages 变为空，清空所有状态
      if (newMessages.length === 0) {
        displayedMessages.value = []
        messageQueue.value = []
        isProcessingMessage.value = false
        streamingMessageId.value = null
        isAppending.value = false
        console.log('【诊断】WorkflowExecutionPanel - props.messages 为空，清空所有状态。')
      }

      // 仅当没有消息正在处理且没有追加操作时，尝试处理队列中的下一条消息
      if (!isProcessingMessage.value && !isAppending.value) {
        processNextMessage()
      }

      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      })
    } else {
      // 在非 'all' 标签页时，确保滚动到底部
      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      })
    }
  },
  { deep: true, immediate: true }
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
  // 初始加载时，如果处于 'all' 标签页，则将所有消息添加到队列并开始处理
  if (activeTab.value === 'all' && props.messages.length > 0) {
    // 确保只添加新消息到队列，避免重复
    props.messages.forEach((msg) => {
      const existingDisplayed = displayedMessages.value.some((dMsg) => dMsg.id === msg.id)
      const existingQueue = messageQueue.value.some((qMsg) => qMsg.id === msg.id)
      if (!existingDisplayed && !existingQueue) {
        messageQueue.value.push(msg)
      }
    })
    processNextMessage()
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  }
})

// 新增方法：追加消息内容
const appendMessageContent = (messageId, newContent) => {
  const messageIndex = displayedMessages.value.findIndex((m) => m.id === messageId)
  if (messageIndex !== -1) {
    const message = displayedMessages.value[messageIndex]
    // 只有当新内容与旧内容不同时才更新
    if (message.content !== newContent) {
      message.content = newContent
      message.isStreaming = true // 标记为流式，以便 StreamingMessage 继续打印
      isAppending.value = true // 标记正在追加
      streamingMessageId.value = messageId // 确保 StreamingMessage 知道是哪条消息在追加
      isProcessingMessage.value = true // 标记为正在处理，暂停队列
      console.log(`【诊断】WorkflowExecutionPanel - 追加消息 ${messageId} 内容，暂停队列。`)
    }
  }
}

// 暴露给父组件的方法，如果需要的话
defineExpose({
  appendMessageContent
})

const handleViewResultDetail = (message) => {
  console.log('【诊断】WorkflowExecutionPanel - 处理查看详情，完整消息对象:', message)
  // 根据消息的 workflow.name 决定触发哪个事件
  if (message.workflow && message.workflow.name === '合同解析') {
    // 对于合同解析，触发 view-result-detail 事件，并传递 message.task (即 taskId)
    // 确保 message.task 存在且有效
    if (message.task) {
      emit('view-result-detail', message.task)
    } else {
      console.warn('【警告】WorkflowExecutionPanel - 合同解析消息中缺少 task ID:', message)
      ElMessage.warning('无法获取合同解析任务ID，请检查消息内容。')
    }
  } else if (message.workflow && message.workflow.name === '乙供物资解析') {
    // 对于乙供物资解析，触发 view-material-result-detail 事件，并传递 message.task (即 taskId)
    console.log(
      '【诊断】WorkflowExecutionPanel - 触发乙供物资解析详情事件，传递 taskId:',
      message.task
    )
    emit('view-material-result-detail', message.task)
  } else {
    // 对于其他未知类型的解析结果，可以触发一个默认的 view-result-detail 事件，不带参数或带通用参数
    // 这里为了兼容性，仍然触发 view-result-detail，但不传递 task，让 HomeView 决定如何处理
    console.log('【诊断】WorkflowExecutionPanel - 触发通用查看详情事件，消息:', message)
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
  font-size: large;
}

.message-tabs {
  padding: 0 20px;
  flex-shrink: 0;
  font-size: large;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.execution-panel-card {
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
  font-size: 22px;
  font-weight: 800;
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
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(80vh - 40px);
  /* 响应式居中布局逻辑 */
  --max-width-layout-container-width: 100vw;
  --max-width-layout-large-padding: 24px;
  --max-width-layout-small-padding: 16px;
  --center-content-max-width: 800px; /* ✅ 你可以根据内容宽度设定这个值 */

  --left-side-width: 0px;
  --right-side-width: 0px;

  --width: calc(var(--max-width-layout-container-width) - var(--left-side-width) - var(--right-side-width));
  --center-content: min(var(--width), var(--center-content-max-width));
  --total-side: calc(var(--max-width-layout-container-width) - var(--center-content) - var(--left-side-width) - var(--right-side-width));
  --left-side: calc(var(--total-side) / 2);
  --content-left: calc(var(--left-side) + var(--left-side-width));

  --padding: clamp(
    var(--max-width-layout-small-padding),
    calc(50vw - 400px - var(--left-side-width) / 2 - var(--right-side-width) / 2),
    var(--max-width-layout-large-padding)
  );

  padding-left: calc(var(--content-left) + var(--padding));
  padding-right: calc(var(--left-side) + var(--padding) + var(--right-side-width) - var(--scrollbar-width, 0px));

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

.message-item {
  display: flex;
  /* 移除 width: 100%; 让子元素控制宽度 */
}

.message-from-user {
  align-self: flex-end; /* 确保用户消息靠右对齐 */
  max-width: 85%; /* 用户消息限制宽度 */
}

.message-from-agent,
.message-from-system {
  align-self: flex-start; /* 确保智能体/系统消息靠左对齐 */
  max-width: 100%; /* 智能体和系统消息占满宽度 */
  width: 100%; /* 确保占满宽度 */
}

.message-bubble {
  line-height: 1.5;
  /* 移除通用背景、圆角和宽度，由特定来源的消息定义 */
}

.message-sender {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.workflow-info-tag {
  font-style: italic;
  font-size: 18px;
  color: #9ca3af;
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
:deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.message-from-user .message-bubble {
  background: #3b82f6;
  color: white;
  padding: 12px 16px; /* 用户消息的气泡内边距 */
  border-radius: 18px; /* 用户消息的气泡圆角 */
  width: fit-content; /* 用户消息的气泡宽度自适应 */
}

/* Agent/System messages */
.message-from-agent,
.message-from-system {
  align-self: flex-start;
  /* 智能体和系统消息直接展示，不作为气泡 */
  /* 移除 message-bubble 的背景和圆角，直接在 message-item 层面控制 */
}

.message-from-agent .message-bubble,
.message-from-system .message-bubble {
  background: transparent; /* 透明背景 */
  color: #1f2937; /* 文本颜色 */
  padding: 0; /* 移除气泡内边距 */
  border-radius: 0; /* 移除圆角 */
  box-shadow: none; /* 移除阴影 */
  width: 100%; /* 占据可用宽度 */
}
</style>
