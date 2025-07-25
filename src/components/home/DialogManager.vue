<template>
  <!-- 物资解析结果详情弹窗组件 -->
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
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useWorkflowStore } from '@/stores/workflow'
import { useMaterialDialogStore } from '@/stores/materialDialog'
import { useChatStore } from '@/stores/chat'

// 异步加载弹窗组件
const MaterialParsingResultDialog = defineAsyncComponent(() =>
  import('@/components/home/MaterialParsingResultDialog.vue')
)
const OwnerMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/OwnerMaterialTaskParsingDetailDialog.vue')
)
const SupplierMaterialTaskParsingDetailDialog = defineAsyncComponent(() =>
  import('@/components/home/SupplierMaterialTaskParsingDetailDialog.vue')
)
const WorkflowConfigDialog = defineAsyncComponent(() =>
  import('@/components/home/WorkflowConfigDialog.vue')
)
const SmartBrainDialog = defineAsyncComponent(() =>
  import('@/components/home/SmartBrainDialog.vue')
)
const ResultDetailTableDialog = defineAsyncComponent(() =>
  import('@/components/home/ResultDetailTableDialog.vue')
)
const LongTextEditPopup = defineAsyncComponent(() =>
  import('@/components/home/LongTextEditPopup.vue')
)

// Stores
const workflowStore = useWorkflowStore()
const materialDialogStore = useMaterialDialogStore()
const chatStore = useChatStore()

// 从 Store 中解构状态和方法
const {
  showWorkflowConfig,
  showSmartBrainDialog,
  workflowConfig,
  smartAgents,
  taskListsByAgent,
} = storeToRefs(workflowStore)

const {
  getCurrentFunctionName,
  getCurrentFunction,
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

const { addMessage } = chatStore

// 事件处理函数
const handleViewOwnerMaterialDetail = (row) => {
  console.log(
    '【诊断】DialogManager - 接收到 OwnerMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    row
  )
}

const handleViewSupplierMaterialDetail = (row) => {
  console.log(
    '【诊断】DialogManager - 接收到 SupplierMaterialTaskParsingDetailDialog 的 view-detail 事件:',
    row
  )
}

const onConfigDialogClose = () => {
  // No action needed
}
</script>