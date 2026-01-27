// src/utils/appMounter.js - Vue Application Mounting

import { createApp } from 'vue';
import App from '../App.vue';
import VueToast from 'vue-toast-notification';
import { setupEnhancedGlobalSubscriptionManagement } from './subscriptionManagement.js';
import { initializeLanguage, setLanguage, getLanguage } from '../composables/useLanguage.js';

let app;
let isApplicationMounted = false;

export const appLifecycle = {
  initialized: false,
  mounted: false,
  authReady: false,
  storeReady: false
};

// ============================================================================
// 🚀 ENHANCED VUE APPLICATION MOUNTING
// ============================================================================
export async function mountVueApplication() {
  const { default: store } = await import('../store');
  const { default: router } = await import('../router');
  const { createI18n } = await import('vue-i18n');
  const messages = (await import('../locales/messages.json')).default;
  try {
    app = createApp(App);

    // ============================================================================
    // 🌐 SETUP I18N (INTERNATIONALIZATION)
    // ============================================================================
    const i18n = createI18n({
      legacy: false,
      locale: localStorage.getItem('lang') || 'ru',
      fallbackLocale: 'en',
      messages,
      globalInjection: true, // Enable global $t access in all components
    });

    // Initialize global language system with i18n instance
    initializeLanguage(i18n);

    // ============================================================================
    // 🔧 ADD ENHANCED GLOBAL PROPERTIES
    // ============================================================================
    app.config.globalProperties.$eventBus = window.eventBus;
    app.config.globalProperties.$userStore = store;
    app.config.globalProperties.$userStatus = () => store.getters['user/userStatus'];
    app.config.globalProperties.$hasFeature = (feature) => store.getters['user/hasFeatureAccess'](feature);
    app.config.globalProperties.$isPremiumUser = () => store.getters['user/isPremiumUser'];
    app.config.globalProperties.$triggerGlobalEvent = window.triggerGlobalEvent;
    app.config.globalProperties.$onUserStatusChange = (callback) => {
      const cleanup = window.eventBus.onStatusChange(callback);
      return cleanup;
    };

    // 🌐 Global language methods for Options API components
    app.config.globalProperties.$setLanguage = setLanguage;
    app.config.globalProperties.$getLanguage = getLanguage;

    // ============================================================================
    // 📦 INSTALL PLUGINS
    // ============================================================================
    app.use(store);

    // Initialize platform mode from localStorage
    store.dispatch('platformMode/loadFromLocalStorage');

    app.use(router);
    app.use(VueToast, {
      position: 'top-center',
      duration: 4000,
      dismissible: true
    });
    app.use(i18n);

    // ============================================================================
    // 🚨 ENHANCED ERROR HANDLER
    // ============================================================================
    app.config.errorHandler = (error, instance, info) => {
      // Check if error is related to length property
      if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
        window.eventBus.emit('lengthPropertyError', {
          error: error.message,
          component: instance?.$options?.name || 'Unknown',
          info,
          timestamp: Date.now()
        });

        try {
          store.commit('user/FORCE_UPDATE');
          window.triggerGlobalEvent('globalForceUpdate', {
            reason: 'length-error-recovery',
            timestamp: Date.now()
          });
        } catch (recoveryError) {
        }
      }

      // Emit error to event bus
      window.eventBus.emit('vueError', {
        error: error.message,
        component: instance?.$options?.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
    };

    // ============================================================================
    // 🎯 MOUNT THE APPLICATION
    // ============================================================================
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;
    // ============================================================================
    // 🔧 SETUP GLOBAL SUBSCRIPTION MANAGEMENT
    // ============================================================================
    setupEnhancedGlobalSubscriptionManagement(store, window.eventBus, app);

    // ============================================================================
    // ✅ MARK APP AS FULLY INITIALIZED
    // ============================================================================
    appLifecycle.initialized = true;
    appLifecycle.authReady = true;
    appLifecycle.storeReady = true;

    // ============================================================================
    // 🔔 EMIT APP READY EVENT
    // ============================================================================
    window.eventBus.emit('appReady', {
      userAuthenticated: !!store.getters['user/isAuthenticated'],
      userStatus: store.getters['user/userStatus'],
      timestamp: Date.now()
    });

    // ============================================================================
    // 📢 FINAL STATUS PROPAGATION
    // ============================================================================
    setTimeout(() => {
      const currentStatus = store.getters['user/userStatus'] || 'free';
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'app-mount-complete',
        timestamp: Date.now()
      });
    }, 200);
    return true;
  } catch (error) {
    window.eventBus.emit('appMountError', {
      error: error.message,
      timestamp: Date.now()
    });

    throw error;
  }
}

// ============================================================================
// 🔧 BASIC VUE APPLICATION MOUNTING (FALLBACK)
// ============================================================================
export async function mountVueApplicationBasic() {
  const { default: store } = await import('../store');
  const { default: router } = await import('../router');
  const { createI18n } = await import('vue-i18n');
  const messages = (await import('../locales/messages.json')).default;

  try {
    app = createApp(App);

    // ============================================================================
    // 🌐 SETUP I18N (BASIC)
    // ============================================================================
    const i18n = createI18n({
      legacy: false,
      locale: localStorage.getItem('lang') || 'ru',
      fallbackLocale: 'en',
      messages,
      globalInjection: true, // Enable global $t access in all components
    });

    // Initialize global language system with i18n instance
    initializeLanguage(i18n);

    // ============================================================================
    // 📦 INSTALL BASIC PLUGINS ONLY
    // ============================================================================
    app.use(store);
    app.use(router);
    app.use(i18n);

    // ============================================================================
    // 🚨 BASIC ERROR HANDLER
    // ============================================================================
    app.config.errorHandler = (error, instance, info) => {
      console.error('Vue Error:', error);
    };

    // ============================================================================
    // 🎯 MOUNT THE APPLICATION
    // ============================================================================
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;

    return true;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// 📦 GETTER FUNCTIONS
// ============================================================================
export function getApp() {
  return app;
}

export function isAppMounted() {
  return isApplicationMounted;
}

export function getAppLifecycle() {
  return appLifecycle;
}

// ============================================================================
// 🔄 FORCE APP UPDATE (FOR EXTERNAL USE)
// ============================================================================
export function forceAppUpdate() {
  if (app?._instance) {
    try {
      app._instance.proxy.$forceUpdate();
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

// ============================================================================
// 🔄 REMOUNT APP (FOR RECOVERY)
// ============================================================================
export async function remountApp() {
  try {
    // Unmount if already mounted
    if (app && isApplicationMounted) {
      app.unmount();
      isApplicationMounted = false;
      appLifecycle.mounted = false;
    }

    // Remount
    await mountVueApplication();
    return true;
  } catch (error) {
    // Try basic mount as fallback
    try {
      await mountVueApplicationBasic();
      return true;
    } catch (fallbackError) {
      return false;
    }
  }
}