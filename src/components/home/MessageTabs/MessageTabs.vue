<template>
  <div class="tabs-and-clear-button">
    <el-tabs v-model="activeTab" class="message-tabs" @tab-click="onTabClick">
      <el-tab-pane label="所有消息" name="all"></el-tab-pane>
      <el-tab-pane label="合同解析" name="contract"></el-tab-pane>
      <el-tab-pane label="乙供物资解析" name="material"></el-tab-pane>
      <el-tab-pane label="甲供物资解析" name="j_material"></el-tab-pane>
      <el-tab-pane label="对话流" name="dialogue"></el-tab-pane>
    </el-tabs>
    <el-button
      type="info"
      :icon="Delete"
      circle
      plain
      class="clear-messages-button"
      @click="clearMessages"
      title="清空所有消息"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useChatStore } from '@/stores/chat'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'clear-messages'])

// 本地状态
const activeTab = ref(props.modelValue)

// Store
const chatStore = useChatStore()

// 监听本地状态变化，同步到父组件
watch(activeTab, (newValue) => {
  emit('update:modelValue', newValue)
})

// 监听props变化，同步到本地状态
watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue
})

/**
 * 处理标签页点击
 */
const onTabClick = () => {
  emit('tab-click')
}

/**
 * 清空消息
 */
const clearMessages = () => {
  ElMessageBox.confirm('确定要清空所有消息吗？此操作不可逆。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      chatStore.resetAndInitMessages()
      activeTab.value = 'all'
      ElMessage.success('消息已清空。')
      emit('clear-messages')
    })
    .catch(() => {
      ElMessage.info('已取消清空操作。')
    })
}
</script>

<style scoped>
.tabs-and-clear-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

.message-tabs {
  flex-grow: 1;
}

/* Tabs header 样式覆盖 */
:deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
  background: transparent;
}

/* Tabs nav scroll 样式 */
:deep(.el-tabs__nav-scroll) {
  padding: 0;
  background: transparent;
}

/* Tabs nav wrap 样式 */
:deep(.el-tabs__nav-wrap) {
  background: transparent;
}

/* Tabs nav 样式 */
:deep(.el-tabs__nav) {
  border-bottom: none;
  background: transparent;
}

/* Tab item 样式 */
:deep(.el-tabs__item) {
  color: var(--el-tabs-header-color) !important;
  font-weight: 500 !important;
  padding: 0 20px !important;
  height: 40px !important;
  line-height: 40px !important;
  border-bottom: 2px solid transparent !important;
  transition: all 0.3s ease !important;
  background: transparent !important;
  border-radius: 8px 8px 0 0 !important;
  margin-right: 4px !important;
}

/* Tab item hover 状态 */
:deep(.el-tabs__item:hover) {
  color: var(--el-tabs-hover-color) !important;
  background: rgba(64, 158, 255, 0.1) !important;
  transform: translateY(-2px) !important;
}

/* Tab item active 状态 */
:deep(.el-tabs__item.is-active) {
  color: var(--el-tabs-active-color) !important;
  background: var(--theme-bg-card) !important;
  border-bottom-color: var(--el-tabs-active-color) !important;
  font-weight: 600 !important;
  box-shadow: var(--theme-shadow-sm) !important;
}

/* 移除默认的 active line */
:deep(.el-tabs__active-bar) {
  display: none !important;
}

/* 清除按钮样式 */
.clear-messages-button {
  margin-left: 10px;
  flex-shrink: 0;
  background: var(--theme-bg-tertiary) !important;
  border-color: var(--theme-border-primary) !important;
  color: var(--theme-text-secondary) !important;
  transition: all 0.3s ease !important;
}

.clear-messages-button:hover {
  background: var(--theme-error) !important;
  border-color: var(--theme-error) !important;
  color: var(--theme-text-inverse) !important;
  transform: scale(1.05) !important;
}

/* 暗黑模式下的特殊优化 */
[data-theme="dark"] :deep(.el-tabs__item),
[data-theme="tech-blue"] :deep(.el-tabs__item) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-bottom: 2px solid transparent !important;
}

[data-theme="dark"] :deep(.el-tabs__item:hover),
[data-theme="tech-blue"] :deep(.el-tabs__item:hover) {
  background: rgba(64, 158, 255, 0.2) !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
}

[data-theme="dark"] :deep(.el-tabs__item.is-active),
[data-theme="tech-blue"] :deep(.el-tabs__item.is-active) {
  background: var(--theme-primary) !important;
  border-color: var(--theme-primary) !important;
  border-bottom-color: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4) !important;
}
</style>