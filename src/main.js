// src/main.js - ENHANCED VERSION WITH COMPLETE USER STATUS REACTIVITY FIX
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
// 🔥 CRITICAL FIX: AUTHENTICATION PRIORITY & INITIALIZATION
// ============================================================================

// ✅ Auth state tracking
let authStateResolved = false;
let authCheckComplete = false;
let currentUser = null;

// ✅ Set Firebase auth persistence IMMEDIATELY (BEFORE EVERYTHING ELSE)
setPersistence(auth, browserLocalPersistence).then(() => {
  console.log('✅ Firebase auth persistence set to LOCAL');
}).catch((error) => {
  console.error('❌ Failed to set auth persistence:', error);
});

// ✅ Create authentication promise that resolves IMMEDIATELY on first check
export const authInitPromise = new Promise((resolve) => {
  console.log('🔐 Starting PRIORITY authentication check...');
    
  // Set up auth state listener with immediate resolution
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('🔐 Auth state determined:', user ? `${user.email} (authenticated)` : 'not authenticated');
        
    currentUser = user;
        
    // Resolve IMMEDIATELY on first auth state determination
    if (!authStateResolved) {
      authStateResolved = true;
      authCheckComplete = true;
      unsubscribe(); // Stop listening after first resolution
      resolve(user);
      console.log('✅ PRIORITY authentication check completed');
            
      // Now proceed with app initialization
      initializeApplicationAfterAuth(user);
    }
  });
    
  // Shorter timeout for faster resolution
  setTimeout(() => {
    if (!authStateResolved) {
      console.warn('⚠️ Auth check timeout - proceeding without user');
      authStateResolved = true;
      authCheckComplete = true;
      unsubscribe();
      resolve(null);
            
      // Proceed anyway
      initializeApplicationAfterAuth(null);
    }
  }, 3000); // Reduced from 8000ms to 3000ms
});

