// src/utils/subscription.js - Subscription Management

import { auth } from '../firebase';

// ============================================================================
// 🛡️ IMMEDIATE SUBSCRIPTION RESTORATION
// ============================================================================
export function immediateSubscriptionRestore() {
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
        localStorage.setItem('preservedStatus', subscription.plan);
        localStorage.setItem('validSubscriptionDetected', 'true');
        localStorage.setItem('preserveStatusDuringAuth', subscription.plan);
return subscription.plan;
      } else if (!isValid) {
        // Clean up expired subscription
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

// ============================================================================
// 🔥 CONTINUOUS SUBSCRIPTION MONITORING DURING AUTH
// ============================================================================
export function setupAuthSubscriptionMonitoring() {
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

    setTimeout(monitor, 100); // Check every 100ms
  };

  monitor();
  
  // Stop monitoring after 10 seconds (auth should be complete)
  setTimeout(() => { 
    monitoringActive = false;
}, 10000);
}

// ============================================================================
// 📅 SUBSCRIPTION PERSISTENCE (30-DAY SUBSCRIPTIONS)
// ============================================================================
export async function setupSubscriptionPersistence(plan, source = 'manual') {
  if (!plan || plan === 'free') {
return;
  }
const now = new Date();
  // ✅ CRITICAL: Set expiry to exactly 1 month (30 days) from now
  const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  const existingSubscription = getStoredSubscription();

  let subscriptionData;

  if (existingSubscription && existingSubscription.plan === plan && existingSubscription.expiryDate) {
    const existingExpiry = new Date(existingSubscription.expiryDate);
    if (existingExpiry > now) {
      // Keep existing expiry if still valid
}`);
      subscriptionData = {
        ...existingSubscription,
        lastUpdated: now.toISOString(),
        source: source,
        serverConfirmed: true
      };
    } else {
      // If expired, create new subscription with fresh 30-day period
subscriptionData = createNewSubscription(plan, now, expiryDate, source);
    }
  } else {
    // Create new subscription (fresh activation)
}`);
    subscriptionData = createNewSubscription(plan, now, expiryDate, source);
  }

  // ✅ CRITICAL: Store in localStorage with multiple keys for maximum reliability
  try {
    localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
    localStorage.setItem('subscriptionPlan', plan);
    localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
    localStorage.setItem('subscriptionActivated', subscriptionData.activatedAt);
    localStorage.setItem('userStatus', plan);
    localStorage.setItem('userPlan', plan);
    localStorage.setItem('plan', plan);
    localStorage.setItem('subscriptionStatus', 'active');
    localStorage.setItem('serverConfirmedSubscription', 'true');
.toLocaleDateString()}`);
  } catch (error) {
}

  return subscriptionData;
}

function createNewSubscription(plan, now, expiryDate, source) {
  return {
    plan: plan,
    activatedAt: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    lastUpdated: now.toISOString(),
    source: source,
    status: 'active',
    serverConfirmed: true,
    duration: 30 // days
  };
}

// ============================================================================
// 📊 SUBSCRIPTION UTILITIES
// ============================================================================
export function getStoredSubscription() {
  try {
    const subscriptionJson = localStorage.getItem('subscriptionData');
    if (subscriptionJson) {
      const subscription = JSON.parse(subscriptionJson);
      // ✅ Validate parsed subscription data
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

    // ✅ Only reconstruct if plan AND expiry are valid
    if (plan && plan !== 'free' && expiry) {
      const fallbackSubscription = {
        plan: plan,
        expiryDate: expiry,
        activatedAt: activated || new Date().toISOString(),
        status: 'active',
        source: 'fallback-reconstruction'
      };
      // Store the reconstructed data to fix it for the future
      localStorage.setItem('subscriptionData', JSON.stringify(fallbackSubscription));
return fallbackSubscription;
    }
  } catch (error) {
// Clear potentially corrupted data on parsing error
    localStorage.removeItem('subscriptionData');
  }

  return null;
}

export function isSubscriptionValid() {
  const subscription = getStoredSubscription();

  if (!subscription || !subscription.expiryDate) {
return false;
  }

  const now = new Date();
  const expiryDate = new Date(subscription.expiryDate);
  const isValid = now < expiryDate;
  const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
` : 'Expired'}`);

  return isValid;
}

// ============================================================================
// ⏰ SUBSCRIPTION EXPIRY HANDLING
// ============================================================================
export function handleSubscriptionExpiry(expiredSubscription) {
// Update all storage to FREE (not start!)
  localStorage.setItem('userStatus', 'free');
  localStorage.setItem('userPlan', 'free');
  localStorage.setItem('subscriptionPlan', 'free');
  localStorage.setItem('plan', 'free');

  // Clear the expired subscription data
  localStorage.removeItem('subscriptionData');
  localStorage.removeItem('subscriptionExpiry');
  localStorage.removeItem('subscriptionActivated');
  localStorage.removeItem('serverConfirmedSubscription');

  // Update store (dynamic import to avoid circular dependency)
  try {
    import('../store').then(({ default: store }) => {
      store.commit('user/SET_USER_STATUS', 'free');
      store.commit('user/FORCE_UPDATE');
    }).catch(err => {
});
  } catch (error) {
}

  // Trigger status change events
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

  // Show notification to user
  if (window.eventBus) {
    window.eventBus.emit('subscriptionExpired', {
      plan: expiredSubscription.plan,
      message: `Ваша ${expiredSubscription.plan === 'pro' ? 'Pro' : 'Start'} подписка истекла. Пожалуйста, обновите план для продолжения использования премиум функций.`,
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// 🔍 SUBSCRIPTION EXPIRY CHECKING
// ============================================================================
export function setupSubscriptionExpiryCheck() {
  // Clear any existing interval
  if (window.subscriptionCheckInterval) {
    clearInterval(window.subscriptionCheckInterval);
  }

  // Function to check subscription
  const checkSubscription = () => {
const subscription = getStoredSubscription();
    if (!subscription || subscription.plan === 'free') {
      return; // No need to check free subscriptions
    }

    if (!isSubscriptionValid()) {
handleSubscriptionExpiry(subscription);
    } else {
      // Calculate and log days remaining
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
`);

      // Show warning if expiring soon (less than 3 days)
      if (daysRemaining <= 3 && daysRemaining > 0) {
        if (window.eventBus) {
          window.eventBus.emit('subscriptionExpiringSoon', {
            plan: subscription.plan,
            daysRemaining: daysRemaining,
            expiryDate: subscription.expiryDate,
            message: `Ваша ${subscription.plan} подписка истечет через ${daysRemaining} ${daysRemaining === 1 ? 'день' : 'дня'}`,
            timestamp: Date.now()
          });
        }
      }
    }
  };

  // Check every hour
  window.subscriptionCheckInterval = setInterval(checkSubscription, 60 * 60 * 1000);

  // Also check on visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
