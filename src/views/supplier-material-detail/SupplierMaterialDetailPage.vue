<template>
  <div :class="CSS_CLASSES.PAGE_CONTAINER">
    <!-- 页面头部 -->
    <div :class="CSS_CLASSES.PAGE_HEADER">
      <div class="header-left">
        <el-button
          @click="handleGoBack"
          :icon="ArrowLeft"
          type="text"
          :class="CSS_CLASSES.BACK_BUTTON"
        >
          {{ BUTTON_CONFIG.BACK.text }}
        </el-button>
        <div :class="CSS_CLASSES.TITLE_SECTION">
          <h1 class="page-title">乙供物资解析结果确认</h1>
          <p class="page-subtitle">任务ID: {{ taskId }} | 详情ID: {{ detailId }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :icon="Refresh" type="default" :loading="refreshLoading">
          刷新数据
        </el-button>
        <el-button @click="handleExport" :icon="Download" type="default" :loading="exportLoading">
          导出数据
        </el-button>
        <el-button
          @click="handleBatchConfirm"
          :icon="Check"
          type="success"
          :loading="batchConfirming"
          :disabled="pendingCount === 0"
        >
          批量确认全部
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div :class="CSS_CLASSES.PAGE_CONTENT" v-loading="pageLoading">
      <!-- 搜索和筛选工具栏 -->
      <div class="search-toolbar">
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索物资名称、规格型号或单位"
            clearable
            class="search-input"
            @input="handleSearch"
            @clear="handleSearchClear"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="filter-section">
          <el-select
            v-model="queryParams.confirmResult"
            placeholder="确认状态"
            clearable
            @change="handleFilterChange"
            class="filter-select"
          >
            <el-option label="全部状态" :value="undefined" />
            <el-option label="未确认" :value="0" />
            <el-option label="已确认" :value="1" />
          </el-select>

          <el-select
            v-model="queryParams.matchedType"
            placeholder="匹配类型"
            clearable
            @change="handleFilterChange"
            class="filter-select"
          >
            <el-option label="全部类型" :value="undefined" />
            <el-option label="无匹配" :value="0" />
            <el-option label="精确匹配" :value="1" />
            <el-option label="相似匹配" :value="2" />
            <el-option label="历史匹配" :value="3" />
            <el-option label="人工匹配" :value="4" />
          </el-select>
        </div>
      </div>

      <!-- 物资详情表格区块 -->
      <div :class="CSS_CLASSES.TABLE_SECTION">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="total-info">
              共 {{ total }} 条记录，已确认 {{ confirmedCount }} 条，待确认 {{ pendingCount }} 条
            </span>
          </div>
          <div class="toolbar-right">
            <el-button
              type="success"
              :loading="batchConfirming"
              :disabled="pendingCount === 0"
              @click="handleBatchConfirm"
              size="small"
            >
              批量确认全部
            </el-button>
          </div>
        </div>

        <el-table
          :data="materialData"
          v-loading="tableLoading"
          style="width: 100%"
          :row-class-name="getRowClassName"
          :row-key="row => row.rowKey"
          :span-method="tableSpanMethod"
          border
          stripe
          max-height="60vh"
        >
          <el-table-column label="序号" width="80">
            <template #default="{ row, $index }">
              <span v-if="row.rowType === 'data'">{{ Math.floor($index / 2) + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="materialName" label="物资名称" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                {{ getBaseInfoName(row) }}
              </div>
              <div v-else class="action-cell">
                <div class="material-cell">
                  <div class="material-content">
                    <!-- 用户选择的物资信息（显示确认后的物资名称） -->
                    <span v-if="row.hasUserSelectedData && row.confirmedBaseName" class="text-sm text-gray-600">
                      {{ row.confirmedBaseName }}
                    </span>
                    <!-- 相似匹配显示选中的物资名称 -->
                    <span v-else-if="row.matchedType === 2 && row.selectedMaterial" class="text-sm text-gray-600">
                      {{ row.selectedMaterial.materialName || row.selectedMaterial.baseInfo?.materialName || row.materialName || '-' }}
                    </span>
                    <!-- 精确匹配显示匹配的物资名称 -->
                    <span v-else-if="row.matchedType === 1" class="text-sm text-gray-600">
                      {{ row.materialName || '-' }}
                    </span>
                    <!-- 未匹配状态：显示等待选择 -->
                    <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                      等待选择物资
                    </span>
                    <!-- 其他情况显示原始物资名称 -->
                    <span v-else class="text-sm text-gray-500">
                      {{ row.materialName || '-' }}
                    </span>
                  </div>
                  <!-- 数据差异标记（未匹配状态不显示） -->
                  <el-icon v-if="hasMaterialNameDifference(row) && row.matchedType !== 0" class="difference-marker">
                    <Close />
                  </el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="specifications" label="规格型号" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                {{ getBaseInfoSpec(row) }}
              </div>
              <div v-else class="action-cell">
                <div class="material-cell">
                  <div class="material-content">
                    <!-- 用户选择的物资规格（显示确认后的规格型号） -->
                    <span v-if="row.hasUserSelectedData && row.confirmedBaseSpec" class="text-sm text-gray-600">
                      {{ row.confirmedBaseSpec }}
                    </span>
                    <!-- 相似匹配：显示选中物资的规格型号 -->
                    <span v-else-if="row.matchedType === 2 && row.selectedMaterial" class="text-sm text-gray-600">
                      {{ row.selectedMaterial.baseInfo?.specifications || row.selectedMaterial.specificationModel || row.specifications || '-' }}
                    </span>
                    <!-- 精确匹配显示匹配的规格型号 -->
                    <span v-else-if="row.matchedType === 1" class="text-sm text-gray-600">
                      {{ row.specifications || '-' }}
                    </span>
                    <!-- 未匹配状态：显示等待选择 -->
                    <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                      等待选择规格
                    </span>
                    <!-- 其他情况显示原始规格 -->
                    <span v-else class="text-sm text-gray-500">{{ row.specifications || '-' }}</span>
                  </div>
                  <!-- 数据差异标记（未匹配状态不显示） -->
                  <el-icon v-if="hasSpecificationDifference(row) && row.matchedType !== 0" class="difference-marker">
                    <Close />
                  </el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="unit" label="单位" width="80">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                {{ row.unit || '-' }}
              </div>
              <div v-else class="action-cell">
                <div class="material-cell">
                  <div class="material-content">
                    <!-- 用户选择的物资单位（不包括相似匹配） -->
                    <span v-if="row.hasUserSelectedData && row.selectedMaterial && row.matchedType !== 2" class="text-sm text-gray-600">
                      {{ row.selectedMaterial.unit || '-' }}
                    </span>
                    <!-- 相似匹配状态显示选中物资的单位 -->
                    <span v-else-if="row.matchedType === 2 && row.selectedMaterial" class="text-sm text-gray-600">
                      {{ row.selectedMaterial.unit || row.unit || '-' }}
                    </span>
                    <!-- 精确匹配状态显示单位 -->
                    <span v-else-if="row.matchedType === 1" class="text-sm text-gray-600">
                      {{ row.unit || '-' }}
                    </span>
                    <!-- 未匹配状态：显示等待选择 -->
                    <span v-else-if="row.matchedType === 0" class="text-sm text-gray-400 italic">
                      等待选择
                    </span>
                    <!-- 其他情况 -->
                    <span v-else class="text-sm text-gray-500">{{ row.unit || '-' }}</span>
                  </div>
                  <!-- 数据差异标记（未匹配状态不显示） -->
                  <el-icon v-if="hasUnitDifference(row) && row.matchedType !== 0" class="difference-marker">
                    <Close />
                  </el-icon>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="quantity" label="数量" width="100">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                {{ formatNumber(row.quantity) }}
              </div>
              <!-- 操作行不显示数量 -->
              <div v-else class="action-cell">
                <span class="text-sm text-gray-500">-</span>
              </div>
            </template>
          </el-table-column>


          <!-- 数据来源列 -->
          <el-table-column label="数据来源" width="100" align="center">
            <template #default="{ row }">
              <!-- 数据行不显示数据来源标签 -->
              <div v-if="row.rowType === 'data'" class="data-cell">
                <span class="text-xs text-gray-400">-</span>
              </div>
              <!-- 操作行显示数据来源标签 -->
              <div v-else class="action-cell">
                <!-- 未匹配状态显示等待选择 -->
                <span v-if="row.matchedType === 0 && !row.hasUserSelectedData" class="text-xs text-gray-400 italic">
                  等待选择
                </span>
                <!-- 其他状态显示数据来源标签 -->
                <el-tag v-else :type="getDataSourceType(row).type" size="small">
                  {{ getDataSourceType(row).text }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <!-- 物资价格（含税）列 -->
          <el-table-column label="物资价格（含税）" width="130" align="right">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                <div class="price-value">
                  <span class="price-text" :style="getPriceTextStyle(row, 'taxIncluded')">¥{{ getTaxIncludedPrice(row) }}</span>
                  <el-icon v-if="getPriceChangeIcon(row, 'taxIncluded')" :style="getPriceChangeIconStyle(row, 'taxIncluded')">
                    <component :is="getPriceChangeIcon(row, 'taxIncluded')" />
                  </el-icon>
                </div>
              </div>
              <div v-else class="action-cell">
                <!-- 用户手动选择的价格信息（不包括相似匹配） -->
                <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && row.matchedType !== 2" class="selected-price-info">
                  <span class="price-text">¥{{ formatPrice(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0) }}</span>
                </div>
                <!-- 精确匹配：显示匹配的价格信息 -->
                <div v-else-if="row.matchedType === 1 && row.selectedPriceQuarter" class="exact-match-price">
                  <span class="price-text">¥{{ formatPrice(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0) }}</span>
                </div>
                <!-- 相似匹配：显示匹配的价格信息 -->
                <div v-else-if="row.matchedType === 2 && row.selectedPriceQuarter" class="similar-match-price">
                  <span class="price-text">¥{{ formatPrice(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0) }}</span>
                </div>
                <!-- 未匹配和其他状态：显示类似股票的灰色显示 -->
                <div v-else class="empty-price-display">
                  <span class="empty-price-text">¥--</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 物资价格（不含税）列 -->
          <el-table-column label="物资价格（不含税）" width="130" align="right">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                <div class="price-value">
                  <span class="price-text" :style="getPriceTextStyle(row, 'taxExcluded')">¥{{ getTaxExcludedPrice(row) }}</span>
                  <el-icon v-if="getPriceChangeIcon(row, 'taxExcluded')" :style="getPriceChangeIconStyle(row, 'taxExcluded')">
                    <component :is="getPriceChangeIcon(row, 'taxExcluded')" />
                  </el-icon>
                </div>
              </div>
              <div v-else class="action-cell">
                <!-- 用户手动选择的不含税价格（不包括相似匹配） -->
                <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && row.matchedType !== 2" class="selected-price-info">
                  <span class="price-text">¥{{ formatPrice(getActionRowTaxExcludedPrice(row)) }}</span>
                </div>
                <!-- 精确匹配：显示匹配的不含税价格信息 -->
                <div v-else-if="row.matchedType === 1 && row.selectedPriceQuarter" class="exact-match-price">
                  <span class="price-text">¥{{ formatPrice(getActionRowTaxExcludedPrice(row)) }}</span>
                </div>
                <!-- 相似匹配：显示匹配的不含税价格信息 -->
                <div v-else-if="row.matchedType === 2 && row.selectedPriceQuarter" class="similar-match-price">
                  <span class="price-text">¥{{ formatPrice(getActionRowTaxExcludedPrice(row)) }}</span>
                </div>
                <!-- 未匹配和其他状态：显示类似股票的灰色显示 -->
                <div v-else class="empty-price-display">
                  <span class="empty-price-text">¥--</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 税率列 -->
          <el-table-column label="税率" width="80" align="center">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                <span class="tax-rate-text">{{ getTaxRate(row) }}</span>
              </div>
              <div v-else class="action-cell">
                <!-- 用户手动选择的税率（不包括相似匹配） -->
                <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && row.matchedType !== 2" class="selected-tax-rate">
                  <span class="tax-rate-text">{{ getSelectedTaxRate(row) }}</span>
                </div>
                <!-- 精确匹配：显示匹配的税率信息 -->
                <div v-else-if="row.matchedType === 1 && row.selectedPriceQuarter" class="exact-match-tax-rate">
                  <span class="tax-rate-text">{{ getSelectedTaxRate(row) }}</span>
                </div>
                <!-- 相似匹配：显示匹配的税率信息 -->
                <div v-else-if="row.matchedType === 2 && row.selectedPriceQuarter" class="similar-match-tax-rate">
                  <span class="tax-rate-text">{{ getSelectedTaxRate(row) }}</span>
                </div>
                <!-- 未匹配和其他状态：显示类似股票的灰色显示 -->
                <div v-else class="empty-data-display">
                  <span class="empty-data-text">--</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 物资价格所属季度列 -->
          <el-table-column label="物资价格所属季度" width="100" align="center">
            <template #default="{ row }">
              <div v-if="row.rowType === 'data'" class="data-cell">
                <!-- 数据行不显示季度信息 -->
                <span class="text-sm text-gray-400">-</span>
              </div>
              <div v-else class="action-cell">
                <!-- 用户手动选择的季度（不包括相似匹配） -->
                <div v-if="row.hasUserSelectedData && row.selectedPriceQuarter && row.matchedType !== 2" class="selected-price-info">
                  <span class="quarter-text">{{ row.selectedPriceQuarter.quarter || '-' }}</span>
                </div>
                <!-- 精确匹配：显示匹配的季度信息 -->
                <div v-else-if="row.matchedType === 1 && row.selectedPriceQuarter" class="exact-match-quarter">
                  <span class="quarter-text">{{ row.selectedPriceQuarter.quarter || '-' }}</span>
                </div>
                <!-- 相似匹配：显示匹配的季度信息 -->
                <div v-else-if="row.matchedType === 2 && row.selectedPriceQuarter" class="similar-match-quarter">
                  <span class="quarter-text">{{ row.selectedPriceQuarter.quarter || '-' }}</span>
                </div>
                <!-- 未匹配和其他状态：显示类似股票的灰色显示 -->
                <div v-else class="empty-data-display">
                  <span class="empty-data-text">--</span>
                </div>
              </div>
            </template>
          </el-table-column>


          <el-table-column label="操作" min-width="200" align="center" class-name="operation-column">
            <template #default="{ row }">
              <!-- 数据行：不显示任何操作内容 -->
              <div v-if="row.rowType === 'data'" class="data-cell operation-data-cell">
                <span class="text-xs text-gray-400">-</span>
              </div>
              
              <!-- 操作行：根据匹配类型显示不同控件 -->
              <div v-else class="action-cell operation-action-cell">
                <!-- 已确认状态：显示状态和重选按钮 -->
                <div v-if="row.confirmResult === 1" class="operation-group confirmed-state">
                  <el-tag type="success" size="small" class="status-tag">
                    <el-icon><Check /></el-icon>
                    <span>已确认</span>
                  </el-tag>
                  <el-button type="warning" plain size="small" @click="handleViewOptions(row)" class="secondary-action">
                    <el-icon><Edit /></el-icon>
                    <span class="button-text">重选</span>
                  </el-button>
                </div>
                
                <!-- 相似匹配：显示重新选择按钮 -->
                <div v-else-if="row.matchedType === 2" class="operation-group similar-match">
                  <el-button type="primary" size="small" @click="handleViewOptions(row)" class="single-action">
                    <el-icon><Edit /></el-icon>
                    <span class="button-text">选择确认</span>
                  </el-button>
                </div>
                
                <!-- 未匹配且已选择：显示重新选择操作 -->
                <div v-else-if="row.matchedType === 0 && row.hasUserSelectedData" class="operation-group no-match-selected">
                  <el-button type="warning" plain size="small" @click="handleViewOptions(row)" class="single-action">
                    <el-icon><Edit /></el-icon>
                    <span class="button-text">重新选择</span>
                  </el-button>
                </div>
                
                <!-- 未匹配且未选择：显示选择按钮 -->
                <div v-else-if="row.matchedType === 0" class="operation-group no-match-unselected">
                  <el-button type="primary" plain size="small" @click="handleViewOptions(row)" class="single-action">
                    <el-icon><Plus /></el-icon>
                    <span class="button-text">从库选择</span>
                  </el-button>
                </div>
                
                <!-- 精确匹配：显示快速确认和重新选择按钮 -->
                <div v-else-if="row.matchedType === 1" class="operation-group exact-match">
                  <el-button type="primary" size="small" @click="handleQuickConfirm(row)" class="primary-action">
                    <el-icon><Check /></el-icon>
                    <span class="button-text">确认</span>
                  </el-button>
                  <el-button type="warning" plain size="small" @click="handleViewOptions(row)" class="secondary-action">
                    <el-icon><Edit /></el-icon>
                    <span class="button-text">重选</span>
                  </el-button>
                </div>
                
                <!-- 其他匹配类型：显示重选按钮 -->
                <div v-else class="operation-group other-match">
                  <el-button type="primary" size="small" @click="handleViewOptions(row)" class="single-action">
                    <el-icon><Edit /></el-icon>
                    <span class="button-text">选择确认</span>
                  </el-button>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="PAGINATION_CONFIG.page_sizes"
          :layout="PAGINATION_CONFIG.layout"
          :total="total"
          :background="PAGINATION_CONFIG.background"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          style="margin-top: 20px; text-align: right"
        />

        <!-- 页面底部操作按钮 -->
        <div class="page-footer">
          <el-button @click="handleBack">关闭</el-button>
          <el-button
            v-if="shouldShowSaveButton"
            type="primary"
            @click="handleSaveResults"
            :loading="saving"
            :disabled="!hasModifiedData"
          >
            保存解析结果
          </el-button>
        </div>
      </div>
    </div>

    <!-- 物资价格选择弹窗 -->
    <MaterialPriceSelectionDialog
      v-model="showMaterialPriceDialog"
      :row-data="currentSelectionRow"
      :show-recommend="true"
      @confirm="handleMaterialPriceSelection"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

// 定义 props 接收路由参数
const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  },
  detailId: {
    type: [String, Number],
    required: true
  }
})
import { ArrowLeft, Refresh, Download, Check, Search, Edit, Plus, ArrowDown, ArrowUp, Close, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MaterialPriceSelectionDialog from '@/components/common/MaterialPriceSelectionDialog'
import {
  getSupplierMaterialParsingResults,
  querySupplierMaterialsComplex,
  confirmSupplierMaterialData
} from '@/utils/backendWorkflow.js'

// 导入常量和工具函数
import { BUTTON_CONFIG, PAGINATION_CONFIG, CSS_CLASSES } from './constants.js'

import { useNavigation } from './utils.js'

// 路由参数 - 使用 props 传递的参数
const taskId = computed(() => {
  console.log('【调试】详情页面 - taskId props:', props.taskId)
  return props.taskId
})
const detailId = computed(() => {
  console.log('【调试】详情页面 - detailId props:', props.detailId)
  return props.detailId
})

// 导航函数
const { goBack } = useNavigation()

// 响应式数据
const pageLoading = ref(false)
const tableLoading = ref(false)
const refreshLoading = ref(false)
const batchConfirming = ref(false)
const exportLoading = ref(false)
const saving = ref(false)

const materialData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 物资价格选择弹窗状态
const showMaterialPriceDialog = ref(false)
const currentSelectionRow = ref(null)

// 搜索和筛选参数
const searchKeyword = ref('')
const queryParams = ref({
  confirmResult: undefined,
  matchedType: undefined
})
const statistics = ref(null)
const useComplexQuery = ref(true) // 是否使用复杂查询接口

// 计算确认统计
const confirmedCount = computed(() => {
  return materialData.value.filter((item) => item.confirmResult === 1).length
})

// 计算是否有修改过的数据
const hasModifiedData = computed(() => {
  return materialData.value.some((item) => item.isUserModified === true)
})

// 计算是否应该显示保存按钮（有未确认的数据或有修改过的数据）
const shouldShowSaveButton = computed(() => {
  const hasUnconfirmed = materialData.value.some((item) => item.confirmResult !== 1)
  const hasModified = hasModifiedData.value
  return hasUnconfirmed || hasModified
})

const pendingCount = computed(() => {
  return materialData.value.filter((item) => item.confirmResult !== 1).length
})

/**
 * 获取解析结果数据
 */
const fetchData = async () => {
  if (!taskId.value) return

  tableLoading.value = true
  try {
    let response

    if (useComplexQuery.value) {
      // 使用复杂查询接口
      const params = {
        taskId: taskId.value,
        page: currentPage.value - 1,
        size: pageSize.value
      }

      // 添加搜索关键词
      if (searchKeyword.value && searchKeyword.value.trim()) {
        params.keyword = searchKeyword.value.trim()
      }

      // 添加筛选条件
      if (queryParams.value.confirmResult !== undefined) {
        params.confirmResult = queryParams.value.confirmResult
      }

      if (queryParams.value.matchedType !== undefined) {
        params.matchedType = queryParams.value.matchedType
      }

      console.log('使用复杂查询参数:', params)
      response = await querySupplierMaterialsComplex(params)

      if (response && response.data) {
        // 获取数据并初始化每行数据，转换为双行结构
        const rawData = response.data.content || []
        materialData.value = rawData.flatMap((item) => {
          const initialized = initializeRowData(item)
          const dataRow = { ...initialized, rowType: 'data', rowKey: `${initialized.taskDataId || initialized.id}-data` }
          const actionRow = { ...initialized, rowType: 'action', rowKey: `${initialized.taskDataId || initialized.id}-action` }
          
          // 数据初始化完成
          
          return [dataRow, actionRow]
        })
        statistics.value = response.data.statistics || {}
        total.value = response.data.page?.totalElements || 0
      }
    } else {
      // 使用简单查询接口（后备方案）
      response = await getSupplierMaterialParsingResults(taskId.value, {
        page: currentPage.value - 1,
        size: pageSize.value
      })

      if (response && response.content) {
        // 初始化简单查询接口的数据，转换为双行结构
        materialData.value = response.content.flatMap((item) => {
          const initialized = initializeRowData(item)
          const dataRow = { ...initialized, rowType: 'data', rowKey: `${initialized.taskDataId || initialized.id}-data` }
          const actionRow = { ...initialized, rowType: 'action', rowKey: `${initialized.taskDataId || initialized.id}-action` }
          return [dataRow, actionRow]
        })
        total.value = response.totalElements || 0
        statistics.value = null
      }
    }

    if (!response) {
      materialData.value = []
      total.value = 0
      statistics.value = null
    }
  } catch (error) {
    console.error('获取乙供物资解析结果失败:', error)
    // 如果复杂查询失败，尝试使用简单查询
    if (useComplexQuery.value) {
      console.log('复杂查询失败，回退到简单查询')
      useComplexQuery.value = false
      await fetchData()
      return
    }

    const errorMsg =
      error?.response?.data?.message || error?.message || '获取解析结果失败，请稍后重试'
    ElMessage.error(errorMsg)
    materialData.value = []
    total.value = 0
    statistics.value = null
  } finally {
    tableLoading.value = false
  }
}

/**
 * 处理页码变化
 */
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchData()
}

/**
 * 处理页大小变化
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchData()
}

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
}

// 格式化价格显示 - 显示含税价和不含税价（暂时未使用，保留备用）
/*
const formatPriceDisplay = (unitPrice, taxExcludedPrice, priceType) => {
  // 如果只有一个价格值，直接显示
  if ((taxExcludedPrice === undefined || taxExcludedPrice === null) && unitPrice !== undefined && unitPrice !== null) {
    return `¥${formatNumber(unitPrice)}`
  }

  // 如果有含税价和不含税价，都显示
  if (unitPrice !== undefined && unitPrice !== null && taxExcludedPrice !== undefined && taxExcludedPrice !== null) {
    // 获取原始价格类型文本
    const originalPriceTypeText = priceType === 1 ? '(原含税)' : priceType === 0 ? '(原不含税)' : ''
    
    return {
      taxIncluded: `¥${formatNumber(unitPrice)}`,
      taxExcluded: `¥${formatNumber(taxExcludedPrice)}`,
      originalType: originalPriceTypeText
    }
  }

  return '无价格'
}
*/

// 搜索处理（防抖）
let searchTimeout = null
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
}

