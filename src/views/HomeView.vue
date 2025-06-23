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

    <!-- 智能大脑弹窗 -->
    <SmartBrainDialog
      v-model:show="showSmartBrainDialog"
      :agents="smartAgents"
      :tasks-by-agent="taskListsByAgent"
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
          :data="editFormModels"
          style="width: 100%"
          stripe
          class="result-table"
          max-height="60vh"
          :header-cell-style="{ background: '#fafafa', color: '#333' }"
        >
          <template v-for="column in tableColumns" :key="column.prop">
            <el-table-column
              v-if="headerMapping[column.prop]"
              :prop="column.prop"
              :label="translateHeader(column.prop)"
            >
              <template #default="scope">
                <span v-if="!scope.row.editing">{{ formatCellValue(scope.row[column.prop]) }}</span>
                <template v-else>
                  <div v-if="isLongText(scope.row[column.prop])">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      @click="openEditPopup(scope.row, column.prop)"
                    >
                      编辑长文本
                    </el-button>
                  </div>
                  <el-input
                    v-else
                    v-model="scope.row[column.prop]"
                    :placeholder="`请输入${translateHeader(column.prop)}`"
                  ></el-input>
                </template>
              </template>
            </el-table-column>
          </template>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <div v-if="scope.row.editing">
                <el-button type="success" size="small" @click="saveRowEdit(scope.row)"
                  >保存</el-button
                >
                <el-button size="small" @click="cancelRowEdit(scope.row)">取消</el-button>
              </div>
              <el-button v-else type="primary" size="small" @click="startRowEdit(scope.row)"
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
          <el-button type="primary" @click="handleSaveAll" :loading="savingAllEdits"
            >提交修改</el-button
          >
          <el-button type="success" @click="handleConfirm" :loading="isConfirming">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑长文本的对话框 -->
    <el-dialog v-model="longTextEditVisible" :title="`编辑 ${editableField}`" width="40%">
      <el-input v-model="longTextValue" type="textarea" :rows="10" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="longTextEditVisible = false">取消</el-button>
          <el-button type="primary" @click="saveLongText">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入子组件
import SidebarNav from '@/components/home/SidebarNav.vue'
import HeaderBar from '@/components/home/HeaderBar.vue'
import WorkflowExecutionPanel from '@/components/home/WorkflowExecutionPanel.vue'
import ExecutionHistory from '@/components/home/ExecutionHistory.vue'
import WorkflowConfigDialog from '@/components/home/WorkflowConfigDialog.vue'
import SmartBrainDialog from '@/components/home/SmartBrainDialog.vue'
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
const showSmartBrainDialog = ref(false)
const taskId = ref(null)
const supplierFileId = ref(null) // 用于存储乙供物资解析返回的 file_id
const supplierFileDetailIds = ref([]) // 用于存储乙供物资解析返回的 file_detail_id_list
const tableData = ref([]) // 原始数据
const tableColumns = ref([])
const editFormModels = ref([]) // 用于编辑的表单数据模型
const isFetchingDetails = ref(false)

// 编辑功能
const longTextEditVisible = ref(false)
const longTextValue = ref('')
const editableRow = ref(null)
const editableField = ref('')
const editableFieldProp = ref('')
const savingAllEdits = ref(false)
const isConfirming = ref(false)
const userInput = ref('')
const taskListsByAgent = ref({})

const smartAgents = ref(
  functions
    .filter(
      (f) =>
        f.id === 'contractParsing' ||
        f.id === 'supplierMaterialParsing' ||
        f.id === 'ownerSuppliedMaterialParsing'
    )
    .map((f) => ({
      id: f.id,
      name: f.name,
      status: 'online', // Assuming all are online for now
      tasks: { completed: 0, inProgress: 0, total: 0 }
    }))
)

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
  id: '编号',
  task_id: '任务ID',
  status: '状态',
  created_at: '创建时间',
  updated_at: '更新时间',
  description: '描述',
  result: '结果',
  total_documents_count: '总文档数',
  processed_documents_count: '处理文档数',
  error_documents_count: '失败文档数',
  progress: '进度',
  file_count: '文件总数',
  file_done_count: '已完成文件数量',
  contract_name: '合同名称',
  contract_number: '合同编号',
  contract_amount: '合同金额',
  pay_result: '付款依据',
  signing_time: '签订时间',
  fixed_rate: '包干率',
  safety_rate: '安全文明施工费是否下浮',
  temporary_rate: '临时设施费是否下浮',
  result_status: '解析状态',
  salary: '薪水',
  hire_date: '入职日期',
  ID: 'ID',
  物资名称: '物资名称',
  规格型号: '规格型号',
  数量: '数量',
  单位: '单位',
  单价: '单价',
  总价: '总价',
  备注: '备注',
  material_name: '乙供物资名称',
  material_specification: '乙供物资规格型号',
  material_price: '乙供物资价格',
  matched_name: '匹配物资名称',
  matched_specification: '匹配规格型号',
  matched_price: '匹配价格',
  similarity: '相似度',
  match_type: '匹配类型'
}

