// src/utils/helpers.js - Global Helper Functions

import { getApp } from './appMounter.js';
import { getLanguage } from '@/composables/useLanguage.js';

// ============================================================================
// 🌐 LOCALIZATION HELPERS
// ============================================================================

/**
 * Safely extracts text content based on the current language
 * Handles both String (legacy) and Object (multilingual) formats
 * @param {String|Object} content - The text content to localize
 * @param {String} languageCode - Optional language code override (e.g., 'en', 'ru', 'uz')
 * @returns {String} The localized content string
 */
export const getLocalizedContent = (content, languageCode = null) => {
  // 1. Handle empty/null values
  if (content === null || content === undefined) return '';

  // 2. If it's already a string, just return it (Fixes old English lessons)
  if (typeof content === 'string') return content;

  // 3. Get current language from composable or localStorage
  const lang = languageCode || getLanguage() || localStorage.getItem('lang') || 'ru';

  // 4. If it's an object, try to get the specific language (Fixes multilingual lessons)
  if (typeof content === 'object') {
    // Priority: Requested Language -> Fallback chain -> First Available Key -> Empty
    const value = content[lang] || content['en'] || content['ru'] || content['uz'];
    if (value && typeof value === 'string') {
      return value.trim();
    }
    // Try to get any available string value
    const values = Object.values(content);
    for (const v of values) {
      if (v && typeof v === 'string' && v.trim()) {
        return v.trim();
      }
    }
    return '';
  }

  // 5. Fallback for numbers or other types
  return String(content);
};

