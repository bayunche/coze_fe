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
      path: '/material-detail',
      name: 'material-detail',
      component: () => import('../views/MaterialDetailPage.vue')
    },
    {
      path: '/owner-material-detail',
      name: 'owner-material-detail',
      component: () => import('../views/OwnerMaterialDetailPage.vue')
    },
    {
      path: '/owner-material-detail',
      name: 'owner-material-detail',
      component: () => import('../views/OwnerMaterialDetailPage.vue')
    }
  ]
})

export default router
