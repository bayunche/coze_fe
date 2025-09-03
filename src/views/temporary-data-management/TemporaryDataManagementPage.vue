<template>
  <div :class="CSS_CLASSES.PAGE_CONTAINER">
    <!-- 页面头部 -->
    <div :class="CSS_CLASSES.PAGE_HEADER">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Management /></el-icon>
          {{ PAGE_CONFIG.title }}
        </h1>
        <p class="page-subtitle">{{ PAGE_CONFIG.subtitle }}</p>
      </div>
      <div class="header-right">
        <el-button 
          :icon="ArrowLeft" 
          @click="handleBackToSmartBrain"
        >
          返回智能大脑
        </el-button>
        <el-button 
          :icon="Refresh" 
          @click="handleRefresh"
          :loading="loading"
        >
          {{ BUTTON_CONFIG.REFRESH.text }}
        </el-button>
        <el-button 
          :icon="Plus" 
          @click="handleCreateData"
          type="primary"
        >
          新增临时数据
        </el-button>
        <el-button 
          :icon="Download" 
          @click="handleExport"
          :type="BUTTON_CONFIG.EXPORT.type"
        >
          {{ BUTTON_CONFIG.EXPORT.text }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div :class="CSS_CLASSES.STATS_SECTION">
      <div 
        v-for="card in STATS_CARDS" 
        :key="card.key"
        class="stat-card clickable-card"
        :class="{ 'active': activeFilter === card.filterType }"
        :style="{ 
          '--card-color': card.color,
          '--card-bg-color': card.bgColor
        }"
        @click="handleCardClick(card)"
      >
        <div class="stat-icon">
          <el-icon :size="24">
            <component :is="iconMap[card.icon]" />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics[card.key] || 0 }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <!-- 选中状态指示器 -->
        <div v-if="activeFilter === card.filterType" class="active-indicator">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div :class="CSS_CLASSES.FILTER_SECTION">
      <div class="filter-row">
        <!-- 搜索框 -->
        <el-input
          v-model="filters.keyword"
          placeholder="搜索任务ID、物资名称、规格型号..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 任务ID筛选 -->
        <el-input
          v-model="filters.taskId"
          placeholder="输入任务ID进行筛选（空白则显示所有数据）"
          clearable
          class="filter-select"
          @input="handleFilterChange"
        >
          <template #prefix>
            <el-icon><FolderOpened /></el-icon>
          </template>
        </el-input>

        <!-- 筛选状态显示 -->
        <div class="filter-status" v-if="activeFilter">
          <el-tag type="primary" closable @close="clearFilter">
            筛选: {{ getFilterLabel(activeFilter) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 批量操作区域 -->
    <div :class="CSS_CLASSES.BATCH_ACTIONS" v-if="selectedRows.length > 0">
      <span class="selection-info">
        已选择 <strong>{{ selectedRows.length }}</strong> 条记录
      </span>
      <div class="action-buttons">
        <el-button
          :type="BUTTON_CONFIG.BATCH_PROMOTE.type"
          :icon="CircleCheck"
          @click="handleBatchPromote"
          :disabled="selectedRows.length === 0"
        >
          {{ BUTTON_CONFIG.BATCH_PROMOTE.text }}
        </el-button>
        <el-button
          :type="BUTTON_CONFIG.BATCH_DELETE.type"
          :icon="Delete"
          @click="handleBatchDelete"
          :disabled="selectedRows.length === 0"
        >
          {{ BUTTON_CONFIG.BATCH_DELETE.text }}
        </el-button>
        <el-button
          @click="clearSelection"
          :icon="Close"
        >
          清除选择
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div :class="CSS_CLASSES.TABLE_SECTION">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        stripe
        border
        highlight-current-row
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
        height="calc(100vh - 420px)"
        style="width: 100%"
        class="approval-table"
        header-row-class-name="table-header-row"
      >
        <!-- 选择列 -->
        <el-table-column
          type="selection"
          width="55"
        />

        <!-- 序号列 -->
        <el-table-column
          type="index"
          label="序号"
          width="60"
          :index="getTableIndex"
        />

        <!-- 通用信息 -->
        <el-table-column
          prop="associatedTaskId"
          label="关联任务ID"
          width="120"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="dataType"
          label="数据类型"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="DATA_TYPE_CONFIG[row.dataType]?.type || 'info'"
              size="small"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="DATA_TYPE_CONFIG[row.dataType]?.icon || 'Document'" />
              </el-icon>
              {{ DATA_TYPE_CONFIG[row.dataType]?.label || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="160"
        >
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 基础信息相关列 -->
        <el-table-column
          v-if="showBaseInfoColumns"
          prop="materialName"
          label="物资名称"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="showBaseInfoColumns"
          prop="specificationModel"
          label="规格型号"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="showBaseInfoColumns"
          prop="unit"
          label="单位"
          width="80"
          align="center"
        />
        <el-table-column
          v-if="showBaseInfoColumns"
          prop="materialCode"
          label="物资编码"
          width="120"
          show-overflow-tooltip
        />

        <!-- 价格信息相关列 -->
        <el-table-column
          v-if="showPriceColumns"
          prop="baseInfoId"
          label="基础信息ID"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="showPriceColumns"
          prop="quarter"
          label="季度"
          width="120"
        />
        <el-table-column
          v-if="showPriceColumns"
          prop="taxPrice"
          label="含税价"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            {{ formatAmount(row.taxPrice) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="showPriceColumns"
          prop="taxExcludedPrice"
          label="不含税价"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            {{ formatAmount(row.taxExcludedPrice) }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="showPriceColumns"
          prop="priceUnit"
          label="价格单位"
          width="100"
        />

        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                :type="BUTTON_CONFIG.PROMOTE.type"
                :size="BUTTON_CONFIG.PROMOTE.size"
                @click="handlePromote(row)"
              >
                {{ BUTTON_CONFIG.PROMOTE.text }}
              </el-button>
              <el-button
                :type="BUTTON_CONFIG.DELETE.type"
                :size="BUTTON_CONFIG.DELETE.size"
                @click="handleDelete(row)"
              >
                {{ BUTTON_CONFIG.DELETE.text }}
              </el-button>
              <el-button
                :type="BUTTON_CONFIG.DETAIL.type"
                :size="BUTTON_CONFIG.DETAIL.size"
                :link="BUTTON_CONFIG.DETAIL.link"
                @click="handleViewDetail(row)"
              >
                {{ BUTTON_CONFIG.DETAIL.text }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="PAGINATION_CONFIG.pageSizes"
        :layout="PAGINATION_CONFIG.layout"
        :total="pagination.total"
        :background="PAGINATION_CONFIG.background"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </div>

    <!-- 审批详情弹窗 -->
    <ApprovalDetailDialog
      v-model="showDetailDialog"
      :data="currentDetailData"
      @refresh="fetchData"
    />
    
    <!-- 创建临时数据弹窗（带Tab） -->
    <CreateDataDialog
      v-model="showCreateDataDialog"
      :task-id="currentTaskId"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Refresh,
  Download,
  Search,
  CircleCheck,
  Close,
  Management,
  Plus,
  Delete,
  FolderOpened,
  Check,
  DataAnalysis,
  Box,
  Money,
  Clock,
  ArrowLeft
} from '@element-plus/icons-vue'

// 导入常量和工具
import {
  PAGE_CONFIG,
  DATA_TYPE,
  DATA_TYPE_CONFIG,
  PAGINATION_CONFIG,
  BUTTON_CONFIG,
  MESSAGE_CONFIG,
  STATS_CARDS,
  CSS_CLASSES
} from './constants'

import {
  formatDateTime,
  formatAmount,
  confirmPromote,
  confirmDelete,
  exportToExcel,
  formatTemporaryData,
  filterTemporaryData,
  calculateTemporaryDataStatistics
} from './utils'

// 导入子组件
import ApprovalDetailDialog from './components/ApprovalDetailDialog.vue'
import CreateDataDialog from './components/CreateDataDialog.vue'

// 导入服务
import temporaryDataService from '@/services/TemporaryDataService'

// 路由实例
const router = useRouter()

// 响应式数据
const loading = ref(false)
const tableRef = ref()
const tableData = ref([])
const allData = ref([])
const selectedRows = ref([])
const statistics = ref({
  total: 0,
  baseInfoCount: 0,
  priceCount: 0,
  pendingCount: 0
})

// 筛选条件
const filters = ref({
  keyword: '',
  taskId: '',
  dateRange: null
})

// 当前激活的筛选类型
const activeFilter = ref('')

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.defaultPageSize,
  total: 0
})

// 弹窗控制
const showDetailDialog = ref(false)
const currentDetailData = ref(null)
const showCreateDataDialog = ref(false)
const currentTaskId = ref('')

// 搜索防抖
let searchTimer = null

// 图标映射（用于动态组件渲染）
const iconMap = {
  DataAnalysis,
  Box,
  Money,
  Clock
}

// 计算属性 - 根据筛选类型显示不同的列
const showBaseInfoColumns = computed(() => {
  return activeFilter.value === '' || activeFilter.value === DATA_TYPE.BASE_INFO
})

const showPriceColumns = computed(() => {
  return activeFilter.value === '' || activeFilter.value === DATA_TYPE.PRICE
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const queryParams = {
      page: pagination.value.currentPage - 1,
      size: pagination.value.pageSize
    }
    
    // 如果有 taskId 则传入进行筛选
    if (filters.value.taskId && filters.value.taskId.trim()) {
      queryParams.taskId = filters.value.taskId.trim()
    }
    
    // 如果有筛选类型，添加到查询参数
    if (activeFilter.value) {
      queryParams.dataType = activeFilter.value
    }

    const response = await temporaryDataService.queryTemporaryData(queryParams)

    // 处理返回的数据
    const allItems = []
    
    // 添加基础信息数据
    if (response.data?.temporaryBaseInfos) {
      response.data.temporaryBaseInfos.forEach(item => {
        allItems.push(formatTemporaryData(item, DATA_TYPE.BASE_INFO))
      })
    }
    
    // 添加价格信息数据
    if (response.data?.temporaryPrices) {
      response.data.temporaryPrices.forEach(item => {
        allItems.push(formatTemporaryData(item, DATA_TYPE.PRICE))
      })
    }

    // 应用前端筛选（关键词搜索等）
    const filteredData = filterTemporaryData(allItems, filters.value)
    allData.value = filteredData
    
    // 计算统计数据
    statistics.value = calculateTemporaryDataStatistics(filteredData)
    
    // 分页处理
    pagination.value.total = filteredData.length
    const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
    const end = start + pagination.value.pageSize
    tableData.value = filteredData.slice(start, end)
    
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error(MESSAGE_CONFIG.LOAD_ERROR)
    // 错误时清空数据
    allData.value = []
    tableData.value = []
    statistics.value = { total: 0, baseInfoCount: 0, priceCount: 0, pendingCount: 0 }
  } finally {
    loading.value = false
  }
}

// 返回智能大脑页面
const handleBackToSmartBrain = () => {
  router.push('/smart-brain')
}

// 刷新数据
const handleRefresh = () => {
  fetchData()
}

// 导出数据
const handleExport = async () => {
  await exportToExcel(allData.value, `临时数据记录_${formatDateTime(new Date())}`)
}

// 创建临时数据（统一入口）
const handleCreateData = () => {
  currentTaskId.value = filters.value.taskId || ''
  showCreateDataDialog.value = true
}

// 处理卡片点击筛选
const handleCardClick = (card) => {
  // 如果点击的是已选中的卡片，则取消筛选
  if (activeFilter.value === card.filterType) {
    activeFilter.value = ''
  } else {
    activeFilter.value = card.filterType
  }
  
  // 重新获取数据
  pagination.value.currentPage = 1
  fetchData()
}

// 清除筛选
const clearFilter = () => {
  activeFilter.value = ''
  pagination.value.currentPage = 1
  fetchData()
}

// 获取筛选标签
const getFilterLabel = (filterType) => {
  const card = STATS_CARDS.find(c => c.filterType === filterType)
  return card ? card.label : '全部'
}

// 创建成功回调
const handleCreateSuccess = () => {
  fetchData() // 刷新数据
}

// 搜索处理
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.currentPage = 1
    fetchData()
  }, 300)
}

// 筛选变化
const handleFilterChange = () => {
  pagination.value.currentPage = 1
  fetchData()
}

// 分页处理
const handlePageChange = () => {
  fetchData()
}

const handlePageSizeChange = () => {
  pagination.value.currentPage = 1
  fetchData()
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 清除选择
const clearSelection = () => {
  tableRef.value?.clearSelection()
  selectedRows.value = []
}

// 获取表格索引
const getTableIndex = (index) => {
  return (pagination.value.currentPage - 1) * pagination.value.pageSize + index + 1
}

// 获取行样式类名
const getRowClassName = ({ row }) => {
  if (row.dataType === DATA_TYPE.BASE_INFO) {
    return 'base-info-row'
  } else if (row.dataType === DATA_TYPE.PRICE) {
    return 'price-info-row'
  }
  return ''
}

// 单条转正
const handlePromote = async (row) => {
  const result = await confirmPromote(row)
  if (result.confirmed) {
    try {
      const promoteParams = {}
      
      if (row.dataType === DATA_TYPE.BASE_INFO) {
        promoteParams.baseInfoIdsToPromote = [row.id]
        promoteParams.priceIdsToPromote = []
      } else if (row.dataType === DATA_TYPE.PRICE) {
        promoteParams.baseInfoIdsToPromote = []
        promoteParams.priceIdsToPromote = [row.id]
      }
      
      await temporaryDataService.promoteTemporaryData(promoteParams)
      
      ElMessage.success(MESSAGE_CONFIG.PROMOTE_SUCCESS)
      fetchData()
    } catch (error) {
      console.error('转正失败:', error)
    }
  }
}

// 单条删除
const handleDelete = async (row) => {
  const result = await confirmDelete(row)
  if (result.confirmed) {
    try {
      const deleteParams = {}
      
      if (row.dataType === DATA_TYPE.BASE_INFO) {
        deleteParams.baseInfoIds = [row.id]
        deleteParams.priceIds = []
      } else if (row.dataType === DATA_TYPE.PRICE) {
        deleteParams.baseInfoIds = []
        deleteParams.priceIds = [row.id]
      }
      
      await temporaryDataService.deleteTemporaryData(deleteParams)
      
      ElMessage.success(MESSAGE_CONFIG.DELETE_SUCCESS)
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

// 批量转正
const handleBatchPromote = async () => {
  const result = await confirmPromote(selectedRows.value)
  if (result.confirmed) {
    try {
      const baseInfoIds = []
      const priceIds = []
      
      selectedRows.value.forEach(row => {
        if (row.dataType === DATA_TYPE.BASE_INFO) {
          baseInfoIds.push(row.id)
        } else if (row.dataType === DATA_TYPE.PRICE) {
          priceIds.push(row.id)
        }
      })
      
      await temporaryDataService.promoteTemporaryData({
        baseInfoIdsToPromote: baseInfoIds,
        priceIdsToPromote: priceIds
      })
      
      ElMessage.success(MESSAGE_CONFIG.BATCH_PROMOTE_SUCCESS)
      clearSelection()
      fetchData()
    } catch (error) {
      console.error('批量转正失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  const result = await confirmDelete(selectedRows.value)
  if (result.confirmed) {
    try {
      const baseInfoIds = []
      const priceIds = []
      
      selectedRows.value.forEach(row => {
        if (row.dataType === DATA_TYPE.BASE_INFO) {
          baseInfoIds.push(row.id)
        } else if (row.dataType === DATA_TYPE.PRICE) {
          priceIds.push(row.id)
        }
      })
      
      await temporaryDataService.deleteTemporaryData({
        baseInfoIds,
        priceIds
      })
      
      ElMessage.success(MESSAGE_CONFIG.BATCH_DELETE_SUCCESS)
      clearSelection()
      fetchData()
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }
}

// 查看详情
const handleViewDetail = (row) => {
  currentDetailData.value = row
  showDetailDialog.value = true
}

// 页面初始化
onMounted(() => {
  // 页面加载时自动查询所有临时数据
  fetchData()
})
</script>

<style scoped>
.temporary-data-management-page {
  padding: 24px;
  background-color: var(--theme-bg-secondary);
  min-height: 100vh;
  color: var(--theme-text-primary);
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--theme-border-primary);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.title-icon {
  color: var(--theme-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--theme-card-bg);
  border-radius: 8px;
  border: 1px solid var(--theme-border-secondary);
  transition: all 0.3s ease;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-md);
}

.stat-card.clickable-card {
  cursor: pointer;
  user-select: none;
}

.stat-card.clickable-card:hover {
  border-color: var(--theme-primary);
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.15);
}

.stat-card.active {
  border-color: var(--theme-primary);
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.08), rgba(var(--theme-primary-rgb), 0.05));
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.2);
}

.active-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--theme-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.filter-status {
  display: flex;
  align-items: center;
  margin-left: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--card-bg-color);
  color: var(--card-color);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--theme-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--theme-card-bg);
  border-radius: 8px;
  border: 1px solid var(--theme-border-secondary);
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 150px;
}

.date-picker {
  width: 280px;
}

/* 批量操作 */
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--theme-card-bg);
  border-radius: 8px;
  border: 1px solid var(--theme-primary);
  border-left: 4px solid var(--theme-primary);
}

.selection-info {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.selection-info strong {
  color: var(--theme-primary);
  font-size: 16px;
  margin: 0 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 表格区域 */
.table-section {
  background: var(--theme-card-bg);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--theme-border-secondary);
  box-shadow: var(--theme-shadow-sm);
  transition: box-shadow 0.3s ease;
}

.table-section:hover {
  box-shadow: var(--theme-shadow-md);
}

/* 表格优化样式 */
.approval-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--theme-shadow-sm);
}

