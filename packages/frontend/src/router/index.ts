import { createRouter, createWebHistory } from 'vue-router'

const dummyComponent = { render: () => null }

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/:pathMatch(.*)*', name: 'folder', component: dummyComponent }
  ]
})
