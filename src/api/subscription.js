// src/api/subscription.js - Subscription Management API (FIXED - Server-First)
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 🔧 HELPER FUNCTIONS WITH CIRCUIT BREAKER
// =============================================

// Circuit breaker state to prevent infinite token refresh loops
let tokenCache = {
  token: null,
  expiry: 0,
  quotaErrorUntil: 0  // Timestamp until which we won't retry after quota error
};

const QUOTA_COOLDOWN_MS = 30000;  // 30 second cooldown after quota error
const TOKEN_CACHE_TTL_MS = 300000; // 5 minute token cache

const getAuthToken = async () => {
  const now = Date.now();

  // Circuit breaker: If we hit quota error recently, return cached token or null
  if (tokenCache.quotaErrorUntil > now) {
    console.warn('[subscription.js] ⚠️ Token refresh blocked (quota cooldown)');
    // Return cached token if still valid, otherwise return from localStorage
    if (tokenCache.token && tokenCache.expiry > now) {
      return tokenCache.token;
    }
    return localStorage.getItem('token') || null;
  }

  // Return cached token if still valid
  if (tokenCache.token && tokenCache.expiry > now) {
    return tokenCache.token;
  }

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Use forceRefresh=false to avoid hitting API unnecessarily
      const token = await currentUser.getIdToken(false);

      // Cache the token
      tokenCache.token = token;
      tokenCache.expiry = now + TOKEN_CACHE_TTL_MS;

      return token;
    }
    return localStorage.getItem('token') || null;
  } catch (error) {
    console.error('[subscription.js] Error getting auth token:', error);

    // Check for quota exceeded error
    if (error.code === 'auth/quota-exceeded' ||
      error.message?.includes('quota-exceeded') ||
      error.message?.includes('QUOTA_EXCEEDED')) {
      console.error('[subscription.js] 🛑 Quota exceeded - activating circuit breaker');
      tokenCache.quotaErrorUntil = now + QUOTA_COOLDOWN_MS;
    }

    // Return cached token or localStorage fallback
    if (tokenCache.token && tokenCache.expiry > now) {
      return tokenCache.token;
    }
    return localStorage.getItem('token') || null;
  }
};

// =============================================
// 💳 SUBSCRIPTION PERSISTENCE SYSTEM
// =============================================

/**
 * CRITICAL: Fetch subscription status directly from server
 * This is the primary function for getting subscription status
 */
export const fetchSubscriptionFromServer = async (userId) => {

  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ [subscription.js] No authentication token');
      return { success: false, error: 'No authentication token' };
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Direct fetch from user endpoint
    const { data } = await api.get(`users/${userId}`, { headers });



    const userData = data.user || data.data || data;

    const subscription = {
      plan: userData.subscriptionPlan || 'free',
      status: (userData.subscriptionPlan && userData.subscriptionPlan !== 'free') ? 'active' : 'inactive',
      expiryDate: userData.subscriptionExpiryDate || null,
      source: userData.subscriptionSource || null,
      activatedAt: userData.subscriptionActivatedAt || null,
      duration: userData.subscriptionDuration || null,
      serverFetch: true,
      serverFetch: true,
      fetchTime: new Date().toISOString(),
      currentUsage: userData.currentUsage || null,
      usageLimits: userData.usageLimits || null
    };



    return {
      success: true,
      subscription: subscription,
      user: userData
    };

  } catch (error) {

    return {
      success: false,
      error: error.message,
      subscription: null
    };
  }
};

/**
 * Save subscription to server for global persistence
 */
export const saveSubscriptionToServer = async (userId, subscriptionData) => {
  console.log('💾 [subscription.js] saveSubscriptionToServer called');

  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token' };
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Prepare comprehensive subscription data
    const serverData = {
      userId: userId,
      subscriptionPlan: subscriptionData.plan,
      subscriptionStatus: subscriptionData.status || 'active',
      activatedAt: subscriptionData.activatedAt || new Date().toISOString(),
      expiryDate: subscriptionData.expiryDate,
      source: subscriptionData.source || 'api',
      details: {
        ...subscriptionData.details,
        lastUpdated: new Date().toISOString(),
        deviceInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          timestamp: Date.now()
        }
      },
      metadata: {
        version: '2.0',
        persistenceType: 'global',
        syncSource: 'client'
      }
    };

    // Try to update user subscription
    try {
      const response = await api.put(`users/${userId}/status`, serverData, { headers });
      if (response.data && response.data.success !== false) {
        console.log('✅ [subscription.js] Subscription saved to server');
        return {
          success: true,
          data: response.data,
          serverData: serverData
        };
      }
    } catch (endpointError) {
      console.warn('⚠️ [subscription.js] Primary endpoint failed:', endpointError.message);
    }

    // Fallback - try alternative endpoint
    try {
      const response = await api.put(`users/${userId}`, serverData, { headers });
      if (response.data) {
        return {
          success: true,
          data: response.data,
          serverData: serverData
        };
      }
    } catch (fallbackError) {
      console.warn('⚠️ [subscription.js] Fallback endpoint failed:', fallbackError.message);
    }

    return {
      success: false,
      error: 'Failed to save subscription to server',
      localOnly: true,
      serverData: serverData
    };
  } catch (error) {
    console.error('❌ [subscription.js] saveSubscriptionToServer error:', error);
    return {
      success: false,
      error: error.message,
      localOnly: true
    };
  }
};

