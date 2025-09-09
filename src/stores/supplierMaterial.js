import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 乙供物资Store - 管理乙供物资解析报告数据
 */
export const useSupplierMaterialStore = defineStore('supplierMaterial', () => {
  // 存储多个任务的报告数据映射 { taskId: { reportData, createdAt, updatedAt } }
  const reportDataMap = ref({})

  /**
   * 保存任务的报告数据
   * @param {string} taskId - 任务ID
   * @param {object} reportData - 报告数据（JSON格式）
   */
  const setReportData = (taskId, reportData) => {
    if (!taskId) {
      console.warn('【SupplierMaterialStore】taskId 不能为空')
      return
    }
    
    const now = new Date().toISOString()
    reportDataMap.value[taskId] = {
      reportData,
      createdAt: reportDataMap.value[taskId]?.createdAt || now,
      updatedAt: now
    }
    
    console.log(
      `【SupplierMaterialStore】报告数据已保存: TaskID=${taskId}`,
      reportData
    )
  }

  /**
   * 获取任务的报告数据
   * @param {string} taskId - 任务ID
   * @returns {object|null} 报告数据
   */
  const getReportData = (taskId) => {
    if (!taskId || !reportDataMap.value[taskId]) {
      return null
    }
    return reportDataMap.value[taskId].reportData || null
  }

  /**
   * 检查任务是否存在报告数据
   * @param {string} taskId - 任务ID
   * @returns {boolean} 是否存在报告数据
   */
  const hasReportData = (taskId) => {
    return !!(taskId && reportDataMap.value[taskId]?.reportData)
  }

  /**
   * 删除任务的报告数据
   * @param {string} taskId - 任务ID
   */
  const removeReportData = (taskId) => {
    if (!taskId) {
      console.warn('【SupplierMaterialStore】taskId 不能为空')
      return
    }
    
    if (reportDataMap.value[taskId]) {
      delete reportDataMap.value[taskId]
      console.log(`【SupplierMaterialStore】报告数据已删除: TaskID=${taskId}`)
    }
  }

  /**
   * 清空所有报告数据
   */
  const clearAllReportData = () => {
    reportDataMap.value = {}
    console.log('【SupplierMaterialStore】所有报告数据已清空')
  }

  /**
   * 获取所有报告数据
   * @returns {Array} 所有报告数据列表
   */
  const getAllReportData = () => {
    return Object.entries(reportDataMap.value).map(([taskId, data]) => ({
      taskId,
      ...data
    }))
  }

  return {
    // 状态
    reportDataMap,
    
    // 操作方法
    setReportData,
    getReportData,
    hasReportData,
    removeReportData,
    clearAllReportData,
    getAllReportData
  }
}, {
  // 开启持久化存储
  persist: {
    key: 'supplier-material-store',
    storage: localStorage,
    paths: ['reportDataMap'] // 只持久化报告数据映射
  }
})