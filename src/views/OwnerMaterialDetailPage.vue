<template>
  <div v-loading="loading" class="owner-material-detail-page">
    <div class="page-header">
      <h2>甲供物资解析详情</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <el-card class="project-info-card">
      <div class="card-item">
        <span class="label">项目名称:</span>
        <span class="value">{{ projectInfo.projectName }}</span>
      </div>
      <div class="card-item">
        <span class="label">项目编号:</span>
        <span class="value">{{ projectInfo.projectNumber }}</span>
      </div>
    </el-card>

    <el-table
      :data="tableData"
      style="width: 100%; margin-top: 20px"
      border
      stripe
      class="material-table"
    >
      <el-table-column label="序号" width="60">
        <template #default="{ $index }">
          {{ (currentPage - 1) * pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="materialName" label="物资名称" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.materialName || '/' }}</span>
          <el-input v-else v-model="scope.row.materialName"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="materialCategoryCode" label="物资品类编码" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.materialCategoryCode || '/' }}</span>
          <el-input v-else v-model="scope.row.materialCategoryCode"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="specificationModel" label="规格型号" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.specificationModel || '/' }}</span>
          <el-input v-else v-model="scope.row.specificationModel"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="计量单位" min-width="100">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.unit || '/' }}</span>
          <el-input v-else v-model="scope.row.unit"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="statisticalQuantity" label="统计数据数" min-width="100">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.statisticalQuantity || '/' }}</span>
          <el-input v-else v-model="scope.row.unit"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="requisitionQuantity" label="统计后申领数" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.requisitionQuantity || '/' }}</span>
          <el-input v-else v-model.number="scope.row.requisitionQuantity" type="number"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="supplier" label="供应商" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.supplier || '/' }}</span>
          <el-input v-else v-model.number="scope.row.supplier" type="number"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="matchingStatus" label="对平情况" min-width="120">
        <template #default="scope">
          <span v-if="!scope.row.editing">
            <el-tag :type="getMatchingStatusTagType(scope.row.matchingStatus)">
              {{ getMatchingStatusText(scope.row.matchingStatus) }}
            </el-tag>
          </span>
          <el-input v-else v-model="scope.row.matchingStatus"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="actualSource" label="实际领料单数据来源" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.actualSource || '/' }}</span>
          <el-input v-else v-model="scope.row.actualSource"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="actualMaterialName" label="实际领料单物资名称" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.actualMaterialName || '/' }}</span>
          <el-input v-else v-model="scope.row.actualMaterialName"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="actualSpecifications" label="实际领料单规格型号" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.actualSpecifications || '/' }}</span>
          <el-input v-else v-model="scope.row.actualSpecifications"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="actualUnit" label="实际领料单计量单位" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.actualUnit || '/' }}</span>
          <el-input v-else v-model="scope.row.actualUnit"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="actualApplicationQuantity" label="交易数量" min-width="120">
        <template #default="scope">
          <span v-if="!scope.row.editing">
            <el-tag :type="scope.row.actualApplicationQuantity >= 0 ? 'success' : 'warning'">
              {{ scope.row.actualApplicationQuantity || '/' }}
              <span style="margin-left: 4px">{{
                scope.row.actualApplicationQuantity >= 0 ? '(用料)' : '(退料)'
              }}</span>
            </el-tag>
          </span>
          <el-input
            v-else
            v-model.number="scope.row.actualApplicationQuantity"
            type="number"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="transactionCount" label="关联交易数" min-width="120">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.transactionCount || '/' }}</span>
          <el-input v-else v-model.number="scope.row.transactionCount" type="number"></el-input>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalDetails"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      class="modern-pagination"
    />
    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button type="primary" @click="handleGenerateReport" :loading="saving"
        >生成解析报告</el-button
      >
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { queryBalanceDetails, queryTaskLinkProjectInfo } from '@/utils/backendWorkflow'
import { useOwnerMaterialStore, TaskStatus } from '@/stores/ownerMaterial'

const router = useRouter()
const route = useRoute()
const ownerMaterialStore = useOwnerMaterialStore()

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const originalData = ref([]) // 用于存储原始数据，以便进行diff

const currentPage = ref(1)
const pageSize = ref(10)
const totalDetails = ref(0)

const projectInfo = ref({
  projectName: '项目名称占位',
  projectNumber: '项目编号占位'
})

