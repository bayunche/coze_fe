<template>
  <el-dialog
    :model-value="show"
    :title="`${currentFunctionName}`"
    width="40vw"
    draggable
    @update:model-value="updateShow"
    @close="closeDialog"
  >
    <div class="workflow-config">
      <el-form :model="config">
        <!-- 通用文件上传组件 -->
        <el-form-item v-if="needsFileUpload && !isOwnerMaterial">
          <el-upload
            ref="uploadRef"
            :file-list="config.files"
            @change="handleFileListChange"
            :auto-upload="false"
            multiple
            :limit="FILE_UPLOAD_CONFIG.DEFAULT_LIMIT"
            :drag="true"
            :accept="acceptFileTypes"
            :before-upload="beforeUpload"
            :on-exceed="exceedFileLimit"
            class="upload-demo"
          >
            <div class="el-upload-dragger-content">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或 <em>点击选择文件</em></div>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 {{ allowedFileTypes }} 格式，最多上传{{ FILE_UPLOAD_CONFIG.DEFAULT_LIMIT }}个文件，文件总大小控制{{ FILE_UPLOAD_CONFIG.MAX_FILE_SIZE }}M之内
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 乙供物资专用参数配置 -->
        <div v-if="needsFileUpload && isSupplierMaterial" class="supplier-material-config">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="指定季度" required>
                <el-select 
                  v-model="localQuarter"
                  placeholder="请选择季度"
                  style="width: 100%"
                  allow-create
                  filterable
                  clearable
                  @visible-change="handleQuarterDropdownToggle"
                  @change="(value) => console.log('季度选择变化:', value)"
                >
                  <el-option
                    v-for="option in quarterOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                  <template #empty>
                    <div class="custom-empty">
                      <el-button type="text" @click="showAddQuarterDialog = true">
                        <el-icon><Plus /></el-icon>
                        添加自定义季度
                      </el-button>
                    </div>
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="指定税率" required>
                <el-select 
                  v-model="localTaxRate"
                  placeholder="请选择税率"
                  style="width: 100%"
                  allow-create
                  filterable
                  clearable
                  @visible-change="handleTaxRateDropdownToggle"
                  @change="(value) => console.log('税率选择变化:', value)"
                >
                  <el-option
                    v-for="option in taxRateOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                  <template #empty>
                    <div class="custom-empty">
                      <el-button type="text" @click="showAddTaxRateDialog = true">
                        <el-icon><Plus /></el-icon>
                        添加自定义税率
                      </el-button>
                    </div>
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <!-- 甲供物资专用上传组件 -->
        <div v-if="needsFileUpload && isOwnerMaterial" class="owner-material-upload-grid">
          <!-- 综合申领文件 -->
          <div class="upload-grid-item">
            <div class="upload-label">{{ UPLOAD_LABELS.COMPREHENSIVE_CLAIM }}</div>
            <el-upload
              ref="comprehensiveClaimRef"
              v-model:file-list="comprehensiveClaimFiles"
              :auto-upload="false"
              :limit="FILE_UPLOAD_CONFIG.SINGLE_FILE_LIMIT"
              drag
              accept=".xls,.xlsx"
              :before-upload="(file) => validateFileBeforeUpload(file, FILE_TYPES.EXCEL)"
              :on-change="updateComprehensiveClaimFiles"
              :on-exceed="(files) => exceedSingleFileLimit(files, comprehensiveClaimRef)"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将Excel文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>

          <!-- 实际用料文件 -->
          <div class="upload-grid-item">
            <div class="upload-label">{{ UPLOAD_LABELS.ACTUAL_USAGE_1 }}</div>
            <el-upload
              ref="actualUsageRef1"
              v-model:file-list="actualUsageFiles1"
              :auto-upload="false"
              :limit="FILE_UPLOAD_CONFIG.SINGLE_FILE_LIMIT"
              drag
              accept=".pdf"
              :before-upload="(file) => validateFileBeforeUpload(file, FILE_TYPES.PDF)"
              :on-change="updateActualUsageFiles1"
              :on-exceed="(files) => exceedSingleFileLimit(files, actualUsageRef1)"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>

          <!-- 实际退料文件 -->
          <div class="upload-grid-item">
            <div class="upload-label">{{ UPLOAD_LABELS.ACTUAL_USAGE_2 }}</div>
            <el-upload
              ref="actualUsageRef2"
              v-model:file-list="actualUsageFiles2"
              :auto-upload="false"
              :limit="FILE_UPLOAD_CONFIG.SINGLE_FILE_LIMIT"
              drag
              accept=".pdf"
              :before-upload="(file) => validateFileBeforeUpload(file, FILE_TYPES.PDF)"
              :on-change="updateActualUsageFiles2"
              :on-exceed="(files) => exceedSingleFileLimit(files, actualUsageRef2)"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>

          <!-- 其他文件 -->
          <div class="upload-grid-item">
            <div class="upload-label">{{ UPLOAD_LABELS.OTHER_FILES }}</div>
            <el-upload
              ref="otherFilesRef"
              v-model:file-list="otherFiles"
              :auto-upload="false"
              multiple
              drag
              :before-upload="() => true"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将其他文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>
        </div>

        <!-- 动态参数配置 -->
        <el-form-item v-for="param in currentFunctionParams" :key="param.key" :label="param.label">
          <el-input
            v-if="param.type === PARAM_TYPES.TEXT"
            :model-value="config.params[param.key]"
            @update:model-value="(value) => updateParam(param.key, value)"
            :placeholder="param.placeholder"
          />
          <el-input-number
            v-else-if="param.type === PARAM_TYPES.NUMBER"
            :model-value="config.params[param.key]"
            @update:model-value="(value) => updateParam(param.key, value)"
            :min="param.min"
            :max="param.max"
          />
          <el-select
            v-else-if="param.type === PARAM_TYPES.SELECT"
            :model-value="config.params[param.key]"
            @update:model-value="(value) => updateParam(param.key, value)"
            :placeholder="param.placeholder"
          >
            <el-option
              v-for="option in param.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-switch 
            v-else-if="param.type === PARAM_TYPES.BOOLEAN" 
            :model-value="config.params[param.key]"
            @update:model-value="(value) => updateParam(param.key, value)" 
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="updateShow(false)">取消</el-button>
        <el-button type="primary" @click="submitWorkflow">开始执行</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加自定义季度对话框 -->
  <el-dialog
    v-model="showAddQuarterDialog"
    title="添加自定义季度"
    width="400px"
    @close="resetCustomQuarter"
  >
    <el-form :model="customQuarter" label-width="80px">
      <el-form-item label="季度标签">
        <el-input 
          v-model="customQuarter.label" 
          placeholder="例如：2024年第一季度"
        />
      </el-form-item>
      <el-form-item label="季度值">
        <el-input 
          v-model="customQuarter.value" 
          placeholder="例如：2024-Q1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddQuarterDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="addCustomQuarter"
        :disabled="!customQuarter.label || !customQuarter.value"
      >
        确定
      </el-button>
    </template>
  </el-dialog>

  <!-- 添加自定义税率对话框 -->
  <el-dialog
    v-model="showAddTaxRateDialog"
    title="添加自定义税率"
    width="400px"
    @close="resetCustomTaxRate"
  >
    <el-form :model="customTaxRate" label-width="80px">
      <el-form-item label="税率标签">
        <el-input 
          v-model="customTaxRate.label" 
          placeholder="例如：15%"
        />
      </el-form-item>
      <el-form-item label="税率值">
        <el-input 
          v-model="customTaxRate.value" 
          placeholder="例如：15%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddTaxRateDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="addCustomTaxRate"
        :disabled="!customTaxRate.label || !customTaxRate.value"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { UploadFilled, Plus } from '@element-plus/icons-vue'
