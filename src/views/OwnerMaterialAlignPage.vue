<template>
  <div class="owner-material-align-page">
    <div class="page-header">
      <h2>物资信息确认</h2>
      <el-button
        type="primary"
        @click="handleManualConfirmClick"
        style="float: right; margin-left: 20px"
        :loading="isLoading"
      >
        人工确认
      </el-button>
    </div>

    <el-table
      :data="mergedMaterials"
      border
      stripe
      style="width: 100%; margin-top: 20px"
      class="material-table"
    >
      <!-- 领料单物资信息列 -->
      <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
      <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
      <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
      <el-table-column prop="requestUnit" label="领料单单位" min-width="120" />
      <el-table-column prop="requestQuantity" label="领料单数量" min-width="100" />

      <!-- 拉平状态列 -->
      <el-table-column label="拉平状态" min-width="140">
        <template #default="{ row }">
          <el-tag :type="row.aligned ? 'success' : 'danger'">
            {{ row.aligned ? '已拉平' : '未拉平待人工介入' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 数据库物资信息列 -->
      <el-table-column prop="dbCode" label="数据库物资编码" min-width="140" />
      <el-table-column prop="dbName" label="数据库物资名称" min-width="160" />
      <el-table-column prop="dbSpec" label="数据库规格型号" min-width="140" />
      <el-table-column prop="dbUnit" label="数据库单位" min-width="80" />
      <el-table-column prop="dbQuantity" label="数据库数量" min-width="100" />

      <!-- 未拉平理由列 -->
      <el-table-column label="未拉平理由" min-width="180">
        <template #default="{ row }">
          {{ row.reasonForNotAligned }}
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      class="modern-pagination"
    />

    <el-dialog
      v-model="showManualConfirmDialog"
      title="未对平物资确认"
      width="80%"
      :before-close="handleDialogClose"
      v-loading="isLoading"
    >
      <el-table
        :data="paginatedUnalignedMaterials"
        border
        stripe
        style="width: 100%"
        class="manual-confirm-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="requestCode" label="领料单物资编码" min-width="140" />
        <el-table-column prop="requestName" label="领料单物资名称" min-width="160" />
        <el-table-column prop="requestSpec" label="领料单规格型号" min-width="140" />
        <el-table-column prop="requestUnit" label="领料单位" min-width="100" />
        <el-table-column prop="requestQuantity" label="领料数量" min-width="100" />

        <!-- 新增已选择物资信息列 -->
        <el-table-column label="已选择物资" min-width="200">
          <template #default="{ row }">
            <div v-if="row.dbCode">
              <div><span class="label">编码:</span> {{ row.dbCode }}</div>
              <div><span class="label">名称:</span> {{ row.dbName }}</div>
              <div><span class="label">规格:</span> {{ row.dbSpec }}</div>
            </div>
            <el-tag v-else type="danger" size="small">未选择</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220">
          <template #default="{ row, $index }">
            <el-button
              :type="row.dbCode ? 'success' : 'primary'"
              size="small"
              @click="handleSelectDbMaterial(row, $index)"
            >
              {{ row.dbCode ? '重新选择' : '选择数据库物资' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="unalignedMaterials.length"
        :page-size="manualConfirmPageSize"
        :current-page="manualConfirmCurrentPage"
        @current-change="handleManualConfirmPageChange"
        @size-change="handleManualConfirmSizeChange"
        class="modern-pagination"
      />
      <template v-slot:footer>
        <el-button @click="showManualConfirmDialog = false">关闭</el-button>
        <el-button @click="handleSaveMaterial">保存对平物资信息</el-button>
      </template>
    </el-dialog>
    <!-- 引入数据库物资选择弹窗 -->
    <MaterialSelectionDialog
      v-model:modelValue="showDbMaterialDialog"
      :data-list="dbMaterialList"
      :total="dbMaterialTotal"
      :page-num="dbMaterialPageNum"
      :page-size="dbMaterialPageSize"
      :loading="dbMaterialLoading"
      @select="handleDbMaterialSelect"
      @page-change="handleDbMaterialPageChange"
      @size-change="handleDbMaterialSizeChange"
      style="z-index: 9999"
    />
    <!-- 新增保存按钮 -->
    <div class="save-button-container">
      <el-button type="primary" @click="handleSaveClick" :loading="isSaving" size="large">
        保存物资信息
      </el-button>
    </div>
  </div>
  <!-- 自动对平结果按钮 -->
  <el-button
    v-if="showResultButton"
    type="success"
    style="position: fixed; left: 32px; bottom: 32px; z-index: 1001"
    @click="showResultDialog = true"
    :loading="alignLoading"
  >
    查看对平结果
  </el-button>
  <!-- 对平结果弹窗 -->
  <el-dialog
    v-model="showResultDialog"
    title="物资对平结果"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-if="alignResult">
      <div>任务ID：{{ alignResult.taskId }}</div>
      <div>
        对平状态：<el-tag :type="alignResult.status === 'success' ? 'success' : 'danger'">{{
          alignResult.status === 'success' ? '成功' : '失败'
        }}</el-tag>
      </div>
      <div>已对平物资数：{{ alignResult.alignedCount }}</div>
      <div>未对平物资数：{{ alignResult.unalignedCount }}</div>
      <el-table :data="alignResult.details" border style="margin-top: 16px">
        <el-table-column prop="code" label="物资编码" width="120" />
        <el-table-column prop="name" label="物资名称" width="160" />
        <el-table-column label="对平状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.aligned ? 'success' : 'danger'">
              {{ row.aligned ? '已对平' : '未对平' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="未对平原因" width="180" />
      </el-table>
    </div>
    <div v-else-if="alignLoading" style="text-align: center; padding: 32px 0">
      <el-icon><i class="el-icon-loading"></i></el-icon> 正在对平...
    </div>
    <div v-else-if="alignError" style="color: red">{{ alignError }}</div>
    <template #footer>
      <el-button @click="showResultDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { useOwnerMaterialStore } from '@/stores/ownerMaterial'
const router = useRouter()
const route = useRoute()
const ownerMaterialStore = useOwnerMaterialStore()
// 新增行样式方法
const getRowClassName = ({ row }) => {
  return row.dbCode ? 'selected-row' : ''
}
import { ElTable, ElTableColumn, ElTag, ElSelect, ElOption } from 'element-plus'
import { ElDialog } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog.vue'

// 自动对平相关
const alignResult = ref(null)
const alignLoading = ref(false)
const alignError = ref('')
const showResultDialog = ref(false)
const showResultButton = ref(false)

// 假定 executeOwnerMaterialAlignmentWorkflow 已全局可用或 mock
async function executeOwnerMaterialAlignmentWorkflow(taskId) {
  // 实际应调用后端接口，这里用模拟数据
  alignLoading.value = true
  alignError.value = ''
  try {
    // 模拟异步对平
    await new Promise((resolve) => setTimeout(resolve, 1200))
    // 假设返回结构如下
    alignResult.value = {
      taskId,
      status: 'success',
      alignedCount: 4,
      unalignedCount: 1,
      details: [
        { code: 'M001', name: '水泥', aligned: true },
        { code: 'M002', name: '钢筋', aligned: true },
        { code: 'M003', name: '砂子', aligned: true },
        { code: 'M004', name: '石灰石', aligned: true },
        { code: 'M005', name: '砖块', aligned: false, reason: '无匹配物资' }
      ]
    }
    showResultButton.value = true
  } catch (e) {
    alignError.value = '自动对平失败'
    showResultButton.value = false
  } finally {
    alignLoading.value = false
  }
}

// 自动检测 taskId 并自动调用
onMounted(() => {
  let taskId = route.query.taskId || undefined
  // 支持 props 方式（假定父组件传递）
  if (!taskId && typeof defineProps === 'function') {
    try {
      // defineProps 仅在 <script setup> 顶层可用，这里兼容处理
      // eslint-disable-next-line no-undef
      const props = defineProps(['taskId'])
      if (props && props.taskId) taskId = props.taskId
    } catch {}
  }
  if (taskId) {
    executeOwnerMaterialAlignmentWorkflow(taskId)
  }
})

// 弹窗相关变量
const showDbMaterialDialog = ref(false)
const dbMaterialList = ref([])
const dbMaterialTotal = ref(0)
const dbMaterialPageNum = ref(1)
const dbMaterialPageSize = ref(10)
const dbMaterialLoading = ref(false)
const dbMaterialSearch = ref('')
const currentEditingRow = ref(null)

// 新增：弹窗显示控制变量
const showManualConfirmDialog = ref(false)

let requestMaterials = reactive([
  {
    id: 1,
    code: 'M001',
    name: '水泥',
    spec: '42.5级',
    unit: '吨',
    quantity: 100,
    aligned: false,
    reasonForNotAligned: null,
    similarMaterials: [
      { id: 201, name: '水泥A', spec: '42.5级', unit: '吨', quantity: 100 },
      { id: 202, name: '水泥B', spec: '42.5级', unit: '吨', quantity: 90 }
    ],
    selectedSimilar: null,
    priceQuarterOptions: [
      { id: 1, price: 100, quarter: '2024Q1' },
      { id: 2, price: 105, quarter: '2024Q2' }
    ],
    selectedPriceQuarter: { id: 1, price: 100, quarter: '2024Q1' }
  },
  {
    id: 2,
    code: 'M002',
    name: '钢筋',
    spec: 'HRB400 20mm',
    unit: '吨',
    quantity: 50,
    aligned: false,
    reasonForNotAligned: null,
    similarMaterials: [
      { id: 203, name: '钢筋A', spec: 'HRB400 20mm', unit: '吨', quantity: 55 },
      { id: 204, name: '钢筋B', spec: 'HRB400 20mm', unit: '吨', quantity: 50 }
    ],
    selectedSimilar: null,
    priceQuarterOptions: [
      { id: 3, price: 200, quarter: '2024Q1' },
      { id: 4, price: 210, quarter: '2024Q2' }
    ],
    selectedPriceQuarter: { id: 3, price: 200, quarter: '2024Q1' }
  },
  {
    id: 3,
    code: 'M003',
    name: '砂子',
    spec: '中砂',
    unit: '立方米',
    quantity: 200,
    aligned: false,
    reasonForNotAligned: null,
    similarMaterials: [
      { id: 205, name: '砂子A', spec: '中砂', unit: '立方米', quantity: 210 },
      { id: 206, name: '砂子B', spec: '中砂', unit: '立方米', quantity: 205 }
    ],
    selectedSimilar: null,
    priceQuarterOptions: [
      { id: 5, price: 300, quarter: '2024Q1' },
      { id: 6, price: 310, quarter: '2024Q2' }
    ],
    selectedPriceQuarter: { id: 5, price: 300, quarter: '2024Q1' }
  },
  {
    id: 4,
    code: 'M004',
    name: '石灰石',
    spec: '细粉',
    unit: '吨',
    quantity: 80,
    aligned: false,
    reasonForNotAligned: '规格型号不匹配',
    similarMaterials: [
      { id: 207, name: '石灰石A', spec: '细粉', unit: '吨', quantity: 80 },
      { id: 208, name: '石灰石B', spec: '细粉', unit: '吨', quantity: 75 }
    ],
    selectedSimilar: null,
    priceQuarterOptions: [
      { id: 7, price: 400, quarter: '2024Q1' },
      { id: 8, price: 410, quarter: '2024Q2' }
    ],
    selectedPriceQuarter: { id: 7, price: 400, quarter: '2024Q1' }
  },
  {
    id: 5,
    code: 'M005',
    name: '砖块',
    spec: '红砖',
    unit: '块',
    quantity: 5000,
    aligned: false,
    reasonForNotAligned: '无匹配物资',
    similarMaterials: [
      { id: 209, name: '砖块A', spec: '红砖', unit: '块', quantity: 5000 },
      { id: 210, name: '砖块B', spec: '红砖', unit: '块', quantity: 4800 }
    ],
    selectedSimilar: null,
    priceQuarterOptions: [
      { id: 9, price: 500, quarter: '2024Q1' },
      { id: 10, price: 510, quarter: '2024Q2' }
    ],
    selectedPriceQuarter: { id: 9, price: 500, quarter: '2024Q1' }
  }
])

const dbMaterials = reactive([
  {
    id: 101,
    code: 'D001',
    name: '水泥',
    spec: '42.5级',
    unit: '吨',
    quantity: 120,
    price: 420 // 示例价格
  },
  {
    id: 102,
    code: 'D002',
    name: '钢筋',
    spec: 'HRB400 20mm',
    unit: '吨',
    quantity: 60,
    price: 520
  },
  {
    id: 103,
    code: 'D003',
    name: '砂子',
    spec: '中砂',
    unit: '立方米',
    quantity: 210,
    price: 320
  }
])

function isSimilar(a, b) {
  if (!a || !b) return false
  return a.name === b.name && a.spec === b.spec && a.unit === b.unit
}

const mergedMaterials = computed(() => {
  const formatValue = (value) => (value == null || value === '' ? '/' : value)

  return requestMaterials.map((req) => {
    const dbMatch = dbMaterials.find((db) => db.code === req.code)
    const displayInfo = req.selectedSimilar || dbMatch || {}

    return {
      ...req,
      requestCode: formatValue(req.code),
      requestName: formatValue(req.name),
      requestSpec: formatValue(req.spec),
      requestUnit: formatValue(req.unit),
      requestQuantity: formatValue(req.quantity),
      reasonForNotAligned: formatValue(req.reasonForNotAligned),
      dbCode: formatValue(displayInfo.code),
      dbName: formatValue(displayInfo.name),
      dbSpec: formatValue(displayInfo.spec),
      dbUnit: formatValue(displayInfo.unit),
      dbQuantity: formatValue(displayInfo.quantity)
    }
  })
})

function updateAlignedStatus() {
  requestMaterials.forEach((req) => {
    const dbMatch = dbMaterials.find((db) => isSimilar(req, db))
    req.aligned = !!dbMatch
    req.selectedSimilar = req.similarMaterials[0] || null
    if (!req.aligned && req.selectedSimilar) {
      req.dbCode = req.selectedSimilar.code || ''
      req.dbName = req.selectedSimilar.name || ''
      req.dbSpec = req.selectedSimilar.spec || ''
      req.dbUnit = req.selectedSimilar.unit || ''
      req.dbQuantity = req.selectedSimilar.quantity || 0
    }
  })
}

const total = requestMaterials.length
const pageSize = 5
const currentPage = ref(1)

function handlePageChange(page) {
  currentPage.value = page
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}
updateAlignedStatus()

const unalignedMaterials = ref([])
const isLoading = ref(false)
const isSaving = ref(false)

function loadUnalignedMaterials() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = [
        {
          id: 1,
          requestCode: 'M001',
          requestName: '水泥',
          requestSpec: '42.5级',
          requestUnit: '吨',
          requestQuantity: 100,
          similarMaterials: [
            { id: 201, name: '水泥A', spec: '42.5级', unit: '吨', quantity: 100 },
            { id: 202, name: '水泥B', spec: '42.5级', unit: '吨', quantity: 90 }
          ],
          selectedSimilar: null,
          priceQuarterOptions: [
            { id: 1, price: 100, quarter: '2024Q1' },
            { id: 2, price: 105, quarter: '2024Q2' }
          ],
          selectedPriceQuarter: { id: 1, price: 100, quarter: '2024Q1' }
        },
        {
          id: 2,
          requestCode: 'M002',
          requestName: '钢筋',
          requestSpec: 'HRB400 20mm',
          requestUnit: '吨',
          requestQuantity: 50,
          similarMaterials: [
            { id: 203, name: '钢筋A', spec: 'HRB400 20mm', unit: '吨', quantity: 55 },
            { id: 204, name: '钢筋B', spec: 'HRB400 20mm', unit: '吨', quantity: 50 }
          ],
          selectedSimilar: null,
          priceQuarterOptions: [
            { id: 3, price: 200, quarter: '2024Q1' },
            { id: 4, price: 210, quarter: '2024Q2' }
          ],
          selectedPriceQuarter: { id: 3, price: 200, quarter: '2024Q1' }
        },
        {
          id: 3,
          requestCode: 'M003',
          requestName: '砂子',
          requestSpec: '中砂',
          requestUnit: '立方米',
          requestQuantity: 200,
          similarMaterials: [
            { id: 205, name: '砂子A', spec: '中砂', unit: '立方米', quantity: 210 },
            { id: 206, name: '砂子B', spec: '中砂', unit: '立方米', quantity: 205 }
          ],
          selectedSimilar: null,
          priceQuarterOptions: [
            { id: 5, price: 300, quarter: '2024Q1' },
            { id: 6, price: 310, quarter: '2024Q2' }
          ],
          selectedPriceQuarter: { id: 5, price: 300, quarter: '2024Q1' }
        },
        {
          id: 4,
          requestCode: 'M004',
          requestName: '石灰石',
          requestSpec: '细粉',
          requestUnit: '吨',
          requestQuantity: 80,
          similarMaterials: [
            { id: 207, name: '石灰石A', spec: '细粉', unit: '吨', quantity: 80 },
            { id: 208, name: '石灰石B', spec: '细粉', unit: '吨', quantity: 75 }
          ],
          selectedSimilar: null,
          priceQuarterOptions: [
            { id: 7, price: 400, quarter: '2024Q1' },
            { id: 8, price: 410, quarter: '2024Q2' }
          ],
          selectedPriceQuarter: { id: 7, price: 400, quarter: '2024Q1' }
        },
        {
          id: 5,
          requestCode: 'M005',
          requestName: '砖块',
          requestSpec: '红砖',
          requestUnit: '块',
          requestQuantity: 5000,
          similarMaterials: [
            { id: 209, name: '砖块A', spec: '红砖', unit: '块', quantity: 5000 },
            { id: 210, name: '砖块B', spec: '红砖', unit: '块', quantity: 4800 }
          ],
          selectedSimilar: null,
          priceQuarterOptions: [
            { id: 9, price: 500, quarter: '2024Q1' },
            { id: 10, price: 510, quarter: '2024Q2' }
          ],
          selectedPriceQuarter: { id: 9, price: 500, quarter: '2024Q1' }
        }
      ]
      resolve(data)
    }, 1000)
  })
}

function handleDialogClose(done) {
  showManualConfirmDialog.value = false
  done()
}

const handleManualConfirmClick = async () => {
  isLoading.value = true
  try {
    unalignedMaterials.value = await loadUnalignedMaterials()
    showManualConfirmDialog.value = true
  } catch (error) {
    console.error('加载未对平物资失败:', error)
  } finally {
    isLoading.value = false
  }
}

const manualConfirmPageSize = 5
const manualConfirmCurrentPage = ref(1)

const paginatedUnalignedMaterials = computed(() => {
  const start = (manualConfirmCurrentPage.value - 1) * manualConfirmPageSize
  const end = start + manualConfirmPageSize
  return unalignedMaterials.value.slice(start, end)
})

function handleManualConfirmPageChange(page) {
  manualConfirmCurrentPage.value = page
}

function handleManualConfirmSizeChange(size) {
  manualConfirmPageSize.value = size
  manualConfirmCurrentPage.value = 1
}

// 选择数据库物资按钮事件
function handleSelectDbMaterial(row, index) {
  console.log('点击选择数据库物资按钮', row)
  currentEditingRow.value = row
  dbMaterialSearch.value = ''
  dbMaterialPageNum.value = 1
  fetchDbMaterialList()
  showDbMaterialDialog.value = true
  console.log('弹窗状态:', showDbMaterialDialog.value)
}

// 模拟数据库物资列表加载（可替换为实际接口）
function fetchDbMaterialList() {
  dbMaterialLoading.value = true
  setTimeout(() => {
    // 假设dbMaterials为数据库物资数据
    dbMaterialList.value = dbMaterials
      .map((item) => ({
        ...item,
        material_name: item.name,
        specification_model: item.spec,
        unit: item.unit,
        tax_price: item.price || item.quantity, // 仅示例
        quarter: '2024Q1'
      }))
      .filter(
        (item) => !dbMaterialSearch.value || item.material_name.includes(dbMaterialSearch.value)
      )
    dbMaterialTotal.value = dbMaterialList.value.length
    dbMaterialLoading.value = false
  }, 300)
}

// 保存对平物资信息
function handleSaveMaterial() {
  // 将弹窗中的修改同步到主数据
  unalignedMaterials.value.forEach((updatedMaterial) => {
    const index = requestMaterials.findIndex((m) => m.id === updatedMaterial.id)
    if (index !== -1) {
      // 更新主数据
      requestMaterials[index] = {
        ...requestMaterials[index],
        dbCode: updatedMaterial.dbCode,
        dbName: updatedMaterial.dbName,
        dbSpec: updatedMaterial.dbSpec,
        dbUnit: updatedMaterial.dbUnit,
        dbQuantity: updatedMaterial.dbQuantity,
        aligned: !!updatedMaterial.dbCode,
        reasonForNotAligned: updatedMaterial.dbCode ? '' : '未选择匹配物资'
      }
    }
  })

  // 触发响应式更新
  requestMaterials.splice(0, requestMaterials.length, ...requestMaterials)

  ElMessage.success('物资对平信息保存成功')
  showManualConfirmDialog.value = false
}

// 分页/搜索事件
function handleDbMaterialPageChange(page) {
  dbMaterialPageNum.value = page
  fetchDbMaterialList()
}
function handleDbMaterialSizeChange(size) {
  dbMaterialPageSize.value = size
  dbMaterialPageNum.value = 1
  fetchDbMaterialList()
}

// 选择数据库物资后覆盖当前行
function handleDbMaterialSelect(selected) {
  if (currentEditingRow.value && selected) {
    console.log('更新行数据:', currentEditingRow.value.id, '选中数据:', selected)

    // 更新当前行显示数据
    currentEditingRow.value.dbCode = selected.code
    currentEditingRow.value.dbName = selected.material_name
    currentEditingRow.value.dbSpec = selected.specification_model
    currentEditingRow.value.dbUnit = selected.unit
    currentEditingRow.value.dbQuantity = selected.quantity

    // 同步更新主数据
    const material = requestMaterials.find((m) => m.id === currentEditingRow.value.id)
    if (material) {
      material.dbCode = selected.code
      material.dbName = selected.material_name
      material.dbSpec = selected.specification_model
      material.dbUnit = selected.unit
      material.dbQuantity = selected.quantity
      material.aligned = true
      material.reasonForNotAligned = ''
      console.log('主数据已更新:', material)
    }

    // 使用数组方法触发响应式更新
    requestMaterials.splice(0, requestMaterials.length, ...requestMaterials)
  }
  showDbMaterialDialog.value = false
}

// 搜索事件
watch(dbMaterialSearch, () => {
  fetchDbMaterialList()
})
// 检查所有物资是否已拉平
function checkAllAligned() {
  return requestMaterials.every((material) => material.aligned)
}

// 保存按钮点击事件
async function handleSaveClick() {
  if (!checkAllAligned()) {
    await ElMessageBox.alert('存在未拉平的物资信息，请先完成所有物资拉平操作', '无法保存', {
      confirmButtonText: '确定',
      type: 'warning'
    })
    return
  }

  isSaving.value = true
  try {
    // 这里可以添加实际保存逻辑
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟API调用
    ElMessage.success('物资信息保存成功')
    // 更新 store 状态，标记为准备好进行自动对平
    ownerMaterialStore.markAsReadyForAlignment()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
  router.push('/home')
}
</script>

<style scoped>
/* 新增行样式 */
.manual-confirm-table :deep(.selected-row) {
  --el-table-tr-bg-color: #f0f9eb;
}
.manual-confirm-table :deep(.selected-row:hover) {
  --el-table-tr-bg-color: #e1f3d8;
}
.label {
  color: #666;
  margin-right: 5px;
}

.owner-material-align-page {
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

.material-table :deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

.material-table :deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 0;
  text-align: center;
}
.save-button-container {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 1000;
}

.save-button-container .el-button {
  padding: 12px 24px;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.save-button-container .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* 按钮样式优化 */
.page-header .el-button,
.save-button-container .el-button {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

/* 加载动画优化 */
.owner-material-align-page :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

.owner-material-align-page :deep(.el-loading-spinner .path) {
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

/* 对话框样式 */
.el-dialog {
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.12);
  border: 1px solid var(--border-color);
}

.el-dialog__header {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.01));
  border-bottom: 1px solid var(--border-color);
  border-radius: 12px 12px 0 0;
}

.el-dialog__title {
  color: var(--accent-color);
  font-weight: 600;
}

.el-dialog__body {
  background-color: var(--card-background);
}

.el-dialog__footer {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  border-top: 1px solid var(--border-color);
  border-radius: 0 0 12px 12px;
}
</style>
