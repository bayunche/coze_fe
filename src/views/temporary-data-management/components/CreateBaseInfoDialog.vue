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
    <!-- 创建方式选择 -->
    <el-tabs v-model="createMode" class="create-mode-tabs">
      <!-- 手动创建Tab -->
      <el-tab-pane label="手动创建" name="manual">
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
    </el-tab-pane>

    <!-- 文件导入Tab -->
    <el-tab-pane label="文件导入" name="import">
      <div class="import-section" v-loading="importing">
        <!-- 关联任务ID -->
        <div class="form-section">
          <div class="section-title">关联信息</div>
          <el-form-item label="关联任务ID">
            <el-input
              v-model="importForm.associatedTaskId"
              placeholder="请输入关联的任务ID（选填）"
              clearable
              :disabled="props.taskId && props.taskId.length > 0"
            />
          </el-form-item>
        </div>

        <!-- 文件上传区域 -->
        <div class="form-section">
          <div class="section-title">文件上传</div>
          <el-upload
            ref="uploadRef"
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            drag
            :on-change="handleFileChange"
            :on-exceed="handleFileExceed"
            :before-upload="beforeUpload"
            class="upload-area"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                将Excel文件拖到此处，或<em>点击选择文件</em>
              </div>
              <div class="upload-tip">
                支持 .xlsx 和 .xls 格式，文件大小不超过10MB
              </div>
            </div>
          </el-upload>
        </div>

        <!-- 文件模板下载 -->
        <div class="template-section">
          <div class="section-title">模板下载</div>
          <div class="template-info">
            <p>请按照以下模板格式准备数据：</p>
            <el-button type="primary" link @click="downloadTemplate">
              <el-icon><Download /></el-icon>
              下载Excel模板
            </el-button>
          </div>
          <div class="template-format">
            <h4>必需字段说明：</h4>
            <ul>
              <li><strong>物资名称</strong>：物资的名称（必填）</li>
              <li><strong>规格型号</strong>：物资的规格型号（可选）</li>
              <li><strong>单位</strong>：物资的计量单位（可选）</li>
              <li><strong>物资编码</strong>：物资编码（可选）</li>
              <li><strong>序号</strong>：物资序号（可选）</li>
              <li><strong>业务域</strong>：物资所属业务域（可选）</li>
            </ul>
          </div>
        </div>

        <!-- 导入预览 -->
        <div v-if="importPreview.length > 0" class="preview-section">
          <div class="section-title">导入预览（前5条）</div>
          <el-table
            :data="importPreview.slice(0, 5)"
            size="small"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column prop="materialName" label="物资名称" width="120" />
            <el-table-column prop="specificationModel" label="规格型号" width="120" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="materialCode" label="物资编码" width="100" />
            <el-table-column prop="serialNumber" label="序号" width="80" />
            <el-table-column prop="businessDomain" label="业务域" width="100" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                  {{ row.valid ? '有效' : '无效' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="preview-summary">
            总计 {{ importPreview.length }} 条记录，其中有效 {{ validRecords }} 条，无效 {{ invalidRecords }} 条
          </div>
        </div>
      </div>
    </el-tab-pane>
  </el-tabs>

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
import { UploadFilled, Download } from '@element-plus/icons-vue'
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

// Tab相关
const createMode = ref('manual')

// 文件导入相关
const uploadRef = ref()
const importing = ref(false)
const fileList = ref([])
const importPreview = ref([])
const importForm = reactive({
  associatedTaskId: ''
})

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

// 文件导入相关计算属性
const validRecords = computed(() => {
  return importPreview.value.filter(item => item.valid).length
})

const invalidRecords = computed(() => {
  return importPreview.value.filter(item => !item.valid).length
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
  if (createMode.value === 'manual') {
    await handleManualSubmit()
  } else if (createMode.value === 'import') {
    await handleImportSubmit()
  }
}

// 手动创建提交
const handleManualSubmit = async () => {
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

// 文件导入提交
const handleImportSubmit = async () => {
  try {
    if (importPreview.value.length === 0) {
      ElMessage.warning('请先上传文件并解析数据')
      return
    }

    if (validRecords.value === 0) {
      ElMessage.warning('没有有效的数据可以导入')
      return
    }

    submitting.value = true

    // 只提交有效的记录
    const validData = importPreview.value.filter(item => item.valid)

    console.log('【CreateBaseInfoDialog】批量导入物资基础信息:', validData)

    // 这里应该调用批量导入API
    // await temporaryDataService.batchCreateTemporaryBaseInfos({
    //   associatedTaskId: importForm.associatedTaskId,
    //   baseInfoData: validData
    // })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 关闭弹窗并触发刷新
    dialogVisible.value = false
    emit('success')

    ElMessage.success(`成功导入 ${validRecords.value} 条物资基础信息`)
  } catch (error) {
    console.error('批量导入物资基础信息失败:', error)
    ElMessage.error('导入失败，请重试')
  } finally {
    submitting.value = false
  }
}

// ===== 文件导入相关方法 =====

/**
 * 文件上传前验证
 */
const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

/**
 * 文件选择变化处理
 */
const handleFileChange = async (file) => {
  console.log('【CreateBaseInfoDialog】文件变化:', file)

  if (file.status === 'ready') {
    await parseExcelFile(file.raw)
  }
}

/**
 * 文件超限处理
 */
const handleFileExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

/**
 * 解析Excel文件
 */
const parseExcelFile = async (file) => {
  importing.value = true
  try {
    console.log('【CreateBaseInfoDialog】开始解析Excel文件')

    // 这里应该调用实际的Excel解析API
    // const response = await temporaryDataService.parseExcelForBaseInfos(file)

    // 模拟解析结果
    const mockData = [
      {
        materialName: '水泥',
        specificationModel: 'P.O 42.5',
        unit: '吨',
        materialCode: 'SM001',
        serialNumber: '001',
        businessDomain: '建筑材料',
        valid: true
      },
      {
        materialName: '钢筋',
        specificationModel: 'HRB400 Φ12',
        unit: '吨',
        materialCode: 'SM002',
        serialNumber: '002',
        businessDomain: '建筑材料',
        valid: true
      },
      {
        materialName: '', // 无效数据 - 缺少物资名称
        specificationModel: '标准砖',
        unit: '块',
        materialCode: '',
        serialNumber: '003',
        businessDomain: '建筑材料',
        valid: false
      }
    ]

    importPreview.value = mockData
    ElMessage.success(`文件解析完成，共 ${mockData.length} 条记录`)

  } catch (error) {
    console.error('【CreateBaseInfoDialog】解析Excel文件失败:', error)
    ElMessage.error('文件解析失败，请检查文件格式是否正确')
    importPreview.value = []
  } finally {
    importing.value = false
  }
}

/**
 * 下载模板文件
 */
const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    ['物资名称', '规格型号', '单位', '物资编码', '序号', '业务域'],
    ['水泥', 'P.O 42.5', '吨', 'SM001', '001', '建筑材料'],
    ['钢筋', 'HRB400 Φ12', '吨', 'SM002', '002', '建筑材料'],
    ['砖块', '标准红砖', '块', 'SM003', '003', '建筑材料']
  ]

  // 创建CSV内容
  const csvContent = templateData.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)

  // 创建下载链接
  const link = document.createElement('a')
  link.href = url
  link.download = '临时物资基础信息导入模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  ElMessage.success('模板下载完成')
}

// 关闭弹窗
const handleClose = () => {
  if (!submitting.value) {
    dialogVisible.value = false
  }
}

// 弹窗关闭后重置表单
const handleClosed = () => {
  // 重置创建模式
  createMode.value = 'manual'

  // 重置表单数据
  Object.keys(form).forEach(key => {
    if (key === 'mainDistributionType') {
      form[key] = 0
    } else {
      form[key] = ''
    }
  })

  // 重置文件导入相关状态
  fileList.value = []
  importPreview.value = []
  importForm.associatedTaskId = ''

  // 清除表单验证状态
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.create-base-info-dialog {
  --el-dialog-padding-primary: 20px;
}

/* Tab样式 */
.create-mode-tabs {
  margin-bottom: 16px;
}

.create-mode-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

/* 文件导入区域样式 */
.import-section {
  padding: 16px 0;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-content {
  text-align: center;
  padding: 40px 20px;
}

.upload-icon {
  font-size: 40px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.upload-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 模板区域样式 */
.template-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.template-info {
  margin-bottom: 12px;
}

.template-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.template-format {
  margin-top: 16px;
}

.template-format h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.template-format ul {
  margin: 0;
  padding-left: 20px;
}

.template-format li {
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* 预览区域样式 */
.preview-section {
  margin-top: 24px;
}

.preview-summary {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--el-color-info-light-9);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
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