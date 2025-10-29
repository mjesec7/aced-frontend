<template>
  <div class="settings-page">
    
    <!-- SIDEBAR NAVIGATION -->
    <aside class="settings-sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-icon">A</div>
          <div class="brand-text">
            <h1>ACED</h1>
            <p>Панель настроек</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Аккаунт</div>
          <a href="#profile" class="nav-item active">
            <span class="nav-item-icon">👤</span>
            <span>Профиль</span>
          </a>
          <a href="#security" class="nav-item">
            <span class="nav-item-icon">🔐</span>
            <span>Безопасность</span>
          </a>
          <a href="#notifications" class="nav-item">
            <span class="nav-item-icon">🔔</span>
            <span>Уведомления</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Биллинг</div>
          <a href="#subscription" class="nav-item">
            <span class="nav-item-icon">💳</span>
            <span>Подписка</span>
          </a>
          <a href="#payment" class="nav-item">
            <span class="nav-item-icon">💰</span>
            <span>История платежей</span>
          </a>
          <a href="#promo" class="nav-item">
            <span class="nav-item-icon">🎟️</span>
            <span>Промокоды</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Использование</div>
          <a href="#stats" class="nav-item">
            <span class="nav-item-icon">📊</span>
            <span>Статистика</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-block btn-sm" @click="goToProfile">
          ← Вернуться в профиль
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="settings-main">
      
      <!-- HEADER -->
      <header class="settings-header">
        <div class="header-left">
          <h1 class="header-title">Настройки аккаунта</h1>
          <div class="header-breadcrumb">
            <span>Главная</span>
            <span class="breadcrumb-separator">/</span>
            <span>Настройки</span>
            <span class="breadcrumb-separator">/</span>
            <span>Профиль</span>
          </div>
        </div>
        <div class="header-right">
          <button class="header-action" @click="saveChanges" :disabled="loading">
            <span>💾</span>
            <span>Сохранить изменения</span>
          </button>
        </div>
      </header>

      <!-- CONTENT -->
      <div class="settings-content">
        
        <!-- ALERTS -->
        <div v-if="notification" :class="['alert', notificationClass]">
          <div class="alert-icon">
            <span>{{ notificationIcon }}</span>
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ notificationTitle }}</div>
            <div class="alert-message">{{ notification }}</div>
          </div>
        </div>

        <!-- STATS OVERVIEW -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <div>
                <div class="stat-label">Текущий план</div>
                <div class="stat-value">{{ currentPlanLabel }}</div>
              </div>
              <div class="stat-icon">💎</div>
            </div>
            <div class="stat-change positive">
              <span>↗</span>
              <span>Активен</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div>
                <div class="stat-label">Сообщения</div>
                <div class="stat-value">{{ currentUsageMessages }}</div>
              </div>
              <div class="stat-icon">💬</div>
            </div>
            <div class="progress">
              <div class="progress-bar" :style="{ width: messageUsagePercentage + '%' }"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div>
                <div class="stat-label">Изображения</div>
                <div class="stat-value">{{ currentUsageImages }}</div>
              </div>
              <div class="stat-icon">🖼️</div>
            </div>
            <div class="progress">
              <div class="progress-bar" :style="{ width: imageUsagePercentage + '%' }"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div>
                <div class="stat-label">Осталось дней</div>
                <div class="stat-value">{{ subscriptionExpiryInfo?.daysRemaining || 0 }}</div>
              </div>
              <div class="stat-icon">📅</div>
            </div>
            <div class="stat-change" :class="subscriptionExpiryInfo?.isExpiring ? 'negative' : 'positive'">
              <span>{{ subscriptionExpiryInfo?.isExpiring ? '⚠' : '✓' }}</span>
              <span>{{ subscriptionExpiryInfo?.isExpiring ? 'Истекает' : 'Активен' }}</span>
            </div>
          </div>
        </div>

        <!-- MAIN GRID -->
        <div class="content-grid">
          
          <!-- LEFT COLUMN (8 cols) -->
          <div class="grid-col-8">
            
            <!-- PROFILE CARD -->
            <div class="modern-card mb-4">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">👤</div>
                  <h2 class="card-title">Личная информация</h2>
                  <p class="card-subtitle">Обновите ваши персональные данные и email адрес</p>
                </div>
                <div class="card-actions">
                  <button v-if="!isEditingName" @click="startEditingName" class="btn btn-sm btn-secondary">
                    ✏️ Изменить
                  </button>
                  <button v-else @click="saveNameChanges" class="btn btn-sm btn-success">
                    ✓ Сохранить
                  </button>
                  <button v-if="isEditingName" @click="cancelEditingName" class="btn btn-sm btn-secondary">
                    ✕ Отмена
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <div class="content-grid">
                  <div class="grid-col-6">
                    <div class="form-group">
                      <label class="form-label">Имя</label>
                      <input 
                        v-if="isEditingName"
                        type="text" 
                        v-model="tempUser.name" 
                        class="form-input"
                        placeholder="Введите имя"
                      />
                      <div v-else class="form-input" style="background: var(--light); cursor: default;">
                        {{ user.name || 'Не указано' }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid-col-6">
                    <div class="form-group">
                      <label class="form-label">Фамилия</label>
                      <input 
                        v-if="isEditingName"
                        type="text" 
                        v-model="tempUser.surname" 
                        class="form-input"
                        placeholder="Введите фамилию"
                      />
                      <div v-else class="form-input" style="background: var(--light); cursor: default;">
                        {{ user.surname || 'Не указано' }}
                      </div>
                    </div>
                  </div>

                  <div class="grid-col-12">
                    <div class="form-group">
                      <label class="form-label">
                        Email адрес
                        <span class="label-badge">Подтвержден</span>
                      </label>
                      <input 
                        type="email" 
                        v-model="user.email" 
                        class="form-input"
                        :disabled="loading"
                      />
                      <div class="form-hint">
                        💡 Мы будем отправлять обновления и уведомления на этот email
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECURITY CARD -->
            <div class="modern-card mb-4" v-if="!isGoogleUser">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">🔐</div>
                  <h2 class="card-title">Настройки безопасности</h2>
                  <p class="card-subtitle">Измените пароль и управляйте безопасностью</p>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Текущий пароль</label>
                  <input 
                    type="password" 
                    v-model="oldPassword" 
                    class="form-input"
                    placeholder="Введите текущий пароль"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Новый пароль</label>
                  <input 
                    type="password" 
                    v-model="newPassword" 
                    class="form-input"
                    placeholder="Введите новый пароль"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Подтвердите новый пароль</label>
                  <input 
                    type="password" 
                    v-model="confirmPassword" 
                    class="form-input"
                    placeholder="Повторите новый пароль"
                    :disabled="loading"
                  />
                </div>
              </div>
              
              <div class="card-footer">
                <button @click="sendPasswordReset" class="btn btn-ghost">
                  🔑 Забыли пароль?
                </button>
                <button @click="saveChanges" class="btn btn-primary" :disabled="loading">
                  {{ loading ? '⏳ Обновление...' : '💾 Обновить пароль' }}
                </button>
              </div>
            </div>

            <!-- SUBSCRIPTION PLANS -->
            <div class="modern-card mb-4">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">💎</div>
                  <h2 class="card-title">Тарифные планы</h2>
                  <p class="card-subtitle">Выберите идеальный план для ваших потребностей</p>
                </div>
              </div>
              
              <div class="card-body">
                <div class="pricing-grid">
                  <!-- START PLAN -->
                  <div 
                    class="pricing-card" 
                    :class="{ 'featured': currentPlan === 'start' }"
                    @click="selectPaymentPlan('start')"
                  >
                    <div v-if="currentPlan === 'start'" class="pricing-badge">Текущий план</div>
                    
                    <div class="pricing-header">
                      <h3 class="pricing-name">Start</h3>
                      <div class="pricing-price">
                        <span class="price-amount">260</span>
                        <span class="price-currency">K</span>
                        <span class="price-period">/ месяц</span>
                      </div>
                      <p class="pricing-description">Идеально для начала</p>
                    </div>

                    <ul class="pricing-features">
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Безлимитные сообщения</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Доступ к словарю</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Базовые курсы</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Поддержка домашних заданий</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Приоритетная поддержка</span>
                      </li>
                      <li>
                        <span class="feature-icon disabled">✕</span>
                        <span style="color: var(--gray-light);">Безлимитные изображения</span>
                      </li>
                    </ul>

                    <button 
                      class="btn btn-outline btn-block"
                      :disabled="currentPlan === 'start' || currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'start' ? '✓ Текущий план' : 'Выбрать план' }}
                    </button>
                  </div>

                  <!-- PRO PLAN -->
                  <div 
                    class="pricing-card featured" 
                    :class="{ 'featured': currentPlan === 'pro' || paymentPlan === 'pro' }"
                    @click="selectPaymentPlan('pro')"
                  >
                    <div class="pricing-badge">{{ currentPlan === 'pro' ? 'Текущий план' : 'Рекомендуем' }}</div>
                    
                    <div class="pricing-header">
                      <h3 class="pricing-name">Pro</h3>
                      <div class="pricing-price">
                        <span class="price-amount">455</span>
                        <span class="price-currency">K</span>
                        <span class="price-period">/ месяц</span>
                      </div>
                      <p class="pricing-description">Для опытных пользователей и профессионалов</p>
                    </div>

                    <ul class="pricing-features">
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Всё из Start</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Безлимитные изображения</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Продвинутые курсы</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Персональная аналитика</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Персональные курсы</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Эксклюзивный контент</span>
                      </li>
                    </ul>

                    <button 
                      class="btn btn-primary btn-block"
                      :disabled="currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'pro' ? '✓ Текущий план' : 'Перейти на Pro' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <button 
                  class="btn btn-success btn-lg btn-block" 
                  @click="goToPayment"
                  :disabled="!paymentPlan || loading"
                >
                  {{ getPaymentButtonText() }}
                </button>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN (4 cols) -->
          <div class="grid-col-4">
            
            <!-- PROMO CODE CARD -->
            <div class="modern-card mb-4">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">🎟️</div>
                  <h2 class="card-title">Промокод</h2>
                  <p class="card-subtitle">Есть промокод? Примените его здесь</p>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Промокод</label>
                  <input 
                    type="text" 
                    v-model="promoCode" 
                    class="form-input"
                    placeholder="ВВЕДИТЕ КОД"
                    :disabled="loading || isProcessingPromo"
                    @input="handlePromoCodeInput"
                    style="text-transform: uppercase; font-weight: 600; font-family: monospace;"
                  />
                  <div v-if="isValidatingPromo" class="form-hint">
                    <div class="spinner-small"></div>
                    Проверка...
                  </div>
                  <div v-else-if="promoValidation && promoCode.length > 3">
                    <div v-if="promoValidation.valid" class="form-hint" style="color: var(--success);">
                      ✓ Действителен! Предоставляет {{ promoValidation.data?.grantsPlan?.toUpperCase() }} план
                    </div>
                    <div v-else class="form-error">
                      ✕ {{ promoValidation.error }}
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Выберите план</label>
                  <select v-model="selectedPlan" class="form-select" :disabled="loading">
                    <option value="">Выберите план...</option>
                    <option value="start">Start план</option>
                    <option value="pro">Pro план</option>
                  </select>
                </div>

                <button 
                  class="btn btn-success btn-block"
                  @click="applyPromo"
                  :disabled="!canApplyPromo || isProcessingPromo"
                >
                  {{ promoButtonText }}
                </button>
              </div>
            </div>

            <!-- QUICK STATS -->
            <div class="modern-card mb-4">
              <div class="card-header">
                <div class="card-title-group">
                  <h2 class="card-title">Быстрая статистика</h2>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <div class="progress-label">
                    <span class="progress-label-text">Использовано сообщений</span>
                    <span class="progress-label-value">
                      {{ currentUsageMessages }} / {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}
                    </span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" :style="{ width: messageUsagePercentage + '%' }"></div>
                  </div>
                </div>

                <div class="form-group">
                  <div class="progress-label">
                    <span class="progress-label-text">Создано изображений</span>
                    <span class="progress-label-value">
                      {{ currentUsageImages }} / {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}
                    </span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" :style="{ width: imageUsagePercentage + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- SUBSCRIPTION INFO -->
            <div class="modern-card" v-if="subscriptionExpiryInfo">
              <div class="card-header">
                <div class="card-title-group">
                  <h2 class="card-title">Подписка</h2>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group mb-0">
                  <div class="badge badge-primary" style="margin-bottom: var(--space-md);">
                    {{ currentPlanLabel }} План
                  </div>
                  
                  <div style="font-size: 0.875rem; color: var(--gray); margin-bottom: var(--space-sm);">
                    Истекает
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: var(--dark); margin-bottom: var(--space-md);">
                    {{ subscriptionExpiryInfo.formattedDate }}
                  </div>
                  
                  <div :class="['badge', subscriptionExpiryInfo.isExpiring ? 'badge-warning' : 'badge-success']">
                    {{ subscriptionExpiryInfo.isExpiring ? '⚠ Истекает скоро' : '✓ Активен' }}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>

    <!-- LOADING OVERLAY -->
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

    async goToPayment() {
  if (!this.paymentPlan) {
    this.showNotification('Выберите тариф для оплаты', 'warning');
    return;
  }

  // Validate user data before navigation
  if (!this.userId) {
    this.showNotification('Ошибка: не найден ID пользователя. Попробуйте обновить страницу.', 'error');
    return;
  }

  try {
    console.log('🚀 Navigating to payment with data:', {
      plan: this.paymentPlan,
      userId: this.userId,
      userName: this.user.name,
      userEmail: this.user.email,
      currentPlan: this.currentPlan
    });

    // Calculate amount based on plan
    const amounts = {
      start: 260000, // 260,000 UZS
      pro: 455000    // 455,000 UZS
    };

    // Navigate to UniversalCheckout (PaymentSelection route)
    await this.$router.push({
      name: 'PaymentSelection',
      params: { 
        plan: this.paymentPlan 
      },
      query: {
        // Required fields
        userId: this.userId,
        plan: this.paymentPlan,
        amount: amounts[this.paymentPlan] || amounts.start,
        
        // Optional but recommended fields
        userName: this.user.name || 'Пользователь',
        userEmail: this.user.email || '',
        currentPlan: this.currentPlan || 'free',
        
        // Default provider (can be changed in checkout)
        provider: 'multicard',
        
        // Additional metadata
        source: 'settings',
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('❌ Navigation error:', error);
    
    // Handle navigation error
    if (error.name !== 'NavigationDuplicated') {
      this.showNotification('Ошибка при переходе к оплате. Попробуйте снова.', 'error');
    }
  }
},

getPaymentButtonText() {
  if (!this.paymentPlan) return 'Выберите тариф';
  if (this.currentPlan === this.paymentPlan) return 'Уже активен';
  
  const planNames = {
    start: 'START',
    pro: 'PRO'
  };
  
  return `💳 Оплатить ${planNames[this.paymentPlan] || this.paymentPlan.toUpperCase()}`;
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

<style>
/* ========================================
   ULTRA MODERN SETTINGS - ALL STYLES
   ======================================== */

:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --accent: #ec4899;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --dark: #0f172a;
  --dark-light: #1e293b;
  --gray-dark: #334155;
  --gray: #64748b;
  --gray-light: #94a3b8;
  --gray-lighter: #cbd5e1;
  --gray-lightest: #e2e8f0;
  --light: #f1f5f9;
  --lighter: #f8fafc;
  --white: #ffffff;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.16);
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.settings-page {
  min-height: 100vh;
  background: var(--lighter);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
}

/* SIDEBAR */
.settings-sidebar {
  width: 280px;
  background: var(--white);
  border-right: 1px solid var(--gray-lightest);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: var(--transition);
}

.sidebar-header {
  padding: var(--space-xl);
  border-bottom: 1px solid var(--gray-lightest);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--white);
  font-weight: 700;
}

.brand-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 0.125rem;
}

.brand-text p {
  font-size: 0.75rem;
  color: var(--gray);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

.nav-section {
  margin-bottom: var(--space-xl);
}

.nav-section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gray);
  margin-bottom: var(--space-md);
  padding: 0 var(--space-md);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  margin-bottom: var(--space-xs);
  border-radius: var(--radius-md);
  color: var(--gray-dark);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--light);
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary);
  color: var(--white);
}

.nav-item-icon {
  font-size: 1.125rem;
  width: 1.25rem;
  text-align: center;
}

.sidebar-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--gray-lightest);
}

