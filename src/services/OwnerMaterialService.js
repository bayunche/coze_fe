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
      const response = await request.get(`/api/materials/partya/queryMaterialsApplyData`, { params })
      // 处理新的返回体结构 {code, msg, data}
      if (response && response.code === 200 && response.data) {
        return response.data
      } else if (response && response.data) {
        // 兼容旧的返回格式
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
      const response = await request.post('/api/materials/partya/align', params)
      // 处理新的返回体结构 {code, msg, data}
      if (response && response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.msg || '物资对平成功'
        }
      } else {
        return {
          success: false,
          message: response?.msg || '物资对平失败'
        }
      }
    } catch (error) {
      console.error('物资对平失败:', error)
      return {
        success: false,
        message: error.response?.data?.msg || error.response?.data?.message || '物资对平失败'
      }
    }
  }

  /**
   * 执行甲供物资重新解析（新接口）
   * @param {object} params - 请求参数（与原工作流参数保持一致）
   * @param {string} params.taskId - 任务ID
   * @returns {Promise<object>} 重新解析结果 {success: boolean, data: object, message: string}
   */
  async performBalancing(params) {
    if (!params || !params.taskId) {
      console.warn('performBalancing: taskId is required.')
      return { success: false, message: '任务ID不能为空' }
    }
    try {
      console.log('【调用】甲供物资重新解析接口，参数:', params)
      
      const response = await request.post('/api/materials/partya/performBalancing', params)
      
      console.log('【响应】甲供物资重新解析结果:', response)
      
      // 处理新的返回体结构 {code, msg, data}
      if (response && response.code === 200) {
        return {
          success: true,
          data: response.data,
          message: response.msg || '甲供物资重新解析成功'
        }
      } else {
        return {
          success: false,
          message: response?.msg || '甲供物资重新解析失败'
        }
      }
    } catch (error) {
      console.error('【错误】甲供物资重新解析失败:', error)
      return {
        success: false,
        message: error.response?.data?.msg || error.response?.data?.message || '甲供物资重新解析失败'
      }
    }
  }
}

export default new OwnerMaterialService()
