import { PROJECT_STATUS_MAP, TASK_TYPE_CONFIG } from './constants.js'

/**
 * 格式化项目状态
 * @param {string} status - 项目状态
 * @returns {Object} 状态信息对象
 */
export function formatProjectStatus(status) {
  return PROJECT_STATUS_MAP[status] || { label: status, type: 'info' }
}

/**
 * 计算项目进度百分比
 * @param {number} completedTasks - 已完成任务数
 * @param {number} totalTasks - 总任务数
 * @returns {number} 进度百分比
 */
export function calculateProgress(completedTasks, totalTasks) {
  if (!totalTasks || totalTasks === 0) return 0
  return Math.round((completedTasks / totalTasks) * 100)
}

/**
 * 格式化日期时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期时间
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return dateString
  }
}

/**
 * 格式化任务统计信息
 * @param {Object} project - 项目对象
 * @returns {Object} 格式化后的任务统计
 */
export function formatTaskStats(project) {
  if (!project) return {}

  const stats = {
    contract: project.contractTasks || 0,
    supplier_material: project.supplierMaterialTasks || 0,
    owner_material: project.ownerMaterialTasks || 0
  }

  return stats
}

/**
 * 获取任务类型配置
 * @param {string} taskType - 任务类型
 * @returns {Object} 任务类型配置
 */
export function getTaskTypeConfig(taskType) {
  return TASK_TYPE_CONFIG[taskType] || {
    label: taskType,
    icon: 'Document',
    color: '#909399'
  }
}

/**
 * 生成项目搜索关键词
 * @param {Object} project - 项目对象
 * @returns {string} 搜索关键词字符串
 */
export function generateSearchKeywords(project) {
  if (!project) return ''

  return [
    project.projectCode,
    project.projectName,
    project.description
  ].filter(Boolean).join(' ').toLowerCase()
}

/**
 * 过滤项目数据
 * @param {Array} projects - 项目数组
 * @param {Object} filters - 过滤条件
 * @returns {Array} 过滤后的项目数组
 */
export function filterProjects(projects, filters) {
  if (!Array.isArray(projects)) return []

  return projects.filter(project => {
    // 关键词过滤
    if (filters.keyword) {
      const keywords = generateSearchKeywords(project)
      if (!keywords.includes(filters.keyword.toLowerCase())) {
        return false
      }
    }

    // 状态过滤
    if (filters.status && filters.status !== '') {
      if (project.status !== filters.status) {
        return false
      }
    }

    return true
  })
}

/**
 * 排序项目数据
 * @param {Array} projects - 项目数组
 * @param {string} sortBy - 排序字段
 * @param {string} sortOrder - 排序方向 (asc/desc)
 * @returns {Array} 排序后的项目数组
 */
export function sortProjects(projects, sortBy, sortOrder = 'desc') {
  if (!Array.isArray(projects)) return []

  return [...projects].sort((a, b) => {
    let valueA = a[sortBy]
    let valueB = b[sortBy]

    // 特殊处理日期字段
    if (sortBy === 'createTime') {
      valueA = new Date(valueA).getTime()
      valueB = new Date(valueB).getTime()
    }

    // 特殊处理数字字段
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
    }

    // 字符串字段
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA)
    }

    // 其他类型
    if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1
    if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 分页处理
 * @param {Array} data - 数据数组
 * @param {number} page - 页码（从0开始）
 * @param {number} size - 页面大小
 * @returns {Object} 分页结果
 */
export function paginateData(data, page = 0, size = 20) {
  if (!Array.isArray(data)) return { content: [], totalElements: 0 }

  const startIndex = page * size
  const endIndex = startIndex + size
  const content = data.slice(startIndex, endIndex)

  return {
    content,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / size),
    size,
    number: page,
    first: page === 0,
    last: endIndex >= data.length,
    numberOfElements: content.length
  }
}

/**
 * 导出项目数据为CSV格式
 * @param {Array} projects - 项目数据
 * @returns {string} CSV格式字符串
 */
export function exportProjectsToCSV(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return ''
  }

  // CSV头部
  const headers = [
    '项目编号',
    '项目名称',
    '项目描述',
    '状态',
    '任务总数',
    '已完成任务',
    '进行中任务',
    '失败任务',
    '合同解析任务',
    '乙供物资任务',
    '甲供物资任务',
    '完成率',
    '创建时间'
  ]

  // 数据行
  const rows = projects.map(project => [
    project.projectCode || '',
    project.projectName || '',
    project.description || '',
    formatProjectStatus(project.status).label,
    project.totalTasks || 0,
    project.completedTasks || 0,
    project.inProgressTasks || 0,
    project.failedTasks || 0,
    project.contractTasks || 0,
    project.supplierMaterialTasks || 0,
    project.ownerMaterialTasks || 0,
    `${calculateProgress(project.completedTasks, project.totalTasks)}%`,
    formatDateTime(project.createTime)
  ])

  // 拼接CSV内容
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * 下载CSV文件
 * @param {string} csvContent - CSV内容
 * @param {string} filename - 文件名
 */
export function downloadCSV(csvContent, filename = 'projects.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * 验证项目数据
 * @param {Object} project - 项目对象
 * @returns {Object} 验证结果
 */
export function validateProject(project) {
  const errors = []

  if (!project.projectName || project.projectName.trim() === '') {
    errors.push('项目名称不能为空')
  }

  if (!project.projectCode || project.projectCode.trim() === '') {
    errors.push('项目编号不能为空')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 生成项目统计摘要
 * @param {Array} projects - 项目数组
 * @returns {Object} 统计摘要
 */
export function generateProjectSummary(projects) {
  if (!Array.isArray(projects)) return {}

  const summary = {
    totalProjects: projects.length,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    failedTasks: 0,
    contractTasks: 0,
    supplierMaterialTasks: 0,
    ownerMaterialTasks: 0
  }

  projects.forEach(project => {
    // 项目状态统计
    if (project.status === 'active' || project.status === 'ACTIVE') {
      summary.activeProjects++
    } else if (project.status === 'completed' || project.status === 'COMPLETED') {
      summary.completedProjects++
    }

    // 任务统计
    summary.totalTasks += project.totalTasks || 0
    summary.completedTasks += project.completedTasks || 0
    summary.inProgressTasks += project.inProgressTasks || 0
    summary.failedTasks += project.failedTasks || 0
    summary.contractTasks += project.contractTasks || 0
    summary.supplierMaterialTasks += project.supplierMaterialTasks || 0
    summary.ownerMaterialTasks += project.ownerMaterialTasks || 0
  })

  return summary
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}