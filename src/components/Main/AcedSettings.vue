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
            <span>Back</span>
          </button>
          <div class="header-text">
            <h1 class="header-title">Account Settings</h1>
            <p class="header-subtitle">Manage your profile and subscription</p>
          </div>
        </div>
        <button class="save-button" @click="saveChanges" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Save</span>
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
              <p class="stat-label">Current Plan</p>
              <h3 class="stat-value">{{ currentPlanLabel }}</h3>
              <span class="stat-badge active">Active</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Messages</p>
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
              <p class="stat-label">Images</p>
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
              <p class="stat-label">Days Remaining</p>
              <h3 class="stat-value">{{ subscriptionExpiryInfo?.daysRemaining || 0 }}</h3>
              <span :class="['stat-badge', subscriptionExpiryInfo?.isExpiring ? 'warning' : 'active']">
                {{ subscriptionExpiryInfo?.isExpiring ? 'Expiring Soon' : 'Active' }}
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
                    <h2 class="card-title">Personal Information</h2>
                    <p class="card-description">Update your personal details</p>
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
                    <label class="form-label">First Name</label>
                    <input 
                      v-if="isEditingName"
                      type="text" 
                      v-model="tempUser.name" 
                      class="form-input"
                      placeholder="Enter first name"
                    />
                    <div v-else class="form-display">
                      {{ user.name || 'Not specified' }}
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input 
                      v-if="isEditingName"
                      type="text" 
                      v-model="tempUser.surname" 
                      class="form-input"
                      placeholder="Enter last name"
                    />
                    <div v-else class="form-display">
                      {{ user.surname || 'Not specified' }}
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Email Address
                    <span class="verified-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Verified
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
                  <button @click="cancelEditingName" class="btn btn-secondary">Cancel</button>
                  <button @click="saveNameChanges" class="btn btn-primary">Save Changes</button>
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
                    <h2 class="card-title">Security</h2>
                    <p class="card-description">Manage password and security</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input 
                    type="password" 
                    v-model="oldPassword" 
                    class="form-input"
                    placeholder="••••••••"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">New Password</label>
                  <input 
                    type="password" 
                    v-model="newPassword" 
                    class="form-input"
                    placeholder="••••••••"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Confirm New Password</label>
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
                    Forgot Password?
                  </button>
                  <button @click="saveChanges" class="btn btn-primary" :disabled="loading">
                    {{ loading ? 'Updating...' : 'Update Password' }}
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
                    <h2 class="card-title">Subscription Tiers</h2>
                    <p class="card-description">Choose your subscription duration</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="pricing-cards">
                  
                  <!-- 1 MONTH -->
                  <div 
                    :class="['pricing-card', { selected: selectedDuration === 1 }]"
                    @click="selectedDuration = 1"
                  >
                    <div v-if="subscriptionDuration === 1 && currentPlan === 'pro'" class="current-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Current
                    </div>
                    
                    <div class="pricing-header">
                      <h3>1 Month</h3>
                      <div class="pricing-price">
                        <span class="price-currency">UZS</span>
                        <span class="price-amount">250K</span>
                      </div>
                      <p class="pricing-tagline">Monthly subscription</p>
                    </div>

                    <ul class="feature-list">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited messages
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited images
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        All pro features
                      </li>
                    </ul>

                    <button 
                      class="pricing-button"
                      :disabled="subscriptionDuration === 1 && currentPlan === 'pro'"
                    >
                      {{ (subscriptionDuration === 1 && currentPlan === 'pro') ? 'Current Tier' : 'Select' }}
                    </button>
                  </div>

                  <!-- 3 MONTHS - MOST POPULAR -->
                  <div 
                    :class="['pricing-card', 'featured', { selected: selectedDuration === 3 }]"
                    @click="selectedDuration = 3"
                  >
                    <div class="popular-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {{ (subscriptionDuration === 3 && currentPlan === 'pro') ? 'Current' : 'Most Popular' }}
                    </div>
                    
                    <div class="pricing-header">
                      <h3>3 Months</h3>
                      <div class="pricing-price">
                        <span class="price-currency">UZS</span>
                        <span class="price-amount">675K</span>
                      </div>
                      <p class="pricing-tagline">225K/month • Save 10%</p>
                    </div>

                    <ul class="feature-list">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited messages
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited images
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        All pro features
                      </li>
                    </ul>

                    <button 
                      class="pricing-button"
                      :disabled="subscriptionDuration === 3 && currentPlan === 'pro'"
                    >
                      {{ (subscriptionDuration === 3 && currentPlan === 'pro') ? 'Current Tier' : 'Select' }}
                    </button>
                  </div>

                  <!-- 6 MONTHS -->
                  <div 
                    :class="['pricing-card', { selected: selectedDuration === 6 }]"
                    @click="selectedDuration = 6"
                  >
                    <div v-if="subscriptionDuration === 6 && currentPlan === 'pro'" class="current-badge">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Current
                    </div>
                    
                    <div class="pricing-header">
                      <h3>6 Months</h3>
                      <div class="pricing-price">
                        <span class="price-currency">UZS</span>
                        <span class="price-amount">1.2M</span>
                      </div>
                      <p class="pricing-tagline">200K/month • Save 20%</p>
                    </div>

                    <ul class="feature-list">
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited messages
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Unlimited images
                      </li>
                      <li>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        All pro features
                      </li>
                    </ul>

                    <button 
                      class="pricing-button"
                      :disabled="subscriptionDuration === 6 && currentPlan === 'pro'"
                    >
                      {{ (subscriptionDuration === 6 && currentPlan === 'pro') ? 'Current Tier' : 'Select' }}
                    </button>
                  </div>
                </div>

                <button 
                  class="btn btn-large btn-primary"
                  @click="goToPayment"
                  :disabled="!selectedDuration || loading"
                  style="margin-top: 24px;"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {{ selectedDuration ? `Subscribe for ${selectedDuration} Month${selectedDuration > 1 ? 's' : ''}` : 'Select a duration' }}
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
                    <h2 class="card-title">Promo Code</h2>
                    <p class="card-description">Activate special offer</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <!-- Show message if user has active subscription -->
                <div v-if="hasActiveSubscription && subscriptionExpiryInfo && !subscriptionExpiryInfo.isExpired" class="active-subscription-notice">
                  <div class="notice-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div class="notice-content">
                    <h4>You have an active subscription</h4>
                    <p>You can apply a new promo code after your current <strong>{{ currentPlanLabel }} Plan</strong> expires.</p>
                    <p class="notice-expiry">Available in <strong>{{ subscriptionExpiryInfo.daysRemaining }} days</strong> ({{ subscriptionExpiryInfo.formattedDate }})</p>
                  </div>
                </div>

                <!-- Show promo form if no active subscription -->
                <template v-else>
                  <div class="form-group">
                    <label class="form-label">Enter promo code</label>
                    <input 
                      type="text" 
                      v-model="promoCode" 
                      class="form-input promo-input"
                      placeholder="PROMO2024"
                      :disabled="loading || isProcessingPromo"
                      @input="handlePromoCodeInput"
                    />
                    <div v-if="isValidatingPromo" class="form-hint">
                      <div class="spinner-mini"></div>
                      Checking promo code...
                    </div>
                    <div v-else-if="promoValidation && promoCode.length > 3">
                      <div v-if="promoValidation.valid" class="form-success">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Valid! {{ promoValidation.data?.grantsPlan?.toUpperCase() }} Plan
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
                    <label class="form-label">Subscription Duration</label>
                    <div class="duration-selector">
                      <button 
                        v-for="duration in [1, 3, 6]" 
                        :key="duration"
                        :class="['duration-btn', { selected: selectedDuration === duration }]"
                        @click="selectedDuration = duration"
                      >
                        {{ duration }} Mo
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Plan Type</label>
                    <div class="pro-plan-display" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; font-weight: 600;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Pro Plan
                    </div>
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
                </template>
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
                    <h2 class="card-title">Subscription</h2>
                    <p class="card-description">Your subscription information</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="subscription-info">
                  <div class="subscription-plan">
                    <span class="plan-badge">{{ currentPlanLabel }} Plan</span>
                  </div>
                  
                  <!-- Days Remaining Display -->
                  <div class="subscription-days-remaining">
                    <p class="days-label">Time Remaining</p>
                    <h3 class="days-value">{{ subscriptionExpiryInfo.daysRemaining }} <span class="days-unit">days</span></h3>
                    <p class="time-remaining-detail">{{ subscriptionExpiryInfo.timeRemaining }}</p>
                  </div>
                  
                  <div class="subscription-expiry">
                    <p class="expiry-label">Valid until</p>
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
                    {{ subscriptionExpiryInfo.isExpiring ? 'Expiring Soon' : 'Active' }}
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
                    <h2 class="card-title">Usage</h2>
                    <p class="card-description">Your monthly statistics</p>
                  </div>
                </div>
              </div>

              <div class="card-body">
                <div class="usage-item">
                  <div class="usage-header">
                    <span class="usage-label">Messages</span>
                    <span class="usage-value">{{ currentUsageMessages }} / {{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}</span>
                  </div>
                  <div class="usage-progress">
                    <div class="usage-progress-bar messages" :style="{ width: messageUsagePercentage + '%' }"></div>
                  </div>
                </div>

                <div class="usage-item">
                  <div class="usage-header">
                    <span class="usage-label">Images</span>
                    <span class="usage-value">{{ currentUsageImages }} / {{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}</span>
                  </div>
                  <div class="usage-progress">
                    <div class="usage-progress-bar images" :style="{ width: imageUsagePercentage + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- INBOX / NOTIFICATIONS -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Inbox</h2>
                    <p class="card-description">Your payment notifications</p>
                  </div>
                </div>
                <span v-if="unreadMessagesCount > 0" class="bg-linear-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">{{ unreadMessagesCount }}</span>
              </div>

              <div class="card-body">
                <div v-if="loadingInbox" class="flex items-center justify-center gap-2.5 py-6 text-gray-500 text-sm">
                  <div class="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span>Loading messages...</span>
                </div>

                <div v-else-if="inboxMessages.length === 0" class="text-center py-8 px-4 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                  </svg>
                  <p class="text-sm font-semibold text-gray-500 mb-1">No messages yet</p>
                  <span class="text-xs">Payment confirmations will appear here</span>
                </div>

                <div v-else class="flex flex-col gap-2">
                  <div
                    v-for="message in inboxMessages.slice(0, 5)"
                    :key="message.id"
                    :class="[
                      'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border',
                      message.read
                        ? 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                        : 'bg-indigo-50 border-indigo-200'
                    ]"
                    @click="openMessage(message)"
                  >
                    <div :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      message.type === 'payment' ? 'bg-green-100 text-green-600' :
                      message.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    ]">
                      <svg v-if="message.type === 'payment'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <svg v-else-if="message.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-semibold text-gray-900 mb-0.5 truncate">{{ message.title }}</h4>
                      <p class="text-xs text-gray-500 mb-1 truncate">{{ message.content.substring(0, 60) }}...</p>
                      <span class="text-[11px] text-gray-400">{{ formatMessageDate(message.createdAt) }}</span>
                    </div>
                    <button
                      class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                      @click.stop="deleteInboxMessage(message.id)"
                      title="Delete message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>

                  <button
                    v-if="inboxMessages.length > 5"
                    class="mt-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium"
                    @click="showAllMessages = true"
                  >
                    View all {{ inboxMessages.length }} messages
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- MESSAGE DETAIL MODAL -->
        <transition name="modal">
          <div v-if="selectedMessage" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeMessage">
            <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div class="flex items-center gap-4 p-5 border-b border-gray-100">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  selectedMessage.type === 'payment' ? 'bg-green-100 text-green-600' :
                  selectedMessage.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                ]">
                  <svg v-if="selectedMessage.type === 'payment'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else-if="selectedMessage.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <h3 class="flex-1 text-lg font-bold text-gray-900">{{ selectedMessage.title }}</h3>
                <button @click="closeMessage" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div class="p-5">
                <p class="text-sm text-gray-400 mb-4">{{ formatMessageDate(selectedMessage.createdAt) }}</p>
                <div class="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl mb-4">{{ selectedMessage.content }}</div>

                <!-- Payment Details if available -->
                <div v-if="selectedMessage.data && selectedMessage.type === 'payment'" class="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 class="text-sm font-semibold text-green-800 mb-3">Payment Details</h4>
                  <div v-if="selectedMessage.data.transactionId" class="flex justify-between items-center py-1.5 text-sm border-b border-dashed border-green-200">
                    <span class="text-gray-500">Transaction ID:</span>
                    <code class="font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded text-gray-800">{{ selectedMessage.data.transactionId }}</code>
                  </div>
                  <div v-if="selectedMessage.data.paymentMethod" class="flex justify-between items-center py-1.5 text-sm border-b border-dashed border-green-200">
                    <span class="text-gray-500">Payment Method:</span>
                    <span class="font-medium text-gray-800">{{ selectedMessage.data.paymentMethod }}</span>
                  </div>
                  <div v-if="selectedMessage.data.startDate" class="flex justify-between items-center py-1.5 text-sm border-b border-dashed border-green-200">
                    <span class="text-gray-500">Start Date:</span>
                    <span class="font-medium text-gray-800">{{ formatMessageDate(selectedMessage.data.startDate) }}</span>
                  </div>
                  <div v-if="selectedMessage.data.endDate" class="flex justify-between items-center py-1.5 text-sm">
                    <span class="text-gray-500">End Date:</span>
                    <span class="font-medium text-gray-800">{{ formatMessageDate(selectedMessage.data.endDate) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 p-5 pt-0">
                <button class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all" @click="deleteInboxMessage(selectedMessage.id); closeMessage();">
                  Delete
                </button>
                <button class="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-all" @click="closeMessage">
                  Close
                </button>
              </div>
            </div>
          </div>
        </transition>

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
import {
  getUserMessages,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount
} from '@/api/inbox';

// CRITICAL: Import directly from promocodes API for reliable promo code handling
import { applyPromocode, validatePromocode } from '@/api/promocodes';

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
      selectedPlan: "pro",
      paymentPlan: "",
      selectedDuration: 3, // Selected subscription duration (1, 3, or 6 months)
      
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
      storeUnsubscribe: null,

      // Inbox related
      inboxMessages: [],
      loadingInbox: false,
      selectedMessage: null,
      unreadMessagesCount: 0,
      showAllMessages: false
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
    
    subscriptionExpiryInfo() {
      try {
        // ✅ Try to get expiry from multiple sources
        const details = this.subscriptionDetails || {};
        let expiryDateStr = details.expiryDate;
        
        // Fallback to localStorage if Vuex doesn't have it
        if (!expiryDateStr) {
          expiryDateStr = localStorage.getItem('subscriptionExpiry');
        }
        
        // Try subscriptionData in localStorage
        if (!expiryDateStr) {
          try {
            const subData = JSON.parse(localStorage.getItem('subscriptionData') || '{}');
            expiryDateStr = subData.expiryDate;
          } catch (e) {}
        }
        
        // If still no expiry or free plan, return null
        if (!expiryDateStr || this.currentPlan === 'free') {
          return null;
        }
        
        const expiryDate = new Date(expiryDateStr);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          expiryDate: expiryDate,
          daysRemaining: Math.max(0, diffDays),
          isExpiring: diffDays <= 7 && diffDays > 0,
          isExpired: diffDays <= 0,
          formattedDate: this.formatDate(expiryDateStr),
          timeRemaining: this.getTimeRemaining(diffTime),
          duration: details.duration || null
        };
      } catch (e) {
        console.error('subscriptionExpiryInfo error:', e);
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
return 0;
      }
    },
    
    currentUsageImages() {
      try {
        return this.currentUsage?.images || 0;
      } catch (e) {
return 0;
      }
    },
    
    usageLimitsMessages() {
      try {
        return this.usageLimits?.messages || 50;
      } catch (e) {
return 50;
      }
    },
    
    usageLimitsImages() {
      try {
        return this.usageLimits?.images || 5;
      } catch (e) {
return 5;
      }
    },
    
    messageUsagePercentage() {
      try {
        const messages = this.currentUsageMessages;
        const limit = this.usageLimitsMessages;
        return (limit === -1) ? 0 : Math.min(100, Math.round((messages / limit) * 100));
      } catch (e) {
return 0;
      }
    },
    
    imageUsagePercentage() {
      try {
        const images = this.currentUsageImages;
        const limit = this.usageLimitsImages;
        return (limit === -1) ? 0 : Math.min(100, Math.round((images / limit) * 100));
      } catch (e) {
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
    
    subscriptionDuration() {
      try {
        // Get duration from Vuex store or user details
        const duration = this.getUser?.subscriptionDuration || this.subscriptionDetails?.duration;
        return duration || null;
      } catch (e) {
        return null;
      }
    },
    
    canApplyPromo() {
      try {
        // If promo grants a plan directly, don't require selectedPlan
        const promoGrantsPlan = this.promoValidation?.data?.grantsPlan;
        const hasPlan = this.selectedPlan || promoGrantsPlan;

        return this.promoCode &&
               this.promoCode.trim().length > 3 &&
               hasPlan &&
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
        if (this.isProcessingPromo) return 'Applying...';
        if (this.isValidatingPromo) return 'Checking...';
        if (!this.promoCode.trim()) return 'Enter promo code';
        if (!this.selectedPlan) return 'Select plan';
        if (this.promoValidation && !this.promoValidation.valid) return 'Invalid promo code';
        if (this.planCompatibilityError) return 'Check plan';
        if (this.canApplyPromo) return 'Apply promo code';
        return 'Apply promo code';
      } catch (e) {
        return 'Apply promo code';
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
}
      },
      immediate: true
    }
  },
  
  async mounted() {
    await this.initializeComponent();
    this.componentMounted = true;
    // Load inbox messages
    this.loadInboxMessages();

    // Check if returning from successful promo code application
    if (this.$route.query.promoApplied === 'true') {
      const plan = this.$route.query.plan || 'pro';
      this.showNotification(`Подписка ${plan.toUpperCase()} активирована!`, 'success');
      // Clear the query params
      this.$router.replace({ path: this.$route.path, query: {} });
      // Refresh user data
      await this.loadInitialData();
    }
  },

  methods: {
    // =============================================
    // INBOX METHODS
    // =============================================

    async loadInboxMessages() {
      if (!this.currentUser?.uid) return;

      this.loadingInbox = true;
      try {
        const result = await getUserMessages(this.currentUser.uid);
        if (result.success) {
          this.inboxMessages = result.messages;
          this.unreadMessagesCount = result.messages.filter(m => !m.read).length;
        }
      } catch (error) {
        console.error('Failed to load inbox messages:', error);
      } finally {
        this.loadingInbox = false;
      }
    },

    async openMessage(message) {
      this.selectedMessage = message;

      // Mark as read if not already
      if (!message.read && this.currentUser?.uid) {
        try {
          await markMessageAsRead(this.currentUser.uid, message.id);
          // Update local state
          const msgIndex = this.inboxMessages.findIndex(m => m.id === message.id);
          if (msgIndex !== -1) {
            this.inboxMessages[msgIndex].read = true;
            this.unreadMessagesCount = Math.max(0, this.unreadMessagesCount - 1);
          }
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      }
    },

    closeMessage() {
      this.selectedMessage = null;
    },

    async deleteInboxMessage(messageId) {
      if (!this.currentUser?.uid) return;

      try {
        await deleteMessage(this.currentUser.uid, messageId);
        // Remove from local state
        const msgIndex = this.inboxMessages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          if (!this.inboxMessages[msgIndex].read) {
            this.unreadMessagesCount = Math.max(0, this.unreadMessagesCount - 1);
          }
          this.inboxMessages.splice(msgIndex, 1);
        }
      } catch (error) {
        console.error('Failed to delete message:', error);
        this.showNotification('Failed to delete message', 'error');
      }
    },

    // ✅ Add message to local inbox display (fallback when API unavailable)
    addLocalInboxMessage(messageData) {
      const newMessage = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: messageData.type || 'payment',
        title: messageData.title,
        content: messageData.content,
        data: messageData.data || {},
        read: false,
        createdAt: new Date().toISOString()
      };
      
      // Add to beginning of array
      this.inboxMessages.unshift(newMessage);
      this.unreadMessagesCount++;
      
      // Also save to local storage for persistence
      try {
        const storageKey = `aced_user_inbox_${this.currentUser?.uid}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.unshift(newMessage);
        localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 50)));
      } catch (e) {
        console.error('Failed to save message to local storage:', e);
      }
    },

    formatMessageDate(dateStr) {
      if (!dateStr) return '';

      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    },

    // =============================================
    // USER STATUS METHODS
    // =============================================

    handleUserStatusChange(newStatus, oldStatus) {
      if (!newStatus || newStatus === oldStatus) return;

      try {
        localStorage.setItem('userStatus', newStatus);
        localStorage.setItem('plan', newStatus);
        localStorage.setItem('statusChangeTime', Date.now().toString());

        this.forceReactivityUpdate();

        if (newStatus && newStatus !== 'free' && (oldStatus === 'free' || !oldStatus)) {
          const planLabel = newStatus === 'pro' ? 'Pro' : 'Start';
          this.showNotification(`${planLabel} subscription activated!`, 'success', 5000);
        }

      } catch (error) {
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
        // ignore
      }
    },

    getTimeRemaining(diffTime) {
      if (diffTime <= 0) return 'Expired';
      
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} days ${hours} hrs`;
      } else if (hours > 0) {
        return `${hours} hrs`;
      } else {
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} min`;
      }
    },

    cleanup() {
      if (this.promoValidationTimeout) {
        clearTimeout(this.promoValidationTimeout);
      }
    },

    async initializeComponent() {
      this.loading = true;
      this.loadingText = 'Loading settings...';
      
      try {
        await this.checkAuthState();
        await this.loadInitialData();
        this.forceReactivityUpdate();
      } catch (error) {
        this.showNotification('Error loading settings', 'error');
      } finally {
        this.loading = false;
      }
    },

    async loadInitialData() {
      try {
        if (this.$store && this.$store.dispatch) {
          await this.$store.dispatch('user/loadUserStatus');
          // Force reactivity update after data loads
          this.$nextTick(() => {
            this.forceReactivityUpdate();
          });
        }
      } catch (error) {
        // ignore
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
            name: "New User",
            surname: "",
            email: this.currentUser.email,
          };
          await setDoc(userRef, newUserData);
          this.user = newUserData;
          this.tempUser = { name: newUserData.name, surname: newUserData.surname };
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },

    startEditingName() {
      this.isEditingName = true;
      this.tempUser = { name: this.user.name, surname: this.user.surname };
    },

    async saveNameChanges() {
      this.loading = true;
      this.loadingText = 'Saving changes...';
      
      try {
        if (!this.currentUser) {
          this.showNotification('User not found', 'error');
          return;
        }

        // 1. Update Firestore
        const userRef = doc(db, "users", this.currentUser.uid);
        await updateDoc(userRef, {
          name: this.tempUser.name,
          surname: this.tempUser.surname,
          updatedAt: new Date().toISOString()
        });

        // 2. Update Firebase Auth Profile
        try {
          const { updateProfile } = await import("firebase/auth");
          await updateProfile(this.currentUser, {
            displayName: `${this.tempUser.name} ${this.tempUser.surname}`.trim()
          });
        } catch (authError) {
          console.error('Error updating auth profile:', authError);
        }

        // 3. Sync with Backend (MongoDB)
        try {
          const token = await this.currentUser.getIdToken(true);
          const userData = {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            displayName: `${this.tempUser.name} ${this.tempUser.surname}`.trim(),
            name: this.tempUser.name,
            surname: this.tempUser.surname,
            photoURL: this.currentUser.photoURL
          };
          
          await this.$store.dispatch('user/saveUser', { userData, token });
        } catch (syncError) {
          console.error('Error syncing with backend:', syncError);
        }

        this.user.name = this.tempUser.name;
        this.user.surname = this.tempUser.surname;
        this.isEditingName = false;

        this.showNotification('Name updated successfully!', 'success');
      } catch (error) {
        this.showNotification('Error saving name', 'error');
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
        console.log('🔍 [AcedSettings] Validating promocode:', promocodeUpper);

        // CRITICAL: Use the direct API function instead of store
        const result = await validatePromocode(promocodeUpper);
        console.log('🔍 [AcedSettings] Validation result:', result);

        if (result && result.valid) {
          this.promoValidation = {
            valid: true,
            data: result.data,
            message: result.message || 'Valid promocode'
          };

          if (result.data?.grantsPlan && !this.selectedPlan) {
            this.selectedPlan = result.data.grantsPlan;
          }
        } else {
          this.promoValidation = {
            valid: false,
            message: result?.message || result?.error || 'Invalid promocode'
          };
        }

        this.isValidatingPromo = false;
      } catch (error) {
        console.error('❌ [AcedSettings] Validation error:', error);
        this.promoValidation = {
          valid: false,
          message: 'Error checking promo code. Please try again.'
        };
        this.isValidatingPromo = false;
      }
    },

    async applyPromo() {
      if (!this.canApplyPromo) {
        console.log('❌ [AcedSettings] Cannot apply promo - conditions not met');
        return;
      }

      this.isProcessingPromo = true;
      this.loading = true;
      this.loadingText = 'Applying promocode...';

      try {
        const promoData = this.promoValidation?.data;
        const normalizedCode = this.promoCode.trim().toUpperCase();

        console.log('🎟️ [AcedSettings] Applying promocode:', normalizedCode);

        // CRITICAL: Use the direct API function instead of store
        const result = await applyPromocode(normalizedCode);

        console.log('🎟️ [AcedSettings] Apply result:', result);

        if (result.success) {
          // Extract data from response
          const newPlan = result.plan || result.user?.subscriptionPlan || promoData?.grantsPlan || 'pro';
          const subscriptionDays = result.promocode?.subscriptionDays || promoData?.subscriptionDays || 30;
          const now = new Date();
          const expiryDate = result.expiryDate || result.user?.subscriptionExpiryDate || 
            new Date(now.getTime() + subscriptionDays * 24 * 60 * 60 * 1000).toISOString();
          const durationMonths = subscriptionDays <= 31 ? 1 : subscriptionDays <= 95 ? 3 : 6;

          // ✅ CRITICAL: Save comprehensive subscription data
          const subscriptionData = {
            plan: newPlan,
            status: 'active',
            source: 'promocode',
            startDate: now.toISOString(),
            expiryDate: expiryDate,
            promoCode: normalizedCode,
            duration: durationMonths,
            activatedAt: now.toISOString()
          };

          // Update local storage immediately
          localStorage.setItem('userStatus', newPlan);
          localStorage.setItem('plan', newPlan);
          localStorage.setItem('subscriptionPlan', newPlan);
          localStorage.setItem('subscriptionExpiry', expiryDate);
          localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));

          // ✅ CRITICAL: Update Vuex store with subscription details
          if (this.$store && this.$store.commit) {
            this.$store.commit('user/SET_USER_STATUS', newPlan);
            this.$store.commit('user/UPDATE_SUBSCRIPTION', subscriptionData);
          }

          // Also dispatch loadUserStatus to sync everything
          if (this.$store && this.$store.dispatch) {
            await this.$store.dispatch('user/loadUserStatus');
          }

          // Force reactivity update
          this.forceReactivityUpdate();

          // Dispatch global events for other components
          window.dispatchEvent(new CustomEvent('userStatusChanged', {
            detail: { source: 'promocode', plan: newPlan, expiryDate, timestamp: Date.now() }
          }));
          window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
            detail: subscriptionData
          }));

          // ✅ Send inbox message with promocode confirmation
          const endDate = new Date(expiryDate);

          try {
            const { sendPaymentConfirmationMessage } = await import('@/api/inbox');

            const msgResult = await sendPaymentConfirmationMessage({
              userId: this.currentUser?.uid,
              amount: 0, // Free via promocode
              plan: newPlan,
              duration: durationMonths,
              transactionId: 'PROMO-' + Date.now(),
              paymentMethod: 'Promo Code',
              startDate: now.toISOString(),
              endDate: endDate.toISOString(),
              promoCode: normalizedCode,
              userEmail: this.user?.email,
              userName: this.user?.name
            });
            
            console.log('✅ Inbox message sent for promo code:', msgResult.source);
            
            // If message was saved to local storage, add it directly to display
            if (msgResult.source === 'local' || !msgResult.source) {
              console.log('ℹ️ Message saved to local storage fallback');
            }
          } catch (msgError) {
            console.error('Failed to send inbox message:', msgError);
            // Still add to local inbox as fallback
            this.addLocalInboxMessage({
              type: 'payment',
              title: '🎉 Promo Code Applied - Subscription Activated!',
              content: `Your promo code "${normalizedCode}" has been applied!\n\n` +
                `Plan: ${newPlan.toUpperCase()}\n` +
                `Duration: ${durationMonths} month${durationMonths > 1 ? 's' : ''}\n` +
                `Payment Method: Promo Code\n` +
                `Subscription End Date: ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n` +
                `Enjoy your premium features!`,
              data: { promoCode: normalizedCode, plan: newPlan, endDate: expiryDate }
            });
          }

          this.showNotification(result.message || 'Promocode applied successfully!', 'success', 6000);

          // Clear the promo code input
          this.promoCode = '';
          this.promoValidation = null;

          // Reload inbox
          await this.loadInboxMessages();
        } else {
          this.showNotification(result.message || 'Failed to apply promocode.', 'error');
        }
      } catch (error) {
        console.error('❌ [AcedSettings] Error applying promo:', error);
        this.showNotification('An error occurred. Please check your connection.', 'error');
      } finally {
        this.isProcessingPromo = false;
        this.loading = false;
      }
    },

    async selectDurationAndGo(duration) {
      this.selectedDuration = duration;
      // Small delay to show selection visual
      setTimeout(async () => {
        await this.goToPayment();
      }, 200);
    },

    async goToPayment() {
      try {
        if (!this.selectedDuration) {
          this.showNotification('Please select a subscription duration', 'warning');
          return;
        }

        const query = { 
          duration: this.selectedDuration,
          from: 'settings'
        };
        
        // Add promo code if valid
        if (this.promoValidation?.valid && this.promoCode) {
          query.promoCode = this.promoCode;
        }

        // Navigate to payment page with duration parameter
        await this.$router.push({
          path: '/pay/pro',
          query
        });
      } catch (error) {
        if (error.name !== 'NavigationDuplicated') {
          console.error('Error navigating to payment:', error);
          this.showNotification('Failed to navigate to payment page', 'error');
        }
      }
    },

    getPaymentButtonText() {
      if (!this.paymentPlan) return 'Select a plan';
      if (this.currentPlan === this.paymentPlan) return 'Already active';
      
      const planNames = {
        start: 'START',
        pro: 'PRO'
      };
      
      return `Pay for ${planNames[this.paymentPlan] || this.paymentPlan.toUpperCase()}`;
    },

    async sendPasswordReset() {
      if (!this.user.email) {
        this.showNotification('Please enter email address', 'error');
        return;
      }

      try {
        await sendPasswordResetEmail(auth, this.user.email);
        this.showNotification('Password reset email sent!', 'success');
      } catch (error) {
        let errorMessage = 'Error sending email';
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'User with this email not found';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email format';
        }
        
        this.showNotification(errorMessage, 'error');
      }
    },

    async saveChanges() {
      this.showNotification('Password update function', 'info');
    },

    goToProfile() {
      this.$router.push('/profile');
    },

    formatDate(date) {
      if (!date) return '';
      try {
        return new Date(date).toLocaleDateString('en-US');
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
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
      };
      
      this.notificationIcon = icons[type] || 'ℹ';
      this.notificationTitle = titles[type] || 'Notification';
      
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
}


/* ==================== PRICING CARDS GRID ==================== */

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .pricing-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
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

/* ✅ Days Remaining Display */
.subscription-days-remaining {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
  text-align: center;
}

.days-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.9;
  margin-bottom: 8px;
}

.days-value {
  font-size: 48px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.days-unit {
  font-size: 20px;
  font-weight: 500;
  opacity: 0.9;
}

.time-remaining-detail {
  font-size: 14px;
  opacity: 0.85;
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

/* ==================== DURATION SELECTOR ==================== */

.duration-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.duration-btn {
  flex: 1;
  padding: 12px 8px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  text-align: center;
  position: relative;
  z-index: 1;
}

.duration-btn:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-2px);
}

.duration-btn.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.duration-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

/* ==================== ACTIVE SUBSCRIPTION NOTICE ==================== */

.active-subscription-notice {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  border: 1px solid #f59e0b;
}

.notice-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.notice-content {
  flex: 1;
}

.notice-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
}

.notice-content p {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #78350f;
  line-height: 1.5;
}

.notice-content p strong {
  font-weight: 600;
}

.notice-expiry {
  margin-top: 12px !important;
  padding-top: 12px;
  border-top: 1px solid rgba(245, 158, 11, 0.3);
  font-weight: 500 !important;
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