// 搜索清空
const handleSearchClear = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchData()
}

// 筛选变化处理
const handleFilterChange = () => {
  currentPage.value = 1
  fetchData()
}

/**
 * 处理返回
 */
const handleGoBack = () => {
  goBack()
}

/**
 * 刷新数据
 */
const handleRefresh = () => {
  currentPage.value = 1
  fetchData()
}

/**
 * 处理导出
 */
const handleExport = async () => {
  exportLoading.value = true

  try {
    // 模拟加载时间，提供更好的用户体验
    await new Promise((resolve) => setTimeout(resolve, 500))

    ElMessage.info({
      message: '此功能正在开发中，请等待功能上线！',
      duration: 3000,
      showClose: true
    })

    console.log('【提示】导出功能正在开发中')
  } catch (error) {
    console.error('【错误】处理导出失败:', error)
    const errorMsg = error?.response?.data?.message || error?.message || '处理失败，请稍后再试'
    ElMessage.error(errorMsg)
  } finally {
    exportLoading.value = false
  }
}

/**
 * 批量确认全部
 */
const handleBatchConfirm = async () => {
  const pendingItems = materialData.value.filter((item) => item.confirmResult !== 1)

  if (pendingItems.length === 0) {
    ElMessage.info('没有需要确认的物资')
    return
  }

  // 检查是否有缺少推荐数据的物资
  const missingDataItems = pendingItems.filter((item) => {
    // 优先检查用户选择的数据
    let baseDataId = item.selectedBaseDataId || item.recommendedBaseDataId
    let priceId = item.selectedPriceId || item.recommendedPriceId

    // 如果没有直接的推荐数据，尝试从matchOptions获取
    if (!baseDataId && item.matchOptions && item.matchOptions.length > 0) {
      const firstMatch = item.matchOptions[0]
      baseDataId = firstMatch.matchedId

      if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
        priceId = firstMatch.priceOptions[0].priceId
      }
    }

    return !baseDataId || !priceId
  })

  if (missingDataItems.length > 0) {
    ElMessage.warning(`有 ${missingDataItems.length} 个物资缺少推荐数据，请先手动处理这些物资`)
    return
  }

  try {
    await ElMessageBox.confirm(`确认批量处理 ${pendingItems.length} 个待确认的物资？`, '批量确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    batchConfirming.value = true

    const confirmPromises = pendingItems.map((item) => {
      // 优先使用用户选择的数据
      let baseDataId = item.selectedBaseDataId || item.recommendedBaseDataId
      let priceId = item.selectedPriceId || item.recommendedPriceId

      // 如果没有直接的推荐数据，尝试从matchOptions获取
      if (!baseDataId && item.matchOptions && item.matchOptions.length > 0) {
        const firstMatch = item.matchOptions[0]
        baseDataId = firstMatch.matchedId

        if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
          priceId = firstMatch.priceOptions[0].priceId
        }
      }

      return confirmSupplierMaterialData({
        id: item.taskDataId || item.id,
        confirmBaseDataId: baseDataId,
        confirmPriceId: priceId
      })
    })

    const results = await Promise.allSettled(confirmPromises)

    let successCount = 0
    let failureCount = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.code === 200) {
        // 更新本地数据
        const item = pendingItems[index]
        item.confirmResult = 1
        item.confirmType = result.value.data?.confirmType || 1

        // 如果用户之前选择了数据，确认数据字段应该已经设置了
        if (!item.hasUserSelectedData) {
          // 如果是使用推荐数据确认的，需要设置确认数据字段以便正确显示
          if (item.matchOptions && item.matchOptions.length > 0) {
            const firstMatch = item.matchOptions[0]
            if (firstMatch.baseInfo) {
              item.confirmedBaseName = firstMatch.baseInfo.materialName
              item.confirmedBaseSpec = firstMatch.baseInfo.specifications
            }
            if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
              const firstPrice = firstMatch.priceOptions[0]
              item.confirmedPrice = firstPrice.taxPrice
              item.confirmedPriceQuarter = firstPrice.quarter
            }
          }
        }

        successCount++
      } else {
        failureCount++
        console.error('批量确认失败:', result.reason || result.value)
      }
    })

    if (failureCount > 0) {
      ElMessage.warning(`成功确认 ${successCount} 个，失败 ${failureCount} 个`)
    } else {
      ElMessage.success(`批量确认成功！共处理 ${successCount} 个物资`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量确认失败:', error)
      const errorMsg = error?.response?.data?.message || error?.message || '批量确认失败'
      ElMessage.error(errorMsg)
    }
  } finally {
    batchConfirming.value = false
  }
}

