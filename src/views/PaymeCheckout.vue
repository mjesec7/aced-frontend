<template>
  <div class="payme-checkout">
    <div class="checkout-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="payme-logo">
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>PayMe</h1>
        </div>
        <div class="spinner"></div>
        <h2>{{ loadingMessage }}</h2>
        <p>{{ getStateDescription() }}</p>
        
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
      <div v-else-if="!paymentUrl && !dynamicContent" class="method-selection-state">
        <div class="payme-logo">
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>PayMe Checkout</h1>
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

        <!-- Payment Method Selection -->
        <div class="payment-method-selection">
          <h3>Выберите способ оплаты</h3>
          <div class="method-options">
            <label class="method-option" :class="{ active: selectedMethod === 'post' }">
              <input type="radio" v-model="selectedMethod" value="post" />
              <span class="method-icon">📝</span>
              <div class="method-text">
                <strong>{{ getMethodName('post') }}</strong>
                <small>Автоматическая форма</small>
              </div>
            </label>
            
            <label class="method-option" :class="{ active: selectedMethod === 'get' }">
              <input type="radio" v-model="selectedMethod" value="get" />
              <span class="method-icon">🔗</span>
              <div class="method-text">
                <strong>{{ getMethodName('get') }}</strong>
                <small>Прямая ссылка</small>
              </div>
            </label>
            
            <label class="method-option" :class="{ active: selectedMethod === 'button' }">
              <input type="radio" v-model="selectedMethod" value="button" />
              <span class="method-icon">🔘</span>
              <div class="method-text">
                <strong>{{ getMethodName('button') }}</strong>
                <small>Интерактивная кнопка</small>
              </div>
            </label>
            
            <label class="method-option" :class="{ active: selectedMethod === 'qr' }">
              <input type="radio" v-model="selectedMethod" value="qr" />
              <span class="method-icon">📱</span>
              <div class="method-text">
                <strong>{{ getMethodName('qr') }}</strong>
                <small>Сканировать с телефона</small>
              </div>
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
          @click="initializePayment" 
          :disabled="!selectedPlan && !plan" 
          class="payment-button"
        >
          💳 Перейти к оплате
        </button>
      </div>

      <!-- Success/Payment Ready State -->
      <div v-else class="payment-ready-state">
        <div class="payme-logo">
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>PayMe</h1>
        </div>
        
        <h2>{{ getStateTitle() }}</h2>
        <p>{{ getStateDescription() }}</p>

        <!-- Transaction Info -->
        <div class="transaction-info" v-if="transactionId">
          <h4>Детали транзакции</h4>
          <p><strong>ID:</strong> {{ transactionId }}</p>
          <p><strong>Пользователь:</strong> {{ userName }}</p>
          <p><strong>План:</strong> {{ planName }}</p>
          <p><strong>Сумма:</strong> {{ formatAmount(amount) }}</p>
        </div>

        <!-- Dynamic Content Area -->
        <div class="payment-content">
          <!-- For POST method form -->
          <div v-if="selectedMethod === 'post' && dynamicContent?.formHtml" 
               v-html="dynamicContent.formHtml"
               class="form-content">
          </div>
          
          <!-- For GET method URL -->
          <div v-if="selectedMethod === 'get' && paymentUrl" class="url-content">
            <p>Переход к PayMe...</p>
            <a :href="paymentUrl" target="_blank" class="payment-link">
              Нажмите, если не перенаправились автоматически
            </a>
          </div>
          
          <!-- For Button method -->
          <div v-if="selectedMethod === 'button' && dynamicContent?.buttonHtml"
               v-html="dynamicContent.buttonHtml"
               class="button-content">
          </div>

          <!-- For QR method -->
          <div v-if="selectedMethod === 'qr' && dynamicContent?.qrHtml"
               v-html="dynamicContent.qrHtml"
               class="qr-content">
          </div>

          <!-- Manual redirect button for GET/POST methods -->
          <div v-if="(selectedMethod === 'get' || selectedMethod === 'post') && paymentUrl">
            <button @click="redirectToPayMe" class="payme-btn">
              💳 Перейти к PayMe
            </button>
            
            <div class="redirect-note" v-if="selectedMethod === 'get' || selectedMethod === 'post'">
              <p><small>Автоматическое перенаправление через {{ countdown }} секунд...</small></p>
            </div>
          </div>
        </div>

        <!-- PayMe Info -->
        <div class="payme-info">
          <p>🔒 На сайте PayMe вы сможете:</p>
          <ul>
            <li>Безопасно ввести данные карты Humo или UzCard</li>
            <li>Получить SMS код от вашего банка</li>
            <li>Завершить платеж с полной защитой данных</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ✅ Import from the main API file with safe error handling
