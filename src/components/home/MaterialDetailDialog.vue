<template>
  <el-dialog
    v-model="dialogVisible"
    title="乙供物资解析详情"
    width="80%"
    :before-close="handleClose"
    custom-class="material-detail-dialog"
  >
    <div v-loading="loading" class="detail-content">
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="60"></el-table-column>
        <el-table-column prop="material_name" label="乙供物资名称"></el-table-column>
        <el-table-column prop="material_specification" label="乙供物资规格型号"></el-table-column>
        <el-table-column prop="material_price" label="乙供物资价格"></el-table-column>
        <el-table-column prop="matched_name" label="匹配物资名称">
          <template #default="scope">
            <span>{{ scope.row.matched_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="matched_specification" label="匹配规格型号">
          <template #default="scope">
            <span>{{ scope.row.matched_specification }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="matched_price" label="匹配价格">
          <template #default="scope">
            <span>{{ scope.row.matched_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="similarity" label="相似度"></el-table-column>
        <el-table-column prop="match_type" label="匹配类型">
          <template #default="scope">
            <el-tag :type="getMatchTypeTag(scope.row.match_type)">{{
              scope.row.match_type
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <div v-if="scope.row.match_type === '精确匹配'">
              <el-button type="info" disabled>已精确匹配</el-button>
            </div>
            <div v-else-if="scope.row.match_type === '相似匹配'">
              <el-select
                v-model="scope.row.selected_match"
                placeholder="从相似匹配中选择"
                value-key="matchedPriceId"
                @change="handleSimilarMatchChange(scope.row, $event)"
              >
                <el-option
                  v-for="item in scope.row.similar_matches"
                  :key="item.matchedPriceId || item.id"
                  :label="formatSimilarMatchLabel(item)"
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
        v-if="totalDetails > pageSize"
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
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存解析结果</el-button>
      </span>
    </template>
  </el-dialog>
  <MaterialSelectionDialog
    v-model:show="showSelectionDialog"
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MaterialSelectionDialog from './MaterialSelectionDialog.vue'
import CozeService from '@/uitls/coze.js'

const cozeService = new CozeService(
  'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
)

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  task: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const showSelectionDialog = ref(false)
const currentRow = ref(null)

const showSelectionPageNum = ref(1)
const showSelectionPageSize = ref(10)
const showSelectionList = ref([])
const showSelectionTotal = ref(0)

const allDetailIds = ref([]) // 存储所有详情ID
const currentPage = ref(1)
const pageSize = ref(10)
const totalDetails = ref(0)

const fetchDetails = async (taskId) => {
  if (!taskId) return
  loading.value = true
  tableData.value = []

  try {
    // 1. 调用获取乙供物资解析详情列表id工作流
    const detailIdsWorkflowId = '7519167663710257193'
    const detailIdsResult = await cozeService.runWorkflow(detailIdsWorkflowId, { task_id: taskId })
    console.log('detailIdsResult:', detailIdsResult)
    if (detailIdsResult && detailIdsResult.data) {
      const parsedOutput = JSON.parse(detailIdsResult.data)?.output
      if (Array.isArray(parsedOutput)) {
        allDetailIds.value = parsedOutput.map((item) => JSON.parse(item).ID)
        totalDetails.value = allDetailIds.value.length
      } else {
        ElMessage.warning('未获取到有效的详情ID列表。')
        loading.value = false
        return
      }
    } else {
      throw new Error('获取详情ID列表失败。')
    }

    // 2. 根据分页获取详情数据
    await fetchPaginatedDetails(taskId, currentPage.value, pageSize.value)
  } catch (error) {
    ElMessage.error(`获取详情失败: ${error.message}`)
    console.error('获取详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchPaginatedDetails = async (taskId, page, size) => {
  loading.value = true
  tableData.value = []

  const startIndex = (page - 1) * size
  const endIndex = Math.min(startIndex + size, allDetailIds.value.length)
  const currentDetailIds = allDetailIds.value.slice(startIndex, endIndex)

  if (currentDetailIds.length === 0) {
    ElMessage.info('当前页没有数据。')
    loading.value = false
    return
  }

  const detailPromises = currentDetailIds.map(async (detailId) => {
    const detailWorkflowId = '7519045874770657299'
    const detailResult = await cozeService.runWorkflow(detailWorkflowId, {
      taskId: taskId,
      task_detail_id: detailId,
      index: page, // 这里的index和pageSize可能需要根据实际工作流的参数定义来调整
      pageSize: size
    })
    if (detailResult && detailResult.data) {
      const parsedData = JSON.parse(detailResult.data)?.result
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // test.json 的 result 字段是一个数组，直接使用
        return parsedData.map((item) => formatMaterialDetail(item))
      }
    }
    return null
  })

  const results = await Promise.all(detailPromises)
  tableData.value = results.flat().filter((item) => item !== null)
  loading.value = false
}

// 格式化数据以适应表格和相似匹配的显示
const formatMaterialDetail = (item) => {
  const matchTypeMap = {
    0: '无匹配',
    1: '精确匹配',
    2: '相似匹配'
  }

  const formattedItem = {
    id: item.id,
    material_name: item.excelDataMaterialName,
    material_specification: item.excelDataSpecificationModel,
    material_price: item.excelDataPrice,
    matched_name: item.matchedDataMaterialName,
    matched_specification: item.matchedDataSpecificationModel,
    matched_price: item.matchedPrice,
    similarity: item.matchedScore !== null ? (item.matchedScore * 100).toFixed(2) + '%' : '/',
    match_type:
      item.confirm_type === 2 ? '精确匹配' : matchTypeMap[item.comparison_result] || '未知',
    editing: false,
    selected_match: null, // 用于相似匹配的选中值
    original_item: item, // 保留原始数据，方便后续操作
    initialMatchedDataId: item.matchedDataId || null, // 新增初始匹配数据ID快照
    initialMatchedPriceId: item.matchedPriceId || null // 新增初始价格ID快照
  }

  if (item.comparison_result === 2 && Array.isArray(item.subData)) {
    formattedItem.similar_matches = item.subData.map((sub) => ({
      id: sub.id,
      matched_id: sub.matched_id,
      matchedPriceId: sub.matchedPriceId || null,
      name: sub.matchedDataMaterialName || '未知名称', // 假设subData中也有这些字段
      specification: sub.matchedDataSpecificationModel || '未知型号',
      price: sub.matchedPrice || 0,
      similarity: sub.score || 0,
      matchedPriceQuarter: sub.matchedPriceQuarter || '未知季度', // 假设subData中包含匹配季度
      value: sub.matchedPriceId || sub.id // 用于el-option的value，以matchedPriceId优先
    }))
  } else {
    formattedItem.similar_matches = []
  }
  return formattedItem
}

// 处理分页变化
const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchPaginatedDetails(props.task.ID, newPage, pageSize.value)
}

// 处理页长变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 页长变化后回到第一页
  fetchPaginatedDetails(props.task.ID, currentPage.value, newSize)
}

watch(
  () => props.task,
  (newTask) => {
    if (newTask && newTask.ID) {
      // 使用 newTask.ID 作为 task_id
      fetchDetails(newTask.ID)
    } else {
      tableData.value = []
      allDetailIds.value = []
      totalDetails.value = 0
      currentPage.value = 1
    }
  },
  { immediate: true, deep: true }
)

const formatSimilarMatchLabel = (item) => {
  const name = item.name || ''
  const specification = item.specification || ''
  const price = item.price !== null ? `¥${item.price.toFixed(2)}` : ''
  const similarity = item.similarity !== null ? `${(item.similarity * 100).toFixed(0)}%` : ''
  const quarter = item.matchedPriceQuarter || item.quarter || ''

  const parts = []
  if (price) parts.push(price)
  if (similarity) parts.push(similarity)
  if (quarter) parts.push(quarter)

  const bracketContent = parts.join(',')
  return `${name} ${specification} (${bracketContent})`
}

const getMatchTypeTag = (type) => {
  if (type === '精确匹配') return 'success'
  if (type === '相似匹配') return 'warning'
  if (type === '无匹配') return 'danger'
  return 'info' // For '未知' or other types
}

const handleSimilarMatchChange = (row, selectedMatch) => {
  if (row && selectedMatch) {
    row.matched_name = selectedMatch.name
    row.matched_specification = selectedMatch.specification
    row.matched_price = selectedMatch.price
    row.similarity =
      selectedMatch.similarity !== null ? (selectedMatch.similarity * 100).toFixed(2) + '%' : '/'
    // 更新原始数据中的匹配相关字段，以便保存时使用
    const originalItem = row.original_item
    if (originalItem) {
      originalItem.matchedDataId = selectedMatch.matched_id || null
      originalItem.matchedPriceId = selectedMatch.matchedPriceId || null
      originalItem.matchedDataMaterialName = selectedMatch.name
      originalItem.matchedDataSpecificationModel = selectedMatch.specification
      originalItem.matchedPrice = selectedMatch.price
      originalItem.matchedScore = selectedMatch.similarity
      originalItem.matchedPriceQuarter =
        selectedMatch.matchedPriceQuarter || selectedMatch.quarter || null
      originalItem.comparison_result = 1 // 相似匹配选择后，视为精确匹配
      row.match_type = '精确匹配'
    }
  }
}

/**
 * 处理“修改”按钮点击事件
 * 根据不同匹配类型弹出不同选择弹窗
 * 对于“无匹配”和“未知”类型，调用分页接口获取匹配数据分页
 * 对于其他类型，直接打开弹窗（不会影响相似匹配下拉选择器）
 */
const handleEdit = async (row) => {
  currentRow.value = row
  if (row.match_type === '无匹配' || !row.match_type || row.match_type === '未知') {
    // 初始化弹窗分页参数
    showSelectionPageNum.value = 1
    showSelectionPageSize.value = 10
    // 调用分页接口，获取匹配列表数据
    await fetchSelectionList(showSelectionPageNum.value, showSelectionPageSize.value)
    showSelectionDialog.value = true
  } else {
    showSelectionDialog.value = true
  }
}

/**
 * 通过传入分页参数调用分页工作流接口获取数据
 * 与相似匹配的下拉框逻辑无任何影响，使用单独状态管理
 */
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

// 弹窗分页页码变化事件
const handleSelectionPageChange = async (newPage) => {
  showSelectionPageNum.value = newPage
  await fetchSelectionList(newPage, showSelectionPageSize.value)
}

// 弹窗分页页大小变化事件
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
    currentRow.value.similarity = '100%'
    currentRow.value.match_type = '精确匹配'
    if (currentRow.value.original_item) {
      currentRow.value.original_item.comparison_result = 1 // 手动选择后，视为精确匹配
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

      // 【错误代码已移除】不再同步修改初始快照
      // currentRow.value.initialMatchedDataId = currentRow.value.original_item.matchedDataId
      // currentRow.value.initialMatchedPriceId = currentRow.value.original_item.matchedPriceId

      console.log('【诊断】更新后:', {
        initialId: currentRow.value.initialMatchedDataId, // 应保持不变
        originalId: currentRow.value.original_item.matchedDataId // 已更新
      })
    }
  }
  showSelectionDialog.value = false
}
// 保持相似匹配下拉框的选择逻辑不变

const handleSaveEdit = (row) => {
  row.editing = false
  // You might want to add validation here
  // ElMessage.success('修改已保存')
}

const handleCancelEdit = (row) => {
  row.editing = false
  // Here you might want to revert changes if you stored the original state
}

const handleSave = async () => {
  saving.value = true
  try {
    // 只保存用户编辑过变动的数据
    const updateObjList = tableData.value
      .filter((item) => {
        if (
          !(
            item.match_type === '相似匹配' ||
            item.match_type === '未知' ||
            item.match_type === '无匹配'
          )
        )
          return false
        // 对比行数据层id和快照，识别有变化的数据
        const isModified =
          item.original_item.matchedDataId !== item.initialMatchedDataId ||
          item.original_item.matchedPriceId !== item.initialMatchedPriceId
        // console.log(
        //   `【诊断】保存检查: ID=${item.id}, 是否修改=${isModified}, original_item.matchedDataId=${item.original_item.matchedDataId}, initialMatchedDataId=${item.initialMatchedDataId}`
        // )
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

    const saveWorkflowId = '7519356799683919872' // 乙供物资保存工作流id
    const saveResult = await cozeService.runWorkflow(saveWorkflowId, { updateObjList })

    if (saveResult && saveResult.data) {
      ElMessage.success('保存成功')
      handleClose()
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

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.material-detail-dialog .el-dialog__body {
  padding: 20px;
}
</style>
