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
      buffer = lines.pop()

      for (const line of lines) {
        if (line.trim() === '') continue

        if (line.trim() === 'data:[DONE]') {
          if (onEnd && typeof onEnd === 'function') {
            onEnd()
          }
          break // 结束流式处理
        }

        if (line.startsWith('data:')) {
          try {
            const jsonData = line.substring(line.indexOf('{')) // 假设数据从第一个 '{' 开始
            const parsedData = JSON.parse(jsonData)
            if (parsedData.event === 'message' && onMessage && typeof onMessage === 'function') {
              onMessage(parsedData)
            } else if (parsedData.event === 'done' && onEnd && typeof onEnd === 'function') {
              onEnd()
              reader.releaseLock() // 释放锁，允许流关闭
              return // 结束函数执行
            }
          } catch (e) {
            console.error('解析流式数据失败:', e, line)
            if (onError && typeof onError === 'function') {
              onError(e)
            }
          }
        } else {
          console.warn('收到非标准流式数据行:', line)
        }
      }
    }

    // 处理循环结束后可能剩余的buffer
    if (buffer.trim() !== '') {
      if (buffer.startsWith('data:')) {
        try {
          const jsonData = buffer.substring(buffer.indexOf('{'))
          const parsedData = JSON.parse(jsonData)
          if (parsedData.event === 'message' && onMessage && typeof onMessage === 'function') {
            onMessage(parsedData)
          } else if (parsedData.event === 'done' && onEnd && typeof onEnd === 'function') {
            onEnd()
          }
        } catch (e) {
          console.error('解析剩余流式数据失败:', e, buffer)
          if (onError && typeof onError === 'function') {
            onError(e)
          }
        }
      } else {
        console.warn('处理剩余非标准流式数据行:', buffer)
      }
    }

    // 如果流正常结束但没有收到data:[DONE]或event:done，也调用onEnd
    if (onEnd && typeof onEnd === 'function') {
      onEnd()
    }
  } catch (error) {
    console.error('调用Dify流式工作流失败:', error)
    ElMessage.error(error.message || '调用Dify流式工作流失败')
    if (onError && typeof onError === 'function') {
      onError(error)
    }
  }
}
