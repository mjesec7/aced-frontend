// src/main.js - COMPLETE REWRITE WITH ENHANCED SUBSCRIPTION MANAGEMENT
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

import { createI18n } from 'vue-i18n';
import messages from './locales/messages.json';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ============================================================================
// 🚀 ENHANCED EVENT BUS FOR SUBSCRIPTION MANAGEMENT
// ============================================================================

class AdvancedEventBus {
  constructor() {
    this.events = {};
    this.debugMode = import.meta.env.DEV;
    this.subscriptionListeners = new Set();
    this.errorHandlers = new Set();
  }
  
  // ✅ Enhanced emit with error handling and logging
  emit(event, data) {
    if (this.debugMode) {
      console.log(`📡 EventBus: Emitting "${event}"`, data);
    }
    
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ EventBus error in "${event}" handler:`, error);
          this.handleEventError(event, error, data);
        }
      });
    }
    
    // Special handling for subscription events
    if (event.includes('subscription') || event.includes('promocode') || event.includes('payment')) {
      this.notifySubscriptionListeners(event, data);
    }
  }
  
  // ✅ Standard event listener registration
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    if (this.debugMode) {
      console.log(`🔗 EventBus: Registered listener for "${event}"`);
    }
  }
  
  // ✅ Remove event listener
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
  
  // ✅ One-time event listener
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
  
  // ✅ Special subscription listener registry
  onSubscriptionChange(callback) {
    this.subscriptionListeners.add(callback);
    return () => this.subscriptionListeners.delete(callback);
  }
  
  // ✅ Notify all subscription listeners
  notifySubscriptionListeners(event, data) {
    this.subscriptionListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Subscription listener error:', error);
      }
    });
  }
  
  // ✅ Error handler registration
  onError(callback) {
    this.errorHandlers.add(callback);
    return () => this.errorHandlers.delete(callback);
  }
  
  // ✅ Handle event errors
  handleEventError(event, error, data) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(event, error, data);
      } catch (handlerError) {
        console.error('❌ Error handler failed:', handlerError);
      }
    });
  }
  
  // ✅ Clear all events
  clear() {
    this.events = {};
    this.subscriptionListeners.clear();
    this.errorHandlers.clear();
  }
  
  // ✅ Get event statistics
  getStats() {
    const stats = {
      totalEvents: Object.keys(this.events).length,
      totalListeners: Object.values(this.events).reduce((sum, arr) => sum + arr.length, 0),
      subscriptionListeners: this.subscriptionListeners.size,
      errorHandlers: this.errorHandlers.size,
      events: {}
    };
    
    Object.keys(this.events).forEach(event => {
      stats.events[event] = this.events[event].length;
    });
    
    return stats;
  }
}

// Create enhanced global event bus
const eventBus = new AdvancedEventBus();
window.eventBus = eventBus;

// ============================================================================
// 🌐 INTERNATIONALIZATION SETUP
// ============================================================================

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ============================================================================
// 🎯 APPLICATION STATE MANAGEMENT
// ============================================================================

let app;
let isAppMounted = false;
let authInitialized = false;
let storeInitialized = false;

// Track app lifecycle
const appLifecycle = {
  initialized: false,
  mounted: false,
  authReady: false,
  storeReady: false
};

// ============================================================================
// 📊 STORE INITIALIZATION
// ============================================================================

async function initializeStore() {
  try {
    console.log('🏪 Initializing Vuex store...');
    
    // Initialize user store from localStorage
    await store.dispatch('user/initialize');
    
    storeInitialized = true;
    appLifecycle.storeReady = true;
    
    console.log('✅ Vuex store initialized successfully');
    
    // Emit store ready event
    eventBus.emit('storeReady', {
      userStatus: store.getters['user/userStatus'],
      isAuthenticated: store.getters['user/isAuthenticated'],
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Store initialization failed:', error);
    storeInitialized = false;
    
    eventBus.emit('storeInitializationError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🔥 ENHANCED FIREBASE AUTH HANDLER
// ============================================================================

onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    console.log('🔥 Firebase auth state changed:', firebaseUser?.email || 'logged out');
    
    if (firebaseUser) {
      await handleUserLogin(firebaseUser);
    } else {
      await handleUserLogout();
    }
    
    // Mark auth as initialized
    if (!authInitialized) {
      authInitialized = true;
      appLifecycle.authReady = true;
      
      eventBus.emit('authReady', {
        hasUser: !!firebaseUser,
        timestamp: Date.now()
      });
      
      console.log('✅ Firebase auth initialized');
    }
    
  } catch (error) {
    console.error('❌ Critical auth state change error:', error);
    
    eventBus.emit('authCriticalError', {
      error: error.message,
      userEmail: firebaseUser?.email,
      requiresReload: true,
      timestamp: Date.now()
    });
    
    // Force clear all user state on critical errors
    await forceClearUserState();
  }
  
  // Mount app once auth is ready
  if (!isAppMounted && authInitialized && storeInitialized) {
    await mountVueApplication();
  }
});

// ============================================================================
// 👤 USER LOGIN HANDLER
// ============================================================================

async function handleUserLogin(firebaseUser) {
  try {
    console.log('👤 Processing user login for:', firebaseUser.email);
    
    // ✅ Get Firebase ID token
    let token;
    try {
      token = await firebaseUser.getIdToken();
      console.log('🔑 Firebase token obtained');
    } catch (tokenError) {
      console.error('❌ Failed to get Firebase token:', tokenError);
      
      eventBus.emit('userLoginError', {
        error: 'Failed to get authentication token. Please try logging in again.',
        isTokenError: true,
        canRetry: true,
        timestamp: Date.now()
      });
      
      await forceClearUserState();
      return;
    }
    
    // ✅ Prepare user data
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL
    };
    
    console.log('💾 Saving user to server...', { 
      email: userData.email, 
      uid: userData.uid 
    });
    
    // ✅ Save user to server with comprehensive error handling
    let saveResult;
    try {
      saveResult = await store.dispatch('user/saveUser', { userData, token });
    } catch (dispatchError) {
      console.error('❌ Store dispatch error:', dispatchError);
      saveResult = {
        success: false,
        error: dispatchError.message || 'Failed to save user to server',
        isDispatchError: true
      };
    }
    
    // ✅ Validate save result
    if (!saveResult || typeof saveResult !== 'object') {
      saveResult = {
        success: false,
        error: 'Invalid server response',
        originalResult: saveResult
      };
    }
    
    if (!saveResult.hasOwnProperty('success')) {
      saveResult = {
        success: false,
        error: 'Malformed server response',
        originalResult: saveResult
      };
    }
    
    // ✅ Handle successful save
    if (saveResult.success === true) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
      await handleFailedUserSave(saveResult, token, userData);
    }
    
  } catch (error) {
    console.error('❌ User login handler error:', error);
    
    eventBus.emit('userLoginError', {
      error: error.message || 'Login process failed',
      isCritical: true,
      timestamp: Date.now()
    });
    
    await forceClearUserState();
  }
}

// ============================================================================
// ✅ SUCCESSFUL USER SAVE HANDLER
// ============================================================================

async function handleSuccessfulUserSave(result, token, userData) {
  try {
    console.log('✅ User saved to server successfully');
    
    // Validate user data in result
    if (!result.user || typeof result.user !== 'object') {
      console.error('❌ Success response missing user data:', result);
      
      eventBus.emit('userLoginError', {
        error: 'Server saved user but returned invalid data. Please refresh the page.',
        isDataError: true,
        timestamp: Date.now()
      });
      return;
    }
    
    const serverUser = result.user;
    console.log('👤 Server user data:', {
      id: serverUser._id || serverUser.firebaseId,
      email: serverUser.email,
      plan: serverUser.subscriptionPlan || 'free'
    });
    
    // ✅ Update stores with server data
    try {
      // Update main store (legacy compatibility)
      store.commit('setUser', serverUser);
      store.commit('setFirebaseUserId', serverUser.firebaseId || serverUser._id);
      store.commit('setToken', token);
      
      // Ensure user module store is also updated
      store.commit('user/SET_USER', serverUser);
      store.commit('user/SET_AUTHENTICATED', true);
      
      // Update localStorage
      const storageData = {
        user: serverUser,
        firebaseUserId: serverUser.firebaseId || serverUser._id,
        userId: serverUser.firebaseId || serverUser._id,
        token: token,
        userStatus: serverUser.subscriptionPlan || 'free'
      };
      
      Object.entries(storageData).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        } catch (storageError) {
          console.warn(`⚠️ Failed to store ${key}:`, storageError);
        }
      });
      
      console.log('✅ User state updated successfully');
      
    } catch (storeUpdateError) {
      console.error('❌ Failed to update stores:', storeUpdateError);
      // Don't fail login for store update errors, but emit warning
      eventBus.emit('storeUpdateWarning', {
        error: storeUpdateError.message,
        timestamp: Date.now()
      });
    }
    
    // ✅ Emit success events
    const userStatus = store.getters['user/userStatus'] || 'free';
    
    eventBus.emit('userLoggedIn', {
      user: serverUser,
      userStatus: userStatus,
      source: 'server',
      isFirstLogin: !localStorage.getItem('lastLoginTime'),
      timestamp: Date.now()
    });
    
    eventBus.emit('userStatusChanged', {
      oldStatus: null,
      newStatus: userStatus,
      source: 'login',
      timestamp: Date.now()
    });
    
    // Store last login time
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    
    console.log(`🎉 User login completed: ${userData.email} (${userStatus})`);
    
  } catch (error) {
    console.error('❌ Error in successful save handler:', error);
    eventBus.emit('userLoginError', {
      error: 'Failed to complete login process',
      originalError: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// ❌ FAILED USER SAVE HANDLER
// ============================================================================

async function handleFailedUserSave(result, token, userData) {
  const errorMessage = result.error || 'Failed to save user to server';
  console.error('❌ Failed to save user to server:', {
    error: errorMessage,
    statusCode: result.statusCode,
    isDispatchError: result.isDispatchError
  });
  
  // Clear any inconsistent state
  await forceClearUserState();
  
  // Emit detailed error
  eventBus.emit('userLoginError', {
    error: errorMessage,
    isServerError: true,
    canRetry: true,
    statusCode: result.statusCode,
    isDispatchError: result.isDispatchError,
    timestamp: Date.now()
  });
  
  // ✅ AUTO-RETRY for server/network errors
  const shouldRetry = (
    result.statusCode >= 500 || 
    !result.statusCode || 
    result.isDispatchError
  );
  
  if (shouldRetry) {
    console.log('🔄 Will retry user save in 3 seconds...');
    
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying user save...');
        const retryResult = await store.dispatch('user/saveUser', { userData, token });
        
        if (retryResult?.success === true && retryResult.user) {
          console.log('✅ Retry successful');
          await handleSuccessfulUserSave(retryResult, token, userData);
          
          eventBus.emit('userLoginRetrySuccess', {
            message: 'Successfully connected after retry',
            timestamp: Date.now()
          });
        } else {
          console.error('❌ Retry failed:', retryResult);
          eventBus.emit('userLoginRetryFailed', {
            error: retryResult?.error || 'Retry failed',
            finalFailure: true,
            timestamp: Date.now()
          });
        }
      } catch (retryError) {
        console.error('❌ Retry exception:', retryError);
        eventBus.emit('userLoginRetryFailed', {
          error: retryError.message,
          isException: true,
          timestamp: Date.now()
        });
      }
    }, 3000);
  }
}

// ============================================================================
// 👋 USER LOGOUT HANDLER
// ============================================================================

async function handleUserLogout() {
  try {
    console.log('👋 Processing user logout...');
    
    // Clear user data through store actions
    try {
      await store.dispatch('user/logout');
    } catch (logoutError) {
      console.warn('⚠️ Store logout error:', logoutError);
      // Force clear if action fails
      await forceClearUserState();
    }
    
    // Also clear legacy main store
    try {
      store.commit('logout');
    } catch (mainStoreError) {
      console.warn('⚠️ Main store logout warning:', mainStoreError);
    }
    
    // Clear localStorage
    const keysToRemove = [
      'user', 'firebaseUserId', 'userId', 'token', 
      'userStatus', 'lastLoginTime', 'subscriptionDetails'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (storageError) {
        console.warn(`⚠️ Failed to remove ${key}:`, storageError);
      }
    });
    
    console.log('✅ User logout completed');
    
    // Emit logout events
    eventBus.emit('userLoggedOut', {
      timestamp: Date.now()
    });
    
    eventBus.emit('userStatusChanged', {
      oldStatus: store.getters['user/userStatus'],
      newStatus: 'free',
      source: 'logout',
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Force clear on any logout error
    await forceClearUserState();
    
    eventBus.emit('logoutError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🧹 FORCE CLEAR USER STATE
// ============================================================================

async function forceClearUserState() {
  console.log('🧹 Force clearing all user state...');
  
  try {
    // Clear user store
    store.commit('user/CLEAR_USER');
  } catch (error) {
    console.warn('⚠️ Failed to clear user store:', error);
  }
  
  try {
    // Clear main store
    store.commit('logout');
  } catch (error) {
    console.warn('⚠️ Failed to clear main store:', error);
  }
  
  // Force clear localStorage
  const keysToRemove = [
    'user', 'firebaseUserId', 'userId', 'token', 
    'userStatus', 'lastLoginTime', 'subscriptionDetails'
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`⚠️ Failed to remove ${key}:`, error);
    }
  });
  
  console.log('✅ Force clear completed');
}

// ============================================================================
// 🎯 VUE APPLICATION MOUNTING
// ============================================================================

async function mountVueApplication() {
  try {
    console.log('🎯 Mounting Vue application...');
    
    app = createApp(App);
    
    // ✅ Add global properties
    app.config.globalProperties.$eventBus = eventBus;
    app.config.globalProperties.$userStore = store;
    app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
    app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
    
    // ✅ Install plugins
    app.use(store);
    app.use(router);
    app.use(VueToast, {
      position: 'top-center',
      duration: 4000,
      dismissible: true
    });
    app.use(i18n);
    
    // ✅ Enhanced global error handler
    app.config.errorHandler = (error, instance, info) => {
      console.error('❌ Vue error:', error);
      console.error('📍 Component:', instance?.$options?.name || 'Unknown');
      console.error('ℹ️ Info:', info);
      
      // Handle specific length errors
      if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
        console.error('🔍 Length property error detected');
        
        eventBus.emit('lengthPropertyError', {
          error: error.message,
          component: instance?.$options?.name || 'Unknown',
          info,
          timestamp: Date.now()
        });
        
        // Try to recover
        try {
          store.commit('user/FORCE_UPDATE');
          console.log('🔄 Attempted store refresh for length error');
        } catch (refreshError) {
          console.error('❌ Store refresh failed:', refreshError);
        }
      }
      
      // Emit global error
      eventBus.emit('vueError', {
        error: error.message,
        component: instance?.$options?.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
    };
    
    // ✅ Mount the application
    app.mount('#app');
    isAppMounted = true;
    appLifecycle.mounted = true;
    
    console.log('✅ Vue application mounted successfully');
    
    // ✅ Setup global subscription management
    setupGlobalSubscriptionManagement();
    
    // ✅ Emit app ready event
    eventBus.emit('appReady', {
      userAuthenticated: !!store.getters['user/isAuthenticated'],
      userStatus: store.getters['user/userStatus'],
      timestamp: Date.now()
    });
    
    // ✅ Mark app as fully initialized
    appLifecycle.initialized = true;
    
  } catch (error) {
    console.error('❌ Failed to mount Vue app:', error);
    
    eventBus.emit('appMountError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🌐 GLOBAL SUBSCRIPTION MANAGEMENT SYSTEM
// ============================================================================

function setupGlobalSubscriptionManagement() {
  console.log('🌐 Setting up global subscription management...');
  
  // ✅ Global subscription change handler
  const handleGlobalSubscriptionChange = (event) => {
    console.log('📡 Global subscription change detected:', event.detail);
    
    const { plan, source, oldPlan, timestamp } = event.detail;
    
    // ✅ Update page title
    const planLabel = plan === 'pro' ? 'Pro' : plan === 'start' ? 'Start' : 'Free';
    if (document.title && !document.title.includes('|')) {
      document.title = `ACED | ${planLabel}`;
    }
    
    // ✅ Update body classes for CSS styling
    document.body.className = document.body.className.replace(/user-plan-\w+/g, '');
    document.body.classList.add(`user-plan-${plan}`);
    
    // ✅ Update localStorage immediately
    localStorage.setItem('userStatus', plan);
    
    // ✅ Force Vue app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        console.log('🔄 Forced Vue app update');
      } catch (error) {
        console.warn('⚠️ Failed to force Vue update:', error);
      }
    }
    
    // ✅ Emit to all components via event bus
    eventBus.emit('globalForceUpdate', {
      reason: 'subscription-change',
      plan: plan,
      source: source,
      oldPlan: oldPlan,
      timestamp: timestamp || Date.now()
    });
    
    // ✅ Show celebration for upgrades
    if (plan !== 'free' && oldPlan === 'free') {
      const sourceText = source === 'promocode' ? 'промокоду' : 'оплате';
      console.log(`🎉 Subscription upgraded to ${planLabel} via ${sourceText}!`);
      
      eventBus.emit('subscriptionUpgrade', {
        plan: plan,
        source: source,
        message: `Поздравляем! ${planLabel} подписка активирована по ${sourceText}!`,
        timestamp: Date.now()
      });
    }
  };
  
  // ✅ Register global DOM event listener
  window.addEventListener('userSubscriptionChanged', handleGlobalSubscriptionChange);
  
  // ✅ Store reference for cleanup
  if (!window.globalEventHandlers) {
    window.globalEventHandlers = {
      subscriptionHandlers: [],
      statusHandlers: []
    };
  }
  window.globalEventHandlers.subscriptionHandlers.push(handleGlobalSubscriptionChange);
  
  // ✅ Enhanced event bus subscription listeners
  eventBus.on('userStatusChanged', (data) => {
    console.log('👤 User status changed via event bus:', data);
    
    // Sync with localStorage
    if (data.newStatus) {
      localStorage.setItem('userStatus', data.newStatus);
    }
    
    // Force app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
        console.warn('⚠️ Failed to force update on status change:', error);
      }
    }
  });
  
  eventBus.on('promocodeApplied', (data) => {
    console.log('🎟️ Promocode applied:', data);
    
    // Create DOM event for global propagation
    const domEvent = new CustomEvent('userSubscriptionChanged', {
      detail: {
        plan: data.newStatus,
        source: 'promocode',
        oldPlan: data.oldStatus,
        promocode: data.promocode,
        timestamp: data.timestamp || Date.now()
      }
    });
    window.dispatchEvent(domEvent);
  });
  
  eventBus.on('paymentCompleted', (data) => {
    console.log('💳 Payment completed:', data);
    
    // Create DOM event for global propagation
    const domEvent = new CustomEvent('userSubscriptionChanged', {
      detail: {
        plan: data.plan,
        source: 'payment',
        oldPlan: 'free',
        transactionId: data.transactionId,
        amount: data.amount,
        timestamp: data.timestamp || Date.now()
      }
    });
    window.dispatchEvent(domEvent);
  });
  
  // ✅ Development mode: enhanced debugging
  if (import.meta.env.DEV) {
    const debugStatusChange = (data) => {
      console.log('🐛 Debug: Status change event:', data);
      
      // Check for inconsistencies
      const storeStatus = store?.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      
      if (storeStatus !== localStatus) {
        console.warn('⚠️ Status inconsistency detected:', {
          store: storeStatus,
          localStorage: localStatus,
          event: data.newStatus
        });
        
        // Auto-fix inconsistency
        if (storeStatus) {
          localStorage.setItem('userStatus', storeStatus);
          console.log('🔧 Auto-fixed localStorage from store');
        }
      }
    };
    
    eventBus.on('userStatusChanged', debugStatusChange);
    window.globalEventHandlers.statusHandlers.push(debugStatusChange);
  }
  
  console.log('✅ Global subscription management setup complete');
}

// ============================================================================
// 🌟 GLOBAL ERROR HANDLING
// ============================================================================

// Global JavaScript error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global JavaScript error:', event.error);
  
  eventBus.emit('globalJavaScriptError', {
    error: event.error?.message || 'Unknown error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  eventBus.emit('unhandledPromiseRejection', {
    reason: event.reason?.message || event.reason,
    timestamp: Date.now()
  });
});

// ============================================================================
// 🚀 APPLICATION INITIALIZATION
// ============================================================================

async function initializeApplication() {
  try {
    console.log('🚀 Starting application initialization...');
    
    // Initialize store first
    await initializeStore();
    
    // Firebase auth will trigger mounting when ready
    console.log('⏳ Waiting for Firebase auth state...');
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    
    eventBus.emit('appInitializationError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🔧 GLOBAL HELPER FUNCTIONS
// ============================================================================

// Helper functions for components
window.addEventListener('DOMContentLoaded', () => {
  // Status change helper
  window.emitUserStatusChange = (oldStatus, newStatus, source = 'unknown') => {
    eventBus.emit('userStatusChanged', { 
      oldStatus, 
      newStatus, 
      source,
      timestamp: Date.now() 
    });
  };
  
  // Force update helper
  window.emitForceUpdate = (reason = 'manual') => {
    eventBus.emit('forceUpdate', { 
      reason,
      timestamp: Date.now() 
    });
  };
  
  // User change listener helper
  window.listenToUserChanges = (callback) => {
    const events = ['userStatusChanged', 'promocodeApplied', 'featuresUpdated', 'forceUpdate'];
    events.forEach(event => eventBus.on(event, callback));
    
    return () => {
      events.forEach(event => eventBus.off(event, callback));
    };
  };
});

// ============================================================================
// 📊 PERFORMANCE MONITORING
// ============================================================================

if (import.meta.env.DEV) {
  // Track app load performance
  window.addEventListener('load', () => {
    if (performance.mark) {
      performance.mark('app-loaded');
      const loadTime = performance.now();
      console.log(`⚡ App loaded in: ${loadTime.toFixed(2)}ms`);
      
      eventBus.emit('appPerformance', {
        loadTime: loadTime,
        timestamp: Date.now()
      });
    }
  });
  
  // Track store mutations for debugging
  let mutationCount = 0;
  store.subscribe((mutation, state) => {
    mutationCount++;
    
    if (mutation.type.startsWith('user/')) {
      console.log(`🔄 User store mutation #${mutationCount}:`, mutation.type, mutation.payload);
    }
    
