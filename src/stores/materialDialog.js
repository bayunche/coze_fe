import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

/**
 * @typedef {Object} MaterialTask
 * @property {string} id - 任务ID
 * @property {string} name - 任务名称
 * // ... 其他可能的任务属性
 */

export const useMaterialDialogStore = defineStore('materialDialog', () => {
  /** @type {import('vue').Ref<boolean>} */
  const showMaterialDetailDialog = ref(false);
  /** @type {import('vue').Ref<string | null>} */
  const materialDetailDialogTaskId = ref(null);
  /** @type {import('vue').Ref<string | null>} */
  const materialDetailDialogDetailId = ref(null);

  /** @type {import('vue').Ref<boolean>} */
  const supplierMaterialDialogVisible = ref(false);
  /** @type {import('vue').Ref<MaterialTask | null>} */
  const supplierMaterialDialogTask = ref(null);
  /** @type {import('vue').Ref<string | null>} */
  const supplierFileId = ref(null); // 新增乙供物资文件ID
  /** @type {import('vue').Ref<string[]>} */
  const supplierFileDetailIds = ref([]); // 新增乙供物资详情ID列表

  /** @type {import('vue').Ref<boolean>} */
  const showMaterialParsingResultDialog = ref(false);
  /** @type {import('vue').Ref<MaterialTask | null>} */
  const materialParsingResultTask = ref(null);

  /** @type {import('vue').Ref<boolean>} */
  const showOwnerMaterialTaskParsingDetailDialog = ref(false);
  /** @type {import('vue').Ref<string | null>} */
  const ownerMaterialTaskParsingDetailTaskId = ref(null);

  // Actions
  /**
   * 处理查看乙供物资解析结果详情的逻辑。
   * @param {string | {id: string}} message - 任务ID或包含任务ID的对象。
   */
  const handleViewMaterialResultDetail = (message) => {
    const taskIdToUse =
      typeof message === 'object' && message !== null && message.id ? message.id : message;
    if (!taskIdToUse) {
      ElMessage.warning('没有可供解析的乙供物资任务ID。');
      return;
    }
    try {
      ownerMaterialTaskParsingDetailTaskId.value = taskIdToUse;
      showOwnerMaterialTaskParsingDetailDialog.value = true;
      console.log('【诊断】HomeView - 触发显示乙供物资任务解析详情弹窗，任务ID:', taskIdToUse);
    } catch (error) {
      console.error('显示乙供物资任务解析详情弹窗失败:', error);
      ElMessage.error(`显示乙供物资任务解析详情弹窗失败: ${error.message}`);
    }
  };

  /**
   * 处理查看甲供物资详情的逻辑。
   * @param {Object} payload - 包含 detailId 和 taskId 的对象。
   * @param {string} payload.detailId - 详情ID。
   * @param {string} payload.taskId - 任务ID。
   */
  const handleViewOwnerMaterialDetail = ({ detailId, taskId }) => {
    console.log('【诊断】HomeView - 接收到 view-detail 事件，detailId:', detailId, 'taskId:', taskId);
    materialDetailDialogTaskId.value = taskId;
    materialDetailDialogDetailId.value = detailId;
    showMaterialDetailDialog.value = true;
  };

  return {
    showMaterialDetailDialog,
    materialDetailDialogTaskId,
    materialDetailDialogDetailId,
    supplierMaterialDialogVisible,
    supplierMaterialDialogTask,
    showMaterialParsingResultDialog,
    materialParsingResultTask,
    showOwnerMaterialTaskParsingDetailDialog,
    ownerMaterialTaskParsingDetailTaskId,
    handleViewMaterialResultDetail,
    handleViewOwnerMaterialDetail,
  };
});