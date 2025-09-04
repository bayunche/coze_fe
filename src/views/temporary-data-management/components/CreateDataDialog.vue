<template>
  <el-dialog
    v-model="dialogVisible"
    title="新增临时数据"
    width="60vw"
    :before-close="handleClose"
    append-to-body
    @closed="handleClosed"
    class="create-data-dialog"
  >
    <div class="dialog-content">
      <!-- Tab 切换 -->
      <el-tabs
        v-model="activeTab"
        type="border-card"
        class="data-tabs"
        @tab-change="handleTabChange"
      >
        <!-- 基础信息Tab -->
        <el-tab-pane label="物资基础信息" name="baseInfo">
          <template #label>
            <span class="tab-label">
              <el-icon><Box /></el-icon>
              物资基础信息
            </span>
          </template>

          <el-form
            ref="baseInfoFormRef"
            :model="baseInfoForm"
            :rules="baseInfoRules"
            label-width="120px"
            label-position="left"
            v-loading="submitting"
          >
            <!-- 基础信息 -->
            <div class="form-section">
              <div class="section-title">基础信息</div>
              <el-form-item label="物资名称" prop="materialName" required>
                <el-input
                  v-model="baseInfoForm.materialName"
                  placeholder="请输入物资名称"
                  clearable
                />
              </el-form-item>

              <el-form-item label="规格型号" prop="specificationModel">
                <el-input
                  v-model="baseInfoForm.specificationModel"
                  placeholder="请输入规格型号"
                  clearable
                />
              </el-form-item>

              <el-form-item label="单位" prop="unit">
                <el-input
                  v-model="baseInfoForm.unit"
                  placeholder="请输入单位（如：个、台、套）"
                  clearable
                />
              </el-form-item>
            </div>

            <!-- 编码信息 -->
            <div class="form-section">
              <div class="section-title">编码信息</div>
              <el-form-item label="序号" prop="serialNumber">
                <el-input v-model="baseInfoForm.serialNumber" placeholder="请输入序号" clearable />
              </el-form-item>

              <el-form-item label="信息价编码" prop="priceCode">
                <el-input
                  v-model="baseInfoForm.priceCode"
                  placeholder="请输入信息价编码"
                  clearable
                />
              </el-form-item>

              <el-form-item label="物资编码" prop="materialCode">
                <el-input
                  v-model="baseInfoForm.materialCode"
                  placeholder="请输入物资编码"
                  clearable
                />
              </el-form-item>
            </div>

            <!-- 分类信息 -->
            <div class="form-section">
              <div class="section-title">分类信息</div>
              <el-form-item label="业务域" prop="businessDomain">
                <el-select
                  v-model="baseInfoForm.businessDomain"
                  placeholder="请选择业务域"
                  clearable
                >
                  <el-option
                    v-for="option in businessDomainOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="物资类型" prop="type">
                <el-input v-model="baseInfoForm.type" placeholder="请输入物资类型" clearable />
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- 价格信息Tab -->
        <el-tab-pane label="价格信息" name="priceInfo">
          <template #label>
            <span class="tab-label">
              <el-icon><Money /></el-icon>
              价格信息
            </span>
          </template>

          <el-form
            ref="priceFormRef"
            :model="priceForm"
            :rules="priceRules"
            label-width="120px"
            label-position="left"
            v-loading="submitting"
          >
            <!-- 关联信息 -->
            <div class="form-section">
              <div class="section-title">关联信息</div>
              <el-form-item label="选择基础物资" prop="baseInfoId" required>
                <div class="material-selection-area">
                  <!-- 已选择的物资显示 -->
                  <div v-if="selectedMaterial" class="selected-material">
                    <div class="selected-material-info">
                      <div class="material-name">{{ selectedMaterial.materialName }}</div>
                      <div class="material-details">
                        <span class="detail-item"
                          >规格: {{ selectedMaterial.specificationModel || '无' }}</span
                        >
                        <span class="detail-item">单位: {{ selectedMaterial.unit || '无' }}</span>
                        <span class="detail-item">ID: {{ selectedMaterial.id }}</span>
                      </div>
                    </div>
                    <el-button
                      type="primary"
                      link
                      @click="showMaterialSelector = true"
                      :icon="EditPen"
                    >
                      重新选择
                    </el-button>
                  </div>

                  <!-- 未选择时的选择按钮 -->
                  <el-button
                    v-else
                    type="primary"
                    plain
                    @click="showMaterialSelector = true"
                    style="height: 2.5rem; font-size: 16px"
                    :icon="Plus"
                  >
                    点击选择基础物资
                  </el-button>
                </div>

                <div class="form-item-tip">请选择已存在的基础物资信息，包括正式数据和临时数据</div>
              </el-form-item>
            </div>

            <!-- 价格信息 -->
            <div class="form-section">
              <div class="section-title">价格信息</div>
              <el-form-item label="季度" prop="quarter" required>
                <el-select v-model="priceForm.quarter" placeholder="请选择季度" clearable>
                  <el-option label="2024年第一季度" value="2024Q1" />
                  <el-option label="2024年第二季度" value="2024Q2" />
                  <el-option label="2024年第三季度" value="2024Q3" />
                  <el-option label="2024年第四季度" value="2024Q4" />
                  <el-option label="2025年第一季度" value="2025Q1" />
                  <el-option label="2025年第二季度" value="2025Q2" />
                  <el-option label="2025年第三季度" value="2025Q3" />
                  <el-option label="2025年第四季度" value="2025Q4" />
                </el-select>
              </el-form-item>

              <el-form-item label="含税价" prop="taxPrice" required>
                <el-input-number
                  v-model="priceForm.taxPrice"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  style="width: 100%"
                  placeholder="请输入含税价"
                  @change="calculateTaxExcludedPrice"
                />
                <div class="form-item-tip">单位：元</div>
              </el-form-item>

              <el-form-item label="税率" prop="taxRate" required>
                <el-input
                  v-model="priceForm.taxRate"
                  placeholder="请输入税率数值"
                  style="width: 100%"
                  @input="handleTaxRateInput"
                  @blur="calculateTaxExcludedPrice"
                >
                  <template #suffix>
                    <span style="color: var(--el-text-color-regular)">%</span>
                  </template>
                </el-input>
                <div class="form-item-tip">请输入税率数值，如：13、9、6、3、0</div>
              </el-form-item>

              <el-form-item label="不含税价">
                <el-input-number
                  v-model="priceForm.taxExcludedPrice"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  style="width: 100%"
                  placeholder="系统自动计算"
                  :disabled="true"
                />
                <div class="form-item-tip">单位：元，根据含税价和税率自动计算</div>
              </el-form-item>

              <el-form-item label="价格单位" prop="unit">
                <el-input
                  v-model="priceForm.unit"
                  placeholder="请输入价格单位（如：元/个、元/台、元/套等）"
                  clearable
                />
                <div class="form-item-tip">
                  常用单位：元/个、元/台、元/套、元/件、元/批、元/米、元/公斤、元/吨
                </div>
              </el-form-item>
            </div>

            <!-- 价格计算提示 -->
            <div class="price-calc-section" v-if="priceForm.taxPrice > 0">
              <div class="calc-title">价格计算参考</div>
              <div class="calc-item">
                <span class="calc-label">含税价：</span>
                <span class="calc-value">{{ formatPrice(priceForm.taxPrice) }}</span>
              </div>
              <div class="calc-item" v-if="priceForm.taxExcludedPrice > 0">
                <span class="calc-label">不含税价：</span>
                <span class="calc-value">{{ formatPrice(priceForm.taxExcludedPrice) }}</span>
              </div>
              <div class="calc-item" v-if="priceForm.taxRate">
                <span class="calc-label">税率：</span>
                <span class="calc-value">{{ calculatedTaxRate }}</span>
              </div>
            </div>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="submitting"> 取消 </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{
            submitting
              ? activeTab === 'baseInfo'
                ? '创建基础信息中...'
                : '创建价格信息中...'
              : '确定创建'
          }}
        </el-button>
      </div>
    </template>

    <!-- 物资选择弹窗 -->
    <el-dialog
      v-model="showMaterialSelector"
      title="选择基础物资"
      width="900px"
      append-to-body
      class="material-selector-dialog"
    >
      <div class="material-selector-content">
        <!-- 搜索区域 -->
        <div class="search-section">
          <el-input
            v-model="materialSearchKeyword"
            placeholder="输入物资名称或编码搜索"
            clearable
            style="width: 300px"
            @keyup.enter="handleMaterialSearch"
          >
            <template #append>
              <el-button @click="handleMaterialSearch" :icon="Search">搜索</el-button>
            </template>
          </el-input>
        </div>

        <!-- 表格区域 -->
        <div class="table-section">
          <el-table
            :data="materialTableData"
            v-loading="materialTableLoading"
            stripe
            border
            style="width: 100%; height: 400px"
            @row-click="selectMaterial"
            class="material-selection-table"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column
              prop="materialName"
              label="物资名称"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="specificationModel"
              label="规格型号"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.specificationModel || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100" align="center">
              <template #default="{ row }">
                {{ row.unit || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="materialCode" label="物资编码" width="150" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.materialCode || '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="priceCode" label="信息价编码" width="150" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.priceCode || '无' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click.stop="selectMaterial(row)">
                  选择
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页区域 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="materialPagination.current"
            v-model:page-size="materialPagination.size"
            :total="materialPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handleMaterialPageChange"
            @size-change="handleMaterialSizeChange"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="showMaterialSelector = false">取消</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, Money, Plus, EditPen, Search } from '@element-plus/icons-vue'
import temporaryDataService from '@/services/TemporaryDataService'
import materialService from '@/services/MaterialService'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'success'])

