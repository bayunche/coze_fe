<template>
  <div v-loading="loading" class="owner-material-report-page">
    <div class="page-header">
      <h2>甲供物资解析报告</h2>
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

    <!-- 动态显示 llmReport 内容 -->
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

    <!-- 如果没有 llmReport 数据，显示默认模板 -->
    <div v-else>
      <!-- 物资申领情况分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Document /></el-icon>
            <span>物资申领情况分析</span>
          </div>
          <div class="section-badge">关键发现</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">零申领物资</span>
              </div>
              <div class="analysis-text">
                部分物资申领数为 0，如二层以太网交换机（4 光 4 电接口,不支持串口）、10kV
                配电型避雷器等。可能是这些物资在当前项目中暂时不需要，或者在其他地方已有足够库存。建议与相关项目负责人沟通，确认是否真的不需要这些物资，避免后续紧急需求时供应不及时。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">高需求物资</span>
              </div>
              <div class="analysis-text">
                一些物资申领数较多，如 10kV 铜芯交联聚乙烯绝缘电力电缆、HDPE
                管等。需要关注这些物资的供应情况，与供应商确认是否有足够的库存，以确保项目顺利进行。
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
          <div class="section-badge">优化建议</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon success"><CircleCheckFilled /></el-icon>
                <span class="analysis-label">重点供应商</span>
              </div>
              <div class="analysis-text">
                深圳市惠程信息科技股份有限公司供应了多种物资，如 10kV 冷缩中间头、10kV
                全冷缩户内终端头、10kV
                全冷缩户外终端头等。可以与该供应商建立更紧密的合作关系，争取更好的价格和服务。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">供应商对比</span>
              </div>
              <div class="analysis-text">
                对于不同供应商供应的同类型物资，如不同厂家的 10kV
                铜芯交联聚乙烯绝缘电力电缆，可以对比价格、质量和服务，选择更优的供应商。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成本分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><Coin /></el-icon>
            <span>成本分析</span>
          </div>
          <div class="section-badge">成本优化</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">高成本物资</span>
              </div>
              <div class="analysis-text">
                10kV
                铜芯交联聚乙烯绝缘电力电缆的总价较高，在采购时需要重点关注价格波动情况，寻找降低成本的方法，如批量采购、与供应商谈判等。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">隐性成本</span>
              </div>
              <div class="analysis-text">
                对于申领数为 0 的物资，虽然当前没有成本支出，但也需要考虑存储成本和潜在的过期风险。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据准确性分析 -->
      <div class="report-section">
        <div class="section-header">
          <div class="section-title">
            <el-icon class="section-icon"><DataAnalysis /></el-icon>
            <span>数据准确性分析</span>
          </div>
          <div class="section-badge">数据质量</div>
        </div>
        <div class="section-content">
          <div class="analysis-content">
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon warning"><Warning /></el-icon>
                <span class="analysis-label">数据精度问题</span>
              </div>
              <div class="analysis-text">
                部分数据存在小数位数较多的情况，如 10kV 铜芯交联聚乙烯绝缘电力电缆的申领数为
                5.542000000000001
                千米，可能会影响数据的可读性和准确性。建议在数据处理时进行适当的四舍五入。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon danger"><CircleCloseFilled /></el-icon>
                <span class="analysis-label">数据缺失</span>
              </div>
              <div class="analysis-text">
                规格型号存在 null
                值的情况，可能会在物资采购和验收时造成混淆。建议补充完整规格型号信息，确保物资的准确性。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting">
        {{ exporting ? '正在导出...' : '导出报告' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryTaskLinkProjectInfo, getOwnerMaterialLlmReport } from '@/utils/backendWorkflow'
import {
  Document,
  Shop,
  Coin,
  DataAnalysis,
  Warning,
  InfoFilled,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import html2pdf from 'html2pdf.js'

const router = useRouter()
const route = useRoute()

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

    // 获取报告内容元素
    const element = document.querySelector('.owner-material-report-page')

    // 配置PDF选项
    const options = {
      margin: [10, 10, 10, 10],
      filename: `甲供物资解析报告_${
        projectInfo.value.projectName || '项目'
      }_${new Date().toLocaleDateString('zh-CN')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }

    // 生成PDF
    await html2pdf().set(options).from(element).save()

    ElMessage.success('PDF报告导出成功！')
  } catch (error) {
    console.error('导出PDF失败:', error)
    ElMessage.error('导出PDF失败，请重试')
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
    // 尝试获取来自重新解析工作流的 llmReport 数据
    const llmReport = getOwnerMaterialLlmReport(taskId)

    if (llmReport && typeof llmReport === 'object') {
      reportData.value.hasLlmReport = true
      reportData.value.reportSections = Object.entries(llmReport).map(([category, content]) => ({
        title: category,
        content: content,
        type: typeof content === 'object' ? 'object' : 'text'
      }))
      console.log('成功加载 llmReport 数据:', llmReport)
    } else {
      console.log('未找到 llmReport 数据，使用默认模板')
      reportData.value.hasLlmReport = false
      reportData.value.reportSections = []
    }
  } catch (error) {
    console.error('加载报告数据失败:', error)
    reportData.value.hasLlmReport = false
    reportData.value.reportSections = []
  }
}

onMounted(async () => {
  loading.value = true
  try {
    // 设置报告生成时间
    reportTime.value = new Date().toLocaleString('zh-CN')

    // 获取项目信息
    const taskId = route.params.taskId || route.query.taskId
    if (taskId) {
      await loadProjectInfo(taskId)
      await loadReportData(taskId)
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
.owner-material-report-page {
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

/* 物资申领情况分析样式 */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
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

  .owner-material-report-page {
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

/* 确保导出时的样式一致性 */
.owner-material-report-page * {
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
}
</style>
