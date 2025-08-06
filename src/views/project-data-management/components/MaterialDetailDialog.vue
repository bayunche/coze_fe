<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="90%"
    :before-close="handleClose"
    append-to-body
    class="material-detail-dialog"
  >
    <div class="dialog-content" v-loading="loading">
      <!-- 项目信息展示 -->
      <div v-if="projectData" class="project-info-section">
        <h3 class="section-title">项目信息</h3>
        <el-card class="project-card">
          <div class="project-info">
            <div class="info-item">
              <span class="info-label">项目编号：</span>
              <span class="info-value">{{ projectData.projectCode }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">项目名称：</span>
              <span class="info-value">{{ projectData.projectName }}</span>
            </div>
            <div class="info-item" v-if="projectData.contractCode">
              <span class="info-label">合同编号：</span>
              <span class="info-value">{{ projectData.contractCode }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 物资详情表格 -->
      <div class="material-table-section">
        <h3 class="section-title">{{ materialTableTitle }}</h3>
        <DynamicTable
          :table-data="materialData"
          :dynamic-columns="currentColumns"
          :loading="materialLoading"
          :show-actions="false"
          :show-pagination="true"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total-count="totalCount"
          height="500px"
          @page-change="onPageChange"
          @page-size-change="onPageSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleExport" :loading="exportLoading">
          导出数据
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DynamicTable from './DynamicTable.vue'
import { generateDynamicColumns } from '../utils.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectData: {
    type: Object,
    default: null
  },
  materialType: {
    type: String,
    required: true,
    validator: (value) => ['owner', 'supplier'].includes(value)
  }
})

const emit = defineEmits(['update:modelValue'])

// 响应式数据
const loading = ref(false)
const materialLoading = ref(false)
const exportLoading = ref(false)
const materialData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 对话框标题
const dialogTitle = computed(() => {
  const typeMap = {
    owner: '甲供物资详情',
    supplier: '乙供物资详情'
  }
  return typeMap[props.materialType] || '物资详情'
})

// 物资表格标题
const materialTableTitle = computed(() => {
  const typeMap = {
    owner: '甲供物资清单',
    supplier: '乙供物资清单'
  }
  return typeMap[props.materialType] || '物资清单'
})

// 动态列配置
const currentColumns = computed(() => {
  const columnType =
    props.materialType === 'owner' ? 'ownerMaterialDetail' : 'supplierMaterialDetail'
  return generateDynamicColumns(columnType)
})

// 加载物资数据
const loadMaterialData = async (page = 1, size = 20) => {
  if (!props.projectData) return

  materialLoading.value = true
  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 根据物资类型生成不同的模拟数据
    if (props.materialType === 'owner') {
      materialData.value = generateOwnerMaterialData()
    } else {
      materialData.value = generateSupplierMaterialData()
    }

    totalCount.value = materialData.value.length
  } catch (error) {
    ElMessage.error('加载物资数据失败')
    console.error('Error loading material data:', error)
  } finally {
    materialLoading.value = false
  }
}

// 生成甲供物资模拟数据
const generateOwnerMaterialData = () => {
  return [
    {
      materialId: 'OM2024001',
      materialName: '高强度钢筋',
      specification: 'HRB400 φ32',
      unit: '吨',
      quantity: 500,
      unitPrice: 4500,
      totalPrice: 2250000,
      supplier: '钢铁集团有限公司',
      deliveryDate: '2024-03-15',
      materialStatus: '已拉平',
      remark: '按计划交付，质量符合要求'
    },
    {
      materialId: 'OM2024002',
      materialName: '混凝土预制板',
      specification: 'C30 200×50×10cm',
      unit: '块',
      quantity: 1000,
      unitPrice: 280,
      totalPrice: 280000,
      supplier: '预制构件有限公司',
      deliveryDate: '2024-04-20',
      materialStatus: '已拉平',
      remark: '预计按期到达现场'
    },
    {
      materialId: 'OM2024003',
      materialName: '防水材料',
      specification: 'SBS改性沥青防水卷材',
      unit: '平方米',
      quantity: 5000,
      unitPrice: 85,
      totalPrice: 425000,
      supplier: '防水材料有限公司',
      deliveryDate: '2024-05-10',
      materialStatus: '已拉平',
      remark: '等待供应商排产'
    }
  ]
}

