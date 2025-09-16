<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    @close="handleClose"
  >
    <div class="stats-dialog-content">
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="overview-item">
          <div class="overview-label">总计</div>
          <div class="overview-value">{{ statistics.totalCount || 0 }}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">待处理</div>
          <div class="overview-value pending">{{ statistics.pendingCount || 0 }}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">处理中</div>
          <div class="overview-value processing">{{ statistics.processingCount || 0 }}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">已完成</div>
          <div class="overview-value completed">{{ statistics.completedCount || 0 }}</div>
        </div>
      </div>

      <el-divider />

      <!-- 详细信息 -->
      <div class="stats-details">
        <h4>详细统计</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="高优先级待办">
            <el-tag type="danger">{{ statistics.highPriorityCount || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="已逾期待办">
            <el-tag type="warning">{{ statistics.overdueCount || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="已取消待办">
            <el-tag type="info">{{ statistics.cancelledCount || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成率">
            <span class="completion-rate">{{ completionRate }}%</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleRefresh" type="primary">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  dialogType: {
    type: String,
    default: 'pending'
  },
  statistics: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:show', 'refresh'])

// 计算属性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const dialogTitle = computed(() => {
  const titleMap = {
    pending: '待处理统计',
    processing: '处理中统计',
    high: '高优先级统计',
    overdue: '已逾期统计'
  }
  return titleMap[props.dialogType] || '统计详情'
})

const completionRate = computed(() => {
  const total = props.statistics.totalCount || 0
  const completed = props.statistics.completedCount || 0
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

// 方法
const handleClose = () => {
  emit('update:show', false)
}

const handleRefresh = () => {
  emit('refresh')
}
</script>

<style scoped>
.stats-dialog-content {
  padding: 16px 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.overview-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.overview-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.overview-value.pending {
  color: var(--el-color-danger);
}

.overview-value.processing {
  color: var(--el-color-warning);
}

.overview-value.completed {
  color: var(--el-color-success);
}

.stats-details h4 {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.completion-rate {
  font-weight: 600;
  color: var(--el-color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>