<template>
  <el-card class="execution-history-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-title">执行历史</span>
        <div class="history-actions">
          <el-button size="small" @click="$emit('clear-history')">清空历史</el-button>
          <el-button size="small" @click="$emit('export-history')">导出历史</el-button>
        </div>
      </div>
    </template>

    <el-table :data="executionHistory" style="width: 100%" max-height="300">
      <el-table-column prop="workflow" label="工作流" width="150" />
      <el-table-column prop="function" label="功能模块" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
            {{ row.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="耗时" width="80" />
      <el-table-column prop="timestamp" label="执行时间" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="$emit('view-detail', row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
defineProps({
  executionHistory: {
    type: Array,
    required: true
  }
})

defineEmits(['clear-history', 'export-history', 'view-detail'])
</script>

<style scoped>
.execution-history-card {
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}
.history-actions {
  display: flex;
  gap: 8px;
}
</style>
