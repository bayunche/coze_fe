<template>
  <div class="supplier-material-table-simple">
    <!-- 简化表格主体 - 移除所有复杂样式和动画 -->
    <el-table
      :data="processedTableData"
      v-loading="loading"
      style="width: 100%"
      :row-class-name="getRowClassName"
      :row-key="row => row.rowKey"
      :span-method="tableSpanMethod"
      v-bind="tableConfig"
    >
      <!-- 序号列 -->
      <el-table-column label="序号" width="80" fixed="left">
        <template #default="{ row, $index }">
          <div v-if="row.rowType === 'data'" class="sequence-container">
            <div :class="getSequenceBarClass(row)" class="sequence-bar"></div>
            <span>{{ getSequenceNumber($index) }}</span>
          </div>
          <!-- 原因解释行 - 简化版本 -->
          <div v-else-if="row.rowType === 'reason'" class="reason-container">
            <div class="reason-content">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ getReasonExplanation(row) }}</span>
            </div>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
        </template>
      </el-table-column>

      <!-- 价格匹配状态列 -->
      <el-table-column
        v-if="columnConfig.showPriceMatchStatus"
        label="价格匹配状态"
        width="140"
        align="center"
      >
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <el-tag :type="getPriceMatchingStatusTag(row).type" size="small">
              {{ getPriceMatchingStatusTag(row).text }}
            </el-tag>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <el-tag :type="getPriceMatchingStatusTag(row).type" size="small">
              {{ getPriceMatchingStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 物资匹配状态列 -->
      <el-table-column
        v-if="columnConfig.showMaterialMatchStatus"
        label="物资匹配状态"
        width="140"
        align="center"
      >
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <el-tag :type="getMaterialMatchingStatusTag(row).type" size="small">
              {{ getMaterialMatchingStatusTag(row).text }}
            </el-tag>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <el-tag :type="getMaterialMatchingStatusTag(row).type" size="small">
              {{ getMaterialMatchingStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 物资名称列 -->
      <el-table-column prop="materialName" label="物资名称" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            {{ getBaseInfoName(row) }}
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div class="material-cell">
              <span v-if="row.hasUserSelectedData && row.confirmedBaseName">
                {{ row.confirmedBaseName }}
              </span>
              <span v-else-if="row.baseInfo?.materialName">
                {{ row.baseInfo.materialName }}
              </span>
              <span v-else-if="row.matchedType === 0" class="text-gray-400">
                等待选择物资
              </span>
              <span v-else>{{ '-' }}</span>
              <!-- 差异标记 - 简化版本 -->
              <el-icon v-if="hasMaterialNameDifference(row) && row.matchedType !== 0" class="text-red-500">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 规格型号列 -->
      <el-table-column prop="specifications" label="规格型号" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            {{ getBaseInfoSpec(row) }}
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div class="material-cell">
              <span v-if="row.hasUserSelectedData && row.confirmedBaseSpec">
                {{ row.confirmedBaseSpec }}
              </span>
              <span v-else-if="row.baseInfo?.specifications">
                {{ row.baseInfo.specifications }}
              </span>
              <span v-else-if="row.matchedType === 0" class="text-gray-400">
                等待选择规格
              </span>
              <span v-else>{{ '-' }}</span>
              <!-- 差异标记 - 简化版本 -->
              <el-icon v-if="hasSpecificationDifference(row) && row.matchedType !== 0" class="text-red-500">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 单位列 -->
      <el-table-column prop="unit" label="单位" width="80">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            {{ row.unit || '-' }}
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div class="material-cell">
              <span v-if="row.baseInfo?.unit">
                {{ row.baseInfo.unit }}
              </span>
              <span v-else-if="row.hasUserSelectedData && row.selectedMaterial?.unit">
                {{ row.selectedMaterial.unit }}
              </span>
              <span v-else-if="row.matchedType === 0" class="text-gray-400">
                等待选择
              </span>
              <span v-else>{{ '-' }}</span>
              <!-- 差异标记 - 简化版本 -->
              <el-icon v-if="hasUnitDifference(row) && row.matchedType !== 0" class="text-red-500">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 数量列 -->
      <el-table-column prop="quantity" label="数量" width="100">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data' || row.rowType === 'action'">
            {{ formatNumber(row.quantity) }}
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
        </template>
      </el-table-column>

      <!-- 物资价格（含税）列 -->
      <el-table-column label="物资价格（含税）" width="140" align="right">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <span>¥{{ getTaxIncludedPrice(row) }}</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)">
              <span>¥{{ formatPrice(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0) }}</span>
            </div>
            <div v-else-if="row.priceInfo?.taxPrice">
              <span>¥{{ formatPrice(row.priceInfo.taxPrice) }}</span>
            </div>
            <div v-else>
              <span class="text-gray-400">¥--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 物资价格（不含税）列 -->
      <el-table-column label="物资价格（不含税）" width="140" align="right">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <span>¥{{ getTaxExcludedPrice(row) }}</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)">
              <span>¥{{ formatPrice(getActionRowTaxExcludedPrice(row)) }}</span>
            </div>
            <div v-else-if="row.priceInfo?.taxPrice">
              <span>¥{{ formatPrice(row.priceInfo.taxPrice ? row.priceInfo.taxPrice / 1.13 : 0) }}</span>
            </div>
            <div v-else>
              <span class="text-gray-400">¥--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 税率列 -->
      <el-table-column label="税率" width="100" align="center">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data' || row.rowType === 'action'">
            <span>{{ getTaxRate(row) }}</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
        </template>
      </el-table-column>

      <!-- 所属季度列 -->
      <el-table-column label="所属季度" width="120" align="center">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <span class="text-gray-400">-</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)">
              <span>{{ row.selectedPriceQuarter.quarter || '-' }}</span>
            </div>
            <div v-else-if="row.priceInfo?.quarter">
              <span>{{ row.priceInfo.quarter }}</span>
            </div>
            <div v-else>
              <span class="text-gray-400">--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 数据来源列 -->
      <el-table-column label="数据来源" width="120" align="center">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <span class="text-gray-500">结算书</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else>
            <span v-if="row.matchedType === 0 && !row.hasUserSelectedData" class="text-gray-400">
              等待选择
            </span>
            <el-tag v-else :type="getDataSourceType(row).type" size="small">
              {{ getDataSourceType(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="260" align="center">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'">
            <span class="text-gray-400">-</span>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else-if="row.rowType === 'reason'">
          </div>
          <div v-else class="operation-container">
            <!-- 已确认状态 -->
            <div v-if="row.confirmResult === 1" class="operation-group">
              <el-tag type="success" size="small">
                <el-icon><Check /></el-icon>
                <span>已确认</span>
              </el-tag>
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)">
                <el-icon><Edit /></el-icon>
                <span>重选</span>
              </el-button>
            </div>

            <!-- 未匹配且已选择 -->
            <div v-else-if="row.matchedType === 0 && row.hasUserSelectedData" class="operation-group">
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)">
                <el-icon><Edit /></el-icon>
                <span>重新选择</span>
              </el-button>
            </div>

            <!-- 未匹配且未选择 -->
            <div v-else-if="row.matchedType === 0" class="operation-group">
              <el-button type="primary" plain size="small" @click="$emit('view-options', row)">
                <el-icon><Plus /></el-icon>
                <span>从库选择</span>
              </el-button>
            </div>

            <!-- 价格不存在状态 -->
            <div v-else-if="isPriceNotFound(row)" class="operation-group">
              <el-button type="primary" size="small" @click="$emit('add-price', row)">
                <el-icon><Plus /></el-icon>
                <span>新增价格</span>
              </el-button>
            </div>

            <!-- 价格不匹配 -->
            <div v-else-if="isPriceMismatch(row)" class="operation-group">
              <el-tooltip content="价格不匹配，请确认结算书是否有误并进行修改" placement="top">
                <div class="price-mismatch-hint">
                  <el-icon class="text-orange-500"><WarnTriangleFilled /></el-icon>
                  <span class="text-sm">价格不匹配</span>
                </div>
              </el-tooltip>
            </div>

            <!-- 精确匹配且价格匹配 -->
            <div v-else-if="row.matchedType === 1 && !isPriceMismatch(row)" class="operation-group">
              <el-button type="primary" size="small" @click="$emit('quick-confirm', row)">
                <el-icon><Check /></el-icon>
                <span>确认</span>
              </el-button>
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)">
                <el-icon><Edit /></el-icon>
                <span>重选</span>
              </el-button>
            </div>

            <!-- 相似匹配等 -->
            <div v-else-if="row.matchedType === 2 || row.matchedType === 3 || row.matchedType === 4" class="operation-group">
              <el-button type="primary" size="small" @click="$emit('view-options', row)">
                <el-icon><Edit /></el-icon>
                <span>选择确认</span>
              </el-button>
            </div>

            <!-- 其他未知匹配类型 -->
            <div v-else class="operation-group">
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)">
                <el-icon><Edit /></el-icon>
                <span>重新选择</span>
              </el-button>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import {
  Check,
  Edit,
  Plus,
  Close,
  WarnTriangleFilled,
  InfoFilled
} from '@element-plus/icons-vue'

