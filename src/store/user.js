// src/store/user.js - ENHANCED BULLETPROOF USER STORE FOR VUE 3

import { checkPaymentStatus } from '@/api/payments';
import { getUserUsage, resetMonthlyUsage } from '@/services/GPTService';
import { updateUserStatusAction } from '@/composables/useUserStatus';


// ✅ ENHANCED triggerGlobalEvent function with error handling
const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {

    // Enhanced event data with metadata
    const enhancedData = {
      ...data,
      eventName,
      source: 'user-store',
      timestamp: data.timestamp || Date.now(),
      version: '2.0'
    };

    // 🔥 METHOD 1: Custom DOM event (MOST RELIABLE)
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);

    // 🔥 METHOD 2: Event bus (secondary)
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
    }

    // 🔥 METHOD 3: Vue event bus (tertiary)
    if (window.Vue?.$bus?.$emit) {
      window.Vue.$bus.$emit(eventName, enhancedData);
    }

    // 🔥 METHOD 4: Direct window event for cross-tab communication
    if (eventName === 'userStatusChanged' || eventName === 'userSubscriptionChanged') {
      const storageEvent = new CustomEvent('userSubscriptionChanged', {
        detail: enhancedData,
        bubbles: true
      });
      window.dispatchEvent(storageEvent);
    }

    // 🔥 METHOD 5: Force update all Vue instances
    if (window.Vue?._installedPlugins?.find(p => p.version)) {
      // Try to force update all Vue instances
      setTimeout(() => {
        if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.Vue) {
        }
      }, 10);
    }

  } catch (eventError) {
    console.error(`❌ Failed to trigger global event '${eventName}':`, eventError);
  }
};

// Helper functions
const updateFeatureMatrix = (state) => {
  const featureMatrix = {
    free: {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false,
      export_progress: false,
      advanced_grammar: false,
      multiple_languages: false,
      ai_tutor: false
    },
    start: {
      vocabulary: true,
      analytics: false,
      unlimited_lessons: false,
      priority_support: true,
      custom_courses: false,
      offline_mode: true,
      export_progress: false,
      advanced_grammar: true,
      multiple_languages: false,
      ai_tutor: false
    },
    pro: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true,
      advanced_grammar: true,
      multiple_languages: true,
      ai_tutor: true
    },
    premium: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true,
      advanced_grammar: true,
      multiple_languages: true,
      ai_tutor: true
    }
  };

  // ✅ BULLETPROOF: Ensure valid user status
  const userStatus = state.userStatus || 'free';
  const newFeatures = { ...(featureMatrix[userStatus] || featureMatrix.free) };

  // Only update if features actually changed
  const featuresChanged = Object.keys(newFeatures).some(
    key => state.features[key] !== newFeatures[key]
  );

  if (featuresChanged) {
    state.features = newFeatures;
  }

  return featuresChanged;
};

const getCurrentLimits = (state) => {
  const userStatus = state.userStatus || 'free';
  return state.usage?.limits?.[userStatus] || state.usage?.limits?.free || { messages: 50, images: 5 };
};

const getUserId = (state) => {
  // Try multiple sources for user ID with fallbacks
  return state.currentUser?.firebaseId ||
    state.currentUser?.firebaseUserId ||
    state.currentUser?._id ||
    state.currentUser?.uid ||
    localStorage.getItem('userId') ||
    localStorage.getItem('firebaseUserId') ||
    sessionStorage.getItem('userId') ||
    null;
};

const getUserToken = async () => {
  try {
    // Try multiple methods to get the token

    // Method 1: From Firebase Auth
    try {
      const { auth } = await import('@/firebase');
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token && token.length > 20) {
          return token;
        }
      }
    } catch (firebaseError) {
      console.warn('⚠️ Firebase token retrieval failed:', firebaseError);
    }

    // Method 2: From localStorage
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (storedToken && storedToken.length > 20) {
        return storedToken;
      }
    } catch (storageError) {
      console.warn('⚠️ localStorage token retrieval failed:', storageError);
    }

    // Method 3: From sessionStorage
    try {
      const sessionToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (sessionToken && sessionToken.length > 20) {
        return sessionToken;
      }
    } catch (sessionError) {
      console.warn('⚠️ sessionStorage token retrieval failed:', sessionError);
    }

    console.warn('⚠️ No valid authentication token found');
    return null;

  } catch (error) {
    console.warn('⚠️ Token retrieval completely failed:', error);
    return null;
  }
};

// ✅ CENTRALIZED STATE MANAGEMENT WITH ENHANCED STRUCTURE
const state = () => ({
  // User data - synced from server
  currentUser: null,
  isAuthenticated: false,

  // Subscription - server-first
  subscription: {
    plan: 'free',
    status: 'inactive',
    source: null,
    startDate: null,
    expiryDate: null,
    isAutoRenew: false,
    details: {},
    lastSync: null
  },

  // Study list - server-first
  studyList: [],

  // Progress data - server-first
  progress: [],

  // Preferences - server-first
  preferences: {
    language: 'ru',
    theme: 'light',
    notifications: true,
    emailUpdates: false,
    autoSave: true,
    soundEffects: true,
    reducedMotion: false
  },
  
  // Usage tracking
  usage: {
    current: {
      messages: 0,
      images: 0,
      lastUpdated: null,
      resetDate: null
    },
    limits: {
      free: { messages: 50, images: 5 },
      start: { messages: -1, images: 20 },
      pro: { messages: -1, images: -1 },
      premium: { messages: -1, images: -1 }
    },
    history: [],
    monthlyStats: {
      currentMonth: null,
      totalMessages: 0,
      totalImages: 0
    }
  },
  
  // Feature access matrix
  features: {
    vocabulary: false,
    analytics: false,
    unlimited_lessons: false,
    priority_support: false,
    custom_courses: false,
    offline_mode: false,
    export_progress: false,
    advanced_grammar: false,
    multiple_languages: false,
    ai_tutor: false
  },

  // Promocodes tracking
  promocodes: {
    applied: [],
    available: [],
    lastCheck: null,
    validationCache: new Map()
  },
  
  // Payment history
  payments: {
    history: [],
    pending: [],
    failed: [],
    lastCheck: null,
    retryQueue: []
  },

  // Sync status
  syncStatus: {
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    pendingChanges: [],
    conflictResolution: null
  },

  // System state
  system: {
    initialized: false,
    initializationTime: null,
    lastUpdate: Date.now(),
    forceUpdateCounter: 0,
    reactivityKey: 0,
    syncInProgress: false,
    loading: {
      status: false,
      usage: false,
      payments: false,
      saving: false,
      sync: false
    },
    errors: {
      lastError: null,
      errorCount: 0,
      recoveryAttempts: 0
    },
    performance: {
      loadTime: 0,
      apiResponseTimes: []
    }
  },

  // Cache for better performance
  cache: {
    userStatusCache: null,
    usageCache: null,
    lastCacheUpdate: null,
    cacheExpiry: 5 * 60 * 1000 // 5 minutes
  }
});


