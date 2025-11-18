// src/utils/eventBus.js - Advanced Event System

// ============================================================================
// 🔔 ADVANCED EVENT BUS CLASS
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
  
      // Emit to regular event listeners
      if (this.events[event]) {
        this.events[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            this.handleEventError(event, error, data);
          }
        });
      }
  
      // Notify status change listeners
      if (event.includes('status') || event.includes('Status') || event.includes('subscription')) {
        this.notifyStatusChangeListeners(event, data);
        this.notifySubscriptionListeners(event, data);
      }
  
      // Notify subscription listeners for specific events
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
      // Return cleanup function
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
      // Return cleanup function
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
      // Return cleanup function
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
  // 🌐 CREATE AND EXPORT GLOBAL EVENT BUS
  // ============================================================================
  export const eventBus = new AdvancedEventBus();
  
  // ============================================================================
  // 🔥 GLOBAL EVENT TRIGGERING SYSTEM
  // ============================================================================
  window.triggerGlobalEvent = (eventName, data = {}) => {
    if (typeof window === 'undefined') return;
  
    try {
      const { newStatus, plan, userStatus, subscriptionPlan, oldStatus } = data;
  
      // ✅ CRITICAL: Validate status values and filter out empty strings
      const validStatus = (status) => {
        return status &&
          status !== '' &&
          status !== 'undefined' &&
          status !== undefined &&
          status !== null &&
          ['free', 'start', 'pro', 'premium'].includes(status);
      };
  
      // Find the first valid status from possible fields
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
      
      // 1. DOM CustomEvent
      const customEvent = new CustomEvent(eventName, {
        detail: enhancedData,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(customEvent);
  
      // 2. EventBus emit
      if (window.eventBus?.emit) {
        window.eventBus.emit(eventName, enhancedData);
      }
  
      // 3. Cross-tab communication for important events
      if (eventName.includes('Status') || eventName.includes('Subscription')) {
        try {
          const storageEvent = new CustomEvent('userSubscriptionChanged', {
            detail: enhancedData,
            bubbles: true
          });
          window.dispatchEvent(storageEvent);
  
          // Store last event for cross-tab sync
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
  // 🌐 SETUP GLOBAL EVENT SYSTEM
  // ============================================================================
  export function setupGlobalEventSystem(store) {
// Periodic status consistency check (every 30 seconds)
    setInterval(() => {
      try {
        const storeStatus = store.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus');
  
        if (storeStatus && localStatus && storeStatus !== localStatus) {
// Sync localStorage to match store
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
    }, 30000); // 30 seconds
}