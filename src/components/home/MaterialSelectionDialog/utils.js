// MaterialSelectionDialog 组件工具函数

export const filterMaterials = (materials, keyword, type) => {
  let filtered = materials || []
  
  if (keyword) {
    filtered = filtered.filter(item => 
      item.name?.toLowerCase().includes(keyword.toLowerCase()) ||
      item.code?.toLowerCase().includes(keyword.toLowerCase())
    )
  }
  
  if (type && type !== 'all') {
    filtered = filtered.filter(item => item.type === type)
  }
  
  return filtered
}

export const validateSelection = (selection, mode) => {
  if (mode === 'single') {
    return selection.length <= 1
  }
  return true
}

export const formatMaterialForDisplay = (material) => {
  return {
    ...material,
    displayName: `${material.name} (${material.code})`,
    displayType: material.type === 'supplier' ? '乙供' : '甲供'
  }
}