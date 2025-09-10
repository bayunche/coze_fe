<template>
  <div :class="CSS_CLASSES.PAGE_CONTAINER">
    <!-- 页面头部 -->
    <div :class="CSS_CLASSES.PAGE_HEADER">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Setting /></el-icon>
          {{ PAGE_CONFIG.title }}
        </h1>
        <p class="page-subtitle">{{ PAGE_CONFIG.subtitle }}</p>
      </div>
      <div class="header-right">
        <el-button 
          :icon="ArrowLeft" 
          @click="handleBackToSmartBrain"
        >
          返回智能大脑
        </el-button>
        <el-button 
          :icon="Refresh" 
          @click="handleRefresh"
          :loading="loading"
        >
          {{ BUTTON_CONFIG.REFRESH.text }}
        </el-button>
        <el-button 
          :icon="Upload" 
          @click="handleImport"
          :type="BUTTON_CONFIG.IMPORT.type"
        >
          {{ BUTTON_CONFIG.IMPORT.text }}
        </el-button>
        <el-button 
          :icon="Download" 
          @click="handleExport"
          :type="BUTTON_CONFIG.EXPORT.type"
        >
          {{ BUTTON_CONFIG.EXPORT.text }}
        </el-button>
        <el-button 
          :icon="Plus" 
          @click="handleCreateField"
          type="primary"
        >
          {{ BUTTON_CONFIG.CREATE_FIELD.text }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div :class="CSS_CLASSES.STATS_SECTION">
      <div 
        v-for="card in STATS_CARDS" 
        :key="card.key"
        class="stat-card clickable-card"
        :class="{ 'active': activeFilter === card.filterType }"
        :style="{ 
          '--card-color': card.color,
          '--card-bg-color': card.bgColor
        }"
        @click="handleCardClick(card)"
      >
        <div class="stat-icon">
          <el-icon :size="24">
            <component :is="iconMap[card.icon]" />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics[card.key] || 0 }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
        <!-- 选中状态指示器 -->
        <div v-if="activeFilter === card.filterType" class="active-indicator">
          <el-icon><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div :class="CSS_CLASSES.FILTER_SECTION">
      <div class="filter-row">
        <!-- 搜索框 -->
        <el-input
          v-model="filters.keyword"
          placeholder="搜索字段名称、字段编码、描述..."
          clearable
          class="search-input"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 字段类型筛选 -->
        <el-select
          v-model="filters.fieldType"
          placeholder="选择字段类型"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="option in FILTER_OPTIONS.fieldType"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 状态筛选 -->
        <el-select
          v-model="filters.status"
          placeholder="选择状态"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="option in FILTER_OPTIONS.status"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 合同类型筛选 -->
        <el-select
          v-model="filters.contractType"
          placeholder="选择合同类型"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="option in FILTER_OPTIONS.contractType"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 必填筛选 -->
        <el-select
          v-model="filters.isRequired"
          placeholder="是否必填"
          clearable
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option
            v-for="option in FILTER_OPTIONS.isRequired"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <!-- 筛选状态显示 -->
        <div class="filter-status" v-if="activeFilter">
          <el-tag type="primary" closable @close="clearFilter">
            筛选: {{ getFilterLabel(activeFilter) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 批量操作区域 -->
    <div :class="CSS_CLASSES.BATCH_ACTIONS" v-if="selectedRows.length > 0">
      <span class="selection-info">
        已选择 <strong>{{ selectedRows.length }}</strong> 个字段
      </span>
      <div class="action-buttons">
        <el-button
          :type="BUTTON_CONFIG.BATCH_ENABLE.type"
          :icon="CircleCheck"
          @click="handleBatchEnable"
          :disabled="selectedRows.length === 0"
        >
          {{ BUTTON_CONFIG.BATCH_ENABLE.text }}
        </el-button>
        <el-button
          :type="BUTTON_CONFIG.BATCH_DISABLE.type"
          :icon="CircleClose"
          @click="handleBatchDisable"
          :disabled="selectedRows.length === 0"
        >
          {{ BUTTON_CONFIG.BATCH_DISABLE.text }}
        </el-button>
        <el-button
          :type="BUTTON_CONFIG.BATCH_DELETE.type"
          :icon="Delete"
          @click="handleBatchDelete"
          :disabled="selectedRows.length === 0"
        >
          {{ BUTTON_CONFIG.BATCH_DELETE.text }}
        </el-button>
        <el-button
          @click="clearSelection"
          :icon="Close"
        >
          清除选择
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div :class="CSS_CLASSES.TABLE_SECTION">
      <el-table
        :data="paginatedData"
        v-loading="loading"
        :element-loading-text="DEFAULT_VALUES.LOADING_TEXT"
        stripe
        border
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        empty-text="暂无字段数据"
      >
        <!-- 选择列 -->
        <el-table-column type="selection" width="55" />
        
        <!-- 字段名称 -->
        <el-table-column
          prop="fieldName"
          :label="TABLE_COLUMNS.fieldInfo.fieldName.label"
          :min-width="TABLE_COLUMNS.fieldInfo.fieldName.minWidth"
          :show-overflow-tooltip="TABLE_COLUMNS.fieldInfo.fieldName.showOverflowTooltip"
          sortable
        >
          <template #default="{ row }">
            <div class="field-name-cell">
              <el-tag v-if="row.isRequired" type="warning" size="small" class="required-tag">必填</el-tag>
              <span class="field-name">{{ row.fieldName }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 字段编码 -->
        <el-table-column
          prop="fieldCode"
          :label="TABLE_COLUMNS.fieldInfo.fieldCode.label"
          :width="TABLE_COLUMNS.fieldInfo.fieldCode.width"
          :show-overflow-tooltip="TABLE_COLUMNS.fieldInfo.fieldCode.showOverflowTooltip"
          sortable
        >
          <template #default="{ row }">
            <code class="field-code">{{ row.fieldCode }}</code>
          </template>
        </el-table-column>

        <!-- 字段类型 -->
        <el-table-column
          prop="fieldType"
          :label="TABLE_COLUMNS.fieldInfo.fieldType.label"
          :width="TABLE_COLUMNS.fieldInfo.fieldType.width"
          :align="TABLE_COLUMNS.fieldInfo.fieldType.align"
          sortable
        >
          <template #default="{ row }">
            <el-tag 
              :type="formatFieldType(row.fieldType).type"
              size="small"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="iconMap[formatFieldType(row.fieldType).icon]" />
              </el-icon>
              {{ formatFieldType(row.fieldType).label }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 所属合同类型 -->
        <el-table-column
          prop="contractType"
          :label="TABLE_COLUMNS.fieldInfo.contractType.label"
          :width="TABLE_COLUMNS.fieldInfo.contractType.width"
          :align="TABLE_COLUMNS.fieldInfo.contractType.align"
          sortable
        >
          <template #default="{ row }">
            <el-tag 
              :type="formatContractType(row.contractType).type"
              :color="formatContractType(row.contractType).color"
              size="small"
            >
              {{ formatContractType(row.contractType).label }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 字段描述 -->
        <el-table-column
          prop="description"
          :label="TABLE_COLUMNS.fieldInfo.description.label"
          :min-width="TABLE_COLUMNS.fieldInfo.description.minWidth"
          :show-overflow-tooltip="TABLE_COLUMNS.fieldInfo.description.showOverflowTooltip"
        >
          <template #default="{ row }">
            <span class="description-text">{{ row.description || DEFAULT_VALUES.EMPTY_TEXT }}</span>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column
          prop="isEnabled"
          :label="TABLE_COLUMNS.fieldConfig.isEnabled.label"
          :width="TABLE_COLUMNS.fieldConfig.isEnabled.width"
          :align="TABLE_COLUMNS.fieldConfig.isEnabled.align"
          sortable
        >
          <template #default="{ row }">
            <el-tag 
              :type="formatFieldStatus(row.isEnabled).type"
              size="small"
            >
              <el-icon style="margin-right: 4px;">
                <component :is="iconMap[formatFieldStatus(row.isEnabled).icon]" />
              </el-icon>
              {{ formatFieldStatus(row.isEnabled).label }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 显示顺序 -->
        <el-table-column
          prop="displayOrder"
          :label="TABLE_COLUMNS.fieldConfig.displayOrder.label"
          :width="TABLE_COLUMNS.fieldConfig.displayOrder.width"
          :align="TABLE_COLUMNS.fieldConfig.displayOrder.align"
          sortable
        />

        <!-- 创建时间 -->
        <el-table-column
          prop="createTime"
          :label="TABLE_COLUMNS.timeInfo.createTime.label"
          :width="TABLE_COLUMNS.timeInfo.createTime.width"
          sortable
        >
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createTime) }}</span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          :label="TABLE_COLUMNS.actions.actions.label"
          :width="TABLE_COLUMNS.actions.actions.width"
          :fixed="TABLE_COLUMNS.actions.actions.fixed"
          :align="TABLE_COLUMNS.actions.actions.align"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                :type="BUTTON_CONFIG.EDIT.type"
                :size="BUTTON_CONFIG.EDIT.size"
                @click="handleEditField(row)"
              >
                {{ BUTTON_CONFIG.EDIT.text }}
              </el-button>
              <el-button
                :type="BUTTON_CONFIG.TOGGLE.type"
                :size="BUTTON_CONFIG.TOGGLE.size"
                @click="handleToggleStatus(row)"
              >
                {{ row.isEnabled === FIELD_STATUS.ENABLED ? '停用' : '启用' }}
              </el-button>
              <el-button
                :type="BUTTON_CONFIG.DELETE.type"
                :size="BUTTON_CONFIG.DELETE.size"
                @click="handleDeleteField(row)"
              >
                {{ BUTTON_CONFIG.DELETE.text }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

  
    </div>
    <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="PAGINATION_CONFIG.pageSizes"
          :layout="PAGINATION_CONFIG.layout"
          :total="filteredData.length"
          :background="PAGINATION_CONFIG.background"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="fieldFormRef"
        :model="fieldForm"
        :rules="FORM_RULES"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="字段名称" prop="fieldName">
          <el-input
            v-model="fieldForm.fieldName"
            placeholder="请输入字段名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="字段编码" prop="fieldCode">
          <el-input
            v-model="fieldForm.fieldCode"
            placeholder="请输入字段编码（如：contractNo）"
            maxlength="30"
            :disabled="isEditMode"
          />
          <div class="form-tip">字段编码必须以字母开头，只能包含字母、数字和下划线</div>
        </el-form-item>
        
        <el-form-item label="字段类型" prop="fieldType">
          <el-select v-model="fieldForm.fieldType" placeholder="请选择字段类型" style="width: 100%">
            <el-option
              v-for="option in FILTER_OPTIONS.fieldType.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="option-item">
                <el-icon style="margin-right: 8px;">
                  <component :is="iconMap[formatFieldType(option.value).icon]" />
                </el-icon>
                {{ option.label }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="合同类型" prop="contractType">
          <el-select v-model="fieldForm.contractType" placeholder="请选择合同类型" style="width: 100%">
            <el-option
              v-for="option in FILTER_OPTIONS.contractType.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="option-item" :style="{ color: formatContractType(option.value).color }">
                {{ option.label }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="字段描述" prop="description">
          <el-input
            v-model="fieldForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入字段描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="默认值">
          <el-input
            v-model="fieldForm.defaultValue"
            placeholder="请输入默认值（可选）"
          />
        </el-form-item>
        
        <el-form-item label="显示顺序" prop="displayOrder">
          <el-input-number
            v-model="fieldForm.displayOrder"
            :min="0"
            :max="9999"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="字段配置">
          <el-checkbox v-model="fieldForm.isRequired">必填字段</el-checkbox>
          <el-checkbox v-model="fieldForm.isEnabled" :true-value="FIELD_STATUS.ENABLED" :false-value="FIELD_STATUS.DISABLED">启用字段</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitField" :loading="submitting">
            {{ isEditMode ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入字段配置"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".json"
        :on-change="handleFileChange"
        drag
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将JSON配置文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传JSON格式的配置文件
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmImport" :loading="importing">
            导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Refresh,
  Plus,
  Download,
  Upload,
  Search,
  Check,
  Close,
  CircleCheck,
  CircleClose,
  Delete,
  Setting,
  UploadFilled,
  // 字段类型图标
  Document,
  Calendar,
  Switch,
  List,
  Grid,
  QuestionFilled,
  // 统计卡片图标
  DataAnalysis,
  Star
} from '@element-plus/icons-vue'

// 导入常量和工具函数
import {
  PAGE_CONFIG,
  FIELD_STATUS,
  CSS_CLASSES,
  BUTTON_CONFIG,
  FILTER_OPTIONS,
  TABLE_COLUMNS,
  PAGINATION_CONFIG,
  FORM_RULES,
  DEFAULT_VALUES,
  STATS_CARDS,
  MESSAGE_CONFIG
} from './constants.js'

import {
  handleSearch as performSearch,
  handleSort,
  resetPagination,
  confirmDelete,
  toggleFieldStatus,
  exportFieldConfig,
  importFieldConfig,
  calculateStatistics,
  getFilterLabel,
  isFieldCodeDuplicate,
  formatTime,
  formatFieldType,
  formatFieldStatus,
  formatContractType,
  generateDisplayOrder,
  generateFieldId
} from './utils.js'

// 导入服务
import ContractFieldService from '@/services/ContractFieldService.js'

// 图标映射
const iconMap = {
  ArrowLeft,
  Refresh,
  Plus,
  Download,
  Upload,
  Search,
  Check,
  Close,
  CircleCheck,
  CircleClose,
  Delete,
  Document,
  Calendar,
  Switch,
  List,
  Grid,
  QuestionFilled,
  DataAnalysis,
  Star
}

// 路由
const router = useRouter()

// 页面状态
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)

// 数据相关
const fieldList = ref([])
const selectedRows = ref([])

// 筛选和搜索
const filters = reactive({
  keyword: '',
  fieldType: '',
  contractType: '',
  status: '',
  isRequired: ''
})
const activeFilter = ref('')

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: PAGINATION_CONFIG.defaultPageSize
})

// 排序
const sortConfig = reactive({
  field: '',
  order: ''
})

// 对话框状态
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const fieldFormRef = ref()
const uploadRef = ref()

// 表单数据
const fieldForm = reactive({ ...DEFAULT_VALUES.FIELD_FORM })
const isEditMode = ref(false)
const importFile = ref(null)

// 计算属性
const filteredData = computed(() => {
  let data = performSearch(fieldList.value, filters)
  
  // 应用卡片筛选
  if (activeFilter.value !== '') {
    if (activeFilter.value === 'required') {
      data = data.filter(item => item.isRequired === true)
    } else if (typeof activeFilter.value === 'number') {
      data = data.filter(item => item.isEnabled === activeFilter.value)
    }
  }
  
  // 应用排序
  if (sortConfig.field) {
    data = handleSort(data, sortConfig.field, sortConfig.order)
  }
  
  return data
})

const paginatedData = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const statistics = computed(() => {
  return calculateStatistics(fieldList.value)
})

const dialogTitle = computed(() => {
  return isEditMode.value ? '编辑字段' : '新增字段'
})

// 服务实例
const contractFieldService = new ContractFieldService()

// 页面方法
const loadData = async () => {
  loading.value = true
  try {
    const response = await contractFieldService.getFieldList()
    fieldList.value = response.data?.list || response.data || []
  } catch (error) {
    console.error('加载字段列表失败:', error)
    ElMessage.error('加载字段列表失败')
  } finally {
    loading.value = false
  }
}

const handleBackToSmartBrain = () => {
  router.push('/smart-brain')
}

const handleRefresh = () => {
  loadData()
}

const handleCreateField = () => {
  isEditMode.value = false
  Object.assign(fieldForm, {
    ...DEFAULT_VALUES.FIELD_FORM,
    displayOrder: generateDisplayOrder(fieldList.value)
  })
  dialogVisible.value = true
}

const handleEditField = (row) => {
  isEditMode.value = true
  Object.assign(fieldForm, { ...row })
  dialogVisible.value = true
}

const handleDeleteField = async (row) => {
  await confirmDelete(
    `确定要删除字段"${row.fieldName}"吗？删除后不可恢复！`,
    async () => {
      try {
        await contractFieldService.deleteField(row.id)
        ElMessage.success(MESSAGE_CONFIG.DELETE_SUCCESS)
        await loadData()
      } catch (error) {
        console.error('删除字段失败:', error)
        ElMessage.error(MESSAGE_CONFIG.DELETE_ERROR)
      }
    }
  )
}

const handleToggleStatus = async (row) => {
  await toggleFieldStatus(row, async (updatedField) => {
    await contractFieldService.updateField(updatedField.id, updatedField)
    await loadData()
  })
}

const handleSubmitField = async () => {
  if (!fieldFormRef.value) return
  
  try {
    await fieldFormRef.value.validate()
    
    // 检查字段编码重复
    if (isFieldCodeDuplicate(fieldForm.fieldCode, fieldList.value, isEditMode.value ? fieldForm.id : null)) {
      ElMessage.error(MESSAGE_CONFIG.FIELD_CODE_DUPLICATE)
      return
    }
    
    submitting.value = true
    
    if (isEditMode.value) {
      // 更新字段
      const updateData = {
        ...fieldForm,
        updateTime: new Date().toLocaleString()
      }
      await contractFieldService.updateField(fieldForm.id, updateData)
      ElMessage.success(MESSAGE_CONFIG.UPDATE_SUCCESS)
    } else {
      // 创建字段
      const createData = {
        ...fieldForm,
        id: generateFieldId(),
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }
      await contractFieldService.createField(createData)
      ElMessage.success(MESSAGE_CONFIG.CREATE_SUCCESS)
    }
    
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('提交字段失败:', error)
    if (error.message !== 'validation failed') {
      ElMessage.error(isEditMode.value ? MESSAGE_CONFIG.UPDATE_ERROR : MESSAGE_CONFIG.CREATE_ERROR)
    }
  } finally {
    submitting.value = false
  }
}

// 筛选和搜索相关方法
const handleSearch = () => {
  resetPagination(pagination)
}

const handleFilterChange = () => {
  resetPagination(pagination)
}

const handleCardClick = (card) => {
  if (activeFilter.value === card.filterType) {
    activeFilter.value = ''
  } else {
    activeFilter.value = card.filterType
  }
  resetPagination(pagination)
}

const clearFilter = () => {
  activeFilter.value = ''
  resetPagination(pagination)
}

// 表格相关方法
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSortChange = ({ prop, order }) => {
  sortConfig.field = prop
  sortConfig.order = order
}

const clearSelection = () => {
  selectedRows.value = []
}

// 分页相关方法
const handlePageChange = (page) => {
  pagination.currentPage = page
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  resetPagination(pagination)
}

// 批量操作方法
const handleBatchEnable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return
  }
  
  try {
    const updatePromises = selectedRows.value.map(row => 
      contractFieldService.updateField(row.id, {
        ...row,
        isEnabled: FIELD_STATUS.ENABLED,
        updateTime: new Date().toLocaleString()
      })
    )
    
    await Promise.all(updatePromises)
    ElMessage.success(MESSAGE_CONFIG.BATCH_ENABLE_SUCCESS)
    clearSelection()
    await loadData()
  } catch (error) {
    console.error('批量启用失败:', error)
    ElMessage.error('批量启用失败')
  }
}

const handleBatchDisable = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return
  }
  
  try {
    const updatePromises = selectedRows.value.map(row => 
      contractFieldService.updateField(row.id, {
        ...row,
        isEnabled: FIELD_STATUS.DISABLED,
        updateTime: new Date().toLocaleString()
      })
    )
    
    await Promise.all(updatePromises)
    ElMessage.success(MESSAGE_CONFIG.BATCH_DISABLE_SUCCESS)
    clearSelection()
    await loadData()
  } catch (error) {
    console.error('批量停用失败:', error)
    ElMessage.error('批量停用失败')
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning(MESSAGE_CONFIG.NO_SELECTION)
    return
  }
  
  await confirmDelete(
    MESSAGE_CONFIG.CONFIRM_BATCH_DELETE,
    async () => {
      try {
        const deletePromises = selectedRows.value.map(row => 
          contractFieldService.deleteField(row.id)
        )
        
        await Promise.all(deletePromises)
        ElMessage.success(MESSAGE_CONFIG.BATCH_DELETE_SUCCESS)
        clearSelection()
        await loadData()
      } catch (error) {
        console.error('批量删除失败:', error)
        ElMessage.error('批量删除失败')
      }
    }
  )
}

