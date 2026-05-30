import { createRouter, createWebHistory } from 'vue-router'
import OldView from '../views/OldView.vue'
import SimView from '../views/SimView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SimView,
    },
    {
      path: '/alt',
      name: 'alt',
      component: OldView,
    }
  ],
})

export default router
