// 乙供物资解析详情页面工具函数
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import supplierMaterialService from '@/services/SupplierMaterialService.js'
import CozeService from '@/utils/coze.js'
// import { useChatStore } from '@/stores/chat.js' // 暂时不需要聊天存储
import { 
  MATCH_TYPE_MAP, 
  WORKFLOW_IDS, 
  MESSAGE_CONFIG,
  DEFAULT_VALUES 
} from './constants.js'

/**
 * 创建Coze服务实例
 * @returns {CozeService} Coze服务实例
 */
export const createCozeService = () => {
  return new CozeService(
    import.meta.env.VITE_COZE_API_KEY || 
    'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
  )
}

/**
 * 格式化材料详情数据
 * @param {Object} item - 原始数据项
 * @returns {Object} 格式化后的数据项
 */
export const formatMaterialDetail = (item) => {
  // 兼容新旧数据格式
  const formattedItem = {
    id: item.taskDataId || item.id,
    taskDataId: item.taskDataId || item.id,
    taskId: item.taskId,
    taskDetailId: item.taskDetailId,
    material_name: item.materialName || item.excelDataMaterialName || DEFAULT_VALUES.EMPTY_TEXT,
    material_specification: item.specifications || item.excelDataSpecificationModel || DEFAULT_VALUES.EMPTY_TEXT,
    material_unit: item.unit || DEFAULT_VALUES.EMPTY_TEXT,
    material_quantity: item.quantity || DEFAULT_VALUES.EMPTY_TEXT,
    material_price: item.unitPrice || item.excelDataPrice || DEFAULT_VALUES.EMPTY_TEXT,
    material_total_price: item.totalPrice || DEFAULT_VALUES.EMPTY_TEXT,
    matched_name: item.baseInfo?.materialName || item.matchedDataMaterialName || DEFAULT_VALUES.EMPTY_TEXT,
    matched_specification: item.baseInfo?.specifications || item.matchedDataSpecificationModel || DEFAULT_VALUES.EMPTY_TEXT,
    matched_unit: item.baseInfo?.unit || DEFAULT_VALUES.EMPTY_TEXT,
    matched_price: formatPrice(item.priceInfo?.taxPrice || item.matchedPrice),
    matched_quarter: item.priceInfo?.quarter || DEFAULT_VALUES.EMPTY_TEXT,
    similarity: item.matchOptions?.[0]?.matchScore ? `${item.matchOptions[0].matchScore}%` : formatSimilarity(item.matchedScore),
    match_type: getMatchType(item),
    confirm_result: item.confirmResult,
    confirmBaseDataId: item.confirmBaseDataId || item.matchedDataId,
    confirmPriceId: item.confirmPriceId || item.matchedPriceId,
    editing: false,
    selected_match: null,
    confirming: false, // 单项确认加载状态
    original_item: item,
    // 保存初始匹配数据ID快照，用于检测是否有变更
    initialConfirmBaseDataId: item.confirmBaseDataId || item.matchedDataId || null,
    initialConfirmPriceId: item.confirmPriceId || item.matchedPriceId || null
  }

  // 处理匹配选项数据（兼容新旧格式）
  if (Array.isArray(item.matchOptions) && item.matchOptions.length > 0) {
    // 新格式：来自复杂查询接口
    formattedItem.similar_matches = item.matchOptions.map((option) => {
      const similarMatchItem = {
        id: option.matchResultId,
        matched_id: option.matchedId,
        baseDataId: option.matchedId,
        name: option.baseInfo?.materialName || '未知名称',
        specification: option.baseInfo?.specifications || '未知型号',
        unit: option.baseInfo?.unit || '未知单位',
        similarity: option.matchScore || 0,
        priceOptions: option.priceOptions || [],
        // 默认选择第一个价格选项
        selectedPriceId: option.priceOptions?.[0]?.priceId || null,
        selectedPrice: option.priceOptions?.[0]?.taxPrice || 0,
        selectedQuarter: option.priceOptions?.[0]?.quarter || '未知季度'
      }
      
      // 检查是否与当前确认项一致，用于回显
      if (
        item.confirmBaseDataId === similarMatchItem.matched_id &&
        item.confirmPriceId === similarMatchItem.selectedPriceId
      ) {
        formattedItem.selected_match = similarMatchItem
      }
      
      return similarMatchItem
    })
  } else if (item.comparison_result === 2 && Array.isArray(item.subData)) {
    // 旧格式：兼容原有数据结构
    formattedItem.similar_matches = item.subData.map((sub) => {
      const similarMatchItem = {
        id: sub.id,
        matched_id: sub.matchedDataId,
        matchedPriceId: sub.matchedPriceId || null,
        name: sub.matchedDataMaterialName || '未知名称',
        specification: sub.matchedDataSpecificationModel || '未知型号',
        price: sub.matchedPrice || 0,
        similarity: sub.score || 0,
        matchedPriceQuarter: sub.matchedPriceQuarter || '未知季度'
      }
      
      // 检查是否与当前匹配项一致，用于回显
      const itemMatchedScoreNum = parseFloat(item.matchedScore) || 0
      if (
        item.matchedDataMaterialName === similarMatchItem.name &&
        item.matchedPrice === similarMatchItem.price &&
        itemMatchedScoreNum === similarMatchItem.similarity
      ) {
        formattedItem.selected_match = similarMatchItem
      }
      
      return similarMatchItem
    })
  } else {
    formattedItem.similar_matches = []
  }

  return formattedItem
}

