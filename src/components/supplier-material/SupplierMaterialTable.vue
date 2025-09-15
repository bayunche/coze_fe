<template>
  <div class="supplier-material-table">
    <!-- 表格工具�?-->
    <div class="table-toolbar">
      <div class="toolbar-left">
        <!-- 预留给父组件的插�?-->
        <slot name="toolbar-left"></slot>
      </div>
      <div class="toolbar-right">

      </div>
    </div>

    <!-- 表格主体 -->
    <el-table
      :data="processedTableData"
      v-loading="loading"
      style="width: 100%"
      :row-class-name="getRowClassName"
      :row-key="row => row.rowKey"
      :span-method="tableSpanMethod"
      v-bind="tableConfig"
    >
      <!-- 序号�?-->
      <el-table-column label="序号" width="80" fixed="left">
        <template #default="{ row, $index }">
          <div v-if="row.rowType === 'data'" class="sequence-number-container">
            <div :class="getSequenceBarClass(row)" class="sequence-bar"></div>
            <span class="sequence-number">{{ getSequenceNumber($index) }}</span>
          </div>
            <!-- 原因解释�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell reason-explanation">
            <div class="reason-content">
              <el-icon class="reason-icon">
                <InfoFilled />
              </el-icon>
              <span class="reason-text">{{ getReasonExplanation(row) }}</span>
            </div>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
        
        </template>
      </el-table-column>

      <!-- 价格匹配状态列 -->
      <el-table-column 
        v-if="columnConfig.showPriceMatchStatus" 
        label="价格匹配状�? 
        width="140" 
        align="center"
      >
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            <el-tag :type="getPriceMatchingStatusTag(row).type" size="small">
              {{ getPriceMatchingStatusTag(row).text }}
            </el-tag>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <el-tag :type="getPriceMatchingStatusTag(row).type" size="small">
              {{ getPriceMatchingStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 物资匹配状态列 -->
      <el-table-column 
        v-if="columnConfig.showMaterialMatchStatus" 
        label="物资匹配状�? 
        width="140" 
        align="center"
      >
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            <el-tag :type="getMaterialMatchingStatusTag(row).type" size="small">
              {{ getMaterialMatchingStatusTag(row).text }}
            </el-tag>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <el-tag :type="getMaterialMatchingStatusTag(row).type" size="small">
              {{ getMaterialMatchingStatusTag(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 物资名称�?-->
      <el-table-column prop="materialName" label="物资名称" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            {{ getBaseInfoName(row) }}
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <div class="material-cell">
              <div class="material-content">
                <!-- 用户选择的物资信息（显示确认后的物资名称�?-->
                <span v-if="row.hasUserSelectedData && row.confirmedBaseName" class="text-sm text-gray-600">
                  {{ row.confirmedBaseName }}
                </span>
                <!-- 所有已匹配状态统一显示baseInfo -->
                <span v-else-if="row.baseInfo?.materialName" class="text-sm text-gray-600">
                  {{ row.baseInfo.materialName }}
                </span>
                <!-- 未匹配状态：显示等待选择 -->
                <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                  等待选择物资
                </span>
                <!-- 其他情况 -->
                <span v-else class="text-sm text-gray-500">
                  {{ '-' }}
                </span>
              </div>
              <!-- 数据差异标记（未匹配状态不显示�?-->
              <el-icon v-if="hasMaterialNameDifference(row) && row.matchedType !== 0" class="difference-marker">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 规格型号�?-->
      <el-table-column prop="specifications" label="规格型号" width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            {{ getBaseInfoSpec(row) }}
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <div class="material-cell">
              <div class="material-content">
                <!-- 用户选择的物资规格（显示确认后的规格型号�?-->
                <span v-if="row.hasUserSelectedData && row.confirmedBaseSpec" class="text-sm text-gray-600">
                  {{ row.confirmedBaseSpec }}
                </span>
                <!-- 所有已匹配状态统一显示baseInfo -->
                <span v-else-if="row.baseInfo?.specifications" class="text-sm text-gray-600">
                  {{ row.baseInfo.specifications }}
                </span>
                <!-- 未匹配状态：显示等待选择 -->
                <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                  等待选择规格
                </span>
                <!-- 其他情况 -->
                <span v-else class="text-sm text-gray-500">{{ '-' }}</span>
              </div>
              <!-- 数据差异标记（未匹配状态不显示�?-->
              <el-icon v-if="hasSpecificationDifference(row) && row.matchedType !== 0" class="difference-marker">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 单位�?-->
      <el-table-column prop="unit" label="单位" width="80">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            {{ row.unit || '-' }}
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <div class="material-cell">
              <div class="material-content">
                <!-- 优先显示baseInfo中的单位（匹配后的准确单位） -->
                <span v-if="row.baseInfo?.unit" class="text-sm text-gray-600">
                  {{ row.baseInfo.unit }}
                </span>
                <!-- 如果没有baseInfo但有用户选择的数据，显示selectedMaterial的单�?-->
                <span v-else-if="row.hasUserSelectedData && row.selectedMaterial?.unit" class="text-sm text-gray-600">
                  {{ row.selectedMaterial.unit }}
                </span>
                <!-- 未匹配状态：显示等待选择 -->
                <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                  等待选择
                </span>
                <!-- 其他情况 -->
                <span v-else class="text-sm text-gray-500">{{ '-' }}</span>
              </div>
              <!-- 数据差异标记（未匹配状态不显示�?-->
              <el-icon v-if="hasUnitDifference(row) && row.matchedType !== 0" class="difference-marker">
                <Close />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 数量�?-->
      <el-table-column prop="quantity" label="数量" width="100">
        <template #default="{ row }">
          <!-- 数据行和操作行都显示数量 -->
          <div v-if="row.rowType === 'data' || row.rowType === 'action'" class="data-cell">
            {{ formatNumber(row.quantity) }}
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
        </template>
      </el-table-column>

      <!-- 物资价格（含税）�?-->
      <el-table-column label="物资价格（含税）" width="140" align="right">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            <div class="price-value">
              <span class="price-text" :style="getPriceTextStyle(row, 'taxIncluded')">¥{{ getTaxIncludedPrice(row) }}</span>
              <el-icon v-if="getPriceChangeIcon(row, 'taxIncluded')" :style="getPriceChangeIconStyle(row, 'taxIncluded')">
                <component :is="getPriceChangeIcon(row, 'taxIncluded')" />
              </el-icon>
            </div>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <!-- 用户手动选择的价格信�?-->
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)" class="selected-price-info">
              <span class="price-text">¥{{ formatPrice(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0) }}</span>
            </div>
            <!-- 所有已匹配状态统一显示priceInfo -->
            <div v-else-if="row.priceInfo?.taxPrice" class="exact-match-price">
              <span class="price-text">¥{{ formatPrice(row.priceInfo.taxPrice) }}</span>
            </div>
            <!-- 未匹配和其他状态：显示类似股票的灰色显�?-->
            <div v-else class="empty-price-display">
              <span class="empty-price-text">¥--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 物资价格（不含税）列 -->
      <el-table-column label="物资价格（不含税�? width="140" align="right">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            <div class="price-value">
              <span class="price-text" :style="getPriceTextStyle(row, 'taxExcluded')">¥{{ getTaxExcludedPrice(row) }}</span>
              <el-icon v-if="getPriceChangeIcon(row, 'taxExcluded')" :style="getPriceChangeIconStyle(row, 'taxExcluded')">
                <component :is="getPriceChangeIcon(row, 'taxExcluded')" />
              </el-icon>
            </div>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <!-- 用户手动选择的不含税价格 -->
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)" class="selected-price-info">
              <span class="price-text">¥{{ formatPrice(getActionRowTaxExcludedPrice(row)) }}</span>
            </div>
            <!-- 所有已匹配状态统一从priceInfo计算不含税价�?-->
            <div v-else-if="row.priceInfo?.taxPrice" class="exact-match-price">
              <span class="price-text">¥{{ formatPrice(row.priceInfo.taxPrice ? row.priceInfo.taxPrice / 1.13 : 0) }}</span>
            </div>
            <!-- 未匹配和其他状态：显示类似股票的灰色显�?-->
            <div v-else class="empty-price-display">
              <span class="empty-price-text">¥--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 税率�?-->
      <el-table-column label="税率（上传时选择的税率，价格以该税率为基准计算）" width="240" align="center">
        <template #default="{ row }">
          <!-- 数据行和操作行都显示相同的税�?-->
          <div v-if="row.rowType === 'data' || row.rowType === 'action'" class="data-cell">
            <span class="tax-rate-text">{{ getTaxRate(row) }}</span>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
        </template>
      </el-table-column>

      <!-- 物资价格所属季度列 -->
      <el-table-column label="所属季�? width="120" align="center">
        <template #default="{ row }">
          <div v-if="row.rowType === 'data'" class="data-cell">
            <!-- 数据行不显示季度信息 -->
            <span class="text-sm text-gray-400">-</span>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <div v-else class="action-cell">
            <!-- 用户手动选择的季�?-->
            <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && (row.matchedType === 0 || row.isUserModified)" class="selected-price-info">
              <span class="quarter-text">{{ row.selectedPriceQuarter.quarter || '-' }}</span>
            </div>
            <!-- 所有已匹配状态统一显示priceInfo -->
            <div v-else-if="row.priceInfo?.quarter" class="exact-match-quarter">
              <span class="quarter-text">{{ row.priceInfo.quarter }}</span>
            </div>
            <!-- 未匹配和其他状态：显示类似股票的灰色显�?-->
            <div v-else class="empty-data-display">
              <span class="empty-data-text">--</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 数据来源�?-->
      <el-table-column label="数据来源" width="120" align="center">
        <template #default="{ row }">
          <!-- 数据行显示结算书 -->
          <div v-if="row.rowType === 'data'" class="data-cell">
            <span class="text-xs text-gray-500">结算�?/span>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          <!-- 操作行显示数据来源标�?-->
          <div v-else class="action-cell">
            <!-- 未匹配状态显示等待选择 -->
            <span v-if="row.matchedType === 0 && !row.hasUserSelectedData" class="text-xs text-gray-400 italic">
              等待选择
            </span>
            <!-- 其他状态显示数据来源标�?-->
            <el-tag v-else :type="getDataSourceType(row).type" size="small">
              {{ getDataSourceType(row).text }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 操作�?-->
      <el-table-column label="操作" width="260" align="center" class-name="operation-column" >
        <template #default="{ row }">
          <!-- 数据行：不显示任何操作内�?-->
          <div v-if="row.rowType === 'data'" class="data-cell operation-data-cell">
            <span class="text-xs text-gray-400">-</span>
          </div>
          <div v-else-if="row.rowType === 'separator'" class="separator-cell">
            <!-- 分隔行显示为�?-->
          </div>
          
          <!-- 原因解释�?-->
          <!-- 原因解释行（会被跨列覆盖，不显示�?-->
          <div v-else-if="row.rowType === 'reason'" class="reason-cell">
          </div>
          
          <!-- 操作行：根据匹配类型显示不同控件 -->
          <div v-else class="action-cell operation-action-cell">
            <!-- 已确认状态：显示状态和重选按�?-->
            <div v-if="row.confirmResult === 1" class="operation-group confirmed-state">
              <el-tag type="success" size="small" class="status-tag">
                <el-icon><Check /></el-icon>
                <span>已确�?/span>
              </el-tag>
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)" class="secondary-action">
                <el-icon><Edit /></el-icon>
                <span class="button-text">重�?/span>
              </el-button>
            </div>
            
            <!-- 未匹配且已选择：显示重新选择操作 -->
            <div v-else-if="row.matchedType === 0 && row.hasUserSelectedData" class="operation-group no-match-selected">
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)" class="single-action">
                <el-icon><Edit /></el-icon>
                <span class="button-text">重新选择</span>
              </el-button>
            </div>
            
            <!-- 未匹配且未选择：显示选择按钮 -->
            <div v-else-if="row.matchedType === 0" class="operation-group no-match-unselected">
              <el-button type="primary" plain size="small" @click="$emit('view-options', row)" class="single-action">
                <el-icon><Plus /></el-icon>
                <span class="button-text">从库选择</span>
              </el-button>
            </div>
            
            <!-- 价格不存在状态：只显示新增价格按�?-->
            <div v-else-if="isPriceNotFound(row)" class="operation-group price-not-found">
              <el-button type="primary" size="small" @click="$emit('add-price', row)" class="single-action">
                <el-icon><Plus /></el-icon>
                <span class="button-text">新增价格</span>
              </el-button>
            </div>

            <!-- 精确匹配且价格不匹配：仅显示提示信息，不显示任何操作按钮 -->
            <div v-else-if="isPriceMismatch(row)" class="operation-group price-mismatch">
              <el-tooltip content="价格不匹配，请确认结算书是否有误并进行修�? placement="top">
                <div class="price-mismatch-hint">
                  <el-icon class="warning-icon"><WarnTriangleFilled /></el-icon>
                  <span class="hint-text">价格不匹配，请确认结算书是否有误并进行修�?/span>
                </div>
              </el-tooltip>
            </div>
            
            <!-- 精确匹配且价格匹配：显示快速确认和重新选择按钮 -->
            <div v-else-if="row.matchedType === 1 && !isPriceMismatch(row)" class="operation-group exact-match">
              <el-button type="primary" size="small" @click="$emit('quick-confirm', row)" class="primary-action">
                <el-icon><Check /></el-icon>
                <span class="button-text">确认</span>
              </el-button>
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)" class="secondary-action">
                <el-icon><Edit /></el-icon>
                <span class="button-text">重�?/span>
              </el-button>
            </div>
            
            <!-- 相似匹配(2)、历史匹�?3)、人工匹�?4)：显示选择确认按钮 -->
            <div v-else-if="row.matchedType === 2 || row.matchedType === 3 || row.matchedType === 4" class="operation-group similar-match">
              <el-button type="primary" size="small" @click="$emit('view-options', row)" class="single-action">
                <el-icon><Edit /></el-icon>
                <span class="button-text">选择确认</span>
              </el-button>
            </div>
            
            <!-- 其他未知匹配类型：显示重选按�?-->
            <div v-else class="operation-group other-match">
              <el-button type="warning" plain size="small" @click="$emit('view-options', row)" class="single-action">
                <el-icon><Edit /></el-icon>
                <span class="button-text">重新选择</span>
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
  REASON_EXPLANATIONS,
  ROW_TYPES,
  MATCH_TYPE_MAP,
  TABLE_DEFAULT_CONFIG
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
  // 加载状�?
  loading: {
    type: Boolean,
    default: false
  },
  // 批量确认加载状�?
  batchConfirming: {
    type: Boolean,
    default: false
  },
  // 待确认数�?
  pendingCount: {
    type: Number,
    default: 0
  }
})

