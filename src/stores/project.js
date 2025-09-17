import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ProjectService from '@/services/ProjectService.js'

/**
 * 项目状态管理
 * 管理项目相关的数据和状态
 */
export const useProjectStore = defineStore('project', () => {
  // 状态数据
  const projects = ref([])
  const currentProject = ref(null)
  const projectStats = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 分页相关状态
  const pagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  })

  // 搜索和筛选状态
  const searchKeyword = ref('')
  const statusFilter = ref('')

  // 计算属性
  const totalProjects = computed(() => projects.value.length)

  const activeProjects = computed(() =>
    projects.value.filter(project => project.status === 'active' || project.status === 'ACTIVE')
  )

  const completedProjects = computed(() =>
    projects.value.filter(project => project.status === 'completed' || project.status === 'COMPLETED')
  )

  const projectsWithStats = computed(() => {
    return projects.value.map(project => ({
      ...project,
      progressPercentage: project.totalTasks > 0
        ? Math.round((project.completedTasks / project.totalTasks) * 100)
        : 0
    }))
  })

  // Actions

  /**
   * 获取项目列表
   * @param {Object} params - 查询参数
   * @param {boolean} refresh - 是否刷新数据
   */
  const fetchProjects = async (params = {}, refresh = false) => {
    if (loading.value && !refresh) return

    try {
      loading.value = true
      error.value = null

      // 合并搜索参数
      const queryParams = {
        page: pagination.value.page,
        size: pagination.value.size,
        keyword: searchKeyword.value,
        status: statusFilter.value,
        ...params
      }

      // 调用API获取项目列表
      // 目前使用从任务数据转换的方式，后续可以替换为真正的项目API
      const projectData = await ProjectService.getProjectsFromTasks()

      if (Array.isArray(projectData)) {
        projects.value = projectData

        // 模拟分页信息
        pagination.value = {
          page: 0,
          size: projectData.length,
          totalElements: projectData.length,
          totalPages: 1,
          first: true,
          last: true
        }
      }

      console.log('【Project Store】项目列表加载完成:', projects.value.length, '个项目')
    } catch (err) {
      error.value = err.message || '获取项目列表失败'
      console.error('【Project Store】获取项目列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目详情
   * @param {string} projectId - 项目ID
   */
  const fetchProjectDetail = async (projectId) => {
    try {
      loading.value = true
      error.value = null

      console.log('【Project Store】获取项目详情:', projectId)

      // 先从本地缓存中查找
      const cachedProject = projects.value.find(p =>
        p.projectId === projectId || p.projectCode === projectId
      )

      if (cachedProject) {
        currentProject.value = cachedProject
        console.log('【Project Store】使用缓存的项目详情')
        return cachedProject
      }

      // 如果本地没有，调用API获取
      try {
        const projectDetail = await ProjectService.getProjectDetail(projectId)
        currentProject.value = projectDetail
        return projectDetail
      } catch (apiError) {
        // API可能还未实现，使用缓存数据
        console.warn('【Project Store】API未实现，使用缓存数据')
        currentProject.value = cachedProject
        return cachedProject
      }
    } catch (err) {
      error.value = err.message || '获取项目详情失败'
      console.error('【Project Store】获取项目详情失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目任务列表
   * @param {string} projectId - 项目ID
   * @param {string} taskType - 任务类型
   * @param {Object} params - 查询参数
   */
  const fetchProjectTasks = async (projectId, taskType = null, params = {}) => {
    try {
      console.log('【Project Store】获取项目任务:', projectId, taskType, params)

      // 目前从本地项目数据中筛选任务
      const project = projects.value.find(p =>
        p.projectId === projectId || p.projectCode === projectId
      )

      if (!project || !project.tasks) {
        console.warn('【Project Store】未找到项目或项目任务数据:', projectId)
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params.size || 10,
          number: params.page || 0,
          first: true,
          last: true,
          numberOfElements: 0
        }
      }

      let filteredTasks = project.tasks

      // 根据任务类型筛选
      if (taskType) {
        switch (taskType) {
          case 'contract':
            filteredTasks = project.tasks.filter(task =>
              task.agentLabels?.includes('contract')
            )
            break
          case 'supplier_material':
            filteredTasks = project.tasks.filter(task =>
              task.agentLabels?.includes('y_material')
            )
            break
          case 'owner_material':
            filteredTasks = project.tasks.filter(task =>
              task.agentLabels?.includes('j_material')
            )
            break
        }
      }

      // 简单的分页处理
      const page = params.page || 0
      const size = params.size || 10
      const startIndex = page * size
      const endIndex = startIndex + size
      const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

      return {
        content: paginatedTasks,
        totalElements: filteredTasks.length,
        totalPages: Math.ceil(filteredTasks.length / size),
        size: size,
        number: page,
        first: page === 0,
        last: endIndex >= filteredTasks.length,
        numberOfElements: paginatedTasks.length
      }
    } catch (err) {
      console.error('【Project Store】获取项目任务失败:', err)
      throw err
    }
  }

  /**
   * 获取项目统计信息
   */
  const fetchProjectStats = async () => {
    try {
      const stats = await ProjectService.getProjectStats()
      projectStats.value = stats
      return stats
    } catch (err) {
      console.error('【Project Store】获取项目统计失败:', err)
      return []
    }
  }

  /**
   * 设置搜索关键词
   * @param {string} keyword - 搜索关键词
   */
  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  /**
   * 设置状态筛选
   * @param {string} status - 状态筛选
   */
  const setStatusFilter = (status) => {
    statusFilter.value = status
  }

  /**
   * 设置当前项目
   * @param {Object} project - 项目对象
   */
  const setCurrentProject = (project) => {
    currentProject.value = project
  }

  /**
   * 清空当前项目
   */
  const clearCurrentProject = () => {
    currentProject.value = null
  }

  /**
   * 重置分页
   */
  const resetPagination = () => {
    pagination.value = {
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    projects.value = []
    currentProject.value = null
    projectStats.value = []
    error.value = null
    resetPagination()
  }

  /**
   * 根据项目ID获取项目信息
   * @param {string} projectId - 项目ID
   */
  const getProjectById = (projectId) => {
    return projects.value.find(p =>
      p.projectId === projectId || p.projectCode === projectId
    )
  }

  /**
   * 刷新所有数据
   */
  const refreshAll = async () => {
    await Promise.all([
      fetchProjects({}, true),
      fetchProjectStats()
    ])
  }

  return {
    // 状态
    projects,
    currentProject,
    projectStats,
    loading,
    error,
    pagination,
    searchKeyword,
    statusFilter,

    // 计算属性
    totalProjects,
    activeProjects,
    completedProjects,
    projectsWithStats,

    // 方法
    fetchProjects,
    fetchProjectDetail,
    fetchProjectTasks,
    fetchProjectStats,
    setSearchKeyword,
    setStatusFilter,
    setCurrentProject,
    clearCurrentProject,
    resetPagination,
    clearData,
    getProjectById,
    refreshAll
  }
}, {
  persist: {
    key: 'coze-project-store',
    storage: localStorage,
    paths: [
      'projects',
      'currentProject',
      'searchKeyword',
      'statusFilter'
    ]
  }
})