// src/main.js - COMPLETE REWRITE WITH FIXED AUTHENTICATION PERSISTENCE
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
// 🔥 CRITICAL: SET FIREBASE AUTH PERSISTENCE FIRST
// ============================================================================

// ✅ CRITICAL: Set auth persistence to LOCAL for page refresh persistence
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Firebase auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Failed to set auth persistence:', error);
});

// ✅ CRITICAL: Create auth initialization promise - MUST be created before anything else
let authInitialized = false;
let authInitResolver = null;

export const authInitPromise = new Promise((resolve) => {
  authInitResolver = resolve;
  
  // Fallback timeout to prevent hanging
  setTimeout(() => {
    if (!authInitialized) {
      console.warn('🔥 Firebase auth initialization timeout, resolving anyway');
      authInitialized = true;
      resolve(null);
    }
  }, 10000); // 10 second timeout
});

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

// Create enhanced global event bus and EXPORT it
const eventBus = new AdvancedEventBus();
window.eventBus = eventBus;

// ✅ EXPORT the eventBus for component imports
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
// 🎯 APPLICATION STATE MANAGEMENT
// ============================================================================

let app;
let isApplicationMounted = false;
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
// 🔥 FIXED FIREBASE AUTH HANDLER WITH PROPER PERSISTENCE
// ============================================================================

// ✅ CRITICAL: Enhanced Firebase auth state change handler
onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    console.log('🔥 Firebase auth state changed:', firebaseUser?.email || 'logged out');
    
    // ✅ CRITICAL: Always resolve auth init promise first time
    if (!authInitialized) {
      authInitialized = true;
      appLifecycle.authReady = true;
      
      console.log('✅ Firebase auth initialized');
      
      if (authInitResolver) {
        authInitResolver(firebaseUser);
      }
      
      eventBus.emit('authReady', {
        hasUser: !!firebaseUser,
        timestamp: Date.now()
      });
    }
    
    if (firebaseUser) {
      await handleUserLogin(firebaseUser);
    } else {
      await handleUserLogout();
    }
    
  } catch (error) {
    console.error('❌ Critical auth state change error:', error);
    
    // ✅ CRITICAL: Still resolve auth init to prevent hanging
    if (!authInitialized) {
      authInitialized = true;
      if (authInitResolver) {
        authInitResolver(null);
      }
    }
    
    eventBus.emit('authCriticalError', {
      error: error.message,
      userEmail: firebaseUser?.email,
      requiresReload: true,
      timestamp: Date.now()
    });
    
    // Force clear all user state on critical errors
    await forceClearUserState();
  }
  
  // ✅ CRITICAL: Mount app once auth is ready AND store is ready
  if (!isApplicationMounted && authInitialized && storeInitialized) {
    await mountVueApplication();
  }
});

// ============================================================================
// 👤 ENHANCED USER LOGIN HANDLER WITH RETRY LOGIC
// ============================================================================

