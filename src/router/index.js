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

// Payment Components - UPDATED
import UniversalCheckout from '@/views/UniversalCheckout.vue'; // Main checkout component
import PaymentFailed from '@/components/Payments/PaymentFailed.vue';
import PaymentSuccess from '@/components/Payments/PaymentSuccess.vue';
import PaymentReturn from '@/components/Payments/PaymentReturn.vue';

// Lazy-loaded Components
const MyCourses = () => import('@/components/Profile/MyCourses.vue');
const LessonPage = () => import('@/views/LessonPage.vue');
const TopicFinished = () => import('@/views/TopicFinished.vue');
const TopicOverview = () => import('@/views/TopicOverview.vue');
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
      name: 'PaymentSelection',
      params: { plan: requiredPlan },
      query: {
        feature: featureName,
        requiredPlan: requiredPlan,
        returnTo: to.path,
        message: message,
        provider: 'multicard' // Default provider
      }
    });
  };
};


// --- ROUTE DEFINITIONS ---

const routes = [
  // ============================================
  // GENERAL ROUTES
  // ============================================
  { 
    path: '/', 
    name: 'HomePage', 
    component: HomePage, 
    meta: { title: 'Home' } 
  },
  { 
    path: '/about-us', 
    name: 'AboutUsPage', 
    component: AboutUsPage, 
    meta: { title: 'About Us' } 
  },
  { 
    path: '/settings', 
    name: 'SettingsPage', 
    component: AcedSettings, 
    meta: { title: 'Settings', requiresAuth: true } 
  },

  // ============================================
  // PROFILE ROUTES
  // ============================================
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
        meta: { title: 'Home' } 
      },
      { 
        path: 'catalogue', 
        name: 'CataloguePage', 
        component: CataloguePage, 
        meta: { title: 'Catalogue' } 
      },
      { 
        path: 'my-courses', 
        name: 'MyCourses', 
        component: MyCourses, 
        meta: { title: 'My Courses' } 
      },
      { 
        path: 'updated-courses', 
        name: 'UpdatedCourses', 
        component: UpdatedCourses, 
        meta: { title: 'Current Courses' } 
      },
      { 
        path: 'diary', 
        name: 'DiaryPage', 
        component: DiaryPage, 
        meta: { title: 'Diary' } 
      },
      { 
        path: 'homeworks', 
        name: 'HomeworkList', 
        component: HomeworkList, 
        meta: { title: 'Homework' } 
      },
      
      // Premium Feature Routes using Access Guard
      {
        path: 'analytics',
        name: 'UserAnalyticsPanel',
        component: UserAnalyticsPanel,
        meta: { title: 'Analytics' },
        beforeEnter: createAccessGuard('analytics', ['pro'], 'Advanced analytics available with Pro subscription')
      },
      {
        path: 'goal',
        name: 'StudyGoal',
        component: StudyGoal,
        meta: { title: 'Study Goals' },
        beforeEnter: createAccessGuard('goals', ['start', 'pro'], 'Goals available with Start subscription')
      },
      {
        path: 'homework',
        name: 'HomeworkHelp',
        component: HomeworkHelp,
        meta: { title: 'Homework Help' },
        beforeEnter: createAccessGuard('homework_help', ['start', 'pro'], 'Homework help available with Start subscription')
      },
      {
        path: 'tests',
        name: 'ProfileTestsPage',
        component: TestsPage,
        meta: { title: 'Tests' },
        beforeEnter: createAccessGuard('tests', ['start', 'pro'], 'Tests available with Start subscription')
      },
      {
        path: 'vocabulary',
        name: 'ProfileVocabularyPage',
        component: VocabularyPage,
        meta: { title: 'Vocabulary' },
        beforeEnter: createAccessGuard('vocabulary', ['start', 'pro'], 'Vocabulary available with Start subscription')
      },

      // Dynamic Homework Routes
      {
        path: 'homeworks/:id',
        name: 'HomeworkPage',
        component: HomeworkPage,
        props: route => ({ homeworkId: route.params.id, ...route.query }),
        meta: { title: 'Complete Homework' },
      },
    ],
  },
  
  // ============================================
  // LEARNING CONTENT ROUTES
  // ============================================
  {
    path: '/lesson/:id',
    name: 'LessonPage',
    component: LessonPage,
    props: true,
    meta: { title: 'Lesson' }
  },
  {
    path: '/topic/:id/overview',
    name: 'TopicOverview',
    component: TopicOverview,
    props: true,
    meta: { title: 'Topic Overview' }
  },
  {
    path: '/finished',
    name: 'TopicFinished',
    component: TopicFinished,
    meta: { requiresAuth: true, title: 'Topic Completed' }
  },

  // ============================================
  // PAYMENT ROUTES - UNIVERSAL CHECKOUT
  // ============================================
  
  // Main payment route - redirects to Universal Checkout
  {
    path: '/pay/:plan',
    name: 'PaymentSelection',
    component: UniversalCheckout,
    props: route => ({
      plan: route.params.plan,
      userId: route.query.userId,
      userName: route.query.userName,
      userEmail: route.query.userEmail,
      currentPlan: route.query.currentPlan,
      provider: route.query.provider || 'multicard',
      ...route.query
    }),
    meta: { 
      title: 'Payment Method Selection', 
      requiresAuth: true 
    },
    beforeEnter: (to, from, next) => {
      const validPlans = ['start', 'pro'];
      if (!validPlans.includes(to.params.plan)) {
        console.error('❌ Invalid payment plan:', to.params.plan);
        return next({ 
          name: 'SettingsPage', 
          query: { error: 'invalid_plan' } 
        });
      }
      next();
    }
  },

  // Universal Checkout - Main payment gateway selector
  {
    path: '/payment/checkout',
    name: 'UniversalCheckout',
    component: UniversalCheckout,
    meta: { 
      title: 'Payment Checkout',
      requiresAuth: true 
    },
    props: route => ({
      plan: route.query.plan,
      userId: route.query.userId,
      userName: route.query.userName,
      userEmail: route.query.userEmail,
      currentPlan: route.query.currentPlan,
      provider: route.query.provider || 'multicard',
      amount: route.query.amount,
      ...route.query
    })
  },

  // Provider-specific checkout route
  {
    path: '/payment/:provider/checkout',
    name: 'ProviderCheckout',
    component: UniversalCheckout,
    props: route => ({
      provider: route.params.provider,
      plan: route.query.plan,
      userId: route.query.userId,
      userName: route.query.userName,
      userEmail: route.query.userEmail,
      currentPlan: route.query.currentPlan,
      amount: route.query.amount,
      ...route.query
    }),
    meta: { 
      title: 'Payment Checkout',
      requiresAuth: true 
    },
    beforeEnter: (to, from, next) => {
      const validProviders = ['payme', 'multicard', 'click', 'uzum'];
      if (!validProviders.includes(to.params.provider)) {
        console.error('❌ Invalid payment provider:', to.params.provider);
        return next({ 
          name: 'PaymentSelection',
          params: { plan: to.query.plan || 'start' }
        });
      }
      next();
    }
  },

  // Payment Success - Universal for all providers
  {
    path: '/payment/success/:provider?',
    name: 'UniversalPaymentSuccess',
    component: PaymentSuccess,
    props: route => ({
      provider: route.params.provider || route.query.provider || 'unknown',
      transactionId: route.query.transactionId || route.query.transaction_id,
      plan: route.query.plan,
      amount: route.query.amount,
      ...route.query
    }),
    meta: { title: 'Payment Successful' }
  },

  // Payment Failed - Universal for all providers
  {
    path: '/payment/failed/:provider?',
    name: 'UniversalPaymentFailed',
    component: PaymentFailed,
    props: route => ({
      provider: route.params.provider || route.query.provider || 'unknown',
      error: route.query.error || route.query.errorMessage,
      transactionId: route.query.transactionId || route.query.transaction_id,
      ...route.query
    }),
    meta: { title: 'Payment Failed' }
  },

  // Payment Return - Handler for provider callbacks
  {
    path: '/payment/return/:provider',
    name: 'ProviderReturn',
    component: PaymentReturn,
    props: route => ({
      provider: route.params.provider,
      ...route.query,
      ...route.params
    }),
    meta: { title: 'Processing Payment' },
    beforeEnter: (to, from, next) => {
      const validProviders = ['payme', 'multicard', 'click', 'uzum'];
      if (!validProviders.includes(to.params.provider)) {
        console.error('❌ Invalid payment provider in return:', to.params.provider);
        return next({ 
          name: 'UniversalPaymentFailed',
          params: { provider: 'unknown' },
          query: { error: 'Invalid payment provider' }
        });
      }
      next();
    }
  },

  // Payment Cancel - User cancelled payment
  {
    path: '/payment/cancel/:provider?',
    name: 'PaymentCancel',
    component: PaymentFailed,
    props: route => ({
      provider: route.params.provider || 'unknown',
      error: 'Payment was cancelled by user',
      cancelled: true,
      ...route.query
    }),
    meta: { title: 'Payment Cancelled' }
  },

  // ============================================
  // REDIRECTS AND LEGACY ROUTES
  // ============================================
  
  // Vocabulary redirect
  { 
    path: '/vocabulary/:language?', 
    redirect: '/profile/vocabulary' 
  },
  
  // Legacy payment routes redirect
  { 
    path: '/payment/:plan?', 
    redirect: to => `/pay/${to.params.plan || 'start'}` 
  },

  // Legacy PayMe routes (for backwards compatibility)
  {
    path: '/payme/:plan',
    redirect: to => ({
      name: 'PaymentSelection',
      params: { plan: to.params.plan },
      query: { provider: 'payme', ...to.query }
    })
  },

  // Catch-all redirect
  { 
    path: '/:catchAll(.*)', 
    name: 'NotFound', 
    redirect: '/' 
  },
];

