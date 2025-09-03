<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建临时价格信息"
    width="500px"
    :before-close="handleClose"
    append-to-body
    @closed="handleClosed"
    class="create-price-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
      v-loading="submitting"
    >
      <!-- 关联信息 -->
      <div class="form-section">
        <div class="section-title">关联信息</div>
        <el-form-item label="关联任务ID" prop="associatedTaskId">
          <el-input
            v-model="form.associatedTaskId"
            placeholder="请输入关联的任务ID（选填）"
            clearable
            :disabled="props.taskId && props.taskId.length > 0"
          />
        </el-form-item>

        <el-form-item label="选择基础物资" prop="baseInfoId" required>
          <el-select
            v-model="form.baseInfoId"
            placeholder="请选择要添加价格的基础物资"
            clearable
            filterable
            :loading="loadingBaseInfos"
            @focus="handleLoadBaseInfos"
            style="width: 100%"
          >
            <el-option
              v-for="baseInfo in availableBaseInfos"
              :key="baseInfo.id"
              :label="`${baseInfo.materialName} (${baseInfo.specificationModel || '无规格'}) - ${baseInfo.id}`"
              :value="baseInfo.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>{{ baseInfo.materialName }}</span>
                <span style="color: var(--el-text-color-secondary); font-size: 12px;">
                  {{ baseInfo.specificationModel || '无规格' }}
                </span>
              </div>
            </el-option>
          </el-select>
          <div class="form-item-tip">
            选择已存在的基础物资信息，包括正式数据和临时数据
          </div>
        </el-form-item>
      </div>

      <!-- 价格信息 -->
      <div class="form-section">
        <div class="section-title">价格信息</div>
        <el-form-item label="季度" prop="quarter" required>
          <el-select
            v-model="form.quarter"
            placeholder="请选择季度"
            clearable
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
        </el-form-item>

        <el-form-item label="含税价" prop="taxPrice" required>
          <el-input-number
            v-model="form.taxPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入含税价"
          />
          <div class="form-item-tip">单位：元</div>
        </el-form-item>

        <el-form-item label="不含税价" prop="taxExcludedPrice">
          <el-input-number
            v-model="form.taxExcludedPrice"
            :min="0"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入不含税价（选填）"
          />
          <div class="form-item-tip">单位：元，选填项</div>
        </el-form-item>

        <el-form-item label="价格单位" prop="unit">
          <el-input
            v-model="form.unit"
            placeholder="请输入价格单位（如：元/个、元/台、元/套等）"
            clearable
          />
          <div class="form-item-tip">
            常用单位：元/个、元/台、元/套、元/件、元/批、元/米、元/公斤、元/吨
          </div>
        </el-form-item>
      </div>

      <!-- 价格计算提示 -->
      <div class="price-calc-section" v-if="form.taxPrice > 0">
        <div class="calc-title">价格计算参考</div>
        <div class="calc-item">
          <span class="calc-label">含税价：</span>
          <span class="calc-value">{{ formatPrice(form.taxPrice) }}</span>
        </div>
        <div class="calc-item" v-if="form.taxExcludedPrice > 0">
          <span class="calc-label">不含税价：</span>
          <span class="calc-value">{{ formatPrice(form.taxExcludedPrice) }}</span>
        </div>
        <div class="calc-item" v-if="form.taxPrice > 0 && form.taxExcludedPrice > 0">
          <span class="calc-label">税率：</span>
          <span class="calc-value">{{ calculatedTaxRate }}%</span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="submitting">
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ submitting ? '创建中...' : '确定创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import temporaryDataService from '@/services/TemporaryDataService'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  taskId: {
    type: String,
    default: ''
  },
  baseInfoId: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'success'])

// 响应式数据
const formRef = ref()
const submitting = ref(false)
const loadingBaseInfos = ref(false)
const availableBaseInfos = ref([])

// 表单数据
const form = reactive({
  associatedTaskId: '', // 关联的任务ID（必填）
  baseInfoId: '', // 关联基础信息ID（必填）
  quarter: '', // 季度（必填）
  taxPrice: 0, // 含税价（必填）
  taxExcludedPrice: 0, // 不含税价
  unit: '' // 价格单位
})

