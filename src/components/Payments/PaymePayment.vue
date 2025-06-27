<template>
  <div class="payme-payment">
    <div class="payment-container">
      <!-- Header -->
      <div class="payment-header">
        <button class="back-btn" @click="goBack" aria-label="Назад">
          ← Назад
        </button>
        <h1>Оплата тарифа</h1>
      </div>

      <!-- Payment Form -->
      <div class="payment-box">
        <!-- Success State -->
        <div v-if="paymentSuccess" class="success-state">
          <div class="success-icon">🎉</div>
          <h2>Платёж успешно завершён!</h2>
          <p>Ваша подписка активирована. Доступ к премиум-контенту получен!</p>
          <div class="success-actions">
            <button @click="goToContent" class="primary-btn">
              🎯 Перейти к курсам
            </button>
          </div>
        </div>

        <!-- Cancelled State -->
        <div v-if="paymentCancelled" class="cancelled-state">
          <div class="cancelled-icon">❌</div>
          <h2>Платёж отменён</h2>
          <p>Вы отменили процесс оплаты. Попробуйте еще раз, когда будете готовы.</p>
          <div class="cancelled-actions">
            <button @click="resetPayment" class="primary-btn">
              🔄 Попробовать снова
            </button>
            <button @click="goBack" class="secondary-btn">
              🏠 На главную
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="criticalError" class="error-state">
          <div class="error-icon">⚠️</div>
          <h2>Системная ошибка</h2>
          <p>{{ criticalError }}</p>
          <div class="error-actions">
            <button @click="resetPayment" class="primary-btn">
              🔄 Попробовать снова
            </button>
            <button @click="contactSupport" class="secondary-btn">
              📞 Обратиться в поддержку
            </button>
          </div>
        </div>

        <!-- Regular Payment Form (hidden when success/cancelled/error) -->
        <div v-if="!paymentSuccess && !paymentCancelled && !criticalError">
          <!-- Plan Summary -->
          <div class="plan-summary">
            <div class="plan-info">
              <h2>{{ planDetails.label }}</h2>
              <div class="plan-price">{{ planDetails.formattedPrice }}</div>
              <ul class="plan-features">
                <li v-for="feature in planDetails.features" :key="feature">
                  ✓ {{ feature }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Payment Steps -->
          <div class="payment-steps">
            <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
              <div class="step-number">1</div>
              <span>Проверка данных</span>
            </div>
            <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
              <div class="step-number">2</div>
              <span>Инициация платежа</span>
            </div>
            <div class="step" :class="{ active: currentStep >= 3 }">
              <div class="step-number">3</div>
              <span>Оплата</span>
            </div>
          </div>

          <!-- Rate Limit Warning -->
          <div v-if="showRateWarning" class="rate-warning">
            <span class="warning-icon">⚠️</span>
            <div>
              <strong>Слишком много попыток</strong>
              <p>Подождите {{ rateLimitCooldown }} секунд перед следующей попыткой</p>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handlePayment" class="payment-form">
            <!-- User Information -->
            <div class="form-section">
              <h3>Информация об аккаунте</h3>
              <div class="form-group">
                <label for="userId">ID пользователя</label>
                <input
                  id="userId"
                  type="text"
                  v-model="form.userId"
                  placeholder="Ваш ID пользователя"
                  required
                  :disabled="loading || showRateWarning"
                />
                <button 
                  type="button" 
                  class="validate-btn"
                  @click="validateUser"
                  :disabled="loading || !form.userId.trim() || showRateWarning"
                >
                  {{ userValidation.loading ? '⏳' : userValidation.valid ? '✅' : '🔍' }}
                  Проверить
                </button>
              </div>
              
              <div class="form-group">
                <label for="name">Имя пользователя</label>
                <input
                  id="name"
                  type="text"
                  v-model="form.name"
                  placeholder="Как указано при регистрации"
                  required
                  :disabled="loading || showRateWarning"
                />
              </div>
            </div>

            <!-- Contact Information -->
            <div class="form-section">
              <h3>Контактная информация</h3>
              <div class="form-group">
                <label for="phone">Номер телефона</label>
                <input
                  id="phone"
                  type="tel"
                  v-model="form.phone"
                  placeholder="+998 90 123 45 67"
                  required
                  :disabled="loading || showRateWarning"
                  @input="formatPhone"
                />
              </div>
            </div>

            <!-- Promo Code -->
            <div class="form-section">
              <h3>Промокод (необязательно)</h3>
              <div class="form-group promo-group">
                <input
                  type="text"
                  v-model="form.promoCode"
                  placeholder="Введите промокод"
                  :disabled="loading || showRateWarning"
                  @keyup.enter="applyPromoCode"
                />
                <button 
                  type="button"
                  class="promo-apply-btn"
                  @click="applyPromoCode"
                  :disabled="loading || !form.promoCode.trim() || showRateWarning || promoAttemptLimited"
                >
                  {{ promoAttemptLimited ? `⏳ ${promoTimeLeft}s` : 'Применить' }}
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="payment-submit-btn"
              :disabled="loading || !isFormValid || showRateWarning || paymentAttemptLimited"
            >
              <span v-if="loading" class="loading-text">
                <div class="spinner-small"></div>
                {{ loadingText }}
              </span>
              <span v-else-if="paymentAttemptLimited" class="limited-text">
                ⏳ Подождите {{ paymentTimeLeft }}s
              </span>
              <span v-else class="submit-text">
                💳 Оплатить {{ planDetails.formattedPrice }}
              </span>
            </button>
          </form>

          <!-- Regular Messages -->
          <div v-if="error && !paymentCancelled && !criticalError" class="message error-message">
            <span class="message-icon">❌</span>
            <div>
              <strong>Ошибка:</strong>
              <p>{{ error }}</p>
            </div>
          </div>

          <div v-if="success && !paymentSuccess" class="message success-message">
            <span class="message-icon">✅</span>
            <div>
              <strong>Успех:</strong>
              <p>{{ success }}</p>
            </div>
          </div>

          <div v-if="promoSuccess" class="message success-message">
            <span class="message-icon">🎉</span>
            <div>
              <strong>Промокод применён!</strong>
              <p>{{ promoSuccess }}</p>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="payment-info">
            <h4>💡 Информация об оплате</h4>
            <ul>
              <li>💳 Оплата через систему PayMe</li>
              <li>🔒 Безопасная обработка платежей</li>
              <li>⚡ Мгновенная активация после оплаты</li>
              <li>🔄 Возможность возврата в течение 14 дней</li>
              <li>🛡️ Защита от мошенничества</li>
            </ul>
          </div>

          <!-- Transaction Tracking -->
          <div v-if="transaction" class="transaction-status">
            <h4>📊 Статус транзакции</h4>
            <div class="transaction-info">
              <div class="transaction-row">
                <span>ID транзакции:</span>
                <code>{{ transaction.id }}</code>
              </div>
              <div class="transaction-row">
                <span>Статус:</span>
                <span class="status-badge" :class="getStatusClass(transaction.state)">
                  {{ getStatusText(transaction.state) }}
                </span>
              </div>
              <div class="transaction-row">
                <span>Сумма:</span>
                <span>{{ formatAmount(transaction.amount) }}</span>
              </div>
            </div>
            
            <button 
              class="check-status-btn"
              @click="checkTransactionStatus"
              :disabled="statusLoading"
            >
              {{ statusLoading ? '⏳ Проверка...' : '🔄 Обновить статус' }}
            </button>
          </div>

          <!-- System Status -->
          <div v-if="showSystemInfo" class="system-info">
            <h4>🔧 Информация о системе</h4>
            <div class="system-details">
              <div class="system-row">
                <span>Попыток оплаты:</span>
                <span>{{ paymentAttempts }}/3</span>
              </div>
              <div class="system-row">
                <span>Попыток промокода:</span>
                <span>{{ promoAttempts }}/3</span>
              </div>
              <div class="system-row">
                <span>Статус API:</span>
                <span :class="apiStatus.connected ? 'status-online' : 'status-offline'">
                  {{ apiStatus.connected ? '🟢 Онлайн' : '🔴 Офлайн' }}
                </span>
              </div>
            </div>
            <button @click="showSystemInfo = false" class="close-info-btn">
              Скрыть
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading && currentStep >= 2" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>{{ loadingText }}</h3>
        <p>Пожалуйста, не закрывайте страницу</p>
        <div class="loading-steps">
          <div v-for="(step, index) in loadingSteps" :key="index" 
               class="loading-step" 
               :class="{ active: index <= currentLoadingStep }">
            {{ step }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  initiatePaymePayment, 
  applyPromoCode, 
  checkPaymentStatus, 
  getPaymentAmounts,
  formatPaymentAmount,
  getTransactionStateText,
  handlePaymentError,
  resetPaymentAttempts,
  checkApiHealth
} from '@/api';
import api from '@/api';

export default {
  name: 'PaymePayment',
  props: {
    plan: {
      type: String,
      required: true,
      validator: value => ['start', 'pro'].includes(value)
    }
  },
  data() {
    return {
      currentStep: 1,
      currentLoadingStep: 0,
      form: {
        userId: '',
        name: '',
        phone: '',
        promoCode: ''
      },
      loading: false,
      statusLoading: false,
      paymentSuccess: false,
      paymentCancelled: false,
      criticalError: '',
      loadingText: 'Подготовка к оплате...',
      error: '',
      success: '',
      promoSuccess: '',
      transaction: null,
      userValidation: {
        loading: false,
        valid: null,
        user: null
      },
      pollInterval: null,
      loadingSteps: [
        '🔍 Проверка данных',
        '🔧 Создание транзакции',
        '💳 Перенаправление в PayMe',
        '✅ Завершение'
      ],
      // Rate limiting and attempt tracking
      paymentAttempts: 0,
      promoAttempts: 0,
      paymentAttemptLimited: false,
      promoAttemptLimited: false,
      paymentTimeLeft: 0,
      promoTimeLeft: 0,
      showRateWarning: false,
      rateLimitCooldown: 0,
      cooldownInterval: null,
      // System monitoring
      apiStatus: {
        connected: true,
        lastCheck: Date.now()
      },
      showSystemInfo: false,
      // Error recovery
      retryCount: 0,
      maxRetries: 3
    };
  },
  computed: {
    planDetails() {
      const amounts = getPaymentAmounts();
      const planData = amounts[this.plan];
      
      console.log('💰 Plan details debug:', {
        plan: this.plan,
        amounts,
        planData,
        uzs: planData?.uzs,
        tiyin: planData?.tiyin
      });
      
      const features = {
        start: [
          'Доступ к базовым курсам',
          'Домашние задания',
          'Основные тесты',
          'Прогресс-трекинг'
        ],
        pro: [
          'Все возможности Start',
          'Продвинутые курсы',
          'Персональная аналитика',
          'Приоритетная поддержка',
          'Эксклюзивные материалы'
        ]
      };

      // Enhanced amount formatting with error handling
      let formattedPrice;
      let actualPrice;
      
      try {
        if (planData) {
          actualPrice = planData.uzs || (planData.tiyin ? planData.tiyin / 100 : 0);
          formattedPrice = formatPaymentAmount(actualPrice, 'UZS');
        } else {
          const fallbackAmounts = {
            start: 260000, // 260,000 UZS
            pro: 455000    // 455,000 UZS
          };
          actualPrice = fallbackAmounts[this.plan] || 0;
          formattedPrice = `${actualPrice.toLocaleString('uz-UZ')} сум`;
        }
      } catch (formatError) {
        console.warn('⚠️ Format error, using fallback:', formatError);
        actualPrice = this.plan === 'start' ? 260000 : 455000;
        formattedPrice = `${actualPrice.toLocaleString('uz-UZ')} сум`;
      }
      
      console.log('💰 Final amount:', { actualPrice, formattedPrice });

      return {
        label: planData?.label || (this.plan === 'start' ? 'Start' : 'Pro'),
        price: actualPrice,
        formattedPrice: formattedPrice,
        features: features[this.plan] || []
      };
    },

    isFormValid() {
      return (
        this.form.userId.trim() &&
        this.form.name.trim() &&
        this.form.phone.trim() &&
        this.userValidation.valid !== false &&
        !this.showRateWarning
      );
    }
  },
  async mounted() {
    await this.initializeForm();
    await this.checkSystemHealth();
    this.validateUser();
    this.setupErrorRecovery();
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    async initializeForm() {
      // Auto-fill user ID from various sources
      const userId = 
        this.$route.query.userId ||
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId') ||
        this.$store.getters['user/getUser']?.firebaseId;
      
      if (userId) {
        this.form.userId = userId;
      }

      // Auto-fill user name if available
      const user = this.$store.getters['user/getUser'];
      if (user?.name) {
        this.form.name = user.name;
      }

      // Reset payment attempts if this is a fresh session
      const lastReset = localStorage.getItem('lastPaymentReset');
      const now = Date.now();
      if (!lastReset || now - parseInt(lastReset) > 300000) { // 5 minutes
        resetPaymentAttempts(userId);
        localStorage.setItem('lastPaymentReset', now.toString());
      }
    },

    async checkSystemHealth() {
      try {
        const health = await checkApiHealth();
        this.apiStatus.connected = health.success;
        this.apiStatus.lastCheck = Date.now();
        
        if (!health.success) {
          console.warn('⚠️ API health check failed:', health.error);
        }
      } catch (error) {
        console.error('❌ System health check failed:', error);
        this.apiStatus.connected = false;
      }
    },

    setupErrorRecovery() {
      // Check API status periodically
      this.statusInterval = setInterval(() => {
        this.checkSystemHealth();
      }, 30000); // Every 30 seconds
    },

    formatPhone() {
      // Remove all non-digits
      let phone = this.form.phone.replace(/\D/g, '');
      
      // Add +998 prefix if not present and format
      if (phone.length > 0 && !phone.startsWith('998')) {
        if (phone.startsWith('9')) {
          phone = '998' + phone;
        }
      }
      
      // Format as +998 XX XXX XX XX
      if (phone.startsWith('998') && phone.length <= 12) {
        const formatted = phone.replace(/^998/, '+998 ')
          .replace(/(\+998 \d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        this.form.phone = formatted;
      }
    },

    // Enhanced user validation with rate limiting
    async validateUser() {
      if (!this.form.userId.trim()) {
        this.userValidation = { loading: false, valid: false, user: null };
        return;
      }

      this.userValidation.loading = true;
      this.clearMessages();

      try {
        console.log('🔍 Validating user:', this.form.userId.trim());
        
        const response = await api.get(`/payments/validate-user/${this.form.userId.trim()}`);
        
        console.log('✅ Validation response:', response.data);
        
        this.userValidation = {
          loading: false,
          valid: response.data.valid,
          user: response.data.user
        };

        if (response.data.valid && response.data.user) {
          if (response.data.user.name && !this.form.name) {
            this.form.name = response.data.user.name;
          }
          this.success = `✅ Пользователь найден: ${response.data.user.name}`;
        } else {
          this.error = 'Пользователь не найден. Проверьте ID.';
        }

      } catch (err) {
        console.error('❌ User validation error:', err);
        this.userValidation = { loading: false, valid: false, user: null };
        
        // Enhanced error handling
        if (err.message?.includes('Direct browser access')) {
          this.criticalError = 'Ошибка конфигурации системы. Обратитесь в поддержку.';
        } else if (err.response?.status === 404) {
          this.error = 'Пользователь не найден. Проверьте ID.';
        } else if (err.response?.status === 429) {
          this.handleRateLimit();
        } else if (err.response?.status >= 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = 'Ошибка проверки пользователя';
        }
      }
    },

    // Enhanced promo code application with rate limiting
    async applyPromoCode() {
      if (!this.form.promoCode.trim()) {
        this.error = 'Введите промокод';
        return;
      }

      if (!this.form.userId.trim()) {
        this.error = 'Сначала укажите ID пользователя';
        return;
      }

      if (this.promoAttempts >= 3) {
        this.handlePromoRateLimit();
        return;
      }

      this.loading = true;
      this.promoAttempts++;
      this.clearMessages();

      try {
        const result = await applyPromoCode(
          this.form.userId.trim(),
          this.plan,
          this.form.promoCode.trim()
        );

        if (result.success) {
          this.promoSuccess = result.message;
          
          // Show success state first, then redirect
          setTimeout(() => {
            this.paymentSuccess = true;
            
            // Update store if available
            if (this.$store.getters['user/isAuthenticated']) {
              this.$store.dispatch('user/checkPendingPayments');
            }
            
            setTimeout(() => {
              const returnTo = this.$route.query.returnTo;
              if (returnTo) {
                this.$router.push({ name: 'TopicOverview', params: { id: returnTo } });
              } else {
                this.$router.push({ name: 'MainPage' });
              }
            }, 3000);
          }, 1000);

        } else {
          this.error = result.error;
          
          // Handle specific promo code errors
          if (result.error?.includes('Слишком много попыток')) {
            this.handlePromoRateLimit();
          }
        }

      } catch (err) {
        console.error('❌ Promo code error:', err);
        
        if (err.message?.includes('Direct browser access')) {
          this.criticalError = 'Ошибка конфигурации платежной системы. Обратитесь в поддержку.';
        } else if (err.message?.includes('Слишком много попыток')) {
          this.handlePromoRateLimit();
        } else {
          this.error = handlePaymentError(err, 'Применение промокода');
        }
      } finally {
        this.loading = false;
      }
    },

    // Enhanced payment handling with comprehensive error recovery
    async handlePayment() {
      if (!this.isFormValid) {
        this.error = 'Пожалуйста, заполните все поля корректно';
        return;
      }

      if (this.paymentAttempts >= 3) {
        this.handlePaymentRateLimit();
        return;
      }

      this.loading = true;
      this.currentStep = 2;
      this.currentLoadingStep = 0;
      this.paymentAttempts++;
      this.clearMessages();

      try {
        // Step 1: Validate data
        this.loadingText = 'Проверка данных...';
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.currentLoadingStep = 1;

        // Step 2: Create transaction with enhanced error handling
        this.loadingText = 'Создание транзакции...';
        
        const result = await initiatePaymePayment(
          this.form.userId.trim(),
          this.plan,
          {
            name: this.form.name.trim(),
            phone: this.form.phone.trim()
          }
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        this.transaction = result.transaction;
        this.currentLoadingStep = 2;

        // Step 3: Redirect to PayMe
        this.loadingText = 'Перенаправление в PayMe...';
        this.currentStep = 3;
        
        if (result.paymentUrl) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          this.currentLoadingStep = 3;
          
          // Enhanced redirect with fallback
          try {
            window.location.href = result.paymentUrl;
          } catch (redirectError) {
            console.error('❌ Redirect failed:', redirectError);
            this.error = 'Ошибка перенаправления. Попробуйте открыть ссылку вручную.';
            
            // Show manual link
            const link = document.createElement('a');
            link.href = result.paymentUrl;
            link.target = '_blank';
            link.textContent = 'Открыть ссылку для оплаты';
            link.style.display = 'block';
            link.style.margin = '10px 0';
            link.style.color = '#667eea';
            
            const errorElement = document.querySelector('.error-message');
            if (errorElement) {
              errorElement.appendChild(link);
            }
          }
        } else {
          throw new Error('Не получена ссылка для оплаты');
        }

      } catch (err) {
        console.error('❌ Payment initiation error:', err);
        
        // Enhanced error handling
        if (err.message?.includes('Direct browser access')) {
          this.criticalError = 'Ошибка конфигурации платежной системы. Обратитесь в поддержку.';
        } else if (err.message?.includes('Слишком много попыток')) {
          this.handlePaymentRateLimit();
        } else if (err.response?.status === 429) {
          this.handleRateLimit();
        } else {
          this.error = handlePaymentError(err, 'Инициация платежа');
          
          // Auto-retry for network errors
          if (this.retryCount < this.maxRetries && 
              (err.message?.includes('timeout') || err.message?.includes('network'))) {
            this.retryCount++;
            setTimeout(() => {
              console.log(`🔄 Auto-retry attempt ${this.retryCount}`);
              this.handlePayment();
            }, 2000 * this.retryCount);
          }
        }
        
        this.currentStep = 1;
      } finally {
        this.loading = false;
      }
    },

    async checkTransactionStatus() {
      if (!this.transaction?.id) return;

      this.statusLoading = true;
      this.clearMessages();

      try {
        const result = await checkPaymentStatus(
          this.transaction.id,
          this.form.userId.trim()
        );

        if (result.success) {
          this.transaction = { ...this.transaction, ...result.transaction };
          
          // Handle completed payment
          if (result.transaction.state === 2) {
            this.paymentSuccess = true;
            this.success = 'Платёж успешно завершён! Доступ к курсам активирован.';
            
            // Update user status in store
            if (this.$store.getters['user/isAuthenticated']) {
              this.$store.dispatch('user/checkPendingPayments');
            }
            
            // Show success state for a moment, then redirect
            setTimeout(() => {
              const returnTo = this.$route.query.returnTo;
              if (returnTo) {
                this.$router.push({ name: 'TopicOverview', params: { id: returnTo } });
              } else {
                this.$router.push({ name: 'MainPage' });
              }
            }, 4000);
          } else if (result.transaction.state === -1) {
            this.paymentCancelled = true;
            this.error = 'Платёж был отменён. Попробуйте еще раз.';
          } else if (result.transaction.state === -2) {
            this.error = 'Платёж был возвращён. Обратитесь в поддержку.';
          }
        } else {
          this.error = result.error;
        }

      } catch (err) {
        console.error('❌ Status check error:', err);
        this.error = handlePaymentError(err, 'Проверка статуса');
      } finally {
        this.statusLoading = false;
      }
    },

    // Rate limiting handlers
    handleRateLimit() {
      this.showRateWarning = true;
      this.rateLimitCooldown = 60; // 1 minute
      
      this.cooldownInterval = setInterval(() => {
        this.rateLimitCooldown--;
        if (this.rateLimitCooldown <= 0) {
          this.showRateWarning = false;
          clearInterval(this.cooldownInterval);
        }
      }, 1000);
    },

    handlePaymentRateLimit() {
      this.paymentAttemptLimited = true;
      this.paymentTimeLeft = 30; // 30 seconds
      
      const interval = setInterval(() => {
        this.paymentTimeLeft--;
        if (this.paymentTimeLeft <= 0) {
          this.paymentAttemptLimited = false;
          clearInterval(interval);
        }
      }, 1000);
    },

    handlePromoRateLimit() {
      this.promoAttemptLimited = true;
      this.promoTimeLeft = 20; // 20 seconds
      
      const interval = setInterval(() => {
        this.promoTimeLeft--;
        if (this.promoTimeLeft <= 0) {
          this.promoAttemptLimited = false;
          clearInterval(interval);
        }
      }, 1000);
    },

    // Utility methods
    getStatusClass(state) {
      const stateInfo = getTransactionStateText(state);
      return `status-${stateInfo.color}`;
    },

    getStatusText(state) {
      const stateInfo = getTransactionStateText(state);
      return `${stateInfo.icon} ${stateInfo.text}`;
    },

    formatAmount(amount) {
      try {
        return formatPaymentAmount(amount / 100, 'UZS');
      } catch (error) {
        console.warn('⚠️ Amount formatting failed:', error);
        return `${(amount / 100).toLocaleString('uz-UZ')} сум`;
      }
    },

    clearMessages() {
      this.error = '';
      this.success = '';
      this.promoSuccess = '';
      this.criticalError = '';
    },

    // Navigation methods
    goBack() {
      if (this.loading) return;
      this.$router.go(-1);
    },

    goToContent() {
      const returnTo = this.$route.query.returnTo;
      if (returnTo) {
        this.$router.push({ name: 'TopicOverview', params: { id: returnTo } });
      } else {
        this.$router.push({ name: 'MainPage' });
      }
    },

    resetPayment() {
      this.paymentCancelled = false;
      this.paymentSuccess = false;
      this.criticalError = '';
      this.transaction = null;
      this.currentStep = 1;
      this.paymentAttempts = 0;
      this.promoAttempts = 0;
      this.retryCount = 0;
      this.clearMessages();
      
      // Reset rate limiting
      this.paymentAttemptLimited = false;
      this.promoAttemptLimited = false;
      this.showRateWarning = false;
      
      // Clear any running intervals
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
      }
      
      // Reset payment attempts in API
      if (this.form.userId) {
        resetPaymentAttempts(this.form.userId);
      }
    },

    contactSupport() {
      // Open support contact method
      const supportUrl = 'https://t.me/aced_support'; // Replace with actual support URL
      window.open(supportUrl, '_blank');
    },

    toggleSystemInfo() {
      this.showSystemInfo = !this.showSystemInfo;
    },

    // Cleanup method
    cleanup() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
      }
      if (this.cooldownInterval) {
        clearInterval(this.cooldownInterval);
      }
    }
  }
};
</script>

