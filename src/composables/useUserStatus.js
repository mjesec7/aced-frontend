// src/composables/useUserStatus.js - ENHANCED WITH COMPLETE REACTIVITY FIX
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { mapGetters } from 'vuex';

// ✅ ENHANCED GLOBAL EVENT TRIGGERING SYSTEM (ensure this works with your main.js)
const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {
    console.log(`🌍 Triggering global event: ${eventName}`, data);
    
    const enhancedData = {
      ...data,
      eventName,
      source: data.source || 'useUserStatus',
      timestamp: data.timestamp || Date.now()
    };

    // Method 1: Use global triggerGlobalEvent if available
    if (window.triggerGlobalEvent) {
      window.triggerGlobalEvent(eventName, enhancedData);
      return;
    }

    // Method 2: Direct DOM event
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);

    // Method 3: Event bus
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
    }

    console.log(`✅ Global event dispatched: ${eventName}`);

  } catch (error) {
    console.error(`❌ Failed to trigger global event '${eventName}':`, error);
  }
};

// ✅ EXPORTED ACTION: updateUserStatus for store import (ENHANCED)
export const updateUserStatusAction = async ({ commit, state, dispatch }, newStatus) => {
  const startTime = Date.now();
  
  try {
    console.log('🔄 ENHANCED updateUserStatus called with:', newStatus);
    
    // ✅ STEP 1: Validate input
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!validStatuses.includes(newStatus)) {
      console.error('❌ Invalid status provided:', newStatus);
      const errorResult = { success: false, error: 'Invalid status' };
      return errorResult;
    }
    
    const oldStatus = state.userStatus;
    
    // ✅ STEP 2: Skip if no change BUT still trigger events for consistency
    if (oldStatus === newStatus) {
      console.log('ℹ️ Status unchanged, but forcing global update');
      commit('FORCE_UPDATE');
      
      triggerGlobalEvent('userStatusChanged', {
        oldStatus,
        newStatus,
        source: 'updateUserStatus-nochange',
        timestamp: Date.now()
      });
      
      const noChangeResult = { success: true, message: 'Status unchanged', noChange: true };
      return noChangeResult;
    }
    
    console.log(`🔄 Updating user status: ${oldStatus} → ${newStatus}`);
    
    // ✅ STEP 3: Update store state immediately
    commit('SET_USER_STATUS', newStatus);
    
    // ✅ STEP 4: Update subscription details
    commit('UPDATE_SUBSCRIPTION', {
      plan: newStatus,
      status: newStatus !== 'free' ? 'active' : 'inactive',
      source: 'status-update',
      lastSync: new Date().toISOString()
    });
    
    // ✅ STEP 5: Update features immediately
    commit('UPDATE_FEATURES');
    
    // ✅ STEP 6: Force multiple reactivity triggers
    commit('FORCE_UPDATE');
    
    // ✅ STEP 7: Update localStorage immediately
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('statusUpdateTime', Date.now().toString());
      localStorage.setItem('lastStatusChange', JSON.stringify({
        oldStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        source: 'store-action'
      }));
      console.log('✅ localStorage updated successfully');
    } catch (storageError) {
      console.warn('⚠️ Failed to update localStorage:', storageError);
    }
    
    // ✅ STEP 8: Create comprehensive event data
    const eventData = {
      oldStatus,
      newStatus,
      timestamp: Date.now(),
      source: 'store-updateUserStatus',
      features: { ...state.features },
      subscription: { ...state.subscription },
      forceCounter: state.system?.forceUpdateCounter || 0,
      duration: Date.now() - startTime
    };
    
    // ✅ STEP 9: Trigger ALL possible global events immediately
    const eventTypes = [
      'userStatusChanged',
      'subscriptionUpdated', 
      'userSubscriptionChanged',
      'planChanged',
      'statusUpdated',
      'globalForceUpdate',
      'reactivityUpdate'
    ];
    
    eventTypes.forEach(eventType => {
      triggerGlobalEvent(eventType, { ...eventData, eventType });
    });
    
    // ✅ STEP 10: Additional DOM events for maximum compatibility
    try {
      // Primary DOM event
      const domEvent = new CustomEvent('userSubscriptionChanged', {
        detail: {
          plan: newStatus,
          source: 'store-action',
          oldPlan: oldStatus,
          timestamp: Date.now()
        },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(domEvent);
      
      console.log('✅ DOM events dispatched successfully');
    } catch (domError) {
      console.warn('⚠️ DOM event dispatch failed:', domError);
    }
    
    // ✅ STEP 11: Delayed updates for stubborn components (non-blocking)
    setTimeout(() => {
      commit('FORCE_UPDATE');
      triggerGlobalEvent('delayedForceUpdate', {
        ...eventData,
        reason: 'delayed-reactivity'
      });
    }, 100);
    
    setTimeout(() => {
      triggerGlobalEvent('finalForceUpdate', {
        ...eventData,
        reason: 'final-update'
      });
    }, 500);
    
    const duration = Date.now() - startTime;
    console.log(`✅ User status updated successfully: ${oldStatus} → ${newStatus} (${duration}ms)`);
    
    const successResult = {
      success: true,
      oldStatus,
      newStatus,
      duration,
      eventsTriggered: eventTypes.length,
      message: `Status updated from ${oldStatus} to ${newStatus}`,
      timestamp: Date.now()
    };
    
    return successResult;
    
  } catch (error) {
    console.error('❌ updateUserStatus failed:', error);
    
    try {
      commit('SET_ERROR', {
        message: 'Status update failed',
        context: 'updateUserStatus',
        originalError: error.message
      });
    } catch (commitError) {
      console.error('❌ Failed to commit error:', commitError);
    }
    
    const errorResult = {
      success: false,
      error: error.message || 'Unknown error occurred',
      duration: Date.now() - startTime,
      timestamp: Date.now()
    };
    
    return errorResult;
  }
};

