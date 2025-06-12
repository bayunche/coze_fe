import { CozeAPI } from '@coze/api'

class CozeService {
  /**
   * @param {string} apiKey - Your Coze API key.
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Coze API key is required.')
    }
    this.apiKey = apiKey
    this.client = new CozeAPI({
      baseURL: 'https://api.coze.cn',
      token: apiKey,
      baseWsURL: 'wss://api.coze.cn',
      allowPersonalAccessTokenInBrowser: true
    })
  }

  /**
   * Uploads a file to Coze using the REST API.
   * @param {File} file - The file to upload.
   * @returns {Promise<string>} The ID of the uploaded file.
   */
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.coze.cn/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`File upload failed: ${errorData.msg || response.statusText}`)
    }

    const result = await response.json()
    if (result.code !== 0) {
      throw new Error(`File upload failed: ${result.msg}`)
    }
    return result.data.id
  }

  /**
   * Runs a workflow using the Coze SDK and handles events as a stream.
   * @param {string} workflowId - The ID of the workflow to run.
   * @param {object} input - The input data for the workflow.
   * @param {object} callbacks - An object containing callback functions.
   * @param {function} callbacks.onMessage - Called for each message from the stream.
   * @param {function} callbacks.onError - Called when an error occurs.
   * @param {function} callbacks.onEnd - Called when the stream is closed.
   * @param {string} user - A unique identifier for the user.
   * @returns {object} The stream object, which may have methods like `abort()`.
   */
  async _runWorkflow(workflowId, input, callbacks, appId) {
    try {
      const params = {
        workflow_id: workflowId,
        parameters: input,
        app_id: appId
      }

      const stream = await this.client.workflows.runs.stream(params)
      // message 事件：每个迭代就是一个 message
      for await (const message of stream) {
        if (callbacks.onMessage) callbacks.onMessage(message)
      }
      // end 事件：流结束，由调用方根据特定事件（如 'Done'）处理
      return stream
    } catch (error) {
      console.error('Error starting workflow stream:', error)
      if (callbacks.onError) callbacks.onError(error)
      throw error
    }
  }

  runContractParsing(fileId, callbacks) {
    const workflowId = '7514492004446650422' // 解析合同
    const input = { input: fileId }
    return this._runWorkflow(workflowId, input, callbacks)
  }

  runChat(input, callbacks) {
    const workflowId = '7514492004446650422' // 问答生成 (临时使用合同解析ID)
    return this._runWorkflow(workflowId, { input: input.query }, callbacks)
  }

  runAnalysis(input, callbacks) {
    const workflowId = 'YOUR_ANALYSIS_WORKFLOW_ID' // 统计分析
    return this._runWorkflow(workflowId, input, callbacks)
  }

  runDocuments(input, callbacks) {
    const workflowId = 'YOUR_DOCUMENTS_WORKFLOW_ID' // 文档摘要
    return this._runWorkflow(workflowId, input, callbacks)
  }

  runSearch(input, callbacks) {
    const workflowId = 'YOUR_SEARCH_WORKFLOW_ID' // 语义搜索
    return this._runWorkflow(workflowId, input, callbacks)
  }

  runAutomation(input, callbacks) {
    const workflowId = 'YOUR_AUTOMATION_WORKFLOW_ID' // 批处理任务
    return this._runWorkflow(workflowId, input, callbacks)
  }

  /**
   * Runs a non-streaming workflow to generate table data.
   * @param {string} textInput - The text input for the workflow, which is the result of the previous workflow.
   * @returns {Promise<object>} The result of the workflow run.
   */
  async runTableGenerationWorkflow(taskId) {
    const workflowId = '7514499089367908386' // 表格生成工作流
    const params = {
      workflow_id: workflowId,
      parameters: { task_id: taskId, keyWords: '' },
      bot_id: '7514499089367908385'
    }
    try {
      const workflow = await this.client.workflows.runs.create(params)
      return workflow
    } catch (error) {
      console.error('Error running table generation workflow:', error)
      throw error
    }
  }

  /**
   * Runs a non-streaming workflow to edit a single record.
   * @param {object} modifiedObject - The object containing the modified data.
   * @returns {Promise<object>} The result of the workflow run.
   */
  async runEditWorkflow(modifiedObject) {
    const workflowId = '7514711058864259113' // 编辑工作流
    const params = {
      workflow_id: workflowId,
      parameters: { modify_json: modifiedObject },
      bot_id: '7514499089367908385'
    }
    try {
      const workflow = await this.client.workflows.runs.create(params)
      return workflow
    } catch (error) {
      console.error('Error running edit workflow:', error)
      throw error
    }
  }

  /**
   * Runs a non-streaming workflow to confirm a single record.
   * @param {object} parameters - The parameters for the workflow, e.g., { id: '...' }.
   * @returns {Promise<object>} The result of the workflow run.
   */
  async runConfirmWorkflow(parameters) {
    const workflowId = '7514863217953964095' // 确认工作流
    const params = {
      workflow_id: workflowId,
      parameters: parameters,
      bot_id: '7514499089367908385'
    }
    try {
      const workflow = await this.client.workflows.runs.create(params)
      return workflow
    } catch (error) {
      console.error('Error running confirm workflow:', error)
      throw error
    }
  }
}

export default CozeService
