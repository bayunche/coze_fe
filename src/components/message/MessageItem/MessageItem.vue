<template>
  <div :class="['message-item', messageItemClass]">
    <div class="message-bubble">
      <!-- 发送者信息 -->
      <div v-if="shouldShowSenderInfo" class="message-sender">
        <strong style="font-size: 18px">{{ message.sender }}</strong>
        <span v-if="message.workflow" class="workflow-info-tag">
          {{ workflowInfo }}
        </span>
      </div>

      <!-- 消息内容 -->
      <div class="message-content">
        <StreamingMessage
          :text="message.content"
          :is-streaming="!!message.isStreaming"
          :skip-animation="skipAnimation"
          @animation-end="emitAnimationEnd"
        />
        <!-- 加载进度条 -->
        <div v-if="isLoadingType" class="loading-progress-container">
          <el-progress
            :percentage="message.progress"
            :stroke-width="UI_CONFIG.PROGRESS_STROKE_WIDTH"
            striped
            striped-flow
            :duration="UI_CONFIG.PROGRESS_DURATION"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="shouldShowActionButtons" class="message-actions">
        <el-button
          v-if="message.showViewResultButton"
          type="primary"
          size="small"
          @click="viewResultDetail"
        >
          查看解析结果
        </el-button>
        <el-button
          v-for="(btn, index) in message.buttons"
          :key="index"
          type="primary"
          size="small"
          @click="clickCustomButton(btn)"
        >
          {{ btn.text }}
        </el-button>
      </div>

      <!-- 时间戳 -->
      <div class="message-timestamp">{{ message.timestamp }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StreamingMessage from '@/components/home/StreamingMessage'
import { EMIT_EVENTS, UI_CONFIG } from './constants.js'
import {
  isUserMessage,
  isLoadingMessage,
  shouldShowSender,
  shouldShowActions,
  getMessageItemClass,
  formatWorkflowInfo
} from './utils.js'

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
  EMIT_EVENTS.ANIMATION_END,
  EMIT_EVENTS.VIEW_RESULT_DETAIL,
  EMIT_EVENTS.CUSTOM_BUTTON_CLICK
])

// 计算属性
const messageItemClass = computed(() => getMessageItemClass(props.message.from))
const shouldShowSenderInfo = computed(() => shouldShowSender(props.message.from))
const shouldShowActionButtons = computed(() => shouldShowActions(props.message))
const isLoadingType = computed(() => isLoadingMessage(props.message.type))
const workflowInfo = computed(() => formatWorkflowInfo(props.message.workflow))

// 事件处理方法
const emitAnimationEnd = () => {
  emit(EMIT_EVENTS.ANIMATION_END)
}

const viewResultDetail = () => {
  emit(EMIT_EVENTS.VIEW_RESULT_DETAIL, props.message)
}

const clickCustomButton = (button) => {
  emit(EMIT_EVENTS.CUSTOM_BUTTON_CLICK, {
    message: props.message,
    button
  })
}
</script>

<style scoped>
.message-item {
  display: flex;
}

.message-from-user {
  align-self: flex-end;
  max-width: v-bind('UI_CONFIG.MESSAGE_MAX_WIDTH_USER');
}

.message-from-agent,
.message-from-system {
  align-self: flex-start;
  max-width: v-bind('UI_CONFIG.MESSAGE_MAX_WIDTH_AGENT');
  width: 100%;
}

.message-bubble {
  line-height: 1.5;
  align-self: flex-end;
}

.message-sender {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.workflow-info-tag {
  font-style: italic;
  font-size: 18px;
  color: var(--theme-text-tertiary);
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
  color: var(--theme-text-tertiary);
  margin-top: 6px;
  text-align: right;
}

/* User messages */
.message-from-user {
  align-self: flex-end;
}

.message-from-user .message-bubble {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
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
  color: var(--theme-text-primary);
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
}
</style>
