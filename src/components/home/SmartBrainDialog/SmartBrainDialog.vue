<template>
  <el-dialog
    v-model="dialogVisible"
    :title="DIALOG_CONFIG.TITLE"
    :width="DIALOG_CONFIG.WIDTH"
    :before-close="() => closeMainDialog(emit)"
    :custom-class="DIALOG_CONFIG.CUSTOM_CLASS"
  >
    <div class="agent-stats-grid">
      <el-card
        v-for="agent in validAgents"
        :key="agent.id"
        class="agent-card"
        shadow="hover"
        @click="() => onAgentCardClick(agent, dialogStates, dialogVisibility)"
      >
        <template #header>
          <div class="card-header">
            <span>{{ agent.name }}</span>
            <el-tag 
              :type="AGENT_STATUS_TYPES[agent.status]" 
              size="small"
            >
              {{ AGENT_STATUS_LABELS[agent.status] }}
            </el-tag>
          </div>
        </template>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-value">{{ formatStatValue(agent.tasks.completed) }}</span>
            <span class="stat-label">{{ STAT_LABELS.COMPLETED }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatStatValue(agent.tasks.inProgress) }}</span>
            <span class="stat-label">{{ STAT_LABELS.IN_PROGRESS }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatStatValue(agent.tasks.total) }}</span>
            <span class="stat-label">{{ STAT_LABELS.TOTAL }}</span>
          </div>
          <div class="stat-item" v-if="agent.tasks.projectCount !== undefined">
            <span class="stat-value">{{ formatStatValue(agent.tasks.projectCount) }}</span>
            <span class="stat-label">{{ STAT_LABELS.PROJECT_COUNT }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="() => closeMainDialog(emit)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 合同解析结果对话框 -->
  <TaskParsingResultDialog
    v-if="dialogStates.isContractParsing"
    v-model:show="dialogVisibility.taskParsingResultDialogVisible"
    agent-id="contractParsing"
  />
  
  <!-- 乙供物资解析结果对话框 -->
  <MaterialParsingResultDialog
    v-if="dialogStates.isSupplierMaterialParsing"
    v-model:show="dialogVisibility.supplierMaterialParsingResultDialogVisible"
    agent-id="supplierMaterialParsing"
  />
  
  <!-- 甲供物资解析结果对话框 -->
  <OwnerMaterialParsingResultDialog
    v-if="dialogStates.isOwnerMaterialParsing"
    v-model:show="dialogVisibility.ownerMaterialParsingResultDialogVisible"
    agent-id="ownerSuppliedMaterialParsing"
  />
</template>

<script setup>
import { computed, reactive } from 'vue'
import TaskParsingResultDialog from '../TaskParsingResultDialog'
import MaterialParsingResultDialog from '../MaterialParsingResultDialog'
import OwnerMaterialParsingResultDialog from '../OwnerMaterialParsingResultDialog'

// 导入常量和工具函数
import {
  AGENT_STATUS_LABELS,
  AGENT_STATUS_TYPES,
  DIALOG_CONFIG,
  STAT_LABELS
} from './constants.js'

import {
  onAgentCardClick,
  closeMainDialog,
  formatStatValue,
  filterValidAgents
} from './utils.js'

// Props定义
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  agents: {
    type: Array,
    required: true,
    validator: (value) => Array.isArray(value)
  }
})

// Emits定义
const emit = defineEmits(['update:show'])

// 计算属性 - 主对话框可见性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 计算属性 - 过滤有效的智能体数据
const validAgents = computed(() => {
  return filterValidAgents(props.agents)
})

// 响应式数据 - 对话框状态
const dialogStates = reactive({
  isContractParsing: false,
  isSupplierMaterialParsing: false,
  isOwnerMaterialParsing: false
})

// 响应式数据 - 对话框可见性
const dialogVisibility = reactive({
  taskParsingResultDialogVisible: false,
  supplierMaterialParsingResultDialogVisible: false,
  ownerMaterialParsingResultDialogVisible: false
})

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
  flex-wrap: wrap;
  gap: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .agent-stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  :deep(.smart-brain-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  :deep(.smart-brain-dialog .el-dialog__body) {
    padding: 15px 20px;
  }

  .stats-container {
    padding: 12px 0;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .agent-stats-grid {
    gap: 12px;
  }

  .stats-container {
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: var(--theme-bg-secondary);
    border-radius: 6px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 11px;
    margin-top: 0;
    margin-left: 8px;
  }
}

/* 动画效果增强 */
.agent-card {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.agent-card:hover {
  transform: translateY(-5px) scale(1.02);
}

.agent-card:active {
  transform: translateY(-2px) scale(1.01);
  transition-duration: 0.1s;
}

/* 可访问性增强 */
.agent-card:focus {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
}

.agent-card:focus:not(:focus-visible) {
  outline: none;
}

/* 加载状态样式 */
.agent-card.loading {
  opacity: 0.7;
  pointer-events: none;
}

.agent-card.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--theme-primary);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>