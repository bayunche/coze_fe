<template>
  <div class="dark-mode-toggle">
    <el-tooltip 
      :content="isDarkMode ? '切换到浅色模式' : '切换到暗黑模式'" 
      placement="top"
    >
      <el-button
        :icon="isDarkMode ? Sunny : Moon"
        circle
        size="default"
        @click="toggleDarkMode"
        :class="['toggle-button', { 'dark': isDarkMode }]"
      />
    </el-tooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { Sunny, Moon } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const { currentTheme, autoTheme } = storeToRefs(themeStore)
const { setTheme, setAutoTheme } = themeStore

const isDarkMode = computed(() => {
  return currentTheme.value === 'dark' || currentTheme.value === 'tech-blue'
})

const toggleDarkMode = () => {
  // 如果开启了自动主题，先关闭
  if (autoTheme.value) {
    setAutoTheme(false)
  }
  
  // 在暗黑和浅色之间切换
  if (isDarkMode.value) {
    setTheme('light')
  } else {
    setTheme('dark')
  }
}
</script>

<style scoped>
.dark-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-button {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-primary);
  color: var(--theme-text-secondary);
  transition: all 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur);
}

.toggle-button:hover {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
  transform: scale(1.05);
  box-shadow: var(--theme-shadow-md);
}

.toggle-button.dark {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

.toggle-button.dark:hover {
  background: var(--theme-primary-light);
  border-color: var(--theme-primary-light);
}

/* 按钮动画效果 */
.toggle-button:active {
  transform: scale(0.95);
}

/* 图标旋转动画 */
.toggle-button :deep(.el-icon) {
  transition: transform 0.3s ease;
}

.toggle-button:hover :deep(.el-icon) {
  transform: rotate(180deg);
}
</style>