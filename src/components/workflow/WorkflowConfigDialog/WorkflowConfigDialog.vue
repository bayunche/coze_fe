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
            v-model:file-list="config.files"
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
            v-model="config.params[param.key]"
            :placeholder="param.placeholder"
          />
          <el-input-number
            v-else-if="param.type === PARAM_TYPES.NUMBER"
            v-model="config.params[param.key]"
            :min="param.min"
            :max="param.max"
          />
          <el-select
            v-else-if="param.type === PARAM_TYPES.SELECT"
            v-model="config.params[param.key]"
            :placeholder="param.placeholder"
          >
            <el-option
              v-for="option in param.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-switch v-else-if="param.type === PARAM_TYPES.BOOLEAN" v-model="config.params[param.key]" />
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { 
  FILE_UPLOAD_CONFIG,
  FILE_TYPES,
  UPLOAD_LABELS,
  PARAM_TYPES,
  EMIT_EVENTS
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
  EMIT_EVENTS.START_WORKFLOW
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

// 计算属性
const isOwnerMaterial = computed(() => isOwnerMaterialWorkflow(props.currentFunctionName))
const acceptFileTypes = computed(() => formatAcceptFileTypes(props.allowedFileTypes))

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
    props.config.files = buildOwnerMaterialFilesList(
      comprehensiveClaimFiles.value,
      actualUsageFiles1.value,
      actualUsageFiles2.value,
      otherFiles.value
    )
  }

  emit(EMIT_EVENTS.START_WORKFLOW)
}
</script>

<style scoped>
.workflow-config {
  max-height: 60vh;
  overflow-y: auto;
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