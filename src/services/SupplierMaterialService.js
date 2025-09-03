/**
 * 乙供物资服务类
 * 处理乙供物资相关的所有API调用
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

class SupplierMaterialService {
  constructor() {
    // 使用统一的axios实例
    this.http = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '',
      timeout: 30000, // 30秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器
    this.http.interceptors.request.use(
      config => {
        // 可以在这里添加认证token等
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.http.interceptors.response.use(
      response => {
        return response.data
      },
      error => {
        const message = error.response?.data?.message || '请求失败'
        ElMessage.error(message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 乙供物资复杂查询接口
   * @param {Object} params - 查询参数
   * @param {String} params.taskId - 任务ID（必填）
   * @param {String} params.taskDetailId - 任务详情ID（可选）
   * @param {Number} params.page - 页码（从0开始）
   * @param {Number} params.size - 每页大小
   * @param {String} params.keyword - 搜索关键词
   * @param {Number} params.confirmResult - 确认结果筛选（0：未确认，1：已确认）
   * @param {Number} params.matchedType - 匹配类型筛选（0：无匹配，1：精确匹配，2：相似匹配，3：历史匹配，4：人工匹配）
   * @returns {Promise<Object>} 查询结果
   */
  async queryMaterials(params) {
    try {
      console.log('【调用】乙供物资复杂查询接口，参数:', params)
      
      const response = await this.http.post('/materials/partyb/query', {
        taskId: params.taskId,
        taskDetailId: params.taskDetailId,
        page: params.page || 0,
        size: params.size || 10,
        keyword: params.keyword || '',
        confirmResult: params.confirmResult,
        matchedType: params.matchedType
      })

      console.log('【响应】乙供物资复杂查询结果:', response)
      return response
    } catch (error) {
      console.error('【错误】乙供物资复杂查询失败:', error)
      throw error
    }
  }

  /**
   * 乙供物资人工修改确认接口
   * @param {Object} params - 确认参数
   * @param {String} params.id - 记录主键ID（必填）
   * @param {String} params.confirmBaseDataId - 确认的基础数据ID（必填）
   * @param {String} params.confirmPriceId - 确认的价格数据ID（必填）
   * @returns {Promise<Object>} 确认结果
   */
  async manualConfirm(params) {
    try {
      console.log('【调用】乙供物资人工修改确认接口，参数:', params)
      
      // 参数验证
      if (!params.id || !params.confirmBaseDataId || !params.confirmPriceId) {
        throw new Error('缺少必要参数：id、confirmBaseDataId 和 confirmPriceId 均为必填')
      }

      const response = await this.http.post('/materials/partyb/manual-confirm', {
        id: params.id,
        confirmBaseDataId: params.confirmBaseDataId,
        confirmPriceId: params.confirmPriceId
      })

      console.log('【响应】乙供物资人工修改确认结果:', response)
      
      if (response.code === 200) {
        ElMessage.success(response.message || '确认成功')
        return response.data
      } else {
        throw new Error(response.message || '确认失败')
      }
    } catch (error) {
      console.error('【错误】乙供物资人工修改确认失败:', error)
      throw error
    }
  }

  /**
   * 物资基础信息包含价格数据分页查询接口
   * @param {Object} params - 查询参数
   * @param {String} params.keyword - 搜索关键字（可选）
   * @param {Number} params.page - 页码（从0开始）
   * @param {Number} params.size - 每页记录数
   * @returns {Promise<Object>} 查询结果
   */
  async searchMaterialsWithPrices(params) {
    try {
      console.log('【调用】物资基础信息包含价格数据查询，参数:', params)
      
      const queryParams = new URLSearchParams({
        keyword: params.keyword || '',
        page: params.page || 0,
        size: params.size || 10
      })

      const response = await this.http.get(`/api/materials/base-info/search-with-prices?${queryParams}`)

      console.log('【响应】物资基础信息查询结果:', response)
      return response
    } catch (error) {
      console.error('【错误】物资基础信息查询失败:', error)
      throw error
    }
  }

  /**
   * 获取乙供物资匹配统计信息
   * @param {String} taskId - 任务ID（必填）
   * @returns {Promise<Object>} 统计结果
   */
  async getMaterialMatchingStats(taskId) {
    try {
      console.log('【调用】乙供物资匹配统计接口，taskId:', taskId)
      
      // 参数验证
      if (!taskId) {
        throw new Error('taskId参数不能为空')
      }

      const response = await this.http.get(`/v2/materials/party-b/getMaterialMatchingStats?taskId=${taskId}`)

      console.log('【响应】乙供物资匹配统计结果:', response)
      return response
    } catch (error) {
      console.error('【错误】获取乙供物资匹配统计失败:', error)
      throw error
    }
  }

  /**
   * 获取审批列表
   * @param {Object} params - 查询参数
   * @param {Number} params.page - 页码（从0开始）
   * @param {Number} params.size - 每页大小
   * @param {String} params.keyword - 搜索关键词
   * @param {Number} params.approvalStatus - 审批状态（0：待审批，1：已通过，2：已拒绝）
   * @param {Number} params.matchedType - 匹配类型
   * @returns {Promise<Object>} 审批列表数据
   */
  async getApprovalList(params) {
    try {
      console.log('【调用】获取审批列表，参数:', params)
      
      const response = await this.http.get('/v2/materials/party-b/approval-list', {
        params: {
          page: params.page || 0,
          size: params.size || 20,
          keyword: params.keyword,
          approvalStatus: params.approvalStatus,
          matchedType: params.matchedType
        }
      })
      
      console.log('【响应】审批列表数据:', response)
      return response
    } catch (error) {
      console.error('【错误】获取审批列表失败:', error)
      throw error
    }
  }

  /**
   * 审批通过单条记录
   * @param {Object} params - 审批参数
   * @param {String} params.id - 记录ID
   * @param {String} params.remark - 审批意见（可选）
   * @returns {Promise<Object>} 审批结果
   */
  async approveItem(params) {
    try {
      console.log('【调用】审批通过，参数:', params)
      
      const response = await this.http.post('/v2/materials/party-b/approve', {
        id: params.id,
        remark: params.remark || ''
      })
      
      console.log('【响应】审批通过结果:', response)
      
      if (response.code === 200) {
        ElMessage.success(response.message || '审批通过成功')
        return response.data
      } else {
        throw new Error(response.message || '审批失败')
      }
    } catch (error) {
      console.error('【错误】审批通过失败:', error)
      throw error
    }
  }

  /**
   * 拒绝单条记录
   * @param {Object} params - 拒绝参数
   * @param {String} params.id - 记录ID
   * @param {String} params.reason - 拒绝理由（必填）
   * @returns {Promise<Object>} 拒绝结果
   */
  async rejectItem(params) {
    try {
      console.log('【调用】审批拒绝，参数:', params)
      
      if (!params.reason || !params.reason.trim()) {
        throw new Error('拒绝理由不能为空')
      }
      
      const response = await this.http.post('/v2/materials/party-b/reject', {
        id: params.id,
        reason: params.reason
      })
      
      console.log('【响应】审批拒绝结果:', response)
      
      if (response.code === 200) {
        ElMessage.success(response.message || '拒绝成功')
        return response.data
      } else {
        throw new Error(response.message || '拒绝失败')
      }
    } catch (error) {
      console.error('【错误】审批拒绝失败:', error)
      throw error
    }
  }

  /**
   * 批量审批通过
   * @param {Object} params - 批量审批参数
   * @param {Array<String>} params.ids - 记录ID列表
   * @param {String} params.remark - 审批意见（可选）
   * @returns {Promise<Object>} 批量审批结果
   */
  async batchApprove(params) {
    try {
      console.log('【调用】批量审批通过，参数:', params)
      
      if (!params.ids || params.ids.length === 0) {
        throw new Error('请选择要审批的记录')
      }
      
      const response = await this.http.post('/v2/materials/party-b/batch-approve', {
        ids: params.ids,
        remark: params.remark || ''
      })
      
      console.log('【响应】批量审批结果:', response)
      
      if (response.code === 200) {
        ElMessage.success(response.message || `成功审批 ${params.ids.length} 条记录`)
        return response.data
      } else {
        throw new Error(response.message || '批量审批失败')
      }
    } catch (error) {
      console.error('【错误】批量审批失败:', error)
      throw error
    }
  }

  /**
   * 批量拒绝
   * @param {Object} params - 批量拒绝参数
   * @param {Array<String>} params.ids - 记录ID列表
   * @param {String} params.reason - 拒绝理由（必填）
   * @returns {Promise<Object>} 批量拒绝结果
   */
  async batchReject(params) {
    try {
      console.log('【调用】批量拒绝，参数:', params)
      
      if (!params.ids || params.ids.length === 0) {
        throw new Error('请选择要拒绝的记录')
      }
      
      if (!params.reason || !params.reason.trim()) {
        throw new Error('拒绝理由不能为空')
      }
      
      const response = await this.http.post('/v2/materials/party-b/batch-reject', {
        ids: params.ids,
        reason: params.reason
      })
      
      console.log('【响应】批量拒绝结果:', response)
      
      if (response.code === 200) {
        ElMessage.success(response.message || `成功拒绝 ${params.ids.length} 条记录`)
        return response.data
      } else {
        throw new Error(response.message || '批量拒绝失败')
      }
    } catch (error) {
      console.error('【错误】批量拒绝失败:', error)
      throw error
    }
  }

  /**
   * 获取审批统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getApprovalStatistics() {
    try {
      console.log('【调用】获取审批统计数据')
      
      const response = await this.http.get('/v2/materials/party-b/approval-statistics')
      
      console.log('【响应】审批统计数据:', response)
      return response
    } catch (error) {
      console.error('【错误】获取审批统计失败:', error)
      throw error
    }
  }

  /**
   * 批量确认乙供物资
   * @param {Array} items - 需要确认的物资列表
   * @returns {Promise<Object>} 批量确认结果
   */
  async batchConfirm(items) {
    try {
      console.log('【调用】批量确认乙供物资，数量:', items.length)
      
      // 逐个调用确认接口
      const results = []
      const errors = []
      
      for (const item of items) {
        try {
          const result = await this.manualConfirm({
            id: item.taskDataId,
            confirmBaseDataId: item.confirmBaseDataId,
            confirmPriceId: item.confirmPriceId
          })
          results.push(result)
        } catch (error) {
          errors.push({
            item,
            error: error.message
          })
        }
      }

      if (errors.length > 0) {
        console.warn('【警告】部分物资确认失败:', errors)
        ElMessage.warning(`成功确认 ${results.length} 条，失败 ${errors.length} 条`)
      } else {
        ElMessage.success(`成功确认 ${results.length} 条物资`)
      }

      return {
        success: results,
        failed: errors
      }
    } catch (error) {
      console.error('【错误】批量确认失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const supplierMaterialService = new SupplierMaterialService()

export default supplierMaterialService