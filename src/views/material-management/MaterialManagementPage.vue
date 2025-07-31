<template>
  <div class="material-management-page">
    <!-- 顶部操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <span style="color: #333; background-color: #ffff">📦 </span>基础物资管理
        </h1>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="navigateToSmartBrain">智能大脑</el-breadcrumb-item>
          <el-breadcrumb-item>基础物资管理</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button @click="navigateToSmartBrain">返回智能大脑</el-button>
        <el-button @click="openImportDialog(dialogState)">导入价格</el-button>
        <el-button
          @click="exportCurrentData(currentData, `material-${currentTab.value}`, currentTab.value)"
          >导出数据</el-button
        >
        <el-button
          v-if="currentTab === TAB_NAMES.MATERIALS"
          type="primary"
          @click="openAddMaterialDialog(dialogState)"
          >+ 新增物资</el-button
        >
        <el-button
          v-if="currentTab === TAB_NAMES.PRICES"
          type="primary"
          @click="openAddPriceDialog(dialogState)"
          >+ 新增价格</el-button
        >
      </div>
    </div>

    <!-- 功能切换标签页 -->
    <div class="tabs-section">
      <el-tabs
        v-model="currentTab"
        @tab-click="(tab) => switchTab(tab.name, currentTab, loadCurrentTabData)"
        class="management-tabs"
      >
        <el-tab-pane v-for="tab in TAB_CONFIG" :key="tab.name" :label="tab.label" :name="tab.name">
          <template #label>
            <span style="margin: 5px">{{ tab.icon }} {{ tab.label }}</span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 基础物资管理页面 -->
    <div v-show="currentTab === TAB_NAMES.MATERIALS" class="materials-panel">
      <!-- 物资筛选条件 -->
      <div class="filter-section">
        <el-form :model="materialSearchForm" inline ref="materialSearchFormRef">
          <el-form-item
            v-for="(config, key) in SEARCH_FORM_CONFIG.MATERIALS"
            :key="key"
            :label="`${config.label}:`"
            :prop="key"
          >
            <el-input
              v-if="config.type === 'input'"
              v-model="materialSearchForm[key]"
              :placeholder="config.placeholder"
              style="width: 200px"
              clearable
            />
            <el-select
              v-else-if="config.type === 'select'"
              v-model="materialSearchForm[key]"
              :placeholder="config.placeholder"
              style="width: 200px"
              clearable
              filterable
            >
              <el-option
                v-for="option in config.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="
                performMaterialSearch(materialSearchForm, loadMaterials, () =>
                  resetPagination(materialPagination)
                )
              "
            >
              查询
            </el-button>
            <el-button
              @click="resetSearchForm(materialSearchFormRef, materialSearchForm, loadMaterials)"
            >
              重置
            </el-button>
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
              <div class="stats-value">{{ materialStats.totalMaterials }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📊</div>
            <div class="stats-info">
              <div class="stats-title">有价格物资</div>
              <div class="stats-value">{{ materialStats.materialWithPrices }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">🕒</div>
            <div class="stats-info">
              <div class="stats-title">最近更新</div>
              <div class="stats-value">{{ materialStats.lastUpdate }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 基础物资列表表格 -->
      <div class="table-section">
        <el-table
          :data="materialTableData"
          style="width: 100%"
          v-loading="loading"
          stripe
          @selection-change="
            (selection) => onTableSelectionChange(selection, selectedMaterials)
          "
        >
          <el-table-column
            v-for="column in MATERIAL_COLUMNS"
            :key="column.prop || column.type || column.label"
            v-bind="column"
          >
            <template v-if="column.prop === 'priceCount'" #default="{ row }">
              <el-tag type="info" size="small">{{ row.priceCount }}条</el-tag>
            </template>
            <template v-else-if="column.prop === 'createTime'" #default="{ row }">
              {{ formatDisplayTime(row.createTime) }}
            </template>
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="primary" @click="editMaterial(row)"> 编辑 </el-button>
                <el-button size="small" type="success" @click="manageMaterialPrices(row)">
                  价格管理
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="confirmSingleDelete(row, deleteMaterials)"
                >
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
            :page-sizes="PAGINATION_CONFIG.PAGE_SIZES"
            :total="materialPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="(size) => changePaginationSize(size, materialPagination, loadMaterials)"
            @current-change="
              (current) => changePaginationCurrent(current, materialPagination, loadMaterials)
            "
          />
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedMaterials.length > 0" class="batch-actions">
          <el-button type="danger" @click="confirmBatchDelete(selectedMaterials, deleteMaterials)">
            批量删除 ({{ selectedMaterials.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 物资价格管理页面 -->
    <div v-show="currentTab === TAB_NAMES.PRICES" class="prices-panel">
      <!-- 价格筛选条件 -->
      <div class="filter-section">
        <el-form :model="priceSearchForm" inline ref="priceSearchFormRef">
          <el-form-item label="物资名称:">
            <el-select
              v-model="priceSearchForm.materialId"
              placeholder="请选择物资"
              style="width: 200px"
              clearable
              filterable
            >
              <el-option
                v-for="material in materialList"
                :key="material.id"
                :label="`${material.materialName} (${material.specification})`"
                :value="material.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-for="(config, key) in SEARCH_FORM_CONFIG.PRICES"
            :key="key"
            v-if="key !== 'materialId'"
            :label="`${config.label}:`"
            :prop="key"
          >
            <el-select
              v-model="priceSearchForm[key]"
              :placeholder="config.placeholder"
              style="width: 200px"
            >
              <el-option
                v-for="option in config.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="
                performPriceSearch(priceSearchForm, loadPrices, () =>
                  resetPagination(pricePagination)
                )
              "
            >
              查询
            </el-button>
            <el-button @click="resetSearchForm(priceSearchFormRef, priceSearchForm, loadPrices)">
              重置
            </el-button>
            <el-button type="success" @click="openAddPriceDialog(dialogState)"
              >+ 新增价格</el-button
            >
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
              <div class="stats-value">{{ priceStats.totalPrices }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📅</div>
            <div class="stats-info">
              <div class="stats-title">当前季度</div>
              <div class="stats-value">{{ priceStats.currentQuarter }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📊</div>
            <div class="stats-info">
              <div class="stats-title">平均价格</div>
              <div class="stats-value">{{ formatPriceDisplay(priceStats.averagePrice) }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">🕒</div>
            <div class="stats-info">
              <div class="stats-title">最近更新</div>
              <div class="stats-value">{{ priceStats.lastUpdate }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 物资价格列表表格 -->
      <div class="table-section">
        <el-table
          :data="priceTableData"
          style="width: 100%"
          v-loading="loading"
          stripe
          @selection-change="(selection) => onTableSelectionChange(selection, selectedPrices)"
        >
          <el-table-column
            v-for="column in PRICE_COLUMNS"
            :key="column.prop || column.type || column.label"
            v-bind="column"
          >
            <template v-if="column.prop === 'price'" #default="{ row }">
              <span style="color: var(--theme-price-color); font-weight: 600">
                {{ formatPriceDisplay(row.price) }}
              </span>
            </template>
            <template v-else-if="column.prop === 'createTime'" #default="{ row }">
              {{ formatDisplayTime(row.createTime) }}
            </template>
            <template v-else-if="column.prop === 'updateTime'" #default="{ row }">
              {{ formatDisplayTime(row.updateTime) }}
            </template>
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="primary" @click="editPrice(row)"> 编辑 </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="confirmSingleDelete(row, deletePrices)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pricePagination.current"
            v-model:page-size="pricePagination.pageSize"
            :page-sizes="PAGINATION_CONFIG.PAGE_SIZES"
            :total="pricePagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="(size) => changePaginationSize(size, pricePagination, loadPrices)"
            @current-change="
              (current) => changePaginationCurrent(current, pricePagination, loadPrices)
            "
          />
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedPrices.length > 0" class="batch-actions">
          <el-button type="danger" @click="confirmBatchDelete(selectedPrices, deletePrices)">
            批量删除 ({{ selectedPrices.length }})
          </el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑基础物资弹窗 -->
    <el-dialog
      v-model="dialogState.showMaterialDialog"
      :title="
        DIALOG_TITLES[
          dialogState.isEditingMaterial ? DIALOG_TYPES.EDIT_MATERIAL : DIALOG_TYPES.ADD_MATERIAL
        ]
      "
      width="500px"
      @close="resetMaterialForm"
    >
      <el-form ref="materialFormRef" :model="materialForm" :rules="FORM_RULES" label-width="80px">
        <el-form-item label="物资名称" prop="materialName">
          <el-input v-model="materialForm.materialName" placeholder="请输入物资名称" />
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="materialForm.specification" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="materialForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="物资分类" prop="category">
          <el-input v-model="materialForm.category" placeholder="请输入物资分类" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogState.showMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMaterial">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑价格弹窗 -->
    <el-dialog
      v-model="dialogState.showPriceDialog"
      :title="
        DIALOG_TITLES[dialogState.isEditingPrice ? DIALOG_TYPES.EDIT_PRICE : DIALOG_TYPES.ADD_PRICE]
      "
      width="500px"
      @close="resetPriceForm"
    >
      <el-form ref="priceFormRef" :model="priceForm" :rules="FORM_RULES" label-width="80px">
        <el-form-item label="选择物资" prop="materialId">
          <el-select v-model="priceForm.materialId" style="width: 100%" placeholder="请选择物资">
            <el-option
              v-for="material in materialList"
              :key="material.id"
              :label="`${material.materialName} (${material.specification})`"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="季度" prop="quarter">
          <el-select v-model="priceForm.quarter" style="width: 100%">
            <el-option
              v-for="option in SEARCH_FORM_CONFIG.PRICES.quarter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
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
        <el-button @click="dialogState.showPriceDialog = false">取消</el-button>
        <el-button type="primary" @click="savePrice">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="dialogState.showImportDialog"
      :title="DIALOG_TITLES[DIALOG_TYPES.IMPORT]"
      width="500px"
    >
      <el-form :model="importForm" label-width="80px">
        <el-form-item label="季度" required>
          <el-select v-model="importForm.quarter" style="width: 100%">
            <el-option
              v-for="option in SEARCH_FORM_CONFIG.PRICES.quarter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            :accept="IMPORT_FILE_CONFIG.ACCEPT"
            @change="(file) => (importForm.file = file.raw)"
          >
            <el-button>选择Excel文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持{{ IMPORT_FILE_CONFIG.ACCEPT }}格式，文件大小不超过{{
                  IMPORT_FILE_CONFIG.MAX_SIZE
                }}MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="导入模板">
          <el-button @click="downloadTemplate">下载导入模板</el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogState.showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="startImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// 导入常量和工具函数
import {
  TAB_NAMES,
  TAB_CONFIG,
  MATERIAL_COLUMNS,
  PRICE_COLUMNS,
  BUTTON_ACTIONS,
  PAGINATION_CONFIG,
  SEARCH_FORM_CONFIG,
  DIALOG_TYPES,
  DIALOG_TITLES,
  FORM_RULES,
  IMPORT_FILE_CONFIG
} from './constants.js'

import {
  switchTab,
  performMaterialSearch,
  performPriceSearch,
  resetSearchForm,
  changePaginationSize,
  changePaginationCurrent,
  initPagination,
  resetPagination,
  openAddMaterialDialog,
  openEditMaterialDialog,
  openAddPriceDialog,
  openEditPriceDialog,
  openImportDialog,
  confirmSingleDelete,
  confirmBatchDelete,
  onTableSelectionChange,
  exportCurrentData,
  uploadFile,
  formatDisplayTime,
  formatPriceDisplay,
  calculateStats
} from './utils.js'

const router = useRouter()
const authStore = useAuthStore()

// 检查权限
if (!authStore.hasPermission('view_material_management')) {
  ElMessage.error('您没有权限访问此页面')
  router.push('/smart-brain')
}

// 响应式数据
const loading = ref(false)
const currentTab = ref(TAB_NAMES.MATERIALS)

// 表单引用
const materialSearchFormRef = ref(null)
const priceSearchFormRef = ref(null)
const materialFormRef = ref(null)
const priceFormRef = ref(null)

// 对话框状态
const dialogState = reactive({
  showMaterialDialog: false,
  showPriceDialog: false,
  showImportDialog: false,
  isEditingMaterial: false,
  isEditingPrice: false,
  currentMaterial: {},
  currentPrice: {}
})

// 选中项
const selectedMaterials = ref([])
const selectedPrices = ref([])

// 搜索表单
const materialSearchForm = reactive({
  materialName: '',
  specification: '',
  category: ''
})

const priceSearchForm = reactive({
  materialId: '',
  quarter: ''
})

// 分页配置
const materialPagination = reactive(initPagination())
const pricePagination = reactive(initPagination())

// 表单数据
const materialForm = reactive({
  materialName: '',
  specification: '',
  unit: '',
  category: ''
})

const priceForm = reactive({
  materialId: '',
  quarter: '',
  price: 0
})

const importForm = reactive({
  quarter: '',
  file: null
})

// 模拟数据
const materialList = ref([
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
  }
])

const priceList = ref([
  {
    id: 1,
    materialId: 1,
    materialName: '水泥',
    specification: '425#',
    price: 350.0,
    quarter: '2024-Q1',
    createTime: '2024-01-15 10:30:25',
    updateTime: '2024-03-10 14:20:15'
  },
  {
    id: 2,
    materialId: 1,
    materialName: '水泥',
    specification: '425#',
    price: 365.0,
    quarter: '2024-Q2',
    createTime: '2024-04-01 10:30:25',
    updateTime: '2024-06-10 14:20:15'
  },
  {
    id: 3,
    materialId: 2,
    materialName: '钢筋',
    specification: 'HRB400 Φ12',
    price: 4200.0,
    quarter: '2024-Q1',
    createTime: '2024-01-20 09:15:30',
    updateTime: '2024-02-28 16:45:20'
  }
])

// 计算属性 - 过滤后的数据
const filteredMaterialData = computed(() => {
  let filtered = materialList.value

  if (materialSearchForm.materialName) {
    filtered = filtered.filter((item) =>
      item.materialName.includes(materialSearchForm.materialName)
    )
  }

  if (materialSearchForm.specification) {
    filtered = filtered.filter((item) =>
      item.specification.includes(materialSearchForm.specification)
    )
  }

  if (materialSearchForm.category) {
    filtered = filtered.filter((item) => item.category.includes(materialSearchForm.category))
  }

  return filtered
})

const filteredPriceData = computed(() => {
  let filtered = priceList.value

  if (priceSearchForm.materialId) {
    filtered = filtered.filter((item) => item.materialId === priceSearchForm.materialId)
  }

  if (priceSearchForm.quarter) {
    filtered = filtered.filter((item) => item.quarter === priceSearchForm.quarter)
  }

  return filtered
})

// 表格数据（分页后）
const materialTableData = computed(() => {
  const start = (materialPagination.current - 1) * materialPagination.pageSize
  const end = start + materialPagination.pageSize
  return filteredMaterialData.value.slice(start, end)
})

const priceTableData = computed(() => {
  const start = (pricePagination.current - 1) * pricePagination.pageSize
  const end = start + pricePagination.pageSize
  return filteredPriceData.value.slice(start, end)
})

// 当前数据（用于导出）
const currentData = computed(() => {
  return currentTab.value === TAB_NAMES.MATERIALS ? materialTableData.value : priceTableData.value
})

// 统计数据
const materialStats = computed(() => {
  const hasPriceCount = materialList.value.filter((item) => item.priceCount > 0).length
  return {
    totalMaterials: materialList.value.length.toLocaleString(),
    materialWithPrices: hasPriceCount.toLocaleString(),
    lastUpdate: '2024-03-20'
  }
})

const priceStats = computed(() => {
  const filtered = filteredPriceData.value
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
    averagePrice: filtered.length > 0 ? totalPrice / filtered.length : 0,
    lastUpdate: '2024-03-20'
  }
})

// 业务方法
const navigateToSmartBrain = () => {
  router.push('/smart-brain')
}

const loadMaterials = () => {
  loading.value = true
  // 这里应该调用API加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const loadPrices = () => {
  loading.value = true
  // 这里应该调用API加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const loadCurrentTabData = () => {
  if (currentTab.value === TAB_NAMES.MATERIALS) {
    loadMaterials()
  } else {
    loadPrices()
  }
}

const editMaterial = (row) => {
  dialogState.isEditingMaterial = true
  dialogState.currentMaterial = { ...row }
  Object.assign(materialForm, row)
  dialogState.showMaterialDialog = true
}

const editPrice = (row) => {
  dialogState.isEditingPrice = true
  dialogState.currentPrice = { ...row }
  Object.assign(priceForm, row)
  dialogState.showPriceDialog = true
}

const manageMaterialPrices = (row) => {
  priceSearchForm.materialId = row.id
  currentTab.value = TAB_NAMES.PRICES
}

const deleteMaterials = async (ids) => {
  // 模拟删除API调用
  materialList.value = materialList.value.filter((item) => !ids.includes(item.id))
  selectedMaterials.value = []
}

const deletePrices = async (ids) => {
  // 模拟删除API调用
  priceList.value = priceList.value.filter((item) => !ids.includes(item.id))
  selectedPrices.value = []
}

const saveMaterial = () => {
  materialFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogState.isEditingMaterial) {
        // 编辑物资
        const index = materialList.value.findIndex(
          (item) => item.id === dialogState.currentMaterial.id
        )
        if (index > -1) {
          materialList.value[index] = { ...materialList.value[index], ...materialForm }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增物资
        const newMaterial = {
          id: Date.now(),
          ...materialForm,
          priceCount: 0,
          createTime: new Date().toLocaleString('zh-CN'),
          creator: '当前用户'
        }
        materialList.value.unshift(newMaterial)
        ElMessage.success('新增成功')
      }
      dialogState.showMaterialDialog = false
      resetMaterialForm()
    }
  })
}

const savePrice = () => {
  priceFormRef.value.validate((valid) => {
    if (valid) {
      if (dialogState.isEditingPrice) {
        // 编辑价格
        const index = priceList.value.findIndex((item) => item.id === dialogState.currentPrice.id)
        if (index > -1) {
          const material = materialList.value.find((m) => m.id === priceForm.materialId)
          priceList.value[index] = {
            ...priceList.value[index],
            ...priceForm,
            materialName: material?.materialName || '',
            specification: material?.specification || '',
            updateTime: new Date().toLocaleString('zh-CN')
          }
        }
        ElMessage.success('编辑成功')
      } else {
        // 新增价格
        const material = materialList.value.find((m) => m.id === priceForm.materialId)
        const newPrice = {
          id: Date.now(),
          ...priceForm,
          materialName: material?.materialName || '',
          specification: material?.specification || '',
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        priceList.value.unshift(newPrice)
        // 更新物资价格记录数
        if (material) {
          material.priceCount++
        }
        ElMessage.success('新增成功')
      }
      dialogState.showPriceDialog = false
      resetPriceForm()
    }
  })
}

const resetMaterialForm = () => {
  dialogState.isEditingMaterial = false
  dialogState.currentMaterial = {}
  Object.assign(materialForm, {
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
  dialogState.isEditingPrice = false
  dialogState.currentPrice = {}
  Object.assign(priceForm, {
    materialId: '',
    quarter: '',
    price: 0
  })
  if (priceFormRef.value) {
    priceFormRef.value.clearValidate()
  }
}

const downloadTemplate = () => {
  ElMessage.info('模板下载功能待实现')
}

const startImport = () => {
  if (!importForm.file) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  ElMessage.info('导入功能待实现')
  dialogState.showImportDialog = false
}

// 监听筛选数据变化，更新分页总数
watchEffect(() => {
  materialPagination.total = filteredMaterialData.value.length
})

watchEffect(() => {
  pricePagination.total = filteredPriceData.value.length
})

onMounted(() => {
  loadCurrentTabData()
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
  padding: 4px;
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

.price-hint {
  font-size: 12px;
  color: var(--theme-text-tertiary);
  margin-top: 6px;
  font-style: italic;
  opacity: 0.8;
}

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
