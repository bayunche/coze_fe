// ProjectDataManagementPage 页面相关常量

export const PAGE_CONFIG = {
  TITLE: '项目数据管理',
  SUBTITLE: '管理项目相关的数据信息'
}

// Tab配置 - 只保留项目数据总览
export const TAB_CONFIG = {
  OVERVIEW: {
    name: 'overview',
    label: '项目数据总览',
    icon: '📊'
  }
}

// 动态表格列配置映射 - 精简后只保留项目总览
export const DYNAMIC_TABLE_COLUMNS = {
  // 项目总览列配置 - 添加合同关联信息
  overview: [
    { prop: 'projectId', label: '项目ID', minWidth: 120, fixed: true },
    { prop: 'projectCode', label: '项目编码', width: 140, fixed: true },
    { prop: 'projectName', label: '项目名称', minWidth: 200, fixed: true },
    { prop: 'projectType', label: '项目类型', width: 120, type: 'tag' },
    { prop: 'contractInfo', label: '关联合同', minWidth: 250, type: 'contract' },
    { prop: 'startDate', label: '开始时间', width: 120, type: 'date' },
    { prop: 'endDate', label: '结束时间', width: 120, type: 'date' }
  ],
  // 甲供物资解析详情列配置
  ownerMaterialDetail: [
    { prop: 'id', label: 'ID', width: 80, fixed: true },
    { prop: 'materialId', label: '物资编号', width: 120, fixed: true },
    { prop: 'materialName', label: '物资名称', minWidth: 200, fixed: true },
    { prop: 'specification', label: '规格型号', minWidth: 150 },
    { prop: 'unit', label: '单位', width: 80 },
    { prop: 'quantity', label: '需求数量', width: 100, type: 'number' },
    { prop: 'statisticalQuantity', label: '统计数量', width: 100, type: 'number' },
    { prop: 'transactionQuantity', label: '交易数量', width: 100, type: 'number' },
    { prop: 'supplier', label: '供应商', minWidth: 150 },
    { prop: 'materialStatus', label: '物资状态', width: 100, type: 'tag' },
    { prop: 'sourceType', label: '来源类型', width: 100 },
    { prop: 'transactionCountForSummary', label: '交易次数', width: 100, type: 'number' }
  ]
}

// 导入导出配置 - 只保留项目总览
export const IMPORT_EXPORT_CONFIG = {
  overview: {
    exportFileName: '项目数据总览',
    importTemplate: '项目数据导入模板'
  }
}

// 分页配置
export const PAGINATION_CONFIG = {
  pageSize: 20,
  pageSizes: [10, 20, 50, 100]
}

// Mock数据 - 只保留项目总览数据
export const MOCK_DATA = {
  // 项目数据总览Mock数据（精简字段，添加关联合同信息）
  overview: [
    {
      projectId: 'P2024001',
      projectCode: 'PROJ-2024-0001',
      projectName: '城市地铁一号线建设项目',
      projectType: '基础设施建设',
      startDate: '2024-01-15',
      endDate: '2025-12-31',
      contractInfo: '施工总承包合同、设备采购合同等4个合同'
    },
    {
      projectId: 'P2024002',
      projectCode: 'PROJ-2024-0002',
      projectName: '智慧园区A区建设项目',
      projectType: '商业综合体',
      startDate: '2024-03-10',
      endDate: '2025-08-20',
      contractInfo: '主体建设合同、装饰装修合同等3个合同'
    },
    {
      projectId: 'P2024003',
      projectCode: 'PROJ-2024-0003',
      projectName: '智慧园区B区建设项目',
      projectType: '住宅建筑',
      startDate: '2024-02-10',
      endDate: '2025-06-30',
      contractInfo: '土建施工合同、安装工程合同等2个合同'
    },
    {
      projectId: 'P2024004',
      projectCode: 'PROJ-2024-0004',
      projectName: '办公楼装修改造项目',
      projectType: '装修工程',
      startDate: '2024-01-20',
      endDate: '2024-08-15',
      contractInfo: '装修工程专项合同 (CONT-2024-015)'
    },
    {
      projectId: 'P2024005',
      projectCode: 'PROJ-2024-0005',
      projectName: '工厂厂房建设项目',
      projectType: '工业建筑',
      startDate: '2024-05-01',
      endDate: '2025-03-15',
      contractInfo: '工业厂房建设合同、设备安装合同等2个合同'
    },
    {
      projectId: 'P2024006',
      projectCode: 'PROJ-2024-0006',
      projectName: '桥梁改造升级项目',
      projectType: '基础设施建设',
      startDate: '2024-04-15',
      endDate: '2024-11-30',
      contractInfo: '基础设施改造合同 (CONT-2024-022)'
    },
    {
      projectId: 'P2024007',
      projectCode: 'PROJ-2024-0007',
      projectName: '学校建设项目',
      projectType: '教育建筑',
      startDate: '2024-06-01',
      endDate: '2025-05-30',
      contractInfo: '教育建筑施工合同、智能化系统合同等3个合同'
    },
    {
      projectId: 'P2024008',
      projectCode: 'PROJ-2024-0008',
      projectName: '医院扩建项目',
      projectType: '医疗建筑',
      startDate: '2024-03-25',
      endDate: '2025-01-20',
      contractInfo: '医疗建筑扩建合同、医疗设备采购合同等2个合同'
    },
    {
      projectId: 'P2024009',
      projectCode: 'PROJ-2024-0009',
      projectName: '配套停车场建设项目',
      projectType: '基础设施建设',
      startDate: '2024-04-01',
      endDate: '2024-10-30',
      contractInfo: '停车场建设合同、智能设备安装合同等2个合同'
    }
  ]
}
