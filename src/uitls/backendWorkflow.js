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

      const lines = buffer.split('\n')
      buffer = lines.pop() // Keep the last incomplete line in the buffer

      let currentMessage = {} // To store id, event, data for a single message

      for (const line of lines) {
        if (line.trim() === '') {
          // An empty line indicates the end of a message
          if (currentMessage.data) {
            try {
              const parsedData = JSON.parse(currentMessage.data)
              if (onMessage && typeof onMessage === 'function') {
                if (parsedData && parsedData.length > 0) {
                  onMessage(parsedData[0]) // Pass the first element of the array
                }
              }
            } catch (e) {
              console.error('解析流式数据失败:', e, currentMessage.data)
              if (onError && typeof onError === 'function') {
                onError(e)
              }
            }
          }
          currentMessage = {} // Reset for the next message
          continue
        }

        if (line.startsWith('id:')) {
          currentMessage.id = line.substring(3).trim()
        } else if (line.startsWith('event:')) {
          currentMessage.event = line.substring(6).trim()
        } else if (line.startsWith('data:')) {
          const dataContent = line.substring(5).trim()
          if (dataContent === '[DONE]') {
            if (onComplete && typeof onComplete === 'function') {
              onComplete()
            }
            break // End the stream processing
          }
          currentMessage.data = dataContent
        } else {
          console.warn('收到非标准流式数据行:', line)
        }
      }

      // Process any remaining data in the buffer if it forms a complete message
      if (buffer.trim() !== '') {
        const remainingLines = buffer.split('\n')
        buffer = remainingLines.pop() // Update buffer with any truly incomplete part

        for (const line of remainingLines) {
          if (line.trim() === '') {
            if (currentMessage.data) {
              try {
                const parsedData = JSON.parse(currentMessage.data)
                if (onMessage && typeof onMessage === 'function') {
                  if (parsedData && parsedData.length > 0) {
                    onMessage(parsedData[0])
                  }
                }
              } catch (e) {
                console.error('解析剩余流式数据失败:', e, currentMessage.data)
                if (onError && typeof onError === 'function') {
                  onError(e)
                }
              }
            }
            currentMessage = {}
            continue
          }

          if (line.startsWith('id:')) {
            currentMessage.id = line.substring(3).trim()
          } else if (line.startsWith('event:')) {
            currentMessage.event = line.substring(6).trim()
          } else if (line.startsWith('data:')) {
            const dataContent = line.substring(5).trim()
            if (dataContent === '[DONE]') {
              if (onComplete && typeof onComplete === 'function') {
                onComplete()
              }
              break
            }
            currentMessage.data = dataContent
          } else {
            console.warn('处理剩余非标准流式数据行:', line)
          }
        }
      }

      // If there's a pending message at the very end of the stream (after done or error)
      if (currentMessage.data) {
        try {
          const parsedData = JSON.parse(currentMessage.data)
          if (onMessage && typeof onMessage === 'function') {
            if (parsedData && parsedData.length > 0) {
              onMessage(parsedData[0])
            }
          }
        } catch (e) {
          console.error('解析流式数据失败 (流结束前):', e, currentMessage.data)
          if (onError && typeof onError === 'function') {
            onError(e)
          }
        }
      }

      if (onComplete && typeof onComplete === 'function') {
        onComplete()
      }
    }
  } catch (error) {
    console.error('调用流式工作流失败:', error)
    ElMessage.error(error.message || '调用流式工作流失败')
    if (onError && typeof onError === 'function') {
      onError(error)
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