    // Track subscription-related mutations
    if (mutation.type.includes('STATUS') || mutation.type.includes('SUBSCRIPTION') || mutation.type.includes('UPDATE')) {
      eventBus.emit('storeMutation', {
        type: mutation.type,
        payload: mutation.payload,
        count: mutationCount,
        timestamp: Date.now()
      });
    }
  });
}

// ============================================================================
// 🐛 DEVELOPMENT DEBUGGING TOOLS
// ============================================================================

if (import.meta.env.DEV) {
  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$userFeatures = () => store.getters['user/features'];
  window.$appLifecycle = appLifecycle;
  
  // ✅ Enhanced debugging commands for authentication
  window.debugAuth = {
    // Clear all user state
    clearUserState: () => {
      forceClearUserState();
      console.log('🧹 All user state cleared');
    },
    
    // Get comprehensive user info
    getCurrentUser: () => {
      return {
        storeUser: store.getters['user/getUser'],
        storeStatus: store.getters['user/userStatus'],
        storeAuthenticated: store.getters['user/isAuthenticated'],
        firebaseUser: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName
        } : null,
        localStorage: {
          user: localStorage.getItem('user'),
          userId: localStorage.getItem('userId'),
          firebaseUserId: localStorage.getItem('firebaseUserId'),
          token: localStorage.getItem('token'),
          userStatus: localStorage.getItem('userStatus')
        },
        appState: appLifecycle
      };
    },
    
    // Test user save manually
    testSaveUser: async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.error('❌ No Firebase user to test with');
        return { success: false, error: 'No Firebase user' };
      }
      
      try {
        const token = await firebaseUser.getIdToken();
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL
        };
        
        console.log('🧪 Testing saveUser with data:', userData);
        const result = await store.dispatch('user/saveUser', { userData, token });
        console.log('🧪 SaveUser test result:', result);
        return result;
        
      } catch (error) {
        console.error('🧪 SaveUser test failed:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Check for dangerous null/undefined arrays
    checkArrayStates: () => {
      const state = store.state.user;
      const checks = {
        appliedPromocodes: {
          exists: !!state.promocodes?.applied,
          isArray: Array.isArray(state.promocodes?.applied),
          length: state.promocodes?.applied?.length || 'N/A',
          value: state.promocodes?.applied
        },
        paymentHistory: {
          exists: !!state.payments?.history,
          isArray: Array.isArray(state.payments?.history),
          length: state.payments?.history?.length || 'N/A', 
          value: state.payments?.history
        },
        pendingPayments: {
          exists: !!state.payments?.pending,
          isArray: Array.isArray(state.payments?.pending),
          length: state.payments?.pending?.length || 'N/A',
          value: state.payments?.pending
        }
      };
      
      console.log('🔍 Array state check:', checks);
      
      // Look for problematic states
      const problems = [];
      Object.entries(checks).forEach(([key, check]) => {
        if (check.exists && !check.isArray) {
          problems.push(`${key} exists but is not an array`);
        }
        if (check.exists && check.length === 'N/A') {
          problems.push(`${key} exists but has no length property`);
        }
      });
      
      if (problems.length > 0) {
        console.warn('⚠️ Array problems detected:', problems);
      } else {
        console.log('✅ All arrays are safe');
      }
      
      return { checks, problems };
    },
    
    // Fix null/undefined arrays
    fixNullArrays: () => {
      console.log('🔧 Fixing null/undefined arrays...');
      
      try {
        store.commit('user/CLEAR_USER');
        store.commit('user/SET_USER_STATUS', 'free');
        
        // Reinitialize with safe defaults
        store.commit('user/INITIALIZE_ARRAYS');
        
        console.log('✅ Arrays fixed and reset to safe defaults');
        return true;
      } catch (error) {
        console.error('❌ Failed to fix arrays:', error);
        return false;
      }
    },
    
    // Test auth flow end-to-end
    testAuthFlow: async () => {
      console.log('🧪 Testing complete auth flow...');
      
      const tests = {
        firebaseUser: !!auth.currentUser,
        storeInitialized: storeInitialized,
        authInitialized: authInitialized,
        appMounted: isAppMounted
      };
      
      console.log('📊 Auth flow status:', tests);
      
      if (auth.currentUser) {
        try {
          const tokenTest = await auth.currentUser.getIdToken();
          tests.tokenObtainable = !!tokenTest;
        } catch (error) {
          tests.tokenObtainable = false;
          tests.tokenError = error.message;
        }
      }
      
      return tests;
    }
  };
  
  // ✅ Enhanced debugging commands for subscription management
  window.debugSubscription = {
    // Get current status from all sources
    getCurrentStatus: () => {
      const storeStatus = store?.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const subscriptionDetails = store?.getters['user/subscriptionDetails'];
      
      const result = {
        store: storeStatus,
        localStorage: localStatus,
        consistent: storeStatus === localStatus,
        subscription: subscriptionDetails,
        timestamp: Date.now()
      };
      
      console.log('📊 Current subscription status:', result);
      return result;
    },
    
    // Force synchronization between store and localStorage
    syncStatus: () => {
      const storeStatus = store?.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      
      if (storeStatus && storeStatus !== localStatus) {
        localStorage.setItem('userStatus', storeStatus);
        console.log(`🔧 Synced localStorage to store: ${localStatus} → ${storeStatus}`);
        return { synced: true, oldValue: localStatus, newValue: storeStatus };
      } else if (localStatus && !storeStatus) {
        store.commit('user/SET_USER_STATUS', localStatus);
        console.log(`🔧 Synced store to localStorage: ${storeStatus} → ${localStatus}`);
        return { synced: true, oldValue: storeStatus, newValue: localStatus };
      } else {
        console.log('✅ Store and localStorage already in sync');
        return { synced: false, value: storeStatus };
      }
    },
    
    // Test promocode flow with full event chain
    testPromocodeFlow: (plan = 'start', promocode = null) => {
      console.log(`🧪 Testing promocode flow for ${plan} plan...`);
      
      const testPromocode = promocode || `TEST_${plan.toUpperCase()}_${Date.now()}`;
      const oldStatus = store?.getters['user/userStatus'] || 'free';
      
      // Update store first
      try {
        store.commit('user/SET_USER_STATUS', plan);
        localStorage.setItem('userStatus', plan);
      } catch (error) {
        console.error('❌ Failed to update store:', error);
      }
      
      // Emit all relevant events
      const eventData = {
        promocode: testPromocode,
        oldStatus: oldStatus,
        newStatus: plan,
        timestamp: Date.now()
      };
      
      // Event bus events
      eventBus.emit('userStatusChanged', {
        oldStatus: oldStatus,
        newStatus: plan,
        source: 'test-promocode',
        timestamp: Date.now()
      });
      
      eventBus.emit('promocodeApplied', eventData);
      
      // DOM event
      const domEvent = new CustomEvent('userSubscriptionChanged', {
        detail: {
          plan: plan,
          source: 'test-promocode',
          oldPlan: oldStatus,
          promocode: testPromocode,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(domEvent);
      
      console.log(`✅ Test promocode events dispatched:`, eventData);
      return eventData;
    },
    
    // Test payment flow with full event chain
    testPaymentFlow: (plan = 'start', amount = null) => {
      console.log(`🧪 Testing payment flow for ${plan} plan...`);
      
      const testAmount = amount || (plan === 'pro' ? 455000 : 260000);
      const testTransactionId = `TEST_PAY_${Date.now()}`;
      const oldStatus = store?.getters['user/userStatus'] || 'free';
      
      // Update store
      try {
        store.dispatch('user/updateSubscription', {
          plan: plan,
          source: 'test-payment',
          details: {
            transactionId: testTransactionId,
            amount: testAmount,
            paymentMethod: 'test',
            paidAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Failed to dispatch updateSubscription:', error);
      }
      
      // Emit events
      const eventData = {
        plan: plan,
        amount: testAmount,
        transactionId: testTransactionId,
        timestamp: Date.now()
      };
      
      eventBus.emit('paymentCompleted', eventData);
      
      // DOM event
      const domEvent = new CustomEvent('userSubscriptionChanged', {
        detail: {
          plan: plan,
          source: 'test-payment',
          oldPlan: oldStatus,
          transactionId: testTransactionId,
          amount: testAmount,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(domEvent);
      
      console.log(`✅ Test payment events dispatched:`, eventData);
      return eventData;
    },
    
    // Get event bus statistics
    getEventStats: () => {
      const stats = eventBus.getStats();
      console.log('📊 Event bus statistics:', stats);
      return stats;
    },
    
    // Test global force update
    testGlobalUpdate: () => {
      console.log('🧪 Testing global force update...');
      
      eventBus.emit('globalForceUpdate', {
        reason: 'debug-test',
        timestamp: Date.now()
      });
      
      if (app?._instance) {
        try {
          app._instance.proxy.$forceUpdate();
          console.log('✅ Global force update successful');
          return true;
        } catch (error) {
          console.error('❌ Global force update failed:', error);
          return false;
        }
      } else {
        console.warn('⚠️ App instance not available');
        return false;
      }
    }
  };
  
  // ✅ Event monitoring for development
  window.debugEvents = {
    // Monitor all events
    startMonitoring: () => {
      console.log('🔍 Starting event monitoring...');
      
      const originalEmit = eventBus.emit;
      eventBus.emit = function(event, data) {
        console.log(`📡 Event: ${event}`, data);
        return originalEmit.call(this, event, data);
      };
      
      console.log('✅ Event monitoring active');
    },
    
    // Stop monitoring
    stopMonitoring: () => {
      console.log('🔍 Stopping event monitoring...');
      // Note: This would require storing original emit function
      console.log('⚠️ Restart app to fully stop monitoring');
    },
    
    // Get recent events (if we tracked them)
    getRecentEvents: () => {
      return eventBus.getStats();
    }
  };
  
  // Display all available debug commands
  console.log(`
🐛 DEVELOPMENT DEBUG COMMANDS AVAILABLE:

📊 SUBSCRIPTION DEBUGGING:
- debugSubscription.getCurrentStatus(): Check status across all sources
- debugSubscription.syncStatus(): Sync store and localStorage  
- debugSubscription.testPromocodeFlow('pro'): Test promocode application
- debugSubscription.testPaymentFlow('start'): Test payment completion
- debugSubscription.getEventStats(): Get event bus statistics
- debugSubscription.testGlobalUpdate(): Test global component updates

🔐 AUTHENTICATION DEBUGGING:
- debugAuth.getCurrentUser(): Get comprehensive user state
- debugAuth.clearUserState(): Clear all user data
- debugAuth.testSaveUser(): Test server user save manually
- debugAuth.checkArrayStates(): Check for problematic arrays
- debugAuth.fixNullArrays(): Fix null/undefined arrays
- debugAuth.testAuthFlow(): Test complete auth flow

📡 EVENT DEBUGGING:
- debugEvents.startMonitoring(): Monitor all event bus events
- debugEvents.stopMonitoring(): Stop event monitoring
- debugEvents.getRecentEvents(): Get event statistics

🎯 QUICK ACCESS:
- $store: Vuex store instance
- $eventBus: Global event bus
- $userStatus(): Get current user status
- $appLifecycle: App initialization state
  `);
}

// ============================================================================
// 🎬 APPLICATION STARTUP
// ============================================================================

// Start the application
initializeApplication().catch(error => {
  console.error('❌ Critical application startup failure:', error);
  
  // Emit critical startup error
  if (window.eventBus) {
    eventBus.emit('criticalStartupError', {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }
  
  // Show user-friendly error message
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center; padding: 2rem; background: #fee; border: 1px solid #fcc; border-radius: 8px;">
        <h2 style="color: #c33; margin-bottom: 1rem;">⚠️ Application Startup Error</h2>
        <p style="color: #666; margin-bottom: 1rem;">The application failed to initialize properly.</p>
        <button onclick="window.location.reload()" style="background: #007cba; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
          🔄 Reload Page
        </button>
      </div>
    </div>
  `;
});

// ============================================================================
// 📤 EXPORTS
// ============================================================================

// Export the event bus for use in other modules
export { eventBus };

// Export the Vue app instance (available after mounting)
export { app };

// Export store and router for direct access if needed
export { store, router, i18n };

// Export utility functions that other modules might need
export { 
  forceClearUserState, 
  handleUserLogin, 
  handleUserLogout 
};

// Export app lifecycle state for monitoring
export { appLifecycle };

// Export auth state checkers
export const isAuthReady = () => authInitialized;
export const isStoreReady = () => storeInitialized;
export const isAppMounted = () => isAppMounted;
export const isAppReady = () => appLifecycle.initialized;

// Export debugging helpers for development
if (import.meta.env.DEV) {
  export const getDebugInfo = () => ({
    appLifecycle,
    authInitialized,
    storeInitialized,
    isAppMounted,
    eventBusStats: eventBus.getStats(),
    userStatus: store?.getters['user/userStatus'],
    timestamp: Date.now()
  });
}