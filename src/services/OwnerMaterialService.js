import request from '@/utils/request.js'

class OwnerMaterialService {
  /**
   * 查询甲供物资申领数据
   * @param {object} params - 请求参数，包含 taskDetailId
   * @param {string} params.taskDetailId - 任务详情ID
   * @returns {Promise<Array>} 甲供物资申领数据列表
   */
  async queryMaterialsApplyData(params) {
    if (!params || !params.taskDetailId) {
      console.warn('queryMaterialsApplyData: taskDetailId is required.')
      return []
    }
    try {
      const response = await request.get(`/materials/partya/queryMaterialsApplyData`, { params })
      if (response && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('查询甲供物资申领数据失败:', error)
      return []
    }
  }
}

export default new OwnerMaterialService()
