<template>
  <div v-loading="loading" class="material-detail-page">
    <div class="page-header">
      <h2>乙供物资解析详情</h2>
      <el-button @click="handleBack">返回</el-button>
    </div>
    <el-table :data="tableData" style="width: 100%" border>
      <el-table-column type="index" label="序号" width="60"></el-table-column>
      <el-table-column prop="material_name" label="乙供物资名称">
        <template #default="scope">
          <span>{{ scope.row.material_name || '/' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="material_specification" label="乙供物资规格型号">
        <template #default="scope">
          <span>{{ scope.row.material_specification || '/' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="material_price" label="乙供物资价格">
        <template #default="scope">
          <span>{{ scope.row.material_price || '/' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="matched_name" label="匹配物资名称">
        <template #default="scope">
          <span>{{ scope.row.matched_name || '/' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="matched_specification" label="匹配规格型号">
        <template #default="scope">
          <span>{{ scope.row.matched_specification || '/' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="matched_price" label="匹配价格">
        <template #default="scope">
          <span>{{ getPrice(scope.row.matched_price, scope.row.matchedPriceQuarter) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="similarity" label="相似度">
        <template #default="scope">
          <span>{{ scope.row.similarity || '/' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="match_type" label="匹配类型">
        <template #default="scope">
          <el-tag :type="getMatchTypeTag(scope.row.match_type)">{{ scope.row.match_type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <div v-if="scope.row.original_item.confirm_type === 2">
            <!-- 如果是人工匹配，根据原始的 comparison_result 来显示下拉框或修改按钮 -->
            <div v-if="scope.row.original_item.comparison_result === 2">
              <el-select
                v-model="scope.row.selected_material"
                placeholder="选择物资"
                value-key="matched_id"
                @change="handleMaterialSelectChange(scope.row, $event)"
                :popper-append-to-body="false"
                style="width: 100%; margin-bottom: 5px"
              >
                <el-option
                  v-for="item in scope.row.similar_matches"
                  :key="item.matched_id || item.id"
                  :label="item.name + ' ' + item.specification"
                  :value="item"
                ></el-option>
              </el-select>
              <el-select
                v-model="scope.row.selected_price_quarter"
                placeholder="选择价格和季度"
                value-key="id"
                @change="handlePriceQuarterChange(scope.row, $event)"
                :popper-append-to-body="false"
                style="width: 100%"
              >
                <el-option
                  v-for="item in scope.row.price_quarter_options"
                  :key="item.id"
                  :label="`¥${item.taxPrice} (${item.quarter})`"
                  :value="item"
                ></el-option>
              </el-select>
            </div>
            <div v-else>
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">修改</el-button>
            </div>
          </div>
          <div v-else-if="scope.row.match_type === '精确匹配'">
            <el-select
              v-model="scope.row.selected_material"
              placeholder="选择物资"
              value-key="matched_id"
              :popper-append-to-body="false"
              style="width: 100%; margin-bottom: 5px"
              disabled
            >
              <el-option
                v-for="item in scope.row.similar_matches"
                :key="item.matched_id || item.id"
                :label="item.name + ' ' + item.specification"
                :value="item"
              ></el-option>
            </el-select>
            <el-select
              v-model="scope.row.selected_price_quarter"
              placeholder="选择价格和季度"
              value-key="id"
              :popper-append-to-body="false"
              style="width: 100%"
              disabled
            >
              <el-option
                v-for="item in scope.row.price_quarter_options"
                :key="item.id"
                :label="`¥${item.taxPrice} (${item.quarter})`"
                :value="item"
              ></el-option>
            </el-select>
          </div>
          <div v-else-if="['相似匹配', '历史匹配'].includes(scope.row.match_type)">
            <el-select
              v-model="scope.row.selected_material"
              placeholder="选择物资"
              value-key="matched_id"
              @change="handleMaterialSelectChange(scope.row, $event)"
              :popper-append-to-body="false"
              style="width: 100%; margin-bottom: 5px"
            >
              <el-option
                v-for="item in scope.row.similar_matches"
                :key="item.matched_id || item.id"
                :label="item.name + ' ' + item.specification"
                :value="item"
              ></el-option>
            </el-select>
            <el-select
              v-model="scope.row.selected_price_quarter"
              placeholder="选择价格和季度"
              value-key="id"
              @change="handlePriceQuarterChange(scope.row, $event)"
              :popper-append-to-body="false"
              style="width: 100%"
            >
              <el-option
                v-for="item in scope.row.price_quarter_options"
                :key="item.id"
                :label="`¥${item.taxPrice} (${item.quarter})`"
                :value="item"
              ></el-option>
            </el-select>
          </div>

          <div v-else>
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">修改</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalDetails"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      style="margin-top: 20px; text-align: right"
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
import CozeService from '@/uitls/coze.js'
import { useChatStore } from '@/stores/chat.js'
import MaterialService from '@/services/MaterialService.js'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow.js' // 引入 workflowStore

const cozeService = new CozeService(
  'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
)

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
    const workflowId = '7519455533105184809'
    const params = {
      pageNum,
      pageSize
    }
    const result = await cozeService.runWorkflow(workflowId, params)
    if (result && result.data) {
      const parsed = JSON.parse(result.data)
      showSelectionList.value = parsed.output || parsed
      showSelectionTotal.value = parsed.count || 0
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
    currentRow.value.matched_price =
      selectedMaterial.tax_price || selectedMaterial.ymtd_tax_price || selectedMaterial.price
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
      currentRow.value.original_item.matchedPrice =
        selectedMaterial.tax_price || selectedMaterial.ymmr_price || selectedMaterial.price
      currentRow.value.original_item.matchedScore = selectedMaterial.ymmr_score || null
      currentRow.value.original_item.matchedPriceQuarter = selectedMaterial.quarter || null

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
  padding: 20px;
  background-color: #fff;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}
</style>