// 响应式数据
const baseInfoFormRef = ref()
const priceFormRef = ref()
const submitting = ref(false)
const activeTab = ref('baseInfo')
const showMaterialSelector = ref(false)
const selectedMaterial = ref(null)
const materialTableData = ref([])
const materialTableLoading = ref(false)
const materialSearchKeyword = ref('')
const materialPagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 业务域选项映射
const businessDomainOptions = [
  { label: '合同', value: 'contract' },
  { label: '乙供物资', value: 'j_material' },
  { label: '甲供物资', value: 'y_material' }
]

// 基础信息表单数据
const baseInfoForm = reactive({
  materialName: '',
  specificationModel: '',
  unit: '',
  serialNumber: '',
  priceCode: '',
  materialCode: '',
  businessDomain: '',
  type: ''
})

// 价格信息表单数据
const priceForm = reactive({
  baseInfoId: '',
  quarter: '',
  taxPrice: 0,
  taxRate: '13', // 默认税率 13（不带%符号）
  taxExcludedPrice: 0,
  unit: ''
})

// 基础信息表单验证规则
const baseInfoRules = {
  materialName: [
    { required: true, message: '请输入物资名称', trigger: 'blur' },
    { min: 1, max: 200, message: '物资名称长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  specificationModel: [{ max: 200, message: '规格型号长度不能超过 200 个字符', trigger: 'blur' }],
  unit: [{ max: 50, message: '单位长度不能超过 50 个字符', trigger: 'blur' }],
  serialNumber: [{ max: 50, message: '序号长度不能超过 50 个字符', trigger: 'blur' }],
  priceCode: [{ max: 100, message: '信息价编码长度不能超过 100 个字符', trigger: 'blur' }],
  materialCode: [{ max: 100, message: '物资编码长度不能超过 100 个字符', trigger: 'blur' }],
  businessDomain: [{ max: 100, message: '业务域长度不能超过 100 个字符', trigger: 'blur' }],
  type: [{ max: 100, message: '物资类型长度不能超过 100 个字符', trigger: 'blur' }]
}

// 价格信息表单验证规则
const priceRules = {
  baseInfoId: [{ required: true, message: '请选择关联的基础物资', trigger: 'change' }],
  quarter: [{ required: true, message: '请选择季度', trigger: 'change' }],
  taxPrice: [
    { required: true, message: '请输入含税价', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '含税价必须大于0', trigger: 'blur' }
  ],
  taxRate: [
    { required: true, message: '请输入税率', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入税率'))
        } else {
          const numValue = parseFloat(value)
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            callback(new Error('税率必须在0-100之间'))
          } else {
            callback()
          }
        }
      }, 
      trigger: 'blur' 
    }
  ],
  unit: [{ max: 50, message: '价格单位长度不能超过 50 个字符', trigger: 'blur' }]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 处理税率输入