export function setupGlobalHelpers(store, eventBus) {
// ============================================================================
  // 📢 EMIT USER STATUS CHANGE
  // ============================================================================
  window.emitUserStatusChange = (oldStatus, newStatus, source = 'unknown') => {
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!validStatuses.includes(newStatus)) {
return;
    }

    // Update store
    try {
      store.commit('user/SET_USER_STATUS', newStatus);
    } catch (storeError) {
}

    // Update localStorage
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
    } catch (storageError) {
}

    const eventData = {
      oldStatus,
      newStatus,
      source,
      timestamp: Date.now()
    };

    // Trigger all status change events
    window.triggerGlobalEvent('userStatusChanged', eventData);
    window.triggerGlobalEvent('userSubscriptionChanged', eventData);
    window.triggerGlobalEvent('subscriptionUpdated', eventData);
    window.triggerGlobalEvent('globalForceUpdate', {
      reason: 'manual-status-change',
      plan: newStatus,
      timestamp: Date.now()
    });

    // Force Vue app update
    const app = getApp();
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
}
    }
  };

  // ============================================================================
  // 🔄 EMIT FORCE UPDATE
  // ============================================================================
  window.emitForceUpdate = (reason = 'manual') => {
window.triggerGlobalEvent('globalForceUpdate', {
      reason,
      timestamp: Date.now()
    });

    try {
      store.commit('user/FORCE_UPDATE');
    } catch (error) {
}
  };

  // ============================================================================
  // 👂 LISTEN TO USER CHANGES
  // ============================================================================
  window.listenToUserChanges = (callback) => {
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
    
    // Also register DOM event listener
    window.addEventListener('userSubscriptionChanged', callback);

    // Return cleanup function
    return () => {
      events.forEach(event => eventBus.off(event, callback));
      window.removeEventListener('userSubscriptionChanged', callback);
    };
  };

  // ============================================================================
  // 📊 GET CURRENT USER STATUS
  // ============================================================================
  window.getCurrentUserStatus = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');

      return storeStatus || localStatus || 'free';
    } catch (error) {
return localStorage.getItem('userStatus') || 'free';
    }
  };

  // ============================================================================
  // 🔧 REPAIR STORE STATUS
  // ============================================================================
  window.repairStoreStatus = () => {
const localStatus = localStorage.getItem('userStatus') ||
      localStorage.getItem('userPlan') ||
      localStorage.getItem('subscriptionPlan') ||
      'free';

    try {
      // Check if user state exists
      if (!store.state.user) {
try {
          // Try to register user module
          store.registerModule('user', {
            namespaced: true,
            state: {
              user: null,
              userStatus: localStatus,
              subscriptionPlan: localStatus,
              isAuthenticated: false,
              isInitialized: true
            },
            getters: {
              userStatus: state => state.userStatus,
              getUser: state => state.user,
              isAuthenticated: state => !!state.user,
              isInitialized: state => state.isInitialized
            },
            mutations: {
              SET_USER_STATUS: (state, status) => { state.userStatus = status; },
              SET_USER: (state, user) => { state.user = user; },
              CLEAR_USER: (state) => { state.user = null; state.userStatus = 'free'; }
            }
          });
} catch (moduleError) {
// Manual state creation as last resort
          store.state.user = {
            user: null,
            userStatus: localStatus,
            subscriptionPlan: localStatus,
            isAuthenticated: false,
            isInitialized: true
          };
}
      }

      // Try different possible mutations
      const mutations = [
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/SET_STATUS',
        'user/UPDATE_USER_STATUS',
        'setUserStatus'
      ];

      mutations.forEach(mutation => {
        try {
          store.commit(mutation, localStatus);
        } catch (e) {
          // Ignore if mutation doesn't exist
        }
      });

      // ✅ CRITICAL: Direct state update regardless of mutations
      if (store.state.user) {
        store.state.user.userStatus = localStatus;
        store.state.user.subscriptionPlan = localStatus;
        store.state.user.plan = localStatus;
      }

      const newStoreStatus = store.getters['user/userStatus'];

      // ✅ CRITICAL: If getter still fails, create a working getter
      if (!newStoreStatus || newStoreStatus === 'undefined') {
window.getWorkingUserStatus = () => {
          return store.state.user?.userStatus ||
            localStorage.getItem('userStatus') ||
            'free';
        };
      }
return newStoreStatus || localStatus;
    } catch (error) {
return localStatus;
    }
  };

  // ============================================================================
  // 🔄 SYNC USER STATUS
  // ============================================================================
  window.syncUserStatus = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');

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
return 'free';
    }
  };

  // ============================================================================
  // 🚨 FORCE USER STATUS SYNC
  // ============================================================================
  window.forceUserStatusSync = () => {
    try {
      const currentStatus = store.getters['user/userStatus'] || 'free';
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'emergency-sync',
        timestamp: Date.now()
      });
    } catch (error) {
}
  };

  // ============================================================================
  // 📦 UPDATE USER SUBSCRIPTION (EXTERNAL HOOK)
  // ============================================================================
  window.updateUserSubscription = (newPlan, source = 'external') => {
    if (!['free', 'start', 'pro'].includes(newPlan)) {
return false;
    }

    const oldStatus = window.getCurrentUserStatus();
    window.emitUserStatusChange(oldStatus, newPlan, source);

    return true;
  };

  // ============================================================================
  // 🎫 APPLY PROMOCODE (HOOK)
  // ============================================================================
  window.applyPromocode = (promocode, newPlan) => {
if (!newPlan || !['free', 'start', 'pro'].includes(newPlan)) {
return false;
    }

    const oldStatus = window.getCurrentUserStatus();
    window.emitUserStatusChange(oldStatus, newPlan, 'promocode');

    const eventData = {
      promocode: promocode,
      oldStatus: oldStatus,
      newStatus: newPlan,
      plan: newPlan,
      userStatus: newPlan,
      subscriptionPlan: newPlan,
      source: 'promocode',
      timestamp: Date.now()
    };

    eventBus.emit('promocodeApplied', eventData);
    window.triggerGlobalEvent('userSubscriptionChanged', eventData);
    window.triggerGlobalEvent('subscriptionUpdated', eventData);

    return true;
  };

  // ============================================================================
  // 💳 PAYMENT COMPLETED (HOOK)
  // ============================================================================
  window.paymentCompleted = (transactionId, plan, amount) => {
if (!['start', 'pro'].includes(plan)) {
return false;
    }

    const oldStatus = window.getCurrentUserStatus();
    window.emitUserStatusChange(oldStatus, plan, 'payment');

    eventBus.emit('paymentCompleted', {
      transactionId: transactionId,
      plan: plan,
      amount: amount,
      oldStatus: oldStatus,
      newStatus: plan,
      timestamp: Date.now()
    });

    return true;
  };

  // ============================================================================
  // 🔍 SMART PROMOCODE DETECTION
  // ============================================================================
  window.smartPromocodeDetection = () => {
    const checkLocalStorage = () => {
      const keys = ['userStatus', 'userPlan', 'subscriptionPlan'];
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value && ['start', 'pro'].includes(value)) {
          return value;
        }
      }
      return null;
    };

    const detectedPlan = checkLocalStorage();

    if (detectedPlan && detectedPlan !== 'free') {
      const storeStatus = store.getters['user/userStatus'];
      if (!storeStatus || storeStatus === 'undefined' || storeStatus !== detectedPlan) {
window.repairStoreStatus();
      }
    }

    return null;
  };

  // ============================================================================
  // ⏱️ RUN SMART DETECTION PERIODICALLY
  // ============================================================================
  setInterval(() => {
    window.smartPromocodeDetection();
  }, 5000); // Check every 5 seconds
}