// 引入常量配置
import {
  TABLE_TYPES,
  TABLE_COLUMNS_CONFIG,
  MATERIAL_MATCH_STATUS,
  MATCH_TYPE_MAP,
  TABLE_DEFAULT_CONFIG,
  REASON_EXPLANATIONS
} from './constants.js'

// Props 定义
const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 表格类型
  tableType: {
    type: String,
    default: TABLE_TYPES.ALL,
    validator: (value) => Object.values(TABLE_TYPES).includes(value)
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 批量确认加载状态
  batchConfirming: {
    type: Boolean,
    default: false
  },
  // 待确认数量
  pendingCount: {
    type: Number,
    default: 0
  }
})

// Emits 定义
defineEmits([
  'quick-confirm',
  'view-options',
  'batch-confirm',
  'add-price'
])

// 注入父组件的方法
const parentMethods = inject('parentMethods', {})

// 表格配置
const tableConfig = computed(() => ({
  ...TABLE_DEFAULT_CONFIG,
  emptyText: '暂无数据'
}))

// 列配置
const columnConfig = computed(() => {
  return TABLE_COLUMNS_CONFIG[props.tableType] || TABLE_COLUMNS_CONFIG[TABLE_TYPES.ALL]
})

// 处理后的表格数据
const processedTableData = computed(() => {
  if (!columnConfig.value.showReasonRow) {
    return props.data
  }

  const result = []
  const dataGroups = groupDataByItem(props.data)

  dataGroups.forEach((group, index) => {
    result.push(group.dataRow)
    result.push(group.actionRow)

    const priceStatus = group.actionRow.priceMatchedStatus ||
                       (group.actionRow.matchOptions?.[0]?.priceMatchedStatus)

    if (group.actionRow.matchedType === 0 || group.actionRow.matchedType === 2 || priceStatus === -1 || priceStatus === 2) {
      const reasonRow = {
        ...group.actionRow,
        rowType: 'reason',
        rowKey: `${group.actionRow.taskDataId || group.actionRow.id}-reason`
      }
      result.push(reasonRow)
    }

    if (group.separatorRow && index < dataGroups.length - 1) {
      result.push(group.separatorRow)
    }
  })

  return result
})

