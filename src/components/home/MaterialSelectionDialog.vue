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
        <el-table-column prop="material_name" label="物资名称"></el-table-column>

        <el-table-column prop="specification_model" label="规格型号"></el-table-column>
        <el-table-column prop="tax_price" label="价格" width="120"></el-table-column>
        <el-table-column prop="quarter" label="价格所属季度" width="120"></el-table-column>
        <el-table-column prop="unit" label="单位"></el-table-column>
      </el-table>
      <el-pagination
        v-if="total > pageSize"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :current-page="pageNum"
        @current-change="onPageChange"
        @size-change="onSizeChange"
        style="margin-top: 10px; text-align: right"
      />
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
  modelValue: {
    type: Boolean,
    required: true
  },
  dataList: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  pageNum: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'page-change', 'size-change', 'search'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchTerm = ref('')
const selectedMaterial = ref(null)

const filteredData = computed(() => {
  // 现在直接使用传入的数据，搜索在服务器端处理
  return props.dataList
})

// 添加搜索功能的监听器
watch(searchTerm, (newVal) => {
  emit('search', newVal)
})

watch(
  () => dialogVisible.value,
  (newVal) => {
    if (!newVal) {
      searchTerm.value = ''
      selectedMaterial.value = null
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

const onPageChange = (page) => {
  emit('page-change', page)
}

const onSizeChange = (size) => {
  emit('size-change', size)
}
</script>

<style scoped>
.selection-dialog-content {
  padding: 10px;
}
</style>
