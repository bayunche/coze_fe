<template>
  <el-drawer
    :model-value="show"
    title="执行日志"
    size="400px"
    direction="rtl"
    @update:model-value="$emit('update:show', $event)"
  >
    <div class="logs-drawer-content">
      <div class="logs-header">
        <el-button size="small" @click="$emit('clear-logs')">清空日志</el-button>
        <el-button size="small" @click="$emit('export-logs')">导出日志</el-button>
      </div>

      <div class="logs-list">
        <div v-for="log in executionLogs" :key="log.id" :class="['log-item', `log-${log.type}`]">
          <div class="log-header">
            <span class="log-time">{{ log.timestamp }}</span>
            <el-tag :type="getLogTagType(log.type)" size="small">
              {{ getLogTypeText(log.type) }}
            </el-tag>
          </div>
          <div class="log-content">
            {{ log.message }}
            <el-button
              v-if="log.hasDetailButton"
              type="primary"
              link
              size="small"
              @click="$emit('view-result-detail')"
            >
              查看详情
            </el-button>
          </div>
          <div v-if="log.details" class="log-details">
            <el-collapse>
              <el-collapse-item title="详细信息">
                <pre>{{ log.details }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
defineProps({
  show: Boolean,
  executionLogs: Array,
  getLogTagType: Function,
  getLogTypeText: Function
})

defineEmits(['update:show', 'clear-logs', 'export-logs', 'view-result-detail'])
</script>

<style scoped>
/* 抽屉主题样式 */
:deep(.el-drawer) {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

:deep(.el-drawer__header) {
  background: var(--theme-bg-secondary);
  border-bottom: 1px solid var(--theme-border-secondary);
  color: var(--theme-text-primary);
  margin-bottom: 0;
  padding: 20px 20px 16px 20px;
}

:deep(.el-drawer__body) {
  background: var(--theme-bg-primary);
  padding: 20px;
}

.logs-drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme-bg-primary);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
}

.logs-list {
  flex: 1;
  overflow-y: auto;
}

.log-item {
  padding: 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
  transition: background-color 0.2s;
  background: var(--theme-bg-primary);
}

.log-item:hover {
  background: var(--theme-bg-tertiary);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  font-family: 'SF Mono', Monaco, monospace;
  color: var(--theme-text-secondary);
  font-size: 13px;
}

.log-content {
  color: var(--theme-text-primary);
  font-size: 14px;
  line-height: 1.5;
}

.log-details {
  margin-top: 12px;
}

.log-details pre {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  overflow-x: auto;
  border: 1px solid var(--theme-border-primary);
}

/* 按钮样式优化 */
:deep(.el-button) {
  background: var(--theme-bg-tertiary);
  border-color: var(--theme-border-primary);
  color: var(--theme-text-primary);
}

:deep(.el-button:hover) {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

:deep(.el-button--primary) {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

/* 标签样式优化 */
:deep(.el-tag) {
  background: var(--theme-tag-bg);
  color: var(--theme-tag-text);
  border-color: var(--theme-border-primary);
}

:deep(.el-tag--success) {
  background: var(--theme-success);
  color: var(--theme-text-inverse);
}

:deep(.el-tag--warning) {
  background: var(--theme-warning);
  color: var(--theme-text-inverse);
}

:deep(.el-tag--danger) {
  background: var(--theme-error);
  color: var(--theme-text-inverse);
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__header) {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-primary);
}

:deep(.el-collapse-item__content) {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}
</style>
