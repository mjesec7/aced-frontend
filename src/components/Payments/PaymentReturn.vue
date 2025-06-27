<template>
    <div class="payment-return">
      <div class="return-container">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <h2>Проверка платежа...</h2>
          <p>Пожалуйста, подождите</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h2>Ошибка проверки платежа</h2>
          <p>{{ error }}</p>
          <div class="actions">
            <button @click="retry" class="retry-btn">Попробовать снова</button>
            <button @click="goHome" class="home-btn">На главную</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { checkPaymentStatus } from '@/api';
  
  export default {
    name: 'PaymentReturn',
    data() {
      return {
        loading: true,
        error: null,
        transactionId: null,
        userId: null
      };
    },
    
    async mounted() {
      await this.processReturn();
    },
    
    methods: {
      async processReturn() {
        try {
          // Get params from URL
          const params = new URLSearchParams(window.location.search);
          this.transactionId = params.get('id') || params.get('transaction');
          this.userId = params.get('userId') || this.$store.getters['user/getUserId'];
          
          if (!this.transactionId) {
            this.error = 'ID транзакции не найден';
            this.loading = false;
            return;
          }
          
          // Check payment status
          const result = await checkPaymentStatus(this.transactionId, this.userId);
          
          if (result.success && result.transaction) {
            if (result.transaction.state === 2) {
              // Success
              this.$router.replace({
                name: 'PaymentSuccess',
                query: {
                  transaction: this.transactionId,
                  plan: result.transaction.plan,
                  amount: result.transaction.amount
                }
              });
            } else if (result.transaction.state < 0) {
              // Failed
              this.$router.replace({
                name: 'PaymentFailed',
                query: {
                  transaction: this.transactionId,
                  error: 'cancelled'
                }
              });
            } else {
              // Still pending
              this.error = 'Платеж еще не завершен';
              this.loading = false;
            }
          } else {
            this.error = result.error || 'Не удалось проверить статус';
            this.loading = false;
          }
          
        } catch (error) {
          console.error('Error:', error);
          this.error = 'Ошибка проверки статуса';
          this.loading = false;
        }
      },
      
      retry() {
        this.loading = true;
        this.error = null;
        this.processReturn();
      },
      
      goHome() {
        this.$router.push({ name: 'HomePage' });
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
  
  .loading-state, .error-state {
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
  }
  
  .actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .retry-btn, .home-btn {
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
    
    .retry-btn, .home-btn {
      width: 100%;
    }
  }
  </style>