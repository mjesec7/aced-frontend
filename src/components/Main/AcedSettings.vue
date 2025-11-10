<template>
  <div class="settings-page">
    <!-- MAIN CONTENT -->
    <main class="settings-main">
      
      <!-- HEADER -->
      <header class="settings-header">
        <div class="header-content">
          <button class="back-button" @click="goToProfile">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Назад</span>
          </button>
          <div class="header-text">
            <h1 class="header-title">Настройки аккаунта</h1>
            <p class="header-subtitle">Управляйте вашим профилем и подпиской</p>
          </div>
        </div>
        <button class="save-button" @click="saveChanges" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Сохранить</span>
        </button>
      </header>

      <!-- ALERTS -->
      <div v-if="notification" :class="['alert-banner', notificationClass]">
        <div class="alert-icon">{{ notificationIcon }}</div>
        <div class="alert-content">
          <strong>{{ notificationTitle }}</strong>
          <p>{{ notification }}</p>
        </div>
        <button class="alert-close" @click="notification = ''">×</button>
      </div>

      <!-- CONTENT -->
      <div class="settings-content">
        
        <!-- STATS OVERVIEW -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Текущий план</p>
              <h3 class="stat-value">{{ currentPlanLabel }}</h3>
              <span class="stat-badge active">Активен</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Сообщения</p>
              <h3 class="stat-value">{{ currentUsageMessages }} <span class="stat-limit">/ {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}</span></h3>
              <div class="mini-progress">
                <div class="mini-progress-bar" :style="{ width: messageUsagePercentage + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Изображения</p>
              <h3 class="stat-value">{{ currentUsageImages }} <span class="stat-limit">/ {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}</span></h3>
              <div class="mini-progress">
                <div class="mini-progress-bar" :style="{ width: imageUsagePercentage + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Осталось дней</p>
              <h3 class="stat-value">{{ subscriptionExpiryInfo?.daysRemaining || 0 }}</h3>
              <span :class="['stat-badge', subscriptionExpiryInfo?.isExpiring ? 'warning' : 'active']">
                {{ subscriptionExpiryInfo?.isExpiring ? 'Истекает' : 'Активен' }}
              </span>
            </div>
          </div>
        </div>

        <!-- MAIN GRID -->
        <div class="content-grid">
          
          <!-- LEFT COLUMN -->
          <div class="left-column">
            
            <!-- PROFILE CARD -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Личная информация</h2>
                    <p class="card-description">Обновите ваши персональные данные</p>
                  </div>
                </div>
                <button v-if="!isEditingName" @click="startEditingName" class="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              
              <div class="card-body">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Имя</label>
                    <input 
                      v-if="isEditingName"
                      type="text" 
                      v-model="tempUser.name" 
                      class="form-input"
                      placeholder="Введите имя"
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
                      class="form-input"
                      placeholder="Введите фамилию"
                    />
                    <div v-else class="form-display">
                      {{ user.surname || 'Не указано' }}
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Email адрес
                    <span class="verified-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Подтвержден
                    </span>
                  </label>
                  <input 
                    type="email" 
                    v-model="user.email" 
                    class="form-input"
                    :disabled="!isEditingName"
                  />
                </div>

                <div v-if="isEditingName" class="form-actions">
                  <button @click="cancelEditingName" class="btn btn-secondary">Отмена</button>
                  <button @click="saveNameChanges" class="btn btn-primary">Сохранить изменения</button>
                </div>
              </div>
            </div>

            <!-- SECURITY CARD -->
            <div class="card" v-if="!isGoogleUser">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Безопасность</h2>
                    <p class="card-description">Управление паролем и безопасностью</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Текущий пароль</label>
                  <input 
                    type="password" 
                    v-model="oldPassword" 
                    class="form-input"
                    placeholder="••••••••"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Новый пароль</label>
                  <input 
                    type="password" 
                    v-model="newPassword" 
                    class="form-input"
                    placeholder="••••••••"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Подтвердите новый пароль</label>
                  <input 
                    type="password" 
                    v-model="confirmPassword" 
                    class="form-input"
                    placeholder="••••••••"
                    :disabled="loading"
                  />
                </div>

                <div class="form-actions">
                  <button @click="sendPasswordReset" class="btn btn-text">
                    Забыли пароль?
                  </button>
                  <button @click="saveChanges" class="btn btn-primary" :disabled="loading">
                    {{ loading ? 'Обновление...' : 'Обновить пароль' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- SUBSCRIPTION PLANS -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Тарифные планы</h2>
                    <p class="card-description">Выберите подходящий план</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="pricing-cards">
                  
                  <!-- START PLAN -->
                  <div 
                    :class="['pricing-card', { selected: currentPlan === 'start' }]"
                    @click="selectPaymentPlan('start')"
                  >
                    <div v-if="currentPlan === 'start'" class="current-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Текущий
                    </div>
                    
                    <div class="pricing-header">
                      <h3>Start</h3>
                      <div class="pricing-price">
                        <span class="price-currency">UZS</span>
                        <span class="price-amount">260K</span>
                        <span class="price-period">/мес</span>
                      </div>
                      <p class="pricing-tagline">Для начинающих</p>
                    </div>

                    <ul class="feature-list">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Безлимитные сообщения
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Доступ к словарю
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Базовые курсы
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Поддержка домашних заданий
                      </li>
                      <li class="disabled">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Безлимитные изображения
                      </li>
                    </ul>

                    <button 
                      class="pricing-button"
                      :disabled="currentPlan === 'start' || currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'start' ? 'Текущий план' : 'Выбрать' }}
                    </button>
                  </div>

                  <!-- PRO PLAN -->
                  <div 
                    :class="['pricing-card', 'featured', { selected: currentPlan === 'pro' || paymentPlan === 'pro' }]"
                    @click="selectPaymentPlan('pro')"
                  >
                    <div class="popular-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {{ currentPlan === 'pro' ? 'Текущий' : 'Популярный' }}
                    </div>
                    
                    <div class="pricing-header">
                      <h3>Pro</h3>
                      <div class="pricing-price">
                        <span class="price-currency">UZS</span>
                        <span class="price-amount">455K</span>
                        <span class="price-period">/мес</span>
                      </div>
                      <p class="pricing-tagline">Для профессионалов</p>
                    </div>

                    <ul class="feature-list">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Всё из Start
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Безлимитные изображения
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Продвинутые курсы
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Персональная аналитика
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Эксклюзивный контент
                      </li>
                    </ul>

                    <button 
                      class="pricing-button"
                      :disabled="currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'pro' ? 'Текущий план' : 'Перейти на Pro' }}
                    </button>
                  </div>
                </div>

                <button 
                  class="btn btn-large btn-primary"
                  @click="goToPayment"
                  :disabled="!paymentPlan || loading"
                  style="margin-top: 24px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {{ getPaymentButtonText() }}
                </button>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN -->
          <div class="right-column">
            
            <!-- PROMO CODE CARD -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                      <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                      <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Промокод</h2>
                    <p class="card-description">Активируйте специальное предложение</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Введите промокод</label>
                  <input 
                    type="text" 
                    v-model="promoCode" 
                    class="form-input promo-input"
                    placeholder="ПРОМОКОД2024"
                    :disabled="loading || isProcessingPromo"
                    @input="handlePromoCodeInput"
                  />
                  <div v-if="isValidatingPromo" class="form-hint">
                    <div class="spinner-mini"></div>
                    Проверка промокода...
                  </div>
                  <div v-else-if="promoValidation && promoCode.length > 3">
                    <div v-if="promoValidation.valid" class="form-success">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Действителен! План {{ promoValidation.data?.grantsPlan?.toUpperCase() }}
                    </div>
                    <div v-else class="form-error">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {{ promoValidation.error }}
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
                  class="btn btn-primary"
                  @click="applyPromo"
                  :disabled="!canApplyPromo || isProcessingPromo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {{ promoButtonText }}
                </button>
              </div>
            </div>

            <!-- SUBSCRIPTION INFO -->
            <div class="card" v-if="subscriptionExpiryInfo">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Подписка</h2>
                    <p class="card-description">Информация о вашей подписке</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="subscription-info">
                  <div class="subscription-plan">
                    <span class="plan-badge">{{ currentPlanLabel }} План</span>
                  </div>
                  
                  <div class="subscription-expiry">
                    <p class="expiry-label">Действует до</p>
                    <h3 class="expiry-date">{{ subscriptionExpiryInfo.formattedDate }}</h3>
                  </div>
                  
                  <div :class="['subscription-status', subscriptionExpiryInfo.isExpiring ? 'expiring' : 'active']">
                    <svg v-if="!subscriptionExpiryInfo.isExpiring" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    {{ subscriptionExpiryInfo.isExpiring ? 'Истекает скоро' : 'Активна' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- USAGE STATS -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 20V10"/>
                      <path d="M12 20V4"/>
                      <path d="M6 20v-6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Использование</h2>
                    <p class="card-description">Ваша статистика за месяц</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="usage-item">
                  <div class="usage-header">
                    <span class="usage-label">Сообщения</span>
                    <span class="usage-value">{{ currentUsageMessages }} / {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}</span>
                  </div>
                  <div class="usage-progress">
                    <div class="usage-progress-bar messages" :style="{ width: messageUsagePercentage + '%' }"></div>
                  </div>
                </div>

                <div class="usage-item">
                  <div class="usage-header">
                    <span class="usage-label">Изображения</span>
                    <span class="usage-value">{{ currentUsageImages }} / {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}</span>
                  </div>
                  <div class="usage-progress">
                    <div class="usage-progress-bar images" :style="{ width: imageUsagePercentage + '%' }"></div>
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
      <div class="loading-spinner"></div>
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
      notificationTitle: "",
      
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
        console.error('Error getting current plan:', e);
        return localStorage.getItem('userStatus') || 'free';
      }
    },
    
    subscriptionExpiryInfo() {
      try {
        const details = this.subscriptionDetails || {};
        
        if (!details || !details.expiryDate || this.currentPlan === 'free') {
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
      } catch (e) {
        console.error('Error getting subscription expiry info:', e);
        return null;
      }
    },
    
    appliedPromocodesCount() {
      try {
        return this.appliedPromocodes?.length || 0;
      } catch (e) {
        return 0;
      }
    },
    
    currentUsageMessages() {
      try {
        return this.currentUsage?.messages || 0;
      } catch (e) {
        console.error('Error getting current usage messages:', e);
        return 0;
      }
    },
    
    currentUsageImages() {
      try {
        return this.currentUsage?.images || 0;
      } catch (e) {
        console.error('Error getting current usage images:', e);
        return 0;
      }
    },
    
    usageLimitsMessages() {
      try {
        return this.usageLimits?.messages || 50;
      } catch (e) {
        console.error('Error getting usage limits messages:', e);
        return 50;
      }
    },
    
    usageLimitsImages() {
      try {
        return this.usageLimits?.images || 5;
      } catch (e) {
        console.error('Error getting usage limits images:', e);
        return 5;
      }
    },
    
    messageUsagePercentage() {
      try {
        const messages = this.currentUsageMessages;
        const limit = this.usageLimitsMessages;
        return (limit === -1) ? 0 : Math.min(100, Math.round((messages / limit) * 100));
      } catch (e) {
        console.error('Error calculating message usage percentage:', e);
        return 0;
      }
    },
    
    imageUsagePercentage() {
      try {
        const images = this.currentUsageImages;
        const limit = this.usageLimitsImages;
        return (limit === -1) ? 0 : Math.min(100, Math.round((images / limit) * 100));
      } catch (e) {
        console.error('Error calculating image usage percentage:', e);
        return 0;
      }
    },
    
    currentPlanLabel() {
      try {
        const labels = {
          pro: 'Pro',
          start: 'Start', 
          free: 'Free'
        };
        return labels[this.currentPlan] || 'Free';
      } catch (e) {
        return 'Free';
      }
    },
    
    userId() {
      try {
        return this.currentUser?.uid || null;
      } catch (e) {
        return null;
      }
    },
    
    canApplyPromo() {
      try {
        return this.promoCode && 
               this.promoCode.trim().length > 3 && 
               this.selectedPlan && 
               this.promoValidation &&
               this.promoValidation.valid === true &&
               !this.loading &&
               !this.isProcessingPromo &&
               !this.planCompatibilityError;
      } catch (e) {
        return false;
      }
    },
    
    promoButtonText() {
      try {
        if (this.isProcessingPromo) return 'Применение...';
        if (this.isValidatingPromo) return 'Проверка...';
        if (!this.promoCode.trim()) return 'Введите промокод';
        if (!this.selectedPlan) return 'Выберите тариф';
        if (this.promoValidation && !this.promoValidation.valid) return 'Неверный промокод';
        if (this.planCompatibilityError) return 'Проверьте тариф';
        if (this.canApplyPromo) return 'Применить промокод';
        return 'Применить промокод';
      } catch (e) {
        return 'Применить промокод';
      }
    },
    
    planCompatibilityError() {
      try {
        if (!this.promoValidation || !this.promoValidation.valid || !this.selectedPlan) return false;
        
        const promoGrantsPlan = this.promoValidation.data?.grantsPlan;
        if (promoGrantsPlan && promoGrantsPlan !== this.selectedPlan) {
          return true;
        }
        
        return false;
      } catch (e) {
        return false;
      }
    }
  },
  
  watch: {
    '$store.state.user': {
      handler(newUser, oldUser) {
        try {
          const newPlan = newUser?.subscriptionPlan;
          const oldPlan = oldUser?.subscriptionPlan;
          
          if (newPlan !== oldPlan) {
            this.handleUserStatusChange(newPlan, oldPlan);
          }
        } catch (e) {
          console.error('Error watching store user:', e);
        }
      },
      deep: true,
      immediate: true
    },

    currentPlan: {
      handler(newPlan, oldPlan) {
        try {
          if (newPlan !== oldPlan) {
            this.forceReactivityUpdate();
          }
        } catch (e) {
          console.error('Error watching current plan:', e);
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    console.log('🔧 AcedSettings component mounted');
    await this.initializeComponent();
    this.componentMounted = true;
  },
  
  beforeUnmount() {
    console.log('🔧 AcedSettings component unmounting');
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
          this.showNotification(`${planLabel} подписка активирована!`, 'success', 5000);
        }

      } catch (error) {
        console.error('❌ Error handling status change:', error);
        this.$forceUpdate();
      }
    },

    forceReactivityUpdate() {
      try {
        this.reactivityKey++;
        this.lastUpdateTime = Date.now();
        
        this.$forceUpdate();
        
        this.$nextTick(() => {
          this.$forceUpdate();
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

    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
    },

    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Загрузка настроек...';
      
      try {
        console.log('📥 Loading component data...');
        await this.checkAuthState();
        await this.loadInitialData();
        this.forceReactivityUpdate();
        console.log('✅ Component initialized successfully');
      } catch (error) {
        console.error('❌ AcedSettings initialization error:', error);
        this.showNotification('Ошибка загрузки настроек', 'error');
      } finally {
        this.loading = false;
      }
    },

    async loadInitialData() {
      try {
        console.log('📦 Loading initial user data...');
        
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('user/loadUserStatus');
          console.log('✅ User status loaded');
          
          // Force reactivity update after data loads
          this.$nextTick(() => {
            this.forceReactivityUpdate();
          });
        }
      } catch (error) {
        console.error('❌ Load initial data error:', error);
      }
    },
    
    checkAuthState() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.currentUser = user;
          if (user) {
            console.log('👤 User authenticated:', user.uid);
            this.isGoogleUser = user.providerData[0]?.providerId === "google.com";
            await this.fetchUserData();
          } else {
            console.log('❌ No authenticated user');
          }
          resolve();
        });
      });
    },
    
    async fetchUserData() {
      try {
        if (!this.currentUser) return;
        
        console.log('📄 Fetching user document...');
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          this.user = userDoc.data();
          this.tempUser = { name: this.user.name, surname: this.user.surname };
          console.log('✅ User data fetched');
        } else {
          console.log('📝 Creating new user document');
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
        console.log('🔍 Validating promocode:', promocodeUpper);
        
        if (this.$store && this.$store.dispatch) {
          const storeResult = await this.$store.dispatch('user/validatePromocode', promocodeUpper);
          
          if (storeResult && typeof storeResult === 'object') {
            this.promoValidation = storeResult;
            console.log('✅ Promocode validation result:', storeResult);
            
            if (storeResult.valid && storeResult.data?.grantsPlan && !this.selectedPlan) {
              this.selectedPlan = storeResult.data.grantsPlan;
            }
            
            this.isValidatingPromo = false;
            return;
          }
        }
        
        this.promoValidation = {
          valid: false,
          error: `Не удалось проверить промокод "${promocodeUpper}".`
        };
        
      } catch (error) {
        console.error('❌ Promocode validation error:', error);
        this.promoValidation = {
          valid: false,
          error: 'Ошибка проверки промокода.'
        };
      } finally {
        this.isValidatingPromo = false;
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
        console.log('💳 Applying promocode:', normalizedCode, 'for plan:', this.selectedPlan);
        
        const result = await this.$store.dispatch('user/applyPromocode', {
          code: normalizedCode,
          plan: this.selectedPlan,
          userId: this.userId
        });
        
        if (result && (result.success === true || result.status === 'success')) {
          const planLabel = this.selectedPlan === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`Промокод применён! ${planLabel} подписка активирована!`, 'success');
          
          this.promoCode = '';
          this.selectedPlan = '';
          this.promoValidation = null;
          
          this.forceReactivityUpdate();
        } else {
          const errorMessage = result?.error || result?.message || 'Не удалось применить промокод';
          this.showNotification(errorMessage, 'error');
        }
        
      } catch (error) {
        console.error('❌ Apply promo error:', error);
        this.showNotification('Ошибка применения промокода', 'error');
      } finally {
        this.isProcessingPromo = false;
      }
    },

    selectPaymentPlan(plan) {
      if (this.currentPlan === plan || (this.currentPlan === 'pro' && plan === 'start')) {
        return;
      }
      this.paymentPlan = plan;
      console.log('📌 Payment plan selected:', plan);
    },

    async goToPayment() {
      if (!this.paymentPlan) {
        this.showNotification('Выберите тариф для оплаты', 'warning');
        return;
      }

      if (!this.userId) {
        this.showNotification('Ошибка: не найден ID пользователя.', 'error');
        return;
      }

      try {
        const amounts = {
          start: 260000,
          pro: 455000
        };

        console.log('🔄 Navigating to payment page...');
        
        await this.$router.push({
          name: 'PaymentSelection',
          params: { 
            plan: this.paymentPlan 
          },
          query: {
            userId: this.userId,
            plan: this.paymentPlan,
            amount: amounts[this.paymentPlan] || amounts.start,
            userName: this.user.name || 'Пользователь',
            userEmail: this.user.email || '',
            currentPlan: this.currentPlan || 'free',
            provider: 'multicard',
            source: 'settings',
            timestamp: Date.now()
          }
        });
      } catch (error) {
        console.error('❌ Navigation error:', error);
        
        if (error.name !== 'NavigationDuplicated') {
          this.showNotification('Ошибка при переходе к оплате.', 'error');
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
      
      return `Оплатить ${planNames[this.paymentPlan] || this.paymentPlan.toUpperCase()}`;
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

    async saveChanges() {
      this.showNotification('Функция обновления пароля', 'info');
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

    showNotification(message, type = 'info', duration = 5000) {
      this.notification = message;
      this.notificationClass = `notification-${type}`;
      
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      
      const titles = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Внимание',
        info: 'Информация'
      };
      
      this.notificationIcon = icons[type] || 'ℹ';
      this.notificationTitle = titles[type] || 'Уведомление';
      
      setTimeout(() => {
        this.notification = '';
        this.notificationClass = '';
        this.notificationIcon = '';
        this.notificationTitle = '';
      }, duration);
    }
  }
}
</script>

<style scoped>
/* ========================================
   MODERN SETTINGS PAGE - REDESIGNED
   Clean, Professional, Fun
   ======================================== */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
}

