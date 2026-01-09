import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'feed', component: () => import('@/views/FeedView.vue') },
        { path: 'course', name: 'course', component: () => import('@/views/CourseView.vue') },
        { path: 'zoom', name: 'zoom', component: () => import('@/views/ZoomView.vue') },
        { path: 'tests', name: 'tests', component: () => import('@/views/TestsView.vue') },
        { path: 'questions', name: 'questions', component: () => import('@/views/QuestionsView.vue') },
        { path: 'works', name: 'works', component: () => import('@/views/WorksView.vue') },
        { path: 'materials', name: 'materials', component: () => import('@/views/MaterialsView.vue') },
        { path: 'contact', name: 'contact', component: () => import('@/views/ContactView.vue') },
        { path: 'admin', name: 'admin', component: () => import('@/views/AdminView.vue'), meta: { admin: true } },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (authStore.loading) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.admin && !authStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
