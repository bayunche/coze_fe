// OverviewStatsDialog 组件相关常量

export const DIALOG_CONFIG = {
  WIDTH: '80%',
  CUSTOM_CLASS: 'overview-stats-dialog'
}

export const TASK_STATUS_TYPES = {
  SUCCESS: 'success',
  ERROR: 'danger', 
  PENDING: 'warning'
}

export const TABLE_COLUMNS = [
  {
    prop: 'taskName',
    label: '任务名称',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    prop: 'agentName',
    label: '执行智能体',
    width: 160,
    showOverflowTooltip: true
  },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center'
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 160,
    align: 'center'
  },
  {
    prop: 'finishTime',
    label: '完成时间',
    width: 160,
    align: 'center'
  },
  {
    prop: 'duration',
    label: '耗时',
    width: 100,
    align: 'center'
  },
  {
    prop: 'description',
    label: '描述',
    minWidth: 200,
    showOverflowTooltip: true
  }
]

export const PROGRESS_COLUMNS = [
  {
    prop: 'taskName',
    label: '任务名称',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    prop: 'agentName',
    label: '执行智能体',
    width: 160,
    showOverflowTooltip: true
  },
  {
    prop: 'progress',
    label: '进度',
    width: 150,
    align: 'center'
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 160,
    align: 'center'
  },
  {
    prop: 'duration',
    label: '已用时',
    width: 100,
    align: 'center'
  },
  {
    prop: 'description',
    label: '描述',
    minWidth: 200,
    showOverflowTooltip: true
  }
]

export const ERROR_COLUMNS = [
  {
    prop: 'taskName',
    label: '任务名称',
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    prop: 'agentName',
    label: '执行智能体',
    width: 160,
    showOverflowTooltip: true
  },
  {
    prop: 'createTime',
    label: '创建时间',
    width: 160,
    align: 'center'
  },
  {
    prop: 'duration',
    label: '耗时',
    width: 100,
    align: 'center'
  },
  {
    prop: 'description',
    label: '描述',
    minWidth: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'errorMessage',
    label: '错误信息',
    minWidth: 200,
    showOverflowTooltip: true
  }
]

export const DIALOG_TYPE_CONFIG = {
  total: {
    title: '总任务数详情',
    columns: TABLE_COLUMNS,
    emptyText: '暂无任务数据'
  },
  completed: {
    title: '已完成任务详情',
    columns: TABLE_COLUMNS,
    emptyText: '暂无已完成的任务'
  },
  inProgress: {
    title: '进行中任务详情',
    columns: PROGRESS_COLUMNS,
    emptyText: '暂无进行中的任务'
  },
  failed: {
    title: '执行失败任务详情',
    columns: ERROR_COLUMNS,
    emptyText: '暂无失败的任务'
  }
}

export const EXPORT_CONFIG = {
  FILENAME_PREFIX: 'task_stats_',
  DATE_FORMAT: 'YYYYMMDD_HHmmss'
}