/* ==================== HEADER ==================== */

.settings-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateX(-4px);
}

.back-button svg {
  stroke-width: 2.5;
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 15px;
  color: #6b7280;
  font-weight: 400;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ==================== ALERTS ==================== */

.alert-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
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
  background: #ecfdf5;
  border: 2px solid #10b981;
}

.notification-error {
  background: #fef2f2;
  border: 2px solid #ef4444;
}

.notification-warning {
  background: #fffbeb;
  border: 2px solid #f59e0b;
}

.notification-info {
  background: #eff6ff;
  border: 2px solid #3b82f6;
}

.alert-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.notification-success .alert-icon {
  background: #10b981;
  color: white;
}

.notification-error .alert-icon {
  background: #ef4444;
  color: white;
}

.notification-warning .alert-icon {
  background: #f59e0b;
  color: white;
}

.notification-info .alert-icon {
  background: #3b82f6;
  color: white;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 2px;
  color: #111827;
}

.alert-content p {
  font-size: 14px;
  color: #6b7280;
}

.alert-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s;
}

.alert-close:hover {
  color: #374151;
}

/* ==================== STATS SECTION ==================== */

.settings-content {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e5e7eb;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-limit {
  font-size: 16px;
  font-weight: 500;
  color: #9ca3af;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.stat-badge.warning {
  background: #fed7aa;
  color: #92400e;
}

.mini-progress {
  height: 6px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}

.mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 999px;
  transition: width 0.6s ease;
}

