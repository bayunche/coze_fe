<template>
  <el-dialog
    v-model="dialogVisible"
    title="项目数据关联"
    width="80%"
    :before-close="handleClose"
    append-to-body
    class="project-link-dialog"
  >
    <div class="dialog-content" v-loading="loading">
      <!-- 合同信息展示（已选择的合同） -->
      <div v-if="contractData" class="contract-info-section">
        <h3 class="section-title">合同信息</h3>
        <el-card class="contract-card">
          <div class="contract-info">
            <div class="info-item">
              <span class="info-label">合同ID：</span>
              <span class="info-value">{{ contractData.contractId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">合同名称：</span>
              <span class="info-value">{{ contractData.contractName }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 两个数据选择区域 -->
      <div class="link-sections">

        <!-- 甲供数据选择 -->
        <div class="link-section">
          <h4 class="subsection-title">
            📦 选择甲供数据
            <el-button 
              type="text" 
              size="small" 
              @click="refreshOwnerMaterialData"
              :loading="ownerMaterialLoading"
            >
              刷新
            </el-button>
          </h4>
          <div class="selection-area">
            <!-- 搜索框 -->
            <el-input
              v-model="ownerMaterialSearchKeyword"
              placeholder="搜索物资名称或ID..."
              clearable
              style="margin-bottom: 12px"
              @input="onOwnerMaterialSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <!-- 甲供数据表格 -->
            <el-table
              :data="ownerMaterialTableData"
              v-loading="ownerMaterialLoading"
              @selection-change="onOwnerMaterialSelectionChange"
              height="200px"
              size="small"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="materialId" label="物资ID" width="120" />
              <el-table-column prop="materialName" label="物资名称" min-width="150" />
              <el-table-column prop="specification" label="规格" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="totalPrice" label="总价" width="120">
                <template #default="{ row }">
                  {{ formatCurrency(row.totalPrice) }}
                </template>
              </el-table-column>
            </el-table>

            <div class="selected-info" v-if="selectedOwnerMaterials.length > 0">
              <span class="selected-label">已选择 {{ selectedOwnerMaterials.length }} 项：</span>
              <div class="selected-tags">
                <el-tag 
                  v-for="item in selectedOwnerMaterials" 
                  :key="item.materialId"
                  type="success" 
                  size="small"
                  closable 
                  @close="removeOwnerMaterial(item)"
                  style="margin: 2px"
                >
                  {{ item.materialName }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 乙供数据选择 -->
        <div class="link-section">
          <h4 class="subsection-title">
            🏗️ 选择乙供数据
            <el-button 
              type="text" 
              size="small" 
              @click="refreshSupplierMaterialData"
              :loading="supplierMaterialLoading"
            >
              刷新
            </el-button>
          </h4>
          <div class="selection-area">
            <!-- 搜索框 -->
            <el-input
              v-model="supplierMaterialSearchKeyword"
              placeholder="搜索物资名称或ID..."
              clearable
              style="margin-bottom: 12px"
              @input="onSupplierMaterialSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <!-- 乙供数据表格 -->
            <el-table
              :data="supplierMaterialTableData"
              v-loading="supplierMaterialLoading"
              @selection-change="onSupplierMaterialSelectionChange"
              height="200px"
              size="small"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="materialId" label="物资ID" width="120" />
              <el-table-column prop="materialName" label="物资名称" min-width="150" />
              <el-table-column prop="specification" label="规格" min-width="120" />
              <el-table-column prop="quantity" label="数量" width="80" />
              <el-table-column prop="totalCost" label="总成本" width="120">
                <template #default="{ row }">
                  {{ formatCurrency(row.totalCost) }}
                </template>
              </el-table-column>
            </el-table>

            <div class="selected-info" v-if="selectedSupplierMaterials.length > 0">
              <span class="selected-label">已选择 {{ selectedSupplierMaterials.length }} 项：</span>
              <div class="selected-tags">
                <el-tag 
                  v-for="item in selectedSupplierMaterials" 
                  :key="item.materialId"
                  type="success" 
                  size="small"
                  closable 
                  @close="removeSupplierMaterial(item)"
                  style="margin: 2px"
                >
                  {{ item.materialName }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="!hasSelections"
          :loading="confirmLoading"
        >
          确认关联
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMockData, filterData } from '../utils.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  contractData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式数据
const loading = ref(false)
const confirmLoading = ref(false)

// 搜索关键词
const ownerMaterialSearchKeyword = ref('')
const supplierMaterialSearchKeyword = ref('')

// 加载状态
const ownerMaterialLoading = ref(false)
const supplierMaterialLoading = ref(false)

// 原始数据
const ownerMaterialData = ref([])
const supplierMaterialData = ref([])

// 选中的数据
const selectedOwnerMaterials = ref([])
const selectedSupplierMaterials = ref([])

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})


// 过滤后的表格数据
const ownerMaterialTableData = computed(() => {
  return filterData(ownerMaterialData.value, ownerMaterialSearchKeyword.value)
})

const supplierMaterialTableData = computed(() => {
  return filterData(supplierMaterialData.value, supplierMaterialSearchKeyword.value)
})

// 是否有选择
const hasSelections = computed(() => {
  return selectedOwnerMaterials.value.length > 0 || 
         selectedSupplierMaterials.value.length > 0
})

// 方法定义
const formatCurrency = (amount) => {
  return amount ? `¥${amount.toLocaleString()}` : '-'
}

const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadOwnerMaterialData(),
      loadSupplierMaterialData()
    ])
  } finally {
    loading.value = false
  }
}

