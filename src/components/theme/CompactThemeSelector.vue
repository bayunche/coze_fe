<template>
  <div class="compact-theme-selector">
    <el-popover
      v-model:visible="popoverVisible"
      placement="top-start"
      :width="240"
      trigger="click"
      popper-class="theme-popover"
    >
      <template #reference>
        <el-button
          :icon="Brush"
          circle
          size="default"
          :class="['theme-button', { 'active': currentTheme !== 'light' && currentTheme !== 'dark' }]"
          title="选择主题"
        />
      </template>
      
      <div class="theme-selector-content">
        <div class="theme-header">
          <h4>选择主题</h4>
          <div class="auto-theme-switch">
            <el-switch
              v-model="autoTheme"
              @change="handleAutoThemeChange"
              size="small"
              active-text="跟随系统"
              :width="60"
            />
          </div>
        </div>
        
        <div class="theme-grid">
          <div
            v-for="theme in themes"
            :key="theme.id"
            :class="[
              'theme-option',
              { 'active': currentTheme === theme.id }
            ]"
            @click="handleThemeSelect(theme.id)"
          >
            <div 
              class="theme-preview" 
              :style="{ backgroundColor: theme.preview }"
            >
              <div class="preview-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
            <div class="theme-info">
              <div class="theme-name">{{ theme.name }}</div>
            </div>
            <el-icon v-if="currentTheme === theme.id" class="check-icon">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { Brush, Check } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const { themes, currentTheme, autoTheme } = storeToRefs(themeStore)
const { setTheme, setAutoTheme } = themeStore

// 控制popover显示状态
const popoverVisible = ref(false)

const handleThemeSelect = (themeId) => {
  console.log('Theme selected:', themeId)
  if (autoTheme.value) {
    setAutoTheme(false)
  }
  setTheme(themeId)
  // 选择主题后关闭popover
  popoverVisible.value = false
}

const handleAutoThemeChange = (enabled) => {
  console.log('Auto theme changed:', enabled)
  setAutoTheme(enabled)
}

// 调试popover状态
watch(popoverVisible, (newValue) => {
  console.log('Popover visible:', newValue)
})
</script>

<style scoped>
.compact-theme-selector {
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-button-wrapper {
  display: inline-block;
}

.theme-button {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-primary);
  color: var(--theme-text-secondary);
  transition: all 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur);
}

.theme-button:hover {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
  transform: scale(1.05);
  box-shadow: var(--theme-shadow-md);
}

.theme-button.active {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

.theme-selector-content {
  padding: 0;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
  margin-bottom: 8px;
}

.theme-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.auto-theme-switch {
  font-size: 12px;
}

.theme-grid {
  padding: 0 8px 8px;
  max-height: 240px;
  overflow-y: auto;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 2px;
}

.theme-option:hover {
  background-color: var(--theme-bg-tertiary);
}

.theme-option.active {
  background-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

.theme-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-dots {
  display: flex;
  gap: 1px;
}

.dot {
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon {
  color: var(--theme-text-inverse);
  font-size: 14px;
}

/* 滚动条样式 */
.theme-grid::-webkit-scrollbar {
  width: 4px;
}

.theme-grid::-webkit-scrollbar-track {
  background: var(--theme-bg-secondary);
  border-radius: 2px;
}

.theme-grid::-webkit-scrollbar-thumb {
  background: var(--theme-border-primary);
  border-radius: 2px;
}

.theme-grid::-webkit-scrollbar-thumb:hover {
  background: var(--theme-text-tertiary);
}
</style>

<style>
/* 全局样式覆盖 popover */
.theme-popover {
  padding: 0 !important;
  border-radius: 8px !important;
  border: 1px solid var(--theme-border-primary) !important;
  background: var(--theme-bg-card) !important;
  backdrop-filter: var(--theme-backdrop-blur) !important;
  box-shadow: var(--theme-shadow-lg) !important;
  z-index: 9999 !important;
}

.theme-popover .el-popover__content {
  padding: 0 !important;
}

/* 确保popover箭头显示正确 */
.theme-popover[data-popper-placement^="top"] > .el-popper__arrow::before {
  border-top-color: var(--theme-bg-card) !important;
}

.theme-popover[data-popper-placement^="bottom"] > .el-popper__arrow::before {
  border-bottom-color: var(--theme-bg-card) !important;
}

.theme-popover[data-popper-placement^="left"] > .el-popper__arrow::before {
  border-left-color: var(--theme-bg-card) !important;
}

.theme-popover[data-popper-placement^="right"] > .el-popper__arrow::before {
  border-right-color: var(--theme-bg-card) !important;
}
</style>