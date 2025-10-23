<template>
  <div class="payme-checkout">
    <div class="checkout-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="payme-logo">
          <!-- TODO: Update logo based on provider? -->
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>{{ loadingMessage }}</h1>
        </div>
        <div class="spinner"></div>
        <p>Перенаправление на страницу оплаты...</p>
        
        <!-- User Info While Loading -->
        <div class="user-info-loading" v-if="userName">
          <p><strong>Пользователь:</strong> {{ userName }}</p>
          <p><strong>План:</strong> {{ planName }} ({{ formatAmount(amount) }})</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Ошибка инициации платежа</h2>
        <p>{{ error }}</p>
        <button @click="goBack" class="back-btn">Назад</button>
        <button @click="retryPayment" class="retry-btn">Попробовать снова</button>
      </div>

      <!-- Payment Method Selection (Before Payment) -->
      <div v-else class="method-selection-state">
        <div class="payme-logo">
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>Checkout</h1>
        </div>

        <!-- User Information -->
        <div class="user-info-section">
          <h3>👤 Информация о платеже</h3>
          <div class="user-details">
            <div class="user-row">
              <span class="label">Имя:</span>
              <span class="value">{{ userName || 'Не указано' }}</span>
            </div>
            <div class="user-row">
              <span class="label">ID пользователя:</span>
              <span class="value user-id">{{ userId }}</span>
            </div>
            <div class="user-row">
              <span class="label">Email:</span>
              <span class="value">{{ userEmail || 'Не указан' }}</span>
            </div>
            <div class="user-row">
              <span class="label">Текущий план:</span>
              <span class="value current-plan">{{ currentPlan || 'Free' }}</span>
            </div>
            <div class="user-row upgrade-row" v-if="plan">
              <span class="label">Переход на план:</span>
              <span class="value new-plan">{{ planName }}</span>
            </div>
            <div class="user-row" v-if="amount">
              <span class="label">Сумма к оплате:</span>
              <span class="value amount">{{ formatAmount(amount) }}</span>
            </div>
          </div>
        </div>

        <!-- NEW: Payment Provider Detection -->
        <div class="provider-selection">
          <h3>Выберите Платежную Систему</h3>
          <div class="provider-options">
            <label v-for="(provider, key) in providers"
                   :key="key"
                   :class="{ active: paymentProvider === key, disabled: !provider.enabled }">
              <input type="radio"
                     v-model="paymentProvider"
                     :value="key"
                     :disabled="!provider.enabled" />
              <!-- Using placeholder images -->
              <img :src="provider.icon.includes('...') ? `https://placehold.co/32x32/eee/aaa?text=${provider.name.charAt(0)}` : provider.icon" :alt="provider.name" />
              <span>{{ provider.name }}</span>
            </label>
          </div>
        </div>

        <!-- Plan Selection (if not provided in URL) -->
        <div class="plan-selection" v-if="!plan">
          <h3>Выберите план</h3>
          <div class="plan-options">
            <label class="plan-option" :class="{ active: selectedPlan === 'start' }">
              <input type="radio" v-model="selectedPlan" value="start" />
              <div class="plan-details">
                <strong>Start Plan</strong>
                <span class="plan-price">260,000 UZS</span>
              </div>
            </label>
            
            <label class="plan-option" :class="{ active: selectedPlan === 'pro' }">
              <input type="radio" v-model="selectedPlan" value="pro" />
              <div class="plan-details">
                <strong>Pro Plan</strong>
                <span class="plan-price">455,000 UZS</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Language Selection -->
        <div class="language-selection">
          <h3>Язык интерфейса</h3>
          <select v-model="selectedLanguage" class="language-select">
            <option value="ru">🇷🇺 Русский</option>
            <option value="uz">🇺🇿 O'zbek</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        <!-- Payment Button -->
        <button 
          @click="processPayment" 
          :disabled="(!selectedPlan && !plan) || !providers[paymentProvider]?.enabled" 
          class="payment-button"
        >
          💳 Перейти к оплате
        </button>
      </div>

    </div>
  </div>
</template>

<script>
// ✅ Import from the main API file with safe error handling
// Added initiateMulticardPayment
import { 
  initiatePaymePayment, 
  safeErrorMessage, 
  initiateMulticardPayment 
} from '@/api';

