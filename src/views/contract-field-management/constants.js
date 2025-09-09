// 合同解析基础字段管理页面常量配置

/**
 * 页面配置
 */
export const PAGE_CONFIG = {
  title: '合同解析字段管理',
  subtitle: '管理合同解析的关键提取字段配置',
  breadcrumb: ['智能大脑', '数据管理', '合同字段管理']
}

/**
 * 字段类型枚举
 */
export const FIELD_TYPE = {
  STRING: 'string',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object'
}

/**
 * 字段类型配置
 */
export const FIELD_TYPE_CONFIG = {
  [FIELD_TYPE.STRING]: {
    label: '文本类型',
    type: 'primary',
    icon: 'Document'
  },
  [FIELD_TYPE.NUMBER]: {
    label: '数值类型',
    type: 'success',
    icon: 'Grid'
  },
  [FIELD_TYPE.DATE]: {
    label: '日期类型',
    type: 'warning',
    icon: 'Calendar'
  },
  [FIELD_TYPE.BOOLEAN]: {
    label: '布尔类型',
    type: 'info',
    icon: 'Switch'
  },
  [FIELD_TYPE.ARRAY]: {
    label: '数组类型',
    type: 'danger',
    icon: 'List'
  },
  [FIELD_TYPE.OBJECT]: {
    label: '对象类型',
    type: 'default',
    icon: 'Grid'
  }
}

/**
 * 字段状态枚举
 */
export const FIELD_STATUS = {
  ENABLED: 1,
  DISABLED: 0
}

/**
 * 字段状态配置
 */
export const FIELD_STATUS_CONFIG = {
  [FIELD_STATUS.ENABLED]: {
    label: '启用中',
    type: 'success',
    icon: 'CircleCheck'
  },
  [FIELD_STATUS.DISABLED]: {
    label: '已停用',
    type: 'info',
    icon: 'CircleClose'
  }
}

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = {
  fieldInfo: {
    fieldName: { label: '字段名称', minWidth: 150, showOverflowTooltip: true },
    fieldCode: { label: '字段编码', width: 120, showOverflowTooltip: true },
    fieldType: { label: '字段类型', width: 100, align: 'center' },
    description: { label: '字段描述', minWidth: 200, showOverflowTooltip: true }
  },
  fieldConfig: {
    isRequired: { label: '是否必填', width: 100, align: 'center' },
    isEnabled: { label: '状态', width: 100, align: 'center' },
    displayOrder: { label: '显示顺序', width: 100, align: 'center' },
    defaultValue: { label: '默认值', width: 120, showOverflowTooltip: true }
  },
  timeInfo: {
    createTime: { label: '创建时间', width: 160 },
    updateTime: { label: '更新时间', width: 160 }
  },
  actions: {
    actions: { label: '操作', width: 200, fixed: 'right', align: 'center' }
  }
}

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  pageSizes: [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  defaultPageSize: 20
}

/**
 * 按钮配置
 */
export const BUTTON_CONFIG = {
  REFRESH: {
    text: '刷新',
    icon: 'Refresh',
    type: 'default'
  },
  EXPORT: {
    text: '导出配置',
    icon: 'Download',
    type: 'default'
  },
  IMPORT: {
    text: '导入配置',
    icon: 'Upload',
    type: 'default'
  },
  CREATE_FIELD: {
    text: '新增字段',
    icon: 'Plus',
    type: 'primary'
  },
  BATCH_ENABLE: {
    text: '批量启用',
    icon: 'CircleCheck',
    type: 'success'
  },
  BATCH_DISABLE: {
    text: '批量停用',
    icon: 'CircleClose',
    type: 'warning'
  },
  BATCH_DELETE: {
    text: '批量删除',
    icon: 'Delete',
    type: 'danger'
  },
  EDIT: {
    text: '编辑',
    type: 'primary',
    size: 'small'
  },
  TOGGLE: {
    text: '切换状态',
    type: 'warning',
    size: 'small'
  },
  DELETE: {
    text: '删除',
    type: 'danger',
    size: 'small'
  },
  DETAIL: {
    text: '详情',
    type: 'info',
    size: 'small',
    link: true
  }
}

