<template>
  <div class="material-management-page">
    <!-- 顶部操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">基础物资管理</h1>
        <p class="page-subtitle">统一管理基础物资信息与价格数据</p>
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
      <el-tabs v-model="currentTab" @tab-click="handleTabChange" class="management-tabs">
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
            <div class="stats-icon">📏</div>
            <div class="stats-info">
              <div class="stats-title">不同规格型号</div>
              <div class="stats-value">{{ materialStats.totalSpecifications }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon">📂</div>
            <div class="stats-info">
              <div class="stats-title">不同物资类型</div>
              <div class="stats-value">{{ materialStats.totalCategories }}</div>
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
          @selection-change="(selection) => onTableSelectionChange(selection, selectedMaterials)"
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
              {{ row.createTime || '--' }}
            </template>
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="modern-actions-wrapper">
                <div class="action-btn action-edit" @click="editMaterial(row)" title="编辑物资">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="m18.5 2.5 a 2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="action-text">编辑</span>
                </div>
                <div
                  class="action-btn action-manage"
                  @click="manageMaterialPrices(row)"
                  title="价格管理"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 1v6m0 6v6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M9 9h6m-6 6h6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                  </svg>
                  <span class="action-text">价格</span>
                </div>
                <div
                  class="action-btn action-delete"
                  @click="confirmSingleDelete(row, deleteMaterials)"
                  title="删除物资"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m3 6 18 0"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="10"
                      y1="11"
                      x2="10"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <line
                      x1="14"
                      y1="11"
                      x2="14"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="action-text">删除</span>
                </div>
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
            <el-input
              v-model="priceSearchForm.materialName"
              placeholder="请输入物资名称"
              style="width: 200px"
              clearable
            />
          </el-form-item>
          <el-form-item
            v-for="(config, key) in filteredPriceSearchConfig"
            :key="key"
            :label="`${config.label}:`"
            :prop="key"
          >
            <el-select
              v-if="config.type === 'date'"
              v-model="priceSearchForm.quarter"
              :placeholder="config.placeholder"
              style="width: 200px"
              clearable
              :key="`quarter-select-${currentTab}`"
            >
              <el-option
                v-for="option in quarterOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-select
              v-else
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
          <template #empty>
            <div class="empty-data">
              <el-empty description="暂无价格数据" />
            </div>
          </template>
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
              {{ row.createTime || '--' }}
            </template>
            <template v-else-if="column.prop === 'updateTime'" #default="{ row }">
              {{ row.updateTime || '--' }}
            </template>
            <template v-else-if="column.label === '操作'" #default="{ row }">
              <div class="modern-actions-wrapper price-actions">
                <div class="action-btn action-edit" @click="editPrice(row)" title="编辑价格">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="m18.5 2.5 a 2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span class="action-text">编辑</span>
                </div>
                <div
                  class="action-btn action-delete"
                  @click="confirmSingleDelete(row, deletePrices)"
                  title="删除价格"
                >
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m3 6 18 0"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="10"
                      y1="11"
                      x2="10"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <line
                      x1="14"
                      y1="11"
                      x2="14"
                      y2="17"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="action-text">删除</span>
                </div>
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
      width="80vw"
      @close="resetMaterialForm"
      class="modern-dialog material-dialog fixed-height-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="dialog-body-wrapper">
        <div class="dialog-icon material-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M16 21v-5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path d="M22 11H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="7" cy="4" r="2" stroke="currentColor" stroke-width="2" />
            <circle cx="17" cy="4" r="2" stroke="currentColor" stroke-width="2" />
          </svg>
        </div>

        <div class="scrollable-content">
          <el-form
            ref="materialFormRef"
            :model="materialForm"
            :rules="FORM_RULES"
            label-width="110px"
            class="modern-form material-form"
          >
            <div class="form-section">
              <div class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                </svg>
                基础信息
              </div>

              <div class="form-row">
                <el-form-item label="物资名称" prop="materialName" class="form-item primary-item">
                  <el-input
                    v-model="materialForm.materialName"
                    placeholder="请输入物资名称"
                    class="modern-input"
                  >
                    <template #prefix>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1 0 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                      </svg>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="单位" prop="unit" class="form-item">
                  <el-input
                    v-model="materialForm.unit"
                    placeholder="如：个、台、套"
                    class="modern-input"
                  >
                    <template #prefix>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L2 7l10 5 10-5-10-5z"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path d="m2 17 10 5 10-5" stroke="currentColor" stroke-width="1.5" />
                        <path d="m2 12 10 5 10-5" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>

            <div class="form-section">
              <div class="section-title">
                <svg class="section-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <polyline
                    points="14,2 14,8 20,8"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <line
                    x1="16"
                    y1="13"
                    x2="8"
                    y2="13"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                详细规格
              </div>

              <el-form-item label="规格型号" prop="specification" class="form-item full-width">
                <el-input
                  v-model="materialForm.specification"
                  placeholder="请输入详细的规格型号信息"
                  class="modern-input"
                  :rows="2"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  resize="none"
                />
              </el-form-item>

              <el-form-item label="物资分类" prop="category" class="form-item full-width">
                <el-input
                  v-model="materialForm.category"
                  placeholder="请输入物资所属分类"
                  class="modern-input"
                >
                  <template #prefix>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                    </svg>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer enhanced-footer">
          <el-button
            @click="dialogState.showMaterialDialog = false"
            class="cancel-btn enhanced-cancel"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            取消
          </el-button>
          <el-button type="primary" @click="saveMaterial" class="confirm-btn enhanced-confirm">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ dialogState.isEditingMaterial ? '更新物资' : '创建物资' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新增/编辑价格弹窗 -->
    <el-dialog
      v-model="dialogState.showPriceDialog"
      :title="
        DIALOG_TITLES[dialogState.isEditingPrice ? DIALOG_TYPES.EDIT_PRICE : DIALOG_TYPES.ADD_PRICE]
      "
      width="80vw"
      @close="resetPriceForm"
      class="modern-dialog price-dialog fixed-height-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="dialog-body-wrapper">
        <div class="dialog-icon price-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <div class="scrollable-content">
          <el-form
            ref="priceFormRef"
            :model="priceForm"
            :rules="FORM_RULES"
            label-width="0"
            class="modern-form price-form"
          >
            <!-- 物资选择区域 -->
            <div class="form-section material-selection-section">
              <div class="section-header">
                <div class="section-title">
                  <svg class="section-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M16 21v-5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v5"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                  选择物资
                </div>
                <div class="section-description">请选择需要设置价格的物资信息</div>
              </div>

              <el-form-item prop="materialId" class="form-item-full">
                <div class="field-label">
                  <span class="label-text">目标物资</span>
                  <span class="label-required">*</span>
                </div>
                <el-select
                  v-model="priceForm.materialId"
                  placeholder="请选择需要设置价格的物资"
                  class="modern-select material-select"
                  filterable
                  remote
                  reserve-keyword
                  size="large"
                  :remote-method="searchMaterialsForSelect"
                  :loading="materialSelectLoading"
                  :virtual-scroll="true"
                  :item-size="48"
                  :max-height="300"
                  @visible-change="handleSelectVisibleChange"
                  @scroll="handleSelectScroll"
                >
                  <el-option
                    v-for="material in materialSelectList"
                    :key="material.id"
                    :label="`${material.materialName} (${material.specification})`"
                    :value="material.id"
                    class="material-option"
                  >
                    <div class="material-option-content">
                      <div class="material-name">{{ material.materialName }}</div>
                      <div class="material-spec">{{ material.specification }}</div>
                    </div>
                  </el-option>
                  <div v-if="hasMoreMaterials" class="load-more-option" @click="loadMoreMaterials">
                    <el-icon class="loading-icon" v-if="loadingMoreMaterials"><Loading /></el-icon>
                    <span>{{ loadingMoreMaterials ? '加载中...' : '加载更多' }}</span>
                  </div>
                </el-select>
              </el-form-item>
            </div>

            <!-- 价格信息区域 -->
            <div class="form-section price-info-section">
              <div class="section-header">
                <div class="section-title">
                  <svg class="section-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  价格设置
                </div>
                <div class="section-description">设置物资价格和适用时间范围</div>
              </div>

              <div class="price-fields-grid">
                <div class="price-field">
                  <el-form-item prop="quarter" class="form-item-grid">
                    <div class="field-label">
                      <span class="label-text">适用季度</span>
                      <span class="label-required">*</span>
                    </div>
                    <div class="quarter-select-wrapper">
                      <el-select
                        v-model="priceForm.quarter"
                        placeholder="选择适用季度"
                        :key="`price-form-quarter-${dialogState.showPriceDialog}`"
                        class="modern-select quarter-select"
                        size="large"
                      >
                        <el-option
                          v-for="option in quarterOptions"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        >
                          <div class="quarter-option">
                            <span class="quarter-text">{{ option.label }}</span>
                            <svg class="quarter-icon" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </div>
                        </el-option>
                      </el-select>
                    </div>
                  </el-form-item>
                </div>

                <div class="price-field">
                  <el-form-item prop="price" class="form-item-grid">
                    <div class="field-label">
                      <span class="label-text">物资价格</span>
                      <span class="label-required">*</span>
                    </div>
                    <div class="price-input-wrapper">
                      <div class="price-input-container">
                        <div class="currency-symbol">¥</div>
                        <el-input-number
                          v-model="priceForm.price"
                          :min="0"
                          :precision="2"
                          placeholder="0.00"
                          class="modern-input-number price-number-input"
                          controls-position="right"
                          size="large"
                          style="width: 100%"
                        />
                      </div>
                      <div class="price-unit">元</div>
                    </div>
                  </el-form-item>
                </div>
              </div>

              <!-- 价格预览区域 -->
              <div
                class="price-preview"
                v-if="priceForm.materialId && priceForm.quarter && priceForm.price"
              >
                <div class="preview-header">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                  </svg>
                  <span>价格预览</span>
                </div>
                <div class="preview-content">
                  <div class="preview-item">
                    <span class="preview-label">物资</span>
                    <span class="preview-value">{{ getSelectedMaterialName() }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">季度</span>
                    <span class="preview-value">{{ getSelectedQuarterLabel() }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">价格</span>
                    <span class="preview-value price"
                      >¥{{ priceForm.price?.toFixed(2) || '0.00' }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer modern-footer">
          <el-button @click="dialogState.showPriceDialog = false" class="cancel-btn" size="large">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            取消
          </el-button>
          <el-button
            type="primary"
            @click="savePrice"
            class="confirm-btn"
            size="large"
            :loading="loading"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" v-if="!loading">
              <path
                d="M20 6L9 17l-5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ dialogState.isEditingPrice ? '更新价格' : '保存价格' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
      v-model="dialogState.showImportDialog"
      :title="DIALOG_TITLES[DIALOG_TYPES.IMPORT]"
      width="600px"
      class="modern-dialog"
      :close-on-click-modal="false"
    >
      <div class="dialog-icon import-icon">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="14,2 14,8 20,8"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <polyline
            points="10,9 9,9 8,9"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <el-form :model="importForm" label-width="100px" class="modern-form">
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
        <div class="dialog-footer">
          <el-button @click="dialogState.showImportDialog = false" class="cancel-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            取消
          </el-button>
          <el-button type="primary" @click="startImport" class="confirm-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                points="7,10 12,15 17,10"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <line
                x1="12"
                y1="15"
                x2="12"
                y2="3"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import MaterialService from '@/services/MaterialService'

// 导入常量和工具函数
import {
  TAB_NAMES,
  TAB_CONFIG,
  MATERIAL_COLUMNS,
  PRICE_COLUMNS,
  PAGINATION_CONFIG,
  SEARCH_FORM_CONFIG,
  DIALOG_TYPES,
  DIALOG_TITLES,
  FORM_RULES
} from './constants.js'

import {
  performMaterialSearch,
  performPriceSearch,
  resetSearchForm,
  changePaginationSize,
  changePaginationCurrent,
  initPagination,
  resetPagination,
  openAddMaterialDialog,
  openAddPriceDialog,
  openImportDialog,
  confirmSingleDelete,
  confirmBatchDelete,
  onTableSelectionChange,
  exportCurrentData,
  formatDisplayTime,
  formatPriceDisplay
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
  materialName: '', // 改为物资名称输入
  quarter: '' // 直接存储季度值(如2024-Q1)
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

// 响应式数据 - 从API获取
const materialList = ref([])
const priceList = ref([])
const materialStatisticsData = ref({
  totalMaterials: 0,
  totalSpecifications: 0,
  totalCategories: 0
})

// 表格数据 - 直接使用从API获取的数据 (已分页)
const materialTableData = computed(() => materialList.value)
const priceTableData = computed(() => priceList.value)

// 当前数据（用于导出）
const currentData = computed(() => {
  return currentTab.value === TAB_NAMES.MATERIALS ? materialTableData.value : priceTableData.value
})

// 过滤后的价格搜索配置（排除materialId）
const filteredPriceSearchConfig = computed(() => {
  const config = { ...SEARCH_FORM_CONFIG.PRICES }
  delete config.materialId
  return config
})

// 季度选项数据 - 添加响应式依赖以确保正确更新
const quarterOptions = computed(() => {
  // 添加currentTab依赖，确保切换tab时重新计算
  // 这个变量的作用是确保在tab切换时触发computed重新计算
  if (currentTab.value === TAB_NAMES.PRICES) {
    // 当在价格管理tab时才生成选项
  }

  const currentYear = new Date().getFullYear()
  const options = []

  // 生成近3年的季度选项（去年、今年、明年）
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      options.push({
        value: `${year}-Q${quarter}`,
        label: `${year}年第${quarter}季度`
      })
    }
  }

  return options
})

// 统计数据
const materialStats = computed(() => {
  // 获取最早更新时间
  const getEarliestUpdateTime = () => {
    if (materialList.value.length === 0) return null

    const updateTimes = materialList.value
      .map((item) => item.updateTime || item.createTime)
      .filter((time) => time)
      .map((time) => new Date(time))
      .filter((date) => !isNaN(date.getTime()))

    if (updateTimes.length === 0) return null

    return new Date(Math.min(...updateTimes))
  }

  return {
    totalMaterials: (materialStatisticsData.value.totalMaterials || 0).toLocaleString(),
    totalSpecifications: (materialStatisticsData.value.totalSpecifications || 0).toLocaleString(),
    totalCategories: (materialStatisticsData.value.totalCategories || 0).toLocaleString(),
    lastUpdate: formatDisplayTime(getEarliestUpdateTime())
  }
})

// 全局价格总数 - 使用API返回的totalElements
const totalPriceElements = ref(0)

const priceStats = computed(() => {
  const prices = priceList.value
  const totalPrice = prices.reduce((sum, item) => sum + (item.price || item.taxPrice || 0), 0)
  const currentQuarter =
    new Date().getMonth() < 3
      ? 'Q1'
      : new Date().getMonth() < 6
      ? 'Q2'
      : new Date().getMonth() < 9
      ? 'Q3'
      : 'Q4'

  // 使用API返回的totalElements作为价格记录数
  const totalPrices = totalPriceElements.value || 0

  // 获取价格列表中的最早更新时间
  const getEarliestPriceUpdateTime = () => {
    if (prices.length === 0) return null

    const updateTimes = prices
      .map((item) => item.updateTime || item.createTime)
      .filter((time) => time)
      .map((time) => new Date(time))
      .filter((date) => !isNaN(date.getTime()))

    if (updateTimes.length === 0) return null

    return new Date(Math.min(...updateTimes))
  }

  return {
    totalPrices: totalPrices.toLocaleString(),
    currentQuarter: `${new Date().getFullYear()}-${currentQuarter}`,
    averagePrice: prices.length > 0 ? totalPrice / prices.length : 0,
    lastUpdate: formatDisplayTime(getEarliestPriceUpdateTime())
  }
})

// 业务方法
const navigateToSmartBrain = () => {
  router.push('/smart-brain')
}

const loadMaterialStatistics = async () => {
  try {
    const keyword = materialSearchForm.materialName || ''
    const response = await MaterialService.getMaterialStatistics(keyword)

    if (response && response.data) {
      materialStatisticsData.value = {
        totalMaterials: response.data.totalMaterials || 0,
        totalSpecifications: response.data.totalSpecifications || 0,
        totalCategories: response.data.totalCategories || 0
      }
    }
  } catch (error) {
    console.error('加载物资统计数据失败:', error)
    materialStatisticsData.value = {
      totalMaterials: 0,
      totalSpecifications: 0,
      totalCategories: 0
    }
  }
}

const loadMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: materialPagination.current - 1, // API页码从0开始
      size: materialPagination.pageSize
    }

    // 添加搜索条件
    if (materialSearchForm.materialName) {
      params.keyword = materialSearchForm.materialName
    }

    const response = await MaterialService.searchMaterials(params)

    if (response && response.data) {
      const { content, totalElements } = response.data
      // 字段映射适配：后端字段 -> 前端字段
      materialList.value = (content || []).map((item) => ({
        ...item,
        specification: item.specificationModel, // 后端specificationModel -> 前端specification
        category: item.type, // 后端type -> 前端category
        updateTime: formatDisplayTime(item.bstudioCreateTime) // 格式化时间显示
      }))
      materialPagination.total = totalElements || 0
    }
  } catch (error) {
    ElMessage.error('加载物资数据失败: ' + error.message)
    materialList.value = []
    materialPagination.total = 0
  } finally {
    loading.value = false
  }

  // 独立加载统计数据，不受物资列表加载结果影响
  await loadMaterialStatistics()
}

