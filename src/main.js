// ============================================================================
// 🐛 DEVELOPMENT DEBUGGING TOOLS - RESTORED FULL FUNCTIONALITY
// ============================================================================

if (import.meta.env.DEV) {
  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$userFeatures = () => store.getters['user/features'];
  window.$appLifecycle = appLifecycle;
  window.$authInitPromise = authInitPromise;
  
  console.log(`
🐛 DEVELOPMENT DEBUG COMMANDS AVAILABLE:

📊 SUBSCRIPTION DEBUGGING:
- debugSubscription.getCurrentStatus(): Check status across all sources
- debugSubscription.syncStatus(): Sync store and localStorage  
- debugSubscription.testPromocodeFlow('pro'): Test promocode application
- debugSubscription.testPaymentFlow('start'): Test payment completion

🔐 AUTHENTICATION DEBUGGING:
- debugAuth.getCurrentUser(): Get comprehensive user state
- debugAuth.clearUserState(): Clear all user data
- debugAuth.testSaveUser(): Test server user save manually

🎯 QUICK ACCESS:
- $store: Vuex store instance
- $eventBus: Global event bus
- $userStatus(): Get current user status
- $appLifecycle: App initialization state
- $authInitPromise: Auth initialization promise
  `);
}

// ============================================================================
// 🎬 APPLICATION STARTUP - RESTORED FULL ERROR HANDLING
// ============================================================================

// Start the application with comprehensive error handling
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

console.log('🚀 Main.js initialization complete - waiting for Firebase auth...');// src/main.js - RESTRUCTURED VERSION: Authentication First, Clean & Simple
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
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

// ============================================================================
// 🔥 FIREBASE AUTH PERSISTENCE - SET IMMEDIATELY
// ============================================================================

setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Firebase auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Failed to set auth persistence:', error);
});

// ============================================================================
// 🚀 ENHANCED EVENT BUS (PRESERVED FROM CURRENT VERSION)
// ============================================================================

class AdvancedEventBus {
  constructor() {
    this.events = {};
    this.debugMode = import.meta.env.DEV;
    this.subscriptionListeners = new Set();
    this.errorHandlers = new Set();
  }
  
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
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    if (this.debugMode) {
      console.log(`🔗 EventBus: Registered listener for "${event}"`);
    }
  }
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
  
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
  
  onSubscriptionChange(callback) {
    this.subscriptionListeners.add(callback);
    return () => this.subscriptionListeners.delete(callback);
  }
  
  notifySubscriptionListeners(event, data) {
    this.subscriptionListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Subscription listener error:', error);
      }
    });
  }
  
  onError(callback) {
    this.errorHandlers.add(callback);
    return () => this.errorHandlers.delete(callback);
  }
  
  handleEventError(event, error, data) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(event, error, data);
      } catch (handlerError) {
        console.error('❌ Error handler failed:', handlerError);
      }
    });
  }
  
  clear() {
    this.events = {};
    this.subscriptionListeners.clear();
    this.errorHandlers.clear();
  }
  
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

// Create and export event bus
const eventBus = new AdvancedEventBus();
window.eventBus = eventBus;
export { eventBus };

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
// 📊 ASYNC STORE INITIALIZATION - RESTORED CRITICAL FUNCTIONS
// ============================================================================

let storeInitialized = false;
let authInitialized = false;

// ✅ Create auth initialization promise for router guard (RESTORED)
export const authInitPromise = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!authInitialized) {
      authInitialized = true;
      unsubscribe();
      resolve(user);
      console.log('🔥 Firebase auth initialized');
    }
  });
  
  // Timeout fallback
  setTimeout(() => {
    if (!authInitialized) {
      authInitialized = true;
      unsubscribe();
      resolve(null);
      console.warn('🔥 Firebase auth initialization timeout');
    }
  }, 8000);
});

