<template>
  <div class="operation-guide">
    <div class="guide-content">
      <el-icon class="guide-icon">
        <InfoFilled />
      </el-icon>
      <span class="guide-text">请点击下方卡片查看对应的物资数据并进行处理</span>
      <span class="guide-text">请将所有有问题的数据处理完毕后再进行生成报告操作</span>

    </div>
  </div>
</template>

<script setup>
import { InfoFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.operation-guide {
  background: var(--theme-card-bg);
  border: 1px solid var(--theme-card-border);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  backdrop-filter: var(--theme-backdrop-blur, none);
  box-shadow: var(--theme-card-shadow);
  transition: all 0.3s ease;
}

.guide-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--theme-text-secondary);
  font-size: 14px;
}

.guide-icon {
  font-size: 16px;
  color: var(--theme-primary-color);
}

.guide-text {
  line-height: 1.4;
}

/* 苹果毛玻璃主题优化 */
[data-theme='apple-glass'] .operation-guide {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 122, 255, 0.2);
  backdrop-filter: blur(20px) saturate(180%);
}

/* 科技蓝主题优化 */
[data-theme='tech-blue'] .operation-guide {
  background: rgba(30, 50, 80, 0.8);
  border-color: rgba(100, 150, 255, 0.3);
  backdrop-filter: blur(10px);
}

/* 紫色梦幻主题优化 */
[data-theme='purple-dream'] .operation-guide {
  background: rgba(138, 43, 226, 0.1);
  border-color: rgba(138, 43, 226, 0.3);
}

/* 森林绿主题优化 */
[data-theme='forest-green'] .operation-guide {
  background: rgba(34, 139, 34, 0.1);
  border-color: rgba(34, 139, 34, 0.3);
}

/* 橙色活力主题优化 */
[data-theme='orange-energy'] .operation-guide {
  background: rgba(255, 140, 0, 0.1);
  border-color: rgba(255, 140, 0, 0.3);
}
</style>