const loadPrices = async () => {
  loading.value = true
  try {
    const params = {
      page: pricePagination.current - 1, // API页码从0开始
      size: pricePagination.pageSize
    }

    // 添加搜索条件
    if (priceSearchForm.materialName) {
      // 通过物资名称搜索对应的物资ID
      try {
        const materialResponse = await MaterialService.searchMaterials({
          keyword: priceSearchForm.materialName,
          size: 1000 // 获取足够多的数据用于匹配
        })

        if (materialResponse && materialResponse.data && materialResponse.data.content) {
          const matchedMaterials = materialResponse.data.content.filter(
            (item) => item.materialName && item.materialName.includes(priceSearchForm.materialName)
          )

          if (matchedMaterials.length > 0) {
            // 如果找到匹配的物资，取第一个的ID
            params.baseInfoId = matchedMaterials[0].id
          } else {
            // 没有找到匹配的物资，返回空结果
            priceList.value = []
            pricePagination.total = 0
            loading.value = false
            return
          }
        } else {
          // 搜索物资失败，返回空结果
          priceList.value = []
          pricePagination.total = 0
          loading.value = false
          return
        }
      } catch (materialError) {
        console.error('搜索物资失败:', materialError)
        priceList.value = []
        pricePagination.total = 0
        loading.value = false
        return
      }
    }
    // 如果没有搜索条件，直接查询所有价格数据

    const response = await MaterialService.searchPrices(params)

    if (response && response.data) {
      const { content, totalElements } = response.data
      totalPriceElements.value = totalElements || 0
      // 字段映射适配：后端字段 -> 前端字段，并关联物资信息
      const pricesWithMaterialInfo = await Promise.all(
        (content || []).map(async (item) => {
          let materialInfo = { materialName: '未知物资', specification: '--' }

          // 尝试从当前物资列表中查找
          const material = materialList.value.find((m) => m.id === item.baseInfoId)
          if (material) {
            materialInfo = {
              materialName: material.materialName,
              specification: material.specification || material.specificationModel
            }
          } else if (item.baseInfoId) {
            // 如果当前列表中没有，则单独查询
            try {
              const materialResponse = await MaterialService.getMaterialById(item.baseInfoId)
              if (materialResponse && materialResponse.data) {
                materialInfo = {
                  materialName: materialResponse.data.materialName,
                  specification: materialResponse.data.specificationModel
                }
              }
            } catch (error) {
              console.warn('查询物资信息失败:', error)
            }
          }

          return {
            ...item,
            price: item.taxPrice, // 后端taxPrice -> 前端price
            materialName: materialInfo.materialName,
            specification: materialInfo.specification,
            materialId: item.baseInfoId, // 保留原字段以备后用
            updateTime: item.updateTime ? formatDisplayTime(item.updateTime) : '--' // 格式化时间或显示默认值
          }
        })
      )

      // 如果有季度筛选条件，进行前端筛选
      let filteredPrices = pricesWithMaterialInfo
      if (priceSearchForm.quarter) {
        filteredPrices = pricesWithMaterialInfo.filter(
          (item) => item.quarter === priceSearchForm.quarter
        )
      }

      priceList.value = filteredPrices
      pricePagination.total = filteredPrices.length
    }
  } catch (error) {
    console.error('加载价格数据失败:', error)
    // 暂时不显示错误消息，直接显示空数据让表格正常展示
    if (error.response && error.response.status === 404) {
      console.warn('价格API服务未启动或路径不正确')
    } else {
      ElMessage.error('加载价格数据失败: ' + error.message)
    }
    priceList.value = []
    pricePagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadCurrentTabData = () => {
  if (currentTab.value === TAB_NAMES.MATERIALS) {
    loadMaterials()
  } else {
    loadPrices()
  }
}

// 处理tab切换
const handleTabChange = async (tab) => {
  currentTab.value = tab.name

  // 等待DOM更新
  await nextTick()

  // 如果切换到价格管理tab，强制刷新相关组件
  if (tab.name === TAB_NAMES.PRICES && priceSearchFormRef.value) {
    // 清除表单验证，并强制重新渲染
    priceSearchFormRef.value.clearValidate()
    // 触发季度选择框的重新渲染
    const currentQuarter = priceSearchForm.quarter
    priceSearchForm.quarter = ''
    await nextTick()
    priceSearchForm.quarter = currentQuarter
  }

  // 加载当前tab的数据
  loadCurrentTabData()
}

const editMaterial = (row) => {
  dialogState.isEditingMaterial = true
  dialogState.currentMaterial = { ...row }
  // 字段映射适配：确保从row正确映射到表单
  Object.assign(materialForm, {
    materialName: row.materialName,
    specification: row.specification || row.specificationModel, // 兼容两种字段名
    unit: row.unit,
    category: row.category || row.type // 兼容两种字段名
  })
  dialogState.showMaterialDialog = true
}

const editPrice = async (row) => {
  dialogState.isEditingPrice = true
  dialogState.currentPrice = { ...row }

  // 字段映射适配：确保从row正确映射到表单
  const materialId = row.materialId || row.baseInfoId
  Object.assign(priceForm, {
    materialId: materialId, // 兼容两种字段名
    quarter: row.quarter, // 直接使用季度值，无需转换
    price: row.price || row.taxPrice // 兼容两种字段名
  })

  // 确保编辑的物资在物资选择器列表中
  if (materialId && row.materialName) {
    const existingMaterial = materialSelectList.value.find((m) => m.id === materialId)
    if (!existingMaterial) {
      // 如果当前选择器列表中没有这个物资，添加它
      const materialToAdd = {
        id: materialId,
        materialName: row.materialName,
        specification: row.specification || '默认规格'
      }
      materialSelectList.value.unshift(materialToAdd) // 添加到列表最前面
    }
  }

  dialogState.showPriceDialog = true
}

const manageMaterialPrices = async (row) => {
  // 切换到价格管理tab
  currentTab.value = TAB_NAMES.PRICES

  // 等待下一个tick确保DOM更新完成
  await nextTick()

  // 重置价格搜索表单的所有条件（包括季度筛选框）
  priceSearchForm.materialName = row.materialName // 设置物资名称
  priceSearchForm.quarter = '' // 重置季度筛选

  // 重置价格分页
  resetPagination(pricePagination)

  // 清除表单验证状态
  if (priceSearchFormRef.value) {
    priceSearchFormRef.value.clearValidate()
  }

  // 加载该物资的价格数据（不带季度筛选）
  await loadPrices()
}

const deleteMaterials = async (ids) => {
  try {
    loading.value = true

    // 逐个删除物资（后端API不支持批量删除）
    for (const id of ids) {
      await MaterialService.deleteMaterial(id)
    }

    ElMessage.success(`成功删除${ids.length}个物资`)
    selectedMaterials.value = []

    // 重新加载数据
    await loadMaterials()
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const deletePrices = async (ids) => {
  try {
    loading.value = true

    // 批量删除价格
    await MaterialService.deletePrices(ids)

    ElMessage.success(`成功删除${ids.length}个价格记录`)
    selectedPrices.value = []

    // 重新加载数据
    await loadPrices()
  } catch (error) {
    ElMessage.error('删除失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const saveMaterial = async () => {
  materialFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 准备API数据格式，适配后端字段
        const apiData = {
          materialName: materialForm.materialName,
          specificationModel: materialForm.specification, // 前端字段 -> 后端字段
          unit: materialForm.unit,
          type: materialForm.category // 前端category -> 后端type
        }

        if (dialogState.isEditingMaterial) {
          // 编辑物资
          apiData.id = dialogState.currentMaterial.id
          await MaterialService.updateMaterial(apiData)
          ElMessage.success('编辑成功')
        } else {
          // 新增物资
          await MaterialService.createMaterial(apiData)
          ElMessage.success('新增成功')
        }

        dialogState.showMaterialDialog = false
        resetMaterialForm()
        // 重新加载数据
        await loadMaterials()
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message)
      } finally {
        loading.value = false
      }
    }
  })
}

const savePrice = async () => {
  priceFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 准备API数据格式，适配后端字段
        const apiData = {
          baseInfoId: priceForm.materialId, // 前端materialId -> 后端baseInfoId
          quarter: priceForm.quarter,
          taxPrice: priceForm.price // 前端price -> 后端taxPrice
        }

        if (dialogState.isEditingPrice) {
          // 编辑价格
          apiData.id = dialogState.currentPrice.id
          await MaterialService.updatePrice(apiData)
          ElMessage.success('编辑成功')
        } else {
          // 新增价格
          await MaterialService.createPrice(apiData)
          ElMessage.success('新增成功')
        }

        dialogState.showPriceDialog = false
        resetPriceForm()
        // 重新加载数据
        await loadPrices()
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message)
      } finally {
        loading.value = false
      }
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

