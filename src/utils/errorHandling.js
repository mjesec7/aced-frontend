// src/utils/errorHandling.js - Global Error Handling

// ============================================================================
// 🚨 SETUP GLOBAL ERROR HANDLING
// ============================================================================
export function setupGlobalErrorHandling(eventBus) {
    console.log('✅ Setting up global error handling');
  
    // ============================================================================
    // 🔴 GLOBAL JAVASCRIPT ERROR HANDLER
    // ============================================================================
    window.addEventListener('error', (event) => {
      console.error('❌ Global error:', event.error);
  
      // Check if error is related to user status/arrays
      if (event.error?.message?.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn('⚠️ Length property error detected, attempting recovery...');
  
        try {
          // Import store dynamically to avoid circular dependency
          import('../store').then(({ default: store }) => {
            store.commit('user/FORCE_UPDATE');
  
            window.triggerGlobalEvent('globalForceUpdate', {
              reason: 'global-error-recovery',
              originalError: event.error?.message,
              timestamp: Date.now()
            });
  
            console.log('✅ Recovery attempt completed');
          }).catch(err => {
            console.error('❌ Store import failed:', err);
          });
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError);
        }
      }
  
      // Emit error event to EventBus
      eventBus.emit('globalJavaScriptError', {
        error: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    });
  
    // ============================================================================
    // 🔴 UNHANDLED PROMISE REJECTION HANDLER
    // ============================================================================
    window.addEventListener('unhandledrejection', (event) => {
      console.error('❌ Unhandled promise rejection:', event.reason);
  
      // Check if rejection is related to user status operations
      if (event.reason?.message?.includes('userStatus') ||
        event.reason?.message?.includes('subscription')) {
        console.warn('⚠️ Status-related promise rejection, attempting recovery...');
  
        try {
          window.triggerGlobalEvent('globalForceUpdate', {
            reason: 'promise-rejection-recovery',
            originalError: event.reason?.message,
            timestamp: Date.now()
          });
  
          console.log('✅ Recovery event triggered');
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError);
        }
      }
  
      // Emit error event to EventBus
      eventBus.emit('unhandledPromiseRejection', {
        reason: event.reason?.message || event.reason,
        timestamp: Date.now()
      });
    });
  
    // ============================================================================
    // 🔄 STORAGE EVENT LISTENER (CROSS-TAB SYNC)
    // ============================================================================
    window.addEventListener('storage', (event) => {
      if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
        console.log('🔄 Cross-tab status change detected');
  
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
  
      // Also listen for other subscription-related changes
      if (event.key === 'subscriptionData' && event.newValue !== event.oldValue) {
        console.log('🔄 Cross-tab subscription change detected');
  
        try {
          const newSubscription = event.newValue ? JSON.parse(event.newValue) : null;
          const oldSubscription = event.oldValue ? JSON.parse(event.oldValue) : null;
  
          if (newSubscription && newSubscription.plan) {
            window.triggerGlobalEvent('userSubscriptionChanged', {
              oldStatus: oldSubscription?.plan || 'free',
              newStatus: newSubscription.plan,
              source: 'cross-tab-subscription-sync',
              timestamp: Date.now()
            });
          }
        } catch (parseError) {
          console.error('❌ Failed to parse subscription data:', parseError);
        }
      }
    });
  
    console.log('✅ Global error handling configured');
  }
  
  // ============================================================================
  // 🔧 ENHANCED ERROR RECOVERY
  // ============================================================================
  export async function recoverUserStatus() {
    console.log('🔧 Attempting user status recovery...');
  
    try {
      const { default: store } = await import('../store');
  
      const localStatus = localStorage.getItem('userStatus') || 'free';
      const localUser = localStorage.getItem('user');
  
      if (localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
  
          // Update store with cached data
          store.commit('user/SET_USER', parsedUser);
          store.commit('user/SET_USER_STATUS', localStatus);
  
          console.log('✅ User status recovered from localStorage');
  
          // Trigger status change event
          setTimeout(() => {
            window.triggerGlobalEvent('userStatusChanged', {
              oldStatus: null,
              newStatus: localStatus,
              source: 'recovery',
              timestamp: Date.now()
            });
          }, 100);
  
          return true;
        } catch (parseError) {
          console.error('❌ Parse error:', parseError);
        }
      }
  
      // If no cached data, set default state
      store.commit('user/SET_USER_STATUS', 'free');
      store.commit('user/CLEAR_USER');
  
      console.log('✅ User status set to default (free)');
  
      // Trigger status change event
      setTimeout(() => {
        window.triggerGlobalEvent('userStatusChanged', {
          oldStatus: null,
          newStatus: 'free',
          source: 'recovery-default',
          timestamp: Date.now()
        });
      }, 100);
  
      return false;
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      return false;
    }
  }
  
  // ============================================================================
  // 🛡️ SAFE STORE ACCESS (PREVENTS ERRORS)
  // ============================================================================
  export function safeStoreAccess(store, getter, fallback = null) {
    try {
      return store.getters[getter];
    } catch (error) {
      console.warn(`⚠️ Failed to access getter ${getter}:`, error);
      return fallback;
    }
  }
  
  // ============================================================================
  // 🛡️ SAFE LOCALSTORAGE ACCESS (PREVENTS ERRORS)
  // ============================================================================
  export function safeLocalStorageGet(key, fallback = null) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      console.warn(`⚠️ Failed to get localStorage key ${key}:`, error);
      return fallback;
    }
  }
  
  export function safeLocalStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to set localStorage key ${key}:`, error);
      return false;
    }
  }
  
  export function safeLocalStorageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to remove localStorage key ${key}:`, error);
      return false;
    }
  }
  
  // ============================================================================
  // 🛡️ SAFE JSON PARSE (PREVENTS ERRORS)
  // ============================================================================
  export function safeJsonParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('⚠️ Failed to parse JSON:', error);
      return fallback;
    }
  }
  
  export function safeJsonStringify(object, fallback = '{}') {
    try {
      return JSON.stringify(object);
    } catch (error) {
      console.warn('⚠️ Failed to stringify JSON:', error);
      return fallback;
    }
  }
  
  // ============================================================================
  // 🔍 ERROR DEBUGGING HELPER
  // ============================================================================
  export function logErrorDetails(error, context = 'Unknown') {
    console.group(`❌ Error in ${context}`);
    console.error('Error:', error);
    console.error('Message:', error?.message);
    console.error('Stack:', error?.stack);
    console.groupEnd();
  }
  
  // ============================================================================
  // 🚨 CRITICAL ERROR NOTIFICATION
  // ============================================================================
  export function notifyCriticalError(error, context = 'Application') {
    console.error(`🚨 CRITICAL ERROR in ${context}:`, error);
    
    // You could add additional notification logic here
    // For example: send to error tracking service, show user notification, etc.
    
    if (window.eventBus) {
      window.eventBus.emit('criticalError', {
        error: error?.message || 'Unknown critical error',
        context,
        timestamp: Date.now()
      });
    }
  }