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

      <!-- SERVER SYNC STATUS -->
      <div v-if="syncStatus" :class="['sync-status-banner', syncStatus.type]">
        <span class="sync-icon">{{ syncStatus.icon }}</span>
        <span class="sync-message">{{ syncStatus.message }}</span>
        <button v-if="syncStatus.type === 'error'" @click="refreshFromServer" class="sync-retry-btn">
          Retry
        </button>
      </div>

      <!-- CONTENT -->
      <div class="settings-content">
        
        <!-- STATS OVERVIEW -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon plan-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-label">Current Plan</p>
              <h3 class="stat-value">{{ currentPlanLabel }}</h3>
              <span :class="['stat-badge', currentPlan !== 'free' ? 'active' : 'inactive']">
                {{ currentPlan !== 'free' ? 'Active' : 'Free' }}
              </span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon messages-icon">
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
            <div class="stat-icon images-icon">
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

          <div class="stat-card" v-if="currentPlan !== 'free' && subscriptionExpiryInfo">
            <div class="stat-icon days-icon">
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

            <!-- PREFERENCES CARD -->
            <div class="card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Preferences</h2>
                    <p class="card-description">Customize your experience</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="preference-item">
                  <div class="preference-info">
                    <h4>Dark Mode</h4>
                    <p>Switch to dark theme</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" v-model="darkMode" @change="toggleDarkMode">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="preference-item">
                  <div class="preference-info">
                    <h4>Email Notifications</h4>
                    <p>Receive updates via email</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" v-model="emailNotifications">
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="preference-item">
                  <div class="preference-info">
                    <h4>Sound Effects</h4>
                    <p>Play sounds for actions</p>
                  </div>
                  <label class="toggle">
                    <input type="checkbox" v-model="soundEffects">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN -->
          <div class="right-column">
            
            <!-- SUBSCRIPTION CARD -->
            <div class="card subscription-card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon premium-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Subscription</h2>
                    <p class="card-description">Manage your plan</p>
                  </div>
                </div>
                <button @click="refreshFromServer" class="btn-icon" title="Refresh from server">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"/>
                    <polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
              </div>
              
              <div class="card-body">
                <!-- Current Plan Display -->
                <div class="current-plan-display">
                  <div class="plan-badge-large" :class="currentPlan">
                    {{ currentPlanLabel }}
                  </div>
                  <div class="plan-details" v-if="currentPlan !== 'free'">
                    <p v-if="subscriptionExpiryInfo">
                      Expires: {{ subscriptionExpiryInfo.formattedDate }}
                      <span class="days-left">({{ subscriptionExpiryInfo.daysRemaining }} days left)</span>
                    </p>
                    <p v-if="subscriptionSource" class="subscription-source">
                      Source: {{ subscriptionSource }}
                    </p>
                  </div>
                </div>

                <!-- Duration Selector -->
                <div class="duration-selector" v-if="currentPlan === 'free'">
                  <div 
                    v-for="option in durationOptions" 
                    :key="option.months"
                    :class="['duration-option', { active: selectedDuration === option.months }]"
                    @click="selectDuration(option.months)"
                  >
                    <span class="duration-label">{{ option.label }}</span>
                    <span v-if="option.discount > 0" class="duration-discount">-{{ option.discount }}%</span>
                  </div>
                </div>

                <!-- Plan Options -->
                <div class="plan-options">
                  <div 
                    v-for="plan in availablePlans" 
                    :key="plan.id"
                    :class="['plan-option', { active: currentPlan === plan.id, recommended: plan.recommended }]"
                    @click="selectPlan(plan.id)"
                  >
                    <div class="plan-option-header">
                      <span class="plan-name">{{ plan.name }}</span>
                      <span v-if="plan.recommended" class="recommended-badge">Popular</span>
                      <span v-if="currentPlan === plan.id" class="current-badge">Current</span>
                    </div>
                    <div class="plan-price">
                      <span class="price-amount">{{ plan.price }}</span>
                      <span class="price-period" v-if="plan.id !== 'free'">/{{ selectedDuration }} mo</span>
                    </div>
                    <ul class="plan-features">
                      <li v-for="feature in plan.features" :key="feature">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ feature }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Upgrade Button -->
                <button 
                  @click="goToUpgrade" 
                  class="btn btn-primary btn-block btn-upgrade"
                  :disabled="currentPlan !== 'free'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {{ currentPlan === 'free' ? 'Upgrade Now' : 'Plan Active' }}
                </button>

                <!-- Promocode Section -->
                <div class="promocode-section">
                  <h4>Have a promocode?</h4>
                  <div class="promocode-input-group">
                    <input 
                      type="text" 
                      v-model="promocode" 
                      class="form-input"
                      placeholder="Enter promocode"
                      :disabled="applyingPromo || currentPlan !== 'free'"
                    />
                    <button 
                      @click="applyPromocode" 
                      class="btn btn-secondary"
                      :disabled="!promocode || applyingPromo || currentPlan !== 'free'"
                    >
                      {{ applyingPromo ? 'Applying...' : 'Apply' }}
                    </button>
                  </div>
                  <p v-if="promoError" class="promo-error">{{ promoError }}</p>
                  <p v-if="promoSuccess" class="promo-success">{{ promoSuccess }}</p>
                </div>
              </div>
            </div>

            <!-- DANGER ZONE -->
            <div class="card danger-card">
              <div class="card-header">
                <div class="card-header-left">
                  <div class="card-icon danger-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h2 class="card-title">Danger Zone</h2>
                    <p class="card-description">Irreversible actions</p>
                  </div>
                </div>
              </div>
              
              <div class="card-body">
                <div class="danger-item">
                  <div class="danger-info">
                    <h4>Sign Out</h4>
                    <p>Sign out from your account</p>
                  </div>
                  <button @click="handleLogout" class="btn btn-outline-danger">
                    Sign Out
                  </button>
                </div>

                <div class="danger-item">
                  <div class="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all data</p>
                  </div>
                  <button @click="confirmDeleteAccount" class="btn btn-danger">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- DELETE CONFIRMATION MODAL -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Delete Account</h3>
          <button @click="showDeleteModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete your account? This action cannot be undone.</p>
          <p class="warning-text">All your data, progress, and subscription will be permanently deleted.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="deleteAccount" class="btn btn-danger">Delete Forever</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import { fetchSubscriptionFromServer, syncSubscriptionGlobally } from '@/api/subscription';
