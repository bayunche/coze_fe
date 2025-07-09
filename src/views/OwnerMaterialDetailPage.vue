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
      :span-method="arraySpanMethod"
      :row-class-name="tableRowClassName"
      style="width: 100%; margin-top: 20px"
      border
      stripe
      class="material-table"
    >
      <el-table-column label="序号" width="60">
        <template #default="{ row, $index }">
          <span v-if="shouldShowIndex(row, $index)">{{ getMergedIndex($index) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="materialName" label="物资名称" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.materialName || '/' }}</span>
          <el-input v-else v-model="scope.row.materialName"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="specifications" label="规格型号" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.specifications || '/' }}</span>
          <el-input v-else v-model="scope.row.specifications"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="计量单位" min-width="100">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.unit || '/' }}</span>
          <el-input v-else v-model="scope.row.unit"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="applicationQuantity" label="申领单申领数量" min-width="150">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.applicationQuantity || '/' }}</span>
          <el-input v-else v-model.number="scope.row.applicationQuantity" type="number"></el-input>
        </template>
      </el-table-column>
      <el-table-column prop="matchingStatus" label="对平情况" min-width="120">
        <template #default="scope">
          <span v-if="!scope.row.editing">
            <el-tag :type="getMatchingStatusTagType(scope.row.matchingStatus)">
              {{ scope.row.matchingStatus || '/' }}
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
      <el-table-column prop="actualApplicationQuantity" label="实际领料单申领数量" min-width="180">
        <template #default="scope">
          <span v-if="!scope.row.editing">{{ scope.row.actualApplicationQuantity || '/' }}</span>
          <el-input
            v-else
            v-model.number="scope.row.actualApplicationQuantity"
            type="number"
          ></el-input>
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
      <el-button type="primary" @click="handleSave" :loading="saving">保存解析结果</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const originalData = ref([]) // 用于存储原始数据，以便进行diff
const spanArr = ref([]) // 用于存储合并单元格的信息
const pos = ref(0) // 用于辅助计算合并单元格

const currentPage = ref(1)
const pageSize = ref(10)
const totalDetails = ref(0)

const projectInfo = ref({
  projectName: '项目名称占位',
  projectNumber: '项目编号占位'
})

