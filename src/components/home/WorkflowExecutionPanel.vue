<template>
  <el-card class="execution-control-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="header-info">
          <span class="card-title">智能体</span>
          <el-tag v-if="currentWorkflow" type="primary" size="small" class="workflow-tag">
            {{ currentWorkflow.name }}
          </el-tag>
        </div>
        <div class="execution-controls" />
      </div>
    </template>

    <div class="workflow-status">
      <div v-if="!currentWorkflow && !lastExecutionResult" class="no-workflow">
        <el-empty description="从侧边栏选择一个智能体能力开始" />
      </div>

      <div v-if="lastExecutionResult" class="execution-result">
        <div class="result-header">
        
          <div class="result-meta">
            <span class="execution-time"
              >执行时间:
              {{
                lastExecutionResult.status === 'running'
                  ? workflowElapsedTime
                  : lastExecutionResult.duration
              }}</span
            >
            <el-tag
              :type="
                lastExecutionResult.status === 'success'
                  ? 'success'
                  : lastExecutionResult.status === 'running'
                  ? 'warning'
                  : 'danger'
              "
              size="small"
            >
              <el-icon v-if="lastExecutionResult.status === 'running'" class="rotating"
                ><Loading
              /></el-icon>
              {{
                lastExecutionResult.status === 'success'
                  ? '执行成功'
                  : lastExecutionResult.status === 'running'
                  ? '执行中'
                  : '执行失败'
              }}
            </el-tag>
          </div>
          <div
            v-if="lastExecutionResult && lastExecutionResult.status === 'success'"
            class="result-actions"
          >
            <el-button type="primary" @click="$emit('view-result-detail')">
              查看解析结果
            </el-button>
          </div>
        </div>

        <div ref="chatContainer" class="chat-container">
          <template v-for="log in displayedLogs" :key="log.id">
            <div v-if="log.type === 'separator'" class="chat-separator">
              <span>{{ log.message }}</span>
            </div>
            <div v-else :class="['chat-message', `message-${log.type}`]">
              <div class="chat-bubble">
                <div class="message-content">
                  <StreamingMessage :text="log.message" @done="handleTypingDone" />
                </div>
                <div v-if="log.details" class="message-details">
                  <pre>{{ formatLogDetails(log.details) }}</pre>
                </div>
                <div class="message-time">{{ log.timestamp }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'
import StreamingMessage from './StreamingMessage.vue'
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  currentWorkflow: Object,
  lastExecutionResult: Object,
  isExecuting: Boolean,
  workflowElapsedTime: [Number, String],
  currentStepIndex: Number,
  stepProgress: Number,
  getStepStatus: Function,
  getLogsForLastExecution: Function,
  getLogTagType: Function,
  getLogTypeText: Function,
  formatLogDetails: Function
})

defineEmits(['show-workflow-config', 'view-result-detail'])

const displayedLogs = ref([])
const logQueue = ref([])
const isTyping = ref(false)

const chatContainer = ref(null)

watch(
  () => props.getLogsForLastExecution(),
  (newLogs, oldLogs) => {
    const oldLength = oldLogs ? oldLogs.length : 0
    const newEntries = newLogs.slice(oldLength)
    logQueue.value.push(...newEntries)
    if (!isTyping.value) {
      processLogQueue()
    }
  },
  { deep: true }
)

watch(displayedLogs, () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}, { deep: true })

const processLogQueue = () => {
  if (logQueue.value.length > 0 && !isTyping.value) {
    isTyping.value = true
    const nextLog = logQueue.value.shift()
    displayedLogs.value.push(nextLog)
  }
}

const handleTypingDone = () => {
  isTyping.value = false
  processLogQueue()
}

onUnmounted(() => {
  logQueue.value = []
})
</script>

<style scoped>
.execution-control-card {
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  overflow: hidden;
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
.execution-controls {
  display: flex;
  gap: 8px;
}
.workflow-status {
  min-height: 400px;
}
.no-workflow {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.executing-workflow {
  padding: 20px 0;
}
.workflow-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.workflow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.workflow-header h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}
.execution-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}
.execution-time {
  font-family: 'SF Mono', Monaco, monospace;
  color: #6b7280;
  font-size: 14px;
}
.workflow-steps {
  padding: 20px 0;
}
.current-step-detail {
  padding: 20px;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.05), rgba(59, 130, 246, 0.05));
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.1);
}
.step-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}
.step-name {
  font-weight: 600;
  color: #1f2937;
}
.step-description {
  color: #6b7280;
  font-size: 14px;
}
.execution-result {
  padding: 20px 0;
}
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.result-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.result-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}
.result-content {
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.result-actions {
  padding: 16px 20px;
 
  background: #fff;
  display: flex;
  justify-content: flex-end;
}
.chat-container {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chat-separator {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  padding: 8px 0;
}
.chat-message {
  display: flex;
  max-width: 80%;
}
.chat-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.5;
}
.message-content {
  white-space: pre-wrap;
  word-break: break-word;
}
.message-details {
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
}
.message-time {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 6px;
  text-align: right;
}
/* System/User messages (info, warning, error) */
.message-info,
.message-warning,
.message-error {
  align-self: flex-end;
}
.message-info .chat-bubble,
.message-warning .chat-bubble,
.message-error .chat-bubble {
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}
.message-error .chat-bubble {
  background: #ef4444;
}
.message-warning .chat-bubble {
  background: #f59e0b;
}
/* Agent messages (success) */
.message-success {
  align-self: flex-start;
}
.message-success .chat-bubble {
  background: #e5e7eb;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}
.rotating {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
