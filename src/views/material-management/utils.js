// MaterialManagementPage 页面工具函数
import { ElMessage, ElMessageBox } from 'element-plus'
import { TAB_NAMES, PAGINATION_CONFIG } from './constants.js'

/**
 * 处理标签页切换
 * @param {string} targetName - 目标标签页名称
 * @param {Ref} currentTab - 当前标签页引用
 * @param {Function} loadData - 加载数据函数
 */
export const switchTab = (targetName, currentTab, loadData) => {
  currentTab.value = targetName
  loadData()
}

/**
 * 执行物资搜索
 * @param {Object} searchForm - 搜索表单数据
 * @param {Function} loadMaterials - 加载物资函数
 * @param {Function} resetPagination - 重置分页函数
 */
export const performMaterialSearch = (searchForm, loadMaterials, resetPagination) => {
  resetPagination()
  loadMaterials(searchForm)
}

/**
 * 执行价格搜索
 * @param {Object} searchForm - 搜索表单数据
 * @param {Function} loadPrices - 加载价格函数
 * @param {Function} resetPagination - 重置分页函数
 */
export const performPriceSearch = (searchForm, loadPrices, resetPagination) => {
  resetPagination()
  loadPrices(searchForm)
}

/**
 * 重置搜索表单
 * @param {Ref} formRef - 表单引用
 * @param {Object} searchForm - 搜索表单对象
 * @param {Function} loadData - 加载数据函数
 */
export const resetSearchForm = (formRef, searchForm, loadData) => {
  formRef.value?.resetFields()
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadData()
}

/**
 * 处理分页大小变化
 * @param {number} newSize - 新的分页大小
 * @param {Object} pagination - 分页配置对象
 * @param {Function} loadData - 加载数据函数
 */
export const changePaginationSize = (newSize, pagination, loadData) => {
  pagination.pageSize = newSize
  pagination.current = 1
  loadData()
}

/**
 * 处理当前页变化
 * @param {number} newCurrent - 新的当前页
 * @param {Object} pagination - 分页配置对象
 * @param {Function} loadData - 加载数据函数
 */
export const changePaginationCurrent = (newCurrent, pagination, loadData) => {
  pagination.current = newCurrent
  loadData()
}

/**
 * 初始化分页配置
 */
export const initPagination = () => {
  return {
    current: PAGINATION_CONFIG.DEFAULT_CURRENT,
    pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
    total: 0
  }
}

/**
 * 重置分页到第一页
 * @param {Object} pagination - 分页配置对象
 */
export const resetPagination = (pagination) => {
  pagination.current = 1
}

/**
 * 打开添加物资对话框
 * @param {Object} dialogState - 对话框状态对象
 */
export const openAddMaterialDialog = (dialogState) => {
  dialogState.showMaterialDialog = true
  dialogState.isEditingMaterial = false
  dialogState.currentMaterial = {}
}

/**
 * 打开编辑物资对话框
 * @param {Object} material - 物资数据
 * @param {Object} dialogState - 对话框状态对象
 */
export const openEditMaterialDialog = (material, dialogState) => {
  dialogState.showMaterialDialog = true
  dialogState.isEditingMaterial = true
  dialogState.currentMaterial = { ...material }
}

/**
 * 打开添加价格对话框
 * @param {Object} dialogState - 对话框状态对象
 */
export const openAddPriceDialog = (dialogState) => {
  dialogState.showPriceDialog = true
  dialogState.isEditingPrice = false
  dialogState.currentPrice = {}
}

/**
 * 打开编辑价格对话框
 * @param {Object} price - 价格数据
 * @param {Object} dialogState - 对话框状态对象
 */
export const openEditPriceDialog = (price, dialogState) => {
  dialogState.showPriceDialog = true
  dialogState.isEditingPrice = true
  dialogState.currentPrice = { ...price }
}

/**
 * 打开导入对话框
 * @param {Object} dialogState - 对话框状态对象
 */
export const openImportDialog = (dialogState) => {
  dialogState.showImportDialog = true
}

/**
 * 处理单个删除确认
 * @param {Object} item - 要删除的项目
 * @param {Function} deleteCallback - 删除回调函数
 */
export const confirmSingleDelete = async (item, deleteCallback) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${item.materialName || item.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await deleteCallback([item.id])
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 处理批量删除确认
 * @param {Array} selectedItems - 选中的项目数组
 * @param {Function} deleteCallback - 删除回调函数
 */
export const confirmBatchDelete = async (selectedItems, deleteCallback) => {
  if (selectedItems.length === 0) {
    ElMessage.warning('请先选择要删除的项目')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的${selectedItems.length}个项目吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    const ids = selectedItems.map(item => item.id)
    await deleteCallback(ids)
    ElMessage.success('批量删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

/**
 * 处理表格选择变化
 * @param {Array} selection - 选中的项目
 * @param {Ref} selectedItems - 选中项目的引用
 */
export const onTableSelectionChange = (selection, selectedItems) => {
  selectedItems.value = selection
}

/**
 * 导出当前数据
 * @param {Array} data - 要导出的数据
 * @param {string} filename - 文件名
 * @param {string} currentTab - 当前标签页
 */
export const exportCurrentData = (data, filename, currentTab) => {
  if (data.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  try {
    // 这里应该调用实际的导出API
    console.log('导出数据:', { data, filename, currentTab })
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Export error:', error)
  }
}

/**
 * 处理文件上传
 * @param {File} file - 上传的文件
 * @param {Function} uploadCallback - 上传成功回调
 */
export const uploadFile = async (file, uploadCallback) => {
  try {
    // 这里应该调用实际的上传API
    const result = await uploadCallback(file)
    ElMessage.success('导入成功')
    return result
  } catch (error) {
    ElMessage.error('导入失败')
    console.error('Upload error:', error)
    throw error
  }
}

/**
 * 格式化显示时间
 * @param {string|Date} time - 时间
 * @returns {string} 格式化后的时间字符串
 */
export const formatDisplayTime = (time) => {
  if (!time) return '--'
  
  const date = new Date(time)
  if (isNaN(date.getTime())) return '--'
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化价格显示
 * @param {number} price - 价格
 * @returns {string} 格式化后的价格字符串
 */
export const formatPriceDisplay = (price) => {
  if (price === null || price === undefined) return '--'
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(price)
}

/**
 * 获取统计数据
 * @param {string} currentTab - 当前标签页
 * @param {Array} materials - 物资列表
 * @param {Array} prices - 价格列表
 * @returns {Object} 统计数据对象
 */
export const calculateStats = (currentTab, materials, prices) => {
  if (currentTab === TAB_NAMES.MATERIALS) {
    return {
      total: materials.length,
      label: '基础物资总数',
      icon: '📦'
    }
  } else if (currentTab === TAB_NAMES.PRICES) {
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, item) => sum + (item.price || 0), 0) / prices.length 
      : 0
    
    return {
      total: prices.length,
      average: averagePrice,
      label: '价格记录总数',
      icon: '💰'
    }
  }
  
  return {
    total: 0,
    label: '总数',
    icon: '📊'
  }
}