// 转换新API数据为表格需要的结构
const transformDataForTable = (data) => {
  return data.map((item, index) => {
    return {
      id: item.id, // 使用 id 作为唯一标识
      rowId: item.id,
      isFirstChild: true, // 新API每条记录都是独立的
      // 基础物资信息（来自标准物料库）
      materialName: item.baseMaterialName || '/',
      materialCategoryCode: item.baseDataId || '/', // 使用 baseDataId 作为编码
      specificationModel: item.baseSpecificationModel || '/',
      unit: item.baseUnit || '/',
      // 申领相关信息
      requisitionQuantity: item.requisitionQuantity || 0,
      statisticalQuantity: item.statisticalQuantity || 0,
      supplier: item.supplierName || '/',
      // 对平状态
      matchingStatus: item.finalBalanceStatus,
      // 实际用料信息
      actualSource: item.dataSourcePath || '/',
      actualMaterialName: item.usageMaterialName || '/',
      actualSpecifications: item.usageSpecificationModel || '/',
      actualUnit: item.baseUnit || '/', // 用料单位使用标准单位
      actualApplicationQuantity: item.transactionQuantity || 0,
      // 额外信息
      transactionCount: item.transactionCountForSummary || 0,
      // 保存原始数据
      originalData: item
    }
  })
}

