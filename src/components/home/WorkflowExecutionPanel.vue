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
      <div class="tabs-and-clear-button">
        <el-tabs v-model="activeTab" class="message-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="所有消息" name="all"></el-tab-pane>
          <el-tab-pane label="合同解析" name="contract"></el-tab-pane>
          <el-tab-pane label="乙供物资解析" name="material"></el-tab-pane>
          <el-tab-pane label="甲供物资解析" name="j_material"></el-tab-pane>
          <el-tab-pane label="对话流" name="dialogue"></el-tab-pane>
        </el-tabs>
        <el-button
          type="info"
          :icon="Delete"
          circle
          plain
          class="clear-messages-button"
          @click="handleClearMessages"
          title="清空所有消息"
        />
      </div>

      <div ref="messageContainer" class="message-container">
        <div v-if="!messagesToRender.length" class="no-messages">
          <el-empty description="当前分类下没有消息" />
        </div>
        <transition-group name="message-fade" tag="div">
          <div
            v-for="message in messagesToRender"
            :key="message.id"
            :class="['message-item', `message-from-${message.from}`]"
          >
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
                  :skip-animation="activeTab !== 'all' && !message.isStreaming"
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
                  @click="handleViewResultDetail(message)"
                >
                  查看解析结果
                </el-button>
                <el-button
                  v-for="(btn, index) in message.buttons"
                  :key="index"
                  type="primary"
                  size="small"
                  @click="handleCustomButtonClick(message, btn)"
                >
                  {{ btn.text }}
                </el-button>
              </div>
              <div class="message-timestamp">{{ message.timestamp }}</div>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import StreamingMessage from './StreamingMessage.vue'
import { useChatStore } from '@/stores/chat'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

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

const emit = defineEmits([
  'view-result-detail',
  'view-material-result-detail',
  'view-supplier-material-result-detail'
])

const messageContainer = ref(null)
const activeTab = ref('all')

const enhanceMessage = (msg) => {
  const isParsingWorkflow =
    msg.workflow && ['乙供物资解析', '甲供物资解析', '合同解析'].includes(msg.workflow.name)
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

const messagesToRender = computed(() => {
  let filtered = props.messages
  if (activeTab.value === 'contract') {
    filtered = props.messages.filter((m) => m.workflow?.name === '合同解析')
  } else if (activeTab.value === 'material') {
    filtered = props.messages.filter((m) => m.workflow?.name === '乙供物资解析')
  } else if (activeTab.value === 'j_material') {
    filtered = props.messages.filter((m) => m.workflow?.name === '甲供物资解析')
  } else if (activeTab.value === 'dialogue') {
    filtered = props.messages.filter((m) => m.from === 'user' || !m.workflow)
  }
  return filtered.map(enhanceMessage)
})

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

const handleTabClick = () => {
  scrollToBottom()
}

const handleViewResultDetail = (message) => {
  if (!message.task) {
    ElMessage.warning('无法获取任务ID，请检查消息内容。')
    return
  }
  if (message.workflow?.name === '合同解析') {
    emit('view-result-detail', message.task)
  } else if (message.workflow?.name === '乙供物资解析') {
    emit('view-material-result-detail', message.task)
  } else if (message.workflow?.name === '甲供物资解析') {
    emit('view-supplier-material-result-detail', message.task)
  }
}

const router = useRouter()
const chatStore = useChatStore()

const handleCustomButtonClick = (message, button) => {
  if (button.action === 'confirm-material-alignment' && button.data?.taskId) {
    router.push({
      name: 'OwnerMaterialAlign',
      query: { taskId: button.data.taskId }
    })
  } else {
    emit('custom-button-click', {
      messageId: message.id,
      action: button.action,
      data: button.data || null
    })
  }
}

const handleClearMessages = () => {
  ElMessageBox.confirm('确定要清空所有消息吗？此操作不可逆。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      chatStore.resetAndInitMessages()
      activeTab.value = 'all'
      ElMessage.success('消息已清空。')
    })
    .catch(() => {
      ElMessage.info('已取消清空操作。')
    })
}
</script>

<style scoped>
/* --- Transition Animation --- */
.message-fade-enter-active,
.message-fade-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}
.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.card-body-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

.tabs-and-clear-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;
}

.message-tabs {
  flex-grow: 1; /* 让 tabs 占据更多空间 */
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none; /* 移除默认的底部边框 */
}

.clear-messages-button {
  margin-left: 10px; /* 与 tabs 保持一定距离 */
  flex-shrink: 0; /* 防止按钮被压缩 */
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
  padding: 20px 40px; /* 调整上下左右内边距 */
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(80vh - 4rem);
  /* 响应式居中布局逻辑 */
  --max-width-layout-container-width: 100vw;
  --max-width-layout-large-padding: 24px;
  --max-width-layout-small-padding: 16px;
  --center-content-max-width: 1200px; /* 增加宽度 */

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
    /* 调整此值 */ var(--max-width-layout-large-padding)
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
