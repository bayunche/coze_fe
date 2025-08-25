<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择匹配物资和价格"
    width="80%"
    :before-close="closeDialog"
    append-to-body
    custom-class="material-selection-dialog"
    top="5vh"
  >
    <div class="selection-dialog-content">
      <div class="search-section">
        <el-input
          v-model="searchTerm"
          placeholder="搜索物资名称、规格型号等..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        :data="formattedData"
        v-loading="loading"
        @row-click="onRowClick"
        style="width: 100%"
        height="50vh"
        highlight-current-row
        border
        stripe
        :row-class-name="getRowClassName"
      >
        <el-table-column
          prop="materialName"
          label="物资名称"
          min-width="150"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column
          prop="specificationModel"
          label="规格型号"
          min-width="150"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
        <el-table-column
          prop="materialCode"
          label="物资编码"
          width="120"
          show-overflow-tooltip
        ></el-table-column>
        <el-table-column label="价格" width="120" align="right">
          <template #default="{ row }">
            <div class="price-info">
              <span class="price-value">¥{{ row.taxPrice }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="季度" width="100" align="center">
          <template #default="{ row }">
            <span class="quarter-info">{{ row.quarter }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
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
        />
      </div>
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
import { Search } from '@element-plus/icons-vue'

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

// 格式化数据：将物资+价格列表转换为以价格为维度的扁平化数据
const formattedData = computed(() => {
  const result = []

  console.log('【MaterialSelectionDialog 调试】开始处理数据')
  console.log('【MaterialSelectionDialog 调试】原始 props.dataList:', props.dataList)
  console.log('【MaterialSelectionDialog 调试】dataList 长度:', props.dataList.length)

  props.dataList.forEach((item, itemIndex) => {
    console.log(`【MaterialSelectionDialog 调试】处理第 ${itemIndex + 1} 个物资:`, item)
    
    // 检查数据结构并正确访问 materialBaseInfo 和 priceList
    let materialBaseInfo, priceList
    
    console.log(`【MaterialSelectionDialog 调试】检查 item.originalData:`, item.originalData)
    
    if (item.originalData) {
      console.log(`【MaterialSelectionDialog 调试】originalData 结构:`, item.originalData)
      console.log(`【MaterialSelectionDialog 调试】originalData.materialBaseInfo:`, item.originalData.materialBaseInfo)
      console.log(`【MaterialSelectionDialog 调试】originalData.priceList:`, item.originalData.priceList)
      
      // 如果数据已经被格式化过，从 originalData 中获取
      materialBaseInfo = item.originalData.materialBaseInfo || item
      priceList = item.originalData.priceList || []
      console.log(`【MaterialSelectionDialog 调试】从 originalData 访问数据`)
    } else {
      // 如果是直接的 API 数据格式
      materialBaseInfo = item.materialBaseInfo || item
      priceList = item.priceList || []
      console.log(`【MaterialSelectionDialog 调试】从直接数据访问`)
    }
    
    console.log(`【MaterialSelectionDialog 调试】最终获取的 materialBaseInfo:`, materialBaseInfo)
    console.log(`【MaterialSelectionDialog 调试】最终获取的 priceList:`, priceList)
    
    console.log(`【MaterialSelectionDialog 调试】物资基础信息:`, materialBaseInfo)
    console.log(`【MaterialSelectionDialog 调试】价格列表:`, priceList)
    console.log(`【MaterialSelectionDialog 调试】价格列表长度:`, priceList.length)
    
    // 如果有价格数据，每个价格创建一条记录
    if (priceList.length > 0) {
      priceList.forEach((price, priceIndex) => {
        console.log(`【MaterialSelectionDialog 调试】处理第 ${priceIndex + 1} 个价格:`, price)
        
        const formattedRecord = {
          // 原始数据，包含物资和价格信息
          originalData: {
            materialBaseInfo,
            priceInfo: price,
            fullItem: item
          },

          // 物资信息
          materialName: materialBaseInfo.materialName || '-',
          specificationModel: materialBaseInfo.specificationModel || '-',
          unit: materialBaseInfo.unit || '-',
          type: materialBaseInfo.type || '-',
          materialCode: materialBaseInfo.materialCode || '-',

          // 价格信息 - 确保价格正确显示，包括0价格
          taxPrice:
            price.taxPrice !== undefined && price.taxPrice !== null
              ? parseFloat(price.taxPrice).toFixed(2)
              : '0.00',
          quarter: price.quarter || '-',
          priceId: price.id,
          baseInfoId: price.baseInfoId,

          // 兼容旧格式的字段映射
          material_name: materialBaseInfo.materialName,
          specification_model: materialBaseInfo.specificationModel,
          tax_price: price.taxPrice
        }
        
        console.log(`【MaterialSelectionDialog 调试】格式化后的记录:`, formattedRecord)
        console.log(`【MaterialSelectionDialog 调试】价格字段检查 - 原始价格:`, price.taxPrice, '格式化价格:', formattedRecord.taxPrice)
        console.log(`【MaterialSelectionDialog 调试】季度字段检查 - 原始季度:`, price.quarter, '格式化季度:', formattedRecord.quarter)
        
        result.push(formattedRecord)
      })
    } else {
      console.log(`【MaterialSelectionDialog 调试】物资 ${materialBaseInfo.materialName} 没有价格数据`)
      
      // 如果没有价格数据，仍然创建一条记录但价格字段为空
      const emptyRecord = {
        originalData: {
          materialBaseInfo,
          priceInfo: null,
          fullItem: item
        },

        materialName: materialBaseInfo.materialName || '-',
        specificationModel: materialBaseInfo.specificationModel || '-',
        unit: materialBaseInfo.unit || '-',
        type: materialBaseInfo.type || '-',
        materialCode: materialBaseInfo.materialCode || '-',

        taxPrice: '-',
        quarter: '-',
        priceId: null,
        baseInfoId: materialBaseInfo.id,

        material_name: materialBaseInfo.materialName,
        specification_model: materialBaseInfo.specificationModel,
        tax_price: null
      }
      
      console.log(`【MaterialSelectionDialog 调试】空价格记录:`, emptyRecord)
      result.push(emptyRecord)
    }
  })

  console.log('【MaterialSelectionDialog 调试】最终扁平化结果:')
  console.log('【MaterialSelectionDialog 调试】结果长度:', result.length)
  console.log('【MaterialSelectionDialog 调试】完整结果:', result)
  
  // 检查前几条记录的关键字段
  result.slice(0, 3).forEach((record, index) => {
    console.log(`【MaterialSelectionDialog 调试】第 ${index + 1} 条记录关键字段:`, {
      materialName: record.materialName,
      taxPrice: record.taxPrice,
      quarter: record.quarter,
      priceId: record.priceId,
      baseInfoId: record.baseInfoId
    })
  })

  return result
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
  // 选择价格维度的数据，传递包含物资和价格信息的完整数据
  selectedMaterial.value = row
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

// 获取行样式类名
const getRowClassName = ({ row }) => {
  if (
    selectedMaterial.value &&
    selectedMaterial.value.priceId === row.priceId &&
    selectedMaterial.value.baseInfoId === row.baseInfoId
  ) {
    return 'selected-row'
  }
  return 'selectable-row'
}
</script>

<style scoped>
/* 对话框样式 */
:deep(.material-selection-dialog) {
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
  box-shadow: var(--theme-dialog-shadow);
}

:deep(.material-selection-dialog .el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
  border-bottom: 1px solid var(--theme-border-secondary);
  padding: 16px 24px;
}

:deep(.material-selection-dialog .el-dialog__body) {
  padding: 24px;
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
}

.selection-dialog-content {
  width: 100%;
}

/* 搜索区域样式 */
.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
}

/* 价格信息样式 */
.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-value {
  font-weight: 600;
  color: var(--theme-success);
  font-size: 14px;
}

.no-price {
  color: var(--theme-text-tertiary);
  font-size: 12px;
}

.quarter-info {
  color: var(--theme-text-secondary);
  font-size: 12px;
}

.no-data {
  color: var(--theme-text-tertiary);
  font-size: 12px;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--theme-border-secondary);
}

/* 表格样式 */
:deep(.el-table) {
  background: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border);
}

:deep(.el-table th.el-table__cell) {
  background: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
  font-weight: 600;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg) !important;
}

