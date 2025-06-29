<template>
  <el-dialog
    v-model="showResultDetail"
    title="合同解析结果详情"
    width="80%"
    custom-class="result-detail-dialog"
  >
    <div v-loading="isFetchingDetails" class="result-detail-content">
      <el-table
        v-if="tableData && tableData.length > 0"
        :data="tableData"
        style="width: 100%"
        stripe
        class="result-table"
        max-height="60vh"
        :header-cell-style="{ background: '#fafafa', color: '#333' }"
      >
        <template v-for="column in tableColumns" :key="column.prop">
          <el-table-column
            :prop="column.prop"
            :label="parsingResultStore.translateHeader(column.prop)"
          >
            <template #default="scope">
              <span v-if="!scope.row.editing">{{
                parsingResultStore.formatCellValue(scope.row[column.prop])
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div v-if="scope.row.editing">
              <el-button
                type="success"
                size="small"
                @click="parsingResultStore.saveRowEdit(scope.row)"
                >保存</el-button
              >
              <el-button size="small" @click="parsingResultStore.cancelRowEdit(scope.row)"
                >取消</el-button
              >
            </div>
            <el-button
              v-else
              type="primary"
              size="small"
              @click="parsingResultStore.startRowEdit(scope.row)"
              >编辑</el-button
            >
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
          @click="parsingResultStore.handleSaveAll"
          :loading="savingAllEdits"
          >提交修改</el-button
        >
        <!-- <el-button type="success" @click="parsingResultStore.handleConfirm()" :loading="isConfirming">确认</el-button> -->
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { useParsingResultStore } from '@/stores/parsingResult'
import { computed, watch, toRefs } from 'vue'

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
const editData = computed(() => parsingResultStore.editFormModels.value)
// 监听 showResultDetail 的变化，当它变为 true 时调用 handleViewResultDetail
watch(
  showResultDetail,
  async (newValue) => {
    if (newValue) {
      await parsingResultStore.handleViewResultDetail()
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
.result-detail-dialog .el-dialog__body {
  padding: 20px;
}
.result-detail-dialog .el-dialog__header {
  border-bottom: 1px solid #eee;
  padding: 16px 20px;
}
.result-detail-dialog .el-dialog__title {
  font-weight: 600;
}
.result-detail-dialog .el-dialog__footer {
  border-top: 1px solid #eee;
  padding: 10px 20px;
  text-align: center;
}
.result-table {
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.result-table th {
  font-weight: 600;
  background-color: #f7f8fa !important;
}
.result-table .el-table__row:hover {
  background-color: #f5f7fa;
}
</style>