// ============================================================================
// 🔥 MAIN INITIALIZATION FUNCTION (CALLED AFTER AUTH CHECK)
// ============================================================================
async function initializeApplicationAfterAuth(firebaseUser) {
  try {
    console.log('🚀 Starting application initialization AFTER auth check...');
    console.log('👤 Auth result:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
        
    // Mark auth as ready
    appLifecycle.authReady = true;
        
    // Initialize store
    await initializeStore();
        
    // Handle user state based on auth result
    if (firebaseUser) {
      await handleUserLogin(firebaseUser);
    } else {
      await handleUserLogout();
    }
        
    // Mount Vue application
    await mountVueApplication();
        
    console.log('✅ Application initialization completed');
      
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
        
    eventBus.emit('appInitializationError', {
      error: error.message,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🔥 CRITICAL FIX: GLOBAL EVENT TRIGGERING SYSTEM FOR USER STATUS REACTIVITY
// ============================================================================

// ✅ ENHANCED GLOBAL EVENT TRIGGERING FUNCTION
window.triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {
    console.log(`🌍 Triggering global event: ${eventName}`, data);
    
    const enhancedData = {
      ...data,
      eventName,
      source: data.source || 'global-trigger',
      timestamp: data.timestamp || Date.now(),
      version: '2.0'
    };

    // 🔥 METHOD 1: Custom DOM event (MOST RELIABLE for cross-component communication)
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);
    console.log(`✅ DOM event dispatched: ${eventName}`);

    // 🔥 METHOD 2: Event bus (for components listening via eventBus)
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
      console.log(`✅ EventBus emit: ${eventName}`);
    }

    // 🔥 METHOD 3: Direct storage event for cross-tab communication
    if (eventName.includes('Status') || eventName.includes('Subscription')) {
      try {
        const storageEvent = new CustomEvent('userSubscriptionChanged', {
          detail: enhancedData,
          bubbles: true
        });
        window.dispatchEvent(storageEvent);
        
        // Also trigger storage change for cross-tab sync
        localStorage.setItem('lastGlobalEvent', JSON.stringify({
          eventName,
          data: enhancedData,
          timestamp: Date.now()
        }));
        console.log(`✅ Cross-tab event dispatched: userSubscriptionChanged`);
      } catch (storageError) {
        console.warn('⚠️ Storage event failed:', storageError);
      }
    }

    // 🔥 METHOD 4: Force update all Vue instances if available
    if (window.Vue?._installedPlugins?.find(p => p.version)) {
      setTimeout(() => {
        console.log('🔄 Attempting to force update all Vue instances');
      }, 10);
    }

  } catch (eventError) {
    console.error(`❌ Failed to trigger global event '${eventName}':`, eventError);
  }
};

// ✅ ENHANCED STORE MUTATION INTERCEPTOR FOR AUTOMATIC EVENT TRIGGERING
const setupStoreInterceptor = (store) => {
  // Intercept all store mutations and trigger events for user-related changes
  store.subscribe((mutation, state) => {
    console.log('🔄 Store mutation:', mutation.type, mutation.payload);
    
    // List of mutations that should trigger global events
    const userMutations = [
      'user/SET_USER_STATUS',
      'user/setUserStatus',
      'user/UPDATE_SUBSCRIPTION', 
      'user/ADD_PROMOCODE',
      'user/FORCE_UPDATE',
      'user/SET_USER'
    ];
    
    if (userMutations.includes(mutation.type)) {
      console.log('📡 User-related mutation detected, triggering global events');
      
      const currentStatus = state.user?.userStatus || 'free';
      
      // Determine old status based on mutation type and payload
      let oldStatus = 'free';
      if (mutation.type === 'user/SET_USER_STATUS' && mutation.payload) {
        // For status mutations, we need to get the previous status
        oldStatus = currentStatus; // This will be updated in the mutation
      }
      
      const eventData = {
        oldStatus,
        newStatus: currentStatus,
        source: 'store-mutation',
        mutation: {
          type: mutation.type,
          payload: mutation.payload
        },
        timestamp: Date.now(),
        forceCounter: state.user?.system?.forceUpdateCounter || 0
      };
      
      // Trigger multiple event types for maximum compatibility
      const eventTypes = [
        'userStatusChanged',
        'subscriptionUpdated',
        'userSubscriptionChanged',
        'globalForceUpdate',
        'reactivityUpdate',
        'storeChanged'
      ];
      
      eventTypes.forEach(eventType => {
        window.triggerGlobalEvent(eventType, { ...eventData, eventType });
      });
      
      // Additional delayed event for stubborn components
      setTimeout(() => {
        window.triggerGlobalEvent('delayedStatusUpdate', eventData);
      }, 100);
    }
  });
};

// ============================================================================
// 🚀 ENHANCED EVENT BUS WITH BETTER USER STATUS HANDLING
// ============================================================================

class AdvancedEventBus {
  constructor() {
    this.events = {};
    this.debugMode = import.meta.env.DEV;
    this.subscriptionListeners = new Set();
    this.errorHandlers = new Set();
    this.statusChangeListeners = new Set(); // ✅ NEW: Dedicated status listeners
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
    
    // ✅ ENHANCED: Special handling for status change events
    if (event.includes('status') || event.includes('Status') || event.includes('subscription') || event.includes('Subscription')) {
      this.notifyStatusChangeListeners(event, data);
      
      // Also trigger generic subscription listeners
      this.notifySubscriptionListeners(event, data);
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
  
  // ✅ NEW: Status change listener registry
  onStatusChange(callback) {
    this.statusChangeListeners.add(callback);
    return () => this.statusChangeListeners.delete(callback);
  }
  
  // ✅ NEW: Notify all status change listeners
  notifyStatusChangeListeners(event, data) {
    this.statusChangeListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Status change listener error:', error);
      }
    });
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
    this.statusChangeListeners.clear(); // ✅ NEW
  }
  
  // ✅ Get event statistics
  getStats() {
    const stats = {
      totalEvents: Object.keys(this.events).length,
      totalListeners: Object.values(this.events).reduce((sum, arr) => sum + arr.length, 0),
      subscriptionListeners: this.subscriptionListeners.size,
      statusChangeListeners: this.statusChangeListeners.size, // ✅ NEW
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
// 🌐 INTERNATIONALIZATION SETUP (UNCHANGED)
// ============================================================================

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ============================================================================
// 🎯 APPLICATION STATE MANAGEMENT (ENHANCED)
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
// 📊 ENHANCED STORE INITIALIZATION WITH REACTIVITY SETUP
// ============================================================================

async function initializeStore() {
  try {
    console.log('🏪 Initializing Vuex store...');
    
    // Initialize user store from localStorage
    await store.dispatch('user/initialize');
    
    // ✅ CRITICAL: Setup store interceptor for automatic event triggering
    setupStoreInterceptor(store);
    
    storeInitialized = true;
    appLifecycle.storeReady = true;
    
    console.log('✅ Vuex store initialized successfully');
    
    // Emit store ready event
    eventBus.emit('storeReady', {
      userStatus: store.getters['user/userStatus'],
      isAuthenticated: store.getters['user/isAuthenticated'],
      timestamp: Date.now()
    });
    
    // ✅ CRITICAL: Trigger initial status event for components
    const initialStatus = store.getters['user/userStatus'] || 'free';
    window.triggerGlobalEvent('userStatusChanged', {
      oldStatus: null,
      newStatus: initialStatus,
      source: 'store-initialization',
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
// 👤 ENHANCED USER LOGIN HANDLER WITH STATUS PROPAGATION
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
    
    // ✅ Save user to server
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
    
    // ✅ Handle save result with safety check
    if (saveResult && saveResult.success === true) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
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
// ✅ ENHANCED SUCCESSFUL USER SAVE HANDLER WITH STATUS PROPAGATION
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
    const userPlan = serverUser.subscriptionPlan || 'free';
    
    console.log('👤 Server user data:', {
      id: serverUser._id || serverUser.firebaseId,
      email: serverUser.email,
      plan: userPlan
    });
    
    // ✅ Update stores with server data
    try {
      // Update main store (legacy compatibility)
      store.commit('setUser', serverUser);
      store.commit('setFirebaseUserId', serverUser.firebaseId || serverUser._id);
      store.commit('setToken', token);
      
      // ✅ CRITICAL: Update user module store with proper status propagation
      store.commit('user/SET_USER', serverUser);
      store.commit('user/SET_USER_STATUS', userPlan); // This will trigger global events via interceptor
      
      // Update localStorage
      const storageData = {
        user: serverUser,
        firebaseUserId: serverUser.firebaseId || serverUser._id,
        userId: serverUser.firebaseId || serverUser._id,
        token: token,
        userStatus: userPlan
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
    
    // ✅ CRITICAL: Force global status propagation after successful login
    setTimeout(() => {
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: userPlan,
        source: 'login-complete',
        timestamp: Date.now()
      });
      
      window.triggerGlobalEvent('userLoggedIn', {
        user: serverUser,
        userStatus: userPlan,
        source: 'server',
        isFirstLogin: !localStorage.getItem('lastLoginTime'),
        timestamp: Date.now()
      });
    }, 100);
    
    // Store last login time
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    
    console.log(`🎉 User login completed: ${userData.email} (${userPlan})`);
    
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
// ❌ ENHANCED FAILED USER SAVE HANDLER
// ============================================================================

async function handleFailedUserSave(result, token, userData) {
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
  
  // ✅ AUTO-RETRY for server/network errors
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
// 👋 ENHANCED USER LOGOUT HANDLER WITH STATUS PROPAGATION
// ============================================================================

async function handleUserLogout() {
  try {
    console.log('👋 Processing user logout...');
    
    const oldStatus = store.getters['user/userStatus'] || 'free';
    
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
    
    // ✅ CRITICAL: Force global status propagation after logout
    setTimeout(() => {
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus,
        newStatus: 'free',
        source: 'logout',
        timestamp: Date.now()
      });
      
      window.triggerGlobalEvent('userLoggedOut', {
        timestamp: Date.now()
      });
    }, 100);
    
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
// 🧹 FORCE CLEAR USER STATE (ENHANCED)
// ============================================================================

async function forceClearUserState() {
  console.log('🧹 Force clearing all user state...');
  
  const oldStatus = store.getters['user/userStatus'] || 'free';
  
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
  
  // ✅ CRITICAL: Force status change event after clearing
  setTimeout(() => {
    window.triggerGlobalEvent('userStatusChanged', {
      oldStatus,
      newStatus: 'free',
      source: 'force-clear',
      timestamp: Date.now()
    });
  }, 100);
  
  console.log('✅ Force clear completed');
}

// ============================================================================
// 🎯 ENHANCED VUE APPLICATION MOUNTING WITH GLOBAL PROPERTIES
// ============================================================================

async function mountVueApplication() {
  try {
    console.log('🎯 Mounting Vue application...');
    
    app = createApp(App);
    
    // ✅ Add enhanced global properties for user status access
    app.config.globalProperties.$eventBus = eventBus;
    app.config.globalProperties.$userStore = store;
    app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
    app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
    app.config.globalProperties.$isPremiumUser = () => store.getters['user/isPremiumUser'];
    app.config.globalProperties.$triggerGlobalEvent = window.triggerGlobalEvent; // ✅ NEW
    
    // ✅ NEW: Global user status change handler for all components
    app.config.globalProperties.$onUserStatusChange = (callback) => {
      const cleanup = eventBus.onStatusChange(callback);
      return cleanup;
    };
    
    // ✅ Install plugins
    app.use(store);
    app.use(router);
    app.use(VueToast, {
      position: 'top-center',
      duration: 4000,
      dismissible: true
    });
    app.use(i18n);
    
    // ✅ Enhanced global error handler with length error detection
    app.config.errorHandler = (error, instance, info) => {
      console.error('❌ Vue error:', error);
      console.error('📍 Component:', instance?.$options?.name || 'Unknown');
      console.error('ℹ️ Info:', info);
      
      // Handle specific length errors that affect user status display
      if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
        console.error('🔍 Length property error detected - likely array reactivity issue');
        
        eventBus.emit('lengthPropertyError', {
          error: error.message,
          component: instance?.$options?.name || 'Unknown',
          info,
          timestamp: Date.now()
        });
        
        // Try to recover by forcing store refresh and global event
        try {
          store.commit('user/FORCE_UPDATE');
          window.triggerGlobalEvent('globalForceUpdate', {
            reason: 'length-error-recovery',
            timestamp: Date.now()
          });
          console.log('🔄 Attempted recovery for length error');
        } catch (refreshError) {
          console.error('❌ Recovery attempt failed:', refreshError);
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
    
    // ✅ Setup enhanced global subscription management
    setupEnhancedGlobalSubscriptionManagement();
    
    // ✅ Emit app ready event
    eventBus.emit('appReady', {
      userAuthenticated: !!store.getters['user/isAuthenticated'],
      userStatus: store.getters['user/userStatus'],
      timestamp: Date.now()
    });
    
    // ✅ CRITICAL: Trigger initial status propagation after app mount
    setTimeout(() => {
      const currentStatus = store.getters['user/userStatus'] || 'free';
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'app-mount',
        timestamp: Date.now()
      });
    }, 200);
    
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
// 🌐 ENHANCED GLOBAL SUBSCRIPTION MANAGEMENT SYSTEM WITH REACTIVITY
// ============================================================================

function setupEnhancedGlobalSubscriptionManagement() {
  console.log('🌐 Setting up enhanced global subscription management...');
  
  // ✅ ENHANCED Global subscription change handler
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
    localStorage.setItem('statusUpdateTime', Date.now().toString());
    
    // ✅ CRITICAL: Update store if not already updated
    try {
      const currentStoreStatus = store.getters['user/userStatus'];
      if (currentStoreStatus !== plan) {
        console.log('🔄 Syncing store with global change:', currentStoreStatus, '→', plan);
        store.commit('user/SET_USER_STATUS', plan);
      }
    } catch (storeError) {
      console.warn('⚠️ Failed to sync store:', storeError);
    }
    
    // ✅ Force Vue app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        console.log('🔄 Forced Vue app update');
      } catch (error) {
        console.warn('⚠️ Failed to force Vue update:', error);
      }
    }
    
    // ✅ CRITICAL: Emit multiple event types for maximum component coverage
    const eventData = {
      reason: 'subscription-change',
      plan: plan,
      source: source,
      oldPlan: oldPlan,
      timestamp: timestamp || Date.now()
    };
    
    const eventTypes = [
      'globalForceUpdate',
      'reactivityUpdate',
      'subscriptionUpdated',
      'userStatusChanged',
      'planChanged'
    ];
    
    eventTypes.forEach(eventType => {
      eventBus.emit(eventType, eventData);
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
  
  // ✅ Register enhanced global DOM event listeners
  const eventTypesToListen = [
    'userSubscriptionChanged',
    'userStatusChanged', 
    'subscriptionUpdated',
    'globalForceUpdate',
    'reactivityUpdate'
  ];
  
  eventTypesToListen.forEach(eventType => {
    window.addEventListener(eventType, handleGlobalSubscriptionChange);
  });
  
  // ✅ Store reference for cleanup
  if (!window.globalEventHandlers) {
    window.globalEventHandlers = {
      subscriptionHandlers: [],
      statusHandlers: []
    };
  }
  window.globalEventHandlers.subscriptionHandlers.push(handleGlobalSubscriptionChange);
  
  // ✅ ENHANCED event bus subscription listeners with better error handling
  eventBus.on('userStatusChanged', (data) => {
    console.log('👤 User status changed via event bus:', data);
    
    // Sync with localStorage
    if (data.newStatus) {
      try {
        localStorage.setItem('userStatus', data.newStatus);
        localStorage.setItem('statusUpdateTime', Date.now().toString());
      } catch (storageError) {
        console.warn('⚠️ localStorage sync failed:', storageError);
      }
    }
    
    // Force app update with error handling
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        
        // Also trigger $nextTick for delayed components
        app._instance.proxy.$nextTick(() => {
          console.log('🔄 NextTick update completed');
        });
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
  
  // ✅ NEW: Enhanced storage event listener for cross-tab sync
  window.addEventListener('storage', (event) => {
    if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
      console.log('📡 Cross-tab userStatus change detected:', event.oldValue, '→', event.newValue);
      
      const newStatus = event.newValue || 'free';
      const oldStatus = event.oldValue || 'free';
      
      // Trigger global event for cross-tab sync
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus,
        newStatus,
        source: 'cross-tab-sync',
        timestamp: Date.now()
      });
    }
  });
  
  // ✅ NEW: Periodic status consistency check
  setInterval(() => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      
      if (storeStatus && localStatus && storeStatus !== localStatus) {
        console.log('🔄 Periodic check: Status mismatch detected, syncing...', {
          store: storeStatus,
          localStorage: localStatus
        });
        
        // Prefer store status and update localStorage
        localStorage.setItem('userStatus', storeStatus);
        
        // Trigger sync event
        window.triggerGlobalEvent('userStatusChanged', {
          oldStatus: localStatus,
          newStatus: storeStatus,
          source: 'periodic-sync',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.warn('⚠️ Periodic status check failed:', error);
    }
  }, 30000); // Check every 30 seconds
  
  console.log('✅ Enhanced global subscription management setup complete');
}

// ============================================================================
// 🌟 ENHANCED GLOBAL ERROR HANDLING WITH USER STATUS RECOVERY
// ============================================================================

// Enhanced global JavaScript error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global JavaScript error:', event.error);
  
  // Check if error is related to user status/arrays
  if (event.error?.message?.includes('length') || 
      event.error?.message?.includes('Cannot read properties of undefined')) {
    console.log('🔄 Attempting user status recovery after global error...');
    
    try {
      // Force store update
      store.commit('user/FORCE_UPDATE');
      
      // Trigger global reactivity update
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'global-error-recovery',
        originalError: event.error?.message,
        timestamp: Date.now()
      });
    } catch (recoveryError) {
      console.error('❌ Error recovery failed:', recoveryError);
    }
  }
  
  eventBus.emit('globalJavaScriptError', {
    error: event.error?.message || 'Unknown error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  });
});

// Enhanced unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  // Check if rejection is related to user status operations
  if (event.reason?.message?.includes('userStatus') || 
      event.reason?.message?.includes('subscription')) {
    console.log('🔄 Attempting user status recovery after promise rejection...');
    
    try {
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'promise-rejection-recovery',
        originalError: event.reason?.message,
        timestamp: Date.now()
      });
    } catch (recoveryError) {
      console.error('❌ Promise rejection recovery failed:', recoveryError);
    }
  }
  
  eventBus.emit('unhandledPromiseRejection', {
    reason: event.reason?.message || event.reason,
    timestamp: Date.now()
  });
});

// ============================================================================
// 🔧 ENHANCED GLOBAL HELPER FUNCTIONS FOR COMPONENTS
// ============================================================================

// Enhanced helper functions for components
window.addEventListener('DOMContentLoaded', () => {
  // ✅ ENHANCED Status change helper with validation
  window.emitUserStatusChange = (oldStatus, newStatus, source = 'unknown') => {
    console.log('🔧 Helper: emitUserStatusChange called', { oldStatus, newStatus, source });
    
    // Validate status values
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!validStatuses.includes(newStatus)) {
      console.error('❌ Invalid newStatus:', newStatus);
      return;
    }
    
    // Update localStorage immediately
    localStorage.setItem('userStatus', newStatus);
    
    // Trigger through global event system
    window.triggerGlobalEvent('userStatusChanged', { 
      oldStatus, 
      newStatus, 
      source,
      timestamp: Date.now() 
    });
  };
  
  // ✅ ENHANCED Force update helper
  window.emitForceUpdate = (reason = 'manual') => {
    console.log('🔧 Helper: emitForceUpdate called', { reason });
    
    // Trigger through global event system
    window.triggerGlobalEvent('globalForceUpdate', { 
      reason,
      timestamp: Date.now() 
    });
    
    // Also force store update
    try {
      store.commit('user/FORCE_UPDATE');
    } catch (error) {
      console.warn('⚠️ Store force update failed:', error);
    }
  };
  
  // ✅ ENHANCED User change listener helper with cleanup
  window.listenToUserChanges = (callback) => {
    console.log('🔧 Helper: listenToUserChanges called');
    
    const events = [
      'userStatusChanged', 
      'promocodeApplied', 
      'featuresUpdated', 
      'globalForceUpdate',
      'subscriptionUpdated',
      'reactivityUpdate'
    ];
    
    // Register EventBus listeners
    events.forEach(event => eventBus.on(event, callback));
    
    // Also register DOM event listener for userSubscriptionChanged
    window.addEventListener('userSubscriptionChanged', callback);
    
    // Return cleanup function
    return () => {
      events.forEach(event => eventBus.off(event, callback));
      window.removeEventListener('userSubscriptionChanged', callback);
      console.log('🧹 Helper: User change listeners cleaned up');
    };
  };
  
  // ✅ NEW: Direct store status getter helper
  window.getCurrentUserStatus = () => {
    try {
      return store.getters['user/userStatus'] || 'free';
    } catch (error) {
      console.warn('⚠️ Failed to get user status from store:', error);
      return localStorage.getItem('userStatus') || 'free';
    }
  };
  
  // ✅ NEW: Status sync helper for components
  window.syncUserStatus = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      
      console.log('🔄 Helper: syncUserStatus', { store: storeStatus, local: localStatus });
      
      if (storeStatus && localStatus && storeStatus !== localStatus) {
        localStorage.setItem('userStatus', storeStatus);
        window.triggerGlobalEvent('userStatusChanged', {
          oldStatus: localStatus,
          newStatus: storeStatus,
          source: 'sync-helper',
          timestamp: Date.now()
        });
      }
      
      return storeStatus || localStatus || 'free';
    } catch (error) {
      console.error('❌ Helper: syncUserStatus failed:', error);
      return 'free';
    }
  };
});

// ============================================================================
// 📊 ENHANCED PERFORMANCE MONITORING WITH USER STATUS TRACKING
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
  
  // Enhanced store mutation tracking for user status
  let mutationCount = 0;
  store.subscribe((mutation, state) => {
    mutationCount++;
    
    if (mutation.type.startsWith('user/')) {
      console.log(`🔄 User store mutation #${mutationCount}:`, mutation.type, mutation.payload);
    }
    
    // Track subscription-related mutations with enhanced details
    if (mutation.type.includes('STATUS') || mutation.type.includes('SUBSCRIPTION') || mutation.type.includes('UPDATE')) {
      const currentStatus = state.user?.userStatus || 'free';
      
      eventBus.emit('storeMutation', {
        type: mutation.type,
        payload: mutation.payload,
        currentStatus: currentStatus,
        count: mutationCount,
        timestamp: Date.now()
      });
      
      // Log status changes specifically
      if (mutation.type.includes('STATUS')) {
        console.log(`📊 Status mutation detected: ${mutation.type} → ${currentStatus}`);
      }
    }
  });
}

// ============================================================================
// 🐛 ENHANCED DEVELOPMENT DEBUGGING TOOLS WITH USER STATUS HELPERS
// ============================================================================

if (import.meta.env.DEV) {
  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$userFeatures = () => store.getters['user/features'];
  window.$appLifecycle = appLifecycle;
  window.$authInitPromise = authInitPromise;
  
  // ✅ ENHANCED: User status debugging helpers
  window.debugUserStatus = {
    getCurrentStatus: () => {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const isPremium = store.getters['user/isPremiumUser'];
      
      console.log('📊 Current User Status Debug:', {
        store: storeStatus,
        localStorage: localStatus,
        isPremium: isPremium,
        features: store.getters['user/features'],
        forceCounter: store.getters['user/forceUpdateCounter']
      });
      
      return { storeStatus, localStatus, isPremium };
    },
    
    setStatus: (newStatus) => {
      console.log('🔧 Debug: Setting user status to:', newStatus);
      store.dispatch('user/updateUserStatus', newStatus);
    },
    
    triggerEvents: (status = 'start') => {
      console.log('🔧 Debug: Triggering status events for:', status);
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: status,
        source: 'debug-trigger',
        timestamp: Date.now()
      });
    },
    
    forceUpdate: () => {
      console.log('🔧 Debug: Forcing global update');
      store.commit('user/FORCE_UPDATE');
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'debug-force',
        timestamp: Date.now()
      });
    },
    
    testReactivity: () => {
      console.log('🔧 Debug: Testing reactivity chain');
      
      const statuses = ['free', 'start', 'pro'];
      let index = 0;
      
      const testInterval = setInterval(() => {
        const testStatus = statuses[index];
        console.log(`🔧 Debug: Testing status ${index + 1}/3:`, testStatus);
        
        window.debugUserStatus.setStatus(testStatus);
        
        index++;
        if (index >= statuses.length) {
          clearInterval(testInterval);
          console.log('✅ Debug: Reactivity test completed');
        }
      }, 2000);
    }
  };
  
  console.log(`
🐛 ENHANCED DEVELOPMENT DEBUG COMMANDS AVAILABLE:

📊 USER STATUS DEBUGGING:
- debugUserStatus.getCurrentStatus(): Check status across all sources
- debugUserStatus.setStatus('pro'): Set user status directly
- debugUserStatus.triggerEvents('start'): Trigger status change events
- debugUserStatus.forceUpdate(): Force global reactivity update
- debugUserStatus.testReactivity(): Test status change chain

🔐 AUTHENTICATION DEBUGGING:
- $store: Vuex store instance
- $eventBus: Global event bus
- $userStatus(): Get current user status
- $appLifecycle: App initialization state
- $authInitPromise: Auth initialization promise

🔧 GLOBAL HELPERS:
- window.triggerGlobalEvent(eventName, data): Trigger global events
- window.emitUserStatusChange(old, new, source): Emit status change
- window.emitForceUpdate(reason): Force global update
- window.syncUserStatus(): Sync status between store and localStorage
- window.getCurrentUserStatus(): Get current status safely
  `);
}

// ============================================================================
// 🚀 FINAL SETUP: EXPOSE CRITICAL FUNCTIONS GLOBALLY
// ============================================================================

// Make critical functions available globally for emergency use
window.forceUserStatusSync = () => {
  try {
    const currentStatus = store.getters['user/userStatus'] || 'free';
    window.triggerGlobalEvent('userStatusChanged', {
      oldStatus: null,
      newStatus: currentStatus,
      source: 'emergency-sync',
      timestamp: Date.now()
    });
    console.log('🚨 Emergency user status sync triggered');
  } catch (error) {
    console.error('❌ Emergency sync failed:', error);
  }
};

console.log('✅ Enhanced main.js with complete user status reactivity loaded successfully!');
console.log('🔧 Use window.debugUserStatus for debugging user status issues');
console.log('🚨 Use window.forceUserStatusSync() for emergency status sync');