// 物资选择器分页管理
const materialSelectList = ref([])
const materialSelectLoading = ref(false)
const loadingMoreMaterials = ref(false)
const hasMoreMaterials = ref(true)
const materialSelectPagination = reactive({
  page: 0,
  size: 20,
  total: 0,
  keyword: ''
})

// 搜索物资（远程搜索）
const searchMaterialsForSelect = async (query) => {
  materialSelectPagination.keyword = query || ''
  materialSelectPagination.page = 0
  hasMoreMaterials.value = true
  await loadMaterialsForSelect(true)
}

// 加载物资列表（用于选择器）
const loadMaterialsForSelect = async (isSearch = false) => {
  if (isSearch) {
    materialSelectLoading.value = true
  } else {
    loadingMoreMaterials.value = true
  }

  try {
    const params = {
      page: materialSelectPagination.page,
      size: materialSelectPagination.size
    }
    if (materialSelectPagination.keyword) {
      params.keyword = materialSelectPagination.keyword
    }

    const response = await MaterialService.searchMaterials(params)

    if (response && response.data) {
      const { content = [], totalElements = 0 } = response.data
      const processedContent = content.map((item) => ({
        ...item,
        specification: item.specificationModel || item.specification
      }))

      if (isSearch || materialSelectPagination.page === 0) {
        materialSelectList.value = processedContent
      } else {
        materialSelectList.value.push(...processedContent)
      }

      materialSelectPagination.total = totalElements
      hasMoreMaterials.value = materialSelectList.value.length < totalElements
    }
  } catch (error) {
    console.error('加载物资选择列表失败:', error)
    ElMessage.error('加载物资列表失败')
  } finally {
    materialSelectLoading.value = false
    loadingMoreMaterials.value = false
  }
}

