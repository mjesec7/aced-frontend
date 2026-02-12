<template>
  <div class="sidebar-wrapper">
    <aside class="sidebar" :class="{ open: isOpen }">
      <div class="sidebar-content">
        <!-- Brand Header -->
        <div class="sidebar-header">
          <img src="@/assets/logo.png" alt="ACED" class="brand-logo" />
          <div class="brand-text">
            <h1 class="brand-name">ACED</h1>
            <span class="brand-badge">BETA</span>
          </div>
          <button class="close-btn" @click="closeSidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- User Profile Summary (Simplified) -->
        <div class="user-profile-compact">
          <div class="avatar-ring">
            <div class="user-avatar">
              <span>{{ getUserInitials }}</span>
            </div>
          </div>
          <div class="user-details">
            <div class="user-name-row">
              <span class="name">{{ userDisplayName }}</span>
              <span class="plan-badge" :class="planClass">{{ planLabel }}</span>
            </div>
            <div class="user-stats-row">
              <span class="stat">⭐ {{ userRewards?.level || 1 }}</span>
              <span class="stat-dot">•</span>
              <span class="stat">🔥 {{ userRewards?.streak || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="nav-menu">
          <div class="nav-list">
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
              <div class="nav-icon-container">
                <component :is="link.icon" />
              </div>
              <span class="nav-label">{{ getNavLabel(link.name) }}</span>
              
              <div class="nav-status-icon" v-if="link.premium && !hasAccess(link)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
            </button>
          </div>
        </nav>

        <!-- Spacer -->
        <div class="flex-spacer"></div>

        <!-- Upgrade Card (More subtle) -->
        <div class="upgrade-widget" v-if="currentUserStatus !== 'pro'">
          <div class="upgrade-content">
            <span class="upgrade-icon">🚀</span>
            <div class="upgrade-text">
              <span class="upgrade-title">{{ $t('sidebar.upgradeToPro') }}</span>
              <span class="upgrade-subtitle">{{ $t('sidebar.unlockAllFeatures') }}</span>
            </div>
          </div>
          <button class="upgrade-arrow-btn" @click="goToUpgrade">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Footer Actions -->
        <div class="sidebar-footer">
          <div class="footer-actions">
            <LanguageSwitcher :compact="true" />
            <button class="footer-icon-btn logout" @click="showLogoutModal = true" :title="$t('sidebar.logOut')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <Transition name="fade">
      <div
        v-if="isOpen && isMobile"
        class="sidebar-overlay"
        @click="closeSidebar"
      ></div>
    </Transition>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Logout Modal -->
      <Transition name="modal-fade">
        <div v-if="showLogoutModal" class="modal-backdrop" @click="showLogoutModal = false">
          <div class="modal-dialog" @click.stop>
            <div class="modal-icon-wrapper warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h3>{{ $t('sidebar.logOut') }}</h3>
            <p>{{ $t('sidebar.confirmLogout') }}</p>
            <div class="modal-buttons">
              <button class="btn-ghost" @click="showLogoutModal = false">{{ $t('common.cancel') }}</button>
              <button class="btn-danger" @click="logout">{{ $t('sidebar.logOut') }}</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Premium Modal -->
      <Transition name="modal-fade">
        <div v-if="showPremiumModal" class="modal-backdrop" @click="showPremiumModal = false">
          <div class="modal-dialog premium" @click.stop>
            <div class="premium-badge">PRO</div>
            <h3>{{ $t('sidebar.premiumFeature') }}</h3>
            <p>{{ $t('sidebar.unlockWithPlan') }}</p>
            
            <div class="benefits-list">
              <div class="benefit-row"><span>✓</span> {{ $t('sidebar.unlimitedTests') }}</div>
              <div class="benefit-row"><span>✓</span> {{ $t('sidebar.detailedAnalytics') }}</div>
              <div class="benefit-row"><span>✓</span> {{ $t('sidebar.aiHomeworkHelp') }}</div>
            </div>

            <div class="modal-buttons">
              <button class="btn-ghost" @click="showPremiumModal = false">{{ $t('sidebar.maybeLater') }}</button>
              <button class="btn-primary" @click="goToUpgrade">{{ $t('sidebar.upgradeNow') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { mapState, mapMutations, mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

// Icon components (Unchanged)
const HomeIcon = { template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>` };
const BookOpenIcon = { template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>` };
const FileTextIcon = { template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>` };
const ClipboardCheckIcon = { template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14l2 2 4-4"/></svg>` };
const SettingsIcon = { template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` };

export default {
  name: 'ModernSideBar',
  components: { HomeIcon, BookOpenIcon, FileTextIcon, ClipboardCheckIcon, SettingsIcon, LanguageSwitcher },
  mixins: [userStatusMixin],
  props: {
    isOpen: { type: Boolean, default: true }
  },
  data() {
    return {
      showLogoutModal: false,
      showPremiumModal: false,
      selectedFeature: null,
      isMobile: false,
      navigationLinks: [
        { name: 'main', label: 'Dashboard', icon: 'HomeIcon', description: 'Overview & stats', path: '/profile/main', premium: false },
        { name: 'catalogue', label: 'My Courses', icon: 'BookOpenIcon', description: 'Browse lessons', path: '/profile/catalogue', premium: false },
        { name: 'homeworks', label: 'Assignments', icon: 'FileTextIcon', description: 'Practice & homework', path: '/profile/homeworks', premium: false },
        { name: 'tests', label: 'Tests', icon: 'ClipboardCheckIcon', description: 'Assessment & analytics', path: '/profile/tests', premium: true, requiredPlans: ['start', 'pro'] },
        { name: 'settings', label: 'Settings', icon: 'SettingsIcon', description: 'Account & preferences', path: '/settings', premium: false }
      ]
    };
  },
  computed: {
    ...mapState(['user']),
    ...mapGetters(['getUser']),
    ...mapGetters('user', ['userStatus', 'userRewards']),
    currentUser() { return this.getUser || this.user || {}; },
    currentUserStatus() { return this.userStatus || this.$store?.state?.user?.userStatus || this.currentUser?.subscriptionPlan || localStorage.getItem('userStatus') || 'free'; },
    planLabel() { const status = this.currentUserStatus; if (status === 'pro') return 'Pro'; if (status === 'start') return 'Start'; return 'Free'; },
    planClass() { return `plan-${this.currentUserStatus}`; },
    userDisplayName() { if (!this.user) return 'User'; return this.user.name || this.user.displayName || this.user.email?.split('@')[0] || 'User'; },
    getUserInitials() { return this.userDisplayName.substring(0, 2).toUpperCase(); },
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = { name: firebaseUser.displayName || firebaseUser.email?.split('@')[0], displayName: firebaseUser.displayName, email: firebaseUser.email, uid: firebaseUser.uid };
        this.setUser(userData);
      } else { this.clearUser(); }
    });
    window.addEventListener('userStatusChanged', this.handleStatusUpdate);
    window.addEventListener('subscriptionUpdated', this.handleStatusUpdate);
    window.addEventListener('forceUpdate', this.handleStatusUpdate);
    this.$store.dispatch('user/fetchUserRewards').catch(() => {});
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    window.removeEventListener('userStatusChanged', this.handleStatusUpdate);
    window.removeEventListener('subscriptionUpdated', this.handleStatusUpdate);
    window.removeEventListener('forceUpdate', this.handleStatusUpdate);
  },
  methods: {
    ...mapMutations(['setUser', 'clearUser']),
    handleStatusUpdate() { this.$forceUpdate(); },
    hasAccess(link) { if (!link.premium) return true; const status = this.currentUserStatus; if (!link.requiredPlans) return true; return link.requiredPlans.includes(status); },
    handleNavClick(link) {
      if (link.premium && !this.hasAccess(link)) { this.selectedFeature = link; this.showPremiumModal = true; return; }
      this.$router.push(link.path);
      this.closeSidebarOnMobile();
    },
    goToUpgrade() { this.showPremiumModal = false; this.$router.push('/settings'); this.closeSidebarOnMobile(); },
    checkMobile() { this.isMobile = window.innerWidth <= 768; },
    closeSidebar() { this.$emit('toggle-sidebar', false); },
    closeSidebarOnMobile() { if (this.isMobile) { this.closeSidebar(); } },
    async logout() { try { await signOut(auth); this.clearUser(); localStorage.clear(); this.$router.push('/'); } catch (error) {} },
    isActive(name) { const path = this.$route.path; if (name === 'main') return path === '/profile/main' || path === '/profile' || path === '/profile/'; if (name === 'settings') return path === '/settings'; return path.includes(`/profile/${name}`); },
    getNavLabel(name) {
      const labels = { main: this.$t('sidebar.dashboard'), catalogue: this.$t('sidebar.myCourses'), homeworks: this.$t('sidebar.assignments'), tests: this.$t('sidebar.tests'), settings: this.$t('sidebar.settings') };
      return labels[name] || name;
    }
  }
};
</script>

<style scoped>
/* Reset & Vars */
.sidebar-wrapper {
  --sb-bg: #ffffff;
  --sb-text: #1e293b;
  --sb-text-secondary: #64748b;
  --sb-border: #f1f5f9;
  --primary: #8b5cf6;
  --primary-light: #f3e8ff;
  --primary-hover: #7c3aed;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Custom Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Unbounded:wght@400;500;600;700&display=swap');

.brand-name {
  font-family: 'Unbounded', sans-serif;
}

/* Base Layout */
.sidebar {
  width: 280px;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  background: var(--sb-bg);
  border-right: 1px solid var(--sb-border);
  transform: translateX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.sidebar:not(.open) {
  transform: translateX(-100%);
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
  padding-left: 4px;
}

.brand-logo { width: 32px; height: 32px; object-fit: contain; }
.brand-text { display: flex; align-items: center; gap: 8px; flex: 1; }
.brand-name { font-size: 1.25rem; font-weight: 800; color: var(--sb-text); margin: 0; font-family: 'Unbounded', sans-serif; }
.brand-badge { font-size: 0.6rem; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }

.close-btn { 
  display: none; 
  background: none; border: none; color: var(--sb-text-secondary); cursor: pointer; padding: 4px;
}
.close-btn svg { width: 20px; height: 20px; }

/* User Profile - Compact */
.user-profile-compact {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 32px;
  transition: background 0.2s;
}

.user-profile-compact:hover {
  background: #f1f5f9;
}

.user-avatar {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 1.1rem;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.2);
}

.user-details { flex: 1; min-width: 0; }
.user-name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.name { font-weight: 600; font-size: 0.95rem; color: var(--sb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px; }
.plan-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; }

.plan-free { background: #e2e8f0; color: #64748b; }
.plan-start { background: #f3e8ff; color: #7c3aed; }
.plan-pro { background: #e0f2fe; color: #0284c7; }

.user-stats-row { font-size: 0.75rem; color: var(--sb-text-secondary); display: flex; gap: 8px; align-items: center; }
.stat-dot { font-size: 0.5rem; opacity: 0.5; }

/* Navigation */
.nav-menu { margin-bottom: 20px; }
.nav-list { display: flex; flex-direction: column; gap: 8px; }

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  width: 100%;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  color: var(--sb-text-secondary);
  transition: all 0.2s ease;
  font-family: inherit;
  font-weight: 500;
}

.nav-item:hover {
  background: #f8fafc;
  color: var(--sb-text);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary-hover);
  font-weight: 600;
}

.nav-icon-container { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; }
.nav-icon-container svg { width: 20px; height: 20px; transition: stroke-width 0.2s; }
.nav-item:hover svg { stroke-width: 2.5; }
.nav-label { font-size: 0.95rem; }

.nav-status-icon { margin-left: auto; color: #cbd5e1; }

.flex-spacer { flex: 1; }

/* Upgrade Widget */
.upgrade-widget {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 16px;
  padding: 16px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.upgrade-content { display: flex; gap: 12px; align-items: center; }
.upgrade-icon { font-size: 1.2rem; }
.upgrade-text { display: flex; flex-direction: column; }
.upgrade-title { font-size: 0.85rem; font-weight: 700; line-height: 1.2; }
.upgrade-subtitle { font-size: 0.7rem; opacity: 0.8; }

.upgrade-arrow-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  display: flex; align-items: center; justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}
.upgrade-arrow-btn:hover { background: white; color: var(--primary); }
.upgrade-arrow-btn svg { width: 16px; height: 16px; }

/* Footer */
.sidebar-footer { border-top: 1px solid var(--sb-border); padding-top: 20px; }
.footer-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

.footer-icon-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--sb-border);
  background: white;
  color: var(--sb-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.footer-icon-btn:hover { border-color: #cbd5e1; color: #ef4444; background: #fef2f2; }
.footer-icon-btn svg { width: 18px; height: 18px; }

/* Mobile */
@media (max-width: 768px) {
  .close-btn { display: block; }
  .sidebar { width: 85%; max-width: 300px; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
  .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 999; backdrop-filter: blur(2px); }
  
  /* Transitions */
  .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
}

/* Modals */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.modal-dialog { background: white; padding: 24px; border-radius: 20px; width: 90%; max-width: 360px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

.modal-icon-wrapper { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.modal-icon-wrapper.warning { background: #fef2f2; color: #ef4444; }

.modal-dialog h3 { font-size: 1.25rem; font-weight: 700; margin: 0 0 8px; color: var(--sb-text); }
.modal-dialog p { color: var(--sb-text-secondary); font-size: 0.9rem; margin: 0 0 24px; line-height: 1.5; }

.modal-buttons { display: flex; gap: 12px; }
.modal-buttons button { flex: 1; padding: 10px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; border: none; font-size: 0.9rem; }
.btn-ghost { background: #f1f5f9; color: var(--sb-text-secondary); }
.btn-ghost:hover { background: #e2e8f0; color: var(--sb-text); }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-hover); }

/* Premium Modal Specifics */
.modal-dialog.premium { max-width: 400px; }
.premium-badge { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; margin-bottom: 12px; letter-spacing: 1px; }
.benefits-list { text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; }
.benefit-row { display: flex; gap: 10px; margin-bottom: 8px; font-size: 0.9rem; color: #475569; }
.benefit-row:last-child { margin-bottom: 0; }
.benefit-row span { color: #10b981; font-weight: 800; }
</style>