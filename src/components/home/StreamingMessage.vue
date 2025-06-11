<template>
  <span>{{ displayedText }}</span>
</template>

<script setup>
import { ref, watch, defineEmits } from 'vue'

const emit = defineEmits(['done'])
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 50
  }
})

const displayedText = ref('')
let timer = null

const typeWriter = (text, index) => {
  if (index < text.length) {
    displayedText.value += text.charAt(index)
    timer = setTimeout(() => typeWriter(text, index + 1), props.speed)
  } else {
    emit('done')
  }
}

watch(
  () => props.text,
  (newText) => {
    if (timer) {
      clearTimeout(timer)
    }
    displayedText.value = ''
    if (newText) {
      typeWriter(newText, 0)
    }
  },
  { immediate: true }
)
</script>