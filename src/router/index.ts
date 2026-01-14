import { createRouter, createWebHistory } from 'vue-router'
// Dynamic imports are better, but let's stick to simple first.
// We need to create the view files first or this will fail.
// So I will use string components for now or create the files immediately after.
// Actually I'll create the view files first in the next tool call, then this one.
// But to save round trips, I'll assume they exist.
// Wait, I can create them in parallel.

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/annotation'
    },
    {
      path: '/annotation',
      name: 'annotation',
      component: () => import('../views/AnnotationView.vue')
    },
    {
      path: '/label-config',
      name: 'label-config',
      component: () => import('../views/LabelConfigView.vue')
    }
  ]
})

export default router
