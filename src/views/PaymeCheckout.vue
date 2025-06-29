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
        <h2>Подготовка к оплате...</h2>
        <p>Перенаправляем вас в PayMe для безопасной оплаты</p>
        
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

      <!-- Success/Redirect State -->
      <div v-else class="redirect-state">
        <div class="payme-logo">
          <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
          <h1>PayMe</h1>
        </div>
        
        <h2>Переход к оплате</h2>
        <p>Вы будете перенаправлены на официальную страницу PayMe</p>
        
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
            <div class="user-row upgrade-row">
              <span class="label">Переход на план:</span>
              <span class="value new-plan">{{ planName }}</span>
            </div>
            <div class="user-row">
              <span class="label">Сумма к оплате:</span>
              <span class="value amount">{{ formatAmount(amount) }}</span>
            </div>
            <div class="user-row">
              <span class="label">ID транзакции:</span>
              <span class="value transaction-id">{{ transactionId }}</span>
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

        <button @click="redirectToPayMe" class="payme-btn">
          💳 Перейти к PayMe
        </button>
        
        <div class="redirect-note">
          <p><small>Автоматическое перенаправление через {{ countdown }} секунд...</small></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ✅ FIXED: Import from the main API file which now has the correct payment functions
import { initiatePaymePayment } from '@/api';

export default {
  name: 'PaymeCheckout',
  data() {
    return {
      loading: true,
      error: '',
      paymentUrl: '',
      countdown: 5,
      countdownInterval: null,
      
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
      return this.plan === 'start' ? 'Start Plan' : 'Pro Plan';
    }
  },
  async mounted() {
    this.loadPaymentData();
    await this.initializePayment();
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
      
      console.log('💳 Payment data loaded:', {
        transactionId: this.transactionId,
        userId: this.userId,
        amount: this.amount,
        plan: this.plan,
        userName: this.userName
      });
    },

    async initializePayment() {
      try {
        if (!this.userId || !this.plan) {
          throw new Error('Missing user ID or plan information');
        }

        console.log('🚀 Initializing PayMe payment redirect');

        // Call backend to get PayMe redirect URL
        const result = await initiatePaymePayment(this.userId, this.plan, {
          name: this.userName,
          email: this.userEmail
        });

        if (result.success) {
          this.paymentUrl = result.paymentUrl;
          this.transactionId = result.transaction?.id || this.transactionId;
          this.loading = false;

          // Start countdown for auto-redirect
          this.startCountdown();
        } else {
          throw new Error(result.error || 'Failed to initialize payment');
        }

      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        this.error = error.message || 'Failed to initialize payment';
        this.loading = false;
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
      this.loading = true;
      this.countdown = 5;
      await this.initializePayment();
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
  max-width: 600px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.loading-state, .error-state, .redirect-state {
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

.transaction-id {
  font-family: 'Courier New', monospace;
  background: #fef3c7;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #92400e;
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

.payme-btn, .back-btn, .retry-btn {
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 8px;
}

.payme-btn {
  background: linear-gradient(135deg, #1e40af, #1e3a8a);
  color: white;
}

.payme-btn:hover {
  background: linear-gradient(135deg, #1e3a8a, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
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

  .user-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .user-row .value {
    text-align: left;
  }

  .payme-btn, .back-btn, .retry-btn {
    margin: 8px 0;
    width: 100%;
  }
}
</style>