<template>
  <div class="payment-return">
    <div class="return-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Проверка платежа...</h2>
        <p>Пожалуйста, подождите</p>
        <div v-if="transactionId" class="transaction-info">
          <p><small>ID транзакции: {{ transactionId }}</small></p>
        </div>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Ошибка проверки платежа</h2>
        <p>{{ error }}</p>
        <div v-if="transactionId" class="transaction-details">
          <p><strong>ID транзакции:</strong> {{ transactionId }}</p>
        </div>
        <div class="actions">
          <button @click="retry" class="retry-btn">Попробовать снова</button>
          <button @click="goHome" class="home-btn">На главную</button>
          <button @click="contactSupport" class="support-btn">Поддержка</button>
        </div>
      </div>

      <div v-else-if="pending" class="pending-state">
        <div class="pending-icon">⏳</div>
        <h2>Платеж в обработке</h2>
        <p>Ваш платеж еще обрабатывается. Это может занять несколько минут.</p>
        <div v-if="transactionId" class="transaction-details">
          <p><strong>ID транзакции:</strong> {{ transactionId }}</p>
        </div>
        <div class="actions">
          <button @click="retry" class="retry-btn">Проверить снова</button>
          <button @click="goHome" class="home-btn">На главную</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ✅ FIXED: Import from the main API file (not from paymentApi or payments.js)
import { checkPaymentStatus } from '@/api';

export default {
  name: 'PaymentReturn',
  data() {
    return {
      loading: true,
      error: null,
      pending: false,
      transactionId: null,
      userId: null,
      retryCount: 0,
      maxRetries: 3
    };
  },
  
  async mounted() {
    await this.processReturn();
  },
  
  methods: {
    async processReturn() {
      try {
        this.loading = true;
        this.error = null;
        this.pending = false;

        // Get params from URL and various sources
        const params = new URLSearchParams(window.location.search);
        
        this.transactionId = 
          params.get('id') || 
          params.get('transaction') ||
          params.get('orderId') ||
          this.$route.query.transaction ||
          this.$route.query.id;
          
        this.userId = 
          params.get('userId') || 
          this.$route.query.userId ||
          this.$store.getters['user/getUserId'] ||
          localStorage.getItem('userId');
        
        
        
        if (!this.transactionId) {
          this.error = 'ID транзакции не найден в URL параметрах';
          this.loading = false;
          return;
        }
        
        // Check payment status using the corrected API function
        const result = await checkPaymentStatus(this.transactionId, this.userId);
        
        
        if (result.success && result.transaction) {
          const state = result.transaction.state;
          
          if (state === 2) {
            // Success - redirect to success page
            this.$router.replace({
              name: 'PaymentSuccess', // Make sure this route exists
              query: {
                transaction: this.transactionId,
                plan: result.transaction.subscription_plan || result.transaction.plan,
                amount: result.transaction.amount,
                userId: this.userId
              }
            });
          } else if (state === -1 || state === -2) {
            // Failed/Cancelled - redirect to failed page
            this.$router.replace({
              name: 'PaymentFailed', // Make sure this route exists
              query: {
                transaction: this.transactionId,
                error: state === -1 ? 'cancelled' : 'refunded',
                userId: this.userId
              }
            });
          } else if (state === 1) {
            // Still pending
            this.pending = true;
            this.loading = false;
          } else {
            // Unknown state
            this.error = `Неизвестное состояние транзакции: ${state}`;
            this.loading = false;
          }
        } else {
          this.error = result.error || 'Не удалось проверить статус платежа';
          this.loading = false;
        }
        
      } catch (error) {
        console.error('❌ Payment return processing error:', error);
        this.error = `Ошибка проверки статуса: ${error.message}`;
        this.loading = false;
      }
    },
    
    async retry() {
      if (this.retryCount >= this.maxRetries) {
        this.error = 'Превышено максимальное количество попыток. Обратитесь в поддержку.';
        return;
      }
      
      this.retryCount++;
      
      // Add a small delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.processReturn();
    },
    
    goHome() {
      // Navigate to appropriate home page
      const homePage = this.$route.query.returnTo || 'HomePage' || 'MainPage';
      this.$router.push({ name: homePage });
    },

    contactSupport() {
      // Open support contact
      const supportUrl = 'https://t.me/aced_support'; // Replace with your support URL
      window.open(supportUrl, '_blank');
    }
  }
};
</script>

<style scoped>
.payment-return {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.return-container {
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.loading-state, .error-state, .pending-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e5e7eb;
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 4rem;
}

.pending-icon {
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
  margin: 0;
  line-height: 1.6;
}

.transaction-info,
.transaction-details {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  margin: 10px 0;
}

.transaction-details p {
  color: #374151;
  font-weight: 600;
  margin: 0;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.retry-btn, .home-btn, .support-btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.retry-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.retry-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.home-btn {
  background: #f3f4f6;
  color: #374151;
}

.home-btn:hover {
  background: #e5e7eb;
}

.support-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.support-btn:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.pending-state {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 30px;
  border-radius: 16px;
  border: 2px solid #f59e0b;
}

.pending-state h2 {
  color: #92400e;
}

.pending-state p {
  color: #78350f;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .return-container {
    padding: 40px 24px;
  }
  
  .actions {
    flex-direction: column;
    width: 100%;
  }
  
  .retry-btn, .home-btn, .support-btn {
    width: 100%;
  }
}
</style>