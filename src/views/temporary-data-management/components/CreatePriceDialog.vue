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
                <li><strong>物资名称</strong>：物资的名称</li>
                <li><strong>规格型号</strong>：物资的规格型号（可选）</li>
                <li><strong>季度</strong>：价格对应的季度（如：2024Q1）</li>
                <li><strong>含税价</strong>：物资的含税价格</li>
                <li><strong>单位</strong>：价格单位（如：元/个）</li>
                <li><strong>不含税价</strong>：物资的不含税价格（可选）</li>
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
              <el-table-column prop="quarter" label="季度" width="80" />
              <el-table-column prop="taxPrice" label="含税价" width="80" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="taxExcludedPrice" label="不含税价" width="80" />
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

// 文件导入相关计算属性
const validRecords = computed(() => {
  return importPreview.value.filter(item => item.valid).length
})

const invalidRecords = computed(() => {
  return importPreview.value.filter(item => !item.valid).length
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
  console.log('【CreatePriceDialog】文件变化:', file)

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
    console.log('【CreatePriceDialog】开始解析Excel文件')

    // 这里应该调用实际的Excel解析API
    // const response = await temporaryDataService.parseExcelForPrices(file)

    // 模拟解析结果
    const mockData = [
      {
        materialName: '水泥',
        specificationModel: 'P.O 42.5',
        quarter: '2024Q4',
        taxPrice: 450.00,
        unit: '元/吨',
        taxExcludedPrice: 398.23,
        valid: true
      },
      {
        materialName: '钢筋',
        specificationModel: 'HRB400 Φ12',
        quarter: '2024Q4',
        taxPrice: 3800.00,
        unit: '元/吨',
        taxExcludedPrice: null,
        valid: true
      },
      {
        materialName: '砖块',
        specificationModel: '',
        quarter: '2024Q4',
        taxPrice: null, // 无效数据
        unit: '元/块',
        taxExcludedPrice: null,
        valid: false
      }
    ]

    importPreview.value = mockData
    ElMessage.success(`文件解析完成，共 ${mockData.length} 条记录`)

  } catch (error) {
    console.error('【CreatePriceDialog】解析Excel文件失败:', error)
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
    ['物资名称', '规格型号', '季度', '含税价', '单位', '不含税价'],
    ['水泥', 'P.O 42.5', '2024Q4', '450.00', '元/吨', '398.23'],
    ['钢筋', 'HRB400 Φ12', '2024Q4', '3800.00', '元/吨', ''],
    ['砖块', '标准红砖', '2024Q4', '0.50', '元/块', '0.44']
  ]

  // 创建CSV内容
  const csvContent = templateData.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)

  // 创建下载链接
  const link = document.createElement('a')
  link.href = url
  link.download = '临时价格导入模板.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  ElMessage.success('模板下载完成')
}

// 格式化价格显示
const formatPrice = (price) => {
  if (price == null || price === '') return '0.00'
  return Number(price).toFixed(2)
}

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

    console.log('【CreatePriceDialog】批量导入价格数据:', validData)

    // 这里应该调用批量导入API
    // await temporaryDataService.batchCreateTemporaryPrices({
    //   associatedTaskId: importForm.associatedTaskId,
    //   priceData: validData
    // })

    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 关闭弹窗并触发刷新
    dialogVisible.value = false
    emit('success')

    ElMessage.success(`成功导入 ${validRecords.value} 条价格信息`)
  } catch (error) {
    console.error('批量导入价格信息失败:', error)
    ElMessage.error('导入失败，请重试')
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
  // 重置创建模式
  createMode.value = 'manual'

  // 重置表单数据
  Object.keys(form).forEach(key => {
    if (key === 'taxPrice' || key === 'taxExcludedPrice') {
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

  // 清空基础信息数据（下次打开时重新加载）
  availableBaseInfos.value = []
}
</script>

<style scoped>
.create-price-dialog {
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