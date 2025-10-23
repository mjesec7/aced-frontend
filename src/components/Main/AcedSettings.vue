<template>
  <div class="settings-page">
    <!-- Enhanced Header with more padding -->
    <div class="settings-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="header-title">⚙️ Настройки профиля</h1>
          <p class="header-subtitle">Управление вашим аккаунтом и подпиской</p>
        </div>
        <button class="back-button" @click="goToProfile">
          <span class="back-icon">←</span>
          В профиль
        </button>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="settings-container">
      
      <!-- Notification -->
      <div v-if="notification" class="notification" :class="notificationClass">
        <span class="notification-icon">{{ notificationIcon }}</span>
        <span class="notification-text">{{ notification }}</span>
      </div>

      <!-- Personal Information Card -->
      <div class="settings-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">👤 Личная информация</h2>
            <p class="card-subtitle">Ваши персональные данные</p>
          </div>
          <button 
            v-if="!isEditingName" 
            @click="startEditingName"
            class="edit-button"
            title="Редактировать"
          >
            <span class="edit-icon">✏️</span>
          </button>
          <div v-else class="edit-actions">
            <button @click="saveNameChanges" class="save-button" title="Сохранить">
              <span>✓</span>
            </button>
            <button @click="cancelEditingName" class="cancel-button" title="Отмена">
              <span>✕</span>
            </button>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Имя</label>
            <input 
              v-if="isEditingName"
              type="text" 
              v-model="tempUser.name" 
              placeholder="Введите имя"
              class="form-input editing"
            />
            <div v-else class="form-display">
              {{ user.name || 'Не указано' }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Фамилия</label>
            <input 
              v-if="isEditingName"
              type="text" 
              v-model="tempUser.surname" 
              placeholder="Введите фамилию"
              class="form-input editing"
            />
            <div v-else class="form-display">
              {{ user.surname || 'Не указано' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Security Settings Card -->
      <div class="settings-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">🔐 Безопасность</h2>
            <p class="card-subtitle">Email и пароль</p>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email адрес</label>
          <input 
            type="email" 
            v-model="user.email" 
            placeholder="your.email@example.com"
            class="form-input"
            :disabled="loading" 
          />
        </div>

        <div v-if="!isGoogleUser" class="password-section">
          <div class="form-group">
            <label class="form-label">Текущий пароль</label>
            <input 
              type="password" 
              v-model="oldPassword" 
              placeholder="Введите текущий пароль"
              class="form-input"
              :disabled="loading" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Новый пароль</label>
            <input 
              type="password" 
              v-model="newPassword" 
              placeholder="Введите новый пароль"
              class="form-input"
              :disabled="loading" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">Подтвердите новый пароль</label>
            <input 
              type="password" 
              v-model="confirmPassword" 
              placeholder="Повторите новый пароль"
              class="form-input"
              :disabled="loading" 
            />
          </div>
        </div>

        <button class="link-button" @click="sendPasswordReset">
          {{ isGoogleUser ? '🔑 Создать пароль' : '🔑 Забыли пароль?' }}
        </button>

        <div class="action-buttons">
          <button 
            class="primary-button" 
            @click="saveChanges"
            :disabled="loading"
          >
            {{ loading ? '⏳ Сохранение...' : '💾 Сохранить изменения' }}
          </button>
        </div>
      </div>

      <!-- Subscription Card -->
      <div class="settings-card subscription-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">💎 Подписка и оплата</h2>
            <p class="card-subtitle">Управление тарифом</p>
          </div>
        </div>

        <!-- Current Plan Display -->
        <div class="current-plan-display">
          <div class="plan-badge-wrapper">
            <span class="plan-label">Текущий тариф:</span>
            <span :class="['plan-badge', currentPlanClass]">
              {{ currentPlanLabel }}
            </span>
          </div>
          
          <p class="plan-description">{{ currentPlanDescription }}</p>
          
          <!-- Subscription Details -->
          <div v-if="subscriptionExpiryInfo" class="subscription-details">
            <div class="expiry-info" :class="{
              'expiry-warning': subscriptionExpiryInfo.isExpiring,
              'expiry-expired': subscriptionExpiryInfo.isExpired
            }">
              <div class="expiry-main">
                <span class="expiry-icon">
                  {{ subscriptionExpiryInfo.isExpired ? '❌' : '📅' }}
                </span>
                <div class="expiry-content">
                  <div class="expiry-label">
                    {{ subscriptionExpiryInfo.isExpired ? 'Срок действия истёк:' : 'Активен до:' }}
                  </div>
                  <div class="expiry-date">{{ subscriptionExpiryInfo.formattedDate }}</div>
                  <div v-if="!subscriptionExpiryInfo.isExpired" class="expiry-countdown">
                    ⏰ Осталось: {{ subscriptionExpiryInfo.timeRemaining }} ({{ subscriptionExpiryInfo.daysRemaining }} дней)
                  </div>
                </div>
              </div>
            </div>

            <!-- Warning Alert -->
            <div v-if="subscriptionExpiryInfo.isExpiring && !subscriptionExpiryInfo.isExpired" class="warning-alert">
              <span class="warning-icon">⚠️</span>
              <div class="warning-content">
                <strong>Внимание!</strong> Ваша подписка истекает через {{ subscriptionExpiryInfo.daysRemaining }} дней.
                <br>
                <small>Продлите подписку, чтобы не потерять доступ к премиум-функциям.</small>
              </div>
            </div>
          </div>

          <!-- Subscription Benefits -->
          <div v-if="currentPlan !== 'free'" class="benefits-section">
            <div class="benefits-header">
              <span class="benefits-icon">✨</span>
              <span class="benefits-title">Активные возможности:</span>
            </div>
            <ul class="benefits-list">
              <li v-if="currentPlan === 'start' || currentPlan === 'pro'">
                ✅ Безлимитные сообщения
              </li>
              <li v-if="currentPlan === 'start' || currentPlan === 'pro'">
                ✅ Доступ к премиум курсам
              </li>
              <li v-if="currentPlan === 'pro'">
                ✅ Безлимитные изображения
              </li>
              <li v-if="currentPlan === 'pro'">
                ✅ Персональная аналитика
              </li>
              <li v-if="currentPlan === 'pro'">
                ✅ Эксклюзивные материалы
              </li>
            </ul>
          </div>

          <!-- Free Plan Info -->
          <div v-else class="free-plan-info">
            <div class="free-plan-header">
              <span class="info-icon">ℹ️</span>
              <span>Ограничения бесплатного плана:</span>
            </div>
            <ul class="limitations-list">
              <li>⭕ Ограниченное количество сообщений</li>
              <li>⭕ Базовый доступ к курсам</li>
              <li>⭕ Ограниченная аналитика</li>
            </ul>
            <div class="upgrade-message">
              Хотите больше возможностей? Рассмотрите <strong>Start</strong> или <strong>Pro</strong> план!
            </div>
          </div>
        </div>
      </div>

      <!-- Promo Code Card -->
      <div class="settings-card promo-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">🎟️ Промокод</h2>
            <p class="card-subtitle">Активация специального предложения</p>
          </div>
        </div>

        <div class="promo-input-section">
          <div class="form-group">
            <label class="form-label">Введите промокод</label>
            <input 
              type="text" 
              v-model="promoCode" 
              placeholder="Например: ACED2024"
              :disabled="loading || isProcessingPromo"
              @keyup.enter="applyPromo"
              @input="handlePromoCodeInput"
              maxlength="20"
              class="form-input promo-input"
              :class="{ 
                'promo-valid': promoValidation && promoValidation.valid,
                'promo-invalid': promoValidation && !promoValidation.valid && promoCode.length > 3,
                'promo-loading': isValidatingPromo
              }"
            />
            
            <!-- Validation Feedback -->
            <div v-if="isValidatingPromo" class="validation-message loading">
              <div class="spinner-small"></div>
              Проверка промокода...
            </div>
            
            <div v-else-if="promoValidation && promoCode.length > 3" class="validation-message">
              <div v-if="promoValidation.valid" class="validation-success">
                ✅ Промокод действителен! 
                <br>
                <strong>Предоставляет: {{ promoValidation.data?.grantsPlan?.toUpperCase() }} план</strong>
              </div>
              <div v-else class="validation-error">
                ❌ {{ promoValidation.error }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Выберите тариф</label>
            <select 
              v-model="selectedPlan" 
              :disabled="loading || isProcessingPromo" 
              class="form-select"
              @change="onPlanChange"
            >
              <option value="">Выберите тариф...</option>
              <option value="start" :disabled="currentPlan === 'start' || currentPlan === 'pro'">
                Start (260,000 сум) {{ currentPlan === 'start' ? '- Уже активен' : '' }}
              </option>
              <option value="pro" :disabled="currentPlan === 'pro'">
                Pro (455,000 сум) {{ currentPlan === 'pro' ? '- Уже активен' : '' }}
              </option>
            </select>
          </div>

          <!-- Plan Warning -->
          <div v-if="planCompatibilityWarning" class="plan-warning">
            ⚠️ {{ planCompatibilityWarning }}
          </div>

          <button 
            class="promo-button" 
            @click="applyPromo"
            :disabled="!canApplyPromo || isProcessingPromo"
            :class="{ 
              'promo-ready': canApplyPromo && !isProcessingPromo,
              'promo-processing': isProcessingPromo 
            }"
          >
            {{ promoButtonText }}
          </button>
        </div>

        <!-- Applied Promocodes History -->
        <div v-if="appliedPromocodesCount > 0" class="promocodes-history">
          <h4 class="history-title">📋 История применённых промокодов</h4>
          <div class="history-list">
            <div 
              v-for="promo in appliedPromocodesSlice" 
              :key="promo.id || (promo.code + promo.appliedAt)"
              class="history-item"
            >
              <div class="history-info">
                <span class="history-code">{{ promo.code || 'N/A' }}</span>
                <span class="history-plan">{{ (promo.plan || 'unknown').toUpperCase() }}</span>
              </div>
              <div class="history-date">
                {{ formatDate(promo.appliedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Plans Card -->
      <div class="settings-card plans-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">💰 Тарифные планы</h2>
            <p class="card-subtitle">Выберите подходящий тариф</p>
          </div>
        </div>

        <div v-if="isPromocodeActive" class="promocode-notice">
          <span class="notice-icon">🎉</span>
          У вас активна подписка по промокоду! 
          <br>
          <small>Вы можете продлить подписку через оплату или применить новый промокод</small>
        </div>

        <div class="plans-grid">
          <!-- Start Plan -->
          <div 
            class="plan-card" 
            :class="{ 
              active: paymentPlan === 'start', 
              disabled: currentPlan === 'start' || currentPlan === 'pro',
              'current-plan': currentPlan === 'start'
            }"
            @click="selectPaymentPlan('start')"
          >
            <div class="plan-header">
              <h3 class="plan-name">Start</h3>
              <div class="plan-price">260,000 сум</div>
              <div class="plan-period">/ месяц</div>
            </div>
            <ul class="plan-features">
              <li><span class="feature-icon">✅</span> Безлимитные сообщения</li>
              <li><span class="feature-icon">✅</span> Доступ к словарю</li>
              <li><span class="feature-icon">✅</span> Базовые курсы</li>
              <li><span class="feature-icon">✅</span> Домашние задания</li>
              <li><span class="feature-icon">✅</span> Основные тесты</li>
              <li><span class="feature-icon">✅</span> Приоритетная поддержка</li>
            </ul>
            <div v-if="currentPlan === 'start'" class="plan-status active-status">
              ✅ Активен
            </div>
            <button 
              v-else
              class="plan-select-button"
              :disabled="currentPlan === 'pro'"
            >
              Выбрать Start
            </button>
          </div>

          <!-- Pro Plan -->
          <div 
            class="plan-card recommended" 
            :class="{ 
              active: paymentPlan === 'pro', 
              disabled: currentPlan === 'pro',
              'current-plan': currentPlan === 'pro'
            }"
            @click="selectPaymentPlan('pro')"
          >
            <div class="plan-badge">Рекомендуем</div>
            <div class="plan-header">
              <h3 class="plan-name">Pro</h3>
              <div class="plan-price">455,000 сум</div>
              <div class="plan-period">/ месяц</div>
            </div>
            <ul class="plan-features">
              <li><span class="feature-icon">✅</span> Все возможности Start</li>
              <li><span class="feature-icon">✅</span> Безлимитные изображения</li>
              <li><span class="feature-icon">✅</span> Продвинутые курсы</li>
              <li><span class="feature-icon">✅</span> Персональная аналитика</li>
              <li><span class="feature-icon">✅</span> Персональные курсы</li>
              <li><span class="feature-icon">✅</span> Эксклюзивные материалы</li>
            </ul>
            <div v-if="currentPlan === 'pro'" class="plan-status active-status">
              ✅ Активен
            </div>
            <button 
              v-else
              class="plan-select-button"
            >
              Выбрать Pro
            </button>
          </div>
        </div>

        <!-- Updated Payment Button -->
        <button 
          class="payment-button" 
          @click="goToPayment"
          :disabled="loading || !paymentPlan || (currentPlan !== 'free' && paymentPlan === currentPlan)"
        >
          {{ getPaymentButtonText() }}
        </button>
      </div>

      <!-- Payment History -->
      <div v-if="paymentHistoryCount > 0" class="settings-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">📊 История платежей</h2>
            <p class="card-subtitle">Последние транзакции</p>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="payment in paymentHistorySlice" 
            :key="payment.id || payment._id || payment.timestamp"
            class="payment-item"
          >
            <div class="payment-info">
              <span class="payment-id">{{ payment.id || payment._id || 'N/A' }}</span>
              <span class="payment-amount">{{ formatAmount(payment.amount) }}</span>
            </div>
            <div class="payment-status-info">
              <span :class="['status-badge', getStatusClass(payment.state || payment.status)]">
                {{ payment.stateText || payment.statusText || 'Unknown' }}
              </span>
              <span class="payment-date">{{ formatDate(payment.timestamp || payment.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Statistics -->
      <div v-if="!isFreeUser" class="settings-card">
        <div class="card-header">
          <div class="card-header-left">
            <h2 class="card-title">📈 Использование</h2>
            <p class="card-subtitle">Статистика использования ресурсов</p>
          </div>
        </div>
        
        <div class="usage-stats">
          <div class="usage-item">
            <div class="usage-header">
              <span class="usage-label">💬 Сообщения</span>
              <span class="usage-value">
                {{ currentUsageMessages }} / {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}
              </span>
            </div>
            <div v-if="usageLimitsMessages !== -1" class="usage-bar">
              <div class="usage-fill" :style="{ width: messageUsagePercentage + '%' }"></div>
            </div>
            <div v-else class="unlimited-badge">
              Безлимитно
            </div>
          </div>
          
          <div class="usage-item">
            <div class="usage-header">
              <span class="usage-label">🖼️ Изображения</span>
              <span class="usage-value">
                {{ currentUsageImages }} / {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}
              </span>
            </div>
            <div v-if="usageLimitsImages !== -1" class="usage-bar">
              <div class="usage-fill" :style="{ width: imageUsagePercentage + '%' }"></div>
            </div>
            <div v-else class="unlimited-badge">
              Безлимитно
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script>
import { auth, db } from "@/firebase";
import { mapGetters, mapActions } from 'vuex';
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default {
  name: 'AcedSettings',
  data() {
    return {
      user: { name: "", surname: "", email: "" },
      tempUser: { name: "", surname: "" },
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      currentUser: null,
      isGoogleUser: false,
      isEditingName: false,
      
      promoCode: "",
      selectedPlan: "",
      paymentPlan: "",
      
      promoValidation: null,
      promoValidationTimeout: null,
      isValidatingPromo: false,
      isProcessingPromo: false,
      
      loading: false,
      loadingText: "",
      notification: "",
      notificationClass: "",
      notificationIcon: "",
      
      reactivityKey: 0,
      lastUpdateTime: Date.now(),
      componentMounted: false,
      statusEventListeners: [],
      storeUnsubscribe: null
    };
  },
  
  computed: {
    ...mapGetters('user', [
      'userStatus',
      'isPremiumUser', 
      'isStartUser',
      'isProUser',
      'isFreeUser',
      'hasActiveSubscription',
      'getUser',
      'subscriptionDetails',
      'appliedPromocodes',
      'paymentHistory',
      'currentUsage',
      'usageLimits',
      'forceUpdateCounter'
    ]),

    currentPlan() {
      const reactKey = this.reactivityKey;
      const updateTime = this.lastUpdateTime;
      
      try {
        const storeStatus = this.$store.state.user?.subscriptionPlan || this.$store.getters['user/userStatus'];
        const localStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
        const userObjectStatus = this.getUser?.subscriptionPlan;
        
        const statuses = [storeStatus, localStatus, userObjectStatus].filter(s => s && s !== 'free');
        const status = statuses[0] || storeStatus || localStatus || userObjectStatus || 'free';
        
        return status;
      } catch (e) {
        return localStorage.getItem('userStatus') || 'free';
      }
    },
    
    subscriptionDetails() {
      const reactKey = this.reactivityKey;
      const updateTime = this.lastUpdateTime;
      
      try {
        const storeDetails = this.$store.getters['user/subscriptionDetails'];
        const userObject = this.getUser || {};
        
        const details = {
          plan: this.currentPlan,
          status: this.currentPlan !== 'free' ? 'active' : 'inactive',
          expiryDate: null,
          source: null,
          activatedAt: null,
          daysRemaining: null,
          autoRenew: false,
          ...storeDetails,
          ...userObject.subscription
        };
        
        if (details.activatedAt && !details.expiryDate) {
          const activationDate = new Date(details.activatedAt);
          const expiryDate = new Date(activationDate);
          expiryDate.setDate(expiryDate.getDate() + 30);
          details.expiryDate = expiryDate.toISOString();
        }
        
        if (details.expiryDate) {
          const now = new Date();
          const expiry = new Date(details.expiryDate);
          const diffTime = expiry - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          details.daysRemaining = Math.max(0, diffDays);
        }
        
        return details;
      } catch (e) {
        return { 
          plan: this.currentPlan,
          status: this.currentPlan !== 'free' ? 'active' : 'inactive',
          expiryDate: null,
          source: null,
          daysRemaining: null
        };
      }
    },
    
    currentPlanDescription() {
      const plan = this.currentPlan;
      const details = this.subscriptionDetails;
      
      const baseDescriptions = {
        pro: 'Полный доступ ко всем курсам и функциям',
        start: 'Доступ к базовым курсам и безлимитным сообщениям',
        free: 'Бесплатный доступ с ограниченным функционалом'
      };
      
      let description = baseDescriptions[plan] || 'Бесплатный доступ';
      
      if (plan !== 'free' && details.daysRemaining !== null) {
        if (details.daysRemaining > 0) {
          description += ` (осталось ${details.daysRemaining} дней)`;
        } else {
          description += ' (срок действия истёк)';
        }
      }
      
      return description;
    },
    
    subscriptionExpiryInfo() {
      const details = this.subscriptionDetails;
      
      if (!details.expiryDate || this.currentPlan === 'free') {
        return null;
      }
      
      const expiryDate = new Date(details.expiryDate);
      const now = new Date();
      const diffTime = expiryDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        expiryDate: expiryDate,
        daysRemaining: Math.max(0, diffDays),
        isExpiring: diffDays <= 7 && diffDays > 0,
        isExpired: diffDays <= 0,
        formattedDate: this.formatDate(details.expiryDate),
        timeRemaining: this.getTimeRemaining(diffTime)
      };
    },
    
    appliedPromocodesCount() {
      return this.appliedPromocodes.length;
    },
    
    appliedPromocodesSlice() {
      return this.appliedPromocodes.slice(0, 3);
    },
    
    paymentHistoryCount() {
      return this.paymentHistory.length;
    },
    
    paymentHistorySlice() {
      return this.paymentHistory.slice(0, 5);
    },
    
    currentUsageMessages() {
      return this.currentUsage.messages || 0;
    },
    
    currentUsageImages() {
      return this.currentUsage.images || 0;
    },
    
    usageLimitsMessages() {
      return this.usageLimits.messages || 50;
    },
    
    usageLimitsImages() {
      return this.usageLimits.images || 5;
    },
    
    messageUsagePercentage() {
      const messages = this.currentUsageMessages;
      const limit = this.usageLimitsMessages;
      return (limit === -1) ? 0 : Math.min(100, Math.round((messages / limit) * 100));
    },
    
    imageUsagePercentage() {
      const images = this.currentUsageImages;
      const limit = this.usageLimitsImages;
      return (limit === -1) ? 0 : Math.min(100, Math.round((images / limit) * 100));
    },
    
    isPromocodeActive() {
      return this.subscriptionDetails.source === 'promocode';
    },
    
    currentPlanLabel() {
      const labels = {
        pro: 'Pro',
        start: 'Start', 
        free: 'Free'
      };
      return labels[this.currentPlan] || 'Free';
    },
    
    currentPlanClass() {
      const classes = {
        pro: 'badge-pro',
        start: 'badge-start',
        free: 'badge-free'
      };
      return classes[this.currentPlan] || 'badge-free';
    },
    
    userId() {
      return this.currentUser?.uid;
    },
    
    canApplyPromo() {
      return this.promoCode && 
             this.promoCode.trim().length > 3 && 
             this.selectedPlan && 
             this.promoValidation &&
             this.promoValidation.valid === true &&
             !this.loading &&
             !this.isProcessingPromo &&
             !this.planCompatibilityError;
    },
    
    promoButtonText() {
      if (this.isProcessingPromo) {
        return '⏳ Применение...';
      }
      if (this.isValidatingPromo) {
        return '🔄 Проверка...';
      }
      if (!this.promoCode.trim()) {
        return 'Введите промокод';
      }
      if (!this.selectedPlan) {
        return 'Выберите тариф';
      }
      if (this.promoValidation && !this.promoValidation.valid) {
        return 'Неверный промокод';
      }
      if (this.planCompatibilityError) {
        return 'Проверьте тариф';
      }
      if (this.canApplyPromo) {
        return '🎉 Применить промокод';
      }
      return 'Применить промокод';
    },
    
    planCompatibilityError() {
      if (!this.promoValidation || !this.promoValidation.valid || !this.selectedPlan) return false;
      
      const promoGrantsPlan = this.promoValidation.data?.grantsPlan;
      if (promoGrantsPlan && promoGrantsPlan !== this.selectedPlan) {
        return true;
      }
      
      return false;
    },
    
    planCompatibilityWarning() {
      if (!this.planCompatibilityError) return null;
      
      const promoGrantsPlan = this.promoValidation.data?.grantsPlan?.toUpperCase();
      return `Этот промокод предоставляет план "${promoGrantsPlan}", но вы выбрали "${this.selectedPlan.toUpperCase()}". Выберите правильный план.`;
    }
  },
  
  watch: {
    '$store.state.user': {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    getUser: {
      handler(newUser, oldUser) {
        const newPlan = newUser?.subscriptionPlan;
        const oldPlan = oldUser?.subscriptionPlan;
        
        if (newPlan !== oldPlan) {
          this.handleUserStatusChange(newPlan, oldPlan);
        }
      },
      deep: true,
      immediate: true
    },

    currentPlan: {
      handler(newPlan, oldPlan) {
        if (newPlan !== oldPlan) {
          this.forceReactivityUpdate();
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    await this.initializeComponent();
    this.componentMounted = true;
  },
  
  beforeUnmount() {
    this.cleanup();
  },
  
  methods: {
    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      try {
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('plan', newStatus);
        localStorage.setItem('statusChangeTime', Date.now().toString());

        this.forceReactivityUpdate();

        if (newStatus && newStatus !== 'free' && (oldStatus === 'free' || !oldStatus)) {
          const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 ${planLabel} подписка активирована!`, 'success', 5000);
        }

      } catch (error) {
        console.error('❌ Error handling status change:', error);
        this.$forceUpdate();
      }
    },

    setupEnhancedEventListeners() {
      this.cleanupEventListeners();
      
      if (typeof window !== 'undefined') {
        this.handleSubscriptionChange = (event) => {
          const { plan, oldPlan, newStatus, oldStatus } = event.detail;
          const finalNewStatus = plan || newStatus;
          const finalOldStatus = oldPlan || oldStatus;
          
          if (finalNewStatus) {
            this.handleUserStatusChange(finalNewStatus, finalOldStatus);
          }
        };
        
        window.addEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('userSubscriptionChanged', this.handleSubscriptionChange);
        });

        this.handleStorageChange = (event) => {
          if ((event.key === 'userStatus' || event.key === 'plan') && event.newValue !== event.oldValue) {
            this.handleUserStatusChange(event.newValue, event.oldValue);
          }
        };
        
        window.addEventListener('storage', this.handleStorageChange);
        this.statusEventListeners.push(() => {
          window.removeEventListener('storage', this.handleStorageChange);
        });

        const eventTypes = [
          'userStatusChanged',
          'subscriptionUpdated', 
          'promocodeApplied',
          'paymentCompleted',
          'globalForceUpdate',
          'reactivityUpdate'
        ];

        const handleGenericStatusChange = (event) => {
          const detail = event.detail || {};
          const newStatus = detail.newStatus || detail.plan || detail.status;
          const oldStatus = detail.oldStatus || detail.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          } else {
            this.forceReactivityUpdate();
          }
          
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentPlan) {
            this.handleUserStatusChange(currentStatus, this.currentPlan);
          }
        };

        eventTypes.forEach(eventType => {
          window.addEventListener(eventType, handleGenericStatusChange);
          this.statusEventListeners.push(() => {
            window.removeEventListener(eventType, handleGenericStatusChange);
          });
        });
      }

      if (typeof window !== 'undefined' && window.eventBus) {
        this.handleUserStatusEvent = (data) => {
          const newStatus = data.newStatus || data.plan;
          const oldStatus = data.oldStatus || data.oldPlan;
          
          if (newStatus) {
            this.handleUserStatusChange(newStatus, oldStatus);
          }
        };

        this.handleForceUpdateEvent = () => {
          this.forceReactivityUpdate();
          
          const currentStatus = localStorage.getItem('userStatus') || localStorage.getItem('plan');
          if (currentStatus && currentStatus !== this.currentPlan) {
            this.handleUserStatusChange(currentStatus, this.currentPlan);
          }
        };

        const eventBusEvents = [
          'userStatusChanged',
          'promocodeApplied',
          'subscriptionUpdated',
          'paymentCompleted', 
          'forceUpdate',
          'globalForceUpdate'
        ];

        eventBusEvents.forEach(eventType => {
          if (eventType.includes('Status') || eventType.includes('promocode') || eventType.includes('payment') || eventType.includes('subscription')) {
            window.eventBus.on(eventType, this.handleUserStatusEvent);
            this.statusEventListeners.push(() => {
              window.eventBus.off(eventType, this.handleUserStatusEvent);
            });
          } else {
            window.eventBus.on(eventType, this.handleForceUpdateEvent);
            this.statusEventListeners.push(() => {
              window.eventBus.off(eventType, this.handleForceUpdateEvent);
            });
          }
        });
      }

      if (this.$store) {
        this.storeUnsubscribe = this.$store.subscribe((mutation) => {
          if (this.isUserRelatedMutation(mutation)) {
            this.forceReactivityUpdate();
            
            if (mutation.payload && mutation.payload.subscriptionPlan) {
              const newStatus = mutation.payload.subscriptionPlan;
              if (newStatus !== this.currentPlan) {
                this.handleUserStatusChange(newStatus, this.currentPlan);
              }
            }
          }
        });
        
        this.statusEventListeners.push(() => {
          if (this.storeUnsubscribe) {
            this.storeUnsubscribe();
            this.storeUnsubscribe = null;
          }
        });
      }
    },

    isUserRelatedMutation(mutation) {
      const userMutations = [
        'setUser',
        'SET_USER',
        'updateUser', 
        'UPDATE_USER',
        'user/SET_USER_STATUS',
        'user/setUserStatus',
        'user/UPDATE_SUBSCRIPTION',
        'user/FORCE_UPDATE',
        'user/ADD_PROMOCODE'
      ];
      
      return userMutations.some(type => mutation.type.includes(type)) ||
             mutation.type.includes('user/') ||
             mutation.type.toLowerCase().includes('status') ||
             mutation.type.toLowerCase().includes('subscription') ||
             mutation.type.toLowerCase().includes('plan');
    },

    forceReactivityUpdate() {
      try {
        this.reactivityKey++;
        this.lastUpdateTime = Date.now();
        
        this.$forceUpdate();
        
        this.$nextTick(() => {
          this.$forceUpdate();
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 50);
          
          setTimeout(() => {
            this.$forceUpdate();
          }, 200);
        });
      } catch (error) {
        console.error('Reactivity update error:', error);
      }
    },

    getTimeRemaining(diffTime) {
      if (diffTime <= 0) return 'Истёк';
      
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} дн. ${hours} ч.`;
      } else if (hours > 0) {
        return `${hours} ч.`;
      } else {
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} мин.`;
      }
    },

    cleanupEventListeners() {
      this.statusEventListeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
      this.statusEventListeners = [];
      
      if (this.storeUnsubscribe) {
        this.storeUnsubscribe();
        this.storeUnsubscribe = null;
      }
    },

    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        await this.checkAuthState();
        this.setupEnhancedEventListeners();
        await this.loadInitialData();
        this.forceReactivityUpdate();
      } catch (error) {
        console.error('❌ AcedSettings initialization error:', error);
        this.showNotification('Ошибка загрузки настроек', 'error');
      } finally {
        this.loading = false;
      }
    },

    async loadInitialData() {
      try {
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('user/loadUserStatus');
        }
      } catch (error) {
        console.error('Load initial data error:', error);
      }
    },
    
    checkAuthState() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.currentUser = user;
          if (user) {
            this.isGoogleUser = user.providerData[0]?.providerId === "google.com";
            await this.fetchUserData();
          }
          resolve();
        });
      });
    },
    
    async fetchUserData() {
      try {
        if (!this.currentUser) return;
        
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          this.user = userDoc.data();
          this.tempUser = { name: this.user.name, surname: this.user.surname };
        } else {
          const newUserData = {
            name: "Новый пользователь",
            surname: "",
            email: this.currentUser.email,
          };
          await setDoc(userRef, newUserData);
          this.user = newUserData;
          this.tempUser = { name: newUserData.name, surname: newUserData.surname };
        }
      } catch (error) {
        console.error('❌ User data fetch error:', error);
        this.showNotification("Ошибка загрузки данных пользователя", 'error');
      }
    },

    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      this.cleanupEventListeners();
    },

    startEditingName() {
      this.isEditingName = true;
      this.tempUser = { name: this.user.name, surname: this.user.surname };
    },

    async saveNameChanges() {
      this.loading = true;
      this.loadingText = 'Сохранение изменений...';
      
      try {
        if (!this.currentUser) {
          this.showNotification('Пользователь не найден', 'error');
          return;
        }

        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, {
          name: this.tempUser.name,
          surname: this.tempUser.surname,
          updatedAt: new Date().toISOString()
        });

        this.user.name = this.tempUser.name;
        this.user.surname = this.tempUser.surname;
        this.isEditingName = false;

        this.showNotification('Имя и фамилия обновлены!', 'success');
      } catch (error) {
        console.error('❌ Save name error:', error);
        this.showNotification('Ошибка сохранения имени', 'error');
      } finally {
        this.loading = false;
      }
    },

    cancelEditingName() {
      this.isEditingName = false;
      this.tempUser = { name: this.user.name, surname: this.user.surname };
    },

    handlePromoCodeInput() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
      
      this.promoCode = this.promoCode.toUpperCase();
      
      if (this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      this.isValidatingPromo = true;
      
      this.promoValidationTimeout = setTimeout(() => {
        this.validatePromoCodeLocal();
      }, 800);
    },
    
    async validatePromoCodeLocal() {
      if (!this.promoCode.trim() || this.promoCode.length <= 3) {
        this.promoValidation = null;
        this.isValidatingPromo = false;
        return;
      }
      
      try {
        const promocodeUpper = this.promoCode.trim().toUpperCase();
        
        try {
          if (this.$store && this.$store.dispatch) {
            const storeResult = await this.$store.dispatch('user/validatePromocode', promocodeUpper);
            
            if (storeResult && typeof storeResult === 'object') {
              this.promoValidation = storeResult;
              
              if (storeResult.valid && storeResult.data?.grantsPlan && !this.selectedPlan) {
                this.selectedPlan = storeResult.data.grantsPlan;
              }
              
              this.isValidatingPromo = false;
              return;
            }
          }
        } catch (storeError) {
          console.error('Store validation error:', storeError);
        }
        
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL;
          if (!baseUrl) {
            throw new Error('API base URL not configured');
          }
          
          const validationEndpoints = [
            `${baseUrl}/api/promocodes/validate/${promocodeUpper}`,
            `${baseUrl}/api/payments/validate-promo-code`,
            `${baseUrl}/promocodes/validate/${promocodeUpper}`
          ];
          
          let validationResult = null;
          
          for (const endpoint of validationEndpoints) {
            try {
              let response;
              
              if (endpoint.includes('validate-promo-code')) {
                response = await Promise.race([
                  fetch(endpoint, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': await this.getAuthHeader()
                    },
                    body: JSON.stringify({
                      promoCode: promocodeUpper,
                      userId: this.userId
                    })
                  }),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 8000)
                  )
                ]);
              } else {
                response = await Promise.race([
                  fetch(endpoint, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': await this.getAuthHeader()
                    }
                  }),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout')), 8000)
                  )
                ]);
              }
              
              if (response.ok) {
                const apiResult = await response.json();
                
                if (apiResult && typeof apiResult === 'object') {
                  validationResult = this.normalizeValidationResponse(apiResult, promocodeUpper);
                  break;
                }
              } else {
                if (response.status === 404) {
                  continue;
                }
                
                try {
                  const errorData = await response.json();
                  
                  if (response.status === 400 || response.status === 422) {
                    validationResult = {
                      valid: false,
                      error: errorData.message || errorData.error || `Промокод "${promocodeUpper}" не найден`
                    };
                    break;
                  }
                } catch (jsonError) {
                  console.error('JSON parse error:', jsonError);
                }
              }
            } catch (endpointError) {
              continue;
            }
          }
          
          if (validationResult) {
            this.promoValidation = validationResult;
            
            if (validationResult.valid && validationResult.data?.grantsPlan && !this.selectedPlan) {
              this.selectedPlan = validationResult.data.grantsPlan;
            }
            
            this.isValidatingPromo = false;
            return;
          }
          
        } catch (apiError) {
          console.error('API validation error:', apiError);
        }
        
        this.promoValidation = {
          valid: false,
          error: `Не удалось проверить промокод "${promocodeUpper}". Проверьте подключение к интернету или попробуйте позже.`
        };
        
      } catch (error) {
        console.error('❌ Promocode validation error:', error);
        this.promoValidation = {
          valid: false,
          error: 'Ошибка проверки промокода. Попробуйте позже.'
        };
      } finally {
        this.isValidatingPromo = false;
      }
    },
    
    normalizeValidationResponse(apiResult, promocodeUpper) {
      try {
        let isValid = false;
        let grantsPlan = null;
        let description = null;
        let errorMessage = null;
        
        if (apiResult.success === true && apiResult.valid === true) {
          isValid = true;
          grantsPlan = apiResult.data?.grantsPlan || apiResult.data?.plan;
          description = apiResult.data?.description || apiResult.message;
        }
        else if (apiResult.valid === true) {
          isValid = true;
          grantsPlan = apiResult.data?.grantsPlan || apiResult.data?.plan;
          description = apiResult.data?.description || apiResult.message;
        }
        else if (apiResult.success === false) {
          isValid = false;
          errorMessage = apiResult.error || apiResult.message || 'Промокод недействителен';
        }
        else if (apiResult.grantsPlan || apiResult.plan) {
          isValid = true;
          grantsPlan = apiResult.grantsPlan || apiResult.plan;
          description = apiResult.description || 'Промокод действителен';
        }
        else if (apiResult.error) {
          isValid = false;
          errorMessage = apiResult.error;
        }
        else {
          isValid = false;
          errorMessage = 'Неизвестный формат ответа сервера';
        }
        
        if (isValid) {
          return {
            valid: true,
            data: {
              code: promocodeUpper,
              grantsPlan: grantsPlan,
              description: description,
              subscriptionDays: apiResult.data?.subscriptionDays || apiResult.subscriptionDays || 30
            },
            message: `Промокод действителен! Предоставляет: ${(grantsPlan || 'неизвестный').toUpperCase()} план`
          };
        } else {
          return {
            valid: false,
            error: errorMessage || `Промокод "${promocodeUpper}" не найден или недействителен`
          };
        }
        
      } catch (normalizationError) {
        console.error('❌ Failed to normalize API response:', normalizationError);
        return {
          valid: false,
          error: 'Ошибка обработки ответа сервера'
        };
      }
    },
    
    async getAuthHeader() {
      try {
        if (this.currentUser) {
          const token = await this.currentUser.getIdToken();
          if (token) {
            return `Bearer ${token}`;
          }
        }
        
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (storedToken) {
          return `Bearer ${storedToken}`;
        }
        
        return '';
      } catch (error) {
        return '';
      }
    },
    
    onPlanChange() {
      if (this.promoValidation && this.promoValidation.valid && this.selectedPlan) {
        const promoGrantsPlan = this.promoValidation.data?.grantsPlan;
        if (promoGrantsPlan && promoGrantsPlan !== this.selectedPlan) {
          this.showNotification(
            `Промокод предоставляет план "${promoGrantsPlan.toUpperCase()}", но вы выбрали "${this.selectedPlan.toUpperCase()}"`, 
            'warning'
          );
        }
      }
    },
    
    async applyPromo() {
      if (!this.promoCode || !this.selectedPlan || !this.userId) {
        this.showNotification('Заполните все поля', 'error');
        return;
      }
      
      this.isProcessingPromo = true;
      
      try {
        const normalizedCode = this.promoCode.trim().toUpperCase();
        
        const result = await this.$store.dispatch('user/applyPromocode', {
          code: normalizedCode,
          plan: this.selectedPlan,
          userId: this.userId
        });
        
        if (result && (result.success === true || result.status === 'success')) {
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          this.forceReactivityUpdate();
          
          if (typeof window !== 'undefined') {
            try {
              const event = new CustomEvent('userSubscriptionChanged', {
                detail: {
                  plan: this.selectedPlan,
                  oldPlan: result.oldStatus || 'free',
                  source: 'promocode',
                  promocode: normalizedCode,
                  timestamp: Date.now()
                },
                bubbles: true
              });
              window.dispatchEvent(event);
            } catch (domEventError) {
              console.error('DOM event error:', domEventError);
            }
            
            try {
              if (window.eventBus?.emit) {
                window.eventBus.emit('promocodeApplied', {
                  newStatus: this.selectedPlan,
                  oldStatus: result.oldStatus || 'free',
                  code: normalizedCode,
                  success: true
                });
              }
            } catch (eventBusError) {
              console.error('Event bus error:', eventBusError);
            }
          }
          
          return;
          
        } else {
          const errorMessage = result?.error || result?.message || 'Не удалось применить промокод';
          this.showNotification(errorMessage, 'error');
          
          if (result?.error?.includes('не найден') || result?.error?.includes('недействителен')) {
            return;
          }
          
          await this.applyPromocodeFallback(normalizedCode);
        }
        
      } catch (storeError) {
        console.error('❌ Store applyPromocode action threw error:', storeError);
        await this.applyPromocodeFallback(normalizedCode);
      } finally {
        this.isProcessingPromo = false;
      }
    },
    
    async applyPromocodeFallback(normalizedCode) {
      try {
        const applyEndpoints = [
          'https://api.aced.live/api/payments/promo-code',
          `${import.meta.env.VITE_API_BASE_URL}/api/payments/promo-code`
        ].filter(url => url && !url.includes('undefined'));
        
        let serverSuccess = false;
        let serverResult = null;
        
        for (const endpoint of applyEndpoints) {
          try {
            const requestBody = {
              userId: this.userId,
              plan: this.selectedPlan,
              promoCode: normalizedCode
            };
            
            const response = await Promise.race([
              fetch(endpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': await this.getAuthHeader()
                },
                body: JSON.stringify(requestBody)
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
              )
            ]);

            serverResult = await response.json();

            if (response.ok && serverResult?.success) {
              serverSuccess = true;
              break;
            } else {
              if (response.status === 400 || response.status === 422) {
                const errorMsg = serverResult?.error || serverResult?.message || 'Неверный промокод';
                this.showNotification(errorMsg, 'error');
                return;
              }
              
              if (response.status === 404) {
                continue;
              }
            }
          } catch (endpointError) {
            continue;
          }
        }
        
        if (serverSuccess) {
          localStorage.setItem('userStatus', this.selectedPlan);
          localStorage.setItem('plan', this.selectedPlan);
          
          this.$store.commit('user/SET_USER_STATUS', this.selectedPlan);
          this.$store.commit('user/UPDATE_SUBSCRIPTION', {
            plan: this.selectedPlan,
            status: 'active',
            source: 'promocode'
          });
          this.$store.commit('user/ADD_PROMOCODE', {
            code: normalizedCode,
            plan: this.selectedPlan,
            appliedAt: new Date().toISOString()
          });
          
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`🎉 Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          this.forceReactivityUpdate();
          this.triggerSubscriptionChangeEvents(normalizedCode);
          
        } else {
          const errorMsg = serverResult?.error || 
                          serverResult?.message || 
                          'Не удалось применить промокод. Проверьте правильность кода или попробуйте позже.';
          this.showNotification(errorMsg, 'error');
        }
        
      } catch (fallbackError) {
        console.error('❌ Backend fallback failed:', fallbackError);
        
        let userFriendlyError = 'Произошла ошибка при применении промокода';
        
        if (fallbackError.message === 'Request timeout') {
          userFriendlyError = 'Истекло время ожидания. Попробуйте снова.';
        } else if (fallbackError.name === 'TypeError' && fallbackError.message.includes('fetch')) {
          userFriendlyError = 'Ошибка сети. Проверьте подключение к интернету.';
        }
        
        this.showNotification(userFriendlyError, 'error');
      }
    },
    
    triggerSubscriptionChangeEvents(promocode) {
      if (typeof window !== 'undefined') {
        try {
          const event = new CustomEvent('userSubscriptionChanged', {
            detail: {
              plan: this.selectedPlan,
              oldPlan: 'free',
              source: 'promocode',
              promocode: promocode,
              timestamp: Date.now()
            },
            bubbles: true
          });
          window.dispatchEvent(event);
        } catch (domEventError) {
          console.error('DOM event error:', domEventError);
        }
        
        try {
          if (window.eventBus?.emit) {
            window.eventBus.emit('promocodeApplied', {
              newStatus: this.selectedPlan,
              oldStatus: 'free',
              code: promocode,
              success: true
            });
          }
        } catch (eventBusError) {
          console.error('Event bus error:', eventBusError);
        }
        
        try {
          if (window.triggerGlobalEvent) {
            window.triggerGlobalEvent('userStatusChanged', {
              oldStatus: 'free',
              newStatus: this.selectedPlan,
              source: 'promocode-applied',
              timestamp: Date.now()
            });
          }
        } catch (globalTriggerError) {
          console.error('Global trigger error:', globalTriggerError);
        }
      }
    },

    selectPaymentPlan(plan) {
      if (this.currentPlan === plan || (this.currentPlan === 'pro' && plan === 'start')) {
        return;
      }
      this.paymentPlan = plan;
    },

    // ✅ UPDATED: Navigate to UniversalCheckout with proper params
    async goToPayment() {
      if (!this.paymentPlan) {
        this.showNotification('Выберите тариф для оплаты', 'warning');
        return;
      }

      try {
        // Navigate to UniversalCheckout (PaymentSelection route)
        await this.$router.push({
          name: 'PaymentSelection',
          params: { 
            plan: this.paymentPlan 
          },
          query: {
            // Pass user data as query params
            userId: this.userId,
            userName: this.user.name || 'Пользователь',
            userEmail: this.user.email || '',
            currentPlan: this.currentPlan,
            // Default provider (can be changed in checkout)
            provider: 'multicard'
          }
        });
      } catch (error) {
        console.error('❌ Navigation error:', error);
        this.showNotification('Ошибка при переходе к оплате', 'error');
      }
    },

    getPaymentButtonText() {
      if (!this.paymentPlan) return 'Выберите тариф';
      if (this.currentPlan === this.paymentPlan) return 'Уже активен';
      return `💳 Оплатить ${this.paymentPlan.toUpperCase()}`;
    },

    async saveChanges() {
      this.loading = true;
      this.loadingText = 'Сохранение изменений...';
      
      try {
        if (!this.currentUser) {
          this.showNotification('Пользователь не найден', 'error');
          return;
        }

        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, {
          name: this.user.name,
          surname: this.user.surname,
          email: this.user.email,
          updatedAt: new Date().toISOString()
        });

        if (this.user.email !== this.currentUser.email) {
          await updateEmail(this.currentUser, this.user.email);
        }

        if (this.newPassword && this.oldPassword) {
          if (this.newPassword !== this.confirmPassword) {
            this.showNotification('Пароли не совпадают', 'error');
            return;
          }

          const credential = EmailAuthProvider.credential(
            this.currentUser.email,
            this.oldPassword
          );

          await reauthenticateWithCredential(this.currentUser, credential);
          await updatePassword(this.currentUser, this.newPassword);

          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }

        this.showNotification('Изменения сохранены успешно!', 'success');

      } catch (error) {
        console.error('❌ Save changes error:', error);
        
        let errorMessage = 'Ошибка сохранения изменений';
        
        if (error.code === 'auth/wrong-password') {
          errorMessage = 'Неверный текущий пароль';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Пароль слишком слабый';
        } else if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email уже используется';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Неверный формат email';
        }
        
        this.showNotification(errorMessage, 'error');
      } finally {
        this.loading = false;
      }
    },

    async sendPasswordReset() {
      if (!this.user.email) {
        this.showNotification('Введите email адрес', 'error');
        return;
      }

      try {
        await sendPasswordResetEmail(auth, this.user.email);
        this.showNotification('Письмо для сброса пароля отправлено!', 'success');
      } catch (error) {
        console.error('❌ Password reset error:', error);
        
        let errorMessage = 'Ошибка отправки письма';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'Пользователь с таким email не найден';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Неверный формат email';
        }
        
        this.showNotification(errorMessage, 'error');
      }
    },

    goToProfile() {
      this.$router.push('/profile');
    },

    formatDate(date) {
      if (!date) return '';
      try {
        return new Date(date).toLocaleDateString('ru-RU');
      } catch (error) {
        return '';
      }
    },

    formatAmount(amount) {
      try {
        return new Intl.NumberFormat('ru-RU').format(amount) + ' сум';
      } catch (error) {
        return amount + ' сум';
      }
    },

    getStatusClass(state) {
      const classes = {
        success: 'status-success',
        pending: 'status-warning',
        failed: 'status-error',
        completed: 'status-success',
        2: 'status-success',
        1: 'status-warning',
        0: 'status-warning',
        '-1': 'status-error',
        '-2': 'status-error'
      };
      return classes[state] || 'status-warning';
    },

    showNotification(message, type = 'info', duration = 5000) {
      this.notification = message;
      this.notificationClass = `notification-${type}`;
      
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      this.notificationIcon = icons[type] || 'ℹ️';
      
      setTimeout(() => {
        this.notification = '';
        this.notificationClass = '';
        this.notificationIcon = '';
      }, duration);
    }
  }
}
</script>

<style scoped>
/* Styles remain the same as in the original file */
/* Copy all the CSS from the original AcedSettings.vue */
/* I'm keeping the original CSS to maintain consistency */

.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
}

.settings-header {
  background: white;
  border-bottom: 1px solid #e9d5ff;
  box-shadow: 0 1px 3px rgba(139, 92, 246, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 2.5rem 0;
}

.header-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.header-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: white;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  color: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.back-button:hover {
  background: #faf5ff;
  border-color: #c4b5fd;
  transform: translateY(-1px);
}

.back-icon {
  font-size: 1.25rem;
}

.settings-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.notification {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-weight: 500;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #6ee7b7;
  color: #065f46;
}

.notification-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #fca5a5;
  color: #991b1b;
}

.notification-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fcd34d;
  color: #92400e;
}

.notification-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 2px solid #93c5fd;
  color: #1e40af;
}

