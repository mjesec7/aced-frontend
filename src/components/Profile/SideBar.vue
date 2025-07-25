<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ userDisplayName }}</span>
            <span class="user-plan" :class="userStatusBadgeClass" :key="reactivityKey">📦 {{ planLabel }}</span>
          </div>
        </div>

        <div class="nav-links scrollable">
          <router-link
            to="/profile/main"
            class="nav-item"
            :class="{ active: isActive('main') }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            Главная
          </router-link>

          <router-link
            to="/profile/catalogue"
            class="nav-item"
            :class="{ active: isActive('catalogue') }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            Каталог
          </router-link>

          <router-link
            v-for="link in links"
            :key="link.name"
            :to="getRoutePath(link.name)"
            class="nav-item"
            :class="{ active: isActive(link.name) }"
            @click="closeSidebarOnMobile"
          >
            <span class="highlight"></span>
            {{ link.label }}
          </router-link>
        </div>

        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <div 
      class="sidebar-overlay" 
      v-if="isOpen && isMobile" 
      @click="closeSidebar"
    ></div>

    <div class="logout-modal" v-if="showLogoutModal">
      <div class="logout-modal-content">
        <p>Вы уверены, что хотите выйти?</p>
        <div class="logout-actions">
          <button class="confirm-btn" @click="logout">Да</button>
          <button class="cancel-btn" @click="showLogoutModal = false">Нет</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { mapState, mapMutations, mapGetters } from 'vuex';

