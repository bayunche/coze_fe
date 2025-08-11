<template>
  <div class="project-data-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📊 项目数据管理</h1>
        <p class="page-subtitle">管理项目相关的数据信息</p>
      </div>
      <div class="header-right">
        <el-button @click="handleImport" size="small" type="success"> 导入数据 </el-button>
        <el-button @click="handleExport" size="small" type="primary"> 导出数据 </el-button>
        <el-button @click="goBack" size="small"> 返回 </el-button>
      </div>
    </div>

    <!-- 搜索过滤区 -->
    <div class="filter-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索项目名称、ID或其他关键词..."
        clearable
        style="width: 300px; margin-right: 16px"
        @input="onSearchChange"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 项目列表区域 -->
    <div class="project-list-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">📊</span>
          项目数据总览
        </h2>
        <div class="section-actions">
          <el-button @click="handleImport" size="small" type="success"> 导入数据 </el-button>
          <el-button @click="handleExport" size="small" type="primary"> 导出数据 </el-button>
        </div>
      </div>

      <!-- 动态表格组件 -->
      <DynamicTable
        :table-data="paginatedData"
        :dynamic-columns="currentColumns"
        :loading="tableLoading"
        :show-actions="true"
        :show-link-button="false"
        :show-pagination="true"
        :current-page="pagination.currentPage"
        :page-size="pagination.pageSize"
        :page-sizes="PAGINATION_CONFIG.pageSizes"
        :total-count="filteredData.length"
        @view-detail="onViewDetail"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 导入组件
import DynamicTable from './components/DynamicTable.vue'

// 导入常量和工具函数
import { PAGINATION_CONFIG } from './constants.js'
import {
  generateDynamicColumns,
  getMockData,
  createExportHandler,
  createImportHandler,
  filterData,
  paginateData
} from './utils.js'

const router = useRouter()

// 响应式数据
const searchKeyword = ref('')
const tableLoading = ref(false)

// 原始数据存储
const rawData = ref({})

// 分页数据
const pagination = ref({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.pageSize
})

// 计算属性
const currentColumns = computed(() => {
  return generateDynamicColumns('overview')
})

const currentRawData = computed(() => {
  return rawData.value.overview || []
})

const filteredData = computed(() => {
  return filterData(currentRawData.value, searchKeyword.value, {})
})

const paginatedData = computed(() => {
  const result = paginateData(
    filteredData.value,
    pagination.value.currentPage,
    pagination.value.pageSize
  )
  return result.data
})

// 方法定义
const loadProjectData = async () => {
  tableLoading.value = true

  try {
    // 模拟异步数据加载
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 获取Mock数据 - 只加载项目总览数据
    rawData.value.overview = getMockData('overview')

    // 重置分页
    pagination.value.currentPage = 1
  } catch (error) {
    ElMessage.error('项目数据加载失败')
    console.error('加载项目数据失败:', error)
  } finally {
    tableLoading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// 事件处理函数
const onSearchChange = () => {
  pagination.value.currentPage = 1
}

const handleExport = createExportHandler()

const handleImport = createImportHandler()

const onViewDetail = () => {
  ElMessage.info('该功能正在开发中，请耐心等候')
}

const onPageChange = (page) => {
  pagination.value.currentPage = page
}

const onPageSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

// 页面初始化
onMounted(() => {
  // 显示原型页面提示
  ElMessage.warning('该功能尚未开发完成，现为原型页面')
  loadProjectData()
})
</script>

<style scoped>
.project-data-management-page {
  padding: 32px;
  background-color: var(--theme-bg-secondary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: var(--theme-text-primary);
  overflow: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-size: 28px;
  color: var(--theme-primary);
  font-weight: 700;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px rgba(var(--theme-primary-rgb), 0.3);
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 6px;
  background: var(--theme-primary);
  border-radius: 3px;
  box-shadow: 0 0 6px rgba(var(--theme-primary-rgb), 0.4);
}

.page-subtitle {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin: 8px 0 0 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 30px;
  background: var(--theme-bg-card);
  border-radius: 12px;
  box-shadow: var(--theme-shadow-light);
  border: 1px solid var(--theme-border-light);
  transition: all 0.3s ease-in-out;
  flex-shrink: 0;
}

.filter-section:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-medium);
}

.project-list-section {
  background: var(--theme-bg-card);
  border-radius: 12px;
  border: 1px solid var(--theme-border-light);
  overflow: hidden;
  box-shadow: var(--theme-shadow-light);
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--theme-border-light);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
}

.section-icon {
  font-size: 24px;
}

.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 搜索输入框样式 */
:deep(.el-input) {
  --el-input-border-color: var(--theme-border-light);
  --el-input-focus-border-color: var(--theme-primary);
}

:deep(.el-input__wrapper) {
  background: var(--theme-bg-card);
  box-shadow: var(--theme-shadow-inset);
  border: 1px solid var(--theme-border-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary-light);
  box-shadow: 0 0 8px rgba(var(--theme-primary-rgb), 0.15);
}

:deep(.el-input__inner) {
  color: var(--theme-text-primary);
  font-weight: 500;
}

/* 选择器样式 */
:deep(.el-select) {
  --el-select-border-color-hover: var(--theme-primary);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-light);
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  box-shadow: var(--theme-shadow-light);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow-medium);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary-dark), var(--theme-primary));
  border: none;
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, var(--theme-success-dark), var(--theme-success));
  border: none;
}

/* Element Plus 下拉菜单样式 */
:deep(.el-select-dropdown) {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-light);
  box-shadow: var(--theme-shadow-medium);
  border-radius: 8px;
}

:deep(.el-select-dropdown .el-select-dropdown__item) {
  color: var(--theme-text-primary);
  font-weight: 500;
}

:deep(.el-select-dropdown .el-select-dropdown__item.hover) {
  background: rgba(var(--theme-primary-rgb), 0.08);
  color: var(--theme-primary);
}

:deep(.el-select-dropdown .el-select-dropdown__item.selected) {
  color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.12);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .project-data-management-page {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .project-data-management-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .filter-section {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px 20px;
  }

  .filter-section .el-input,
  .filter-section .el-select {
    width: 100% !important;
  }
}

@media (max-width: 480px) {
  .project-data-management-page {
    padding: 12px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .header-right {
    gap: 8px;
  }

  .header-right .el-button {
    font-size: 14px;
    padding: 8px 16px;
  }

  .filter-section {
    padding: 12px 16px;
  }
}
</style>
