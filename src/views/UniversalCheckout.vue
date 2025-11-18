<template>
  <div class="universal-checkout">
    <div class="checkout-container">
      <!-- Payment Success View -->
      <div v-if="paymentStatus === 'success'" class="payment-result success">
        <div class="result-content">
          <div class="result-icon-wrapper success">
            <svg class="checkmark" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <h1 class="result-title">Payment Successful</h1>
          <p class="result-message">Your {{ planName }} subscription has been activated successfully</p>
          
          <div class="transaction-details">
            <div class="detail-row">
              <span class="detail-label">Plan</span>
              <span class="detail-value">{{ planName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount Paid</span>
              <span class="detail-value amount">{{ formatAmount(finalAmount) }}</span>
            </div>
            <div v-if="transactionId" class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value transaction-id">{{ transactionId }}</span>
            </div>
          </div>
          
          <div class="result-actions">
            <button @click="goToDashboard" class="btn btn-primary">
              Start Learning
            </button>
            <button @click="goHome" class="btn btn-outline">
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <!-- Payment Failed View -->
      <div v-else-if="paymentStatus === 'failed'" class="payment-result failed">
        <div class="result-content">
          <div class="result-icon-wrapper error">
            <svg viewBox="0 0 52 52" class="error-icon-svg">
              <circle class="error-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="error-cross" fill="none" d="M16 16 36 36 M36 16 16 36"/>
            </svg>
          </div>
          <h1 class="result-title">Payment Failed</h1>
          <p class="result-message">{{ failureReason || 'We couldn\'t process your payment. Please try again.' }}</p>
          
          <div class="result-actions">
            <button @click="retryPayment" class="btn btn-primary">
              Try Again
            </button>
            <button @click="goBack" class="btn btn-outline">
              Change Method
            </button>
          </div>
        </div>
      </div>

      <!-- Payment Cancelled View -->
      <div v-else-if="paymentStatus === 'cancelled'" class="payment-result cancelled">
        <div class="result-content">
          <div class="result-icon-wrapper warning">
            <svg viewBox="0 0 52 52" class="warning-icon-svg">
              <circle class="warning-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="warning-sign" fill="none" d="M26 14v16m0 4v.01"/>
            </svg>
          </div>
          <h1 class="result-title">Payment Cancelled</h1>
          <p class="result-message">You cancelled the payment. Your subscription remains unchanged.</p>
          
          <div class="result-actions">
            <button @click="retryPayment" class="btn btn-primary">
              Return to Payment
            </button>
            <button @click="goHome" class="btn btn-outline">
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <div class="loading-content">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <h2 class="loading-title">{{ loadingMessage }}</h2>
          <p class="loading-subtitle">Please wait while we prepare your payment...</p>
          
          <div v-if="userName" class="loading-details">
            <div class="loading-detail">
              <span class="loading-label">User</span>
              <span class="loading-value">{{ finalUserName }}</span>
            </div>
            <div class="loading-detail">
              <span class="loading-label">Plan</span>
              <span class="loading-value">{{ planName }}</span>
            </div>
            <div class="loading-detail">
              <span class="loading-label">Amount</span>
              <span class="loading-value">{{ formatAmount(finalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <div class="error-icon-large">
            <svg viewBox="0 0 52 52" class="error-svg-large">
              <circle class="error-circle-large" cx="26" cy="26" r="25" fill="none"/>
              <path class="error-cross-large" fill="none" d="M16 16 36 36 M36 16 16 36"/>
            </svg>
          </div>
          <h2 class="error-title">Unable to Process Payment</h2>
          <p class="error-message">{{ error }}</p>
          
          <div v-if="showDebugInfo" class="debug-section">
            <details>
              <summary>Technical Details</summary>
              <pre class="debug-data">{{ debugData }}</pre>
            </details>
          </div>
          
          <div class="error-actions">
            <button @click="retryPayment" class="btn btn-primary">
              Try Again
            </button>
            <button @click="goBack" class="btn btn-outline">
              Go Back
            </button>
          </div>
        </div>
      </div>

      <!-- Main Checkout View -->
      <div v-else class="checkout-main">
        <!-- Header -->
        <div class="checkout-header">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <h1 class="checkout-title">Complete Your Payment</h1>
          <p class="checkout-subtitle">Subscribe to ACED and unlock premium features</p>
        </div>

        <!-- Payment Summary -->
        <div class="payment-summary">
          <h3 class="section-title">Payment Details</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Account</span>
              <span class="summary-value">{{ finalUserName || 'Not specified' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Email</span>
              <span class="summary-value">{{ finalUserEmail || 'Not specified' }}</span>
            </div>
            <div class="summary-item highlight">
              <span class="summary-label">Current Plan</span>
              <span class="summary-badge current">{{ currentPlan || 'Free' }}</span>
            </div>
            <div v-if="finalPlan" class="summary-item highlight">
              <span class="summary-label">Upgrading To</span>
              <span class="summary-badge upgrade">{{ planName }}</span>
            </div>
          </div>
          
          <div class="amount-display">
            <span class="amount-label">Total Amount</span>
            <span class="amount-value">{{ formatAmount(finalAmount) }}</span>
          </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="payment-methods">
          <h3 class="section-title">Payment Method</h3>
          <div class="method-grid">
            <label 
              v-for="(provider, key) in providers"
              :key="key"
              :class="['method-card', { 
                active: paymentProvider === key, 
                disabled: !provider.enabled 
              }]"
              @click="provider.enabled && (paymentProvider = key)"
            >
              <input 
                type="radio"
                v-model="paymentProvider"
                :value="key"
                :disabled="!provider.enabled"
                class="method-radio"
              />
              <div class="method-icon">
                {{ provider.emoji }}
              </div>
              <div class="method-details">
                <span class="method-name">{{ provider.name }}</span>
                <span class="method-desc">{{ provider.description }}</span>
                <span v-if="!provider.enabled" class="method-status">Coming Soon</span>
              </div>
              <div v-if="paymentProvider === key && provider.enabled" class="method-check">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- Saved Cards Section -->
        <div v-if="paymentProvider === 'multicard' && savedCards.length > 0" class="saved-cards">
          <h3 class="section-title">Saved Cards</h3>
          <div class="cards-list">
            <label 
              v-for="card in savedCards" 
              :key="card.cardToken"
              :class="['card-option', { active: selectedCardToken === card.cardToken }]"
              @click="selectCard(card.cardToken)"
            >
              <div class="card-visual">
                <div class="card-chip"></div>
                <div class="card-number">•••• •••• •••• {{ card.cardPan?.slice(-4) || '****' }}</div>
                <div class="card-footer">
                  <span class="card-type">{{ getCardTypeName(card.ps) }}</span>
                </div>
              </div>
              <div class="card-select">
                <input 
                  type="radio" 
                  :checked="selectedCardToken === card.cardToken"
                />
              </div>
            </label>
            
            <label 
              :class="['card-option new-card', { active: selectedCardToken === null }]"
              @click="selectCard(null)"
            >
              <div class="card-visual new">
                <div class="new-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <span class="new-card-text">Add New Card</span>
              </div>
              <div class="card-select">
                <input type="radio" :checked="selectedCardToken === null" />
              </div>
            </label>
          </div>
        </div>

        <!-- Plan Selection (if needed) -->
        <div v-if="!plan" class="plan-selection">
          <h3 class="section-title">Choose Your Plan</h3>
          <div class="plans-grid">
            <label :class="['plan-card', { active: selectedPlan === 'start' }]">
              <input type="radio" v-model="selectedPlan" value="start" class="plan-radio" />
              <div class="plan-header">
                <span class="plan-name">Start Plan</span>
                <span class="plan-price">260,000 <span class="currency">UZS</span></span>
              </div>
              <ul class="plan-features">
                <li>Access to basic courses</li>
                <li>Monthly updates</li>
                <li>Email support</li>
              </ul>
              <div v-if="selectedPlan === 'start'" class="plan-check">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            </label>
            
            <label :class="['plan-card featured', { active: selectedPlan === 'pro' }]">
              <div class="plan-badge">Most Popular</div>
              <input type="radio" v-model="selectedPlan" value="pro" class="plan-radio" />
              <div class="plan-header">
                <span class="plan-name">Pro Plan</span>
                <span class="plan-price">455,000 <span class="currency">UZS</span></span>
              </div>
              <ul class="plan-features">
                <li>All courses access</li>
                <li>Priority support</li>
                <li>Exclusive content</li>
                <li>Certificate of completion</li>
              </ul>
              <div v-if="selectedPlan === 'pro'" class="plan-check">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- Language Selection -->
        <div class="language-selector">
          <label class="language-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Payment Page Language
          </label>
          <select v-model="selectedLanguage" class="language-select">
            <option value="en">🇺🇸 English</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="uz">🇺🇿 O'zbek</option>
          </select>
        </div>

        <!-- Payment Button -->
        <button 
          @click="processPayment" 
          :disabled="!canProceedToPayment || processing" 
          class="payment-btn"
        >
          <span v-if="processing" class="btn-loading">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
          </span>
          <span v-else-if="providers[paymentProvider]?.enabled && canProceedToPayment">
            Continue to Payment • {{ formatAmount(finalAmount) }}
          </span>
          <span v-else>
            {{ validationMessage }}
          </span>
        </button>

        <!-- Security Badge -->
        <div class="security-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div class="security-text">
            <span class="security-title">Secure Payment</span>
            <span class="security-desc">Your data is encrypted and protected</span>
          </div>
        </div>
      </div>

      <!-- OTP Modal -->
      <transition name="modal">
        <div v-if="showOtpModal" class="modal-overlay" @click.self="closeOtpModal">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">Verify Payment</h3>
              <button @click="closeOtpModal" class="modal-close" :disabled="processing">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <p class="modal-desc">Enter the 6-digit code sent to your registered phone number</p>
            
            <div class="otp-container">
              <input 
                v-for="(digit, index) in otpDigits" 
                :key="index"
                v-model="otpDigits[index]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="otp-input"
                @input="handleOtpInput(index, $event)"
                @keydown.backspace="handleOtpBackspace(index, $event)"
                :ref="el => { if (el) otpInputs[index] = el }"
              />
            </div>

            <div v-if="otpError" class="otp-error">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {{ otpError }}
            </div>

            <div class="modal-actions">
              <button @click="closeOtpModal" class="btn btn-outline" :disabled="processing">
                Cancel
              </button>
              <button @click="submitOtp" class="btn btn-primary" :disabled="processing || otp.length < 6">
                <span v-if="processing">Verifying...</span>
                <span v-else>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { 
  initiatePaymePayment, 
  initiateMulticardPayment,
  createPaymentByToken,
  confirmPayment
} from '@/api';

export default {
  name: 'UniversalCheckout',
  props: {
    plan: {
      type: String,
      default: ''
    },
    provider: {
      type: String,
      default: 'multicard'
    },
    userId: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      default: ''
    },
    userEmail: {
      type: String,
      default: ''
    },
    currentPlan: {
      type: String,
      default: 'free'
    },
    amount: {
      type: [String, Number],
      default: 0
    }
  },
  
  data() {
    return {
      loading: false,
      processing: false,
      error: '',
      
      paymentStatus: null,
      transactionId: null,
      failureReason: '',
      
      selectedLanguage: 'en',
      selectedPlan: '',
      loadingMessage: 'Preparing payment...',

      paymentProvider: 'multicard',
      providers: {
        multicard: { 
          enabled: true, 
          name: 'Multicard', 
          emoji: '💳',
          description: 'Uzbekistan bank cards'
        },
        payme: { 
          enabled: true, 
          name: 'PayMe', 
          emoji: '📱',
          description: 'Fast mobile payment'
        },
        click: { 
          enabled: false, 
          name: 'Click', 
          emoji: '⚡',
          description: 'Click payment'
        },
        uzum: { 
          enabled: false, 
          name: 'Uzum Bank', 
          emoji: '🟣',
          description: 'Uzum Bank payments'
        }
      },
      
      savedCards: [],
      selectedCardToken: null,
      
      showOtpModal: false,
      otpDigits: ['', '', '', '', '', ''],
      otpInputs: [],
      otpError: null,
      currentPaymentUuid: null,
      
      internalUserId: '',
      internalUserName: '',
      internalUserEmail: '',
      
      showDebugInfo: process.env.NODE_ENV === 'development'
    };
  },
  
  computed: {
    finalPlan() {
      return this.plan || this.selectedPlan || '';
    },
    
    finalUserId() {
      return this.internalUserId || 
             this.userId || 
             this.$route.query.userId || 
             auth.currentUser?.uid || 
             '';
    },
    
    finalUserName() {
      return this.internalUserName || 
             this.userName || 
             this.$route.query.userName || 
             auth.currentUser?.displayName || 
             'User';
    },
    
    finalUserEmail() {
      return this.internalUserEmail || 
             this.userEmail || 
             this.$route.query.userEmail || 
             auth.currentUser?.email || 
             '';
    },
    
    finalAmount() {
      let amt = parseInt(this.amount) || 0;
      
      if (amt > 0) {
        return amt;
      }
      
      const amounts = {
        start: 26000000,
        pro: 45500000
      };
      
      return amounts[this.finalPlan] || amounts.start;
    },
    
    planName() {
      const plan = this.finalPlan;
      return plan === 'start' ? 'Start Plan' : plan === 'pro' ? 'Pro Plan' : '';
    },
    
    canProceedToPayment() {
      return Boolean(
        this.finalUserId && 
        this.finalPlan && 
        this.finalAmount > 0 &&
        this.providers[this.paymentProvider]?.enabled
      );
    },
    
    validationMessage() {
      if (!this.finalUserId) return 'User ID not specified';
      if (!this.finalPlan) return 'Please select a plan';
      if (!this.finalAmount || this.finalAmount <= 0) return 'Invalid payment amount';
      if (!this.providers[this.paymentProvider]?.enabled) return 'Please select an available payment method';
      return 'Complete all required fields';
    },
    
    otp() {
      return this.otpDigits.join('');
    },
    
    debugData() {
      return {
        props: {
          plan: this.plan,
          userId: this.userId,
          userName: this.userName,
          userEmail: this.userEmail,
          amount: this.amount,
          provider: this.provider
        },
        computed: {
          finalPlan: this.finalPlan,
          finalUserId: this.finalUserId,
          finalUserName: this.finalUserName,
          finalUserEmail: this.finalUserEmail,
          finalAmount: this.finalAmount,
          canProceed: this.canProceedToPayment
        },
        route: {
          query: this.$route.query,
          params: this.$route.params
        },
        auth: {
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName
          } : null
        }
      };
    }
  },
  
  async mounted() {
    await this.initializeCheckout();
  },
  
  methods: {
    async initializeCheckout() {
      try {
        this.checkPaymentStatus();
        this.loadPaymentData();
        await this.loadSavedCards();
        
        if (!this.finalUserId && auth.currentUser === null) {
          await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
              if (user) {
                this.internalUserId = user.uid;
                this.internalUserName = user.displayName || 'User';
                this.internalUserEmail = user.email || '';
                unsubscribe();
                resolve();
              }
            });
            
            setTimeout(() => {
              unsubscribe();
              resolve();
            }, 3000);
          });
        }
        
        this.validatePaymentData();
        
        if (this.$route.query.auto === 'true' && this.canProceedToPayment) {
          await this.processPayment();
        }
        
      } catch (error) {
this.error = 'Payment initialization error';
      }
    },
    
    checkPaymentStatus() {
      const query = this.$route.query;
      
      if (query.status === 'success') {
        this.paymentStatus = 'success';
        this.transactionId = query.transactionId || query.uuid;
      } else if (query.status === 'failed' || query.status === 'error') {
        this.paymentStatus = 'failed';
        this.failureReason = query.reason || query.error;
      } else if (query.status === 'cancelled') {
        this.paymentStatus = 'cancelled';
      }
    },
    
    loadPaymentData() {
      const query = this.$route.query;
      
      this.internalUserId = this.userId || query.userId || '';
      this.internalUserName = this.userName || query.userName || '';
      this.internalUserEmail = this.userEmail || query.userEmail || '';
      
      if (this.plan) {
        this.selectedPlan = this.plan;
      } else if (query.plan) {
        this.selectedPlan = query.plan;
      }
      
      this.selectedLanguage = query.lang || 'en';
      
      if (this.provider && this.providers[this.provider]) {
        this.paymentProvider = this.provider;
      } else if (query.provider && this.providers[query.provider]) {
        this.paymentProvider = query.provider;
      }
    },

    async loadSavedCards() {
      try {
        if (auth.currentUser) {
          this.savedCards = [];
        }
      } catch (err) {
}
    },

    selectCard(token) {
      this.selectedCardToken = token;
    },

    getCardTypeName(ps) {
      const names = {
        uzcard: 'UZCARD',
        humo: 'HUMO',
        visa: 'Visa',
        mastercard: 'Mastercard'
      };
      return names[ps?.toLowerCase()] || 'Card';
    },

    createOfdData() {
      return [
        {
          name: `ACED ${this.finalPlan.toUpperCase()} Plan Subscription`,
          price: this.finalAmount,
          quantity: 1,
          mxik: '10899002001000000',
          packageCode: '1'
        }
      ];
    },

    validatePaymentData() {
      const errors = [];

      if (!this.finalUserId) errors.push('User ID is required');
      if (!this.finalPlan) errors.push('Plan selection is required');
      if (!this.finalAmount || this.finalAmount <= 0) errors.push('Valid amount is required');

      if (errors.length > 0) {
}
    },

    async processPayment() {
      if (!this.canProceedToPayment) {
        this.error = this.validationMessage;
        return;
      }
      
      try {
        this.loading = true;
        this.processing = true;
        this.error = '';

        const provider = this.paymentProvider;
        this.loadingMessage = `Redirecting to ${this.providers[provider]?.name || 'payment'}...`;
        
        if (provider === 'payme') {
          await this.processPaymePayment();
        } else if (provider === 'multicard') {
          if (this.selectedCardToken) {
            await this.processMulticardTokenPayment();
          } else {
            await this.processMulticardNewCardPayment();
          }
        } else {
          throw new Error('Selected payment method is temporarily unavailable');
        }

      } catch (error) {
this.error = this.formatError(error);
        this.loading = false;
        this.processing = false;
      }
    },

    async processPaymePayment() {
      const result = await initiatePaymePayment(
        this.finalUserId, 
        this.finalPlan, 
        { 
          lang: this.selectedLanguage,
          amount: this.finalAmount
        }
      );
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.error || 'Failed to get PayMe payment link');
      }
    },

    async processMulticardNewCardPayment() {
      const ofdData = this.createOfdData();
      
      const result = await initiateMulticardPayment({
        userId: this.finalUserId,
        plan: this.finalPlan,
        amount: this.finalAmount,
        lang: this.selectedLanguage,
        userName: this.finalUserName,
        userEmail: this.finalUserEmail,
        ofd: ofdData
      });
      
      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        throw new Error(result.error || 'Failed to get Multicard payment link');
      }
    },

    async processMulticardTokenPayment() {
      const ofdData = this.createOfdData();
      
      const result = await createPaymentByToken({
        card: {
          token: this.selectedCardToken
        },
        amount: this.finalAmount,
        storeId: process.env.VUE_APP_MULTICARD_STORE_ID,
        invoiceId: `aced_${this.finalPlan}_${this.finalUserId}_${Date.now()}`,
        callbackUrl: `${process.env.VUE_APP_API_BASE_URL}/api/payments/multicard/webhook`,
        ofd: ofdData
      });

      if (result.success) {
        if (result.data.otpHash) {
          this.currentPaymentUuid = result.data.uuid;
          this.showOtpModal = true;
          this.loading = false;
          this.processing = false;
        } else if (result.data.checkoutUrl) {
          window.location.href = result.data.checkoutUrl;
        } else if (result.data.status === 'success') {
          this.handlePaymentSuccess(result.data);
        }
      } else {
        throw new Error(result.error);
      }
    },

    handleOtpInput(index, event) {
      const value = event.target.value;
      
      if (value && index < 5) {
        this.otpInputs[index + 1]?.focus();
      }
    },

    handleOtpBackspace(index, event) {
      if (!this.otpDigits[index] && index > 0) {
        this.otpInputs[index - 1]?.focus();
      }
    },

    async submitOtp() {
      this.processing = true;
      this.otpError = null;

      try {
        const result = await confirmPayment(
          this.currentPaymentUuid,
          this.otp
        );

        if (result.success) {
          if (result.data.status === 'success') {
            this.closeOtpModal();
            this.handlePaymentSuccess(result.data);
          } else {
            throw new Error('Payment not confirmed');
          }
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
this.otpError = err.message || 'Invalid verification code';
      } finally {
        this.processing = false;
      }
    },

    closeOtpModal() {
      this.showOtpModal = false;
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpError = null;
    },

    handlePaymentSuccess(paymentData) {
      this.paymentStatus = 'success';
      this.transactionId = paymentData.uuid || paymentData.transactionId;
      this.loading = false;
      this.processing = false;
    },

    formatError(error) {
      if (typeof error === 'string') return error;
      if (error?.response?.data?.message) return error.response.data.message;
      if (error?.response?.data?.error) return error.response.data.error;
      if (error?.message) return error.message;
      return 'An error occurred while processing payment. Please try again.';
    },

    async retryPayment() {
      this.error = '';
      this.loading = false;
      this.processing = false;
      this.paymentStatus = null;
      
      this.loadPaymentData();
      this.validatePaymentData();
      
      if (this.canProceedToPayment) {
        await this.processPayment();
      }
    },

    formatAmount(amount) {
      if (!amount) return '';
      
      const uzs = Math.floor(amount);
      
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(uzs) + ' sum';
      } catch (formatError) {
        return `${uzs.toLocaleString()} sum`;
      }
    },

    goBack() {
      if (this.paymentStatus) {
        this.paymentStatus = null;
      } else {
        this.$router.go(-1);
      }
    },

    goToDashboard() {
      this.$router.push('/dashboard');
    },

    goHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
