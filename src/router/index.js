import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// ✅ Main Views
import HomePage from '@/views/HomePage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';
import VocabularyPage from '@/views/VocabularyPage.vue';

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
import VocabularyIn from '@/components/Profile/VocabularyIn.vue';

// ✅ Payment Components
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
    meta: { title: 'Главная' }
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: AcedSettings,
    meta: { 
      title: 'Настройки',
      requiresAuth: true 
    },
    beforeEnter: (to, from, next) => {
      console.log('🔧 Accessing settings page');
      next();
    }
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
      
      // ✅ ENHANCED: Flexible homework routes that support both standalone and lesson-based homework
      { 
        path: 'homeworks/:id', 
        name: 'HomeworkPage', 
        component: HomeworkPage, 
        props: route => ({
          homeworkId: route.params.id,
          lessonId: route.params.id,
          homeworkType: route.query.type || route.query.homeworkType,
          title: route.query.title,
          subject: route.query.subject
        }),
        meta: { title: 'Выполнение домашнего задания' },
        beforeEnter: (to, from, next) => {
          if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
            console.error('❌ Invalid homework/lesson ID:', to.params.id);
            next({ name: 'HomeworkList' });
          } else {
            console.log('✅ Valid homework/lesson ID:', to.params.id, 'Type:', to.query.type);
            next();
          }
        }
      },
      
      { 
        path: 'homework/lesson/:lessonId', 
        name: 'LessonHomeworkPage', 
        component: HomeworkPage, 
        props: route => ({
          lessonId: route.params.lessonId,
          homeworkType: 'lesson',
          title: route.query.title,
          subject: route.query.subject
        }),
        meta: { title: 'Домашнее задание урока' },
        beforeEnter: (to, from, next) => {
          if (!to.params.lessonId || to.params.lessonId === 'null' || to.params.lessonId === 'undefined') {
            console.error('❌ Invalid lessonId:', to.params.lessonId);
            next({ name: 'HomeworkList' });
          } else {
            console.log('✅ Valid lessonId:', to.params.lessonId);
            next();
          }
        }
      },
      
      { 
        path: 'homework/standalone/:homeworkId', 
        name: 'StandaloneHomeworkPage', 
        component: HomeworkPage, 
        props: route => ({
          homeworkId: route.params.homeworkId,
          homeworkType: 'standalone',
          title: route.query.title,
          subject: route.query.subject
        }),
        meta: { title: 'Домашнее задание' },
        beforeEnter: (to, from, next) => {
          if (!to.params.homeworkId || to.params.homeworkId === 'null' || to.params.homeworkId === 'undefined') {
            console.error('❌ Invalid homeworkId:', to.params.homeworkId);
            next({ name: 'HomeworkList' });
          } else {
            console.log('✅ Valid homeworkId:', to.params.homeworkId);
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
      
      // ✅ UPDATED: Vocabulary route now uses VocabularyPage from views
      { 
        path: 'vocabulary', 
        name: 'VocabularyPage', 
        component: VocabularyPage,
        meta: { title: 'Словарь' }
      },
      
      // ✅ NEW: VocabularyIn route for specific language learning
      { 
        path: 'vocabulary/:languageCode', 
        name: 'VocabularyIn', 
        component: VocabularyIn,
        props: true,
        meta: { title: 'Изучение языка' },
        beforeEnter: (to, from, next) => {
          const validLanguages = ['english', 'spanish', 'french', 'german', 'chinese', 'arabic', 'japanese', 'korean', 'uzbek', 'russian'];
          if (!to.params.languageCode || !validLanguages.includes(to.params.languageCode)) {
            console.error('❌ Invalid language code:', to.params.languageCode);
            next({ name: 'VocabularyPage' });
          } else {
            console.log('✅ Valid language code:', to.params.languageCode);
            next();
          }
        }
      }
    ],
  },
  
  // ✅ ENHANCED: Payment Routes with validation and authentication
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: route => ({
      plan: route.params.plan,
      userId: route.query.userId,
      returnTo: route.query.returnTo
    }),
    meta: { 
      title: 'Оплата',
      requiresAuth: true,
      description: 'Страница оплаты подписки'
    },
    beforeEnter: (to, from, next) => {
      const validPlans = ['start', 'pro'];
      
      if (!to.params.plan || !validPlans.includes(to.params.plan)) {
        console.error('❌ Invalid payment plan:', to.params.plan);
        return next({ 
          name: 'SettingsPage',
          query: { error: 'invalid_plan' }
        });
      }
      
      console.log('💳 Payment route accessed:', {
        plan: to.params.plan,
        userId: to.query.userId,
        returnTo: to.query.returnTo,
        from: from.path
      });
      
      next();
    }
  },
  
  // ✅ ENHANCED: Payment Success/Failure Routes
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: () => import('@/views/PaymentSuccess.vue'),
    meta: { 
      title: 'Оплата успешна',
      requiresAuth: true 
    },
    beforeEnter: (to, from, next) => {
      console.log('✅ Payment success page accessed');
      // Check for payment status updates
      if (store.getters['user/isAuthenticated']) {
        store.dispatch('user/checkPendingPayments');
      }
      next();
    }
  },
  
  {
    path: '/payment/cancelled',
    name: 'PaymentCancelled',
    component: () => import('@/views/PaymentCancelled.vue'),
    meta: { 
      title: 'Оплата отменена',
      requiresAuth: true 
    },
    beforeEnter: (to, from, next) => {
      console.log('❌ Payment cancelled page accessed');
      next();
    }
  },
  
  // ✅ Learning Content Routes
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
    meta: { 
      requiresAuth: true, 
      title: 'Урок',
      description: 'Страница урока'
    },
    beforeEnter: (to, from, next) => {
      if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
        console.error('❌ Invalid lesson ID:', to.params.id);
        return next({ name: 'CataloguePage' });
      }
      
      console.log('📚 Lesson accessed:', to.params.id);
      next();
    }
  },
  
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
    meta: { 
      requiresAuth: true, 
      title: 'Обзор темы',
      description: 'Обзор темы курса'
    },
    beforeEnter: (to, from, next) => {
      if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
        console.error('❌ Invalid topic ID:', to.params.id);
        return next({ name: 'CataloguePage' });
      }
      
      console.log('📖 Topic overview accessed:', to.params.id);
      next();
    }
  },
  
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
    meta: { 
      requiresAuth: true, 
      title: 'Тема завершена',
      description: 'Страница завершения темы'
    }
  },
  
  // ✅ LEGACY REDIRECTS: Redirect old vocabulary routes to profile vocabulary
  {
    path: '/vocabulary',
    redirect: '/profile/vocabulary'
  },
  {
    path: '/vocabulary/:language',
    redirect: to => `/profile/vocabulary/${to.params.language}`
  },
  
  // ✅ OLD PAYMENT REDIRECTS: Handle legacy payment URLs
  {
    path: '/payment/:plan?',
    redirect: to => {
      const plan = to.params.plan || 'start';
      return `/pay/${plan}`;
    }
  },
  
  // ✅ Catch-all route
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    redirect: '/',
    meta: { title: 'Страница не найдена' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Handle anchors
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80,
      };
    }
    
    // Return to saved position when using browser back/forward
    if (savedPosition) {
      return savedPosition;
    }
    
    // Scroll to top for new routes
    return { top: 0 };
  },
});

