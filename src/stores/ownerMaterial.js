import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 甲供物资对平任务状态枚举
 */
export const TaskStatus = {
  IDLE: 'idle',
  NEEDS_MANUAL_ALIGNMENT: 'needs_manual_alignment', 
  READY_FOR_ALIGNMENT: 'ready_for_alignment',
  ALIGNING: 'aligning',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const useOwnerMaterialStore = defineStore('ownerMaterial', () => {
  // 存储多个任务的状态映射 { taskId: { status, createdAt, updatedAt } }
  const taskStatusMap = ref({})
  
  // 当前活跃的任务ID（用于兼容旧的单任务逻辑）
  const currentTaskId = ref(null)

  /**
   * 获取当前活跃任务的信息
   */
  const currentTask = computed(() => {
    if (!currentTaskId.value) {
      return { taskId: null, status: TaskStatus.IDLE }
    }
    
    const taskInfo = taskStatusMap.value[currentTaskId.value]
    return {
      taskId: currentTaskId.value,
      status: taskInfo ? taskInfo.status : TaskStatus.IDLE
    }
  })

  /**
   * 设置一个新的对平任务
   * @param {string} taskId - 任务ID
   * @param {string} status - 可选的初始状态，默认为 needs_manual_alignment
   */
  const setTask = (taskId, status = TaskStatus.NEEDS_MANUAL_ALIGNMENT) => {
    if (!taskId) {
      console.warn('【OwnerMaterialStore】taskId 不能为空')
      return
    }
    
    const now = new Date().toISOString()
    
    // 更新或创建任务状态
    taskStatusMap.value[taskId] = {
      status: status,
      createdAt: taskStatusMap.value[taskId]?.createdAt || now,
      updatedAt: now
    }
    
    // 设置为当前活跃任务
    currentTaskId.value = taskId
    
    console.log(
      `【OwnerMaterialStore】任务设置: TaskID=${taskId}, 状态=${status}`
    )
  }

  /**
   * 更新指定任务的状态
   * @param {string} taskId - 任务ID
   * @param {string} newStatus - 新状态
   */
  const updateTaskStatus = (taskId, newStatus) => {
    if (!taskId) {
      console.warn('【OwnerMaterialStore】taskId 不能为空')
      return
    }
    
    if (!taskStatusMap.value[taskId]) {
      console.warn(`【OwnerMaterialStore】任务 ${taskId} 不存在`)
      return
    }
    
    taskStatusMap.value[taskId].status = newStatus
    taskStatusMap.value[taskId].updatedAt = new Date().toISOString()
    
    console.log(
      `【OwnerMaterialStore】任务状态更新: TaskID=${taskId}, 状态=${newStatus}`
    )
  }

  /**
   * 获取指定任务的状态
   * @param {string} taskId - 任务ID
   * @returns {string} 任务状态
   */
  const getTaskStatus = (taskId) => {
    if (!taskId || !taskStatusMap.value[taskId]) {
      return TaskStatus.IDLE
    }
    return taskStatusMap.value[taskId].status
  }

  /**
   * 获取指定任务的完整信息
   * @param {string} taskId - 任务ID
   * @returns {object|null} 任务信息
   */
  const getTaskInfo = (taskId) => {
    if (!taskId || !taskStatusMap.value[taskId]) {
      return null
    }
    return {
      taskId,
      ...taskStatusMap.value[taskId]
    }
  }

  /**
   * 删除指定任务
   * @param {string} taskId - 任务ID
   */
  const removeTask = (taskId) => {
    if (!taskId) {
      console.warn('【OwnerMaterialStore】taskId 不能为空')
      return
    }
    
    delete taskStatusMap.value[taskId]
    
    // 如果删除的是当前活跃任务，清除当前任务ID
    if (currentTaskId.value === taskId) {
      currentTaskId.value = null
    }
    
    console.log(`【OwnerMaterialStore】任务已删除: TaskID=${taskId}`)
  }

  /**
   * 设置当前活跃任务ID
   * @param {string} taskId - 任务ID
   */
  const setCurrentTask = (taskId) => {
    if (taskId && taskStatusMap.value[taskId]) {
      currentTaskId.value = taskId
      console.log(`【OwnerMaterialStore】当前任务设置为: ${taskId}`)
    } else {
      console.warn(`【OwnerMaterialStore】任务 ${taskId} 不存在，无法设置为当前任务`)
    }
  }

  /**
   * 清空所有任务
   */
  const clearAllTasks = () => {
    taskStatusMap.value = {}
    currentTaskId.value = null
    console.log('【OwnerMaterialStore】所有任务已清空')
  }

  /**
   * 获取所有任务列表
   * @returns {Array} 任务列表
   */
  const getAllTasks = () => {
    return Object.keys(taskStatusMap.value).map(taskId => ({
      taskId,
      ...taskStatusMap.value[taskId]
    }))
  }

  return {
    // 状态
    taskStatusMap,
    currentTaskId,
    currentTask,
    
    // 基于taskId的方法
    setTask,
    updateTaskStatus,
    getTaskStatus,
    getTaskInfo,
    removeTask,
    setCurrentTask,
    clearAllTasks,
    getAllTasks
  }
}, {
  // 开启持久化存储
  persist: {
    key: 'owner-material-store',
    storage: localStorage,
    // 只持久化任务状态映射和当前任务ID
    paths: ['taskStatusMap', 'currentTaskId']
  }
})