// 优化后的 Mock 数据，体现一个物资名称可能对应多个规格型号和多个实际领料单
const mockData = [
  {
    id: 1,
    materialName: '螺纹钢',
    specifications: 'HRB400E Φ16',
    unit: '吨',
    applicationQuantity: 50,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-001',
    actualMaterialName: '螺纹钢',
    actualSpecifications: 'HRB400E Φ16',
    actualUnit: '吨',
    actualApplicationQuantity: 48,
    editing: false
  },
  {
    id: 2,
    materialName: '螺纹钢',
    specifications: 'HRB400E Φ16',
    unit: '吨',
    applicationQuantity: 50, // 申领数量不变，因为是针对这个规格型号的
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-002', // 不同的领料单
    actualMaterialName: '螺纹钢',
    actualSpecifications: 'HRB400E Φ16',
    actualUnit: '吨',
    actualApplicationQuantity: 2, // 不同的领料数量
    editing: false
  },
  {
    id: 3,
    materialName: '螺纹钢',
    specifications: 'HRB400E Φ18',
    unit: '吨',
    applicationQuantity: 30,
    matchingStatus: 0, // 未退库
    actualSource: '领料单-2023-003',
    actualMaterialName: '螺纹钢',
    actualSpecifications: 'HRB400E Φ18',
    actualUnit: '吨',
    actualApplicationQuantity: 25,
    editing: false
  },
  {
    id: 4,
    materialName: '混凝土',
    specifications: 'C30',
    unit: '立方米',
    applicationQuantity: 120,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-004',
    actualMaterialName: '混凝土',
    actualSpecifications: 'C30',
    actualUnit: '立方米',
    actualApplicationQuantity: 110,
    editing: false
  },
  {
    id: 5,
    materialName: '混凝土',
    specifications: 'C30',
    unit: '立方米',
    applicationQuantity: 120,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-005',
    actualMaterialName: '混凝土',
    actualSpecifications: 'C30',
    actualUnit: '立方米',
    actualApplicationQuantity: 5,
    editing: false
  },
  {
    id: 6,
    materialName: '混凝土',
    specifications: 'C40',
    unit: '立方米',
    applicationQuantity: 80,
    matchingStatus: 2, // 部分对平 -> 资料缺失
    actualSource: '领料单-2023-006',
    actualMaterialName: '混凝土',
    actualSpecifications: 'C40',
    actualUnit: '立方米',
    actualApplicationQuantity: 75,
    editing: false
  },
  {
    id: 7,
    materialName: '防水卷材',
    specifications: 'SBS改性沥青防水卷材 4mm',
    unit: '平方米',
    applicationQuantity: 300,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-007',
    actualMaterialName: '防水卷材',
    actualSpecifications: 'SBS改性沥青防水卷材 4mm',
    actualUnit: '平方米',
    actualApplicationQuantity: 280,
    editing: false
  },
  {
    id: 8,
    materialName: '防水卷材',
    specifications: '高分子防水卷材 1.5mm',
    unit: '平方米',
    applicationQuantity: 100,
    matchingStatus: 0, // 未退库
    actualSource: '领料单-2023-008',
    actualMaterialName: '防水卷材',
    actualSpecifications: '高分子防水卷材 1.5mm',
    actualUnit: '平方米',
    actualApplicationQuantity: 90,
    editing: false
  },
  {
    id: 9,
    materialName: '保温板',
    specifications: '挤塑聚苯板 XPS 50mm',
    unit: '平方米',
    applicationQuantity: 250,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-009',
    actualMaterialName: '保温板',
    actualSpecifications: '挤塑聚苯板 XPS 50mm',
    actualUnit: '平方米',
    actualApplicationQuantity: 250,
    editing: false
  },
  {
    id: 10,
    materialName: '涂料',
    specifications: '内墙乳胶漆 哑光',
    unit: '公斤',
    applicationQuantity: 80,
    matchingStatus: 0, // 未退库
    actualSource: '领料单-2023-010',
    actualMaterialName: '涂料',
    actualSpecifications: '内墙乳胶漆 哑光',
    actualUnit: '公斤',
    actualApplicationQuantity: 75,
    editing: false
  },
  {
    id: 17, // 申领单物资信息为空，但实际领料单有数据来源和部分数据
    materialName: null,
    specifications: null,
    unit: null,
    applicationQuantity: null,
    matchingStatus: 2, // 资料缺失
    actualSource: '领料单-2023-017',
    actualMaterialName: '实际物资A',
    actualSpecifications: '实际规格A',
    actualUnit: '个',
    actualApplicationQuantity: 10,
    editing: false
  },
  {
    id: 18, // 申领单物资信息为空，但实际领料单有数据来源和部分数据
    materialName: '',
    specifications: '',
    unit: '',
    applicationQuantity: null,
    matchingStatus: 2, // 资料缺失
    actualSource: '领料单-2023-018',
    actualMaterialName: '实际物资B',
    actualSpecifications: '实际规格B',
    actualUnit: '个',
    actualApplicationQuantity: 20,
    editing: false
  },
  {
    id: 11,
    materialName: '电线',
    specifications: 'BV 2.5mm²',
    unit: '米',
    applicationQuantity: 1000,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-011',
    actualMaterialName: '电线',
    actualSpecifications: 'BV 2.5mm²',
    actualUnit: '米',
    actualApplicationQuantity: 990,
    editing: false
  },
  {
    id: 12,
    materialName: '电线',
    specifications: 'RVV 4mm²',
    unit: '米',
    applicationQuantity: 500,
    matchingStatus: 2, // 部分对平 -> 资料缺失
    actualSource: '领料单-2023-012',
    actualMaterialName: '电线',
    actualSpecifications: 'RVV 4mm²',
    actualUnit: '米',
    actualApplicationQuantity: 480,
    editing: false
  },
  {
    id: 13,
    materialName: '水管',
    specifications: 'PPR 冷水管 DN25',
    unit: '米',
    applicationQuantity: 200,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-013',
    actualMaterialName: '水管',
    actualSpecifications: 'PPR 冷水管 DN25',
    actualUnit: '米',
    actualApplicationQuantity: 190,
    editing: false
  },
  {
    id: 14,
    materialName: '瓷砖',
    specifications: '抛光砖 800x800mm',
    unit: '平方米',
    applicationQuantity: 150,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-014',
    actualMaterialName: '瓷砖',
    actualSpecifications: '抛光砖 800x800mm',
    actualUnit: '平方米',
    actualApplicationQuantity: 150,
    editing: false
  },
  {
    id: 15,
    materialName: '木门',
    specifications: '实木复合门 2100x900mm',
    unit: '樘',
    applicationQuantity: 10,
    matchingStatus: 0, // 未退库
    actualSource: '领料单-2023-015',
    actualMaterialName: '木门',
    actualSpecifications: '实木复合门 2100x900mm',
    actualUnit: '樘',
    actualApplicationQuantity: 9,
    editing: false
  },
  {
    id: 16,
    materialName: '玻璃',
    specifications: '钢化玻璃 8mm',
    unit: '平方米',
    applicationQuantity: 60,
    matchingStatus: 1, // 已对平
    actualSource: '领料单-2023-016',
    actualMaterialName: '玻璃',
    actualSpecifications: '钢化玻璃 8mm',
    actualUnit: '平方米',
    actualApplicationQuantity: 60,
    editing: false
  }
]

