// src/store/user.js - ENHANCED BULLETPROOF USER STORE FOR VUE 3

import { checkPaymentStatus } from '@/api/payments';
import { getUserUsage, resetMonthlyUsage } from '@/services/GPTService';

// ✅ CENTRALIZED STATE MANAGEMENT WITH ENHANCED STRUCTURE
const state = () => ({
  // Core user data
  currentUser: null,
  userStatus: 'free', // 'free', 'start', 'pro', 'premium'

  // Subscription management with enhanced tracking
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
    theme: 'light',
    notifications: true,
    emailUpdates: false,
    autoSave: true,
    soundEffects: true,
    reducedMotion: false
  },

  // Enhanced system state with better tracking
  system: {
    initialized: false,
    initializationTime: null,
    lastUpdate: null,
    forceUpdateCounter: 0,
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
        console.log('👤 User set successfully:', {
          id: user.firebaseId || user._id,
          email: user.email,
          plan: user.subscriptionPlan || 'free'
        });
      } catch (storageError) {
        console.warn('⚠️ Failed to store user in localStorage:', storageError);
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

    console.log('🧹 Clearing all user data...');

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
        console.warn(`⚠️ Failed to remove ${key} from localStorage:`, error);
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
      console.warn('⚠️ Failed to clear dynamic localStorage keys:', error);
    }

    console.log('✅ User data cleared completely');
    triggerGlobalEvent('userCleared', { timestamp });
  },

  // Enhanced status management with validation and caching
  SET_USER_STATUS(state, status) {
    const timestamp = Date.now();
    const oldStatus = state.userStatus;

    // ✅ BULLETPROOF: Validate status
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    const newStatus = validStatuses.includes(status) ? status : 'free';

    if (oldStatus === newStatus) {
      console.log('ℹ️ Status unchanged, skipping update');
      return;
    }

    console.log(`🔄 Status changing: ${oldStatus} → ${newStatus}`);

    state.userStatus = newStatus;
    state.subscription.plan = newStatus;
    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    // Update cache
    state.cache.userStatusCache = newStatus;
    state.cache.lastCacheUpdate = timestamp;

    // Update feature access
    updateFeatureMatrix(state);

    // Persist to localStorage with error handling
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('statusUpdateTime', timestamp.toString());
    } catch (storageError) {
      console.warn('⚠️ Failed to persist status to localStorage:', storageError);
      state.system.errors.lastError = 'Status persistence failed';
      state.system.errors.errorCount++;
    }

    console.log(`✅ Status updated successfully: ${oldStatus} → ${newStatus}`);

    // Enhanced global event broadcasting
    const eventData = {
      oldStatus,
      newStatus,
      timestamp,
      features: { ...state.features },
      subscription: { ...state.subscription },
      source: 'store-mutation'
    };

    triggerGlobalEvent('userStatusChanged', eventData);
    triggerGlobalEvent('subscriptionUpdated', eventData);

    // Force Vue reactivity
    setTimeout(() => {
      state.system.forceUpdateCounter++;
      triggerGlobalEvent('forceReactivityUpdate', { timestamp });
    }, 10);
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
      console.log('ℹ️ Updating existing promocode:', promocode.code);
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
      console.warn('⚠️ Failed to persist promocodes:', storageError);
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    console.log('🎟️ Promocode added successfully:', {
      code: promocode.code,
      plan: promocode.plan,
      timestamp: promocode.appliedAt
    });

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
      console.log('ℹ️ Updating existing payment:', payment.id);
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

    console.log('💳 Payment added successfully:', {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      plan: payment.plan
    });

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

    console.log(`📋 Pending payments updated: ${validPendingIds.length} items`);

    triggerGlobalEvent('pendingPaymentsUpdated', {
      pendingIds: validPendingIds,
      timestamp
    });
  },

  // Enhanced subscription management
  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    const timestamp = Date.now();

    if (!subscriptionData || typeof subscriptionData !== 'object') {
      console.warn('⚠️ Invalid subscription data provided');
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
      console.warn('⚠️ Failed to persist subscription:', storageError);
    }

    console.log('📋 Subscription updated:', {
      plan: state.subscription.plan,
      status: state.subscription.status,
      source: state.subscription.source
    });

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

    console.log('📊 Usage updated:', {
      messages: state.usage.current.messages,
      images: state.usage.current.images,
      month: currentMonth
    });

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
      console.log('📈 Usage incremented:', {
        messages: `${oldUsage.messages} → ${state.usage.current.messages} (+${messageIncrement})`,
        images: `${oldUsage.images} → ${state.usage.current.images} (+${imageIncrement})`
      });

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

      console.log('🔧 Features updated manually:', features);

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
      console.log(`⏳ Loading ${type}: ${wasLoading} → ${Boolean(loading)}`);
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

      console.log('✅ User store initialized successfully', {
        loadTime: state.system.performance.loadTime,
        userStatus: state.userStatus,
        hasUser: !!state.currentUser
      });

      triggerGlobalEvent('storeInitialized', {
        userStatus: state.userStatus,
        features: { ...state.features },
        loadTime: state.system.performance.loadTime,
        timestamp
      });
    } else if (!initialized && wasInitialized) {
      console.log('🔄 User store reset to uninitialized state');
      triggerGlobalEvent('storeReset', { timestamp });
    }
  },

  // Enhanced force update with better tracking
  FORCE_UPDATE(state) {
    const timestamp = Date.now();
    const oldCounter = state.system.forceUpdateCounter;

    state.system.forceUpdateCounter++;
    state.system.lastUpdate = timestamp;

    console.log(`🔄 Force update triggered: ${oldCounter} → ${state.system.forceUpdateCounter}`);

    triggerGlobalEvent('forceUpdate', {
      counter: state.system.forceUpdateCounter,
      oldCounter,
      timestamp
    });

    triggerGlobalEvent('globalForceUpdate', {
      source: 'store-mutation',
      counter: state.system.forceUpdateCounter,
      timestamp
    });
  },

  // Enhanced error tracking
  SET_ERROR(state, error) {
    const timestamp = Date.now();

    state.system.errors.lastError = {
      message: error.message || error,
      timestamp,
      stack: error.stack || null,
      context: error.context || null
    };
    state.system.errors.errorCount++;
    state.system.lastUpdate = timestamp;

    console.error('❌ Store error logged:', state.system.errors.lastError);

    triggerGlobalEvent('storeError', {
      error: state.system.errors.lastError,
      totalErrors: state.system.errors.errorCount
    });
  },

  // Enhanced preferences management
  SET_PREFERENCES(state, preferences) {
    const timestamp = Date.now();

    if (!preferences || typeof preferences !== 'object') {
      console.warn('⚠️ Invalid preferences data provided');
      return;
    }

    const oldPreferences = { ...state.preferences };
    state.preferences = { ...state.preferences, ...preferences };
    state.system.lastUpdate = timestamp;

    // Persist to localStorage
    try {
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    } catch (storageError) {
      console.warn('⚠️ Failed to persist preferences:', storageError);
    }

    console.log('⚙️ Preferences updated:', Object.keys(preferences));

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

    console.log('🔄 Resetting usage for new month:', currentMonth);

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

    console.log('📊 Usage limits updated:', limits);
  }
};

