<template>
  <div class="sidebar-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: isOpen }">
      <!-- Glass overlay effect -->
      <div class="sidebar-glass"></div>

      <div class="sidebar-content">
        <!-- Logo & Brand -->
        <div class="sidebar-brand">
          <div class="brand-logo">
            <span class="logo-text">A</span>
            <div class="logo-glow"></div>
          </div>
          <div class="brand-info">
            <h1 class="brand-name">ACED</h1>
            <span class="brand-tagline">Learning Platform</span>
          </div>
          <button class="close-btn" @click="closeSidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- User Profile Card -->
        <div class="user-card">
          <div class="user-avatar">
            <span class="avatar-text">{{ getUserInitials }}</span>
            <div class="avatar-ring"></div>
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ userDisplayName }}</h3>
            <span class="user-plan" :class="planClass">{{ planLabel }}</span>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ userLevel }}</span>
              <span class="stat-label">Level</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ userStreak }}</span>
              <span class="stat-label">Streak</span>
            </div>
          </div>
        </div>

        <!-- Mode Selector -->
        <div class="mode-selector" v-if="hasSelectedMode">
          <div class="mode-label">Learning Mode</div>
          <div class="mode-toggle">
            <button
              class="mode-option"
              :class="{ active: isSchoolMode }"
              @click="switchToSchool"
            >
              <span class="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </span>
              <span class="mode-text">School</span>
            </button>
            <button
              class="mode-option"
              :class="{ active: isStudyCentreMode }"
              @click="switchToStudyCentre"
            >
              <span class="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </span>
              <span class="mode-text">Study Centre</span>
            </button>
          </div>
        </div>

        <!-- Initial Mode Selection -->
        <div class="mode-selection" v-if="!hasSelectedMode">
          <div class="selection-header">
            <h4>Choose Your Path</h4>
            <p>Select how you want to learn</p>
          </div>
          <div class="selection-options">
            <button
              class="selection-card"
              :class="{ selected: tempSelectedMode === 'school' }"
              @click="selectInitialMode('school')"
              :disabled="isSelectingMode"
            >
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <h5>School Mode</h5>
              <p>Structured curriculum</p>
            </button>
            <button
              class="selection-card"
              :class="{ selected: tempSelectedMode === 'study_centre' }"
              @click="selectInitialMode('study_centre')"
              :disabled="isSelectingMode"
            >
              <div class="card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h5>Study Centre</h5>
              <p>Free exploration</p>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav-menu">
          <div class="nav-section">
            <span class="nav-section-title">Menu</span>
            <button
              v-for="link in navigationLinks"
              :key="link.name"
              @click="handleNavClick(link)"
              class="nav-item"
              :class="{
                active: isActive(link.name),
                locked: link.premium && !hasAccess(link)
              }"
            >
              <div class="nav-icon">
                <component :is="link.icon" />
              </div>
              <div class="nav-content">
                <span class="nav-title">{{ link.label }}</span>
                <span class="nav-desc">{{ link.description }}</span>
              </div>
              <div class="nav-badge" v-if="link.premium && !hasAccess(link)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 20h20M4 16V8l4 4 4-6 4 6 4-4v8"/>
                </svg>
              </div>
              <div class="nav-arrow" v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          </div>
        </nav>

        <!-- Upgrade Card -->
        <div class="upgrade-card" v-if="currentUserStatus !== 'pro'">
          <div class="upgrade-glow"></div>
          <div class="upgrade-content">
            <div class="upgrade-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="upgrade-text">
              <h4>Upgrade to Pro</h4>
              <p>Unlock all features</p>
            </div>
            <button class="upgrade-btn" @click="goToUpgrade">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="sidebar-footer">
          <button class="footer-btn logout-btn" @click="showLogoutModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div
      v-if="isOpen && isMobile"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <!-- Logout Modal -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click="showLogoutModal = false">
        <div class="modal-card" @click.stop>
          <div class="modal-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <h3 class="modal-title">Log Out</h3>
          <p class="modal-text">Are you sure you want to log out of your account?</p>
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="showLogoutModal = false">Cancel</button>
            <button class="modal-btn danger" @click="logout">Log Out</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Premium Modal -->
    <Teleport to="body">
      <div v-if="showPremiumModal" class="modal-overlay" @click="showPremiumModal = false">
        <div class="modal-card premium" @click.stop>
          <div class="premium-header">
            <div class="premium-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 20h20M4 16V8l4 4 4-6 4 6 4-4v8"/>
              </svg>
            </div>
            <h3>Premium Feature</h3>
            <p>Unlock with Start or Pro plan</p>
          </div>
          <div class="premium-benefits">
            <div class="benefit">
              <span class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span>Unlimited practice tests</span>
            </div>
            <div class="benefit">
              <span class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span>Detailed analytics</span>
            </div>
            <div class="benefit">
              <span class="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span>AI-powered homework help</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="modal-btn secondary" @click="showPremiumModal = false">Maybe Later</button>
            <button class="modal-btn primary" @click="goToUpgrade">Upgrade Now</button>
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
import { userStatusMixin } from '@/composables/useUserStatus';
import { switchLearningMode } from '@/api/user';

