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
const isDisplaying = ref(false)
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
  if (props.messages.length > displayedMessages.value.length) {
    isDisplaying.value = true
    const nextMessage = props.messages[displayedMessages.value.length]
    displayedMessages.value.push(nextMessage)
  } else {
    isDisplaying.value = false
  }
}

const handleMessageDisplayed = (index) => {
  if (index === displayedMessages.value.length - 1) {
    displayNextMessage()
  }
  // 通知父组件消息已显示，以便继续处理队列
  emit('message-displayed')
}

watch(
  () => props.messages.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && !isDisplaying.value) {
      displayNextMessage()
    } else if (newLength === 0) {
      displayedMessages.value = []
      isDisplaying.value = false
    }
  }
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
  // 假设 message 对象中包含 workflow 信息，并且 workflow.name 可以区分合同解析和乙供物资解析
  if (message.workflow && message.workflow.name === '乙供物资解析') {
    emit('view-material-result-detail', message.task) // 发送事件，传递任务数据
  } else if (message.workflow && message.workflow.name === '合同解析') {
    emit('view-result-detail', message.task) // 兼容原有的合同解析逻辑
  } else {
    emit('view-result-detail') // 其他类型的解析结果
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