// // 获取确认状态类型
// const getConfirmStatusType = (status) => {
//   switch (Number(status)) {
//     case 1:
//       return 'success'
//     case 0:
//       return 'warning'
//     default:
//       return 'info'
//   }
// }

// // 获取确认状态文本
// const getConfirmStatusText = (status) => {
//   switch (Number(status)) {
//     case 1:
//       return '已确认'
//     case 0:
//       return '待确认'
//     default:
//       return '未知'
//   }
// }

// 获取对应的数据行和操作行
const getCorrespondingRows = (currentRow) => {
  if (!currentRow) return { dataRow: null, actionRow: null }
  
  const identifier = currentRow.taskDataId || currentRow.id
  if (!identifier) return { dataRow: null, actionRow: null }
  
  const dataRow = materialData.value.find(item => 
    item.rowType === 'data' && (item.taskDataId === identifier || item.id === identifier)
  )
  const actionRow = materialData.value.find(item => 
    item.rowType === 'action' && (item.taskDataId === identifier || item.id === identifier)
  )
  
  return { dataRow, actionRow }
}

// 检查单位是否有差异
const hasUnitDifference = (actionRow) => {
  const { dataRow } = getCorrespondingRows(actionRow)
  if (!dataRow || !actionRow) return false
  
  const dataUnit = (dataRow.unit || '').trim()
  const actionUnit = (actionRow.unit || '').trim()
  
  return dataUnit !== actionUnit && actionUnit !== '-' && dataUnit !== '-'
}

// 检查物资名称是否有差异
const hasMaterialNameDifference = (actionRow) => {
  const { dataRow } = getCorrespondingRows(actionRow)
  if (!dataRow || !actionRow) return false
  
  const dataName = getDisplayMaterialName(dataRow)
  const actionName = getDisplayMaterialName(actionRow)
  
  return dataName !== actionName && actionName !== '-' && dataName !== '-'
}

// 检查规格型号是否有差异
const hasSpecificationDifference = (actionRow) => {
  const { dataRow } = getCorrespondingRows(actionRow)
  if (!dataRow || !actionRow) return false
  
  const dataSpec = getDisplaySpecification(dataRow)
  const actionSpec = getDisplaySpecification(actionRow)
  
  return dataSpec !== actionSpec && actionSpec !== '-' && dataSpec !== '-'
}

// 获取显示用的物资名称
const getDisplayMaterialName = (row) => {
  if (row.rowType === 'data') {
    return getBaseInfoName(row)
  } else {
    // 操作行
    if (row.hasUserSelectedData && row.selectedMaterial) {
      return row.selectedMaterial.materialName || '-'
    } else if (row.matchedType === 2 && row.selectedMaterial) {
      return row.selectedMaterial.materialName || '-'
    }
    return row.materialName || '-'
  }
}

// 获取显示用的规格型号
const getDisplaySpecification = (row) => {
  if (row.rowType === 'data') {
    return getBaseInfoSpec(row)
  } else {
    // 操作行
    if (row.matchedType === 2 && row.selectedMaterial) {
      return row.selectedMaterial.baseInfo?.specifications || '-'
    }
    return row.specifications || '-'
  }
}

// 获取数据来源类型
const getDataSourceType = (row) => {
  // 如果已确认且有用户选择数据，就是用户选择
  if (row.confirmResult === 1) {
    if (row.hasUserSelectedData) {
      return { text: '用户选择', type: 'success' }
    } else {
      return { text: '系统推荐', type: 'success' }
    }
  }
  // 根据匹配类型返回数据来源
  const sourceMap = {
    0: { text: '原始数据', type: 'info' },
    1: { text: '精确匹配', type: 'success' },
    2: { text: '相似匹配', type: 'warning' },
    3: { text: '历史匹配', type: 'primary' },
    4: { text: '人工匹配', type: 'primary' }
  }
  return sourceMap[row.matchedType] || { text: '未知', type: 'info' }
}

// 获取匹配类型标签
const getMatchTypeTagInfo = (matchedType) => {
  const typeMap = {
    0: { text: '无匹配', type: 'info' },
    1: { text: '精确匹配', type: 'success' },
    2: { text: '相似匹配', type: 'warning' },
    3: { text: '历史匹配', type: 'primary' },
    4: { text: '人工匹配', type: '' }
  }
  return typeMap[matchedType] || { text: '未知', type: 'info' }
}

// 获取基础信息名称
const getBaseInfoName = (row) => {
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseName) {
    return row.confirmedBaseName
  }

  // 如果用户已选择但未确认，显示选择的数据
  if (row.hasUserSelectedData && row.confirmedBaseName) {
    return row.confirmedBaseName
  }

  // 优先从直接的baseInfo获取（匹配后的数据）
  if (row.baseInfo && row.baseInfo.materialName) {
    return row.baseInfo.materialName
  }

  // 从matchOptions中获取第一个匹配的基础数据
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
   
    return row.matchOptions[0].baseInfo.materialName
  }

  // 无匹配时，显示原始物资名称（这是关键修改）
  if (row.materialName) {
    return row.materialName
  }

  const fallback = row.recommendedBaseName || '-'
  return fallback
}

// 获取基础信息规格
const getBaseInfoSpec = (row) => {
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseSpec) {
    return row.confirmedBaseSpec
  }

  // 如果用户已选择但未确认，显示选择的数据
  if (row.hasUserSelectedData && row.confirmedBaseSpec) {
    return row.confirmedBaseSpec
  }

  // 优先从直接的baseInfo获取（匹配后的数据）
  if (row.baseInfo && row.baseInfo.specifications) {
    return row.baseInfo.specifications
  }

  // 从matchOptions中获取第一个匹配的基础数据
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
    return row.matchOptions[0].baseInfo.specifications || ''
  }

  // 无匹配时，显示原始规格型号（这是关键修改）
  if (row.specifications) {
    return row.specifications
  }

  return row.recommendedBaseSpec || '-'
}

// 获取价格文本 - 支持新的价格字段（暂时未使用，保留备用）
/*
const getPriceText = (row) => {
  // 最优先：如果用户已确认选择，显示确认的价格
  if (row.confirmResult === 1 && row.confirmedPrice !== undefined && row.confirmedPrice !== null) {
    return formatPriceDisplay(row.confirmedPrice, row.taxExcludedPrice, row.priceType)
  }

  // 如果用户已选择但未确认，显示选择的价格
  if (row.hasUserSelectedData && row.confirmedPrice !== undefined && row.confirmedPrice !== null) {
    console.log('【调试】getPriceText - 返回用户选择的价格:', row.confirmedPrice)
    return formatPriceDisplay(row.confirmedPrice, row.taxExcludedPrice, row.priceType)
  }

  // 使用新的价格字段：unitPrice(含税价) 和 taxExcludedPrice(不含税价)
  if (row.unitPrice !== undefined && row.unitPrice !== null) {
    return formatPriceDisplay(row.unitPrice, row.taxExcludedPrice, row.priceType)
  }

  // 优先从直接的priceInfo获取
  if (row.priceInfo && row.priceInfo.taxPrice) {
    return formatPriceDisplay(row.priceInfo.taxPrice, row.priceInfo.taxExcludedPrice, row.priceInfo.priceType)
  }

  // 从matchOptions中获取第一个匹配选项的最新价格信息
  if (row.matchOptions && row.matchOptions.length > 0) {
    const matchOption = row.matchOptions[0]
    if (matchOption.priceOptions && matchOption.priceOptions.length > 0) {
      // 取最新的价格（通常是第一个）
      const latestPrice = matchOption.priceOptions[0]
      return formatPriceDisplay(latestPrice.taxPrice, latestPrice.taxExcludedPrice, latestPrice.priceType)
    }
  }

  const fallback = row.recommendedPrice ? formatPriceDisplay(row.recommendedPrice) : '无价格'
  return fallback
}
*/

