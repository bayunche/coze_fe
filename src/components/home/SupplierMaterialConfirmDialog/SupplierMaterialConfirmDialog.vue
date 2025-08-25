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
              :type="getMatchTypeTag(row.matchedType).type"
              size="small"
            >
              {{ getMatchTypeTag(row.matchedType).text }}
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
        
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small"
              :disabled="row.confirmResult === 1"
              @click="handleConfirm(row)"
            >
              {{ row.confirmResult === 1 ? '已确认' : '确认' }}
            </el-button>
            <el-button 
              type="text" 
              size="small"
              @click="handleViewOptions(row)"
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
        <el-button 
          type="primary" 
          @click="handleRefresh"
          :loading="loading"
        >
          刷新数据
        </el-button>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import ConfirmOptionsDialog from './ConfirmOptionsDialog.vue'
import { 
  getSupplierMaterialParsingResults,
  querySupplierMaterialsComplex,
  confirmSupplierMaterialData 
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
  return materialData.value.filter(item => item.confirmResult === 1).length
})

const pendingCount = computed(() => {
  return materialData.value.filter(item => item.confirmResult !== 1).length
})

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
      
      console.log('使用复杂查询参数:', params)
      response = await querySupplierMaterialsComplex(params)
      
      if (response && response.data) {
        materialData.value = response.data.content || []
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
        materialData.value = response.content
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

// 获取行样式类名
const getRowClassName = ({ row }) => {
  if (row.confirmResult === 1) {
    return 'confirmed-row'
  }
  return 'pending-row'
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

// 批量确认全部
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
watch(() => props.show, (newShow) => {
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
}, { immediate: true })
</script>

<style scoped>
:deep(.supplier-material-confirm-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
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

.price-text {
  font-weight: 500;
  color: var(--theme-success);
}

.price-quarter {
  font-size: 11px;
  color: var(--theme-text-secondary);
  margin-top: 2px;
}

:deep(.confirmed-row) {
  background-color: var(--theme-success-light) !important;
}

:deep(.pending-row) {
  background-color: var(--theme-bg-primary);
}

/* 表格样式 */
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

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

/* 标签样式 */
:deep(.el-tag--success) {
  background: var(--theme-success) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-tag--warning) {
  background: var(--theme-warning) !important;
  color: var(--theme-text-inverse) !important;
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

/* 价格信息样式 */
.price-info {
  display: flex;
  flex-direction: column;
}

.price-info .price-text {
  font-weight: 500;
  color: var(--theme-success);
  margin-bottom: 4px;
}

.price-info .price-quarter {
  font-size: 11px;
  color: var(--theme-text-secondary);
}

/* 响应式设计 */
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
}
</style>