// --- ROUTER INSTANCE ---

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return { 
        el: to.hash, 
        behavior: 'smooth', 
        top: 80 
      };
    }
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

// --- GLOBAL NAVIGATION GUARDS ---

router.beforeEach(async (to, from, next) => {
  try {
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

    // Check for intended route after successful payment
    if (to.name === 'UniversalPaymentSuccess') {
      const intendedRoute = sessionStorage.getItem('intendedRoute');
      if (intendedRoute) {
        try {
          const route = JSON.parse(intendedRoute);
          sessionStorage.removeItem('intendedRoute');
          
          // Delay navigation to allow payment success to be processed
          setTimeout(() => {
            router.push(route);
          }, 3000);
        } catch (e) {
          console.error('Error parsing intended route:', e);
        }
      }
    }

    console.log('✅ Navigation allowed.');
    next();
  } catch (error) {
    console.error('❌ Global navigation guard error:', error);
    next(false);
  }
});

router.afterEach((to, from) => {
  // Update page title
  const baseTitle = 'ACED - Educational Platform';
  document.title = to.meta.title ? `${to.meta.title} - ACED` : baseTitle;
  
  // Periodically check for pending payments
  if (store.getters.isLoggedIn && !to.path.includes('/pay')) {
    const lastCheck = store.getters['user/lastPaymentCheck'];
    const fiveMinutes = 5 * 60 * 1000;
    
    if (!lastCheck || (Date.now() - lastCheck) > fiveMinutes) {
      store.dispatch('user/checkPendingPayments').catch(err => {
        console.error('❌ Failed to auto-check pending payments:', err);
      });
    }
  }

  // Log successful navigation
  console.log(`✅ Successfully navigated to: ${to.name || to.path}`);
});

