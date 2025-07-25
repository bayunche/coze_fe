<template>
  <MainLayout>
    <template #content>
      <WorkflowExecutionPanel
        :current-workflow="currentWorkflow"
        :messages="displayedMessages"
        @view-result-detail="handleViewResultDetail"
        @view-material-result-detail="handleViewMaterialResultDetail"
        @view-supplier-material-result-detail="handleViewSupplierMaterialResultDetail"
      />
    </template>
  </MainLayout>

  <!-- 对话框管理器 -->
  <DialogManager />

  <!-- 任务状态监听器 -->
  <TaskStatusWatcher />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { useWorkflowStore } from '@/stores/workflow'
import { useMaterialDialogStore } from '@/stores/materialDialog'
import { useEventHandlers } from '@/composables/useEventHandlers'

// 导入子组件
import MainLayout from '@/components/home/MainLayout.vue'
import WorkflowExecutionPanel from '@/components/home/WorkflowExecutionPanel.vue'
import DialogManager from '@/components/home/DialogManager.vue'
import TaskStatusWatcher from '@/components/home/TaskStatusWatcher.vue'

// Pinia Stores
const chatStore = useChatStore()
const workflowStore = useWorkflowStore()
const materialDialogStore = useMaterialDialogStore()

// 事件处理器
const {
  handleViewResultDetail,
  handleViewMaterialResultDetail,
  handleViewSupplierMaterialResultDetail,
} = useEventHandlers()

// 从 Store 中解构状态
const { displayedMessages } = storeToRefs(chatStore)
const { currentWorkflow } = storeToRefs(workflowStore)
const { showOwnerMaterialTaskParsingDetailDialog } = storeToRefs(materialDialogStore)

// 用于清理的变量
let timeInterval = null

// 监听对话框状态变化（用于调试）
watch(showOwnerMaterialTaskParsingDetailDialog, (newValue) => {
  console.log('【诊断】HomeViewRefactored - showOwnerMaterialTaskParsingDetailDialog 变化:', newValue)
})

// 生命周期钩子
onMounted(() => {
  // 初始化逻辑已移至 TaskStatusWatcher 组件
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
/* 样式已移至各个子组件中 */
</style>