<template>
  <div class="supplier-material-approval-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">乙供物资审批管理</h1>
        <p class="page-desc">管理员审批乙供物资解析结果</p>
      </div>
      <div class="header-right">
        <el-button @click="refreshData" :loading="loading" type="primary">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 筛选卡片区域 -->
    <div class="filter-cards">
      <el-card
        v-for="(card, key) in FILTER_CARDS_CONFIG"
        :key="key"
        class="filter-card"
        :class="{ 'active': currentFilterType === card.queryType }"
        @click="handleFilterCardClick(card)"
        shadow="hover"
      >
        <div class="card-content">
          <div class="card-icon" :style="{ background: card.background }">
            {{ card.icon }}
          </div>
          <div class="card-info">
            <div class="card-title">{{ card.title }}</div>
            <div class="card-value" :style="{ color: card.color }">
              {{ statisticsData[card.key] || 0 }}
            </div>
            <div class="card-desc">{{ card.description }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和工具栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索物资名称、规格型号..."
          style="width: 300px"
          clearable
          @change="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="action-section">
        <el-button
          v-if="selectedItems.length > 0"
          @click="handleBatchApprove"
          type="primary"
          :loading="batchApproving"
        >
          批量审批通过 ({{ selectedItems.length }})
        </el-button>
        <el-button
          v-if="selectedItems.length > 0"
          @click="handleBatchReject"
          type="danger"
          plain
          :loading="batchRejecting"
        >
          批量拒绝 ({{ selectedItems.length }})
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        row-key="taskDataId"
        @selection-change="handleSelectionChange"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" fixed="left" />

        <el-table-column prop="materialName" label="物资名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="specifications" label="规格型号" min-width="150" show-overflow-tooltip />

        <el-table-column prop="unit" label="单位" width="80" />

        <el-table-column prop="quantity" label="数量" width="100" align="right" />

        <el-table-column prop="unitPrice" label="单价" width="120" align="right">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.unitPrice }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalPrice" label="总价" width="120" align="right">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.totalPrice }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="matchedType" label="匹配类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMatchTypeColor(row.matchedType)" size="small">
              {{ getMatchTypeText(row.matchedType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="confirmType" label="确认类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getConfirmTypeColor(row.confirmType)" size="small">
              {{ getConfirmTypeText(row.confirmType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              @click="handleViewDetail(row)"
              size="small"
              type="primary"
              link
            >
              查看详情
            </el-button>
            <el-button
              @click="handleApprove(row)"
              size="small"
              type="success"
              link
              :loading="row._approving"
            >
              通过
            </el-button>
            <el-button
              @click="handleReject(row)"
              size="small"
              type="danger"
              link
              :loading="row._rejecting"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 审批对话框 -->
    <ApprovalDialog
      v-model:show="approvalDialogVisible"
      :approval-type="currentApprovalType"
      :selected-items="approvalItems"
      @confirm="handleApprovalConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ApprovalDialog from './components/ApprovalDialog.vue'
import supplierMaterialService from '@/services/SupplierMaterialService'
import {
  FILTER_CARDS_CONFIG
} from './constants.js'
import {
  getMatchTypeText,
  getMatchTypeColor,
  getConfirmTypeText,
  getConfirmTypeColor
} from './utils.js'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const batchApproving = ref(false)
const batchRejecting = ref(false)
const searchKeyword = ref('')
const currentFilterType = ref(3) // 默认查全部
const tableData = ref([])
const selectedItems = ref([])
const tableRef = ref()

// 统计数据
const statisticsData = reactive({
  manualCount: 0,    // 人工修改物资数量
  autoCount: 0,      // 系统自动匹配数量
  totalCount: 0      // 总数量
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 审批对话框
const approvalDialogVisible = ref(false)
const currentApprovalType = ref('approve') // 'approve' | 'reject'
const approvalItems = ref([])

// 计算属性
const currentTaskId = computed(() => {
  // 从路由或其他地方获取当前任务ID
  return router.currentRoute.value.params.taskId || ''
})

// 方法
const loadData = async () => {
  try {
    loading.value = true

    if (!currentTaskId.value) {
      ElMessage.warning('缺少任务ID参数')
      return
    }

    const params = {
      taskId: currentTaskId.value,
      page: pagination.currentPage - 1,
      size: pagination.pageSize,
      queryType: currentFilterType.value,
      keyword: searchKeyword.value
    }

    const response = await supplierMaterialService.queryMaterialsByType(params)

    if (response && response.content) {
      tableData.value = response.content
      pagination.total = response.pageInfo?.totalElements || 0
    } else {
      tableData.value = []
      pagination.total = 0
    }

    // 清空选中项
    selectedItems.value = []

  } catch (error) {
    console.error('【错误】加载数据失败:', error)
    ElMessage.error('加载数据失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    if (!currentTaskId.value) return

    // 使用新的扩展统计接口
    const statistics = await supplierMaterialService.getTaskMaterialMatchingStats(currentTaskId.value)

    Object.assign(statisticsData, statistics)

    console.log('【统计数据】已更新:', statisticsData)
  } catch (error) {
    console.error('【错误】加载统计数据失败:', error)
    // 使用默认值
    Object.assign(statisticsData, {
      manualCount: 0,
      autoCount: 0,
      totalCount: 0
    })
  }
}

const refreshData = async () => {
  await Promise.all([
    loadData(),
    loadStatistics()
  ])
  ElMessage.success('数据刷新成功')
}

const handleFilterCardClick = (card) => {
  if (currentFilterType.value === card.queryType) return

  currentFilterType.value = card.queryType
  pagination.currentPage = 1
  loadData()
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedItems.value = selection
}

const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize
  pagination.currentPage = 1
  loadData()
}

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage
  loadData()
}

const handleViewDetail = (row) => {
  // 跳转到详情页
  router.push(`/supplier-material-detail/${row.taskId}/${row.taskDetailId}`)
}

const handleApprove = (row) => {
  currentApprovalType.value = 'approve'
  approvalItems.value = [row]
  approvalDialogVisible.value = true
}

const handleReject = (row) => {
  currentApprovalType.value = 'reject'
  approvalItems.value = [row]
  approvalDialogVisible.value = true
}

const handleBatchApprove = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要审批的项目')
    return
  }

  currentApprovalType.value = 'approve'
  approvalItems.value = [...selectedItems.value]
  approvalDialogVisible.value = true
}

const handleBatchReject = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要拒绝的项目')
    return
  }

  currentApprovalType.value = 'reject'
  approvalItems.value = [...selectedItems.value]
  approvalDialogVisible.value = true
}

const handleApprovalConfirm = async (approvalData) => {
  try {
    const isApprove = currentApprovalType.value === 'approve'
    const loadingRef = isApprove ? batchApproving : batchRejecting

    loadingRef.value = true

    // 调用任务审批API
    const approvalParams = {
      taskId: currentTaskId.value,
      approvalResult: isApprove ? 1 : 0,
      approvalReason: approvalData.approvalReason || approvalData.remark,
      approverId: approvalData.approverId,
      approverName: approvalData.approverName
    }

    await supplierMaterialService.approveTask(approvalParams)

    // 刷新数据
    await refreshData()

  } catch (error) {
    console.error('【错误】审批操作失败:', error)
    ElMessage.error(`${currentApprovalType.value === 'approve' ? '审批' : '拒绝'}操作失败: ${error.message}`)
  } finally {
    const loadingRef = currentApprovalType.value === 'approve' ? batchApproving : batchRejecting
    loadingRef.value = false
    approvalDialogVisible.value = false
  }
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.supplier-material-approval-page {
  padding: 24px;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.filter-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.filter-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.filter-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.filter-card.active {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.action-section {
  display: flex;
  gap: 8px;
}

.table-card {
  border: 1px solid var(--el-border-color-lighter);
}

.price-text {
  font-weight: 500;
  color: var(--el-color-success);
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supplier-material-approval-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filter-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .action-section {
    justify-content: center;
  }
}
</style>