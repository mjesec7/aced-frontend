// src/composables/useSubscriptionSync.js
// This composable ensures subscription status is always synced from server
// Includes debouncing and circuit breaker to prevent infinite loops

import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { auth } from '@/firebase';
import { fetchSubscriptionFromServer } from '@/api/subscription';

// Module-level debounce and error tracking to prevent loops across instances
let lastSyncAttempt = 0;
let consecutiveErrors = 0;
let errorCooldownUntil = 0;
const MIN_SYNC_INTERVAL = 5000;  // Minimum 5 seconds between syncs
const ERROR_COOLDOWN_MS = 60000; // 60 second cooldown after repeated errors
const MAX_CONSECUTIVE_ERRORS = 3;

export function useSubscriptionSync() {
  const store = useStore();
  const isSyncing = ref(false);
  const lastSyncTime = ref(null);
  const syncError = ref(null);

  let syncInterval = null;
  let authUnsubscribe = null;
  let subscriptionUpdateTimeout = null;

  /**
   * Sync subscription status from server with debouncing and error handling
   */
  const syncSubscription = async (force = false) => {
    const now = Date.now();

    // Circuit breaker: Don't sync during error cooldown
    if (errorCooldownUntil > now) {
      console.log('⏳ [useSubscriptionSync] In error cooldown, skipping...');
      return;
    }

    // Debounce: Don't sync too frequently
    if (!force && (now - lastSyncAttempt) < MIN_SYNC_INTERVAL) {
      console.log('⏳ [useSubscriptionSync] Debounced, skipping...');
      return;
    }

    // Don't sync if already syncing
    if (isSyncing.value && !force) {
      console.log('⏳ [useSubscriptionSync] Already syncing, skipping...');
      return;
    }

    // Don't sync too frequently (minimum 30 seconds between syncs)
    if (lastSyncTime.value && (now - lastSyncTime.value) < 30000 && !force) {
      console.log('⏳ [useSubscriptionSync] Recent sync, skipping...');
      return;
    }

    lastSyncAttempt = now;

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

        // Reset error counter on success
        consecutiveErrors = 0;

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

        // Dispatch event for other components (subscriptionSynced, NOT subscriptionUpdated to avoid loop)
        window.dispatchEvent(new CustomEvent('subscriptionSynced', {
          detail: { subscription: result.subscription, timestamp: now }
        }));

        return result.subscription;
      } else {
        console.warn('⚠️ [useSubscriptionSync] Server fetch failed:', result.error);
        syncError.value = result.error;

        // Track consecutive errors
        consecutiveErrors++;

        // Activate cooldown if too many errors or quota exceeded
        if (result.error?.includes('quota') ||
          result.error?.includes('QUOTA') ||
          consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error('🛑 [useSubscriptionSync] Activating error cooldown');
          errorCooldownUntil = now + ERROR_COOLDOWN_MS;
          consecutiveErrors = 0;
        }
      }
    } catch (error) {
      console.error('❌ [useSubscriptionSync] Error:', error);
      syncError.value = error.message;

      // Track consecutive errors
      consecutiveErrors++;

      // Check for quota exceeded error
      if (error.code === 'auth/quota-exceeded' ||
        error.message?.includes('quota') ||
        consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error('🛑 [useSubscriptionSync] Activating error cooldown');
        errorCooldownUntil = now + ERROR_COOLDOWN_MS;
        consecutiveErrors = 0;
      }
    } finally {
      isSyncing.value = false;
    }
  };

  /**
   * Start periodic sync (every 5 minutes)
   */
  const startPeriodicSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }

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

  // Debounced handler for subscriptionUpdated events
  const handleSubscriptionUpdated = () => {
    if (subscriptionUpdateTimeout) {
      clearTimeout(subscriptionUpdateTimeout);
    }
    subscriptionUpdateTimeout = setTimeout(() => {
      syncSubscription(false); // Don't force - respect cooldowns
    }, 1000);  // 1 second debounce
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
        setTimeout(() => {
          syncSubscription(true);
          startPeriodicSync();
        }, 500);
      } else {
        console.log('👤 [useSubscriptionSync] User signed out');
        stopPeriodicSync();
      }
    });

    // Sync on visibility change
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

    // Listen for payment/promocode events
    window.addEventListener('paymentCompleted', () => syncSubscription(true));
    window.addEventListener('promocodeApplied', () => syncSubscription(true));
    // Use debounced handler for subscriptionUpdated to prevent loops
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdated);
  };

  /**
   * Cleanup on unmount
   */
  const cleanup = () => {
    stopPeriodicSync();
    if (authUnsubscribe) {
      authUnsubscribe();
    }
    if (subscriptionUpdateTimeout) {
      clearTimeout(subscriptionUpdateTimeout);
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