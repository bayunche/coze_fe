<template>
  <div :class="LAYOUT_CLASSES.AGENT_DASHBOARD">
    <!-- 主内容区 -->
    <el-container :class="LAYOUT_CLASSES.MAIN_CONTAINER">
      <!-- 侧边栏 -->
      <el-aside 
        :width="getSidebarWidth(isSidebarOpen)" 
        :class="LAYOUT_CLASSES.SIDEBAR_ASIDE"
      >
        <SidebarNav
          :functions="functions"
          :active-function="activeFunction"
          @select="customFunctionSelectHandler"
        />
      </el-aside>
      
      <el-container :class="LAYOUT_CLASSES.RIGHT_PANEL">
        <div :class="LAYOUT_CLASSES.CHAT_CONTAINER">
          <div :class="LAYOUT_CLASSES.MESSAGES_WRAPPER">
            <slot name="content" />
          </div>
          <div :class="LAYOUT_CLASSES.INPUT_AREA_WRAPPER">
            <ChatInputArea />
          </div>
        </div>
      </el-container>
    </el-container>

    <!-- 侧边栏展开按钮 -->
    <el-button
      :class="LAYOUT_CLASSES.TOGGLE_BUTTON"
      type="primary"
      :icon="isSidebarOpen ? ArrowLeft : ArrowRight"
      circle
      @click="toggleSidebarHandler"
      :style="{ left: getToggleButtonPosition(isSidebarOpen) }"
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
import SidebarNav from '@/components/home/SidebarNav'
import ChatInputArea from '@/components/home/ChatInputArea'

// 导入常量和工具函数
import { 
  LAYOUT_CLASSES, 
  ANIMATION_CONFIG, 
  LAYOUT_CONFIG, 
  SPACING, 
  Z_INDEX 
} from './constants.js'
import {
  getSidebarWidth,
  getToggleButtonPosition,
  createToggleSidebar,
  createCustomFunctionSelectHandler
} from './utils.js'

// Stores
const workflowStore = useWorkflowStore()
const chatStore = useChatStore()
const router = useRouter()

// 从 Store 中解构状态和方法
const { isSidebarOpen, activeFunction } = storeToRefs(workflowStore)
const { selectFunction } = workflowStore
const { addMessage } = chatStore

// 创建处理函数
const toggleSidebarHandler = createToggleSidebar(isSidebarOpen)
const customFunctionSelectHandler = createCustomFunctionSelectHandler(
  router, 
  selectFunction, 
  addMessage
)
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