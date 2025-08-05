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
      
      const response = await request.get(`/backend-api/materials/priceinfo/page?${queryParams}`)
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
      const response = await request.post('/backend-api/materials/priceinfo', data)
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
      const response = await request.put('/backend-api/materials/priceinfo', data)
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
      const response = await request.delete('/backend-api/materials/priceinfo', { data: ids })
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
      const response = await request.get(`/backend-api/materials/priceinfo/statistics/${baseInfoId}`)
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
        `/backend-api/materials/priceinfo/queryPriceInfoList?baseMaterialsDataId=${baseMaterialsDataId}`
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
}

export default new MaterialService()