/**
 * 获取匹配类型文本
 * @param {Object} item - 数据项
 * @returns {string} 匹配类型文本
 */
export const getMatchType = (item) => {
  // 优先使用新格式的matchedType字段
  if (item.matchedType !== undefined) {
    // matchedType: 0：无匹配，1：精确匹配，2：相似匹配，3：历史匹配，4：人工匹配
    const typeMap = {
      0: '无匹配',
      1: '精确匹配',
      2: '相似匹配',
      3: '历史匹配',
      4: '人工匹配'
    }
    return typeMap[item.matchedType] || DEFAULT_VALUES.UNKNOWN_STATUS
  }
  
  // 兼容旧格式
  if (item.confirm_type === 2) {
    return '精确匹配'
  }
  return MATCH_TYPE_MAP[item.comparison_result] || DEFAULT_VALUES.UNKNOWN_STATUS
}

/**
 * 格式化价格显示
 * @param {number|string} price - 价格
 * @returns {string} 格式化后的价格
 */
export const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return DEFAULT_VALUES.EMPTY_TEXT
  }
  
  const numPrice = parseFloat(price)
  if (isNaN(numPrice)) {
    return DEFAULT_VALUES.EMPTY_TEXT
  }
  
  return `¥${numPrice.toFixed(2)}`
}

/**
 * 格式化相似度显示
 * @param {number|string} similarity - 相似度
 * @returns {string} 格式化后的相似度
 */
export const formatSimilarity = (similarity) => {
  if (similarity === null || similarity === undefined || similarity === '') {
    return DEFAULT_VALUES.EMPTY_TEXT
  }
  
  const numSimilarity = parseFloat(similarity)
  if (isNaN(numSimilarity)) {
    return DEFAULT_VALUES.EMPTY_TEXT
  }
  
  return `${numSimilarity}%`
}

/**
 * 格式化相似匹配选项标签 - 适配新接口格式
 * @param {Object} item - 相似匹配项
 * @returns {string} 格式化后的标签
 */
export const formatSimilarMatchLabel = (item) => {
  const name = item.name || ''
  const specification = item.specification || ''
  // 新接口格式：使用selectedPrice和selectedQuarter
  const price = item.selectedPrice !== null ? formatPrice(item.selectedPrice) : (item.price !== null ? formatPrice(item.price) : '')
  const quarter = item.selectedQuarter || item.matchedPriceQuarter || item.quarter || ''

  const parts = []
  if (price) parts.push(price)
  if (quarter) parts.push(quarter)

  const bracketContent = parts.join(',')
  return `${name} ${specification} ${bracketContent ? `(${bracketContent})` : ''}`
}

/**
 * 获取匹配类型标签样式
 * @param {string} type - 匹配类型
 * @returns {string} 标签样式类型
 */