const handleTaxRateInput = (value) => {
  // 只允许输入数字和小数点
  const numericValue = value.replace(/[^\d.]/g, '')
  
  // 限制只能有一个小数点，且小数点后最多两位
  const parts = numericValue.split('.')
  if (parts.length > 2) {
    priceForm.taxRate = parts[0] + '.' + parts[1]
  } else if (parts.length === 2 && parts[1].length > 2) {
    priceForm.taxRate = parts[0] + '.' + parts[1].substring(0, 2)
  } else {
    priceForm.taxRate = numericValue
  }
  
  // 限制最大值为100
  const numValue = parseFloat(priceForm.taxRate)
  if (numValue > 100) {
    priceForm.taxRate = '100'
  }
  
  // 实时计算不含税价
  calculateTaxExcludedPrice()
}

// 计算不含税价
const calculateTaxExcludedPrice = () => {
  if (priceForm.taxPrice > 0 && priceForm.taxRate) {
    const taxRateValue = parseFloat(priceForm.taxRate)
    if (!isNaN(taxRateValue) && taxRateValue >= 0) {
      const taxRateDecimal = taxRateValue / 100
      priceForm.taxExcludedPrice = parseFloat((priceForm.taxPrice / (1 + taxRateDecimal)).toFixed(2))
    } else {
      priceForm.taxExcludedPrice = 0
    }
  } else {
    priceForm.taxExcludedPrice = 0
  }
}

