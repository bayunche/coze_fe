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
    <el-table :data="mergedMaterials" border stripe style="width: 100%" class="material-table">
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
      style="margin-top: 20px; text-align: right"
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
        style="margin-top: 10px; text-align: right"
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
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'

// 新增行样式方法
const getRowClassName = ({ row }) => {
  return row.dbCode ? 'selected-row' : ''
}
import { ElTable, ElTableColumn, ElTag, ElSelect, ElOption } from 'element-plus'
import { ElDialog } from 'element-plus'
import MaterialSelectionDialog from '@/components/home/MaterialSelectionDialog.vue'

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
  console.log('保存对平物资信息:', unalignedMaterials.value)
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
  padding: 32px;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: #212529;
}

.page-header {
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 16px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #007bff;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px rgba(0, 123, 255, 0.08);
}

.page-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 6px;
  background: #007bff;
  border-radius: 3px;
  box-shadow: 0 0 6px rgba(0, 123, 255, 0.08);
}

.material-table {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 123, 255, 0.08);
  background-color: #fff;
  border: 1px solid rgba(0, 123, 255, 0.1);
}

.material-table :deep(.el-table__header-wrapper th) {
  background-color: rgba(0, 123, 255, 0.03);
  color: #007bff;
  font-weight: 600;
  font-size: 15px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 14px 0;
  text-shadow: 0 0 2px rgba(0, 123, 255, 0.08);
}

.material-table :deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: #212529;
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.material-table :deep(.el-table__row:hover) {
  background-color: rgba(0, 123, 255, 0.03) !important;
  box-shadow: inset 0 0 8px rgba(0, 123, 255, 0.08);
}

.material-table :deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 0;
  text-align: center;
}
</style>
