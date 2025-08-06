<template>
  <div v-loading="loading" class="material-detail-page">
    <div class="page-header">
      <h2>乙供物资解析详情</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <div class="table-container">
      <!-- 动态表格组件 -->
      <DynamicTable
        :table-data="paginatedData"
        :dynamic-columns="currentColumns"
        :loading="loading"
        :show-actions="false"
        :show-pagination="false"
        height="auto"
        class="material-table"
        size="large"
      />
    </div>
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalDetails"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      class="modern-pagination"
    />
    
    <!-- 材料选择对话框 -->
    <MaterialSelectionDialog
      v-model="showSelectionDialog"
      :current-row="currentRow"
      @confirm="handleSelectionConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog'
import CozeService from '@/utils/coze.js'
import { useChatStore } from '@/stores/chat'
import MaterialService from '@/services/MaterialService.js'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { queryMaterialBaseInfo } from '@/utils/backendWorkflow'
import DynamicTable from '@/views/project-data-management/components/DynamicTable.vue'
import { generateDynamicColumns } from '@/views/project-data-management/utils.js'

const cozeService = new CozeService(import.meta.env.VITE_COZE_API_KEY)

const chatStore = useChatStore()
const workflowStore = useWorkflowStore()
const route = useRoute()
const router = useRouter()

const taskId = ref(route.params.taskId)
const detailId = ref(route.query.detailId)

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const showSelectionDialog = ref(false)
const currentRow = ref(null)

const showSelectionPageNum = ref(1)
const showSelectionPageSize = ref(10)
const showSelectionList = ref([])

const currentPage = ref(1)
const pageSize = ref(10)
const totalDetails = ref(0)

// 动态列配置
const currentColumns = computed(() => {
  return generateDynamicColumns('supplierMaterialDetail')
})

// 分页数据
const paginatedData = computed(() => {
  return tableData.value
})

// 分页处理
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchMaterialDetails(newPage, pageSize.value)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchMaterialDetails(currentPage.value, newSize)
}

// 数据获取
const fetchMaterialDetails = async (page = 1, size = 10) => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟乙供物资详情数据
    tableData.value = [
      {
        materialId: 'SM2024001',
        materialName: '电缆线材',
        specification: 'YJV22-3×240+1×120',
        unit: '米',
        quantity: 2000,
        estimatedPrice: 120,
        actualPrice: 115,
        totalCost: 230000,
        contractor: '电力工程有限公司',
        completionRate: 75,
        materialStatus: '施工中',
        remark: '按计划进行，预计本月底完成'
      },
      {
        materialId: 'SM2024002',
        materialName: '通风设备',
        specification: '轴流风机 φ800mm',
        unit: '台',
        quantity: 12,
        estimatedPrice: 8500,
        actualPrice: 8200,
        totalCost: 98400,
        contractor: '通风工程有限公司',
        completionRate: 85,
        materialStatus: '已完成',
        remark: '已验收合格'
      },
      {
        materialId: 'SM2024003',
        materialName: '电梯设备',
        specification: '客梯 1600kg 1.75m/s',
        unit: '部',
        quantity: 8,
        estimatedPrice: 350000,
        actualPrice: 340000,
        totalCost: 2720000,
        contractor: '电梯安装有限公司',
        completionRate: 60,
        materialStatus: '安装中',
        remark: '设备已到场，正在安装调试'
      }
    ]
    totalDetails.value = tableData.value.length
    
  } catch (error) {
    ElMessage.error('获取物资详情失败')
    console.error('Error fetching material details:', error)
  } finally {
    loading.value = false
  }
}

// 选择确认处理
const handleSelectionConfirm = (selectedMaterial) => {
  if (currentRow.value && selectedMaterial) {
    // 更新选中的材料信息
    Object.assign(currentRow.value, selectedMaterial)
    ElMessage.success('材料选择成功')
  }
  showSelectionDialog.value = false
}

const handleBack = () => {
  router.back()
}

// 页面初始化
onMounted(() => {
  if (taskId.value) {
    fetchMaterialDetails(currentPage.value, pageSize.value)
  }
})
</script>

<style scoped>
.material-detail-page {
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

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modern-pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-detail-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>