/* 表格头部样式 */
:deep(.approval-table .el-table__header-wrapper) {
  background: var(--theme-table-header-bg);
}

:deep(.approval-table .table-header-row) {
  background: var(--theme-table-header-bg) !important;
}

:deep(.approval-table .el-table__header th) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 8px;
  border-color: var(--theme-table-border) !important;
}

:deep(.approval-table .el-table__header th:first-child) {
  padding-left: 16px;
}

:deep(.approval-table .el-table__header th:last-child) {
  padding-right: 16px;
}

/* 表格主体样式 */
:deep(.approval-table .el-table__body-wrapper) {
  background: var(--theme-bg-primary);
}

:deep(.approval-table .el-table__row) {
  background: var(--theme-bg-primary) !important;
  border-color: var(--theme-table-border) !important;
  transition: all 0.3s ease;
}

:deep(.approval-table .el-table__row:hover) {
  background: var(--theme-table-hover-bg) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.approval-table .el-table__row.el-table__row--striped) {
  background: var(--theme-table-stripe-bg) !important;
}

:deep(.approval-table .el-table__row.el-table__row--striped:hover) {
  background: var(--theme-table-hover-bg) !important;
}

:deep(.approval-table td) {
  padding: 14px 8px !important;
  border-color: var(--theme-table-border) !important;
  color: var(--theme-text-primary);
  font-size: 14px;
  line-height: 1.4;
}

