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
    async updateUserStatus(newStatus) {
      if (!newStatus || !['free', 'start', 'pro'].includes(newStatus)) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Invalid status:`, newStatus);
        return false;
      }
      
      try {
        console.log(`🔄 ${this.$options.name || 'Mixin'}: Updating status to:`, newStatus);
        
        const result = await this.$store.dispatch('user/updateUserStatus', newStatus);
        
        if (result) {
          console.log(`✅ ${this.$options.name || 'Mixin'}: Status updated successfully`);
          this.triggerStatusReactivityUpdate();
          return true;
        } else {
          console.error(`❌ ${this.$options.name || 'Mixin'}: Status update failed`);
          return false;
        }
      } catch (error) {
        console.error(`❌ ${this.$options.name || 'Mixin'}: Status update error:`, error);
        return false;
      }
    },
    
    // ✅ Trigger reactivity update
    triggerStatusReactivityUpdate() {
      this.statusReactivityKey++;
      this.lastStatusUpdate = Date.now();
      this.$forceUpdate();
      
      console.log(`🔄 ${this.$options.name || 'Mixin'}: Status reactivity updated:`, {
        key: this.statusReactivityKey,
        status: this.userStatus
      });
    },
    
    // ✅ Setup comprehensive event listeners
    setupStatusEventListeners() {
      console.log(`🔧 ${this.$options.name || 'Mixin'}: Setting up status event listeners`);
      
      // Event bus listeners
      if (typeof window !== 'undefined' && window.eventBus) {
        this.statusEventHandlers.userStatusChanged = (data) => {
          console.log(`📡 ${this.$options.name || 'Mixin'}: Status change event:`, data);
          this.triggerStatusReactivityUpdate();
        };
        
        this.statusEventHandlers.promocodeApplied = (data) => {
          console.log(`📡 ${this.$options.name || 'Mixin'}: Promocode applied event:`, data);
          this.triggerStatusReactivityUpdate();
        };
        
        this.statusEventHandlers.subscriptionUpdated = (data) => {
          console.log(`📡 ${this.$options.name || 'Mixin'}: Subscription updated event:`, data);
          this.triggerStatusReactivityUpdate();
        };
        
        this.statusEventHandlers.forceUpdate = (data) => {
          console.log(`📡 ${this.$options.name || 'Mixin'}: Force update event:`, data);
          this.triggerStatusReactivityUpdate();
        };
        
        // Register event listeners
        window.eventBus.on('userStatusChanged', this.statusEventHandlers.userStatusChanged);
        window.eventBus.on('promocodeApplied', this.statusEventHandlers.promocodeApplied);
        window.eventBus.on('subscriptionUpdated', this.statusEventHandlers.subscriptionUpdated);
        window.eventBus.on('forceUpdate', this.statusEventHandlers.forceUpdate);
        window.eventBus.on('globalForceUpdate', this.statusEventHandlers.forceUpdate);
        
        console.log(`✅ ${this.$options.name || 'Mixin'}: Event bus listeners registered`);
      }
      
      // DOM event listener
      this.statusEventHandlers.domSubscriptionChange = (event) => {
        console.log(`📡 ${this.$options.name || 'Mixin'}: DOM subscription event:`, event.detail);
        this.triggerStatusReactivityUpdate();
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('userSubscriptionChanged', this.statusEventHandlers.domSubscriptionChange);
      }
      
      // Store subscription listener
      if (this.$store && typeof this.$store.subscribe === 'function') {
        this.statusEventHandlers.storeUnsubscribe = this.$store.subscribe((mutation) => {
          const relevantMutations = [
            'user/SET_USER_STATUS',
            'user/setUserStatus',
            'user/UPDATE_SUBSCRIPTION',
            'user/FORCE_UPDATE',
            'user/ADD_PROMOCODE'
          ];
          
          if (relevantMutations.includes(mutation.type)) {
            console.log(`📊 ${this.$options.name || 'Mixin'}: Store mutation:`, mutation.type, mutation.payload);
            this.triggerStatusReactivityUpdate();
          }
        });
      }
      
      // localStorage change listener
      this.statusEventHandlers.storageChange = (event) => {
        if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
          console.log(`📡 ${this.$options.name || 'Mixin'}: localStorage changed:`, event.oldValue, '→', event.newValue);
          this.triggerStatusReactivityUpdate();
        }
      };
      
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', this.statusEventHandlers.storageChange);
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
      
      const result = await store.dispatch('user/updateUserStatus', newStatus);
      
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