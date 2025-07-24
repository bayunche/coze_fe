/**
 * 工作流名称常量
 * 用于统一管理所有工作流的名称，避免硬编码
 */

// 工作流名称常量
export const WORKFLOW_NAMES = {
  CONTRACT_PARSING: '合同解析',
  SUPPLIER_MATERIAL_PARSING: '乙供物资解析',
  OWNER_MATERIAL_PARSING: '甲供物资解析',
  OWNER_MATERIAL_REPARSE: '甲供物资重新解析'
}

// 按分类分组的工作流名称
export const WORKFLOW_GROUPS = {
  // 合同相关
  CONTRACT: [WORKFLOW_NAMES.CONTRACT_PARSING],
  
  // 乙供物资相关
  SUPPLIER_MATERIAL: [WORKFLOW_NAMES.SUPPLIER_MATERIAL_PARSING],
  
  // 甲供物资相关（包含解析和重新解析）
  OWNER_MATERIAL: [
    WORKFLOW_NAMES.OWNER_MATERIAL_PARSING,
    WORKFLOW_NAMES.OWNER_MATERIAL_REPARSE
  ],
  
  // 所有解析工作流
  ALL_PARSING: [
    WORKFLOW_NAMES.CONTRACT_PARSING,
    WORKFLOW_NAMES.SUPPLIER_MATERIAL_PARSING,
    WORKFLOW_NAMES.OWNER_MATERIAL_PARSING,
    WORKFLOW_NAMES.OWNER_MATERIAL_REPARSE
  ]
}

// 检查是否为特定类型的工作流
export const isContractWorkflow = (workflowName) => 
  WORKFLOW_GROUPS.CONTRACT.includes(workflowName)

export const isSupplierMaterialWorkflow = (workflowName) => 
  WORKFLOW_GROUPS.SUPPLIER_MATERIAL.includes(workflowName)

export const isOwnerMaterialWorkflow = (workflowName) => 
  WORKFLOW_GROUPS.OWNER_MATERIAL.includes(workflowName)

export const isParsingWorkflow = (workflowName) => 
  WORKFLOW_GROUPS.ALL_PARSING.includes(workflowName)