import { 
  FILE_UPLOAD_CONFIG,
  FILE_TYPES,
  UPLOAD_LABELS,
  PARAM_TYPES,
  EMIT_EVENTS,
  SUPPLIER_MATERIAL_CONFIG,
  WORKFLOW_NAMES
} from './constants.js'
import { 
  isOwnerMaterialWorkflow,
  validateFileBeforeUpload,
  formatAcceptFileTypes,
  validateOwnerMaterialFiles,
  buildOwnerMaterialFilesList,
  clearAllUploadFiles,
  handleFileExceed,
  handleSingleFileExceed
} from './utils.js'

const props = defineProps({
  show: Boolean,
  currentFunctionName: String,
  config: Object,
  needsFileUpload: Boolean,
  allowedFileTypes: String,
  currentFunctionParams: Array
})

const emit = defineEmits([
  EMIT_EVENTS.UPDATE_SHOW,
  EMIT_EVENTS.CLOSE,
  EMIT_EVENTS.START_WORKFLOW,
  'update:config'
])

// 上传组件引用
const uploadRef = ref(null)
const comprehensiveClaimRef = ref(null)
const actualUsageRef1 = ref(null)
const actualUsageRef2 = ref(null)
const otherFilesRef = ref(null)

// 甲供物资文件状态
const comprehensiveClaimFiles = ref([])
const actualUsageFiles1 = ref([])
const actualUsageFiles2 = ref([])
const otherFiles = ref([])