export const getMatchTypeTag = (type) => {
  const typeMap = {
    '精确匹配': 'success',
    '相似匹配': 'warning',
    '无匹配': 'danger',
    '人工匹配': 'info'
  }
  return typeMap[type] || 'info'
}

/**
 * 获取物资详情数据
 * @param {string|number} taskId - 任务ID
 * @param {string|number} detailId - 详情ID
 * @param {number} page - 页码
 * @param {number} size - 页大小
 * @returns {Promise<Object>} 包含表格数据和总数的对象
 */
export const fetchMaterialDetail = async (taskId, detailId, page = 1, size = 10) => {
  try {
    // 优先使用新的API接口
    const params = {
      taskId: taskId,
      taskDetailId: detailId, // 可选参数
      page: page - 1, // API的页码从0开始，前端从1开始
      size: size
    }
    
    console.log('【诊断】调用乙供物资复杂查询接口参数:', params)
    
    const response = await supplierMaterialService.queryMaterials(params)
    
    if (response) {
      console.log('【诊断】获取到的乙供物资详情原始数据:', response)
      
      // 提取数据列表和分页信息
      const dataList = response.content || []
      const pageInfo = response.page || {}
      const totalCount = pageInfo.totalElements || response.statistics?.totalCount || dataList.length
      
      // 格式化数据
      const formattedData = dataList.map(formatMaterialDetail)
      
      console.log('【诊断】格式化后的乙供物资详情数据:', formattedData)
      
      return {
        tableData: formattedData,
        total: totalCount,
        statistics: response.statistics
      }
    } else {
      // 如果新接口失败，尝试使用旧的工作流方式
      console.log('【诊断】新接口无响应，尝试使用工作流方式')
      const cozeService = createCozeService()
      
      const workflowParams = {
        taskId: taskId,
        task_detail_id: detailId,
        index: page,
        pageSize: size
      }
      
      const detailResult = await cozeService.runWorkflow(WORKFLOW_IDS.DETAIL, workflowParams)
      
      if (detailResult && detailResult.data) {
        const parsed = JSON.parse(detailResult.data)
        const parsedData = parsed?.result
        const totalCount = parsed?.totalCount || (Array.isArray(parsedData) ? parsedData.length : 0)
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const tableData = parsedData.map(item => formatMaterialDetail(item))
          return {
            tableData,
            total: totalCount
          }
        }
      }
      
      ElMessage.warning('未获取到数据')
      return { tableData: [], total: 0 }
    }
  } catch (error) {
    console.error('【错误】获取乙供物资详情失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.LOAD_ERROR}: ${error.message || '未知错误'}`)
    return { tableData: [], total: 0 }
  }
}

/**
 * 获取物资选择列表数据 - 使用新的基础信息接口
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 页大小
 * @param {string} keyword - 搜索关键字
 * @returns {Promise<Object>} 包含选择列表数据和总数的对象
 */
export const fetchSelectionList = async (pageNum = 1, pageSize = 10, keyword = '') => {
  try {
    const params = {
      keyword: keyword,
      page: pageNum - 1, // API页码从0开始
      size: pageSize
    }
    
    console.log('【诊断】调用物资基础信息查询接口参数:', params)
    
    const response = await supplierMaterialService.searchMaterialsWithPrices(params)
    
    if (response) {
      console.log('【诊断】物资基础信息查询返回数据:', response)
      
      const selectionList = response.content || []
      const total = response.totalElements || 0
      
      return {
        selectionList,
        total
      }
    } else {
      return { selectionList: [], total: 0 }
    }
  } catch (error) {
    console.error('【错误】获取物资选择列表失败:', error)
    ElMessage.error(`获取匹配选择数据失败: ${error.message || '未知错误'}`)
    return { selectionList: [], total: 0 }
  }
}

