<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- Close Button -->
      <button class="close-btn" @click="closeModal" aria-label="Закрыть">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Header -->
      <div class="modal-header">
        <h3>🔒 Доступ к премиум-контенту</h3>
        <p class="modal-subtitle">Выберите способ получения доступа</p>
      </div>

      <!-- Plan Selection -->
      <div class="plan-selection">
        <h4>Выберите тариф:</h4>
        <div class="plans-grid">
          <div 
            class="plan-card" 
            :class="{ active: selectedPlan === 'start' }"
            @click="selectedPlan = 'start'"
          >
            <div class="plan-header">
              <h5>Start</h5>
              <div class="plan-price">2,600 сум</div>
            </div>
            <ul class="plan-features">
              <li>✅ Базовые курсы</li>
              <li>✅ Домашние задания</li>
              <li>✅ Основные тесты</li>
            </ul>
          </div>
          
          <div 
            class="plan-card recommended" 
            :class="{ active: selectedPlan === 'pro' }"
            @click="selectedPlan = 'pro'"
          >
            <div class="plan-badge">Рекомендуем</div>
            <div class="plan-header">
              <h5>Pro</h5>
              <div class="plan-price">4,550 сум</div>
            </div>
            <ul class="plan-features">
              <li>✅ Все курсы Start</li>
              <li>✅ Продвинутые курсы</li>
              <li>✅ Персональная аналитика</li>
              <li>✅ Приоритетная поддержка</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Promo Code Section -->
      <div class="promo-section">
        <h4>Или введите промокод:</h4>
        <div class="promo-input-group">
          <input
            v-model="promoCodeInput"
            placeholder="Введите промокод"
            class="promo-input"
            :disabled="loading"
            @keyup.enter="applyPromoCode"
          />
          <button 
            class="promo-btn" 
            @click="applyPromoCode"
            :disabled="loading || !selectedPlan || !promoCodeInput.trim()"
          >
            <span v-if="loading">⏳</span>
            <span v-else>🎟️</span>
            Применить
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="modal-actions">
        <button 
          class="payment-btn" 
          @click="proceedToPayment"
          :disabled="loading || !selectedPlan"
        >
          <span v-if="loading">⏳ Обработка...</span>
          <span v-else>💳 Оплатить {{ getPlanLabel(selectedPlan) }}</span>
        </button>
      </div>

      <!-- Messages -->
      <div v-if="error" class="message error-message">
        <span class="message-icon">❌</span>
        {{ error }}
      </div>
      
      <div v-if="success" class="message success-message">
        <span class="message-icon">✅</span>
        {{ success }}
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Обработка платежа...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { applyPromoCode } from '@/api/payments';

export default {
  name: 'PaymentModal',
  props: {
    userId: { 
      type: String, 
      required: true 
    },
    visible: { 
      type: Boolean, 
      default: false 
    },
    requestedTopicId: { 
      type: String, 
      default: '' 
    },
    defaultPlan: {
      type: String,
      default: 'start',
      validator: value => ['start', 'pro'].includes(value)
    }
  },
  emits: ['close', 'unlocked', 'payment-initiated'],
  data() {
    return {
      selectedPlan: this.defaultPlan,
      promoCodeInput: '',
      loading: false,
      error: '',
      success: ''
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
        // Focus on modal when opened for accessibility
        this.$nextTick(() => {
          this.$el?.focus();
        });
      }
    },
    selectedPlan() {
      this.clearMessages();
    },
    promoCodeInput() {
      this.clearMessages();
    }
  },
  methods: {
    closeModal() {
      if (!this.loading) {
        this.$emit('close');
      }
    },

    resetForm() {
      this.selectedPlan = this.defaultPlan;
      this.promoCodeInput = '';
      this.clearMessages();
    },

    clearMessages() {
      this.error = '';
      this.success = '';
    },

    getPlanLabel(plan) {
      const labels = {
        start: 'Start (2,600 сум)',
        pro: 'Pro (4,550 сум)'
      };
      return labels[plan] || plan;
    },

    async applyPromoCode() {
      if (!this.selectedPlan) {
        this.error = 'Пожалуйста, выберите тариф';
        return;
      }

      if (!this.promoCodeInput.trim()) {
        this.error = 'Введите промокод';
        return;
      }

      this.loading = true;
      this.clearMessages();

      try {
   

        const result = await applyPromoCode(
          this.userId,
          this.selectedPlan,
          this.promoCodeInput.trim()
        );

        if (result.success) {
          this.success = result.message;
          
          // Emit unlocked event with plan info
          this.$emit('unlocked', {
            plan: this.selectedPlan,
            method: 'promo',
            promoCode: this.promoCodeInput.trim()
          });

          // Auto-close after success
          setTimeout(() => {
            if (this.requestedTopicId) {
              this.$router.push({ 
                name: 'TopicOverview', 
                params: { id: this.requestedTopicId } 
              });
            }
            this.closeModal();
          }, 2000);

        } else {
          this.error = result.error;
        }

      } catch (err) {
        console.error('❌ Promo code application error:', err);
        this.error = 'Произошла ошибка при применении промокода';
      } finally {
        this.loading = false;
      }
    },

    async proceedToPayment() {
      if (!this.selectedPlan) {
        this.error = 'Пожалуйста, выберите тариф';
        return;
      }

      this.loading = true;
      this.clearMessages();

      try {
     

        // Emit payment initiation event
        this.$emit('payment-initiated', {
          plan: this.selectedPlan,
          userId: this.userId,
          requestedTopicId: this.requestedTopicId
        });

        // Navigate to payment page
        await this.$router.push({ 
          name: 'PaymePayment', 
          params: { plan: this.selectedPlan },
          query: {
            userId: this.userId,
            ...(this.requestedTopicId && { returnTo: this.requestedTopicId })
          }
        });

        // Close modal after navigation
        this.closeModal();

      } catch (err) {
        console.error('❌ Payment navigation error:', err);
        this.error = 'Ошибка при переходе к оплате';
      } finally {
        this.loading = false;
      }
    },

    // Keyboard navigation support
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-in-out;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 24px;
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  animation: slideIn 0.3s ease-out;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-header h3 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 8px;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.plan-selection h4,
.promo-section h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 16px;
}

.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.plan-card {
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: #fafafa;
}

.plan-card:hover {
  border-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.15);
}

.plan-card.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.2);
}

.plan-card.recommended {
  border-color: #059669;
}

.plan-card.recommended.active {
  border-color: #059669;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.2);
}

.plan-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.plan-header h5 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.plan-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #7c3aed;
  margin-bottom: 16px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  padding: 4px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.promo-input-group {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.promo-input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.promo-input:focus {
  border-color: #7c3aed;
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.promo-btn {
  padding: 14px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.promo-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.promo-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.payment-btn {
  padding: 16px 32px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.payment-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9, #5b21b6);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
}

.payment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-message {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 24px;
  z-index: 100;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left: 4px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 24px;
    margin: 20px;
    max-height: 95vh;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
  }
  
  .promo-input-group {
    flex-direction: column;
  }
  
  .plan-card {
    padding: 20px;
  }
}
</style>