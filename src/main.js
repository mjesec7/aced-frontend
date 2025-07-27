// src/main.js - REFINED FOR STABLE AUTHENTICATION

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
// 🔥 CRITICAL FIX: RESTRUCTURED AUTHENTICATION & INITIALIZATION (APPLIED)
// ============================================================================

let authStateResolved = false;

// Set Firebase auth persistence immediately. This helps maintain the user's session across browser restarts.
setPersistence(auth, browserLocalPersistence)
  .then(() => {
      console.log('✅ Firebase auth persistence set to LOCAL.');
  })
  .catch((error) => {
      console.error('❌ Failed to set auth persistence:', error);
  });

// Create a promise that resolves once the authentication state is known.
// The router can wait for this promise before performing initial navigation to prevent race conditions.
export const authInitPromise = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    // This listener should only run once on the initial application load to prevent re-initialization.
    if (!authStateResolved) {
      authStateResolved = true;
      unsubscribe(); // Detach the listener after the first check.

      console.log('🔐 Auth state determined:', firebaseUser ? firebaseUser.email : 'not authenticated');
      
      try {
        // 1. Initialize the Vuex store from localStorage or default state.
        // This ensures the store is ready before any auth-dependent logic runs.
        await store.dispatch('user/initialize');
        
        // 2. Handle the user's authentication status based on the result from Firebase.
        if (firebaseUser) {
          // --- User is logged in with Firebase, now sync with app state ---
          try {
            const token = await firebaseUser.getIdToken();
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
            };
            
            // Attempt to sync user with your backend.
            const saveResult = await store.dispatch('user/saveUser', { userData, token });
  
            if (saveResult && saveResult.success) {
              // ✅ SUCCESS: Backend sync worked. The user is fully authenticated.
              console.log('✅ User state synced successfully with backend.');
            } else {
              // ⚠️ FALLBACK: Backend sync failed.
              console.warn('⚠️ Could not sync user with backend. Proceeding with local auth state.', saveResult?.error);
              
              // Set user in store directly from Firebase data so the app doesn't break.
              // This ensures the isAuthenticated getter will pass.
              store.commit('user/SET_USER', {
                  uid: firebaseUser.uid,
                  firebaseId: firebaseUser.uid,
                  _id: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                  subscriptionPlan: 'free', // Default to 'free' until successfully synced.
              });
            }
          } catch (error) {
              console.error("❌ A critical error occurred during user sync:", error);
              // If any part of the sync process fails, commit minimal data to keep the user logged in.
              store.commit('user/SET_USER', { uid: firebaseUser.uid, email: firebaseUser.email, _id: firebaseUser.uid });
          }
        } else {
          // --- User is NOT logged in with Firebase ---
          await store.dispatch('user/logout');
        }

        // 3. Now that auth is handled and the store is initialized, mount the Vue application.
        mountVueApplication();
        
        console.log('✅ Application initialization finished successfully.');
        resolve({ authenticated: !!firebaseUser, user: firebaseUser });

      } catch (error) {
        console.error('❌ Critical initialization failed:', error);
        
        // Even if initialization fails, we attempt to mount the app in a degraded state.
        mountVueApplication();
        resolve({ authenticated: false, error });
      }
    }
  });
});


// ============================================================================
// 🔥 ENHANCED STORE INITIALIZATION WITH BULLETPROOF ERROR HANDLING
// ============================================================================
async function ensureStoreInitialized() {
  console.log('🏪 Ensuring Vuex store is initialized...');
  
  try {
    // Check if store is already initialized
    if (store.getters['user/isInitialized']) {
      console.log('✅ Store already initialized');
      return true;
    }
    
    // Initialize the user store module
    await store.dispatch('user/initialize');
    
    // Setup store mutation interceptor for global events
    setupStoreInterceptor(store);
    
    // Mark as ready
    appLifecycle.storeReady = true;
    
    console.log('✅ Store initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Store initialization failed:', error);
    
    // Try to set basic store state manually
    try {
      store.commit('user/SET_INITIALIZED', false);
      console.log('⚠️ Set basic store state after initialization failure');
    } catch (commitError) {
      console.error('❌ Even basic store commit failed:', commitError);
    }
    
    throw error;
  }
}