// 加载更多物资
const loadMoreMaterials = async () => {
  if (loadingMoreMaterials.value || !hasMoreMaterials.value) return

  materialSelectPagination.page++
  await loadMaterialsForSelect(false)
}

// 处理选择器显示/隐藏
const handleSelectVisibleChange = (visible) => {
  if (visible && materialSelectList.value.length === 0) {
    // 首次打开时加载数据
    loadMaterialsForSelect(true)
  }
}

// 处理选择器滚动（虚拟滚动到底部时加载更多）
const handleSelectScroll = (event) => {
  const { target } = event
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    if (hasMoreMaterials.value && !loadingMoreMaterials.value) {
      loadMoreMaterials()
    }
  }
}

// 价格预览辅助方法
const getSelectedMaterialName = () => {
  // 首先从物资选择器列表中查找
  let material = materialSelectList.value.find((m) => m.id === priceForm.materialId)
  // 如果没找到，再从主要物资列表中查找（备用）
  if (!material) {
    material = materialList.value.find((m) => m.id === priceForm.materialId)
  }
  return material ? `${material.materialName} (${material.specification})` : '未选择'
}

const getSelectedQuarterLabel = () => {
  const option = quarterOptions.value.find((opt) => opt.value === priceForm.quarter)
  return option ? option.label : '未选择'
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

// 分页总数现在由API响应直接设置，不需要监听

onMounted(async () => {
  // 先加载物资数据，确保价格管理tab中的物资选择有数据
  await loadMaterials()
  // 独立加载统计数据，确保统计卡片有数据
  await loadMaterialStatistics()
  // 然后根据当前tab加载对应数据
  if (currentTab.value === TAB_NAMES.PRICES) {
    await loadPrices()
  }
})
</script>

<style scoped>
.material-management-page {
  padding: 20px;
  background: linear-gradient(135deg, var(--theme-bg-primary) 0%, var(--theme-bg-secondary) 100%);
  min-height: 100vh;
  transition: all 0.3s ease;
  position: relative;
}

.material-management-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 20% 30%,
      rgba(var(--theme-primary-rgb), 0.05) 0%,
      transparent 50%
    ),
    radial-gradient(circle at 80% 70%, rgba(var(--theme-secondary-rgb), 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(var(--theme-accent-rgb), 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  background: var(--theme-card-bg);
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--theme-primary),
    var(--theme-secondary),
    var(--theme-accent)
  );
  border-radius: 16px 16px 0 0;
}

