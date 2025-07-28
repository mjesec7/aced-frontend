<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <div v-if="isAuthenticated" class="user-info">
          <img :src="userPhoto || defaultUserIcon" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-plan" :class="userPlanBadgeClass">📦 {{ planLabel }}</span>
          </div>
        </div>

        <div class="nav-links scrollable">
          <template v-for="item in navigationItems" :key="item.name">
            <router-link
              v-if="isFeatureAvailable(item.requiredPlan)"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item.name) }"
              @click="closeSidebarOnMobile"
            >
              <span class="highlight"></span>
              {{ item.label }}
            </router-link>

            <div
              v-else
              class="nav-item locked-feature"
              @click="showUpgradeModalForFeature(item)"
            >
              <span class="highlight"></span>
              <span class="link-content">
                {{ item.label }}
                <span class="lock-icon">🔒</span>
              </span>
            </div>
          </template>
        </div>

        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">Выйти</button>
        </div>
      </div>
    </div>

    <div
      v-if="isOpen && isMobile"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <div v-if="showUpgradeModal" class="upgrade-modal" @click.self="closeUpgradeModal">
      <div class="upgrade-modal-content" @click.stop>
        <div class="upgrade-header">
          <h3>Премиум функция</h3>
          <button class="close-btn" @click="closeUpgradeModal">×</button>
        </div>
        <div class="upgrade-body">
          <p><strong>{{ selectedFeature?.label }}</strong> доступно только в Start и Pro планах.</p>
          <div class="feature-benefits">
            <p>С Start или Pro планом вы получите:</p>
            <ul>
              <li>Полный доступ к аналитике</li>
              <li>Расширенные цели и планирование</li>
              <li>Помощь с домашними заданиями</li>
              <li>Продвинутые тесты</li>
              <li>Персональный словарь</li>
            </ul>
          </div>
        </div>
        <div class="upgrade-actions">
          <button class="upgrade-btn" @click="goToUpgrade">Обновить план</button>
          <button class="cancel-upgrade-btn" @click="closeUpgradeModal">Может позже</button>
        </div>
      </div>
    </div>

    <div v-if="showLogoutModal" class="logout-modal">
      <div class="logout-modal-content">
        <p>Вы уверены, что хотите выйти?</p>
        <div class="logout-actions">
          <button class="confirm-btn" @click="handleLogout">Да</button>
          <button class="cancel-btn" @click="showLogoutModal = false">Нет</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState, mapMutations } from 'vuex';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import defaultUserIcon from '@/assets/icons/user.png';
import { userStatusMixin } from '@/composables/useUserStatus';

