<template>
  <el-dialog
    v-model="dialogVisible"
    title="新增物资价格信息"
    width="600px"
    :before-close="handleClose"
    append-to-body
    @closed="handleClosed"
    class="add-price-dialog"
  >
    <div class="dialog-content" v-loading="submitting">
      <!-- 物资信息展示区域 -->
      <div class="material-info-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>物资信息</span>
        </div>
        <div class="material-info-content">
          <div class="info-row">
            <span class="label">物资名称：</span>
            <span class="value">{{ materialInfo.displayName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">规格型号：</span>
            <span class="value">{{ materialInfo.displaySpec || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">计量单位：</span>
            <span class="value">{{ materialInfo.displayUnit || '-' }}</span>
          </div>
          <div class="info-row" v-if="materialInfo.id">
            <span class="label">基础物资ID：</span>
            <span class="value">{{ materialInfo.id }}</span>
          </div>
        </div>
      </div>

      <!-- 价格信息Tab页面 -->
      <el-tabs v-model="activeTab" class="price-tabs">
        <!-- 新建价格Tab -->
        <el-tab-pane label="新建价格" name="create">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            label-position="left"
            class="price-form"
          >
            <div class="form-section">
              <div class="section-title">
                <el-icon><Money /></el-icon>
                <span>价格信息</span>
              </div>

              <!-- 季度选择 -->
              <el-form-item label="季度" prop="quarter" required>
                <el-select
                  v-model="form.quarter"
                  placeholder="请选择季度"
                  clearable
                  style="width: 100%"
                >
                  <el-option label="2024年第一季度" value="2024Q1" />
                  <el-option label="2024年第二季度" value="2024Q2" />
                  <el-option label="2024年第三季度" value="2024Q3" />
                  <el-option label="2024年第四季度" value="2024Q4" />
                  <el-option label="2025年第一季度" value="2025Q1" />
                  <el-option label="2025年第二季度" value="2025Q2" />
                  <el-option label="2025年第三季度" value="2025Q3" />
                  <el-option label="2025年第四季度" value="2025Q4" />
                </el-select>
                <div class="form-tip">选择价格对应的结算季度</div>
              </el-form-item>

              <!-- 含税价 -->
              <el-form-item label="含税价" prop="taxPrice" required>
                <el-input-number
                  v-model="form.taxPrice"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  style="width: 100%"
                  placeholder="请输入含税价"
                  controls-position="right"
                />
                <div class="form-tip">单位：元，精确到分</div>
              </el-form-item>

              <!-- 不含税价 -->
              <el-form-item label="不含税价" prop="taxExcludedPrice">
                <el-input-number
                  v-model="form.taxExcludedPrice"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  style="width: 100%"
                  placeholder="请输入不含税价（选填）"
                  controls-position="right"
                />
                <div class="form-tip">单位：元，选填项，精确到分</div>
              </el-form-item>

              <!-- 税率 -->
              <el-form-item label="税率" prop="taxRate">
                <el-input-number
                  v-model="form.taxRate"
                  :min="0"
                  :max="1"
                  :precision="4"
                  :step="0.0001"
                  style="width: 100%"
                  placeholder="请输入税率（选填）"
                  controls-position="right"
                />
                <div class="form-tip">范围：0-1，如0.13表示13%税率</div>
              </el-form-item>
            </div>
          </el-form>
        </el-tab-pane>

        <!-- 选择现有价格Tab -->
        <el-tab-pane label="选择现有价格" name="select">
          <div class="existing-price-section">
            <!-- 季度筛选 -->
            <el-form-item label="选择季度" class="quarter-filter">
              <el-select
                v-model="selectedQuarter"
                placeholder="请选择有价格的季度"
                clearable
                style="width: 100%"
                @change="handleQuarterChange"
                :loading="loadingQuarters"
              >
                <el-option
                  v-for="quarter in availableQuarters"
                  :key="quarter"
                  :label="getQuarterLabel(quarter)"
                  :value="quarter"
                />
              </el-select>
              <div class="form-tip">只显示该物资有价格的季度</div>
            </el-form-item>

            <!-- 价格列表 -->
            <div class="price-list" v-if="selectedQuarter && existingPrices.length > 0">
              <div class="price-list-header">
                <span>可用价格列表</span>
              </div>
              <el-radio-group v-model="selectedPriceId" class="price-options">
                <el-radio
                  v-for="price in existingPrices"
                  :key="price.id"
                  :label="price.id"
                  class="price-option"
                >
                  <div class="price-info-card">
                    <div class="price-value">
                      <span class="price-amount">￥{{ formatPrice(price.taxPrice) }}</span>
                      <span class="price-type">含税价</span>
                    </div>
                    <div class="price-details">
                      <div v-if="price.taxExcludedPrice" class="detail-item">
                        不含税价：￥{{ formatPrice(price.taxExcludedPrice) }}
                      </div>
                      <div v-if="price.unit" class="detail-item">
                        单位：{{ price.unit }}
                      </div>
                      <div class="detail-item">
                        季度：{{ getQuarterLabel(price.quarter) }}
                      </div>
                    </div>
                  </div>
                </el-radio>
              </el-radio-group>
            </div>

            <!-- 无价格提示 -->
            <div v-else-if="selectedQuarter && existingPrices.length === 0" class="no-price-tip">
              <el-empty description="该季度暂无价格数据" :image-size="80" />
            </div>

            <!-- 未选择季度提示 -->
            <div v-else-if="!selectedQuarter" class="select-quarter-tip">
              <el-empty description="请先选择季度" :image-size="80" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="submitting">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ submitting ? '提交中...' : '确认新增' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElDialog } from 'element-plus'
import { InfoFilled, Money } from '@element-plus/icons-vue'
import temporaryDataService from '@/services/TemporaryDataService.js'

/**
 * 组件说明：
 * 供应商物资价格新增弹窗组件
 *
 * 功能：
 * 1. 自动显示传入的物资基础信息
 * 2. 提供价格信息输入表单
 * 3. 调用临时价格创建接口
 * 4. 处理成功/失败反馈
 */

// ===== Props 定义 =====
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  // 当前操作的行数据，包含物资信息
  rowData: {
    type: Object,
    default: () => ({})
  },
  // 关联的任务ID
  taskId: {
    type: [String, Number],
    default: ''
  },
  // 当前季度（自动带入）
  currentQuarter: {
    type: String,
    default: ''
  }
})

// ===== Emits 定义 =====
const emits = defineEmits(['update:modelValue', 'success', 'cancel'])

// ===== 响应式数据 =====
const formRef = ref(null)
const submitting = ref(false)

// Tab相关状态
const activeTab = ref('create')

// 选择现有价格Tab相关状态
const availableQuarters = ref([])
const selectedQuarter = ref('')
const existingPrices = ref([])
const selectedPriceId = ref(null)
const loadingQuarters = ref(false)
const loadingPrices = ref(false)

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value)
})

