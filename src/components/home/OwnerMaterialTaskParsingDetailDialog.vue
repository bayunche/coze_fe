<template>
  <el-dialog
    title="乙供物资解析任务详情列表"
    v-model="dialogVisible"
    width="60%"
    :close-on-click-modal="false"
  >
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <!-- 序号 -->
      <el-table-column type="index" prop="" label="序号" width="60"></el-table-column>

      <el-table-column prop="file_name" label="文件名称"></el-table-column>
      <el-table-column prop="start_time" label="开始时间">
        <template #default="{ row }">
          {{ row.start_time ? new Date(row.start_time).toLocaleString() : '未开始' }}
        </template>
      </el-table-column>
      <el-table-column prop="end_time" label="结束时间">
        <template #default="{ row }">
          {{ row.end_time ? new Date(row.end_time).toLocaleString() : '未结束' }}
        </template>
      </el-table-column>
      <el-table-column prop="TASK_DETAIL_STATUS" label="任务解析状态">
        <template #default="{ row }">
          {{ formatTaskDetailStatus(row.TASK_DETAIL_STATUS) }}
        </template>
      </el-table-column>
      <el-table-column prop="ERROR_REASON" label="失败原因">
        <template #default="{ row }">
          {{ row.ERROR_REASON || '无' }}
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
import CozeService from '@/uitls/coze.js'
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
  switch (status) {
    case '0':
      return '未开始'
    case '1':
      return '进行中'
    case '2':
      return '已完成'
    case '-1':
      return '失败'
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

const cozeService = new CozeService(
  'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
)
const fetchDetailList = async () => {
  loading.value = true
  try {
    const workflowId = '7519167663710257193' // 乙供物资解析详情列表ID
    const params = {
      task_id: props.taskId,
      pageNumber: currentPage.value,
      pageSize: pageSize.value
    }
    const result = await cozeService.runWorkflow(workflowId, params)
    if (result && result.data) {
      try {
        const parsedContent = JSON.parse(result.data)
        const outputArray = JSON.parse(parsedContent.output)
        const countArray = JSON.parse(parsedContent.count)

        tableData.value = outputArray
        total.value = countArray.length > 0 ? countArray[0]['count(*)'] : 0
      } catch (e) {
        ElMessage.error('解析数据失败: ' + e.message)
        tableData.value = []
        total.value = 0
      }
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取乙供物资解析详情列表失败:', error)
    ElMessage.error('获取乙供物资解析详情列表失败: ' + (error.message || '未知错误'))
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
    params: { taskId: row.TASK_ID }, // taskId 作为路由参数
    query: { detailId: row.ID } // detailId 作为查询参数
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
    row.FILE_URL ||
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
