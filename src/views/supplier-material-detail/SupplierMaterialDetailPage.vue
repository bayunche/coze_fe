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
          @click="handleSave" 
          :icon="Check" 
          type="primary"
          :loading="saveLoading"
        >
          {{ BUTTON_CONFIG.SAVE.text }}
        </el-button>
        <el-button 
          @click="handleGoToConfirm" 
          :icon="Right" 
          type="success"
        >
          {{ BUTTON_CONFIG.TO_CONFIRM.text }}
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div :class="CSS_CLASSES.PAGE_CONTENT" v-loading="pageLoading">
      <!-- 任务信息展示区块 -->
      <div :class="CSS_CLASSES.INFO_SECTION">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📋</span>
            任务信息
          </h2>
        </div>
        <el-card class="info-card">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">任务ID:</div>
              <div class="info-value">{{ taskId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">详情ID:</div>
              <div class="info-value">{{ detailId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">解析状态:</div>
              <div class="info-value">
                <el-tag type="success">已完成</el-tag>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">数据总数:</div>
              <div class="info-value">{{ total }} 条</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 物资详情表格区块 -->
      <div :class="CSS_CLASSES.TABLE_SECTION">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📦</span>
            乙供物资解析详情
          </h2>
          <div class="section-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索物资名称、规格型号"
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

        <el-table 
          :data="filteredTableData" 
          v-loading="tableLoading"
          style="width: 100%" 
          border
          height="600"
        >
          <!-- 表格列配置 -->
          <el-table-column 
            v-for="column in TABLE_COLUMNS"
            :key="column.prop || column.label"
            v-bind="column"
          >
            <!-- 乙供物资名称列 -->
            <template v-if="column.prop === 'material_name'" #default="{ row }">
              <span>{{ row.material_name }}</span>
            </template>
            
            <!-- 乙供物资规格型号列 -->
            <template v-else-if="column.prop === 'material_specification'" #default="{ row }">
              <span>{{ row.material_specification }}</span>
            </template>
            
            <!-- 乙供物资价格列 -->
            <template v-else-if="column.prop === 'material_price'" #default="{ row }">
              <span>{{ row.material_price }}</span>
            </template>
            
            <!-- 匹配物资名称列 -->
            <template v-else-if="column.prop === 'matched_name'" #default="{ row }">
              <span>{{ row.matched_name }}</span>
            </template>
            
            <!-- 匹配规格型号列 -->
            <template v-else-if="column.prop === 'matched_specification'" #default="{ row }">
              <span>{{ row.matched_specification }}</span>
            </template>
            
            <!-- 匹配价格列 -->
            <template v-else-if="column.prop === 'matched_price'" #default="{ row }">
              <span>{{ row.matched_price }}</span>
            </template>
            
            <!-- 相似度列 -->
            <template v-else-if="column.prop === 'similarity'" #default="{ row }">
              <span>{{ row.similarity }}</span>
            </template>
            
            <!-- 匹配类型列 -->
            <template v-else-if="column.prop === 'match_type'" #default="{ row }">
              <el-tag :type="getMatchTypeTag(row.match_type)">
                {{ row.match_type }}
              </el-tag>
            </template>
            
            <!-- 操作列 -->
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="action-buttons">
                <!-- 精确匹配状态 -->
                <div v-if="row.match_type === '精确匹配'">
                  <el-button 
                    :type="ACTION_BUTTONS.EXACT_MATCH.type" 
                    :disabled="ACTION_BUTTONS.EXACT_MATCH.disabled"
                    size="small"
                  >
                    {{ ACTION_BUTTONS.EXACT_MATCH.text }}
                  </el-button>
                </div>
                
                <!-- 相似匹配状态 -->
                <div v-else-if="row.match_type === '相似匹配'">
                  <el-select
                    v-model="row.selected_match"
                    placeholder="从相似匹配中选择"
                    value-key="matchedPriceId"
                    @change="handleSimilarMatchChange(row, $event)"
                    size="small"
                    style="width: 180px;"
                  >
                    <el-option
                      v-for="item in row.similar_matches"
                      :key="item.matchedPriceId || item.id"
                      :label="formatSimilarMatchLabel(item)"
                      :value="item"
                    />
                  </el-select>
                </div>
                
                <!-- 无匹配或其他状态 -->
                <div v-else>
                  <el-button 
                    :type="ACTION_BUTTONS.EDIT.type" 
                    :size="ACTION_BUTTONS.EDIT.size"
                    @click="handleEdit(row)"
                  >
                    {{ ACTION_BUTTONS.EDIT.text }}
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
      </div>
    </div>

    <!-- 物资选择对话框 -->
    <MaterialSelectionDialog
      v-model:modelValue="showSelectionDialog"
      :data-list="selectionList"
      :total="selectionTotal"
      :page-num="selectionPageNum"
      :page-size="selectionPageSize"
      :loading="selectionLoading"
      @select="handleMaterialSelect"
      @page-change="handleSelectionPageChange"
      @size-change="handleSelectionSizeChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  ArrowLeft, 
  Refresh, 
  Download, 
  Check, 
  Right, 
  Search 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog'

// 导入常量和工具函数
import {
  PAGE_CONFIG,
  TABLE_COLUMNS,
  BUTTON_CONFIG,
  ACTION_BUTTONS,
  PAGINATION_CONFIG,
  CSS_CLASSES,
  MESSAGE_CONFIG
} from './constants.js'

import {
  fetchMaterialDetail,
  fetchSelectionList,
  saveParsingResults,
  handleSimilarMatchChange as utilHandleSimilarMatchChange,
  handleMaterialSelect as utilHandleMaterialSelect,
  formatSimilarMatchLabel,
  getMatchTypeTag,
  exportTableData,
  useNavigation
} from './utils.js'

// 路由参数
const route = useRoute()
const taskId = computed(() => route.params.taskId)
const detailId = computed(() => route.params.detailId)

// 导航函数
const { goBack, goToConfirm } = useNavigation()

// 响应式数据
const pageLoading = ref(false)
const tableLoading = ref(false)
const refreshLoading = ref(false)
const saveLoading = ref(false)
const exportLoading = ref(false)
const selectionLoading = ref(false)

const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(PAGINATION_CONFIG.default_page_size)

// 搜索相关
const searchKeyword = ref('')
const filteredTableData = computed(() => {
  if (!searchKeyword.value) {
    return tableData.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return tableData.value.filter(item => 
    item.material_name.toLowerCase().includes(keyword) ||
    item.material_specification.toLowerCase().includes(keyword) ||
    item.matched_name.toLowerCase().includes(keyword) ||
    item.matched_specification.toLowerCase().includes(keyword)
  )
})

// 物资选择对话框相关
const showSelectionDialog = ref(false)
const currentRow = ref(null)
const selectionList = ref([])
const selectionTotal = ref(0)
const selectionPageNum = ref(1)
const selectionPageSize = ref(10)

/**
 * 加载物资详情数据
 */
const loadMaterialDetail = async (page = currentPage.value, size = pageSize.value) => {
  if (!taskId.value || !detailId.value) {
    ElMessage.error('缺少必要的任务参数')
    return
  }

  tableLoading.value = true
  
  try {
    const { tableData: data, total: totalCount } = await fetchMaterialDetail(
      taskId.value, 
      detailId.value, 
      page, 
      size
    )
    
    tableData.value = data
    total.value = totalCount
    
    if (data.length > 0) {
      ElMessage.success(MESSAGE_CONFIG.LOAD_SUCCESS)
    }
  } catch (error) {
    console.error('【错误】加载物资详情失败:', error)
  } finally {
    tableLoading.value = false
  }
}

/**
 * 处理页码变化
 */
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  loadMaterialDetail(newPage, pageSize.value)
}

/**
 * 处理页大小变化
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  loadMaterialDetail(1, newSize)
}

/**
 * 处理搜索
 */
const handleSearch = () => {
  // 搜索功能通过计算属性实现，这里可以添加额外逻辑
  console.log('【诊断】搜索关键词:', searchKeyword.value)
}

/**
 * 处理搜索清空
 */
const handleSearchClear = () => {
  searchKeyword.value = ''
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
    await loadMaterialDetail()
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
    const filename = `乙供物资解析详情_${taskId.value}_${detailId.value}`
    exportTableData(tableData.value, filename)
  } catch (error) {
    console.error('【错误】导出失败:', error)
  } finally {
    exportLoading.value = false
  }
}

/**
 * 处理保存
 */
const handleSave = async () => {
  saveLoading.value = true
  
  try {
    const success = await saveParsingResults(tableData.value)
    if (success) {
      // 重新加载数据以获取最新状态
      await loadMaterialDetail()
    }
  } catch (error) {
    console.error('【错误】保存失败:', error)
  } finally {
    saveLoading.value = false
  }
}

/**
 * 处理跳转到确认页面
 */
const handleGoToConfirm = () => {
  goToConfirm(taskId.value)
}

/**
 * 处理相似匹配选择变化
 */
const handleSimilarMatchChange = (row, selectedMatch) => {
  utilHandleSimilarMatchChange(row, selectedMatch)
}

/**
 * 处理编辑操作
 */
const handleEdit = async (row) => {
  currentRow.value = row
  
  if (row.match_type === '无匹配' || !row.match_type || row.match_type === '未知') {
    // 初始化选择对话框分页参数
    selectionPageNum.value = 1
    selectionPageSize.value = 10
    
    // 获取匹配列表数据
    await loadSelectionList(selectionPageNum.value, selectionPageSize.value)
    showSelectionDialog.value = true
  } else {
    showSelectionDialog.value = true
  }
}

/**
 * 加载物资选择列表
 */
const loadSelectionList = async (pageNum, pageSize) => {
  selectionLoading.value = true
  
  try {
    const { selectionList: list, total: totalCount } = await fetchSelectionList(pageNum, pageSize)
    selectionList.value = list
    selectionTotal.value = totalCount
  } catch (error) {
    console.error('【错误】加载选择列表失败:', error)
  } finally {
    selectionLoading.value = false
  }
}

/**
 * 处理选择对话框分页变化
 */
const handleSelectionPageChange = async (newPage) => {
  selectionPageNum.value = newPage
  await loadSelectionList(newPage, selectionPageSize.value)
}

/**
 * 处理选择对话框页大小变化
 */
const handleSelectionSizeChange = async (newSize) => {
  selectionPageSize.value = newSize
  selectionPageNum.value = 1
  await loadSelectionList(1, newSize)
}

/**
 * 处理物资选择
 */
const handleMaterialSelect = (selectedMaterial) => {
  if (currentRow.value && selectedMaterial) {
    utilHandleMaterialSelect(currentRow.value, selectedMaterial)
  }
  showSelectionDialog.value = false
}

// 页面初始化时加载数据
onMounted(() => {
  pageLoading.value = true
  loadMaterialDetail().finally(() => {
    pageLoading.value = false
  })
})

// 监听路由参数变化
watch(
  [taskId, detailId],
  ([newTaskId, newDetailId], [oldTaskId, oldDetailId]) => {
    if (newTaskId !== oldTaskId || newDetailId !== oldDetailId) {
      if (newTaskId && newDetailId) {
        currentPage.value = 1
        pageSize.value = PAGINATION_CONFIG.default_page_size
        loadMaterialDetail()
      }
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.supplier-material-detail-page {
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

.info-section,
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

.section-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.info-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
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

:deep(.el-table--border) {
  border: 1px solid var(--el-border-color-lighter);
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

:deep(.el-card__body) {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supplier-material-detail-page {
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
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>