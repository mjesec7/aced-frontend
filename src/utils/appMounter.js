// src/utils/appMounter.js - Vue Application Mounting

import { createApp } from 'vue';
import App from '../App.vue';
import VueToast from 'vue-toast-notification';
import { setupEnhancedGlobalSubscriptionManagement } from './subscriptionManagement.js';

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

  console.log('🚀 Mounting Vue application...');

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
    });

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

    // ============================================================================
    // 📦 INSTALL PLUGINS
    // ============================================================================
    app.use(store);
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
      console.error('❌ Vue error:', error, info);

      // Check if error is related to length property
      if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn('⚠️ Length property error detected in Vue component');
        
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
          console.error('❌ Recovery error:', recoveryError);
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

    console.log('✅ Vue application mounted successfully');

    // ============================================================================
    // 🔧 SETUP GLOBAL SUBSCRIPTION MANAGEMENT
    // ============================================================================
    setupEnhancedGlobalSubscriptionManagement(store, window.eventBus);

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
      console.log(`📢 Final status propagation: ${currentStatus}`);
      
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'app-mount-complete',
        timestamp: Date.now()
      });
    }, 200);

    console.log('🎉 Application initialization complete!');

    return true;
  } catch (error) {
    console.error('❌ Mount error:', error);

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

  console.log('🔧 Mounting Vue application (basic fallback)...');

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
    });

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
      console.error('❌ Vue error (basic):', error);
    };

    // ============================================================================
    // 🎯 MOUNT THE APPLICATION
    // ============================================================================
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;

    console.log('✅ Vue application mounted (basic mode)');

    return true;
  } catch (error) {
    console.error('❌ Basic mount error:', error);
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
      console.log('✅ App force updated');
      return true;
    } catch (error) {
      console.error('❌ Force update error:', error);
      return false;
    }
  }
  console.warn('⚠️ App not available for force update');
  return false;
}

// ============================================================================
// 🔄 REMOUNT APP (FOR RECOVERY)
// ============================================================================
export async function remountApp() {
  console.log('🔄 Remounting app...');
  
  try {
    // Unmount if already mounted
    if (app && isApplicationMounted) {
      app.unmount();
      isApplicationMounted = false;
      appLifecycle.mounted = false;
      console.log('✅ App unmounted');
    }

    // Remount
    await mountVueApplication();
    console.log('✅ App remounted successfully');
    return true;
  } catch (error) {
    console.error('❌ Remount failed:', error);
    
    // Try basic mount as fallback
    try {
      await mountVueApplicationBasic();
      console.log('✅ App remounted in basic mode');
      return true;
    } catch (fallbackError) {
      console.error('❌ Basic remount also failed:', fallbackError);
      return false;
    }
  }
}