import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * @typedef {Object} MaterialTask
 * @property {string} id - 任务ID
 * @property {string} name - 任务名称
 * // ... 其他可能的任务属性
 */

export const useMaterialDialogStore = defineStore('materialDialog', () => {
  /** @type {import('vue').Ref<boolean>} */
  const supplierMaterialDialogVisible = ref(false)
  /** @type {import('vue').Ref<MaterialTask | null>} */
  const supplierMaterialDialogTask = ref(null)
  /** @type {import('vue').Ref<string | null>} */
  const supplierFileId = ref(null) // 新增乙供物资文件ID
  /** @type {import('vue').Ref<string[]>} */
  const supplierFileDetailIds = ref([]) // 新增乙供物资详情ID列表

  /** @type {import('vue').Ref<boolean>} */
  const showMaterialParsingResultDialog = ref(false)
  /** @type {import('vue').Ref<MaterialTask | null>} */
  const materialParsingResultTask = ref(null)

  /** @type {import('vue').Ref<boolean>} */
  const showOwnerMaterialTaskParsingDetailDialog = ref(false)
  /** @type {import('vue').Ref<string | null>} */
  const ownerMaterialTaskParsingDetailTaskId = ref(null)

  /** @type {import('vue').Ref<boolean>} */
  const showSupplierMaterialTaskParsingDetailDialog = ref(false)
  /** @type {import('vue').Ref<string | null>} */
  const supplierMaterialTaskParsingDetailTaskId = ref(null)

  // Actions
  /**
   * 处理查看乙供物资解析结果详情的逻辑。
   * @param {string | {id: string}} message - 任务ID或包含任务ID的对象。
   */
  const handleViewMaterialResultDetail = (message) => {
    const taskIdToUse =
      typeof message === 'object' && message !== null && message.id ? message.id : message
    if (!taskIdToUse) {
      ElMessage.warning('没有可供解析的乙供物资任务ID。')
      return
    }
    try {
      materialParsingResultTask.value = { id: taskIdToUse }
      showMaterialParsingResultDialog.value = true
      console.log(
        '【诊断】materialDialogStore - handleViewMaterialResultDetail 接收到任务ID:',
        taskIdToUse
      )
      console.log(
        '【诊断】materialDialogStore - showMaterialParsingResultDialog 设置为:',
        showMaterialParsingResultDialog.value
      )
    } catch (error) {
      console.error('显示乙供物资解析结果弹窗失败:', error)
      ElMessage.error(`显示乙供物资解析结果弹窗失败: ${error.message}`)
    }
  }

  return {
    supplierMaterialDialogVisible,
    supplierMaterialDialogTask,
    supplierFileId,
    supplierFileDetailIds,
    showMaterialParsingResultDialog,
    materialParsingResultTask,
    showOwnerMaterialTaskParsingDetailDialog,
    ownerMaterialTaskParsingDetailTaskId,
    showSupplierMaterialTaskParsingDetailDialog,
    supplierMaterialTaskParsingDetailTaskId,
    handleViewMaterialResultDetail
  }
})
