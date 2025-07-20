<template>
  <div class="sidebar">
    <!-- User Info Section -->
    <div class="user-info">
      <div class="user-avatar">
        <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName || 'User'" />
        <div v-else class="avatar-placeholder">
          {{ (user?.displayName || user?.email || 'U').charAt(0).toUpperCase() }}
        </div>
      </div>
      <div class="user-details">
        <div class="user-name">{{ user?.displayName || user?.email || 'Пользователь' }}</div>
        <div class="subscription-status">
          <span class="status-badge" :class="subscriptionBadge.class">
            {{ subscriptionBadge.icon }} {{ subscriptionBadge.text }}
          </span>
        </div>
      </div>
    </div>

    <!-- Navigation Items -->
    <nav class="sidebar-nav">
      <!-- Dashboard -->
      <router-link to="/dashboard" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">🏠</span>
          <span class="item-text">Главная</span>
        </div>
      </router-link>

      <!-- Catalogue -->
      <router-link to="/catalogue" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">📖</span>
          <span class="item-text">Каталог</span>
        </div>
      </router-link>

      <!-- Study Plan -->
      <router-link to="/study-plan" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">📅</span>
          <span class="item-text">План обучения</span>
        </div>
      </router-link>

      <!-- Vocabulary -->
      <router-link to="/vocabulary" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">📚</span>
          <span class="item-text">Словарь</span>
          <span v-if="!hasVocabularyAccess" class="premium-badge">
            ⭐ Start
          </span>
        </div>
      </router-link>

      <!-- Analytics -->
      <router-link to="/analytics" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">📊</span>
          <span class="item-text">Аналитика</span>
          <span v-if="!hasAdvancedFeatures" class="premium-badge pro-badge">
            👑 Pro
          </span>
        </div>
      </router-link>

      <!-- Progress -->
      <router-link to="/progress" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">📈</span>
          <span class="item-text">Прогресс</span>
        </div>
      </router-link>

      <!-- Settings -->
      <router-link to="/settings" class="sidebar-item">
        <div class="item-content">
          <span class="item-icon">⚙️</span>
          <span class="item-text">Настройки</span>
        </div>
      </router-link>
    </nav>

    <!-- Upgrade Section for Free Users -->
    <div v-if="showUpgradeSection" class="upgrade-section">
      <div class="upgrade-card">
        <div class="upgrade-header">
          <h4>Получите больше возможностей!</h4>
          <span class="upgrade-badge">START</span>
        </div>
        <ul class="upgrade-benefits">
          <li>✅ Расширенный словарь</li>
          <li>✅ Дополнительные уроки</li>
          <li>✅ Персональные планы</li>
        </ul>
        <button class="upgrade-btn" @click="handleUpgrade">
          Попробовать Start
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <span class="item-icon">🚪</span>
        <span class="item-text">Выйти</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