// ✅ ENHANCED GETTER DEFINITIONS WITH COMPREHENSIVE NULL SAFETY
const getters = {
  // ========================================
  // BASIC USER GETTERS WITH NULL SAFETY
  // ========================================

  isAuthenticated: (state) => {
    return !!(state.currentUser && (state.currentUser.firebaseId || state.currentUser._id));
  },

  getUser: (state) => state.currentUser,

  getUserId: (state) => getUserId(state),

  userName: (state) => {
    return state.currentUser?.name ||
      state.currentUser?.displayName ||
      state.currentUser?.email?.split('@')[0] ||
      'Пользователь';
  },

  userEmail: (state) => state.currentUser?.email || '',

  userPhoto: (state) => state.currentUser?.photoURL || null,

  isEmailVerified: (state) => Boolean(state.currentUser?.emailVerified),

  // ========================================
  // SUBSCRIPTION GETTERS WITH NULL SAFETY
  // ========================================

  userStatus: (state) => state.subscription?.plan || 'free',

  subscription: (state) => state.subscription || {
    plan: 'free',
    status: 'inactive',
    source: null,
    startDate: null,
    expiryDate: null,
    isAutoRenew: false,
    details: {}
  },

  subscriptionDetails: (state) => state.subscription || {
    plan: 'free',
    status: 'inactive'
  },

  // ========================================
  // STATUS CHECKS WITH ENHANCED LOGIC
  // ========================================

  isPremiumUser: (state) => {
    const status = state.subscription?.plan || 'free';
    return ['premium', 'start', 'pro'].includes(status);
  },

  isStartUser: (state) => {
    const status = state.subscription?.plan || 'free';
    return ['start', 'pro', 'premium'].includes(status);
  },

  isProUser: (state) => {
    const status = state.subscription?.plan || 'free';
    return ['pro', 'premium'].includes(status);
  },

  isFreeUser: (state) => {
    const status = state.subscription?.plan || 'free';
    return status === 'free';
  },

  hasActiveSubscription: (state) => {
    const subscription = state.subscription || {};
    return subscription.status === 'active' &&
      (subscription.plan !== 'free');
  },

  isSubscriptionExpired: (state) => {
    const subscription = state.subscription || {};
    if (!subscription.expiryDate || subscription.status !== 'active') {
      return false;
    }

    const expiryDate = new Date(subscription.expiryDate);
    return expiryDate < new Date();
  },

  subscriptionDaysLeft: (state) => {
    const subscription = state.subscription || {};
    if (!subscription.expiryDate || subscription.status !== 'active') {
      return null;
    }

    const expiryDate = new Date(subscription.expiryDate);
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  },

  // ========================================
  // SUBSCRIPTION METADATA
  // ========================================

  subscriptionSource: (state) => (state.subscription?.source) || 'free',

  hasPromocodeSubscription: (state) => {
    return (state.subscription?.source) === 'promocode';
  },

  hasPaymentSubscription: (state) => {
    return (state.subscription?.source) === 'payment';
  },

  subscriptionExpiry: (state) => state.subscription?.expiryDate || null,

  subscriptionStartDate: (state) => state.subscription?.startDate || null,

  isAutoRenewEnabled: (state) => Boolean(state.subscription?.isAutoRenew),

  // ========================================
  // FEATURE ACCESS GETTERS WITH NULL SAFETY
  // ========================================

  features: (state) => state.features || {},

  hasVocabularyAccess: (state) => Boolean((state.features || {}).vocabulary),

  hasAnalyticsAccess: (state) => Boolean((state.features || {}).analytics),

  hasAdvancedFeatures: (state) => Boolean((state.features || {}).analytics),

  hasUnlimitedLessons: (state) => Boolean((state.features || {}).unlimited_lessons),

  hasPrioritySupport: (state) => Boolean((state.features || {}).priority_support),

  hasCustomCourses: (state) => Boolean((state.features || {}).custom_courses),

  hasOfflineMode: (state) => Boolean((state.features || {}).offline_mode),

  hasExportProgress: (state) => Boolean((state.features || {}).export_progress),

  hasAdvancedGrammar: (state) => Boolean((state.features || {}).advanced_grammar),

  hasMultipleLanguages: (state) => Boolean((state.features || {}).multiple_languages),

  hasAITutor: (state) => Boolean((state.features || {}).ai_tutor),

  // Feature checker function
  hasFeatureAccess: (state) => (feature) => {
    return Boolean((state.features || {})[feature]);
  },

  // Get all enabled features
  enabledFeatures: (state) => {
    const features = state.features || {};
    return Object.entries(features)
      .filter(([key, enabled]) => enabled)
      .map(([key]) => key);
  },

  // Get feature count
  enabledFeatureCount: (state, getters) => {
    return getters.enabledFeatures.length;
  },
  
  // User status getters
  // userStatus: (state) => state.subscription?.plan || 'free',
  // isPremiumUser: (state) => ['start', 'pro', 'premium'].includes(state.subscription?.plan),
  // isProUser: (state) => ['pro', 'premium'].includes(state.subscription?.plan),
  //
  // // Subscription getters
  // hasActiveSubscription: (state) => {
  //   return state.subscription?.status === 'active' &&
  //     state.subscription?.plan !== 'free';
  // },
  //
  // isSubscriptionExpired: (state) => {
  //   if (!state.subscription?.expiryDate) return false;
  //   return new Date(state.subscription.expiryDate) < new Date();
  // },
  //
  // // Study list getters
  activeStudyList: (state) => {
    return state.studyList.filter(item => item.isActive);
  },

  studyListCount: (state) => state.studyList.length,

  // Progress getters
  completedLessons: (state) => {
    return state.progress.filter(p => p.completed);
  },

  totalProgressPercent: (state) => {
    if (state.progress.length === 0) return 0;
    const total = state.progress.reduce((sum, p) => sum + (p.progressPercent || 0), 0);
    return Math.round(total / state.progress.length);
  },
  
  // ========================================
  // USAGE GETTERS WITH NULL SAFETY
  // ========================================

  currentUsage: (state) => {
    return state.usage?.current || {
      messages: 0,
      images: 0,
      lastUpdated: null,
      resetDate: null
    };
  },

  usageLimits: (state) => {
    const userStatus = state.subscription?.plan || 'free';
    return (state.usage?.limits || {})[userStatus] || { messages: 50, images: 5 };
  },

  usageHistory: (state) => state.usage?.history || [],

  monthlyStats: (state) => {
    return state.usage?.monthlyStats || {
      currentMonth: null,
      totalMessages: 0,
      totalImages: 0
    };
  },

  // Usage percentage calculations
  messageUsagePercentage: (state, getters) => {
    const current = getters.currentUsage.messages || 0;
    const limit = getters.usageLimits.messages;

    if (limit <= 0) return 0; // Unlimited
    return Math.min(100, Math.round((current / limit) * 100));
  },

  imageUsagePercentage: (state, getters) => {
    const current = getters.currentUsage.images || 0;
    const limit = getters.usageLimits.images;

    if (limit <= 0) return 0; // Unlimited
    return Math.min(100, Math.round((current / limit) * 100));
  },

  // Usage limit checks
  isMessageLimitReached: (state, getters) => {
    const current = getters.currentUsage.messages || 0;
    const limit = getters.usageLimits.messages;

    return limit > 0 && current >= limit;
  },

  isImageLimitReached: (state, getters) => {
    const current = getters.currentUsage.images || 0;
    const limit = getters.usageLimits.images;

    return limit > 0 && current >= limit;
  },

  remainingMessages: (state, getters) => {
    const current = getters.currentUsage.messages || 0;
    const limit = getters.usageLimits.messages;

    return limit > 0 ? Math.max(0, limit - current) : -1; // -1 means unlimited
  },

  remainingImages: (state, getters) => {
    const current = getters.currentUsage.images || 0;
    const limit = getters.usageLimits.images;

    return limit > 0 ? Math.max(0, limit - current) : -1; // -1 means unlimited
  },

  // ========================================
  // PROMOCODE GETTERS WITH ARRAY SAFETY
  // ========================================

  appliedPromocodes: (state) => {
    const promocodes = state.promocodes?.applied;
    return Array.isArray(promocodes) ? promocodes : [];
  },

  hasAppliedPromocodes: (state, getters) => {
    const promocodes = getters.appliedPromocodes;
    return Array.isArray(promocodes) && promocodes.length > 0;
  },

  lastAppliedPromocode: (state, getters) => {
    const promocodes = getters.appliedPromocodes;
    return (Array.isArray(promocodes) && promocodes.length > 0) ? promocodes[0] : null;
  },

  promocodeCount: (state, getters) => {
    return getters.appliedPromocodes.length;
  },

  // Get promocodes by plan
  promocodesByPlan: (state, getters) => {
    const promocodes = getters.appliedPromocodes;
    return promocodes.reduce((acc, promo) => {
      const plan = promo.plan || 'unknown';
      if (!acc[plan]) acc[plan] = [];
      acc[plan].push(promo);
      return acc;
    }, {});
  },

  // ========================================
  // PAYMENT GETTERS WITH ARRAY SAFETY
  // ========================================

  paymentHistory: (state) => {
    const history = state.payments?.history;
    return Array.isArray(history) ? history : [];
  },

  pendingPayments: (state) => {
    const pending = state.payments?.pending;
    return Array.isArray(pending) ? pending : [];
  },

  failedPayments: (state) => {
    const failed = state.payments?.failed;
    return Array.isArray(failed) ? failed : [];
  },

  lastPaymentCheck: (state) => state.payments?.lastCheck || null,

  hasRecentPayments: (state, getters) => {
    const history = getters.paymentHistory;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    return Array.isArray(history) && history.some(p =>
      p.status === 'completed' &&
      p.timestamp > thirtyDaysAgo
    );
  },

  totalPaymentsAmount: (state, getters) => {
    const history = getters.paymentHistory;
    return history
      .filter(p => p.status === 'completed')
      .reduce((total, p) => total + (p.amount || 0), 0);
  },

  pendingPaymentsCount: (state, getters) => {
    return getters.pendingPayments.length;
  },

  lastCompletedPayment: (state, getters) => {
    const completed = getters.paymentHistory.filter(p => p.status === 'completed');
    return completed.length > 0 ? completed[0] : null;
  },

  // ========================================
  // SYSTEM GETTERS
  // ========================================

  isInitialized: (state) => Boolean(state.system?.initialized),

  initializationTime: (state) => state.system?.initializationTime || null,

  isLoading: (state) => (type) => {
    return Boolean((state.system?.loading || {})[type]);
  },

  isAnyLoading: (state) => {
    const loading = state.system?.loading || {};
    return Object.values(loading).some(Boolean);
  },

  isSyncInProgress: (state) => Boolean(state.syncStatus?.syncInProgress),

  lastUpdate: (state) => state.system?.lastUpdate || null,

  forceUpdateCounter: (state) => state.system?.forceUpdateCounter || 0,

  systemErrors: (state) => state.system?.errors || { lastError: null, errorCount: 0 },

  lastError: (state) => state.system?.errors?.lastError || null,

  errorCount: (state) => state.system?.errors?.errorCount || 0,

  performanceMetrics: (state) => state.system?.performance || { loadTime: 0, apiResponseTimes: [] },

  averageApiResponseTime: (state) => {
    const times = state.system?.performance?.apiResponseTimes || [];
    if (times.length === 0) return 0;
    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
  },

  // Sync status getters
  needsSync: (state) => state.syncStatus.pendingChanges.length > 0,
  isOnline: (state) => state.syncStatus.isOnline,
  lastSyncTime: (state) => state.syncStatus.lastSync,
  
  // ========================================
  // PREFERENCES GETTERS
  // ========================================

  userPreferences: (state) => state.preferences || {},

  language: (state) => (state.preferences || {}).language || 'ru',

  theme: (state) => (state.preferences || {}).theme || 'light',

  notificationsEnabled: (state) => (state.preferences || {}).notifications !== false,

  emailUpdatesEnabled: (state) => Boolean((state.preferences || {}).emailUpdates),

  autoSaveEnabled: (state) => (state.preferences || {}).autoSave !== false,

  soundEffectsEnabled: (state) => (state.preferences || {}).soundEffects !== false,

  reducedMotionEnabled: (state) => Boolean((state.preferences || {}).reducedMotion),

  // ========================================
  // CACHE GETTERS
  // ========================================

  isCacheValid: (state) => {
    const cache = state.cache || {};
    const now = Date.now();
    const lastUpdate = cache.lastCacheUpdate || 0;
    const expiry = cache.cacheExpiry || 300000; // 5 minutes default

    return (now - lastUpdate) < expiry;
  },

  cacheAge: (state) => {
    const cache = state.cache || {};
    const now = Date.now();
    const lastUpdate = cache.lastCacheUpdate || 0;

    return now - lastUpdate;
  },

  // ========================================
  // COMPUTED STATUS LABELS
  // ========================================

  userStatusLabel: (state) => {
    const labels = {
      free: 'Бесплатный',
      start: 'Стартовый',
      pro: 'Профессиональный',
      premium: 'Премиум'
    };
    return labels[state.subscription?.plan] || labels.free;
  },

  subscriptionStatusLabel: (state) => {
    const subscription = state.subscription || {};
    const labels = {
      active: 'Активна',
      inactive: 'Неактивна',
      expired: 'Истекла',
      cancelled: 'Отменена'
    };
    return labels[subscription.status] || labels.inactive;
  },

  // ========================================
  // SUMMARY GETTERS
  // ========================================

  userSummary: (state, getters) => {
    return {
      isAuthenticated: getters.isAuthenticated,
      userName: getters.userName,
      userEmail: getters.userEmail,
      userStatus: getters.userStatus,
      userStatusLabel: getters.userStatusLabel,
      isPremium: getters.isPremiumUser,
      hasActiveSubscription: getters.hasActiveSubscription,
      enabledFeatureCount: getters.enabledFeatureCount,
      subscriptionDaysLeft: getters.subscriptionDaysLeft,
      lastUpdate: getters.lastUpdate
    };
  },

  usageSummary: (state, getters) => {
    return {
      current: getters.currentUsage,
      limits: getters.usageLimits,
      messageUsagePercentage: getters.messageUsagePercentage,
      imageUsagePercentage: getters.imageUsagePercentage,
      isMessageLimitReached: getters.isMessageLimitReached,
      isImageLimitReached: getters.isImageLimitReached,
      remainingMessages: getters.remainingMessages,
      remainingImages: getters.remainingImages
    };
  },

  subscriptionSummary: (state, getters) => {
    return {
      plan: getters.userStatus,
      status: getters.subscriptionDetails.status,
      source: getters.subscriptionSource,
      isActive: getters.hasActiveSubscription,
      isExpired: getters.isSubscriptionExpired,
      daysLeft: getters.subscriptionDaysLeft,
      expiryDate: getters.subscriptionExpiry,
      isAutoRenew: getters.isAutoRenewEnabled,
      enabledFeatures: getters.enabledFeatures
    };
  }
};