/* ==================== CONTENT GRID ==================== */

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ==================== CARDS ==================== */

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #f3f4f6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #f3f4f6;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2px;
}

.card-description {
  font-size: 13px;
  color: #6b7280;
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: #f3f4f6;
  border-color: #667eea;
  color: #667eea;
}

.card-body {
  padding: 24px;
}

/* ==================== FORMS ==================== */

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #d1fae5;
  color: #065f46;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  color: #111827;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input:hover,
.form-select:hover {
  border-color: #d1d5db;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-display {
  padding: 12px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 15px;
  color: #111827;
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 20px;
  padding-right: 40px;
}

.promo-input {
  text-transform: uppercase;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.form-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  margin-top: 6px;
}

.form-success {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #059669;
  margin-top: 6px;
  font-weight: 500;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #dc2626;
  margin-top: 6px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* ==================== BUTTONS ==================== */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.btn-text {
  background: transparent;
  color: #667eea;
  padding: 8px 16px;
}

.btn-text:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  width: 100%;
}

/* ==================== PRICING CARDS ==================== */

.pricing-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}

.pricing-card {
  background: white;
  border: 3px solid #e5e7eb;
  border-radius: 16px;
  padding: 28px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pricing-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.pricing-card.selected {
  border-color: #667eea;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, white 100%);
}

.pricing-card.featured {
  border-color: #667eea;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.08) 0%, white 100%);
}

.current-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #d1fae5;
  color: #065f46;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.pricing-header {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 2px solid #f3f4f6;
  margin-bottom: 24px;
}

