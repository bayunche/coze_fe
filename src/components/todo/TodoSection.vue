<template>
  <div class="todo-section" v-if="authStore.isAdmin">
    <div class="section-header">
      <h2 class="section-title">
        <el-icon class="title-icon"><Bell /></el-icon>
        待办事项
      </h2>
      <div class="header-actions">
        <el-button
          @click="refreshTodos"
          :loading="loading"
          size="small"
          type="primary"
          link
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button
          @click="viewAllTodos"
          size="small"
          type="primary"
          link
        >
          查看全部
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="todo-stats-cards">
      <el-card
        v-for="(stat, key) in TODO_STATS_CONFIG"
        :key="key"
        class="stat-card clickable-card"
        @click="openStatsDialog(stat.type)"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon" :style="{ background: stat.background }">
            {{ stat.icon }}
          </div>
          <div class="stat-info">
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-value" :style="{ color: stat.color }">
              {{ todoStatistics[stat.key] || 0 }}
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 待办列表 -->
    <el-card class="todo-list-card" shadow="never">
      <template #header>
        <div class="list-header">
          <span>最新待办</span>
          <el-badge
            v-if="todoStatistics.pendingCount > 0"
            :value="todoStatistics.pendingCount"
            :max="99"
            type="danger"
          />
        </div>
      </template>

      <div class="todo-list" v-loading="loading">
        <!-- 空状态 -->
        <div v-if="todoList.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon"><Check /></el-icon>
          <p class="empty-text">暂无待办事项</p>
          <p class="empty-desc">所有工作都已完成，继续保持！</p>
        </div>

        <!-- 待办项 -->
        <div
          v-for="todo in displayedTodos"
          :key="todo.id"
          class="todo-item"
          @click="handleTodoClick(todo)"
        >
          <div class="todo-left">
            <div class="todo-type-indicator" :class="getTodoTypeClass(todo.todoType)"></div>
            <div class="todo-content">
              <div class="todo-title">{{ todo.title }}</div>
              <div class="todo-desc" v-if="todo.content">{{ todo.content }}</div>
              <div class="todo-meta">
                <el-tag
                  :type="getTodoTypeColor(todo.todoType)"
                  size="small"
                >
                  {{ getTodoTypeDescription(todo.todoType) }}
                </el-tag>
                <el-tag
                  v-if="todo.priority > 3"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  高优先级
                </el-tag>
                <span class="todo-time">{{ formatTime(todo.createTime) }}</span>
              </div>
            </div>
          </div>
          <div class="todo-right">
            <el-button
              size="small"
              type="primary"
              link
              @click.stop="handleTodoClick(todo)"
            >
              处理
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 展开/收起按钮 -->
        <div class="expand-actions" v-if="todoList.length > 3">
          <el-button
            @click="toggleExpanded"
            type="primary"
            link
          >
            {{ expanded ? '收起' : `展开更多 (${todoList.length - 3})` }}
            <el-icon>
              <ArrowDown v-if="!expanded" />
              <ArrowUp v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 待办统计弹窗 -->
    <TodoStatsDialog
      v-model:show="statsDialogVisible"
      :dialog-type="currentStatsType"
      :statistics="todoStatistics"
      @refresh="refreshTodos"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Bell,
  Refresh,
  Check,
  ArrowRight,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import todoService from '@/services/TodoService'
import TodoStatsDialog from './TodoStatsDialog.vue'
import { ElMessage } from 'element-plus'

