// src/store/user.js - ENHANCED BULLETPROOF USER STORE FOR VUE 3

import { checkPaymentStatus } from '@/api/payments';
import { getUserUsage, resetMonthlyUsage } from '@/services/GPTService';
import { updateUserStatusAction } from '@/composables/useUserStatus';
import { syncSubscriptionGlobally, applyPromocodeWithGlobalPersistence, completePaymentWithGlobalPersistence } from '@/api';


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
    }

    // Method 2: From localStorage
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (storedToken && storedToken.length > 20) {
        return storedToken;
      }
    } catch (storageError) {
    }

    // Method 3: From sessionStorage
    try {
      const sessionToken = sessionStorage.getItem('token') || sessionStorage.getItem('authToken');
      if (sessionToken && sessionToken.length > 20) {
        return sessionToken;
      }
    } catch (sessionError) {
    }

    return null;

  } catch (error) {
    return null;
  }
};

// ✅ CENTRALIZED STATE MANAGEMENT WITH ENHANCED STRUCTURE
const state = () => ({
  // Core user data
  currentUser: null,
  userStatus: 'free', // 'free', 'start', 'pro', 'premium'

  // 🔥 FIX 1: Use Vue.observable for guaranteed reactivity in Vue 2 environments.
  // This pattern checks if Vue 2's observable is available and uses it,
  // otherwise it falls back to a plain object for Vue 3 / other environments.
  subscription: (typeof window !== 'undefined' && window.Vue?.observable)
    ? window.Vue.observable({
      plan: 'free',
      status: 'inactive',
      source: null,
      startDate: null,
      expiryDate: null,
      isAutoRenew: false,
      details: {},
      lastSync: null
    })
    : {
      plan: 'free',
      status: 'inactive',
      source: null,
      startDate: null,
      expiryDate: null,
      isAutoRenew: false,
      details: {},
      lastSync: null
    },


  // Enhanced usage tracking
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

  // Enhanced feature access matrix
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

  // ✅ BULLETPROOF: Promocodes tracking - Always arrays
  promocodes: {
    applied: [],
    available: [],
    lastCheck: null,
    validationCache: new Map()
  },

  // ✅ BULLETPROOF: Payment history - Always arrays
  payments: {
    history: [],
    pending: [],
    failed: [],
    lastCheck: null,
    retryQueue: []
  },

  // Enhanced user preferences
  preferences: {
    language: 'ru',
    notifications: true,
    emailUpdates: false,
    autoSave: true,
    soundEffects: true,
    reducedMotion: false
  },

  // 🔥 FIX 1: Use Vue.observable and add reactivityKey for enhanced system state tracking.
  system: (typeof window !== 'undefined' && window.Vue?.observable)
    ? window.Vue.observable({
      initialized: false,
      initializationTime: null,
      lastUpdate: Date.now(),
      forceUpdateCounter: 0,
      reactivityKey: 0, // NEW: For manual reactivity triggers
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
    })
    : {
      initialized: false,
      initializationTime: null,
      lastUpdate: Date.now(),
      forceUpdateCounter: 0,
      reactivityKey: 0, // NEW: For manual reactivity triggers
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


// ✅ ENHANCED MUTATIONS WITH BULLETPROOF SAFETY AND LOGGING
const mutations = {
  // Enhanced user management
  SET_USER(state, user) {
    const timestamp = Date.now();
    const oldUser = state.currentUser;

    state.currentUser = user ? { ...user, lastUpdate: timestamp } : null;
    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    if (user) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('lastUserUpdate', timestamp.toString());

      } catch (storageError) {
        state.system.errors.lastError = 'localStorage write failed';
        state.system.errors.errorCount++;
      }
    }

    // Trigger global events
    triggerGlobalEvent('userUpdated', {
      oldUser: oldUser ? { id: oldUser.firebaseId, email: oldUser.email } : null,
      newUser: user ? { id: user.firebaseId, email: user.email } : null,
      timestamp
    });
  },

  // Enhanced user clearing with comprehensive cleanup
  CLEAR_USER(state) {
    const timestamp = Date.now();


    // Clear core data
    state.currentUser = null;
    state.userStatus = 'free';

    // Reset subscription
    state.subscription = {
      plan: 'free',
      status: 'inactive',
      source: null,
      startDate: null,
      expiryDate: null,
      isAutoRenew: false,
      details: {},
      lastSync: null
    };

    // Reset usage
    state.usage.current = {
      messages: 0,
      images: 0,
      lastUpdated: null,
      resetDate: null
    };
    state.usage.history = [];
    state.usage.monthlyStats = {
      currentMonth: null,
      totalMessages: 0,
      totalImages: 0
    };

    // Reset features
    state.features = Object.keys(state.features).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    // ✅ BULLETPROOF: Ensure arrays are always arrays
    state.promocodes.applied = [];
    state.promocodes.available = [];
    state.promocodes.validationCache.clear();

    state.payments.history = [];
    state.payments.pending = [];
    state.payments.failed = [];
    state.payments.retryQueue = [];

    // Reset system state
    state.system.initialized = false;
    state.system.initializationTime = null;
    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;
    state.system.syncInProgress = false;
    state.system.errors = {
      lastError: null,
      errorCount: 0,
      recoveryAttempts: 0
    };

    // Clear cache
    state.cache = {
      userStatusCache: null,
      usageCache: null,
      lastCacheUpdate: null,
      cacheExpiry: 5 * 60 * 1000
    };

    // Clear localStorage with error handling
    const keysToRemove = [
      'currentUser', 'userStatus', 'subscriptionDetails', 'appliedPromocodes',
      'lastUserUpdate', 'userPreferences', 'usageData', 'paymentHistory'
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
      }
    });

    // Clear dynamic keys
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pendingPayments_') ||
          key.startsWith('lastMonthlyReset_') ||
          key.startsWith('promocodeCache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
    }

    triggerGlobalEvent('userCleared', { timestamp });
  },

  // ✅ CRITICAL FIX: Enhanced SET_USER_STATUS mutation
  SET_USER_STATUS(state, status) {
    const startTime = Date.now();
    const oldStatus = state.userStatus;


    // ✅ CRITICAL: Validate status
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    const newStatus = validStatuses.includes(status) ? status : 'free';

    if (oldStatus === newStatus) {
    }

    // ✅ CRITICAL: Update state with multiple strategies for maximum compatibility
    try {
      // Strategy 1: Use Vue.set for guaranteed reactivity (Vue 2)
      if (window.Vue?.set) {
        window.Vue.set(state, 'userStatus', newStatus);
      } else {
        // Vue 3 or fallback
        state.userStatus = newStatus;
      }

      // Strategy 2: Update subscription object
      if (window.Vue?.set) {
        window.Vue.set(state, 'subscription', {
          ...state.subscription,
          plan: newStatus,
          status: newStatus !== 'free' ? 'active' : 'inactive',
          lastSync: new Date().toISOString()
        });
      } else {
        state.subscription = {
          ...state.subscription,
          plan: newStatus,
          status: newStatus !== 'free' ? 'active' : 'inactive',
          lastSync: new Date().toISOString()
        };
      }

      // Strategy 3: Force reactivity with counters
      state.system.lastUpdate = Date.now();
      state.system.forceUpdateCounter = (state.system.forceUpdateCounter || 0) + 1;
      state.system.reactivityKey = Date.now();

      // Strategy 4: Update cache
      if (window.Vue?.set) {
        window.Vue.set(state.cache, 'userStatusCache', newStatus);
        window.Vue.set(state.cache, 'lastCacheUpdate', Date.now());
      } else {
        state.cache.userStatusCache = newStatus;
        state.cache.lastCacheUpdate = Date.now();
      }


    } catch (stateUpdateError) {
    }

    // ✅ CRITICAL: Update feature matrix
    updateFeatureMatrix(state);

    // ✅ CRITICAL: Update localStorage IMMEDIATELY with ALL variations
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('plan', newStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
      localStorage.setItem('mutationTime', Date.now().toString());

    } catch (storageError) {
    }

    // ✅ CRITICAL: Enhanced global event broadcasting with multiple triggers
    const eventData = {
      oldStatus,
      newStatus,
      plan: newStatus,
      userStatus: newStatus,
      subscriptionPlan: newStatus,
      timestamp: Date.now(),
      features: { ...state.features },
      subscription: { ...state.subscription },
      forceCounter: state.system.forceUpdateCounter,
      source: 'store-mutation-enhanced',
      duration: Date.now() - startTime
    };

    // ✅ CRITICAL: Trigger MULTIPLE event types for maximum compatibility
    const eventTypes = [
      'userStatusChanged',
      'subscriptionUpdated',
      'userSubscriptionChanged',
      'planChanged',
      'statusUpdated',
      'globalForceUpdate',
      'reactivityUpdate',
      'storeChanged',
      'mutationComplete'
    ];

    eventTypes.forEach(eventType => {
      try {
        triggerGlobalEvent(eventType, { ...eventData, eventType });
      } catch (eventError) {
      }
    });

    // ✅ CRITICAL: Delayed events for stubborn components
    setTimeout(() => {
      triggerGlobalEvent('delayedStatusUpdate', eventData);
      triggerGlobalEvent('forceReactivityUpdate', eventData);
    }, 50);

    // ✅ CRITICAL: Additional delayed event for maximum compatibility
    setTimeout(() => {
      triggerGlobalEvent('finalStatusUpdate', eventData);
    }, 200);

  },

  // Legacy mutation for backward compatibility
  setUserStatus(state, status) {
    mutations.SET_USER_STATUS(state, status);
  },

  // ✅ ENHANCED: Bulletproof promocode management
  ADD_PROMOCODE(state, promocodeData) {
    const timestamp = Date.now();

    // Ensure applied array exists and is an array
    if (!Array.isArray(state.promocodes.applied)) {
      state.promocodes.applied = [];
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

    // Persist to localStorage
    try {
      localStorage.setItem('appliedPromocodes', JSON.stringify(state.promocodes.applied));
      localStorage.setItem('promocodesLastUpdate', timestamp.toString());
    } catch (storageError) {
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;



    triggerGlobalEvent('promocodeApplied', {
      promocode,
      newStatus: promocode.plan,
      oldStatus: promocode.oldPlan
    });
  },

  // ✅ ENHANCED: Bulletproof payment management
  ADD_PAYMENT(state, paymentData) {
    const timestamp = Date.now();

    // Ensure history array exists and is an array
    if (!Array.isArray(state.payments.history)) {
      state.payments.history = [];
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



    triggerGlobalEvent('paymentUpdated', { payment, timestamp });
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

  // Enhanced subscription management
  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    const timestamp = Date.now();

    if (!subscriptionData || typeof subscriptionData !== 'object') {
      return;
    }

    const oldSubscription = { ...state.subscription };

    state.subscription = {
      ...state.subscription,
      ...subscriptionData,
      lastSync: timestamp
    };

    // Auto-update status if plan changed
    if (subscriptionData.plan && subscriptionData.plan !== state.userStatus) {
      mutations.SET_USER_STATUS(state, subscriptionData.plan);
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    // Persist to localStorage
    try {
      localStorage.setItem('subscriptionDetails', JSON.stringify(state.subscription));
      localStorage.setItem('subscriptionLastUpdate', timestamp.toString());
    } catch (storageError) {
    }


    triggerGlobalEvent('subscriptionUpdated', {
      oldSubscription,
      newSubscription: { ...state.subscription },
      timestamp
    });
  },

  // Enhanced usage management
  SET_USAGE(state, usageData) {
    const timestamp = Date.now();

    if (!usageData || typeof usageData !== 'object') {
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
        totalMessages: 0,
        totalImages: 0
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

  // Enhanced loading state management
  SET_LOADING(state, { type, loading }) {
    if (!state.system.loading) {
      state.system.loading = {};
    }

    const wasLoading = state.system.loading[type];
    state.system.loading[type] = Boolean(loading);

    // Log significant loading state changes
    if (wasLoading !== Boolean(loading)) {
    }

    state.system.lastUpdate = Date.now();
  },

  // Enhanced initialization tracking
  SET_INITIALIZED(state, initialized = true) {
    const timestamp = Date.now();
    const wasInitialized = state.system.initialized;

    state.system.initialized = Boolean(initialized);
    state.system.lastUpdate = timestamp;

    if (initialized && !wasInitialized) {
      state.system.initializationTime = timestamp;
      state.system.performance.loadTime = timestamp - (state.system.performance.startTime || timestamp);



      triggerGlobalEvent('storeInitialized', {
        userStatus: state.userStatus,
        features: { ...state.features },
        loadTime: state.system.performance.loadTime,
        timestamp
      });
    } else if (!initialized && wasInitialized) {
      triggerGlobalEvent('storeReset', { timestamp });
    }
  },

  // ✅ CRITICAL FIX: Enhanced FORCE_UPDATE mutation
  FORCE_UPDATE(state) {
    const timestamp = Date.now();
    const oldCounter = state.system.forceUpdateCounter;


    // ✅ Update counters and timestamps
    state.system.forceUpdateCounter = (oldCounter || 0) + 1;
    state.system.lastUpdate = timestamp;
    state.system.reactivityKey = timestamp;

    // ✅ Force update all cached values
    state.cache.userStatusCache = state.userStatus;
    state.cache.lastCacheUpdate = timestamp;


    // ✅ CRITICAL: Trigger multiple force update events
    const eventData = {
      counter: state.system.forceUpdateCounter,
      oldCounter,
      timestamp,
      userStatus: state.userStatus,
      source: 'force-update-mutation'
    };

    const forceEventTypes = [
      'forceUpdate',
      'globalForceUpdate',
      'vueReactivityUpdate',
      'storeForceUpdate',
      'reactivityUpdate'
    ];

    forceEventTypes.forEach(eventType => {
      try {
        triggerGlobalEvent(eventType, { ...eventData, eventType });
      } catch (eventError) {
      }
    });

    // ✅ CRITICAL: Delayed force update
    setTimeout(() => {
      triggerGlobalEvent('delayedForceUpdate', eventData);
    }, 100);
  },

  // Enhanced error tracking
  SET_ERROR(state, error) {
    const timestamp = Date.now();

    // Ensure system object exists
    if (!state.system) {
      state.system = { errors: { lastError: null, errorCount: 0 } };
    }

    // Ensure errors object exists
    if (!state.system.errors) {
      state.system.errors = { lastError: null, errorCount: 0 };
    }

    state.system.errors.lastError = {
      message: error.message || error,
      timestamp,
      stack: error.stack || null,
      context: error.context || null
    };
    state.system.errors.errorCount++;
    state.system.lastUpdate = timestamp;
    triggerGlobalEvent('storeError', {
      error: state.system.errors.lastError,
      totalErrors: state.system.errors.errorCount
    });
  },

  // Enhanced preferences management
  SET_PREFERENCES(state, preferences) {
    const timestamp = Date.now();

    if (!preferences || typeof preferences !== 'object') {
      return;
    }

    const oldPreferences = { ...state.preferences };
    state.preferences = { ...state.preferences, ...preferences };
    state.system.lastUpdate = timestamp;

    // Persist to localStorage
    try {
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    } catch (storageError) {
    }


    triggerGlobalEvent('preferencesUpdated', {
      oldPreferences,
      newPreferences: { ...state.preferences },
      changedPreferences: preferences,
      timestamp
    });
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

  }
};

// ✅ ENHANCED ACTIONS WITH COMPREHENSIVE ERROR HANDLING
// FIXED USER STORE ACTIONS - src/store/user.js actions section

const actions = {
  // ✅ CRITICAL FIX: updateUserStatus action that ALWAYS returns a result
  async updateUserStatus({ commit, state, dispatch }, newStatus) {

    // ✅ CRITICAL: Create result object FIRST - this ensures we ALWAYS return something
    const result = {
      success: false,
      oldStatus: state.userStatus || 'free',
      newStatus: newStatus,
      timestamp: Date.now(),
      duration: 0,
      error: null,
      message: null
    };

    const startTime = Date.now();

    try {
      // Step 1: Validate input
      const validStatuses = ['free', 'start', 'pro', 'premium'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        result.error = 'Invalid status provided';
        result.validStatuses = validStatuses;
        result.duration = Date.now() - startTime;
        return result; // ✅ RETURN RESULT OBJECT
      }

      const oldStatus = state.userStatus || 'free';

      // Step 2: Handle no-change case
      if (oldStatus === newStatus) {

        try {
          commit('FORCE_UPDATE');
        } catch (forceError) {
        }

        result.success = true;
        result.message = 'Status unchanged';
        result.noChange = true;
        result.duration = Date.now() - startTime;

        return result; // ✅ RETURN RESULT OBJECT
      }

      // Step 3: Update store state with error handling

      try {
        commit('SET_USER_STATUS', newStatus);
      } catch (statusError) {
        result.error = 'Failed to update store status: ' + statusError.message;
        result.duration = Date.now() - startTime;
        return result; // ✅ RETURN RESULT OBJECT
      }

      try {
        commit('UPDATE_SUBSCRIPTION', {
          plan: newStatus,
          status: newStatus !== 'free' ? 'active' : 'inactive',
          source: 'status-update',
          lastSync: new Date().toISOString()
        });
      } catch (subscriptionError) {
        // Don't fail the entire operation for this
      }

      try {
        commit('FORCE_UPDATE');
      } catch (forceError) {
        // Don't fail the entire operation for this
      }

      // Step 4: Update localStorage
      try {
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('statusUpdateTime', Date.now().toString());
        localStorage.setItem('plan', newStatus); // Legacy compatibility
      } catch (storageError) {
        // Don't fail the entire operation for this
      }

      // Step 5: Trigger global events
      try {
        const eventData = {
          oldStatus,
          newStatus,
          timestamp: Date.now(),
          source: 'updateUserStatus-action',
          duration: Date.now() - startTime
        };

        // Multiple event triggering methods for maximum compatibility
        if (typeof window !== 'undefined') {
          // Method 1: Global trigger function
          if (window.triggerGlobalEvent && typeof window.triggerGlobalEvent === 'function') {
            window.triggerGlobalEvent('userStatusChanged', eventData);
            window.triggerGlobalEvent('subscriptionUpdated', eventData);
          }

          // Method 2: Event bus
          if (window.eventBus && window.eventBus.emit && typeof window.eventBus.emit === 'function') {
            window.eventBus.emit('userStatusChanged', eventData);
            window.eventBus.emit('subscriptionUpdated', eventData);
          }

          // Method 3: Custom DOM events
          try {
            const customEvent = new CustomEvent('userSubscriptionChanged', {
              detail: eventData,
              bubbles: true,
              cancelable: true
            });
            window.dispatchEvent(customEvent);
          } catch (domEventError) {
          }
        }

      } catch (eventError) {
        // Don't fail the entire operation for this
      }

      // Step 6: Build final success result
      result.success = true;
      result.error = null;
      result.message = `Status updated successfully from ${oldStatus} to ${newStatus}`;
      result.duration = Date.now() - startTime;
      result.eventsTriggered = true;
      result.localStorageUpdated = true;
      result.storeUpdated = true;


      return result; // ✅ RETURN RESULT OBJECT

    } catch (error) {
      // Step 7: Handle any unexpected exceptions
      // Try to commit error to store (don't let this fail the return)
      try {
        commit('SET_ERROR', {
          message: 'Status update failed',
          context: 'updateUserStatus',
          originalError: error.message
        });
      } catch (commitError) {
      }

      // Build error result
      result.success = false;
      result.error = error.message || 'Unknown error occurred during status update';
      result.duration = Date.now() - startTime;
      result.originalError = error.message;
      result.stack = error.stack;

      return result; // ✅ RETURN RESULT OBJECT
    }

    // ✅ SAFETY NET: This should never be reached, but just in case
    result.error = 'Reached end of function without returning';
    result.duration = Date.now() - startTime;
    return result; // ✅ RETURN RESULT OBJECT
  },

  // ✅ ENHANCED: Bulletproof saveUser action with comprehensive error handling
  async saveUser({ commit, dispatch, state }, { userData, token }) {
    const startTime = Date.now();


    // ✅ CRITICAL: Helper functions for consistent result objects
    const createSuccessResult = (user, message = 'User saved successfully') => {
      const result = {
        success: true,
        user: user || null,
        message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
      return result;
    };

    const createErrorResult = (error, details = {}) => {
      const result = {
        success: false,
        error: typeof error === 'string' ? error : (error?.message || 'Unknown error occurred'),
        user: null,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        ...details
      };
      return result;
    };

    // ✅ CRITICAL: Input validation with detailed feedback
    if (!userData || typeof userData !== 'object') {
      const error = 'Missing or invalid user data';
      commit('SET_ERROR', { message: error, context: 'saveUser-validation' });
      return createErrorResult(error, { validationError: true });
    }

    if (!token || typeof token !== 'string' || token.length < 10) {
      const error = 'Missing or invalid authentication token';
      commit('SET_ERROR', { message: error, context: 'saveUser-validation' });
      return createErrorResult(error, { validationError: true });
    }

    try {
      commit('SET_LOADING', { type: 'saving', loading: true });

      // ✅ CRITICAL: Environment validation
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl || typeof baseUrl !== 'string') {
        const error = 'Application configuration error - API base URL not set';
        commit('SET_ERROR', { message: error, context: 'saveUser-config' });
        return createErrorResult(error, { configError: true });
      }


      // ✅ CRITICAL: API module loading with timeout
      let api;
      try {
        const apiLoadPromise = import('@/api');
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API module load timeout')), 5000)
        );

        const apiModule = await Promise.race([apiLoadPromise, timeoutPromise]);
        api = apiModule.default || apiModule;

        if (!api || typeof api.post !== 'function') {
          throw new Error('API module does not have post method');
        }

      } catch (apiImportError) {
        const error = 'Failed to load API module - application error';
        commit('SET_ERROR', { message: error, context: 'saveUser-api-import', originalError: apiImportError.message });
        return createErrorResult(error, { apiImportError: true });
      }

      // ✅ CRITICAL: Payload preparation with validation
      const payload = {
        firebaseUserId: userData.uid || userData.firebaseId || userData.firebaseUserId,
        email: userData.email || '',
        name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'User',
        displayName: userData.displayName || userData.name || '',
        emailVerified: Boolean(userData.emailVerified),
        photoURL: userData.photoURL || null,
        subscriptionPlan: userData.subscriptionPlan || 'free',
        lastLoginAt: new Date().toISOString(),
        createdAt: userData.createdAt || new Date().toISOString(),
        metadata: {
          lastUpdate: new Date().toISOString(),
          source: 'vue-app',
          version: '2.0'
        }
      };

      // ✅ CRITICAL: Validate essential payload fields
      if (!payload.firebaseUserId || !payload.email) {
        const error = 'Missing essential user information (ID or email)';
        commit('SET_ERROR', { message: error, context: 'saveUser-payload-validation' });
        return createErrorResult(error, { payloadValidationError: true });
      }



      // ✅ CRITICAL: API call with comprehensive error handling and timeout
      let response;
      const apiStartTime = Date.now();

      try {
        const requestConfig = {
          timeout: 15000,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Request-ID': `save_user_${Date.now()}`,
            'X-App-Version': '2.0'
          }
        };


        const requestPromise = api.post('/users/save', payload, requestConfig);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 20000)
        );

        response = await Promise.race([requestPromise, timeoutPromise]);

        // Track API response time
        const apiResponseTime = Date.now() - apiStartTime;


      } catch (networkError) {
        // ✅ CRITICAL: Detailed network error handling
        let userFriendlyError = 'Network error occurred';
        let statusCode = null;
        let errorDetails = { isNetworkError: true };

        if (networkError.message === 'Request timeout') {
          userFriendlyError = 'Request timed out. Please check your connection and try again.';
          errorDetails.isTimeout = true;
        } else if (networkError.code === 'ECONNABORTED') {
          userFriendlyError = 'Request timed out. Please check your connection and try again.';
          errorDetails.isTimeout = true;
        } else if (networkError.message === 'Network Error') {
          userFriendlyError = 'Network error. Please check your internet connection.';
          errorDetails.isConnectionError = true;
        } else if (networkError.response) {
          statusCode = networkError.response.status;
          const serverError = networkError.response.data || {};
          errorDetails.statusCode = statusCode;

          switch (statusCode) {
            case 400:
              userFriendlyError = serverError.message || serverError.error || 'Invalid user data provided';
              errorDetails.isBadRequest = true;
              break;
            case 401:
              userFriendlyError = 'Authentication failed. Please log in again.';
              errorDetails.isAuthError = true;
              break;
            case 403:
              userFriendlyError = 'Access denied. Please check your permissions.';
              errorDetails.isAuthError = true;
              break;
            case 404:
              userFriendlyError = 'User service not found. Please contact support.';
              errorDetails.isServiceError = true;
              break;
            case 409:
              userFriendlyError = serverError.message || serverError.error || 'User already exists with different data';
              errorDetails.isConflict = true;
              break;
            case 429:
              userFriendlyError = 'Too many requests. Please wait and try again.';
              errorDetails.isRateLimit = true;
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              userFriendlyError = 'Server error. Please try again later.';
              errorDetails.isServerError = true;
              break;
            default:
              userFriendlyError = serverError.message || serverError.error || `Server error (${statusCode})`;
              errorDetails.isUnknownServerError = true;
          }
        } else {
          userFriendlyError = 'Unable to connect to server. Please try again.';
          errorDetails.isConnectionError = true;
        }

        commit('SET_ERROR', {
          message: userFriendlyError,
          context: 'saveUser-network',
          originalError: networkError.message,
          statusCode
        });

        return createErrorResult(userFriendlyError, errorDetails);
      }

      // ✅ CRITICAL: Response validation
      if (!response || typeof response !== 'object') {
        const error = 'Invalid response from server';
        commit('SET_ERROR', { message: error, context: 'saveUser-response-validation' });
        return createErrorResult(error, { responseValidationError: true });
      }

      const responseData = response.data;
      if (!responseData || typeof responseData !== 'object') {
        const error = 'Empty or invalid response from server';
        commit('SET_ERROR', { message: error, context: 'saveUser-response-data' });
        return createErrorResult(error, { responseDataError: true });
      }


      // ✅ CRITICAL: Handle different response structures
      let savedUser = null;

      if (responseData.success === true) {
        if (responseData.data && typeof responseData.data === 'object') {
          savedUser = responseData.data;
        } else if (responseData.user && typeof responseData.user === 'object') {
          savedUser = responseData.user;
        } else {
          const error = 'Server returned success but no user data';
          commit('SET_ERROR', { message: error, context: 'saveUser-response-structure' });
          return createErrorResult(error, { responseStructureError: true });
        }
      } else if (responseData.user && typeof responseData.user === 'object') {
        savedUser = responseData.user;
      } else if ((responseData._id || responseData.firebaseId || responseData.firebaseUserId) && responseData.email) {
        savedUser = responseData;
      } else if (!responseData.success && !responseData.error && responseData.email) {
        // Handle case where server returns user data directly without success wrapper
        savedUser = responseData;
      } else if (responseData.success === false) {
        const error = responseData.message || responseData.error || 'Server returned failure status';
        commit('SET_ERROR', { message: error, context: 'saveUser-server-failure' });
        return createErrorResult(error, { serverFailure: true, serverResponse: responseData });
      } else {
        const error = 'Server returned unrecognized response format';
        commit('SET_ERROR', { message: error, context: 'saveUser-unknown-response' });
        return createErrorResult(error, { unknownResponseError: true, rawResponse: responseData });
      }

      // ✅ CRITICAL: Validate saved user object
      if (!savedUser || typeof savedUser !== 'object') {
        const error = 'Server returned invalid user data';
        commit('SET_ERROR', { message: error, context: 'saveUser-user-validation' });
        return createErrorResult(error, { userValidationError: true });
      }

      // ✅ CRITICAL: Ensure user has all required fields
      const completeUser = {
        ...savedUser,
        firebaseId: savedUser.firebaseId || savedUser.firebaseUserId || savedUser._id || userData.uid,
        _id: savedUser._id || savedUser.firebaseId || savedUser.firebaseUserId,
        uid: savedUser.uid || savedUser.firebaseId || savedUser.firebaseUserId || userData.uid,
        email: savedUser.email || userData.email,
        name: savedUser.name || userData.displayName || userData.email?.split('@')[0] || 'User',
        displayName: savedUser.displayName || savedUser.name || userData.displayName || '',
        subscriptionPlan: savedUser.subscriptionPlan || 'free',
        lastLoginAt: savedUser.lastLoginAt || new Date().toISOString(),
        updatedAt: savedUser.updatedAt || new Date().toISOString(),
        metadata: {
          ...savedUser.metadata,
          lastSync: new Date().toISOString(),
          syncSource: 'saveUser'
        }
      };

      // ✅ CRITICAL: Final validation of complete user
      if (!completeUser.firebaseId || !completeUser.email) {
        const error = 'Server user data missing essential fields';
        commit('SET_ERROR', { message: error, context: 'saveUser-final-validation' });
        return createErrorResult(error, { finalValidationError: true });
      }



      // ✅ CRITICAL: Update local store with server data
      try {
        commit('SET_USER', completeUser);
        commit('SET_USER_STATUS', completeUser.subscriptionPlan || 'free');

        // Store user ID for future API calls
        const userId = completeUser.firebaseId || completeUser._id;
        if (userId) {
          localStorage.setItem('userId', userId);
          localStorage.setItem('firebaseUserId', userId);
          localStorage.setItem('lastUserSync', Date.now().toString());
        }

      } catch (storeError) {
        commit('SET_ERROR', { message: 'Store update failed', context: 'saveUser-store-update', originalError: storeError.message });
        // Don't fail the entire operation if store update fails
      }

      // ✅ CRITICAL: ALWAYS return success result
      const finalResult = createSuccessResult(completeUser, 'User saved and synchronized successfully');
      return finalResult;

    } catch (error) {
      // ✅ CRITICAL: Comprehensive error categorization
      let userFriendlyError = 'An unexpected error occurred while saving user data.';
      let errorCategory = 'unexpected';

      if (error.message?.includes('API module')) {
        userFriendlyError = 'Application configuration error. Please refresh the page.';
        errorCategory = 'config';
      } else if (error.message?.includes('environment')) {
        userFriendlyError = 'Application not properly configured. Please contact support.';
        errorCategory = 'config';
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        userFriendlyError = 'Network connection failed. Please check your internet connection.';
        errorCategory = 'network';
      } else if (error.message?.includes('timeout')) {
        userFriendlyError = 'Request timed out. Please try again.';
        errorCategory = 'timeout';
      } else if (error.message?.includes('JSON')) {
        userFriendlyError = 'Server returned invalid response. Please try again.';
        errorCategory = 'parsing';
      }

      commit('SET_ERROR', {
        message: userFriendlyError,
        context: 'saveUser-unexpected',
        originalError: error.message,
        stack: error.stack,
        category: errorCategory
      });

      // ✅ CRITICAL: ALWAYS return error result
      const finalResult = createErrorResult(userFriendlyError, {
        isUnexpectedError: true,
        originalError: error.message,
        category: errorCategory
      });
      return finalResult;

    } finally {
      // ✅ CRITICAL: Always clear loading state
      try {
        commit('SET_LOADING', { type: 'saving', loading: false });
      } catch (loadingError) {
      }
    }
  },

  // ✅ ENHANCED: Other actions remain the same but with better error handling
  async loadUserStatus({ commit, state }) {
    const startTime = Date.now();

    try {
      commit('SET_LOADING', { type: 'status', loading: true });

      const userId = getUserId(state);
      if (!userId) {
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: 'No user ID', defaulted: true };
      }


      const { getUserStatus } = await import('@/api');
      const result = await getUserStatus(userId);

      if (result?.success) {
        const status = result.status || result.data?.subscriptionPlan || 'free';

        commit('SET_USER_STATUS', status);

        if (result.data?.subscriptionDetails) {
          commit('UPDATE_SUBSCRIPTION', {
            ...result.data.subscriptionDetails,
            plan: status,
            status: status !== 'free' ? 'active' : 'inactive',
            lastSync: new Date().toISOString()
          });
        }

        const duration = Date.now() - startTime;

        return { success: true, status, duration };
      } else {
        commit('SET_USER_STATUS', 'free');
        commit('SET_ERROR', {
          message: 'Failed to load user status',
          context: 'loadUserStatus',
          originalError: result?.error
        });
        return { success: false, error: result?.error || 'Unknown error', defaulted: true };
      }

    } catch (error) {
      commit('SET_USER_STATUS', 'free');
      commit('SET_ERROR', {
        message: 'User status loading failed',
        context: 'loadUserStatus',
        originalError: error.message
      });
      return { success: false, error: error.message, defaulted: true };

    } finally {
      commit('SET_LOADING', { type: 'status', loading: false });
    }
  },

  // ✅ CRITICAL: updateSubscription that ALWAYS returns a result
  async updateSubscription({ commit, dispatch, state }, { plan, source = 'payment', details = {} }) {
    const startTime = Date.now();


    try {
      // Validate plan
      const validPlans = ['free', 'start', 'pro', 'premium'];
      const validatedPlan = validPlans.includes(plan) ? plan : 'free';

      if (plan !== validatedPlan) {
      }

      // Get old status for comparison
      const oldStatus = state.userStatus || 'free';

      // Calculate expiry dates based on source
      let expiryDate = null;
      if (validatedPlan !== 'free') {
        const now = new Date();
        switch (source) {
          case 'promocode':
            expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            break;
          case 'payment':
            expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
            break;
          case 'gift':
            expiryDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
            break;
          default:
            expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
        }
      }

      const subscriptionData = {
        plan: validatedPlan,
        status: (validatedPlan !== 'free') ? 'active' : 'inactive',
        startDate: new Date().toISOString(),
        expiryDate: expiryDate ? expiryDate.toISOString() : null,
        isAutoRenew: source === 'payment',
        details: {
          ...details,
          updatedAt: new Date().toISOString(),
          updatedBy: 'updateSubscription'
        },
        lastSync: new Date().toISOString()
      };


      // ✅ CRITICAL: Update all related state atomically with error handling
      try {
        commit('SET_USER_STATUS', validatedPlan);
      } catch (statusError) {
        return {
          success: false,
          error: 'Failed to update user status',
          originalError: statusError.message,
          duration: Date.now() - startTime
        };
      }

      try {
        commit('UPDATE_SUBSCRIPTION', subscriptionData);
      } catch (subscriptionError) {
        return {
          success: false,
          error: 'Failed to update subscription',
          originalError: subscriptionError.message,
          duration: Date.now() - startTime
        };
      }

      try {
        commit('UPDATE_FEATURES'); // Recalculate features based on new plan
      } catch (featuresError) {
        // Don't fail for features update
      }

      try {
        commit('FORCE_UPDATE');
      } catch (forceError) {
        // Don't fail for force update
      }


      // ✅ CRITICAL: Persistent storage (don't let this fail the whole operation)
      try {
        localStorage.setItem('userStatus', validatedPlan);
        localStorage.setItem('subscriptionDetails', JSON.stringify(subscriptionData));
        localStorage.setItem('lastSubscriptionUpdate', Date.now().toString());
      } catch (storageError) {
        // Don't fail the operation due to storage issues
      }

      // ✅ CRITICAL: Enhanced global event broadcasting
      const eventData = {
        oldStatus,
        newStatus: validatedPlan,
        source,
        subscriptionData: { ...subscriptionData },
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      // Multiple event types for different listeners
      const events = [
        'userStatusChanged',
        'subscriptionUpdated',
        'userSubscriptionChanged', // Legacy compatibility
        'planChanged'
      ];

      events.forEach(eventName => {
        try {
          if (typeof window !== 'undefined') {
            // Method 1: triggerGlobalEvent function
            if (window.triggerGlobalEvent) {
              window.triggerGlobalEvent(eventName, eventData);
            }

            // Method 2: eventBus
            if (window.eventBus?.emit) {
              window.eventBus.emit(eventName, eventData);
            }

            // Method 3: DOM events
            const customEvent = new CustomEvent(eventName, {
              detail: eventData,
              bubbles: true
            });
            window.dispatchEvent(customEvent);
          }
        } catch (eventError) {
        }
      });


      const duration = Date.now() - startTime;
      const successResult = {
        success: true,
        subscriptionData: { ...subscriptionData },
        oldStatus,
        newStatus: validatedPlan,
        duration,
        message: `Subscription updated successfully from ${oldStatus} to ${validatedPlan}`,
        timestamp: Date.now()
      };


      // ✅ CRITICAL: ALWAYS return the success result
      return successResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      try {
        commit('SET_ERROR', {
          message: 'Subscription update failed',
          context: 'updateSubscription',
          originalError: error.message,
          plan,
          source
        });
      } catch (commitError) {
      }

      const errorResult = {
        success: false,
        error: error.message || 'Subscription update failed',
        duration,
        plan,
        source,
        timestamp: Date.now(),
        stack: error.stack
      };


      // ✅ CRITICAL: ALWAYS return the error result
      return errorResult;
    }
  },

  // ✅ ENHANCED: Apply promocode with comprehensive validation and error handling
  async applyPromocode({ commit, state, dispatch }, { promoCode, plan }) {
    const startTime = Date.now();

    try {
      // Input validation
      if (!promoCode || typeof promoCode !== 'string' || promoCode.trim().length < 3) {
        return { success: false, error: 'Промокод должен содержать не менее 3 символов' };
      }

      if (!plan || !['start', 'pro', 'premium'].includes(plan)) {
        return { success: false, error: 'Неверный план подписки' };
      }

      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'Пользователь не найден' };
      }

      const normalizedCode = promoCode.trim().toUpperCase();

      // Check if already applied
      const existingPromocode = state.promocodes.applied.find(p => p.code === normalizedCode);
      if (existingPromocode) {
        return {
          success: false,
          error: 'Этот промокод уже был применён',
          alreadyApplied: true
        };
      }


      const token = await getUserToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';
      if (!baseUrl) {
        commit('SET_ERROR', { message: 'API configuration error', context: 'applyPromocode' });
        return { success: false, error: 'Ошибка конфигурации приложения' };
      }

      // Use the correct application endpoint
      const response = await Promise.race([
        fetch(`${baseUrl}/api/promocodes/apply`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            code: normalizedCode // Backend expects 'code'
          })
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);

      // Handle HTTP errors with specific messages
      if (!response.ok) {
        const httpErrorMessages = {
          400: 'Неверный формат промокода',
          401: 'Необходимо войти в систему',
          403: 'Промокод недоступен или уже использован',
          404: 'Промокод не найден',
          409: 'Промокод уже был применён',
          410: 'Срок действия промокода истёк',
          422: 'Промокод нельзя применить к вашему аккаунту',
          429: 'Слишком много запросов. Попробуйте позже.',
          500: 'Ошибка сервера. Попробуйте позже.',
          502: 'Сервер временно недоступен. Попробуйте позже.',
          503: 'Сервис временно недоступен. Попробуйте позже.'
        };

        // Try to get error message from response body
        let serverMessage = null;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody?.message || errorBody?.error;
        } catch {
          // Response body is not JSON, use HTTP status message
        }

        const httpError = serverMessage || httpErrorMessages[response.status] || `Ошибка сервера (${response.status})`;

        commit('SET_ERROR', {
          message: httpError,
          context: 'applyPromocode-http',
          statusCode: response.status,
          promocode: normalizedCode
        });

        return { success: false, error: httpError, statusCode: response.status };
      }

      // Safely parse JSON response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const parseErrorMsg = 'Ошибка обработки ответа сервера';
        commit('SET_ERROR', {
          message: parseErrorMsg,
          context: 'applyPromocode-parse',
          originalError: parseError.message
        });
        return { success: false, error: parseErrorMsg };
      }

      if (result?.success) {
        const oldStatus = state.userStatus;
        const newPlan = result.promocode?.grantsPlan || result.user?.subscriptionPlan || plan;

        // ✅ CRITICAL: Fetch updated user status from server (server-authoritative)
        // The backend's grantSubscription() already updated MongoDB and Firebase
        const serverStatusResult = await dispatch('loadUserStatus');

        if (serverStatusResult?.success) {
          // Use server-authoritative data
          const serverPlan = serverStatusResult.status || newPlan;

          // Track promocode application
          commit('ADD_PROMOCODE', {
            code: normalizedCode,
            plan: serverPlan,
            oldPlan: oldStatus,
            source: 'api',
            details: result.data || result.user || {}
          });

          // Force global update
          commit('FORCE_UPDATE');

          const duration = Date.now() - startTime;

          return {
            success: true,
            message: result.message || `Промокод успешно применён! Подписка "${serverPlan.toUpperCase()}" активирована.`,
            oldPlan: oldStatus,
            newPlan: serverPlan,
            duration,
            serverSync: true,
            expiryDate: result.user?.subscriptionEndDate || result.user?.subscriptionExpiryDate
          };
        }

        // Fallback: Server sync failed but promo was applied - update locally
        const updateResult = await dispatch('updateSubscription', {
          plan: newPlan,
          source: 'promocode',
          details: {
            promocode: normalizedCode,
            appliedAt: new Date().toISOString(),
            expiryDate: result.user?.subscriptionEndDate || result.user?.subscriptionExpiryDate,
            ...result.data?.subscriptionDetails
          }
        });

        commit('ADD_PROMOCODE', {
          code: normalizedCode,
          plan: newPlan,
          oldPlan: oldStatus,
          source: 'api',
          details: result.data || {}
        });

        commit('FORCE_UPDATE');

        const duration = Date.now() - startTime;

        return {
          success: true,
          message: result.message || `Промокод успешно применён! Подписка "${newPlan.toUpperCase()}" активирована.`,
          oldPlan: oldStatus,
          newPlan: newPlan,
          duration,
          serverSync: false,
          updateResult
        };
      }

      // Handle server errors
      const serverError = result?.message || result?.error || 'Не удалось применить промокод';

      commit('SET_ERROR', {
        message: serverError,
        context: 'applyPromocode-server',
        promocode: normalizedCode,
        plan
      });

      return { success: false, error: serverError };

    } catch (error) {
      // Handle network and other errors (HTTP errors already handled above)
      let userFriendlyError;

      if (error.message === 'Request timeout') {
        userFriendlyError = 'Истекло время ожидания. Попробуйте снова.';
      } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        userFriendlyError = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        userFriendlyError = 'Ошибка сети. Проверьте интернет-соединение.';
      } else {
        // Log unexpected errors for debugging
        console.error('🎟️ Unexpected promo code error:', error);
        userFriendlyError = 'Не удалось применить промокод. Попробуйте позже.';
      }

      commit('SET_ERROR', {
        message: userFriendlyError,
        context: 'applyPromocode-exception',
        originalError: error.message
      });

      return {
        success: false,
        error: userFriendlyError,
        technical: error.message
      };
    }
  },

  // ✅ ENHANCED: Validate promocode
  async validatePromocode({ state, commit }, promoCode) {
    console.log('🎟️ [Store] validatePromocode called with:', promoCode);
    try {
      if (!promoCode || typeof promoCode !== 'string' || promoCode.trim().length < 3) {
        return { valid: false, error: 'Промокод должен содержать не менее 3 символов' };
      }

      const normalizedCode = promoCode.trim().toUpperCase();

      // Check cache first (handle both Map and Object)
      const cache = state.promocodes?.validationCache;
      if (cache) {
        const cached = cache instanceof Map ? cache.get(normalizedCode) : cache[normalizedCode];
        if (cached) {
          const age = Date.now() - cached.timestamp;
          if (age < 300000) { // 5 minutes cache
            console.log('🎟️ [Store] Returning cached result');
            return cached.result;
          }
        }
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';
      console.log('🎟️ [Store] Calling API:', `${baseUrl}/api/promocodes/validate/${normalizedCode}`);

      const response = await Promise.race([
        fetch(`${baseUrl}/api/promocodes/validate/${normalizedCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), 10000)
        )
      ]);

      console.log('🎟️ [Store] Response status:', response.status);

      // Handle HTTP errors
      if (!response.ok) {
        const httpErrorMessages = {
          400: 'Неверный формат промокода',
          404: 'Промокод не найден',
          410: 'Срок действия промокода истёк',
          429: 'Слишком много запросов. Попробуйте позже.',
          500: 'Ошибка сервера при проверке промокода'
        };

        // Try to get error message from response body
        let serverMessage = null;
        try {
          const errorBody = await response.json();
          serverMessage = errorBody?.message || errorBody?.error;
        } catch {
          // Response body is not JSON
        }

        const errorMsg = serverMessage || httpErrorMessages[response.status] || `Ошибка проверки (${response.status})`;
        return { valid: false, error: errorMsg, message: errorMsg };
      }

      // Safely parse JSON response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        return { valid: false, error: 'Ошибка обработки ответа сервера', message: 'Ошибка обработки ответа сервера' };
      }

      console.log('🎟️ [Store] API response:', JSON.stringify(result, null, 2));

      // Check if promo code is valid: either explicit valid flag, or success with data
      const isValid = result?.valid === true || (result?.success === true && result?.data);

      const validationResult = {
        valid: isValid,
        data: result?.data || null,
        error: isValid ? null : (result?.error || result?.message || null),
        message: isValid
          ? `Промокод действителен! Предоставляет: ${result?.data?.grantsPlan?.toUpperCase()} план`
          : result?.error || result?.message || 'Промокод недействителен'
      };

      console.log('🎟️ [Store] Validation result:', validationResult);

      // Cache the result (handle both Map and Object)
      if (state.promocodes) {
        if (!state.promocodes.validationCache) {
          state.promocodes.validationCache = {};
        }
        if (state.promocodes.validationCache instanceof Map) {
          state.promocodes.validationCache.set(normalizedCode, {
            result: validationResult,
            timestamp: Date.now()
          });
          // Limit cache size
          if (state.promocodes.validationCache.size > 50) {
            const firstKey = state.promocodes.validationCache.keys().next().value;
            state.promocodes.validationCache.delete(firstKey);
          }
        } else {
          state.promocodes.validationCache[normalizedCode] = {
            result: validationResult,
            timestamp: Date.now()
          };
          // Limit cache size
          const keys = Object.keys(state.promocodes.validationCache);
          if (keys.length > 50) {
            delete state.promocodes.validationCache[keys[0]];
          }
        }
      }

      return validationResult;

    } catch (error) {
      console.error('🎟️ [Store] validatePromocode error:', error);
      let userFriendlyError = 'Ошибка проверки промокода';

      if (error.message === 'Validation timeout') {
        userFriendlyError = 'Истекло время ожидания проверки';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        userFriendlyError = 'Ошибка сети. Проверьте подключение к интернету.';
      }

      return {
        valid: false,
        error: userFriendlyError
      };
    }
  },

  // ✅ Keep all other actions from the original file...
  async initialize({ commit, dispatch, state }) {
    const startTime = Date.now();

    if (state.system?.initialized) {
      return { success: true, cached: true };
    }


    try {
      // ✅ CRITICAL: Set basic initialized state first to prevent auth issues
      commit('SET_INITIALIZED', true);

      // Load from localStorage with comprehensive error handling
      const storedDataKeys = {
        user: 'currentUser',
        status: 'userStatus',
        preferences: 'userPreferences',
        subscription: 'subscriptionDetails'
      };

      const storedData = {};

      // Load all stored data with individual error handling
      for (const [key, storageKey] of Object.entries(storedDataKeys)) {
        try {
          const stored = localStorage.getItem(storageKey);
          storedData[key] = stored;
        } catch (storageError) {
          storedData[key] = null;
        }
      }

      // Restore user data with validation
      if (storedData.user) {
        try {
          const userData = JSON.parse(storedData.user);
          if (userData && typeof userData === 'object' && userData.email) {
            commit('SET_USER', userData);
          }
        } catch (parseError) {
          localStorage.removeItem('currentUser');
        }
      }

      // Restore status with validation
      if (storedData.status && typeof storedData.status === 'string') {
        const validStatuses = ['free', 'start', 'pro', 'premium'];
        if (validStatuses.includes(storedData.status)) {
          commit('SET_USER_STATUS', storedData.status);
        }
      }

      // Restore subscription with validation
      if (storedData.subscription) {
        try {
          const subscription = JSON.parse(storedData.subscription);
          if (subscription && typeof subscription === 'object') {
            commit('UPDATE_SUBSCRIPTION', subscription);
          }
        } catch (parseError) {
        }
      }

      const initDuration = Date.now() - startTime;

      return {
        success: true,
        duration: initDuration,
        hasUser: !!state.currentUser,
        userStatus: state.userStatus
      };

    } catch (error) {
      // Even if initialization fails, mark as initialized to prevent infinite loops
      commit('SET_INITIALIZED', false);

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },

  // ✅ ENHANCED: Force update with better event coordination
  async forceUpdate({ commit, state }) {
    try {
      const timestamp = Date.now();
      const oldCounter = state.system.forceUpdateCounter;

      commit('FORCE_UPDATE');
      commit('UPDATE_FEATURES'); // Ensure features are current

      // Additional Vue reactivity triggers
      if (typeof window !== 'undefined') {
        // Multiple event types for maximum compatibility
        const events = [
          'forceUpdate',
          'globalForceUpdate',
          'vueReactivityUpdate',
          'storeForceUpdate'
        ];

        events.forEach(eventName => {
          try {
            if (window.triggerGlobalEvent) {
              window.triggerGlobalEvent(eventName, {
                source: 'forceUpdate-action',
                counter: state.system.forceUpdateCounter,
                oldCounter,
                timestamp
              });
            }
          } catch (eventError) {
          }
        });

        // Try to trigger Vue reactivity if available
        setTimeout(() => {
          if (window.Vue?.nextTick) {
            window.Vue.nextTick(() => {
            });
          }
        }, 10);
      }


      return {
        success: true,
        counter: state.system.forceUpdateCounter,
        oldCounter,
        timestamp
      };

    } catch (error) {
      try {
        commit('SET_ERROR', {
          message: 'Force update failed',
          context: 'forceUpdate',
          originalError: error.message
        });
      } catch (commitError) {
      }

      return { success: false, error: error.message };
    }
  },

  // ✅ Enhanced logout with comprehensive cleanup
  async logout({ commit, state }) {
    const startTime = Date.now();

    try {

      const userId = getUserId(state);

      // Clear all user data from store
      commit('CLEAR_USER');

      // Enhanced localStorage cleanup
      const keysToRemove = [
        'userId', 'firebaseUserId', 'currentUser', 'token',
        'userStatus', 'subscriptionDetails', 'subscriptionExpiry',
        'userPreferences', 'appliedPromocodes', 'usageData',
        'paymentHistory', 'lastUserUpdate', 'lastUserSync',
        'statusUpdateTime', 'promocodesLastUpdate', 'subscriptionLastUpdate'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (storageError) {
        }
      });

      // Clear dynamic user-specific keys
      if (userId) {
        const dynamicKeyPrefixes = [
          'pendingPayments_',
          'lastMonthlyReset_',
          'promocodeCache_',
          'userCache_'
        ];

        try {
          Object.keys(localStorage).forEach(key => {
            if (dynamicKeyPrefixes.some(prefix => key.startsWith(prefix + userId))) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
        }
      }

      // Enhanced global event broadcasting
      const logoutData = {
        userId: userId ? userId.substring(0, 8) + '...' : null,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        source: 'enhanced-logout'
      };

      const logoutEvents = [
        'userLoggedOut',
        'userCleared',
        'sessionEnded',
        'authStatusChanged'
      ];

      logoutEvents.forEach(eventName => {
        try {
          if (window.triggerGlobalEvent) {
            window.triggerGlobalEvent(eventName, logoutData);
          }
        } catch (eventError) {
        }
      });

      const duration = Date.now() - startTime;


      return {
        success: true,
        duration,
        keysCleared: keysToRemove.length,
        userId: userId ? userId.substring(0, 8) + '...' : null
      };

    } catch (error) {
      // Even if logout fails, try to clear critical data
      try {
        commit('CLEAR_USER');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      } catch (emergencyError) {
      }

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },

  // 🌐 NEW: Initialize user with global subscription sync
  async initializeWithGlobalSync({ commit, dispatch, state }, userId) {
    try {
      // Get local subscription
      const localSubscriptionJson = localStorage.getItem('subscriptionData');
      let localSubscription = null;

      if (localSubscriptionJson) {
        try {
          localSubscription = JSON.parse(localSubscriptionJson);
        } catch (error) {
        }
      }

      // Perform global sync
      const syncResult = await syncSubscriptionGlobally(userId, localSubscription);

      if (syncResult.success && syncResult.subscription) {
        // Update store with synced subscription
        commit('SET_USER_STATUS', syncResult.subscription.plan);
        commit('UPDATE_SUBSCRIPTION', syncResult.subscription);


        return {
          success: true,
          subscription: syncResult.subscription,
          syncAction: syncResult.syncAction,
          globalSync: true
        };
      }

      // No valid subscription found, but still a success
      return {
        success: true,
        subscription: null,
        message: 'No subscription to sync'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 🌐 NEW: Apply promocode with global persistence
  async applyPromocodeWithGlobalSync({ commit, dispatch, state }, { promoCode, plan }) {
    try {
      const userId = state.currentUser?.firebaseId || state.currentUser?._id;
      if (!userId) {
        return { success: false, error: 'User not found' };
      }
      // Apply promocode globally
      const result = await applyPromocodeWithGlobalPersistence(userId, promoCode, plan);

      if (result.success) {
        // Update store
        commit('SET_USER_STATUS', plan);
        commit('UPDATE_SUBSCRIPTION', result.subscription);
        commit('ADD_PROMOCODE', {
          code: promoCode,
          plan: plan,
          source: 'global',
          details: result.subscription.details
        });

        return result;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 🌐 NEW: Complete payment with global persistence
  async completePaymentWithGlobalSync({ commit, dispatch, state }, paymentData) {
    try {
      const userId = state.currentUser?.firebaseId || state.currentUser?._id;
      if (!userId) {
        return { success: false, error: 'User not found' };
      }
      // Complete payment globally
      const result = await completePaymentWithGlobalPersistence(userId, paymentData);

      if (result.success) {
        // Update store
        commit('SET_USER_STATUS', paymentData.plan);
        commit('UPDATE_SUBSCRIPTION', result.subscription);
        commit('ADD_PAYMENT', {
          ...paymentData,
          status: 'completed',
          completedAt: new Date().toISOString()
        });

        return result;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * CRITICAL FIX: Enhanced updateUserStatus action with server sync
   */
  async updateUserStatusWithServerSync({ commit, state, dispatch }, { newStatus, source = 'manual' }) {
    try {
      const userId = getUserId(state);
      if (!userId) {
        throw new Error('No user ID available');
      }
      // Import the enhanced API function
      const { updateUserStatusWithPersistence } = await import('@/api');

      // Update with global persistence
      const result = await updateUserStatusWithPersistence(userId, newStatus, source);
      if (result.success) {
        // Update store
        commit('SET_USER_STATUS', newStatus);
        commit('UPDATE_SUBSCRIPTION', result.subscriptionData);
        commit('FORCE_UPDATE');
        // Trigger events
        const eventData = {
          oldStatus: state.userStatus,
          newStatus: newStatus,
          source: source,
          serverSync: result.serverSync,
          timestamp: Date.now()
        };
        // Multiple event triggers for maximum compatibility
        if (typeof window !== 'undefined') {
          window.triggerGlobalEvent('userStatusChanged', eventData);
          window.triggerGlobalEvent('userSubscriptionChanged', eventData);
          window.triggerGlobalEvent('subscriptionUpdated', eventData);
          window.triggerGlobalEvent('globalForceUpdate', {
            reason: 'server-sync-status-update',
            plan: newStatus,
            timestamp: Date.now()
          });
        }
        return {
          success: true,
          newStatus: newStatus,
          serverSync: result.serverSync,
          message: `Status updated to ${newStatus.toUpperCase()} with ${result.serverSync ? 'server sync' : 'local storage only'}`
        };
      } else {
        throw new Error(result.error || 'Status update failed');
      }
    } catch (error) {
      // Fallback: update locally only
      try {
        commit('SET_USER_STATUS', newStatus);
        localStorage.setItem('userStatus', newStatus);

        return {
          success: false,
          error: error.message,
          newStatus: newStatus,
          fallback: true
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message
        };
      }
    }
  },

  /**
   * CRITICAL FIX: Enhanced applyPromocode action with global persistence
   */
  async applyPromocodeWithGlobalSync({ commit, dispatch, state }, { promoCode, plan }) {
    try {
      const userId = getUserId(state);
      if (!userId) {
        throw new Error('No user ID available');
      }
      // Import the enhanced API function
      const { applyPromocodeWithGlobalPersistence } = await import('@/api');

      // Apply with global persistence
      const result = await applyPromocodeWithGlobalPersistence(userId, promoCode, plan);
      if (result.success) {
        // Update store
        await dispatch('updateUserStatusWithServerSync', {
          newStatus: plan,
          source: 'promocode'
        });
        // Track promocode
        commit('ADD_PROMOCODE', {
          code: promoCode.toUpperCase(),
          plan: plan,
          source: 'global-sync',
          details: result.serverResponse
        });
        return result;
      } else {
        throw new Error(result.error || 'Promocode application failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // ✅ CRITICAL FIX: loadUserFromServer action
  async loadUserFromServer({ commit, state }) {

    try {
      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'No user ID' };
      }
      const token = await getUserToken();
      if (!token) {
        return { success: false, error: 'No token' };
      }

      // Import the API instance
      const apiModule = await import('@/api');
      const api = apiModule.default || apiModule;

      const { data } = await api.get(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success && data.user) {
        const serverUser = data.user;
        const serverStatus = serverUser.subscriptionPlan || serverUser.userStatus || 'free';

        // Update store
        commit('SET_USER', serverUser);
        commit('SET_USER_STATUS', serverStatus);

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(serverUser));
        localStorage.setItem('userStatus', serverStatus);
        localStorage.setItem('userPlan', serverStatus);
        localStorage.setItem('subscriptionPlan', serverStatus);
        localStorage.setItem('serverStatus', serverStatus);
        localStorage.setItem('lastServerLoad', Date.now().toString());

        // Trigger events
        window.triggerGlobalEvent('userStatusChanged', {
          oldStatus: state.userStatus,
          newStatus: serverStatus,
          source: 'server-load',
          timestamp: Date.now()
        });

        return {
          success: true,
          user: serverUser,
          status: serverStatus
        };
      }
      return { success: false, error: 'Invalid server response' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
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
        eventBus.emit('userLoginRetryFailed', {
          error: errorMessage,
          finalFailure: true,
          invalidResult: true,
          retryResult: retryResult,
          timestamp: Date.now()
        });
      }
    } catch (retryError) {
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
const setupUniversalStatusListener = function () {

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
const cleanupUniversalStatusListener = function () {

  if (this.statusEventCleanup) {
    this.statusEventCleanup.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
      }
    });
    this.statusEventCleanup = [];
  }

};

// ✅ ISSUE 5: Force reactivity update function for all components
const universalTriggerReactivityUpdate = function () {
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


// ✅ CRITICAL FIX 3: Enhanced getters with better caching and null safety
const getters = {
  // ========================================
  // BASIC USER GETTERS WITH NULL SAFETY
  // ========================================

  // ✅ CRITICAL: Enhanced isAuthenticated getter
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

  // ✅ CRITICAL: Enhanced userStatus getter with multiple fallbacks
  userStatus: (state) => {
    // Try multiple sources in priority order
    const sources = [
      state.userStatus,
      state.cache?.userStatusCache,
      state.subscription?.plan,
      state.currentUser?.subscriptionPlan,
      state.currentUser?.userStatus,
      localStorage.getItem('userStatus'),
      localStorage.getItem('subscriptionPlan'),
      localStorage.getItem('userPlan')
    ];

    for (const source of sources) {
      if (source && typeof source === 'string' && ['free', 'start', 'pro', 'premium'].includes(source)) {
        return source;
      }
    }

    return 'free';
  },

  // ✅ CRITICAL: Enhanced subscription getter
  subscription: (state) => {
    const subscription = state.subscription || {};
    const userStatus = getters.userStatus(state);

    return {
      plan: userStatus,
      status: userStatus !== 'free' ? 'active' : 'inactive',
      ...subscription,
      lastAccess: Date.now()
    };
  },

  subscriptionDetails: (state) => state.subscription || {
    plan: 'free',
    status: 'inactive'
  },

  // ========================================
  // STATUS CHECKS WITH ENHANCED LOGIC
  // ========================================

  // ✅ CRITICAL: Enhanced isPremiumUser getter
  isPremiumUser: (state, getters) => {
    const status = getters.userStatus;
    return ['premium', 'start', 'pro'].includes(status);
  },

  isStartUser: (state) => {
    const status = state.userStatus || 'free';
    return ['start', 'pro', 'premium'].includes(status);
  },

  isProUser: (state) => {
    const status = state.userStatus || 'free';
    return ['pro', 'premium'].includes(status);
  },

  isFreeUser: (state) => {
    const status = state.userStatus || 'free';
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
    const userStatus = state.userStatus || 'free';
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

  isSyncInProgress: (state) => Boolean(state.system?.syncInProgress),

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
    return labels[state.userStatus] || labels.free;
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
