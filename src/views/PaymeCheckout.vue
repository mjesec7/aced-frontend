<template>
    <div class="payme-checkout">
      <div class="checkout-container">
        <!-- PayMe Logo and Header -->
        <div class="payme-header">
          <div class="payme-logo">
            <img src="../assets/icons/payme_white.png" alt="PayMe" class="logo" />
            <h1>PayMe</h1>
          </div>
          <p class="secure-text">🔒 Secure Payment</p>
        </div>
  
        <!-- Payment Details -->
        <div class="payment-details">
          <h2>Оплата подписки ACED</h2>
          <div class="amount">{{ formatAmount(amount) }}</div>
          <div class="plan-info">{{ planName }} Plan</div>
        </div>
  
        <!-- Card Form -->
        <form @submit.prevent="processPayment" class="card-form">
          <div class="form-group">
            <label>Номер карты</label>
            <input
              v-model="cardNumber"
              type="text"
              placeholder="8600 1234 5678 9012"
              maxlength="19"
              @input="formatCardNumber"
              :disabled="processing"
              required
            />
            <div class="card-type" v-if="cardType">
              <img :src="getCardTypeIcon()" :alt="cardType" class="card-icon" />
              <span>{{ cardType }}</span>
            </div>
          </div>
  
          <div class="form-row">
            <div class="form-group">
              <label>MM/YY</label>
              <input
                v-model="expiryDate"
                type="text"
                placeholder="12/25"
                maxlength="5"
                @input="formatExpiryDate"
                :disabled="processing"
                required
              />
            </div>
          </div>
  
          <div class="form-group">
            <label>Имя держателя карты</label>
            <input
              v-model="cardHolder"
              type="text"
              placeholder="JOHN SMITH"
              :disabled="processing"
              required
            />
          </div>
  
          <!-- SMS Code for verification -->
          <div v-if="showSmsCode" class="form-group">
            <label>SMS код подтверждения</label>
            <input
              v-model="smsCode"
              type="text"
              placeholder="123456"
              maxlength="6"
              :disabled="processing"
              required
            />
            <p class="sms-note">Код отправлен на номер {{ maskedPhoneNumber }}</p>
          </div>
  
          <!-- Submit Button -->
          <button 
            type="submit" 
            class="pay-button"
            :disabled="processing || !isFormValid"
          >
            <span v-if="processing" class="loading">
              <div class="spinner"></div>
              {{ processingText }}
            </span>
            <span v-else>
              💳 Оплатить {{ formatAmount(amount) }}
            </span>
          </button>
        </form>
  
        <!-- Supported Cards Info -->
        <div class="supported-cards">
          <h4>💳 Поддерживаемые карты:</h4>
          <div class="card-types">
            <div class="card-type-item">
              <img src="../assets/icons/humo.png" alt="Humo" class="card-logo" />
              <span>Humo</span>
            </div>
            <div class="card-type-item">
              <img src="../assets/icons/uzcard.png" alt="UzCard" class="card-logo" />
              <span>UzCard</span>
            </div>
          </div>
        </div>
  
        <!-- Security Info -->
        <div class="security-info">
          <p>🔒 Ваши данные защищены SSL шифрованием</p>
          <p>💳 PayMe - лицензированный платежный провайдер</p>
          <p>🏦 Партнер банков Узбекистана</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PaymeCheckout',
    data() {
      return {
        cardNumber: '',
        expiryDate: '',
        cardHolder: '',
        smsCode: '',
        showSmsCode: false,
        processing: false,
        processingText: 'Обработка платежа...',
        maskedPhoneNumber: '',
        
        // From URL params
        transactionId: '',
        userId: '',
        amount: 0,
        plan: '',
        userName: '',
        userEmail: ''
      };
    },
    computed: {
      planName() {
        return this.plan === 'start' ? 'Start' : 'Pro';
      },
      cardType() {
        const cleanNumber = this.cardNumber.replace(/\s/g, '');
        if (cleanNumber.startsWith('8600')) {
          return 'Humo';
        } else if (cleanNumber.startsWith('5614') || cleanNumber.startsWith('6262')) {
          return 'UzCard';
        }
        return null;
      },
      isFormValid() {
        const cleanCardNumber = this.cardNumber.replace(/\s/g, '');
        return (
          cleanCardNumber.length >= 16 &&
          this.expiryDate.length === 5 &&
          this.cardHolder.trim().length > 0 &&
          this.cardType !== null &&
          (!this.showSmsCode || this.smsCode.length === 6)
        );
      }
    },
    mounted() {
      this.loadPaymentData();
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
        
        console.log('💳 Payment checkout loaded:', {
          transactionId: this.transactionId,
          amount: this.amount,
          plan: this.plan
        });
      },
  
      formatAmount(amount) {
        const uzs = amount / 100;
        return new Intl.NumberFormat('uz-UZ', {
          style: 'currency',
          currency: 'UZS',
          minimumFractionDigits: 0
        }).format(uzs);
      },
  
      formatCardNumber() {
        let value = this.cardNumber.replace(/\s/g, '').replace(/\D/g, '');
        value = value.substring(0, 16);
        value = value.replace(/(.{4})/g, '$1 ').trim();
        this.cardNumber = value;
      },
  
      formatExpiryDate() {
        let value = this.expiryDate.replace(/\D/g, '');
        if (value.length >= 2) {
          value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        this.expiryDate = value;
      },
  
      getCardTypeIcon() {
        if (this.cardType === 'Humo') {
          return '../assets/icons/humo.png';
        } else if (this.cardType === 'UzCard') {
          return '../assets/icons/uzcard.png';
        }
        return '';
      },
  
      async processPayment() {
        if (!this.isFormValid) return;
  
        this.processing = true;
        this.processingText = 'Проверка карты...';
  
        try {
          // Step 1: Initialize payment with PayMe API
          const initResponse = await fetch('/api/payments/initialize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionId: this.transactionId,
              cardNumber: this.cardNumber.replace(/\s/g, ''),
              expiryDate: this.expiryDate,
              cardHolder: this.cardHolder,
              amount: this.amount,
              userId: this.userId,
              plan: this.plan
            })
          });
  
          const initData = await initResponse.json();
  
          if (!initResponse.ok) {
            throw new Error(initData.message || 'Ошибка инициализации платежа');
          }
  
          // Step 2: Handle SMS verification if required
          if (initData.requiresSms) {
            this.processingText = 'Отправка SMS кода...';
            this.maskedPhoneNumber = initData.maskedPhone || '+998 ** *** **12';
            this.showSmsCode = true;
            this.processing = false;
            return;
          }
  
          // Step 3: Complete payment if SMS verification
          if (this.showSmsCode) {
            await this.verifySmsAndComplete();
          }
  
        } catch (error) {
          console.error('❌ Payment error:', error);
          alert(`❌ Ошибка оплаты: ${error.message}`);
          this.processing = false;
        }
      },
  
      async verifySmsAndComplete() {
        this.processing = true;
        this.processingText = 'Подтверждение SMS кода...';
  
        try {
          const verifyResponse = await fetch('/api/payments/verify-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionId: this.transactionId,
              smsCode: this.smsCode
            })
          });
  
          const verifyData = await verifyResponse.json();
  
          if (!verifyResponse.ok) {
            throw new Error(verifyData.message || 'Неверный SMS код');
          }
  
          this.processingText = 'Завершение платежа...';
          
          // Complete the payment
          await this.completePayment();
  
        } catch (error) {
          console.error('❌ SMS verification error:', error);
          alert(`❌ Ошибка: ${error.message}`);
          this.processing = false;
        }
      },
  
      async completePayment() {
        try {
          const response = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionId: this.transactionId,
              userId: this.userId,
              plan: this.plan,
              cardType: this.cardType,
              cardLast4: this.cardNumber.slice(-4)
            })
          });
  
          const data = await response.json();
  
          if (response.ok && data.success) {
            // Redirect to success page
            window.location.href = `https://aced.live/payment-success?transaction=${this.transactionId}&plan=${this.plan}`;
          } else {
            throw new Error(data.message || 'Payment completion failed');
          }
  
        } catch (error) {
          console.error('❌ Payment completion error:', error);
          alert('❌ Ошибка завершения платежа');
          this.processing = false;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .payme-checkout {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Inter', sans-serif;
  }
  
  .checkout-container {
    max-width: 500px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  }
  
  .payme-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .payme-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
  }
  
  .payme-logo h1 {
    color: #1e40af;
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
  }
  
  .secure-text {
    color: #059669;
    font-weight: 600;
    margin: 0;
  }
  
  .payment-details {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
  }
  
  .payment-details h2 {
    font-size: 1.2rem;
    color: #374151;
    margin-bottom: 10px;
  }
  
  .amount {
    font-size: 2rem;
    font-weight: 800;
    color: #1e40af;
    margin-bottom: 5px;
  }
  
  .plan-info {
    color: #6b7280;
    font-weight: 600;
  }
  
  .card-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group label {
    font-weight: 600;
    color: #374151;
    font-size: 0.9rem;
  }
  
  .form-group input {
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus {
    border-color: #1e40af;
    outline: none;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }
  
  .card-type {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 5px;
    font-size: 0.9rem;
    color: #059669;
    font-weight: 600;
  }
  
  .card-icon {
    width: 24px;
    height: 16px;
  }
  
  .sms-note {
    font-size: 0.85rem;
    color: #059669;
    margin: 0;
  }
  
  .pay-button {
    padding: 18px 32px;
    background: linear-gradient(135deg, #1e40af, #1e3a8a);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
  }
  
  .pay-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(30, 64, 175, 0.3);
  }
  
  .pay-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-left: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .supported-cards {
    margin-top: 30px;
    padding: 20px;
    background: #f0f9ff;
    border-radius: 12px;
  }
  
  .supported-cards h4 {
    margin: 0 0 15px 0;
    color: #1e40af;
    font-size: 0.9rem;
  }
  
  .card-types {
    display: flex;
    gap: 15px;
  }
  
  .card-type-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    background: white;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #374151;
  }
  
  .card-logo {
    width: 32px;
    height: 20px;
  }
  
  .security-info {
    margin-top: 20px;
    text-align: center;
  }
  
  .security-info p {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 5px 0;
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
    
    .card-types {
      flex-direction: column;
    }
  }
  </style>