// src/composables/useUserStatus.js
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { mapGetters } from 'vuex';

// ✅ USER STATUS MIXIN FOR OPTIONS API COMPONENTS
export const userStatusMixin = {
  data() {
    return {
      // ✅ Enhanced reactivity tracking
      statusReactivityKey: 0,
      lastStatusUpdate: Date.now(),
      statusEventHandlers: {}
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
    
    // ✅ Enhanced reactive user status label
    userStatusLabel() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.userStatus || 'free';
      
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'free': 'Free'
      };
      
      return labels[status] || 'Free';
    },
    
    // ✅ Enhanced reactive subscription class
    subscriptionClass() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.userStatus || 'free';
      
      return status === 'pro' ? 'badge-pro'
        : status === 'start' ? 'badge-start'
        : 'badge-free';
    },
    
    // ✅ Enhanced reactive subscription text
    subscriptionText() {
      const counter = this.forceUpdateCounter || 0;
      const key = this.statusReactivityKey;
      const status = this.userStatus || 'free';
      
      return status === 'pro' ? 'Pro подписка'
        : status === 'start' ? 'Start подписка'
        : 'Бесплатный доступ';
    }
  },
  
  watch: {
    // ✅ Watch for user status changes
    userStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`📊 ${this.$options.name || 'Mixin'}: User status changed:`, oldStatus, '→', newStatus);
          this.triggerStatusReactivityUpdate();
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
    }
  },
  
  mounted() {
    console.log(`🔧 ${this.$options.name || 'Mixin'}: Setting up user status mixin`);
    this.setupStatusEventListeners();
    
    // Initial reactivity update
    this.triggerStatusReactivityUpdate();
  },
  
  beforeUnmount() {
    console.log(`🧹 ${this.$options.name || 'Mixin'}: Cleaning up user status mixin`);
    this.cleanupStatusEventListeners();
  },
  
  methods: {
    // ✅ Enhanced status update method
    // ✅ ENHANCED: updateUserStatus action for IMMEDIATE global propagation
// Add this to your actions object in user.js, replacing any existing updateUserStatus

async updateUserStatus({ commit, state, dispatch }, newStatus) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 updateUserStatus called with:', newStatus);
      
      // ✅ STEP 1: Validate input
      const validStatuses = ['free', 'start', 'pro', 'premium'];
      if (!validStatuses.includes(newStatus)) {
        console.error('❌ Invalid status provided:', newStatus);
        return { success: false, error: 'Invalid status' };
      }
      
      const oldStatus = state.userStatus;
      
      // ✅ STEP 2: Skip if no change
      if (oldStatus === newStatus) {
        console.log('ℹ️ Status unchanged, but forcing global update');
        commit('FORCE_UPDATE');
        triggerGlobalEvent('userStatusChanged', {
          oldStatus,
          newStatus,
          source: 'updateUserStatus-nochange',
          timestamp: Date.now()
        });
        return { success: true, message: 'Status unchanged', noChange: true };
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
        forceCounter: state.system.forceUpdateCounter,
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
        
        // Secondary DOM event
        const statusEvent = new CustomEvent('userStatusUpdate', {
          detail: eventData,
          bubbles: true
        });
        window.dispatchEvent(statusEvent);
        
        console.log('✅ DOM events dispatched successfully');
      } catch (domError) {
        console.warn('⚠️ DOM event dispatch failed:', domError);
      }
      
      // ✅ STEP 11: Additional Vue reactivity triggers
      setTimeout(() => {
        commit('FORCE_UPDATE');
        triggerGlobalEvent('delayedForceUpdate', {
          ...eventData,
          reason: 'delayed-reactivity',
          delayedTimestamp: Date.now()
        });
      }, 100);
      
      // ✅ STEP 12: Final delayed update for stubborn components
      setTimeout(() => {
        triggerGlobalEvent('finalForceUpdate', {
          ...eventData,
          reason: 'final-update',
          finalTimestamp: Date.now()
        });
      }, 500);
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ User status updated successfully: ${oldStatus} → ${newStatus} (${duration}ms)`);
      console.log('📊 Event data:', eventData);
      
      return {
        success: true,
        oldStatus,
        newStatus,
        duration,
        eventsTriggered: eventTypes.length,
        message: `Status updated from ${oldStatus} to ${newStatus}`
      };
      
    } catch (error) {
      console.error('❌ updateUserStatus failed:', error);
      
      commit('SET_ERROR', {
        message: 'Status update failed',
        context: 'updateUserStatus',
        originalError: error.message
      });
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },
    
    // ✅ Cleanup event listeners
    cleanupStatusEventListeners() {
      console.log(`🧹 ${this.$options.name || 'Mixin'}: Cleaning up status event listeners`);
      
      // Remove event bus listeners
      if (typeof window !== 'undefined' && window.eventBus) {
        Object.values(this.statusEventHandlers).forEach(handler => {
          if (typeof handler === 'function') {
            window.eventBus.off('userStatusChanged', handler);
            window.eventBus.off('promocodeApplied', handler);
            window.eventBus.off('subscriptionUpdated', handler);
            window.eventBus.off('forceUpdate', handler);
            window.eventBus.off('globalForceUpdate', handler);
          }
        });
      }
      
      // Remove DOM event listeners
      if (typeof window !== 'undefined') {
        if (this.statusEventHandlers.domSubscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.statusEventHandlers.domSubscriptionChange);
        }
        
        if (this.statusEventHandlers.storageChange) {
          window.removeEventListener('storage', this.statusEventHandlers.storageChange);
        }
      }
      
      // Remove store subscription
      if (this.statusEventHandlers.storeUnsubscribe && typeof this.statusEventHandlers.storeUnsubscribe === 'function') {
        this.statusEventHandlers.storeUnsubscribe();
      }
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
      return !this.isPremiumUser;
    },
    
    requiresProPlan() {
      return !this.isProUser;
    },
    
    // ✅ Status formatting helpers
    getStatusBadgeClass() {
      const status = this.userStatus || 'free';
      return {
        'status-free': status === 'free',
        'status-start': status === 'start',
        'status-pro': status === 'pro',
        'status-updated': this.lastStatusUpdate > Date.now() - 5000
      };
    },
    
    getStatusIcon() {
      const status = this.userStatus || 'free';
      const icons = {
        'free': '🆓',
        'start': '⭐',
        'pro': '👑'
      };
      return icons[status] || '🆓';
    }
  }
};

// ✅ USER STATUS COMPOSABLE FOR COMPOSITION API COMPONENTS
export function useUserStatus() {
  const store = useStore();
  
  // ✅ Reactive refs for forcing updates
  const forceUpdateKey = ref(0);
  const lastUpdateTime = ref(Date.now());
  
  // ✅ Event handlers storage
  const eventHandlers = {};
  
  // ✅ Computed properties with enhanced reactivity
  const userStatus = computed(() => {
    // Force reactivity with multiple triggers
    const key = forceUpdateKey.value;
    const timestamp = lastUpdateTime.value;
    
    try {
      const status = store.getters['user/userStatus'] || 'free';
      console.log('🔍 useUserStatus: Computing status:', { 
        status, 
        key, 
        timestamp,
        storeCounter: store.getters['user/forceUpdateCounter'] 
      });
      return status;
    } catch (error) {
      console.warn('⚠️ useUserStatus: Error getting status:', error);
      return 'free';
    }
  });
  
  const isPremiumUser = computed(() => {
    const status = userStatus.value;
    return ['start', 'pro'].includes(status);
  });
  
  const isStartUser = computed(() => {
    return userStatus.value === 'start';
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
      'free': 'Free'
    };
    return labels[status] || 'Free';
  });
  
  const isUpdatingStatus = computed(() => {
    try {
      return store.getters['user/isUpdatingStatus'] || false;
    } catch (error) {
      console.warn('⚠️ useUserStatus: Error getting updating status:', error);
      return false;
    }
  });
  
  // ✅ Enhanced reactivity update function
  const triggerReactivityUpdate = () => {
    forceUpdateKey.value++;
    lastUpdateTime.value = Date.now();
    
    console.log('🔄 useUserStatus: Reactivity update triggered:', {
      key: forceUpdateKey.value,
      timestamp: lastUpdateTime.value,
      currentStatus: userStatus.value
    });
  };
  
  // ✅ Status update method with comprehensive error handling
  const updateStatus = async (newStatus) => {
    if (!newStatus || !['free', 'start', 'pro'].includes(newStatus)) {
      console.error('❌ useUserStatus: Invalid status:', newStatus);
      return false;
    }
    
    try {
      console.log('🔄 useUserStatus: Updating status to:', newStatus);
      
      const result = await this.$store.dispatch('user/updateSubscription', { plan: newStatus });
      
      if (result) {
        console.log('✅ useUserStatus: Status updated successfully');
        triggerReactivityUpdate();
        return true;
      } else {
        console.error('❌ useUserStatus: Status update failed');
        return false;
      }
    } catch (error) {
      console.error('❌ useUserStatus: Status update error:', error);
      return false;
    }
  };
  
  // ✅ Setup comprehensive event listeners
  const setupEventListeners = () => {
    console.log('🔧 useUserStatus: Setting up event listeners');
    
    // Event bus listeners
    if (typeof window !== 'undefined' && window.eventBus) {
      eventHandlers.userStatusChanged = (data) => {
        console.log('📡 useUserStatus: Status change event:', data);
        triggerReactivityUpdate();
      };
      
      eventHandlers.promocodeApplied = (data) => {
        console.log('📡 useUserStatus: Promocode applied event:', data);
        triggerReactivityUpdate();
      };
      
      eventHandlers.subscriptionUpdated = (data) => {
        console.log('📡 useUserStatus: Subscription updated event:', data);
        triggerReactivityUpdate();
      };
      
      eventHandlers.forceUpdate = (data) => {
        console.log('📡 useUserStatus: Force update event:', data);
        triggerReactivityUpdate();
      };
      
      // Register all event listeners
      window.eventBus.on('userStatusChanged', eventHandlers.userStatusChanged);
      window.eventBus.on('promocodeApplied', eventHandlers.promocodeApplied);
      window.eventBus.on('subscriptionUpdated', eventHandlers.subscriptionUpdated);
      window.eventBus.on('forceUpdate', eventHandlers.forceUpdate);
      window.eventBus.on('globalForceUpdate', eventHandlers.forceUpdate);
      
      console.log('✅ useUserStatus: Event bus listeners registered');
    }
    
    // DOM event listener for cross-component updates
    eventHandlers.domSubscriptionChange = (event) => {
      console.log('📡 useUserStatus: DOM subscription event:', event.detail);
      triggerReactivityUpdate();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('userSubscriptionChanged', eventHandlers.domSubscriptionChange);
    }
    
    // Store subscription listener
    if (store && typeof store.subscribe === 'function') {
      eventHandlers.storeUnsubscribe = store.subscribe((mutation) => {
        const relevantMutations = [
          'user/SET_USER_STATUS',
          'user/setUserStatus',
          'user/UPDATE_SUBSCRIPTION',
          'user/FORCE_UPDATE',
          'user/ADD_PROMOCODE'
        ];
        
        if (relevantMutations.includes(mutation.type)) {
          console.log('📊 useUserStatus: Store mutation:', mutation.type, mutation.payload);
          triggerReactivityUpdate();
        }
      });
    }
    
    // localStorage change listener for cross-tab sync
    eventHandlers.storageChange = (event) => {
      if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
        console.log('📡 useUserStatus: localStorage changed:', event.oldValue, '→', event.newValue);
        triggerReactivityUpdate();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', eventHandlers.storageChange);
    }
  };
  
  // ✅ Cleanup event listeners
  const cleanupEventListeners = () => {
    console.log('🧹 useUserStatus: Cleaning up event listeners');
    
    // Remove event bus listeners
    if (typeof window !== 'undefined' && window.eventBus) {
      Object.values(eventHandlers).forEach(handler => {
        if (typeof handler === 'function') {
          window.eventBus.off('userStatusChanged', handler);
          window.eventBus.off('promocodeApplied', handler);
          window.eventBus.off('subscriptionUpdated', handler);
          window.eventBus.off('forceUpdate', handler);
          window.eventBus.off('globalForceUpdate', handler);
        }
      });
    }
    
    // Remove DOM event listeners
    if (typeof window !== 'undefined') {
      if (eventHandlers.domSubscriptionChange) {
        window.removeEventListener('userSubscriptionChanged', eventHandlers.domSubscriptionChange);
      }
      
      if (eventHandlers.storageChange) {
        window.removeEventListener('storage', eventHandlers.storageChange);
      }
    }
    
    // Remove store subscription
    if (eventHandlers.storeUnsubscribe && typeof eventHandlers.storeUnsubscribe === 'function') {
      eventHandlers.storeUnsubscribe();
    }
  };
  
  // ✅ Lifecycle hooks
  onMounted(() => {
    console.log('🔧 useUserStatus: Composable mounted');
    setupEventListeners();
    
    // Initial reactivity trigger
    triggerReactivityUpdate();
  });
  
  onUnmounted(() => {
    console.log('🧹 useUserStatus: Composable unmounting');
    cleanupEventListeners();
  });
  
  // ✅ Return reactive properties and methods
  return {
    // Reactive status properties
    userStatus,
    isPremiumUser,
    isStartUser,
    isProUser,
    isFreeUser,
    userStatusLabel,
    isUpdatingStatus,
    
    // Methods
    updateStatus,
    triggerReactivityUpdate,
    
    // Internal reactive refs (for advanced usage)
    forceUpdateKey,
    lastUpdateTime
  };
}