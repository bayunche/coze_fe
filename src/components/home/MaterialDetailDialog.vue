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
                  :label="`${item.name} (${item.specification}, ${item.price}元, ${item.similarity * 100}%)`"
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
// import CozeService from '@/uitls/coze.js' // Assuming you have a service to fetch data

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

// Mock data for now
const mockData = [
  {
    id: 1,
    material_name: '螺纹钢 HRB400E Φ12',
    material_specification: 'HRB400E Φ12',
    material_price: 4500,
    matched_name: '螺纹钢 HRB400E Φ12',
    matched_specification: 'HRB400E Φ12',
    matched_price: 4500,
    similarity: 1.0,
    match_type: '精确匹配',
    similar_matches: [],
    editing: false
  },
  {
    id: 2,
    material_name: '普通混凝土 C30',
    material_specification: 'C30',
    material_price: 400,
    matched_name: '商品混凝土 C30',
    matched_specification: 'C30',
    matched_price: 410,
    similarity: 0.9,
    match_type: '相似匹配',
    similar_matches: [
      { name: '商品混凝土', specification: 'C30', price: 410, similarity: 0.98, value: 'match1' },
      { name: '泵送混凝土', specification: 'C30', price: 420, similarity: 0.95, value: 'match2' }
    ],
    selected_match: null,
    editing: false
  },
  {
    id: 3,
    material_name: '未知规格水泥',
    material_specification: '未知',
    material_price: 500,
    matched_name: '',
    matched_specification: '',
    matched_price: '',
    similarity: 0,
    match_type: '无匹配',
    similar_matches: [],
    editing: false
  }
]

const fetchDetails = async (taskId) => {
  if (!taskId) return
  loading.value = true
  try {
    // Replace with actual API call
    // const cozeService = new CozeService(...)
    // const result = await cozeService.getMaterialParsingDetails(taskId)
    // tableData.value = result.data
    
    // Using mock data for now
    tableData.value = JSON.parse(JSON.stringify(mockData));
    
  } catch (error) {
    ElMessage.error('获取详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.task,
  (newTask) => {
    if (newTask && newTask.task_number) {
      fetchDetails(newTask.task_number)
    }
  },
  { immediate: true }
)

const getMatchTypeTag = (type) => {
  if (type === '精确匹配') return 'success'
  if (type === '相似匹配') return 'warning'
  return 'danger'
}

const handleSimilarMatchChange = (row, selectedMatch) => {
  if (row && selectedMatch) {
    row.matched_name = selectedMatch.name
    row.matched_specification = selectedMatch.specification
    row.matched_price = selectedMatch.price
    row.similarity = selectedMatch.similarity
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
    // Replace with actual API call to save the results
    // const cozeService = new CozeService(...)
    // await cozeService.saveMaterialParsingResults(tableData.value)
    console.log('Saving data:', tableData.value)
    ElMessage.success('保存成功')
    handleClose()
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
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