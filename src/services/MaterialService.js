import request from '@/utils/request.js'

class MaterialService {
  // ==================== 基础物资管理API ====================

  /**
   * 分页搜索基础物资信息
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键字(可选)
   * @param {number} params.page - 页码，从0开始(可选，默认0)
   * @param {number} params.size - 每页大小(可选，默认10)
   * @param {string} params.sort - 排序参数(可选)
   * @returns {Promise<Object>} 分页结果
   */
  async searchMaterials(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.keyword) queryParams.append('keyword', params.keyword)
      if (params.page !== undefined) queryParams.append('page', params.page)
      if (params.size !== undefined) queryParams.append('size', params.size)
      if (params.sort) queryParams.append('sort', params.sort)

      const response = await request.get(`/materials/base-info/search?${queryParams}`)
      return response
    } catch (error) {
      console.error('搜索基础物资信息失败:', error)
      throw error
    }
  }

  /**
   * 创建基础物资信息
   * @param {Object} data - 物资数据
   * @param {string} data.materialName - 物资名称(必填)
   * @param {string} data.specificationModel - 规格型号(可选)
   * @param {string} data.unit - 单位(可选)
   * @param {string} data.serialNumber - 序列号(可选)
   * @param {string} data.priceCode - 信息价编码(可选)
   * @param {string} data.materialCode - 物资编码(可选)
   * @param {string} data.businessDomain - 业务域(可选)
   * @param {string} data.mainDistributionNetwork - 主/配标识(可选)
   * @param {number} data.mainDistributionType - 主/配类型(可选，1/2/3)
   * @param {string} data.type - 物资类型(可选)
   * @returns {Promise<Object>} 创建结果
   */
  async createMaterial(data) {
    try {
      const response = await request.post('/materials/base-info/create', data)
      return response
    } catch (error) {
      console.error('创建基础物资信息失败:', error)
      throw error
    }
  }

  /**
   * 更新基础物资信息
   * @param {Object} data - 物资数据(包含id)
   * @param {string} data.id - 物资ID(必填)
   * @param {string} data.materialName - 物资名称(必填)
   * @returns {Promise<Object>} 更新结果
   */
  async updateMaterial(data) {
    try {
      const response = await request.put('/materials/base-info/update', data)
      return response
    } catch (error) {
      console.error('更新基础物资信息失败:', error)
      throw error
    }
  }

  /**
   * 删除基础物资信息
   * @param {string} id - 物资ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMaterial(id) {
    try {
      const response = await request.delete(`/materials/base-info/delete/${id}`)
      return response
    } catch (error) {
      console.error('删除基础物资信息失败:', error)
      throw error
    }
  }

  /**
   * 根据ID查询基础物资信息
   * @param {string} id - 物资ID
   * @returns {Promise<Object>} 物资详情
   */
  async getMaterialById(id) {
    try {
      const response = await request.get(`/materials/base-info/${id}`)
      return response
    } catch (error) {
      console.error('查询基础物资信息失败:', error)
      throw error
    }
  }

  /**
   * 获取物资统计信息
   * @param {string} keyword - 搜索关键字(可选)
   * @returns {Promise<Object>} 统计结果
   */
  async getMaterialStatistics(keyword = '') {
    try {
      const queryParams = new URLSearchParams()
      if (keyword) queryParams.append('keyword', keyword)

      const response = await request.get(`/materials/base-info/statistics?${queryParams}`)
      return response
    } catch (error) {
      console.error('获取物资统计信息失败:', error)
      throw error
    }
  }

  // ==================== 物资价格管理API ====================

  /**
   * 分页查询物资价格列表
   * @param {Object} params - 查询参数
   * @param {string} params.baseInfoId - 物资基础信息ID(可选)
   * @param {number} params.page - 页码，从0开始(可选，默认0)
   * @param {number} params.size - 每页大小(可选，默认10)
   * @returns {Promise<Object>} 分页结果
   */
  async searchPrices(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.baseInfoId) queryParams.append('baseInfoId', params.baseInfoId)
      if (params.page !== undefined) queryParams.append('page', params.page)
      if (params.size !== undefined) queryParams.append('size', params.size)

      const response = await request.get(`/materials/priceinfo/page?${queryParams}`)
      return response
    } catch (error) {
      console.error('查询物资价格列表失败:', error)
      throw error
    }
  }

  /**
   * 新增物资价格
   * @param {Object} data - 价格数据
   * @param {string} data.baseInfoId - 物资基础信息ID(必填)
   * @param {string} data.quarter - 季度(必填)
   * @param {number} data.taxPrice - 含税价格(必填)
   * @returns {Promise<Object>} 创建结果
   */
  async createPrice(data) {
    try {
      const response = await request.post('/materials/priceinfo/add', data)
      return response
    } catch (error) {
      console.error('新增物资价格失败:', error)
      throw error
    }
  }

  /**
   * 修改物资价格
   * @param {Object} data - 价格数据
   * @param {string} data.id - 价格记录ID(必填)
   * @param {string} data.quarter - 季度(必填)
   * @param {number} data.taxPrice - 含税价格(必填)
   * @returns {Promise<Object>} 更新结果
   */
  async updatePrice(data) {
    try {
      const response = await request.put('/materials/priceinfo/edit', data)
      return response
    } catch (error) {
      console.error('修改物资价格失败:', error)
      throw error
    }
  }

  /**
   * 批量删除物资价格
   * @param {Array<string>} ids - 价格记录ID数组
   * @returns {Promise<Object>} 删除结果
   */
  async deletePrices(ids) {
    try {
      const response = await request.delete('/materials/priceinfo/delete', {
        data: ids
      })
      return response
    } catch (error) {
      console.error('批量删除物资价格失败:', error)
      throw error
    }
  }

  /**
   * 获取物资价格统计信息
   * @param {string} baseInfoId - 物资基础信息ID
   * @returns {Promise<Object>} 统计结果(最高、最低、平均价和总数)
   */
  async getPriceStatistics(baseInfoId) {
    try {
      const response = await request.get(`/materials/priceinfo/statistics/${baseInfoId}`)
      return response
    } catch (error) {
      console.error('获取物资价格统计信息失败:', error)
      throw error
    }
  }

  /**
   * 查询物资价格信息列表(不分页)
   * @param {string} baseMaterialsDataId - 匹配到的物资ID
   * @returns {Promise<Array>} 价格和季度信息列表
   */
  async queryPriceInfoList(baseMaterialsDataId) {
    if (!baseMaterialsDataId) {
      console.warn('queryPriceInfoList: baseMaterialsDataId is required.')
      return []
    }
    try {
      const response = await request.get(
        `/materials/priceinfo/queryPriceInfoList?baseMaterialsDataId=${baseMaterialsDataId}`
      )
      if (response && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('查询物资价格信息列表失败:', error)
      return []
    }
  }

  /**
   * 查询任务下未确认的物资数据数量
   * @param {string} taskId - 任务ID
   * @returns {Promise<number>} 未确认数据的数量
   */
  async getUnconfirmedCount(taskId) {
    try {
      const response = await request.get(`/materials/partyb/unconfirmed-count?taskId=${taskId}`)
      if (response && response.data !== undefined) {
        return response.data
      }
      return 0
    } catch (error) {
      console.error('查询未确认物资数据数量失败:', error)
      throw error
    }
  }

  // ==================== 临时物资数据管理API ====================

  /**
   * 查询待审核历史匹配数据(临时物资价格数据)
   * @param {Object} params - 查询参数
   * @param {string} params.taskId - 任务ID(可选)
   * @param {number} params.page - 页码，从0开始(可选，默认0)
   * @param {number} params.size - 每页大小(可选，默认10)
   * @param {string} params.keyword - 搜索关键字(可选)
   * @returns {Promise<Object>} 分页结果
   */
  async queryPendingApprovalData(params = {}) {
    try {
      const requestData = {
        page: params.page || 0,
        size: params.size || 10
      }
      
      if (params.taskId) {
        requestData.taskId = params.taskId
      }
      
      const response = await request.post('/materials/partyb/admin/query-pending-approval', requestData)
      
      // 如果有搜索关键字，需要在前端进行过滤
      if (params.keyword && response?.data?.content) {
        const keyword = params.keyword.toLowerCase()
        response.data.content = response.data.content.filter(item => 
          item.materialName?.toLowerCase().includes(keyword) ||
          item.specificationModel?.toLowerCase().includes(keyword) ||
          item.unit?.toLowerCase().includes(keyword) ||
          item.confirmedBaseInfo?.materialCode?.toLowerCase().includes(keyword)
        )
        response.data.totalElements = response.data.content.length
        response.data.numberOfElements = response.data.content.length
      }
      
      return response
    } catch (error) {
      console.error('查询待审核历史匹配数据失败:', error)
      throw error
    }
  }

  /**
   * 管理员审核历史匹配数据
   * @param {Object} params - 审核参数
   * @param {Array<string>} params.ids - 记录ID数组
   * @param {number} params.adminApproved - 审核状态：0-不通过，1-通过
   * @returns {Promise<Object>} 审核结果
   */
  async approveHistoryData(params) {
    try {
      const response = await request.post('/materials/partyb/admin/approve-history', params)
      return response
    } catch (error) {
      console.error('管理员审核历史匹配数据失败:', error)
      throw error
    }
  }

  // ==================== 价格季度管理API ====================

  /**
   * 查询所有可用的季度信息
   * 用于乙供物资解析、价格查询、任务配置等场景的季度选择器
   * @returns {Promise<Array<string>>} 季度列表，按降序排列(最新季度在前)
   * @example 
   * const quarters = await MaterialService.getAllAvailableQuarters()
   * // 返回: ["2024-Q4", "2024-Q3", "2024-Q2", ...]
   */
  async getAllAvailableQuarters() {
    try {
      const response = await request.get('/materials/priceinfo/quarters')
      
      // 兼容不同的成功状态码：0 或 200
      if (response && (response.code === 0 || response.code === 200) && Array.isArray(response.data)) {
        return response.data
      }
      
      // API返回格式异常时，抛出错误
      console.error('季度查询API返回格式异常:', response)
      throw new Error('季度查询API返回数据格式异常')
    } catch (error) {
      console.error('查询可用季度信息失败:', error)
      throw error
    }
  }
}

export default new MaterialService()