:deep(.approval-table td:first-child) {
  padding-left: 16px !important;
}

:deep(.approval-table td:last-child) {
  padding-right: 16px !important;
}

/* 表格行样式 */
:deep(.base-info-row) {
  background-color: rgba(59, 130, 246, 0.08) !important;
  border-left: 3px solid #3b82f6;
}

:deep(.base-info-row:hover) {
  background-color: rgba(59, 130, 246, 0.15) !important;
}

:deep(.price-info-row) {
  background-color: rgba(16, 185, 129, 0.08) !important;
  border-left: 3px solid #10b981;
}

:deep(.price-info-row:hover) {
  background-color: rgba(16, 185, 129, 0.15) !important;
}

/* 选择框样式优化 */
:deep(.approval-table .el-table__column--selection .el-checkbox) {
  zoom: 1.1;
}

:deep(.approval-table .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--theme-primary);
  border-color: var(--theme-primary);
}

/* Tag 样式优化 */
:deep(.approval-table .el-tag) {
  font-weight: 500;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 专门针对状态Tag的内容布局 */
:deep(.approval-table .status-tag .tag-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  line-height: 1;
}

:deep(.approval-table .status-tag .status-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}

:deep(.approval-table .status-tag .status-text) {
  display: flex;
  align-items: center;
  line-height: 1;
}

:deep(.approval-table .el-tag--success) {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

:deep(.approval-table .el-tag--warning) {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

:deep(.approval-table .el-tag--danger) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

:deep(.approval-table .el-tag--primary) {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

:deep(.approval-table .el-tag--info) {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* 按钮样式优化 */
:deep(.approval-table .el-button) {
  margin: 0 4px;
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.approval-table .el-button--small) {
  padding: 6px 10px;
}

:deep(.approval-table .el-button--primary.is-link) {
  color: var(--theme-primary);
}

:deep(.approval-table .el-button--primary.is-link:hover) {
  color: var(--theme-primary-hover);
  background: rgba(59, 130, 246, 0.05);
}

:deep(.approval-table .el-button--success) {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

:deep(.approval-table .el-button--success:hover) {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

:deep(.approval-table .el-button--danger) {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

:deep(.approval-table .el-button--danger:hover) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

/* 空状态样式 */
:deep(.approval-table .el-table__empty-block) {
  padding: 60px 0;
  background: var(--theme-bg-primary);
}

:deep(.approval-table .el-table__empty-text) {
  color: var(--theme-text-secondary);
  font-size: 16px;
}

/* 进度条样式优化 */
:deep(.approval-table .el-progress) {
  width: 60px !important;
}

:deep(.approval-table .el-progress-bar) {
  height: 8px !important;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

:deep(.approval-table .el-progress-bar__outer) {
  background: rgba(0, 0, 0, 0.1) !important;
  border-radius: 4px;
}

:deep(.approval-table .el-progress-bar__inner) {
  border-radius: 4px;
  transition: all 0.3s ease;
}

:deep(.approval-table .el-progress__text) {
  font-size: 11px !important;
  font-weight: 600;
  margin-left: 8px;
}

/* 分数样式 */
.score-high {
  color: var(--theme-success);
  font-weight: 600;
}

.score-medium {
  color: var(--theme-warning);
  font-weight: 500;
}

.score-low {
  color: var(--theme-error);
  font-weight: 500;
}

/* 表格数字格式优化 */
:deep(.approval-table td[align="right"]) {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-weight: 600;
  color: var(--theme-text-primary);
}

/* Loading状态优化 */
:deep(.approval-table .el-loading-mask) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

:deep(.approval-table .el-loading-spinner) {
  font-size: 32px;
  color: var(--theme-primary);
}

/* 状态图标 */
.status-icon {
  margin-right: 4px;
  vertical-align: middle;
}

/* Tag内图标优化 */
:deep(.approval-table .el-tag .status-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 12px;
  line-height: 1;
  vertical-align: middle;
}

/* 修复Element Plus Tag内部结构的对齐问题 */
:deep(.approval-table .el-tag .el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 1;
}

:deep(.approval-table .el-tag .el-icon svg) {
  vertical-align: middle;
}

/* 分页 */
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select,
  .date-picker {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
}

/* 主题适配 */
[data-theme='dark'] .temporary-data-management-page {
  background-color: var(--theme-bg-secondary);
}

[data-theme='dark'] .stat-card,
[data-theme='dark'] .filter-section,
[data-theme='dark'] .batch-actions,
[data-theme='dark'] .table-section {
  background: var(--theme-card-bg);
  border-color: var(--theme-border-primary);
}
</style>