// 获取数据占位函数
const fetchOwnerMaterialDetail = async (page = currentPage.value, size = pageSize.value) => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise((resolve) => setTimeout(resolve, 500))
    const start = (page - 1) * size
    const end = start + size
    tableData.value = mockData.slice(start, end).map((item) => ({
      ...item,
      original: { ...item },
      isMergedStart: false // 默认值，将在 getSpanArr 中更新
    })) // 深拷贝原始数据
    originalData.value = mockData.slice(start, end).map((item) => ({ ...item })) // 存储原始数据副本
    totalDetails.value = mockData.length
    getSpanArr(tableData.value) // 计算合并信息

    // 从路由参数获取项目信息，如果存在的话
    projectInfo.value.projectName = route.query.projectName || '项目名称占位'
    projectInfo.value.projectNumber = route.query.projectNumber || '项目编号占位'

    ElMessage.success('甲供物资详情数据加载成功！')
  } catch (error) {
    ElMessage.error(`加载详情失败: ${error.message}`)
    console.error('加载详情失败:', error)
  } finally {
    loading.value = false
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

// 单元格合并方法
const arraySpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 需要合并的列的 prop
  const mergeColumns = [
    'materialName',
    'specifications',
    'unit',
    'applicationQuantity',
    'matchingStatus'
  ]

  // 如果是序号列 (columnIndex === 0) 或者需要合并的列
  if (columnIndex === 0 || mergeColumns.includes(column.property)) {
    const _row = spanArr.value[rowIndex]
    const _col = _row > 0 ? 1 : 0
    return {
      rowspan: _row,
      colspan: _col
    }
  }
  return {
    rowspan: 1,
    colspan: 1
  }
}

// 根据对平情况返回ElTag的type
const getMatchingStatusTagType = (status) => {
  switch (status) {
    case 1:
      return 'success' // 绿色 - 已对平
    case 0:
      return 'warning' // 黄色 - 未退库
    default:
      return 'danger' // 红色 - 资料缺失 (包括之前的 '部分对平' 和 '资料缺失')
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  fetchOwnerMaterialDetail()
})

// 新增方法：为行添加类名
const tableRowClassName = ({ row, rowIndex }) => {
  if (row.isMergedStart) {
    return 'merged-group-start'
  } else if (spanArr.value[rowIndex] === 0) {
    // 如果是合并组的一部分，但不是起始行
    return 'merged-group-part'
  }
  return ''
}

// 新增方法：计算合并单元格的 spanArr
const getSpanArr = (data) => {
  spanArr.value = []
  pos.value = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      spanArr.value.push(1)
      pos.value = 0
      data[i].isMergedStart = true // 标记为合并起始行
    } else {
      // 判断当前行与上一行的合并条件是否满足
      if (
        data[i].materialName === data[i - 1].materialName &&
        data[i].specifications === data[i - 1].specifications &&
        data[i].unit === data[i - 1].unit &&
        data[i].applicationQuantity === data[i - 1].applicationQuantity &&
        data[i].matchingStatus === data[i - 1].matchingStatus
      ) {
        spanArr.value[pos.value] += 1
        spanArr.value.push(0)
        data[i].isMergedStart = false // 非起始行
      } else {
        spanArr.value.push(1)
        pos.value = i
        data[i].isMergedStart = true // 标记为合并起始行
      }
    }
  }
}

// 新增方法：判断序号是否显示
const shouldShowIndex = (row, index) => {
  return spanArr.value[index] !== 0
}

// 新增方法：获取合并后的序号
const getMergedIndex = (index) => {
  // 序号应该基于当前页的起始序号
  return (
    (currentPage.value - 1) * pageSize.value +
    spanArr.value.slice(0, index).filter((val) => val !== 0).length +
    1
  )
}
</script>

<style scoped>
.owner-material-detail-page {
  --primary-color: #007bff; /* 蓝色 */
  --secondary-color: #6c757d; /* 灰色 */
  --accent-color: #007bff; /* 主题蓝 */
  --background-light: #f8f9fa; /* 极浅色背景 */
  --card-background: #ffffff; /* 纯白卡片背景 */
  --border-color: rgba(0, 123, 255, 0.1); /* 柔光边框 */
  --text-dark: #212529; /* 深色文字 */
  --text-light: #495057; /* 浅色文字 */
  --shadow-color: rgba(0, 123, 255, 0.08); /* 蓝色阴影 */

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
  background-color: rgba(0, 123, 255, 0.03); /* 浅蓝色表头背景 */
  color: var(--accent-color);
  font-weight: 600;
  font-size: 15px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 14px 0;
  text-shadow: 0 0 2px var(--shadow-color);
}

