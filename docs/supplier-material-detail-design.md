# 乙供物资解析结果确认 — 表格渲染与交互设计

此文档为前端开发人员（包含新手）提供的实现方案，基于现有实现文件：
- [`SupplierMaterialDetailPage.vue`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:1)
- 弹窗组件：[`MaterialSelectionDialog`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:284)
- 数据处理函数：[`fetchData()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:397)、[`initializeRowData()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:1266)
- 选择处理：[`handleMaterialSelection()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:963)

## 一、设计目标
- 将原先每条解析结果的单行，拆分为两行（数据行 + 操作行），以便直观对比解析结果与推荐/数据库数据。
- 在“相似匹配”场景展示两个下拉（推荐物资、价格季度），选择后实时回显到数据行。
- 在“未匹配”场景提供“从数据库选择”弹窗，选择后回显到数据行。
- 在“精确匹配”场景显示状态并允许“重新选择”进入弹窗。
- 尽可能复用现有逻辑与组件，降低改造成本。

## 二、核心思路
1. 在数据层对 API 返回数组进行转化：每条原始记录扩展为两个表格行对象（rowType: 'data' / 'action'）。
2. 使用 `el-table` 的 `span-method` 合并序号列实现“组”视觉效果。
3. 数据行（rowType: 'data'）负责展示当前最终值；操作行（rowType: 'action'）负责承载交互控件并将变更写回数据模型。
4. 保持响应式：操作行的选择改变对应数据对象的字段（例如 confirmedBaseName、confirmedPrice），使数据行自动更新。

## 三、数据结构与转换示例
原始数组（示例）：
```javascript
// javascript
const rawData = [
  { id: 1, materialName: '螺纹钢', matchedType: 2, matchOptions: [...] },
  { id: 2, materialName: '水泥', matchedType: 0 }
];
```

转换后（用于表格）：
```javascript
// javascript
const materialData = rawData.flatMap(item => {
  const initialized = initializeRowData(item); // 复用现有函数 [`initializeRowData()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:1266)
  const dataRow = { ...initialized, rowType: 'data', rowKey: `${initialized.taskDataId || initialized.id}-data` };
  const actionRow = { ...initialized, rowType: 'action', rowKey: `${initialized.taskDataId || initialized.id}-action` };
  return [dataRow, actionRow];
});
```

说明：
- `rowType` 用于模板分支展示。
- `rowKey` 用于 `el-table` 的 `:row-key`，保证渲染稳定。

## 四、表格渲染与合并规则
- 在 `<el-table>` 上增加：
```javascript
// javascript
:row-key="row => row.rowKey"
:span-method="tableSpanMethod"
```

- 合并规则示例（只合并序号列）：
```javascript
// javascript
const tableSpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  // 将第一列（序号）在 data 行合并两行
  if (columnIndex === 0) {
    if (row.rowType === 'data') return { rowspan: 2, colspan: 1 };
    return { rowspan: 0, colspan: 0 };
  }
  // 默认不合并其它列（操作行中可通过 colspan 合并）
  return null;
};
```

## 五、列模板改造示例
以“物资名称”和“操作”列为例：
```vue
<!-- vue -->
<el-table-column label="序号" width="80">
  <template #default="{ row, $index }">
    <span v-if="row.rowType === 'data'">{{ Math.floor($index / 2) + 1 }}</span>
  </template>
</el-table-column>

<el-table-column prop="materialName" label="物资名称" min-width="140">
  <template #default="{ row }">
    <div v-if="row.rowType === 'data'">
      {{ getBaseInfoName(row) }}
    </div>
    <div v-else class="action-cell">
      <!-- 相似匹配：下拉选择推荐物资 -->
      <el-select v-if="row.matchedType === 2" v-model="row.selectedMaterialId" @change="handleMaterialSelectChange(row, $event)" placeholder="选择推荐物资" style="width:100%">
        <el-option v-for="opt in row.matchOptions" :key="opt.matchedId" :label="opt.baseInfo?.materialName" :value="opt.matchedId" />
      </el-select>
      <!-- 未匹配 / 精确匹配：显示说明或按钮（参见文档） -->
    </div>
  </template>
</el-table-column>