.notification-icon {
  font-size: 1.5rem;
}

.notification-text {
  flex: 1;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e9d5ff;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06);
  transition: all 0.3s ease;
}

.settings-card:hover {
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.15), 0 4px 6px -2px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.card-header-left {
  flex: 1;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 0.5rem 0;
}

.card-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.edit-button {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-button:hover {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border-color: #c4b5fd;
  transform: scale(1.05);
}

.edit-icon {
  font-size: 1.25rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.save-button {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #6ee7b7;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #065f46;
  font-weight: 600;
  font-size: 1.125rem;
}

.save-button:hover {
  background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
  transform: scale(1.05);
}

.cancel-button {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #fca5a5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #991b1b;
  font-weight: 600;
  font-size: 1.125rem;
}

.cancel-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  transform: scale(1.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  font-size: 1rem;
  color: #1f2937;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-input.editing {
  border-color: #a78bfa;
  background: #faf5ff;
}

.form-display {
  width: 100%;
  padding: 0.875rem 1.25rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
  box-sizing: border-box;
}

.form-select {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e9d5ff;
  border-radius: 10px;
  font-size: 1rem;
  color: #1f2937;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  box-sizing: border-box;
}

.form-select:focus {
  outline: none;
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.password-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.link-button {
  background: none;
  border: none;
  color: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0;
  margin-top: 0.5rem;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.link-button:hover {
  color: #6d28d9;
}

.action-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.primary-button {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
}

.primary-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.subscription-card {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border: 2px solid #e9d5ff;
}

.current-plan-display {
  margin-top: 1rem;
}

.plan-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.plan-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.plan-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-pro {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
}

.badge-start {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.badge-free {
  background: #e5e7eb;
  color: #6b7280;
}

.plan-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 1rem 0;
}

.subscription-details {
  margin-top: 1.5rem;
}

.expiry-info {
  background: white;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.expiry-warning {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.expiry-expired {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.expiry-main {
  display: flex;
  gap: 1rem;
  align-items: start;
}

.expiry-icon {
  font-size: 2rem;
}

.expiry-content {
  flex: 1;
}

.expiry-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.expiry-date {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.expiry-countdown {
  font-size: 0.95rem;
  color: #7c3aed;
  font-weight: 600;
}

.warning-alert {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: start;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-content {
  flex: 1;
  font-size: 0.95rem;
  color: #92400e;
}

.benefits-section {
  margin-top: 1.5rem;
  background: white;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
  padding: 1.5rem;
}

.benefits-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.benefits-icon {
  font-size: 1.5rem;
}

.benefits-title {
  font-weight: 600;
  color: #374151;
  font-size: 1.05rem;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefits-list li {
  padding: 0.5rem 0;
  color: #059669;
  font-weight: 500;
  font-size: 0.95rem;
}

.free-plan-info {
  margin-top: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.free-plan-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #374151;
  font-size: 1.05rem;
}

.info-icon {
  font-size: 1.5rem;
}

.limitations-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.limitations-list li {
  padding: 0.5rem 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.upgrade-message {
  padding: 1rem;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.95rem;
}

.promo-card {
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
}

.promo-input-section {
  margin-top: 1rem;
}

.promo-input {
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.promo-valid {
  border-color: #10b981 !important;
  background: #d1fae5 !important;
}

.promo-invalid {
  border-color: #ef4444 !important;
  background: #fee2e2 !important;
}

.promo-loading {
  border-color: #3b82f6 !important;
  background: #dbeafe !important;
}

.validation-message {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.validation-message.loading {
  background: #dbeafe;
  border: 1px solid #93c5fd;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.validation-success {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.validation-error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #93c5fd;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.plan-warning {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fbbf24;
  border-radius: 10px;
  color: #92400e;
  font-weight: 500;
}

.promo-button {
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.promo-button.promo-ready {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
}

.promo-button.promo-ready:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
}

.promo-button.promo-processing {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  cursor: wait;
}

.promocodes-history,
.payment-history {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.history-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item,
.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 1px solid #e9d5ff;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.history-item:hover,
.payment-item:hover {
  border-color: #c4b5fd;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
}

.history-info,
.payment-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.history-code,
.payment-id {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #7c3aed;
  font-size: 0.95rem;
}

.history-plan {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.history-date,
.payment-date {
  color: #6b7280;
  font-size: 0.9rem;
}

.payment-amount {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.05rem;
}

.payment-status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.status-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.plans-card {
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
}

.promocode-notice {
  padding: 1rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #6ee7b7;
  border-radius: 10px;
  color: #065f46;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.notice-icon {
  font-size: 1.5rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.plan-card {
  background: white;
  border: 3px solid #e9d5ff;
  border-radius: 16px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.plan-card:hover:not(.disabled) {
  border-color: #a78bfa;
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(139, 92, 246, 0.2);
}

.plan-card.active {
  border-color: #7c3aed;
  box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.3);
}

.plan-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.plan-card.current-plan {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

.plan-card.recommended {
  border-color: #7c3aed;
}

.plan-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  border-bottom-left-radius: 10px;
}

.plan-header {
  text-align: center;
  padding: 1rem 0 1.5rem 0;
  border-bottom: 2px solid #f3f4f6;
  margin-bottom: 1.5rem;
}

.plan-name {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.plan-price {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.plan-period {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  color: #374151;
  font-size: 0.95rem;
}

.feature-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.plan-status {
  padding: 0.75rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid #6ee7b7;
  border-radius: 10px;
  color: #065f46;
  font-weight: 700;
  text-align: center;
  font-size: 1.05rem;
}

.active-status {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.plan-select-button {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plan-select-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  transform: translateY(-1px);
}

.plan-select-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.payment-button {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);
}

.payment-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);
}

.payment-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.usage-item {
  background: white;
  padding: 1.5rem;
  border: 2px solid #e9d5ff;
  border-radius: 12px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.usage-label {
  font-weight: 600;
  color: #374151;
  font-size: 1.05rem;
}

.usage-value {
  font-weight: 700;
  color: #7c3aed;
  font-size: 1.15rem;
}

.usage-bar {
  height: 12px;
  background: #e9d5ff;
  border-radius: 6px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.unlimited-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .settings-header {
    padding: 1.5rem 0;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .header-subtitle {
    font-size: 0.9rem;
  }

  .settings-container {
    padding: 2rem 1rem;
  }

  .settings-card {
    padding: 1.5rem;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    flex-direction: column;
    gap: 1rem;
  }

  .edit-button,
  .edit-actions {
    align-self: flex-start;
  }

  .action-buttons {
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-title {
    font-size: 1.25rem;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .settings-card {
    padding: 1rem;
  }

  .plan-card {
    padding: 1.5rem;
  }

  .plan-name {
    font-size: 1.5rem;
  }

  .plan-price {
    font-size: 1.5rem;
  }
}
</style>