/**
 * 保存解析结果 - 使用批量确认接口
 * @param {Array} tableData - 表格数据
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveParsingResults = async (tableData) => {
  try {
    // 筛选出需要确认的数据项（未确认状态的）
    const itemsToConfirm = tableData.filter(item => {
      return item.confirm_result !== 1 && item.confirmBaseDataId && item.confirmPriceId
    })

    if (itemsToConfirm.length === 0) {
      ElMessage.info('没有需要确认的数据项')
      return false
    }

    console.log('【诊断】批量确认乙供物资，数量:', itemsToConfirm.length)
    
    // 调用批量确认功能
    const batchResult = await supplierMaterialService.batchConfirm(itemsToConfirm)

    if (batchResult) {
      const successCount = batchResult.success?.length || 0
      const failedCount = batchResult.failed?.length || 0
      
      if (failedCount > 0) {
        console.warn('【警告】部分确认失败:', batchResult.failed)
      }
      
      return successCount > 0
    }
    
    return false
  } catch (error) {
    console.error('【错误】保存乙供物资解析结果失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.SAVE_ERROR}: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 处理相似匹配选择变化 - 适配新接口格式并实现人工确认
 * @param {Object} row - 当前行数据
 * @param {Object} selectedMatch - 选中的匹配项
 */
export const handleSimilarMatchChange = async (row, selectedMatch) => {
  if (row && selectedMatch) {
    row.matched_name = selectedMatch.name
    row.matched_specification = selectedMatch.specification
    row.matched_price = formatPrice(selectedMatch.selectedPrice || selectedMatch.price)
    row.matched_quarter = selectedMatch.selectedQuarter || selectedMatch.quarter
    
    console.log('【诊断】相似匹配选择:', selectedMatch, row)
    
    // 调用人工确认接口
    try {
      const confirmParams = {
        id: row.taskDataId,
        confirmBaseDataId: selectedMatch.matched_id || selectedMatch.baseDataId,
        confirmPriceId: selectedMatch.selectedPriceId
      }
      
      console.log('【调用】人工确认接口参数:', confirmParams)
      
      const confirmResult = await supplierMaterialService.manualConfirm(confirmParams)
      
      if (confirmResult) {
        // 更新行数据状态
        row.confirm_result = 1
        row.confirmBaseDataId = confirmParams.confirmBaseDataId
        row.confirmPriceId = confirmParams.confirmPriceId
        row.match_type = '已确认'
        
        console.log('【成功】人工确认完成:', confirmResult)
        ElMessage.success(`已确认物资匹配：${selectedMatch.name}`)
      }
    } catch (error) {
      console.error('【错误】人工确认失败:', error)
      ElMessage.error(`确认失败：${error.message}`)
      // 恢复原始数据
      return
    }
    
    console.log('【诊断】更新后的行数据:', row)
  }
}

/**
 * 处理物资选择 - 适配新接口格式并实现人工确认
 * @param {Object} currentRow - 当前编辑的行
 * @param {Object} selectedMaterial - 选中的物资
 */
export const handleMaterialSelect = async (currentRow, selectedMaterial) => {
  if (currentRow && selectedMaterial) {
    console.log('【诊断】物资选择:', selectedMaterial)

    // 适配新接口的数据结构
    const materialBaseInfo = selectedMaterial.materialBaseInfo || selectedMaterial
    const priceList = selectedMaterial.priceList || []
    
    // 选择最新的价格（第一个价格选项）
    const selectedPrice = priceList.length > 0 ? priceList[0] : null
    
    currentRow.matched_name = materialBaseInfo.materialName || materialBaseInfo.material_name || DEFAULT_VALUES.EMPTY_TEXT
    currentRow.matched_specification = materialBaseInfo.specificationModel || materialBaseInfo.specification_model || DEFAULT_VALUES.EMPTY_TEXT
    currentRow.matched_unit = materialBaseInfo.unit || DEFAULT_VALUES.EMPTY_TEXT
    currentRow.matched_price = selectedPrice ? formatPrice(selectedPrice.taxPrice) : DEFAULT_VALUES.EMPTY_TEXT
    currentRow.matched_quarter = selectedPrice ? selectedPrice.quarter : DEFAULT_VALUES.EMPTY_TEXT
    
    // 调用人工确认接口
    try {
      const confirmParams = {
        id: currentRow.taskDataId,
        confirmBaseDataId: materialBaseInfo.id,
        confirmPriceId: selectedPrice ? selectedPrice.id : null
      }
      
      console.log('【调用】人工确认接口参数:', confirmParams)
      
      if (!confirmParams.confirmPriceId) {
        ElMessage.warning('该物资暂无价格信息，无法确认')
        return
      }
      
      const confirmResult = await supplierMaterialService.manualConfirm(confirmParams)
      
      if (confirmResult) {
        // 更新行数据状态
        currentRow.confirm_result = 1
        currentRow.confirmBaseDataId = confirmParams.confirmBaseDataId
        currentRow.confirmPriceId = confirmParams.confirmPriceId
        currentRow.match_type = '已确认'
        
        console.log('【成功】人工确认完成:', confirmResult)
        ElMessage.success(`已确认物资匹配：${currentRow.matched_name}`)
      }
    } catch (error) {
      console.error('【错误】人工确认失败:', error)
      ElMessage.error(`确认失败：${error.message}`)
      // 恢复原始数据
      return
    }
    
    console.log('【诊断】物资选择更新后:', currentRow)
  }
}