// Emits 定义
defineEmits([
  'quick-confirm',
  'view-options',
  'batch-confirm'
])

// 注入父组件的方法（用于访问父组件中的复杂逻辑函数�?
const parentMethods = inject('parentMethods', {})

// 表格配置
const tableConfig = computed(() => ({
  ...TABLE_DEFAULT_CONFIG,
  emptyText: '暂无数据'
}))

// 列配�?
const columnConfig = computed(() => {
  return TABLE_COLUMNS_CONFIG[props.tableType] || TABLE_COLUMNS_CONFIG[TABLE_TYPES.ALL]
})

// 处理后的表格数据，为未找到物资表格添加原因解释行
const processedTableData = computed(() => {
  if (!columnConfig.value.showReasonRow) {
    return props.data
  }

  // 为未找到物资表格添加原因解释�?
  const result = []
  const dataGroups = groupDataByItem(props.data)
  
  dataGroups.forEach((group, index) => {
    // 添加数据�?
    result.push(group.dataRow)
    // 添加操作�?
    result.push(group.actionRow)
    
    // 检查价格匹配状态（优先使用与matchOptions同级的字段）
    const priceStatus = group.actionRow.priceMatchedStatus ||
                       (group.actionRow.matchOptions?.[0]?.priceMatchedStatus)

    // 为需要解释的情况添加原因解释行（未找到物资、相似匹配、价格不存在、价格不一致）
    if (group.actionRow.matchedType === 0 || group.actionRow.matchedType === 2 || priceStatus === -1 || priceStatus === 2) {
      const reasonRow = {
        ...group.actionRow,
        rowType: ROW_TYPES.REASON,
        rowKey: `${group.actionRow.rowKey}-reason`
      }
      result.push(reasonRow)
    }
    
    // 添加分隔行（除了最后一组）
    if (group.separatorRow && index < dataGroups.length - 1) {
      result.push(group.separatorRow)
    }
  })
  
  return result
})