.page-header:hover {
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tabs-section {
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.management-tabs {
  background: var(--theme-card-bg);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  backdrop-filter: blur(20px);
}

.management-tabs:hover {
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
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

.page-title {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px 0;
  background: linear-gradient(
    135deg,
    var(--theme-primary) 0%,
    var(--theme-secondary) 50%,
    var(--theme-accent) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  line-height: 1.2;
  position: relative;
}

.page-title::before {
  content: '📦';
  font-size: 28px;
  margin-right: 12px;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light), var(--theme-primary-lighter));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 4px var(--theme-shadow-sm));
}

.page-subtitle {
  margin: 0;
  color: var(--theme-text-secondary);
  font-size: 16px;
  font-weight: 500;
  opacity: 0.8;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.header-right .el-button {
  border-radius: 10px;
  font-weight: 600;
  padding: 12px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.header-right .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.header-right .el-button--primary {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: 1px solid var(--theme-primary);
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

.header-right .el-button--primary:hover {
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
  box-shadow: 0 8px 24px rgba(var(--theme-primary-rgb), 0.4);
  transform: translateY(-2px) scale(1.02);
}

.filter-section {
  background: var(--theme-card-bg);
  padding: 28px 32px;
  border-radius: 16px;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
}

.filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-accent), var(--theme-primary));
  border-radius: 16px 16px 0 0;
  opacity: 0.8;
}

.filter-section:hover {
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.stats-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: var(--theme-card-bg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(20px);
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: left;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.stats-card:hover::before {
  transform: scaleX(1);
}

.stats-content {
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
  box-shadow:
    0 4px 12px rgba(var(--theme-primary-rgb), 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stats-card:hover .stats-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow:
    0 8px 24px rgba(var(--theme-primary-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--theme-text-primary);
  margin: 0 0 4px 0;
  line-height: 1.2;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 28px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
}

.table-section .el-table {
  border-radius: 0;
  border: none;
  background: transparent;
  font-size: 14px;
}

.table-section .el-table__header-wrapper {
  border-radius: 0;
}

.table-section .el-table .el-table__cell {
  border-bottom: 1px solid var(--theme-border-primary);
  padding: 12px 0;
  height: auto;
}

.table-section .el-table__header .el-table__cell {
  background: linear-gradient(
    135deg,
    var(--theme-bg-secondary) 0%,
    rgba(var(--theme-primary-rgb), 0.05) 100%
  );
  font-weight: 700;
  font-size: 13px;
  color: var(--theme-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 3px solid var(--theme-primary);
  height: 52px;
  position: relative;
}

.table-section .el-table__header .el-table__cell::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
  opacity: 0.8;
}

.table-section .el-table__body .el-table__cell {
  padding: 16px 0;
  vertical-align: middle;
}

.table-section .el-table__row {
  transition: all 0.3s ease;
}

.table-section .el-table__row:hover {
  background: linear-gradient(
    135deg,
    var(--theme-bg-hover) 0%,
    rgba(var(--theme-primary-rgb), 0.08) 100%
  ) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.table-section .el-table__row:nth-child(even) {
  background: linear-gradient(
    135deg,
    var(--theme-bg-stripe) 0%,
    rgba(var(--theme-secondary-rgb), 0.02) 100%
  );
}

.table-section:hover {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 标签页样式优化 */
.tabs-section {
  margin-bottom: 24px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--theme-card-border);
  box-shadow: var(--theme-card-shadow);
}

.management-tabs {
  --el-tabs-header-height: 48px;
}

.management-tabs .el-tabs__header {
  margin: 0;
  border-bottom: 2px solid var(--theme-border-primary);
}

.management-tabs .el-tabs__nav-wrap {
  padding: 0;
}

.management-tabs .el-tabs__item {
  height: 48px;
  line-height: 48px;
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-secondary);
  border: none;
  margin-right: 32px;
  padding: 0 16px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.management-tabs .el-tabs__item:before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light));
  border-radius: 2px;
  transform: translateX(-50%);
  transition: width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.management-tabs .el-tabs__item:hover {
  color: var(--theme-primary);
  transform: translateY(-1px);
}

.management-tabs .el-tabs__item.is-active {
  color: var(--theme-primary);
  font-weight: 600;
}

.management-tabs .el-tabs__item.is-active:before {
  width: 100%;
}

.management-tabs .el-tabs__active-bar {
  display: none;
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

/* 现代化操作栏样式 */
.modern-actions-wrapper {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  padding: 4px 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
  background: var(--theme-card-bg);
  color: var(--theme-text-secondary);
  min-width: 54px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.action-btn:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.action-btn:hover:before {
  left: 100%;
}

.action-icon {
  width: 14px;
  height: 14px;
  transition: all 0.2s ease;
}

.action-text {
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* 编辑按钮样式 */
.action-edit {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
  box-shadow: 0 2px 8px var(--theme-shadow-sm);
}

.action-edit:hover {
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary-lighter));
  box-shadow: 0 4px 16px var(--theme-shadow-md);
  transform: translateY(-1px) scale(1.02);
  border-color: var(--theme-primary-light);
}

.action-edit:hover .action-icon {
  transform: scale(1.1) rotate(5deg);
}

/* 价格管理按钮样式 */
.action-manage {
  background: linear-gradient(135deg, var(--theme-success), var(--theme-success));
  color: var(--theme-text-inverse);
  border-color: var(--theme-success);
  box-shadow: 0 2px 8px var(--theme-shadow-sm);
}

.action-manage:hover {
  background: linear-gradient(135deg, var(--theme-success), var(--theme-success));
  box-shadow: 0 4px 16px var(--theme-shadow-md);
  transform: translateY(-1px) scale(1.02);
  border-color: var(--theme-success);
}

.action-manage:hover .action-icon {
  transform: scale(1.1) rotate(15deg);
}

/* 删除按钮样式 */
.action-delete {
  background: linear-gradient(135deg, var(--theme-error), var(--theme-error));
  color: var(--theme-text-inverse);
  border-color: var(--theme-error);
  box-shadow: 0 2px 8px var(--theme-shadow-sm);
}

.action-delete:hover {
  background: linear-gradient(135deg, var(--theme-error), var(--theme-error));
  box-shadow: 0 4px 16px var(--theme-shadow-md);
  transform: translateY(-1px) scale(1.02);
  border-color: var(--theme-error);
}

.action-delete:hover .action-icon {
  transform: scale(1.1) rotate(-5deg);
}

/* 价格页面操作栏稍微紧凑一些 */
.price-actions {
  gap: 8px;
}

.price-actions .action-btn {
  min-width: 58px;
  padding: 7px 12px;
}


/* 响应式适配 */
@media (max-width: 768px) {
  .modern-actions-wrapper {
    flex-direction: row;
    gap: 4px;
    flex-wrap: nowrap;
    padding: 2px 0;
  }

  .action-btn {
    padding: 5px 8px;
    border-radius: 8px;
    min-width: 42px;
    font-size: 11px;
  }

  .action-icon {
    width: 12px;
    height: 12px;
  }

  .action-text {
    display: none; /* 在小屏幕上隐藏文字，只显示图标 */
  }

  .price-actions .action-btn {
    min-width: 44px;
    padding: 6px 8px;
  }
}

@media (max-width: 480px) {
  .modern-actions-wrapper {
    gap: 2px;
  }

  .action-btn {
    padding: 4px 6px;
    min-width: 36px;
  }

  .action-icon {
    width: 11px;
    height: 11px;
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
    padding: 16px;
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
    align-items: stretch;
  }

  .filter-section .el-form-item {
    margin-right: 0;
    margin-bottom: 16px;
    width: 100%;
  }

  .filter-section .el-form-item .el-input,
  .filter-section .el-form-item .el-select,
  .filter-section .el-form-item .el-date-picker {
    width: 100% !important;
  }

  .table-actions {
    flex-direction: column !important;
    gap: 6px;
    align-items: center;
  }

  .table-actions .el-button {
    width: 90% !important;
    max-width: 120px;
    font-size: 11px;
    padding: 6px 8px;
    min-height: 28px;
    border-radius: 6px;
  }

  .tabs-section {
    margin-bottom: 16px;
    padding: 12px;
  }

  .management-tabs .el-tabs__item {
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    margin-right: 16px;
    padding: 0 12px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats-card {
    margin-bottom: 8px;
  }

  .stats-content {
    gap: 12px;
  }

  .stats-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .stats-title {
    font-size: 12px;
  }

  .stats-value {
    font-size: 20px;
  }

  .table-section {
    margin-top: 16px;
    border-radius: 8px;
  }

  .table-section .el-table__cell {
    padding: 8px 0;
    font-size: 12px;
  }

  .table-section .el-table__header .el-table__cell {
    height: 40px;
    font-size: 11px;
  }

  .table-section .el-table__body .el-table__cell {
    padding: 12px 0;
  }

  .pagination-wrapper {
    padding: 16px;
  }

  .batch-actions {
    padding: 16px;
  }
}

/* Element Plus 组件主题优化 */
.material-management-page .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.material-management-page .el-button:hover {
  transform: translateY(-1px);
}

.material-management-page .el-input__wrapper {
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.material-management-page .el-input__wrapper:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.material-management-page .el-select .el-input.is-focus .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--theme-primary);
}

.material-management-page .el-date-editor .el-input__wrapper {
  border-radius: 8px;
}

.material-management-page .el-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: var(--theme-text-secondary);
  --el-pagination-border-radius: 8px;
}

.material-management-page .el-pagination .btn-next,
.material-management-page .el-pagination .btn-prev {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.material-management-page .el-pagination .btn-next:hover,
.material-management-page .el-pagination .btn-prev:hover {
  transform: translateY(-1px);
  background-color: var(--theme-primary);
  color: white;
}

.material-management-page .el-pager li {
  border-radius: 8px;
  transition: all 0.3s ease;
  margin: 0 2px;
}

.material-management-page .el-pager li:hover {
  transform: translateY(-1px);
  background-color: var(--theme-primary-light);
  color: white;
}

.material-management-page .el-pager li.is-active {
  background-color: var(--theme-primary);
  color: white;
  transform: translateY(-1px);
}

/* 现代化弹窗样式 */
.material-management-page .modern-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid var(--theme-border-secondary);
}

.material-management-page .modern-dialog .el-dialog__header {
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-light) 100%);
  color: white;
  padding: 24px 32px 20px;
  position: relative;
  overflow: hidden;
}

.material-management-page .modern-dialog .el-dialog__header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.05"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.material-management-page .modern-dialog .el-dialog__title {
  font-size: 20px;
  font-weight: 700;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.material-management-page .modern-dialog .el-dialog__body {
  padding: 0;
  background: var(--theme-card-bg);
}

/* 弹窗图标 */
.dialog-icon {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.15),
    0 0 0 4px var(--theme-card-bg),
    0 0 0 1px var(--theme-border-secondary);
  z-index: 10;
}

.dialog-icon svg {
  width: 32px;
  height: 32px;
  color: white;
  stroke-width: 2;
}

.dialog-icon.price-icon {
  background: linear-gradient(135deg, var(--theme-success), var(--theme-success));
}

.dialog-icon.import-icon {
  background: linear-gradient(135deg, var(--theme-warning), var(--theme-warning));
}

.dialog-icon.material-icon {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
}

/* 现代化表单 */
.modern-form {
  padding: 48px 32px 32px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 0;
}

.form-item {
  margin-bottom: 24px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.material-management-page .modern-form .el-form-item__label {
  font-weight: 600;
  color: var(--theme-text-primary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.material-management-page .modern-form .el-form-item__content {
  line-height: 1.5;
}

/* 现代化输入框 */
.modern-input .el-input__wrapper {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--theme-border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--theme-card-bg);
  padding: 12px 16px;
  font-size: 14px;
}

.modern-input .el-input__wrapper:hover {
  border-color: var(--theme-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modern-input .el-input__wrapper.is-focus {
  border-color: var(--theme-primary);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
}

/* 现代化选择框 */
.modern-select .el-input__wrapper {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--theme-border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--theme-card-bg);
  padding: 12px 16px;
  font-size: 14px;
}

.modern-select .el-input__wrapper:hover {
  border-color: var(--theme-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modern-select .el-input__wrapper.is-focus {
  border-color: var(--theme-primary);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
}

/* 价格输入特殊样式 */
.price-input-item {
  position: relative;
}

.price-input-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.modern-input-number {
  flex: 1;
}

.modern-input-number .el-input__wrapper {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--theme-border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--theme-card-bg);
  padding: 12px 16px;
  padding-left: 48px;
  font-size: 14px;
}

.modern-input-number .el-input__wrapper:hover {
  border-color: var(--theme-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modern-input-number .el-input__wrapper.is-focus {
  border-color: var(--theme-primary);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
}

.currency-symbol {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--theme-primary);
  font-weight: 600;
  font-size: 16px;
  z-index: 5;
}

.price-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--theme-text-tertiary);
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--theme-bg-secondary);
  border-radius: 8px;
  border-left: 4px solid var(--theme-success);
}

.hint-icon {
  width: 14px;
  height: 14px;
  color: var(--theme-success);
  flex-shrink: 0;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  background: var(--theme-bg-secondary);
  border-top: 1px solid var(--theme-border-secondary);
}

.cancel-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 2px solid var(--theme-border-secondary);
  color: var(--theme-text-secondary);
  background: var(--theme-card-bg);
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn:hover {
  border-color: var(--theme-primary-light);
  color: var(--theme-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: 2px solid var(--theme-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--theme-primary-rgb), 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

/* 暗黑模式优化 */
[data-theme='dark'] .modern-dialog,
[data-theme='tech-blue'] .modern-dialog {
  background: var(--theme-card-bg);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .dialog-icon,
[data-theme='tech-blue'] .dialog-icon {
  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.3),
    0 0 0 4px var(--theme-card-bg),
    0 0 20px rgba(64, 158, 255, 0.3);
}

/* 增强的物资弹窗样式 */
.material-dialog {
  --dialog-primary: var(--theme-primary);
  --dialog-secondary: var(--theme-primary-light);
}

.material-form {
  padding: 48px 36px 36px;
}

/* 表单分组 */
.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, var(--theme-card-bg) 0%, var(--theme-bg-secondary) 100%);
  border-radius: 16px;
  border: 1px solid var(--theme-border-secondary);
  position: relative;
  overflow: hidden;
}

.form-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--theme-primary),
    var(--theme-primary-light),
    var(--theme-primary)
  );
  opacity: 0.7;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-border-primary);
  position: relative;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: var(--theme-primary);
  stroke-width: 2.5;
}

