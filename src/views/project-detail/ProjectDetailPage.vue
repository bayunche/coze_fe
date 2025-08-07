<template>
  <div class="project-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          @click="goBack" 
          :icon="ArrowLeft" 
          type="text" 
          class="back-btn"
        >
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">{{ PAGE_CONFIG.title }}</h1>
          <p class="page-subtitle">{{ projectData.projectName || '项目详情' }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :icon="Refresh" type="default">
          刷新数据
        </el-button>
        <el-button @click="handleExportAll" :icon="Download" type="primary" :loading="exportLoading">
          导出全部数据
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="page-content" v-loading="pageLoading">
      <!-- 项目基础信息区块 -->
      <div class="info-section project-info-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">{{ SECTION_CONFIG.PROJECT_INFO.icon }}</span>
            {{ SECTION_CONFIG.PROJECT_INFO.title }}
          </h2>
        </div>
        <el-card class="info-card">
          <div class="info-grid">
            <div 
              v-for="field in PROJECT_INFO_FIELDS" 
              :key="field.key"
              class="info-item"
            >
              <div class="info-label">{{ field.label }}</div>
              <div class="info-value">
                <el-tag 
                  v-if="field.type === 'tag'" 
                  :type="getTagType(field.key, projectData[field.key])"
                  size="small"
                >
                  {{ projectData[field.key] || '-' }}
                </el-tag>
                <el-tag 
                  v-else-if="field.type === 'status'" 
                  :type="getStatusConfig('project', projectData[field.key]).type"
                  size="small"
                >
                  {{ getStatusConfig('project', projectData[field.key]).text }}
                </el-tag>
                <span v-else-if="field.type === 'currency'">
                  {{ formatCurrency(projectData[field.key]) }}
                </span>
                <span v-else-if="field.type === 'date'">
                  {{ formatDate(projectData[field.key]) }}
                </span>
                <span v-else>
                  {{ projectData[field.key] || '-' }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 合同信息区块 -->
      <div class="info-section contract-info-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">{{ SECTION_CONFIG.CONTRACT_INFO.icon }}</span>
            {{ SECTION_CONFIG.CONTRACT_INFO.title }}
          </h2>
          <el-button @click="handleExportContracts" size="small" type="primary" plain>
            导出合同数据
          </el-button>
        </div>

        <!-- 合同列表展示 -->
        <div v-if="projectData.contracts && projectData.contracts.length > 0" class="contracts-container">
          <el-card 
            v-for="(contract, index) in projectData.contracts" 
            :key="contract.contractId"
            class="contract-card"
            :class="{ 'main-contract': index === 0 }"
          >
            <div class="contract-header">
              <div class="contract-title">
                <span class="contract-name">{{ contract.contractName }}</span>
              </div>
              <div class="contract-amount">
                <span class="amount-label">合同金额：</span>
                <span class="amount-value">{{ formatCurrency(contract.contractAmount) }}</span>
              </div>
            </div>

            <div class="contract-content">
              <!-- 基础合同信息 -->
              <div class="contract-basic-info">
                <div class="contract-info-grid">
                  <div class="contract-info-item">
                    <span class="info-label">合同编号：</span>
                    <span class="info-value">{{ contract.contractCode }}</span>
                  </div>
                  <div class="contract-info-item">
                    <span class="info-label">合同类型：</span>
                    <el-tag type="info" size="small">{{ contract.contractType }}</el-tag>
                  </div>
                  <div class="contract-info-item">
                    <span class="info-label">甲方：</span>
                    <span class="info-value">{{ contract.partyA }}</span>
                  </div>
                  <div class="contract-info-item">
                    <span class="info-label">乙方：</span>
                    <span class="info-value">{{ contract.partyB }}</span>
                  </div>
                  <div class="contract-info-item">
                    <span class="info-label">签订日期：</span>
                    <span class="info-value">{{ formatDate(contract.signDate) }}</span>
                  </div>
                  <div class="contract-info-item" v-if="contract.description">
                    <span class="info-label">合同描述：</span>
                    <span class="info-value">{{ contract.description }}</span>
                  </div>
                </div>
              </div>

            </div>
          </el-card>
        </div>

        <!-- 无合同信息时的显示 -->
        <el-card v-else class="no-contracts">
          <el-empty description="暂无关联合同信息" />
        </el-card>
      </div>

      <!-- 甲供物资信息区块 -->
      <div class="info-section owner-material-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">{{ SECTION_CONFIG.OWNER_MATERIAL.icon }}</span>
            {{ SECTION_CONFIG.OWNER_MATERIAL.title }}
          </h2>
          <el-button @click="handleExportOwnerMaterial" size="small" type="primary" plain>
            导出甲供数据
          </el-button>
        </div>
        
        <!-- 甲供物资统计卡片 -->
        <div class="stats-cards">
          <el-card 
            v-for="stat in STATS_CONFIG.OWNER_MATERIAL" 
            :key="stat.key"
            class="stat-card"
          >
            <div class="stat-content">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-info">
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-value">
                  {{ ownerMaterialStats[stat.key] }}{{ stat.unit }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 甲供物资表格 -->
        <el-card class="table-card">
          <el-table
            :data="paginatedOwnerMaterials"
            style="width: 100%"
            v-loading="ownerMaterialLoading"
            stripe
            :height="400"
          >
            <el-table-column
              v-for="column in OWNER_MATERIAL_COLUMNS"
              :key="column.prop"
              v-bind="column"
            >
              <template v-if="column.prop === 'unitPrice' || column.prop === 'totalPrice'" #default="{ row }">
                <span class="price-text">{{ formatCurrency(row[column.prop]) }}</span>
              </template>
              <template v-else-if="column.prop === 'quantity'" #default="{ row }">
                <span class="quantity-text">{{ row[column.prop]?.toLocaleString() || '-' }}</span>
              </template>
              <template v-else-if="column.prop === 'deliveryDate'" #default="{ row }">
                {{ formatDate(row[column.prop]) }}
              </template>
              <template v-else-if="column.prop === 'materialStatus'" #default="{ row }">
                <el-tag
                  :type="getStatusConfig('material', row[column.prop]).type"
                  size="small"
                >
                  {{ getStatusConfig('material', row[column.prop]).text }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="ownerMaterialPagination.currentPage"
              v-model:page-size="ownerMaterialPagination.pageSize"
              :page-sizes="PAGINATION_CONFIG.pageSizes"
              :total="ownerMaterials.length"
              :layout="PAGINATION_CONFIG.layout"
              @size-change="handleOwnerMaterialSizeChange"
              @current-change="handleOwnerMaterialCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 解析结果区块 -->
      <div class="info-section parsing-results-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">📊</span>
            解析结果
          </h2>
          <el-button @click="handleExportParsingResults" size="small" type="primary" plain>
            导出解析数据
          </el-button>
        </div>
        
        <!-- 解析结果表格 -->
        <AnalysisResultsTable
          ref="analysisResultsTableRef"
          :project-id="projectData.projectId"
          title="项目解析结果"
          :table-height="400"
          @data-loaded="onParsingResultsLoaded"
          @export="onExportParsingResults"
        />
      </div>

      <!-- 乙供物资信息区块 -->
      <div class="info-section supplier-material-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="section-icon">{{ SECTION_CONFIG.SUPPLIER_MATERIAL.icon }}</span>
            {{ SECTION_CONFIG.SUPPLIER_MATERIAL.title }}
          </h2>
          <el-button @click="handleExportSupplierMaterial" size="small" type="primary" plain>
            导出乙供数据
          </el-button>
        </div>
        
        <!-- 乙供物资统计卡片 -->
        <div class="stats-cards">
          <el-card 
            v-for="stat in STATS_CONFIG.SUPPLIER_MATERIAL" 
            :key="stat.key"
            class="stat-card"
          >
            <div class="stat-content">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-info">
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-value">
                  {{ supplierMaterialStats[stat.key] }}{{ stat.unit }}
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 乙供物资表格 -->
        <el-card class="table-card">
          <el-table
            :data="paginatedSupplierMaterials"
            style="width: 100%"
            v-loading="supplierMaterialLoading"
            stripe
            :height="400"
          >
            <el-table-column
              v-for="column in SUPPLIER_MATERIAL_COLUMNS"
              :key="column.prop"
              v-bind="column"
            >
              <template v-if="column.prop === 'estimatedPrice' || column.prop === 'actualPrice' || column.prop === 'totalCost'" #default="{ row }">
                <span class="price-text">{{ formatCurrency(row[column.prop]) }}</span>
              </template>
              <template v-else-if="column.prop === 'quantity'" #default="{ row }">
                <span class="quantity-text">{{ row[column.prop]?.toLocaleString() || '-' }}</span>
              </template>
              <template v-else-if="column.prop === 'matchingStatus'" #default="{ row }">
                <el-tag
                  :type="getStatusConfig('material', row[column.prop]).type"
                  size="small"
                >
                  {{ getStatusConfig('material', row[column.prop]).text }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="supplierMaterialPagination.currentPage"
              v-model:page-size="supplierMaterialPagination.pageSize"
              :page-sizes="PAGINATION_CONFIG.pageSizes"
              :total="supplierMaterials.length"
              :layout="PAGINATION_CONFIG.layout"
              @size-change="handleSupplierMaterialSizeChange"
              @current-change="handleSupplierMaterialCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 导入解析结果组件
import AnalysisResultsTable from '@/components/project/AnalysisResultsTable.vue'

// 导入常量和工具函数
import {
  PAGE_CONFIG,
  SECTION_CONFIG,
  PROJECT_INFO_FIELDS,
  OWNER_MATERIAL_COLUMNS,
  SUPPLIER_MATERIAL_COLUMNS,
  STATS_CONFIG,
  PAGINATION_CONFIG
} from './constants.js'

import {
  getProjectDetailMockData,
  getOwnerMaterialMockData,
  getSupplierMaterialMockData,
  formatCurrency,
  formatDate,
  getStatusConfig,
  calculateStats,
  exportToExcel,
  handleDataLoadError
} from './utils.js'

const router = useRouter()
const route = useRoute()

// 响应式数据
const pageLoading = ref(false)
const exportLoading = ref(false)
const ownerMaterialLoading = ref(false)
const supplierMaterialLoading = ref(false)

const projectData = ref({})
const ownerMaterials = ref([])
const supplierMaterials = ref([])

// 解析结果相关
const analysisResultsTableRef = ref(null)
const parsingResultsData = ref([])

// 分页配置
const ownerMaterialPagination = reactive({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.pageSize
})

const supplierMaterialPagination = reactive({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.pageSize
})

// 计算属性
const ownerMaterialStats = computed(() => {
  return calculateStats(ownerMaterials.value, 'owner')
})

const supplierMaterialStats = computed(() => {
  return calculateStats(supplierMaterials.value, 'supplier')
})

const paginatedOwnerMaterials = computed(() => {
  const start = (ownerMaterialPagination.currentPage - 1) * ownerMaterialPagination.pageSize
  const end = start + ownerMaterialPagination.pageSize
  return ownerMaterials.value.slice(start, end)
})

const paginatedSupplierMaterials = computed(() => {
  const start = (supplierMaterialPagination.currentPage - 1) * supplierMaterialPagination.pageSize
  const end = start + supplierMaterialPagination.pageSize
  return supplierMaterials.value.slice(start, end)
})

// 方法定义
const loadProjectData = async () => {
  try {
    pageLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const projectId = route.params.projectId
    projectData.value = getProjectDetailMockData(projectId)
    
  } catch (error) {
    handleDataLoadError(error, '项目数据加载')
  } finally {
    pageLoading.value = false
  }
}

const loadOwnerMaterials = async () => {
  try {
    ownerMaterialLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const projectId = route.params.projectId
    ownerMaterials.value = getOwnerMaterialMockData(projectId)
    
  } catch (error) {
    handleDataLoadError(error, '甲供物资数据加载')
  } finally {
    ownerMaterialLoading.value = false
  }
}

const loadSupplierMaterials = async () => {
  try {
    supplierMaterialLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const projectId = route.params.projectId
    supplierMaterials.value = getSupplierMaterialMockData(projectId)
    
  } catch (error) {
    handleDataLoadError(error, '乙供物资数据加载')
  } finally {
    supplierMaterialLoading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

const handleRefresh = async () => {
  await Promise.all([
    loadProjectData(),
    loadOwnerMaterials(),
    loadSupplierMaterials()
  ])
  ElMessage.success('数据刷新成功')
}

const handleExportAll = async () => {
  try {
    exportLoading.value = true
    await exportToExcel({
      project: projectData.value,
      ownerMaterials: ownerMaterials.value,
      supplierMaterials: supplierMaterials.value
    }, `项目详情-${projectData.value.projectCode || 'project'}.xlsx`)
  } catch (error) {
    // 错误处理已在exportToExcel中处理
  } finally {
    exportLoading.value = false
  }
}

const handleExportOwnerMaterial = async () => {
  await exportToExcel(ownerMaterials.value, `甲供物资-${projectData.value.projectCode || 'project'}.xlsx`)
}

const handleExportSupplierMaterial = async () => {
  await exportToExcel(supplierMaterials.value, `乙供物资-${projectData.value.projectCode || 'project'}.xlsx`)
}

const handleExportContracts = async () => {
  await exportToExcel(projectData.value.contracts || [], `合同信息-${projectData.value.projectCode || 'project'}.xlsx`)
}

// 解析结果相关方法
const onParsingResultsLoaded = (data) => {
  parsingResultsData.value = data.data
  console.log('解析结果数据已加载:', data)
}

const onExportParsingResults = (exportData) => {
  handleExportParsingResults(exportData)
}

const handleExportParsingResults = async (exportData = null) => {
  try {
    const data = exportData?.data || parsingResultsData.value
    const filename = `解析结果-${projectData.value.projectCode || 'project'}.xlsx`
    await exportToExcel(data, filename)
  } catch (error) {
    ElMessage.error('导出解析结果失败')
  }
}

// const refreshParsingResults = () => {
//   if (analysisResultsTableRef.value) {
//     analysisResultsTableRef.value.refresh()
//   }
// }

// 分页处理
const handleOwnerMaterialSizeChange = (size) => {
  ownerMaterialPagination.pageSize = size
  ownerMaterialPagination.currentPage = 1
}

const handleOwnerMaterialCurrentChange = (page) => {
  ownerMaterialPagination.currentPage = page
}

const handleSupplierMaterialSizeChange = (size) => {
  supplierMaterialPagination.pageSize = size
  supplierMaterialPagination.currentPage = 1
}

const handleSupplierMaterialCurrentChange = (page) => {
  supplierMaterialPagination.currentPage = page
}

// 辅助方法
const getTagType = (key) => {
  const typeMap = {
    projectType: 'primary',
    contractType: 'success'
  }
  return typeMap[key] || 'info'
}



// 生命周期
onMounted(async () => {
  await Promise.all([
    loadProjectData(),
    loadOwnerMaterials(),
    loadSupplierMaterials()
  ])
})
</script>

<style scoped>
.project-detail-page {
  background: var(--theme-bg-primary);
  min-height: 100vh;
  padding: 24px;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin: 0;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.info-section {
  background: var(--theme-card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
}

.info-section:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--theme-border-secondary);
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

.info-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--theme-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: var(--theme-bg-hover);
  border-color: var(--theme-primary);
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--theme-card-hover-shadow);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.table-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.price-text {
  color: var(--theme-price-color);
  font-weight: 600;
}

.quantity-text {
  color: var(--theme-text-primary);
  font-weight: 500;
}

.progress-wrapper {
  padding: 4px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid var(--theme-border-secondary);
  margin-top: 16px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header-wrapper) {
  border-radius: 8px 8px 0 0;
}

:deep(.el-table .el-table__cell) {
  border-bottom: 1px solid var(--theme-border-primary);
  padding: 12px 0;
}

:deep(.el-table__header .el-table__cell) {
  background-color: var(--theme-bg-secondary);
  font-weight: 600;
  font-size: 13px;
  color: var(--theme-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--theme-primary);
}

:deep(.el-table__row:hover) {
  background-color: var(--theme-bg-hover) !important;
}

:deep(.el-tag) {
  font-weight: 600;
  border-radius: 6px;
  padding: 6px 12px;
  letter-spacing: 0.3px;
}

/* 合同信息区块样式 */
.contracts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contract-card {
  border: 2px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.contract-card.main-contract {
  border-color: var(--theme-primary);
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.15);
}

.contract-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--theme-border-secondary);
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.01));
}

.contract-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contract-tag {
  font-weight: 600;
}

.contract-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--theme-text-primary);
}

.contract-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.amount-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-primary);
}

