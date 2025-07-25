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
              <p v-if="subscriptionExpiryDate" class="plan-expiry">
                Активен до: {{ formatDate(subscriptionExpiryDate) }}
              </p>
              <p v-if="isPromocodeActive" class="plan-source">
                🎟️ Активирован по промокоду: {{ lastPromocode?.code || 'N/A' }}
              </p>
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
      
      // Force reactivity keys
      reactivityKey: 0,
      lastUpdateTime: Date.now()
    };
  },
  
  computed: {
    // ✅ BULLETPROOF: Safe getter access with defaults
    currentPlan() {
      try {
        return this.$store.getters['user/userStatus'] || 'free';
      } catch (e) {
        console.warn('⚠️ Error getting userStatus:', e);
        return 'free';
      }
    },
    
    // ✅ BULLETPROOF: Safe subscription details with null checks
    subscriptionDetails() {
      try {
        const details = this.$store.getters['user/subscriptionDetails'];
        return (details && typeof details === 'object') ? details : {
          plan: 'free',
          status: 'inactive',
          expiryDate: null,
          source: null
        };
      } catch (e) {
        console.warn('⚠️ Error getting subscriptionDetails:', e);
        return { plan: 'free', status: 'inactive', expiryDate: null, source: null };
      }
    },
    
    // ✅ BULLETPROOF: Safe applied promocodes with array checks
    appliedPromocodes() {
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
    
    // ✅ BULLETPROOF: Safe payment history with array checks
    paymentHistory() {
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
    
    // ✅ BULLETPROOF: Safe usage data
    currentUsage() {
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
    
    // ✅ BULLETPROOF: User status properties
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
    
    currentPlanDescription() {
      const descriptions = {
        pro: 'Полный доступ ко всем курсам и функциям',
        start: 'Доступ к базовым курсам и безлимитным сообщениям',
        free: 'Бесплатный доступ с ограниченным функционалом'
      };
      return descriptions[this.currentPlan] || 'Бесплатный доступ';
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
  
  watch: {
    // ✅ BULLETPROOF: Watch for user status changes
    '$store.state.user.userStatus': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`👀 Watched userStatus change: ${oldStatus} → ${newStatus}`);
          this.forceReactivityUpdate();
        }
      },
      immediate: false
    },
    
    // ✅ BULLETPROOF: Watch for applied promocodes changes
    '$store.state.user.promocodes.applied': {
      handler(newPromocodes, oldPromocodes) {
        const newLength = Array.isArray(newPromocodes) ? newPromocodes.length : 0;
        const oldLength = Array.isArray(oldPromocodes) ? oldPromocodes.length : 0;
        
        if (newLength !== oldLength) {
          console.log(`👀 Applied promocodes changed: ${oldLength} → ${newLength}`);
          this.forceReactivityUpdate();
        }
      },
      deep: true
    },
    
    // ✅ BULLETPROOF: Watch for subscription details changes
    '$store.state.user.subscription': {
      handler(newSub, oldSub) {
        if (newSub !== oldSub) {
          console.log('👀 Subscription details changed');
          this.forceReactivityUpdate();
        }
      },
      deep: true
    }
  },
  
  async mounted() {
    await this.initializeComponent();
    this.setupEventListeners();
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    // ✅ BULLETPROOF: Use mapActions with error handling
    ...mapActions('user', [
      'loadUserStatus',
      'validatePromocode', 
      'applyPromocode',
      'forceUpdate'
    ]),
    
    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        await this.loadInitialData();
      } catch (error) {
        console.error('❌ Settings initialization error:', error);
        this.showNotification('Ошибка загрузки настроек', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async loadInitialData() {
      try {
        if (this.$store && typeof this.loadUserStatus === 'function') {
          await this.loadUserStatus();
          console.log('✅ Store data loaded via actions');
        } else {
          console.warn('⚠️ Store actions not available, using fallback');
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
    
    setupEventListeners() {
      // ✅ Listen for global user status changes
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.on('userStatusChanged', this.onUserStatusChanged);
        window.eventBus.on('promocodeApplied', this.onPromocodeApplied);
        window.eventBus.on('forceUpdate', this.onForceUpdate);
      }
    },
    
    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      
      // Remove event listeners
      if (typeof window !== 'undefined' && window.eventBus) {
        window.eventBus.off('userStatusChanged', this.onUserStatusChanged);
        window.eventBus.off('promocodeApplied', this.onPromocodeApplied);
        window.eventBus.off('forceUpdate', this.onForceUpdate);
      }
    },
    
    // ✅ BULLETPROOF: Event handlers
    onUserStatusChanged(data) {
      console.log('📡 Received userStatusChanged event:', data);
      this.forceReactivityUpdate();
    },
    
    onPromocodeApplied(data) {
      console.log('📡 Received promocodeApplied event:', data);
      this.forceReactivityUpdate();
      this.showNotification(`✅ Промокод применён! Новый статус: ${data.newStatus?.toUpperCase()}`, 'success');
    },
    
    onForceUpdate(data) {
      console.log('📡 Received forceUpdate event:', data);
      this.forceReactivityUpdate();
    },
    
    forceReactivityUpdate() {
      this.reactivityKey++;
      this.lastUpdateTime = Date.now();
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    },
    
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
    
    async validatePromoCodeLocal() {
      if (!this.promoCode.trim() || this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      try {
        console.log('🔍 Validating promocode:', this.promoCode);
        
        let result = null;
        
        // Try the store action first with error handling
        if (typeof this.validatePromocode === 'function') {
          try {
            result = await this.validatePromocode(this.promoCode);
            console.log('📦 Store validation result:', result);
          } catch (storeError) {
            console.warn('⚠️ Store validation failed:', storeError.message);
            result = null;
          }
        }
        
        // Strategy 2: Direct API call if store failed or returned invalid result
        if (!result || typeof result !== 'object' || result.valid === undefined) {
          console.log('🔄 Trying direct API call...');
          
          try {
            const promocodeCode = this.promoCode.trim().toUpperCase();
            const endpoints = [
  `/promocodes/validate/${promocodeCode}`,
  `/promocodes/validate/${promocodeCode}`
];
            
            const apiResult = await this.tryMultipleApiEndpoints(endpoints, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              }
            });
            
            console.log('📡 API validation result:', apiResult);
            
            if (apiResult.success && apiResult.valid) {
              result = {
                valid: true,
                data: apiResult.data,
                message: `Промокод действителен! Предоставляет: ${apiResult.data.grantsPlan?.toUpperCase()} план`
              };
            } else {
              result = {
                valid: false,
                error: apiResult.error || 'Промокод недействителен'
              };
            }
          } catch (apiError) {
            console.warn('⚠️ All API endpoints failed:', apiError.message);
            result = {
              valid: false,
              error: 'Ошибка соединения с сервером'
            };
          }
        }
        
        // Strategy 3: Hardcoded validation for common promocodes (fallback)
        if (!result || (!result.valid && !result.error)) {
          console.log('🔄 Using hardcoded validation fallback...');
          
          const hardcodedPromocodes = {
            'ACEDPROMOCODE2406': { valid: true, grantsPlan: 'start', description: 'Start план доступ' },
            'FREE2024': { valid: true, grantsPlan: 'start', description: 'Бесплатный Start план' },
            'TESTCODE': { valid: true, grantsPlan: 'pro', description: 'Тестовый Pro план' },
            'START2024': { valid: true, grantsPlan: 'start', description: 'Start план промо' },
            'PRO2024': { valid: true, grantsPlan: 'pro', description: 'Pro план промо' }
          };
          
          const promocodeUpper = this.promoCode.trim().toUpperCase();
          const hardcodedData = hardcodedPromocodes[promocodeUpper];
          
          if (hardcodedData) {
            result = {
              valid: true,
              data: {
                code: promocodeUpper,
                grantsPlan: hardcodedData.grantsPlan,
                description: hardcodedData.description,
                subscriptionDays: 30
              },
              message: `Промокод действителен! Предоставляет: ${hardcodedData.grantsPlan.toUpperCase()} план`
            };
            console.log('✅ Hardcoded validation successful:', promocodeUpper);
          } else {
            result = {
              valid: false,
              error: 'Промокод не найден'
            };
          }
        }
        
        // ✅ BULLETPROOF: Ensure result has the expected structure
        this.promoValidation = {
          valid: result?.valid || false,
          error: result?.error || null,
          data: result?.data || null,
          message: result?.message || null
        };
        
        if (this.promoValidation.valid && this.promoValidation.data) {
          console.log('✅ Valid promocode:', this.promoValidation.data);
          
          if (!this.selectedPlan && this.promoValidation.data.grantsPlan) {
            this.selectedPlan = this.promoValidation.data.grantsPlan;
          }
          
          if (this.selectedPlan && this.promoValidation.data.grantsPlan && 
              this.selectedPlan !== this.promoValidation.data.grantsPlan) {
            console.warn('⚠️ Plan mismatch detected');
          }
        }
      } catch (error) {
        console.warn('⚠️ Promocode validation error:', error);
        this.promoValidation = {
          valid: false,
          error: 'Ошибка проверки промокода'
        };
      } finally {
        this.isValidatingPromo = false;
      }
    },
    
    // Helper method to try multiple API URL patterns
    async tryMultipleApiEndpoints(endpoints, options = {}) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const isBaseUrlWithApi = baseUrl.endsWith('/api');
      
      for (const endpoint of endpoints) {
        let urls = [];
        
        if (isBaseUrlWithApi) {
          urls = [
            `${baseUrl}${endpoint}`,
            `${baseUrl.replace('/api', '')}${endpoint}`,
            `${baseUrl.replace('/api', '')}/api${endpoint}`
          ];
        } else {
          urls = [
            `${baseUrl}${endpoint}`,
            `${baseUrl}/api${endpoint}`,
            `https://api.aced.live/api${endpoint}`
          ];
        }
        
        for (const url of urls) {
          try {
            console.log(`🔍 Trying URL: ${url}`);
            const response = await fetch(url, options);
            
            if (response.ok) {
              console.log(`✅ Success with URL: ${url}`);
              return await response.json();
            } else {
              console.log(`❌ Failed with ${response.status}: ${url}`);
              
              if (response.status === 400) {
                try {
                  const errorData = await response.json();
                  console.log(`📋 400 Error details:`, errorData);
                } catch (e) {
                  console.log(`📋 400 Error (no JSON response)`);
                }
              }
            }
          } catch (error) {
            console.log(`❌ Error with ${url}:`, error.message);
            continue;
          }
        }
      }
      
      throw new Error('All API endpoints failed');
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
    
    // Replace your existing applyPromo method with this enhanced version
   // ✅ FINAL FIXED: Replace your applyPromo method with this bulletproof version

   // ✅ SUPER DEBUG VERSION - Replace your applyPromo method with this
// This version has extensive logging to track down the exact issue

async applyPromo() {
  console.log('🚀🚀🚀 ===== SUPER DEBUG APPLY PROMO START =====');
  console.log('🔍 DEBUG 1: Method called');
  
  // Initial validation with debug
  console.log('🔍 DEBUG 2: Checking initial conditions...');
  console.log('🔍 DEBUG 2a: promoCode:', this.promoCode);
  console.log('🔍 DEBUG 2b: selectedPlan:', this.selectedPlan);
  console.log('🔍 DEBUG 2c: userId:', this.userId);
  
  if (!this.promoCode || !this.selectedPlan || !this.userId) {
    console.log('❌ DEBUG 3: Initial validation failed');
    this.showNotification('Заполните все поля', 'error');
    return;
  }
  
  console.log('✅ DEBUG 4: Initial validation passed');

  this.isProcessingPromo = true;
  console.log('🔍 DEBUG 5: Set processing flag to true');
  
  console.log('🎟️ DEBUG 6: Starting promocode application:', {
    code: this.promoCode.toUpperCase(),
    plan: this.selectedPlan,
    userId: this.userId.substring(0, 8) + '...'
  });

  try {
    console.log('🔍 DEBUG 7: Entering try block');
    
    // Step 1: Apply promocode via API
    console.log('🔍 DEBUG 8: About to make server request');
    console.log('🔍 DEBUG 8a: Request URL: https://api.aced.live/api/payments/promo-code');
    console.log('🔍 DEBUG 8b: Request method: POST');
    console.log('🔍 DEBUG 8c: Request body:', {
      userId: this.userId,
      plan: this.selectedPlan,
      promoCode: this.promoCode.toUpperCase()
    });
    
    const response = await fetch('https://api.aced.live/api/payments/promo-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.userId,
        plan: this.selectedPlan,
        promoCode: this.promoCode.toUpperCase()
      })
    });

    console.log('🔍 DEBUG 9: Server response received');
    console.log('🔍 DEBUG 9a: Response status:', response.status);
    console.log('🔍 DEBUG 9b: Response ok:', response.ok);
    console.log('🔍 DEBUG 9c: Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('🔍 DEBUG 10: Response parsed as JSON');
    console.log('🔍 DEBUG 10a: Full result object:', result);
    console.log('🔍 DEBUG 10b: result.success:', result.success);
    console.log('🔍 DEBUG 10c: result.data:', result.data);
    console.log('🔍 DEBUG 10d: result.error:', result.error);
    console.log('🔍 DEBUG 10e: typeof result:', typeof result);
    console.log('🔍 DEBUG 10f: Object.keys(result):', Object.keys(result));

    console.log('📡 Server response:', { success: result.success, hasData: !!result.data });

    if (result.success) {
      console.log('✅ DEBUG 11: Server returned success=true');
      
      // Step 2: Update user status via store
      try {
        console.log('🔍 DEBUG 12: About to update user status via store');
        console.log('🔍 DEBUG 12a: Checking store availability...');
        console.log('🔍 DEBUG 12b: this.$store exists:', !!this.$store);
        console.log('🔍 DEBUG 12c: this.$store.dispatch exists:', typeof this.$store?.dispatch);
        
        if (!this.$store) {
          console.error('❌ DEBUG 12d: $store is not available!');
          throw new Error('Store not available');
        }
        
        if (typeof this.$store.dispatch !== 'function') {
          console.error('❌ DEBUG 12e: $store.dispatch is not a function!');
          console.log('🔍 DEBUG 12f: $store.dispatch type:', typeof this.$store.dispatch);
          throw new Error('Store dispatch not available');
        }
        
        console.log('🔍 DEBUG 13: Checking store getters before dispatch...');
        try {
          const currentUserStatus = this.$store.getters['user/userStatus'];
          console.log('🔍 DEBUG 13a: Current user status from getter:', currentUserStatus);
        } catch (getterError) {
          console.warn('⚠️ DEBUG 13b: Error getting current status:', getterError);
        }
        
        console.log('🔍 DEBUG 14: Checking available actions...');
        try {
          const userModule = this.$store._modules?.root?._children?.user;
          const actions = userModule?._rawModule?.actions;
          console.log('🔍 DEBUG 14a: User module exists:', !!userModule);
          console.log('🔍 DEBUG 14b: Actions object exists:', !!actions);
          console.log('🔍 DEBUG 14c: Available actions:', actions ? Object.keys(actions) : 'none');
          console.log('🔍 DEBUG 14d: updateUserStatus exists:', actions ? ('updateUserStatus' in actions) : 'unknown');
          
          if (actions && 'updateUserStatus' in actions) {
            const actionFn = actions.updateUserStatus;
            console.log('🔍 DEBUG 14e: updateUserStatus type:', typeof actionFn);
            console.log('🔍 DEBUG 14f: updateUserStatus length:', actionFn.length);
          }
        } catch (actionCheckError) {
          console.warn('⚠️ DEBUG 14g: Error checking actions:', actionCheckError);
        }
        
        console.log('🔄 DEBUG 15: Updating user status via existing store action...');
        console.log('🔍 DEBUG 15a: Dispatching with plan:', this.selectedPlan);
        console.log('🔍 DEBUG 15b: Dispatch action name: "user/updateUserStatus"');
        
        // ✅ The critical dispatch call with extensive debugging
        console.log('🔍 DEBUG 16: About to call $store.dispatch...');
        console.time('updateUserStatus-duration');
        
        let updateResult;
        try {
          updateResult = await this.$store.dispatch('user/updateUserStatus', this.selectedPlan);
          console.timeEnd('updateUserStatus-duration');
          console.log('🔍 DEBUG 17: Store dispatch completed');
        } catch (dispatchError) {
          console.timeEnd('updateUserStatus-duration');
          console.error('❌ DEBUG 17a: Store dispatch threw error:', dispatchError);
          console.log('🔍 DEBUG 17b: Dispatch error name:', dispatchError.name);
          console.log('🔍 DEBUG 17c: Dispatch error message:', dispatchError.message);
          console.log('🔍 DEBUG 17d: Dispatch error stack:', dispatchError.stack);
          throw dispatchError;
        }
        
        console.log('🔍 DEBUG 18: Analyzing dispatch result...');
        console.log('🔍 DEBUG 18a: updateResult received:', updateResult);
        console.log('🔍 DEBUG 18b: updateResult type:', typeof updateResult);
        console.log('🔍 DEBUG 18c: updateResult is null:', updateResult === null);
        console.log('🔍 DEBUG 18d: updateResult is undefined:', updateResult === undefined);
        console.log('🔍 DEBUG 18e: updateResult is object:', typeof updateResult === 'object');
        
        if (updateResult === undefined) {
          console.error('❌ DEBUG 19: updateResult is UNDEFINED!');
          console.log('🔍 DEBUG 19a: This means the action exists but returns undefined');
          console.log('🔍 DEBUG 19b: The action probably lacks a return statement');
        } else if (updateResult === null) {
          console.error('❌ DEBUG 20: updateResult is NULL!');
        } else if (typeof updateResult === 'object') {
          console.log('✅ DEBUG 21: updateResult is an object, analyzing...');
          console.log('🔍 DEBUG 21a: Object.keys(updateResult):', Object.keys(updateResult));
          console.log('🔍 DEBUG 21b: updateResult.success:', updateResult.success);
          console.log('🔍 DEBUG 21c: updateResult.success type:', typeof updateResult.success);
          console.log('🔍 DEBUG 21d: updateResult.error:', updateResult.error);
          console.log('🔍 DEBUG 21e: updateResult.message:', updateResult.message);
          console.log('🔍 DEBUG 21f: updateResult.oldStatus:', updateResult.oldStatus);
          console.log('🔍 DEBUG 21g: updateResult.newStatus:', updateResult.newStatus);
        } else {
          console.log('🔍 DEBUG 22: updateResult is unexpected type:', typeof updateResult);
          console.log('🔍 DEBUG 22a: updateResult value:', updateResult);
        }
        
        console.log('📊 Store update result:', updateResult);
        
        // ✅ BULLETPROOF: Check for successful result with extensive debugging
        console.log('🔍 DEBUG 23: Checking success condition...');
        console.log('🔍 DEBUG 23a: updateResult exists check:', !!updateResult);
        console.log('🔍 DEBUG 23b: updateResult.success exists check:', 'success' in (updateResult || {}));
        console.log('🔍 DEBUG 23c: updateResult.success === true check:', (updateResult || {}).success === true);
        console.log('🔍 DEBUG 23d: Combined condition result:', updateResult && updateResult.success === true);
        
        if (updateResult && updateResult.success === true) {
          console.log('✅ DEBUG 24: Store user status updated successfully');
          console.log('🔍 DEBUG 24a: Success branch entered');
          
          // Step 3: Add the promocode to the applied list
          console.log('🔍 DEBUG 25: Adding promocode to store...');
          try {
            this.$store.commit('user/ADD_PROMOCODE', {
              code: this.promoCode.toUpperCase(),
              plan: this.selectedPlan,
              oldPlan: updateResult.oldStatus || this.currentPlan,
              source: 'api',
              details: result.data || {}
            });
            console.log('✅ DEBUG 25a: Promocode added to store successfully');
          } catch (commitError) {
            console.error('❌ DEBUG 25b: Error adding promocode to store:', commitError);
          }
          
          // Step 4: Success feedback
          console.log('🔍 DEBUG 26: Showing success notification...');
          this.showNotification(`🎉 Промокод применён! Подписка ${this.selectedPlan.toUpperCase()} активирована!`, 'success');
          
          // Step 5: Reset form
          console.log('🔍 DEBUG 27: Resetting form...');
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          // Step 6: Force component reactivity
          console.log('🔍 DEBUG 28: Forcing reactivity update...');
          this.forceReactivityUpdate();
          
          console.log('✅ DEBUG 29: Promocode application completed successfully');
          
        } else {
          // ✅ FIXED: Handle undefined or falsy updateResult with EXTENSIVE debugging
          console.warn('⚠️ DEBUG 30: Store update returned unsuccessful result');
          console.log('🔍 DEBUG 30a: updateResult value:', updateResult);
          console.log('🔍 DEBUG 30b: updateResult type:', typeof updateResult);
          console.log('🔍 DEBUG 30c: updateResult truthiness:', !!updateResult);
          
          if (updateResult === undefined) {
            console.error('❌ DEBUG 30d: Result is UNDEFINED - action missing return statement!');
          } else if (updateResult === null) {
            console.error('❌ DEBUG 30e: Result is NULL');
          } else if (typeof updateResult === 'object') {
            console.log('🔍 DEBUG 30f: Result is object but success !== true');
            console.log('🔍 DEBUG 30g: Result.success value:', updateResult.success);
            console.log('🔍 DEBUG 30h: Result.success type:', typeof updateResult.success);
            console.log('🔍 DEBUG 30i: Result.error value:', updateResult.error);
          }
          
          // Check if there's a specific error message
          const errorMessage = updateResult?.error || 'Неизвестная ошибка обновления статуса';
          console.log('🔍 DEBUG 31: Error message determined:', errorMessage);
          
          this.showNotification(`Промокод применён на сервере, но: ${errorMessage}`, 'warning');
          
          // Try manual refresh
          console.log('🔍 DEBUG 32: Attempting manual refresh...');
          this.attemptManualRefresh();
        }
        
      } catch (storeError) {
        console.error('❌ DEBUG 33: Store update failed with exception:', storeError);
        console.log('🔍 DEBUG 33a: Store error name:', storeError.name);
        console.log('🔍 DEBUG 33b: Store error message:', storeError.message);
        console.log('🔍 DEBUG 33c: Store error stack:', storeError.stack);
        
        this.showNotification('Промокод применён, но возникла ошибка обновления интерфейса', 'warning');
        this.attemptManualRefresh();
      }
      
    } else {
      // Server returned error
      console.error('❌ DEBUG 34: Promocode application failed - server returned success=false');
      console.log('🔍 DEBUG 34a: Server error:', result.error);
      console.log('🔍 DEBUG 34b: Server message:', result.message);
      this.showNotification(result.error || 'Неверный промокод', 'error');
    }
    
  } catch (networkError) {
    console.error('❌ DEBUG 35: Network error during promocode application:', networkError);
    console.log('🔍 DEBUG 35a: Network error name:', networkError.name);
    console.log('🔍 DEBUG 35b: Network error message:', networkError.message);
    console.log('🔍 DEBUG 35c: Network error stack:', networkError.stack);
    this.showNotification('Ошибка соединения с сервером', 'error');
    
  } finally {
    console.log('🔍 DEBUG 36: Finally block - cleaning up...');
    this.isProcessingPromo = false;
    console.log('🔍 DEBUG 37: Set processing flag to false');
  }
  
  console.log('🚀🚀🚀 ===== SUPER DEBUG APPLY PROMO END =====');
},

// ✅ ENHANCED: Manual refresh helper method with debug
async attemptManualRefresh() {
  console.log('🔄🔄🔄 ===== MANUAL REFRESH DEBUG START =====');
  console.log('🔄 DEBUG R1: Attempting manual data refresh...');
  
  setTimeout(async () => {
    console.log('🔄 DEBUG R2: Refresh timeout triggered (2000ms delay)');
    
    try {
      const refreshTasks = [];
      console.log('🔄 DEBUG R3: Building refresh tasks array...');
      
      // Use the store action if available
      console.log('🔄 DEBUG R4: Checking loadUserStatus availability...');
      console.log('🔄 DEBUG R4a: this.loadUserStatus exists:', typeof this.loadUserStatus);
      if (typeof this.loadUserStatus === 'function') {
        console.log('🔄 DEBUG R4b: Adding loadUserStatus to tasks');
        refreshTasks.push(this.loadUserStatus());
      }
      
      // Try store dispatch methods
      console.log('🔄 DEBUG R5: Checking store dispatch methods...');
      console.log('🔄 DEBUG R5a: this.$store exists:', !!this.$store);
      console.log('🔄 DEBUG R5b: this.$store.dispatch exists:', typeof this.$store?.dispatch);
      
      if (this.$store && typeof this.$store.dispatch === 'function') {
        console.log('🔄 DEBUG R5c: Adding store dispatch tasks');
        
        try {
          refreshTasks.push(this.$store.dispatch('user/loadUserStatus'));
          console.log('🔄 DEBUG R5d: Added user/loadUserStatus');
        } catch (e) {
          console.warn('🔄 DEBUG R5e: Failed to add user/loadUserStatus:', e);
        }
        
        try {
          refreshTasks.push(this.$store.dispatch('user/forceUpdate'));
          console.log('🔄 DEBUG R5f: Added user/forceUpdate');
        } catch (e) {
          console.warn('🔄 DEBUG R5g: Failed to add user/forceUpdate:', e);
        }
      }
      
      console.log('🔄 DEBUG R6: Total refresh tasks:', refreshTasks.length);
      
      // Execute all refresh tasks
      console.log('🔄 DEBUG R7: Executing refresh tasks...');
      const results = await Promise.allSettled(refreshTasks);
      
      console.log('🔄 DEBUG R8: Refresh tasks completed');
      console.log('🔄 DEBUG R8a: Results count:', results.length);
      
      results.forEach((result, index) => {
        console.log(`🔄 DEBUG R8b: Task ${index} status:`, result.status);
        if (result.status === 'rejected') {
          console.log(`🔄 DEBUG R8c: Task ${index} reason:`, result.reason);
        } else {
          console.log(`🔄 DEBUG R8d: Task ${index} value:`, result.value);
        }
      });
      
      // Force component update
      console.log('🔄 DEBUG R9: Forcing reactivity update...');
      this.forceReactivityUpdate();
      console.log('✅ DEBUG R10: Manual refresh completed');
      
    } catch (refreshError) {
      console.warn('⚠️ DEBUG R11: Manual refresh failed:', refreshError);
      console.log('🔄 DEBUG R11a: Refresh error name:', refreshError.name);
      console.log('🔄 DEBUG R11b: Refresh error message:', refreshError.message);
    }
    
    console.log('🔄🔄🔄 ===== MANUAL REFRESH DEBUG END =====');
  }, 2000);
},

// ✅ ADDITION: Manual refresh helper method
async attemptManualRefresh() {
  console.log('🔄 Attempting manual data refresh...');
  
  setTimeout(async () => {
    try {
      const refreshTasks = [];
      
      // Use the store action if available
      if (typeof this.loadUserStatus === 'function') {
        refreshTasks.push(this.loadUserStatus());
      }
      
      // Try store dispatch methods
      if (this.$store && typeof this.$store.dispatch === 'function') {
        refreshTasks.push(this.$store.dispatch('user/loadUserStatus'));
        refreshTasks.push(this.$store.dispatch('user/forceUpdate'));
      }
      
      // Execute all refresh tasks
      await Promise.allSettled(refreshTasks);
      
      // Force component update
      this.forceReactivityUpdate();
      console.log('✅ Manual refresh completed');
      
    } catch (refreshError) {
      console.warn('⚠️ Manual refresh failed:', refreshError);
    }
  }, 2000);
},

// Add this new method to handle successful promocode application
async handlePromocodeSuccess(result) {
  console.log('🎉 Handling successful promocode application:', result);
  
  try {
    const oldStatus = this.currentPlan;
    const newStatus = result.newPlan || result.plan;
    
    // Update store if available
    if (this.$store && typeof this.$store.dispatch === 'function') {
      try {
        await this.$store.dispatch('user/updateSubscription', {
          plan: newStatus,
          source: 'promocode',
          details: {
            promocode: this.promoCode.trim().toUpperCase(),
            appliedAt: new Date().toISOString(),
            oldPlan: oldStatus,
            fallback: result.fallback || false
          }
        });
        console.log('✅ Store subscription updated');
      } catch (storeError) {
        console.warn('⚠️ Store update failed:', storeError.message);
      }
      
      // Also try to update user status directly
      try {
        await this.$store.dispatch('user/updateUserStatus', newStatus);
        console.log('✅ Store user status updated');
      } catch (statusError) {
        console.warn('⚠️ User status update failed:', statusError.message);
      }
      
      // Force reload user data
      try {
        await this.$store.dispatch('user/loadUserStatus');
        console.log('✅ User data reloaded');
      } catch (loadError) {
        console.warn('⚠️ User data reload failed:', loadError.message);
      }
    }
    
    // Reset form
    this.promoCode = "";
    this.selectedPlan = "";
    this.promoValidation = null;
    
    // Force reactivity
    this.forceReactivityUpdate();
    
    // Success message
    const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
    const message = result.fallback ? 
      `🎉 Промокод применён (тестовый режим)! Теперь у вас ${planLabel} подписка!` :
      `🎉 Поздравляем! Промокод применён! Теперь у вас ${planLabel} подписка!`;
    
    this.showNotification(message, 'success');
    
    // Delayed refresh to ensure all updates are processed
    setTimeout(async () => {
      if (typeof this.loadUserStatus === 'function') {
        try {
          await this.loadUserStatus();
          console.log('✅ User status refreshed after delay');
        } catch (refreshError) {
          console.warn('⚠️ Delayed refresh failed:', refreshError.message);
        }
      }
      this.forceReactivityUpdate();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error in handlePromocodeSuccess:', error);
    // Still show success message even if store update fails
    this.showNotification(result.message || `🎉 Промокод применён!`, 'success');
  }
},
    // ✅ BULLETPROOF: Additional methods with error handling
    async saveChanges() {
      this.loading = true;
      this.loadingText = 'Сохранение изменений...';
      
      try {
        // Validate input
        if (!this.user.name.trim()) {
          this.showNotification('Имя не может быть пустым', 'error');
          return;
        }
        
        if (!this.user.email.trim()) {
          this.showNotification('Email не может быть пустым', 'error');
          return;
        }
        
        // Update profile in Firestore
        if (this.currentUser) {
          const userRef = doc(db, "users", this.currentUser.uid);
          await updateDoc(userRef, {
            name: this.user.name.trim(),
            surname: this.user.surname.trim(),
            email: this.user.email.trim(),
            updatedAt: new Date()
          });
          
          // Update email in Firebase Auth if changed
          if (this.currentUser.email !== this.user.email.trim()) {
            await updateEmail(this.currentUser, this.user.email.trim());
          }
          
          // Update password if provided
          if (!this.isGoogleUser && this.newPassword) {
            if (this.newPassword !== this.confirmPassword) {
              this.showNotification('Пароли не совпадают', 'error');
              return;
            }
            
            if (this.newPassword.length < 6) {
              this.showNotification('Пароль должен содержать минимум 6 символов', 'error');
              return;
            }
            
            // Reauthenticate before password change
            if (this.oldPassword) {
              const credential = EmailAuthProvider.credential(
                this.currentUser.email,
                this.oldPassword
              );
              await reauthenticateWithCredential(this.currentUser, credential);
              await updatePassword(this.currentUser, this.newPassword);
              
              // Clear password fields
              this.oldPassword = "";
              this.newPassword = "";
              this.confirmPassword = "";
            }
          }
          
          this.showNotification('Профиль успешно обновлён', 'success');
        }
      } catch (error) {
        console.error('❌ Save changes error:', error);
        
        if (error.code === 'auth/wrong-password') {
          this.showNotification('Неверный текущий пароль', 'error');
        } else if (error.code === 'auth/email-already-in-use') {
          this.showNotification('Этот email уже используется', 'error');
        } else if (error.code === 'auth/weak-password') {
          this.showNotification('Пароль слишком простой', 'error');
        } else {
          this.showNotification('Ошибка сохранения изменений', 'error');
        }
      } finally {
        this.loading = false;
      }
    },

    async sendPasswordReset() {
      try {
        if (!this.user.email) {
          this.showNotification('Введите email для сброса пароля', 'error');
          return;
        }
        
        await sendPasswordResetEmail(auth, this.user.email);
        this.showNotification('Письмо для сброса пароля отправлено на ваш email', 'success');
      } catch (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.code === 'auth/user-not-found') {
          this.showNotification('Пользователь с таким email не найден', 'error');
        } else {
          this.showNotification('Ошибка отправки письма для сброса пароля', 'error');
        }
      }
    },

    goToProfile() {
      this.$router.push('/profile');
    },

    selectPaymentPlan(plan) {
      if (this.currentPlan === plan) return;
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
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(20px, 5vw, 40px) clamp(15px, 4vw, 20px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #1f2937;
  min-height: 100vh;
  gap: clamp(25px, 5vw, 40px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.section-title {
  font-size: clamp(1.4rem, 4vw, 1.75rem);
  font-weight: 800;
  margin-bottom: clamp(20px, 4vw, 24px);
  text-align: center;
  color: #4c1d95;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.settings-content {
  width: 100%;
  max-width: clamp(350px, 90vw, 600px);
  background: #ffffff;
  padding: clamp(25px, 5vw, 40px);
  border-radius: clamp(16px, 3vw, 24px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.settings-content:hover {
  box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15);
  transform: translateY(-2px);
}

label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(6px, 1.5vw, 8px);
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
}

input, select {
  width: 100%;
  padding: clamp(12px, 3vw, 14px) clamp(14px, 3.5vw, 16px);
  margin-bottom: clamp(16px, 3.5vw, 20px);
  border: 2px solid #e5e7eb;
  border-radius: clamp(10px, 2.5vw, 12px);
  background: #f9fafb;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  transition: all 0.3s ease;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus, select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
  background: #ffffff;
}

input:disabled, select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f3f4f6;
}

.current-plan-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: clamp(20px, 4vw, 24px);
  border-radius: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(24px, 5vw, 32px);
}

.plan-info h3 {
  font-size: clamp(1.1rem, 2.8vw, 1.2rem);
  font-weight: 700;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.plan-display {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16px);
  flex-wrap: wrap;
}

.plan-badge {
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
  border-radius: 20px;
  font-weight: 700;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge-free {
  background-color: #ef4444;
  color: white;
}

.badge-start {
  background-color: #f59e0b;
  color: white;
}

.badge-pro {
  background-color: #10b981;
  color: white;
}

.plan-details {
  flex: 1;
  min-width: 200px;
}

.plan-description {
  margin: 0 0 clamp(6px, 1.5vw, 8px) 0;
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
  opacity: 0.9;
}

.plan-expiry, .plan-source {
  margin: 0;
  font-size: clamp(0.8rem, 2vw, 0.85rem);
  opacity: 0.8;
}

.promo-section {
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  border: 2px solid #e879f9;
  padding: clamp(20px, 4vw, 24px);
  border-radius: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(24px, 5vw, 32px);
}

.promo-section h4 {
  color: #7c3aed;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.promo-code-input {
  position: relative;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.promo-input {
  transition: all 0.3s ease;
  margin-bottom: 0;
}

.promo-input.promo-valid {
  border-color: #10b981;
  background-color: #ecfdf5;
}

.promo-input.promo-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.promo-input.promo-loading {
  border-color: #f59e0b;
  background-color: #fffbeb;
}

.promo-validation {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
  padding: clamp(8px, 2vw, 12px);
  border-radius: clamp(6px, 1.5vw, 8px);
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  font-weight: 500;
  animation: fadeIn 0.3s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.promo-valid-message {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.promo-invalid-message {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.promo-loading-message {
  background-color: #fffbeb;
  color: #92400e;
  border: 1px solid #f59e0b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid #fbbf24;
  border-left: 2px solid #92400e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.plan-select {
  margin-top: clamp(8px, 2vw, 12px);
  margin-bottom: clamp(12px, 3vw, 16px);
}

.plan-warning {
  background-color: #fef3c7;
  color: #92400e;
  padding: clamp(8px, 2vw, 12px);
  border-radius: clamp(6px, 1.5vw, 8px);
  border: 1px solid #f59e0b;
  font-size: clamp(0.8rem, 2vw, 0.875rem);
  margin-bottom: clamp(12px, 3vw, 16px);
}

.promo-button {
  width: 100%;
  padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 24px);
  border: none;
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #e879f9, #c084fc);
  color: white;
  min-height: clamp(44px, 10vw, 48px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 8px);
}

.promo-button-ready {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.promo-button-loading {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  cursor: not-allowed;
}

.promo-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.promo-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(232, 121, 249, 0.3);
}

.promo-button-ready:hover {
  box-shadow: 0 12px 30px rgba(16, 185, 129, 0.4);
}

.applied-promocodes {
  background: #f8fafc;
  padding: clamp(16px, 3vw, 20px);
  border-radius: clamp(10px, 2.5vw, 12px);
  border: 1px solid #e2e8f0;
  margin-bottom: clamp(20px, 4vw, 24px);
}

.applied-promocodes h4 {
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(10px, 2.5vw, 12px);
}

.promocodes-list {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 2vw, 10px);
}

.promocode-item {
  background: white;
  padding: clamp(10px, 2.5vw, 12px);
  border-radius: clamp(8px, 2vw, 10px);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: clamp(8px, 2vw, 10px);
}

.promocode-info {
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 0.5vw, 3px);
}

.promocode-code {
  font-family: monospace;
  font-weight: 600;
  color: #7c3aed;
  font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.promocode-plan {
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  color: #6b7280;
  font-weight: 500;
}

.promocode-date {
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  color: #9ca3af;
}

.plans-section {
  margin-bottom: clamp(24px, 5vw, 32px);
  padding: clamp(20px, 4vw, 24px);
  background: #f8fafc;
  border-radius: clamp(12px, 3vw, 16px);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.plans-section.plans-disabled {
  opacity: 0.8;
  background: #f3f4f6;
}

.plans-section h4 {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.promocode-notice {
  background: linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%);
  border: 2px solid #8b5cf6;
  border-radius: clamp(10px, 2.5vw, 12px);
  padding: clamp(12px, 3vw, 16px);
  margin-bottom: clamp(16px, 3.5vw, 20px);
}

.notice-content {
  text-align: center;
  color: #5b21b6;
  font-weight: 500;
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(15px, 3vw, 20px);
  margin-bottom: clamp(20px, 4vw, 24px);
}

.plan-card {
  border: 2px solid #e5e7eb;
  border-radius: clamp(12px, 3vw, 16px);
  padding: clamp(20px, 4vw, 24px);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.plan-card:hover:not(.disabled) {
  border-color: #7c3aed;
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
}

.plan-card.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.2);
}

.plan-card.current-plan {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f9fafb;
}

.plan-card.recommended {
  border-color: #10b981;
}

.plan-card.recommended.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
}

.plan-card .plan-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: clamp(0.7rem, 1.8vw, 0.75rem);
  font-weight: 600;
}

.plan-header h5 {
  font-size: clamp(1.1rem, 2.8vw, 1.25rem);
  font-weight: 700;
  color: #1f2937;
  margin-bottom: clamp(6px, 1.5vw, 8px);
}

.plan-price {
  font-size: clamp(1.2rem, 3vw, 1.4rem);
  font-weight: 800;
  color: #7c3aed;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  padding: clamp(3px, 1vw, 4px) 0;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
  color: #4b5563;
}

.plan-status {
  margin-top: clamp(12px, 3vw, 16px);
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px);
  background: #d1fae5;
  color: #065f46;
  border-radius: clamp(6px, 1.5vw, 8px);
  text-align: center;
  font-weight: 600;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
}

.usage-summary {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3.5vw, 20px);
}

.usage-item {
  background: #f8fafc;
  padding: clamp(16px, 3.5vw, 20px);
  border-radius: clamp(10px, 2.5vw, 12px);
  border: 1px solid #e2e8f0;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(8px, 2vw, 10px);
}

.usage-label {
  font-weight: 600;
  color: #374151;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
}

.usage-value {
  font-weight: 700;
  color: #7c3aed;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
}

.usage-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(12px, 3vw, 16px);
  justify-content: space-between;
  margin-top: clamp(24px, 5vw, 32px);
}

.save-button,
.back-button,
.payment-button {
  flex: 1 1 clamp(120px, 45%, 200px);
  padding: clamp(12px, 3vw, 14px) clamp(20px, 4vw, 24px);
  border: none;
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(0.9rem, 2.2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 8px);
  white-space: nowrap;
  min-height: clamp(44px, 10vw, 48px);
}

.save-button {
  background: linear-gradient(135deg, #9333ea, #a855f7);
  color: white;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #7e22ce, #9333ea);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(147, 51, 234, 0.3);
}

.back-button {
  background: #f3f4f6;
  color: #4c1d95;
  border: 2px solid #e5e7eb;
}

.back-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
  border-color: #d1d5db;
}

.payment-button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  width: 100%;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  padding: clamp(14px, 3.5vw, 16px) clamp(20px, 4vw, 24px);
}

