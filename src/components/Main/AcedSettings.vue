<template>
  <div class="settings-page">
    <!-- User Profile Settings -->
    <div class="settings-content">
      <h2 class="section-title">⚙️ Настройки профиля</h2>

      <label>Имя</label>
      <input 
        type="text" 
        v-model="user.name" 
        placeholder="Введите имя"
        :disabled="loading" 
      />

      <label>Фамилия</label>
      <input 
        type="text" 
        v-model="user.surname" 
        placeholder="Введите фамилию"
        :disabled="loading" 
      />

      <label>Email</label>
      <input 
        type="email" 
        v-model="user.email" 
        placeholder="Введите email"
        :disabled="loading" 
      />

      <div v-if="!isGoogleUser">
        <label>Текущий пароль</label>
        <input 
          type="password" 
          v-model="oldPassword" 
          placeholder="Введите текущий пароль"
          :disabled="loading" 
        />

        <label>Новый пароль</label>
        <input 
          type="password" 
          v-model="newPassword" 
          placeholder="Введите новый пароль"
          :disabled="loading" 
        />

        <label>Подтвердите новый пароль</label>
        <input 
          type="password" 
          v-model="confirmPassword" 
          placeholder="Повторите новый пароль"
          :disabled="loading" 
        />
      </div>

      <p class="forgot-password" @click="sendPasswordReset">
        {{ isGoogleUser ? 'Создать пароль' : 'Забыли пароль?' }}
      </p>

      <div class="button-group">
        <button 
          class="save-button" 
          @click="saveChanges"
          :disabled="loading"
        >
          {{ loading ? '⏳ Сохранение...' : 'Сохранить' }}
        </button>
        <button class="back-button" @click="goToProfile">В профиль</button>
      </div>
    </div>

    <!-- Subscription and Payment Settings -->
    <div class="settings-content">
      <h2 class="section-title">💳 Подписка и оплата</h2>

      <!-- Sync Status Display -->
      <div v-if="lastSyncCheck" class="sync-status">
        <div class="sync-info">
          <span class="sync-icon">🔄</span>
          <span class="sync-text">
            Последняя синхронизация: {{ formatDate(lastSyncCheck) }}
          </span>
          <button 
            class="sync-button" 
            @click="forceSyncStatus"
            :disabled="syncInProgress"
          >
            {{ syncInProgress ? '⏳ Синхронизация...' : '🔄 Синхронизировать' }}
          </button>
        </div>
      </div>

      <!-- Current Plan Display -->
      <div class="current-plan-section">
        <div class="plan-info">
          <h3>Текущий тариф</h3>
          <div class="plan-display">
            <span :class="['plan-badge', currentPlanClass]">
              {{ currentPlanLabel }}
            </span>
            <div class="plan-details">
              <p class="plan-description">{{ currentPlanDescription }}</p>
              
              <!-- Subscription expiry information -->
              <div v-if="subscriptionExpiryInfo" class="expiry-section">
                <div class="expiry-main" :class="{ 
                  'expiry-warning': subscriptionExpiryInfo.isExpiring,
                  'expiry-expired': subscriptionExpiryInfo.isExpired 
                }">
                  <div class="expiry-row">
                    <span class="expiry-label">
                      {{ subscriptionExpiryInfo.isExpired ? '❌ Срок действия истёк:' : '📅 Активен до:' }}
                    </span>
                    <span class="expiry-date">{{ subscriptionExpiryInfo.formattedDate }}</span>
                  </div>
                  
                  <div v-if="!subscriptionExpiryInfo.isExpired" class="expiry-countdown">
                    <span class="countdown-icon">⏰</span>
                    <span class="countdown-text">
                      Осталось: {{ subscriptionExpiryInfo.timeRemaining }}
                      ({{ subscriptionExpiryInfo.daysRemaining }} дней)
                    </span>
                  </div>
                  
                  <div v-else class="expiry-expired-message">
                    <span class="expired-icon">⚠️</span>
                    <span class="expired-text">Подписка истекла. Продлите для продолжения доступа.</span>
                  </div>
                </div>
                
                <!-- Expiry warning alerts -->
                <div v-if="subscriptionExpiryInfo.isExpiring && !subscriptionExpiryInfo.isExpired" class="expiry-warning-alert">
                  <div class="warning-content">
                    <span class="warning-icon">⚠️</span>
                    <div class="warning-text">
                      <strong>Внимание!</strong> Ваша подписка истекает через {{ subscriptionExpiryInfo.daysRemaining }} дней.
                      <br>
                      <small>Продлите подписку, чтобы не потерять доступ к премиум-функциям.</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Subscription source information -->
              <div v-if="subscriptionSourceInfo" class="subscription-source">
                <div class="source-info" :class="`source-${subscriptionSourceInfo.color}`">
                  <span class="source-icon">{{ subscriptionSourceInfo.icon }}</span>
                  <span class="source-text">{{ subscriptionSourceInfo.text }}</span>
                </div>
              </div>
              
              <!-- Subscription benefits -->
              <div v-if="currentPlan !== 'free'" class="subscription-benefits">
                <div class="benefits-header">
                  <span class="benefits-icon">✨</span>
                  <span class="benefits-title">Активные возможности:</span>
                </div>
                <ul class="benefits-list">
                  <li v-if="currentPlan === 'start' || currentPlan === 'pro'">
                    ✅ Безлимитные сообщения
                  </li>
                  <li v-if="currentPlan === 'start' || currentPlan === 'pro'">
                    ✅ Доступ к премиум курсам
                  </li>
                  <li v-if="currentPlan === 'pro'">
                    ✅ Безлимитные изображения
                  </li>
                  <li v-if="currentPlan === 'pro'">
                    ✅ Персональная аналитика
                  </li>
                  <li v-if="currentPlan === 'pro'">
                    ✅ Эксклюзивные материалы
                  </li>
                </ul>
              </div>
              
              <!-- Free plan limitations -->
              <div v-else class="free-plan-limitations">
                <div class="limitations-header">
                  <span class="limitations-icon">ℹ️</span>
                  <span class="limitations-title">Ограничения бесплатного плана:</span>
                </div>
                <ul class="limitations-list">
                  <li>⭕ Ограниченное количество сообщений</li>
                  <li>⭕ Базовый доступ к курсам</li>
                  <li>⭕ Ограниченная аналитика</li>
                </ul>
                <div class="upgrade-suggestion">
                  <p>Хотите больше возможностей? Рассмотрите <strong>Start</strong> или <strong>Pro</strong> план!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Options -->
      <div class="payment-options">
        <h3>Варианты оплаты</h3>
        
        <!-- Enhanced Promo Code Section -->
        <div class="promo-section">
          <h4>🎟️ Промокод</h4>
          <div class="promo-input-group">
            <div class="promo-code-input">
              <input 
                type="text" 
                v-model="promoCode" 
                placeholder="Введите промокод (например: ACED2024)"
                :disabled="loading || isProcessingPromo"
                @keyup.enter="applyPromo"
                @input="handlePromoCodeInput"
                maxlength="20"
                class="promo-input"
                :class="{ 
                  'promo-valid': promoValidation && promoValidation.valid,
                  'promo-invalid': promoValidation && !promoValidation.valid && promoCode.length > 3,
                  'promo-loading': isValidatingPromo
                }"
              />
              
              <!-- Validation feedback -->
              <div v-if="isValidatingPromo" class="promo-validation promo-loading-message">
                <div class="spinner-small"></div>
                Проверка промокода...
              </div>
              
              <div v-else-if="promoValidation && promoCode.length > 3" class="promo-validation">
                <div v-if="promoValidation.valid" class="promo-valid-message">
                  ✅ Промокод действителен! 
                  <br>
                  <strong>Предоставляет: {{ promoValidation.data?.grantsPlan?.toUpperCase() }} план</strong>
                  <br>
                  <small>{{ promoValidation.data?.description }}</small>
                </div>
                <div v-else class="promo-invalid-message">
                  ❌ {{ promoValidation.error }}
                </div>
              </div>
            </div>
            
            <select 
              v-model="selectedPlan" 
              :disabled="loading || isProcessingPromo" 
              class="plan-select"
              @change="onPlanChange"
            >
              <option value="">Выберите тариф...</option>
              <option value="start" :disabled="currentPlan === 'start' || currentPlan === 'pro'">
                Start (260,000 сум) {{ currentPlan === 'start' ? '- Уже активен' : '' }}
              </option>
              <option value="pro" :disabled="currentPlan === 'pro'">
                Pro (455,000 сум) {{ currentPlan === 'pro' ? '- Уже активен' : '' }}
              </option>
            </select>
          </div>
          
          <!-- Plan compatibility warning -->
          <div v-if="planCompatibilityWarning" class="plan-warning">
            ⚠️ {{ planCompatibilityWarning }}
          </div>
          
          <button 
            class="promo-button" 
            @click="applyPromo"
            :disabled="!canApplyPromo || isProcessingPromo"
            :class="{ 
              'promo-button-ready': canApplyPromo && !isProcessingPromo,
              'promo-button-loading': isProcessingPromo 
            }"
          >
            {{ promoButtonText }}
          </button>
        </div>

        <!-- Applied Promocodes History -->
        <div v-if="appliedPromocodesCount > 0" class="applied-promocodes">
          <h4>📋 История применённых промокодов</h4>
          <div class="promocodes-list">
            <div 
              v-for="promo in appliedPromocodesSlice" 
              :key="promo.id || (promo.code + promo.appliedAt)"
              class="promocode-item"
            >
              <div class="promocode-info">
                <span class="promocode-code">{{ promo.code || 'N/A' }}</span>
                <span class="promocode-plan">{{ (promo.plan || 'unknown').toUpperCase() }}</span>
              </div>
              <div class="promocode-date">
                {{ formatDate(promo.appliedAt) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Plans -->
        <div class="plans-section" :class="{ 'plans-disabled': isPromocodeActive }">
          <h4>💰 Выберите тариф для оплаты</h4>
          
          <div v-if="isPromocodeActive" class="promocode-notice">
            <div class="notice-content">
              🎉 У вас активна подписка по промокоду! 
              <br>
              <small>Вы можете продлить подписку через оплату или применить новый промокод</small>
            </div>
          </div>
          
          <div class="plans-grid">
            <div 
              class="plan-card" 
              :class="{ 
                active: paymentPlan === 'start', 
                disabled: currentPlan === 'start' || currentPlan === 'pro',
                'current-plan': currentPlan === 'start'
              }"
              @click="selectPaymentPlan('start')"
            >
              <div class="plan-header">
                <h5>Start</h5>
                <div class="plan-price">260,000 сум</div>
              </div>
              <ul class="plan-features">
                <li>✅ Безлимитные сообщения</li>
                <li>✅ Доступ к словарю</li>
                <li>✅ Базовые курсы</li>
                <li>✅ Домашние задания</li>
                <li>✅ Основные тесты</li>
                <li>✅ Приоритетная поддержка</li>
              </ul>
              <div v-if="currentPlan === 'start'" class="plan-status">
                ✅ Активен
              </div>
            </div>
            
            <div 
              class="plan-card recommended" 
              :class="{ 
                active: paymentPlan === 'pro', 
                disabled: currentPlan === 'pro',
                'current-plan': currentPlan === 'pro'
              }"
              @click="selectPaymentPlan('pro')"
            >
              <div class="plan-badge">Рекомендуем</div>
              <div class="plan-header">
                <h5>Pro</h5>
                <div class="plan-price">455,000 сум</div>
              </div>
              <ul class="plan-features">
                <li>✅ Все возможности Start</li>
                <li>✅ Безлимитные изображения</li>
                <li>✅ Продвинутые курсы</li>
                <li>✅ Персональная аналитика</li>
                <li>✅ Персональные курсы</li>
                <li>✅ Эксклюзивные материалы</li>
              </ul>
              <div v-if="currentPlan === 'pro'" class="plan-status">
                ✅ Активен
              </div>
            </div>
          </div>
          
          <button 
            class="payment-button" 
            @click="goToPayment"
            :disabled="loading || !paymentPlan || (currentPlan !== 'free' && paymentPlan === currentPlan)"
          >
            {{ getPaymentButtonText() }}
          </button>
        </div>

        <!-- Payment History -->
        <div v-if="paymentHistoryCount > 0" class="payment-history">
          <h4>📊 История платежей</h4>
          <div class="history-list">
            <div 
              v-for="payment in paymentHistorySlice" 
              :key="payment.id || payment._id || payment.timestamp"
              class="payment-item"
            >
              <div class="payment-info">
                <span class="payment-id">{{ payment.id || payment._id || 'N/A' }}</span>
                <span class="payment-amount">{{ formatAmount(payment.amount) }}</span>
              </div>
              <div class="payment-status">
                <span :class="['status-badge', getStatusClass(payment.state || payment.status)]">
                  {{ payment.stateText || payment.statusText || 'Unknown' }}
                </span>
                <span class="payment-date">{{ formatDate(payment.timestamp || payment.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Summary -->
    <div v-if="!isFreeUser" class="settings-content">
      <h2 class="section-title">📊 Использование</h2>
      
      <div class="usage-summary">
        <div class="usage-item">
          <div class="usage-header">
            <span class="usage-label">Сообщения</span>
            <span class="usage-value">
              {{ currentUsageMessages }} / {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}
            </span>
          </div>
          <div v-if="usageLimitsMessages !== -1" class="usage-bar">
            <div class="usage-fill" :style="{ width: messageUsagePercentage + '%' }"></div>
          </div>
        </div>
        
        <div class="usage-item">
          <div class="usage-header">
            <span class="usage-label">Изображения</span>
            <span class="usage-value">
              {{ currentUsageImages }} / {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}
            </span>
          </div>
          <div v-if="usageLimitsImages !== -1" class="usage-bar">
            <div class="usage-fill" :style="{ width: imageUsagePercentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification" class="notification" :class="notificationClass">
      <span class="notification-icon">{{ notificationIcon }}</span>
      {{ notification }}
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingText }}</p>
    </div>
  </div>
</template>

<script>
import { auth, db } from "@/firebase";
import { mapGetters, mapActions } from 'vuex';
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default {
  name: 'AcedSettings',
  data() {
    return {
      // User profile data
      user: { name: "", surname: "", email: "" },
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      currentUser: null,
      isGoogleUser: false,
      
      // Payment data
      promoCode: "",
      selectedPlan: "",
      paymentPlan: "",
      
      // Promocode validation
      promoValidation: null,
      promoValidationTimeout: null,
      isValidatingPromo: false,
      isProcessingPromo: false,
      
      // UI state
      loading: false,
      loadingText: "",
      notification: "",
      notificationClass: "",
      notificationIcon: "",
      
      // Device sync state (added from paste.txt)
      syncInProgress: false,
      lastSyncCheck: null,
      syncInterval: null,
      
      // Enhanced reactivity tracking
      reactivityKey: 0,
      lastUpdateTime: Date.now(),
      componentMounted: false,
      statusEventListeners: [],
      storeUnsubscribe: null
    };
  },
  
  computed: {
    // Map user state and getters properly
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser', 
      'isStartUser',
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'getUser',
      'subscriptionDetails',
      'appliedPromocodes',
      'paymentHistory',
      'currentUsage',
      'usageLimits',
      'forceUpdateCounter'
    ]),

    // Enhanced reactive getters with multiple data sources
    currentPlan() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        // Try multiple sources for the most up-to-date status
        const storeStatus = this.$store.state.user?.subscriptionPlan || this.$store.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
        const userObjectStatus = this.getUser?.subscriptionPlan;
        
        // Use the most recent non-free status or fallback
        const statuses = [storeStatus, localStatus, userObjectStatus].filter(s => s && s !== 'free');
        const status = statuses[0] || storeStatus || localStatus || userObjectStatus || 'free';
        
        return status;
      } catch (e) {
        console.warn('⚠️ Error getting userStatus:', e);
        return localStorage.getItem('userStatus') || 'free';
      }
    },

    // Added computed property for checking if server status check is needed
    shouldCheckServerStatus() {
      const lastSync = localStorage.getItem('lastServerStatusCheck');
      const syncAge = lastSync ? Date.now() - parseInt(lastSync) : Infinity;
      return syncAge > 5 * 60 * 1000; // 5 minutes
    },
    
    // Enhanced reactive subscription details with comprehensive info
    subscriptionDetails() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const storeDetails = this.$store.getters['user/subscriptionDetails'];
        const userObject = this.getUser || {};
        
        // Merge multiple data sources for comprehensive details
        const details = {
          plan: this.currentPlan,
          status: this.currentPlan !== 'free' ? 'active' : 'inactive',
          expiryDate: null,
          source: null,
          activatedAt: null,
          daysRemaining: null,
          autoRenew: false,
          ...storeDetails,
          ...userObject.subscription
        };
        
        // Calculate expiry details if we have activation date
        if (details.activatedAt && !details.expiryDate) {
          const activationDate = new Date(details.activatedAt);
          const expiryDate = new Date(activationDate);
          expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days
          details.expiryDate = expiryDate.toISOString();
        }
        
        // Calculate days remaining
        if (details.expiryDate) {
          const now = new Date();
          const expiry = new Date(details.expiryDate);
          const diffTime = expiry - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          details.daysRemaining = Math.max(0, diffDays);
        }
        
        return details;
      } catch (e) {
        console.warn('⚠️ Error getting subscriptionDetails:', e);
        return { 
          plan: this.currentPlan,
          status: this.currentPlan !== 'free' ? 'active' : 'inactive',
          expiryDate: null,
          source: null,
          daysRemaining: null
        };
      }
    },
    
    // More detailed subscription status display
    currentPlanDescription() {
      const plan = this.currentPlan;
      const details = this.subscriptionDetails;
      
      const baseDescriptions = {
        pro: 'Полный доступ ко всем курсам и функциям',
        start: 'Доступ к базовым курсам и безлимитным сообщениям',
        free: 'Бесплатный доступ с ограниченным функционалом'
      };
      
      let description = baseDescriptions[plan] || 'Бесплатный доступ';
      
      // Add expiry information if available
      if (plan !== 'free' && details.daysRemaining !== null) {
        if (details.daysRemaining > 0) {
          description += ` (осталось ${details.daysRemaining} дней)`;
        } else {
          description += ' (срок действия истёк)';
        }
      }
      
      return description;
    },
    
    // Detailed subscription expiry information
    subscriptionExpiryInfo() {
      const details = this.subscriptionDetails;
      
      if (!details.expiryDate || this.currentPlan === 'free') {
        return null;
      }
      
      const expiryDate = new Date(details.expiryDate);
      const now = new Date();
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        expiryDate: expiryDate,
        daysRemaining: Math.max(0, diffDays),
        isExpiring: diffDays <= 7 && diffDays > 0,
        isExpired: diffDays <= 0,
        formattedDate: this.formatDate(details.expiryDate),
        timeRemaining: this.getTimeRemaining(diffTime)
      };
    },
    
    // Subscription source display
    subscriptionSourceInfo() {
      const details = this.subscriptionDetails;
      const lastPromo = this.lastPromocode;
      
      if (details.source === 'promocode' && lastPromo) {
        return {
          type: 'promocode',
          text: `🎟️ Активирован по промокоду: ${lastPromo.code}`,
          icon: '🎟️',
          color: 'success'
        };
      } else if (details.source === 'payment') {
        return {
          type: 'payment',
          text: '💳 Приобретено через оплату',
          icon: '💳',
          color: 'primary'
        };
      } else if (details.source === 'gift') {
        return {
          type: 'gift',
          text: '🎁 Подарочная подписка',
          icon: '🎁',
          color: 'warning'
        };
      } else if (this.currentPlan !== 'free') {
        return {
          type: 'unknown',
          text: '📋 Активная подписка',
          icon: '📋',
          color: 'info'
        };
      }
      
      return null;
    },
    
    // Enhanced reactive promocodes
    appliedPromocodes() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const promocodes = this.$store.getters['user/appliedPromocodes'];
        return Array.isArray(promocodes) ? promocodes : [];
      } catch (e) {
        console.warn('⚠️ Error getting appliedPromocodes:', e);
        return [];
      }
    },
    
    appliedPromocodesCount() {
      return this.appliedPromocodes.length;
    },
    
    appliedPromocodesSlice() {
      return this.appliedPromocodes.slice(0, 3);
    },
    
    // Enhanced reactive payment history
    paymentHistory() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const history = this.$store.getters['user/paymentHistory'];
        return Array.isArray(history) ? history : [];
      } catch (e) {
        console.warn('⚠️ Error getting paymentHistory:', e);
        return [];
      }
    },
    
    paymentHistoryCount() {
      return this.paymentHistory.length;
    },
    
    paymentHistorySlice() {
      return this.paymentHistory.slice(0, 5);
    },
    
    // Enhanced reactive usage data
    currentUsage() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const usage = this.$store.getters['user/currentUsage'];
        return (usage && typeof usage === 'object') ? usage : { messages: 0, images: 0 };
      } catch (e) {
        console.warn('⚠️ Error getting currentUsage:', e);
        return { messages: 0, images: 0 };
      }
    },
    
    currentUsageMessages() {
      return this.currentUsage.messages || 0;
    },
    
    currentUsageImages() {
      return this.currentUsage.images || 0;
    },
    
    usageLimits() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const limits = this.$store.getters['user/usageLimits'];
        return (limits && typeof limits === 'object') ? limits : { messages: 50, images: 5 };
      } catch (e) {
        console.warn('⚠️ Error getting usageLimits:', e);
        return { messages: 50, images: 5 };
      }
    },
    
    usageLimitsMessages() {
      return this.usageLimits.messages || 50;
    },
    
    usageLimitsImages() {
      return this.usageLimits.images || 5;
    },
    
    messageUsagePercentage() {
      const messages = this.currentUsageMessages;
      const limit = this.usageLimitsMessages;
      return (limit === -1) ? 0 : Math.min(100, Math.round((messages / limit) * 100));
    },
    
    imageUsagePercentage() {
      const images = this.currentUsageImages;
      const limit = this.usageLimitsImages;
      return (limit === -1) ? 0 : Math.min(100, Math.round((images / limit) * 100));
    },
    
    // Enhanced user status properties
    isFreeUser() {
      return this.currentPlan === 'free';
    },
    
    isPromocodeActive() {
      return this.subscriptionDetails.source === 'promocode';
    },
    
    subscriptionExpiryDate() {
      return this.subscriptionDetails.expiryDate;
    },
    
    lastPromocode() {
      return this.appliedPromocodes.length > 0 ? this.appliedPromocodes[0] : null;
    },
    
    currentPlanLabel() {
      const labels = {
        pro: 'Pro',
        start: 'Start', 
        free: 'Free'
      };
      return labels[this.currentPlan] || 'Free';
    },
    
    currentPlanClass() {
      const classes = {
        pro: 'badge-pro',
        start: 'badge-start',
        free: 'badge-free'
      };
      return classes[this.currentPlan] || 'badge-free';
    },
    
    userId() {
      return this.currentUser?.uid;
    },
    
    // Enhanced promocode validation computed properties
    canApplyPromo() {
      return this.promoCode && 
             this.promoCode.trim().length > 3 && 
             this.selectedPlan && 
             this.promoValidation &&
             this.promoValidation.valid === true &&
             !this.loading &&
             !this.isProcessingPromo &&
             !this.planCompatibilityError;
    },
    
    promoButtonText() {
      if (this.isProcessingPromo) {
        return '⏳ Применение...';
      }
      if (this.isValidatingPromo) {
        return '🔄 Проверка...';
      }
      if (!this.promoCode.trim()) {
        return 'Введите промокод';
      }
      if (!this.selectedPlan) {
        return 'Выберите тариф';
      }
      if (this.promoValidation && !this.promoValidation.valid) {
        return 'Неверный промокод';
      }
      if (this.planCompatibilityError) {
        return 'Проверьте тариф';
      }
      if (this.canApplyPromo) {
        return '🎉 Применить промокод';
      }
      return 'Применить промокод';
    },
    
    // Plan compatibility checking
    planCompatibilityError() {
      if (!this.promoValidation || !this.promoValidation.valid || !this.selectedPlan) return false;
      
      const promoGrantsPlan = this.promoValidation.data?.grantsPlan;
      if (promoGrantsPlan && promoGrantsPlan !== this.selectedPlan) {
        return true;
      }
      
      return false;
    },
    
    planCompatibilityWarning() {
      if (!this.planCompatibilityError) return null;
      
      const promoGrantsPlan = this.promoValidation.data?.grantsPlan?.toUpperCase();
      return `Этот промокод предоставляет план "${promoGrantsPlan}", но вы выбрали "${this.selectedPlan.toUpperCase()}". Выберите правильный план.`;
    }
  },
  
  // Enhanced watchers
  watch: {
    // Watch the user object from store
    '$store.state.user': {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // Watch the getUser getter
    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // Watch current plan changes
    currentPlan: {
      handler(newPlan, oldPlan) {
        if (newPlan !== oldPlan) {
          this.forceReactivityUpdate();
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    await this.initializeComponent();
    this.componentMounted = true;
    
    // ✅ ADD: Check server status on mount
    if (this.shouldCheckServerStatus) {
      await this.checkServerStatus();
    }
    
    // ✅ ADD: Set up sync mechanisms
    this.setupDeviceSync();
  },
  
  beforeUnmount() {
    this.cleanup();
    
    // ✅ ADD: Clean up sync mechanisms
    this.cleanupDeviceSync();
  },
  
  methods: {
    // ============================================================================
    // 🔄 STATUS CHANGE HANDLING
    // ============================================================================
    
    // Handle user status changes
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      try {
        // Update localStorage immediately
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('plan', newStatus);
        localStorage.setItem('statusChangeTime', Date.now().toString());

        // Trigger immediate reactivity update
        this.forceReactivityUpdate();

        // Show celebration for upgrades
        if (newStatus && newStatus !== 'free' && (oldStatus === 'free' || !oldStatus)) {
          const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
        }

      } catch (error) {
        console.error('❌ Error handling status change:', error);
        this.$forceUpdate(); // Fallback
      }
    },

    // ============================================================================
    // 🌐 DEVICE SYNC METHODS (FROM PASTE.TXT)
    // ============================================================================
    
    // ✅ NEW: Check server status method
    async checkServerStatus() {
      if (this.syncInProgress) return;
      
      const userId = this.currentUser?.firebaseId || this.currentUser?._id;
      if (!userId) return;
      
      try {
        this.syncInProgress = true;
        console.log('🌐 Checking server status for user:', userId);
        
        const token = await this.getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const endpoints = [
          `${process.env.VUE_APP_API_BASE_URL || 'https://api.aced.live'}/api/users/${userId}/status`,
          `${process.env.VUE_APP_API_BASE_URL || 'https://api.aced.live'}/api/users/${userId}`,
        ];
        
        let serverStatus = null;
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, { 
              headers,
              timeout: 5000 
            });
            
            if (response.ok) {
              const data = await response.json();
              serverStatus = data.status || 
                           data.subscriptionPlan || 
                           data.userStatus || 
                           data.user?.subscriptionPlan ||
                           null;
              
              if (serverStatus) {
                console.log('✅ Server status retrieved:', serverStatus);
                break;
              }
            }
          } catch (endpointError) {
            console.warn('⚠️ Endpoint failed:', endpoint, endpointError.message);
            continue;
          }
        }
        
        if (serverStatus && serverStatus !== this.currentPlan) {
          console.log('🔄 Status mismatch detected:', {
            local: this.currentPlan,
            server: serverStatus
          });
          
          await this.updateLocalStatus(serverStatus);
        }
        
        localStorage.setItem('lastServerStatusCheck', Date.now().toString());
        this.lastSyncCheck = Date.now();
        
      } catch (error) {
        console.error('❌ Server status check failed:', error);
      } finally {
        this.syncInProgress = false;
      }
    },
    
    // ✅ NEW: Update local status method
    async updateLocalStatus(newStatus) {
      const oldStatus = this.currentPlan;
      
      try {
        // Update localStorage
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('userPlan', newStatus);
        localStorage.setItem('subscriptionPlan', newStatus);
        localStorage.setItem('statusSyncTime', Date.now().toString());
        
        // Update store
        this.$store.commit('user/SET_USER_STATUS', newStatus);
        
        // Set up subscription persistence for paid plans
        if (newStatus !== 'free') {
          await this.setupSubscriptionPersistence(newStatus);
        }
        
        // Force reactivity update
        this.forceReactivityUpdate();
        
        // Trigger global events
        this.triggerStatusChangeEvents(oldStatus, newStatus);
        
        console.log('✅ Local status updated:', oldStatus, '->', newStatus);
        
        // Show notification for upgrades
        if (newStatus !== 'free' && oldStatus === 'free') {
          this.showNotification(`🎉 ${newStatus.toUpperCase()} подписка активирована на этом устройстве!`, 'success');
        }
        
      } catch (error) {
        console.error('❌ Failed to update local status:', error);
      }
    },
    
    // ✅ NEW: Setup subscription persistence
    async setupSubscriptionPersistence(plan) {
      try {
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        const subscriptionData = {
          plan: plan,
          activatedAt: now.toISOString(),
          expiryDate: expiryDate.toISOString(),
          lastUpdated: now.toISOString(),
          source: 'device-sync',
          status: 'active'
        };
        
        localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
        localStorage.setItem('subscriptionPlan', plan);
        localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
        
        console.log('✅ Subscription persistence set up for:', plan);
        
      } catch (error) {
        console.error('❌ Failed to setup subscription persistence:', error);
      }
    },
    
    // ✅ NEW: Trigger status change events
    triggerStatusChangeEvents(oldStatus, newStatus) {
      const eventData = {
        oldStatus,
        newStatus,
        source: 'device-sync',
        timestamp: Date.now(),
        deviceSync: true
      };
      
      // Trigger events using existing global functions
      if (window.triggerGlobalEvent) {
        window.triggerGlobalEvent('userStatusChanged', eventData);
        window.triggerGlobalEvent('userSubscriptionChanged', eventData);
        window.triggerGlobalEvent('subscriptionUpdated', eventData);
        window.triggerGlobalEvent('deviceStatusSynced', eventData);
      }
      
      if (window.eventBus?.emit) {
        window.eventBus.emit('userStatusChanged', eventData);
        window.eventBus.emit('subscriptionUpdated', eventData);
      }
    },
    
    // ✅ NEW: Setup device sync
    setupDeviceSync() {
      // Periodic sync every 10 minutes
      this.syncInterval = setInterval(() => {
        if (!this.syncInProgress && this.shouldCheckServerStatus) {
          this.checkServerStatus();
        }
      }, 10 * 60 * 1000);
      
      // Cross-tab sync
      this.handleStorageChange = (event) => {
        if (event.key === 'userStatus' && event.newValue !== event.oldValue) {
          console.log('🔄 Cross-tab status change detected:', event.oldValue, '->', event.newValue);
          
          if (event.newValue && this.$store) {
            this.$store.commit('user/SET_USER_STATUS', event.newValue);
            this.forceReactivityUpdate();
          }
        }
      };
      
      // Window focus check
      this.handleWindowFocus = () => {
        if (this.shouldCheckServerStatus) {
          setTimeout(() => {
            this.checkServerStatus();
          }, 1000);
        }
      };
      
      window.addEventListener('storage', this.handleStorageChange);
      window.addEventListener('focus', this.handleWindowFocus);
    },
    
    // ✅ NEW: Cleanup device sync
    cleanupDeviceSync() {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }
      
      window.removeEventListener('storage', this.handleStorageChange);
      window.removeEventListener('focus', this.handleWindowFocus);
    },
    
    // ✅ NEW: Get auth token
    async getAuthToken() {
      try {
        // Try Firebase auth
        if (this.$firebase?.auth?.currentUser) {
          return await this.$firebase.auth.currentUser.getIdToken();
        }
        
        // Try store
        if (this.$store.getters.getToken) {
          return this.$store.getters.getToken;
        }
        
        // Try localStorage
        return localStorage.getItem('token') || localStorage.getItem('authToken');
        
      } catch (error) {
        console.warn('⚠️ Failed to get auth token:', error);
        return null;
      }
    },
    
    // ✅ NEW: Manual sync trigger (can be called from UI)
    async forceSyncStatus() {
      await this.checkServerStatus();
    },

    // Setup comprehensive event listeners
    setupEnhancedEventListeners() {
      
      // Clear existing listeners
      this.cleanupEventListeners();
      
      // DOM Event Listeners
      if (typeof window !== 'undefined') {
        // Listen for user subscription changes
        this.handleSubscriptionChange = (event) => {
          const { plan, oldPlan, newStatus, oldStatus } = event.detail;
          const finalNewStatus = plan || newStatus;
          const finalOldStatus = oldPlan || oldStatus;
          
          if (finalNewStatus) {
            this.handleUserStatusChange(finalNewStatus, finalOldStatus);
          }
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('storage', this.handleStorageChange);
        });

        // Additional comprehensive events
        const eventTypes = [
          'userStatusChanged',
          'subscriptionUpdated', 
          'promocodeApplied',
          'paymentCompleted',
          'globalForceUpdate',
          'reactivityUpdate'
        ];

        const handleGenericStatusChange = (event) => {
          
          const detail = event.detail || {};
          const newStatus = detail.newStatus || detail.plan || detail.status;
          const oldStatus = detail.oldStatus || detail.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          } else {
            this.forceReactivityUpdate();
          }
          
          // Check localStorage for updates
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentPlan) {
            this.handleUserStatusChange(currentStatus, this.currentPlan);
          }
        };

        eventTypes.forEach(eventType => {
          window.addEventListener(eventType, handleGenericStatusChange);
          this.statusEventListeners.push(() => {
            window.removeEventListener(eventType, handleGenericStatusChange);
          });
        });
      }

      // Event Bus Listeners
      if (typeof window !== 'undefined' && window.eventBus) {
        // User status change events
        this.handleUserStatusEvent = (data) => {
          const newStatus = data.newStatus || data.plan;
          const oldStatus = data.oldStatus || data.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          }
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          this.forceReactivityUpdate();
          
          // Also check for status updates
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentPlan) {
            this.handleUserStatusChange(currentStatus, this.currentPlan);
          }
        };

        // Register event bus listeners
        const eventBusEvents = [
          'userStatusChanged',
          'promocodeApplied',
          'subscriptionUpdated',
          'paymentCompleted', 
          'forceUpdate',
          'globalForceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          if (eventType.includes('Status') || eventType.includes('promocode') || eventType.includes('payment') || eventType.includes('subscription')) {
            window.eventBus.on(eventType, this.handleUserStatusEvent);
            this.statusEventListeners.push(() => {
              window.eventBus.off(eventType, this.handleUserStatusEvent);
            });
          } else {
            window.eventBus.on(eventType, this.handleForceUpdateEvent);
            this.statusEventListeners.push(() => {
              window.eventBus.off(eventType, this.handleForceUpdateEvent);
            });
          }
        });

      }

      // Store Mutation Listener
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            this.forceReactivityUpdate();
            
            // Check for status changes in mutation payload
            if (mutation.payload && mutation.payload.subscriptionPlan) {
              const newStatus = mutation.payload.subscriptionPlan;
              if (newStatus !== this.currentPlan) {
                this.handleUserStatusChange(newStatus, this.currentPlan);
              }
            }
          }
        });
        
        this.statusEventListeners.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });
      }

    },

    // Check if mutation is user-related
    isUserRelatedMutation(mutation) {
      const userMutations = [
        'setUser',
        'SET_USER',
        'updateUser', 
        'UPDATE_USER',
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE',
        'user/ADD_PROMOCODE'
      ];
      
      return userMutations.some(type => mutation.type.includes(type)) ||
             mutation.type.includes('user/') ||
             mutation.type.toLowerCase().includes('status') ||
             mutation.type.toLowerCase().includes('subscription') ||
             mutation.type.toLowerCase().includes('plan');
    },

    // Enhanced forceReactivityUpdate
    forceReactivityUpdate() {
      try {
        this.reactivityKey++;
        this.lastUpdateTime = Date.now();
        
        // Multiple Vue reactivity triggers
        this.$forceUpdate();
        
        this.$nextTick(() => {
          this.$forceUpdate();
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 50);
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 200);
        });
        
        
      } catch (error) {
        console.warn('⚠️ AcedSettings: Reactivity update failed:', error);
      }
    },

    // Helper method to get time remaining display
    getTimeRemaining(diffTime) {
      if (diffTime <= 0) return 'Истёк';
      
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} дн. ${hours} ч.`;
      } else if (hours > 0) {
        return `${hours} ч.`;
      } else {
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} мин.`;
      }
    },

    // Enhanced cleanup
    cleanupEventListeners() {
      this.statusEventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ AcedSettings: Cleanup error:', error);
        }
      });
      this.statusEventListeners = [];
      
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
    },

    // ============================================================================
    // 🚀 INITIALIZATION METHODS
    // ============================================================================
    
    // Enhanced initialization
    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        
        // Setup event listeners BEFORE loading data
        this.setupEnhancedEventListeners();
        
        await this.loadInitialData();
        
        // Force initial reactivity update
        this.forceReactivityUpdate();
        
      } catch (error) {
        console.error('❌ AcedSettings initialization error:', error);
        this.showNotification('Ошибка загрузки настроек', 'error');
      } finally {
        this.loading = false;
      }
    },

    async loadInitialData() {
      try {
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('user/loadUserStatus');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load initial data:', error);
      }
    },
    
    checkAuthState() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.currentUser = user;
          if (user) {
            this.isGoogleUser = user.providerData[0]?.providerId === "google.com";
            await this.fetchUserData();
          }
          resolve();
        });
      });
    },
    
    async fetchUserData() {
      try {
        if (!this.currentUser) return;
        
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          this.user = userDoc.data();
        } else {
          const newUserData = {
            name: "Новый пользователь",
            surname: "",
            email: this.currentUser.email,
          };
          await setDoc(userRef, newUserData);
          this.user = newUserData;
        }
      } catch (error) {
        console.error('❌ User data fetch error:', error);
        this.showNotification("Ошибка загрузки данных пользователя", 'error');
      }
    },

    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      this.cleanupEventListeners();
    },

    // ============================================================================
    // 🎟️ FIXED PROMOCODE METHODS
    // ============================================================================
    
    // Enhanced promocode input handling
    handlePromoCodeInput() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      
      this.promoCode = this.promoCode.toUpperCase();
      
      if (this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      this.isValidatingPromo = true;
      
      this.promoValidationTimeout = setTimeout(() => {
        this.validatePromoCodeLocal();
      }, 800);
    },
    
    // ✅ FIXED: Pure backend promocode validation
    async validatePromoCodeLocal() {
      if (!this.promoCode.trim() || this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      try {
        
        const promocodeUpper = this.promoCode.trim().toUpperCase();
        
        // Try store action first (uses backend API)
        try {
          if (this.$store && this.$store.dispatch) {
            
            const storeResult = await this.$store.dispatch('user/validatePromocode', promocodeUpper);
            
            if (storeResult && typeof storeResult === 'object') {
              this.promoValidation = storeResult;
              
              // Auto-select plan if valid
              if (storeResult.valid && storeResult.data?.grantsPlan && !this.selectedPlan) {
                this.selectedPlan = storeResult.data.grantsPlan;
              }
              
              this.isValidatingPromo = false;
              return;
            }
          }
        } catch (storeError) {
          console.warn('⚠️ Store validation failed:', storeError.message);
        }
        
        // Direct API call fallback
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (!baseUrl) {
            throw new Error('API base URL not configured');
          }
          
          
          // Try multiple endpoints for validation
          const validationEndpoints = [
            `${baseUrl}/api/promocodes/validate/${promocodeUpper}`,
            `${baseUrl}/api/payments/validate-promo-code`,
            `${baseUrl}/promocodes/validate/${promocodeUpper}`
          ];
          
          let validationResult = null;
          
          for (const endpoint of validationEndpoints) {
            try {
              
              let response;
              
              if (endpoint.includes('validate-promo-code')) {
                // POST endpoint
                response = await Promise.race([
                  fetch(endpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': await this.getAuthHeader()
                    },
                    body: JSON.stringify({
                      promoCode: promocodeUpper,
                      userId: this.userId
                    })
                  }),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 8000)
                  )
                ]);
              } else {
                // GET endpoint
                response = await Promise.race([
                  fetch(endpoint, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': await this.getAuthHeader()
                    }
                  }),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 8000)
                  )
                ]);
              }
              
              if (response.ok) {
                const apiResult = await response.json();
                
                // Handle different response formats
                if (apiResult && typeof apiResult === 'object') {
                  validationResult = this.normalizeValidationResponse(apiResult, promocodeUpper);
                  break; // Success, stop trying other endpoints
                }
              } else {
                console.warn(`⚠️ API endpoint ${endpoint} failed with status:`, response.status);
                
                if (response.status === 404) {
                  continue;
                }
                
                try {
                  const errorData = await response.json();
                  console.warn('API error details:', errorData);
                  
                  if (response.status === 400 || response.status === 422) {
                    validationResult = {
                      valid: false,
                      error: errorData.message || errorData.error || `Промокод "${promocodeUpper}" не найден`
                    };
                    break;
                  }
                } catch (jsonError) {
                  console.warn('Failed to parse error response:', jsonError);
                }
              }
            } catch (endpointError) {
              console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);
              continue;
            }
          }
          
          if (validationResult) {
            this.promoValidation = validationResult;
            
            // Auto-select plan if valid
            if (validationResult.valid && validationResult.data?.grantsPlan && !this.selectedPlan) {
              this.selectedPlan = validationResult.data.grantsPlan;
            }
            
            this.isValidatingPromo = false;
            return;
          }
          
        } catch (apiError) {
          console.warn('⚠️ All API validation attempts failed:', apiError.message);
        }
        
        // If all backend attempts fail, show appropriate error
        this.promoValidation = {
          valid: false,
          error: `Не удалось проверить промокод "${promocodeUpper}". Проверьте подключение к интернету или попробуйте позже.`
        };
        
        
      } catch (error) {
        console.error('❌ Promocode validation error:', error);
        this.promoValidation = {
          valid: false,
          error: 'Ошибка проверки промокода. Попробуйте позже.'
        };
      } finally {
        this.isValidatingPromo = false;
      }
    },
    
    // Helper method to normalize different API response formats
    normalizeValidationResponse(apiResult, promocodeUpper) {
      try {
        let isValid = false;
        let grantsPlan = null;
        let description = null;
        let errorMessage = null;
        
        // Structure 1: { success: true, valid: true, data: {...} }
        if (apiResult.success === true && apiResult.valid === true) {
          isValid = true;
          grantsPlan = apiResult.data?.grantsPlan || apiResult.data?.plan;
          description = apiResult.data?.description || apiResult.message;
        }
        // Structure 2: { valid: true, data: {...} }
        else if (apiResult.valid === true) {
          isValid = true;
          grantsPlan = apiResult.data?.grantsPlan || apiResult.data?.plan;
          description = apiResult.data?.description || apiResult.message;
        }
        // Structure 3: { success: false, error: "..." }
        else if (apiResult.success === false) {
          isValid = false;
          errorMessage = apiResult.error || apiResult.message || 'Промокод недействителен';
        }
        // Structure 4: Direct data object { grantsPlan: "start", description: "..." }
        else if (apiResult.grantsPlan || apiResult.plan) {
          isValid = true;
          grantsPlan = apiResult.grantsPlan || apiResult.plan;
          description = apiResult.description || 'Промокод действителен';
        }
        // Structure 5: Error object { error: "..." }
        else if (apiResult.error) {
          isValid = false;
          errorMessage = apiResult.error;
        }
        // Structure 6: Invalid response
        else {
          isValid = false;
          errorMessage = 'Неизвестный формат ответа сервера';
        }
        
        if (isValid) {
          return {
            valid: true,
            data: {
              code: promocodeUpper,
              grantsPlan: grantsPlan,
              description: description,
              subscriptionDays: apiResult.data?.subscriptionDays || apiResult.subscriptionDays || 30
            },
            message: `Промокод действителен! Предоставляет: ${(grantsPlan || 'неизвестный').toUpperCase()} план`
          };
        } else {
          return {
            valid: false,
            error: errorMessage || `Промокод "${promocodeUpper}" не найден или недействителен`
          };
        }
        
      } catch (normalizationError) {
        console.error('❌ Failed to normalize API response:', normalizationError);
        return {
          valid: false,
          error: 'Ошибка обработки ответа сервера'
        };
      }
    },
    
    // Helper method to get authorization header
    async getAuthHeader() {
      try {
        if (this.currentUser) {
          const token = await this.currentUser.getIdToken();
          if (token) {
            return `Bearer ${token}`;
          }
        }
        
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (storedToken) {
          return `Bearer ${storedToken}`;
        }
        
        return '';
      } catch (error) {
        console.warn('⚠️ Failed to get auth header:', error);
        return '';
      }
    },
    
    onPlanChange() {
      if (this.promoValidation && this.promoValidation.valid && this.selectedPlan) {
        const promoGrantsPlan = this.promoValidation.data?.grantsPlan;
        if (promoGrantsPlan && promoGrantsPlan !== this.selectedPlan) {
          this.showNotification(
            `Промокод предоставляет план "${promoGrantsPlan.toUpperCase()}", но вы выбрали "${this.selectedPlan.toUpperCase()}"`, 
            'warning'
          );
        }
      }
    },
    
    // ✅ MAIN FIX: Correct promocode application using the right Vuex action
    async applyPromo() {
      
      if (!this.promoCode || !this.selectedPlan || !this.userId) {
        this.showNotification('Заполните все поля', 'error');
        return;
      }
      
      this.isProcessingPromo = true;
      
      try {
        const normalizedCode = this.promoCode.trim().toUpperCase();
        
        
        // ✅ CRITICAL FIX: Use the correct applyPromocode action instead of updateUserStatus
        const result = await this.$store.dispatch('user/applyPromocode', {
          code: normalizedCode,
          plan: this.selectedPlan,
          userId: this.userId
        });
        
        
        // Check if the result indicates success
        if (result && (result.success === true || result.status === 'success')) {
          
          // Success feedback
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          // Reset form
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          // Force reactivity update
          this.forceReactivityUpdate();
          
          // Trigger global events for component updates
          if (typeof window !== 'undefined') {
            // Method 1: Custom DOM event
            try {
              const event = new CustomEvent('userSubscriptionChanged', {
                detail: {
                  plan: this.selectedPlan,
                  oldPlan: result.oldStatus || 'free',
                  source: 'promocode',
                  promocode: normalizedCode,
                  timestamp: Date.now()
                },
                bubbles: true
              });
              window.dispatchEvent(event);
            } catch (domEventError) {
              console.warn('⚠️ DOM event failed:', domEventError);
            }
            
            // Method 2: Event bus
            try {
              if (window.eventBus?.emit) {
                window.eventBus.emit('promocodeApplied', {
                  newStatus: this.selectedPlan,
                  oldStatus: result.oldStatus || 'free',
                  code: normalizedCode,
                  success: true
                });
              }
            } catch (eventBusError) {
              console.warn('⚠️ Event bus failed:', eventBusError);
            }
          }
          
          return;
          
        } else {
          // Handle store action failure
          console.warn('⚠️ Store applyPromocode action failed:', result);
          
          const errorMessage = result?.error || result?.message || 'Не удалось применить промокод';
          this.showNotification(errorMessage, 'error');
          
          // If it's a validation error, don't try fallback
          if (result?.error?.includes('не найден') || result?.error?.includes('недействителен')) {
            return;
          }
          
          // Try backend fallback for other errors
          await this.applyPromocodeFallback(normalizedCode);
        }
        
      } catch (storeError) {
        console.error('❌ Store applyPromocode action threw error:', storeError);
        
        // Try backend fallback
        await this.applyPromocodeFallback(normalizedCode);
        
      } finally {
        this.isProcessingPromo = false;
      }
    },
    
    // ✅ NEW: Backend fallback method for promocode application
    async applyPromocodeFallback(normalizedCode) {
      try {
        
        // Try multiple endpoints for applying promocode
        const applyEndpoints = [
          'https://api.aced.live/api/payments/promo-code',
          `${import.meta.env.VITE_API_BASE_URL}/api/payments/promo-code`
        ].filter(url => url && !url.includes('undefined'));
        
        let serverSuccess = false;
        let serverResult = null;
        
        for (const endpoint of applyEndpoints) {
          try {
            
            const requestBody = {
              userId: this.userId,
              plan: this.selectedPlan,
              promoCode: normalizedCode
            };
            
            const response = await Promise.race([
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': await this.getAuthHeader()
                },
                body: JSON.stringify(requestBody)
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
              )
            ]);

            serverResult = await response.json();

            if (response.ok && serverResult?.success) {
              serverSuccess = true;
              break;
            } else {
              console.warn(`⚠️ Endpoint ${endpoint} failed:`, serverResult?.error || 'Unknown error');
              
              if (response.status === 400 || response.status === 422) {
                const errorMsg = serverResult?.error || serverResult?.message || 'Неверный промокод';
                this.showNotification(errorMsg, 'error');
                return;
              }
              
              if (response.status === 404) {
                continue;
              }
            }
          } catch (endpointError) {
            console.warn(`⚠️ Apply endpoint ${endpoint} failed:`, endpointError.message);
            continue;
          }
        }
        
        if (serverSuccess) {
          // Backend success - update local state
          
          // Update localStorage
          localStorage.setItem('userStatus', this.selectedPlan);
          localStorage.setItem('plan', this.selectedPlan);
          
          // Force store mutation
          this.$store.commit('user/SET_USER_STATUS', this.selectedPlan);
          this.$store.commit('user/UPDATE_SUBSCRIPTION', {
            plan: this.selectedPlan,
            status: 'active',
            source: 'promocode'
          });
          this.$store.commit('user/ADD_PROMOCODE', {
            code: normalizedCode,
            plan: this.selectedPlan,
            appliedAt: new Date().toISOString()
          });
          
          // Success feedback
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          // Reset form
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          // Force reactivity update
          this.forceReactivityUpdate();
          
          // Trigger events
          this.triggerSubscriptionChangeEvents(normalizedCode);
          
        } else {
          const errorMsg = serverResult?.error || 
                          serverResult?.message || 
                          'Не удалось применить промокод. Проверьте правильность кода или попробуйте позже.';
          this.showNotification(errorMsg, 'error');
        }
        
      } catch (fallbackError) {
        console.error('❌ Backend fallback failed:', fallbackError);
        
        let userFriendlyError = 'Произошла ошибка при применении промокода';
        
        if (fallbackError.message === 'Request timeout') {
          userFriendlyError = 'Истекло время ожидания. Попробуйте снова.';
        } else if (fallbackError.name === 'TypeError' && fallbackError.message.includes('fetch')) {
          userFriendlyError = 'Ошибка сети. Проверьте подключение к интернету.';
        }
        
        this.showNotification(userFriendlyError, 'error');
      }
    },
    
    // ✅ NEW: Helper method to trigger subscription change events
    triggerSubscriptionChangeEvents(promocode) {
      if (typeof window !== 'undefined') {
        // Method 1: Custom DOM event
        try {
          const event = new CustomEvent('userSubscriptionChanged', {
            detail: {
              plan: this.selectedPlan,
              oldPlan: 'free',
              source: 'promocode',
              promocode: promocode,
              timestamp: Date.now()
            },
            bubbles: true
          });
          window.dispatchEvent(event);
        } catch (domEventError) {
          console.warn('⚠️ DOM event failed:', domEventError);
        }
        
        // Method 2: Event bus
        try {
          if (window.eventBus?.emit) {
            window.eventBus.emit('promocodeApplied', {
              newStatus: this.selectedPlan,
              oldStatus: 'free',
              code: promocode,
              success: true
            });
          }
        } catch (eventBusError) {
          console.warn('⚠️ Event bus failed:', eventBusError);
        }
        
        // Method 3: Global trigger function
        try {
          if (window.triggerGlobalEvent) {
            window.triggerGlobalEvent('userStatusChanged', {
              oldStatus: 'free',
              newStatus: this.selectedPlan,
              source: 'promocode-applied',
              timestamp: Date.now()
            });
          }
        } catch (globalTriggerError) {
          console.warn('⚠️ Global trigger failed:', globalTriggerError);
        }
      }
    },

    // ============================================================================
    // 💳 PAYMENT METHODS
    // ============================================================================
    
    selectPaymentPlan(plan) {
      if (this.currentPlan === plan || (this.currentPlan === 'pro' && plan === 'start')) {
        return; // Don't allow selecting current plan or downgrade
      }
      this.paymentPlan = plan;
    },

    async goToPayment() {
      this.$router.push(`/payment?plan=${this.paymentPlan}`);
    },

    getPaymentButtonText() {
      if (!this.paymentPlan) return 'Выберите тариф';
      if (this.currentPlan === this.paymentPlan) return 'Уже активен';
      return `Оплатить ${this.paymentPlan.toUpperCase()}`;
    },

    // ============================================================================
    // 👤 USER PROFILE METHODS
    // ============================================================================
    
    async saveChanges() {
      this.loading = true;
      this.loadingText = 'Сохранение изменений...';
      
      try {
        if (!this.currentUser) {
          this.showNotification('Пользователь не найден', 'error');
          return;
        }

        // Update user profile
        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, {
          name: this.user.name,
          surname: this.user.surname,
          email: this.user.email,
          updatedAt: new Date().toISOString()
        });

        // Update email if changed
        if (this.user.email !== this.currentUser.email) {
          await updateEmail(this.currentUser, this.user.email);
        }

        // Update password if provided
        if (this.newPassword && this.oldPassword) {
          if (this.newPassword !== this.confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
          }

          const credential = EmailAuthProvider.credential(
            this.currentUser.email,
            this.oldPassword
          );

          await reauthenticateWithCredential(this.currentUser, credential);
          await updatePassword(this.currentUser, this.newPassword);

          // Clear password fields
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }

        this.showNotification('Изменения сохранены успешно!', 'success');

      } catch (error) {
        console.error('❌ Save changes error:', error);
        
        let errorMessage = 'Ошибка сохранения изменений';
        
        if (error.code === 'auth/wrong-password') {
          errorMessage = 'Неверный текущий пароль';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Пароль слишком слабый';
        } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email уже используется';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Неверный формат email';
        }
        
        this.showNotification(errorMessage, 'error');
      } finally {
        this.loading = false;
      }
    },

    async sendPasswordReset() {
      if (!this.user.email) {
        this.showNotification('Введите email адрес', 'error');
        return;
      }

      try {
        await sendPasswordResetEmail(auth, this.user.email);
        this.showNotification('Письмо для сброса пароля отправлено!', 'success');
      } catch (error) {
        console.error('❌ Password reset error:', error);
        
        let errorMessage = 'Ошибка отправки письма';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Пользователь с таким email не найден';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Неверный формат email';
        }
        
        this.showNotification(errorMessage, 'error');
      }
    },

    goToProfile() {
      this.$router.push('/profile');
    },

    // ============================================================================
    // 🛠️ UTILITY METHODS
    // ============================================================================
    
    formatDate(date) {
      if (!date) return '';
      try {
        return new Date(date).toLocaleDateString('ru-RU');
      } catch (error) {
        console.warn('⚠️ Invalid date format:', date);
        return '';
      }
    },

    formatAmount(amount) {
      try {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' сум';
      } catch (error) {
        console.warn('⚠️ Invalid amount format:', amount);
        return amount + ' сум';
      }
    },

    getStatusClass(state) {
      const classes = {
        success: 'status-success',
        pending: 'status-warning',
        failed: 'status-error',
        completed: 'status-success',
        2: 'status-success',
        1: 'status-warning',
        0: 'status-warning',
        '-1': 'status-error',
        '-2': 'status-error'
      };
      return classes[state] || 'status-warning';
    },

    showNotification(message, type = 'info', duration = 5000) {
      this.notification = message;
      this.notificationClass = `notification-${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      this.notificationIcon = icons[type] || 'ℹ️';
      
      setTimeout(() => {
        this.notification = '';
        this.notificationClass = '';
        this.notificationIcon = '';
      }, duration);
    }
  }
}
</script>

<style scoped>
@import "@/assets/css/AcedSettings.css";

/* Additional styles for device sync status */
.sync-status {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sync-icon {
  font-size: 18px;
}

.sync-text {
  color: #6c757d;
  font-size: 14px;
  flex: 1;
  min-width: 200px;
}

.sync-button {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.sync-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.sync-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Enhanced subscription source styles */
.subscription-source {
  margin-top: 10px;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.source-info.source-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.source-info.source-primary {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.source-info.source-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.source-info.source-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

/* Enhanced expiry warning styles */
.expiry-warning-alert {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 8px;
}

.warning-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.warning-icon {
  font-size: 20px;
  margin-top: 2px;
}

.warning-text {
  flex: 1;
  color: #856404;
}

.warning-text strong {
  color: #533f03;
}

.warning-text small {
  display: block;
  margin-top: 5px;
  opacity: 0.8;
}

/* Enhanced usage progress bars */
.usage-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #20c997 50%, #17a2b8 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Spinner animations */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design improvements */
@media (max-width: 768px) {
  .sync-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .sync-button {
    align-self: stretch;
    text-align: center;
  }
  
  .warning-content {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-icon {
    align-self: flex-start;
  }
}
</style>