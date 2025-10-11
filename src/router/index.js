import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// ✅ Main Views
import HomePage from '@/views/HomePage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';
import VocabularyPage from '@/views/VocabularyPage.vue';
import UpdatedCourses from '@/views/UpdatedCourses.vue';

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

// ✅ ENHANCED HELPER: Get effective user plan from multiple sources
const getEffectiveUserPlan = () => {
  const storeStatus = store.getters['user/userStatus'];
  const localStatus = localStorage.getItem('userStatus');
  const subscriptionData = localStorage.getItem('subscriptionData');
  
  // Check subscription data first for active subscriptions
  let subscriptionPlan = null;
  if (subscriptionData) {
    try {
      const parsed = JSON.parse(subscriptionData);
      if (parsed.plan && parsed.expiryDate) {
        const now = new Date();
        const expiry = new Date(parsed.expiryDate);
        if (now < expiry && parsed.plan !== 'free') {
          subscriptionPlan = parsed.plan;
        }
      }
    } catch (e) {
      console.error('Error parsing subscription data:', e);
    }
  }
  
  // Priority: subscription > store > localStorage > default
  let effectiveStatus = subscriptionPlan || storeStatus || localStatus || 'free';
  
  // Handle invalid statuses
  if (effectiveStatus === 'undefined' || effectiveStatus === null || effectiveStatus === undefined || effectiveStatus === '') {
    effectiveStatus = subscriptionPlan || localStatus || 'free';
  }
  
  // Validate the plan value
  const validPlans = ['free', 'start', 'pro'];
  if (!validPlans.includes(effectiveStatus)) {
    effectiveStatus = localStatus && validPlans.includes(localStatus) ? localStatus : 'free';
  }
  
  return effectiveStatus;
};

