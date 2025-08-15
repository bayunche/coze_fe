<template>
  <el-dialog
    v-model="showResultDetail"
    title="合同解析结果详情"
    width="80%"
    custom-class="result-detail-dialog"
    append-to-body
  >
    <div v-loading="isFetchingDetails" class="result-detail-content">
      <el-table
        v-if="tableData && tableData.length > 0"
        :data="editFormModels"
        style="width: 100%"
        stripe
        class="result-table"
        max-height="60vh"
        :header-cell-style="{ background: 'var(--theme-table-header-bg)', color: 'var(--theme-text-primary)' }"
      >
        <template v-for="column in tableColumns" :key="column.prop">
          <el-table-column
            v-if="parsingResultStore.translateHeader(column.prop) !== column.prop"
            :prop="column.prop"
            :label="parsingResultStore.translateHeader(column.prop)"
          >
            <template #default="scope">
              <span v-if="!scope.row.editing">{{
                parsingResultStore.formatCellValue(scope.row[column.prop], column.prop)
              }}</span>
              <template v-else>
                <div v-if="parsingResultStore.isLongText(scope.row[column.prop])">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="parsingResultStore.openEditPopup(scope.row, column.prop)"
                  >
                    编辑长文本
                  </el-button>
                </div>
                <el-input
                  v-else
                  v-model="scope.row[column.prop]"
                  :placeholder="`请输入${parsingResultStore.translateHeader(column.prop)}`"
                ></el-input>
              </template>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.editing" class="button-group">
              <el-button
                type="success"
                size="small"
                @click="parsingResultStore.saveRowEdit(scope.row)"
                >暂存</el-button
              >
              <el-button
                type="primary"
                size="small"
                @click="parsingResultStore.saveAndConfirmRowEdit(scope.row)"
                :loading="savingRowConfirm[scope.row.id]"
                >确认</el-button
              >
              <el-button size="small" @click="parsingResultStore.cancelRowEdit(scope.row)"
                >取消</el-button
              >
            </div>
            <div v-else class="button-group">
              <el-button
                type="primary"
                size="small"
                @click="parsingResultStore.startRowEdit(scope.row)"
                >编辑</el-button
              >
              <el-tag 
                v-if="scope.row.resultStatus === 1" 
                type="success" 
                size="small"
                >已确认</el-tag>
              <el-tag 
                v-else 
                type="warning" 
                size="small"
                >待确认</el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="!isFetchingDetails" description="没有可展示的表格数据" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showResultDetail = false">关闭</el-button>
        <el-button
          type="primary"
          @click="parsingResultStore.saveAll"
          :loading="savingAllEdits"
          >批量提交修改</el-button
        >
        <el-button 
          type="success" 
          @click="parsingResultStore.confirm"
          :loading="isConfirming"
          >批量确认</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { useParsingResultStore } from '@/stores/parsingResult'
import { watch, toRefs, ref } from 'vue'

const parsingResultStore = useParsingResultStore()
const {
  showResultDetail,
  tableColumns,
  tableData, // 将 tableData 也通过 toRefs 解构
  editFormModels,
  isFetchingDetails,
  savingAllEdits,
  isConfirming
} = toRefs(parsingResultStore)

// 单行确认加载状态
const savingRowConfirm = ref({})

// 监听 showResultDetail 的变化，当它变为 true 时调用 handleViewResultDetail
watch(
  showResultDetail,
  async (newValue) => {
    if (newValue) {
      await parsingResultStore.viewResultDetail()
      // 在数据加载完成后添加诊断日志
      console.log('【诊断】ResultDetailTableDialog - tableColumns:', tableColumns.value)
      console.log('【诊断】ResultDetailTableDialog - tableData:', parsingResultStore.tableData)
    }
  },
  { immediate: false } // 初始不立即执行
)
</script>

<script>
export default {
  name: 'ResultDetailTableDialog'
}
</script>

<style>
/* 对话框主题样式 */
.result-detail-dialog .el-dialog__body {
  padding: 20px;
  background: var(--theme-dialog-bg);
  color: var(--theme-text-primary);
}

.result-detail-dialog .el-dialog__header {
  border-bottom: 1px solid var(--theme-dialog-border);
  padding: 16px 20px;
  background: var(--theme-dialog-header-bg);
  color: var(--theme-text-primary);
}

.result-detail-dialog .el-dialog__title {
  font-weight: 600;
  color: var(--theme-text-primary);
}

.result-detail-dialog .el-dialog__footer {
  border-top: 1px solid var(--theme-dialog-border);
  padding: 10px 20px;
  text-align: center;
  background: var(--theme-dialog-header-bg);
}

/* 表格主题样式 */
.result-table {
  border-radius: 8px;
  border: 1px solid var(--theme-table-border);
  background: var(--theme-bg-primary);
}

.result-table th {
  font-weight: 600;
  background-color: var(--theme-table-header-bg) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

.result-table td {
  background-color: var(--theme-bg-primary) !important;
  color: var(--theme-text-primary) !important;
  border-color: var(--theme-table-border) !important;
}

.result-table .el-table__row:hover td {
  background-color: var(--theme-table-hover-bg) !important;
}

.result-table .el-table__row--striped td {
  background-color: var(--theme-table-stripe-bg) !important;
}

/* 按钮样式优化 */
.result-detail-dialog .el-button {
  background: var(--theme-bg-tertiary);
  border-color: var(--theme-border-primary);
  color: var(--theme-text-primary);
}

.result-detail-dialog .el-button--primary {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}

.result-detail-dialog .el-button--success {
  background: var(--theme-success);
  border-color: var(--theme-success);
  color: var(--theme-text-inverse);
}

.result-detail-dialog .el-button:hover {
  opacity: 0.8;
}

/* 输入框样式 */
.result-detail-dialog .el-input__inner {
  background: var(--theme-input-bg);
  border-color: var(--theme-input-border);
  color: var(--theme-text-primary);
}

.result-detail-dialog .el-input__inner:focus {
  border-color: var(--theme-input-focus-border);
}

.result-detail-dialog .el-input__inner::placeholder {
  color: var(--theme-input-placeholder);
}

/* 空状态样式 */
.result-detail-dialog .el-empty {
  background: transparent;
}

.result-detail-dialog .el-empty__description {
  color: var(--theme-text-secondary);
}

/* 按钮组样式 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.button-group .el-button {
  margin: 0;
  width: 60px;
  font-size: 12px;
}

.button-group .el-tag {
  margin: 2px 0;
}
</style>
