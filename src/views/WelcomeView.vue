<template>
  <div class="welcome-container" @click="goToHome">
    <!-- 动态背景粒子 -->
    <div class="particle-bg">
      <div class="particle" v-for="i in 50" :key="i" :style="getParticleStyle(i)"></div>
    </div>

    <!-- 科技感网格背景 -->
    <div class="grid-overlay"></div>

    <!-- 主要内容 -->
    <div class="content-wrapper">
      <!-- Logo/图标区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-icon">
            <div class="icon-inner">
              <div class="circuit-line"></div>
              <div class="circuit-line"></div>
              <div class="circuit-line"></div>
              <div class="core-dot"></div>
            </div>
          </div>
          <div class="logo-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring-3 ring"></div>
          </div>
        </div>
      </div>

      <!-- 标题区域 -->
      <div class="title-section">
        <h1 class="main-title">
          <span class="title-line">{{ typedText }}</span>
          <span class="typing-cursor" :class="{ blink: showCursor }">|</span>
        </h1>
        <p class="subtitle">Intelligent Workflow Platform</p>
        <div class="tech-bars">
          <div class="bar" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.5}s` }"></div>
        </div>
      </div>

      <!-- 操作提示 -->
      <div class="action-hint">
        <div class="hint-text">
          <span class="hint-icon">⚡</span>
          点击任意位置进入系统
          <span class="hint-icon">⚡</span>
        </div>
        <div class="pulse-indicator"></div>
      </div>
    </div>

    <!-- 装饰性几何元素 -->
    <div class="deco-elements">
      <div class="deco-element deco-1"></div>
      <div class="deco-element deco-2"></div>
      <div class="deco-element deco-3"></div>
      <div class="deco-element deco-4"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fullText = '五模二算智能体'
const typedText = ref('')
const showCursor = ref(true)
let charIndex = 0
let animationFrame = null

// 打字机效果
const typeWriterEffect = () => {
  if (charIndex < fullText.length) {
    typedText.value += fullText.charAt(charIndex)
    charIndex++
    setTimeout(typeWriterEffect, 150) // 每个字符显示间隔
  } else {
    // 打字完成后开始光标闪烁
    setInterval(() => {
      showCursor.value = !showCursor.value
    }, 600)
  }
}

// 生成粒子样式
const getParticleStyle = (index) => {
  const size = Math.random() * 4 + 2
  const x = Math.random() * 100
  const y = Math.random() * 100
  const delay = Math.random() * 5
  const duration = Math.random() * 3 + 2

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

onMounted(() => {
  // 延迟开始打字效果
  setTimeout(() => {
    typeWriterEffect()
  }, 1000)
})

const goToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.welcome-container {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafb 50%, #ffffff 100%);
  color: #2c3e50;
  font-family:
    'SF Pro Display',
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 粒子背景 */
.particle-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.particle {
  position: absolute;
  background: #007bff;
  border-radius: 50%;
  animation: float-particle linear infinite;
  opacity: 0.4;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3);
}

@keyframes float-particle {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* 科技感网格 */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 123, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 123, 255, 0.08) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 2;
  animation: grid-pulse 4s ease-in-out infinite;
}

@keyframes grid-pulse {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}

/* 主要内容区域 */
.content-wrapper {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

/* Logo区域 */
.logo-section {
  margin-bottom: 3rem;
  animation: logo-entrance 2s ease-out;
}

@keyframes logo-entrance {
  0% {
    opacity: 0;
    transform: scale(0.5) rotateY(180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
  }
}

.logo-container {
  position: relative;
  display: inline-block;
  width: 120px;
  height: 120px;
}

.logo-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #007bff, #0056b3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(0, 123, 255, 0.3);
  animation: logo-glow 2s ease-in-out infinite alternate;
}

@keyframes logo-glow {
  0% {
    box-shadow: 0 0 30px rgba(0, 123, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 50px rgba(0, 123, 255, 0.5);
  }
}

.icon-inner {
  position: relative;
  width: 30px;
  height: 30px;
}

.circuit-line {
  position: absolute;
  background: #ffffff;
  border-radius: 1px;
}

.circuit-line:nth-child(1) {
  width: 20px;
  height: 2px;
  top: 8px;
  left: 5px;
  animation: circuit-flow 1.5s ease-in-out infinite;
}

.circuit-line:nth-child(2) {
  width: 2px;
  height: 15px;
  top: 8px;
  left: 14px;
  animation: circuit-flow 1.5s ease-in-out infinite 0.3s;
}

.circuit-line:nth-child(3) {
  width: 12px;
  height: 2px;
  top: 20px;
  left: 9px;
  animation: circuit-flow 1.5s ease-in-out infinite 0.6s;
}

@keyframes circuit-flow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 8px #ffffff;
  }
}

.core-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: #ffffff;
  border-radius: 50%;
  animation: core-pulse 1s ease-in-out infinite;
}

@keyframes core-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
  }
}

/* 环形装饰 */
.logo-rings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ring {
  position: absolute;
  border: 1px solid rgba(0, 123, 255, 0.2);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-1 {
  width: 80px;
  height: 80px;
  animation: ring-rotate 10s linear infinite;
}

.ring-2 {
  width: 100px;
  height: 100px;
  animation: ring-rotate 15s linear infinite reverse;
  border-style: dashed;
}

.ring-3 {
  width: 120px;
  height: 120px;
  animation: ring-rotate 20s linear infinite;
  opacity: 0.5;
}

@keyframes ring-rotate {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 标题区域 */
.title-section {
  margin-bottom: 4rem;
}

.main-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #2c3e50, #007bff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

.title-lined {
  display: inline-block;
  animation: title-slide-in 1s ease-out 0.5s both;
}

@keyframes title-slide-in {
  0% {
    opacity: 0;
    transform: translateX(-50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.typing-cursor {
  display: inline-block;
  width: 3px;
  background: #007bff;
  margin-left: 2px;
  animation: cursor-blink 1.2s ease-in-out infinite;
}

.typing-cursor.blink {
  animation: cursor-blink 0.6s ease-in-out infinite;
}

@keyframes cursor-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.subtitle {
  font-size: 1.2rem;
  font-weight: 300;
  color: rgba(44, 62, 80, 0.7);
  margin: 0 0 2rem 0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  animation: subtitle-fade-in 1s ease-out 1.5s both;
}

@keyframes subtitle-fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 科技感进度条 */
.tech-bars {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 1rem;
}

.bar {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #007bff, transparent);
  border-radius: 2px;
  animation: bar-scan 2s ease-in-out infinite;
}

@keyframes bar-scan {
  0%,
  100% {
    opacity: 0.3;
    transform: scaleX(0.5);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* 操作提示 */
.action-hint {
  position: relative;
  animation: hint-bounce 2s ease-in-out infinite 3s;
}

@keyframes hint-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hint-text {
  font-size: 1rem;
  color: rgba(44, 62, 80, 0.8);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.hint-icon {
  font-size: 1.2rem;
  animation: icon-glow 1.5s ease-in-out infinite alternate;
}

@keyframes icon-glow {
  0% {
    color: rgba(44, 62, 80, 0.8);
  }
  100% {
    color: #007bff;
  }
}

.pulse-indicator {
  width: 12px;
  height: 12px;
  background: #007bff;
  border-radius: 50%;
  margin: 0 auto;
  animation: pulse-grow 1.5s ease-in-out infinite;
}

@keyframes pulse-grow {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
  }
}

/* 装饰性几何元素 */
.deco-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  pointer-events: none;
}

.deco-element {
  position: absolute;
  border: 1px solid rgba(0, 123, 255, 0.15);
  background: rgba(0, 123, 255, 0.03);
}

.deco-1 {
  width: 100px;
  height: 100px;
  top: 10%;
  left: 10%;
  transform: rotate(45deg);
  animation: deco-float 6s ease-in-out infinite;
}

.deco-2 {
  width: 80px;
  height: 80px;
  bottom: 15%;
  right: 15%;
  border-radius: 50%;
  animation: deco-float 8s ease-in-out infinite reverse;
}

.deco-3 {
  width: 60px;
  height: 60px;
  top: 60%;
  left: 5%;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  animation: deco-float 7s ease-in-out infinite;
}

.deco-4 {
  width: 120px;
  height: 2px;
  top: 25%;
  right: 10%;
  background: linear-gradient(90deg, transparent, rgba(0, 123, 255, 0.3), transparent);
  animation: deco-slide 4s ease-in-out infinite;
}

@keyframes deco-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.4;
  }
}

@keyframes deco-slide {
  0%,
  100% {
    transform: translateX(0);
    opacity: 0.2;
  }
  50% {
    transform: translateX(-30px);
    opacity: 0.5;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
  }

  .logo-container {
    width: 100px;
    height: 100px;
  }

  .logo-icon {
    width: 50px;
    height: 50px;
  }

  .title-section {
    margin-bottom: 3rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .deco-element {
    opacity: 0.2;
  }
}

@media (max-width: 480px) {
  .logo-section {
    margin-bottom: 2rem;
  }

  .title-section {
    margin-bottom: 2rem;
  }

  .tech-bars {
    gap: 4px;
  }

  .bar {
    width: 40px;
    height: 3px;
  }
}

/* 点击涟漪效果 */
.welcome-container:active {
  animation: click-ripple 0.3s ease-out;
}

@keyframes click-ripple {
  0% {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafb 50%, #ffffff 100%);
  }
  50% {
    background: linear-gradient(135deg, #f0f2f5 0%, #e9ecef 50%, #f0f2f5 100%);
  }
  100% {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafb 50%, #ffffff 100%);
  }
}
</style>