/**
 * Load subscription from server for global sync
 */
export const loadSubscriptionFromServer = async (userId) => {
  console.log('📥 [subscription.js] loadSubscriptionFromServer called for:', userId);

  // Use the primary fetch function
  return await fetchSubscriptionFromServer(userId);
};

/**
 * Sync subscription status globally (bidirectional)
 */
export const syncSubscriptionGlobally = async (userId, localSubscription = null) => {
  console.log('🔄 [subscription.js] syncSubscriptionGlobally called');

  try {
    // Step 1: Always fetch from server first
    const serverResult = await fetchSubscriptionFromServer(userId);

    if (!serverResult.success) {
      console.warn('⚠️ [subscription.js] Server fetch failed:', serverResult.error);

      // If server fetch failed but we have local data, return it with warning
      if (localSubscription && localSubscription.plan !== 'free') {
        return {
          success: true,
          subscription: localSubscription,
          syncAction: 'local-fallback',
          warning: 'Could not sync with server, using local data'
        };
      }

      return {
        success: false,
        error: serverResult.error,
        subscription: null
      };
    }

    const serverSubscription = serverResult.subscription;
    let finalSubscription = serverSubscription;
    let syncAction = 'server-to-local';

    // Step 2: Compare with local if provided
    if (localSubscription && localSubscription.plan !== 'free') {
      const planPriority = { free: 0, start: 1, pro: 2, premium: 3 };
      const localPriority = planPriority[localSubscription.plan] || 0;
      const serverPriority = planPriority[serverSubscription.plan] || 0;

      // If local has higher plan, sync to server
      if (localPriority > serverPriority) {
        console.log('📤 [subscription.js] Local plan is higher, syncing to server');
        await saveSubscriptionToServer(userId, localSubscription);
        finalSubscription = localSubscription;
        syncAction = 'local-to-server';
      } else if (localPriority === serverPriority && localSubscription.expiryDate && serverSubscription.expiryDate) {
        // Same plan, compare expiry dates
        const localExpiry = new Date(localSubscription.expiryDate);
        const serverExpiry = new Date(serverSubscription.expiryDate);

        if (localExpiry > serverExpiry) {
          await saveSubscriptionToServer(userId, localSubscription);
          finalSubscription = localSubscription;
          syncAction = 'local-to-server';
        }
      }
    }

    // Step 3: Update local storage with final subscription
    if (finalSubscription && finalSubscription.plan !== 'free') {
      const now = new Date();
      const expiryDate = finalSubscription.expiryDate ? new Date(finalSubscription.expiryDate) : null;

      if (!expiryDate || expiryDate > now) {
        // Valid subscription, persist locally
        localStorage.setItem('subscriptionData', JSON.stringify(finalSubscription));
        localStorage.setItem('userStatus', finalSubscription.plan);
        localStorage.setItem('userPlan', finalSubscription.plan);
        localStorage.setItem('subscriptionPlan', finalSubscription.plan);
        localStorage.setItem('subscriptionExpiry', finalSubscription.expiryDate || '');
        localStorage.setItem('lastGlobalSync', Date.now().toString());

        console.log('✅ [subscription.js] Sync complete:', finalSubscription.plan);

        return {
          success: true,
          subscription: finalSubscription,
          syncAction: syncAction,
          globalSync: true
        };
      }
    }

    // No valid subscription or expired
    return {
      success: true,
      subscription: serverSubscription,
      syncAction: 'server-to-local',
      message: serverSubscription.plan === 'free' ? 'No active subscription' : 'Subscription synced'
    };
  } catch (error) {
    console.error('❌ [subscription.js] syncSubscriptionGlobally error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enhanced user status update with server persistence
 */
export const updateUserStatusWithPersistence = async (userId, newStatus, source = 'manual') => {
  console.log('📝 [subscription.js] updateUserStatusWithPersistence called:', newStatus);

  try {
    const token = await getAuthToken();

    // 1. Update server first
    const serverUpdateData = {
      subscriptionPlan: newStatus,
      userStatus: newStatus,
      plan: newStatus,
      lastStatusUpdate: new Date().toISOString(),
      statusSource: source
    };

    let serverUpdateSuccess = false;

    // Try to update server
    try {
      const response = await api.put(`users/${userId}/status`, serverUpdateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        serverUpdateSuccess = true;
        console.log('✅ [subscription.js] Server update successful');
      }
    } catch (endpointError) {
      console.warn('⚠️ [subscription.js] Server update failed:', endpointError.message);

      // Try alternative endpoint
      try {
        const response = await api.put(`users/${userId}`, serverUpdateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          serverUpdateSuccess = true;
        }
      } catch (fallbackError) {
        console.warn('⚠️ [subscription.js] Fallback update failed:', fallbackError.message);
      }
    }

    // 2. Create comprehensive subscription data
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (source === 'payment' ? 365 : 30) * 24 * 60 * 60 * 1000);

    const subscriptionData = {
      plan: newStatus,
      status: newStatus !== 'free' ? 'active' : 'inactive',
      activatedAt: now.toISOString(),
      expiryDate: newStatus !== 'free' ? expiryDate.toISOString() : null,
      source: source,
      lastUpdated: now.toISOString(),
      serverSync: serverUpdateSuccess,
      version: '2.0'
    };

    // 3. Persist to localStorage
    const persistenceKeys = {
      'subscriptionData': JSON.stringify(subscriptionData),
      'userStatus': newStatus,
      'userPlan': newStatus,
      'subscriptionPlan': newStatus,
      'plan': newStatus,
      'lastStatusUpdate': now.toISOString(),
      'statusPersistenceVersion': '2.0'
    };

    Object.entries(persistenceKeys).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch (storageError) {
        console.warn('⚠️ [subscription.js] localStorage error:', key);
      }
    });

    // 4. Update user object in localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.subscriptionPlan = newStatus;
        userData.userStatus = newStatus;
        userData.plan = newStatus;
        userData.lastStatusUpdate = now.toISOString();
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (userUpdateError) {
      console.warn('⚠️ [subscription.js] User object update error');
    }

    return {
      success: true,
      newStatus: newStatus,
      serverSync: serverUpdateSuccess,
      subscriptionData: subscriptionData
    };

  } catch (error) {
    console.error('❌ [subscription.js] updateUserStatusWithPersistence error:', error);

    // Fallback: at least persist locally
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('plan', newStatus);
    } catch (fallbackError) {
      console.error('❌ [subscription.js] localStorage fallback failed');
    }

    return {
      success: false,
      error: error.message,
      newStatus: newStatus,
      serverSync: false
    };
  }
};

