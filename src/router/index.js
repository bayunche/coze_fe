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
      path: '/smart-brain',
      name: 'smart-brain',
      component: () => import('../views/smart-brain')
    },
    {
      path: '/smart-brain/material-management',
      name: 'material-management',
      component: () => import('../views/material-management')
    },
    {
      path: '/project-data-management',
      name: 'project-data-management',
      component: () => import('../views/project-data-management')
    },
    {
      path: '/project-detail/:projectId',
      name: 'project-detail',
      component: () => import('../views/project-detail'),
      props: true // 允许组件通过 props 接收路由参数
    },
    {
      path: '/supplier-material-detail/:taskId/:detailId',
      name: 'supplier-material-detail',
      component: () => import('../views/supplier-material-detail'),
      props: true // 允许组件通过 props 接收路由参数
    },
    {
      path: '/supplier-material-confirm/:taskId',
      name: 'supplier-material-confirm',
      component: () => import('../views/supplier-material-confirm'),
      props: true // 允许组件通过 props 接收路由参数
    }
  ]
})

export default router
