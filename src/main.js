// src/main.js - UNIFIED FIX: PERFECT AUTHENTICATION + USER STATUS UPDATES

// 🛡️ IMMEDIATE SUBSCRIPTION RESTORATION (RUNS BEFORE EVERYTHING)
function immediateSubscriptionRestore() {
  try {
    const subscriptionJson = localStorage.getItem('subscriptionData');
    if (subscriptionJson) {
      const subscription = JSON.parse(subscriptionJson);
      const now = new Date();
      const expiry = new Date(subscription.expiryDate);
      const isValid = now < expiry;

      if (isValid && subscription.plan !== 'free') {
        // Force all status fields immediately
        localStorage.setItem('userStatus', subscription.plan);
        localStorage.setItem('userPlan', subscription.plan);
        localStorage.setItem('subscriptionPlan', subscription.plan);
        localStorage.setItem('preservedStatus', subscription.plan); // Backup field

        // Set a flag that auth flow should preserve this
        localStorage.setItem('validSubscriptionDetected', 'true');
        localStorage.setItem('preserveStatusDuringAuth', subscription.plan);

        return subscription.plan;
      } else if (!isValid) {
        localStorage.removeItem('subscriptionData');
        localStorage.removeItem('validSubscriptionDetected');
        localStorage.removeItem('preserveStatusDuringAuth');
      }
    }

    return 'free';
  } catch (error) {
    return 'free';
  }
}

// Run immediate restoration
const preservedStatus = immediateSubscriptionRestore();


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

