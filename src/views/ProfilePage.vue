<template>
  <div class="profile-page">
    <SideBar
      :isOpen="sidebarOpen"
      @toggle-sidebar="handleSidebarToggle"
    />

    <main
      class="profile-main"
      :class="{ 'sidebar-collapsed': !sidebarOpen }"
    >
      <header class="profile-header">
        <button
          class="menu-toggle"
          @click="toggleSidebar"
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <div class="header-breadcrumb">
          <span class="breadcrumb-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </span>
          <span class="breadcrumb-text">{{ currentPageTitle }}</span>
        </div>

        <div class="header-actions">
          <button
            class="action-btn notification-btn"
            @click="toggleNotifications"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-dot" v-if="hasNotifications"></span>
          </button>

          <button
            class="action-btn search-btn"
            @click="toggleSearch"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="profile-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <button
      class="fab-button"
      @click="openQuickActions"
      v-if="showFab"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    </button>
  </div>
</template>

<script>
import SideBar from '@/components/Profile/SideBar.vue';
import { userStatusMixin } from '@/composables/useUserStatus';

export default {
  name: 'ProfilePage',

  components: {
    SideBar
  },

  mixins: [userStatusMixin],

  data() {
    return {
      sidebarOpen: true,
      hasNotifications: true,
      showFab: true,
      componentKey: 0,
      lastUpdate: Date.now()
    };
  },

  computed: {
    currentPageTitle() {
      const routeName = this.$route.name;
      const titles = {
        'profile-main': this.$t('profilePage.dashboard'),
        'profile-catalogue': this.$t('profilePage.myCourses'),
        'profile-homeworks': this.$t('profilePage.assignments'),
        'profile-tests': this.$t('profilePage.testsAnalytics'),
        'settings': this.$t('profilePage.settings')
      };
      return titles[routeName] || this.$t('profilePage.dashboard');
    },

    mainContentClass() {
      return {
        'with-sidebar': this.sidebarOpen,
        [`user-${this.userStatus}`]: true,
        'premium-user': this.isPremiumUser,
        'updated': this.lastUpdate > Date.now() - 5000
      };
    }
  },

  watch: {
    userStatus: {
      handler() {
        this.triggerComponentUpdate();
      },
      immediate: true
    }
  },

  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    this.setupProfileEventListeners();
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    this.cleanupProfileEventListeners();
  },

  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    handleSidebarToggle(value) {
      this.sidebarOpen = value;
    },

    checkMobile() {
      if (window.innerWidth <= 768) {
        this.sidebarOpen = false;
      }
    },

    triggerComponentUpdate() {
      this.componentKey++;
      this.lastUpdate = Date.now();
      this.$forceUpdate();
    },

    setupProfileEventListeners() {
      if (typeof window !== 'undefined' && window.eventBus) {
        this.profileStatusHandler = () => {
          this.triggerComponentUpdate();
        };
        window.eventBus.on('userStatusChanged', this.profileStatusHandler);
        window.eventBus.on('promocodeApplied', this.profileStatusHandler);
      }
    },

    cleanupProfileEventListeners() {
      if (typeof window !== 'undefined' && window.eventBus && this.profileStatusHandler) {
        window.eventBus.off('userStatusChanged', this.profileStatusHandler);
        window.eventBus.off('promocodeApplied', this.profileStatusHandler);
      }
    },

    toggleNotifications() {
      // Handle notifications toggle
    },

    toggleSearch() {
      // Handle search toggle
    },

    openQuickActions() {
      // Handle quick actions
    }
  }
};
</script>

<style scoped>
/* === PROFILE PAGE CONTAINER === */
.profile-page {
  min-height: 100vh;
  display: flex;
  background: #f1f5f9; /* Light Slate-100 Background */
  position: relative;
  overflow: hidden;
}

/* === MAIN CONTENT AREA === */
.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.profile-main.sidebar-collapsed {
  margin-left: 0;
}

@media (max-width: 768px) {
  .profile-main {
    margin-left: 0;
  }
}

/* === HEADER === */
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.85); /* Light translucent header */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 20;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.menu-toggle:hover {
  background: #f8fafc;
  color: #1e293b;
}

.menu-toggle svg {
  width: 20px;
  height: 20px;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.breadcrumb-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
}

.breadcrumb-icon svg {
  width: 18px;
  height: 18px;
  color: #8b5cf6; /* Darker Purple for light mode */
}

.breadcrumb-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b; /* Dark text */
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.action-btn:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateY(-1px);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}

/* === PROFILE CONTENT === */
.profile-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .profile-content {
    padding: 16px;
  }
}

/* === PAGE TRANSITIONS === */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* === FLOATING ACTION BUTTON === */
.fab-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.fab-button:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
}

.fab-button svg {
  width: 24px;
  height: 24px;
}

@media (max-width: 768px) {
  .fab-button {
    bottom: 16px;
    right: 16px;
    width: 52px;
    height: 52px;
  }
}

/* === SCROLLBAR STYLING === */
.profile-content::-webkit-scrollbar {
  width: 6px;
}

.profile-content::-webkit-scrollbar-track {
  background: transparent;
}

.profile-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.profile-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
  .page-fade-enter-active,
  .page-fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .page-fade-enter-from,
  .page-fade-leave-to {
    transform: none;
  }
}
</style>