async function handleUserLogin(firebaseUser) {
  try {
    console.log('👤 Processing user login for:', firebaseUser.email);
    
    // ✅ IMMEDIATELY set user in store to prevent logout during save
    const quickUserData = {
      uid: firebaseUser.uid,
      firebaseId: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      subscriptionPlan: 'free', // Default until server confirms
      lastLoginAt: new Date().toISOString()
    };
    
    // Set user immediately to prevent auth flicker
    store.commit('user/SET_USER', quickUserData);
    store.commit('user/SET_AUTHENTICATED', true);
    console.log('👤 User set immediately in store to prevent logout');
    
    // ✅ Get Firebase ID token with retry
    let token;
    let tokenAttempts = 0;
    const maxTokenAttempts = 3;
    
    while (tokenAttempts < maxTokenAttempts) {
      try {
        token = await firebaseUser.getIdToken(true); // Force refresh
        console.log('🔑 Firebase token obtained');
        break;
      } catch (tokenError) {
        tokenAttempts++;
        console.error(`❌ Token attempt ${tokenAttempts} failed:`, tokenError);
        
        if (tokenAttempts >= maxTokenAttempts) {
          console.error('❌ Failed to get Firebase token after max attempts');
          
          eventBus.emit('userLoginError', {
            error: 'Failed to get authentication token. Please try logging in again.',
            isTokenError: true,
            canRetry: true,
            timestamp: Date.now()
          });
          
          return; // Don't proceed without token
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * tokenAttempts));
      }
    }
    
    // ✅ Prepare enhanced user data
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
    
    // ✅ Save user to server with enhanced retry logic
    let saveResult;
    let saveAttempts = 0;
    const maxSaveAttempts = 3;
    
    while (saveAttempts < maxSaveAttempts) {
      try {
        saveResult = await store.dispatch('user/saveUser', { userData, token });
        
        if (saveResult && saveResult.success === true) {
          console.log('✅ User saved successfully on attempt', saveAttempts + 1);
          break; // Success, exit retry loop
        } else {
          throw new Error(saveResult?.error || 'Save returned unsuccessful result');
        }
        
      } catch (saveError) {
        saveAttempts++;
        console.warn(`⚠️ User save attempt ${saveAttempts} failed:`, saveError.message);
        
        if (saveAttempts >= maxSaveAttempts) {
          console.error('❌ Max save attempts reached');
          
          // Don't fail completely, continue with local auth
          eventBus.emit('userSaveError', {
            error: saveError.message,
            maxAttemptsReached: true,
            localAuthContinued: true,
            timestamp: Date.now()
          });
          
          // Use local user data
          saveResult = {
            success: true,
            user: quickUserData,
            fallback: true
          };
          break;
          
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, saveAttempts - 1)));
        }
      }
    }
    
    // ✅ Handle successful save or fallback
    if (saveResult && (saveResult.success === true || saveResult.fallback)) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
      // This shouldn't happen due to fallback, but handle it
      console.error('❌ All user save attempts failed without fallback');
      eventBus.emit('userLoginError', {
        error: 'Failed to save user data after multiple attempts',
        isCritical: true,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ User login handler error:', error);
    
    eventBus.emit('userLoginError', {
      error: error.message || 'Login process failed',
      isCritical: true,
      timestamp: Date.now()
    });
    
    // Don't clear user state if we at least have local auth
    if (!store.getters['user/isAuthenticated']) {
      await forceClearUserState();
    }
  }
}

// ============================================================================
// ✅ ENHANCED SUCCESSFUL USER SAVE HANDLER
// ============================================================================

