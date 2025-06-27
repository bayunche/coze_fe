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
.logs-drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.logs-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}
.logs-list {
  flex: 1;
  overflow-y: auto;
}
.log-item {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}
.log-item:hover {
  background: #f8fafc;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.log-time {
  font-family: 'SF Mono', Monaco, monospace;
  color: #6b7280;
  font-size: 13px;
}
.log-content {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.5;
}
.log-details {
  margin-top: 12px;
}
.log-details pre {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  overflow-x: auto;
}
</style>