// Icon components
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
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/></svg>`
};

const SettingsIcon = {
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

export default {
  name: 'ModernSideBar',

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
      tempSelectedMode: null,
      isSelectingMode: false,
      userLevel: 12,
      userStreak: 7,

      navigationLinks: [
        {
          name: 'main',
          label: 'Dashboard',
          icon: 'HomeIcon',
          description: 'Overview & stats',
          path: '/profile/main',
          premium: false
        },
        {
          name: 'catalogue',
          label: 'My Courses',
          icon: 'BookOpenIcon',
          description: 'Browse lessons',
          path: '/profile/catalogue',
          premium: false
        },
        {
          name: 'homeworks',
          label: 'Assignments',
          icon: 'FileTextIcon',
          description: 'Practice & homework',
          path: '/profile/homeworks',
          premium: false
        },
        {
          name: 'tests',
          label: 'Tests',
          icon: 'ClipboardCheckIcon',
          description: 'Assessment & analytics',
          path: '/profile/tests',
          premium: true,
          requiredPlans: ['start', 'pro']
        },
        {
          name: 'settings',
          label: 'Settings',
          icon: 'SettingsIcon',
          description: 'Account & preferences',
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

    planClass() {
      return `plan-${this.currentUserStatus}`;
    },

    userDisplayName() {
      if (!this.user) return 'User';
      return this.user.name ||
             this.user.displayName ||
             this.user.email?.split('@')[0] ||
             'User';
    },

    getUserInitials() {
      const name = this.userDisplayName;
      return name.substring(0, 2).toUpperCase();
    },

    hasSelectedMode() {
      return this.$store.getters['platformMode/hasSelectedMode'];
    },

    isSchoolMode() {
      return this.$store.getters['platformMode/isSchoolMode'];
    },

    isStudyCentreMode() {
      return this.$store.getters['platformMode/isStudyCentreMode'];
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

    async selectInitialMode(mode) {
      if (this.isSelectingMode) return;

      this.tempSelectedMode = mode;
      this.isSelectingMode = true;

      try {
        const userId = this.$store.getters.getFirebaseUserId;
        if (!userId) return;

        try {
          await switchLearningMode(userId, mode, 'Initial mode selection');
        } catch (apiError) {
          // Handle silently
        }

        await this.$store.dispatch('platformMode/switchMode', {
          newMode: mode,
          reason: 'Initial mode selection'
        });

        this.closeSidebarOnMobile();
      } catch (error) {
        this.tempSelectedMode = null;
      } finally {
        this.isSelectingMode = false;
      }
    },

    async switchToSchool() {
      if (this.isSchoolMode) return;

      try {
        await this.$store.dispatch('platformMode/switchMode', {
          newMode: 'school',
          reason: 'User switched via sidebar'
        });
        this.closeSidebarOnMobile();
      } catch (error) {
        // Handle silently
      }
    },

    async switchToStudyCentre() {
      if (this.isStudyCentreMode) return;

      try {
        await this.$store.dispatch('platformMode/switchMode', {
          newMode: 'study_centre',
          reason: 'User switched via sidebar'
        });
        this.closeSidebarOnMobile();
      } catch (error) {
        // Handle silently
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
        await signOut(auth);
        this.clearUser();
        localStorage.clear();
        this.$router.push('/');
      } catch (error) {
        // Handle silently
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
/* === SIDEBAR WRAPPER === */
.sidebar-wrapper {
  position: relative;
}

/* === SIDEBAR === */
.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-glass {
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 35, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 16px;
  overflow-y: auto;
}

.sidebar-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

/* === BRAND === */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 20px;
  margin-bottom: 8px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 12px;
  position: relative;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.logo-glow {
  position: absolute;
  inset: -4px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 16px;
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.75rem;
  color: #64748b;
}

.close-btn {
  display: none;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

/* === USER CARD === */
.user-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 14px;
  margin: 0 auto 12px;
  position: relative;
}

.avatar-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.avatar-ring {
  position: absolute;
  inset: -3px;
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 16px;
  animation: ringPulse 3s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.user-info {
  text-align: center;
  margin-bottom: 16px;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 6px;
}

.user-plan {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-plan.plan-free {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.user-plan.plan-start {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #a78bfa;
}

.user-plan.plan-pro {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%);
  color: #22d3ee;
}

.user-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  color: #f8fafc;
}

.stat-label {
  font-size: 0.6875rem;
  color: #64748b;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
}

/* === MODE SELECTOR === */
.mode-selector {
  margin-bottom: 20px;
}

.mode-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-left: 4px;
}

.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #94a3b8;
}

.mode-option:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.mode-option.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

.mode-icon svg {
  width: 20px;
  height: 20px;
}

.mode-text {
  font-size: 0.8125rem;
  font-weight: 600;
}

/* === MODE SELECTION === */
.mode-selection {
  margin-bottom: 20px;
}

.selection-header {
  text-align: center;
  margin-bottom: 14px;
}

.selection-header h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 4px;
}

.selection-header p {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.selection-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
  color: inherit;
}

.selection-card:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.selection-card.selected {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%);
  border-color: #8b5cf6;
}

.selection-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.15);
  border-radius: 12px;
}

.card-icon svg {
  width: 22px;
  height: 22px;
  color: #a78bfa;
}

.selection-card h5 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0;
}

.selection-card p {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

/* === NAVIGATION === */
.nav-menu {
  flex: 1;
  margin-bottom: 16px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  color: #94a3b8;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #f8fafc;
}

.nav-item.locked {
  opacity: 0.6;
}

.nav-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.nav-item.active .nav-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.nav-icon svg {
  width: 18px;
  height: 18px;
}

.nav-item.active .nav-icon svg {
  color: white;
}

.nav-content {
  flex: 1;
  min-width: 0;
}

.nav-title {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 2px;
}

.nav-desc {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.nav-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
}

.nav-badge svg {
  width: 16px;
  height: 16px;
}

.nav-arrow {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.nav-item:hover .nav-arrow,
.nav-item.active .nav-arrow {
  opacity: 1;
}

.nav-arrow svg {
  width: 14px;
  height: 14px;
}

/* === UPGRADE CARD === */
.upgrade-card {
  position: relative;
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 14px;
}

.upgrade-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  opacity: 0.9;
}

.upgrade-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.upgrade-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  flex-shrink: 0;
}

.upgrade-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

.upgrade-text {
  flex: 1;
  min-width: 0;
}

.upgrade-text h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  margin: 0 0 2px;
}

.upgrade-text p {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.upgrade-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.upgrade-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateX(3px);
}

.upgrade-btn svg {
  width: 18px;
  height: 18px;
}

/* === FOOTER === */
.sidebar-footer {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #94a3b8;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.footer-btn svg {
  width: 18px;
  height: 18px;
}

/* === OVERLAY === */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
}

/* === MODALS === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-card {
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: modalPop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  border-radius: 16px;
}

.modal-icon.warning {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.modal-icon svg {
  width: 28px;
  height: 28px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 8px;
}

.modal-text {
  font-size: 0.9375rem;
  color: #94a3b8;
  margin: 0 0 28px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.modal-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.modal-btn.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.modal-btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
}

.modal-btn.primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
}

/* === PREMIUM MODAL === */
.modal-card.premium {
  padding: 0;
  overflow: hidden;
}

.premium-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  padding: 32px;
  text-align: center;
}

.premium-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  margin: 0 auto 16px;
}

.premium-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.premium-header h3 {
  font-size: 1.375rem;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
}

.premium-header p {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.premium-benefits {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 12px;
}

.benefit-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  flex-shrink: 0;
}

.benefit-icon svg {
  width: 14px;
  height: 14px;
  color: #10b981;
}

.benefit span:last-child {
  font-size: 0.9375rem;
  color: #f8fafc;
}

.modal-card.premium .modal-actions {
  padding: 24px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* === RESPONSIVE === */
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
    width: 100%;
    max-width: 320px;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
