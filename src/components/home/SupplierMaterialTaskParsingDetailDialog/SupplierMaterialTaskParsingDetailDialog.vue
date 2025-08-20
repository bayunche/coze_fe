<template>
  <el-dialog
    v-model="dialogVisible"
    :title="DIALOG_CONFIG.TITLE"
    :width="DIALOG_CONFIG.WIDTH"
    :close-on-click-modal="DIALOG_CONFIG.CLOSE_ON_CLICK_MODAL"
  >
    <el-table 
      :data="tableData" 
      v-loading="loading" 
      style="width: 100%"
    >
      <el-table-column 
        v-for="column in TABLE_COLUMNS"
        :key="column.prop || column.label"
        v-bind="column"
      >
        <!-- 开始时间列 -->
        <template v-if="column.prop === 'start_time'" #default="{ row }">
          <span>{{ formatStartTime(row.start_time) }}</span>
        </template>
        
        <!-- 结束时间列 -->
        <template v-else-if="column.prop === 'end_time'" #default="{ row }">
          <span>{{ formatEndTime(row.end_time) }}</span>
        </template>
        
        <!-- 任务解析状态列 -->
        <template v-else-if="column.prop === 'TASK_DETAIL_STATUS'" #default="{ row }">
          <span>{{ formatTaskDetailStatus(row.TASK_DETAIL_STATUS) }}</span>
        </template>
        
        <!-- 失败原因列 -->
        <template v-else-if="column.prop === 'ERROR_REASON'" #default="{ row }">
          <span>{{ formatErrorReason(row.ERROR_REASON) }}</span>
        </template>
        
        <!-- 操作列 -->
        <template v-else-if="column.label === '操作'" #default="{ row }">
          <el-button 
            type="text" 
            @click="() => onViewDetail(row)"
          >
            {{ BUTTON_LABELS.VIEW_DETAIL }}
          </el-button>
          <el-button 
            type="text" 
            @click="() => onDownloadFile(row)"
          >
            {{ BUTTON_LABELS.VIEW_SOURCE_FILE }}
          </el-button>
          <el-button 
            type="primary" 
            size="small"
            @click="() => onConfirmResults(row)"
            :disabled="row.taskDetailStatus !== '2'"
          >
            {{ BUTTON_LABELS.CONFIRM_RESULTS }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
      :current-page="currentPage"
      :page-sizes="PAGINATION_CONFIG.PAGE_SIZES"
      :page-size="pageSize"
      :layout="PAGINATION_CONFIG.LAYOUT"
      :total="total"
      :background="PAGINATION_CONFIG.BACKGROUND"
      :style="PAGINATION_CONFIG.STYLE"
    />
  </el-dialog>

  <!-- 乙供物资解析结果确认对话框 -->
  <SupplierMaterialConfirmDialog
    :show="showConfirmDialog"
    :task-id="confirmTaskId"
    @update:show="showConfirmDialog = $event"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue'

// 导入确认对话框组件
import SupplierMaterialConfirmDialog from '../SupplierMaterialConfirmDialog/SupplierMaterialConfirmDialog.vue'

// 导入常量和工具函数
import {
  DIALOG_CONFIG,
  TABLE_COLUMNS,
  BUTTON_LABELS,
  PAGINATION_CONFIG
} from './constants.js'

import {
  formatTaskDetailStatus,
  formatStartTime,
  formatEndTime,
  formatErrorReason,
  createRouter,
  viewDetail,
  downloadFile,
  onCurrentChange as utilOnCurrentChange,
  onSizeChange as utilOnSizeChange,
  createFetchDataFunction,
  shouldFetchData
} from './utils.js'

// Props定义
const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

console.log('SupplierMaterialTaskParsingDetailDialog setup - initial modelValue:', props.modelValue)

// Emits定义
const emit = defineEmits(['update:modelValue', 'view-detail'])

// 计算属性 - 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 响应式数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 确认对话框相关
const showConfirmDialog = ref(false)
const confirmTaskId = ref(null)

// 创建路由实例
const router = createRouter()

// 数据设置函数
const setLoading = (value) => { loading.value = value }
const setTableData = (data) => { tableData.value = data }
const setTotal = (value) => { total.value = value }
const setCurrentPage = (page) => { currentPage.value = page }
const setPageSize = (size) => { pageSize.value = size }

// 创建获取数据函数
const fetchDetailList = createFetchDataFunction({
  taskId: computed(() => props.taskId),
  currentPage,
  pageSize,
  setLoading,
  setTableData,
  setTotal
})

// 关闭对话框函数
const closeDialog = () => {
  dialogVisible.value = false
}

// 事件处理函数
const onViewDetail = (row) => {
  // 传递 props 中的 taskId 和 row 中的 id
  viewDetail({ ...row, taskId: props.taskId }, router, closeDialog)
}

const onDownloadFile = (row) => {
  downloadFile(row)
}

const onCurrentChange = (page) => {
  utilOnCurrentChange(page, setCurrentPage, fetchDetailList)
}

const onSizeChange = (size) => {
  utilOnSizeChange(size, setPageSize, setCurrentPage, fetchDetailList)
}

const onConfirmResults = (row) => {
  confirmTaskId.value = row.taskId
  showConfirmDialog.value = true
}

// 监听对话框显示和任务ID变化
watch(
  [dialogVisible, () => props.taskId],
  ([newDialogVisible, newTaskId]) => {
    console.log('SupplierMaterialTaskParsingDetailDialog - watch trigger:', {
      newDialogVisible,
      newTaskId
    })
    
    if (shouldFetchData(newDialogVisible, newTaskId)) {
      setCurrentPage(1) // 重置页码
      fetchDetailList()
    }
  },
  { immediate: true } // 确保在组件初始化时如果条件满足就立即执行
)
</script>

<style scoped>
/* 可以根据需要添加样式 */
</style>