// 乙供物资相关状态
const showAddQuarterDialog = ref(false)
const showAddTaxRateDialog = ref(false)
const customQuarter = ref({ label: '', value: '' })
const customTaxRate = ref({ label: '', value: '' })
const quarterOptions = ref([...SUPPLIER_MATERIAL_CONFIG.QUARTER_OPTIONS])
const taxRateOptions = ref([...SUPPLIER_MATERIAL_CONFIG.TAX_RATE_OPTIONS])

// 本地状态管理选择框的值
const localQuarter = ref('')
const localTaxRate = ref('')

// 计算属性
const isOwnerMaterial = computed(() => isOwnerMaterialWorkflow(props.currentFunctionName))
const isSupplierMaterial = computed(() => props.currentFunctionName === WORKFLOW_NAMES.SUPPLIER_MATERIAL)
const acceptFileTypes = computed(() => formatAcceptFileTypes(props.allowedFileTypes))

// 更新配置的辅助函数
const updateConfig = (key, value) => {
  if (key === 'files') {
    // 对于文件，直接修改props.config（保持原有行为）
    // eslint-disable-next-line vue/no-mutating-props
    props.config[key] = value
  } else {
    // 对于其他属性，直接修改props.config
    // eslint-disable-next-line vue/no-mutating-props
    props.config[key] = value
  }
}

// 更新参数的辅助函数
const updateParam = (key, value) => {
  const newConfig = { ...props.config }
  if (!newConfig.params) {
    newConfig.params = {}
  }
  newConfig.params[key] = value
  emit('update:config', newConfig)
}

// 文件列表变更处理
const handleFileListChange = (file, fileList) => {
  console.log('[WorkflowConfigDialog] 文件列表变更:', fileList)
  updateConfig('files', fileList)
}

// 同步本地状态到配置
watch(localQuarter, (newValue) => {
  if (newValue && newValue !== props.config.quarter) {
    updateConfig('quarter', newValue)
  }
})

watch(localTaxRate, (newValue) => {
  if (newValue && newValue !== props.config.taxRate) {
    updateConfig('taxRate', newValue)
  }
})

// 从配置同步到本地状态
watch(() => props.config.quarter, (newValue) => {
  if (newValue && newValue !== localQuarter.value) {
    localQuarter.value = newValue
  }
})

watch(() => props.config.taxRate, (newValue) => {
  if (newValue && newValue !== localTaxRate.value) {
    localTaxRate.value = newValue
  }
})