// ✅ ENHANCED USER STATUS MIXIN FOR OPTIONS API COMPONENTS
export const userStatusMixin = {
  data() {
    return {
      // ✅ Enhanced reactivity tracking
      statusReactivityKey: 0,
      lastStatusUpdate: Date.now(),
      statusEventHandlers: {},
      statusSyncInterval: null,
      componentKey: 0,
      
      // ✅ NEW: Additional reactivity triggers
      reactivityKey: 0,
      lastSyncTime: Date.now(),
      eventCleanupFunctions: []
    };
  },
  
  computed: {
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser',
      'isStartUser',
      'isProUser', 
      'isFreeUser',
      'hasActiveSubscription',
      'subscriptionDetails',
      'forceUpdateCounter',
      'isUpdatingStatus'
    ]),
    
    // ✅ ENHANCED: Multiple reactive user status with comprehensive fallbacks
    reactiveUserStatus() {
      const storeStatus = this.userStatus;
      const localStatus = localStorage.getItem('userStatus');
      const forceCounter = this.forceUpdateCounter || 0;
      const componentKey = this.componentKey;
      const reactivityKey = this.reactivityKey;
      const lastUpdate = this.lastStatusUpdate;
      const syncTime = this.lastSyncTime;
      
      console.log(`📊 ${this.$options.name || 'Mixin'}: Computing reactive status:`, {
        store: storeStatus,
        local: localStatus,
        forceCounter,
        componentKey,
        reactivityKey,
        lastUpdate,
        syncTime
      });
      
      return storeStatus || localStatus || 'free';
    },
    
    // ✅ Enhanced reactive premium user check
    reactiveIsPremiumUser() {
      const status = this.reactiveUserStatus;
      const isPremium = ['premium', 'start', 'pro'].includes(status);
      return isPremium;
    },
    
    // ✅ Enhanced reactive user status label
    userStatusLabel() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.reactiveUserStatus;
      
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'premium': 'Start',
        'free': 'Free'
      };
      
      return labels[status] || 'Free';
    },
    
    // ✅ Enhanced reactive subscription class
    subscriptionClass() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.reactiveUserStatus;
      
      return status === 'pro' ? 'badge-pro'
        : (status === 'start' || status === 'premium') ? 'badge-start'
        : 'badge-free';
    },
    
    // ✅ Enhanced reactive subscription text
    subscriptionText() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.reactiveUserStatus;
      
      return status === 'pro' ? 'Pro подписка'
        : (status === 'start' || status === 'premium') ? 'Start подписка'
        : 'Бесплатный доступ';
    },
    
    // ✅ NEW: Reactive status badge class with additional triggers
    reactiveStatusBadgeClass() {
      const status = this.reactiveUserStatus;
      const counter = this.forceUpdateCounter || 0;
      
      return {
        'status-free': status === 'free',
        'status-start': status === 'start' || status === 'premium',
        'status-pro': status === 'pro',
        'plan-updated': this.lastStatusUpdate > Date.now() - 5000,
        'reactive-update': counter > 0
      };
    }
  },
  
  watch: {
    // ✅ Watch for user status changes from store
    userStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`📊 ${this.$options.name || 'Mixin'}: User status changed:`, oldStatus, '→', newStatus);
          this.handleUserStatusChange(newStatus, oldStatus);
        }
      },
      immediate: true
    },
    
    // ✅ Watch for force update counter changes
    forceUpdateCounter: {
      handler(newCounter, oldCounter) {
        if (newCounter !== oldCounter) {
          console.log(`📊 ${this.$options.name || 'Mixin'}: Force counter changed:`, oldCounter, '→', newCounter);
          this.triggerStatusReactivityUpdate();
        }
      },
      immediate: true
    },
    
    // ✅ NEW: Watch reactive user status for changes
    reactiveUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`📊 ${this.$options.name || 'Mixin'}: Reactive status changed:`, oldStatus, '→', newStatus);
          this.onUserStatusChanged(newStatus, oldStatus);
        }
      },
      immediate: true
    },
    
    // ✅ NEW: Watch store state directly
    '$store.getters["user/userStatus"]': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`📊 ${this.$options.name || 'Mixin'}: Store getter changed:`, oldStatus, '→', newStatus);
          this.triggerStatusReactivityUpdate();
          this.lastSyncTime = Date.now();
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    console.log(`🔧 ${this.$options.name || 'Mixin'}: Setting up enhanced user status mixin`);
    this.setupComprehensiveStatusEventListeners();
    this.setupPeriodicStatusSync();
    
    // Initial reactivity update
    this.triggerStatusReactivityUpdate();
  },
  
  beforeUnmount() {
    console.log(`🧹 ${this.$options.name || 'Mixin'}: Cleaning up enhanced user status mixin`);
    this.cleanupComprehensiveStatusEventListeners();
  },
  
  methods: {
    // ✅ Enhanced status update method
    async updateUserStatus(newStatus) {
      if (!newStatus || !['free', 'start', 'pro', 'premium'].includes(newStatus)) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Invalid status:`, newStatus);
        return false;
      }
      
      try {
        console.log(`🔄 ${this.$options.name || 'Mixin'}: Updating status to:`, newStatus);
        
        const result = await this.$store.dispatch('user/updateUserStatus', newStatus);
        
        if (result && result.success) {
          console.log(`✅ ${this.$options.name || 'Mixin'}: Status updated successfully`);
          this.triggerStatusReactivityUpdate();
          return true;
        } else {
          console.error(`❌ ${this.$options.name || 'Mixin'}: Status update failed:`, result?.error);
          return false;
        }
      } catch (error) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Status update error:`, error);
        return false;
      }
    },
    
    // ✅ ENHANCED: Comprehensive reactivity update
    triggerStatusReactivityUpdate() {
      try {
        this.statusReactivityKey++;
        this.componentKey++;
        this.reactivityKey++;
        this.lastStatusUpdate = Date.now();
        
        // Multiple Vue reactivity triggers
        this.$forceUpdate();
        
        this.$nextTick(() => {
          this.$forceUpdate();
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 50);
        });
        
        console.log(`🔄 ${this.$options.name || 'Mixin'}: Comprehensive reactivity updated:`, {
          statusKey: this.statusReactivityKey,
          componentKey: this.componentKey,
          reactivityKey: this.reactivityKey,
          status: this.reactiveUserStatus
        });
      } catch (error) {
        console.warn(`⚠️ ${this.$options.name || 'Mixin'}: Reactivity update failed:`, error);
      }
    },
    
    // ✅ NEW: Handle user status change
    handleUserStatusChange(newStatus, oldStatus) {
      console.log(`🔄 ${this.$options.name || 'Mixin'}: Handling status change:`, oldStatus, '→', newStatus);
      
      this.lastStatusUpdate = Date.now();
      this.triggerStatusReactivityUpdate();
      
      // Call custom handler if it exists
      if (this.onUserStatusChanged && typeof this.onUserStatusChanged === 'function') {
        this.onUserStatusChanged(newStatus, oldStatus);
      }
    },
    
    // ✅ NEW: Sync status with store
    syncStatusWithStore() {
      try {
        const storeStatus = this.$store?.getters?.['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus');
        const currentTime = Date.now();
        
        console.log(`🔄 ${this.$options.name || 'Mixin'}: Syncing status:`, {
          store: storeStatus,
          localStorage: localStatus,
          timeSinceLastSync: currentTime - this.lastSyncTime
        });
        
        if (storeStatus && storeStatus !== localStatus) {
          console.log(`⚠️ ${this.$options.name || 'Mixin'}: Status mismatch, syncing localStorage to store`);
          localStorage.setItem('userStatus', storeStatus);
          this.triggerStatusReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
        if (currentTime - this.lastSyncTime > 60000) {
          console.log(`🔄 ${this.$options.name || 'Mixin'}: Periodic reactivity refresh`);
          this.triggerStatusReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
      } catch (error) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Error syncing status:`, error);
      }
    },
    
    // ✅ NEW: Setup periodic status sync
    setupPeriodicStatusSync() {
      if (this.statusSyncInterval) {
        clearInterval(this.statusSyncInterval);
      }
      
      this.statusSyncInterval = setInterval(() => {
        this.syncStatusWithStore();
      }, 30000);
      
      console.log(`✅ ${this.$options.name || 'Mixin'}: Periodic status sync setup`);
    },
    
    // ✅ ENHANCED: Setup comprehensive event listeners
    setupComprehensiveStatusEventListeners() {
      console.log(`🔧 ${this.$options.name || 'Mixin'}: Setting up comprehensive status event listeners`);
      
      // Clear any existing listeners
      this.cleanupComprehensiveStatusEventListeners();
      
      // ✅ METHOD 1: DOM event listeners (most reliable)
      const handleStatusChange = (event) => {
        console.log(`📡 ${this.$options.name || 'Mixin'}: DOM event received:`, event.type, event.detail);
        
        if (event.detail) {
          this.handleUserStatusChange(event.detail.newStatus, event.detail.oldStatus);
        }
      };

      const domEvents = [
        'userStatusChanged',
        'userSubscriptionChanged',
        'subscriptionUpdated',
        'globalForceUpdate',
        'reactivityUpdate',
        'delayedStatusUpdate',
        'planChanged'
      ];

      domEvents.forEach(eventType => {
        window.addEventListener(eventType, handleStatusChange);
        this.eventCleanupFunctions.push(() => {
          window.removeEventListener(eventType, handleStatusChange);
        });
      });

      // ✅ METHOD 2: Event Bus listeners
      if (window.eventBus) {
        const eventBusHandler = (data) => {
          console.log(`📡 ${this.$options.name || 'Mixin'}: EventBus event received:`, data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        const eventBusEvents = [
          'userStatusChanged',
          'subscriptionUpdated',
          'promocodeApplied',
          'globalForceUpdate',
          'forceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          window.eventBus.on(eventType, eventBusHandler);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(eventType, eventBusHandler);
          });
        });
      }

      // ✅ METHOD 3: Store subscription
      if (this.$store && typeof this.$store.subscribe === 'function') {
        const storeUnsubscribe = this.$store.subscribe((mutation) => {
          const relevantMutations = [
            'user/SET_USER_STATUS',
            'user/setUserStatus',
            'user/UPDATE_SUBSCRIPTION',
            'user/FORCE_UPDATE',
            'user/ADD_PROMOCODE',
            'user/SET_USER'
          ];
          
          if (relevantMutations.includes(mutation.type)) {
            console.log(`📊 ${this.$options.name || 'Mixin'}: Store mutation:`, mutation.type);
            this.triggerStatusReactivityUpdate();
          }
        });
        
        this.eventCleanupFunctions.push(storeUnsubscribe);
      }

      // ✅ METHOD 4: localStorage change listener
      const storageChangeHandler = (event) => {
        if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
          console.log(`📡 ${this.$options.name || 'Mixin'}: localStorage changed:`, event.oldValue, '→', event.newValue);
          this.handleUserStatusChange(event.newValue, event.oldValue);
          this.syncStatusWithStore();
        }
      };
      
      window.addEventListener('storage', storageChangeHandler);
      this.eventCleanupFunctions.push(() => {
        window.removeEventListener('storage', storageChangeHandler);
      });
      
      console.log(`✅ ${this.$options.name || 'Mixin'}: Comprehensive event listeners setup complete`);
    },
    
    // ✅ ENHANCED: Cleanup comprehensive event listeners
    cleanupComprehensiveStatusEventListeners() {
      console.log(`🧹 ${this.$options.name || 'Mixin'}: Cleaning up comprehensive status event listeners`);
      
      // Clear periodic sync
      if (this.statusSyncInterval) {
        clearInterval(this.statusSyncInterval);
        this.statusSyncInterval = null;
      }
      
      // Clean up all event listeners
      this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn(`⚠️ ${this.$options.name || 'Mixin'}: Cleanup error:`, error);
        }
      });
      this.eventCleanupFunctions = [];
      
      // Clear event handlers object
      this.statusEventHandlers = {};
      
      console.log(`✅ ${this.$options.name || 'Mixin'}: Cleanup completed`);
    },
    
    // ✅ Helper methods for status checking
    hasFeatureAccess(feature) {
      try {
        return this.$store.getters['user/hasFeatureAccess'](feature);
      } catch (error) {
        console.warn(`⚠️ ${this.$options.name || 'Mixin'}: Error checking feature access:`, error);
        return false;
      }
    },
    
    requiresPremium() {
      return !this.reactiveIsPremiumUser;
    },
    
    requiresProPlan() {
      return !this.isProUser;
    },
    
    // ✅ Status formatting helpers
    getStatusBadgeClass() {
      return this.reactiveStatusBadgeClass;
    },
    
    getStatusIcon() {
      const status = this.reactiveUserStatus;
      const icons = {
        'free': '🆓',
        'start': '⭐',
        'premium': '⭐',
        'pro': '👑'
      };
      return icons[status] || '🆓';
    },
    
    // ✅ NEW: Emergency status sync for troubleshooting
    emergencyStatusSync() {
      console.log(`🚨 ${this.$options.name || 'Mixin'}: Emergency status sync triggered`);
      
      try {
        const currentStatus = this.$store?.getters?.['user/userStatus'] || 'free';
        triggerGlobalEvent('userStatusChanged', {
          oldStatus: null,
          newStatus: currentStatus,
          source: 'emergency-sync',
          component: this.$options.name,
          timestamp: Date.now()
        });
        
        this.triggerStatusReactivityUpdate();
        console.log(`✅ ${this.$options.name || 'Mixin'}: Emergency sync completed`);
      } catch (error) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Emergency sync failed:`, error);
      }
    }
  }
};

