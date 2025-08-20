// 乙供物资解析详情页面工具函数
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import CozeService from '@/utils/coze.js'
import { useChatStore } from '@/stores/chat.js'
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
  const formattedItem = {
    id: item.id,
    material_name: item.excelDataMaterialName || DEFAULT_VALUES.EMPTY_TEXT,
    material_specification: item.excelDataSpecificationModel || DEFAULT_VALUES.EMPTY_TEXT,
    material_price: item.excelDataPrice || DEFAULT_VALUES.EMPTY_TEXT,
    matched_name: item.matchedDataMaterialName || DEFAULT_VALUES.EMPTY_TEXT,
    matched_specification: item.matchedDataSpecificationModel || DEFAULT_VALUES.EMPTY_TEXT,
    matched_price: formatPrice(item.matchedPrice),
    similarity: formatSimilarity(item.matchedScore),
    match_type: getMatchType(item),
    editing: false,
    selected_match: null,
    original_item: item,
    // 保存初始匹配数据ID快照，用于检测是否有变更
    initialMatchedDataId: item.matchedDataId || null,
    initialMatchedPriceId: item.matchedPriceId || null
  }

  // 处理相似匹配的子数据
  if (item.comparison_result === 2 && Array.isArray(item.subData)) {
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
 * 格式化相似匹配选项标签
 * @param {Object} item - 相似匹配项
 * @returns {string} 格式化后的标签
 */
export const formatSimilarMatchLabel = (item) => {
  const name = item.name || ''
  const specification = item.specification || ''
  const price = item.price !== null ? formatPrice(item.price) : ''
  const quarter = item.matchedPriceQuarter || item.quarter || ''

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
  const cozeService = createCozeService()
  
  try {
    const workflowParams = {
      taskId: taskId,
      task_detail_id: detailId,
      index: page,
      pageSize: size
    }
    
    console.log('【诊断】调用乙供物资详情工作流参数:', workflowParams)
    
    const detailResult = await cozeService.runWorkflow(WORKFLOW_IDS.DETAIL, workflowParams)
    
    if (detailResult && detailResult.data) {
      console.log('【诊断】乙供物资详情工作流返回数据:', detailResult.data)
      
      const parsed = JSON.parse(detailResult.data)
      const parsedData = parsed?.result
      const totalCount = parsed?.totalCount || (Array.isArray(parsedData) ? parsedData.length : 0)
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const tableData = parsedData.map(item => formatMaterialDetail(item))
        
        console.log('【诊断】乙供物资详情处理后数据:', {
          count: tableData.length,
          total: totalCount
        })
        
        return {
          tableData,
          total: totalCount
        }
      } else {
        console.warn('【诊断】乙供物资详情无有效数据')
        return { tableData: [], total: 0 }
      }
    } else {
      throw new Error('获取详情数据失败')
    }
  } catch (error) {
    console.error('【错误】获取乙供物资详情失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.LOAD_ERROR}: ${error.message || '未知错误'}`)
    return { tableData: [], total: 0 }
  }
}

/**
 * 获取物资选择列表数据
 * @param {number} pageNum - 页码
 * @param {number} pageSize - 页大小
 * @returns {Promise<Object>} 包含选择列表数据和总数的对象
 */
export const fetchSelectionList = async (pageNum = 1, pageSize = 10) => {
  const cozeService = createCozeService()
  
  try {
    const params = { pageNum, pageSize }
    
    console.log('【诊断】调用物资选择工作流参数:', params)
    
    const result = await cozeService.runWorkflow(WORKFLOW_IDS.SELECTION, params)
    
    if (result && result.data) {
      const parsed = JSON.parse(result.data)
      const selectionList = parsed.output || parsed
      const total = parsed.count || 0
      
      console.log('【诊断】物资选择工作流返回数据:', {
        count: Array.isArray(selectionList) ? selectionList.length : 0,
        total
      })
      
      return {
        selectionList: Array.isArray(selectionList) ? selectionList : [],
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
 * 保存解析结果
 * @param {Array} tableData - 表格数据
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveParsingResults = async (tableData) => {
  const cozeService = createCozeService()
  const chatStore = useChatStore()
  
  try {
    // 只保存用户编辑过变动的数据
    const updateObjList = tableData
      .filter((item) => {
        // 对比行数据层id和快照，识别有变化的数据
        const isModified =
          item.original_item.matchedDataId !== item.initialMatchedDataId ||
          item.original_item.matchedPriceId !== item.initialMatchedPriceId
        
        console.log(`【诊断】保存检查: ID=${item.id}, 是否修改=${isModified}`)
        return isModified
      })
      .map((item) => ({
        id: item.id,
        confirm_base_data_id: item.original_item.matchedDataId || null,
        confirm_price_id: item.original_item.matchedPriceId || null,
        confirm_type: 2
      }))

    if (updateObjList.length === 0) {
      ElMessage.info(MESSAGE_CONFIG.NO_CHANGES)
      return false
    }

    console.log('【诊断】保存乙供物资解析结果:', updateObjList)
    
    const saveResult = await cozeService.runWorkflow(WORKFLOW_IDS.SAVE, { updateObjList })

    if (saveResult && saveResult.data) {
      ElMessage.success(MESSAGE_CONFIG.SAVE_SUCCESS)
      
      const savedCount = updateObjList.length
      chatStore.addMessage(`已保存${savedCount}个乙供物资解析结果`, 'system')
      
      return true
    } else {
      throw new Error('保存操作未返回有效结果')
    }
  } catch (error) {
    console.error('【错误】保存乙供物资解析结果失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.SAVE_ERROR}: ${error.message || '未知错误'}`)
    return false
  }
}

/**
 * 处理相似匹配选择变化
 * @param {Object} row - 当前行数据
 * @param {Object} selectedMatch - 选中的匹配项
 */
export const handleSimilarMatchChange = (row, selectedMatch) => {
  if (row && selectedMatch) {
    row.matched_name = selectedMatch.name
    row.matched_specification = selectedMatch.specification
    row.matched_price = formatPrice(selectedMatch.price)
    
    console.log('【诊断】相似匹配选择:', selectedMatch, row)
    
    // 更新原始数据中的匹配相关字段，以便保存时使用
    const originalItem = row.original_item
    if (originalItem) {
      originalItem.matchedDataId = selectedMatch.matched_id || null
      originalItem.matchedPriceId = selectedMatch.matchedPriceId || null
      originalItem.matchedDataMaterialName = selectedMatch.name
      originalItem.matchedDataSpecificationModel = selectedMatch.specification
      originalItem.matchedPrice = selectedMatch.price
      originalItem.matchedScore = selectedMatch.similarity
      originalItem.matchedPriceQuarter = selectedMatch.matchedPriceQuarter || selectedMatch.quarter || null
      originalItem.comparison_result = 1 // 相似匹配选择后，视为精确匹配
    }
    
    console.log('【诊断】更新后的行数据:', row)
  }
}

/**
 * 处理物资选择
 * @param {Object} currentRow - 当前编辑的行
 * @param {Object} selectedMaterial - 选中的物资
 */
export const handleMaterialSelect = (currentRow, selectedMaterial) => {
  if (currentRow && selectedMaterial) {
    console.log('【诊断】物资选择更新前:', {
      initialId: currentRow.initialMatchedDataId,
      originalId: currentRow.original_item.matchedDataId
    })

    currentRow.matched_name = 
      selectedMaterial.material_name || 
      selectedMaterial.ymtd_material_name || 
      selectedMaterial.name || 
      DEFAULT_VALUES.EMPTY_TEXT
    
    currentRow.matched_price = formatPrice(
      selectedMaterial.tax_price || 
      selectedMaterial.ymtd_tax_price || 
      selectedMaterial.price
    )
    
    currentRow.matched_specification = 
      selectedMaterial.specification_model ||
      selectedMaterial.ymtd_specification_model ||
      selectedMaterial.specification ||
      DEFAULT_VALUES.EMPTY_TEXT
    
    if (currentRow.original_item) {
      currentRow.original_item.comparison_result = 3 // 手动选择后，设置为人工匹配
      currentRow.original_item.matchedDataId = 
        selectedMaterial.m_id || 
        selectedMaterial.ymmr_id || 
        selectedMaterial.id || 
        null
      currentRow.original_item.matchedPriceId = 
        selectedMaterial.p_id ||
        selectedMaterial.ymmr_tax_price_id ||
        selectedMaterial.priceId ||
        null
      currentRow.original_item.matchedDataMaterialName = currentRow.matched_name
      currentRow.original_item.matchedDataSpecificationModel = currentRow.matched_specification
      currentRow.original_item.matchedPrice = 
        selectedMaterial.tax_price || 
        selectedMaterial.ymmr_price || 
        selectedMaterial.price
      currentRow.original_item.matchedScore = selectedMaterial.ymmr_score || null
      currentRow.original_item.matchedPriceQuarter = selectedMaterial.quarter || null

      console.log('【诊断】物资选择更新后:', {
        initialId: currentRow.initialMatchedDataId, // 应保持不变
        originalId: currentRow.original_item.matchedDataId // 已更新
      })
    }
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
   * 跳转到确认页面
   * @param {string|number} taskId - 任务ID
   */
  const goToConfirm = (taskId) => {
    router.push({
      name: 'supplier-material-confirm',
      params: { taskId }
    })
  }
  
  /**
   * 跳转到智能大脑页面
   */
  const goToSmartBrain = () => {
    router.push({ name: 'smart-brain' })
  }
  
  return {
    goBack,
    goToConfirm,
    goToSmartBrain
  }
}

/**
 * 导出数据
 * @param {Array} tableData - 表格数据
 * @param {string} filename - 文件名
 */
export const exportTableData = (tableData, filename = '乙供物资解析详情') => {
  try {
    // 这里可以集成实际的导出功能
    // 目前先显示提示信息
    ElMessage.success(`${MESSAGE_CONFIG.EXPORT_SUCCESS}: ${filename}`)
    console.log('【诊断】导出数据:', tableData)
  } catch (error) {
    console.error('【错误】导出数据失败:', error)
    ElMessage.error(`${MESSAGE_CONFIG.EXPORT_ERROR}: ${error.message || '未知错误'}`)
  }
}