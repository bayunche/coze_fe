<template>
  <div v-loading="loading" class="supplier-material-report-page">
    <div class="page-header">
      <h2>乙供物资解析报告</h2>
      <el-button @click="handleBack" type="info">返回</el-button>
    </div>

    <el-card class="project-info-card">
      <div class="card-item">
        <span class="label">项目名称:</span>
        <span class="value">{{ projectInfo.projectName }}</span>
      </div>
      <div class="card-item">
        <span class="label">项目编号:</span>
        <span class="value">{{ projectInfo.projectNumber }}</span>
      </div>
      <div class="card-item">
        <span class="label">报告生成时间:</span>
        <span class="value">{{ reportTime }}</span>
      </div>
    </el-card>

    <!-- 动态显示 reportData 内容 -->
    <div v-if="reportData.hasLlmReport">
      <div
        v-for="(section, index) in reportData.reportSections"
        :key="index"
        class="report-section"
      >
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Document /></el-icon>
            <span>{{ section.title }}</span>
          </div>
          <div class="section-badge">AI分析</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <!-- 如果内容是对象，遍历显示子项 -->
            <div v-if="section.type === 'object'" class="analysis-item">
              <div
                v-for="(subcontent, subkey) in section.content"
                :key="subkey"
                class="analysis-subitem"
              >
                <div class="analysis-type">
                  <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                  <span class="analysis-label">{{ subkey }}</span>
                </div>
                <div class="analysis-text">{{ subcontent }}</div>
              </div>
            </div>
            <!-- 如果内容是文本，直接显示 -->
            <div v-else class="analysis-item">
              <div class="analysis-text">{{ section.content }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 如果没有 reportData 数据，显示默认模板 -->
    <div v-else>
      <!-- 物资解析情况分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Document /></el-icon>
            <span>物资解析情况分析</span>
          </div>
          <div class="section-badge">解析结果</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon success"><CircleCheckFilled /></el-icon>
                <span class="analysis-label">智能匹配成功</span>
              </div>
              <div class="analysis-text">
                大部分物资已成功通过智能算法匹配到标准物资库中，包括规格型号、单位、价格等关键信息。匹配准确率较高，可以直接使用于后续的采购和结算流程。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">未匹配物资</span>
              </div>
              <div class="analysis-text">
                部分物资由于规格特殊或名称不标准，未能自动匹配。建议人工核实这些物资的具体规格和供应商信息，确保采购的准确性。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 价格匹配分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Coin /></el-icon>
            <span>价格匹配分析</span>
          </div>
          <div class="section-badge">价格对比</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">价格一致性</span>
              </div>
              <div class="analysis-text">
                通过对比结算书价格与系统标准价格，发现大部分物资价格保持一致。对于存在价格差异的物资，建议核实市场价格变化情况。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">价格异常物资</span>
              </div>
              <div class="analysis-text">
                发现部分物资价格与标准价格存在较大差异，可能由于市场波动、供应商变更或规格差异导致。建议重点关注这些物资的价格合理性。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 供应商分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Shop /></el-icon>
            <span>供应商分析</span>
          </div>
          <div class="section-badge">供应商评估</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon success"><CircleCheckFilled /></el-icon>
                <span class="analysis-label">主要供应商</span>
              </div>
              <div class="analysis-text">
                项目涉及多家供应商，其中重点供应商提供了大部分关键物资。建议与这些供应商保持良好合作关系，确保供货稳定性。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">供应商多样性</span>
              </div>
              <div class="analysis-text">
                通过多家供应商分散采购风险，有利于价格竞争和供货保障。建议定期评估供应商表现，优化供应商结构。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据质量分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><DataAnalysis /></el-icon>
            <span>数据质量分析</span>
          </div>
          <div class="section-badge">质量评估</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon success"><CircleCheckFilled /></el-icon>
                <span class="analysis-label">数据完整性</span>
              </div>
              <div class="analysis-text">
                大部分物资数据完整，包含必要的名称、规格、数量、单位、价格等信息，满足后续处理需求。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">数据规范性</span>
              </div>
              <div class="analysis-text">
                部分物资名称和规格型号存在格式不统一的情况，建议标准化数据格式，提高数据质量和处理效率。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button
        type="primary"
        @click="handleExport"
        :loading="exporting"
        :icon="exporting ? null : Printer"
      >
        {{ exporting ? '准备打印中...' : '打印/导出PDF' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryTaskLinkProjectInfo } from '@/utils/backendWorkflow'
import { useSupplierMaterialStore } from '@/stores/supplierMaterial'
import { formatReportData, generateExportFileName, setupPrintMode } from './utils'
import {
  Document,
  Shop,
  Coin,
  DataAnalysis,
  Warning,
  InfoFilled,
  CircleCheckFilled,
  Printer
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const supplierMaterialStore = useSupplierMaterialStore()

const loading = ref(false)
const exporting = ref(false)
const reportTime = ref('')

const projectInfo = ref({
  projectName: '项目名称占位',
  projectNumber: '项目编号占位'
})

// 添加报告内容数据
const reportData = ref({
  hasLlmReport: false,
  reportSections: []
})

const handleBack = () => {
  router.back()
}

const handleExport = async () => {
  try {
    exporting.value = true

    const fileName = generateExportFileName(projectInfo.value.projectName)
    const cleanup = setupPrintMode(fileName)

    // 使用浏览器原生打印功能
    window.print()

    // 恢复原始状态
    cleanup()

    ElMessage({
      message: '打印对话框已打开，请选择"另存为PDF"来保存报告，或选择打印机进行打印',
      type: 'success',
      duration: 5000
    })
  } catch (error) {
    console.error('打印失败:', error)
    ElMessage.error('打印失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 获取项目信息
const loadProjectInfo = async (taskId) => {
  try {
    const projectData = await queryTaskLinkProjectInfo(taskId)
    if (projectData) {
      projectInfo.value.projectName = projectData.projectName || '项目名称未知'
      projectInfo.value.projectNumber = projectData.projectCode || '项目编号未知'
    } else {
      // 如果API没有找到项目信息，使用占位符或URL参数
      projectInfo.value.projectName = route.query.projectName || '项目名称占位'
      projectInfo.value.projectNumber = route.query.projectNumber || '项目编号占位'
    }
  } catch (error) {
    console.error('获取项目信息失败:', error)
    // 出错时使用占位符或URL参数
    projectInfo.value.projectName = route.query.projectName || '项目名称占位'
    projectInfo.value.projectNumber = route.query.projectNumber || '项目编号占位'
  }
}

// 加载报告内容数据
const loadReportData = async (taskId) => {
  try {
    // 尝试获取来自工作流的报告数据
    const rawReportData = supplierMaterialStore.getReportData(taskId)
    
    if (rawReportData) {
      reportData.value = formatReportData(rawReportData)
      console.log('成功加载乙供物资报告数据:', rawReportData)
    } else {
      console.log('未找到乙供物资报告数据，使用默认模板')
      reportData.value = {
        hasLlmReport: false,
        reportSections: []
      }
    }
  } catch (error) {
    console.error('加载报告数据失败:', error)
    reportData.value = {
      hasLlmReport: false,
      reportSections: []
    }
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // 设置报告生成时间
    reportTime.value = new Date().toLocaleString('zh-CN')

    // 获取项目信息和报告数据
    const taskId = route.params.taskId
    if (taskId) {
      await Promise.all([
        loadProjectInfo(taskId),
        loadReportData(taskId)
      ])
    } else {
      // 从路由参数获取项目信息作为备用
      if (route.query.projectName) {
        projectInfo.value.projectName = route.query.projectName
      }
      if (route.query.projectNumber) {
        projectInfo.value.projectNumber = route.query.projectNumber
      }
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.supplier-material-report-page {
  --primary-color: #4f46e5;
  --secondary-color: #64748b;
  --accent-color: #3730a3;
  --success-color: #0d9488;
  --warning-color: #dc6803;
  --danger-color: #dc2626;
  --info-color: #0891b2;
  --background-light: #f8fafc;
  --card-background: #ffffff;
  --border-color: rgba(79, 70, 229, 0.08);
  --text-dark: #1e293b;
  --text-light: #64748b;
  --shadow-color: rgba(79, 70, 229, 0.06);

  padding: 32px;
  background-color: var(--background-light);
  min-height: 100vh;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-dark);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  color: var(--accent-color);
  font-weight: 700;
  position: relative;
  padding-left: 16px;
  text-shadow: 0 0 5px var(--shadow-color);
}

.page-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  width: 6px;
  background: var(--accent-color);
  border-radius: 3px;
  box-shadow: 0 0 6px var(--shadow-color);
}

.project-info-card {
  margin-bottom: 32px;
  padding: 24px 32px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  display: flex;
  gap: 40px;
  align-items: center;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
}

.project-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.1);
}

.card-item {
  display: flex;
  align-items: center;
}

.card-item .label {
  font-weight: 500;
  color: var(--text-light);
  margin-right: 16px;
  min-width: 100px;
  font-size: 14px;
}

.card-item .value {
  color: var(--accent-color);
  font-size: 16px;
  font-weight: 600;
  background-color: rgba(79, 70, 229, 0.03);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(79, 70, 229, 0.08);
}

.report-section {
  margin-bottom: 32px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(79, 70, 229, 0.01));
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--accent-color);
}

.section-icon {
  font-size: 24px;
  color: var(--accent-color);
}

.section-badge {
  background: var(--accent-color);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.section-content {
  padding: 32px;
}

/* 分析内容样式 */
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.analysis-item {
  background: rgba(79, 70, 229, 0.02);
  border-radius: 10px;
  padding: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.analysis-subitem {
  background: rgba(79, 70, 229, 0.01);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(79, 70, 229, 0.05);
  transition: all 0.3s ease;
}

.analysis-subitem:last-child {
  margin-bottom: 0;
}

.analysis-subitem:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
  border-color: rgba(79, 70, 229, 0.1);
}

.analysis-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px var(--shadow-color);
  border-color: rgba(79, 70, 229, 0.15);
}

.analysis-type {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.analysis-icon {
  font-size: 20px;
}

.analysis-icon.warning {
  color: var(--warning-color);
}

.analysis-icon.info {
  color: var(--info-color);
}

.analysis-icon.success {
  color: var(--success-color);
}

.analysis-icon.danger {
  color: var(--danger-color);
}

.analysis-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.analysis-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-light);
  text-align: justify;
  background: var(--card-background);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(79, 70, 229, 0.05);
}

.page-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.el-button {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

/* PDF导出样式优化 */
@media print {
  .page-header .el-button,
  .page-footer {
    display: none !important;
  }

  .supplier-material-report-page {
    padding: 20px !important;
    background: white !important;
    box-shadow: none !important;
  }

  .report-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .analysis-item {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .project-info-card {
    page-break-after: avoid;
  }

  .section-header {
    page-break-after: avoid;
  }
}

/* 确保导出时的样式一致性和文字可复制性 */
.supplier-material-report-page * {
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;

  /* 优化文字渲染 */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* PDF导出时的文字优化 */
.supplier-material-report-page {
  font-family: 'Arial', 'Microsoft YaHei', '微软雅黑', sans-serif;
}

/* 确保文字在PDF中清晰可读 */
.supplier-material-report-page h1,
.supplier-material-report-page h2,
.supplier-material-report-page h3,
.supplier-material-report-page h4,
.supplier-material-report-page p,
.supplier-material-report-page span,
.supplier-material-report-page div {
  font-weight: normal;
  line-height: 1.6;
  letter-spacing: 0.5px;
}

/* 页面分割线，用于更好的PDF分页 */
.page-break-before {
  page-break-before: always;
  break-before: page;
}

.page-break-after {
  page-break-after: always;
  break-after: page;
}

/* 打印专用样式 */
@media print {
  /* 隐藏不需要打印的元素 */
  .page-header .el-button,
  .export-button,
  button,
  .no-print {
    display: none !important;
  }

  /* 页面设置 */
  @page {
    size: A4;
    margin: 20mm;
  }

  /* 重置页面样式 */
  * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    font-size: 12pt !important;
    line-height: 1.5 !important;
  }

  .supplier-material-report-page {
    padding: 0 !important;
    background: white !important;
    box-shadow: none !important;
    margin: 0 !important;
    max-width: none !important;
    min-height: auto !important;
  }

  /* 标题样式 */
  .page-header {
    margin-bottom: 20pt !important;
    border-bottom: 1pt solid #333 !important;
    padding-bottom: 10pt !important;
  }

  .page-header h2 {
    font-size: 18pt !important;
    color: #333 !important;
    text-shadow: none !important;
    margin: 0 !important;
  }

  .page-header h2::before {
    display: none !important;
  }

  /* 项目信息卡片 */
  .project-info-card {
    background: white !important;
    border: 1pt solid #333 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 15pt !important;
    margin-bottom: 20pt !important;
    page-break-inside: avoid;
  }

  /* 报告内容样式 */
  .report-section {
    page-break-inside: avoid;
    margin-bottom: 15pt !important;
  }

  .section-header {
    font-size: 14pt !important;
    font-weight: bold !important;
    color: #333 !important;
    margin-bottom: 8pt !important;
    page-break-after: avoid;
  }

  .section-content {
    font-size: 11pt !important;
    line-height: 1.4 !important;
    color: #333 !important;
  }

  /* 分析项目样式 */
  .analysis-item {
    page-break-inside: avoid;
    margin-bottom: 12pt !important;
    border-bottom: 0.5pt solid #ddd !important;
    padding-bottom: 8pt !important;
  }

  .analysis-item h4 {
    font-size: 12pt !important;
    font-weight: bold !important;
    margin-bottom: 5pt !important;
    color: #333 !important;
  }

  .analysis-item p {
    font-size: 11pt !important;
    margin: 0 !important;
    line-height: 1.4 !important;
  }

  /* 图标在打印时隐藏或简化 */
  .el-icon {
    display: none !important;
  }

  /* 强制分页位置 */
  .page-break-before {
    page-break-before: always !important;
  }

  .page-break-after {
    page-break-after: always !important;
  }

  /* 避免孤立的标题 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    page-break-after: avoid;
    color: #333 !important;
  }

  /* 表格样式（如果有） */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    font-size: 10pt !important;
  }

  table,
  th,
  td {
    border: 0.5pt solid #333 !important;
    padding: 4pt !important;
  }

  th {
    background-color: #f5f5f5 !important;
    font-weight: bold !important;
  }
}

/* 打印状态下的body样式 */
body.printing {
  overflow: hidden;
}
</style>