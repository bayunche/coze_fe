<template>
  <el-header height="60px" class="header">
    <div class="header-content">
      <div class="header-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>智能体控制台</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions"></div>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'

import { BREADCRUMB_CONFIG } from './constants.js'
import { buildBreadcrumbPath, formatLogsCount, getFunctionStatus } from './utils.js'

const props = defineProps({
  currentFunctionName: {
    type: String,
    required: true
  },
  executionLogsCount: {
    type: Number,
    required: true
  },
  activeFunction: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['show-workflow-config'])

// 计算属性
const breadcrumbPath = computed(() => buildBreadcrumbPath(props.currentFunctionName))
const formattedLogsCount = computed(() => formatLogsCount(props.executionLogsCount))
const functionStatus = computed(() => getFunctionStatus(props.activeFunction))

// 显示工作流配置
const showWorkflowConfig = () => {
  emit('show-workflow-config')
}
</script>

<style scoped>
.header {
  background: var(--theme-glass-bg);
  backdrop-filter: var(--theme-backdrop-blur);
  box-shadow: var(--theme-shadow-lg);
  padding: 0 32px;
  border-bottom: 1px solid var(--theme-border-secondary);
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  position: relative;
}
</style>