// ✅ ENHANCED Route Guard with Payment Integration
router.beforeEach(async (to, from, next) => {
  console.log(`🧭 Navigation: ${from.path || '/'} → ${to.path}`);
  
  // Public routes that don't require authentication
  const publicRoutes = ['HomePage', 'NotFound'];
  const isPublic = publicRoutes.includes(to.name);
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  try {
    // Wait for Firebase auth initialization
    await store.dispatch('waitForAuthInit');
  } catch (err) {
    console.warn('⚠️ Firebase auth wait failed:', err);
  }

  const isLoggedIn = store.getters.isLoggedIn;
  const userId = store.getters['user/getUserId'];

  // ✅ AUTHENTICATION CHECKS
  if (requiresAuth && !isLoggedIn) {
    console.warn('❌ Authentication required. Redirecting to home with login prompt.');
    return next({ 
      name: 'HomePage',
      query: { 
        redirect: to.fullPath,
        loginRequired: 'true'
      }
    });
  }

  // ✅ PAYMENT ROUTE SPECIFIC CHECKS
  if (to.name === 'PaymePayment') {
    if (!isLoggedIn) {
      console.warn('❌ Payment requires authentication');
      return next({ 
        name: 'HomePage',
        query: { 
          redirect: to.fullPath,
          loginRequired: 'true',
          message: 'Для оплаты необходимо войти в систему'
        }
      });
    }
    
    // Add userId to query if not present
    if (!to.query.userId && userId) {
      const newQuery = { ...to.query, userId };
      console.log('💳 Adding userId to payment route:', userId);
      return next({ 
        path: to.path, 
        query: newQuery 
      });
    }
    
    // Check user subscription status
    try {
      await store.dispatch('user/checkPendingPayments');
    } catch (err) {
      console.warn('⚠️ Failed to check pending payments:', err);
    }
  }

  // ✅ PROFILE ROUTE CHECKS
  if (!isPublic && !isLoggedIn && to.path.startsWith('/profile')) {
    console.warn('❌ Profile access requires authentication.');
    return next({ 
      name: 'HomePage',
      query: { 
        redirect: to.fullPath,
        loginRequired: 'true'
      }
    });
  }

  // ✅ ENHANCED LOGGING for specific route types
  if (to.name && to.name.includes('Homework') && to.params.id) {
    console.log('📚 Homework route navigation:', {
      route: to.name,
      id: to.params.id || to.params.homeworkId || to.params.lessonId,
      type: to.query.type,
      from: from.path
    });
  }

  if (to.name && to.name.includes('Vocabulary')) {
    console.log('📖 Vocabulary route navigation:', {
      route: to.name,
      path: to.path,
      params: to.params,
      from: from.path
    });
  }

  if (to.name && (to.name.includes('Payment') || to.name.includes('Payme'))) {
    console.log('💳 Payment route navigation:', {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path,
      isAuthenticated: isLoggedIn,
      userId: userId
    });
  }

  // ✅ SUCCESS: Allow navigation
  next();
});