async function handleSuccessfulUserSave(result, token, userData) {
  try {
    console.log('✅ User saved to server successfully');
    
    if (result.fallback) {
      console.log('ℹ️ Using fallback local authentication');
    }
    
    // Validate user data in result
    const serverUser = result.user;
    if (!serverUser || typeof serverUser !== 'object') {
      console.error('❌ Invalid user data in result:', result);
      
      eventBus.emit('userLoginError', {
        error: 'Server returned invalid user data. Using local authentication.',
        isDataError: true,
        fallbackUsed: true,
        timestamp: Date.now()
      });
      
      // Use the quick user data we set earlier
      return;
    }
    
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
      
      // Update user status if different
      const serverStatus = serverUser.subscriptionPlan || 'free';
      const currentStatus = store.getters['user/userStatus'];
      
      if (serverStatus !== currentStatus) {
        console.log(`🔄 Updating user status: ${currentStatus} → ${serverStatus}`);
        store.commit('user/SET_USER_STATUS', serverStatus);
      }
      
      // Update localStorage
      const storageData = {
        user: serverUser,
        firebaseUserId: serverUser.firebaseId || serverUser._id,
        userId: serverUser.firebaseId || serverUser._id,
        token: token,
        userStatus: serverStatus
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
      source: result.fallback ? 'fallback' : 'server',
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
    
    // ✅ CRITICAL: Load additional user data (non-blocking)
    console.log('📊 Initiating background data loading...');
    
    const backgroundTasks = [
      { name: 'loadUserStatus', action: () => store.dispatch('user/loadUserStatus') },
      { name: 'loadUsage', action: () => store.dispatch('user/loadUsage') },
      { name: 'checkMonthlyReset', action: () => store.dispatch('user/checkMonthlyReset') },
      { name: 'checkPendingPayments', action: () => store.dispatch('user/checkPendingPayments') }
    ];
    
    // Execute background tasks without blocking
    Promise.allSettled(backgroundTasks.map(task =>
      task.action().catch(err => ({ taskName: task.name, error: err.message }))
    )).then(results => {
      const failures = results.filter(r => r.status === 'rejected');
      const successes = results.filter(r => r.status === 'fulfilled');
      
      if (failures.length > 0) {
        console.warn('⚠️ Some background tasks failed:', failures.map(f => f.reason));
      }
      
      console.log(`✅ Background data loading complete: ${successes.length}/${backgroundTasks.length} succeeded`);
    }).catch(error => {
      console.warn('⚠️ Background task coordination error:', error);
    });
    
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
    app.config.globalProperties.$authInitPromise = authInitPromise;
    
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
      
      // Handle specific auth-related errors
      if (error.message?.includes('auth') || error.message?.includes('user')) {
        console.error('🔍 Auth-related error detected');
        
        eventBus.emit('authVueError', {
          error: error.message,
          component: instance?.$options?.name || 'Unknown',
          info,
          timestamp: Date.now()
        });
      }
      
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
    isApplicationMounted = true;
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
        timestamp: Date.now()
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
        timestamp: Date.now()
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
    
    // ✅ CRITICAL: Initialize store first
    await initializeStore();
    
    // ✅ CRITICAL: Wait for Firebase auth initialization
    console.log('⏳ Waiting for Firebase auth state...');
    
    // The Firebase auth handler will take care of mounting the app
    // when both auth and store are ready
    
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
  
  // Auth initialization helper for components
  window.waitForAuth = () => authInitPromise;
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
  window.$authInitPromise = authInitPromise;
  
  // Enhanced debugging tools
  window.debugAuth = {
    getCurrentUser: () => ({
      firebase: auth.currentUser,
      store: store.getters['user/getUser'],
      localStorage: JSON.parse(localStorage.getItem('user') || 'null')
    }),
    
    clearUserState: async () => {
      await forceClearUserState();
      console.log('✅ User state cleared via debug tool');
    },
    
    testSaveUser: async () => {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const result = await store.dispatch('user/saveUser', {
          userData: {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName
          },
          token
        });
        console.log('🧪 Test save user result:', result);
        return result;
      } else {
        console.log('❌ No current user to test save');
        return null;
      }
    },
    
    forceAuthReinit: async () => {
      console.log('🔄 Forcing auth reinitialization...');
      authInitialized = false;
      
      // Trigger auth state change
      const currentUser = auth.currentUser;
      if (currentUser) {
        await handleUserLogin(currentUser);
      }
    }
  };
  
  window.debugSubscription = {
    getCurrentStatus: () => ({
      store: store.getters['user/userStatus'],
      localStorage: localStorage.getItem('userStatus'),
      subscription: store.getters['user/subscriptionDetails']
    }),
    
    syncStatus: () => {
      const storeStatus = store.getters['user/userStatus'];
      localStorage.setItem('userStatus', storeStatus);
      console.log('🔧 Status synced:', storeStatus);
    },
    
    testPromocodeFlow: async (plan = 'pro') => {
      console.log(`🧪 Testing promocode flow for ${plan}...`);
      const result = await store.dispatch('user/updateUserStatus', plan);
      console.log('🧪 Promocode test result:', result);
      return result;
    },
    
    testPaymentFlow: async (plan = 'start') => {
      console.log(`🧪 Testing payment flow for ${plan}...`);
      eventBus.emit('paymentCompleted', {
        plan,
        transactionId: 'test_' + Date.now(),
        amount: plan === 'start' ? 260000 : 455000
      });
    }
  };
  
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
- debugAuth.forceAuthReinit(): Force auth reinitialization

🎯 QUICK ACCESS:
- $store: Vuex store instance
- $eventBus: Global event bus
- $userStatus(): Get current user status
- $appLifecycle: App initialization state
- $authInitPromise: Auth initialization promise
  `);
}

// ============================================================================
// 🔄 AUTH STATE RECOVERY MECHANISM
// ============================================================================

// Add recovery mechanism for auth state issues
window.addEventListener('focus', () => {
  // Check if we lost auth state on window focus
  if (authInitialized && !store.getters['user/isAuthenticated'] && auth.currentUser) {
    console.log('🔄 Detected auth state mismatch on window focus, recovering...');
    handleUserLogin(auth.currentUser).catch(error => {
      console.error('❌ Auth recovery failed:', error);
    });
  }
});

// Add periodic auth state check (every 30 seconds)
setInterval(() => {
  if (authInitialized && store.getters['user/isAuthenticated']) {
    const firebaseUser = auth.currentUser;
    const storeUser = store.getters['user/getUser'];
    
    // Check for mismatches
    if (firebaseUser && storeUser && firebaseUser.uid !== storeUser.firebaseId) {
      console.warn('⚠️ Auth state mismatch detected, fixing...');
      handleUserLogin(firebaseUser).catch(error => {
        console.error('❌ Periodic auth fix failed:', error);
      });
    } else if (!firebaseUser && storeUser) {
      console.warn('⚠️ Firebase user lost but store has user, clearing...');
      handleUserLogout().catch(error => {
        console.error('❌ Periodic logout failed:', error);
      });
    }
  }
}, 30000);

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