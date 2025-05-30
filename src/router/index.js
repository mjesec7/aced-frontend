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
    children: [
      { path: '', redirect: '/profile/main' },
      { path: 'main', name: 'MainPage', component: MainPage },
      { path: 'catalogue', name: 'CataloguePage', component: CataloguePage },
      { path: 'analytics', name: 'UserAnalyticsPanel', component: UserAnalyticsPanel },
      { path: 'goal', name: 'StudyGoal', component: StudyGoal },
      { path: 'homework', name: 'HomeworkHelp', component: HomeworkHelp },
      { path: 'homeworks', name: 'HomeworkList', component: HomeworkList },
      { path: 'homeworks/:lessonId', name: 'HomeworkPage', component: HomeworkPage, props: true },
      { path: 'diary', name: 'DiaryPage', component: DiaryPage },
    ],
  },
  {
    path: '/tests',
    name: 'TestsPage',
    component: TestsPage,
  },
  {
    path: '/tests/:id',
    name: 'SingleTestPage',
    component: TestsPage,
    props: true,
  },
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: true,
  },
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
  },
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
  },
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
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
  const isPublic = to.name === 'HomePage';

  try {
    await store.dispatch('waitForAuthInit');
  } catch (err) {
    console.warn('⚠️ Firebase auth wait failed:', err);
  }

  const isLoggedIn = store.getters.isLoggedIn;

  if (!isPublic && !isLoggedIn) {
    console.warn('❌ Нет доступа: пользователь не вошел. Перенаправление на главную.');
    return next({ name: 'HomePage' });
  }

  next();
});

// ✅ Catch routing errors
router.onError((err) => {
  console.error('❌ Ошибка маршрута:', err);
});

export default router;
