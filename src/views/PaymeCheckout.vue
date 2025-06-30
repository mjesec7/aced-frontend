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
// ✅ Import from the main API file
import { initiatePaymePayment, generatePaymentForm } from '@/api';

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
      currentPlan: ''
    };
  },
  computed: {
    planName() {
      const currentPlan = this.plan || this.selectedPlan;
      return currentPlan === 'start' ? 'Start Plan' : currentPlan === 'pro' ? 'Pro Plan' : '';
    },
    
    finalPlan() {
      return this.plan || this.selectedPlan;
    }
  },
  async mounted() {
    this.loadPaymentData();
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
      
      console.log('💳 Payment data loaded:', {
        transactionId: this.transactionId,
        userId: this.userId,
        amount: this.amount,
        plan: this.plan,
        userName: this.userName,
        method: this.selectedMethod,
        language: this.selectedLanguage
      });
    },

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

        console.log('🚀 Initializing PayMe payment with method:', this.selectedMethod);
        this.loadingMessage = this.getLoadingMessage();

        // Call backend to get PayMe redirect URL or content
        const result = await initiatePaymePayment(this.userId, planToUse, {
          name: this.userName,
          email: this.userEmail,
          method: this.selectedMethod,
          lang: this.selectedLanguage
        });

        if (result.success) {
          this.paymentUrl = result.paymentUrl;
          this.transactionId = result.transaction?.id || this.transactionId;
          
          // For button and QR methods, get additional content
          if (this.selectedMethod === 'button' || this.selectedMethod === 'qr' || this.selectedMethod === 'post') {
            await this.generateDynamicContent();
          }
          
          this.loading = false;

          // Start countdown for auto-redirect (only for POST and GET methods)
          if (this.selectedMethod === 'post' || this.selectedMethod === 'get') {
            this.startCountdown();
          }
        } else {
          throw new Error(result.error || 'Failed to initialize payment');
        }

      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        this.error = error.message || 'Failed to initialize payment';
        this.loading = false;
      }
    },

    async generateDynamicContent() {
      try {
        if (this.selectedMethod === 'post' || this.selectedMethod === 'button' || this.selectedMethod === 'qr') {
          console.log('🎨 Generating dynamic content for method:', this.selectedMethod);
          
          const result = await generatePaymentForm(this.userId, this.finalPlan, {
            method: this.selectedMethod,
            lang: this.selectedLanguage,
            style: 'colored', // for buttons
            qrWidth: 250 // for QR codes
          });
          
          if (result.success) {
            this.dynamicContent = result;
            
            // For POST method, auto-submit the form after a delay
            if (this.selectedMethod === 'post' && result.formHtml) {
              setTimeout(() => {
                this.autoSubmitForm();
              }, 2000);
            }
          } else {
            console.warn('⚠️ Dynamic content generation failed:', result.error);
          }
        }
      } catch (error) {
        console.error('❌ Dynamic content generation error:', error);
        // Don't fail the whole process, just continue with URL redirect
      }
    },

    autoSubmitForm() {
      try {
        const form = document.querySelector('#payme-form');
        if (form) {
          console.log('📝 Auto-submitting PayMe form');
          form.submit();
        }
      } catch (error) {
        console.error('❌ Auto-submit failed:', error);
        // Fallback to URL redirect
        this.redirectToPayMe();
      }
    },

    startCountdown() {
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
        console.log('🔗 Redirecting to PayMe:', this.paymentUrl);
        window.location.href = this.paymentUrl;
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
      // Reset to method selection
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
      
      // Convert from tiyin to UZS if needed
      const uzs = amount > 10000 ? amount / 100 : amount;
      
      return new Intl.NumberFormat('uz-UZ', {
        style: 'currency',
        currency: 'UZS',
        minimumFractionDigits: 0
      }).format(uzs);
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
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
}

.checkout-container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 700px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.loading-state, .error-state, .method-selection-state, .payment-ready-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.payme-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.logo {
  width: 50px;
  height: 50px;
}

.payme-logo h1 {
  color: #1e40af;
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 4rem;
}

h2 {
  color: #1f2937;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

h3 {
  color: #374151;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 20px 0 10px 0;
}

p {
  color: #6b7280;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
}

/* User Information Section */
.user-info-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 24px;
  border-radius: 16px;
  margin: 25px 0;
  border: 2px solid #0ea5e9;
  text-align: left;
  width: 100%;
}

.user-info-section h3 {
  color: #0c4a6e;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  text-align: center;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.9rem;
}

