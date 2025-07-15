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

  /**
   * 查询甲供物资解析任务详情列表
   * @param {object} params - 请求参数，包含 taskId
   * @param {string} params.taskId - 任务ID
   * @returns {Promise<Array>} 甲供物资解析任务详情列表
   */
  async queryMaterialsParseTaskDetailList(params) {
    if (!params || !params.taskId) {
      console.warn('queryMaterialsParseTaskDetailList: taskId is required.')
      return []
    }
    try {
      const response = await request.get(`/tasks/detail/${params}`)
      if (response && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('查询甲供物资解析任务详情列表失败:', error)
      return []
    }
  }

  /**
   * 执行甲供物资对平
   * @param {object} params - 请求参数
   * @param {string} params.taskId - 任务ID
   * @param {Array} params.materials - 需要对齐的物资列表
   * @returns {Promise<object>} 对平结果 {success: boolean, data: object, message: string}
   */
  async alignMaterials(params) {
    if (!params || !params.taskId) {
      console.warn('alignMaterials: taskId is required.')
      return { success: false, message: '任务ID不能为空' }
    }
    try {
      const response = await request.post('/materials/partya/align', params)
      return {
        success: true,
        data: response.data,
        message: '物资对平成功'
      }
    } catch (error) {
      console.error('物资对平失败:', error)
      return {
        success: false,
        message: error.response?.data?.message || '物资对平失败'
      }
    }
  }
}

export default new OwnerMaterialService()
