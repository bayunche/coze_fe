<template>
  <div class="agent-dashboard">
    <!-- 侧边栏 -->
    <SidebarNav
      :functions="functions"
      :active-function="activeFunction"
      @select="handleFunctionSelect"
    />

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部栏 -->
      <HeaderBar
        :current-function-name="getCurrentFunctionName()"
        :execution-logs-count="executionLogs.length"
        :active-function="activeFunction"
        @show-workflow-config="showWorkflowConfig = true"
      />

      <!-- 主要内容 -->
      <el-main class="main-content">
        <div class="workflow-panel">
          <!-- 任务执行面板 -->
          <WorkflowExecutionPanel
            :current-workflow="currentWorkflow"
            :last-execution-result="lastExecutionResult"
            :is-executing="isExecuting"
            :workflow-elapsed-time="workflowElapsedTime"
            :current-step-index="currentStepIndex"
            :step-progress="stepProgress"
            :get-step-status="getStepStatus"
            :get-logs-for-last-execution="getLogsForLastExecution"
            :get-log-tag-type="getLogTagType"
            :get-log-type-text="getLogTypeText"
            :format-log-details="formatLogDetails"
            @show-workflow-config="showWorkflowConfig = true"
            @view-result-detail="handleViewResultDetail"
          />

          <!-- 执行历史 -->
          <!-- <ExecutionHistory
            :execution-history="executionHistory"
            @clear-history="clearHistory"
            @export-history="exportHistory"
            @view-detail="viewExecutionDetail"
          /> -->
        </div>
      </el-main>
    </el-container>

    <!-- 任务配置对话框 -->
    <WorkflowConfigDialog
      v-model:show="showWorkflowConfig"
      :current-function-name="getCurrentFunctionName()"
      :config="workflowConfig"
      :needs-file-upload="needsFileUpload()"
      :allowed-file-types="getAllowedFileTypes()"
      :current-function-params="getCurrentFunctionParams()"
      @close="onConfigDialogClose"
      @start-workflow="startWorkflowFromDialog"
    />

    <!-- 结果详情对话框 -->
    <el-dialog
      v-model="showResultDetail"
      title="解析结果详情"
      width="80%"
      custom-class="result-detail-dialog"
    >
      <div v-loading="isFetchingDetails" class="result-detail-content">
        <el-table
          v-if="tableData.length > 0"
          :data="tableData"
          style="width: 100%"
          class="result-table"
          :header-cell-style="{ background: '#fafafa', color: '#333' }"
        >
          <template v-for="column in tableColumns" :key="column.prop">
            <el-table-column
              v-if="headerMapping[column.prop]"
              :prop="column.prop"
              :label="translateHeader(column.prop)"
            />
          </template>
        </el-table>
        <el-empty v-else-if="!isFetchingDetails" description="没有可展示的表格数据" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showResultDetail = false">关闭</el-button>
          <el-button type="primary" @click="handleEditResult">编辑</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑解析结果对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑解析结果"
      width="60%"
      custom-class="edit-result-dialog"
    >
      <el-form label-width="120px">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item
            v-for="(formModel, index) in editFormModels"
            :key="index"
            :title="`条目 ${index + 1}: ${formModel.name || ''}`"
            :name="index"
          >
            <template v-for="key in Object.keys(formModel)" :key="key">
              <el-form-item v-if="headerMapping[key]" :label="translateHeader(key)">
                <el-input v-model="formModel[key]" />
              </el-form-item>
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="isSaving">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'

// 导入子组件
import SidebarNav from '@/components/home/SidebarNav.vue'
import HeaderBar from '@/components/home/HeaderBar.vue'
import WorkflowExecutionPanel from '@/components/home/WorkflowExecutionPanel.vue'
import ExecutionHistory from '@/components/home/ExecutionHistory.vue'
import WorkflowConfigDialog from '@/components/home/WorkflowConfigDialog.vue'
import { functions } from '@/uitls/workflows.js'
import CozeService from '@/uitls/coze.js'

// Coze 服务实例
const cozeService = new CozeService(
  'pat_bGwPTNipEOEpfiRnILTvFipxeeRRyUrOOxSbEExv9kYPRlh5g674hTLcBSQIZj9o'
) // 请替换为你的 Coze API Key