// // 获取价格季度
// const getPriceQuarter = (row) => {
//   // 最优先：如果用户已确认选择，显示确认的季度信息
//   if (row.confirmResult === 1 && row.confirmedPriceQuarter) {
//     return row.confirmedPriceQuarter
//   }

//   // 如果用户已选择但未确认，显示选择的季度信息
//   if (row.hasUserSelectedData && row.confirmedPriceQuarter) {
//     return row.confirmedPriceQuarter
//   }

//   // 优先从直接的priceInfo获取
//   if (row.priceInfo && row.priceInfo.quarter) {
//     return row.priceInfo.quarter
//   }

//   // 从matchOptions中获取第一个匹配选项的最新价格季度信息
//   if (row.matchOptions && row.matchOptions.length > 0) {
//     const matchOption = row.matchOptions[0]
//     if (matchOption.priceOptions && matchOption.priceOptions.length > 0) {
//       // 取最新的价格季度（通常是第一个）
//       const latestPrice = matchOption.priceOptions[0]
//       return latestPrice.quarter || ''
//     }
//   }

//   // 无匹配时，显示原始季度信息（如果有的话）
//   if (row.quarter) {
//     return row.quarter
//   }

//   return row.recommendedPriceQuarter || '-'
// }

// 获取操作行对应的价格数值（优化版本）
const getActionRowPrice = (dataRow, priceType) => {
  // 在 materialData 中查找对应的操作行
  const actionRowIndex = materialData.value.findIndex(item => 
    item.rowType === 'action' && 
    ((item.taskDataId && dataRow.taskDataId && item.taskDataId === dataRow.taskDataId) ||
     (item.id && dataRow.id && item.id === dataRow.id))
  )
  
  if (actionRowIndex === -1) return null
  
  const actionRow = materialData.value[actionRowIndex]
  
  // 检查是否有价格数据（用户手动选择、精确匹配或相似匹配）
  if (((actionRow.hasUserSelectedData && actionRow.matchedType !== 2) || actionRow.matchedType === 1 || actionRow.matchedType === 2) && actionRow.selectedPriceQuarter) {
    if (priceType === 'taxIncluded') {
      return parseFloat(actionRow.selectedPriceQuarter.taxPrice || actionRow.selectedPriceQuarter.unitPrice || 0) || null
    } else if (priceType === 'taxExcluded') {
      // 使用新的函数来获取不含税价格
      const taxExcludedPrice = getActionRowTaxExcludedPrice(actionRow)
      return taxExcludedPrice > 0 ? taxExcludedPrice : null
    }
  }
  
  // 如果没有价格数据，返回null（表示没有操作行价格进行比较）
  return null
}

// 获取数据行的价格数值
const getDataRowPrice = (dataRow, priceType) => {
  // 直接获取原始价格数值，不要通过 getPriceText
  if (priceType === 'taxIncluded') {
    // 按优先级获取含税价
    if (dataRow.unitPrice !== undefined && dataRow.unitPrice !== null && dataRow.unitPrice !== 0) {
      return parseFloat(dataRow.unitPrice)
    }
    if (dataRow.taxPrice !== undefined && dataRow.taxPrice !== null && dataRow.taxPrice !== 0) {
      return parseFloat(dataRow.taxPrice)
    }
    if (dataRow.originalPrice !== undefined && dataRow.originalPrice !== null && dataRow.originalPrice !== 0) {
      return parseFloat(dataRow.originalPrice)
    }
    if (dataRow.matchedPrice !== undefined && dataRow.matchedPrice !== null && dataRow.matchedPrice !== 0) {
      return parseFloat(dataRow.matchedPrice)
    }
    // 注意：数据行不应该使用 confirmedPrice，那是用户选择后的价格
    return null
  } else if (priceType === 'taxExcluded') {
    // 获取不含税价
    if (dataRow.taxExcludedPrice !== undefined && dataRow.taxExcludedPrice !== null && dataRow.taxExcludedPrice !== 0) {
      return parseFloat(dataRow.taxExcludedPrice)
    }
    if (dataRow.notaxPrice !== undefined && dataRow.notaxPrice !== null && dataRow.notaxPrice !== 0) {
      return parseFloat(dataRow.notaxPrice)
    }
    return null
  }
  
  return null
}

// 获取价格变化箭头组件 - 实时计算渲染
const getPriceChangeIcon = (row, priceType) => {
  if (row.rowType !== 'data') return null
  
  const dataPrice = getDataRowPrice(row, priceType)
  const actionPrice = getActionRowPrice(row, priceType)
  
  // 当操作行没有价格数据时，不显示箭头
  if (dataPrice === null || actionPrice === null) return null
  
  // 添加容差处理，避免浮点数精度问题
  const priceDiff = Math.abs(actionPrice - dataPrice)
  const tolerance = 0.01 // 价格差异小于0.01元认为相等
  
  // 如果价格差异小于容差，认为价格相同，不显示箭头
  if (priceDiff < tolerance) {
    console.log(`【价格对比】${row.materialName} 价格相同，不显示箭头`)
    return null
  }
  
  // 操作行价格大于数据行价格时，显示绿色向下箭头（表示操作行更贵）
  if (actionPrice > dataPrice) {
    return ArrowDown
  }
  // 操作行价格小于数据行价格时，显示红色向上箭头（表示操作行更便宜）
  else if (actionPrice < dataPrice) {
    return ArrowUp
  }
  
  return null
}

// 【调试函数】打印价格对比结果
const debugPriceComparison = (row, priceType) => {
  if (row.rowType !== 'data') return
  
  const dataPrice = getDataRowPrice(row, priceType)
  const actionPrice = getActionRowPrice(row, priceType)
  
  // 找到对应的操作行获取更多信息
  const actionRow = materialData.value.find(item => 
    item.rowType === 'action' && 
    ((item.taskDataId && row.taskDataId && item.taskDataId === row.taskDataId) ||
     (item.id && row.id && item.id === row.id))
  )
  
  // 添加价格相等判断
  const priceDiff = dataPrice !== null && actionPrice !== null ? Math.abs(actionPrice - dataPrice) : null
  const tolerance = 0.01
  const pricesEqual = priceDiff !== null && priceDiff < tolerance

  const debugInfo = {
    物资名称: row.materialName || '未知',
    匹配类型: row.matchedType === 0 ? '未匹配' : 
             row.matchedType === 1 ? '精确匹配' : 
             row.matchedType === 2 ? '相似匹配' : '其他',
    价格类型: priceType === 'taxIncluded' ? '含税价' : 
             priceType === 'taxExcluded' ? '不含税价' : '单价',
    数据行价格: dataPrice !== null ? `¥${dataPrice.toFixed(2)}` : '无数据',
    操作行价格: actionPrice !== null ? `¥${actionPrice.toFixed(2)}` : '无数据',
    价格差额: priceDiff !== null ? `¥${priceDiff.toFixed(2)}` : '无法计算',
    价格差异: dataPrice !== null && actionPrice !== null ? 
      `${((actionPrice - dataPrice) / dataPrice * 100).toFixed(2)}%` : '无法计算',
    对比结果: dataPrice !== null && actionPrice !== null ? 
      (pricesEqual ? '价格相同(灰黑色显示"-")' :
       actionPrice > dataPrice ? '操作行更高(原价绿色↓)' : 
       '操作行更低(原价红色↑)') : '无法对比',
    是否有用户选择: actionRow?.hasUserSelectedData ? '是' : '否',
    taskDataId: row.taskDataId || row.id || '未知'
  }
  
  console.log(`【价格对比调试】${debugInfo.物资名称} - ${debugInfo.价格类型}:`, debugInfo)
  
  return debugInfo
}

// 获取价格文本样式（为数据行价格添加颜色）- 实时计算渲染
const getPriceTextStyle = (row, priceType) => {
  if (row.rowType !== 'data') return {}
  
  // 调试：打印价格对比结果
  debugPriceComparison(row, priceType)
  
  // 未匹配状态：显示灰色
  if (row.matchedType === 0) {
    return { color: '#999999', fontWeight: 'normal', opacity: 0.8 }
  }
  
  const dataPrice = getDataRowPrice(row, priceType)
  const actionPrice = getActionRowPrice(row, priceType)
  
  // 当操作行没有价格数据时，不显示颜色
  if (dataPrice === null || actionPrice === null) return {}
  
  // 添加容差处理，避免浮点数精度问题
  const priceDiff = Math.abs(actionPrice - dataPrice)
  const tolerance = 0.01 // 价格差异小于0.01元认为相等
  
  // 如果价格差异小于容差，认为价格相同，显示灰黑色
  if (priceDiff < tolerance) {
    console.log(`【价格对比】${row.materialName} 价格相同，显示灰黑色`)
    return { color: '#666666', fontWeight: 'normal' }
  }
  
  // 操作行价格大于数据行价格时，数据行价格显示绿色（表示原价更便宜）
  if (actionPrice > dataPrice) {
    return { color: '#67C23A', fontWeight: '600' }
  }
  // 操作行价格小于数据行价格时，数据行价格显示红色（表示原价更贵）
  else if (actionPrice < dataPrice) {
    return { color: '#F56C6C', fontWeight: '600' }
  }
  
  return {}
}

// 获取价格变化箭头样式
const getPriceChangeIconStyle = (row, priceType) => {
  if (row.rowType !== 'data') return {}
  
  const dataPrice = getDataRowPrice(row, priceType)
  const actionPrice = getActionRowPrice(row, priceType)
  
  if (dataPrice === null || actionPrice === null) return {}
  
  // 添加容差处理，避免浮点数精度问题
  const priceDiff = Math.abs(actionPrice - dataPrice)
  const tolerance = 0.01 // 价格差异小于0.01元认为相等
  
  // 如果价格差异小于容差，认为价格相同，不显示箭头样式
  if (priceDiff < tolerance) {
    return {}
  }
  
  // 操作行价格大于数据行价格时，显示绿色向下箭头
  if (actionPrice > dataPrice) {
    return { color: '#67C23A', marginLeft: '4px', fontSize: '12px' }
  }
  // 操作行价格小于数据行价格时，显示红色向上箭头
  else if (actionPrice < dataPrice) {
    return { color: '#F56C6C', marginLeft: '4px', fontSize: '12px' }
  }
  
  return {}
}

// 查看更多选项 - 打开物资价格选择对话框
const handleViewOptions = async (row) => {
  console.log('【调试】handleViewOptions 被调用，设置 currentSelectionRow:', row)
  console.log('【调试】row.taskDataId:', row.taskDataId)
  console.log('【调试】row.materialName:', row.materialName)

  currentSelectionRow.value = row
  showMaterialPriceDialog.value = true
}

// 旧的物资选择数据加载方法已移除，统一使用 MaterialPriceSelectionDialog

// 旧的物资选择方法已移除，统一使用 MaterialPriceSelectionDialog

// 获取行样式类名
const getRowClassName = ({ row }) => {
  let className = ''
  if (row.confirmResult === 1) {
    className += 'confirmed-row'
  } else {
    className += 'pending-row'
  }
  
  // 为操作行添加特殊样式类名
  if (row.rowType === 'action') {
    className += ' action-row'
  }
  
  return className
}

// 表格合并方法
const tableSpanMethod = ({ row, columnIndex }) => {
  // 安全检查：确保 row 存在
  if (!row) {
    return { rowspan: 1, colspan: 1 }
  }
  
  // 将第一列（序号）在 data 行合并两行
  if (columnIndex === 0) {
    if (row.rowType === 'data') return { rowspan: 2, colspan: 1 }
    return { rowspan: 0, colspan: 0 }
  }
  // 默认不合并其它列，返回默认值而不是 null
  return { rowspan: 1, colspan: 1 }
}

