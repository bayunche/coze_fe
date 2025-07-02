<template>
  <div class="welcome-container" @click="goToHome">
    <h1 class="welcome-title">{{ typedText }}<span class="typing-cursor">|</span></h1>
    <div class="ai-element ai-element-1"></div>
    <div class="ai-element ai-element-2"></div>
    <div class="ai-element ai-element-3"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fullText = '欢迎进入五模二算智能体。'
const typedText = ref('')
let charIndex = 0

const typeWriterEffect = () => {
  if (charIndex < fullText.length) {
    typedText.value += fullText.charAt(charIndex)
    charIndex++
    setTimeout(typeWriterEffect, 100) // 每个字符显示间隔
  }
}

onMounted(() => {
  typeWriterEffect()
})

const goToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #ffffff; /* 白底 */
  /* 移除网格背景，保持纯白 */
  color: #333333; /* 深色文字以适应白底 */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
  position: relative; /* 确保伪元素定位正确 */
  overflow: hidden; /* 隐藏溢出内容 */
}

/* AI主题的背景效果 */
.welcome-container::before,
.welcome-container::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  opacity: 0.05; /* 降低透明度，更柔和 */
  filter: blur(60px); /* 增加模糊度 */
  z-index: 0;
}

.welcome-container::before {
  width: 350px; /* 稍微增大 */
  height: 350px;
  background-color: #4a90e2; /* 柔和的蓝色 */
  top: 15%;
  left: 10%;
  animation: float-effect 10s ease-in-out infinite alternate;
}

.welcome-container::after {
  width: 300px; /* 稍微增大 */
  height: 300px;
  background-color: #7ed321; /* 柔和的绿色 */
  bottom: 10%;
  right: 10%;
  animation: float-effect 12s ease-in-out infinite alternate-reverse;
}

@keyframes float-effect {
  0% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -20px) scale(1.05);
  }
  50% {
    transform: translate(0, 20px) scale(1);
  }
  75% {
    transform: translate(-20px, -20px) scale(0.95);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

.welcome-title {
  font-size: 3.5em; /* 调整字体大小 */
  font-weight: 500; /* 调整字重，更简约 */
  letter-spacing: 1px; /* 调整字间距 */
  color: #2c3e50; /* 更深的文字颜色，对比度更高 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.05); /* 调整轻微阴影 */
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏溢出文本 */
  border-right: 0.08em solid #2c3e50; /* 模拟光标，颜色与文字匹配 */
  animation:
    typing 4s steps(25, end) forwards,
    /* 打字动画 */ blink-caret 0.75s step-end infinite; /* 光标闪烁动画 */
  position: relative; /* 确保标题在伪元素之上 */
  z-index: 1;
}

/* 打字动画 */
@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* 光标闪烁动画 */
@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: #2c3e50; /* 光标颜色与文字匹配 */
  }
}

.typing-cursor {
  display: inline-block;
  vertical-align: bottom;
  animation: blink-caret 0.75s step-end infinite;
}

/* AI几何元素 */
.ai-element {
  position: absolute;
  background-color: rgba(74, 144, 226, 0.03); /* 柔和的蓝色，更透明 */
  border: 1px solid rgba(74, 144, 226, 0.08); /* 柔和的边框 */
  opacity: 0; /* 初始隐藏 */
  animation: fade-in-move 18s infinite ease-out; /* 动画时间更长，更平滑 */
  z-index: 0;
}

.ai-element-1 {
  width: 90px; /* 调整大小 */
  height: 90px;
  top: 25%;
  left: 8%;
  transform: rotate(45deg);
  animation-delay: 1.5s; /* 调整延迟 */
}

.ai-element-2 {
  width: 130px; /* 调整大小 */
  height: 130px;
  border-radius: 50%;
  bottom: 20%;
  right: 10%;
  animation-delay: 4s; /* 调整延迟 */
}

.ai-element-3 {
  width: 70px; /* 调整大小 */
  height: 70px;
  top: 55%;
  left: 15%;
  transform: skewX(-15deg); /* 调整倾斜度 */
  animation-delay: 6.5s; /* 调整延迟 */
}

@keyframes fade-in-move {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.7);
  }
  15% {
    opacity: 0.08; /* 调整最大透明度 */
    transform: translate(15px, -15px) scale(1);
  }
  85% {
    opacity: 0.08;
    transform: translate(-15px, 15px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(0, 0) scale(0.7);
  }
}
</style>
