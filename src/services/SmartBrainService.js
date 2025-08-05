import request from '@/utils/request.js'

class SmartBrainService {
  /**
   * 获取智能体任务详情统计
   * 按业务域划分的智能体任务统计详情，包括每个业务域的总任务数、已完成任务数和进行中任务数
   * @returns {Promise<Array>} 智能体任务统计数据数组
   */
  async getAgentTaskDetails() {
    try {
      const response = await request.get('/smart-brain/agents/task-details')
      
      // API直接返回数组，不需要从data字段中提取
      if (Array.isArray(response)) {
        return response
      }
      
      // 如果返回格式是 { data: [...] }，则提取data字段
      if (response && Array.isArray(response.data)) {
        return response.data
      }
      
      // 如果API返回空或格式异常，返回空数组
      console.warn('智能体任务统计API返回格式异常:', response)
      return []
    } catch (error) {
      console.error('获取智能体任务统计失败:', error)
      
      // 根据API文档，异常时返回空数组
      return []
    }
  }
}

export default new SmartBrainService()