import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// ✅ Main Views
import HomePage from '@/views/HomePage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';

// ✅ Profile Sub-Pages
import MainPage from '@/components/Profile/MainPage.vue';
import UserAnalyticsPanel from '@/components/Profile/UserAnalyticsPanel.vue';
import StudyGoal from '@/components/Profile/StudyGoal.vue';
import HomeworkHelp from '@/components/Profile/HomeworkHelp.vue';
import HomeworkList from '@/components/Profile/HomeworkList.vue';
import HomeworkPage from '@/components/Profile/HomeworkPage.vue';
import DiaryPage from '@/components/Profile/DiaryPage.vue';
import CataloguePage from '@/views/CataloguePage.vue';
import TestsPage from '@/components/Profile/TestsPage.vue';

// ✅ Payments
import PaymePayment from '@/components/Payments/PaymePayment.vue';

// ✅ Lazy-loaded Views
const LessonPage = () => import('@/views/LessonPage.vue');
const TopicFinished = () => import('@/views/TopicFinished.vue');
const TopicOverview = () => import('@/views/TopicOverview.vue');

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: AcedSettings,
  },
  {
    path: '/profile',
    component: ProfilePage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/profile/main' },
      { 
        path: 'main', 
        name: 'MainPage', 
        component: MainPage,
        meta: { title: 'Главная' }
      },
      { 
        path: 'catalogue', 
        name: 'CataloguePage', 
        component: CataloguePage,
        meta: { title: 'Каталог' }
      },
      { 
        path: 'analytics', 
        name: 'UserAnalyticsPanel', 
        component: UserAnalyticsPanel,
        meta: { title: 'Аналитика' }
      },
      { 
        path: 'goal', 
        name: 'StudyGoal', 
        component: StudyGoal,
        meta: { title: 'Учебные цели' }
      },
      { 
        path: 'homework', 
        name: 'HomeworkHelp', 
        component: HomeworkHelp,
        meta: { title: 'Помощь с домашкой' }
      },
      { 
        path: 'homeworks', 
        name: 'HomeworkList', 
        component: HomeworkList,
        meta: { title: 'Домашние задания' }
      },
      { 
        path: 'homeworks/:lessonId', 
        name: 'HomeworkPage', 
        component: HomeworkPage, 
        props: true,
        meta: { title: 'Выполнение домашнего задания' },
        beforeEnter: (to, from, next) => {
          // Validate lessonId before entering the route
          if (!to.params.lessonId || to.params.lessonId === 'null' || to.params.lessonId === 'undefined') {
            console.error('❌ Invalid lessonId:', to.params.lessonId);
            next({ name: 'HomeworkList' });
          } else {
            next();
          }
        }
      },
      { 
        path: 'diary', 
        name: 'DiaryPage', 
        component: DiaryPage,
        meta: { title: 'Дневник' }
      },
      { 
        path: 'tests', 
        name: 'ProfileTestsPage', 
        component: TestsPage,
        meta: { title: 'Тесты' }
      },
      { 
        path: 'tests/:id', 
        name: 'ProfileSingleTestPage', 
        component: TestsPage, 
        props: true,
        meta: { title: 'Прохождение теста' }
      },
    ],
  },
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: true,
    meta: { title: 'Оплата' }
  },
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
    meta: { requiresAuth: true, title: 'Урок' }
  },
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
    meta: { requiresAuth: true, title: 'Обзор темы' }
  },
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
    meta: { requiresAuth: true, title: 'Тема завершена' }
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80,
      };
    }
    return savedPosition || { top: 0 };
  },
});

// ✅ Route Guard: wait for Firebase auth before navigation
router.beforeEach(async (to, from, next) => {
  // Public routes that don't require authentication
  const publicRoutes = ['HomePage', 'SettingsPage'];
  const isPublic = publicRoutes.includes(to.name);
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  try {
    await store.dispatch('waitForAuthInit');
  } catch (err) {
    console.warn('⚠️ Firebase auth wait failed:', err);
  }

  const isLoggedIn = store.getters.isLoggedIn;

  // If route requires auth and user is not logged in
  if (requiresAuth && !isLoggedIn) {
    console.warn('❌ Нет доступа: пользователь не вошел. Перенаправление на главную.');
    return next({ 
      name: 'HomePage',
      query: { redirect: to.fullPath } // Save the intended destination
    });
  }

  // If trying to access profile routes without auth
  if (!isPublic && !isLoggedIn && to.path.startsWith('/profile')) {
    console.warn('❌ Профиль недоступен без авторизации.');
    return next({ name: 'HomePage' });
  }

  next();
});

// ✅ Set page title after navigation
router.afterEach((to, from) => {
  // Update document title
  const baseTitle = 'ACED';
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle;
  
  // Log navigation for debugging
  console.log(`📍 Navigated from ${from.path} to ${to.path}`);
  
  // Log params if any
  if (Object.keys(to.params).length > 0) {
    console.log('📦 Route params:', to.params);
  }
});

// ✅ Catch routing errors
router.onError((err) => {
  console.error('❌ Ошибка маршрута:', err);
  
  // If chunk loading fails, reload the page
  if (err.message.includes('Failed to fetch dynamically imported module')) {
    console.log('🔄 Reloading due to chunk loading error...');
    window.location.reload();
  }
});

// ✅ Debug navigation failures
router.isReady().then(() => {
  console.log('✅ Router is ready');
}).catch(err => {
  console.error('❌ Router initialization failed:', err);
});

export default router;