// src/uitls/backendWorkflow.js
// 用于请求后端自建的工作流调用与模拟对话流程的工具函数

// 导入必要的模块和工具函数
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const BASE_URL = '/backend-api'

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
      buffer = lines.pop()

      for (const line of lines) {
        if (line.trim() === '') continue

        if (line.trim() === 'data:[DONE]') {
          if (onComplete && typeof onComplete === 'function') {
            onComplete()
          }
          break // 结束流式处理
        }

        if (line.startsWith('data:')) {
          // 移除空格判断
          try {
            // 根据实际数据格式调整 substring 索引
            const data = JSON.parse(line.substring(line.indexOf('[')))
            if (onMessage && typeof onMessage === 'function') {
              if (data && data.length > 0) {
                onMessage(data[0]) // 传递数组中的第一个元素
              }
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

    if (buffer.trim() !== '') {
      if (buffer.startsWith('data:')) {
        // 移除空格判断
        try {
          // 根据实际数据格式调整 substring 索引
          const data = JSON.parse(buffer.substring(buffer.indexOf('[')))
          if (onMessage && typeof onMessage === 'function') {
            if (data && data.length > 0) {
              onMessage(data[0]) // 传递数组中的第一个元素
            }
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

    if (onComplete && typeof onComplete === 'function') {
      onComplete()
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