// ✅ ENHANCED USER STATUS COMPOSABLE FOR COMPOSITION API COMPONENTS
export function useUserStatus() {
  const store = useStore();
  
  // ✅ Reactive refs for forcing updates
  const forceUpdateKey = ref(0);
  const lastUpdateTime = ref(Date.now());
  const componentKey = ref(0);
  const reactivityKey = ref(0);
  const lastSyncTime = ref(Date.now());
  
  // ✅ Event handlers storage
  const eventHandlers = {};
  const eventCleanupFunctions = [];
  let statusSyncInterval = null;
  
  // ✅ ENHANCED: Computed properties with comprehensive reactivity
  const userStatus = computed(() => {
    const key = forceUpdateKey.value;
    const timestamp = lastUpdateTime.value;
    const compKey = componentKey.value;
    const reactKey = reactivityKey.value;
    const syncTime = lastSyncTime.value;
    
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const finalStatus = storeStatus || localStatus || 'free';
      
      console.log('🔍 useUserStatus: Computing enhanced status:', { 
        store: storeStatus,
        local: localStatus,
        final: finalStatus,
        triggers: { key, timestamp, compKey, reactKey, syncTime },
        storeCounter: store.getters['user/forceUpdateCounter'] 
      });
      
      return finalStatus;
    } catch (error) {
      console.warn('⚠️ useUserStatus: Error getting status:', error);
      return localStorage.getItem('userStatus') || 'free';
    }
  });
  
  const isPremiumUser = computed(() => {
    const status = userStatus.value;
    return ['start', 'pro', 'premium'].includes(status);
  });
  
  const isStartUser = computed(() => {
    const status = userStatus.value;
    return ['start', 'premium'].includes(status);
  });
  
  const isProUser = computed(() => {
    return userStatus.value === 'pro';
  });
  
  const isFreeUser = computed(() => {
    return userStatus.value === 'free';
  });
  
  const userStatusLabel = computed(() => {
    const status = userStatus.value;
    const labels = {
      'pro': 'Pro',
      'start': 'Start',
      'premium': 'Start',
      'free': 'Free'
    };
    return labels[status] || 'Free';
  });
  
  const subscriptionClass = computed(() => {
    const status = userStatus.value;
    return status === 'pro' ? 'badge-pro'
      : (status === 'start' || status === 'premium') ? 'badge-start'
      : 'badge-free';
  });
  
  const subscriptionText = computed(() => {
    const status = userStatus.value;
    return status === 'pro' ? 'Pro подписка'
      : (status === 'start' || status === 'premium') ? 'Start подписка'
      : 'Бесплатный доступ';
  });
  
  const isUpdatingStatus = computed(() => {
    try {
      return store.getters['user/isUpdatingStatus'] || false;
    } catch (error) {
      console.warn('⚠️ useUserStatus: Error getting updating status:', error);
      return false;
    }
  });
  
  // ✅ ENHANCED: Comprehensive reactivity update function
  const triggerReactivityUpdate = () => {
    try {
      forceUpdateKey.value++;
      componentKey.value++;
      reactivityKey.value++;
      lastUpdateTime.value = Date.now();
      
      console.log('🔄 useUserStatus: Comprehensive reactivity update:', {
        forceKey: forceUpdateKey.value,
        componentKey: componentKey.value,
        reactivityKey: reactivityKey.value,
        timestamp: lastUpdateTime.value,
        currentStatus: userStatus.value
      });
    } catch (error) {
      console.warn('⚠️ useUserStatus: Reactivity update failed:', error);
    }
  };
  
  // ✅ NEW: Handle user status change
  const handleUserStatusChange = (newStatus, oldStatus) => {
    console.log('🔄 useUserStatus: Handling status change:', oldStatus, '→', newStatus);
    
    lastUpdateTime.value = Date.now();
    triggerReactivityUpdate();
  };
  
  // ✅ NEW: Sync status with store
  const syncStatusWithStore = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const currentTime = Date.now();
      
      console.log('🔄 useUserStatus: Syncing status:', {
        store: storeStatus,
        localStorage: localStatus,
        timeSinceLastSync: currentTime - lastSyncTime.value
      });
      
      if (storeStatus && storeStatus !== localStatus) {
        console.log('⚠️ useUserStatus: Status mismatch, syncing localStorage to store');
        localStorage.setItem('userStatus', storeStatus);
        triggerReactivityUpdate();
        lastSyncTime.value = currentTime;
      }
      
      if (currentTime - lastSyncTime.value > 60000) {
        console.log('🔄 useUserStatus: Periodic reactivity refresh');
        triggerReactivityUpdate();
        lastSyncTime.value = currentTime;
      }
      
    } catch (error) {
      console.error('❌ useUserStatus: Error syncing status:', error);
    }
  };
  
  // ✅ Status update method - calls the store action
  const updateStatus = async (newStatus) => {
    if (!newStatus || !['free', 'start', 'pro', 'premium'].includes(newStatus)) {
      console.error('❌ useUserStatus: Invalid status:', newStatus);
      return false;
    }
    
    try {
      console.log('🔄 useUserStatus: Updating status to:', newStatus);
      
      const result = await store.dispatch('user/updateUserStatus', newStatus);
      
      if (result && result.success) {
        console.log('✅ useUserStatus: Status updated successfully');
        triggerReactivityUpdate();
        return true;
      } else {
        console.error('❌ useUserStatus: Status update failed:', result?.error);
        return false;
      }
    } catch (error) {
      console.error('❌ useUserStatus: Status update error:', error);
      return false;
    }
  };
  
  // ✅ ENHANCED: Setup comprehensive event listeners
  const setupEventListeners = () => {
    console.log('🔧 useUserStatus: Setting up comprehensive event listeners');
    
    // Clear any existing listeners
    cleanupEventListeners();
    
    // ✅ METHOD 1: DOM event listeners (most reliable)
    const handleStatusChange = (event) => {
      console.log('📡 useUserStatus: DOM event received:', event.type, event.detail);
      
      if (event.detail) {
        handleUserStatusChange(event.detail.newStatus, event.detail.oldStatus);
      }
    };

    const domEvents = [
      'userStatusChanged',
      'userSubscriptionChanged',
      'subscriptionUpdated',
      'globalForceUpdate',
      'reactivityUpdate',
      'delayedStatusUpdate',
      'planChanged'
    ];

    domEvents.forEach(eventType => {
      window.addEventListener(eventType, handleStatusChange);
      eventCleanupFunctions.push(() => {
        window.removeEventListener(eventType, handleStatusChange);
      });
    });

    // ✅ METHOD 2: Event Bus listeners
    if (window.eventBus) {
      const eventBusHandler = (data) => {
        console.log('📡 useUserStatus: EventBus event received:', data);
        handleUserStatusChange(data.newStatus, data.oldStatus);
      };

      const eventBusEvents = [
        'userStatusChanged',
        'subscriptionUpdated',
        'promocodeApplied',
        'globalForceUpdate',
        'forceUpdate'
      ];

      eventBusEvents.forEach(eventType => {
        window.eventBus.on(eventType, eventBusHandler);
        eventCleanupFunctions.push(() => {
          window.eventBus.off(eventType, eventBusHandler);
        });
      });
    }

    // ✅ METHOD 3: Store subscription
    if (store && typeof store.subscribe === 'function') {
      const storeUnsubscribe = store.subscribe((mutation) => {
        const relevantMutations = [
          'user/SET_USER_STATUS',
          'user/setUserStatus',
          'user/UPDATE_SUBSCRIPTION',
          'user/FORCE_UPDATE',
          'user/ADD_PROMOCODE',
          'user/SET_USER'
        ];
        
        if (relevantMutations.includes(mutation.type)) {
          console.log('📊 useUserStatus: Store mutation:', mutation.type);
          triggerReactivityUpdate();
        }
      });
      
      eventCleanupFunctions.push(storeUnsubscribe);
    }
    
    // ✅ METHOD 4: localStorage change listener for cross-tab sync
    const storageChangeHandler = (event) => {
      if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
        console.log('📡 useUserStatus: localStorage changed:', event.oldValue, '→', event.newValue);
        handleUserStatusChange(event.newValue, event.oldValue);
        syncStatusWithStore();
      }
    };
    
    window.addEventListener('storage', storageChangeHandler);
    eventCleanupFunctions.push(() => {
      window.removeEventListener('storage', storageChangeHandler);
    });
    
    console.log('✅ useUserStatus: Comprehensive event listeners setup complete');
  };
  
  // ✅ Setup periodic status sync
  const setupPeriodicSync = () => {
    if (statusSyncInterval) {
      clearInterval(statusSyncInterval);
    }
    
    statusSyncInterval = setInterval(() => {
      syncStatusWithStore();
    }, 30000);
    
    console.log('✅ useUserStatus: Periodic status sync setup');
  };
  
  // ✅ ENHANCED: Cleanup event listeners
  const cleanupEventListeners = () => {
    console.log('🧹 useUserStatus: Cleaning up comprehensive event listeners');
    
    // Clear periodic sync
    if (statusSyncInterval) {
      clearInterval(statusSyncInterval);
      statusSyncInterval = null;
    }
    
    // Clean up all event listeners
    eventCleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('⚠️ useUserStatus: Cleanup error:', error);
      }
    });
    eventCleanupFunctions.length = 0;
    
    console.log('✅ useUserStatus: Cleanup completed');
  };
  
  // ✅ Watch for store changes
  watch(
    () => store.getters['user/userStatus'],
    (newStatus, oldStatus) => {
      if (newStatus !== oldStatus) {
        console.log('👀 useUserStatus: Store status watcher triggered:', oldStatus, '→', newStatus);
        handleUserStatusChange(newStatus, oldStatus);
      }
    },
    { immediate: true }
  );
  
  watch(
    () => store.getters['user/forceUpdateCounter'],
    (newCounter, oldCounter) => {
      if (newCounter !== oldCounter) {
        console.log('👀 useUserStatus: Force counter watcher triggered:', oldCounter, '→', newCounter);
        triggerReactivityUpdate();
      }
    },
    { immediate: true }
  );
  
  // ✅ Lifecycle hooks
  onMounted(() => {
    console.log('🔧 useUserStatus: Enhanced composable mounted');
    setupEventListeners();
    setupPeriodicSync();
    
    // Initial reactivity trigger
    triggerReactivityUpdate();
    
    // Initial status sync
    syncStatusWithStore();
  });
  
  onUnmounted(() => {
    console.log('🧹 useUserStatus: Enhanced composable unmounting');
    cleanupEventListeners();
  });
  
  // ✅ Helper methods
  const hasFeatureAccess = (feature) => {
    try {
      return store.getters['user/hasFeatureAccess'](feature);
    } catch (error) {
      console.warn('⚠️ useUserStatus: Error checking feature access:', error);
      return false;
    }
  };
  
  const requiresPremium = () => {
    return !isPremiumUser.value;
  };
  
  const requiresProPlan = () => {
    return !isProUser.value;
  };
  
  const getStatusIcon = () => {
    const status = userStatus.value;
    const icons = {
      'free': '🆓',
      'start': '⭐',
      'premium': '⭐',
      'pro': '👑'
    };
    return icons[status] || '🆓';
  };
  
  const getStatusBadgeClass = () => {
    const status = userStatus.value;
    const counter = store.getters['user/forceUpdateCounter'] || 0;
    
    return {
      'status-free': status === 'free',
      'status-start': status === 'start' || status === 'premium',
      'status-pro': status === 'pro',
      'plan-updated': lastUpdateTime.value > Date.now() - 5000,
      'reactive-update': counter > 0
    };
  };
  
  // ✅ Emergency status sync for troubleshooting
  const emergencyStatusSync = () => {
    console.log('🚨 useUserStatus: Emergency status sync triggered');
    
    try {
      const currentStatus = store.getters['user/userStatus'] || 'free';
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'emergency-sync-composable',
        timestamp: Date.now()
      });
      
      triggerReactivityUpdate();
      console.log('✅ useUserStatus: Emergency sync completed');
    } catch (error) {
      console.error('❌ useUserStatus: Emergency sync failed:', error);
    }
  };
  
  // ✅ Return reactive properties and methods
  return {
    // Reactive status properties
    userStatus,
    isPremiumUser,
    isStartUser,
    isProUser,
    isFreeUser,
    userStatusLabel,
    subscriptionClass,
    subscriptionText,
    isUpdatingStatus,
    
    // Methods
    updateStatus,
    triggerReactivityUpdate,
    syncStatusWithStore,
    hasFeatureAccess,
    requiresPremium,
    requiresProPlan,
    getStatusIcon,
    getStatusBadgeClass,
    emergencyStatusSync,
    
    // Internal reactive refs (for advanced usage)
    forceUpdateKey,
    lastUpdateTime,
    componentKey,
    reactivityKey,
    lastSyncTime
  };
}

