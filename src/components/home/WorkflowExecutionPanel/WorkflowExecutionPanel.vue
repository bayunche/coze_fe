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
      <MessageTabs v-model="activeTab" @tab-click="onTabClick" @clear-messages="onClearMessages" />

      <MessageList
        ref="messageListRef"
        :messages="messages"
        :active-tab="activeTab"
        @view-result-detail="viewResultDetail"
        @custom-button-click="onCustomButtonClick"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  isContractWorkflow,
  isSupplierMaterialWorkflow,
  isOwnerMaterialWorkflow
} from '@/constants/workflowNames'
import MessageTabs from '@/components/home/MessageTabs'
import MessageList from '@/components/home/MessageList'

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
const onTabClick = () => {
  messageListRef.value?.scrollToBottom()
}

/**
 * 处理清空消息
 */
const onClearMessages = () => {
  activeTab.value = 'all'
}

/**
 * 处理查看结果详情
 */
const viewResultDetail = (message) => {
  if (!message.task) {
    ElMessage.warning('无法获取任务ID，请检查消息内容。')
    return
  }

  const workflowName = message.workflow?.name

  // 甲供物资重新解析工作流，直接跳转到甲供物资详情页面
  if (workflowName === '甲供物资重新解析') {
    router.push({
      name: 'owner-material-detail',
      params: { taskId: message.task }
    })
  } else if (isContractWorkflow(workflowName)) {
    // 传递完整的消息对象，而不是只传递任务ID
    emit('view-result-detail', message)
  } else if (isSupplierMaterialWorkflow(workflowName)) {
    // 乙供物资工作流 -> 发射乙供物资结果详情事件
    emit('view-supplier-material-result-detail', message.task)
  } else if (isOwnerMaterialWorkflow(workflowName)) {
    // 甲供物资工作流 -> 发射甲供物资结果详情事件
    emit('view-material-result-detail', message.task)
  }
}

/**
 * 处理自定义按钮点击
 */
const onCustomButtonClick = ({ message, button }) => {
  if (button.action === 'confirm-material-alignment' && button.data?.taskId) {
    router.push({
      name: 'owner-material-align',
      params: { taskId: button.data.taskId }
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
  border: 1px solid var(--theme-border-primary);
  box-shadow: var(--theme-shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--theme-bg-card);
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
  color: var(--theme-text-primary);
}

.workflow-tag {
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
  border: none;
  color: var(--theme-text-inverse);
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
