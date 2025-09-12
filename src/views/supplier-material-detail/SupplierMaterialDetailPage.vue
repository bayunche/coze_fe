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
        <!-- <el-button @click="handleExport" :icon="Download" type="default" :loading="exportLoading">
          导出数据
        </el-button> -->
        <el-button @click="handleGenerateReport" :icon="Document" type="primary" :loading="reportGenerating">
          生成解析报告
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

     
      </div>

      <!-- 操作指引栏 -->
      <OperationGuide />

      <!-- 解析结果总览卡片 -->
      <div class="overview-cards">
        <div 
          class="overview-card total-card" 
          @click="handleOverviewCardClick('total')"
          :class="{ active: activeOverviewType === 'total' }"
        >
          <div class="card-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ total }}</div>
            <div class="card-label">总条数（点击查看全部）</div>
          </div>
        </div>

        <div 
          class="overview-card matched-card" 
          @click="handleOverviewCardClick('matched')"
          :class="{ active: activeOverviewType === 'matched' }"
        >
          <div class="card-icon">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ matchedCount }}</div>
            <div class="card-label">已智能匹配数（点击查看已智能匹配的）</div>
          </div>
        </div>
  <div 
          class="overview-card price-mismatch-card" 
          @click="handleOverviewCardClick('priceMismatch')"
          :class="{ active: activeOverviewType === 'priceMismatch' }"
        >
          <div class="card-icon">
            <el-icon><WarnTriangleFilled /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ priceMismatchCount }}</div>
            <div class="card-label">价格有问题（价格不一致的，需要调整结算书数据）</div>
          </div>
        </div>
        <div 
          class="overview-card unmatched-card" 
          @click="handleOverviewCardClick('unmatched')"
          :class="{ active: activeOverviewType === 'unmatched' }"
        >
          <div class="card-icon">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-number">{{ unmatchedCount }}</div>
            <div class="card-label">未匹配到物资数（需手动处理）</div>
          </div>
        </div>

      
      </div>

      <!-- 物资详情表格区块 -->
      <div v-if="showTable" :class="CSS_CLASSES.TABLE_SECTION">
        <SupplierMaterialTable
          :data="materialData"
          :table-type="currentTableType"
          :loading="tableLoading"
          :batch-confirming="batchConfirming"
          :pending-count="pendingCount"
          @quick-confirm="handleQuickConfirm"
          @view-options="handleViewOptions"
          @batch-confirm="handleBatchConfirm"
        />

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
          >
            检查确认状态
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

    <!-- 报告生成Dialog -->
    <ReportGenerationDialog
      v-model="showReportDialog"
      :progress-text="reportProgressText"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, provide } from 'vue'

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
import { ArrowLeft, Refresh, Download, Search, DataAnalysis, SuccessFilled, CircleCloseFilled, WarnTriangleFilled, Document, Minus, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import MaterialPriceSelectionDialog from '@/components/common/MaterialPriceSelectionDialog'
import ReportGenerationDialog from '@/components/common/ReportGenerationDialog.vue'
import {
  getSupplierMaterialParsingResults,
  querySupplierMaterialsComplex,
  confirmSupplierMaterialData,
  callStreamWorkflow
} from '@/utils/backendWorkflow.js'
import supplierMaterialService from '@/services/SupplierMaterialService.js'
import MaterialService from '@/services/MaterialService.js'
import { useSupplierMaterialStore } from '@/stores/supplierMaterial'

// 导入新的组件
import { SupplierMaterialTable, OperationGuide, TABLE_TYPES } from '@/components/supplier-material'

// 导入常量和工具函数
import { BUTTON_CONFIG, PAGINATION_CONFIG, CSS_CLASSES } from './constants.js'

import { useNavigation, getPriceMatchingStatusTagFromRow } from './utils.js'

// 路由参数 - 使用 props 传递的参数
const taskId = computed(() => {
  // console.log('【调试】详情页面 - taskId props:', props.taskId)
  return props.taskId
})
const detailId = computed(() => {
  // console.log('【调试】详情页面 - detailId props:', props.detailId)
  return props.detailId
})

// 导航函数和Store
const router = useRouter()
const { goBack } = useNavigation()
const supplierMaterialStore = useSupplierMaterialStore()

// 响应式数据
const pageLoading = ref(false)
const tableLoading = ref(false)
const refreshLoading = ref(false)
const batchConfirming = ref(false)
const exportLoading = ref(false)
const saving = ref(false)
const reportGenerating = ref(false)

// 报告生成Dialog相关状态
const showReportDialog = ref(false)
const reportProgressText = ref('')

const materialData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

// 物资价格选择弹窗状态
const showMaterialPriceDialog = ref(false)
const currentSelectionRow = ref(null)

// 搜索和筛选参数
const searchKeyword = ref('')
const queryParams = ref({
  confirmResult: undefined,
  matchedType: undefined,
  matchingStatus: undefined
})
const statistics = ref(null)
const useComplexQuery = ref(true) // 是否使用复杂查询接口

// 总览卡片统计数据 - 来自后端接口
const matchingStats = ref({
  totalMaterials: 0,
  exactMatchCount: 0,
  unmatchedPriceCount: 0,
  pendingMatchCount: 0
})

// 计算确认统计

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

// 总览卡片相关状态
const activeOverviewType = ref(null)

// 表格显示控制
const showTable = computed(() => activeOverviewType.value !== null)

// 当前表格类型
const currentTableType = computed(() => {
  if (!activeOverviewType.value) return TABLE_TYPES.ALL
  
  switch (activeOverviewType.value) {
    case 'total':
      return TABLE_TYPES.ALL
    case 'matched':
      return TABLE_TYPES.MATCHED
    case 'priceMismatch':
      return TABLE_TYPES.PRICE_MISMATCH
    case 'unmatched':
      return TABLE_TYPES.UNMATCHED
    default:
      return TABLE_TYPES.ALL
  }
})

// 基于后端统计接口的计算属性
const matchedCount = computed(() => {
  // 精确匹配且价格匹配的数量
  return matchingStats.value.exactMatchCount
})

const unmatchedCount = computed(() => {
  // 待匹配的数量（包含相似匹配、历史匹配、人工匹配、无匹配）
  return matchingStats.value.pendingMatchCount
})

const priceMismatchCount = computed(() => {
  // 精确匹配但价格未匹配的数量
  return matchingStats.value.unmatchedPriceCount
})

// 物资总数计算属性
const total = computed(() => {
  return matchingStats.value.totalMaterials
})

/**
 * 获取乙供物资匹配统计数据
 */
const fetchMatchingStats = async () => {
  if (!taskId.value) return

  try {
    console.log('【调用】获取乙供物资匹配统计，taskId:', taskId.value)
    const response = await supplierMaterialService.getMaterialMatchingStats(taskId.value)
    
    // 【调试】打印原始API返回结果
    console.log('【调试】原始API返回结果:', JSON.stringify(response, null, 2))
    console.log('【调试】response的所有字段名:', Object.keys(response || {}))
    
    // 更新统计数据 - 添加调试信息来识别字段映射问题
    matchingStats.value = {
      totalMaterials: response.totalMaterials || response.total || response.totalCount || 0,
      exactMatchCount: response.exactMatchCount || response.matched || response.matchedCount || 0,
      unmatchedPriceCount: response.unmatchedPriceCount || response.priceMismatch || response.priceMismatchCount || 0,
      pendingMatchCount: response.pendingMatchCount || response.unmatched || response.unmatchedCount || response.pending || 0
    }
    
    // 添加详细的字段值调试
    console.log('【调试】API返回字段对应关系:')
    console.log('  response.exactMatchCount:', response.exactMatchCount)
    console.log('  response.unmatchedPriceCount:', response.unmatchedPriceCount)
    console.log('  response.pendingMatchCount:', response.pendingMatchCount)
    console.log('  response.matched:', response.matched)
    console.log('  response.priceMismatch:', response.priceMismatch)
    console.log('  response.unmatched:', response.unmatched)
    
    console.log('【响应】统计数据已更新:', matchingStats.value)
    console.log('【调试】映射后的统计数据详情:')
    console.log('  totalMaterials (总数):', matchingStats.value.totalMaterials)
    console.log('  exactMatchCount (已匹配):', matchingStats.value.exactMatchCount)
    console.log('  unmatchedPriceCount (价格不匹配):', matchingStats.value.unmatchedPriceCount)
    console.log('  pendingMatchCount (未匹配):', matchingStats.value.pendingMatchCount)
  } catch (error) {
    console.error('【错误】获取匹配统计失败:', error)
    // 失败时保持默认值，不影响页面其他功能
    matchingStats.value = {
      totalMaterials: 0,
      exactMatchCount: 0,
      unmatchedPriceCount: 0,
      pendingMatchCount: 0
    }
  }
}

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

      if (queryParams.value.matchingStatus !== undefined) {
        params.matchingStatus = queryParams.value.matchingStatus
      }

      console.log('【数据查询】使用复杂查询参数:', params)
      console.log('【数据查询】当前筛选状态:', {
        activeOverviewType: activeOverviewType.value,
        queryParams: queryParams.value
      })
      
      response = await querySupplierMaterialsComplex(params)
      
      console.log('【数据查询】返回结果总数:', response?.data?.content?.length || 0)
      console.log('【数据查询】返回结果总元素数:', response?.data?.totalElements || 0)
      
      // 调试：检查返回数据的匹配状态分布
      if (response?.data?.content) {
        const statusDistribution = {}
        const typeDistribution = {}
        response.data.content.forEach(item => {
          const status = item.matchingStatus || 'undefined'
          const type = item.matchedType || 'undefined'
          statusDistribution[status] = (statusDistribution[status] || 0) + 1
          typeDistribution[type] = (typeDistribution[type] || 0) + 1
        })
        console.log('【数据查询】返回数据matchingStatus分布:', statusDistribution)
        console.log('【数据查询】返回数据matchedType分布:', typeDistribution)
      }

      if (response && response.data) {
        // 获取数据并初始化每行数据，转换为双行结构
        const rawData = response.data.content || []
        materialData.value = rawData.flatMap((item, index) => {
          const initialized = initializeRowData(item)
          const dataRow = { ...initialized, rowType: 'data', rowKey: `${initialized.taskDataId || initialized.id}-data` }
          const actionRow = { ...initialized, rowType: 'action', rowKey: `${initialized.taskDataId || initialized.id}-action` }
          
          // 数据初始化完成
          
          // 如果不是最后一项，添加分隔行
          if (index < rawData.length - 1) {
            const separatorRow = { 
              rowType: 'separator', 
              rowKey: `${initialized.taskDataId || initialized.id}-separator`,
              id: `separator-${initialized.taskDataId || initialized.id}`
            }
            return [dataRow, actionRow, separatorRow]
          }
          
          return [dataRow, actionRow]
        })
        statistics.value = response.data.statistics || {}
        // 注意：total现在从matchingStats计算而来，不再从response设置
      }
    } else {
      // 使用简单查询接口（后备方案）
      response = await getSupplierMaterialParsingResults(taskId.value, {
        page: currentPage.value - 1,
        size: pageSize.value
      })

      if (response && response.content) {
        // 初始化简单查询接口的数据，转换为双行结构
        materialData.value = response.content.flatMap((item, index) => {
          const initialized = initializeRowData(item)
          const dataRow = { ...initialized, rowType: 'data', rowKey: `${initialized.taskDataId || initialized.id}-data` }
          const actionRow = { ...initialized, rowType: 'action', rowKey: `${initialized.taskDataId || initialized.id}-action` }
          
          // 如果不是最后一项，添加分隔行
          if (index < response.content.length - 1) {
            const separatorRow = { 
              rowType: 'separator', 
              rowKey: `${initialized.taskDataId || initialized.id}-separator`,
              id: `separator-${initialized.taskDataId || initialized.id}`
            }
            return [dataRow, actionRow, separatorRow]
          }
          
          return [dataRow, actionRow]
        })
        // 注意：total现在从matchingStats计算而来，不再从response设置
        statistics.value = null
      }
    }

    if (!response) {
      materialData.value = []
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

// 格式化数字 - 已移至组件
// const formatNumber = (value) => {
//   if (value === null || value === undefined || value === '') return '-'
//   return Number(value).toLocaleString()
// }


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

// 筛选变化处理 - 已不再使用
// const handleFilterChange = () => {
//   currentPage.value = 1
//   fetchData()
// }

// 处理总览卡片点击
const handleOverviewCardClick = (type) => {

  
  // 如果点击的是当前激活的卡片，则取消筛选
  if (activeOverviewType.value === type) {
    activeOverviewType.value = null
    // 清空所有筛选参数
    queryParams.value = {
      confirmResult: undefined,
      matchedType: undefined,
      matchingStatus: undefined
    }
  } else {
    activeOverviewType.value = type
    
    // 清空所有筛选参数，只保留 matchingStatus
    queryParams.value = {
      confirmResult: undefined,
      matchedType: undefined,
      matchingStatus: undefined
    }
    
    // 根据卡片类型设置筛选条件
    // 仅使用新的 matchingStatus 参数进行筛选
    switch (type) {
      case 'total':
        // 显示全部，不设置筛选条件
        console.log('【卡片筛选】选择全部数据')
        break
      case 'matched':
        // 使用 matchingStatus = 1: 精确匹配且价格匹配
        queryParams.value.matchingStatus = 1
        break
      case 'unmatched':
        // 使用 matchingStatus = 3: 待处理匹配（包括相似匹配、历史匹配、人工匹配、无匹配）
        queryParams.value.matchingStatus = 3
        break
      case 'priceMismatch':
        // 使用 matchingStatus = 2: 精确匹配但价格未匹配
        queryParams.value.matchingStatus = 2
        break
    }
    
  }
  
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
const handleRefresh = async () => {
  currentPage.value = 1
  // 同时获取数据和统计信息
  await Promise.all([
    fetchData(),
    fetchMatchingStats()
  ])
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
 * 生成解析报告
 */
const handleGenerateReport = async () => {
  try {
    reportGenerating.value = true
    
    // 先检查数据是否完全确认（参考检查确认状态按钮实现）
    try {
      // 调用API查询未确认的数据数量
      const unconfirmedCount = await MaterialService.getUnconfirmedCount(taskId.value)
      
      if (unconfirmedCount > 0) {
        // 如果还有未确认的数据，提示用户并中断生成报告
        reportGenerating.value = false
        await ElMessageBox.alert(
          `还有 ${unconfirmedCount} 条数据未确认，请先确认所有数据后再生成报告。`,
          '提示',
          {
            confirmButtonText: '知道了',
            type: 'warning'
          }
        )
        return // 中断报告生成
      }
    } catch (error) {
      console.error('检查未确认数据失败:', error)
      reportGenerating.value = false
      ElMessage.error('检查数据状态失败，无法生成报告')
      return
    }
    
    // 数据检查通过，开始生成报告
    showReportDialog.value = true
    reportProgressText.value = '正在初始化...'
    
    // 调用工作流ID 10生成报告
    const inputs = {
      taskId: taskId.value
    }
    
    let finalReportData = null
    
    await callStreamWorkflow(inputs, '10', {
      onMessage: (event) => {
        console.log('【乙供物资报告生成】接收消息:', event)
        
        // 优先检查是否已经有解析好的llmReportData
        if (event.llmReportData && typeof event.llmReportData === 'object') {
          finalReportData = event.llmReportData
          reportProgressText.value = '报告数据解析完成...'
          console.log('【乙供物资报告生成】从llmReportData获取报告数据:', finalReportData)
          return
        }
        
        // 更新进度文字
        if (event.content && typeof event.content === 'string' && !event.content.startsWith('{')) {
          reportProgressText.value = event.content
        }
        
        if (event.content) {
          try {
            // 尝试解析消息内容为JSON
            const parsedContent = JSON.parse(event.content)
            console.log('【乙供物资报告生成】解析后的内容:', parsedContent)
            
            if (parsedContent && typeof parsedContent === 'object') {
              // 检查是否有嵌套的content字段需要再次解析
              if (parsedContent.content && typeof parsedContent.content === 'string') {
                try {
                  const nestedContent = JSON.parse(parsedContent.content)
                  console.log('【乙供物资报告生成】嵌套解析后的内容:', nestedContent)
                  
                  // 提取modelAnswer.output作为最终报告数据
                  if (nestedContent.modelAnswer && nestedContent.modelAnswer.output) {
                    finalReportData = nestedContent.modelAnswer.output
                    reportProgressText.value = '正在处理报告数据...'
                    console.log('【乙供物资报告生成】提取的报告数据:', finalReportData)
                  } else if (nestedContent.output) {
                    // 备用方案：直接从nestedContent.output获取
                    finalReportData = nestedContent.output
                    reportProgressText.value = '正在处理报告数据...'
                    console.log('【乙供物资报告生成】从output获取报告数据:', finalReportData)
                  } else {
                    // 如果都没有，使用整个嵌套内容
                    finalReportData = nestedContent
                    reportProgressText.value = '正在处理报告数据...'
                    console.log('【乙供物资报告生成】使用整个嵌套内容:', finalReportData)
                  }
                } catch (nestedError) {
                  console.log('【乙供物资报告生成】嵌套内容不是JSON:', parsedContent.content)
                  // 如果嵌套解析失败，但外层解析成功，使用外层内容
                  if (parsedContent.modelAnswer && parsedContent.modelAnswer.output) {
                    finalReportData = parsedContent.modelAnswer.output
                    reportProgressText.value = '正在处理报告数据...'
                    console.log('【乙供物资报告生成】从外层提取报告数据:', finalReportData)
                  }
                }
              } else {
                // 如果没有嵌套content，检查是否有modelAnswer.output
                if (parsedContent.modelAnswer && parsedContent.modelAnswer.output) {
                  finalReportData = parsedContent.modelAnswer.output
                  reportProgressText.value = '正在处理报告数据...'
                  console.log('【乙供物资报告生成】直接从外层modelAnswer提取:', finalReportData)
                } else {
                  // 直接使用解析后的内容
                  finalReportData = parsedContent
                  reportProgressText.value = '正在处理报告数据...'
                  console.log('【乙供物资报告生成】使用整个解析后的内容:', finalReportData)
                }
              }
            }
          } catch (e) {
            // 如果不是JSON格式，可能是文本消息，暂时忽略
            console.log('【乙供物资报告生成】非JSON格式消息:', event.content)
          }
        }
      },
      onError: (error) => {
        console.error('【乙供物资报告生成】工作流执行失败:', error)
        showReportDialog.value = false
        reportProgressText.value = ''
        ElMessage.error('生成报告失败: ' + (error.message || '未知错误'))
      },
      onComplete: () => {
        console.log('【乙供物资报告生成】工作流执行完成，报告数据:', finalReportData)
        console.log('【乙供物资报告生成】当前taskId:', taskId.value)
        
        if (finalReportData) {
          reportProgressText.value = '报告生成完成，正在跳转...'
          
          // 保存报告数据到store
          console.log('【乙供物资报告生成】准备保存数据到store')
          supplierMaterialStore.setReportData(taskId.value, finalReportData)
          console.log('【乙供物资报告生成】数据已保存到store')
          
          // 延迟一下再关闭dialog和跳转，让用户看到完成提示
          setTimeout(() => {
            showReportDialog.value = false
            reportProgressText.value = ''
            
            console.log('【乙供物资报告生成】准备跳转到报告页面')
            
            // 跳转到报告页面
            router.push({
              name: 'supplier-material-report',
              params: { taskId: taskId.value }
            }).then(() => {
              console.log('【乙供物资报告生成】路由跳转成功')
              ElMessage.success('报告生成成功！')
            }).catch((error) => {
              console.error('【乙供物资报告生成】路由跳转失败:', error)
              ElMessage.error('页面跳转失败: ' + error.message)
            })
          }, 1000)
        } else {
          console.log('【乙供物资报告生成】未获取到有效的报告数据')
          showReportDialog.value = false
          reportProgressText.value = ''
          ElMessage.warning('报告生成完成，但未获取到有效数据')
        }
      }
    })
    
  } catch (error) {
    console.error('【乙供物资报告生成】生成报告失败:', error)
    showReportDialog.value = false
    reportProgressText.value = ''
    ElMessage.error('生成报告失败: ' + (error.message || '未知错误'))
  } finally {
    reportGenerating.value = false
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
  
  // 如果操作行没有基础信息数据（baseInfo为空），不显示差异标记
  if (!actionRow.baseInfo || Object.keys(actionRow.baseInfo).length === 0) {
    return false
  }
  
  const dataUnit = (dataRow.unit || '').trim()
  const actionUnit = (actionRow.unit || '').trim()
  
  return dataUnit !== actionUnit && actionUnit !== '-' && dataUnit !== '-'
}

// 检查物资名称是否有差异
const hasMaterialNameDifference = (actionRow) => {
  const { dataRow } = getCorrespondingRows(actionRow)
  if (!dataRow || !actionRow) return false
  
  // 如果操作行没有基础信息数据（baseInfo为空），不显示差异标记
  if (!actionRow.baseInfo || Object.keys(actionRow.baseInfo).length === 0) {
    return false
  }
  
  const dataName = getDisplayMaterialName(dataRow)
  const actionName = getDisplayMaterialName(actionRow)
  
  return dataName !== actionName && actionName !== '-' && dataName !== '-'
}

// 检查规格型号是否有差异
const hasSpecificationDifference = (actionRow) => {
  const { dataRow } = getCorrespondingRows(actionRow)
  if (!dataRow || !actionRow) return false
  
  // 如果操作行没有基础信息数据（baseInfo为空），不显示差异标记
  if (!actionRow.baseInfo || Object.keys(actionRow.baseInfo).length === 0) {
    return false
  }
  
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
  // 未匹配且未选择数据时，返回等待选择
  if (row.matchedType === 0 && !row.hasUserSelectedData) {
    return { text: '等待选择', type: 'info' }
  }
  // 其他所有情况都显示数据库
  return { text: '数据库', type: 'success' }
}

// 判断价格是否不匹配（优化后的逻辑）
const isPriceMismatch = (row) => {
  // 只对精确匹配的物资进行价格不匹配判断
  if (row.matchedType !== 1) {
    return false
  }

  // 获取原始价格（用户上传的价格）
  let originalPrice = 0
  if (row.unitPrice !== undefined && row.unitPrice !== null && row.unitPrice !== 0) {
    originalPrice = parseFloat(row.unitPrice)
  } else if (row.taxPrice !== undefined && row.taxPrice !== null && row.taxPrice !== 0) {
    originalPrice = parseFloat(row.taxPrice)
  }

  // 获取匹配到的数据库价格
  let matchedPrice = 0
  if (row.priceInfo?.taxPrice !== undefined && row.priceInfo.taxPrice !== null) {
    matchedPrice = parseFloat(row.priceInfo.taxPrice)
  }

  // 如果没有价格信息，视为价格不匹配（与标签逻辑保持一致）
  if (originalPrice <= 0 || matchedPrice <= 0) {
    return true
  }

  // 计算价格差异百分比，使用相对容差而不是绝对容差
  const priceDifference = Math.abs(originalPrice - matchedPrice)
  const relativeTolerance = Math.max(originalPrice, matchedPrice) * 0.05 // 5%容差
  const absoluteTolerance = 0.1 // 0.1元绝对容差
  
  // 使用较大的容差值
  const tolerance = Math.max(relativeTolerance, absoluteTolerance)
  const result = priceDifference > tolerance
  
  // 调试日志 - 仅在有差异时输出
  if (result && row.taskDataId) {
    console.log(`【价格不匹配】物资: ${row.materialName}`)
    console.log(`  原始价格: ¥${originalPrice.toFixed(2)} | 匹配价格: ¥${matchedPrice.toFixed(2)}`)
    console.log(`  价格差异: ¥${priceDifference.toFixed(2)} | 容差: ¥${tolerance.toFixed(2)}`)
    console.log(`  差异百分比: ${((priceDifference / Math.max(originalPrice, matchedPrice)) * 100).toFixed(2)}%`)
  }
  
  return result
}

// 获取价格匹配状态标签 - 使用新的API状态字段
const getPriceMatchingStatusTag = (row) => {
  return getPriceMatchingStatusTagFromRow(row)
}

// 调试函数：获取操作按钮的展示逻辑 - 已不再使用
// const getOperationButtonLogic = (row) => {
//   if (row.rowType !== 'action') return null
//   
//   const logic = {
//     id: row.taskDataId,
//     confirmResult: row.confirmResult,
//     matchedType: row.matchedType,
//     hasUserSelectedData: row.hasUserSelectedData,
//     isPriceMismatch: isPriceMismatch(row),
//     shouldShow: null
//   }
//   
//   if (row.confirmResult === 1) {
//     logic.shouldShow = '已确认状态 - 显示已确认标签和重选按钮'
//   } else if (row.matchedType === 0 && row.hasUserSelectedData) {
//     logic.shouldShow = '未匹配已选择 - 显示重新选择按钮'
//   } else if (row.matchedType === 0) {
//     logic.shouldShow = '未匹配未选择 - 显示从库选择按钮'
//   } else if (row.matchedType === 1 && isPriceMismatch(row)) {
//     logic.shouldShow = '精确匹配价格不匹配 - 显示价格不匹配提示'
//   } else if (row.matchedType === 1 && !isPriceMismatch(row)) {
//     logic.shouldShow = '精确匹配价格匹配 - 显示确认和重选按钮'
//   } else if (row.matchedType === 2 || row.matchedType === 3 || row.matchedType === 4) {
//     logic.shouldShow = '相似/历史/人工匹配 - 显示选择确认按钮'
//   } else {
//     logic.shouldShow = '其他情况 - 显示重新选择按钮'
//   }
//   
//   // 只对有问题的行输出日志
//   if (row.taskDataId) {
//     console.log(`【操作按钮逻辑】`, logic)
//   }
//   
//   return logic
// }

// 获取基础信息名称
const getBaseInfoName = (row) => {
  // 数据行：始终显示外层的原始解析数据
  if (row.rowType === 'data') {
    return row.materialName || '-'
  }
  
  // 操作行的显示逻辑
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseName) {
    return row.confirmedBaseName
  }

  // 如果用户已选择但未确认，显示选择的数据
  if (row.hasUserSelectedData && row.confirmedBaseName) {
    return row.confirmedBaseName
  }

  // 从baseInfo获取（匹配后的数据）
  if (row.baseInfo && row.baseInfo.materialName) {
    return row.baseInfo.materialName
  }

  // 从matchOptions中获取第一个匹配的基础数据（用于相似匹配等情况）
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
    return row.matchOptions[0].baseInfo.materialName
  }

  // 无匹配时返回空
  return '-'
}

// 获取基础信息规格
const getBaseInfoSpec = (row) => {
  // 数据行：始终显示外层的原始解析数据
  if (row.rowType === 'data') {
    return row.specifications || '-'
  }
  
  // 操作行的显示逻辑
  // 最优先：如果用户已确认选择，显示确认的数据
  if (row.confirmResult === 1 && row.confirmedBaseSpec) {
    return row.confirmedBaseSpec
  }

  // 如果用户已选择但未确认，显示选择的数据
  if (row.hasUserSelectedData && row.confirmedBaseSpec) {
    return row.confirmedBaseSpec
  }

  // 从baseInfo获取（匹配后的数据）
  if (row.baseInfo && row.baseInfo.specifications) {
    return row.baseInfo.specifications
  }

  // 从matchOptions中获取第一个匹配的基础数据（用于相似匹配等情况）
  if (row.matchOptions && row.matchOptions.length > 0 && row.matchOptions[0].baseInfo) {
    return row.matchOptions[0].baseInfo.specifications || ''
  }

  // 无匹配时返回空
  return '-'
}


// 获取操作行对应的价格数值（与标签逻辑保持一致）
const getActionRowPrice = (dataRow, priceType) => {
  // 在 materialData 中查找对应的操作行
  const actionRowIndex = materialData.value.findIndex(item => 
    item.rowType === 'action' && 
    ((item.taskDataId && dataRow.taskDataId && item.taskDataId === dataRow.taskDataId) ||
     (item.id && dataRow.id && item.id === dataRow.id))
  )
  
  if (actionRowIndex === -1) return null
  
  const actionRow = materialData.value[actionRowIndex]
  
  // 与标签逻辑保持一致：只有在有priceInfo且有taxPrice时才返回价格
  // 如果没有priceInfo，标签显示"价格不匹配"，价格对比也不应该显示
  if (!actionRow.priceInfo || !actionRow.priceInfo.taxPrice) {
    return null
  }
  
  // 从priceInfo获取价格
  if (priceType === 'taxIncluded') {
    return parseFloat(actionRow.priceInfo.taxPrice) || null
  } else if (priceType === 'taxExcluded') {
    // 从含税价格计算不含税价格（13%税率）
    const taxIncluded = parseFloat(actionRow.priceInfo.taxPrice)
    return taxIncluded > 0 ? taxIncluded / 1.13 : null
  }
  
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
  
  // 如果价格差异小于容差，认为价格相同，显示 Minus 图标代表 "--"
  if (priceDiff < tolerance) {
    console.log(`【价格对比】${row.materialName} 价格相同，显示 "--" 符号`)
    return Minus
  }
  
  // 数据行价格大于操作行价格时，显示绿色向下箭头（表示原价更高）
  if (dataPrice > actionPrice) {
    return ArrowDown
  }
  // 数据行价格小于操作行价格时，显示红色向上箭头（表示原价更低）
  else if (dataPrice < actionPrice) {
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
  
  // console.log(`【价格对比调试】${debugInfo.物资名称} - ${debugInfo.价格类型}:`, debugInfo)
  
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
  
  // 如果价格差异小于容差，认为价格相同，显示灰色
  if (priceDiff < tolerance) {
    console.log(`【价格对比】${row.materialName} 价格相同，显示灰色`)
    return { color: '#666666', fontWeight: 'normal' }
  }
  
  // 数据行价格大于操作行价格时，数据行价格显示绿色（表示原价更高）
  if (dataPrice > actionPrice) {
    return { color: '#67C23A', fontWeight: '600' }
  }
  // 数据行价格小于操作行价格时，数据行价格显示红色（表示原价更低）
  else if (dataPrice < actionPrice) {
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
  
  // 如果价格差异小于容差，认为价格相同，显示灰色的 "--" 符号
  if (priceDiff < tolerance) {
    return { color: '#666666', marginLeft: '4px', fontSize: '12px' }
  }
  
  // 数据行价格大于操作行价格时，显示绿色向下箭头
  if (dataPrice > actionPrice) {
    return { color: '#67C23A', marginLeft: '4px', fontSize: '12px' }
  }
  // 数据行价格小于操作行价格时，显示红色向上箭头
  else if (dataPrice < actionPrice) {
    return { color: '#F56C6C', marginLeft: '4px', fontSize: '12px' }
  }
  
  return {}
}

// 查看更多选项 - 打开物资价格选择对话框
const handleViewOptions = async (row) => {
  console.log('【调试】handleViewOptions 被调用，设置 currentSelectionRow:', row)


  currentSelectionRow.value = row
  showMaterialPriceDialog.value = true
}

// 旧的物资选择数据加载方法已移除，统一使用 MaterialPriceSelectionDialog

// 旧的物资选择方法已移除，统一使用 MaterialPriceSelectionDialog

// 获取行样式类名
const getRowClassName = ({ row }) => {
  let className = ''
  
  // 分隔行特殊处理
  if (row.rowType === 'separator') {
    return 'separator-row'
  }
  
  // 根据确认状态和匹配类型确定主要样式类
  if (Number(row.confirmResult) === 1) {
    className += 'confirmed-row'
  } else if (Number(row.matchedType) === 0) {
    className += 'no-match-row'
  } else {
    className += 'pending-row'
  }
  
  // 为操作行添加特殊样式类名
  if (row.rowType === 'action') {
    className += ' action-row'
  }
  
  return className.trim()
}

// 获取序号条的样式类
const getSequenceBarClass = (row) => {
  if (Number(row.confirmResult) === 1) {
    return 'sequence-bar-green'  // 已确认 - 绿色
  } else if (Number(row.matchedType) === 0) {
    return 'sequence-bar-red'    // 未匹配 - 红色
  } else {
    return 'sequence-bar-yellow' // 待确认 - 黄色
  }
}

// 表格合并方法
const tableSpanMethod = ({ row, columnIndex, column }) => {
  // 安全检查：确保 row 存在
  if (!row) {
    return { rowspan: 1, colspan: 1 }
  }
  
  // 获取列的属性名或标识
  const columnProp = column.property || column.label
  
  // 将第一列（序号）在 data 行合并三行（数据行+操作行+分隔行）
  if (columnIndex === 0) {
    if (row.rowType === 'data') return { rowspan: 3, colspan: 1 }
    if (row.rowType === 'action' || row.rowType === 'separator') return { rowspan: 0, colspan: 0 }
  }
  
  // 数量列合并：数据行和操作行显示相同内容，所以合并
  if (columnProp === 'quantity' || column.label === '数量') {
    if (row.rowType === 'data') return { rowspan: 2, colspan: 1 } // 合并数据行和操作行
    if (row.rowType === 'action') return { rowspan: 0, colspan: 0 } // 操作行隐藏
    if (row.rowType === 'separator') return { rowspan: 1, colspan: 1 } // 分隔行正常显示
  }
  
  // 税率列合并：数据行和操作行显示相同内容，所以合并
  if (column.label === '税率（上传时选择的税率，价格以该税率为基准计算）') {
    if (row.rowType === 'data') return { rowspan: 2, colspan: 1 } // 合并数据行和操作行
    if (row.rowType === 'action') return { rowspan: 0, colspan: 0 } // 操作行隐藏
    if (row.rowType === 'separator') return { rowspan: 1, colspan: 1 } // 分隔行正常显示
  }
  
  // 默认不合并其它列，返回默认值
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
    // 同时加载数据和统计信息
    Promise.all([
      fetchData(),
      fetchMatchingStats()
    ]).then(() => {
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
  console.log('【数据流转-6】handleMaterialPriceSelection 开始')
  console.log('  接收的selection:', JSON.stringify(selection, null, 2))
  console.log('  currentSelectionRow:', currentSelectionRow.value)
  
  if (!selection || !selection.material || !selection.price || !currentSelectionRow.value) {
    console.log('【数据流转-6】参数缺失，退出')
    console.log('  selection:', !!selection)
    console.log('  selection.material:', !!selection?.material)
    console.log('  selection.price:', !!selection?.price)
    console.log('  currentSelectionRow:', !!currentSelectionRow.value)
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
    
    // 智能提取价格数据，支持多种字段名
    const extractPrice = (priceObj) => {
      // 按优先级尝试多种可能的字段名
      return priceObj.taxPrice || 
             priceObj.unitPrice || 
             priceObj.含税价格 || 
             priceObj.price || 
             priceObj.taxInclusivePrice ||
             priceObj.selectedPrice || 
             0
    }

    const priceInfo = {
      taxPrice: extractPrice(selection.price),
      unitPrice: selection.price.unitPrice || selection.price.taxPrice || extractPrice(selection.price),
      taxExcludedPrice: selection.price.taxExcludedPrice || selection.price.notaxPrice || 0,
      originalPrice: selection.price.originalPrice || extractPrice(selection.price),
      priceType: selection.price.priceType || 1,
      quarter: selection.price.quarter || selection.price.季度 || '',
      id: selection.price.priceId || selection.price.id
    }

    console.log('【数据流转-6】数据提取完成:')
    console.log('  materialBaseInfo:', materialBaseInfo)
    console.log('  priceInfo:', priceInfo)
    console.log('  selection.material所有字段:', Object.keys(selection.material))
    console.log('  selection.price所有字段:', Object.keys(selection.price))

    // 更新物资信息
    const confirmBaseName = materialBaseInfo.materialName
    const confirmBaseSpec = materialBaseInfo.specificationModel
    
    // 确保价格字段有有效值
    const extractedPrice = extractPrice(selection.price)
    const confirmPrice = extractedPrice // 含税价格
    const confirmPriceQuarter = priceInfo.quarter
    
    // 新增价格字段，确保都有值
    const confirmUnitPrice = extractedPrice // 如果没有专门的单价，使用相同的价格
    const confirmTaxExcludedPrice = priceInfo.taxExcludedPrice
    const confirmOriginalPrice = extractedPrice
    const confirmPriceType = priceInfo.priceType

    console.log('【数据流转-6】计算出的确认数据:')
    console.log('  confirmPrice:', confirmPrice, '(含税价)')
    console.log('  confirmUnitPrice:', confirmUnitPrice)
    console.log('  confirmTaxExcludedPrice:', confirmTaxExcludedPrice)
    console.log('  confirmPriceQuarter:', confirmPriceQuarter)
    console.log('  materialBaseInfo.id:', materialBaseInfo.id)
    console.log('  priceInfo.id:', priceInfo.id)

    // 更新所有匹配的数据行和操作行
    items.forEach((item, index) => {
      const itemIndex = materialData.value.findIndex(dataItem => dataItem === item)
      
      console.log(`【数据流转-7】更新第${index + 1}个匹配项:`)
      console.log('  item.rowType:', item.rowType)
      console.log('  itemIndex:', itemIndex)
      
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
        
        // 【核心修改】更新baseInfo和priceInfo对象
        materialData.value[itemIndex].baseInfo = {
          baseDataId: materialBaseInfo.id,
          materialName: selection.material.materialName,
          specifications: selection.material.specificationModel || selection.material.specifications,
          unit: selection.material.unit,
          serialNumber: selection.material.serialNumber || '',
          priceCode: selection.material.priceCode || '',
          materialCode: selection.material.materialCode || '',
          type: selection.material.type || ''
        }
        
        materialData.value[itemIndex].priceInfo = {
          priceId: priceInfo.id,
          baseDataId: materialBaseInfo.id,
          taxPrice: extractedPrice,
          quarter: confirmPriceQuarter
        }
        
        // 更新选择状态
        materialData.value[itemIndex].hasUserSelectedData = true
        materialData.value[itemIndex].selectedBaseDataId = materialBaseInfo.id
        materialData.value[itemIndex].selectedPriceId = priceInfo.id
        materialData.value[itemIndex].isUserModified = true
        
        // 设置 selectedMaterial 对象（用于单位等信息的显示）
        const newSelectedMaterial = {
          materialName: selection.material.materialName,
          specificationModel: selection.material.specificationModel,
          unit: selection.material.unit,
          type: selection.material.type,
          materialCode: selection.material.materialCode,
          matchedId: selection.material.id
        }
        materialData.value[itemIndex].selectedMaterial = newSelectedMaterial
        
        // 直接设置 unit 和 type 字段（保留兼容性）
        // 注意：不要覆盖数据行的原始unit，只在操作行需要时使用selectedMaterial.unit
        if (item.rowType === 'action') {
          // 操作行不需要直接设置unit，应通过baseInfo或selectedMaterial获取
        }
        
        // 更新选择的物资和价格数据（为了兼容其他组件的访问）
        // 确保价格是数字类型
        const newSelectedPriceQuarter = {
          taxPrice: parseFloat(confirmPrice) || 0,
          unitPrice: parseFloat(confirmUnitPrice) || 0,
          taxExcludedPrice: parseFloat(confirmTaxExcludedPrice) || 0,
          originalPrice: parseFloat(confirmOriginalPrice) || 0,
          priceType: confirmPriceType || 1,
          quarter: confirmPriceQuarter || '',
          ...priceInfo
        }
        materialData.value[itemIndex].selectedPriceQuarter = newSelectedPriceQuarter

        console.log('【数据流转-7】关键数据设置完成:')
        console.log('  confirmedPrice:', materialData.value[itemIndex].confirmedPrice)
        console.log('  selectedMaterial:', newSelectedMaterial)
        console.log('  selectedPriceQuarter:', newSelectedPriceQuarter)
        console.log('  hasUserSelectedData:', materialData.value[itemIndex].hasUserSelectedData)
        
        // 验证操作行价格能否被正确读取
        if (item.rowType === 'action') {
          console.log('【数据流转-7】验证操作行价格读取:')
          console.log('  操作行matchedType:', materialData.value[itemIndex].matchedType)
          console.log('  操作行hasUserSelectedData:', materialData.value[itemIndex].hasUserSelectedData)
          
          // 模拟 getActionRowPrice 的逻辑
          const testActionRow = materialData.value[itemIndex]
          const hasValidCondition = ((testActionRow.hasUserSelectedData && testActionRow.matchedType !== 2) || 
                                    testActionRow.matchedType === 1 || 
                                    testActionRow.matchedType === 2) && 
                                   testActionRow.selectedPriceQuarter
          console.log('  价格读取条件满足:', hasValidCondition)
          
          if (hasValidCondition) {
            const testPrice = parseFloat(testActionRow.selectedPriceQuarter.taxPrice || testActionRow.selectedPriceQuarter.unitPrice || 0)
            console.log('  能读取到的价格值:', testPrice)
          }
        }
      } else {
        console.log('【数据流转-7】错误：未找到对应的itemIndex!')
      }
    })

    // 强制触发Vue响应式更新
    materialData.value = [...materialData.value]

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

  // 如果有priceInfo，标记为已有数据（但不创建selectedPriceQuarter，因为价格对比直接从priceInfo获取）
  if (reactiveRow.priceInfo && reactiveRow.priceInfo.taxPrice) {
    reactiveRow.selectedPriceId = reactiveRow.priceInfo.priceId
    reactiveRow.hasUserSelectedData = true
  }

  // 如果有匹配选项，预选第一个
  if (reactiveRow.matchOptions && reactiveRow.matchOptions.length > 0) {
    const firstMatch = reactiveRow.matchOptions[0]
    // 设置对象引用（用于获取数据）
    reactiveRow.selectedMaterial = firstMatch
    reactiveRow.selectedMaterialId = firstMatch.matchedId

    // 【关键修复】如果当前行没有baseInfo但matchOptions有baseInfo，则设置baseInfo
    if ((!reactiveRow.baseInfo || Object.keys(reactiveRow.baseInfo).length === 0) && firstMatch.baseInfo) {
      reactiveRow.baseInfo = {
        baseDataId: firstMatch.baseInfo.baseDataId || firstMatch.matchedId,
        materialName: firstMatch.baseInfo.materialName,
        specifications: firstMatch.baseInfo.specifications,
        unit: firstMatch.baseInfo.unit,
        serialNumber: firstMatch.baseInfo.serialNumber || '',
        priceCode: firstMatch.baseInfo.priceCode || '',
        materialCode: firstMatch.baseInfo.materialCode || '',
        type: firstMatch.baseInfo.type || ''
      }
    }

    if (firstMatch.priceOptions && firstMatch.priceOptions.length > 0) {
      const firstPrice = firstMatch.priceOptions[0]
      // 只有当没有priceInfo时，才使用matchOptions的数据
      if (!reactiveRow.priceInfo || !reactiveRow.priceInfo.taxPrice) {
        reactiveRow.selectedPriceQuarter = firstPrice
        reactiveRow.selectedPriceId = firstPrice.priceId
        reactiveRow.selectedBaseDataId = firstMatch.matchedId
        
        // 相似匹配和历史匹配时自动标记为已选择数据
        if (reactiveRow.matchedType === 2 || reactiveRow.matchedType === 3) {
          reactiveRow.hasUserSelectedData = true
        }
      }
    }
  }

  // 检查是否有推荐数据，如果有则认为已有可用数据
  if (reactiveRow.recommendedBaseDataId && reactiveRow.recommendedPriceId) {
    reactiveRow.hasUserSelectedData = true
  }

  return reactiveRow
}

// 检查确认状态
const handleSaveResults = async () => {
  try {
    saving.value = true
    
    // 调用API查询未确认的数据数量
    const unconfirmedCount = await MaterialService.getUnconfirmedCount(taskId.value)
    
    if (unconfirmedCount > 0) {
      // 如果还有未确认的数据，提示用户
      await ElMessageBox.alert(
        `还有 ${unconfirmedCount} 条数据未确认，请先确认所有数据后再保存。`,
        '提示',
        {
          confirmButtonText: '知道了',
          type: 'warning'
        }
      )
    } else {
      // 所有数据都已确认，显示成功消息
      ElMessage.success('所有数据已确认，可以进行下一步操作')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('检查未确认数据失败:', error)
      const errorMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.message || '检查失败'
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

// 为子组件提供父组件方法（放在所有函数定义之后）
provide('parentMethods', {
  getPriceMatchingStatusTag,
  getBaseInfoName,
  getBaseInfoSpec,
  hasMaterialNameDifference,
  hasSpecificationDifference,
  hasUnitDifference,
  getTaxIncludedPrice,
  getTaxExcludedPrice,
  getActionRowTaxExcludedPrice,
  getTaxRate,
  getDataSourceType,
  isPriceMismatch,
  getPriceTextStyle,
  getPriceChangeIcon,
  getPriceChangeIconStyle,
  getRowClassName,
  getSequenceBarClass,
  tableSpanMethod
})
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

/* 总览卡片样式 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
  backdrop-filter: var(--theme-backdrop-blur, none);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary-light);
}

.overview-card:hover::before {
  opacity: 1;
}

.overview-card.active {
  border-color: var(--theme-primary);
  background: linear-gradient(135deg, 
    rgba(var(--theme-primary-rgb), 0.05),
    rgba(var(--theme-primary-light-rgb), 0.03)
  );
}

.overview-card.active::before {
  opacity: 1;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-right: 16px;
  font-size: 24px;
  color: var(--theme-primary);
  background: linear-gradient(135deg, 
    rgba(var(--theme-primary-rgb), 0.1),
    rgba(var(--theme-primary-light-rgb), 0.05)
  );
}

.card-content {
  flex: 1;
}

.card-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  line-height: 1;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

/* 不同类型卡片的特色样式 */
.total-card .card-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
  color: #3b82f6;
}

.matched-card .card-icon {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(134, 239, 172, 0.05));
  color: #22c55e;
}

.unmatched-card .card-icon {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05));
  color: #ef4444;
}

.price-mismatch-card .card-icon {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05));
  color: #f59e0b;
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
  padding: 12px;
  transition:
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur, none);
  vertical-align: middle;
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

/* 表格分组间距优化 - 只在组间增加间距 */
:deep(.el-table__body tr .el-table__cell) {
  border-bottom: 1px solid var(--theme-table-border) !important;
}

/* 分隔行样式 - 用于组间分隔 */
:deep(.separator-row) {
  background: transparent !important;
  height: 20px !important;
}

:deep(.separator-row td.el-table__cell) {
  background: transparent !important;
  border: none !important;
  padding: 10px 0 !important;
  height: 20px !important;
}

/* 分隔单元格样式 */
.separator-cell {
  height: 20px;
  background: transparent;
}

/* 行状态样式增强 - 更明显的分组区分度 */
:deep(.el-table .confirmed-row .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.12) 0%, 
    rgba(34, 197, 94, 0.06) 50%,
    rgba(34, 197, 94, 0.03) 100%) !important;
  border-right: 2px solid rgba(34, 197, 94, 0.2) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 
              0 1px 3px rgba(34, 197, 94, 0.1) !important;
}

:deep(.el-table .confirmed-row:hover .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.18) 0%, 
    rgba(34, 197, 94, 0.10) 50%,
    rgba(34, 197, 94, 0.05) 100%) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 
              0 4px 12px rgba(34, 197, 94, 0.2) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease !important;
  transform: scale(1.001) !important;
}

