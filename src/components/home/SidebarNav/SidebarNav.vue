<template>
  <div class="sidebar"> <!-- 将 el-aside 替换为 div -->
    <div class="sidebar-content">
      <div class="sidebar-header">
        <div class="agent-info">
          <div class="agent-avatar">
            <el-icon size="24"><Bell /></el-icon>
          </div>
          <div class="agent-details">
            <h3>五模二算智能体</h3>
            <span class="agent-status">在线</span>
          </div>
        </div>
      </div>

      <div class="functions-section">
        <div class="section-title">智能体功能</div>
        <el-menu
          :default-active="''"
          class="sidebar-menu"
          @select="selectFunction"
          background-color="transparent"
        >
          <el-menu-item v-for="func in functions" :key="func.id" :index="func.id" class="menu-item">
            <el-icon :class="func.iconClass">
              <component :is="func.icon" />
            </el-icon>
            <span>{{ func.name }}</span>
          </el-menu-item>
        </el-menu>
      </div>
    </div>
    
    <!-- 主题控制区域 -->
    <div class="theme-controls">
      <div class="theme-actions">
        <ThemeManager mode="compact" />
        <ThemeManager mode="toggle" />
      </div>
    </div>
  </div> <!-- 闭合 div -->
</template>

<script setup>
import { Bell, Upload } from '@element-plus/icons-vue'
import ThemeManager from '@/components/theme/ThemeManager'

import { AGENT_CONFIG, MENU_CONFIG } from './constants.js'
import { selectFunction as selectFunctionFromUtils, formatFunctionName, isFunctionEnabled } from './utils.js'

const props = defineProps({
  functions: {
    type: Array,
    required: true
  },
  activeFunction: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['select'])

// 处理功能选择
const selectFunction = (key) => {
  selectFunctionFromUtils(key, emit)
}
</script>

<style scoped>
.sidebar {
  background: var(--theme-bg-tertiary);
  box-shadow: var(--theme-shadow-md);
  border-right: 1px solid var(--theme-border-primary);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 暗黑模式下增强侧边栏效果 */
[data-theme="dark"] .sidebar,
[data-theme="tech-blue"] .sidebar {
  background: linear-gradient(
    180deg,
    var(--theme-bg-tertiary) 0%,
    var(--theme-bg-secondary) 100%
  );
  border-right: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow: 
    var(--theme-shadow-md),
    inset -1px 0 0 rgba(64, 158, 255, 0.1);
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-primary),
    transparent
  );
  opacity: 0.3;
}

[data-theme="dark"] .sidebar::before,
[data-theme="tech-blue"] .sidebar::before {
  opacity: 0.6;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--theme-border-secondary);
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-inverse);
  box-shadow: var(--theme-shadow-md);
  transition: all 0.3s ease;
}

/* 暗黑模式下增强头像效果 */
[data-theme="dark"] .agent-avatar,
[data-theme="tech-blue"] .agent-avatar {
  box-shadow: 
    var(--theme-shadow-md),
    0 0 20px rgba(64, 158, 255, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.agent-avatar:hover {
  transform: scale(1.05);
  box-shadow: 
    var(--theme-shadow-lg),
    0 0 25px rgba(64, 158, 255, 0.4);
}

.agent-details h3 {
  margin: 0 0 4px 0;
  color: var(--theme-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.agent-status {
  color: var(--theme-success);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.agent-status::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--theme-success);
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

/* 闪烁动画 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* 暗黑模式下增强在线状态的可见性 */
[data-theme="dark"] .agent-status,
[data-theme="tech-blue"] .agent-status {
  color: #00ff88;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

[data-theme="dark"] .agent-status::before,
[data-theme="tech-blue"] .agent-status::before {
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
}

.functions-section {
  padding: 20px 0;
  flex: 1;
  overflow-y: auto;
}

.section-title {
  padding: 0 20px 16px;
  color: var(--theme-text-primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 8px;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(
    90deg, 
    var(--theme-primary), 
    transparent
  );
  opacity: 0.3;
}

/* 暗黑模式下增强section-title的可见性 */
[data-theme="dark"] .section-title,
[data-theme="tech-blue"] .section-title {
  color: var(--theme-text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

[data-theme="dark"] .section-title::after,
[data-theme="tech-blue"] .section-title::after {
  opacity: 0.6;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.3);
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

/* 覆盖Element Plus菜单项默认样式 */
:deep(.el-menu-item) {
  color: var(--theme-text-primary) !important;
  background-color: transparent !important;
  border-radius: 12px !important;
  margin: 4px 12px !important;
  height: auto !important;
  line-height: normal !important;
  padding: 12px 16px !important;
  transition: all 0.3s ease !important;
}

:deep(.el-menu-item:hover) {
  background-color: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
  transform: translateX(4px) !important;
  box-shadow: var(--theme-shadow-md) !important;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
  font-weight: 600 !important;
  box-shadow: var(--theme-shadow-md) !important;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 8px !important;
  font-size: 16px !important;
  color: inherit !important;
}

/* 暗黑模式下的特殊优化 */
[data-theme="dark"] :deep(.el-menu-item),
[data-theme="tech-blue"] :deep(.el-menu-item) {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

[data-theme="dark"] :deep(.el-menu-item:hover),
[data-theme="tech-blue"] :deep(.el-menu-item:hover) {
  background-color: var(--theme-primary) !important;
  border-color: var(--theme-primary) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
}

[data-theme="dark"] :deep(.el-menu-item.is-active),
[data-theme="tech-blue"] :deep(.el-menu-item.is-active) {
  background-color: var(--theme-primary) !important;
  border-color: var(--theme-primary) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
}

/* 移除旧的menu-item样式，现在使用:deep()选择器 */

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.workflow-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

/* 主题控制区域 */
.theme-controls {
  padding: 16px;
  border-top: 1px solid var(--theme-border-secondary);
  background: var(--theme-bg-card);
  backdrop-filter: var(--theme-backdrop-blur);
}

.theme-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .theme-controls {
    padding: 12px;
  }
  
  .theme-actions {
    gap: 8px;
  }
}
</style>
