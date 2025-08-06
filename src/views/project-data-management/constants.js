// ProjectDataManagementPage 页面相关常量

export const PAGE_CONFIG = {
  TITLE: '项目数据管理',
  SUBTITLE: '管理项目相关的数据信息'
}

// Tab配置
export const TAB_CONFIG = {
  OVERVIEW: {
    name: 'overview',
    label: '项目数据总览',
    icon: '📊'
  },
  CONTRACT: {
    name: 'contract',
    label: '合同数据',
    icon: '📋'
  },
  OWNER_MATERIAL: {
    name: 'ownerMaterial',
    label: '甲供项目数据',
    icon: '📦'
  },
  SUPPLIER_MATERIAL: {
    name: 'supplierMaterial',
    label: '乙供项目数据',
    icon: '🏗️'
  }
}

// 动态表格列配置映射
export const DYNAMIC_TABLE_COLUMNS = {
  // 项目总览列配置
  overview: [
    { prop: 'projectId', label: '项目ID', minWidth: 120, fixed: true },
    { prop: 'projectCode', label: '项目编号', width: 130, fixed: true },
    { prop: 'projectName', label: '项目名称', minWidth: 200, fixed: true },
    { prop: 'projectType', label: '项目类型', width: 120 },
    { prop: 'startDate', label: '开始日期', width: 120, type: 'date' },
    { prop: 'endDate', label: '结束日期', width: 120, type: 'date' },
    { prop: 'budget', label: '项目预算', width: 130, type: 'currency' },
    { prop: 'signDate', label: '合同签订时间', width: 160, type: 'datetime' },
    { prop: 'contractFileCount', label: '合同文件数量', width: 120, type: 'number' },
    { prop: 'ownerMaterialFileCount', label: '甲供文件数量', width: 120, type: 'number' },
    { prop: 'supplierMaterialFileCount', label: '乙供文件数量', width: 120, type: 'number' }
  ],

  // 合同数据列配置
  contract: [
    { prop: 'contractId', label: '合同ID', minWidth: 120, fixed: true },
    { prop: 'contractCode', label: '合同编号', width: 130, fixed: true },
    { prop: 'contractName', label: '合同名称', minWidth: 200, fixed: true },
    { prop: 'contractType', label: '合同类型', width: 120 },
    { prop: 'signDate', label: '签署日期', width: 120, type: 'date' },
    { prop: 'totalAmount', label: '合同金额', width: 130, type: 'currency' },
    { prop: 'partyA', label: '甲方', minWidth: 150 },
    { prop: 'partyB', label: '乙方', minWidth: 150 },
    { prop: 'linkStatus', label: '关联状态', width: 100, type: 'tag' },
    { prop: 'projectId', label: '关联项目', width: 120 }
  ],

  // 甲供项目数据列配置（项目维度）
  ownerMaterial: [
    { prop: 'projectCode', label: '项目编号', width: 130, fixed: true },
    { prop: 'projectName', label: '项目名称', minWidth: 200, fixed: true },
    { prop: 'contractCode', label: '合同编号', width: 130 },
    { prop: 'materialCount', label: '甲供物资数量', width: 120, type: 'number' },
    { prop: 'totalBudget', label: '甲供预算总额', width: 130, type: 'currency' },
    { prop: 'completedCount', label: '已完成物资数', width: 120, type: 'number' },
    { prop: 'completionRate', label: '完成率', width: 100, type: 'percentage' },
    { prop: 'projectStatus', label: '项目状态', width: 100, type: 'tag' },
    { prop: 'startDate', label: '项目开始日期', width: 120, type: 'date' },
    { prop: 'endDate', label: '预计完成日期', width: 120, type: 'date' },
    { prop: 'remark', label: '备注', minWidth: 150 }
  ],

  // 乙供项目数据列配置（项目维度）
  supplierMaterial: [
    { prop: 'projectCode', label: '项目编号', width: 130, fixed: true },
    { prop: 'projectName', label: '项目名称', minWidth: 200, fixed: true },
    { prop: 'contractCode', label: '合同编号', width: 130 },
    { prop: 'materialCount', label: '乙供物资数量', width: 120, type: 'number' },
    { prop: 'estimatedBudget', label: '预估预算总额', width: 130, type: 'currency' },
    { prop: 'actualCost', label: '实际成本总额', width: 130, type: 'currency' },
    { prop: 'completionRate', label: '完成率', width: 100, type: 'percentage' },
    { prop: 'projectStatus', label: '项目状态', width: 100, type: 'tag' },
    { prop: 'contractor', label: '主要承包商', minWidth: 150 },
    { prop: 'startDate', label: '项目开始日期', width: 120, type: 'date' },
    { prop: 'endDate', label: '预计完成日期', width: 120, type: 'date' },
    { prop: 'remark', label: '备注', minWidth: 150 }
  ],

  // 甲供物资详情页列配置
  ownerMaterialDetail: [
    { prop: 'materialId', label: '物资ID', width: 120, fixed: true },
    { prop: 'materialName', label: '物资名称', minWidth: 180, fixed: true },
    { prop: 'specification', label: '规格型号', minWidth: 150 },
    { prop: 'unit', label: '计量单位', width: 100 },
    { prop: 'quantity', label: '需求数量', width: 120, type: 'number' },
    { prop: 'unitPrice', label: '单价', width: 120, type: 'currency' },
    { prop: 'totalPrice', label: '总价', width: 130, type: 'currency' },
    { prop: 'supplier', label: '供应商', minWidth: 150 },
    { prop: 'deliveryDate', label: '交付日期', width: 120, type: 'date' },
    { prop: 'materialStatus', label: '物资状态', width: 100, type: 'tag' },
    { prop: 'remark', label: '备注', minWidth: 120 }
  ],

  // 乙供物资详情页列配置
  supplierMaterialDetail: [
    { prop: 'materialId', label: '物资ID', width: 120, fixed: true },
    { prop: 'materialName', label: '物资名称', minWidth: 180, fixed: true },
    { prop: 'specification', label: '规格型号', minWidth: 150 },
    { prop: 'unit', label: '计量单位', width: 100 },
    { prop: 'quantity', label: '需求数量', width: 120, type: 'number' },
    { prop: 'estimatedPrice', label: '预估单价', width: 120, type: 'currency' },
    { prop: 'actualPrice', label: '实际单价', width: 120, type: 'currency' },
    { prop: 'totalCost', label: '总成本', width: 130, type: 'currency' },
    { prop: 'contractor', label: '承包商', minWidth: 150 },
    { prop: 'completionRate', label: '完成率', width: 100, type: 'percentage' },
    { prop: 'materialStatus', label: '物资状态', width: 100, type: 'tag' },
    { prop: 'remark', label: '备注', minWidth: 120 }
  ]
}

