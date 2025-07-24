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
      <MessageTabs 
        v-model="activeTab"
        @tab-click="handleTabClick"
        @clear-messages="handleClearMessages"
      />

      <MessageList
        ref="messageListRef"
        :messages="messages"
        :active-tab="activeTab"
        @view-result-detail="handleViewResultDetail"
        @custom-button-click="handleCustomButtonClick"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { isContractWorkflow, isSupplierMaterialWorkflow, isOwnerMaterialWorkflow } from '@/constants/workflowNames'
import MessageTabs from './MessageTabs.vue'
import MessageList from './MessageList.vue'

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

// 本地状态
const activeTab = ref('all')
const messageListRef = ref(null)

// 路由
const router = useRouter()

/**
 * 处理标签页点击
 */
const handleTabClick = () => {
  messageListRef.value?.scrollToBottom()
}

/**
 * 处理清空消息
 */
const handleClearMessages = () => {
  activeTab.value = 'all'
}

/**
 * 处理查看结果详情
 */
const handleViewResultDetail = (message) => {
  if (!message.task) {
    ElMessage.warning('无法获取任务ID，请检查消息内容。')
    return
  }
  
  const workflowName = message.workflow?.name
  
  if (isContractWorkflow(workflowName)) {
    emit('view-result-detail', message.task)
  } else if (isSupplierMaterialWorkflow(workflowName)) {
    emit('view-material-result-detail', message.task)
  } else if (isOwnerMaterialWorkflow(workflowName)) {
    emit('view-supplier-material-result-detail', message.task)
  }
}

/**
 * 处理自定义按钮点击
 */
const handleCustomButtonClick = ({ message, button }) => {
  if (button.action === 'confirm-material-alignment' && button.data?.taskId) {
    router.push({
      name: 'owner-material-align',
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
</script>

<style scoped>
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

.card-body-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

:deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}
</style>