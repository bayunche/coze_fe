<template>
  <el-dialog
    v-model="dialogVisible"
    title="审批详情"
    width="70%"
    :before-close="handleClose"
    append-to-body
    destroy-on-close
    class="approval-detail-dialog"
  >
    <div class="detail-content" v-loading="loading">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Document /></el-icon>
          基本信息
        </h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">
            {{ detailData?.taskId || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="任务名称">
            {{ detailData?.taskName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交人">
            {{ detailData?.submitter || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(detailData?.submitTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 物资信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Box /></el-icon>
          物资信息
        </h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物资名称">
            {{ detailData?.materialName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="规格型号">
            {{ detailData?.specifications || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="单位">
            {{ detailData?.unit || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="数量">
            {{ formatQuantity(detailData?.quantity) }}
          </el-descriptions-item>
          <el-descriptions-item label="单价">
            {{ formatAmount(detailData?.unitPrice) }}
          </el-descriptions-item>
          <el-descriptions-item label="总价">
            {{ formatAmount(detailData?.unitPrice * detailData?.quantity) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 匹配信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Connection /></el-icon>
          匹配信息
        </h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="匹配类型">
            <el-tag 
              :type="getMatchTypeConfig(detailData?.matchedType)?.type || 'info'"
              size="small"
            >
              {{ getMatchTypeConfig(detailData?.matchedType)?.label || '未知' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="匹配度">
            <el-progress
              :percentage="detailData?.matchScore || 0"
              :color="getProgressColor(detailData?.matchScore)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="确认人">
            {{ detailData?.confirmedBy || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="确认时间">
            {{ formatDateTime(detailData?.confirmTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 审批信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Stamp /></el-icon>
          审批信息
        </h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审批状态">
            <el-tag 
              :type="getApprovalStatusConfig(detailData?.approvalStatus)?.type"
              size="small"
            >
              <el-icon class="status-icon">
                <component :is="getApprovalStatusConfig(detailData?.approvalStatus)?.icon" />
              </el-icon>
              {{ getApprovalStatusConfig(detailData?.approvalStatus)?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">
            {{ detailData?.approvedBy || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审批时间">
            {{ formatDateTime(detailData?.approvalTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="审批意见" :span="2">
            <div class="approval-remark">
              {{ detailData?.approvalRemark || '-' }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 匹配历史记录 -->
      <div class="detail-section" v-if="matchHistory.length > 0">
        <h3 class="section-title">
          <el-icon><Clock /></el-icon>
          匹配历史
        </h3>
        <el-table :data="matchHistory" stripe border size="small">
          <el-table-column 
            prop="time" 
            label="时间" 
            width="160"
          >
            <template #default="{ row }">
              {{ formatDateTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column prop="detail" label="详情" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <!-- 弹窗底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="detailData?.approvalStatus === 0"
          type="success"
          @click="handleApprove"
        >
          审批通过
        </el-button>
        <el-button 
          v-if="detailData?.approvalStatus === 0"
          type="danger"
          @click="handleReject"
        >
          拒绝
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  Box, 
  Connection, 
  Stamp, 
  Clock
} from '@element-plus/icons-vue'

// 导入常量和工具
import { APPROVAL_STATUS_CONFIG, MATCH_TYPE_MAP } from '../constants'
import { 
  formatDateTime, 
  formatAmount, 
  formatQuantity, 
  confirmPromote, 
  confirmDelete 
} from '../utils'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'refresh'])

// 响应式数据
const loading = ref(false)
const detailData = ref(null)
const matchHistory = ref([])

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    detailData.value = { ...newData }
    loadMatchHistory()
  }
}, { immediate: true })

// 加载匹配历史
const loadMatchHistory = () => {
  // Mock数据，实际项目中应该调用API
  matchHistory.value = [
    {
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      operator: '系统',
      action: '自动匹配',
      detail: '基于物资名称和规格型号进行精确匹配'
    },
    {
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      operator: detailData.value?.confirmedBy || '用户',
      action: '确认匹配',
      detail: '用户确认了系统推荐的匹配结果'
    }
  ]
}

// 获取匹配类型配置
const getMatchTypeConfig = (type) => {
  return MATCH_TYPE_MAP[type]
}

// 获取审批状态配置
const getApprovalStatusConfig = (status) => {
  return APPROVAL_STATUS_CONFIG[status]
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#10b981'
  if (percentage >= 70) return '#f59e0b'
  return '#ef4444'
}

// 处理审批通过
const handleApprove = async () => {
  const result = await confirmPromote(detailData.value)
  if (result.confirmed) {
    try {
      loading.value = true
      // 实际项目中调用API
      // await supplierMaterialService.approveItem({
      //   id: detailData.value.id,
      //   remark: result.remark
      // })
      
      // Mock实现
      detailData.value.approvalStatus = 1
      detailData.value.approvedBy = '当前用户'
      detailData.value.approvalTime = new Date()
      detailData.value.approvalRemark = result.remark || '审批通过'
      
      ElMessage.success('审批通过成功')
      emit('refresh')
      handleClose()
    } catch (error) {
      console.error('审批失败:', error)
      ElMessage.error('审批操作失败')
    } finally {
      loading.value = false
    }
  }
}

// 处理审批拒绝
const handleReject = async () => {
  const result = await confirmDelete(detailData.value)
  if (result.confirmed) {
    try {
      loading.value = true
      // 实际项目中调用API
      // await supplierMaterialService.rejectItem({
      //   id: detailData.value.id,
      //   reason: result.reason
      // })
      
      // Mock实现
      detailData.value.approvalStatus = 2
      detailData.value.approvedBy = '当前用户'
      detailData.value.approvalTime = new Date()
      detailData.value.approvalRemark = result.reason
      
      ElMessage.success('拒绝成功')
      emit('refresh')
      handleClose()
    } catch (error) {
      console.error('拒绝失败:', error)
      ElMessage.error('拒绝操作失败')
    } finally {
      loading.value = false
    }
  }
}

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.approval-detail-dialog {
  --el-dialog-bg-color: var(--theme-dialog-bg);
  --el-dialog-border-radius: 12px;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0 8px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--theme-primary);
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.section-title .el-icon {
  color: var(--theme-primary);
}

.approval-remark {
  padding: 8px 12px;
  background: var(--theme-bg-tertiary);
  border-radius: 4px;
  color: var(--theme-text-primary);
  line-height: 1.6;
  min-height: 60px;
  white-space: pre-wrap;
}

.status-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 自定义描述列表样式 */
:deep(.el-descriptions__label) {
  background-color: var(--theme-bg-tertiary);
  color: var(--theme-text-secondary);
  font-weight: 500;
}

:deep(.el-descriptions__content) {
  color: var(--theme-text-primary);
}

/* 滚动条样式 */
.detail-content::-webkit-scrollbar {
  width: 8px;
}

.detail-content::-webkit-scrollbar-track {
  background: var(--theme-bg-tertiary);
  border-radius: 4px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: var(--theme-border-primary);
  border-radius: 4px;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: var(--theme-primary);
}

/* 主题适配 */
[data-theme='dark'] .approval-remark {
  background: var(--theme-bg-secondary);
}
</style>