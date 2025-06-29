<template>
  <el-dialog
    :model-value="show"
    :title="`${currentFunctionName} `"
    width="600px"
    draggable
    @update:model-value="$emit('update:show', $event)"
    @close="handleClose"
  >
    <div class="workflow-config">
      <el-form :model="config" label-width="120px">
        <el-form-item label="上传文件" v-if="needsFileUpload">
          <el-upload
            ref="uploadRef"
            v-model:file-list="config.files"
            :auto-upload="false"
            multiple
            :limit="10"
            class="upload-demo"
          >
            <el-button :icon="Upload">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 {{ allowedFileTypes }} 格式，最多上传10个文件，文件总大小控制50m之内</div>
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
import { ref } from 'vue';
import { Upload } from '@element-plus/icons-vue'

defineProps({
  show: Boolean,
  currentFunctionName: String,
  config: Object,
  needsFileUpload: Boolean,
  allowedFileTypes: String,
  currentFunctionParams: Array
})

const uploadRef = ref(null);

const emit = defineEmits(['update:show', 'close', 'start-workflow']);

// 监听 close 事件，清除文件列表
const handleClose = () => {
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  emit('close');
};

</script>

<style scoped>
.workflow-config {
  max-height: 60vh;
  overflow-y: auto;
}
.upload-demo {
  width: 100%;
}
</style>