:deep(.el-table .pending-row .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(245, 158, 11, 0.10) 0%, 
    rgba(245, 158, 11, 0.05) 50%,
    rgba(245, 158, 11, 0.02) 100%) !important;
  border-right: 2px solid rgba(245, 158, 11, 0.2) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 
              0 1px 3px rgba(245, 158, 11, 0.1) !important;
}

:deep(.el-table .pending-row:hover .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(245, 158, 11, 0.15) 0%, 
    rgba(245, 158, 11, 0.08) 50%,
    rgba(245, 158, 11, 0.04) 100%) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 
              0 4px 12px rgba(245, 158, 11, 0.15) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease !important;
  transform: scale(1.001) !important;
}

/* 无匹配行样式增强 */
:deep(.el-table .no-match-row .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.12) 0%, 
    rgba(239, 68, 68, 0.06) 50%,
    rgba(239, 68, 68, 0.03) 100%) !important;
  border-right: 2px solid rgba(239, 68, 68, 0.2) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 
              0 1px 3px rgba(239, 68, 68, 0.1) !important;
  animation: pulse-glow 3s infinite ease-in-out;
}

:deep(.el-table .no-match-row:hover .el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.18) 0%, 
    rgba(239, 68, 68, 0.10) 50%,
    rgba(239, 68, 68, 0.05) 100%) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 
              0 4px 12px rgba(239, 68, 68, 0.25) !important;
  backdrop-filter: var(--theme-backdrop-blur, none);
  transition: all 0.3s ease !important;
  transform: scale(1.001) !important;
}

