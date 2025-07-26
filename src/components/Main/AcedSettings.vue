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
      lastUpdateTime: Date.now(),
      
      // Component update tracking
      componentMounted: false,
      statusEventListeners: []
    };
  },
  
  computed: {
    // ✅ BULLETPROOF: Enhanced reactive getters with null safety
    currentPlan() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const status = this.$store.getters['user/userStatus'];
        console.log('🔍 currentPlan computed:', status, { reactKey, updateTime });
        return status || 'free';
      } catch (e) {
        console.warn('⚠️ Error getting userStatus:', e);
        return 'free';
      }
    },
    
    // ✅ BULLETPROOF: Enhanced reactive subscription details
    subscriptionDetails() {
      const reactKey = this.reactivityKey; // Force reactivity
      const updateTime = this.lastUpdateTime; // Force reactivity
      
      try {
        const details = this.$store.getters['user/subscriptionDetails'];
        console.log('🔍 subscriptionDetails computed:', details, { reactKey, updateTime });
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
    // ✅ BULLETPROOF: Enhanced watchers
    '$store.state.user.userStatus': {
      handler(newStatus, oldStatus) {
        if (newStatus !== oldStatus) {
          console.log(`👀 Watched userStatus change: ${oldStatus} → ${newStatus}`);
          this.forceReactivityUpdate();
        }
      },
      immediate: false
    },
    
    '$store.state.user.subscription': {
      handler(newSub, oldSub) {
        if (newSub !== oldSub) {
          console.log('👀 Subscription details changed');
          this.forceReactivityUpdate();
        }
      },
      deep: true
    },
    
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
    }
  },
  
  async mounted() {
    console.log('🔧 AcedSettings: Component mounting...');
    await this.initializeComponent();
    this.setupEnhancedEventListeners();
    this.componentMounted = true;
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    // ✅ BULLETPROOF: Enhanced initialization
    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        await this.loadInitialData();
        this.forceReactivityUpdate();
      } catch (error) {
        console.error('❌ Settings initialization error:', error);
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
    
    // ✅ ENHANCED: Setup comprehensive event listeners
    setupEnhancedEventListeners() {
      console.log('🔧 Setting up enhanced event listeners...');
      
      // Clear existing listeners
      this.cleanupEventListeners();
      
      // ✅ METHOD 1: DOM event listeners (most reliable)
      const handleStatusChange = (event) => {
        console.log('📡 AcedSettings: DOM event received:', event.type, event.detail);
        this.forceReactivityUpdate();
      };

      const domEvents = [
        'userStatusChanged',
        'userSubscriptionChanged',
        'subscriptionUpdated',
        'globalForceUpdate',
        'reactivityUpdate',
        'promocodeApplied'
      ];

      domEvents.forEach(eventType => {
        window.addEventListener(eventType, handleStatusChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener(eventType, handleStatusChange);
        });
      });

      // ✅ METHOD 2: Event Bus listeners
      if (window.eventBus) {
        const eventBusHandler = (data) => {
          console.log('📡 AcedSettings: EventBus event received:', data);
          this.forceReactivityUpdate();
        };

        const eventBusEvents = [
          'userStatusChanged',
          'subscriptionUpdated',
          'promocodeApplied',
          'globalForceUpdate',
          'forceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          window.eventBus.on(eventType, eventBusHandler);
          this.statusEventListeners.push(() => {
            window.eventBus.off(eventType, eventBusHandler);
          });
        });
      }

      // ✅ METHOD 3: Store subscription
      if (this.$store && typeof this.$store.subscribe === 'function') {
        const storeUnsubscribe = this.$store.subscribe((mutation) => {
          const relevantMutations = [
            'user/SET_USER_STATUS',
            'user/setUserStatus',
            'user/UPDATE_SUBSCRIPTION',
            'user/FORCE_UPDATE',
            'user/ADD_PROMOCODE'
          ];
          
          if (relevantMutations.includes(mutation.type)) {
            console.log('📊 AcedSettings: Store mutation:', mutation.type);
            this.forceReactivityUpdate();
          }
        });
        
        this.statusEventListeners.push(storeUnsubscribe);
      }

      console.log('✅ Enhanced event listeners setup complete');
    },
    
    cleanupEventListeners() {
      this.statusEventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('⚠️ Cleanup error:', error);
        }
      });
      this.statusEventListeners = [];
    },
    
    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      this.cleanupEventListeners();
    },
    
    // ✅ ENHANCED: Force reactivity update
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
        });
        
        console.log('🔄 AcedSettings: Reactivity updated:', {
          reactivityKey: this.reactivityKey,
          lastUpdateTime: this.lastUpdateTime,
          currentPlan: this.currentPlan
        });
      } catch (error) {
        console.warn('⚠️ Reactivity update failed:', error);
      }
    },
    
    // ✅ FIXED: Enhanced promocode input handling
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
    async applyPromo() {
      console.log('🚀 AcedSettings: applyPromo called');
      
      if (!this.promoCode || !this.selectedPlan || !this.userId) {
        this.showNotification('Заполните все поля', 'error');
        return;
      }
      
      this.isProcessingPromo = true;
      
      try {
        const normalizedCode = this.promoCode.trim().toUpperCase();
        
        // ✅ STEP 1: Apply via backend API
        console.log('📡 Applying promocode via backend API...');
        
        let serverResult = null;
        let serverSuccess = false;
        
        // Try multiple endpoints for applying promocode
        const applyEndpoints = [
          {
            url: 'https://api.aced.live/api/payments/promo-code',
            method: 'POST'
          },
          {
            url: `${import.meta.env.VITE_API_BASE_URL}/api/payments/promo-code`,
            method: 'POST'
          },
          {
            url: `${import.meta.env.VITE_API_BASE_URL}/api/promocodes/apply`,
            method: 'POST'
          },
          {
            url: `${import.meta.env.VITE_API_BASE_URL}/promocodes/apply`,
            method: 'POST'
          }
        ];
        
        for (const endpoint of applyEndpoints) {
          try {
            console.log(`🔄 Trying apply endpoint: ${endpoint.url}`);
            
            const requestBody = {
              userId: this.userId,
              plan: this.selectedPlan,
              promoCode: normalizedCode
            };
            
            const response = await Promise.race([
              fetch(endpoint.url, {
                method: endpoint.method,
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
            console.log(`📡 Server response from ${endpoint.url}:`, serverResult);

            if (response.ok && serverResult?.success) {
              serverSuccess = true;
              console.log('✅ Server application successful');
              break; // Success, stop trying other endpoints
            } else {
              console.warn(`⚠️ Endpoint ${endpoint.url} failed:`, serverResult?.error || 'Unknown error');
              
              // If this is a validation error (promocode doesn't exist), don't try other endpoints
              if (response.status === 400 || response.status === 422) {
                const errorMsg = serverResult?.error || serverResult?.message || 'Неверный промокод';
                this.showNotification(errorMsg, 'error');
                return;
              }
              
              // For 404, try next endpoint
              if (response.status === 404) {
                continue;
              }
            }
          } catch (endpointError) {
            console.warn(`⚠️ Apply endpoint ${endpoint.url} failed:`, endpointError.message);
            continue;
          }
        }
        
        // ✅ STEP 2: If no server success, show error
        if (!serverSuccess) {
          const errorMsg = serverResult?.error || 
                          serverResult?.message || 
                          'Не удалось применить промокод. Проверьте правильность кода или попробуйте позже.';
          this.showNotification(errorMsg, 'error');
          return;
        }
        
        // ✅ STEP 3: Update local store after successful server application
        console.log('🔄 Updating user status via store...');
        
        const updateResult = await this.$store.dispatch('user/updateUserStatus', this.selectedPlan);
        console.log('📊 Store update result:', updateResult);
        
        if (updateResult && updateResult.success === true) {
          console.log('✅ Store user status updated successfully');
          
          // ✅ Add promocode to store
          this.$store.commit('user/ADD_PROMOCODE', {
            code: normalizedCode,
            plan: this.selectedPlan,
            oldPlan: updateResult.oldStatus || 'free',
            source: 'api',
            details: { 
              appliedAt: new Date().toISOString(),
              serverResponse: serverResult || null
            }
          });
          
          // ✅ CRITICAL: Update localStorage immediately (same as UserSection)
          localStorage.setItem('userStatus', this.selectedPlan);
          localStorage.setItem('plan', this.selectedPlan);
          
          // ✅ Success feedback
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          // ✅ Reset form
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          // ✅ Force reactivity update
          this.forceReactivityUpdate();
          
          // ✅ CRITICAL: Trigger global events (same as UserSection)
          if (typeof window !== 'undefined') {
            // Method 1: Custom DOM event
            const event = new CustomEvent('userSubscriptionChanged', {
              detail: {
                plan: this.selectedPlan,
                oldPlan: updateResult.oldStatus || 'free',
                source: 'promocode',
                timestamp: Date.now()
              },
              bubbles: true
            });
            window.dispatchEvent(event);
            
            // Method 2: Event bus
            if (window.eventBus) {
              window.eventBus.emit('promocodeApplied', {
                newStatus: this.selectedPlan,
                oldStatus: updateResult.oldStatus || 'free',
                code: normalizedCode
              });
            }
          }
          
        } else {
          console.warn('⚠️ Store update failed after successful server application:', updateResult);
          
          // Even if store update fails, the server has applied the promocode successfully
          this.showNotification('Промокод применён успешно! Обновите страницу если изменения не отобразились.', 'warning');
          
          // Force page refresh after delay
          setTimeout(() => {
            if (confirm('Промокод успешно применён на сервере! Обновить страницу для синхронизации?')) {
              window.location.reload();
            }
          }, 2000);
        }
        
      } catch (error) {
        console.error('❌ Promocode application failed:', error);
        
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
    
    // Your existing methods...
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
@import "@/assets/css/AcedSettings.css";

</style>