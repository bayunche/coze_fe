<template>
  <div class="supplier-material-table-high-perf">
    <!-- 高性能版本：完全移除原因解释行，使用简单的两行结构 -->
    <el-table
      :data="simpleTableData"
      v-loading="loading"
      style="width: 100%"
      :row-class-name="getRowClassName"
      :row-key="row => row.rowKey"
      :span-method="simpleSpanMethod"
      v-bind="tableConfig"
    >
      <!-- 序号列 - 包含问题概览 -->
      <el-table-column label="序号" width="90" fixed="left">
        <template #default="{ row, $index }">
          <div v-if="row.rowType === 'data'" class="sequence-container">
            <div :class="getSequenceBarClass(row)" class="sequence-bar"></div>
            <div class="sequence-content">
              <div class="sequence-number">{{ getSequenceNumber($index) }}</div>
              <!-- 问题概览指示器 -->
              <div v-if="shouldShowReasonInfo(row)" class="reason-indicator" :class="getReasonIndicatorClass(row)">
                <el-icon class="reason-icon-tiny">
                  <component :is="getReasonIcon(row)" />
                </el-icon>
              </div>
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
          <div v-else>
            <el-tag :type="getMaterialMatchingStatusTag(row).type" size="small">
              {{ getMaterialMatchingStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 物资名称列 - 包含原因信息 -->
      <el-table-column prop="materialName" label="物资名称" width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="material-display">
            <div class="material-name">{{ getBaseInfoName(row) }}</div>
            <!-- 直接显示问题原因信息 -->
            <div v-if="shouldShowReasonInfo(row)" class="reason-display">
              <el-tag
                :type="getReasonTagType(row)"
                size="small"
                :effect="getReasonTagEffect(row)"
                class="problem-tag">
                <el-icon class="tag-icon">
                  <component :is="getReasonIcon(row)" />
                </el-icon>
                {{ getReasonShortText(row) }}
              </el-tag>
              <div v-if="getReasonExplanation(row)" class="explanation-text">
                {{ getReasonExplanation(row) }}
              </div>
            </div>
          </div>
          <div v-else-if="row.rowType === 'separator'">
            <!-- 分隔行显示为空 -->
          </div>
          <div v-else>
            <div class="material-display">
              <div class="material-name">
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
              </div>
              <!-- 操作行也显示原因信息 -->
              <div v-if="shouldShowReasonInfo(row)" class="reason-display">
                <el-tag
                  :type="getReasonTagType(row)"
                  size="small"
                  effect="light"
                  class="problem-tag">
                  <el-icon class="tag-icon">
                    <component :is="getReasonIcon(row)" />
                  </el-icon>
                  {{ getReasonShortText(row) }}
                </el-tag>
              </div>
              <!-- 差异标记 -->
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
              <!-- 差异标记 -->
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
              <!-- 差异标记 -->
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
  WarnTriangleFilled
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

// 简化的表格数据：只包含数据行和操作行
const simpleTableData = computed(() => {
  const result = []
  const dataGroups = groupDataByItem(props.data)

  dataGroups.forEach((group, index) => {
    // 添加数据行
    result.push(group.dataRow)

    // 添加操作行
    result.push(group.actionRow)

    // 添加分隔行（如果不是最后一组）
    if (group.separatorRow && index < dataGroups.length - 1) {
      result.push(group.separatorRow)
    }
  })

  return result
})


// 增强的数据分组 - 识别并处理原因行
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
    } else if (item.rowType === 'reason') {
      // 处理原因行
      if (currentGroup) {
        currentGroup.reasonRow = item
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
  // 简化计算：每组只有2行（数据行+操作行）或3行（+分隔行）
  return Math.floor(index / 3) + 1
}

// 获取原因图标组件（基于字符串）
const getReasonIconComponent = (iconType) => {
  switch (iconType) {
    case 'close':
      return Close
    case 'warning':
      return WarnTriangleFilled
    case 'info':
      return Check
    default:
      return Check
  }
}

// 从原因行数据获取原因图标类型
const getReasonIconType = (reasonRow) => {
  if (!reasonRow) return 'info'

  const reason = reasonRow.reason || ''
  if (reason.includes('未匹配')) return 'close'
  if (reason.includes('价格')) return 'warning'
  return 'info'
}

// 获取原因图标样式类
const getReasonIconClass = (reasonRow) => {
  const iconType = getReasonIconType(reasonRow)
  return `reason-icon-${iconType}`
}

// 从行数据获取原因文本
const getReasonText = (row) => {
  // 根据行数据分析生成原因文本
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    if (row.matchOptions && row.matchOptions.length > 0) {
      return '存在相似物资'
    }
    return '未找到匹配物资'
  } else if (priceStatus === -1) {
    return '价格信息缺失'
  } else if (priceStatus === 2) {
    return '价格不匹配'
  } else if (row.matchedType === 2) {
    return '相似匹配'
  }

  return ''
}

// 从行数据获取解释文本
const getExplanationText = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

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

// 判断是否需要显示原因信息
const shouldShowReasonInfo = (row) => {
  if (!row || (row.rowType !== 'data' && row.rowType !== 'action')) return false

  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  // 需要显示原因的情况：未匹配、价格不存在、价格不匹配、相似匹配
  return row.matchedType === 0 ||
         row.matchedType === 2 ||
         priceStatus === -1 ||
         priceStatus === 2
}

// 获取Element Plus标签类型
const getReasonTagType = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    return 'danger' // 未匹配 - 红色
  } else if (priceStatus === -1) {
    return 'warning' // 价格不存在 - 橙色
  } else if (priceStatus === 2) {
    return 'warning' // 价格不匹配 - 橙色
  } else if (row.matchedType === 2) {
    return 'primary' // 相似匹配 - 蓝色
  }

  return 'info' // 默认
}

