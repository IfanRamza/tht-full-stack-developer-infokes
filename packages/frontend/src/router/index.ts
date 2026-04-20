import { createRouter, createWebHistory } from 'vue-router'

const dummyComponent = { render: () => null }

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: dummyComponent },
    { path: '/folder/:id', name: 'folder', component: dummyComponent },
  ],
})
