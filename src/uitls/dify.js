import { request } from '@/utils/request'

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
 * @returns {EventSource} EventSource 实例。
 */
export function chatGenerate(data, onMessage, onEnd, onError) {
  const url = 'http://localhost:1202/v1/chat/generate'
  const headers = {
    'Content-Type': 'application/json'
  }

  const body = JSON.stringify({
    stream: true,
    agentManagementId: data.agentManagementId,
    inputs: data.inputs,
    prompt: data.prompt,
    user: data.user
  })

  const es = new EventSource(url, {
    method: 'POST',
    headers: headers,
    body: body
  })

  es.onmessage = (event) => {
    try {
      const parsedData = JSON.parse(event.data)
      if (parsedData.event === 'message' && onMessage) {
        onMessage(parsedData)
      } else if (parsedData.event === 'done' && onEnd) {
        onEnd()
        es.close()
      }
    } catch (e) {
      console.error('Error parsing EventSource message:', e)
      if (onError) {
        onError(e)
      }
    }
  }

  es.onerror = (error) => {
    console.error('EventSource failed:', error)
    if (onError) {
      onError(error)
    }
    es.close()
  }

  es.onopen = () => {
    console.log('EventSource opened.')
  }

  return es
}