/**
 * 消息提示配置
 */
export const MESSAGE_CONFIG = {
  LOAD_SUCCESS: '数据加载成功',
  LOAD_ERROR: '数据加载失败，请稍后重试',
  CREATE_SUCCESS: '字段创建成功',
  CREATE_ERROR: '字段创建失败',
  UPDATE_SUCCESS: '字段更新成功',
  UPDATE_ERROR: '字段更新失败',
  DELETE_SUCCESS: '字段删除成功',
  DELETE_ERROR: '字段删除失败',
  TOGGLE_SUCCESS: '状态切换成功',
  TOGGLE_ERROR: '状态切换失败',
  BATCH_ENABLE_SUCCESS: '批量启用成功',
  BATCH_DISABLE_SUCCESS: '批量停用成功',
  BATCH_DELETE_SUCCESS: '批量删除成功',
  NO_SELECTION: '请先选择要操作的记录',
  CONFIRM_DELETE: '确定要删除选中的字段吗？删除后不可恢复！',
  CONFIRM_BATCH_DELETE: '确定要批量删除选中的字段吗？删除后不可恢复！',
  CONFIRM_TOGGLE: '确定要切换该字段的状态吗？',
  EXPORT_SUCCESS: '配置导出成功',
  EXPORT_ERROR: '配置导出失败',
  IMPORT_SUCCESS: '配置导入成功',
  IMPORT_ERROR: '配置导入失败',
  FIELD_CODE_REQUIRED: '字段编码不能为空',
  FIELD_NAME_REQUIRED: '字段名称不能为空',
  FIELD_CODE_DUPLICATE: '字段编码已存在'
}

/**
 * 统计卡片配置
 */
export const STATS_CARDS = [
  {
    key: 'total',
    label: '总字段数',
    icon: 'DataAnalysis',
    color: '#165dff',
    bgColor: 'rgba(22, 93, 255, 0.1)',
    filterType: ''
  },
  {
    key: 'enabledCount',
    label: '启用中',
    icon: 'CircleCheck',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    filterType: FIELD_STATUS.ENABLED
  },
  {
    key: 'disabledCount',
    label: '已停用',
    icon: 'CircleClose',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    filterType: FIELD_STATUS.DISABLED
  },
  {
    key: 'requiredCount',
    label: '必填字段',
    icon: 'Star',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    filterType: 'required'
  }
]

/**
 * 筛选选项配置
 */
export const FILTER_OPTIONS = {
  fieldType: [
    { label: '全部类型', value: '' },
    { label: '文本类型', value: FIELD_TYPE.STRING },
    { label: '数值类型', value: FIELD_TYPE.NUMBER },
    { label: '日期类型', value: FIELD_TYPE.DATE },
    { label: '布尔类型', value: FIELD_TYPE.BOOLEAN },
    { label: '数组类型', value: FIELD_TYPE.ARRAY },
    { label: '对象类型', value: FIELD_TYPE.OBJECT }
  ],
  status: [
    { label: '全部状态', value: '' },
    { label: '启用中', value: FIELD_STATUS.ENABLED },
    { label: '已停用', value: FIELD_STATUS.DISABLED }
  ],
  isRequired: [
    { label: '全部', value: '' },
    { label: '必填', value: true },
    { label: '选填', value: false }
  ]
}

/**
 * 表单验证规则
 */
