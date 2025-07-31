<template>
  <div class="theme-manager">
    <!-- 切换模式：仅暗黑/浅色切换 -->
    <template v-if="config.mode === 'toggle'">
      <el-tooltip :content="isDark ? '切换到浅色模式' : '切换到暗黑模式'" placement="top">
        <el-button
          :icon="isDark ? Sunny : Moon"
          :circle="config.circle"
          :size="config.size"
          @click="toggleToDarkMode"
          :class="['toggle-button', { dark: isDark }]"
        />
      </el-tooltip>
    </template>

    <!-- 紧凑模式：弹出主题选择器 -->
    <template v-else-if="config.mode === 'compact'">
      <!-- 使用 Popover -->
      <el-popover
        v-if="config.popupType === 'popover'"
        v-model:visible="popoverVisible"
        :placement="config.placement"
        :width="config.width"
        trigger="click"
        popper-class="theme-popover"
      >
        <template #reference>
          <el-button
            :icon="Brush"
            :circle="config.circle"
            :size="config.size"
            :class="['theme-button', { active: isThemeActive }]"
            :title="themeButtonConfig.TITLE"
          />
        </template>

        <div class="theme-selector-content">
          <ThemeSelectorContent
            :auto-theme="autoTheme"
            :themes="themes"
            :current-theme="currentTheme"
            @theme-select="onThemeSelect"
            @auto-theme-change="onAutoThemeChange"
          />
        </div>
      </el-popover>

      <!-- 使用 Dropdown -->
      <el-dropdown
        v-else
        trigger="click"
        :placement="config.placement"
        popper-class="theme-dropdown-popper"
        @command="onThemeSelect"
      >
        <el-button
          :icon="Brush"
          :circle="config.circle"
          :size="config.size"
          :class="['theme-button', { active: isThemeActive }]"
          :title="themeButtonConfig.TITLE"
        />

        <template #dropdown>
          <el-dropdown-menu class="theme-dropdown-menu">
            <div class="theme-selector-content">
              <ThemeSelectorContent
                :auto-theme="autoTheme"
                :themes="themes"
                :current-theme="currentTheme"
                @theme-select="onThemeSelect"
                @auto-theme-change="onAutoThemeChange"
              />
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>

    <!-- 完整模式：显示主题名称和选择器 -->
    <template v-else>
      <el-dropdown trigger="click" :placement="config.placement" @command="onThemeSelect">
        <el-button type="text" class="theme-trigger">
          <el-icon size="18">
            <component :is="isDark ? Moon : Sunny" />
          </el-icon>
          <span class="theme-name">{{ currentThemeInfo.name }}</span>
        </el-button>

        <template #dropdown>
          <el-dropdown-menu class="theme-dropdown">
            <div class="theme-selector-content">
              <ThemeSelectorContent
                :auto-theme="autoTheme"
                :themes="themes"
                :current-theme="currentTheme"
                :show-grid="true"
                @theme-select="onThemeSelect"
                @auto-theme-change="onAutoThemeChange"
              />
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { Brush, Sunny, Moon } from '@element-plus/icons-vue'

import ThemeSelectorContent from './ThemeSelectorContent.vue'
import { DISPLAY_MODES, DEFAULT_CONFIG, THEME_BUTTON_CONFIG } from './constants.js'
import {
  selectTheme,
  toggleAutoTheme,
  toggleDarkMode,
  isDarkTheme,
  isThemeActive as checkThemeActive,
  getCurrentThemeInfo,
  validateConfig
} from './utils.js'

// Props
const props = defineProps({
  mode: {
    type: String,
    default: DEFAULT_CONFIG.MODE,
    validator: (value) => Object.values(DISPLAY_MODES).includes(value)
  },
  popupType: {
    type: String,
    default: DEFAULT_CONFIG.POPUP_TYPE
  },
  placement: {
    type: String,
    default: DEFAULT_CONFIG.PLACEMENT
  },
  size: {
    type: String,
    default: DEFAULT_CONFIG.SIZE
  },
  width: {
    type: Number,
    default: DEFAULT_CONFIG.WIDTH
  },
  circle: {
    type: Boolean,
    default: DEFAULT_CONFIG.CIRCLE
  }
})

// 主题store
const themeStore = useThemeStore()
const { currentTheme, autoTheme, themes } = storeToRefs(themeStore)

// 响应式数据
const popoverVisible = ref(false)

// 验证配置
const config = computed(() => validateConfig(props))

// 计算属性
const isDark = computed(() => isDarkTheme(currentTheme.value))
const isThemeActive = computed(() => checkThemeActive(currentTheme.value, config.value.mode))
const currentThemeInfo = computed(() => getCurrentThemeInfo(currentTheme.value, themes.value))

// 常量配置
const themeButtonConfig = THEME_BUTTON_CONFIG

// 事件处理
const onThemeSelect = (themeId) => {
  selectTheme(themeId, themeStore)
  popoverVisible.value = false
}

const onAutoThemeChange = (value) => {
  toggleAutoTheme(value, themeStore)
}

const toggleToDarkMode = () => {
  toggleDarkMode(themeStore)
}
</script>

<style scoped>
.theme-manager {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主题按钮样式 */
.theme-button {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-primary);
  color: var(--theme-text-secondary);
  transition: all 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur);
}

.theme-button:hover {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
  transform: scale(1.05);
  box-shadow: var(--theme-shadow-md);
}

.theme-button.active {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

/* 切换按钮样式 */
.toggle-button {
  background: var(--theme-bg-card);
  border: 1px solid var(--theme-border-primary);
  color: var(--theme-text-secondary);
  transition: all 0.3s ease;
  backdrop-filter: var(--theme-backdrop-blur);
}

.toggle-button:hover {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
  transform: scale(1.05);
  box-shadow: var(--theme-shadow-md);
}

.toggle-button.dark {
  background: var(--theme-primary);
  color: var(--theme-text-inverse);
  border-color: var(--theme-primary);
}

.toggle-button.dark:hover {
  background: var(--theme-primary-light);
  border-color: var(--theme-primary-light);
}

/* 完整模式触发器样式 */
.theme-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: var(--theme-text-primary);
  transition: all 0.2s ease;
}

.theme-trigger:hover {
  background: var(--theme-bg-hover);
  color: var(--theme-primary);
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
}

/* 按钮动画效果 */
.theme-button:active,
.toggle-button:active {
  transform: scale(0.95);
}

/* 图标旋转动画 */
.toggle-button :deep(.el-icon) {
  transition: transform 0.3s ease;
}

.toggle-button:hover :deep(.el-icon) {
  transform: rotate(180deg);
}
</style>
