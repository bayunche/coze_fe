<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择匹配物资"
    width="50%"
    :before-close="handleClose"
    append-to-body
  >
    <div class="selection-dialog-content">
      <el-input
        v-model="searchTerm"
        placeholder="搜索物资名称"
        clearable
        style="margin-bottom: 20px"
      ></el-input>
      <el-table
        :data="filteredData"
        v-loading="loading"
        @row-click="handleRowClick"
        style="width: 100%"
        height="40vh"
        highlight-current-row
      >
        <el-table-column prop="name" label="物资名称"></el-table-column>
        <el-table-column prop="price" label="价格" width="120"></el-table-column>
        <el-table-column prop="specification" label="规格型号"></el-table-column>
      </el-table>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedMaterial">
          确认选择
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:show', 'select'])

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const loading = ref(false)
const searchTerm = ref('')
const allMaterials = ref([])
const selectedMaterial = ref(null)

// 模拟从数据库获取的物料列表
const mockMaterials = [
  { id: 101, name: '螺纹钢', price: 4600, specification: 'HRB400E Φ12' },
  { id: 102, name: '商品混凝土', price: 410, specification: 'C30' },
  { id: 103, name: '泵送混凝土', price: 420, specification: 'C30' },
  { id: 104, name: '普通水泥', price: 550, specification: 'P.O 42.5' },
  { id: 105, name: '高标号水泥', price: 600, specification: 'P.O 52.5' },
  { id: 106, name: '粉煤灰', price: 200, specification: '一级' },
  { id: 107, name: '建筑用砂', price: 150, specification: '中砂' },
  { id: 108, name: '碎石', price: 120, specification: '5-20mm' }
]

const fetchMaterials = async () => {
  loading.value = true
  try {
    // 在实际应用中，这里会调用API
    // const response = await api.getMaterials();
    // allMaterials.value = response.data;
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
    allMaterials.value = mockMaterials
  } catch (error) {
    ElMessage.error('获取物料列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const filteredData = computed(() => {
  if (!searchTerm.value) {
    return allMaterials.value
  }
  return allMaterials.value.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      fetchMaterials()
      selectedMaterial.value = null // 重置选择
    }
  }
)

const handleRowClick = (row) => {
  selectedMaterial.value = row
}

const handleConfirm = () => {
  if (selectedMaterial.value) {
    emit('select', selectedMaterial.value)
    handleClose()
  } else {
    ElMessage.warning('请选择一个物资')
  }
}

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.selection-dialog-content {
  padding: 10px;
}
</style>