// 数据分组
const groupDataByItem = (data) => {
  const groups = []
  let currentGroup = null

  data.forEach(item => {
    if (item.rowType === 'data') {
      if (currentGroup) {
        groups.push(currentGroup)
      }
      currentGroup = { dataRow: item }
    } else if (item.rowType === 'action') {
      if (currentGroup) {
        currentGroup.actionRow = item
      }
    } else if (item.rowType === 'separator') {
      if (currentGroup) {
        currentGroup.separatorRow = item
      }
    }
  })

  if (currentGroup) {
    groups.push(currentGroup)
  }

  return groups
}

// 获取序号
const getSequenceNumber = (index) => {
  const rowsPerItem = columnConfig.value.showReasonRow ? 4 : 3
  return Math.floor(index / rowsPerItem) + 1
}

// 获取原因解释文本
const getReasonExplanation = (row) => {
  const priceStatus = row.priceMatchedStatus ||
                     (row.matchOptions?.[0]?.priceMatchedStatus)

  if (priceStatus === -1) {
    return REASON_EXPLANATIONS.PRICE_NOT_FOUND
  }

  if (priceStatus === 2) {
    return REASON_EXPLANATIONS.PRICE_MISMATCH
  }

  if (row.matchedType === 0) {
    if (row.matchOptions && row.matchOptions.length > 0) {
      return REASON_EXPLANATIONS.SIMILAR_MATCH
    }
    return REASON_EXPLANATIONS.NO_MATCH
  } else if (row.matchedType === 2) {
    return REASON_EXPLANATIONS.SIMILAR_MATCH
  }

  return ''
}