// 🔥 NEW: Continuous subscription monitoring during auth
function setupAuthSubscriptionMonitoring() {
  let monitoringActive = true;

  const monitor = () => {
    if (!monitoringActive) return;

    try {
      const subscriptionJson = localStorage.getItem('subscriptionData');
      const currentStatus = localStorage.getItem('userStatus');

      if (subscriptionJson) {
        const subscription = JSON.parse(subscriptionJson);
        const now = new Date();
        const expiry = new Date(subscription.expiryDate);
        const isValid = now < expiry;

        if (isValid && subscription.plan !== 'free' && currentStatus !== subscription.plan) {


          localStorage.setItem('userStatus', subscription.plan);
          localStorage.setItem('userPlan', subscription.plan);
          localStorage.setItem('subscriptionPlan', subscription.plan);

          // Trigger restoration event
          if (window.triggerGlobalEvent) {
            window.triggerGlobalEvent('userStatusChanged', {
              oldStatus: currentStatus,
              newStatus: subscription.plan,
              source: 'auth-monitoring-restore',
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error) {
    }

    // Continue monitoring
    setTimeout(monitor, 100); // Check every 100ms during auth
  };

  // Start monitoring
  monitor();

  // Stop monitoring after 10 seconds (auth should be complete by then)
  setTimeout(() => {
    monitoringActive = false;
  }, 10000);
}

// Start auth monitoring immediately
setupAuthSubscriptionMonitoring();

// ============================================================================
// 🔥 CRITICAL FIX: RESTRUCTURED AUTHENTICATION & INITIALIZATION
// ============================================================================

// ✅ Auth state tracking with enhanced promises
let authStateResolved = false;
let authResolveFunction = null;
let authRejectFunction = null;

// ✅ Set Firebase auth persistence IMMEDIATELY (BEFORE EVERYTHING ELSE)
setPersistence(auth, browserLocalPersistence).then(() => {
}).catch((error) => {
});

// ✅ CRITICAL: Enhanced authentication promise that waits for COMPLETE initialization
export const authInitPromise = new Promise((resolve, reject) => {
  authResolveFunction = resolve;
  authRejectFunction = reject;


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

  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!authStateResolved) {
      authStateResolved = true;
      unsubscribe();

      try {

        await ensureStoreInitialized();

        if (firebaseUser) {
          await handleUserAuthenticated(firebaseUser);
        } else {
          await handleUserNotAuthenticated();
        }

        await mountVueApplication();


        // Clean up any remaining preservation flags
        localStorage.removeItem('authPreserveStatus');

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
          await mountVueApplicationBasic();
        } catch (mountError) {
        }

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

  // Enhanced timeout with better error handling
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
  }, 8000); // Increased timeout to 8 seconds
});

// ============================================================================
// 🔥 ENHANCED STORE INITIALIZATION WITH BULLETPROOF ERROR HANDLING
// ============================================================================
async function ensureStoreInitialized() {

  try {
    if (store.getters['user/isInitialized']) {

      // But check if subscription needs restoration
      const preserveStatus = localStorage.getItem('authPreserveStatus');
      if (preserveStatus && preserveStatus !== 'free') {
        const currentStoreStatus = store.getters['user/userStatus'];
        if (currentStoreStatus !== preserveStatus) {
          store.commit('user/SET_USER_STATUS', preserveStatus);
        }
      }

      return true;
    }

    await store.dispatch('user/initialize');

    // After initialization, restore subscription if needed
    const preserveStatus = localStorage.getItem('authPreserveStatus') || localStorage.getItem('userStatus');
    if (preserveStatus && preserveStatus !== 'free') {
      store.commit('user/SET_USER_STATUS', preserveStatus);
    }

    setupStoreInterceptor(store);
    appLifecycle.storeReady = true;

    return true;

  } catch (error) {

    try {
      store.commit('user/SET_INITIALIZED', false);

      // Still try to restore subscription even after init failure
      const preserveStatus = localStorage.getItem('authPreserveStatus') || localStorage.getItem('userStatus');
      if (preserveStatus && preserveStatus !== 'free') {
        store.commit('user/SET_USER_STATUS', preserveStatus);
      }

    } catch (commitError) {
    }

    throw error;
  }
}

// ========================================
// FIX 1: Enhanced main.js authentication (replace existing functions)
// ========================================

// ✅ ENHANCED: handleUserAuthenticated with server status check
async function handleUserAuthenticated(firebaseUser) {
  console.log('🔐 Processing authenticated user:', firebaseUser.uid);

  try {
    // Get Firebase ID token with retries
    let token;
    let tokenRetries = 3;

    while (tokenRetries > 0) {
      try {
        token = await firebaseUser.getIdToken(true);
        if (token && token.length > 20) {
          break;
        }
        throw new Error('Invalid token received');
      } catch (tokenError) {
        tokenRetries--;
        if (tokenRetries === 0) {
          console.warn('⚠️ Token retrieval failed, using basic auth');
          await handleBasicUserAuthentication(firebaseUser);
          return;
        }
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

    console.log('📤 Saving user to backend...');

    // ✅ CRITICAL FIX: Robust saveUser with proper error handling
    let saveResult = null;
    let saveRetries = 2;

    while (saveRetries > 0) {
      try {
        console.log(`🔄 Save attempt ${3 - saveRetries + 1}/2`);
        
        // ✅ Call store saveUser action with proper error handling
        const storeResult = await store.dispatch('user/saveUser', { userData, token });

        // ✅ CRITICAL: Validate result object structure
        if (storeResult && typeof storeResult === 'object') {
          if (storeResult.success === true && storeResult.user && typeof storeResult.user === 'object') {
            console.log('✅ User save successful:', storeResult.source || 'unknown');
            saveResult = storeResult;
            break;
          } else if (storeResult.success === false) {
            console.warn('⚠️ Save failed with error:', storeResult.error);
            throw new Error(storeResult.error || 'Save returned failure');
          } else {
            console.warn('⚠️ Save result invalid structure:', storeResult);
            throw new Error('Save result has invalid structure');
          }
        } else {
          console.warn('⚠️ Save result is not an object:', typeof storeResult, storeResult);
          throw new Error('Save result is not a valid object');
        }

      } catch (saveError) {
        console.warn(`❌ Save attempt ${3 - saveRetries + 1} failed:`, saveError.message);
        saveRetries--;

        if (saveRetries === 0) {
          console.log('⚠️ All save attempts failed, creating fallback user...');
          
          // ✅ Create fallback saveResult with proper structure
          saveResult = {
            success: true,
            user: {
              uid: firebaseUser.uid,
              _id: firebaseUser.uid,
              firebaseId: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name,
              subscriptionPlan: 'free',
              userStatus: 'free',
              emailVerified: firebaseUser.emailVerified,
              photoURL: firebaseUser.photoURL,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              authProvider: 'firebase',
              fallbackCreated: true,
              originalError: saveError.message
            },
            source: 'main-js-fallback',
            message: 'User created as fallback in main.js',
            warning: 'Backend save failed - using fallback mode'
          };
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // ✅ ENHANCED: Handle save result - should never be null at this point
    if (saveResult && saveResult.success && saveResult.user) {
      await handleSuccessfulUserSave(saveResult, token, userData);
    } else {
      // ✅ Emergency fallback if saveResult is somehow still invalid
      console.error('🚨 CRITICAL: saveResult is invalid after all attempts:', saveResult);
      await handleBasicUserAuthentication(firebaseUser, token, 'free');
    }

  } catch (error) {
    console.error('❌ Authentication error:', error);
    
    try {
      // ✅ Final fallback: basic authentication
      await handleBasicUserAuthentication(firebaseUser, null, 'free');
    } catch (basicError) {
      console.error('❌ Basic authentication also failed:', basicError);
      await handleUserNotAuthenticated();
    }
  }
}
// ✅ NEW: Function to fetch status from server
async function fetchUserStatusFromServer(userId, token = null) {
  console.log('🔄 Fetching user status from server for:', userId);
  
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoints = [
      `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}/status`,
      `${import.meta.env.VITE_API_BASE_URL}/api/users/${userId}`,
      `https://api.aced.live/api/users/${userId}/status`,
      `https://api.aced.live/api/users/${userId}`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log('🌐 Trying endpoint:', endpoint);
        
        const response = await Promise.race([
          fetch(endpoint, { headers }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          )
        ]);

        if (response.ok) {
          const data = await response.json();
          console.log('📥 Server response:', data);
          
          const serverStatus = data.status || 
                             data.subscriptionPlan || 
                             data.userStatus || 
                             data.user?.subscriptionPlan || 
                             'free';

          if (serverStatus && serverStatus !== 'free') {
            console.log('✅ Found server status:', serverStatus);
            
            // Update localStorage immediately
            localStorage.setItem('userStatus', serverStatus);
            localStorage.setItem('userPlan', serverStatus);
            localStorage.setItem('subscriptionPlan', serverStatus);
            localStorage.setItem('serverStatusFetched', 'true');
            localStorage.setItem('statusSyncTime', Date.now().toString());

            // Set up subscription persistence
            if (serverStatus !== 'free') {
              await setupSubscriptionPersistence(serverStatus, 'server-fetch');
            }

            return serverStatus;
          }
        }
      } catch (endpointError) {
        console.warn('⚠️ Endpoint failed:', endpoint, endpointError.message);
        continue;
      }
    }

    console.warn('⚠️ Could not fetch user status from any endpoint');
    return 'free';

  } catch (error) {
    console.error('❌ Failed to fetch user status from server:', error);
    return 'free';
  }
}

// 🔥 MODIFIED: Enhanced handleBasicUserAuthentication to preserve subscriptions
async function handleBasicUserAuthentication(firebaseUser, token = null, serverStatus = 'free') {
  try {
    console.log('🔧 Handling basic user authentication with server status:', serverStatus);

    // Use server status if available, otherwise check local data
    let existingStatus = serverStatus;
    
    if (existingStatus === 'free') {
      // Check stored subscription data as fallback
      const subscription = getStoredSubscription();
      if (subscription && subscription.plan !== 'free' && isSubscriptionValid()) {
        existingStatus = subscription.plan;
      }
    }

    console.log('📊 Final status for basic auth:', existingStatus);

    // Create user object with server status
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
      console.warn('⚠️ localStorage update failed:', storageError);
    }

    appLifecycle.authReady = true;

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

    console.log('✅ Basic auth completed with server status:', existingStatus);

  } catch (error) {
    console.error('❌ Basic authentication failed:', error);
    throw error;
  }
}


// ✅ ENHANCED: Successful user save handler with subscription persistence
async function handleSuccessfulUserSave(saveResult, token, userData) {
  try {
    console.log('✅ Processing successful user save:', saveResult.source || 'unknown');

    // ✅ ROBUST: Validate saveResult structure
    if (!saveResult || typeof saveResult !== 'object') {
      console.error('❌ Invalid saveResult object:', saveResult);
      throw new Error('saveResult is not a valid object');
    }

    if (!saveResult.user || typeof saveResult.user !== 'object') {
      console.error('❌ Invalid user data in saveResult:', saveResult.user);
      throw new Error('saveResult.user is not a valid object');
    }

    // ✅ Extract user data with multiple fallbacks
    const serverUser = saveResult.user;

    // ✅ CRITICAL: Handle multiple possible status field names with validation
    const extractValidStatus = (user) => {
      const possibleStatuses = [
        user.subscriptionPlan,
        user.userStatus,
        user.plan,
        user.subscription,
        'free' // Ultimate fallback
      ];
      
      for (const status of possibleStatuses) {
        if (status && typeof status === 'string' && ['free', 'start', 'pro', 'premium'].includes(status)) {
          return status;
        }
      }
      
      return 'free';
    };

    const userPlan = extractValidStatus(serverUser);
    console.log('📊 Extracted user plan:', userPlan);

    // ✅ CRITICAL: Enhanced user object with all possible status fields
    const enhancedUser = {
      ...serverUser,
      subscriptionPlan: userPlan,
      userStatus: userPlan,
      plan: userPlan,
      subscription: userPlan,
      lastLoginAt: new Date().toISOString(),
      saveSource: saveResult.source,
      saveSuccess: true
    };

    // ✅ CRITICAL: Set up subscription persistence for paid plans
    if (userPlan && userPlan !== 'free') {
      try {
        await setupSubscriptionPersistence(userPlan, 'successful-save');
      } catch (persistError) {
        console.warn('⚠️ Subscription persistence failed:', persistError);
        // Don't fail the whole operation
      }
    }

    // ✅ Update stores with comprehensive error handling
    try {
      // Update main store (legacy compatibility)
      store.commit('setUser', enhancedUser);
      store.commit('setFirebaseUserId', enhancedUser.firebaseId || enhancedUser._id || enhancedUser.uid);
      store.commit('setToken', token);

      // Update user module store
      store.commit('user/SET_USER', enhancedUser);
      store.commit('user/SET_USER_STATUS', userPlan);

      console.log('✅ Store updates completed successfully');

    } catch (storeUpdateError) {
      console.error('❌ Store update failed:', storeUpdateError);
      
      // Try direct state update as fallback
      try {
        if (store.state.user) {
          store.state.user.user = enhancedUser;
          store.state.user.userStatus = userPlan;
        }
        console.log('✅ Direct state update completed');
      } catch (directUpdateError) {
        console.error('❌ Direct state update also failed:', directUpdateError);
      }
    }

    // ✅ Update localStorage with comprehensive data
    try {
      const storageData = {
        user: enhancedUser,
        firebaseUserId: enhancedUser.firebaseId || enhancedUser._id || enhancedUser.uid,
        userId: enhancedUser.firebaseId || enhancedUser._id || enhancedUser.uid,
        token: token,
        userStatus: userPlan,
        userPlan: userPlan,
        subscriptionPlan: userPlan,
        authMode: 'successful-save',
        lastSaveTime: new Date().toISOString()
      };

      Object.entries(storageData).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        } catch (storageError) {
          console.warn(`⚠️ Failed to save ${key} to localStorage:`, storageError);
        }
      });

      console.log('✅ localStorage updates completed');

    } catch (storageError) {
      console.error('❌ localStorage updates failed:', storageError);
    }

    // Mark auth as ready
    if (typeof appLifecycle !== 'undefined') {
      appLifecycle.authReady = true;
    }

    // ✅ CRITICAL: Immediate status propagation with multiple event types
    const eventData = {
      oldStatus: 'free',
      newStatus: userPlan,
      source: 'login-complete',
      user: enhancedUser,
      timestamp: Date.now(),
      saveResult: {
        success: saveResult.success,
        source: saveResult.source,
        message: saveResult.message
      }
    };

    // Trigger immediately (no delay)
    if (typeof window !== 'undefined' && window.triggerGlobalEvent) {
      window.triggerGlobalEvent('userStatusChanged', eventData);
      window.triggerGlobalEvent('userSubscriptionChanged', eventData);
      window.triggerGlobalEvent('subscriptionUpdated', eventData);
      window.triggerGlobalEvent('userLoggedIn', {
        user: enhancedUser,
        userStatus: userPlan,
        source: saveResult.source || 'unknown',
        timestamp: Date.now()
      });

      // Also trigger with small delay for any stubborn components
      setTimeout(() => {
        window.triggerGlobalEvent('userStatusChanged', eventData);
        window.triggerGlobalEvent('globalForceUpdate', {
          reason: 'user-login-status-update',
          plan: userPlan,
          timestamp: Date.now()
        });
      }, 50);
    }

    // Show warning if it was a fallback save
    if (saveResult.warning) {
      console.warn('⚠️ Save completed with warning:', saveResult.warning);
    }

    console.log('✅ Successful user save processing completed');

  } catch (error) {
    console.error('❌ Failed to process successful user save:', error);
    
    // ✅ Fallback to basic auth even after successful save
    try {
      await handleBasicUserAuthentication({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.name,
        emailVerified: userData.emailVerified,
        photoURL: userData.photoURL
      }, token, 'free');
    } catch (fallbackError) {
      console.error('❌ Fallback auth also failed:', fallbackError);
    }
  }
}

// 🔥 MODIFIED: Enhanced handleUserNotAuthenticated to preserve subscriptions
async function handleUserNotAuthenticated() {

  try {
    // 🛡️ CRITICAL: Check for valid subscription BEFORE clearing anything
    const validSubscription = localStorage.getItem('validSubscriptionDetected');
    const preserveStatus = localStorage.getItem('preserveStatusDuringAuth');

    if (validSubscription === 'true' && preserveStatus && preserveStatus !== 'free') {

      // Don't clear subscription-related data, but clear other auth data
      const keysToRemove = [
        'user', 'firebaseUserId', 'userId', 'token', 'lastLoginTime'
        // NOTE: NOT clearing userStatus, subscriptionData, etc.
      ];

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

      const keysToRemove = [
        'user', 'firebaseUserId', 'userId', 'token',
        'userStatus', 'lastLoginTime', 'subscriptionDetails'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
        }
      });

      store.commit('user/SET_USER_STATUS', 'free');
    }

    // Mark auth as ready
    appLifecycle.authReady = true;

    // Trigger events with current status (might be preserved subscription)
    const currentStatus = localStorage.getItem('userStatus') || 'free';
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

    appLifecycle.authReady = true;
  }
}