.pricing-header h3 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.price-currency {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.price-amount {
  font-size: 36px;
  font-weight: 800;
  color: #667eea;
  line-height: 1;
}

.price-period {
  font-size: 14px;
  color: #9ca3af;
}

.pricing-tagline {
  font-size: 13px;
  color: #6b7280;
}

.feature-list {
  list-style: none;
  margin-bottom: 24px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list li.disabled {
  color: #9ca3af;
}

.feature-list li svg {
  flex-shrink: 0;
  color: #10b981;
}

.feature-list li.disabled svg {
  color: #d1d5db;
}

.pricing-button {
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pricing-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.pricing-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ==================== SUBSCRIPTION INFO ==================== */

.subscription-info {
  text-align: center;
}

.subscription-plan {
  margin-bottom: 20px;
}

.plan-badge {
  display: inline-block;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 700;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.subscription-expiry {
  margin-bottom: 20px;
}

.expiry-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.expiry-date {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.subscription-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.subscription-status.active {
  background: #d1fae5;
  color: #065f46;
}

.subscription-status.expiring {
  background: #fed7aa;
  color: #92400e;
}

/* ==================== USAGE STATS ==================== */

.usage-item {
  margin-bottom: 20px;
}

.usage-item:last-child {
  margin-bottom: 0;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.usage-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.usage-value {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
}

.usage-progress {
  height: 8px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.usage-progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.usage-progress-bar.messages {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.usage-progress-bar.images {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

/* ==================== LOADING ==================== */

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-mini {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin-top: 20px;
}

/* ==================== RESPONSIVE ==================== */

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .pricing-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .settings-main {
    padding: 20px;
  }

  .settings-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-button,
  .save-button {
    width: 100%;
  }

  .header-title {
    font-size: 24px;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>