<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="60%"
    :before-close="handleClose"
    append-to-body
    class="project-detail-dialog"
  >
    <div class="dialog-content" v-loading="loading">
      <div v-if="projectData" class="detail-container">
        <!-- 基本信息区域 -->
        <div class="section">
          <h3 class="section-title">基本信息</h3>
          <el-row :gutter="20" class="info-grid">
            <el-col
              v-for="(value, key) in basicInfo"
              :key="key"
              :xs="24"
              :sm="12"
              :md="8"
              class="info-item"
            >
              <div class="info-label">{{ getFieldLabel(key) }}</div>
              <div class="info-value">{{ formatFieldValue(key, value) }}</div>
            </el-col>
          </el-row>
        </div>

        <!-- 扩展信息区域 (如果有的话) -->
        <div v-if="hasExtendedInfo" class="section">
          <h3 class="section-title">扩展信息</h3>
          <el-row :gutter="20" class="info-grid">
            <el-col
              v-for="(value, key) in extendedInfo"
              :key="key"
              :xs="24"
              :sm="12"
              :md="8"
              class="info-item"
            >
              <div class="info-label">{{ getFieldLabel(key) }}</div>
              <div class="info-value">{{ formatFieldValue(key, value) }}</div>
            </el-col>
          </el-row>
        </div>

        <!-- 项目统计信息区域 (仅项目总览数据) -->
        <div v-if="isProjectOverview" class="section">
          <h3 class="section-title">项目统计信息</h3>
          <div class="status-info">
            <div class="count-stats">
              <div class="stat-item">
                <span class="stat-label">合同文件数量：</span>
                <span class="stat-value">{{ projectData.contractFileCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">甲供文件数量：</span>
                <span class="stat-value">{{ projectData.ownerMaterialFileCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">乙供文件数量：</span>
                <span class="stat-value">{{ projectData.supplierMaterialFileCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间信息区域 -->
        <div v-if="hasTimeInfo" class="section">
          <h3 class="section-title">时间信息</h3>
          <el-row :gutter="20" class="info-grid">
            <el-col v-for="(value, key) in timeInfo" :key="key" :xs="24" :sm="12" class="info-item">
              <div class="info-label">{{ getFieldLabel(key) }}</div>
              <div class="info-value">{{ formatFieldValue(key, value) }}</div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 数据为空时的提示 -->
      <div v-else class="empty-state">
        <el-empty description="暂无详情数据" />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="isProjectOverview && needsLinkButton(projectData)"
          type="primary"
          @click="handleOpenLink"
        >
          关联数据
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { needsLinkButton } from '../utils.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  projectData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'open-link'])

const loading = ref(false)

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 对话框标题
const dialogTitle = computed(() => {
  if (!props.projectData) return '项目详情'

  const data = props.projectData
  if (data.projectId) return `项目详情 - ${data.projectName || data.projectId}`
  if (data.contractId) return `合同详情 - ${data.contractName || data.contractId}`
  if (data.materialId) return `物资详情 - ${data.materialName || data.materialId}`

  return '详细信息'
})

// 判断是否为项目总览数据
const isProjectOverview = computed(() => {
  return props.projectData && props.projectData.projectId
})

// 字段分组
const basicInfo = computed(() => {
  if (!props.projectData) return {}

  const data = props.projectData
  const basic = {}

  // 基本字段列表 (不包含时间和状态字段)
  const basicFields = [
    'projectId',
    'projectCode',
    'projectName',
    'projectType',
    'budget',
    'contractFileCount',
    'ownerMaterialFileCount',
    'supplierMaterialFileCount',
    'contractId',
    'contractCode',
    'contractName',
    'contractType',
    'partyA',
    'partyB',
    'totalAmount',
    'materialId',
    'materialName',
    'specification',
    'unit',
    'quantity',
    'unitPrice',
    'totalPrice',
    'supplier',
    'contractor',
    'estimatedPrice',
    'actualPrice',
    'totalCost',
    'completionRate',
    'linkStatus'
  ]

  basicFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      basic[field] = data[field]
    }
  })

  return basic
})

const extendedInfo = computed(() => {
  if (!props.projectData) return {}

  const data = props.projectData
  const extended = {}

  // 扩展字段 (除了基本字段、时间字段、状态字段之外的其他字段)
  const excludeFields = [
    'projectId',
    'projectCode',
    'projectName',
    'projectType',
    'budget',
    'contractFileCount',
    'ownerMaterialFileCount',
    'supplierMaterialFileCount',
    'contractId',
    'contractCode',
    'contractName',
    'contractType',
    'partyA',
    'partyB',
    'totalAmount',
    'materialId',
    'materialName',
    'specification',
    'unit',
    'quantity',
    'unitPrice',
    'totalPrice',
    'supplier',
    'contractor',
    'estimatedPrice',
    'actualPrice',
    'totalCost',
    'completionRate',
    'linkStatus',
    'startDate',
    'endDate',
    'signDate',
    'deliveryDate',
    'createTime',
    'updateTime',
    'status'
  ]

  Object.keys(data).forEach((key) => {
    if (!excludeFields.includes(key) && data[key] !== undefined && data[key] !== null) {
      extended[key] = data[key]
    }
  })

  return extended
})

const timeInfo = computed(() => {
  if (!props.projectData) return {}

  const data = props.projectData
  const timeFields = {}

  const timeFieldNames = [
    'startDate',
    'endDate',
    'signDate',
    'deliveryDate',
    'createTime',
    'updateTime'
  ]

  timeFieldNames.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      timeFields[field] = data[field]
    }
  })

  return timeFields
})