.user-row .label {
  font-weight: 600;
  color: #1e40af;
  min-width: 140px;
}

.user-row .value {
  color: #1f2937;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

.user-id {
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.current-plan {
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 4px;
  color: #991b1b;
  font-weight: 600;
}

.new-plan {
  background: #d1fae5;
  padding: 4px 8px;
  border-radius: 4px;
  color: #065f46;
  font-weight: 600;
}

.amount {
  background: #dbeafe;
  padding: 4px 8px;
  border-radius: 4px;
  color: #1e40af;
  font-weight: 700;
  font-size: 1rem;
}

.upgrade-row {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #10b981;
}

.upgrade-row .label {
  color: #065f46;
}

/* Payment Method Selection */
.payment-method-selection {
  width: 100%;
  margin: 20px 0;
}

.method-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 15px 0;
}

.method-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.method-option:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.method-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.method-option input[type="radio"] {
  margin: 0;
}

.method-icon {
  font-size: 1.5rem;
}

.method-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.method-text strong {
  color: #1f2937;
  font-size: 0.9rem;
}

.method-text small {
  color: #6b7280;
  font-size: 0.8rem;
}

/* Plan Selection */
.plan-selection {
  width: 100%;
  margin: 20px 0;
}

.plan-options {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.plan-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
  min-width: 200px;
}

.plan-option:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.plan-option.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.plan-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.plan-details strong {
  color: #1f2937;
  font-size: 1rem;
}

.plan-price {
  color: #059669;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Language Selection */
.language-selection {
  width: 100%;
  margin: 20px 0;
}

.language-select {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 200px;
}

.language-select:focus {
  outline: none;
  border-color: #667eea;
}

/* Payment Content */
.payment-content {
  width: 100%;
  margin: 20px 0;
}

.form-content, .button-content, .qr-content {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.url-content {
  text-align: center;
  margin: 20px 0;
}

.payment-link {
  display: inline-block;
  margin-top: 10px;
  color: #1e40af;
  text-decoration: none;
  font-weight: 600;
}

.payment-link:hover {
  text-decoration: underline;
}

/* Transaction Info */
.transaction-info {
  background: #fef3c7;
  padding: 16px;
  border-radius: 12px;
  margin: 20px 0;
  text-align: left;
}

.transaction-info h4 {
  color: #92400e;
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.transaction-info p {
  color: #78350f;
  margin: 4px 0;
  font-size: 0.9rem;
}

/* PayMe Info */
.payme-info {
  background: #f0f9ff;
  padding: 20px;
  border-radius: 12px;
  text-align: left;
  margin: 20px 0;
}

.payme-info p {
  color: #0c4a6e;
  font-weight: 600;
  margin-bottom: 12px;
}

.payme-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.payme-info li {
  color: #075985;
  padding: 4px 0;
  position: relative;
  padding-left: 20px;
}

.payme-info li::before {
  content: '✓';
  color: #0ea5e9;
  font-weight: bold;
  position: absolute;
  left: 0;
}

/* Buttons */
.payment-button, .payme-btn, .back-btn, .retry-btn {
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 8px;
}

.payment-button, .payme-btn {
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: white;
}

.payment-button:hover, .payme-btn:hover {
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
}

.payment-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.retry-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.retry-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
}

.back-btn {
  background: #f3f4f6;
  color: #374151;
}

.back-btn:hover {
  background: #e5e7eb;
}

.redirect-note {
  margin-top: 20px;
  color: #6b7280;
}

.user-info-loading {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 12px;
  color: #374151;
}

.user-info-loading p {
  margin: 8px 0;
  color: #4b5563;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .checkout-container {
    padding: 24px;
    margin: 10px;
  }
  
  .payme-logo h1 {
    font-size: 2rem;
  }

  .method-options {
    grid-template-columns: 1fr;
  }

  .plan-options {
    flex-direction: column;
    align-items: center;
  }

  .plan-option {
    min-width: auto;
    width: 100%;
  }

  .user-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .user-row .value {
    text-align: left;
  }

  .payment-button, .payme-btn, .back-btn, .retry-btn {
    margin: 8px 0;
    width: 100%;
  }

  .language-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .checkout-container {
    padding: 16px;
  }

  .method-option {
    padding: 12px;
  }

  .method-text {
    align-items: center;
  }

  h2 {
    font-size: 1.5rem;
  }

  .payment-button, .payme-btn {
    font-size: 1rem;
    padding: 14px 24px;
  }
}