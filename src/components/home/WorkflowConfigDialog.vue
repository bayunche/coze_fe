<template>
  <el-dialog
    :model-value="show"
    :title="`${currentFunctionName} `"
    width="40vw"
    draggable
    @update:model-value="$emit('update:show', $event)"
    @close="handleClose"
  >
    <div class="workflow-config">
      <el-form :model="config">
        <!-- Default Upload Component -->
        <el-form-item v-if="needsFileUpload && !isOwnerMaterialWorkflow">
          <el-upload
            ref="uploadRef"
            v-model:file-list="config.files"
            :auto-upload="false"
            multiple
            :limit="10"
            :drag="true"
            :accept="acceptFileTypes"
            :before-upload="beforeUpload"
            :on-exceed="handleExceed"
            class="upload-demo"
          >
            <div class="el-upload-dragger-content">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将文件拖到此处，或 <em>点击选择文件</em></div>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 {{ allowedFileTypes }} 格式，最多上传10个文件，文件总大小控制50m之内
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- Owner Material Upload Components -->
        <div v-if="needsFileUpload && isOwnerMaterialWorkflow" class="owner-material-upload-grid">
          <div class="upload-grid-item">
            <div class="upload-label">综合申领 (Excel)</div>
            <el-upload
              ref="comprehensiveClaimRef"
              v-model:file-list="comprehensiveClaimFiles"
              :auto-upload="false"
              :limit="1"
              drag
              accept=".xls,.xlsx"
              :before-upload="(file) => beforeUpload(file, ['.xls', '.xlsx'])"
              :on-change="handleComprehensiveClaimChange"
              :on-exceed="handleComprehensiveClaimExceed"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将Excel文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>
          <div class="upload-grid-item">
            <div class="upload-label">实际用料 (PDF, 必填)</div>
            <el-upload
              ref="actualUsageRef1"
              v-model:file-list="actualUsageFiles1"
              :auto-upload="false"
              :limit="1"
              drag
              accept=".pdf"
              :before-upload="(file) => beforeUpload(file, ['.pdf'])"
              :on-change="handleActualUsage1Change"
              :on-exceed="handleActualUsage1Exceed"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>
          <div class="upload-grid-item">
            <div class="upload-label">实际退料 (PDF, 必填)</div>
            <el-upload
              ref="actualUsageRef2"
              v-model:file-list="actualUsageFiles2"
              :auto-upload="false"
              :limit="1"
              drag
              accept=".pdf"
              :before-upload="(file) => beforeUpload(file, ['.pdf'])"
              :on-change="handleActualUsage2Change"
              :on-exceed="handleActualUsage2Exceed"
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>
          <div class="upload-grid-item">
            <div class="upload-label">其他文件 (选填)</div>
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

        <el-form-item v-for="param in currentFunctionParams" :key="param.key" :label="param.label">
          <el-input
            v-if="param.type === 'text'"
            v-model="config.params[param.key]"
            :placeholder="param.placeholder"
          />
          <el-input-number
            v-else-if="param.type === 'number'"
            v-model="config.params[param.key]"
            :min="param.min"
            :max="param.max"
          />
          <el-select
            v-else-if="param.type === 'select'"
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
          <el-switch v-else-if="param.type === 'boolean'" v-model="config.params[param.key]" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:show', false)">取消</el-button>
        <el-button type="primary" @click="handleSubmit">开始执行</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  show: Boolean,
  currentFunctionName: String,
  config: Object,
  needsFileUpload: Boolean,
  allowedFileTypes: String,
  currentFunctionParams: Array
})

const emit = defineEmits(['update:show', 'close', 'start-workflow'])

const uploadRef = ref(null)
const comprehensiveClaimRef = ref(null)
const actualUsageRef1 = ref(null)
const actualUsageRef2 = ref(null)
const otherFilesRef = ref(null)

const comprehensiveClaimFiles = ref([])
const actualUsageFiles1 = ref([])
const actualUsageFiles2 = ref([])
const otherFiles = ref([])

const isOwnerMaterialWorkflow = computed(() => props.currentFunctionName === '甲供物资解析')

const handleComprehensiveClaimChange = (file, fileList) => {
  comprehensiveClaimFiles.value = fileList
}

const handleActualUsage1Change = (file, fileList) => {
  actualUsageFiles1.value = fileList
}

const handleActualUsage2Change = (file, fileList) => {
  actualUsageFiles2.value = fileList
}

const handleComprehensiveClaimExceed = (files) => {
  comprehensiveClaimRef.value.clearFiles()
  comprehensiveClaimRef.value.handleStart(files[0])
}

const handleActualUsage1Exceed = (files) => {
  actualUsageRef1.value.clearFiles()
  actualUsageRef1.value.handleStart(files[0])
}

const handleActualUsage2Exceed = (files) => {
  actualUsageRef2.value.clearFiles()
  actualUsageRef2.value.handleStart(files[0])
}

