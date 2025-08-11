<template>
  <div class="dynamic-table">
    <div class="table-content">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        :height="height"
        style="width: 100%; height: 100%"
        @row-click="onRowClick"
      >
        <!-- 动态生成的数据列 -->
        <el-table-column
          v-for="column in dynamicColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :formatter="column.formatter"
          :show-overflow-tooltip="true"
        >
          <!-- 特殊列类型的自定义渲染 -->
          <template #default="{ row }" v-if="column.type === 'status'">
            <el-tag type="info" size="small">
              {{ row[column.prop] || '-' }}
            </el-tag>
          </template>

          <template #default="{ row }" v-else-if="column.type === 'tag'">
            <el-tag size="small" :type="getTagType(row[column.prop], column.prop)">
              {{ getTagText(row[column.prop], column.prop) }}
            </el-tag>
          </template>

          <template #default="{ row }" v-else-if="column.type === 'contract'">
            <div class="contract-info">
              <div class="contract-name" :title="row[column.prop]">
                {{ row[column.prop] }}
              </div>
            </div>
          </template>

          <template #default="{ row }" v-else-if="column.type === 'currency'">
            <span class="currency-value">
              ¥{{ (row[column.prop] || 0).toLocaleString('zh-CN') }}
            </span>
          </template>
        </el-table-column>

        <!-- 固定操作列 -->
        <el-table-column label="操作" width="180" fixed="right" v-if="showActions">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click.stop="handleViewDetail(row)">
                查看
              </el-button>

              <!-- 项目总览tab才显示关联按钮 -->
              <el-button
                v-if="showLinkButton && needsLinkButton(row)"
                type="warning"
                size="small"
                @click.stop="handleLinkProject(row)"
              >
                关联
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页组件 -->
    <div class="pagination-wrapper" v-if="showPagination && totalCount > 0">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="pageSizes"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="onPageSizeChange"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { needsLinkButton } from '../utils.js'

defineProps({
  // 表格数据
  tableData: {
    type: Array,
    default: () => []
  },

  // 动态列配置
  dynamicColumns: {
    type: Array,
    default: () => []
  },

  // 加载状态
  loading: {
    type: Boolean,
    default: false
  },

  // 表格高度
  height: {
    type: String,
    default: '400px'
  },

  // 是否显示操作列
  showActions: {
    type: Boolean,
    default: true
  },

  // 是否显示关联按钮 (仅项目总览tab)
  showLinkButton: {
    type: Boolean,
    default: false
  },

  // 分页相关
  showPagination: {
    type: Boolean,
    default: true
  },

  currentPage: {
    type: Number,
    default: 1
  },

  pageSize: {
    type: Number,
    default: 20
  },

  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },

  totalCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'view-detail',
  'link-project',
  'row-click',
  'page-change',
  'page-size-change'
])

// 获取标签类型
const getTagType = (value, prop) => {
  if (!value) return 'info'

  // 针对不同字段的特殊处理
  if (prop === 'matchingStatus') {
    const matchingStatusMap = {
      BALANCED: 'success',
      UNRETURNED: 'warning',
      DATA_MISSING: 'danger',
      UNMATCHED: 'danger',
      MATCHED: 'success',
      PARTIAL_MATCHED: 'info',
      1: 'success',
      0: 'warning'
    }
    return matchingStatusMap[value] || 'info'
  }

  if (prop === 'linkStatus') {
    return value === '已关联' ? 'success' : 'warning'
  }

  if (prop === 'materialStatus') {
    const materialStatusMap = {
      已交付: 'success',
      运输中: 'primary',
      待发货: 'warning',
      施工中: 'primary',
      已完成: 'success',
      安装中: 'primary',
      待确定: 'info'
    }
    return materialStatusMap[value] || 'info'
  }

  if (prop === 'projectStatus') {
    const projectStatusMap = {
      进行中: 'primary',
      已完成: 'success',
      即将完成: 'warning',
      暂停: 'info',
      延期: 'danger',
      待开始: 'info'
    }
    return projectStatusMap[value] || 'info'
  }

  // 默认状态映射
  const statusMap = {
    执行中: 'success',
    待执行: 'warning',
    已完成: 'success',
    已暂停: 'info',
    已取消: 'danger',
    已关联: 'success',
    未关联: 'warning'
  }

  return statusMap[value] || 'primary'
}

// 获取标签文本
const getTagText = (value, prop) => {
  if (!value) return '-'

  // 针对匹配状态的特殊处理
  if (prop === 'matchingStatus') {
    const statusTextMap = {
      BALANCED: '已对平',
      UNRETURNED: '未退库',
      DATA_MISSING: '数据缺失',
      UNMATCHED: '异常',
      MATCHED: '已匹配',
      PARTIAL_MATCHED: '部分匹配',
      1: '已对平',
      0: '未退库'
    }
    return statusTextMap[value] || value
  }

  return value
}

// 事件处理函数
const handleViewDetail = (row) => {
  emit('view-detail', row)
}

