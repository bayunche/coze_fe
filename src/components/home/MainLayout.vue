<template>
  <div class="agent-dashboard">
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside :width="isSidebarOpen ? '280px' : '0px'" class="sidebar-aside">
        <SidebarNav
          :functions="functions"
          :active-function="activeFunction"
          @select="(key) => handleCustomFunctionSelect(key)"
        />
      </el-aside>
      
      <el-container class="right-panel">
        <div class="chat-container">
          <div class="messages-wrapper">
            <slot name="content" />
          </div>
          <div class="input-area-wrapper">
            <ChatInputArea />
          </div>
        </div>
      </el-container>
    </el-container>

    <!-- 侧边栏展开按钮 -->
    <el-button
      class="toggle-sidebar-button"
      type="primary"
      :icon="isSidebarOpen ? ArrowLeft : ArrowRight"
      circle
      @click="toggleSidebar"
      :style="{ left: isSidebarOpen ? '290px' : '20px' }"
    />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { useWorkflowStore } from '@/stores/workflow'
import { useChatStore } from '@/stores/chat'
import { functions } from '@/utils/workflowsDefinedEnum.js'
import SidebarNav from '@/components/home/SidebarNav.vue'
import ChatInputArea from '@/components/home/ChatInputArea.vue'

// Stores
const workflowStore = useWorkflowStore()
const chatStore = useChatStore()
const router = useRouter()

// 从 Store 中解构状态和方法
const { isSidebarOpen, activeFunction } = storeToRefs(workflowStore)
const { handleFunctionSelect } = workflowStore
const { addMessage } = chatStore

// 自定义函数选择处理逻辑
const handleCustomFunctionSelect = (key) => {
  if (key === 'smartBrain') {
    // 跳转到智能大脑页面
    router.push('/smart-brain')
  } else {
    // 其他功能保持原有逻辑
    handleFunctionSelect(key, addMessage)
  }
}

// 侧边栏切换逻辑
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<style scoped>
.agent-dashboard {
  display: flex;
  height: 100vh;
  background: var(--theme-bg-primary);
  transition: all 0.3s ease;
}

.main-container {
  flex: 1;
  display: flex;
  background: var(--theme-bg-primary);
  font-size: 14px;
}

.sidebar-aside {
  transition: width 0.3s ease;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  min-width: 72rem;
  max-width: 100%;
  margin: 0 auto;
  background: var(--theme-bg-primary);
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  box-sizing: border-box;
}

.input-area-wrapper {
  position: sticky;
  bottom: 1.5rem;
  width: 100%;
  padding: 16px 0;
  background: var(--theme-bg-primary);
}

.toggle-sidebar-button {
  position: fixed;
  bottom: 20px;
  transition: left 0.3s ease;
  z-index: 1000;
  box-shadow: var(--theme-shadow-lg);
}

:deep(.el-input__inner) {
  border-radius: 32px !important;
  padding: 12px 20px !important;
  font-size: 16px !important;
  resize: none !important;
}

:deep(.el-input__inner textarea) {
  padding: 8px 20px !important;
}

:deep(.el-button) {
  margin-left: 12px;
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-aside) {
  background-color: var(--theme-bg-tertiary);
  box-shadow: var(--theme-shadow-md);
  padding: 20px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .right-panel {
    min-width: auto;
  }
  
  .input-area-wrapper {
    padding: 10px;
  }
}
</style>