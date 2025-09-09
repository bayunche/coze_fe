// 合同解析基础字段管理页面工具函数

import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  MESSAGE_CONFIG, 
  FIELD_TYPE_CONFIG, 
  FIELD_STATUS_CONFIG,
  FIELD_STATUS 
} from './constants.js'

/**
 * 生成唯一的字段ID
 * @returns {string} 字段ID
 */
export const generateFieldId = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `field_${timestamp}_${random}`
}

/**
 * 格式化字段类型显示
 * @param {string} fieldType - 字段类型
 * @returns {object} 格式化后的类型信息
 */
export const formatFieldType = (fieldType) => {
  const config = FIELD_TYPE_CONFIG[fieldType]
  if (!config) {
    return {
      label: fieldType || '未知类型',
      type: 'default',
      icon: 'QuestionFilled'
    }
  }
  return config
}

/**
 * 格式化字段状态显示
 * @param {number} status - 字段状态
 * @returns {object} 格式化后的状态信息
 */
export const formatFieldStatus = (status) => {
  const config = FIELD_STATUS_CONFIG[status]
  if (!config) {
    return {
      label: '未知状态',
      type: 'default',
      icon: 'QuestionFilled'
    }
  }
  return config
}

/**
 * 验证字段编码格式
 * @param {string} fieldCode - 字段编码
 * @returns {boolean} 是否有效
 */
export const validateFieldCode = (fieldCode) => {
  if (!fieldCode) return false
  // 必须以字母开头，只能包含字母、数字和下划线
  const pattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  return pattern.test(fieldCode)
}

/**
 * 验证字段配置
 * @param {object} fieldData - 字段数据
 * @returns {object} 验证结果 { valid: boolean, errors: string[] }
 */
export const validateFieldData = (fieldData) => {
  const errors = []
  
  if (!fieldData.fieldName?.trim()) {
    errors.push('字段名称不能为空')
  }
  
  if (!fieldData.fieldCode?.trim()) {
    errors.push('字段编码不能为空')
  } else if (!validateFieldCode(fieldData.fieldCode)) {
    errors.push('字段编码格式不正确，必须以字母开头，只能包含字母、数字和下划线')
  }
  
  if (!fieldData.fieldType) {
    errors.push('字段类型不能为空')
  }
  
  if (fieldData.description && fieldData.description.length > 200) {
    errors.push('字段描述长度不能超过200个字符')
  }
  
  if (fieldData.displayOrder < 0) {
    errors.push('显示顺序必须大于等于0')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 处理搜索筛选
 * @param {array} data - 原始数据
 * @param {object} filters - 筛选条件
 * @returns {array} 筛选后的数据
 */
export const handleSearch = (data, filters) => {
  if (!data || !Array.isArray(data)) return []
  
  return data.filter(item => {
    // 关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      const searchFields = ['fieldName', 'fieldCode', 'description']
      const matchKeyword = searchFields.some(field => 
        item[field]?.toLowerCase().includes(keyword)
      )
      if (!matchKeyword) return false
    }
    
    // 字段类型筛选
    if (filters.fieldType && item.fieldType !== filters.fieldType) {
      return false
    }
    
    // 状态筛选
    if (filters.status !== '' && filters.status !== undefined && item.isEnabled !== filters.status) {
      return false
    }
    
    // 必填筛选
    if (filters.isRequired !== '' && filters.isRequired !== undefined && item.isRequired !== filters.isRequired) {
      return false
    }
    
    return true
  })
}

/**
 * 处理排序
 * @param {array} data - 数据
 * @param {string} sortField - 排序字段
 * @param {string} sortOrder - 排序方向 ascending/descending
 * @returns {array} 排序后的数据
 */
export const handleSort = (data, sortField, sortOrder) => {
  if (!data || !Array.isArray(data) || !sortField) return data
  
  return [...data].sort((a, b) => {
    let valueA = a[sortField]
    let valueB = b[sortField]
    
    // 处理不同类型的排序
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }
    
    if (valueA < valueB) {
      return sortOrder === 'ascending' ? -1 : 1
    }
    if (valueA > valueB) {
      return sortOrder === 'ascending' ? 1 : -1
    }
    return 0
  })
}

/**
 * 重置搜索表单
 * @param {object} formRef - 表单ref
 * @param {object} searchForm - 搜索表单数据
 * @param {function} loadData - 重新加载数据的回调
 */
export const resetSearchForm = (formRef, searchForm, loadData) => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置搜索表单数据
  Object.keys(searchForm).forEach(key => {
    if (typeof searchForm[key] === 'boolean') {
      searchForm[key] = false
    } else if (typeof searchForm[key] === 'number') {
      searchForm[key] = 0
    } else {
      searchForm[key] = ''
    }
  })
  
  // 重新加载数据
  if (typeof loadData === 'function') {
    loadData()
  }
}

/**
 * 重置分页
 * @param {object} pagination - 分页对象
 */
export const resetPagination = (pagination) => {
  pagination.currentPage = 1
}

