<template>
  <div class="compact-theme-selector">
    <el-dropdown 
      trigger="click" 
      placement="top-start"
      popper-class="theme-dropdown-popper"
      @command="handleThemeSelect"
    >
      <el-button
        :icon="Brush"
        circle
        size="default"
        :class="['theme-button', { 'active': currentTheme !== 'light' && currentTheme !== 'dark' }]"
        title="选择主题"
      />
      
      <template #dropdown>
        <el-dropdown-menu class="theme-dropdown-menu">
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
              <el-dropdown-item
                v-for="theme in themes"
                :key="theme.id"
                :command="theme.id"
                :class="[
                  'theme-option',
                  { 'active': currentTheme === theme.id }
                ]"
              >
                <div class="theme-option-content">
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
              </el-dropdown-item>
            </div>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { Brush, Check } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const { themes, currentTheme, autoTheme } = storeToRefs(themeStore)
const { setTheme, setAutoTheme } = themeStore

const handleThemeSelect = (themeId) => {
  console.log('Theme selected:', themeId)
  if (autoTheme.value) {
    setAutoTheme(false)
  }
  setTheme(themeId)
}

const handleAutoThemeChange = (enabled) => {
  console.log('Auto theme changed:', enabled)
  setAutoTheme(enabled)
}
</script>

<style scoped>
.compact-theme-selector {
  display: flex;
  align-items: center;
  justify-content: center;
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
  min-width: 240px;
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
  padding: 0 !important;
  margin-bottom: 2px;
}

.theme-option-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  width: 100%;
}

.theme-option:hover .theme-option-content {
  background-color: var(--theme-bg-tertiary);
}

.theme-option.active .theme-option-content {
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
/* 全局样式覆盖 dropdown */
.theme-dropdown-popper {
  padding: 0 !important;
  border-radius: 8px !important;
  border: 1px solid var(--theme-border-primary) !important;
  background: var(--theme-bg-card) !important;
  backdrop-filter: var(--theme-backdrop-blur) !important;
  box-shadow: var(--theme-shadow-lg) !important;
  z-index: 9999 !important;
}

.theme-dropdown-menu {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
</style>