// 获取数据
const fetchOwnerMaterialDetail = async (page = currentPage.value, size = pageSize.value) => {
  loading.value = true
  try {
    // 优先从store中获取taskId，如果获取不到则从URL中解析
    const taskId = ownerMaterialStore.currentTask.taskId || route.query.taskId
    if (!taskId) {
      ElMessage.error('缺少 taskId，无法加载数据。')
      loading.value = false
      return
    }

    const response = await queryBalanceDetails({
      taskId,
      page: page - 1, // 后端分页从0开始
      size
    })

    if (response && response.data && response.data.content && response.data.content.length > 0) {
      const flattenedData = transformDataForTable(response.data.content)
      tableData.value = flattenedData.map((item) => ({
        ...item,
        original: { ...item },
        editing: false,
        isMergedStart: false
      }))
      originalData.value = flattenedData.map((item) => ({ ...item }))
      totalDetails.value = response.data.totalElements || 0
      // 新API每条记录都是独立的，不需要合并单元格
      // getSpanArr(tableData.value) // 计算合并信息
      ElMessage.success('甲供物资详情数据加载成功！')
    } else {
      tableData.value = []
      originalData.value = []
      totalDetails.value = 0
      ElMessage.info('未获取到甲供物资详情数据。')
    }

    // 项目信息已在 onMounted 中获取
  } catch (error) {
    ElMessage.error(`加载详情失败: ${error.message}`)
    console.error('加载详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取项目信息
const loadProjectInfo = async (taskId) => {
  try {
    const projectData = await queryTaskLinkProjectInfo(taskId)
    if (projectData) {
      projectInfo.value.projectName = projectData.projectName || '项目名称未知'
      projectInfo.value.projectNumber = projectData.projectCode || '项目编号未知'
    } else {
      // 如果API没有找到项目信息，使用占位符或URL参数
      projectInfo.value.projectName = route.query.projectName || '项目名称占位'
      projectInfo.value.projectNumber = route.query.projectNumber || '项目编号占位'
    }
  } catch (error) {
    console.error('获取项目信息失败:', error)
    // 出错时使用占位符或URL参数
    projectInfo.value.projectName = route.query.projectName || '项目名称占位'
    projectInfo.value.projectNumber = route.query.projectNumber || '项目编号占位'
  }
}

// 保存数据占位函数
const saveOwnerMaterialDetail = async (data) => {
  saving.value = true
  try {
    // 模拟API请求
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('提交的数据:', data)
    ElMessage.success('甲供物资详情数据保存成功！')
  } catch (error) {
    ElMessage.error(`保存失败: ${error.message}`)
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  fetchOwnerMaterialDetail(newPage, pageSize.value)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchOwnerMaterialDetail(currentPage.value, newSize)
}

const handleEdit = (row) => {
  row.editing = true
}

const handleSaveEdit = (row) => {
  row.editing = false
  // 自动创建一个新的对象以供提交，这里我们直接修改row，并在保存时进行diff
  // 实际应用中，你可能需要一个单独的editedItems数组来收集这些对象
}

const handleCancelEdit = (row) => {
  row.editing = false
  // 恢复原始数据
  const originalItem = originalData.value.find((item) => item.id === row.id)
  if (originalItem) {
    // 使用 Object.assign 恢复原始值，但保留 editing 状态
    const currentEditingState = row.editing
    Object.assign(row, originalItem)
    row.editing = currentEditingState
  }
}

const handleGenerateReport = () => {
  // 导航到甲供物资解析报告页面
  router.push({
    name: 'OwnerMaterialReport',
    query: {
      taskId: route.query.taskId || route.query.taskDetailId || ownerMaterialStore.currentTaskId,
      projectName: projectInfo.value.projectName,
      projectNumber: projectInfo.value.projectNumber
    }
  })
}

const handleSave = async () => {
  const changedItems = []
  tableData.value.forEach((currentItem) => {
    const originalItem = originalData.value.find((item) => item.id === currentItem.id)
    if (originalItem) {
      const diff = {}
      let hasDiff = false
      for (const key in currentItem) {
        // 排除非数据字段，如 editing 和 original
        if (key !== 'editing' && key !== 'original' && currentItem[key] !== originalItem[key]) {
          diff[key] = currentItem[key]
          hasDiff = true
        }
      }
      if (hasDiff) {
        changedItems.push({ id: currentItem.id, ...diff })
      }
    }
  })

  if (changedItems.length > 0) {
    console.log('检测到修改的数据:', changedItems)
    await saveOwnerMaterialDetail(changedItems)
    // 保存成功后，更新原始数据
    await fetchOwnerMaterialDetail(currentPage.value, pageSize.value)
  } else {
    ElMessage.info('未检测到修改的数据，无需保存。')
  }
}

// 单元格合并方法已移除 - 新API提供独立的交易记录，无需合并

// 根据对平情况返回ElTag的type
const getMatchingStatusTagType = (status) => {
  switch (status) {
    case 'BALANCED':
      return 'success' // 绿色 - 已对平
    case 'UNRETURNED':
      return 'warning' // 黄色 - 未退库
    case 'DATA_MISSING':
      return 'danger' // 红色 - 数据缺失
    case 'UNMATCHED':
      return 'danger' // 红色 - 未匹配
    // 兼容旧状态
    case 'MATCHED':
      return 'success' // 绿色 - 已匹配
    case 'PARTIAL_MATCHED':
      return 'info' // 蓝色 - 部分匹配
    // 兼容旧的数字状态
    case 1:
      return 'success' // 绿色 - 已对平
    case 0:
      return 'warning' // 黄色 - 未退库
    default:
      return 'danger' // 红色 - 其他状态
  }
}

// 根据对平情况返回显示文本
const getMatchingStatusText = (status) => {
  switch (status) {
    case 'BALANCED':
      return '已对平'
    case 'UNRETURNED':
      return '未退库'
    case 'DATA_MISSING':
      return '数据缺失'
    case 'UNMATCHED':
      return '异常'
    // 兼容旧状态
    case 'MATCHED':
      return '已匹配'
    case 'PARTIAL_MATCHED':
      return '部分匹配'
    // 兼容旧的数字状态
    case 1:
      return '已对平'
    case 0:
      return '未退库'
    default:
      return status || '/'
  }
}

const handleBack = () => {
  router.back()
}

onMounted(async () => {
  // 优先从路由获取taskId
  const taskId = route.query.taskId || ownerMaterialStore.currentTaskId

  // 先获取项目信息
  if (taskId) {
    await loadProjectInfo(taskId)
  }

  // 再获取详情数据
  fetchOwnerMaterialDetail()
})

// 合并相关方法已移除 - 新API提供独立的交易记录，无需合并单元格
</script>

<style scoped>
.owner-material-detail-page {
  --primary-color: #4f46e5; /* 靛蓝色 */
  --secondary-color: #64748b; /* 石板灰 */
  --accent-color: #3730a3; /* 深靛蓝主题色 */
  --success-color: #0d9488; /* 青蓝绿色（更柔和的成功色） */
  --warning-color: #dc6803; /* 深橙色 */
  --danger-color: #dc2626; /* 深红色 */
  --info-color: #0891b2; /* 青色 */
  --background-light: #f8fafc; /* 极浅灰蓝背景 */
  --card-background: #ffffff; /* 纯白卡片背景 */
  --border-color: rgba(79, 70, 229, 0.08); /* 柔和边框 */
  --text-dark: #1e293b; /* 深色文字 */
  --text-light: #64748b; /* 浅色文字 */
  --shadow-color: rgba(79, 70, 229, 0.06); /* 柔和阴影 */

  padding: 32px;
  background-color: var(--background-light);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-dark);
  overflow-x: hidden; /* 防止水平滚动条 */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  color: var(--accent-color);
  font-weight: 700;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px var(--shadow-color);
}

.page-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 6px;
  background: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 6px var(--shadow-color);
}

.project-info-card {
  margin-bottom: 24px;
  padding: 20px 30px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  display: flex;
  gap: 40px;
  align-items: center;
  border: 1px solid var(--border-color);
  max-width: 900px;
  align-self: center;
  transition: all 0.3s ease-in-out;
  /* backdrop-filter: blur(5px); */ /* 白底下毛玻璃效果不明显，暂时移除 */
}

.project-info-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 25px rgba(0, 123, 255, 0.15);
  border-color: var(--accent-color);
}

.card-item {
  display: flex;
  align-items: center;
}

.card-item .label {
  font-weight: 500;
  color: var(--text-light);
  margin-right: 20px;
  min-width: 120px;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.card-item .value {
  color: var(--accent-color);
  font-size: 18px;
  font-weight: 700;
  background-color: rgba(0, 123, 255, 0.03);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 123, 255, 0.1);
  box-shadow: inset 0 0 3px rgba(0, 123, 255, 0.05);
  transition: all 0.3s ease;
}

.card-item .value:hover {
  background-color: rgba(0, 123, 255, 0.08);
  box-shadow: inset 0 0 8px rgba(0, 123, 255, 0.2);
}

.material-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px var(--shadow-color);
  flex-grow: 1;
  background-color: var(--card-background); /* 表格背景 */
  border: 1px solid var(--border-color);
  /* backdrop-filter: blur(5px); */ /* 白底下毛玻璃效果不明显，暂时移除 */
}

