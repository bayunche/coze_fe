<template>
  <el-header height="60px" class="header">
    <div class="header-content">
      <div class="header-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>智能体控制台</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions"></div>
    </div>
  </el-header>
</template>

<script setup>
defineProps({
  currentFunctionName: {
    type: String,
    required: true
  },
  executionLogsCount: {
    type: Number,
    required: true
  },
  activeFunction: {
    type: String,
    required: true
  }
})

defineEmits(['show-workflow-config'])
</script>

<style scoped>
.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.badge {
  position: relative;
}
</style>
