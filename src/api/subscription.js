// src/api/subscription.js - Subscription Management API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 💳 SUBSCRIPTION PERSISTENCE SYSTEM
// =============================================

/**
 * Save subscription to server for global persistence
 */
export const saveSubscriptionToServer = async (userId, subscriptionData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
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
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      },
      metadata: {
        version: '2.0',
        persistenceType: 'global',
        syncSource: 'client'
      }
    };

    // Try multiple endpoints for saving subscription
    const endpoints = [
      `users/${userId}/subscription`,
      `subscription/save`,
      `users/${userId}/status`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint, serverData, { headers });
        if (response.data && response.data.success !== false) {
          return {
            success: true,
            data: response.data,
            endpoint: endpoint,
            serverData: serverData
          };
        }
      } catch (endpointError) {
continue;
      }
    }

    // If all endpoints fail, still return success but with warning
return {
      success: true,
      localOnly: true,
      warning: 'Saved locally only - server sync failed',
      serverData: serverData
    };
  } catch (error) {
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
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
return { success: false, error: 'No authentication token' };
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Try multiple endpoints for loading subscription
    const endpoints = [
      `users/${userId}/subscription`,
      `users/${userId}/status`,
      `subscription/user/${userId}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint, { headers });
        if (response.data && response.data.success !== false) {
          const serverData = response.data.data || response.data;

          // Extract subscription information
          const subscription = {
            plan: serverData.subscriptionPlan || serverData.plan || serverData.userStatus || 'free',
            status: serverData.subscriptionStatus || serverData.status || (serverData.subscriptionPlan !== 'free' ? 'active' : 'inactive'),
            activatedAt: serverData.activatedAt || serverData.createdAt,
            expiryDate: serverData.expiryDate || serverData.subscriptionExpiry,
            source: serverData.source || 'server',
            details: serverData.details || {},
            lastSync: new Date().toISOString(),
            serverSync: true
          };

          // Validate the subscription
          if (subscription.plan && subscription.plan !== 'free') {
            // Check if not expired
            if (subscription.expiryDate) {
              const expiryDate = new Date(subscription.expiryDate);
              const now = new Date();
              if (expiryDate > now) {
                return {
                  success: true,
                  subscription: subscription,
                  endpoint: endpoint,
                  serverSync: true
                };
              }
            } else {
              // No expiry date, assume valid for paid plans
              return {
                success: true,
                subscription: subscription,
                endpoint: endpoint,
                serverSync: true
              };
            }
          }
        }
      } catch (endpointError) {
continue;
      }
    }

    return {
      success: true,
      subscription: null,
      message: 'No subscription found on server'
    };
  } catch (error) {
return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sync subscription status globally (bidirectional)
 */
export const syncSubscriptionGlobally = async (userId, localSubscription = null) => {
  try {
    // Step 1: Load from server
    const serverResult = await loadSubscriptionFromServer(userId);
    let finalSubscription = null;
    let syncAction = 'none';

    if (serverResult.success && serverResult.subscription) {
      const serverSub = serverResult.subscription;

      if (localSubscription) {
        // Compare local vs server and use the better one
        const localExpiry = localSubscription.expiryDate ? new Date(localSubscription.expiryDate) : null;
        const serverExpiry = serverSub.expiryDate ? new Date(serverSub.expiryDate) : null;

        // Priority logic: use the subscription with later expiry date or higher plan
        const planPriority = { free: 0, start: 1, pro: 2, premium: 3 };
        const localPriority = planPriority[localSubscription.plan] || 0;
        const serverPriority = planPriority[serverSub.plan] || 0;

        if (serverPriority > localPriority) {
          finalSubscription = serverSub;
          syncAction = 'server-to-local';
        } else if (localPriority > serverPriority) {
          finalSubscription = localSubscription;
          syncAction = 'local-to-server';
        } else if (serverExpiry && localExpiry) {
          // Same plan, compare expiry dates
          if (serverExpiry > localExpiry) {
            finalSubscription = serverSub;
            syncAction = 'server-to-local';
          } else {
            finalSubscription = localSubscription;
            syncAction = 'local-to-server';
          }
        } else {
          // Use server version if equal
          finalSubscription = serverSub;
          syncAction = 'server-to-local';
        }
      } else {
        // No local subscription, use server
        finalSubscription = serverSub;
        syncAction = 'server-to-local';
      }
    } else if (localSubscription && localSubscription.plan !== 'free') {
      // No server subscription but have local, upload to server
      finalSubscription = localSubscription;
      syncAction = 'local-to-server';
    }

    // Step 2: Perform sync action
    if (syncAction === 'local-to-server' && finalSubscription) {
      await saveSubscriptionToServer(userId, finalSubscription);
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

        return {
          success: true,
          subscription: finalSubscription,
          syncAction: syncAction,
          globalSync: true
        };
      }
    }

    // No valid subscription found
    return {
      success: true,
      subscription: null,
      syncAction: 'none',
      message: 'No valid subscription to sync'
    };
  } catch (error) {
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
  try {
    const token = await auth.currentUser?.getIdToken();

    // 1. Update server first
    const serverUpdateData = {
      subscriptionPlan: newStatus,
      userStatus: newStatus,
      plan: newStatus,
      lastStatusUpdate: new Date().toISOString(),
      statusSource: source
    };

    // Try multiple server endpoints to ensure update
    const endpoints = [
      `users/${userId}`,
      `users/${userId}/status`
    ];

    let serverUpdateSuccess = false;
    for (const endpoint of endpoints) {
      try {
        const response = await api.put(endpoint, serverUpdateData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          serverUpdateSuccess = true;
          break;
        }
      } catch (endpointError) {
continue;
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

    // 3. Persist to localStorage with multiple keys for reliability
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
}

    return {
      success: true,
      newStatus: newStatus,
      serverSync: serverUpdateSuccess,
      subscriptionData: subscriptionData
    };

  } catch (error) {
// Fallback: at least persist locally
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('plan', newStatus);
    } catch (fallbackError) {
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
  try {
    // 1. Apply promocode via server
    const token = await auth.currentUser?.getIdToken();
    const response = await api.post('payments/promo-code', {
      userId: userId,
      promoCode: (promocode || '').toUpperCase(),
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
  try {
    // 1. Complete payment via server
    const token = await auth.currentUser?.getIdToken();
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
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
return { syncNeeded: false, message: 'No authenticated user' };
    }

    const headers = { 'Authorization': `Bearer ${token}` };

    const { data } = await api.post(`users/${userId}/sync-status`, {
      localSubscription: localSubscription
    }, { headers });

    return data;
  } catch (error) {
return {
      syncNeeded: true,
      message: 'Server check failed, assuming sync is needed',
      error: error.message
    };
  }
};