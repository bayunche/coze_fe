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
          <h1 class="page-title">{{ PAGE_CONFIG.title }}</h1>
          <p class="page-subtitle">{{ PAGE_CONFIG.subtitle }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button 
          @click="handleRefresh" 
          :icon="Refresh" 
          type="default"
          :loading="refreshLoading"
        >
          {{ BUTTON_CONFIG.REFRESH.text }}
        </el-button>
        <el-button 
          @click="handleExport" 
          :icon="Download" 
          type="default"
          :loading="exportLoading"
        >
          {{ BUTTON_CONFIG.EXPORT.text }}
        </el-button>
        <el-button 
          @click="handleGoToDetail" 
          :icon="View" 
          type="primary"
        >
          {{ BUTTON_CONFIG.TO_DETAIL.text }}
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div :class="CSS_CLASSES.PAGE_CONTENT" v-loading="pageLoading">
      <!-- 统计信息面板 -->
      <div :class="CSS_CLASSES.STATISTICS_SECTION">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📊</span>
            统计信息
          </h2>
        </div>
        <div class="statistics-cards">
          <div 
            v-for="(config, key) in STATISTICS_CONFIG" 
            :key="key"
            class="stat-card"
            :style="{ borderColor: config.color }"
          >
            <div class="stat-icon" :style="{ color: config.color }">
              {{ config.icon }}
            </div>
            <div class="stat-content">
              <div class="stat-value" :style="{ color: config.color }">
                {{ statistics[config.key] || 0 }}
              </div>
              <div class="stat-label">{{ config.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选工具栏 -->
      <div :class="CSS_CLASSES.TOOLBAR_SECTION">
        <div class="toolbar-left">
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
        
        <div class="toolbar-center">
          <el-select
            v-model="queryParams.confirmResult"
            placeholder="确认状态"
            clearable
            @change="handleFilterChange"
            class="filter-select"
          >
            <el-option 
              v-for="option in FILTER_OPTIONS.CONFIRM_STATUS"
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
          
          <el-select
            v-model="queryParams.matchedType"
            placeholder="匹配类型"
            clearable
            @change="handleFilterChange"
            class="filter-select"
          >
            <el-option 
              v-for="option in FILTER_OPTIONS.MATCH_TYPE"
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </div>

        <div class="toolbar-right">
          <span class="total-info">
            共 {{ total }} 条记录，已确认 {{ confirmedCount }} 条，待确认 {{ pendingCount }} 条
          </span>
        </div>
      </div>

      <!-- 批量操作区域 -->
      <div :class="CSS_CLASSES.BATCH_ACTIONS">
        <div class="batch-actions-left">
          <el-button 
            type="success" 
            :icon="Check"
            :loading="batchConfirmingSelected"
            :disabled="selectedRows.length === 0"
            @click="handleBatchConfirmSelected"
            size="small"
          >
            {{ BUTTON_CONFIG.BATCH_CONFIRM.text }} ({{ selectedRows.length }})
          </el-button>
          <el-button 
            type="primary" 
            :icon="CircleCheck"
            :loading="batchConfirmingAll"
            :disabled="pendingCount === 0"
            @click="handleBatchConfirmAll"
            size="small"
          >
            {{ BUTTON_CONFIG.BATCH_CONFIRM_ALL.text }}
          </el-button>
        </div>
        <div class="batch-actions-right">
          <el-text type="info" size="small">
            提示：可以通过表格左侧的复选框选择多条记录进行批量操作
          </el-text>
        </div>
      </div>

      <!-- 确认数据表格 -->
      <div :class="CSS_CLASSES.TABLE_SECTION">
        <el-table 
          ref="tableRef"
          :data="filteredTableData" 
          v-loading="tableLoading"
          style="width: 100%" 
          border
          stripe
          max-height="60vh"
          :row-class-name="getRowClassName"
        >
          <!-- 表格列配置 - 与现有组件保持一致 -->
          <el-table-column 
            v-for="column in TABLE_COLUMNS"
            :key="column.prop || column.label"
            v-bind="column"
          >
            <!-- 物资名称列 -->
            <template v-if="column.prop === 'material_name'" #default="{ row }">
              <span>{{ row.material_name }}</span>
            </template>
            
            <!-- 规格型号列 -->
            <template v-else-if="column.prop === 'material_specification'" #default="{ row }">
              <span>{{ row.material_specification }}</span>
            </template>
            
            <!-- 单位列 -->
            <template v-else-if="column.prop === 'material_unit'" #default="{ row }">
              <span>{{ row.material_unit }}</span>
            </template>
            
            <!-- 数量列 -->
            <template v-else-if="column.prop === 'material_quantity'" #default="{ row }">
              <span>{{ formatNumber(row.material_quantity) }}</span>
            </template>
            
            <!-- 匹配基础数据列 -->
            <template v-else-if="column.label === '匹配基础数据'" #default="{ row }">
              <div class="recommend-info">
                <p class="material-name">{{ getBaseInfoName(row) }}</p>
                <p class="material-spec">{{ getBaseInfoSpec(row) }}</p>
              </div>
            </template>
            
            <!-- 价格信息列 -->
            <template v-else-if="column.label === '价格信息'" #default="{ row }">
              <div class="price-info">
                <span class="price-text">{{ getPriceText(row) }}</span>
                <div class="price-quarter">{{ getPriceQuarter(row) }}</div>
              </div>
            </template>
            
            <!-- 匹配类型列 -->
            <template v-else-if="column.label === '匹配类型'" #default="{ row }">
              <el-tag 
                :type="getMatchTypeConfig(row.match_type).type"
                size="small"
              >
                {{ getMatchTypeConfig(row.match_type).text }}
              </el-tag>
            </template>
            
            <!-- 确认状态列 -->
            <template v-else-if="column.label === '确认状态'" #default="{ row }">
              <el-tag 
                :type="getConfirmStatusConfig(row.confirm_status).type"
                size="small"
              >
                {{ getConfirmStatusConfig(row.confirm_status).text }}
              </el-tag>
            </template>
            
            <!-- 操作列 -->
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small"
                  :disabled="row.confirm_status === 1"
                  @click="handleSingleConfirm(row)"
                  :loading="row.confirming"
                >
                  {{ row.confirm_status === 1 ? '已确认' : '确认' }}
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="handleViewOptions(row)"
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { 
  ArrowLeft, 
  Refresh, 
  Download, 
  View,
  Search,
  Check,
  CircleCheck
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 导入常量和工具函数
import {
  PAGE_CONFIG,
  TABLE_COLUMNS,
  BUTTON_CONFIG,
  PAGINATION_CONFIG,
  FILTER_OPTIONS,
  STATISTICS_CONFIG,
  CSS_CLASSES,
  MESSAGE_CONFIG,
  DEFAULT_QUERY_PARAMS
} from './constants.js'

import {
  queryConfirmData,
  getStatistics,
  singleConfirm,
  batchConfirm,
  batchConfirmAll,
  exportConfirmData,
  getMatchTypeConfig,
  getConfirmStatusConfig,
  filterDataByKeyword,
  calculateStatistics,
  useNavigation
} from './utils.js'

// 路由参数
const route = useRoute()
const taskId = computed(() => route.params.taskId)

// 导航函数
const { goBack, goToDetail } = useNavigation()

// 响应式数据
const pageLoading = ref(false)
const tableLoading = ref(false)
const refreshLoading = ref(false)
const exportLoading = ref(false)
const batchConfirmingSelected = ref(false)
const batchConfirmingAll = ref(false)

const tableData = ref([])
const selectedRows = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(PAGINATION_CONFIG.default_page_size)

// 查询参数
const queryParams = reactive({...DEFAULT_QUERY_PARAMS})

// 搜索相关
const searchKeyword = ref('')
const filteredTableData = computed(() => {
  return filterDataByKeyword(tableData.value, searchKeyword.value)
})

// 统计信息
const statistics = ref({
  totalCount: 0,
  confirmedCount: 0,
  unconfirmedCount: 0,
  exactMatchCount: 0,
  noMatchCount: 0
})

// 计算已确认和待确认数量
const confirmedCount = computed(() => 
  tableData.value.filter(item => item.confirm_status === 1).length
)
const pendingCount = computed(() => 
  tableData.value.filter(item => item.confirm_status === 0).length
)

// 表格引用
const tableRef = ref()

/**
 * 加载确认数据
 */
const loadConfirmData = async (page = currentPage.value, size = pageSize.value) => {
  if (!taskId.value) {
    ElMessage.error('缺少必要的任务参数')
    return
  }

  tableLoading.value = true
  
  try {
    const params = {
      ...queryParams,
      pageNum: page,
      pageSize: size
    }
    
    const { tableData: data, total: totalCount } = await queryConfirmData(taskId.value, params)
    
    // 为每行数据添加loading状态
    tableData.value = data.map(item => ({ ...item, confirming: false }))
    total.value = totalCount
    
    // 更新统计信息
    const localStats = calculateStatistics(tableData.value)
    statistics.value = { ...statistics.value, ...localStats }
    
    if (data.length > 0) {
      ElMessage.success(MESSAGE_CONFIG.LOAD_SUCCESS)
    }
  } catch (error) {
    console.error('【错误】加载确认数据失败:', error)
  } finally {
    tableLoading.value = false
  }
}

/**
 * 加载统计信息
 */
const loadStatistics = async () => {
  if (!taskId.value) return
  
  try {
    const stats = await getStatistics(taskId.value)
    statistics.value = stats
  } catch (error) {
    console.error('【错误】加载统计信息失败:', error)
  }
}

/**
 * 处理页码变化
 */
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  loadConfirmData(newPage, pageSize.value)
}

/**
 * 处理页大小变化
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadConfirmData(1, newSize)
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  console.log('【诊断】搜索关键词:', searchKeyword.value)
}

/**
 * 处理搜索清空
 */
const handleSearchClear = () => {
  searchKeyword.value = ''
}

/**
 * 处理筛选变化
 */
const handleFilterChange = () => {
  console.log('【诊断】筛选参数变化:', queryParams)
  currentPage.value = 1
  loadConfirmData()
}


/**
 * 处理返回
 */
const handleGoBack = () => {
  goBack()
}

/**
 * 处理刷新
 */
const handleRefresh = async () => {
  refreshLoading.value = true
  
  try {
    await Promise.all([
      loadConfirmData(),
      loadStatistics()
    ])
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    refreshLoading.value = false
  }
}

/**
 * 处理导出
 */
const handleExport = async () => {
  exportLoading.value = true
  
  try {
    const filename = `乙供物资确认数据_${taskId.value}`
    await exportConfirmData(taskId.value, queryParams, filename)
  } catch (error) {
    console.error('【错误】导出失败:', error)
  } finally {
    exportLoading.value = false
  }
}

/**
 * 处理跳转到详情页面
 */
const handleGoToDetail = () => {
  // 这里需要确定detailId，可能需要从任务信息中获取
  // 暂时使用taskId作为detailId
  goToDetail(taskId.value, taskId.value)
}

/**
 * 处理单个确认
 */
const handleSingleConfirm = async (row, confirmStatus) => {
  row.confirming = true
  
  try {
    const success = await singleConfirm(row.id, confirmStatus)
    if (success) {
      row.confirm_status = confirmStatus
      // 更新统计信息
      const localStats = calculateStatistics(tableData.value)
      statistics.value = { ...statistics.value, ...localStats }
    }
  } catch (error) {
    console.error('【错误】单个确认失败:', error)
  } finally {
    row.confirming = false
  }
}

/**
 * 处理批量确认选中
 */
const handleBatchConfirmSelected = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return
  }
  
  batchConfirmingSelected.value = true
  
  try {
    const ids = selectedRows.value.map(row => row.id)
    const success = await batchConfirm(ids, 1)
    
    if (success) {
      // 更新选中行的状态
      selectedRows.value.forEach(row => {
        row.confirm_status = 1
      })
      
      // 清空选中状态
      tableRef.value.clearSelection()
      selectedRows.value = []
      
      // 更新统计信息
      const localStats = calculateStatistics(tableData.value)
      statistics.value = { ...statistics.value, ...localStats }
    }
  } catch (error) {
    console.error('【错误】批量确认选中失败:', error)
  } finally {
    batchConfirmingSelected.value = false
  }
}

/**
 * 处理批量确认全部
 */
const handleBatchConfirmAll = async () => {
  batchConfirmingAll.value = true
  
  try {
    const success = await batchConfirmAll(taskId.value)
    
    if (success) {
      // 重新加载数据以获取最新状态
      await loadConfirmData()
      await loadStatistics()
    }
  } catch (error) {
    console.error('【错误】批量确认全部失败:', error)
  } finally {
    batchConfirmingAll.value = false
  }
}

// 页面初始化时加载数据
onMounted(() => {
  pageLoading.value = true
  
  Promise.all([
    loadConfirmData(),
    loadStatistics()
  ]).finally(() => {
    pageLoading.value = false
  })
})

// 监听路由参数变化
watch(
  taskId,
  (newTaskId, oldTaskId) => {
    if (newTaskId !== oldTaskId && newTaskId) {
      currentPage.value = 1
      pageSize.value = PAGINATION_CONFIG.default_page_size
      Object.assign(queryParams, DEFAULT_QUERY_PARAMS)
      loadConfirmData()
      loadStatistics()
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.supplier-material-confirm-page {
  min-height: 100vh;
  background: var(--el-bg-color-page);
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
  color: var(--el-text-color-regular);
  transition: all 0.3s ease;
}

.back-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.title-section h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-section p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.header-right {
  display: flex;
  gap: 12px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.statistics-section,
.toolbar-section,
.batch-actions,
.table-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-icon {
  font-size: 20px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid transparent;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.stat-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--el-bg-color);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
}

.toolbar-left {
  flex: 0 0 auto;
}

.toolbar-center {
  display: flex;
  gap: 12px;
  flex: 0 0 auto;
}

.toolbar-right {
  flex: 1;
  text-align: right;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 150px;
}

.total-info {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.batch-actions-left {
  display: flex;
  gap: 12px;
}

.batch-actions-right {
  flex: 1;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

/* 表格行样式 - 与现有组件保持一致 */
.recommend-info {
  margin: 0;
}

.recommend-info .material-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.recommend-info .material-spec {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.price-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-price-color, #b45309);
}

.price-quarter {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 4px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  --el-table-border-color: var(--el-border-color-lighter);
}

:deep(.el-table th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 600;
}

:deep(.el-table .el-table__row:hover > td) {
  background-color: var(--el-table-row-hover-bg-color);
}

:deep(.el-table .el-table__row.row-confirmed) {
  background-color: var(--el-color-success-light-9);
}

:deep(.el-table .el-table__row.row-unconfirmed) {
  background-color: var(--el-color-warning-light-9);
}

:deep(.el-pagination) {
  justify-content: flex-end;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next),
:deep(.el-pagination .el-pager li) {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
}

:deep(.el-card) {
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supplier-material-confirm-page {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .statistics-cards {
    grid-template-columns: 1fr;
  }
  
  .toolbar-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .toolbar-center {
    justify-content: center;
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .batch-actions-right {
    text-align: center;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>