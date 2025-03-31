import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import AcedSettings from '@/components/AcedSettings.vue'; // Import settings as a page

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: AcedSettings, // Now AcedSettings is a full page
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
