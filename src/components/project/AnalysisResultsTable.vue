<template>
  <div class="analysis-results-table">
    <div class="table-header">
      <h3 class="table-title">
        <span class="title-icon">📊</span>
        {{ title }}
        <el-tag v-if="totalCount > 0" type="info" size="small">
          {{ totalCount }} 条记录
        </el-tag>
      </h3>
      <div class="table-actions">
        <el-button @click="handleRefresh" :icon="Refresh" size="small" :loading="loading">
          刷新
        </el-button>
        <el-button @click="handleExport" :icon="Download" size="small" type="primary">
          导出
        </el-button>
      </div>
    </div>

    <div class="table-content">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        :height="tableHeight"
        style="width: 100%"
        :empty-text="emptyText"
      >
        <el-table-column
          v-for="column in tableColumns"
          :key="column.prop"
          v-bind="column"
        >
          <template #default="{ row }">
            <span>{{ formatCellValue(row[column.prop], column.prop) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div v-if="showPagination && totalCount > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import AnalysisResultsService from '@/services/AnalysisResultsService.js'

// Props定义
const props = defineProps({
  title: {
    type: String,
    default: '解析结果'
  },
  projectId: {
    type: String,
    required: true
  },
  tableHeight: {
    type: [String, Number],
    default: 400
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  autoLoad: {
    type: Boolean,
    default: true
  }
})

// Emits定义
const emit = defineEmits(['data-loaded', 'export'])

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const tableColumns = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 服务实例
const analysisResultsService = new AnalysisResultsService()

// 计算属性
const emptyText = computed(() => {
  return loading.value ? '加载中...' : '暂无解析结果'
})

// 方法定义
const loadAnalysisResults = async () => {
  try {
    loading.value = true
    
    const response = await analysisResultsService.getAnalysisResults({
      page: currentPage.value - 1, // API从0开始
      size: pageSize.value,
      sort: 'taskDetailId,desc'
    })

    if (response.success && response.data) {
      const { content, totalElements, totalPages } = response.data
      
      // 处理数据，转换动态字段和表头
      const processedData = analysisResultsService.processAnalysisResults(content)
      
      tableData.value = processedData.tableData
      tableColumns.value = processedData.tableColumns
      totalCount.value = totalElements

      console.log('解析结果数据加载完成:', {
        totalElements,
        totalPages,
        tableData: tableData.value,
        tableColumns: tableColumns.value
      })

      // 触发数据加载事件
      emit('data-loaded', {
        data: tableData.value,
        columns: tableColumns.value,
        total: totalCount.value
      })
    } else {
      ElMessage.error(response.message || '获取解析结果失败')
    }
  } catch (error) {
    console.error('加载解析结果失败:', error)
    ElMessage.error('加载解析结果失败，请重试')
  } finally {
    loading.value = false
  }
}

const formatCellValue = (value, prop) => {
  return analysisResultsService.formatCellValue(value, prop)
}

const handleRefresh = async () => {
  await loadAnalysisResults()
}

const handleExport = () => {
  emit('export', {
    data: tableData.value,
    columns: tableColumns.value,
    title: props.title
  })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadAnalysisResults()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadAnalysisResults()
}

// 监听项目ID变化
watch(() => props.projectId, (newProjectId) => {
  if (newProjectId && props.autoLoad) {
    currentPage.value = 1
    loadAnalysisResults()
  }
})

// 组件挂载时自动加载数据
onMounted(() => {
  if (props.autoLoad && props.projectId) {
    loadAnalysisResults()
  }
})

// 暴露方法给父组件
defineExpose({
  loadAnalysisResults,
  refresh: handleRefresh
})
</script>

<style scoped>
.analysis-results-table {
  --primary-color: #4f46e5;
  --accent-color: #3730a3;
  --card-background: #ffffff;
  --border-color: rgba(79, 70, 229, 0.08);
  --text-dark: #1e293b;
  --text-light: #64748b;
  --shadow-color: rgba(79, 70, 229, 0.06);

  background: var(--card-background);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  border-bottom: 1px solid var(--border-color);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

.title-icon {
  font-size: 20px;
}

.table-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-content {
  padding: 0;
}

/* Element Plus 表格样式覆盖 */
:deep(.el-table) {
  background: var(--card-background);
  color: var(--text-dark);
  border: none;
}

:deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  font-size: 14px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 12px 0;
}

:deep(.el-table__row) {
  height: 50px;
  font-size: 13px;
  color: var(--text-dark);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

:deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(79, 70, 229, 0.008);
}

.pagination-wrapper {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  border-top: 1px solid var(--border-color);
}

/* 分页组件样式 */
:deep(.el-pagination) {
  color: var(--text-dark);
  font-weight: 500;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background: var(--card-background);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .btn-prev:hover) {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
}

:deep(.el-pagination .el-pager li) {
  background: var(--card-background);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin: 0 2px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li:hover) {
  background: rgba(79, 70, 229, 0.05);
  color: var(--accent-color);
  transform: translateY(-1px);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
  border: none;
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px 20px;
  }

  .table-actions {
    justify-content: flex-start;
  }

  :deep(.el-table__cell) {
    padding: 6px 8px;
    font-size: 12px;
  }

  .pagination-wrapper {
    padding: 16px 20px;
  }

  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>