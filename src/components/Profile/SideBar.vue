<template>
  <div class="sidebar-wrapper">
    <!-- Sidebar -->
    <div 
      class="sidebar" 
      :class="{ open: isOpen }"
    >
      <div class="sidebar-content">
        <!-- Header with subtle shine effect -->
        <div class="sidebar-header">
          <div class="shine-overlay"></div>
          <div class="header-top">
            <button class="close-btn" @click="closeSidebar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- User Card with metallic effect -->
          <div class="user-card">
            <div class="user-avatar">
              {{ getUserInitials }}
            </div>
            <div class="user-info">
              <p class="user-name">{{ userDisplayName }}</p>
              <span class="user-badge" :class="getBadgeClass">
                {{ planLabel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav-menu">
          <button
            v-for="link in navigationLinks"
            :key="link.name"
            @click="handleNavClick(link)"
            class="nav-link"
            :class="{
              active: isActive(link.name),
              locked: link.premium && !hasAccess(link)
            }"
          >
            <div class="icon-wrapper" :class="{ 'active-icon': isActive(link.name) }">
              <component :is="link.icon" class="link-icon" />
            </div>
            <div class="link-content">
              <div class="link-title">{{ link.label }}</div>
              <div class="link-description">{{ link.description }}</div>
            </div>
            <svg 
              v-if="link.premium && !hasAccess(link)" 
              class="crown-icon"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path d="M2 20h20M4 16V8l4 4 4-6 4 6 4-4v8M4 16h16"/>
            </svg>
          </button>
        </nav>

        <!-- Premium Unlock Card -->
        <div v-if="currentUserStatus !== 'pro'" class="premium-unlock-section">
          <div class="unlock-card">
            <div class="unlock-content">
              <div class="unlock-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 20h20M4 16V8l4 4 4-6 4 6 4-4v8M4 16h16"/>
                </svg>
              </div>
              <div class="unlock-text">
                <h5>{{ currentUserStatus === 'free' ? 'Разблокировать Премиум' : 'Разблокировать Pro' }}</h5>
                <p>{{ currentUserStatus === 'free' ? 'Получите все функции и возможности' : 'Перейдите на Pro план' }}</p>
              </div>
              <button @click="goToUpgrade" class="unlock-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Premium CTA with metallic purple -->
        <div v-if="currentUserStatus === 'free'" class="premium-cta">
          <div class="cta-card">
            <div class="shine-overlay"></div>
            <div class="cta-content">
              <div class="cta-header">
                <svg class="sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v18M3 12h18M6.5 6.5l11 11M6.5 17.5l11-11"/>
                </svg>
                <h4>Разблокировать Премиум</h4>
              </div>
              <p class="cta-text">Получите тесты, аналитику и многое другое! ✨</p>
              <button @click="goToUpgrade" class="cta-button">
                Посмотреть планы
              </button>
            </div>
          </div>
        </div>

        <!-- Logout -->
        <div class="sidebar-footer">
          <button class="logout-btn" @click="showLogoutModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Выйти
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="isOpen && isMobile"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <!-- Logout Modal -->
    <div v-if="showLogoutModal" class="modal-overlay" @click="showLogoutModal = false">
      <div class="modal-content logout-modal" @click.stop>
        <h3 class="modal-title">Выход</h3>
        <p class="modal-text">Вы уверены, что хотите выйти?</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showLogoutModal = false">
            Отмена
          </button>
          <button class="btn-danger" @click="logout">
            Выйти
          </button>
        </div>
      </div>
    </div>

    <!-- Premium Modal with metallic purple -->
    <div v-if="showPremiumModal" class="modal-overlay" @click="showPremiumModal = false">
      <div class="modal-content premium-modal" @click.stop>
        <div class="premium-header">
          <div class="shine-overlay"></div>
          <div class="premium-header-content">
            <div class="premium-icon-wrapper">
              <svg class="crown-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 20h20M4 16V8l4 4 4-6 4 6 4-4v8M4 16h16"/>
              </svg>
            </div>
            <h3 class="premium-title">Премиум функция</h3>
            <p class="premium-subtitle">Доступно в тарифах Start и Pro</p>
          </div>
        </div>
        <div class="premium-body">
          <div class="benefits-list">
            <div class="benefit-item">
              <span class="benefit-emoji">🎯</span>
              <span class="benefit-text">Неограниченные тесты</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-emoji">📊</span>
              <span class="benefit-text">Подробная аналитика</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-emoji">💡</span>
              <span class="benefit-text">Помощь с домашними заданиями</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-emoji">📖</span>
              <span class="benefit-text">Личный словарь</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showPremiumModal = false">
              Может быть позже
            </button>
            <button class="btn-premium" @click="goToUpgrade">
              Улучшить сейчас ✨
            </button>
          </div>
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

// Icon components (inline SVG)
const HomeIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`
};

const BookOpenIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
};

const FileTextIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`
};

const ClipboardCheckIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/></svg>`
};

const SettingsIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>`
};

export default {
  name: 'ProfessionalSideBar',
  
  components: {
    HomeIcon,
    BookOpenIcon,
    FileTextIcon,
    ClipboardCheckIcon,
    SettingsIcon
  },
  
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
      
      navigationLinks: [
        {
          name: 'main',
          label: 'Главная',
          icon: 'HomeIcon',
          description: 'Ваш прогресс и статистика',
          path: '/profile/main',
          premium: false
        },
        {
          name: 'catalogue',
          label: 'Мои курсы',
          icon: 'BookOpenIcon',
          description: 'Все доступные уроки',
          path: '/profile/catalogue',
          premium: false
        },
        {
          name: 'homeworks',
          label: 'Задания',
          icon: 'FileTextIcon',
          description: 'Практика и домашние работы',
          path: '/profile/homeworks',
          premium: false
        },
        {
          name: 'tests',
          label: 'Тесты',
          icon: 'ClipboardCheckIcon',
          description: 'Проверка знаний',
          path: '/profile/tests',
          premium: true,
          requiredPlans: ['start', 'pro']
        },
        {
          name: 'settings',
          label: 'Настройки',
          icon: 'SettingsIcon',
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
      if (status === 'pro') return 'Pro';
      if (status === 'start') return 'Start';
      return 'Free';
    },
    
    userDisplayName() {
      if (!this.user) return 'Пользователь';
      return this.user.name || 
             this.user.displayName || 
             this.user.email?.split('@')[0] || 
             'Пользователь';
    },
    
    getUserInitials() {
      const name = this.userDisplayName;
      return name.substring(0, 2).toUpperCase();
    },
    
    getBadgeClass() {
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
      this.$router.push(link.path);
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

/* Sidebar */
.sidebar-wrapper {
  position: relative;
}

.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: #ffffff;
  border-right: 1px solid #e9d5ff;
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
  backdrop-filter: blur(4px);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

/* Header */
.sidebar-header {
  padding: 24px 24px 32px;
  border-bottom: 1px solid #e9d5ff;
}

.shine-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.1), transparent);
  transform: translateX(-100%) skewX(-12deg);
  animation: shine 3s infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

.header-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 32px;
}

.close-btn {
  width: 28px;
  height: 28px;
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* User Card */
.user-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e9d5ff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 50%, #9333ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  border: 2px solid #e9d5ff;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.user-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  letter-spacing: 0.5px;
  align-self: flex-start;
  will-change: auto;
  transform: translateZ(0);
}

.user-badge.badge-free {
  background: #f3f4f6;
  color: #6b7280;
}

