<template>
  <div v-loading="loading" class="material-detail-page">
    <div class="page-header">
      <h2>乙供物资解析详情</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <div class="table-container">
      <el-table
        :data="tableData"
        class="material-table"
        :row-class-name="getRowClassName"
        :header-cell-style="getHeaderStyle"
        :cell-style="getCellStyle"
        border
        stripe
        size="large"
      >
        <!-- 源数据分组 -->
        <el-table-column
          type="index"
          label="序号"
          width="100"
          align="center"
          fixed="left"
        ></el-table-column>

        <!-- 乙供物资信息组 -->
        <el-table-column label="乙供物资信息" align="center">
          <el-table-column
            prop="material_name"
            label="物资名称"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="scope">
              <div class="material-info">
                <i class="material-icon el-icon-box"></i>
                <span class="material-name">{{ scope.row.material_name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="material_specification"
            label="规格型号"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="scope">
              <div class="spec-info">
                <span class="spec-text">{{ scope.row.material_specification || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="material_price" label="价格" width="100" align="right">
            <template #default="scope">
              <div class="price-info">
                <span class="price-text">{{ formatPrice(scope.row.material_price) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table-column>

        <!-- 分隔线 -->
        <el-table-column width="2" class-name="divider-column"></el-table-column>

        <!-- 匹配结果分组 -->
        <el-table-column label="匹配结果信息" align="center">
          <el-table-column
            prop="matched_name"
            label="匹配物资名称"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="scope">
              <div class="matched-info">
                <i class="match-icon el-icon-link"></i>
                <span class="matched-name">{{ scope.row.matched_name || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="matched_specification"
            label="匹配规格"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="scope">
              <span class="matched-spec">{{ scope.row.matched_specification || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="matched_price" label="匹配价格" width="120" align="right">
            <template #default="scope">
              <div class="matched-price">
                <span class="price-value">{{
                  getPrice(scope.row.matched_price, scope.row.matchedPriceQuarter)
                }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="similarity" label="相似度" width="100" align="center">
            <template #default="scope">
              <div class="similarity-info">
                <el-progress
                  :percentage="getSimilarityPercentage(scope.row.similarity)"
                  :color="getSimilarityColor(scope.row.similarity)"
                  :show-text="false"
                  :stroke-width="6"
                />
                <span class="similarity-text">{{ scope.row.similarity || '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="match_type" label="匹配类型" width="120" align="center">
            <template #default="scope">
              <el-tag
                :type="getMatchTypeTag(scope.row.match_type)"
                :effect="getMatchTypeEffect(scope.row.match_type)"
                size="medium"
              >
                {{ scope.row.match_type }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table-column>
        <!-- 操作列 -->
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="scope">
            <div class="operation-container">
              <div v-if="scope.row.original_item.confirm_type === 2">
                <!-- 如果是人工匹配，根据原始的 comparison_result 来显示下拉框或修改按钮 -->
                <div v-if="scope.row.original_item.comparison_result === 2" class="select-group">
                  <el-select
                    v-model="scope.row.selected_material"
                    placeholder="选择物资"
                    value-key="matched_id"
                    @change="handleMaterialSelectChange(scope.row, $event)"
                    :popper-append-to-body="false"
                    size="small"
                    class="material-select"
                  >
                    <el-option
                      v-for="item in scope.row.similar_matches"
                      :key="item.matched_id || item.id"
                      :label="`${item.name || '/'} ${item.specification || '/'}`"
                      :value="item"
                    ></el-option>
                  </el-select>
                  <el-select
                    v-model="scope.row.selected_price_quarter"
                    placeholder="选择价格和季度"
                    value-key="id"
                    @change="handlePriceQuarterChange(scope.row, $event)"
                    :popper-append-to-body="false"
                    size="small"
                    class="price-select"
                  >
                    <el-option
                      v-for="item in scope.row.price_quarter_options"
                      :key="item.id"
                      :label="`¥${
                        item.taxPrice !== null && item.taxPrice !== undefined ? item.taxPrice : '/'
                      } (${item.quarter || '/'})`"
                      :value="item"
                    ></el-option>
                  </el-select>
                </div>
                <div v-else class="button-group">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleEdit(scope.row)"
                    class="edit-btn"
                  >
                    <i class="el-icon-edit"></i> 修改
                  </el-button>
                </div>
              </div>
              <div v-else-if="scope.row.match_type === '精确匹配'" class="select-group">
                <el-select
                  v-model="scope.row.selected_material"
                  placeholder="选择物资"
                  value-key="matched_id"
                  @change="handleMaterialSelectChange(scope.row, $event)"
                  :popper-append-to-body="false"
                  size="small"
                  class="material-select"
                >
                  <el-option
                    v-for="item in scope.row.similar_matches"
                    :key="item.matched_id || item.id"
                    :label="`${item.name || '/'} ${item.specification || '/'}`"
                    :value="item"
                  ></el-option>
                </el-select>
                <el-select
                  v-model="scope.row.selected_price_quarter"
                  placeholder="选择价格和季度"
                  value-key="id"
                  @change="handlePriceQuarterChange(scope.row, $event)"
                  :popper-append-to-body="false"
                  size="small"
                  class="price-select"
                >
                  <el-option
                    v-for="item in scope.row.price_quarter_options"
                    :key="item.id"
                    :label="`¥${
                      item.taxPrice !== null && item.taxPrice !== undefined ? item.taxPrice : '/'
                    } (${item.quarter || '/'})`"
                    :value="item"
                  ></el-option>
                </el-select>
              </div>
              <div
                v-else-if="['相似匹配', '历史匹配'].includes(scope.row.match_type)"
                class="select-group"
              >
                <el-select
                  v-model="scope.row.selected_material"
                  placeholder="选择物资"
                  value-key="matched_id"
                  @change="handleMaterialSelectChange(scope.row, $event)"
                  :popper-append-to-body="false"
                  size="small"
                  class="material-select"
                >
                  <el-option
                    v-for="item in scope.row.similar_matches"
                    :key="item.matched_id || item.id"
                    :label="`${item.name || '/'} ${item.specification || '/'}`"
                    :value="item"
                  ></el-option>
                </el-select>
                <el-select
                  v-model="scope.row.selected_price_quarter"
                  placeholder="选择价格和季度"
                  value-key="id"
                  @change="handlePriceQuarterChange(scope.row, $event)"
                  :popper-append-to-body="false"
                  size="small"
                  class="price-select"
                >
                  <el-option
                    v-for="item in scope.row.price_quarter_options"
                    :key="item.id"
                    :label="`¥${
                      item.taxPrice !== null && item.taxPrice !== undefined ? item.taxPrice : '/'
                    } (${item.quarter || '/'})`"
                    :value="item"
                  ></el-option>
                </el-select>
              </div>

              <div v-else class="button-group">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEdit(scope.row)"
                  class="edit-btn"
                >
                  <i class="el-icon-edit"></i> 修改
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
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
    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存解析结果</el-button>
    </div>
  </div>
  <MaterialSelectionDialog
    v-model:modelValue="showSelectionDialog"
    :data-list="showSelectionList"
    :total="showSelectionTotal"
    :page-num="showSelectionPageNum"
    :page-size="showSelectionPageSize"
    :loading="loading"
    @select="handleMaterialSelect"
    @page-change="handleSelectionPageChange"
    @size-change="handleSelectionSizeChange"
  />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog.vue'
import CozeService from '@/utils/coze.js'
import { useChatStore } from '@/stores/chat.js'
import MaterialService from '@/services/MaterialService.js'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow.js' // 引入 workflowStore
import { queryMaterialBaseInfo } from '@/utils/backendWorkflow'

const cozeService = new CozeService(import.meta.env.VITE_COZE_API_KEY)

const chatStore = useChatStore()
const workflowStore = useWorkflowStore() // 初始化 workflowStore
const route = useRoute()
const router = useRouter()

const taskId = ref(route.params.taskId) // 从 route.params 获取 taskId
const detailId = ref(route.query.detailId) // detailId 仍然从 query 获取，或者后续根据 taskId 动态获取

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const showSelectionDialog = ref(false)
const currentRow = ref(null)

const showSelectionPageNum = ref(1)
const showSelectionPageSize = ref(10)
const showSelectionList = ref([])
const showSelectionTotal = ref(0)

const currentPage = ref(1)
const pageSize = ref(10)
const totalDetails = ref(0)

const fetchMaterialDetail = async (page = currentPage.value, size = pageSize.value) => {
  loading.value = true
  tableData.value = []

  // 确保 taskId 存在
  if (!taskId.value) {
    ElMessage.warning('任务ID缺失，无法加载详情。')
    loading.value = false
    return
  }

  // 如果 detailId 不存在，尝试从 workflowStore 中获取第一个 supplierFileDetailIds
  let currentDetailId = detailId.value
  if (!currentDetailId && workflowStore.supplierFileDetailIds.length > 0) {
    currentDetailId = workflowStore.supplierFileDetailIds[0]
    console.log('【诊断】使用 workflowStore 中的第一个 detailId:', currentDetailId)
  }

  if (!currentDetailId) {
    ElMessage.warning('详情ID缺失，无法加载详情。')
    loading.value = false
    return
  }

  try {
    const detailWorkflowId = '7519045874770657299'
    const workflowParams = {
      taskId: taskId.value,
      task_detail_id: currentDetailId, // 使用处理后的 detailId
      index: page,
      pageSize: size
    }
    console.log('【诊断】调用工作流 7519045874770657299 参数:', workflowParams)
    const detailResult = await cozeService.runWorkflow(detailWorkflowId, workflowParams)
    if (detailResult && detailResult.data) {
      console.log('【诊断】工作流 7519045874770657299 原始返回数据:', detailResult.data)
      const parsed = JSON.parse(detailResult.data)
      const parsedData = parsed?.result
      const totalCount = parsed?.totalCount || (Array.isArray(parsedData) ? parsedData.length : 0)
      console.log('【诊断】工作流 7519045874770657299 解析后数据:', { parsedData, totalCount })

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableData.value = parsedData.map((item) => formatMaterialDetail(item))
        totalDetails.value = totalCount
        console.log(
          '【诊断】MaterialDetailPage - tableData 更新:',
          tableData.value.length,
          '条数据'
        )
        console.log('【诊断】MaterialDetailPage - totalDetails 更新:', totalDetails.value)
      } else {
        ElMessage.warning('未获取到有效的详情数据。')
        tableData.value = []
        totalDetails.value = 0
      }
    } else {
      throw new Error('获取详情数据失败。')
    }
  } catch (error) {
    ElMessage.error(`加载详情失败: ${error.message}`)
    console.error('加载详情失败:', error)
  } finally {
    loading.value = false
  }
}

const formatMaterialDetail = (item) => {
  const matchTypeMap = {
    0: '无匹配',
    1: '精确匹配',
    2: '相似匹配',
    3: '历史匹配'
  }

  const formattedItem = {
    id: item.id,
    material_name: item.excelDataMaterialName,
    material_specification: item.excelDataSpecificationModel,
    material_price: item.excelDataPrice,
    matched_name: item.matchedDataMaterialName,
    matched_specification: item.matchedDataSpecificationModel,
    matched_price: item.matchedPrice,
    matchedPriceQuarter: item.matchedPriceQuarter || null, // 添加 matchedPriceQuarter 属性
    similarity: typeof item.matchedScore === 'number' ? item.matchedScore + '%' : '/',
    match_type: matchTypeMap[item.comparison_result] || '未知',
    editing: false,
    selected_material: null,
    selected_price_quarter: null,
    price_quarter_options: [],
    original_item: item,
    initialMatchedDataId: item.matchedDataId || null,
    initialMatchedPriceId: item.matchedPriceId || null,
    isUserConfirmed: false
  }

  // 处理相似匹配和历史匹配
  if ([2, 3].includes(item.comparison_result) && Array.isArray(item.subData)) {
    formattedItem.similar_matches = item.subData.map((sub) => {
      return {
        id: sub.id,
        matched_id: sub.matchedDataId,
        matchedPriceId: sub.matchedPriceId || null,
        name: sub.matchedDataMaterialName || '未知名称',
        specification: sub.matchedDataSpecificationModel || '未知型号',
        price: sub.matchedPrice || 0,
        similarity: sub.score || 0,
        matchedPriceQuarter: sub.matchedPriceQuarter || '未知季度'
      }
    })

    const currentMatchedMaterial = formattedItem.similar_matches.find(
      (sub) => sub.matched_id === item.matchedDataId
    )

    if (currentMatchedMaterial) {
      formattedItem.selected_material = currentMatchedMaterial
      fetchPriceInfoList(currentMatchedMaterial.matched_id).then((prices) => {
        formattedItem.price_quarter_options = prices
        if (
          item.matchedPrice === null ||
          item.matchedPrice === undefined ||
          item.matchedPrice === ''
        ) {
          formattedItem.selected_price_quarter = null
        } else {
          const currentMatchedPriceQuarter = prices.find(
            (priceItem) => priceItem.id === item.matchedPriceId
          )
          if (currentMatchedPriceQuarter) {
            formattedItem.selected_price_quarter = currentMatchedPriceQuarter
          } else if (prices.length > 0) {
            formattedItem.selected_price_quarter = prices[0]
          }
        }
      })
    } else if (formattedItem.similar_matches.length > 0) {
      formattedItem.selected_material = formattedItem.similar_matches[0]
      fetchPriceInfoList(formattedItem.selected_material.matched_id).then((prices) => {
        formattedItem.price_quarter_options = prices
        if (
          item.matchedPrice === null ||
          item.matchedPrice === undefined ||
          item.matchedPrice === ''
        ) {
          formattedItem.selected_price_quarter = null
        } else if (prices.length > 0) {
          formattedItem.selected_price_quarter = prices[0]
        }
      })
    }
  } else if (item.comparison_result === 1) {
    // 精确匹配情况，初始化 selected_material 和 selected_price_quarter
    formattedItem.similar_matches = [
      {
        id: item.matchedDataId,
        matched_id: item.matchedDataId,
        matchedPriceId: item.matchedPriceId,
        name: item.matchedDataMaterialName,
        specification: item.matchedDataSpecificationModel,
        price: item.matchedPrice,
        similarity: item.matchedScore,
        matchedPriceQuarter: item.matchedPriceQuarter
      }
    ]
    formattedItem.selected_material = formattedItem.similar_matches[0]
    // 对于精确匹配，直接设置 selected_price_quarter
    if (item.matchedPrice !== null && item.matchedPriceQuarter !== null) {
      formattedItem.selected_price_quarter = {
        id: item.matchedPriceId,
        taxPrice: item.matchedPrice,
        quarter: item.matchedPriceQuarter
      }
      // 确保 price_quarter_options 包含这个精确匹配的价格，以便下拉框能正确回显
      formattedItem.price_quarter_options = [formattedItem.selected_price_quarter]
    } else {
      formattedItem.selected_price_quarter = null
      formattedItem.price_quarter_options = []
    }
    // 仍然获取所有价格选项，以便将来可能需要切换
    fetchPriceInfoList(item.matchedDataId).then((prices) => {
      // 合并或更新 price_quarter_options，确保精确匹配的价格始终存在
      if (
        formattedItem.selected_price_quarter &&
        !prices.some(
          (p) =>
            p.id === formattedItem.selected_price_quarter.id &&
            p.taxPrice === formattedItem.selected_price_quarter.taxPrice &&
            p.quarter === formattedItem.selected_price_quarter.quarter
        )
      ) {
        formattedItem.price_quarter_options = [formattedItem.selected_price_quarter, ...prices]
      } else {
        formattedItem.price_quarter_options = prices
      }
    })
  } else {
    formattedItem.similar_matches = []
    formattedItem.price_quarter_options = []
  }
  return formattedItem
}
const getPrice = (price, quarter) => {
  if (price === null || price === undefined || price === '') {
    return '/'
  }
  return `¥${price} (${quarter})`
}

// 格式化价格显示
const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return '-'
  }
  return `¥${price}`
}

// 获取相似度百分比
const getSimilarityPercentage = (similarity) => {
  if (!similarity || similarity === '/') return 0
  const percent = parseInt(similarity.replace('%', ''))
  return isNaN(percent) ? 0 : percent
}

// 获取相似度颜色
const getSimilarityColor = (similarity) => {
  const percent = getSimilarityPercentage(similarity)
  if (percent >= 90) return '#0d9488' // 青蓝绿色
  if (percent >= 70) return '#0891b2' // 青色
  if (percent >= 50) return '#dc6803' // 深橙色
  return '#9ca3af' // 中性灰
}

// 获取匹配类型标签样式
const getMatchTypeEffect = (type) => {
  if (type === '精确匹配') return 'dark'
  if (type === '相似匹配') return 'plain'
  if (type === '历史匹配') return 'light'
  return 'plain'
}

// 获取行样式
const getRowClassName = ({ row, rowIndex }) => {
  const matchType = row.match_type
  if (matchType === '精确匹配') return 'exact-match-row'
  if (matchType === '相似匹配') return 'similar-match-row'
  if (matchType === '历史匹配') return 'history-match-row'
  if (matchType === '无匹配') return 'no-match-row'
  return ''
}

// 获取表头样式
const getHeaderStyle = ({ column, columnIndex }) => {
  if (columnIndex === 0) return { backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#334155' }
  if (column.label?.includes('乙供物资')) return { backgroundColor: '#eef2ff', color: '#3730a3' }
  if (column.label?.includes('匹配')) return { backgroundColor: '#f0fdfa', color: '#0d9488' }
  return { backgroundColor: '#f8fafc', color: '#475569' }
}

// 获取单元格样式
const getCellStyle = ({ column, columnIndex }) => {
  if (columnIndex === 0) return { backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#334155' }
  return {}
}
const fetchPriceInfoList = async (baseMaterialsDataId) => {
  return await MaterialService.queryPriceInfoList(baseMaterialsDataId)
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchMaterialDetail(newPage, pageSize.value)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchMaterialDetail(currentPage.value, newSize)
}

watch(
  () => route.params.taskId, // 监听 route.params.taskId
  (newTaskId) => {
    taskId.value = newTaskId
    // detailId.value 保持不变，或者根据需要从 workflowStore 获取
    if (newTaskId) {
      currentPage.value = 1
      pageSize.value = 10
      fetchMaterialDetail()
    }
  },
  { immediate: true }
)

// 确保在组件挂载时，如果 taskId 存在，就尝试获取数据
onMounted(() => {
  if (taskId.value) {
    fetchMaterialDetail()
  }
})

onMounted(() => {
  if (taskId.value && detailId.value) {
    fetchMaterialDetail()
  }
})

const getMatchTypeTag = (type) => {
  if (type === '精确匹配') return 'success'
  if (type === '相似匹配' || type === '历史匹配') return 'warning'
  if (type === '无匹配') return 'danger'
  return 'info'
}

const handleMaterialSelectChange = async (row, selectedMaterial) => {
  row.selected_material = selectedMaterial
  row.selected_price_quarter = null
  row.price_quarter_options = []

  if (selectedMaterial && selectedMaterial.matched_id) {
    const prices = await fetchPriceInfoList(selectedMaterial.matched_id)
    row.price_quarter_options = prices
    if (prices.length === 1) {
      row.selected_price_quarter = prices[0]
      handlePriceQuarterChange(row, prices[0])
    }
  }
  row.isUserConfirmed = true
}

const handlePriceQuarterChange = (row, selectedPriceQuarter) => {
  row.selected_price_quarter = selectedPriceQuarter

  if (row.selected_material) {
    row.matched_name = row.selected_material.name
    row.matched_specification = row.selected_material.specification
  }
  if (selectedPriceQuarter) {
    row.matched_price = selectedPriceQuarter.taxPrice
    row.matchedPriceQuarter = selectedPriceQuarter.quarter // 更新 row.matchedPriceQuarter
    row.original_item.matchedPriceQuarter = selectedPriceQuarter.quarter
  } else {
    row.matched_price = null
    row.matchedPriceQuarter = null // 更新 row.matchedPriceQuarter
    row.original_item.matchedPriceQuarter = null
  }

  const originalItem = row.original_item
  if (originalItem) {
    originalItem.matchedDataId = row.selected_material?.matched_id || null
    originalItem.matchedPriceId = selectedPriceQuarter?.id || null
    originalItem.matchedDataMaterialName = row.selected_material?.name || null
    originalItem.matchedDataSpecificationModel = row.selected_material?.specification || null
    originalItem.matchedPrice = selectedPriceQuarter?.taxPrice || null
    originalItem.matchedPriceQuarter = selectedPriceQuarter?.quarter || null
    originalItem.comparison_result = 1
    row.isUserConfirmed = true
  }
  console.log('【诊断】更新后的 row:', row)
}

const handleEdit = async (row) => {
  currentRow.value = row
  if (row.match_type === '无匹配' || !row.match_type || row.match_type === '未知') {
    showSelectionPageNum.value = 1
    showSelectionPageSize.value = 10
    await fetchSelectionList(showSelectionPageNum.value, showSelectionPageSize.value)
    showSelectionDialog.value = true
  } else {
    showSelectionDialog.value = true
  }
}

const fetchSelectionList = async (pageNum, pageSize) => {
  loading.value = true
  try {
    // 构建请求参数，页码从0开始
    const params = {
      page: pageNum - 1, // API 页码从0开始，UI从1开始
      size: pageSize
    }

    console.log('调用基础物资信息查询API，参数：', params)

    const result = await queryMaterialBaseInfo(params)

    if (result && result.data) {
      const { content, totalElements } = result.data

      console.log('基础物资信息查询结果：', result.data)

      // 格式化数据以匹配原有结构
      showSelectionList.value = content.map((item) => ({
        id: item.id,
        material_name: item.materialName,
        specification_model: item.specificationModel,
        tax_price: '', // API响应中没有价格信息，设为空
        quarter: '', // API响应中没有季度信息，设为空
        unit: item.unit,
        material_code: item.materialCode,
        // 保留原始数据
        originalData: item
      }))
      showSelectionTotal.value = totalElements
    } else {
      showSelectionList.value = []
      showSelectionTotal.value = 0
    }
  } catch (error) {
    showSelectionList.value = []
    showSelectionTotal.value = 0
    console.error('获取匹配选择数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSelectionPageChange = async (newPage) => {
  showSelectionPageNum.value = newPage
  await fetchSelectionList(newPage, showSelectionPageSize.value)
}

const handleSelectionSizeChange = async (newSize) => {
  showSelectionPageSize.value = newSize
  showSelectionPageNum.value = 1
  await fetchSelectionList(1, newSize)
}

const handleMaterialSelect = (selectedMaterial) => {
  if (currentRow.value && selectedMaterial) {
    console.log('【诊断】更新前:', {
      initialId: currentRow.value.initialMatchedDataId,
      originalId: currentRow.value.original_item.matchedDataId
    })

    currentRow.value.matched_name =
      selectedMaterial.material_name || selectedMaterial.ymtd_material_name || selectedMaterial.name
    const newMatchedPrice =
      selectedMaterial.tax_price || selectedMaterial.ymtd_tax_price || selectedMaterial.price
    const newMatchedQuarter = selectedMaterial.quarter || null // 获取季度信息

    currentRow.value.matched_price = newMatchedPrice
    currentRow.value.matchedPriceQuarter = newMatchedQuarter // 更新表格显示用的 matchedPriceQuarter
    currentRow.value.matched_specification =
      selectedMaterial.specification_model ||
      selectedMaterial.ymtd_specification_model ||
      selectedMaterial.specification

    if (currentRow.value.original_item) {
      currentRow.value.original_item.comparison_result = 3
      currentRow.value.original_item.matchedDataId =
        selectedMaterial.m_id || selectedMaterial.ymmr_id || selectedMaterial.id || null
      currentRow.value.original_item.matchedPriceId =
        selectedMaterial.p_id ||
        selectedMaterial.ymmr_tax_price_id ||
        selectedMaterial.priceId ||
        null
      currentRow.value.original_item.matchedDataMaterialName =
        selectedMaterial.material_name ||
        selectedMaterial.ymtd_material_name ||
        selectedMaterial.name
      currentRow.value.original_item.matchedDataSpecificationModel =
        selectedMaterial.specification_model ||
        selectedMaterial.ymtd_specification_model ||
        selectedMaterial.specification
      currentRow.value.original_item.matchedPrice = newMatchedPrice // 使用新的匹配价格
      currentRow.value.original_item.matchedScore = selectedMaterial.ymmr_score || null
      currentRow.value.original_item.matchedPriceQuarter = newMatchedQuarter // 使用新的匹配季度

      console.log('【诊断】更新后:', {
        initialId: currentRow.value.initialMatchedDataId,
        originalId: currentRow.value.original_item.matchedDataId
      })
      currentRow.value.isUserConfirmed = true
    }
  }
  showSelectionDialog.value = false
}

const handleSaveEdit = (row) => {
  row.editing = false
}

const handleCancelEdit = (row) => {
  row.editing = false
}

const handleSave = async () => {
  saving.value = true
  try {
    const updateObjList = tableData.value
      .filter((item) => {
        const isModified =
          item.isUserConfirmed ||
          item.original_item.matchedDataId !== item.initialMatchedDataId ||
          item.original_item.matchedPriceId !== item.initialMatchedPriceId
        console.log(
          `【诊断】保存检查: ID=${item.id}, 是否修改=${isModified}, original_item.matchedDataId=${item.original_item.matchedDataId}, initialMatchedDataId=${item.initialMatchedDataId}`
        )
        return isModified
      })
      .map((item) => ({
        id: item.id,
        confirm_base_data_id: item.original_item.matchedDataId || null,
        confirm_price_id: item.original_item.matchedPriceId || null,
        confirm_type: 2
      }))

    if (updateObjList.length === 0) {
      ElMessage.info('未检测到修改的数据，无需保存。')
      saving.value = false
      return
    }

    const saveWorkflowId = '7519356799683919872'
    const saveResult = await cozeService.runWorkflow(saveWorkflowId, { updateObjList })

    if (saveResult && saveResult.data) {
      ElMessage.success('保存成功')
      const savedCount = JSON.parse(saveResult.data).output
      const materialType = '乙供物资'
      chatStore.addMessage(`已保存${savedCount}个${materialType}解析结果`, 'system')
    } else {
      throw new Error('保存操作未返回有效结果。')
    }
  } catch (error) {
    ElMessage.error(`保存失败: ${error.message}`)
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.material-detail-page {
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

.table-container {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
}

.material-table {
  border-radius: 0;
  overflow: visible;
  background-color: transparent;
  border: none;
  font-size: 14px;
}

/* 表头样式 */
.material-table :deep(.el-table__header-wrapper) {
  border-radius: 12px 12px 0 0;
}

.material-table :deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  font-size: 14px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 16px 12px;
  text-shadow: none;
  border-bottom: 2px solid rgba(79, 70, 229, 0.06);
}

/* 行样式 */
.material-table :deep(.el-table__row) {
  height: 70px;
  font-size: 14px;
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.material-table :deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
  transform: translateY(-1px);
}

/* 匹配类型行样式 */
.material-table :deep(.exact-match-row) {
  background-color: rgba(13, 148, 136, 0.02) !important;
  border-left: 4px solid var(--success-color);
}

.material-table :deep(.similar-match-row) {
  background-color: rgba(220, 104, 3, 0.02) !important;
  border-left: 4px solid var(--warning-color);
}

.material-table :deep(.history-match-row) {
  background-color: rgba(8, 145, 178, 0.02) !important;
  border-left: 4px solid var(--info-color);
}

.material-table :deep(.no-match-row) {
  background-color: rgba(220, 38, 38, 0.02) !important;
  border-left: 4px solid var(--danger-color);
}

/* 单元格样式 */
.material-table :deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 12px 8px;
  vertical-align: middle;
}

/* 分隔列样式 */
.material-table :deep(.divider-column) {
  background: linear-gradient(
    to bottom,
    transparent 20%,
    rgba(0, 123, 255, 0.2) 50%,
    transparent 80%
  );
  width: 2px !important;
  padding: 0 !important;
}

/* 内容样式 */
.material-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.material-icon {
  color: var(--accent-color);
  font-size: 16px;
}

.material-name {
  font-weight: 500;
  color: var(--text-dark);
  line-height: 1.4;
}

.spec-info {
  display: flex;
  align-items: center;
}

.spec-text {
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}

.price-info {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.price-text {
  font-weight: 600;
  color: #b45309;
  font-family: 'Courier New', monospace;
}

.matched-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-icon {
  color: var(--success-color);
  font-size: 16px;
}

.matched-name {
  font-weight: 500;
  color: var(--text-dark);
  line-height: 1.4;
}

.matched-spec {
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}

.matched-price {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.price-value {
  font-weight: 600;
  color: var(--success-color);
  font-family: 'Courier New', monospace;
}

.similarity-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.similarity-text {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-light);
}

/* 操作区域样式 */
.operation-container {
  padding: 8px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.material-select,
.price-select {
  width: 100% !important;
}

.material-select :deep(.el-input__wrapper) {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.12);
}

.price-select :deep(.el-input__wrapper) {
  border-color: var(--success-color);
  box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.12);
}

.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 按钮样式优化 */
.page-header .el-button,
.page-footer .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

/* 加载动画优化 */
.material-detail-page :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

.material-detail-page :deep(.el-loading-spinner .path) {
  stroke: var(--accent-color);
}
</style>
