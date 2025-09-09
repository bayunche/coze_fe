/**
 * 合同解析基础字段管理服务类
 * 使用localStorage模拟后端数据存储
 */
import { PRESET_FIELDS, FIELD_STATUS } from '@/views/contract-field-management/constants.js'

class ContractFieldService {
  constructor() {
    this.storageKey = 'contract_fields_data'
    this.initializeData()
  }

  /**
   * 初始化数据 - 首次访问时创建预设字段
   */
  initializeData() {
    const existingData = localStorage.getItem(this.storageKey)
    if (!existingData) {
      const initialFields = PRESET_FIELDS.map((field, index) => ({
        id: `preset_field_${index + 1}`,
        ...field,
        isEnabled: FIELD_STATUS.ENABLED,
        validationRule: '',
        defaultValue: '',
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }))
      
      this.saveToStorage(initialFields)
      console.log('初始化合同字段数据完成，创建了', initialFields.length, '个预设字段')
    }
  }

  /**
   * 保存数据到localStorage
   * @param {Array} data - 字段数据数组
   */
  saveToStorage(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('保存字段数据失败:', error)
      throw new Error('数据保存失败')
    }
  }

  /**
   * 从localStorage获取数据
   * @returns {Array} 字段数据数组
   */
  getFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取字段数据失败:', error)
      return []
    }
  }

  /**
   * 模拟API响应格式
   * @param {*} data - 数据
   * @param {string} message - 消息
   * @returns {Object} API响应格式
   */
  createResponse(data, message = 'success') {
    return {
      code: 200,
      message,
      data,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 模拟API延迟
   * @param {number} delay - 延迟时间（毫秒）
   * @returns {Promise}
   */
  delay(delay = 200) {
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 获取字段列表
   * @param {Object} params - 查询参数
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.fieldType - 字段类型筛选
   * @param {number} params.status - 状态筛选
   * @param {boolean} params.isRequired - 是否必填筛选
   * @param {number} params.page - 页码
   * @param {number} params.size - 页大小
   * @returns {Promise<Object>} 字段列表响应
   */
  async getFieldList(params = {}) {
    console.log('【调用】获取字段列表，参数:', params)
    
    await this.delay()
    
    try {
      let fields = this.getFromStorage()
      
      // 应用搜索和筛选
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        fields = fields.filter(field => 
          field.fieldName.toLowerCase().includes(keyword) ||
          field.fieldCode.toLowerCase().includes(keyword) ||
          (field.description && field.description.toLowerCase().includes(keyword))
        )
      }
      
      if (params.fieldType) {
        fields = fields.filter(field => field.fieldType === params.fieldType)
      }
      
      if (params.status !== undefined && params.status !== '') {
        fields = fields.filter(field => field.isEnabled === params.status)
      }
      
      if (params.isRequired !== undefined && params.isRequired !== '') {
        fields = fields.filter(field => field.isRequired === params.isRequired)
      }
      
      // 排序 - 按显示顺序和创建时间排序
      fields.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder
        }
        return new Date(b.createTime) - new Date(a.createTime)
      })
      
      // 分页处理
      const page = params.page || 0
      const size = params.size || 20
      const start = page * size
      const end = start + size
      const pagedFields = fields.slice(start, end)
      
      const response = this.createResponse({
        list: pagedFields,
        total: fields.length,
        page,
        size,
        totalPages: Math.ceil(fields.length / size)
      })
      
      console.log('【响应】字段列表查询结果:', response)
      return response
    } catch (error) {
      console.error('获取字段列表失败:', error)
      throw new Error('获取字段列表失败')
    }
  }

  /**
   * 创建字段
   * @param {Object} fieldData - 字段数据
   * @returns {Promise<Object>} 创建结果
   */
  async createField(fieldData) {
    console.log('【调用】创建字段，参数:', fieldData)
    
    await this.delay()
    
    try {
      // 参数验证
      if (!fieldData.fieldName) {
        throw new Error('字段名称不能为空')
      }
      if (!fieldData.fieldCode) {
        throw new Error('字段编码不能为空')
      }
      if (!fieldData.fieldType) {
        throw new Error('字段类型不能为空')
      }
      
      const fields = this.getFromStorage()
      
      // 检查字段编码是否重复
      const existingField = fields.find(field => field.fieldCode === fieldData.fieldCode)
      if (existingField) {
        throw new Error('字段编码已存在')
      }
      
      // 创建新字段
      const newField = {
        id: fieldData.id || `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        fieldName: fieldData.fieldName.trim(),
        fieldCode: fieldData.fieldCode.trim(),
        fieldType: fieldData.fieldType,
        description: fieldData.description?.trim() || '',
        isRequired: Boolean(fieldData.isRequired),
        isEnabled: fieldData.isEnabled !== undefined ? fieldData.isEnabled : FIELD_STATUS.ENABLED,
        defaultValue: fieldData.defaultValue?.trim() || '',
        validationRule: fieldData.validationRule?.trim() || '',
        displayOrder: fieldData.displayOrder || 0,
        createTime: fieldData.createTime || new Date().toLocaleString(),
        updateTime: fieldData.updateTime || new Date().toLocaleString()
      }
      
      fields.push(newField)
      this.saveToStorage(fields)
      
      const response = this.createResponse(newField, '字段创建成功')
      console.log('【响应】创建字段结果:', response)
      return response
    } catch (error) {
      console.error('创建字段失败:', error)
      throw error
    }
  }

  /**
   * 更新字段
   * @param {string} fieldId - 字段ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateField(fieldId, updateData) {
    console.log('【调用】更新字段，ID:', fieldId, '更新数据:', updateData)
    
    await this.delay()
    
    try {
      if (!fieldId) {
        throw new Error('字段ID不能为空')
      }
      
      const fields = this.getFromStorage()
      const fieldIndex = fields.findIndex(field => field.id === fieldId)
      
      if (fieldIndex === -1) {
        throw new Error('字段不存在')
      }
      
      // 如果更新字段编码，检查是否重复
      if (updateData.fieldCode && updateData.fieldCode !== fields[fieldIndex].fieldCode) {
        const existingField = fields.find(field => 
          field.fieldCode === updateData.fieldCode && field.id !== fieldId
        )
        if (existingField) {
          throw new Error('字段编码已存在')
        }
      }
      
      // 更新字段
      const updatedField = {
        ...fields[fieldIndex],
        ...updateData,
        updateTime: new Date().toLocaleString()
      }
      
      fields[fieldIndex] = updatedField
      this.saveToStorage(fields)
      
      const response = this.createResponse(updatedField, '字段更新成功')
      console.log('【响应】更新字段结果:', response)
      return response
    } catch (error) {
      console.error('更新字段失败:', error)
      throw error
    }
  }

  /**
   * 删除字段
   * @param {string} fieldId - 字段ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteField(fieldId) {
    console.log('【调用】删除字段，ID:', fieldId)
    
    await this.delay()
    
    try {
      if (!fieldId) {
        throw new Error('字段ID不能为空')
      }
      
      const fields = this.getFromStorage()
      const fieldIndex = fields.findIndex(field => field.id === fieldId)
      
      if (fieldIndex === -1) {
        throw new Error('字段不存在')
      }
      
      const deletedField = fields.splice(fieldIndex, 1)[0]
      this.saveToStorage(fields)
      
      const response = this.createResponse(deletedField, '字段删除成功')
      console.log('【响应】删除字段结果:', response)
      return response
    } catch (error) {
      console.error('删除字段失败:', error)
      throw error
    }
  }

  /**
   * 获取字段详情
   * @param {string} fieldId - 字段ID
   * @returns {Promise<Object>} 字段详情
   */
  async getFieldDetail(fieldId) {
    console.log('【调用】获取字段详情，ID:', fieldId)
    
    await this.delay()
    
    try {
      if (!fieldId) {
        throw new Error('字段ID不能为空')
      }
      
      const fields = this.getFromStorage()
      const field = fields.find(field => field.id === fieldId)
      
      if (!field) {
        throw new Error('字段不存在')
      }
      
      const response = this.createResponse(field, '获取字段详情成功')
      console.log('【响应】字段详情:', response)
      return response
    } catch (error) {
      console.error('获取字段详情失败:', error)
      throw error
    }
  }

  /**
   * 批量更新字段状态
   * @param {Array} fieldIds - 字段ID数组
   * @param {number} status - 新状态
   * @returns {Promise<Object>} 批量更新结果
   */
  async batchUpdateStatus(fieldIds, status) {
    console.log('【调用】批量更新字段状态，IDs:', fieldIds, '状态:', status)
    
    await this.delay()
    
    try {
      if (!fieldIds || fieldIds.length === 0) {
        throw new Error('字段ID列表不能为空')
      }
      
      if (status === undefined || status === null) {
        throw new Error('状态参数不能为空')
      }
      
      const fields = this.getFromStorage()
      const updatedFields = []
      
      fieldIds.forEach(fieldId => {
        const fieldIndex = fields.findIndex(field => field.id === fieldId)
        if (fieldIndex !== -1) {
          fields[fieldIndex] = {
            ...fields[fieldIndex],
            isEnabled: status,
            updateTime: new Date().toLocaleString()
          }
          updatedFields.push(fields[fieldIndex])
        }
      })
      
      this.saveToStorage(fields)
      
      const response = this.createResponse(updatedFields, `批量更新${updatedFields.length}个字段状态成功`)
      console.log('【响应】批量更新状态结果:', response)
      return response
    } catch (error) {
      console.error('批量更新字段状态失败:', error)
      throw error
    }
  }

  /**
   * 批量删除字段
   * @param {Array} fieldIds - 字段ID数组
   * @returns {Promise<Object>} 批量删除结果
   */
  async batchDeleteFields(fieldIds) {
    console.log('【调用】批量删除字段，IDs:', fieldIds)
    
    await this.delay()
    
    try {
      if (!fieldIds || fieldIds.length === 0) {
        throw new Error('字段ID列表不能为空')
      }
      
      const fields = this.getFromStorage()
      const deletedFields = []
      
      // 从后往前删除，避免索引错乱
      for (let i = fields.length - 1; i >= 0; i--) {
        if (fieldIds.includes(fields[i].id)) {
          deletedFields.push(fields.splice(i, 1)[0])
        }
      }
      
      this.saveToStorage(fields)
      
      const response = this.createResponse(deletedFields.reverse(), `批量删除${deletedFields.length}个字段成功`)
      console.log('【响应】批量删除结果:', response)
      return response
    } catch (error) {
      console.error('批量删除字段失败:', error)
      throw error
    }
  }

  /**
   * 获取字段统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getFieldStatistics() {
    console.log('【调用】获取字段统计信息')
    
    await this.delay()
    
    try {
      const fields = this.getFromStorage()
      
      const statistics = {
        total: fields.length,
        enabledCount: fields.filter(field => field.isEnabled === FIELD_STATUS.ENABLED).length,
        disabledCount: fields.filter(field => field.isEnabled === FIELD_STATUS.DISABLED).length,
        requiredCount: fields.filter(field => field.isRequired === true).length,
        optionalCount: fields.filter(field => field.isRequired === false).length,
        fieldTypeStats: {}
      }
      
      // 统计各字段类型数量
      fields.forEach(field => {
        const type = field.fieldType
        statistics.fieldTypeStats[type] = (statistics.fieldTypeStats[type] || 0) + 1
      })
      
      const response = this.createResponse(statistics, '获取统计信息成功')
      console.log('【响应】字段统计信息:', response)
      return response
    } catch (error) {
      console.error('获取字段统计信息失败:', error)
      throw error
    }
  }

  /**
   * 重置为预设字段
   * @returns {Promise<Object>} 重置结果
   */
  async resetToPresetFields() {
    console.log('【调用】重置为预设字段')
    
    await this.delay()
    
    try {
      const presetFields = PRESET_FIELDS.map((field, index) => ({
        id: `preset_field_${index + 1}`,
        ...field,
        isEnabled: FIELD_STATUS.ENABLED,
        validationRule: '',
        defaultValue: '',
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }))
      
      this.saveToStorage(presetFields)
      
      const response = this.createResponse(presetFields, '重置为预设字段成功')
      console.log('【响应】重置结果:', response)
      return response
    } catch (error) {
      console.error('重置为预设字段失败:', error)
      throw error
    }
  }

  /**
   * 导出字段配置
   * @returns {Promise<Object>} 导出数据
   */
  async exportFieldConfig() {
    console.log('【调用】导出字段配置')
    
    await this.delay()
    
    try {
      const fields = this.getFromStorage()
      
      const config = {
        exportTime: new Date().toLocaleString(),
        version: '1.0.0',
        total: fields.length,
        fields: fields.map(field => ({
          fieldName: field.fieldName,
          fieldCode: field.fieldCode,
          fieldType: field.fieldType,
          description: field.description,
          isRequired: field.isRequired,
          isEnabled: field.isEnabled,
          defaultValue: field.defaultValue,
          validationRule: field.validationRule,
          displayOrder: field.displayOrder
        }))
      }
      
      const response = this.createResponse(config, '导出配置成功')
      console.log('【响应】导出配置结果:', response)
      return response
    } catch (error) {
      console.error('导出字段配置失败:', error)
      throw error
    }
  }

  /**
   * 清空所有字段数据（开发调试用）
   * @returns {Promise<Object>} 清空结果
   */
  async clearAllFields() {
    console.log('【调用】清空所有字段数据')
    
    await this.delay()
    
    try {
      localStorage.removeItem(this.storageKey)
      
      const response = this.createResponse([], '清空所有字段数据成功')
      console.log('【响应】清空结果:', response)
      return response
    } catch (error) {
      console.error('清空字段数据失败:', error)
      throw error
    }
  }
}

export default ContractFieldService