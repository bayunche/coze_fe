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

/**
 * 智能处理消息内容，提取 taskId 并清理用户不需要看到的技术信息
 * @param {object} parsedData - 解析后的消息数据
 * @returns {object} - 处理后的消息对象
 */
function processMessageContent(parsedData) {
  const result = {
    content: parsedData.content,
    taskId: parsedData.taskId || null,
    taskInfo: parsedData.taskInfo || null
  }

  // 尝试解析 content 中的 JSON 结构
  if (typeof parsedData.content === 'string') {
    try {
      const contentJson = JSON.parse(parsedData.content)
      
      // 检查是否为新的物资解析返回格式：包含 taskInfo（modelAnswer 可以为 null）
      if (Object.prototype.hasOwnProperty.call(contentJson, 'modelAnswer') && contentJson.taskInfo) {
        console.log('【消息处理】检测到物资解析新格式返回消息', contentJson)
        
        // 从 taskInfo 中提取 taskId
        if (contentJson.taskInfo.taskId) {
          result.taskId = contentJson.taskInfo.taskId
          console.log('【消息处理】从 taskInfo 中提取到 taskId:', contentJson.taskInfo.taskId)
        }
        
        // 从 modelAnswer 中提取输出内容（处理不同格式）
        if (contentJson.modelAnswer) {
          if (Array.isArray(contentJson.modelAnswer)) {
            // 数组格式：乙供物资解析格式
            const allOutputs = contentJson.modelAnswer
              .filter(item => item.output) // 过滤掉没有 output 的项
              .map(item => item.output)   // 提取所有 output 内容
            
            if (allOutputs.length > 0) {
              result.content = allOutputs.join('\n\n') // 用双换行符连接多个输出
              console.log('【消息处理】从 modelAnswer 数组中提取到输出内容', {
                总数量: contentJson.modelAnswer.length,
                有效输出数量: allOutputs.length,
                合并后长度: result.content.length
              })
            }
          } else if (contentJson.modelAnswer.output) {
            // 对象格式：甲供物资二次解析格式
            const output = contentJson.modelAnswer.output
            if (typeof output === 'object') {
              // 将分析结果对象格式化为可读文本
              result.content = formatAnalysisOutput(output)
              console.log('【消息处理】从 modelAnswer 对象中提取到分析结果', {
                类型: typeof output,
                内容长度: result.content.length
              })
            } else if (typeof output === 'string') {
              result.content = output
              console.log('【消息处理】从 modelAnswer 对象中提取到字符串输出')
            }
          }
        } else if (contentJson.modelAnswer === null) {
          // modelAnswer 为 null 的情况，设置空内容
          result.content = ''
          console.log('【消息处理】modelAnswer 为 null，设置空内容')
        }
        
        // 保存完整的任务信息，包含处理详情
        result.taskInfo = {
          ...result.taskInfo,
          ...contentJson.taskInfo,
          // 标记这是物资解析的完整结果
          isCompleteResult: true,
          // 保存文件详情ID用于后续查看结果（如果存在）
          fileDetailIds: contentJson.taskInfo.processDetails?.map(detail => detail.id) || []
        }
        
        // 标记消息已完成，用于按钮显示逻辑
        result.isComplete = true
        
        // 如果 modelAnswer 为 null（如甲供物资），标记为需要显示查看结果按钮
        if (contentJson.modelAnswer === null) {
          result.showViewResultButton = true
          console.log('【消息处理】modelAnswer 为 null，设置 showViewResultButton = true')
        }
        
        return result
      }
      
      // 原有格式处理逻辑保持不变
      // 从内容中提取 taskId
      if (contentJson.taskId && !result.taskId) {
        result.taskId = contentJson.taskId
        console.log('【消息处理】从内容中提取到 taskId:', contentJson.taskId)
      }

      // 确定要展示给用户的内容
      let displayContent = null

      // 优先使用专门的输出字段
      if (contentJson.output) {
        displayContent = contentJson.output
      } else if (contentJson.result) {
        displayContent = contentJson.result
      } else if (contentJson.message) {
        displayContent = contentJson.message
      } else if (contentJson.text) {
        displayContent = contentJson.text
      } else {
        // 过滤掉技术性字段，只保留用户友好的内容
        const filteredContent = filterTechnicalFields(contentJson)
        if (Object.keys(filteredContent).length > 0) {
          displayContent = JSON.stringify(filteredContent, null, 2)
        } else {
          // 如果过滤后没有内容，使用原始内容但隐藏 taskId
          // eslint-disable-next-line no-unused-vars
          const { taskId, messageId, finish_reason, ...cleanContent } = contentJson
          displayContent = Object.keys(cleanContent).length > 0 
            ? JSON.stringify(cleanContent, null, 2) 
            : parsedData.content
        }
      }

      result.content = displayContent || parsedData.content

      // 保存额外的任务信息
      if (contentJson.task_detail_id || contentJson.taskDetailId) {
        result.taskInfo = {
          ...result.taskInfo,
          task_detail_id: contentJson.task_detail_id || contentJson.taskDetailId
        }
      }

    } catch (e) {
      // 不是 JSON 格式，使用原始内容
      console.log('【消息处理】内容不是JSON格式，使用原始内容')
    }
  }

  return result
}

