import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useOwnerMaterialStore = defineStore('ownerMaterial', () => {
  // 甲供物资对平任务的状态
  const alignmentTask = reactive({
    taskId: null,
    /**
     * 对平状态:
     * - idle: 空闲状态
     * - needs_manual_alignment: 解析完成，需要人工介入
     * - ready_for_alignment: 人工确认完成，准备进行最终对平
     * - aligning: 正在对平
     * - completed: 对平完成
     * - failed: 对平失败
     */
    status: 'idle'
  })

  /**
   * 设置一个新的对平任务
   * @param {string} newTaskId - 从解析工作流获取的任务ID
   */
  const setTask = (newTaskId) => {
    if (newTaskId) {
      alignmentTask.taskId = newTaskId
      alignmentTask.status = 'needs_manual_alignment'
      console.log(
        `【OwnerMaterialStore】新任务设置: TaskID=${alignmentTask.taskId}, 状态=${alignmentTask.status}`
      )
    }
  }

  /**
   * 标记任务已准备好进行最终的自动对平
   */
  const markAsReadyForAlignment = () => {
    if (alignmentTask.taskId && alignmentTask.status === 'needs_manual_alignment') {
      alignmentTask.status = 'ready_for_alignment'
      console.log(
        `【OwnerMaterialStore】任务准备对平: TaskID=${alignmentTask.taskId}, 状态=${alignmentTask.status}`
      )
    }
  }

  /**
   * 更新任务状态
   * @param {'aligning' | 'completed' | 'failed'} newStatus - 新的状态
   */
  const updateStatus = (newStatus) => {
    alignmentTask.status = newStatus
    console.log(
      `【OwnerMaterialStore】任务状态更新: TaskID=${alignmentTask.taskId}, 状态=${alignmentTask.status}`
    )
  }

  /**
   * 重置状态，完成一个完整的流程
   */
  const resetTask = () => {
    alignmentTask.taskId = null
    alignmentTask.status = 'idle'
    console.log('【OwnerMaterialStore】任务已重置')
  }

  return {
    alignmentTask,
    setTask,
    markAsReadyForAlignment,
    updateStatus,
    resetTask
  }
})