/* ========================================
   BASE & LAYOUT
   ======================================== */

.universal-checkout {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkout-container {
  background: white;
  border-radius: 16px;
  max-width: 680px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ========================================
   PAYMENT RESULT STATES
   ======================================== */

.payment-result {
  padding: 3rem 2rem;
}

.result-content {
  text-align: center;
  max-width: 480px;
  margin: 0 auto;
}

.result-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon-wrapper.success {
  background: #d4edda;
}

.result-icon-wrapper.error {
  background: #f8d7da;
}

.result-icon-wrapper.warning {
  background: #fff3cd;
}

/* Success Checkmark Animation */
.checkmark {
  width: 48px;
  height: 48px;
  stroke-width: 3;
  stroke: #28a745;
  stroke-miterlimit: 10;
  animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3;
  stroke: #28a745;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #28a745;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

/* Error Icon */
.error-icon-svg, .warning-icon-svg {
  width: 48px;
  height: 48px;
  stroke-width: 3;
}

.error-circle {
  stroke: #dc3545;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.error-cross {
  stroke: #dc3545;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.warning-circle {
  stroke: #ffc107;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.warning-sign {
  stroke: #ffc107;
  stroke-linecap: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.result-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.result-message {
  font-size: 1rem;
  color: #718096;
  margin: 0 0 2rem;
  line-height: 1.6;
}

.transaction-details {
  background: #f7fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.detail-value {
  font-size: 0.9375rem;
  color: #2d3748;
  font-weight: 600;
}

.detail-value.amount {
  color: #2b6cb0;
}

.detail-value.transaction-id {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  color: #4a5568;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

/* ========================================
   LOADING STATE
   ======================================== */

.loading-state {
  padding: 3rem 2rem;
  text-align: center;
}

.loading-content {
  max-width: 400px;
  margin: 0 auto;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  position: relative;
  margin: 0 auto 1.5rem;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem;
}

.loading-subtitle {
  font-size: 0.9375rem;
  color: #718096;
  margin: 0 0 2rem;
}

.loading-details {
  background: #f7fafc;
  border-radius: 12px;
  padding: 1.25rem;
}

.loading-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.loading-label {
  font-size: 0.875rem;
  color: #718096;
}

.loading-value {
  font-size: 0.9375rem;
  color: #2d3748;
  font-weight: 600;
}

/* ========================================
   ERROR STATE
   ======================================== */

.error-state {
  padding: 3rem 2rem;
  text-align: center;
}

.error-content {
  max-width: 480px;
  margin: 0 auto;
}

.error-icon-large {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: #fee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-svg-large {
  width: 48px;
  height: 48px;
  stroke-width: 3;
}

.error-circle-large {
  stroke: #dc3545;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.error-cross-large {
  stroke: #dc3545;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.error-message {
  font-size: 1rem;
  color: #718096;
  margin: 0 0 2rem;
  line-height: 1.6;
}

.debug-section {
  margin-bottom: 2rem;
}

.debug-section details {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
}

.debug-section summary {
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
}

.debug-data {
  margin: 1rem 0 0;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #2d3748;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

/* ========================================
   MAIN CHECKOUT
   ======================================== */

.checkout-main {
  padding: 2.5rem;
}

.checkout-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-icon svg {
  width: 28px;
  height: 28px;
}

.checkout-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.checkout-subtitle {
  font-size: 0.9375rem;
  color: #718096;
  margin: 0;
}

/* ========================================
   PAYMENT SUMMARY
   ======================================== */

.payment-summary {
  background: #f7fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.8125rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 0.9375rem;
  color: #2d3748;
  font-weight: 600;
}

.summary-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  width: fit-content;
}

.summary-badge.current {
  background: #e6fffa;
  color: #047857;
}

.summary-badge.upgrade {
  background: #ede9fe;
  color: #6d28d9;
}

.amount-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-top: 1rem;
}

.amount-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2b6cb0;
}

/* ========================================
   PAYMENT METHODS
   ======================================== */

.payment-methods {
  margin-bottom: 1.5rem;
}

.method-grid {
  display: grid;
  gap: 0.75rem;
}

.method-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-card:hover:not(.disabled) {
  border-color: #cbd5e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.method-card.active {
  border-color: #667eea;
  background: #f8f9ff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.12);
}

.method-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f7fafc;
}

.method-radio {
  display: none;
}

.method-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
  border-radius: 10px;
  flex-shrink: 0;
}

.method-card.active .method-icon {
  background: #eef2ff;
}

.method-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.method-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.method-desc {
  font-size: 0.8125rem;
  color: #718096;
}

.method-status {
  font-size: 0.75rem;
  color: #f59e0b;
  font-weight: 600;
  margin-top: 0.25rem;
}

.method-check {
  width: 24px;
  height: 24px;
  color: #667eea;
  flex-shrink: 0;
}

/* ========================================
   SAVED CARDS
   ======================================== */

.saved-cards {
  margin-bottom: 1.5rem;
}

.cards-list {
  display: grid;
  gap: 0.75rem;
}

.card-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
}

