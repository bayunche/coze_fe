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
    if (props.skipAnimation && !props.forceAnimation) {
      if (typingInterval) clearInterval(typingInterval)
      displayedText.value = processText(newText)
      handleTypingComplete()
      return
    }

    if (props.isStreaming && !props.forceAnimation) {
      // For streaming text, just update the display directly
      displayedText.value = processText(newText)
    } else {
      // For non-streaming, restart the typing animation if text actually changes
      if (newText !== oldText) {
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

  if ((!props.isStreaming || props.forceAnimation) && props.text) {
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
