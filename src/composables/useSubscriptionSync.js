// src/composables/useSubscriptionSync.js
// This composable ensures subscription status is always synced from server

import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { auth } from '@/firebase';
import { fetchSubscriptionFromServer } from '@/api/subscription';

export function useSubscriptionSync() {
  const store = useStore();
  const isSyncing = ref(false);
  const lastSyncTime = ref(null);
  const syncError = ref(null);

  let syncInterval = null;
  let authUnsubscribe = null;

  /**
   * Sync subscription status from server
   */
  const syncSubscription = async (force = false) => {
    // Don't sync if already syncing
    if (isSyncing.value && !force) {
      console.log('⏳ [useSubscriptionSync] Already syncing, skipping...');
      return;
    }

    // Don't sync too frequently (minimum 30 seconds between syncs)
    const now = Date.now();
    if (lastSyncTime.value && (now - lastSyncTime.value) < 30000 && !force) {
      console.log('⏳ [useSubscriptionSync] Recent sync, skipping...');
      return;
    }

    try {
      isSyncing.value = true;
      syncError.value = null;

      // Get user ID
      const userId = store.getters['user/getUserId'] || 
                     localStorage.getItem('userId') || 
                     localStorage.getItem('firebaseUserId') ||
                     auth.currentUser?.uid;

      if (!userId) {
        console.log('⚠️ [useSubscriptionSync] No user ID, skipping sync');
        return;
      }

      console.log('🔄 [useSubscriptionSync] Syncing subscription for:', userId);

      // Fetch from server
      const result = await fetchSubscriptionFromServer(userId);

      if (result.success && result.subscription) {
        console.log('✅ [useSubscriptionSync] Server returned:', result.subscription.plan);

        // Update store
        await store.dispatch('user/fetchStatusFromServer');

        // Update localStorage
        localStorage.setItem('userStatus', result.subscription.plan);
        localStorage.setItem('subscriptionPlan', result.subscription.plan);
        localStorage.setItem('userPlan', result.subscription.plan);
        if (result.subscription.expiryDate) {
          localStorage.setItem('subscriptionExpiry', result.subscription.expiryDate);
        }
        localStorage.setItem('lastServerSync', now.toString());

        lastSyncTime.value = now;

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('subscriptionSynced', {
          detail: { subscription: result.subscription, timestamp: now }
        }));

        return result.subscription;
      } else {
        console.warn('⚠️ [useSubscriptionSync] Server fetch failed:', result.error);
        syncError.value = result.error;
      }
    } catch (error) {
      console.error('❌ [useSubscriptionSync] Error:', error);
      syncError.value = error.message;
    } finally {
      isSyncing.value = false;
    }
  };

  /**
   * Start periodic sync (every 5 minutes)
   */
  const startPeriodicSync = () => {
    // Clear existing interval
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    // Sync every 5 minutes
    syncInterval = setInterval(() => {
      syncSubscription();
    }, 5 * 60 * 1000);

    console.log('🔄 [useSubscriptionSync] Periodic sync started (every 5 min)');
  };

  /**
   * Stop periodic sync
   */
  const stopPeriodicSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };

  /**
   * Initialize sync on mount
   */
  const initialize = () => {
    console.log('🚀 [useSubscriptionSync] Initializing...');

    // Listen for auth state changes
    authUnsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 [useSubscriptionSync] User authenticated, syncing...');
        // Wait a moment for store to be ready
        setTimeout(() => {
          syncSubscription(true);
          startPeriodicSync();
        }, 500);
      } else {
        console.log('👤 [useSubscriptionSync] User signed out');
        stopPeriodicSync();
      }
    });

    // Also sync on visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        syncSubscription();
      }
    });

    // Sync on focus
    window.addEventListener('focus', () => {
      if (auth.currentUser) {
        syncSubscription();
      }
    });

    // Listen for payment/promocode events to trigger immediate sync
    window.addEventListener('paymentCompleted', () => syncSubscription(true));
    window.addEventListener('promocodeApplied', () => syncSubscription(true));
    window.addEventListener('subscriptionUpdated', () => syncSubscription(true));
  };

  /**
   * Cleanup on unmount
   */
  const cleanup = () => {
    stopPeriodicSync();
    if (authUnsubscribe) {
      authUnsubscribe();
    }
  };

  // Auto-initialize on mount
  onMounted(() => {
    initialize();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncSubscription,
    startPeriodicSync,
    stopPeriodicSync,
    initialize,
    cleanup
  };
}

export default useSubscriptionSync;