// 常量配置
const TODO_STATS_CONFIG = {
  pending: {
    type: 'pending',
    key: 'pendingCount',
    title: '待处理',
    icon: '⏳',
    color: '#f56c6c',
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  },
  processing: {
    type: 'processing',
    key: 'processingCount',
    title: '处理中',
    icon: '🔄',
    color: '#e6a23c',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  high: {
    type: 'high',
    key: 'highPriorityCount',
    title: '高优先级',
    icon: '⚡',
    color: '#409eff',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  overdue: {
    type: 'overdue',
    key: 'overdueCount',
    title: '已逾期',
    icon: '⚠️',
    color: '#f56c6c',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
  }
}

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const expanded = ref(false)
const todoList = ref([])
const todoStatistics = reactive({
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  highPriorityCount: 0,
  overdueCount: 0,
  totalCount: 0
})

// 弹窗相关
const statsDialogVisible = ref(false)
const currentStatsType = ref('pending')

// 定时器
let refreshTimer = null

// 计算属性
const displayedTodos = computed(() => {
  return expanded.value ? todoList.value : todoList.value.slice(0, 3)
})

// 方法
const loadTodos = async () => {
  try {
    loading.value = true

    const response = await todoService.getAdminPendingTodos({
      page: 0,
      size: 10, // 加载更多数据以支持展开
      status: 0 // 只显示待处理状态
    })

    if (response.success && response.data) {
      todoList.value = response.data.todoItems || []

      // 更新统计信息
      if (response.data.statistics) {
        Object.assign(todoStatistics, response.data.statistics)
      }
    }
  } catch (error) {
    console.error('【错误】加载待办列表失败:', error)
    ElMessage.error('加载待办列表失败')
  } finally {
    loading.value = false
  }
}

const refreshTodos = async () => {
  await loadTodos()
  ElMessage.success('刷新成功')
}

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const handleTodoClick = (todo) => {
  const route = todoService.getTodoRoute(todo)
  if (route) {
    router.push(route)
  } else {
    ElMessage.warning('暂无对应的详情页面')
  }
}

const viewAllTodos = () => {
  // 跳转到待办管理页面
  router.push('/todo-management')
}

const openStatsDialog = (type) => {
  currentStatsType.value = type
  statsDialogVisible.value = true
}

const getTodoTypeDescription = (todoType) => {
  return todoService.getTodoTypeDescription(todoType)
}

const getTodoTypeColor = (todoType) => {
  const colorMap = {
    'Y_MATERIAL': 'primary',
    'TEMP_MATERIAL': 'success',
    'TEMP_PRICE': 'warning'
  }
  return colorMap[todoType] || 'info'
}

const getTodoTypeClass = (todoType) => {
  const classMap = {
    'Y_MATERIAL': 'type-y-material',
    'TEMP_MATERIAL': 'type-temp-material',
    'TEMP_PRICE': 'type-temp-price'
  }
  return classMap[todoType] || 'type-default'
}

const formatTime = (timeString) => {
  if (!timeString) return ''

  const time = new Date(timeString)
  const now = new Date()
  const diff = now - time

  // 小于1小时显示分钟
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }

  // 小于24小时显示小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }

  // 大于24小时显示日期
  return time.toLocaleDateString()
}

// 自动刷新
const startAutoRefresh = () => {
  // 每60秒自动刷新一次
  refreshTimer = setInterval(() => {
    if (authStore.isAdmin) {
      loadTodos()
    }
  }, 60000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(() => {
  if (authStore.isAdmin) {
    loadTodos()
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.todo-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: var(--theme-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.todo-stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--theme-card-hover-shadow);
  border-color: var(--theme-primary);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.todo-list-card {
  border: 1px solid var(--theme-card-border);
  border-radius: 12px;
  background: var(--theme-card-bg);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.todo-list {
  min-height: 120px;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--theme-text-secondary);
}

.empty-icon {
  font-size: 48px;
  color: var(--theme-success);
  margin-bottom: 12px;
}

.empty-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  color: var(--theme-text-placeholder);
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--theme-border-light);
  background: var(--theme-bg-secondary);
}

.todo-item:hover {
  background: var(--theme-bg-tertiary);
  border-color: var(--theme-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.todo-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.todo-type-indicator {
  width: 4px;
  height: 48px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 4px;
}

.todo-type-indicator.type-y-material {
  background: var(--theme-primary);
}

.todo-type-indicator.type-temp-material {
  background: var(--theme-success);
}

.todo-type-indicator.type-temp-price {
  background: var(--theme-warning);
}

.todo-type-indicator.type-default {
  background: var(--theme-info);
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-desc {
  font-size: 14px;
  color: var(--theme-text-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.todo-time {
  font-size: 12px;
  color: var(--theme-text-placeholder);
}

.todo-right {
  margin-left: 16px;
  flex-shrink: 0;
}

.expand-actions {
  text-align: center;
  padding: 16px;
  border-top: 1px solid var(--theme-border-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .todo-stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .todo-item {
    padding: 12px;
  }

  .todo-left {
    gap: 8px;
  }

  .todo-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>