<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="600px"
    @close="handleClose"
    :close-on-click-modal="false"
  >
    <div class="approval-dialog-content">
      <!-- 审批信息总览 -->
      <div class="approval-summary">
        <div class="summary-item">
          <span class="label">操作类型：</span>
          <el-tag :type="approvalType === 'approve' ? 'success' : 'danger'" size="large">
            {{ approvalType === 'approve' ? '审批通过' : '拒绝审批' }}
          </el-tag>
        </div>
        <div class="summary-item">
          <span class="label">影响项目：</span>
          <span class="value">{{ selectedItems.length }} 个物资项目</span>
        </div>
      </div>

      <el-divider />

      <!-- 审批表单 -->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="left"
      >
        <el-form-item
          v-if="approvalType === 'reject'"
          label="拒绝理由"
          prop="reason"
          required
        >
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝理由（必填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          label="审批备注"
          prop="remark"
        >
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审批备注（可选）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="审批人信息">
          <div class="approver-info">
            <div class="info-item">
              <span class="info-label">审批人：</span>
              <span class="info-value">{{ userInfo.name || '系统管理员' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">审批时间：</span>
              <span class="info-value">{{ currentTime }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <!-- 影响的物资列表 -->
      <div class="affected-items">
        <h4 class="section-title">待{{ approvalType === 'approve' ? '通过' : '拒绝' }}的物资项目</h4>
        <div class="items-list">
          <div
            v-for="(item, index) in selectedItems"
            :key="item.taskDataId"
            class="item-card"
          >
            <div class="item-index">{{ index + 1 }}</div>
            <div class="item-content">
              <div class="item-title">{{ item.materialName }}</div>
              <div class="item-spec">{{ item.specifications }}</div>
              <div class="item-meta">
                <span>数量：{{ item.quantity }} {{ item.unit }}</span>
                <span>单价：¥{{ item.unitPrice }}</span>
                <span>总价：¥{{ item.totalPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          @click="handleConfirm"
          :type="approvalType === 'approve' ? 'success' : 'danger'"
          :loading="confirming"
        >
          确认{{ approvalType === 'approve' ? '通过' : '拒绝' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  approvalType: {
    type: String,
    default: 'approve', // 'approve' | 'reject'
    validator: (value) => ['approve', 'reject'].includes(value)
  },
  selectedItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const authStore = useAuthStore()
const formRef = ref()
const confirming = ref(false)

// 表单数据
const formData = reactive({
  reason: '',    // 拒绝理由
  remark: '',    // 审批备注
  approverId: '',
  approverName: ''
})

// 用户信息
const userInfo = computed(() => {
  return {
    id: authStore.userId || 'admin-001',
    name: authStore.userName || '系统管理员'
  }
})

// 当前时间
const currentTime = ref('')

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 对话框标题
const dialogTitle = computed(() => {
  const action = props.approvalType === 'approve' ? '审批通过' : '拒绝审批'
  const count = props.selectedItems.length
  return `${action} - ${count}个物资项目`
})

// 表单验证规则
const formRules = computed(() => {
  const rules = {
    remark: [
      { max: 300, message: '备注不能超过300字符', trigger: 'blur' }
    ]
  }

  if (props.approvalType === 'reject') {
    rules.reason = [
      { required: true, message: '请输入拒绝理由', trigger: 'blur' },
      { min: 5, message: '拒绝理由至少5个字符', trigger: 'blur' },
      { max: 500, message: '拒绝理由不能超过500字符', trigger: 'blur' }
    ]
  }

  return rules
})

// 方法
const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const resetForm = () => {
  formData.reason = ''
  formData.remark = ''
  formData.approverId = userInfo.value.id
  formData.approverName = userInfo.value.name

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const handleConfirm = async () => {
  try {
    // 表单验证
    if (formRef.value) {
      const valid = await formRef.value.validate()
      if (!valid) return
    }

    // 确认操作
    const action = props.approvalType === 'approve' ? '通过' : '拒绝'
    const confirmMessage = `确定要${action} ${props.selectedItems.length} 个物资项目吗？`

    await ElMessageBox.confirm(confirmMessage, '确认操作', {
      type: 'warning',
      confirmButtonText: `确认${action}`,
      cancelButtonText: '取消'
    })

    confirming.value = true

    // 准备审批数据
    const approvalData = {
      approvalResult: props.approvalType === 'approve' ? 1 : 0,
      approvalReason: formData.reason || formData.remark,
      approverId: formData.approverId,
      approverName: formData.approverName,
      remark: formData.remark,
      items: props.selectedItems.map(item => ({
        taskDataId: item.taskDataId,
        taskId: item.taskId,
        materialName: item.materialName
      }))
    }

    // 触发确认事件
    emit('confirm', approvalData)

  } catch (error) {
    if (error !== 'cancel') {
      console.error('【错误】审批确认失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    confirming.value = false
  }
}

// 监听对话框显示状态
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm()
    updateCurrentTime()
  }
})

// 生命周期
onMounted(() => {
  updateCurrentTime()

  // 每秒更新时间
  const timer = setInterval(updateCurrentTime, 1000)

  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<style scoped>
.approval-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.approval-summary {
  padding: 16px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-right: 8px;
}

.value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.approver-info {
  background: var(--el-fill-color-lighter);
  padding: 12px;
  border-radius: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-right: 8px;
  min-width: 70px;
}

.info-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.affected-items {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
}

.items-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.item-card {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.item-card:last-child {
  border-bottom: none;
}

.item-index {
  width: 24px;
  height: 24px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-spec {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.item-meta span {
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .item-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>