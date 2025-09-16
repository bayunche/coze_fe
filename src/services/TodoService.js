/**
 * 待办事项服务类
 * 处理待办事项相关的所有API调用
 */
import request from '@/utils/request.js'
import { ElMessage } from 'element-plus'

class TodoService {
  /**
   * 获取管理员待办列表
   * @param {Object} params - 查询参数
   * @param {Number} params.page - 页码（从0开始）
   * @param {Number} params.size - 每页大小
   * @param {String} params.todoType - 待办类型筛选
   * @param {Number} params.status - 状态筛选，默认查询待处理状态
   * @returns {Promise<Object>} 查询结果
   */
  async getAdminPendingTodos(params = {}) {
    try {
      console.log('【调用】获取管理员待办列表，参数:', params)

      const queryParams = new URLSearchParams({
        page: params.page || 0,
        size: params.size || 10,
        status: params.status ?? 0, // 默认查询待处理状态
        ...(params.todoType && { todoType: params.todoType })
      })

      const response = await request.get(`/api/todo/admin/pending?${queryParams}`)

      console.log('【响应】管理员待办列表:', response)
      return response
    } catch (error) {
      console.error('【错误】获取管理员待办列表失败:', error)
      throw error
    }
  }

  /**
   * 创建待办事项
   * @param {Object} data - 待办事项数据
   * @returns {Promise<Object>} 创建结果
   */
  async createTodo(data) {
    try {
      console.log('【调用】创建待办事项，数据:', data)

      const response = await request.post('/api/todo/create', data)

      console.log('【响应】创建待办事项结果:', response)

      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '创建待办失败')
      }
    } catch (error) {
      console.error('【错误】创建待办事项失败:', error)
      throw error
    }
  }

  /**
   * 根据条件查询待办事项
   * @param {Object} params - 查询条件
   * @returns {Promise<Object>} 查询结果
   */
  async queryTodos(params) {
    try {
      console.log('【调用】查询待办事项，参数:', params)

      const response = await request.post('/api/todo/query', params)

      console.log('【响应】查询待办事项结果:', response)
      return response
    } catch (error) {
      console.error('【错误】查询待办事项失败:', error)
      throw error
    }
  }

  /**
   * 更新待办事项状态
   * @param {String} id - 待办事项ID
   * @param {Number} status - 新状态：0-待处理，1-处理中，2-已完成，-1-已取消
   * @param {String} remarks - 备注信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateTodoStatus(id, status, remarks = '') {
    try {
      console.log('【调用】更新待办状态，ID:', id, '状态:', status)

      const queryParams = new URLSearchParams({
        status,
        ...(remarks && { remarks })
      })

      const response = await request.put(`/api/todo/${id}/status?${queryParams}`)

      console.log('【响应】更新待办状态结果:', response)

      if (response.success) {
        ElMessage.success(response.message || '更新状态成功')
        return response.data
      } else {
        throw new Error(response.message || '更新状态失败')
      }
    } catch (error) {
      console.error('【错误】更新待办状态失败:', error)
      throw error
    }
  }

  /**
   * 根据业务ID查询待办事项
   * @param {String} businessId - 业务ID
   * @returns {Promise<Array>} 待办列表
   */
  async getTodosByBusinessId(businessId) {
    try {
      console.log('【调用】根据业务ID查询待办，businessId:', businessId)

      const response = await request.get(`/api/todo/business/${businessId}`)

      console.log('【响应】业务相关待办列表:', response)
      return response.data || []
    } catch (error) {
      console.error('【错误】查询业务相关待办失败:', error)
      throw error
    }
  }

  /**
   * 批量更新待办事项状态
   * @param {Array<String>} ids - 待办事项ID列表
   * @param {Number} status - 新状态
   * @param {String} remarks - 备注信息
   * @returns {Promise<Object>} 更新结果
   */
  async batchUpdateStatus(ids, status, remarks = '') {
    try {
      console.log('【调用】批量更新待办状态，IDs:', ids, '状态:', status)

      const queryParams = new URLSearchParams({
        ids: ids.join(','),
        status,
        ...(remarks && { remarks })
      })

      const response = await request.put(`/api/todo/batch/status?${queryParams}`)

      console.log('【响应】批量更新状态结果:', response)

      if (response.success) {
        ElMessage.success(response.message || `成功更新${ids.length}条待办`)
        return response.data
      } else {
        throw new Error(response.message || '批量更新失败')
      }
    } catch (error) {
      console.error('【错误】批量更新状态失败:', error)
      throw error
    }
  }

  /**
   * 获取待办事项统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getTodoStatistics() {
    try {
      console.log('【调用】获取待办统计信息')

      const response = await request.get('/api/todo/statistics')

      console.log('【响应】待办统计信息:', response)
      return response.data || {}
    } catch (error) {
      console.error('【错误】获取待办统计失败:', error)
      throw error
    }
  }

  /**
   * 根据任务ID获取待办统计信息
   * @param {String} taskId - 任务ID
   * @returns {Promise<Object>} 统计信息
   */
  async getTodoStatisticsByTaskId(taskId) {
    try {
      console.log('【调用】根据任务ID获取待办统计，taskId:', taskId)

      const response = await request.get(`/api/todo/statistics/task/${taskId}`)

      console.log('【响应】任务相关待办统计:', response)
      return response.data || {}
    } catch (error) {
      console.error('【错误】获取任务待办统计失败:', error)
      throw error
    }
  }

  /**
   * 获取待办类型描述
   * @param {String} todoType - 待办类型
   * @returns {String} 类型描述
   */
  getTodoTypeDescription(todoType) {
    const typeMap = {
      'TEMP_MATERIAL': '临时物资审批',
      'TEMP_PRICE': '临时价格审批',
      'Y_MATERIAL': '乙供物资审批'
    }
    return typeMap[todoType] || todoType
  }

  /**
   * 获取待办状态描述
   * @param {Number} status - 状态码
   * @returns {String} 状态描述
   */
  getTodoStatusDescription(status) {
    const statusMap = {
      0: '待处理',
      1: '处理中',
      2: '已完成',
      '-1': '已取消'
    }
    return statusMap[status] || '未知'
  }

  /**
   * 获取优先级描述
   * @param {Number} priority - 优先级
   * @returns {String} 优先级描述
   */
  getPriorityDescription(priority) {
    const priorityMap = {
      1: '最低',
      2: '低',
      3: '普通',
      4: '高',
      5: '最高'
    }
    return priorityMap[priority] || '普通'
  }

  /**
   * 根据待办类型获取对应的路由路径
   * @param {Object} todo - 待办事项对象
   * @returns {String|null} 路由路径
   */
  getTodoRoute(todo) {
    // 根据待办类型返回对应的路由
    const routeMap = {
      'Y_MATERIAL': `/supplier-material-approval/${todo.taskId}`, // 乙供物资审批管理页
      'TEMP_MATERIAL': `/temporary-data-management`, // 临时数据管理页面
      'TEMP_PRICE': `/temporary-data-management` // 临时数据管理页面
    }

    // 如果有taskId，使用带taskId的路由
    if (todo.taskId && routeMap[todo.todoType]) {
      return routeMap[todo.todoType]
    }

    // 如果没有taskId，返回列表页路由
    const fallbackRouteMap = {
      'Y_MATERIAL': '/temporary-data-management', // 临时数据管理页面作为备选
      'TEMP_MATERIAL': '/temporary-data-management',
      'TEMP_PRICE': '/temporary-data-management'
    }

    return fallbackRouteMap[todo.todoType] || null
  }
}

// 创建单例实例
const todoService = new TodoService()

export default todoService