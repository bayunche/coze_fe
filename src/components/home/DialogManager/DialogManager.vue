<template>
  <!-- 物资解析结果详情弹窗组件 -->
  <MaterialParsingResultDialog
    v-model="showMaterialParsingResultDialog"
    :task="materialParsingResultTask"
  />

  <!-- 甲供物资任务解析详情弹窗组件 -->
  <OwnerMaterialTaskParsingDetailDialog
    v-model="showOwnerMaterialTaskParsingDetailDialog"
    :taskId="ownerMaterialTaskParsingDetailTaskId"
    @view-detail="viewOwnerMaterialDetail"
    style="z-index: 2000"
  />

  <!-- 乙供物资任务解析详情弹窗组件 -->
  <SupplierMaterialTaskParsingDetailDialog
    v-model="showSupplierMaterialTaskParsingDetailDialog"
    :taskId="supplierMaterialTaskParsingDetailTaskId"
    @view-detail="viewSupplierMaterialDetail"
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
    @update:config="updateWorkflowConfig"
  />

  <!-- 智能大脑弹窗 -->
  <SmartBrainDialog
    v-model:show="showSmartBrainDialog"
    :agents="smartAgents"
  />

  <!-- 结果详情对话框 -->
  <ResultDetailTableDialog />

  <!-- 任务详情列表对话框 -->
  <TaskDetailDialog 
    v-model:show="showTaskDetail"
    :task="{ id: currentTaskId }"
    @view-detail="viewContractTaskDetail"
  />

  <!-- 编辑长文本的对话框 -->
  <LongTextEditPopup />
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useMaterialDialogStore } from '@/stores/materialDialog'
import { useChatStore } from '@/stores/chat'
import { useParsingResultStore } from '@/stores/parsingResult'

// 异步加载弹窗组件
const MaterialParsingResultDialog = defineAsyncComponent(() =>
  import('@/components/home/MaterialParsingResultDialog')
)
const OwnerMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/OwnerMaterialTaskParsingDetailDialog')
)
const SupplierMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/SupplierMaterialTaskParsingDetailDialog')
)
const WorkflowConfigDialog = defineAsyncComponent(() =>
  import('@/components/workflow/WorkflowConfigDialog')
)
const SmartBrainDialog = defineAsyncComponent(() =>
  import('@/components/home/SmartBrainDialog')
)
const ResultDetailTableDialog = defineAsyncComponent(() =>
  import('@/components/home/ResultDetailTableDialog')
)
const TaskDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/TaskDetailDialog')
)
const LongTextEditPopup = defineAsyncComponent(() =>
  import('@/components/home/LongTextEditPopup')
)

// Stores
const workflowStore = useWorkflowStore()
const materialDialogStore = useMaterialDialogStore()
const chatStore = useChatStore()
const parsingResultStore = useParsingResultStore()

// 从 Store 中解构状态和方法
const {
  showWorkflowConfig,
  showSmartBrainDialog,
  workflowConfig,
  smartAgents,
} = storeToRefs(workflowStore)

const {
  getCurrentFunctionName,
  getCurrentFunctionParams,
  needsFileUpload,
  getAllowedFileTypes,
  startWorkflowFromDialog,
} = workflowStore

const {
  showMaterialParsingResultDialog,
  materialParsingResultTask,
  showOwnerMaterialTaskParsingDetailDialog,
  ownerMaterialTaskParsingDetailTaskId,
  showSupplierMaterialTaskParsingDetailDialog,
  supplierMaterialTaskParsingDetailTaskId,
} = storeToRefs(materialDialogStore)

const {
  showTaskDetail,
  taskId: currentTaskId,
} = storeToRefs(parsingResultStore)

const { addMessage } = chatStore

// 初始化路由
const router = useRouter()

// 事件处理函数
const viewOwnerMaterialDetail = (data) => {
  console.log(
    '【诊断】DialogManager - 接收到 OwnerMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    data
  )
  
  // 提取 taskId 和 detailId 参数
  const taskId = data.taskId
  const detailId = data.detailId || data.row?.id || data.row?.taskDetailId || data.row?.detailId
  
  console.log('【诊断】跳转参数 - taskId:', taskId, 'detailId:', detailId)
  
  // 检查参数有效性
  if (!taskId || !detailId) {
    console.error('跳转失败：缺少必要参数', { taskId, detailId })
    return
  }
  
  // 关闭当前弹窗
  materialDialogStore.showOwnerMaterialTaskParsingDetailDialog = false
  
  // 跳转到乙供物资详情页面
  router.push({
    name: 'supplier-material-detail',
    params: {
      taskId: String(taskId),
      detailId: String(detailId)
    }
  }).catch(error => {
    console.error('路由跳转失败:', error)
  })
}

const viewSupplierMaterialDetail = (row) => {
  console.log(
    '【诊断】DialogManager - 接收到 SupplierMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    row
  )
}

const viewContractTaskDetail = (data) => {
  console.log(
    '【诊断】DialogManager - 接收到 TaskDetailDialog 的 view-detail 事件:',
    data
  )
  
  // 提取 taskId 和 detailId 参数
  const taskId = data.taskId
  const detailId = data.detailId || data.row?.id || data.row?.taskDetailId || data.row?.detailId
  
  console.log('【诊断】合同任务详情跳转参数 - taskId:', taskId, 'detailId:', detailId)
  
  // 检查参数有效性
  if (!taskId || !detailId) {
    console.error('跳转失败：缺少必要参数', { taskId, detailId })
    return
  }
  
  // 这里可以根据需要处理合同任务详情的查看逻辑
  // 目前暂时只输出日志，后续可以根据需求添加具体的处理逻辑
  console.log('【TODO】合同任务详情查看功能待实现，参数:', { taskId, detailId, row: data.row })
}

const onConfigDialogClose = () => {
  // No action needed
}

const updateWorkflowConfig = (newConfig) => {
  console.log('[DialogManager] 接收到配置更新:', newConfig)
  console.log('[DialogManager] 当前配置:', workflowConfig)
  // 手动更新 reactive 对象的属性，保持响应性
  Object.keys(newConfig).forEach(key => {
    workflowConfig[key] = newConfig[key]
  })
  console.log('[DialogManager] 更新后配置:', workflowConfig)
}
</script>