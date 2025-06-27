// src/services/CozeChatService.js
import  CozeService  from '@/uitls/coze.js'; // 假设 CozeService 仍然从这里导入

class CozeChatService {
  constructor() {
    // 从环境变量获取 API Key
    const apiKey = import.meta.env.VITE_COZE_API_KEY;
    if (!apiKey) {
      console.error('Coze API Key is not set. Please set VITE_COZE_API_KEY in your .env.local file.');
      // 可以选择抛出错误或使用默认值
    }
    this.cozeService = new CozeService(apiKey);
  }

  /**
   * 运行聊天工作流
   * @param {object} params - 聊天参数，例如 { query: "你的问题" }
   * @param {string} workflowId - Coze 聊天工作流 ID
   * @param {object} callbacks - 回调函数对象 { onMessage, onError, onEnd }
   */
  async runChat(params, workflowId, callbacks) {
    return this.cozeService.runChat(params, workflowId, callbacks);
  }
}

export default CozeChatService;