// 物资信息（从rowData提取并格式化）
const materialInfo = computed(() => {
  const row = props.rowData || {}

  // 优先使用操作行显示的物资信息（materialName、specifications、unit）
  // 这些是用户在表格中看到的信息，应该与新增价格时的物资信息一致
  let displayName = row.materialName || ''
  let displaySpec = row.specifications || ''
  let displayUnit = row.unit || ''

  // 如果操作行的显示信息为空，再从baseInfo获取
  if (!displayName && row.baseInfo?.materialName) {
    displayName = row.baseInfo.materialName
  }
  if (!displaySpec && row.baseInfo?.specifications) {
    displaySpec = row.baseInfo.specifications
  }
  if (!displayUnit && row.baseInfo?.unit) {
    displayUnit = row.baseInfo.unit
  }

  return {
    // 基础物资ID，用于API调用（从baseInfo获取）
    id: row.baseInfo?.id || row.baseInfo?.baseDataId || null,
    // 显示用的物资信息（优先使用操作行显示的信息）
    displayName: displayName,
    displaySpec: displaySpec,
    displayUnit: displayUnit,
    // 原始数据备用
    originalRow: row
  }
})

// 表单数据
const form = reactive({
  quarter: '',
  taxPrice: null,
  taxExcludedPrice: null,
  taxRate: null
})