// ============================================================================
// 🔥 ENHANCED VUE APPLICATION MOUNTING
// ============================================================================
async function mountVueApplication() {

  try {
    app = createApp(App);

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

    // Install plugins
    app.use(store);
    app.use(router);
    app.use(VueToast, {
      position: 'top-center',
      duration: 4000,
      dismissible: true
    });
    app.use(i18n);

    // Enhanced error handler
    app.config.errorHandler = (error, instance, info) => {

      // Handle specific length errors
      if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {

        eventBus.emit('lengthPropertyError', {
          error: error.message,
          component: instance?.$options?.name || 'Unknown',
          info,
          timestamp: Date.now()
        });

        // Try to recover
        try {
          store.commit('user/FORCE_UPDATE');
          window.triggerGlobalEvent('globalForceUpdate', {
            reason: 'length-error-recovery',
            timestamp: Date.now()
          });
        } catch (recoveryError) {
        }
      }

      eventBus.emit('vueError', {
        error: error.message,
        component: instance?.$options?.name || 'Unknown',
        info,
        timestamp: Date.now()
      });
    };

    // Mount the application
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;

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

    // Final status propagation
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

    eventBus.emit('appMountError', {
      error: error.message,
      timestamp: Date.now()
    });

    throw error;
  }
}

// ============================================================================
// 🔥 BASIC VUE APPLICATION MOUNTING (FALLBACK)
// ============================================================================
async function mountVueApplicationBasic() {

  try {
    app = createApp(App);

    // Basic plugins only
    app.use(store);
    app.use(router);
    app.use(i18n);

    // Basic error handler
    app.config.errorHandler = (error, instance, info) => {
    };

    // Mount the application
    app.mount('#app');
    isApplicationMounted = true;
    appLifecycle.mounted = true;

    return true;

  } catch (error) {
    throw error;
  }
}

