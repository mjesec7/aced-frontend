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

// ✅ Payment Components
import PaymePayment from '@/components/Payments/PaymePayment.vue';
import PaymentFailed from '@/components/Payments/PaymentFailed.vue';
import PaymentSuccess from '@/components/Payments/PaymentSuccess.vue';
import PaymentReturn from '@/components/Payments/PaymentReturn.vue';

// ✅ Lazy-loaded Views
const LessonPage = () => import('@/views/LessonPage.vue');
const TopicFinished = () => import('@/views/TopicFinished.vue');
const TopicOverview = () => import('@/views/TopicOverview.vue');

// ✅ Payment Views (Lazy-loaded)
const PaymeCheckout = () => import('@/views/PaymeCheckout.vue');

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
    meta: { title: 'Главная' }
  },
  {
    path: '/about-us',
    name: 'AboutUsPage',
    component: () => import('@/components/Main/AboutUs.vue'),
    meta: { title: 'О нас' }
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
      next();
    }
  },

  // ✅ ENHANCED VOCABULARY ROUTE WITH SUBSCRIPTION PROTECTION
  {
    path: '/vocabulary',
    name: 'VocabularyPage',
    component: VocabularyPage,
    meta: { 
      requiresAuth: true,
      requiresSubscription: true,
      subscriptionLevel: 'start', // Minimum required level
      title: 'Словарь',
      description: 'Персональный словарь с изученными словами'
    },
    beforeEnter: async (to, from, next) => {
      
      // Check authentication first
      const isLoggedIn = store.getters.isLoggedIn;
      if (!isLoggedIn) {
        console.warn('❌ Vocabulary requires authentication');
        return next({ 
          name: 'HomePage',
          query: { 
            redirect: to.fullPath,
            LoginRequired: 'true',
            message: 'Для доступа к словарю необходимо войти в систему'
          }
        });
      }

      // Check subscription status
      const userStatus = store.getters['user/userStatus'];
      const hasVocabularyAccess = store.getters['user/hasVocabularyAccess'] || 
                                  ['start', 'pro', 'premium'].includes(userStatus);
      
      
      if (!hasVocabularyAccess) {
        console.warn('❌ Vocabulary requires subscription');
        
        // Store the intended destination for after subscription
        sessionStorage.setItem('intendedRoute', JSON.stringify({
          path: to.path,
          name: to.name,
          params: to.params,
          query: to.query
        }));
        
        // Redirect to payment page with vocabulary context
        return next({ 
          name: 'PaymePayment',
          params: { plan: 'start' },
          query: { 
            feature: 'vocabulary',
            requiredPlan: 'start',
            returnTo: to.path,
            message: 'Словарь доступен с подпиской Start'
          }
        });
      }
      
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
        meta: { 
          title: 'Аналитика',
          requiresSubscription: true,
          subscriptionLevel: 'pro'
        },
        beforeEnter: async (to, from, next) => {
          const userStatus = store.getters['user/userStatus'];
          const hasProAccess = ['pro', 'premium'].includes(userStatus);
          
          if (!hasProAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
            return next({ 
              name: 'PaymePayment',
              params: { plan: 'pro' },
              query: { 
                feature: 'analytics',
                requiredPlan: 'pro',
                returnTo: to.path,
                message: 'Продвинутая аналитика доступна с подпиской Pro'
              }
            });
          }
          
          next();
        }
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
      
      // ✅ LEGACY VOCABULARY REDIRECT - Under profile (deprecated)
      { 
        path: 'vocabulary', 
        redirect: '/vocabulary'
      }
    ],
  },
  
  // ✅ PAYMENT ROUTES
  {
    path: '/pay/:plan',
    name: 'PaymePayment',
    component: PaymePayment,
    props: route => ({
      plan: route.params.plan,
      userId: route.query.userId,
      returnTo: route.query.returnTo,
      feature: route.query.feature,
      requiredPlan: route.query.requiredPlan,
      message: route.query.message
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
      
      const isLoggedIn = store.getters.isLoggedIn;
      if (!isLoggedIn) {
        console.warn('❌ Payment requires authentication');
        return next({ 
          name: 'HomePage',
          query: { 
            redirect: to.fullPath,
            LoginRequired: 'true',
            message: 'Для оплаты необходимо войти в систему'
          }
        });
      }
      
      next();
    }
  },

  // ✅ PayMe Checkout Simulation (for development/testing)
  {
    path: '/payment/checkout',
    name: 'PaymeCheckout',
    component: PaymeCheckout,
    meta: { 
      title: 'PayMe Checkout',
      description: 'Secure payment with PayMe'
    },
    beforeEnter: (to, from, next) => {
      // Validate required query parameters
      const requiredParams = ['transactionId', 'userId', 'amount', 'plan'];
      const hasAllParams = requiredParams.every(param => to.query[param]);
      
      if (!hasAllParams) {
        console.error('❌ Missing required payment parameters:', to.query);
        return next({ 
          name: 'SettingsPage',
          query: { error: 'invalid_payment_data' }
        });
      }
      
      next();
    }
  },

  // ✅ Payment Success Page (shows modal or page)
  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    beforeEnter: async (to, from, next) => {
      
      // Update user subscription status
      if (store.getters['user/isAuthenticated']) {
        try {
          await store.dispatch('user/checkPendingPayments');
          
          // If there's a plan in query, update immediately
          if (to.query.plan) {
            await store.dispatch('user/updateUserStatus', to.query.plan);
          }
        } catch (err) {
          console.warn('⚠️ Failed to update user status:', err);
        }
      }
      
      // Check for intended route to redirect to
      const intendedRoute = sessionStorage.getItem('intendedRoute');
      if (intendedRoute) {
        try {
          const route = JSON.parse(intendedRoute);
          sessionStorage.removeItem('intendedRoute');
          
          
          // Small delay to ensure status is updated
          setTimeout(() => {
            next(route);
          }, 1000);
          return;
        } catch (err) {
          console.error('❌ Error parsing intended route:', err);
        }
      }
      
      // Check if we should show modal or page
      if (to.query.showModal === 'true' || !to.query.noModal) {
        // Store transaction data for modal
        if (store.dispatch) {
          store.dispatch('payment/showSuccessModal', {
            transactionId: to.query.transaction || to.query.id,
            plan: to.query.plan,
            amount: to.query.amount,
            source: to.query.source || 'payme'
          }).catch(() => {
            // Ignore if payment module doesn't exist
          });
        }
        
        // Redirect to main page (modal will show there)
        next({ name: 'MainPage' });
      } else {
        // Show full success page
        next();
      }
    },
    component: PaymentSuccess,
    meta: { 
      title: 'Платеж успешен'
    }
  },

  // ✅ Payment Failed Page
  {
    path: '/payment-failed',
    name: 'PaymentFailed',
    component: PaymentFailed,
    meta: { 
      title: 'Payment Failed'
    },
    beforeEnter: (to, from, next) => {
      // Clear any intended route on payment failure
      sessionStorage.removeItem('intendedRoute');
      next();
    }
  },

  // ✅ Payment Return Handler
  {
    path: '/payment/return',
    name: 'PaymentReturn',
    component: PaymentReturn,
    meta: {
      title: 'Обработка платежа'
    }
  },

  // ✅ PayMe Return URLs (these are what PayMe will redirect to)
  {
    path: '/payme/return/success',
    name: 'PaymeReturnSuccess',
    beforeEnter: (to, from, next) => {
      
      // Extract transaction info from PayMe response
      const transactionId = to.query.transaction || to.query.id;
      const plan = to.query.plan;
      
      // Redirect to payment return handler
      next({ 
        name: 'PaymentReturn',
        query: to.query
      });
    }
  },

  {
    path: '/payme/return/failure',
    name: 'PaymeReturnFailure', 
    beforeEnter: (to, from, next) => {
      
      // Extract error info from PayMe response
      const transactionId = to.query.transaction || to.query.id;
      const error = to.query.error || 'Payment failed';
      
      // Redirect to your failure page
      next({ 
        name: 'PaymentFailed',
        query: { 
          transaction: transactionId,
          error: error,
          source: 'payme'
        }
      });
    }
  },

  // ✅ Payment Status Check (for webhooks/callbacks)
  {
    path: '/payment/status/:transactionId',
    name: 'PaymentStatus',
    beforeEnter: async (to, from, next) => {
      const { transactionId } = to.params;
      
      try {
        // Check payment status via API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/status/${transactionId}`);
        const result = await response.json();
        
        if (result.success && result.transaction) {
          if (result.transaction.state === 2) {
            // Payment successful
            next({ 
              name: 'PaymentSuccess',
              query: { 
                transaction: transactionId,
                plan: result.transaction.plan 
              }
            });
          } else {
            // Payment failed or pending
            next({ 
              name: 'PaymentFailed',
              query: { 
                transaction: transactionId,
                error: 'Payment not completed'
              }
            });
          }
        } else {
          next({ name: 'PaymentFailed' });
        }
      } catch (error) {
        console.error('❌ Payment status check failed:', error);
        next({ name: 'PaymentFailed' });
      }
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
  
  // ✅ LEGACY REDIRECTS: Redirect old vocabulary routes to new standalone vocabulary page
  {
    path: '/vocabulary/:language',
    redirect: '/vocabulary'
  },
  {
    path: '/profile/vocabulary',
    redirect: '/vocabulary'
  },
  {
    path: '/profile/vocabulary/:language',
    redirect: '/vocabulary'
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

// ✅ ENHANCED Route Guard with Subscription Integration
router.beforeEach(async (to, from, next) => {
  
  // Public routes that don't require authentication
  const publicRoutes = ['HomePage', 'NotFound', 'PaymentFailed', 'PaymeCheckout', 'PaymentSuccess', 'PaymentReturn'];
  const isPublic = publicRoutes.includes(to.name);
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // 🔥 CRITICAL FIX: Wait for our auth initialization from main.js
  try {
    // Dynamically import main.js to get authInitPromise
    const { authInitPromise } = await import('@/main.js'); 
    await authInitPromise;
  } catch (err) {
    console.warn('⚠️ Router: Auth wait failed, proceeding anyway:', err);
  }

  const isLoggedIn = store.getters.isLoggedIn;
  const userId = store.getters['user/getUserId'];

  // ✅ AUTHENTICATION CHECKS (only after auth is ready)
  if (requiresAuth && !isLoggedIn) {
    console.warn('❌ Authentication required. Redirecting to home with Login prompt.');
    return next({ 
      name: 'HomePage',
      query: { 
        redirect: to.fullPath,
        LoginRequired: 'true'
      }
    });
  }

  // ✅ SUBSCRIPTION CHECKS FOR PROTECTED ROUTES
  if (to.meta.requiresSubscription && isLoggedIn) {
    const userStatus = store.getters['user/userStatus'];
    const requiredLevel = to.meta.subscriptionLevel || 'start';
    
    
    // Check subscription level
    const hasAccess = checkSubscriptionAccess(userStatus, requiredLevel);
    
    if (!hasAccess) {
      
      // Store the intended destination
      sessionStorage.setItem('intendedRoute', JSON.stringify({
        path: to.path,
        name: to.name,
        params: to.params,
        query: to.query
      }));
      
      // Redirect to payment page
      return next({ 
        name: 'PaymePayment',
        params: { plan: requiredLevel },
        query: { 
          requiredPlan: requiredLevel,
          returnTo: to.path,
          feature: to.name?.toLowerCase()?.replace('page', '') || 'feature'
        } 
      });
    }
    
  }

  // ✅ PAYMENT ROUTE SPECIFIC CHECKS
  if (to.name === 'PaymePayment') {
    if (!isLoggedIn) {
      console.warn('❌ Payment requires authentication');
      return next({ 
        name: 'HomePage',
        query: { 
          redirect: to.fullPath,
          LoginRequired: 'true',
          message: 'Для оплаты необходимо войти в систему'
        }
      });
    }
    
    // Add userId to query if not present
    if (!to.query.userId && userId) {
      const newQuery = { ...to.query, userId };
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
        LoginRequired: 'true'
      }
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
  if (to.name && (to.name.includes('Vocabulary') || to.name.includes('Analytics'))) {
  } 
  else if (to.name && (to.name.includes('Payme') || to.name.includes('Payment'))) {
  }
  
  // Log params if any
  if (Object.keys(to.params).length > 0) {
  }
  
  // ✅ AUTO-CHECK SUBSCRIPTION STATUS on navigation (for authenticated users)
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
    window.location.reload();
    return;
  }
  
  // Handle navigation errors for specific route types
  if (err.message.includes('homework') || err.message.includes('Homework')) {
    console.error('📚 Homework route error:', err);
  }
  
  if (err.message.includes('payment') || err.message.includes('Payment')) {
    console.error('💳 Payment route error:', err);
  }
  
  // Generic error handling
  console.error('🔄 Navigation failed, attempting recovery...');
});

// ✅ PAYMENT NAVIGATION HELPERS (can be imported and used in components)
export const navigateToPayment = (plan = 'start', options = {}) => {
  const { userId, returnTo, router: routerInstance, feature } = options;
  
  if (!['start', 'pro'].includes(plan)) {
    console.error('❌ Invalid payment plan:', plan);
    return false;
  }
  
  const query = {};
  if (userId) query.userId = userId;
  if (returnTo) query.returnTo = returnTo;
  if (feature) query.feature = feature;
  
  const route = {
    name: 'PaymePayment',
    params: { plan },
    ...(Object.keys(query).length > 0 && { query })
  };
  
  
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
  
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

// ✅ SUBSCRIPTION CHECK HELPER
export const checkSubscriptionAccess = (userStatus, requiredPlan = 'start') => {
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

// ✅ NAVIGATION TO INTENDED ROUTE HELPER
export const navigateToIntendedRoute = (router) => {
  try {
    const intendedRoute = sessionStorage.getItem('intendedRoute');
    if (intendedRoute) {
      const route = JSON.parse(intendedRoute);
      sessionStorage.removeItem('intendedRoute');
      
      router.push(route);
      return true;
    }
  } catch (error) {
    console.error('❌ Error navigating to intended route:', error);
  }
  return false;
};

// ✅ VOCABULARY ACCESS HELPER
export const checkVocabularyAccess = () => {
  const userStatus = store.getters['user/userStatus'];
  return ['start', 'pro', 'premium'].includes(userStatus);
};

// ✅ FEATURE ACCESS HELPERS
export const getFeatureAccess = (feature) => {
  const userStatus = store.getters['user/userStatus'];
  
  const featureRequirements = {
    vocabulary: 'start',
    analytics: 'pro',
    advanced_lessons: 'start',
    unlimited_practice: 'pro',
    priority_support: 'start',
    custom_courses: 'pro'
  };
  
  const required = featureRequirements[feature] || 'start';
  return checkSubscriptionAccess(userStatus, required);
};

export default router;