// 响应式数据
const activeFunction = ref('')
const currentWorkflow = ref(null)
const isExecuting = ref(false)
const workflowElapsedTime = ref(0)
const currentStepIndex = ref(0)
const stepProgress = ref(0)
const showWorkflowConfig = ref(false)
const executionSessions = reactive([])
const lastExecutionResult = computed(() =>
  executionSessions.length > 0 ? executionSessions[executionSessions.length - 1] : null
)
const showResultDetail = ref(false)
const taskId = ref(null)
const tableData = ref([])
const tableColumns = ref([])
const isFetchingDetails = ref(false)

// 编辑功能
const showEditDialog = ref(false)
const editFormModels = ref([]) // 表单绑定的对象数组
const activeCollapse = ref([]) // 控制折叠面板的展开
const isSaving = ref(false)

// 表头中英文映射
const headerMapping = {
  name: '合同名称',
  number: '合同编号',
  money: '合同金额',
  pay_result: '付款依据',
  sign_time: '签订时间',
  fixed_rate: '包干率',
  anquan_rate: '安全文明施工费是否下浮',
  linshi_rate: '临时设施费是否下浮',
  position: '职位',
  salary: '薪水',
  hire_date: '入职日期',
  // ... 在这里可以添加更多的映射
};

const translateHeader = (prop) => {
  return headerMapping[prop] || prop;
};


// 任务配置
const workflowConfig = reactive({
  files: [],
  params: {},
  concurrent: false,
  errorHandling: 'stop'
})

// 执行历史
const executionHistory = reactive([
  {
    id: 1,
    workflow: '数据分析',
    function: '数据分析',
    status: 'success',
    duration: '3.2s',
    timestamp: '2024-12-15 14:30:22',
    output: { rows: 1000, insights: 15 }
  },
  {
    id: 2,
    workflow: '文档摘要',
    function: '文档处理',
    status: 'success',
    duration: '1.8s',
    timestamp: '2024-12-15 14:28:15',
    output: { summary: '文档摘要内容...', keywords: ['AI', '机器学习'] }
  }
])

// 执行日志
const executionLogs = reactive([])

let timeInterval = null

// 计算属性
const getCurrentFunctionName = () => {
  const func = functions.find((f) => f.id === activeFunction.value)
  return func ? func.name : '未知功能'
}

const getCurrentFunction = () => {
  return functions.find((f) => f.id === activeFunction.value)
}

const getCurrentFunctionParams = () => {
  const func = getCurrentFunction()
  return func ? func.params || [] : []
}

const needsFileUpload = () => {
  const func = getCurrentFunction()
  return func ? func.needsFiles : false
}

const getAllowedFileTypes = () => {
  const func = getCurrentFunction()
  return func ? func.allowedTypes || '*' : '*'
}

const getStepStatus = (index) => {
  if (index < currentStepIndex.value) return 'finish'
  if (index === currentStepIndex.value) return 'process'
  return 'wait'
}

const getLogTagType = (type) => {
  const typeMap = {
    info: '',
    success: 'success',
    warning: 'warning',
    error: 'danger',
    separator: 'info'
  }
  return typeMap[type] || ''
}

const getLogTypeText = (type) => {
  const typeMap = {
    info: '信息',
    success: '成功',
    warning: '警告',
    error: '错误',
    separator: '系统'
  }
  return typeMap[type] || type
}

const getLogsForLastExecution = () => {
  return [...executionLogs].reverse()
}

const formatLogDetails = (details) => {
  if (typeof details === 'string') {
    return details
  }
  return JSON.stringify(details, null, 2)
}

const formatDuration = (seconds) => {
  if (seconds < 0) seconds = 0

  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  let parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  if (s > 0 || parts.length === 0) parts.push(`${s}s`)

  return parts.join(' ')
}

// 方法
const handleViewResultDetail = async () => {
  if (!lastExecutionResult.value || !lastExecutionResult.value.output|| taskId.value == null) {
    ElMessage.warning('没有可供解析的结果。')
    return
  }

  showResultDetail.value = true
  isFetchingDetails.value = true
  tableData.value = []
  tableColumns.value = []

  try {
    
    const result = await cozeService.runTableGenerationWorkflow(taskId.value)
    console.log(result)
    if (result && result.data) {
      
      const parsedData = JSON.parse(result.data)?.output

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableColumns.value = Object.keys(parsedData[0]).map((key) => ({
          prop: key,
          label: key
        }))
        tableData.value = parsedData
        addLog('表格数据加载成功', 'success')
      } else {
        throw new Error('解析后的数据格式不正确或为空。')
      }
    } else {
      throw new Error('任务未返回有效的表格数据。')
    }
  } catch (error) {
    console.error('处理表格数据时出错:', error)
 
    ElMessage.error(`获取表格数据失败: ${error.message}`)
  } finally {
    isFetchingDetails.value = false
  }
}

