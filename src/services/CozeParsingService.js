// src/services/CozeParsingService.js
import  CozeService  from '@/uitls/coze.js'; // 假设 CozeService 仍然从这里导入

class CozeParsingService {
  constructor() {
    const apiKey = import.meta.env.VITE_COZE_API_KEY;
    if (!apiKey) {
      console.error('Coze API Key is not set. Please set VITE_COZE_API_KEY in your .env.local file.');
    }
    this.cozeService = new CozeService(apiKey);
    const appId = '7509762183313129512'; // 使用与工作流相同的appId
  }
   
  /**
   * 运行合同解析工作流
   * @param {string} workflowId - 工作流ID
   * @param {Array<object>} inputs - 文件ID数组，例如 [{ file_id: "xxx" }]
   * @param {object} callbacks - 回调函数对象 { onMessage, onError, onEnd }
   */
  async runContractParsing(workflowId, inputs, callbacks) {
    console.log('Running contract parsing with inputs:', inputs);
    return this.cozeService._runWorkflow(workflowId, { input: inputs}, callbacks,'7509762183313129512');
  }

  /**
   * 运行乙供物资解析工作流
   * @param {string} workflowId - 工作流ID
   * @param {Array<object>} inputs - 文件ID数组，例如 [{ file_id: "xxx" }]
   * @param {object} callbacks - 回调函数对象 { onMessage, onError, onEnd }
   */
  async runSupplierMaterialParsing(workflowId, inputs, callbacks) {
    return this.cozeService._runWorkflow(workflowId, { excelFileList:inputs }, callbacks,'7509762183313129512');
  }

  /**
   * 运行表格生成工作流 (用于获取解析结果详情)
   * @param {string} workflowId - 工作流ID
   * @param {string} taskId - 任务ID
   */
  async runTableGenerationWorkflow(workflowId, taskId) {
    return this.cozeService.runWorkflow(workflowId, { task_id: taskId },'7509762183313129512');
  }

  /**
   * 运行编辑工作流
   * @param {string} workflowId - 工作流ID
   * @param {object} payload - 编辑的数据
   */
  async runEditWorkflow(workflowId, payload) {
    return this.cozeService.runWorkflow(workflowId, payload,'7509762183313129512');
  }

  /**
   * 运行确认工作流
   * @param {string} workflowId - 工作流ID
   * @param {object} payload - 确认的数据，例如 { id: "xxx" }
   */
  async runConfirmWorkflow(workflowId, payload) {
    return this.cozeService.runWorkflow(workflowId, payload,'7509762183313129512');
  }
}

export default CozeParsingService;