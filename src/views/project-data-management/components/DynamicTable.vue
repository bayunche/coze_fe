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
  /* 继承父级的设计变量 */
  --primary-color: #4f46e5;
  --accent-color: #3730a3;
  --card-background: #ffffff;
  --border-color: rgba(79, 70, 229, 0.08);
  --text-dark: #1e293b;
  --text-light: #64748b;
  --shadow-color: rgba(79, 70, 229, 0.06);

  background: var(--card-background);
  border-radius: 12px;
  overflow: auto;
  box-shadow: 0 8px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
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
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.005), rgba(79, 70, 229, 0.002));
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* Element Plus 表格样式覆盖 - 采用与OwnerMaterialAlignPage相同的样式 */
:deep(.el-table) {
  background: var(--card-background);
  color: var(--text-dark);
  border: none;
  height: 100%;
}

:deep(.el-table__header-wrapper th) {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  color: var(--accent-color);
  font-weight: 600;
  font-size: 15px;
  border-color: rgba(0, 0, 0, 0.05);
  padding: 14px 0;
  text-shadow: none;
}

:deep(.el-table__row) {
  height: 60px;
  font-size: 14px;
  color: var(--text-dark);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

:deep(.el-table__row:hover) {
  background-color: rgba(79, 70, 229, 0.015) !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.04);
}

:deep(.el-table__cell) {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 10px 12px;
  text-align: center;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(79, 70, 229, 0.008);
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
  background: linear-gradient(135deg, var(--accent-color), var(--primary-color));
  border: none;
  color: white;
}

:deep(.action-buttons .el-button--warning) {
  background: linear-gradient(135deg, #dc6803, #ea580c);
  border: none;
  color: white;
}
:deep(.table-content) {
  overflow: auto;
  height: calc(40vh - 100px);
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
  color: var(--text-dark);
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
  color: var(--success-color);
  background: rgba(13, 148, 136, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(13, 148, 136, 0.15);
}

/* 标签样式 */
:deep(.el-tag) {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(79, 70, 229, 0.15);
}

:deep(.el-tag--success) {
  background-color: rgba(13, 148, 136, 0.08);
  border-color: rgba(13, 148, 136, 0.2);
  color: #0d9488;
}

:deep(.el-tag--warning) {
  background-color: rgba(220, 104, 3, 0.08);
  border-color: rgba(220, 104, 3, 0.2);
  color: #dc6803;
}

:deep(.el-tag--danger) {
  background-color: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.2);
  color: #dc2626;
}

:deep(.el-tag--primary) {
  background-color: rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.15);
  color: var(--accent-color);
}

/* 分页组件样式 - 现代化分页样式 */
:deep(.el-pagination) {
  color: var(--text-dark);
  font-weight: 500;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background: var(--card-background);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .btn-next:hover),
:deep(.el-pagination .btn-prev:hover) {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
}

:deep(.el-pagination .el-pager li) {
  background: var(--card-background);
  color: var(--text-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin: 0 2px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li:hover) {
  background: rgba(79, 70, 229, 0.05);
  color: var(--accent-color);
  transform: translateY(-1px);
}

:deep(.el-pagination .el-pager li.is-active) {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
}

:deep(.el-pagination .el-pagination__sizes .el-select) {
  margin-right: 8px;
}

:deep(.el-pagination .el-pagination__sizes .el-input__wrapper) {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-background);
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
