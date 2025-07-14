import { defineStore } from 'pinia'
import CozeChatService from '@/services/CozeChatService'

/**
 * @typedef {'user' | 'agent' | 'system'} MessageFrom
 */

/**
 * @typedef {Object} WorkflowInfo
 * @property {string} name - 工作流名称
 * @property {string} [id] - 工作流ID
 */

/**
 * @typedef {Object} MessageOptions
 * @property {boolean} [isStreaming] - 是否正在流式传输
 * @property {boolean} [actionTriggered] - 是否已触发动作
 */

/**
 * @typedef {Object} ChatMessage
 * @property {number} id - 消息ID
 * @property {MessageFrom} from - 消息来源
 * @property {string} content - 消息内容
 * @property {string} timestamp - 消息时间戳
 * @property {string} sender - 发送者名称
 * @property {WorkflowInfo | null} workflow - 工作流信息
 * @property {Object | null} details - 消息详情
 * @property {boolean} [isStreaming] - 是否正在流式传输
 * @property {boolean} [actionTriggered] - 是否已触发动作
 */

export const useChatStore = defineStore('chat', {
  persist: {
    key: 'chat-messages',
    storage: sessionStorage,
    paths: ['displayedMessages']
  },

  state: () => ({
    userInput: '',
    displayedMessages: [],
    cozeChatService: new CozeChatService()
  }),

  actions: {
    addMessage(content, from, workflowInfo = null, details = null, options = {}) {
      const message = {
        id: Date.now(),
        from,
        content,
        timestamp: new Date().toISOString(),
        sender: from === 'user' ? 'You' : 'Assistant',
        workflow: workflowInfo,
        details,
        ...options
      }
      this.displayedMessages.push(message)
    },

    async handleSendMessage(query, workflowId, handleFunctionSelectCallback) {
      // 原有实现保持不变
    },

    initDefaultMessage() {
      // 原有实现保持不变
    },

    resetAndInitMessages() {
      this.displayedMessages = []
      this.initDefaultMessage()
    }
  }
})
