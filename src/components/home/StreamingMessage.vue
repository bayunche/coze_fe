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
  }
})

const emit = defineEmits(['done'])

const displayedText = ref('')
let typingInterval = null
let currentIndex = 0

const processText = (rawText) => {
  // A simple check for markdown. More robust checks might be needed.
  if (/[*#_`~]/.test(rawText) || /\[.*\]\(.*\)/.test(rawText)) {
    return marked(rawText)
  }
  return rawText.replace(/\n/g, '<br>')
}

const type = () => {
  if (currentIndex < props.text.length) {
    currentIndex++
    displayedText.value = processText(props.text.substring(0, currentIndex))
  } else {
    handleTypingComplete()
  }
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
    if (props.isStreaming) {
      // For streaming text, just update the display directly
      displayedText.value = processText(newText)
    } else {
      // For non-streaming, restart the typing animation
      if (typingInterval) clearInterval(typingInterval)
      currentIndex = 0
      displayedText.value = ''
      if (newText) {
        typingInterval = setInterval(type, 20) // Adjust typing speed here
      } else {
        handleTypingComplete()
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
  if (!props.isStreaming && props.text) {
    typingInterval = setInterval(type, 20)
  } else {
    displayedText.value = processText(props.text)
    if (!props.isStreaming) {
      handleTypingComplete()
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
</style>
