// OwnerMaterialTaskParsingDetailDialog 组件工具函数

export const formatMaterialDetail = (detail) => {
  return {
    ...detail,
    formattedPrice: formatPrice(detail.price),
    formattedQuantity: formatQuantity(detail.quantity)
  }
}

export const formatPrice = (price) => {
  if (!price) return '-'
  return `¥${parseFloat(price).toFixed(2)}`
}

export const formatQuantity = (quantity) => {
  if (!quantity) return '-'
  return `${quantity}`
}

export const calculateTotalValue = (items) => {
  return items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    const quantity = parseFloat(item.quantity) || 0
    return total + (price * quantity)
  }, 0)
}