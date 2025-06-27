<template>
  <div class="chat-input-area">
    <el-input
      v-model="userInput"
      type="textarea"
      :rows="2"
      placeholder="输入消息..."
      @keyup.enter="handleSendMessageWrapper"
      clearable
      resize="none"
      class="chat-input"
    >
      
    </el-input>
    <el-button type="primary" @click="handleSendMessageWrapper">发送</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia'; /* 导入 storeToRefs */
import { useChatStore } from '@/stores/chat';
import { useWorkflowStore } from '@/stores/workflow';

const chatStore = useChatStore();
const workflowStore = useWorkflowStore();

/* 使用 storeToRefs 解构 state 中的响应式数据以保持响应性 */
const { userInput } = storeToRefs(chatStore);
const { activeFunction } = storeToRefs(workflowStore);

/* 直接从 store 实例中获取 actions */
const { handleSendMessage, addMessage } = chatStore;

const handleSendMessageWrapper = () => {
  // 这里的 '7514898709852733475' 和 handleFunctionSelect 是 HomeView.vue 中硬编码的，
  // 应该从 workflowStore 或通过 props 传递
  // 暂时保持与 HomeView.vue 现有逻辑一致，后续考虑优化
  handleSendMessage(userInput.value, '7514898709852733475', workflowStore.handleFunctionSelect);
};
</script>

<style scoped>
.chat-input-area {
  width: 100%;
  max-width: 800px;
  max-height: 168px;
  padding: 12px 16px;
  background-color: #ffffff;
  box-sizing: border-box;
  margin: 0 auto;
  display: flex; /* 确保父容器是flex布局 */
  align-items: center; /* 垂直居中对齐 */
}

.chat-input {
  flex: 1;
}

:deep(.el-textarea__inner) {
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 16px !important;
  resize: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  transition: all 0.2s ease;
  min-height: 56px !important;
}

:deep(.el-textarea__inner):focus {
  border-color: #10a37f;
  box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.2);
}

:deep(.el-input-group__append) {
  display: flex; /* 确保append部分是flex布局 */
  align-items: center; /* 垂直居中对齐 */
  padding: 0 12px; /* 调整内边距 */
  background-color: transparent; /* 确保背景透明 */
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
}

.el-button {
  margin-left: 12px;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  background-color: #10a37f;
  border-color: #10a37f;
  color: white;
  transition: all 0.2s ease;
}

.el-button:hover {
  background-color: #0d8e6f;
  border-color: #0d8e6f;
}

.el-button:active {
  background-color: #0b7a5f;
  border-color: #0b7a5f;
}
</style>
