import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home'
import WelcomeView from '../views/welcome'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView
    },

    {
      path: '/material-detail/:taskId', // 添加 taskId 参数
      name: 'MaterialDetailPage', // 路由名称与 HomeView.vue 中 router.push 的 name 保持一致
      component: () => import('../views/material-detail'),
      props: true // 允许组件通过 props 接收路由参数
    },
    {
      path: '/owner-material-detail', // 移除 taskDetailId 路径参数，改为查询参数
      name: 'owner-material-detail',
      component: () => import('../views/owner-material-detail')
    },
    {
      path: '/owner-material-align',
      name: 'owner-material-align',
      component: () => import('../views/owner-material-align')
    },
    {
      path: '/owner-material-report',
      name: 'OwnerMaterialReport',
      component: () => import('../views/owner-material-report')
    },
    {
      path: '/smart-brain',
      name: 'smart-brain',
      component: () => import('../views/smart-brain')
    },
    {
      path: '/smart-brain/material-management',
      name: 'material-management',
      component: () => import('../views/material-management')
    }
  ]
})

export default router