// ✅ ENHANCED ACTIONS WITH COMPREHENSIVE ERROR HANDLING
const actions = {
  // ✅ COMPLETELY BULLETPROOFED: saveUser action
  // ✅ COMPLETELY FIXED saveUser action for src/store/user.js
// Replace the existing saveUser action with this bulletproof version:

async saveUser({ commit, dispatch, state }, { userData, token }) {
  const startTime = Date.now();

  console.log('💾 🔥 ENHANCED saveUser starting...', {
    hasUserData: !!userData,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    userEmail: userData?.email || 'unknown'
  });

  // ✅ BULLETPROOF: Always return a result object
  const createSuccessResult = (user, message = 'User saved successfully') => {
    const result = {
      success: true,
      user: user || null,
      message,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
    console.log('✅ createSuccessResult:', result);
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
    console.log('❌ createErrorResult:', result);
    return result;
  };

  // ✅ BULLETPROOF: Input validation with detailed feedback
  if (!userData || typeof userData !== 'object') {
    const error = 'Missing or invalid user data';
    console.error('❌', error, { hasUserData: !!userData, userDataType: typeof userData });
    commit('SET_ERROR', { message: error, context: 'saveUser-validation' });
    return createErrorResult(error, { validationError: true });
  }

  if (!token || typeof token !== 'string' || token.length < 10) {
    const error = 'Missing or invalid authentication token';
    console.error('❌', error, { hasToken: !!token, tokenLength: token?.length || 0 });
    commit('SET_ERROR', { message: error, context: 'saveUser-validation' });
    return createErrorResult(error, { validationError: true });
  }

  try {
    console.log('🔄 Setting loading state and initializing...');
    commit('SET_LOADING', { type: 'saving', loading: true });

    // ✅ BULLETPROOF: Environment validation
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl || typeof baseUrl !== 'string') {
      const error = 'Application configuration error - API base URL not set';
      console.error('❌', error, { hasBaseUrl: !!baseUrl, baseUrlType: typeof baseUrl });
      commit('SET_ERROR', { message: error, context: 'saveUser-config' });
      return createErrorResult(error, { configError: true });
    }

    console.log('📤 Loading API module...');

    // ✅ BULLETPROOF: API module loading with timeout
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

      console.log('✅ API module loaded successfully');
    } catch (apiImportError) {
      const error = 'Failed to load API module - application error';
      console.error('❌', error, apiImportError);
      commit('SET_ERROR', { message: error, context: 'saveUser-api-import', originalError: apiImportError.message });
      return createErrorResult(error, { apiImportError: true });
    }

    // ✅ BULLETPROOF: Payload preparation with validation
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

    // ✅ BULLETPROOF: Validate essential payload fields
    if (!payload.firebaseUserId || !payload.email) {
      const error = 'Missing essential user information (ID or email)';
      console.error('❌', error, {
        hasFirebaseId: !!payload.firebaseUserId,
        hasEmail: !!payload.email,
        userData: Object.keys(userData)
      });
      commit('SET_ERROR', { message: error, context: 'saveUser-payload-validation' });
      return createErrorResult(error, { payloadValidationError: true });
    }

    console.log('📤 Sending user data to server...', {
      url: '/users/save',
      firebaseUserId: payload.firebaseUserId.substring(0, 8) + '...',
      email: payload.email,
      plan: payload.subscriptionPlan
    });

    // ✅ BULLETPROOF: API call with comprehensive error handling and timeout
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

      console.log('📡 Making API request to /users/save...');

      const requestPromise = api.post('/users/save', payload, requestConfig);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 20000)
      );

      response = await Promise.race([requestPromise, timeoutPromise]);

      // Track API response time
      const apiResponseTime = Date.now() - apiStartTime;
      console.log('📥 Server response received:', {
        status: response?.status,
        statusText: response?.statusText,
        responseTime: apiResponseTime + 'ms',
        hasData: !!response?.data
      });

    } catch (networkError) {
      console.error('❌ Network error during user save:', networkError);

      // ✅ BULLETPROOF: Detailed network error handling
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

    // ✅ BULLETPROOF: Response validation
    if (!response || typeof response !== 'object') {
      const error = 'Invalid response from server';
      console.error('❌', error, { hasResponse: !!response, responseType: typeof response });
      commit('SET_ERROR', { message: error, context: 'saveUser-response-validation' });
      return createErrorResult(error, { responseValidationError: true });
    }

    const responseData = response.data;
    if (!responseData || typeof responseData !== 'object') {
      const error = 'Empty or invalid response from server';
      console.error('❌', error, { hasResponseData: !!responseData, responseDataType: typeof responseData });
      commit('SET_ERROR', { message: error, context: 'saveUser-response-data' });
      return createErrorResult(error, { responseDataError: true });
    }

    console.log('📊 Processing server response...', {
      hasSuccess: 'success' in responseData,
      hasData: 'data' in responseData,
      hasUser: 'user' in responseData,
      responseKeys: Object.keys(responseData)
    });

    // ✅ BULLETPROOF: Handle different response structures
    let savedUser = null;

    if (responseData.success === true) {
      if (responseData.data && typeof responseData.data === 'object') {
        savedUser = responseData.data;
        console.log('✅ Using success+data response structure');
      } else if (responseData.user && typeof responseData.user === 'object') {
        savedUser = responseData.user;
        console.log('✅ Using success+user response structure');
      } else {
        const error = 'Server returned success but no user data';
        console.error('❌', error, { responseStructure: Object.keys(responseData) });
        commit('SET_ERROR', { message: error, context: 'saveUser-response-structure' });
        return createErrorResult(error, { responseStructureError: true });
      }
    } else if (responseData.user && typeof responseData.user === 'object') {
      savedUser = responseData.user;
      console.log('✅ Using direct user response structure');
    } else if ((responseData._id || responseData.firebaseId || responseData.firebaseUserId) && responseData.email) {
      savedUser = responseData;
      console.log('✅ Using direct object response structure');
    } else if (responseData.success === false) {
      const error = responseData.message || responseData.error || 'Server returned failure status';
      console.error('❌ Server returned success: false:', error);
      commit('SET_ERROR', { message: error, context: 'saveUser-server-failure' });
      return createErrorResult(error, { serverFailure: true, serverResponse: responseData });
    } else {
      const error = 'Server returned unrecognized response format';
      console.error('❌', error, responseData);
      commit('SET_ERROR', { message: error, context: 'saveUser-unknown-response' });
      return createErrorResult(error, { unknownResponseError: true, rawResponse: responseData });
    }

    // ✅ BULLETPROOF: Validate saved user object
    if (!savedUser || typeof savedUser !== 'object') {
      const error = 'Server returned invalid user data';
      console.error('❌', error, { savedUserType: typeof savedUser, hasSavedUser: !!savedUser });
      commit('SET_ERROR', { message: error, context: 'saveUser-user-validation' });
      return createErrorResult(error, { userValidationError: true });
    }

    // ✅ BULLETPROOF: Ensure user has all required fields
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

    // ✅ BULLETPROOF: Final validation of complete user
    if (!completeUser.firebaseId || !completeUser.email) {
      const error = 'Server user data missing essential fields';
      console.error('❌', error, {
        hasFirebaseId: !!completeUser.firebaseId,
        hasEmail: !!completeUser.email,
        userFields: Object.keys(completeUser)
      });
      commit('SET_ERROR', { message: error, context: 'saveUser-final-validation' });
      return createErrorResult(error, { finalValidationError: true });
    }

    console.log('✅ User saved successfully to server:', {
      id: completeUser._id || completeUser.firebaseId,
      email: completeUser.email,
      plan: completeUser.subscriptionPlan,
      firebaseId: completeUser.firebaseId,
      duration: Date.now() - startTime + 'ms'
    });

    // ✅ BULLETPROOF: Update local store with server data
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

      console.log('✅ Local store updated with server data');
    } catch (storeError) {
      console.error('❌ Failed to update local store:', storeError);
      commit('SET_ERROR', { message: 'Store update failed', context: 'saveUser-store-update', originalError: storeError.message });
      // Don't fail the entire operation if store update fails
    }

    // ✅ CRITICAL: Always return success result
    const finalResult = createSuccessResult(completeUser, 'User saved and synchronized successfully');
    console.log('🎉 saveUser returning success result:', finalResult);
    return finalResult;

  } catch (error) {
    console.error('❌ Unexpected error in saveUser:', error);

    // ✅ BULLETPROOF: Comprehensive error categorization
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

    console.error('❌ Detailed error info:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      category: errorCategory,
      duration: Date.now() - startTime + 'ms'
    });

    // ✅ CRITICAL: Always return error result
    const finalResult = createErrorResult(userFriendlyError, {
      isUnexpectedError: true,
      originalError: error.message,
      category: errorCategory
    });
    console.log('❌ saveUser returning error result:', finalResult);
    return finalResult;

  } finally {
    // ✅ BULLETPROOF: Always clear loading state
    try {
      commit('SET_LOADING', { type: 'saving', loading: false });
      console.log(`⏱️ saveUser completed in ${Date.now() - startTime}ms`);
    } catch (loadingError) {
      console.warn('⚠️ Failed to clear loading state:', loadingError);
    }
  }
},
// ✅ URGENT FIX: Replace your updateUserStatus action with this exact code

