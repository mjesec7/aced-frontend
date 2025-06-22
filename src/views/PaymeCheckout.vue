<template>
    <div class="payme-checkout">
      <div class="checkout-container">
        <!-- PayMe Logo and Header -->
        <div class="payme-header">
          <div class="payme-logo">
            <img src="/payme-logo.png" alt="PayMe" class="logo" />
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
            <div class="form-group">
              <label>CVV</label>
              <input
                v-model="cvv"
                type="text"
                placeholder="123"
                maxlength="3"
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
  
          <!-- SMS Code (simulated) -->
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
            <p class="sms-note">Код отправлен на номер +998 ** *** **12</p>
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
  
        <!-- Test Cards Info -->
        <div class="test-cards">
          <h4>🧪 Тестовые карты для разработки:</h4>
          <div class="test-card" @click="useTestCard('success')">
            <strong>8600 1234 5678 9012</strong> - Успешная оплата
          </div>
          <div class="test-card" @click="useTestCard('fail')">
            <strong>8600 0000 0000 0001</strong> - Неудачная оплата
          </div>
        </div>
  
        <!-- Security Info -->
        <div class="security-info">
          <p>🔒 Ваши данные защищены SSL шифрованием</p>
          <p>💳 PayMe - лицензированный платежный провайдер</p>
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
        cvv: '',
        cardHolder: '',
        smsCode: '',
        showSmsCode: false,
        processing: false,
        processingText: 'Обработка платежа...',
        
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
      isFormValid() {
        return (
          this.cardNumber.replace(/\s/g, '').length >= 16 &&
          this.expiryDate.length === 5 &&
          this.cvv.length === 3 &&
          this.cardHolder.trim().length > 0 &&
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
  
      useTestCard(type) {
        if (type === 'success') {
          this.cardNumber = '8600 1234 5678 9012';
          this.expiryDate = '12/25';
          this.cvv = '123';
          this.cardHolder = 'TEST USER';
        } else {
          this.cardNumber = '8600 0000 0000 0001';
          this.expiryDate = '01/24';
          this.cvv = '000';
          this.cardHolder = 'FAIL TEST';
        }
      },
  
      async processPayment() {
        if (!this.isFormValid) return;
  
        this.processing = true;
        this.processingText = 'Проверка карты...';
  
        try {
          // Simulate payment processing
          await new Promise(resolve => setTimeout(resolve, 1500));
  
          // Check if it's a success or fail test card
          const isSuccessCard = this.cardNumber.includes('9012');
          const isFailCard = this.cardNumber.includes('0001');
  
          if (isFailCard) {
            throw new Error('Недостаточно средств на карте');
          }
  
          if (!this.showSmsCode && isSuccessCard) {
            this.processingText = 'Отправка SMS кода...';
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.showSmsCode = true;
            this.processing = false;
            return;
          }
  
          if (this.showSmsCode) {
            this.processingText = 'Подтверждение платежа...';
            await new Promise(resolve => setTimeout(resolve, 2000));
  
            // Simulate successful payment
            if (this.smsCode === '123456' || isSuccessCard) {
              await this.completePayment();
            } else {
              throw new Error('Неверный SMS код');
            }
          }
  
        } catch (error) {
          console.error('❌ Payment error:', error);
          alert(`❌ Ошибка оплаты: ${error.message}`);
          this.processing = false;
        }
      },
  
      async completePayment() {
        try {
          this.processingText = 'Завершение платежа...';
  
          // Call your backend to complete the payment
          const response = await fetch('/api/payments/complete-sandbox', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              transactionId: this.transactionId,
              userId: this.userId,
              plan: this.plan,
              cardLast4: this.cardNumber.slice(-4)
            })
          });
  
          if (response.ok) {
            // Redirect to success page
            window.location.href = `https://aced.live/payment-success?transaction=${this.transactionId}&plan=${this.plan}`;
          } else {
            throw new Error('Payment completion failed');
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
    grid-template-columns: 1fr 1fr;
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
  
  .test-cards {
    margin-top: 30px;
    padding: 20px;
    background: #fef3c7;
    border-radius: 12px;
  }
  
  .test-cards h4 {
    margin: 0 0 15px 0;
    color: #92400e;
    font-size: 0.9rem;
  }
  
  .test-card {
    padding: 10px;
    background: white;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  
  .test-card:hover {
    background: #f9fafb;
    transform: translateY(-1px);
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
    
    .form-row {
      grid-template-columns: 1fr;
    }
  }
  </style>