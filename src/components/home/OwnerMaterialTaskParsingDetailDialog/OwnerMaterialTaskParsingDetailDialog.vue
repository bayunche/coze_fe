<template>
  <el-dialog
    title="乙供物资解析任务详情列表"
    v-model="dialogVisible"
    width="60%"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <!-- 序号 -->
      <el-table-column type="index" prop="" label="序号" width="60"></el-table-column>

      <el-table-column prop="fileName" label="文件名称"></el-table-column>
      <el-table-column prop="startTime" label="开始时间">
        <template #default="{ row }">
          {{ row.startTime ? new Date(row.startTime).toLocaleString() : '未开始' }}
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="结束时间">
        <template #default="{ row }">
          {{ row.endTime ? new Date(row.endTime).toLocaleString() : '未结束' }}
        </template>
      </el-table-column>
      <el-table-column prop="taskDetailStatus" label="任务解析状态">
        <template #default="{ row }">
          {{ formatTaskDetailStatus(row.taskDetailStatus, row.errorReason) }}
        </template>
      </el-table-column>
      <el-table-column prop="errorReason" label="失败原因">
        <template #default="{ row }">
          {{ row.errorReason || '无' }}
        </template>
      </el-table-column>

      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="handleViewDetail(row)">查看详情</el-button>
          <el-button type="text" @click="downLoadFile(row)">查看源文件</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      background
      style="margin-top: 20px; text-align: right"
    >
    </el-pagination>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import smartBrainService from '@/services/SmartBrainService.js'

const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  },
  modelValue: {
    // 假设v-model绑定的是modelValue
    type: Boolean,
    default: false
  }
})

console.log('OwnerMaterialTaskParsingDetailDialog setup - initial modelValue:', props.modelValue)

const formatTaskDetailStatus = (status, errorReason) => {
  // 当 errorReason 不为空且 taskDetailStatus 为 -1 时，标记为解析失败
  if (errorReason && Number(status) === -1) {
    return '解析失败'
  }
  
  switch (Number(status)) {
    case 0:
      return '排队中'
    case 1:
      return '处理中'
    case 2:
      return '处理完成'
    case 3:
      return '已确认'
    case -1:
      return '错误中断'
    default:
      return '未知状态'
  }
}
const emit = defineEmits(['update:modelValue', 'view-detail'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)


const fetchDetailList = async () => {
  loading.value = true
  try {
    // 调用后端接口获取任务详情列表，页码从0开始
    const params = {
      page: currentPage.value - 1, // 前端页码从1开始，后端从0开始
      size: pageSize.value
    }
    
    const result = await smartBrainService.getTaskDetailsList(props.taskId, params)
    
    if (result && result.content && Array.isArray(result.content)) {
      tableData.value = result.content
      total.value = result.totalElements || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取甲供物资解析详情列表失败:', error)
    ElMessage.error('获取甲供物资解析详情列表失败: ' + (error.message || '未知错误'))
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleViewDetail = (row) => {
  console.log('【调试】甲供物资详情查看 - row对象:', row)
  
  // 甲供物资应该使用对话框显示详情，而不是路由跳转
  // 发出事件让父组件处理详情显示
  emit('view-detail', {
    taskId: props.taskId,
    detailId: row.id || row.taskDetailId || row.detailId,
    row: row
  })
  
  // 暂时不关闭当前弹窗，让用户可以继续查看列表
  // dialogVisible.value = false
}

watch(
  [dialogVisible, () => props.taskId],
  ([newDialogVisible, newTaskId]) => {
    console.log('OwnerMaterialTaskParsingDetailDialog - watch trigger:', {
      newDialogVisible,
      newTaskId
    })
    if (newDialogVisible && newTaskId) {
      currentPage.value = 1 // 重置页码
      fetchDetailList()
    }
  },
  { immediate: true } // 确保在组件初始化时如果条件满足就立即执行
)

// 处理分页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDetailList()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 改变每页大小时重置到第一页
  fetchDetailList()
}
const downLoadFile = async (row) => {
  console.log('下载源文件:', row)
  
  try {
    // 动态导入文件下载工具函数
    const { downloadSourceFile } = await import('@/utils/fileDownload.js')
    downloadSourceFile(row)
  } catch (error) {
    console.error('导入文件下载工具失败:', error)
    ElMessage.error('下载功能加载失败')
  }
}
</script>

<style scoped>
/* 样式可以根据需要添加 */
</style>
