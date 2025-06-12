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
        :execution-logs-count="displayedMessages.length"
        :active-function="activeFunction"
        @show-workflow-config="showWorkflowConfig = true"
      />

      <!-- 主要内容 -->
      <el-main class="main-content">
        <div class="workflow-panel">
          <!-- 任务执行面板 -->
          <WorkflowExecutionPanel
            :current-workflow="currentWorkflow"
            :messages="displayedMessages"
            @show-workflow-config="showWorkflowConfig = true"
            @view-result-detail="handleViewResultDetail"
            @message-displayed="handleMessageDisplayed"
          />
          <div class="chat-input-area">
            <el-input
              v-model="userInput"
              placeholder="输入消息..."
              @keyup.enter="handleSendMessage"
              clearable
            >
              <template #append>
                <el-button @click="handleSendMessage">发送</el-button>
              </template>
            </el-input>
          </div>
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
          max-height="60vh"
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
          <el-button type="success" @click="handleConfirm" :loading="isConfirming">确认</el-button>
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
            :key="formModel.id"
            :title="`条目 ${index + 1}: ${formModel.name || ''}`"
            :name="formModel.id"
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
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
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
const isConfirming = ref(false)
const userInput = ref('')

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
  hire_date: '入职日期'
  // ... 在这里可以添加更多的映射
}

const translateHeader = (prop) => {
  return headerMapping[prop] || prop
}

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

// 消息队列和显示逻辑
const messageQueue = reactive([])
const displayedMessages = reactive([])
const isDisplayingMessage = ref(false)

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
  if (taskId.value == null) {
    ElMessage.warning('没有可供解析的结果任务ID。')
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
      const jsonString = result.data.replace(/("id":\s*)(\d{16,})/g, '$1"$2"')
      const parsedData = JSON.parse(jsonString)?.output

      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableColumns.value = Object.keys(parsedData[0]).map((key) => ({
          prop: key,
          label: key
        }))
        tableData.value = parsedData
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
  activeCollapse.value = editFormModels.value.map((item) => item.id)

  showResultDetail.value = false
  showEditDialog.value = true
}

const cancelEdit = () => {
  showEditDialog.value = false
  showResultDetail.value = true // 返回详情弹窗
}

const saveEdit = async () => {
  isSaving.value = true
  addMessage(`开始保存编辑内容，共 ${editFormModels.value.length} 条记录...`, 'system')
  try {
    const editPromises = editFormModels.value.map((item) => cozeService.runEditWorkflow(item))
    await Promise.all(editPromises)
    // 深拷贝数据以更新表格
    tableData.value = JSON.parse(JSON.stringify(editFormModels.value))
    ElMessage.success('保存成功，所有条目更新')
    addMessage('所有编辑内容已成功保存', 'system')
    showEditDialog.value = false
    showResultDetail.value = true // 返回详情弹窗
  } catch (error) {
    console.error('保存编辑时出错:', error)
    ElMessage.error(`保存失败: ${error.message}`)
    addMessage(`保存编辑时出错: ${error.message}`, 'system')
  } finally {
    isSaving.value = false
  }
}

const handleConfirm = async () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有可确认的数据。')
    return
  }

  isConfirming.value = true
  addMessage(`开始对解析数据进行确认，共 ${tableData.value.length} 条记录...`, 'system')

  try {
    const confirmPromises = tableData.value.map((item) =>
      cozeService.runConfirmWorkflow({ id: item.id })
    )

    const results = await Promise.allSettled(confirmPromises)

    let successCount = 0
    let failureCount = 0

    results.forEach((result, index) => {
      const item = tableData.value[index]
      if (result.status === 'fulfilled') {
        successCount++
        addMessage(`条目 ${item.id} 确认成功。`, 'system')
      } else {
        failureCount++
        addMessage(`条目 ${item.id} 确认失败: ${result.reason.message}`, 'system')
        console.error(`确认失败 (ID: ${item.id}):`, result.reason)
      }
    })

    if (failureCount > 0) {
      ElMessage.warning(`${successCount} 条记录确认成功，${failureCount} 条失败。`)
    } else {
      ElMessage.success(`所有 ${successCount} 条记录均已成功确认！`)
    }

    addMessage('所有解析结果已确认。', 'system')
    showResultDetail.value = false
  } catch (error) {
    console.error('执行确认工作流时发生意外错误:', error)
    ElMessage.error(`确认过程中发生错误: ${error.message}`)
    addMessage(`确认工作流执行时出错: ${error.message}`, 'system')
  } finally {
    isConfirming.value = false
  }
}

