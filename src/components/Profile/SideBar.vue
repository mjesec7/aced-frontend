<template>
  <div class="sidebar">
    <!-- User Info Section -->
    <div class="user-info">
      <div class="user-avatar">
        <img v-if="user?.photoURL" :src="user.photoURL" :alt="user.displayName" />
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
        <span class="item-icon">🏠</span>
        <span class="item-text">Главная</span>
      </router-link>

      <!-- Catalogue -->
      <router-link to="/catalogue" class="sidebar-item">
        <span class="item-icon">📖</span>
        <span class="item-text">Каталог</span>
      </router-link>

      <!-- Study Plan -->
      <router-link to="/study-plan" class="sidebar-item">
        <span class="item-icon">📅</span>
        <span class="item-text">План обучения</span>
      </router-link>

      <!-- Vocabulary (Premium Feature) -->
      <div 
        class="sidebar-item" 
        :class="{ 
          'premium-item': !hasVocabularyAccess,
          'has-access': hasVocabularyAccess 
        }"
        @click="handleVocabularyClick"
      >
        <div class="item-content">
          <span class="item-icon">📚</span>
          <span class="item-text">Словарь</span>
          <span v-if="!hasVocabularyAccess" class="premium-badge">
            ⭐ Start
          </span>
        </div>
        <div v-if="!hasVocabularyAccess" class="lock-overlay">
          <span class="lock-icon">🔒</span>
        </div>
      </div>

      <!-- Analytics (Pro Feature) -->
      <div 
        class="sidebar-item" 
        :class="{ 
          'premium-item': !hasAdvancedFeatures,
          'has-access': hasAdvancedFeatures 
        }"
        @click="handleAnalyticsClick"
      >
        <div class="item-content">
          <span class="item-icon">📊</span>
          <span class="item-text">Аналитика</span>
          <span v-if="!hasAdvancedFeatures" class="premium-badge pro-badge">
            👑 Pro
          </span>
        </div>
        <div v-if="!hasAdvancedFeatures" class="lock-overlay">
          <span class="lock-icon">🔒</span>
        </div>
      </div>

      <!-- Progress -->
      <router-link to="/progress" class="sidebar-item">
        <span class="item-icon">📈</span>
        <span class="item-text">Прогресс</span>
      </router-link>

      <!-- Settings -->
      <router-link to="/settings" class="sidebar-item">
        <span class="item-icon">⚙️</span>
        <span class="item-text">Настройки</span>
      </router-link>
    </nav>

    <!-- Upgrade Section for Free/Start Users -->
    <div v-if="recommendedUpgrade" class="upgrade-section">
      <div class="upgrade-card">
        <div class="upgrade-header">
          <h4>{{ userStatus === 'free' ? 'Получите больше!' : 'Улучшите подписку!' }}</h4>
          <span class="upgrade-badge">{{ recommendedUpgrade.plan.toUpperCase() }}</span>
        </div>
        <ul class="upgrade-benefits">
          <li v-for="benefit in recommendedUpgrade.benefits" :key="benefit">
            ✅ {{ benefit }}
          </li>
        </ul>
        <button class="upgrade-btn" @click="showUpgradeModal = true">
          {{ userStatus === 'free' ? 'Попробовать Start' : 'Обновить до Pro' }}
        </button>
      </div>
    </div>

    <!-- Subscription Expiry Warning -->
    <div v-if="isSubscriptionExpiringSoon" class="expiry-warning">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          <strong>Подписка истекает</strong>
          <span>через {{ daysUntilExpiry }} {{ getDaysText(daysUntilExpiry) }}</span>
        </div>
      </div>
      <button class="renew-btn" @click="showRenewalModal = true">
        Продлить
      </button>
    </div>

    <!-- Logout -->
    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <span class="item-icon">🚪</span>
        <span class="item-text">Выйти</span>
      </button>
    </div>

    <!-- Modals -->
    <PaymentModal
      v-if="showVocabularyPaywall"
      :user-id="userId"
      :visible="showVocabularyPaywall"
      :default-plan="'start'"
      :requested-topic-id="null"
      @close="showVocabularyPaywall = false"
      @unlocked="handleVocabularyUnlocked"
    />

    <PaymentModal
      v-if="showAnalyticsPaywall"
      :user-id="userId"
      :visible="showAnalyticsPaywall"
      :default-plan="'pro'"
      :requested-topic-id="null"
      @close="showAnalyticsPaywall = false"
      @unlocked="handleAnalyticsUnlocked"
    />

    <PaymentModal
      v-if="showUpgradeModal"
      :user-id="userId"
      :visible="showUpgradeModal"
      :default-plan="recommendedUpgrade?.plan || 'start'"
      :requested-topic-id="null"
      @close="showUpgradeModal = false"
      @unlocked="handleUpgradeUnlocked"
    />

    <PaymentModal
      v-if="showRenewalModal"
      :user-id="userId"
      :visible="showRenewalModal"
      :default-plan="userStatus"
      :requested-topic-id="null"
      @close="showRenewalModal = false"
      @unlocked="handleRenewalUnlocked"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useAuth } from '@/composables/useAuth';

