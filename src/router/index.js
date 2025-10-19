import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// --- VIEWS & COMPONENTS ---

// Main Views
import HomePage from '@/views/HomePage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';
import VocabularyPage from '@/views/VocabularyPage.vue';
import UpdatedCourses from '@/views/UpdatedCourses.vue';
import CataloguePage from '@/views/CataloguePage.vue';

// Profile Sub-Pages
import MainPage from '@/components/Profile/MainPage.vue';
import UserAnalyticsPanel from '@/components/Profile/UserAnalyticsPanel.vue';
import StudyGoal from '@/components/Profile/StudyGoal.vue';
import HomeworkHelp from '@/components/Profile/HomeworkHelp.vue';
import HomeworkList from '@/components/Profile/HomeworkList.vue';
import HomeworkPage from '@/components/Profile/HomeworkPage.vue';
import DiaryPage from '@/components/Profile/DiaryPage.vue';
import TestsPage from '@/components/Profile/TestsPage.vue';

// Payment Components
import PaymePayment from '@/components/Payments/PaymePayment.vue';
import PaymentFailed from '@/components/Payments/PaymentFailed.vue';
import PaymentSuccess from '@/components/Payments/PaymentSuccess.vue';
import PaymentReturn from '@/components/Payments/PaymentReturn.vue';

// Lazy-loaded Components
const MyCourses = () => import('@/components/Profile/MyCourses.vue');
const LessonPage = () => import('@/views/LessonPage.vue');
const TopicFinished = () => import('@/views/TopicFinished.vue');
const TopicOverview = () => import('@/views/TopicOverview.vue');
const PaymeCheckout = () => import('@/views/PaymeCheckout.vue');
const AboutUsPage = () => import('@/components/Main/AboutUs.vue');

// --- ACCESS CONTROL HELPERS ---

/**
 * Determines the user's effective subscription plan by checking multiple sources.
 * @returns {('free'|'start'|'pro')} The user's effective plan.
 */
const getEffectiveUserPlan = () => {
  const storeStatus = store.getters['user/userStatus'];
  const localStatus = localStorage.getItem('userStatus');
  const subscriptionData = localStorage.getItem('subscriptionData');

  let subscriptionPlan = 'free';
  if (subscriptionData) {
    try {
      const parsed = JSON.parse(subscriptionData);
      if (parsed.plan && parsed.expiryDate && new Date() < new Date(parsed.expiryDate)) {
        subscriptionPlan = parsed.plan;
      }
    } catch (e) {
      console.error('Error parsing subscription data:', e);
    }
  }

  // Prioritize sources: active subscription > Vuex store > local storage
  const effectiveStatus = subscriptionPlan !== 'free' ? subscriptionPlan : (storeStatus || localStatus || 'free');
  
  const validPlans = ['free', 'start', 'pro'];
  return validPlans.includes(effectiveStatus) ? effectiveStatus : 'free';
};

/**
 * Creates a reusable route guard to check for feature access based on subscription plans.
 * This eliminates massive code duplication in the routes array.
 * @param {string} featureName - A name for the feature being accessed.
 * @param {Array<string>} requiredPlans - Plans that grant access (e.g., ['start', 'pro']).
 * @param {string} message - Message to show on the payment page.
 * @returns {Function} A Vue Router `beforeEnter` guard function.
 */
const createAccessGuard = (featureName, requiredPlans, message) => {
  return (to, from, next) => {
    const userPlan = getEffectiveUserPlan();
    const hasAccess = requiredPlans.includes(userPlan);

    if (hasAccess) {
      return next();
    }

    // If access is denied, save intended route and redirect to payment
    sessionStorage.setItem('intendedRoute', JSON.stringify({
      path: to.path,
      query: to.query,
      params: to.params
    }));

    const requiredPlan = requiredPlans.includes('pro') ? 'pro' : 'start';

    return next({
      name: 'PaymePayment',
      params: { plan: requiredPlan },
      query: {
        feature: featureName,
        requiredPlan: requiredPlan,
        returnTo: to.path,
        message: message,
      }
    });
  };
};


// --- ROUTE DEFINITIONS ---

