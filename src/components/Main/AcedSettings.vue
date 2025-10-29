
<template>
  <div class="settings-page">
    
    <!-- SIDEBAR NAVIGATION -->
    <aside class="settings-sidebar" :class="{ 'mobile-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <div class="brand-icon">A</div>
          <div class="brand-text">
            <h1>ACED</h1>
            <p>Settings Panel</p>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Account</div>
          <a href="#profile" class="nav-item active">
            <span class="nav-item-icon">👤</span>
            <span>Profile</span>
          </a>
          <a href="#security" class="nav-item">
            <span class="nav-item-icon">🔐</span>
            <span>Security</span>
          </a>
          <a href="#notifications" class="nav-item">
            <span class="nav-item-icon">🔔</span>
            <span>Notifications</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Billing</div>
          <a href="#subscription" class="nav-item">
            <span class="nav-item-icon">💳</span>
            <span>Subscription</span>
          </a>
          <a href="#payment" class="nav-item">
            <span class="nav-item-icon">💰</span>
            <span>Payment History</span>
          </a>
          <a href="#promo" class="nav-item">
            <span class="nav-item-icon">🎟️</span>
            <span>Promo Codes</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Usage</div>
          <a href="#stats" class="nav-item">
            <span class="nav-item-icon">📊</span>
            <span>Statistics</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-ghost btn-block btn-sm" @click="goToProfile">
          ← Back to Profile
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="settings-main">
      
      <!-- HEADER -->
      <header class="settings-header">
        <div class="header-left">
          <h1 class="header-title">Account Settings</h1>
          <div class="header-breadcrumb">
            <span>Dashboard</span>
            <span class="breadcrumb-separator">/</span>
            <span>Settings</span>
            <span class="breadcrumb-separator">/</span>
            <span>Profile</span>
          </div>
        </div>
        <div class="header-right">
          <button class="header-action">
            <span>💾</span>
            <span>Save Changes</span>
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
                <div class="stat-label">Current Plan</div>
                <div class="stat-value">{{ currentPlanLabel }}</div>
              </div>
              <div class="stat-icon">💎</div>
            </div>
            <div class="stat-change positive">
              <span>↗</span>
              <span>Active</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div>
                <div class="stat-label">Messages</div>
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
                <div class="stat-label">Images</div>
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
                <div class="stat-label">Days Left</div>
                <div class="stat-value">{{ subscriptionExpiryInfo?.daysRemaining || 0 }}</div>
              </div>
              <div class="stat-icon">📅</div>
            </div>
            <div class="stat-change" :class="subscriptionExpiryInfo?.isExpiring ? 'negative' : 'positive'">
              <span>{{ subscriptionExpiryInfo?.isExpiring ? '⚠' : '✓' }}</span>
              <span>{{ subscriptionExpiryInfo?.isExpiring ? 'Expiring Soon' : 'Active' }}</span>
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
                  <h2 class="card-title">Personal Information</h2>
                  <p class="card-subtitle">Update your personal details and email address</p>
                </div>
                <div class="card-actions">
                  <button v-if="!isEditingName" @click="startEditingName" class="btn btn-sm btn-secondary">
                    ✏️ Edit
                  </button>
                  <button v-else @click="saveNameChanges" class="btn btn-sm btn-success">
                    ✓ Save
                  </button>
                  <button v-if="isEditingName" @click="cancelEditingName" class="btn btn-sm btn-secondary">
                    ✕ Cancel
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <div class="content-grid">
                  <div class="grid-col-6">
                    <div class="form-group">
                      <label class="form-label">First Name</label>
                      <input 
                        v-if="isEditingName"
                        type="text" 
                        v-model="tempUser.name" 
                        class="form-input"
                        placeholder="Enter your first name"
                      />
                      <div v-else class="form-input" style="background: var(--light); cursor: default;">
                        {{ user.name || 'Not set' }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="grid-col-6">
                    <div class="form-group">
                      <label class="form-label">Last Name</label>
                      <input 
                        v-if="isEditingName"
                        type="text" 
                        v-model="tempUser.surname" 
                        class="form-input"
                        placeholder="Enter your last name"
                      />
                      <div v-else class="form-input" style="background: var(--light); cursor: default;">
                        {{ user.surname || 'Not set' }}
                      </div>
                    </div>
                  </div>

                  <div class="grid-col-12">
                    <div class="form-group">
                      <label class="form-label">
                        Email Address
                        <span class="label-badge">Verified</span>
                      </label>
                      <input 
                        type="email" 
                        v-model="user.email" 
                        class="form-input"
                        :disabled="loading"
                      />
                      <div class="form-hint">
                        💡 We'll send updates and notifications to this email
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
                  <h2 class="card-title">Security Settings</h2>
                  <p class="card-subtitle">Change your password and manage security</p>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input 
                    type="password" 
                    v-model="oldPassword" 
                    class="form-input"
                    placeholder="Enter current password"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">New Password</label>
                  <input 
                    type="password" 
                    v-model="newPassword" 
                    class="form-input"
                    placeholder="Enter new password"
                    :disabled="loading"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    v-model="confirmPassword" 
                    class="form-input"
                    placeholder="Re-enter new password"
                    :disabled="loading"
                  />
                </div>
              </div>
              
              <div class="card-footer">
                <button @click="sendPasswordReset" class="btn btn-ghost">
                  🔑 Forgot Password?
                </button>
                <button @click="saveChanges" class="btn btn-primary" :disabled="loading">
                  {{ loading ? '⏳ Updating...' : '💾 Update Password' }}
                </button>
              </div>
            </div>

            <!-- SUBSCRIPTION PLANS -->
            <div class="modern-card mb-4">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">💎</div>
                  <h2 class="card-title">Subscription Plans</h2>
                  <p class="card-subtitle">Choose the perfect plan for your needs</p>
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
                    <div v-if="currentPlan === 'start'" class="pricing-badge">Current Plan</div>
                    
                    <div class="pricing-header">
                      <h3 class="pricing-name">Start</h3>
                      <div class="pricing-price">
                        <span class="price-amount">260</span>
                        <span class="price-currency">K</span>
                        <span class="price-period">/ month</span>
                      </div>
                      <p class="pricing-description">Perfect for getting started</p>
                    </div>

                    <ul class="pricing-features">
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Unlimited Messages</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Dictionary Access</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Basic Courses</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Homework Support</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Priority Support</span>
                      </li>
                      <li>
                        <span class="feature-icon disabled">✕</span>
                        <span style="color: var(--gray-light);">Unlimited Images</span>
                      </li>
                    </ul>

                    <button 
                      class="btn btn-outline btn-block"
                      :disabled="currentPlan === 'start' || currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'start' ? '✓ Current Plan' : 'Select Plan' }}
                    </button>
                  </div>

                  <!-- PRO PLAN -->
                  <div 
                    class="pricing-card featured" 
                    :class="{ 'featured': currentPlan === 'pro' || paymentPlan === 'pro' }"
                    @click="selectPaymentPlan('pro')"
                  >
                    <div class="pricing-badge">{{ currentPlan === 'pro' ? 'Current Plan' : 'Recommended' }}</div>
                    
                    <div class="pricing-header">
                      <h3 class="pricing-name">Pro</h3>
                      <div class="pricing-price">
                        <span class="price-amount">455</span>
                        <span class="price-currency">K</span>
                        <span class="price-period">/ month</span>
                      </div>
                      <p class="pricing-description">For power users and professionals</p>
                    </div>

                    <ul class="pricing-features">
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Everything in Start</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Unlimited Images</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Advanced Courses</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Personal Analytics</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Custom Courses</span>
                      </li>
                      <li>
                        <span class="feature-icon">✓</span>
                        <span>Exclusive Content</span>
                      </li>
                    </ul>

                    <button 
                      class="btn btn-primary btn-block"
                      :disabled="currentPlan === 'pro'"
                    >
                      {{ currentPlan === 'pro' ? '✓ Current Plan' : 'Upgrade to Pro' }}
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
                  <h2 class="card-title">Promo Code</h2>
                  <p class="card-subtitle">Have a promo code? Apply it here</p>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <label class="form-label">Promo Code</label>
                  <input 
                    type="text" 
                    v-model="promoCode" 
                    class="form-input"
                    placeholder="ENTER CODE"
                    :disabled="loading || isProcessingPromo"
                    @input="handlePromoCodeInput"
                    style="text-transform: uppercase; font-weight: 600; font-family: monospace;"
                  />
                  <div v-if="isValidatingPromo" class="form-hint">
                    <div class="spinner-small"></div>
                    Validating...
                  </div>
                  <div v-else-if="promoValidation && promoCode.length > 3">
                    <div v-if="promoValidation.valid" class="form-hint" style="color: var(--success);">
                      ✓ Valid! Grants {{ promoValidation.data?.grantsPlan?.toUpperCase() }} plan
                    </div>
                    <div v-else class="form-error">
                      ✕ {{ promoValidation.error }}
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Select Plan</label>
                  <select v-model="selectedPlan" class="form-select" :disabled="loading">
                    <option value="">Choose plan...</option>
                    <option value="start">Start Plan</option>
                    <option value="pro">Pro Plan</option>
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
                  <h2 class="card-title">Quick Stats</h2>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group">
                  <div class="progress-label">
                    <span class="progress-label-text">Messages Used</span>
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
                    <span class="progress-label-text">Images Generated</span>
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
                  <h2 class="card-title">Subscription</h2>
                </div>
              </div>
              
              <div class="card-body">
                <div class="form-group mb-0">
                  <div class="badge badge-primary" style="margin-bottom: var(--space-md);">
                    {{ currentPlanLabel }} Plan
                  </div>
                  
                  <div style="font-size: 0.875rem; color: var(--gray); margin-bottom: var(--space-sm);">
                    Expires on
                  </div>
                  <div style="font-size: 1.25rem; font-weight: 700; color: var(--dark); margin-bottom: var(--space-md);">
                    {{ subscriptionExpiryInfo.formattedDate }}
                  </div>
                  
                  <div :class="['badge', subscriptionExpiryInfo.isExpiring ? 'badge-warning' : 'badge-success']">
                    {{ subscriptionExpiryInfo.isExpiring ? '⚠ Expiring Soon' : '✓ Active' }}
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

<style scoped>
@import '@/assets/css/AcedSettings.css';

/* Add any component-specific styles here */
.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid var(--gray-lighter);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
}
</style>