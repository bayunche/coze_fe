// 项目管理页面常量定义

// 项目状态选项
export const PROJECT_STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '活跃', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '暂停', value: 'paused' },
  { label: '已取消', value: 'cancelled' }
]

// 表格列配置
export const TABLE_COLUMNS = [
  {
    key: 'projectCode',
    label: '项目编号',
    sortable: true,
    width: 160
  },
  {
    key: 'projectName',
    label: '项目名称',
    sortable: true,
    minWidth: 200
  },
  {
    key: 'totalTasks',
    label: '任务总数',
    sortable: true,
    width: 100
  },
  {
    key: 'completedTasks',
    label: '已完成',
    sortable: true,
    width: 100
  },
  {
    key: 'inProgressTasks',
    label: '进行中',
    sortable: true,
    width: 100
  },
  {
    key: 'failedTasks',
    label: '失败',
    sortable: true,
    width: 100
  },
  {
    key: 'progressPercentage',
    label: '完成率',
    sortable: true,
    width: 120
  },
  {
    key: 'status',
    label: '状态',
    sortable: true,
    width: 100
  },
  {
    key: 'createTime',
    label: '创建时间',
    sortable: true,
    width: 180
  },
  {
    key: 'actions',
    label: '操作',
    width: 150
  }
]

// 排序选项
export const SORT_OPTIONS = [
  { label: '创建时间降序', value: 'createTime,desc' },
  { label: '创建时间升序', value: 'createTime,asc' },
  { label: '项目名称升序', value: 'projectName,asc' },
  { label: '项目名称降序', value: 'projectName,desc' },
  { label: '完成率降序', value: 'progressPercentage,desc' },
  { label: '完成率升序', value: 'progressPercentage,asc' },
  { label: '任务总数降序', value: 'totalTasks,desc' },
  { label: '任务总数升序', value: 'totalTasks,asc' }
]

// 分页选项
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 默认分页配置
export const DEFAULT_PAGINATION = {
  page: 0,
  size: 20,
  sort: 'createTime,desc'
}

// 项目状态映射
export const PROJECT_STATUS_MAP = {
  active: { label: '活跃', type: 'success' },
  completed: { label: '已完成', type: 'info' },
  paused: { label: '暂停', type: 'warning' },
  cancelled: { label: '已取消', type: 'danger' },
  ACTIVE: { label: '活跃', type: 'success' },
  COMPLETED: { label: '已完成', type: 'info' },
  PAUSED: { label: '暂停', type: 'warning' },
  CANCELLED: { label: '已取消', type: 'danger' }
}

// 任务类型配置
export const TASK_TYPE_CONFIG = {
  contract: {
    label: '合同解析',
    icon: 'Document',
    color: '#409EFF'
  },
  supplier_material: {
    label: '乙供物资',
    icon: 'Box',
    color: '#67C23A'
  },
  owner_material: {
    label: '甲供物资',
    icon: 'Goods',
    color: '#E6A23C'
  }
}

// 操作按钮配置
export const ACTION_CONFIG = {
  view: {
    label: '查看详情',
    type: 'primary',
    icon: 'View'
  },
  export: {
    label: '导出数据',
    type: 'success',
    icon: 'Download'
  },
  edit: {
    label: '编辑',
    type: 'warning',
    icon: 'Edit'
  },
  delete: {
    label: '删除',
    type: 'danger',
    icon: 'Delete'
  }
}

// 统计卡片配置
export const STATS_CONFIG = [
  {
    key: 'totalProjects',
    title: '项目总数',
    icon: 'FolderOpened',
    color: '#409EFF',
    formatter: (value) => value || 0
  },
  {
    key: 'activeProjects',
    title: '活跃项目',
    icon: 'Loading',
    color: '#67C23A',
    formatter: (value) => value || 0
  },
  {
    key: 'completedProjects',
    title: '已完成项目',
    icon: 'CircleCheck',
    color: '#909399',
    formatter: (value) => value || 0
  },
  {
    key: 'totalTasks',
    title: '任务总数',
    icon: 'List',
    color: '#E6A23C',
    formatter: (value) => value || 0
  }
]

// 刷新间隔（毫秒）
export const REFRESH_INTERVAL = 30000

// 搜索防抖延迟（毫秒）
export const SEARCH_DEBOUNCE_DELAY = 300