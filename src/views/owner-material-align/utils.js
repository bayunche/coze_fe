// OwnerMaterialAlign 页面工具函数

export const formatAlignData = (data) => {
  return data || []
}

export const calculateAlignStats = (items) => {
  return {
    total: items.length,
    matched: items.filter(item => item.matched).length
  }
}