/**
 * 过滤掉技术性字段，只保留用户关心的内容
 * @param {object} obj - 要过滤的对象
 * @returns {object} - 过滤后的对象
 */
function filterTechnicalFields(obj) {
  const technicalFields = [
    'taskId', 'messageId', 'finish_reason', 'index',
    'chatSessionId', 'node_execute_uuid', 'debug_url',
    'created_at', 'updated_at', 'id', 'status_code'
  ]
  
  const filtered = {}
  for (const [key, value] of Object.entries(obj)) {
    if (!technicalFields.includes(key)) {
      filtered[key] = value
    }
  }
  
  return filtered
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
            console.log('【后端工作流】接收到Message消息:', parsedData)
            
            // 新的后端格式：直接是一个对象，不再是数组
            if (parsedData && typeof parsedData === 'object') {
              // 检查新格式：直接包含 content, taskId 等字段
              if (parsedData.content) {
                const processedMessage = processMessageContent(parsedData)
                console.log('【后端工作流】处理后的消息:', processedMessage)
                onMessage(processedMessage)
              } else if (Array.isArray(parsedData) && parsedData.length > 0) {
                // 兼容旧格式：数组格式
                const messageData = parsedData[0]
                if (messageData.content && typeof messageData.content === 'string') {
                  try {
                    const contentData = JSON.parse(messageData.content)
                    if (contentData.output) {
                      onMessage({ content: contentData.output })
                    } else {
                      onMessage({ content: messageData.content })
                    }
                  } catch (e) {
                    onMessage({ content: messageData.content })
                  }
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
      url: `/files/upload`, // 由于request.js中baseURL已设置为'/api'，这里只需要'/files/upload'
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
 * 人工指定源物资匹配 (V2)
 * @param {object} data - 匹配数据
 * @param {string} data.sourceId - 要匹配的源记录ID
 * @param {string} data.sourceType - 源记录的类型，必须是 'requisition' 或 'usage'
 * @param {string} data.baseDataId - 要关联到的目标标准物料的ID
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
 * 查询详细对平结果 (V2)
 * @param {object} params - 查询参数
 * @param {string} params.taskId - 要查询的任务ID
 * @param {number} [params.page=0] - 页码，从0开始
 * @param {number} [params.size=10] - 每页显示的记录数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryBalanceDetails(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryBalanceDetails',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询详细对平结果失败:', error)
    ElMessage.error(error.message || '查询详细对平结果失败')
    throw error
  }
}

/**
 * 查询物资匹配状态
 * @param {object} params - 查询参数
 * @param {string} params.taskId - 要查询的任务ID
 * @param {number} [params.page=0] - 页码，从0开始
 * @param {number} [params.size=10] - 每页显示的记录数
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryMaterialMatchStatus(params) {
  try {
    const response = await request({
      url: '/materials/partya/queryMaterialMatchStatus',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询物资匹配状态失败:', error)
    ElMessage.error(error.message || '查询物资匹配状态失败')
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
    console.log('查询任务关联的项目信息返回:', response)
    // 处理返回体结构 {code,  data, msg}
    if (response && response.code === 200 && response.data) {
      return response.data // 返回实际的项目信息
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

/**
 * 获取保存的甲供物资llmReport数据
 * @param {string} taskId - 任务ID
 * @returns {object|null} - llmReport数据或null
 */
export function getOwnerMaterialLlmReport(taskId) {
  // 回退到全局变量（兼容旧版本）
  if (window.ownerMaterialLlmReport && window.ownerMaterialLlmReport[taskId]) {
    return window.ownerMaterialLlmReport[taskId]
  }
  return null
}

/**
 * 查询基础物资信息（分页）
 * @param {object} params - 查询参数
 * @param {string} [params.keyword] - 用于模糊搜索的关键字，搜索范围包括物资名称、规格型号、单位、物资编码和序列号
 * @param {number} [params.page=0] - 页码，从0开始
 * @param {number} [params.size=10] - 每页显示的记录数
 * @param {string} [params.sort] - 排序参数，例如 'materialName,asc' 或 'materialCode,desc'
 * @returns {Promise<object>} - 后端返回的分页数据
 */
export async function queryMaterialBaseInfo(params) {
  try {
    const response = await request({
      url: '/materials/base-info/search',
      method: 'get',
      params: params
    })
    return response
  } catch (error) {
    console.error('查询基础物资信息失败:', error)
    ElMessage.error(error.message || '查询基础物资信息失败')
    throw error
  }
}

/**
 * 查询物资基础信息包含价格数据（分页）
 * @param {object} params - 查询参数
 * @param {string} [params.keyword] - 用于模糊搜索的关键字，搜索范围包括物资名称、规格型号、单位、物资编码和序列号
 * @param {number} [params.page=0] - 页码，从0开始
 * @param {number} [params.size=10] - 每页显示的记录数
 * @returns {Promise<object>} - 后端返回的分页数据，包含物资基础信息和价格数据
 */
export async function queryMaterialBaseInfoWithPrices(params) {
  try {
    const response = await request({
      url: '/materials/base-info/search-with-prices',
      method: 'get',
      params: {
        keyword: params.keyword || '',
        page: params.page || 0,
        size: params.size || 10
      }
    })
    return response
  } catch (error) {
    console.error('查询物资基础信息和价格数据失败:', error)
    ElMessage.error(error.message || '查询物资基础信息和价格数据失败')
    throw error
  }
}

/**
 * 乙供物资解析数据人工修改确认
 * @param {object} confirmData - 确认数据
 * @param {string} confirmData.id - 记录主键ID (wmes_y_materail_task_data表的主键ID)
 * @param {string} confirmData.confirmBaseDataId - 确认的基础数据ID
 * @param {string} confirmData.confirmPriceId - 确认的价格数据ID
 * @returns {Promise<object>} - 确认结果
 */
export async function confirmSupplierMaterialData(confirmData) {
  try {
    // 参数验证
    if (!confirmData.id || !confirmData.confirmBaseDataId || !confirmData.confirmPriceId) {
      throw new Error('参数不完整：id、confirmBaseDataId、confirmPriceId 均为必填')
    }
    
    const response = await request({
      url: '/materials/partyb/manual-confirm',
      method: 'post',
      data: {
        id: confirmData.id,
        confirmBaseDataId: confirmData.confirmBaseDataId,
        confirmPriceId: confirmData.confirmPriceId
      }
    })
    return response
  } catch (error) {
    console.error('乙供物资数据确认失败:', error)
    ElMessage.error(error.message || '确认失败')
    throw error
  }
}

/**
 * 获取乙供物资解析结果数据（需要后端实现）
 * @param {string} taskId - 任务ID
 * @param {object} params - 查询参数
 * @param {number} [params.page=0] - 页码，从0开始
 * @param {number} [params.size=10] - 每页显示的记录数
 * @returns {Promise<object>} - 解析结果数据
 */
export async function getSupplierMaterialParsingResults(taskId, params = {}) {
  try {
    const response = await request({
      url: `/materials/partyb/parsing-results/${taskId}`,
      method: 'get',
      params: {
        page: params.page || 0,
        size: params.size || 10,
        sort: params.sort || 'created_time,desc'
      }
    })
    return response
  } catch (error) {
    console.error('获取乙供物资解析结果失败:', error)
    ElMessage.error(error.message || '获取乙供物资解析结果失败')
    throw error
  }
}

/**
 * 乙供物资复杂查询接口
 * @param {object} queryParams - 查询参数
 * @param {string} queryParams.taskId - 任务ID，用于查询该任务下的所有物资数据
 * @param {number} [queryParams.page=0] - 页码（从0开始）
 * @param {number} [queryParams.size=10] - 每页大小
 * @param {string} [queryParams.keyword] - 搜索关键词，支持物资名称、规格型号、单位的模糊搜索
 * @param {number} [queryParams.confirmResult] - 确认结果筛选（0：未确认，1：已确认，不传则查询全部）
 * @param {number} [queryParams.matchedType] - 匹配类型筛选（0：无匹配，1：精确匹配，2：相似匹配，3：历史匹配，4：人工匹配，不传则查询全部）
 * @returns {Promise<object>} - 复杂查询结果，包含content、page、statistics
 */
export async function querySupplierMaterialsComplex(queryParams) {
  try {
    if (!queryParams || !queryParams.taskId) {
      throw new Error('参数不完整：taskId为必填项')
    }

    const response = await request({
      url: '/materials/partyb/query',
      method: 'post',
      data: {
        taskId: queryParams.taskId,
        page: queryParams.page || 0,
        size: queryParams.size || 10,
        keyword: queryParams.keyword || undefined,
        confirmResult: queryParams.confirmResult !== undefined ? queryParams.confirmResult : undefined,
        matchedType: queryParams.matchedType !== undefined ? queryParams.matchedType : undefined
      }
    })
    return response
  } catch (error) {
    console.error('乙供物资复杂查询失败:', error)
    ElMessage.error(error.message || '乙供物资复杂查询失败')
    throw error
  }
}

/**
 * 获取合同解析聚合结果
 * @param {string} taskId - 任务ID
 * @returns {Promise<object>} - 聚合的合同解析结果
 */
export async function getContractAnalysisResults(taskId) {
  try {
    if (!taskId) {
      throw new Error('任务ID不能为空')
    }
    
    const response = await request({
      url: `/contract/analysis-results/task/${taskId}`,
      method: 'get'
    })
    return response
  } catch (error) {
    console.error('获取合同解析聚合结果失败:', error)
    ElMessage.error(error.message || '获取合同解析聚合结果失败')
    throw error
  }
}

/**
 * 批量编辑乙供物资解析结果
 * @param {Array<object>} editData - 要编辑的数据数组
 * @returns {Promise<object>} - 编辑结果
 */
export async function editSupplierMaterialParsingResults(editData) {
  try {
    if (!Array.isArray(editData) || editData.length === 0) {
      throw new Error('编辑数据不能为空')
    }
    
    const response = await request({
      url: '/materials/partyb/edit-results',
      method: 'post',
      data: editData
    })
    return response
  } catch (error) {
    console.error('编辑乙供物资解析结果失败:', error)
    ElMessage.error(error.message || '编辑乙供物资解析结果失败')
    throw error
  }
}

/**
 * 批量确认乙供物资解析结果
 * @param {Array<object>} confirmData - 要确认的数据数组
 * @returns {Promise<object>} - 确认结果
 */
export async function confirmSupplierMaterialParsingResults(confirmData) {
  try {
    if (!Array.isArray(confirmData) || confirmData.length === 0) {
      throw new Error('确认数据不能为空')
    }
    
    const response = await request({
      url: '/materials/partyb/confirm-results',
      method: 'post',
      data: confirmData
    })
    return response
  } catch (error) {
    console.error('确认乙供物资解析结果失败:', error)
    ElMessage.error(error.message || '确认乙供物资解析结果失败')
    throw error
  }
}

/**
 * 修改确认合同解析结果 (单条记录)
 * @param {object} updateData - 要修改的数据
 * @param {string} updateData.taskDetailId - 任务详情ID
 * @param {number} updateData.resultStatus - 结果状态 (1表示已确认)
 * @param {Array<object>} updateData.fieldData - 字段数据数组
 * @param {string} [updateData.remark] - 修改备注
 * @returns {Promise<object>} - 修改结果
 */
export async function updateContractAnalysisResult(updateData) {
  try {
    if (!updateData || !updateData.taskDetailId || !updateData.fieldData) {
      throw new Error('参数不完整：taskDetailId和fieldData为必填项')
    }
    
    const response = await request({
      url: '/contract/analysis-results/update',
      method: 'post',
      data: updateData
    })
    return response
  } catch (error) {
    console.error('修改确认合同解析结果失败:', error)
    ElMessage.error(error.message || '修改确认合同解析结果失败')
    throw error
  }
}

/**
 * 编辑合同解析结果 (批量修改，兼容旧接口)
 * @param {Array<object>} editData - 要编辑的数据数组
 * @returns {Promise<object>} - 编辑结果
 * @deprecated 建议使用 updateContractAnalysisResult 进行单条记录修改确认
 */
export async function editContractAnalysisResults(editData) {
  try {
    if (!Array.isArray(editData) || editData.length === 0) {
      throw new Error('编辑数据不能为空')
    }
    
    const response = await request({
      url: '/contract/analysis-results/edit',
      method: 'post',
      data: editData
    })
    return response
  } catch (error) {
    console.error('编辑合同解析结果失败:', error)
    ElMessage.error(error.message || '编辑合同解析结果失败')
    throw error
  }
}

/**
 * 批量确认合同解析结果
 * @param {object} confirmData - 确认数据
 * @param {string} confirmData.taskId - 任务ID  
 * @param {string} [confirmData.remark] - 确认备注
 * @returns {Promise<object>} - 确认结果
 */
export async function confirmContractAnalysisResults(confirmData) {
  try {
    if (!confirmData || !confirmData.taskId) {
      throw new Error('参数不完整：taskId为必填项')
    }
    
    const response = await request({
      url: '/contract/analysis-results/confirm',
      method: 'post',
      data: {
        taskId: confirmData.taskId,
        remark: confirmData.remark || '批量确认合同解析结果'
      }
    })
    return response
  } catch (error) {
    console.error('确认合同解析结果失败:', error)
    ElMessage.error(error.message || '确认合同解析结果失败')
    throw error
  }
}

/**
 * 格式化甲供物资分析结果对象为可读文本
 * @param {object} analysisOutput - 分析结果对象
 * @returns {string} 格式化后的文本
 */
function formatAnalysisOutput(analysisOutput) {
  if (!analysisOutput || typeof analysisOutput !== 'object') {
    return '无有效分析结果'
  }

  const sections = []
  
  // 遍历分析结果的各个部分
  for (const [sectionTitle, sectionContent] of Object.entries(analysisOutput)) {
    sections.push(`## ${sectionTitle}`)
    
    if (typeof sectionContent === 'object' && sectionContent !== null) {
      // 如果是对象，遍历其属性
      for (const [key, value] of Object.entries(sectionContent)) {
        sections.push(`**${key}：**${value}`)
      }
    } else {
      // 如果是字符串或其他类型，直接添加
      sections.push(String(sectionContent))
    }
    
    sections.push('') // 添加空行分隔
  }
  
  return sections.join('\n')
}