// ✅ ENHANCED MUTATIONS WITH BULLETPROOF SAFETY AND LOGGING
const mutations = {
  // User mutations
  SET_USER(state, userData) {
    state.currentUser = userData;
    state.isAuthenticated = !!userData;
    
    if (userData) {
      // Sync subscription data from server
      if (userData.subscription) {
        state.subscription = { ...state.subscription, ...userData.subscription };
      }

      // Sync study list from server
      if (userData.studyList) {
        state.studyList = userData.studyList;
      }

      // Sync progress from server
      if (userData.progress) {
        state.progress = userData.progress;
      }

      // Sync preferences from server
      if (userData.preferences) {
        state.preferences = { ...state.preferences, ...userData.preferences };
      }
    }
  },

  // Subscription mutations
  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    state.subscription = { ...state.subscription, ...subscriptionData };

    // Mark as pending sync
    state.syncStatus.pendingChanges.push({
      type: 'subscription',
      data: subscriptionData,
      timestamp: Date.now()
    });
  },

  // Study list mutations
  ADD_TO_STUDY_LIST(state, courseData) {
    const existing = state.studyList.find(item =>
      item.topicId?.toString() === courseData.topicId?.toString()
    );

    if (!existing) {
      state.studyList.unshift({
        ...courseData,
        addedAt: new Date(),
        lastAccessedAt: new Date(),
        isActive: true
      });

      // Mark as pending sync
      state.syncStatus.pendingChanges.push({
        type: 'studyList_add',
        data: courseData,
        timestamp: Date.now()
      });
    }
  },

  REMOVE_FROM_STUDY_LIST(state, topicId) {
    const index = state.studyList.findIndex(item =>
      item.topicId?.toString() === topicId?.toString()
    );

    if (index !== -1) {
      state.studyList.splice(index, 1);

      // Mark as pending sync
      state.syncStatus.pendingChanges.push({
        type: 'studyList_remove',
        data: { topicId },
        timestamp: Date.now()
      });
    }
  },

  UPDATE_STUDY_LIST_PROGRESS(state, { topicId, progress }) {
    const item = state.studyList.find(item =>
      item.topicId?.toString() === topicId?.toString()
    );

    if (item) {
      item.progress = progress;
      item.lastAccessedAt = new Date();

      // Mark as pending sync
      state.syncStatus.pendingChanges.push({
        type: 'studyList_progress',
        data: { topicId, progress },
        timestamp: Date.now()
      });
    }
  },
  // Progress mutations
  UPDATE_LESSON_PROGRESS(state, progressData) {
    const existingIndex = state.progress.findIndex(p =>
      p.lessonId?.toString() === progressData.lessonId?.toString()
    );

    if (existingIndex !== -1) {
      state.progress[existingIndex] = {
        ...state.progress[existingIndex],
        ...progressData,
        lastAccessedAt: new Date()
      };
    } else {
      state.progress.push({
        ...progressData,
        lastAccessedAt: new Date()
      });
    }

    // Mark as pending sync
    state.syncStatus.pendingChanges.push({
      type: 'progress',
      data: progressData,
      timestamp: Date.now()
    });
  },

  // Preferences mutations
  UPDATE_PREFERENCES(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences };

    // Mark as pending sync
    state.syncStatus.pendingChanges.push({
      type: 'preferences',
      data: preferences,
      timestamp: Date.now()
    });
  },

  // Sync mutations
  SET_SYNC_STATUS(state, status) {
    state.syncStatus = { ...state.syncStatus, ...status };
  },

  CLEAR_PENDING_CHANGES(state) {
    state.syncStatus.pendingChanges = [];
  },

  SET_ONLINE_STATUS(state, isOnline) {
    state.syncStatus.isOnline = isOnline;
  },

  // System mutations
  SET_LOADING(state, loading) {
    state.system.loading = loading;
  },

  SET_ERROR(state, error) {
    state.system.error = error;
  },

  SET_INITIALIZED(state, initialized) {
    state.system.initialized = initialized;
  },
  
  // ✅ ENHANCED: Bulletproof promocode management
  ADD_PROMOCODE(state, promocodeData) {
    const timestamp = Date.now();

    // Ensure applied array exists and is an array
    if (!Array.isArray(state.promocodes.applied)) {
      state.promocodes.applied = [];
      console.warn('⚠️ Fixed promocodes.applied array');
    }

    const promocode = {
      id: `promo_${timestamp}`,
      code: promocodeData.code?.toUpperCase() || '',
      plan: promocodeData.plan || 'free',
      oldPlan: promocodeData.oldPlan || state.userStatus,
      appliedAt: new Date().toISOString(),
      source: promocodeData.source || 'manual',
      details: promocodeData.details || {},
      timestamp
    };

    // Validate promocode
    if (!promocode.code || promocode.code.length < 3) {
      console.error('❌ Invalid promocode data:', promocode);
      return;
    }

    // Check for duplicates
    const existingIndex = state.promocodes.applied.findIndex(p => p.code === promocode.code);
    if (existingIndex >= 0) {
      state.promocodes.applied[existingIndex] = { ...state.promocodes.applied[existingIndex], ...promocode };
    } else {
      state.promocodes.applied.unshift(promocode);
    }

    // Keep only last 10 promocodes
    if (state.promocodes.applied.length > 10) {
      state.promocodes.applied = state.promocodes.applied.slice(0, 10);
    }
  },

  // ✅ ENHANCED: Bulletproof payment management
  ADD_PAYMENT(state, paymentData) {
    const timestamp = Date.now();

    // Ensure history array exists and is an array
    if (!Array.isArray(state.payments.history)) {
      state.payments.history = [];
      console.warn('⚠️ Fixed payments.history array');
    }

    const payment = {
      id: paymentData.id || `payment_${timestamp}`,
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'UZS',
      status: paymentData.status || 'pending',
      plan: paymentData.plan || 'free',
      method: paymentData.method || 'unknown',
      timestamp: paymentData.timestamp || timestamp,
      createdAt: new Date().toISOString(),
      details: paymentData.details || {},
      retryCount: 0
    };

    // Validate payment data
    if (!payment.id || payment.amount <= 0) {
      console.error('❌ Invalid payment data:', payment);
      return;
    }

    // Check for duplicates
    const existingIndex = state.payments.history.findIndex(p => p.id === payment.id);
    if (existingIndex >= 0) {
      state.payments.history[existingIndex] = { ...state.payments.history[existingIndex], ...payment };
    } else {
      state.payments.history.unshift(payment);
    }

    // Keep only last 50 payments
    if (state.payments.history.length > 50) {
      state.payments.history = state.payments.history.slice(0, 50);
    }

    // Update pending payments
    if (payment.status === 'completed') {
      state.payments.pending = state.payments.pending.filter(id => id !== payment.id);
    } else if (payment.status === 'pending' && !state.payments.pending.includes(payment.id)) {
      state.payments.pending.push(payment.id);
    } else if (payment.status === 'failed') {
      if (!Array.isArray(state.payments.failed)) {
        state.payments.failed = [];
      }
      if (!state.payments.failed.includes(payment.id)) {
        state.payments.failed.push(payment.id);
      }
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;
  },

  // Enhanced pending payments management
  SET_PENDING_PAYMENTS(state, pendingIds) {
    const timestamp = Date.now();

    // ✅ BULLETPROOF: Ensure pendingIds is always an array
    const validPendingIds = Array.isArray(pendingIds) ?
      pendingIds.filter(id => id && typeof id === 'string') : [];

    state.payments.pending = validPendingIds;
    state.payments.lastCheck = timestamp;
    state.system.lastUpdate = timestamp;

    triggerGlobalEvent('pendingPaymentsUpdated', {
      pendingIds: validPendingIds,
      timestamp
    });
  },

  // Enhanced usage management
  SET_USAGE(state, usageData) {
    const timestamp = Date.now();

    if (!usageData || typeof usageData !== 'object') {
      console.warn('⚠️ Invalid usage data provided');
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    state.usage.current = {
      messages: Math.max(0, parseInt(usageData.messages) || 0),
      images: Math.max(0, parseInt(usageData.images) || 0),
      lastUpdated: new Date().toISOString(),
      resetDate: usageData.resetDate || null,
      ...usageData
    };

    // Update monthly stats
    if (state.usage.monthlyStats.currentMonth !== currentMonth) {
      state.usage.monthlyStats = {
        currentMonth,
        totalMessages: state.usage.current.messages,
        totalImages: state.usage.current.images
      };
    }

    // Update cache
    state.cache.usageCache = { ...state.usage.current };
    state.cache.lastCacheUpdate = timestamp;

    state.system.lastUpdate = timestamp;

    triggerGlobalEvent('usageUpdated', {
      usage: { ...state.usage.current },
      limits: getCurrentLimits(state),
      timestamp
    });
  },

  // Enhanced usage increment with validation
  INCREMENT_USAGE(state, { messages = 0, images = 0 }) {
    const timestamp = Date.now();

    // ✅ BULLETPROOF: Ensure usage object exists
    if (!state.usage.current || typeof state.usage.current !== 'object') {
      state.usage.current = { messages: 0, images: 0, lastUpdated: null };
    }

    const oldUsage = { ...state.usage.current };

    // Validate and increment
    const messageIncrement = Math.max(0, parseInt(messages) || 0);
    const imageIncrement = Math.max(0, parseInt(images) || 0);

    state.usage.current.messages = Math.max(0, (state.usage.current.messages || 0) + messageIncrement);
    state.usage.current.images = Math.max(0, (state.usage.current.images || 0) + imageIncrement);
    state.usage.current.lastUpdated = new Date().toISOString();

    // Update monthly stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!state.usage.monthlyStats.currentMonth) {
      state.usage.monthlyStats.currentMonth = currentMonth;
    }

    if (state.usage.monthlyStats.currentMonth === currentMonth) {
      state.usage.monthlyStats.totalMessages += messageIncrement;
      state.usage.monthlyStats.totalImages += imageIncrement;
    }

    state.system.lastUpdate = timestamp;

    // Only log if there was actual usage
    if (messageIncrement > 0 || imageIncrement > 0) {
      triggerGlobalEvent('usageIncremented', {
        oldUsage,
        newUsage: { ...state.usage.current },
        increment: { messages: messageIncrement, images: imageIncrement },
        limits: getCurrentLimits(state),
        timestamp
      });
    }
  },

  // Enhanced feature management
  UPDATE_FEATURES(state, features = {}) {
    const timestamp = Date.now();

    if (Object.keys(features).length > 0) {
      // Update specific features
      const oldFeatures = { ...state.features };
      state.features = { ...state.features, ...features };


      triggerGlobalEvent('featuresUpdated', {
        oldFeatures,
        newFeatures: { ...state.features },
        changedFeatures: features,
        userStatus: state.userStatus,
        timestamp
      });
    } else {
      // Update all features based on current status
      updateFeatureMatrix(state);
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;
  },
  
  // Usage reset for new month
  RESET_USAGE(state) {
    const timestamp = Date.now();
    const currentMonth = new Date().toISOString().slice(0, 7);


    state.usage.current = {
      messages: 0,
      images: 0,
      lastUpdated: new Date().toISOString(),
      resetDate: new Date().toISOString()
    };

    state.usage.monthlyStats = {
      currentMonth,
      totalMessages: 0,
      totalImages: 0
    };

    state.system.lastUpdate = timestamp;

    triggerGlobalEvent('usageReset', {
      month: currentMonth,
      timestamp
    });
  },
  
  // Set usage limits for specific plan
  SET_USAGE_LIMITS(state, limits) {
    if (!limits || typeof limits !== 'object') {
      return;
    }

    state.usage.limits = { ...state.usage.limits, ...limits };
    state.system.lastUpdate = Date.now();

  },
};

// ✅ ENHANCED ACTIONS WITH COMPREHENSIVE ERROR HANDLING
const actions = {
  // 🚀 COMPLETE USER SYNC ACTION
  async syncUserData({ commit, state }, { forceSync = false } = {}) {
    console.log('🔄 Starting complete user data sync...');

    try {
      commit('SET_LOADING', true);
      // Simulate API call to fetch user data from server
      // This is where you would call your backend API to get the latest user data
      const api = await import('@/api'); // Assuming you have an API module
      const userId = state.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated, cannot sync');
      }

      const serverUserData = await api.fetchUserData(userId);

      // Compare local and server data to find conflicts
      const pendingChanges = state.syncStatus.pendingChanges;
      let hasConflicts = false;

      if (pendingChanges.length > 0 && !forceSync) {
        // Simple conflict check: if local changes exist, and server data is different
        // A real-world app would have more robust conflict resolution logic
        if (JSON.stringify(serverUserData.preferences) !== JSON.stringify(state.preferences)) {
          hasConflicts = true;
          // Here you would implement conflict resolution, e.g.,
          // - "Last write wins" (server data overwrites local)
          // - "First write wins" (local data overwrites server)
          // - Merge data intelligently
        }
      }

      if (hasConflicts) {
        commit('SET_SYNC_STATUS', { conflictResolution: 'merge' });
        // Assuming a merge strategy for this example
        const mergedPreferences = { ...serverUserData.preferences, ...state.preferences };
        commit('UPDATE_PREFERENCES', mergedPreferences);
      } else {
        // No conflicts or force sync, so update local state with server data
        commit('SET_USER', serverUserData);
        commit('CLEAR_PENDING_CHANGES');
      }

      commit('SET_SYNC_STATUS', { lastSync: new Date().toISOString(), syncInProgress: false });
      console.log('✅ User data synced successfully');
      return { success: true, user: state.currentUser, message: 'Sync successful' };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
      commit('SET_SYNC_STATUS', { syncInProgress: false });
      return {
        success: false,
        error: error.message,
        message: 'Sync failed - data may be out of date'
      };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Enhanced login with immediate sync
  async loginUser({ commit, dispatch }, { userData, token }) {
    console.log('🔐 Logging in user with server sync...');

    try {
      commit('SET_LOADING', true);
      // First, set basic user data
      commit('SET_USER', userData);
      // Immediately sync with server to get complete data
      const syncResult = await dispatch('syncUserData', { forceSync: true });
      if (syncResult.success) {
        console.log('✅ User login and sync completed');
        return {
          success: true,
          user: syncResult.user,
          message: 'Login successful, data synchronized'
        };
      } else {
        console.warn('⚠️ Login successful but sync failed');
        return {
          success: true,
          user: userData,
          warning: 'Login successful but data sync failed',
          syncError: syncResult.error
        };
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      commit('SET_ERROR', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Apply promocode with server sync
  async applyPromocode({ commit, dispatch }, { promoCode, plan }) {
    console.log('🎟️ Applying promocode with server sync...');

    try {
      commit('SET_LOADING', true);
      const api = await import('@/api');
      const response = await api.applyPromocode(promoCode, plan);
      if (response.success) {
        // Update local subscription immediately
        commit('UPDATE_SUBSCRIPTION', {
          plan: plan,
          status: 'active',
          source: 'promocode',
          startDate: new Date().toISOString(),
          expiryDate: response.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          details: {
            promocode: promoCode,
            appliedAt: new Date().toISOString()
          },
          lastSync: new Date().toISOString()
        });
        // Sync with server to ensure consistency
        await dispatch('syncUserData');
        console.log('✅ Promocode applied and synced');
        return {
          success: true,
          message: response.message || `Promocode applied! ${plan.toUpperCase()} plan activated.`,
          plan: plan
        };
      } else {
        throw new Error(response.error || 'Failed to apply promocode');
      }
    } catch (error) {
      console.error('❌ Promocode application failed:', error);
      commit('SET_ERROR', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Add to study list with server sync
  async addToStudyList({ commit, dispatch }, courseData) {
    console.log('📚 Adding course to study list with server sync...');

    try {
      // Add to local state immediately for responsiveness
      commit('ADD_TO_STUDY_LIST', courseData);
      // Sync with server
      const syncResult = await dispatch('syncUserData');
      if (syncResult.success) {
        console.log('✅ Course added to study list and synced');
        return {
          success: true,
          message: 'Course added to your study list'
        };
      } else {
        console.warn('⚠️ Course added locally but sync failed');
        return {
          success: true,
          warning: 'Course added but sync failed - will sync when connection improves'
        };
      }
    } catch (error) {
      console.error('❌ Failed to add course to study list:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Remove from study list with server sync
  async removeFromStudyList({ commit, dispatch }, topicId) {
    console.log('🗑️ Removing course from study list with server sync...');

    try {
      // Remove from local state immediately
      commit('REMOVE_FROM_STUDY_LIST', topicId);
      // Sync with server
      const syncResult = await dispatch('syncUserData');
      if (syncResult.success) {
        console.log('✅ Course removed from study list and synced');
        return {
          success: true,
          message: 'Course removed from your study list'
        };
      } else {
        console.warn('⚠️ Course removed locally but sync failed');
        return {
          success: true,
          warning: 'Course removed but sync failed - will sync when connection improves'
        };
      }
    } catch (error) {
      console.error('❌ Failed to remove course from study list:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update lesson progress with server sync
  async updateLessonProgress({ commit, dispatch }, progressData) {
    console.log('📈 Updating lesson progress with server sync...');

    try {
      // Update local state immediately
      commit('UPDATE_LESSON_PROGRESS', progressData);
      // Also update study list progress if applicable
      if (progressData.topicId && progressData.progressPercent) {
        commit('UPDATE_STUDY_LIST_PROGRESS', {
          topicId: progressData.topicId,
          progress: progressData.progressPercent
        });
      }
      // Sync with server (debounced to avoid too many requests)
      if (!this.progressSyncTimeout) {
        this.progressSyncTimeout = setTimeout(async () => {
          await dispatch('syncUserData');
          this.progressSyncTimeout = null;
        }, 2000); // Sync after 2 seconds of no new progress updates
      }
      return {
        success: true,
        message: 'Progress updated'
      };
    } catch (error) {
      console.error('❌ Failed to update lesson progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update preferences with server sync
  async updatePreferences({ commit, dispatch }, preferences) {
    console.log('⚙️ Updating preferences with server sync...');

    try {
      // Update local state immediately
      commit('UPDATE_PREFERENCES', preferences);
      // Sync with server
      const syncResult = await dispatch('syncUserData');
      if (syncResult.success) {
        console.log('✅ Preferences updated and synced');
        return {
          success: true,
          message: 'Preferences updated'
        };
      } else {
        console.warn('⚠️ Preferences updated locally but sync failed');
        return {
          success: true,
          warning: 'Preferences updated but sync failed - will sync when connection improves'
        };
      }
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Background sync for offline changes
  async syncPendingChanges({ commit, state, dispatch }) {
    if (state.syncStatus.pendingChanges.length === 0) {
      return { success: true, message: 'No pending changes' };
    }
    console.log(`🔄 Syncing ${state.syncStatus.pendingChanges.length} pending changes...`);

    try {
      const syncResult = await dispatch('syncUserData', { forceSync: true });

      if (syncResult.success) {
        console.log('✅ All pending changes synced successfully');
        return {
          success: true,
          syncedChanges: state.syncStatus.pendingChanges.length,
          message: 'All changes synchronized'
        };
      } else {
        throw new Error(syncResult.error);
      }
    } catch (error) {
      console.error('❌ Failed to sync pending changes:', error);
      return {
        success: false,
        error: error.message,
        pendingChanges: state.syncStatus.pendingChanges.length
      };
    }
  },

  // Initialize store with server sync
  async initialize({ commit, dispatch }) {
    console.log('🚀 Initializing user store with server sync...');

    try {
      commit('SET_LOADING', true);
      // Check if user is authenticated
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        commit('SET_USER', userData);
        // Sync with server to get latest data
        await dispatch('syncUserData');
      }
      commit('SET_INITIALIZED', true);
      console.log('✅ User store initialized');
      return { success: true };
    } catch (error) {
      console.error('❌ Store initialization failed:', error);
      commit('SET_ERROR', error.message);
      return { success: false, error: error.message };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Logout with cleanup
  async logout({ commit }) {
    console.log('👋 Logging out user...');

    try {
      // Clear all user data
      commit('SET_USER', null);
      commit('CLEAR_PENDING_CHANGES');
      commit('SET_SYNC_STATUS', {
        lastSync: null,
        syncInProgress: false,
        pendingChanges: []
      });
      // Clear localStorage
      const keysToRemove = [
        'currentUser', 'userStatus', 'subscriptionData',
        'studyList', 'userProgress', 'userPreferences'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      });
      console.log('✅ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return { success: false, error: error.message };
    }
  }
};


// Assuming handleSuccessfulUserSave and eventBus are defined elsewhere or passed in scope.
// This block is typically outside the store module or in a related utility file.
const handleSuccessfulUserSave = async (result, token, userData) => {
  // In a real app, this would perform actions like setting auth token,
  // dispatching other store actions, etc.
};

const eventBus = {
  emit: (eventName, data) => {
    // In a real app, this would emit events to listeners
  }
};

// This function needs to be aware of the store instance, typically passed as an argument.
const handleFailedUserSave = (store, { userData, token }) => {
  setTimeout(async () => {
    try {
      const retryResult = await store.dispatch('user/saveUser', { userData, token });

      // ✅ CRITICAL: Check for valid result object
      if (retryResult && typeof retryResult === 'object' && retryResult.success === true && retryResult.user) {
        await handleSuccessfulUserSave(retryResult, token, userData);

        eventBus.emit('userLoginRetrySuccess', {
          message: 'Successfully connected after retry',
          timestamp: Date.now()
        });
      } else {
        // Handle undefined or invalid result
        const errorMessage = retryResult?.error || 'Retry failed - invalid or undefined result';
        console.error('❌ Retry failed with result:', retryResult);

        eventBus.emit('userLoginRetryFailed', {
          error: errorMessage,
          finalFailure: true,
          invalidResult: true,
          retryResult: retryResult,
          timestamp: Date.now()
        });
      }
    } catch (retryError) {
      console.error('❌ Retry exception:', retryError);
      eventBus.emit('userLoginRetryFailed', {
        error: retryError.message || 'Retry exception occurred',
        isException: true,
        timestamp: Date.now()
      });
    }
  }, 3000);
};


// ========================================
// 🔧 CRITICAL FIXES FOR USER STORE REACTIVITY
// ========================================

// ADD THIS TO EVERY COMPONENT'S MOUNTED LIFECYCLE:
const setupUniversalStatusListener = function() {

  // Store all cleanup functions
  this.statusEventCleanup = this.statusEventCleanup || [];

  // ✅ METHOD 1: Direct DOM event listener (most reliable)
  const handleStatusChange = (event) => {

    if (this.handleUserStatusChange) {
      this.handleUserStatusChange(event.detail.newStatus, event.detail.oldStatus);
    }

    if (this.triggerReactivityUpdate) {
      this.triggerReactivityUpdate();
    }

    // Force update as last resort
    this.$forceUpdate();
  };

  // Listen to multiple event types
  const eventTypes = [
    'userStatusChanged',
    'userSubscriptionChanged',
    'subscriptionUpdated',
    'forceReactivityUpdate',
    'globalForceUpdate',
    'delayedStatusUpdate',
    'actionStatusUpdate'
  ];

  eventTypes.forEach(eventType => {
    window.addEventListener(eventType, handleStatusChange);
    this.statusEventCleanup.push(() => {
      window.removeEventListener(eventType, handleStatusChange);
    });
  });

  // ✅ METHOD 2: Store subscription (direct)
  if (this.$store) {
    const storeUnsubscribe = this.$store.subscribe((mutation) => {
      const statusMutations = [
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE'
      ];

      if (statusMutations.includes(mutation.type)) {

        if (this.triggerReactivityUpdate) {
          this.triggerReactivityUpdate();
        }

        this.$forceUpdate();
      }
    });

    this.statusEventCleanup.push(storeUnsubscribe);
  }

  // ✅ METHOD 3: Watch store getters directly
  if (this.$store) {
    this.statusWatcher = this.$watch(
      () => this.$store.getters['user/userStatus'],
      (newStatus, oldStatus) => {

        if (this.handleUserStatusChange) {
          this.handleUserStatusChange(newStatus, oldStatus);
        }

        this.$forceUpdate();
      },
      { immediate: true }
    );

    this.statusEventCleanup.push(() => {
      if (this.statusWatcher) {
        this.statusWatcher();
      }
    });
  }

  // ✅ METHOD 4: Periodic status check (fallback)
  this.statusCheckInterval = setInterval(() => {
    const storeStatus = this.$store?.getters?.['user/userStatus'];
    const localStatus = localStorage.getItem('userStatus');

    if (storeStatus && localStatus && storeStatus !== localStatus) {
      handleStatusChange({
        detail: {
          newStatus: storeStatus,
          oldStatus: localStatus,
          source: 'periodic-check'
        }
      });
    }
  }, 5000); // Check every 5 seconds

  this.statusEventCleanup.push(() => {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  });

};

// ADD THIS TO EVERY COMPONENT'S beforeUnmount LIFECYCLE:
const cleanupUniversalStatusListener = function() {

  if (this.statusEventCleanup) {
    this.statusEventCleanup.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('⚠️ Cleanup error:', error);
      }
    });
    this.statusEventCleanup = [];
  }

};

// ✅ ISSUE 5: Force reactivity update function for all components
const universalTriggerReactivityUpdate = function() {
  // Multiple update strategies
  this.componentKey = (this.componentKey || 0) + 1;
  this.lastUpdateTime = Date.now();

  // Force Vue reactivity
  this.$forceUpdate();

  // Additional delayed updates
  this.$nextTick(() => {
    this.$forceUpdate();

    setTimeout(() => {
      this.$forceUpdate();
    }, 50);
  });

};

// ========================================
// 🔧 EXPORT FUNCTIONS FOR USE IN COMPONENTS
// ========================================

export {
  triggerGlobalEvent,
  setupUniversalStatusListener,
  cleanupUniversalStatusListener,
  universalTriggerReactivityUpdate
};


// ✅ ENHANCED GETTER DEFINITIONS WITH COMPREHENSIVE NULL SAFETY
// (The getters were already defined above in this full file)

// ✅ EXPORT ENHANCED STORE MODULE
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};

// ✅ ADDITIONAL UTILITY FUNCTIONS FOR EXTERNAL USE

/**
 * Create a reactive user status composable for Vue 3
 * This can be imported and used in components
 */
export const createUserStatusComposable = (store) => {
  return {
    // Core reactive properties
    userStatus: computed(() => store.getters['user/userStatus']),
    isPremiumUser: computed(() => store.getters['user/isPremiumUser']),
    isProUser: computed(() => store.getters['user/isProUser']),
    isFreeUser: computed(() => store.getters['user/isFreeUser']),

    // Feature access
    features: computed(() => store.getters['user/features']),
    hasFeature: (feature) => computed(() => store.getters['user/hasFeatureAccess'](feature)),

    // Actions
    updateStatus: (newStatus) => store.dispatch('user/updateSubscription', { plan: newStatus }),
    applyPromocode: (promoCode, plan) => store.dispatch('user/applyPromocode', { promoCode, plan }),

    // Loading states
    isLoading: computed(() => store.getters['user/isAnyLoading']),
    isUpdating: computed(() => store.getters['user/isLoading']('status'))
  };
};

/**
 * Mixin for Vue 2 compatibility
 * This provides the same functionality as the composable but for Options API
 */
export const userStatusMixin = {
  computed: {
    userStatus() {
      return this.$store.getters['user/userStatus'];
    },

    isPremiumUser() {
      return this.$store.getters['user/isPremiumUser'];
    },

    isProUser() {
      return this.$store.getters['user/isProUser'];
    },

    isFreeUser() {
      return this.$store.getters['user/isFreeUser'];
    },

    userFeatures() {
      return this.$store.getters['user/features'];
    },

    userStatusLabel() {
      return this.$store.getters['user/userStatusLabel'];
    },

    isUserLoading() {
      return this.$store.getters['user/isAnyLoading'];
    }
  },

  methods: {
    async updateUserStatus(newStatus) {
      return await this.$store.dispatch('user/updateSubscription', { plan: newStatus });
    },

    async applyUserPromocode(promoCode, plan) {
      return await this.$store.dispatch('user/applyPromocode', { promoCode, plan });
    },

    hasUserFeature(feature) {
      return this.$store.getters['user/hasFeatureAccess'](feature);
    },

    forceUserUpdate() {
      return this.$store.dispatch('user/forceUpdate');
    }
  }
};

/**
 * Global event listener setup for automatic reactivity
 * Call this in your main.js or app setup
 */
export const setupUserStoreEvents = (app, store) => {
  if (typeof window === 'undefined') return;

  // Create global event bus if it doesn't exist
  if (!window.eventBus) {
    window.eventBus = {
      events: {},
      emit(event, data) {
        if (this.events[event]) {
          this.events[event].forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.warn(`Event listener error for ${event}:`, error);
            }
          });
        }
      },
      on(event, callback) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(callback);
      },
      off(event, callback) {
        if (this.events[event]) {
          this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
      }
    };
  }

  // Set up automatic store initialization
  const initializeStore = async () => {
    try {
      await store.dispatch('user/initialize');
    } catch (error) {
      console.error('❌ Auto-initialization failed:', error);
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStore);
  } else {
    initializeStore();
  }

  // Set up periodic sync (every 5 minutes)
  const syncInterval = setInterval(async () => {
    if (store.getters['user/isAuthenticated'] && !store.getters['user/isSyncInProgress']) {
      try {
        await store.dispatch('user/syncUserData');
      } catch (error) {
        console.warn('⚠️ Periodic sync failed:', error);
      }
    }
  }, 5 * 60 * 1000);

  // Clean up on app unmount
  if (app && app.config && app.config.globalProperties) {
    app.config.globalProperties.$userStoreSyncInterval = syncInterval;
  }

  // Global error handler for store errors
  window.addEventListener('storeError', (event) => {
    const error = event.detail?.error;
    if (error) {
      console.error('🚨 User store error:', error);
      // You can add your global error handling logic here
      // For example, show a notification, send to error tracking service, etc.
    }
  });


  return () => {
    clearInterval(syncInterval);
  };
};

/**
 * Validation utilities for user data
 */
export const userValidation = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidStatus(status) {
    return ['free', 'start', 'pro', 'premium'].includes(status);
  },

  isValidPromocode(code) {
    return typeof code === 'string' && code.trim().length >= 3;
  },

  validateUserData(userData) {
    const errors = [];

    if (!userData || typeof userData !== 'object') {
      errors.push('User data must be an object');
      return { valid: false, errors };
    }

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.uid && !userData.firebaseId && !userData._id) {
      errors.push('User ID is required');
    }

    if (userData.subscriptionPlan && !this.isValidStatus(userData.subscriptionPlan)) {
      errors.push('Invalid subscription plan');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  startTime: null,

  start(label) {
    this.startTime = performance.now();
    console.time(label);
  },

  end(label) {
    if (this.startTime) {
      const duration = performance.now() - this.startTime;
      console.timeEnd(label);

      if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
      }

      return duration;
    }
    return 0;
  },

  measureAsync(label, asyncFn) {
    return async (...args) => {
      this.start(label);
      try {
        const result = await asyncFn(...args);
        this.end(label);
        return result;
      } catch (error) {
        this.end(label);
        throw error;
      }
    };
  }
};
