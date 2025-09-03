import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/home'
import WelcomePage from '../views/welcome'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomePage
    },
    {
      path: '/home',
      name: 'home',
      component: HomePage
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
      path: '/owner-material-align/:taskId',
      name: 'owner-material-align',
      component: () => import('../views/owner-material-align'),
      props: (route) => ({ taskId: route.params.taskId })
    },
    {
      path: '/owner-material-detail/:taskId',
      name: 'owner-material-detail',
      component: () => import('../views/owner-material-detail'),
      props: (route) => ({ taskId: route.params.taskId })
    },
    {
      path: '/owner-material-report/:taskId',
      name: 'owner-material-report',
      component: () => import('../views/owner-material-report'),
      props: (route) => ({ taskId: route.params.taskId })
    },
    {
      path: '/temporary-data-management',
      name: 'temporary-data-management',
      component: () => import('../views/temporary-data-management'),
      meta: { 
        title: '临时数据管理',
        breadcrumb: ['智能大脑', '数据管理', '临时数据']
      }
    },
    // 保持向后兼容的重定向
    {
      path: '/supplier-material-approval',
      redirect: '/temporary-data-management'
    }
  ]
})

export default router