/* 无匹配行的脉冲动画增强 */
@keyframes pulse-glow {
  0%, 100% {
    border-left-color: #ef4444;
    border-right-color: rgba(239, 68, 68, 0.2);
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
  }
  50% {
    border-left-color: #dc2626;
    border-right-color: rgba(220, 38, 38, 0.4);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2), 
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

/* 操作行样式增强 */
:deep(.action-row) {
  background: var(--theme-card-bg) !important;
}

:deep(.action-row td.el-table__cell) {
  background: var(--theme-card-bg) !important;
  font-size: 13px;
  padding: 10px 12px;
  border-top: 1px solid rgba(var(--theme-primary-rgb), 0.1) !important;
  position: relative;
  vertical-align: middle;
}

/* 操作行继承对应data行的状态样式 */
:deep(.confirmed-row + .action-row td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.06) 0%, 
    rgba(34, 197, 94, 0.02) 100%) !important;
  border-right: 2px solid rgba(34, 197, 94, 0.15) !important;
}

:deep(.pending-row + .action-row td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(245, 158, 11, 0.06) 0%, 
    rgba(245, 158, 11, 0.02) 100%) !important;
  border-right: 2px solid rgba(245, 158, 11, 0.15) !important;
}

:deep(.no-match-row + .action-row td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.06) 0%, 
    rgba(239, 68, 68, 0.02) 100%) !important;
  border-right: 2px solid rgba(239, 68, 68, 0.15) !important;
}

