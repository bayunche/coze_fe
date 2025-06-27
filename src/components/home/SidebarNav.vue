<template>
  <div class="sidebar"> <!-- 将 el-aside 替换为 div -->
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
        @select="handleFunctionSelect"
        background-color="transparent"
        text-color="#333"
        active-text-color="#409EFF"
      >
        <el-menu-item v-for="func in functions" :key="func.id" :index="func.id" class="menu-item">
          <el-icon :class="func.iconClass">
            <component :is="func.icon" />
          </el-icon>
          <span>{{ func.name }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div> <!-- 闭合 div -->
</template>

<script setup>
import { Bell, Upload } from '@element-plus/icons-vue'

defineProps({
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

const handleFunctionSelect = (key) => {
  emit('select', key)
}
</script>

<style scoped>
.sidebar {
  background: #F0F2F5; /* 侧边栏背景色 */
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.05); /* 调整阴影，使其更柔和 */
  border-right: 1px solid #e0e0e0; /* 调整边框颜色，使其与浅色背景协调 */
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e0e0e0; /* 调整边框颜色 */
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.agent-details h3 {
  margin: 0 0 4px 0;
  color: #333; /* 调整为深色，在浅色背景上更清晰 */
  font-size: 16px;
  font-weight: 600;
}

.agent-status {
  color: #10b981;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.agent-status::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  display: inline-block;
}

.functions-section {
  padding: 20px 0;
}

.section-title {
  padding: 0 20px 12px;
  color: #666; /* 调整为较深的灰色，在浅色背景上更清晰 */
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.menu-item:hover {
  background: rgba(96, 165, 250, 0.1) !important;
  transform: translateX(4px);
}

.workflow-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
