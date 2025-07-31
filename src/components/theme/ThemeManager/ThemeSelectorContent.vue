<template>
  <div class="theme-selector-content">
    <div class="theme-header">
      <h4>选择主题</h4>
      <div class="auto-theme-switch">
        <el-switch
          :model-value="autoTheme"
          @change="$emit('auto-theme-change', $event)"
          size="small"
          active-text="跟随系统"
          :width="60"
        />
      </div>
    </div>
    
    <!-- 主题网格 -->
    <el-scrollbar v-if="showGrid" max-height="320px">
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          :class="['theme-card', { 'active': currentTheme === theme.id }]"
          @click="$emit('theme-select', theme.id)"
        >
          <div class="theme-preview">
            <div 
              class="color-bar"
              :style="{ 
                background: `linear-gradient(45deg, ${theme.colors?.primary || '#409eff'}, ${theme.colors?.secondary || '#67c23a'})` 
              }"
            ></div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span class="theme-desc">{{ theme.description }}</span>
          </div>
          <div v-if="currentTheme === theme.id" class="theme-check">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <!-- 简化版主题列表 -->
    <div v-else class="theme-list">
      <div
        v-for="theme in themes"
        :key="theme.id"
        :class="['theme-item', { 'active': currentTheme === theme.id }]"
        @click="$emit('theme-select', theme.id)"
      >
        <div 
          class="theme-dot"
          :style="{ backgroundColor: theme.colors?.primary || '#409eff' }"
        ></div>
        <span class="theme-name">{{ theme.name }}</span>
        <el-icon v-if="currentTheme === theme.id" class="check-icon">
          <Check />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Check } from '@element-plus/icons-vue'

defineProps({
  autoTheme: {
    type: Boolean,
    required: true
  },
  themes: {
    type: Array,
    required: true
  },
  currentTheme: {
    type: String,
    required: true
  },
  showGrid: {
    type: Boolean,
    default: false
  }
})

defineEmits(['theme-select', 'auto-theme-change'])
</script>

<style scoped>
.theme-selector-content {
  padding: 12px;
  min-width: 200px;
}

.theme-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border-secondary);
}

.theme-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.auto-theme-switch {
  display: flex;
  align-items: center;
}

/* 网格模式样式 */
.theme-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 4px 0;
}

.theme-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-card:hover {
  border-color: var(--theme-primary);
  background: var(--theme-bg-hover);
}

.theme-card.active {
  border-color: var(--theme-primary);
  background: var(--theme-primary-bg);
}

.theme-preview {
  width: 32px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 12px;
  border: 1px solid var(--theme-border-primary);
}

.color-bar {
  width: 100%;
  height: 100%;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-info .theme-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.theme-info .theme-desc {
  font-size: 11px;
  color: var(--theme-text-secondary);
}

.theme-check {
  color: var(--theme-primary);
  font-size: 16px;
}

/* 列表模式样式 */
.theme-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-item:hover {
  background: var(--theme-bg-hover);
}

.theme-item.active {
  background: var(--theme-primary-bg);
  color: var(--theme-primary);
}

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid var(--theme-border-primary);
}

.theme-item .theme-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.check-icon {
  font-size: 14px;
  color: var(--theme-primary);
}

/* 滚动条样式 */
:deep(.el-scrollbar__bar) {
  opacity: 0.3;
}

:deep(.el-scrollbar__bar:hover) {
  opacity: 0.6;
}
</style>