// 表单验证规则
const rules = {
  quarter: [
    { required: true, message: '请选择季度', trigger: 'change' }
  ],
  taxPrice: [
    { required: true, message: '请输入含税价', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '含税价必须大于0', trigger: 'blur' }
  ],
  taxExcludedPrice: [
    { type: 'number', min: 0, message: '不含税价不能为负数', trigger: 'blur' }
  ],
  taxRate: [
    { type: 'number', min: 0, max: 1, message: '税率范围应为0-1', trigger: 'blur' }
  ]
}

// ===== 监听器 =====
// 监听对话框打开，重置表单
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      resetForm()
      // 加载可用季度
      loadAvailableQuarters()
    })
  }
})

// ===== 方法定义 =====

/**
 * 重置表单数据
 */
const resetForm = () => {
  console.log('【AddPriceDialog】重置表单数据，当前季度:', props.currentQuarter)

  // 重置Tab到新建价格
  activeTab.value = 'create'

  // 清空表单，但自动设置季度
  Object.assign(form, {
    quarter: props.currentQuarter || '',
    taxPrice: null,
    taxExcludedPrice: null,
    taxRate: null
  })

  // 清空选择现有价格Tab的状态
  selectedQuarter.value = ''
  existingPrices.value = []
  selectedPriceId.value = null
  availableQuarters.value = []

  // 清除验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

/**
 * 处理对话框关闭前的确认
 */
const handleClose = (done) => {
  if (submitting.value) {
    ElMessage.warning('数据提交中，请稍候...')
    return
  }

  done()
}

/**
 * 处理对话框关闭后的清理
 */
const handleClosed = () => {
  console.log('【AddPriceDialog】对话框已关闭，清理数据')
  resetForm()
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  if (submitting.value) {
    ElMessage.warning('数据提交中，请稍候...')
    return
  }

  dialogVisible.value = false
  emits('cancel')
}

/**
 * 表单验证
 */
const validateForm = async () => {
  if (!formRef.value) {
    return false
  }

  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    console.warn('【AddPriceDialog】表单验证失败:', error)
    return false
  }
}

/**
 * 构建API请求参数
 */
const buildRequestParams = () => {
  const params = {
    baseInfoId: materialInfo.value.id,
    quarter: form.quarter,
    taxPrice: form.taxPrice,
    unit: materialInfo.value.displayUnit || ''
  }

  // 可选参数
  if (form.taxExcludedPrice !== null && form.taxExcludedPrice !== undefined) {
    params.taxExcludedPrice = form.taxExcludedPrice
  }

  if (form.taxRate !== null && form.taxRate !== undefined) {
    params.taxRate = form.taxRate
  }

  // 关联任务ID
  if (props.taskId) {
    params.associatedTaskId = props.taskId
  }

  return params
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  console.log('【AddPriceDialog】开始提交价格信息，当前Tab:', activeTab.value)

  if (activeTab.value === 'create') {
    // 新建价格逻辑
    await handleCreatePrice()
  } else if (activeTab.value === 'select') {
    // 选择现有价格逻辑
    await handleSelectExistingPrice()
  }
}

/**
 * 处理新建价格
 */
