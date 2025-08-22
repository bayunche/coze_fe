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
   * @param {Object|string} messageOrTaskId - 消息对象或任务ID字符串
   */
  const viewResultDetail = async (messageOrTaskId) => {
    console.log('【调试】viewResultDetail - 接收到参数:', messageOrTaskId)
    console.log('【调试】参数类型:', typeof messageOrTaskId)
    
    let message = null
    let taskId = null
    
    // 判断传入的是消息对象还是任务ID字符串
    if (typeof messageOrTaskId === 'string') {
      // 如果是字符串，说明是直接传入的任务ID（兼容旧版本调用）
      taskId = messageOrTaskId
      console.log('【调试】检测到字符串参数，作为任务ID处理:', taskId)
      message = { task: taskId } // 创建一个简单的消息对象
    } else if (typeof messageOrTaskId === 'object' && messageOrTaskId !== null) {
      // 如果是对象，说明是消息对象
      message = messageOrTaskId
      taskId = message.task || message.taskId || message.id
      console.log('【调试】检测到消息对象，提取任务ID:', taskId)
      console.log('【调试】消息对象的详细结构:', {
        id: message.id,
        task: message.task,
        taskId: message.taskId,
        workflow: message.workflow,
        sender: message.sender,
        所有属性: Object.keys(message)
      })
    } else {
      console.error('【调试】无效的参数类型:', typeof messageOrTaskId, messageOrTaskId)
      ElMessage.warning('参数类型错误，无法查看结果详情')
      return
    }
    
    if (!taskId) {
      console.error('【调试】未找到任务ID，原始参数:', messageOrTaskId)
      ElMessage.warning('没有找到任务ID，无法查看结果详情')
      return
    }
    
    // 检查是否为合同解析工作流（根据工作流名称和发送者判断）
    let isContractParsing = message.workflow?.name?.includes('合同解析') ||
                           message.sender?.includes('合同解析')
    
    // 如果从消息对象无法判断，尝试通过调用合同解析接口来验证
    if (!isContractParsing && typeof messageOrTaskId === 'string') {
      console.log('【调试】无法从消息判断工作流类型，尝试调用合同解析接口验证')
      try {
        // 尝试调用合同解析接口，如果成功说明是合同解析任务
        await parsingResultStore.viewResultDetail({
          isSupplierMaterial: false,
          specificTaskId: taskId
        })
        console.log('【调试】合同解析接口调用成功，确认为合同解析任务')
        return // 成功调用后直接返回
      } catch (error) {
        console.log('【调试】合同解析接口调用失败，可能不是合同解析任务，尝试其他方式:', error.message)
        // 如果合同解析接口调用失败，说明可能不是合同解析任务，继续其他处理
        isContractParsing = false
      }
    }
    
    console.log('【调试】最终判断 - 是否为合同解析工作流:', isContractParsing)
    
    if (isContractParsing) {
      console.log('【调试】确认为合同解析工作流，直接弹出结果详情弹窗')
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