<style scoped>
.payme-payment {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.payment-container {
  max-width: 800px;
  margin: 0 auto;
}

.payment-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 20px;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.payment-header h1 {
  color: white;
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

.payment-box {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

/* Success, Cancelled, and Error States */
.success-state,
.cancelled-state,
.error-state {
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  text-align: center;
  margin: 20px 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.success-state {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border: 2px solid #10b981;
}

.cancelled-state {
  background: linear-gradient(135deg, #fef2f2 0%, #fef7f7 100%);
  border: 2px solid #ef4444;
}

.error-state {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #f59e0b;
}

.success-icon,
.cancelled-icon,
.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  display: block;
}

.success-state h2 {
  color: #065f46;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.cancelled-state h2 {
  color: #991b1b;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.error-state h2 {
  color: #92400e;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.success-state p,
.cancelled-state p,
.error-state p {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 32px;
  line-height: 1.6;
}

.success-actions,
.cancelled-actions,
.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
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
}

/* Rate Warning */
.rate-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.warning-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  color: #92400e;
}

.rate-warning strong {
  color: #92400e;
  display: block;
  margin-bottom: 4px;
}

.rate-warning p {
  color: #78350f;
  margin: 0;
  font-size: 0.9rem;
}

.plan-summary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 30px;
}

.plan-info h2 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 10px;
}

.plan-price {
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: 20px;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  padding: 8px 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.payment-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
}

.payment-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  background: white;
  padding: 0 10px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: #667eea;
  color: white;
}

