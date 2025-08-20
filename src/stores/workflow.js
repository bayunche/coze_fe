import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { functions } from '@/utils/workflowsDefinedEnum.js'
import SmartBrainService from '@/services/SmartBrainService'
import { formatDuration, generateMockResult } from '@/utils/helpers'
import { callStreamWorkflow, uploadFile } from '@/utils/backendWorkflow.js'
import { useOwnerMaterialStore } from '@/stores/ownerMaterial'
import { useChatStore } from '@/stores/chat'

// #region Type Definitions
/**
 * @typedef {Object} WorkflowFunction
 * @property {string} id - 功能ID
 * @property {string} name - 功能名称
 * @property {Array<Object>} steps - 工作流步骤
 * @property {boolean} [needsFiles] - 是否需要文件上传
 * @property {string} [allowedTypes] - 允许的文件类型
 * @property {Array<FunctionParam>} [params] - 功能参数
 */

/**
 * @typedef {Object} SmartAgentTaskCounts
 * @property {number} completed - 已完成任务数
 * @property {number} inProgress - 进行中任务数
 * @property {number} total - 总任务数
 */

/**
 * @typedef {Object} SmartAgent
 * @property {string} id - 智能体ID
 * @property {string} name - 智能体名称
 * @property {'online' | 'offline'} status - 智能体状态
 * @property {SmartAgentTaskCounts} tasks - 任务统计
 */

/**
 * @typedef {Object} TaskList
 * @property {Array<Object>} inProgress - 进行中任务列表
 * @property {Array<Object>} completed - 已完成任务列表
 * @property {Array<Object>} all - 所有任务列表
 */

/**
 * @typedef {Object} WorkflowConfig
 * @property {Array<File>} files - 上传的文件列表
 * @property {Object.<string, any>} params - 工作流参数
 * @property {boolean} concurrent - 是否并发执行
 * @property {'stop' | 'continue'} errorHandling - 错误处理策略
 */

/**
 * @typedef {Object} CurrentWorkflow
 * @property {number} id - 工作流实例ID
 * @property {string} name - 工作流名称
 * @property {string} function - 对应功能名称
 * @property {Array<Object>} steps - 工作流步骤
 * @property {number} startTime - 开始时间戳
 */

/**
 * @typedef {Object} ExecutionSession
 * @property {number} id - 会话ID
 * @property {string} name - 会话名称
 * @property {'running' | 'success' | 'error'} status - 会话状态
 * @property {string} duration - 持续时间
 * @property {string} output - 输出内容
 */

/**
 * @typedef {Object} CompletedExecution
 * @property {number} id - 执行ID
 * @property {string} workflow - 工作流名称
 * @property {string} function - 功能名称
 * @property {'success' | 'error'} status - 执行状态
 * @property {string} duration - 持续时间
 * @property {string} timestamp - 时间戳
 * @property {string} output - 输出内容
 */
// #endregion

// #region Constants
const BUSINESS_DOMAINS = {
  contractParsing: 'contract',
  supplierMaterialParsing: 'y_material',
  ownerSuppliedMaterialParsing: 'j_material'
}
// #endregion