// ============================================================================
// 🔥 ENHANCED GLOBAL EVENT TRIGGERING SYSTEM (MOVED UP)
// ============================================================================

window.triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {

    // ✅ CRITICAL FIX: Handle empty string and extract actual status
    const { newStatus, plan, userStatus, subscriptionPlan, oldStatus } = data;

    // ✅ CRITICAL: Filter out empty strings and invalid values
    const validStatus = (status) => {
      return status &&
        status !== '' &&
        status !== 'undefined' &&
        status !== undefined &&
        status !== null &&
        ['free', 'start', 'pro', 'premium'].includes(status);
    };

    // Find the first valid status or default to preserving current
    let actualNewStatus = null;
    const possibleStatuses = [newStatus, plan, userStatus, subscriptionPlan];

    for (const status of possibleStatuses) {
      if (validStatus(status)) {
        actualNewStatus = status;
        break;
      }
    }

    // If no valid status found, get current status from localStorage
    if (!actualNewStatus) {
      const currentLocalStatus = localStorage.getItem('userStatus');
      if (validStatus(currentLocalStatus)) {
        actualNewStatus = currentLocalStatus;
      } else {
        actualNewStatus = 'free'; // Ultimate fallback
      }
    }

    const enhancedData = {
      ...data,
      eventName,
      source: data.source || 'global-trigger',
      timestamp: data.timestamp || Date.now(),
      version: '2.0',
      // ✅ CRITICAL: Use the resolved valid status
      newStatus: actualNewStatus,
      plan: actualNewStatus,
      userStatus: actualNewStatus,
      subscriptionPlan: actualNewStatus,
      oldStatus: oldStatus || 'free'
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
      }
    }

  } catch (eventError) {
  }
};

// ============================================================================
// 🚀 ENHANCED EVENT BUS (MOVED UP)
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
    }

    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
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

