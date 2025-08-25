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
        <el-button 
          @click="handleRefresh" 
          :icon="Refresh" 
          type="default"
          :loading="refreshLoading"
        >
          刷新数据
        </el-button>
        <el-button 
          @click="handleExport" 
          :icon="Download" 
          type="default"
          :loading="exportLoading"
        >
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
          border
          stripe
          max-height="60vh"
        >
          <el-table-column type="index" label="序号" width="60" fixed="left" />
          
          <el-table-column prop="materialName" label="物资名称" min-width="140" show-overflow-tooltip />
          
          <el-table-column prop="specifications" label="规格型号" min-width="140" show-overflow-tooltip />
          
          <el-table-column prop="unit" label="单位" width="80" />
          
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
          
          <el-table-column label="价格信息" width="140">
            <template #default="{ row }">
              <div class="price-info">
                <span class="price-text">{{ getPriceText(row) }}</span>
                <div class="price-quarter">{{ getPriceQuarter(row) }}</div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="匹配类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getMatchTypeTagInfo(row.matchedType).type"
                size="small"
              >
                {{ getMatchTypeTagInfo(row.matchedType).text }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="确认状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getConfirmStatusType(row.confirmResult)"
                size="small"
              >
                {{ getConfirmStatusText(row.confirmResult) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="250" fixed="right" align="center">
            <template #default="{ row }">
              <!-- 已确认状态 -->
              <div v-if="row.confirmResult === 1">
                <el-button type="success" size="small" disabled>已确认</el-button>
              </div>
              
              <!-- 精确匹配：无需操作 -->
              <div v-else-if="getMatchTypeTag(row.matchedType).text === '精确匹配'">
                <el-button type="info" size="small" disabled>已精确匹配</el-button>
              </div>
              
              <!-- 相似匹配、历史匹配：显示选择下拉框 -->
              <div v-else-if="['相似匹配', '历史匹配'].includes(getMatchTypeTag(row.matchedType).text) && row.matchOptions && row.matchOptions.length > 0">
                <el-select
                  v-model="row.selectedMaterial"
                  placeholder="选择物资"
                  size="small"
                  style="width: 100%; margin-bottom: 5px"
                  @change="handleMaterialSelectChange(row, $event)"
                >
                  <el-option
                    v-for="option in row.matchOptions"
                    :key="option.matchedId"
                    :label="`${option.baseInfo?.materialName || '未知'} ${option.baseInfo?.specifications || ''}`"
                    :value="option"
                  />
                </el-select>
                <el-select
                  v-model="row.selectedPriceQuarter"
                  placeholder="选择价格和季度"
                  size="small"
                  style="width: 100%"
                  @change="handlePriceQuarterChange(row, $event)"
                >
                  <el-option
                    v-for="priceOption in (row.selectedMaterial?.priceOptions || [])"
                    :key="priceOption.priceId"
                    :label="`¥${formatNumber(priceOption.taxPrice)} (${priceOption.quarter})`"
                    :value="priceOption"
                  />
                </el-select>
              </div>
              
              <!-- 无匹配或其他情况：显示确认和更多选项按钮 -->
              <div v-else>
                <el-button 
                  type="primary" 
                  size="small"
                  :disabled="row.confirmResult === 1"
                  @click="handleQuickConfirm(row)"
                  style="margin-bottom: 5px; width: 100%;"
                >
                  {{ row.confirmResult === 1 ? '已确认' : '确认' }}
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="handleViewOptions(row)"
                  style="width: 100%;"
                >
                  更多选项
                </el-button>
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

    <!-- 确认选项对话框 -->
    <ConfirmOptionsDialog
      v-model="showOptionsDialog"
      :material-data="currentMaterial"
      @confirm="handleOptionConfirm"
      @close="showOptionsDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

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
import { 
  ArrowLeft, 
  Refresh, 
  Download, 
  Check, 
  Search 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ConfirmOptionsDialog from '@/components/home/SupplierMaterialConfirmDialog/ConfirmOptionsDialog.vue'
import { 
  getSupplierMaterialParsingResults,
  querySupplierMaterialsComplex,
  confirmSupplierMaterialData 
} from '@/utils/backendWorkflow.js'

// 导入常量和工具函数
import {
  BUTTON_CONFIG,
  PAGINATION_CONFIG,
  CSS_CLASSES
} from './constants.js'

import {
  useNavigation
} from './utils.js'

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
const showOptionsDialog = ref(false)
const currentMaterial = ref(null)

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
  return materialData.value.filter(item => item.confirmResult === 1).length
})

// 计算是否有修改过的数据
const hasModifiedData = computed(() => {
  return materialData.value.some(item => item.isUserModified === true)
})

const pendingCount = computed(() => {
  return materialData.value.filter(item => item.confirmResult !== 1).length
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
        // 获取数据并初始化每行数据
        const rawData = response.data.content || []
        materialData.value = rawData.map(item => initializeRowData(item))
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
        // 初始化简单查询接口的数据
        materialData.value = response.content.map(item => initializeRowData(item))
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
    
    ElMessage.error('获取解析结果失败，请稍后重试')
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
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.info({
      message: '此功能正在开发中，请等待功能上线！',
      duration: 3000,
      showClose: true
    })
    
    console.log('【提示】导出功能正在开发中')
  } catch (error) {
    console.error('【错误】处理导出失败:', error)
    ElMessage.error('处理失败，请稍后再试')
  } finally {
    exportLoading.value = false
  }
}

/**
 * 批量确认全部
 */
const handleBatchConfirm = async () => {
  const pendingItems = materialData.value.filter(item => item.confirmResult !== 1)
  
  if (pendingItems.length === 0) {
    ElMessage.info('没有需要确认的物资')
    return
  }
  
  // 检查是否有缺少推荐数据的物资
  const missingDataItems = pendingItems.filter(item => {
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
    ElMessage.warning(
      `有 ${missingDataItems.length} 个物资缺少推荐数据，请先手动处理这些物资`
    )
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认批量处理 ${pendingItems.length} 个待确认的物资？`,
      '批量确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    batchConfirming.value = true
    
    const confirmPromises = pendingItems.map(item => {
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
        const item = pendingItems[index]
        item.confirmResult = 1
        item.confirmType = result.value.data?.confirmType || 1
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
      ElMessage.error('批量确认失败')
    }
  } finally {
    batchConfirming.value = false
  }
}

// 获取确认状态类型
const getConfirmStatusType = (status) => {
  switch (Number(status)) {
    case 1: return 'success'
    case 0: return 'warning'
    default: return 'info'
  }
}

// 获取确认状态文本
const getConfirmStatusText = (status) => {
  switch (Number(status)) {
    case 1: return '已确认'
    case 0: return '待确认'
    default: return '未知'
  }
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
    await ElMessageBox.confirm(
      `确认物资"${row.materialName}"的匹配结果？`,
      '确认操作',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
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
      console.error('确认失败:', error)
      ElMessage.error(error.message || '确认失败')
    }
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
      const item = materialData.value.find(item => item.id === confirmData.materialId)
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

// 获取行样式类名
const getRowClassName = ({ row }) => {
  if (row.confirmResult === 1) {
    return 'confirmed-row'
  }
  return 'pending-row'
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
    fetchData()
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

// 新增：物资选择处理函数
const handleMaterialSelectChange = async (row, selectedMaterial) => {
  console.log('物资选择变化:', selectedMaterial)
  row.selectedMaterial = selectedMaterial
  row.selectedPriceQuarter = null
  
  // 如果有价格选项，默认选择第一个
  if (selectedMaterial && selectedMaterial.priceOptions && selectedMaterial.priceOptions.length > 0) {
    row.selectedPriceQuarter = selectedMaterial.priceOptions[0]
    // 自动触发价格选择变化
    handlePriceQuarterChange(row, selectedMaterial.priceOptions[0])
  }
  
  row.isUserModified = true
}

// 新增：价格季度选择处理函数
const handlePriceQuarterChange = (row, selectedPriceQuarter) => {
  console.log('价格季度选择变化:', selectedPriceQuarter)
  row.selectedPriceQuarter = selectedPriceQuarter
  
  // 更新显示的匹配信息
  if (row.selectedMaterial && selectedPriceQuarter) {
    // 更新表格显示的数据
    row.matchedBaseName = row.selectedMaterial.baseInfo.materialName
    row.matchedBaseSpec = row.selectedMaterial.baseInfo.specifications
    row.matchedPrice = selectedPriceQuarter.taxPrice
    row.matchedPriceQuarter = selectedPriceQuarter.quarter
    
    // 标记为用户修改
    row.isUserModified = true
    row.selectedBaseDataId = row.selectedMaterial.matchedId
    row.selectedPriceId = selectedPriceQuarter.priceId
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
      ElMessage.success('确认成功')
    } else {
      ElMessage.error(result?.message || '确认失败')
    }
  } catch (error) {
    console.error('快速确认失败:', error)
    ElMessage.error(error.message || '确认失败')
  }
}

// 新增：初始化行数据
const initializeRowData = (row) => {
  // 为每行添加选择状态
  row.selectedMaterial = null
  row.selectedPriceQuarter = null
  row.isUserModified = false
  row.selectedBaseDataId = null
  row.selectedPriceId = null
  
  // 如果有匹配选项，预选第一个
  if (row.matchOptions && row.matchOptions.length > 0) {
    const firstMatch = row.matchOptions[0]
    row.selectedMaterial = firstMatch
    
    if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
      row.selectedPriceQuarter = firstMatch.priceOptions[0]
    }
  }
  
  return row
}

// 新增：保存解析结果
const handleSaveResults = async () => {
  const modifiedItems = materialData.value.filter(item => item.isUserModified === true)
  
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
    const updateObjList = modifiedItems.map(item => ({
      id: item.taskDataId || item.id,
      confirmBaseDataId: item.selectedBaseDataId || (item.matchOptions?.[0]?.matchedId),
      confirmPriceId: item.selectedPriceId || (item.matchOptions?.[0]?.priceOptions?.[0]?.priceId),
      confirmType: 2 // 人工确认
    }))

    // 这里应该调用保存的API接口
    // 暂时使用确认接口的批量版本
    const promises = updateObjList.map(data => confirmSupplierMaterialData(data))
    const results = await Promise.allSettled(promises)
    
    let successCount = 0
    results.forEach(result => {
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
      ElMessage.error(error.message || '保存失败')
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
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(0, 122, 255, 0.15) 0%, transparent 50%),
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
  0%, 100% {
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
  background: linear-gradient(
    135deg,
    #0a0e1a 0%,
    #1a2332 30%,
    #243447 60%,
    #1a2332 100%
  );
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
  background-image:
    linear-gradient(90deg, transparent 50%, rgba(0, 212, 255, 0.03) 51%, rgba(0, 212, 255, 0.03) 52%, transparent 53%),
    linear-gradient(0deg, transparent 50%, rgba(0, 212, 255, 0.03) 51%, rgba(0, 212, 255, 0.03) 52%, transparent 53%),
    radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(51, 221, 255, 0.08) 0%, transparent 50%);
  background-size: 40px 40px, 40px 40px, 200px 200px, 300px 300px;
  pointer-events: none;
  z-index: -1;
  animation: tech-grid 15s linear infinite;
}

/* 科技网格动画 */
@keyframes tech-grid {
  0% {
    background-position: 0px 0px, 0px 0px, 0px 0px, 0px 0px;
  }
  100% {
    background-position: 40px 40px, 40px 40px, 200px 200px, 300px 300px;
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
  background-image:
    radial-gradient(circle at 30% 20%, rgba(64, 158, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba(64, 158, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 20% 80%, rgba(64, 158, 255, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: dark-glow 25s ease-in-out infinite;
}

/* 暗黑主题光晕效果 */
@keyframes dark-glow {
  0%, 100% {
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
  background-image:
    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 70%, rgba(196, 181, 253, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: purple-dream 20s ease-in-out infinite;
}

@keyframes purple-dream {
  0%, 100% {
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
  background-image:
    radial-gradient(ellipse at 25% 20%, rgba(5, 150, 105, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 40%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 30% 80%, rgba(52, 211, 153, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 70%, rgba(5, 150, 105, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: forest-breeze 18s ease-in-out infinite;
}

@keyframes forest-breeze {
  0%, 100% {
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
  background-image:
    radial-gradient(circle at 30% 25%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(249, 115, 22, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 20% 70%, rgba(251, 146, 60, 0.06) 0%, transparent 50%),
    radial-gradient(circle at 85% 75%, rgba(234, 88, 12, 0.04) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: energy-pulse 15s ease-in-out infinite;
}

@keyframes energy-pulse {
  0%, 100% {
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
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.15), var(--theme-shadow-md);
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
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.15), var(--theme-shadow-md);
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
  transition: color 0.3s ease, opacity 0.3s ease;
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
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s ease;
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
  position: relative;
  backdrop-filter: var(--theme-backdrop-blur, none);
}

:deep(.confirmed-row::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--theme-success), rgba(var(--theme-success-rgb), 0.7));
  border-radius: 0 4px 4px 0;
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
</style>