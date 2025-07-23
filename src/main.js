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

// ✅ ENHANCED FIREBASE AUTH HANDLER
onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    if (firebaseUser) {
      console.log('🔥 Firebase user authenticated:', firebaseUser.email);
      
      // Get ID token
      const token = await firebaseUser.getIdToken();
      
      // Prepare user data for backend
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL
      };
      
      console.log('💾 Saving user to backend...');
      
      // Save user through the new store action
      const result = await store.dispatch('user/saveUser', { userData, token });
      
      if (result.success) {
        console.log('✅ User saved successfully:', result.user.email);
        
        // Store additional data in main store (for backward compatibility)
        store.commit('setUser', result.user);
        store.commit('setFirebaseUserId', result.user.firebaseId || result.user._id);
        store.commit('setToken', token);
        
        // Store in localStorage for backward compatibility
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('firebaseUserId', result.user.firebaseId || result.user._id);
        localStorage.setItem('token', token);
        
        // ✅ Trigger global event for successful login
        eventBus.emit('userLoggedIn', {
          user: result.user,
          userStatus: store.getters['user/userStatus'],
          timestamp: Date.now()
        });
        
      } else {
        console.error('❌ Failed to save user:', result.error);
        
        // Fallback: set user data locally
        store.commit('setUser', userData);
        store.commit('user/SET_USER', userData);
        
        eventBus.emit('userLoginError', {
          error: result.error,
          timestamp: Date.now()
        });
      }
      
    } else {
      console.log('👋 User logged out');
      
      // Clear user data through store actions
      await store.dispatch('user/logout');
      store.commit('logout');
      
      // ✅ Trigger global event for logout
      eventBus.emit('userLoggedOut', {
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Auth state change error:', error);
    
    eventBus.emit('authError', {
      error: error.message,
      timestamp: Date.now()
    });
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
}