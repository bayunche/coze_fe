<template>
  <div class="owner-material-align-page">
    <div class="page-header">
      <h2>物资信息确认</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-container">
      <el-select
        v-model="selectedMatchStatus"
        placeholder="筛选匹配类型"
        clearable
        style="width: 200px"
      >
        <el-option label="全部" :value="null" />
        <el-option label="未匹配" :value="0" />
        <el-option label="精确匹配" :value="1" />
        <el-option label="相似匹配" :value="2" />
        <el-option label="历史匹配" :value="3" />
        <el-option label="人工指定" :value="4" />
      </el-select>
      
      <el-button 
        @click="handleBatchConfirm" 
        type="primary" 
        :disabled="!hasUnconfirmedSimilarMatches"
        style="margin-left: 10px"
      >
        批量确认相似匹配
      </el-button>
    </div>

    <!-- 主表格 -->
    <div class="main-table-container">
      <el-table 
        :data="paginatedMaterials" 
        border 
        stripe 
        class="material-table" 
        height="100%"
        v-loading="loading"
      >
        <!-- 领料单物资信息列 -->
        <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
        <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
        <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
        <el-table-column prop="requestUnit" label="领料单单位" min-width="80" />
        <el-table-column prop="requestQuantity" label="领料单数量" min-width="100" />

        <!-- 数据来源列 -->
        <el-table-column label="数据来源" min-width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.originalData?.sourceType === 'requisition' ? 'primary' : 'warning'"
              size="small"
            >
              {{ row.originalData?.sourceType === 'requisition' ? '申领' : '用料' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 匹配状态列 -->
        <el-table-column label="匹配类型" min-width="160">
          <template #default="{ row }">
            <div>
              <el-tag :type="getMatchingTagType(row.matchedType)" size="small">
                {{ getMatchingStatusText(row.matchedType) }}
              </el-tag>
              <div v-if="row.matchScore > 0" style="font-size: 12px; color: #666; margin-top: 2px">
                匹配度: {{ row.matchScore }}%
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 确认状态 -->
        <el-table-column label="确认状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.aligned ? 'success' : 'danger'" size="small">
              {{ row.aligned ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 数据库物资信息列 -->
        <el-table-column prop="dbCode" label="数据库物资编码" min-width="180" />
        <el-table-column prop="dbName" label="数据库物资名称" min-width="160" />
        <el-table-column prop="dbSpec" label="数据库规格型号" min-width="160" />
        <el-table-column prop="dbUnit" label="数据库单位" min-width="80" />

        <!-- 已选择物资列 -->
        <el-table-column label="已选择物资" min-width="200">
          <template #default="{ row }">
            <div v-if="row.selectedMaterial">
              <div><span class="label">编码:</span> {{ row.selectedMaterial.code }}</div>
              <div><span class="label">名称:</span> {{ row.selectedMaterial.material_name }}</div>
              <div><span class="label">规格:</span> {{ row.selectedMaterial.specification_model }}</div>
            </div>
            <div v-else-if="row.matchedType === 2 && !row.aligned">
              <div><span class="label">编码:</span> {{ row.dbCode }}</div>
              <div><span class="label">名称:</span> {{ row.dbName }}</div>
              <div><span class="label">规格:</span> {{ row.dbSpec }}</div>
              <el-tag type="warning" size="small" style="margin-top: 4px">待确认</el-tag>
            </div>
            <el-tag v-else-if="!row.aligned" type="danger" size="small">未选择</el-tag>
            <el-tag v-else type="success" size="small">已匹配</el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="180" v-if="hasUnalignedMaterials">
          <template #default="{ row }">
            <!-- 相似匹配的操作按钮 -->
            <div v-if="row.matchedType === 2 && !row.aligned">
              <el-button 
                type="success" 
                size="small" 
                @click="handleConfirmSimilarMaterial(row)"
                :loading="row.confirming"
              >
                确认匹配
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleSelectMaterial(row)" 
                style="margin-top: 4px"
              >
                重新选择
              </el-button>
            </div>
            <!-- 未匹配的操作按钮 -->
            <div v-else-if="row.matchedType === 0 && !row.aligned">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleSelectMaterial(row)"
              >
                选择物资
              </el-button>
            </div>
            <!-- 已确认的显示 -->
            <div v-else-if="row.aligned">
              <el-tag type="success" size="small">已确认</el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredMaterials.length"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-buttons" v-if="hasUnalignedMaterials">
      <el-button @click="handleBack">返回</el-button>
      <el-button 
        type="primary" 
        @click="handleSaveAlignment"
        :loading="saving"
        :disabled="!hasChanges"
      >
        保存对平结果
      </el-button>
    </div>

    <!-- 物资选择对话框 -->
    <MaterialSelectionDialog
      v-model="showSelectionDialog"
      :data-list="materialSearchResults"
      :total="materialSearchTotal"
      :page-num="materialSearchPage"
      :page-size="materialSearchSize"
      :loading="materialSearchLoading"
      @select="handleSelectionConfirm"
      @page-change="handleMaterialPageChange"
      @size-change="handleMaterialSizeChange"
      @search="handleMaterialSearch"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog'
import OwnerMaterialService from '@/services/OwnerMaterialService'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const materials = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const selectedMatchStatus = ref(null)
const showSelectionDialog = ref(false)
const currentRow = ref(null)

// 物资搜索相关状态
const materialSearchResults = ref([])
const materialSearchTotal = ref(0)
const materialSearchPage = ref(1)
const materialSearchSize = ref(10)
const materialSearchLoading = ref(false)
const materialSearchKeyword = ref('')

// 获取任务ID
const taskId = computed(() => route.params.taskId)

// 计算属性
const filteredMaterials = computed(() => {
  if (selectedMatchStatus.value === null) {
    return materials.value
  }
  return materials.value.filter(item => item.matchedType === selectedMatchStatus.value)
})

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMaterials.value.slice(start, end)
})

const hasUnalignedMaterials = computed(() => {
  return materials.value.some(item => !item.aligned)
})

const hasUnconfirmedSimilarMatches = computed(() => {
  return materials.value.some(item => item.matchedType === 2 && !item.aligned)
})

const hasChanges = computed(() => {
  return materials.value.some(item => item.aligned)
})

// 方法
const getMatchingTagType = (matchedType) => {
  const typeMap = {
    0: 'danger',    // 未匹配
    1: 'success',   // 精确匹配
    2: 'warning',   // 相似匹配
    3: 'info',      // 历史匹配
    4: 'primary'    // 人工指定
  }
  return typeMap[matchedType] || 'info'
}

const getMatchingStatusText = (matchedType) => {
  const textMap = {
    0: '未匹配',
    1: '精确匹配',
    2: '相似匹配',
    3: '历史匹配',
    4: '人工指定'
  }
  return textMap[matchedType] || '未知'
}

// 加载数据 - 使用新的API接口加载未匹配的对平结果
const loadMaterials = async () => {
  if (!taskId.value) {
    ElMessage.error('缺少任务ID')
    return
  }

  loading.value = true
  try {
    // 使用新的API接口查询未匹配的甲供物资对平结果
    const result = await OwnerMaterialService.queryUnmatchedBalanceResult({
      taskId: taskId.value,
      page: 0,
      size: 1000  // 先获取所有数据，在前端处理分页
    })
    
    if (result && result.content) {
      // 转换API返回的数据结构为页面所需格式
      materials.value = result.content.map((item, index) => ({
        // 基础信息
        id: item.id || index,
        balanceResultId: item.id, // 用于人工匹配
        
        // 申领/用料信息（来自源数据）
        requestCode: extractMaterialCode(item),
        requestName: item.materialName || '未知物资',
        requestSpec: item.specificationModel || '规格未知',
        requestUnit: item.unit || '个',
        requestQuantity: item.requisitionQuantity || 0,
        
        // 匹配状态信息
        matchedType: getMatchedType(item.balanceStatus),
        matchScore: 0, // API中没有匹配度字段，默认为0
        aligned: item.balanceStatus !== 'UNMATCHED',
        
        // 数据库物资信息（目前为空，需要用户手动选择）
        dbCode: '',
        dbName: '',
        dbSpec: '',
        dbUnit: '',
        
        // 已选择的物资（如果有匹配）
        selectedMaterial: null,
        
        // 原始数据
        originalData: item,
        
        // UI状态
        confirming: false
      }))
    } else {
      materials.value = []
    }
  } catch (error) {
    console.error('加载物资数据失败:', error)
    ElMessage.error('加载数据失败')
    materials.value = []
  } finally {
    loading.value = false
  }
}

// 从源数据中提取物资编码
const extractMaterialCode = (item) => {
  // 优先从申领记录中获取编码
  if (item.sourceRequisitions && item.sourceRequisitions.length > 0) {
    return item.sourceRequisitions[0].materialCode || '申领编码未知'
  }
  // 其次从用料记录中获取
  if (item.sourceUsages && item.sourceUsages.length > 0) {
    return item.sourceUsages[0].materialCode || '用料编码未知'
  }
  return '编码未知'
}

// 根据balanceStatus转换匹配类型
const getMatchedType = (balanceStatus) => {
  switch (balanceStatus) {
    case 'UNMATCHED':
      return 0 // 未匹配
    case 'MANUAL_MATCH_PENDING':
      return 4 // 人工指定
    case 'BALANCED':
      return 1 // 精确匹配（已对平）
    default:
      return 0 // 默认未匹配
  }
}

// 确认相似匹配
const handleConfirmSimilarMaterial = async (row) => {
  row.confirming = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    row.aligned = true
    row.selectedMaterial = {
      code: row.dbCode,
      material_name: row.dbName,
      specification_model: row.dbSpec
    }
    
    ElMessage.success('确认成功')
  } catch (error) {
    console.error('确认失败:', error)
    ElMessage.error('确认失败')
  } finally {
    row.confirming = false
  }
}

// 批量确认相似匹配
const handleBatchConfirm = async () => {
  const similarMatches = materials.value.filter(item => item.matchedType === 2 && !item.aligned)
  
  if (similarMatches.length === 0) {
    ElMessage.warning('没有待确认的相似匹配物资')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量确认 ${similarMatches.length} 个相似匹配的物资吗？`,
      '批量确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    for (const item of similarMatches) {
      await handleConfirmSimilarMaterial(item)
    }
    
    ElMessage.success(`批量确认完成，共确认 ${similarMatches.length} 个物资`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量确认失败:', error)
      ElMessage.error('批量确认失败')
    }
  }
}

// 选择物资 - 打开物资选择对话框并加载初始数据
const handleSelectMaterial = (row) => {
  currentRow.value = row
  showSelectionDialog.value = true
  
  // 重置搜索状态
  materialSearchKeyword.value = ''
  materialSearchPage.value = 1
  
  // 加载初始物资数据
  loadBaseMaterials()
}

// 物资选择确认 - 使用人工匹配API
const handleSelectionConfirm = async (selectedMaterial) => {
  if (!currentRow.value || !selectedMaterial) {
    showSelectionDialog.value = false
    return
  }

  try {
    // 调用人工匹配API
    const result = await OwnerMaterialService.manualMatch({
      balanceResultId: currentRow.value.balanceResultId,
      baseDataId: selectedMaterial.id
    })

    if (result.success) {
      // 更新本地数据
      currentRow.value.selectedMaterial = selectedMaterial
      currentRow.value.aligned = true
      currentRow.value.matchedType = 4 // 人工指定
      
      // 更新数据库物资信息字段
      currentRow.value.dbCode = selectedMaterial.materialCode || selectedMaterial.code || ''
      currentRow.value.dbName = selectedMaterial.materialName || selectedMaterial.material_name || ''
      currentRow.value.dbSpec = selectedMaterial.specificationModel || selectedMaterial.specification_model || ''
      currentRow.value.dbUnit = selectedMaterial.unit || ''
      
      ElMessage.success(result.message || '物资匹配成功')
    } else {
      ElMessage.error(result.message || '物资匹配失败')
    }
  } catch (error) {
    console.error('物资匹配失败:', error)
    ElMessage.error('物资匹配失败')
  }

  showSelectionDialog.value = false
}

// 加载基础物资数据
const loadBaseMaterials = async () => {
  materialSearchLoading.value = true
  try {
    const result = await OwnerMaterialService.searchBaseMaterials({
      keyword: materialSearchKeyword.value,
      page: materialSearchPage.value - 1, // API使用0开始的页码
      size: materialSearchSize.value
    })
    
    if (result && result.content) {
      // 转换数据格式以适配MaterialSelectionDialog组件
      materialSearchResults.value = result.content.map(item => ({
        // 保持原始数据结构
        ...item,
        
        // 为兼容性添加的字段映射
        material_name: item.materialName,
        specification_model: item.specificationModel,
        
        // 模拟价格信息（如果API没有返回价格数据）
        priceList: [],
        materialBaseInfo: item
      }))
      materialSearchTotal.value = result.totalElements || 0
    } else {
      materialSearchResults.value = []
      materialSearchTotal.value = 0
    }
  } catch (error) {
    console.error('加载基础物资数据失败:', error)
    ElMessage.error('加载物资数据失败')
    materialSearchResults.value = []
    materialSearchTotal.value = 0
  } finally {
    materialSearchLoading.value = false
  }
}

// 处理物资搜索
const handleMaterialSearch = (keyword) => {
  materialSearchKeyword.value = keyword
  materialSearchPage.value = 1
  loadBaseMaterials()
}

// 处理分页变化
const handleMaterialPageChange = (page) => {
  materialSearchPage.value = page
  loadBaseMaterials()
}

// 处理页大小变化
const handleMaterialSizeChange = (size) => {
  materialSearchSize.value = size
  materialSearchPage.value = 1
  loadBaseMaterials()
}

// 保存对平结果
const handleSaveAlignment = async () => {
  const alignedMaterials = materials.value.filter(item => item.aligned)
  
  if (alignedMaterials.length === 0) {
    ElMessage.warning('没有确认的物资')
    return
  }

  saving.value = true
  try {
    const params = {
      taskId: taskId.value,
      materials: alignedMaterials.map(item => ({
        id: item.id,
        selectedMaterial: item.selectedMaterial,
        aligned: item.aligned
      }))
    }
    
    await OwnerMaterialService.alignMaterials(params)
    ElMessage.success('保存成功')
    
    // 跳转到详情页面
    router.push({
      name: 'owner-material-detail',
      params: { taskId: taskId.value }
    })
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 分页处理
const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 返回
const handleBack = () => {
  router.back()
}

// 监听筛选变化
watch(selectedMatchStatus, () => {
  currentPage.value = 1
})

// 页面初始化
onMounted(() => {
  loadMaterials()
})
</script>

<style scoped>
.owner-material-align-page {
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

.filter-container {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.main-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 16px;
}

.material-table {
  width: 100%;
}

.label {
  font-weight: 600;
  color: #4a5568;
  margin-right: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.action-buttons {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.action-buttons .el-button {
  margin: 0 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .owner-material-align-page {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-container {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .action-buttons .el-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}
</style>