<template>
  <div class="material-management-page">
    <!-- 顶部操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📦 基础物资管理</h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="goBack">智能大脑</el-breadcrumb-item>
          <el-breadcrumb-item>基础物资管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button @click="goBack">返回智能大脑</el-button>
        <el-button @click="showImportDialog = true">导入价格</el-button>
        <el-button @click="showExportDialog = true">导出数据</el-button>
        <el-button
          v-if="activeTab === 'materials'"
          type="primary"
          @click="showAddMaterialDialog = true"
          >+ 新增物资</el-button
        >
        <el-button v-if="activeTab === 'prices'" type="primary" @click="showAddPriceDialog = true"
          >+ 新增价格</el-button
        >
      </div>
    </div>

    <!-- 功能切换标签页 -->
    <div class="tabs-section">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="management-tabs">
        <el-tab-pane label="基础物资管理" name="materials">
          <template #label>
            <span
              ><el-icon><Box /></el-icon> 基础物资管理</span
            >
          </template>
        </el-tab-pane>
        <el-tab-pane label="物资价格管理" name="prices">
          <template #label>
            <span
              ><el-icon><Money /></el-icon> 物资价格管理</span
            >
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 基础物资管理页面 -->
    <div v-show="activeTab === 'materials'" class="materials-panel">
      <!-- 物资筛选条件 -->
      <div class="filter-section">
        <el-form :model="materialSearchParams" inline>
          <el-form-item label="物资名称:">
            <el-input
              v-model="materialSearchParams.materialName"
              placeholder="请输入物资名称"
              style="width: 200px"
              clearable
            />
          </el-form-item>
          <el-form-item label="规格型号:">
            <el-input
              v-model="materialSearchParams.specification"
              placeholder="请输入规格型号"
              style="width: 200px"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleMaterialSearch">查询</el-button>
            <el-button @click="handleMaterialReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 物资统计卡片 -->
      <div class="stats-cards">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📦</div>
            <div class="stats-info">
              <div class="stats-title">总物资数</div>
              <div class="stats-value">{{ materialStatsData.totalMaterials }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📊</div>
            <div class="stats-info">
              <div class="stats-title">有价格物资</div>
              <div class="stats-value">{{ materialStatsData.materialWithPrices }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">🕒</div>
            <div class="stats-info">
              <div class="stats-title">最近更新</div>
              <div class="stats-value">{{ materialStatsData.lastUpdate }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 基础物资列表表格 -->
      <div class="table-section">
        <el-table
          :data="filteredBaseMaterialList"
          style="width: 100%"
          v-loading="loading"
          stripe
          @selection-change="handleMaterialSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="materialName" label="物资名称" min-width="150" />
          <el-table-column prop="specification" label="规格型号" min-width="150" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="category" label="物资分类" width="120" />
          <el-table-column prop="priceCount" label="价格记录数" width="100">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.priceCount }}条</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="primary" @click="editBaseMaterial(row)">
                  编辑
                </el-button>
                <el-button size="small" type="success" @click="managePrices(row)">
                  价格管理
                </el-button>
                <el-button size="small" type="danger" @click="deleteBaseMaterial(row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="materialPagination.current"
            v-model:page-size="materialPagination.pageSize"
            :page-sizes="[20, 50, 100]"
            :total="materialPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleMaterialSizeChange"
            @current-change="handleMaterialCurrentChange"
          />
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedBaseMaterials.length > 0" class="batch-actions">
          <el-button type="danger" @click="batchDeleteBaseMaterials">
            批量删除 ({{ selectedBaseMaterials.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 物资价格管理页面 -->
    <div v-show="activeTab === 'prices'" class="prices-panel">
      <!-- 价格筛选条件 -->
      <div class="filter-section">
        <el-form :model="priceSearchParams" inline>
          <el-form-item label="物资名称:">
            <el-select
              v-model="priceSearchParams.materialId"
              placeholder="请选择物资"
              style="width: 200px"
              clearable
              filterable
            >
              <el-option
                v-for="material in baseMaterialList"
                :key="material.id"
                :label="`${material.materialName} (${material.specification})`"
                :value="material.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="年份:">
            <el-select v-model="priceSearchParams.year" style="width: 120px">
              <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
            </el-select>
          </el-form-item>
          <el-form-item label="季度:">
            <el-select v-model="priceSearchParams.quarter" style="width: 100px">
              <el-option label="Q1" value="Q1" />
              <el-option label="Q2" value="Q2" />
              <el-option label="Q3" value="Q3" />
              <el-option label="Q4" value="Q4" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handlePriceSearch">查询</el-button>
            <el-button @click="handlePriceReset">重置</el-button>
            <el-button type="success" @click="showAddPriceDialog = true">+ 新增价格</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 价格统计卡片 -->
      <div class="stats-cards">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">💰</div>
            <div class="stats-info">
              <div class="stats-title">价格记录数</div>
              <div class="stats-value">{{ priceStatsData.totalPrices }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📅</div>
            <div class="stats-info">
              <div class="stats-title">当前季度</div>
              <div class="stats-value">{{ priceStatsData.currentQuarter }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📊</div>
            <div class="stats-info">
              <div class="stats-title">平均价格</div>
              <div class="stats-value">¥{{ priceStatsData.averagePrice }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">🕒</div>
            <div class="stats-info">
              <div class="stats-title">最近更新</div>
              <div class="stats-value">{{ priceStatsData.lastUpdate }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 物资价格列表表格 -->
      <div class="table-section">
        <el-table
          :data="filteredPriceList"
          style="width: 100%"
          v-loading="loading"
          stripe
          @selection-change="handlePriceSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="materialName" label="物资名称" min-width="120" />
          <el-table-column prop="specification" label="规格型号" min-width="120" />
          <el-table-column prop="price" label="物资价格" width="120">
            <template #default="{ row }">
              <span style="color: var(--theme-price-color); font-weight: 600">
                ¥{{ row.price.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="priceQuarter" label="价格季度" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column prop="updateTime" label="更新时间" width="160" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="primary" @click="editPrice(row)"> 编辑 </el-button>
                <el-button size="small" type="danger" @click="deletePrice(row)"> 删除 </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pricePagination.current"
            v-model:page-size="pricePagination.pageSize"
            :page-sizes="[20, 50, 100]"
            :total="pricePagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePriceSizeChange"
            @current-change="handlePriceCurrentChange"
          />
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedPrices.length > 0" class="batch-actions">
          <el-button type="danger" @click="batchDeletePrices">
            批量删除 ({{ selectedPrices.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑基础物资弹窗 -->
    <el-dialog
      v-model="showAddMaterialDialog"
      :title="editingBaseMaterial ? '编辑基础物资' : '新增基础物资'"
      width="500px"
      @close="resetMaterialForm"
    >
      <el-form
        ref="materialFormRef"
        :model="baseMaterialForm"
        :rules="baseMaterialFormRules"
        label-width="80px"
      >
        <el-form-item label="物资名称" prop="materialName">
          <el-input v-model="baseMaterialForm.materialName" placeholder="请输入物资名称" />
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="baseMaterialForm.specification" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="baseMaterialForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="物资分类" prop="category">
          <el-input v-model="baseMaterialForm.category" placeholder="请输入物资分类" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMaterial">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑价格弹窗 -->
    <el-dialog
      v-model="showAddPriceDialog"
      :title="editingPrice ? '编辑价格' : '新增价格'"
      width="500px"
      @close="resetPriceForm"
    >
      <el-form ref="priceFormRef" :model="priceForm" :rules="priceFormRules" label-width="80px">
        <el-form-item label="选择物资" prop="materialId">
          <el-select v-model="priceForm.materialId" style="width: 100%" placeholder="请选择物资">
            <el-option
              v-for="material in baseMaterialList"
              :key="material.id"
              :label="`${material.materialName} (${material.specification})`"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-select v-model="priceForm.year" style="width: 100%">
            <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="季度" prop="quarter">
          <el-select v-model="priceForm.quarter" style="width: 100%">
            <el-option label="Q1" value="Q1" />
            <el-option label="Q2" value="Q2" />
            <el-option label="Q3" value="Q3" />
            <el-option label="Q4" value="Q4" />
          </el-select>
        </el-form-item>
        <el-form-item label="物资价格" prop="price">
          <el-input-number
            v-model="priceForm.price"
            :min="0"
            :precision="2"
            placeholder="请输入物资价格"
            style="width: 100%"
          />
          <div class="price-hint">¥，保留2位小数</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showAddPriceDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrice">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="showImportDialog" title="批量导入物资" width="500px">
      <el-form :model="importForm" label-width="80px">
        <el-form-item label="年份" required>
          <el-select v-model="importForm.year" style="width: 100%">
            <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="季度" required>
          <el-select v-model="importForm.quarter" style="width: 100%">
            <el-option label="Q1" value="Q1" />
            <el-option label="Q2" value="Q2" />
            <el-option label="Q3" value="Q3" />
            <el-option label="Q4" value="Q4" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".xlsx,.xls"
            @change="handleFileChange"
          >
            <el-button>选择Excel文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持.xlsx,.xls格式</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="导入模板">
          <el-button @click="downloadTemplate">下载导入模板</el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="startImport">开始导入</el-button>
      </template>
    </el-dialog>

    <!-- 批量导出弹窗 -->
    <el-dialog v-model="showExportDialog" title="批量导出物资" width="500px">
      <el-form :model="exportForm" label-width="80px">
        <el-form-item label="年份" required>
          <el-select v-model="exportForm.year" style="width: 100%">
            <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="季度" required>
          <el-select v-model="exportForm.quarter" style="width: 100%">
            <el-option label="Q1" value="Q1" />
            <el-option label="Q2" value="Q2" />
            <el-option label="Q3" value="Q3" />
            <el-option label="Q4" value="Q4" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio value="xlsx">Excel (.xlsx)</el-radio>
            <el-radio value="csv">CSV (.csv)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportForm.range">
            <el-radio value="filtered">当前筛选结果</el-radio>
            <el-radio value="all">全部数据</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="startExport">开始导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Box, Money } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 检查权限
if (!authStore.hasPermission('view_material_management')) {
  ElMessage.error('您没有权限访问此页面')
  router.push('/smart-brain')
}

// 响应式数据
const loading = ref(false)
const activeTab = ref('materials')
const showAddMaterialDialog = ref(false)
const showAddPriceDialog = ref(false)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const editingBaseMaterial = ref(null)
const editingPrice = ref(null)
const selectedBaseMaterials = ref([])
const selectedPrices = ref([])
const materialFormRef = ref(null)
const priceFormRef = ref(null)

// 基础物资搜索参数
const materialSearchParams = reactive({
  materialName: '',
  specification: ''
})

// 价格搜索参数
const priceSearchParams = reactive({
  materialId: '',
  year: new Date().getFullYear(),
  quarter: 'Q1'
})

// 基础物资分页参数
const materialPagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0
})

// 价格分页参数
const pricePagination = reactive({
  current: 1,
  pageSize: 50,
  total: 0
})

// 基础物资表单数据
const baseMaterialForm = reactive({
  materialName: '',
  specification: '',
  unit: '',
  category: ''
})

// 价格表单数据
const priceForm = reactive({
  materialId: '',
  year: new Date().getFullYear(),
  quarter: 'Q1',
  price: 0
})

const importForm = reactive({
  year: new Date().getFullYear(),
  quarter: 'Q1',
  file: null
})

const exportForm = reactive({
  year: new Date().getFullYear(),
  quarter: 'Q1',
  format: 'xlsx',
  range: 'filtered'
})

// 年份选项
const yearOptions = computed(() => {
  const years = []
  for (let i = 2020; i <= 2030; i++) {
    years.push(i)
  }
  return years
})

// 假数据 - 基础物资列表
const baseMaterialList = ref([
  {
    id: 1,
    materialName: '水泥',
    specification: '425#',
    unit: '吨',
    category: '建筑材料',
    priceCount: 8,
    createTime: '2024-01-15 10:30:25',
    creator: '张三'
  },
  {
    id: 2,
    materialName: '钢筋',
    specification: 'HRB400 Φ12',
    unit: '吨',
    category: '钢材',
    priceCount: 12,
    createTime: '2024-01-20 09:15:30',
    creator: '王五'
  },
  {
    id: 3,
    materialName: '砖块',
    specification: '标准红砖',
    unit: '块',
    category: '砌体材料',
    priceCount: 6,
    createTime: '2024-02-01 11:20:15',
    creator: '张三'
  },
  {
    id: 4,
    materialName: '沙子',
    specification: '中粗砂',
    unit: '立方米',
    category: '砂石料',
    priceCount: 10,
    createTime: '2024-02-05 14:10:45',
    creator: '李四'
  },
  {
    id: 5,
    materialName: '石子',
    specification: '5-25mm碎石',
    unit: '立方米',
    category: '砂石料',
    priceCount: 4,
    createTime: '2024-02-08 08:45:20',
    creator: '赵六'
  }
])

// 假数据 - 物资价格列表
const priceList = ref([
  {
    id: 1,
    materialId: 1,
    materialName: '水泥',
    specification: '425#',
    price: 350.0,
    year: 2024,
    quarter: 'Q1',
    priceQuarter: '2024-Q1',
    createTime: '2024-01-15 10:30:25',
    updateTime: '2024-03-10 14:20:15'
  },
  {
    id: 2,
    materialId: 1,
    materialName: '水泥',
    specification: '425#',
    price: 365.0,
    year: 2024,
    quarter: 'Q2',
    priceQuarter: '2024-Q2',
    createTime: '2024-04-01 10:30:25',
    updateTime: '2024-06-10 14:20:15'
  },
  {
    id: 3,
    materialId: 2,
    materialName: '钢筋',
    specification: 'HRB400 Φ12',
    price: 4200.0,
    year: 2024,
    quarter: 'Q1',
    priceQuarter: '2024-Q1',
    createTime: '2024-01-20 09:15:30',
    updateTime: '2024-02-28 16:45:20'
  },
  {
    id: 4,
    materialId: 2,
    materialName: '钢筋',
    specification: 'HRB400 Φ12',
    price: 4350.0,
    year: 2024,
    quarter: 'Q2',
    priceQuarter: '2024-Q2',
    createTime: '2024-04-15 09:15:30',
    updateTime: '2024-05-28 16:45:20'
  },
  {
    id: 5,
    materialId: 3,
    materialName: '砖块',
    specification: '标准红砖',
    price: 0.45,
    year: 2024,
    quarter: 'Q1',
    priceQuarter: '2024-Q1',
    createTime: '2024-02-01 11:20:15',
    updateTime: '2024-03-15 13:30:25'
  }
])

// 过滤后的基础物资列表
const filteredMaterialData = computed(() => {
  let filtered = baseMaterialList.value

  // 按物资名称筛选
  if (materialSearchParams.materialName) {
    filtered = filtered.filter((item) =>
      item.materialName.includes(materialSearchParams.materialName)
    )
  }

  // 按规格型号筛选
  if (materialSearchParams.specification) {
    filtered = filtered.filter((item) =>
      item.specification.includes(materialSearchParams.specification)
    )
  }

  return filtered
})

const filteredBaseMaterialList = computed(() => {
  const filtered = filteredMaterialData.value
  // 分页处理
  const start = (materialPagination.current - 1) * materialPagination.pageSize
  const end = start + materialPagination.pageSize
  return filtered.slice(start, end)
})

// 过滤后的价格数据
const filteredPriceData = computed(() => {
  let filtered = priceList.value

  // 按物资筛选
  if (priceSearchParams.materialId) {
    filtered = filtered.filter((item) => item.materialId === priceSearchParams.materialId)
  }

  // 按年份筛选
  if (priceSearchParams.year) {
    filtered = filtered.filter((item) => item.year === priceSearchParams.year)
  }

  // 按季度筛选
  if (priceSearchParams.quarter) {
    filtered = filtered.filter((item) => item.quarter === priceSearchParams.quarter)
  }

  return filtered
})

const filteredPriceList = computed(() => {
  const filtered = filteredPriceData.value
  // 分页处理
  const start = (pricePagination.current - 1) * pricePagination.pageSize
  const end = start + pricePagination.pageSize
  return filtered.slice(start, end)
})

// 基础物资统计数据
const materialStatsData = computed(() => {
  const hasPriceCount = baseMaterialList.value.filter((item) => item.priceCount > 0).length

  return {
    totalMaterials: baseMaterialList.value.length.toLocaleString(),
    materialWithPrices: hasPriceCount.toLocaleString(),
    lastUpdate: '2024-03-20'
  }
})

// 价格统计数据
const priceStatsData = computed(() => {
  const filtered = filteredPriceList.value
  const totalPrice = filtered.reduce((sum, item) => sum + item.price, 0)
  const currentQuarter =
    new Date().getMonth() < 3
      ? 'Q1'
      : new Date().getMonth() < 6
      ? 'Q2'
      : new Date().getMonth() < 9
      ? 'Q3'
      : 'Q4'

  return {
    totalPrices: priceList.value.length.toLocaleString(),
    currentQuarter: `${new Date().getFullYear()}-${currentQuarter}`,
    averagePrice: filtered.length > 0 ? (totalPrice / filtered.length).toFixed(2) : '0.00',
    lastUpdate: '2024-03-20'
  }
})

// 基础物资表单验证规则
const baseMaterialFormRules = {
  materialName: [
    { required: true, message: '请输入物资名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  specification: [
    { required: true, message: '请输入规格型号', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  category: [{ required: true, message: '请输入物资分类', trigger: 'blur' }]
}

// 价格表单验证规则
const priceFormRules = {
  materialId: [{ required: true, message: '请选择物资', trigger: 'change' }],
  year: [{ required: true, message: '请选择年份', trigger: 'change' }],
  quarter: [{ required: true, message: '请选择季度', trigger: 'change' }],
  price: [
    { required: true, message: '请输入物资价格', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
  ]
}

// 方法
const goBack = () => {
  router.push('/smart-brain')
}

const handleTabClick = (tab) => {
  activeTab.value = tab.name
}

// 基础物资相关方法
const handleMaterialSearch = () => {
  materialPagination.current = 1
}

const handleMaterialReset = () => {
  materialSearchParams.materialName = ''
  materialSearchParams.specification = ''
  materialPagination.current = 1
}

const handleMaterialSelectionChange = (selection) => {
  selectedBaseMaterials.value = selection
}

const handleMaterialSizeChange = (size) => {
  materialPagination.pageSize = size
  materialPagination.current = 1
}

const handleMaterialCurrentChange = (current) => {
  materialPagination.current = current
}

const editBaseMaterial = (row) => {
  editingBaseMaterial.value = row
  Object.assign(baseMaterialForm, row)
  showAddMaterialDialog.value = true
}

const deleteBaseMaterial = (row) => {
  ElMessageBox.confirm('确定要删除这个基础物资吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = baseMaterialList.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      baseMaterialList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const batchDeleteBaseMaterials = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedBaseMaterials.value.length} 个基础物资吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const idsToDelete = selectedBaseMaterials.value.map((item) => item.id)
    baseMaterialList.value = baseMaterialList.value.filter((item) => !idsToDelete.includes(item.id))
    selectedBaseMaterials.value = []
    ElMessage.success('批量删除成功')
  })
}

const managePrices = (row) => {
  priceSearchParams.materialId = row.id
  activeTab.value = 'prices'
}

// 价格相关方法
const handlePriceSearch = () => {
  pricePagination.current = 1
}

const handlePriceReset = () => {
  priceSearchParams.materialId = ''
  priceSearchParams.year = new Date().getFullYear()
  priceSearchParams.quarter = 'Q1'
  pricePagination.current = 1
}

const handlePriceSelectionChange = (selection) => {
  selectedPrices.value = selection
}

const handlePriceSizeChange = (size) => {
  pricePagination.pageSize = size
  pricePagination.current = 1
}

const handlePriceCurrentChange = (current) => {
  pricePagination.current = current
}

const editPrice = (row) => {
  editingPrice.value = row
  Object.assign(priceForm, row)
  showAddPriceDialog.value = true
}

const deletePrice = (row) => {
  ElMessageBox.confirm('确定要删除这个价格记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = priceList.value.findIndex((item) => item.id === row.id)
    if (index > -1) {
      priceList.value.splice(index, 1)
      ElMessage.success('删除成功')
      // 更新基础物资的价格记录数
      updateMaterialPriceCount(row.materialId)
    }
  })
}

const batchDeletePrices = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedPrices.value.length} 个价格记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idsToDelete = selectedPrices.value.map((item) => item.id)
    const materialIdsToUpdate = new Set(selectedPrices.value.map((item) => item.materialId))
    priceList.value = priceList.value.filter((item) => !idsToDelete.includes(item.id))
    selectedPrices.value = []
    // 更新基础物资的价格记录数
    materialIdsToUpdate.forEach((materialId) => updateMaterialPriceCount(materialId))
    ElMessage.success('批量删除成功')
  })
}

// 更新物资价格记录数
const updateMaterialPriceCount = (materialId) => {
  const material = baseMaterialList.value.find((item) => item.id === materialId)
  if (material) {
    material.priceCount = priceList.value.filter((price) => price.materialId === materialId).length
  }
}

const resetMaterialForm = () => {
  editingBaseMaterial.value = null
  Object.assign(baseMaterialForm, {
    materialName: '',
    specification: '',
    unit: '',
    category: ''
  })
  if (materialFormRef.value) {
    materialFormRef.value.clearValidate()
  }
}

const resetPriceForm = () => {
  editingPrice.value = null
  Object.assign(priceForm, {
    materialId: '',
    year: new Date().getFullYear(),
    quarter: 'Q1',
    price: 0
  })
  if (priceFormRef.value) {
    priceFormRef.value.clearValidate()
  }
}

const saveMaterial = () => {
  materialFormRef.value.validate((valid) => {
    if (valid) {
      if (editingBaseMaterial.value) {
        // 编辑
        const index = baseMaterialList.value.findIndex(
          (item) => item.id === editingBaseMaterial.value.id
        )
        if (index > -1) {
          baseMaterialList.value[index] = {
            ...baseMaterialList.value[index],
            ...baseMaterialForm
          }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newMaterial = {
          id: Date.now(),
          ...baseMaterialForm,
          priceCount: 0,
          createTime: new Date()
            .toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            .replace(/\//g, '-'),
          creator: '当前用户'
        }
        baseMaterialList.value.unshift(newMaterial)
        ElMessage.success('新增成功')
      }
      showAddMaterialDialog.value = false
      resetMaterialForm()
    }
  })
}

const savePrice = () => {
  priceFormRef.value.validate((valid) => {
    if (valid) {
      if (editingPrice.value) {
        // 编辑
        const index = priceList.value.findIndex((item) => item.id === editingPrice.value.id)
        if (index > -1) {
          const material = baseMaterialList.value.find((m) => m.id === priceForm.materialId)
          priceList.value[index] = {
            ...priceList.value[index],
            ...priceForm,
            materialName: material?.materialName || '',
            specification: material?.specification || '',
            priceQuarter: `${priceForm.year}-${priceForm.quarter}`,
            updateTime: new Date()
              .toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })
              .replace(/\//g, '-')
          }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const material = baseMaterialList.value.find((m) => m.id === priceForm.materialId)
        const newPrice = {
          id: Date.now(),
          ...priceForm,
          materialName: material?.materialName || '',
          specification: material?.specification || '',
          priceQuarter: `${priceForm.year}-${priceForm.quarter}`,
          createTime: new Date()
            .toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            .replace(/\//g, '-'),
          updateTime: new Date()
            .toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            .replace(/\//g, '-')
        }
        priceList.value.unshift(newPrice)
        // 更新基础物资的价格记录数
        updateMaterialPriceCount(priceForm.materialId)
        ElMessage.success('新增成功')
      }
      showAddPriceDialog.value = false
      resetPriceForm()
    }
  })
}

const handleFileChange = (file) => {
  importForm.file = file.raw
}

const downloadTemplate = () => {
  // 这里可以实现模板下载逻辑
  ElMessage.info('模板下载功能待实现')
}

const startImport = () => {
  if (!importForm.file) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  ElMessage.info('导入功能待实现')
  showImportDialog.value = false
}

const startExport = () => {
  ElMessage.info('导出功能待实现')
  showExportDialog.value = false
}

// 监听筛选数据变化，更新分页总数
watchEffect(() => {
  materialPagination.total = filteredMaterialData.value.length
})

watchEffect(() => {
  pricePagination.total = filteredPriceData.value.length
})

onMounted(() => {
  // 页面加载时初始化
  // 数据已经通过watchEffect自动更新
})
</script>

<style scoped>
.material-management-page {
  padding: 24px;
  background: var(--theme-bg-primary);
  min-height: 100vh;
  transition: all 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--theme-border-secondary);
  background: var(--theme-card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
}

.page-header:hover {
  box-shadow: var(--theme-card-hover-shadow);
  transform: translateY(-1px);
}

.tabs-section {
  margin-bottom: 24px;
}

.management-tabs {
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  padding: 0;
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
}

.management-tabs:hover {
  box-shadow: var(--theme-card-hover-shadow);
}

/* 标签页内容区域添加内边距 */
:deep(.el-tabs__content) {
  padding: 0 16px;
}

/* 标签页头部样式优化 */
:deep(.el-tabs__header) {
  margin: 0;
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-bg-tertiary));
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  border-bottom: 2px solid var(--theme-border-secondary);
}

:deep(.el-tabs__nav-wrap) {
  padding: 8px 0;
  overflow: hidden;
}

:deep(.el-tabs__nav-scroll) {
  overflow: hidden;
}

:deep(.el-tabs__nav) {
  border: none;
  overflow: hidden;
}

:deep(.el-tabs__item) {
  color: var(--theme-text-secondary);
  border: 1px solid transparent;
  padding: 14px 24px !important;
  margin-right: 12px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  min-height: 48px;
  box-sizing: border-box;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 强制居中所有子元素 */
:deep(.el-tabs__item > *) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
}

:deep(.el-tabs__item span) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
}

:deep(.el-tabs__item .el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  color: white;
  overflow: hidden;
  border-color: var(--theme-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(var(--theme-primary), 0.3);
  transform: translateY(-2px) scale(1.02);
  font-weight: 600;
}

:deep(.el-tabs__item:hover) {
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  border-color: var(--theme-primary);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__item.is-active:hover) {
  background: linear-gradient(135deg, var(--theme-primary-dark), var(--theme-primary));
  color: white;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(var(--theme-primary), 0.4);
}

:deep(.el-tabs__active-bar) {
  display: none;
}

/* 确保标签页容器不会溢出 */
:deep(.el-tabs__item::before),
:deep(.el-tabs__item::after) {
  display: none;
}

.materials-panel,
.prices-panel {
  animation: fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.header-left h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.header-right .el-button {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-right .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.header-right .el-button--primary {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
}

/* 当按钮过多时自动换行 */
@media (max-width: 1200px) {
  .header-right {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
  
  .header-right .el-button {
    width: 120px;
    justify-content: center;
  }
}

@media (max-width: 992px) {
  .header-right {
    width: 100%;
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .header-right .el-button {
    flex: 1;
    min-width: 100px;
    max-width: 140px;
  }
}

.filter-section {
  background: var(--theme-card-bg);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
}

.filter-section:hover {
  box-shadow: var(--theme-card-hover-shadow);
  transform: translateY(-1px);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stats-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--theme-card-hover-shadow);
}

.stats-card:hover::before {
  opacity: 1;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-icon {
  font-size: 32px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.stats-card:hover .stats-icon {
  transform: rotate(5deg) scale(1.05);
}

.stats-info {
  flex: 1;
}

.stats-title {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
}

.table-section {
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  overflow: hidden;
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
}

.table-section:hover {
  box-shadow: var(--theme-card-hover-shadow);
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
  border-top: 2px solid var(--theme-border-secondary);
  background: linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-bg-tertiary));
}

.batch-actions {
  padding: 20px;
  border-top: 2px solid var(--theme-border-secondary);
  background: linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-bg-tertiary));
  text-align: center;
}

.batch-actions .el-button {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.batch-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.price-hint {
  font-size: 12px;
  color: var(--theme-text-tertiary);
  margin-top: 6px;
  font-style: italic;
  opacity: 0.8;
}

/* Element Plus 样式覆盖 - 增强主题适配 */
:deep(.el-table) {
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.el-table th.el-table__cell) {
  background: linear-gradient(135deg, var(--theme-table-header-bg), var(--theme-bg-tertiary));
  color: var(--theme-text-primary);
  border-color: var(--theme-table-border);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 13px;
  padding: 16px 12px;
}

:deep(.el-table td.el-table__cell) {
  border-color: var(--theme-table-border);
  background: var(--theme-bg-primary);
  color: var(--theme-text-primary);
  padding: 14px 12px;
  transition: all 0.3s ease;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--theme-table-stripe-bg);
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: var(--theme-table-hover-bg);
  transform: scale(1.002);
  box-shadow: inset 2px 0 0 var(--theme-primary);
}

:deep(.el-card__body) {
  background: var(--theme-bg-primary);
  transition: all 0.3s ease;
}

:deep(.el-card) {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
}

:deep(.el-form-item__label) {
  color: var(--theme-text-primary);
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-input__inner) {
  border-radius: 8px;
  border: 1px solid var(--theme-input-border);
  background: var(--theme-input-bg);
  color: var(--theme-text-primary);
  transition: all 0.3s ease;
}

:deep(.el-input__inner:focus) {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary), 0.2);
  transform: translateY(-1px);
}

:deep(.el-select .el-input__inner) {
  cursor: pointer;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, var(--theme-primary-dark), var(--theme-primary));
}

:deep(.el-pagination) {
  justify-content: center;
}

:deep(.el-pagination button) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-pagination button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-pager li) {
  border-radius: 6px;
  transition: all 0.3s ease;
  margin: 0 2px;
}

:deep(.el-pager li:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  color: white;
  font-weight: 600;
}

:deep(.el-breadcrumb__item) {
  color: var(--theme-text-secondary);
  font-size: 14px;
}

:deep(.el-breadcrumb__separator) {
  color: var(--theme-text-tertiary);
  font-weight: 500;
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: var(--theme-dialog-shadow);
  background: var(--theme-dialog-bg);
  border: 1px solid var(--theme-dialog-border);
}

:deep(.el-dialog__header) {
  background: var(--theme-dialog-header-bg);
  border-bottom: 1px solid var(--theme-dialog-border);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: var(--theme-text-primary);
  font-size: 18px;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: var(--theme-text-primary);
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  text-align: right;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  border-radius: 8px;
  border: 2px dashed var(--theme-border-primary);
  background: var(--theme-bg-secondary);
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--theme-primary);
  background: var(--theme-bg-tertiary);
  transform: translateY(-2px);
}

:deep(.el-breadcrumb__item.is-link) {
  color: var(--theme-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

:deep(.el-breadcrumb__item.is-link:hover) {
  color: var(--theme-primary-light);
  transform: translateX(2px);
}

/* 表格操作按钮样式 */
.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.table-actions .el-button {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.table-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.table-actions .el-button {
  margin: 2px 0;
  min-width: 60px;
}

/* 当操作栏空间不够时，按钮垂直排列 */
@media (max-width: 1400px) {
  .table-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .table-actions .el-button {
    width: 100%;
    margin: 1px 0;
  }
}

/* 价格管理表格操作栏 - 两个按钮时的处理 */
.prices-panel .table-actions {
  flex-direction: row;
}

@media (max-width: 1200px) {
  .prices-panel .table-actions {
    flex-direction: column;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-management-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-right .el-button {
    width: 100%;
    margin-bottom: 8px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filter-section .el-form {
    flex-direction: column;
  }

  .filter-section .el-form-item {
    margin-right: 0;
    margin-bottom: 16px;
  }
  
  /* 移动端表格操作按钮强制垂直排列 */
  .table-actions {
    flex-direction: column !important;
    gap: 2px;
  }
  
  .table-actions .el-button {
    width: 100% !important;
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