.card-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
}

.card-option.active {
  border-color: #4c51bf;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.card-option.new-card {
  background: white;
  border: 2px dashed #cbd5e0;
}

.card-option.new-card:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.card-visual {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: white;
}

.card-option.new-card .card-visual {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  color: #4a5568;
}

.card-chip {
  width: 40px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 6px;
}

.card-number {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-type {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.new-card-icon {
  width: 48px;
  height: 48px;
  background: #edf2f7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  flex-shrink: 0;
}

.new-card-icon svg {
  width: 24px;
  height: 24px;
}

.new-card-text {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.card-select input[type="radio"] {
  width: 20px;
  height: 20px;
  accent-color: white;
}

.card-option.new-card .card-select input[type="radio"] {
  accent-color: #667eea;
}

/* ========================================
   PLAN SELECTION
   ======================================== */

.plan-selection {
  margin-bottom: 1.5rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.plan-card {
  position: relative;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-card:hover {
  border-color: #cbd5e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.plan-card.active {
  border-color: #667eea;
  background: #f8f9ff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.12);
}

.plan-card.featured {
  border-color: #6d28d9;
}

.plan-card.featured.active {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

.plan-badge {
  position: absolute;
  top: -12px;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #6d28d9, #7c3aed);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.plan-radio {
  display: none;
}

.plan-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.plan-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #2d3748;
}

.plan-price {
  font-size: 1.75rem;
  font-weight: 800;
  color: #667eea;
}

.plan-card.featured .plan-price {
  color: #6d28d9;
}

.currency {
  font-size: 1rem;
  font-weight: 600;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.plan-features li {
  font-size: 0.875rem;
  color: #4a5568;
  padding-left: 1.5rem;
  position: relative;
}

.plan-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #48bb78;
  font-weight: 700;
}

.plan-check {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 24px;
  height: 24px;
  color: #667eea;
}

.plan-card.featured .plan-check {
  color: #6d28d9;
}

/* ========================================
   LANGUAGE SELECTOR
   ======================================== */

.language-selector {
  margin-bottom: 1.5rem;
}

.language-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.language-label svg {
  width: 16px;
  height: 16px;
  color: #718096;
}

.language-select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9375rem;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.language-select:hover {
  border-color: #cbd5e0;
}

.language-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* ========================================
   PAYMENT BUTTON
   ======================================== */

.payment-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  letter-spacing: 0.025em;
}

.payment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.payment-btn:disabled {
  background: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-loading {
  display: flex;
  gap: 0.375rem;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ========================================
   SECURITY BADGE
   ======================================== */

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  border-radius: 10px;
}

.security-badge svg {
  width: 24px;
  height: 24px;
  color: #10b981;
  flex-shrink: 0;
}

.security-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.security-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #065f46;
}

.security-desc {
  font-size: 0.75rem;
  color: #047857;
}

/* ========================================
   BUTTONS
   ======================================== */

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex: 1;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  background: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
  flex: 1;
}

.btn-outline:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========================================
   OTP MODAL
   ======================================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: #718096;
  cursor: pointer;
  border-radius: 6px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover:not(:disabled) {
  background: #f7fafc;
  color: #2d3748;
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-desc {
  font-size: 0.9375rem;
  color: #718096;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.otp-container {
  display: flex;
  gap: 0.625rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.otp-input {
  width: 48px;
  height: 56px;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  color: #2d3748;
  transition: all 0.2s;
}

.otp-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.otp-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.otp-error svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

/* ========================================
   MODAL TRANSITIONS
   ======================================== */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card {
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to .modal-card {
  transform: scale(0.9) translateY(-20px);
}

/* ========================================
   RESPONSIVE
   ======================================== */

@media (max-width: 768px) {
  .checkout-main {
    padding: 1.5rem;
  }

  .checkout-title {
    font-size: 1.5rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .result-actions,
  .error-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .otp-input {
    width: 42px;
    height: 50px;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .universal-checkout {
    padding: 1rem 0.5rem;
  }

  .checkout-main {
    padding: 1.25rem;
  }

  .modal-card {
    padding: 1.5rem;
  }

  .otp-container {
    gap: 0.5rem;
  }

  .otp-input {
    width: 38px;
    height: 46px;
    font-size: 1.125rem;
  }
}
</style>