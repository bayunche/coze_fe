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
   * @param {Object} message - 消息对象（包含任务ID和工作流信息）
   */
  const viewResultDetail = async (message) => {
    console.log('【调试】viewResultDetail - 接收到消息:', message)
    
    // 从消息中提取任务ID
    const taskId = message.task || message.taskId || message.id
    
    if (!taskId) {
      ElMessage.warning('没有找到任务ID，无法查看结果详情')
      return
    }
    
    // 检查是否为合同解析工作流（根据工作流名称和发送者判断）
    const isContractParsing = message.workflow?.name?.includes('合同解析') ||
                             message.sender?.includes('合同解析')
    
    if (isContractParsing) {
      console.log('【调试】检测到合同解析工作流，直接弹出结果详情弹窗')
      // 合同解析：直接弹出解析结果详情弹窗，使用 taskId 调用接口
      await parsingResultStore.viewResultDetail({
        isSupplierMaterial: false, // 合同解析，不是乙供物资
        specificTaskId: taskId
      })
    } else {
      console.log('【调试】非合同解析工作流，打开任务详情列表弹窗')
      // 其他工作流：打开任务详情列表弹窗
      await parsingResultStore.viewTaskDetail(taskId)
    }
  }

  /**
   * 处理查看乙供物资结果详情
   * @param {string} taskId - 任务ID
   */
  const viewMaterialResultDetail = (taskId) => {
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
  const viewSupplierMaterialResultDetail = (taskId) => {
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
  const viewOwnerMaterialDetail = (row) => {
    console.log(
      '【诊断】useEventHandlers - 接收到 OwnerMaterialTaskParsingDetailDialog 的 view-detail 事件:',
      row
    )
  }

  /**
   * 处理甲供物资详情查看事件
   * @param {Object} row - 行数据
   */
  const viewSupplierMaterialDetail = (row) => {
    console.log(
      '【诊断】useEventHandlers - 接收到 SupplierMaterialTaskParsingDetailDialog 的 view-detail 事件:',
      row
    )
  }

  // 为了兼容性，创建别名方法
  const onViewResultDetail = viewResultDetail
  const onViewMaterialResultDetail = viewMaterialResultDetail  
  const onViewSupplierMaterialResultDetail = viewSupplierMaterialResultDetail

  return {
    viewResultDetail,
    viewMaterialResultDetail,
    viewSupplierMaterialResultDetail,
    viewOwnerMaterialDetail,
    viewSupplierMaterialDetail,
    // 添加兼容性别名
    onViewResultDetail,
    onViewMaterialResultDetail,
    onViewSupplierMaterialResultDetail,
  }
}