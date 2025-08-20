// 智能体映射配置
// 用于将后端返回的智能体信息映射到前端功能类型

/**
 * 智能体到功能类型的映射配置
 * 支持多种映射方式以提高匹配准确性
 */
export const AGENT_MAPPING = {
  // 通过智能体ID进行映射（最精确）
  byAgentId: {
    6: 'supplierMaterialParsing', // 乙供物资解析智能体
    7: 'ownerSuppliedMaterialParsing', // 甲供物资解析智能体
    8: 'contractParsing' // 合同解析智能体
  },

  // 通过标签进行映射（推荐方式）
  byLabels: {
    y_material: 'supplierMaterialParsing', // 乙供物资标签
    contract: 'contractParsing', // 合同标签
    owner_material: 'ownerSuppliedMaterialParsing', // 甲供物资标签
    supplier_material: 'supplierMaterialParsing' // 乙供物资别名
  },

  // 通过智能体名称关键词进行映射（备用方案）
  byNameKeywords: {
    乙供物资: 'supplierMaterialParsing',
    乙供: 'supplierMaterialParsing',
    合同: 'contractParsing',
    甲供物资: 'ownerSuppliedMaterialParsing',
    甲供: 'ownerSuppliedMaterialParsing',
    物资核对: 'supplierMaterialParsing',
    物资解析: 'supplierMaterialParsing'
  }
}

/**
 * 功能类型常量定义
 */
export const FUNCTION_TYPES = {
  CONTRACT_PARSING: 'contractParsing',
  SUPPLIER_MATERIAL_PARSING: 'supplierMaterialParsing',
  OWNER_SUPPLIED_MATERIAL_PARSING: 'ownerSuppliedMaterialParsing'
}

/**
 * 功能类型到显示名称的映射
 */
export const FUNCTION_DISPLAY_NAMES = {
  [FUNCTION_TYPES.CONTRACT_PARSING]: '合同解析',
  [FUNCTION_TYPES.SUPPLIER_MATERIAL_PARSING]: '乙供物资解析',
  [FUNCTION_TYPES.OWNER_SUPPLIED_MATERIAL_PARSING]: '甲供物资解析'
}

/**
 * 解析后端返回的智能体响应
 * @param {string} content - 后端返回的content字符串
 * @returns {Object|null} 解析后的智能体信息，失败返回null
 */
export function parseAgentResponse(content) {
  try {
    const parsed = JSON.parse(content)

    // 检查是否包含modelAnswer
    if (parsed && parsed.modelAnswer) {
      return parsed.modelAnswer
    }

    return null
  } catch (error) {
    console.error('解析智能体响应失败:', error)
    return null
  }
}

/**
 * 将智能体信息映射到功能类型
 * @param {Object} agentInfo - 智能体信息对象
 * @returns {string|null} 映射的功能类型，未找到返回null
 */
export function mapAgentToFunction(agentInfo) {
  if (!agentInfo) return null

  // 检查是否有错误（未匹配情况）
  if (agentInfo.error === 'no_match') {
    return null
  }

  // 1. 优先通过agentId映射（最精确）
  if (agentInfo.agentId && AGENT_MAPPING.byAgentId[agentInfo.agentId]) {
    return AGENT_MAPPING.byAgentId[agentInfo.agentId]
  }

  // 2. 通过labels映射
  if (agentInfo.labels && AGENT_MAPPING.byLabels[agentInfo.labels]) {
    return AGENT_MAPPING.byLabels[agentInfo.labels]
  }

  // 3. 通过智能体名称关键词映射（备用方案）
  if (agentInfo.agentName) {
    for (const keyword in AGENT_MAPPING.byNameKeywords) {
      if (agentInfo.agentName.includes(keyword)) {
        return AGENT_MAPPING.byNameKeywords[keyword]
      }
    }
  }

  // 4. 通过描述关键词映射（最后的备用方案）
  if (agentInfo.description) {
    for (const keyword in AGENT_MAPPING.byNameKeywords) {
      if (agentInfo.description.includes(keyword)) {
        return AGENT_MAPPING.byNameKeywords[keyword]
      }
    }
  }

  return null
}

/**
 * 处理未匹配的智能体情况
 * @param {Object} agentInfo - 包含错误信息的智能体响应
 * @returns {Object} 格式化的错误信息
 */
export function handleNoMatchAgent(agentInfo) {
  const defaultMessage = '暂未找到处理此类问题的智能体专家，建议联系管理员或重新描述需求'
  const defaultTypes = ['合同解析', '乙供物资解析', '甲供物资解析']

  return {
    error: true,
    message: agentInfo.message || defaultMessage,
    availableTypes: agentInfo.availableTypes || defaultTypes,
    suggestion: "请尝试更具体地描述您的需求，例如：'我想解析合同'、'我需要处理乙供物资'等"
  }
}

/**
 * 智能体响应处理主函数
 * @param {string} content - 后端返回的content字符串
 * @returns {Object} 处理结果 { functionType: string|null, agentInfo: Object, error: Object|null }
 */
export function processAgentResponse(content) {
  const agentInfo = parseAgentResponse(content)

  if (!agentInfo) {
    return {
      functionType: null,
      agentInfo: null,
      error: {
        error: true,
        message: '无法解析智能体响应',
        suggestion: '请稍后重试或联系管理员'
      }
    }
  }

  // 检查是否为未匹配情况
  if (agentInfo.error === 'no_match') {
    return {
      functionType: null,
      agentInfo: agentInfo,
      error: handleNoMatchAgent(agentInfo)
    }
  }

  // 尝试映射到功能类型
  const functionType = mapAgentToFunction(agentInfo)

  return {
    functionType: functionType,
    agentInfo: agentInfo,
    error: functionType
      ? null
      : {
          error: true,
          message: `找到智能体"${agentInfo.agentName || '未知'}"，但暂不支持此类型的解析功能`,
          suggestion: '请联系管理员添加相应的解析功能支持'
        }
  }
}
