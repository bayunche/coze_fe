<template>
  <div class="owner-material-align-page">
    <div class="page-header">
      <h2>物资信息确认</h2>
      <el-button
        type="primary"
        @click="handleManualConfirmClick"
        style="float: right; margin-left: 20px"
        :loading="isLoading"
      >
        人工确认
      </el-button>
    </div>

    <el-table
      :data="paginatedMaterials"
      border
      stripe
      style="width: 100%; margin-top: 20px"
      class="material-table"
    >
      <!-- 领料单物资信息列 -->
      <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
      <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
      <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
      <el-table-column prop="requestUnit" label="领料单单位" min-width="120" />
      <el-table-column prop="requestQuantity" label="领料单数量" min-width="100" />

      <!-- 拉平状态列 -->
      <el-table-column label="拉平状态" min-width="140">
        <template #default="{ row }">
          <el-tag :type="row.aligned ? 'success' : 'danger'">
            {{ row.aligned ? '已拉平' : '未拉平待人工介入' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 数据库物资信息列 -->
      <el-table-column prop="dbCode" label="数据库物资编码" min-width="140" />
      <el-table-column prop="dbName" label="数据库物资名称" min-width="160" />
      <el-table-column prop="dbSpec" label="数据库规格型号" min-width="140" />
      <el-table-column prop="dbUnit" label="数据库单位" min-width="80" />
      <el-table-column prop="dbQuantity" label="数据库数量" min-width="100" />
    </el-table>
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      class="modern-pagination"
    />

    <el-dialog
      v-model="showManualConfirmDialog"
      title="未对平物资确认"
      width="80%"
      :before-close="handleDialogClose"
      v-loading="isLoading"
    >
      <el-table
        :data="paginatedUnalignedMaterials"
        border
        stripe
        style="width: 100%"
        class="manual-confirm-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
        <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
        <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
        <el-table-column prop="requestUnit" label="领料单位" min-width="100" />
        <el-table-column prop="requestQuantity" label="领料数量" min-width="100" />

        <!-- 新增已选择物资信息列 -->
        <el-table-column label="已选择物资" min-width="200">
          <template #default="{ row }">
            <div v-if="row.dbCode">
              <div><span class="label">编码:</span> {{ row.dbCode }}</div>
              <div><span class="label">名称:</span> {{ row.dbName }}</div>
              <div><span class="label">规格:</span> {{ row.dbSpec }}</div>
            </div>
            <el-tag v-else type="danger" size="small">未选择</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220">
          <template #default="{ row, $index }">
            <el-button
              :type="row.dbCode ? 'success' : 'primary'"
              size="small"
              @click="handleSelectDbMaterial(row, $index)"
            >
              {{ row.dbCode ? '重新选择' : '选择数据库物资' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="unalignedMaterials.length"
        :page-size="manualConfirmPageSize"
        :current-page="manualConfirmCurrentPage"
        @current-change="handleManualConfirmPageChange"
        @size-change="handleManualConfirmSizeChange"
        class="modern-pagination"
      />
      <template v-slot:footer>
        <el-button @click="showManualConfirmDialog = false">关闭</el-button>
        <el-button @click="handleSaveMaterial">保存对平物资信息</el-button>
      </template>
    </el-dialog>
    <!-- 引入数据库物资选择弹窗 -->
    <MaterialSelectionDialog
      v-model:modelValue="showDbMaterialDialog"
      :data-list="dbMaterialList"
      :total="dbMaterialTotal"
      :page-num="dbMaterialPageNum"
      :page-size="dbMaterialPageSize"
      :loading="dbMaterialLoading"
      @select="handleDbMaterialSelect"
      @page-change="handleDbMaterialPageChange"
      @size-change="handleDbMaterialSizeChange"
      @search="handleDbMaterialSearch"
      style="z-index: 9999"
    />
    <!-- 新增保存按钮 -->
    <div class="save-button-container">
      <el-button type="primary" @click="handleSaveClick" :loading="isSaving" size="large">
        保存物资信息
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { useOwnerMaterialStore } from '@/stores/ownerMaterial'
import {
  queryBalanceResult,
  queryUnmatchedBalanceResult,
  manualMatch
} from '@/utils/backendWorkflow' // 导入接口
import { ElTable, ElTableColumn, ElTag, ElSelect, ElOption } from 'element-plus'
import { ElDialog } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog.vue'
import CozeWorkflowService from '@/services/CozeWorkflowService'

const router = useRouter()
const route = useRoute()
const ownerMaterialStore = useOwnerMaterialStore()

// 初始化 Coze 工作流服务
const cozeWorkflowService = new CozeWorkflowService()

// --- 状态和数据管理 ---
const allMaterials = ref([]) // 存储从后端获取的所有数据
const unalignedMaterials = ref([]) // 存储需要手动对平的数据
const isLoading = ref(false)
const isSaving = ref(false)

const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)

// 主表格的分页数据
const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allMaterials.value.slice(start, end)
})

// --- 弹窗相关 ---
const showManualConfirmDialog = ref(false)
const manualConfirmPageSize = ref(5)
const manualConfirmCurrentPage = ref(1)
const paginatedUnalignedMaterials = computed(() => {
  const start = (manualConfirmCurrentPage.value - 1) * manualConfirmPageSize.value
  const end = start + manualConfirmPageSize.value
  return unalignedMaterials.value.slice(start, end)
})

// --- 数据库物资选择弹窗相关 ---
const showDbMaterialDialog = ref(false)
const dbMaterialList = ref([])
const dbMaterialTotal = ref(0)
const dbMaterialPageNum = ref(1)
const dbMaterialPageSize = ref(10)
const dbMaterialLoading = ref(false)
const dbMaterialSearch = ref('')
const currentEditingRow = ref(null)

// --- 枚举值 ---
const BalanceStatusEnum = {
  BALANCED: 'BALANCED',
  UNRETURNED: 'UNRETURNED',
  DATA_MISSING: 'DATA_MISSING',
  UNMATCHED: 'UNMATCHED'
}

// --- 数据获取和处理 ---
const fetchData = async () => {
  isLoading.value = true
  try {
    // 优先从store中获取taskId，如果获取不到则从URL中解析
    const taskId = ownerMaterialStore.alignmentTask.taskId || route.query.taskId
    if (!taskId) {
      ElMessage.error('缺少任务ID，无法加载数据。')
      return
    }
    // 注意：这里假设一次性获取所有数据，如果数据量大需要后端支持分页
    const response = await queryBalanceResult({ taskId, page: 0, size: 1000 }) // 获取足够多的数据
    if (response && response.data && response.data.content) {
      transformAndSetData(response.data.content)
      total.value = allMaterials.value.length
      ElMessage.success('数据加载成功！')
    } else {
      ElMessage.info('未查询到相关数据。')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error(`加载数据失败: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

const transformAndSetData = (data) => {
  const transformed = data.map((item) => {
    const aligned = item.balanceStatus !== BalanceStatusEnum.UNMATCHED
    console.log('拉平状态', aligned)
    console.log('对平状态', item.balanceStatus)
    // 假设申领数据和实际使用数据都只取第一个作为代表
    const requisition =
      item.sourceRequisitions && item.sourceRequisitions[0] ? item.sourceRequisitions[0] : {}
    const usage = item.sourceUsages && item.sourceUsages[0] ? item.sourceUsages[0] : {}

    return {
      id: item.id,
      // 领料单信息 (来自申领数据)
      requestCode: requisition.materialCategoryCode || '/',
      requestName: requisition.materialName || item.materialName, // 优先用申领的，其次用对平结果的
      requestSpec: requisition.specificationModel || item.specificationModel,
      requestUnit: requisition.unit || item.unit,
      requestQuantity: requisition.requisitionQuantity || item.requisitionQuantity,
      // 拉平状态
      aligned: aligned,
      balanceStatus: item.balanceStatus,
      // 数据库物资信息 (来自实际使用数据或对平结果)
      dbCode: usage.baseDataId || item.baseDataId || '/',
      dbName: usage.materialName || item.materialName,
      dbSpec: usage.specificationModel || item.specificationModel,
      dbUnit: usage.unit || item.unit,
      dbQuantity: usage.useCount || item.actualUsageQuantity,
      // 原始数据，用于后续操作
      originalData: item
    }
  })

  allMaterials.value = transformed
  unalignedMaterials.value = transformed.filter((item) => !item.aligned)
}

onMounted(() => {
  fetchData()
})

// --- 分页处理 ---
function handlePageChange(page) {
  currentPage.value = page
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

// 新增行样式方法
const getRowClassName = ({ row }) => {
  return row.dbCode && row.dbCode !== '/' ? 'selected-row' : ''
}

function handleDialogClose(done) {
  showManualConfirmDialog.value = false
  done()
}

const handleManualConfirmClick = async () => {
  isLoading.value = true
  try {
    const taskId = route.query.taskId
    if (!taskId) {
      ElMessage.error('缺少任务ID，无法加载数据。')
      return
    }
    const response = await queryUnmatchedBalanceResult({ taskId, page: 0, size: 1000 })
    if (response && response.data && response.data.content && response.data.content.length > 0) {
      // 转换数据以适应弹窗表格，使用新的响应格式
      unalignedMaterials.value = response.data.content.map((item) => {
        // 获取第一个申领信息作为基础数据
        const firstRequisition =
          item.sourceRequisitions && item.sourceRequisitions[0] ? item.sourceRequisitions[0] : {}

        return {
          id: item.id,
          requestCode: firstRequisition.materialCategoryCode || item.taskDetailId, // 优先使用物资分类编码
          requestName: firstRequisition.materialName || item.materialName,
          requestSpec: firstRequisition.specificationModel || item.specificationModel,
          requestUnit: firstRequisition.unit || item.unit,
          requestQuantity: firstRequisition.requisitionQuantity || item.requisitionQuantity,
          dbCode: null, // 初始化为空
          dbName: null,
          dbSpec: null,
          originalData: item
        }
      })
      manualConfirmCurrentPage.value = 1 // 重置弹窗分页
      showManualConfirmDialog.value = true
    } else {
      ElMessage.success('所有物资均已对平！')
    }
  } catch (error) {
    console.error('加载未对平数据失败:', error)
    ElMessage.error(`加载未对平数据失败: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

function handleManualConfirmPageChange(page) {
  manualConfirmCurrentPage.value = page
}

function handleManualConfirmSizeChange(size) {
  manualConfirmPageSize.value = size
  manualConfirmCurrentPage.value = 1
}

// 选择数据库物资按钮事件
function handleSelectDbMaterial(row, index) {
  console.log('点击选择数据库物资按钮', row)
  currentEditingRow.value = row
  dbMaterialSearch.value = ''
  dbMaterialPageNum.value = 1

  // 调用真实的数据加载函数
  fetchDbMaterialList(1, dbMaterialPageSize.value)

  showDbMaterialDialog.value = true
  console.log('弹窗状态:', showDbMaterialDialog.value)
}

// TODO: 实现真实数据库物资列表加载
const fetchDbMaterialList = async (
  pageNum = dbMaterialPageNum.value,
  pageSize = dbMaterialPageSize.value,
  searchTerm = ''
) => {
  dbMaterialLoading.value = true
  try {
    // 使用与乙供物资解析详情相同的工作流ID: 7519455533105184809
    const workflowId = '7519455533105184809'
    const params = {
      pageNum: pageNum,
      pageSize: pageSize
    }

    // 如果有搜索条件，添加到参数中
    if (searchTerm && searchTerm.trim()) {
      params.searchTerm = searchTerm.trim()
    }

    console.log('调用数据库物资查询工作流，参数：', params)

    const result = await cozeWorkflowService.runWorkflow(workflowId, params)

    if (result && result.data) {
      // 解析返回的数据 - 新格式是字符串形式的JSON，需要先解析
      let parsedData
      if (typeof result.data === 'string') {
        parsedData = JSON.parse(result.data)
      } else {
        parsedData = result.data
      }

      console.log('数据库物资查询结果：', parsedData)

      // 根据新的返回数据结构适配 - data.output 是物资数组
      if (parsedData && Array.isArray(parsedData.output)) {
        // 格式化数据以匹配 MaterialSelectionDialog 组件的期望格式
        dbMaterialList.value = parsedData.output.map((item) => ({
          id: item.p_id || item.m_id, // 使用 p_id 作为唯一标识
          material_name: item.material_name,
          specification_model: item.specification_model,
          tax_price: item.tax_price,
          quarter: item.quarter,
          unit: item.unit,
          code: item.material_code,
          // 保留原始数据
          originalData: item
        }))

        dbMaterialTotal.value = parsedData.count || parsedData.output.length

        ElMessage.success(`成功加载 ${dbMaterialList.value.length} 条数据库物资数据`)
      } else if (parsedData && parsedData.result && Array.isArray(parsedData.result)) {
        // 兼容旧格式
        dbMaterialList.value = parsedData.result.map((item) => ({
          id: item.id,
          material_name: item.ymtd_material_name || item.material_name || item.materialName,
          specification_model:
            item.ymtd_specification_model || item.specification_model || item.specificationModel,
          tax_price: item.ymtd_tax_price || item.tax_price || item.taxPrice,
          quarter: item.ymtd_quarter || item.quarter,
          unit: item.ymtd_unit || item.unit,
          code: item.ymtd_code || item.code || item.materialCode,
          originalData: item
        }))

        dbMaterialTotal.value =
          parsedData.totalCount || parsedData.total || parsedData.result.length

        ElMessage.success(`成功加载 ${dbMaterialList.value.length} 条数据库物资数据`)
      } else if (parsedData && Array.isArray(parsedData)) {
        // 如果直接返回数组（兼容旧格式）
        dbMaterialList.value = parsedData.map((item) => ({
          id: item.id,
          material_name: item.ymtd_material_name || item.material_name || item.materialName,
          specification_model:
            item.ymtd_specification_model || item.specification_model || item.specificationModel,
          tax_price: item.ymtd_tax_price || item.tax_price || item.taxPrice,
          quarter: item.ymtd_quarter || item.quarter,
          unit: item.ymtd_unit || item.unit,
          code: item.ymtd_code || item.code || item.materialCode,
          originalData: item
        }))

        dbMaterialTotal.value = parsedData.length

        ElMessage.success(`成功加载 ${dbMaterialList.value.length} 条数据库物资数据`)
      } else {
        console.warn('未识别的数据格式：', parsedData)
        dbMaterialList.value = []
        dbMaterialTotal.value = 0
        ElMessage.info('未查询到相关数据')
      }
    } else {
      console.warn('工作流返回数据为空')
      dbMaterialList.value = []
      dbMaterialTotal.value = 0
      ElMessage.info('未查询到相关数据')
    }
  } catch (error) {
    console.error('加载数据库物资列表失败:', error)
    ElMessage.error(`加载数据库物资列表失败: ${error.message}`)
    dbMaterialList.value = []
    dbMaterialTotal.value = 0
  } finally {
    dbMaterialLoading.value = false
  }
}

// 保存对平物资信息
async function handleSaveMaterial() {
  try {
    // 检查是否有需要保存的未对平物资
    const materialsToSave = unalignedMaterials.value.filter(
      (material) => material.dbCode && material.originalData && material.originalData.id
    )

    if (materialsToSave.length === 0) {
      ElMessage.warning('没有可保存的物资匹配信息')
      return
    }

    // 确认保存操作
    await ElMessageBox.confirm(
      `确认保存 ${materialsToSave.length} 个物资的匹配信息？`,
      '确认保存',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 开始保存流程
    let successCount = 0
    let failureCount = 0
    const errors = []

    ElMessage.info(`开始保存 ${materialsToSave.length} 个物资匹配信息...`)

    // 逐个调用人工匹配API
    for (let i = 0; i < materialsToSave.length; i++) {
      const material = materialsToSave[i]
      console.log(`正在保存第 ${i + 1}/${materialsToSave.length} 个物资:`, material.requestName)
      console.log('原始数据:', material.originalData)
      try {
        // 调用人工匹配API
        const matchData = {
          balanceResultId: material.originalData.id,
          baseDataId:
            material.originalData.selectedBaseData.originalData?.m_id ||
            material.originalData.selectedBaseData?.code ||
            material.dbCode
        }

        console.log(`保存第 ${i + 1}/${materialsToSave.length} 个物资匹配:`, {
          materialName: material.requestName,
          matchData
        })

        await manualMatch(matchData)
        successCount++

        // 更新本地状态
        const index = unalignedMaterials.value.findIndex((item) => item.id === material.id)
        if (index !== -1) {
          unalignedMaterials.value[index].aligned = true
        }

        // 同时更新主表格数据
        const mainIndex = allMaterials.value.findIndex((item) => item.id === material.id)
        if (mainIndex !== -1) {
          allMaterials.value[mainIndex].aligned = true
        }
      } catch (error) {
        console.error(`保存物资 "${material.requestName}" 匹配信息失败:`, error)
        failureCount++
        errors.push(`${material.requestName}: ${error.message}`)
      }
    }

    // 显示保存结果
    if (successCount > 0 && failureCount === 0) {
      ElMessage.success(`成功保存 ${successCount} 个物资匹配信息！`)
      showManualConfirmDialog.value = false

      // 重新加载主表格数据以同步最新状态
      await fetchData()
    } else if (successCount > 0 && failureCount > 0) {
      ElMessage.warning(`保存完成：成功 ${successCount} 个，失败 ${failureCount} 个`)

      // 显示详细错误信息
      if (errors.length > 0) {
        await ElMessageBox.alert(
          errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...' : ''),
          '部分保存失败',
          { confirmButtonText: '确定', type: 'warning' }
        )
      }
    } else {
      ElMessage.error(`所有物资匹配信息保存失败`)
      if (errors.length > 0) {
        await ElMessageBox.alert(
          errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...' : ''),
          '保存失败',
          { confirmButtonText: '确定', type: 'error' }
        )
      }
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消保存操作')
    } else if (error.message !== 'cancel') {
      // 用户取消操作
      console.error('保存物资匹配信息失败:', error)
      ElMessage.error(`保存物资匹配信息失败: ${error.message}`)
    }
  }
}

// 分页/搜索事件
function handleDbMaterialPageChange(page) {
  dbMaterialPageNum.value = page
  fetchDbMaterialList(page, dbMaterialPageSize.value, dbMaterialSearch.value)
}

function handleDbMaterialSizeChange(size) {
  dbMaterialPageSize.value = size
  dbMaterialPageNum.value = 1
  fetchDbMaterialList(1, size, dbMaterialSearch.value)
}

// 处理搜索事件
function handleDbMaterialSearch(searchTerm) {
  dbMaterialSearch.value = searchTerm
  // 搜索逻辑在 watch 中处理，这里只更新搜索词
}

// 选择数据库物资后覆盖当前行
function handleDbMaterialSelect(selected) {
  if (currentEditingRow.value && selected) {
    // 找到未对平物资列表中的对应项
    const unalignedIndex = unalignedMaterials.value.findIndex(
      (m) => m.id === currentEditingRow.value.id
    )
    if (unalignedIndex !== -1) {
      // 更新未对平物资列表中的数据
      unalignedMaterials.value[unalignedIndex].dbCode = selected.code || selected.id
      unalignedMaterials.value[unalignedIndex].dbName = selected.material_name
      unalignedMaterials.value[unalignedIndex].dbSpec = selected.specification_model
      unalignedMaterials.value[unalignedIndex].dbUnit = selected.unit

      // 保存选择的物资的完整信息，用于后续的 baseDataId
      if (!unalignedMaterials.value[unalignedIndex].originalData) {
        unalignedMaterials.value[unalignedIndex].originalData = {}
      }
      unalignedMaterials.value[unalignedIndex].originalData.selectedBaseData = selected

      console.log('物资选择完成:', {
        materialName: unalignedMaterials.value[unalignedIndex].requestName,
        selectedMaterial: selected,
        updatedItem: unalignedMaterials.value[unalignedIndex]
      })
    }

    // 同时更新主表格数据
    const material = allMaterials.value.find((m) => m.id === currentEditingRow.value.id)
    if (material) {
      material.dbCode = selected.code || selected.id
      material.dbName = selected.material_name
      material.dbSpec = selected.specification_model
      material.dbUnit = selected.unit
      material.aligned = false // 仅选择了但尚未保存，所以还未对平
    }
  }
  showDbMaterialDialog.value = false
}

// 搜索事件 - 添加防抖处理
let searchTimeout = null
watch(dbMaterialSearch, (newVal) => {
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // 设置新的定时器，300ms后执行搜索
  searchTimeout = setTimeout(() => {
    dbMaterialPageNum.value = 1 // 重置到第一页
    fetchDbMaterialList(1, dbMaterialPageSize.value, newVal)
  }, 300)
})
// 检查所有物资是否已拉平
function checkAllAligned() {
  return allMaterials.value.every((material) => material.aligned)
}

// 保存按钮点击事件
async function handleSaveClick() {
  if (!checkAllAligned()) {
    await ElMessageBox.alert('存在未拉平的物资信息，请先完成所有物资拉平操作', '无法保存', {
      confirmButtonText: '确定',
      type: 'warning'
    })
    return
  }

  isSaving.value = true
  try {
    // TODO: 实现真实保存逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用
    ElMessage.success('物资信息保存成功')
    ownerMaterialStore.markAsReadyForAlignment()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
  router.push('/home')
}
</script>

<style scoped>
/* 新增行样式 */
.manual-confirm-table :deep(.selected-row) {
  --el-table-tr-bg-color: #f0f9eb;
}
.manual-confirm-table :deep(.selected-row:hover) {
  --el-table-tr-bg-color: #e1f3d8;
}
.label {
  color: #666;
  margin-right: 5px;
}

.owner-material-align-page {
  --primary-color: #4f46e5; /* 靛蓝色 */
  --secondary-color: #64748b; /* 石板灰 */
  --accent-color: #3730a3; /* 深靛蓝主题色 */
  --success-color: #0d9488; /* 青蓝绿色（更柔和的成功色） */
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
  overflow-x: hidden; /* 防止水平滚动条 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  color: var(--accent-color);
  font-weight: 700;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px var(--shadow-color);
}

.page-header h2::before {
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

.project-info-card {
  margin-bottom: 24px;
  padding: 20px 30px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  display: flex;
  gap: 40px;
  align-items: center;
  border: 1px solid var(--border-color);
  max-width: 900px;
  align-self: center;
  transition: all 0.3s ease-in-out;
}

.project-info-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 25px rgba(0, 123, 255, 0.15);
  border-color: var(--accent-color);
}

.card-item {
  display: flex;
  align-items: center;
}

.card-item .label {
  font-weight: 500;
  color: var(--text-light);
  margin-right: 20px;
  min-width: 120px;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.card-item .value {
  color: var(--accent-color);
  font-size: 18px;
  font-weight: 700;
  background-color: rgba(0, 123, 255, 0.03);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 123, 255, 0.1);
  box-shadow: inset 0 0 3px rgba(0, 123, 255, 0.05);
  transition: all 0.3s ease;
}

.card-item .value:hover {
  background-color: rgba(0, 123, 255, 0.08);
  box-shadow: inset 0 0 8px rgba(0, 123, 255, 0.2);
}

.material-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
  flex-grow: 1;
  background-color: var(--card-background); /* 表格背景 */
  border: 1px solid var(--border-color);
}

.material-table :deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  font-size: 15px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 14px 0;
  text-shadow: none;
}

.material-table :deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: var(--text-dark);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.material-table :deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

.material-table :deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 0;
  text-align: center;
}
.save-button-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
}

.save-button-container .el-button {
  padding: 12px 24px;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.save-button-container .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* 按钮样式优化 */
.page-header .el-button,
.save-button-container .el-button {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

/* 加载动画优化 */
.owner-material-align-page :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

.owner-material-align-page :deep(.el-loading-spinner .path) {
  stroke: var(--accent-color);
}
</style>

<style>
/* 全局 Element Plus 样式覆盖，使其适应现代化主题 */
.el-table {
  --el-table-row-hover-bg-color: rgba(79, 70, 229, 0.015) !important;
  --el-table-header-bg-color: rgba(79, 70, 229, 0.02) !important;
  --el-table-border-color: rgba(0, 0, 0, 0.05) !important;
  --el-table-text-color: var(--text-dark) !important;
  --el-table-header-text-color: var(--accent-color) !important;
}

.el-table__empty-block {
  background-color: var(--card-background) !important;
  color: var(--text-light) !important;
}

.el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 0 3px rgba(79, 70, 229, 0.03) inset !important;
  border: 1px solid rgba(79, 70, 229, 0.08) !important;
}

.el-input__inner {
  color: var(--text-dark) !important;
}

.el-tag {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  background-color: rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.15);
  color: var(--accent-color);
}

.el-tag--success {
  background-color: rgba(13, 148, 136, 0.08);
  border-color: rgba(13, 148, 136, 0.15);
  color: #0d9488;
}

.el-tag--warning {
  background-color: rgba(220, 104, 3, 0.08);
  border-color: rgba(220, 104, 3, 0.15);
  color: #dc6803;
}

.el-tag--danger {
  background-color: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.el-tag--info {
  background-color: rgba(100, 116, 139, 0.08);
  border-color: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

/* 分页器样式 */
.modern-pagination {
  margin-top: 20px;
  text-align: right;
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: var(--text-light);
  --el-pagination-button-color: var(--text-light);
  --el-pagination-button-disabled-color: rgba(0, 0, 0, 0.1);
  --el-pagination-hover-color: var(--accent-color);
}

.modern-pagination .el-pagination__total,
.modern-pagination .el-pagination__jump {
  color: var(--text-light);
}

.modern-pagination .el-pager li {
  background-color: rgba(79, 70, 229, 0.03);
  border: 1px solid rgba(79, 70, 229, 0.08);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.modern-pagination .el-pager li:hover {
  color: var(--accent-color);
  background-color: rgba(79, 70, 229, 0.08);
  border-color: var(--accent-color);
  box-shadow: 0 0 6px var(--shadow-color);
}

.modern-pagination .el-pager li.is-active {
  background-color: var(--accent-color);
  color: #ffffff;
  border-color: var(--accent-color);
  box-shadow: 0 0 8px var(--shadow-color);
}

.modern-pagination .el-select .el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(79, 70, 229, 0.08) !important;
}

.modern-pagination .el-select .el-input__inner {
  color: var(--text-dark) !important;
}

.modern-pagination .el-input__suffix-inner {
  color: var(--text-light) !important;
}

/* 按钮通用样式 */
.el-button--info {
  background-color: rgba(100, 116, 139, 0.08);
  border: 1px solid rgba(100, 116, 139, 0.15);
  color: var(--text-light);
}

.el-button--info:hover {
  background-color: rgba(100, 116, 139, 0.2);
  border-color: rgba(100, 116, 139, 0.3);
  transform: translateY(-1px);
}

.el-button--success {
  background-color: rgba(13, 148, 136, 0.08);
  border: 1px solid rgba(13, 148, 136, 0.15);
  color: #0d9488;
}

.el-button--success:hover {
  background-color: rgba(13, 148, 136, 0.2);
  border-color: rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}

/* 对话框样式 */
.el-dialog {
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.12);
  border: 1px solid var(--border-color);
}

.el-dialog__header {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.01));
  border-bottom: 1px solid var(--border-color);
  border-radius: 12px 12px 0 0;
}

.el-dialog__title {
  color: var(--accent-color);
  font-weight: 600;
}

.el-dialog__body {
  background-color: var(--card-background);
}

.el-dialog__footer {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  border-top: 1px solid var(--border-color);
  border-radius: 0 0 12px 12px;
}
</style>