// 计算税率显示（用于显示区域）
const calculatedTaxRate = computed(() => {
  return priceForm.taxRate ? priceForm.taxRate + '%' : '0%'
})

// props.taskId 现在由后端自动处理，前端无需维护

// 监听弹窗显示状态
watch(dialogVisible, (visible) => {
  // 弹窗打开时的初始化逻辑（如果需要的话）
  if (visible) {
    // props.taskId 现在由后端自动处理，前端无需设置
  }
})

// 监听已选择的物资变化，更新表单数据
watch(selectedMaterial, (newMaterial) => {
  if (newMaterial) {
    priceForm.baseInfoId = newMaterial.id
  } else {
    priceForm.baseInfoId = ''
  }
})

// Tab切换处理
const handleTabChange = (tabName) => {
  activeTab.value = tabName
}

// 加载物资数据到表格
const loadMaterialTableData = async (reset = true) => {
  try {
    if (reset) {
      materialPagination.current = 1
    }

    materialTableLoading.value = true

    // 使用MaterialService搜索基础物资
    const response = await materialService.searchMaterials({
      keyword: materialSearchKeyword.value,
      page: materialPagination.current - 1, // 后端从0开始
      size: materialPagination.size
    })

    if (response && response.data) {
      materialTableData.value = response.data.content || []
      materialPagination.total = response.data.totalElements || 0
    }
  } catch (error) {
    console.error('加载物资数据失败:', error)
    ElMessage.error('加载物资数据失败，请稍后重试')
  } finally {
    materialTableLoading.value = false
  }
}

// 处理物资搜索
const handleMaterialSearch = () => {
  loadMaterialTableData(true)
}

// 处理分页变化
const handleMaterialPageChange = (page) => {
  materialPagination.current = page
  loadMaterialTableData(false)
}

// 处理每页大小变化
const handleMaterialSizeChange = (size) => {
  materialPagination.size = size
  materialPagination.current = 1
  loadMaterialTableData(false)
}

// 选择物资
const selectMaterial = (material) => {
  selectedMaterial.value = {
    id: material.id,
    materialName: material.materialName,
    specificationModel: material.specificationModel,
    unit: material.unit,
    materialCode: material.materialCode
  }
  showMaterialSelector.value = false
}

// 打开物资选择器时加载数据
watch(showMaterialSelector, (visible) => {
  if (visible) {
    loadMaterialTableData(true)
  }
})

// 格式化价格显示
const formatPrice = (price) => {
  if (price == null || price === '') return '0.00'
  return Number(price).toFixed(2)
}

// 提交表单
const handleSubmit = async () => {
  try {
    let formRef, formData, apiCall

    if (activeTab.value === 'baseInfo') {
      formRef = baseInfoFormRef.value
      formData = baseInfoForm
      apiCall = temporaryDataService.createTemporaryBaseInfo
    } else {
      formRef = priceFormRef.value
      formData = priceForm
      apiCall = temporaryDataService.createTemporaryPrice
    }

    // 表单验证
    const valid = await formRef?.validate()
    if (!valid) {
      return
    }

    submitting.value = true

    // 调用对应的API
    await apiCall(formData)

    // 关闭弹窗并触发刷新
    dialogVisible.value = false
    emit('success')

    const successMessage =
      activeTab.value === 'baseInfo' ? '创建临时物资基础信息成功' : '创建临时价格信息成功'
    ElMessage.success(successMessage)
  } catch (error) {
    console.error('创建失败:', error)
    // 错误信息已在service中显示，这里不再重复显示
  } finally {
    submitting.value = false
  }
}