const translateHeader = (prop) => {
  return headerMapping[prop] || prop
}

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '/'
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return value
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
let loadingInterval = null

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
function parseResultJsonData(parsedData) {
  // 判断parsedData的结构是否包含result_json字段，表示表格数据多包了一层
  if (!Array.isArray(parsedData) || parsedData.length === 0) {
    return []
  }
  let tableJsonData = null
  if (parsedData[0].hasOwnProperty('result_json')) {
    // 当result_json字段是字符串形式的JSON数组时，将所有解析合并为一个大数组
    tableJsonData = []
    for (const item of parsedData) {
      if (item.result_json) {
        try {
          const parsedResult = JSON.parse(item.result_json)
          if (Array.isArray(parsedResult)) {
            tableJsonData.push(...parsedResult)
          } else if (parsedResult && typeof parsedResult === 'object') {
            tableJsonData.push(parsedResult)
          }
        } catch {
          // 解析失败则忽略
        }
      }
    }
  } else {
    tableJsonData = parsedData
  }
  return tableJsonData
}

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
    if (result && result.data) {
      const jsonString = result.data.replace(/("id":\s*)(\d{16,})/g, '$1"$2"')
      const parsedData = JSON.parse(jsonString)?.output
      const tableJsonData = parseResultJsonData(parsedData)
      if (Array.isArray(tableJsonData) && tableJsonData.length > 0) {
        tableColumns.value = Object.keys(tableJsonData[0]).map((key) => ({
          prop: key,
          label: translateHeader(key)
        }))
        const rawData = tableJsonData.map((item) => ({ ...item, editing: false }))
        tableData.value = JSON.parse(JSON.stringify(rawData))
        // 为编辑创建一个深拷贝
        editFormModels.value = JSON.parse(JSON.stringify(rawData))
      } else {
        tableColumns.value = []
        tableData.value = []
        editFormModels.value = []
        ElMessage.info('结果为空或 result_json 解析后无数据，暂无数据展示。')
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

const isLongText = (text) => {
  if (typeof text !== 'string') return false
  // 当文本行数大于3或字符数超过50时，被认为是长文本
  const lineCount = (text.match(/\n/g) || []).length + 1
  return lineCount > 3 || text.length > 50
}

const openEditPopup = (row, field) => {
  editableRow.value = row
  editableFieldProp.value = field
  editableField.value = translateHeader(field)
  longTextValue.value = row[field]
  longTextEditVisible.value = true
}

const saveLongText = () => {
  if (editableRow.value && editableFieldProp.value) {
    editableRow.value[editableFieldProp.value] = longTextValue.value
  }
  longTextEditVisible.value = false
  editableFieldProp.value = ''
  editableField.value = ''
}

const startRowEdit = (row) => {
  // 只需设置编辑状态，因为原始数据在 tableData 中
  row.editing = true
}

const cancelRowEdit = (row) => {
  const index = editFormModels.value.findIndex((item) => item.id === row.id)
  if (index !== -1) {
    // 从原始数据中恢复
    const originalRow = tableData.value.find((item) => item.id === row.id)
    if (originalRow) {
      editFormModels.value[index] = JSON.parse(JSON.stringify(originalRow))
      editFormModels.value[index].editing = false // 确保取消后 editing 状态也复原
    }
  }
}

const saveRowEdit = (row) => {
  // 仅在本地确认更改并退出编辑模式，不调用保存服务
  row.editing = false
  ElMessage.info('此行更改已暂存，请点击“提交修改”以提交。')
}

const handleSaveAll = async () => {
  savingAllEdits.value = true
  try {
    // 准备要提交的数据，移除 'editing' 标志
    const payloads = editFormModels.value.map((item) => {
      const payload = { ...item }
      delete payload.editing
      return payload
    })

    const editPromises = payloads.map((item) => cozeService.runEditWorkflow(item))

    const results = await Promise.allSettled(editPromises)

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount

    if (failureCount > 0) {
      ElMessage.error(`${failureCount} 个条目保存失败，请检查控制台日志。`)
    } else {
      ElMessage.success('全部解析结果已成功保存！')
      // 更新原始数据
      tableData.value = JSON.parse(
        JSON.stringify(
          editFormModels.value.map((item) => {
            const cleanItem = { ...item }
            delete cleanItem.editing
            return cleanItem
          })
        )
      )
      showResultDetail.value = false // 保存成功后关闭对话框
    }
  } catch (error) {
    console.error('保存全部时发生意外错误:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    savingAllEdits.value = false
  }
}

const handleConfirm = async () => {
  if (!tableData.value || tableData.value.length === 0) {
    ElMessage.warning('没有可确认的数据。')
    return
  }

  isConfirming.value = true

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
      } else {
        failureCount++
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
  } finally {
    isConfirming.value = false
  }
}

const handleFunctionSelect = async (key) => {
  if (key === 'smartBrain') {
    try {
      ElMessage.info('正在查询智能体任务数据...')

      const getTaskCountsWorkflowId = '7517560875563204627'
      const getTaskListWorkflowId = '7517283953213866036'
      const businessDomains = {
        contractParsing: 'contract',
        supplierMaterialParsing: 'y_material',
        ownerSuppliedMaterialParsing: 'j_material' // 添加甲供物资的业务领域
      }

      const getTaskList = (result) => {
        try {
          const data = result?.data
          if (!data) return []
          const output = JSON.parse(data).output
          if (!output) return []
          if (Array.isArray(output)) return output
          if (typeof output === 'string') {
            const parsed = JSON.parse(output)
            return Array.isArray(parsed) ? parsed : []
          }
          return []
        } catch (e) {
          console.error('Failed to parse workflow output:', e, result?.data)
          return []
        }
      }

      const fetchPromises = smartAgents.value.map(async (agent) => {
        const domain = businessDomains[agent.id]
        if (domain) {
          try {
            // Fetch task counts
            const countResult = await cozeService.runWorkflow(getTaskCountsWorkflowId, {
              businessDomain: domain
            })
            if (countResult && countResult.data) {
              try {
                const outerParsed = JSON.parse(countResult.data)
                if (outerParsed && outerParsed.output) {
                  const innerParsed = JSON.parse(outerParsed.output)
                  // Assuming innerParsed is an array with one object matching the domain
                  const domainData = innerParsed.find((item) => item.BUSINESS_DOMAIN === domain)
                  if (domainData) {
                    agent.tasks.completed = parseInt(domainData.finished_count) || 0
                    agent.tasks.inProgress = parseInt(domainData.running_count) || 0
                    agent.tasks.total = parseInt(domainData.total_count) || 0
                  }
                }
              } catch (parseError) {
                console.error(`解析 ${agent.name} 任务数量数据失败:`, parseError, countResult.data)
              }
            }

            // Fetch task lists for all, in-progress, and completed
            const [inProgressListResult, completedListResult, allListResult] = await Promise.all([
              cozeService.runWorkflow(getTaskListWorkflowId, {
                status: '1',
                businessDomain: domain
              }),
              cozeService.runWorkflow(getTaskListWorkflowId, {
                status: '2',
                businessDomain: domain
              }),
              cozeService.runWorkflow(getTaskListWorkflowId, {
                status: '5',
                businessDomain: domain
              })
            ])

            taskListsByAgent.value[agent.id] = {
              inProgress: getTaskList(inProgressListResult),
              completed: getTaskList(completedListResult),
              all: getTaskList(allListResult)
            }
          } catch (error) {
            console.error(`获取 ${agent.name} 数据失败:`, error)
            // Optionally set tasks to 0 or handle error state for this agent
            agent.tasks.completed = 0
            agent.tasks.inProgress = 0
            agent.tasks.total = 0
            taskListsByAgent.value[agent.id] = { all: [], completed: [], inProgress: [] }
          }
        }
      })

      await Promise.all(fetchPromises)

      showSmartBrainDialog.value = true
    } catch (error) {
      console.error('查询智能大脑数据失败:', error)
      ElMessage.error('查询智能大脑数据失败，请稍后重试。')
    }
    return
  }
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

  // 创建一个特殊的加载消息
  const loadingMessage = reactive({
    id: Date.now() + Math.random(),
    from: 'agent',
    type: 'loading',
    content: '正在准备任务，请稍候...',
    progress: 0,
    timestamp: new Date().toLocaleTimeString(),
    sender: workflow.name,
    workflow: { id: workflow.id, name: workflow.name }
  })
  addMessage(loadingMessage)

  // 模拟加载进度
  let progress = 0
  loadingInterval = setInterval(() => {
    if (progress < 99) {
      progress += 5
      loadingMessage.progress = Math.min(progress, 99)
    } else {
      clearInterval(loadingInterval)
    }
  }, 10000)

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

    const streamingAgentMessage = {
      id: Date.now() + Math.random(),
      from: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      sender: workflow.name,
      workflow: { id: workflow.id, name: workflow.name },
      isStreaming: true
    }

    const finalResult = []
    let isFirstMessage = true

    // 根据功能ID调用不同的Coze服务方法
    if (func.id === 'contractParsing') {
      const workflowId = '7514898709852733475' // 假设合同解析的workflow ID
      cozeService.runContractParsing(inputs, {
        onMessage(event) {
          if (isFirstMessage) {
            loadingMessage.content = '任务解析已开始，正在接收数据...'
            messageQueue.push(streamingAgentMessage)
            processMessageQueue()
            isFirstMessage = false
          }

          if (event.event === 'Message' && event.data.content_type === 'text') {
            const content = event.data.content
            let taskIdCandidate = null
            let displayText = null

            if (typeof content === 'object' && content !== null) {
              taskIdCandidate = content.task_id
              if (!taskIdCandidate) displayText = JSON.stringify(content, null, 2)
            } else if (typeof content === 'string') {
              try {
                const parsed = JSON.parse(content)
                taskIdCandidate = parsed?.task_id
                if (!taskIdCandidate) displayText = content
              } catch (e) {
                displayText = content
              }
            }

            if (taskIdCandidate) {
              taskId.value = taskIdCandidate
              return
            }

            if (displayText) {
              streamingAgentMessage.content += displayText
              finalResult.push(displayText)
              const currentSession = executionSessions.find((s) => s.id === workflow.id)
              if (currentSession) {
                currentSession.output = streamingAgentMessage.content
              }
            }
          } else if (event.event === 'Done') {
            delete streamingAgentMessage.isStreaming
            loadingMessage.progress = 100
            loadingMessage.content = '任务执行完毕！'
            clearInterval(loadingInterval)
            completeWorkflow({ output: finalResult.join('\n') })
          } else if (event.event === 'PING') {
            // Handle PING
          } else {
            addMessage('未知任务事件', 'system', null, event)
          }
        },
        onError(error) {
          clearInterval(loadingInterval)
          loadingMessage.content = `任务出错: ${error.message}`
          loadingMessage.progress = 100 // Mark as complete but with error
          addMessage(`任务执行出错: ${error.message}`, 'system')
          completeWorkflow({ status: 'error', output: error.message })
        },
        onEnd() {
          // Handled by 'Done' event
        }
      })
    } else if (func.id === 'supplierMaterialParsing') {
      const workflowId = '7517934954761715721' // 乙供物资解析的实际工作流ID
      cozeService.runSupplierMaterialParsing(
        inputs, // 传入文件ID列表
        {
          onMessage(event) {
            if (isFirstMessage) {
              loadingMessage.content = '任务解析已开始，正在接收数据...'
              messageQueue.push(streamingAgentMessage)
              processMessageQueue()
              isFirstMessage = false
            }

            if (event.event === 'Message' && event.data.content_type === 'text') {
              const content = event.data.content
              let taskIdCandidate = null
              let displayText = null

              if (typeof content === 'object' && content !== null) {
                taskIdCandidate = content.task_id
                if (!taskIdCandidate) displayText = JSON.stringify(content, null, 2)
              } else if (typeof content === 'string') {
                try {
                  const parsed = JSON.parse(content)
                  taskIdCandidate = parsed?.task_id
                  if (!taskIdCandidate) displayText = content
                } catch (e) {
                  displayText = content
                }
              }

              if (taskIdCandidate) {
                taskId.value = taskIdCandidate
                return
              }

              if (displayText) {
                streamingAgentMessage.content += displayText
                finalResult.push(displayText)
                const currentSession = executionSessions.find((s) => s.id === workflow.id)
                if (currentSession) {
                  currentSession.output = streamingAgentMessage.content
                }
              }
            } else if (event.event === 'Done') {
              delete streamingAgentMessage.isStreaming
              loadingMessage.progress = 100
              loadingMessage.content = '任务执行完毕！'
              clearInterval(loadingInterval)

              // 解析 Done 事件的 data，提取 file_id 和 file_detail_id_list
              if (event.data) {
                try {
                  const doneData = JSON.parse(event.data); // 假设 Done 事件的 data 是 JSON 字符串
                  if (doneData.file_id) {
                    supplierFileId.value = doneData.file_id;
                  }
                  if (Array.isArray(doneData.file_detail_id_list)) {
                    supplierFileDetailIds.value = doneData.file_detail_id_list;
                  }
                  ElMessage.success(`乙供物资解析完成，文件ID: ${supplierFileId.value}，详情ID数量: ${supplierFileDetailIds.value.length}`);
                } catch (e) {
                  console.error('解析乙供物资 Done 事件数据失败:', e, event.data);
                  ElMessage.warning('乙供物资解析完成，但解析结果ID失败。');
                }
              }
              completeWorkflow({ output: finalResult.join('\n') })
            } else if (event.event === 'PING') {
              // Handle PING
            } else {
              addMessage('未知任务事件', 'system', null, event)
            }
          },
          onError(error) {
            clearInterval(loadingInterval)
            loadingMessage.content = `任务出错: ${error.message}`
            loadingMessage.progress = 100 // Mark as complete but with error
            addMessage(`任务执行出错: ${error.message}`, 'system')
            completeWorkflow({ status: 'error', output: error.message })
          },
          onEnd() {
            // Handled by 'Done' event
          }
        }
      )
    } else if (func.id === 'ownerSuppliedMaterialParsing') {
      // 调用新的甲供物资解析工作流方法
      executeOwnerMaterialParsingWorkflow(
        inputs,
        loadingMessage,
        streamingAgentMessage,
        finalResult,
        workflow
      )
    } else {
      // Fallback for other functions if needed, or throw an error
      throw new Error(`Unsupported function ID: ${func.id}`)
    }
  } catch (error) {
    clearInterval(loadingInterval)
    loadingMessage.content = `任务失败: ${error.message}`
    loadingMessage.progress = 100
    addMessage(`任务执行失败: ${error.message}`, 'system')
    completeWorkflow()
  }
}

// 新增的甲供物资解析工作流执行方法
const executeOwnerMaterialParsingWorkflow = async (
  inputs,
  loadingMessage,
  streamingAgentMessage,
  finalResult,
  workflow
) => {
  const workflowId = 'mock_owner_material_parsing_workflow_id' // 替换为甲供物资解析的实际工作流ID
  try {
    await cozeService.runWorkflow(
      workflowId,
      {
        file_ids: inputs.map((input) => input.file_id),
        ...workflowConfig.params
      },
      {
        onMessage(event) {
          if (event.event === 'Message' && event.data.content_type === 'text') {
            const content = event.data.content
            let taskIdCandidate = null
            let displayText = null

            if (typeof content === 'object' && content !== null) {
              taskIdCandidate = content.task_id
              if (!taskIdCandidate) displayText = JSON.stringify(content, null, 2)
            } else if (typeof content === 'string') {
              try {
                const parsed = JSON.parse(content)
                taskIdCandidate = parsed?.task_id
                if (!taskIdCandidate) displayText = content
              } catch (e) {
                displayText = content
              }
            }

            if (taskIdCandidate) {
              taskId.value = taskIdCandidate
              return
            }

            if (displayText) {
              streamingAgentMessage.content += displayText
              finalResult.push(displayText)
              const currentSession = executionSessions.find((s) => s.id === workflow.id)
              if (currentSession) {
                currentSession.output = streamingAgentMessage.content
              }
            }
          } else if (event.event === 'Done') {
            delete streamingAgentMessage.isStreaming
            loadingMessage.progress = 100
            loadingMessage.content = '甲供物资解析任务执行完毕！'
            clearInterval(loadingInterval)
            completeWorkflow({ output: finalResult.join('\n') })
          } else if (event.event === 'PING') {
            // Handle PING
          } else {
            addMessage('未知任务事件', 'system', null, event)
          }
        },
        onError(error) {
          clearInterval(loadingInterval)
          loadingMessage.content = `甲供物资解析任务出错: ${error.message}`
          loadingMessage.progress = 100 // Mark as complete but with error
          addMessage(`甲供物资解析任务执行出错: ${error.message}`, 'system')
          completeWorkflow({ status: 'error', output: error.message })
        },
        onEnd() {
          // Handled by 'Done' event
        }
      }
    )
  } catch (error) {
    clearInterval(loadingInterval)
    loadingMessage.content = `甲供物资解析任务失败: ${error.message}`
    loadingMessage.progress = 100
    addMessage(`甲供物资解析任务执行失败: ${error.message}`, 'system')
    completeWorkflow()
  }
}

const completeWorkflow = (resultOverride = {}) => {
  if (!currentWorkflow.value) return

  clearInterval(timeInterval)
  clearInterval(loadingInterval) // Ensure loading interval is cleared

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

  const isSuccess = resultOverride.status !== 'error'
  // 延迟输出“任务执行完成”和“执行结束”消息
  setTimeout(() => {
    addMessage(
      `任务执行完成: ${completedExecution.workflow} (耗时: ${duration})`,
      'agent',
      { id: completedExecution.id, name: completedExecution.workflow },
      null,
      { showViewResultButton: isSuccess && taskId.value != null }
    )
    addMessage(`--- 任务 ${completedExecution.workflow} 执行结束 ---`, 'system', {
      id: completedExecution.id,
      name: completedExecution.workflow
    })
  }, 2000) // 延迟2秒输出
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

    case 'ownerSuppliedMaterialParsing':
      return {
        ...baseResult,
        output: [
          {
            物资名称: '钢筋',
            规格型号: 'HRB400',
            数量: 100,
            单位: '吨',
            单价: 4500,
            总价: 450000,
            备注: '模拟数据'
          },
          {
            物资名称: '水泥',
            规格型号: 'PO 42.5',
            数量: 50,
            单位: '吨',
            单价: 300,
            总价: 15000,
            备注: '模拟数据'
          },
          {
            物资名称: '砂石',
            规格型号: '中砂',
            数量: 200,
            单位: '立方米',
            单价: 120,
            总价: 24000,
            备注: '模拟数据'
          }
        ],
        files: [
          { name: '甲供物资解析报告.pdf', size: '1.2MB', url: '#' },
          { name: '甲供物资清单.xlsx', size: '50KB', url: '#' }
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
    if (func.id === 'ownerSuppliedMaterialParsing') {
      // 对于甲供物资解析，直接调用其特定的执行方法
      executeWorkflow() // executeWorkflow 内部会根据 func.id 路由到 executeOwnerMaterialParsingWorkflow
    } else {
      executeWorkflow()
    }
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
  const newMessage =
    typeof content === 'object' && content !== null
      ? content
      : {
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
        } else if (
          !agentMessage.actionTriggered &&
          agentMessage.content.includes('正在调用解析乙供物资功能')
        ) {
          handleFunctionSelect('supplierMaterialParsing')
          agentMessage.actionTriggered = true // 标记已触发，防止重复执行
        } else if (
          !agentMessage.actionTriggered &&
          agentMessage.content.includes('正在调用甲供物资解析功能')
        ) {
          handleFunctionSelect('ownerSuppliedMaterialParsing')
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
