import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// ✅ Main Views
import HomePage from '@/views/HomePage.vue';
import ProfilePage from '@/views/ProfilePage.vue';
import AcedSettings from '@/components/Main/AcedSettings.vue';
// ✅ UPDATED: Import vocabulary from views folder
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
  // ✅ REMOVED: Standalone vocabulary routes completely removed
  // Old routes that are now removed:
  // - /vocabulary
  // - /vocabulary/:language
  
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
          // Pass the ID as both homeworkId and lessonId - component will determine which one to use
          homeworkId: route.params.id,
          lessonId: route.params.id,
          // Pass query parameters for additional context
          homeworkType: route.query.type || route.query.homeworkType,
          title: route.query.title,
          subject: route.query.subject
        }),
        meta: { title: 'Выполнение домашнего задания' },
        beforeEnter: (to, from, next) => {
          // Validate ID before entering the route
          if (!to.params.id || to.params.id === 'null' || to.params.id === 'undefined') {
            console.error('❌ Invalid homework/lesson ID:', to.params.id);
            next({ name: 'HomeworkList' });
          } else {
            console.log('✅ Valid homework/lesson ID:', to.params.id, 'Type:', to.query.type);
            next();
          }
        }
      },
      
      // ✅ ADDITIONAL: Specific routes for different homework types (for cleaner URLs and explicit routing)
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
      }
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
  
  // ✅ ADDED: Redirect old vocabulary routes to profile vocabulary
  {
    path: '/vocabulary',
    redirect: '/profile/vocabulary'
  },
  {
    path: '/vocabulary/:language',
    redirect: to => `/profile/vocabulary`
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

// ✅ Enhanced Route Guard: wait for Firebase auth before navigation
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

  // ✅ ENHANCED: Additional homework route validation
  if (to.name && to.name.includes('Homework') && to.params.id) {
    // Log homework navigation for debugging
    console.log('📚 Homework route navigation:', {
      route: to.name,
      id: to.params.id || to.params.homeworkId || to.params.lessonId,
      type: to.query.type,
      from: from.path
    });
  }

  // ✅ NEW: Vocabulary route validation and logging
  if (to.name && to.name.includes('Vocabulary')) {
    console.log('📖 Vocabulary route navigation:', {
      route: to.name,
      path: to.path,
      from: from.path
    });
  }

  next();
});

// ✅ Enhanced navigation logging after route changes
router.afterEach((to, from) => {
  // Update document title
  const baseTitle = 'ACED';
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle;
  
  // Enhanced logging for homework routes
  if (to.name && to.name.includes('Homework')) {
    console.log(`📚 Homework navigation completed:`, {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path
    });
  } 
  // Enhanced logging for vocabulary routes
  else if (to.name && to.name.includes('Vocabulary')) {
    console.log(`📖 Vocabulary navigation completed:`, {
      route: to.name,
      path: to.path,
      params: to.params,
      query: to.query,
      from: from.path
    });
  } else {
    // Standard navigation logging
    console.log(`📍 Navigated from ${from.path} to ${to.path}`);
  }
  
  // Log params if any
  if (Object.keys(to.params).length > 0) {
    console.log('📦 Route params:', to.params);
  }
  
  // Log query params if any
  if (Object.keys(to.query).length > 0) {
    console.log('🔍 Query params:', to.query);
  }
});

// ✅ Enhanced error handling for routing errors
router.onError((err) => {
  console.error('❌ Ошибка маршрута:', err);
  
  // If chunk loading fails, reload the page
  if (err.message.includes('Failed to fetch dynamically imported module')) {
    console.log('🔄 Reloading due to chunk loading error...');
    window.location.reload();
  }
  
  // Handle navigation errors specifically for homework routes
  if (err.message.includes('homework') || err.message.includes('Homework')) {
    console.error('📚 Homework route error:', err);
    // Could redirect to homework list as fallback
    // router.push({ name: 'HomeworkList' });
  }
  
  // Handle navigation errors specifically for vocabulary routes
  if (err.message.includes('vocabulary') || err.message.includes('Vocabulary')) {
    console.error('📖 Vocabulary route error:', err);
    // Could redirect to main profile page as fallback
    // router.push({ name: 'MainPage' });
  }
});

// ✅ Debug navigation failures with enhanced logging
router.isReady().then(() => {
  console.log('✅ Router is ready');
  console.log('📋 Available routes:');
  console.log('  Main routes:');
  console.log('    / (HomePage)');
  console.log('    /settings (SettingsPage)');
  console.log('  Profile routes:');
  console.log('    /profile/main');
  console.log('    /profile/vocabulary (VocabularyPage from views)');
  console.log('    /profile/homeworks');
  console.log('    /profile/homeworks/:id (flexible)');
  console.log('    /profile/homework/lesson/:lessonId (specific lesson)');
  console.log('    /profile/homework/standalone/:homeworkId (specific standalone)');
  console.log('  Redirects:');
  console.log('    /vocabulary → /profile/vocabulary');
  console.log('    /vocabulary/:language → /profile/vocabulary');
  console.log('  Payment routes:');
  console.log('    /pay/:plan');
  console.log('  Learning routes:');
  console.log('    /lesson/:id');
  console.log('    /topic/:id/overview');
}).catch(err => {
  console.error('❌ Router initialization failed:', err);
});

export default router;