export default {
  name: 'SideBar',
  props: {
    isOpen: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showLogoutModal: false,
      links: [
        { name: 'analytics', label: 'Аналитика' },
        { name: 'goal', label: 'Цели' },
        { name: 'diary', label: 'Дневник' },
        { name: 'homework', label: 'Помощь с ДЗ' },
        { name: 'homeworks', label: 'Домашние задания' },
        { name: 'tests', label: 'Тесты' },
        { name: 'vocabulary', label: 'Словарь' },
        { name: 'settings', label: 'Настройки' }
      ],
      isMobile: false,
      // ✅ ENHANCED: More comprehensive reactivity tracking
      componentKey: 0,
      reactivityKey: 0,
      lastStatusUpdate: Date.now(),
      unsubscribeStore: null, // Initial name from the original code
      globalEventHandlers: {},
      
      // ✅ NEW: Event cleanup tracking (keeping the original `eventCleanupFunctions` for consistency)
      eventCleanupFunctions: [], // This was already present in the original code, moved to correct data section
      storeUnsubscribe: null, // This is the preferred name for the Vuex unsubscribe function

      // ✅ NEW: Status sync tracking
      lastSyncTime: Date.now(),
      syncCheckInterval: null
    };
  },
  computed: {
    ...mapState(['user']),
    // ✅ ENHANCED: Map all needed user getters from store with reactivity
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser',
      'isStartUser', 
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'subscriptionDetails',
      'forceUpdateCounter'
    ]),
    
    // ✅ ENHANCED: Better plan label with comprehensive reactivity
    planLabel() {
      // Force reactivity with multiple triggers
      const status = this.userStatus || 'free';
      const counter = this.forceUpdateCounter || 0;
      const key = this.reactivityKey;
      const timestamp = this.lastStatusUpdate;
      const syncTime = this.lastSyncTime; // Additional trigger
      
      console.log('📊 Sidebar: Computing plan label:', { 
        status, 
        counter, 
        key, 
        timestamp,
        syncTime,
        raw: this.$store?.state?.user?.userStatus 
      });
      
      // Multiple fallback checks for maximum reliability
      const finalStatus = status || 
                         this.$store?.getters['user/userStatus'] || 
                         this.$store?.state?.user?.userStatus ||
                         localStorage.getItem('userStatus') || 
                         'free';
      
      const labels = {
        'pro': 'Pro',
        'start': 'Start',
        'premium': 'Start', // Alias
        'free': 'Free'
      };
      
      return labels[finalStatus] || 'Free';
    },
    
    // ✅ NEW: Computed property to track user info changes with reactivity
    userDisplayName() {
      const key = this.componentKey; // Force reactivity by depending on componentKey
      if (!this.user) return 'Пользователь';
      return this.user.name || this.user.displayName || this.user.email?.split('@')[0] || 'Пользователь';
    },
    
    // ✅ NEW: Enhanced user status badge class
    userStatusBadgeClass() {
      const status = this.userStatus || 'free';
      const counter = this.forceUpdateCounter || 0; // Force reactivity
      
      return {
        'status-free': status === 'free',
        'status-start': status === 'start' || status === 'premium', 
        'status-pro': status === 'pro',
        'plan-updated': this.lastStatusUpdate > Date.now() - 5000, // Recently updated
        'reactive-update': counter > 0 // Placeholder class, could be used for animation
      };
    }
  },
  
  // ✅ ENHANCED: Comprehensive watchers for all possible changes
  watch: {
    // ✅ Watch for user status changes from store with immediate feedback
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 Sidebar: User status changed from', oldStatus, 'to:', newStatus);
        
        this.handleStatusChange(newStatus, oldStatus);
        
        // ✅ NEW: Also update sync time
        this.lastSyncTime = Date.now();
      },
      immediate: true
    },
    
    // ✅ Watch store force update counter
    forceUpdateCounter: {
      handler(newCounter, oldCounter) {
        console.log('📊 Sidebar: Force update counter changed:', oldCounter, '→', newCounter);
        this.triggerReactivityUpdate();
      },
      immediate: true
    },
    
    // ✅ Watch for user object changes
    user: {
      handler(newUser, oldUser) {
        console.log('👤 Sidebar: User object changed:', { 
          old: oldUser?.email, 
          new: newUser?.email,
          status: this.userStatus 
        });
        
        if (newUser && (!oldUser || oldUser.email !== newUser.email)) {
          console.log('👤 Sidebar: New user logged in:', newUser.email);
          this.componentKey++; // Trigger userDisplayName reactivity
        }
      },
      deep: true,
      immediate: true
    },
    
    // ✅ Watch for subscription details changes
    subscriptionDetails: {
      handler(newSub, oldSub) {
        if (newSub !== oldSub) {
          console.log('💳 Sidebar: Subscription details changed:', newSub);
          this.triggerReactivityUpdate();
        }
      },
      deep: true,
      immediate: true
    },
    
    // ✅ Watch for subscription status changes
    hasActiveSubscription: {
      handler(hasSubscription, hadSubscription) {
        if (hasSubscription !== hadSubscription) {
          console.log('💳 Sidebar: Subscription status changed to:', hasSubscription);
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    },

    // ✅ NEW: Watch for localStorage changes (for cross-tab sync) - This is for direct store state changes, not localStorage
    // The previous implementation was watching $store.state.user.userStatus, which is appropriate.
    // If you literally meant localStorage, that's covered by `setupGlobalListeners` already.
    '$store.state.user.userStatus': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log('📊 Sidebar: Store user status direct change (via $store.state):', oldStatus, '→', newStatus);
          this.triggerReactivityUpdate();
          this.lastSyncTime = Date.now();
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    console.log('🔧 Sidebar: Component mounted');
    console.log('📊 Sidebar: Initial user status:', this.userStatus);
    console.log('👤 Sidebar: Initial user:', this.user);
    
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    
    // ✅ ENHANCED: Better Firebase auth state handling
    onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔥 Sidebar: Firebase auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        const userData = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL
        };
        
        console.log('👤 Sidebar: Setting user data:', userData);
        this.setUser(userData);
        
        // ✅ Store user ID for API calls
        this.$store.commit('setFirebaseUserId', firebaseUser.uid);
        localStorage.setItem('firebaseUserId', firebaseUser.uid);
        
      } else {
        console.log('👤 Sidebar: User logged out, clearing data');
        this.clearUser();
        this.$store.commit('setFirebaseUserId', null);
        localStorage.removeItem('firebaseUserId');
      }
    });
    
    // ✅ ENHANCED: Setup all global listeners
    this.setupGlobalListeners();
    
    // ✅ ENHANCED: Store subscription listener with enhanced mutation tracking
    // Using `this.storeUnsubscribe` as the variable name for consistency with cleanup
    this.storeUnsubscribe = this.$store.subscribe((mutation) => {
      const relevantMutations = [
        'user/SET_USER_STATUS',
        'user/setUserStatus', 
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE',
        'user/ADD_PROMOCODE',
        'user/SET_USER'
      ];
      
      if (relevantMutations.includes(mutation.type)) {
        console.log('📊 Sidebar: Store mutation detected:', mutation.type, mutation.payload);
        this.handleStoreUpdate(mutation);
      }
    });
    
    // ✅ Initial status sync check
    this.syncStatusWithStore();
    
    // ✅ NEW: Setup periodic sync check
    this.setupPeriodicSync();
  },
  
  beforeUnmount() {
    console.log('🔧 Sidebar: Component unmounting');
    // Remove resize listener
    window.removeEventListener('resize', this.checkMobile);
    
    // Clean up global event listeners
    this.cleanupGlobalListeners();
    
    // Remove store subscription
    if (this.storeUnsubscribe) { // Use the correct variable name
      this.storeUnsubscribe();
      this.storeUnsubscribe = null; // Clear reference
    }
    
    // Clear sync interval
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null; // Clear reference
    }
    
    console.log('✅ Sidebar: Cleanup completed');
  },
  
  methods: {
    ...mapMutations(['setUser', 'clearUser']), // Ensure these mutations are available
    
    // ✅ NEW: Setup periodic sync check
    setupPeriodicSync() {
      // Clear any existing interval to prevent duplicates
      if (this.syncCheckInterval) {
        clearInterval(this.syncCheckInterval);
      }

      // Check for status consistency every 30 seconds
      this.syncCheckInterval = setInterval(() => {
        this.syncStatusWithStore();
      }, 30000);
      
      console.log('✅ Sidebar: Periodic sync check setup');
    },

    // ✅ ENHANCED: More comprehensive global listeners setup
    setupGlobalListeners() {
      console.log('🔧 Sidebar: Setting up global event listeners');
      
      // ✅ Enhanced subscription change handler (for custom DOM event)
      this.globalEventHandlers.subscriptionChange = (event) => {
        console.log('📡 Sidebar: Global subscription change received (DOM event):', event.detail);
        
        const { plan, source, oldPlan } = event.detail;
        
        // Force immediate update with multiple triggers
        this.handleStatusChange(plan, oldPlan);
        
        // Show celebration for upgrades
        this.$nextTick(() => {
          if (plan && plan !== 'free' && oldPlan === 'free') {
            this.showUpgradeNotification(plan, source);
          }
        });
      };
      
      // ✅ Enhanced event bus listeners with error handling
      if (typeof window !== 'undefined' && window.eventBus) {
        this.globalEventHandlers.statusChanged = (data) => {
          console.log('📡 Sidebar: Status change event (EventBus):', data);
          this.handleStatusChange(data.newStatus, data.oldStatus);
        };
        
        this.globalEventHandlers.promocodeApplied = (data) => {
          console.log('📡 Sidebar: Promocode applied event (EventBus):', data);
          this.handleStatusChange(data.newStatus, data.oldStatus);
          
          if (data.promocode && data.newStatus) {
            const planLabel = data.newStatus === 'pro' ? 'Pro' : 'Start';
            console.log(`🎉 Sidebar: Promocode ${data.promocode} activated ${planLabel} plan`);
          }
        };
        
        this.globalEventHandlers.subscriptionUpdated = (data) => {
          console.log('📡 Sidebar: Subscription updated event (EventBus):', data);
          this.handleStatusChange(data.plan, data.oldPlan);
        };
        
        this.globalEventHandlers.forceUpdate = (data) => {
          console.log('📡 Sidebar: Force update event (EventBus):', data);
          this.triggerReactivityUpdate();
        };
        
        // ✅ NEW: Store change event handler for EventBus
        this.globalEventHandlers.storeChanged = (data) => {
          console.log('📡 Sidebar: Store changed event (EventBus):', data);
          this.syncStatusWithStore(); // Trigger a sync check on store change
          this.triggerReactivityUpdate();
        };
        
        // Register all event bus listeners and push cleanup functions
        const eventsToRegister = [
          ['userStatusChanged', this.globalEventHandlers.statusChanged],
          ['promocodeApplied', this.globalEventHandlers.promocodeApplied],
          ['subscriptionUpdated', this.globalEventHandlers.subscriptionUpdated],
          ['forceUpdate', this.globalEventHandlers.forceUpdate],
          ['globalForceUpdate', this.globalEventHandlers.forceUpdate],
          ['storeChanged', this.globalEventHandlers.storeChanged]
        ];
        
        eventsToRegister.forEach(([eventName, handler]) => {
          window.eventBus.on(eventName, handler);
          this.eventCleanupFunctions.push(() => {
            window.eventBus.off(eventName, handler);
          });
        });
        
        console.log('✅ Sidebar: Event bus listeners registered');
      }
      
      // ✅ Enhanced DOM event listener
      if (typeof window !== 'undefined') {
        window.addEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        console.log('✅ Sidebar: DOM event listener registered');
        
        // ✅ NEW: Listen for localStorage changes (for cross-tab sync)
        this.globalEventHandlers.storageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            console.log('📡 Sidebar: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
            this.handleStatusChange(event.newValue, event.oldValue);
            this.syncStatusWithStore(); // Trigger sync to update Vuex store
          }
        };
        
        window.addEventListener('storage', this.globalEventHandlers.storageChange);
      }
    },

    // ✅ ENHANCED: Better comprehensive cleanup for global listeners
    cleanupGlobalListeners() {
      console.log('🧹 Sidebar: Cleaning up global event listeners');
      
      if (typeof window !== 'undefined') {
        // Remove specific DOM event listeners
        if (this.globalEventHandlers.subscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        }
        
        if (this.globalEventHandlers.storageChange) {
          window.removeEventListener('storage', this.globalEventHandlers.storageChange);
        }
        
        // Remove event bus listeners using stored cleanup functions
        this.eventCleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('⚠️ Event cleanup function failed:', error);
          }
        });
      }
      
      // Clear handlers object and cleanup array
      this.globalEventHandlers = {};
      this.eventCleanupFunctions = [];
    },
    
    // ✅ NEW: Centralized status change handler
    handleStatusChange(newStatus, oldStatus) {
      console.log('🔄 Sidebar: Handling status change:', oldStatus, '→', newStatus);
      
      // Update local tracking
      this.lastStatusUpdate = Date.now();
      
      // Trigger multiple reactivity updates
      this.triggerReactivityUpdate();
      
      // Optional: Show notification for subscription changes
      if (oldStatus && oldStatus !== newStatus && newStatus && newStatus !== 'free') {
        // Delay notification to avoid showing multiple times, especially from rapid events
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
          this.showUpgradeNotification(newStatus, 'subscription-change');
        }, 500);
      }
    },
    
    // ✅ NEW: Store update handler
    handleStoreUpdate(mutation) {
      console.log('🔄 Sidebar: Handling store update:', mutation.type);
      
      // Force component update with multiple strategies
      this.triggerReactivityUpdate();
      
      // Additional delayed update for stubborn cases
      this.$nextTick(() => {
        setTimeout(() => {
          this.triggerReactivityUpdate();
        }, 100);
      });
    },
    
    // ✅ NEW: Comprehensive reactivity update
    triggerReactivityUpdate() {
      // Multiple reactivity triggers for maximum reliability
      this.componentKey++;
      this.reactivityKey++;
      this.lastStatusUpdate = Date.now();
      this.lastSyncTime = Date.now(); // Also update last sync time with every trigger
      
      // Force Vue reactivity
      this.$forceUpdate();
      
      // Additional delayed updates
      this.$nextTick(() => {
        this.$forceUpdate();
        
        setTimeout(() => {
          this.$forceUpdate();
        }, 50); // Small delay for rendering
      });
      
      console.log('🔄 Sidebar: Reactivity update triggered:', {
        componentKey: this.componentKey,
        reactivityKey: this.reactivityKey,
        currentStatus: this.userStatus,
        timestamp: this.lastStatusUpdate
      });
    },
    
    // ✅ ENHANCED: Better sync with store
    syncStatusWithStore() {
      try {
        const storeStatus = this.$store?.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus');
        const currentTime = Date.now();
        
        console.log('🔄 Sidebar: Syncing status:', {
          store: storeStatus,
          localStorage: localStatus,
          computed: this.userStatus,
          timeSinceLastSync: currentTime - this.lastSyncTime
        });
        
        // If there's a mismatch between store and localStorage, prefer store and update localStorage
        if (storeStatus && storeStatus !== localStatus) {
          console.log('⚠️ Sidebar: Status mismatch detected, syncing localStorage to store');
          localStorage.setItem('userStatus', storeStatus);
          this.triggerReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
        // If store is empty/default but localStorage has a higher status, update store
        if (!storeStatus || storeStatus === 'free') {
          if (localStatus && localStatus !== 'free' && localStatus !== storeStatus) {
            console.log('⚠️ Sidebar: Store missing higher status, updating from localStorage');
            this.$store.commit('user/SET_USER_STATUS', localStatus); // Assuming this mutation exists
            this.triggerReactivityUpdate();
            this.lastSyncTime = currentTime;
          }
        }
        
        // Force reactivity if it's been a while since last update (as a fallback)
        if (currentTime - this.lastSyncTime > 60000) { // 1 minute
          console.log('🔄 Sidebar: Periodic reactivity refresh (long idle)');
          this.triggerReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
      } catch (error) {
        console.error('❌ Sidebar: Error syncing status:', error);
      }
    },
    
    // ✅ NEW: Show upgrade notification (assuming this.$toast is available globally)
    showUpgradeNotification(plan, source) {
      const planLabels = {
        start: 'Start',
        pro: 'Pro'
      };
      
      const sourceLabels = {
        promocode: 'промокоду',
        payment: 'оплате',
        'subscription-change': 'обновлению'
      };
      
      const planLabel = planLabels[plan] || plan.toUpperCase();
      const sourceText = sourceLabels[source] || 'активации';
      
      const message = `🎉 Поздравляем! Теперь у вас ${planLabel} подписка по ${sourceText}!`;
      
      if (this.$toast) {
        this.$toast.success(message, {
          duration: 5000,
          position: 'top-center'
        });
      } else {
        console.log('🎉 Sidebar:', message);
      }
    },
    
    checkMobile() {
      this.isMobile = window.innerWidth <= 768;
    },
    
    closeSidebar() {
      this.$emit('toggle-sidebar', false);
    },
    
    closeSidebarOnMobile() {
      if (this.isMobile) {
        this.closeSidebar();
      }
    },
    
    // ✅ ENHANCED: Better logout handling
    async logout() {
      try {
        console.log('🚪 Sidebar: Starting logout process...');
        
        // Hide modal immediately for better UX
        this.showLogoutModal = false;
        
        // Sign out from Firebase
        await signOut(auth);
        
        // Clear all store data (assuming user module has CLEAR_USER)
        this.clearUser(); // from mapMutations
        this.$store.commit('user/CLEAR_USER'); // Explicitly clear user module state if present
        this.$store.commit('setFirebaseUserId', null); // Clear global firebase user ID
        
        // Clear relevant local storage items
        const keysToRemove = ['firebaseUserId', 'userId', 'userStatus', 'subscriptionDetails', 'appliedPromocodes'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        console.log('✅ Sidebar: Logout successful');
        
        // Show success message
        if (this.$toast) {
          this.$toast.success('Вы успешно вышли из аккаунта.', {
            duration: 3000,
            position: 'top-center'
          });
        }
        
        // Redirect after a short delay for toast to show
        setTimeout(() => {
          this.$router.push('/');
        }, 1500);
        
      } catch (error) {
        console.error('❌ Sidebar: Logout error:', error);
        
        if (this.$toast) {
          this.$toast.error('Ошибка при выходе: попробуйте ещё раз.');
        } else {
          alert('Ошибка при выходе: попробуйте ещё раз.');
        }
      }
    },
    
    getRoutePath(linkName) {
      if (linkName === 'settings') {
        return '/settings';
      }
      return `/profile/${linkName}`;
    },
    
    // ✅ ENHANCED: Better route matching for active state
    isActive(name) {
      const path = this.$route.path;
      
      // Handle exact route matches
      const exactMatches = {
        main: ['/profile/main', '/profile', '/profile/'],
        catalogue: ['/profile/catalogue'],
        analytics: ['/profile/analytics'],
        goal: ['/profile/goal'],
        diary: ['/profile/diary'],
        settings: ['/settings']
      };
      
      // Handle routes that can have sub-paths (e.g., /profile/homeworks/123)
      const startsWithMatches = {
        homework: '/profile/homework', // Covers /profile/homework and its sub-routes
        homeworks: '/profile/homeworks',
        tests: '/profile/tests',
        vocabulary: '/profile/vocabulary'
      };
      
      // Check exact matches first
      if (exactMatches[name] && exactMatches[name].includes(path)) {
        return true;
      }
      
      // Check startsWith matches
      if (startsWithMatches[name] && path.startsWith(startsWithMatches[name])) {
        // Ensure it's not a partial match of a different link name (e.g., "home" for "homework")
        // This is a simple check, could be more robust with regex if needed.
        if (name === 'homework') {
          return path === '/profile/homework' || path.startsWith('/profile/homework/');
        }
        return true;
      }
      
      // Fallback to generic match (less precise, use as last resort)
      return path.includes(`/profile/${name}`);
    }
  }
};
</script>

<style scoped>
.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 260px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #111827;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.user-info {
  padding: 60px 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: #111827;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.user-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #f3f4f6;
  border: 2px solid #c7d2fe;
}

