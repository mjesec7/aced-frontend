// src/utils/auth.js - Authentication Management

import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setupSubscriptionPersistence, getStoredSubscription, isSubscriptionValid } from './subscription.js';
import { mountVueApplication, mountVueApplicationBasic } from './appMounter.js';

let authStateResolved = false;
let authResolveFunction = null;

// ============================================================================
// 🔥 AUTH INITIALIZATION PROMISE
// ============================================================================
export const authInitPromise = new Promise((resolve) => {
  authResolveFunction = resolve;

  // 🛡️ CRITICAL: Final subscription check before auth starts
  const finalSubscriptionCheck = () => {
    try {
      const subscriptionJson = localStorage.getItem('subscriptionData');
      if (subscriptionJson) {
        const subscription = JSON.parse(subscriptionJson);
        const now = new Date();
        const expiry = new Date(subscription.expiryDate);
        const isValid = now < expiry;

        if (isValid && subscription.plan !== 'free') {
          localStorage.setItem('userStatus', subscription.plan);
          localStorage.setItem('userPlan', subscription.plan);
          localStorage.setItem('subscriptionPlan', subscription.plan);
          localStorage.setItem('authPreserveStatus', subscription.plan);
          return subscription.plan;
        }
      }
    } catch (error) {
    }
    return 'free';
  };

  const authStartStatus = finalSubscriptionCheck();

  // Setup Firebase auth state listener
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!authStateResolved) {
      authStateResolved = true;
      unsubscribe();

      try {
        // Ensure store is initialized
        await ensureStoreInitialized();

        if (firebaseUser) {
          // User is authenticated
          await handleUserAuthenticated(firebaseUser);
        } else {
          // User is not authenticated
          await handleUserNotAuthenticated();
        }

        // Mount Vue application
        await mountVueApplication();

        // Clean up preservation flags
        localStorage.removeItem('authPreserveStatus');

        // Resolve auth promise with success
        setTimeout(() => {
          resolve({
            authenticated: !!firebaseUser,
            user: firebaseUser,
            appReady: true,
            preservedStatus: authStartStatus,
            timestamp: Date.now()
          });
        }, 50);
      } catch (error) {
        try {
          // Try basic mount as fallback
          await mountVueApplicationBasic();
        } catch (mountError) {
        }

        // Resolve with error state
        setTimeout(() => {
          resolve({
            authenticated: false,
            user: null,
            appReady: false,
            error: error.message,
            preservedStatus: authStartStatus,
            timestamp: Date.now()
          });
        }, 50);
      }
    }
  });

  // Timeout fallback (8 seconds)
  setTimeout(() => {
    if (!authStateResolved) {
      authStateResolved = true;
      unsubscribe();

      // Fallback initialization
      Promise.resolve()
        .then(() => ensureStoreInitialized())
        .then(() => handleUserNotAuthenticated())
        .then(() => mountVueApplicationBasic())
        .then(() => {
          resolve({
            authenticated: false,
            user: null,
            appReady: true,
            timedOut: true,
            timestamp: Date.now()
          });
        })
        .catch((fallbackError) => {
          resolve({
            authenticated: false,
            user: null,
            appReady: false,
            error: fallbackError.message,
            fallbackFailed: true,
            timestamp: Date.now()
          });
        });
    }
  }, 8000);
});

