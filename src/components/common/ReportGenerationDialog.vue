<template>
  <el-dialog
    v-model="visible"
    title="报告生成中"
    :width="480"
    :closable="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    center
    class="report-generation-dialog"
  >
    <div class="dialog-content">
      <div class="loading-section">
        <el-icon class="loading-icon" :size="48">
          <Loading />
        </el-icon>
      </div>
      
      <div class="message-section">
        <h3 class="main-message">正在调用多模态大模型生成对应报告中</h3>
        <p class="sub-message">请等待...</p>
        <div class="progress-message" v-if="progressText">
          {{ progressText }}
        </div>
      </div>
    </div>
    
    <template #footer>
      <!-- 不显示任何按钮，保持加载状态 -->
    </template>
  </el-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  progressText: {
    type: String,
    default: ''
  }
})

// 定义emits
const emit = defineEmits(['update:modelValue'])

// 计算属性用于双向绑定
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
.report-generation-dialog {
  --primary-color: #409eff;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-regular: #909399;
  --bg-color: #ffffff;
}

.dialog-content {
  text-align: center;
  padding: 20px;
}

.loading-section {
  margin-bottom: 24px;
}

.loading-icon {
  color: var(--primary-color);
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-section {
  margin-bottom: 16px;
}

.main-message {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.sub-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.progress-message {
  font-size: 12px;
  color: var(--text-regular);
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 16px;
  border-left: 3px solid var(--primary-color);
  text-align: left;
  word-break: break-all;
  max-height: 60px;
  overflow-y: auto;
}

/* Dialog样式覆盖 */
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #409eff 0%, #36a3f7 100%);
  color: white;
  padding: 16px 20px;
  border-radius: 12px 12px 0 0;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-dialog__body) {
  padding: 0;
  background: var(--bg-color);
}

:deep(.el-dialog__footer) {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-content {
    padding: 16px;
  }
  
  .main-message {
    font-size: 15px;
  }
  
  .sub-message {
    font-size: 13px;
  }
  
  .loading-icon {
    font-size: 40px !important;
  }
}
</style>