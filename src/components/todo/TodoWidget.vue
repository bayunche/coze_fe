<template>
  <div class="todo-widget" v-if="authStore.isAdmin">
    <!-- 浮动触发按钮 -->
    <div class="todo-float-button" @click="toggleWidget" :class="{ 'has-todos': hasPendingTodos }">
      <el-icon class="todo-icon">
        <Bell />
      </el-icon>
      <el-badge
        v-if="todoStatistics.pendingCount > 0"
        :value="todoStatistics.pendingCount"
        :max="99"
        class="todo-badge"
      />
    </div>

    <!-- 待办小窗口 -->
    <el-card
      v-show="widgetVisible"
      class="todo-widget-panel"
      shadow="always"
    >
      <template #header>
        <div class="widget-header">
          <span class="widget-title">待办事项</span>
          <div class="header-actions">
            <el-button
              @click="refreshTodos"
              :loading="loading"
              size="small"
              type="primary"
              link
            >
              <el-icon><Refresh /></el-icon>
            </el-button>
            <el-button @click="closeWidget" size="small" type="primary" link>
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div class="widget-content">
        <!-- 统计信息 -->
        <div class="todo-stats">
          <div class="stat-item">
            <span class="stat-label">待处理</span>
            <span class="stat-value pending">{{ todoStatistics.pendingCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">处理中</span>
            <span class="stat-value processing">{{ todoStatistics.processingCount || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">高优先级</span>
            <span class="stat-value high">{{ todoStatistics.highPriorityCount || 0 }}</span>
          </div>
        </div>

        <el-divider />

        <!-- 待办列表 -->
        <div class="todo-list" v-loading="loading">
          <div v-if="todoList.length === 0 && !loading" class="empty-state">
            <el-icon class="empty-icon"><Check /></el-icon>
            <p class="empty-text">暂无待办事项</p>
          </div>

          <div
            v-for="todo in todoList"
            :key="todo.id"
            class="todo-item"
            @click="handleTodoClick(todo)"
          >
            <div class="todo-content">
              <div class="todo-title">{{ todo.title }}</div>
              <div class="todo-meta">
                <el-tag
                  :type="getTodoTypeColor(todo.todoType)"
                  size="small"
                >
                  {{ getTodoTypeDescription(todo.todoType) }}
                </el-tag>
                <span class="todo-time">{{ formatTime(todo.createTime) }}</span>
              </div>
            </div>
            <div class="todo-actions">
              <el-icon class="action-icon"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>

        <!-- 查看更多按钮 -->
        <div class="widget-footer" v-if="todoList.length > 0">
          <el-button
            @click="viewAllTodos"
            size="small"
            type="primary"
            plain
            style="width: 100%"
          >
            查看全部待办
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Bell, Refresh, Close, Check, ArrowRight } from '@element-plus/icons-vue'
import todoService from '@/services/TodoService'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const widgetVisible = ref(false)
const loading = ref(false)
const todoList = ref([])
const todoStatistics = reactive({
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  highPriorityCount: 0,
  overdueCount: 0
})

// 计算属性
const hasPendingTodos = computed(() => todoStatistics.pendingCount > 0)

// 定时器
let refreshTimer = null

// 方法
const toggleWidget = () => {
  widgetVisible.value = !widgetVisible.value
  if (widgetVisible.value && todoList.value.length === 0) {
    loadTodos()
  }
}

const closeWidget = () => {
  widgetVisible.value = false
}

const loadTodos = async () => {
  try {
    loading.value = true

    const response = await todoService.getAdminPendingTodos({
      page: 0,
      size: 5, // 只显示前5条
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

const handleTodoClick = (todo) => {
  const route = todoService.getTodoRoute(todo)
  if (route) {
    router.push(route)
    closeWidget()
  } else {
    ElMessage.warning('暂无对应的详情页面')
  }
}

const viewAllTodos = () => {
  // 跳转到待办管理页面（需要创建）
  router.push('/todo-management')
  closeWidget()
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
  // 每30秒自动刷新一次
  refreshTimer = setInterval(() => {
    if (authStore.isAdmin) {
      loadTodos()
    }
  }, 30000)
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

// 点击外部区域关闭
const handleClickOutside = (event) => {
  const widget = event.target.closest('.todo-widget')
  if (!widget && widgetVisible.value) {
    closeWidget()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.todo-widget {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
}

.todo-float-button {
  width: 56px;
  height: 56px;
  background: var(--el-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
}

.todo-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.todo-float-button.has-todos {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 8px rgba(64, 158, 255, 0.2);
  }
}

.todo-icon {
  color: white;
  font-size: 24px;
}

.todo-badge {
  position: absolute;
  top: -5px;
  right: -5px;
}

.todo-widget-panel {
  position: absolute;
  top: 70px;
  right: 0;
  width: 320px;
  max-height: 500px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.widget-content {
  max-height: 400px;
  overflow-y: auto;
}

.todo-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
}

.stat-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-value.pending {
  color: var(--el-color-danger);
}

.stat-value.processing {
  color: var(--el-color-warning);
}

.stat-value.high {
  color: var(--el-color-primary);
}

.todo-list {
  min-height: 120px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 32px;
  color: var(--el-color-success);
  margin-bottom: 8px;
}

.empty-text {
  margin: 0;
  font-size: 14px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.todo-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color);
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.todo-actions {
  margin-left: 8px;
}

.action-icon {
  color: var(--el-text-color-placeholder);
  transition: color 0.3s ease;
}

.todo-item:hover .action-icon {
  color: var(--el-color-primary);
}

.widget-footer {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .todo-widget {
    top: 10px;
    right: 10px;
  }

  .todo-widget-panel {
    width: 280px;
  }

  .todo-float-button {
    width: 48px;
    height: 48px;
  }

  .todo-icon {
    font-size: 20px;
  }
}
</style>