import { getUserStatus, getUserInfo } from '@/api/user';

export default {
  name: 'AcedSettings',
  
  setup() {
    const store = useStore();
    const router = useRouter();

    // =============================================
    // 📦 STATE
    // =============================================
    
    const loading = ref(false);
    const notification = ref('');
    const notificationType = ref('info');
    const syncStatus = ref(null);
    
    // User data
    const user = ref({
      name: '',
      surname: '',
      email: ''
    });
    const tempUser = ref({
      name: '',
      surname: ''
    });
    const isEditingName = ref(false);
    
    // Password
    const oldPassword = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    
    // Preferences
    const darkMode = ref(false);
    const emailNotifications = ref(true);
    const soundEffects = ref(true);
    
    // Subscription - CRITICAL: These are populated from server
    const serverSubscriptionData = ref(null);
    const promocode = ref('');
    // Duration selection
    const selectedDuration = ref(3); // Default to 3 months
    
    const durationOptions = [
      { months: 1, label: '1 Month', discount: 0 },
      { months: 3, label: '3 Months', discount: 10 },
      { months: 6, label: '6 Months', discount: 20 }
    ];

    const selectDuration = (months) => {
      selectedDuration.value = months;
    };

    // Modals
    const showDeleteModal = ref(false);

    // =============================================
    // 🔧 COMPUTED PROPERTIES
    // =============================================

    /**
     * CRITICAL: Get current plan from server data ONLY
     */
    const currentPlan = computed(() => {
      // Priority 1: Server-fetched data (most reliable)
      if (serverSubscriptionData.value?.plan) {
  
        return serverSubscriptionData.value.plan;
      }
      
      // If we haven't fetched yet, or fetch failed, return 'free' (safe default)
      // We explicitly DO NOT check store or localStorage as per user request
      return 'free';
    });

    const currentPlanLabel = computed(() => {
      return currentPlan.value === 'pro' || currentPlan.value === 'premium' ? 'Pro Plan' : 'Free Plan';
    });

    const subscriptionSource = computed(() => {
      return serverSubscriptionData.value?.source || '';
    });

    const subscriptionExpiryInfo = computed(() => {
      if (currentPlan.value === 'free' || !serverSubscriptionData.value?.expiryDate) return null;
      
      const expiry = new Date(serverSubscriptionData.value.expiryDate);
      const now = new Date();
      const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      
      return {
        date: expiry,
        formattedDate: expiry.toLocaleDateString(),
        daysRemaining: Math.max(0, daysRemaining),
        isExpiring: daysRemaining <= 3
      };
    });

    // Usage computeds
    const currentUsageMessages = computed(() => {
      return store.getters['user/currentUsage']?.messages || 0;
    });

    const currentUsageImages = computed(() => {
      return store.getters['user/currentUsage']?.images || 0;
    });

    const usageLimitsMessages = computed(() => {
      return store.getters['user/usageLimits']?.messages || 50;
    });

    const usageLimitsImages = computed(() => {
      return store.getters['user/usageLimits']?.images || 5;
    });

    const messageUsagePercentage = computed(() => {
      if (usageLimitsMessages.value === -1) return 0;
      return Math.min(100, (currentUsageMessages.value / usageLimitsMessages.value) * 100);
    });

    const imageUsagePercentage = computed(() => {
      if (usageLimitsImages.value === -1) return 0;
      return Math.min(100, (currentUsageImages.value / usageLimitsImages.value) * 100);
    });

    const isGoogleUser = computed(() => {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      return currentUser.providerData?.some(p => p.providerId === 'google.com');
    });

    const notificationClass = computed(() => {
      return `alert-${notificationType.value}`;
    });

    const notificationIcon = computed(() => {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      return icons[notificationType.value] || 'ℹ';
    });

    const notificationTitle = computed(() => {
      const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
      };
      return titles[notificationType.value] || 'Info';
    });

    // Available plans
    const availablePlans = computed(() => [
      {
        id: 'free',
        name: 'Free',
        price: '0',
        features: ['50 messages/month', '5 images/month', 'Basic lessons']
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '250,000 UZS',
        features: ['Unlimited everything', 'AI tutor', 'Custom courses', 'Analytics'],
        recommended: true
      }
    ]);

    // =============================================
    // 🔄 METHODS
    // =============================================

    /**
     * CRITICAL: Fetch subscription status from server
     * This is called on mount and can be called manually to refresh
     */
    const refreshFromServer = async () => {

      
      syncStatus.value = {
        type: 'loading',
        icon: '⏳',
        message: 'Syncing with server...'
      };

      try {
        const userId = auth.currentUser?.uid || 
                       localStorage.getItem('userId') || 
                       localStorage.getItem('firebaseUserId');

        if (!userId) {
          console.error('❌ [AcedSettings] No user ID available');
          syncStatus.value = {
            type: 'error',
            icon: '❌',
            message: 'No user ID. Please log in again.'
          };
          return;
        }

  

        // Fetch directly from server
        const result = await fetchSubscriptionFromServer(userId);
        


        if (result.success && result.subscription) {
          // Store server data
          serverSubscriptionData.value = result.subscription;
          
          // Update Vuex store (just to keep it in sync, but we won't read from it)
          store.commit('user/UPDATE_SUBSCRIPTION', {
             ...result.subscription,
             serverFetch: true
          });

          syncStatus.value = {
            type: 'success',
            icon: '✓',
            message: `Synced: ${result.subscription.plan.toUpperCase()} plan`
          };

          // Clear after 3 seconds
          setTimeout(() => {
            syncStatus.value = null;
          }, 3000);

          console.log('✅ [AcedSettings] Subscription synced:', result.subscription.plan);
        } else {
          console.warn('⚠️ [AcedSettings] Server fetch returned no data');
          syncStatus.value = {
            type: 'warning',
            icon: '⚠',
            message: 'Could not verify subscription status'
          };
        }
      } catch (error) {
  
        syncStatus.value = {
          type: 'error',
          icon: '❌',
          message: 'Failed to sync. Click retry.'
        };
      }
    };

    /**
     * Load initial data including user info and subscription
     */
    const loadInitialData = async () => {

      loading.value = true;

      try {
        // Load user info
        const currentUser = auth.currentUser;
        const storedUser = store.getters['user/getUser'];
        
        if (storedUser) {
          user.value = {
            name: storedUser.name || storedUser.displayName?.split(' ')[0] || '',
            surname: storedUser.surname || storedUser.displayName?.split(' ')[1] || '',
            email: storedUser.email || currentUser?.email || ''
          };
        } else if (currentUser) {
          user.value = {
            name: currentUser.displayName?.split(' ')[0] || '',
            surname: currentUser.displayName?.split(' ')[1] || '',
            email: currentUser.email || ''
          };
        }

        // Load preferences
        darkMode.value = localStorage.getItem('darkMode') === 'true';
        emailNotifications.value = localStorage.getItem('emailNotifications') !== 'false';
        soundEffects.value = localStorage.getItem('soundEffects') !== 'false';

        // CRITICAL: Fetch subscription from server
        await refreshFromServer();

      } catch (error) {
        console.error('❌ [AcedSettings] loadInitialData error:', error);
        showNotification('Failed to load settings', 'error');
      } finally {
        loading.value = false;
      }
    };

    const showNotification = (message, type = 'info') => {
      notification.value = message;
      notificationType.value = type;
      
      setTimeout(() => {
        notification.value = '';
      }, 5000);
    };

    // Name editing
    const startEditingName = () => {
      tempUser.value = { ...user.value };
      isEditingName.value = true;
    };

    const cancelEditingName = () => {
      isEditingName.value = false;
      tempUser.value = { name: '', surname: '' };
    };

    const saveNameChanges = async () => {
      try {
        loading.value = true;
        
        user.value.name = tempUser.value.name;
        user.value.surname = tempUser.value.surname;
        
        // Save to backend
        const userId = store.getters['user/getUserId'];
        if (userId) {
          // API call to update user profile
          // await updateUserProfile(userId, { name: user.value.name, surname: user.value.surname });
        }
        
        isEditingName.value = false;
        showNotification('Name updated successfully', 'success');
      } catch (error) {
        console.error('Error saving name:', error);
        showNotification('Failed to update name', 'error');
      } finally {
        loading.value = false;
      }
    };

    // Password management
    const saveChanges = async () => {
      if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
        showNotification('Please fill in all password fields', 'warning');
        return;
      }

      if (newPassword.value !== confirmPassword.value) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      if (newPassword.value.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        loading.value = true;
        
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.email) {
          throw new Error('No authenticated user');
        }

        // Reauthenticate
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword.value);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, newPassword.value);
        
        oldPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        
        showNotification('Password updated successfully', 'success');
      } catch (error) {
        console.error('Password update error:', error);
        if (error.code === 'auth/wrong-password') {
          showNotification('Current password is incorrect', 'error');
        } else {
          showNotification('Failed to update password', 'error');
        }
      } finally {
        loading.value = false;
      }
    };

    const sendPasswordReset = async () => {
      try {
        const email = user.value.email || auth.currentUser?.email;
        if (!email) {
          showNotification('No email address found', 'error');
          return;
        }

        await sendPasswordResetEmail(auth, email);
        showNotification('Password reset email sent', 'success');
      } catch (error) {
        console.error('Password reset error:', error);
        showNotification('Failed to send reset email', 'error');
      }
    };

    // Preferences
    const toggleDarkMode = () => {
      localStorage.setItem('darkMode', darkMode.value.toString());
      document.body.classList.toggle('dark-mode', darkMode.value);
    };

    // Subscription
    const selectPlan = (planId) => {
      if (planId !== 'free' && currentPlan.value === 'free') {
        goToUpgrade();
      }
    };

    const goToUpgrade = () => {
      router.push('/upgrade');
    };

    const applyPromocode = async () => {
      if (!promocode.value.trim()) {
        promoError.value = 'Please enter a promocode';
        return;
      }

      promoError.value = '';
      promoSuccess.value = '';
      applyingPromo.value = true;

      try {
        const result = await store.dispatch('user/applyPromocode', {
          promoCode: promocode.value.trim(),
          plan: 'pro'
        });

        if (result.success) {
          promoSuccess.value = result.message || 'Promocode applied successfully!';
          promocode.value = '';
          
          // Refresh from server to get updated status
          await refreshFromServer();
        } else {
          promoError.value = result.error || 'Invalid promocode';
        }
      } catch (error) {
        console.error('Promocode error:', error);
        promoError.value = 'Failed to apply promocode';
      } finally {
        applyingPromo.value = false;
      }
    };

    // Navigation
    const goToProfile = () => {
      router.push('/profile');
    };

    // Account management
    const handleLogout = async () => {
      try {
        await auth.signOut();
        await store.dispatch('user/logout');
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        showNotification('Failed to sign out', 'error');
      }
    };

    const confirmDeleteAccount = () => {
      showDeleteModal.value = true;
    };

    const deleteAccount = async () => {
      try {
        loading.value = true;
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        await deleteUser(currentUser);
        await store.dispatch('user/logout');
        
        showDeleteModal.value = false;
        router.push('/');
      } catch (error) {
        console.error('Delete account error:', error);
        if (error.code === 'auth/requires-recent-login') {
          showNotification('Please sign in again before deleting your account', 'error');
        } else {
          showNotification('Failed to delete account', 'error');
        }
      } finally {
        loading.value = false;
      }
    };

    // =============================================
    // 🎯 LIFECYCLE
    // =============================================

    onMounted(() => {

      loadInitialData();

      // Listen for subscription updates
      window.addEventListener('subscriptionUpdated', refreshFromServer);
      window.addEventListener('userStatusChanged', refreshFromServer);
    });

    onUnmounted(() => {
      window.removeEventListener('subscriptionUpdated', refreshFromServer);
      window.removeEventListener('userStatusChanged', refreshFromServer);
    });

    // Watch for store changes
    watch(
      () => store.getters['user/userStatus'],
      (newStatus) => {
        console.log('👁️ [AcedSettings] Store status changed:', newStatus);
      }
    );

    // =============================================
    // 📤 RETURN
    // =============================================

    return {
      // State
      loading,
      notification,
      notificationType,
      syncStatus,
      user,
      tempUser,
      isEditingName,
      oldPassword,
      newPassword,
      confirmPassword,
      darkMode,
      emailNotifications,
      soundEffects,
      promocode,
      applyingPromo,
      promoError,
      promoSuccess,
      showDeleteModal,
      
      // Computed
      currentPlan,
      currentPlanLabel,
      subscriptionSource,
      subscriptionExpiryInfo,
      currentUsageMessages,
      currentUsageImages,
      usageLimitsMessages,
      usageLimitsImages,
      messageUsagePercentage,
      imageUsagePercentage,
      isGoogleUser,
      notificationClass,
      notificationIcon,
      notificationTitle,
      availablePlans,
      
      // Methods
      refreshFromServer,
      loadInitialData,
      showNotification,
      startEditingName,
      cancelEditingName,
      saveNameChanges,
      saveChanges,
      sendPasswordReset,
      toggleDarkMode,
      selectPlan,
      goToUpgrade,
      applyPromocode,
      goToProfile,
      handleLogout,
      confirmDeleteAccount,
      deleteAccount
    };
  }
};
</script>