// 【调试函数】打印所有物资的价格对比情况汇总
const debugAllPriceComparisons = () => {
  console.log('========== 【价格对比汇总调试】开始 ==========')
  
  const dataRows = materialData.value.filter(row => row.rowType === 'data')
  console.log(`共有 ${dataRows.length} 个物资需要分析`)
  
  const summary = {
    总计: dataRows.length,
    未匹配: 0,
    精确匹配: 0,
    相似匹配: 0,
    用户选择: 0,
    价格更高: 0,
    价格更低: 0,
    价格相同: 0,
    无法对比: 0
  }
  
  dataRows.forEach((dataRow, index) => {
    console.log(`\n[${index + 1}] 物资: ${dataRow.materialName}`)
    
    // 统计匹配类型
    if (dataRow.matchedType === 0) summary.未匹配++
    else if (dataRow.matchedType === 1) summary.精确匹配++
    else if (dataRow.matchedType === 2) summary.相似匹配++
    
    // 找对应操作行
    const actionRow = materialData.value.find(item => 
      item.rowType === 'action' && 
      ((item.taskDataId && dataRow.taskDataId && item.taskDataId === dataRow.taskDataId) ||
       (item.id && dataRow.id && item.id === dataRow.id))
    )
    
    if (actionRow?.hasUserSelectedData) summary.用户选择++
    
    // 价格对比（含税价）
    const dataPrice = getDataRowPrice(dataRow, 'taxIncluded')
    const actionPrice = getActionRowPrice(dataRow, 'taxIncluded')
    
    console.log(`  含税价 - 数据行: ${dataPrice ? '¥' + dataPrice.toFixed(2) : '无'}, 操作行: ${actionPrice ? '¥' + actionPrice.toFixed(2) : '无'}`)
    
    if (dataPrice !== null && actionPrice !== null) {
      const diff = ((actionPrice - dataPrice) / dataPrice * 100).toFixed(2)
      if (actionPrice > dataPrice) {
        console.log(`  → 操作行更高 ${diff}% (应显示绿色↓)`)
        summary.价格更高++
      } else if (actionPrice < dataPrice) {
        console.log(`  → 操作行更低 ${Math.abs(diff)}% (应显示红色↑)`)
        summary.价格更低++
      } else {
        console.log(`  → 价格相同`)
        summary.价格相同++
      }
    } else {
      console.log(`  → 无法对比`)
      summary.无法对比++
    }
  })
  
  console.log('\n========== 【汇总统计】 ==========')
  console.log(summary)
  console.log('========== 【价格对比汇总调试】结束 ==========\n')
  
  return summary
}

// 页面初始化时加载数据
onMounted(() => {
  if (taskId.value) {
    // 重置搜索和筛选条件
    searchKeyword.value = ''
    queryParams.value = {
      confirmResult: undefined,
      matchedType: undefined
    }
    currentPage.value = 1
    useComplexQuery.value = true
    fetchData().then(() => {
      // 数据加载完成后，延迟执行调试输出，确保渲染完成
      setTimeout(() => {
        console.log('【页面加载完成】开始执行价格对比调试...')
        debugAllPriceComparisons()
      }, 1000)
    })
  }
})

// 监听路由参数变化
watch(
  () => taskId.value,
  (newTaskId) => {
    if (newTaskId) {
      // 重置搜索和筛选条件
      searchKeyword.value = ''
      queryParams.value = {
        confirmResult: undefined,
        matchedType: undefined
      }
      currentPage.value = 1
      useComplexQuery.value = true
      fetchData()
    }
  },
  { immediate: false }
)

// // 新增的方法：打开物资价格选择弹窗
// const openMaterialSelectionDialog = (row) => {
//   currentSelectionRow.value = row
//   showMaterialPriceDialog.value = true
// }

// 处理物资价格选择结果 - 匹配之前的数据选择逻辑
const handleMaterialPriceSelection = async (selection) => {
  console.log('【调试】handleMaterialPriceSelection 开始，接收参数:', selection)
  console.log('【调试】currentSelectionRow.value:', currentSelectionRow.value)
  
  if (!selection || !selection.material || !selection.price || !currentSelectionRow.value) {
    console.log('【调试】参数缺失，退出')
    ElMessage.warning('选择数据不完整，请重新选择')
    return
  }

  try {
    // 精确匹配当前选择的物资（查找数据行和操作行）
    const items = materialData.value.filter((item) => {
      const matchByTaskDataId = item.taskDataId === currentSelectionRow.value.taskDataId
      const matchById = currentSelectionRow.value.id && item.id === currentSelectionRow.value.id
      return matchByTaskDataId || matchById
    })

    if (items.length === 0) {
      console.error('【错误】未找到匹配的物资项！')
      ElMessage.error('未找到对应的物资项，无法更新数据')
      return
    }

    // 获取物资基础信息和价格信息（兼容不同的数据结构）
    const materialBaseInfo = {
      materialName: selection.material.materialName,
      specificationModel: selection.material.specificationModel || selection.material.specifications,
      id: selection.material.baseInfoId || selection.material.id
    }
    
    const priceInfo = {
      taxPrice: selection.price.taxPrice || selection.price.unitPrice,
      unitPrice: selection.price.unitPrice || selection.price.taxPrice,
      taxExcludedPrice: selection.price.taxExcludedPrice,
      originalPrice: selection.price.originalPrice,
      priceType: selection.price.priceType,
      quarter: selection.price.quarter,
      id: selection.price.priceId || selection.price.id
    }

    console.log('【调试】解析出的物资基础信息:', materialBaseInfo)
    console.log('【调试】解析出的价格信息:', priceInfo)

    // 更新物资信息
    const confirmBaseName = materialBaseInfo.materialName
    const confirmBaseSpec = materialBaseInfo.specificationModel
    const confirmPrice = priceInfo.taxPrice || priceInfo.unitPrice
    const confirmPriceQuarter = priceInfo.quarter
    
    // 新增价格字段
    const confirmUnitPrice = priceInfo.unitPrice
    const confirmTaxExcludedPrice = priceInfo.taxExcludedPrice
    const confirmOriginalPrice = priceInfo.originalPrice
    const confirmPriceType = priceInfo.priceType

    // 更新所有匹配的数据行和操作行
    items.forEach((item) => {
      const itemIndex = materialData.value.findIndex(dataItem => dataItem === item)
      
      if (itemIndex !== -1) {
        // 直接更新数组中的对象属性，确保Vue能检测到变化
        materialData.value[itemIndex].confirmedBaseName = confirmBaseName
        materialData.value[itemIndex].confirmedBaseSpec = confirmBaseSpec
        materialData.value[itemIndex].confirmedPrice = confirmPrice
        materialData.value[itemIndex].confirmedPriceQuarter = confirmPriceQuarter
        
        // 更新新的价格字段
        materialData.value[itemIndex].unitPrice = confirmUnitPrice
        materialData.value[itemIndex].taxExcludedPrice = confirmTaxExcludedPrice
        materialData.value[itemIndex].originalPrice = confirmOriginalPrice
        materialData.value[itemIndex].priceType = confirmPriceType
        
        // 更新选择状态
        materialData.value[itemIndex].hasUserSelectedData = true
        materialData.value[itemIndex].selectedBaseDataId = materialBaseInfo.id
        materialData.value[itemIndex].selectedPriceId = priceInfo.id
        materialData.value[itemIndex].isUserModified = true
        
        // 更新选择的物资和价格数据（为了兼容其他组件的访问）
        materialData.value[itemIndex].selectedPriceQuarter = {
          taxPrice: confirmPrice,
          unitPrice: confirmUnitPrice,
          taxExcludedPrice: confirmTaxExcludedPrice,
          originalPrice: confirmOriginalPrice,
          priceType: confirmPriceType,
          quarter: confirmPriceQuarter,
          ...priceInfo
        }

        console.log('【调试】更新后的 item:', materialData.value[itemIndex])
      }
    })

    console.log('【调试】物资选择完成:', {
      confirmedBaseName: confirmBaseName,
      confirmedBaseSpec: confirmBaseSpec,
      confirmedPrice: confirmPrice,
      source: selection.source
    })
    
    // 【调试】打印选择后的价格对比情况
    console.log('【选择后价格对比调试】开始分析所有受影响的物资行...')
    items.forEach((item) => {
      if (item.rowType === 'data') {
        console.log(`【选择后对比】物资: ${item.materialName}`)
        console.log('  数据行原始价格:', {
          含税价: item.unitPrice || item.taxPrice || '无',
          不含税价: item.taxExcludedPrice || '无'
        })
        console.log('  操作行新选择价格:', {
          含税价: confirmPrice || '无',
          不含税价: confirmTaxExcludedPrice || '无'
        })
        
        // 计算价格差异
        const originalTaxIncluded = item.unitPrice || item.taxPrice || 0
        const newTaxIncluded = confirmPrice || 0
        if (originalTaxIncluded > 0 && newTaxIncluded > 0) {
          const diff = ((newTaxIncluded - originalTaxIncluded) / originalTaxIncluded * 100).toFixed(2)
          console.log(`  含税价差异: ${diff}%`, 
            newTaxIncluded > originalTaxIncluded ? '(操作行更高，应显示绿色↓)' : 
            newTaxIncluded < originalTaxIncluded ? '(操作行更低，应显示红色↑)' : 
            '(价格相同)')
        }
        
        const originalTaxExcluded = item.taxExcludedPrice || 0
        const newTaxExcluded = confirmTaxExcludedPrice || 0
        if (originalTaxExcluded > 0 && newTaxExcluded > 0) {
          const diff = ((newTaxExcluded - originalTaxExcluded) / originalTaxExcluded * 100).toFixed(2)
          console.log(`  不含税价差异: ${diff}%`,
            newTaxExcluded > originalTaxExcluded ? '(操作行更高，应显示绿色↓)' : 
            newTaxExcluded < originalTaxExcluded ? '(操作行更低，应显示红色↑)' : 
            '(价格相同)')
        }
      }
    })
    console.log('【选择后价格对比调试】分析完成')

    // 直接调用确认接口，不需要用户再手动确认
    await handleAutoConfirm(items[0]) // 使用第一个item作为代表进行确认
    
    currentSelectionRow.value = null
  } catch (error) {
    console.error('保存选择失败:', error)
    ElMessage.error('保存选择失败')
  }
}

// // 获取物资选择按钮文本
// const getMaterialButtonText = (row) => {
//   if (row.matchedType === 0) {
//     return '选择物资'
//   } else if (row.matchedType === 1) {
//     return '查看推荐'
//   } else if (row.matchedType === 2) {
//     return '选择推荐'
//   }
//   return '选择物资'
// }

// 格式化价格显示
const formatPrice = (price) => {
  // 处理数字类型
  if (typeof price === 'number') {
    return price.toFixed(2)
  }
  // 处理字符串类型 - 尝试转换为数字
  if (typeof price === 'string' && price !== '') {
    const numPrice = parseFloat(price)
    if (!isNaN(numPrice)) {
      return numPrice.toFixed(2)
    }
  }
  // 默认返回
  return '0.00'
}

// 获取含税价格（数据行始终显示原始数据）
const getTaxIncludedPrice = (row) => {
  // 未匹配状态也显示价格，不再返回"--"
  // if (row.matchedType === 0) {
  //   return '--'
  // }
  
  // 按优先级获取价格
  let price = null
  
  // 1. 优先使用 unitPrice（含税价）
  if (row.unitPrice !== undefined && row.unitPrice !== null && row.unitPrice !== 0) {
    price = row.unitPrice
  }
  // 2. 其次使用 taxPrice
  else if (row.taxPrice !== undefined && row.taxPrice !== null && row.taxPrice !== 0) {
    price = row.taxPrice
  }
  // 3. 再次使用 originalPrice
  else if (row.originalPrice !== undefined && row.originalPrice !== null && row.originalPrice !== 0) {
    price = row.originalPrice
  }
  // 4. 使用 matchedPrice
  else if (row.matchedPrice !== undefined && row.matchedPrice !== null && row.matchedPrice !== 0) {
    price = row.matchedPrice
  }
  // 5. 最后使用 confirmedPrice（这个可能是用户选择后的价格）
  else if (row.confirmedPrice !== undefined && row.confirmedPrice !== null && row.confirmedPrice !== 0) {
    price = row.confirmedPrice
  }
  
  // 检查是否与操作行价格相同 - 价格相同时显示"价格--"
  const dataPrice = parseFloat(price || 0)
  const actionPrice = getActionRowPrice(row, 'taxIncluded')
  
  if (dataPrice > 0 && actionPrice !== null) {
    const priceDiff = Math.abs(actionPrice - dataPrice)
    const tolerance = 0.01
    
    // 如果价格相同，显示"价格--"（股票样式）
    if (priceDiff < tolerance) {
      return formatPrice(price) + '--'
    }
  }
  
  return formatPrice(price || 0)
}