// 将数据按物资项分�?
const groupDataByItem = (data) => {
  const groups = []
  let currentGroup = null
  
  data.forEach(item => {
    if (item.rowType === 'data') {
      if (currentGroup) {
        groups.push(currentGroup)
      }
      currentGroup = {
        dataRow: item,
        actionRow: null,
        separatorRow: null
      }
    } else if (item.rowType === 'action' && currentGroup) {
      currentGroup.actionRow = item
    } else if (item.rowType === 'separator' && currentGroup) {
      currentGroup.separatorRow = item
    }
  })
  
  if (currentGroup) {
    groups.push(currentGroup)
  }
  
  return groups
}

// 获取序号
const getSequenceNumber = (index) => {
  // 根据是否有原因解释行来计算序�?
  const rowsPerItem = columnConfig.value.showReasonRow ? 4 : 3 // data + action + (reason) + separator
  return Math.floor(index / rowsPerItem) + 1
}

// 获取原因解释文本
const getReasonExplanation = (row) => {
  // 获取价格匹配状态（优先使用与matchOptions同级的字段）
  const priceStatus = row.priceMatchedStatus ||
                     (row.matchOptions?.[0]?.priceMatchedStatus)

  // 检查价格不存在状�?- 优先判断价格状�?
  if (priceStatus === -1) {
    return REASON_EXPLANATIONS.PRICE_NOT_FOUND
  }

  // 检查价格不一致状�?
  if (priceStatus === 2) {
    return REASON_EXPLANATIONS.PRICE_MISMATCH
  }

  if (row.matchedType === 0) {
    // 未找到物资：检查是否有推荐数据
    if (row.matchOptions && row.matchOptions.length > 0) {
      return REASON_EXPLANATIONS.SIMILAR_MATCH
    } else {
      return REASON_EXPLANATIONS.NO_MATCH
    }
  } else if (row.matchedType === 2) {
    // 相似匹配：显示AI推荐说明
    return REASON_EXPLANATIONS.SIMILAR_MATCH
  }

  return ''
}

