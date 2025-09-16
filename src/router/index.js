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
    // 智能大脑任务列表页面
    {
      path: '/smart-brain/contract-tasks',
      name: 'contract-tasks',
      component: () => import('../views/contract-tasks'),
      meta: { 
        title: '合同解析任务列表',
        breadcrumb: ['智能大脑', '合同解析任务']
      }
    },
    {
      path: '/smart-brain/supplier-material-tasks',
      name: 'supplier-material-tasks',
      component: () => import('../views/supplier-material-tasks'),
      meta: { 
        title: '乙供物资解析任务列表',
        breadcrumb: ['智能大脑', '乙供物资解析任务']
      }
    },
    {
      path: '/smart-brain/owner-material-tasks',
      name: 'owner-material-tasks',
      component: () => import('../views/owner-material-tasks'),
      meta: { 
        title: '甲供物资解析任务列表',
        breadcrumb: ['智能大脑', '甲供物资解析任务']
      }
    },
    // 智能大脑任务详情页面
    {
      path: '/smart-brain/contract-task-detail/:taskId',
      name: 'contract-task-detail',
      component: () => import('../views/contract-task-detail'),
      props: true,
      meta: { 
        title: '合同解析任务详情',
        breadcrumb: ['智能大脑', '合同解析任务', '任务详情']
      }
    },
    {
      path: '/smart-brain/supplier-material-task-detail/:taskId',
      name: 'supplier-material-task-detail',
      component: () => import('../views/supplier-material-task-detail'),
      props: true,
      meta: { 
        title: '乙供物资解析任务详情',
        breadcrumb: ['智能大脑', '乙供物资解析任务', '任务详情']
      }
    },
    {
      path: '/smart-brain/owner-material-task-detail/:taskId',
      name: 'owner-material-task-detail',
      component: () => import('../views/owner-material-task-detail'),
      props: true,
      meta: { 
        title: '甲供物资解析任务详情',
        breadcrumb: ['智能大脑', '甲供物资解析任务', '任务详情']
      }
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
      path: '/supplier-material-report/:taskId',
      name: 'supplier-material-report',
      component: () => import('../views/supplier-material-report'),
      props: (route) => ({ taskId: route.params.taskId })
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
      path: '/material-detail/:taskId',
      name: 'material-detail',
      component: () => import('../views/material-detail'),
      props: true,
      meta: { 
        title: '物资解析详情',
        breadcrumb: ['智能大脑', '解析结果', '详情']
      }
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
    {
      path: '/contract-field-management',
      name: 'contract-field-management',
      component: () => import('../views/contract-field-management'),
      meta: { 
        title: '合同解析字段管理',
        breadcrumb: ['智能大脑', '数据管理', '合同字段管理']
      }
    },
    // 乙供物资审批管理页面
    {
      path: '/supplier-material-approval/:taskId',
      name: 'supplier-material-approval',
      component: () => import('../views/supplier-material-approval'),
      props: true,
      meta: {
        title: '乙供物资审批管理',
        breadcrumb: ['智能大脑', '物资管理', '乙供物资审批']
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
