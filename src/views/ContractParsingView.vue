<script setup>
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showUpload = ref(true)
const parsingLog = ref('')

// Mock file refs
const contractFile = ref(null)
const biddingFile = ref(null)
const tenderFile = ref(null)
const subContractFile = ref(null)

const handleFileChange = (file, fileList, fileRef) => {
  if (fileList.length > 0) {
    fileRef.value = fileList[fileList.length - 1].raw
  } else {
    fileRef.value = null
  }
}

const beforeUpload = () => {
  // Prevent automatic upload
  return false
}

const startParsing = async () => {
  if (!contractFile.value) {
    ElMessage.warning('请上传合同文件。')
    return
  }

  const filesToParse = [contractFile, biddingFile, tenderFile, subContractFile].filter(
    (f) => f.value
  )
  const fileCount = filesToParse.length

  showUpload.value = false
  parsingLog.value = ''

  const log = (message) => {
    parsingLog.value += message + '\n'
  }

  // This simulates the streaming response from a Coze workflow.
  const simulateStream = async () => {
    await new Promise((r) => setTimeout(r, 300))
    log(`本次任务已上传${fileCount}个文件，正在解析中。`)

    for (let i = 0; i < fileCount; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      log(`开始处理第${i + 1}个文件 (${filesToParse[i].value.name})。`)
      await new Promise((r) => setTimeout(r, 1500))
      log(`第${i + 1}个文件处理完成。`)
    }

    // Simulate the final "event: Done" message
    await new Promise((r) => setTimeout(r, 500))
    log(`文件已处理完成，共${fileCount}个文件。解析结果可查看：`)
    parsingLog.value += `<a href="#" class="text-blue-600 hover:underline" target="_blank">合同解析结果</a>`
  }

  await simulateStream()
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">合同解析</h1>

    <div v-if="showUpload">
      <div class="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>合同文件上传</span>
            </div>
          </template>
          <el-upload
            :auto-upload="false"
            :on-change="(file, fileList) => handleFileChange(file, fileList, contractFile)"
            :before-upload="beforeUpload"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-card>
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>招标文件上传 (可选)</span>
            </div>
          </template>
          <el-upload
            :auto-upload="false"
            :on-change="(file, fileList) => handleFileChange(file, fileList, biddingFile)"
            :before-upload="beforeUpload"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-card>
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>投标文件上传 (可选)</span>
            </div>
          </template>
          <el-upload
            :auto-upload="false"
            :on-change="(file, fileList) => handleFileChange(file, fileList, tenderFile)"
            :before-upload="beforeUpload"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-card>
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>子合同文件上传 (可选)</span>
            </div>
          </template>
          <el-upload
            :auto-upload="false"
            :on-change="(file, fileList) => handleFileChange(file, fileList, subContractFile)"
            :before-upload="beforeUpload"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-card>
      </div>
      <div class="text-center">
        <el-button type="primary" @click="startParsing" size="large">开始解析</el-button>
      </div>
    </div>

    <div v-else>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>解析过程</span>
          </div>
        </template>
        <div class="w-full whitespace-pre-wrap font-mono text-sm" v-html="parsingLog"></div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
/* Using Tailwind's Typography plugin for prose styling if available, otherwise add basic styles */
.prose h1,
.prose h2,
.prose h3 {
  font-weight: bold;
  margin-bottom: 0.5em;
}
.prose ul {
  list-style-type: disc;
  padding-left: 1.5em;
}
</style>
