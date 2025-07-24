<template>
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
          :is-streaming="!!message.isStreaming"
          :skip-animation="skipAnimation"
          @animation-end="$emit('animation-end')"
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
      
      <div
        class="message-actions"
        v-if="message.showViewResultButton || (message.buttons && message.buttons.length)"
      >
        <el-button
          v-if="message.showViewResultButton"
          type="primary"
          size="small"
          @click="$emit('view-result-detail', message)"
        >
          查看解析结果
        </el-button>
        <el-button
          v-for="(btn, index) in message.buttons"
          :key="index"
          type="primary"
          size="small"
          @click="$emit('custom-button-click', { message, button: btn })"
        >
          {{ btn.text }}
        </el-button>
      </div>
      
      <div class="message-timestamp">{{ message.timestamp }}</div>
    </div>
  </div>
</template>

<script setup>
import StreamingMessage from './StreamingMessage.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  skipAnimation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'animation-end',
  'view-result-detail',
  'custom-button-click'
])
</script>

<style scoped>
.message-item {
  display: flex;
}

.message-from-user {
  align-self: flex-end;
  max-width: 85%;
}

.message-from-agent,
.message-from-system {
  align-self: flex-start;
  max-width: 100%;
  width: 100%;
}

.message-bubble {
  line-height: 1.5;
  align-self: flex-end;
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

.message-from-user .message-bubble {
  background: #3b82f6;
  color: white;
  padding: 12px 16px;
  border-radius: 18px;
  width: fit-content;
}

/* Agent/System messages */
.message-from-agent,
.message-from-system {
  align-self: flex-start;
}

.message-from-agent .message-bubble,
.message-from-system .message-bubble {
  background: transparent;
  color: #1f2937;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
}
</style>