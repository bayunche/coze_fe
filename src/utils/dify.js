// src/utils/dify.js
import { ElMessage } from 'element-plus'
import { processAgentResponse } from '@/constants/agentMapping.js'

// 根据环境配置BASE_URL
const BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_APP_BACKEND_WORKFLOW_API
    : 'http://localhost:1202'

/**
 * 调用聊天生成接口，支持流式响应（兼容 backendWorkflow 的调用模式）
 * @param {object} inputs - 输入对象，例如：{"input":"你好"}
 * @param {string} agentManagementId - 代理管理ID
 * @param {object} callbacks - 回调函数对象 { onMessage, onError, onComplete }
 * @returns {Promise<void>} - 无返回值，通过回调函数处理结果。
 */
export async function chatGenerate(inputs, agentManagementId, callbacks) {
  const { onMessage, onError, onComplete } = callbacks || {}

  try {
    const response = await fetch(`${BASE_URL}/v1/chat/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stream: true,
        agentManagementId: agentManagementId,
        inputs: inputs
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '网络请求失败')
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += value

      // 处理所有完整的消息块（兼容 backendWorkflow 的处理方式）
      while (buffer.includes('\n\n')) {
        const messageEndIndex = buffer.indexOf('\n\n')
        const messageBlock = buffer.substring(0, messageEndIndex)
        buffer = buffer.substring(messageEndIndex + 2) // 移除已处理的消息块

        // 处理单个消息块
        await processMessageBlock(messageBlock, { onMessage, onError, onComplete })
      }
    }

    // 处理最后剩余的消息块（如果有的话）
    if (buffer.trim()) {
      await processMessageBlock(buffer.trim(), { onMessage, onError, onComplete })
    }
  } catch (error) {
    console.error('调用聊天流式工作流失败:', error)
    ElMessage.error(error.message || '调用聊天流式工作流失败')
    if (onError && typeof onError === 'function') {
      onError(error)
    }
  }
}

// 处理单个消息块的辅助函数（参考 backendWorkflow.js 的实现）
async function processMessageBlock(messageBlock, { onMessage, onError, onComplete }) {
  if (!messageBlock.trim()) return

  const lines = messageBlock.split('\n')
  const message = {}

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    if (trimmedLine.startsWith('id:')) {
      message.id = trimmedLine.substring(3).trim()
    } else if (trimmedLine.startsWith('event:')) {
      message.event = trimmedLine.substring(6).trim()
    } else if (trimmedLine.startsWith('data:')) {
      const dataContent = trimmedLine.substring(5).trim()
      message.data = dataContent
    } else {
      console.warn('收到非标准流式数据行:', trimmedLine)
    }
  }

  // 处理消息
  if (message.event && message.data) {
    try {
      // 根据事件类型调用相应的回调函数
      switch (message.event) {
        case 'Message':
          if (onMessage && typeof onMessage === 'function') {
            const parsedData = JSON.parse(message.data)
            console.log('【聊天对话】接收到Message消息:', parsedData)
            
            // 处理新的后端格式：直接是一个对象，不再是数组
            if (parsedData && typeof parsedData === 'object') {
              // 检查新格式：直接包含 content 等字段
              if (parsedData.content) {
                // 尝试解析智能体响应
                const agentResult = processAgentResponse(parsedData.content)
                
                const processedMessage = {
                  content: parsedData.content,
                  taskId: parsedData.taskId || null,
                  taskInfo: parsedData.taskInfo || null,
                  // 添加智能体解析结果
                  agentResult: agentResult
                }
                console.log('【聊天对话】处理后的消息:', processedMessage)
                console.log('【智能体解析】结果:', agentResult)
                onMessage(processedMessage)
              } else if (Array.isArray(parsedData) && parsedData.length > 0) {
                // 兼容旧格式：数组格式
                const messageData = parsedData[0]
                if (messageData.content) {
                  onMessage({ content: messageData.content })
                } else {
                  onMessage(messageData)
                }
              } else {
                // 其他格式，直接传递
                onMessage(parsedData)
              }
            }
          }
          break

        case 'Error':
          if (onError && typeof onError === 'function') {
            const parsedData = JSON.parse(message.data)
            console.error('聊天对话执行错误:', parsedData)
            onError(parsedData)
          }
          break

        case 'Done':
          if (onComplete && typeof onComplete === 'function') {
            // Done 事件通常 data 为 "Done"，不需要解析
            onComplete()
          }
          break

        default:
          console.warn('收到未知事件类型:', message.event)
      }
    } catch (e) {
      console.error('解析聊天流式数据失败:', e, message.data)
      if (onError && typeof onError === 'function') {
        onError(e)
      }
    }
  }
}