// ============================================================================
// 🔥 STORE MUTATION INTERCEPTOR FOR AUTOMATIC EVENT TRIGGERING
// ============================================================================
const setupStoreInterceptor = (store) => {
  store.subscribe((mutation, state) => {

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

// Create and export global event bus
const eventBus = new AdvancedEventBus();
window.eventBus = eventBus;
export { eventBus };

// ============================================================================
// 🌐 INTERNATIONALIZATION SETUP
// ============================================================================
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ============================================================================
// 🎯 APPLICATION STATE MANAGEMENT
// ============================================================================
let app;
let isApplicationMounted = false;

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

  const handleGlobalSubscriptionChange = (event) => {

    // ✅ CRITICAL FIX: Extract plan from event detail with multiple fallbacks AND message parsing
    const { plan, newStatus, userStatus, subscriptionPlan, message } = event.detail || {};
    let actualPlan = plan || newStatus || userStatus || subscriptionPlan;
    const { source, oldPlan, timestamp } = event.detail || {};

    // ✅ CRITICAL: If plan is empty/undefined but we have a success message, parse it
    if ((!actualPlan || actualPlan === '' || actualPlan === 'undefined') && message) {

      // Parse plan from success messages
      if (message.includes('START') || message.includes('start')) {
        actualPlan = 'start';
      } else if (message.includes('PRO') || message.includes('pro')) {
        actualPlan = 'pro';
      } else if (message.includes('FREE') || message.includes('free')) {
        actualPlan = 'free';
      }
    }

    // ✅ CRITICAL: Check if this is a promocode success and localStorage was updated
    if (source === 'promocode' && (!actualPlan || actualPlan === '')) {
      const localStatus = localStorage.getItem('userStatus');
      const localPlan = localStorage.getItem('userPlan');
      const localSubscription = localStorage.getItem('subscriptionPlan');

      // Use localStorage value if it's valid and not 'free'
      const possiblePlans = [localStatus, localPlan, localSubscription];
      for (const possiblePlan of possiblePlans) {
        if (possiblePlan && possiblePlan !== 'free' && ['start', 'pro'].includes(possiblePlan)) {
          actualPlan = possiblePlan;
          break;
        }
      }
    }

    // Final fallback
    if (!actualPlan || actualPlan === '' || actualPlan === 'undefined') {
      actualPlan = 'free';
    }


    // ✅ CRITICAL: Validate the plan before proceeding
    if (!['free', 'start', 'pro', 'premium'].includes(actualPlan)) {
      actualPlan = 'free';
    }

    // Update page title
    const planLabel = actualPlan === 'pro' ? 'Pro' : actualPlan === 'start' ? 'Start' : 'Free';
    if (document.title && !document.title.includes('|')) {
      document.title = `ACED | ${planLabel}`;
    }

    // Update body classes for CSS styling
    document.body.className = document.body.className.replace(/user-plan-\w+/g, '');
    document.body.classList.add(`user-plan-${actualPlan}`);

    // Update localStorage immediately with all variations
    localStorage.setItem('userStatus', actualPlan);
    localStorage.setItem('userPlan', actualPlan);
    localStorage.setItem('subscriptionPlan', actualPlan);
    localStorage.setItem('statusUpdateTime', Date.now().toString());

    // Update store if not already updated
    try {
      const currentStoreStatus = store.getters['user/userStatus'];

      if (currentStoreStatus !== actualPlan) {
        store.commit('user/SET_USER_STATUS', actualPlan);

        // Also try legacy mutations
        try {
          store.commit('user/setUserStatus', actualPlan);
        } catch (e) {
        }

        // Direct state update as backup
        if (store.state.user) {
          store.state.user.userStatus = actualPlan;
          store.state.user.subscriptionPlan = actualPlan;
          store.state.user.plan = actualPlan;
        }
      }
    } catch (storeError) {
    }

    // Force Vue app update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
      }
    }

    // ✅ CRITICAL: Emit multiple event types with the ACTUAL plan value
    const eventData = {
      reason: 'subscription-change',
      plan: actualPlan,
      newStatus: actualPlan,
      userStatus: actualPlan,
      subscriptionPlan: actualPlan,
      source: source || 'global-change',
      oldPlan: oldPlan || 'free',
      timestamp: timestamp || Date.now(),
      message: message // Preserve original message
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
    if (actualPlan !== 'free' && (oldPlan === 'free' || !oldPlan)) {
      const sourceText = source === 'promocode' ? 'промокоду' : 'оплате';

      eventBus.emit('subscriptionUpgrade', {
        plan: actualPlan,
        newStatus: actualPlan,
        source: source || 'upgrade',
        message: message || `Поздравляем! ${planLabel} подписка активирована по ${sourceText}!`,
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

    // ✅ CRITICAL FIX: Extract the actual status value with multiple fallbacks
    const { newStatus, plan, userStatus, subscriptionPlan } = data || {};
    let actualStatus = newStatus || plan || userStatus || subscriptionPlan || 'free';

    // ✅ CRITICAL: Validate the status
    if (!['free', 'start', 'pro', 'premium'].includes(actualStatus)) {
      actualStatus = 'free';
    }

    // Sync with localStorage using all field variations
    try {
      localStorage.setItem('userStatus', actualStatus);
      localStorage.setItem('userPlan', actualStatus);
      localStorage.setItem('subscriptionPlan', actualStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
    } catch (storageError) {
    }

    // ✅ CRITICAL: Also update the store to ensure consistency
    try {
      const currentStoreStatus = store.getters['user/userStatus'];
      if (currentStoreStatus !== actualStatus) {
        store.commit('user/SET_USER_STATUS', actualStatus);

        // Try legacy mutations too
        try {
          store.commit('user/setUserStatus', actualStatus);
        } catch (e) {
          // Ignore if not present
        }
      }
    } catch (storeError) {
    }

    // Force app update with error handling
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();

        // Also trigger $nextTick for delayed components
        app._instance.proxy.$nextTick(() => {
          // Do nothing, just trigger the tick
        });
      } catch (error) {
      }
    }
  });

  eventBus.on('promocodeApplied', (data) => {

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
    }
  }, 30000); // Check every 30 seconds

}

// ============================================================================
// 🌟 ENHANCED GLOBAL ERROR HANDLING
// ============================================================================

// Enhanced global JavaScript error handler
window.addEventListener('error', (event) => {

  // Check if error is related to user status/arrays
  if (event.error?.message?.includes('length') ||
    event.error?.message?.includes('Cannot read properties of undefined')) {

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

  // Check if rejection is related to user status operations
  if (event.reason?.message?.includes('userStatus') ||
    event.reason?.message?.includes('subscription')) {

    try {
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'promise-rejection-recovery',
        originalError: event.reason?.message,
        timestamp: Date.now()
      });
    } catch (recoveryError) {
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

    // Validate status values
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!validStatuses.includes(newStatus)) {
      return;
    }

    // ✅ CRITICAL: Update store immediately
    try {
      store.commit('user/SET_USER_STATUS', newStatus);
    } catch (storeError) {
    }

    // Update localStorage immediately with all variations
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
    } catch (storageError) {
    }

    // ✅ CRITICAL: Trigger multiple events immediately
    const eventData = {
      oldStatus,
      newStatus,
      source,
      timestamp: Date.now()
    };

    window.triggerGlobalEvent('userStatusChanged', eventData);
    window.triggerGlobalEvent('userSubscriptionChanged', eventData);
    window.triggerGlobalEvent('subscriptionUpdated', eventData);
    window.triggerGlobalEvent('globalForceUpdate', {
      reason: 'manual-status-change',
      plan: newStatus,
      timestamp: Date.now()
    });

    // Force Vue app update if available
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
      }
    }

  };

  // Enhanced Force update helper
  window.emitForceUpdate = (reason = 'manual') => {

    // Trigger through global event system
    window.triggerGlobalEvent('globalForceUpdate', {
      reason,
      timestamp: Date.now()
    });

    // Also force store update
    try {
      store.commit('user/FORCE_UPDATE');
    } catch (error) {
    }
  };

  // Enhanced User change listener helper with cleanup
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

    // Also register DOM event listener for userSubscriptionChanged
    window.addEventListener('userSubscriptionChanged', callback);

    // Return cleanup function
    return () => {
      events.forEach(event => eventBus.off(event, callback));
      window.removeEventListener('userSubscriptionChanged', callback);
    };
  };

  // Direct store status getter helper
  window.getCurrentUserStatus = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');



      // Return local storage if store is undefined/null
      return storeStatus || localStatus || 'free';
    } catch (error) {
      return localStorage.getItem('userStatus') || 'free';
    }
  };

  // ✅ NEW: Store status repair function
  window.repairStoreStatus = () => {

    const localStatus = localStorage.getItem('userStatus') ||
      localStorage.getItem('userPlan') ||
      localStorage.getItem('subscriptionPlan') ||
      'free';

    try {

      // ✅ CRITICAL: Initialize user state if it doesn't exist
      if (!store.state.user) {

        // Try to register the user module if it's missing
        try {
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
        }
      });

      // ✅ CRITICAL: Direct state update regardless of mutations
      if (store.state.user) {
        store.state.user.userStatus = localStatus;
        store.state.user.subscriptionPlan = localStatus;
        store.state.user.plan = localStatus;
      }

      // Check the result
      const newStoreStatus = store.getters['user/userStatus'];

      // ✅ CRITICAL: If getter still fails, create a working getter
      if (!newStoreStatus || newStoreStatus === 'undefined') {

        // Create backup getter function
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

  // Status sync helper for components
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
  } catch (error) {
  }
};