// 获取物资匹配状态标�?
const getMaterialMatchingStatusTag = (row) => {
  const matchType = MATCH_TYPE_MAP[row.matchedType] || 'NO_MATCH'
  return MATERIAL_MATCH_STATUS[matchType] || MATERIAL_MATCH_STATUS.NO_MATCH
}

// 从父组件方法中获取各种处理函�?
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

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
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
  return parentMethods.getDataSourceType?.(row) || { text: '数据�?, type: 'success' }
}

const isPriceMismatch = (row) => {
  return parentMethods.isPriceMismatch?.(row) || false
}

// 判断是否为价格不存在状态（新增功能，不影响现有逻辑�?
const isPriceNotFound = (row) => {
  // 获取价格匹配状态（优先使用与matchOptions同级的字段）
  const priceStatus = row.priceMatchedStatus ||
                     (row.matchOptions?.[0]?.priceMatchedStatus)

  // 返回是否为价格不存在状�?
  return priceStatus === -1
}

const formatPrice = (price) => {
  // 处理数字类型
  if (typeof price === 'number') {
    return price.toFixed(2)
  }
  // 处理字符串类�?- 尝试转换为数�?
  if (typeof price === 'string' && price !== '') {
    const numPrice = parseFloat(price)
    if (!isNaN(numPrice)) {
      return numPrice.toFixed(2)
    }
  }
  // 默认返回
  return '0.00'
}