import { initiatePaymePayment, generatePaymeForm, safeErrorMessage } from '@/api';

export default {
  name: 'PaymeCheckout',
  data() {
    return {
      loading: false,
      error: '',
      paymentUrl: '',
      dynamicContent: null,
      countdown: 5,
      countdownInterval: null,
      
      // Payment method selection
      selectedMethod: 'post', // 'post', 'get', 'button', 'qr'
      selectedLanguage: 'ru',
      selectedPlan: '',
      loadingMessage: 'Подготовка к оплате...',
      
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
    
    // Don't auto-initialize, let user choose method first unless URL has specific params
    if (this.userId && this.plan && this.$route.query.auto === 'true') {
      await this.initializePayment();
    }
  },
  
  beforeUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
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
      
      // Get preferred method and language from URL if available
      this.selectedMethod = params.get('method') || 'post';
      this.selectedLanguage = params.get('lang') || 'ru';
      this.selectedPlan = this.plan || params.get('selectedPlan') || '';
      
    
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

    // ✅ FIXED: Complete payment initialization with safe error handling
    async initializePayment() {
      try {
        const planToUse = this.finalPlan;
        
        if (!this.userId || !planToUse) {
          throw new Error('Missing user ID or plan information');
        }

        this.loading = true;
        this.error = '';
        this.paymentUrl = '';
        this.dynamicContent = null;

        this.loadingMessage = this.getLoadingMessage();

        // Environment check
        const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
        
        if (!merchantId || merchantId === 'undefined') {
          console.error('❌ VITE_PAYME_MERCHANT_ID not set');
          throw new Error('PayMe configuration error. Check environment variables.');
        }


        // Prepare payment data
        const paymentData = {
          method: this.selectedMethod,
          lang: this.selectedLanguage,
          callback: `${window.location.origin}/payment/success`,
          callback_timeout: 15000,
          Login: this.userId,
          style: 'colored',
          qrWidth: 250
        };


        // Call the payment API
        const result = await initiatePaymePayment(this.userId, planToUse, paymentData);


        if (result && result.success) {
          // Handle different response types
          if (result.paymentUrl) {
            this.paymentUrl = result.paymentUrl;
            
            // Verify URL doesn't contain undefined
            if (this.paymentUrl.includes('undefined')) {
              throw new Error('Generated payment URL contains undefined values');
            }
            
          }
          
          if (result.formHtml) {
            this.dynamicContent = { formHtml: result.formHtml };
          }
          
          if (result.buttonHtml) {
            this.dynamicContent = { buttonHtml: result.buttonHtml };
          }
          
          if (result.qrHtml) {
            this.dynamicContent = { qrHtml: result.qrHtml };
          }
          
          this.transactionId = result.transaction?.id || this.transactionId;
          this.loading = false;

          // Handle auto-redirect for GET method
          if (this.selectedMethod === 'get' && this.paymentUrl) {
            this.startCountdown();
          }
          
        } else {
          // ✅ FIXED: Safe error handling for failed results
          const errorMsg = result?.error || result?.message || 'Failed to initialize payment';
          throw new Error(this.safeDisplayError(errorMsg));
        }

      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        
        // ✅ FIXED: Safe error message assignment - NO MORE [object Object]
        this.error = this.safeDisplayError(error);
        this.loading = false;
      }
    },

    async generateDynamicContent() {
      try {
        if (this.selectedMethod === 'post' || this.selectedMethod === 'button' || this.selectedMethod === 'qr') {
          
          // ✅ FIXED: Pass proper data structure for form generation
          const formData = {
            method: this.selectedMethod,
            lang: this.selectedLanguage,
            style: 'colored',
            qrWidth: 250,
            amount: this.amountInTiyin,
            account: this.accountObject,
            callback: `${window.location.origin}/payment/success`,
            callback_timeout: 15000
          };

          const result = await generatePaymeForm(this.userId, this.finalPlan, formData);
          
          if (result && result.success) {
            this.dynamicContent = result;
            
            // For POST method, auto-submit the form after a delay
            if (this.selectedMethod === 'post' && result.formHtml) {
              setTimeout(() => {
                this.autoSubmitForm();
              }, 2000);
            }
          } else {
            console.warn('⚠️ Dynamic content generation failed:', this.safeDisplayError(result?.error || result));
          }
        }
      } catch (error) {
        console.error('❌ Dynamic content generation error:', error);
        // Don't fail the whole process, just continue with URL redirect
      }
    },

    autoSubmitForm() {
      try {
        const form = document.querySelector('#payme-form') || document.querySelector('form');
        if (form) {
          form.submit();
        } else {
          console.warn('⚠️ Form not found, falling back to URL redirect');
          if (this.paymentUrl) {
            this.redirectToPayMe();
          } else {
            this.error = 'Payment form not generated properly';
          }
        }
      } catch (error) {
        console.error('❌ Auto-submit failed:', error);
        this.error = this.safeDisplayError(error);
      }
    },

    startCountdown() {
      this.countdown = 5;
      this.countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          this.redirectToPayMe();
        }
      }, 1000);
    },

    redirectToPayMe() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      if (this.paymentUrl) {
        
        try {
          // Validate URL format
          new URL(this.paymentUrl);
          window.location.href = this.paymentUrl;
        } catch (urlError) {
          console.error('❌ Invalid payment URL:', this.paymentUrl);
          this.error = 'Invalid payment URL received';
        }
      } else {
        this.error = 'Payment URL not available';
      }
    },

    async retryPayment() {
      this.error = '';
      this.loading = false;
      this.countdown = 5;
      this.paymentUrl = '';
      this.dynamicContent = null;
      
      // Re-validate data before retry
      this.validatePaymentData();
      
      if (!this.error) {
        await this.initializePayment();
      }
    },
    
    getMethodName(method) {
      const names = {
        'post': 'Форма оплаты',
        'get': 'Прямая ссылка',
        'button': 'Кнопка PayMe',
        'qr': 'QR-код'
      };
      return names[method] || method;
    },

    getLoadingMessage() {
      const messages = {
        'post': 'Подготовка формы оплаты...',
        'get': 'Генерация ссылки оплаты...',
        'button': 'Создание кнопки PayMe...',
        'qr': 'Генерация QR-кода...'
      };
      return messages[this.selectedMethod] || 'Подготовка к оплате...';
    },

    getStateTitle() {
      const titles = {
        'post': 'Форма готова',
        'get': 'Переход к оплате',
        'button': 'Кнопка PayMe',
        'qr': 'QR-код для оплаты'
      };
      return titles[this.selectedMethod] || 'Переход к оплате';
    },

    getStateDescription() {
      const descriptions = {
        'post': 'Форма будет автоматически отправлена на сайт PayMe',
        'get': 'Вы будете перенаправлены на официальную страницу PayMe',
        'button': 'Нажмите на кнопку PayMe для продолжения',
        'qr': 'Отсканируйте QR-код с помощью приложения PayMe'
      };
      return descriptions[this.selectedMethod] || 'Переход к PayMe';
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

.payment-method-selection {
  margin-bottom: 25px;
}

.payment-method-selection h3 {
  margin-bottom: 15px;
  color: #333;
}

.method-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.method-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.method-option:hover {
  border-color: #4A90E2;
  background: #f8f9fa;
}

.method-option.active {
  border-color: #4A90E2;
  background: #e3f2fd;
}

.method-option input[type="radio"] {
  display: none;
}

.method-icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.method-text {
  display: flex;
  flex-direction: column;
}

.method-text strong {
  color: #333;
  margin-bottom: 4px;
}

.method-text small {
  color: #666;
  font-size: 0.85rem;
}

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

.transaction-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.payment-content {
  margin: 20px 0;
}

.redirect-note {
  text-align: center;
  margin-top: 15px;
  color: #666;
}

.payme-info {
  background: #e8f5e8;
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
}

.payme-info ul {
  margin: 10px 0 0 20px;
  color: #2e7d32;
}

.payme-info li {
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .checkout-container {
    padding: 20px;
    margin: 10px;
  }
  
  .method-options {
    grid-template-columns: 1fr;
  }
  
  .plan-options {
    flex-direction: column;
  }
  
  .payme-logo h1 {
    font-size: 2rem;
  }
}
</style>