const routes = [
  // General Routes
  { path: '/', name: 'HomePage', component: HomePage, meta: { title: 'Главная' } },
  { path: '/about-us', name: 'AboutUsPage', component: AboutUsPage, meta: { title: 'О нас' } },
  { path: '/settings', name: 'SettingsPage', component: AcedSettings, meta: { title: 'Настройки', requiresAuth: true } },

  // Profile Routes
  {
    path: '/profile',
    component: ProfilePage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/profile/main' },
      { path: 'main', name: 'MainPage', component: MainPage, meta: { title: 'Главная' } },
      { path: 'catalogue', name: 'CataloguePage', component: CataloguePage, meta: { title: 'Каталог' } },
      { path: 'my-courses', name: 'MyCourses', component: MyCourses, meta: { title: 'Мои курсы' } },
      { path: 'updated-courses', name: 'UpdatedCourses', component: UpdatedCourses, meta: { title: 'Актуальные курсы' } },
      { path: 'diary', name: 'DiaryPage', component: DiaryPage, meta: { title: 'Дневник' } },
      { path: 'homeworks', name: 'HomeworkList', component: HomeworkList, meta: { title: 'Домашние задания' } },
      
      // Premium Feature Routes using the Access Guard
      {
        path: 'analytics',
        name: 'UserAnalyticsPanel',
        component: UserAnalyticsPanel,
        meta: { title: 'Аналитика' },
        beforeEnter: createAccessGuard('analytics', ['pro'], 'Продвинутая аналитика доступна с подпиской Pro')
      },
      {
        path: 'goal',
        name: 'StudyGoal',
        component: StudyGoal,
        meta: { title: 'Учебные цели' },
        beforeEnter: createAccessGuard('goals', ['start', 'pro'], 'Цели доступны с подпиской Start')
      },
      {
        path: 'homework',
        name: 'HomeworkHelp',
        component: HomeworkHelp,
        meta: { title: 'Помощь с домашкой' },
        beforeEnter: createAccessGuard('homework_help', ['start', 'pro'], 'Помощь с ДЗ доступна с подпиской Start')
      },
      {
        path: 'tests',
        name: 'ProfileTestsPage',
        component: TestsPage,
        meta: { title: 'Тесты' },
        beforeEnter: createAccessGuard('tests', ['start', 'pro'], 'Тесты доступны с подпиской Start')
      },
      {
        path: 'vocabulary',
        name: 'ProfileVocabularyPage',
        component: VocabularyPage,
        meta: { title: 'Словарь' },
        beforeEnter: createAccessGuard('vocabulary', ['start', 'pro'], 'Словарь доступен с подпиской Start')
      },

      // Dynamic Homework Routes
      {
        path: 'homeworks/:id',
        name: 'HomeworkPage',
        component: HomeworkPage,
        props: route => ({ homeworkId: route.params.id, ...route.query }),
        meta: { title: 'Выполнение домашнего задания' },
      },
    ],
  },
  
  // Learning Content Routes
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
    meta: { title: 'Урок' }
  },
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
    meta: { title: 'Обзор темы' }
  },
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
    meta: { requiresAuth: true, title: 'Тема завершена' }
  },

  // Payment Routes
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: true,
    meta: { title: 'Оплата', requiresAuth: true },
    beforeEnter: (to, from, next) => {
      const validPlans = ['start', 'pro'];
      if (!validPlans.includes(to.params.plan)) {
        console.error('❌ Invalid payment plan:', to.params.plan);
        return next({ name: 'SettingsPage', query: { error: 'invalid_plan' } });
      }
      next();
    }
  },
  {
    path: '/payment/checkout',
    name: 'PaymeCheckout',
    component: PaymeCheckout,
    meta: { title: 'PayMe Checkout' },
  },
  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    component: PaymentSuccess,
    meta: { title: 'Платеж успешен' }
  },
  {
    path: '/payment-failed',
    name: 'PaymentFailed',
    component: PaymentFailed,
    meta: { title: 'Ошибка платежа' }
  },
  {
    path: '/payment/return',
    name: 'PaymentReturn',
    component: PaymentReturn,
    meta: { title: 'Обработка платежа' }
  },

  // Redirects and Catch-all
  { path: '/vocabulary/:language?', redirect: '/profile/vocabulary' },
  { path: '/payment/:plan?', redirect: to => `/pay/${to.params.plan || 'start'}` },
  { path: '/:catchAll(.*)', name: 'NotFound', redirect: '/' },
];

// --- ROUTER INSTANCE ---

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 };
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// --- GLOBAL NAVIGATION GUARDS ---

router.beforeEach(async (to, from, next) => {
  console.log(`🔄 Navigating from ${from.name || 'Start'} to ${to.name}`);

  // Wait for Firebase auth to be initialized on app start
  try {
    const { authInitPromise } = await import('@/main.js');
    await authInitPromise;
  } catch (err) {
    console.warn('⚠️ Auth initialization is not yet complete. Proceeding anyway.');
  }

  const isLoggedIn = store.getters.isLoggedIn;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // Handle guest access for lessons and topics
  if (['LessonPage', 'TopicOverview'].includes(to.name)) {
    // These pages are public by default, no special checks needed here
    return next();
  }

  // Handle protected routes
  if (requiresAuth && !isLoggedIn) {
    console.log('🔒 Auth required. Redirecting to HomePage.');
    return next({
      name: 'HomePage',
      query: {
        redirect: to.fullPath,
        loginRequired: 'true',
      },
    });
  }

  console.log('✅ Navigation allowed.');
  next();
});

router.afterEach((to, from) => {
  // Update page title
  const baseTitle = 'ACED - Образовательная платформа';
  document.title = to.meta.title ? `${to.meta.title} - ACED` : baseTitle;
  
  // Periodically check for pending payments to update subscription status automatically
  if (store.getters.isLoggedIn && !to.path.includes('/pay')) {
    const lastCheck = store.getters['user/lastPaymentCheck'];
    const fiveMinutes = 5 * 60 * 1000;
    if (!lastCheck || (Date.now() - lastCheck) > fiveMinutes) {
      store.dispatch('user/checkPendingPayments').catch(err => {
        console.error('❌ Failed to auto-check pending payments:', err);
      });
    }
  }
});

router.onError((err) => {
  console.error('❌ Router Error:', err);
  // Automatically reload the page on chunk load errors
  if (err.message.includes('Failed to fetch dynamically imported module') || err.message.includes('Loading chunk')) {
    console.log('🔄 Chunk loading failed. Reloading the page...');
    window.location.reload();
  }
});

// --- DEBUG HELPERS ---

// Expose debug tools to the console only in development mode
if (process.env.NODE_ENV !== 'production') {
  window.routerDebug = {
    getPlan: () => console.log('Current Plan:', getEffectiveUserPlan()),
    hasAccess: (feature) => console.log(`Access to '${feature}':`, createAccessGuard(feature, ['start', 'pro'])),
    goTo: (path) => router.push(path),
    currentRoute: () => console.table(router.currentRoute.value),
  };
  console.log('🐛 Router debug helpers available at window.routerDebug');
}


export default router;