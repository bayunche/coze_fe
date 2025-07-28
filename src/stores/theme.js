import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 主题列表
  const themes = ref([
    {
      id: 'light',
      name: '默认浅色',
      description: '清新简洁的浅色主题',
      preview: '#165dff'
    },
    {
      id: 'dark',
      name: '暗黑模式',
      description: '护眼的暗色主题',
      preview: '#409eff'
    },
    {
      id: 'tech-blue',
      name: '科技蓝',
      description: '未来感十足的科技主题',
      preview: '#00d4ff'
    },
    {
      id: 'purple-dream',
      name: '紫色梦幻',
      description: '优雅的紫色渐变主题',
      preview: '#8b5cf6'
    },
    {
      id: 'forest-green',
      name: '森林绿',
      description: '清新自然的绿色主题',
      preview: '#059669'
    },
    {
      id: 'orange-energy',
      name: '橙色活力',
      description: '充满活力的橙色主题',
      preview: '#ea580c'
    }
  ])

  // 当前主题
  const currentTheme = ref('light')
  
  // 是否自动根据系统主题切换
  const autoTheme = ref(false)
  
  // 检测系统主题
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // 应用主题到文档
  const applyTheme = (themeId) => {
    if (typeof document !== 'undefined') {
      // 移除之前的主题
      document.documentElement.removeAttribute('data-theme')
      
      // 应用新主题
      if (themeId !== 'light') {
        document.documentElement.setAttribute('data-theme', themeId)
      }
      
      // 更新Element Plus主题变量
      updateElementPlusTheme(themeId)
    }
  }

  // 更新Element Plus主题变量
  const updateElementPlusTheme = (themeId) => {
    // Element Plus变量现在通过CSS变量自动同步，无需手动设置
    // 主题变量已经在themes.css中为每个主题定义了对应的--el-*变量
  }

  // 切换主题
  const setTheme = (themeId) => {
    if (themes.value.find(theme => theme.id === themeId)) {
      currentTheme.value = themeId
      applyTheme(themeId)
    }
  }

  // 切换自动主题
  const setAutoTheme = (enabled) => {
    autoTheme.value = enabled
    if (enabled) {
      const systemTheme = getSystemTheme()
      setTheme(systemTheme)
    }
  }

  // 监听系统主题变化
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (autoTheme.value) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    })
  }

  // 监听主题变化，持久化存储
  watch(currentTheme, (newTheme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  })

  watch(autoTheme, (newAutoTheme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('autoTheme', newAutoTheme.toString())
    }
  })

  // 初始化主题
  const initTheme = () => {
    if (typeof localStorage !== 'undefined') {
      // 读取保存的设置
      const savedTheme = localStorage.getItem('theme')
      const savedAutoTheme = localStorage.getItem('autoTheme')
      
      if (savedAutoTheme === 'true') {
        autoTheme.value = true
        const systemTheme = getSystemTheme()
        setTheme(systemTheme)
      } else if (savedTheme && themes.value.find(theme => theme.id === savedTheme)) {
        setTheme(savedTheme)
      } else {
        setTheme('light')
      }
    } else {
      setTheme('light')
    }
  }

  // 获取当前主题信息
  const getCurrentThemeInfo = () => {
    return themes.value.find(theme => theme.id === currentTheme.value) || themes.value[0]
  }

  // 获取主题变量值
  const getThemeVariable = (variableName) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      return computedStyle.getPropertyValue(variableName).trim()
    }
    return ''
  }

  return {
    themes,
    currentTheme,
    autoTheme,
    setTheme,
    setAutoTheme,
    initTheme,
    getCurrentThemeInfo,
    getThemeVariable,
    applyTheme
  }
}, {
  persist: {
    key: 'theme-settings',
    paths: ['currentTheme', 'autoTheme']
  }
})