// ✅ ENHANCED navigation logging after route changes
router.afterEach((to, from) => {
  // Update document title
  const baseTitle = 'ACED - Образовательная платформа';
  document.title = to.meta.title ? `${to.meta.title} - ACED` : baseTitle;
  
  // Enhanced logging for specific route types
  if (to.name && to.name.includes('Homework')) {
    console.log(`📚 Homework navigation completed:`, {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path
    });
  } 
  else if (to.name && to.name.includes('Vocabulary')) {
    console.log(`📖 Vocabulary navigation completed:`, {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path
    });
  }
  else if (to.name && (to.name.includes('Payment') || to.name.includes('Payme'))) {
    console.log(`💳 Payment navigation completed:`, {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path
    });
  } else {
    console.log(`📍 Navigation completed: ${from.path} → ${to.path}`);
  }
  
  // Log params if any
  if (Object.keys(to.params).length > 0) {
    console.log('📦 Route params:', to.params);
  }
  
  // Log query params if any
  if (Object.keys(to.query).length > 0) {
    console.log('🔍 Query params:', to.query);
  }
  
  // ✅ AUTO-CHECK PAYMENTS on navigation (for authenticated users)
  if (store.getters.isLoggedIn && !to.path.includes('/pay')) {
    // Check for pending payments periodically
    const lastCheck = store.getters['user/lastPaymentCheck'];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!lastCheck || (now - lastCheck) > fiveMinutes) {
      store.dispatch('user/checkPendingPayments').catch(err => {
        console.warn('⚠️ Auto payment check failed:', err);
      });
    }
  }
});