const loadOwnerMaterialData = async () => {
  ownerMaterialLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    ownerMaterialData.value = getMockData('ownerMaterial')
  } catch (error) {
    ElMessage.error('加载甲供数据失败')
  } finally {
    ownerMaterialLoading.value = false
  }
}

const loadSupplierMaterialData = async () => {
  supplierMaterialLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    supplierMaterialData.value = getMockData('supplierMaterial')
  } catch (error) {
    ElMessage.error('加载乙供数据失败')
  } finally {
    supplierMaterialLoading.value = false
  }
}

// 刷新数据方法
const refreshOwnerMaterialData = () => loadOwnerMaterialData()
const refreshSupplierMaterialData = () => loadSupplierMaterialData()

// 搜索事件处理
const onOwnerMaterialSearch = () => {
  // 搜索由计算属性自动处理
}

const onSupplierMaterialSearch = () => {
  // 搜索由计算属性自动处理
}

// 表格选择事件处理

const onOwnerMaterialSelectionChange = (selections) => {
  selectedOwnerMaterials.value = selections
}

const onSupplierMaterialSelectionChange = (selections) => {
  selectedSupplierMaterials.value = selections
}

// 移除选中项
const removeOwnerMaterial = (item) => {
  const index = selectedOwnerMaterials.value.findIndex(m => m.materialId === item.materialId)
  if (index > -1) {
    selectedOwnerMaterials.value.splice(index, 1)
  }
}

const removeSupplierMaterial = (item) => {
  const index = selectedSupplierMaterials.value.findIndex(m => m.materialId === item.materialId)
  if (index > -1) {
    selectedSupplierMaterials.value.splice(index, 1)
  }
}

// 重置选择
const resetSelections = () => {
  selectedOwnerMaterials.value = []
  selectedSupplierMaterials.value = []
}

// 事件处理
const handleClose = () => {
  resetSelections()
  dialogVisible.value = false
}

