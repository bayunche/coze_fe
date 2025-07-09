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
        <el-form-item v-if="needsFileUpload">
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
        <el-button type="primary" @click="$emit('start-workflow')">开始执行</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  show: Boolean,
  currentFunctionName: String,
  config: Object,
  needsFileUpload: Boolean,
  allowedFileTypes: String,
  currentFunctionParams: Array
})

const uploadRef = ref(null)

const emit = defineEmits(['update:show', 'close', 'start-workflow'])

// 监听 close 事件，清除文件列表
const handleClose = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  emit('close')
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

const beforeUpload = (rawFile) => {
  const allowedTypesArray = props.allowedFileTypes.split(',').map((type) => type.trim())
  const fileExtension = rawFile.name.split('.').pop()
  const fileMimeType = rawFile.type

  const isAllowedType = allowedTypesArray.some((allowedType) => {
    if (allowedType.includes('/')) {
      return fileMimeType === allowedType
    } else {
      return fileExtension === allowedType
    }
  })

  if (!isAllowedType) {
    ElMessage.error(`文件类型不符合要求，只支持 ${props.allowedFileTypes} 格式!`)
    return false
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
      files.length + config.files.length
    } 个文件`
  )
}
</script>

<style scoped>
.workflow-config {
  max-height: 60vh;
  overflow-y: auto;
}
.upload-demo {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px; /* 增加高度 */
  padding: 20px;
  border: 2px dashed var(--el-border-color-darker);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-demo :deep(.el-upload-dragger):hover {
  border-color: var(--el-color-primary);
}

.upload-demo .el-upload-dragger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-demo :deep(.el-upload-dragger) .el-icon--upload {
  font-size: 67px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 10px; /* 增加图标和文本的间距 */
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