// ============================================================================
// 🔧 ENSURE STORE INITIALIZED
// ============================================================================
async function ensureStoreInitialized() {
  const { default: store } = await import('../store');

  try {
    if (store.getters['user/isInitialized']) {
      const lastServerLoad = localStorage.getItem('lastServerLoad');
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

      if (!lastServerLoad || parseInt(lastServerLoad) < fiveMinutesAgo) {
        await store.dispatch('user/loadUserFromServer');
      }
      return true;
    }
    await store.dispatch('user/initialize');

    const currentUser = auth.currentUser;
    if (currentUser) {
      await store.dispatch('user/loadUserFromServer');
    }
    return true;
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// 👤 HANDLE USER AUTHENTICATED
// ============================================================================
async function handleUserAuthenticated(firebaseUser) {
  const { default: store } = await import('../store');
  try {
    const token = await firebaseUser.getIdToken(true);
    const userId = firebaseUser.uid;

    let serverUser = null;
    let userStatus = 'free';

    // ✅ CRITICAL: ALWAYS fetch from server to get latest subscription status
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        serverUser = userData.user || userData;
        userStatus = serverUser.subscriptionPlan || serverUser.userStatus || 'free';
        // ✅ CRITICAL: Immediately update localStorage with server status
        localStorage.setItem('userStatus', userStatus);
        localStorage.setItem('userPlan', userStatus);
        localStorage.setItem('subscriptionPlan', userStatus);
        localStorage.setItem('plan', userStatus);
        localStorage.setItem('serverStatus', userStatus);
        localStorage.setItem('serverStatusConfirmed', 'true');
        localStorage.setItem('lastServerFetch', Date.now().toString());

        // ✅ CRITICAL: Background sync to ensure lastLoginAt and profile are up to date
        const syncData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || serverUser.name,
          photoURL: firebaseUser.photoURL
        };
        store.dispatch('user/saveUser', { userData: syncData, token }).catch(err => console.error('Background sync failed', err));
      } else {
      }
    } catch (fetchError) {
    }

    // ✅ CRITICAL: If server fetch failed, try saveUser as fallback
    if (!serverUser) {
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL,
        lastLoginAt: new Date().toISOString()
      };

      try {
        const saveResult = await store.dispatch('user/saveUser', { userData, token });
        if (saveResult && saveResult.success && saveResult.user) {
          serverUser = saveResult.user;
          userStatus = serverUser.subscriptionPlan || serverUser.userStatus || 'free';
          // ✅ CRITICAL: Update localStorage with saved user status
          localStorage.setItem('userStatus', userStatus);
          localStorage.setItem('userPlan', userStatus);
          localStorage.setItem('subscriptionPlan', userStatus);
          localStorage.setItem('plan', userStatus);
        }
      } catch (saveError) {
      }
    }

    // ✅ CRITICAL: Create enhanced user object with server status
    const enhancedUser = {
      ...serverUser,
      firebaseId: firebaseUser.uid,
      _id: serverUser?._id || firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: serverUser?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      subscriptionPlan: userStatus,
      userStatus: userStatus,
      plan: userStatus,
      lastLoginAt: new Date().toISOString(),
      serverStatus: userStatus,
      fetchedFromServer: true,
      serverStatusConfirmed: true,
      lastServerSync: new Date().toISOString()
    };
    // ✅ CRITICAL: Update store with server status
    store.commit('setUser', enhancedUser);
    store.commit('setFirebaseUserId', enhancedUser.firebaseId);
    store.commit('setToken', token);
    store.commit('user/SET_USER', enhancedUser);
    store.commit('user/SET_USER_STATUS', userStatus);
    store.commit('user/FORCE_UPDATE');

    // ✅ CRITICAL: Update localStorage with ALL variations
    localStorage.setItem('user', JSON.stringify(enhancedUser));
    localStorage.setItem('firebaseUserId', enhancedUser.firebaseId);
    localStorage.setItem('userId', enhancedUser.firebaseId);
    localStorage.setItem('token', token);
    localStorage.setItem('userStatus', userStatus);
    localStorage.setItem('userPlan', userStatus);
    localStorage.setItem('subscriptionPlan', userStatus);
    localStorage.setItem('plan', userStatus);
    localStorage.setItem('authMode', 'server-authenticated');

    // ✅ CRITICAL: Set up subscription persistence for paid plans
    if (userStatus !== 'free') {
      await setupSubscriptionPersistence(userStatus, 'server-auth');
    }

    // ✅ CRITICAL: Trigger MULTIPLE global events for maximum compatibility
    const eventData = {
      oldStatus: 'free',
      newStatus: userStatus,
      plan: userStatus,
      userStatus: userStatus,
      subscriptionPlan: userStatus,
      source: 'server-auth-fetch',
      user: enhancedUser,
      timestamp: Date.now(),
      serverFetched: true,
      serverStatusConfirmed: true
    };

    // ✅ CRITICAL: Trigger multiple events with different names
    const eventTypes = [
      'userStatusChanged',
      'userSubscriptionChanged',
      'subscriptionUpdated',
      'userLoggedIn',
      'serverStatusLoaded',
      'globalForceUpdate',
      'authStatusSynced'
    ];

    eventTypes.forEach(eventType => {
      try {
        window.triggerGlobalEvent(eventType, { ...eventData, eventType });
      } catch (eventError) {
      }
    });

    // ✅ CRITICAL: Delayed propagation for stubborn components
    setTimeout(() => {
      window.triggerGlobalEvent('delayedStatusSync', eventData);
    }, 100);
  } catch (error) {
    await handleBasicUserAuthentication(firebaseUser, null, 'free');
  }
}

