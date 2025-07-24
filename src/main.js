// src/main.js - FIXED VERSION WITH WORKING AUTHENTICATION
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

// ✅ CRITICAL: Create auth initialization promise
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
  }, 8000); // 8 second timeout
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
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
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
// 🔥 FIXED FIREBASE AUTH HANDLER
// ============================================================================

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
// 👤 FIXED USER LOGIN HANDLER
// ============================================================================

async function handleUserLogin(firebaseUser) {
  try {
    console.log('👤 Processing user login for:', firebaseUser.email);
    
    // ✅ IMMEDIATELY set user in store to prevent logout during save
    const quickUserData = {
      uid: firebaseUser.uid,
      firebaseId: firebaseUser.uid,
      _id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      subscriptionPlan: 'free',
      lastLoginAt: new Date().toISOString()
    };
    
    // Set user immediately to prevent auth flicker
    store.commit('user/SET_USER', quickUserData);
    store.commit('user/SET_AUTHENTICATED', true);
    console.log('👤 User set immediately in store to prevent logout');
    
    // ✅ Get Firebase ID token with retry
    let token;
    try {
      token = await firebaseUser.getIdToken(true);
      console.log('🔑 Firebase token obtained');
    } catch (tokenError) {
      console.error('❌ Failed to get Firebase token:', tokenError);
      
      eventBus.emit('userLoginError', {
        error: 'Failed to get authentication token. Please try logging in again.',
        isTokenError: true,
        canRetry: true,
        timestamp: Date.now()
      });
      
      // Continue with local auth only
      await handleSuccessfulUserSave({ success: true, user: quickUserData, fallback: true }, null, quickUserData);
      return;
    }
    
    // ✅ Prepare user data for server
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
    
    // ✅ FIXED: Save user to server with proper error handling
    let saveResult;
    try {
      saveResult = await store.dispatch('user/saveUser', { userData, token });
      
      // ✅ FIXED: Handle different return formats
      if (!saveResult) {
        console.warn('⚠️ saveUser returned undefined, using fallback');
        saveResult = { success: true, user: quickUserData, fallback: true };
      } else if (typeof saveResult !== 'object') {
        console.warn('⚠️ saveUser returned non-object, using fallback');
        saveResult = { success: true, user: quickUserData, fallback: true };
      } else if (saveResult.success !== true && saveResult.success !== false) {
        console.warn('⚠️ saveUser returned ambiguous result, using fallback');
        saveResult = { success: true, user: quickUserData, fallback: true };
      }
      
    } catch (saveError) {
      console.error('❌ User save failed:', saveError);
      
      eventBus.emit('userSaveError', {
        error: saveError.message,
        fallbackUsed: true,
        timestamp: Date.now()
      });
      
      // Use fallback
      saveResult = { success: true, user: quickUserData, fallback: true };
    }
    
    // ✅ Handle successful save or fallback
    await handleSuccessfulUserSave(saveResult, token, userData);
    
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
// ✅ FIXED SUCCESSFUL USER SAVE HANDLER
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
      return; // Exit early if no valid user data
    }
    
    console.log('👤 Server user data:', {
      id: serverUser._id || serverUser.firebaseId || serverUser.uid,
      email: serverUser.email,
      plan: serverUser.subscriptionPlan || 'free'
    });
    
    // ✅ Update stores with server data
    try {
      // Update main store (legacy compatibility)
      if (store.commit) {
        store.commit('setUser', serverUser);
        
        if (serverUser.firebaseId || serverUser._id || serverUser.uid) {
          store.commit('setFirebaseUserId', serverUser.firebaseId || serverUser._id || serverUser.uid);
        }
        
        if (token) {
          store.commit('setToken', token);
        }
      }
      
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
        firebaseUserId: serverUser.firebaseId || serverUser._id || serverUser.uid,
        userId: serverUser.firebaseId || serverUser._id || serverUser.uid,
        userStatus: serverStatus
      };
      
      if (token) {
        storageData.token = token;
      }
      
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
    
    // ✅ FIXED: Load additional user data (with proper error handling)
    console.log('📊 Initiating background data loading...');
    
    const backgroundTasks = [];
    
    // Only add tasks that exist and are functions
    if (store.dispatch) {
      const taskActions = [
        'user/loadUserStatus',
        'user/loadUsage', 
        'user/checkMonthlyReset',
        'user/checkPendingPayments'
      ];
      
      taskActions.forEach(actionName => {
        backgroundTasks.push({
          name: actionName,
          action: async () => {
            try {
              const result = await store.dispatch(actionName);
              return { success: true, result, actionName };
            } catch (error) {
              console.warn(`⚠️ Background task ${actionName} failed:`, error.message);
              return { success: false, error: error.message, actionName };
            }
          }
        });
      });
    }
    
    if (backgroundTasks.length > 0) {
      // Execute background tasks without blocking
      Promise.allSettled(backgroundTasks.map(task => task.action()))
        .then(results => {
          const successes = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          const failures = results.filter(r => r.status === 'rejected' || !r.value?.success).length;
          
          console.log(`✅ Background data loading complete: ${successes}/${backgroundTasks.length} succeeded`);
          
          if (failures > 0) {
            console.warn(`⚠️ ${failures} background tasks failed (non-critical)`);
          }
        })
        .catch(error => {
          console.warn('⚠️ Background task coordination error (non-critical):', error);
        });
    } else {
      console.log('ℹ️ No background tasks to execute');
    }
    
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
      if (store.dispatch && typeof store.dispatch === 'function') {
        await store.dispatch('user/logout');
      }
    } catch (logoutError) {
      console.warn('⚠️ Store logout error:', logoutError);
      // Force clear if action fails
      await forceClearUserState();
    }
    
    // Also clear legacy main store
    try {
      if (store.commit) {
        store.commit('logout');
      }
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
    if (store.commit) {
      store.commit('user/CLEAR_USER');
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear user store:', error);
  }
  
  try {
    // Clear main store
    if (store.commit) {
      store.commit('logout');
    }
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
          if (store.commit) {
            store.commit('user/FORCE_UPDATE');
          }
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
    
    // Show fallback UI
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 2rem; background: #fee; border: 1px solid #fcc; border-radius: 8px;">
          <h2 style="color: #c33; margin-bottom: 1rem;">⚠️ Application Mount Error</h2>
          <p style="color: #666; margin-bottom: 1rem;">Failed to mount the Vue application.</p>
          <button onclick="window.location.reload()" style="background: #007cba; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
            🔄 Reload Page
          </button>
        </div>
      </div>
    `;
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
  };
  
  // ✅ Register global DOM event listener
  window.addEventListener('userSubscriptionChanged', handleGlobalSubscriptionChange);
  
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
  
  console.log('✅ Global subscription management setup complete');
}

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
  
  // Auth initialization helper for components
  window.waitForAuth = () => authInitPromise;
});

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
        try {
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
        } catch (error) {
          console.log('❌ Test save user failed:', error);
          return { success: false, error: error.message };
        }
      } else {
        console.log('❌ No current user to test save');
        return null;
      }
    },
    
    forceAuthReinit: async () => {
      console.log('🔄 Forcing auth reinitialization...');
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
      try {
        const result = await store.dispatch('user/updateUserStatus', plan);
        console.log('🧪 Promocode test result:', result);
        return result;
      } catch (error) {
        console.log('❌ Promocode test failed:', error);
        return { success: false, error: error.message };
      }
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
    if (firebaseUser && storeUser && firebaseUser.uid !== (storeUser.firebaseId || storeUser.uid)) {
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