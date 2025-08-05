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
          {{ formatTaskDetailStatus(row.taskDetailStatus) }}
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
import { useRouter } from 'vue-router' // 导入 useRouter

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

const formatTaskDetailStatus = (status) => {
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

const router = useRouter() // 将 useRouter 移动到顶层

const handleViewDetail = (row) => {
  router.push({
    name: 'MaterialDetailPage', // 使用路由名称
    params: { taskId: row.taskId }, // taskId 作为路由参数
    query: { detailId: row.id } // detailId 作为查询参数
  })
  dialogVisible.value = false // 关闭当前弹窗
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
const downLoadFile = (row) => {
  console.log('下载文件:', row)
  // 实现文件下载逻辑
  const url =
    row.fileUrl ||
    'https://p26-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/6aac8a6b025b4bd5812db0fc55de3e83.xlsx~tplv-mdko3gqilj-image.image?rk3s=81d4c505&x-expires=1782007995&x-signature=MShxLvZFXq%2FzGHhtntc73tmzQDs%3D&x-wf-file_name=LGJ2025JI011559-090000WP20220865+%E5%AE%A1%E6%A0%B8%E6%8A%A5%E5%91%8A.xlsx'
  // if (!url) {
  //   ElMessage.error('文件URL不存在')
  //   return
  // }
  window.open(url, '_blank')
}
</script>

<style scoped>
/* 样式可以根据需要添加 */
</style>