export default {
  name: 'UniversalCheckout', // Renamed from PaymeCheckout
  data() {
    return {
      loading: false,
      error: '',
      // paymentUrl and dynamicContent removed, as new flow redirects directly
      
      // Payment method selection
      selectedLanguage: 'ru',
      selectedPlan: '',
      loadingMessage: 'Подготовка к оплате...',

      // NEW: Provider selection
      paymentProvider: 'payme', // 'payme', 'multicard', 'click', 'uzum'
      providers: {
        payme: { enabled: true, name: 'PayMe', icon: '../assets/icons/payme_color.png' }, // Assuming you have a color icon
        multicard: { enabled: true, name: 'Multicard', icon: '...' },
        click: { enabled: false, name: 'Click', icon: '...' },
        uzum: { enabled: false, name: 'Uzum', icon: '...' }
      },
      
      // Payment data
      transactionId: '',
      userId: '',
      amount: 0,
      plan: '',
      userName: '',
      userEmail: '',
      currentPlan: '',
      
      // Debug mode
      showDebugInfo: process.env.NODE_ENV === 'development'
    };
  },
  
  computed: {
    // ✅ FIXED: Ensure proper plan selection
    finalPlan() {
      return this.plan || this.selectedPlan || 'start';
    },
    
    // ✅ FIXED: Ensure amount is properly formatted
    amountInTiyin() {
      let amount = parseInt(this.amount) || 0;
      
      // If amount seems to be in UZS (less than 10000), convert to tiyin
      if (amount > 0 && amount < 10000) {
        amount = amount * 100;
      }
      
      // If no amount specified, use default amounts
      if (amount === 0) {
        const amounts = {
          start: 26000000,  // 260,000 UZS in tiyin
          pro: 45500000     // 455,000 UZS in tiyin
        };
        amount = amounts[this.finalPlan] || 26000000;
      }
      
      return amount;
    },
    
    planName() {
      const currentPlan = this.plan || this.selectedPlan;
      return currentPlan === 'start'
        ? 'Start Plan'
        : currentPlan === 'pro'
        ? 'Pro Plan'
        : '';
    },
    
    // ✅ FIXED: Generate proper account object with Login
    accountObject() {
      return {
        Login: this.userId,
        user_id: String(this.userId),
        plan: this.finalPlan,
        email: this.userEmail || '',
        name: this.userName || ''
      };
    }
  },
  
  async mounted() {
    this.loadPaymentData();
    this.validatePaymentData();
    
    // Auto-initiation logic (if you still want it)
    if (this.userId && this.plan && this.$route.query.auto === 'true') {
      // Check if a provider was also passed in the URL
      const urlProvider = new URLSearchParams(window.location.search).get('provider');
      if (urlProvider && this.providers[urlProvider]?.enabled) {
        this.paymentProvider = urlProvider;
      }
      await this.processPayment();
    }
  },
  
  methods: {
    // ✅ FIXED: Safe error display method
    safeDisplayError(error) {
      if (typeof error === 'string') {
        return error;
      }
      
      if (error && typeof error === 'object') {
        // Check for common error properties
        if (error.message && typeof error.message === 'string') {
          return error.message;
        }
        
        if (error.error && typeof error.error === 'string') {
          return error.error;
        }
        
        if (error.details && typeof error.details === 'string') {
          return error.details;
        }
        
        // If it's a response object
        if (error.response && error.response.data) {
          if (typeof error.response.data.message === 'string') {
            return error.response.data.message;
          }
          if (typeof error.response.data.error === 'string') {
            return error.response.data.error;
          }
          if (typeof error.response.data === 'string') {
            return error.response.data;
          }
        }
        
        // Last resort: stringify the object safely
        try {
          return JSON.stringify(error, null, 2);
        } catch (stringifyError) {
          return 'Произошла ошибка при обработке платежа';
        }
      }
      
      // Fallback for any other type
      return error ? String(error) : 'Неизвестная ошибка';
    },
    
    // ✅ FIXED: Debug error information
    debugErrorInfo(error) {
      if (!this.showDebugInfo) return '';
      
      try {
        return JSON.stringify({
          type: typeof error,
          message: error?.message,
          response: error?.response?.data,
          stack: error?.stack?.split('\n').slice(0, 5)
        }, null, 2);
      } catch (e) {
        return 'Debug info not available';
      }
    },
    
    loadPaymentData() {
      const params = new URLSearchParams(window.location.search);
      this.transactionId = params.get('transactionId') || '';
      this.userId = params.get('userId') || '';
      this.amount = parseInt(params.get('amount')) || 0;
      this.plan = params.get('plan') || '';
      this.userName = params.get('userName') || '';
      this.userEmail = params.get('userEmail') || '';
      this.currentPlan = params.get('currentPlan') || 'Free';
      
      // Get preferred language from URL if available
      this.selectedLanguage = params.get('lang') || 'ru';
      this.selectedPlan = this.plan || params.get('selectedPlan') || '';
      
      // Check for provider in URL (this component now handles provider selection)
      const urlProvider = params.get('provider') || this.$route.params.provider;
      if (urlProvider && this.providers[urlProvider]) {
        this.paymentProvider = urlProvider;
      }
    },

    // ✅ FIXED: Validation for required PayMe parameters
    validatePaymentData() {
      const errors = [];

      if (!this.userId) {
        errors.push('User ID is required');
      }

      if (!this.finalPlan && !this.selectedPlan) {
        errors.push('Plan selection is required');
      }

      if (!this.amountInTiyin || this.amountInTiyin <= 0) {
        errors.push('Valid amount is required');
      }

      if (errors.length > 0) {
        console.warn('⚠️ Payment data validation issues:', errors);
        this.error = errors.join(', ');
      }
    },

    // NEW: Error handler
    handlePaymentError(error) {
      console.error('❌ Payment initialization error:', error);
      this.error = this.safeDisplayError(error);
      this.loading = false;
    },

    // NEW: Simplified processPayment method from user snippet
    async processPayment() {
      try {
        this.loading = true;
        this.error = '';

        const provider = this.paymentProvider;
        const planToUse = this.finalPlan;

        if (!this.userId || !planToUse) {
          throw new Error('Missing user ID or plan information');
        }
        
        this.loadingMessage = `Перенаправление на ${this.providers[provider]?.name || 'оплату'}...`;
        
        if (provider === 'payme') {
          // This WILL redirect to PayMe's external page
          // NOTE: This now sends *minimal* data, not the complex form object.
          // This assumes your `initiatePaymePayment` API is updated
          // to handle a simple request and return a redirect URL.
          const result = await initiatePaymePayment(
            this.userId, 
            planToUse, 
            { lang: this.selectedLanguage } // Passing language
          );
          if (result.paymentUrl) {
            window.location.href = result.paymentUrl; // External redirect!
          } else {
            throw new Error(result.error || 'Не удалось получить ссылку на оплату PayMe');
          }
        } else if (provider === 'multicard') {
          // This WILL redirect to Multicard's external page
          const result = await initiateMulticardPayment({
            userId: this.userId,
            plan: planToUse,
            amount: this.amountInTiyin, // Sending amount in tiyin
            lang: this.selectedLanguage
          });
          if (result.data?.checkoutUrl) {
            window.location.href = result.data.checkoutUrl; // External redirect!
          } else {
            throw new Error(result.error || 'Не удалось получить ссылку на оплату Multicard');
          }
        } else {
          throw new Error('Выбранный способ оплаты не поддерживается.');
        }

      } catch (error) {
        this.handlePaymentError(error);
      }
    },

    async retryPayment() {
      this.error = '';
      this.loading = false;
      
      // Re-validate data before retry
      this.validatePaymentData();
      
      if (!this.error) {
        await this.processPayment(); // Changed to call new method
      }
    },

    formatAmount(amount) {
      if (!amount) return '';
      
      // Convert from tiyin to UZS for display
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
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
.payme-checkout {
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
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.payme-logo {
  text-align: center;
  margin-bottom: 30px;
}

.payme-logo .logo {
  width: 60px;
  height: 60px;
  margin-bottom: 10px;
}

.payme-logo h1 {
  color: #4A90E2;
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
}

.loading-state h1 {
  font-size: 2rem;
  color: #333;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4A90E2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

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

/* NEW styles for provider selection */
.provider-selection {
  margin-bottom: 25px;
}
.provider-selection h3 {
  margin-bottom: 15px;
  color: #333;
}
.provider-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.provider-options label {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.provider-options label:hover {
  border-color: #4A90E2;
  background: #f8f9fa;
}
.provider-options label.active {
  border-color: #4A90E2;
  background: #e3f2fd;
}
.provider-options label.disabled {
  border-color: #eee;
  background: #fdfdfd;
  cursor: not-allowed;
  opacity: 0.6;
}
.provider-options label.disabled:hover {
  background: #fdfdfd;
}
.provider-options input[type="radio"] {
  display: none;
}
.provider-options img {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  object-fit: contain;
}
.provider-options span {
  color: #333;
  font-weight: 600;
}


/* PayMe method selection removed */

.plan-selection {
  margin-bottom: 25px;
}

.plan-options {
  display: flex;
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
  border-color: #4A90E2;
}

.plan-option.active {
  border-color: #4A90E2;
  background: #e3f2fd;
}

.plan-option input[type="radio"] {
  display: none;
}

.plan-details {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.plan-price {
  color: #4A90E2;
  font-weight: bold;
  margin-top: 5px;
}

.language-selection {
  margin-bottom: 25px;
}

.language-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.payment-button, .payme-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.payment-button:hover, .payme-btn:hover {
  background: linear-gradient(135deg, #357ABD, #2E6DA4);
  transform: translateY(-2px);
}

.payment-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.error-state {
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.back-btn, .retry-btn {
  padding: 12px 24px;
  margin: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.back-btn {
  background: #f5f5f5;
  color: #333;
}

.retry-btn {
  background: #4A90E2;
  color: white;
}

/* Removed styles for payment-ready-state, transaction-info, payment-content, etc. */

@media (max-width: 768px) {
  .checkout-container {
    padding: 20px;
    margin: 10px;
  }
  
  /* Responsive adjustment for new provider options */
  .provider-options {
    grid-template-columns: 1fr;
  }

  /* method-options removed */
  
  .plan-options {
    flex-direction: column;
  }
  
  .payme-logo h1 {
    font-size: 2rem;
  }
}
</style>