// 初始化乙供物资默认值
watch(() => [props.show, props.currentFunctionName], ([newShow, newFunctionName]) => {
  if (newShow && newFunctionName === WORKFLOW_NAMES.SUPPLIER_MATERIAL) {
    // 初始化本地状态
    localQuarter.value = props.config.quarter || SUPPLIER_MATERIAL_CONFIG.DEFAULT_QUARTER
    localTaxRate.value = props.config.taxRate || SUPPLIER_MATERIAL_CONFIG.DEFAULT_TAX_RATE
    
    // 确保配置有默认值
    if (!props.config.quarter) {
      updateConfig('quarter', SUPPLIER_MATERIAL_CONFIG.DEFAULT_QUARTER)
    }
    if (!props.config.taxRate) {
      updateConfig('taxRate', SUPPLIER_MATERIAL_CONFIG.DEFAULT_TAX_RATE)
    }
  }
}, { immediate: true })

// 文件变更处理方法
const updateComprehensiveClaimFiles = (file, fileList) => {
  comprehensiveClaimFiles.value = fileList
}

const updateActualUsageFiles1 = (file, fileList) => {
  actualUsageFiles1.value = fileList
}

const updateActualUsageFiles2 = (file, fileList) => {
  actualUsageFiles2.value = fileList
}

// 文件超限处理方法
const exceedSingleFileLimit = (files, uploadRef) => {
  handleSingleFileExceed(files, uploadRef)
}

const exceedFileLimit = (files) => {
  handleFileExceed(files, props.config.files?.length || 0)
}

// 通用文件验证方法
const beforeUpload = (rawFile) => {
  return validateFileBeforeUpload(rawFile)
}

// 对话框事件处理
const updateShow = (value) => {
  emit(EMIT_EVENTS.UPDATE_SHOW, value)
}

const closeDialog = () => {
  const refs = {
    uploadRef,
    comprehensiveClaimRef,
    actualUsageRef1,
    actualUsageRef2,
    otherFilesRef
  }
  
  clearAllUploadFiles(refs)
  
  // 重置文件状态
  comprehensiveClaimFiles.value = []
  actualUsageFiles1.value = []
  actualUsageFiles2.value = []
  otherFiles.value = []

  emit(EMIT_EVENTS.CLOSE)
}

// 自定义选项相关方法
const handleQuarterDropdownToggle = () => {
  // 下拉框打开时的处理逻辑（如果需要）
}

const handleTaxRateDropdownToggle = () => {
  // 下拉框打开时的处理逻辑（如果需要）
}

const addCustomQuarter = () => {
  if (customQuarter.value.label && customQuarter.value.value) {
    const newOption = {
      label: customQuarter.value.label,
      value: customQuarter.value.value
    }
    
    // 检查是否已存在
    const exists = quarterOptions.value.some(option => option.value === newOption.value)
    if (!exists) {
      quarterOptions.value.push(newOption)
      updateConfig('quarter', newOption.value)
    }
    
    showAddQuarterDialog.value = false
    resetCustomQuarter()
  }
}

const addCustomTaxRate = () => {
  if (customTaxRate.value.label && customTaxRate.value.value) {
    const newOption = {
      label: customTaxRate.value.label,
      value: customTaxRate.value.value
    }
    
    // 检查是否已存在
    const exists = taxRateOptions.value.some(option => option.value === newOption.value)
    if (!exists) {
      taxRateOptions.value.push(newOption)
      updateConfig('taxRate', newOption.value)
    }
    
    showAddTaxRateDialog.value = false
    resetCustomTaxRate()
  }
}

const resetCustomQuarter = () => {
  customQuarter.value = { label: '', value: '' }
}

const resetCustomTaxRate = () => {
  customTaxRate.value = { label: '', value: '' }
}

