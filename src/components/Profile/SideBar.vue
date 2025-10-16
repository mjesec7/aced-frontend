<template>
  <div class="sidebar-wrapper">
    <div 
      class="sidebar" 
      :class="{ open: isOpen }"
    >
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="shine-overlay"></div>
          <div class="header-top">
            <button class="close-btn" @click="closeSidebar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
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
            <div class="icon-wrapper">
              <component :is="link.icon" class="link-icon" />
            </div>
            <div class="link-content">
              <div class="link-title">{{ link.label }}</div>
              <div class="link-description">{{ link.description }}</div>
            </div>
            <svg 
              v-if="link.premium && !hasAccess(link)" 
              class="crown-icon"
              xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="m2 16 2.29-2.29a2.12 2.12 0 0 1 3.01 0L12 18.43l4.7-4.71a2.12 2.12 0 0 1 3.01 0L22 16"/>
              <path d="M7.28 9.99a5.72 5.72 0 0 1 9.44 0"/>
              <path d="M12 2v5"/>
            </svg>
          </button>
        </nav>

        <div v-if="currentUserStatus === 'free'" class="premium-cta">
          <div class="cta-card">
            <div class="cta-content">
              <div class="cta-header">
                <svg class="sparkle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
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

    <div 
      v-if="isOpen && isMobile"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

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

    <div v-if="showPremiumModal" class="modal-overlay" @click="showPremiumModal = false">
      <div class="modal-content premium-modal" @click.stop>
        <div class="premium-header">
          <div class="shine-overlay"></div>
          <div class="premium-header-content">
            <div class="premium-icon-wrapper">
              <svg class="crown-icon-large" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 16 2.29-2.29a2.12 2.12 0 0 1 3.01 0L12 18.43l4.7-4.71a2.12 2.12 0 0 1 3.01 0L22 16"/>
                <path d="M7.28 9.99a5.72 5.72 0 0 1 9.44 0"/><path d="M12 2v5"/>
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
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
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
  border-right: 1px solid #f3f4f6; /* Lighter border */
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

/* Header - Keeping original styles */
.sidebar-header {
  padding: 12px 24px 24px 24px;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.shine-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(233, 213, 255, 0.2), transparent);
  animation: shine 5s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(200%) skewX(-12deg); }
}

.header-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
  min-height: 28px;
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

.user-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  border: 2px solid white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  width: 100%;
}

.user-badge {
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 9999px;
  margin-top: 2px;
}

.user-badge.badge-free { background: #f3f4f6; color: #4b5563; }
.user-badge.badge-start { background: #f3e8ff; color: #8b5cf6; }
.user-badge.badge-pro { background: #a855f7; color: white; }

/* Navigation - Styled to match image */
.nav-menu {
  flex-grow: 1; /* Pushes footer down */
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px; /* Reduced gap */
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  width: 100%;
}

.nav-link:hover {
  background: #f9fafb; /* Light grey on hover */
}

.nav-link.active {
  background: #faf5ff; /* Light purple for active */
}

.nav-link.locked {
  color: #9ca3af;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.link-icon {
  width: 22px;
  height: 22px;
  color: #6b7280;
  transition: color 0.2s ease;
}

.nav-link.active .link-icon {
  color: #9333ea;
}

.nav-link.locked .link-icon {
   color: #9ca3af;
}

.link-content {
  flex: 1;
  min-width: 0;
}

.link-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.nav-link.active .link-title {
  font-weight: 600;
  color: #581c87;
}

.link-description {
  font-size: 12px;
  color: #6b7280;
}

.crown-icon {
  width: 20px;
  height: 20px;
  color: #f59e0b;
  flex-shrink: 0;
}

/* Premium CTA - Styled to match image */
.premium-cta {
  padding: 16px;
  flex-shrink: 0;
}

.cta-card {
  background: #a855f7;
  border-radius: 14px;
  padding: 20px;
  color: white;
  text-align: center;
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cta-header h4 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.sparkle-icon {
  width: 20px;
  height: 20px;
  color: white;
}

.cta-text {
  font-size: 13px;
  color: #e9d5ff;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.cta-button {
  width: 100%;
  background: white;
  color: #9333ea;
  border: none;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cta-button:hover {
  transform: translateY(-1px);
  background: #faf5ff;
}

/* Sidebar Footer - Styled to match image */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Align left */
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

.logout-btn svg {
  width: 20px;
  height: 20px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; align-items: center;
  justify-content: center; z-index: 10000; backdrop-filter: blur(4px); padding: 16px;
}
.modal-content {
  background: white; border-radius: 16px; max-width: 420px; width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); animation: modalAppear 0.3s ease-out;
}
@keyframes modalAppear {
  from { opacity: 0; transform: scale(0.9) translateY(-20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.logout-modal { padding: 24px; }
.modal-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0; }
.modal-text { color: #6b7280; margin: 0 0 24px 0; line-height: 1.5; }
.modal-actions { display: flex; gap: 12px; }
.btn-secondary, .btn-danger, .btn-premium {
  flex: 1; padding: 10px 20px; border: none; border-radius: 12px;
  font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s ease;
}
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.btn-secondary:hover { background: #e5e7eb; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-premium { background: #a855f7; color: white; }
.btn-premium:hover { background: #9333ea; }
.premium-modal { overflow: hidden; }
.premium-header {
  position: relative; overflow: hidden; background: #a855f7;
  padding: 32px 24px; text-align: center; color: white;
}
.premium-header-content { position: relative; }
.premium-icon-wrapper {
  display: inline-flex; padding: 12px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.2); margin-bottom: 12px;
}
.crown-icon-large { width: 32px; height: 32px; }
.premium-title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
.premium-subtitle { color: #e9d5ff; font-size: 13px; margin: 0; }
.premium-body { padding: 24px; }
.benefits-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.benefit-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px;
}
.benefit-emoji { font-size: 18px; }
.benefit-text { font-size: 14px; font-weight: 500; color: #374151; }

/* Responsive */
@media (min-width: 769px) {
  .sidebar { transform: translateX(0) !important; }
  .sidebar-overlay { display: none !important; }
}
@media (max-width: 768px) {
  .sidebar { width: 100%; max-width: 320px; }
  .close-btn { display: block; }
}
</style>