// src/api/subscription.js
import api from './core.js';
import { auth } from '@/firebase';

/**
 * Save subscription to server for global persistence.
 */
export const saveSubscriptionToServer = async (userId, subscriptionData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for server save');
      return { success: false, error: 'No authentication token' };
    }
    const headers = { 'Authorization': `Bearer ${token}` };
    const serverData = {
      userId: userId,
      subscriptionPlan: subscriptionData.plan,
      subscriptionStatus: subscriptionData.status || 'active',
      activatedAt: subscriptionData.activatedAt || new Date().toISOString(),
      expiryDate: subscriptionData.expiryDate,
      source: subscriptionData.source || 'api',
      details: { ...subscriptionData.details, lastUpdated: new Date().toISOString() },
      metadata: { version: '2.0', persistenceType: 'global', syncSource: 'client' }
    };

    const endpoints = [`users/${userId}/subscription`, `subscription/save`, `users/${userId}/status`];
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, serverData, { headers });
        if (data && data.success !== false) {
          return { success: true, data, endpoint, serverData };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);
      }
    }
    console.warn('⚠️ All save endpoints failed, subscription saved locally only');
    return { success: true, localOnly: true, warning: 'Saved locally only - server sync failed', serverData };
  } catch (error) {
    console.error('❌ Failed to save subscription to server:', error);
    return { success: false, error: error.message, localOnly: true };
  }
};

/**
 * Load subscription from server for global sync.
 */
export const loadSubscriptionFromServer = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for server load');
      return { success: false, error: 'No authentication token' };
    }
    const headers = { 'Authorization': `Bearer ${token}` };
    const endpoints = [`users/${userId}/subscription`, `users/${userId}/status`, `subscription/user/${userId}`];

    for (const endpoint of endpoints) {
      try {
        const { data: response } = await api.get(endpoint, { headers });
        if (response && response.success !== false) {
          const serverData = response.data || response;
          const subscription = {
            plan: serverData.subscriptionPlan || serverData.plan || serverData.userStatus || 'free',
            status: serverData.subscriptionStatus || (serverData.subscriptionPlan !== 'free' ? 'active' : 'inactive'),
            activatedAt: serverData.activatedAt,
            expiryDate: serverData.expiryDate || serverData.subscriptionExpiry,
            source: serverData.source || 'server',
            details: serverData.details || {},
          };
          if (subscription.plan && subscription.plan !== 'free') {
            const expiry = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
            if (!expiry || expiry > new Date()) {
                return { success: true, subscription: { ...subscription, serverSync: true }, endpoint };
            }
          }
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);
      }
    }
    return { success: true, subscription: null, message: 'No subscription found on server' };
  } catch (error) {
    console.error('❌ Failed to load subscription from server:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sync subscription status globally (bidirectional).
 */
export const syncSubscriptionGlobally = async (userId, localSubscription = null) => {
  try {
    const serverResult = await loadSubscriptionFromServer(userId);
    let finalSubscription = null;
    let syncAction = 'none';

    if (serverResult.success && serverResult.subscription) {
      const serverSub = serverResult.subscription;
      if (localSubscription) {
        const localExpiry = localSubscription.expiryDate ? new Date(localSubscription.expiryDate) : null;
        const serverExpiry = serverSub.expiryDate ? new Date(serverSub.expiryDate) : null;
        const planPriority = { free: 0, start: 1, pro: 2, premium: 3 };
        
        if ((planPriority[serverSub.plan] || 0) > (planPriority[localSubscription.plan] || 0) || (serverExpiry > localExpiry)) {
            finalSubscription = serverSub;
            syncAction = 'server-to-local';
        } else {
            finalSubscription = localSubscription;
            syncAction = 'local-to-server';
        }
      } else {
        finalSubscription = serverSub;
        syncAction = 'server-to-local';
      }
    } else if (localSubscription && localSubscription.plan !== 'free') {
      finalSubscription = localSubscription;
      syncAction = 'local-to-server';
    }

    if (syncAction === 'local-to-server' && finalSubscription) {
      await saveSubscriptionToServer(userId, finalSubscription);
    }

    if (finalSubscription?.plan !== 'free' && (!finalSubscription.expiryDate || new Date(finalSubscription.expiryDate) > new Date())) {
      localStorage.setItem('subscriptionData', JSON.stringify({ ...finalSubscription, lastGlobalSync: new Date().toISOString() }));
      localStorage.setItem('userStatus', finalSubscription.plan);
      return { success: true, subscription: finalSubscription, syncAction };
    }

    return { success: true, subscription: null, syncAction: 'none', message: 'No valid subscription to sync' };
  } catch (error) {
    console.error('❌ Global subscription sync failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * CRITICAL FIX: Enhanced user status update with server persistence.
 */
export const updateUserStatusWithPersistence = async (userId, newStatus, source = 'manual') => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const serverUpdateData = { subscriptionPlan: newStatus, userStatus: newStatus, statusSource: source };
    const endpoints = [`users/${userId}`, `users/${userId}/status`];
    let serverUpdateSuccess = false;

    for (const endpoint of endpoints) {
      try {
        const response = await api.put(endpoint, serverUpdateData, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 200) {
          serverUpdateSuccess = true;
          break;
        }
      } catch (err) {
        console.warn(`⚠️ Server update failed via ${endpoint}:`, err.message);
      }
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subscriptionData = {
      plan: newStatus,
      status: newStatus !== 'free' ? 'active' : 'inactive',
      activatedAt: now.toISOString(),
      expiryDate: newStatus !== 'free' ? expiryDate.toISOString() : null,
      source,
      serverSync: serverUpdateSuccess,
    };

    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    localStorage.setItem('userStatus', newStatus);
    localStorage.setItem('userPlan', newStatus);

    return { success: true, newStatus, serverSync: serverUpdateSuccess, subscriptionData };
  } catch (error) {
    console.error('❌ Global status persistence failed:', error);
    localStorage.setItem('userStatus', newStatus); // Fallback to local
    return { success: false, error: error.message, newStatus, serverSync: false };
  }
};

/**
 * CRITICAL FIX: Enhanced promocode application with global persistence.
 */
export const applyPromocodeWithGlobalPersistence = async (userId, promocode, plan) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const { data } = await api.post('payments/promo-code', { userId, promoCode: promocode.toUpperCase(), plan }, { headers: { Authorization: `Bearer ${token}` } });

    if (data && data.success) {
      const persistenceResult = await updateUserStatusWithPersistence(userId, plan, 'promocode');
      return { success: true, message: data.message || `Promocode applied!`, plan, persistence: persistenceResult };
    } else {
      return { success: false, error: data?.error || data?.message || 'Promocode was rejected' };
    }
  } catch (error) {
    console.error('❌ Promocode application with persistence failed:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * CRITICAL FIX: Enhanced payment completion with global persistence.
 */
export const completePaymentWithGlobalPersistence = async (userId, paymentData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const { data } = await api.post('payments/complete', { userId, ...paymentData }, { headers: { Authorization: `Bearer ${token}` } });

    if (data && data.success) {
      const persistenceResult = await updateUserStatusWithPersistence(userId, paymentData.plan, 'payment');
      return { success: true, message: data.message || `Payment completed!`, plan: paymentData.plan, persistence: persistenceResult };
    } else {
      return { success: false, error: data?.error || data?.message || 'Payment was not confirmed' };
    }
  } catch (error) {
    console.error('❌ Payment completion with persistence failed:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};