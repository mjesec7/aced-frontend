// src/composables/useUserStatus.js - ENHANCED WITH COMPLETE REACTIVITY FIX
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { mapGetters } from 'vuex';

// ✅ ENHANCED GLOBAL EVENT TRIGGERING SYSTEM (ensure this works with your main.js)
const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {
    
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


  } catch (error) {
    console.error(`❌ Failed to trigger global event '${eventName}':`, error);
  }
};

// ✅ EXPORTED ACTION: updateUserStatus for store import (ENHANCED)
export const updateUserStatusAction = async ({ commit, state, dispatch }, newStatus) => {
  const startTime = Date.now();
  
  try {
    
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
      // ✅ ENHANCED: Comprehensive reactivity tracking
      reactivityKey: 0,
      lastStatusUpdate: Date.now(),
      componentMountTime: Date.now(),
      statusChangeHistory: [],
      
      // ✅ Event cleanup tracking
      eventCleanupFunctions: [],
      storeUnsubscribe: null,
      globalEventHandlers: {},
      
      // ✅ Status sync tracking
      lastSyncTime: Date.now(),
      syncCheckInterval: null,
      forceUpdateTimeout: null,
      
      // ✅ Notification system
      statusChangeNotifications: [],
      lastNotificationTime: 0
    };
  },
  
  computed: {
    // ✅ ENHANCED: Reactive user status with comprehensive fallbacks
    reactiveUserStatus() {
      // Force reactivity with multiple triggers
      const reactKey = this.reactivityKey;
      const updateTime = this.lastStatusUpdate;
      const mountTime = this.componentMountTime;
      
      try {
        // Try store first
        const storeStatus = this.$store?.getters['user/userStatus'];
        
        // Try localStorage as fallback
        const localStatus = localStorage.getItem('userStatus');
        
        // Try user object subscription plan
        const userStatus = this.$store?.state?.user?.subscriptionPlan;
        
        // Determine the best status
        const finalStatus = storeStatus || localStatus || userStatus || 'free';
        
       
        
        return finalStatus;
      } catch (error) {
        console.error(`❌ [${this.$options.name}] Error in reactiveUserStatus:`, error);
        return 'free';
      }
    },
    
    // ✅ ENHANCED: Reactive premium status
    reactiveIsPremiumUser() {
      const status = this.reactiveUserStatus;
      return status === 'start' || status === 'pro';
    },
    
    // ✅ ENHANCED: Reactive start user status
    reactiveIsStartUser() {
      return this.reactiveUserStatus === 'start';
    },
    
    // ✅ ENHANCED: Reactive pro user status
    reactiveIsProUser() {
      return this.reactiveUserStatus === 'pro';
    },
    
    // ✅ ENHANCED: Reactive free user status
    reactiveIsFreeUser() {
      return this.reactiveUserStatus === 'free';
    },
    
    // ✅ ENHANCED: User status label with reactivity
    userStatusLabel() {
      const status = this.reactiveUserStatus;
      const labels = {
        pro: 'Pro',
        start: 'Start',
        free: 'Free'
      };
      return labels[status] || 'Free';
    },
    
    // ✅ ENHANCED: Subscription class for styling
    subscriptionClass() {
      const status = this.reactiveUserStatus;
      const classes = {
        pro: 'badge-pro',
        start: 'badge-start',
        free: 'badge-free'
      };
      return classes[status] || 'badge-free';
    },
    
    // ✅ ENHANCED: Subscription text
    subscriptionText() {
      const status = this.reactiveUserStatus;
      const texts = {
        pro: 'Pro подписка',
        start: 'Start подписка',
        free: 'Бесплатный доступ'
      };
      return texts[status] || 'Бесплатный доступ';
    },
    
    // ✅ NEW: Status badge class for UI components
    getStatusBadgeClass() {
      return () => {
        const status = this.reactiveUserStatus;
        const classes = {
          pro: 'status-pro',
          start: 'status-start',
          free: 'status-free'
        };
        return classes[status] || 'status-free';
      };
    }
  },
  
  // ✅ ENHANCED: Comprehensive watchers
  watch: {
    // Watch reactive user status
    reactiveUserStatus: {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.recordStatusChange(newStatus, oldStatus);
          this.onUserStatusChanged(newStatus, oldStatus);
        }
      },
      immediate: true
    },
    
    // Watch store user status directly
    '$store.state.user.userStatus': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    },
    
    // Watch user object changes
    '$store.state.user': {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserObjectChange(newUser, oldUser);
        }
      },
      deep: true,
      immediate: true
    }
  },
  
  async mounted() {
    
    try {
      // Initialize component tracking
      this.componentMountTime = Date.now();
      
      // Setup comprehensive event listeners
      await this.setupUniversalEventListeners();
      
      // Setup store subscription
      this.setupStoreSubscription();
      
      // Setup periodic sync
      this.setupPeriodicStatusSync();
      
      // Initial status sync
      await this.syncStatusWithStore();
      
      
    } catch (error) {
      console.error(`❌ [${this.$options.name}] UserStatus mixin mount error:`, error);
    }
  },
  
  beforeUnmount() {
    this.cleanupStatusMixin();
  },
  
  methods: {
    // ✅ MAIN: Status change handler (override in components)
    onUserStatusChanged(newStatus, oldStatus) {
      
      // Show notification for upgrades
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        this.showStatusUpgradeNotification(newStatus);
      }
    },
    
    // ✅ CORE: Setup universal event listeners
    async setupUniversalEventListeners() {
      
      // ===== DOM EVENT LISTENERS =====
      if (typeof window !== 'undefined') {
        
        // User subscription changed (from payments, promocodes)
        this.globalEventHandlers.subscriptionChange = (event) => {
          
          const { plan, source, oldPlan } = event.detail;
          this.handleSubscriptionChange(plan, oldPlan, source);
        };
        
        // User status direct change
        this.globalEventHandlers.statusChange = (event) => {
          
          const { newStatus, oldStatus, source } = event.detail;
          this.handleStatusChange(newStatus, oldStatus, source);
        };
        
        // Storage changes (cross-tab sync)
        this.globalEventHandlers.storageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            this.handleStatusChange(event.newValue, event.oldValue, 'localStorage');
          }
        };
        
        // Register DOM listeners
        window.addEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        window.addEventListener('userStatusChanged', this.globalEventHandlers.statusChange);
        window.addEventListener('storage', this.globalEventHandlers.storageChange);
        
        // Add cleanup functions
        this.eventCleanupFunctions.push(
          () => window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange),
          () => window.removeEventListener('userStatusChanged', this.globalEventHandlers.statusChange),
          () => window.removeEventListener('storage', this.globalEventHandlers.storageChange)
        );
      }
      
      // ===== EVENT BUS LISTENERS =====
      if (typeof window !== 'undefined' && window.eventBus) {
        
        const eventBusHandlers = {
          userStatusChanged: (data) => {
            this.handleStatusChange(data.newStatus, data.oldStatus, 'eventBus');
          },
          
          promocodeApplied: (data) => {
            this.handlePromocodeApplied(data);
          },
          
          subscriptionUpdated: (data) => {
            this.handleSubscriptionChange(data.plan, data.oldPlan, 'subscription');
          },
          
          paymentCompleted: (data) => {
            this.handlePaymentCompleted(data);
          },
          
          forceUpdate: (data) => {
            this.triggerReactivityUpdate();
          },
          
          globalForceUpdate: (data) => {
            this.triggerReactivityUpdate();
          }
        };
        
        // Register event bus listeners
        Object.entries(eventBusHandlers).forEach(([event, handler]) => {
          window.eventBus.on(event, handler);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(event, handler);
          });
        });
        
      }
      
    },
    
    // ✅ CORE: Setup store subscription
    setupStoreSubscription() {
      if (this.$store && typeof this.$store.subscribe === 'function') {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          const relevantMutations = [
            'setUser',
            'user/SET_USER_STATUS',
            'user/setUserStatus',
            'user/UPDATE_SUBSCRIPTION',
            'user/FORCE_UPDATE',
            'user/ADD_PROMOCODE',
            'user/SET_USER'
          ];
          
          if (relevantMutations.includes(mutation.type)) {
            this.handleStoreMutation(mutation);
          }
        });
        
        this.eventCleanupFunctions.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });
        
      }
    },
    
    // ✅ CORE: Setup periodic status sync
    setupPeriodicStatusSync() {
      // Clear any existing interval
      if (this.syncCheckInterval) {
        clearInterval(this.syncCheckInterval);
      }
      
      // Sync status every 30 seconds
      this.syncCheckInterval = setInterval(() => {
        this.syncStatusWithStore();
      }, 30000);
      
      this.eventCleanupFunctions.push(() => {
        if (this.syncCheckInterval) {
          clearInterval(this.syncCheckInterval);
          this.syncCheckInterval = null;
        }
      });
      
    },
    
    // ✅ HANDLERS: Handle different types of status changes
    handleSubscriptionChange(newPlan, oldPlan, source) {
    
      
      // Update store and localStorage
      this.updateUserStatus(newPlan, source);
      
      // Trigger reactivity
      this.triggerReactivityUpdate();
      
      // Record change
      this.recordStatusChange(newPlan, oldPlan, source);
      
      // Call status change handler
      this.onUserStatusChanged(newPlan, oldPlan);
    },
    
    handleStatusChange(newStatus, oldStatus, source) {
     
      
      if (!newStatus || newStatus === oldStatus) return;
      
      // Update store and localStorage
      this.updateUserStatus(newStatus, source);
      
      // Trigger reactivity
      this.triggerReactivityUpdate();
      
      // Call status change handler
      this.onUserStatusChanged(newStatus, oldStatus);
    },
    
    handlePromocodeApplied(data) {
      
      const { newStatus, oldStatus, promocode, source = 'promocode' } = data;
      
      // Update status
      this.handleStatusChange(newStatus, oldStatus, source);
      
      // Show specific promocode notification
      if (newStatus && newStatus !== 'free') {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        this.showStatusNotification(
          `🎟️ Промокод "${promocode}" применён! ${planLabel} план активирован!`,
          'success'
        );
      }
    },
    
    handlePaymentCompleted(data) {
      
      const { plan, oldPlan, amount, source = 'payment' } = data;
      
      // Update status
      this.handleStatusChange(plan, oldPlan, source);
      
      // Show payment notification
      if (plan && plan !== 'free') {
        const planLabel = plan === 'pro' ? 'Pro' : 'Start';
        this.showStatusNotification(
          `💳 Оплата прошла успешно! ${planLabel} план активирован!`,
          'success'
        );
      }
    },
    
    handleUserObjectChange(newUser, oldUser) {
    
      
      const newPlan = newUser?.subscriptionPlan;
      const oldPlan = oldUser?.subscriptionPlan;
      
      if (newPlan !== oldPlan) {
        this.handleStatusChange(newPlan, oldPlan, 'userObject');
      }
      
      // Trigger reactivity for any user object change
      this.triggerReactivityUpdate();
    },
    
    handleStoreMutation(mutation) {
      
      // Handle setUser mutation (like from UserSection)
      if (mutation.type === 'setUser' && mutation.payload?.subscriptionPlan) {
        const newPlan = mutation.payload.subscriptionPlan;
        const currentStatus = this.reactiveUserStatus;
        
        if (newPlan !== currentStatus) {
          this.handleStatusChange(newPlan, currentStatus, 'setUser');
        }
      }
      
      // Always trigger reactivity for relevant mutations
      this.triggerReactivityUpdate();
    },
    
    // ✅ CORE: Update user status in all places
    updateUserStatus(newStatus, source) {
      if (!newStatus) return;
      
      
      try {
        // Update localStorage
        localStorage.setItem('userStatus', newStatus);
        
        // Update store if available
        if (this.$store) {
          // Try multiple store mutation patterns
          if (this.$store.commit) {
            try {
              this.$store.commit('user/SET_USER_STATUS', newStatus);
            } catch (e1) {
              try {
                this.$store.commit('user/setUserStatus', newStatus);
              } catch (e2) {
                try {
                  this.$store.commit('setUserStatus', newStatus);
                } catch (e3) {
                  console.warn(`⚠️ [${this.$options.name}] Could not find store mutation for user status`);
                }
              }
            }
          }
          
          // Also update user object if it exists
          if (this.$store.state.user) {
            const updatedUser = {
              ...this.$store.state.user,
              subscriptionPlan: newStatus
            };
            
            try {
              this.$store.commit('setUser', updatedUser);
            } catch (e) {
              console.warn(`⚠️ [${this.$options.name}] Could not update user object:`, e.message);
            }
          }
        }
        
        
      } catch (error) {
        console.error(`❌ [${this.$options.name}] Error updating user status:`, error);
      }
    },
    
    // ✅ CORE: Sync status with store
    async syncStatusWithStore() {
      try {
        const storeStatus = this.$store?.getters['user/userStatus'] || this.$store?.state?.user?.userStatus;
        const localStatus = localStorage.getItem('userStatus');
        const userObjectStatus = this.$store?.state?.user?.subscriptionPlan;
        const currentTime = Date.now();
        
      
        
        // Determine the authoritative status
        let authoritativeStatus = storeStatus || userObjectStatus || localStatus || 'free';
        
        // If there are mismatches, prioritize the highest level status
        const statusPriority = { free: 0, start: 1, pro: 2 };
        const allStatuses = [storeStatus, localStatus, userObjectStatus].filter(Boolean);
        
        if (allStatuses.length > 1) {
          authoritativeStatus = allStatuses.reduce((highest, current) => {
            return statusPriority[current] > statusPriority[highest] ? current : highest;
          });
          
        }
        
        // Update all sources to match authoritative status
        if (authoritativeStatus !== localStatus) {
          localStorage.setItem('userStatus', authoritativeStatus);
        }
        
        if (authoritativeStatus !== storeStatus) {
          this.updateUserStatus(authoritativeStatus, 'sync');
        }
        
        // Trigger reactivity if anything changed
        if (authoritativeStatus !== this.reactiveUserStatus) {
          this.triggerReactivityUpdate();
        }
        
        this.lastSyncTime = currentTime;
        
      } catch (error) {
        console.error(`❌ [${this.$options.name}] Error syncing status:`, error);
      }
    },
    
    // ✅ CORE: Trigger reactivity update
    triggerReactivityUpdate() {
      // Multiple reactivity triggers for maximum reliability
      this.reactivityKey++;
      this.lastStatusUpdate = Date.now();
      
      // Force Vue reactivity
      this.$forceUpdate();
      
      // Additional delayed updates
      this.$nextTick(() => {
        this.$forceUpdate();
        
        // Clear any pending timeout
        if (this.forceUpdateTimeout) {
          clearTimeout(this.forceUpdateTimeout);
        }
        
        // Final delayed update
        this.forceUpdateTimeout = setTimeout(() => {
          this.$forceUpdate();
        }, 100);
      });
      

    },
    
    // ✅ UTILITY: Record status change for debugging
    recordStatusChange(newStatus, oldStatus, source = 'unknown') {
      const change = {
        timestamp: Date.now(),
        from: oldStatus,
        to: newStatus,
        source,
        component: this.$options.name
      };
      
      this.statusChangeHistory.push(change);
      
      // Keep only last 10 changes
      if (this.statusChangeHistory.length > 10) {
        this.statusChangeHistory.shift();
      }
      
    },
    
    // ✅ UTILITY: Show status notifications
    showStatusUpgradeNotification(newStatus) {
      const planLabels = {
        start: 'Start',
        pro: 'Pro'
      };
      
      const planLabel = planLabels[newStatus] || (newStatus && typeof newStatus === 'string' ? newStatus.toUpperCase() : 'Unknown');
      const message = `🎉 Поздравляем! ${planLabel} подписка активирована!`;
      
      this.showStatusNotification(message, 'success');
    },
    
    showStatusNotification(message, type = 'info') {
      const currentTime = Date.now();
      
      // Prevent duplicate notifications within 2 seconds
      if (currentTime - this.lastNotificationTime < 2000) {
        return;
      }
      
      this.lastNotificationTime = currentTime;
      
      // Try multiple notification methods
      if (this.$toast) {
        this.$toast[type](message, { duration: 5000 });
      } else if (this.$notify) {
        this.$notify({ message, type, duration: 5000 });
      } else if (window.showToast) {
        window.showToast(message, type);
      } else {
        const safeType = type && typeof type === 'string' ? type.toUpperCase() : 'INFO';
      }
    },
    
    // ✅ UTILITY: Get status history for debugging
    getStatusHistory() {
      return {
        component: this.$options.name,
        currentStatus: this.reactiveUserStatus,
        history: this.statusChangeHistory,
        lastUpdate: this.lastStatusUpdate,
        mountTime: this.componentMountTime
      };
    },
    
    // ✅ CLEANUP: Clean up all resources
    cleanupStatusMixin() {
      
      // Clear timeouts
      if (this.forceUpdateTimeout) {
        clearTimeout(this.forceUpdateTimeout);
        this.forceUpdateTimeout = null;
      }
      
      // Run all cleanup functions
      this.eventCleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
        }
      });
      
      // Clear arrays and objects
      this.eventCleanupFunctions = [];
      this.globalEventHandlers = {};
      this.statusChangeHistory = [];
      this.statusChangeNotifications = [];
      
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
      
   
    } catch (error) {
      console.warn('⚠️ useUserStatus: Reactivity update failed:', error);
    }
  };
  
  // ✅ NEW: Handle user status change
  const handleUserStatusChange = (newStatus, oldStatus) => {
    
    lastUpdateTime.value = Date.now();
    triggerReactivityUpdate();
  };
  
  // ✅ NEW: Sync status with store
  const syncStatusWithStore = () => {
    try {
      const storeStatus = store.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const currentTime = Date.now();
      
     
      
      if (storeStatus && storeStatus !== localStatus) {
        localStorage.setItem('userStatus', storeStatus);
        triggerReactivityUpdate();
        lastSyncTime.value = currentTime;
      }
      
      if (currentTime - lastSyncTime.value > 60000) {
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
      
      const result = await store.dispatch('user/updateUserStatus', newStatus);
      
      if (result && result.success) {
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
    
    // Clear any existing listeners
    cleanupEventListeners();
    
    // ✅ METHOD 1: DOM event listeners (most reliable)
    const handleStatusChange = (event) => {
      
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
          triggerReactivityUpdate();
        }
      });
      
      eventCleanupFunctions.push(storeUnsubscribe);
    }
    
    // ✅ METHOD 4: localStorage change listener for cross-tab sync
    const storageChangeHandler = (event) => {
      if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
        handleUserStatusChange(event.newValue, event.oldValue);
        syncStatusWithStore();
      }
    };
    
    window.addEventListener('storage', storageChangeHandler);
    eventCleanupFunctions.push(() => {
      window.removeEventListener('storage', storageChangeHandler);
    });
    
  };
  
  // ✅ Setup periodic status sync
  const setupPeriodicSync = () => {
    if (statusSyncInterval) {
      clearInterval(statusSyncInterval);
    }
    
    statusSyncInterval = setInterval(() => {
      syncStatusWithStore();
    }, 30000);
    
  };
  
  // ✅ ENHANCED: Cleanup event listeners
  const cleanupEventListeners = () => {
    
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
    
  };
  
  // ✅ Watch for store changes
  watch(
    () => store.getters['user/userStatus'],
    (newStatus, oldStatus) => {
      if (newStatus !== oldStatus) {
        handleUserStatusChange(newStatus, oldStatus);
      }
    },
    { immediate: true }
  );
  
  watch(
    () => store.getters['user/forceUpdateCounter'],
    (newCounter, oldCounter) => {
      if (newCounter !== oldCounter) {
        triggerReactivityUpdate();
      }
    },
    { immediate: true }
  );
  
  // ✅ Lifecycle hooks
  onMounted(() => {
    setupEventListeners();
    setupPeriodicSync();
    
    // Initial reactivity trigger
    triggerReactivityUpdate();
    
    // Initial status sync
    syncStatusWithStore();
  });
  
  onUnmounted(() => {
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
    
    try {
      const currentStatus = store.getters['user/userStatus'] || 'free';
      triggerGlobalEvent('userStatusChanged', {
        oldStatus: null,
        newStatus: currentStatus,
        source: 'emergency-sync-composable',
        timestamp: Date.now()
      });
      
      triggerReactivityUpdate();
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
  
  
  // Add reactive data properties
  if (!component.statusReactivityKey) component.statusReactivityKey = 0;
  if (!component.lastStatusUpdate) component.lastStatusUpdate = Date.now();
  
  // Add trigger method
  component.triggerStatusReactivityUpdate = function() {
    this.statusReactivityKey++;
    this.lastStatusUpdate = Date.now();
    this.$forceUpdate();
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
    
   
    
    return { storeStatus, localStatus, isPremium };
  },
  
  triggerTestEvents: (status = 'start') => {
    triggerGlobalEvent('userStatusChanged', {
      oldStatus: 'free',
      newStatus: status,
      source: 'debug-trigger',
      timestamp: Date.now()
    });
  },
  
  forceGlobalUpdate: () => {
    triggerGlobalEvent('globalForceUpdate', {
      reason: 'debug-force',
      timestamp: Date.now()
    });
  }
};

