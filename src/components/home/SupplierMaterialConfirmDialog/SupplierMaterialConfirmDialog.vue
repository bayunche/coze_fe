<template>
  <el-dialog
    v-model="dialogVisible"
    title="乙供物资解析结果确认"
    width="90%"
    :before-close="handleClose"
    custom-class="supplier-material-confirm-dialog"
    append-to-body
    top="2vh"
  >
    <div v-loading="loading" class="confirm-content">
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

      <!-- 统计信息面板 -->
      <div class="statistics-panel" v-if="statistics">
        <div class="statistics-cards">
          <div class="stat-card">
            <div class="stat-value">{{ statistics.totalCount || 0 }}</div>
            <div class="stat-label">总记录数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ statistics.confirmedCount || 0 }}</div>
            <div class="stat-label">已确认</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ statistics.unconfirmedCount || 0 }}</div>
            <div class="stat-label">待确认</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ statistics.exactMatchCount || 0 }}</div>
            <div class="stat-label">精确匹配</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ statistics.noMatchCount || 0 }}</div>
            <div class="stat-label">无匹配</div>
          </div>
        </div>
      </div>

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
        style="width: 100%"
        :row-class-name="getRowClassName"
        border
        stripe
        max-height="60vh"
      >
        <el-table-column type="index" label="序号" width="60" />

        <el-table-column prop="materialName" label="物资名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.materialName || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="specifications"
          label="规格型号"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.specifications || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="unit" label="单位" width="80">
          <template #default="{ row }">
            <span>{{ row.unit || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="quantity" label="数量" width="100">
          <template #default="{ row }">
            <span>{{ formatNumber(row.quantity) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="匹配基础数据" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="recommend-info">
              <p class="material-name">{{ getBaseInfoName(row) }}</p>
              <p class="material-spec">{{ getBaseInfoSpec(row) }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="价格信息" min-width="120" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="price-info-wrapper">
              <div class="price-text">{{ getPriceText(row) }}</div>
              <div class="price-quarter">{{ getPriceQuarter(row) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="匹配类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMatchTypeTag(row.matchedType).type" size="small">
              {{ getMatchTypeTag(row.matchedType).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="确认状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getConfirmStatusType(row.confirmResult)" size="small">
              {{ getConfirmStatusText(row.confirmResult) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center">
          <template #default="{ row }">
            <!-- 根据匹配类型显示不同的操作 -->
            <div v-if="row.matchedType === 0 && row.confirmResult !== 1">
              <!-- 无匹配时显示选择按钮 -->
              <el-button type="warning" size="small" @click="handleSelectFromDatabase(row)">
                从数据库中选择数据
              </el-button>
            </div>
            <div v-else-if="row.matchedType === 1 && row.confirmResult !== 1">
              <!-- 精确匹配时显示下拉框选择 -->
              <div class="select-container">
                <el-select
                  v-model="row.selectedMaterial"
                  placeholder="选择物资"
                  value-key="matchedId"
                  @change="handleMaterialSelectChange(row, $event)"
                  size="small"
                  style="width: 100%; margin-bottom: 4px"
                >
                  <el-option
                    v-for="item in row.materialOptions || []"
                    :key="item.matchedId"
                    :label="`${item.name || '-'} ${item.specification || '-'}`"
                    :value="item"
                  />
                </el-select>
                <el-select
                  v-model="row.selectedPriceQuarter"
                  placeholder="选择价格和季度"
                  value-key="id"
                  @change="handlePriceQuarterChange(row, $event)"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in row.priceQuarterOptions || []"
                    :key="item.id"
                    :label="`¥${
                      item.taxPrice !== null && item.taxPrice !== undefined ? item.taxPrice : '-'
                    } (${item.quarter || '-'})`"
                    :value="item"
                  />
                </el-select>
              </div>
            </div>
            <div v-else-if="[2, 3].includes(row.matchedType) && row.confirmResult !== 1">
              <!-- 相似匹配和历史匹配时显示下拉框选择 -->
              <div class="select-container">
                <el-select
                  v-model="row.selectedMaterial"
                  placeholder="选择物资"
                  value-key="matchedId"
                  @change="handleMaterialSelectChange(row, $event)"
                  size="small"
                  style="width: 100%; margin-bottom: 4px"
                >
                  <el-option
                    v-for="item in row.materialOptions || []"
                    :key="item.matchedId"
                    :label="`${item.name || '-'} ${item.specification || '-'}`"
                    :value="item"
                  />
                </el-select>
                <el-select
                  v-model="row.selectedPriceQuarter"
                  placeholder="选择价格和季度"
                  value-key="id"
                  @change="handlePriceQuarterChange(row, $event)"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in row.priceQuarterOptions || []"
                    :key="item.id"
                    :label="`¥${
                      item.taxPrice !== null && item.taxPrice !== undefined ? item.taxPrice : '-'
                    } (${item.quarter || '-'})`"
                    :value="item"
                  />
                </el-select>
              </div>
            </div>
            <div v-else>
              <!-- 其他情况或已确认状态显示确认按钮 -->
              <el-button
                type="primary"
                size="small"
                :disabled="row.confirmResult === 1"
                @click="handleConfirm(row)"
              >
                {{ row.confirmResult === 1 ? '已确认' : '确认' }}
              </el-button>
            </div>
            <!-- 更多选项按钮 -->
            <el-button
              type="text"
              size="small"
              @click="handleViewOptions(row)"
              style="margin-top: 4px"
            >
              更多选项
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        @current-change="fetchData"
        @size-change="handleSizeChange"
        style="margin-top: 20px; text-align: right"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleRefresh" :loading="loading"> 刷新数据 </el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 确认选项对话框 -->
  <ConfirmOptionsDialog
    v-model="showOptionsDialog"
    :material-data="currentMaterial"
    @confirm="handleOptionConfirm"
    @close="showOptionsDialog = false"
  />

  <!-- 物资选择对话框 -->
  <MaterialSelectionDialog
    v-model="showMaterialSelectionDialog"
    :data-list="materialSelectionData"
    :total="materialSelectionTotal"
    :page-num="materialSearchParams.page"
    :page-size="materialSearchParams.size"
    :loading="materialSelectionLoading"
    @select="handleMaterialSelection"
    @page-change="handleMaterialPageChange"
    @size-change="handleMaterialSizeChange"
    @search="handleMaterialSearch"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import ConfirmOptionsDialog from './ConfirmOptionsDialog.vue'
import MaterialSelectionDialog from '../MaterialSelectionDialog/MaterialSelectionDialog.vue'
import {
  getSupplierMaterialParsingResults,
  querySupplierMaterialsComplex,
  confirmSupplierMaterialData,
  queryMaterialBaseInfoWithPrices
} from '@/utils/backendWorkflow.js'

// Props定义
const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  taskId: {
    type: [String, Number],
    required: true
  }
})

// Emits定义
const emit = defineEmits(['update:show'])

// 响应式数据
const loading = ref(false)
const batchConfirming = ref(false)
const materialData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showOptionsDialog = ref(false)
const currentMaterial = ref(null)

// 物资选择相关
const showMaterialSelectionDialog = ref(false)
const currentSelectingMaterial = ref(null)
const materialSelectionData = ref([])
const materialSearchParams = ref({
  page: 1,
  size: 20,
  keyword: ''
})
const materialSelectionTotal = ref(0)
const materialSelectionLoading = ref(false)

// 搜索和筛选参数
const searchKeyword = ref('')
const queryParams = ref({
  confirmResult: undefined,
  matchedType: undefined
})
const statistics = ref(null)
const useComplexQuery = ref(true) // 是否使用复杂查询接口

// 计算属性 - 主对话框可见性
const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 计算确认统计
const confirmedCount = computed(() => {
  return materialData.value.filter((item) => item.confirmResult === 1).length
})

const pendingCount = computed(() => {
  return materialData.value.filter((item) => item.confirmResult !== 1).length
})

// 处理物资项目，为下拉框选择初始化必要字段
const processItemForSelection = (item) => {
  const processedItem = { ...item }

  // 初始化下拉框相关字段
  processedItem.selectedMaterial = null
  processedItem.selectedPriceQuarter = null
  processedItem.materialOptions = []
  processedItem.priceQuarterOptions = []
  processedItem.isUserConfirmed = false

  // 根据匹配类型处理数据
  if (processedItem.matchOptions && processedItem.matchOptions.length > 0) {
    // 处理匹配选项为物资选择选项
    processedItem.materialOptions = processedItem.matchOptions.map((option) => ({
      matchedId: option.matchedId || option.id,
      name: option.baseInfo?.materialName || option.materialName || '-',
      specification: option.baseInfo?.specifications || option.specifications || '-',
      unit: option.baseInfo?.unit || option.unit || '-'
    }))

    // 如果已经有推荐的匹配，设置为选中状态
    if (processedItem.recommendedBaseDataId) {
      const currentMatch = processedItem.materialOptions.find(
        (opt) => opt.matchedId === processedItem.recommendedBaseDataId
      )
      if (currentMatch) {
        processedItem.selectedMaterial = currentMatch

        // 如果有推荐价格ID，初始化价格选项
        if (processedItem.recommendedPriceId && processedItem.recommendedPrice) {
          processedItem.selectedPriceQuarter = {
            id: processedItem.recommendedPriceId,
            taxPrice: processedItem.recommendedPrice,
            quarter: processedItem.recommendedPriceQuarter || '-'
          }
          processedItem.priceQuarterOptions = [processedItem.selectedPriceQuarter]
        }
      }
    } else if (processedItem.materialOptions.length > 0) {
      // 没有推荐匹配时，默认选择第一个
      processedItem.selectedMaterial = processedItem.materialOptions[0]
    }
  }

  return processedItem
}

// 获取解析结果数据
const fetchData = async () => {
  if (!props.taskId) return

  loading.value = true
  try {
    let response

    if (useComplexQuery.value) {
      // 使用复杂查询接口
      const params = {
        taskId: props.taskId,
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

      response = await querySupplierMaterialsComplex(params)

      if (response && response.data) {
        materialData.value = (response.data.content || []).map((item) =>
          processItemForSelection(item)
        )
        statistics.value = response.data.statistics || {}
        total.value = response.data.page?.totalElements || 0
      }
    } else {
      // 使用简单查询接口（后备方案）
      response = await getSupplierMaterialParsingResults(props.taskId, {
        page: currentPage.value - 1,
        size: pageSize.value
      })

      if (response && response.content) {
        materialData.value = response.content.map((item) => processItemForSelection(item))
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
      useComplexQuery.value = false
      await fetchData()
      return
    }

    const errorMsg =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.message ||
      '获取解析结果失败，请稍后重试'
    ElMessage.error(errorMsg)
    materialData.value = []
    total.value = 0
    statistics.value = null
  } finally {
    loading.value = false
  }
}

// 格式化数字
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value).toLocaleString()
}

// 获取确认状态类型
const getConfirmStatusType = (status) => {
  switch (Number(status)) {
    case 1:
      return 'success'
    case 0:
      return 'warning'
    default:
      return 'info'
  }
}

// 获取确认状态文本
const getConfirmStatusText = (status) => {
  switch (Number(status)) {
    case 1:
      return '已确认'
    case 0:
      return '待确认'
    default:
      return '未知'
  }
}

// 获取行样式类名
const getRowClassName = ({ row }) => {
  if (row.confirmResult === 1) {
    return 'confirmed-row'
  }
  return 'pending-row'
}

// 处理物资选择变化
const handleMaterialSelectChange = async (row, selectedMaterial) => {
  console.log('=== 物资选择变化开始 ===')
  console.log('行数据ID:', row.id || row.taskDataId)
  console.log('选择的物资:', selectedMaterial)

  // 更新选择状态
  row.selectedMaterial = selectedMaterial
  row.selectedPriceQuarter = null
  row.priceQuarterOptions = []

  // 立即更新表格显示用的推荐字段，确保Vue响应性更新
  if (selectedMaterial) {
    // 使用Vue的响应性更新，确保表格立即显示
    Object.assign(row, {
      recommendedBaseName: selectedMaterial.name,
      recommendedBaseSpec: selectedMaterial.specification,
      recommendedBaseDataId: selectedMaterial.matchedId
    })
    console.log('立即更新表格显示字段:', {
      物资名称: row.recommendedBaseName,
      规格型号: row.recommendedBaseSpec,
      物资ID: row.recommendedBaseDataId
    })
  }

  if (selectedMaterial && selectedMaterial.matchedId) {
    try {
      console.log('开始获取价格选项，物资ID:', selectedMaterial.matchedId)
      // 获取价格选项
      const response = await queryMaterialBaseInfoWithPrices({
        baseInfoId: selectedMaterial.matchedId
      })

      if (response && response.content && response.content.length > 0) {
        const materialInfo = response.content[0]
        if (materialInfo.priceList && materialInfo.priceList.length > 0) {
          row.priceQuarterOptions = materialInfo.priceList.map((price) => ({
            id: price.id,
            taxPrice: price.taxPrice,
            quarter: price.quarter,
            baseInfoId: price.baseInfoId
          }))

          console.log('获取到价格选项:', row.priceQuarterOptions)

          // 如果只有一个价格选项，自动选择
          if (row.priceQuarterOptions.length === 1) {
            console.log('只有一个价格，自动选择')
            row.selectedPriceQuarter = row.priceQuarterOptions[0]
            handlePriceQuarterChange(row, row.priceQuarterOptions[0])
          }
        }
      }
    } catch (error) {
      console.error('获取价格信息失败:', error)
      ElMessage.error('获取价格信息失败')
    }
  }

  // 标记用户已手动选择
  row.isUserConfirmed = true

  console.log('选择后的表格显示:', {
    推荐物资名: getBaseInfoName(row),
    推荐规格: getBaseInfoSpec(row),
    推荐价格: getPriceText(row)
  })
  console.log('=== 物资选择变化完成 ===')
}

// 处理价格季度选择变化
const handlePriceQuarterChange = (row, selectedPriceQuarter) => {
  console.log('=== 价格季度选择变化开始 ===')
  console.log('行数据ID:', row.id || row.taskDataId)
  console.log('选择的价格:', selectedPriceQuarter)

  row.selectedPriceQuarter = selectedPriceQuarter

  // 立即更新表格显示用的价格字段，确保Vue响应性更新
  if (selectedPriceQuarter) {
    // 使用Vue的响应性更新，确保表格立即显示
    Object.assign(row, {
      recommendedPrice: selectedPriceQuarter.taxPrice,
      recommendedPriceQuarter: selectedPriceQuarter.quarter,
      recommendedPriceId: selectedPriceQuarter.id
    })

    console.log('立即更新价格显示字段:', {
      价格: row.recommendedPrice,
      季度: row.recommendedPriceQuarter,
      价格ID: row.recommendedPriceId
    })
  }

  // 确保物资信息也是最新的
  if (row.selectedMaterial) {
    Object.assign(row, {
      recommendedBaseName: row.selectedMaterial.name,
      recommendedBaseSpec: row.selectedMaterial.specification,
      recommendedBaseDataId: row.selectedMaterial.matchedId
    })
  }

  // 标记用户已手动选择
  row.isUserConfirmed = true

  console.log('选择后的价格显示:', getPriceText(row))
  console.log('最终的推荐数据ID:', {
    物资ID: row.recommendedBaseDataId,
    价格ID: row.recommendedPriceId
  })
  console.log('=== 价格季度选择变化完成 ===')
}

// 确认单个物资
const handleConfirm = async (row) => {
  if (row.confirmResult === 1) {
    ElMessage.info('该物资已确认')
    return
  }

  // 检查是否有推荐数据或匹配选项
  let baseDataId = row.recommendedBaseDataId
  let priceId = row.recommendedPriceId

  // 如果没有直接的推荐数据，尝试从matchOptions获取
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
    await ElMessageBox.confirm(`确认物资"${row.materialName}"的匹配结果？`, '确认操作', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const confirmData = {
      id: row.taskDataId || row.id, // 使用taskDataId作为主要标识符
      confirmBaseDataId: baseDataId,
      confirmPriceId: priceId
    }

    const result = await confirmSupplierMaterialData(confirmData)

    if (result && result.code === 200) {
      // 更新本地数据
      row.confirmResult = 1
      row.confirmType = result.data?.confirmType || 1
      ElMessage.success('确认成功')
    } else {
      ElMessage.error(result?.message || '确认失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '确认失败')
    }
  }
}

// 批量确认全部
const handleBatchConfirm = async () => {
  const pendingItems = materialData.value.filter((item) => item.confirmResult !== 1)

  if (pendingItems.length === 0) {
    ElMessage.info('没有需要确认的物资')
    return
  }

  // 检查是否有无匹配的物资
  const noMatchItems = pendingItems.filter((item) => item.matchedType === 0)
  if (noMatchItems.length > 0) {
    ElMessage.error(
      `发现 ${noMatchItems.length} 个无匹配物资，请先处理这些物资后再进行批量确认。请使用"从数据库中选择数据"按钮为无匹配物资选择匹配项。`
    )
    return
  }

  // 过滤掉精确匹配的物资（matchedType === 1），只处理相似匹配、历史匹配、人工匹配等
  const exactMatchItems = pendingItems.filter((item) => item.matchedType === 1)
  const confirmableItems = pendingItems.filter((item) => item.matchedType !== 1)

  if (confirmableItems.length === 0) {
    if (exactMatchItems.length > 0) {
      ElMessage.info(`所有待确认的物资都是精确匹配状态，无需批量确认`)
    } else {
      ElMessage.info('没有可以批量确认的物资')
    }
    return
  }

  // 检查可确认物资是否有缺少推荐数据的物资
  const missingDataItems = confirmableItems.filter((item) => {
    let baseDataId = item.recommendedBaseDataId
    let priceId = item.recommendedPriceId

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
    let confirmMessage = `确认批量处理 ${confirmableItems.length} 个待确认的物资？`
    if (exactMatchItems.length > 0) {
      confirmMessage += `\n（将跳过 ${exactMatchItems.length} 个精确匹配物资）`
    }

    await ElMessageBox.confirm(confirmMessage, '批量确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    batchConfirming.value = true

    const confirmPromises = confirmableItems.map((item) => {
      let baseDataId = item.recommendedBaseDataId
      let priceId = item.recommendedPriceId

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
        const item = confirmableItems[index]
        item.confirmResult = 1
        item.confirmType = result.value.data?.confirmType || 1
        successCount++
      } else {
        failureCount++
        console.error('批量确认失败:', result.reason || result.value)
      }
    })

    let resultMessage = ''
    if (failureCount > 0) {
      resultMessage = `成功确认 ${successCount} 个，失败 ${failureCount} 个`
    } else {
      resultMessage = `批量确认成功！共处理 ${successCount} 个物资`
    }

    if (exactMatchItems.length > 0) {
      resultMessage += `，跳过了 ${exactMatchItems.length} 个精确匹配物资`
    }

    if (failureCount > 0) {
      ElMessage.warning(resultMessage)
    } else {
      ElMessage.success(resultMessage)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量确认失败:', error)
      ElMessage.error('批量确认失败')
    }
  } finally {
    batchConfirming.value = false
  }
}

// 查看更多选项
const handleViewOptions = (row) => {
  currentMaterial.value = row
  showOptionsDialog.value = true
}

// 处理选项确认结果
const handleOptionConfirm = async (confirmData) => {
  try {
    const result = await confirmSupplierMaterialData({
      id: confirmData.materialId,
      confirmBaseDataId: confirmData.confirmBaseDataId,
      confirmPriceId: confirmData.confirmPriceId
    })

    if (result && result.code === 200) {
      // 更新本地数据
      const item = materialData.value.find((item) => item.id === confirmData.materialId)
      if (item) {
        item.confirmResult = 1
        item.confirmType = result.data?.confirmType || 3
        item.confirmedBaseName = confirmData.selectedBaseName
        item.confirmedBaseSpec = confirmData.selectedBaseSpec
        item.confirmedPrice = confirmData.selectedPrice
        item.confirmedPriceQuarter = confirmData.selectedPriceQuarter
      }
      ElMessage.success('确认成功')
      showOptionsDialog.value = false
    } else {
      ElMessage.error(result?.message || '确认失败')
    }
  } catch (error) {
    console.error('选项确认失败:', error)
    ElMessage.error(error.message || '确认失败')
  }
}

// 处理"从数据库中选择数据"按钮点击
const handleSelectFromDatabase = (row) => {
  currentSelectingMaterial.value = row
  materialSearchParams.value = {
    page: 1,
    size: 20,
    keyword: '' // 不自动带出搜索内容
  }
  showMaterialSelectionDialog.value = true
  fetchMaterialOptions()
}

// 获取物资选择数据
const fetchMaterialOptions = async () => {
  materialSelectionLoading.value = true
  try {
    // 调用获取带价格信息的物资基础数据API
    const params = {
      page: materialSearchParams.value.page - 1,
      size: materialSearchParams.value.size,
      keyword: materialSearchParams.value.keyword
    }

    const response = await queryMaterialBaseInfoWithPrices(params)
    console.log('【SupplierMaterialConfirmDialog 调试】获取物资选择数据:', response)

    if (response && response.data && response.data.content) {
      // 直接进行价格维度的扁平化，与MaterialSelectionDialog的formattedData逻辑一致
      const flattenedData = []

      response.data.content.forEach((item) => {
        const materialBaseInfo = item.materialBaseInfo || {}
        const priceList = item.priceList || []

        // 如果有价格数据，每个价格创建一条记录
        if (priceList.length > 0) {
          priceList.forEach((price) => {
            flattenedData.push({
              // 原始数据，包含物资和价格信息
              originalData: {
                materialBaseInfo,
                priceInfo: price,
                fullItem: item
              },

              // 物资信息
              materialName: materialBaseInfo.materialName || '-',
              specificationModel: materialBaseInfo.specificationModel || '-',
              unit: materialBaseInfo.unit || '-',
              type: materialBaseInfo.type || '-',
              materialCode: materialBaseInfo.materialCode || '-',

              // 价格信息 - 确保价格正确显示，包括0价格
              taxPrice:
                price.taxPrice !== undefined && price.taxPrice !== null
                  ? parseFloat(price.taxPrice).toFixed(2)
                  : '0.00',
              quarter: price.quarter || '-',
              priceId: price.id,
              baseInfoId: price.baseInfoId,

              // 兼容旧格式的字段映射
              material_name: materialBaseInfo.materialName,
              specification_model: materialBaseInfo.specificationModel,
              tax_price: price.taxPrice,
              id: materialBaseInfo.id
            })
          })
        } else {
          // 如果没有价格数据，仍然创建一条记录但价格字段为空
          flattenedData.push({
            originalData: {
              materialBaseInfo,
              priceInfo: null,
              fullItem: item
            },

            materialName: materialBaseInfo.materialName || '-',
            specificationModel: materialBaseInfo.specificationModel || '-',
            unit: materialBaseInfo.unit || '-',
            type: materialBaseInfo.type || '-',
            materialCode: materialBaseInfo.materialCode || '-',

            taxPrice: '-',
            quarter: '-',
            priceId: null,
            baseInfoId: materialBaseInfo.id,

            material_name: materialBaseInfo.materialName,
            specification_model: materialBaseInfo.specificationModel,
            tax_price: null,
            id: materialBaseInfo.id
          })
        }
      })

      materialSelectionData.value = flattenedData
      materialSelectionTotal.value = response.data.totalElements || 0
    } else {
      materialSelectionData.value = []
      materialSelectionTotal.value = 0
    }
  } catch (error) {
    console.error('获取物资选择数据失败:', error)
    ElMessage.error('获取物资数据失败')
    materialSelectionData.value = []
    materialSelectionTotal.value = 0
  } finally {
    materialSelectionLoading.value = false
  }
}

// 处理物资选择结果
const handleMaterialSelection = async (selectedMaterial) => {
  console.log('【SupplierMaterialConfirmDialog 调试】接收到的物资选择数据:', selectedMaterial)
  console.log('【SupplierMaterialConfirmDialog 调试】数据类型:', typeof selectedMaterial)
  console.log(
    '【SupplierMaterialConfirmDialog 调试】数据keys:',
    Object.keys(selectedMaterial || {})
  )

  if (!currentSelectingMaterial.value || !selectedMaterial) {
    console.log('【SupplierMaterialConfirmDialog 调试】缺少必要参数，退出处理')
    return
  }

  try {
    // 检查数据结构，可能需要适配不同的数据格式
    let actualSelectedMaterial = selectedMaterial

    // 如果接收到的是包装后的数据，提取实际的选择材料
    if (selectedMaterial.selectedMaterial) {
      actualSelectedMaterial = selectedMaterial.selectedMaterial
      console.log(
        '【SupplierMaterialConfirmDialog 调试】提取包装数据中的 selectedMaterial:',
        actualSelectedMaterial
      )
    }

    // 现在 actualSelectedMaterial 已经是价格维度的数据
    // 获取物资基础信息和价格信息
    const materialBaseInfo = actualSelectedMaterial.originalData?.materialBaseInfo || {
      materialName: actualSelectedMaterial.materialName,
      specificationModel: actualSelectedMaterial.specificationModel,
      id: actualSelectedMaterial.baseInfoId
    }
    const priceInfo = actualSelectedMaterial.originalData?.priceInfo || {
      taxPrice: actualSelectedMaterial.taxPrice,
      quarter: actualSelectedMaterial.quarter,
      id: actualSelectedMaterial.priceId
    }

    console.log('【SupplierMaterialConfirmDialog 调试】解析出的物资基础信息:', materialBaseInfo)
    console.log('【SupplierMaterialConfirmDialog 调试】解析出的价格信息:', priceInfo)

    if (!materialBaseInfo.id) {
      ElMessage.error('选择的物资数据无效')
      return
    }

    if (!priceInfo.id) {
      ElMessage.warning('选择的物资没有价格信息，请选择其他物资')
      return
    }

    const confirmData = {
      id: currentSelectingMaterial.value.taskDataId || currentSelectingMaterial.value.id,
      confirmBaseDataId: materialBaseInfo.id,
      confirmPriceId: priceInfo.id
    }

    console.log('【SupplierMaterialConfirmDialog 调试】发送确认数据到API:', confirmData)
    const result = await confirmSupplierMaterialData(confirmData)
    console.log('【SupplierMaterialConfirmDialog 调试】API返回结果:', result)

    if (result && result.code === 200) {
      // 更新本地数据
      const item = currentSelectingMaterial.value
      console.log('【SupplierMaterialConfirmDialog 调试】更新前的本地数据项:', item)

      item.confirmResult = 1
      item.confirmType = 4 // 人工匹配
      item.matchedType = 4 // 更新匹配类型为人工匹配
      item.confirmedBaseName = materialBaseInfo.materialName
      item.confirmedBaseSpec = materialBaseInfo.specificationModel
      item.confirmedPrice = priceInfo.taxPrice
      item.confirmedPriceQuarter = priceInfo.quarter

      console.log('【SupplierMaterialConfirmDialog 调试】更新后的本地数据项:', item)
      console.log('【SupplierMaterialConfirmDialog 调试】确认的物资名称:', item.confirmedBaseName)
      console.log('【SupplierMaterialConfirmDialog 调试】确认的规格:', item.confirmedBaseSpec)
      console.log('【SupplierMaterialConfirmDialog 调试】确认的价格:', item.confirmedPrice)
      console.log('【SupplierMaterialConfirmDialog 调试】确认的季度:', item.confirmedPriceQuarter)

      ElMessage.success('选择并确认成功')
      showMaterialSelectionDialog.value = false
    } else {
      console.log('【SupplierMaterialConfirmDialog 调试】API确认失败:', result)
      ElMessage.error(result?.message || '确认失败')
    }
  } catch (error) {
    console.error('物资选择确认失败:', error)
    ElMessage.error(error.message || '确认失败')
  }
}

// 物资选择弹框的分页处理
const handleMaterialPageChange = (page) => {
  materialSearchParams.value.page = page
  fetchMaterialOptions()
}

const handleMaterialSizeChange = (size) => {
  materialSearchParams.value.size = size
  materialSearchParams.value.page = 1
  fetchMaterialOptions()
}

// 物资选择弹框的搜索处理
const handleMaterialSearch = (keyword) => {
  materialSearchParams.value.keyword = keyword || ''
  materialSearchParams.value.page = 1
  fetchMaterialOptions()
}

// 刷新数据
const handleRefresh = () => {
  currentPage.value = 1
  fetchData()
}

// 分页大小变化
const handleSizeChange = () => {
  currentPage.value = 1
  fetchData()
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

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

// 获取基础信息名称
const getBaseInfoName = (row) => {
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseName) {
    console.log('【SupplierMaterialConfirmDialog 调试】显示确认的物资名称:', row.confirmedBaseName)
    return row.confirmedBaseName
  }

  // 优先从直接的baseInfo获取
  if (row.baseInfo && row.baseInfo.materialName) {
    return row.baseInfo.materialName
  }

  // 从matchOptions中获取第一个匹配的基础数据
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
    return row.matchOptions[0].baseInfo.materialName
  }

  return row.recommendedBaseName || '无匹配'
}

// 获取基础信息规格
const getBaseInfoSpec = (row) => {
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseSpec) {
    return row.confirmedBaseSpec
  }

  // 优先从直接的baseInfo获取
  if (row.baseInfo && row.baseInfo.specifications) {
    return row.baseInfo.specifications
  }

  // 从matchOptions中获取第一个匹配的基础数据
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
    return row.matchOptions[0].baseInfo.specifications || ''
  }

  return row.recommendedBaseSpec || ''
}

// 获取价格文本
const getPriceText = (row) => {
  // 最优先：如果用户已确认选择，显示确认的价格
  if (row.confirmResult === 1 && row.confirmedPrice !== undefined && row.confirmedPrice !== null) {
    return `¥${formatNumber(row.confirmedPrice)}`
  }

  // 优先从直接的priceInfo获取
  if (row.priceInfo && row.priceInfo.taxPrice) {
    return `¥${formatNumber(row.priceInfo.taxPrice)}`
  }

  // 从matchOptions中获取第一个匹配选项的最新价格信息
  if (row.matchOptions && row.matchOptions.length > 0) {
    const matchOption = row.matchOptions[0]
    if (matchOption.priceOptions && matchOption.priceOptions.length > 0) {
      // 取最新的价格（通常是第一个）
      const latestPrice = matchOption.priceOptions[0]
      return `¥${formatNumber(latestPrice.taxPrice)}`
    }
  }

  return row.recommendedPrice ? `¥${formatNumber(row.recommendedPrice)}` : '无价格'
}

// 获取价格季度
const getPriceQuarter = (row) => {
  // 最优先：如果用户已确认选择，显示确认的季度信息
  if (row.confirmResult === 1 && row.confirmedPriceQuarter) {
    return row.confirmedPriceQuarter
  }

  // 优先从直接的priceInfo获取
  if (row.priceInfo && row.priceInfo.quarter) {
    return row.priceInfo.quarter
  }

  // 从matchOptions中获取第一个匹配选项的最新价格季度信息
  if (row.matchOptions && row.matchOptions.length > 0) {
    const matchOption = row.matchOptions[0]
    if (matchOption.priceOptions && matchOption.priceOptions.length > 0) {
      // 取最新的价格季度（通常是第一个）
      const latestPrice = matchOption.priceOptions[0]
      return latestPrice.quarter || ''
    }
  }

  return row.recommendedPriceQuarter || ''
}

// 获取匹配类型标签
const getMatchTypeTag = (matchedType) => {
  const typeMap = {
    0: { text: '无匹配', type: 'info' },
    1: { text: '精确匹配', type: 'success' },
    2: { text: '相似匹配', type: 'warning' },
    3: { text: '历史匹配', type: 'primary' },
    4: { text: '人工匹配', type: '' }
  }
  return typeMap[matchedType] || { text: '未知', type: 'info' }
}

// 监听弹窗显示状态
watch(
  () => props.show,
  (newShow) => {
    if (newShow && props.taskId) {
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
  { immediate: true }
)
</script>

<style scoped>
/* 对话框主题样式 */
:deep(.supplier-material-confirm-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
}

:deep(.supplier-material-confirm-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
}

:deep(.supplier-material-confirm-dialog .el-dialog__body) {
  padding: 20px;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

/* 布局样式 */
.confirm-content {
  width: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.total-info {
  color: var(--theme-text-secondary);
  font-size: 14px;
}

/* 表格基础主题样式 */
:deep(.el-table) {
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border);
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border) !important;
  color: var(--theme-text-primary) !important;
}

/* 行状态样式 */
:deep(.confirmed-row) {
  background-color: var(--theme-success-light) !important;
}

:deep(.pending-row) {
  background-color: var(--theme-bg-primary);
}

/* 内容显示样式 */
.recommend-info .material-name {
  font-weight: 500;
  margin: 0 0 4px 0;
  color: var(--theme-text-primary);
}

.recommend-info .material-spec {
  font-size: 12px;
  margin: 0;
  color: var(--theme-text-secondary);
}

.price-info-wrapper {
  display: flex;
  flex-direction: column;
}

.price-info-wrapper .price-text {
  color: var(--theme-success);
  font-weight: 500;
}

.price-info-wrapper .price-quarter {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

/* 操作区域样式 */
.select-container {
  width: 100%;
}

/* 搜索工具栏样式 */
.search-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--theme-bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--theme-border-secondary);
}

.search-section {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
}

.filter-section {
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 120px;
}

/* 统计面板样式 */
.statistics-panel {
  margin-bottom: 16px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--theme-bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--theme-border-secondary);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--theme-text-secondary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .table-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    gap: 12px;
  }

  .search-section {
    max-width: none;
    width: 100%;
  }

  .filter-section {
    width: 100%;
    justify-content: space-between;
  }

  .filter-select {
    flex: 1;
    min-width: 100px;
  }

  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-toolbar {
    padding: 0;
  }

  .total-info {
    text-align: center;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  :deep(.supplier-material-confirm-dialog) {
    width: 95vw !important;
    margin: 0 !important;
  }

  .statistics-cards {
    grid-template-columns: 1fr;
  }
}
</style>