/* MAIN CONTENT */
.settings-main {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.settings-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-lightest);
  padding: var(--space-lg) var(--space-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  flex: 1;
}

.header-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.875rem;
  color: var(--gray);
}

.breadcrumb-separator {
  color: var(--gray-light);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-action {
  padding: 0.625rem 1.25rem;
  background: var(--white);
  border: 1px solid var(--gray-lightest);
  border-radius: var(--radius-md);
  color: var(--gray-dark);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.header-action:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.settings-content {
  flex: 1;
  padding: var(--space-2xl);
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* GRID */
.content-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-xl);
}

.grid-col-12 { grid-column: span 12; }
.grid-col-8 { grid-column: span 8; }
.grid-col-6 { grid-column: span 6; }
.grid-col-4 { grid-column: span 4; }

/* CARDS */
.modern-card {
  background: var(--white);
  border-radius: var(--radius-xl);
  border: 1px solid var(--gray-lightest);
  overflow: hidden;
  transition: var(--transition);
}

.modern-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--gray-lighter);
}

.mb-4 {
  margin-bottom: var(--space-xl);
}

.card-header {
  padding: var(--space-xl);
  border-bottom: 1px solid var(--gray-lightest);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title-group {
  flex: 1;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: var(--space-md);
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 0.25rem;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--gray);
  line-height: 1.5;
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
}

