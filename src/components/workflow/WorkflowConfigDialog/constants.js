// WorkflowConfigDialog 组件相关常量

export const WORKFLOW_NAMES = {
  OWNER_MATERIAL: '甲供物资解析',
  SUPPLIER_MATERIAL: '乙供物资解析', 
  CONTRACT_PARSING: '合同解析'
}

export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50, // MB
  DEFAULT_LIMIT: 10,
  SINGLE_FILE_LIMIT: 1
}

export const FILE_TYPES = {
  EXCEL: ['.xls', '.xlsx'],
  PDF: ['.pdf'],
  DOCUMENT: ['.pdf', '.docx', '.txt']
}

export const OWNER_MATERIAL_EXCEL_TYPES = {
  APPLY_EXCEL: 'applyExcelFile',
  USE_MATERIAL_PDF: 'useMaterualPdfUrl',
  BACK_MATERIAL_PDF: 'backMaterualPdfUrl',
  OTHER: 'other'
}

export const UPLOAD_LABELS = {
  COMPREHENSIVE_CLAIM: '综合申领 (Excel)',
  ACTUAL_USAGE_1: '实际用料 (PDF, 必填)',
  ACTUAL_USAGE_2: '实际退料 (PDF, 必填)',
  OTHER_FILES: '其他文件 (选填)'
}

export const PARAM_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  BOOLEAN: 'boolean'
}

export const EMIT_EVENTS = {
  UPDATE_SHOW: 'update:show',
  CLOSE: 'close',
  START_WORKFLOW: 'start-workflow'
}

export const VALIDATION_MESSAGES = {
  COMPREHENSIVE_CLAIM_REQUIRED: '请上传"综合申领 (Excel)"文件',
  ACTUAL_USAGE_1_REQUIRED: '请上传第一个"实际用料 (PDF, 必填)"文件',
  ACTUAL_USAGE_2_REQUIRED: '请上传"实际退料 (PDF, 必填)"文件',
  FILE_SIZE_EXCEEDED: '文件大小不能超过 50MB!',
  FILE_TYPE_ERROR: '文件类型不符合要求，只支持 {types} 格式!'
}

// ==================== 季度管理相关函数 ====================

// 【备用方案】生成季度选项函数 - 当API不可用时的备用方案
const generateQuarterOptionsAsFallback = () => {
  const currentYear = new Date().getFullYear()
  
  const options = []
  
  // 往前两年到往后两年，共5年
  for (let yearOffset = -2; yearOffset <= 2; yearOffset++) {
    const year = currentYear + yearOffset
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterLabels = ['第一季度', '第二季度', '第三季度', '第四季度']
      options.push({
        label: `${year}年${quarterLabels[quarter - 1]}`,
        value: `${year}-Q${quarter}`
      })
    }
  }
  
  return options
}

// 【备用方案】获取当前季度 - 当API不可用时的备用方案
const getCurrentQuarterAsFallback = () => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)
  return `${currentYear}-Q${currentQuarter}`
}

// 将API返回的季度字符串转换为选项格式
const convertQuartersToOptions = (quarters) => {
  return quarters.map(quarter => {
    // 解析季度字符串，如 "2024-Q3"
    const [year, q] = quarter.split('-Q')
    const quarterNum = parseInt(q)
    const quarterLabels = ['第一季度', '第二季度', '第三季度', '第四季度']
    
    return {
      label: `${year}年${quarterLabels[quarterNum - 1]}`,
      value: quarter
    }
  })
}

// 乙供物资解析专用配置
export const SUPPLIER_MATERIAL_CONFIG = {
  // 季度选项 - 使用备用方案初始化，实际使用时会通过API动态获取
  QUARTER_OPTIONS: generateQuarterOptionsAsFallback(),
  // 税率选项
  TAX_RATE_OPTIONS: [
    { label: '13%', value: '13%' },
    { label: '3%', value: '3%' }
  ],
  // 默认值 - 使用备用方案初始化，实际使用时会通过API动态获取
  DEFAULT_QUARTER: getCurrentQuarterAsFallback(),
  DEFAULT_TAX_RATE: '13%'
}

// 导出工具函数供组件使用
export const quarterUtils = {
  // 备用方案函数
  generateQuarterOptionsAsFallback,
  getCurrentQuarterAsFallback,
  // 转换函数
  convertQuartersToOptions
}