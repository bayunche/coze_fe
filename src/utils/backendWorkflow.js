// src/utils/backendWorkflow.js
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
              const messageData = parsedData[0]
              // 检查是否包含 output 字段的新格式
              if (messageData.content && typeof messageData.content === 'string') {
                try {
                  const contentData = JSON.parse(messageData.content)
                  if (contentData.output) {
                    // 新格式：content 是字符串，包含 output 字段
                    onMessage({ content: contentData.output })
                  } else {
                    // 其他格式的字符串内容
                    onMessage({ content: messageData.content })
                  }
                } catch (e) {
                  // content 不是 JSON 格式，直接传递
                  onMessage({ content: messageData.content })
                }
              } else {
                // 原有格式：直接传递数组的第一个元素
                onMessage(messageData)
              }
            }
          }
          break

        case 'Error':
          if (onError && typeof onError === 'function') {
            const parsedData = JSON.parse(message.data)
            if (parsedData && parsedData.length > 0) {
              const errorData = parsedData[0]
              // 格式化错误信息以便更好地显示
              if (errorData.error_message && errorData.error_code) {
                const formattedError = {
                  message: errorData.error_message,
                  code: errorData.error_code,
                  debug_url: errorData.debug_url,
                  node_execute_uuid: errorData.node_execute_uuid
                }
                console.error('工作流执行错误:', formattedError)
                onError(formattedError)
              } else {
                onError(errorData)
              }
            } else {
              onError(parsedData)
            }
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

/**
 * 上传文件到服务器
 * @param {File} file - 要上传的文件对象
 * @returns {Promise&lt;{fileName: string, filePath: string}&gt;} - 包含 fileName 和 filePath 的对象
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    // request 工具的响应拦截器会处理掉外层的 data，直接返回业务数据
    const response = await request({
      url: `/api/files/upload`, // 基础路径 /api 已在 request 中配置
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (error) {
    console.error('文件上传失败:', error)
    ElMessage.error(error.message || '文件上传失败')
    throw error
  }
}

/**
 * 查询甲供物资申领数据
 * @param {object} params - 查询参数
 * @param {string} params.taskDetailId - 任务详情的唯一标识符
 * @param {number} [params.page=0] - 请求的页码
 * @param {number} [params.size=10] - 每页返回的记录数
 * @param {string} [params.sort] - 排序参数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryMaterialsApplyData(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryMaterialsApplyData',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询甲供物资申领数据失败:', error)
    ElMessage.error(error.message || '查询甲供物资申领数据失败')
    throw error
  }
}

/**
 * 查询实际使用物资数据
 * @param {object} params - 查询参数
 * @param {string} params.taskDetailId - 任务详情的唯一标识符
 * @param {number} [params.page=0] - 请求的页码
 * @param {number} [params.size=10] - 每页返回的记录数
 * @param {string} [params.sort] - 排序参数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryActualUsage(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryActualUsage',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询实际使用物资数据失败:', error)
    ElMessage.error(error.message || '查询实际使用物资数据失败')
    throw error
  }
}

/**
 * 查询未匹配的甲供物资对平结果
 * @param {object} params - 查询参数
 * @param {string} params.taskId - 任务的唯一标识符
 * @param {number} [params.page=0] - 请求的页码
 * @param {number} [params.size=10] - 每页返回的记录数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryUnmatchedBalanceResult(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryUnmatchedBalanceResult',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询未匹配的甲供物资对平结果失败:', error)
    ElMessage.error(error.message || '查询未匹配的甲供物资对平结果失败')
    throw error
  }
}

/**
 * 查询物资对平结果数据
 * @param {object} params - 查询参数
 * @param {string} params.taskId - 任务的唯一标识符
 * @param {number} [params.page=0] - 请求的页码
 * @param {number} [params.size=10] - 每页返回的记录数
 * @param {string} [params.sort] - 排序参数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryBalanceResult(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryBalanceResult',
      method: 'get',
      params: params
    })
    
    // 处理新的返回体结构 {code, msg, data}
    if (response && response.code === 200 && response.data) {
      return response.data // 返回实际的分页数据
    } else {
      const errorMsg = response?.msg || '查询物资对平结果数据失败'
      ElMessage.error(errorMsg)
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('查询物资对平结果数据失败:', error)
    ElMessage.error(error.message || '查询物资对平结果数据失败')
    throw error
  }
}

/**
 * 人工匹配并更新对平状态
 * @param {object} data - 匹配数据
 * @param {string} data.balanceResultId - 对平结果记录的唯一ID
 * @param {string} data.baseDataId - 标准物料的唯一ID
 * @returns {Promise<object>} - 后端返回的响应数据
 */
export async function manualMatch(data) {
  try {
    const response = await request({
      url: '/materials/partya/manualMatch',
      method: 'post',
      data: data
    })
    return response
  } catch (error) {
    console.error('人工匹配并更新对平状态失败:', error)
    ElMessage.error(error.message || '人工匹配并更新对平状态失败')
    throw error
  }
}

/**
 * 查询任务关联的项目信息
 * @param {string} taskId - 任务ID
 * @returns {Promise<object>} - 项目信息
 */
export async function queryTaskLinkProjectInfo(taskId) {
  try {
    const response = await request({
      url: '/baseprojectinfo/queryTaskLinkProjectInfo',
      method: 'get',
      params: { taskId }
    })
    
    // 处理返回体结构 {code, success, data, msg}
    if (response && response.success && response.data) {
      return response.data
    } else if (response && response.success && response.data === null) {
      // 未找到项目信息的情况
      return null
    } else {
      const errorMsg = response?.msg || '查询项目信息失败'
      console.error('查询项目信息失败:', errorMsg)
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('查询任务关联的项目信息失败:', error)
    throw error
  }
}