// 生成乙供物资模拟数据
const generateSupplierMaterialData = () => {
  return [
    {
      materialId: 'SM2024001',
      materialName: '电缆线材',
      specification: 'YJV22-3×240+1×120',
      unit: '米',
      quantity: 2000,
      estimatedPrice: 120,
      actualPrice: 115,
      totalCost: 230000,
      contractor: '电力工程有限公司',
      completionRate: 75,

      remark: '按计划进行，预计本月底完成'
    },
    {
      materialId: 'SM2024002',
      materialName: '通风设备',
      specification: '轴流风机 φ800mm',
      unit: '台',
      quantity: 12,
      estimatedPrice: 8500,
      actualPrice: 8200,
      totalCost: 98400,
      contractor: '通风工程有限公司',
      completionRate: 85,

      remark: '已验收合格'
    },
    {
      materialId: 'SM2024003',
      materialName: '电梯设备',
      specification: '客梯 1600kg 1.75m/s',
      unit: '部',
      quantity: 8,
      estimatedPrice: 350000,
      actualPrice: 340000,
      totalCost: 2720000,
      contractor: '电梯安装有限公司',
      completionRate: 60,

      remark: '设备已到场，正在安装调试'
    }
  ]
}

// 分页处理
const onPageChange = (page) => {
  currentPage.value = page
  loadMaterialData(page, pageSize.value)
}

const onPageSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadMaterialData(1, size)
}

// 导出数据
const handleExport = async () => {
  exportLoading.value = true
  try {
    // 模拟导出
    await new Promise((resolve) => setTimeout(resolve, 1000))
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible && props.projectData) {
    currentPage.value = 1
    loadMaterialData(1, pageSize.value)
  }
})
</script>

<style scoped>
.material-detail-dialog {
  /* 继承父级的设计变量 */
  --primary-color: #4f46e5;
  --accent-color: #3730a3;
  --success-color: #0d9488;
  --warning-color: #dc6803;
  --card-background: #ffffff;
  --border-color: rgba(79, 70, 229, 0.08);
  --text-dark: #1e293b;
  --text-light: #64748b;
  --shadow-color: rgba(79, 70, 229, 0.06);
  --background-light: #f8fafc;
}

.dialog-content {
  max-height: 80vh;
  overflow-y: auto;
}

.project-info-section {
  margin-bottom: 28px;
}

.material-table-section {
  margin-top: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0 0 16px 0;
  padding-left: 16px;
  position: relative;
  letter-spacing: 0.5px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 4px;
  background: var(--accent-color);
  border-radius: 2px;
  box-shadow: 0 0 4px var(--shadow-color);
}

.project-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.1);
  border-color: var(--accent-color);
}

.project-info {
  display: flex;
  gap: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--background-light);
  border-radius: 8px;
  border: 1px solid rgba(79, 70, 229, 0.05);
}

.info-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 600;
  letter-spacing: 0.3px;
  min-width: 80px;
}

.info-value {
  font-size: 15px;
  color: var(--text-dark);
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-dialog) {
  background: var(--card-background);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(79, 70, 229, 0.12);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  border-bottom: 1px solid var(--border-color);
  padding: 24px 30px;
  border-radius: 16px 16px 0 0;
}

:deep(.el-dialog__title) {
  color: var(--accent-color);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.5px;
}

:deep(.el-dialog__body) {
  background: var(--background-light);
  padding: 30px;
}

:deep(.el-dialog__footer) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.01), rgba(79, 70, 229, 0.005));
  border-top: 1px solid var(--border-color);
  padding: 20px 30px;
  border-radius: 0 0 16px 16px;
}

/* 卡片样式 */
:deep(.el-card) {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.04);
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
  border: none;
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: var(--background-light);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--border-color), rgba(79, 70, 229, 0.1));
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 2vh auto;
    border-radius: 12px;
  }

  .project-info {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .dialog-content {
    max-height: 75vh;
  }
}
</style>
