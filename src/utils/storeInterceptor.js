// src/utils/storeInterceptor.js - Store Mutation Interceptor

export function setupStoreInterceptor(store) {
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
}