const hasExtendedInfo = computed(() => {
  return Object.keys(extendedInfo.value).length > 0
})

const hasTimeInfo = computed(() => {
  return Object.keys(timeInfo.value).length > 0
})

// 字段标签映射
const fieldLabels = {
  // 项目相关
  projectId: '项目ID',
  projectCode: '项目编号',
  projectName: '项目名称',
  projectType: '项目类型',
  budget: '项目预算',
  contractFileCount: '合同文件数量',
  ownerMaterialFileCount: '甲供文件数量',
  supplierMaterialFileCount: '乙供文件数量',

  // 合同相关
  contractId: '合同ID',
  contractCode: '合同编号',
  contractName: '合同名称',
  contractType: '合同类型',
  partyA: '甲方',
  partyB: '乙方',
  totalAmount: '合同金额',
  linkStatus: '关联状态',

  // 物资相关
  materialId: '物资ID',
  materialName: '物资名称',
  specification: '规格型号',
  unit: '单位',
  quantity: '数量',
  unitPrice: '单价',
  totalPrice: '总价',
  supplier: '供应商',
  contractor: '承包商',
  estimatedPrice: '预估单价',
  actualPrice: '实际单价',
  totalCost: '总成本',

  // 时间相关
  startDate: '开始日期',
  endDate: '结束日期',
  signDate: '合同签订时间',
  deliveryDate: '交付日期',
  createTime: '创建时间',
  updateTime: '更新时间'
}

// 获取字段标签
const getFieldLabel = (key) => {
  return fieldLabels[key] || key
}

