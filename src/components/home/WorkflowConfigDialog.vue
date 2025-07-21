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
              class="upload-demo"
            >
              <div class="el-upload-dragger-content">
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">将PDF文件拖到此处，或 <em>点击选择</em></div>
              </div>
            </el-upload>
          </div>
          <div class="upload-grid-item">
            <div class="upload-label">实际用料 (PDF, 必填)</div>
            <el-upload
              ref="actualUsageRef2"
              v-model:file-list="actualUsageFiles2"
              :auto-upload="false"
              :limit="1"
              drag
              accept=".pdf"
              :before-upload="(file) => beforeUpload(file, ['.pdf'])"
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
      ElMessage.error('请上传第二个“实际用料 (PDF, 必填)”文件')
      return
    }

    // Merge files
    props.config.files = [
      ...comprehensiveClaimFiles.value,
      ...actualUsageFiles1.value,
      ...actualUsageFiles2.value,
      ...otherFiles.value
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.upload-grid-item {
  display: flex;
  flex-direction: column;
}

.upload-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  font-weight: 600;
}

.upload-demo {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  background-color: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-demo :deep(.el-upload-dragger):hover,
.upload-demo :deep(.el-upload-dragger.is-dragover) {
  border-color: var(--el-color-primary);
  background-color: #f0f8ff;
}

.upload-demo .el-upload-dragger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
}

.upload-demo :deep(.el-upload-dragger) .el-icon--upload {
  font-size: 48px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
}

.upload-demo :deep(.el-upload-dragger) .el-upload__text {
  color: var(--el-text-color-regular);
  font-size: 14px;
  text-align: center;
}

.upload-demo :deep(.el-upload-dragger) .el-upload__text em {
  color: var(--el-color-primary);
  font-style: normal;
}

.upload-demo :deep(.el-upload__tip) {
  margin-top: 10px; /* 调整提示文本的边距 */
}

.upload-demo :deep(.el-upload-list) {
  margin-top: 10px; /* 调整文件列表的边距 */
}
</style>