// 获取不含税价格（数据行始终显示原始数据）
const getTaxExcludedPrice = (row) => {
  // 调试已移除
  
  // 未匹配状态也显示价格，不再返回"--"
  // if (row.matchedType === 0) {
  //   console.log('【渲染调试】返回 "--" 因为未匹配')
  //   return '--'
  // }
  
  // 使用不含税价格字段
  const price = row.taxExcludedPrice || row.notaxPrice || 0
  
  // 检查是否与操作行价格相同 - 价格相同时显示"价格--"
  const dataPrice = parseFloat(price || 0)
  const actionPrice = getActionRowPrice(row, 'taxExcluded')
  
  if (dataPrice > 0 && actionPrice !== null) {
    const priceDiff = Math.abs(actionPrice - dataPrice)
    const tolerance = 0.01
    
    // 如果价格相同，显示"价格--"（股票样式）
    if (priceDiff < tolerance) {
      return formatPrice(price) + '--'
    }
  }
  
  return formatPrice(price)
}

// 获取操作行的不含税价格
const getActionRowTaxExcludedPrice = (row) => {
  if (!row.selectedPriceQuarter) {
    return 0
  }
  
  // 优先使用 selectedPriceQuarter 中的不含税价格字段
  if (row.selectedPriceQuarter.taxExcludedPrice !== undefined && 
      row.selectedPriceQuarter.taxExcludedPrice !== null &&
      row.selectedPriceQuarter.taxExcludedPrice !== 0) {
    return parseFloat(row.selectedPriceQuarter.taxExcludedPrice)
  }
  
  // 如果没有不含税价格，从含税价格计算（使用13%税率）
  const taxIncludedPrice = parseFloat(row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0)
  if (taxIncludedPrice > 0) {
    return taxIncludedPrice / 1.13
  }
  
  return 0
}

// 获取税率（数据行）
const getTaxRate = (row) => {
  // 如果有含税价和不含税价，计算税率
  const taxIncluded = row.confirmedPrice || row.unitPrice || row.taxPrice || 0
  const taxExcluded = row.taxExcludedPrice || 0
  
  if (taxIncluded > 0 && taxExcluded > 0) {
    // 税率 = (含税价 - 不含税价) / 不含税价 * 100%
    const rate = ((taxIncluded - taxExcluded) / taxExcluded * 100).toFixed(0)
    return `${rate}%`
  }
  
  // 如果有税率字段，直接使用
  if (row.taxRate !== undefined && row.taxRate !== null) {
    // 如果是小数形式（如0.13），转换为百分比
    if (row.taxRate < 1) {
      return `${(row.taxRate * 100).toFixed(0)}%`
    }
    // 如果已经是百分比形式（如13），直接显示
    return `${row.taxRate}%`
  }
  
  // 默认税率
  return '13%'
}

// 获取选中的税率（操作行）
const getSelectedTaxRate = (row) => {
  if (row.hasUserSelectedData && row.selectedPriceQuarter) {
    const taxIncluded = row.selectedPriceQuarter.taxPrice || row.selectedPriceQuarter.unitPrice || 0
    const taxExcluded = row.selectedPriceQuarter.taxExcludedPrice || 0
    
    if (taxIncluded > 0 && taxExcluded > 0) {
      const rate = ((taxIncluded - taxExcluded) / taxExcluded * 100).toFixed(0)
      return `${rate}%`
    }
    
    // 如果选中的价格数据有税率字段
    if (row.selectedPriceQuarter.taxRate !== undefined && row.selectedPriceQuarter.taxRate !== null) {
      if (row.selectedPriceQuarter.taxRate < 1) {
        return `${(row.selectedPriceQuarter.taxRate * 100).toFixed(0)}%`
      }
      return `${row.selectedPriceQuarter.taxRate}%`
    }
  }
  
  return '13%'
}


// 自动确认（弹窗选择完成后自动调用）
const handleAutoConfirm = async (row) => {
  try {
    // 使用用户选择的数据进行确认
    const confirmData = {
      id: row.taskDataId || row.id,
      confirmBaseDataId: row.selectedBaseDataId,
      confirmPriceId: row.selectedPriceId,
      confirmType: 2 // 人工确认
    }

    console.log('【自动确认】调用确认接口:', confirmData)
    const result = await confirmSupplierMaterialData(confirmData)

    if (result && result.code === 200) {
      // 更新所有相关行的确认状态
      const items = materialData.value.filter((item) => {
        const matchByTaskDataId = item.taskDataId === row.taskDataId
        const matchById = row.id && item.id === row.id
        return matchByTaskDataId || matchById
      })
      
      items.forEach((item) => {
        item.confirmResult = 1
        item.confirmType = result.data?.confirmType || 2
      })

      ElMessage.success('物资选择并确认成功')
      
      // 刷新数据以获取最新状态
      await fetchData()
    } else {
      ElMessage.error(result?.message || '确认失败')
    }
  } catch (error) {
    console.error('自动确认失败:', error)
    ElMessage.error('确认失败')
  }
}

// 新增：快速确认（已有推荐数据的情况）
const handleQuickConfirm = async (row) => {
  if (row.confirmResult === 1) {
    ElMessage.info('该物资已确认')
    return
  }

  // 检查是否有推荐数据或用户选择的数据
  let baseDataId = row.selectedBaseDataId || row.recommendedBaseDataId
  let priceId = row.selectedPriceId || row.recommendedPriceId

  // 如果没有数据，从matchOptions获取
  if (!baseDataId && row.matchOptions && row.matchOptions.length > 0) {
    const firstMatch = row.matchOptions[0]
    baseDataId = firstMatch.matchedId

    if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
      priceId = firstMatch.priceOptions[0].priceId
    }
  }

  if (!baseDataId || !priceId) {
    ElMessage.warning('该物资缺少推荐的基础数据或价格数据，请点击"更多选项"手动选择')
    return
  }

  try {
    const confirmData = {
      id: row.taskDataId || row.id,
      confirmBaseDataId: baseDataId,
      confirmPriceId: priceId
    }

    const result = await confirmSupplierMaterialData(confirmData)

    if (result && result.code === 200) {
      row.confirmResult = 1
      row.confirmType = result.data?.confirmType || 1
      row.isUserModified = true

      // 如果用户之前选择了数据，确保确认数据字段有值
      if (row.hasUserSelectedData) {
        // 用户选择的数据已经存在confirmedBaseName等字段中，无需重复设置
      } else {
        // 如果是使用推荐数据确认的，需要设置确认数据字段以便正确显示
        if (row.matchOptions && row.matchOptions.length > 0) {
          const firstMatch = row.matchOptions[0]
          if (firstMatch.baseInfo) {
            row.confirmedBaseName = firstMatch.baseInfo.materialName
            row.confirmedBaseSpec = firstMatch.baseInfo.specifications
          }
          if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
            const firstPrice = firstMatch.priceOptions[0]
            row.confirmedPrice = firstPrice.taxPrice
            row.confirmedPriceQuarter = firstPrice.quarter
          }
        }
      }

      ElMessage.success('确认成功')
    } else {
      const errorMsg = result?.message || result?.msg || '确认失败'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    console.error('快速确认失败:', error)
    const errorMsg =
      error?.response?.data?.message || error?.response?.data?.msg || error?.message || '确认失败'
    ElMessage.error(errorMsg)
  }
}

// 新增：初始化行数据
const initializeRowData = (row) => {
  // 创建响应式对象，包含原始数据和新增的选择状态
  const reactiveRow = reactive({
    ...row,
    // 为每行添加响应式的选择状态，使用 ID 方式避免对象引用问题
    selectedMaterial: null,
    selectedPriceQuarter: null,
    selectedMaterialId: null,
    selectedPriceId: null,
    isUserModified: false,
    selectedBaseDataId: null,
    // 标识用户是否已从数据库中选择了数据，用于控制确认按钮的显示
    hasUserSelectedData: false
  })

  // 如果有匹配选项，预选第一个
  if (reactiveRow.matchOptions && reactiveRow.matchOptions.length > 0) {
    const firstMatch = reactiveRow.matchOptions[0]
    // 设置对象引用（用于获取数据）
    reactiveRow.selectedMaterial = firstMatch
    reactiveRow.selectedMaterialId = firstMatch.matchedId

    if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
      const firstPrice = firstMatch.priceOptions[0]
      reactiveRow.selectedPriceQuarter = firstPrice
      reactiveRow.selectedPriceId = firstPrice.priceId
      reactiveRow.selectedBaseDataId = firstMatch.matchedId
      
      // 相似匹配时自动标记为已选择数据
      if (reactiveRow.matchedType === 2) {
        reactiveRow.hasUserSelectedData = true
      }
    }
  }

  // 检查是否有推荐数据，如果有则认为已有可用数据
  if (reactiveRow.recommendedBaseDataId && reactiveRow.recommendedPriceId) {
    reactiveRow.hasUserSelectedData = true
  }

  return reactiveRow
}

// 新增：保存解析结果
const handleSaveResults = async () => {
  const modifiedItems = materialData.value.filter((item) => item.isUserModified === true)

  if (modifiedItems.length === 0) {
    ElMessage.info('未检测到修改的数据，无需保存。')
    return
  }

  try {
    await ElMessageBox.confirm(
      `即将保存 ${modifiedItems.length} 个物资的解析结果，确认继续？`,
      '确认保存',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    saving.value = true

    // 准备保存数据
    const updateObjList = modifiedItems.map((item) => ({
      id: item.taskDataId || item.id,
      confirmBaseDataId: item.selectedBaseDataId || item.matchOptions?.[0]?.matchedId,
      confirmPriceId: item.selectedPriceId || item.matchOptions?.[0]?.priceOptions?.[0]?.priceId,
      confirmType: 2 // 人工确认
    }))

    // 这里应该调用保存的API接口
    // 暂时使用确认接口的批量版本
    const promises = updateObjList.map((data) => confirmSupplierMaterialData(data))
    const results = await Promise.allSettled(promises)

    let successCount = 0
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value?.code === 200) {
        successCount++
      }
    })

    if (successCount > 0) {
      ElMessage.success(`成功保存 ${successCount} 个物资的解析结果`)
      // 刷新数据
      fetchData()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('保存解析结果失败:', error)
      const errorMsg =
        error?.response?.data?.message || error?.response?.data?.msg || error?.message || '保存失败'
      ElMessage.error(errorMsg)
    }
  } finally {
    saving.value = false
  }
}

// 新增：返回按钮处理
const handleBack = () => {
  goBack()
}
</script>