checkSubscription();
    }
  });

  // Initial check after 10 seconds (give app time to load)
  setTimeout(checkSubscription, 10000);
}

// ============================================================================
// 🌐 SETUP SUBSCRIPTION SYSTEM
// ============================================================================
export function setupSubscriptionSystem(store, eventBus) {
// Setup automatic expiry checking
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

  // ============================================================================
  // 🎫 GLOBAL PROMOCODE APPLICATION
  // ============================================================================
  window.applyPromocodeGlobally = async (promocode, plan) => {
try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = currentUser.uid;
      const token = await currentUser.getIdToken();
// Apply promocode via server
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/payments/promo-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          promoCode: promocode.toUpperCase(),
          plan: plan
        })
      });

      const result = await response.json();

      if (result?.success) {
// Set up proper 30-day subscription
        const subscriptionData = await setupSubscriptionPersistence(plan, 'promocode');

        // Update localStorage immediately
        localStorage.setItem('userStatus', plan);
        localStorage.setItem('userPlan', plan);
        localStorage.setItem('subscriptionPlan', plan);
        localStorage.setItem('plan', plan);
        localStorage.setItem('promocodeApplied', promocode.toUpperCase());

        // Update user object in localStorage
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.subscriptionPlan = plan;
            userData.userStatus = plan;
            userData.plan = plan;
            userData.promocodeApplied = promocode.toUpperCase();
            userData.lastStatusUpdate = new Date().toISOString();
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (userUpdateError) {
}

        // Update store
        if (window.store || store) {
          const storeRef = window.store || store;
          storeRef.commit('user/SET_USER_STATUS', plan);
          storeRef.commit('user/UPDATE_SUBSCRIPTION', subscriptionData);
          storeRef.commit('user/FORCE_UPDATE');
        }

        // Trigger events
        const eventData = {
          promocode: promocode.toUpperCase(),
          oldStatus: 'free',
          newStatus: plan,
          plan: plan,
          userStatus: plan,
          subscriptionPlan: plan,
          expiryDate: subscriptionData.expiryDate,
          activatedAt: subscriptionData.activatedAt,
          source: 'promocode',
          timestamp: Date.now(),
          message: `Промокод применён! План ${plan.toUpperCase()} активен до ${new Date(subscriptionData.expiryDate).toLocaleDateString()}`
        };

        const eventTypes = [
          'userStatusChanged',
          'userSubscriptionChanged',
          'subscriptionUpdated',
          'promocodeApplied',
          'globalForceUpdate',
          'planChanged'
        ];

        eventTypes.forEach(eventType => {
          try {
            window.triggerGlobalEvent(eventType, { ...eventData, eventType });
          } catch (eventError) {
}
        });
.toLocaleDateString()}`);

        return {
          success: true,
          message: eventData.message,
          plan: plan,
          expiryDate: subscriptionData.expiryDate,
          serverConfirmed: true
        };
      }

      return result;
    } catch (error) {
return {
        success: false,
        error: error.message
      };
    }
  };
}