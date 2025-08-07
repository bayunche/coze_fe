<template>
  <div class="project-data-management-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📊 项目数据管理</h1>
        <p class="page-subtitle">管理项目相关的数据信息</p>
      </div>
      <div class="header-right">
        <el-button @click="handleImport" size="small" type="success">
          导入数据
        </el-button>
        <el-button @click="handleExport" size="small" type="primary">
          导出数据
        </el-button>
        <el-button @click="goBack" size="small">
          返回
        </el-button>
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
          <el-button @click="handleImport" size="small" type="success">
            导入数据
          </el-button>
          <el-button @click="handleExport" size="small" type="primary">
            导出数据
          </el-button>
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
        height="500px"
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
import { 
  PAGINATION_CONFIG 
} from './constants.js'
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
    await new Promise(resolve => setTimeout(resolve, 300))
    
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

const handleExport = createExportHandler('overview', filteredData.value)

const handleImport = createImportHandler('overview', () => {
  loadProjectData()
})

const onViewDetail = (rowData) => {
  // 跳转到项目详情页面，而不是打开弹窗
  router.push({
    name: 'project-detail',
    params: { projectId: rowData.projectId }
  })
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
  loadProjectData()
})
</script>

<style scoped>
.project-data-management-page {
  /* 采用与OwnerMaterialAlignPage相同的设计变量 */
  --primary-color: #4f46e5; /* 靛蓝色 */
  --secondary-color: #64748b; /* 石板灰 */
  --accent-color: #3730a3; /* 深靛蓝主题色 */
  --success-color: #0d9488; /* 青蓝绿色 */
  --warning-color: #dc6803; /* 深橙色 */
  --danger-color: #dc2626; /* 深红色 */
  --info-color: #0891b2; /* 青色 */
  --background-light: #f8fafc; /* 极浅灰蓝背景 */
  --card-background: #ffffff; /* 纯白卡片背景 */
  --border-color: rgba(79, 70, 229, 0.08); /* 柔和边框 */
  --text-dark: #1e293b; /* 深色文字 */
  --text-light: #64748b; /* 浅色文字 */
  --shadow-color: rgba(79, 70, 229, 0.06); /* 柔和阴影 */

  padding: 32px;
  background-color: var(--background-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-dark);
  overflow-x: hidden;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-title {
  margin: 0;
  font-size: 28px;
  color: var(--accent-color);
  font-weight: 700;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px var(--shadow-color);
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 6px;
  background: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 6px var(--shadow-color);
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-light);
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
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
}

.filter-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.08);
}

.project-list-section {
  background: var(--card-background);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
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
  border-bottom: 2px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-dark);
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
  --el-input-border-color: var(--border-color);
  --el-input-focus-border-color: var(--accent-color);
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 3px rgba(79, 70, 229, 0.03) inset;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--accent-color);
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.08);
}

:deep(.el-input__inner) {
  color: var(--text-dark);
  font-weight: 500;
}

/* 选择器样式 */
:deep(.el-select) {
  --el-select-border-color-hover: var(--accent-color);
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
  border: none;
}

:deep(.el-button--success) {
  background: linear-gradient(135deg, var(--success-color), #059669);
  border: none;
}

/* Element Plus 下拉菜单样式 */
:deep(.el-select-dropdown) {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 20px var(--shadow-color);
  border-radius: 8px;
}

:deep(.el-select-dropdown .el-select-dropdown__item) {
  color: var(--text-dark);
  font-weight: 500;
}

:deep(.el-select-dropdown .el-select-dropdown__item.hover) {
  background: rgba(79, 70, 229, 0.05);
  color: var(--accent-color);
}

:deep(.el-select-dropdown .el-select-dropdown__item.selected) {
  color: var(--accent-color);
  background: rgba(79, 70, 229, 0.08);
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

  :deep(.el-tabs__nav-wrap) {
    padding: 0 20px;
  }

  :deep(.el-tabs__item) {
    padding: 14px 18px;
    font-size: 14px;
  }

  :deep(.el-tab-pane) {
    padding: 20px 16px;
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

  :deep(.el-tabs__nav-wrap) {
    padding: 0 12px;
  }

  :deep(.el-tabs__item) {
    padding: 12px 14px;
    font-size: 13px;
  }

  :deep(.el-tab-pane) {
    padding: 16px 12px;
  }
}
</style>