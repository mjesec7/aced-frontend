<template>
    <div class="multicard-checkout">
      <!-- Payment Success View -->
      <div v-if="paymentStatus === 'success'" class="payment-result success">
        <div class="result-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 class="result-title">Оплата успешна!</h1>
        <p class="result-message">Ваша подписка {{ selectedPlan.toUpperCase() }} активирована</p>
        <div class="transaction-info">
          <p><strong>План:</strong> {{ planInfo.name }}</p>
          <p><strong>Сумма:</strong> {{ planInfo.displayPrice }} сум</p>
          <p v-if="transactionId"><strong>ID транзакции:</strong> {{ transactionId }}</p>
        </div>
        <div class="result-actions">
          <button @click="goToDashboard" class="btn-primary btn-large">
            Перейти к курсам
          </button>
          <button @click="goHome" class="btn-secondary">
            На главную
          </button>
        </div>
      </div>
  
      <!-- Payment Failed View -->
      <div v-else-if="paymentStatus === 'failed'" class="payment-result failed">
        <div class="result-icon error">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h1 class="result-title">Оплата не прошла</h1>
        <p class="result-message">{{ failureReason || 'Произошла ошибка при обработке платежа' }}</p>
        <div class="error-details" v-if="errorDetails">
          <p>{{ errorDetails }}</p>
        </div>
        <div class="result-actions">
          <button @click="retryPayment" class="btn-primary btn-large">
            Попробовать снова
          </button>
          <button @click="goBack" class="btn-secondary">
            Изменить способ оплаты
          </button>
        </div>
      </div>
  
      <!-- Payment Cancelled View -->
      <div v-else-if="paymentStatus === 'cancelled'" class="payment-result cancelled">
        <div class="result-icon warning">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1 class="result-title">Оплата отменена</h1>
        <p class="result-message">Вы отменили процесс оплаты</p>
        <div class="result-actions">
          <button @click="retryPayment" class="btn-primary btn-large">
            Вернуться к оплате
          </button>
          <button @click="goHome" class="btn-secondary">
            На главную
          </button>
        </div>
      </div>
  
      <!-- Checkout View (Default) -->
      <div v-else>
        <!-- Header -->
        <div class="checkout-header">
          <button @click="goBack" class="back-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1>Оплата подписки</h1>
        </div>
  
        <!-- Loading State -->
        <div v-if="initialLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>
  
        <!-- Main Content -->
        <div v-else class="checkout-content">
        <!-- Plan Info Card -->
        <div class="plan-card">
          <div class="plan-badge" :class="`plan-${selectedPlan}`">
            {{ planInfo.name }}
          </div>
          <div class="plan-price">
            <span class="amount">{{ planInfo.displayPrice }}</span>
            <span class="currency">сум</span>
          </div>
          <ul class="plan-features">
            <li v-for="feature in planInfo.features" :key="feature">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>
  
        <!-- Payment Methods -->
        <div class="payment-methods">
          <h2>Выберите способ оплаты</h2>
  
          <!-- Saved Cards -->
          <div v-if="savedCards.length > 0" class="saved-cards">
            <h3>Сохраненные карты</h3>
            <div 
              v-for="card in savedCards" 
              :key="card.cardToken"
              class="card-item"
              :class="{ selected: selectedCardToken === card.cardToken }"
              @click="selectCard(card.cardToken)"
            >
              <div class="card-info">
                <div class="card-icon">
                  <img :src="getCardIcon(card.ps)" :alt="card.ps" />
                </div>
                <div class="card-details">
                  <p class="card-number">•••• {{ card.cardPan?.slice(-4) || '****' }}</p>
                  <p class="card-type">{{ getCardTypeName(card.ps) }}</p>
                </div>
              </div>
              <div class="card-radio">
                <input 
                  type="radio" 
                  :checked="selectedCardToken === card.cardToken"
                  @change="selectCard(card.cardToken)"
                />
              </div>
            </div>
          </div>
  
          <!-- New Card Option -->
          <div class="payment-option" @click="selectNewCard">
            <div class="option-content">
              <div class="option-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div class="option-text">
                <h4>Оплатить новой картой</h4>
                <p>Введите данные карты</p>
              </div>
            </div>
            <div class="option-radio">
              <input type="radio" :checked="selectedCardToken === null" />
            </div>
          </div>
  
          <!-- Mobile Apps -->
          <div class="mobile-apps">
            <h3>Оплата через приложение</h3>
            <div class="app-grid">
              <button 
                v-for="app in paymentApps" 
                :key="app.id"
                class="app-button"
                @click="payViaApp(app.id)"
                :disabled="processing"
              >
                <img :src="app.icon" :alt="app.name" />
                <span>{{ app.name }}</span>
              </button>
            </div>
          </div>
        </div>
  
        <!-- OTP Input Modal -->
        <div v-if="showOtpModal" class="modal-overlay" @click.self="closeOtpModal">
          <div class="modal-content otp-modal">
            <h3>Введите код подтверждения</h3>
            <p>Код отправлен на номер телефона, привязанный к карте</p>
            
            <div class="otp-input-container">
              <input 
                v-for="(digit, index) in otpDigits" 
                :key="index"
                v-model="otpDigits[index]"
                type="text"
                maxlength="1"
                class="otp-digit"
                @input="handleOtpInput(index, $event)"
                @keydown.backspace="handleOtpBackspace(index, $event)"
                :ref="el => otpInputs[index] = el"
              />
            </div>
  
            <div v-if="otpError" class="error-message">{{ otpError }}</div>
  
            <div class="modal-actions">
              <button @click="closeOtpModal" class="btn-secondary" :disabled="processing">
                Отмена
              </button>
              <button @click="submitOtp" class="btn-primary" :disabled="processing || otp.length < 6">
                {{ processing ? 'Проверка...' : 'Подтвердить' }}
              </button>
            </div>
          </div>
        </div>
  
        <!-- Error Message -->
        <div v-if="error" class="error-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
          <span>{{ error }}</span>
          <button @click="error = null" class="close-error">×</button>
        </div>
  
        <!-- Pay Button -->
        <button 
          @click="handlePayment" 
          class="pay-button"
          :disabled="processing"
        >
          <span v-if="processing" class="button-spinner"></span>
          <span v-else>Оплатить {{ planInfo.displayPrice }} сум</span>
        </button>
  
        <!-- Security Info -->
        <div class="security-info">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
          </svg>
          <p>Защищенное соединение. Все данные шифруются.</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';
  import { 
    initiateMulticardPayment,
    createPaymentByToken,
    createPaymentViaApp,
    confirmPayment,
    createOfdData,
    formatPrice,
    uzsToTiyin,
    getCardInfo
  } from '@/api/multicard';
  
  export default {
    name: 'MulticardCheckout',
    setup() {
      const router = useRouter();
      const route = useRoute();
      const authStore = useAuthStore();
  
      // State
      const initialLoading = ref(true);
      const processing = ref(false);
      const error = ref(null);
      const selectedPlan = ref('start');
      const selectedCardToken = ref(null);
      const savedCards = ref([]);
      const showOtpModal = ref(false);
      const otpDigits = ref(['', '', '', '', '', '']);
      const otpInputs = ref([]);
      const otpError = ref(null);
      const currentPaymentUuid = ref(null);
  
      // Plan configurations
      const plans = {
        start: {
          name: 'START',
          price: 260000,
          displayPrice: '260 000',
          features: [
            'Доступ ко всем курсам START',
            'Базовые уроки и упражнения',
            'Сертификат об окончании',
            'Поддержка в чате'
          ]
        },
        pro: {
          name: 'PRO',
          price: 455000,
          displayPrice: '455 000',
          features: [
            'Все возможности START',
            'Продвинутые курсы и проекты',
            'Персональный наставник',
            'Приоритетная поддержка',
            'Доступ к закрытому сообществу'
          ]
        }
      };
  
      // Payment apps configuration
      const paymentApps = [
        { id: 'payme', name: 'Payme', icon: '/icons/payme.svg' },
        { id: 'click', name: 'Click', icon: '/icons/click.svg' },
        { id: 'uzum', name: 'Uzum', icon: '/icons/uzum.svg' },
        { id: 'oson', name: 'Oson', icon: '/icons/oson.svg' }
      ];
  
      // Computed
      const planInfo = computed(() => plans[selectedPlan.value]);
      
      const otp = computed(() => otpDigits.value.join(''));
  
      const userId = computed(() => authStore.user?.uid || authStore.user?.firebaseId);
  
      // Methods
      const goBack = () => {
        router.push('/pricing');
      };
  
      const selectCard = (token) => {
        selectedCardToken.value = token;
      };
  
      const selectNewCard = () => {
        selectedCardToken.value = null;
      };
  
      const getCardIcon = (ps) => {
        const icons = {
          uzcard: '/icons/uzcard.svg',
          humo: '/icons/humo.svg',
          visa: '/icons/visa.svg',
          mastercard: '/icons/mastercard.svg'
        };
        return icons[ps] || '/icons/card.svg';
      };
  
      const getCardTypeName = (ps) => {
        const names = {
          uzcard: 'UZCARD',
          humo: 'HUMO',
          visa: 'Visa',
          mastercard: 'Mastercard'
        };
        return names[ps] || 'Card';
      };
  
      const loadSavedCards = async () => {
        try {
          // Get saved cards from user data
          if (authStore.user?.savedCards) {
            savedCards.value = authStore.user.savedCards;
          }
        } catch (err) {
}
      };
  
      const createOfdPayload = () => {
        return createOfdData([
          {
            name: `ACED ${selectedPlan.value.toUpperCase()} Plan Subscription`,
            price: planInfo.value.price,
            quantity: 1,
            mxik: '10899002001000000',
            packageCode: '1'
          }
        ]);
      };
  
      const handlePayment = async () => {
        if (!userId.value) {
          error.value = 'Необходимо войти в систему';
          return;
        }
  
        processing.value = true;
        error.value = null;
  
        try {
          if (selectedCardToken.value) {
            // Pay with saved card
            await payWithSavedCard();
          } else {
            // Pay with new card
            await payWithNewCard();
          }
        } catch (err) {
error.value = err.message || 'Ошибка при обработке платежа';
        } finally {
          processing.value = false;
        }
      };
  
      const payWithNewCard = async () => {
        const ofdData = createOfdPayload();
  
        const result = await initiateMulticardPayment({
          userId: userId.value,
          plan: selectedPlan.value,
          amount: uzsToTiyin(planInfo.value.price),
          ofd: ofdData,
          lang: 'ru'
        });
  
        if (result.success) {
          // Redirect to Multicard checkout
          window.location.href = result.data.checkoutUrl;
        } else {
          throw new Error(result.error);
        }
      };
  
      const payWithSavedCard = async () => {
        const ofdData = createOfdPayload();
  
        const result = await createPaymentByToken({
          card: {
            token: selectedCardToken.value
          },
          amount: uzsToTiyin(planInfo.value.price),
          storeId: import.meta.env.VITE_MULTICARD_STORE_ID,
          invoiceId: `aced_${selectedPlan.value}_${userId.value}_${Date.now()}`,
          callbackUrl: `${import.meta.env.VITE_API_BASE_URL}/api/payments/multicard/webhook`,
          ofd: ofdData
        });
  
        if (result.success) {
          if (result.data.otpHash) {
            // OTP required
            currentPaymentUuid.value = result.data.uuid;
            showOtpModal.value = true;
          } else if (result.data.checkoutUrl) {
            // Redirect to payment app
            window.location.href = result.data.checkoutUrl;
          } else if (result.data.status === 'success') {
            // Payment completed
            handlePaymentSuccess(result.data);
          }
        } else {
          throw new Error(result.error);
        }
      };
  
      const payViaApp = async (appId) => {
        processing.value = true;
        error.value = null;
  
        try {
          const ofdData = createOfdPayload();
  
          const result = await createPaymentViaApp({
            paymentSystem: appId,
            amount: uzsToTiyin(planInfo.value.price),
            storeId: import.meta.env.VITE_MULTICARD_STORE_ID,
            invoiceId: `aced_${selectedPlan.value}_${userId.value}_${Date.now()}`,
            callbackUrl: `${import.meta.env.VITE_API_BASE_URL}/api/payments/multicard/webhook`,
            ofd: ofdData
          });
  
          if (result.success) {
            window.location.href = result.data.checkoutUrl;
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
error.value = err.message;
        } finally {
          processing.value = false;
        }
      };
  
      const handleOtpInput = (index, event) => {
        const value = event.target.value;
        
        if (value && index < 5) {
          // Move to next input
          otpInputs.value[index + 1]?.focus();
        }
      };
  
      const handleOtpBackspace = (index, event) => {
        if (!otpDigits.value[index] && index > 0) {
          // Move to previous input
          otpInputs.value[index - 1]?.focus();
        }
      };
  
      const submitOtp = async () => {
        processing.value = true;
        otpError.value = null;
  
        try {
          const result = await confirmPayment(
            currentPaymentUuid.value,
            otp.value
          );
  
          if (result.success) {
            if (result.data.status === 'success') {
              handlePaymentSuccess(result.data);
            } else {
              throw new Error('Платеж не подтвержден');
            }
          } else {
            throw new Error(result.error);
          }
        } catch (err) {
otpError.value = err.message || 'Неверный код';
        } finally {
          processing.value = false;
        }
      };
  
      const closeOtpModal = () => {
        showOtpModal.value = false;
        otpDigits.value = ['', '', '', '', '', ''];
        otpError.value = null;
      };
  
      const handlePaymentSuccess = (paymentData) => {
// Redirect to success page
        router.push({
          name: 'PaymentSuccess',
          query: {
            plan: selectedPlan.value,
            transactionId: paymentData.uuid
          }
        });
      };
  
      // Lifecycle
      onMounted(async () => {
        // Get plan from route query
        if (route.query.plan) {
          selectedPlan.value = route.query.plan;
        }
  
        // Load saved cards
        await loadSavedCards();
  
        initialLoading.value = false;
      });
  
      return {
        // State
        initialLoading,
        processing,
        error,
        selectedPlan,
        selectedCardToken,
        savedCards,
        showOtpModal,
        otpDigits,
        otpInputs,
        otpError,
        
        // Computed
        planInfo,
        otp,
        paymentApps,
        
        // Methods
        goBack,
        selectCard,
        selectNewCard,
        getCardIcon,
        getCardTypeName,
        handlePayment,
        payViaApp,
        handleOtpInput,
        handleOtpBackspace,
        submitOtp,
        closeOtpModal
      };
    }
  };
  </script>
  
  <style scoped>
  .multicard-checkout {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding-bottom: 2rem;
  }
  
  .checkout-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .back-button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .back-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  .checkout-header h1 {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: white;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .checkout-content {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .plan-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
  
  .plan-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .pay-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  }
  
  .pay-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .button-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  /* Security Info */
  .security-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: white;
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  .security-info svg {
    flex-shrink: 0;
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .checkout-header {
      padding: 1rem;
    }
  
    .checkout-header h1 {
      font-size: 1.25rem;
    }
  
    .plan-card {
      padding: 1.5rem;
    }
  
    .plan-price {
      font-size: 2.5rem;
    }
  
    .payment-methods {
      padding: 1.5rem;
    }
  
    .app-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  
    .otp-digit {
      width: 40px;
      height: 48px;
      font-size: 1.25rem;
    }
  
    .modal-content {
      padding: 1.5rem;
    }
  }
  </style>
  
  .plan-badge.plan-start {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .plan-badge.plan-pro {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }
  
  .plan-price {
    font-size: 3rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 1.5rem;
  }
  
  .plan-price .currency {
    font-size: 1.5rem;
    color: #718096;
  }
  
  .plan-features {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .plan-features li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    color: #4a5568;
  }
  
  .plan-features svg {
    color: #48bb78;
    flex-shrink: 0;
  }
  
  .payment-methods {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
  }
  
  .payment-methods h2,
  .saved-cards h3,
  .mobile-apps h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 1rem;
  }
  
  .saved-cards {
    margin-bottom: 2rem;
  }
  
  .card-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .card-item:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }
  
  .card-item.selected {
    border-color: #667eea;
    background: #eef2ff;
  }
  
  .card-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .card-icon img {
    width: 48px;
    height: 32px;
    object-fit: contain;
  }
  
  .card-number {
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.25rem 0;
  }
  
  .card-type {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }
  
  .payment-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 2rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .payment-option:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }
  
  .option-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .option-icon {
    width: 48px;
    height: 48px;
    background: #eef2ff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #667eea;
  }
  
  .option-text h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.25rem 0;
  }
  
  .option-text p {
    font-size: 0.875rem;
    color: #718096;
    margin: 0;
  }
  
  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .app-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .app-button:hover:not(:disabled) {
    border-color: #667eea;
    background: #eef2ff;
    transform: translateY(-2px);
  }
  
  .app-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .app-button img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
  
  .app-button span {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4a5568;
  }
  
  /* OTP Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
  }
  
  .otp-modal h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 0.5rem 0;
  }
  
  .otp-modal p {
    font-size: 0.875rem;
    color: #718096;
    margin: 0 0 1.5rem 0;
  }
  
  .otp-input-container {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1rem;
  }
  
  .otp-digit {
    width: 48px;
    height: 56px;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    outline: none;
    transition: border-color 0.2s;
  }
  
  .otp-digit:focus {
    border-color: #667eea;
  }
  
  .error-message {
    padding: 0.75rem;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 8px;
    color: #c53030;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  
  .modal-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn-secondary,
  .btn-primary {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary {
    background: #f7fafc;
    color: #4a5568;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: #edf2f7;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .btn-secondary:disabled,
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Error Banner */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 12px;
    color: #c53030;
    margin-bottom: 1rem;
  }
  
  .close-error {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #c53030;
    cursor: pointer;
  }
  
  /* Pay Button */
  .pay-button {
    width: 100%;
    padding: 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 1rem;
  }
</style>