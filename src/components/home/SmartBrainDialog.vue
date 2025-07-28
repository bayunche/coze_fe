<template>
  <el-dialog
    v-model="dialogVisible"
    title="智能大脑状态中心"
    width="70%"
    :before-close="handleClose"
    custom-class="smart-brain-dialog"
  >
    <div class="agent-stats-grid">
      <el-card
        v-for="agent in agents"
        :key="agent.id"
        class="agent-card"
        shadow="hover"
        @click="openAgentDialog(agent)"
      >
        <template #header>
          <div class="card-header">
            <span>{{ agent.name }}</span>
            <el-tag :type="agent.status === 'online' ? 'success' : 'info'" size="small">{{
              agent.status === 'online' ? '在线' : '离线'
            }}</el-tag>
          </div>
        </template>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.completed }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.inProgress }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.total }}</span>
            <span class="stat-label">总任务</span>
          </div>
        </div>
      </el-card>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
  <TaskParsingResultDialog
    v-if="isContractParsing"
    v-model:show="taskParsingResultDialogVisible"
    :tasks="selectedTasks"
  ></TaskParsingResultDialog>
  <MaterialParsingResultDialog
    v-if="isSupplierMaterialParsing"
    v-model:show="supplierMaterialParsingResultDialogVisible"
    :tasks="selectedTasks"
  ></MaterialParsingResultDialog>
  <OwnerMaterialParsingResultDialog
    v-if="isOwnerMaterialParsing"
    v-model:show="ownerMaterialParsingResultDialogVisible"
    :tasks="selectedTasks"
  ></OwnerMaterialParsingResultDialog>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import TaskParsingResultDialog from './TaskParsingResultDialog.vue'
import MaterialParsingResultDialog from './MaterialParsingResultDialog.vue'
import OwnerMaterialParsingResultDialog from './OwnerMaterialParsingResultDialog.vue' // 导入新的组件

const taskParsingResultDialogVisible = ref(false)
const supplierMaterialParsingResultDialogVisible = ref(false) // 乙供物资弹窗
const ownerMaterialParsingResultDialogVisible = ref(false) // 甲供物资弹窗

const isContractParsing = ref(false)
const isSupplierMaterialParsing = ref(false) // 乙供物资状态
const isOwnerMaterialParsing = ref(false) // 甲供物资状态

const selectedTasks = ref({})

const openAgentDialog = async (agent) => {
  isContractParsing.value = false
  isSupplierMaterialParsing.value = false
  isOwnerMaterialParsing.value = false

  // 直接使用 props.tasksByAgent 中已有的数据
  selectedTasks.value = props.tasksByAgent[agent.id] || { all: [], completed: [], inProgress: [] }

  await nextTick()

  if (agent.id === 'contractParsing') {
    isContractParsing.value = true
    taskParsingResultDialogVisible.value = true
  } else if (agent.id === 'supplierMaterialParsing') {
    isSupplierMaterialParsing.value = true
    supplierMaterialParsingResultDialogVisible.value = true
  } else if (agent.id === 'ownerSuppliedMaterialParsing') {
    isOwnerMaterialParsing.value = true
    ownerMaterialParsingResultDialogVisible.value = true
  }
}

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  agents: {
    type: Array,
    required: true
  },
  tasksByAgent: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:show'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
/* 智能大脑对话框样式 */
:deep(.smart-brain-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
}

:deep(.smart-brain-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.smart-brain-dialog .el-dialog__body) {
  padding: 20px 30px;
  background-color: var(--theme-bg-secondary);
}

:deep(.smart-brain-dialog .el-dialog__footer) {
  background: var(--theme-dialog-header-bg);
  border-top: 1px solid var(--theme-border-secondary);
}

.agent-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.agent-card {
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
  cursor: pointer;
  background: var(--theme-card-bg);
  box-shadow: var(--theme-card-shadow);
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

/* Element Plus 卡片内部样式覆盖 */
:deep(.agent-card .el-card__header) {
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.agent-card .el-card__body) {
  background: var(--theme-bg-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.stats-container {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

/* 暗黑模式下的特殊优化 */
[data-theme="dark"] .agent-card:hover,
[data-theme="tech-blue"] .agent-card:hover {
  box-shadow: 
    var(--theme-card-hover-shadow),
    0 0 20px rgba(64, 158, 255, 0.3);
}

/* 状态标签样式优化 */
:deep(.el-tag) {
  background: var(--theme-tag-bg) !important;
  color: var(--theme-tag-text) !important;
  border-color: var(--theme-border-primary) !important;
}

:deep(.el-tag--success) {
  background: var(--theme-success) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--info) {
  background: var(--theme-info) !important;
  color: var(--theme-text-inverse) !important;
}
</style>