// 获取标签效果
const getReasonTagEffect = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    return 'dark' // 未匹配用深色
  } else if (priceStatus === -1 || priceStatus === 2) {
    return 'plain' // 价格问题用浅色
  }

  return 'light' // 其他用浅色
}

// 获取原因指示器样式类
const getReasonIndicatorClass = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    return 'reason-indicator--danger'
  } else if (priceStatus === -1) {
    return 'reason-indicator--warning'
  } else if (priceStatus === 2) {
    return 'reason-indicator--caution'
  } else if (row.matchedType === 2) {
    return 'reason-indicator--info'
  }

  return 'reason-indicator--default'
}

// 判断是否需要显示原因提示
const shouldShowReasonTooltip = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  // 需要显示提示的情况：未匹配、价格不存在、价格不匹配、相似匹配
  return row.matchedType === 0 ||
         row.matchedType === 2 ||
         priceStatus === -1 ||
         priceStatus === 2
}

// 获取原因徽章样式类
const getReasonBadgeClass = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    return 'reason-badge--danger' // 未匹配 - 红色
  } else if (priceStatus === -1) {
    return 'reason-badge--warning' // 价格不存在 - 橙色
  } else if (priceStatus === 2) {
    return 'reason-badge--caution' // 价格不匹配 - 黄色
  } else if (row.matchedType === 2) {
    return 'reason-badge--info' // 相似匹配 - 蓝色
  }

  return 'reason-badge--default' // 默认 - 灰色
}

// 获取原因图标组件
const getReasonIcon = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    return Close // 未匹配
  } else if (priceStatus === -1) {
    return WarnTriangleFilled // 价格不存在
  } else if (priceStatus === 2) {
    return WarnTriangleFilled // 价格不匹配
  } else if (row.matchedType === 2) {
    return Check // 相似匹配
  }

  return Check // 默认
}

// 获取原因短文本
const getReasonShortText = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  if (row.matchedType === 0) {
    if (row.matchOptions && row.matchOptions.length > 0) {
      return '相似'
    }
    return '未匹配'
  } else if (priceStatus === -1) {
    return '无价格'
  } else if (priceStatus === 2) {
    return '价格异常'
  } else if (row.matchedType === 2) {
    return '相似匹配'
  }

  return '信息'
}

// 获取附加原因信息
const getAdditionalReasonInfo = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

  // 如果是相似匹配且有选项，显示选项数量
  if (row.matchedType === 0 && row.matchOptions && row.matchOptions.length > 0) {
    return `${row.matchOptions.length}个选项`
  }

  // 如果有价格差异，显示价格信息
  if (priceStatus === 2 && row.baseInfo?.price && row.matchOptions?.[0]?.price) {
    const originalPrice = parseFloat(row.baseInfo.price)
    const matchedPrice = parseFloat(row.matchOptions[0].price)
    const diff = Math.abs(originalPrice - matchedPrice)
    if (diff > 0.01) {
      return `差异¥${diff.toFixed(2)}`
    }
  }

  return ''
}

