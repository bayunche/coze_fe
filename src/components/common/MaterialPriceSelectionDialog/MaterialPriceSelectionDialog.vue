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
              <el-table-column label="推荐分数" width="120" align="center">
                <template #default="{ row }">
                  <div class="recommend-score-cell">
                    <div class="score-progress">
                      <div 
                        class="score-bar" 
                        :style="{ width: getRecommendScore(row) + '%' }"
                      ></div>
                    </div>
                    <span class="score-text">{{ getRecommendScore(row) }}%</span>
                  </div>
                </template>
              </el-table-column>
            
            </el-table>

            <div v-if="selectedRecommendMaterial" class="price-selection-section">
              <h4 class="section-title">选择价格</h4>
              <div class="selection-hint">点击表格行即可选择该价格</div>
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
                <el-table-column label="物资价格（含税）" width="130" align="right">
                  <template #default="{ row }">
                    <span class="price-value">¥{{ formatPrice(getPriceValue(row)) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="quarter" label="价格所属季度" width="120" align="center" />
                <el-table-column prop="unit" label="价格单位" width="100" align="center">
                  <template #default="{ row }">
                    <span>{{ row.unit || '-' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 数据库搜索标签页 -->
        <el-tab-pane label="数据库搜索" name="search">
          <div class="database-section">
            <!-- 数据库子标签页 -->
            <el-tabs v-model="activeDbTab" type="border-card" class="database-tabs">
              <!-- 数据库内数据子标签页 -->
              <el-tab-pane label="数据库内数据" name="database">
                <div class="search-section">
                  <div class="search-filters">
                    <el-input
                      v-model="searchKeyword"
                      placeholder="搜索物资名称、规格型号、物资编码、价格等..."
                      clearable
                      class="search-input"
                      @input="handleSearchInput"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                    <el-select
                      v-model="selectedQuarter"
                      placeholder="选择价格季度"
                      clearable
                      class="quarter-select"
                      @change="handleQuarterChange"
                    >
                      <el-option label="全部季度" value="" />
                      <el-option v-for="quarter in quarterOptions" :key="quarter" :label="quarter" :value="quarter" />
                    </el-select>
                  </div>

                  <div class="selection-hint">点击表格行即可选择该物资</div>
                  <el-table
                    :data="searchResults"
                    v-loading="searchLoading"
                    @row-click="selectSearchResult"
                    highlight-current-row
                    border
                    stripe
                    style="width: 100%"
                    height="350px"
                    :row-class-name="getSearchRowClassName"
                  >
                    <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="specificationModel" label="规格型号" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="unit" label="单位" width="80" />
                    <el-table-column prop="type" label="类型" width="100" />
                    <el-table-column prop="materialCode" label="物资编码" width="120" show-overflow-tooltip />
                    <el-table-column label="物资价格（含税）" width="130" align="right">
                      <template #default="{ row }">
                        <span class="price-value">¥{{ formatPrice(getPriceValue(row)) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="quarter" label="价格所属季度" width="120" align="center" />
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

              <!-- 临时物资价格数据子标签页 -->
              <el-tab-pane label="临时物资价格" name="temporary">
                <div class="temporary-section">
                  <div class="search-filters">
                    <el-input
                      v-model="temporarySearchKeyword"
                      placeholder="搜索临时物资名称、规格型号等..."
                      clearable
                      class="search-input"
                      @input="handleTemporarySearchInput"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                  </div>

                  <div class="selection-hint">点击表格行即可选择该临时物资</div>
                  <el-table
                    :data="temporaryResults"
                    v-loading="temporaryLoading"
                    @row-click="selectTemporaryResult"
                    highlight-current-row
                    border
                    stripe
                    style="width: 100%"
                    height="350px"
                    :row-class-name="getTemporaryRowClassName"
                  >
                    <!-- 物资基础信息列 -->
                    <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="specificationModel" label="规格型号" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="unit" label="单位" width="80" align="center" />
                    <el-table-column prop="materialCode" label="物资编码" width="120" show-overflow-tooltip />
                    
                    <!-- 价格信息列 -->
                    <el-table-column label="含税价格" width="120" align="right">
                      <template #default="{ row }">
                        <span class="price-value">¥{{ formatPrice(row.taxPrice || 0) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="quarter" label="价格季度" width="120" align="center" />
                    
                    <!-- 状态信息列 -->
                    <el-table-column label="审核状态" width="100" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getApprovalStatusType(row.adminApproved)" size="small">
                          {{ getApprovalStatusText(row.adminApproved) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="createdTime" label="创建时间" width="140" align="center">
                      <template #default="{ row }">
                        {{ formatDateTime(row.createdTime) }}
                      </template>
                    </el-table-column>
                  </el-table>

                  <div class="pagination-wrapper" v-if="temporaryTotal > 0">
                    <el-pagination
                      background
                      layout="total, sizes, prev, pager, next, jumper"
                      :total="temporaryTotal"
                      :page-sizes="[10, 20, 50, 100]"
                      :page-size="temporaryPageSize"
                      :current-page="temporaryPageNum"
                      @current-change="handleTemporaryPageChange"
                      @size-change="handleTemporarySizeChange"
                    />
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
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
                  <el-form-item label="不含税价格" prop="taxExcludedPrice">
                    <el-input-number
                      v-model="newMaterialForm.taxExcludedPrice"
                      :min="0"
                      :precision="3"
                      controls-position="right"
                      placeholder="请输入不含税价格"
                      style="width: 100%"
                      @change="calculateTaxPrice"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="税率" prop="tax">
                    <el-input-number
                      v-model="newMaterialForm.tax"
                      :min="0"
                      :max="100"
                      :precision="2"
                      controls-position="right"
                      placeholder="请输入税率"
                      style="width: 100%"
                      @change="calculateTaxPrice"
                    >
                      <template #append>%</template>
                    </el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="含税价格" prop="taxPrice">
                    <el-input-number
                      v-model="newMaterialForm.taxPrice"
                      :min="0"
                      :precision="3"
                      controls-position="right"
                      placeholder="自动计算"
                      style="width: 100%"
                      disabled
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="价格季度" prop="quarter">
                    <el-input 
                      v-model="newMaterialForm.quarter" 
                      placeholder="请输入价格季度（格式：xxxx-Qx，如2024-Q1）" 
                      style="width: 100%" 
                    />
                    <div class="quarter-hint">格式示例：2024-Q1, 2024-Q2, 2024-Q3, 2024-Q4</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <div class="form-actions">
              <el-button @click="resetForm">重置</el-button>
              <el-button 
                type="primary" 
                @click="submitNewMaterial" 
                :loading="savingMaterial"
                :disabled="!isFormValid || savingMaterial"
              >
                {{ savingMaterial ? '保存中...' : '确认新增' }}
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
            {{ (finalSelection.material.materialName || '未知') }} - {{ (finalSelection.material.specificationModel || '未知') }}
          </span>
          <span class="price-info" v-if="finalSelection.price">
            ¥{{ formatPrice(finalSelection.price.taxPrice || finalSelection.price.unitPrice || 0) }} ({{ finalSelection.price.quarter || '未知' }})
          </span>
        </div>
        <div class="action-buttons">
          <el-button @click="closeDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmSelection" 
            :disabled="!isSelectionComplete"
            :loading="savingMaterial"
          >
            {{ savingMaterial ? '保存中...' : '确认选择' }}
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
import MaterialService from '@/services/MaterialService'
import temporaryDataService from '@/services/TemporaryDataService'

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
// 数据库子标签页激活状态
const activeDbTab = ref('database')

// 推荐数据
const recommendMaterials = ref([])
const recommendPrices = ref([])
const selectedRecommendMaterial = ref(null)
const selectedRecommendPrice = ref(null)
const loadingRecommendPrices = ref(false) // 添加价格加载状态

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])
const searchLoading = ref(false)
const searchTotal = ref(0)
const searchPageNum = ref(1)
const searchPageSize = ref(10)
const selectedSearchResult = ref(null)
const selectedQuarter = ref('')

// 季度选项
const quarterOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const quarters = []
  
  // 生成最近3年的季度选项
  for (let year = currentYear; year >= currentYear - 2; year--) {
    for (let quarter = 4; quarter >= 1; quarter--) {
      quarters.push(`${year}-Q${quarter}`)
    }
  }
  
  return quarters
})

// 临时物资相关
const temporarySearchKeyword = ref('')
const temporaryResults = ref([])
const temporaryLoading = ref(false)
const temporaryTotal = ref(0)
const temporaryPageNum = ref(1)
const temporaryPageSize = ref(10)
const selectedTemporaryResult = ref(null)

// 新增物资表单
const materialFormRef = ref()
const savingMaterial = ref(false) // 新增保存状态
const newMaterialForm = ref({
  materialName: '',
  specificationModel: '',
  unit: '',
  type: '',
  taxExcludedPrice: null, // 不含税价格
  tax: null, // 税率
  taxPrice: null, // 含税价格（自动计算）
  quarter: ''
})

// 最终选择结果
const finalSelection = ref({
  material: null,
  price: null,
  source: '' // 'recommend', 'search', 'add'
})

// 计算含税价格函数
const calculateTaxPrice = () => {
  const { taxExcludedPrice, tax } = newMaterialForm.value
  if (taxExcludedPrice !== null && tax !== null && taxExcludedPrice > 0 && tax >= 0) {
    // 含税价格 = 不含税价格 * (1 + 税率/100)
    const calculatedTaxPrice = taxExcludedPrice * (1 + tax / 100)
    newMaterialForm.value.taxPrice = parseFloat(calculatedTaxPrice.toFixed(3))
  } else {
    newMaterialForm.value.taxPrice = null
  }
}

// 季度格式验证函数
const validateQuarter = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入价格季度'))
  } else if (!/^\d{4}-Q[1-4]$/.test(value)) {
    callback(new Error('季度格式不正确，请输入如 2024-Q1 的格式'))
  } else {
    const year = parseInt(value.substring(0, 4))
    if (year < 2000 || year > 2099) {
      callback(new Error('年份应在2000-2099之间'))
    } else {
      callback()
    }
  }
}

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
  taxExcludedPrice: [
    { required: true, message: '请输入不含税价格', trigger: 'blur' }
  ],
  tax: [
    { required: true, message: '请输入税率', trigger: 'blur' }
  ],
  quarter: [
    { required: true, validator: validateQuarter, trigger: 'blur' }
  ]
}

// 计算属性
const hasRecommendations = computed(() => {
  return props.showRecommend && (recommendMaterials.value.length > 0 || 
         (props.rowData?.matchOptions && props.rowData.matchOptions.length > 0))
})

const isSelectionComplete = computed(() => {
  return finalSelection.value.material && finalSelection.value.price
})

// 新增物资表单是否有效
const isFormValid = computed(() => {
  return newMaterialForm.value.materialName &&
         newMaterialForm.value.specificationModel &&
         newMaterialForm.value.unit &&
         newMaterialForm.value.taxExcludedPrice !== null &&
         newMaterialForm.value.tax !== null &&
         newMaterialForm.value.quarter &&
         /^\d{4}-Q[1-4]$/.test(newMaterialForm.value.quarter)
})

// 初始化推荐数据
const initRecommendData = () => {
  if (!props.rowData) return
  
  // 从 matchOptions 获取推荐物资
  if (props.rowData?.matchOptions && props.rowData.matchOptions.length > 0) {
    recommendMaterials.value = props.rowData.matchOptions.map(option => {
      // 确保从baseInfo中正确获取物资名称和规格型号，如果没有则从option中获取
      const baseInfo = option.baseInfo || {}
      return {
        ...baseInfo,
        // 确保物资名称正确带入
        materialName: baseInfo.materialName || option.materialName || props.rowData.materialName || '',
        // 确保规格型号正确带入 - 优先使用specifications字段
        specificationModel: baseInfo.specifications || baseInfo.specificationModel || option.specifications || option.specificationModel || props.rowData.specificationModel || '',
        // 确保单位正确带入
        unit: baseInfo.unit || option.unit || props.rowData.unit || '',
        // 确保物资类型正确带入
        type: baseInfo.type || option.type || props.rowData.type || '',
        originalOption: option,
        // 将matchedId从option层级传递到物资数据中，这样可以用于API调用
        matchedId: option.matchedId,
        // 根据接口文档，价格数据在 priceOptions 字段中
        priceOptions: option.priceOptions || option.priceList || []
      }
    })
    
    // 如果有推荐物资，自动选择第一个物资，并加载其价格列表
    if (recommendMaterials.value.length > 0) {
      const firstMaterial = recommendMaterials.value[0]
      selectRecommendMaterial(firstMaterial)
    }
  } else {
    recommendMaterials.value = []
  }
  
  // 重置选择状态（如果没有自动选择第一个）
  if (recommendMaterials.value.length === 0) {
    selectedRecommendMaterial.value = null
    selectedRecommendPrice.value = null
    recommendPrices.value = []
  }
  
  // 如果没有推荐数据，默认切换到搜索标签页
  if (!hasRecommendations.value) {
    activeTab.value = 'search'
  }
}

// 选择推荐物资
const selectRecommendMaterial = async (material) => {
  selectedRecommendMaterial.value = material
  selectedRecommendPrice.value = null
  loadingRecommendPrices.value = true // 开始加载
  recommendPrices.value = []
  
  try {
    // 通过baseInfoId获取完整的物资信息和价格列表
    // 根据数据结构，推荐物资的ID应该是matchedId字段
    const baseInfoId = material.matchedId || material.id || material.baseInfoId
    if (!baseInfoId) {
      console.warn('物资缺少baseInfoId，尝试的字段:', {
        matchedId: material.matchedId,
        id: material.id,
        baseInfoId: material.baseInfoId,
        material: material
      })
      recommendPrices.value = material.priceOptions || []
      loadingRecommendPrices.value = false
      return
    }
    
    const priceList = await MaterialService.queryPriceInfoList(baseInfoId)
    
    if (priceList && priceList.length > 0) {
      recommendPrices.value = priceList.map(price => ({
        ...price,
        // 确保包含含税价格字段
        taxPrice: price.taxPrice || price.含税价格 || price.unitPrice || 0,
        quarter: price.quarter || price.季度 || '-'
      }))
    } else {
      // 如果API没有返回价格数据，使用原有数据
      recommendPrices.value = material.priceOptions || []
    }
    
    
    // 确保在数据加载完成后再自动选择
    await nextTick() // 等待DOM更新
    
    // 如果只有一个价格，自动选择
    if (recommendPrices.value.length === 1) {
      selectRecommendPrice(recommendPrices.value[0])
    }
  } catch (error) {
    console.error('获取价格列表失败:', error)
    // 降级使用原有数据
    recommendPrices.value = material.priceOptions || []
  } finally {
    loadingRecommendPrices.value = false // 结束加载
  }
}

// 选择推荐价格
const selectRecommendPrice = (price) => {
  console.log('【数据流转-5】selectRecommendPrice 开始')
  console.log('  选择的price:', price)
  console.log('  当前selectedRecommendMaterial:', selectedRecommendMaterial.value)
  
  selectedRecommendPrice.value = price
  
  const finalMaterial = {
    ...selectedRecommendMaterial.value,
    // 确保包含正确的ID字段，用于后续保存
    id: selectedRecommendMaterial.value.matchedId || selectedRecommendMaterial.value.id,
    baseInfoId: selectedRecommendMaterial.value.matchedId || selectedRecommendMaterial.value.id // 添加baseInfoId字段
  }
  
  finalSelection.value = {
    material: finalMaterial,
    price: price,
    source: 'recommend'
  }
  
  console.log('【数据流转-5】finalSelection 设置完成:', finalSelection.value)
}

// 处理搜索输入（防抖）
const handleSearchInput = debounce((keyword) => {
  searchPageNum.value = 1
  performSearch(keyword)
}, 300)

// 处理季度筛选变化
const handleQuarterChange = () => {
  searchPageNum.value = 1
  performSearch()
}

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
    
    if (selectedQuarter.value) {
      params.quarter = selectedQuarter.value
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

// 临时物资相关方法
// 处理临时物资搜索输入（防抖）
const handleTemporarySearchInput = debounce((keyword) => {
  temporaryPageNum.value = 1
  performTemporarySearch(keyword)
}, 300)

// 执行临时物资搜索
const performTemporarySearch = async (keyword = temporarySearchKeyword.value) => {
  temporaryLoading.value = true
  try {
    const params = {
      page: temporaryPageNum.value - 1,
      size: temporaryPageSize.value
    }
    
    // 搜索关键词参数需要根据临时数据API调整
    if (keyword && keyword.trim()) {
      // 临时数据API可能不支持keyword参数，这里先保留，后续可能需要调整
      params.keyword = keyword.trim()
    }
    
    const response = await temporaryDataService.queryTemporaryData(params)
    if (response && response.data) {
      // 合并临时基础信息和价格信息
      const mergedResults = []
      
      // 处理临时基础信息
      const temporaryBaseInfos = response.data.temporaryBaseInfos || []
      const temporaryPrices = response.data.temporaryPrices || []
      
      // 创建价格信息的baseInfoId映射
      const pricesByBaseInfoId = new Map()
      temporaryPrices.forEach(price => {
        const baseInfoId = price.baseInfoId
        if (!pricesByBaseInfoId.has(baseInfoId)) {
          pricesByBaseInfoId.set(baseInfoId, [])
        }
        pricesByBaseInfoId.get(baseInfoId).push(price)
      })
      
      // 合并基础信息和价格信息
      temporaryBaseInfos.forEach(baseInfo => {
        const prices = pricesByBaseInfoId.get(baseInfo.id) || []
        if (prices.length > 0) {
          prices.forEach(price => {
            mergedResults.push({
              ...baseInfo,
              ...price,
              // 保留原始数据结构
              baseInfo: baseInfo,
              priceInfo: price,
              // 兼容字段
              confirmedBaseInfo: baseInfo,
              taxPrice: price.taxPrice || 0,
              adminApproved: baseInfo.adminApproved || null,
              createdTime: baseInfo.createdTime || price.createdTime
            })
          })
        } else {
          // 没有价格信息的基础信息
          mergedResults.push({
            ...baseInfo,
            baseInfo: baseInfo,
            priceInfo: null,
            confirmedBaseInfo: baseInfo,
            taxPrice: 0,
            adminApproved: baseInfo.adminApproved || null,
            createdTime: baseInfo.createdTime
          })
        }
      })
      
      temporaryResults.value = mergedResults
      temporaryTotal.value = response.data.page?.totalElements || mergedResults.length
    } else {
      temporaryResults.value = []
      temporaryTotal.value = 0
    }
  } catch (error) {
    console.error('搜索临时物资失败:', error)
    ElMessage.error('搜索临时物资失败')
    temporaryResults.value = []
    temporaryTotal.value = 0
  } finally {
    temporaryLoading.value = false
  }
}

// 选择临时物资结果
const selectTemporaryResult = (result) => {
  selectedTemporaryResult.value = result
  
  // 构建最终选择数据
  finalSelection.value = {
    material: {
      materialName: result.materialName || '',
      specificationModel: result.specificationModel || '',
      unit: result.unit || '',
      type: result.type || '',
      materialCode: result.materialCode || '',
      id: result.id || result.baseInfoId // 使用基础信息ID
    },
    price: {
      taxPrice: result.taxPrice || 0,
      unitPrice: result.taxPrice || 0, // 单价与含税价相同
      priceType: 1, // 含税价格
      quarter: result.quarter || '-', // 从合并数据中获取季度
      id: result.priceInfo?.id || null, // 价格信息ID
      unit: result.unit || '', // 价格单位
      isTemporary: true, // 标记为临时数据
      baseInfoId: result.id || result.baseInfoId // 关联的基础信息ID
    },
    source: 'temporary',
    originalData: result
  }
}

// 临时物资分页处理
const handleTemporaryPageChange = (page) => {
  temporaryPageNum.value = page
  performTemporarySearch()
}

const handleTemporarySizeChange = (size) => {
  temporaryPageSize.value = size
  temporaryPageNum.value = 1
  performTemporarySearch()
}

// 提交新增物资
const submitNewMaterial = async () => {
  try {
    // 表单验证
    const isValid = await materialFormRef.value.validate().catch(() => false)
    if (!isValid) {
      ElMessage.warning('请检查表单填写是否正确')
      return
    }
    
    savingMaterial.value = true
    
    // 1. 创建临时物资基础信息
    console.log('创建临时物资基础信息，参数:', newMaterialForm.value)
    const baseInfoResponse = await temporaryDataService.createTemporaryBaseInfo({
      materialName: newMaterialForm.value.materialName,
      specificationModel: newMaterialForm.value.specificationModel,
      unit: newMaterialForm.value.unit,
      type: newMaterialForm.value.type,
      businessDomain: 'contract', // 默认为合同域
      serialNumber: '', // 可以为空
      priceCode: '', // 可以为空
      mainDistributionNetwork: '', // 可以为空
      mainDistributionType: 0 // 默认为0
    })
    
    console.log('临时物资基础信息创建成功:', baseInfoResponse)
    const baseInfoId = baseInfoResponse.id
    
    // 2. 创建临时价格信息
    console.log('创建临时价格信息，baseInfoId:', baseInfoId)
    const priceResponse = await temporaryDataService.createTemporaryPrice({
      baseInfoId: baseInfoId,
      quarter: newMaterialForm.value.quarter,
      taxPrice: newMaterialForm.value.taxPrice,
      taxExcludedPrice: newMaterialForm.value.taxExcludedPrice,
      tax: newMaterialForm.value.tax,
      unit: newMaterialForm.value.unit
    })
    
    console.log('临时价格信息创建成功:', priceResponse)
    
    // 3. 创建最终选择数据，使用后端返回的数据
    const finalSelectionData = {
      material: {
        ...baseInfoResponse, // 使用后端返回的完整基础信息
        materialName: baseInfoResponse.materialName,
        specificationModel: baseInfoResponse.specificationModel,
        unit: baseInfoResponse.unit,
        type: baseInfoResponse.type,
        materialCode: baseInfoResponse.materialCode,
        id: baseInfoResponse.id
      },
      price: {
        ...priceResponse, // 使用后端返回的完整价格信息
        taxPrice: priceResponse.taxPrice,
        quarter: priceResponse.quarter,
        id: priceResponse.id,
        priceType: 1,
        baseInfoId: priceResponse.baseInfoId
      },
      source: 'add'
    }
    
    // 设置 finalSelection 用于界面显示
    finalSelection.value = finalSelectionData
    
    ElMessage.success('新增物资数据保存成功')
    
    // 自动执行确认选择逻辑并关闭弹窗
    await nextTick() // 等待界面更新
    emit('confirm', finalSelectionData)
    closeDialog()
    
  } catch (error) {
    console.error('保存新增物资失败:', error)
    if (error.message && error.message.includes('必填')) {
      ElMessage.error('请填写必填字段：' + error.message)
    } else {
      ElMessage.error('保存新增物资数据失败，请重试')
    }
  } finally {
    savingMaterial.value = false
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
    taxExcludedPrice: null,
    tax: null,
    taxPrice: null,
    quarter: ''
  }
}

// 确认选择
const confirmSelection = async () => {
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
  activeDbTab.value = 'database'
  finalSelection.value = { material: null, price: null, source: '' }
  selectedRecommendMaterial.value = null
  selectedRecommendPrice.value = null
  selectedSearchResult.value = null
  selectedTemporaryResult.value = null
  searchKeyword.value = ''
  searchResults.value = []
  selectedQuarter.value = ''
  temporarySearchKeyword.value = ''
  temporaryResults.value = []
  resetForm()
}

// 工具函数
const formatPrice = (price) => {
  if (typeof price === 'number' && !isNaN(price)) {
    return price.toFixed(2)
  }
  return '0.00'
}


// 获取价格值的函数，支持多种可能的价格字段名
const getPriceValue = (row) => {
  // 调试：打印价格数据结构
  
  // 尝试不同的价格字段名，按优先级排序
  const price = row.taxPrice || 
                row.unitPrice || 
                row.含税价格 || 
                row.price || 
                row.taxInclusivePrice ||
                row.selectedPrice ||
                0
                
  return price
}

// 获取推荐分数
const getRecommendScore = (row) => {
  // 从原始选项中获取分数
  const score = row.originalOption?.matchScore || row.matchScore || 0
  return Math.round(score)
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

const getTemporaryRowClassName = ({ row }) => {
  return selectedTemporaryResult.value === row ? 'selected-row' : 'selectable-row'
}

// 获取审核状态文本
const getApprovalStatusText = (adminApproved) => {
  switch (adminApproved) {
    case null:
    case undefined:
      return '待审核'
    case 0:
      return '未通过'
    case 1:
      return '已通过'
    default:
      return '未知'
  }
}

// 获取审核状态标签类型
const getApprovalStatusType = (adminApproved) => {
  switch (adminApproved) {
    case null:
    case undefined:
      return 'warning'
    case 0:
      return 'danger'
    case 1:
      return 'success'
    default:
      return 'info'
  }
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateTime
  }
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
  if (newTab === 'search') {
    // 切换到数据库搜索时，根据当前子标签页加载对应数据
    nextTick(() => {
      if (activeDbTab.value === 'database' && searchResults.value.length === 0) {
        performSearch('')
      } else if (activeDbTab.value === 'temporary' && temporaryResults.value.length === 0) {
        performTemporarySearch('')
      }
    })
  }
})

// 监听数据库子标签页切换
watch(activeDbTab, (newDbTab) => {
  if (newDbTab === 'database' && searchResults.value.length === 0) {
    performSearch('')
  } else if (newDbTab === 'temporary' && temporaryResults.value.length === 0) {
    performTemporarySearch('')
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
.add-section,
.database-section,
.temporary-section {
  height: 100%;
}

/* 数据库子标签页样式 */
.database-tabs {
  height: 100%;
}

:deep(.database-tabs .el-tabs__header) {
  margin: 0 0 16px 0;
  background: var(--theme-bg-tertiary);
  border-radius: 6px;
  padding: 4px;
}

:deep(.database-tabs .el-tabs__content) {
  height: calc(100% - 56px);
  overflow-y: auto;
}

:deep(.database-tabs .el-tabs__item) {
  color: var(--theme-text-secondary);
  border: none;
  background: transparent;
  border-radius: 4px;
  margin: 0 2px;
  padding: 8px 16px;
  font-size: 14px;
}

:deep(.database-tabs .el-tabs__item.is-active) {
  background: var(--theme-primary);
  color: white;
}

:deep(.database-tabs .el-tabs__item:hover) {
  background: var(--theme-primary-light);
  color: white;
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

/* 搜索筛选区域 */
.search-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.search-input {
  flex: 2;
  min-width: 300px;
}

.quarter-select {
  flex: 1;
  min-width: 160px;
  max-width: 200px;
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

/* 选择提示样式 */
.selection-hint {
  font-size: 12px;
  color: var(--theme-text-tertiary);
  margin-bottom: 8px;
  text-align: center;
  padding: 4px 0;
  background: var(--theme-bg-tertiary);
  border-radius: 4px;
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
  background: rgba(64, 158, 255, 0.08) !important;
  color: var(--theme-text-primary) !important;
  border-left: 3px solid var(--theme-primary) !important;
  font-weight: 500 !important;
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

/* 季度格式提示样式 */
.quarter-hint {
  color: var(--theme-text-secondary);
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

/* 推荐分数样式 */
.recommend-score-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-progress {
  flex: 1;
  height: 8px;
  background: var(--theme-border-secondary);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.score-bar {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.score-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--theme-text-primary);
  min-width: 32px;
  text-align: center;
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

/* 临时物资数据源标签样式 */
.cell-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.data-source-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  flex-shrink: 0;
  min-width: 30px;
  text-align: center;
}

.data-source-tag.parsed {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1565c0;
  border: 1px solid #90caf9;
}

.data-source-tag.user-added {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  color: #7b1fa2;
  border: 1px solid #ce93d8;
}

.material-name {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.specification-text,
.unit-text,
.material-code {
  color: var(--theme-text-primary);
  word-break: break-word;
}

.parsed-price {
  font-weight: 600;
  color: #1565c0;
}

/* 临时物资表格分组列头样式 */
:deep(.temporary-section .el-table th.el-table__cell) {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  font-weight: 600;
}

:deep(.temporary-section .el-table th.el-table__cell:first-child) {
  background: linear-gradient(135deg, #e3f2fd, #f8f9fa);
  color: #1565c0;
}

:deep(.temporary-section .el-table th.el-table__cell:nth-child(2)) {
  background: linear-gradient(135deg, #f3e5f5, #f8f9fa);
  color: #7b1fa2;
}

:deep(.temporary-section .el-table th.el-table__cell:last-child) {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-secondary);
}
</style>