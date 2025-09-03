/**
 * 临时数据管理服务类
 * 处理临时物资基础信息和价格信息的所有API调用
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

class TemporaryDataService {
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
        console.log('【请求】', config.method?.toUpperCase(), config.url, config.data || config.params)
        return config
      },
      error => {
        console.error('【请求错误】', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.http.interceptors.response.use(
      response => {
        console.log('【响应】', response.config.url, response.data)
        return response.data
      },
      error => {
        console.error('【响应错误】', error.config?.url, error.response?.data || error.message)
        const message = error.response?.data?.msg || error.response?.data?.message || error.message || '请求失败'
        ElMessage.error(message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 查询临时数据
   * @param {Object} params - 查询参数
   * @param {String} params.taskId - 关联的任务ID（选填，默认查询所有）
   * @param {String} params.dataType - 数据类型筛选（可选，"baseInfo" 或 "price"）
   * @param {Number} params.page - 页码（从0开始）
   * @param {Number} params.size - 每页大小
   * @returns {Promise<Object>} 查询结果
   */
  async queryTemporaryData(params = {}) {
    try {
      console.log('【调用】查询临时数据，参数:', params)
      
      const requestData = {
        page: params.page || 0,
        size: params.size || 20
      }
      
      // taskId 是可选参数，不传则查询所有临时数据
      if (params.taskId) {
        requestData.taskId = params.taskId
      }
      
      // dataType 是可选参数
      if (params.dataType) {
        requestData.dataType = params.dataType
      }

      const response = await this.http.post('/api/materials/temporary/query', requestData)

      console.log('【响应】临时数据查询结果:', response)
      return response
    } catch (error) {
      console.error('【错误】查询临时数据失败:', error)
      throw error
    }
  }

  /**
   * 创建临时物资基础信息
   * @param {Object} params - 创建参数
   * @param {String} params.associatedTaskId - 关联的任务ID（必填）
   * @param {String} params.materialName - 物资名称（必填）
   * @param {String} params.specificationModel - 规格型号
   * @param {String} params.unit - 单位
   * @param {String} params.serialNumber - 序号
   * @param {String} params.priceCode - 信息价编码
   * @param {String} params.materialCode - 物资编码
   * @param {String} params.businessDomain - 业务域
   * @param {String} params.mainDistributionNetwork - 主/配标识
   * @param {Number} params.mainDistributionType - 主/配类型
   * @param {String} params.type - 物资类型
   * @returns {Promise<Object>} 创建结果
   */
  async createTemporaryBaseInfo(params) {
    try {
      console.log('【调用】创建临时物资基础信息，参数:', params)
      
      // 参数验证
      if (!params.associatedTaskId || !params.materialName) {
        throw new Error('associatedTaskId和materialName为必填参数')
      }

      const response = await this.http.post('/api/materials/base-info/temporary/create', {
        associatedTaskId: params.associatedTaskId,
        materialName: params.materialName,
        specificationModel: params.specificationModel || '',
        unit: params.unit || '',
        serialNumber: params.serialNumber || '',
        priceCode: params.priceCode || '',
        materialCode: params.materialCode || '',
        businessDomain: params.businessDomain || '',
        mainDistributionNetwork: params.mainDistributionNetwork || '',
        mainDistributionType: params.mainDistributionType || 0,
        type: params.type || ''
      })

      console.log('【响应】创建临时基础信息结果:', response)
      
      if (response.code === 0) {
        ElMessage.success('创建临时物资基础信息成功')
        return response.data
      } else {
        throw new Error(response.msg || '创建失败')
      }
    } catch (error) {
      console.error('【错误】创建临时基础信息失败:', error)
      throw error
    }
  }

  /**
   * 创建临时价格信息
   * @param {Object} params - 创建参数
   * @param {String} params.associatedTaskId - 关联的任务ID（必填）
   * @param {String} params.baseInfoId - 关联基础信息ID（必填）
   * @param {String} params.quarter - 季度（必填）
   * @param {Number} params.taxPrice - 含税价（必填）
   * @param {Number} params.taxExcludedPrice - 不含税价
   * @param {String} params.unit - 价格单位
   * @returns {Promise<Object>} 创建结果
   */
  async createTemporaryPrice(params) {
    try {
      console.log('【调用】创建临时价格信息，参数:', params)
      
      // 参数验证
      if (!params.associatedTaskId || !params.baseInfoId || !params.quarter || params.taxPrice == null) {
        throw new Error('associatedTaskId、baseInfoId、quarter和taxPrice为必填参数')
      }

      const response = await this.http.post('/materials/priceinfo/temporary/add', {
        associatedTaskId: params.associatedTaskId,
        baseInfoId: params.baseInfoId,
        quarter: params.quarter,
        taxPrice: params.taxPrice,
        taxExcludedPrice: params.taxExcludedPrice || 0,
        unit: params.unit || ''
      })

      console.log('【响应】创建临时价格信息结果:', response)
      
      if (response.code === 0) {
        ElMessage.success('创建临时价格信息成功')
        return response.data
      } else {
        throw new Error(response.msg || '创建失败')
      }
    } catch (error) {
      console.error('【错误】创建临时价格信息失败:', error)
      throw error
    }
  }

  /**
   * 将临时数据转为正式数据（批量）
   * @param {Object} params - 转正参数
   * @param {Array<String>} params.baseInfoIdsToPromote - 要转正的基础信息ID列表
   * @param {Array<String>} params.priceIdsToPromote - 要转正的价格信息ID列表
   * @returns {Promise<Object>} 转正结果
   */
  async promoteTemporaryData(params) {
    try {
      console.log('【调用】将临时数据转为正式数据，参数:', params)
      
      // 参数验证
      if ((!params.baseInfoIdsToPromote || params.baseInfoIdsToPromote.length === 0) && 
          (!params.priceIdsToPromote || params.priceIdsToPromote.length === 0)) {
        throw new Error('至少需要选择一条数据进行转正')
      }

      const response = await this.http.post('/api/materials/temporary/promote', {
        baseInfoIdsToPromote: params.baseInfoIdsToPromote || [],
        priceIdsToPromote: params.priceIdsToPromote || []
      })

      console.log('【响应】临时数据转正结果:', response)
      
      if (response.code === 0) {
        const totalCount = (params.baseInfoIdsToPromote?.length || 0) + (params.priceIdsToPromote?.length || 0)
        ElMessage.success(response.msg || `成功转正 ${totalCount} 条数据`)
        return response.data
      } else {
        throw new Error(response.msg || '转正失败')
      }
    } catch (error) {
      console.error('【错误】临时数据转正失败:', error)
      throw error
    }
  }

  /**
   * 获取临时数据统计信息
   * @param {String} taskId - 任务ID（选填，不传则查询所有临时数据统计）
   * @returns {Promise<Object>} 统计结果
   */
  async getTemporaryDataStatistics(taskId) {
    try {
      console.log('【调用】获取临时数据统计，taskId:', taskId)

      const queryParams = {
        page: 0,
        size: 1 // 只获取统计信息，不需要具体数据
      }

      // taskId 是可选参数
      if (taskId) {
        queryParams.taskId = taskId
      }

      // 通过查询接口获取统计信息
      const response = await this.queryTemporaryData(queryParams)

      const statistics = {
        total: (response.data?.statistics?.totalBaseInfoCount || 0) + (response.data?.statistics?.totalPriceCount || 0),
        baseInfoCount: response.data?.statistics?.totalBaseInfoCount || 0,
        priceCount: response.data?.statistics?.totalPriceCount || 0
      }

      console.log('【响应】临时数据统计结果:', statistics)
      return statistics
    } catch (error) {
      console.error('【错误】获取临时数据统计失败:', error)
      throw error
    }
  }

  /**
   * 批量删除临时数据
   * @param {Object} params - 删除参数
   * @param {Array<String>} params.baseInfoIds - 要删除的基础信息ID列表
   * @param {Array<String>} params.priceIds - 要删除的价格信息ID列表
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTemporaryData(params) {
    try {
      console.log('【调用】批量删除临时数据，参数:', params)
      
      // 参数验证
      if ((!params.baseInfoIds || params.baseInfoIds.length === 0) && 
          (!params.priceIds || params.priceIds.length === 0)) {
        throw new Error('至少需要选择一条数据进行删除')
      }

      // 注意：这个API在文档中没有提到，这里只是预留接口
      // 实际项目中可能需要根据实际的删除API进行调整
      const response = await this.http.delete('/api/materials/temporary/delete', {
        data: {
          baseInfoIds: params.baseInfoIds || [],
          priceIds: params.priceIds || []
        }
      })

      console.log('【响应】删除临时数据结果:', response)
      
      if (response.code === 0) {
        const totalCount = (params.baseInfoIds?.length || 0) + (params.priceIds?.length || 0)
        ElMessage.success(`成功删除 ${totalCount} 条数据`)
        return response.data
      } else {
        throw new Error(response.msg || '删除失败')
      }
    } catch (error) {
      console.error('【错误】删除临时数据失败:', error)
      throw error
    }
  }
}

// 创建单例实例
const temporaryDataService = new TemporaryDataService()

export default temporaryDataService