.payment-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.save-button:disabled,
.payment-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.payment-history {
  background: #f8fafc;
  padding: clamp(20px, 4vw, 24px);
  border-radius: clamp(12px, 3vw, 16px);
  border: 1px solid #e2e8f0;
}

.payment-history h4 {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
  margin-bottom: clamp(12px, 3vw, 16px);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 12px);
}

.payment-item {
  background: white;
  padding: clamp(12px, 3vw, 16px);
  border-radius: clamp(10px, 2.5vw, 12px);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(8px, 2vw, 10px);
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: clamp(3px, 1vw, 4px);
}

.payment-id {
  font-family: monospace;
  font-size: clamp(0.8rem, 2vw, 0.85rem);
  color: #6b7280;
}

.payment-amount {
  font-weight: 600;
  color: #1f2937;
  font-size: clamp(0.9rem, 2.2vw, 1rem);
}

.payment-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: clamp(3px, 1vw, 4px);
}

.status-badge {
  padding: clamp(3px, 1vw, 4px) clamp(10px, 2.5vw, 12px);
  border-radius: 20px;
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  font-weight: 600;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.payment-date {
  font-size: clamp(0.75rem, 1.8vw, 0.8rem);
  color: #6b7280;
}

.forgot-password {
  color: #7c3aed;
  cursor: pointer;
  text-align: right;
  font-size: clamp(0.85rem, 2.1vw, 0.9rem);
  margin-bottom: clamp(12px, 3vw, 16px);
  transition: color 0.2s ease;
}

.forgot-password:hover {
  text-decoration: underline;
  color: #6d28d9;
}

.notification {
  position: fixed;
  bottom: clamp(20px, 5vw, 30px);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: clamp(12px, 3vw, 16px) clamp(20px, 4vw, 24px);
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(0.9rem, 2.2vw, 0.95rem);
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.4s ease-out;
  z-index: 1000;
  max-width: 90%;
  display: flex;
  align-items: center;
  gap: clamp(10px, 2.5vw, 12px);
}

.notification-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.notification-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.notification-icon {
  font-size: clamp(1.1rem, 2.8vw, 1.2rem);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.spinner {
  width: clamp(40px, 10vw, 50px);
  height: clamp(40px, 10vw, 50px);
  border: 4px solid #e5e7eb;
  border-left: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: clamp(15px, 4vw, 20px);
}

.loading-overlay p {
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  font-weight: 600;
  color: #374151;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .settings-page {
    padding: 20px 15px;
    gap: 25px;
  }
  
  .settings-content {
    padding: 20px;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .save-button,
  .back-button {
    flex: 1 1 auto;
    width: 100%;
  }
  
  .plan-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .payment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .payment-status {
    align-items: flex-start;
  }
  
  .promo-validation {
    position: static;
    margin-top: 8px;
  }
  
  .promocode-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .settings-content {
    padding: 16px;
  }
  
  .plan-card {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-content,
  .plan-card,
  .save-button,
  .back-button,
  .promo-button,
  .payment-button,
  .promo-validation,
  .spinner,
  .spinner-small {
    transition: none;
    animation: none;
  }
  
  .settings-content:hover,
  .plan-card:hover,
  .save-button:hover,
  .back-button:hover,
  .promo-button:hover,
  .payment-button:hover {
    transform: none;
  }
}
</style>