async updateUserStatus({ commit, state, dispatch }, newStatus) {
  const startTime = Date.now();
  
  console.log('🚀 DEBUG: updateUserStatus called with:', newStatus);
  
  try {
    // ✅ STEP 1: Validate input
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!validStatuses.includes(newStatus)) {
      console.error('❌ Invalid status provided:', newStatus);
      const errorResult = { success: false, error: 'Invalid status' };
      console.log('❌ DEBUG: Returning error result:', errorResult);
      return errorResult; // ✅ CRITICAL: Return error result
    }
    
    const oldStatus = state.userStatus;
    console.log('🔍 DEBUG: Current status:', oldStatus, '→ New status:', newStatus);
    
    // ✅ STEP 2: Skip if no change
    if (oldStatus === newStatus) {
      console.log('ℹ️ Status unchanged, but forcing global update');
      commit('FORCE_UPDATE');
      
      // Trigger global event
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.emit('userStatusChanged', {
          oldStatus,
          newStatus,
          source: 'updateUserStatus-nochange',
          timestamp: Date.now()
        });
      }
      
      const noChangeResult = { success: true, message: 'Status unchanged', noChange: true };
      console.log('✅ DEBUG: Returning no-change result:', noChangeResult);
      return noChangeResult; // ✅ CRITICAL: Return no-change result
    }
    
    console.log(`🔄 Updating user status: ${oldStatus} → ${newStatus}`);
    
    // ✅ STEP 3: Update store state immediately
    commit('SET_USER_STATUS', newStatus);
    
    // ✅ STEP 4: Update subscription details
    commit('UPDATE_SUBSCRIPTION', {
      plan: newStatus,
      status: newStatus !== 'free' ? 'active' : 'inactive',
      source: 'status-update',
      lastSync: new Date().toISOString()
    });
    
    // ✅ STEP 5: Update features immediately
    commit('UPDATE_FEATURES');
    
    // ✅ STEP 6: Force multiple reactivity triggers
    commit('FORCE_UPDATE');
    
    // ✅ STEP 7: Update localStorage immediately
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
      localStorage.setItem('lastStatusChange', JSON.stringify({
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        source: 'store-action'
      }));
      console.log('✅ localStorage updated successfully');
    } catch (storageError) {
      console.warn('⚠️ Failed to update localStorage:', storageError);
    }
    
    // ✅ STEP 8: Create comprehensive event data
    const eventData = {
      oldStatus,
      newStatus,
      timestamp: Date.now(),
      source: 'store-updateUserStatus',
      features: { ...state.features },
      subscription: { ...state.subscription },
      forceCounter: state.system?.forceUpdateCounter || 0,
      duration: Date.now() - startTime
    };
    
    // ✅ STEP 9: Trigger ALL possible global events immediately
    const eventTypes = [
      'userStatusChanged',
      'subscriptionUpdated', 
      'userSubscriptionChanged',
      'planChanged',
      'statusUpdated',
      'globalForceUpdate',
      'reactivityUpdate'
    ];
    
    // Helper function to trigger global events
    const triggerEvent = (eventName, data) => {
      try {
        // Method 1: Use global triggerGlobalEvent if available
        if (typeof window !== 'undefined' && window.triggerGlobalEvent) {
          window.triggerGlobalEvent(eventName, data);
          return;
        }
        
        // Method 2: Direct DOM event
        if (typeof window !== 'undefined') {
          const event = new CustomEvent(eventName, { detail: data, bubbles: true });
          window.dispatchEvent(event);
        }
        
        // Method 3: Event bus
        if (typeof window !== 'undefined' && window.eventBus) {
          window.eventBus.emit(eventName, data);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to trigger ${eventName}:`, error);
      }
    };
    
    eventTypes.forEach(eventType => {
      triggerEvent(eventType, { ...eventData, eventType });
    });
    
    // ✅ STEP 10: Additional DOM events for maximum compatibility
    try {
      if (typeof window !== 'undefined') {
        // Primary DOM event
        const domEvent = new CustomEvent('userSubscriptionChanged', {
          detail: {
            plan: newStatus,
            source: 'store-action',
            oldPlan: oldStatus,
            timestamp: Date.now()
          },
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(domEvent);
        
        // Secondary DOM event
        const statusEvent = new CustomEvent('userStatusUpdate', {
          detail: eventData,
          bubbles: true
        });
        window.dispatchEvent(statusEvent);
        
        console.log('✅ DOM events dispatched successfully');
      }
    } catch (domError) {
      console.warn('⚠️ DOM event dispatch failed:', domError);
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ User status updated successfully: ${oldStatus} → ${newStatus} (${duration}ms)`);
    
    // ✅ CRITICAL FIX: CREATE AND RETURN the success result
    const successResult = {
      success: true,
      oldStatus,
      newStatus,
      duration,
      eventsTriggered: eventTypes.length,
      message: `Status updated from ${oldStatus} to ${newStatus}`,
      timestamp: Date.now()
    };
    
    console.log('✅ DEBUG: About to return success result:', successResult);
    console.log('✅ DEBUG: successResult.success =', successResult.success);
    console.log('✅ DEBUG: typeof successResult =', typeof successResult);
    
    // 🚨 THE CRITICAL RETURN STATEMENT - THIS WAS MISSING!
    return successResult;
    
  } catch (error) {
    console.error('❌ updateUserStatus failed:', error);
    
    try {
      commit('SET_ERROR', {
        message: 'Status update failed',
        context: 'updateUserStatus',
        originalError: error.message
      });
    } catch (commitError) {
      console.error('❌ Failed to commit error:', commitError);
    }
    
    const errorResult = {
      success: false,
      error: error.message || 'Unknown error occurred',
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
    
    console.log('❌ DEBUG: About to return error result:', errorResult);
    console.log('❌ DEBUG: errorResult.success =', errorResult.success);
    
    // ✅ CRITICAL FIX: RETURN the error result too!
    return errorResult;
  }
},

  // ✅ ENHANCED: Load user status with caching and validation
  async loadUserStatus({ commit, state }) {
    const startTime = Date.now();
  
    try {
      commit('SET_LOADING', { type: 'status', loading: true });
  
      // Check cache first
      const now = Date.now();
      if (state.cache.userStatusCache &&
        state.cache.lastCacheUpdate &&
        (now - state.cache.lastCacheUpdate) < state.cache.cacheExpiry) {
        console.log('✅ Using cached user status:', state.cache.userStatusCache);
        return { success: true, status: state.cache.userStatusCache, cached: true };
      }
  
      const userId = getUserId(state);
      if (!userId) {
        console.warn('⚠️ No user ID found, defaulting to free status');
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: 'No user ID', defaulted: true };
      }
  
      console.log('🔍 Loading user status from server for:', userId.substring(0, 8) + '...');
  
      const { getUserStatus } = await import('@/api');
      const result = await getUserStatus(userId);
  
      if (result?.success) {
        const status = result.status || result.data?.subscriptionPlan || 'free';
  
        commit('SET_USER_STATUS', status);
  
        // Update subscription details if available
        if (result.data?.subscriptionDetails) {
          commit('UPDATE_SUBSCRIPTION', {
            ...result.data.subscriptionDetails,
            plan: status,
            status: status !== 'free' ? 'active' : 'inactive',
            lastSync: new Date().toISOString()
          });
        }
  
        // Update cache
        state.cache.userStatusCache = status;
        state.cache.lastCacheUpdate = now;
  
        const duration = Date.now() - startTime;
        console.log(`✅ User status loaded from server: ${status} (${duration}ms)`);
  
        return { success: true, status, duration };
      } else {
        console.warn('⚠️ Failed to load user status from server:', result?.error);
        commit('SET_USER_STATUS', 'free');
        commit('SET_ERROR', {
          message: 'Failed to load user status',
          context: 'loadUserStatus',
          originalError: result?.error
        });
        return { success: false, error: result?.error || 'Unknown error', defaulted: true };
      }
  
    } catch (error) {
      console.error('❌ Failed to load user status:', error);
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

  // ✅ ENHANCED: Initialize with comprehensive error handling and performance tracking
  async initialize({ commit, dispatch, state }) {
    const startTime = Date.now();
  
    if (state.system?.initialized) {
      console.log('ℹ️ Store already initialized, skipping...');
      return { success: true, cached: true };
    }
  
    console.log('🚀 Initializing user store...');
  
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
          console.warn(`⚠️ Failed to read ${storageKey}:`, storageError);
          storedData[key] = null;
        }
      }
  
      // Restore user data with validation
      if (storedData.user) {
        try {
          const userData = JSON.parse(storedData.user);
          if (userData && typeof userData === 'object' && userData.email) {
            commit('SET_USER', userData);
            console.log('✅ User data restored:', { email: userData.email, id: userData.firebaseId?.substring(0, 8) });
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse stored user data:', parseError);
          localStorage.removeItem('currentUser');
        }
      }
  
      // Restore status with validation
      if (storedData.status && typeof storedData.status === 'string') {
        const validStatuses = ['free', 'start', 'pro', 'premium'];
        if (validStatuses.includes(storedData.status)) {
          commit('SET_USER_STATUS', storedData.status);
          console.log('✅ User status restored:', storedData.status);
        }
      }
  
      // Restore subscription with validation
      if (storedData.subscription) {
        try {
          const subscription = JSON.parse(storedData.subscription);
          if (subscription && typeof subscription === 'object') {
            commit('UPDATE_SUBSCRIPTION', subscription);
            console.log('✅ Subscription data restored');
          }
        } catch (parseError) {
          console.warn('⚠️ Invalid stored subscription:', parseError);
        }
      }
  
      const initDuration = Date.now() - startTime;
      console.log(`✅ Store initialized successfully in ${initDuration}ms`);
  
      return {
        success: true,
        duration: initDuration,
        hasUser: !!state.currentUser,
        userStatus: state.userStatus
      };
  
    } catch (error) {
      console.error('❌ Store initialization failed:', error);
  
      // Even if initialization fails, mark as initialized to prevent infinite loops
      commit('SET_INITIALIZED', false);
  
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },

  // ✅ ENHANCED: Load usage with better caching and error handling
  async loadUsage({ commit, state }) {
    const startTime = Date.now();
  
    try {
      commit('SET_LOADING', { type: 'usage', loading: true });
  
      // Check cache first
      const now = Date.now();
      if (state.cache.usageCache &&
        state.cache.lastCacheUpdate &&
        (now - state.cache.lastCacheUpdate) < state.cache.cacheExpiry) {
        console.log('✅ Using cached usage data');
        return { success: true, usage: state.cache.usageCache, cached: true };
      }
  
      const userId = getUserId(state);
      if (!userId) {
        console.warn('⚠️ No user ID found for usage loading');
        return { success: false, error: 'No user ID' };
      }
  
      console.log('📊 Loading usage data from server...');
  
      const usageInfo = await getUserUsage();
  
      if (usageInfo?.success) {
        commit('SET_USAGE', usageInfo.usage);
  
        // Auto-sync status if different
        if (usageInfo.plan && usageInfo.plan !== state.userStatus) {
          console.log(`🔄 Auto-syncing status from usage: ${state.userStatus} → ${usageInfo.plan}`);
          commit('SET_USER_STATUS', usageInfo.plan);
        }
  
        // Update limits if provided
        if (usageInfo.limits) {
          commit('SET_USAGE_LIMITS', { [usageInfo.plan || state.userStatus]: usageInfo.limits });
        }
  
        const duration = Date.now() - startTime;
        console.log(`✅ Usage data loaded from server (${duration}ms):`, {
          messages: usageInfo.usage?.messages || 0,
          images: usageInfo.usage?.images || 0,
          plan: usageInfo.plan || state.userStatus
        });
  
        return { success: true, usage: usageInfo.usage, duration };
      }
  
      console.warn('⚠️ Failed to load usage from server:', usageInfo?.error);
      commit('SET_ERROR', {
        message: 'Usage loading failed',
        context: 'loadUsage',
        originalError: usageInfo?.error
      });
  
      return { success: false, error: usageInfo?.error || 'Unknown error' };
  
    } catch (error) {
      console.error('❌ Failed to load usage:', error);
      commit('SET_ERROR', {
        message: 'Usage loading exception',
        context: 'loadUsage',
        originalError: error.message
      });
      return { success: false, error: error.message };
  
    } finally {
      commit('SET_LOADING', { type: 'usage', loading: false });
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
  
      console.log('🎟️ Applying promocode to server:', { code: normalizedCode, plan, userId: userId.substring(0, 8) + '...' });
  
      const token = await getUserToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
  
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        commit('SET_ERROR', { message: 'API configuration error', context: 'applyPromocode' });
        return { success: false, error: 'Ошибка конфигурации приложения' };
      }
  
      const response = await Promise.race([
        fetch(`${baseUrl}/api/payments/promo-code`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId,
            plan,
            promoCode: normalizedCode
          })
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
  
      const result = await response.json();
  
      if (result?.success) {
        const oldStatus = state.userStatus;
  
        // Update subscription through dedicated action
        await dispatch('updateSubscription', {
          plan,
          source: 'promocode',
          details: {
            promocode: normalizedCode,
            appliedAt: new Date().toISOString(),
            originalResponse: result.data || {},
            ...result.data?.subscriptionDetails
          }
        });
  
        // Track promocode application
        commit('ADD_PROMOCODE', {
          code: normalizedCode,
          plan,
          oldPlan: oldStatus,
          source: 'api',
          details: result.data || {}
        });
  
        // Force global update
        commit('FORCE_UPDATE');
  
        const duration = Date.now() - startTime;
        console.log(`✅ Promocode applied successfully: ${oldStatus} → ${plan} (${duration}ms)`);
  
        return {
          success: true,
          message: result.message || `Промокод успешно применён! Подписка "${plan.toUpperCase()}" активирована.`,
          oldPlan: oldStatus,
          newPlan: plan,
          duration
        };
      }
  
      // Handle server errors
      const serverError = result?.error || 'Не удалось применить промокод';
      console.warn('⚠️ Promocode application failed:', serverError);
  
      commit('SET_ERROR', {
        message: serverError,
        context: 'applyPromocode-server',
        promocode: normalizedCode,
        plan
      });
  
      return { success: false, error: serverError };
  
    } catch (error) {
      console.error('❌ Promocode application failed:', error);
  
      let userFriendlyError = 'Произошла ошибка при применении промокода';
  
      if (error.message === 'Request timeout') {
        userFriendlyError = 'Истекло время ожидания. Попробуйте снова.';
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        userFriendlyError = 'Ошибка сети. Проверьте подключение к интернету.';
      }
  
      // Map HTTP status codes to user-friendly messages
      if (error.status) {
        const errorMessages = {
          400: 'Неверный промокод или данные',
          401: 'Необходимо войти в систему',
          403: 'Промокод недоступен или уже использован',
          404: 'Промокод не найден',
          409: 'Промокод уже был применён',
          429: 'Слишком много запросов. Попробуйте позже.',
          500: 'Ошибка сервера. Попробуйте позже.'
        };
        userFriendlyError = errorMessages[error.status] || userFriendlyError;
      }
  
      commit('SET_ERROR', {
        message: userFriendlyError,
        context: 'applyPromocode-exception',
        originalError: error.message,
        statusCode: error.status
      });
  
      return {
        success: false,
        error: userFriendlyError,
        technical: error.message
      };
    }
  },

  async validatePromocode({ state, commit }, promoCode) {
    try {
      if (!promoCode || typeof promoCode !== 'string' || promoCode.trim().length < 3) {
        return { valid: false, error: 'Промокод должен содержать не менее 3 символов' };
      }
  
      const normalizedCode = promoCode.trim().toUpperCase();
  
      // Check cache first
      if (state.promocodes.validationCache.has(normalizedCode)) {
        const cached = state.promocodes.validationCache.get(normalizedCode);
        const age = Date.now() - cached.timestamp;
        if (age < 300000) { // 5 minutes cache
          console.log('✅ Using cached promocode validation:', normalizedCode);
          return cached.result;
        }
      }
  
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        return { valid: false, error: 'Ошибка конфигурации приложения' };
      }
  
      const response = await Promise.race([
        fetch(`${baseUrl}/api/promocodes/validate/${normalizedCode}`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), 5000)
        )
      ]);
  
      const result = await response.json();
  
      const validationResult = {
        valid: result?.success && result.valid,
        data: result.data || null,
        error: result?.error || null,
        message: result?.success && result.valid
          ? `Промокод действителен! Предоставляет: ${result.data?.grantsPlan?.toUpperCase()} план`
          : result?.error || 'Промокод недействителен'
      };
  
      // Cache the result
      state.promocodes.validationCache.set(normalizedCode, {
        result: validationResult,
        timestamp: Date.now()
      });
  
      // Limit cache size
      if (state.promocodes.validationCache.size > 50) {
        const firstKey = state.promocodes.validationCache.keys().next().value;
        state.promocodes.validationCache.delete(firstKey);
      }
  
      return validationResult;
  
    } catch (error) {
      console.error('❌ Promocode validation failed:', error);
  
      let userFriendlyError = 'Ошибка проверки промокода';
  
      if (error.message === 'Validation timeout') {
        userFriendlyError = 'Истекло время ожидания проверки';
      } else if (error.status) {
        const errorMessages = {
          404: 'Промокод не найден',
          400: 'Неверный формат промокода',
          429: 'Слишком много запросов проверки'
        };
        userFriendlyError = errorMessages[error.status] || userFriendlyError;
      }
  
      return {
        valid: false,
        error: userFriendlyError
      };
    }
  },

  async updateSubscription({ commit, dispatch, state }, { plan, source = 'payment', details = {} }) {
    const startTime = Date.now();
  
    console.log('🔄 updateSubscription called with:', { plan, source, detailsKeys: Object.keys(details) });
  
    try {
      // Validate plan
      const validPlans = ['free', 'start', 'pro', 'premium'];
      const validatedPlan = validPlans.includes(plan) ? plan : 'free';
  
      if (plan !== validatedPlan) {
        console.warn(`⚠️ Invalid plan "${plan}" normalized to "${validatedPlan}"`);
      }
  
      // Get old status for comparison
      const oldStatus = state.userStatus || 'free';
      console.log(`📊 Status change: ${oldStatus} → ${validatedPlan}`);
  
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
        source,
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
  
      console.log('📋 Subscription data prepared:', subscriptionData);
  
      // Update all related state atomically
      commit('SET_USER_STATUS', validatedPlan);
      commit('UPDATE_SUBSCRIPTION', subscriptionData);
      commit('UPDATE_FEATURES'); // Recalculate features based on new plan
      commit('FORCE_UPDATE');
  
      console.log('✅ Store mutations completed');
  
      // Persistent storage (don't let this fail the whole operation)
      try {
        localStorage.setItem('userStatus', validatedPlan);
        localStorage.setItem('subscriptionDetails', JSON.stringify(subscriptionData));
        localStorage.setItem('lastSubscriptionUpdate', Date.now().toString());
        console.log('✅ LocalStorage updated');
      } catch (storageError) {
        console.warn('⚠️ Failed to persist subscription data:', storageError);
        // Don't fail the operation due to storage issues
      }
  
      // Enhanced global event broadcasting
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
          if (typeof window !== 'undefined' && window.eventBus) {
            window.eventBus.emit(eventName, eventData);
          }
        } catch (eventError) {
          console.warn(`⚠️ Failed to trigger ${eventName}:`, eventError);
        }
      });
  
      console.log('✅ Events triggered');
  
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
  
      console.log(`✅ updateSubscription completed successfully in ${duration}ms:`, successResult);
  
      // ✅ CRITICAL: Always return the success result
      return successResult;
  
    } catch (error) {
      const duration = Date.now() - startTime;
  
      console.error('❌ updateSubscription failed:', error);
  
      commit('SET_ERROR', {
        message: 'Subscription update failed',
        context: 'updateSubscription',
        originalError: error.message,
        plan,
        source
      });
  
      const errorResult = {
        success: false,
        error: error.message || 'Subscription update failed',
        duration,
        plan,
        source,
        timestamp: Date.now(),
        stack: error.stack
      };
  
      console.log('❌ updateSubscription returning error result:', errorResult);
  
      // ✅ CRITICAL: Always return the error result
      return errorResult;
    }
  },



  // ✅ NEW: Update user preferences
  async updatePreferences({ commit, state }, preferences) {
    try {
      if (!preferences || typeof preferences !== 'object') {
        return { success: false, error: 'Invalid preferences data' };
      }

      console.log('⚙️ Updating user preferences:', Object.keys(preferences));

      const oldPreferences = { ...state.preferences };

      commit('SET_PREFERENCES', preferences);

      // Optional: Sync with server
      const userId = getUserId(state);
      if (userId) {
        try {
          // This would be implemented based on your API
          // await syncPreferencesToServer(userId, state.preferences);
        } catch (syncError) {
          console.warn('⚠️ Failed to sync preferences to server:', syncError);
        }
      }

      console.log('✅ Preferences updated successfully');

      return {
        success: true,
        oldPreferences,
        newPreferences: { ...state.preferences }
      };

    } catch (error) {
      console.error('❌ Failed to update preferences:', error);

      commit('SET_ERROR', {
        message: 'Preferences update failed',
        context: 'updatePreferences',
        originalError: error.message
      });

      return { success: false, error: error.message };
    }
  },

  // ✅ NEW: Increment usage with validation and limits check
  async incrementUsage({ commit, state, dispatch }, { messages = 0, images = 0 }) {
    try {
      const messageIncrement = Math.max(0, parseInt(messages) || 0);
      const imageIncrement = Math.max(0, parseInt(images) || 0);

      if (messageIncrement === 0 && imageIncrement === 0) {
        return { success: true, message: 'No usage to increment' };
      }

      // Check limits before incrementing
      const currentUsage = state.usage.current || { messages: 0, images: 0 };
      const limits = getCurrentLimits(state);

      const newMessageCount = currentUsage.messages + messageIncrement;
      const newImageCount = currentUsage.images + imageIncrement;

      // Check if increment would exceed limits (for free users)
      const warnings = [];
      if (state.userStatus === 'free') {
        if (limits.messages > 0 && newMessageCount > limits.messages) {
          warnings.push(`Message limit exceeded: ${newMessageCount}/${limits.messages}`);
        }
        if (limits.images > 0 && newImageCount > limits.images) {
          warnings.push(`Image limit exceeded: ${newImageCount}/${limits.images}`);
        }
      }

      // Increment usage
      commit('INCREMENT_USAGE', { messages: messageIncrement, images: imageIncrement });

      // Try to sync with server (non-blocking)
      try {
        // This would typically update usage on the server
        // await syncUsageToServer(getUserId(state), state.usage.current);
      } catch (syncError) {
        console.warn('⚠️ Failed to sync usage to server:', syncError);
      }

      const result = {
        success: true,
        incremented: { messages: messageIncrement, images: imageIncrement },
        newTotals: { ...state.usage.current },
        limits,
        warnings
      };

      if (warnings.length > 0) {
        console.warn('⚠️ Usage warnings:', warnings);
        result.limitWarnings = warnings;
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to increment usage:', error);

      commit('SET_ERROR', {
        message: 'Usage increment failed',
        context: 'incrementUsage',
        originalError: error.message
      });

      return { success: false, error: error.message };
    }
  },

  // ✅ ENHANCED: Check monthly reset with better date handling
  async checkMonthlyReset({ commit, dispatch, state }) {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const userId = getUserId(state);
      const lastResetKey = `lastMonthlyReset_${userId}`;
      const lastReset = localStorage.getItem(lastResetKey);

      console.log('🗓️ Checking monthly usage reset:', { currentMonth, lastReset, hasUserId: !!userId });

      if (!lastReset || lastReset !== currentMonth) {
        console.log('🔄 Monthly reset triggered for month:', currentMonth);

        // Reset local usage
        commit('RESET_USAGE');

        // Update localStorage
        if (userId) {
          localStorage.setItem(lastResetKey, currentMonth);
        }

        // Try backend reset (non-blocking)
        try {
          const resetResult = await resetMonthlyUsage();
          if (resetResult?.success) {
            console.log('✅ Backend monthly reset successful');
          } else {
            console.warn('⚠️ Backend monthly reset failed:', resetResult?.error);
          }
        } catch (resetError) {
          console.warn('⚠️ Backend reset error (non-critical):', resetError.message);
        }

        // Reload fresh usage data
        try {
          await dispatch('loadUsage');
        } catch (loadError) {
          console.warn('⚠️ Failed to reload usage after reset:', loadError);
        }

        // Trigger global event
        triggerGlobalEvent('monthlyUsageReset', {
          month: currentMonth,
          userId,
          timestamp: Date.now()
        });

        return { success: true, reset: true, month: currentMonth };
      }

      return { success: true, reset: false, month: currentMonth };

    } catch (error) {
      console.error('❌ Monthly reset check failed:', error);

      commit('SET_ERROR', {
        message: 'Monthly reset check failed',
        context: 'checkMonthlyReset',
        originalError: error.message
      });

      return { success: false, error: error.message };
    }
  },

  // ✅ ENHANCED: Check pending payments with better error handling and retry logic
  async checkPendingPayments({ commit, state, dispatch }) {
    const startTime = Date.now();

    try {
      commit('SET_LOADING', { type: 'payments', loading: true });

      const userId = getUserId(state);
      if (!userId) {
        console.warn('⚠️ No user ID for pending payments check');
        return { success: false, error: 'No user ID' };
      }

      // Rate limiting - avoid too frequent checks
      const now = Date.now();
      const lastCheck = state.payments.lastCheck;
      const minInterval = 300000; // 5 minutes

      if (lastCheck && (now - lastCheck) < minInterval) {
        const remaining = Math.ceil((minInterval - (now - lastCheck)) / 60000);
        console.log(`ℹ️ Payment check rate limited, ${remaining} minutes remaining`);
        return { success: true, message: `Recently checked, wait ${remaining} minutes`, rateLimited: true };
      }

      console.log('🔍 Checking pending payments on server...');

      // Get pending payment IDs from localStorage
      const pendingStorageKey = `pendingPayments_${userId}`;
      let pendingIds = [];

      try {
        const stored = localStorage.getItem(pendingStorageKey);
        pendingIds = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(pendingIds)) {
          pendingIds = [];
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse pending payments from localStorage:', parseError);
        pendingIds = [];
      }

      console.log(`📋 Found ${pendingIds.length} pending payments to check`);

      if (pendingIds.length === 0) {
        commit('SET_PENDING_PAYMENTS', []);
        return { success: true, message: 'No pending payments', checkedTransactions: 0 };
      }

      let statusChanged = false;
      let completedPayments = 0;
      let failedChecks = 0;
      const completedTransactionIds = [];

      // Check each pending payment
      for (const transactionId of pendingIds) {
        try {
          console.log('🔍 Checking transaction:', transactionId);

          const result = await Promise.race([
            checkPaymentStatus(transactionId, userId),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Payment check timeout')), 10000)
            )
          ]);

          if (result?.success && result.transaction) {
            const transaction = result.transaction;

            // Payment completed successfully
            if (transaction.state === 2) {
              console.log('✅ Payment completed:', transactionId, 'Amount:', transaction.amount);

              // Determine plan based on amount
              let newPlan = 'free';
              if (transaction.amount === 260000) newPlan = 'start'; // 260,000 UZS
              else if (transaction.amount === 455000) newPlan = 'pro'; // 455,000 UZS
              else if (transaction.amount >= 100000) newPlan = 'start'; // Fallback for any significant amount

              // Update subscription if plan changed
              if (newPlan !== 'free' && newPlan !== state.userStatus) {
                const updateResult = await dispatch('updateSubscription', {
                  plan: newPlan,
                  source: 'payment',
                  details: {
                    transactionId,
                    amount: transaction.amount,
                    currency: 'UZS',
                    completedAt: new Date(transaction.perform_time || Date.now()).toISOString()
                  }
                });

                if (updateResult.success) {
                  statusChanged = true;
                  console.log(`🔄 Subscription upgraded: ${state.userStatus} → ${newPlan}`);
                }
              }

              // Add to payment history
              commit('ADD_PAYMENT', {
                id: transactionId,
                amount: transaction.amount,
                currency: 'UZS',
                status: 'completed',
                plan: newPlan,
                method: 'payme',
                timestamp: transaction.perform_time || Date.now(),
                details: {
                  ...transaction,
                  processedAt: new Date().toISOString()
                }
              });

              completedTransactionIds.push(transactionId);
              completedPayments++;

            } else if (transaction.state === -1 || transaction.state === -2) {
              // Payment failed or cancelled
              console.log('❌ Payment failed/cancelled:', transactionId, 'State:', transaction.state);

              commit('ADD_PAYMENT', {
                id: transactionId,
                amount: transaction.amount || 0,
                currency: 'UZS',
                status: transaction.state === -1 ? 'cancelled' : 'failed',
                plan: 'free',
                method: 'payme',
                timestamp: transaction.cancel_time || Date.now(),
                details: {
                  ...transaction,
                  processedAt: new Date().toISOString()
                }
              });

              completedTransactionIds.push(transactionId); // Remove from pending
            }
            // If state is 1 (pending), keep in pending list
          } else {
            console.warn('⚠️ Invalid payment check response for:', transactionId);
            failedChecks++;
          }

        } catch (checkError) {
          console.warn(`⚠️ Failed to check transaction ${transactionId}:`, checkError.message);
          failedChecks++;

          // Don't remove from pending on temporary failures
          if (checkError.message !== 'Payment check timeout') {
            // For persistent errors, consider removing after multiple attempts
            // This would require more sophisticated retry logic
          }
        }
      }

      // Update pending payments list
      const updatedPendingIds = pendingIds.filter(id => !completedTransactionIds.includes(id));

      try {
        localStorage.setItem(pendingStorageKey, JSON.stringify(updatedPendingIds));
      } catch (storageError) {
        console.warn('⚠️ Failed to update pending payments in localStorage:', storageError);
      }

      commit('SET_PENDING_PAYMENTS', updatedPendingIds);

      const duration = Date.now() - startTime;
      const summary = {
        success: true,
        statusChanged,
        checkedTransactions: pendingIds.length,
        completedPayments,
        failedChecks,
        remainingPending: updatedPendingIds.length,
        duration
      };

      console.log(`✅ Pending payments check completed (${duration}ms):`, summary);

      // Trigger global event if status changed
      if (statusChanged) {
        triggerGlobalEvent('paymentStatusChanged', {
          completedPayments,
          newStatus: state.userStatus,
          timestamp: Date.now()
        });
      }

      return summary;

    } catch (error) {
      console.error('❌ Failed to check pending payments:', error);

      commit('SET_ERROR', {
        message: 'Pending payments check failed',
        context: 'checkPendingPayments',
        originalError: error.message
      });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };

    } finally {
      commit('SET_LOADING', { type: 'payments', loading: false });
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
          triggerGlobalEvent(eventName, {
            source: 'forceUpdate-action',
            counter: state.system.forceUpdateCounter,
            oldCounter,
            timestamp
          });
        });

        // Try to trigger Vue reactivity if available
        setTimeout(() => {
          if (window.Vue?.nextTick) {
            window.Vue.nextTick(() => {
              console.log('🔄 Vue nextTick reactivity triggered');
            });
          }
        }, 10);
      }

      console.log(`🔄 Force update completed: ${oldCounter} → ${state.system.forceUpdateCounter}`);

      return {
        success: true,
        counter: state.system.forceUpdateCounter,
        oldCounter,
        timestamp
      };

    } catch (error) {
      console.error('❌ Force update failed:', error);

      commit('SET_ERROR', {
        message: 'Force update failed',
        context: 'forceUpdate',
        originalError: error.message
      });

      return { success: false, error: error.message };
    }
  },

  // ✅ ENHANCED: Logout with comprehensive cleanup
  async logout({ commit, state }) {
    const startTime = Date.now();

    try {
      console.log('👋 Enhanced logout process starting...');

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
          console.warn(`⚠️ Failed to remove ${key} from localStorage:`, storageError);
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
          console.warn('⚠️ Failed to clear dynamic localStorage keys:', error);
        }
      }

      // Clear any remaining user-specific keys
      try {
        Object.keys(localStorage).forEach(key => {
          const userSpecificPatterns = [
            /^pendingPayments_/,
            /^lastMonthlyReset_/,
            /^promocodeCache_/,
            /^userSession_/
          ];

          if (userSpecificPatterns.some(pattern => pattern.test(key))) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('⚠️ Failed to clear pattern-based localStorage keys:', error);
      }

      // Clear any cached data
      if (state.cache) {
        state.cache.userStatusCache = null;
        state.cache.usageCache = null;
        state.cache.lastCacheUpdate = null;
      }

      // Clear validation cache
      if (state.promocodes?.validationCache) {
        state.promocodes.validationCache.clear();
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
        triggerGlobalEvent(eventName, logoutData);
      });

      const duration = Date.now() - startTime;
      console.log(`✅ Enhanced logout completed successfully (${duration}ms)`, {
        clearedUserId: userId ? userId.substring(0, 8) + '...' : 'none',
        keysRemoved: keysToRemove.length
      });

      return {
        success: true,
        duration,
        keysCleared: keysToRemove.length,
        userId: userId ? userId.substring(0, 8) + '...' : null
      };

    } catch (error) {
      console.error('❌ Enhanced logout error:', error);

      // Even if logout fails, try to clear critical data
      try {
        commit('CLEAR_USER');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      } catch (emergencyError) {
        console.error('❌ Emergency cleanup also failed:', emergencyError);
      }

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },

  // ✅ NEW: Sync user data from server
  async syncUserData({ commit, dispatch, state }) {
    const startTime = Date.now();

    try {
      commit('SET_LOADING', { type: 'sync', loading: true });
      state.system.syncInProgress = true;

      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'No user ID for sync' };
      }

      console.log('🔄 Syncing user data from server...');

      // Sync multiple data sources in parallel
      const syncTasks = [
        { name: 'status', task: () => dispatch('loadUserStatus') },
        { name: 'usage', task: () => dispatch('loadUsage') },
        { name: 'payments', task: () => dispatch('checkPendingPayments') },
        { name: 'monthlyReset', task: () => dispatch('checkMonthlyReset') }
      ];

      const results = await Promise.allSettled(
        syncTasks.map(({ name, task }) =>
          task().then(result => ({ name, result }))
        )
      );

      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected');

      const syncSummary = {
        success: successes > 0,
        totalTasks: syncTasks.length,
        successful: successes,
        failed: failures.length,
        duration: Date.now() - startTime
      };

      if (failures.length > 0) {
        console.warn(`⚠️ Sync partially failed: ${successes}/${syncTasks.length} successful`);
        failures.forEach(f => console.warn('  - Sync failure:', f.reason));
      } else {
        console.log(`✅ Full sync completed successfully (${syncSummary.duration}ms)`);
      }

      commit('FORCE_UPDATE');

      triggerGlobalEvent('userDataSynced', {
        ...syncSummary,
        timestamp: Date.now()
      });

      return syncSummary;

    } catch (error) {
      console.error('❌ User data sync failed:', error);

      commit('SET_ERROR', {
        message: 'User data sync failed',
        context: 'syncUserData',
        originalError: error.message
      });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };

    } finally {
      commit('SET_LOADING', { type: 'sync', loading: false });
      state.system.syncInProgress = false;
    }
  },

  // ✅ NEW: Add pending payment for tracking
  async addPendingPayment({ commit, state }, { transactionId, amount, plan }) {
    try {
      if (!transactionId || !amount) {
        return { success: false, error: 'Missing transaction details' };
      }

      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'No user ID' };
      }

      console.log('💳 Adding pending payment:', { transactionId, amount, plan });

      // Add to pending list
      const pendingStorageKey = `pendingPayments_${userId}`;
      let pendingIds = [];

      try {
        const stored = localStorage.getItem(pendingStorageKey);
        pendingIds = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(pendingIds)) {
          pendingIds = [];
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse existing pending payments:', parseError);
        pendingIds = [];
      }

      // Avoid duplicates
      if (!pendingIds.includes(transactionId)) {
        pendingIds.push(transactionId);

        try {
          localStorage.setItem(pendingStorageKey, JSON.stringify(pendingIds));
        } catch (storageError) {
          console.warn('⚠️ Failed to save pending payment:', storageError);
        }
      }

      // Add to payment history as pending
      commit('ADD_PAYMENT', {
        id: transactionId,
        amount,
        currency: 'UZS',
        status: 'pending',
        plan: plan || 'unknown',
        method: 'payme',
        timestamp: Date.now(),
        details: {
          addedAt: new Date().toISOString(),
          source: 'addPendingPayment'
        }
      });

      // Update pending payments in state
      commit('SET_PENDING_PAYMENTS', pendingIds);

      console.log('✅ Pending payment added successfully');

      triggerGlobalEvent('pendingPaymentAdded', {
        transactionId,
        amount,
        plan,
        totalPending: pendingIds.length,
        timestamp: Date.now()
      });

      return { success: true, transactionId, pendingCount: pendingIds.length };

    } catch (error) {
      console.error('❌ Failed to add pending payment:', error);

      commit('SET_ERROR', {
        message: 'Failed to add pending payment',
        context: 'addPendingPayment',
        originalError: error.message
      });

      return { success: false, error: error.message };
    }
  }
};

