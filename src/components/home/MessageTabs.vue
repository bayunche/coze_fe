<template>
  <div class="tabs-and-clear-button">
    <el-tabs v-model="activeTab" class="message-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="所有消息" name="all"></el-tab-pane>
      <el-tab-pane label="合同解析" name="contract"></el-tab-pane>
      <el-tab-pane label="乙供物资解析" name="material"></el-tab-pane>
      <el-tab-pane label="甲供物资解析" name="j_material"></el-tab-pane>
      <el-tab-pane label="对话流" name="dialogue"></el-tab-pane>
    </el-tabs>
    <el-button
      type="info"
      :icon="Delete"
      circle
      plain
      class="clear-messages-button"
      @click="handleClearMessages"
      title="清空所有消息"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useChatStore } from '@/stores/chat'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'clear-messages'])

// 本地状态
const activeTab = ref(props.modelValue)

// Store
const chatStore = useChatStore()

// 监听本地状态变化，同步到父组件
watch(activeTab, (newValue) => {
  emit('update:modelValue', newValue)
})

// 监听props变化，同步到本地状态
watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue
})

/**
 * 处理标签页点击
 */
const handleTabClick = () => {
  emit('tab-click')
}

/**
 * 处理清空消息
 */
const handleClearMessages = () => {
  ElMessageBox.confirm('确定要清空所有消息吗？此操作不可逆。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      chatStore.resetAndInitMessages()
      activeTab.value = 'all'
      ElMessage.success('消息已清空。')
      emit('clear-messages')
    })
    .catch(() => {
      ElMessage.info('已取消清空操作。')
    })
}
</script>

<style scoped>
.tabs-and-clear-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;
}

.message-tabs {
  flex-grow: 1;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: none;
}

.clear-messages-button {
  margin-left: 10px;
  flex-shrink: 0;
}
</style>