const getPriceTextStyle = (row, priceType) => {
  return parentMethods.getPriceTextStyle?.(row, priceType) || {}
}

const getPriceChangeIcon = (row, priceType) => {
  return parentMethods.getPriceChangeIcon?.(row, priceType) || null
}

const getPriceChangeIconStyle = (row, priceType) => {
  return parentMethods.getPriceChangeIconStyle?.(row, priceType) || {}
}

const getRowClassName = (row) => {
  return parentMethods.getRowClassName?.(row) || ''
}

const getSequenceBarClass = (row) => {
  return parentMethods.getSequenceBarClass?.(row) || ''
}

// 表格跨列方法 - 处理原因解释�?
const tableSpanMethod = ({ row, columnIndex }) => {
  // 原因解释行需要跨所有列
  if (row.rowType === 'reason') {
    // 第一列显示全部内容，跨所有列
    if (columnIndex === 0) {
      // 计算总列数（根据当前列配置动态计算）
      let totalColumns = 11 // 基础列数：序号、物资名称、规格型号、单位、数量、含税价格、不含税价格、税率、季度、数据来源、操�?
      if (columnConfig.value.showPriceMatchStatus) totalColumns += 1
      if (columnConfig.value.showMaterialMatchStatus) totalColumns += 1
      return { rowspan: 1, colspan: totalColumns }
    } else {
      // 其他列隐�?
      return { rowspan: 0, colspan: 0 }
    }
  }
  
  // 其他行正常显�?
  return { rowspan: 1, colspan: 1 }
}