// ✅ EXPORT HELPER FUNCTIONS FOR QUICK COMPONENT INTEGRATION

// Quick setup function for any component that needs user status reactivity
export function setupUserStatusReactivity(component) {
  if (!component) {
    console.error('❌ setupUserStatusReactivity: No component provided');
    return;
  }
  
  console.log(`🔧 Setting up user status reactivity for component: ${component.$options?.name || 'Unknown'}`);
  
  // Add reactive data properties
  if (!component.statusReactivityKey) component.statusReactivityKey = 0;
  if (!component.lastStatusUpdate) component.lastStatusUpdate = Date.now();
  
  // Add trigger method
  component.triggerStatusReactivityUpdate = function() {
    this.statusReactivityKey++;
    this.lastStatusUpdate = Date.now();
    this.$forceUpdate();
    console.log(`🔄 ${this.$options.name || 'Component'}: Manual reactivity trigger`);
  };
  
  // Setup basic event listener
  const handleStatusChange = (event) => {
    if (event.detail) {
      component.triggerStatusReactivityUpdate();
    }
  };
  
  window.addEventListener('userStatusChanged', handleStatusChange);
  window.addEventListener('userSubscriptionChanged', handleStatusChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('userStatusChanged', handleStatusChange);
    window.removeEventListener('userSubscriptionChanged', handleStatusChange);
    console.log(`🧹 User status reactivity cleaned up for: ${component.$options?.name || 'Unknown'}`);
  };
}

