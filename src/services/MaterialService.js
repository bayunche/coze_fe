import request from '@/utils/request.js'

const BASE_URL = '/api'

class MaterialService {
  /**
   * 查询物资价格信息列表
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
        `${BASE_URL}/materials/priceinfo/queryPriceInfoList?baseMaterialsDataId=${baseMaterialsDataId}`
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