.user-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 6px;
}

.user-name {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.2;
  color: #1f2937;
  word-break: break-word;
  max-width: 160px;
}

.user-plan {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 2px;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

/* New/Enhanced styles for user-plan based on status */
.user-plan.status-free {
  background: #cbd5e1; /* Light gray */
  color: #4a5568;
}

.user-plan.status-start {
  background: #a78bfa; /* Light purple */
  color: #ffffff;
}

.user-plan.status-pro {
  background: #1f2937; /* Dark charcoal */
  color: #ffffff;
}

.user-plan.plan-updated {
  animation: pulse-badge 1s forwards;
}

@keyframes pulse-badge {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}


.nav-links {
  flex: 1;
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-links.scrollable {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
}

.nav-links.scrollable::-webkit-scrollbar {
  width: 4px;
}

.nav-links.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.nav-links.scrollable::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 2px;
}

.nav-links.scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

.nav-item {
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  color: #111827;
  text-decoration: none;
  background-color: #f9fafb;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

.nav-item:hover {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.12);
}

.nav-item .highlight {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(to bottom, #6366f1, #8b5cf6);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-item.active .highlight,
.nav-item:hover .highlight {
  opacity: 1;
}

.nav-item.active {
  background: linear-gradient(to right, #ede9fe, #f0f5ff);
  color: #4f46e5;
  transform: translateX(4px);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.bottom-logout {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.logout-button {
  padding: 8px 14px;
  background: #ef4444;
  color: white;
  border: none;
  font-size: 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Inter', sans-serif; /* Changed from Unbounded to Inter for consistency */
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 600;
  min-height: 36px;
}

.logout-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.logout-modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: 'Inter', sans-serif; /* Changed from Unbounded to Inter for consistency */
  max-width: 380px;
  width: 90%;
  animation: fadeIn 0.3s ease-in-out;
}

.logout-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.confirm-btn,
.cancel-btn {
  padding: 10px 20px;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.confirm-btn {
  background: #ef4444;
  color: white;
}

.cancel-btn {
  background: #e5e7eb;
  color: #1f2937;
}

.confirm-btn:hover {
  background: #dc2626;
}

.cancel-btn:hover {
  background: #d1d5db;
}

/* Desktop: Always show sidebar */
@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0) !important;
  }
  
  .sidebar-overlay {
    display: none !important;
  }
}

/* Mobile: Hide sidebar by default */
@media (max-width: 768px) {
  .sidebar {
    z-index: 1001;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>