/* 主要字段突出 */
.primary-item .modern-input .el-input__wrapper {
  border: 2px solid var(--theme-primary-light);
  background: linear-gradient(
    135deg,
    var(--theme-card-bg) 0%,
    rgba(var(--theme-primary-rgb), 0.02) 100%
  );
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.08);
}

.primary-item .modern-input .el-input__wrapper:focus {
  border-color: var(--theme-primary);
  box-shadow:
    0 4px 12px rgba(var(--theme-primary-rgb), 0.15),
    0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
}

/* 全宽字段 */
.full-width {
  grid-column: 1 / -1;
}

/* 文本域特殊样式 */
.modern-input .el-textarea__inner {
  border-radius: 12px;
  border: 2px solid var(--theme-border-secondary);
  background: var(--theme-card-bg);
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  resize: none;
}

.modern-input .el-textarea__inner:hover {
  border-color: var(--theme-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.modern-input .el-textarea__inner:focus {
  border-color: var(--theme-primary);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 0 0 4px rgba(var(--theme-primary-rgb), 0.1);
  outline: none;
}

/* 输入框前缀图标 */
.modern-input .el-input__prefix {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4px;
}

.modern-input .el-input__prefix svg {
  width: 16px;
  height: 16px;
  color: var(--theme-text-tertiary);
  transition: color 0.3s ease;
}

.modern-input .el-input__wrapper.is-focus .el-input__prefix svg {
  color: var(--theme-primary);
}

/* 增强的底部按钮 */
.enhanced-footer {
  background: linear-gradient(135deg, var(--theme-bg-tertiary) 0%, var(--theme-bg-secondary) 100%);
  padding: 28px 36px;
  border-top: 2px solid var(--theme-border-primary);
  gap: 16px;
}

.enhanced-cancel {
  padding: 14px 28px;
  font-size: 14px;
  border-width: 2px;
  position: relative;
  overflow: hidden;
}

.enhanced-cancel::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--theme-primary-light), transparent);
  transition: left 0.6s ease;
  transform: translateY(-50%);
}

