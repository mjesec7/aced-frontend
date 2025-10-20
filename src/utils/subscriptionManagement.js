// src/utils/subscriptionManagement.js - Enhanced Global Subscription Management

import { getApp } from './appMounter.js';

export function setupEnhancedGlobalSubscriptionManagement(store, eventBus) {
  console.log('✅ Setting up enhanced global subscription management');

  const handleGlobalSubscriptionChange = (event) => {
    const { plan, newStatus, userStatus, subscriptionPlan, message, source, oldPlan, timestamp } = event.detail || {};
    
    let actualPlan = plan || newStatus || userStatus || subscriptionPlan;

    // Parse plan from success messages if plan is empty
    if ((!actualPlan || actualPlan === '' || actualPlan === 'undefined') && message) {
      if (message.includes('START') || message.includes('start')) {
        actualPlan = 'start';
      } else if (message.includes('PRO') || message.includes('pro')) {
        actualPlan = 'pro';
      } else if (message.includes('FREE') || message.includes('free')) {
        actualPlan = 'free';
      }
    }

    // Check localStorage if plan is still empty from promocode source
    if (source === 'promocode' && (!actualPlan || actualPlan === '')) {
      const localStatus = localStorage.getItem('userStatus');
      const localPlan = localStorage.getItem('userPlan');
      const localSubscription = localStorage.getItem('subscriptionPlan');

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

    // Validate the plan
    if (!['free', 'start', 'pro', 'premium'].includes(actualPlan)) {
      actualPlan = 'free';
    }

    console.log(`🔄 Global subscription change: ${actualPlan} (${source || 'unknown'})`);

    // Update page title
    const planLabel = actualPlan === 'pro' ? 'Pro' : actualPlan === 'start' ? 'Start' : 'Free';
    if (document.title && !document.title.includes('|')) {
      document.title = `ACED | ${planLabel}`;
    }

    // Update body classes
    document.body.className = document.body.className.replace(/user-plan-\w+/g, '');
    document.body.classList.add(`user-plan-${actualPlan}`);

    // Update localStorage
    localStorage.setItem('userStatus', actualPlan);
    localStorage.setItem('userPlan', actualPlan);
    localStorage.setItem('subscriptionPlan', actualPlan);
    localStorage.setItem('statusUpdateTime', Date.now().toString());

    // Update store if not already updated
    try {
      const currentStoreStatus = store.getters['user/userStatus'];

      if (currentStoreStatus !== actualPlan) {
        store.commit('user/SET_USER_STATUS', actualPlan);

        try {
          store.commit('user/setUserStatus', actualPlan);
        } catch (e) {
          // Ignore if mutation doesn't exist
        }

        if (store.state.user) {
          store.state.user.userStatus = actualPlan;
          store.state.user.subscriptionPlan = actualPlan;
          store.state.user.plan = actualPlan;
        }
      }
    } catch (storeError) {
      console.error('❌ Store update error:', storeError);
    }

    // Force Vue app update
    const app = getApp();
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
      } catch (error) {
        console.error('❌ Force update error:', error);
      }
    }

    // Emit multiple event types
    const eventData = {
      reason: 'subscription-change',
      plan: actualPlan,
      newStatus: actualPlan,
      userStatus: actualPlan,
      subscriptionPlan: actualPlan,
      source: source || 'global-change',
      oldPlan: oldPlan || 'free',
      timestamp: timestamp || Date.now(),
      message: message
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
    const { newStatus, plan, userStatus, subscriptionPlan } = data || {};
    let actualStatus = newStatus || plan || userStatus || subscriptionPlan || 'free';

    if (!['free', 'start', 'pro', 'premium'].includes(actualStatus)) {
      actualStatus = 'free';
    }

    console.log(`📊 User status changed event: ${actualStatus}`);

    try {
      localStorage.setItem('userStatus', actualStatus);
      localStorage.setItem('userPlan', actualStatus);
      localStorage.setItem('subscriptionPlan', actualStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
    } catch (storageError) {
      console.error('❌ Storage error:', storageError);
    }

    try {
      const currentStoreStatus = store.getters['user/userStatus'];
      if (currentStoreStatus !== actualStatus) {
        store.commit('user/SET_USER_STATUS', actualStatus);

        try {
          store.commit('user/setUserStatus', actualStatus);
        } catch (e) {
          // Ignore if mutation doesn't exist
        }
      }
    } catch (storeError) {
      console.error('❌ Store error:', storeError);
    }

    const app = getApp();
    if (app?._instance) {
      try {
        app._instance.proxy.$forceUpdate();
        app._instance.proxy.$nextTick(() => {
          // Trigger next tick for delayed components
        });
      } catch (error) {
        console.error('❌ Force update error:', error);
      }
    }
  });

  eventBus.on('promocodeApplied', (data) => {
    console.log('🎫 Promocode applied event received', data);

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
    console.log('💳 Payment completed event received', data);

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

  console.log('✅ Enhanced global subscription management configured');
}