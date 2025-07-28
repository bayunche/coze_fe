<template>
  <div class="theme-selector">
    <el-dropdown trigger="click" placement="bottom-end" @command="handleThemeChange">
      <el-button type="text" class="theme-trigger">
        <el-icon size="18">
          <component :is="isDarkMode ? Moon : Sunny" />
        </el-icon>
        <span class="theme-name">{{ currentThemeInfo.name }}</span>
      </el-button>
      
      <template #dropdown>
        <el-dropdown-menu class="theme-dropdown">
          <div class="theme-dropdown-header">
            <h4>选择主题</h4>
            <div class="auto-theme-toggle">
              <el-switch
                v-model="autoTheme"
                @change="handleAutoThemeChange"
                size="small"
                active-text="跟随系统"
                :disabled="false"
              />
            </div>
          </div>
          
          <el-scrollbar max-height="320px">
            <div class="theme-grid">
              <div
                v-for="theme in themes"
                :key="theme.id"
                :class="[
                  'theme-item',
                  { 'active': currentTheme === theme.id }
                ]"
                @click="handleThemeSelect(theme.id)"
              >
                <div class="theme-preview" :style="{ backgroundColor: theme.preview }">
                  <div class="theme-preview-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">{{ theme.name }}</div>
                  <div class="theme-desc">{{ theme.description }}</div>
                </div>
                <el-icon v-if="currentTheme === theme.id" class="check-icon">
                  <Check />
                </el-icon>
              </div>
            </div>
          </el-scrollbar>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { Sunny, Moon, Check } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const { themes, currentTheme, autoTheme } = storeToRefs(themeStore)
const { setTheme, setAutoTheme } = themeStore

const currentThemeInfo = computed(() => {
  return themes.value.find(theme => theme.id === currentTheme.value) || themes.value[0]
})

const isDarkMode = computed(() => {
  return currentTheme.value === 'dark' || currentTheme.value === 'tech-blue'
})

const handleThemeSelect = (themeId) => {
  if (autoTheme.value) {
    setAutoTheme(false)
  }
  setTheme(themeId)
}

const handleAutoThemeChange = (enabled) => {
  setAutoTheme(enabled)
}

const handleThemeChange = (command) => {
  if (command) {
    handleThemeSelect(command)
  }
}
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--theme-text-primary);
  transition: all 0.3s ease;
}

.theme-trigger:hover {
  background-color: var(--theme-bg-tertiary);
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
}

.theme-dropdown {
  width: 280px;
  padding: 0;
  border-radius: 12px;
  box-shadow: var(--theme-shadow-lg);
  border: 1px solid var(--theme-border-primary);
}

.theme-dropdown-header {
  padding: 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-dropdown-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.auto-theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-grid {
  padding: 8px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 4px;
}

.theme-item:hover {
  background-color: var(--theme-bg-tertiary);
}

.theme-item.active {
  background-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

.theme-item.active .theme-desc {
  color: rgba(255, 255, 255, 0.8);
}

.theme-preview {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-preview-dots {
  display: flex;
  gap: 2px;
}

.dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-desc {
  font-size: 12px;
  color: var(--theme-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-icon {
  color: var(--theme-text-inverse);
  font-size: 16px;
}

/* 深色主题下的样式调整 */
[data-theme="dark"] .theme-dropdown,
[data-theme="tech-blue"] .theme-dropdown {
  background-color: var(--theme-bg-card);
  backdrop-filter: var(--theme-backdrop-blur);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-dropdown {
    width: 260px;
  }
  
  .theme-name {
    display: none;
  }
}
</style>