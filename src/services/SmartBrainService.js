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

  /**
   * 根据任务ID查询任务详情列表
   * @param {string} taskId - 任务ID
   * @param {Object} params - 查询参数
   * @param {string} params.fileName - 文件名筛选条件（支持模糊匹配，可选）
   * @param {number} params.page - 页码，从0开始（可选，默认0）
   * @param {number} params.size - 每页大小（可选，默认10）
   * @param {string} params.sort - 排序字段（可选，默认按创建时间倒序）
   * @returns {Promise<Object>} 分页数据对象，包含content数组和分页信息
   */
  async getTaskDetailsList(taskId, params = {}) {
    try {
      console.log('【调试】SmartBrainService.getTaskDetailsList - 调用参数:', { taskId, params })
      
      // 验证taskId
      if (!taskId || taskId === 'null' || taskId === 'undefined') {
        console.error('【错误】SmartBrainService - taskId无效:', taskId)
        throw new Error('任务ID无效或为空')
      }
      
      const url = `/smart-brain/agents/tasks/${taskId}/details`
      console.log('【调试】SmartBrainService - 请求URL:', url)
      
      const response = await request.get(url, {
        params
      })
      
      console.log('【调试】SmartBrainService - API响应:', response)
      
      // 接口返回的是标准的Spring Data分页格式
      if (response && response.data) {
        return response.data
      }
      
      // 如果API直接返回分页数据（没有额外的包装）
      if (response && response.content && typeof response.totalElements === 'number') {
        return response
      }
      
      // 异常情况，返回空的分页结构
      console.warn('任务详情列表API返回格式异常:', response)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        numberOfElements: 0
      }
    } catch (error) {
      console.error('获取任务详情列表失败:', error)
      console.error('【调试】错误详情:', { 
        taskId, 
        params, 
        message: error.message,
        response: error.response?.data 
      })
      
      // 检查是否是"没有携带taskid"的错误
      if (error.response?.data?.message && error.response.data.message.includes('taskid')) {
        console.error('【发现】后端返回taskid相关错误:', error.response.data.message)
      }
      
      // 异常时返回空的分页结构
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        numberOfElements: 0
      }
    }
  }

  /**
   * 根据智能体标签查询任务列表
   * @param {string} agentLabels - 智能体标签（业务域），如：j_material、y_material、contract
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，从0开始（可选，默认0）
   * @param {number} params.size - 每页大小（可选，默认10）
   * @param {string} params.sort - 排序字段（可选，默认按创建时间倒序）
   * @returns {Promise<Object>} 分页数据对象，包含WmesTasksDO数组和分页信息
   */
  async getAgentTasksList(agentLabels, params = {}) {
    try {
      const response = await request.get('/smart-brain/agents/tasks', {
        params: {
          agentLabels,
          ...params
        }
      })
      
      // 接口返回的是标准的Spring Data分页格式
      if (response && response.data) {
        return response.data
      }
      
      // 如果API直接返回分页数据（没有额外的包装）
      if (response && response.content && typeof response.totalElements === 'number') {
        return response
      }
      
      // 异常情况，返回空的分页结构
      console.warn('智能体任务列表API返回格式异常:', response)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        numberOfElements: 0
      }
    } catch (error) {
      console.error('获取智能体任务列表失败:', error)
      
      // 异常时返回空的分页结构
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: params.size || 10,
        number: params.page || 0,
        first: true,
        last: true,
        numberOfElements: 0
      }
    }
  }
}

export default new SmartBrainService()