// 导入导出配置
export const IMPORT_EXPORT_CONFIG = {
  overview: {
    exportFileName: '项目数据总览',
    importTemplate: '项目数据导入模板'
  },
  contract: {
    exportFileName: '合同数据',
    importTemplate: '合同数据导入模板'
  },
  ownerMaterial: {
    exportFileName: '甲供项目数据',
    importTemplate: '甲供数据导入模板'
  },
  supplierMaterial: {
    exportFileName: '乙供项目数据',
    importTemplate: '乙供数据导入模板'
  }
}

// 分页配置
export const PAGINATION_CONFIG = {
  pageSize: 20,
  pageSizes: [10, 20, 50, 100]
}

// Mock数据
export const MOCK_DATA = {
  // 项目数据总览Mock数据（只显示已关联的项目）
  overview: [
    {
      projectId: 'P2024001',
      projectCode: 'PROJ-2024-0001',
      projectName: '城市地铁一号线建设项目',
      projectType: '基础设施',
      startDate: '2024-01-15',
      endDate: '2025-12-31',
      budget: 150000000,
      signDate: '2024-01-12 14:30:00',
      contractFileCount: 3,
      ownerMaterialFileCount: 15,
      supplierMaterialFileCount: 28,
      createTime: '2024-01-10 09:30:00',
      updateTime: '2024-01-20 16:45:00'
    },
    {
      projectId: 'P2024003',
      projectCode: 'PROJ-2024-0003',
      projectName: '住宅小区开发项目',
      projectType: '住宅建筑',
      startDate: '2024-02-10',
      endDate: '2025-06-30',
      budget: 200000000,
      signDate: '2024-02-08 16:45:00',
      contractFileCount: 5,
      ownerMaterialFileCount: 25,
      supplierMaterialFileCount: 45,
      createTime: '2024-02-05 08:15:00',
      updateTime: '2024-02-28 17:20:00'
    }
  ],

  // 合同数据Mock数据
  contract: [
    {
      contractId: 'C2024001',
      contractCode: 'CONT-2024-001',
      contractName: '地铁隧道挖掘合同',
      contractType: '施工合同',
      signDate: '2024-01-20',
      totalAmount: 50000000,
      partyA: '市政建设有限公司',
      partyB: '隧道工程集团',
      linkStatus: '已关联',
      projectId: 'P2024001',
      createTime: '2024-01-18 10:00:00'
    },
    {
      contractId: 'C2024002',
      contractCode: 'CONT-2024-002',
      contractName: '办公楼装修合同',
      contractType: '装修合同',
      signDate: '2024-03-10',
      totalAmount: 25000000,
      partyA: '智慧科技有限公司',
      partyB: '装饰工程公司',
      linkStatus: '未关联',
      projectId: '',
      createTime: '2024-03-08 15:30:00'
    },
    {
      contractId: 'C2024003',
      contractCode: 'CONT-2024-003',
      contractName: '住宅建筑总承包合同',
      contractType: '总承包合同',
      signDate: '2024-02-15',
      totalAmount: 120000000,
      partyA: '房地产开发有限公司',
      partyB: '建筑集团有限公司',
      linkStatus: '已关联',
      projectId: 'P2024003',
      createTime: '2024-02-12 09:45:00'
    }
  ],

  // 甲供项目数据Mock数据（按项目维度组织）
  ownerMaterial: [
    {
      projectId: 'P2024001',
      projectCode: 'PROJ-2024-0001',
      projectName: '城市地铁一号线建设项目',
      contractCode: 'CONT-2024-001',
      materialCount: 25,
      totalBudget: 15000000,
      completedCount: 18,
      completionRate: 72,
      projectStatus: '进行中',
      startDate: '2024-01-15',
      endDate: '2025-12-31',
      remark: '按计划进行中，部分物资已到场',
      createTime: '2024-01-10 09:30:00'
    },
    {
      projectId: 'P2024003',
      projectCode: 'PROJ-2024-0003', 
      projectName: '住宅小区开发项目',
      contractCode: 'CONT-2024-003',
      materialCount: 32,
      totalBudget: 28000000,
      completedCount: 25,
      completionRate: 78,
      projectStatus: '进行中',
      startDate: '2024-02-10',
      endDate: '2025-06-30',
      remark: '甲供物资到货及时，质量良好',
      createTime: '2024-02-05 08:15:00'
    },
    {
      projectId: 'P2024005',
      projectCode: 'PROJ-2024-0005',
      projectName: '办公楼装修改造项目',
      contractCode: 'CONT-2024-005',
      materialCount: 15,
      totalBudget: 8500000,
      completedCount: 15,
      completionRate: 100,
      projectStatus: '已完成',
      startDate: '2024-01-20',
      endDate: '2024-08-15',
      remark: '所有甲供物资已按时交付完成',
      createTime: '2024-01-15 10:20:00'
    }
  ],

  // 乙供项目数据Mock数据（按项目维度组织）
  supplierMaterial: [
    {
      projectId: 'P2024001',
      projectCode: 'PROJ-2024-0001',
      projectName: '城市地铁一号线建设项目',
      contractCode: 'CONT-2024-001',
      materialCount: 45,
      estimatedBudget: 22000000,
      actualCost: 21500000,
      completionRate: 75,
      projectStatus: '进行中',
      contractor: '地铁建设集团有限公司',
      startDate: '2024-01-15',
      endDate: '2025-12-31',
      remark: '乙供物资采购进度良好，成本控制在预算内',
      createTime: '2024-01-10 09:30:00'
    },
    {
      projectId: 'P2024003',
      projectCode: 'PROJ-2024-0003',
      projectName: '住宅小区开发项目',
      contractCode: 'CONT-2024-003',
      materialCount: 38,
      estimatedBudget: 18500000,
      actualCost: 17800000,
      completionRate: 85,
      projectStatus: '进行中',
      contractor: '建筑集团有限公司',
      startDate: '2024-02-10',
      endDate: '2025-06-30',
      remark: '乙供物资质量优良，进度超前',
      createTime: '2024-02-05 08:15:00'
    },
    {
      projectId: 'P2024006',
      projectCode: 'PROJ-2024-0006',
      projectName: '商业综合体项目',
      contractCode: 'CONT-2024-006',
      materialCount: 52,
      estimatedBudget: 35000000,
      actualCost: 34200000,
      completionRate: 95,
      projectStatus: '即将完成',
      contractor: '大型建设集团',
      startDate: '2024-01-08',
      endDate: '2024-12-15',
      remark: '项目接近尾声，乙供物资基本到位',
      createTime: '2024-01-03 14:30:00'
    }
  ]
}
