import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { chatGenerate } from '@/utils/dify.js'

export const useChatStore = defineStore(
  'chat',
  () => {
    const userInput = ref('')

    /** @type {import('vue').Ref<ChatMessage[]>} */
    const displayedMessages = ref([])

    function addMessage(content, from, workflowInfo = null, details = null, options = {}) {
      let msg = null
      if (typeof content === 'object' && content !== null && content.id) {
        msg = displayedMessages.value.find((m) => m.id === content.id)
      }
      if (msg) {
        Object.assign(msg, content)
      } else {
        const newMsg =
          typeof content === 'object'
            ? content
            : {
                id: Date.now() + Math.random(),
                from,
                content,
                timestamp: new Date().toLocaleTimeString(),
                sender:
                  from === 'agent'
                    ? workflowInfo?.name || '智能体'
                    : from === 'user'
                    ? 'You'
                    : '系统',
                workflow: workflowInfo,
                details,
                ...options
              }
        displayedMessages.value.push(newMsg)
        if (displayedMessages.value.length > 500) displayedMessages.value.shift()
      }
    }

    async function sendMessage(query, workflowId, onFunctionSelect) {
      if (!query.trim()) return
      const userMsg = query
      userInput.value = ''
      addMessage(userMsg, 'user')

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
      addMessage(agentMessage)

      try {
        await chatGenerate(
          { userQuery: userMsg }, // 使用 userQuery 作为参数名
          '100', // agentManagementId 固定为 100
          {
            // onMessage 回调 - 处理流式消息
            onMessage: (messageData) => {
              if (messageData.content) {
                agentMessage.content += messageData.content
                addMessage(agentMessage)

                // 检查智能体触发（优先于关键词匹配）
                if (!agentMessage.actionTriggered && messageData.agentResult) {
                  const { functionType, error } = messageData.agentResult

                  if (functionType) {
                    // 找到匹配的智能体，触发对应功能
                    console.log('【智能体触发】功能类型:', functionType)
                    onFunctionSelect(functionType)
                    agentMessage.actionTriggered = true
                  } else if (error) {
                    // 处理智能体匹配失败的情况
                    console.log('【智能体匹配失败】', error)
                    agentMessage.content += `\n\n💡 ${error.message}`
                    if (error.suggestion) {
                      agentMessage.content += `\n${error.suggestion}`
                    }
                    if (error.availableTypes) {
                      agentMessage.content += `\n\n可用的功能类型：${error.availableTypes.join(
                        '、'
                      )}`
                    }
                    agentMessage.actionTriggered = true // 防止重复处理
                  }
                }

                // 保留原有的关键词匹配作为备用方案（当智能体解析失败时）
                if (!agentMessage.actionTriggered) {
                  if (agentMessage.content.includes('解析合同')) {
                    onFunctionSelect('contractParsing')
                    agentMessage.actionTriggered = true
                  } else if (agentMessage.content.includes('解析乙供物资功能')) {
                    onFunctionSelect('supplierMaterialParsing')
                    agentMessage.actionTriggered = true
                  } else if (agentMessage.content.includes('解析甲供物资功能')) {
                    onFunctionSelect('ownerSuppliedMaterialParsing')
                    agentMessage.actionTriggered = true
                  }
                }
              }
            },
            // onComplete 回调 - 处理对话结束
            onComplete: () => {
              agentMessage.isStreaming = false
              addMessage(agentMessage)
            },
            // onError 回调 - 处理错误
            onError: (error) => {
              console.error('聊天对话出错:', error)
              agentMessage.content = `对话出错: ${error.message || error}`
              agentMessage.isStreaming = false
              addMessage(agentMessage)
            }
          }
        )
      } catch (err) {
        console.error('发送消息失败:', err)
        agentMessage.content = `发送消息失败: ${err.message}`
        agentMessage.isStreaming = false
        addMessage(agentMessage)
      }
    }

    function initDefaultMessage() {
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

    function resetAndInitMessages() {
      displayedMessages.value = []
      initDefaultMessage()
    }

    function appendStreamContent(messageId, chunk) {
      const msg = displayedMessages.value.find((m) => m.id === messageId)
      if (msg) {
        msg.content += chunk
      }
    }

    /**
     * 更新消息的属性，确保响应式更新
     * @param {string|number} messageId - 消息ID
     * @param {object} updates - 要更新的属性对象
     */
    function updateMessageProperties(messageId, updates) {
      const msg = displayedMessages.value.find((m) => m.id === messageId)
      if (msg) {
        Object.assign(msg, updates)
      }
    }

    return {
      userInput,
      displayedMessages,
      addMessage,
      sendMessage,
      initDefaultMessage,
      resetAndInitMessages,
      appendStreamContent, // 暴露流式内容追加方法
      updateMessageProperties // 暴露消息属性更新方法
    }
  },
  {
    persist: {
      key: 'chat-messages',
      storage: sessionStorage,
      paths: ['displayedMessages'],
      beforeHydrate() {
        const raw = sessionStorage.getItem('chat-messages')
        if (raw === '[]') sessionStorage.removeItem('chat-messages')
      },
      afterHydrate(context) {
        if (context.store.displayedMessages.length === 0) {
          context.store.initDefaultMessage()
        }
      }
    }
  }
)
