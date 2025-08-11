// ProjectDataManagementPage 页面相关工具函数
import { ElMessage } from 'element-plus'
import { 
  DYNAMIC_TABLE_COLUMNS, 
  MOCK_DATA,
  IMPORT_EXPORT_CONFIG 
} from './constants.js'

/**
 * 创建返回导航函数
 */
export const createBackNavigator = (router) => {
  return () => {
    router.go(-1)
  }
}

/**
 * 根据数据类型生成动态列配置
 * @param {string} dataType - 数据类型 (overview, contract, ownerMaterial, supplierMaterial)
 * @returns {Array} 列配置数组
 */
export const generateDynamicColumns = (dataType) => {
  const baseColumns = DYNAMIC_TABLE_COLUMNS[dataType] || []
  
  return baseColumns.map(column => {
    const columnConfig = { ...column }
    
    // 根据列类型设置特殊属性
    switch (column.type) {
      case 'date':
        columnConfig.formatter = (row, column, cellValue) => {
          if (!cellValue) return '-'
          const date = new Date(cellValue)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()
          return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`
        }
        break
        
      case 'datetime':
        columnConfig.formatter = (row, column, cellValue) => {
          if (!cellValue) return '-'
          const date = new Date(cellValue)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()
          const hours = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          const seconds = date.getSeconds().toString().padStart(2, '0')
          return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hours}:${minutes}:${seconds}`
        }
        break
        
      case 'currency':
        columnConfig.formatter = (row, column, cellValue) => {
          return cellValue ? `¥${cellValue.toLocaleString()}` : '-'
        }
        break
        
      case 'number':
        columnConfig.formatter = (row, column, cellValue) => {
          return cellValue !== null && cellValue !== undefined ? cellValue.toLocaleString() : '-'
        }
        break
        
      case 'percentage':
        columnConfig.formatter = (row, column, cellValue) => {
          return cellValue !== null && cellValue !== undefined ? `${cellValue}%` : '-'
        }
        break
        
        
      case 'tag':
        columnConfig.formatter = (row, column, cellValue) => {
          // 处理甲供物资的对平情况
          if (column.prop === 'matchingStatus') {
            const statusMap = {
              'BALANCED': '已对平',
              'UNRETURNED': '未退库', 
              'DATA_MISSING': '数据缺失',
              'UNMATCHED': '异常',
              'MATCHED': '已匹配',
              'PARTIAL_MATCHED': '部分匹配',
              1: '已对平',
              0: '未退库'
            }
            return statusMap[cellValue] || cellValue || '-'
          }
          // 处理物资状态
          if (column.prop === 'materialStatus') {
            return cellValue || '-'
          }
          // 处理项目状态
          if (column.prop === 'projectStatus') {
            return cellValue || '-'
          }
          return cellValue || '-'
        }
        break
        
      case 'material-quantity':
        columnConfig.formatter = (row, column, cellValue) => {
          if (cellValue === null || cellValue === undefined || cellValue === '') return '-'
          const type = cellValue >= 0 ? '用料' : '退料'
          return `${cellValue} (${type})`
        }
        break
        
      default:
        columnConfig.formatter = (row, column, cellValue) => {
          return cellValue || '-'
        }
        break
    }
    
    return columnConfig
  })
}

/**
 * 检测数据类型
 * @param {Array} data - 数据数组
 * @returns {string} 数据类型
 */
export const detectDataType = (data) => {
  if (!data || !data.length) return 'overview'
  
  const firstItem = data[0]
  
  // 根据关键字段判断数据类型
  if (firstItem.contractId) return 'contract'
  if (firstItem.materialId && firstItem.supplier) return 'ownerMaterial'
  if (firstItem.materialId && firstItem.contractor) return 'supplierMaterial'
  if (firstItem.projectId) return 'overview'
  
  return 'overview'
}

/**
 * 获取Mock数据
 * @param {string} tabName - Tab名称
 * @returns {Array} Mock数据数组
 */
export const getMockData = (tabName) => {
  return MOCK_DATA[tabName] || []
}


/**
 * 判断项目是否需要关联按钮
 * @param {Object} projectData - 项目数据
 * @returns {boolean} 是否需要关联按钮
 */
export const needsLinkButton = (rowData) => {
  // 只有合同页面的合同才显示关联按钮
  return rowData && rowData.contractId !== undefined
}

/**
 * 创建tab切换处理函数
 * @param {Function} loadDataCallback - 加载数据回调函数
 * @returns {Function} tab切换处理函数
 */
export const createTabChangeHandler = (loadDataCallback) => {
  return (tabName) => {
    if (loadDataCallback) {
      loadDataCallback(tabName)
    }
  }
}

/**
 * 创建数据导出函数
 * @param {string} tabName - 当前tab名称
 * @param {Array} data - 要导出的数据
 * @returns {Function} 导出处理函数
 */
export const createExportHandler = () => {
  return () => {
    ElMessage.info('该功能正在开发中，请耐心等候')
  }
}

/**
 * 创建数据导入函数
 * @param {string} tabName - 当前tab名称
 * @param {Function} refreshCallback - 刷新数据回调函数
 * @returns {Function} 导入处理函数
 */
export const createImportHandler = () => {
  return () => {
    ElMessage.info('该功能正在开发中，请耐心等候')
  }
}

/**
 * 创建项目详情查看函数
 * @param {Function} openDialogCallback - 打开弹窗回调函数
 * @returns {Function} 查看详情处理函数
 */
export const createViewDetailHandler = (openDialogCallback) => {
  return (rowData) => {
    if (openDialogCallback) {
      openDialogCallback(rowData)
    }
  }
}

/**
 * 创建项目关联函数
 * @param {Function} openLinkDialogCallback - 打开关联弹窗回调函数
 * @returns {Function} 项目关联处理函数
 */
export const createLinkProjectHandler = (openLinkDialogCallback) => {
  return (rowData) => {
    if (openLinkDialogCallback) {
      openLinkDialogCallback(rowData)
    }
  }
}

/**
 * 数据过滤函数
 * @param {Array} data - 原始数据
 * @param {string} searchKeyword - 搜索关键词
 * @param {Object} filters - 其他过滤条件
 * @returns {Array} 过滤后的数据
 */
export const filterData = (data, searchKeyword = '', filters = {}) => {
  if (!data) return []
  
  let filteredData = [...data]
  
  // 关键词搜索
  if (searchKeyword.trim()) {
    const keyword = searchKeyword.toLowerCase()
    filteredData = filteredData.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(keyword)
      )
    })
  }
  
  // 其他过滤条件
  Object.keys(filters).forEach(key => {
    const filterValue = filters[key]
    if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
      filteredData = filteredData.filter(item => item[key] === filterValue)
    }
  })
  
  return filteredData
}

/**
 * 分页数据处理
 * @param {Array} data - 数据数组
 * @param {number} currentPage - 当前页码
 * @param {number} pageSize - 每页条数
 * @returns {Object} 分页结果
 */
export const paginateData = (data, currentPage = 1, pageSize = 20) => {
  const total = data.length
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize
  const paginatedData = data.slice(start, end)
  
  return {
    data: paginatedData,
    total,
    currentPage,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}