<el-table-column label="操作" width="200">
  <template #default="{ row }">
    <div v-if="row.rowType === 'data'">
      <!-- 在数据行显示状态 -->
      <el-tag :type="getMatchTypeTagInfo(row.matchedType).type">{{ getMatchTypeTagInfo(row.matchedType).text }}</el-tag>
    </div>
    <div v-else class="action-cell">
      <!-- 在 action 行根据 matchedType 显示控件 -->
      <!-- 相似匹配：两个下拉（物资 + 价格）-->
      <!-- 未匹配：提示 + 从数据库选择按钮，复用 MaterialSelectionDialog -->
    </div>
  </template>
</el-table-column>
```

## 六、交互事件与数据回写
- 相似匹配场景：
  1. 用户在 action 行选择物资：触发 `handleMaterialSelectChange(row, selectedId)`（已有方法位于 [`SupplierMaterialDetailPage.vue`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:1135)）。
  2. 方法中设置 `row.selectedMaterial`、`row.selectedMaterialId` 并默认选第一个价格；随后调用 `handlePriceQuarterChange(row, priceId)` 更新 `row.matchedBaseName` / `row.matchedPrice`，并标记 `row.isUserModified = true`。
- 未匹配场景：
  1. 用户点击 “从数据库选择”：复用 [`handleViewOptions()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:842) 打开 [`MaterialSelectionDialog`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:284)。
  2. 弹窗选择后调用 [`handleMaterialSelection()`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:963)，该函数已实现将选中价格维度的物资写回 `materialData`。
- 精确匹配场景：
  1. 在 action 行显示 `已精确匹配` 文案和 `[重新选择]` 按钮，点击进入 `handleViewOptions()` 流程。

## 七、保存与确认逻辑（沿用现有）
- 保存与批量确认逻辑无需改变：目前使用 `confirmSupplierMaterialData` 与已有 `handleQuickConfirm` / `handleBatchConfirm`（参见 [`SupplierMaterialDetailPage.vue`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:569)）即可。
- 需要注意：保存时应优先使用 `selectedBaseDataId` / `selectedPriceId`，其次回退到 `matchOptions[0]` 的值（当前代码已有该实现）。

## 八、样式建议（简洁可复用）
- 给 action 行一个浅色背景并略微缩小字体，使操作区视觉上从数据区分离：
```css
/* css */
:deep(.el-table .action-row td){
  background: var(--el-background-color-2);
  font-size: 13px;
}
```
- 为下拉和按钮增加一致的间距和满宽度样式。

## 九、开发实施步骤（给新手的分步任务）
1. 在 `fetchData()`（[`SupplierMaterialDetailPage.vue`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:397)）中将 rawData 转为双行结构.
2. 在 `initializeRowData()`（[`SupplierMaterialDetailPage.vue`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:1266)）保持原有初始化并确保新字段（selectedMaterialId 等）存在.
3. 在 `<el-table>` 上增加 `:row-key` 与 `:span-method`，实现序号合并.
4. 修改每列模板，区分 `rowType === 'data'` 与 `rowType === 'action'` 的渲染.
5. 针对 `matchedType === 2` 的行，复用并调整已有的 `handleMaterialSelectChange` / `handlePriceQuarterChange` 以实时更新数据行.
6. 对 `未匹配` 与 `精确匹配` 场景复用 `handleViewOptions` 与 `handleMaterialSelection`，保证回写逻辑正确.
7. 编写简单样式并测试不同匹配类型在 UI 上的显示和交互，重点验证“选择实时回显”与“保存/确认”流程。

## 十、常见问题与注意事项
- 注意 `el-table` 的 `$index` 在使用 `flatMap` 后仍是逐行计数，序号计算需以分组规则处理（例如 `Math.floor($index / 2) + 1`）。
- 保持 `isUserModified` 的更新，以便 `handleSaveResults` 能正确找到需要保存的条目。
- 如果分页或虚拟滚动导致 `el-table` 渲染优化问题，优先使用 `:row-key` 来保证对象标识稳定。
- 尽量复用已有弹窗组件 [`MaterialSelectionDialog`](src/views/supplier-material-detail/SupplierMaterialDetailPage.vue:284)，不要新造轮子。

---