// 表单验证规则
const rules = {
  associatedTaskId: [
    { max: 100, message: '任务ID长度不能超过 100 个字符', trigger: 'blur' }
  ],
  baseInfoId: [
    { required: true, message: '请选择关联的基础物资', trigger: 'change' }
  ],
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
  unit: [
    { max: 50, message: '价格单位长度不能超过 50 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 计算税率
const calculatedTaxRate = computed(() => {
  if (form.taxPrice > 0 && form.taxExcludedPrice > 0) {
    const rate = ((form.taxPrice - form.taxExcludedPrice) / form.taxExcludedPrice * 100)
    return rate.toFixed(2)
  }
  return '0.00'
})

// 监听props变化
watch(() => props.taskId, (newTaskId) => {
  if (newTaskId) {
    form.associatedTaskId = newTaskId
  }
}, { immediate: true })

watch(() => props.baseInfoId, (newBaseInfoId) => {
  if (newBaseInfoId) {
    form.baseInfoId = newBaseInfoId
  }
}, { immediate: true })

// 监听弹窗显示状态
watch(dialogVisible, (visible) => {
  if (visible) {
    if (props.taskId) {
      form.associatedTaskId = props.taskId
    }
    if (props.baseInfoId) {
      form.baseInfoId = props.baseInfoId
    }
    
    // 弹窗打开时加载基础信息
    if (availableBaseInfos.value.length === 0) {
      handleLoadBaseInfos()
    }
  }
})

// 加载可选的基础信息
const handleLoadBaseInfos = async () => {
  if (loadingBaseInfos.value) {
    return
  }
  
  try {
    loadingBaseInfos.value = true
    
    // 查询所有基础信息（包括正式数据和临时数据）
    const response = await temporaryDataService.queryTemporaryData({
      dataType: 'baseInfo',
      page: 0,
      size: 1000 // 获取足够多的数据供选择
    })
    
    const baseInfos = []
    
    // 添加临时基础信息
    if (response.data?.temporaryBaseInfos) {
      response.data.temporaryBaseInfos.forEach(item => {
        baseInfos.push({
          id: item.id,
          materialName: item.materialName,
          specificationModel: item.specificationModel,
          unit: item.unit,
          materialCode: item.materialCode,
          isTemporary: true
        })
      })
    }
    
    // 这里可以添加查询正式基础信息的逻辑
    // TODO: 如果需要查询正式基础信息，可以调用相应的API
    
    availableBaseInfos.value = baseInfos
    
  } catch (error) {
    console.error('加载基础信息失败:', error)
    ElMessage.error('加载基础物资信息失败，请稍后重试')
  } finally {
    loadingBaseInfos.value = false
  }
}

// 格式化价格显示
const formatPrice = (price) => {
  if (price == null || price === '') return '0.00'
  return Number(price).toFixed(2)
}

// 提交表单
const handleSubmit = async () => {
  try {
    // 表单验证
    const valid = await formRef.value?.validate()
    if (!valid) {
      return
    }

    submitting.value = true
    
    // 调用API创建临时价格信息
    await temporaryDataService.createTemporaryPrice({
      associatedTaskId: form.associatedTaskId,
      baseInfoId: form.baseInfoId,
      quarter: form.quarter,
      taxPrice: form.taxPrice,
      taxExcludedPrice: form.taxExcludedPrice || 0,
      unit: form.unit
    })

    // 关闭弹窗并触发刷新
    dialogVisible.value = false
    emit('success')
    
    ElMessage.success('创建临时价格信息成功')
  } catch (error) {
    console.error('创建临时价格信息失败:', error)
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
  // 重置表单数据
  Object.keys(form).forEach(key => {
    if (key === 'taxPrice' || key === 'taxExcludedPrice') {
      form[key] = 0
    } else {
      form[key] = ''
    }
  })
  
  // 清除表单验证状态
  formRef.value?.clearValidate()
  
  // 清空基础信息数据（下次打开时重新加载）
  availableBaseInfos.value = []
}
</script>

<style scoped>
.create-price-dialog {
  --el-dialog-padding-primary: 20px;
}

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
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
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

/* 禁用状态输入框 */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: var(--el-fill-color-light);
  box-shadow: 0 0 0 1px var(--el-border-color-extra-light) inset;
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
  .create-price-dialog {
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
    background: linear-gradient(135deg, 
      var(--el-color-primary-dark-2), 
      rgba(var(--el-color-primary-rgb), 0.1));
  }
}
</style>