// 获取原因解释文本
const getReasonExplanation = (row) => {
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)

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
  const priceStatus = row.priceMatchedStatus || (row.matchOptions?.[0]?.priceMatchedStatus)
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

// 极简的跨行合并方法 - 无需复杂逻辑
const simpleSpanMethod = () => {
  // 所有行都正常显示，无需合并
  return { rowspan: 1, colspan: 1 }
}
</script>

<style scoped>
/* 高性能版本：极简样式，专注性能 */
.supplier-material-table-high-perf {
  width: 100%;
}

.sequence-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  position: relative;
  min-height: 40px;
  padding: 4px 0;
}

.sequence-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.sequence-number {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.problem-summary {
  display: flex;
  align-items: center;
  gap: 4px;
}

.problem-type {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.problem-type.reason-badge--danger {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.problem-type.reason-badge--warning {
  background-color: #fffbeb;
  border: 1px solid #fed7aa;
  color: #d97706;
}

.problem-type.reason-badge--info {
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
  color: #2563eb;
}

.problem-icon {
  font-size: 10px;
}

.problem-description {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.2;
}

.sequence-bar {
  width: 3px;
  height: 16px;
  border-radius: 2px;
}

.sequence-bar.sequence-bar-green {
  background-color: #10b981;
}

.sequence-bar.sequence-bar-yellow {
  background-color: #f59e0b;
}

.sequence-bar.sequence-bar-red {
  background-color: #ef4444;
}

/* 增强的原因徽章 - 更好的视觉效果 */
.reason-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: help;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.reason-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.reason-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.reason-text {
  white-space: nowrap;
  line-height: 1;
}

/* 不同类型的徽章样式 */
.reason-badge--danger {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.reason-badge--warning {
  background-color: #fffbeb;
  border: 1px solid #fed7aa;
  color: #d97706;
}

.reason-badge--caution {
  background-color: #fefce8;
  border: 1px solid #fde68a;
  color: #ca8a04;
}

.reason-badge--info {
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
  color: #2563eb;
}

.reason-badge--default {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
}
</style>

<!-- 全局样式：增强的tooltip -->
<style>
.enhanced-reason-tooltip {
  max-width: 300px !important;
}

.enhanced-reason-tooltip .el-tooltip__content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  padding: 12px 16px !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  color: #fff !important;
}

.enhanced-reason-tooltip .el-tooltip__arrow {
  border-right-color: #667eea !important;
}
</style>

<style scoped>
/* 物资显示样式 */
.material-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.material-name {
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
}

.reason-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.problem-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.problem-tag .tag-icon {
  font-size: 10px;
}

.explanation-text {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.3;
  padding: 2px 0;
  max-width: 200px;
}

/* 序号列增强样式 */
.sequence-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.sequence-number {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.reason-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reason-indicator--danger {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.reason-indicator--warning {
  background-color: #fffbeb;
  border: 1px solid #fed7aa;
  color: #d97706;
}

.reason-indicator--caution {
  background-color: #fefce8;
  border: 1px solid #fde68a;
  color: #ca8a04;
}

.reason-indicator--info {
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
  color: #2563eb;
}

.reason-indicator--default {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  color: #64748b;
}

.reason-icon-tiny {
  font-size: 8px;
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

/* 简化的规格不一致行样式 */
:deep(.spec-mismatch-row td) {
  background-color: #fef2f2 !important;
  border-left: 3px solid #ef4444 !important;
}

:deep(.spec-mismatch-row:hover td) {
  background-color: #fde7e7 !important;
}

/* 分隔行样式 */
:deep(.separator-row) {
  background-color: #f8f9fa !important;
  height: 8px !important;
}

:deep(.separator-row td) {
  padding: 2px 0 !important;
  height: 8px !important;
}

/* 自定义工具提示样式 */
:deep(.reason-tooltip) {
  max-width: 300px;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #334155;
}
</style>