<style scoped>
/* =============================================
   BASE STYLES
   ============================================= */

.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.settings-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* =============================================
   HEADER
   ============================================= */

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f1f3f4;
  border: none;
  border-radius: 10px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #e8eaeb;
}

.header-text h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.header-subtitle {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* =============================================
   ALERTS & SYNC STATUS
   ============================================= */

.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.alert-success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
}

.alert-info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.alert-icon {
  font-size: 20px;
  font-weight: bold;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 2px;
}

.alert-content p {
  margin: 0;
  font-size: 14px;
}

.alert-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
}

.alert-close:hover {
  opacity: 1;
}

.sync-status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
}

.sync-status-banner.loading {
  background: #e3f2fd;
  color: #1565c0;
}

.sync-status-banner.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.sync-status-banner.error {
  background: #ffebee;
  color: #c62828;
}

.sync-status-banner.warning {
  background: #fff8e1;
  color: #f57f17;
}

.sync-retry-btn {
  margin-left: auto;
  padding: 6px 12px;
  background: white;
  border: 1px solid currentColor;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

/* =============================================
   STATS SECTION
   ============================================= */

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.plan-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.messages-icon {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.images-icon {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
  color: white;
}

.days-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.stat-limit {
  font-size: 14px;
  font-weight: 400;
  color: #999;
}

.stat-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 6px;
}

.stat-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.stat-badge.inactive {
  background: #f5f5f5;
  color: #666;
}

.stat-badge.warning {
  background: #fff3e0;
  color: #e65100;
}

.mini-progress {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.mini-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s;
}

/* =============================================
   CONTENT GRID
   ============================================= */

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* =============================================
   CARDS
   ============================================= */

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 10px;
  color: #667eea;
}

