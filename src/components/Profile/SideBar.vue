<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- 👤 User Info - Fixed at top -->
        <div class="user-info" v-if="user">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-plan">📦 {{ planLabel }}</span>
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
        // ✅ UPDATED: Vocabulary now points to standalone VocabularyPage
        { name: 'vocabulary', label: 'Словарь' },
        { name: 'settings', label: 'Настройки' }
      ],
      isMobile: false,
      // ✅ Track component update state
      componentKey: 0
    };
  },
  computed: {
    ...mapState(['user']),
    // ✅ FIXED: Map all needed user getters from store
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser',
      'isStartUser', 
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription'
    ]),
    
    // ✅ ENHANCED: Better plan label with reactive updates
    planLabel() {
      const status = this.userStatus;
      console.log('📊 Sidebar: Computing plan label for status:', status);
      
      if (status === 'pro') return 'Pro';
      if (status === 'start') return 'Start';
      return 'Free';
    },
    
    // ✅ NEW: Computed property to track user info changes
    userDisplayName() {
      if (!this.user) return 'Пользователь';
      return this.user.name || this.user.displayName || this.user.email?.split('@')[0] || 'Пользователь';
    }
  },
  
  // ✅ ADDED: Watchers for store changes
  watch: {
    // ✅ Watch for user status changes from store
    userStatus: {
      handler(newStatus, oldStatus) {
        console.log('📊 Sidebar: User status changed from', oldStatus, 'to:', newStatus);
        
        // Force component reactivity update
        this.componentKey++;
        
        // Optional: Show notification for subscription changes
        if (oldStatus && oldStatus !== newStatus) {
          console.log('🔄 Sidebar: Plan changed, updating UI...');
          
          // Force re-render of plan label
          this.$nextTick(() => {
            this.$forceUpdate();
          });
        }
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
        }
      },
      deep: true,
      immediate: true
    },
    
    // ✅ Watch for subscription status changes
    hasActiveSubscription: {
      handler(hasSubscription) {
        console.log('💳 Sidebar: Subscription status changed to:', hasSubscription);
        this.componentKey++;
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
    
    // ✅ Listen for store subscription updates
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'user/SET_USER_STATUS') {
        console.log('📊 Sidebar: Store subscription detected status change:', mutation.payload);
        this.componentKey++;
      }
    });
  },
  
  beforeUnmount() {
    console.log('🔧 Sidebar: Component unmounting');
    window.removeEventListener('resize', this.checkMobile);
  },
  
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    
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
        this.$store.commit('user/CLEAR_USER_STATUS');
        this.$store.commit('setFirebaseUserId', null);
        
        // Clear local storage
        localStorage.removeItem('firebaseUserId');
        localStorage.removeItem('userId');
        localStorage.removeItem('userStatus');
        
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
      // ✅ All links go to profile routes (including vocabulary)
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
    
    // ✅ NEW: Force component update method
    forceUpdate() {
      console.log('🔄 Sidebar: Forcing component update');
      this.componentKey++;
      this.$forceUpdate();
    },
    
    // ✅ NEW: Get user status badge color
    getStatusBadgeClass() {
      const status = this.userStatus;
      if (status === 'pro') return 'status-pro';
      if (status === 'start') return 'status-start';
      return 'status-free';
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