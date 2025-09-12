<template>
  <div>
    <!-- 这是一个逻辑组件，不渲染任何内容 -->
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useOwnerMaterialStore, TaskStatus } from '@/stores/ownerMaterial'
import { useChatStore } from '@/stores/chat'

// Stores
const workflowStore = useWorkflowStore()
const ownerMaterialStore = useOwnerMaterialStore()
const chatStore = useChatStore()

// 路由相关
const router = useRouter()
const route = useRoute()

// 从 Store 中解构状态和方法
const { taskStatusMap, currentTaskId } = storeToRefs(ownerMaterialStore)
const { resetWorkflowConfig } = workflowStore
const { addMessage } = chatStore

// 检测路由参数处理重新解析
onMounted(() => {
  resetWorkflowConfig()

  // 检测是否需要触发重新解析
  const triggerReparse = route.query.triggerReparse
  if (triggerReparse) {
    // 清除URL参数
    router.replace({ query: {} })

    // 延迟一点时间让页面加载完成，然后触发重新解析
    setTimeout(async () => {
      console.log('【诊断】TaskStatusWatcher - 等待页面加载完成，开始检查任务状态...')
      console.log('【诊断】TaskStatusWatcher - 当前任务状态:', ownerMaterialStore.getTaskStatus(triggerReparse))
      
      if (ownerMaterialStore.getTaskStatus(triggerReparse) === TaskStatus.READY_FOR_ALIGNMENT) {
        console.log('【诊断】TaskStatusWatcher - 检测到 triggerReparse 参数，自动触发重新解析')
        addMessage('检测到物资信息确认完成，开始执行重新解析...', 'system')
        
        try {
          await workflowStore.executeOwnerMaterialReparse(triggerReparse, addMessage)
          addMessage(`甲供物资解析已完成。`, 'system')
        } catch (error) {
          addMessage(`甲供物资重新解析失败: ${error.message}`, 'system')
          console.error('甲供物资重新解析失败:', error)
        }
      }
    }, 1000)
  }
})

// 监听甲供物资对平任务状态的变化
watch(
  [taskStatusMap, currentTaskId],
  ([newTaskStatusMap], [oldTaskStatusMap]) => {
    // 检查是否有任务状态变为 ready_for_alignment
    Object.keys(newTaskStatusMap).forEach(async (taskId) => {
      const newStatus = newTaskStatusMap[taskId]?.status
      const oldStatus = oldTaskStatusMap?.[taskId]?.status
      
      if (newStatus !== oldStatus) {
        console.log(`【诊断】TaskStatusWatcher - 任务 ${taskId} 状态变化: ${oldStatus} -> ${newStatus}`)
        
        if (newStatus === TaskStatus.READY_FOR_ALIGNMENT) {
          console.log(`【诊断】TaskStatusWatcher - 检测到任务 ${taskId} 已准备好对平，开始执行...`)
          addMessage(
            `接收到人工确认完成信号，即将开始对任务 ${taskId} 进行最终的物资对平...`,
            'system'
          )

          // 更新状态为正在对平
          ownerMaterialStore.updateTaskStatus(taskId, TaskStatus.ALIGNING)

          // 调用第二个甲供物资重新解析工作流
          try {
            await workflowStore.executeOwnerMaterialReparse(taskId, addMessage)
            ownerMaterialStore.updateTaskStatus(taskId, TaskStatus.COMPLETED)
            addMessage(`任务 ${taskId} 的甲供物资重新解析已完成。`, 'system')
          } catch (error) {
            ownerMaterialStore.updateTaskStatus(taskId, TaskStatus.FAILED)
            addMessage(`任务 ${taskId} 的甲供物资重新解析失败: ${error.message}`, 'system')
            console.error('甲供物资重新解析失败:', error)
          }
        }
      }
    })
  },
  { deep: true }
)
</script>