// src/main.js - COMPLETELY FIXED WITH BULLETPROOF ERROR HANDLING
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

// ✅ BULLETPROOF EVENT BUS SETUP
class SimpleEventBus {
  constructor() {
    this.events = {};
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event bus error for "${event}":`, error);
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
  
  clear() {
    this.events = {};
  }
}

// Create global event bus
const eventBus = new SimpleEventBus();
window.eventBus = eventBus;

// ✅ i18n Setup
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ✅ APP INITIALIZATION
let app;
let isAppMounted = false;

// ✅ INITIALIZE USER STORE FIRST
async function initializeApp() {
  try {
    console.log('🚀 Initializing application...');
    
    // Initialize user store from localStorage
    await store.dispatch('user/initialize');
    
    console.log('✅ User store initialized');
    
  } catch (error) {
    console.error('❌ App initialization error:', error);
  }
}

// ✅ COMPLETELY BULLETPROOF FIREBASE AUTH HANDLER
onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    if (firebaseUser) {
      console.log('🔥 Firebase user authenticated:', firebaseUser.email);
      
      // ✅ BULLETPROOF: Get ID token with proper error handling
      let token;
      try {
        token = await firebaseUser.getIdToken();
        console.log('🔑 Firebase token obtained successfully');
      } catch (tokenError) {
        console.error('❌ Failed to get Firebase token:', tokenError);
        
        // Clear existing state and show error
        store.commit('user/CLEAR_USER');
        store.commit('logout');
        
        eventBus.emit('userLoginError', {
          error: 'Failed to get authentication token. Please try logging in again.',
          isTokenError: true,
          canRetry: true,
          timestamp: Date.now()
        });
        
        return; // Exit early - can't proceed without token
      }
      
      // ✅ BULLETPROOF: Prepare user data for server
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL
      };
      
      console.log('💾 Saving user to server...', { email: userData.email, uid: userData.uid });
      
      // ✅ BULLETPROOF: SAVE USER TO SERVER WITH COMPREHENSIVE ERROR HANDLING
      let result;
      try {
        result = await store.dispatch('user/saveUser', { userData, token });
        console.log('📊 SaveUser result:', { 
          hasResult: !!result, 
          resultType: typeof result, 
          hasSuccess: result?.hasOwnProperty('success'),
          success: result?.success 
        });
        
      } catch (dispatchError) {
        console.error('❌ Store dispatch error:', dispatchError);
        // ✅ BULLETPROOF: Ensure we always have a result object
        result = { 
          success: false, 
          error: dispatchError.message || 'Failed to save user to server',
          user: null,
          isDispatchError: true
        };
      }
      
      // ✅ BULLETPROOF: ULTRA-SAFE RESULT VALIDATION
      if (!result) {
        console.error('❌ Result is null/undefined from saveUser');
        result = { 
          success: false, 
          error: 'No response from user save operation',
          user: null 
        };
      }
      
      if (typeof result !== 'object') {
        console.error('❌ Result is not an object:', { result, type: typeof result });
        result = { 
          success: false, 
          error: 'Invalid response type from server',
          user: null,
          originalResult: result
        };
      }
      
      if (!result.hasOwnProperty('success')) {
        console.error('❌ Result missing success property:', { 
          result, 
          keys: Object.keys(result || {}) 
        });
        result = { 
          success: false, 
          error: 'Malformed server response',
          user: null,
          originalResult: result
        };
      }
      
      // ✅ BULLETPROOF: HANDLE SUCCESSFUL SERVER SAVE
      if (result.success === true) {
        console.log('✅ User saved to server successfully');
        
        // Validate that we have user data
        if (!result.user || typeof result.user !== 'object') {
          console.error('❌ Success response missing user data:', result);
          
          eventBus.emit('userLoginError', {
            error: 'Server saved user but returned invalid data. Please refresh the page.',
            isDataError: true,
            timestamp: Date.now()
          });
          return;
        }
        
        console.log('👤 User data received from server:', {
          id: result.user._id || result.user.firebaseId,
          email: result.user.email,
          plan: result.user.subscriptionPlan
        });
        
        // ✅ BULLETPROOF: Update main store with server data (with error handling)
        try {
          store.commit('setUser', result.user);
          store.commit('setFirebaseUserId', result.user.firebaseId || result.user._id);
          store.commit('setToken', token);
          
          // Store minimal data in localStorage
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('firebaseUserId', result.user.firebaseId || result.user._id);
          localStorage.setItem('token', token);
          
          console.log('✅ User state updated successfully');
        } catch (storeUpdateError) {
          console.error('❌ Failed to update store:', storeUpdateError);
          // Don't fail the entire login for store update errors
        }
        
        // ✅ Emit success event
        eventBus.emit('userLoggedIn', {
          user: result.user,
          userStatus: store.getters['user/userStatus'],
          source: 'server',
          timestamp: Date.now()
        });
        
      } else {
        // ✅ BULLETPROOF: HANDLE FAILED SERVER SAVE
        const errorMessage = result.error || 'Failed to save user to server';
        console.error('❌ Failed to save user to server:', {
          error: errorMessage,
          statusCode: result.statusCode,
          isDispatchError: result.isDispatchError
        });
        
        // Clear any existing user state to prevent inconsistent state
        try {
          store.commit('user/CLEAR_USER');
          store.commit('logout');
        } catch (clearError) {
          console.error('❌ Failed to clear user state:', clearError);
        }
        
        // Emit error event with detailed information
        eventBus.emit('userLoginError', {
          error: errorMessage,
          isServerError: true,
          canRetry: true,
          statusCode: result.statusCode,
          isDispatchError: result.isDispatchError,
          timestamp: Date.now()
        });
        
        // ✅ BULLETPROOF: AUTO-RETRY LOGIC for temporary server failures
        const shouldRetry = (
          result.statusCode >= 500 || // Server errors
          !result.statusCode ||       // Network errors
          result.isDispatchError      // Dispatch errors
        );
        
        if (shouldRetry) {
          console.log('🔄 Server/network error detected, will retry in 3 seconds...');
          
          setTimeout(async () => {
            try {
              console.log('🔄 Retrying user save to server...');
              const retryResult = await store.dispatch('user/saveUser', { userData, token });
              
              // ✅ BULLETPROOF: Validate retry result
              if (retryResult && typeof retryResult === 'object' && 
                  retryResult.success === true && retryResult.user) {
                console.log('✅ Retry successful');
                
                // Update store with retry result
                try {
                  store.commit('setUser', retryResult.user);
                  store.commit('setFirebaseUserId', retryResult.user.firebaseId || retryResult.user._id);
                  store.commit('setToken', token);
                  
                  // Update localStorage
                  localStorage.setItem('user', JSON.stringify(retryResult.user));
                  localStorage.setItem('firebaseUserId', retryResult.user.firebaseId || retryResult.user._id);
                  localStorage.setItem('token', token);
                  
                  // Emit success events
                  eventBus.emit('userLoggedIn', {
                    user: retryResult.user,
                    userStatus: store.getters['user/userStatus'],
                    source: 'server-retry',
                    timestamp: Date.now()
                  });
                  
                  eventBus.emit('userLoginRetrySuccess', {
                    message: 'Successfully connected to server after retry',
                    timestamp: Date.now()
                  });
                } catch (retryStoreError) {
                  console.error('❌ Retry store update failed:', retryStoreError);
                  eventBus.emit('userLoginRetryFailed', {
                    error: 'Retry succeeded but failed to update local data',
                    isStoreError: true,
                    timestamp: Date.now()
                  });
                }
                
              } else {
                console.error('❌ Retry also failed:', retryResult);
                eventBus.emit('userLoginRetryFailed', {
                  error: retryResult?.error || 'Server retry failed',
                  finalFailure: true,
                  timestamp: Date.now()
                });
              }
            } catch (retryError) {
              console.error('❌ Retry exception:', retryError);
              eventBus.emit('userLoginRetryFailed', {
                error: retryError.message || 'Retry operation failed',
                isException: true,
                timestamp: Date.now()
              });
            }
          }, 3000);
        }
      }
      
    } else {
      // ✅ BULLETPROOF: USER LOGGED OUT
      console.log('👋 User logged out from Firebase');
      
      try {
        // Clear user data from server and local store
        await store.dispatch('user/logout');
        
        // Also clear main store for backward compatibility
        try {
          store.commit('logout');
        } catch (mainStoreError) {
          console.warn('⚠️ Main store logout warning:', mainStoreError);
        }
        
        console.log('✅ Logout completed successfully');
      } catch (logoutError) {
        console.error('❌ Logout error:', logoutError);
        // ✅ BULLETPROOF: Force clear even if logout action fails
        try {
          store.commit('user/CLEAR_USER');
          store.commit('logout');
        } catch (forceClearError) {
          console.error('❌ Force clear also failed:', forceClearError);
        }
      }
      
      // Emit logout event
      eventBus.emit('userLoggedOut', {
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Critical auth state change error:', error);
    
    // ✅ BULLETPROOF: COMPREHENSIVE ERROR RECOVERY
    if (firebaseUser) {
      console.log('🚨 Critical auth error occurred, clearing all user state...');
      
      // Clear all user state - don't attempt recovery for critical errors
      try {
        store.commit('user/CLEAR_USER');
      } catch (clearUserError) {
        console.error('❌ Failed to clear user store:', clearUserError);
      }
      
      try {
        store.commit('logout');
      } catch (clearMainError) {
        console.error('❌ Failed to clear main store:', clearMainError);
      }
      
      // Clear localStorage
      const keysToRemove = ['user', 'firebaseUserId', 'token', 'userId'];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (storageError) {
          console.warn(`⚠️ Failed to remove ${key} from localStorage:`, storageError);
        }
      });
      
      eventBus.emit('authCriticalError', {
        error: error.message || 'Critical authentication error occurred',
        originalError: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        userEmail: firebaseUser.email,
        requiresReload: true,
        timestamp: Date.now()
      });
    } else {
      eventBus.emit('authError', {
        error: error.message || 'Authentication system error',
        originalError: error,
        timestamp: Date.now()
      });
    }
  }
  
  // ✅ Mount app only once after auth state is determined
  if (!isAppMounted) {
    mountApp();
  }
});

// ✅ BULLETPROOF APP MOUNTING FUNCTION
function mountApp() {
  try {
    console.log('🎯 Mounting Vue application...');
    
    app = createApp(App);
    
    // ✅ Add event bus to app instance
    app.config.globalProperties.$eventBus = eventBus;
    
    // ✅ Register global properties for easier access
    app.config.globalProperties.$userStore = store;
    app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
    app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
    
    // Use plugins
    app.use(store);
    app.use(router);
    app.use(VueToast, {
      position: 'top-center',
      duration: 4000,
      dismissible: true
    });
    app.use(i18n);
    
    // ✅ BULLETPROOF: Global error handler
    app.config.errorHandler = (error, instance, info) => {
      console.error('❌ Vue error:', error);
      console.error('📍 Component:', instance);
      console.error('ℹ️ Info:', info);
      
      // ✅ BULLETPROOF: Handle the specific "Cannot read properties of undefined (reading 'length')" error
      if (error.message && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.error('🔍 Length error detected - likely array/string null safety issue');
        
        // Try to get component name for debugging
        const componentName = instance?.$options?.name || instance?.$?.type?.name || 'Unknown';
        console.error('🔍 Component with length error:', componentName);
        
        // Emit specific error for this case
        eventBus.emit('lengthPropertyError', {
          error: error.message,
          component: componentName,
          info,
          timestamp: Date.now()
        });
        
        // Try to recover by forcing a store refresh
        try {
          store.commit('user/FORCE_UPDATE');
          console.log('🔄 Attempted store refresh for length error');
        } catch (refreshError) {
          console.error('❌ Store refresh failed:', refreshError);
        }
      }
      
      // Emit global error event
      eventBus.emit('globalError', {
        error: error.message,
        component: instance?.$options?.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
    };
    
    // Mount the app
    app.mount('#app');
    isAppMounted = true;
    
    console.log('✅ Vue application mounted successfully');
    
    // ✅ Trigger global event for app ready
    eventBus.emit('appReady', {
      timestamp: Date.now(),
      userAuthenticated: !!store.getters['user/isAuthenticated']
    });
    
  } catch (error) {
    console.error('❌ Failed to mount app:', error);
  }
}

// ✅ BULLETPROOF: Global event listeners for debugging
if (import.meta.env.DEV) {
  // Development mode: log all events
  const originalEmit = eventBus.emit;
  eventBus.emit = function(event, data) {
    console.log(`📡 Event emitted: ${event}`, data);
    return originalEmit.call(this, event, data);
  };
  
  // Listen for key events in development
  eventBus.on('userStatusChanged', (data) => {
    console.log('👤 User status changed:', data);
  });
  
  eventBus.on('promocodeApplied', (data) => {
    console.log('🎟️ Promocode applied:', data);
  });
  
  eventBus.on('featuresUpdated', (data) => {
    console.log('🔧 Features updated:', data);
  });
  
  eventBus.on('forceUpdate', (data) => {
    console.log('🔄 Force update triggered:', data);
  });
  
  // ✅ NEW: Listen for auth-related events
  eventBus.on('userLoginError', (data) => {
    console.log('🚨 User login error:', data);
  });
  
  eventBus.on('userLoginRetrySuccess', (data) => {
    console.log('✅ User login retry success:', data);
  });
  
  eventBus.on('userLoginRetryFailed', (data) => {
    console.log('❌ User login retry failed:', data);
  });
  
  eventBus.on('authCriticalError', (data) => {
    console.log('🚨 Critical auth error:', data);
  });
  
  // ✅ NEW: Listen for the specific length property error
  eventBus.on('lengthPropertyError', (data) => {
    console.log('🔍 Length property error detected:', data);
  });
}

// ✅ BULLETPROOF: Global error handling
window.addEventListener('error', (event) => {
  console.error('❌ Global JavaScript error:', event.error);
  
  eventBus.emit('globalError', {
    error: event.error?.message || 'Unknown error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  eventBus.emit('promiseRejection', {
    reason: event.reason?.message || event.reason,
    timestamp: Date.now()
  });
});

// ✅ INITIALIZE APP ON LOAD
initializeApp().catch(error => {
  console.error('❌ Failed to initialize app:', error);
});

// ✅ EXPORT EVENT BUS FOR MODULE USAGE
export { eventBus };

// ✅ ADD GLOBAL EVENT BUS HELPERS
window.addEventListener('DOMContentLoaded', () => {
  // Helper functions for components
  window.emitUserStatusChange = (oldStatus, newStatus) => {
    eventBus.emit('userStatusChanged', { oldStatus, newStatus, timestamp: Date.now() });
  };
  
  window.emitForceUpdate = () => {
    eventBus.emit('forceUpdate', { timestamp: Date.now() });
  };
  
  window.listenToUserChanges = (callback) => {
    eventBus.on('userStatusChanged', callback);
    eventBus.on('promocodeApplied', callback);
    eventBus.on('featuresUpdated', callback);
    return () => {
      eventBus.off('userStatusChanged', callback);
      eventBus.off('promocodeApplied', callback);
      eventBus.off('featuresUpdated', callback);
    };
  };
});

// ✅ PERFORMANCE MONITORING (Development only)
if (import.meta.env.DEV) {
  // Track app performance
  window.addEventListener('load', () => {
    if (performance.mark) {
      performance.mark('app-loaded');
      console.log('⚡ App loaded in:', performance.now().toFixed(2), 'ms');
    }
  });
  
  // Track store mutations in development
  store.subscribe((mutation, state) => {
    if (mutation.type.startsWith('user/')) {
      console.log('🔄 User store mutation:', mutation.type, mutation.payload);
    }
  });
}

// ✅ EXPOSE STORE FOR DEBUGGING
if (import.meta.env.DEV) {
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$userFeatures = () => store.getters['user/features'];
  
  // ✅ NEW: Add debugging commands for auth issues
  window.debugAuth = {
    clearUserState: () => {
      store.commit('user/CLEAR_USER');
      store.commit('logout');
      console.log('🧹 User state cleared');
    },
    
    getCurrentUser: () => {
      return {
        storeUser: store.getters['user/getUser'],
        storeStatus: store.getters['user/userStatus'],
        firebaseUser: auth.currentUser,
        localStorage: {
          user: localStorage.getItem('user'),
          userId: localStorage.getItem('userId'),
          token: localStorage.getItem('token')
        }
      };
    },
    
    testSaveUser: async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        console.error('❌ No Firebase user to test with');
        return;
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
        
        console.log('🧪 Testing saveUser...');
        const result = await store.dispatch('user/saveUser', { userData, token });
        console.log('🧪 Test result:', result);
        return result;
        
      } catch (error) {
        console.error('🧪 Test failed:', error);
        return { success: false, error: error.message };
      }
    },
    
    // ✅ NEW: Debug function to check for null/undefined arrays
    checkArrayStates: () => {
      const state = store.state.user;
      console.log('🔍 Checking array states:', {
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
      });
    },
    
    // ✅ NEW: Fix null arrays
    fixNullArrays: () => {
      console.log('🔧 Fixing null arrays...');
      store.commit('user/CLEAR_USER');
      store.commit('user/SET_USER_STATUS', 'free');
      console.log('✅ Arrays reset to safe defaults');
    }
  };
  
  console.log(`
🐛 DEBUG COMMANDS AVAILABLE:
- debugAuth.clearUserState(): Clear all user state
- debugAuth.getCurrentUser(): Get current user info from all sources  
- debugAuth.testSaveUser(): Test the saveUser function manually
- debugAuth.checkArrayStates(): Check for null/undefined arrays
- debugAuth.fixNullArrays(): Fix null arrays by resetting to defaults
  `);
}