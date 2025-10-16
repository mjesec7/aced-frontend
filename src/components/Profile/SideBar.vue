<template>
  <div class="sidebar-wrapper">
    <div class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- User Profile Card -->
        <div class="user-card" v-if="user">
          <div class="user-avatar">
            <img src="@/assets/icons/user.png" alt="Avatar" />
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ userDisplayName }}</h3>
            <span class="user-badge" :class="userStatusBadgeClass">
              {{ planLabel }}
            </span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="nav-menu">
          <router-link
            v-for="link in navigationLinks"
            :key="link.name"
            :to="link.path"
            class="nav-link"
            :class="{ 
              active: isActive(link.name),
              locked: link.premium && !hasAccess(link)
            }"
            @click="handleNavClick(link)"
          >
            <div class="link-icon">{{ link.icon }}</div>
            <div class="link-content">
              <div class="link-title">{{ link.label }}</div>
              <div class="link-description">{{ link.description }}</div>
            </div>
            <div class="link-badge" v-if="link.premium && !hasAccess(link)">
              <span class="lock-icon">🔒</span>
            </div>
          </router-link>
        </nav>

        <!-- Premium CTA (only for free users) -->
        <div class="premium-cta" v-if="currentUserStatus === 'free'">
          <div class="cta-content">
            <div class="cta-icon">✨</div>
            <h4>Откройте больше</h4>
            <p>Тесты, аналитика и помощь с ДЗ</p>
            <button @click="goToUpgrade" class="cta-button">
              Улучшить план
            </button>
          </div>
        </div>

        <!-- Logout Button -->
        <div class="sidebar-footer">
          <button class="logout-btn" @click="showLogoutModal = true">
            <span class="logout-icon">🚪</span>
            Выйти
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div 
      class="sidebar-overlay" 
      v-if="isOpen && isMobile" 
      @click="closeSidebar"
    ></div>

    <!-- Logout Confirmation Modal -->
    <div class="modal-overlay" v-if="showLogoutModal" @click="showLogoutModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Выход из аккаунта</h3>
        </div>
        <div class="modal-body">
          <p>Вы уверены, что хотите выйти?</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLogoutModal = false">
            Отмена
          </button>
          <button class="btn-primary" @click="logout">
            Выйти
          </button>
        </div>
      </div>
    </div>

    <!-- Premium Modal -->
    <div class="modal-overlay" v-if="showPremiumModal" @click="showPremiumModal = false">
      <div class="modal-content premium-modal" @click.stop>
        <button class="modal-close" @click="showPremiumModal = false">×</button>
        <div class="modal-header">
          <div class="premium-icon">✨</div>
          <h3>Премиум функция</h3>
        </div>
        <div class="modal-body">
          <p><strong>{{ selectedFeature?.label }}</strong> доступно в Start и Pro планах</p>
          <div class="benefits-list">
            <div class="benefit-item">✅ Безлимитные тесты</div>
            <div class="benefit-item">✅ Детальная аналитика</div>
            <div class="benefit-item">✅ Помощь с домашними заданиями</div>
            <div class="benefit-item">✅ Персональный словарь</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showPremiumModal = false">
            Позже
          </button>
          <button class="btn-premium" @click="goToUpgrade">
            Улучшить план
          </button>
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
  name: 'SimplifiedSideBar',
  
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
      showPremiumModal: false,
      selectedFeature: null,
      isMobile: false,
      
      // ✅ SIMPLIFIED: Only 5 essential navigation links
      navigationLinks: [
        {
          name: 'main',
          label: 'Главная',
          icon: '🏠',
          description: 'Ваш прогресс и статистика',
          path: '/profile/main',
          premium: false
        },
        {
          name: 'catalogue',
          label: 'Мои курсы',
          icon: '📚',
          description: 'Все доступные уроки',
          path: '/profile/catalogue',
          premium: false
        },
        {
          name: 'homeworks',
          label: 'Задания',
          icon: '✏️',
          description: 'Домашние работы и практика',
          path: '/profile/homeworks',
          premium: false
        },
        {
          name: 'tests',
          label: 'Тесты',
          icon: '📝',
          description: 'Проверка знаний',
          path: '/profile/tests',
          premium: true,
          requiredPlans: ['start', 'pro']
        },
        {
          name: 'settings',
          label: 'Настройки',
          icon: '⚙️',
          description: 'Профиль и подписка',
          path: '/settings',
          premium: false
        }
      ]
    };
  },
  
  computed: {
    ...mapState(['user']),
    ...mapGetters(['getUser']),
    
    currentUser() {
      return this.getUser || this.user || {};
    },
    
    currentUserStatus() {
      return this.currentUser?.subscriptionPlan || 
             localStorage.getItem('userStatus') || 
             'free';
    },
    
    planLabel() {
      const status = this.currentUserStatus;
      if (status === 'pro') return '💎 Pro';
      if (status === 'start') return '⭐ Start';
      return '🆓 Free';
    },
    
    userDisplayName() {
      if (!this.user) return 'Пользователь';
      return this.user.name || 
             this.user.displayName || 
             this.user.email?.split('@')[0] || 
             'Пользователь';
    },
    
    userStatusBadgeClass() {
      const status = this.currentUserStatus;
      return {
        'badge-free': status === 'free',
        'badge-start': status === 'start',
        'badge-pro': status === 'pro'
      };
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
          uid: firebaseUser.uid
        };
        this.setUser(userData);
      } else {
        this.clearUser();
      }
    });
  },
  
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
  },
  
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    
    hasAccess(link) {
      if (!link.premium) return true;
      const status = this.currentUserStatus;
      if (!link.requiredPlans) return true;
      return link.requiredPlans.includes(status);
    },
    
    handleNavClick(link) {
      if (link.premium && !this.hasAccess(link)) {
        this.selectedFeature = link;
        this.showPremiumModal = true;
        return;
      }
      this.closeSidebarOnMobile();
    },
    
    goToUpgrade() {
      this.showPremiumModal = false;
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
      try {
        await signOut(auth);
        this.clearUser();
        localStorage.clear();
        this.$router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    
    isActive(name) {
      const path = this.$route.path;
      
      if (name === 'main') {
        return path === '/profile/main' || path === '/profile' || path === '/profile/';
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
* {
  box-sizing: border-box;
}

.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 24px 16px 16px;
}

/* User Card */
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-badge.badge-free {
  background: #e5e7eb;
  color: #6b7280;
}

.user-badge.badge-start {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
}

.user-badge.badge-pro {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1f2937;
}

/* Navigation Menu */
.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: #4b5563;
  background: white;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.nav-link:hover {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-color: #e5e7eb;
  transform: translateX(2px);
}

.nav-link.active {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
  border-color: #a78bfa;
  color: #5b21b6;
}

.nav-link.active .link-icon {
  transform: scale(1.1);
}

.nav-link.locked {
  opacity: 0.7;
  background: #f9fafb;
  border-color: #e5e7eb;
}

.nav-link.locked:hover {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fbbf24;
}

.link-icon {
  font-size: 24px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.link-content {
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.link-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
}

.link-badge {
  flex-shrink: 0;
}

.lock-icon {
  font-size: 16px;
  opacity: 0.6;
}

/* Premium CTA */
.premium-cta {
  margin: 16px 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  text-align: center;
}

.cta-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.cta-content h4 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.cta-content p {
  font-size: 13px;
  margin: 0 0 12px 0;
  opacity: 0.9;
}

.cta-button {
  background: white;
  color: #5b21b6;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cta-button:hover {
  transform: scale(1.05);
}

/* Sidebar Footer */
.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.logout-icon {
  font-size: 18px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 420px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #6b7280;
  font-size: 24px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.premium-modal .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom: none;
  text-align: center;
  border-radius: 20px 20px 0 0;
}

.premium-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 16px;
  color: #4b5563;
  line-height: 1.6;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.benefit-item {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
}

.modal-actions {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-primary,
.btn-premium {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #dc2626;
  color: white;
}

.btn-primary:hover {
  background: #b91c1c;
}

.btn-premium {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #1f2937;
}

.btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

/* Desktop */
@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0) !important;
  }
  
  .sidebar-overlay {
    display: none !important;
  }
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-width: 320px;
  }
  
  .user-card {
    padding: 12px;
  }
  
  .nav-link {
    padding: 12px 14px;
  }
  
  .link-title {
    font-size: 14px;
  }
  
  .link-description {
    font-size: 11px;
  }
}
</style>