// 关闭弹窗
const handleClose = () => {
  if (!submitting.value) {
    dialogVisible.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  // 重置基础信息表单数据
  Object.keys(baseInfoForm).forEach((key) => {
    baseInfoForm[key] = ''
  })

  // 重置价格信息表单数据
  Object.keys(priceForm).forEach((key) => {
    if (key === 'taxPrice' || key === 'taxExcludedPrice') {
      priceForm[key] = 0
    } else if (key === 'taxRate') {
      priceForm[key] = '13' // 重置为默认税率
    } else {
      priceForm[key] = ''
    }
  })

  // 清除表单验证状态
  baseInfoFormRef.value?.clearValidate()
  priceFormRef.value?.clearValidate()

  // 重置到默认Tab
  activeTab.value = 'baseInfo'

  // 清空选择的物资数据
  selectedMaterial.value = null
  showMaterialSelector.value = false
  materialTableData.value = []
  materialSearchKeyword.value = ''
}
</script>

<style scoped>
.create-data-dialog {
  --el-dialog-padding-primary: 20px;
}
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 55vh;
  overflow: auto;
  border-radius: 8px;
}
/* 物资选择区域样式 */
.material-selection-area {
  width: 100%;
}

.selected-material {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid var(--el-color-primary);
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  transition: all 0.3s ease;
}

.selected-material:hover {
  background: var(--el-color-primary-light-8);
}

.selected-material-info {
  flex: 1;
}

.material-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}

.material-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-item {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 物资选择弹窗样式 */
.material-selector-dialog {
  --el-dialog-padding-primary: 20px;
}

.material-selector-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 500px;
}

.search-section {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.table-section {
  flex: 1;
  overflow: hidden;
}

.pagination-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 表格样式增强 */
.material-selection-table {
  --el-table-header-bg-color: var(--el-color-primary-light-9);
  --el-table-header-text-color: var(--el-color-primary);
}

:deep(.material-selection-table .el-table__header th) {
  font-weight: 600;
}

:deep(.material-selection-table .el-table__body tr:hover) {
  background-color: var(--el-color-primary-light-9);
  cursor: pointer;
}

:deep(.material-selection-table .el-table__body tr:hover td) {
  color: var(--el-color-primary);
}

/* Tab样式 */
.data-tabs {
  margin-bottom: 20px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

:deep(.el-tabs--border-card .el-tabs__header .el-tabs__item) {
  padding: 15px 20px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs--border-card .el-tabs__header .el-tabs__item.is-active) {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-primary-light-8)
  );
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* 表单区域样式 */
.form-section {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary);
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 30px;
  height: 2px;
  background: var(--el-color-primary);
}

/* 价格计算参考区域 */
.price-calc-section {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-primary-light-8)
  );
  border-radius: 6px;
  border-left: 4px solid var(--el-color-primary);
}

.calc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.calc-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}

.calc-item:last-child {
  margin-bottom: 0;
}

.calc-label {
  color: var(--el-text-color-regular);
}

.calc-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

/* 表单提示信息 */
.form-item-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 表单项样式优化 */
:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* 选择框样式 */
:deep(.el-select) {
  width: 100%;
}

/* 数字输入框样式 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__wrapper) {
  padding-left: 15px;
  padding-right: 50px;
}

/* 必填字段标识 */
:deep(.el-form-item.is-required .el-form-item__label::before) {
  content: '*';
  color: var(--el-color-danger);
  margin-right: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.dialog-footer .el-button {
  min-width: 80px;
}

/* 加载状态遮罩 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
}

:deep(.el-loading-spinner) {
  margin-top: -25px;
}

:deep(.el-loading-spinner .circular) {
  width: 42px;
  height: 42px;
  color: var(--el-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-data-dialog {
    --el-dialog-width: 90%;
    --el-dialog-margin-top: 5vh;
  }

  .form-section,
  .price-calc-section {
    padding: 12px;
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  .calc-item {
    font-size: 12px;
  }
}

/* 主题适配 */
@media (prefers-color-scheme: dark) {
  .form-section {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color);
  }

  .section-title {
    color: var(--el-text-color-primary);
  }

  .price-calc-section {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-dark-2),
      rgba(var(--el-color-primary-rgb), 0.1)
    );
  }
}
</style>
