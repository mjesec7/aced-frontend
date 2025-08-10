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

          <!-- ✅ ENHANCED: Dynamic links with access control -->
          <template v-for="link in filteredLinks" :key="link.name">
            <router-link
              v-if="hasAccessToFeature(link.feature)"
              :to="getRoutePath(link.name)"
              class="nav-item"
              :class="{ 
                active: isActive(link.name),
                'premium-feature': link.premium && !hasAccessToFeature(link.feature)
              }"
              @click="handleLinkClick(link)"
            >
              <span class="highlight"></span>
              <span class="link-content">
                {{ link.label }}
                <span v-if="link.premium && !hasAccessToFeature(link.feature)" class="premium-badge">✨</span>
              </span>
            </router-link>
            
            <!-- ✅ NEW: Locked feature item for premium features -->
            <div
              v-else-if="link.premium"
              class="nav-item locked-feature"
              @click="showUpgradeModalForFeature(link)"
            >
              <span class="highlight"></span>
              <span class="link-content">
                {{ link.label }}
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
      class="sidebar-overlay" 
      v-if="isOpen && isMobile" 
      @click="closeSidebar"
    ></div>

    <!-- ✅ NEW: Upgrade Modal -->
    <div class="upgrade-modal" v-if="showUpgradeModal" @click.self="closeUpgradeModal">
      <div class="upgrade-modal-content" @click.stop>
        <div class="upgrade-header">
          <h3>✨ Премиум функция</h3>
          <button class="close-btn" @click="closeUpgradeModal">×</button>
        </div>
        <div class="upgrade-body">
          <p><strong>{{ selectedFeature?.label }}</strong> доступно только в Start и Pro планах.</p>
          <div class="feature-benefits">
            <p>С Start или Pro планом вы получите:</p>
            <ul>
              <li>✅ Полный доступ к аналитике</li>
              <li>✅ Расширенные цели и планирование</li>
              <li>✅ Помощь с домашними заданиями</li>
              <li>✅ Продвинутые тесты</li>
              <li>✅ Персональный словарь</li>
              <li v-if="selectedFeature?.name === 'analytics'">📊 Детальная статистика прогресса</li>
              <li v-if="selectedFeature?.name === 'homework'">🤖 ИИ-помощник для ДЗ</li>
              <li v-if="selectedFeature?.name === 'tests'">📝 Безлимитные тесты</li>
            </ul>
          </div>
          <div class="debug-info" v-if="$store.state.isDev">
            <small>Debug: Current plan = {{ currentPlan }}</small>
          </div>
        </div>
        <div class="upgrade-actions">
          <button class="upgrade-btn" @click="goToUpgrade">
            Обновить план
          </button>
          <button class="cancel-upgrade-btn" @click="closeUpgradeModal">
            Может позже
          </button>
        </div>
      </div>
    </div>

    <!-- ✅ EXISTING: Logout Modal -->
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
      
      // ✅ ENHANCED: Links with fixed access control configuration
      links: [
        { 
          name: 'analytics', 
          label: 'Аналитика', 
          feature: 'analytics',
          premium: true, // Requires Pro only
          requiredPlans: ['pro'] // Changed to match router - analytics requires Pro
        },
        { 
          name: 'goal', 
          label: 'Цели', 
          feature: 'goals',
          premium: true, // Requires Start or Pro
          requiredPlans: ['start', 'pro']
        },
        { 
          name: 'diary', 
          label: 'Дневник', 
          feature: 'diary',
          premium: false, // Free for everyone
          requiredPlans: ['free', 'start', 'pro']
        },
        { 
          name: 'homework', 
          label: 'Помощь с ДЗ', 
          feature: 'homework_help',
          premium: true, // Requires Start or Pro
          requiredPlans: ['start', 'pro']
        },
        { 
          name: 'homeworks', 
          label: 'Домашние задания', 
          feature: 'homeworks',
          premium: false, // Free for everyone
          requiredPlans: ['free', 'start', 'pro']
        },
        { 
          name: 'tests', 
          label: 'Тесты', 
          feature: 'tests',
          premium: true, // Requires Start or Pro
          requiredPlans: ['start', 'pro']
        },
        { 
          name: 'vocabulary', 
          label: 'Словарь', 
          feature: 'vocabulary',
          premium: true, // Requires Start or Pro
          requiredPlans: ['start', 'pro'] // Match router requirement
        },
        { 
          name: 'settings', 
          label: 'Настройки', 
          feature: 'settings',
          premium: false, // Free for everyone
          requiredPlans: ['free', 'start', 'pro']
        }
      ],
      
      isMobile: false,
      componentKey: 0,
      reactivityKey: 0,
      lastStatusUpdate: Date.now(),
      eventCleanupFunctions: [],
      storeUnsubscribe: null,
      globalEventHandlers: {},
      lastSyncTime: Date.now(),
      syncCheckInterval: null,
      notificationTimeout: null
    };
  },
  
  computed: {
    ...mapState(['user']),
    
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
    
    // ✅ ENHANCED: Current effective user plan with multiple sources and validation
    currentPlan() {
      const key = this.reactivityKey; // Force reactivity
      
      // Try multiple sources for the current plan with priority order
      const storeStatus = this.userStatus;
      const localStatus = localStorage.getItem('userStatus');
      const subscriptionData = localStorage.getItem('subscriptionData');
      
      
      
      // ✅ CRITICAL: Check subscription data first for active subscriptions
      let subscriptionPlan = null;
      if (subscriptionData) {
        try {
          const parsed = JSON.parse(subscriptionData);
          if (parsed.plan && parsed.expiryDate) {
            const now = new Date();
            const expiry = new Date(parsed.expiryDate);
            if (now < expiry && parsed.plan !== 'free') {
              subscriptionPlan = parsed.plan;
            } else {
            }
          }
        } catch (e) {
        }
      }
      
      // Priority: subscription > store > localStorage > default
      let effectiveStatus = subscriptionPlan || storeStatus || localStatus || 'free';
      
      // ✅ CRITICAL: Handle string 'undefined' and null cases
      if (effectiveStatus === 'undefined' || effectiveStatus === null || effectiveStatus === undefined || effectiveStatus === '') {
        effectiveStatus = subscriptionPlan || localStatus || 'free';
      }
      
      // ✅ CRITICAL: Validate the plan value
      const validPlans = ['free', 'start', 'pro'];
      if (!validPlans.includes(effectiveStatus)) {
        effectiveStatus = localStatus && validPlans.includes(localStatus) ? localStatus : 'free';
      }
      
      
      return effectiveStatus;
    },
    
    // ✅ NEW: Filtered links based on access control
    filteredLinks() {
      return this.links.filter(link => {
        // Always show all links, but we'll handle access in the template
        return true;
      });
    },
    
    planLabel() {
      return this.userStatusLabel || 'Free';
    },
    
    userDisplayName() {
      const key = this.componentKey;
      if (!this.user) return 'Пользователь';
      return this.user.name || this.user.displayName || this.user.email?.split('@')[0] || 'Пользователь';
    },
    
    userStatusBadgeClass() {
      return this.getStatusBadgeClass();
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
  
  mounted() {
    
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    
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
        
        this.setUser(userData);
        this.$store.commit('setFirebaseUserId', firebaseUser.uid);
        localStorage.setItem('firebaseUserId', firebaseUser.uid);
        
      } else {
        this.clearUser();
        this.$store.commit('setFirebaseUserId', null);
        localStorage.removeItem('firebaseUserId');
      }
    });
    
    this.setupGlobalListeners();
    
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
    
    this.syncStatusWithStore();
    this.setupPeriodicSync();
    
    // ✅ NEW: Add immediate status check and sync on mount
    this.$nextTick(() => {
      this.forceSyncStatus();
      
      // Small delay to ensure reactivity
      setTimeout(() => {
        this.debugAccessStatus();
      }, 100);
    });
    
    // ✅ NEW: Setup debug tools
    this.setupDebugTools();
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
    ...mapMutations(['setUser', 'clearUser']),
    
    // ✅ ENHANCED: Check if user has access to a specific feature with better logging
    hasAccessToFeature(feature) {
      const plan = this.currentPlan;
      
      
      // Find the link configuration for this feature
      const linkConfig = this.links.find(link => link.feature === feature);
      if (!linkConfig) {
        return true; // Default to allowing access for unknown features
      }
      
      
      
      // ✅ CRITICAL FIX: Always allow access if not premium
      if (!linkConfig.premium) {
        return true;
      }
      
      // ✅ CRITICAL FIX: Handle 'free' status properly
      if (plan === 'free' || !plan || plan === 'undefined' || plan === null) {
        return false;
      }
      
      // ✅ CRITICAL FIX: Check if current plan is in the required plans
      const hasAccess = linkConfig.requiredPlans && linkConfig.requiredPlans.includes(plan);
      
      
      
      return hasAccess;
    },
    
    // ✅ ENHANCED: Handle link clicks with proper access control
    handleLinkClick(link) {
      
      const hasAccess = this.hasAccessToFeature(link.feature);
      
      // ✅ CRITICAL: Only show modal for premium features that user can't access
      if (link.premium && !hasAccess) {
        this.showUpgradeModalForFeature(link);
        return false;
      }
      
      this.closeSidebarOnMobile();
      
      return true;
    },
    
    // ✅ FIXED: Rename method to avoid conflict
    showUpgradeModalForFeature(link) {
      this.selectedFeature = link;
      this.showUpgradeModal = true;
    },
    
    // ✅ NEW: Close upgrade modal
    closeUpgradeModal() {
      this.showUpgradeModal = false;
      this.selectedFeature = null;
    },
    
    // ✅ NEW: Navigate to upgrade/settings page
    goToUpgrade() {
      this.closeUpgradeModal();
      this.$router.push('/settings');
      this.closeSidebarOnMobile();
    },
    
    // ✅ ENHANCED: Force status sync and update
    forceSyncStatus() {
      
      // Get all possible status sources
      const storeStatus = this.$store?.getters['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      const subscriptionData = localStorage.getItem('subscriptionData');
      
 
      
      // If we have subscription data but statuses don't match, fix it
      if (subscriptionData) {
        try {
          const parsed = JSON.parse(subscriptionData);
          if (parsed.plan && parsed.expiryDate) {
            const now = new Date();
            const expiry = new Date(parsed.expiryDate);
            if (now < expiry && parsed.plan !== 'free') {
              // We have a valid subscription, ensure all statuses match
              if (localStatus !== parsed.plan) {
                localStorage.setItem('userStatus', parsed.plan);
                localStorage.setItem('userPlan', parsed.plan);
                localStorage.setItem('subscriptionPlan', parsed.plan);
              }
              
              if (storeStatus !== parsed.plan) {
                this.$store.commit('user/SET_USER_STATUS', parsed.plan);
              }
              
              this.triggerReactivityUpdate();
            }
          }
        } catch (error) {
          console.error('❌ Sidebar: Error parsing subscription data:', error);
        }
      }
    },
    
    // ✅ ENHANCED: Add debug method to check current access status
    debugAccessStatus() {

      
      this.links.forEach(link => {
        const hasAccess = this.hasAccessToFeature(link.feature);
      });
      
      return {
        currentPlan: this.currentPlan,
        storeStatus: this.$store?.getters['user/userStatus'],
        localStatus: localStorage.getItem('userStatus'),
        subscriptionExists: !!localStorage.getItem('subscriptionData')
      };
    },
    
    // ✅ NEW: Setup debug tools
    setupDebugTools() {
      // Make debug tools available globally
      window.sidebarDebug = {
        // Check current sidebar access status
        checkAccess: () => {
          return this.debugAccessStatus();
        },
        
        // Force sync sidebar status
        forceSync: () => {
          this.forceSyncStatus();
          return 'Status synced';
        },
        
        // Get detailed plan information
        getPlanInfo: () => {
          return {
            currentPlan: this.currentPlan,
            userStatus: this.userStatus,
            storeGetter: this.$store.getters['user/userStatus'],
            localStorage: localStorage.getItem('userStatus'),
            subscription: localStorage.getItem('subscriptionData'),
            reactivityKey: this.reactivityKey
          };
        },
        
        // Test specific feature access
        testFeature: (featureName) => {
          const hasAccess = this.hasAccessToFeature(featureName);
          return hasAccess;
        },
        
        // Force reactivity update
        forceUpdate: () => {
          this.triggerReactivityUpdate();
          return 'Reactivity updated';
        }
      };
      
     
    },
    
    onUserStatusChanged(newStatus, oldStatus) {
      if (oldStatus && oldStatus !== newStatus && newStatus && newStatus !== 'free') {
        clearTimeout(this.notificationTimeout);
        this.notificationTimeout = setTimeout(() => {
          this.showUpgradeNotification(newStatus, 'subscription-change');
        }, 500);
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
          
          if (data.promocode && data.newStatus) {
            const planLabel = data.newStatus === 'pro' ? 'Pro' : 'Start';
          }
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
          }
        });
      }
      
      this.globalEventHandlers = {};
      this.eventCleanupFunctions = [];
    },
    
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
        console.error('❌ Sidebar: Error syncing status:', error);
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
      
      const message = `🎉 Поздравляем! Теперь у вас ${planLabel} подписка по ${sourceText}!`;
      
      if (this.$toast) {
        this.$toast.success(message, {
          duration: 5000,
          position: 'top-center'
        });
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
    
    async logout() {
      try {
        this.showLogoutModal = false;
        
        await signOut(auth);
        
        this.clearUser();
        this.$store.commit('user/CLEAR_USER');
        this.$store.commit('setFirebaseUserId', null);
        
        const keysToRemove = ['firebaseUserId', 'userId', 'userStatus', 'subscriptionDetails', 'appliedPromocodes'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        if (this.$toast) {
          this.$toast.success('Вы успешно вышли из аккаунта.', {
            duration: 3000,
            position: 'top-center'
          });
        }
        
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
    
    // ✅ UPDATED: Route path logic to handle vocabulary correctly
    getRoutePath(linkName) {
      if (linkName === 'settings') {
        return '/settings';
      }
      // ✅ FIXED: Vocabulary now goes to profile vocabulary
      if (linkName === 'vocabulary') {
        return '/profile/vocabulary';
      }
      return `/profile/${linkName}`;
    },
    
    // ✅ UPDATED: Active check logic to handle vocabulary correctly
    isActive(name) {
      const path = this.$route.path;
      
      const exactMatches = {
        main: ['/profile/main', '/profile', '/profile/'],
        catalogue: ['/profile/catalogue'],
        analytics: ['/profile/analytics'],
        goal: ['/profile/goal'],
        diary: ['/profile/diary'],
        settings: ['/settings'],
        vocabulary: ['/profile/vocabulary'] // ✅ FIXED: Updated to profile vocabulary path
      };
      
      const startsWithMatches = {
        homework: '/profile/homework',
        homeworks: '/profile/homeworks',
        tests: '/profile/tests'
      };
      
      if (exactMatches[name] && exactMatches[name].includes(path)) {
        return true;
      }
      
      if (startsWithMatches[name] && path.startsWith(startsWithMatches[name])) {
        if (name === 'homework') {
          return path === '/profile/homework' || path.startsWith('/profile/homework/');
        }
        return true;
      }
      
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

/* Enhanced styles for user-plan based on status */
.user-plan.status-free {
  background: #cbd5e1;
  color: #4a5568;
}

.user-plan.status-start {
  background: #a78bfa;
  color: #ffffff;
}

.user-plan.status-pro {
  background: #1f2937;
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

/* ✅ NEW: Locked feature styles */
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

.premium-badge {
  font-size: 0.75rem;
  opacity: 0.8;
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

/* ✅ NEW: Upgrade Modal Styles */
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

/* ✅ EXISTING: Logout Modal */
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