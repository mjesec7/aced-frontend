// src/utils/devTools.js - Development Debugging Tools

import { getStoredSubscription, isSubscriptionValid, setupSubscriptionPersistence } from './subscription.js';
import { recoverUserStatus } from './errorHandling.js';

export function setupDevTools(store, eventBus, authInitPromise, appLifecycle) {
  console.log('🛠️ Development tools enabled');

  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$appLifecycle = appLifecycle;
  window.$authInitPromise = authInitPromise;

  // Emergency fix function
  window.emergencyFixSubscription = function() {
    console.log('🚨 Emergency subscription fix initiated');

    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('subscriptionExpiry');
    localStorage.removeItem('subscriptionActivated');

    const now = new Date();
    const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const subscriptionData = {
      plan: 'start',
      activatedAt: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      lastUpdated: now.toISOString(),
      source: 'emergency-fix',
      status: 'active'
    };

    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    localStorage.setItem('subscriptionPlan', 'start');
    localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
    localStorage.setItem('subscriptionActivated', subscriptionData.activatedAt);
    localStorage.setItem('userStatus', 'start');
    localStorage.setItem('userPlan', 'start');

    if (window.triggerGlobalEvent) {
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: 'start',
        source: 'emergency-fix',
        timestamp: Date.now()
      });
    }

    if (window.$store) {
      try {
        window.$store.commit('user/SET_USER_STATUS', 'start');
      } catch (error) {
        console.error('Store update error:', error);
      }
    }

    console.log('✅ Emergency fix completed', subscriptionData);
    return subscriptionData;
  };

  // Direct status testing functions
  window.testUserStatus = {
    setFree: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      window.emitUserStatusChange(currentStatus, 'free', 'debug-test');
    },
    
    setStart: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      setupSubscriptionPersistence('start', 'debug-test');
      window.emitUserStatusChange(currentStatus, 'start', 'debug-test');
    },
    
    setPro: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      setupSubscriptionPersistence('pro', 'debug-test');
      window.emitUserStatusChange(currentStatus, 'pro', 'debug-test');
    },

    getCurrentStatus: () => {
      const subscription = getStoredSubscription();
      
      if (!subscription) {
        console.log('📊 No subscription data found');
        return { status: 'free', message: 'No subscription' };
      }
    
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
      const isValid = now < expiryDate;
    
      const status = {
        plan: subscription.plan,
        status: isValid ? 'active' : 'expired',
        activatedAt: subscription.activatedAt,
        expiryDate: subscription.expiryDate,
        daysRemaining: isValid ? daysRemaining : 0,
        hoursRemaining: isValid ? hoursRemaining : 0,
        isValid: isValid,
        source: subscription.source,
        message: isValid 
          ? `${subscription.plan} subscription active for ${daysRemaining} more days`
          : `${subscription.plan} subscription expired ${Math.abs(daysRemaining)} days ago`
      };
    
      console.log('📊 Subscription Status:', status);
      return status;
    },

    forceStatusUpdate: (status) => {
      if (!['free', 'start', 'pro'].includes(status)) {
        console.warn('Invalid status:', status);
        return;
      }

      console.log(`🔧 Forcing status update to: ${status}`);

      if (status !== 'free') {
        setupSubscriptionPersistence(status, 'debug-force');
      }

      window.repairStoreStatus();

      const mutations = [
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/SET_STATUS',
        'user/UPDATE_USER_STATUS',
        'setUserStatus'
      ];

      mutations.forEach(mutation => {
        try {
          store.commit(mutation, status);
        } catch (e) {
          // Ignore if mutation doesn't exist
        }
      });

      if (store.state.user) {
        store.state.user.userStatus = status;
        store.state.user.subscriptionPlan = status;
        store.state.user.plan = status;
      }

      localStorage.setItem('userStatus', status);
      localStorage.setItem('userPlan', status);
      localStorage.setItem('subscriptionPlan', status);

      try {
        store.commit('user/FORCE_UPDATE');
      } catch (e) {
        console.error('Force update error:', e);
      }

      const eventData = {
        oldStatus: null,
        newStatus: status,
        plan: status,
        source: 'debug-force',
        timestamp: Date.now()
      };

      window.triggerGlobalEvent('userStatusChanged', eventData);
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'debug-force-update',
        plan: status,
        timestamp: Date.now()
      });

      setTimeout(() => {
        const verification = window.testUserStatus.getCurrentStatus();
        console.log('✅ Status update verification:', verification);
      }, 100);
    },

    getSubscription: () => {
      return getStoredSubscription();
    },

    checkSubscriptionValidity: () => {
      return isSubscriptionValid();
    },

    extendSubscription: (days = 30) => {
      const subscription = getStoredSubscription();
  
      if (!subscription || subscription.plan === 'free') {
        console.log('❌ No active subscription to extend');
        return false;
      }
    
      const now = new Date();
      let newExpiry;
    
      if (isSubscriptionValid()) {
        const currentExpiry = new Date(subscription.expiryDate);
        newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
        console.log(`📅 Extending valid subscription by ${days} days`);
      } else {
        newExpiry = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        console.log(`📅 Reactivating expired subscription for ${days} days`);
      }
    
      subscription.expiryDate = newExpiry.toISOString();
      subscription.lastUpdated = now.toISOString();
      subscription.status = 'active';
    
      localStorage.setItem('subscriptionData', JSON.stringify(subscription));
      localStorage.setItem('subscriptionExpiry', subscription.expiryDate);
      localStorage.setItem('userStatus', subscription.plan);
    
      if (window.store) {
        store.commit('user/SET_USER_STATUS', subscription.plan);
      }
    
      window.triggerGlobalEvent('subscriptionExtended', {
        plan: subscription.plan,
        newExpiry: subscription.expiryDate,
        daysExtended: days,
        timestamp: Date.now()
      });
    
      console.log(`✅ Subscription extended until ${newExpiry.toLocaleDateString()}`);
      return true;
    },

    clearSubscription: () => {
      localStorage.removeItem('subscriptionData');
      localStorage.removeItem('subscriptionExpiry');
      localStorage.removeItem('subscriptionActivated');
      localStorage.setItem('userStatus', 'free');
      localStorage.setItem('userPlan', 'free');
      localStorage.setItem('subscriptionPlan', 'free');
      console.log('✅ Subscription cleared');
    }
  };

  // Enhanced debugging helpers
  window.debugAuth = {
    getAuthState: () => ({
      appLifecycle,
      currentUser: store.getters['user/getUser'],
      userStatus: store.getters['user/userStatus'],
      isAuthenticated: store.getters['user/isAuthenticated']
    }),

    testAuthFlow: async () => {
      try {
        const result = await authInitPromise;
        console.log('Auth flow result:', result);
        return result;
      } catch (error) {
        console.error('Auth flow error:', error);
        return { error: error.message };
      }
    },

    recoverUserStatus: () => {
      return recoverUserStatus();
    },

    clearAuthState: () => {
      console.log('🧹 Clearing auth state...');

      try {
        store.commit('user/CLEAR_USER');
        store.commit('logout');

        const keysToRemove = [
          'user', 'firebaseUserId', 'userId', 'token',
          'userStatus', 'lastLoginTime', 'authMode'
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });

        console.log('✅ Auth state cleared');

        setTimeout(() => {
          window.triggerGlobalEvent('userStatusChanged', {
            oldStatus: null,
            newStatus: 'free',
            source: 'debug-clear',
            timestamp: Date.now()
          });
        }, 100);

        return true;
      } catch (error) {
        console.error('Clear auth error:', error);
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
        lifecycle: appLifecycle
      };
    }
  };

  console.log('✅ Dev tools ready. Use window.testUserStatus and window.debugAuth');
}