// ✅ ENHANCED HELPER: Check if user has access to specific feature
const hasFeatureAccess = (feature, requiredPlans = ['start', 'pro']) => {
  const effectiveStatus = getEffectiveUserPlan();
  
  // Handle free features
  if (requiredPlans.includes('free')) {
    return true;
  }
  
  const hasAccess = requiredPlans.includes(effectiveStatus);
  return hasAccess;
};

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
      
      // ✅ Updated Courses Route
      { 
        path: 'updated-courses', 
        name: 'UpdatedCourses', 
        component: UpdatedCourses,
        meta: { 
          title: 'Актуальные курсы',
          description: 'Изучайте новейшие технологии и инструменты - от создания ИИ-помощников до современных методов редактирования'
        }
      },
      
      { 
        path: 'analytics', 
        name: 'UserAnalyticsPanel', 
        component: UserAnalyticsPanel,
        meta: { title: 'Аналитика' },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('analytics', ['pro']);
          
          if (!hasAccess) {
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
        meta: { title: 'Учебные цели' },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('goals', ['start', 'pro']);
          
          if (!hasAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
            return next({ 
              name: 'PaymePayment',
              params: { plan: 'start' },
              query: { 
                feature: 'goals',
                requiredPlan: 'start',
                returnTo: to.path,
                message: 'Цели доступны с подпиской Start'
              }
            });
          }
          
          next();
        }
      },
      { 
        path: 'homework', 
        name: 'HomeworkHelp', 
        component: HomeworkHelp,
        meta: { title: 'Помощь с домашкой' },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('homework_help', ['start', 'pro']);
          
          if (!hasAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
            return next({ 
              name: 'PaymePayment',
              params: { plan: 'start' },
              query: { 
                feature: 'homework_help',
                requiredPlan: 'start',
                returnTo: to.path,
                message: 'Помощь с ДЗ доступна с подпиской Start'
              }
            });
          }
          
          next();
        }
      },
      { 
        path: 'homeworks', 
        name: 'HomeworkList', 
        component: HomeworkList,
        meta: { title: 'Домашние задания' }
      },
      
      // ✅ Homework routes
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
        meta: { title: 'Тесты' },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('tests', ['start', 'pro']);
          
          if (!hasAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
            return next({ 
              name: 'PaymePayment',
              params: { plan: 'start' },
              query: { 
                feature: 'tests',
                requiredPlan: 'start',
                returnTo: to.path,
                message: 'Тесты доступны с подпиской Start'
              }
            });
          }
          
          next();
        }
      },
      { 
        path: 'tests/:id', 
        name: 'ProfileSingleTestPage', 
        component: TestsPage, 
        props: true,
        meta: { title: 'Прохождение теста' },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('tests', ['start', 'pro']);
          
          if (!hasAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
            return next({ 
              name: 'PaymePayment',
              params: { plan: 'start' },
              query: { 
                feature: 'tests',
                requiredPlan: 'start',
                returnTo: to.path,
                message: 'Тесты доступны с подпиской Start'
              }
            });
          }
          
          next();
        }
      },
      
      // ✅ Vocabulary route with access control
      { 
        path: 'vocabulary', 
        name: 'ProfileVocabularyPage', 
        component: VocabularyPage,
        meta: { 
          title: 'Словарь',
          description: 'Персональный словарь с изученными словами'
        },
        beforeEnter: async (to, from, next) => {
          const hasAccess = hasFeatureAccess('vocabulary', ['start', 'pro']);
          
          if (!hasAccess) {
            sessionStorage.setItem('intendedRoute', JSON.stringify({
              path: to.path,
              name: to.name,
              params: to.params,
              query: to.query
            }));
            
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

  {
    path: '/payment/checkout',
    name: 'PaymeCheckout',
    component: PaymeCheckout,
    meta: { 
      title: 'PayMe Checkout',
      description: 'Secure payment with PayMe'
    },
    beforeEnter: (to, from, next) => {
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

  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    beforeEnter: async (to, from, next) => {
      if (store.getters['user/isAuthenticated']) {
        try {
          await store.dispatch('user/checkPendingPayments');
          
          if (to.query.plan) {
            await store.dispatch('user/updateUserStatus', to.query.plan);
          }
        } catch (err) {
          console.error('Error updating payment status:', err);
        }
      }
      
      const intendedRoute = sessionStorage.getItem('intendedRoute');
      if (intendedRoute) {
        try {
          const route = JSON.parse(intendedRoute);
          sessionStorage.removeItem('intendedRoute');
          
          setTimeout(() => {
            next(route);
          }, 1000);
          return;
        } catch (err) {
          console.error('❌ Error parsing intended route:', err);
        }
      }
      
      if (to.query.showModal === 'true' || !to.query.noModal) {
        if (store.dispatch) {
          store.dispatch('payment/showSuccessModal', {
            transactionId: to.query.transaction || to.query.id,
            plan: to.query.plan,
            amount: to.query.amount,
            source: to.query.source || 'payme'
          }).catch(() => {});
        }
        
        next({ name: 'MainPage' });
      } else {
        next();
      }
    },
    component: PaymentSuccess,
    meta: { title: 'Платеж успешен' }
  },

  {
    path: '/payment-failed',
    name: 'PaymentFailed',
    component: PaymentFailed,
    meta: { title: 'Payment Failed' },
    beforeEnter: (to, from, next) => {
      sessionStorage.removeItem('intendedRoute');
      next();
    }
  },

  {
    path: '/payment/return',
    name: 'PaymentReturn',
    component: PaymentReturn,
    meta: { title: 'Обработка платежа' }
  },

  {
    path: '/payme/return/success',
    name: 'PaymeReturnSuccess',
    beforeEnter: (to, from, next) => {
      const transactionId = to.query.transaction || to.query.id;
      const plan = to.query.plan;
      
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
      const transactionId = to.query.transaction || to.query.id;
      const error = to.query.error || 'Payment failed';
      
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

  {
    path: '/payment/status/:transactionId',
    name: 'PaymentStatus',
    beforeEnter: async (to, from, next) => {
      const { transactionId } = to.params;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/status/${transactionId}`);
        const result = await response.json();
        
        if (result.success && result.transaction) {
          if (result.transaction.state === 2) {
            next({ 
              name: 'PaymentSuccess',
              query: { 
                transaction: transactionId,
                plan: result.transaction.plan 
              }
            });
          } else {
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
  
  // ✅ UPDATED: Learning Content Routes with Guest Access
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
    meta: { 
      requiresAuth: false,  // ✅ Allow guest access
      requiresAuthForPremium: true,  // ✅ Only require auth for premium content
      title: 'Урок',
      description: 'Страница урока'
    },
    beforeEnter: (to, from, next) => {
      if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
        console.error('❌ Invalid lesson ID:', to.params.id);
        return next({ name: 'HomePage' });
      }
      
      // ✅ Allow navigation for both authenticated and guest users
      console.log('📚 Allowing lesson access (guest or authenticated)');
      next();
    }
  },
  
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
    meta: { 
      requiresAuth: false,  // ✅ Allow guest access
      requiresAuthForPremium: true,  // ✅ Only require auth for premium content
      title: 'Обзор темы',
      description: 'Обзор темы курса'
    },
    beforeEnter: (to, from, next) => {
      if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
        console.error('❌ Invalid topic ID:', to.params.id);
        return next({ name: 'HomePage' });
      }
      
      // ✅ Allow navigation for both authenticated and guest users
      console.log('📚 Allowing topic overview access (guest or authenticated)');
      next();
    }
  },
  
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
    meta: { 
      requiresAuth: true,  // Keep this authenticated (only logged-in users can finish topics)
      title: 'Тема завершена',
      description: 'Страница завершения темы'
    }
  },
  
  // ✅ REDIRECTS
  {
    path: '/vocabulary',
    redirect: '/profile/vocabulary'
  },
  {
    path: '/vocabulary/:language',
    redirect: '/profile/vocabulary'
  },
  
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
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80,
      };
    }
    
    if (savedPosition) {
      return savedPosition;
    }
    
    return { top: 0 };
  },
});

// ✅ UPDATED: Enhanced beforeEach guard with guest access support
router.beforeEach(async (to, from, next) => {
  console.log(`🔄 Navigation: ${from.name || 'START'} → ${to.name}`);
  
  // ✅ Public routes that don't require authentication
  const publicRoutes = [
    'HomePage', 
    'NotFound', 
    'PaymentFailed', 
    'PaymeCheckout', 
    'PaymentSuccess', 
    'PaymentReturn',
    'LessonPage',      // ✅ Allow for guests
    'TopicOverview',   // ✅ Allow for guests
    'AboutUsPage'
  ];
  
  const isPublic = publicRoutes.includes(to.name);
  
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAuthForPremium = to.matched.some(record => record.meta.requiresAuthForPremium);

  // ✅ Wait for auth initialization
  try {
    const { authInitPromise } = await import('@/main.js'); 
    await authInitPromise;
  } catch (err) {
    console.warn('⚠️ Auth init not ready yet:', err);
  }

  const isLoggedIn = store.getters.isLoggedIn;
  const userId = store.getters['user/getUserId'];

  // ✅ NEW: Special handling for lesson and topic pages
  if (to.name === 'LessonPage' || to.name === 'TopicOverview') {
    const isGuestAccess = to.query.guest === 'true' || !isLoggedIn;
    
    if (isGuestAccess) {
      console.log('🆓 Guest access to lesson/topic allowed');
      // The LessonPage/TopicOverview component will handle premium content checks
      return next();
    }
    
    // Logged-in users can also access
    console.log('👤 Authenticated user accessing lesson/topic');
    return next();
  }

  // ✅ AUTHENTICATION CHECKS for other routes
  if (requiresAuth && !isLoggedIn && !isPublic) {
    console.log('🔒 Authentication required, redirecting to HomePage');
    return next({ 
      name: 'HomePage',
      query: { 
        redirect: to.fullPath,
        LoginRequired: 'true'
      }
    });
  }

  // ✅ PAYMENT ROUTE SPECIFIC CHECKS
  if (to.name === 'PaymePayment') {
    if (!isLoggedIn) {
      return next({ 
        name: 'HomePage',
        query: { 
          redirect: to.fullPath,
          LoginRequired: 'true',
          message: 'Для оплаты необходимо войти в систему'
        }
      });
    }
    
    if (!to.query.userId && userId) {
      const newQuery = { ...to.query, userId };
      return next({ 
        path: to.path, 
        query: newQuery 
      });
    }
    
    try {
      await store.dispatch('user/checkPendingPayments');
    } catch (err) {
      console.error('Error checking pending payments:', err);
    }
  }

  // ✅ PROFILE ROUTE CHECKS
  if (!isPublic && !isLoggedIn && to.path.startsWith('/profile')) {
    console.log('🔒 Profile access requires authentication');
    return next({ 
      name: 'HomePage',
      query: { 
        redirect: to.fullPath,
        LoginRequired: 'true'
      }
    });
  }

  // ✅ SUCCESS: Allow navigation
  console.log('✅ Navigation allowed');
  next();
});

// ✅ Enhanced afterEach for analytics and status checks
router.afterEach((to, from) => {
  const baseTitle = 'ACED - Образовательная платформа';
  document.title = to.meta.title ? `${to.meta.title} - ACED` : baseTitle;
  
  console.log(`✅ Navigated to: ${to.name} (${to.path})`);
  
  // Log special route types
  if (to.name && (to.name.includes('Vocabulary') || to.name.includes('Analytics') || to.name.includes('UpdatedCourses'))) {
    console.log('📊 Feature route accessed:', to.name);
  } 
  else if (to.name && (to.name.includes('Payme') || to.name.includes('Payment'))) {
    console.log('💳 Payment route accessed:', to.name);
  }
  else if (to.name && (to.name === 'LessonPage' || to.name === 'TopicOverview')) {
    console.log('📚 Learning content accessed:', to.name);
  }
  
  // ✅ AUTO-CHECK SUBSCRIPTION STATUS
  if (store.getters.isLoggedIn && !to.path.includes('/pay')) {
    const lastCheck = store.getters['user/lastPaymentCheck'];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!lastCheck || (now - lastCheck) > fiveMinutes) {
      store.dispatch('user/checkPendingPayments').catch(err => {
        console.error('❌ Failed to check pending payments:', err);
      });
    }
  }
});

// ✅ Enhanced error handling
router.onError((err) => {
  console.error('❌ Router error:', err);
  
  if (err.message.includes('Failed to fetch dynamically imported module') || 
      err.message.includes('Loading chunk')) {
    console.log('🔄 Chunk loading failed, reloading page...');
    window.location.reload();
    return;
  }
  
  if (err.message.includes('homework') || err.message.includes('Homework')) {
    console.error('📚 Homework route error:', err);
  }
  
  if (err.message.includes('payment') || err.message.includes('Payment')) {
    console.error('💳 Payment route error:', err);
  }
  
  if (err.message.includes('courses') || err.message.includes('UpdatedCourses')) {
    console.error('📚 Updated Courses route error:', err);
  }
  
  if (err.message.includes('lesson') || err.message.includes('Lesson') || err.message.includes('topic') || err.message.includes('Topic')) {
    console.error('📖 Learning content route error:', err);
  }
  
  console.error('🔄 Navigation failed, attempting recovery...');
});

// ✅ NAVIGATION HELPERS

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
  
  console.log('💳 Navigating to payment:', route);
  
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

export const navigateToUpdatedCourses = (options = {}) => {
  const { router: routerInstance, category, difficulty } = options;
  
  const route = {
    name: 'UpdatedCourses',
    ...(category || difficulty) && { 
      query: { 
        ...(category && { category }),
        ...(difficulty && { difficulty })
      } 
    }
  };
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

// ✅ NEW: Navigate to lesson with guest support
export const navigateToLesson = (lessonId, options = {}) => {
  const { router: routerInstance, asGuest = false, fromTopic } = options;
  
  if (!lessonId || lessonId === 'null' || lessonId === 'undefined') {
    console.error('❌ Invalid lesson ID:', lessonId);
    return false;
  }
  
  const route = {
    name: 'LessonPage',
    params: { id: lessonId },
    query: {
      ...(asGuest && { guest: 'true' }),
      ...(fromTopic && { topic: fromTopic })
    }
  };
  
  console.log('📚 Navigating to lesson:', route);
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

// ✅ NEW: Navigate to topic overview with guest support
export const navigateToTopicOverview = (topicId, options = {}) => {
  const { router: routerInstance, asGuest = false } = options;
  
  if (!topicId || topicId === 'null' || topicId === 'undefined') {
    console.error('❌ Invalid topic ID:', topicId);
    return false;
  }
  
  const route = {
    name: 'TopicOverview',
    params: { id: topicId },
    query: {
      ...(asGuest && { guest: 'true' })
    }
  };
  
  console.log('📚 Navigating to topic overview:', route);
  
  if (routerInstance) {
    return routerInstance.push(route);
  } else {
    return router.push(route);
  }
};

// ✅ SUBSCRIPTION CHECK HELPER
export const checkSubscriptionAccess = (userStatus, requiredPlan = 'start') => {
  if (!userStatus || userStatus === 'undefined' || userStatus === null) {
    userStatus = 'free';
  }
  
  const planHierarchy = {
    free: 0,
    start: 1,
    pro: 2,
    premium: 3
  };
  
  const userLevel = planHierarchy[userStatus] || 0;
  const requiredLevel = planHierarchy[requiredPlan] || 1;
  
  console.log(`🔐 Subscription check: ${userStatus} (${userLevel}) vs ${requiredPlan} (${requiredLevel})`);
  
  return userLevel >= requiredLevel;
};

// ✅ NAVIGATION TO INTENDED ROUTE HELPER
export const navigateToIntendedRoute = (router) => {
  try {
    const intendedRoute = sessionStorage.getItem('intendedRoute');
    if (intendedRoute) {
      const route = JSON.parse(intendedRoute);
      sessionStorage.removeItem('intendedRoute');
      
      console.log('🎯 Navigating to intended route:', route);
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
  const effectiveStatus = getEffectiveUserPlan();
  return ['start', 'pro', 'premium'].includes(effectiveStatus);
};

// ✅ UPDATED COURSES ACCESS HELPER
export const checkUpdatedCoursesAccess = () => {
  // By default, Updated Courses is free for everyone
  // Change this if you want to make it premium
  return true; // or return ['start', 'pro', 'premium'].includes(effectiveStatus);
};

// ✅ FEATURE ACCESS HELPERS
export const getFeatureAccess = (feature) => {
  const effectiveStatus = getEffectiveUserPlan();
  
  const featureRequirements = {
    vocabulary: ['start', 'pro', 'premium'],
    analytics: ['pro', 'premium'],
    goals: ['start', 'pro', 'premium'],
    homework_help: ['start', 'pro', 'premium'],
    tests: ['start', 'pro', 'premium'],
    updated_courses: ['free', 'start', 'pro', 'premium'],
    advanced_lessons: ['start', 'pro', 'premium'],
    unlimited_practice: ['pro', 'premium'],
    priority_support: ['start', 'pro', 'premium'],
    custom_courses: ['pro', 'premium']
  };
  
  const requiredPlans = featureRequirements[feature] || ['start', 'pro', 'premium'];
  return requiredPlans.includes(effectiveStatus);
};

// ✅ NEW: Check if lesson/topic is accessible for guests
export const checkGuestLessonAccess = (lessonData) => {
  // Logic to determine if a lesson is accessible for guests
  // This should be implemented based on your lesson data structure
  if (!lessonData) return false;
  
  // Examples of free lesson criteria:
  // - First lesson of each topic
  // - Lessons marked as "preview" or "free"
  // - Lessons in free topics
  
  if (lessonData.isFree === true) return true;
  if (lessonData.isPreview === true) return true;
  if (lessonData.order === 0 || lessonData.order === 1) return true; // First lesson
  
  return false;
};

// ✅ DEBUG HELPERS FOR ROUTER
if (typeof window !== 'undefined') {
  window.routerDebug = {
    // Check current effective plan
    getCurrentPlan: () => {
      const plan = getEffectiveUserPlan();
      console.log('📊 Current plan:', plan);
      return plan;
    },
    
    // Test feature access
    testFeature: (feature) => {
      const hasAccess = getFeatureAccess(feature);
      console.log(`🔐 Feature '${feature}' access:`, hasAccess);
      return hasAccess;
    },
    
    // Check vocabulary access specifically
    checkVocabulary: () => {
      const hasAccess = checkVocabularyAccess();
      console.log('📚 Vocabulary access:', hasAccess);
      return hasAccess;
    },
    
    // Check updated courses access
    checkUpdatedCourses: () => {
      const hasAccess = checkUpdatedCoursesAccess();
      console.log('📚 Updated Courses access:', hasAccess);
      return hasAccess;
    },
    
    // Get all status sources
    getAllSources: () => {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const subscriptionData = localStorage.getItem('subscriptionData');
      
      let parsedSubscription = null;
      if (subscriptionData) {
        try {
          parsedSubscription = JSON.parse(subscriptionData);
        } catch (e) {
          console.error('Failed to parse subscription data');
        }
      }
      
      const sources = {
        store: storeStatus,
        localStorage: localStatus,
        subscription: parsedSubscription,
        effective: getEffectiveUserPlan()
      };
      
      console.table(sources);
      return sources;
    },
    
    // Force navigation to vocabulary (for testing)
    goToVocabulary: () => {
      console.log('🧭 Navigating to vocabulary...');
      router.push('/profile/vocabulary');
    },
    
    // Force navigation to updated courses (for testing)
    goToUpdatedCourses: () => {
      console.log('🧭 Navigating to updated courses...');
      router.push('/profile/updated-courses');
    },
    
    // NEW: Navigate to lesson as guest
    goToLessonAsGuest: (lessonId) => {
      console.log('🧭 Navigating to lesson as guest:', lessonId);
      navigateToLesson(lessonId, { asGuest: true });
    },
    
    // NEW: Navigate to topic as guest
    goToTopicAsGuest: (topicId) => {
      console.log('🧭 Navigating to topic as guest:', topicId);
      navigateToTopicOverview(topicId, { asGuest: true });
    },
    
    // Check current route info
    getCurrentRoute: () => {
      const current = router.currentRoute.value;
      const info = {
        name: current.name,
        path: current.path,
        params: current.params,
        query: current.query,
        meta: current.meta
      };
      console.table(info);
      return info;
    },
    
    // Test guest access to a lesson
    testGuestAccess: (lessonId) => {
      console.log('🧪 Testing guest access for lesson:', lessonId);
      navigateToLesson(lessonId, { asGuest: true });
    }
  };
  
  console.log('🐛 Router debug helpers available at window.routerDebug');
  console.log('Available commands:');
  console.log('  - window.routerDebug.getCurrentPlan()');
  console.log('  - window.routerDebug.testFeature("vocabulary")');
  console.log('  - window.routerDebug.getAllSources()');
  console.log('  - window.routerDebug.goToLessonAsGuest(lessonId)');
  console.log('  - window.routerDebug.goToTopicAsGuest(topicId)');
  console.log('  - window.routerDebug.getCurrentRoute()');
}

export default router;