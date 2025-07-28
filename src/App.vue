<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <RouterView />
</template>

<style lang="scss" scoped>
.el-header {
  padding: 0 20px;
}
.el-menu-item.is-active {
  color: var(--el-menu-active-color);
  font-weight: bold;
}
.el-menu-item:hover {
  background-color: #e5e7eb;
}
</style>