/* 行样式 */
:deep(.el-table .selectable-row) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.el-table .selectable-row:hover td.el-table__cell) {
  background: var(--theme-table-hover-bg) !important;
}

:deep(.el-table .selected-row td.el-table__cell) {
  background: var(--theme-primary-light) !important;
  color: var(--theme-primary) !important;
}

:deep(.el-table .el-table__row.current-row > td.el-table__cell) {
  background: var(--theme-primary-light) !important;
}

/* 标签样式 */
:deep(.el-tag--primary) {
  background: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
  border-color: var(--theme-primary) !important;
}

/* 输入框样式 */
:deep(.el-input__wrapper) {
  background: var(--theme-input-bg) !important;
  border-color: var(--theme-input-border) !important;
  color: var(--theme-text-primary) !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--theme-primary) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--theme-primary) !important;
  box-shadow: 0 0 0 2px var(--theme-primary-light) !important;
}

:deep(.el-input__inner) {
  color: var(--theme-text-primary) !important;
}

:deep(.el-input__inner::placeholder) {
  color: var(--theme-text-tertiary) !important;
}

/* 分页组件样式 */
:deep(.el-pagination) {
  color: var(--theme-text-primary) !important;
}

:deep(.el-pagination .el-pager li) {
  background: var(--theme-bg-secondary) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border-primary) !important;
}

:deep(.el-pagination .el-pager li:hover) {
  background: var(--theme-primary-light) !important;
  color: var(--theme-primary) !important;
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--theme-primary) !important;
  color: var(--theme-text-inverse) !important;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: var(--theme-bg-secondary) !important;
  color: var(--theme-text-primary) !important;
  border: 1px solid var(--theme-border-primary) !important;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  background: var(--theme-primary-light) !important;
  color: var(--theme-primary) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.material-selection-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .search-input {
    max-width: none;
  }

  :deep(.el-table .el-table__cell) {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }

  .pagination-wrapper {
    margin-top: 16px;
  }

  :deep(.el-pagination) {
    text-align: center !important;
  }

  :deep(.el-pagination .el-pagination__sizes),
  :deep(.el-pagination .el-pagination__jump) {
    display: none !important;
  }
}
</style>