const handleEditResult = () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有可编辑的数据。')
    return
  }
  // 深拷贝数据用于编辑，避免直接修改原始数据
  editFormModels.value = JSON.parse(JSON.stringify(tableData.value))

  // 默认展开所有折叠项
  activeCollapse.value = editFormModels.value.map((_, index) => index)

  showResultDetail.value = false
  showEditDialog.value = true
}

const cancelEdit = () => {
  showEditDialog.value = false
  showResultDetail.value = true // 返回详情弹窗
}

const saveEdit = async () => {
  isSaving.value = true
  addLog(`开始保存编辑内容，共 ${editFormModels.value.length} 条记录...`, 'info')
  try {
    const editPromises = editFormModels.value.map((item) => cozeService.runEditWorkflow(item))

    await Promise.all(editPromises)

    // 深拷贝数据以更新表格
    tableData.value = JSON.parse(JSON.stringify(editFormModels.value))
    ElMessage.success('保存成功，所有条目更新')
    addLog('所有编辑内容已成功保存', 'success')
    showEditDialog.value = false
    showResultDetail.value = true // 返回详情弹窗
  } catch (error) {
    console.error('保存编辑时出错:', error)
    ElMessage.error(`保存失败: ${error.message}`)
    addLog(`保存编辑时出错: ${error.message}`, 'error', error)
  } finally {
    isSaving.value = false
  }
}

const handleFunctionSelect = (key) => {
  activeFunction.value = key
  addLog(`切换到功能: ${getCurrentFunctionName()}`, 'info')
  resetWorkflowConfig()
  showWorkflowConfig.value = true
}

const executeWorkflow = async () => {
  const func = getCurrentFunction()
  if (!func) return

  if (func.needsFiles && workflowConfig.files.length === 0) {
    ElMessage.warning('请先上传文件')
    showWorkflowConfig.value = true
    return
  }

  const workflow = {
    id: Date.now(),
    name: `${func.name}`,
    function: func.name,
    steps: func.steps,
    startTime: Date.now()
  }

  currentWorkflow.value = workflow
  isExecuting.value = true
  currentStepIndex.value = 0
  stepProgress.value = 0
  workflowElapsedTime.value = 0

  addLog(`开始执行任务: ${workflow.name}`, 'info')

  timeInterval = setInterval(() => {
    const elapsed = (Date.now() - workflow.startTime) / 1000
    workflowElapsedTime.value = formatDuration(elapsed)
    const currentSession = executionSessions.find((s) => s.id === workflow.id)
    if (currentSession) {
      currentSession.duration = workflowElapsedTime.value
    }
  }, 100)

  try {
    currentStepIndex.value = 0 // 上传文件
    addLog(`准备上传 ${workflowConfig.files.length} 个文件...`, 'info')
    const uploadPromises = workflowConfig.files.map((file) => cozeService.uploadFile(file.raw))
    const fileIds = await Promise.all(uploadPromises)
    addLog(`所有文件上传成功，共${fileIds.length}个文件`, 'success')
    stepProgress.value = 100

    currentStepIndex.value = 1 // 文件解析
    addLog('正在调用Coze任务进行解析...', 'info')
    let inputs = []
    fileIds.forEach((fileId) => {
      inputs.push({ file_id: fileId })
    })
    const finalResult = []
    executionSessions.push({
      id: workflow.id,
      name: workflow.name,
      status: 'running',
      duration: '0.0s',
      output: '正在执行，请稍候...'
    })

    // 在后台运行解析，不阻塞UI
    cozeService.runContractParsing(inputs, {
      onMessage(event) {
  if (event.event === 'Message' && event.data.content_type === 'text') {
    const content = event.data.content

    // 统一变量
    let taskIdCandidate = null
    let displayText = null

    // 如果是对象，尝试直接提取 task_id
    if (typeof content === 'object' && content !== null) {
      if ('task_id' in content) {
        taskIdCandidate = content.task_id
      } else {
        displayText = JSON.stringify(content, null, 2)
      }
    }

    // 如果是字符串，尝试解析为 JSON
    else if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content)
        if (parsed && typeof parsed === 'object' && 'task_id' in parsed) {
          taskIdCandidate = parsed.task_id
        } else {
          displayText = content // 普通文本
        }
      } catch (e) {
        displayText = content // 非 JSON 字符串
      }
    }

    if (taskIdCandidate) {
      taskId.value = taskIdCandidate
      return
    }

    // 显示文本内容
    if (displayText) {
      addLog(displayText, 'success')
      finalResult.push(displayText)
      const currentSession = executionSessions.find((s) => s.id === workflow.id)
      if (currentSession) {
        currentSession.output = finalResult.join('\n')
      }
    }

  } else if (event.event === 'Done') {
    addLog('任务执行完成', 'info')
    completeWorkflow({ output: finalResult.join('\n') })
  } else if (event.event === 'PING') {
    // 可选处理
  } else {
    addLog('未知任务事件', 'warning', event)
  }
},
      onError(error) {
        addLog(`任务执行出错: ${error.message}`, 'error')
        completeWorkflow({ status: 'error', output: error.message })
      },
      onEnd() {
        // onEnd 现在由 'Done' 事件触发，这里可以留空或用于最终清理
      }
    })
  } catch (error) {
    addLog(`任务执行失败: ${error.message}`, 'error')
    completeWorkflow()
  }
}