export default {
  name: 'Sidebar',
  setup() {
    const router = useRouter();
    const { currentUser: user, logout } = useAuth();

    // Simple subscription status based on localStorage or default
    const userStatus = ref(localStorage.getItem('userSubscription') || 'free');
    
    // Computed properties for access control
    const hasVocabularyAccess = computed(() => {
      return userStatus.value === 'start' || userStatus.value === 'pro';
    });
    
    const hasAdvancedFeatures = computed(() => {
      return userStatus.value === 'pro';
    });

    // Subscription badge
    const subscriptionBadge = computed(() => {
      switch (userStatus.value) {
        case 'pro':
          return {
            icon: '👑',
            text: 'Pro',
            class: 'badge-pro'
          };
        case 'start':
          return {
            icon: '⭐',
            text: 'Start',
            class: 'badge-start'
          };
        default:
          return {
            icon: '🆓',
            text: 'Free',
            class: 'badge-free'
          };
      }
    });

    // Show upgrade section for free users
    const showUpgradeSection = computed(() => {
      return userStatus.value === 'free';
    });

    // Handle upgrade
    const handleUpgrade = () => {
      // Simulate upgrade - in real app this would open payment modal
      console.log('🚀 Opening upgrade modal...');
      // For demo purposes, let's upgrade to start
      userStatus.value = 'start';
      localStorage.setItem('userSubscription', 'start');
    };

    // Handle logout
    const handleLogout = async () => {
      try {
        await logout();
        // Clear subscription data
        localStorage.removeItem('userSubscription');
        router.push({ name: 'Login' });
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    };

    return {
      // Data
      user,
      userStatus,
      hasVocabularyAccess,
      hasAdvancedFeatures,
      subscriptionBadge,
      showUpgradeSection,

      // Methods
      handleUpgrade,
      handleLogout
    };
  }
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* User Info Section */
.user-info {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subscription-status {
  font-size: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.badge-pro {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.status-badge.badge-start {
  background: rgba(59, 130, 246, 0.8);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.badge-free {
  background: rgba(107, 114, 128, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.sidebar-item {
  position: relative;
  display: block;
  padding: 0.75rem 1.5rem;
  color: #374151;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
}

.sidebar-item:hover,
.sidebar-item.router-link-active {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border-left-color: #8b5cf6;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
}

.item-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.item-text {
  font-weight: 500;
  flex: 1;
}

/* Premium Features */
.premium-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
  animation: pulse-premium 2s ease-in-out infinite;
}

.pro-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

@keyframes pulse-premium {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Upgrade Section */
.upgrade-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  background: rgba(139, 92, 246, 0.02);
}

.upgrade-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upgrade-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.upgrade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.upgrade-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.upgrade-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.upgrade-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.upgrade-benefits li {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.upgrade-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.upgrade-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.upgrade-btn:active {
  transform: translateY(0);
}

/* Footer */
.sidebar-footer {
  padding: 1rem 0;
  border-top: 1px solid #e9ecef;
  background: rgba(0, 0, 0, 0.02);
}

.logout-btn {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0.75rem 1.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.logout-btn:active {
  background: rgba(239, 68, 68, 0.15);
}

/* Enhanced Scrollbar */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 260px;
  }
  
  .upgrade-section {
    padding: 0.75rem 1rem;
  }
  
  .upgrade-card {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 1000;
    flex-direction: row;
    overflow-x: auto;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    background: white;
  }
  
  .user-info {
    display: none;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 0;
    flex: 1;
    overflow-x: auto;
  }
  
  .sidebar-item {
    flex: 1;
    padding: 0.75rem 0.5rem;
    text-align: center;
    border-left: none;
    border-bottom: 3px solid transparent;
    min-width: 80px;
    white-space: nowrap;
  }
  
  .sidebar-item:hover,
  .sidebar-item.router-link-active {
    border-left: none;
    border-bottom-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  }
  
  .item-content {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .item-text {
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .item-icon {
    font-size: 1.1rem;
  }
  
  .premium-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    padding: 0.1rem 0.25rem;
    font-size: 0.55rem;
    transform: scale(0.8);
  }
  
  .upgrade-section,
  .sidebar-footer {
    display: none;
  }
}

@media (max-width: 480px) {
  .sidebar-item {
    min-width: 70px;
    padding: 0.5rem 0.25rem;
  }
  
  .item-text {
    font-size: 0.65rem;
  }
  
  .item-icon {
    font-size: 1rem;
  }
  
  .premium-badge {
    font-size: 0.5rem;
    padding: 0.05rem 0.2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .sidebar {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-right-color: #374151;
    color: #e2e8f0;
  }
  
  .sidebar-item {
    color: #e2e8f0;
  }
  
  .sidebar-item:hover,
  .sidebar-item.router-link-active {
    background: rgba(139, 92, 246, 0.2);
    color: #a855f7;
  }
  
  .upgrade-card {
    background: linear-gradient(135deg, #374151 0%, #1e293b 100%);
    border-color: #4b5563;
  }
  
  .upgrade-header h4 {
    color: #e2e8f0;
  }
  
  .upgrade-benefits li {
    color: #9ca3af;
  }
  
  .logout-btn {
    color: #9ca3af;
  }
  
  .logout-btn:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.15);
  }
  
  .sidebar-footer {
    background: rgba(0, 0, 0, 0.2);
    border-top-color: #374151;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .sidebar {
    border-right-width: 2px;
  }
  
  .sidebar-item {
    border-left-width: 4px;
  }
  
  .upgrade-card {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .sidebar-item:hover,
  .upgrade-card:hover,
  .upgrade-btn:hover,
  .logout-btn:hover {
    transform: none;
  }
}

/* Focus management for accessibility */
.sidebar-item:focus,
.upgrade-btn:focus,
.logout-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print styles */
@media print {
  .sidebar {
    display: none;
  }
}
</style>