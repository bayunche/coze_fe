<template>
  <div v-loading="loading" class="owner-material-detail-page">
    <div class="page-header">
      <h2>甲供物资解析详情</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <!-- 项目信息卡片 -->
    <el-card class="project-info-card">
      <div class="card-item">
        <span class="label">项目名称:</span>
        <span class="value">{{ projectInfo.projectName }}</span>
      </div>
      <div class="card-item">
        <span class="label">项目编号:</span>
        <span class="value">{{ projectInfo.projectNumber }}</span>
      </div>
      <div class="card-item">
        <span class="label">任务状态:</span>
        <el-tag :type="getTaskStatusType(taskStatus)" size="small">
          {{ getTaskStatusText(taskStatus) }}
        </el-tag>
      </div>
      <div class="card-item">
        <span class="label">物资总数:</span>
        <span class="value">{{ totalDetails }}</span>
      </div>
    </el-card>

    <!-- 统计信息 -->
    <div class="statistics-container">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.totalQuantity }}</div>
          <div class="stat-label">总申领数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">¥{{ statistics.totalPrice.toFixed(2) }}</div>
          <div class="stat-label">预估总价值</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏪</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.supplierCount }}</div>
          <div class="stat-label">供应商数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.confirmedCount }}</div>
          <div class="stat-label">已确认物资</div>
        </div>
      </div>
    </div>

    <!-- 物资详情表格 -->
    <div class="table-container">
      <el-table 
        :data="paginatedData" 
        border 
        stripe 
        class="material-table"
        v-loading="loading"
        max-height="600px"
      >
        <el-table-column type="index" label="序号" width="60" fixed="left" />
        <el-table-column prop="materialId" label="物资编码" width="120" />
        <el-table-column prop="materialName" label="物资名称" min-width="160" />
        <el-table-column prop="specification" label="规格型号" min-width="140" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="quantity" label="申领数量" width="100" align="right">
          <template #default="{ row }">
            {{ formatNumber(row.quantity) }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="预估单价" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatPrice(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="预估总价" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatPrice(row.totalPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" min-width="120" />
        <el-table-column prop="deliveryDate" label="预期交付日期" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.confirmed ? 'success' : 'warning'" 
              size="small"
            >
              {{ row.confirmed ? '已确认' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalDetails"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        background
      />
    </div>

    <!-- 页面底部按钮 -->
    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button 
        type="warning" 
        @click="handleGoToAlign"
        v-if="hasUnconfirmedMaterials"
      >
        去对平
      </el-button>
      <el-button 
        type="primary" 
        @click="handleGenerateReport" 
        :loading="generating"
      >
        生成解析报告
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import OwnerMaterialService from '@/services/OwnerMaterialService'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const generating = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalDetails = ref(0)
const taskStatus = ref(0)

const projectInfo = ref({
  projectName: '项目名称占位',
  projectNumber: '项目编号占位'
})

// 获取任务ID
const taskId = computed(() => route.params.taskId)

// 计算统计信息
const statistics = computed(() => {
  return {
    totalQuantity: tableData.value.reduce((sum, item) => sum + (item.quantity || 0), 0),
    totalPrice: tableData.value.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    supplierCount: new Set(tableData.value.map(item => item.supplier).filter(Boolean)).size,
    confirmedCount: tableData.value.filter(item => item.confirmed).length
  }
})

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 是否有未确认物资
const hasUnconfirmedMaterials = computed(() => {
  return tableData.value.some(item => !item.confirmed)
})

// 方法
const getTaskStatusType = (status) => {
  const typeMap = {
    0: 'warning',  // 进行中
    1: 'success',  // 完成
    2: 'danger',   // 失败
    3: 'info'      // 待处理
  }
  return typeMap[status] || 'info'
}

const getTaskStatusText = (status) => {
  const textMap = {
    0: '进行中',
    1: '已完成',
    2: '失败',
    3: '待处理'
  }
  return textMap[status] || '未知'
}

const formatNumber = (number) => {
  if (number === null || number === undefined) return '0'
  return Number(number).toLocaleString()
}

const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.00'
  return Number(price).toFixed(2)
}

// 转换API数据为表格结构
const transformDataForTable = (data) => {
  return data.map((item, index) => ({
    id: item.id || `OM-${index + 1}`,
    materialId: item.baseDataId || `OM-${index + 1}`,
    materialName: item.baseMaterialName || item.materialName || '未知物资',
    specification: item.baseSpecificationModel || item.specifications || '/',
    unit: item.baseUnit || item.unit || '个',
    quantity: item.requisitionQuantity || item.quantity || 0,
    unitPrice: item.estimatedUnitPrice || item.unitPrice || 0,
    totalPrice: (item.requisitionQuantity || item.quantity || 0) * (item.estimatedUnitPrice || item.unitPrice || 0),
    supplier: item.supplierName || item.supplier || '待确定',
    deliveryDate: item.expectedDeliveryDate || item.deliveryDate || '/',
    confirmed: item.confirmed || false,
    remark: item.remark || item.notes || '/',
    originalData: item
  }))
}

// 加载项目信息
const loadProjectInfo = async () => {
  try {
    // 这里可以调用实际的API获取项目信息
    // const projectData = await queryTaskLinkProjectInfo(taskId.value)
    // projectInfo.value = projectData
    
    // 暂时使用模拟数据
    projectInfo.value = {
      projectName: '示例项目名称',
      projectNumber: `PROJ-${taskId.value}`
    }
  } catch (error) {
    console.error('获取项目信息失败:', error)
  }
}

// 加载详情数据
const loadDetailData = async (page = 1, size = 20) => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  loading.value = true
  try {
    const response = await OwnerMaterialService.queryMaterialsApplyData({
      taskDetailId: taskId.value,
      pageNum: page,
      pageSize: size
    })
    
    if (Array.isArray(response)) {
      const transformedData = transformDataForTable(response)
      tableData.value = transformedData
      totalDetails.value = transformedData.length
      
      // 模拟任务状态
      taskStatus.value = transformedData.every(item => item.confirmed) ? 1 : 0
    } else {
      // 如果没有数据，创建模拟数据用于展示
      const mockData = generateMockData()
      tableData.value = mockData
      totalDetails.value = mockData.length
      taskStatus.value = 0
    }
  } catch (error) {
    console.error('获取详情数据失败:', error)
    ElMessage.error('获取数据失败')
    
    // 错误时使用模拟数据
    const mockData = generateMockData()
    tableData.value = mockData
    totalDetails.value = mockData.length
    taskStatus.value = 0
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const mockMaterials = [
    { name: '钢筋', spec: 'HRB400 φ12', unit: '吨', price: 4500 },
    { name: '水泥', spec: 'P.O 42.5', unit: '吨', price: 480 },
    { name: '砂石', spec: '中砂', unit: '立方米', price: 120 },
    { name: '电缆', spec: 'YJV22-3×240+1×120', unit: '米', price: 85 },
    { name: '管材', spec: 'HDPE DN200', unit: '米', price: 45 }
  ]
  
  return mockMaterials.map((material, index) => {
    const quantity = Math.floor(Math.random() * 100) + 10
    const unitPrice = material.price + Math.floor(Math.random() * 200) - 100
    return {
      id: `OM-${index + 1}`,
      materialId: `MAT-${String(index + 1).padStart(3, '0')}`,
      materialName: material.name,
      specification: material.spec,
      unit: material.unit,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      supplier: `供应商${String.fromCharCode(65 + index)}`,
      deliveryDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      confirmed: Math.random() > 0.3,
      remark: Math.random() > 0.7 ? '重要物资' : '/',
      originalData: {}
    }
  })
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadDetailData(page, pageSize.value)
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadDetailData(1, size)
}

// 生成报告
const handleGenerateReport = () => {
  generating.value = true
  
  try {
    router.push({
      name: 'owner-material-report',
      params: { taskId: taskId.value },
      query: {
        projectName: projectInfo.value.projectName,
        projectNumber: projectInfo.value.projectNumber
      }
    })
  } finally {
    generating.value = false
  }
}

// 跳转到对平页面
const handleGoToAlign = () => {
  router.push({
    name: 'owner-material-align',
    params: { taskId: taskId.value }
  })
}

// 返回
const handleBack = () => {
  router.back()
}

// 页面初始化
onMounted(async () => {
  await Promise.all([
    loadProjectInfo(),
    loadDetailData()
  ])
})
</script>

<style scoped>
.owner-material-detail-page {
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.page-header h2 {
  margin: 0;
  color: #1a202c;
  font-size: 24px;
  font-weight: 600;
}

.project-info-card {
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.project-info-card :deep(.el-card__body) {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.card-item {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.card-item .label {
  font-weight: 600;
  color: #4a5568;
  margin-right: 8px;
}

.card-item .value {
  color: #1a202c;
  font-weight: 500;
}

.statistics-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 16px;
}

.material-table {
  width: 100%;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.page-footer {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-footer .el-button {
  margin: 0 8px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #f8fafc;
  color: #4a5568;
  font-weight: 600;
}

:deep(.el-table .el-table__row:hover > td) {
  background-color: #f0f9ff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .owner-material-detail-page {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .project-info-card :deep(.el-card__body) {
    flex-direction: column;
    gap: 12px;
  }
  
  .card-item {
    min-width: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .statistics-container {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .page-footer .el-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}
</style>