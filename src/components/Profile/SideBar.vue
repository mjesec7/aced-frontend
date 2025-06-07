<!-- SideBar.vue -->
<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- 👤 User Info - Fixed at top with proper spacing -->
        <div class="user-info" v-if="user">
          <div class="user-avatar">
            <span class="avatar-text">{{ getInitials(user.name || user.email) }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ user.name || user.email }}</span>
            <span class="user-plan" :class="userStatus">{{ planLabel }}</span>
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
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Главная</span>
          </router-link>

          <router-link
            to="/profile/catalogue"
            class="nav-item"
            :class="{ active: isActive('catalogue') }"
            @click="closeSidebarOnMobile"
          >
            <span class="nav-icon">📚</span>
            <span class="nav-text">Каталог</span>
          </router-link>

          <router-link
            v-for="link in links"
            :key="link.name"
            :to="getRoutePath(link.name)"
            class="nav-item"
            :class="{ active: isActive(link.name) }"
            @click="closeSidebarOnMobile"
          >
            <span class="nav-icon">{{ link.icon }}</span>
            <span class="nav-text">{{ link.label }}</span>
          </router-link>
        </div>

        <!-- 🚪 Logout - Fixed at bottom -->
        <div class="bottom-logout">
          <button class="logout-button" @click="showLogoutModal = true">
            <span class="logout-icon">🚪</span>
            <span>Выйти</span>
          </button>
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
    <Teleport to="body">
      <div class="logout-modal" v-if="showLogoutModal" @click.self="showLogoutModal = false">
        <div class="logout-modal-content" @click.stop>
          <div class="modal-icon">🚪</div>
          <h4>Выйти из аккаунта?</h4>
          <p>Вы уверены, что хотите выйти?</p>
          <div class="logout-actions">
            <button class="confirm-btn" @click="logout">Выйти</button>
            <button class="cancel-btn" @click="showLogoutModal = false">Отмена</button>
          </div>
        </div>
      </div>
    </Teleport>
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
        { name: 'analytics', label: 'Аналитика', icon: '📊' },
        { name: 'goal', label: 'Цели', icon: '🎯' },
        { name: 'diary', label: 'Дневник', icon: '📔' },
        { name: 'homework', label: 'Помощь с ДЗ', icon: '🤝' },
        { name: 'homeworks', label: 'Домашние задания', icon: '📝' },
        { name: 'tests', label: 'Тесты', icon: '📋' },
        { name: 'settings', label: 'Настройки', icon: '⚙️' }
      ],
      isMobile: false
    };
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters('user', ['userStatus']),
    planLabel() {
      if (this.userStatus === 'pro') return 'Pro';
      if (this.userStatus === 'start') return 'Start';
      return 'Free';
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.setUser({
          name: user.displayName || user.email?.split('@')[0],
          email: user.email,
          uid: user.uid
        });
      }
    });
  },
  beforeUnmount() {
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
    getInitials(name) {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    },
    logout() {
      signOut(auth)
        .then(() => {
          this.clearUser();
          this.showLogoutModal = false;
          this.$toast?.success('Вы успешно вышли из аккаунта.', {
            duration: 3000,
            position: 'top-center'
          });
          setTimeout(() => {
            this.$router.push('/');
          }, 1500);
        })
        .catch((err) => {
          console.error('❌ Ошибка выхода:', err.message);
          this.$toast?.error('Ошибка при выходе: попробуйте ещё раз.');
        });
    },
    getRoutePath(linkName) {
      if (linkName === 'settings') {
        return '/settings';
      }
      return `/profile/${linkName}`;
    },
    isActive(name) {
      const path = this.$route.path;
      
      if (name === 'main') {
        return path === '/profile/main' || path === '/profile' || path === '/profile/';
      }
      if (name === 'catalogue') {
        return path === '/profile/catalogue';
      }
      if (name === 'analytics') {
        return path === '/profile/analytics';
      }
      if (name === 'goal') {
        return path === '/profile/goal';
      }
      if (name === 'diary') {
        return path === '/profile/diary';
      }
      if (name === 'homework') {
        return path === '/profile/homework';
      }
      if (name === 'homeworks') {
        return path === '/profile/homeworks' || path.startsWith('/profile/homeworks/');
      }
      if (name === 'tests') {
        return path === '/profile/tests' || path.startsWith('/profile/tests/');
      }
      if (name === 'settings') {
        return path === '/settings';
      }
      
      return path.includes(`/profile/${name}`);
    }
  }
};
</script>

<style scoped>
/* ========================================
   🎨 SIDEBAR - CLEAN THEME
======================================== */
.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 280px;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  border-right: 1px solid #e5e7eb;
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
  backdrop-filter: blur(4px);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ========================================
   👤 USER INFO
======================================== */
.user-info {
  padding: 24px 20px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #ffffff;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  color: #ffffff;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.user-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.2;
  color: #1a1a1a;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-plan {
  font-size: 0.75rem;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.user-plan.free {
  background: #f3f4f6;
  color: #6b7280;
}

.user-plan.start {
  background: #f3f0ff;
  color: #8b5cf6;
}

.user-plan.pro {
  background: #1a1a1a;
  color: #ffffff;
}

/* ========================================
   📚 NAVIGATION LINKS
======================================== */
.nav-links {
  flex: 1;
  padding: 20px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-size: 0.9rem;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #6b7280;
  text-decoration: none;
  background-color: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  position: relative;
}

.nav-item:hover {
  background: #f9fafb;
  color: #1a1a1a;
  transform: translateX(2px);
}

.nav-item.active {
  background: #f3f0ff;
  color: #8b5cf6;
  font-weight: 600;
  border-left: 3px solid #8b5cf6;
  margin-left: -3px;
  padding-left: 19px;
}

.nav-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========================================
   🚪 LOGOUT SECTION
======================================== */
.bottom-logout {
  padding: 16px 20px 20px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: #ffffff;
}

.logout-button {
  padding: 12px 16px;
  background: #ef4444;
  color: #ffffff;
  border: none;
  font-size: 0.9rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 600;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logout-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.logout-icon {
  font-size: 1rem;
}

/* ========================================
   🔔 LOGOUT MODAL
======================================== */
.logout-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.logout-modal-content {
  background: #ffffff;
  padding: 32px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
  animation: modalSlideIn 0.3s ease-out;
  border: 1px solid #e5e7eb;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.logout-modal-content h4 {
  color: #1a1a1a;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.logout-modal-content p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.logout-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.confirm-btn,
.cancel-btn {
  padding: 12px 24px;
  font-size: 0.9rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  min-width: 100px;
}

.confirm-btn {
  background: #ef4444;
  color: #ffffff;
}

.confirm-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #f9fafb;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #f3f4f6;
  color: #1a1a1a;
  transform: translateY(-1px);
}

/* ========================================
   📱 RESPONSIVE DESIGN
======================================== */
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
    width: 260px;
  }
  
  .user-info {
    padding: 20px 16px 16px;
  }
  
  .nav-links {
    padding: 16px 12px 0;
  }
  
  .bottom-logout {
    padding: 12px 16px 16px;
  }
  
  .logout-modal-content {
    margin: 20px;
    padding: 28px 24px;
  }
  
  .logout-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .confirm-btn,
  .cancel-btn {
    width: 100%;
    min-width: unset;
  }
}
</style>