const handleConfirm = async () => {
  if (!hasSelections.value) {
    ElMessage.warning('请至少选择一项物资数据进行关联')
    return
  }

  confirmLoading.value = true
  
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const linkData = {
      contractId: props.contractData.contractId,
      contractName: props.contractData.contractName,
      ownerMaterials: selectedOwnerMaterials.value,
      supplierMaterials: selectedSupplierMaterials.value
    }
    
    emit('confirm', linkData)
    
    ElMessage.success('物资数据关联成功')
    resetSelections()
    
  } catch (error) {
    ElMessage.error('关联失败，请重试')
  } finally {
    confirmLoading.value = false
  }
}

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible && props.contractData) {
    loadAllData()
  }
})
</script>

<style scoped>
.project-link-dialog {
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
  max-height: 75vh;
  overflow-y: auto;
}

.contract-info-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 20px;
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
  height: 24px;
  width: 4px;
  background: var(--accent-color);
  border-radius: 2px;
  box-shadow: 0 0 4px var(--shadow-color);
}

.contract-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  transition: all 0.3s ease;
}

.contract-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.1);
  border-color: var(--accent-color);
}

.contract-info {
  display: flex;
  gap: 28px;
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
}

.info-value {
  font-size: 15px;
  color: var(--text-dark);
  font-weight: 500;
}

.link-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.link-section {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  background: var(--card-background);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.04);
  transition: all 0.3s ease;
}

.link-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.08);
}

.subsection-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0 0 16px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color);
}

.selection-area {
  background: var(--background-light);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(79, 70, 229, 0.05);
}

.selected-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.02));
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.selected-label {
  font-size: 14px;
  color: var(--text-light);
  margin-right: 8px;
  font-weight: 600;
}

.selected-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-dialog) {
  background: var(--theme-bg-card);
  border-radius: 16px;
  border: 1px solid var(--theme-border-light);
  box-shadow: var(--theme-shadow-heavy);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-primary-rgb), 0.02));
  border-bottom: 1px solid var(--theme-border-light);
  padding: 24px 30px;
  border-radius: 16px 16px 0 0;
}

:deep(.el-dialog__title) {
  color: var(--theme-primary);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.5px;
}

:deep(.el-dialog__body) {
  background: var(--theme-bg-secondary);
  padding: 30px;
}

:deep(.el-dialog__footer) {
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.02), rgba(var(--theme-primary-rgb), 0.01));
  border-top: 1px solid var(--theme-border-light);
  padding: 20px 30px;
  border-radius: 0 0 16px 16px;
}

/* 卡片样式 */
:deep(.el-card) {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-light);
  border-radius: 12px;
  box-shadow: var(--theme-shadow-light);
}

:deep(.el-card__body) {
  padding: 20px;
}

/* 表格样式 */
:deep(.el-table) {
  background: var(--theme-bg-card);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  border-color: var(--border-color);
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--border-color);
  color: var(--text-dark);
}

:deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 0 3px rgba(79, 70, 229, 0.03) inset;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--accent-color);
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.08);
}

:deep(.el-input__inner) {
  color: var(--text-dark);
  font-weight: 500;
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

:deep(.el-button--text) {
  color: var(--accent-color);
  font-weight: 600;
}

:deep(.el-button--text:hover) {
  background: rgba(79, 70, 229, 0.05);
  color: var(--accent-color);
}

/* 标签样式 */
:deep(.el-tag) {
  font-weight: 600;
  border-radius: 6px;
  padding: 4px 10px;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.el-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(13, 148, 136, 0.05));
  border-color: rgba(13, 148, 136, 0.2);
  color: var(--success-color);
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

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-radius: 12px 12px 0 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-radius: 0 0 12px 12px;
  }

  .contract-info {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .link-section {
    padding: 16px;
  }

  .subsection-title {
    font-size: 15px;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .selection-area {
    padding: 12px;
  }

  .dialog-content {
    max-height: 80vh;
  }
}

@media (max-width: 480px) {
  .link-section {
    padding: 12px;
  }

  .selection-area {
    padding: 10px;
  }

  .info-item {
    padding: 6px 12px;
  }

  .selected-info {
    padding: 10px 12px;
  }

  .contract-info {
    gap: 12px;
  }
}
</style>