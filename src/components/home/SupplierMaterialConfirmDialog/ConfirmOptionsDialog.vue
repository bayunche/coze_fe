<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择确认数据"
    width="70%"
    :before-close="handleClose"
    append-to-body
    custom-class="confirm-options-dialog"
  >
    <div class="options-content" v-loading="loading">
      <div class="material-info">
        <h4>当前物资信息：</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">物资名称：</span>
            <span class="value">{{ materialData?.materialName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">规格型号：</span>
            <span class="value">{{ materialData?.specification || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">单位：</span>
            <span class="value">{{ materialData?.unit || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">数量：</span>
            <span class="value">{{ formatNumber(materialData?.quantity) }}</span>
          </div>
        </div>
      </div>
      
      <el-divider />
      
      <div class="selection-section">
        <h4>请选择匹配的基础数据和价格数据：</h4>
        
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索物资名称、规格型号等..."
            @input="onSearchInput"
            @clear="handleSearch"
            clearable
            class="search-input"
          >
            <template #append>
              <el-button @click="handleSearch" :loading="searching">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        
        <el-form :model="confirmForm" label-width="120px" class="confirm-form">
          <el-form-item label="基础数据：" required>
            <el-table
              :data="baseDataOptions"
              style="width: 100%"
              height="200px"
              @row-click="selectBaseData"
              :row-class-name="getBaseDataRowClass"
              border
              size="small"
            >
              <el-table-column type="index" label="序号" width="50" />
              <el-table-column prop="materialBaseInfo.materialName" label="物资名称" min-width="120" show-overflow-tooltip />
              <el-table-column prop="materialBaseInfo.specificationModel" label="规格型号" min-width="120" show-overflow-tooltip />
              <el-table-column prop="materialBaseInfo.unit" label="单位" width="60" />
              <el-table-column prop="materialBaseInfo.materialCode" label="物资编码" width="100" show-overflow-tooltip />
              <el-table-column label="选择" width="60" align="center">
                <template #default="{ row }">
                  <el-radio 
                    :model-value="confirmForm.confirmBaseDataId" 
                    :label="row.materialBaseInfo.id"
                    @change="selectBaseData(row)"
                  >
                    <span></span>
                  </el-radio>
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
          
          <el-form-item label="价格数据：" required v-if="selectedBaseData">
            <el-table
              :data="selectedBaseData.priceList"
              style="width: 100%"
              height="150px"
              @row-click="selectPrice"
              :row-class-name="getPriceRowClass"
              border
              size="small"
            >
              <el-table-column type="index" label="序号" width="50" />
              <el-table-column prop="quarter" label="季度" width="100" />
              <el-table-column label="含税价" width="120">
                <template #default="{ row }">
                  <span class="price-value">¥{{ formatNumber(row.taxPrice) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="选择" width="60" align="center">
                <template #default="{ row }">
                  <el-radio 
                    :model-value="confirmForm.confirmPriceId" 
                    :label="row.id"
                    @change="selectPrice(row)"
                  >
                    <span></span>
                  </el-radio>
                </template>
              </el-table-column>
            </el-table>
          </el-form-item>
          
          <el-form-item v-if="!selectedBaseData && baseDataOptions.length === 0 && !searching">
            <el-alert
              title="未找到匹配的基础数据"
              description="请尝试调整搜索关键词或联系管理员添加对应的基础数据"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-form-item>
        </el-form>
        
        <el-pagination
          v-if="baseDataTotal > 0"
          background
          layout="total, prev, pager, next"
          :total="baseDataTotal"
          :page-size="baseDataPageSize"
          v-model:current-page="baseDataPage"
          @current-change="handleSearch"
          style="margin-top: 10px; text-align: center"
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          :loading="confirming"
          :disabled="!canConfirm"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { queryMaterialBaseInfoWithPrices } from '@/utils/backendWorkflow.js'

// Props定义
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  materialData: {
    type: Object,
    default: () => ({})
  }
})

// Emits定义
const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

// 响应式数据
const loading = ref(false)
const searching = ref(false)
const confirming = ref(false)
const searchKeyword = ref('')
const baseDataOptions = ref([])
const selectedBaseData = ref(null)
const selectedPrice = ref(null)
const baseDataPage = ref(1)
const baseDataPageSize = ref(5)
const baseDataTotal = ref(0)

// 确认表单数据
const confirmForm = ref({
  confirmBaseDataId: '',
  confirmPriceId: ''
})

// 计算属性 - 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 是否可以确认
const canConfirm = computed(() => {
  return confirmForm.value.confirmBaseDataId && confirmForm.value.confirmPriceId
})

// 搜索输入防抖
let searchTimeout = null
const onSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
}

// 搜索基础数据
const handleSearch = async () => {
  searching.value = true
  try {
    const response = await queryMaterialBaseInfoWithPrices({
      keyword: searchKeyword.value,
      page: baseDataPage.value - 1,
      size: baseDataPageSize.value
    })
    
    if (response && response.content) {
      baseDataOptions.value = response.content
      baseDataTotal.value = response.totalElements || 0
    } else {
      baseDataOptions.value = []
      baseDataTotal.value = 0
    }
  } catch (error) {
    console.error('搜索基础数据失败:', error)
    ElMessage.error('搜索失败，请重试')
    baseDataOptions.value = []
    baseDataTotal.value = 0
  } finally {
    searching.value = false
  }
}

// 选择基础数据
const selectBaseData = (row) => {
  selectedBaseData.value = row
  confirmForm.value.confirmBaseDataId = row.materialBaseInfo.id
  // 清空价格选择
  confirmForm.value.confirmPriceId = ''
  selectedPrice.value = null
}

// 选择价格数据
const selectPrice = (row) => {
  selectedPrice.value = row
  confirmForm.value.confirmPriceId = row.id
}

// 获取基础数据行样式
const getBaseDataRowClass = ({ row }) => {
  return confirmForm.value.confirmBaseDataId === row.materialBaseInfo.id ? 'selected-row' : ''
}

// 获取价格数据行样式
const getPriceRowClass = ({ row }) => {
  return confirmForm.value.confirmPriceId === row.id ? 'selected-row' : ''
}

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
}

// 确认选择
const handleConfirm = async () => {
  if (!canConfirm.value) {
    ElMessage.warning('请先选择基础数据和价格数据')
    return
  }
  
  confirming.value = true
  try {
    const confirmData = {
      materialId: props.materialData.id,
      confirmBaseDataId: confirmForm.value.confirmBaseDataId,
      confirmPriceId: confirmForm.value.confirmPriceId,
      selectedBaseName: selectedBaseData.value.materialBaseInfo.materialName,
      selectedBaseSpec: selectedBaseData.value.materialBaseInfo.specificationModel,
      selectedPrice: selectedPrice.value.taxPrice,
      selectedPriceQuarter: selectedPrice.value.quarter
    }
    
    emit('confirm', confirmData)
  } finally {
    confirming.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 重置数据
const resetData = () => {
  searchKeyword.value = ''
  baseDataOptions.value = []
  selectedBaseData.value = null
  selectedPrice.value = null
  baseDataPage.value = 1
  baseDataTotal.value = 0
  confirmForm.value = {
    confirmBaseDataId: '',
    confirmPriceId: ''
  }
}

// 监听对话框显示状态
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetData()
    // 延迟执行搜索，确保对话框完全显示
    nextTick(() => {
      // 基于当前物资信息进行初始搜索
      if (props.materialData?.materialName) {
        searchKeyword.value = props.materialData.materialName
        handleSearch()
      }
    })
  }
})
</script>

<style scoped>
:deep(.confirm-options-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
}

:deep(.confirm-options-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.confirm-options-dialog .el-dialog__body) {
  padding: 20px;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.options-content {
  width: 100%;
}

.material-info {
  margin-bottom: 20px;
}

.material-info h4 {
  color: var(--theme-text-primary);
  margin: 0 0 12px 0;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: var(--theme-text-secondary);
  min-width: 80px;
}

.info-item .value {
  color: var(--theme-text-primary);
  font-weight: 500;
}

.selection-section h4 {
  color: var(--theme-text-primary);
  margin: 0 0 16px 0;
  font-size: 16px;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.confirm-form {
  margin-top: 16px;
}

.price-value {
  font-weight: 500;
  color: var(--theme-success);
}

/* 表格选中行样式 */
:deep(.selected-row) {
  background-color: var(--theme-primary-light) !important;
}

:deep(.selected-row:hover) {
  background-color: var(--theme-primary-light) !important;
}

/* 表格样式 */
:deep(.el-table) {
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border);
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

/* 单选按钮样式 */
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: var(--theme-primary);
  border-color: var(--theme-primary);
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--theme-primary);
}

/* 表单样式 */
:deep(.el-form-item__label) {
  color: var(--theme-text-primary) !important;
}
</style>