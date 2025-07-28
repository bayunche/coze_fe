import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 用户信息
  const user = ref({
    id: '1',
    name: '张三',
    role: 'admin', // 'admin' | 'user'
    avatar: '/avatar.png'
  })

  // 用户角色
  const userRole = ref('admin') // 默认管理员，用于演示

  // 权限检查
  const isAdmin = computed(() => userRole.value === 'admin')
  const isUser = computed(() => userRole.value === 'user')

  // 切换用户角色（仅用于演示）
  const toggleRole = () => {
    userRole.value = userRole.value === 'admin' ? 'user' : 'admin'
    user.value.role = userRole.value
    user.value.name = userRole.value === 'admin' ? '张三(管理员)' : '李四(普通用户)'
  }

  // 检查权限
  const hasPermission = (permission) => {
    const permissions = {
      admin: [
        'view_all_agents',
        'view_all_tasks', 
        'manage_materials',
        'view_material_management',
        'create_material',
        'edit_material',
        'delete_material',
        'import_material',
        'export_material'
      ],
      user: [
        'view_all_agents',
        'view_own_tasks'
      ]
    }
    
    return permissions[userRole.value]?.includes(permission) || false
  }

  return {
    user,
    userRole,
    isAdmin,
    isUser,
    toggleRole,
    hasPermission
  }
}, {
  persist: {
    key: 'auth-store',
    paths: ['user', 'userRole']
  }
})