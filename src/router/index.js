import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WelcomeView from '../views/WelcomeView.vue'

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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/material-detail/:taskId', // 添加 taskId 参数
      name: 'MaterialDetailPage', // 路由名称与 HomeView.vue 中 router.push 的 name 保持一致
      component: () => import('../views/MaterialDetailPage.vue'),
      props: true // 允许组件通过 props 接收路由参数
    },
    {
      path: '/owner-material-detail', // 移除 taskDetailId 路径参数，改为查询参数
      name: 'owner-material-detail',
      component: () => import('../views/OwnerMaterialDetailPage.vue')
    },
    {
      path: '/owner-material-align',
      name: 'owner-material-align',
      component: () => import('../views/OwnerMaterialAlignPage.vue')
    },
    {
      path: '/owner-material-report',
      name: 'OwnerMaterialReport',
      component: () => import('../views/OwnerMaterialReportPage.vue')
    },
    {
      path: '/smart-brain',
      name: 'smart-brain',
      component: () => import('../pages/SmartBrainPage.vue')
    },
    {
      path: '/smart-brain/material-management',
      name: 'material-management',
      component: () => import('../pages/MaterialManagementPage.vue')
    }
  ]
})

export default router
