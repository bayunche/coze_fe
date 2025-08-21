// OwnerMaterialReport 页面工具函数

export const formatReportData = (data) => {
  return data || []
}

export const generateReport = (data) => {
  return {
    summary: calculateSummary(data),
    details: data
  }
}

const calculateSummary = (data) => {
  return {
    totalItems: data.length,
    totalValue: data.reduce((sum, item) => sum + (item.value || 0), 0)
  }
}