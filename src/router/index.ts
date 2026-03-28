import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'workspace',
      component: () => import('@/views/WorkspaceView.vue'),
    },
    {
      path: '/print/:resumeId',
      name: 'print',
      component: () => import('@/print/PrintView.vue'),
      props: true,
    },
  ],
})
