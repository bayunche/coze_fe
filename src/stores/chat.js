import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import CozeChatService from '@/services/CozeChatService' // 假设已拆分的服务

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
 * @property {MessageFrom} from - 消息来源 ('user', 'agent', 'system')
 * @property {string} content - 消息内容
 * @property {string} timestamp - 消息时间戳
 * @property {string} sender - 发送者名称
 * @property {WorkflowInfo | null} workflow - 工作流信息
 * @property {Object | null} details - 消息详情
 * @property {boolean} [isStreaming] - 是否正在流式传输 (仅限 agent 消息)
 * @property {boolean} [actionTriggered] - 是否已触发动作 (仅限 agent 消息)
 */

export const useChatStore = defineStore('chat', () => {
  /** @type {import('vue').Ref<string>} */
  const userInput = ref('')
  /** @type {import('vue').Reactive<ChatMessage[]>} */
  const displayedMessages = reactive([])

  const cozeChatService = new CozeChatService() // 实例化服务

  /**
   * 添加消息到队列并处理显示
   * @param {string | ChatMessage} content - 消息内容或完整的消息对象
   * @param {MessageFrom} [from] - 消息来源 ('user', 'agent', 'system')
   * @param {WorkflowInfo | null} [workflowInfo=null] - 工作流信息
   * @param {Object | null} [details=null] - 消息详情
   * @param {MessageOptions} [options={}] - 额外选项
   */
  const addMessage = (content, from, workflowInfo = null, details = null, options = {}) => {
    let messageToUpdate = null

    // 如果 content 是一个对象且包含 id，尝试查找并更新现有消息
    if (typeof content === 'object' && content !== null && content.id) {
      messageToUpdate = displayedMessages.find((msg) => msg.id === content.id)
    }

    if (messageToUpdate) {
      // 更新现有消息的属性
      Object.assign(messageToUpdate, content)
    } else {
      // 创建新消息
      /** @type {ChatMessage} */
      const newMessage =
        typeof content === 'object' && content !== null
          ? content
          : {
              id: Date.now() + Math.random(),
              from, // 'user', 'agent', 'system'
              content,
              timestamp: new Date().toLocaleTimeString(),
              sender: from === 'agent' ? (workflowInfo ? workflowInfo.name : '智能体') : '系统',
              workflow: workflowInfo,
              details,
              ...options
            }
      displayedMessages.push(newMessage)
      if (displayedMessages.length > 500) {
        displayedMessages.shift()
      }
    }
  }

  /**
   * 处理用户发送消息
   * @param {string} query - 用户输入的消息内容
   * @param {string} workflowId - 工作流ID
   * @param {function(string): void} handleFunctionSelectCallback - 触发功能选择的回调函数
   */
  const handleSendMessage = async (query, workflowId, handleFunctionSelectCallback) => {
    // 添加 workflowId 参数
    if (!query.trim()) return

    const userMessageContent = query
    userInput.value = ''

    addMessage(userMessageContent, 'user')

    /** @type {ChatMessage} */
    const agentMessage = reactive({
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: '智能体',
      workflow: null,
      details: null,
      isStreaming: true,
      actionTriggered: false
    })

    addMessage(agentMessage) // 首次添加 agentMessage

    try {
      await cozeChatService.runChat({ query: userMessageContent }, workflowId, {
        // 使用传入的 workflowId
        onMessage(message) {
          const { event, data } = message
          if (event === 'conversation.message.delta' && data.type === 'answer') {
            agentMessage.content += data.content
            addMessage(agentMessage) // 更新消息内容
            // 触发功能选择的逻辑，需要从外部传入回调
            if (!agentMessage.actionTriggered) {
              if (agentMessage.content.includes('解析合同')) {
                handleFunctionSelectCallback('contractParsing')
                agentMessage.actionTriggered = true
                // addMessage('正在调用合同解析功能...', 'system'); // 添加系统消息
              } else if (agentMessage.content.includes('正在调用解析乙供物资功能')) {
                handleFunctionSelectCallback('supplierMaterialParsing')
                agentMessage.actionTriggered = true
                // addMessage('正在调用乙供物资解析功能...', 'system'); // 添加系统消息
              } else if (agentMessage.content.includes('正在调用甲供物资解析功能')) {
                handleFunctionSelectCallback('ownerSuppliedMaterialParsing')
                agentMessage.actionTriggered = true
                // addMessage('正在调用甲供物资解析功能...', 'system'); // 添加系统消息
              }
            }
          } else if (event === 'done') {
            agentMessage.isStreaming = false
            addMessage(agentMessage) // 标记为非流式
          }
        },
        onError(error) {
          agentMessage.content = `对话出错: ${error.message}`
          agentMessage.isStreaming = false
          addMessage(agentMessage) // 更新错误消息
        }
      })
    } catch (error) {
      agentMessage.content = `发送消息失败: ${error.message}`
      agentMessage.isStreaming = false // 确保在 catch 块中也设置 isStreaming 为 false
      addMessage(agentMessage) // 更新失败消息
    }
  }

  /**
   * 初始化默认欢迎消息
   */
  const initDefaultMessage = () => {
    addMessage(
      ` 欢迎使用「五模二算」智能体服务！
 
 当前可用功能：
  1.合同解析智能体
  2.乙供物资解析智能体
  3.甲供物资解析智能体
 
 您可直接输入以下指令调用功能：
  1.我想解析合同
  2.我想解析乙供物资
  3.我想解析甲供物资
 
 如需更多支持，请持续关注后续功能更新。`,
      'agent',
      { name: '智能体' }
    )
  }

  /**
   * 清空所有消息并重新初始化默认消息
   */
  const resetAndInitMessages = () => {
    displayedMessages.splice(0) // 清空所有消息
    initDefaultMessage() // 添加初始消息
  }

  // 初始加载时，如果消息为空，则添加默认消息
  if (displayedMessages.length === 0) {
    initDefaultMessage()
  }

  return {
    userInput,
    displayedMessages,
    addMessage,
    handleSendMessage,
    resetAndInitMessages // 暴露新方法
  }
})