/**
 * Enhanced promocode application with global persistence
 */
export const applyPromocodeWithGlobalPersistence = async (userId, promocode, plan) => {
  console.log('🎟️ [subscription.js] applyPromocodeWithGlobalPersistence called');

  try {
    // 1. Apply promocode via server
    const token = await getAuthToken();
    const response = await api.post('promocodes/apply', {
      userId: userId,
      code: (promocode || '').toUpperCase(),
      plan: plan
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.success) {
      // 2. Update status with global persistence
      const persistenceResult = await updateUserStatusWithPersistence(userId, plan, 'promocode');

      // 3. Return comprehensive result
      return {
        success: true,
        message: response.data.message || `Promocode applied! ${plan.toUpperCase()} plan activated.`,
        plan: plan,
        promocode: (promocode || '').toUpperCase(),
        serverResponse: response.data,
        persistence: persistenceResult
      };

    } else {
      return {
        success: false,
        error: response.data?.error || response.data?.message || 'Promocode was rejected'
      };
    }
  } catch (error) {
    console.error('❌ [subscription.js] applyPromocodeWithGlobalPersistence error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to apply promocode'
    };
  }
};

/**
 * Enhanced payment completion with global persistence
 */
export const completePaymentWithGlobalPersistence = async (userId, paymentData) => {
  console.log('💰 [subscription.js] completePaymentWithGlobalPersistence called');

  try {
    // 1. Complete payment via server
    const token = await getAuthToken();
    const response = await api.post('payments/complete', {
      userId: userId,
      ...paymentData
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.success) {
      // 2. Update status with global persistence
      const persistenceResult = await updateUserStatusWithPersistence(userId, paymentData.plan, 'payment');

      // 3. Return comprehensive result
      return {
        success: true,
        message: response.data.message || `Payment completed! ${paymentData.plan.toUpperCase()} plan activated.`,
        plan: paymentData.plan,
        transactionId: paymentData.transactionId,
        serverResponse: response.data,
        persistence: persistenceResult
      };

    } else {
      return {
        success: false,
        error: response.data?.error || response.data?.message || 'Payment was not confirmed'
      };
    }
  } catch (error) {
    console.error('❌ [subscription.js] completePaymentWithGlobalPersistence error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to complete payment'
    };
  }
};

/**
 * Check global sync status with server
 */
export const checkGlobalSyncStatus = async (userId, localSubscription = null) => {
  console.log('🔍 [subscription.js] checkGlobalSyncStatus called');

  try {
    const token = await getAuthToken();
    if (!token) {
      return { syncNeeded: false, message: 'No authenticated user' };
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    const { data } = await api.post(`users/${userId}/sync-status`, {
      localSubscription: localSubscription
    }, { headers });

    return data;
  } catch (error) {
    console.error('❌ [subscription.js] checkGlobalSyncStatus error:', error);
    return {
      syncNeeded: true,
      message: 'Server check failed, assuming sync is needed',
      error: error.message
    };
  }
};

// =============================================
// 📤 DEFAULT EXPORT
// =============================================

export default {
  fetchSubscriptionFromServer,
  saveSubscriptionToServer,
  loadSubscriptionFromServer,
  syncSubscriptionGlobally,
  updateUserStatusWithPersistence,
  applyPromocodeWithGlobalPersistence,
  completePaymentWithGlobalPersistence,
  checkGlobalSyncStatus
};