// ============================================================================
// 🔧 HANDLE BASIC USER AUTHENTICATION (FALLBACK)
// ============================================================================
async function handleBasicUserAuthentication(firebaseUser, token = null, serverStatus = 'free') {
  const { default: store } = await import('../store');
  try {
    let existingStatus = serverStatus;

    if (existingStatus === 'free') {
      // Check stored subscription data as fallback
      const subscription = getStoredSubscription();
      if (subscription && subscription.plan !== 'free' && isSubscriptionValid()) {
        existingStatus = subscription.plan;
      }
    }

    const basicUser = {
      firebaseId: firebaseUser.uid,
      _id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      displayName: firebaseUser.displayName || '',
      subscriptionPlan: existingStatus,
      userStatus: existingStatus,
      plan: existingStatus,
      subscription: existingStatus,
      emailVerified: firebaseUser.emailVerified,
      photoURL: firebaseUser.photoURL,
      lastLoginAt: new Date().toISOString(),
      lastSyncTime: new Date().toISOString(),
      metadata: {
        lastSync: new Date().toISOString(),
        syncSource: 'basic-auth-with-server',
        serverStatusUsed: serverStatus !== 'free'
      }
    };

    // Set up subscription persistence for paid plans
    if (existingStatus && existingStatus !== 'free') {
      await setupSubscriptionPersistence(existingStatus, 'basic-auth-server');
    }

    // Update stores
    store.commit('setUser', basicUser);
    store.commit('setFirebaseUserId', basicUser.firebaseId);
    if (token) {
      store.commit('setToken', token);
    }

    store.commit('user/SET_USER', basicUser);
    store.commit('user/SET_USER_STATUS', existingStatus);

    // Update localStorage with all variations
    try {
      localStorage.setItem('user', JSON.stringify(basicUser));
      localStorage.setItem('firebaseUserId', basicUser.firebaseId);
      localStorage.setItem('userId', basicUser.firebaseId);
      if (token) {
        localStorage.setItem('token', token);
      }
      localStorage.setItem('userStatus', existingStatus);
      localStorage.setItem('userPlan', existingStatus);
      localStorage.setItem('subscriptionPlan', existingStatus);
      localStorage.setItem('plan', existingStatus);
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      localStorage.setItem('authMode', 'basic-with-server');
      localStorage.setItem('serverStatusConfirmed', serverStatus !== 'free' ? 'true' : 'false');
    } catch (storageError) {
    }

    // Trigger events
    const eventData = {
      oldStatus: 'free',
      newStatus: existingStatus,
      source: 'basic-auth-server-sync',
      user: basicUser,
      timestamp: Date.now(),
      serverStatus: serverStatus,
      deviceSync: true
    };

    window.triggerGlobalEvent('userStatusChanged', eventData);
    window.triggerGlobalEvent('userSubscriptionChanged', eventData);
    window.triggerGlobalEvent('userLoggedIn', {
      user: basicUser,
      userStatus: existingStatus,
      source: 'basic-server',
      timestamp: Date.now()
    });

    // Delayed propagation
    setTimeout(() => {
      window.triggerGlobalEvent('deviceStatusSynced', eventData);
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'basic-auth-server-status',
        plan: existingStatus,
        timestamp: Date.now()
      });
    }, 100);
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// 🚪 HANDLE USER NOT AUTHENTICATED
// ============================================================================
async function handleUserNotAuthenticated() {
  const { default: store } = await import('../store');
  try {
    // 🛡️ CRITICAL: Check for valid subscription BEFORE clearing anything
    const validSubscription = localStorage.getItem('validSubscriptionDetected');
    const preserveStatus = localStorage.getItem('preserveStatusDuringAuth');

    if (validSubscription === 'true' && preserveStatus && preserveStatus !== 'free') {
      // Don't clear subscription-related data, but clear other auth data
      const keysToRemove = ['user', 'firebaseUserId', 'userId', 'token', 'lastLoginTime'];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
        }
      });

      // Set preserved status in store
      store.commit('user/SET_USER_STATUS', preserveStatus);

      // Clean up preservation flags
      localStorage.removeItem('validSubscriptionDetected');
      localStorage.removeItem('preserveStatusDuringAuth');
    } else {
      // Normal clearing for truly free users
      await store.dispatch('user/logout');
      store.commit('logout');

      const keysToRemove = ['user', 'firebaseUserId', 'userId', 'token', 'userStatus', 'lastLoginTime', 'subscriptionDetails'];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
        }
      });

      store.commit('user/SET_USER_STATUS', 'free');
    }

    const currentStatus = localStorage.getItem('userStatus') || 'free';

    // Trigger events with current status (might be preserved subscription)
    setTimeout(() => {
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: currentStatus,
        source: 'not-authenticated-preserved',
        timestamp: Date.now()
      });
    }, 100);
  } catch (error) {
    // Force basic state but preserve subscriptions
    try {
      const preserveStatus = localStorage.getItem('preserveStatusDuringAuth');
      if (preserveStatus && preserveStatus !== 'free') {
        store.commit('user/SET_USER_STATUS', preserveStatus);
        localStorage.setItem('userStatus', preserveStatus);
      } else {
        store.commit('user/CLEAR_USER');
        localStorage.setItem('userStatus', 'free');
      }
    } catch (clearError) {
    }
  }
}

// ============================================================================
// 🔧 SETUP AUTH STATE LISTENER (EXPOSED FOR MAIN.JS)
// ============================================================================
export function setupAuthStateListener(store, router, i18n, VueToast) {
  // Auth state listener is already setup in authInitPromise above
}