// Quick mixin for basic user status reactivity (lightweight version)
export const basicUserStatusMixin = {
  data() {
    return {
      statusReactivityKey: 0,
      lastStatusUpdate: Date.now()
    };
  },
  
  computed: {
    reactiveUserStatus() {
      const key = this.statusReactivityKey;
      const timestamp = this.lastStatusUpdate;
      return this.$store?.getters?.['user/userStatus'] || localStorage.getItem('userStatus') || 'free';
    },
    
    reactiveIsPremiumUser() {
      return ['start', 'pro', 'premium'].includes(this.reactiveUserStatus);
    }
  },
  
  mounted() {
    const cleanup = setupUserStatusReactivity(this);
    this._statusReactivityCleanup = cleanup;
  },
  
  beforeUnmount() {
    if (this._statusReactivityCleanup) {
      this._statusReactivityCleanup();
    }
  },
  
  methods: {
    triggerStatusReactivityUpdate() {
      this.statusReactivityKey++;
      this.lastStatusUpdate = Date.now();
      this.$forceUpdate();
    }
  }
};

// ✅ DEBUG HELPERS FOR DEVELOPMENT
export const userStatusDebugHelpers = {
  getCurrentStatus: (store) => {
    const storeStatus = store?.getters?.['user/userStatus'];
    const localStatus = localStorage.getItem('userStatus');
    const isPremium = store?.getters?.['user/isPremiumUser'];
    
    console.log('📊 User Status Debug:', {
      store: storeStatus,
      localStorage: localStatus,
      isPremium: isPremium,
      features: store?.getters?.['user/features'],
      forceCounter: store?.getters?.['user/forceUpdateCounter']
    });
    
    return { storeStatus, localStatus, isPremium };
  },
  
  triggerTestEvents: (status = 'start') => {
    console.log('🔧 Debug: Triggering test events for:', status);
    triggerGlobalEvent('userStatusChanged', {
      oldStatus: 'free',
      newStatus: status,
      source: 'debug-trigger',
      timestamp: Date.now()
    });
  },
  
  forceGlobalUpdate: () => {
    console.log('🔧 Debug: Forcing global update');
    triggerGlobalEvent('globalForceUpdate', {
      reason: 'debug-force',
      timestamp: Date.now()
    });
  }
};

console.log('✅ Enhanced useUserStatus composable loaded with complete reactivity fix!');
console.log('📚 Available exports:', {
  updateUserStatusAction: 'Store action for updateUserStatus',
  userStatusMixin: 'Complete mixin with full reactivity',
  useUserStatus: 'Enhanced composable for Composition API',
  setupUserStatusReactivity: 'Quick setup helper function',
  basicUserStatusMixin: 'Lightweight mixin for basic needs',
  userStatusDebugHelpers: 'Debug utilities for development'
});