// ============================================================================
// 🔥 ENHANCED USER AUTHENTICATION HANDLER
// ============================================================================
// Enhanced User Authentication Handler for main.js
// Replace the handleUserAuthenticated function with this improved version

async function handleUserAuthenticated(firebaseUser) {
  console.log('👤 Processing authenticated user:', firebaseUser.email);
  
  try {
    // Get Firebase ID token with retry
    let token;
    let tokenRetries = 3;
    
    while (tokenRetries > 0) {
      try {
        token = await firebaseUser.getIdToken(true); // Force refresh
        if (token && token.length > 20) {
          console.log('🔑 Firebase token obtained successfully');
          break;
        }
        throw new Error('Invalid token received');
      } catch (tokenError) {
        tokenRetries--;
        console.warn(`⚠️ Token attempt failed, ${tokenRetries} retries left:`, tokenError.message);
        
        if (tokenRetries === 0) {
          console.error('❌ Failed to get token, proceeding with basic auth...');
          // Don't fail the entire auth process, continue with basic user data
          await handleBasicUserAuthentication(firebaseUser);
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Prepare user data
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      lastLoginAt: new Date().toISOString()
    };
    
    console.log('💾 Saving authenticated user to server...', {
      email: userData.email,
      uid: userData.uid
    });
    
    // ✅ ENHANCED: Try to save user with better error handling
    let saveResult;
    let saveRetries = 2;
    
    while (saveRetries > 0) {
      try {
        console.log(`🔄 Save attempt ${3 - saveRetries + 1}/3...`);
        
        saveResult = await store.dispatch('user/saveUser', { userData, token });
        
        console.log('📊 Save result received:', {
          hasResult: !!saveResult,
          resultType: typeof saveResult,
          success: saveResult?.success,
          hasUser: !!saveResult?.user,
          error: saveResult?.error
        });
        
        // ✅ CRITICAL: Check if we got a valid result
        if (!saveResult) {
          console.error('❌ Save returned undefined result');
          throw new Error('Save action returned undefined result');
        }
        
        if (typeof saveResult !== 'object') {
          console.error('❌ Save returned non-object result:', typeof saveResult);
          throw new Error(`Save action returned ${typeof saveResult} instead of object`);
        }
        
        if (saveResult.success === true && saveResult.user) {
          console.log('✅ User saved successfully on attempt', 3 - saveRetries + 1);
          break;
        } else if (saveResult.success === false) {
          console.warn('⚠️ Server returned failure:', saveResult.error);
          
          // For server failures, try basic auth instead of retrying
          if (saveRetries === 1) {
            console.log('🔄 Server save failed, falling back to basic auth...');
            await handleBasicUserAuthentication(firebaseUser, token);
            return;
          }
          
          throw new Error(saveResult.error || 'Server returned failure');
        } else {
          console.warn('⚠️ Invalid save result structure:', saveResult);
          throw new Error('Invalid server response structure');
        }
        
      } catch (saveError) {
        saveRetries--;
        console.warn(`⚠️ Save attempt failed, ${saveRetries} retries left:`, saveError.message);
        
        if (saveRetries === 0) {
          console.error('❌ All save attempts failed, falling back to basic auth...');
          await handleBasicUserAuthentication(firebaseUser, token);
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // ✅ ENHANCED: Handle successful save
    if (saveResult && saveResult.success && saveResult.user) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
      console.error('❌ Unexpected save result state:', saveResult);
      await handleBasicUserAuthentication(firebaseUser, token);
    }
    
  } catch (error) {
    console.error('❌ User authentication handling failed:', error);
    
    // Last resort: try basic authentication
    try {
      await handleBasicUserAuthentication(firebaseUser);
    } catch (basicError) {
      console.error('❌ Even basic authentication failed:', basicError);
      await handleUserNotAuthenticated();
    }
  }
}

// ✅ NEW: Basic user authentication fallback
async function handleBasicUserAuthentication(firebaseUser, token = null) {
  console.log('🔧 Using basic user authentication fallback...');
  
  try {
    // Create basic user object
    const basicUser = {
      firebaseId: firebaseUser.uid,
      _id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      displayName: firebaseUser.displayName || '',
      subscriptionPlan: 'free',
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      lastLoginAt: new Date().toISOString(),
      metadata: {
        lastSync: new Date().toISOString(),
        syncSource: 'basic-auth',
        fallback: true
      }
    };
    
    // Update stores with basic data
    store.commit('setUser', basicUser);
    store.commit('setFirebaseUserId', basicUser.firebaseId);
    if (token) {
      store.commit('setToken', token);
    }
    
    // Update user module store
    store.commit('user/SET_USER', basicUser);
    store.commit('user/SET_USER_STATUS', 'free');
    
    // Update localStorage
    try {
      localStorage.setItem('user', JSON.stringify(basicUser));
      localStorage.setItem('firebaseUserId', basicUser.firebaseId);
      localStorage.setItem('userId', basicUser.firebaseId);
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('userStatus', 'free');
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      localStorage.setItem('authMode', 'basic');
    } catch (storageError) {
      console.warn('⚠️ Failed to update localStorage in basic mode:', storageError);
    }
    
    // Mark auth as ready
    appLifecycle.authReady = true;
    
    console.log('✅ Basic user authentication completed:', {
      email: basicUser.email,
      id: basicUser.firebaseId,
      mode: 'basic'
    });
    
    // Trigger events
    setTimeout(() => {
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: 'free',
        source: 'basic-auth',
        timestamp: Date.now()
      });
      
      triggerGlobalEvent('userLoggedIn', {
        user: basicUser,
        userStatus: 'free',
        source: 'basic',
        mode: 'fallback',
        timestamp: Date.now()
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Basic authentication also failed:', error);
    throw error;
  }
}

// ✅ ENHANCED: Successful user save handler
async function handleSuccessfulUserSave(result, token, userData) {
  try {
    console.log('✅ User saved to server successfully');
    
    const serverUser = result.user;
    const userPlan = serverUser.subscriptionPlan || 'free';
    
    console.log('👤 Server user data:', {
      id: serverUser._id || serverUser.firebaseId,
      email: serverUser.email,
      plan: userPlan
    });
    
    // Update stores with server data
    try {
      // Update main store (legacy compatibility)
      store.commit('setUser', serverUser);
      store.commit('setFirebaseUserId', serverUser.firebaseId || serverUser._id);
      store.commit('setToken', token);
      
      // Update user module store
      store.commit('user/SET_USER', serverUser);
      store.commit('user/SET_USER_STATUS', userPlan);
      
      // Update localStorage
      const storageData = {
        user: serverUser,
        firebaseUserId: serverUser.firebaseId || serverUser._id,
        userId: serverUser.firebaseId || serverUser._id,
        token: token,
        userStatus: userPlan,
        authMode: 'server'
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
    
    // Mark auth as ready
    appLifecycle.authReady = true;
    
    // Force global status propagation after successful login
    setTimeout(() => {
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: userPlan,
        source: 'login-complete',
        timestamp: Date.now()
      });
      
      triggerGlobalEvent('userLoggedIn', {
        user: serverUser,
        userStatus: userPlan,
        source: 'server',
        timestamp: Date.now()
      });
    }, 100);
    
    // Store last login time
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    
    console.log(`🎉 User login completed: ${userData.email} (${userPlan})`);
    
  } catch (error) {
    console.error('❌ Error in successful save handler:', error);
    
    // Fallback to basic auth even after successful save
    try {
      await handleBasicUserAuthentication({ 
        uid: result.user?.firebaseId || result.user?._id,
        email: result.user?.email || userData.email,
        displayName: result.user?.name || userData.name,
        emailVerified: result.user?.emailVerified || userData.emailVerified,
        photoURL: result.user?.photoURL || userData.photoURL
      }, token);
    } catch (fallbackError) {
      console.error('❌ Fallback authentication failed:', fallbackError);
    }
  }
}

// ✅ ENHANCED: Error recovery with user status sync
async function recoverUserStatus() {
  console.log('🔧 Attempting user status recovery...');
  
  try {
    // Try to get status from localStorage first
    const localStatus = localStorage.getItem('userStatus') || 'free';
    const localUser = localStorage.getItem('user');
    
    if (localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        
        // Update store with cached data
        store.commit('user/SET_USER', parsedUser);
        store.commit('user/SET_USER_STATUS', localStatus);
        
        console.log('✅ User status recovered from cache:', {
          email: parsedUser.email,
          status: localStatus
        });
        
        // Trigger status change event
        setTimeout(() => {
          triggerGlobalEvent('userStatusChanged', {
            oldStatus: null,
            newStatus: localStatus,
            source: 'recovery',
            timestamp: Date.now()
          });
        }, 100);
        
        return true;
        
      } catch (parseError) {
        console.warn('⚠️ Failed to parse cached user:', parseError);
      }
    }
    
    // If no cached data, set default state
    store.commit('user/SET_USER_STATUS', 'free');
    store.commit('user/CLEAR_USER');
    
    console.log('⚠️ No recoverable user data, set to default state');
    
    setTimeout(() => {
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: 'free',
        source: 'recovery-default',
        timestamp: Date.now()
      });
    }, 100);
    
    return false;
    
  } catch (error) {
    console.error('❌ User status recovery failed:', error);
    return false;
  }
}

// ✅ ENHANCED: Debug functions for troubleshooting
window.debugAuth = {
  ...window.debugAuth,
  
  recoverUserStatus: () => {
    return recoverUserStatus();
  },
  
  testSaveUser: async () => {
    try {
      const testUser = {
        uid: 'test-uid-' + Date.now(),
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      const testToken = 'test-token-' + Date.now();
      
      console.log('🧪 Testing saveUser action...');
      const result = await store.dispatch('user/saveUser', { 
        userData: testUser, 
        token: testToken 
      });
      
      console.log('🧪 Test result:', result);
      return result;
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  forceBasicAuth: () => {
    console.log('🔧 Forcing basic authentication mode...');
    
    const mockUser = {
      uid: 'mock-user-' + Date.now(),
      email: 'mock@example.com',
      displayName: 'Mock User',
      emailVerified: true,
      photoURL: null
    };
    
    return handleBasicUserAuthentication(mockUser);
  },
  
  clearAuthState: () => {
    console.log('🧹 Clearing all authentication state...');
    
    try {
      // Clear store
      store.commit('user/CLEAR_USER');
      store.commit('logout');
      
      // Clear localStorage
      const keysToRemove = [
        'user', 'firebaseUserId', 'userId', 'token', 
        'userStatus', 'lastLoginTime', 'authMode'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('✅ Authentication state cleared');
      
      // Trigger events
      setTimeout(() => {
        triggerGlobalEvent('userStatusChanged', {
          oldStatus: null,
          newStatus: 'free',
          source: 'debug-clear',
          timestamp: Date.now()
        });
      }, 100);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to clear auth state:', error);
      return false;
    }
  },
  
  getDetailedAuthState: () => {
    return {
      store: {
        user: store.getters['user/getUser'],
        userStatus: store.getters['user/userStatus'],
        isAuthenticated: store.getters['user/isAuthenticated'],
        isInitialized: store.getters['user/isInitialized']
      },
      localStorage: {
        user: localStorage.getItem('user'),
        userStatus: localStorage.getItem('userStatus'),
        token: localStorage.getItem('token'),
        authMode: localStorage.getItem('authMode')
      },
      lifecycle: appLifecycle,
      authResolved: authStateResolved
    };
  }
};

// ============================================================================
// 🔥 ENHANCED USER NOT AUTHENTICATED HANDLER
// ============================================================================
async function handleUserNotAuthenticated() {
  console.log('👋 Processing non-authenticated state...');
  
  try {
    // Clear user data through store actions
    await store.dispatch('user/logout');
    
    // Also clear legacy main store
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
    
    // Set default state
    store.commit('user/SET_USER_STATUS', 'free');
    
    // Mark auth as ready (even for non-authenticated users)
    appLifecycle.authReady = true;
    
    console.log('✅ Non-authenticated state processed successfully');
    
    // Trigger events
    setTimeout(() => {
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: 'free',
        source: 'not-authenticated',
        timestamp: Date.now()
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ Error handling non-authenticated state:', error);
    
    // Force basic state
    try {
      store.commit('user/CLEAR_USER');
      localStorage.clear();
    } catch (clearError) {
      console.error('❌ Even force clear failed:', clearError);
    }
    
    appLifecycle.authReady = true; // Always mark as ready to prevent hanging
  }
}

let app; // To hold the Vue app instance.
let isApplicationMounted = false;

/**
 * Creates and mounts the Vue application.
 * This function is called only after authentication and store initialization are complete.
 * It also prevents the app from being mounted more than once.
 */
function mountVueApplication() {
    if (app) {
        console.warn('⚠️ Attempted to mount Vue application multiple times.');
        return; // Prevent double mounting.
    }

    app = createApp(App);

    // Setup i18n for internationalization.
    const i18n = createI18n({
        legacy: false, // Use the new Composition API mode.
        locale: localStorage.getItem('lang') || 'ru', // Default to 'ru' or saved language.
        fallbackLocale: 'en', // Fallback to English if a translation is missing.
        messages,
    });
    
    // Register plugins with the Vue app.
    app.use(store);
    app.use(router);
    app.use(VueToast, { position: 'top-center', duration: 4000, dismissible: true });
    app.use(i18n);

    // Add enhanced global properties
    app.config.globalProperties.$eventBus = eventBus;
    app.config.globalProperties.$userStore = store;
    app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
    app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
    app.config.globalProperties.$isPremiumUser = () => store.getters['user/isPremiumUser'];
    app.config.globalProperties.$triggerGlobalEvent = window.triggerGlobalEvent;
    app.config.globalProperties.$onUserStatusChange = (callback) => {
      const cleanup = eventBus.onStatusChange(callback);
      return cleanup;
    };

    // Global error handler to catch unhandled errors in any component.
    app.config.errorHandler = (err, instance, info) => {
        console.error('❌ Vue Error:', err);
        console.error('📍 Component:', instance?.$options?.name || 'Unknown');
        console.error('ℹ️ Info:', info);
        // In a production environment, you would log this to a service like Sentry or Datadog.
    };

    // Mount the app to the DOM.
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;

    console.log('🚀 Vue application mounted.');

    // Setup global subscription management
    setupEnhancedGlobalSubscriptionManagement();
    
    // Mark app as fully initialized
    appLifecycle.initialized = true;
    
    // Emit app ready event
    eventBus.emit('appReady', {
      userAuthenticated: !!store.getters['user/isAuthenticated'],
      userStatus: store.getters['user/userStatus'],
      timestamp: Date.now()
    });
}


// ============================================================================
// 🔥 ENHANCED GLOBAL EVENT TRIGGERING SYSTEM
// ============================================================================

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

    // Multiple event dispatch methods for maximum compatibility
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);

    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
    }

    // Cross-tab communication for important events
    if (eventName.includes('Status') || eventName.includes('Subscription')) {
      try {
        const storageEvent = new CustomEvent('userSubscriptionChanged', {
          detail: enhancedData,
          bubbles: true
        });
        window.dispatchEvent(storageEvent);
        
        localStorage.setItem('lastGlobalEvent', JSON.stringify({
          eventName,
          data: enhancedData,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.warn('⚠️ Storage event failed:', storageError);
      }
    }

    console.log(`✅ Global event dispatched: ${eventName}`);

  } catch (eventError) {
    console.error(`❌ Failed to trigger global event '${eventName}':`, eventError);
  }
};

// ============================================================================
// 🔥 STORE MUTATION INTERCEPTOR FOR AUTOMATIC EVENT TRIGGERING
// ============================================================================
const setupStoreInterceptor = (store) => {
  store.subscribe((mutation, state) => {
    console.log('🔄 Store mutation:', mutation.type, mutation.payload);
    
    // User-related mutations that should trigger global events
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
      let oldStatus = 'free';
      
      if (mutation.type === 'user/SET_USER_STATUS' && mutation.payload) {
        oldStatus = currentStatus;
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
      
      // Trigger multiple event types for compatibility
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
      
      // Delayed event for stubborn components
      setTimeout(() => {
        window.triggerGlobalEvent('delayedStatusUpdate', eventData);
      }, 100);
    }
  });
};

// ============================================================================
// 🚀 ENHANCED EVENT BUS
// ============================================================================
class AdvancedEventBus {
  constructor() {
    this.events = {};
    this.debugMode = import.meta.env.DEV;
    this.subscriptionListeners = new Set();
    this.errorHandlers = new Set();
    this.statusChangeListeners = new Set();
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
    
    if (event.includes('status') || event.includes('Status') || event.includes('subscription') || event.includes('Subscription')) {
      this.notifyStatusChangeListeners(event, data);
      this.notifySubscriptionListeners(event, data);
    }
    
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
  
  onStatusChange(callback) {
    this.statusChangeListeners.add(callback);
    return () => this.statusChangeListeners.delete(callback);
  }
  
  notifyStatusChangeListeners(event, data) {
    this.statusChangeListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('❌ Status change listener error:', error);
      }
    });
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
    this.statusChangeListeners.clear();
  }
}

// Create and export global event bus
const eventBus = new AdvancedEventBus();
window.eventBus = eventBus;
export { eventBus };


// ============================================================================
// 🎯 APPLICATION STATE MANAGEMENT
// ============================================================================
// Track app lifecycle
const appLifecycle = {
  initialized: false,
  mounted: false,
  authReady: false,
  storeReady: false
};

// ============================================================================
// 🌐 ENHANCED GLOBAL SUBSCRIPTION MANAGEMENT
// ============================================================================
function setupEnhancedGlobalSubscriptionManagement() {
  console.log('🌐 Setting up enhanced global subscription management...');
  
  const handleGlobalSubscriptionChange = (event) => {
    console.log('📡 Global subscription change detected:', event.detail);
    
    const { plan, source, oldPlan, timestamp } = event.detail;
    
    // Update page title
    const planLabel = plan === 'pro' ? 'Pro' : plan === 'start' ? 'Start' : 'Free';
    if (document.title && !document.title.includes('|')) {
      document.title = `ACED | ${planLabel}`;
    }
    
    // Update body classes for CSS styling
    document.body.className = document.body.className.replace(/user-plan-\w+/g, '');
    document.body.classList.add(`user-plan-${plan}`);
    
    // Update localStorage immediately
    localStorage.setItem('userStatus', plan);
    localStorage.setItem('statusUpdateTime', Date.now().toString());
    
    // Update store if not already updated
    try {
      const currentStoreStatus = store.getters['user/userStatus'];
      if (currentStoreStatus !== plan) {
        console.log('🔄 Syncing store with global change:', currentStoreStatus, '→', plan);
        store.commit('user/SET_USER_STATUS', plan);
      }
    } catch (storeError) {
      console.warn('⚠️ Failed to sync store:', storeError);
    }
    
    // Force Vue app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        console.log('🔄 Forced Vue app update');
      } catch (error) {
        console.warn('⚠️ Failed to force Vue update:', error);
      }
    }
    
    // Emit multiple event types for maximum component coverage
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
    
    // Show celebration for upgrades
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
  
  // Register enhanced global DOM event listeners
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
  
  // Store reference for cleanup
  if (!window.globalEventHandlers) {
    window.globalEventHandlers = {
      subscriptionHandlers: [],
      statusHandlers: []
    };
  }
  window.globalEventHandlers.subscriptionHandlers.push(handleGlobalSubscriptionChange);
  
  // Enhanced event bus subscription listeners
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
  
  // Enhanced storage event listener for cross-tab sync
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
  
  // Periodic status consistency check
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
// 🌟 ENHANCED GLOBAL ERROR HANDLING
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
// 🔧 ENHANCED GLOBAL HELPER FUNCTIONS
// ============================================================================

// Enhanced helper functions for components
window.addEventListener('DOMContentLoaded', () => {
  // Enhanced Status change helper with validation
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
  
  // Enhanced Force update helper
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
  
  // Enhanced User change listener helper with cleanup
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
  
  // Direct store status getter helper
  window.getCurrentUserStatus = () => {
    try {
      return store.getters['user/userStatus'] || 'free';
    } catch (error) {
      console.warn('⚠️ Failed to get user status from store:', error);
      return localStorage.getItem('userStatus') || 'free';
    }
  };
  
  // Status sync helper for components
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

// Development debugging tools
if (import.meta.env.DEV) {
  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$appLifecycle = appLifecycle;
  window.$authInitPromise = authInitPromise;
  
  // Enhanced debugging helpers
  window.debugAuth = {
    getAuthState: () => ({
      authStateResolved,
      appLifecycle,
      currentUser: store.getters['user/getUser'],
      userStatus: store.getters['user/userStatus'],
      isAuthenticated: store.getters['user/isAuthenticated']
    }),
    
    forceAuthComplete: () => {
      if (!authStateResolved && authResolveFunction) {
        authStateResolved = true;
        authResolveFunction({
          authenticated: false,
          user: null,
          appReady: true,
          forced: true,
          timestamp: Date.now()
        });
        console.log('🔧 Debug: Forced auth completion');
      }
    },
    
    testAuthFlow: async () => {
      console.log('🔧 Debug: Testing auth flow...');
      try {
        await authInitPromise;
        console.log('✅ Debug: Auth promise resolved successfully');
      } catch (error) {
        console.error('❌ Debug: Auth promise failed:', error);
      }
    }
  };
  
  console.log(`
🐛 ENHANCED DEVELOPMENT DEBUG COMMANDS AVAILABLE:

🔐 AUTHENTICATION DEBUGGING:
- debugAuth.getAuthState(): Check current auth state
- debugAuth.forceAuthComplete(): Force auth completion (emergency)
- debugAuth.testAuthFlow(): Test auth promise resolution
- $authInitPromise: Auth initialization promise

📊 USER STATUS DEBUGGING:
- $userStatus(): Get current user status
- window.getCurrentUserStatus(): Safe status getter
- window.syncUserStatus(): Sync status between store and localStorage
- window.forceUserStatusSync(): Emergency status sync

🔧 GLOBAL HELPERS:
- window.triggerGlobalEvent(eventName, data): Trigger global events
- window.emitUserStatusChange(old, new, source): Emit status change
- window.emitForceUpdate(reason): Force global update
- window.listenToUserChanges(callback): Listen to user changes

⚠️ EMERGENCY FUNCTIONS:
- window.forceUserStatusSync(): Emergency status sync
- debugAuth.forceAuthComplete(): Force auth completion
  `);
}

console.log('✅ Enhanced main.js with bulletproof authentication loaded successfully!');
console.log('🔧 Authentication will complete BEFORE router navigation begins');
console.log('🚨 Use debugAuth.* functions for authentication debugging');