// 导入导出方法
const handleExport = () => {
  exportFieldConfig(fieldList.value)
}

const handleImport = () => {
  importDialogVisible.value = true
  importFile.value = null
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const handleConfirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的配置文件')
    return
  }
  
  importing.value = true
  try {
    const config = await importFieldConfig(importFile.value)
    
    // 导入字段
    for (const fieldData of config.fields) {
      const newField = {
        ...fieldData,
        id: generateFieldId(),
        createTime: new Date().toLocaleString(),
        updateTime: new Date().toLocaleString()
      }
      
      // 检查字段编码重复
      if (!isFieldCodeDuplicate(newField.fieldCode, fieldList.value)) {
        await contractFieldService.createField(newField)
      }
    }
    
    ElMessage.success(MESSAGE_CONFIG.IMPORT_SUCCESS)
    importDialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('导入配置失败:', error)
    ElMessage.error(error.message || MESSAGE_CONFIG.IMPORT_ERROR)
  } finally {
    importing.value = false
  }
}

// 页面初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.contract-field-management-page {
  min-height: 100vh;
  background-color: var(--theme-bg-secondary);
  padding: 20px;
}

/* 页面头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 20px;
  background-color: var(--theme-bg-primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--theme-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 28px;
  color: var(--theme-primary);
}

.page-subtitle {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* 统计卡片样式 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: var(--theme-bg-primary);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: var(--card-color);
}

.stat-card.clickable-card {
  cursor: pointer;
}

.stat-card.clickable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-card.active {
  border: 2px solid var(--card-color);
  background-color: var(--card-bg-color);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--card-bg-color);
  color: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
}

.active-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--card-color);
  font-size: 16px;
}

/* 筛选区域样式 */
.filter-section {
  background-color: var(--theme-bg-primary);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  min-width: 300px;
  flex: 1;
}

.filter-select {
  min-width: 150px;
}

.filter-status {
  margin-left: auto;
}

/* 批量操作区域样式 */
.batch-actions {
  background-color: var(--theme-primary);
  background-image: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-light) 100%);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.2);
}

.selection-info {
  color: white;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 表格区域样式 */
.table-section {
  background-color: var(--theme-bg-primary);
  border-radius: 8px;
  padding: 20px;
  height: 40vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 表格单元格样式 */
.field-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name {
  font-weight: 500;
}

.required-tag {
  font-size: 12px;
  font-weight: normal;
}

.field-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background-color: var(--theme-bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--theme-primary);
}

.description-text {
  color: var(--theme-text-secondary);
  line-height: 1.4;
}

.time-text {
  color: var(--theme-text-secondary);
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-tip {
  font-size: 12px;
  color: var(--theme-text-secondary);
  margin-top: 4px;
}

.option-item {
  display: flex;
  align-items: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .stats-section {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input,
  .filter-select {
    min-width: auto;
  }

  .filter-status {
    margin-left: 0;
    margin-top: 8px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .action-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>