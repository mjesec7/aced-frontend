<template>
  <div class="profile-page">
    <!-- Ambient Background Effects -->
    <div class="ambient-bg">
      <div class="ambient-orb orb-1"></div>
      <div class="ambient-orb orb-2"></div>
      <div class="ambient-orb orb-3"></div>
    </div>

    <!-- Sidebar Component -->
    <SideBar
      :isOpen="sidebarOpen"
      @toggle-sidebar="handleSidebarToggle"
    />

    <!-- Main Content Area -->
    <main
      class="profile-main"
      :class="{ 'sidebar-collapsed': !sidebarOpen }"
    >
      <!-- Top Navigation Bar -->
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

      <!-- Page Content -->
      <div class="profile-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Quick Actions Floating Button -->
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
        'profile-main': 'Dashboard',
        'profile-catalogue': 'My Courses',
        'profile-homeworks': 'Assignments',
        'profile-tests': 'Tests & Analytics',
        'settings': 'Settings'
      };
      return titles[routeName] || 'Dashboard';
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
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

/* === AMBIENT BACKGROUND EFFECTS === */
.ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: orbFloat 20s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation-delay: -7s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(20px, 10px) scale(1.02);
  }
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
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  z-index: 20;
}

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #94a3b8;
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
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
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
  color: #a78bfa;
}

.breadcrumb-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f8fafc;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
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
  border: 2px solid #0f0f23;
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
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.fab-button:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6);
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.profile-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
  .ambient-orb {
    animation: none;
  }

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