.card-body {
  padding: var(--space-xl);
}

.card-footer {
  padding: var(--space-xl);
  border-top: 1px solid var(--gray-lightest);
  background: var(--lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* STAT CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.stat-card {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--gray-lightest);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary);
  opacity: 0;
  transition: var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  background: var(--light);
  color: var(--primary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: var(--space-xs);
  line-height: 1;
}

.stat-change {
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.stat-change.positive {
  color: var(--success);
}

.stat-change.negative {
  color: var(--danger);
}

/* FORMS */
.form-group {
  margin-bottom: var(--space-lg);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: var(--space-sm);
}

.label-badge {
  padding: 0.125rem 0.5rem;
  background: var(--primary);
  color: var(--white);
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--white);
  border: 2px solid var(--gray-lightest);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  color: var(--dark);
  font-family: inherit;
  transition: var(--transition);
}

.form-input:hover,
.form-select:hover {
  border-color: var(--gray-lighter);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background: var(--light);
  color: var(--gray);
  cursor: not-allowed;
  border-color: var(--gray-lightest);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.form-hint {
  font-size: 0.8125rem;
  color: var(--gray);
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-error {
  font-size: 0.8125rem;
  color: var(--danger);
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* BUTTONS */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  text-decoration: none;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-success {
  background: var(--success);
  color: var(--white);
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--gray-lightest);
  color: var(--gray-dark);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-lighter);
  color: var(--dark);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary);
  color: var(--white);
}

.btn-ghost {
  background: transparent;
  color: var(--gray-dark);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--light);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.btn-block {
  width: 100%;
}

/* PRICING CARDS */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-xl);
  margin-top: var(--space-xl);
}