export const FORM_RULES = {
  fieldName: [
    { required: true, message: '请输入字段名称', trigger: 'blur' },
    { min: 1, max: 50, message: '字段名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  fieldCode: [
    { required: true, message: '请输入字段编码', trigger: 'blur' },
    { min: 1, max: 30, message: '字段编码长度在 1 到 30 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字段编码必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  fieldType: [
    { required: true, message: '请选择字段类型', trigger: 'change' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' }
  ],
  displayOrder: [
    { type: 'number', min: 0, message: '显示顺序必须大于等于0', trigger: 'blur' }
  ]
}

/**
 * 默认值配置
 */
export const DEFAULT_VALUES = {
  EMPTY_TEXT: '-',
  NO_DATA_TEXT: '暂无数据',
  LOADING_TEXT: '加载中...',
  FIELD_FORM: {
    fieldName: '',
    fieldCode: '',
    fieldType: FIELD_TYPE.STRING,
    description: '',
    isRequired: false,
    isEnabled: FIELD_STATUS.ENABLED,
    defaultValue: '',
    validationRule: '',
    displayOrder: 0
  }
}

/**
 * 样式类名配置
 */
export const CSS_CLASSES = {
  PAGE_CONTAINER: 'contract-field-management-page',
  PAGE_HEADER: 'page-header',
  STATS_SECTION: 'stats-section',
  FILTER_SECTION: 'filter-section',
  TABLE_SECTION: 'table-section',
  BATCH_ACTIONS: 'batch-actions'
}

/**
 * 预设字段模板
 */
export const PRESET_FIELDS = [
  {
    fieldName: '合同编号',
    fieldCode: 'contractNo',
    fieldType: FIELD_TYPE.STRING,
    description: '合同的唯一标识编号',
    isRequired: true,
    displayOrder: 1
  },
  {
    fieldName: '合同名称',
    fieldCode: 'contractName',
    fieldType: FIELD_TYPE.STRING,
    description: '合同的完整名称',
    isRequired: true,
    displayOrder: 2
  },
  {
    fieldName: '签订日期',
    fieldCode: 'signDate',
    fieldType: FIELD_TYPE.DATE,
    description: '合同签订的日期',
    isRequired: true,
    displayOrder: 3
  },
  {
    fieldName: '合同金额',
    fieldCode: 'contractAmount',
    fieldType: FIELD_TYPE.NUMBER,
    description: '合同总金额（元）',
    isRequired: true,
    displayOrder: 4
  },
  {
    fieldName: '甲方名称',
    fieldCode: 'partyA',
    fieldType: FIELD_TYPE.STRING,
    description: '合同甲方（发包方）名称',
    isRequired: true,
    displayOrder: 5
  },
  {
    fieldName: '乙方名称',
    fieldCode: 'partyB',
    fieldType: FIELD_TYPE.STRING,
    description: '合同乙方（承包方）名称',
    isRequired: true,
    displayOrder: 6
  },
  {
    fieldName: '开始日期',
    fieldCode: 'startDate',
    fieldType: FIELD_TYPE.DATE,
    description: '合同生效开始日期',
    isRequired: false,
    displayOrder: 7
  },
  {
    fieldName: '结束日期',
    fieldCode: 'endDate',
    fieldType: FIELD_TYPE.DATE,
    description: '合同到期结束日期',
    isRequired: false,
    displayOrder: 8
  },
  {
    fieldName: '工程地点',
    fieldCode: 'projectLocation',
    fieldType: FIELD_TYPE.STRING,
    description: '工程实施地点',
    isRequired: false,
    displayOrder: 9
  },
  {
    fieldName: '联系人',
    fieldCode: 'contactPerson',
    fieldType: FIELD_TYPE.STRING,
    description: '合同联系人姓名',
    isRequired: false,
    displayOrder: 10
  },
  {
    fieldName: '联系电话',
    fieldCode: 'contactPhone',
    fieldType: FIELD_TYPE.STRING,
    description: '合同联系人电话',
    isRequired: false,
    displayOrder: 11
  },
  {
    fieldName: '付款方式',
    fieldCode: 'paymentMethod',
    fieldType: FIELD_TYPE.STRING,
    description: '合同约定的付款方式',
    isRequired: false,
    displayOrder: 12
  }
]