const handleCreatePrice = async () => {
  // 检查基础物资ID
  if (!materialInfo.value.id) {
    ElMessage.error('物资基础信息不完整，无法创建价格')
    return
  }

  // 表单验证
  const isValid = await validateForm()
  if (!isValid) {
    ElMessage.warning('请检查表单信息')
    return
  }

  submitting.value = true

  try {
    // 构建请求参数
    const params = buildRequestParams()

    console.log('【AddPriceDialog】调用价格创建接口，参数:', params)

    // 调用API创建价格
    const response = await temporaryDataService.createTemporaryPrice(params)

    console.log('【AddPriceDialog】价格创建成功:', response)

    // 成功提示
    ElMessage.success('价格信息创建成功！')

    // 关闭对话框
    dialogVisible.value = false

    // 通知父组件刷新数据
    emits('success', {
      materialInfo: materialInfo.value,
      priceData: params,
      response: response
    })

  } catch (error) {
    console.error('【AddPriceDialog】价格创建失败:', error)

    // 错误提示
    const errorMessage = error.message || error.msg || '价格创建失败，请重试'
    ElMessage.error(errorMessage)

  } finally {
    submitting.value = false
  }
}

/**
 * 处理选择现有价格
 */
const handleSelectExistingPrice = async () => {
  if (!selectedPriceId.value) {
    ElMessage.warning('请选择一个价格')
    return
  }

  submitting.value = true

  try {
    // 找到选中的价格
    const selectedPrice = existingPrices.value.find(p => p.id === selectedPriceId.value)
    if (!selectedPrice) {
      ElMessage.error('选中的价格不存在')
      return
    }

    console.log('【AddPriceDialog】使用现有价格:', selectedPrice)

    // 成功提示
    ElMessage.success('价格选择成功！')

    // 关闭对话框
    dialogVisible.value = false

    // 通知父组件使用选中的价格（不创建新价格）
    emits('success', {
      materialInfo: materialInfo.value,
      selectedPrice: selectedPrice,
      isExistingPrice: true
    })

  } catch (error) {
    console.error('【AddPriceDialog】选择价格失败:', error)
    ElMessage.error('价格选择失败，请重试')
  } finally {
    submitting.value = false
  }
}

// ===== 选择现有价格Tab相关方法 =====

/**
 * 获取季度标签
 */
const getQuarterLabel = (quarter) => {
  const quarterMap = {
    '2024Q1': '2024年第一季度',
    '2024Q2': '2024年第二季度',
    '2024Q3': '2024年第三季度',
    '2024Q4': '2024年第四季度',
    '2025Q1': '2025年第一季度',
    '2025Q2': '2025年第二季度',
    '2025Q3': '2025年第三季度',
    '2025Q4': '2025年第四季度'
  }
  return quarterMap[quarter] || quarter
}

/**
 * 格式化价格显示
 */
const formatPrice = (price) => {
  if (price == null || price === undefined) return '0.00'
  return parseFloat(price).toFixed(2)
}

/**
 * 处理季度选择变化
 */
const handleQuarterChange = async (quarter) => {
  console.log('【AddPriceDialog】季度选择变化:', quarter)
  selectedPriceId.value = null
  existingPrices.value = []

  if (quarter && materialInfo.value.id) {
    await loadExistingPrices(quarter)
  }
}

/**
 * 加载指定季度的现有价格
 */
const loadExistingPrices = async (quarter) => {
  loadingPrices.value = true
  try {
    console.log('【AddPriceDialog】加载现有价格，物资ID:', materialInfo.value.id, '季度:', quarter)

    // 这里需要调用API获取现有价格，暂时模拟数据
    // const response = await temporaryDataService.getMaterialPricesByQuarter(materialInfo.value.id, quarter)

    // 模拟数据
    existingPrices.value = [
      {
        id: 1,
        taxPrice: 100.50,
        taxExcludedPrice: 88.94,
        quarter: quarter,
        unit: '元/个'
      },
      {
        id: 2,
        taxPrice: 99.80,
        taxExcludedPrice: null,
        quarter: quarter,
        unit: '元/个'
      }
    ]

    console.log('【AddPriceDialog】加载到价格列表:', existingPrices.value)
  } catch (error) {
    console.error('【AddPriceDialog】加载现有价格失败:', error)
    ElMessage.error('加载价格数据失败')
    existingPrices.value = []
  } finally {
    loadingPrices.value = false
  }
}