// ✅ Enhanced Error recovery with user status sync
async function recoverUserStatus() {

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
      }
    }

    // If no cached data, set default state
    store.commit('user/SET_USER_STATUS', 'free');
    store.commit('user/CLEAR_USER');


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
    return false;
  }
}

// Development debugging tools
if (import.meta.env.DEV) {
  // Expose core objects for debugging
  window.$store = store;
  window.$eventBus = eventBus;
  window.$userStatus = () => store.getters['user/userStatus'];
  window.$appLifecycle = appLifecycle;
  window.$authInitPromise = authInitPromise;

  // ✅ NEW: Add emergency fix function to dev tools
  window.emergencyFixSubscription = function() {

    // 1. Clear all broken subscription data
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('subscriptionExpiry');
    localStorage.removeItem('subscriptionActivated');

    // 2. Set up proper START subscription with 1-year expiry
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

    const subscriptionData = {
      plan: 'start',
      activatedAt: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      lastUpdated: now.toISOString(),
      source: 'emergency-fix',
      status: 'active'
    };

    // 3. Store the fixed subscription data
    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    localStorage.setItem('subscriptionPlan', 'start');
    localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
    localStorage.setItem('subscriptionActivated', subscriptionData.activatedAt);
    localStorage.setItem('userStatus', 'start');
    localStorage.setItem('userPlan', 'start');


    // 4. Trigger status update events
    if (window.triggerGlobalEvent) {
      window.triggerGlobalEvent('userStatusChanged', {
        oldStatus: 'free',
        newStatus: 'start',
        source: 'emergency-fix',
        timestamp: Date.now()
      });
    }

    // 5. Update store if available
    if (window.$store) {
      try {
        window.$store.commit('user/SET_USER_STATUS', 'start');
      } catch (error) {
      }
    }



    return subscriptionData;
  };

  // ✅ CRITICAL: Add direct status testing functions
  window.testUserStatus = {
    setFree: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      window.emitUserStatusChange(currentStatus, 'free', 'debug-test');
    },
    setStart: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      window.emitUserStatusChange(currentStatus, 'start', 'debug-test');
    },
    setPro: () => {
      const currentStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unknown';
      window.emitUserStatusChange(currentStatus, 'pro', 'debug-test');
    },

    getCurrentStatus: () => {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const workingStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unavailable';



      // ✅ NEW: Check if store status is literally the string 'undefined'
      if (storeStatus === 'undefined' || storeStatus === undefined || storeStatus === null) {
        window.repairStoreStatus();
      }

      return {
        store: storeStatus,
        localStorage: localStatus,
        working: workingStatus,
        effective: workingStatus !== 'unavailable' ? (localStatus || 'free') : 'unknown'
      };
    },

    forceStatusUpdate: (status) => {
      if (!['free', 'start', 'pro'].includes(status)) {
        return;
      }


      // ✅ CRITICAL: First repair the store if needed
      window.repairStoreStatus();

      // Update store with multiple mutations and verify each one
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
          const newValue = store.getters['user/userStatus'];
        } catch (e) {
        }
      });

      // ✅ CRITICAL: Direct state update if getters still fail
      if (store.state.user) {
        store.state.user.userStatus = status;
        store.state.user.subscriptionPlan = status;
        store.state.user.plan = status;
      }

      // Update user object if it exists
      if (store.state.user && typeof store.state.user === 'object') {
        const userObj = store.getters['user/getUser'] || store.state.user;
        if (userObj) {
          userObj.userStatus = status;
          userObj.subscriptionPlan = status;
          userObj.plan = status;

          // Update user object in store
          try {
            store.commit('user/SET_USER', userObj);
          } catch (e) {
          }
        }
      }

      // Update localStorage with all variations
      localStorage.setItem('userStatus', status);
      localStorage.setItem('userPlan', status);
      localStorage.setItem('subscriptionPlan', status);
      localStorage.setItem('statusUpdateTime', Date.now().toString());

      // ✅ CRITICAL: Force store reactivity
      try {
        store.commit('user/FORCE_UPDATE');
      } catch (e) {
      }

      // Trigger all events with proper data structure
      const eventData = {
        oldStatus: null,
        newStatus: status,
        plan: status,
        userStatus: status,
        subscriptionPlan: status,
        source: 'debug-force',
        timestamp: Date.now()
      };

      window.triggerGlobalEvent('userStatusChanged', eventData);
      window.triggerGlobalEvent('userSubscriptionChanged', eventData);
      window.triggerGlobalEvent('subscriptionUpdated', eventData);
      window.triggerGlobalEvent('globalForceUpdate', {
        reason: 'debug-force-update',
        plan: status,
        newStatus: status,
        timestamp: Date.now()
      });

      // Force Vue update
      if (app?._instance) {
        try {
          app._instance.proxy.$forceUpdate();
        } catch (error) {
        }
      }


      // Verify the change worked
      setTimeout(() => {
        const verification = window.testUserStatus.getCurrentStatus();

        // Additional verification
        const finalStoreStatus = store.getters['user/userStatus'];
        const finalLocalStatus = localStorage.getItem('userStatus');
      }, 100);
    }
  };

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
      }
    },

    testAuthFlow: async () => {
      try {
        await authInitPromise;
      } catch (error) {
      }
    },

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

        const result = await store.dispatch('user/saveUser', {
          userData: testUser,
          token: testToken
        });

        return result;

      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    forceBasicAuth: () => {

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

}



// ============================================================================
// 🚀 ADDITIONAL STATUS CHANGE HOOKS FOR EXTERNAL INTEGRATIONS
// ============================================================================

