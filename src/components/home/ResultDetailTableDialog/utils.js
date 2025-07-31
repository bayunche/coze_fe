// ResultDetailTableDialog 组件工具函数

export const formatTableData = (data) => {
  if (!Array.isArray(data)) return []
  
  return data.map((item, index) => ({
    ...item,
    index: index + 1,
    id: item.id || `item_${index}`
  }))
}

export const exportToExcel = (data, filename = 'export') => {
  // 导出Excel逻辑
  console.log('导出Excel:', filename, data)
}

export const exportToCSV = (data, filename = 'export') => {
  // 导出CSV逻辑
  const csv = convertToCSV(data)
  downloadFile(csv, `${filename}.csv`, 'text/csv')
}

const convertToCSV = (data) => {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => Object.values(row).join(',')).join('\n')
  
  return `${headers}\n${rows}`
}

const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}