// ✅ ENHANCED error handling for routing errors
router.onError((err) => {
  console.error('❌ Router error:', err);
  
  // Handle chunk loading failures (common in production)
  if (err.message.includes('Failed to fetch dynamically imported module') || 
      err.message.includes('Loading chunk')) {
    console.log('🔄 Reloading due to chunk loading error...');
    window.location.reload();
    return;
  }
  
  // Handle navigation errors for specific route types
  if (err.message.includes('homework') || err.message.includes('Homework')) {
    console.error('📚 Homework route error:', err);
  }
  
  if (err.message.includes('vocabulary') || err.message.includes('Vocabulary')) {
    console.error('📖 Vocabulary route error:', err);
  }
  
  if (err.message.includes('payment') || err.message.includes('Payment')) {
    console.error('💳 Payment route error:', err);
  }
  
  // Generic error handling
  console.error('🔄 Navigation failed, attempting recovery...');
});

// ✅ ENHANCED Debug information when router is ready
router.isReady().then(() => {
  console.log('✅ ACED Router initialized successfully');
  console.log('📋 Available route groups:');
  console.log('  🏠 Public routes:');
  console.log('    / (HomePage)');
  console.log('    /settings (AcedSettings - requires auth)');
  
  console.log('  👤 Profile routes:');
  console.log('    /profile/main (MainPage)');
  console.log('    /profile/catalogue (CataloguePage)');
  console.log('    /profile/analytics (UserAnalyticsPanel)');
  console.log('    /profile/vocabulary (VocabularyPage)');
  console.log('    /profile/vocabulary/:languageCode (VocabularyIn)');
  console.log('    /profile/homeworks (HomeworkList)');
  console.log('    /profile/homeworks/:id (HomeworkPage)');
  console.log('    /profile/homework/lesson/:lessonId (LessonHomeworkPage)');
  console.log('    /profile/homework/standalone/:homeworkId (StandaloneHomeworkPage)');
  console.log('    /profile/tests (TestsPage)');
  console.log('    /profile/diary (DiaryPage)');
  console.log('    /profile/goal (StudyGoal)');
  
  console.log('  💳 Payment routes:');
  console.log('    /pay/:plan (PaymePayment - requires auth)');
  console.log('    /payment/success (PaymentSuccess - requires auth)');
  console.log('    /payment/cancelled (PaymentCancelled - requires auth)');
  
  console.log('  📚 Learning routes:');
  console.log('    /lesson/:id (LessonPage - requires auth)');
  console.log('    /topic/:id/overview (TopicOverview - requires auth)');
  console.log('    /finished (TopicFinished - requires auth)');
  
  console.log('  🔄 Redirects:');
  console.log('    /vocabulary → /profile/vocabulary');
  console.log('    /vocabulary/:language → /profile/vocabulary/:language');
  console.log('    /payment/:plan? → /pay/:plan');
  
  console.log('  🎯 Valid payment plans: start, pro');
  console.log('  💰 Payment amounts: Start (260,000 сум), Pro (455,000 сум)');
  
}).catch(err => {
  console.error('❌ Router initialization failed:', err);
});

// ✅ PAYMENT NAVIGATION HELPERS (can be imported and used in components)
export const navigateToPayment = (plan = 'start', options = {}) => {
  const { userId, returnTo, router: routerInstance } = options;
  
  if (!['start', 'pro'].includes(plan)) {
    console.error('❌ Invalid payment plan:', plan);
    return false;
  }
  
  const query = {};
  if (userId) query.userId = userId;
  if (returnTo) query.returnTo = returnTo;
  
  const route = {
    name: 'PaymePayment',
    params: { plan },
    ...(Object.keys(query).length > 0 && { query })
  };
  
  console.log('🚀 Navigating to payment:', route);
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

export const navigateToSettings = (options = {}) => {
  const { returnTo, router: routerInstance } = options;
  
  const route = {
    name: 'SettingsPage',
    ...(returnTo && { query: { returnTo } })
  };
  
  console.log('⚙️ Navigating to settings:', route);
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

// ✅ SUBSCRIPTION CHECK HELPER
export const checkSubscriptionAccess = (requiredPlan = 'start') => {
  const userStatus = store.getters['user/userStatus'];
  const planHierarchy = {
    free: 0,
    start: 1,
    pro: 2,
    premium: 3
  };
  
  const userLevel = planHierarchy[userStatus] || 0;
  const requiredLevel = planHierarchy[requiredPlan] || 1;
  
  return userLevel >= requiredLevel;
};

export default router;