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
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="data-tabs">
        <el-tab-pane label="基础信息管理" name="baseInfo">
          <template #label>
            <span>
              <el-icon style="margin-right: 4px;"><Box /></el-icon>
              基础信息管理
            </span>
          </template>
          
          <!-- 基础信息表格 -->
          <el-table
            ref="baseInfoTableRef"
            :data="baseInfoTableData"
            v-loading="loading"
            stripe
            border
            highlight-current-row
            @selection-change="handleBaseInfoSelectionChange"
            :row-class-name="getRowClassName"
            height="calc(100vh - 500px)"
            style="width: 100%"
            class="approval-table base-info-table"
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
        >
          <template #default="{ row }">
            {{ row.associatedTaskId || '-' }}
          </template>
        </el-table-column>
        
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
          prop="materialName"
          label="物资名称"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.materialName || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="specificationModel"
          label="规格型号"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.specificationModel || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="unit"
          label="单位"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            {{ row.unit || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="materialCode"
          label="物资编码"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.materialCode || '-' }}
          </template>
        </el-table-column>

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

          <!-- 基础信息分页 -->
          <el-pagination
            v-model:current-page="baseInfoPagination.currentPage"
            v-model:page-size="baseInfoPagination.pageSize"
            :page-sizes="PAGINATION_CONFIG.pageSizes"
            :layout="PAGINATION_CONFIG.layout"
            :total="baseInfoPagination.total"
            :background="PAGINATION_CONFIG.background"
            @size-change="handleBaseInfoPageSizeChange"
            @current-change="handleBaseInfoPageChange"
            class="pagination"
          />
        </el-tab-pane>

        <el-tab-pane label="价格信息管理" name="price">
          <template #label>
            <span>
              <el-icon style="margin-right: 4px;"><Money /></el-icon>
              价格信息管理
            </span>
          </template>
          
          <!-- 价格信息表格 -->
          <el-table
            ref="priceTableRef"
            :data="priceTableData"
            v-loading="loading"
            stripe
            border
            highlight-current-row
            @selection-change="handlePriceSelectionChange"
            :row-class-name="getRowClassName"
            height="calc(100vh - 500px)"
            style="width: 100%"
            class="approval-table price-table"
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
              :index="getPriceTableIndex"
            />

            <!-- 通用信息 -->
            <el-table-column
              prop="associatedTaskId"
              label="关联任务ID"
              width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.associatedTaskId || '-' }}
              </template>
            </el-table-column>
            
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

            <!-- 基础物资信息（从baseInfoId获取）-->
            <el-table-column
              prop="materialName"
              label="物资名称"
              min-width="180"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.materialName || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="specificationModel"
              label="规格型号"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.specificationModel || '-' }}
              </template>
            </el-table-column>

            <!-- 价格信息相关列 -->
            <el-table-column
              prop="baseInfoId"
              label="基础信息ID"
              width="120"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ row.baseInfoId || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="quarter"
              label="季度"
              width="120"
            >
              <template #default="{ row }">
                {{ row.quarter || '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="taxPrice"
              label="含税价"
              width="100"
              align="right"
            >
              <template #default="{ row }">
                {{ row.taxPrice != null ? formatAmount(row.taxPrice) : '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="taxExcludedPrice"
              label="不含税价"
              width="100"
              align="right"
            >
              <template #default="{ row }">
                {{ row.taxExcludedPrice != null ? formatAmount(row.taxExcludedPrice) : '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="priceUnit"
              label="价格单位"
              width="100"
            >
              <template #default="{ row }">
                {{ row.priceUnit || '-' }}
              </template>
            </el-table-column>

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

          <!-- 价格信息分页 -->
          <el-pagination
            v-model:current-page="pricePagination.currentPage"
            v-model:page-size="pricePagination.pageSize"
            :page-sizes="PAGINATION_CONFIG.pageSizes"
            :layout="PAGINATION_CONFIG.layout"
            :total="pricePagination.total"
            :background="PAGINATION_CONFIG.background"
            @size-change="handlePricePageSizeChange"
            @current-change="handlePricePageChange"
            class="pagination"
          />
        </el-tab-pane>
      </el-tabs>
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
  filterTemporaryData
} from './utils'

// 导入子组件
import ApprovalDetailDialog from './components/ApprovalDetailDialog.vue'
import CreateDataDialog from './components/CreateDataDialog.vue'

// 导入服务
import temporaryDataService from '@/services/TemporaryDataService'
import MaterialService from '@/services/MaterialService'

// 路由实例
const router = useRouter()

// 响应式数据
const loading = ref(false)

// 表格引用
const baseInfoTableRef = ref()
const priceTableRef = ref()

// 数据存储 - 分离基础信息和价格信息
const baseInfoList = ref([])
const priceList = ref([])
const allBaseInfoData = ref([])
const allPriceData = ref([])

// 选中行状态 - 分离两个表格的选中状态
const selectedBaseInfoRows = ref([])
const selectedPriceRows = ref([])

// 统计数据
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

// 当前激活的标签页
const activeTab = ref('baseInfo')

// 当前激活的筛选类型（保留兼容性）
const activeFilter = ref('')

// 分页 - 为两个表格维护独立的分页状态
const baseInfoPagination = ref({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.defaultPageSize,
  total: 0
})

const pricePagination = ref({
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

// 计算属性 - 表格数据
const baseInfoTableData = computed(() => baseInfoList.value)
const priceTableData = computed(() => priceList.value)

// 当前选中的行（根据活跃标签页）
const selectedRows = computed(() => {
  return activeTab.value === 'baseInfo' ? selectedBaseInfoRows.value : selectedPriceRows.value
})

// 当前分页状态（根据活跃标签页） - 暂时注释未使用
// const currentPagination = computed(() => {
//   return activeTab.value === 'baseInfo' ? baseInfoPagination.value : pricePagination.value
// })

// 获取基础信息数据
const fetchBaseInfoData = async (controlLoading = true) => {
  if (controlLoading) loading.value = true
  try {
    const queryParams = {
      page: baseInfoPagination.value.currentPage - 1,
      size: baseInfoPagination.value.pageSize,
      dataType: DATA_TYPE.BASE_INFO
    }
    
    // 如果有 taskId 则传入进行筛选
    if (filters.value.taskId && filters.value.taskId.trim()) {
      queryParams.taskId = filters.value.taskId.trim()
    }

    const response = await temporaryDataService.queryTemporaryData(queryParams)

    // 处理返回的基础信息数据
    const baseInfoItems = []
    
    if (response.data?.temporaryBaseInfos) {
      response.data.temporaryBaseInfos.forEach(item => {
        baseInfoItems.push(formatTemporaryData(item, DATA_TYPE.BASE_INFO))
      })
    }

    // 应用前端筛选（关键词搜索等）
    const filteredData = filterTemporaryData(baseInfoItems, filters.value)
    allBaseInfoData.value = filteredData
    
    // 使用后端返回的分页信息
    if (response.data?.page) {
      baseInfoPagination.value.total = response.data.page.totalElements
      baseInfoPagination.value.currentPage = response.data.page.currentPage + 1
      baseInfoPagination.value.pageSize = response.data.page.pageSize
    }
    
    baseInfoList.value = filteredData
    
  } catch (error) {
    console.error('获取基础信息数据失败:', error)
    ElMessage.error('获取基础信息数据失败')
    allBaseInfoData.value = []
    baseInfoList.value = []
  } finally {
    if (controlLoading) loading.value = false
  }
}

// 获取价格信息数据
const fetchPriceData = async (controlLoading = true) => {
  if (controlLoading) loading.value = true
  try {
    const queryParams = {
      page: pricePagination.value.currentPage - 1,
      size: pricePagination.value.pageSize,
      dataType: DATA_TYPE.PRICE
    }
    
    // 如果有 taskId 则传入进行筛选
    if (filters.value.taskId && filters.value.taskId.trim()) {
      queryParams.taskId = filters.value.taskId.trim()
    }

    const response = await temporaryDataService.queryTemporaryData(queryParams)

    // 处理返回的价格信息数据
    const priceItems = []
    
    if (response.data?.temporaryPrices) {
      // 为每个价格记录获取基础物资信息
      const pricesWithMaterialInfo = await Promise.all(
        response.data.temporaryPrices.map(async (item) => {
          const formattedItem = formatTemporaryData(item, DATA_TYPE.PRICE)
          
          // 获取基础物资信息
          let materialInfo = { materialName: '-', specificationModel: '-' }
          
          if (item.baseInfoId) {
            try {
              const materialResponse = await MaterialService.getMaterialById(item.baseInfoId)
              if (materialResponse?.data) {
                materialInfo = {
                  materialName: materialResponse.data.materialName || '-',
                  specificationModel: materialResponse.data.specificationModel || '-'
                }
              }
            } catch (error) {
              console.error('获取物资信息失败:', error)
            }
          }
          
          return {
            ...formattedItem,
            ...materialInfo
          }
        })
      )
      
      priceItems.push(...pricesWithMaterialInfo)
    }

    // 应用前端筛选（关键词搜索等）
    const filteredData = filterTemporaryData(priceItems, filters.value)
    allPriceData.value = filteredData
    
    // 使用后端返回的分页信息
    if (response.data?.page) {
      pricePagination.value.total = response.data.page.totalElements
      pricePagination.value.currentPage = response.data.page.currentPage + 1
      pricePagination.value.pageSize = response.data.page.pageSize
    }
    
    priceList.value = filteredData
    
  } catch (error) {
    console.error('获取价格信息数据失败:', error)
    ElMessage.error('获取价格信息数据失败')
    allPriceData.value = []
    priceList.value = []
  } finally {
    if (controlLoading) loading.value = false
  }
}

// 获取当前标签页数据
const fetchCurrentTabData = async () => {
  if (activeTab.value === 'baseInfo') {
    await fetchBaseInfoData()
  } else {
    await fetchPriceData()
  }
  
  // 更新统计数据
  updateStatistics()
}

// 更新统计数据
const updateStatistics = () => {
  const baseInfoCount = allBaseInfoData.value.length
  const priceCount = allPriceData.value.length
  const total = baseInfoCount + priceCount
  
  statistics.value = {
    total,
    baseInfoCount,
    priceCount,
    pendingCount: total // 临时数据都是待处理状态
  }
}

// 处理标签页切换
const handleTabChange = (tab) => {
  activeTab.value = tab.name
  fetchCurrentTabData()
}

// 返回智能大脑页面
const handleBackToSmartBrain = () => {
  router.push('/smart-brain')
}

// 刷新数据
const handleRefresh = () => {
  fetchCurrentTabData()
}

// 导出数据
const handleExport = async () => {
  const currentData = activeTab.value === 'baseInfo' ? allBaseInfoData.value : allPriceData.value
  const filename = `${activeTab.value === 'baseInfo' ? '临时基础信息' : '临时价格信息'}记录_${formatDateTime(new Date())}`
  await exportToExcel(currentData, filename)
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
  
  // 根据筛选类型切换到对应的标签页
  if (card.filterType === DATA_TYPE.BASE_INFO) {
    activeTab.value = 'baseInfo'
  } else if (card.filterType === DATA_TYPE.PRICE) {
    activeTab.value = 'price'
  }
  
  // 重新获取数据
  if (activeTab.value === 'baseInfo') {
    baseInfoPagination.value.currentPage = 1
  } else {
    pricePagination.value.currentPage = 1
  }
  fetchCurrentTabData()
}

// 清除筛选
const clearFilter = () => {
  activeFilter.value = ''
  if (activeTab.value === 'baseInfo') {
    baseInfoPagination.value.currentPage = 1
  } else {
    pricePagination.value.currentPage = 1
  }
  fetchCurrentTabData()
}

// 获取筛选标签
const getFilterLabel = (filterType) => {
  const card = STATS_CARDS.find(c => c.filterType === filterType)
  return card ? card.label : '全部'
}

// 创建成功回调
const handleCreateSuccess = () => {
  fetchCurrentTabData() // 刷新数据
}

// 搜索处理
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (activeTab.value === 'baseInfo') {
      baseInfoPagination.value.currentPage = 1
    } else {
      pricePagination.value.currentPage = 1
    }
    fetchCurrentTabData()
  }, 300)
}

// 筛选变化
const handleFilterChange = () => {
  if (activeTab.value === 'baseInfo') {
    baseInfoPagination.value.currentPage = 1
  } else {
    pricePagination.value.currentPage = 1
  }
  fetchCurrentTabData()
}

// 基础信息分页处理
const handleBaseInfoPageChange = () => {
  fetchBaseInfoData()
}

const handleBaseInfoPageSizeChange = () => {
  baseInfoPagination.value.currentPage = 1
  fetchBaseInfoData()
}

// 价格信息分页处理
const handlePricePageChange = () => {
  fetchPriceData()
}

const handlePricePageSizeChange = () => {
  pricePagination.value.currentPage = 1
  fetchPriceData()
}

// 基础信息表格选择变化
const handleBaseInfoSelectionChange = (selection) => {
  selectedBaseInfoRows.value = selection
}

// 价格信息表格选择变化
const handlePriceSelectionChange = (selection) => {
  selectedPriceRows.value = selection
}

// 清除选择
const clearSelection = () => {
  if (activeTab.value === 'baseInfo') {
    baseInfoTableRef.value?.clearSelection()
    selectedBaseInfoRows.value = []
  } else {
    priceTableRef.value?.clearSelection()
    selectedPriceRows.value = []
  }
}

// 获取基础信息表格索引
const getTableIndex = (index) => {
  return (baseInfoPagination.value.currentPage - 1) * baseInfoPagination.value.pageSize + index + 1
}

// 获取价格信息表格索引
const getPriceTableIndex = (index) => {
  return (pricePagination.value.currentPage - 1) * pricePagination.value.pageSize + index + 1
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
      fetchCurrentTabData()
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
      fetchCurrentTabData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

// 批量转正
const handleBatchPromote = async () => {
  const currentSelectedRows = activeTab.value === 'baseInfo' ? selectedBaseInfoRows.value : selectedPriceRows.value
  const result = await confirmPromote(currentSelectedRows)
  if (result.confirmed) {
    try {
      const baseInfoIds = []
      const priceIds = []
      
      currentSelectedRows.forEach(row => {
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
      fetchCurrentTabData()
    } catch (error) {
      console.error('批量转正失败:', error)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  const currentSelectedRows = activeTab.value === 'baseInfo' ? selectedBaseInfoRows.value : selectedPriceRows.value
  const result = await confirmDelete(currentSelectedRows)
  if (result.confirmed) {
    try {
      const baseInfoIds = []
      const priceIds = []
      
      currentSelectedRows.forEach(row => {
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
      fetchCurrentTabData()
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
onMounted(async () => {
  // 页面加载时同时获取基础信息和价格数据，以正确计算统计卡片
  try {
    loading.value = true
    await Promise.all([
      fetchBaseInfoData(false), // 不让单个函数控制loading
      fetchPriceData(false)     // 不让单个函数控制loading
    ])
    // 数据加载完成后更新统计信息
    updateStatistics()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
  } finally {
    loading.value = false
  }
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

/* 标签页样式 */
.data-tabs {
  margin-bottom: 20px;
}

:deep(.data-tabs .el-tabs__header) {
  margin-bottom: 20px;
  background: var(--theme-card-bg);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid var(--theme-border-secondary);
}

:deep(.data-tabs .el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.data-tabs .el-tabs__item) {
  border-radius: 6px;
  margin: 0 4px;
  padding: 0 20px;
  transition: all 0.3s ease;
  border: none;
  background: transparent;
}

:deep(.data-tabs .el-tabs__item.is-active) {
  background: var(--theme-primary);
  color: white;
  font-weight: 600;
}

:deep(.data-tabs .el-tabs__item:hover) {
  background: rgba(var(--theme-primary-rgb), 0.1);
  color: var(--theme-primary);
}

:deep(.data-tabs .el-tabs__item.is-active:hover) {
  background: var(--theme-primary);
  color: white;
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