// 从父组件获取方法
const getMaterialMatchingStatusTag = (row) => {
  const matchType = MATCH_TYPE_MAP[row.matchedType] || 'NO_MATCH'
  return MATERIAL_MATCH_STATUS[matchType] || MATERIAL_MATCH_STATUS.NO_MATCH
}

const getPriceMatchingStatusTag = (row) => {
  return parentMethods.getPriceMatchingStatusTag?.(row) || { text: '-', type: 'info' }
}

const getBaseInfoName = (row) => {
  return parentMethods.getBaseInfoName?.(row) || row.materialName || '-'
}

const getBaseInfoSpec = (row) => {
  return parentMethods.getBaseInfoSpec?.(row) || row.specifications || '-'
}

const hasMaterialNameDifference = (row) => {
  return parentMethods.hasMaterialNameDifference?.(row) || false
}

const hasSpecificationDifference = (row) => {
  return parentMethods.hasSpecificationDifference?.(row) || false
}

const hasUnitDifference = (row) => {
  return parentMethods.hasUnitDifference?.(row) || false
}

const getTaxIncludedPrice = (row) => {
  return parentMethods.getTaxIncludedPrice?.(row) || '0.00'
}

const getTaxExcludedPrice = (row) => {
  return parentMethods.getTaxExcludedPrice?.(row) || '0.00'
}

const getActionRowTaxExcludedPrice = (row) => {
  return parentMethods.getActionRowTaxExcludedPrice?.(row) || 0
}

const getTaxRate = (row) => {
  return parentMethods.getTaxRate?.(row) || '13%'
}

const getDataSourceType = (row) => {
  return parentMethods.getDataSourceType?.(row) || { text: '数据库', type: 'success' }
}

const isPriceMismatch = (row) => {
  return parentMethods.isPriceMismatch?.(row) || false
}

const isPriceNotFound = (row) => {
  const priceStatus = row.priceMatchedStatus ||
                     (row.matchOptions?.[0]?.priceMatchedStatus)
  return priceStatus === -1
}

const formatPrice = (price) => {
  if (typeof price === 'number') {
    return price.toFixed(2)
  }
  if (typeof price === 'string' && price !== '') {
    const numPrice = parseFloat(price)
    if (!isNaN(numPrice)) {
      return numPrice.toFixed(2)
    }
  }
  return '0.00'
}

const formatNumber = (number) => {
  return parentMethods.formatNumber?.(number) || (number || '-')
}

const getRowClassName = (row) => {
  return parentMethods.getRowClassName?.(row) || ''
}

const getSequenceBarClass = (row) => {
  return parentMethods.getSequenceBarClass?.(row) || ''
}

// 简化的表格跨列方法
const tableSpanMethod = ({ row, columnIndex }) => {
  if (row.rowType === 'reason') {
    if (columnIndex === 0) {
      let totalColumns = 11
      if (columnConfig.value.showPriceMatchStatus) totalColumns += 1
      if (columnConfig.value.showMaterialMatchStatus) totalColumns += 1
      return { rowspan: 1, colspan: totalColumns }
    } else {
      return { rowspan: 0, colspan: 0 }
    }
  }

  return { rowspan: 1, colspan: 1 }
}
</script>