router.onError((err) => {
  console.error('❌ Router Error:', err);

  // Silently ignore NavigationDuplicated errors
  if (err.name === 'NavigationDuplicated') {
    return;
  }

  // Automatically reload on chunk load errors
  if (err.message.includes('Failed to fetch dynamically imported module') || 
      err.message.includes('Loading chunk')) {
    console.log('🔄 Chunk loading failed. Reloading the page...');
    window.location.reload();
  }
});

// --- NAVIGATION HELPERS ---

/**
 * Safe navigation method to use in components.
 * Prevents "NavigationDuplicated" errors from being thrown.
 * @param {object} routerInstance - The Vue router instance (this.$router).
 * @param {object|string} route - The route to navigate to.
 * @returns {Promise}
 */
export function safeNavigate(routerInstance, route) {
  return routerInstance.push(route).catch(err => {
    if (err.name !== 'NavigationDuplicated') {
      console.error('Navigation error:', err);
      return Promise.reject(err);
    }
    return Promise.resolve();
  });
}

/**
 * Enhanced navigation with a loading state callback.
 * @param {object} routerInstance - The Vue router instance (this.$router).
 * @param {object|string} route - The route to navigate to.
 * @param {Function} loadingCallback - A function to call with the loading state.
 * @returns {Promise}
 */
