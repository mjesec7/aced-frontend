<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <div v-if="user" class="user-info">
          <img src="@/assets/icons/user.png" alt="User Icon" class="user-icon" />
          <div class="user-details">
            <span class="user-name">{{ userDisplayName }}</span>
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
          <button class="confirm-btn" @click="logout">Да</button>
          <button class="cancel-btn" @click="showLogoutModal = false">Нет</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

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
      showUpgradeModal: false,
      selectedFeature: null,
      isMobile: false,
      // DATA-DRIVEN NAVIGATION: The single source of truth for all nav links
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
    // Relying completely on Vuex for state
    ...mapState('user', ['user']),
    ...mapGetters('user', ['userPlan', 'userDisplayName']),

    planLabel() {
      const labels = { free: 'Free', start: 'Start', pro: 'Pro' };
      return labels[this.userPlan] || 'Free';
    },

    userPlanBadgeClass() {
      return `status-${this.userPlan || 'free'}`;
    }
  },

  created() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);

    // Set up a single, clean auth state listener
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Dispatch one action to handle the entire user session sync
        this.syncUserSession(firebaseUser);
      } else {
        // Dispatch one action to clear the session
        this.clearUserSession();
      }
    });
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },

  methods: {
    // Map actions from Vuex for clean, reusable logic
    ...mapActions('user', ['syncUserSession', 'clearUserSession', 'logoutUser']),

    /**
     * Determines if a feature should be accessible based on the user's plan.
     * This logic is now simple, centralized, and easy to understand.
     * 'pro' users get access to everything.
     * 'start' users get access to 'start' and 'free' features.
     */
    isFeatureAvailable(requiredPlan) {
      if (requiredPlan === 'free') return true;
      if (this.userPlan === 'pro') return true;
      return this.userPlan === 'start' && requiredPlan === 'start';
    },

    isActive(routeName) {
      const currentPath = this.$route.path;
      const item = this.navigationItems.find(nav => nav.name === routeName);
      if (!item) return false;

      // Handle routes that have sub-paths (e.g., /profile/homework/1)
      const startsWithMatches = ['homework', 'homeworks', 'tests'];
      if (startsWithMatches.includes(routeName)) {
        return currentPath.startsWith(item.to);
      }
      
      // Handle /profile being an alias for /profile/main
      if (routeName === 'main') {
        return ['/profile/main', '/profile', '/profile/'].includes(currentPath);
      }

      // Default to exact path matching
      return currentPath === item.to;
    },

    showUpgradeModalForFeature(feature) {
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
      this.showLogoutModal = false;
      try {
        await this.logoutUser();
        if (this.$toast) {
          this.$toast.success('Вы успешно вышли из аккаунта.', {
            duration: 3000,
            position: 'top-center'
          });
        }
        // Redirect to home page after logout
        this.$router.push('/');
      } catch (error) {
        console.error('Sidebar: Logout error:', error);
        if (this.$toast) {
          this.$toast.error('Ошибка при выходе. Пожалуйста, попробуйте еще раз.');
        } else {
          alert('Ошибка при выходе. Пожалуйста, попробуйте еще раз.');
        }
      }
    }
  }
};
</script>

<style scoped>
/* All original styles are preserved. No changes are needed. */
/* ... Paste the original <style> content here ... */
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

.user-plan.status-pro {
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