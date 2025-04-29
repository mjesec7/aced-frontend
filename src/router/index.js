import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store'; // ✅ Store for auth check

// ✅ Main Views
import HomePage from '@/views/HomePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';
import ProfilePage from '@/views/ProfilePage.vue';

// ✅ Profile Sub-Pages
import MainPage from '@/components/Profile/MainPage.vue'; // ✅ Main profile dashboard
import FreeLessons from '@/components/Profile/FreeLessons.vue';
import ProLessons from '@/components/Profile/ProLessons.vue';
import UserAnalyticsPanel from '@/components/Profile/UserAnalyticsPanel.vue';
import SubjectProgress from '@/components/Profile/SubjectProgress.vue';
import StudyGoal from '@/components/Profile/StudyGoal.vue';
import HomeworkHelp from '@/components/Profile/HomeworkHelp.vue';
import DiaryPage from '@/components/Profile/DiaryPage.vue';

// ✅ Payments
import PaymePayment from '@/components/Payments/PaymePayment.vue';

// ✅ Lazy-loaded lessons
const LessonView = () => import('@/views/LessonPage.vue');
const TopicFinished = () => import('@/views/TopicFinished.vue');

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
      { path: 'free', name: 'FreeLessons', component: FreeLessons },
      { path: 'premium', name: 'ProLessons', component: ProLessons },
      { path: 'analytics', name: 'AnalyticsPanel', component: UserAnalyticsPanel },
      { path: 'progress', name: 'SubjectProgress', component: SubjectProgress },
      { path: 'goal', name: 'StudyGoal', component: StudyGoal },
      { path: 'homework', name: 'HomeworkHelp', component: HomeworkHelp },
      { path: 'diary', name: 'DiaryPage', component: DiaryPage },
    ],
  },
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: true,
  },
  {
    path: '/lesson/:id',
    name: 'LessonView',
    component: LessonView,
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
      return { el: to.hash, behavior: 'smooth', top: 80 };
    }
    return savedPosition || { top: 0 };
  },
});

// ✅ Route Guard: Only allow access if logged in
router.beforeEach((to, from, next) => {
  const publicPages = ['HomePage'];
  const authRequired = !publicPages.includes(to.name);
  const userLoggedIn = !!store.state.user;

  if (authRequired && !userLoggedIn) {
    console.warn('⚠️ Доступ запрещен без авторизации. Перенаправляем на главную.');
    return next({ name: 'HomePage' });
  }

  next();
});

// ✅ Error handling
router.onError((error) => {
  console.error('❌ Router error caught:', error);
});

export default router;