export function navigateWithLoading(routerInstance, route, loadingCallback) {
  if (loadingCallback) loadingCallback(true);
  
  return routerInstance.push(route)
    .catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('Navigation failed:', err);
        throw err;
      }
    })
    .finally(() => {
      if (loadingCallback) loadingCallback(false);
    });
}

/**
 * Navigate to payment with user context
 * @param {object} routerInstance - The Vue router instance
 * @param {string} plan - Payment plan ('start' or 'pro')
 * @param {object} userData - User information
 * @param {string} provider - Payment provider (optional)
 */
export function navigateToPayment(routerInstance, plan, userData = {}, provider = 'multicard') {
  const validPlans = ['start', 'pro'];
  if (!validPlans.includes(plan)) {
    console.error('❌ Invalid plan:', plan);
    plan = 'start';
  }

  return safeNavigate(routerInstance, {
    name: 'PaymentSelection',
    params: { plan },
    query: {
      userId: userData.userId || '',
      userName: userData.userName || '',
      userEmail: userData.userEmail || '',
      currentPlan: userData.currentPlan || 'free',
      provider: provider
    }
  });
}

// --- DEBUG HELPERS ---

if (process.env.NODE_ENV !== 'production') {
  window.routerDebug = {
    getPlan: () => {
      const plan = getEffectiveUserPlan();
      console.log('Current Plan:', plan);
      return plan;
    },
    testAccess: (feature, plans = ['start', 'pro']) => {
      const currentPlan = getEffectiveUserPlan();
      const hasAccess = plans.includes(currentPlan);
      console.log(`Access to '${feature}' with plans [${plans.join(', ')}]:`, hasAccess);
      console.log(`Current plan: ${currentPlan}`);
      return hasAccess;
    },
    goTo: (path) => router.push(path),
    currentRoute: () => {
      console.table(router.currentRoute.value);
      return router.currentRoute.value;
    },
    testPayment: (plan = 'start', provider = 'multicard') => {
      console.log(`Testing payment flow: plan=${plan}, provider=${provider}`);
      navigateToPayment(router, plan, {
        userId: 'test-user-123',
        userName: 'Test User',
        userEmail: 'test@example.com',
        currentPlan: 'free'
      }, provider);
    },
    listRoutes: () => {
      console.table(routes.map(r => ({
        name: r.name,
        path: r.path,
        auth: r.meta?.requiresAuth
      })));
    }
  };
  console.log('🐛 Router debug helpers available at window.routerDebug');
  console.log('Try: window.routerDebug.testPayment("pro", "multicard")');
}

export default router;