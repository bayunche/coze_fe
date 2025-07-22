import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { functions } from '@/utils/workflowsDefinedEnum.js'
import CozeWorkflowService from '@/services/CozeWorkflowService'
import CozeParsingService from '@/services/CozeParsingService'
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
const WORKFLOW_IDS = {
  GET_TASK_COUNTS: '7517560875563204627',
  GET_TASK_LIST: '7517283953213866036',
  CONTRACT_PARSING: '7516796514431172642',
  SUPPLIER_MATERIAL_PARSING: '7517934954761715721',
  OWNER_MATERIAL_PARSING: '7517934954761715721' // 复用乙供ID，后端通过参数区分
}

const BUSINESS_DOMAINS = {
  contractParsing: 'contract',
  supplierMaterialParsing: 'y_material',
  ownerSuppliedMaterialParsing: 'j_material'
}

const COMMON_APP_ID = '7509762183313129512'
// #endregion

export const useWorkflowStore = defineStore('workflow', () => {
  // #region Services and Stores
  const chatStore = useChatStore()
  const ownerMaterialStore = useOwnerMaterialStore()
  const cozeWorkflowService = new CozeWorkflowService()
  const cozeParsingService = new CozeParsingService()
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
  const taskListsByAgent = ref({})

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
  const handleExecutionError = (error, loadingMessage, addMessageCallback) => {
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

  /**
   * 从工作流结果中解析任务列表
   * @param {Object} result - 工作流执行结果
   * @returns {Array<Object>}
   */
  const parseTaskListFromResult = (result) => {
    try {
      const data = result?.data
      if (!data) return []
      const output = JSON.parse(data).output
      if (!output) return []
      if (Array.isArray(output)) return output
      if (typeof output === 'string') {
        const parsed = JSON.parse(output)
        return Array.isArray(parsed) ? parsed : []
      }
      return []
    } catch (e) {
      console.error('Failed to parse workflow output:', e, result?.data)
      return []
    }
  }
  // #endregion

  // #region Actions - Smart Brain
  /**
   * 获取单个智能体的任务数量
   * @param {SmartAgent} agent - 智能体对象
   */
  const fetchAgentTaskCounts = async (agent) => {
    const domain = BUSINESS_DOMAINS[agent.id]
    if (!domain) return

    try {
      const result = await cozeWorkflowService.runWorkflow(WORKFLOW_IDS.GET_TASK_COUNTS, {
        businessDomain: domain
      })
      if (result && result.data) {
        const outerParsed = JSON.parse(result.data)
        if (outerParsed && outerParsed.output) {
          const innerParsed = JSON.parse(outerParsed.output)
          const domainData = innerParsed.find((item) => item.BUSINESS_DOMAIN === domain)
          if (domainData) {
            agent.tasks.completed = parseInt(domainData.finished_count) || 0
            agent.tasks.inProgress = parseInt(domainData.running_count) || 0
            agent.tasks.total = parseInt(domainData.total_count) || 0
          }
        }
      }
    } catch (error) {
      console.error(`解析 ${agent.name} 任务数量数据失败:`, error)
      agent.tasks = { completed: 0, inProgress: 0, total: 0 }
    }
  }

  /**
   * 获取单个智能体的任务列表
   * @param {SmartAgent} agent - 智能体对象
   */
  const fetchAgentTaskLists = async (agent) => {
    const domain = BUSINESS_DOMAINS[agent.id]
    if (!domain) return

    try {
      const [inProgressListResult, completedListResult, allListResult] = await Promise.all([
        cozeWorkflowService.runWorkflow(WORKFLOW_IDS.GET_TASK_LIST, {
          status: '1',
          businessDomain: domain
        }),
        cozeWorkflowService.runWorkflow(WORKFLOW_IDS.GET_TASK_LIST, {
          status: '2',
          businessDomain: domain
        }),
        cozeWorkflowService.runWorkflow(WORKFLOW_IDS.GET_TASK_LIST, {
          status: '5',
          businessDomain: domain
        })
      ])

      taskListsByAgent.value[agent.id] = {
        inProgress: parseTaskListFromResult(inProgressListResult),
        completed: parseTaskListFromResult(completedListResult),
        all: parseTaskListFromResult(allListResult)
      }
    } catch (error) {
      console.error(`获取 ${agent.name} 任务列表失败:`, error)
      taskListsByAgent.value[agent.id] = { all: [], completed: [], inProgress: [] }
    }
  }

  /**
   * 处理智能大脑功能选择，获取所有智能体数据
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const handleSmartBrainSelection = async (addMessageCallback) => {
    try {
      if (typeof addMessageCallback === 'function') {
        addMessageCallback('正在查询智能体任务数据...', 'system')
      }

      const fetchPromises = smartAgents.value.map(async (agent) => {
        await fetchAgentTaskCounts(agent)
        await fetchAgentTaskLists(agent)
      })

      await Promise.all(fetchPromises)

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
      if (activeFunction.value === 'ownerSuppliedMaterialParsing') {
        // 甲供物资文件使用新的上传接口，并保留 excel_type
        return uploadFile(file.raw).then((res) => ({
          filePath: res.filePath,
          excel_type: file.excel_type
        }))
      } else {
        // 其他文件保持原有逻辑
        return cozeWorkflowService.uploadFile(file.raw, COMMON_APP_ID)
      }
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
   * @param {Array<{file_id: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const handleContractParsing = (inputs, context) => {
    const { workflow, loadingMessage, addMessageCallback } = context
    const finalResult = []
    let isFirstMessage = true

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    cozeParsingService.runContractParsing(WORKFLOW_IDS.CONTRACT_PARSING, inputs, {
      onMessage(event) {
        if (isFirstMessage) {
          loadingMessage.content = '任务解析已开始，正在接收数据...'
          addMessageCallback(streamingAgentMessage)
          isFirstMessage = false
        }

        const { potentialTaskId, messageContent } = parseWorkflowMessage(event)

        if (potentialTaskId) {
          taskId.value = potentialTaskId
          streamingAgentMessage.task = potentialTaskId
          return
        }

        if (messageContent) {
          chatStore.appendStreamContent(streamingAgentMessage.id, messageContent)
          finalResult.push(messageContent)
        }

        if (event.event === 'Done') {
          delete streamingAgentMessage.isStreaming
          if (!/在数据库中已存在，无需再次解析/.test(streamingAgentMessage.content)) {
            streamingAgentMessage.showViewResultButton = true
          }
          if (progressManager) progressManager.stop()
          loadingMessage.progress = 100
          loadingMessage.content = '任务执行完毕！'
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        } else if (event.event === 'Error') {
          handleExecutionError(new Error(event.data), loadingMessage, addMessageCallback)
        }
      }
    })
  }

  /**
   * 处理乙供物资解析工作流
   * @param {Array<{file_id: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const handleSupplierMaterialParsing = (inputs, context) => {
    const { workflow, loadingMessage, addMessageCallback } = context
    const finalResult = []
    let isFirstMessage = true

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    cozeParsingService.runSupplierMaterialParsing(WORKFLOW_IDS.SUPPLIER_MATERIAL_PARSING, inputs, {
      onMessage(event) {
        if (isFirstMessage) {
          loadingMessage.content = '任务解析已开始，正在接收数据...'
          addMessageCallback(streamingAgentMessage)
          isFirstMessage = false
        }

        const { potentialTaskId, messageContent, parsedMessage } = parseWorkflowMessage(event)

        if (parsedMessage) {
          if (parsedMessage.task_id) {
            supplierTaskId.value = parsedMessage.task_id
          }
          if (Array.isArray(parsedMessage.task_detail_id)) {
            supplierFileDetailIds.value = parsedMessage.task_detail_id
          }
        }

        if (potentialTaskId) {
          streamingAgentMessage.task = potentialTaskId
          return
        }

        if (messageContent) {
          chatStore.appendStreamContent(streamingAgentMessage.id, messageContent)
          finalResult.push(messageContent)
        }

        if (event.event === 'Done') {
          delete streamingAgentMessage.isStreaming
          if (!/在数据库中已存在，无需再次解析/.test(streamingAgentMessage.content)) {
            streamingAgentMessage.showViewResultButton = true
          }
          if (progressManager) progressManager.stop()
          loadingMessage.progress = 100
          loadingMessage.content = '任务执行完毕！'
          ElMessage.success('乙供物资解析完成')
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        } else if (event.event === 'Error') {
          handleExecutionError(new Error(event.data), loadingMessage, addMessageCallback)
        }
      }
    })
  }

  /**
   * 处理甲供物资解析工作流
   * @param {Array<{file_id: string}|{file_path: string}>} inputs - 文件输入
   * @param {Object} context - 包含 workflow, loadingMessage, addMessageCallback 的上下文
   */
  const handleOwnerMaterialParsing = async (inputs, context) => {
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

      await callStreamWorkflow({ ...inputs, parseOnly: true }, '2', {
        onMessage: (event) => {
          if (event.content) {
            let parsedContent = null

            try {
              // 尝试直接解析 event.content 为 JSON 对象
              parsedContent = JSON.parse(event.content)

              // 你可以在这里根据结构确认是期望的格式
              if (parsedContent.taskId) {
                taskId.value = parsedContent.taskId
                streamingAgentMessage.task = parsedContent.taskId
                ownerMaterialStore.setTask(parsedContent.taskId)
              }
            } catch (e) {
              console.log('消息 JSON 解析失败，尝试旧格式:', e)
            }

            // 如果解析成功
            if (parsedContent) {
              if (parsedContent.llmReport) {
                // 处理 llmReport 格式的内容
                let reportText = '# 甲供物资解析报告\n\n'

                Object.entries(parsedContent.llmReport).forEach(([category, content]) => {
                  reportText += `## ${category}\n`
                  if (typeof content === 'object') {
                    Object.entries(content).forEach(([subcategory, details]) => {
                      reportText += `**${subcategory}**: ${details}\n\n`
                    })
                  } else {
                    reportText += `${content}\n\n`
                  }
                })

                chatStore.appendStreamContent(streamingAgentMessage.id, reportText)
                finalResult.push(reportText)
              } else if (parsedContent.text) {
                // 普通文本内容
                chatStore.appendStreamContent(streamingAgentMessage.id, parsedContent.text)
                finalResult.push(parsedContent.text)
              }
            } else {
              // 回退旧格式解析逻辑
              const { parsedMessage, messageContent } = parseWorkflowMessage({
                event: 'Message',
                data: { content_type: 'text', content: event.content }
              })

              if (parsedMessage) {
                if (parsedMessage.task_id) {
                  taskId.value = parsedMessage.task_id
                  streamingAgentMessage.task = parsedMessage.task_id
                  ownerMaterialStore.setTask(parsedMessage.task_id)
                }

                if (parsedMessage.result) {
                  const output = {
                    materials: parsedMessage.result.materials || [],
                    flattened: parsedMessage.result.flattened || [],
                    unmatched: parsedMessage.result.unmatched || [],
                    taskId: parsedMessage.task_id
                  }
                  if (output.unmatched.length > 0) {
                    output.message = '存在无法匹配的物资信息，请人工介入'
                  }
                  const text = JSON.stringify(output, null, 2)
                  chatStore.appendStreamContent(streamingAgentMessage.id, text)
                  finalResult.push(text)
                }
              } else if (messageContent) {
                chatStore.appendStreamContent(streamingAgentMessage.id, messageContent)
                finalResult.push(messageContent)
              }
            }
          }
        },
        onError: (error) => {
          handleExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          delete streamingAgentMessage.isStreaming
          // 甲供物资解析第一个工作流不显示查看解析结果按钮
          // if (!/在数据库中已存在，无需再次解析/.test(streamingAgentMessage.content)) {
          //   streamingAgentMessage.showViewResultButton = true
          // }
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
      handleExecutionError(error, loadingMessage, addMessageCallback)
    }
  }

  /**
   * 处理甲供物资重新解析工作流（第二个工作流）
   * @param {string} taskId - 任务ID
   * @param {function} addMessageCallback - 添加消息的回调
   */
  const executeOwnerMaterialReparse = async (taskId, addMessageCallback) => {
    const finalResult = []

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
      workflow: { id: '4', name: '甲供物资重新解析' },
      isStreaming: true
    }

    try {
      addMessageCallback(loadingMessage)
      addMessageCallback(streamingAgentMessage)

      await callStreamWorkflow({ taskId }, '4', {
        onMessage: (event) => {
          if (event.content) {
            let parsedContent = null

            try {
              // 尝试直接解析 event.content 为 JSON 对象
              parsedContent = JSON.parse(event.content)

              // 处理新格式的响应数据

              streamingAgentMessage.task = taskId

              // 处理 llmReport 数据 - 只保存到store，不显示
              if (parsedContent.llmReport) {
                ownerMaterialStore.setLlmReport(taskId, parsedContent.llmReport)
              }

              // 处理其他内容用于显示
              if (parsedContent.text) {
                chatStore.appendStreamContent(streamingAgentMessage.id, parsedContent.text)
                finalResult.push(parsedContent.text)
              }
            } catch (e) {
              console.log('消息 JSON 解析失败，尝试旧格式:', e)
            }

            // 如果新格式解析失败，回退到旧格式解析逻辑
            if (!parsedContent) {
              const { parsedMessage, messageContent } = parseWorkflowMessage({
                event: 'Message',
                data: { content_type: 'text', content: event.content }
              })

              if (parsedMessage) {
                streamingAgentMessage.task = taskId

                if (parsedMessage.result) {
                  const output = {
                    materials: parsedMessage.result.materials || [],
                    flattened: parsedMessage.result.flattened || [],
                    unmatched: parsedMessage.result.unmatched || [],
                    taskId: parsedMessage.task_id
                  }
                  if (output.unmatched.length > 0) {
                    output.message = '存在无法匹配的物资信息，请人工介入'
                  }
                  const text = JSON.stringify(output, null, 2)
                  chatStore.appendStreamContent(streamingAgentMessage.id, text)
                  finalResult.push(text)
                }
              } else if (messageContent) {
                chatStore.appendStreamContent(streamingAgentMessage.id, messageContent)
                finalResult.push(messageContent)
              }
            }
          }
        },
        onError: (error) => {
          handleExecutionError(error, loadingMessage, addMessageCallback)
        },
        onComplete: () => {
          delete streamingAgentMessage.isStreaming
          // 重新解析完成后显示查看详情按钮
          streamingAgentMessage.showViewResultButton = true
          loadingMessage.progress = 100
          loadingMessage.content = '甲供物资重新解析任务执行完毕！'
          ElMessage.success('甲供物资重新解析完成')
          finalizeWorkflowExecution({ output: finalResult.join('\n') }, addMessageCallback)
        }
      })
    } catch (error) {
      handleExecutionError(error, loadingMessage, addMessageCallback)
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
        // For other workflows, create a list of file_id objects
        inputs = fileIdsOrPaths.map((idOrPath) => ({ file_id: idOrPath }))
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
          handleContractParsing(inputs, context)
          break
        case 'supplierMaterialParsing':
          handleSupplierMaterialParsing(inputs, context)
          break
        case 'ownerSuppliedMaterialParsing':
          handleOwnerMaterialParsing(inputs, context)
          break
        default:
          throw new Error(`Unsupported function ID: ${func.id}`)
      }
    } catch (error) {
      handleExecutionError(error, loadingMessage, addMessageCallback)
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

  const handleFunctionSelect = async (key, addMessageCallback) => {
    if (key === 'smartBrain') {
      await handleSmartBrainSelection(addMessageCallback)
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
    taskListsByAgent,
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
    handleFunctionSelect,
    executeWorkflow,
    executeOwnerMaterialReparse,
    finalizeWorkflowExecution,
    startWorkflowFromDialog,
    resetWorkflowConfig,
    clearHistory,
    exportHistory,
    viewExecutionDetail,
    setTaskId,
    setSupplierFileIds
  }
})