// 格式化字段值
const formatFieldValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-'

  // 日期格式化
  if (key.includes('Date') || key.includes('Time')) {
    try {
      const date = new Date(value)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()

      // 如果是时间戳字段，添加时分秒
      if (key.includes('Time') || key === 'signDate') {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        return `${year}年${month.toString().padStart(2, '0')}月${day
          .toString()
          .padStart(2, '0')}日 ${hours}:${minutes}:${seconds}`
      } else {
        return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`
      }
    } catch {
      return value
    }
  }

  // 金额格式化
  if (
    [
      'budget',
      'totalAmount',
      'unitPrice',
      'totalPrice',
      'estimatedPrice',
      'actualPrice',
      'totalCost'
    ].includes(key)
  ) {
    return `¥${value.toLocaleString()}`
  }

  // 数量格式化
  if (
    [
      'quantity',
      'contractFileCount',
      'ownerMaterialFileCount',
      'supplierMaterialFileCount'
    ].includes(key)
  ) {
    return value.toLocaleString()
  }

  // 百分比格式化
  if (['completionRate'].includes(key)) {
    return `${value}%`
  }

  return value
}

// 事件处理
const handleClose = () => {
  dialogVisible.value = false
}

const handleOpenLink = () => {
  emit('open-link', props.projectData)
  handleClose()
}

// 监听数据变化，模拟加载
watch(
  () => props.projectData,
  (newData) => {
    if (newData && dialogVisible.value) {
      loading.value = true
      setTimeout(() => {
        loading.value = false
      }, 300)
    }
  }
)
</script>

<style scoped>
.project-detail-dialog {
  /* 继承父级的设计变量 */
  --primary-color: #4f46e5;
  --accent-color: #3730a3;
  --card-background: #ffffff;
  --border-color: rgba(79, 70, 229, 0.08);
  --text-dark: #1e293b;
  --text-light: #64748b;
  --shadow-color: rgba(79, 70, 229, 0.06);
  --success-color: #0d9488;
  --background-light: #f8fafc;
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0;
}

.detail-container {
  padding: 0;
}

.section {
  margin-bottom: 28px;
  padding: 20px;
  background: var(--card-background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.04);
  transition: all 0.3s ease;
}

.section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.08);
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0 0 20px 0;
  padding-left: 16px;
  position: relative;
  letter-spacing: 0.5px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  width: 4px;
  background: var(--accent-color);
  border-radius: 2px;
  box-shadow: 0 0 4px var(--shadow-color);
}

.info-grid {
  margin: 0;
}

.info-item {
  margin-bottom: 18px;
  padding: 12px 16px;
  background: var(--background-light);
  border-radius: 8px;
  border: 1px solid rgba(79, 70, 229, 0.05);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(79, 70, 229, 0.02);
  border-color: rgba(79, 70, 229, 0.1);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-light);
  margin-bottom: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 15px;
  color: var(--text-dark);
  font-weight: 500;
  word-break: break-all;
  line-height: 1.4;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--background-light);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.status-label {
  font-size: 16px;
  color: var(--text-light);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.count-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.02));
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.1);
  border-color: var(--accent-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 600;
}

.stat-value {
  font-size: 18px;
  color: var(--accent-color);
  font-weight: 700;
  text-shadow: 0 0 4px rgba(79, 70, 229, 0.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--background-light);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Element Plus Dialog 样式覆盖 */
:deep(.el-dialog) {
  background: var(--theme-bg-card);
  border-radius: 16px;
  border: 1px solid var(--theme-border-light);
  box-shadow: var(--theme-shadow-heavy);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.05), rgba(var(--theme-primary-rgb), 0.02));
  border-bottom: 1px solid var(--theme-border-light);
  padding: 24px 30px;
  border-radius: 16px 16px 0 0;
}

:deep(.el-dialog__title) {
  color: var(--theme-primary);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 0.5px;
}

:deep(.el-dialog__body) {
  padding: 30px;
  background: var(--theme-bg-secondary);
}

:deep(.el-dialog__footer) {
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.02), rgba(var(--theme-primary-rgb), 0.01));
  border-top: 1px solid var(--theme-border-light);
  padding: 20px 30px;
  border-radius: 0 0 16px 16px;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
  border: none;
}

/* 标签样式 */
:deep(.el-tag) {
  font-weight: 600;
  border-radius: 6px;
  padding: 6px 12px;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(13, 148, 136, 0.05));
  border-color: rgba(13, 148, 136, 0.2);
  color: var(--success-color);
}

:deep(.el-tag--warning) {
  background: linear-gradient(135deg, rgba(220, 104, 3, 0.1), rgba(220, 104, 3, 0.05));
  border-color: rgba(220, 104, 3, 0.2);
  color: #dc6803;
}

:deep(.el-tag--danger) {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(220, 38, 38, 0.05));
  border-color: rgba(220, 38, 38, 0.2);
  color: #dc2626;
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: var(--background-light);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--border-color), rgba(79, 70, 229, 0.1));
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto;
    border-radius: 12px;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    border-radius: 12px 12px 0 0;
  }

  :deep(.el-dialog__body) {
    padding: 24px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-radius: 0 0 12px 12px;
  }

  .section {
    margin-bottom: 20px;
    padding: 16px;
  }

  .count-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-item {
    padding: 12px 16px;
  }

  .info-item {
    margin-bottom: 14px;
    padding: 10px 14px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .section {
    padding: 12px;
  }

  .info-item {
    padding: 8px 12px;
  }

  .stat-item {
    padding: 10px 14px;
  }

  .status-item {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
