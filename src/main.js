
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

// ============================================================================
// 🔥 CRITICAL FIX: RESTRUCTURED AUTHENTICATION & INITIALIZATION
// ============================================================================

// ✅ Auth state tracking with enhanced promises
let authStateResolved = false;
let authResolveFunction = null;
let authRejectFunction = null;

// ✅ Set Firebase auth persistence IMMEDIATELY (BEFORE EVERYTHING ELSE)
setPersistence(auth, browserLocalPersistence).then(() => {
console.log('✅ Firebase auth persistence set to LOCAL');
}).catch((error) => {
console.error('❌ Failed to set auth persistence:', error);
});

// ✅ CRITICAL: Enhanced authentication promise that waits for COMPLETE initialization
export const authInitPromise = new Promise((resolve, reject) => {
authResolveFunction = resolve;
authRejectFunction = reject;

console.log('🔐 Starting ENHANCED authentication check...');

const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  // We only want this to run ONCE on the initial page load to resolve the promise.
  if (!authStateResolved) {
    authStateResolved = true;
    // After this first check, we don't need the listener for this promise anymore.
    unsubscribe();
    
    console.log('🔐 Auth state determined:', firebaseUser ? `${firebaseUser.email} (authenticated)` : 'not authenticated');
    
    try {
      // 🔥 CRITICAL: Complete initialization BEFORE resolving
      console.log('🚀 Starting complete application initialization...');
      
      // First, ensure store is initialized
      await ensureStoreInitialized();
      
      // Then handle the authentication result
      if (firebaseUser) {
        await handleUserAuthenticated(firebaseUser);
      } else {
        await handleUserNotAuthenticated();
      }
      
      // Finally, mount the Vue application
      await mountVueApplication();
      
      console.log('✅ COMPLETE authentication and app initialization finished');
      
      // Small delay to ensure everything is settled
      setTimeout(() => {
        console.log('🎉 Authentication promise resolving...');
        resolve({
          authenticated: !!firebaseUser,
          user: firebaseUser,
          appReady: true,
          timestamp: Date.now()
        });
      }, 50);
      
    } catch (error) {
      console.error('❌ Critical initialization failed during auth check:', error);
      
      // Still try to mount the app in basic state
      try {
        await mountVueApplicationBasic();
      } catch (mountError) {
        console.error('❌ Basic app mount also failed:', mountError);
      }
      
      // Resolve anyway to prevent app from being stuck, but indicate error
      setTimeout(() => {
        resolve({
          authenticated: false,
          user: null,
          appReady: false,
          error: error.message,
          timestamp: Date.now()
        });
      }, 50);
    }
  }
});