/**
 * 加载可用季度
 */
const loadAvailableQuarters = async () => {
  if (!materialInfo.value.id) return

  loadingQuarters.value = true
  try {
    console.log('【AddPriceDialog】加载可用季度，物资ID:', materialInfo.value.id)

    // 这里需要调用API获取有价格的季度，暂时模拟数据
    // const response = await temporaryDataService.getMaterialAvailableQuarters(materialInfo.value.id)

    // 模拟数据
    availableQuarters.value = ['2024Q3', '2024Q4', '2025Q1']

    console.log('【AddPriceDialog】加载到可用季度:', availableQuarters.value)
  } catch (error) {
    console.error('【AddPriceDialog】加载可用季度失败:', error)
    availableQuarters.value = []
  } finally {
    loadingQuarters.value = false
  }
}
</script>

<style scoped>
/* 对话框整体样式 */
.add-price-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 物资信息展示区域 */
.material-info-section {
  background: var(--theme-card-bg, #f8f9fa);
  border: 1px solid var(--theme-card-border, #e9ecef);
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--theme-text-primary, #333);
  margin-bottom: 12px;
  font-size: 14px;
}

.section-title .el-icon {
  color: var(--theme-primary, #409EFF);
}

.material-info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-row .label {
  color: var(--theme-text-secondary, #666);
  min-width: 80px;
  font-weight: 500;
}

.info-row .value {
  color: var(--theme-text-primary, #333);
  font-weight: 600;
  flex: 1;
}

/* 表单区域 */
.price-form {
  flex: 1;
}

.form-section {
  margin-bottom: 16px;
}

.form-tip {
  font-size: 12px;
  color: var(--theme-text-secondary, #999);
  margin-top: 4px;
  line-height: 1.4;
}

/* 表单项样式优化 */
.price-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.price-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--theme-text-primary, #333);
}

.price-form :deep(.el-input-number) {
  width: 100% !important;
}

.price-form :deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 主题适配 */
[data-theme='dark'] .material-info-section {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='tech-blue'] .material-info-section {
  background: rgba(30, 50, 80, 0.3);
  border-color: rgba(100, 150, 255, 0.2);
}

/* Tab样式 */
.price-tabs {
  margin-top: 16px;
}

.price-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.price-tabs :deep(.el-tab-pane) {
  min-height: 300px;
}

/* 选择现有价格Tab样式 */
.existing-price-section {
  padding: 16px 0;
}

.quarter-filter {
  margin-bottom: 20px;
}

.price-list {
  margin-top: 16px;
}

.price-list-header {
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--theme-text-primary, #333);
  font-size: 14px;
}

.price-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-option :deep(.el-radio__label) {
  width: 100%;
  padding: 0;
  margin-left: 12px;
}

.price-info-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--theme-card-bg, #f8f9fa);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
}

.price-info-card:hover {
  border-color: var(--theme-primary, #409EFF);
  background: var(--theme-primary-light, rgba(64, 158, 255, 0.1));
}

.price-value {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.price-amount {
  font-size: 18px;
  font-weight: 600;
  color: var(--theme-text-primary, #333);
}

.price-type {
  font-size: 12px;
  color: var(--theme-text-secondary, #666);
  margin-top: 2px;
}

.price-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.detail-item {
  font-size: 12px;
  color: var(--theme-text-secondary, #666);
}

.no-price-tip,
.select-quarter-tip {
  padding: 40px 0;
  text-align: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .add-price-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto !important;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-row .label {
    min-width: auto;
  }

  .price-info-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .price-details {
    align-items: flex-start;
    align-self: stretch;
  }
}
</style>