const handleClose = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  if (comprehensiveClaimRef.value) comprehensiveClaimRef.value.clearFiles()
  if (actualUsageRef1.value) actualUsageRef1.value.clearFiles()
  if (actualUsageRef2.value) actualUsageRef2.value.clearFiles()
  if (otherFilesRef.value) otherFilesRef.value.clearFiles()

  comprehensiveClaimFiles.value = []
  actualUsageFiles1.value = []
  actualUsageFiles2.value = []
  otherFiles.value = []

  emit('close')
}

const handleSubmit = () => {
  if (isOwnerMaterialWorkflow.value) {
    if (comprehensiveClaimFiles.value.length === 0) {
      ElMessage.error('请上传“综合申领 (Excel)”文件')
      return
    }
    if (actualUsageFiles1.value.length === 0) {
      ElMessage.error('请上传第一个“实际用料 (PDF, 必填)”文件')
      return
    }
    if (actualUsageFiles2.value.length === 0) {
      ElMessage.error('请上传“实际退料 (PDF, 必填)”文件')
      return
    }

    // Assign categorized files with excel_type
    const assignExcelType = (files, type) => files.map((file) => ({ ...file, excel_type: type }))

    props.config.files = [
      ...assignExcelType(comprehensiveClaimFiles.value, 'applyExcelFile'),
      ...assignExcelType(actualUsageFiles1.value, 'useMaterualPdfUrl'),
      ...assignExcelType(actualUsageFiles2.value, 'backMaterualPdfUrl'),
      ...assignExcelType(otherFiles.value, 'other')
    ]
  }

  emit('start-workflow')
}

const acceptFileTypes = computed(() => {
  if (!props.allowedFileTypes) return ''
  return props.allowedFileTypes
    .split(',')
    .map((type) => {
      const trimmedType = type.trim()
      return trimmedType.includes('/') ? trimmedType : `.${trimmedType}`
    })
    .join(',')
})

const beforeUpload = (rawFile, allowedTypes) => {
  const fileExtension = `.${rawFile.name.split('.').pop()}`.toLowerCase()

  if (allowedTypes) {
    const isAllowedType = allowedTypes.map((t) => t.toLowerCase()).includes(fileExtension)
    if (!isAllowedType) {
      ElMessage.error(`文件类型不符合要求，只支持 ${allowedTypes.join(', ')} 格式!`)
      return false
    }
  }

  if (rawFile.size / 1024 / 1024 > 50) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }
  return true
}

const handleExceed = (files) => {
  ElMessage.warning(
    `当前限制选择 10 个文件，本次选择了 ${files.length} 个文件，共选择了 ${
      files.length + (props.config.files ? props.config.files.length : 0)
    } 个文件`
  )
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
  height: 488px; /* 固定容器高度，确保能容纳两行 */
}

.upload-grid-item {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: calc(50% - 12px); /* 宽度为50%减去一半的间隙 */
  height: 220px; /* 为每个上传框设置固定高度 */
}

/* 使用 :nth-child 精确定位每个上传框 */
.upload-grid-item:nth-child(1) {
  top: 0;
  left: 0;
}
.upload-grid-item:nth-child(2) {
  top: 0;
  left: calc(50% + 12px);
}
.upload-grid-item:nth-child(3) {
  top: 244px; /* 220px (item-height) + 24px (gap) */
  left: 0;
}
.upload-grid-item:nth-child(4) {
  top: 244px; /* 220px (item-height) + 24px (gap) */
  left: calc(50% + 12px);
}

.upload-label {
  font-size: 14px;
  color: #1c1e21; /* Meta-like dark text */
  margin-bottom: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.upload-demo {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensure it fills the grid item */
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
  background-color: transparent; /* No background */
  border: 1.5px dashed #ced0d4; /* Softer, thinner dash */
  border-radius: 12px; /* Larger radius */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-height: 120px;
}

.upload-demo :deep(.el-upload-dragger):hover,
.upload-demo :deep(.el-upload-dragger.is-dragover) {
  border-color: #0052ff; /* Apple-like blue */
  background-color: rgba(0, 82, 255, 0.05); /* Subtle background on hover */
  box-shadow: 0 4px 12px rgba(0, 82, 255, 0.1); /* Soft shadow */
}

.upload-demo .el-upload-dragger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #65676b; /* Softer text color */
}

.upload-demo :deep(.el-upload-dragger) .el-icon--upload {
  font-size: 36px; /* Smaller icon */
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
  display: none; /* Hide the default tip */
}

.upload-demo :deep(.el-upload-list) {
  margin-top: 12px;
  height: 54px;
  overflow-y: auto;
  border: none; /* Remove border */
  border-radius: 0;
  padding: 0;
  background-color: transparent;
}

/* Custom scrollbar styling */
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
  margin-bottom: 8px; /* Space between items */
  background-color: #fff;
  border: 1px solid #eef0f2;
  border-radius: 8px; /* Softer corners */
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
