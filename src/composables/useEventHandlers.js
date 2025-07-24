import { ElMessage } from 'element-plus'
import { useParsingResultStore } from '@/stores/parsingResult'
import { useMaterialDialogStore } from '@/stores/materialDialog'

/**
 * 事件处理器组合式函数
 * 提取HomeView中的事件处理逻辑，使其可复用
 */
export function useEventHandlers() {
  const parsingResultStore = useParsingResultStore()
  const materialDialogStore = useMaterialDialogStore()

  /**
   * 处理查看结果详情
   * @param {string} taskIdFromMessage - 消息中的任务ID
   */
  const handleViewResultDetail = async (taskIdFromMessage) => {
    await parsingResultStore.handleViewResultDetail(taskIdFromMessage)
  }

  /**
   * 处理查看乙供物资结果详情
   * @param {string} taskId - 任务ID
   */
  const handleViewMaterialResultDetail = (taskId) => {
    if (taskId) {
      materialDialogStore.ownerMaterialTaskParsingDetailTaskId = taskId
      materialDialogStore.showOwnerMaterialTaskParsingDetailDialog = true
    } else {
      ElMessage.warning('没有可供解析的乙供物资任务ID。')
    }
  }

  /**
   * 处理查看甲供物资结果详情
   * @param {string} taskId - 任务ID
   */
  const handleViewSupplierMaterialResultDetail = (taskId) => {
    if (taskId) {
      materialDialogStore.supplierMaterialTaskParsingDetailTaskId = taskId
      materialDialogStore.showSupplierMaterialTaskParsingDetailDialog = true
    } else {
      ElMessage.warning('没有可供解析的甲供物资任务ID。')
    }
  }

  /**
   * 处理乙供物资详情查看事件
   * @param {Object} row - 行数据
   */
  const handleViewOwnerMaterialDetail = (row) => {
    console.log(
      '【诊断】useEventHandlers - 接收到 OwnerMaterialTaskParsingDetailDialog 的 view-detail 事件:',
      row
    )
  }

  /**
   * 处理甲供物资详情查看事件
   * @param {Object} row - 行数据
   */
  const handleViewSupplierMaterialDetail = (row) => {
    console.log(
      '【诊断】useEventHandlers - 接收到 SupplierMaterialTaskParsingDetailDialog 的 view-detail 事件:',
      row
    )
  }

  return {
    handleViewResultDetail,
    handleViewMaterialResultDetail,
    handleViewSupplierMaterialResultDetail,
    handleViewOwnerMaterialDetail,
    handleViewSupplierMaterialDetail,
  }
}