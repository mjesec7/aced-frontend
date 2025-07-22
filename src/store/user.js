// src/store/user.js - COMPLETE USER STORE WITH PROMOCODE INTEGRATION
import { checkPaymentStatus } from '@/api/payments';
import { getUserUsage, resetMonthlyUsage } from '@/services/GPTService';

const state = () => ({
  currentUser: null,
  userStatus: 'free', // 'free', 'start', 'pro', 'premium'
  subscriptionDetails: null,
  paymentHistory: [],
  lastPaymentCheck: null,
  
  // Monthly usage tracking
  currentMonthUsage: {
    messages: 0,
    images: 0,
    lastUpdated: null
  },
  usageHistory: [], // Last 6 months
  lastUsageCheck: null,
  usageLimits: {
    free: { messages: 50, images: 5 },
    start: { messages: -1, images: 20 },
    pro: { messages: -1, images: -1 }
  },

  // Enhanced subscription tracking
  subscriptionExpiry: null,
  subscriptionStartDate: null,
  isTrialUser: false,
  trialDaysRemaining: 0,
  
  // Feature access cache
  featureAccess: {
    vocabulary: false,
    analytics: false,
    unlimited_lessons: false,
    priority_support: false,
    custom_courses: false,
    offline_mode: false
  },

  // User preferences
  preferences: {
    language: 'ru',
    notifications: true,
    emailUpdates: false,
    theme: 'light'
  },

  // ✅ NEW: Promocode tracking
  appliedPromocodes: [], // Track applied promocodes
  lastPromocodeCheck: null
});

const mutations = {
  setUser(state, user) {
    state.currentUser = user;
    // Store in localStorage for persistence
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  },
  
  clearUser(state) {
    state.currentUser = null;
    state.userStatus = 'free';
    state.subscriptionDetails = null;
    state.paymentHistory = [];
    state.lastPaymentCheck = null;
    state.currentMonthUsage = { messages: 0, images: 0, lastUpdated: null };
    state.usageHistory = [];
    state.lastUsageCheck = null;
    state.subscriptionExpiry = null;
    state.subscriptionStartDate = null;
    state.isTrialUser = false;
    state.trialDaysRemaining = 0;
    state.featureAccess = {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false
    };
    state.appliedPromocodes = [];
    state.lastPromocodeCheck = null;
    
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userStatus');
    localStorage.removeItem('subscriptionDetails');
    localStorage.removeItem('appliedPromocodes');
  },
  
  setUserStatus(state, status) {
    const oldStatus = state.userStatus;
    state.userStatus = status;
    
    // Store in localStorage
    localStorage.setItem('userStatus', status);
    
    // Update feature access when status changes
    updateFeatureAccess(state);
    
    console.log(`🔄 User status updated: ${oldStatus} → ${status}`);
  },
  
  setSubscriptionDetails(state, details) {
    state.subscriptionDetails = details;
    
    if (details) {
      if (details.expiryDate) {
        state.subscriptionExpiry = details.expiryDate;
      }
      if (details.startDate) {
        state.subscriptionStartDate = details.startDate;
      }
      if (details.isTrial !== undefined) {
        state.isTrialUser = details.isTrial;
      }
      if (details.trialDaysRemaining !== undefined) {
        state.trialDaysRemaining = details.trialDaysRemaining;
      }
      
      // Store in localStorage
      localStorage.setItem('subscriptionDetails', JSON.stringify(details));
    }
  },
  
  addPaymentRecord(state, payment) {
    // Add payment to history (keep last 10)
    state.paymentHistory.unshift(payment);
    if (state.paymentHistory.length > 10) {
      state.paymentHistory = state.paymentHistory.slice(0, 10);
    }
  },
  
  updateLastPaymentCheck(state, timestamp) {
    state.lastPaymentCheck = timestamp;
  },
  
  updateUserProfile(state, profileData) {
    if (state.currentUser) {
      state.currentUser = { ...state.currentUser, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    }
  },
  
  // Usage tracking mutations
  setCurrentMonthUsage(state, usage) {
    state.currentMonthUsage = {
      ...usage,
      lastUpdated: new Date().toISOString()
    };
  },
  
  incrementUsage(state, { messages = 0, images = 0 }) {
    state.currentMonthUsage.messages += messages;
    state.currentMonthUsage.images += images;
    state.currentMonthUsage.lastUpdated = new Date().toISOString();
  },
  
  resetCurrentMonthUsage(state) {
    state.currentMonthUsage = {
      messages: 0,
      images: 0,
      lastUpdated: new Date().toISOString()
    };
  },
  
  setUsageHistory(state, history) {
    state.usageHistory = history;
  },
  
  updateLastUsageCheck(state, timestamp) {
    state.lastUsageCheck = timestamp;
  },
  
  setUsageLimits(state, limits) {
    state.usageLimits = { ...state.usageLimits, ...limits };
  },

  // Feature access mutations
  setFeatureAccess(state, { feature, hasAccess }) {
    state.featureAccess[feature] = hasAccess;
  },

  updateAllFeatureAccess(state) {
    updateFeatureAccess(state);
  },

  // Preferences mutations
  setPreferences(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences };
  },

  updatePreference(state, { key, value }) {
    state.preferences[key] = value;
  },

  // Subscription expiry mutations
  setSubscriptionExpiry(state, expiry) {
    state.subscriptionExpiry = expiry;
    if (expiry) {
      localStorage.setItem('subscriptionExpiry', expiry);
    }
  },

  setTrialInfo(state, { isTrialUser, trialDaysRemaining }) {
    state.isTrialUser = isTrialUser;
    state.trialDaysRemaining = trialDaysRemaining;
  },

  // ✅ NEW: Promocode mutations
  addAppliedPromocode(state, promocodeData) {
    const promocode = {
      code: promocodeData.code,
      plan: promocodeData.plan,
      appliedAt: new Date().toISOString(),
      subscriptionDays: promocodeData.subscriptionDays || 30,
      ...promocodeData
    };
    
    state.appliedPromocodes.unshift(promocode);
    
    // Keep only last 10 applied promocodes
    if (state.appliedPromocodes.length > 10) {
      state.appliedPromocodes = state.appliedPromocodes.slice(0, 10);
    }
    
    // Store in localStorage
    localStorage.setItem('appliedPromocodes', JSON.stringify(state.appliedPromocodes));
  },

  updateLastPromocodeCheck(state, timestamp) {
    state.lastPromocodeCheck = timestamp;
  }
};

