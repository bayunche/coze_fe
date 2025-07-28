<template>
  <div class="chat-input-area">
    <div class="input-area">
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
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia' /* 导入 storeToRefs */
import { useChatStore } from '@/stores/chat'
import { useWorkflowStore } from '@/stores/workflow'

const chatStore = useChatStore()
const workflowStore = useWorkflowStore()

/* 使用 storeToRefs 解构 state 中的响应式数据以保持响应性 */
const { userInput } = storeToRefs(chatStore)
const { activeFunction } = storeToRefs(workflowStore)

/* 直接从 store 实例中获取 actions */
const { handleSendMessage, addMessage } = chatStore

const handleSendMessageWrapper = () => {
  // 这里的 '7514898709852733475' 和 handleFunctionSelect 是 HomeView.vue 中硬编码的，
  // 应该从 workflowStore 或通过 props 传递
  // 暂时保持与 HomeView.vue 现有逻辑一致，后续考虑优化
  handleSendMessage(userInput.value, '7514898709852733475', workflowStore.handleFunctionSelect)
}
</script>

<style scoped>
.chat-input-area {
  width: 100%;
  max-height: 168px;
  background-color: var(--theme-bg-primary);
  box-sizing: border-box;
  margin: 0 auto;
  display: flex; /* 确保父容器是flex布局 */
  align-items: center; /* 垂直居中对齐 */

  border-radius: 12px;

  /* 引入响应式居中布局逻辑，与 message-container 保持一致 */
  --max-width-layout-container-width: 100vw;
  --max-width-layout-large-padding: 24px;
  --max-width-layout-small-padding: 16px;
  --center-content-max-width: 1200px; /* 与 message-container 保持一致 */

  --left-side-width: 0px;
  --right-side-width: 0px;

  --width: calc(
    var(--max-width-layout-container-width) - var(--left-side-width) - var(--right-side-width)
  );
  /* chat-input-area 的最大宽度比 message-container 的中心内容宽度小 200px */
  --chat-input-area-content-max-width: calc(var(--center-content-max-width) - 200px);
  --center-content: min(var(--width), var(--chat-input-area-content-max-width));

  --total-side: calc(
    var(--max-width-layout-container-width) - var(--center-content) - var(--left-side-width) -
      var(--right-side-width)
  );
  --left-side: calc(var(--total-side) / 2);
  --content-left: calc(var(--left-side) + var(--left-side-width));

  --padding: clamp(
    var(--max-width-layout-small-padding),
    calc(50vw - 500px - var(--left-side-width) / 2 - var(--right-side-width) / 2),
    var(--max-width-layout-large-padding)
  );

  padding-left: calc(var(--content-left) + var(--padding));
  padding-right: calc(
    var(--left-side) + var(--padding) + var(--right-side-width) - var(--scrollbar-width, 0px)
  );
}

.input-area {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  box-shadow: var(--theme-shadow-md);
  border-radius: 12px;
  background-color: var(--theme-bg-card);
  border: 1px solid var(--theme-border-primary);
}
.chat-input {
  flex: 1;
  background-color: transparent;
}

:deep(.el-textarea__inner) {
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 16px !important;
  resize: none !important;
  box-shadow: none !important;
  background-color: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-border-secondary) !important;
  transition: all 0.2s ease;
  min-height: 56px !important;
}

:deep(.el-textarea__inner):focus {
  border-color: var(--theme-primary) !important;
  box-shadow: 0 0 0 2px rgba(var(--theme-primary), 0.2) !important;
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
  background-color: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
  transition: all 0.2s ease;
}

.el-button:hover {
  background-color: var(--theme-primary-light);
  border-color: var(--theme-primary-light);
}

.el-button:active {
  background-color: var(--theme-primary-dark);
  border-color: var(--theme-primary-dark);
}
</style>