const handleFunctionSelect = (key) => {
  activeFunction.value = key
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

  addMessage(`开始执行任务: ${workflow.name}`, 'agent', {
    id: workflow.id,
    name: workflow.name
  })

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
    const uploadPromises = workflowConfig.files.map((file) => cozeService.uploadFile(file.raw))
    const fileIds = await Promise.all(uploadPromises)
    stepProgress.value = 100
    currentStepIndex.value = 1 // 文件解析
    let inputs = []
    fileIds.forEach((fileId) => {
      inputs.push({ file_id: fileId })
    })

    executionSessions.push({
      id: workflow.id,
      name: workflow.name,
      status: 'running',
      duration: '0.0s',
      output: '正在执行，请稍候...'
    })

    // 创建一个用于流式响应的消息
    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '正在进行解析...',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }
    messageQueue.push(streamingAgentMessage)
    processMessageQueue()
    const finalResult = []
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

          // 将文本内容附加到流式消息中
          if (displayText) {
            if (streamingAgentMessage.content === '正在进行解析...') {
              streamingAgentMessage.content = '' // 清除初始消息
            }
            streamingAgentMessage.content += displayText
            finalResult.push(displayText)
            const currentSession = executionSessions.find((s) => s.id === workflow.id)
            if (currentSession) {
              currentSession.output = streamingAgentMessage.content
            }
          }
        } else if (event.event === 'Done') {
          delete streamingAgentMessage.isStreaming
          completeWorkflow({ output: finalResult.join('\n') })
        } else if (event.event === 'PING') {
          // 可选处理
        } else {
          addMessage('未知任务事件', 'system', null, event)
        }
      },
      onError(error) {
        addMessage(`任务执行出错: ${error.message}`, 'system')
        completeWorkflow({ status: 'error', output: error.message })
      },
      onEnd() {
        // onEnd 现在由 'Done' 事件触发，这里可以留空或用于最终清理
      }
    })
  } catch (error) {
    addMessage(`任务执行失败: ${error.message}`, 'system')
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
  const isSuccess = resultOverride.status !== 'error'
  addMessage(
    `任务执行完成: ${completedExecution.workflow} (耗时: ${duration})`,
    'agent',
    { id: completedExecution.id, name: completedExecution.workflow },
    null,
    { showViewResultButton: isSuccess && taskId.value != null }
  )
  addMessage(`--- 任务 ${completedExecution.workflow} 执行结束 ---`, 'system')
}

const generateMockResult = (func, duration) => {
  const baseResult = {
    status: 'success',
    duration,
    totalSteps: func.steps ? func.steps.length : 0,
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
  addMessage('执行历史已清空', 'system')
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
  addMessage('执行历史已导出', 'system')
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
  addMessage(`查看执行详情: ${row.workflow}`, 'system')
}

const addMessage = (content, from, workflowInfo = null, details = null, options = {}) => {
  const newMessage = {
    id: Date.now() + Math.random(),
    from, // 'user', 'agent', 'system'
    content,
    timestamp: new Date().toLocaleTimeString(),
    sender: from === 'agent' ? (workflowInfo ? workflowInfo.name : '智能体') : '系统',
    workflow: workflowInfo,
    details,
    ...options
  }
  messageQueue.push(newMessage)
  processMessageQueue()
}

const processMessageQueue = () => {
  if (messageQueue.length > 0 && !isDisplayingMessage.value) {
    isDisplayingMessage.value = true
    const nextMessage = messageQueue.shift()
    displayedMessages.push(nextMessage)
    if (displayedMessages.length > 500) {
      displayedMessages.shift()
    }
  }
}

const handleMessageDisplayed = () => {
  setTimeout(() => {
    isDisplayingMessage.value = false
    processMessageQueue()
  }, 300) // Add a small delay before showing the next message
}

onMounted(() => {
  resetWorkflowConfig()
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

const handleSendMessage = () => {
  if (!userInput.value.trim()) return

  const userMessageContent = userInput.value
  userInput.value = ''

  // 1. Add user message to the queue.
  addMessage(userMessageContent, 'user')

  // 2. Create a placeholder for the agent's response.
  const agentMessage = {
    id: Date.now() + Math.random(),
    from: 'agent',
    content: '',
    timestamp: new Date().toLocaleTimeString(),
    sender: '智能体',
    workflow: null,
    details: null,
    isStreaming: true, // Flag to indicate this message is being streamed
    actionTriggered: false
  }

  // 3. Add the agent's message placeholder to the queue.
  // It will be processed after the user's message is displayed.
  messageQueue.push(agentMessage)
  processMessageQueue() // This will display the user message, then the empty agent bubble

  // 4. Start the asynchronous chat service.
  // It will update the 'agentMessage' object's content reactively.
  cozeService.runChat({ query: userMessageContent }, '7514898709852733475', {
    onMessage(message) {
      const { event, data } = message
      if (event === 'conversation.message.delta' && data.type === 'answer') {
        agentMessage.content += data.content
        if (!agentMessage.actionTriggered && agentMessage.content.includes('解析合同')) {
          handleFunctionSelect('contractParsing')
          agentMessage.actionTriggered = true // 标记已触发，防止重复执行
        }
      } else if (event === 'done') {
        // The 'done' event now signals the end of the stream.
        delete agentMessage.isStreaming
        // The StreamingMessage component's @done event is responsible for
        // calling handleMessageDisplayed, so no action is needed here.
      }
    },
    onError(error) {
      agentMessage.content = `对话出错: ${error.message}`
      delete agentMessage.isStreaming
    },
    onEnd() {
      // This is now handled by the 'done' event in onMessage
    }
  })
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

.chat-input-area {
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 16px 16px;
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