.enhanced-cancel:hover::before {
  left: 100%;
}

.enhanced-confirm {
  padding: 14px 28px;
  font-size: 14px;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--theme-primary) 0%,
    var(--theme-primary-light) 50%,
    var(--theme-primary) 100%
  );
  background-size: 200% 100%;
  transition: all 0.4s ease;
}

.enhanced-confirm:hover {
  background-position: 100% 0;
  transform: translateY(-3px);
  box-shadow:
    0 8px 25px rgba(var(--theme-primary-rgb), 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2);
}

.enhanced-confirm:active {
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-management-page .modern-dialog {
    width: 95% !important;
    margin: 10px;
  }

  .modern-form,
  .material-form {
    padding: 32px 20px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .form-section {
    padding: 20px 16px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .dialog-footer,
  .enhanced-footer {
    padding: 20px 16px;
    flex-direction: column-reverse;
    gap: 12px;
  }

  .cancel-btn,
  .confirm-btn,
  .enhanced-cancel,
  .enhanced-confirm {
    width: 100%;
    justify-content: center;
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .material-management-page .modern-dialog {
    width: 100% !important;
    margin: 0;
    border-radius: 0;
    height: 100vh;
  }

  .dialog-icon {
    display: none;
  }

  .modern-form,
  .material-form {
    padding-top: 24px;
  }
}

/* 继承原有样式 */
.material-management-page .el-empty {
  padding: 40px 0;
}

.material-management-page .el-empty__description {
  color: var(--theme-text-tertiary);
  font-size: 14px;
}

/* 价格弹窗专用样式 */
.price-dialog {
  .el-dialog {
    border-radius: 20px;
    overflow: hidden;
  }

  .el-dialog__body {
    padding: 0;
  }
}

/* 固定高度弹窗样式 */
.fixed-height-dialog {
  .el-dialog {
    height: 80vh;
    max-height: 800px;
    margin: 0 auto;
    margin-top: 10vh;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__header {
    flex-shrink: 0;
    padding: 24px 24px 0;
  }

  .el-dialog__body {
    flex: 1;
    overflow: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__footer {
    flex-shrink: 0;
    padding: 16px 24px 24px;
  }
}

.dialog-body-wrapper {
  height: 50vh;
  display: flex;
  flex-direction: column;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 滚动条样式优化 */
.scrollable-content::-webkit-scrollbar {
  width: 6px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: var(--theme-background-secondary);
  border-radius: 3px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: var(--theme-border-primary);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: var(--theme-text-tertiary);
}

.price-form {
  .section-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--theme-border-secondary);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 700;
    color: var(--theme-text-primary);
    margin-bottom: 6px;
  }

  .section-icon {
    width: 20px;
    height: 20px;
    color: var(--theme-primary);
  }

  .section-description {
    font-size: 14px;
    color: var(--theme-text-secondary);
    margin-left: 32px;
  }
}

.material-selection-section,
.price-info-section {
  padding: 32px;
  background: var(--theme-card-bg);
  margin-bottom: 0;
}

.price-info-section {
  background: linear-gradient(
    135deg,
    var(--theme-card-bg) 0%,
    rgba(var(--theme-primary-rgb), 0.02) 100%
  );
  border-top: 1px solid rgba(var(--theme-primary-rgb), 0.1);
}

.form-item-full {
  margin-bottom: 0;

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
    font-weight: 600;

    .label-text {
      color: var(--theme-text-primary);
      font-size: 14px;
    }

    .label-required {
      color: var(--theme-error);
      font-size: 14px;
    }
  }

  .el-form-item__content {
    margin-left: 0;
  }
}

.price-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.price-field {
  .form-item-grid {
    margin-bottom: 0;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
    font-weight: 600;

    .label-text {
      color: var(--theme-text-primary);
      font-size: 14px;
    }

    .label-required {
      color: var(--theme-error);
      font-size: 14px;
    }
  }

  .el-form-item__content {
    margin-left: 0;
  }
}

.quarter-select-wrapper {
  position: relative;
}

.quarter-select {
  .quarter-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;

    .quarter-text {
      font-weight: 500;
    }

    .quarter-icon {
      width: 16px;
      height: 16px;
      color: var(--theme-primary);
      opacity: 0.7;
    }
  }
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;

  .price-input-container {
    display: flex;
    align-items: center;
    position: relative;
    flex: 1;

    .currency-symbol {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-weight: 700;
      font-size: 16px;
      color: var(--theme-primary);
      z-index: 10;
      pointer-events: none;
    }

    .price-number-input {
      .el-input__wrapper {
        padding-left: 40px;
        font-size: 16px;
        font-weight: 600;

        .el-input__inner {
          font-weight: 600;
          color: var(--theme-text-primary);
        }
      }
    }
  }

  .price-unit {
    font-size: 14px;
    font-weight: 600;
    color: var(--theme-text-secondary);
    background: var(--theme-bg-secondary);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--theme-border-secondary);
  }
}

.material-select {
  .material-option-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;

    .material-name {
      font-weight: 600;
      color: var(--theme-text-primary);
      font-size: 14px;
    }

    .material-spec {
      font-size: 12px;
      color: var(--theme-text-secondary);
      opacity: 0.8;
    }
  }
}