<style scoped>
/* 极简样式 - 只保留基本布局，移除所有动画和复杂效果 */
.supplier-material-table-simple {
  width: 100%;
}

.sequence-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sequence-bar {
  width: 3px;
  height: 16px;
  border-radius: 2px;
}

.reason-container {
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 8px;
  margin: 8px 12px;
  box-shadow:
    0 4px 12px rgba(14, 165, 233, 0.15),
    0 1px 3px rgba(14, 165, 233, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.reason-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1e40af;
}

.material-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.operation-container {
  padding: 4px;
}

.operation-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.price-mismatch-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f59e0b;
}

/* 状态条颜色 */
.sequence-bar.sequence-bar-green {
  background-color: #10b981;
}

.sequence-bar.sequence-bar-yellow {
  background-color: #f59e0b;
}

.sequence-bar.sequence-bar-red {
  background-color: #ef4444;
}

/* 基本的表格样式 */
:deep(.el-table) {
  border: 1px solid #e5e7eb;
}

:deep(.el-table th) {
  background-color: #f9fafb;
  color: #374151;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
}

/* 步骤1：添加表格行的基础样式和过渡效果 */
:deep(.supplier-material-table-simple .el-table__row) {
  transition: background-color 0.2s ease;
}

:deep(.supplier-material-table-simple .el-table__row:hover) {
  background-color: var(--el-fill-color-lighter);
}

/* 简化的规格不一致行样式 */
:deep(.spec-mismatch-row td) {
  background-color: #fef2f2 !important;
  border-left: 3px solid #ef4444 !important;
}

/* 步骤2：添加分隔行的复杂样式 */
:deep(.supplier-material-table-simple .el-table__row[class*="separator"]) {
  background-color: #f8f9fa !important;
  border-top: 1px solid #e9ecef !important;
  border-bottom: 1px solid #e9ecef !important;
  height: 12px !important;
}

:deep(.supplier-material-table-simple .el-table__row[class*="separator"]:hover) {
  background-color: #f8f9fa !important;
}

:deep(.supplier-material-table-simple .el-table__row[class*="separator"] .el-table__cell) {
  padding: 2px 0 !important;
  height: 12px !important;
  line-height: 12px !important;
}

/* 步骤2：添加原因解释行的复杂样式（但暂时不添加动画） */
:deep(.supplier-material-table-simple .el-table__row[class*="reason"]) {
  background-color: transparent !important;
}

:deep(.supplier-material-table-simple .el-table__row[class*="reason"]:hover) {
  background-color: transparent !important;
}

:deep(.supplier-material-table-simple .el-table__row[class*="reason"] .el-table__cell) {
  padding: 8px !important;
  border-bottom: none !important;
}

:deep(.supplier-material-table-simple .el-table__row[class*="reason"] .el-table__cell:first-child) {
  padding: 8px !important;
}

/* 步骤3：添加复杂的多重CSS选择器（类似原版） */
:deep(.el-table .el-table__row.spec-mismatch-row .el-table__cell),
:deep(.el-table .spec-mismatch-row .el-table__cell),
:deep(.spec-mismatch-row .el-table__cell),
:deep(.spec-mismatch-row td),
:deep(tr.spec-mismatch-row td) {
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.06) 0%,
    rgba(239, 68, 68, 0.03) 100%) !important;
  border-left: 4px solid #ef4444 !important;
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.1) !important;
}

:deep(.el-table .el-table__row.spec-mismatch-row:hover .el-table__cell),
:deep(.el-table .spec-mismatch-row:hover .el-table__cell),
:deep(.spec-mismatch-row:hover .el-table__cell),
:deep(.spec-mismatch-row:hover td),
:deep(tr.spec-mismatch-row:hover td) {
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.12) 0%,
    rgba(239, 68, 68, 0.06) 100%) !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2) !important;
}
</style>