.step.completed .step-number {
  background: #10b981;
  color: white;
}

.step span {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
  margin-top: 8px;
}

.step.active span,
.step.completed span {
  color: #1f2937;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f3f4f6;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-group.promo-group {
  flex-direction: row;
  gap: 12px;
}

.form-group.promo-group input {
  flex: 1;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.validate-btn,
.promo-apply-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.validate-btn:hover:not(:disabled),
.promo-apply-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.validate-btn:disabled,
.promo-apply-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.validate-btn {
  position: absolute;
  right: 8px;
  top: 32px;
  padding: 10px 16px;
  font-size: 0.9rem;
}

.payment-submit-btn {
  padding: 18px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.payment-submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.payment-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.loading-text,
.submit-text,
.limited-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-left: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.message {
  padding: 16px 20px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
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

.message-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.payment-info {
  background: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  margin-top: 30px;
}

.payment-info h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.payment-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.payment-info li {
  padding: 6px 0;
  color: #4b5563;
  font-size: 0.95rem;
}

.transaction-status {
  background: #f1f5f9;
  padding: 24px;
  border-radius: 12px;
  margin-top: 20px;
}

.transaction-status h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.transaction-info {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.transaction-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.transaction-row:last-child {
  border-bottom: none;
}

.transaction-row code {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-success {
  background: #d1fae5;
  color: #065f46;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.status-online {
  color: #059669;
  font-weight: 600;
}

.status-offline {
  color: #dc2626;
  font-weight: 600;
}

.check-status-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.check-status-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-1px);
}

.check-status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* System Info */
.system-info {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.system-info h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 16px;
}

.system-details {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.system-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
}

.system-row:last-child {
  border-bottom: none;
}

.close-info-btn {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.close-info-btn:hover {
  background: #d1d5db;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e5e7eb;
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

.loading-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.loading-content p {
  color: #6b7280;
  margin-bottom: 24px;
}

.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-step {
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
}

.loading-step.active {
  background: #dbeafe;
  color: #1e40af;
  font-weight: 600;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .payme-payment {
    padding: 10px;
  }
  
  .payment-box {
    padding: 24px;
  }
  
  .payment-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .payment-steps {
    flex-direction: column;
    gap: 20px;
  }
  
  .payment-steps::before {
    display: none;
  }
  
  .form-group.promo-group {
    flex-direction: column;
  }
  
  .validate-btn {
    position: static;
    margin-top: 8px;
    align-self: flex-start;
  }
  
  .plan-features {
    columns: 1;
  }
  
  .transaction-row,
  .system-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .success-actions,
  .cancelled-actions,
  .error-actions {
    flex-direction: column;
  }

  .success-state,
  .cancelled-state,
  .error-state {
    padding: 40px 24px;
  }
}

@media (max-width: 480px) {
  .payment-header h1 {
    font-size: 1.5rem;
  }
  
  .plan-price {
    font-size: 2rem;
  }
  
  .payment-submit-btn {
    font-size: 1rem;
    padding: 16px 24px;
  }

  .success-state h2,
  .cancelled-state h2,
  .error-state h2 {
    font-size: 1.5rem;
  }

  .success-icon,
  .cancelled-icon,
  .error-icon {
    font-size: 3rem;
  }

  .rate-warning {
    flex-direction: column;
    text-align: center;
  }
}
</style>