export default {
  name: 'Sidebar',
  components: {
    PaymentModal
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const { currentUser: user, logout } = useAuth();
    


    // Modal states
    const showVocabularyPaywall = ref(false);
    const showAnalyticsPaywall = ref(false);
    const showUpgradeModal = ref(false);
    const showRenewalModal = ref(false);

    // User ID for payment modal
    const userId = computed(() => {
      return user.value?.uid || 
             localStorage.getItem('firebaseUserId') || 
             localStorage.getItem('userId') || 
             'demo_user';
    });

    // Handle vocabulary access
    const handleVocabularyClick = async () => {
      if (hasVocabularyAccess.value) {
        router.push({ name: 'VocabularyPage' });
      } else {
        showVocabularyPaywall.value = true;
      }
    };

    // Handle analytics access
    const handleAnalyticsClick = async () => {
      if (hasAdvancedFeatures.value) {
        router.push({ name: 'AnalyticsPage' });
      } else {
        showAnalyticsPaywall.value = true;
      }
    };

 

    // Handle logout
    const handleLogout = async () => {
      try {
        await logout();
        router.push({ name: 'Login' });
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    };

    // Helper function for days text
    const getDaysText = (days) => {
      if (days === 1) return 'день';
      if (days < 5) return 'дня';
      return 'дней';
    };

    return {
      // Data
      user,
      userId,
      userStatus,
      hasVocabularyAccess,
      hasAdvancedFeatures,
      subscriptionBadge,
      isSubscriptionExpiringSoon,
      daysUntilExpiry,
      recommendedUpgrade,

      // Modal states
      showVocabularyPaywall,
      showAnalyticsPaywall,
      showUpgradeModal,
      showRenewalModal,

      // Methods
      handleVocabularyClick,
      handleAnalyticsClick,
      handleVocabularyUnlocked,
      handleAnalyticsUnlocked,
      handleUpgradeUnlocked,
      handleRenewalUnlocked,
      handleLogout,
      getDaysText
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
.premium-item {
  position: relative;
  overflow: hidden;
}

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

.lock-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    135deg, 
    rgba(107, 114, 128, 0.05) 0%, 
    rgba(156, 163, 175, 0.05) 100%
  );
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1.5rem;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 1;
}

.lock-icon {
  font-size: 1rem;
  color: #9ca3af;
}

.premium-item:hover .lock-overlay {
  opacity: 1;
  background: linear-gradient(
    135deg, 
    rgba(139, 92, 246, 0.1) 0%, 
    rgba(168, 85, 247, 0.1) 100%
  );
}

.premium-item:hover .item-text {
  color: #8b5cf6;
}

.premium-item:hover .premium-badge {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
}

/* Upgrade Section */
.upgrade-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
}

.upgrade-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.upgrade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.upgrade-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.upgrade-badge {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.upgrade-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem 0;
}

.upgrade-benefits li {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.upgrade-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3);
}

/* Expiry Warning */
.expiry-warning {
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 1.5rem;
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { box-shadow: 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2); }
}

.warning-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.warning-icon {
  font-size: 1rem;
}

.warning-text {
  flex: 1;
  font-size: 0.75rem;
}

.warning-text strong {
  display: block;
  color: #92400e;
  font-weight: 600;
}

.warning-text span {
  color: #b45309;
}

.renew-btn {
  width: 100%;
  background: #f59e0b;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.renew-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

/* Footer */
.sidebar-footer {
  padding: 1rem 0;
  border-top: 1px solid #e9ecef;
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
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Responsive */
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
  }
  
  .user-info {
    display: none;
  }
  
  .sidebar-nav {
    display: flex;
    flex-direction: row;
    padding: 0.5rem 0;
    flex: 1;
  }
  
  .sidebar-item {
    flex: 1;
    padding: 0.5rem;
    text-align: center;
    border-left: none;
    border-bottom: 3px solid transparent;
    min-width: 80px;
  }
  
  .sidebar-item:hover,
  .sidebar-item.router-link-active {
    border-left: none;
    border-bottom-color: #8b5cf6;
  }
  
  .item-content {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .item-text {
    font-size: 0.7rem;
  }
  
  .item-icon {
    font-size: 1rem;
  }
  
  .premium-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    padding: 0.1rem 0.25rem;
    font-size: 0.6rem;
  }
  
  .upgrade-section,
  .expiry-warning,
  .sidebar-footer {
    display: none;
  }
}
</style>