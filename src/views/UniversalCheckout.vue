<template>
  <div class="universal-checkout">
    <div class="checkout-container">
      <!-- Payment Success View -->
      <div v-if="paymentStatus === 'success'" class="payment-result success">
        <div class="result-icon">✅</div>
        <h1 class="result-title">Оплата успешна!</h1>
        <p class="result-message">Ваша подписка {{ planName }} активирована</p>
        <div class="transaction-info">
          <p><strong>План:</strong> {{ planName }}</p>
          <p><strong>Сумма:</strong> {{ formatAmount(finalAmount) }}</p>
          <p v-if="transactionId"><strong>ID транзакции:</strong> {{ transactionId }}</p>
        </div>
        <div class="result-actions">
          <button @click="goToDashboard" class="btn-primary btn-large">
            Перейти к курсам
          </button>
          <button @click="goHome" class="btn-secondary">
            На главную
          </button>
        </div>
      </div>

      <!-- Payment Failed View -->
      <div v-else-if="paymentStatus === 'failed'" class="payment-result failed">
        <div class="result-icon error">❌</div>
        <h1 class="result-title">Оплата не прошла</h1>
        <p class="result-message">{{ failureReason || 'Произошла ошибка при обработке платежа' }}</p>
        <div class="result-actions">
          <button @click="retryPayment" class="btn-primary btn-large">
            Попробовать снова
          </button>
          <button @click="goBack" class="btn-secondary">
            Изменить способ оплаты
          </button>
        </div>
      </div>

      <!-- Payment Cancelled View -->
      <div v-else-if="paymentStatus === 'cancelled'" class="payment-result cancelled">
        <div class="result-icon warning">⚠️</div>
        <h1 class="result-title">Оплата отменена</h1>
        <p class="result-message">Вы отменили процесс оплаты</p>
        <div class="result-actions">
          <button @click="retryPayment" class="btn-primary btn-large">
            Вернуться к оплате
          </button>
          <button @click="goHome" class="btn-secondary">
            На главную
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <div class="checkout-logo">
          <div class="logo-icon">💳</div>
          <h1>{{ loadingMessage }}</h1>
        </div>
        <div class="spinner"></div>
        <p>Перенаправление на страницу оплаты...</p>
        
        <div class="user-info-loading" v-if="userName">
          <p><strong>Пользователь:</strong> {{ finalUserName }}</p>
          <p><strong>План:</strong> {{ planName }} ({{ formatAmount(finalAmount) }})</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Ошибка инициации платежа</h2>
        <p class="error-message">{{ error }}</p>
        
        <div v-if="showDebugInfo" class="debug-info">
          <h4>Отладочная информация:</h4>
          <pre>{{ debugData }}</pre>
        </div>
        
        <div class="error-actions">
          <button @click="goBack" class="back-btn">← Назад</button>
          <button @click="retryPayment" class="retry-btn">🔄 Попробовать снова</button>
        </div>
      </div>

      <!-- Main Checkout View -->
      <div v-else class="method-selection-state">
        <div class="checkout-logo">
          <div class="logo-icon">💳</div>
          <h1>Оформление платежа</h1>
          <p class="subtitle">Безопасная оплата подписки ACED</p>
        </div>

        <div class="user-info-section">
          <h3>👤 Информация о платеже</h3>
          <div class="user-details">
            <div class="user-row">
              <span class="label">Имя:</span>
              <span class="value">{{ finalUserName || 'Не указано' }}</span>
            </div>
            <div class="user-row">
              <span class="label">ID пользователя:</span>
              <span class="value user-id">{{ finalUserId || 'Не указан' }}</span>
            </div>
            <div class="user-row">
              <span class="label">Email:</span>
              <span class="value">{{ finalUserEmail || 'Не указан' }}</span>
            </div>
            <div class="user-row">
              <span class="label">Текущий план:</span>
              <span class="value current-plan">{{ currentPlan || 'Free' }}</span>
            </div>
            <div class="user-row upgrade-row" v-if="finalPlan">
              <span class="label">Переход на план:</span>
              <span class="value new-plan">{{ planName }}</span>
            </div>
            <div class="user-row" v-if="finalAmount">
              <span class="label">Сумма к оплате:</span>
              <span class="value amount">{{ formatAmount(finalAmount) }}</span>
            </div>
          </div>
        </div>

        <div class="provider-selection">
          <h3>💳 Выберите способ оплаты</h3>
          <div class="provider-options">
            <label 
              v-for="(provider, key) in providers"
              :key="key"
              :class="{ active: paymentProvider === key, disabled: !provider.enabled }"
              @click="provider.enabled && (paymentProvider = key)"
            >
              <input 
                type="radio"
                v-model="paymentProvider"
                :value="key"
                :disabled="!provider.enabled" 
              />
              <div class="provider-content">
                <div class="provider-icon">
                  {{ provider.emoji }}
                </div>
                <div class="provider-info">
                  <span class="provider-name">{{ provider.name }}</span>
                  <span class="provider-description">{{ provider.description }}</span>
                  <span v-if="!provider.enabled" class="coming-soon">Скоро</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Saved Cards Section (for Multicard only) -->
        <div v-if="paymentProvider === 'multicard' && savedCards.length > 0" class="saved-cards-section">
          <h3>💳 Сохраненные карты</h3>
          <div class="saved-cards">
            <label 
              v-for="card in savedCards" 
              :key="card.cardToken"
              class="card-item"
              :class="{ active: selectedCardToken === card.cardToken }"
              @click="selectCard(card.cardToken)"
            >
              <div class="card-info">
                <div class="card-icon">
                  {{ getCardEmoji(card.ps) }}
                </div>
                <div class="card-details">
                  <p class="card-number">•••• {{ card.cardPan?.slice(-4) || '****' }}</p>
                  <p class="card-type">{{ getCardTypeName(card.ps) }}</p>
                </div>
              </div>
              <div class="card-radio">
                <input 
                  type="radio" 
                  :checked="selectedCardToken === card.cardToken"
                />
              </div>
            </label>
            <label 
              class="card-item new-card"
              :class="{ active: selectedCardToken === null }"
              @click="selectCard(null)"
            >
              <div class="card-info">
                <div class="card-icon">➕</div>
                <div class="card-details">
                  <p class="card-number">Новая карта</p>
                  <p class="card-type">Добавить другую карту</p>
                </div>
              </div>
              <div class="card-radio">
                <input type="radio" :checked="selectedCardToken === null" />
              </div>
            </label>
          </div>
        </div>

        <div class="plan-selection" v-if="!plan">
          <h3>📋 Выберите план</h3>
          <div class="plan-options">
            <label class="plan-option" :class="{ active: selectedPlan === 'start' }">
              <input type="radio" v-model="selectedPlan" value="start" />
              <div class="plan-details">
                <strong>Start Plan</strong>
                <span class="plan-price">260,000 UZS</span>
                <span class="plan-features">Базовые возможности</span>
              </div>
            </label>
            
            <label class="plan-option" :class="{ active: selectedPlan === 'pro' }">
              <input type="radio" v-model="selectedPlan" value="pro" />
              <div class="plan-details">
                <strong>Pro Plan</strong>
                <span class="plan-price">455,000 UZS</span>
                <span class="plan-features">Все возможности</span>
              </div>
            </label>
          </div>
        </div>

        <div class="language-selection">
          <h3>🌐 Язык интерфейса</h3>
          <select v-model="selectedLanguage" class="language-select">
            <option value="ru">🇷🇺 Русский</option>
            <option value="uz">🇺🇿 O'zbek</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        <button 
          @click="processPayment" 
          :disabled="!canProceedToPayment || processing" 
          class="payment-button"
          :class="{ disabled: !canProceedToPayment || processing }"
        >
          <span v-if="processing" class="button-spinner"></span>
          <span v-else-if="providers[paymentProvider]?.enabled && canProceedToPayment">
            💳 Оплатить {{ formatAmount(finalAmount) }}
          </span>
          <span v-else-if="!canProceedToPayment">
            {{ validationMessage }}
          </span>
          <span v-else>
            Выберите доступный способ оплаты
          </span>
        </button>

        <div class="security-notice">
          <span class="security-icon">🔒</span>
          <p>Ваши платежные данные защищены и передаются по безопасному протоколу</p>
        </div>
      </div>

      <!-- OTP Modal -->
      <div v-if="showOtpModal" class="modal-overlay" @click.self="closeOtpModal">
        <div class="modal-content otp-modal">
          <h3>Введите код подтверждения</h3>
          <p>Код отправлен на номер телефона, привязанный к карте</p>
          
          <div class="otp-input-container">
            <input 
              v-for="(digit, index) in otpDigits" 
              :key="index"
              v-model="otpDigits[index]"
              type="text"
              maxlength="1"
              class="otp-digit"
              @input="handleOtpInput(index, $event)"
              @keydown.backspace="handleOtpBackspace(index, $event)"
              :ref="el => { if (el) otpInputs[index] = el }"
            />
          </div>

          <div v-if="otpError" class="error-message">{{ otpError }}</div>

          <div class="modal-actions">
            <button @click="closeOtpModal" class="btn-secondary" :disabled="processing">
              Отмена
            </button>
            <button @click="submitOtp" class="btn-primary" :disabled="processing || otp.length < 6">
              {{ processing ? 'Проверка...' : 'Подтвердить' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { 
  initiatePaymePayment, 
  initiateMulticardPayment,
  createPaymentByToken,
  confirmPayment
} from '@/api';

export default {
  name: 'UniversalCheckout',
  props: {
    plan: {
      type: String,
      default: ''
    },
    provider: {
      type: String,
      default: 'multicard'
    },
    userId: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      default: ''
    },
    userEmail: {
      type: String,
      default: ''
    },
    currentPlan: {
      type: String,
      default: 'free'
    },
    amount: {
      type: [String, Number],
      default: 0
    }
  },
  
  data() {
    return {
      loading: false,
      processing: false,
      error: '',
      
      // Payment status tracking
      paymentStatus: null, // null, 'success', 'failed', 'cancelled'
      transactionId: null,
      failureReason: '',
      
      // Payment method selection
      selectedLanguage: 'ru',
      selectedPlan: '',
      loadingMessage: 'Подготовка к оплате...',

      // Provider selection with emoji icons
      paymentProvider: 'multicard',
      providers: {
        multicard: { 
          enabled: true, 
          name: 'Multicard', 
          emoji: '💳',
          description: 'Банковские карты Узбекистана'
        },
        payme: { 
          enabled: true, 
          name: 'PayMe', 
          emoji: '📱',
          description: 'Быстрая оплата'
        },
        click: { 
          enabled: false, 
          name: 'Click', 
          emoji: '⚡',
          description: 'Оплата через Click'
        },
        uzum: { 
          enabled: false, 
          name: 'Uzum Bank', 
          emoji: '🟣',
          description: 'Uzum Bank и кошелек'
        }
      },
      
      // Saved cards for Multicard
      savedCards: [],
      selectedCardToken: null,
      
      // OTP handling
      showOtpModal: false,
      otpDigits: ['', '', '', '', '', ''],
      otpInputs: [],
      otpError: null,
      currentPaymentUuid: null,
      
      // Internal state
      internalUserId: '',
      internalUserName: '',
      internalUserEmail: '',
      
      // Debug mode
      showDebugInfo: process.env.NODE_ENV === 'development'
    };
  },
  
  computed: {
    finalPlan() {
      return this.plan || this.selectedPlan || '';
    },
    
    finalUserId() {
      return this.internalUserId || 
             this.userId || 
             this.$route.query.userId || 
             auth.currentUser?.uid || 
             '';
    },
    
    finalUserName() {
      return this.internalUserName || 
             this.userName || 
             this.$route.query.userName || 
             auth.currentUser?.displayName || 
             'Пользователь';
    },
    
    finalUserEmail() {
      return this.internalUserEmail || 
             this.userEmail || 
             this.$route.query.userEmail || 
             auth.currentUser?.email || 
             '';
    },
    
    finalAmount() {
      let amt = parseInt(this.amount) || 0;
      
      if (amt > 0) {
        // If amount is in UZS (less than 10000), convert to tiyin
        if (amt < 10000) {
          amt = amt * 100;
        }
        return amt;
      }
      
      // Use default amounts based on plan
      const amounts = {
        start: 26000000,  // 260,000 UZS in tiyin
        pro: 45500000     // 455,000 UZS in tiyin
      };
      
      return amounts[this.finalPlan] || amounts.start;
    },
    
    planName() {
      const plan = this.finalPlan;
      return plan === 'start' ? 'Start Plan' : plan === 'pro' ? 'Pro Plan' : '';
    },
    
    canProceedToPayment() {
      return Boolean(
        this.finalUserId && 
        this.finalPlan && 
        this.finalAmount > 0 &&
        this.providers[this.paymentProvider]?.enabled
      );
    },
    
    validationMessage() {
      if (!this.finalUserId) return 'Не указан ID пользователя';
      if (!this.finalPlan) return 'Выберите план';
      if (!this.finalAmount || this.finalAmount <= 0) return 'Неверная сумма платежа';
      if (!this.providers[this.paymentProvider]?.enabled) return 'Выберите доступный способ оплаты';
      return 'Заполните все поля';
    },
    
    otp() {
      return this.otpDigits.join('');
    },
    
    debugData() {
      return {
        props: {
          plan: this.plan,
          userId: this.userId,
          userName: this.userName,
          userEmail: this.userEmail,
          amount: this.amount,
          provider: this.provider
        },
        computed: {
          finalPlan: this.finalPlan,
          finalUserId: this.finalUserId,
          finalUserName: this.finalUserName,
          finalUserEmail: this.finalUserEmail,
          finalAmount: this.finalAmount,
          canProceed: this.canProceedToPayment
        },
        route: {
          query: this.$route.query,
          params: this.$route.params
        },
        auth: {
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName
          } : null
        }
      };
    }
  },
  
  async mounted() {
    await this.initializeCheckout();
  },
  
  methods: {
    async initializeCheckout() {
      try {
        // Check for payment status in URL
        this.checkPaymentStatus();
        
        // Load data from multiple sources
        this.loadPaymentData();
        
        // Load saved cards for Multicard
        await this.loadSavedCards();
        
        // Wait for auth if needed
        if (!this.finalUserId && auth.currentUser === null) {
          console.log('⏳ Waiting for auth...');
          await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
              if (user) {
                console.log('✅ Auth ready:', user.uid);
                this.internalUserId = user.uid;
                this.internalUserName = user.displayName || 'Пользователь';
                this.internalUserEmail = user.email || '';
                unsubscribe();
                resolve();
              }
            });
            
            setTimeout(() => {
              unsubscribe();
              resolve();
            }, 3000);
          });
        }
        
        // Validate after loading
        this.validatePaymentData();
        
        // Auto-process if requested
        if (this.$route.query.auto === 'true' && this.canProceedToPayment) {
          console.log('🚀 Auto-processing payment...');
          await this.processPayment();
        }
        
      } catch (error) {
        console.error('❌ Checkout initialization error:', error);
        this.error = 'Ошибка инициализации платежа';
      }
    },
    
    checkPaymentStatus() {
      const query = this.$route.query;
      
      if (query.status === 'success') {
        this.paymentStatus = 'success';
        this.transactionId = query.transactionId || query.uuid;
      } else if (query.status === 'failed' || query.status === 'error') {
        this.paymentStatus = 'failed';
        this.failureReason = query.reason || query.error;
      } else if (query.status === 'cancelled') {
        this.paymentStatus = 'cancelled';
      }
    },
    
    loadPaymentData() {
      const query = this.$route.query;
      
      this.internalUserId = this.userId || query.userId || '';
      this.internalUserName = this.userName || query.userName || '';
      this.internalUserEmail = this.userEmail || query.userEmail || '';
      
      if (this.plan) {
        this.selectedPlan = this.plan;
      } else if (query.plan) {
        this.selectedPlan = query.plan;
      }
      
      this.selectedLanguage = query.lang || 'ru';
      
      if (this.provider && this.providers[this.provider]) {
        this.paymentProvider = this.provider;
      } else if (query.provider && this.providers[query.provider]) {
        this.paymentProvider = query.provider;
      }
      
      console.log('📊 Payment data loaded:', {
        userId: this.finalUserId,
        plan: this.finalPlan,
        amount: this.finalAmount,
        provider: this.paymentProvider
      });
    },

    async loadSavedCards() {
      try {
        // Get saved cards from user profile or API
        if (auth.currentUser) {
          // TODO: Implement API call to get saved cards
          // const response = await getSavedCards(auth.currentUser.uid);
          // this.savedCards = response.cards || [];
          
          // For now, mock data (remove in production)
          this.savedCards = [];
        }
      } catch (err) {
        console.error('❌ Error loading saved cards:', err);
      }
    },

    selectCard(token) {
      this.selectedCardToken = token;
    },

    getCardEmoji(ps) {
      const emojis = {
        uzcard: '🟦',
        humo: '🟩',
        visa: '🔵',
        mastercard: '🔴'
      };
      return emojis[ps?.toLowerCase()] || '💳';
    },

    getCardTypeName(ps) {
      const names = {
        uzcard: 'UZCARD',
        humo: 'HUMO',
        visa: 'Visa',
        mastercard: 'Mastercard'
      };
      return names[ps?.toLowerCase()] || 'Card';
    },

    createOfdData() {
      // Create proper OFD (fiscal receipt) data
      return {
        items: [
          {
            name: `ACED ${this.finalPlan.toUpperCase()} Plan Subscription`,
            price: this.finalAmount,
            quantity: 1,
            mxik: '10899002001000000', // Service MXIK code
            packageCode: '1'
          }
        ]
      };
    },

    validatePaymentData() {
      const errors = [];

      if (!this.finalUserId) {
        errors.push('User ID is required');
      }

      if (!this.finalPlan) {
        errors.push('Plan selection is required');
      }

      if (!this.finalAmount || this.finalAmount <= 0) {
        errors.push('Valid amount is required');
      }

      if (errors.length > 0) {
        console.warn('⚠️ Payment data validation issues:', errors);
      }
    },

    async processPayment() {
      if (!this.canProceedToPayment) {
        this.error = this.validationMessage;
        return;
      }
      
      try {
        this.loading = true;
        this.processing = true;
        this.error = '';

        const provider = this.paymentProvider;
        
        console.log('💳 Processing payment:', {
          provider,
          plan: this.finalPlan,
          userId: this.finalUserId,
          amount: this.finalAmount,
          cardToken: this.selectedCardToken
        });
        
        this.loadingMessage = `Перенаправление на ${this.providers[provider]?.name || 'оплату'}...`;
        
        if (provider === 'payme') {
          await this.processPaymePayment();
        } else if (provider === 'multicard') {
          if (this.selectedCardToken) {
            await this.processMulticardTokenPayment();
          } else {
            await this.processMulticardNewCardPayment();
          }
        } else {
          throw new Error('Выбранный способ оплаты временно недоступен');
        }

      } catch (error) {
        console.error('❌ Payment processing error:', error);
        
        if (error.message?.includes('временно отключен') || 
            error.message?.includes('temporarily disabled')) {
          this.error = 'Этот способ оплаты временно недоступен. Пожалуйста, выберите другой способ оплаты.';
        } else {
          this.error = this.formatError(error);
        }
        
        this.loading = false;
        this.processing = false;
      }
    },

    async processPaymePayment() {
      const result = await initiatePaymePayment(
        this.finalUserId, 
        this.finalPlan, 
        { 
          lang: this.selectedLanguage,
          amount: this.finalAmount
        }
      );
      
      if (result.paymentUrl) {
        console.log('✅ PayMe URL received:', result.paymentUrl);
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || 'Не удалось получить ссылку на оплату PayMe');
      }
    },

    async processMulticardNewCardPayment() {
      const ofdData = this.createOfdData();
      
      const result = await initiateMulticardPayment({
        userId: this.finalUserId,
        plan: this.finalPlan,
        amount: this.finalAmount,
        lang: this.selectedLanguage,
        userName: this.finalUserName,
        userEmail: this.finalUserEmail,
        ofd: ofdData
      });
      
      if (result.data?.checkoutUrl) {
        console.log('✅ Multicard URL received:', result.data.checkoutUrl);
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error(result.error || 'Не удалось получить ссылку на оплату Multicard');
      }
    },

    async processMulticardTokenPayment() {
      const ofdData = this.createOfdData();
      
      const result = await createPaymentByToken({
        card: {
          token: this.selectedCardToken
        },
        amount: this.finalAmount,
        storeId: process.env.VUE_APP_MULTICARD_STORE_ID,
        invoiceId: `aced_${this.finalPlan}_${this.finalUserId}_${Date.now()}`,
        callbackUrl: `${process.env.VUE_APP_API_BASE_URL}/api/payments/multicard/webhook`,
        ofd: ofdData
      });

      if (result.success) {
        if (result.data.otpHash) {
          // OTP required
          this.currentPaymentUuid = result.data.uuid;
          this.showOtpModal = true;
          this.loading = false;
          this.processing = false;
        } else if (result.data.checkoutUrl) {
          // Redirect to payment app
          window.location.href = result.data.checkoutUrl;
        } else if (result.data.status === 'success') {
          // Payment completed
          this.handlePaymentSuccess(result.data);
        }
      } else {
        throw new Error(result.error);
      }
    },

    handleOtpInput(index, event) {
      const value = event.target.value;
      
      if (value && index < 5) {
        this.otpInputs[index + 1]?.focus();
      }
    },

    handleOtpBackspace(index, event) {
      if (!this.otpDigits[index] && index > 0) {
        this.otpInputs[index - 1]?.focus();
      }
    },

    async submitOtp() {
      this.processing = true;
      this.otpError = null;

      try {
        const result = await confirmPayment(
          this.currentPaymentUuid,
          this.otp
        );

        if (result.success) {
          if (result.data.status === 'success') {
            this.closeOtpModal();
            this.handlePaymentSuccess(result.data);
          } else {
            throw new Error('Платеж не подтвержден');
          }
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('❌ OTP error:', err);
        this.otpError = err.message || 'Неверный код подтверждения';
      } finally {
        this.processing = false;
      }
    },

    closeOtpModal() {
      this.showOtpModal = false;
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpError = null;
    },

    handlePaymentSuccess(paymentData) {
      console.log('🎉 Payment successful:', paymentData);
      
      this.paymentStatus = 'success';
      this.transactionId = paymentData.uuid || paymentData.transactionId;
      this.loading = false;
      this.processing = false;
    },

    formatError(error) {
      if (typeof error === 'string') {
        return error;
      }
      
      if (error?.response?.data?.message) {
        return error.response.data.message;
      }
      
      if (error?.response?.data?.error) {
        return error.response.data.error;
      }
      
      if (error?.message) {
        return error.message;
      }
      
      return 'Произошла ошибка при обработке платежа. Попробуйте снова.';
    },

    async retryPayment() {
      this.error = '';
      this.loading = false;
      this.processing = false;
      this.paymentStatus = null;
      
      this.loadPaymentData();
      this.validatePaymentData();
      
      if (this.canProceedToPayment) {
        await this.processPayment();
      }
    },

    formatAmount(amount) {
      if (!amount) return '';
      
      const uzs = amount > 10000 ? Math.floor(amount / 100) : amount;
      
      try {
        return new Intl.NumberFormat('uz-UZ', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(uzs) + ' сум';
      } catch (formatError) {
        return `${uzs.toLocaleString()} сум`;
      }
    },

    goBack() {
      if (this.paymentStatus) {
        this.paymentStatus = null;
      } else {
        this.$router.go(-1);
      }
    },

    goToDashboard() {
      this.$router.push('/dashboard');
    },

    goHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
/* Base styles */
.universal-checkout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.checkout-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 650px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Payment Result States */
.payment-result {
  text-align: center;
  padding: 40px 20px;
}

.result-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.result-icon.error {
  color: #e53e3e;
}

.result-icon.warning {
  color: #ed8936;
}

.result-title {
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 15px;
}

.result-message {
  font-size: 1.1rem;
  color: #718096;
  margin-bottom: 30px;
}

.transaction-info {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.transaction-info p {
  margin: 10px 0;
  color: #4a5568;
  font-size: 1rem;
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-large {
  padding: 15px 40px;
  font-size: 1.1rem;
}

/* Logo and Header */
.checkout-logo {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  font-size: 3.5rem;
  margin-bottom: 10px;
}

.checkout-logo h1 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 2.2rem;
  font-weight: bold;
}

.subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state h1 {
  font-size: 2rem;
  color: #333;
}

.spinner, .button-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

.button-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-width: 3px;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* User Info Section */
.user-info-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.user-info-section h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.user-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  font-weight: 500;
  color: #333;
}

.current-plan {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.new-plan {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.amount {
  background: #fff3e0;
  color: #f57c00;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: bold;
}

/* Provider Selection */
.provider-selection {
  margin-bottom: 25px;
}

.provider-selection h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.provider-options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.provider-options label {
  display: flex;
  align-items: center;
  padding: 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.provider-options label:hover:not(.disabled) {
  border-color: #667eea;
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.provider-options label.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.provider-options label.disabled {
  border-color: #eee;
  background: #fafafa;
  cursor: not-allowed;
  opacity: 0.6;
}

.provider-options input[type="radio"] {
  display: none;
}

.provider-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 15px;
}

.provider-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.provider-name {
  color: #333;
  font-weight: 700;
  font-size: 1.1rem;
}

.provider-description {
  color: #666;
  font-size: 0.9rem;
}

.coming-soon {
  color: #f57c00;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 4px;
}

/* Saved Cards */
.saved-cards-section {
  margin-bottom: 25px;
}

.saved-cards-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.saved-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.card-item:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}

.card-item.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.card-item.new-card {
  border-style: dashed;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  font-size: 2rem;
  width: 48px;
  text-align: center;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-number {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.card-type {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.card-radio input[type="radio"] {
  width: 20px;
  height: 20px;
}

/* Plan Selection */
.plan-selection {
  margin-bottom: 25px;
}

.plan-selection h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.plan-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.plan-option {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.plan-option:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.plan-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.plan-option input[type="radio"] {
  display: none;
}

.plan-details {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.plan-details strong {
  font-size: 1.1rem;
  color: #333;
}

.plan-price {
  color: #667eea;
  font-weight: bold;
  font-size: 1.05rem;
}

.plan-features {
  color: #666;
  font-size: 0.9rem;
}

/* Language Selection */
.language-selection {
  margin-bottom: 25px;
}

.language-selection h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 1.2rem;
}

.language-select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-select:hover {
  border-color: #667eea;
}

.language-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Payment Button */
.payment-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.payment-button:hover:not(:disabled):not(.disabled) {
  background: linear-gradient(135deg, #5568d3, #6a3f91);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.payment-button:disabled,
.payment-button.disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}

/* Security Notice */
.security-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f0f8ff;
  border: 1px solid #d0e7ff;
  border-radius: 8px;
  margin-top: 15px;
}

.security-icon {
  font-size: 1.5rem;
}

.security-notice p {
  margin: 0;
  color: #1976d2;
  font-size: 0.9rem;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 20px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h2 {
  color: #d32f2f;
  margin-bottom: 15px;
}

.error-message {
  color: #666;
  margin-bottom: 25px;
  font-size: 1.05rem;
}

.debug-info {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  text-align: left;
}

.debug-info h4 {
  margin-top: 0;
  color: #333;
}

.debug-info pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 300px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.back-btn, .retry-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.back-btn {
  background: #f5f5f5;
  color: #333;
}

.back-btn:hover {
  background: #e0e0e0;
}

.retry-btn {
  background: #667eea;
  color: white;
}

.retry-btn:hover {
  background: #5568d3;
}

/* OTP Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.otp-modal h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.otp-modal p {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 1.5rem 0;
}

.otp-input-container {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.otp-digit {
  width: 48px;
  height: 56px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.otp-digit:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .checkout-container {
    padding: 25px 20px;
    margin: 10px;
  }
  
  .provider-options {
    grid-template-columns: 1fr;
  }
  
  .plan-options {
    grid-template-columns: 1fr;
  }
  
  .checkout-logo h1 {
    font-size: 1.8rem;
  }
  
  .provider-icon {
    font-size: 2rem;
  }
  
  .error-actions, .result-actions {
    flex-direction: column;
  }
  
  .back-btn, .retry-btn, .btn-primary, .btn-secondary {
    width: 100%;
  }

  .otp-digit {
    width: 40px;
    height: 48px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .checkout-container {
    padding: 20px 15px;
  }
  
  .checkout-logo h1 {
    font-size: 1.5rem;
  }
  
  .user-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .modal-content {
    padding: 1.5rem;
  }
}
</style>