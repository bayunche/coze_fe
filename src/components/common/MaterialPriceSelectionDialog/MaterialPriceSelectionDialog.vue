<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择物资和价格"
    width="90%"
    :before-close="closeDialog"
    append-to-body
    custom-class="material-price-selection-dialog"
    top="3vh"
  >
    <div class="selection-content">
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" type="card" class="selection-tabs">
        <!-- 推荐选择标签页 -->
        <el-tab-pane label="推荐选择" name="recommend" v-if="hasRecommendations">
          <div class="recommend-section">
            <h4 class="section-title">推荐物资</h4>
            <el-table
              :data="recommendMaterials"
              @row-click="selectRecommendMaterial"
              highlight-current-row
              border
              stripe
              style="width: 100%"
              max-height="300px"
              :row-class-name="getRowClassName"
            >
              <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="specificationModel" label="规格型号" min-width="150" show-overflow-tooltip />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click.stop="selectRecommendMaterial(row)">
                    选择
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="selectedRecommendMaterial" class="price-selection-section">
              <h4 class="section-title">选择价格</h4>
              <el-table
                :data="recommendPrices"
                @row-click="selectRecommendPrice"
                highlight-current-row
                border
                stripe
                style="width: 100%"
                max-height="200px"
                :row-class-name="getPriceRowClassName"
              >
                <el-table-column label="价格" width="120" align="right">
                  <template #default="{ row }">
                    <span class="price-value">¥{{ formatPrice(row.taxPrice || row.unitPrice || 0) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="quarter" label="季度" width="100" align="center" />
                <el-table-column prop="priceType" label="价格类型" width="100" align="center">
                  <template #default="{ row }">
                    <span>{{ getPriceTypeText(row.priceType) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click.stop="selectRecommendPrice(row)">
                      选择
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 数据库搜索标签页 -->
        <el-tab-pane label="数据库搜索" name="search">
          <div class="search-section">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索物资名称、规格型号等..."
              clearable
              class="search-input"
              @input="handleSearchInput"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-table
              :data="searchResults"
              v-loading="searchLoading"
              @row-click="selectSearchResult"
              highlight-current-row
              border
              stripe
              style="width: 100%"
              height="400px"
              :row-class-name="getSearchRowClassName"
            >
              <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="specificationModel" label="规格型号" min-width="150" show-overflow-tooltip />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="materialCode" label="物资编码" width="120" show-overflow-tooltip />
              <el-table-column label="价格" width="120" align="right">
                <template #default="{ row }">
                  <span class="price-value">¥{{ formatPrice(row.taxPrice) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="quarter" label="季度" width="100" align="center" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click.stop="selectSearchResult(row)">
                    选择
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper" v-if="searchTotal > 0">
              <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :total="searchTotal"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="searchPageSize"
                :current-page="searchPageNum"
                @current-change="handleSearchPageChange"
                @size-change="handleSearchSizeChange"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- 新增物资标签页 -->
        <el-tab-pane label="新增物资" name="add">
          <div class="add-section">
            <el-form
              :model="newMaterialForm"
              :rules="materialFormRules"
              ref="materialFormRef"
              label-width="120px"
              class="material-form"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="物资名称" prop="materialName">
                    <el-input v-model="newMaterialForm.materialName" placeholder="请输入物资名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="规格型号" prop="specificationModel">
                    <el-input v-model="newMaterialForm.specificationModel" placeholder="请输入规格型号" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="单位" prop="unit">
                    <el-input v-model="newMaterialForm.unit" placeholder="请输入单位" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="物资类型" prop="type">
                    <el-input v-model="newMaterialForm.type" placeholder="请输入物资类型" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="价格" prop="taxPrice">
                    <el-input-number
                      v-model="newMaterialForm.taxPrice"
                      :min="0"
                      :precision="2"
                      controls-position="right"
                      placeholder="请输入价格"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="价格季度" prop="quarter">
                    <el-select v-model="newMaterialForm.quarter" placeholder="请选择季度" style="width: 100%">
                      <el-option label="Q1" value="Q1" />
                      <el-option label="Q2" value="Q2" />
                      <el-option label="Q3" value="Q3" />
                      <el-option label="Q4" value="Q4" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="物资编码">
                    <el-input v-model="newMaterialForm.materialCode" placeholder="请输入物资编码（可选）" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button type="primary" @click="submitNewMaterial" :loading="submitting">
                确认新增并选择
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info" v-if="finalSelection.material">
          <span class="info-label">已选择：</span>
          <span class="material-info">
            {{ finalSelection.material.materialName }} - {{ finalSelection.material.specificationModel }}
          </span>
          <span class="price-info" v-if="finalSelection.price">
            ¥{{ formatPrice(finalSelection.price.taxPrice || finalSelection.price.unitPrice) }} ({{ finalSelection.price.quarter }})
          </span>
        </div>
        <div class="action-buttons">
          <el-button @click="closeDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSelection" 
            :disabled="!isSelectionComplete"
          >
            确认选择
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { queryMaterialBaseInfoWithPrices } from '@/utils/backendWorkflow'
import { debounce } from 'lodash-es'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  // 当前行数据，包含推荐物资和价格信息
  rowData: {
    type: Object,
    default: () => ({})
  },
  // 是否显示推荐标签页
  showRecommend: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 激活的标签页
const activeTab = ref('recommend')

// 推荐数据
const recommendMaterials = ref([])
const recommendPrices = ref([])
const selectedRecommendMaterial = ref(null)
const selectedRecommendPrice = ref(null)

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchTotal = ref(0)
const searchPageNum = ref(1)
const searchPageSize = ref(10)
const selectedSearchResult = ref(null)

// 新增物资表单
const materialFormRef = ref()
const newMaterialForm = ref({
  materialName: '',
  specificationModel: '',
  unit: '',
  type: '',
  materialCode: '',
  taxPrice: null,
  quarter: ''
})
const submitting = ref(false)

// 最终选择结果
const finalSelection = ref({
  material: null,
  price: null,
  source: '' // 'recommend', 'search', 'add'
})

// 表单验证规则
const materialFormRules = {
  materialName: [
    { required: true, message: '请输入物资名称', trigger: 'blur' }
  ],
  specificationModel: [
    { required: true, message: '请输入规格型号', trigger: 'blur' }
  ],
  unit: [
    { required: true, message: '请输入单位', trigger: 'blur' }
  ],
  taxPrice: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  quarter: [
    { required: true, message: '请选择季度', trigger: 'change' }
  ]
}

// 计算属性
const hasRecommendations = computed(() => {
  return props.showRecommend && (recommendMaterials.value.length > 0 || 
         (props.rowData.matchOptions && props.rowData.matchOptions.length > 0))
})

const isSelectionComplete = computed(() => {
  return finalSelection.value.material && finalSelection.value.price
})

// 初始化推荐数据
const initRecommendData = () => {
  if (!props.rowData) return
  
  // 从 matchOptions 获取推荐物资
  if (props.rowData.matchOptions && props.rowData.matchOptions.length > 0) {
    recommendMaterials.value = props.rowData.matchOptions.map(option => ({
      ...option.baseInfo,
      originalOption: option,
      priceOptions: option.priceList || []
    }))
  } else {
    recommendMaterials.value = []
  }
  
  // 重置选择状态
  selectedRecommendMaterial.value = null
  selectedRecommendPrice.value = null
  recommendPrices.value = []
  
  // 如果没有推荐数据，默认切换到搜索标签页
  if (!hasRecommendations.value) {
    activeTab.value = 'search'
  }
}

// 选择推荐物资
const selectRecommendMaterial = (material) => {
  selectedRecommendMaterial.value = material
  recommendPrices.value = material.priceOptions || []
  selectedRecommendPrice.value = null
  
  // 如果只有一个价格，自动选择
  if (recommendPrices.value.length === 1) {
    selectRecommendPrice(recommendPrices.value[0])
  }
}

// 选择推荐价格
const selectRecommendPrice = (price) => {
  selectedRecommendPrice.value = price
  finalSelection.value = {
    material: selectedRecommendMaterial.value,
    price: price,
    source: 'recommend'
  }
}

// 处理搜索输入（防抖）
const handleSearchInput = debounce((keyword) => {
  searchPageNum.value = 1
  performSearch(keyword)
}, 300)

// 执行搜索
const performSearch = async (keyword = searchKeyword.value) => {
  searchLoading.value = true
  try {
    const params = {
      page: searchPageNum.value - 1,
      size: searchPageSize.value
    }
    
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim()
    }
    
    const response = await queryMaterialBaseInfoWithPrices(params)
    if (response && response.data && response.data.content) {
      // 扁平化数据处理
      const flattenedData = []
      response.data.content.forEach(item => {
        const materialBaseInfo = item.materialBaseInfo || {}
        const priceList = item.priceList || []
        
        if (priceList.length > 0) {
          priceList.forEach(price => {
            flattenedData.push({
              ...materialBaseInfo,
              ...price,
              originalData: { materialBaseInfo, priceInfo: price, fullItem: item },
              priceId: price.id,
              baseInfoId: price.baseInfoId || materialBaseInfo.id
            })
          })
        } else {
          flattenedData.push({
            ...materialBaseInfo,
            taxPrice: 0,
            quarter: '-',
            originalData: { materialBaseInfo, priceInfo: null, fullItem: item },
            priceId: null,
            baseInfoId: materialBaseInfo.id
          })
        }
      })
      
      searchResults.value = flattenedData
      searchTotal.value = response.data.totalElements || 0
    } else {
      searchResults.value = []
      searchTotal.value = 0
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
    searchResults.value = []
    searchTotal.value = 0
  } finally {
    searchLoading.value = false
  }
}

// 选择搜索结果
const selectSearchResult = (result) => {
  selectedSearchResult.value = result
  finalSelection.value = {
    material: {
      materialName: result.materialName,
      specificationModel: result.specificationModel,
      unit: result.unit,
      type: result.type,
      materialCode: result.materialCode,
      id: result.baseInfoId
    },
    price: {
      taxPrice: result.taxPrice,
      unitPrice: result.unitPrice,
      taxExcludedPrice: result.taxExcludedPrice,
      originalPrice: result.originalPrice,
      priceType: result.priceType,
      quarter: result.quarter,
      id: result.priceId
    },
    source: 'search',
    originalData: result.originalData
  }
}

// 搜索分页处理
const handleSearchPageChange = (page) => {
  searchPageNum.value = page
  performSearch()
}

const handleSearchSizeChange = (size) => {
  searchPageSize.value = size
  searchPageNum.value = 1
  performSearch()
}

// 提交新增物资
const submitNewMaterial = async () => {
  try {
    await materialFormRef.value.validate()
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 创建新的物资和价格数据
    const newMaterial = {
      materialName: newMaterialForm.value.materialName,
      specificationModel: newMaterialForm.value.specificationModel,
      unit: newMaterialForm.value.unit,
      type: newMaterialForm.value.type,
      materialCode: newMaterialForm.value.materialCode,
      id: `new_${Date.now()}`
    }
    
    const newPrice = {
      taxPrice: newMaterialForm.value.taxPrice,
      quarter: newMaterialForm.value.quarter,
      id: `price_${Date.now()}`,
      priceType: 1 // 默认含税价格类型
    }
    
    finalSelection.value = {
      material: newMaterial,
      price: newPrice,
      source: 'add'
    }
    
    ElMessage.success('物资新增成功')
    
  } catch (error) {
    console.error('新增失败:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  materialFormRef.value?.resetFields()
  newMaterialForm.value = {
    materialName: '',
    specificationModel: '',
    unit: '',
    type: '',
    materialCode: '',
    taxPrice: null,
    quarter: ''
  }
}

// 确认选择
const confirmSelection = () => {
  if (!isSelectionComplete.value) {
    ElMessage.warning('请选择物资和价格')
    return
  }
  
  emit('confirm', finalSelection.value)
  closeDialog()
}

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false
  // 重置状态
  activeTab.value = 'recommend'
  finalSelection.value = { material: null, price: null, source: '' }
  selectedRecommendMaterial.value = null
  selectedRecommendPrice.value = null
  selectedSearchResult.value = null
  searchKeyword.value = ''
  searchResults.value = []
  resetForm()
}

// 工具函数
const formatPrice = (price) => {
  return typeof price === 'number' ? price.toFixed(2) : '0.00'
}

const getPriceTypeText = (priceType) => {
  const typeMap = {
    0: '不含税',
    1: '含税',
    2: '其他'
  }
  return typeMap[priceType] || '未知'
}

// 行样式类名
const getRowClassName = ({ row }) => {
  return selectedRecommendMaterial.value === row ? 'selected-row' : 'selectable-row'
}

const getPriceRowClassName = ({ row }) => {
  return selectedRecommendPrice.value === row ? 'selected-row' : 'selectable-row'
}

const getSearchRowClassName = ({ row }) => {
  return selectedSearchResult.value === row ? 'selected-row' : 'selectable-row'
}

// 监听对话框打开
watch(dialogVisible, (newVal) => {
  if (newVal) {
    initRecommendData()
    // 如果有推荐数据，执行初始搜索
    nextTick(() => {
      if (activeTab.value === 'search') {
        performSearch('')
      }
    })
  }
})

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'search' && searchResults.value.length === 0) {
    performSearch('')
  }
})
</script>

<style scoped>
/* 对话框基础样式 */
:deep(.material-price-selection-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
}

:deep(.material-price-selection-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
  padding: 16px 24px;
}

:deep(.material-price-selection-dialog .el-dialog__body) {
  padding: 0;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.selection-content {
  min-height: 500px;
}

/* 标签页样式 */
.selection-tabs {
  height: 100%;
}

:deep(.selection-tabs .el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid var(--theme-border-secondary);
  background: var(--theme-bg-secondary);
}

:deep(.selection-tabs .el-tabs__content) {
  padding: 24px;
  height: calc(100% - 56px);
  overflow-y: auto;
}

/* 各个标签页内容样式 */
.recommend-section,
.search-section,
.add-section {
  height: 100%;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

/* 价格选择区域 */
.price-selection-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--theme-border-secondary);
}

/* 搜索输入框 */
.search-input {
  width: 100%;
  margin-bottom: 20px;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--theme-border-secondary);
}

/* 表单样式 */
.material-form {
  max-width: 800px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.form-actions .el-button {
  margin: 0 8px;
}

/* 价格显示样式 */
.price-value {
  font-weight: 600;
  color: var(--theme-success);
  font-size: 14px;
}

/* 表格行样式 */
:deep(.el-table .selectable-row) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.el-table .selectable-row:hover td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

:deep(.el-table .selected-row td.el-table__cell) {
  background: var(--theme-primary-light) !important;
  color: var(--theme-primary) !important;
}

/* 对话框底部样式 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--theme-border-secondary);
  background: var(--theme-bg-secondary);
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.info-label {
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.material-info {
  color: var(--theme-text-primary);
  font-weight: 500;
}

.price-info {
  color: var(--theme-success);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.material-price-selection-dialog) {
    width: 95% !important;
    margin: 2vh auto !important;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .selected-info {
    justify-content: center;
    text-align: center;
  }

  .action-buttons {
    justify-content: center;
  }
}
</style>