<style scoped>
/* 页面容器 - 使用主题变量确保主题切换兼容 */
.supplier-material-detail-page {
  min-height: 100vh;
  background: var(--theme-bg-secondary);
  padding: 24px;
  color: var(--theme-text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* 为苹果毛玻璃主题添加渐变背景和动态效果 */
[data-theme='apple-glass'] .supplier-material-detail-page {
  background: linear-gradient(
    135deg,
    rgba(240, 248, 255, 0.8) 0%,
    rgba(252, 247, 251, 0.9) 25%,
    rgba(247, 250, 255, 0.7) 50%,
    rgba(250, 252, 255, 0.9) 75%,
    rgba(248, 250, 252, 0.8) 100%
  );
  background-attachment: fixed;
  position: relative;
}

/* 为苹果毛玻璃主题添加动态气泡效果 */
[data-theme='apple-glass'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 20% 20%, rgba(0, 122, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 40%, rgba(90, 200, 250, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(0, 122, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 90% 10%, rgba(90, 200, 250, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(0, 122, 255, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: float-bubbles 20s ease-in-out infinite;
}

/* 气泡漂浮动画 */
@keyframes float-bubbles {
  0%,
  100% {
    transform: translate(0px, 0px) scale(1);
    opacity: 1;
  }
  25% {
    transform: translate(-10px, -15px) scale(1.05);
    opacity: 0.8;
  }
  50% {
    transform: translate(15px, -10px) scale(0.95);
    opacity: 0.9;
  }
  75% {
    transform: translate(-5px, 10px) scale(1.02);
    opacity: 0.85;
  }
}

/* 为科技蓝主题添加深色渐变背景和科技感效果 */
[data-theme='tech-blue'] .supplier-material-detail-page {
  background: linear-gradient(135deg, #0a0e1a 0%, #1a2332 30%, #243447 60%, #1a2332 100%);
  background-attachment: fixed;
  position: relative;
}

/* 为科技蓝主题添加电路线条效果 */
[data-theme='tech-blue'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(
      90deg,
      transparent 50%,
      rgba(0, 212, 255, 0.03) 51%,
      rgba(0, 212, 255, 0.03) 52%,
      transparent 53%
    ),
    linear-gradient(
      0deg,
      transparent 50%,
      rgba(0, 212, 255, 0.03) 51%,
      rgba(0, 212, 255, 0.03) 52%,
      transparent 53%
    ),
    radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(51, 221, 255, 0.08) 0%, transparent 50%);
  background-size:
    40px 40px,
    40px 40px,
    200px 200px,
    300px 300px;
  pointer-events: none;
  z-index: -1;
  animation: tech-grid 15s linear infinite;
}

/* 科技网格动画 */
@keyframes tech-grid {
  0% {
    background-position:
      0px 0px,
      0px 0px,
      0px 0px,
      0px 0px;
  }
  100% {
    background-position:
      40px 40px,
      40px 40px,
      200px 200px,
      300px 300px;
  }
}

/* 为暗黑主题添加深色渐变背景和微妙纹理 */
[data-theme='dark'] .supplier-material-detail-page {
  background: linear-gradient(
    135deg,
    #1a1a1a 0%,
    #2d2d2d 25%,
    #3a3a3a 50%,
    #2d2d2d 75%,
    #1a1a1a 100%
  );
  background-attachment: fixed;
  position: relative;
}

/* 为暗黑主题添加微妙的纹理效果 */
[data-theme='dark'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 30% 20%, rgba(64, 158, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(64, 158, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 20% 80%, rgba(64, 158, 255, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: dark-glow 25s ease-in-out infinite;
}

/* 暗黑主题光晕效果 */
@keyframes dark-glow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* 为紫色梦幻主题添加渐变背景和梦幻效果 */
[data-theme='purple-dream'] .supplier-material-detail-page {
  background: linear-gradient(
    135deg,
    #faf5ff 0%,
    #f3e8ff 25%,
    #ede9fe 50%,
    #f3e8ff 75%,
    #faf5ff 100%
  );
  background-attachment: fixed;
  position: relative;
}

[data-theme='purple-dream'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 70%, rgba(196, 181, 253, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: purple-dream 20s ease-in-out infinite;
}

@keyframes purple-dream {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
    opacity: 0.8;
  }
  33% {
    transform: rotate(2deg) scale(1.05);
    opacity: 0.9;
  }
  66% {
    transform: rotate(-1deg) scale(0.98);
    opacity: 0.7;
  }
}

/* 为森林绿主题添加渐变背景和自然效果 */
[data-theme='forest-green'] .supplier-material-detail-page {
  background: linear-gradient(
    135deg,
    #f0fdf4 0%,
    #dcfce7 25%,
    #bbf7d0 50%,
    #dcfce7 75%,
    #f0fdf4 100%
  );
  background-attachment: fixed;
  position: relative;
}

[data-theme='forest-green'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(ellipse at 25% 20%, rgba(5, 150, 105, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 40%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 80%, rgba(52, 211, 153, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 70%, rgba(5, 150, 105, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: forest-breeze 18s ease-in-out infinite;
}

@keyframes forest-breeze {
  0%,
  100% {
    transform: translateX(0px) translateY(0px);
    opacity: 0.6;
  }
  25% {
    transform: translateX(10px) translateY(-5px);
    opacity: 0.8;
  }
  50% {
    transform: translateX(-5px) translateY(10px);
    opacity: 0.7;
  }
  75% {
    transform: translateX(8px) translateY(3px);
    opacity: 0.9;
  }
}

/* 为橙色活力主题添加渐变背景和活力效果 */
[data-theme='orange-energy'] .supplier-material-detail-page {
  background: linear-gradient(
    135deg,
    #fffbeb 0%,
    #fef3c7 25%,
    #fed7aa 50%,
    #fef3c7 75%,
    #fffbeb 100%
  );
  background-attachment: fixed;
  position: relative;
}

[data-theme='orange-energy'] .supplier-material-detail-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at 30% 25%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(249, 115, 22, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(251, 146, 60, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 85% 75%, rgba(234, 88, 12, 0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: energy-pulse 15s ease-in-out infinite;
}

@keyframes energy-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  20% {
    transform: scale(1.02);
    opacity: 0.9;
  }
  40% {
    transform: scale(0.98);
    opacity: 0.8;
  }
  60% {
    transform: scale(1.01);
    opacity: 0.95;
  }
  80% {
    transform: scale(0.99);
    opacity: 0.75;
  }
}

/* 页面头部 - 优化主题适配和毛玻璃效果支持 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  color: var(--theme-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

.back-btn:hover {
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.1);
  border-color: rgba(var(--theme-primary-rgb), 0.3);
  transform: translateY(-1px);
  box-shadow: var(--theme-shadow-sm);
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
}

.title-section p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 搜索工具栏样式 - 增强主题适配 */
.search-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-section {
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  background: var(--theme-input-bg);
  border-color: var(--theme-input-border);
  color: var(--theme-text-primary);
  box-shadow: var(--theme-shadow-sm);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary-light);
  box-shadow: var(--theme-shadow-md);
  transform: translateY(-1px);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--theme-input-focus-border);
  box-shadow:
    0 0 0 3px rgba(var(--theme-primary-rgb), 0.15),
    var(--theme-shadow-md);
  transform: translateY(-1px);
}

.search-input :deep(.el-input__inner) {
  color: var(--theme-text-primary);
}

.search-input :deep(.el-input__inner::placeholder) {
  color: var(--theme-input-placeholder);
}

.filter-section {
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 140px;
}

.filter-select :deep(.el-select__wrapper) {
  background: var(--theme-input-bg);
  border-color: var(--theme-input-border);
  border-radius: 8px;
  color: var(--theme-text-primary);
  box-shadow: var(--theme-shadow-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

.filter-select :deep(.el-select__wrapper:hover) {
  border-color: var(--theme-primary-light);
  box-shadow: var(--theme-shadow-md);
  transform: translateY(-1px);
}

.filter-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--theme-input-focus-border);
  box-shadow:
    0 0 0 3px rgba(var(--theme-primary-rgb), 0.15),
    var(--theme-shadow-md);
}

.filter-select :deep(.el-input__inner) {
  color: var(--theme-text-primary);
}

.filter-select :deep(.el-select__placeholder) {
  color: var(--theme-input-placeholder);
}

/* 统计面板样式 */
.statistics-panel {
  margin-bottom: 20px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px 12px 0 0;
}

.stat-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary-light);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-primary);
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
}

.stat-label {
  font-size: 13px;
  color: var(--theme-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.table-section {
  background: var(--theme-card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

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
  gap: 12px;
}

.total-info {
  color: var(--theme-text-primary);
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 表格内容样式 - 优化主题适配 */
.recommend-info .material-name {
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--theme-text-primary);
  line-height: 1.4;
  transition: color 0.3s ease;
}

.recommend-info .material-spec {
  font-size: 12px;
  margin: 0;
  color: var(--theme-text-secondary);
  line-height: 1.4;
  opacity: 0.8;
  transition:
    color 0.3s ease,
    opacity 0.3s ease;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.price-info .price-text {
  font-weight: 600;
  color: var(--theme-price-color);
  font-size: 15px;
  background: linear-gradient(135deg, var(--theme-price-color), var(--theme-number-color));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
}

.price-info .price-quarter {
  font-size: 11px;
  color: var(--theme-text-secondary);
  background: rgba(var(--theme-primary-rgb), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease;
}

/* 表格样式 - 全面支持主题切换 */
:deep(.el-table) {
  background: var(--theme-card-bg) !important;
  color: var(--theme-text-primary) !important;
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
  border: 1px solid var(--theme-table-border) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease;
}

:deep(.el-table::before) {
  height: 0;
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-bottom: 2px solid var(--theme-table-border) !important;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 12px;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid var(--theme-table-border) !important;
  color: var(--theme-text-primary) !important;
  padding: 14px 12px;
  transition:
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transform: scale(1.001);
}

:deep(.el-table__fixed-right) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

:deep(.el-table__fixed-left) {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

/* 行状态样式 - 使用主题变量 */
:deep(.confirmed-row) {
  background-color: rgba(var(--theme-success-rgb), 0.1) !important;

  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.confirmed-row:hover > td.el-table__cell) {
  background-color: rgba(var(--theme-success-rgb), 0.15) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.pending-row) {
  background-color: transparent;
}

:deep(.pending-row:hover > td.el-table__cell) {
  background-color: rgba(var(--theme-warning-rgb), 0.1) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

/* 操作行样式 */
:deep(.action-row) {
  background-color: var(--el-background-color-2) !important;
}

:deep(.action-row td.el-table__cell) {
  background-color: var(--el-background-color-2) !important;
  font-size: 13px;
  padding: 8px 12px;
}

:deep(.action-row:hover > td.el-table__cell) {
  background-color: var(--el-background-color-3) !important;
}

/* 数据行和操作行内容样式 */
.data-cell {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-cell {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.action-cell .el-select {
  width: 100% !important;
}

.action-cell .el-button {
  font-size: 12px;
}

/* 操作列专用样式 - 响应式设计 */
.operation-data-cell {
  padding: 8px 4px;
}

.operation-action-cell {
  padding: 8px 4px;
}

.operation-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
  min-height: 32px;
}

/* 操作按钮样式 */
.operation-group .el-button {
  font-size: 12px;
  height: 28px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.operation-group .el-button .el-icon {
  margin-right: 4px;
  font-size: 14px;
}

/* 主要操作按钮 */
.primary-action {
  min-width: 68px;
  flex: 1;
  max-width: 80px;
}

/* 次要操作按钮 */
.secondary-action {
  min-width: 56px;
  flex: 1;
  max-width: 70px;
}

/* 单一操作按钮 */
.single-action {
  min-width: 88px;
  max-width: 120px;
}

/* 状态按钮 */
.status-button {
  min-width: 80px;
  cursor: not-allowed;
}

.action-button {
  min-width: 68px;
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
}

.status-tag .el-icon {
  font-size: 14px;
}

/* 按钮文字在小屏幕上的响应式处理 */
@media (max-width: 1200px) {
  .button-text {
    font-size: 11px;
  }
  
  .operation-group .el-button {
    height: 26px;
    font-size: 11px;
    padding: 0 8px;
  }
  
  .primary-action,
  .secondary-action {
    min-width: 52px;
    max-width: 68px;
  }
  
  .single-action {
    min-width: 76px;
    max-width: 100px;
  }
}

@media (max-width: 768px) {
  .operation-group {
    gap: 4px;
  }
  
  .operation-group .el-button {
    height: 24px;
    font-size: 10px;
    padding: 0 6px;
  }
  
  .operation-group .el-button .el-icon {
    margin-right: 2px;
    font-size: 12px;
  }
  
  .primary-action,
  .secondary-action {
    min-width: 48px;
    max-width: 60px;
  }
  
  .single-action {
    min-width: 68px;
    max-width: 88px;
  }
  
  .status-tag {
    font-size: 10px;
    height: 20px;
    padding: 0 6px;
  }
  
  .status-tag .el-icon {
    font-size: 12px;
  }
}

/* 操作组的特定样式 */
.confirmed-state {
  justify-content: center;
}

.similar-match,
.no-match-selected {
  justify-content: center;
}

.no-match-unselected {
  justify-content: center;
}

.exact-match {
  justify-content: center;
  gap: 8px;
}

.other-match {
  justify-content: center;
}

/* 悬停效果 */
.operation-group .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.operation-group .el-button:active {
  transform: translateY(0);
}

/* 价格显示样式 */
.price-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-line {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.price-label {
  color: var(--theme-text-secondary);
  font-size: 12px;
  min-width: 60px;
}

.price-text {
  font-weight: 500;
  color: var(--theme-price-color);
}

.original-type-text {
  font-size: 11px;
  color: var(--theme-text-tertiary);
  margin-left: 4px;
}

.price-details-small {
  font-size: 12px;
  line-height: 1.3;
}

.price-details-small div {
  margin-bottom: 1px;
}

/* 标签样式 - 优化主题适配 */
:deep(.el-tag) {
  border-radius: 6px;
  padding: 4px 10px;
  font-weight: 500;
  font-size: 12px;
  border: 1px solid transparent;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-tag--success) {
  background: rgba(var(--theme-success-rgb), 0.1);
  color: var(--theme-success);
  border: 1px solid rgba(var(--theme-success-rgb), 0.3);
}

:deep(.el-tag--warning) {
  background: rgba(var(--theme-warning-rgb), 0.1);
  color: var(--theme-warning);
  border: 1px solid rgba(var(--theme-warning-rgb), 0.3);
}

:deep(.el-tag--info) {
  background: rgba(var(--theme-info-rgb), 0.1);
  color: var(--theme-info);
  border: 1px solid rgba(var(--theme-info-rgb), 0.3);
}

:deep(.el-tag--primary) {
  background: rgba(var(--theme-primary-rgb), 0.1);
  color: var(--theme-primary);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
}

:deep(.el-tag--danger) {
  background: rgba(var(--theme-error-rgb), 0.1);
  color: var(--theme-error);
  border: 1px solid rgba(var(--theme-error-rgb), 0.3);
}

/* 按钮样式优化 - 增强主题适配 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--theme-shadow-sm);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: 1px solid var(--theme-primary);
  color: white;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(var(--theme-primary-rgb), 0.4);
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, var(--theme-success), rgba(var(--theme-success-rgb), 0.8));
  border: 1px solid var(--theme-success);
  color: white;
}

:deep(.el-button--success:hover) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(var(--theme-success-rgb), 0.4);
  background: linear-gradient(135deg, rgba(var(--theme-success-rgb), 0.9), var(--theme-success));
}

:deep(.el-button--default) {
  background: var(--theme-card-bg);
  border: 1px solid var(--theme-card-border);
  color: var(--theme-text-primary);
}

:deep(.el-button--default:hover) {
  color: var(--theme-primary);
  border-color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.1);
  transform: translateY(-1px) scale(1.02);
  box-shadow: var(--theme-shadow-md);
}

:deep(.el-button--text) {
  color: var(--theme-primary);
  background: transparent;
}

:deep(.el-button--text:hover) {
  background: rgba(var(--theme-primary-rgb), 0.1);
  transform: scale(1.05);
  border-radius: 6px;
}

/* 分页样式 - 优化主题适配 */
:deep(.el-pagination) {
  margin-top: 24px;
  justify-content: center;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .el-pager li) {
  background: var(--theme-card-bg);
  border: 1px solid var(--theme-card-border);
  color: var(--theme-text-primary);
  font-weight: 500;
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-pagination.is-background .el-pager li:hover) {
  color: var(--theme-primary);
  border-color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.1);
  transform: translateY(-1px) scale(1.05);
  box-shadow: var(--theme-shadow-sm);
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: 1px solid var(--theme-primary);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

/* 加载动画 - 增强主题适配 */
:deep(.el-loading-mask) {
  background-color: rgba(var(--theme-primary-rgb), 0.1);
  backdrop-filter: var(--theme-backdrop-blur, blur(10px));
  transition: all 0.3s ease;
}

:deep(.el-loading-spinner .path) {
  stroke: var(--theme-primary);
}

:deep(.el-loading-spinner .el-loading-text) {
  color: var(--theme-text-primary);
  font-weight: 500;
}

/* 响应式设计 */
/* 响应式设计优化 */
@media (max-width: 1024px) {
  .statistics-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .filter-section {
    flex-wrap: wrap;
    gap: 8px;
  }

  .search-toolbar {
    padding: 16px;
  }

  .page-header {
    padding: 16px 20px;
  }
}

/* 移动设备性能优化 - 禁用复杂动画 */
@media (max-width: 768px) {
  /* 在小屏幕上禁用背景动画以提高性能 */
  [data-theme] .supplier-material-detail-page::before {
    animation: none !important;
    opacity: 0.3 !important;
  }

  /* 简化悬停效果 */
  .stat-card:hover {
    transform: translateY(-2px) !important;
  }

  :deep(.el-button:hover) {
    transform: none !important;
  }
}

@media (max-width: 768px) {
  .supplier-material-detail-page {
    padding: 12px;
    background-attachment: scroll;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    justify-content: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .header-right .el-button {
    width: 100%;
    padding: 10px 16px;
  }

  .search-toolbar {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
  }

  .search-section {
    max-width: none;
  }

  .filter-section {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .filter-select {
    width: 100%;
  }

  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 12px;
    border-radius: 8px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 11px;
  }

  .table-section {
    padding: 16px;
    border-radius: 8px;
  }

  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 10px 12px;
  }

  .toolbar-right {
    width: 100%;
  }

  .toolbar-right .el-button {
    width: 100%;
    padding: 8px 12px;
  }

  :deep(.el-table) {
    font-size: 12px;
    border-radius: 6px;
  }

  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    padding: 8px 6px;
    font-size: 11px;
  }

  :deep(.el-pagination) {
    margin-top: 16px;
  }
}

@media (max-width: 480px) {
  .supplier-material-detail-page {
    padding: 8px;
    background-attachment: scroll;
  }

  /* 在极小屏幕上使用纯色背景以提高性能 */
  [data-theme] .supplier-material-detail-page {
    background: var(--theme-bg-secondary) !important;
    background-attachment: scroll !important;
  }

  [data-theme] .supplier-material-detail-page::before {
    display: none !important;
  }

  .title-section h1 {
    font-size: 18px;
    line-height: 1.2;
    background: none !important;
    color: var(--theme-text-primary) !important;
    -webkit-text-fill-color: unset !important;
  }

  .title-section p {
    font-size: 12px;
    margin-top: 6px;
  }

  .statistics-cards {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-card {
    padding: 10px;
  }

  .stat-value {
    font-size: 20px;
    margin-bottom: 6px;
    background: none !important;
    color: var(--theme-primary) !important;
    -webkit-text-fill-color: unset !important;
  }

  .stat-label {
    font-size: 10px;
  }

  .page-header {
    padding: 12px;
    margin-bottom: 12px;
  }

  .search-toolbar {
    padding: 12px;
  }

  .table-section {
    padding: 12px;
  }

  :deep(.el-table th.el-table__cell),
  :deep(.el-table td.el-table__cell) {
    padding: 6px 4px;
    font-size: 10px;
  }

  .price-info .price-text {
    font-size: 12px;
    background: none !important;
    color: var(--theme-price-color) !important;
    -webkit-text-fill-color: unset !important;
  }

  .price-info .price-quarter {
    font-size: 9px;
    padding: 1px 4px;
  }

  .total-info {
    background: none !important;
    color: var(--theme-text-primary) !important;
    -webkit-text-fill-color: unset !important;
  }

  /* 禁用所有动画和过渡效果 */
  * {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}

/* 可访问性和焦点样式 - 优化主题适配 */
:deep(.el-button:focus-visible) {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--theme-primary-rgb), 0.2);
}

:deep(.el-input__inner:focus-visible) {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--theme-primary-rgb), 0.2);
}

:deep(.el-select__wrapper:focus-visible) {
  outline: 2px solid var(--theme-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--theme-primary-rgb), 0.2);
}

/* 表格斑马纹优化 - 使用主题变量 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

/* 表格固定列阴影优化 - 增强主题适配 */
:deep(.el-table__fixed-right) {
  box-shadow: -2px 0 12px rgba(var(--theme-primary-rgb), 0.08);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.el-table__fixed-left) {
  box-shadow: 2px 0 12px rgba(var(--theme-primary-rgb), 0.08);
  backdrop-filter: var(--theme-backdrop-blur, none);
}

/* 滚动条样式 - 优化主题适配 */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: rgba(var(--theme-primary-rgb), 0.05);
  border-radius: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: rgba(var(--theme-primary-rgb), 0.3);
  border-radius: 6px;
  transition: background 0.3s ease;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background: rgba(var(--theme-primary-rgb), 0.5);
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(var(--theme-primary-rgb), 0.05);
  border-radius: 6px;
}

::-webkit-scrollbar-thumb {
  background: rgba(var(--theme-primary-rgb), 0.3);
  border-radius: 6px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--theme-primary-rgb), 0.5);
  transform: scale(1.1);
}

/* 页面过渡动画 - 增强动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 统计卡片鼠标悬停增强效果 */
.stat-card:hover .stat-label {
  opacity: 1;
  color: var(--theme-primary);
}

.stat-card:hover .stat-value {
  transform: scale(1.05);
}

/* 页面底部操作按钮区域 */
.page-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--el-border-color-light);
}

.page-footer .el-button {
  min-width: 100px;
  height: 36px;
  font-weight: 500;
}

/* 新增样式：物资选择相关 */
.selected-material-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-material-info .material-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text-primary);
  word-break: break-all;
}

.material-selection-button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.status-hint {
  font-size: 11px;
  color: var(--theme-text-tertiary);
}

/* 数据差异标记样式 */
.difference-marker {
  color: #F56C6C;
  font-size: 12px;
  margin-left: 4px;
  flex-shrink: 0;
}

.selected-price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selected-price-info .price-display {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-success);
}

.selected-price-info .price-quarter {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

.price-selection-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 40px;
}

/* 新增样式：价格列相关 */
.price-value {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.price-text {
  font-weight: 600;
  color: var(--theme-success);
}

.quarter-text {
  font-weight: 500;
  color: var(--theme-text-primary);
}

/* 精确匹配显示样式 */
.exact-match-price,
.exact-match-tax-rate,
.exact-match-quarter {
  color: var(--theme-success) !important;
  font-weight: 500;
  position: relative;
}

.exact-match-price .price-text,
.exact-match-tax-rate .tax-rate-text,
.exact-match-quarter .quarter-text {
  color: var(--theme-success) !important;
  font-weight: 600;
}

.exact-match-price::after,
.exact-match-tax-rate::after,
.exact-match-quarter::after {
  content: ' (精确)';
  font-size: 10px;
  opacity: 0.8;
  margin-left: 4px;
  color: var(--theme-success);
  font-style: normal;
}

/* 相似匹配显示样式 */
.similar-match-price,
.similar-match-tax-rate,
.similar-match-quarter {
  color: var(--theme-warning) !important;
  font-style: italic;
  position: relative;
}

.similar-match-price .price-text,
.similar-match-tax-rate .tax-rate-text,
.similar-match-quarter .quarter-text {
  color: var(--theme-warning) !important;
  font-weight: 500;
}

.similar-match-price::after,
.similar-match-tax-rate::after,
.similar-match-quarter::after {
  content: ' (相似)';
  font-size: 10px;
  opacity: 0.7;
  margin-left: 4px;
  color: var(--theme-warning);
  font-style: normal;
}

/* 空数据显示样式（类似股票） */
.empty-price-display,
.empty-data-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 24px;
}

.empty-price-text,
.empty-data-text {
  color: #999999 !important;
  font-size: 14px;
  font-weight: normal;
  opacity: 0.8;
  user-select: none;
  font-family: 'Courier New', monospace;
}

.empty-price-text {
  font-weight: 500;
}
</style>
