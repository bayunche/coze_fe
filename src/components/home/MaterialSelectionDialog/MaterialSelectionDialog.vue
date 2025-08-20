<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择匹配物资"
    width="50%"
    :before-close="closeDialog"
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
        :data="formattedData"
        v-loading="loading"
        @row-click="onRowClick"
        style="width: 100%"
        height="40vh"
        highlight-current-row
      >
        <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="specificationModel" label="规格型号" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column label="最新价格" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.latestPrice">¥{{ row.latestPrice }}</span>
            <span v-else class="text-gray-400">暂无价格</span>
          </template>
        </el-table-column>
        <el-table-column label="价格季度" width="100">
          <template #default="{ row }">
            <span v-if="row.latestQuarter">{{ row.latestQuarter }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
        <el-table-column label="历史价格" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.priceCount }}个</el-tag>
          </template>
        </el-table-column>
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
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="confirmSelection" :disabled="!selectedMaterial">
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

// 格式化数据以适配新的接口结构
const formattedData = computed(() => {
  return props.dataList.map(item => {
    // 新接口格式：materialBaseInfo + priceList
    const materialBaseInfo = item.materialBaseInfo || item
    const priceList = item.priceList || []
    
    // 获取最新价格（第一个价格选项）
    const latestPrice = priceList.length > 0 ? priceList[0] : null
    
    return {
      // 原始数据，用于选择时传递完整信息
      originalData: item,
      
      // 显示字段
      materialName: materialBaseInfo.materialName || materialBaseInfo.material_name || '-',
      specificationModel: materialBaseInfo.specificationModel || materialBaseInfo.specification_model || '-',
      unit: materialBaseInfo.unit || '-',
      type: materialBaseInfo.type || '-',
      
      // 价格信息
      latestPrice: latestPrice ? parseFloat(latestPrice.taxPrice).toFixed(2) : null,
      latestQuarter: latestPrice ? latestPrice.quarter : null,
      priceCount: priceList.length,
      
      // 兼容旧格式的字段映射
      material_name: materialBaseInfo.materialName || materialBaseInfo.material_name,
      specification_model: materialBaseInfo.specificationModel || materialBaseInfo.specification_model,
      tax_price: latestPrice ? latestPrice.taxPrice : null,
      quarter: latestPrice ? latestPrice.quarter : null
    }
  })
})

// 添加搜索功能的监听器（防抖处理）
let searchTimeout = null
watch(searchTerm, (newVal) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    emit('search', newVal)
  }, 300) // 300ms防抖
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

const onRowClick = (row) => {
  // 使用格式化后的数据，但在选择时传递原始数据结构
  selectedMaterial.value = row.originalData || row
}

const confirmSelection = () => {
  if (selectedMaterial.value) {
    emit('select', selectedMaterial.value)
    closeDialog()
  } else {
    ElMessage.warning('请选择一个物资')
  }
}

const closeDialog = () => {
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
