<template>
  <div class="agent-dashboard">
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside :width="isSidebarOpen ? '280px' : '0px'" class="sidebar-aside">
        <SidebarNav
          :functions="functions"
          :active-function="activeFunction"
          @select="(key) => handleFunctionSelect(key, addMessage)"
        />
      </el-aside>
      <el-container class="right-panel">
        <div class="chat-container">
          <div class="messages-wrapper">
            <WorkflowExecutionPanel
              :current-workflow="currentWorkflow"
              :messages="displayedMessages"
              @show-workflow-config="showWorkflowConfig = true"
              @view-result-detail="handleViewResultDetail"
              @view-material-result-detail="handleViewMaterialResultDetail"
              @view-supplier-material-result-detail="handleViewSupplierMaterialResultDetail"
            />
          </div>
          <div class="input-area-wrapper">
            <ChatInputArea />
          </div>
        </div>
      </el-container>
    </el-container>

    <!-- 新增物资解析结果详情弹窗组件 -->
    <MaterialParsingResultDialog
      v-model="showMaterialParsingResultDialog"
      :task="materialParsingResultTask"
    />

    <!-- 乙供物资任务解析详情弹窗组件 -->
    <OwnerMaterialTaskParsingDetailDialog
      v-model="showOwnerMaterialTaskParsingDetailDialog"
      :taskId="ownerMaterialTaskParsingDetailTaskId"
      @view-detail="handleViewOwnerMaterialDetail"
      style="z-index: 2000"
    />

    <!-- 甲供物资任务解析详情弹窗组件 -->
    <SupplierMaterialTaskParsingDetailDialog
      v-model="showSupplierMaterialTaskParsingDetailDialog"
      :taskId="supplierMaterialTaskParsingDetailTaskId"
      @view-detail="handleViewSupplierMaterialDetail"
      style="z-index: 2000"
    />

    <!-- 任务配置对话框 -->
    <WorkflowConfigDialog
      v-model:show="showWorkflowConfig"
      :current-function-name="getCurrentFunctionName()"
      :config="workflowConfig"
      :needs-file-upload="needsFileUpload()"
      :allowed-file-types="getAllowedFileTypes()"
      :current-function-params="getCurrentFunctionParams()"
      @close="onConfigDialogClose"
      @start-workflow="startWorkflowFromDialog(addMessage)"
    />

    <!-- 智能大脑弹窗 -->
    <SmartBrainDialog
      v-model:show="showSmartBrainDialog"
      :agents="smartAgents"
      :tasks-by-agent="taskListsByAgent"
    />

    <!-- 结果详情对话框 -->
    <ResultDetailTableDialog />

    <!-- 编辑长文本的对话框 -->
    <LongTextEditPopup />

    <!-- 侧边栏展开按钮 -->
    <el-button
      class="toggle-sidebar-button"
      type="primary"
      :icon="isSidebarOpen ? ArrowLeft : ArrowRight"
      circle
      @click="toggleSidebar"
      :style="{ left: isSidebarOpen ? '290px' : '20px' }"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, defineAsyncComponent, watch } from 'vue'
import { storeToRefs } from 'pinia' // 导入 storeToRefs
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue' // 导入图标
import { useRouter } from 'vue-router' // 导入 useRouter
import { useChatStore } from '@/stores/chat'
import { useWorkflowStore } from '@/stores/workflow'
import { useParsingResultStore } from '@/stores/parsingResult'
import { useMaterialDialogStore } from '@/stores/materialDialog'
import { useOwnerMaterialStore } from '@/stores/ownerMaterial' // 导入甲供物资 store
import { functions } from '@/uitls/workflows.js' // functions 仍然从这里导入
// import CozeService from '@/services/CozeService'; // 移除 CozeService 导入

// 导入子组件
import SidebarNav from '@/components/home/SidebarNav.vue'
import WorkflowExecutionPanel from '@/components/home/WorkflowExecutionPanel.vue'

// 异步加载弹窗组件
const WorkflowConfigDialog = defineAsyncComponent(() =>
  import('@/components/home/WorkflowConfigDialog.vue')
)
const SmartBrainDialog = defineAsyncComponent(() =>
  import('@/components/home/SmartBrainDialog.vue')
)
const MaterialParsingResultDialog = defineAsyncComponent(() =>
  import('@/components/home/MaterialParsingResultDialog.vue')
)
const OwnerMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/OwnerMaterialTaskParsingDetailDialog.vue')
)
const SupplierMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/SupplierMaterialTaskParsingDetailDialog.vue')
)