const handleLinkProject = (row) => {
  emit('link-project', row)
}

const onRowClick = (row) => {
  emit('row-click', row)
}

const onPageChange = (page) => {
  emit('page-change', page)
}

const onPageSizeChange = (size) => {
  emit('page-size-change', size)
}
</script>

<style scoped>
.dynamic-table {
  background: var(--theme-bg-card);
  border-radius: 12px;
  overflow: auto;
  box-shadow: var(--theme-shadow-light);
  border: 1px solid var(--theme-border-light);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.pagination-wrapper {
  padding: 20px 30px;
  display: flex;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.01), rgba(var(--theme-primary-rgb), 0.005));
  border-top: 1px solid var(--theme-border-light);
  flex-shrink: 0;
}

/* Element Plus 表格样式覆盖 - 适配主题系统 */
:deep(.el-table) {
  background: var(--theme-bg-card);
  color: var(--theme-text-primary);
  border: none;
  flex: 1;
  overflow: auto;
}

:deep(.el-table__header-wrapper th) {
  background: var(--theme-table-header-bg);
  color: var(--theme-primary);
  font-weight: 600;
  font-size: 15px;
  border-color: var(--theme-table-border);
  padding: 14px 0;
  text-shadow: none;
}

:deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: var(--theme-text-primary);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: var(--theme-table-hover-bg) !important;
  box-shadow: var(--theme-shadow-light);
}

:deep(.el-table__cell) {
  border-right: 1px solid var(--theme-table-border);
  border-bottom: 1px solid var(--theme-table-border);
  padding: 10px 12px;
  text-align: center;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(var(--theme-primary-rgb), 0.02);
}

/* 操作按钮样式 */
:deep(.action-buttons .el-button) {
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  padding: 6px 12px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

:deep(.action-buttons .el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.action-buttons .el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary-dark), var(--theme-primary));
  border: none;
  color: white;
}

:deep(.action-buttons .el-button--warning) {
  background: linear-gradient(135deg, var(--theme-warning-dark), var(--theme-warning));
  border: none;
  color: white;
}
:deep(.table-content) {
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}
/* 合同信息显示样式 */
.contract-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.contract-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--theme-text-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}


/* 货币值样式 */
.currency-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-success);
  background: rgba(var(--theme-success-rgb), 0.08);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(var(--theme-success-rgb), 0.2);
}

/* 标签样式 */
:deep(.el-tag) {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
}

:deep(.el-tag--success) {
  background-color: rgba(var(--theme-success-rgb), 0.1);
  border-color: rgba(var(--theme-success-rgb), 0.25);
  color: var(--theme-success);
}

:deep(.el-tag--warning) {
  background-color: rgba(var(--theme-warning-rgb), 0.1);
  border-color: rgba(var(--theme-warning-rgb), 0.25);
  color: var(--theme-warning);
}

:deep(.el-tag--danger) {
  background-color: rgba(var(--theme-error-rgb), 0.1);
  border-color: rgba(var(--theme-error-rgb), 0.25);
  color: var(--theme-error);
}

:deep(.el-tag--primary) {
  background-color: rgba(var(--theme-primary-rgb), 0.1);
  border-color: rgba(var(--theme-primary-rgb), 0.2);
  color: var(--theme-primary);
}

/* 分页组件样式 - 现代化分页样式 */
:deep(.el-pagination) {
  color: var(--theme-text-primary);
  font-weight: 500;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background: var(--theme-bg-card);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-light);
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .btn-prev:hover) {
  background: var(--theme-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--theme-primary-rgb), 0.3);
}

:deep(.el-pagination .el-pager li) {
  background: var(--theme-bg-card);
  color: var(--theme-text-primary);
  border: 1px solid var(--theme-border-light);
  border-radius: 6px;
  margin: 0 2px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li:hover) {
  background: rgba(var(--theme-primary-rgb), 0.08);
  color: var(--theme-primary);
  transform: translateY(-1px);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--theme-primary);
  color: white;
  border-color: var(--theme-primary);
  box-shadow: 0 4px 8px rgba(var(--theme-primary-rgb), 0.4);
}

:deep(.el-pagination .el-pagination__sizes .el-select) {
  margin-right: 8px;
}

:deep(.el-pagination .el-pagination__sizes .el-input__wrapper) {
  border: 1px solid var(--theme-border-light);
  border-radius: 6px;
  background: var(--theme-bg-card);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 6px;
  }

  .pagination-wrapper {
    padding: 16px 20px;
  }

  :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }

  :deep(.el-table__row) {
    height: auto;
    min-height: 50px;
  }

  :deep(.el-table__cell) {
    padding: 8px 6px;
    font-size: 13px;
  }

  :deep(.action-buttons .el-button) {
    font-size: 12px;
    padding: 5px 10px;
  }
}

@media (max-width: 480px) {
  .pagination-wrapper {
    padding: 12px 16px;
  }

  :deep(.el-table__cell) {
    padding: 6px 4px;
    font-size: 12px;
  }

  :deep(.action-buttons .el-button) {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>
