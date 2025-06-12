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

    <div ref="messageContainer" class="message-container">
      <div v-if="!messages.length" class="no-messages">
        <el-empty description="从侧边栏选择一个能力或直接开始对话" />
      </div>

      <template v-for="message in messages" :key="message.id">
        <div :class="['message-item', `message-from-${message.from}`]">
          <div class="message-bubble">
            <div class="message-sender" v-if="message.from !== 'user'">
              <strong>{{ message.sender }}</strong>
              <span v-if="message.workflow" class="workflow-info-tag">
                (智能体功能: {{ message.workflow.name }})
              </span>
            </div>
            <div class="message-content">
              <StreamingMessage :text="message.content" @done="$emit('message-displayed')" />
            </div>
            <div class="message-actions" v-if="message.showViewResultButton">
              <el-button type="primary" size="small" @click="$emit('view-result-detail')">
                查看解析结果
              </el-button>
            </div>
            <div class="message-timestamp">{{ message.timestamp }}</div>
          </div>
        </div>
      </template>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
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

defineEmits(['view-result-detail', 'message-displayed'])

const messageContainer = ref(null)

watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
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
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 60vh; /* Adjust as needed */
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
