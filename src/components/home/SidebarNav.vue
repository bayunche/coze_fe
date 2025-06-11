<template>
  <el-aside width="280px" class="sidebar">
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
        text-color="#d1d5db"
        active-text-color="#60a5fa"
      >
        <el-menu-item v-for="func in functions" :key="func.id" :index="func.id" class="menu-item">
          <el-icon :class="func.iconClass">
            <component :is="func.icon" />
          </el-icon>
          <span>{{ func.name }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </el-aside>
</template>

<script setup>
import { Bell } from '@element-plus/icons-vue'

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
  background: rgba(31, 41, 55, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #f9fafb;
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
  color: #9ca3af;
  font-size: 12px;
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
