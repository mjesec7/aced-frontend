<!-- src/components/Payments/PaymentFailed.vue -->
<template>
    <div class="payment-failed">
      <div class="failed-container">
        <div class="failed-icon">❌</div>
        <h1>Оплата не прошла</h1>
        <p class="failed-message">
          {{ errorMessage || 'Возникла проблема при обработке платежа. Попробуйте еще раз.' }}
        </p>
  
        <div class="transaction-details" v-if="transactionId">
          <h3>Информация о транзакции</h3>
          <div class="detail-row">
            <span>ID транзакции:</span>
            <code>{{ transactionId }}</code>
          </div>
          <div class="detail-row" v-if="error">
            <span>Ошибка:</span>
            <span class="error-text">{{ error }}</span>
          </div>
          <div class="detail-row">
            <span>Время:</span>
            <span>{{ formatDate(new Date()) }}</span>
          </div>
        </div>
  
        <div class="common-issues">
          <h3>🔍 Возможные причины:</h3>
          <ul>
            <li>Недостаточно средств на карте</li>
            <li>Карта заблокирована банком</li>
            <li>Превышен лимит по карте</li>
            <li>Проблемы с интернет-соединением</li>
            <li>Неверно введены данные карты</li>
          </ul>
        </div>
  
        <div class="actions">
          <button @click="tryAgain" class="primary-btn">
            🔄 Попробовать снова
          </button>
          <button @click="goToSettings" class="secondary-btn">
            ⚙️ Выбрать другой тариф
          </button>
          <button @click="goHome" class="tertiary-btn">
            🏠 На главную
          </button>
        </div>
  
        <div class="help-section">
          <h3>💬 Нужна помощь?</h3>
          <p>Если проблема повторяется, свяжитесь с нашей поддержкой:</p>
          <div class="contact-info">
            <a href="mailto:support@aced.live" class="contact-link">
              📧 support@aced.live
            </a>
            <a href="https://t.me/aced_live" target="_blank" class="contact-link">
              💬 @aced_live в Telegram
            </a>
          </div>
        </div>
  
        <div class="alternative-methods">
          <h3>🏦 Альтернативные способы оплаты</h3>
          <p>Вы можете оплатить подписку другими способами:</p>
          <ul>
            <li>Банковский перевод</li>
            <li>Оплата через терминал</li>
            <li>Оплата в офисе</li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PaymentFailed',
    props: {
      transactionData: {
        type: Object,
        default: () => ({})
      },
      errorData: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        transactionId: '',
        error: '',
        source: ''
      };
    },
    computed: {
      errorMessage() {
        // Customize error message based on the error type
        if (this.error?.toLowerCase().includes('insufficient')) {
          return 'Недостаточно средств на карте. Пополните баланс и попробуйте снова.';
        } else if (this.error?.toLowerCase().includes('blocked')) {
          return 'Карта заблокирована. Обратитесь в ваш банк для разблокировки.';
        } else if (this.error?.toLowerCase().includes('expired')) {
          return 'Время сессии истекло. Попробуйте начать оплату заново.';
        } else if (this.error?.toLowerCase().includes('cancelled')) {
          return 'Оплата была отменена пользователем.';
        } else if (this.error) {
          return this.error;
        }
        return null;
      }
    },
    mounted() {
      this.loadPaymentData();
    },
    methods: {
      loadPaymentData() {
        // Load from props first
        if (this.transactionData?.id) {
          this.transactionId = this.transactionData.id;
        }
        
        if (this.errorData?.message) {
          this.error = this.errorData.message;
        }
        
        if (this.errorData?.source) {
          this.source = this.errorData.source;
        }
        
        // Fallback to URL params if no props provided
        if (!this.transactionId || !this.error) {
          const params = new URLSearchParams(window.location.search);
          this.transactionId = this.transactionId || params.get('transaction') || '';
          this.error = this.error || params.get('error') || '';
          this.source = this.source || params.get('source') || '';
        }
        
      
      },
  
      formatDate(date) {
        return new Intl.DateTimeFormat('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      },
  
      tryAgain() {
        // Go back to payment page
        this.$router.push({ name: 'SettingsPage' });
      },
  
      goToSettings() {
        this.$router.push({ name: 'SettingsPage' });
      },
  
      goHome() {
        this.$router.push({ name: 'HomePage' });
      }
    }
  };
  </script>
  
  <style scoped>
  .payment-failed {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    padding: 20px;
  }
  
  .failed-container {
    background: white;
    padding: 60px 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .failed-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    animation: shake 0.6s ease-in-out;
  }
  
  h1 {
    color: #1f2937;
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 16px;
  }
  
  .failed-message {
    color: #6b7280;
    font-size: 1.1rem;
    margin-bottom: 30px;
    line-height: 1.6;
  }
  
  .transaction-details {
    background: #fef2f2;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 30px;
    text-align: left;
    border: 2px solid #fecaca;
  }
  
  .transaction-details h3 {
    color: #991b1b;
    margin-bottom: 16px;
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #fecaca;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-row code {
    background: #fee2e2;
    padding: 4px 8px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #991b1b;
  }
  
  .error-text {
    color: #dc2626;
    font-weight: 600;
    text-align: right;
    max-width: 60%;
    word-break: break-word;
  }
  
  .common-issues {
    background: #fffbeb;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 30px;
    text-align: left;
    border: 2px solid #fed7aa;
  }
  
  .common-issues h3 {
    color: #92400e;
    margin-bottom: 16px;
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
  }
  
  .common-issues ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .common-issues li {
    padding: 6px 0;
    color: #b45309;
    font-weight: 500;
    position: relative;
    padding-left: 20px;
  }
  
  .common-issues li::before {
    content: '•';
    color: #f59e0b;
    position: absolute;
    left: 0;
    font-weight: bold;
  }
  
  .actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }
  
  .primary-btn, .secondary-btn, .tertiary-btn {
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    flex: 1;
    min-width: 140px;
  }
  
  .primary-btn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }
  
  .primary-btn:hover {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }
  
  .secondary-btn {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }
  
  .secondary-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  
  .tertiary-btn {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .tertiary-btn:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }
  
  .help-section {
    background: #f8fafc;
    padding: 24px;
    border-radius: 16px;
    margin-bottom: 30px;
    text-align: center;
  }
  
  .help-section h3 {
    color: #374151;
    margin-bottom: 12px;
    font-size: 1.1rem;
    font-weight: 700;
  }
  
  .help-section p {
    color: #6b7280;
    margin-bottom: 16px;
    font-size: 0.95rem;
  }
  
  .contact-info {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .contact-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    color: #374151;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    border: 2px solid #e5e7eb;
    transition: all 0.2s ease;
  }
  
  .contact-link:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    color: #1d4ed8;
    transform: translateY(-1px);
  }
  
  .alternative-methods {
    background: #ecfdf5;
    padding: 24px;
    border-radius: 16px;
    text-align: left;
    border: 2px solid #bbf7d0;
  }
  
  .alternative-methods h3 {
    color: #065f46;
    margin-bottom: 12px;
    font-size: 1.1rem;
    font-weight: 700;
    text-align: center;
  }
  
  .alternative-methods p {
    color: #047857;
    margin-bottom: 16px;
    text-align: center;
  }
  
  .alternative-methods ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .alternative-methods li {
    padding: 8px 0;
    color: #047857;
    font-weight: 500;
    position: relative;
    padding-left: 24px;
  }
  
  .alternative-methods li::before {
    content: '💳';
    position: absolute;
    left: 0;
    font-size: 1.1rem;
  }
  
  /* Animations */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .failed-container {
      padding: 40px 24px;
      margin: 20px;
    }
    
    .actions {
      flex-direction: column;
    }
    
    .primary-btn, .secondary-btn, .tertiary-btn {
      flex: none;
      width: 100%;
    }
    
    h1 {
      font-size: 1.8rem;
    }
    
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      text-align: left;
    }
    
    .error-text {
      max-width: 100%;
      text-align: left;
    }
    
    .contact-info {
      flex-direction: column;
      align-items: center;
    }
    
    .contact-link {
      width: 100%;
      justify-content: center;
    }
  }
  </style>