.price-preview {
  background: linear-gradient(
    135deg,
    rgba(var(--theme-primary-rgb), 0.05),
    rgba(var(--theme-secondary-rgb), 0.05)
  );
  border: 1px solid rgba(var(--theme-primary-rgb), 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-weight: 600;
    color: var(--theme-text-primary);

    .preview-icon {
      width: 18px;
      height: 18px;
      color: var(--theme-primary);
    }
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .preview-label {
      font-size: 14px;
      color: var(--theme-text-secondary);
      font-weight: 500;
    }

    .preview-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--theme-text-primary);

      &.price {
        font-size: 18px;
        color: var(--theme-primary);
        background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }
  }
}

.modern-footer {
  padding: 24px 32px;
  background: var(--theme-bg-secondary);
  border-top: 1px solid var(--theme-border-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .cancel-btn,
  .confirm-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    border-radius: 10px;
    padding: 12px 24px;
    transition: all 0.3s ease;

    .btn-icon {
      width: 16px;
      height: 16px;
    }
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid var(--theme-border-secondary);
    color: var(--theme-text-secondary);

    &:hover {
      border-color: var(--theme-primary);
      color: var(--theme-primary);
      transform: translateY(-1px);
    }
  }

  .confirm-btn {
    background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
    border: 1px solid var(--theme-primary);
    color: white;
    box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);

    &:hover {
      background: linear-gradient(135deg, var(--theme-primary-light), var(--theme-primary));
      box-shadow: 0 8px 24px rgba(var(--theme-primary-rgb), 0.4);
      transform: translateY(-1px) scale(1.02);
    }
  }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .price-dialog {
    .el-dialog {
      width: 95% !important;
      margin: 10px;
    }
  }

  .price-fields-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .material-selection-section,
  .price-info-section {
    padding: 20px;
  }

  .modern-footer {
    padding: 20px;
    flex-direction: column;

    .cancel-btn,
    .confirm-btn {
      width: 100%;
      justify-content: center;
    }
  }
}

/* 新增响应式设计优化 */
@media (max-width: 1200px) {
  .material-management-page {
    padding: 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .filter-section {
    padding: 24px;
  }

  .header-right {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-title::before {
    font-size: 20px;
  }

  .header-right {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-right .el-button {
    flex: 1;
    min-width: 120px;
    padding: 10px 16px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stats-content {
    padding: 20px;
  }

  .stats-icon {
    width: 48px;
    height: 48px;
  }

  .stats-value {
    font-size: 24px;
  }

  .filter-section {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .material-management-page {
    padding: 8px;
  }

  .page-header {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right .el-button {
    width: 100%;
    min-width: auto;
  }

  .stats-content {
    padding: 16px;
  }
}

/* 物资选择器加载更多样式 */
.load-more-option {
  padding: 8px 16px;
  text-align: center;
  color: var(--theme-text-tertiary);
  cursor: pointer;
  border-top: 1px solid var(--theme-border-secondary);
  background: var(--theme-bg-tertiary);
  transition: all 0.2s ease;
}

.load-more-option:hover {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-secondary);
}

.load-more-option .loading-icon {
  margin-right: 4px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