// 批量确认处理
// const handleBatchConfirm = () => {
//   emits('batch-confirm')
// }
</script>

<style scoped>
/* 表格容器样式 */
.supplier-material-table {
  width: 100%;
  overflow-x: auto;
}

/* 表格主体样式优化 */
.supplier-material-table :deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

.supplier-material-table :deep(.el-table__body-wrapper) {
  border-radius: 0 0 8px 8px;
}

/* 工具栏样�?*/
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(var(--theme-primary-rgb), 0.05);
  border-radius: 8px;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.15);
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 表格行类型样�?*/
.data-cell {
  padding: 8px 12px;
}

.action-cell {
  padding: 8px 12px;
}

.separator-cell {
  padding: 2px 0 !important;
  height: 8px !important;
  line-height: 8px !important;
}

.reason-cell {
  padding: 0 !important;
}

/* 原因解释行内容样�?*/
.reason-cell.reason-explanation {
  padding: 14px 16px !important;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
  border: 2px solid #0ea5e9 !important;
  border-radius: 8px !important;
  margin: 8px 12px !important;
  box-shadow: 
    0 4px 12px rgba(14, 165, 233, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
  position: relative !important;
  overflow: hidden !important;
}

.reason-cell.reason-explanation::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6, #0ea5e9);
  background-size: 200% 200%;
  border-radius: 10px;
  z-index: -1;
  /* animation: aiGlow 4s ease-in-out infinite; 暂时禁用动画 */
  transform: translate3d(0, 0, 0); /* 启用硬件加速 */
  opacity: 0.8;
}

.reason-cell.reason-explanation::after {
  content: '🤖 AI';
  position: absolute;
  top: 6px;
  right: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  background: rgba(59, 130, 246, 0.15);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  /* animation: aiPulse 3s ease-in-out infinite; 暂时禁用动画 */
  transform: translate3d(0, 0, 0); /* 启用硬件加速 */
}

