<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- 👤 User Info - Fixed at top -->
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-plan" :class="getStatusBadgeClass()" :key="reactivityKey">📦 {{ planLabel }}</span>
          </div>
        </div>

        <!-- 📚 Navigation Links - Scrollable -->
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

        <!-- 🚪 Logout - Fixed at bottom -->
        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <!-- Overlay for mobile -->
    <div 
      class="sidebar-overlay" 
      v-if="isOpen && isMobile" 
      @click="closeSidebar"
    ></div>

    <!-- 🔐 Confirm Logout Modal -->
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
      // ✅ Enhanced reactivity tracking
      componentKey: 0,
      reactivityKey: 0,
      lastStatusUpdate: Date.now(),
      unsubscribeStore: null,
      globalEventHandlers: {}
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
      
      console.log('📊 Sidebar: Computing plan label:', { 
        status, 
        counter, 
        key, 
        timestamp,
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
        'free': 'Free'
      };
      
      return labels[finalStatus] || 'Free';
    },
    
    // ✅ NEW: Computed property to track user info changes with reactivity
    userDisplayName() {
      const key = this.componentKey; // Force reactivity
      if (!this.user) return 'Пользователь';
      return this.user.name || this.user.displayName || this.user.email?.split('@')[0] || 'Пользователь';
    },
    
    // ✅ NEW: Reactive status for CSS classes
    currentStatus() {
      return this.userStatus || 'free';
    }
  },
  
  // ✅ ENHANCED: Comprehensive watchers for all possible changes
  watch: {
    // ✅ Watch for user status changes from store with immediate feedback
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 Sidebar: User status changed from', oldStatus, 'to:', newStatus);
        
        this.handleStatusChange(newStatus, oldStatus);
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
          this.componentKey++;
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
    
    // ✅ Store subscription listener with enhanced mutation tracking
    this.unsubscribeStore = this.$store.subscribe((mutation) => {
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
  },
  
  beforeUnmount() {
    console.log('🔧 Sidebar: Component unmounting');
    window.removeEventListener('resize', this.checkMobile);
    
    // Remove global event listeners
    this.cleanupGlobalListeners();
    
    // Remove store subscription
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  },
  
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    
    // ✅ ENHANCED: Comprehensive global event listeners setup
    setupGlobalListeners() {
      console.log('🔧 Sidebar: Setting up global event listeners');
      
      // ✅ Global subscription change handler
      this.globalEventHandlers.subscriptionChange = (event) => {
        console.log('📡 Sidebar: Global subscription change received:', event.detail);
        
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
      
      // ✅ Event bus listeners with error handling
      if (typeof window !== 'undefined' && window.eventBus) {
        this.globalEventHandlers.statusChanged = (data) => {
          console.log('📡 Sidebar: User status change event:', data);
          this.handleStatusChange(data.newStatus, data.oldStatus);
        };
        
        this.globalEventHandlers.promocodeApplied = (data) => {
          console.log('📡 Sidebar: Promocode applied event:', data);
          this.handleStatusChange(data.newStatus, data.oldStatus);
          
          if (data.promocode && data.newStatus) {
            const planLabel = data.newStatus === 'pro' ? 'Pro' : 'Start';
            console.log(`🎉 Sidebar: Promocode ${data.promocode} activated ${planLabel} plan`);
          }
        };
        
        this.globalEventHandlers.subscriptionUpdated = (data) => {
          console.log('📡 Sidebar: Subscription updated event:', data);
          this.handleStatusChange(data.plan, data.oldPlan);
        };
        
        this.globalEventHandlers.forceUpdate = (data) => {
          console.log('📡 Sidebar: Force update event:', data);
          this.triggerReactivityUpdate();
        };
        
        // Register all event bus listeners
        window.eventBus.on('userStatusChanged', this.globalEventHandlers.statusChanged);
        window.eventBus.on('promocodeApplied', this.globalEventHandlers.promocodeApplied);
        window.eventBus.on('subscriptionUpdated', this.globalEventHandlers.subscriptionUpdated);
        window.eventBus.on('forceUpdate', this.globalEventHandlers.forceUpdate);
        window.eventBus.on('globalForceUpdate', this.globalEventHandlers.forceUpdate);
        
        console.log('✅ Sidebar: Event bus listeners registered');
      }
      
      // ✅ DOM event listener
      if (typeof window !== 'undefined') {
        window.addEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        console.log('✅ Sidebar: DOM event listener registered');
      }
      
      // ✅ Listen for localStorage changes (for cross-tab sync)
      this.globalEventHandlers.storageChange = (event) => {
        if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
          console.log('📡 Sidebar: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
          this.handleStatusChange(event.newValue, event.oldValue);
        }
      };
      
      window.addEventListener('storage', this.globalEventHandlers.storageChange);
    },
    
    // ✅ ENHANCED: Comprehensive cleanup
    cleanupGlobalListeners() {
      console.log('🧹 Sidebar: Cleaning up global event listeners');
      
      if (typeof window !== 'undefined') {
        // Remove DOM event listeners
        if (this.globalEventHandlers.subscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        }
        
        if (this.globalEventHandlers.storageChange) {
          window.removeEventListener('storage', this.globalEventHandlers.storageChange);
        }
        
        // Remove event bus listeners
        if (window.eventBus) {
          Object.keys(this.globalEventHandlers).forEach(key => {
            const handler = this.globalEventHandlers[key];
            if (typeof handler === 'function') {
              window.eventBus.off('userStatusChanged', handler);
              window.eventBus.off('promocodeApplied', handler);
              window.eventBus.off('subscriptionUpdated', handler);
              window.eventBus.off('forceUpdate', handler);
              window.eventBus.off('globalForceUpdate', handler);
            }
          });
        }
      }
      
      // Clear handlers object
      this.globalEventHandlers = {};
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
        // Delay notification to avoid showing multiple times
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
      
      // Force Vue reactivity
      this.$forceUpdate();
      
      // Additional delayed update
      this.$nextTick(() => {
        this.$forceUpdate();
      });
      
      console.log('🔄 Sidebar: Reactivity update triggered:', {
        componentKey: this.componentKey,
        reactivityKey: this.reactivityKey,
        currentStatus: this.userStatus
      });
    },
    
    // ✅ NEW: Status synchronization with store
    syncStatusWithStore() {
      try {
        const storeStatus = this.$store?.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus');
        
        console.log('🔄 Sidebar: Syncing status:', {
          store: storeStatus,
          localStorage: localStatus,
          computed: this.userStatus
        });
        
        // If there's a mismatch, prefer store over localStorage
        if (storeStatus && storeStatus !== localStatus) {
          console.log('⚠️ Sidebar: Status mismatch detected, syncing localStorage to store');
          localStorage.setItem('userStatus', storeStatus);
          this.triggerReactivityUpdate();
        }
        
        // If store is empty but localStorage has data, update store
        if (!storeStatus && localStatus && localStatus !== 'free') {
          console.log('⚠️ Sidebar: Store missing status, updating from localStorage');
          this.$store.commit('user/SET_USER_STATUS', localStatus);
          this.triggerReactivityUpdate();
        }
        
      } catch (error) {
        console.error('❌ Sidebar: Error syncing status:', error);
      }
    },
    
    // ✅ NEW: Show upgrade notification
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
        
        // Show loading state
        this.showLogoutModal = false;
        
        // Sign out from Firebase
        await signOut(auth);
        
        // Clear all store data
        this.clearUser();
        this.$store.commit('user/CLEAR_USER');
        this.$store.commit('setFirebaseUserId', null);
        
        // Clear local storage
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
        
        // Redirect after delay
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
    
    // ✅ ENHANCED: Better route matching
    isActive(name) {
      const path = this.$route.path;
      
      // Handle specific route matches
      const routeMatches = {
        main: ['/profile/main', '/profile', '/profile/'],
        catalogue: ['/profile/catalogue'],
        analytics: ['/profile/analytics'],
        goal: ['/profile/goal'],
        diary: ['/profile/diary'],
        homework: ['/profile/homework'],
        settings: ['/settings']
      };
      
      // Handle routes with sub-paths
      const routeStartsWith = {
        homeworks: '/profile/homeworks',
        tests: '/profile/tests',
        vocabulary: '/profile/vocabulary'
      };
      
      // Check exact matches first
      if (routeMatches[name]) {
        return routeMatches[name].includes(path);
      }
      
      // Check routes that can have sub-paths
      if (routeStartsWith[name]) {
        return path === routeStartsWith[name] || path.startsWith(routeStartsWith[name] + '/');
      }
      
      // Fallback to generic match
      return path.includes(`/profile/${name}`);
    },
    
    // ✅ NEW: Get user status badge color
    getStatusBadgeClass() {
      const status = this.currentStatus;
      return {
        'status-free': status === 'free',
        'status-start': status === 'start', 
        'status-pro': status === 'pro',
        'plan-updated': this.lastStatusUpdate > Date.now() - 5000 // Recently updated
      };
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
  font-family: 'Unbounded', sans-serif;
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
  font-family: 'Unbounded', sans-serif;
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