.material-table :deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: var(--text-dark);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.material-table :deep(.el-table__row.merged-group-start) {
  background-color: rgba(0, 123, 255, 0.05) !important; /* 浅蓝色背景，区分合并组 */
  border-top: 2px solid rgba(0, 123, 255, 0.2) !important; /* 顶部加粗边框 */
}

.material-table :deep(.el-table__row.merged-group-part) {
  background-color: rgba(0, 123, 255, 0.05) !important; /* 与起始行相同的背景色 */
}

/* 确保条纹背景和hover效果在合并行上也能正常工作 */
.material-table :deep(.el-table__row.el-table__row--striped.merged-group-start),
.material-table :deep(.el-table__row.el-table__row--striped.merged-group-part) {
  background-color: rgba(0, 123, 255, 0.05) !important; /* 覆盖条纹背景 */
}

.material-table :deep(.el-table__row.merged-group-start:hover),
.material-table :deep(.el-table__row.merged-group-part:hover) {
  background-color: rgba(0, 123, 255, 0.08) !important; /* 统一的hover效果 */
}

/* 原始的条纹和hover效果 */
.material-table
  :deep(.el-table__row.el-table__row--striped:not(.merged-group-start):not(.merged-group-part)) {
  background-color: #fcfcfc; /* 条纹背景 */
}

.material-table :deep(.el-table__row:hover:not(.merged-group-start):not(.merged-group-part)) {
  background-color: rgba(0, 123, 255, 0.03) !important; /* hover 效果 */
  box-shadow: inset 0 0 8px rgba(0, 123, 255, 0.08);
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

.page-footer .el-button--primary {
  background: linear-gradient(135deg, var(--accent-color), #0056b3);
  border: 1px solid var(--accent-color);
  box-shadow: 0 5px 15px var(--shadow-color);
  color: #ffffff; /* 浅色文字 */
}

.page-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #0056b3, var(--accent-color));
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

/* 加载动画优化 */
.owner-material-detail-page :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8); /* 浅色加载背景 */
}

.owner-material-detail-page :deep(.el-loading-spinner .path) {
  stroke: var(--accent-color);
}
</style>

<style>
/* 全局 Element Plus 样式覆盖，使其适应深色科技感主题 */
.el-table {
  --el-table-row-hover-bg-color: rgba(0, 123, 255, 0.03) !important;
  --el-table-header-bg-color: rgba(0, 123, 255, 0.03) !important;
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
  box-shadow: 0 0 3px rgba(0, 123, 255, 0.03) inset !important;
  border: 1px solid rgba(0, 123, 255, 0.08) !important;
}

.el-input__inner {
  color: var(--text-dark) !important;
}

.el-tag {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 123, 255, 0.08);
  border-color: rgba(0, 123, 255, 0.15);
  color: var(--accent-color);
}

.el-tag--success {
  background-color: rgba(40, 167, 69, 0.08);
  border-color: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.el-tag--warning {
  background-color: rgba(255, 193, 7, 0.08);
  border-color: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.el-tag--danger {
  background-color: rgba(220, 53, 69, 0.08);
  border-color: rgba(220, 53, 69, 0.15);
  color: #dc3545;
}

.el-tag--info {
  background-color: rgba(108, 117, 125, 0.08);
  border-color: rgba(108, 117, 125, 0.15);
  color: #6c757d;
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
  background-color: rgba(0, 123, 255, 0.03);
  border: 1px solid rgba(0, 123, 255, 0.08);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.modern-pagination .el-pager li:hover {
  color: var(--accent-color);
  background-color: rgba(0, 123, 255, 0.08);
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
  border: 1px solid rgba(0, 123, 255, 0.08) !important;
}

.modern-pagination .el-select .el-input__inner {
  color: var(--text-dark) !important;
}

.modern-pagination .el-input__suffix-inner {
  color: var(--text-light) !important;
}

/* 按钮通用样式 */
.el-button--info {
  background-color: rgba(108, 117, 125, 0.08);
  border: 1px solid rgba(108, 117, 125, 0.15);
  color: var(--text-light);
}

.el-button--info:hover {
  background-color: rgba(128, 128, 128, 0.3);
  border-color: rgba(128, 128, 128, 0.5);
  transform: translateY(-1px);
}

.el-button--primary {
  background: linear-gradient(135deg, var(--accent-color), #0056b3);
  border: 1px solid var(--accent-color);
  box-shadow: 0 5px 15px var(--shadow-color);
  color: #ffffff;
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #0056b3, var(--accent-color));
  transform: translateY(-2px);
  box-shadow: 0 8px 20px var(--shadow-color);
}

.el-button--success {
  background-color: rgba(40, 167, 69, 0.08);
  border: 1px solid rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.el-button--success:hover {
  background-color: rgba(0, 255, 0, 0.3);
  border-color: rgba(0, 255, 0, 0.5);
  transform: translateY(-1px);
}
</style>
