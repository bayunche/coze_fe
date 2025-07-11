// src/uitls/backendWorkflow.js
// 用于请求后端自建的工作流调用与模拟对话流程的工具函数

// 导入必要的模块和工具函数
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_APP_BACKEND_WORKFLOW_API
    : '/backend-api'

/**
 * 调用流式工作流接口
 * @param {object} inputs - 输入对象，例如：{"input":"ccb是什么意思？"}
 * @param {string} agentManagementId - 代理管理ID，例如："1"
 * @param {function} onMessage - 处理流式消息的回调函数，接收解析后的数据块
 * @param {function} onError - 处理错误的回调函数，接收错误对象
 * @param {function} onComplete - 流式传输完成时的回调函数
 */
export async function callStreamWorkflow(
  inputs,
  agentManagementId,
  callbacks // 包含 onMessage, onError, onComplete 的对象
) {
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

    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += value

      // 处理所有完整的消息块
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
    console.error('调用流式工作流失败:', error)
    ElMessage.error(error.message || '调用流式工作流失败')
    if (onError && typeof onError === 'function') {
      onError(error)
    }
  }
}
// 处理单个消息块的辅助函数
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
            if (parsedData && parsedData.length > 0) {
              onMessage(parsedData[0]) // 传递数组的第一个元素
            }
          }
          break

        case 'Error':
          if (onError && typeof onError === 'function') {
            const parsedData = JSON.parse(message.data)
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
      console.error('解析流式数据失败:', e, message.data)
      if (onError && typeof onError === 'function') {
        onError(e)
      }
    }
  }
}
/**
 * 调用非流式工作流接口
 * @param {object} inputs - 输入对象，例如：{"input":"ccb是什么意思？"}
 * @param {string} agentManagementId - 代理管理ID，例如："1"
 * @returns {Promise<object>} - 后端返回的数据
 */
export async function callNonStreamWorkflow(inputs, agentManagementId) {
  try {
    const response = await request({
      url: `${BASE_URL}/v1/chat/generate`,
      method: 'post',
      data: {
        stream: false,
        agentManagementId: agentManagementId,
        inputs: inputs
      }
    })
    return response
  } catch (error) {
    console.error('调用非流式工作流失败:', error)
    ElMessage.error(error.message || '调用非流式工作流失败')
    throw error // 抛出错误以便调用方处理
  }
}