.material-table :deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  font-size: 15px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 14px 0;
  text-shadow: none;
}

.material-table :deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: var(--text-dark);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* 合并行样式已移除 - 新API提供独立交易记录 */
.material-table :deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

.material-table :deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 0;
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 按钮样式优化 */
.page-header .el-button,
.page-footer .el-button {
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

/* 加载动画优化 */
.owner-material-detail-page :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

.owner-material-detail-page :deep(.el-loading-spinner .path) {
  stroke: var(--accent-color);
}
</style>

<style>
/* 全局 Element Plus 样式覆盖，使其适应现代化主题 */
.el-table {
  --el-table-row-hover-bg-color: rgba(79, 70, 229, 0.015) !important;
  --el-table-header-bg-color: rgba(79, 70, 229, 0.02) !important;
  --el-table-border-color: rgba(0, 0, 0, 0.05) !important;
  --el-table-text-color: var(--text-dark) !important;
  --el-table-header-text-color: var(--accent-color) !important;
}

.el-table__empty-block {
  background-color: var(--card-background) !important;
  color: var(--text-light) !important;
}

.el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 0 3px rgba(79, 70, 229, 0.03) inset !important;
  border: 1px solid rgba(79, 70, 229, 0.08) !important;
}

.el-input__inner {
  color: var(--text-dark) !important;
}

.el-tag {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  background-color: rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.15);
  color: var(--accent-color);
}

.el-tag--success {
  background-color: rgba(13, 148, 136, 0.08);
  border-color: rgba(13, 148, 136, 0.15);
  color: #0d9488;
}

.el-tag--warning {
  background-color: rgba(220, 104, 3, 0.08);
  border-color: rgba(220, 104, 3, 0.15);
  color: #dc6803;
}

.el-tag--danger {
  background-color: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}

.el-tag--info {
  background-color: rgba(100, 116, 139, 0.08);
  border-color: rgba(100, 116, 139, 0.15);
  color: #64748b;
}

/* 分页器样式 */
.modern-pagination {
  margin-top: 20px;
  text-align: right;
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: var(--text-light);
  --el-pagination-button-color: var(--text-light);
  --el-pagination-button-disabled-color: rgba(0, 0, 0, 0.1);
  --el-pagination-hover-color: var(--accent-color);
}

.modern-pagination .el-pagination__total,
.modern-pagination .el-pagination__jump {
  color: var(--text-light);
}

.modern-pagination .el-pager li {
  background-color: rgba(79, 70, 229, 0.03);
  border: 1px solid rgba(79, 70, 229, 0.08);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.modern-pagination .el-pager li:hover {
  color: var(--accent-color);
  background-color: rgba(79, 70, 229, 0.08);
  border-color: var(--accent-color);
  box-shadow: 0 0 6px var(--shadow-color);
}

.modern-pagination .el-pager li.is-active {
  background-color: var(--accent-color);
  color: #ffffff;
  border-color: var(--accent-color);
  box-shadow: 0 0 8px var(--shadow-color);
}

.modern-pagination .el-select .el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(79, 70, 229, 0.08) !important;
}

.modern-pagination .el-select .el-input__inner {
  color: var(--text-dark) !important;
}

.modern-pagination .el-input__suffix-inner {
  color: var(--text-light) !important;
}

/* 按钮通用样式 */
.el-button--info {
  background-color: rgba(100, 116, 139, 0.08);
  border: 1px solid rgba(100, 116, 139, 0.15);
  color: var(--text-light);
}

.el-button--info:hover {
  background-color: rgba(100, 116, 139, 0.2);
  border-color: rgba(100, 116, 139, 0.3);
  transform: translateY(-1px);
}

.el-button--success {
  background-color: rgba(13, 148, 136, 0.08);
  border: 1px solid rgba(13, 148, 136, 0.15);
  color: #0d9488;
}

.el-button--success:hover {
  background-color: rgba(13, 148, 136, 0.2);
  border-color: rgba(13, 148, 136, 0.3);
  transform: translateY(-1px);
}
</style>
