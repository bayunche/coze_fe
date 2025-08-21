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
      const response = await request.post('/materials/partya/align', params)
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
      
      const response = await request.post('/materials/partya/performBalancing', params)
      
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

  /**
   * 查询未匹配的甲供物资对平结果
   * @param {object} params - 请求参数
   * @param {string} params.taskId - 任务ID
   * @param {number} params.page - 页码，从0开始，默认0
   * @param {number} params.size - 每页记录数，默认10
   * @returns {Promise<object>} 分页结果 {content: Array, totalElements: number, ...}
   */
  async queryUnmatchedBalanceResult(params) {
    if (!params || !params.taskId) {
      console.warn('queryUnmatchedBalanceResult: taskId is required.')
      return { content: [], totalElements: 0 }
    }
    
    try {
      // 设置默认分页参数
      const queryParams = {
        taskId: params.taskId,
        page: params.page || 0,
        size: params.size || 10
      }
      
      const response = await request.get('/materials/partya/queryUnmatchedBalanceResult', { 
        params: queryParams 
      })
      
      // 处理返回体结构 {code, msg, data}
      if (response && response.code === 0 && response.data) {
        return response.data
      } else if (response && response.data) {
        // 兼容其他返回格式
        return response.data
      }
      
      return { content: [], totalElements: 0 }
    } catch (error) {
      console.error('查询未匹配的甲供物资对平结果失败:', error)
      return { content: [], totalElements: 0 }
    }
  }

  /**
   * 人工匹配并更新对平状态
   * @param {object} params - 请求参数
   * @param {string} params.balanceResultId - 对平结果记录的唯一ID
   * @param {string} params.baseDataId - 标准物料的唯一ID
   * @returns {Promise<object>} 操作结果 {success: boolean, message: string}
   */
  async manualMatch(params) {
    if (!params || !params.balanceResultId || !params.baseDataId) {
      console.warn('manualMatch: balanceResultId and baseDataId are required.')
      return { success: false, message: '对平结果ID和标准物料ID不能为空' }
    }
    
    try {
      const response = await request.post('/materials/partya/manualMatch', {
        balanceResultId: params.balanceResultId,
        baseDataId: params.baseDataId
      })
      
      // 处理返回体结构 {code, msg, data}
      if (response && response.code === 0) {
        return {
          success: true,
          message: response.msg || '人工匹配成功'
        }
      } else {
        return {
          success: false,
          message: response?.msg || '人工匹配失败'
        }
      }
    } catch (error) {
      console.error('人工匹配失败:', error)
      return {
        success: false,
        message: error.response?.data?.msg || error.response?.data?.message || '人工匹配失败'
      }
    }
  }

  /**
   * 查询详细对平结果
   * @param {object} params - 请求参数
   * @param {string} params.taskId - 任务ID
   * @param {number} params.page - 页码，从0开始，默认0
   * @param {number} params.size - 每页记录数，默认10
   * @returns {Promise<object>} 分页结果 {content: Array, totalElements: number, ...}
   */
  async queryBalanceDetails(params) {
    if (!params || !params.taskId) {
      console.warn('queryBalanceDetails: taskId is required.')
      return { content: [], totalElements: 0 }
    }
    
    try {
      // 设置默认分页参数
      const queryParams = {
        taskId: params.taskId,
        page: params.page || 0,
        size: params.size || 10
      }
      
      const response = await request.get('/materials/partya/queryBalanceDetails', { 
        params: queryParams 
      })
      
      // 处理返回体结构 {code, msg, data}
      if (response && response.code === 200 && response.data) {
        return response.data
      } else if (response && response.data) {
        // 兼容其他返回格式
        return response.data
      }
      
      return { content: [], totalElements: 0 }
    } catch (error) {
      console.error('查询详细对平结果失败:', error)
      return { content: [], totalElements: 0 }
    }
  }

  /**
   * 查询基础物资信息（用于物资选择功能）
   * @param {object} params - 请求参数
   * @param {string} params.keyword - 搜索关键字（可选）
   * @param {number} params.page - 页码，从0开始，默认0
   * @param {number} params.size - 每页记录数，默认10
   * @param {string} params.sort - 排序参数（可选）
   * @returns {Promise<object>} 分页结果 {content: Array, totalElements: number, ...}
   */
  async searchBaseMaterials(params = {}) {
    try {
      // 设置默认分页参数
      const queryParams = {
        page: params.page || 0,
        size: params.size || 10
      }
      
      // 添加可选参数
      if (params.keyword && params.keyword.trim()) {
        queryParams.keyword = params.keyword.trim()
      }
      
      if (params.sort) {
        queryParams.sort = params.sort
      }
      
      const response = await request.get('/api/materials/base-info/search', { 
        params: queryParams 
      })
      
      // 处理返回体结构 {code, msg, data}
      if (response && response.code === 200 && response.data) {
        return response.data
      } else if (response && response.data) {
        // 兼容其他返回格式
        return response.data
      }
      
      return { content: [], totalElements: 0 }
    } catch (error) {
      console.error('查询基础物资信息失败:', error)
      return { content: [], totalElements: 0 }
    }
  }
}

export default new OwnerMaterialService()
