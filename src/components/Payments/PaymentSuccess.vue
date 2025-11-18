<!-- src/components/Modals/PaymentSuccessModal.vue -->
<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- Close Button -->
      <button class="close-btn" @click="closeModal" aria-label="Закрыть">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Success Animation -->
      <div class="success-animation">
        <div class="checkmark">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" stroke-width="4" class="circle"/>
            <path d="M30 50 L45 65 L70 35" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" class="checkmark-path"/>
          </svg>
        </div>
      </div>

      <!-- Success Content -->
      <div class="success-content">
        <h1>🎉 Оплата успешна!</h1>
        <p class="success-message">
          Ваша подписка <span class="plan-name">{{ planName }}</span> активирована!<br>
          Теперь у вас есть доступ к премиум контенту.
        </p>

        <!-- Transaction Details -->
        <div class="transaction-details" v-if="transactionData">
          <h3>📄 Детали платежа</h3>
          <div class="detail-row">
            <span>Транзакция:</span>
            <code>{{ transactionData.id || transactionData.transactionId || 'N/A' }}</code>
          </div>
          <div class="detail-row" v-if="transactionData.plan || plan">
            <span>Тариф:</span>
            <span class="plan-badge">{{ planName }}</span>
          </div>
          <div class="detail-row" v-if="transactionData.amount">
            <span>Сумма:</span>
            <span class="amount">{{ formatAmount(transactionData.amount) }}</span>
          </div>
          <div class="detail-row">
            <span>Дата:</span>
            <span>{{ formatDate(new Date()) }}</span>
          </div>
        </div>

        <!-- Features Unlocked -->
        <div class="features-unlocked">
          <h3>🚀 Что теперь доступно:</h3>
          <ul class="features-list">
            <li v-for="feature in unlockedFeatures" :key="feature">
              <span class="check-icon">✅</span>
              {{ feature }}
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="modal-actions">
          <button @click="goToCourses" class="primary-btn">
            🎯 Начать обучение
          </button>
          <button @click="goToProfile" class="secondary-btn">
            👤 Мой профиль
          </button>
        </div>

        <!-- Help Section -->
        <div class="help-section">
          <p>Вопросы? Напишите нам: <a href="mailto:support@aced.live">support@aced.live</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentSuccessModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    transactionData: {
      type: Object,
      default: () => ({})
    },
    plan: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'go-to-courses', 'go-to-profile'],
  
  computed: {
    planName() {
      const currentPlan = this.plan || this.transactionData?.plan || '';
      const plans = {
        start: 'Start',
        pro: 'Pro',
        premium: 'Premium'
      };
      return plans[currentPlan] || 'Premium';
    },
    
    unlockedFeatures() {
      const currentPlan = this.plan || this.transactionData?.plan || 'start';
      const features = {
        start: [
          'Доступ к базовым курсам',
          'Домашние задания',
          'Основные тесты',
          'Прогресс-трекинг',
          'Базовая поддержка'
        ],
        pro: [
          'Все возможности Start',
          'Продвинутые курсы',
          'Персональная аналитика',
          'Приоритетная поддержка',
          'Эксклюзивные материалы',
          'Сертификаты об окончании'
        ]
      };
      return features[currentPlan] || features.start;
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        // Update user status when modal opens
        this.updateUserStatus();
        
        // Focus trap for accessibility
        this.$nextTick(() => {
          this.$el?.focus();
        });
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
      } else {
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
      }
    }
  },
  
  mounted() {
    // Handle escape key
    document.addEventListener('keydown', this.handleKeydown);
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
    // Restore body scroll
    document.body.style.overflow = '';
  },
  
  methods: {
    closeModal() {
      this.$emit('close');
    },

    async updateUserStatus() {
      try {
        // Update user subscription status in store
        if (this.$store.getters['user/isAuthenticated']) {
          await this.$store.dispatch('user/checkPendingPayments');
          await this.$store.dispatch('user/loadUserStatus');
        }
      } catch (error) {
}
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

    formatDate(date) {
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },

    goToCourses() {
      this.$emit('go-to-courses');
      this.closeModal();
      // Navigate to catalogue
      this.$router.push({ name: 'CataloguePage' });
    },

    goToProfile() {
      this.$emit('go-to-profile');
      this.closeModal();
      // Navigate to main profile page
      this.$router.push({ name: 'MainPage' });
    },

    handleKeydown(event) {
      if (event.key === 'Escape' && this.visible) {
        this.closeModal();
      }
    }
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-in-out;
}

.modal-content {
  background: white;
  padding: 40px;
  border-radius: 24px;
  max-width: 600px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  animation: slideIn 0.4s ease-out;
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

.success-animation {
  text-align: center;
  margin-bottom: 30px;
}

.checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  animation: bounce 0.6s ease-in-out;
}

.checkmark svg {
  width: 100%;
  height: 100%;
}

.circle {
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  animation: drawCircle 1s ease-in-out forwards;
}

.checkmark-path {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: drawCheck 0.5s ease-in-out 0.8s forwards;
}

.success-content {
  text-align: center;
}

.success-content h1 {
  color: #1f2937;
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.success-message {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 30px;
  line-height: 1.6;
}

.plan-name {
  color: #10b981;
  font-weight: 700;
}

.transaction-details {
  background: #f8fafc;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 30px;
  text-align: left;
}

.transaction-details h3 {
  color: #374151;
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
  border-bottom: 1px solid #e5e7eb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row code {
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.plan-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.amount {
  color: #10b981;
  font-weight: 700;
  font-size: 1.1rem;
}

.features-unlocked {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 30px;
  text-align: left;
  border: 2px solid #bbf7d0;
}

.features-unlocked h3 {
  color: #065f46;
  margin-bottom: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: #047857;
  font-weight: 500;
}

.check-icon {
  margin-right: 12px;
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.primary-btn, .secondary-btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  flex: 1;
  min-width: 160px;
}

.primary-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.primary-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.secondary-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.secondary-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.help-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.help-section p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.help-section a {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
}

.help-section a:hover {
  text-decoration: underline;
}

/* Animations */
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

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes drawCircle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes drawCheck {
  to {
    stroke-dashoffset: 0;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 32px 24px;
    margin: 20px;
    max-height: 95vh;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .primary-btn, .secondary-btn {
    flex: none;
    width: 100%;
  }
  
  .success-content h1 {
    font-size: 1.8rem;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    text-align: left;
  }
}
</style>