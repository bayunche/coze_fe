// src/uitls/dify.js
import { request } from '@/utils/request'
import { ElMessage } from 'element-plus'

const BASE_URL = 'http://localhost:1202' // 根据实际情况调整Dify服务的BASE_URL

/**
 * 调用 Dify 的聊天生成接口，支持流式响应。
 * @param {object} data - 请求体数据。
 * @param {string} data.agentManagementId - 代理管理ID。
 * @param {object} data.inputs - 输入参数。
 * @param {string} data.prompt - 用户提示。
 * @param {string} data.user - 用户ID。
 * @param {function(object): void} onMessage - 接收到消息时的回调函数，参数为解析后的消息对象。
 *   消息对象结构示例: { "content":"文档", "finish_reason":null, "index":0, "taskId":"...", "messageId":"...", "event": "message" }
 * @param {function(): void} onEnd - 接收到完成消息时的回调函数。
 * @param {function(Error): void} onError - 发生错误时的回调函数。
 * @returns {Promise<void>} - 无返回值，通过回调函数处理结果。
 */
export async function chatGenerate(data, onMessage, onEnd, onError) {
  try {
    const response = await fetch(`${BASE_URL}/v1/chat/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stream: true,
        agentManagementId: data.agentManagementId,
        inputs: data.inputs,
        prompt: data.prompt,
        user: data.user
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
            if (onEnd && typeof onEnd === 'function') {
              onEnd()
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
              if (onEnd && typeof onEnd === 'function') {
                onEnd()
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

      if (onEnd && typeof onEnd === 'function') {
        onEnd()
      }
    }
  } catch (error) {
    console.error('调用Dify流式工作流失败:', error)
    ElMessage.error(error.message || '调用Dify流式工作流失败')
    if (onError && typeof onError === 'function') {
      onError(error)
    }
  }
}
