<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建临时物资基础信息"
    width="600px"
    :before-close="handleClose"
    append-to-body
    @closed="handleClosed"
    class="create-base-info-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      label-position="left"
      v-loading="submitting"
    >
      <!-- 关联任务信息 -->
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
      </div>

      <!-- 基础信息 -->
      <div class="form-section">
        <div class="section-title">基础信息</div>
        <el-form-item label="物资名称" prop="materialName" required>
          <el-input
            v-model="form.materialName"
            placeholder="请输入物资名称"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="规格型号" prop="specificationModel">
          <el-input
            v-model="form.specificationModel"
            placeholder="请输入规格型号"
            clearable
          />
        </el-form-item>

        <el-form-item label="单位" prop="unit">
          <el-input
            v-model="form.unit"
            placeholder="请输入单位（如：个、台、套）"
            clearable
          />
        </el-form-item>
      </div>

      <!-- 编码信息 -->
      <div class="form-section">
        <div class="section-title">编码信息</div>
        <el-form-item label="序号" prop="serialNumber">
          <el-input
            v-model="form.serialNumber"
            placeholder="请输入序号"
            clearable
          />
        </el-form-item>

        <el-form-item label="信息价编码" prop="priceCode">
          <el-input
            v-model="form.priceCode"
            placeholder="请输入信息价编码"
            clearable
          />
        </el-form-item>

        <el-form-item label="物资编码" prop="materialCode">
          <el-input
            v-model="form.materialCode"
            placeholder="请输入物资编码"
            clearable
          />
        </el-form-item>
      </div>

      <!-- 分类信息 -->
      <div class="form-section">
        <div class="section-title">分类信息</div>
        <el-form-item label="业务域" prop="businessDomain">
          <el-input
            v-model="form.businessDomain"
            placeholder="请输入业务域"
            clearable
          />
        </el-form-item>

        <el-form-item label="主/配标识" prop="mainDistributionNetwork">
          <el-select
            v-model="form.mainDistributionNetwork"
            placeholder="请选择主/配标识"
            clearable
          >
            <el-option label="主网" value="主网" />
            <el-option label="配网" value="配网" />
          </el-select>
        </el-form-item>

        <el-form-item label="主/配类型" prop="mainDistributionType">
          <el-input-number
            v-model="form.mainDistributionType"
            :min="0"
            :max="10"
            placeholder="请输入主/配类型"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="物资类型" prop="type">
          <el-input
            v-model="form.type"
            placeholder="请输入物资类型"
            clearable
          />
        </el-form-item>
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
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'success'])

// 响应式数据
const formRef = ref()
const submitting = ref(false)

// 表单数据
const form = reactive({
  associatedTaskId: '', // 关联的任务ID（必填）
  materialName: '', // 物资名称（必填）
  specificationModel: '', // 规格型号
  unit: '', // 单位
  serialNumber: '', // 序号
  priceCode: '', // 信息价编码
  materialCode: '', // 物资编码
  businessDomain: '', // 业务域
  mainDistributionNetwork: '', // 主/配标识
  mainDistributionType: 0, // 主/配类型
  type: '' // 物资类型
})

// 表单验证规则
const rules = {
  associatedTaskId: [
    { max: 100, message: '任务ID长度不能超过 100 个字符', trigger: 'blur' }
  ],
  materialName: [
    { required: true, message: '请输入物资名称', trigger: 'blur' },
    { min: 1, max: 200, message: '物资名称长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  specificationModel: [
    { max: 200, message: '规格型号长度不能超过 200 个字符', trigger: 'blur' }
  ],
  unit: [
    { max: 50, message: '单位长度不能超过 50 个字符', trigger: 'blur' }
  ],
  serialNumber: [
    { max: 50, message: '序号长度不能超过 50 个字符', trigger: 'blur' }
  ],
  priceCode: [
    { max: 100, message: '信息价编码长度不能超过 100 个字符', trigger: 'blur' }
  ],
  materialCode: [
    { max: 100, message: '物资编码长度不能超过 100 个字符', trigger: 'blur' }
  ],
  businessDomain: [
    { max: 100, message: '业务域长度不能超过 100 个字符', trigger: 'blur' }
  ],
  mainDistributionNetwork: [
    { max: 50, message: '主/配标识长度不能超过 50 个字符', trigger: 'blur' }
  ],
  type: [
    { max: 100, message: '物资类型长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 监听taskId变化
watch(() => props.taskId, (newTaskId) => {
  if (newTaskId) {
    form.associatedTaskId = newTaskId
  }
}, { immediate: true })

// 监听弹窗显示状态
watch(dialogVisible, (visible) => {
  if (visible && props.taskId) {
    form.associatedTaskId = props.taskId
  }
})

// 提交表单
const handleSubmit = async () => {
  try {
    // 表单验证
    const valid = await formRef.value?.validate()
    if (!valid) {
      return
    }

    submitting.value = true
    
    // 调用API创建临时基础信息
    await temporaryDataService.createTemporaryBaseInfo({
      associatedTaskId: form.associatedTaskId,
      materialName: form.materialName,
      specificationModel: form.specificationModel,
      unit: form.unit,
      serialNumber: form.serialNumber,
      priceCode: form.priceCode,
      materialCode: form.materialCode,
      businessDomain: form.businessDomain,
      mainDistributionNetwork: form.mainDistributionNetwork,
      mainDistributionType: form.mainDistributionType,
      type: form.type
    })

    // 关闭弹窗并触发刷新
    dialogVisible.value = false
    emit('success')
    
    ElMessage.success('创建临时物资基础信息成功')
  } catch (error) {
    console.error('创建临时基础信息失败:', error)
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
    if (key === 'mainDistributionType') {
      form[key] = 0
    } else {
      form[key] = ''
    }
  })
  
  // 清除表单验证状态
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.create-base-info-dialog {
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
  .create-base-info-dialog {
    --el-dialog-width: 90%;
    --el-dialog-margin-top: 5vh;
  }
  
  .form-section {
    padding: 12px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
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
}
</style>