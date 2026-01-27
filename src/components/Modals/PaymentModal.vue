<template>
  <div v-if="isOpen" class="payment-modal-overlay" @click.self="close">
    <div class="payment-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2>{{ $t('payment.premiumAccess') }}</h2>
        <button class="close-btn" @click="close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <p class="subtitle">{{ $t('payment.chooseAccessMethod') }}</p>

        <!-- Plan Selection -->
        <div class="plans-section">
          <h3>{{ $t('payment.selectPlan') }}</h3>
          
          <div class="plans-grid">
            <!-- Start Plan -->
            <div 
              class="plan-card"
              :class="{ selected: selectedPlan === 'start' }"
              @click="selectPlan('start')"
            >
              <div class="plan-header">
                <span class="plan-name">Start</span>
                <span class="plan-price">260,000 {{ $t('payment.sum') }}</span>
              </div>
              <ul class="plan-features">
                <li>{{ $t('payment.basicCourses') }}</li>
                <li>{{ $t('payment.homework') }}</li>
                <li>{{ $t('payment.basicTests') }}</li>
              </ul>
            </div>

            <!-- Pro Plan -->
            <div 
              class="plan-card pro"
              :class="{ selected: selectedPlan === 'pro' }"
              @click="selectPlan('pro')"
            >
              <div class="recommended-badge">{{ $t('payment.recommended') }}</div>
              <div class="plan-header">
                <span class="plan-name">Pro</span>
                <span class="plan-price">450,000 {{ $t('payment.sum') }}</span>
              </div>
              <ul class="plan-features">
                <li>{{ $t('payment.allStartCourses') }}</li>
                <li>{{ $t('payment.advancedCourses') }}</li>
                <li>{{ $t('payment.personalAnalytics') }}</li>
                <li>{{ $t('payment.prioritySupport') }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Promo Code Section -->
        <div class="promo-section">
          <h3>{{ $t('payment.orEnterPromo') }}</h3>
          <div class="promo-input-wrapper">
            <input 
              v-model="promoCode"
              type="text"
              :placeholder="$t('payment.enterPromoCode')"
              class="promo-input"
              :class="{ error: promoError, success: promoSuccess }"
            />
            <button 
              class="apply-btn"
              @click="applyPromoCode"
              :disabled="!promoCode || promoLoading"
            >
              {{ promoLoading ? '...' : $t('common.apply') }}
            </button>
          </div>
          <p v-if="promoError" class="error-message">{{ promoError }}</p>
          <p v-if="promoSuccess" class="success-message">{{ promoSuccess }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">
          {{ $t('common.cancel') }}
        </button>
        <button 
          class="pay-btn"
          @click="proceedToPayment"
          :disabled="!selectedPlan && !promoSuccess || isProcessing"
        >
          {{ isProcessing ? $t('payment.processing') : $t('payment.pay') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedPlan: null,
      promoCode: '',
      promoLoading: false,
      promoError: '',
      promoSuccess: '',
      isProcessing: false
    }
  },
  methods: {
    close() {
      this.$emit('close')
      this.resetState()
    },
    selectPlan(plan) {
      this.selectedPlan = plan
      this.promoError = ''
    },
    async applyPromoCode() {
      if (!this.promoCode) return
      
      this.promoLoading = true
      this.promoError = ''
      this.promoSuccess = ''
      
      try {
        const response = await fetch('/api/promo/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: this.promoCode })
        })
        
        const data = await response.json()
        
        if (data.valid) {
          this.promoSuccess = this.$t('success.promocodeApplied')
          this.selectedPlan = null
        } else {
          this.promoError = this.$t('settings.invalidPromocode')
        }
      } catch (error) {
        this.promoError = this.$t('payment.promoError')
      } finally {
        this.promoLoading = false
      }
    },
    async proceedToPayment() {
      if (!this.selectedPlan && !this.promoSuccess) {
        this.promoError = this.selectedPlan ? '' : this.$t('payment.selectPlanFirst')
        return
      }
      
      this.isProcessing = true
      
      try {
        const payload = this.promoSuccess 
          ? { promoCode: this.promoCode }
          : { plan: this.selectedPlan }
        
        const response = await fetch('/api/payment/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const data = await response.json()
        
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        }
      } catch (error) {
        this.promoError = this.$t('payment.paymentError')
      } finally {
        this.isProcessing = false
      }
    },
    resetState() {
      this.selectedPlan = null
      this.promoCode = ''
      this.promoError = ''
      this.promoSuccess = ''
      this.isProcessing = false
    }
  }
}
</script>

<style scoped>
.payment-modal-overlay {
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

.payment-modal {
  background: linear-gradient(135deg, rgba(30, 30, 45, 0.95), rgba(20, 20, 35, 0.98));
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 1.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  text-align: center;
}

.plans-section h3,
.promo-section h3 {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.plan-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.plan-card:hover {
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.plan-card.selected {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.15);
}

.plan-card.pro {
  border-color: rgba(236, 72, 153, 0.3);
}

.plan-card.pro.selected {
  border-color: #ec4899;
  background: rgba(236, 72, 153, 0.15);
}

.recommended-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
}

.plan-header {
  margin-bottom: 1rem;
}

.plan-name {
  display: block;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.plan-price {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  padding: 0.35rem 0;
  padding-left: 1.25rem;
  position: relative;
}

.plan-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
}

.promo-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.promo-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.promo-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.promo-input:focus {
  border-color: #8b5cf6;
}

.promo-input.error {
  border-color: #ef4444;
}

.promo-input.success {
  border-color: #10b981;
}

.promo-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.apply-btn {
  background: rgba(139, 92, 246, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.5);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.apply-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.5);
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.success-message {
  color: #10b981;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.875rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.pay-btn {
  flex: 1;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border: none;
  color: #fff;
  padding: 0.875rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.pay-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
}

.pay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>