// Enhanced timeout with better error handling
setTimeout(() => {
  if (!authStateResolved) {
    console.warn('⚠️ Auth check timed out - proceeding with fallback initialization');
    authStateResolved = true;
    unsubscribe();
    
    // Fallback initialization
    Promise.resolve()
      .then(() => ensureStoreInitialized())
      .then(() => handleUserNotAuthenticated())
      .then(() => mountVueApplicationBasic())
      .then(() => {
        console.log('✅ Fallback initialization completed');
        resolve({
          authenticated: false,
          user: null,
          appReady: true,
          timedOut: true,
          timestamp: Date.now()
        });
      })
      .catch((fallbackError) => {
        console.error('❌ Even fallback initialization failed:', fallbackError);
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
console.log('🏪 Ensuring Vuex store is initialized...');

try {
  // Check if store is already initialized
  if (store.getters['user/isInitialized']) {
    console.log('✅ Store already initialized');
    return true;
  }
  
  // Initialize the user store module
  await store.dispatch('user/initialize');
  
  // Setup store mutation interceptor for global events
  setupStoreInterceptor(store);
  
  // Mark as ready
  appLifecycle.storeReady = true;
  
  console.log('✅ Store initialization completed successfully');
  return true;
  
} catch (error) {
  console.error('❌ Store initialization failed:', error);
  
  // Try to set basic store state manually
  try {
    store.commit('user/SET_INITIALIZED', false);
    console.log('⚠️ Set basic store state after initialization failure');
  } catch (commitError) {
    console.error('❌ Even basic store commit failed:', commitError);
  }
  
  throw error;
}
}

// ============================================================================
// 🔥 ENHANCED USER AUTHENTICATION HANDLER
// ============================================================================
async function handleUserAuthenticated(firebaseUser) {
console.log('👤 Processing authenticated user:', firebaseUser.email);

try {
  // Get Firebase ID token with retry
  let token;
  let tokenRetries = 3;
  
  while (tokenRetries > 0) {
    try {
      token = await firebaseUser.getIdToken(true); // Force refresh
      if (token && token.length > 20) {
        console.log('🔑 Firebase token obtained successfully');
        break;
      }
      throw new Error('Invalid token received');
    } catch (tokenError) {
      tokenRetries--;
      console.warn(`⚠️ Token attempt failed, ${tokenRetries} retries left:`, tokenError.message);
      
      if (tokenRetries === 0) {
        console.error('❌ Failed to get token, proceeding with basic auth...');
        // Don't fail the entire auth process, continue with basic user data
        await handleBasicUserAuthentication(firebaseUser);
        return;
      }
      
      // Wait before retry
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
  
  console.log('💾 Saving authenticated user to server...', {
    email: userData.email,
    uid: userData.uid
  });
  
  // ✅ ENHANCED: Try to save user with better error handling
  let saveResult;
  let saveRetries = 2;
  
  while (saveRetries > 0) {
    try {
      console.log(`🔄 Save attempt ${3 - saveRetries + 1}/3...`);
      
      saveResult = await store.dispatch('user/saveUser', { userData, token });
      
      console.log('📊 Save result received:', {
        hasResult: !!saveResult,
        resultType: typeof saveResult,
        success: saveResult?.success,
        hasUser: !!saveResult?.user,
        error: saveResult?.error
      });
      
      // ✅ CRITICAL: Check if we got a valid result
      if (!saveResult) {
        console.error('❌ Save returned undefined result');
        throw new Error('Save action returned undefined result');
      }
      
      if (typeof saveResult !== 'object') {
        console.error('❌ Save returned non-object result:', typeof saveResult);
        throw new Error(`Save action returned ${typeof saveResult} instead of object`);
      }
      
      if (saveResult.success === true && saveResult.user) {
        console.log('✅ User saved successfully on attempt', 3 - saveRetries + 1);
        break;
      } else if (saveResult.success === false) {
        console.warn('⚠️ Server returned failure:', saveResult.error);
        
        // For server failures, try basic auth instead of retrying
        if (saveRetries === 1) {
          console.log('🔄 Server save failed, falling back to basic auth...');
          await handleBasicUserAuthentication(firebaseUser, token);
          return;
        }
        
        throw new Error(saveResult.error || 'Server returned failure');
      } else {
        console.warn('⚠️ Invalid save result structure:', saveResult);
        throw new Error('Invalid server response structure');
      }
      
    } catch (saveError) {
      saveRetries--;
      console.warn(`⚠️ Save attempt failed, ${saveRetries} retries left:`, saveError.message);
      
      if (saveRetries === 0) {
        console.error('❌ All save attempts failed, falling back to basic auth...');
        await handleBasicUserAuthentication(firebaseUser, token);
        return;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // ✅ ENHANCED: Handle successful save
  if (saveResult && saveResult.success && saveResult.user) {
    await handleSuccessfulUserSave(saveResult, token, userData);
  } else {
    console.error('❌ Unexpected save result state:', saveResult);
    await handleBasicUserAuthentication(firebaseUser, token);
  }
  
} catch (error) {
  console.error('❌ User authentication handling failed:', error);
  
  // Last resort: try basic authentication
  try {
    await handleBasicUserAuthentication(firebaseUser);
  } catch (basicError) {
    console.error('❌ Even basic authentication failed:', basicError);
    await handleUserNotAuthenticated();
  }
}
}

// ✅ NEW: Basic user authentication fallback
async function handleBasicUserAuthentication(firebaseUser, token = null) {
console.log('🔧 Using basic user authentication fallback...');

try {
  // ✅ CRITICAL: Try to get actual user status from localStorage first
  const existingStatus = localStorage.getItem('userStatus') || 
                        localStorage.getItem('userPlan') || 
                        localStorage.getItem('subscriptionPlan') || 
                        'free';
  
  console.log('🔍 Existing status found:', existingStatus);
  
  // Create basic user object
  const basicUser = {
    firebaseId: firebaseUser.uid,
    _id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    displayName: firebaseUser.displayName || '',
    // ✅ CRITICAL: Use existing status if available, don't default to 'free'
    subscriptionPlan: existingStatus,
    userStatus: existingStatus,
    plan: existingStatus,
    subscription: existingStatus,
    emailVerified: firebaseUser.emailVerified,
    photoURL: firebaseUser.photoURL,
    lastLoginAt: new Date().toISOString(),
    metadata: {
      lastSync: new Date().toISOString(),
      syncSource: 'basic-auth',
      fallback: true
    }
  };
  
  // Update stores with basic data
  store.commit('setUser', basicUser);
  store.commit('setFirebaseUserId', basicUser.firebaseId);
  if (token) {
    store.commit('setToken', token);
  }
  
  // Update user module store with multiple mutations
  store.commit('user/SET_USER', basicUser);
  store.commit('user/SET_USER_STATUS', existingStatus);
  
  // ✅ CRITICAL: Try legacy mutations too
  try {
    store.commit('user/setUserStatus', existingStatus);
  } catch (e) {
    console.log('Legacy setUserStatus not available');
  }
  
  // Update localStorage with all possible status fields
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
    localStorage.setItem('lastLoginTime', new Date().toISOString());
    localStorage.setItem('authMode', 'basic');
  } catch (storageError) {
    console.warn('⚠️ Failed to update localStorage in basic mode:', storageError);
  }
  
  // Mark auth as ready
  appLifecycle.authReady = true;
  
  console.log('✅ Basic user authentication completed:', {
    email: basicUser.email,
    id: basicUser.firebaseId,
    status: existingStatus,
    mode: 'basic'
  });
  
  // ✅ CRITICAL: Trigger events immediately for status propagation
  const eventData = {
    oldStatus: 'free',
    newStatus: existingStatus,
    source: 'basic-auth',
    user: basicUser,
    timestamp: Date.now()
  };
  
  triggerGlobalEvent('userStatusChanged', eventData);
  triggerGlobalEvent('userSubscriptionChanged', eventData);
  triggerGlobalEvent('userLoggedIn', {
    user: basicUser,
    userStatus: existingStatus,
    source: 'basic',
    mode: 'fallback',
    timestamp: Date.now()
  });
  
  // Also trigger with delay for any stubborn components
  setTimeout(() => {
    triggerGlobalEvent('userStatusChanged', eventData);
    triggerGlobalEvent('globalForceUpdate', {
      reason: 'basic-auth-status-update',
      plan: existingStatus,
      timestamp: Date.now()
    });
  }, 50);
  
} catch (error) {
  console.error('❌ Basic authentication also failed:', error);
  throw error;
}
}

// ✅ ENHANCED: Successful user save handler with subscription persistence
async function handleSuccessfulUserSave(result, token, userData) {
try {
  console.log('✅ User saved to server successfully');
  
  const serverUser = result.user;
  // ✅ CRITICAL FIX: Handle multiple possible status field names
  const userPlan = serverUser.subscriptionPlan || 
                   serverUser.userStatus || 
                   serverUser.plan || 
                   serverUser.subscription || 
                   'free';
  
  console.log('👤 Server user data:', {
    id: serverUser._id || serverUser.firebaseId,
    email: serverUser.email,
    plan: userPlan,
    rawServerUser: serverUser
  });
  
  // ✅ CRITICAL: Enhanced user object with all possible status fields AND subscription tracking
  const enhancedUser = {
    ...serverUser,
    subscriptionPlan: userPlan,
    userStatus: userPlan,
    plan: userPlan,
    subscription: userPlan
  };
  
  // ✅ CRITICAL: Set up subscription persistence if it's a paid plan
  if (userPlan && userPlan !== 'free') {
    await setupSubscriptionPersistence(userPlan, 'server-sync');
  }
  
  // Update stores with server data
  try {
    // Update main store (legacy compatibility)
    store.commit('setUser', enhancedUser);
    store.commit('setFirebaseUserId', enhancedUser.firebaseId || enhancedUser._id);
    store.commit('setToken', token);
    
    // Update user module store with multiple mutations to ensure it sticks
    store.commit('user/SET_USER', enhancedUser);
    store.commit('user/SET_USER_STATUS', userPlan);
    
    // ✅ CRITICAL: Also update any legacy status fields
    if (store.hasModule('user')) {
      try {
        store.commit('user/setUserStatus', userPlan);
      } catch (e) {
        console.log('Legacy setUserStatus mutation not available');
      }
      
      try {
        store.commit('user/UPDATE_SUBSCRIPTION', { plan: userPlan });
      } catch (e) {
        console.log('UPDATE_SUBSCRIPTION mutation not available');
      }
    }
    
    // Update localStorage immediately and forcefully
    const storageData = {
      user: enhancedUser,
      firebaseUserId: enhancedUser.firebaseId || enhancedUser._id,
      userId: enhancedUser.firebaseId || enhancedUser._id,
      token: token,
      userStatus: userPlan,
      userPlan: userPlan,
      subscriptionPlan: userPlan,
      authMode: 'server'
    };
    
    Object.entries(storageData).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
      } catch (storageError) {
        console.warn(`⚠️ Failed to store ${key}:`, storageError);
      }
    });
    
    console.log('✅ User state updated successfully with plan:', userPlan);
    
  } catch (storeUpdateError) {
    console.error('❌ Failed to update stores:', storeUpdateError);
    // Don't fail login for store update errors, but emit warning
    eventBus.emit('storeUpdateWarning', {
      error: storeUpdateError.message,
      timestamp: Date.now()
    });
  }
  
  // Mark auth as ready
  appLifecycle.authReady = true;
  
  // ✅ CRITICAL: Immediate status propagation with multiple event types
  const eventData = {
    oldStatus: 'free',
    newStatus: userPlan,
    source: 'login-complete',
    user: enhancedUser,
    timestamp: Date.now()
  };
  
  // Trigger immediately (no delay)
  triggerGlobalEvent('userStatusChanged', eventData);
  triggerGlobalEvent('userSubscriptionChanged', eventData);
  triggerGlobalEvent('subscriptionUpdated', eventData);
  triggerGlobalEvent('userLoggedIn', {
    user: enhancedUser,
    userStatus: userPlan,
    source: 'server',
    timestamp: Date.now()
  });
  
  // Also trigger with small delay for any stubborn components
  setTimeout(() => {
    triggerGlobalEvent('userStatusChanged', eventData);
    triggerGlobalEvent('globalForceUpdate', {
      reason: 'user-login-status-update',
      plan: userPlan,
      timestamp: Date.now()
    });
  }, 50);
  
  // Store last login time
  localStorage.setItem('lastLoginTime', new Date().toISOString());
  
  console.log(`🎉 User login completed: ${userData.email} (${userPlan})`);
  
} catch (error) {
  console.error('❌ Error in successful save handler:', error);
  
  // Fallback to basic auth even after successful save
  try {
    await handleBasicUserAuthentication({ 
      uid: result.user?.firebaseId || result.user?._id,
      email: result.user?.email || userData.email,
      displayName: result.user?.name || userData.name,
      emailVerified: result.user?.emailVerified || userData.emailVerified,
      photoURL: result.user?.photoURL || userData.photoURL
    }, token);
  } catch (fallbackError) {
    console.error('❌ Fallback authentication failed:', fallbackError);
  }
}
}

// ✅ ENHANCED: User not authenticated handler
async function handleUserNotAuthenticated() {
console.log('👋 Processing non-authenticated state...');

try {
  // Clear user data through store actions
  await store.dispatch('user/logout');
  
  // Also clear legacy main store
  store.commit('logout');
  
  // Clear localStorage
  const keysToRemove = [
    'user', 'firebaseUserId', 'userId', 'token', 
    'userStatus', 'lastLoginTime', 'subscriptionDetails'
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`⚠️ Failed to remove ${key}:`, error);
    }
  });
  
  // Set default state
  store.commit('user/SET_USER_STATUS', 'free');
  
  // Mark auth as ready (even for non-authenticated users)
  appLifecycle.authReady = true;
  
  console.log('✅ Non-authenticated state processed successfully');
  
  // Trigger events
  setTimeout(() => {
    triggerGlobalEvent('userStatusChanged', {
      oldStatus: null,
      newStatus: 'free',
      source: 'not-authenticated',
      timestamp: Date.now()
    });
  }, 100);
  
} catch (error) {
  console.error('❌ Error handling non-authenticated state:', error);
  
  // Force basic state
  try {
    store.commit('user/CLEAR_USER');
    localStorage.clear();
  } catch (clearError) {
    console.error('❌ Even force clear failed:', clearError);
  }
  
  appLifecycle.authReady = true; // Always mark as ready to prevent hanging
}
}

// ============================================================================
// 🔥 ENHANCED VUE APPLICATION MOUNTING
// ============================================================================
async function mountVueApplication() {
console.log('🎯 Mounting Vue application with full features...');

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
    console.error('❌ Vue error:', error);
    console.error('📍 Component:', instance?.$options?.name || 'Unknown');
    console.error('ℹ️ Info:', info);
    
    // Handle specific length errors
    if (error.message?.includes("Cannot read properties of undefined (reading 'length')")) {
      console.error('🔍 Length property error detected - likely array reactivity issue');
      
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
        console.error('❌ Recovery attempt failed:', recoveryError);
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
  
  console.log('✅ Vue application mounted successfully');
  
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
  console.error('❌ Failed to mount Vue app:', error);
  
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
console.log('🎯 Mounting Vue application in basic mode...');

try {
  app = createApp(App);
  
  // Basic plugins only
  app.use(store);
  app.use(router);
  app.use(i18n);
  
  // Basic error handler
  app.config.errorHandler = (error, instance, info) => {
    console.error('❌ Vue error (basic mode):', error);
  };
  
  // Mount the application
  app.mount('#app');
  isApplicationMounted = true;
  appLifecycle.mounted = true;
  
  console.log('✅ Vue application mounted in basic mode');
  
  return true;
  
} catch (error) {
  console.error('❌ Failed to mount Vue app even in basic mode:', error);
  throw error;
}
}

// ============================================================================
// 🔥 ENHANCED GLOBAL EVENT TRIGGERING SYSTEM
// ============================================================================

window.triggerGlobalEvent = (eventName, data = {}) => {
if (typeof window === 'undefined') return;

try {
  console.log(`🌍 Triggering global event: ${eventName}`, data);
  
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
  
  console.log(`🔍 Status resolution for ${eventName}:`, {
    originalNewStatus: newStatus,
    originalPlan: plan,
    possibleStatuses,
    actualNewStatus,
    dataReceived: data
  });
  
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

  console.log(`🔍 Enhanced event data for ${eventName}:`, enhancedData);

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
      console.warn('⚠️ Storage event failed:', storageError);
    }
  }

  console.log(`✅ Global event dispatched: ${eventName} with status: ${actualNewStatus}`);

} catch (eventError) {
  console.error(`❌ Failed to trigger global event '${eventName}':`, eventError);
}
};

// ============================================================================
// 🔥 STORE MUTATION INTERCEPTOR FOR AUTOMATIC EVENT TRIGGERING
// ============================================================================
const setupStoreInterceptor = (store) => {
store.subscribe((mutation, state) => {
  console.log('🔄 Store mutation:', mutation.type, mutation.payload);
  
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
    console.log('📡 User-related mutation detected, triggering global events');
    
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

// ============================================================================
// 🚀 ENHANCED EVENT BUS
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
    console.log(`📡 EventBus: Emitting "${event}"`, data);
  }
  
  if (this.events[event]) {
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ EventBus error in "${event}" handler:`, error);
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
  
  if (this.debugMode) {
    console.log(`🔗 EventBus: Registered listener for "${event}"`);
  }
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
      console.error('❌ Status change listener error:', error);
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
      console.error('❌ Subscription listener error:', error);
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
      console.error('❌ Error handler failed:', handlerError);
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
console.log('🌐 Setting up enhanced global subscription management...');

const handleGlobalSubscriptionChange = (event) => {
  console.log('📡 Global subscription change detected:', event.detail);
  
  // ✅ CRITICAL FIX: Extract plan from event detail with multiple fallbacks AND message parsing
  const { plan, newStatus, userStatus, subscriptionPlan, message } = event.detail || {};
  let actualPlan = plan || newStatus || userStatus || subscriptionPlan;
  const { source, oldPlan, timestamp } = event.detail || {};
  
  // ✅ CRITICAL: If plan is empty/undefined but we have a success message, parse it
  if ((!actualPlan || actualPlan === '' || actualPlan === 'undefined') && message) {
    console.log('🔍 Plan is empty, parsing from message:', message);
    
    // Parse plan from success messages
    if (message.includes('START') || message.includes('start')) {
      actualPlan = 'start';
      console.log('✅ Extracted plan from message: start');
    } else if (message.includes('PRO') || message.includes('pro')) {
      actualPlan = 'pro';
      console.log('✅ Extracted plan from message: pro');
    } else if (message.includes('FREE') || message.includes('free')) {
      actualPlan = 'free';
      console.log('✅ Extracted plan from message: free');
    }
  }
  
  // ✅ CRITICAL: Check if this is a promocode success and localStorage was updated
  if (source === 'promocode' && (!actualPlan || actualPlan === '')) {
    const localStatus = localStorage.getItem('userStatus');
    const localPlan = localStorage.getItem('userPlan');
    const localSubscription = localStorage.getItem('subscriptionPlan');
    
    console.log('🔍 Promocode detected with empty plan, checking localStorage:', {
      userStatus: localStatus,
      userPlan: localPlan,
      subscriptionPlan: localSubscription
    });
    
    // Use localStorage value if it's valid and not 'free'
    const possiblePlans = [localStatus, localPlan, localSubscription];
    for (const possiblePlan of possiblePlans) {
      if (possiblePlan && possiblePlan !== 'free' && ['start', 'pro'].includes(possiblePlan)) {
        actualPlan = possiblePlan;
        console.log('✅ Using localStorage plan:', actualPlan);
        break;
      }
    }
  }
  
  // Final fallback
  if (!actualPlan || actualPlan === '' || actualPlan === 'undefined') {
    actualPlan = 'free';
  }
  
  console.log('🔍 Extracted plan values:', {
    plan,
    newStatus,
    userStatus,
    subscriptionPlan,
    message,
    actualPlan,
    eventDetail: event.detail
  });
  
  // ✅ CRITICAL: Validate the plan before proceeding
  if (!['free', 'start', 'pro', 'premium'].includes(actualPlan)) {
    console.warn('⚠️ Invalid plan detected, defaulting to free:', actualPlan);
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
  
  console.log('💾 localStorage updated with plan:', actualPlan);
  
  // Update store if not already updated
  try {
    const currentStoreStatus = store.getters['user/userStatus'];
    console.log('🔍 Store status comparison:', { current: currentStoreStatus, new: actualPlan });
    
    if (currentStoreStatus !== actualPlan) {
      console.log('🔄 Syncing store with global change:', currentStoreStatus, '→', actualPlan);
      store.commit('user/SET_USER_STATUS', actualPlan);
      
      // Also try legacy mutations
      try {
        store.commit('user/setUserStatus', actualPlan);
      } catch (e) {
        console.log('Legacy setUserStatus not available');
      }
      
      // Direct state update as backup
      if (store.state.user) {
        store.state.user.userStatus = actualPlan;
        store.state.user.subscriptionPlan = actualPlan;
        store.state.user.plan = actualPlan;
      }
    }
  } catch (storeError) {
    console.warn('⚠️ Failed to sync store:', storeError);
  }
  
  // Force Vue app update
  if (app?._instance) {
    try {
      app._instance.proxy.$forceUpdate();
      console.log('🔄 Forced Vue app update');
    } catch (error) {
      console.warn('⚠️ Failed to force Vue update:', error);
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
  
  console.log('📡 Emitting events with data:', eventData);
  
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
    console.log(`🎉 Subscription upgraded to ${planLabel} via ${sourceText}!`);
    
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
  console.log('👤 User status changed via event bus:', data);
  
  // ✅ CRITICAL FIX: Extract the actual status value with multiple fallbacks
  const { newStatus, plan, userStatus, subscriptionPlan } = data || {};
  const actualStatus = newStatus || plan || userStatus || subscriptionPlan || 'free';
  
  console.log('🔍 Extracted status values:', {
    newStatus,
    plan,
    userStatus,
    subscriptionPlan,
    actualStatus,
    originalData: data
  });
  
  // ✅ CRITICAL: Validate the status
  if (!['free', 'start', 'pro', 'premium'].includes(actualStatus)) {
    console.warn('⚠️ Invalid status in event bus, defaulting to free:', actualStatus);
    actualStatus = 'free';
  }
  
  // Sync with localStorage using all field variations
  try {
    localStorage.setItem('userStatus', actualStatus);
    localStorage.setItem('userPlan', actualStatus);
    localStorage.setItem('subscriptionPlan', actualStatus);
    localStorage.setItem('statusUpdateTime', Date.now().toString());
    console.log('💾 localStorage synced with status:', actualStatus);
  } catch (storageError) {
    console.warn('⚠️ localStorage sync failed:', storageError);
  }
  
  // ✅ CRITICAL: Also update the store to ensure consistency
  try {
    const currentStoreStatus = store.getters['user/userStatus'];
    if (currentStoreStatus !== actualStatus) {
      console.log('🔄 Updating store via event bus:', currentStoreStatus, '→', actualStatus);
      store.commit('user/SET_USER_STATUS', actualStatus);
      
      // Try legacy mutations too
      try {
        store.commit('user/setUserStatus', actualStatus);
      } catch (e) {
        console.log('Legacy setUserStatus not available in event bus handler');
      }
    }
  } catch (storeError) {
    console.warn('⚠️ Store update failed in event bus:', storeError);
  }
  
  // Force app update with error handling
  if (app?._instance) {
    try {
      app._instance.proxy.$forceUpdate();
      
      // Also trigger $nextTick for delayed components
      app._instance.proxy.$nextTick(() => {
        console.log('🔄 NextTick update completed with status:', actualStatus);
      });
    } catch (error) {
      console.warn('⚠️ Failed to force update on status change:', error);
    }
  }
});

eventBus.on('promocodeApplied', (data) => {
  console.log('🎟️ Promocode applied:', data);
  
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
  console.log('💳 Payment completed:', data);
  
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
    console.log('📡 Cross-tab userStatus change detected:', event.oldValue, '→', event.newValue);
    
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
      console.log('🔄 Periodic check: Status mismatch detected, syncing...', {
        store: storeStatus,
        localStorage: localStatus
      });
      
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
    console.warn('⚠️ Periodic status check failed:', error);
  }
}, 30000); // Check every 30 seconds

console.log('✅ Enhanced global subscription management setup complete');
}

// ============================================================================
// 🌟 ENHANCED GLOBAL ERROR HANDLING
// ============================================================================

// Enhanced global JavaScript error handler
window.addEventListener('error', (event) => {
console.error('❌ Global JavaScript error:', event.error);

// Check if error is related to user status/arrays
if (event.error?.message?.includes('length') || 
    event.error?.message?.includes('Cannot read properties of undefined')) {
  console.log('🔄 Attempting user status recovery after global error...');
  
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
    console.error('❌ Error recovery failed:', recoveryError);
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
console.error('❌ Unhandled promise rejection:', event.reason);

// Check if rejection is related to user status operations
if (event.reason?.message?.includes('userStatus') || 
    event.reason?.message?.includes('subscription')) {
  console.log('🔄 Attempting user status recovery after promise rejection...');
  
  try {
    window.triggerGlobalEvent('globalForceUpdate', {
      reason: 'promise-rejection-recovery',
      originalError: event.reason?.message,
      timestamp: Date.now()
    });
  } catch (recoveryError) {
    console.error('❌ Promise rejection recovery failed:', recoveryError);
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
  console.log('🔧 Helper: emitUserStatusChange called', { oldStatus, newStatus, source });
  
  // Validate status values
  const validStatuses = ['free', 'start', 'pro', 'premium'];
  if (!validStatuses.includes(newStatus)) {
    console.error('❌ Invalid newStatus:', newStatus);
    return;
  }
  
  // ✅ CRITICAL: Update store immediately
  try {
    store.commit('user/SET_USER_STATUS', newStatus);
    console.log('✅ Store updated with new status:', newStatus);
  } catch (storeError) {
    console.error('❌ Failed to update store:', storeError);
  }
  
  // Update localStorage immediately with all variations
  try {
    localStorage.setItem('userStatus', newStatus);
    localStorage.setItem('userPlan', newStatus);
    localStorage.setItem('subscriptionPlan', newStatus);
    localStorage.setItem('statusUpdateTime', Date.now().toString());
  } catch (storageError) {
    console.warn('⚠️ localStorage update failed:', storageError);
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
      console.log('🔄 Forced Vue update after manual status change');
    } catch (error) {
      console.warn('⚠️ Failed to force Vue update:', error);
    }
  }
  
  console.log('✅ Status change completed:', oldStatus, '→', newStatus);
};

// Enhanced Force update helper
window.emitForceUpdate = (reason = 'manual') => {
  console.log('🔧 Helper: emitForceUpdate called', { reason });
  
  // Trigger through global event system
  window.triggerGlobalEvent('globalForceUpdate', { 
    reason,
    timestamp: Date.now() 
  });
  
  // Also force store update
  try {
    store.commit('user/FORCE_UPDATE');
  } catch (error) {
    console.warn('⚠️ Store force update failed:', error);
  }
};

// Enhanced User change listener helper with cleanup
window.listenToUserChanges = (callback) => {
  console.log('🔧 Helper: listenToUserChanges called');
  
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
    console.log('🧹 Helper: User change listeners cleaned up');
  };
};

// Direct store status getter helper
window.getCurrentUserStatus = () => {
  try {
    const storeStatus = store.getters['user/userStatus'];
    const localStatus = localStorage.getItem('userStatus');
    
    console.log('🔍 getCurrentUserStatus debug:', {
      storeStatus,
      storeStatusType: typeof storeStatus,
      localStatus,
      localStatusType: typeof localStatus,
      storeState: store.state.user,
      availableGetters: Object.keys(store.getters).filter(g => g.includes('user'))
    });
    
    // Return local storage if store is undefined/null
    return storeStatus || localStatus || 'free';
  } catch (error) {
    console.warn('⚠️ Failed to get user status from store:', error);
    return localStorage.getItem('userStatus') || 'free';
  }
};

// ✅ NEW: Store status repair function
window.repairStoreStatus = () => {
  console.log('🔧 Attempting to repair store status...');
  
  const localStatus = localStorage.getItem('userStatus') || 
                     localStorage.getItem('userPlan') || 
                     localStorage.getItem('subscriptionPlan') || 
                     'free';
  console.log('📦 Local status to restore:', localStatus);
  
  try {
    // ✅ CRITICAL: Check if store.state.user exists at all
    console.log('🔍 Store state inspection:', {
      hasUserState: !!store.state.user,
      userState: store.state.user,
      availableModules: Object.keys(store.state),
      availableGetters: Object.keys(store.getters).filter(g => g.includes('user'))
    });
    
    // ✅ CRITICAL: Initialize user state if it doesn't exist
    if (!store.state.user) {
      console.log('🏗️ Creating missing user state...');
      
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
        console.log('✅ User module registered successfully');
      } catch (moduleError) {
        console.warn('⚠️ Module registration failed:', moduleError);
        
        // Manual state creation as last resort
        store.state.user = {
          user: null,
          userStatus: localStatus,
          subscriptionPlan: localStatus,
          isAuthenticated: false,
          isInitialized: true
        };
        console.log('✅ Manual user state created');
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
        console.log(`✅ Successfully used mutation: ${mutation}`);
      } catch (e) {
        console.log(`⚠️ Mutation ${mutation} not available:`, e.message);
      }
    });
    
    // ✅ CRITICAL: Direct state update regardless of mutations
    if (store.state.user) {
      store.state.user.userStatus = localStatus;
      store.state.user.subscriptionPlan = localStatus;
      store.state.user.plan = localStatus;
      console.log('✅ Direct state update completed');
    }
    
    // Check the result
    const newStoreStatus = store.getters['user/userStatus'];
    console.log('🔍 Store status after repair:', {
      getter: newStoreStatus,
      directState: store.state.user?.userStatus,
      localStatus: localStatus
    });
    
    // ✅ CRITICAL: If getter still fails, create a working getter
    if (!newStoreStatus || newStoreStatus === 'undefined') {
      console.log('🔧 Getter is broken, creating backup...');
      
      // Create backup getter function
      window.getWorkingUserStatus = () => {
        return store.state.user?.userStatus || 
               localStorage.getItem('userStatus') || 
               'free';
      };
      
      console.log('✅ Backup getter created: window.getWorkingUserStatus()');
    }
    
    return newStoreStatus || localStatus;
    
  } catch (error) {
    console.error('❌ Store repair failed:', error);
    return localStatus;
  }
};

// Status sync helper for components
window.syncUserStatus = () => {
  try {
    const storeStatus = store.getters['user/userStatus'];
    const localStatus = localStorage.getItem('userStatus');
    
    console.log('🔄 Helper: syncUserStatus', { store: storeStatus, local: localStatus });
    
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
    console.error('❌ Helper: syncUserStatus failed:', error);
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
  console.log('🚨 Emergency user status sync triggered');
} catch (error) {
  console.error('❌ Emergency sync failed:', error);
}
};

// ✅ Enhanced Error recovery with user status sync
async function recoverUserStatus() {
console.log('🔧 Attempting user status recovery...');

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
      
      console.log('✅ User status recovered from cache:', {
        email: parsedUser.email,
        status: localStatus
      });
      
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
      console.warn('⚠️ Failed to parse cached user:', parseError);
    }
  }
  
  // If no cached data, set default state
  store.commit('user/SET_USER_STATUS', 'free');
  store.commit('user/CLEAR_USER');
  
  console.log('⚠️ No recoverable user data, set to default state');
  
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
  console.error('❌ User status recovery failed:', error);
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
    
    console.log('📊 Status comparison:', { 
      store: storeStatus, 
      storeType: typeof storeStatus,
      localStorage: localStatus,
      localType: typeof localStatus,
      workingGetter: workingStatus,
      storeState: store.state.user?.userStatus,
      storeExists: !!store.state.user,
      storeRaw: store.state.user
    });
    
    // ✅ NEW: Check if store status is literally the string 'undefined'
    if (storeStatus === 'undefined' || storeStatus === undefined || storeStatus === null) {
      console.warn('⚠️ Store status is invalid, attempting repair...');
      window.repairStoreStatus();
    }
    
    return { 
      store: storeStatus, 
      localStorage: localStatus,
      working: workingStatus,
      effective: workingStatus !== 'unavailable' ? workingStatus : (localStatus || 'free')
    };
  },
  
  forceStatusUpdate: (status) => {
    if (!['free', 'start', 'pro'].includes(status)) {
      console.error('❌ Invalid status. Use: free, start, pro');
      return;
    }
    
    console.log('🔧 Forcing status update to:', status);
    
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
        console.log(`✅ ${mutation}: ${newValue}`);
      } catch (e) {
        console.log(`⚠️ ${mutation} not available`);
      }
    });
    
    // ✅ CRITICAL: Direct state update if getters still fail
    if (store.state.user) {
      store.state.user.userStatus = status;
      store.state.user.subscriptionPlan = status;
      store.state.user.plan = status;
      console.log('✅ Direct state update completed');
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
          console.log('✅ User object updated with new status');
        } catch (e) {
          console.warn('⚠️ Failed to update user object:', e);
        }
      }
    }
    
    // Update localStorage with all variations
    localStorage.setItem('userStatus', status);
    localStorage.setItem('userPlan', status);
    localStorage.setItem('subscriptionPlan', status);
    localStorage.setItem('statusUpdateTime', Date.now().toString());
    console.log('✅ localStorage updated with all status variations');
    
    // ✅ CRITICAL: Force store reactivity
    try {
      store.commit('user/FORCE_UPDATE');
      console.log('✅ Store reactivity forced');
    } catch (e) {
      console.log('⚠️ FORCE_UPDATE not available');
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
        console.log('✅ Vue app force updated');
      } catch (error) {
        console.warn('⚠️ Vue force update failed:', error);
      }
    }
    
    console.log('✅ Status forced to:', status);
    
    // Verify the change worked
    setTimeout(() => {
      const verification = window.testUserStatus.getCurrentStatus();
      console.log('🔍 Status change verification:', verification);
      
      // Additional verification
      const finalStoreStatus = store.getters['user/userStatus'];
      const finalLocalStatus = localStorage.getItem('userStatus');
      console.log('🔍 Final verification:', {
        store: finalStoreStatus,
        localStorage: finalLocalStatus,
        storeState: store.state.user?.userStatus
      });
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
      console.log('🔧 Debug: Forced auth completion');
    }
  },
  
  testAuthFlow: async () => {
    console.log('🔧 Debug: Testing auth flow...');
    try {
      await authInitPromise;
      console.log('✅ Debug: Auth promise resolved successfully');
    } catch (error) {
      console.error('❌ Debug: Auth promise failed:', error);
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
      
      console.log('🧪 Testing saveUser action...');
      const result = await store.dispatch('user/saveUser', { 
        userData: testUser, 
        token: testToken 
      });
      
      console.log('🧪 Test result:', result);
      return result;
      
    } catch (error) {
      console.error('🧪 Test failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  forceBasicAuth: () => {
    console.log('🔧 Forcing basic authentication mode...');
    
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
    console.log('🧹 Clearing all authentication state...');
    
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
      
      console.log('✅ Authentication state cleared');
      
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
      console.error('❌ Failed to clear auth state:', error);
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

console.log(`
🐛 ENHANCED DEVELOPMENT DEBUG COMMANDS AVAILABLE:

🔐 AUTHENTICATION DEBUGGING:
- debugAuth.getAuthState(): Check current auth state
- debugAuth.forceAuthComplete(): Force auth completion (emergency)
- debugAuth.testAuthFlow(): Test auth promise resolution
- debugAuth.testSaveUser(): Test the saveUser action
- debugAuth.forceBasicAuth(): Force basic authentication mode
- debugAuth.clearAuthState(): Clear all auth data
- debugAuth.recoverUserStatus(): Recover from cache
- $authInitPromise: Auth initialization promise

📊 USER STATUS DEBUGGING:
- $userStatus(): Get current user status
- window.getCurrentUserStatus(): Safe status getter
- window.syncUserStatus(): Sync status between store and localStorage
- window.forceUserStatusSync(): Emergency status sync

🔧 GLOBAL HELPERS:
- window.triggerGlobalEvent(eventName, data): Trigger global events
- window.emitUserStatusChange(old, new, source): Emit status change
- window.emitForceUpdate(reason): Force global update
- window.listenToUserChanges(callback): Listen to user changes

⚠️ EMERGENCY FUNCTIONS:
- window.forceUserStatusSync(): Emergency status sync
- debugAuth.forceAuthComplete(): Force auth completion
`);
}



console.log('✅ UNIFIED main.js with perfect authentication + user status updates loaded successfully!');
console.log('🔧 Authentication will complete BEFORE router navigation begins');
console.log('🌟 User status changes (free ↔ start ↔ pro) will propagate globally');
console.log('🚨 Use debugAuth.* and testUserStatus.* functions for debugging');
console.log('🧪 Quick test: testUserStatus.setPro() then testUserStatus.setFree()');

// ============================================================================
// 🚀 ADDITIONAL STATUS CHANGE HOOKS FOR EXTERNAL INTEGRATIONS
// ============================================================================

// Global hook for external scripts to trigger status changes
window.updateUserSubscription = (newPlan, source = 'external') => {
console.log('🔗 External subscription update requested:', { newPlan, source });

if (!['free', 'start', 'pro'].includes(newPlan)) {
  console.error('❌ Invalid plan. Must be: free, start, pro');
  return false;
}

const oldStatus = window.getCurrentUserStatus();
window.emitUserStatusChange(oldStatus, newPlan, source);

return true;
};

// Hook for promocode applications
window.applyPromocode = (promocode, newPlan) => {
console.log('🎟️ Promocode application requested:', { promocode, newPlan });

// ✅ CRITICAL: Validate the plan properly
if (!newPlan || !['free', 'start', 'pro'].includes(newPlan)) {
  console.error('❌ Invalid or missing plan for promocode:', newPlan);
  return false;
}

const oldStatus = window.getCurrentUserStatus();
console.log('🔍 Promocode status change:', oldStatus, '→', newPlan);

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

console.log('🎟️ Emitting promocode events with data:', eventData);

eventBus.emit('promocodeApplied', eventData);

// Also trigger global events
window.triggerGlobalEvent('userSubscriptionChanged', eventData);
window.triggerGlobalEvent('subscriptionUpdated', eventData);

return true;
};

// ✅ CRITICAL: Add comprehensive subscription persistence system
async function setupSubscriptionPersistence(plan, source = 'manual') {
if (!plan || plan === 'free') {
  console.log('🔧 No subscription persistence needed for free plan');
  return;
}

console.log('💾 Setting up subscription persistence for plan:', plan, 'source:', source);

const now = new Date();
const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

// Check if we already have a valid subscription
const existingSubscription = getStoredSubscription();

let subscriptionData;

if (existingSubscription && existingSubscription.plan === plan && existingSubscription.expiryDate) {
  // Keep existing expiry date if same plan
  subscriptionData = {
    ...existingSubscription,
    lastUpdated: now.toISOString(),
    source: source
  };
  console.log('💾 Keeping existing subscription expiry:', existingSubscription.expiryDate);
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
  console.log('💾 Creating new subscription expiry:', expiryDate.toISOString());
}

// Store in localStorage with multiple keys for reliability
try {
  localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
  localStorage.setItem('subscriptionPlan', plan);
  localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
  localStorage.setItem('subscriptionActivated', subscriptionData.activatedAt);
  localStorage.setItem('userStatus', plan);
  localStorage.setItem('userPlan', plan);
  
  console.log('✅ Subscription persistence data stored:', subscriptionData);
} catch (error) {
  console.error('❌ Failed to store subscription data:', error);
}

// Setup expiry check
setupSubscriptionExpiryCheck();

return subscriptionData;
}

// ✅ CRITICAL: Get stored subscription data
function getStoredSubscription() {
try {
  const subscriptionJson = localStorage.getItem('subscriptionData');
  if (subscriptionJson) {
    const subscription = JSON.parse(subscriptionJson);
    console.log('📥 Retrieved stored subscription:', subscription);
    return subscription;
  }
  
  // Fallback: try to reconstruct from individual keys
  const plan = localStorage.getItem('subscriptionPlan') || localStorage.getItem('userStatus');
  const expiry = localStorage.getItem('subscriptionExpiry');
  const activated = localStorage.getItem('subscriptionActivated');
  
  if (plan && plan !== 'free') {
    const fallbackSubscription = {
      plan: plan,
      expiryDate: expiry,
      activatedAt: activated,
      status: 'active',
      source: 'fallback-reconstruction'
    };
    console.log('📥 Reconstructed subscription from fallback:', fallbackSubscription);
    return fallbackSubscription;
  }
  
} catch (error) {
  console.error('❌ Failed to retrieve subscription data:', error);
}

return null;
}

// ✅ CRITICAL: Check if subscription is still valid
function isSubscriptionValid() {
const subscription = getStoredSubscription();

if (!subscription || !subscription.expiryDate) {
  console.log('🔍 No subscription or expiry date found');
  return false;
}

const now = new Date();
const expiryDate = new Date(subscription.expiryDate);
const isValid = now < expiryDate;

console.log('🔍 Subscription validity check:', {
  plan: subscription.plan,
  expiryDate: subscription.expiryDate,
  now: now.toISOString(),
  isValid: isValid,
  daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
});

return isValid;
}

// ✅ CRITICAL: Setup automatic expiry checking
function setupSubscriptionExpiryCheck() {
// Clear any existing interval
if (window.subscriptionCheckInterval) {
  clearInterval(window.subscriptionCheckInterval);
}

// Check subscription validity every 5 minutes
window.subscriptionCheckInterval = setInterval(() => {
  console.log('⏰ Running subscription validity check...');
  
  const subscription = getStoredSubscription();
  if (!subscription || subscription.plan === 'free') {
    return; // No need to check free subscriptions
  }
  
  if (!isSubscriptionValid()) {
    console.log('❌ Subscription expired, reverting to free');
    handleSubscriptionExpiry(subscription);
  } else {
    console.log('✅ Subscription still valid');
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Also check immediately
setTimeout(() => {
  const subscription = getStoredSubscription();
  if (subscription && subscription.plan !== 'free' && !isSubscriptionValid()) {
    console.log('❌ Subscription expired on startup, reverting to free');
    handleSubscriptionExpiry(subscription);
  }
}, 5000); // Check 5 seconds after setup

console.log('✅ Subscription expiry check setup completed');
}

// ✅ CRITICAL: Handle subscription expiry
function handleSubscriptionExpiry(expiredSubscription) {
console.log('⏰ Handling subscription expiry for:', expiredSubscription);

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
  console.warn('⚠️ Failed to update store on expiry:', error);
}

// Trigger events
triggerGlobalEvent('userStatusChanged', {
  oldStatus: expiredSubscription.plan,
  newStatus: 'free',
  source: 'subscription-expired',
  timestamp: Date.now()
});

triggerGlobalEvent('subscriptionExpired', {
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

console.log('✅ Subscription expiry handled');
}

// ✅ CRITICAL: Add smart promocode detection based on your logs
window.smartPromocodeDetection = () => {
console.log('🎯 Running smart promocode detection...');

// Check if there was a recent promocode success message
const recentLogs = console.log.toString();

// Check localStorage for any signs of promocode success
const checkLocalStorage = () => {
  const keys = ['userStatus', 'userPlan', 'subscriptionPlan'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && ['start', 'pro'].includes(value)) {
      console.log('🔍 Found non-free plan in localStorage:', key, '=', value);
      return value;
    }
  }
  return null;
};

const detectedPlan = checkLocalStorage();

if (detectedPlan && detectedPlan !== 'free') {
  console.log('🎯 Smart detection found plan:', detectedPlan);
  
  // Check if store is synced
  const storeStatus = store.getters['user/userStatus'];
  if (!storeStatus || storeStatus === 'undefined' || storeStatus !== detectedPlan) {
    console.log('🔧 Store is out of sync, fixing...');
    window.fixPromocodeStatus(detectedPlan);
    return detectedPlan;
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
console.log('💳 Payment completion reported:', { transactionId, plan, amount });

if (!['start', 'pro'].includes(plan)) {
  console.error('❌ Invalid paid plan');
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
console.log('💾 Initializing subscription persistence system...');
  
// Setup subscription expiry checking
setupSubscriptionExpiryCheck();

// Check if user has a valid subscription on startup
const existingSubscription = getStoredSubscription();
if (existingSubscription && existingSubscription.plan !== 'free') {
  if (isSubscriptionValid()) {
    console.log('✅ Valid subscription found on startup:', existingSubscription.plan);
    // Ensure store and localStorage are synced with valid subscription
    localStorage.setItem('userStatus', existingSubscription.plan);
    localStorage.setItem('userPlan', existingSubscription.plan);
    localStorage.setItem('subscriptionPlan', existingSubscription.plan);
  } else {
    console.log('❌ Expired subscription found on startup, cleaning up');
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
    
    console.log('📊 Status comparison:', { 
      store: storeStatus, 
      storeType: typeof storeStatus,
      localStorage: localStatus,
      localType: typeof localStatus,
      workingGetter: workingStatus,
      subscription: subscription,
      subscriptionValid: subscription ? isSubscriptionValid() : 'N/A',
      storeState: store.state.user?.userStatus,
      storeExists: !!store.state.user
    });
    
    // ✅ NEW: Check if store status is literally the string 'undefined'
    if (storeStatus === 'undefined' || storeStatus === undefined || storeStatus === null) {
      console.warn('⚠️ Store status is invalid, attempting repair...');
      window.repairStoreStatus();
    }
    
    return { 
      store: storeStatus, 
      localStorage: localStatus,
      working: workingStatus,
      subscription: subscription,
      subscriptionValid: subscription ? isSubscriptionValid() : false,
      effective: workingStatus !== 'unavailable' ? workingStatus : (localStatus || 'free')
    };
  },

  forceStatusUpdate: (status) => {
    if (!['free', 'start', 'pro'].includes(status)) {
      console.error('❌ Invalid status. Use: free, start, pro');
      return;
    }
    
    console.log('🔧 Forcing status update to:', status);
    
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
        console.log(`✅ ${mutation}: ${newValue}`);
      } catch (e) {
        console.log(`⚠️ ${mutation} not available`);
      }
    });
    
    // ✅ CRITICAL: Direct state update if getters still fail
    if (store.state.user) {
      store.state.user.userStatus = status;
      store.state.user.subscriptionPlan = status;
      store.state.user.plan = status;
      console.log('✅ Direct state update completed');
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
          console.log('✅ User object updated with new status');
        } catch (e) {
          console.warn('⚠️ Failed to update user object:', e);
        }
      }
    }
    
    // Update localStorage with all variations
    localStorage.setItem('userStatus', status);
    localStorage.setItem('userPlan', status);
    localStorage.setItem('subscriptionPlan', status);
    localStorage.setItem('statusUpdateTime', Date.now().toString());
    console.log('✅ localStorage updated with all status variations');
    
    // ✅ CRITICAL: Force store reactivity
    try {
      store.commit('user/FORCE_UPDATE');
      console.log('✅ Store reactivity forced');
    } catch (e) {
      console.log('⚠️ FORCE_UPDATE not available');
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
        console.log('✅ Vue app force updated');
      } catch (error) {
        console.warn('⚠️ Vue force update failed:', error);
      }
    }
    
    console.log('✅ Status forced to:', status);
    
    // Verify the change worked
    setTimeout(() => {
      const verification = window.testUserStatus.getCurrentStatus();
      console.log('🔍 Status change verification:', verification);
      
      // Additional verification
      const finalStoreStatus = store.getters['user/userStatus'];
      const finalLocalStatus = localStorage.getItem('userStatus');
      const finalSubscription = getStoredSubscription();
      console.log('🔍 Final verification:', {
        store: finalStoreStatus,
        localStorage: finalLocalStatus,
        subscription: finalSubscription,
        subscriptionValid: finalSubscription ? isSubscriptionValid() : false,
        storeState: store.state.user?.userStatus
      });
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
      console.error('❌ No active subscription to extend');
      return false;
    }
    
    const currentExpiry = new Date(subscription.expiryDate);
    const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
    
    subscription.expiryDate = newExpiry.toISOString();
    subscription.lastUpdated = new Date().toISOString();
    
    localStorage.setItem('subscriptionData', JSON.stringify(subscription));
    localStorage.setItem('subscriptionExpiry', subscription.expiryDate);
    
    console.log('✅ Subscription extended by', days, 'days. New expiry:', newExpiry.toISOString());
    return true;
  },
  
  clearSubscription: () => {
    localStorage.removeItem('subscriptionData');
    localStorage.removeItem('subscriptionExpiry');
    localStorage.removeItem('subscriptionActivated');
    localStorage.setItem('userStatus', 'free');
    localStorage.setItem('userPlan', 'free');
    localStorage.setItem('subscriptionPlan', 'free');
    
    console.log('🧹 All subscription data cleared');
  }
};// src/main.js - UNIFIED FIX: PERFECT AUTHENTICATION + USER STATUS UPDATES