// 新拆分的组件 (暂时不引入，先处理 Pinia Store 的集成)
import ChatInputArea from '@/components/home/ChatInputArea.vue'
import ResultDetailTableDialog from '@/components/home/ResultDetailTableDialog.vue'
import LongTextEditPopup from '@/components/home/LongTextEditPopup.vue'

// Pinia Stores
const chatStore = useChatStore()
const workflowStore = useWorkflowStore()
const parsingResultStore = useParsingResultStore()
const materialDialogStore = useMaterialDialogStore()
const ownerMaterialStore = useOwnerMaterialStore() // 初始化甲供物资 store

// 从 Store 中解构状态和方法

const { displayedMessages } = storeToRefs(chatStore) // 移除 userInput, handleSendMessage
const { addMessage } = chatStore // 只保留 addMessage
// 使用 storeToRefs 解构 workflowStore 中的响应式属性
const {
  isSidebarOpen,
  activeFunction,
  currentWorkflow,
  isExecuting,
  workflowElapsedTime,
  currentStepIndex,
  stepProgress,
  showWorkflowConfig,
  showSmartBrainDialog, // 新增：解构 showSmartBrainDialog
  workflowConfig,
  executionHistory,
  smartAgents,
  taskListsByAgent,
  lastExecutionResult,
  taskId,
  supplierFileDetailIds
} = storeToRefs(workflowStore)

// 直接解构 workflowStore 中的方法
const {
  getCurrentFunctionName,
  getCurrentFunction,
  getCurrentFunctionParams,
  needsFileUpload,
  getAllowedFileTypes,
  handleFunctionSelect,
  startWorkflowFromDialog,
  resetWorkflowConfig,
  clearHistory,
  exportHistory,
  viewExecutionDetail,
  setTaskId,
  setSupplierFileIds
} = workflowStore

const { alignmentTask } = storeToRefs(ownerMaterialStore) // 解构甲供物资任务状态

const { editableRow, editableFieldProp, isLongText, openEditPopup } = parsingResultStore

const {
  supplierMaterialDialogVisible,
  supplierMaterialDialogTask,
  supplierFileId, // 新增解构 supplierFileId
  showMaterialParsingResultDialog,
  materialParsingResultTask,
  showOwnerMaterialTaskParsingDetailDialog,
  ownerMaterialTaskParsingDetailTaskId,
  showSupplierMaterialTaskParsingDetailDialog, // 新增：甲供物资任务详情弹窗显示状态
  supplierMaterialTaskParsingDetailTaskId // 新增：甲供物资任务详情ID
} = storeToRefs(materialDialogStore) // 使用 storeToRefs 解构响应式状态

let timeInterval = null
let loadingInterval = null

// 方法
const handleViewResultDetail = async (taskIdFromMessage) => {
  // 直接调用 parsingResultStore 中的 action，并使用从消息中获取的 taskId
  await parsingResultStore.handleViewResultDetail(taskIdFromMessage)
}

// 修改 handleViewMaterialResultDetail 方法以打开 MaterialParsingResultDialog
const handleViewMaterialResultDetail = (taskId) => {
  if (taskId) {
    materialDialogStore.ownerMaterialTaskParsingDetailTaskId = taskId // 设置任务ID
    materialDialogStore.showOwnerMaterialTaskParsingDetailDialog = true // 打开乙供物资任务详情列表弹窗
  } else {
    ElMessage.warning('没有可供解析的乙供物资任务ID。')
  }
}

// 新增处理 OwnerMaterialTaskParsingDetailDialog 内部的 view-detail 事件
const handleViewOwnerMaterialDetail = (row) => {
  // 这个函数现在由 OwnerMaterialTaskParsingDetailDialog 内部的 router.push 替代
  // 理论上这里不需要做任何事情，或者可以添加一些日志
  console.log(
    '【诊断】HomeView - 接收到 OwnerMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    row
  )
}

