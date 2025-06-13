<template>
  <el-dialog
    v-model="dialogVisible"
    title="智能大脑状态中心"
    width="70%"
    :before-close="handleClose"
    custom-class="smart-brain-dialog"
  >
    <div class="agent-stats-grid">
      <el-card v-for="agent in agents" :key="agent.id" class="agent-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>{{ agent.name }}</span>
            <el-tag :type="agent.status === 'online' ? 'success' : 'info'" size="small">{{
              agent.status === 'online' ? '在线' : '离线'
            }}</el-tag>
          </div>
        </template>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.completed }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.inProgress }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ agent.tasks.total }}</span>
            <span class="stat-label">总任务</span>
          </div>
        </div>
      </el-card>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  agents: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:show'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.smart-brain-dialog .el-dialog__body {
  padding: 20px 30px;
  background-color: #f4f7f9;
}

.agent-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.agent-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.agent-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1f2937;
}

.stats-container {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
</style>