export default {
  name: 'SideBar',

  mixins: [userStatusMixin],

  props: {
    isOpen: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      showLogoutModal: false,
      showUpgradeModal: false,
      selectedFeature: null,
      isMobile: false,
      defaultUserIcon,
      componentKey: 0,
      reactivityKey: 0,
      lastStatusUpdate: Date.now(),
      eventCleanupFunctions: [],
      storeUnsubscribe: null,
      globalEventHandlers: {},
      lastSyncTime: Date.now(),
      syncCheckInterval: null,
      notificationTimeout: null,
      
      // Navigation structure - single source of truth
      navigationItems: [
        { name: 'main',       to: '/profile/main',       label: 'Главная',          requiredPlan: 'free' },
        { name: 'catalogue',  to: '/profile/catalogue',  label: 'Каталог',          requiredPlan: 'free' },
        { name: 'analytics',  to: '/profile/analytics',  label: 'Аналитика',        requiredPlan: 'start' },
        { name: 'goal',       to: '/profile/goal',       label: 'Цели',             requiredPlan: 'start' },
        { name: 'diary',      to: '/profile/diary',      label: 'Дневник',          requiredPlan: 'free' },
        { name: 'homework',   to: '/profile/homework',   label: 'Помощь с ДЗ',      requiredPlan: 'start' },
        { name: 'homeworks',  to: '/profile/homeworks',  label: 'Домашние задания', requiredPlan: 'free' },
        { name: 'tests',      to: '/profile/tests',      label: 'Тесты',            requiredPlan: 'start' },
        { name: 'vocabulary', to: '/vocabulary',         label: 'Словарь',          requiredPlan: 'start' },
        { name: 'settings',   to: '/settings',           label: 'Настройки',        requiredPlan: 'free' },
      ]
    };
  },

  computed: {
    ...mapState(['user']),
    
    ...mapGetters('user', [
      'isAuthenticated',
      'userStatus',
      'userName',
      'userPhoto',
      'isPremiumUser',
      'isStartUser', 
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'subscriptionDetails',
      'forceUpdateCounter'
    ]),

    // Enhanced plan detection with fallbacks
    currentPlan() {
      // Priority 1: Check localStorage directly (most reliable)
      const localStatus = localStorage.getItem('userStatus');
      if (localStatus && ['free', 'start', 'pro'].includes(localStatus)) {
        console.log('✅ Sidebar: Using localStorage plan (priority 1):', localStatus);
        return localStatus;
      }
      
      // Priority 2: Check subscription data
      const subscriptionData = localStorage.getItem('subscriptionData');
      if (subscriptionData) {
        try {
          const parsed = JSON.parse(subscriptionData);
          if (parsed && parsed.plan && parsed.expiryDate) {
            const now = new Date();
            const expiry = new Date(parsed.expiryDate);
            if (now < expiry) {
              console.log('✅ Sidebar: Using subscription plan (priority 2):', parsed.plan);
              return parsed.plan;
            }
          }
        } catch (e) {
          console.warn('⚠️ Sidebar: Failed to parse subscription data');
        }
      }
      
      // Priority 3: Check store getter
      if (this.userStatus && ['free', 'start', 'pro'].includes(this.userStatus)) {
        console.log('✅ Sidebar: Using store getter (priority 3):', this.userStatus);
        return this.userStatus;
      }
      
      // Priority 4: Check backup getter if available
      if (window.getWorkingUserStatus) {
        const backupStatus = window.getWorkingUserStatus();
        if (backupStatus && ['free', 'start', 'pro'].includes(backupStatus)) {
          console.log('✅ Sidebar: Using backup getter (priority 4):', backupStatus);
          return backupStatus;
        }
      }
      
      console.log('⚠️ Sidebar: All methods failed, defaulting to free');
      return 'free';
    },

    userPlanBadgeClass() {
      return `status-${this.currentPlan || 'free'}`;
    },
    
    planLabel() {
      const labels = {
        free: 'Free',
        start: 'Start',
        pro: 'Pro',
        premium: 'Pro' // Assuming 'premium' and 'pro' have the same label
      };
      return labels[this.currentPlan] || 'Free';
    }
  },

  watch: {
    userStatus: {
      handler(newStatus, oldStatus) {
        this.handleStatusChange(newStatus, oldStatus);
        this.lastSyncTime = Date.now();
      },
      immediate: true
    },
    
    forceUpdateCounter: {
      handler(newCounter, oldCounter) {
        this.triggerReactivityUpdate();
      },
      immediate: true
    },
    
    user: {
      handler(newUser, oldUser) {
        if (newUser && (!oldUser || oldUser.email !== newUser.email)) {
          this.componentKey++;
        }
      },
      deep: true,
      immediate: true
    },
    
    subscriptionDetails: {
      handler(newSub, oldSub) {
        if (newSub !== oldSub) {
          this.triggerReactivityUpdate();
        }
      },
      deep: true,
      immediate: true
    },
    
    hasActiveSubscription: {
      handler(hasSubscription, hadSubscription) {
        if (hasSubscription !== hadSubscription) {
          this.triggerReactivityUpdate();
        }
      },
      immediate: true
    },

    '$store.state.user.userStatus': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          this.triggerReactivityUpdate();
          this.lastSyncTime = Date.now();
        }
      },
      immediate: true
    }
  },

  created() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);

    // Firebase auth state listener
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL
        };
        
        this.saveUser({ userData: firebaseUser, token: firebaseUser.accessToken });
      } else {
        this.logout();
      }
    });

    this.setupGlobalListeners();
    this.syncStatusWithStore();
    this.setupPeriodicSync();
  },

  mounted() {
    // Store subscription for watching mutations
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
        this.handleStoreUpdate(mutation);
      }
    });
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    this.cleanupGlobalListeners();
    
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null;
    }
    
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  },

  methods: {
    ...mapActions('user', [
      'saveUser',
      'logout',
    ]),

    ...mapMutations(['setUser', 'clearUser']),

    // Core feature availability logic
    isFeatureAvailable(requiredPlan) {
      if (requiredPlan === 'free') return true;
      
      const currentPlan = this.currentPlan;
      
      // Pro and Premium users get access to everything above 'free'
      if (currentPlan === 'pro' || currentPlan === 'premium') return true;
      
      // Start users get access to start-level features
      return currentPlan === 'start' && requiredPlan === 'start';
    },

    // Route activity detection
    isActive(routeName) {
      const currentPath = this.$route.path;
      const item = this.navigationItems.find(nav => nav.name === routeName);
      if (!item) return false;

      const startsWithMatches = ['homework', 'homeworks', 'tests'];
      if (startsWithMatches.includes(routeName)) {
        return currentPath.startsWith(item.to);
      }
      
      if (routeName === 'main') {
        return ['/profile/main', '/profile', '/profile/'].includes(currentPath);
      }

      return currentPath === item.to;
    },

    // Modal and UI Methods
    showUpgradeModalForFeature(feature) {
      const currentPlan = this.currentPlan;
      
      console.log('🚨 MODAL TRIGGERED:', {
        featureName: feature.name,
        currentPlan: currentPlan,
        shouldShow: currentPlan === 'free',
        userStatus: this.userStatus,
        localStorage: localStorage.getItem('userStatus')
      });
      
      // Don't show modal if user has paid plan
      if (currentPlan === 'start' || currentPlan === 'pro') {
        console.log('🛑 BLOCKING MODAL - User has paid plan:', currentPlan);
        return;
      }
      
      console.log('💰 SHOWING MODAL - User on free plan');
      this.selectedFeature = feature;
      this.showUpgradeModal = true;
    },

    closeUpgradeModal() {
      this.showUpgradeModal = false;
      this.selectedFeature = null;
    },

    goToUpgrade() {
      this.closeUpgradeModal();
      this.$router.push('/settings');
      this.closeSidebarOnMobile();
    },

    async handleLogout() {
      this.showLogoutModal = false;
      
      try {
        await signOut(auth);
        
        // Clear user data
        this.clearUser();
        this.$store.commit('user/CLEAR_USER');
        this.$store.commit('setFirebaseUserId', null);
        
        // Clear localStorage
        const keysToRemove = ['firebaseUserId', 'userId', 'userStatus', 'subscriptionDetails', 'appliedPromocodes'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        if (this.$toast) {
          this.$toast.success('Вы успешно вышли из аккаунта.');
        }
        
        setTimeout(() => {
          this.$router.push('/');
        }, 1500);
        
      } catch (error) {
        console.error('Sidebar Logout Error:', error);
        if (this.$toast) {
          this.$toast.error('Ошибка при выходе. Пожалуйста, попробуйте еще раз.');
        }
      }
    },

    // Mobile Responsiveness
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

    // Status management and reactivity
    handleStatusChange(newStatus, oldStatus) {
      this.lastStatusUpdate = Date.now();
      this.triggerReactivityUpdate();
      this.onUserStatusChanged(newStatus, oldStatus);
    },
    
    handleStoreUpdate(mutation) {
      this.triggerReactivityUpdate();
      
      this.$nextTick(() => {
        setTimeout(() => {
          this.triggerReactivityUpdate();
        }, 100);
      });
    },
    
    triggerReactivityUpdate() {
      this.componentKey++;
      this.reactivityKey++;
      this.lastStatusUpdate = Date.now();
      this.lastSyncTime = Date.now();
      
      this.$forceUpdate();
      
      this.$nextTick(() => {
        this.$forceUpdate();
        
        setTimeout(() => {
          this.$forceUpdate();
        }, 50);
      });
    },

    syncStatusWithStore() {
      try {
        const storeStatus = this.$store?.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus');
        const currentTime = Date.now();
        
        if (storeStatus && storeStatus !== localStatus) {
          localStorage.setItem('userStatus', storeStatus);
          this.triggerReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
        if (!storeStatus || storeStatus === 'free') {
          if (localStatus && localStatus !== 'free' && localStatus !== storeStatus) {
            this.$store.commit('user/SET_USER_STATUS', localStatus);
            this.triggerReactivityUpdate();
            this.lastSyncTime = currentTime;
          }
        }
        
        if (currentTime - this.lastSyncTime > 60000) {
          this.triggerReactivityUpdate();
          this.lastSyncTime = currentTime;
        }
        
      } catch (error) {
        console.error('Sidebar: Error syncing status:', error);
      }
    },

    onUserStatusChanged(newStatus, oldStatus) {
      if (oldStatus && oldStatus !== newStatus && newStatus && newStatus !== 'free') {
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
          this.showUpgradeNotification(newStatus, 'subscription-change');
        }, 500);
      }
    },

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
      
      const message = `Поздравляем! Теперь у вас ${planLabel} подписка по ${sourceText}!`;
      
      if (this.$toast) {
        this.$toast.success(message, {
          duration: 5000,
          position: 'top-center'
        });
      }
    },

    setupPeriodicSync() {
      if (this.syncCheckInterval) {
        clearInterval(this.syncCheckInterval);
      }

      this.syncCheckInterval = setInterval(() => {
        this.syncStatusWithStore();
      }, 30000);
    },

    setupGlobalListeners() {
      this.globalEventHandlers.subscriptionChange = (event) => {
        const { plan, source, oldPlan } = event.detail;
        this.handleStatusChange(plan, oldPlan);
        
        this.$nextTick(() => {
          if (plan && plan !== 'free' && oldPlan === 'free') {
            this.showUpgradeNotification(plan, source);
          }
        });
      };
      
      if (typeof window !== 'undefined' && window.eventBus) {
        this.globalEventHandlers.statusChanged = (data) => {
          this.handleStatusChange(data.newStatus, data.oldStatus);
        };
        
        this.globalEventHandlers.promocodeApplied = (data) => {
          this.handleStatusChange(data.newStatus, data.oldStatus);
        };
        
        this.globalEventHandlers.subscriptionUpdated = (data) => {
          this.handleStatusChange(data.plan, data.oldPlan);
        };
        
        this.globalEventHandlers.forceUpdate = (data) => {
          this.triggerReactivityUpdate();
        };
        
        this.globalEventHandlers.storeChanged = (data) => {
          this.syncStatusWithStore();
          this.triggerReactivityUpdate();
        };
        
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
      }
      
      if (typeof window !== 'undefined') {
        window.addEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        
        this.globalEventHandlers.storageChange = (event) => {
          if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
            this.handleStatusChange(event.newValue, event.oldValue);
            this.syncStatusWithStore();
          }
        };
        
        window.addEventListener('storage', this.globalEventHandlers.storageChange);
      }
    },

    cleanupGlobalListeners() {
      if (typeof window !== 'undefined') {
        if (this.globalEventHandlers.subscriptionChange) {
          window.removeEventListener('userSubscriptionChanged', this.globalEventHandlers.subscriptionChange);
        }
        
        if (this.globalEventHandlers.storageChange) {
          window.removeEventListener('storage', this.globalEventHandlers.storageChange);
        }
        
        this.eventCleanupFunctions.forEach(cleanup => {
          try {
            cleanup();
          } catch (error) {
            console.warn('Event cleanup function failed:', error);
          }
        });
      }
      
      this.globalEventHandlers = {};
      this.eventCleanupFunctions = [];
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

.user-plan.status-free {
  background: #cbd5e1;
  color: #4a5568;
}

.user-plan.status-start {
  background: #a78bfa;
  color: #ffffff;
}

.user-plan.status-pro,
.user-plan.status-premium {
  background: #1f2937;
  color: #ffffff;
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
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

.nav-item.locked-feature {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: pointer;
  border: 1px dashed #cbd5e1;
}

.nav-item.locked-feature:hover {
  background: linear-gradient(to right, #fef3c7, #fde68a);
  color: #92400e;
  border-color: #f59e0b;
  transform: translateX(2px);
}

.nav-item.locked-feature .highlight {
  background: linear-gradient(to bottom, #f59e0b, #d97706);
}

.link-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.lock-icon {
  font-size: 0.75rem;
  opacity: 0.7;
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
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 600;
  min-height: 36px;
}

.logout-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.upgrade-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.upgrade-modal-content {
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: 'Inter', sans-serif;
  animation: upgradeModalAppear 0.3s ease-out;
}

@keyframes upgradeModalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.upgrade-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px 16px 0 0;
}

.upgrade-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.upgrade-body {
  padding: 24px;
}

.upgrade-body p {
  margin: 0 0 16px;
  color: #374151;
  line-height: 1.6;
}

.feature-benefits {
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  margin-top: 16px;
}

.feature-benefits p {
  margin: 0 0 12px;
  font-weight: 600;
  color: #1f2937;
}

.feature-benefits ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.feature-benefits li {
  padding: 6px 0;
  color: #4b5563;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upgrade-actions {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
}

.upgrade-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.cancel-upgrade-btn {
  flex: 1;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-upgrade-btn:hover {
  background: #e5e7eb;
  color: #4b5563;
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
  font-family: 'Inter', sans-serif;
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

@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0) !important;
  }
  
  .sidebar-overlay {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .sidebar {
    z-index: 1001;
  }
  
  .upgrade-modal-content {
    max-width: 95%;
    margin: 20px;
  }
  
  .upgrade-header {
    padding: 20px 20px 16px;
  }
  
  .upgrade-body {
    padding: 20px;
  }
  
  .upgrade-actions {
    padding: 16px 20px 20px;
    flex-direction: column;
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