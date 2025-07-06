// src/store/user.js - ENHANCED USER STORE WITH MONTHLY USAGE TRACKING
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
  }
});

const mutations = {
  setUser(state, user) {
    state.currentUser = user;
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
  },
  
  setUserStatus(state, status) {
    const oldStatus = state.userStatus;
    state.userStatus = status;
  },
  
  setSubscriptionDetails(state, details) {
    state.subscriptionDetails = details;
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
  }
};

const actions = {
  // ✅ ENHANCED: Save user with better error handling and subscription sync
  async saveUserToBackend({ commit, dispatch }, { userData, token }) {
    try {

      const payload = {
        token,
        name: userData.displayName || userData.name || 'Unnamed User',
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
      await dispatch('loadUserStatus');
      await dispatch('loadCurrentMonthUsage');
      
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
      commit('setUserStatus', data.status || data.subscriptionPlan || 'free');
      
      if (data.subscriptionDetails) {
        commit('setSubscriptionDetails', data.subscriptionDetails);
      }
      
      // Update last check timestamp
      commit('updateLastPaymentCheck', Date.now());
      
     

      return { success: true, status: data.status || data.subscriptionPlan };

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


      const usageInfo = await getUserUsage();
      
      if (usageInfo.success) {
        commit('setCurrentMonthUsage', usageInfo.usage);
        commit('setUserStatus', usageInfo.plan);
        
        // Update limits based on current plan
        if (usageInfo.limits) {
          commit('setUsageLimits', { [usageInfo.plan]: usageInfo.limits });
        }
        
        commit('updateLastUsageCheck', Date.now());
        
      
        
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
        await dispatch('loadUserStatus');
        await dispatch('loadCurrentMonthUsage');
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
        
      }

      return { success: true };

    } catch (err) {
      console.error('❌ Failed to add pending payment:', err);
      return { success: false, error: err.message };
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

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
          // Add authorization header if needed
        },
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

  // ✅ ENHANCED: Initialize user on app start
  async initializeUser({ commit, dispatch }) {
    try {
      
      // Check for stored user data
      const storedUserId = localStorage.getItem('userId');
      const storedUser = localStorage.getItem('currentUser');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          commit('setUser', userData);
        } catch (err) {
          console.warn('⚠️ Failed to parse stored user data');
          localStorage.removeItem('currentUser');
        }
      }
      
      // Load current status and usage if we have a user ID
      if (storedUserId) {
        await dispatch('loadUserStatus');
        await dispatch('loadCurrentMonthUsage');
        await dispatch('checkMonthlyReset');
        await dispatch('checkPendingPayments');
      }
      
      return { success: true };

    } catch (err) {
      console.error('❌ Failed to initialize user:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ ENHANCED: Clear user data on logout
  async logout({ commit }) {
    try {
      
      // Clear store
      commit('clearUser');
      
      // Clear localStorage
      localStorage.removeItem('userId');
      localStorage.removeItem('firebaseUserId');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      
      // Clear pending payments for all users (optional)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('pendingPayments_') || key.startsWith('lastMonthlyReset_')) {
          localStorage.removeItem(key);
        }
      });
      
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
  subscriptionExpiry: (state) => 
    state.subscriptionDetails?.expiryDate || null,
  
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