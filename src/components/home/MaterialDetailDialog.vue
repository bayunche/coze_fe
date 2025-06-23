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
            <el-tag :type="getMatchTypeTag(scope.row.match_type)">{{ scope.row.match_type }}</el-tag>
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
                value-key="value"
                @change="handleSimilarMatchChange(scope.row, $event)"
              >
                <el-option
                  v-for="item in scope.row.similar_matches"
                  :key="item.value"
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
    @select="handleMaterialSelect"
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

    if (detailIdsResult && detailIdsResult.data) {
      const parsedOutput = JSON.parse(detailIdsResult.data)?.output
      if (Array.isArray(parsedOutput)) {
        allDetailIds.value = parsedOutput.map(item => JSON.parse(item).ID);
        totalDetails.value = allDetailIds.value.length;
      } else {
        ElMessage.warning('未获取到有效的详情ID列表。')
        loading.value = false
        return
      }
    } else {
      throw new Error('获取详情ID列表失败。')
    }

    // 2. 根据分页获取详情数据
    await fetchPaginatedDetails(taskId, currentPage.value, pageSize.value);

  } catch (error) {
    ElMessage.error(`获取详情失败: ${error.message}`)
    console.error('获取详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchPaginatedDetails = async (taskId, page, size) => {
  loading.value = true;
  tableData.value = [];

  const startIndex = (page - 1) * size;
  const endIndex = Math.min(startIndex + size, allDetailIds.value.length);
  const currentDetailIds = allDetailIds.value.slice(startIndex, endIndex);

  if (currentDetailIds.length === 0) {
    ElMessage.info('当前页没有数据。');
    loading.value = false;
    return;
  }

  const detailPromises = currentDetailIds.map(async (detailId) => {
    const detailWorkflowId = '7519045874770657299';
    const detailResult = await cozeService.runWorkflow(detailWorkflowId, {
      task_id: taskId,
      taskDetailId: detailId,
      index: page, // 这里的index和pageSize可能需要根据实际工作流的参数定义来调整
      pageSize: size
    });
    if (detailResult && detailResult.data) {
      const parsedData = JSON.parse(detailResult.data)?.output;
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // test.json 的 result 字段是一个数组，直接使用
        return parsedData.map(item => formatMaterialDetail(item));
      }
    }
    return null;
  });

  const results = await Promise.all(detailPromises);
  tableData.value = results.flat().filter(item => item !== null);
  loading.value = false;
};

// 格式化数据以适应表格和相似匹配的显示
const formatMaterialDetail = (item) => {
  const matchTypeMap = {
    0: '无匹配',
    1: '精确匹配',
    2: '相似匹配'
  };

  const formattedItem = {
    id: item.id,
    material_name: item.excelDataMaterialName,
    material_specification: item.excelDataSpecificationModel,
    material_price: item.excelDataPrice,
    matched_name: item.matchedDataMaterialName,
    matched_specification: item.matchedDataSpecificationModel,
    matched_price: item.matchedPrice,
    similarity: item.matchedScore !== null ? (item.matchedScore * 100).toFixed(2) + '%' : '/',
    match_type: matchTypeMap[item.comparison_result] || '未知',
    editing: false,
    selected_match: null, // 用于相似匹配的选中值
    original_item: item // 保留原始数据，方便后续操作
  };

  if (item.comparison_result === 2 && Array.isArray(item.subData)) {
    formattedItem.similar_matches = item.subData.map(sub => ({
      id: sub.id,
      matched_id: sub.matched_id,
      name: sub.matchedDataMaterialName || '未知名称', // 假设subData中也有这些字段
      specification: sub.matchedDataSpecificationModel || '未知型号',
      price: sub.matchedPrice || 0,
      similarity: sub.score || 0,
      matchedPriceQuarter: sub.matchedPriceQuarter || '未知季度', // 假设subData中包含匹配季度
      value: sub.id // 用于el-option的value
    }));
  } else {
    formattedItem.similar_matches = [];
  }
  return formattedItem;
};

// 处理分页变化
const handlePageChange = (newPage) => {
  currentPage.value = newPage;
  fetchPaginatedDetails(props.task.ID, newPage, pageSize.value);
};

// 处理页长变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1; // 页长变化后回到第一页
  fetchPaginatedDetails(props.task.ID, currentPage.value, newSize);
};

watch(
  () => props.task,
  (newTask) => {
    if (newTask && newTask.ID) { // 使用 newTask.ID 作为 task_id
      fetchDetails(newTask.ID)
    } else {
      tableData.value = []
      allDetailIds.value = []
      totalDetails.value = 0
      currentPage.value = 1
    }
  },
  { immediate: true, deep: true }
);

const formatSimilarMatchLabel = (item) => {
  const name = item.name || '';
  const specification = item.specification || '';
  const price = item.price !== null ? `¥${item.price.toFixed(2)}` : '';
  const similarity = item.similarity !== null ? `${(item.similarity * 100).toFixed(0)}%` : '';
  const quarter = item.matchedPriceQuarter || '';

  const parts = [];
  if (price) parts.push(price);
  if (similarity) parts.push(similarity);
  if (quarter) parts.push(quarter);

  const bracketContent = parts.join(',');
  return `${name} ${specification} (${bracketContent})`;
};

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
    row.similarity = selectedMatch.similarity !== null ? (selectedMatch.similarity * 100).toFixed(2) + '%' : '/';
    // 更新原始数据中的匹配ID，以便保存时使用
    const originalItem = row.original_item;
    if (originalItem) {
      originalItem.matchedDataId = selectedMatch.matched_id;
      originalItem.matchedDataMaterialName = selectedMatch.name;
      originalItem.matchedDataSpecificationModel = selectedMatch.specification;
      originalItem.matchedPrice = selectedMatch.price;
      originalItem.matchedScore = selectedMatch.similarity;
      originalItem.matchedPriceQuarter = selectedMatch.matchedPriceQuarter;
      originalItem.comparison_result = 1; // 相似匹配选择后，可以视为精确匹配
    }
  }
}

const handleEdit = (row) => {
  currentRow.value = row
  showSelectionDialog.value = true
}

const handleMaterialSelect = (selectedMaterial) => {
  if (currentRow.value && selectedMaterial) {
    currentRow.value.matched_name = selectedMaterial.name
    currentRow.value.matched_price = selectedMaterial.price
    currentRow.value.matched_specification = selectedMaterial.specification
    // similarity remains unchanged as per requirement
  }
  showSelectionDialog.value = false
}

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
    // 准备要提交的数据，只提交原始数据中需要修改的部分
    const payloads = tableData.value.map((item) => {
      const payload = { ...item.original_item }; // 使用原始数据
      // 如果有编辑状态，这里需要处理
      // delete payload.editing;
      return payload;
    });

    // 假设有一个保存乙供物资解析结果的工作流
    const saveWorkflowId = 'YOUR_SAVE_MATERIAL_PARSING_WORKFLOW_ID'; // 需要替换为实际的保存工作流ID
    // 这里的保存逻辑可能需要根据实际工作流的参数来调整，例如是批量保存还是逐条保存
    // 假设是批量保存，并且工作流接收一个数组
    const saveResult = await cozeService.runWorkflow(saveWorkflowId, { material_details: payloads });

    if (saveResult && saveResult.data) {
      ElMessage.success('保存成功');
      handleClose();
    } else {
      throw new Error('保存操作未返回有效结果。');
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