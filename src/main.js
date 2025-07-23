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

// ✅ GLOBAL EVENT BUS SETUP
// Simple event emitter implementation (alternative to mitt)
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

// ✅ MAKE EVENT BUS GLOBALLY AVAILABLE
window.eventBus = eventBus;

// ✅ i18n Setup
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ✅ ENHANCED APP INITIALIZATION
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

// ✅ COMPLETELY FIXED FIREBASE AUTH HANDLER - SERVER-SIDE ONLY
onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    if (firebaseUser) {
      console.log('🔥 Firebase user authenticated:', firebaseUser.email);
      
      // ✅ STEP 1: Get ID token for server authentication
      let token;
      try {
        token = await firebaseUser.getIdToken();
        console.log('🔑 Firebase token obtained successfully');
      } catch (tokenError) {
        console.error('❌ Failed to get Firebase token:', tokenError);
        
        // If we can't get a token, we can't authenticate with the server
        // Clear any existing state and show error
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
      
      // ✅ STEP 2: Prepare user data for server
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL
      };
      
      console.log('💾 Saving user to server...', { email: userData.email, uid: userData.uid });
      
      // ✅ STEP 3: SAVE USER TO SERVER (CRITICAL SECTION - WHERE ERROR OCCURRED)
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
        // Ensure we have a proper result object even if dispatch fails
        result = { 
          success: false, 
          error: dispatchError.message || 'Failed to save user to server',
          user: null,
          isDispatchError: true
        };
      }
      
      // ✅ STEP 4: ULTRA-SAFE RESULT VALIDATION (FIXES THE ORIGINAL ERROR)
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
      
      // ✅ STEP 5: HANDLE SUCCESSFUL SERVER SAVE
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
        
        // Update main store with server data (for backward compatibility)
        store.commit('setUser', result.user);
        store.commit('setFirebaseUserId', result.user.firebaseId || result.user._id);
        store.commit('setToken', token);
        
        // Store minimal data in localStorage (server data only)
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('firebaseUserId', result.user.firebaseId || result.user._id);
        localStorage.setItem('token', token);
        
        console.log('✅ User state updated successfully');
        
        // ✅ Emit success event
        eventBus.emit('userLoggedIn', {
          user: result.user,
          userStatus: store.getters['user/userStatus'],
          source: 'server',
          timestamp: Date.now()
        });
        
      } else {
        // ✅ STEP 6: HANDLE FAILED SERVER SAVE
        const errorMessage = result.error || 'Failed to save user to server';
        console.error('❌ Failed to save user to server:', {
          error: errorMessage,
          statusCode: result.statusCode,
          isDispatchError: result.isDispatchError
        });
        
        // ✅ IMPORTANT: Don't create local fallbacks for server operations
        // Clear any existing user state to prevent inconsistent state
        store.commit('user/CLEAR_USER');
        store.commit('logout');
        
        // Emit error event with detailed information
        eventBus.emit('userLoginError', {
          error: errorMessage,
          isServerError: true,
          canRetry: true,
          statusCode: result.statusCode,
          isDispatchError: result.isDispatchError,
          timestamp: Date.now()
        });
        
        // ✅ AUTO-RETRY LOGIC for temporary server failures
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
              
              // Validate retry result
              if (retryResult && retryResult.success === true && retryResult.user) {
                console.log('✅ Retry successful');
                
                // Update store with retry result
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
      // ✅ USER LOGGED OUT
      console.log('👋 User logged out from Firebase');
      
      try {
        // Clear user data from server and local store
        await store.dispatch('user/logout');
        store.commit('logout');
        
        console.log('✅ Logout completed successfully');
      } catch (logoutError) {
        console.error('❌ Logout error:', logoutError);
        // Force clear even if logout action fails
        store.commit('user/CLEAR_USER');
        store.commit('logout');
      }
      
      // Emit logout event
      eventBus.emit('userLoggedOut', {
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Critical auth state change error:', error);
    
    // ✅ COMPREHENSIVE ERROR RECOVERY
    if (firebaseUser) {
      console.log('🚨 Critical auth error occurred, clearing all user state...');
      
      // Clear all user state - don't attempt recovery for critical errors
      store.commit('user/CLEAR_USER');
      store.commit('logout');
      
      // Clear localStorage
      ['user', 'firebaseUserId', 'token', 'userId'].forEach(key => {
        localStorage.removeItem(key);
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

// ✅ APP MOUNTING FUNCTION
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
    
    // ✅ Global error handler
    app.config.errorHandler = (error, instance, info) => {
      console.error('❌ Vue error:', error);
      console.error('📍 Component:', instance);
      console.error('ℹ️ Info:', info);
      
      // Emit global error event
      eventBus.emit('globalError', {
        error: error.message,
        component: instance?.$options.name || 'Unknown',
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

// ✅ GLOBAL EVENT LISTENERS FOR DEBUGGING
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
}

// ✅ GLOBAL ERROR HANDLING
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
    }
  };
  
  console.log(`
🐛 DEBUG COMMANDS AVAILABLE:
- debugAuth.clearUserState(): Clear all user state
- debugAuth.getCurrentUser(): Get current user info from all sources  
- debugAuth.testSaveUser(): Test the saveUser function manually
  `);
}