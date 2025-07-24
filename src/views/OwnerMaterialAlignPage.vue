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

    <div class="main-table-container">
      <el-table :data="paginatedMaterials" border stripe class="material-table" height="100%">
        <!-- 领料单物资信息列 -->
        <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
        <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
        <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
        <el-table-column prop="requestUnit" label="领料单单位" min-width="120" />
        <el-table-column prop="requestQuantity" label="领料单数量" min-width="100" />

        <!-- 数据来源列 -->
        <el-table-column label="数据来源" min-width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.originalData.sourceType === 'requisition' ? 'primary' : 'warning'"
              size="small"
            >
              {{ row.originalData.sourceType === 'requisition' ? '申领' : '用料' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 匹配状态列 -->
        <el-table-column label="匹配状态" min-width="160">
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

        <!-- 数据库物资信息列 -->
        <el-table-column prop="dbCode" label="数据库物资编码" min-width="180" />
        <el-table-column prop="dbName" label="数据库物资名称" min-width="160" />
        <el-table-column prop="dbSpec" label="数据库规格型号" min-width="160" />
        <el-table-column prop="dbUnit" label="数据库单位" min-width="80" />
      </el-table>
    </div>

    <div class="main-table-footer">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :current-page="currentPage"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        class="modern-pagination"
      />
    </div>

    <el-dialog
      v-model="showManualConfirmDialog"
      title="未对平物资确认"
      width="90%"
      height="80vh"
      :before-close="handleDialogClose"
      v-loading="isLoading"
      class="fixed-height-dialog"
    >
      <div class="dialog-table-container">
        <el-table
          :data="paginatedUnalignedMaterials"
          border
          stripe
          class="manual-confirm-table"
          :row-class-name="getRowClassName"
          height="100%"
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
      </div>
      <div class="dialog-footer-content">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="unalignedMaterials.length"
          :page-size="manualConfirmPageSize"
          :page-sizes="[10, 15, 20, 50]"
          :current-page="manualConfirmCurrentPage"
          @current-change="handleManualConfirmPageChange"
          @size-change="handleManualConfirmSizeChange"
          class="modern-pagination dialog-pagination"
        />
      </div>
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
import { useOwnerMaterialStore, TaskStatus } from '@/stores/ownerMaterial'
import {
  queryMaterialMatchStatus,
  queryUnmatchedBalanceResult,
  manualMatch,
  queryMaterialBaseInfo
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
const pageSize = ref(20)
const currentPage = ref(1)

// 主表格的分页数据
const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allMaterials.value.slice(start, end)
})

// --- 弹窗相关 ---
const showManualConfirmDialog = ref(false)
const manualConfirmPageSize = ref(15)
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
    // 优先从路由获取taskId，然后检查store中是否存在
    const taskId = route.query.taskId || ownerMaterialStore.currentTaskId
    if (!taskId) {
      ElMessage.error('缺少任务ID，无法加载数据。')
      return
    }
    // 使用新的物资匹配状态查询API
    const response = await queryMaterialMatchStatus({ taskId, page: 0, size: 1000 }) // 获取足够多的数据
    console.log('获取到的数据:', response)
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
    // 根据 matchedType 判断匹配状态：0=未匹配, 1=精确匹配, 2=相似匹配, 3=历史匹配, 4=人工指定
    const aligned = item.matchedType > 0 && item.baseDataId !== null
    console.log('匹配状态', aligned, '匹配类型', item.matchedType)

    return {
      id: item.sourceId, // 使用 sourceId 作为唯一标识
      // 领料单信息 (直接来自API响应)
      requestCode: item.taskDetailId || item.sourceId, // 使用 taskDetailId 作为编码
      requestName: item.materialName,
      requestSpec: item.specificationModel,
      requestUnit: item.unit,
      requestQuantity: item.quantity,
      // 匹配状态
      aligned: aligned,
      matchedType: item.matchedType,
      matchScore: item.score,
      // 数据库物资信息 (如果已匹配)
      dbCode: item.baseDataId || '/',
      dbName: aligned ? item.baseMaterialName : '/', // 匹配后显示物资名称
      dbSpec: aligned ? item.baseSpecificationModel : '/',
      dbUnit: aligned ? item.baseUnit : '/',
      dbQuantity: aligned ? item.quantity : '/',
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
      // 转换数据以适应弹窗表格，使用新的 queryUnmatchedSourceMaterialAPI 响应格式
      unalignedMaterials.value = response.data.content.map((item) => {
        return {
          id: item.sourceId, // 使用 sourceId 作为唯一标识
          requestCode: item.taskDetailId || item.sourceId, // 使用 taskDetailId 或 sourceId
          requestName: item.materialName,
          requestSpec: item.specificationModel,
          requestUnit: item.unit,
          requestQuantity: item.quantity,
          dbCode: null, // 初始化为空
          dbName: null,
          dbSpec: null,
          originalData: item // 保存原始 API 响应数据
        }
      })
      manualConfirmCurrentPage.value = 1 // 重置弹窗分页
      showManualConfirmDialog.value = true
    } else {
      ElMessage.success('所有物资均已匹配！请点击右下角保存物资信息按钮保存并重新解析。')
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

// 使用封装的基础物资信息查询方法
const fetchDbMaterialList = async (
  pageNum = dbMaterialPageNum.value,
  pageSize = dbMaterialPageSize.value,
  searchTerm = ''
) => {
  dbMaterialLoading.value = true
  try {
    // 构建请求参数，页码从0开始
    const params = {
      page: pageNum - 1, // API 页码从0开始，UI从1开始
      size: pageSize
    }

    // 如果有搜索条件，添加到参数中
    if (searchTerm && searchTerm.trim()) {
      params.keyword = searchTerm.trim()
    }

    console.log('调用基础物资信息查询API，参数：', params)

    const result = await queryMaterialBaseInfo(params)

    console.log('基础物资信息查询结果：', result)
    if (result && result.data) {
      const { content, totalElements } = result.data

      console.log('基础物资信息查询结果：', result.data)

      // 格式化数据以匹配 MaterialSelectionDialog 组件的期望格式
      dbMaterialList.value = content.map((item) => ({
        id: item.id,
        material_name: item.materialName,
        specification_model: item.specificationModel,
        tax_price: '', // API响应中没有价格信息，设为空
        quarter: '', // API响应中没有季度信息，设为空
        unit: item.unit,
        code: item.materialCode,
        // 保留原始数据
        originalData: item
      }))

      dbMaterialTotal.value = totalElements

      ElMessage.success(`成功加载 ${dbMaterialList.value.length} 条数据库物资数据`)
    } else {
      console.warn('API返回数据为空')
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
    // 检查是否有需要保存的未匹配物资
    const materialsToSave = unalignedMaterials.value.filter(
      (material) => material.dbCode && material.originalData && material.originalData.sourceId
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
        // 验证必需的数据
        if (!material.originalData.sourceId) {
          throw new Error('缺少源记录ID (sourceId)')
        }
        if (!material.originalData.sourceType) {
          throw new Error('缺少源记录类型 (sourceType)')
        }
        if (!['requisition', 'usage'].includes(material.originalData.sourceType)) {
          throw new Error(
            `无效的源记录类型: ${material.originalData.sourceType}，必须是 'requisition' 或 'usage'`
          )
        }

        // 调用人工匹配API - 使用新的 manualMatchSourceAPI 格式
        const selectedMaterial = material.originalData.selectedBaseData
        const baseDataId =
          selectedMaterial?.originalData?.m_id ||
          selectedMaterial?.originalData?.p_id ||
          selectedMaterial?.id ||
          selectedMaterial?.code ||
          material.dbCode

        if (!baseDataId) {
          throw new Error('无法获取标准物料ID，请重新选择物资')
        }

        const matchData = {
          sourceId: material.originalData.sourceId,
          sourceType: material.originalData.sourceType,
          baseDataId: baseDataId
        }

        console.log(`保存第 ${i + 1}/${materialsToSave.length} 个物资匹配:`, {
          materialName: material.requestName,
          matchData
        })

        const response = await manualMatch(matchData)

        // 检查API响应状态
        if (response && response.code === 200) {
          successCount++
          console.log(`物资 "${material.requestName}" 匹配成功:`, response.msg)
        } else {
          throw new Error(response?.msg || '匹配失败，未知错误')
        }

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

      // 保存成功后，标记需要进行重新解析，然后返回主页
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

// 根据匹配类型返回ElTag的type
const getMatchingTagType = (matchedType) => {
  switch (matchedType) {
    case 0:
      return 'danger' // 红色 - 未匹配
    case 1:
      return 'success' // 绿色 - 精确匹配
    case 2:
      return 'warning' // 黄色 - 相似匹配
    case 3:
      return 'info' // 蓝色 - 历史匹配
    case 4:
      return 'success' // 绿色 - 人工指定
    default:
      return 'danger'
  }
}

// 根据匹配类型返回显示文本
const getMatchingStatusText = (matchedType) => {
  switch (matchedType) {
    case 0:
      return '未匹配'
    case 1:
      return '精确匹配'
    case 2:
      return '相似匹配'
    case 3:
      return '历史匹配'
    case 4:
      return '人工指定'
    default:
      return '未知状态'
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
async function checkAllAligned() {
  try {
    const taskId = route.query.taskId || ownerMaterialStore.currentTaskId
    if (!taskId) {
      ElMessage.error('缺少任务ID，无法检查对平状态。')
      return false // 缺少taskId，无法继续
    }
    const response = await queryUnmatchedBalanceResult({ taskId, page: 0, size: 1 }) // 只查询1条即可判断
    // 如果 content 存在且长度大于0，说明有未匹配的物资，返回 false
    if (response && response.data && response.data.content && response.data.content.length > 0) {
      return false
    }
    // 否则，说明所有物资都已匹配，返回 true
    return true
  } catch (error) {
    console.error('检查对平状态失败:', error)
    ElMessage.error(`检查对平状态失败: ${error.message}`)
    return false // 出错时，默认为未拉平，阻止保存
  }
}

// 保存按钮点击事件
async function handleSaveClick() {
  isSaving.value = true
  try {
    const isAligned = await checkAllAligned()
    if (!isAligned) {
      await ElMessageBox.alert('存在未匹配的物资信息，请先完成所有物资匹配操作', '无法保存', {
        confirmButtonText: '确定',
        type: 'warning'
      })
      return
    }

    const taskId = route.query.taskId || ownerMaterialStore.currentTaskId
    if (!taskId) {
      ElMessage.error('缺少任务ID，无法保存并返回首页。')
      return
    }

    // 实现真实保存逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用
    ElMessage.success('物资信息保存成功')

    // 标记状态并导航以触发重新解析
    ownerMaterialStore.updateTaskStatus(taskId, TaskStatus.READY_FOR_ALIGNMENT)
    router.push({ path: '/home', query: { triggerReparse: taskId } })
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
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

/* 固定高度弹窗样式 */
.fixed-height-dialog :deep(.el-dialog) {
  height: 70vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fixed-height-dialog :deep(.el-dialog__body) {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-table-container {
  height: 40vh;
  min-height: 300px;
  max-height: 60vh;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-table-container .manual-confirm-table {
  flex: 1;
  overflow: hidden;
}

.dialog-footer-content {
  padding: 15px 20px 5px 20px;
  border-top: 1px solid var(--border-color);
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  flex-shrink: 0;
}

.dialog-pagination {
  margin-top: 0;
  text-align: center;
}

/* 确保表格内容可以正确滚动 */
.dialog-table-container :deep(.el-table) {
  height: 100% !important;
}

.dialog-table-container :deep(.el-table__body-wrapper) {
  max-height: calc(100% - 48px) !important;
  overflow-y: auto !important;
}

/* 主表格容器样式 */
.main-table-container {
  height: 50vh;
  min-height: 400px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
}

.main-table-container .material-table {
  flex: 1;
  overflow: hidden;
}

.main-table-container :deep(.el-table) {
  height: 100% !important;
  border-radius: 0;
}

.main-table-container :deep(.el-table__body-wrapper) {
  overflow-y: auto !important;
}

.main-table-footer {
  padding: 15px 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.main-table-footer .modern-pagination {
  margin-top: 0;
  text-align: center;
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