export const useWorkflowStore = defineStore('workflow', () => {
  // #region Services and Stores
  const chatStore = useChatStore()
  const ownerMaterialStore = useOwnerMaterialStore()
  // #endregion

  // #region State
  const isSidebarOpen = ref(false)
  const activeFunction = ref('')
  const currentWorkflow = ref(null)
  const isExecuting = ref(false)
  const workflowElapsedTime = ref(0)
  const currentStepIndex = ref(0)
  const stepProgress = ref(0)
  const showWorkflowConfig = ref(false)
  const showSmartBrainDialog = ref(false)
  const executionSessions = reactive([])
  const executionHistory = reactive([])
  const lastExecutionResult = ref(null)
  const taskId = ref(null)
  const supplierTaskId = ref(null)
  const supplierFileDetailIds = ref([])

  const smartAgents = ref(
    functions
      .filter((f) => f.id in BUSINESS_DOMAINS)
      .map((f) => ({
        id: f.id,
        name: f.name,
        status: 'online',
        tasks: { completed: 0, inProgress: 0, total: 0 }
      }))
  )

  const workflowConfig = reactive({
    files: [],
    params: {},
    concurrent: false,
    errorHandling: 'stop'
  })

  let timeInterval = null
  let progressManager = null
  // #endregion

  // #region Getters
  const getCurrentFunctionName = () => {
    const func = functions.find((f) => f.id === activeFunction.value)
    return func ? func.name : '未知功能'
  }

  const getCurrentFunction = () => {
    return functions.find((f) => f.id === activeFunction.value)
  }

  const getCurrentFunctionParams = () => {
    const func = getCurrentFunction()
    return func ? func.params || [] : []
  }

  const needsFileUpload = () => {
    const func = getCurrentFunction()
    return func ? func.needsFiles : false
  }

  const getAllowedFileTypes = () => {
    const func = getCurrentFunction()
    return func ? func.allowedTypes || '*' : '*'
  }
  // #endregion

  // #region Utility Functions
  /**
   * 统一处理工作流执行中的错误
   * @param {Error} error - 错误对象
   * @param {Object} loadingMessage - 加载消息对象
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const onExecutionError = (error, loadingMessage, addMessageCallback) => {
    console.error('Workflow execution failed:', error)
    if (progressManager) progressManager.stop()
    if (timeInterval) clearInterval(timeInterval)

    if (loadingMessage) {
      loadingMessage.content = `任务失败: ${error.message}`
      loadingMessage.progress = 100
    }
    addMessageCallback(`任务执行失败: ${error.message}`, 'system')
    finalizeWorkflowExecution({ status: 'error', output: error.message }, addMessageCallback)
  }

  /**
   * 创建并管理进度条更新
   * @param {Object} loadingMessage - 要更新进度的消息对象
   * @param {number} expectedDurationMinutes - 预估持续时间（分钟）
   * @returns {{start: function, stop: function}}
   */
  const createProgressManager = (loadingMessage, expectedDurationMinutes) => {
    let interval = null
    const start = () => {
      let progress = 0
      const maxProgress = 99
      const intervalTime = 300
      const totalUpdates = (expectedDurationMinutes * 60 * 1000) / intervalTime
      const progressIncrement = totalUpdates > 0 ? maxProgress / totalUpdates : 0

      interval = setInterval(() => {
        if (progress < maxProgress) {
          progress += progressIncrement
          loadingMessage.progress = Math.floor(Math.min(progress, maxProgress))
        } else {
          stop()
        }
      }, intervalTime)
    }
    const stop = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    return { start, stop }
  }

  /**
   * 解析工作流返回的流式消息
   * @param {Object} event - SSE 事件
   * @returns {{potentialTaskId: string|null, messageContent: string|null, parsedMessage: Object|null}}
   */
  // eslint-disable-next-line no-unused-vars
  const parseWorkflowMessage = (event) => {
    if (event.event !== 'Message' || event.data.content_type !== 'text') {
      return { potentialTaskId: null, messageContent: null, parsedMessage: null }
    }

    const content = event.data.content
    let potentialTaskId = null
    let messageContent = null
    let parsedMessage = null

    if (typeof content === 'string') {
      // 首先尝试解析"任务编号："格式的消息
      const taskIdMatch = content.match(/任务编号：([a-f0-9-]+)/i)
      if (taskIdMatch) {
        potentialTaskId = taskIdMatch[1]
        messageContent = content
        // 创建一个模拟的 parsedMessage 对象以保持兼容性
        parsedMessage = { task_id: potentialTaskId }
        return { potentialTaskId, messageContent, parsedMessage }
      }

      // 然后尝试解析 JSON 格式
      try {
        parsedMessage = JSON.parse(content)
      } catch (e) {
        messageContent = content
      }
    } else if (typeof content === 'object' && content !== null) {
      parsedMessage = content
    }

    if (parsedMessage) {
      potentialTaskId = parsedMessage?.task_id || null
      if (!potentialTaskId) {
        messageContent = JSON.stringify(parsedMessage, null, 2)
      }
    }

    return { potentialTaskId, messageContent, parsedMessage }
  }

  // #endregion

  // #region Actions - Smart Brain
  /**
   * 获取所有智能体的任务统计数据
   * 使用新的智能体任务详情API
   */
  const fetchAllAgentTaskCounts = async () => {
    try {
      const agentTaskDetails = await SmartBrainService.getAgentTaskDetails()

      // 创建API名称到前端智能体名称的映射
      const apiNameToFrontendName = {
        合同业务: '合同解析',
        甲供物资业务: '甲供物资解析',
        乙供物资业务: '乙供物资解析'
      }

      // 创建智能体名称到任务数据的映射
      const taskDataMap = new Map()
      agentTaskDetails.forEach((item) => {
        const frontendName = apiNameToFrontendName[item.agentName] || item.agentName
        taskDataMap.set(frontendName, {
          total: item.totalTaskCount || 0,
          completed: item.completedTaskCount || 0,
          inProgress: item.processingTaskCount || 0
        })
      })

      console.log('API返回的任务统计数据:', agentTaskDetails)
      console.log('转换后的任务数据映射:', Array.from(taskDataMap.entries()))

      // 更新智能体任务统计数据
      smartAgents.value.forEach((agent) => {
        const taskData = taskDataMap.get(agent.name)
        console.log(`智能体 ${agent.name} 的任务数据:`, taskData)
        if (taskData) {
          agent.tasks.total = taskData.total
          agent.tasks.completed = taskData.completed
          agent.tasks.inProgress = taskData.inProgress
        } else {
          // 如果API中没有对应的智能体数据，设置为0
          agent.tasks = { completed: 0, inProgress: 0, total: 0 }
        }
      })

      console.log(
        '智能体任务统计数据更新成功，当前智能体数据:',
        smartAgents.value.map((a) => ({ name: a.name, tasks: a.tasks }))
      )
    } catch (error) {
      console.error('获取智能体任务统计数据失败:', error)

      // API调用失败时，将所有智能体任务数据设置为0
      smartAgents.value.forEach((agent) => {
        agent.tasks = { completed: 0, inProgress: 0, total: 0 }
      })
    }
  }

  /**
   * 获取业务域名映射
   * @param {string} agentId - 智能体ID
   * @returns {string} 业务域名
   */
  const getBusinessDomain = (agentId) => {
    return BUSINESS_DOMAINS[agentId] || null
  }

  /**
   * 处理智能大脑功能选择，获取所有智能体数据
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const selectSmartBrain = async (addMessageCallback) => {
    try {
      if (typeof addMessageCallback === 'function') {
        addMessageCallback('正在查询智能体任务数据...', 'system')
      }

      // 使用新的批量获取任务统计数据的方法
      await fetchAllAgentTaskCounts()

      ElMessage.success('智能体任务数据查询成功！')
      showSmartBrainDialog.value = true
    } catch (error) {
      console.error('查询智能大脑数据失败:', error)
      if (typeof addMessageCallback === 'function') {
        addMessageCallback('查询智能大脑数据失败，请稍后重试。', 'system', null, error)
      }
      ElMessage.error('查询智能大脑数据失败，请稍后重试。')
    }
  }
  // #endregion

  // #region Actions - Workflow Execution
  /**
   * 上传工作流所需的文件
   * @returns {Promise<string[]>} 上传后的文件ID列表
   */
  const uploadWorkflowFiles = async () => {
    currentStepIndex.value = 0 // 步骤: 上传文件
    stepProgress.value = 0

    const uploadPromises = workflowConfig.files.map((file) => {
      // 统一使用后端上传接口，不再区分工作流类型
      return uploadFile(file.raw).then((res) => ({
        filePath: res.filePath,
        excel_type: file.excel_type // 保留 excel_type 以支持甲供物资解析
      }))
    })

    const fileIdsOrPaths = await Promise.all(uploadPromises)
    stepProgress.value = 100
    return fileIdsOrPaths
  }

  /**
   * 准备工作流执行环境
   * @param {function} addMessageCallback - 添加消息的回调
   * @returns {{workflow: CurrentWorkflow, loadingMessage: Object}}
   */
  const prepareWorkflowExecution = (addMessageCallback) => {
    const func = getCurrentFunction()
    const workflow = {
      id: Date.now(),
      name: `${func.name}`,
      function: func.name,
      steps: func.steps,
      startTime: Date.now()
    }

    currentWorkflow.value = workflow
    isExecuting.value = true
    currentStepIndex.value = 0
    stepProgress.value = 0
    workflowElapsedTime.value = 0

    const loadingMessage = reactive({
      id: Date.now() + Math.random(),
      from: 'agent',
      type: 'loading',
      content: '正在准备任务，请稍候...',
      progress: 0,
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name }
    })
    addMessageCallback(loadingMessage)

    timeInterval = setInterval(() => {
      const elapsed = (Date.now() - workflow.startTime) / 1000
      workflowElapsedTime.value = formatDuration(elapsed)
      const currentSession = executionSessions.find((s) => s.id === workflow.id)
      if (currentSession) {
        currentSession.duration = workflowElapsedTime.value
      }
    }, 100)

    return { workflow, loadingMessage }
  }

  /**
   * 处理合同解析工作流
   * @param {Array<{filePath: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const executeContractParsing = async (inputs, context) => {
    const { workflow, loadingMessage, addMessageCallback } = context
    const finalResult = []

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    try {
      loadingMessage.content = '合同解析已开始...'
      addMessageCallback(streamingAgentMessage)

      // 使用后端 API，agentManagementId: '8' (新的合同解析工作流)
      await callStreamWorkflow(inputs, '8', {
        onMessage: (event) => {
          if (event.content) {
            // 统一处理 taskId 提取 - 智能消息处理已经完成了提取和清理
            if (event.taskId) {
              taskId.value = event.taskId
              streamingAgentMessage.task = event.taskId
              console.log('【合同解析】获取到任务ID:', event.taskId)
            }

            // 处理额外的任务信息
            if (event.taskInfo && event.taskInfo.task_detail_id) {
              console.log('【合同解析】获取到任务详情ID:', event.taskInfo.task_detail_id)
            }

            // 处理流式消息内容（已经过滤掉了 taskId 等技术信息）
            chatStore.appendStreamContent(streamingAgentMessage.id, event.content)
            finalResult.push(event.content)
            // 物资确认按钮默认显示（除非是失败状态）
            // 使用chatStore方法更新消息属性，确保响应式更新
            chatStore.updateMessageProperties(streamingAgentMessage.id, {
              showViewResultButton: true
            })
          }
        },
        onError: (error) => {
          // 失败时不显示物资确认按钮
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: false
          })
          onExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          delete streamingAgentMessage.isStreaming
          // 物资确认按钮默认显示（除非是失败状态）
          // 使用chatStore方法更新消息属性，确保响应式更新
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: true
          })
          if (progressManager) progressManager.stop()
          loadingMessage.progress = 100
          loadingMessage.content = '合同解析任务执行完毕！'
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        }
      })
    } catch (error) {
      // 失败时不显示物资确认按钮
      chatStore.updateMessageProperties(streamingAgentMessage.id, {
        showViewResultButton: false
      })
      onExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 处理乙供物资解析工作流
   * @param {Array<{filePath: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const executeSupplierMaterialParsing = async (inputs, context) => {
    const { workflow, loadingMessage, addMessageCallback } = context
    const finalResult = []

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    try {
      loadingMessage.content = '乙供物资解析已开始...'
      addMessageCallback(streamingAgentMessage)

      // 使用后端 API，agentManagementId: '6'
      await callStreamWorkflow(inputs, '6', {
        onMessage: (event) => {
          if (event.content) {
            // 统一处理 taskId 提取 - 智能消息处理已经完成了提取和清理
            if (event.taskId) {
              supplierTaskId.value = event.taskId
              streamingAgentMessage.task = event.taskId
              console.log('【乙供物资解析】获取到任务ID:', event.taskId)
            }

            // 处理任务信息，优先使用新格式的fileDetailIds
            if (event.taskInfo) {
              // 新格式：从processDetails中提取文件详情ID
              if (event.taskInfo.fileDetailIds && event.taskInfo.fileDetailIds.length > 0) {
                supplierFileDetailIds.value = event.taskInfo.fileDetailIds
                console.log(
                  '【乙供物资解析】从新格式获取到文件详情ID:',
                  event.taskInfo.fileDetailIds
                )
              }
              // 兼容旧格式：task_detail_id
              else if (event.taskInfo.task_detail_id) {
                if (Array.isArray(event.taskInfo.task_detail_id)) {
                  supplierFileDetailIds.value = event.taskInfo.task_detail_id
                } else {
                  supplierFileDetailIds.value = [event.taskInfo.task_detail_id]
                }
                console.log(
                  '【乙供物资解析】从兼容格式获取到任务详情ID:',
                  event.taskInfo.task_detail_id
                )
              }
            }

            // 处理流式消息内容（已经过滤掉了 taskId 等技术信息）
            chatStore.appendStreamContent(streamingAgentMessage.id, event.content)
            finalResult.push(event.content)

            // 检查是否为完整结果消息（新的乙供物资格式）
            if (event.isComplete && event.taskInfo && event.taskInfo.isCompleteResult) {
              console.log('【乙供物资解析】检测到完整结果消息，立即完成流式处理')

              // 立即完成流式处理，不等待Done事件
              delete streamingAgentMessage.isStreaming

              // 物资确认按钮默认显示（除非是失败状态）
              // 使用chatStore方法更新消息属性，确保响应式更新
              chatStore.updateMessageProperties(streamingAgentMessage.id, {
                showViewResultButton: true
              })
              console.log('【乙供物资解析】显示查看解析结果按钮')

              if (progressManager) progressManager.stop()
              loadingMessage.progress = 100
              loadingMessage.content = '乙供物资解析任务执行完毕！'
              ElMessage.success('乙供物资解析完成')
              finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
            }
          }
        },
        onError: (error) => {
          // 失败时不显示物资确认按钮
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: false
          })
          onExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          // 如果消息已经在onMessage中完成处理（新格式），则跳过
          if (!streamingAgentMessage.isStreaming) {
            console.log('【乙供物资解析】消息已在onMessage中处理完成，跳过onComplete处理')
            return
          }

          // 处理旧格式或其他未完成的消息
          delete streamingAgentMessage.isStreaming
          // 物资确认按钮默认显示（除非是失败状态）
          // 使用chatStore方法更新消息属性，确保响应式更新
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: true
          })
          if (progressManager) progressManager.stop()
          loadingMessage.progress = 100
          loadingMessage.content = '乙供物资解析任务执行完毕！'
          ElMessage.success('乙供物资解析完成')
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        }
      })
    } catch (error) {
      // 失败时不显示物资确认按钮
      chatStore.updateMessageProperties(streamingAgentMessage.id, {
        showViewResultButton: false
      })
      onExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 处理甲供物资解析工作流
   * @param {Array<{file_id: string}|{file_path: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const executeOwnerMaterialParsing = async (inputs, context) => {
    const { workflow, loadingMessage, addMessageCallback } = context
    const finalResult = []

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    try {
      loadingMessage.content = '甲供物资解析已开始...'
      addMessageCallback(streamingAgentMessage)

      await callStreamWorkflow({ ...inputs }, '7', {
        onMessage: (event) => {
          if (event.content) {
            console.log('【甲供物资解析】接收到消息:', event)

            // 统一处理 taskId 提取 - 智能消息处理已经完成了提取和清理
            if (event.taskId) {
              taskId.value = event.taskId
              streamingAgentMessage.task = event.taskId
              ownerMaterialStore.setTask(event.taskId)
              console.log('【甲供物资解析】获取到任务ID:', event.taskId)
            }

            // 处理任务信息，兼容新格式
            if (event.taskInfo) {
              console.log('【甲供物资解析】获取到任务信息:', event.taskInfo)

              // 如果有fileDetailIds，保存用于查看结果
              if (event.taskInfo.fileDetailIds && event.taskInfo.fileDetailIds.length > 0) {
                console.log(
                  '【甲供物资解析】从新格式获取到文件详情ID:',
                  event.taskInfo.fileDetailIds
                )
              }
            }

            // 检查是否需要特殊处理某些内容格式
            let shouldDisplayContent = true
            try {
              const contentJson = JSON.parse(event.content)
              if (contentJson.llmReport) {
                // llmReport 不直接展示，替换为人工确认提示
                const manualConfirmText = '\n存在无法匹配的物资信息，请人工介入\n'
                chatStore.appendStreamContent(streamingAgentMessage.id, manualConfirmText)
                finalResult.push(manualConfirmText)
                shouldDisplayContent = false
              }
            } catch (e) {
              // 不是 JSON 格式，正常处理
            }

            // 处理流式消息内容（已经过滤掉了 taskId 等技术信息）
            if (shouldDisplayContent) {
              chatStore.appendStreamContent(streamingAgentMessage.id, event.content)
              finalResult.push(event.content)
            }

            // 检查是否为完整结果消息（新的甲供物资格式）
            if (event.isComplete && event.taskInfo && event.taskInfo.isCompleteResult) {
              console.log('【甲供物资解析】检测到完整结果消息，立即完成流式处理')

              // 立即完成流式处理，不等待Done事件
              delete streamingAgentMessage.isStreaming

              // 在消息最后追加固定文字
              const fixedMessage = '\n存在无法匹配的物资信息，请人工介入\n'
              chatStore.appendStreamContent(streamingAgentMessage.id, fixedMessage)
              finalResult.push(fixedMessage)

              if (taskId.value) {
                ownerMaterialStore.updateTaskStatus(taskId.value, 'needs_manual_alignment')
              }

              if (progressManager) progressManager.stop()
              loadingMessage.progress = 100
              // loadingMessage.content = '甲供物资解析任务执行完毕！'

              finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
            }
          }
        },
        onError: (error) => {
          // 失败时不显示物资确认按钮
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: false
          })
          onExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          // 如果消息已经在onMessage中完成处理（新格式），则跳过
          if (!streamingAgentMessage.isStreaming) {
            console.log('【甲供物资解析】消息已在onMessage中处理完成，跳过onComplete处理')
            return
          }

          // 处理旧格式或其他未完成的消息
          delete streamingAgentMessage.isStreaming

          // 在消息最后追加固定文字
          const fixedMessage = '\n存在无法匹配的物资信息，请人工介入\n'
          chatStore.appendStreamContent(streamingAgentMessage.id, fixedMessage)
          finalResult.push(fixedMessage)

          // 甲供物资解析不显示详情按钮，只显示物资信息的按钮
          // streamingAgentMessage.showViewResultButton = true

          if (taskId.value) {
            ownerMaterialStore.updateTaskStatus(taskId.value, 'needs_manual_alignment')
          }
          if (progressManager) progressManager.stop()
          loadingMessage.progress = 100
          // loadingMessage.content = '甲供物资解析任务执行完毕！'
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        }
      })
    } catch (error) {
      // 失败时不显示物资确认按钮
      chatStore.updateMessageProperties(streamingAgentMessage.id, {
        showViewResultButton: false
      })
      onExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 处理甲供物资重新解析工作流（使用新接口）
   * @param {string} taskId - 任务ID
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const executeOwnerMaterialReparse = async (taskId, addMessageCallback) => {
    const loadingMessage = {
      id: Date.now(),
      from: 'system',
      content: '正在重新解析，请稍后......',
      timestamp: new Date().toLocaleTimeString(),
      sender: '系统',
      progress: 0
    }

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: '甲供物资重新解析',
      workflow: { id: '9', name: '甲供物资重新解析' },
      task: taskId,
      isStreaming: true
    }

    const finalResult = []

    try {
      addMessageCallback(loadingMessage)
      addMessageCallback(streamingAgentMessage)

      loadingMessage.content = '甲供物资重新解析已开始...'

      // 使用后端工作流 API，agentManagementId: '9' (甲供物资重新解析工作流)
      await callStreamWorkflow({ taskId }, '9', {
        onMessage: (event) => {
          if (event.content) {
            // 统一处理 taskId 提取 - 智能消息处理已经完成了提取和清理
            if (event.taskId) {
              streamingAgentMessage.task = event.taskId
              console.log('【甲供物资重新解析】获取到任务ID:', event.taskId)
            }

            // 处理额外的任务信息
            if (event.taskInfo) {
              console.log('【甲供物资重新解析】获取到任务信息:', event.taskInfo)
            }

            // 处理流式消息内容（已经过滤掉了 taskId 等技术信息）
            chatStore.appendStreamContent(streamingAgentMessage.id, event.content)
            finalResult.push(event.content)
            
            // 物资确认按钮默认显示（除非是失败状态）
            chatStore.updateMessageProperties(streamingAgentMessage.id, {
              showViewResultButton: true
            })
          }
        },
        onError: (error) => {
          // 失败时不显示物资确认按钮
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: false
          })
          onExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          delete streamingAgentMessage.isStreaming
          // 物资确认按钮默认显示（除非是失败状态）
          chatStore.updateMessageProperties(streamingAgentMessage.id, {
            showViewResultButton: true
          })
          loadingMessage.progress = 100
          loadingMessage.content = '甲供物资重新解析任务执行完毕！'
          ElMessage.success('甲供物资重新解析完成')
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        }
      })
    } catch (error) {
      // 失败时不显示物资确认按钮
      chatStore.updateMessageProperties(streamingAgentMessage.id, {
        showViewResultButton: false
      })
      onExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 主工作流执行函数
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const executeWorkflow = async (addMessageCallback) => {
    const func = getCurrentFunction()
    if (!func) return

    if (func.needsFiles && workflowConfig.files.length === 0) {
      ElMessage.warning('请先上传文件')
      showWorkflowConfig.value = true
      return
    }

    const { workflow, loadingMessage } = prepareWorkflowExecution(addMessageCallback)

    let expectedDurationMinutes = workflowConfig.files.length * 3 // Default
    if (func.id === 'contractParsing') expectedDurationMinutes = workflowConfig.files.length * 4
    if (func.id === 'supplierMaterialParsing')
      expectedDurationMinutes = workflowConfig.files.length * 2
    progressManager = createProgressManager(loadingMessage, expectedDurationMinutes)
    progressManager.start()

    try {
      const fileIdsOrPaths = await uploadWorkflowFiles()
      currentStepIndex.value = 1 // 步骤: 文件解析

      let inputs

      if (func.id === 'ownerSuppliedMaterialParsing') {
        // For owner material, group files by excel_type
        // For owner material, group files by excel_type, respecting single vs. multiple file types.
        inputs = fileIdsOrPaths.reduce((acc, file) => {
          const key = file.excel_type
          if (!key) return acc // Skip if excel_type is missing

          if (key === 'other') {
            // 'other' files are collected into an array of objects.
            if (!acc[key]) {
              acc[key] = []
            }
            acc[key].push({ filePath: file.filePath })
          } else {
            // Other file types are assigned as a direct string path.
            acc[key] = file.filePath
          }
          return acc
        }, {})
      } else {
        // For other workflows (contract and supplier material parsing), create fileList array
        inputs = {
          fileList: fileIdsOrPaths.map((file) => file.filePath)
        }
      }
      const context = { workflow, loadingMessage, addMessageCallback }

      executionSessions.push({
        id: workflow.id,
        name: workflow.name,
        status: 'running',
        duration: '0.0s',
        output: '正在执行，请稍候...'
      })

      switch (func.id) {
        case 'contractParsing':
          executeContractParsing(inputs, context)
          break
        case 'supplierMaterialParsing':
          executeSupplierMaterialParsing(inputs, context)
          break
        case 'ownerSuppliedMaterialParsing':
          executeOwnerMaterialParsing(inputs, context)
          break
        default:
          throw new Error(`Unsupported function ID: ${func.id}`)
      }
    } catch (error) {
      onExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 最终确定工作流执行状态
   * @param {Object} resultOverride - 覆盖默认结果的对象
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const finalizeWorkflowExecution = (resultOverride = {}, addMessageCallback) => {
    if (!currentWorkflow.value) return

    if (timeInterval) clearInterval(timeInterval)
    if (progressManager) progressManager.stop()

    const duration = formatDuration((Date.now() - currentWorkflow.value.startTime) / 1000)
    const func = getCurrentFunction()
    const result = generateMockResult(func, duration)

    const completedExecution = {
      id: currentWorkflow.value.id,
      workflow: currentWorkflow.value.name,
      function: getCurrentFunctionName(),
      status: resultOverride.status || 'success',
      duration,
      timestamp: new Date().toLocaleString(),
      output: resultOverride.output || result.output
    }

    executionHistory.unshift(completedExecution)
    if (executionHistory.length > 20) executionHistory.pop()

    const currentSession = executionSessions.find((s) => s.id === currentWorkflow.value.id)
    if (currentSession) {
      Object.assign(currentSession, {
        ...result,
        id: completedExecution.id,
        ...resultOverride
      })
    }

    currentWorkflow.value = null
    isExecuting.value = false
    currentStepIndex.value = 0
    stepProgress.value = 0
    workflowElapsedTime.value = 0

    setTimeout(() => {
      addMessageCallback(
        `任务执行完成: ${completedExecution.workflow} (耗时: ${duration})`,
        'agent',
        { id: completedExecution.id, name: completedExecution.workflow },
        null,
        { showViewResultButton: false } // 按钮逻辑已移至具体处理函数
      )
      addMessageCallback(`--- 任务 ${completedExecution.workflow} 执行结束 ---`, 'system', {
        id: completedExecution.id,
        name: completedExecution.workflow
      })
    }, 1000)
  }
  // #endregion

  // #region Actions - UI & General
  const setTaskId = (id) => {
    taskId.value = id
  }

  const setSupplierFileIds = (ids) => {
    supplierFileDetailIds.value = ids
  }

  // 智能大脑数据获取方法 - 独立页面使用
  const executeSmartBrain = async () => {
    try {
      // 使用新的批量获取任务统计数据的方法
      await fetchAllAgentTaskCounts()
      console.log('智能体任务数据获取成功')
    } catch (error) {
      console.error('获取智能大脑数据失败:', error)
      ElMessage.error('获取智能大脑数据失败，请稍后重试。')
    }
  }

  const selectFunction = async (key, addMessageCallback) => {
    if (key === 'smartBrain') {
      await selectSmartBrain(addMessageCallback)
      return
    }
    activeFunction.value = key
    resetWorkflowConfig()
    showWorkflowConfig.value = true
  }

  const startWorkflowFromDialog = (addMessageCallback) => {
    const func = getCurrentFunction()
    if (!func) return

    if (func.needsFiles && workflowConfig.files.length === 0) {
      ElMessage.warning('请先上传文件')
      return
    }

    showWorkflowConfig.value = false
    ElMessage.success('即将开始执行...')
    executeWorkflow(addMessageCallback)
  }

  const resetWorkflowConfig = () => {
    const func = getCurrentFunction()
    if (!func || !func.params) return

    const newParams = {}
    func.params.forEach((param) => {
      if (param.type === 'boolean') newParams[param.key] = false
      else if (param.type === 'number') newParams[param.key] = param.min || 0
      else if (param.type === 'select' && param.options?.length)
        newParams[param.key] = param.options[0].value
      else newParams[param.key] = ''
    })
    workflowConfig.params = newParams
    workflowConfig.files = []
  }

  const clearHistory = (addMessageCallback) => {
    executionHistory.splice(0)
    addMessageCallback('执行历史已清空', 'system')
    ElMessage.success('执行历史已清空')
  }

  const exportHistory = (addMessageCallback) => {
    const data = JSON.stringify(executionHistory, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution_history_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    addMessageCallback('执行历史已导出', 'system')
  }

  const viewExecutionDetail = (row, setLastExecutionResultCallback, addMessageCallback) => {
    setLastExecutionResultCallback({
      id: row.id,
      status: row.status,
      duration: row.duration,
      output: row.output,
      totalSteps: Math.floor(Math.random() * 5) + 3,
      processedItems: Math.floor(Math.random() * 1000) + 100,
      successRate: Math.floor(Math.random() * 20) + 80,
      timestamp: row.timestamp,
      files: []
    })
    addMessageCallback(`查看执行详情: ${row.workflow}`, 'system')
  }
  // #endregion

  return {
    // State
    isSidebarOpen,
    activeFunction,
    currentWorkflow,
    isExecuting,
    workflowElapsedTime,
    currentStepIndex,
    stepProgress,
    showWorkflowConfig,
    executionSessions,
    workflowConfig,
    executionHistory,
    lastExecutionResult,
    smartAgents,
    taskId,
    supplierFileDetailIds,
    showSmartBrainDialog,
    // Getters
    getCurrentFunctionName,
    getCurrentFunction,
    getCurrentFunctionParams,
    needsFileUpload,
    getAllowedFileTypes,
    // Actions
    selectFunction,
    executeSmartBrain,
    executeWorkflow,
    executeOwnerMaterialReparse,
    finalizeWorkflowExecution,
    startWorkflowFromDialog,
    resetWorkflowConfig,
    clearHistory,
    exportHistory,
    viewExecutionDetail,
    setTaskId,
    setSupplierFileIds,
    getBusinessDomain
  }
})