// ✅ ASYNC Store initialization function (RESTORED)
async function initializeStore() {
  try {
    console.log('🏪 Initializing Vuex store...');
    
    // Initialize user store from localStorage
    await store.dispatch('user/initialize');
    
    // Also load legacy store data
    await store.dispatch('loadUserFromLocalStorage');
    
    storeInitialized = true;
    
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
// 🎯 PREPARE APP INSTANCE AND LIFECYCLE TRACKING
// ============================================================================

let app;
let appMounted = false;
let isApplicationMounted = false;

// Track app lifecycle (RESTORED)
const appLifecycle = {
  initialized: false,
  mounted: false,
  authReady: false,
  storeReady: false
};

// ✅ ASYNC Vue App Creation Function (RESTORED)
async function createVueApp() {
  console.log('🎯 Creating Vue application instance...');
  
  app = createApp(App);
  
  // Add global properties
  app.config.globalProperties.$eventBus = eventBus;
  app.config.globalProperties.$userStore = store;
  app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
  app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
  
  // Install plugins
  app.use(store);
  app.use(router);
  app.use(VueToast, {
    position: 'top-center',
    duration: 4000,
    dismissible: true
  });
  app.use(i18n);
  
  // Enhanced error handler
  app.config.errorHandler = (error, instance, info) => {
    console.error('❌ Vue error:', error);
    console.error('📍 Component:', instance?.$options?.name || 'Unknown');
    console.error('ℹ️ Info:', info);
    
    // Handle specific length errors
    if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
      console.error('🔍 Length property error detected - attempting recovery');
      
      eventBus.emit('lengthPropertyError', {
        error: error.message,
        component: instance?.$options?.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
      
      try {
        store.commit('user/FORCE_UPDATE');
        console.log('🔄 Store refresh attempted');
      } catch (refreshError) {
        console.error('❌ Store refresh failed:', refreshError);
      }
    }
    
    eventBus.emit('vueError', {
      error: error.message,
      component: instance?.$options?.name || 'Unknown',
      info,
      timestamp: Date.now()
    });
  };
  
  return app;
}

// ✅ ASYNC Vue Application Mounting (RESTORED CRITICAL FUNCTION)
async function mountVueApplication() {
  try {
    console.log('🎯 Mounting Vue application...');
    
    if (!app) {
      app = await createVueApp();
    }
    
    // Mount the application
    app.mount('#app');
    isApplicationMounted = true;
    appMounted = true;
    appLifecycle.mounted = true;
    
    console.log('✅ Vue application mounted successfully');
    
    // Setup global subscription management
    setupGlobalSubscriptionManagement();
    
    // Emit app ready event
    eventBus.emit('appReady', {
      userAuthenticated: !!store.getters['user/isAuthenticated'],
      userStatus: store.getters['user/userStatus'],
      timestamp: Date.now()
    });
    
    // Mark app as fully initialized
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
// 🔥 FIREBASE AUTH STATE HANDLER - WITH PROPER ASYNC COORDINATION
// ============================================================================

onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    console.log('🔥 Firebase auth state changed:', firebaseUser?.email || 'logged out');
    
    if (firebaseUser) {
      // ✅ USER IS LOGGED IN
      await handleUserLogin(firebaseUser);
    } else {
      // ❌ USER IS LOGGED OUT  
      await handleUserLogout();
    }
    
    // Mark auth as initialized (RESTORED)
    if (!authInitialized) {
      authInitialized = true;
      appLifecycle.authReady = true;
      
      eventBus.emit('authReady', {
        hasUser: !!firebaseUser,
        timestamp: Date.now()
      });
      
      console.log('✅ Firebase auth initialized');
    }
    
    // ✅ MOUNT APP ONLY ONCE AFTER BOTH AUTH AND STORE ARE READY
    if (!isApplicationMounted && authInitialized && storeInitialized) {
      await mountVueApplication();
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
});

// ============================================================================
// 👤 HANDLE USER LOGIN - RESTORED FULL ASYNC FUNCTIONALITY
// ============================================================================

async function handleUserLogin(firebaseUser) {
  try {
    console.log('👤 Processing user login for:', firebaseUser.email);
    
    // ✅ Get Firebase ID token with retry logic
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
    
    // ✅ Save user to server with enhanced error handling
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
    
    // ✅ Handle save result with comprehensive safety checks
    if (saveResult && saveResult.success === true) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
      // ✅ Ensure saveResult is an object with error property
      const safeResult = saveResult || { success: false, error: 'Save action returned undefined' };
      await handleFailedUserSave(safeResult, token, userData);
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
// ✅ SUCCESSFUL USER SAVE HANDLER - RESTORED FULL FUNCTIONALITY
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
      
      // Update localStorage with comprehensive data
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
    
    // ✅ Emit comprehensive success events
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
// ❌ FAILED USER SAVE HANDLER - RESTORED WITH AUTO-RETRY
// ============================================================================

async function handleFailedUserSave(result, token, userData) {
  // ✅ Safety check for result object
  const safeResult = result || { success: false, error: 'Unknown error' };
  
  const errorMessage = safeResult.error || safeResult.message || 'Failed to save user to server';
  console.error('❌ Failed to save user to server:', {
    error: errorMessage,
    statusCode: safeResult.statusCode,
    isDispatchError: safeResult.isDispatchError,
    hasResult: !!result
  });
  
  // Clear any inconsistent state
  await forceClearUserState();
  
  // Emit detailed error
  eventBus.emit('userLoginError', {
    error: errorMessage,
    isServerError: true,
    canRetry: true,
    statusCode: safeResult.statusCode,
    isDispatchError: safeResult.isDispatchError,
    timestamp: Date.now()
  });
  
  // ✅ AUTO-RETRY for server/network errors (RESTORED CRITICAL FUNCTION)
  const shouldRetry = (
    safeResult.statusCode >= 500 || 
    !safeResult.statusCode || 
    safeResult.isDispatchError ||
    errorMessage.includes('undefined')
  );
  
  if (shouldRetry) {
    console.log('🔄 Will retry user save in 3 seconds...');
    
    setTimeout(async () => {
      try {
        console.log('🔄 Retrying user save...');
        const retryResult = await store.dispatch('user/saveUser', { userData, token });
        
        // ✅ Check retry result safely
        if (retryResult && retryResult.success === true && retryResult.user) {
          console.log('✅ Retry successful');
          await handleSuccessfulUserSave(retryResult, token, userData);
          
          eventBus.emit('userLoginRetrySuccess', {
            message: 'Successfully connected after retry',
            timestamp: Date.now()
          });
        } else {
          console.error('❌ Retry failed:', retryResult);
          eventBus.emit('userLoginRetryFailed', {
            error: retryResult?.error || 'Retry failed - no valid result',
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
// 👋 HANDLE USER LOGOUT - SIMPLIFIED
// ============================================================================

async function handleUserLogout() {
  try {
    console.log('👋 Processing user logout...');
    
    // Clear user data through store actions
    await store.dispatch('user/logout');
    store.commit('logout');
    
    // Clear localStorage
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
    await forceClearUserState();
    
    eventBus.emit('logoutError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🧹 FORCE CLEAR USER STATE - EMERGENCY CLEANUP
// ============================================================================

async function forceClearUserState() {
  console.log('🧹 Force clearing all user state...');
  
  try {
    store.commit('user/CLEAR_USER');
    store.commit('logout');
  } catch (error) {
    console.warn('⚠️ Failed to clear stores:', error);
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
// 🌐 GLOBAL SUBSCRIPTION MANAGEMENT - PRESERVED
// ============================================================================

function setupGlobalSubscriptionManagement() {
  console.log('🌐 Setting up global subscription management...');
  
  // Global subscription change handler
  const handleGlobalSubscriptionChange = (event) => {
    console.log('📡 Global subscription change detected:', event.detail);
    
    const { plan, source, oldPlan, timestamp } = event.detail;
    
    // Update page title
    const planLabel = plan === 'pro' ? 'Pro' : plan === 'start' ? 'Start' : 'Free';
    if (document.title && !document.title.includes('|')) {
      document.title = `ACED | ${planLabel}`;
    }
    
    // Update body classes
    document.body.className = document.body.className.replace(/user-plan-\w+/g, '');
    document.body.classList.add(`user-plan-${plan}`);
    
    // Update localStorage
    localStorage.setItem('userStatus', plan);
    
    // Force Vue app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        console.log('🔄 Forced Vue app update');
      } catch (error) {
        console.warn('⚠️ Failed to force Vue update:', error);
      }
    }
    
    // Emit to event bus
    eventBus.emit('globalForceUpdate', {
      reason: 'subscription-change',
      plan: plan,
      source: source,
      oldPlan: oldPlan,
      timestamp: timestamp || Date.now()
    });
    
    // Show celebration for upgrades
    if (plan !== 'free' && oldPlan === 'free') {
      eventBus.emit('subscriptionUpgrade', {
        plan: plan,
        source: source,
        message: `Поздравляем! ${planLabel} подписка активирована!`,
        timestamp: Date.now()
      });
    }
  };
  
  // Register global DOM event listener
  window.addEventListener('userSubscriptionChanged', handleGlobalSubscriptionChange);
  
  // Event bus subscription listeners
  eventBus.on('userStatusChanged', (data) => {
    console.log('👤 User status changed:', data);
    
    if (data.newStatus) {
      localStorage.setItem('userStatus', data.newStatus);
    }
    
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
        console.warn('⚠️ Failed to force update:', error);
      }
    }
  });
  
  eventBus.on('promocodeApplied', (data) => {
    console.log('🎟️ Promocode applied:', data);
    
    const domEvent = new CustomEvent('userSubscriptionChanged', {
      detail: {
        plan: data.newStatus,
        source: 'promocode',
        oldPlan: data.oldStatus,
        promocode: data.promocode,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(domEvent);
  });
  
  eventBus.on('paymentCompleted', (data) => {
    console.log('💳 Payment completed:', data);
    
    const domEvent = new CustomEvent('userSubscriptionChanged', {
      detail: {
        plan: data.plan,
        source: 'payment',
        oldPlan: 'free',
        transactionId: data.transactionId,
        amount: data.amount,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(domEvent);
  });
  
  console.log('✅ Global subscription management setup complete');
}

// ============================================================================
// 🌟 GLOBAL ERROR HANDLING
// ============================================================================

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

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  eventBus.emit('unhandledPromiseRejection', {
    reason: event.reason?.message || event.reason,
    timestamp: Date.now()
  });
});

// ============================================================================
// 🔧 GLOBAL HELPER FUNCTIONS
// ============================================================================

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
// 🚀 APPLICATION INITIALIZATION - RESTORED CRITICAL ASYNC FUNCTION
// ============================================================================

async function initializeApplication() {
  try {
    console.log('🚀 Starting application initialization...');
    
    // Initialize store first with proper async handling
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
// 📊 PERFORMANCE MONITORING - RESTORED
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

console.log('🚀 Main.js initialization complete - waiting for Firebase auth...');