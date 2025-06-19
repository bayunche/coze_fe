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
    const workflowId = '7516796514431172642' // 解析合同
    const input = { input: fileId }
    const appId = '7509762183313129512'
    return this._runWorkflow(workflowId, input, callbacks, appId)
  }

  async runChat(input, chatflowId, callbacks) {
    try {
      const additional_messages = [
        {
          role: 'user',
          type: 'question',
          content: input?.query,
          content_type: 'text'
        }
      ]
      const params = {
        workflow_id: chatflowId,
        parameters: {},
        app_id: '7509762183313129512',
        additional_messages: additional_messages
      }

      const stream = await this.client.workflows.chat.stream(params)
      // message 事件：每个迭代就是一个 message
      for await (const message of stream) {
        const { event, data } = message

        // We are interested in 'answer' type messages and the 'done' event.
        if (event === 'conversation.message.delta' && data.type === 'answer') {
          if (callbacks.onMessage) callbacks.onMessage(message)
        } else if (event === 'conversation.message.completed' && data.type === 'answer') {
          if (callbacks.onMessage) callbacks.onMessage(message)
        } else if (event === 'done') {
          if (callbacks.onMessage) callbacks.onMessage(message)
        } else if (event.startsWith('conversation.chat.')) {
          // Pass all chat status events
          if (callbacks.onMessage) callbacks.onMessage(message)
        }
        // This will filter out 'verbose' messages and other types we don't want to handle in the UI.
      }
      // end 事件：流结束，由调用方根据特定事件（如 'Done'）处理
      return stream
    } catch (error) {
      console.error('Error starting workflow stream:', error)
      if (callbacks.onError) callbacks.onError(error)
      throw error
    }
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
    const workflowId = '7517294942201610281' // 表格生成工作流
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
    const workflowId = '7517452946095947795' // 编辑工作流
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
    const workflowId = '7517473601378697254' // 确认工作流
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

  /**
   * Runs a generic non-streaming workflow.
   * @param {string} workflowId - The ID of the workflow to run.
   * @param {object} parameters - The parameters for the workflow.
   * @returns {Promise<object>} The result of the workflow run.
   */
  async runWorkflow(workflowId, parameters) {
    const params = {
      workflow_id: workflowId,
      parameters: parameters,
      app_id: '7509762183313129512' // Assuming a default app_id, adjust if necessary
    }
    try {
      const workflow = await this.client.workflows.runs.create(params)
      return workflow
    } catch (error) {
      console.error(`Error running workflow ${workflowId}:`, error)
      throw error
    }
  }
}

export default CozeService
