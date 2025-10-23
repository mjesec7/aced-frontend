<template>
  <div class="universal-checkout">
    <div class="checkout-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="checkout-logo">
          <div class="logo-icon">💳</div>
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
        <div class="checkout-logo">
          <div class="logo-icon">💳</div>
          <h1>Оформление платежа</h1>
          <p class="subtitle">Безопасная оплата подписки ACED</p>
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

        <!-- Payment Provider Selection -->
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

        <!-- Plan Selection (if not provided in URL) -->
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

        <!-- Language Selection -->
        <div class="language-selection">
          <h3>🌐 Язык интерфейса</h3>
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
          <span v-if="providers[paymentProvider]?.enabled">
            💳 Оплатить через {{ providers[paymentProvider]?.name }}
          </span>
          <span v-else>
            Выберите доступный способ оплаты
          </span>
        </button>

        <!-- Security Notice -->
        <div class="security-notice">
          <span class="security-icon">🔒</span>
          <p>Ваши платежные данные защищены и передаются по безопасному протоколу</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { 
  initiatePaymePayment, 
  initiateMulticardPayment 
} from '@/api';

export default {
  name: 'UniversalCheckout',
  data() {
    return {
      loading: false,
      error: '',
      
      // Payment method selection
      selectedLanguage: 'ru',
      selectedPlan: '',
      loadingMessage: 'Подготовка к оплате...',

      // Provider selection with emoji icons
      paymentProvider: 'multicard', // Default to Multicard based on your env
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
    finalPlan() {
      return this.plan || this.selectedPlan || 'start';
    },
    
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
    
    // Auto-initiation logic
    if (this.userId && this.plan && this.$route.query.auto === 'true') {
      const urlProvider = new URLSearchParams(window.location.search).get('provider');
      if (urlProvider && this.providers[urlProvider]?.enabled) {
        this.paymentProvider = urlProvider;
      }
      await this.processPayment();
    }
  },
  
  methods: {
    safeDisplayError(error) {
      if (typeof error === 'string') {
        return error;
      }
      
      if (error && typeof error === 'object') {
        if (error.message && typeof error.message === 'string') {
          return error.message;
        }
        
        if (error.error && typeof error.error === 'string') {
          return error.error;
        }
        
        if (error.details && typeof error.details === 'string') {
          return error.details;
        }
        
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
        
        try {
          return JSON.stringify(error, null, 2);
        } catch (stringifyError) {
          return 'Произошла ошибка при обработке платежа';
        }
      }
      
      return error ? String(error) : 'Неизвестная ошибка';
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
      
      this.selectedLanguage = params.get('lang') || 'ru';
      this.selectedPlan = this.plan || params.get('selectedPlan') || '';
      
      const urlProvider = params.get('provider') || this.$route.params.provider;
      if (urlProvider && this.providers[urlProvider]) {
        this.paymentProvider = urlProvider;
      }
    },

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

    handlePaymentError(error) {
      console.error('❌ Payment initialization error:', error);
      this.error = this.safeDisplayError(error);
      this.loading = false;
    },

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
          const result = await initiatePaymePayment(
            this.userId, 
            planToUse, 
            { lang: this.selectedLanguage }
          );
          if (result.paymentUrl) {
            window.location.href = result.paymentUrl;
          } else {
            throw new Error(result.error || 'Не удалось получить ссылку на оплату PayMe');
          }
        } else if (provider === 'multicard') {
          const result = await initiateMulticardPayment({
            userId: this.userId,
            plan: planToUse,
            amount: this.amountInTiyin,
            lang: this.selectedLanguage
          });
          if (result.data?.checkoutUrl) {
            window.location.href = result.data.checkoutUrl;
          } else {
            throw new Error(result.error || 'Не удалось получить ссылку на оплату Multicard');
          }
        } else {
          throw new Error('Выбранный способ оплаты временно недоступен');
        }

      } catch (error) {
        this.handlePaymentError(error);
      }
    },

    async retryPayment() {
      this.error = '';
      this.loading = false;
      
      this.validatePaymentData();
      
      if (!this.error) {
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
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
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

.loading-state h1 {
  font-size: 2rem;
  color: #333;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
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

/* Provider Selection Styles */
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

.provider-options label.disabled:hover {
  background: #fafafa;
  transform: none;
  box-shadow: none;
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
}

.payment-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5568d3, #6a3f91);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.payment-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}

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

.error-state p {
  color: #666;
  margin-bottom: 25px;
}

.back-btn, .retry-btn {
  padding: 12px 24px;
  margin: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
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
}
</style>