// Global hook for external scripts to trigger status changes
window.updateUserSubscription = (newPlan, source = 'external') => {

  if (!['free', 'start', 'pro'].includes(newPlan)) {
    return false;
  }

  const oldStatus = window.getCurrentUserStatus();
  window.emitUserStatusChange(oldStatus, newPlan, source);

  return true;
};

// Hook for promocode applications
window.applyPromocode = (promocode, newPlan) => {

  // ✅ CRITICAL: Validate the plan properly
  if (!newPlan || !['free', 'start', 'pro'].includes(newPlan)) {
    return false;
  }

  const oldStatus = window.getCurrentUserStatus();

  // ✅ CRITICAL: Update the status with proper validation
  window.emitUserStatusChange(oldStatus, newPlan, 'promocode');

  // Trigger promocode-specific events with validated data
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

  // Also trigger global events
  window.triggerGlobalEvent('userSubscriptionChanged', eventData);
  window.triggerGlobalEvent('subscriptionUpdated', eventData);

  return true;
};

// ✅ CRITICAL: Add comprehensive subscription persistence system
async function setupSubscriptionPersistence(plan, source = 'manual') {
  if (!plan || plan === 'free') {
    return;
  }


  const now = new Date();
  // ✅ FIXED: Set expiry to 1 year instead of 30 days
  const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

  // Check if we already have a valid subscription
  const existingSubscription = getStoredSubscription();

  let subscriptionData;

  // ✅ FIXED: Preserve existing valid subscriptions properly
  if (existingSubscription && existingSubscription.plan === plan && existingSubscription.expiryDate) {
    const existingExpiry = new Date(existingSubscription.expiryDate);
    if (existingExpiry > now) {
      // Keep existing expiry if still valid
      subscriptionData = { ...existingSubscription, lastUpdated: now.toISOString(), source: source };
    } else {
      // If expired, create a new one
      subscriptionData = {
        plan: plan,
        activatedAt: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        lastUpdated: now.toISOString(),
        source: source,
        status: 'active'
      };
    }
  } else {
    // Create new subscription or update plan
    subscriptionData = {
      plan: plan,
      activatedAt: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      lastUpdated: now.toISOString(),
      source: source,
      status: 'active'
    };
  }

  // Store in localStorage with multiple keys for reliability
  try {
    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    localStorage.setItem('subscriptionPlan', plan);
    localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
    localStorage.setItem('subscriptionActivated', subscriptionData.activatedAt);
    localStorage.setItem('userStatus', plan);
    localStorage.setItem('userPlan', plan);

  } catch (error) {
  }

  // Setup expiry check
  setupSubscriptionExpiryCheck();

  return subscriptionData;
}

// ✅ CRITICAL & FIXED: Get stored subscription data and prevent corruption
function getStoredSubscription() {
  try {
    const subscriptionJson = localStorage.getItem('subscriptionData');
    if (subscriptionJson) {
      const subscription = JSON.parse(subscriptionJson);
      // ✅ NEW: Add validation to parsed subscription data
      if (subscription && subscription.plan && subscription.expiryDate) {
        return subscription;
      } else {
        localStorage.removeItem('subscriptionData');
      }
    }

    // Fallback: try to reconstruct from individual keys
    const plan = localStorage.getItem('subscriptionPlan') || localStorage.getItem('userStatus');
    const expiry = localStorage.getItem('subscriptionExpiry');
    const activated = localStorage.getItem('subscriptionActivated');

    // ✅ FIXED: Only reconstruct if plan AND expiry are valid.
    if (plan && plan !== 'free' && expiry) {
      const fallbackSubscription = {
        plan: plan,
        expiryDate: expiry,
        activatedAt: activated || new Date().toISOString(), // Provide a default if missing
        status: 'active',
        source: 'fallback-reconstruction'
      };
      // ✅ Store the reconstructed data in the proper format to fix it for the future
      localStorage.setItem('subscriptionData', JSON.stringify(fallbackSubscription));
      return fallbackSubscription;
    }

  } catch (error) {
    // Clear potentially corrupted data on parsing error
    localStorage.removeItem('subscriptionData');
  }

  return null;
}

// ✅ CRITICAL: Check if subscription is still valid
function isSubscriptionValid() {
  const subscription = getStoredSubscription();

  if (!subscription || !subscription.expiryDate) {
    return false;
  }

  const now = new Date();
  const expiryDate = new Date(subscription.expiryDate);
  const isValid = now < expiryDate;


  return isValid;
}

// ✅ CRITICAL: Setup automatic expiry checking
function setupSubscriptionExpiryCheck() {
  // Clear any existing interval
  if (window.subscriptionCheckInterval) {
    clearInterval(window.subscriptionCheckInterval);
  }

  // ✅ FIXED: Reduced frequency from 5 minutes to 1 hour
  window.subscriptionCheckInterval = setInterval(() => {

    const subscription = getStoredSubscription();
    if (!subscription || subscription.plan === 'free') {
      return; // No need to check free subscriptions
    }

    if (!isSubscriptionValid()) {
      handleSubscriptionExpiry(subscription);
    } else {
    }
  }, 60 * 60 * 1000); // Check every hour instead of every 5 minutes

  // ✅ FIXED: Delayed initial check by 30 seconds (was 5 seconds)
  setTimeout(() => {
    const subscription = getStoredSubscription();
    if (subscription && subscription.plan !== 'free' && !isSubscriptionValid()) {
      handleSubscriptionExpiry(subscription);
    }
  }, 30000); // Wait 30 seconds before initial check

}

// ✅ CRITICAL: Handle subscription expiry
function handleSubscriptionExpiry(expiredSubscription) {

  // Update all storage to free
  localStorage.setItem('userStatus', 'free');
  localStorage.setItem('userPlan', 'free');
  localStorage.setItem('subscriptionPlan', 'free');

  // Mark subscription as expired
  const expiredData = {
    ...expiredSubscription,
    status: 'expired',
    expiredAt: new Date().toISOString()
  };
  localStorage.setItem('subscriptionData', JSON.stringify(expiredData));

  // Update store
  try {
    store.commit('user/SET_USER_STATUS', 'free');
  } catch (error) {
  }

  // ✅ FIXED: Use window.triggerGlobalEvent since it's now defined
  window.triggerGlobalEvent('userStatusChanged', {
    oldStatus: expiredSubscription.plan,
    newStatus: 'free',
    source: 'subscription-expired',
    timestamp: Date.now()
  });

  window.triggerGlobalEvent('subscriptionExpired', {
    expiredPlan: expiredSubscription.plan,
    expiryDate: expiredSubscription.expiryDate,
    timestamp: Date.now()
  });

  // Show notification
  if (window.eventBus) {
    eventBus.emit('subscriptionExpired', {
      plan: expiredSubscription.plan,
      message: `Ваша ${expiredSubscription.plan === 'pro' ? 'Pro' : 'Start'} подписка истекла. Обновите план для продолжения использования премиум функций.`,
      timestamp: Date.now()
    });
  }

}

