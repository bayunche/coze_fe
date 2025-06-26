<template>
  <span v-html="displayedText"></span>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  skipAnimation: {
    type: Boolean,
    default: false
  },
  forceAnimation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['done'])

const displayedText = ref('')
let typingInterval = null
let currentIndex = 0

const processText = (rawText) => {
  // 始终使用 marked 库来处理文本，以确保 Markdown 渲染
  // marked 库会自动处理纯文本和 Markdown 文本
  return marked(rawText)
}

const type = () => {
  // 如果当前显示的文本长度小于完整文本长度，继续打字
  if (currentIndex < props.text.length) {
    currentIndex++
    displayedText.value = processText(props.text.substring(0, currentIndex))
  } else if (!props.isStreaming) {
    // 如果不是流式传输，并且已经打字完毕，则完成
    handleTypingComplete()
  }
  // 如果是流式传输，即使打字完毕也保持 interval 运行，等待新内容
}

const handleTypingComplete = () => {
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  emit('done')
}

watch(
  () => props.text,
  (newText, oldText) => {
    if (props.skipAnimation && !props.forceAnimation) {
      // 如果跳过动画，直接显示完整文本
      if (typingInterval) clearInterval(typingInterval)
      displayedText.value = processText(newText)
      handleTypingComplete()
      return
    }

    if (props.isStreaming) {
      // 对于流式文本，确保打字机效果持续进行
      if (!typingInterval) {
        currentIndex = displayedText.value.length // 从当前已显示内容的末尾开始
        typingInterval = setInterval(type, 20)
      }
      // 如果新文本变短了（例如，Coze返回了修正后的内容），重置打字机
      if (newText.length < currentIndex) {
        currentIndex = 0
        displayedText.value = ''
        if (typingInterval) clearInterval(typingInterval)
        typingInterval = setInterval(type, 20)
      }
      // 否则，type 函数会自然追赶新文本的长度
    } else {
      // 对于非流式文本，如果文本变化，重新开始打字动画
      if (newText !== oldText) {
        if (typingInterval) clearInterval(typingInterval)
        currentIndex = 0
        displayedText.value = ''
        if (newText) {
          typingInterval = setInterval(type, 20) // 调整打字速度
        } else {
          handleTypingComplete()
        }
      }
    }
  }
)

watch(
  () => props.isStreaming,
  (isStreaming, wasStreaming) => {
    if (wasStreaming && !isStreaming) {
      // Stream has just finished
      handleTypingComplete()
    }
  }
)

onMounted(() => {
  if (props.skipAnimation && !props.forceAnimation) {
    displayedText.value = processText(props.text)
    handleTypingComplete()
    return
  }

  // 只有当文本存在且需要动画时才启动打字机
  if (props.text && (props.isStreaming || props.forceAnimation || !props.skipAnimation)) {
    typingInterval = setInterval(type, 20)
  } else {
    // 如果不需要动画或者没有文本，直接显示
    displayedText.value = processText(props.text)
    handleTypingComplete()
  }
})

onUnmounted(() => {
  if (typingInterval) {
    clearInterval(typingInterval)
  }
})
</script>

<style scoped>
span {
  white-space: pre-wrap;
  word-break: break-word;
}

/* Markdown 表格样式 */
:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.9em;
  color: #333;
}

:deep(th),
:deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

:deep(th) {
  background-color: #f2f2f2;
  font-weight: bold;
}

:deep(tr:nth-child(even)) {
  background-color: #f9f9f9;
}

:deep(tr:hover) {
  background-color: #f1f1f1;
}
</style>
