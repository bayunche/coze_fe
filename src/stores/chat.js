import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import CozeChatService from '@/services/CozeChatService'

export const useChatStore = defineStore(
  'chat',
  () => {
    const userInput = ref('')

    /** @type {import('vue').Ref<ChatMessage[]>} */
    const displayedMessages = ref([])

    const cozeChatService = new CozeChatService()

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
        await cozeChatService.runChat({ query: userMsg }, workflowId, {
          onMessage(msg) {
            const { event, data } = msg
            if (event === 'conversation.message.delta' && data.type === 'answer') {
              agentMessage.content += data.content
              addMessage(agentMessage)
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
            } else if (event === 'done') {
              agentMessage.isStreaming = false
              addMessage(agentMessage)
            }
          },
          onError(error) {
            agentMessage.content = `对话出错: ${error.message}`
            agentMessage.isStreaming = false
            addMessage(agentMessage)
          }
        })
      } catch (err) {
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

    return {
      userInput,
      displayedMessages,
      addMessage,
      sendMessage,
      initDefaultMessage,
      resetAndInitMessages,
      appendStreamContent // 暴露新方法
    }
  },
  {
    persist: {
      key: 'chat-messages',
      storage: sessionStorage,
      paths: ['displayedMessages'],
      beforeHydrate(ctx) {
        const raw = sessionStorage.getItem('chat-messages')
        if (raw === '[]') sessionStorage.removeItem('chat-messages')
      },
      afterHydrate(ctx) {
        if (ctx.store.displayedMessages.length === 0) {
          ctx.store.initDefaultMessage()
        }
      }
    }
  }
)