// ✅ CRITICAL: Add smart promocode detection based on your logs
window.smartPromocodeDetection = () => {

  // Check localStorage for any signs of promocode success
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

    // Check if store is synced
    const storeStatus = store.getters['user/userStatus'];
    if (!storeStatus || storeStatus === 'undefined' || storeStatus !== detectedPlan) {
      window.repairStoreStatus();
    }
  }

  return null;
};

// Run smart detection on a timer
setInterval(() => {
  window.smartPromocodeDetection();
}, 5000); // Check every 5 seconds

// Hook for payment completions
window.paymentCompleted = (transactionId, plan, amount) => {

  if (!['start', 'pro'].includes(plan)) {
    return false;
  }

  const oldStatus = window.getCurrentUserStatus();

  // Update the status
  window.emitUserStatusChange(oldStatus, plan, 'payment');

  // Trigger payment-specific events
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
// ✅ CRITICAL: Initialize subscription system

// Setup subscription expiry checking
setupSubscriptionExpiryCheck();

// Check if user has a valid subscription on startup
const existingSubscription = getStoredSubscription();
if (existingSubscription && existingSubscription.plan !== 'free') {
  if (isSubscriptionValid()) {
    // Ensure store and localStorage are synced with valid subscription
    localStorage.setItem('userStatus', existingSubscription.plan);
    localStorage.setItem('userPlan', existingSubscription.plan);
    localStorage.setItem('subscriptionPlan', existingSubscription.plan);
  } else {
    handleSubscriptionExpiry(existingSubscription);
  }
}

// ✅ CRITICAL: Add direct status testing functions
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
    const storeStatus = store.getters['user/userStatus'];
    const localStatus = localStorage.getItem('userStatus');
    const workingStatus = window.getWorkingUserStatus ? window.getWorkingUserStatus() : 'unavailable';
    const subscription = getStoredSubscription();


    // ✅ NEW: Check if store status is literally the string 'undefined'
    if (storeStatus === 'undefined' || storeStatus === undefined || storeStatus === null) {
      window.repairStoreStatus();
    }

    return {
      store: storeStatus,
      localStorage: localStatus,
      working: workingStatus,
      subscription: subscription,
      subscriptionValid: subscription ? isSubscriptionValid() : false,
      effective: workingStatus !== 'unavailable' ? (localStatus || 'free') : 'unknown'
    };
  },

  forceStatusUpdate: (status) => {
    if (!['free', 'start', 'pro'].includes(status)) {
      return;
    }


    // ✅ CRITICAL: Set up subscription persistence for paid plans
    if (status !== 'free') {
      setupSubscriptionPersistence(status, 'debug-force');
    }

    // ✅ CRITICAL: First repair the store if needed
    window.repairStoreStatus();

    // Update store with multiple mutations and verify each one
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
        const newValue = store.getters['user/userStatus'];
      } catch (e) {
      }
    });

    // ✅ CRITICAL: Direct state update if getters still fail
    if (store.state.user) {
      store.state.user.userStatus = status;
      store.state.user.subscriptionPlan = status;
      store.state.user.plan = status;
    }

    // Update user object if it exists
    if (store.state.user && typeof store.state.user === 'object') {
      const userObj = store.getters['user/getUser'] || store.state.user;
      if (userObj) {
        userObj.userStatus = status;
        userObj.subscriptionPlan = status;
        userObj.plan = status;

        // Update user object in store
        try {
          store.commit('user/SET_USER', userObj);
        } catch (e) {
        }
      }
    }

    // Update localStorage with all variations
    localStorage.setItem('userStatus', status);
    localStorage.setItem('userPlan', status);
    localStorage.setItem('subscriptionPlan', status);
    localStorage.setItem('statusUpdateTime', Date.now().toString());

    // ✅ CRITICAL: Force store reactivity
    try {
      store.commit('user/FORCE_UPDATE');
    } catch (e) {
    }

    // Trigger all events with proper data structure
    const eventData = {
      oldStatus: null,
      newStatus: status,
      plan: status,
      userStatus: status,
      subscriptionPlan: status,
      source: 'debug-force',
      timestamp: Date.now()
    };

    window.triggerGlobalEvent('userStatusChanged', eventData);
    window.triggerGlobalEvent('userSubscriptionChanged', eventData);
    window.triggerGlobalEvent('subscriptionUpdated', eventData);
    window.triggerGlobalEvent('globalForceUpdate', {
      reason: 'debug-force-update',
      plan: status,
      newStatus: status,
      timestamp: Date.now()
    });

    // Force Vue update
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
      }
    }


    // Verify the change worked
    setTimeout(() => {
      const verification = window.testUserStatus.getCurrentStatus();

      // Additional verification
      const finalStoreStatus = store.getters['user/userStatus'];
      const finalLocalStatus = localStorage.getItem('userStatus');
      const finalSubscription = getStoredSubscription();
    }, 100);
  },

  // ✅ NEW: Subscription management functions
  getSubscription: () => {
    return getStoredSubscription();
  },

  checkSubscriptionValidity: () => {
    return isSubscriptionValid();
  },

  extendSubscription: (days = 30) => {
    const subscription = getStoredSubscription();
    if (!subscription || subscription.plan === 'free') {
      return false;
    }

    const currentExpiry = new Date(subscription.expiryDate);
    const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));

    subscription.expiryDate = newExpiry.toISOString();
    subscription.lastUpdated = new Date().toISOString();

    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
    localStorage.setItem('subscriptionExpiry', subscription.expiryDate);

    return true;
  },

  clearSubscription: () => {
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('subscriptionExpiry');
    localStorage.removeItem('subscriptionActivated');
    localStorage.setItem('userStatus', 'free');
    localStorage.setItem('userPlan', 'free');
    localStorage.setItem('subscriptionPlan', 'free');

  }
};