const completeWorkflow = (resultOverride = {}) => {
  if (!currentWorkflow.value) return

  const duration = formatDuration((Date.now() - currentWorkflow.value.startTime) / 1000)
  const result = generateMockResult(getCurrentFunction(), duration)

  const completedExecution = {
    id: currentWorkflow.value.id,
    workflow: currentWorkflow.value.name,
    function: getCurrentFunctionName(),
    status: 'success',
    duration,
    timestamp: new Date().toLocaleString(),
    output: result.output
  }

  executionHistory.unshift(completedExecution)
  if (executionHistory.length > 20) executionHistory.pop()

  const currentSession = executionSessions.find((s) => s.id === currentWorkflow.value.id)
  if (currentSession) {
    Object.assign(currentSession, {
      ...result,
      id: completedExecution.id,
      ...resultOverride
    })
  }
  currentWorkflow.value = null
  isExecuting.value = false
  currentStepIndex.value = 0
  stepProgress.value = 0
  workflowElapsedTime.value = 0

  clearInterval(timeInterval)
  addLog(`任务执行完成: ${completedExecution.workflow} (耗时: ${duration})`, 'success')
  addLog(`--- 任务 ${completedExecution.workflow} 执行结束 ---`, 'separator')
}

const generateMockResult = (func, duration) => {
  const baseResult = {
    status: 'success',
    duration,
    totalSteps: func.steps.length,
    processedItems: Math.floor(Math.random() * 1000) + 100,
    successRate: Math.floor(Math.random() * 20) + 80,
    timestamp: new Date().toLocaleString()
  }

  switch (func.id) {
    case 'chat':
      return {
        ...baseResult,
        output: `基于您的输入，我为您生成了以下回复：\n\n这是一个智能生成的对话回复示例。AI系统已经分析了您的问题，并提供了相关的解答。本次对话处理了${baseResult.processedItems}个token，生成质量评分为${baseResult.successRate}%。`,
        files: []
      }

    case 'analysis':
      return {
        ...baseResult,
        output: [
          { 指标: '平均值', 数值: '156.78', 单位: '' },
          { 指标: '标准差', 数值: '23.45', 单位: '' },
          { 指标: '最大值', 数值: '298.12', 单位: '' },
          { 指标: '最小值', 数值: '45.23', 单位: '' },
          { 指标: '相关系数', 数值: '0.87', 单位: '' }
        ],
        files: [
          { name: 'analysis_report.pdf', size: '2.3MB', url: '#' },
          { name: 'data_visualization.png', size: '856KB', url: '#' }
        ]
      }

    case 'documents':
      return {
        ...baseResult,
        output: `文档处理完成！\n\n摘要内容：\n本文档主要讨论了人工智能在现代企业中的应用场景和发展趋势。通过分析多个案例，文档总结了AI技术的核心优势和实施挑战。\n\n关键词：人工智能、企业应用、数字化转型、机器学习\n\n处理统计：\n- 总页数：${
          Math.floor(Math.random() * 50) + 10
        }页\n- 段落数：${baseResult.processedItems}段\n- 关键词提取：${
          Math.floor(Math.random() * 20) + 10
        }个`,
        files: [
          { name: 'document_summary.txt', size: '45KB', url: '#' },
          { name: 'keywords_extracted.json', size: '12KB', url: '#' }
        ]
      }

    case 'search':
      return {
        ...baseResult,
        output: [
          { 标题: 'AI技术发展现状', 相关度: '95%', 来源: '技术报告' },
          { 标题: '机器学习最佳实践', 相关度: '92%', 来源: '学术论文' },
          { 标题: '企业AI应用案例', 相关度: '88%', 来源: '案例研究' },
          { 标题: '深度学习算法优化', 相关度: '85%', 来源: '技术文档' }
        ],
        files: []
      }

    case 'automation':
      return {
        ...baseResult,
        output: `自动化任务执行完成！\n\n执行摘要：\n- 批处理文件：${
          Math.floor(Math.random() * 50) + 10
        }个\n- 成功处理：${Math.floor(
          (baseResult.processedItems * baseResult.successRate) / 100
        )}个\n- 失败处理：${
          baseResult.processedItems -
          Math.floor((baseResult.processedItems * baseResult.successRate) / 100)
        }个\n- 平均处理时间：${(Math.random() * 2 + 0.5).toFixed(
          2
        )}秒/文件\n\n所有任务已按照预设规则自动执行完成，详细日志已保存。`,
        files: [
          { name: 'automation_log.txt', size: '128KB', url: '#' },
          { name: 'processed_files.zip', size: '15.6MB', url: '#' }
        ]
      }

    default:
      return {
        ...baseResult,
        output: '任务执行完成，结果已生成。',
        files: []
      }
  }
}