// 新增处理甲供物资任务解析详情的方法
const handleViewSupplierMaterialResultDetail = (taskId) => {
  if (taskId) {
    materialDialogStore.supplierMaterialTaskParsingDetailTaskId = taskId // 设置任务ID
    materialDialogStore.showSupplierMaterialTaskParsingDetailDialog = true // 打开甲供物资任务详情列表弹窗
  } else {
    ElMessage.warning('没有可供解析的甲供物资任务ID。')
  }
}

// 新增处理 SupplierMaterialTaskParsingDetailDialog 内部的 view-detail 事件
const handleViewSupplierMaterialDetail = (row) => {
  console.log(
    '【诊断】HomeView - 接收到 SupplierMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    row
  )
}

const onConfigDialogClose = () => {
  // No action needed
}

onMounted(() => {
  resetWorkflowConfig()
})

watch(showOwnerMaterialTaskParsingDetailDialog, (newValue) => {
  console.log('【诊断】HomeView - showOwnerMaterialTaskParsingDetailDialog 变化:', newValue)
})

// 监听甲供物资对平任务状态的变化
watch(
  () => alignmentTask.value.status,
  async (newStatus, oldStatus) => {
    console.log(`【诊断】HomeView - 甲供物资任务状态变化: ${oldStatus} -> ${newStatus}`)
    if (newStatus === 'ready_for_alignment') {
      const taskId = alignmentTask.value.taskId
      if (taskId) {
        console.log(`【诊断】HomeView - 检测到任务 ${taskId} 已准备好对平，开始执行...`)
        addMessage(
          `接收到人工确认完成信号，即将开始对任务 ${taskId} 进行最终的物资对平...`,
          'system'
        )

        // 更新状态为正在对平
        ownerMaterialStore.updateStatus('aligning')

        // 调用真实的对平工作流
        const result = await workflowStore.executeOwnerMaterialAlignmentWorkflow(taskId, addMessage)

        if (result.success) {
          ownerMaterialStore.updateStatus('completed')
          addMessage(`任务 ${taskId} 的物资对平已成功完成。`, 'system')
          // 可以在这里添加显示最终结果的按钮或弹窗
        } else {
          ownerMaterialStore.updateStatus('failed')
          addMessage(`任务 ${taskId} 的物资对平失败: ${result.message}`, 'system')
        }

        // 可以在这里选择是否立即重置，或者让用户查看结果后再重置
        // ownerMaterialStore.resetTask();
      }
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<style scoped>
.agent-dashboard {
  display: flex;
  height: 100vh;
  background: #ffffff;
}

.main-container {
  flex: 1;
  display: flex;
  background: #ffffff;
  font-size: 14px;
}

.sidebar-aside {
  transition: width 0.3s ease;
  flex-shrink: 0; /* 防止侧边栏收缩 */
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 72rem;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}

.input-area-wrapper {
  position: sticky;
  bottom: 1.5rem;
  width: 100%;
  padding: 16px 0;
  background: #ffffff;
}
.el-input__inner {
  border-radius: 32px !important;
  padding: 12px 20px !important;
  font-size: 16px !important;
  resize: none !important;
}
.el-input__inner textarea {
  padding: 8px 20px !important;
}
.el-button {
  margin-left: 12px;
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 600;
  font-size: 16px;
}

.right-panel > .workflow-execution-panel {
  flex: 1; /* 占据剩余空间 */
  padding: 20px; /* 顶部和左右内边距 */
  padding-bottom: 80px; /* 输入框悬浮，给底部留足空间 */
  overflow-y: auto;
  background: transparent;
}

.chat-input-area-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px; /* 调整小屏幕内边距 */
    padding-bottom: 80px; /* 调整小屏幕输入框留白 */
  }

  .chat-input-area-container {
    padding: 10px;
  }
}
</style>

<style>
/* 全局样式，用于覆盖 Element Plus 默认样式 */
.el-aside {
  background-color: #f0f2f5; /* 侧边栏背景色 */
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  padding: 20px;
  box-sizing: border-box;
}
</style>

<style scoped>
.toggle-sidebar-button {
  position: fixed;
  bottom: 20px;
  /* left 属性现在通过 :style 动态绑定 */
  transition: left 0.3s ease; /* 添加过渡效果 */
  z-index: 1000; /* 确保按钮在最上层 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
