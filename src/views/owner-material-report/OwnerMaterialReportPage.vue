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

    <!-- 统计概览 -->
    <el-card v-if="statisticsData.totalMaterials" class="statistics-card">
      <div class="statistics-header">
        <el-icon class="statistics-icon"><DataAnalysis /></el-icon>
        <span>统计概览</span>
      </div>
      <div class="statistics-grid">
        <div class="stat-item">
          <div class="stat-value">{{ statisticsData.totalMaterials || 0 }}</div>
          <div class="stat-label">总物资条数</div>
        </div>
        <div class="stat-item warning">
          <div class="stat-value">{{ statisticsData.zeroQuantityMaterials || 0 }}</div>
          <div class="stat-label">零申领物资</div>
        </div>
        <div class="stat-item success">
          <div class="stat-value">{{ statisticsData.highQuantityMaterials || 0 }}</div>
          <div class="stat-label">高需求物资</div>
        </div>
        <div class="stat-item info">
          <div class="stat-value">{{ statisticsData.uniqueSuppliers || 0 }}</div>
          <div class="stat-label">供应商数量</div>
        </div>
        <div class="stat-item primary">
          <div class="stat-value">¥{{ (statisticsData.totalValue || 0).toLocaleString() }}</div>
          <div class="stat-label">预估总价值</div>
        </div>
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
                部分物资申领数为 0，如二层以太网交换机（4 光 4 电接口,不支持串口）、10kV 配电型避雷器等。可能是这些物资在当前项目中暂时不需要，或者在其他地方已有足够库存。建议与相关项目负责人沟通，确认是否真的不需要这些物资，避免后续紧急需求时供应不及时。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">高需求物资</span>
              </div>
              <div class="analysis-text">
                一些物资申领数较多，如 10kV 铜芯交联聚乙烯绝缘电力电缆、HDPE 管等。需要关注这些物资的供应情况，与供应商确认是否有足够的库存，以确保项目顺利进行。
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
                深圳市惠程信息科技股份有限公司供应了多种物资，如 10kV 冷缩中间头、10kV 全冷缩户内终端头、10kV 全冷缩户外终端头等。可以与该供应商建立更紧密的合作关系，争取更好的价格和服务。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon info"><InfoFilled /></el-icon>
                <span class="analysis-label">供应商对比</span>
              </div>
              <div class="analysis-text">
                对于不同供应商供应的同类型物资，如不同厂家的 10kV 铜芯交联聚乙烯绝缘电力电缆，可以对比价格、质量和服务，选择更优的供应商。
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
                10kV 铜芯交联聚乙烯绝缘电力电缆的总价较高，在采购时需要重点关注价格波动情况，寻找降低成本的方法，如批量采购、与供应商谈判等。
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
                部分数据存在小数位数较多的情况，如 10kV 铜芯交联聚乙烯绝缘电力电缆的申领数为 5.542000000000001 千米，可能会影响数据的可读性和准确性。建议在数据处理时进行适当的四舍五入。
              </div>
            </div>
            <div class="analysis-item">
              <div class="analysis-type">
                <el-icon class="analysis-icon danger"><CircleCloseFilled /></el-icon>
                <span class="analysis-label">数据缺失</span>
              </div>
              <div class="analysis-text">
                规格型号存在 null 值的情况，可能会在物资采购和验收时造成混淆。建议补充完整规格型号信息，确保物资的准确性。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <el-button @click="handleBack">关闭</el-button>
      <el-button type="primary" @click="handleExport" :loading="exporting" :icon="exporting ? null : Printer">
        {{ exporting ? '准备打印中...' : '打印/导出PDF' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryTaskLinkProjectInfo } from '@/utils/backendWorkflow'
import { useOwnerMaterialStore } from '@/stores/ownerMaterial'
import OwnerMaterialService from '@/services/OwnerMaterialService'
import { Document, Shop, Coin, DataAnalysis, Warning, InfoFilled, CircleCheckFilled, CircleCloseFilled, Printer } from '@element-plus/icons-vue'
import { 
  calculateStatistics, 
  handlePrint,
  hasValidLlmReport,
  formatLlmReportSections
} from './utils.js'

const router = useRouter()
const route = useRoute()
const ownerMaterialStore = useOwnerMaterialStore()

const loading = ref(false)
const exporting = ref(false)
const reportTime = ref('')
const materialsData = ref([])
const statisticsData = ref({})

const projectInfo = ref({
  projectName: '项目名称占位',
  projectNumber: '项目编号占位'
})

// 获取任务ID
const taskId = computed(() => route.params.taskId)

// 添加报告内容数据
const reportData = ref({
  hasLlmReport: false,
  reportSections: []
})

const handleBack = () => {
  router.back()
}

// 使用工具函数处理导出
const handleExport = async () => {
  exporting.value = true
  
  handlePrint(
    projectInfo.value.projectName || '项目',
    (message) => {
      ElMessage({
        message,
        type: 'success',
        duration: 5000
      })
      exporting.value = false
    },
    (error) => {
      ElMessage.error(error)
      exporting.value = false
    }
  )
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

// 加载物资数据以进行分析 - 优先使用详细对平结果接口
const loadMaterialsData = async () => {
  if (!taskId.value) {
    console.warn('缺少任务ID')
    return
  }

  try {
    // 首先尝试使用详细对平结果接口
    const balanceResult = await OwnerMaterialService.queryBalanceDetails({
      taskId: taskId.value,
      page: 0,
      size: 1000 // 获取所有数据用于分析
    })
    
    if (balanceResult && balanceResult.content && balanceResult.content.length > 0) {
      // 转换详细对平结果为分析所需格式
      materialsData.value = transformBalanceDetailsForAnalysis(balanceResult.content)
      console.log('使用详细对平结果数据进行分析:', materialsData.value.length, '条记录')
    } else {
      // 如果没有详细对平数据，尝试使用原有接口作为后备
      await loadMaterialsDataFallback()
    }
    
    // 计算统计数据
    calculateMaterialsStatistics()
  } catch (error) {
    console.error('加载详细对平数据失败:', error)
    // 使用后备方案
    await loadMaterialsDataFallback()
  }
}

// 后备数据加载方法
const loadMaterialsDataFallback = async () => {
  try {
    console.log('使用后备接口加载数据...')
    const response = await OwnerMaterialService.queryMaterialsApplyData({
      taskDetailId: taskId.value
    })
    
    materialsData.value = response || []
    console.log('后备接口加载数据:', materialsData.value.length, '条记录')
  } catch (error) {
    console.error('后备接口也失败了:', error)
    materialsData.value = []
  }
}

// 转换详细对平结果数据为分析格式
const transformBalanceDetailsForAnalysis = (balanceDetails) => {
  return balanceDetails.map(item => ({
    // 基础信息
    id: item.detailId,
    materialName: item.baseMaterialName || item.usageMaterialName,
    specifications: item.baseSpecificationModel || item.usageSpecificationModel,
    unit: item.baseUnit,
    
    // 数量信息（合并用料和退料）
    quantity: Math.abs(item.transactionQuantity || 0),
    requisitionQuantity: item.requisitionQuantity || 0,
    
    // 价格信息（暂时设为0，因为API中没有）
    unitPrice: 0,
    totalPrice: 0,
    
    // 供应商信息
    supplier: item.supplierName,
    supplierName: item.supplierName,
    
    // 状态信息
    balanceStatus: item.finalBalanceStatus,
    transactionType: item.transactionQuantity >= 0 ? 'usage' : 'return',
    
    // 数据源
    dataSourcePath: item.dataSourcePath,
    transactionCount: item.transactionCountForSummary,
    
    // 原始数据
    originalData: item
  }))
}

// 计算统计数据（使用工具函数）
const calculateMaterialsStatistics = () => {
  statisticsData.value = calculateStatistics(materialsData.value)
}

// 加载报告内容数据（使用工具函数）
const loadReportData = async (taskId) => {
  try {
    // 尝试获取来自重新解析工作流的 llmReport 数据
    const llmReport = ownerMaterialStore.getLlmReport(taskId)
    
    if (hasValidLlmReport(llmReport)) {
      reportData.value.hasLlmReport = true
      reportData.value.reportSections = formatLlmReportSections(llmReport)
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
    
    // 获取项目信息和数据
    if (taskId.value) {
      await Promise.all([
        loadProjectInfo(taskId.value),
        loadReportData(taskId.value),
        loadMaterialsData()
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

/* 统计卡片样式 */
.statistics-card {
  margin-bottom: 32px;
  padding: 24px 32px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: 0 8px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
}

.statistics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.1);
}

.statistics-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-color);
}

.statistics-icon {
  font-size: 24px;
  color: var(--accent-color);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  background: rgba(79, 70, 229, 0.02);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px var(--shadow-color);
  border-color: rgba(79, 70, 229, 0.15);
}

.stat-item.warning {
  border-color: rgba(220, 104, 3, 0.2);
  background: rgba(220, 104, 3, 0.02);
}

.stat-item.success {
  border-color: rgba(13, 148, 136, 0.2);
  background: rgba(13, 148, 136, 0.02);
}

.stat-item.info {
  border-color: rgba(8, 145, 178, 0.2);
  background: rgba(8, 145, 178, 0.02);
}

.stat-item.primary {
  border-color: rgba(79, 70, 229, 0.2);
  background: rgba(79, 70, 229, 0.02);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-color);
  margin-bottom: 8px;
}

.stat-item.warning .stat-value {
  color: var(--warning-color);
}

.stat-item.success .stat-value {
  color: var(--success-color);
}

.stat-item.info .stat-value {
  color: var(--info-color);
}

.stat-item.primary .stat-value {
  color: var(--primary-color);
}

.stat-label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
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

/* 确保导出时的样式一致性和文字可复制性 */
.owner-material-report-page * {
  -webkit-print-color-adjust: exact !important;
  color-adjust: exact !important;
  print-color-adjust: exact !important;
  
  /* 优化文字渲染 */
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* PDF导出时的文字优化 */
.owner-material-report-page {
  font-family: 'Arial', 'Microsoft YaHei', '微软雅黑', sans-serif;
}

/* 确保文字在PDF中清晰可读 */
.owner-material-report-page h1,
.owner-material-report-page h2,
.owner-material-report-page h3,
.owner-material-report-page h4,
.owner-material-report-page p,
.owner-material-report-page span,
.owner-material-report-page div {
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
  
  .owner-material-report-page {
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
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    color: #333 !important;
  }
  
  /* 表格样式（如果有） */
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    font-size: 10pt !important;
  }
  
  table, th, td {
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