const submitWorkflow = () => {
  if (isOwnerMaterial.value) {
    // 验证甲供物资必需文件
    if (!validateOwnerMaterialFiles(
      comprehensiveClaimFiles.value,
      actualUsageFiles1.value,
      actualUsageFiles2.value
    )) {
      return
    }

    // 构建文件列表
    const filesList = buildOwnerMaterialFilesList(
      comprehensiveClaimFiles.value,
      actualUsageFiles1.value,
      actualUsageFiles2.value,
      otherFiles.value
    )
    updateConfig('files', filesList)
  }

  emit(EMIT_EVENTS.START_WORKFLOW)
}
</script>

<style scoped>
.workflow-config {
  max-height: 60vh;
  overflow-y: auto;
}

.supplier-material-config {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background-color: var(--el-fill-color-blank);
}

.custom-empty {
  padding: 8px;
  text-align: center;
}

.custom-empty .el-button {
  color: var(--el-color-primary);
}

.owner-material-upload-grid {
  position: relative;
  width: 100%;
  height: 488px;
}

.upload-grid-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: calc(50% - 12px);
  height: 220px;
}

.upload-grid-item:nth-child(1) {
  top: 0;
  left: 0;
}
.upload-grid-item:nth-child(2) {
  top: 0;
  left: calc(50% + 12px);
}
.upload-grid-item:nth-child(3) {
  top: 244px;
  left: 0;
}
.upload-grid-item:nth-child(4) {
  top: 244px;
  left: calc(50% + 12px);
}

.upload-label {
  font-size: 14px;
  color: #1c1e21;
  margin-bottom: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.upload-demo {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upload-demo :deep(.el-upload) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  background-color: transparent;
  border: 1.5px dashed #ced0d4;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-height: 120px;
}

.upload-demo :deep(.el-upload-dragger):hover,
.upload-demo :deep(.el-upload-dragger.is-dragover) {
  border-color: #0052ff;
  background-color: rgba(0, 82, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 82, 255, 0.1);
}

.upload-demo .el-upload-dragger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #65676b;
}

.upload-demo :deep(.el-upload-dragger) .el-icon--upload {
  font-size: 36px;
  margin-bottom: 12px;
  color: #0052ff;
}

.upload-demo :deep(.el-upload-dragger) .el-upload__text {
  color: #1c1e21;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.upload-demo :deep(.el-upload-dragger) .el-upload__text em {
  color: #0052ff;
  font-style: normal;
  font-weight: 600;
}

.upload-demo :deep(.el-upload__tip) {
  display: none;
}

.upload-demo :deep(.el-upload-list) {
  margin-top: 12px;
  height: 54px;
  overflow-y: auto;
  border: none;
  border-radius: 0;
  padding: 0;
  background-color: transparent;
}

.upload-demo :deep(.el-upload-list::-webkit-scrollbar) {
  width: 4px;
}
.upload-demo :deep(.el-upload-list::-webkit-scrollbar-thumb) {
  background: #dcdfe6;
  border-radius: 4px;
}
.upload-demo :deep(.el-upload-list::-webkit-scrollbar-track) {
  background: transparent;
}

.upload-demo :deep(.el-upload-list__item) {
  margin-top: 0 !important;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition:
    box-shadow 0.2s ease-in-out,
    transform 0.2s ease-in-out;
}

.upload-demo :deep(.el-upload-list__item:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.upload-demo :deep(.el-upload-list__item .el-icon) {
  vertical-align: middle;
  color: #65676b;
}

.upload-demo :deep(.el-upload-list__item-name) {
  padding: 0 8px;
  color: #1c1e21;
  font-size: 14px;
  font-weight: 500;
}

.upload-demo :deep(.el-upload-list__item .el-upload-list__item-status-label) {
  vertical-align: middle;
}

.upload-demo :deep(.el-upload-list__item .el-icon--close) {
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 16px;
}
.upload-demo :deep(.el-upload-list__item .el-icon--close:hover) {
  color: #ff4d4f;
}
</style>