// Helper function to update feature access based on user status
const updateFeatureAccess = (state) => {
  const status = state.userStatus;
  
  const featureMap = {
    free: {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false
    },
    start: {
      vocabulary: true,
      analytics: false,
      unlimited_lessons: false,
      priority_support: true,
      custom_courses: false,
      offline_mode: true
    },
    pro: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true
    },
    premium: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true
    }
  };
  
  state.featureAccess = { ...featureMap[status] || featureMap.free };
};

// Helper function to get user token
const getUserToken = async () => {
  try {
    const { auth } = await import('@/firebase');
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (error) {
    console.warn('⚠️ Could not get user token:', error);
  }
  return null;
};

const actions = {
  // ✅ ENHANCED: Save user with better error handling and subscription sync
  async saveUserToBackend({ commit, dispatch }, { userData, token }) {
    try {
      console.log('💾 Saving user to backend...');

      const payload = {
        token,
        name: userData.displayName || userData.name || 'Unnamed User',
        email: userData.email || '',
        subscriptionPlan: 'free'
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const savedUser = await res.json();
      
      // Store user data
      commit('setUser', savedUser);
      commit('setUserStatus', savedUser.subscriptionPlan || 'free');
      
      // Store user ID in localStorage for payment integration
      const userId = savedUser.firebaseId || savedUser._id;
      if (userId) {
        localStorage.setItem('userId', userId);
        localStorage.setItem('firebaseUserId', userId);
      }
      
      // Load detailed subscription status and usage data
      await Promise.all([
        dispatch('loadUserStatus'),
        dispatch('loadCurrentMonthUsage'),
        dispatch('checkMonthlyReset')
      ]);
      
      console.log('✅ User saved successfully');
      return { success: true, user: savedUser };

    } catch (err) {
      console.error('❌ Failed to save user to backend:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ ENHANCED: Load user status with payment verification
  async loadUserStatus({ commit, state }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId');

      if (!userId) {
        console.warn('⚠️ No userId found for subscription status check');
        commit('setUserStatus', 'free');
        return { success: false, error: 'No user ID' };
      }

      console.log('🔍 Loading user status for:', userId);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/status`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.warn('⚠️ User not found on backend, assuming "free" status');
          commit('setUserStatus', 'free');
          return { success: false, error: 'User not found' };
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Update user status and subscription details
      const status = data.status || data.subscriptionPlan || 'free';
      commit('setUserStatus', status);
      
      if (data.subscriptionDetails) {
        commit('setSubscriptionDetails', data.subscriptionDetails);
      }
      
      // Update trial information if available
      if (data.isTrialUser !== undefined || data.trialDaysRemaining !== undefined) {
        commit('setTrialInfo', {
          isTrialUser: data.isTrialUser || false,
          trialDaysRemaining: data.trialDaysRemaining || 0
        });
      }
      
      // Update last check timestamp
      commit('updateLastPaymentCheck', Date.now());
      
      console.log('✅ User status loaded:', status);
      return { success: true, status };

    } catch (err) {
      console.error('❌ Failed to load user status:', err);
      commit('setUserStatus', 'free'); // Fallback to free
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Load current month usage data
  async loadCurrentMonthUsage({ commit, state }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId');

      if (!userId) {
        console.warn('⚠️ No userId for usage check');
        return { success: false, error: 'No user ID' };
      }

      console.log('📊 Loading current month usage...');

      const usageInfo = await getUserUsage();
      
      if (usageInfo.success) {
        commit('setCurrentMonthUsage', usageInfo.usage);
        commit('setUserStatus', usageInfo.plan);
        
        // Update limits based on current plan
        if (usageInfo.limits) {
          commit('setUsageLimits', { [usageInfo.plan]: usageInfo.limits });
        }
        
        commit('updateLastUsageCheck', Date.now());
        
        console.log('✅ Usage data loaded:', usageInfo.usage);
        return { success: true, usage: usageInfo.usage };
      } else {
        console.warn('⚠️ Failed to load usage data:', usageInfo.error);
        return { success: false, error: usageInfo.error };
      }

    } catch (err) {
      console.error('❌ Failed to load current month usage:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Check and perform monthly reset if needed
  async checkMonthlyReset({ commit, dispatch, state }) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Check if we have stored the last reset check
      const lastResetKey = `lastMonthlyReset_${state.currentUser?.firebaseId || localStorage.getItem('userId')}`;
      const lastReset = localStorage.getItem(lastResetKey);
      
      let shouldReset = false;
      
      if (!lastReset) {
        // First time user
        shouldReset = false; // Don't reset on first visit
        localStorage.setItem(lastResetKey, `${currentYear}-${currentMonth}`);
      } else {
        const [lastYear, lastMonth] = lastReset.split('-').map(Number);
        
        // Check if month changed
        if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
          shouldReset = true;
          localStorage.setItem(lastResetKey, `${currentYear}-${currentMonth}`);
        }
      }
      
      if (shouldReset) {
        console.log('🔄 Monthly usage reset triggered');
        
        // Reset local state
        commit('resetCurrentMonthUsage');
        
        // Try to reset on backend (optional - backend should handle this automatically)
        try {
          await resetMonthlyUsage();
        } catch (err) {
          console.warn('⚠️ Backend reset failed (will be handled automatically):', err);
        }
        
        // Reload current usage to sync with backend
        await dispatch('loadCurrentMonthUsage');
        
        return { success: true, reset: true };
      }
      
      return { success: true, reset: false };

    } catch (err) {
      console.error('❌ Failed to check monthly reset:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Update usage after sending message
  async updateUsageAfterMessage({ commit, state }, { hasImage = false }) {
    try {
      // Optimistically update local state
      commit('incrementUsage', { 
        messages: 1, 
        images: hasImage ? 1 : 0 
      });
      
      console.log('📊 Usage updated:', state.currentMonthUsage);
      return { success: true };

    } catch (err) {
      console.error('❌ Failed to update usage:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Check usage limits before action
  async checkUsageLimits({ state }, { action = 'message', hasImage = false }) {
    try {
      const plan = state.userStatus;
      const limits = state.usageLimits[plan] || state.usageLimits.free;
      const usage = state.currentMonthUsage;
      
      // Check message limit
      if (action === 'message' && limits.messages !== -1 && usage.messages >= limits.messages) {
        return {
          allowed: false,
          reason: 'message_limit_exceeded',
          message: `Достигнут лимит сообщений (${limits.messages}) для плана "${plan}". Обновите план для продолжения.`,
          usage,
          limits
        };
      }
      
      // Check image limit
      if (hasImage && limits.images !== -1 && usage.images >= limits.images) {
        return {
          allowed: false,
          reason: 'image_limit_exceeded',
          message: `Достигнут лимит изображений (${limits.images}) для плана "${plan}". Обновите план для продолжения.`,
          usage,
          limits
        };
      }
      
      return {
        allowed: true,
        remaining: {
          messages: limits.messages === -1 ? '∞' : Math.max(0, limits.messages - usage.messages),
          images: limits.images === -1 ? '∞' : Math.max(0, limits.images - usage.images)
        },
        usage,
        limits
      };

    } catch (err) {
      console.error('❌ Failed to check usage limits:', err);
      return { allowed: false, error: err.message };
    }
  },

  // ✅ ENHANCED: Check for pending payments and update status
  async checkPendingPayments({ commit, state, dispatch }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId');

      if (!userId) {
        console.warn('⚠️ No userId for payment check');
        return { success: false, error: 'No user ID' };
      }

      // Check if we've checked recently (within last 5 minutes)
      const now = Date.now();
      const lastCheck = state.lastPaymentCheck;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (lastCheck && (now - lastCheck) < fiveMinutes) {
        return { success: true, message: 'Recently checked' };
      }

      console.log('🔍 Checking pending payments...');

      // Get recent transactions from local storage or API
      const pendingTransactionIds = JSON.parse(
        localStorage.getItem(`pendingPayments_${userId}`) || '[]'
      );

      let statusChanged = false;

      // Check each pending transaction
      for (const transactionId of pendingTransactionIds) {
        try {
          const result = await checkPaymentStatus(transactionId, userId);
          
          if (result.success && result.transaction) {
            const transaction = result.transaction;
            
            // Add to payment history
            commit('addPaymentRecord', {
              id: transaction.id,
              amount: transaction.amount,
              state: transaction.state,
              timestamp: transaction.perform_time || transaction.create_time,
              stateText: getTransactionStateText(transaction.state)
            });

            // If payment completed, update user status
            if (transaction.state === 2) { // Completed
              console.log('✅ Payment completed, updating status');
              
              // Determine plan based on amount
              let newStatus = 'free';
              if (transaction.amount === 260000) {
                newStatus = 'start';
              } else if (transaction.amount === 455000) {
                newStatus = 'pro';
              }
              
              if (newStatus !== 'free' && newStatus !== state.userStatus) {
                commit('setUserStatus', newStatus);
                statusChanged = true;
              }
              
              // Remove from pending list
              const updatedPending = pendingTransactionIds.filter(id => id !== transactionId);
              localStorage.setItem(`pendingPayments_${userId}`, JSON.stringify(updatedPending));
            }
          }
        } catch (err) {
          console.warn(`⚠️ Failed to check transaction ${transactionId}:`, err.message);
        }
      }

      // Update last check timestamp
      commit('updateLastPaymentCheck', now);

      // If status changed, reload full user status and usage limits
      if (statusChanged) {
        await Promise.all([
          dispatch('loadUserStatus'),
          dispatch('loadCurrentMonthUsage')
        ]);
      }

      return { 
        success: true, 
        statusChanged,
        checkedTransactions: pendingTransactionIds.length
      };

    } catch (err) {
      console.error('❌ Failed to check pending payments:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Add transaction to pending payments list
  async addPendingPayment({ state }, { transactionId, amount, plan }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId');

      if (!userId || !transactionId) {
        console.warn('⚠️ Missing userId or transactionId for pending payment');
        return { success: false, error: 'Missing required data' };
      }

      const pendingPayments = JSON.parse(
        localStorage.getItem(`pendingPayments_${userId}`) || '[]'
      );

      // Add new transaction if not already present
      if (!pendingPayments.includes(transactionId)) {
        pendingPayments.push(transactionId);
        localStorage.setItem(`pendingPayments_${userId}`, JSON.stringify(pendingPayments));
        
        console.log('📝 Added pending payment:', transactionId);
      }

      return { success: true };

    } catch (err) {
      console.error('❌ Failed to add pending payment:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Update user status manually (for subscription upgrades)
  async updateUserStatus({ commit, dispatch }, newStatus) {
    try {
      const validStatuses = ['free', 'start', 'pro', 'premium'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }
      
      commit('setUserStatus', newStatus);
      
      // Reload usage data with new status
      await dispatch('loadCurrentMonthUsage');
      
      console.log('✅ User status manually updated to:', newStatus);
      return { success: true };
      
    } catch (err) {
      console.error('❌ Failed to update user status:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Upgrade subscription
  async upgradeSubscription({ commit, dispatch }, { plan, expiry = null }) {
    try {
      const validPlans = ['start', 'pro', 'premium'];
      if (!validPlans.includes(plan)) {
        throw new Error(`Invalid plan: ${plan}`);
      }
      
      // Update status
      commit('setUserStatus', plan);
      
      // Set expiry if provided
      if (expiry) {
        commit('setSubscriptionExpiry', expiry);
      }
      
      // Reload usage limits
      await dispatch('loadCurrentMonthUsage');
      
      console.log('✅ Subscription upgraded to:', plan);
      return { success: true };
      
    } catch (err) {
      console.error('❌ Failed to upgrade subscription:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Apply promocode action
  async applyPromocode({ commit, state, dispatch }, { promoCode, plan }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId');

      if (!userId) {
        return { success: false, error: 'Пользователь не найден' };
      }

      console.log('🎟️ Applying promocode via store:', { userId, plan, promoCode });

      // Get auth token
      const token = await getUserToken();

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call the backend API for promocode application
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/promo-code`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          userId: userId,
          plan: plan,
          promoCode: promoCode.trim().toUpperCase()
        })
      });

      const result = await response.json();

      if (result.success) {
        // ✅ SUCCESS: Update store state
        const oldStatus = state.userStatus;
        
        // Update user status
        commit('setUserStatus', plan);
        
        // Set subscription details
        const subscriptionDetails = {
          plan: plan,
          appliedViaPromocode: true,
          promocode: promoCode.trim().toUpperCase(),
          activatedAt: new Date().toISOString(),
          source: 'promocode'
        };
        
        if (result.data?.subscriptionDetails) {
          Object.assign(subscriptionDetails, result.data.subscriptionDetails);
        }
        
        commit('setSubscriptionDetails', subscriptionDetails);
        
        // Track applied promocode
        commit('addAppliedPromocode', {
          code: promoCode.trim().toUpperCase(),
          plan: plan,
          activatedAt: new Date().toISOString(),
          subscriptionDetails: subscriptionDetails
        });
        
        // Update feature access
        commit('updateAllFeatureAccess');
        
        // Reload usage data with new plan limits
        await dispatch('loadCurrentMonthUsage');
        
        console.log(`✅ Promocode applied successfully: ${oldStatus} → ${plan}`);
        
        return {
          success: true,
          message: result.message || `Промокод успешно применён! Подписка "${plan.toUpperCase()}" активирована.`,
          oldPlan: oldStatus,
          newPlan: plan,
          subscriptionDetails: subscriptionDetails
        };
        
      } else {
        // ❌ ERROR from backend
        console.warn('⚠️ Promocode application failed:', result.error);
        return {
          success: false,
          error: result.error || 'Не удалось применить промокод'
        };
      }

    } catch (error) {
      console.error('❌ Promocode application error:', error);
      
      if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        return {
          success: false,
          error: 'Ошибка сети. Проверьте подключение к интернету'
        };
      } else if (error.status === 400) {
        return {
          success: false,
          error: 'Неверный промокод или данные'
        };
      } else if (error.status === 404) {
        return {
          success: false,
          error: 'Промокод не найден'
        };
      } else if (error.status === 403) {
        return {
          success: false,
          error: 'Промокод уже использован или недоступен'
        };
      } else {
        return {
          success: false,
          error: 'Произошла ошибка при применении промокода'
        };
      }
    }
  },

  // ✅ NEW: Validate promocode without applying
  async validatePromocode({ state }, promoCode) {
    try {
      if (!promoCode || promoCode.length <= 3) {
        return { valid: false, error: 'Промокод слишком короткий' };
      }

      console.log('🔍 Validating promocode:', promoCode);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/promocodes/validate/${promoCode.trim().toUpperCase()}`);
      const result = await response.json();

      if (result.success && result.valid) {
        return {
          valid: true,
          data: result.data,
          message: `Промокод действителен! Предоставляет: ${result.data.grantsPlan?.toUpperCase()} план`
        };
      } else {
        return {
          valid: false,
          error: result.error || 'Промокод недействителен'
        };
      }

    } catch (error) {
      console.error('❌ Promocode validation error:', error);
      
      if (error.status === 404) {
        return {
          valid: false,
          error: 'Промокод не найден'
        };
      } else if (error.status === 400) {
        return {
          valid: false,
          error: 'Неверный формат промокода'
        };
      } else {
        return {
          valid: false,
          error: 'Ошибка проверки промокода'
        };
      }
    }
  },

  // ✅ NEW: Get usage statistics and trends
  async getUsageStatistics({ state }) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId');

      if (!userId) {
        return { success: false, error: 'No user ID' };
      }

      // This would call your backend API for detailed stats
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/usage/stats?months=6`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const stats = await response.json();
      
      return {
        success: true,
        ...stats
      };

    } catch (err) {
      console.error('❌ Failed to get usage statistics:', err);
      
      // Return local data as fallback
      return {
        success: false,
        error: err.message,
        localData: {
          currentMonth: state.currentMonthUsage,
          plan: state.userStatus,
          limits: state.usageLimits[state.userStatus]
        }
      };
    }
  },

  // ✅ NEW: Update user profile
  async updateProfile({ commit, state }, profileData) {
    try {
      const userId = 
        state.currentUser?.firebaseId ||
        state.currentUser?._id ||
        localStorage.getItem('userId');

      if (!userId) {
        throw new Error('No user ID found');
      }

      const token = await getUserToken();
      const headers = { 
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(profileData)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const updatedUser = await res.json();
      commit('updateUserProfile', updatedUser);
      
      return { success: true, user: updatedUser };

    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Update user preferences
  async updatePreferences({ commit, state }, preferences) {
    try {
      commit('setPreferences', preferences);
      
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
      
      // Optionally save to backend
      const userId = state.currentUser?.firebaseId || localStorage.getItem('userId');
      if (userId) {
        try {
          const token = await getUserToken();
          const headers = { 'Content-Type': 'application/json' };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/preferences`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(preferences)
          });
        } catch (err) {
          console.warn('⚠️ Failed to save preferences to backend:', err);
        }
      }
      
      return { success: true };
      
    } catch (err) {
      console.error('❌ Failed to update preferences:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Check subscription expiry
  async checkSubscriptionExpiry({ commit, state, dispatch }) {
    try {
      if (!state.subscriptionExpiry) return { active: true };
      
      const now = new Date();
      const expiry = new Date(state.subscriptionExpiry);
      
      if (now > expiry) {
        // Subscription has expired
        console.log('⏰ Subscription has expired, reverting to free');
        
        commit('setUserStatus', 'free');
        commit('setSubscriptionExpiry', null);
        
        // Reload usage limits
        await dispatch('loadCurrentMonthUsage');
        
        return { active: false, expired: true };
      }
      
      // Check if expiring soon (within 7 days)
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const expiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      
      return { 
        active: true, 
        expired: false, 
        expiringSoon,
        daysUntilExpiry: Math.max(0, daysUntilExpiry)
      };
      
    } catch (err) {
      console.error('❌ Error checking subscription expiry:', err);
      return { active: false, error: err.message };
    }
  },

  // ✅ ENHANCED: Initialize user on app start
  async initializeUser({ commit, dispatch }) {
    try {
      console.log('🚀 Initializing user state...');
      
      // Check for stored user data
      const storedUserId = localStorage.getItem('userId');
      const storedUser = localStorage.getItem('currentUser');
      const storedStatus = localStorage.getItem('userStatus');
      const storedPreferences = localStorage.getItem('userPreferences');
      const storedPromocodes = localStorage.getItem('appliedPromocodes');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          commit('setUser', userData);
        } catch (err) {
          console.warn('⚠️ Failed to parse stored user data');
          localStorage.removeItem('currentUser');
        }
      }
      
      if (storedStatus) {
        commit('setUserStatus', storedStatus);
      }
      
      if (storedPreferences) {
        try {
          const preferences = JSON.parse(storedPreferences);
          commit('setPreferences', preferences);
        } catch (err) {
          console.warn('⚠️ Failed to parse stored preferences');
        }
      }
      
      if (storedPromocodes) {
        try {
          const promocodes = JSON.parse(storedPromocodes);
          commit('appliedPromocodes', promocodes);
        } catch (err) {
          console.warn('⚠️ Failed to parse stored promocodes');
        }
      }
      
      // Load current status and usage if we have a user ID
      if (storedUserId) {
        await Promise.all([
          dispatch('loadUserStatus'),
          dispatch('loadCurrentMonthUsage'),
          dispatch('checkMonthlyReset'),
          dispatch('checkPendingPayments'),
          dispatch('checkSubscriptionExpiry')
        ]);
      }
      
      console.log('✅ User initialization complete');
      return { success: true };

    } catch (err) {
      console.error('❌ Failed to initialize user:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ ENHANCED: Clear user data on logout
  async logout({ commit }) {
    try {
      console.log('👋 Logging out user...');
      
      // Clear store
      commit('clearUser');
      
      // Clear localStorage
      localStorage.removeItem('userId');
      localStorage.removeItem('firebaseUserId');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('userStatus');
      localStorage.removeItem('subscriptionDetails');
      localStorage.removeItem('subscriptionExpiry');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('appliedPromocodes');
      
      // Clear pending payments for all users (optional)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('pendingPayments_') || key.startsWith('lastMonthlyReset_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Logout complete');
      return { success: true };

    } catch (err) {
      console.error('❌ Logout error:', err);
      return { success: false, error: err.message };
    }
  }
};

const getters = {
  // Basic user getters
  isAuthenticated: (state) => !!state.currentUser,
  getUser: (state) => state.currentUser,
  getUserId: (state) => 
    state.currentUser?.firebaseId || 
    state.currentUser?._id || 
    localStorage.getItem('userId'),
  
  // Subscription status getters
  userStatus: (state) => state.userStatus,
  subscriptionDetails: (state) => state.subscriptionDetails,
  
  // Premium access getters
  isPremiumUser: (state) => 
    ['premium', 'start', 'pro'].includes(state.userStatus),
  isStartUser: (state) => 
    ['start', 'pro', 'premium'].includes(state.userStatus),
  isProUser: (state) => 
    ['pro', 'premium'].includes(state.userStatus),
  isFreeUser: (state) => 
    state.userStatus === 'free',
  
  // Feature access getters
  hasVocabularyAccess: (state) => 
    state.featureAccess.vocabulary || ['start', 'pro', 'premium'].includes(state.userStatus),
  hasAdvancedFeatures: (state) => 
    state.featureAccess.analytics || ['pro', 'premium'].includes(state.userStatus),
  hasUnlimitedLessons: (state) => 
    state.featureAccess.unlimited_lessons || ['pro', 'premium'].includes(state.userStatus),
  hasPrioritySupport: (state) => 
    state.featureAccess.priority_support || ['start', 'pro', 'premium'].includes(state.userStatus),
  hasCustomCourses: (state) => 
    state.featureAccess.custom_courses || ['pro', 'premium'].includes(state.userStatus),
  hasOfflineMode: (state) => 
    state.featureAccess.offline_mode || ['start', 'pro', 'premium'].includes(state.userStatus),
  
  // Usage getters
  currentMonthUsage: (state) => state.currentMonthUsage,
  usageLimits: (state) => state.usageLimits[state.userStatus] || state.usageLimits.free,
  
  // Remaining usage calculations
  remainingMessages: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return '∞';
    return Math.max(0, limits.messages - state.currentMonthUsage.messages);
  },
  
  remainingImages: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return '∞';
    return Math.max(0, limits.images - state.currentMonthUsage.images);
  },
  
  // Usage percentage calculations
  messageUsagePercentage: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return 0;
    return Math.min(100, (state.currentMonthUsage.messages / limits.messages) * 100);
  },
  
  imageUsagePercentage: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return 0;
    return Math.min(100, (state.currentMonthUsage.images / limits.images) * 100);
  },
  
  // Limit status checks
  isMessageLimitReached: (state, getters) => {
    const limits = getters.usageLimits;
    return limits.messages !== -1 && state.currentMonthUsage.messages >= limits.messages;
  },
  
  isImageLimitReached: (state, getters) => {
    const limits = getters.usageLimits;
    return limits.images !== -1 && state.currentMonthUsage.images >= limits.images;
  },
  
  isNearMessageLimit: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return false;
    return state.currentMonthUsage.messages >= (limits.messages * 0.8); // 80% threshold
  },
  
  isNearImageLimit: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return false;
    return state.currentMonthUsage.images >= (limits.images * 0.8); // 80% threshold
  },
  
  // Payment history getters
  paymentHistory: (state) => state.paymentHistory,
  lastPaymentCheck: (state) => state.lastPaymentCheck,
  hasRecentPayments: (state) => 
    state.paymentHistory.length > 0 && 
    state.paymentHistory.some(p => p.state === 2), // Has completed payments
  
  // ✅ NEW: Promocode getters
  appliedPromocodes: (state) => state.appliedPromocodes,
  lastPromocodeCheck: (state) => state.lastPromocodeCheck,
  hasAppliedPromocodes: (state) => state.appliedPromocodes.length > 0,
  lastAppliedPromocode: (state) => 
    state.appliedPromocodes.length > 0 ? state.appliedPromocodes[0] : null,
  
  // User info getters
  userName: (state) => 
    state.currentUser?.name || 
    state.currentUser?.displayName || 
    'Пользователь',
  userEmail: (state) => 
    state.currentUser?.email || '',
  
  // Subscription status text
  statusText: (state) => {
    const statusTexts = {
      free: 'Бесплатный',
      start: 'Start',
      pro: 'Pro',
      premium: 'Premium'
    };
    return statusTexts[state.userStatus] || 'Неизвестно';
  },
  
  // Check if subscription is active
  hasActiveSubscription: (state) => 
    ['start', 'pro', 'premium'].includes(state.userStatus),
  
  // Get subscription expiry (if available)
  subscriptionExpiry: (state) => state.subscriptionExpiry,
  
  // Trial status
  isTrialUser: (state) => state.isTrialUser,
  trialDaysRemaining: (state) => state.trialDaysRemaining,
  
  // Subscription expiry checks
  isSubscriptionExpiringSoon: (state) => {
    if (!state.subscriptionExpiry || state.userStatus === 'free') return false;
    
    const now = new Date();
    const expiry = new Date(state.subscriptionExpiry);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  },
  
  daysUntilExpiry: (state) => {
    if (!state.subscriptionExpiry || state.userStatus === 'free') return null;
    
    const now = new Date();
    const expiry = new Date(state.subscriptionExpiry);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry > 0 ? daysUntilExpiry : 0;
  },
  
  // Check if user can access specific content
  canAccessContent: (state) => (contentType = 'basic') => {
    const access = {
      basic: ['free', 'start', 'pro', 'premium'],
      premium: ['start', 'pro', 'premium'],
      pro: ['pro', 'premium'],
      admin: ['premium']
    };
    
    return access[contentType]?.includes(state.userStatus) || false;
  },
  
  // Feature access checker
  hasFeatureAccess: (state) => (feature) => {
    return state.featureAccess[feature] || false;
  },
  
  // Usage summary for UI
  usageSummary: (state, getters) => {
    return {
      plan: state.userStatus,
      planDisplayName: getters.statusText,
      messages: {
        used: state.currentMonthUsage.messages,
        limit: getters.usageLimits.messages,
        remaining: getters.remainingMessages,
        percentage: getters.messageUsagePercentage,
        isNearLimit: getters.isNearMessageLimit,
        isLimitReached: getters.isMessageLimitReached
      },
      images: {
        used: state.currentMonthUsage.images,
        limit: getters.usageLimits.images,
        remaining: getters.remainingImages,
        percentage: getters.imageUsagePercentage,
        isNearLimit: getters.isNearImageLimit,
        isLimitReached: getters.isImageLimitReached
      },
      lastUpdated: state.currentMonthUsage.lastUpdated
    };
  },
  
  // Preferences getter
  userPreferences: (state) => state.preferences,
  
  // Get recommended upgrade plan
  recommendedUpgrade: (state) => {
    if (state.userStatus === 'free') {
      return {
        plan: 'start',
        displayName: 'Start',
        benefits: [
          'Доступ к словарю',
          'Приоритетная поддержка', 
          'Офлайн режим',
          'Безлимитные сообщения'
        ],
        price: '260,000 сум'
      };
    } else if (state.userStatus === 'start') {
      return {
        plan: 'pro',
        displayName: 'Pro',
        benefits: [
          'Продвинутая аналитика',
          'Безлимитные уроки',
          'Персональные курсы',
          'Экспорт прогресса'
        ],
        price: '450,000 сум'
      };
    }
    return null;
  },

  // ✅ NEW: Check if user got subscription via promocode
  hasPromocodeSubscription: (state) => {
    return state.subscriptionDetails?.appliedViaPromocode || false;
  },

  // ✅ NEW: Get subscription source
  subscriptionSource: (state) => {
    if (state.subscriptionDetails?.source) {
      return state.subscriptionDetails.source;
    } else if (state.subscriptionDetails?.appliedViaPromocode) {
      return 'promocode';
    } else if (state.userStatus !== 'free') {
      return 'payment';
    } else {
      return 'free';
    }
  }
};

// Helper function for transaction state text
const getTransactionStateText = (state) => {
  switch (state) {
    case 1:
      return 'Ожидание оплаты';
    case 2:
      return 'Оплачено';
    case -1:
      return 'Отменено';
    case -2:
      return 'Возвращено';
    default:
      return 'Неизвестно';
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};