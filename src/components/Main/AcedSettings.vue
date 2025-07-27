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

      <!-- ✅ ENHANCED: Current Plan Display with comprehensive details -->
      <div class="current-plan-section">
        <div class="plan-info">
          <h3>Текущий тариф</h3>
          <div class="plan-display">
            <span :class="['plan-badge', currentPlanClass]">
              {{ currentPlanLabel }}
            </span>
            <div class="plan-details">
              <p class="plan-description">{{ currentPlanDescription }}</p>
              
              <!-- ✅ ENHANCED: Comprehensive subscription expiry information -->
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
                
                <!-- ✅ ENHANCED: Expiry warning alerts -->
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
              
              <!-- ✅ ENHANCED: Subscription source information -->
              <div v-if="subscriptionSourceInfo" class="subscription-source">
                <div class="source-info" :class="`source-${subscriptionSourceInfo.color}`">
                  <span class="source-icon">{{ subscriptionSourceInfo.icon }}</span>
                  <span class="source-text">{{ subscriptionSourceInfo.text }}</span>
                </div>
              </div>
              
              <!-- ✅ ENHANCED: Additional subscription details -->
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
              
              <!-- ✅ ENHANCED: Free plan limitations -->
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
      
      // ✅ ENHANCED: Add comprehensive reactivity tracking
      reactivityKey: 0,
      lastUpdateTime: Date.now(),
      componentMounted: false,
      statusEventListeners: [],
      storeUnsubscribe: null
    };
  },
  
  computed: {
    // ✅ ENHANCED: Map both user state and getters properly
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

    // ✅ BULLETPROOF: Enhanced reactive getters with multiple data sources
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
        
        console.log('🔍 AcedSettings currentPlan computed:', {
          final: status,
          store: storeStatus,
          local: localStatus,
          userObject: userObjectStatus,
          reactKey, 
          updateTime
        });
        
        return status;
      } catch (e) {
        console.warn('⚠️ Error getting userStatus:', e);
        return localStorage.getItem('userStatus') || 'free';
      }
    },
    
    // ✅ BULLETPROOF: Enhanced reactive subscription details with comprehensive info
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
        
        console.log('🔍 AcedSettings subscriptionDetails computed:', details, { reactKey, updateTime });
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
    
    // ✅ ENHANCED: More detailed subscription status display
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
    
    // ✅ ENHANCED: Detailed subscription expiry information
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
    
    // ✅ ENHANCED: Subscription source display
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
    
    // ✅ BULLETPROOF: Enhanced reactive promocodes
    appliedPromocodes() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const promocodes = this.$store.getters['user/appliedPromocodes'];
        console.log('🔍 appliedPromocodes computed:', promocodes, { reactKey, updateTime });
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
    
    // ✅ BULLETPROOF: Enhanced reactive payment history
    paymentHistory() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const history = this.$store.getters['user/paymentHistory'];
        console.log('🔍 paymentHistory computed:', history, { reactKey, updateTime });
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
    
    // ✅ BULLETPROOF: Enhanced reactive usage data
    currentUsage() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const usage = this.$store.getters['user/currentUsage'];
        console.log('🔍 currentUsage computed:', usage, { reactKey, updateTime });
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
        console.log('🔍 usageLimits computed:', limits, { reactKey, updateTime });
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
    
    // ✅ BULLETPROOF: Enhanced user status properties
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
  
  // ✅ ENHANCED: Add comprehensive watchers
  watch: {
    // ✅ FIXED: Watch the user object from store (same as other components)
    '$store.state.user': {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          console.log('👤 AcedSettings: User plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch the getUser getter
    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          console.log('👤 AcedSettings: GetUser plan changed:', oldPlan, '→', newPlan);
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    // ✅ FIXED: Watch current plan changes
    currentPlan: {
      handler(newPlan, oldPlan) {
        if (newPlan !== oldPlan) {
          console.log('📊 AcedSettings: Current plan computed changed:', oldPlan, '→', newPlan);
          this.forceReactivityUpdate();
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    console.log('🔧 AcedSettings: Component mounting...');
    await this.initializeComponent();
    this.componentMounted = true;
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    // ============================================================================
    // 🔄 STATUS CHANGE HANDLING
    // ============================================================================
    
    // ✅ FIXED: Handle user status changes
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      console.log(`👤 AcedSettings: Handling status change ${oldStatus} → ${newStatus}`);

      // Update localStorage immediately
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('plan', newStatus);

      // Trigger immediate reactivity update
      this.forceReactivityUpdate();

      // Show celebration for upgrades
      if (newStatus && newStatus !== 'free' && oldStatus === 'free') {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
      }

      console.log(`✅ AcedSettings: Status change handled: ${oldStatus} → ${newStatus}`);
    },

    // ✅ ENHANCED: Setup comprehensive event listeners (replace existing setupEnhancedEventListeners)
    setupEnhancedEventListeners() {
      console.log('🔧 AcedSettings: Setting up enhanced event listeners...');
      
      // Clear existing listeners
      this.cleanupEventListeners();
      
      // ===== DOM EVENT LISTENERS =====
      if (typeof window !== 'undefined') {
        // Listen for user subscription changes
        this.handleSubscriptionChange = (event) => {
          console.log('📡 AcedSettings: Subscription change received:', event.detail);
          const { plan, oldPlan } = event.detail;
          this.handleUserStatusChange(plan, oldPlan);
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        // Listen for localStorage changes (cross-tab sync)
        this.handleStorageChange = (event) => {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            console.log('📡 AcedSettings: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
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
          console.log('📡 AcedSettings: Generic status event received:', event.type, event.detail);
          this.forceReactivityUpdate();
          
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

      // ===== EVENT BUS LISTENERS =====
      if (typeof window !== 'undefined' && window.eventBus) {
        // User status change events
        this.handleUserStatusEvent = (data) => {
          console.log('📡 AcedSettings: User status event received:', data);
          this.handleUserStatusChange(data.newStatus || data.plan, data.oldStatus || data.oldPlan);
        };

        // Promocode applied events
        this.handlePromocodeEvent = (data) => {
          console.log('📡 AcedSettings: Promocode applied event:', data);
          this.handleUserStatusChange(data.newStatus, data.oldStatus);
        };

        // Force update events
        this.handleForceUpdateEvent = () => {
          console.log('📡 AcedSettings: Force update event received');
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

        console.log('✅ AcedSettings: Event bus listeners registered');
      }

      // ===== STORE MUTATION LISTENER =====
      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            console.log('📊 AcedSettings: Store mutation detected:', mutation.type);
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

      console.log('✅ AcedSettings: Enhanced event listeners setup complete');
    },

    // ✅ FIXED: Check if mutation is user-related
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

    // ✅ ENHANCED: Enhanced forceReactivityUpdate (replace existing)
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
        
        console.log('🔄 AcedSettings: Reactivity updated:', {
          reactivityKey: this.reactivityKey,
          lastUpdateTime: this.lastUpdateTime,
          currentPlan: this.currentPlan
        });
      } catch (error) {
        console.warn('⚠️ AcedSettings: Reactivity update failed:', error);
      }
    },

    // ✅ NEW: Helper method to get time remaining display
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

    // ✅ ENHANCED: Enhanced cleanup (replace existing cleanupEventListeners)
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
    
    // ✅ ENHANCED: Enhanced initialization (replace existing initializeComponent)
    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        
        // ✅ CRITICAL: Setup event listeners BEFORE loading data
        this.setupEnhancedEventListeners();
        
        await this.loadInitialData();
        
        // ✅ CRITICAL: Force initial reactivity update
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
          console.log('✅ Store data loaded');
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
    // 🎟️ PROMOCODE METHODS
    // ============================================================================
    
    // ✅ FIXED: Enhanced promocode input handling
    handlePromoCodeInput() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      
      this.promoCode = this.promoCode.toUpperCase();
      
      if (this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false; // Reset validation state if too short
        return;
      }
      
      this.isValidatingPromo = true; // Set to true when a valid length is reached
      
      this.promoValidationTimeout = setTimeout(() => {
        this.validatePromoCodeLocal();
      }, 800);
    },
    
    // ✅ FIXED: Pure backend promocode validation - NO HARDCODED CODES
    async validatePromoCodeLocal() {
      if (!this.promoCode.trim() || this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      try {
        console.log('🔍 Validating promocode via backend:', this.promoCode);
        
        const promocodeUpper = this.promoCode.trim().toUpperCase();
        
        // ✅ METHOD 1: Try store action first (uses backend API)
        try {
          if (this.$store && this.$store.dispatch) {
            console.log('📡 Using store validatePromocode action...');
            
            const storeResult = await this.$store.dispatch('user/validatePromocode', promocodeUpper);
            console.log('🔍 Store validation result:', storeResult);
            
            if (storeResult && typeof storeResult === 'object') {
              this.promoValidation = storeResult;
              
              // Auto-select plan if valid
              if (storeResult.valid && storeResult.data?.grantsPlan && !this.selectedPlan) {
                this.selectedPlan = storeResult.data.grantsPlan;
                console.log('✅ Auto-selected plan from store:', this.selectedPlan);
              }
              
              this.isValidatingPromo = false;
              return;
            }
          }
        } catch (storeError) {
          console.warn('⚠️ Store validation failed:', storeError.message);
        }
        
        // ✅ METHOD 2: Direct API call fallback
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (!baseUrl) {
            throw new Error('API base URL not configured');
          }
          
          console.log('📡 Direct API validation...');
          
          // Try multiple endpoints for validation
          const validationEndpoints = [
            `${baseUrl}/api/promocodes/validate/${promocodeUpper}`,
            `${baseUrl}/api/payments/validate-promo-code`,
            `${baseUrl}/promocodes/validate/${promocodeUpper}`
          ];
          
          let validationResult = null;
          
          for (const endpoint of validationEndpoints) {
            try {
              console.log(`🔄 Trying endpoint: ${endpoint}`);
              
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
                console.log(`✅ API response from ${endpoint}:`, apiResult);
                
                // Handle different response formats
                if (apiResult && typeof apiResult === 'object') {
                  validationResult = this.normalizeValidationResponse(apiResult, promocodeUpper);
                  break; // Success, stop trying other endpoints
                }
              } else {
                console.warn(`⚠️ API endpoint ${endpoint} failed with status:`, response.status);
                
                // If 404, try next endpoint
                if (response.status === 404) {
                  continue;
                }
                
                // For other errors, try to get error message
                try {
                  const errorData = await response.json();
                  console.warn('API error details:', errorData);
                  
                  if (response.status === 400 || response.status === 422) {
                    // Bad request or validation error - promocode doesn't exist
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
              console.log('✅ Auto-selected plan from API:', this.selectedPlan);
            }
            
            this.isValidatingPromo = false;
            return;
          }
          
        } catch (apiError) {
          console.warn('⚠️ All API validation attempts failed:', apiError.message);
        }
        
        // ✅ If all backend attempts fail, show appropriate error
        this.promoValidation = {
          valid: false,
          error: `Не удалось проверить промокод "${promocodeUpper}". Проверьте подключение к интернету или попробуйте позже.`
        };
        
        console.log('❌ All validation methods failed for:', promocodeUpper);
        
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
    
    // ✅ NEW: Helper method to normalize different API response formats
    normalizeValidationResponse(apiResult, promocodeUpper) {
      try {
        // Handle different response structures from your backend
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
    
    // ✅ NEW: Helper method to get authorization header
    async getAuthHeader() {
      try {
        // Try to get token from current user
        if (this.currentUser) {
          const token = await this.currentUser.getIdToken();
          if (token) {
            return `Bearer ${token}`;
          }
        }
        
        // Fallback to localStorage
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
    
    // ✅ ENHANCED: Apply promocode with pure backend validation
    // FIXED applyPromo method for AcedSettings.vue

// ✅ ENHANCED: Apply promocode with proper result handling
async applyPromo() {
  console.log('🚀 AcedSettings: applyPromo called');
  
  if (!this.promoCode || !this.selectedPlan || !this.userId) {
    this.showNotification('Заполните все поля', 'error');
    return;
  }
  
  this.isProcessingPromo = true;
  
  try {
    const normalizedCode = this.promoCode.trim().toUpperCase();
    
    // ✅ STEP 1: Apply via backend API through store action
    console.log('📡 Applying promocode via store action...');
    
    const storeResult = await this.$store.dispatch('user/applyPromocode', {
      promoCode: normalizedCode,
      plan: this.selectedPlan
    });
    
    console.log('📊 Store action result:', storeResult);
    
    // ✅ CRITICAL: Check if storeResult exists and has success property
    if (!storeResult || typeof storeResult !== 'object') {
      console.error('❌ Store action returned invalid result:', storeResult);
      this.showNotification('Внутренняя ошибка приложения. Попробуйте перезагрузить страницу.', 'error');
      return;
    }
    
    // ✅ STEP 2: Handle successful promocode application
    if (storeResult.success === true) {
      console.log('✅ Promocode applied successfully via store');
      
      // ✅ SUCCESS: Show celebration and reset form
      const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
      this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success', 5000);
      
      // ✅ Reset form
      this.promoCode = '';
      this.selectedPlan = '';
      this.promoValidation = null;
      
      // ✅ Force reactivity update
      this.forceReactivityUpdate();
      
      // ✅ CRITICAL: Trigger global events for component updates
      if (typeof window !== 'undefined') {
        // Method 1: Custom DOM event
        const event = new CustomEvent('userSubscriptionChanged', {
          detail: {
            plan: this.selectedPlan,
            oldPlan: storeResult.oldPlan || 'free',
            source: 'promocode',
            promocode: normalizedCode,
            timestamp: Date.now()
          },
          bubbles: true
        });
        window.dispatchEvent(event);
        
        // Method 2: Event bus
        if (window.eventBus) {
          window.eventBus.emit('promocodeApplied', {
            newStatus: this.selectedPlan,
            oldStatus: storeResult.oldPlan || 'free',
            code: normalizedCode,
            success: true
          });
        }
        
        // Method 3: Global trigger function
        if (window.triggerGlobalEvent) {
          window.triggerGlobalEvent('userStatusChanged', {
            oldStatus: storeResult.oldPlan || 'free',
            newStatus: this.selectedPlan,
            source: 'promocode-applied',
            timestamp: Date.now()
          });
        }
      }
      
      console.log('✅ Promocode application completed successfully');
      return;
    }
    
    // ✅ STEP 3: Handle store action failure
    if (storeResult.success === false) {
      const errorMessage = storeResult.error || 'Не удалось применить промокод';
      console.warn('⚠️ Store action failed:', errorMessage);
      this.showNotification(errorMessage, 'error');
      return;
    }
    
    // ✅ STEP 4: Handle undefined success property (should not happen with fixed store)
    console.error('❌ Store action returned result without success property:', storeResult);
    this.showNotification('Неожиданная ошибка. Попробуйте снова или обратитесь в поддержку.', 'error');
    
  } catch (error) {
    console.error('❌ Promocode application exception:', error);
    
    let userFriendlyError = 'Произошла ошибка при применении промокода';
    
    if (error.message === 'Request timeout') {
      userFriendlyError = 'Истекло время ожидания. Попробуйте снова.';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      userFriendlyError = 'Ошибка сети. Проверьте подключение к интернету.';
    } else if (error.message.includes('API base URL')) {
      userFriendlyError = 'Ошибка конфигурации приложения. Обратитесь к администратору.';
    }
    
    this.showNotification(userFriendlyError, 'error');
    
  } finally {
    this.isProcessingPromo = false;
  }
},

// ✅ ENHANCED: Reactivity update method with error handling
forceReactivityUpdate() {
  try {
    // ✅ CRITICAL: Safe reactivity updates with error handling
    this.componentKey = (this.componentKey || 0) + 1;
    this.lastUpdateTime = Date.now();
    
    // ✅ STEP 1: Vue force update with error handling
    try {
      this.$forceUpdate();
      console.log('✅ $forceUpdate completed');
    } catch (forceUpdateError) {
      console.warn('⚠️ $forceUpdate failed:', forceUpdateError);
    }
    
    // ✅ STEP 2: NextTick updates with error handling
    this.$nextTick(() => {
      try {
        this.$forceUpdate();
        console.log('✅ NextTick $forceUpdate completed');
        
        // Additional delayed updates
        setTimeout(() => {
          try {
            this.$forceUpdate();
            console.log('✅ Delayed $forceUpdate completed');
          } catch (delayedError) {
            console.warn('⚠️ Delayed $forceUpdate failed:', delayedError);
          }
        }, 50);
        
        setTimeout(() => {
          try {
            this.$forceUpdate();
            console.log('✅ Final delayed $forceUpdate completed');
          } catch (finalError) {
            console.warn('⚠️ Final delayed $forceUpdate failed:', finalError);
          }
        }, 200);
        
      } catch (nextTickError) {
        console.warn('⚠️ NextTick $forceUpdate failed:', nextTickError);
      }
    });
    
    console.log('🔄 AcedSettings: Reactivity updated:', {
      componentKey: this.componentKey,
      lastUpdateTime: this.lastUpdateTime,
      currentPlan: this.currentPlan
    });
    
  } catch (error) {
    console.warn('⚠️ AcedSettings: Reactivity update failed:', error);
    
    // ✅ FALLBACK: Try basic component key update
    try {
      this.componentKey = Date.now();
      console.log('✅ Fallback componentKey update completed');
    } catch (fallbackError) {
      console.error('❌ Even fallback reactivity update failed:', fallbackError);
    }
  }
},

// ✅ ENHANCED: Handle user status changes with comprehensive error handling
handleUserStatusChange(newStatus, oldStatus) {
  if (!newStatus || newStatus === oldStatus) return;

  console.log(`👤 AcedSettings: Handling status change ${oldStatus} → ${newStatus}`);

  try {
    // ✅ STEP 1: Update localStorage immediately
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('plan', newStatus);
      localStorage.setItem('statusChangeTime', Date.now().toString());
      console.log('✅ localStorage updated successfully');
    } catch (storageError) {
      console.warn('⚠️ localStorage update failed:', storageError);
    }

    // ✅ STEP 2: Update internal state safely
    try {
      this.internalCurrentPlan = newStatus;
      console.log('✅ Internal state updated');
    } catch (internalError) {
      console.warn('⚠️ Internal state update failed:', internalError);
    }

    // ✅ STEP 3: Trigger reactivity update
    this.forceReactivityUpdate();

    // ✅ STEP 4: Show celebration for upgrades
    if (newStatus && newStatus !== 'free' && (oldStatus === 'free' || !oldStatus)) {
      try {
        const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
        this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
        console.log('✅ Success notification shown');
      } catch (notificationError) {
        console.warn('⚠️ Success notification failed:', notificationError);
      }
    }

    console.log(`✅ AcedSettings: Status change handled: ${oldStatus} → ${newStatus}`);

  } catch (error) {
    console.error('❌ Error handling status change:', error);
    
    // ✅ FALLBACK: Force basic update
    try {
      this.$forceUpdate();
      console.log('✅ Fallback force update completed');
    } catch (fallbackError) {
      console.error('❌ Even fallback update failed:', fallbackError);
    }
  }
},

// ✅ ENHANCED: Setup event listeners with comprehensive error handling
setupEnhancedEventListeners() {
  console.log('🔧 AcedSettings: Setting up enhanced event listeners...');
  
  // Clear existing listeners first
  this.cleanupEventListeners();
  
  try {
    // ✅ METHOD 1: DOM Event Listeners (most reliable)
    if (typeof window !== 'undefined') {
      // Handle subscription changes
      this.handleSubscriptionChange = (event) => {
        try {
          console.log('📡 AcedSettings: Subscription change received:', event.detail);
          const { plan, oldPlan, newStatus, oldStatus } = event.detail;
          const finalNewStatus = plan || newStatus;
          const finalOldStatus = oldPlan || oldStatus;
          
          if (finalNewStatus) {
            this.handleUserStatusChange(finalNewStatus, finalOldStatus);
          }
        } catch (handlerError) {
          console.warn('⚠️ Subscription change handler error:', handlerError);
        }
      };
      
      window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
      this.statusEventListeners.push(() => {
        window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
      });

      // Handle localStorage changes (cross-tab sync)
      this.handleStorageChange = (event) => {
        try {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            console.log('📡 AcedSettings: localStorage userStatus changed:', event.oldValue, '→', event.newValue);
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        } catch (storageHandlerError) {
          console.warn('⚠️ Storage change handler error:', storageHandlerError);
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
        try {
          console.log('📡 AcedSettings: Generic status event received:', event.type, event.detail);
          
          // Extract status information from various event formats
          const detail = event.detail || {};
          const newStatus = detail.newStatus || detail.plan || detail.status;
          const oldStatus = detail.oldStatus || detail.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          } else {
            // Force reactivity update even without status change
            this.forceReactivityUpdate();
          }
          
          // Check localStorage for updates as fallback
          try {
            const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
            if (currentStatus && currentStatus !== this.currentPlan) {
              this.handleUserStatusChange(currentStatus, this.currentPlan);
            }
          } catch (storageCheckError) {
            console.warn('⚠️ Storage check error:', storageCheckError);
          }
        } catch (genericHandlerError) {
          console.warn('⚠️ Generic status change handler error:', genericHandlerError);
        }
      };

      eventTypes.forEach(eventType => {
        window.addEventListener(eventType, handleGenericStatusChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener(eventType, handleGenericStatusChange);
        });
      });

      console.log('✅ DOM event listeners registered');
    }

    // ✅ METHOD 2: Event Bus Listeners
    if (typeof window !== 'undefined' && window.eventBus) {
      // User status change events
      this.handleUserStatusEvent = (data) => {
        try {
          console.log('📡 AcedSettings: User status event received:', data);
          const newStatus = data.newStatus || data.plan;
          const oldStatus = data.oldStatus || data.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          }
        } catch (eventBusError) {
          console.warn('⚠️ Event bus handler error:', eventBusError);
        }
      };

      // Force update events
      this.handleForceUpdateEvent = () => {
        try {
          console.log('📡 AcedSettings: Force update event received');
          this.forceReactivityUpdate();
          
          // Also check for status updates
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentPlan) {
            this.handleUserStatusChange(currentStatus, this.currentPlan);
          }
        } catch (forceUpdateError) {
          console.warn('⚠️ Force update event handler error:', forceUpdateError);
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
        try {
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
        } catch (eventBusRegisterError) {
          console.warn(`⚠️ Failed to register event bus listener for ${eventType}:`, eventBusRegisterError);
        }
      });

      console.log('✅ Event bus listeners registered');
    }

    // ✅ METHOD 3: Store Mutation Listener
    if (this.$store) {
      try {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          try {
            if (this.isUserRelatedMutation(mutation)) {
              console.log('📊 AcedSettings: Store mutation detected:', mutation.type);
              this.forceReactivityUpdate();
              
              // Check for status changes in mutation payload
              if (mutation.payload && mutation.payload.subscriptionPlan) {
                const newStatus = mutation.payload.subscriptionPlan;
                if (newStatus !== this.currentPlan) {
                  this.handleUserStatusChange(newStatus, this.currentPlan);
                }
              } else if (mutation.payload && typeof mutation.payload === 'string') {
                // Handle direct status mutations
                const validStatuses = ['free', 'start', 'pro', 'premium'];
                if (validStatuses.includes(mutation.payload) && mutation.payload !== this.currentPlan) {
                  this.handleUserStatusChange(mutation.payload, this.currentPlan);
                }
              }
            }
          } catch (mutationHandlerError) {
            console.warn('⚠️ Store mutation handler error:', mutationHandlerError);
          }
        });
        
        this.statusEventListeners.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });

        console.log('✅ Store mutation listener registered');
      } catch (storeListenerError) {
        console.warn('⚠️ Failed to setup store listener:', storeListenerError);
      }
    }

    console.log('✅ AcedSettings: Enhanced event listeners setup complete');

  } catch (error) {
    console.error('❌ Failed to setup enhanced event listeners:', error);
    
    // ✅ FALLBACK: Basic periodic check
    try {
      this.setupBasicPeriodicCheck();
      console.log('✅ Fallback periodic check setup completed');
    } catch (fallbackError) {
      console.error('❌ Even fallback setup failed:', fallbackError);
    }
  }
},

// ✅ NEW: Basic periodic check as fallback
setupBasicPeriodicCheck() {
  this.periodicCheckInterval = setInterval(() => {
    try {
      const storeStatus = this.$store?.getters?.['user/userStatus'];
      const localStatus = localStorage.getItem('userStatus');
      
      if (storeStatus && localStatus && storeStatus !== localStatus) {
        console.log('🔄 Periodic check found status mismatch, syncing...', {
          store: storeStatus,
          localStorage: localStatus
        });
        this.handleUserStatusChange(storeStatus, localStatus);
      }
    } catch (periodicError) {
      console.warn('⚠️ Periodic check error:', periodicError);
    }
  }, 10000); // Check every 10 seconds
  
  this.statusEventListeners.push(() => {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
  });
},

// ✅ ENHANCED: Check if mutation is user-related
isUserRelatedMutation(mutation) {
  try {
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
    
    return userMutations.some(type => 
      mutation.type === type || 
      mutation.type.includes(type) ||
      mutation.type.includes('user/') ||
      mutation.type.toLowerCase().includes('status') ||
      mutation.type.toLowerCase().includes('subscription') ||
      mutation.type.toLowerCase().includes('plan')
    );
  } catch (error) {
    console.warn('⚠️ Error checking mutation type:', error);
    return false;
  }
},

// ✅ ENHANCED: Cleanup event listeners
cleanupEventListeners() {
  try {
    if (this.statusEventListeners && Array.isArray(this.statusEventListeners)) {
      this.statusEventListeners.forEach(cleanup => {
        try {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        } catch (cleanupError) {
          console.warn('⚠️ AcedSettings: Individual cleanup error:', cleanupError);
        }
      });
    }
    this.statusEventListeners = [];
    
    if (this.storeUnsubscribe && typeof this.storeUnsubscribe === 'function') {
      try {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      } catch (storeCleanupError) {
        console.warn('⚠️ Store unsubscribe error:', storeCleanupError);
      }
    }
    
    if (this.periodicCheckInterval) {
      try {
        clearInterval(this.periodicCheckInterval);
        this.periodicCheckInterval = null;
      } catch (intervalCleanupError) {
        console.warn('⚠️ Interval cleanup error:', intervalCleanupError);
      }
    }
    
    console.log('✅ AcedSettings: Event listeners cleaned up');
  } catch (error) {
    console.error('❌ Cleanup event listeners failed:', error);
  }
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

    showNotification(message, type = 'info') {
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
      }, 5000);
    }
  }
}
</script>
<style scoped>
@import "@/assets/css/AcedSettings.css";

</style>