.contract-content {
  padding: 24px;
}

.contract-basic-info {
  margin-bottom: 24px;
}

.contract-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.contract-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--theme-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
}

.contract-info-item:hover {
  background: var(--theme-bg-hover);
  border-color: var(--theme-primary);
}

.contract-info-item .info-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-secondary);
  min-width: 80px;
}

.contract-info-item .info-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--theme-text-primary);
  flex: 1;
}

.allocation-amount {
  color: var(--theme-price-color) !important;
  font-weight: 700 !important;
}

.related-projects {
  border-top: 1px solid var(--theme-border-secondary);
  padding-top: 20px;
}

.related-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0 0 16px 0;
}

.related-icon {
  font-size: 18px;
}

.related-projects-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-project-item {
  padding: 16px;
  background: var(--theme-bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--theme-card-border);
  transition: all 0.3s ease;
}

.related-project-item.current-project {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1), rgba(230, 162, 60, 0.05));
  border-color: #e6a23c;
}

.related-project-item:hover {
  transform: translateX(4px);
  border-color: var(--theme-primary);
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-allocation {
  font-size: 15px;
  font-weight: 700;
  color: var(--theme-price-color);
}

.allocation-ratio {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ratio-text {
  font-size: 12px;
  color: var(--theme-text-secondary);
  min-width: 60px;
}

.no-contracts {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minWidth(200px, 1fr));
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minWidth(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .project-detail-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px;
  }

  .header-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .contract-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }

  .contract-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .project-info {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .allocation-ratio {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-content {
    gap: 12px;
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .stat-value {
    font-size: 20px;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .project-detail-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 18px;
  }

  .info-section {
    padding: 16px;
  }

  .stats-cards {
    gap: 8px;
  }

  .stat-content {
    padding: 12px;
  }
}
</style>