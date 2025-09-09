/**
 * 乙供物资报告页面业务逻辑工具函数
 */

/**
 * 格式化报告数据为显示格式
 * @param {object} reportData - 原始报告数据
 * @returns {object} 格式化后的报告数据
 */
export function formatReportData(reportData) {
  if (!reportData || typeof reportData !== 'object') {
    return {
      hasLlmReport: false,
      reportSections: []
    }
  }

  // 检查是否有LLM生成的报告内容
  const hasValidContent = Object.values(reportData).some(
    value => value && (typeof value === 'string' || typeof value === 'object')
  )

  if (!hasValidContent) {
    return {
      hasLlmReport: false,
      reportSections: []
    }
  }

  // 将报告数据转换为显示格式
  const reportSections = Object.entries(reportData).map(([category, content]) => ({
    title: category,
    content: content,
    type: typeof content === 'object' ? 'object' : 'text'
  }))

  return {
    hasLlmReport: true,
    reportSections
  }
}

/**
 * 生成导出文件名
 * @param {string} projectName - 项目名称
 * @returns {string} 文件名
 */
export function generateExportFileName(projectName = '项目') {
  const date = new Date().toLocaleDateString('zh-CN')
  return `乙供物资解析报告_${projectName}_${date}`
}

/**
 * 设置页面打印模式
 * @param {string} fileName - 文件名
 */
export function setupPrintMode(fileName) {
  const originalTitle = document.title
  document.title = fileName
  document.body.classList.add('printing')
  
  return () => {
    setTimeout(() => {
      document.title = originalTitle
      document.body.classList.remove('printing')
    }, 1000)
  }
}