/**
 * 确认删除操作
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调
 * @param {function} onCancel - 取消回调
 */
export const confirmDelete = async (message, onConfirm, onCancel) => {
  try {
    await ElMessageBox.confirm(
      message || MESSAGE_CONFIG.CONFIRM_DELETE,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    if (typeof onConfirm === 'function') {
      await onConfirm()
    }
  } catch (error) {
    // 用户取消操作
    if (typeof onCancel === 'function') {
      onCancel()
    }
  }
}

/**
 * 确认状态切换操作
 * @param {string} message - 确认消息
 * @param {function} onConfirm - 确认回调
 */
export const confirmToggleStatus = async (message, onConfirm) => {
  try {
    await ElMessageBox.confirm(
      message || MESSAGE_CONFIG.CONFIRM_TOGGLE,
      '状态切换确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (typeof onConfirm === 'function') {
      await onConfirm()
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消了状态切换操作')
  }
}

/**
 * 切换字段状态
 * @param {object} field - 字段对象
 * @param {function} updateField - 更新字段的回调函数
 */
export const toggleFieldStatus = async (field, updateField) => {
  const newStatus = field.isEnabled === FIELD_STATUS.ENABLED 
    ? FIELD_STATUS.DISABLED 
    : FIELD_STATUS.ENABLED
  
  const statusText = newStatus === FIELD_STATUS.ENABLED ? '启用' : '停用'
  const message = `确定要${statusText}字段"${field.fieldName}"吗？`
  
  await confirmToggleStatus(message, async () => {
    try {
      await updateField({
        ...field,
        isEnabled: newStatus,
        updateTime: new Date().toLocaleString()
      })
      
      ElMessage.success(`字段${statusText}成功`)
    } catch (error) {
      console.error('切换字段状态失败:', error)
      ElMessage.error(`字段${statusText}失败`)
    }
  })
}

/**
 * 导出字段配置
 * @param {array} fields - 字段列表
 * @param {string} filename - 文件名
 */
export const exportFieldConfig = (fields, filename = 'contract-fields-config') => {
  try {
    const config = {
      exportTime: new Date().toLocaleString(),
      version: '1.0.0',
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
    
    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    ElMessage.success(MESSAGE_CONFIG.EXPORT_SUCCESS)
  } catch (error) {
    console.error('导出配置失败:', error)
    ElMessage.error(MESSAGE_CONFIG.EXPORT_ERROR)
  }
}

/**
 * 导入字段配置
 * @param {File} file - 配置文件
 * @returns {Promise<object>} 导入的配置
 */
export const importFieldConfig = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('请选择要导入的配置文件'))
      return
    }
    
    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择JSON格式的配置文件'))
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result)
        
        // 验证配置格式
        if (!config.fields || !Array.isArray(config.fields)) {
          reject(new Error('配置文件格式不正确'))
          return
        }
        
        resolve(config)
      } catch (error) {
        reject(new Error('配置文件解析失败，请检查文件格式'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * 计算统计数据
 * @param {array} fields - 字段列表
 * @returns {object} 统计数据
 */
export const calculateStatistics = (fields) => {
  if (!fields || !Array.isArray(fields)) {
    return {
      total: 0,
      enabledCount: 0,
      disabledCount: 0,
      requiredCount: 0
    }
  }
  
  return {
    total: fields.length,
    enabledCount: fields.filter(field => field.isEnabled === FIELD_STATUS.ENABLED).length,
    disabledCount: fields.filter(field => field.isEnabled === FIELD_STATUS.DISABLED).length,
    requiredCount: fields.filter(field => field.isRequired === true).length
  }
}

/**
 * 获取筛选标签文本
 * @param {string} filterType - 筛选类型
 * @returns {string} 筛选标签
 */
export const getFilterLabel = (filterType) => {
  if (filterType === FIELD_STATUS.ENABLED) return '启用中'
  if (filterType === FIELD_STATUS.DISABLED) return '已停用'
  if (filterType === 'required') return '必填字段'
  return '全部'
}

/**
 * 检查字段编码是否重复
 * @param {string} fieldCode - 字段编码
 * @param {array} existingFields - 现有字段列表
 * @param {string} excludeId - 排除的字段ID（编辑时用）
 * @returns {boolean} 是否重复
 */
export const isFieldCodeDuplicate = (fieldCode, existingFields, excludeId = null) => {
  if (!fieldCode || !existingFields) return false
  
  return existingFields.some(field => 
    field.fieldCode === fieldCode && field.id !== excludeId
  )
}

/**
 * 格式化时间显示
 * @param {string} timeString - 时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatTime = (timeString) => {
  if (!timeString) return '-'
  
  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) return timeString
    
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    return timeString
  }
}

/**
 * 生成字段显示顺序
 * @param {array} existingFields - 现有字段列表
 * @returns {number} 新的显示顺序
 */
export const generateDisplayOrder = (existingFields) => {
  if (!existingFields || existingFields.length === 0) return 1
  
  const maxOrder = Math.max(...existingFields.map(field => field.displayOrder || 0))
  return maxOrder + 1
}