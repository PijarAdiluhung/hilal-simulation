import { createRouter, createWebHistory } from 'vue-router'
import SimView from '../views/SimView.vue' // Import your view

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SimView, // This sets SimView as the default / page
    },
  ],
})

export default router