@keyframes aiGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes aiPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1.05);
  }
}

.reason-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.reason-icon {
  font-size: 18px;
  margin-top: 2px;
  flex-shrink: 0;
  color: #0ea5e9;
  filter: drop-shadow(0 1px 2px rgba(14, 165, 233, 0.3));
  /* animation: iconFloat 2s ease-in-out infinite; 暂时禁用动画 */
  transform: translate3d(0, 0, 0); /* 启用硬件加速 */
}

@keyframes iconFloat {
  0%, 100% { transform: translate3d(0, 0px, 0); }
  50% { transform: translate3d(0, -1px, 0); }
}

.reason-text {
  flex: 1;
  color: #1e40af;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  white-space: pre-line;
}

/* AI推荐特殊样式 */
.reason-content .reason-text::first-letter {
  font-size: 1.2em;
  font-weight: 600;
  color: #0ea5e9;
}


/* 序号列样式优�?*/
.sequence-number-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.sequence-bar {
  width: 3px;
  height: 16px;
  border-radius: 2px;
}

.sequence-number {
  font-weight: 500;
  font-size: 14px;
}

/* 表格行样式优�?- 使用更强的选择�?*/
:deep(.supplier-material-table .el-table__row) {
  /* 移除transition避免滚动时的性能问题 */
}

:deep(.supplier-material-table .el-table__row:hover) {
  background-color: var(--el-fill-color-lighter);
}

/* 分隔行样�?- 使用更强的选择�?*/
:deep(.supplier-material-table .el-table__row[class*="separator"]) {
  background-color: #f8f9fa !important;
  border-top: 1px solid #e9ecef !important;
  border-bottom: 1px solid #e9ecef !important;
  height: 12px !important;
}

:deep(.supplier-material-table .el-table__row[class*="separator"]:hover) {
  background-color: #f8f9fa !important;
}

:deep(.supplier-material-table .el-table__row[class*="separator"] .el-table__cell) {
  padding: 2px 0 !important;
  height: 12px !important;
  line-height: 12px !important;
}

/* 原因解释行整行样�?- 使用更强的选择�?*/
:deep(.supplier-material-table .el-table__row[class*="reason"]) {
  background-color: transparent !important;
}

/* 规格型号不一致行的红色标记样�?- 在组件级别也添加样式穿�?*/
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

:deep(.supplier-material-table .el-table__row[class*="reason"]:hover) {
  background-color: transparent !important;
}

:deep(.supplier-material-table .el-table__row[class*="reason"] .el-table__cell) {
  padding: 8px !important;
  border-bottom: none !important;
}

/* 原因解释行第一列的特殊样式 */
:deep(.supplier-material-table .el-table__row[class*="reason"] .el-table__cell:first-child) {
  padding: 8px !important;
}

/* 性能优化：滚动容器优化 */
:deep(.el-table__body-wrapper) {
  /* 优化滚动性能 */
  overflow-anchor: none;
  /* 启用硬件加速 */
  transform: translate3d(0, 0, 0);
  /* 优化滚动平滑度 */
  -webkit-overflow-scrolling: touch;
}

/* 性能优化：条件性启用动画 */
@media (prefers-reduced-motion: no-preference) and (min-width: 1367px) {
  .reason-cell.reason-explanation::before {
    animation: aiGlow 4s ease-in-out infinite;
    will-change: background-position;
  }

  .reason-cell.reason-explanation::after {
    animation: aiPulse 3s ease-in-out infinite;
    will-change: opacity, transform;
  }

  .reason-icon {
    animation: iconFloat 2s ease-in-out infinite;
    will-change: transform;
  }
}

/* 减少动画复杂度的媒体查询 */
@media (max-width: 1366px) {
  /* 在较小屏幕上禁用复杂动画 */
  .reason-cell.reason-explanation::before,
  .reason-cell.reason-explanation::after,
  .reason-icon {
    animation: none !important;
  }
}
</style>
