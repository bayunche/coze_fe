import request from '@/utils/request.js'

/**
 * 项目管理API服务类
 * 提供项目相关的数据管理功能，支持项目维度的任务统计和管理
 */
class ProjectService {
  /**
   * 搜索项目信息（包含任务执行数统计）
   * @param {Object} params - 查询参数
   * @param {string} params.keyword - 搜索关键字，可以为空
   * @param {number} params.page - 页码，默认0
   * @param {number} params.size - 每页条数，默认10
   * @returns {Promise<Object>} 项目列表分页数据
   */
  async searchProjectsWithTaskStats(params = {}) {
    try {
      console.log('【调用】搜索项目信息（包含任务统计），参数:', params)

      const response = await request.get('/baseprojectinfo/searchWithTaskStats', {
        params: {
          keyword: params.keyword || '',
          page: params.page || 0,
          size: params.size || 10
        }
      })

      console.log('【响应】项目信息（包含任务统计）:', response)

      // 处理API响应并转换数据格式
      return this.transformProjectData(response)
    } catch (error) {
      console.error('【错误】搜索项目信息失败:', error)

      // 返回空数据结构，避免页面崩溃
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
  }

  /**
   * 获取项目列表（保留原方法以兼容）
   * @param {Object} params - 查询参数
   * @param {string} params.keyword - 搜索关键词（项目名称、项目编号等）
   * @param {string} params.status - 项目状态筛选
   * @param {number} params.page - 页码，从0开始
   * @param {number} params.size - 每页大小
   * @param {string} params.sort - 排序字段
   * @returns {Promise<Object>} 项目列表分页数据
   */
  async getProjectList(params = {}) {
    // 现在使用新的API
    return this.searchProjectsWithTaskStats(params)
  }

  /**
   * 查询智能体任务
   * @param {Object} params - 查询参数
   * @param {string} params.agentLabels - 智能体标签
   * @param {string} params.projectId - 项目ID，用于精确匹配
   * @param {string} params.projectName - 项目名称，用于模糊搜索
   * @param {number} params.page - 页码，默认0
   * @param {number} params.size - 每页条数，默认10
   * @returns {Promise<Object>} 任务列表分页数据
   */
  async getAgentTasks(params = {}) {
    try {
      console.log('【调用】查询智能体任务，参数:', params)

      if (!params.agentLabels) {
        throw new Error('智能体标签不能为空')
      }

      const response = await request.get('/api/smart-brain/agents/tasks', {
        params: {
          agentLabels: params.agentLabels,
          projectId: params.projectId,
          projectName: params.projectName,
          page: params.page || 0,
          size: params.size || 10
        }
      })

      console.log('【响应】智能体任务列表:', response)

      // 处理API响应格式
      if (response && response.data) {
        return response.data
      }

      // 如果API直接返回分页数据
      if (response && response.content && typeof response.totalElements === 'number') {
        return response
      }

      // 异常情况，返回空的分页结构
      console.warn('智能体任务API返回格式异常:', response)
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
    } catch (error) {
      console.error('【错误】查询智能体任务失败:', error)

      // 返回空数据结构
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
  }

  /**
   * 获取项目详细信息
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 项目详细信息
   */
  async getProjectDetail(projectId) {
    try {
      console.log('【调用】获取项目详情，项目ID:', projectId)

      if (!projectId) {
        throw new Error('项目ID不能为空')
      }

      const response = await request.get(`/projects/${projectId}`)

      console.log('【响应】项目详情:', response)
      return response.data || response
    } catch (error) {
      console.error('【错误】获取项目详情失败:', error)
      throw error
    }
  }

  /**
   * 获取项目下的任务列表
   * @param {string} projectId - 项目ID
   * @param {string} taskType - 任务类型（可选：contract|supplier_material|owner_material）
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，从0开始
   * @param {number} params.size - 每页大小
   * @param {string} params.sort - 排序字段
   * @returns {Promise<Object>} 任务列表分页数据
   */
  async getProjectTasks(projectId, taskType = null, params = {}) {
    try {
      console.log('【调用】获取项目任务列表，项目ID:', projectId, '任务类型:', taskType, '参数:', params)

      if (!projectId) {
        throw new Error('项目ID不能为空')
      }

      const queryParams = {
        page: 0,
        size: 10,
        sort: 'createTime,desc',
        ...params
      }

      // 如果指定了任务类型，添加到查询参数
      if (taskType) {
        queryParams.taskType = taskType
      }

      const response = await request.get(`/projects/${projectId}/tasks`, {
        params: queryParams
      })

      console.log('【响应】项目任务列表:', response)

      // 处理API响应格式
      if (response && response.data) {
        return response.data
      }

      // 如果API直接返回分页数据
      if (response && response.content && typeof response.totalElements === 'number') {
        return response
      }

      // 异常情况，返回空的分页结构
      console.warn('项目任务列表API返回格式异常:', response)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: queryParams.size,
        number: queryParams.page,
        first: true,
        last: true,
        numberOfElements: 0
      }
    } catch (error) {
      console.error('【错误】获取项目任务列表失败:', error)

      // 返回空数据结构
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
  }

  /**
   * 获取项目统计信息（卡片展示用）
   * @returns {Promise<Array>} 项目统计数据数组
   */
  async getProjectStats() {
    try {
      console.log('【调用】获取项目统计信息')

      const response = await request.get('/projects/stats')

      console.log('【响应】项目统计信息:', response)

      if (Array.isArray(response)) {
        return response
      }

      if (response && Array.isArray(response.data)) {
        return response.data
      }

      // 如果API返回空或格式异常，返回空数组
      console.warn('项目统计API返回格式异常:', response)
      return []
    } catch (error) {
      console.error('【错误】获取项目统计信息失败:', error)
      return []
    }
  }

  /**
   * 获取项目任务统计汇总
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 任务统计汇总
   */
  async getProjectTaskStats(projectId) {
    try {
      console.log('【调用】获取项目任务统计，项目ID:', projectId)

      if (!projectId) {
        throw new Error('项目ID不能为空')
      }

      const response = await request.get(`/projects/${projectId}/task-stats`)

      console.log('【响应】项目任务统计:', response)
      return response.data || response
    } catch (error) {
      console.error('【错误】获取项目任务统计失败:', error)

      // 返回默认统计数据
      return {
        contractTasks: 0,
        supplierMaterialTasks: 0,
        ownerMaterialTasks: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        failedTasks: 0
      }
    }
  }

  /**
   * 根据智能体任务数据转换为项目维度数据
   * 这是一个过渡方法，用于从现有的智能体任务API获取项目数据
   * @returns {Promise<Array>} 项目数据数组
   */
  async getProjectsFromTasks() {
    try {
      console.log('【调用】从任务数据获取项目列表')

      // 调用现有的智能体任务统计API
      const smartBrainService = await import('./SmartBrainService.js')
      await smartBrainService.default.getAgentTaskDetails()

      // 获取所有任务列表来聚合项目信息
      const allTasksPromises = [
        smartBrainService.default.getAgentTasksList('contract'),
        smartBrainService.default.getAgentTasksList('y_material'),
        smartBrainService.default.getAgentTasksList('j_material')
      ]

      const [contractTasks, supplierTasks, ownerTasks] = await Promise.all(allTasksPromises)

      // 聚合所有任务的项目信息
      const allTasks = [
        ...(contractTasks.content || []),
        ...(supplierTasks.content || []),
        ...(ownerTasks.content || [])
      ]

      // 按项目分组
      const projectsMap = new Map()

      allTasks.forEach(task => {
        const projectInfo = task.projectInfo
        if (!projectInfo) return

        const projectKey = projectInfo.projectCode || projectInfo.projectId
        if (!projectKey) return

        if (!projectsMap.has(projectKey)) {
          projectsMap.set(projectKey, {
            projectId: projectInfo.projectId || projectKey,
            projectCode: projectInfo.projectCode || projectKey,
            projectName: projectInfo.projectName || '未知项目',
            status: projectInfo.status || 'active',
            description: projectInfo.description || '',
            createTime: projectInfo.createTime || new Date().toISOString(),
            contractTasks: 0,
            supplierMaterialTasks: 0,
            ownerMaterialTasks: 0,
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            failedTasks: 0,
            tasks: []
          })
        }

        const project = projectsMap.get(projectKey)

        // 根据任务类型统计
        if (task.agentLabels?.includes('contract')) {
          project.contractTasks++
        } else if (task.agentLabels?.includes('y_material')) {
          project.supplierMaterialTasks++
        } else if (task.agentLabels?.includes('j_material')) {
          project.ownerMaterialTasks++
        }

        project.totalTasks++

        // 统计任务状态
        if (task.status === 'COMPLETED') {
          project.completedTasks++
        } else if (task.status === 'RUNNING' || task.status === 'IN_PROGRESS') {
          project.inProgressTasks++
        } else if (task.status === 'FAILED' || task.status === 'ERROR') {
          project.failedTasks++
        }

        project.tasks.push(task)
      })

      const projects = Array.from(projectsMap.values())
      console.log('【转换】项目数据:', projects)

      return projects
    } catch (error) {
      console.error('【错误】从任务数据获取项目列表失败:', error)
      return []
    }
  }

  /**
   * 转换项目数据格式
   * 将后端API返回的数据格式转换为前端需要的格式
   * @param {Object} apiResponse - API响应数据
   * @returns {Object} 转换后的分页数据
   */
  transformProjectData(apiResponse) {
    try {
      console.log('【转换】项目数据格式，输入:', apiResponse)

      // 处理API响应格式
      let response = apiResponse
      if (apiResponse && apiResponse.data) {
        response = apiResponse.data
      }

      // 检查是否为有效的分页响应
      if (!response || !Array.isArray(response.content)) {
        console.warn('API响应格式异常，返回空数据')
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
          numberOfElements: 0
        }
      }

      // 转换每个项目的数据格式
      const transformedProjects = response.content.map(project => {
        const taskStats = project.taskExecutionCountByBusinessDomain || {}

        return {
          // 基本信息
          projectId: project.id,
          projectName: project.projectName,
          projectCode: project.projectCode,
          engineeringName: project.engineeringName,
          engineeringCode: project.engineeringCode,
          contractCode: project.contractCode,
          contractName: project.contractName,

          // 任务统计
          totalTasks: project.totalTaskExecutionCount || 0,
          contractTasks: taskStats.contract || 0,
          supplierMaterialTasks: taskStats.y_material || 0,
          ownerMaterialTasks: taskStats.j_material || 0,

          // 任务状态统计（暂时用总数的估算，后续可能需要调用详细接口）
          completedTasks: Math.floor((project.totalTaskExecutionCount || 0) * 0.6), // 假设60%完成
          inProgressTasks: Math.floor((project.totalTaskExecutionCount || 0) * 0.3), // 假设30%进行中
          failedTasks: Math.floor((project.totalTaskExecutionCount || 0) * 0.1), // 假设10%失败

          // 项目状态（后续可能需要从项目详情获取）
          status: 'ACTIVE', // 默认状态

          // 时间信息（后续可能需要从项目详情获取）
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),

          // 描述信息
          description: `${project.engineeringName || ''} - ${project.contractName || ''}`.replace(/^- | -$/g, '') || '暂无描述'
        }
      })

      const result = {
        content: transformedProjects,
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        size: response.size || 10,
        number: response.number || 0,
        first: response.first !== undefined ? response.first : true,
        last: response.last !== undefined ? response.last : true,
        numberOfElements: response.numberOfElements || transformedProjects.length
      }

      console.log('【转换】项目数据格式完成，输出:', result)
      return result
    } catch (error) {
      console.error('【错误】转换项目数据格式失败:', error)

      // 返回空数据结构
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        numberOfElements: 0
      }
    }
  }
}

// 创建单例实例
const projectService = new ProjectService()

export default projectService