const startWorkflowFromDialog = () => {
  const func = getCurrentFunction()
  if (!func) return

  if (func.needsFiles && workflowConfig.files.length === 0) {
    ElMessage.warning('请先上传文件')
    return
  }

  showWorkflowConfig.value = false
  ElMessage.success('即将开始执行...')

  nextTick(() => {
    executeWorkflow()
  })
}

const onConfigDialogClose = () => {
  // No action needed
}

const resetWorkflowConfig = () => {
  const func = getCurrentFunction()
  if (!func) return

  const newParams = {}
  func.params.forEach((param) => {
    if (param.type === 'boolean') {
      newParams[param.key] = false
    } else if (param.type === 'number') {
      newParams[param.key] = param.min || 0
    } else if (param.type === 'select' && param.options?.length) {
      newParams[param.key] = param.options[0].value
    } else {
      newParams[param.key] = ''
    }
  })
  workflowConfig.params = newParams
  workflowConfig.files = []
}

const clearHistory = () => {
  executionHistory.splice(0)
  addLog('执行历史已清空', 'info')
  ElMessage.success('执行历史已清空')
}

const exportHistory = () => {
  const data = JSON.stringify(executionHistory, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `execution_history_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  addLog('执行历史已导出', 'success')
}

const viewExecutionDetail = (row) => {
  lastExecutionResult.value = {
    id: row.id,
    status: row.status,
    duration: row.duration,
    output: row.output,
    totalSteps: Math.floor(Math.random() * 5) + 3,
    processedItems: Math.floor(Math.random() * 1000) + 100,
    successRate: Math.floor(Math.random() * 20) + 80,
    timestamp: row.timestamp,
    files: []
  }
  addLog(`查看执行详情: ${row.workflow}`, 'info')
}

const addLog = (message, type = 'info', details = null) => {
  const newLog = {
    id: Date.now() + Math.random(),
    message,
    type,
    details,
    timestamp: new Date().toLocaleTimeString(),
    workflowId: currentWorkflow.value ? currentWorkflow.value.id : null
  }
  executionLogs.unshift(newLog)
  if (executionLogs.length > 500) executionLogs.pop()
}

onMounted(() => {
  resetWorkflowConfig()
  addLog('智能体系统已启动', 'success')
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
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
}
.result-table {
  border-radius: 8px;
  overflow: hidden;
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

<style scoped>
.agent-dashboard {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.main-content {
  padding: 32px;
  overflow-y: auto;
  background: transparent;
}

.workflow-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1300px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .workflow-panel {
    gap: 16px;
  }
}
</style>