// ✅ ENHANCED HELPER FUNCTIONS WITH BULLETPROOF SAFETY
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
    console.log(`🔧 Features updated for ${userStatus}:`, Object.entries(newFeatures).filter(([k, v]) => v).map(([k]) => k));
  }

  return featuresChanged;
};

const getCurrentLimits = (state) => {
  const userStatus = state.userStatus || 'free';
  return state.usage?.limits?.[userStatus] || state.usage?.limits?.free || { messages: 50, images: 5 };
};

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

    // Custom DOM event (primary method)
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);

    // Event bus (secondary method)
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
    }

    // Vue event bus (tertiary method)
    if (window.Vue?.$bus?.$emit) {
      window.Vue.$bus.$emit(eventName, enhancedData);
    }

    // Generic global update event
    if (eventName !== 'globalUpdate') {
      const globalEvent = new CustomEvent('globalUpdate', {
        detail: { originalEvent: eventName, data: enhancedData }
      });
      window.dispatchEvent(globalEvent);
    }

  } catch (eventError) {
    console.warn(`⚠️ Failed to trigger global event '${eventName}':`, eventError);
  }
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

  userStatus: (state) => state.userStatus || 'free',

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
    const status = state.userStatus || 'free';
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
      console.log('✅ User store initialized automatically');
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

  console.log('✅ User store events initialized');

  return () => {
    clearInterval(syncInterval);
    console.log('🧹 User store events cleaned up');
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

console.log('✅ Enhanced User Store v2.0 loaded successfully!');
console.log('📚 Available exports:', {
  default: 'Enhanced Vuex store module',
  createUserStatusComposable: 'Vue 3 composable factory',
  userStatusMixin: 'Vue 2 mixin',
  setupUserStoreEvents: 'Global event setup',
  userValidation: 'Validation utilities',
  performanceMonitor: 'Performance monitoring'
});