/**
 * 导航函数
 */
export const useNavigation = () => {
  const router = useRouter()
  
  /**
   * 返回上一页
   */
  const goBack = () => {
    router.go(-1)
  }
  
  /**
   * 跳转到智能大脑页面
   */
  const goToSmartBrain = () => {
    router.push({ name: 'smart-brain' })
  }
  
  return {
    goBack,
    goToSmartBrain
  }
}

/**
 * 根据API返回的价格匹配状态获取显示信息
 * @param {number} priceMatchedStatus - 价格匹配状态 (-1, 1, 2)
 * @returns {Object} 包含text、type和action的状态信息
 */
export const getPriceMatchingStatusDisplay = (priceMatchedStatus) => {
  switch(priceMatchedStatus) {
    case -1:
      return {
        text: '价格信息不全',
        type: 'danger',
        action: '联系管理员新增价格或调整季度'
      }
    case 1:
      return {
        text: '精确匹配',
        type: 'success',
        action: '自动匹配成功'
      }
    case 2:
      return {
        text: '价格不一致',
        type: 'warning',
        action: '需要人工确认'
      }
    default:
      return {
        text: '未知状态',
        type: 'info',
        action: '请联系技术支持'
      }
  }
}

/**
 * 从行数据中获取价格匹配状态标签 - 使用新的API状态字段
 * @param {Object} row - 行数据
 * @returns {Object} 包含text和type的标签信息
 */
export const getPriceMatchingStatusTagFromRow = (row) => {
  // 优先使用新的priceMatchedStatus字段
  if (row.priceMatchedStatus !== undefined && row.priceMatchedStatus !== null) {
    const statusInfo = getPriceMatchingStatusDisplay(row.priceMatchedStatus)
    return { text: statusInfo.text, type: statusInfo.type }
  }
  
  // 如果是matchOptions数组的情况，检查第一个选项的priceMatchedStatus
  if (Array.isArray(row.matchOptions) && row.matchOptions.length > 0) {
    const firstOption = row.matchOptions[0]
    if (firstOption.priceMatchedStatus !== undefined && firstOption.priceMatchedStatus !== null) {
      const statusInfo = getPriceMatchingStatusDisplay(firstOption.priceMatchedStatus)
      return { text: statusInfo.text, type: statusInfo.type }
    }
  }
  
  // 向后兼容：如果没有新的状态字段，保持原有逻辑
  // 步骤1：判断是否有物资信息
  if (!row.baseInfo || Object.keys(row.baseInfo).length === 0) {
    return { text: '未找到物资', type: 'danger' }
  }

  // 步骤2：判断价格是否匹配（有物资信息的情况下）
  // 无价格信息视为价格不匹配
  if (!row.priceInfo || Object.keys(row.priceInfo).length === 0 || !row.priceInfo.taxPrice) {
    return { text: '价格不匹配', type: 'warning' }
  }

  // 步骤3：如果有价格信息，默认为已匹配（这里可能需要更复杂的逻辑）
  return { text: '已匹配', type: 'success' }
}

// 导出功能已移除，直接在组件中处理开发中提示