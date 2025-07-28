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
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
}

.execution-history-card:hover {
  box-shadow: var(--theme-card-hover-shadow);
}

/* Element Plus 卡片样式覆盖 */
:deep(.el-card__header) {
  background: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
  color: var(--theme-text-primary);
}

:deep(.el-card__body) {
  background: var(--theme-bg-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.history-actions {
  display: flex;
  gap: 8px;
}

/* 表格样式覆盖 */
:deep(.el-table) {
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border) !important;
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

/* 按钮样式优化 */
:deep(.el-button--small) {
  background: var(--theme-bg-tertiary) !important;
  border-color: var(--theme-border-primary) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-button--small:hover) {
  background: var(--theme-primary) !important;
  border-color: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
}

/* 标签样式 */
:deep(.el-tag) {
  background: var(--theme-tag-bg) !important;
  color: var(--theme-tag-text) !important;
  border-color: var(--theme-border-primary) !important;
}

:deep(.el-tag--success) {
  background: var(--theme-success) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--danger) {
  background: var(--theme-error) !important;
  color: var(--theme-text-inverse) !important;
}
</style>
