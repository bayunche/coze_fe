<template>
  <span v-html="displayedText"></span>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
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

const emit = defineEmits(['done', 'animation-end'])

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
  } else {
    // 如果打字完毕，则完成
    handleTypingComplete()
  }
}

const handleTypingComplete = () => {
  if (typingInterval) {
    clearInterval(typingInterval)
    typingInterval = null
  }
  // 确保动画完成后触发事件
  if (currentIndex >= props.text.length) {
    emit('done')
    emit('animation-end')
  }
}

watch(
  () => props.text,
  (newText, oldText) => {
    if (props.skipAnimation) {
      // 如果跳过动画，直接显示完整文本并清除定时器
      if (typingInterval) {
        clearInterval(typingInterval)
        typingInterval = null
      }
      displayedText.value = processText(newText)
      handleTypingComplete() // 立即触发 done 事件
      return
    }

    if (props.isStreaming) {
      // 对于流式文本，如果新文本包含旧文本作为前缀，则继续打字
      if (newText.startsWith(oldText || '')) {
        currentIndex = displayedText.value.length // 从当前已显示内容的末尾开始
        if (!typingInterval) {
          typingInterval = setInterval(type, 20)
        }
      } else {
        // 如果新文本不包含旧文本作为前缀（例如，完全不同的消息或重置），则重置打字机
        currentIndex = 0
        displayedText.value = ''
        if (typingInterval) {
          clearInterval(typingInterval)
        }
        typingInterval = setInterval(type, 20)
      }
    } else {
      // 对于非流式文本（例如，切换标签页或非流式消息），直接显示完整文本
      if (typingInterval) {
        clearInterval(typingInterval)
        typingInterval = null
      }
      displayedText.value = processText(newText)
      // 对于非流式文本，在 nextTick 后触发完成事件，确保 DOM 更新
      nextTick(() => {
        emit('animation-end')
      })
    }
  }
)

onMounted(() => {
  if (props.skipAnimation) {
    displayedText.value = processText(props.text)
    nextTick(() => {
      emit('animation-end')
    })
    return
  }

  // 只有当文本存在且需要流式动画时才启动打字机
  if (props.text && props.isStreaming) {
    typingInterval = setInterval(type, 20)
  } else {
    // 如果不需要动画 (isStreaming 为 false) 或者没有文本，直接显示
    displayedText.value = processText(props.text)
    // 仅在非流式且有内容时触发，避免为 loading 消息触发
    if (!props.isStreaming && props.text) {
      nextTick(() => {
        emit('animation-end')
      })
    } else if (!props.text) {
      // 如果文本为空（例如 loading 消息），立即触发，因为没有动画
      emit('animation-end')
    }
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