.pricing-card {
  background: var(--white);
  border: 2px solid var(--gray-lightest);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  position: relative;
  transition: var(--transition);
  cursor: pointer;
}

.pricing-card:hover {
  border-color: var(--primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-2xl);
}

.pricing-card.featured {
  border-color: var(--primary);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, var(--white) 100%);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  right: var(--space-xl);
  background: var(--gradient-primary);
  color: var(--white);
  padding: 0.375rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pricing-header {
  text-align: center;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-xl);
  border-bottom: 2px solid var(--gray-lightest);
}

.pricing-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: var(--space-sm);
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.price-amount {
  font-size: 3rem;
  font-weight: 800;
  color: var(--primary);
  line-height: 1;
}

.price-currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray);
}

.price-period {
  font-size: 1rem;
  color: var(--gray);
}

.pricing-description {
  font-size: 0.9375rem;
  color: var(--gray);
  text-align: center;
}

.pricing-features {
  list-style: none;
  margin-bottom: var(--space-xl);
}

.pricing-features li {
  padding: var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: 0.9375rem;
  color: var(--gray-dark);
  border-bottom: 1px solid var(--gray-lightest);
}

.pricing-features li:last-child {
  border-bottom: none;
}

.feature-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--success);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.feature-icon.disabled {
  background: var(--gray-lighter);
  color: var(--gray);
}

