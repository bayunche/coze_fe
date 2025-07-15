/**
 * 物资对平辅助函数
 */

/**
 * 执行物资对平逻辑
 * @param {string} taskId - 任务ID
 * @param {Array} materials - 物资数据列表
 * @returns {Promise<object>} 对平结果 {success: boolean, data: object, message: string}
 */
export async function executeMaterialAlignment(taskId, materials) {
  if (!taskId || !materials || !Array.isArray(materials)) {
    return {
      success: false,
      message: '参数错误：taskId和materials不能为空且materials必须是数组'
    }
  }

  try {
    // 1. 数据预处理
    const processedMaterials = preprocessMaterials(materials)

    // 2. 执行对平逻辑
    const alignmentResult = await performAlignment(processedMaterials)

    // 3. 生成对平报告
    const report = generateAlignmentReport(alignmentResult)

    return {
      success: true,
      data: {
        matched: alignmentResult.matched,
        unmatched: alignmentResult.unmatched,
        report
      },
      message: '物资对平成功'
    }
  } catch (error) {
    console.error('物资对平过程中出错:', error)
    return {
      success: false,
      message: error.message || '物资对平过程中出错'
    }
  }
}

/**
 * 预处理物资数据
 * @param {Array} materials - 原始物资数据
 * @returns {Array} 处理后的物资数据
 */
function preprocessMaterials(materials) {
  return materials.map((item) => ({
    ...item,
    // 标准化关键字段
    materialCode: item.materialCode?.trim()?.toUpperCase(),
    materialName: item.materialName?.trim(),
    specification: item.specification?.trim(),
    unit: item.unit?.trim(),
    quantity: Number(item.quantity) || 0
  }))
}

/**
 * 执行实际对平逻辑
 * @param {Array} materials - 预处理后的物资数据
 * @returns {object} 对平结果 {matched: Array, unmatched: Array}
 */
async function performAlignment(materials) {
  const matched = []
  const unmatched = []

  // 这里实现具体的对平算法
  // 示例：按物资编码和规格匹配
  for (const material of materials) {
    const isMatched = await checkMaterialMatch(material)
    if (isMatched) {
      matched.push(material)
    } else {
      unmatched.push(material)
    }
  }

  return { matched, unmatched }
}

/**
 * 检查物资是否匹配
 * @param {object} material - 物资数据
 * @returns {Promise<boolean>} 是否匹配
 */
async function checkMaterialMatch(material) {
  // 这里可以实现具体的匹配逻辑
  // 示例：检查关键字段是否完整
  return !!(
    material.materialCode &&
    material.materialName &&
    material.specification &&
    material.quantity > 0
  )
}

/**
 * 生成对平报告
 * @param {object} result - 对平结果
 * @returns {object} 报告数据
 */
function generateAlignmentReport(result) {
  return {
    summary: {
      total: result.matched.length + result.unmatched.length,
      matched: result.matched.length,
      unmatched: result.unmatched.length,
      matchRate: (result.matched.length / (result.matched.length + result.unmatched.length)) * 100
    },
    details: {
      matched: result.matched,
      unmatched: result.unmatched
    },
    timestamp: new Date().toISOString()
  }
}

export default {
  executeMaterialAlignment,
  preprocessMaterials,
  performAlignment,
  checkMaterialMatch,
  generateAlignmentReport
}
