import { createRouter, createWebHistory } from 'vue-router'
import OldView from '../views/OldView.vue' // Import your view
import SimView from '../views/SimView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SimView, // This sets SimView as the default / page
    },
    {
      path: '/alt',
      name: 'alt',
      component: OldView,
    }
  ],
})

export default router