.user-badge.badge-start {
  background: linear-gradient(90deg, #e9d5ff 0%, #ddd6fe 100%);
  color: #7e22ce;
}

.user-badge.badge-pro {
  background: linear-gradient(90deg, #c084fc 0%, #a855f7 100%);
  color: white;
}

/* Navigation */
.nav-menu {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: white;
  border: none;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  width: 100%;
}

.nav-link:hover {
  background: #faf5ff;
  transform: scale(1.01);
}

.nav-link.active {
  background: linear-gradient(90deg, #a855f7 0%, #9333ea 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
  transform: scale(1.02);
}

.nav-link.locked {
  color: #9ca3af;
}

.nav-link.locked:hover {
  background: #faf5ff;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f3e8ff;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.icon-wrapper.active-icon {
  background: rgba(255, 255, 255, 0.2);
}

.link-icon {
  width: 16px;
  height: 16px;
  color: #9333ea;
}

.nav-link.active .link-icon {
  color: white;
}

.nav-link.locked .link-icon {
  opacity: 0.5;
}

.link-content {
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.nav-link.locked .link-title {
  opacity: 0.5;
}

.link-description {
  font-size: 12px;
  opacity: 0.7;
}

.nav-link.active .link-description {
  color: #e9d5ff;
}

.nav-link.locked .link-description {
  opacity: 0.5;
}

.crown-icon {
  width: 16px;
  height: 16px;
  color: #f59e0b;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Premium Unlock Card */
.premium-unlock-section {
  padding: 16px;
  border-bottom: 1px solid #e9d5ff;
}

.unlock-card {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
  border-radius: 12px;
  padding: 16px 18px;
}

.unlock-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.unlock-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.unlock-icon svg {
  width: 22px;
  height: 22px;
  color: white;
  stroke-width: 2.5;
}

.unlock-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.unlock-text h5 {
  font-size: 15px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.unlock-text p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
}

.unlock-arrow {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.unlock-arrow:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(3px);
}

.unlock-arrow:active {
  transform: translateX(1px);
}

.unlock-arrow svg {
  width: 20px;
  height: 20px;
  color: white;
  stroke-width: 2.5;
}

/* Premium CTA */
.premium-cta {
  padding: 16px;
  border-top: 1px solid #e9d5ff;
}

.cta-card {
  position: relative;
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
  border-radius: 12px;
  padding: 16px;
  color: white;
  box-shadow: 0 10px 24px rgba(168, 85, 247, 0.4);
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cta-header h4 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.sparkle-icon {
  width: 16px;
  height: 16px;
}

.cta-text {
  font-size: 13px;
  color: #e9d5ff;
  margin: 0 0 12px 0;
}

.cta-button {
  width: 100%;
  background: white;
  color: #9333ea;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cta-button:hover {
  transform: scale(1.02);
  background: #faf5ff;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e9d5ff;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  color: #dc2626;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #fef2f2;
  transform: scale(1.01);
}

.logout-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 420px;
  width: 100%;
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

/* Logout Modal */
.logout-modal {
  padding: 24px;
  border: 1px solid #e9d5ff;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.modal-text {
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary,
.btn-danger,
.btn-premium {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
}

.btn-premium {
  background: linear-gradient(90deg, #a855f7 0%, #9333ea 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
}

.btn-premium:hover {
  background: linear-gradient(90deg, #9333ea 0%, #7e22ce 100%);
}

/* Premium Modal */
.premium-modal {
  overflow: hidden;
  border: 1px solid #e9d5ff;
}

.premium-header {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%);
  padding: 32px 24px;
  text-align: center;
  color: white;
}

.premium-header-content {
  position: relative;
}

.premium-icon-wrapper {
  display: inline-flex;
  padding: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.crown-icon-large {
  width: 32px;
  height: 32px;
}

.premium-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.premium-subtitle {
  color: #e9d5ff;
  font-size: 13px;
  margin: 0;
}

.premium-body {
  padding: 24px;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  border-radius: 12px;
}

.benefit-emoji {
  font-size: 18px;
}

.benefit-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
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

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-width: 320px;
  }
  
  .close-btn {
    display: block;
  }
  
  .nav-link {
    padding: 10px 12px;
  }
  
  .link-title {
    font-size: 13px;
  }
  
  .link-description {
    font-size: 11px;
  }
}
</style>