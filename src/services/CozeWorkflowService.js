// src/services/CozeWorkflowService.js
import  CozeService  from '@/uitls/coze.js'; // 假设 CozeService 仍然从这里导入

class CozeWorkflowService {
  constructor() {
    const apiKey = import.meta.env.VITE_COZE_API_KEY;
    if (!apiKey) {
      console.error('Coze API Key is not set. Please set VITE_COZE_API_KEY in your .env.local file.');
    }
    this.cozeService = new CozeService(apiKey);
  }

  /**
   * 上传文件
   * @param {File} file - 要上传的文件对象
   * @returns {Promise<string>} - 文件ID
   */
  async uploadFile(file) {
    return this.cozeService.uploadFile(file);
  }

  /**
   * 运行通用工作流
   * @param {string} workflowId - Coze 工作流 ID
   * @param {object} params - 工作流参数
   * @param {object} callbacks - 回调函数对象 { onMessage, onError, onEnd }
   */
  async runWorkflow(workflowId, params, callbacks) {
    return this.cozeService.runWorkflow(workflowId, params, callbacks);
  }
}

export default CozeWorkflowService;