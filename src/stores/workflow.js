import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { functions } from '@/uitls/workflows.js';
import CozeWorkflowService from '@/services/CozeWorkflowService';
import CozeParsingService from '@/services/CozeParsingService';
import { formatDuration, generateMockResult } from '@/utils/helpers';

/**
 * @typedef {Object} FunctionParam
 * @property {string} key - 参数的键名
 * @property {string} label - 参数的显示名称
 * @property {string} type - 参数类型 ('text', 'number', 'boolean', 'select')
 * @property {boolean} [required] - 是否必填
 * @property {Array<{label: string, value: any}>} [options] - 当 type 为 'select' 时的选项
 * @property {number} [min] - 当 type 为 'number' 时的最小值
 * @property {number} [max] - 当 type 为 'number' 时的最大值
 */

/**
 * @typedef {Object} WorkflowFunction
 * @property {string} id - 功能ID
 * @property {string} name - 功能名称
 * @property {Array<Object>} steps - 工作流步骤
 * @property {boolean} [needsFiles] - 是否需要文件上传
 * @property {string} [allowedTypes] - 允许的文件类型，如 'application/pdf'
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

export const useWorkflowStore = defineStore('workflow', () => {
  /** @type {import('vue').Ref<boolean>} */
  const isSidebarOpen = ref(false); // 默认隐藏侧边栏
  /** @type {import('vue').Ref<string>} */
  const activeFunction = ref('');
  /** @type {import('vue').Ref<CurrentWorkflow | null>} */
  const currentWorkflow = ref(null);
  /** @type {import('vue').Ref<boolean>} */
  const isExecuting = ref(false);
  /** @type {import('vue').Ref<number>} */
  const workflowElapsedTime = ref(0);
  /** @type {import('vue').Ref<number>} */
  const currentStepIndex = ref(0);
  /** @type {import('vue').Ref<number>} */
  const stepProgress = ref(0);
  /** @type {import('vue').Ref<boolean>} */
  const showWorkflowConfig = ref(false);
  /** @type {import('vue').Reactive<ExecutionSession[]>} */
  const executionSessions = reactive([]);
  /** @type {import('vue').Reactive<CompletedExecution[]>} */
  const executionHistory = reactive([]); // 移动到这里
  /** @type {import('vue').Ref<Object | null>} */
  const lastExecutionResult = ref(null); // 新增 lastExecutionResult
  /** @type {import('vue').Ref<string | null>} */
  const taskId = ref(null); // 合同解析任务ID
  const supplierTaskId = ref(null); // 乙供物资解析任务ID
  /** @type {import('vue').Ref<string[]>} */
  const supplierFileDetailIds = ref([]); // 乙供物资解析文件详情IDs

  // 智能大脑相关状态
  /** @type {import('vue').Ref<SmartAgent[]>} */
  const smartAgents = ref(
    functions
      .filter(
        (f) =>
          f.id === 'contractParsing' ||
          f.id === 'supplierMaterialParsing' ||
          f.id === 'ownerSuppliedMaterialParsing'
      )
      .map((f) => ({
        id: f.id,
        name: f.name,
        status: 'online',
        tasks: { completed: 0, inProgress: 0, total: 0 },
      }))
  );
  /** @type {import('vue').Ref<Object.<string, TaskList>>} */
  const taskListsByAgent = ref({});

  const cozeWorkflowService = new CozeWorkflowService();
  const cozeParsingService = new CozeParsingService();

  let timeInterval = null;
  let loadingInterval = null;

  // Getters
  /**
   * 获取当前激活功能的名称
   * @returns {string} 功能名称
   */
  const getCurrentFunctionName = () => {
    const func = functions.find((f) => f.id === activeFunction.value);
    return func ? func.name : '未知功能';
  };

  /**
   * 获取当前激活的功能对象
   * @returns {WorkflowFunction | undefined} 功能对象
   */
  const getCurrentFunction = () => {
    return functions.find((f) => f.id === activeFunction.value);
  };

  /**
   * 获取当前激活功能的参数列表
   * @returns {Array<FunctionParam>} 参数列表
   */
  const getCurrentFunctionParams = () => {
    const func = getCurrentFunction();
    return func ? func.params || [] : [];
  };

  /**
   * 判断当前功能是否需要文件上传
   * @returns {boolean} 是否需要文件上传
   */
  const needsFileUpload = () => {
    const func = getCurrentFunction();
    return func ? func.needsFiles : false;
  };

  /**
   * 获取当前功能允许的文件类型
   * @returns {string} 允许的文件类型字符串
   */
  const getAllowedFileTypes = () => {
    const func = getCurrentFunction();
    return func ? func.allowedTypes || '*' : '*';
  };

  // Actions
  /**
   * 设置当前任务ID
   * @param {string} id - 任务ID
   */
  const setTaskId = (id) => {
    taskId.value = id;
  };

  /**
   * 设置乙供物资文件详情ID列表
   * @param {string[]} ids - 文件详情ID列表
   */
  const setSupplierFileIds = (ids) => {
    supplierFileDetailIds.value = ids;
  };

  /**
   * 处理功能选择
   * @param {string} key - 功能ID
   * @param {function(string, string, WorkflowInfo | null, Object | null, Object): void} addMessageCallback - 添加消息的回调函数
   */
  const handleFunctionSelect = async (key, addMessageCallback) => {
    if (key === 'smartBrain') {
      try {
        addMessageCallback('正在查询智能体任务数据...', 'system');

        const getTaskCountsWorkflowId = '7517560875563204627';
        const getTaskListWorkflowId = '7517283953213866036';
        const businessDomains = {
          contractParsing: 'contract',
          supplierMaterialParsing: 'y_material',
          ownerSuppliedMaterialParsing: 'j_material',
        };

        /**
         * 解析工作流输出的任务列表
         * @param {Object} result - 工作流执行结果
         * @returns {Array<Object>} 任务列表
         */
        const getTaskList = (result) => {
          try {
            const data = result?.data;
            if (!data) return [];
            const output = JSON.parse(data).output;
            if (!output) return [];
            if (Array.isArray(output)) return output;
            if (typeof output === 'string') {
              const parsed = JSON.parse(output);
              return Array.isArray(parsed) ? parsed : [];
            }
            return [];
          } catch (e) {
            console.error('Failed to parse workflow output:', e, result?.data);
            return [];
          }
        };

        /** @type {import('vue').Ref<SmartAgent[]>} */
        const smartAgents = ref(
          functions
            .filter(
              (f) =>
                f.id === 'contractParsing' ||
                f.id === 'supplierMaterialParsing' ||
                f.id === 'ownerSuppliedMaterialParsing'
            )
            .map((f) => ({
              id: f.id,
              name: f.name,
              status: 'online',
              tasks: { completed: 0, inProgress: 0, total: 0 },
            }))
        );

        /** @type {import('vue').Ref<Object.<string, TaskList>>} */
        const taskListsByAgent = ref({});

        const fetchPromises = smartAgents.value.map(async (agent) => {
          const domain = businessDomains[agent.id];
          if (domain) {
            try {
              const countResult = await cozeWorkflowService.runWorkflow(getTaskCountsWorkflowId, {
                businessDomain: domain,
              });
              if (countResult && countResult.data) {
                try {
                  const outerParsed = JSON.parse(countResult.data);
                  if (outerParsed && outerParsed.output) {
                    const innerParsed = JSON.parse(outerParsed.output);
                    const domainData = innerParsed.find((item) => item.BUSINESS_DOMAIN === domain);
                    if (domainData) {
                      agent.tasks.completed = parseInt(domainData.finished_count) || 0;
                      agent.tasks.inProgress = parseInt(domainData.running_count) || 0;
                      agent.tasks.total = parseInt(domainData.total_count) || 0;
                    }
                  }
                } catch (parseError) {
                  console.error(`解析 ${agent.name} 任务数量数据失败:`, parseError, countResult.data);
                }
              }

              const [inProgressListResult, completedListResult, allListResult] = await Promise.all([
                cozeWorkflowService.runWorkflow(getTaskListWorkflowId, {
                  status: '1',
                  businessDomain: domain,
                }),
                cozeWorkflowService.runWorkflow(getTaskListWorkflowId, {
                  status: '2',
                  businessDomain: domain,
                }),
                cozeWorkflowService.runWorkflow(getTaskListWorkflowId, {
                  status: '5',
                  businessDomain: domain,
                }),
              ]);

              taskListsByAgent.value[agent.id] = {
                inProgress: getTaskList(inProgressListResult),
                completed: getTaskList(completedListResult),
                all: getTaskList(allListResult),
              };
            } catch (error) {
              console.error(`获取 ${agent.name} 数据失败:`, error);
              agent.tasks.completed = 0;
              agent.tasks.inProgress = 0;
              agent.tasks.total = 0;
              taskListsByAgent.value[agent.id] = { all: [], completed: [], inProgress: [] };
            }
          }
        });

        await Promise.all(fetchPromises);

        ElMessage.success('智能体任务数据查询成功！');
      } catch (error) {
        console.error('查询智能大脑数据失败:', error);
        ElMessage.error('查询智能大脑数据失败，请稍后重试。');
      }
      return;
    }
    activeFunction.value = key;
    resetWorkflowConfig();
    showWorkflowConfig.value = true;
  };

  /** @type {import('vue').Reactive<WorkflowConfig>} */
  const workflowConfig = reactive({
    files: [],
    params: {},
    concurrent: false,
    errorHandling: 'stop',
  });

  /**
   * 执行工作流
   * @param {function(Object): void} addMessageCallback - 添加消息的回调函数
   */
  const executeWorkflow = async (addMessageCallback) => {
    const func = getCurrentFunction();
    if (!func) return;

    if (func.needsFiles && workflowConfig.files.length === 0) {
      ElMessage.warning('请先上传文件');
      showWorkflowConfig.value = true;
      return;
    }

    /** @type {CurrentWorkflow} */
    const workflow = {
      id: Date.now(),
      name: `${func.name}`,
      function: func.name,
      steps: func.steps,
      startTime: Date.now(),
    };

    currentWorkflow.value = workflow;
    isExecuting.value = true;
    currentStepIndex.value = 0;
    stepProgress.value = 0;
    workflowElapsedTime.value = 0;

    /** @type {Object} */
    const loadingMessage = reactive({
      id: Date.now() + Math.random(),
      from: 'agent',
      type: 'loading',
      content: '正在准备任务，请稍候...',
      progress: 0,
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
    });
    addMessageCallback(loadingMessage);

    let progress = 0;
    const progressIncrement = func.id === 'contractParsing' ? 0.25 : 0.5; // 合同0.25%/300ms, 乙供0.5%/300ms
    const maxProgress = 99;
    
    loadingInterval = setInterval(() => {
      if (progress < maxProgress) {
        progress += progressIncrement;
        loadingMessage.progress = Math.min(progress, maxProgress);
      } else {
        clearInterval(loadingInterval);
      }
    }, 300); // 每300ms更新一次进度

    timeInterval = setInterval(() => {
      const elapsed = (Date.now() - workflow.startTime) / 1000;
      workflowElapsedTime.value = formatDuration(elapsed);
      const currentSession = executionSessions.find((s) => s.id === workflow.id);
      if (currentSession) {
        currentSession.duration = workflowElapsedTime.value;
      }
    }, 100);

    try {
      currentStepIndex.value = 0; // 上传文件
      const appId = '7509762183313129512'; // 使用与工作流相同的appId
      const uploadPromises = workflowConfig.files.map((file) =>
        cozeWorkflowService.uploadFile(file.raw, appId)
      );
      const fileIds = await Promise.all(uploadPromises);
      stepProgress.value = 100;
      currentStepIndex.value = 1; // 文件解析
      /** @type {Array<{file_id: string}>} */
      let inputs = [];
      fileIds.forEach((fileId) => {
        inputs.push({ file_id: fileId });
      });

      executionSessions.push({
        id: workflow.id,
        name: workflow.name,
        status: 'running',
        duration: '0.0s',
        output: '正在执行，请稍候...',
      });

      /** @type {Object} */
      const streamingAgentMessage = {
        id: Date.now() + Math.random(),
        from: 'agent',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        sender: workflow.name,
        workflow: { id: workflow.id, name: workflow.name },
        isStreaming: true,
      };

      /** @type {Array<string>} */
      const finalResult = [];
      let isFirstMessage = true;

      if (func.id === 'contractParsing') {
        const workflowId = '7516796514431172642'; // 合同解析的实际工作流ID
        cozeParsingService.runContractParsing(workflowId, inputs, {
          onMessage(event) {
            if (isFirstMessage) {
              loadingMessage.content = '任务解析已开始，正在接收数据...';
              addMessageCallback(streamingAgentMessage);
              isFirstMessage = false;
            }

            if (event.event === 'Message' && event.data.content_type === 'text') {
              const content = event.data.content;
              let taskIdCandidate = null;
              let displayText = null;

              if (typeof content === 'object' && content !== null) {
                taskIdCandidate = content.task_id;
                if (!taskIdCandidate) displayText = JSON.stringify(content, null, 2);
              } else if (typeof content === 'string') {
                try {
                  const parsed = JSON.parse(content);
                  taskIdCandidate = parsed?.task_id;
                  if (!taskIdCandidate) displayText = content;
                } catch (e) {
                  displayText = content;
                }
              }

              if (taskIdCandidate) {
                taskId.value = taskIdCandidate; // 直接设置合同解析taskId
                return;
              }

              if (displayText) {
                streamingAgentMessage.content += displayText;
                finalResult.push(displayText);
                const currentSession = executionSessions.find((s) => s.id === workflow.id);
                if (currentSession) {
                  currentSession.output = streamingAgentMessage.content;
                }
              }
            } else if (event.event === 'Done') {
              delete streamingAgentMessage.isStreaming;
              loadingMessage.progress = 100;
              loadingMessage.content = '任务执行完毕！';
              clearInterval(loadingInterval);
              completeWorkflow({ output: finalResult.join('\n') }, addMessageCallback);
            } else if (event.event === 'PING') {
              // Handle PING
            } else {
              addMessageCallback('未知任务事件', 'system', null, event);
            }
          },
          onError(error) {
            clearInterval(loadingInterval);
            loadingMessage.content = `任务出错: ${error.message}`;
            loadingMessage.progress = 100;
            addMessageCallback(`任务执行出错: ${error.message}`, 'system');
            completeWorkflow({ status: 'error', output: error.message }, addMessageCallback);
          },
        });
      } else if (func.id === 'supplierMaterialParsing') {
        const workflowId = '7517934954761715721'; // 乙供物资解析的实际工作流ID
        cozeParsingService.runSupplierMaterialParsing(workflowId, inputs, {
          onMessage(event) {
            if (isFirstMessage) {
              loadingMessage.content = '任务解析已开始，正在接收数据...';
              addMessageCallback(streamingAgentMessage);
              isFirstMessage = false;
            }

            if (event.event === 'Message' && event.data.content_type === 'text') {
              const content = event.data.content;
              let taskIdCandidate = null;
              let displayText = null;
              let parsedContent = null;

              if (typeof content === 'string') {
                try {
                  parsedContent = JSON.parse(content);
                } catch (e) {
                  displayText = content;
                }
              } else if (typeof content === 'object' && content !== null) {
                parsedContent = content;
              }

              if (parsedContent) {
                taskIdCandidate = parsedContent?.task_id;
                if (parsedContent?.task_id) {
                  supplierTaskId.value = parsedContent.task_id; // 设置乙供物资taskId
                }
                if (Array.isArray(parsedContent?.task_detail_id)) {
                  setSupplierFileIds(parsedContent.task_detail_id); // 使用新的 action
                }
                if (!taskIdCandidate && !displayText) {
                  displayText = JSON.stringify(parsedContent, null, 2);
                }
              }

              if (taskIdCandidate) {
                streamingAgentMessage.task = taskIdCandidate;
                return;
              }

              if (displayText) {
                streamingAgentMessage.content += displayText;
                finalResult.push(displayText);
                const currentSession = executionSessions.find((s) => s.id === workflow.id);
                if (currentSession) {
                  currentSession.output = streamingAgentMessage.content;
                }
              }
            } else if (event.event === 'Done') {
              delete streamingAgentMessage.isStreaming;
              streamingAgentMessage.showViewResultButton = true;
              loadingMessage.progress = 100;
              loadingMessage.content = '任务执行完毕！';
              clearInterval(loadingInterval);
              ElMessage.success(`乙供物资解析完成`);
              completeWorkflow({ output: finalResult.join('\n') }, addMessageCallback);
            } else if (event.event === 'PING') {
              // Handle PING
            } else {
              addMessageCallback('未知任务事件', 'system', null, event);
            }
          },
          onError(error) {
            clearInterval(loadingInterval);
            loadingMessage.content = `任务出错: ${error.message}`;
            loadingMessage.progress = 100;
            addMessageCallback(`任务执行出错: ${error.message}`, 'system');
            completeWorkflow({ status: 'error', output: error.message }, addMessageCallback);
          },
        });
      } else if (func.id === 'ownerSuppliedMaterialParsing') {
        const workflowId = 'mock_owner_material_parsing_workflow_id'; // 甲供物资解析的实际工作流ID
        executeOwnerMaterialParsingWorkflow(
          workflowId, // 传入 workflowId
          inputs,
          loadingMessage,
          streamingAgentMessage,
          finalResult,
          workflow,
          addMessageCallback,
          setTaskId
        );
      } else {
        throw new Error(`Unsupported function ID: ${func.id}`);
      }
    } catch (error) {
      clearInterval(loadingInterval);
      loadingMessage.content = `任务失败: ${error.message}`;
      loadingMessage.progress = 100;
      addMessageCallback(`任务执行失败: ${error.message}`, 'system');
      completeWorkflow({}, addMessageCallback);
    }
  };

  /**
   * 执行甲供物资解析工作流
   * @param {string} workflowId - 工作流ID
   * @param {Array<{file_id: string}>} inputs - 文件输入列表
   * @param {Object} loadingMessage - 加载消息对象
   * @param {Object} streamingAgentMessage - 流式代理消息对象
   * @param {Array<string>} finalResult - 最终结果数组
   * @param {CurrentWorkflow} workflow - 当前工作流对象
   * @param {function(Object): void} addMessageCallback - 添加消息的回调函数
   * @param {function(string): void} setTaskIdCallback - 设置任务ID的回调函数
   */
  const executeOwnerMaterialParsingWorkflow = async (
    workflowId,
    inputs,
    loadingMessage,
    streamingAgentMessage,
    finalResult,
    workflow,
    addMessageCallback,
    setTaskIdCallback
  ) => {
    try {
      await cozeWorkflowService.runWorkflow(
        workflowId,
        {
          file_ids: inputs.map((input) => input.file_id),
          ...workflowConfig.params,
        },
        {
          onMessage(event) {
            if (event.event === 'Message' && event.data.content_type === 'text') {
              const content = event.data.content;
              let taskIdCandidate = null;
              let displayText = null;

              if (typeof content === 'object' && content !== null) {
                taskIdCandidate = content.task_id;
                if (!taskIdCandidate) displayText = JSON.stringify(content, null, 2);
              } else if (typeof content === 'string') {
                try {
                  const parsed = JSON.parse(content);
                  taskIdCandidate = parsed?.task_id;
                  if (!taskIdCandidate) displayText = content;
                } catch (e) {
                  displayText = content;
                }
              }

              if (taskIdCandidate) {
                setTaskIdCallback(taskIdCandidate);
                return;
              }

              if (displayText) {
                streamingAgentMessage.content += displayText;
                finalResult.push(displayText);
                const currentSession = executionSessions.find((s) => s.id === workflow.id);
                if (currentSession) {
                  currentSession.output = streamingAgentMessage.content;
                }
              }
            } else if (event.event === 'Done') {
              delete streamingAgentMessage.isStreaming;
              loadingMessage.progress = 100;
              loadingMessage.content = '甲供物资解析任务执行完毕！';
              clearInterval(loadingInterval);
              completeWorkflow({ output: finalResult.join('\n') }, addMessageCallback);
            } else if (event.event === 'PING') {
              // Handle PING
            } else {
              addMessageCallback('未知任务事件', 'system', null, event);
            }
          },
          onError(error) {
            clearInterval(loadingInterval);
            loadingMessage.content = `甲供物资解析任务出错: ${error.message}`;
            loadingMessage.progress = 100;
            addMessageCallback(`甲供物资解析任务执行出错: ${error.message}`, 'system');
            completeWorkflow({ status: 'error', output: error.message }, addMessageCallback);
          },
        }
      );
    } catch (error) {
      clearInterval(loadingInterval);
      loadingMessage.content = `甲供物资解析任务失败: ${error.message}`;
      loadingMessage.progress = 100;
      addMessageCallback(`甲供物资解析任务执行失败: ${error.message}`, 'system');
      completeWorkflow({}, addMessageCallback);
    }
  };

  /**
   * 完成工作流执行
   * @param {Object} [resultOverride={}] - 覆盖结果的对象
   * @param {function(string, string, Object | null, Object | null, Object): void} addMessageCallback - 添加消息的回调函数
   */
  const completeWorkflow = (resultOverride = {}, addMessageCallback) => {
    if (!currentWorkflow.value) return;

    clearInterval(timeInterval);
    clearInterval(loadingInterval);

    const duration = formatDuration((Date.now() - currentWorkflow.value.startTime) / 1000);
    const func = getCurrentFunction();
    const result = generateMockResult(func, duration);

    /** @type {CompletedExecution} */
    const completedExecution = {
      id: currentWorkflow.value.id,
      workflow: currentWorkflow.value.name,
      function: getCurrentFunctionName(),
      status: 'success',
      duration,
      timestamp: new Date().toLocaleString(),
      output: result.output,
    };

    executionHistory.unshift(completedExecution);
    if (executionHistory.length > 20) executionHistory.pop();

    const currentSession = executionSessions.find((s) => s.id === currentWorkflow.value.id);
    if (currentSession) {
      Object.assign(currentSession, {
        ...result,
        id: completedExecution.id,
        ...resultOverride,
      });
    }
    currentWorkflow.value = null;
    isExecuting.value = false;
    currentStepIndex.value = 0;
    stepProgress.value = 0;
    workflowElapsedTime.value = 0;

    const isSuccess = resultOverride.status !== 'error';
    setTimeout(() => {
      let showButton = false;
      // 使用 this.taskId.value 或直接解构后的 taskId
      if (activeFunction.value === 'contractParsing' && taskId.value != null) {
        showButton = true;
      } else if (isSuccess && taskId.value != null) {
        showButton = true;
      }
      if (activeFunction.value === 'supplierMaterialParsing') {
        showButton = false;
      }
      addMessageCallback(
        `任务执行完成: ${completedExecution.workflow} (耗时: ${duration})`,
        'agent',
        { id: completedExecution.id, name: completedExecution.workflow },
        null,
        { showViewResultButton: showButton }
      );
      addMessageCallback(`--- 任务 ${completedExecution.workflow} 执行结束 ---`, 'system', {
        id: completedExecution.id,
        name: completedExecution.workflow,
      });
    }, 2000);
  };

  /**
   * 从对话框启动工作流
   * @param {function(Object): void} addMessageCallback - 添加消息的回调函数
   */
  const startWorkflowFromDialog = (addMessageCallback) => {
    const func = getCurrentFunction();
    if (!func) return;

    if (func.needsFiles && workflowConfig.files.length === 0) {
      ElMessage.warning('请先上传文件');
      return;
    }

    showWorkflowConfig.value = false;
    ElMessage.success('即将开始执行...');

    executeWorkflow(addMessageCallback);
  };

  /**
   * 重置工作流配置
   */
  const resetWorkflowConfig = () => {
    const func = getCurrentFunction();
    if (!func) return;

    const newParams = {};
    func.params.forEach((param) => {
      if (param.type === 'boolean') {
        newParams[param.key] = false;
      } else if (param.type === 'number') {
        newParams[param.key] = param.min || 0;
      } else if (param.type === 'select' && param.options?.length) {
        newParams[param.key] = param.options[0].value;
      } else {
        newParams[param.key] = '';
      }
    });
    workflowConfig.params = newParams;
    workflowConfig.files = [];
  };

  /**
   * 清空执行历史
   * @param {function(string, string): void} addMessageCallback - 添加消息的回调函数
   */
  const clearHistory = (addMessageCallback) => {
    executionHistory.splice(0);
    addMessageCallback('执行历史已清空', 'system');
    ElMessage.success('执行历史已清空');
  };

  /**
   * 导出执行历史
   * @param {function(string, string): void} addMessageCallback - 添加消息的回调函数
   */
  const exportHistory = (addMessageCallback) => {
    const data = JSON.stringify(executionHistory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution_history_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addMessageCallback('执行历史已导出', 'system');
  };

  /**
   * 查看执行详情
   * @param {CompletedExecution} row - 选中的执行历史行数据
   * @param {function(Object): void} setLastExecutionResultCallback - 设置最后执行结果的回调函数
   * @param {function(string, string): void} addMessageCallback - 添加消息的回调函数
   */
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
      files: [],
    });
    addMessageCallback(`查看执行详情: ${row.workflow}`, 'system');
  };

  return {
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
    getCurrentFunctionName,
    getCurrentFunction,
    getCurrentFunctionParams,
    needsFileUpload,
    getAllowedFileTypes,
    handleFunctionSelect,
    executeWorkflow,
    completeWorkflow,
    startWorkflowFromDialog,
    resetWorkflowConfig,
    clearHistory,
    exportHistory,
    viewExecutionDetail,
    setTaskId,
    setSupplierFileIds,
  };
});