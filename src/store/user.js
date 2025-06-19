// src/store/user.js - ENHANCED USER STORE WITH PAYMENT INTEGRATION
import { checkPaymentStatus } from '@/api/payments';

const state = () => ({
  currentUser: null,
  userStatus: 'free', // 'free', 'start', 'pro', 'premium'
  subscriptionDetails: null,
  paymentHistory: [],
  lastPaymentCheck: null
});

const mutations = {
  setUser(state, user) {
    state.currentUser = user;
    console.log('👤 User set in store:', user?.email || user?.name);
  },
  
  clearUser(state) {
    state.currentUser = null;
    state.userStatus = 'free';
    state.subscriptionDetails = null;
    state.paymentHistory = [];
    state.lastPaymentCheck = null;
    console.log('🧹 User cleared from store');
  },
  
  setUserStatus(state, status) {
    const oldStatus = state.userStatus;
    state.userStatus = status;
    console.log(`📊 User status updated: ${oldStatus} → ${status}`);
  },
  
  setSubscriptionDetails(state, details) {
    state.subscriptionDetails = details;
    console.log('💳 Subscription details updated:', details);
  },
  
  addPaymentRecord(state, payment) {
    // Add payment to history (keep last 10)
    state.paymentHistory.unshift(payment);
    if (state.paymentHistory.length > 10) {
      state.paymentHistory = state.paymentHistory.slice(0, 10);
    }
    console.log('💰 Payment record added:', payment.id);
  },
  
  updateLastPaymentCheck(state, timestamp) {
    state.lastPaymentCheck = timestamp;
  },
  
  updateUserProfile(state, profileData) {
    if (state.currentUser) {
      state.currentUser = { ...state.currentUser, ...profileData };
      console.log('📝 User profile updated');
    }
  }
};

const actions = {
  // ✅ ENHANCED: Save user with better error handling and subscription sync
  async saveUserToBackend({ commit, dispatch }, { userData, token }) {
    try {
      console.log('📤 Saving user to backend:', userData?.email || userData?.name);

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
      
      // Load detailed subscription status
      await dispatch('loadUserStatus');
      
      console.log('✅ User saved and subscription status loaded');
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
      commit('setUserStatus', data.status || data.subscriptionPlan || 'free');
      
      if (data.subscriptionDetails) {
        commit('setSubscriptionDetails', data.subscriptionDetails);
      }
      
      // Update last check timestamp
      commit('updateLastPaymentCheck', Date.now());
      
      console.log('✅ User status loaded:', {
        status: data.status || data.subscriptionPlan,
        hasDetails: !!data.subscriptionDetails
      });

      return { success: true, status: data.status || data.subscriptionPlan };

    } catch (err) {
      console.error('❌ Failed to load user status:', err);
      commit('setUserStatus', 'free'); // Fallback to free
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Check for pending payments and update status
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
        console.log('⏰ Skipping payment check - checked recently');
        return { success: true, message: 'Recently checked' };
      }

      console.log('🔍 Checking for pending payments for user:', userId);

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
              console.log('✅ Payment completed for transaction:', transactionId);
              
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
                console.log(`🎉 User status upgraded to: ${newStatus}`);
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

      // If status changed, reload full user status
      if (statusChanged) {
        await dispatch('loadUserStatus');
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
        
        console.log('📝 Added pending payment:', {
          transactionId,
          amount,
          plan,
          userId
        });
      }

      return { success: true };

    } catch (err) {
      console.error('❌ Failed to add pending payment:', err);
      return { success: false, error: err.message };
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
      
      console.log('✅ User profile updated');
      return { success: true, user: updatedUser };

    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      return { success: false, error: err.message };
    }
  },

  // ✅ NEW: Initialize user on app start
  async initializeUser({ commit, dispatch }) {
    try {
      console.log('🚀 Initializing user...');
      
      // Check for stored user data
      const storedUserId = localStorage.getItem('userId');
      const storedUser = localStorage.getItem('currentUser');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          commit('setUser', userData);
          console.log('📦 Restored user from localStorage');
        } catch (err) {
          console.warn('⚠️ Failed to parse stored user data');
          localStorage.removeItem('currentUser');
        }
      }
      
      // Load current status if we have a user ID
      if (storedUserId) {
        await dispatch('loadUserStatus');
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
      console.log('👋 Logging out user...');
      
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
        if (key.startsWith('pendingPayments_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ User logged out and data cleared');
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