:deep(.action-row:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
  transform: scale(1.001);
  transition: all 0.3s ease !important;
}

/* 增强分组整体视觉效果 */
:deep(.el-table__body tr) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 分组悬停效果 - 当悬停在某一行时，高亮整个分组 */
:deep(.el-table__body tr:hover) {
  z-index: 10 !important;
  position: relative !important;
}

/* 数据行和对应操作行的联动悬停效果 */
:deep(.el-table__body tr.confirmed-row:hover + tr.action-row td.el-table__cell),
:deep(.el-table__body tr.action-row:hover td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.08) 0%, 
    rgba(34, 197, 94, 0.04) 100%) !important;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15) !important;
}

:deep(.el-table__body tr.pending-row:hover + tr.action-row td.el-table__cell),
:deep(.el-table__body tr.pending-row + tr.action-row:hover td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(245, 158, 11, 0.08) 0%, 
    rgba(245, 158, 11, 0.04) 100%) !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12) !important;
}

:deep(.el-table__body tr.no-match-row:hover + tr.action-row td.el-table__cell),
:deep(.el-table__body tr.no-match-row + tr.action-row:hover td.el-table__cell) {
  background: linear-gradient(135deg, 
    rgba(239, 68, 68, 0.08) 0%, 
    rgba(239, 68, 68, 0.04) 100%) !important;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15) !important;
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

  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .overview-card {
    padding: 16px;
  }

  .card-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    font-size: 20px;
  }

  .card-number {
    font-size: 24px;
  }

  .card-label {
    font-size: 12px;
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

  /* 移动端分组间距调整 */
  :deep(.el-table .action-row .el-table__cell) {
    border-bottom: 12px solid var(--theme-bg-primary) !important;
  }

  :deep(.el-table .action-row .el-table__cell)::after {
    height: 1px;
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
  gap: 6px;
  justify-content: flex-end;
  min-height: 24px;
}

.price-text {
  font-weight: 600;
  color: var(--theme-success);
  font-size: 14px;
  white-space: nowrap;
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

/* 序号列容器样式 */
.sequence-number-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 序号条基础样式 */
.sequence-bar {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* 不同状态的序号条颜色 */
.sequence-bar-green {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
}

.sequence-bar-yellow {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.sequence-bar-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

/* 序号文字样式 */
.sequence-number {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 价格不匹配提示样式 */
.price-mismatch-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c;
  font-size: 12px;
  cursor: help;
}

.price-mismatch-hint .warning-icon {
  font-size: 16px;
  color: #e6a23c;
}

.price-mismatch-hint .hint-text {
  white-space: normal;
  line-height: 1.4;
  max-width: 200px;
  word-break: break-word;
}
</style>
