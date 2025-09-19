<template>
  <div class="project-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          @click="goBack"
          :icon="ArrowLeft"
          type="text"
          class="back-btn"
        >
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">项目任务详情</h1>
          <p class="page-subtitle">{{ currentProject?.projectName || '项目详情' }}</p>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :icon="Refresh" type="default">
          刷新数据
        </el-button>
        <el-button @click="handleExportAll" :icon="Download" type="primary" :loading="exportLoading">
          导出全部数据
        </el-button>
      </div>
    </div>

    <!-- 项目统计卡片 -->
    <div class="project-stats">
      <el-card class="stats-card" v-for="stat in projectStatistics" :key="stat.key">
        <div class="stat-content">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="24">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 按行分栏任务展示 -->
    <div class="tasks-container">
      <!-- 合同解析任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Document />
            </el-icon>
            合同解析任务详情列表
          </h3>
          <div class="row-stats">
            <el-badge :value="contractTasksPagination.total" class="task-count-badge" />
          </div>
        </div>

        <div class="task-detail-content" v-loading="contractTasksLoading">
          <div class="table-container">
            <el-table :data="contractTasks" style="width: 100%">
              <!-- 序号 -->
              <el-table-column type="index" label="序号" width="60"></el-table-column>
              <el-table-column prop="id" label="任务ID" width="120"></el-table-column>
              <el-table-column prop="projectCode" label="项目编号" width="150">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectCode || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="projectName" label="项目名称" width="200">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectName || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="fileCount" label="文件数量" width="100">
                <template #default="{ row }">
                  {{ row.fileCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="fileDoneCount" label="完成文件数" width="100">
                <template #default="{ row }">
                  {{ row.fileDoneCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="uploadTime" label="上传时间" width="160">
                <template #default="{ row }">
                  {{ row.uploadTime ? new Date(row.uploadTime).toLocaleString() : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="160">
                <template #default="{ row }">
                  {{ row.startTime ? new Date(row.startTime).toLocaleString() : '未开始' }}
                </template>
              </el-table-column>
              <el-table-column prop="endTime" label="结束时间" width="160">
                <template #default="{ row }">
                  {{ row.endTime ? new Date(row.endTime).toLocaleString() : '未结束' }}
                </template>
              </el-table-column>
              <el-table-column prop="taskStatus" label="任务状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getTaskStatusType(row.taskStatus)">
                    {{ getTaskStatusText(row.taskStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="errorReason" label="失败原因" width="200">
                <template #default="{ row }">
                  {{ row.errorReason || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="text" @click="handleViewContractDetail(row)">查看详情</el-button>
                  <el-button type="text" @click="handleDownloadFile(row)">查看源文件</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination
            @size-change="handleContractSizeChange"
            @current-change="handleContractCurrentChange"
            :current-page="contractTasksPagination.currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="contractTasksPagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="contractTasksPagination.total"
            background
            style="margin-top: 20px; text-align: right"
          >
          </el-pagination>
        </div>
      </div>

      <!-- 乙供物资任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Box />
            </el-icon>
            乙供物资解析任务详情列表
          </h3>
          <div class="row-stats">
            <el-badge :value="supplierMaterialTasksPagination.total" class="task-count-badge" />
          </div>
        </div>

        <div class="task-detail-content" v-loading="supplierMaterialTasksLoading">
          <div class="table-container">
            <el-table :data="supplierMaterialTasks" style="width: 100%">
              <el-table-column type="index" label="序号" width="60"></el-table-column>
              <el-table-column prop="id" label="任务ID" width="120"></el-table-column>
              <el-table-column prop="projectCode" label="项目编号" width="150">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectCode || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="projectName" label="项目名称" width="200">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectName || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="fileCount" label="文件数量" width="100">
                <template #default="{ row }">
                  {{ row.fileCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="fileDoneCount" label="完成文件数" width="100">
                <template #default="{ row }">
                  {{ row.fileDoneCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="uploadTime" label="上传时间" width="160">
                <template #default="{ row }">
                  {{ row.uploadTime ? new Date(row.uploadTime).toLocaleString() : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="160">
                <template #default="{ row }">
                  {{ row.startTime ? new Date(row.startTime).toLocaleString() : '未开始' }}
                </template>
              </el-table-column>
              <el-table-column prop="endTime" label="结束时间" width="160">
                <template #default="{ row }">
                  {{ row.endTime ? new Date(row.endTime).toLocaleString() : '未结束' }}
                </template>
              </el-table-column>
              <el-table-column prop="taskStatus" label="任务状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getTaskStatusType(row.taskStatus)">
                    {{ getTaskStatusText(row.taskStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="errorReason" label="失败原因" width="200">
                <template #default="{ row }">
                  {{ row.errorReason || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="300" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons-container">
                    <el-button
                      v-if="!(row.errorReason && row.taskStatus == -1)"
                      type="text"
                      size="small"
                      @click="() => handleViewSupplierMaterialDetail(row)"
                      class="action-btn"
                    >
                      查看详情
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="() => handleDownloadFile(row)"
                      class="action-btn"
                    >
                      查看源文件
                    </el-button>
                    <el-button
                      type="primary"
                      size="small"
                      @click="() => handleConfirmResults(row)"
                      :disabled="row.taskStatus !== 2"
                      class="action-btn confirm-btn"
                    >
                      确认解析结果
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination
            @size-change="handleSupplierMaterialSizeChange"
            @current-change="handleSupplierMaterialCurrentChange"
            :current-page="supplierMaterialTasksPagination.currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="supplierMaterialTasksPagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="supplierMaterialTasksPagination.total"
            background
            style="margin-top: 20px; text-align: right"
          >
          </el-pagination>
        </div>
      </div>

      <!-- 甲供物资任务 -->
      <div class="task-row">
        <div class="row-header">
          <h3 class="row-title">
            <el-icon class="row-icon">
              <Goods />
            </el-icon>
            甲供物资解析任务详情列表
          </h3>
          <div class="row-stats">
            <el-badge :value="ownerMaterialTasksPagination.total" class="task-count-badge" />
          </div>
        </div>

        <div class="task-detail-content" v-loading="ownerMaterialTasksLoading">
          <div class="table-container">
            <el-table :data="ownerMaterialTasks" style="width: 100%">
              <el-table-column type="index" label="序号" width="60"></el-table-column>
              <el-table-column prop="id" label="任务ID" width="120"></el-table-column>
              <el-table-column prop="projectCode" label="项目编号" width="150">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectCode || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="projectName" label="项目名称" width="200">
                <template #default="{ row }">
                  {{ row.projectInfo?.projectName || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="fileCount" label="文件数量" width="100">
                <template #default="{ row }">
                  {{ row.fileCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="fileDoneCount" label="完成文件数" width="100">
                <template #default="{ row }">
                  {{ row.fileDoneCount || 0 }}
                </template>
              </el-table-column>
              <el-table-column prop="uploadTime" label="上传时间" width="160">
                <template #default="{ row }">
                  {{ row.uploadTime ? new Date(row.uploadTime).toLocaleString() : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="160">
                <template #default="{ row }">
                  {{ row.startTime ? new Date(row.startTime).toLocaleString() : '未开始' }}
                </template>
              </el-table-column>
              <el-table-column prop="endTime" label="结束时间" width="160">
                <template #default="{ row }">
                  {{ row.endTime ? new Date(row.endTime).toLocaleString() : '未结束' }}
                </template>
              </el-table-column>
              <el-table-column prop="taskStatus" label="任务状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getTaskStatusType(row.taskStatus)">
                    {{ getTaskStatusText(row.taskStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="errorReason" label="失败原因" width="200">
                <template #default="{ row }">
                  {{ row.errorReason || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" fixed="right">
                <template #default="{ row }">
                  <div class="action-buttons-container">
                    <el-button
                      v-if="!(row.errorReason && row.taskStatus == -1)"
                      type="text"
                      size="small"
                      @click="() => handleViewOwnerMaterialDetail(row)"
                      class="action-btn"
                    >
                      查看详情
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click="() => handleDownloadFile(row)"
                      class="action-btn"
                    >
                      查看源文件
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination
            @size-change="handleOwnerMaterialSizeChange"
            @current-change="handleOwnerMaterialCurrentChange"
            :current-page="ownerMaterialTasksPagination.currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="ownerMaterialTasksPagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="ownerMaterialTasksPagination.total"
            background
            style="margin-top: 20px; text-align: right"
          >
          </el-pagination>
        </div>
      </div>
    </div>

    <!-- 乙供物资解析结果确认对话框 -->
    <SupplierMaterialConfirmDialog
      :show="showConfirmDialog"
      :task-id="confirmTaskId"
      @update:show="showConfirmDialog = $event"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  ArrowLeft,
  Refresh,
  Download,
  Document,
  Box,
  Goods,
  List,
  CircleCheck,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 导入服务和状态管理
import { useProjectStore } from '@/stores/project.js'
import { downloadSourceFile } from '@/utils/fileDownload.js'
import { useParsingResultStore } from '@/stores/parsingResult'

// 导入确认对话框组件
import SupplierMaterialConfirmDialog from '@/components/home/SupplierMaterialConfirmDialog/SupplierMaterialConfirmDialog.vue'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const parsingResultStore = useParsingResultStore()

// 从项目store中获取数据
const {
  currentProject
} = storeToRefs(projectStore)

// 响应式数据
const exportLoading = ref(false)
const contractTasksLoading = ref(false)
const supplierMaterialTasksLoading = ref(false)
const ownerMaterialTasksLoading = ref(false)

// 任务详情数据
const contractTasks = ref([])
const supplierMaterialTasks = ref([])
const ownerMaterialTasks = ref([])

// 分页数据
const contractTasksPagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const supplierMaterialTasksPagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const ownerMaterialTasksPagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmTaskId = ref(null)

// 计算属性
const projectStatistics = computed(() => {
  if (!currentProject.value) return []

  return [
    {
      key: 'totalTasks',
      label: '任务总数',
      value: currentProject.value.totalTasks || 0,
      icon: List,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      key: 'completedTasks',
      label: '已完成',
      value: currentProject.value.completedTasks || 0,
      icon: CircleCheck,
      color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      key: 'inProgressTasks',
      label: '进行中',
      value: currentProject.value.inProgressTasks || 0,
      icon: Loading,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }
  ]
})

// 方法定义
// 加载项目信息
const loadProjectInfo = async () => {
  const projectId = route.params.projectId

  // 从项目列表缓存中获取项目基本信息
  const cachedProject = projectStore.getProjectById(projectId)
  if (cachedProject) {
    currentProject.value = cachedProject
  } else {
    // 如果缓存中没有，设置基本信息
    currentProject.value = {
      projectId: projectId,
      projectName: `项目 ${projectId}`,
      projectCode: projectId,
      totalTasks: 0,
      contractTasks: 0,
      supplierMaterialTasks: 0,
      ownerMaterialTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      failedTasks: 0
    }
  }
}

// 获取合同解析任务详情列表
const fetchContractTaskDetails = async () => {
  if (!route.params.projectId) return

  contractTasksLoading.value = true
  try {
    console.log('【调试】获取合同解析任务，项目ID:', route.params.projectId)

    // 直接从智能体任务API获取合同任务，支持分页
    const tasksResponse = await projectStore.getAgentTasks({
      agentLabels: 'contract',
      projectId: route.params.projectId,
      page: contractTasksPagination.value.currentPage - 1, // 后端从0开始
      size: contractTasksPagination.value.pageSize
    })

    console.log('【调试】合同任务API响应:', tasksResponse)

    if (tasksResponse && tasksResponse.content && Array.isArray(tasksResponse.content)) {
      contractTasks.value = tasksResponse.content
      contractTasksPagination.value.total = tasksResponse.totalElements || 0

      console.log('【成功】合同任务数据加载完成，共', contractTasks.value.length, '条，总计', contractTasksPagination.value.total, '条')
    } else {
      contractTasks.value = []
      contractTasksPagination.value.total = 0
      console.log('【警告】合同任务API返回空数据或格式异常')
    }
  } catch (error) {
    console.error('【错误】获取合同解析任务详情列表失败:', error)
    ElMessage.error('获取合同解析任务详情列表失败')
    contractTasks.value = []
    contractTasksPagination.value.total = 0
  } finally {
    contractTasksLoading.value = false
  }
}

// 获取乙供物资解析任务详情列表
const fetchSupplierMaterialTaskDetails = async () => {
  if (!route.params.projectId) return

  supplierMaterialTasksLoading.value = true
  try {
    console.log('【调试】获取乙供物资解析任务，项目ID:', route.params.projectId)

    // 直接从智能体任务API获取乙供物资任务，支持分页
    const tasksResponse = await projectStore.getAgentTasks({
      agentLabels: 'y_material',
      projectId: route.params.projectId,
      page: supplierMaterialTasksPagination.value.currentPage - 1, // 后端从0开始
      size: supplierMaterialTasksPagination.value.pageSize
    })

    console.log('【调试】乙供物资任务API响应:', tasksResponse)

    if (tasksResponse && tasksResponse.content && Array.isArray(tasksResponse.content)) {
      supplierMaterialTasks.value = tasksResponse.content
      supplierMaterialTasksPagination.value.total = tasksResponse.totalElements || 0

      console.log('【成功】乙供物资任务数据加载完成，共', supplierMaterialTasks.value.length, '条，总计', supplierMaterialTasksPagination.value.total, '条')
    } else {
      supplierMaterialTasks.value = []
      supplierMaterialTasksPagination.value.total = 0
      console.log('【警告】乙供物资任务API返回空数据或格式异常')
    }
  } catch (error) {
    console.error('【错误】获取乙供物资解析任务详情列表失败:', error)
    ElMessage.error('获取乙供物资解析任务详情列表失败')
    supplierMaterialTasks.value = []
    supplierMaterialTasksPagination.value.total = 0
  } finally {
    supplierMaterialTasksLoading.value = false
  }
}

// 获取甲供物资解析任务详情列表
const fetchOwnerMaterialTaskDetails = async () => {
  if (!route.params.projectId) return

  ownerMaterialTasksLoading.value = true
  try {
    console.log('【调试】获取甲供物资解析任务，项目ID:', route.params.projectId)

    // 直接从智能体任务API获取甲供物资任务，支持分页
    const tasksResponse = await projectStore.getAgentTasks({
      agentLabels: 'j_material',
      projectId: route.params.projectId,
      page: ownerMaterialTasksPagination.value.currentPage - 1, // 后端从0开始
      size: ownerMaterialTasksPagination.value.pageSize
    })

    console.log('【调试】甲供物资任务API响应:', tasksResponse)

    if (tasksResponse && tasksResponse.content && Array.isArray(tasksResponse.content)) {
      ownerMaterialTasks.value = tasksResponse.content
      ownerMaterialTasksPagination.value.total = tasksResponse.totalElements || 0

      console.log('【成功】甲供物资任务数据加载完成，共', ownerMaterialTasks.value.length, '条，总计', ownerMaterialTasksPagination.value.total, '条')
    } else {
      ownerMaterialTasks.value = []
      ownerMaterialTasksPagination.value.total = 0
      console.log('【警告】甲供物资任务API返回空数据或格式异常')
    }
  } catch (error) {
    console.error('【错误】获取甲供物资解析任务详情列表失败:', error)
    ElMessage.error('获取甲供物资解析任务详情列表失败')
    ownerMaterialTasks.value = []
    ownerMaterialTasksPagination.value.total = 0
  } finally {
    ownerMaterialTasksLoading.value = false
  }
}

// 初始化加载所有数据
const loadAllData = async () => {
  await loadProjectInfo()
  await Promise.all([
    fetchContractTaskDetails(),
    fetchSupplierMaterialTaskDetails(),
    fetchOwnerMaterialTaskDetails()
  ])
  updateProjectStatistics()
}

// 更新项目统计信息
const updateProjectStatistics = () => {
  if (!currentProject.value) return

  currentProject.value.contractTasks = contractTasksPagination.value.total
  currentProject.value.supplierMaterialTasks = supplierMaterialTasksPagination.value.total
  currentProject.value.ownerMaterialTasks = ownerMaterialTasksPagination.value.total
  currentProject.value.totalTasks = contractTasksPagination.value.total +
                                    supplierMaterialTasksPagination.value.total +
                                    ownerMaterialTasksPagination.value.total
}

const goBack = () => {
  router.push('/project-management')
}

const handleRefresh = async () => {
  await loadAllData()
  ElMessage.success('数据刷新成功')
}

const handleExportAll = async () => {
  try {
    exportLoading.value = true

    const allTasks = [
      ...contractTasks.value,
      ...supplierMaterialTasks.value,
      ...ownerMaterialTasks.value
    ]

    // 这里实现导出逻辑
    console.log('导出所有任务数据:', allTasks)
    ElMessage.success('导出成功')

  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 合同解析任务操作
const handleViewContractDetail = async (row) => {
  if (row.taskStatus !== 2 && row.taskStatus !== 3) {
    ElMessage.warning('只有处理完成或已确认的任务才能查看解析结果详情')
    return
  }

  try {
    // 从智能体任务获取主任务ID
    const tasksResponse = await projectStore.getAgentTasks({
      agentLabels: 'contract',
      projectId: route.params.projectId,
      page: 0,
      size: 1
    })

    if (tasksResponse.content && tasksResponse.content.length > 0) {
      const mainTaskId = tasksResponse.content[0].id

      await parsingResultStore.viewResultDetail({
        isSupplierMaterial: false,
        specificTaskId: mainTaskId,
        taskDetailId: row.id || row.taskDetailId
      })
    }
  } catch (error) {
    console.error('查看合同解析结果详情失败:', error)
    ElMessage.error('查看解析结果详情失败')
  }
}

// 乙供物资解析任务操作
const handleViewSupplierMaterialDetail = (row) => {
  const detailId = row.id || row.taskDetailId || row.detailId || row.uuid || row.Id

  if (!detailId) {
    ElMessage.error('缺少详情ID，无法跳转到详情页面')
    return
  }

  // 获取主任务ID
  projectStore.getAgentTasks({
    agentLabels: 'y_material',
    projectId: route.params.projectId,
    page: 0,
    size: 1
  }).then(response => {
    if (response.content && response.content.length > 0) {
      const taskId = response.content[0].id
      router.push({
        name: 'supplier-material-detail',
        params: {
          taskId: taskId,
          detailId: detailId
        }
      })
    }
  })
}

// 甲供物资解析任务操作
// eslint-disable-next-line no-unused-vars
const handleViewOwnerMaterialDetail = (row) => {
  // 获取主任务ID
  projectStore.getAgentTasks({
    agentLabels: 'j_material',
    projectId: route.params.projectId,
    page: 0,
    size: 1
  }).then(response => {
    if (response.content && response.content.length > 0) {
      const taskId = response.content[0].id
      router.push(`/owner-material-detail/${taskId}`)
    }
  })
}

// 下载文件
const handleDownloadFile = (row) => {
  if (row.fileUrl) {
    downloadSourceFile(row)
  } else {
    ElMessage.warning('该记录没有关联的文件')
  }
}

// 确认解析结果
// eslint-disable-next-line no-unused-vars
const handleConfirmResults = (row) => {
  // 获取主任务ID
  projectStore.getAgentTasks({
    agentLabels: 'y_material',
    projectId: route.params.projectId,
    page: 0,
    size: 1
  }).then(response => {
    if (response.content && response.content.length > 0) {
      confirmTaskId.value = response.content[0].id
      showConfirmDialog.value = true
    }
  })
}


// 根据API文档的taskStatus字段获取任务状态文本
const getTaskStatusText = (taskStatus) => {
  const statusMap = {
    0: '排队中',
    1: '处理中',
    2: '处理完成',
    3: '已确认',
    '-1': '错误中断'
  }
  return statusMap[taskStatus] || '未知状态'
}

// 根据API文档的taskStatus字段获取Element Plus标签类型
const getTaskStatusType = (taskStatus) => {
  const typeMap = {
    0: 'info',      // 排队中 - 信息色
    1: 'warning',   // 处理中 - 警告色
    2: 'success',   // 处理完成 - 成功色
    3: 'success',   // 已确认 - 成功色
    '-1': 'danger'  // 错误中断 - 危险色
  }
  return typeMap[taskStatus] || 'info'
}

// 分页事件处理
// 合同任务分页
const handleContractSizeChange = (val) => {
  contractTasksPagination.value.pageSize = val
  contractTasksPagination.value.currentPage = 1
  fetchContractTaskDetails()
}

const handleContractCurrentChange = (val) => {
  contractTasksPagination.value.currentPage = val
  fetchContractTaskDetails()
}

// 乙供物资任务分页
const handleSupplierMaterialSizeChange = (val) => {
  supplierMaterialTasksPagination.value.pageSize = val
  supplierMaterialTasksPagination.value.currentPage = 1
  fetchSupplierMaterialTaskDetails()
}

const handleSupplierMaterialCurrentChange = (val) => {
  supplierMaterialTasksPagination.value.currentPage = val
  fetchSupplierMaterialTaskDetails()
}

// 甲供物资任务分页
const handleOwnerMaterialSizeChange = (val) => {
  ownerMaterialTasksPagination.value.pageSize = val
  ownerMaterialTasksPagination.value.currentPage = 1
  fetchOwnerMaterialTaskDetails()
}

const handleOwnerMaterialCurrentChange = (val) => {
  ownerMaterialTasksPagination.value.currentPage = val
  fetchOwnerMaterialTaskDetails()
}

// 生命周期
onMounted(async () => {
  await loadAllData()
})
</script>

<style scoped>
/* 基础样式 */
.project-detail-page {
  background: var(--theme-bg-primary);
  min-height: 100vh;
  padding: 24px;
  font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: var(--theme-card-bg);
  border-radius: 12px;
  box-shadow: var(--theme-card-shadow);
  border: 1px solid var(--theme-card-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 16px;
  color: var(--theme-text-secondary);
  margin: 0;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 项目统计卡片 */
.project-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stats-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient, linear-gradient(90deg, var(--theme-primary), var(--theme-primary-light)));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--theme-card-hover-shadow);
}

.stats-card:hover::before {
  opacity: 1;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 任务容器 */
.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 任务行 */
.task-row {
  background: var(--theme-card-bg);
  border-radius: 12px;
  border: 1px solid var(--theme-card-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.02), rgba(79, 70, 229, 0.01));
  border-bottom: 2px solid var(--theme-border-secondary);
}

.row-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text-primary);
  margin: 0;
}

.row-icon {
  font-size: 20px;
  color: var(--theme-primary);
}

.row-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-count-badge {
  font-size: 14px;
}

/* 任务详情内容区域 */
.task-detail-content {
  padding: 20px;
}

/* 表格容器 - 固定高度，相当于10条数据的显示空间 */
.table-container {
  height: 500px;
  overflow-y: auto;
  border: 1px solid var(--theme-border-secondary);
  border-radius: 8px;
  background: var(--theme-card-bg);
}

/* 操作按钮容器样式 - 确保按钮并排展示 */
.action-buttons-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-start;
  min-width: 280px;
}

/* 操作按钮样式 */
.action-btn {
  white-space: nowrap;
  flex-shrink: 0;
  margin: 0 !important;
  padding: 4px 8px;
  font-size: 12px;
  min-width: auto;
}

/* 确认按钮特殊样式 */
.confirm-btn {
  background: #67c23a;
  border-color: #67c23a;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #5daf34;
  border-color: #5daf34;
}

.confirm-btn:disabled {
  background: #c0c4cc;
  border-color: #c0c4cc;
  color: #ffffff;
  cursor: not-allowed;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
}

:deep(.el-button--text) {
  padding: 4px 8px;
  min-height: auto;
  font-size: 12px;
  color: #409eff;
}

:deep(.el-button--text:hover) {
  color: #66b1ff;
  background-color: rgba(64, 158, 255, 0.1);
}

:deep(.el-table) {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

:deep(.el-table th) {
  background: #f8f9fa !important;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-table td) {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
}

:deep(.el-table tr:hover > td) {
  background: #f8f9ff !important;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

/* 专门针对操作列的样式 */
:deep(.el-table__body .el-table__row .el-table__cell:last-child) {
  min-width: 280px;
  width: auto;
}

/* 确保操作列内容不会溢出 */
:deep(.el-table__body .el-table__row .el-table__cell:last-child .cell) {
  overflow: visible;
  text-overflow: initial;
  white-space: nowrap;
}

:deep(.el-pagination) {
  margin-top: 24px;
  text-align: right;
}

:deep(.el-pagination .btn-next),
:deep(.el-pagination .btn-prev) {
  background: white;
  color: #666;
}

:deep(.el-pagination .el-pager li.active) {
  background: #667eea;
  color: white;
}

:deep(.el-pagination .el-pager li:hover) {
  color: #667eea;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: none;
}

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-badge__content) {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-primary-light));
  border: none;
  font-weight: 600;
}

:deep(.el-tag) {
  font-weight: 600;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

:deep(.el-empty) {
  padding: 40px 20px;
}

:deep(.el-empty__description) {
  color: var(--theme-text-secondary);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .tasks-container {
    gap: 20px;
  }

  .project-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .project-detail-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 20px;
  }

  .header-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .project-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-buttons-container {
    flex-wrap: wrap;
    min-width: 200px;
    gap: 4px;
  }

  .action-btn {
    font-size: 11px;
    padding: 3px 6px;
  }

  :deep(.el-table__body .el-table__row .el-table__cell:last-child) {
    min-width: 220px;
  }
}
</style>