.premium-icon {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: white;
}

.danger-icon {
  background: #ffebee;
  color: #c62828;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.card-description {
  font-size: 13px;
  color: #666;
  margin: 2px 0 0;
}

.card-body {
  padding: 24px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: none;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e8eaeb;
  color: #333;
}

/* =============================================
   FORMS
   ============================================= */

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 11px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  background: white;
  border-color: #667eea;
}

.form-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-display {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* =============================================
   BUTTONS
   ============================================= */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f5f7fa;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e8eaeb;
}

.btn-text {
  background: none;
  color: #667eea;
  padding: 12px 16px;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-outline-danger {
  background: white;
  border: 2px solid #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-block {
  width: 100%;
}

.btn-upgrade {
  padding: 16px 24px;
  font-size: 16px;
  margin-top: 20px;
}

/* =============================================
   PREFERENCES
   ============================================= */

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.preference-info p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.toggle {
  position: relative;
  width: 48px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccc;
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider:before {
  content: "";
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* =============================================
   SUBSCRIPTION
   ============================================= */

.current-plan-display {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  margin-bottom: 20px;
}

.plan-badge-large {
  display: inline-block;
  padding: 8px 24px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.plan-badge-large.free {
  background: #f5f5f5;
  color: #666;
}

.plan-badge-large.start {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.plan-badge-large.pro {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.plan-badge-large.premium {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #333;
}

.plan-details {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.plan-details .days-left {
  color: #999;
  font-size: 13px;
}

.subscription-source {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.plan-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-option {
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.plan-option:hover {
  border-color: #667eea;
}

.plan-option.active {
  border-color: #667eea;
  background: #f5f7ff;
}

.plan-option.recommended {
  border-color: #ffd700;
}

.plan-option-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.plan-name {
  font-weight: 600;
  color: #1a1a1a;
}

.recommended-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
}

.current-badge {
  padding: 2px 8px;
  background: #667eea;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.plan-price {
  margin-bottom: 12px;
}

.price-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.price-period {
  font-size: 13px;
  color: #666;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.plan-features li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.plan-features li svg {
  color: #2e7d32;
  flex-shrink: 0;
}

/* =============================================
   PROMOCODE
   ============================================= */

.promocode-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.promocode-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 12px;
}

.promocode-input-group {
  display: flex;
  gap: 12px;
}

.promocode-input-group .form-input {
  flex: 1;
}

.promo-error {
  color: #dc3545;
  font-size: 13px;
  margin-top: 8px;
}

.promo-success {
  color: #2e7d32;
  font-size: 13px;
  margin-top: 8px;
}

/* =============================================
   DANGER ZONE
   ============================================= */

.danger-card .card-header {
  background: #fff5f5;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.danger-item:last-child {
  border-bottom: none;
}

.danger-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.danger-info p {
  font-size: 13px;
  color: #666;
  margin: 0;
}

/* =============================================
   MODAL
   ============================================= */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  max-width: 450px;
  width: 100%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 12px;
  color: #333;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f5f7fa;
}

/* =============================================
   DURATION SELECTOR
   ============================================= */

.duration-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 4px;
  background: #f5f7fa;
  border-radius: 12px;
}

.duration-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.duration-option:hover {
  background: rgba(255, 255, 255, 0.5);
}

.duration-option.active {
  background: white;
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.duration-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.duration-discount {
  font-size: 11px;
  color: #2e7d32;
  font-weight: 700;
  margin-top: 2px;
  background: #e8f5e9;
  padding: 2px 6px;
  border-radius: 10px;
}

/* =============================================
   RESPONSIVE
   ============================================= */

@media (max-width: 600px) {
  .settings-main {
    padding: 16px;
  }

  .settings-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .header-content {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .promocode-input-group {
    flex-direction: column;
  }
}
</style>