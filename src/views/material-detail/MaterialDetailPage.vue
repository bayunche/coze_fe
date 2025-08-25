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
      :data-list="materialSelectionList"
      :total="selectionTotal"
      :page-num="selectionPage"
      :page-size="selectionPageSize"
      :loading="selectionLoading"
      @select="handleMaterialSelection"
      @page-change="handleSelectionPageChange"
      @size-change="handleSelectionSizeChange"
      @search="handleSelectionSearch"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog'
import CozeService from '@/utils/coze.js'
import { useChatStore } from '@/stores/chat'
// import MaterialService from '@/services/MaterialService.js'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { queryMaterialBaseInfoWithPrices } from '@/utils/backendWorkflow'
import DynamicTable from '@/views/project-data-management/components/DynamicTable.vue'
import { generateDynamicColumns } from '@/views/project-data-management/utils.js'

// const cozeService = new CozeService(import.meta.env.VITE_COZE_API_KEY)

// const chatStore = useChatStore()
// const workflowStore = useWorkflowStore()
const route = useRoute()
const router = useRouter()

const taskId = ref(route.params.taskId)
// const detailId = ref(route.query.detailId)

const loading = ref(false)
// const saving = ref(false)
const tableData = ref([])
const showSelectionDialog = ref(false)
const currentRow = ref(null)

// 物资选择相关数据
const materialSelectionList = ref([])
const selectionTotal = ref(0)
const selectionPage = ref(1)
const selectionPageSize = ref(10)
const selectionLoading = ref(false)
const selectionSearchKeyword = ref('')

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
const fetchMaterialDetails = async (pageNum = 1, pageSize = 10) => {
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
// 加载物资选择数据
const loadMaterialSelectionData = async (keyword = '') => {
  selectionLoading.value = true
  try {
    const params = {
      page: selectionPage.value - 1,
      size: selectionPageSize.value
    }
    
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim()
    }
    
    const response = await queryMaterialBaseInfoWithPrices(params)
    if (response && response.data && response.data.content) {
      // 直接进行价格维度的扁平化，与MaterialSelectionDialog的formattedData逻辑一致
      const flattenedData = []
      
      response.data.content.forEach(item => {
        const materialBaseInfo = item.materialBaseInfo || {}
        const priceList = item.priceList || []
        
        // 如果有价格数据，每个价格创建一条记录
        if (priceList.length > 0) {
          priceList.forEach(price => {
            flattenedData.push({
              // 原始数据，包含物资和价格信息
              originalData: {
                materialBaseInfo,
                priceInfo: price,
                fullItem: item
              },
              
              // 物资信息
              materialName: materialBaseInfo.materialName || '-',
              specificationModel: materialBaseInfo.specificationModel || '-',
              unit: materialBaseInfo.unit || '-',
              type: materialBaseInfo.type || '-',
              materialCode: materialBaseInfo.materialCode || '-',
              
              // 价格信息
              taxPrice: price.taxPrice !== undefined && price.taxPrice !== null 
                ? parseFloat(price.taxPrice).toFixed(2) 
                : '0.00',
              quarter: price.quarter || '-',
              priceId: price.id,
              baseInfoId: price.baseInfoId,
              
              // 兼容旧格式的字段映射
              material_name: materialBaseInfo.materialName,
              specification_model: materialBaseInfo.specificationModel,
              tax_price: price.taxPrice,
              id: materialBaseInfo.id
            })
          })
        } else {
          // 如果没有价格数据，仍然创建一条记录但价格字段为空
          flattenedData.push({
            originalData: {
              materialBaseInfo,
              priceInfo: null,
              fullItem: item
            },
            
            materialName: materialBaseInfo.materialName || '-',
            specificationModel: materialBaseInfo.specificationModel || '-',
            unit: materialBaseInfo.unit || '-',
            type: materialBaseInfo.type || '-',
            materialCode: materialBaseInfo.materialCode || '-',
            
            taxPrice: '-',
            quarter: '-',
            priceId: null,
            baseInfoId: materialBaseInfo.id,
            
            material_name: materialBaseInfo.materialName,
            specification_model: materialBaseInfo.specificationModel,
            tax_price: null,
            id: materialBaseInfo.id
          })
        }
      })
      
      materialSelectionList.value = flattenedData
      selectionTotal.value = response.data.totalElements || 0
    } else {
      materialSelectionList.value = []
      selectionTotal.value = 0
    }
  } catch (error) {
    console.error('加载物资选择数据失败:', error)
    ElMessage.error('加载数据失败')
    materialSelectionList.value = []
    selectionTotal.value = 0
  } finally {
    selectionLoading.value = false
  }
}

// 处理物资选择
const handleMaterialSelection = (selectedMaterial) => {
  if (currentRow.value && selectedMaterial) {
    // 更新选中的材料信息
    Object.assign(currentRow.value, selectedMaterial)
    ElMessage.success('材料选择成功')
  }
  showSelectionDialog.value = false
}

// 处理分页变化
const handleSelectionPageChange = (page) => {
  selectionPage.value = page
  loadMaterialSelectionData(selectionSearchKeyword.value)
}

// 处理页大小变化
const handleSelectionSizeChange = (size) => {
  selectionPageSize.value = size
  selectionPage.value = 1
  loadMaterialSelectionData(selectionSearchKeyword.value)
}

// 处理搜索
const handleSelectionSearch = (keyword) => {
  selectionSearchKeyword.value = keyword
  selectionPage.value = 1
  loadMaterialSelectionData(keyword)
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