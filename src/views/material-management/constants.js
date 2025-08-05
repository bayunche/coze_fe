// MaterialManagementPage 页面相关常量

export const TAB_NAMES = {
  MATERIALS: 'materials',
  PRICES: 'prices'
}

export const TAB_CONFIG = [
  { 
    name: TAB_NAMES.MATERIALS, 
    label: '基础物资管理',
    icon: '📦'
  },
  { 
    name: TAB_NAMES.PRICES, 
    label: '物资价格管理',
    icon: '💰'
  }
]

export const MATERIAL_COLUMNS = [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 80 },
  { prop: 'materialName', label: '物资名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'specification', label: '规格型号', minWidth: 150, showOverflowTooltip: true },
  { prop: 'unit', label: '单位', width: 100 },
  { prop: 'category', label: '物资分类', width: 140 },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { label: '操作', width: 200, fixed: 'right' }
]

export const PRICE_COLUMNS = [
  { type: 'selection', width: 55 },
  { type: 'index', label: '序号', width: 80 },
  { prop: 'materialName', label: '物资名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'specification', label: '规格型号', minWidth: 130, showOverflowTooltip: true },
  { prop: 'price', label: '物资价格', width: 130, align: 'right' },
  { prop: 'quarter', label: '所属季度', width: 120 },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { label: '操作', width: 160, fixed: 'right' }
]

export const BUTTON_ACTIONS = {
  ADD: 'add',
  IMPORT: 'import', 
  EXPORT: 'export',
  DELETE: 'delete',
  EDIT: 'edit',
  VIEW: 'view'
}

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100],
  DEFAULT_CURRENT: 1
}

export const SEARCH_FORM_CONFIG = {
  MATERIALS: {
    materialName: {
      label: '物资名称',
      placeholder: '请输入物资名称',
      type: 'input'
    },
    specification: {
      label: '规格型号', 
      placeholder: '请输入规格型号',
      type: 'input'
    },
    category: {
      label: '物资分类',
      placeholder: '请选择物资分类',
      type: 'select',
      options: []
    }
  },
  PRICES: {
    materialId: {
      label: '物资名称',
      placeholder: '请选择物资',
      type: 'select',
      options: []
    },
    quarter: {
      label: '所属季度',
      placeholder: '请选择季度',
      type: 'date'
    }
  }
}

export const MOCK_STATS = {
  totalMaterials: 1234,
  totalPrices: 5678,
  averagePrice: 156.78,
  updateToday: 23
}

export const DIALOG_TYPES = {
  ADD_MATERIAL: 'addMaterial',
  EDIT_MATERIAL: 'editMaterial',
  ADD_PRICE: 'addPrice',
  EDIT_PRICE: 'editPrice',
  IMPORT: 'import'
}

export const DIALOG_TITLES = {
  [DIALOG_TYPES.ADD_MATERIAL]: '添加基础物资',
  [DIALOG_TYPES.EDIT_MATERIAL]: '编辑基础物资',
  [DIALOG_TYPES.ADD_PRICE]: '添加物资价格',
  [DIALOG_TYPES.EDIT_PRICE]: '编辑物资价格',
  [DIALOG_TYPES.IMPORT]: '批量导入'
}

export const FORM_RULES = {
  materialName: [
    { required: true, message: '请输入物资名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  specification: [
    { required: true, message: '请输入规格型号', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择物资分类', trigger: 'change' }
  ],
  materialId: [
    { required: true, message: '请选择物资', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格必须大于0', trigger: 'blur' }
  ],
  quarter: [
    { required: true, message: '请选择季度', trigger: 'change' }
  ]
}

export const IMPORT_FILE_CONFIG = {
  ACCEPT: '.xls,.xlsx',
  MAX_SIZE: 10, // MB
  TEMPLATE_DOWNLOAD_URL: '/templates/material_import_template.xlsx'
}