/* ALERTS */
.alert {
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  border: 2px solid;
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.alert-message {
  font-size: 0.875rem;
  line-height: 1.6;
}

.alert-success {
  background: #f0fdf4;
  border-color: var(--success);
  color: #166534;
}

.alert-success .alert-icon {
  background: var(--success);
  color: var(--white);
}

.alert-warning {
  background: #fffbeb;
  border-color: var(--warning);
  color: #92400e;
}

.alert-warning .alert-icon {
  background: var(--warning);
  color: var(--white);
}

.alert-danger {
  background: #fef2f2;
  border-color: var(--danger);
  color: #991b1b;
}

.alert-danger .alert-icon {
  background: var(--danger);
  color: var(--white);
}

.alert-info {
  background: #eff6ff;
  border-color: var(--primary);
  color: #1e40af;
}

.alert-info .alert-icon {
  background: var(--primary);
  color: var(--white);
}

/* PROGRESS */
.progress {
  height: 12px;
  background: var(--gray-lightest);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-md);
}

.progress-bar {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  margin-bottom: var(--space-sm);
}

.progress-label-text {
  font-weight: 500;
  color: var(--dark);
}

.progress-label-value {
  font-weight: 700;
  color: var(--primary);
}

/* BADGES */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-primary {
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary);
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

/* LOADING */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gray-lighter);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--white);
  font-size: 1rem;
  font-weight: 500;
  margin-top: var(--space-lg);
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .grid-col-8,
  .grid-col-4,
  .grid-col-6 {
    grid-column: span 12;
  }
  
  .settings-sidebar {
    transform: translateX(-100%);
  }
  
  .settings-sidebar.mobile-open {
    transform: translateX(0);
  }
  
  .settings-main {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .settings-content {
    padding: var(--space-lg);
  }
  
  .settings-header {
    padding: var(--space-lg);
  }
  
  .header-title {
    font-size: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .card-footer {
    flex-direction: column;
    gap: var(--space-md);
  }
  
  .card-footer .btn {
    width: 100%;
  }
}
</style>