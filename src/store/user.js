// src/store/user.js - COMPLETE REDESIGNED USER STORE WITH SERVER-SIDE OPERATIONS
import { checkPaymentStatus } from '@/api/payments';
import { getUserUsage, resetMonthlyUsage } from '@/services/GPTService';

// ✅ CENTRALIZED STATE MANAGEMENT
const state = () => ({
  // Core user data
  currentUser: null,
  userStatus: 'free', // 'free', 'start', 'pro', 'premium'
  
  // Subscription management
  subscription: {
    plan: 'free',
    status: 'inactive', // 'active', 'inactive', 'expired', 'trial'
    source: null, // 'payment', 'promocode', 'trial'
    startDate: null,
    expiryDate: null,
    isAutoRenew: false,
    details: {}
  },
  
  // Usage tracking
  usage: {
    current: { messages: 0, images: 0, lastUpdated: null },
    limits: {
      free: { messages: 50, images: 5 },
      start: { messages: -1, images: 20 },
      pro: { messages: -1, images: -1 }
    },
    history: []
  },
  
  // Feature access matrix
  features: {
    vocabulary: false,
    analytics: false,
    unlimited_lessons: false,
    priority_support: false,
    custom_courses: false,
    offline_mode: false,
    export_progress: false
  },
  
  // Promocodes tracking
  promocodes: {
    applied: [],
    lastCheck: null
  },
  
  // Payment history
  payments: {
    history: [],
    pending: [],
    lastCheck: null
  },
  
  // User preferences
  preferences: {
    language: 'ru',
    theme: 'light',
    notifications: true,
    emailUpdates: false
  },
  
  // System state
  system: {
    initialized: false,
    lastUpdate: null,
    forceUpdateCounter: 0,
    loading: {
      status: false,
      usage: false,
      payments: false,
      saving: false
    }
  }
});

// ✅ MUTATION HANDLERS
const mutations = {
  // ==================================================
  // CORE USER MUTATIONS
  // ==================================================
  
  SET_USER(state, user) {
    state.currentUser = user;
    state.system.lastUpdate = Date.now();
    
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('👤 User set:', user.email);
    }
  },
  
  CLEAR_USER(state) {
    state.currentUser = null;
    state.userStatus = 'free';
    state.subscription = {
      plan: 'free',
      status: 'inactive',
      source: null,
      startDate: null,
      expiryDate: null,
      isAutoRenew: false,
      details: {}
    };
    state.usage.current = { messages: 0, images: 0, lastUpdated: null };
    state.features = {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false,
      export_progress: false
    };
    state.promocodes.applied = [];
    state.payments.history = [];
    state.payments.pending = [];
    state.system.initialized = false;
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // Clear localStorage
    ['currentUser', 'userStatus', 'subscriptionDetails', 'appliedPromocodes'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('🧹 User data cleared');
    triggerGlobalEvent('userCleared', { timestamp: Date.now() });
  },
  
  // ==================================================
  // SUBSCRIPTION STATUS MUTATIONS
  // ==================================================
  
  SET_USER_STATUS(state, status) {
    const oldStatus = state.userStatus;
    state.userStatus = status;
    state.subscription.plan = status;
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // Update feature access
    updateFeatureMatrix(state);
    
    // Persist to localStorage
    localStorage.setItem('userStatus', status);
    
    console.log(`🔄 Status updated: ${oldStatus} → ${status}`);
    
    // Trigger global events
    triggerGlobalEvent('userStatusChanged', {
      oldStatus,
      newStatus: status,
      timestamp: Date.now(),
      features: { ...state.features }
    });
  },

  // ✅ ENHANCED: setUserStatus with manual reactivity triggers
  setUserStatus(state, status) {
    const oldStatus = state.userStatus;
    
    // ✅ Use direct assignment (Vue 3) - guaranteed reactivity
    state.userStatus = status;
    state.subscription.plan = status;
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // Store in localStorage
    localStorage.setItem('userStatus', status);
    
    // Update feature access when status changes
    updateFeatureMatrix(state);
    
    console.log(`🔄 User status updated: ${oldStatus} → ${status}`);
    
    // ✅ NEW: Trigger reactivity manually if needed
    if (typeof window !== 'undefined') {
      // Vue 3 nextTick
      if (window.Vue?.nextTick) {
        window.Vue.nextTick(() => {
          console.log('🔄 Forced Vue reactivity update');
        });
      }
      
      // Alternative: trigger custom DOM event for manual reactivity
      const reactivityEvent = new CustomEvent('vueReactivityUpdate', {
        detail: { mutation: 'setUserStatus', oldStatus, newStatus: status }
      });
      window.dispatchEvent(reactivityEvent);
    }
    
    // Trigger global events
    triggerGlobalEvent('userStatusChanged', {
      oldStatus,
      newStatus: status,
      timestamp: Date.now(),
      features: { ...state.features }
    });
  },
  
  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    state.subscription = { ...state.subscription, ...subscriptionData };
    state.system.lastUpdate = Date.now();
    
    if (subscriptionData.plan && subscriptionData.plan !== state.userStatus) {
      mutations.SET_USER_STATUS(state, subscriptionData.plan);
    }
    
    localStorage.setItem('subscriptionDetails', JSON.stringify(state.subscription));
  },
  
  // ==================================================
  // USAGE TRACKING MUTATIONS
  // ==================================================
  
  SET_USAGE(state, usageData) {
    state.usage.current = {
      ...usageData,
      lastUpdated: new Date().toISOString()
    };
    state.system.lastUpdate = Date.now();
  },
  
  INCREMENT_USAGE(state, { messages = 0, images = 0 }) {
    state.usage.current.messages += messages;
    state.usage.current.images += images;
    state.usage.current.lastUpdated = new Date().toISOString();
    state.system.lastUpdate = Date.now();
    
    triggerGlobalEvent('usageUpdated', {
      usage: { ...state.usage.current },
      limits: getCurrentLimits(state)
    });
  },
  
  RESET_USAGE(state) {
    state.usage.current = {
      messages: 0,
      images: 0,
      lastUpdated: new Date().toISOString()
    };
    state.system.lastUpdate = Date.now();
    
    console.log('🔄 Monthly usage reset');
  },
  
  SET_USAGE_LIMITS(state, limits) {
    state.usage.limits = { ...state.usage.limits, ...limits };
  },
  
  // ==================================================
  // FEATURE ACCESS MUTATIONS
  // ==================================================
  
  UPDATE_FEATURES(state, features = {}) {
    if (Object.keys(features).length > 0) {
      state.features = { ...state.features, ...features };
    } else {
      updateFeatureMatrix(state);
    }
    
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    triggerGlobalEvent('featuresUpdated', {
      features: { ...state.features },
      userStatus: state.userStatus
    });
  },
  
  // ==================================================
  // PROMOCODE MUTATIONS
  // ==================================================
  
  ADD_PROMOCODE(state, promocodeData) {
    const promocode = {
      ...promocodeData,
      appliedAt: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    state.promocodes.applied.unshift(promocode);
    
    // Keep only last 10
    if (state.promocodes.applied.length > 10) {
      state.promocodes.applied = state.promocodes.applied.slice(0, 10);
    }
    
    localStorage.setItem('appliedPromocodes', JSON.stringify(state.promocodes.applied));
    
    console.log('🎟️ Promocode added:', promocode.code);
    
    triggerGlobalEvent('promocodeApplied', {
      promocode,
      newStatus: promocodeData.plan
    });
  },
  
  // ==================================================
  // PAYMENT MUTATIONS
  // ==================================================
  
  ADD_PAYMENT(state, payment) {
    state.payments.history.unshift(payment);
    
    // Keep only last 20 payments
    if (state.payments.history.length > 20) {
      state.payments.history = state.payments.history.slice(0, 20);
    }
    
    state.system.lastUpdate = Date.now();
  },
  
  SET_PENDING_PAYMENTS(state, pendingIds) {
    state.payments.pending = pendingIds;
    state.payments.lastCheck = Date.now();
  },
  
  // ==================================================
  // PREFERENCES MUTATIONS
  // ==================================================
  
  SET_PREFERENCES(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
  },
  
  UPDATE_PREFERENCE(state, { key, value }) {
    state.preferences[key] = value;
    localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
  },
  
  // ==================================================
  // SYSTEM MUTATIONS
  // ==================================================
  
  SET_LOADING(state, { type, loading }) {
    state.system.loading[type] = loading;
  },
  
  SET_INITIALIZED(state, initialized = true) {
    state.system.initialized = initialized;
    state.system.lastUpdate = Date.now();
    
    if (initialized) {
      console.log('✅ User store initialized');
      triggerGlobalEvent('storeInitialized', {
        userStatus: state.userStatus,
        features: { ...state.features }
      });
    }
  },
  
  FORCE_UPDATE(state) {
    state.system.forceUpdateCounter++;
    state.system.lastUpdate = Date.now();
    
    triggerGlobalEvent('forceUpdate', {
      counter: state.system.forceUpdateCounter,
      timestamp: Date.now()
    });
    
    console.log('🔄 Forced global update:', state.system.forceUpdateCounter);
  },

  // ✅ NEW: Enhanced force component updates mutation
  forceGlobalUpdate(state) {
    // Trigger a dummy reactive update
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // ✅ Force reactivity in multiple ways
    if (typeof window !== 'undefined') {
      // Method 1: Vue nextTick
      if (window.Vue?.nextTick) {
        window.Vue.nextTick(() => {
          console.log('🔄 Vue nextTick triggered for global update');
        });
      }
      
      // Method 2: Custom DOM event for manual component updates
      const forceUpdateEvent = new CustomEvent('forceComponentUpdate', {
        detail: { 
          counter: state.system.forceUpdateCounter,
          timestamp: Date.now(),
          reason: 'manual_force_update'
        }
      });
      window.dispatchEvent(forceUpdateEvent);
      
      // Method 3: Event bus emission
      if (window.eventBus?.emit) {
        window.eventBus.emit('forceGlobalUpdate', {
          counter: state.system.forceUpdateCounter,
          timestamp: Date.now()
        });
      }
      
      // Method 4: Direct component force update (if app instance available)
      if (window.$app?.$forceUpdate) {
        window.$app.$forceUpdate();
      }
    }
    
    console.log('🔄 Forced global component update triggered:', state.system.forceUpdateCounter);
  },

  // ✅ NEW: Enhanced feature access update with reactivity
  updateAllFeatureAccess(state) {
    updateFeatureMatrix(state);
    state.system.forceUpdateCounter++;
    state.system.lastUpdate = Date.now();
    
    // ✅ Trigger reactivity for feature changes
    if (typeof window !== 'undefined') {
      const featureUpdateEvent = new CustomEvent('featureAccessUpdated', {
        detail: { 
          features: { ...state.features }, 
          userStatus: state.userStatus,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(featureUpdateEvent);
      
      // Vue reactivity trigger
      if (window.Vue?.nextTick) {
        window.Vue.nextTick(() => {
          console.log('🔧 Feature access reactivity update completed');
        });
      }
    }
    
    triggerGlobalEvent('featuresUpdated', {
      features: { ...state.features },
      userStatus: state.userStatus,
      timestamp: Date.now()
    });
    
    console.log('🔧 All feature access updated with reactivity');
  },
};

// ✅ HELPER FUNCTIONS
const updateFeatureMatrix = (state) => {
  const featureMatrix = {
    free: {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false,
      export_progress: false
    },
    start: {
      vocabulary: true,
      analytics: false,
      unlimited_lessons: false,
      priority_support: true,
      custom_courses: false,
      offline_mode: true,
      export_progress: false
    },
    pro: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true
    },
    premium: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true
    }
  };
  
  state.features = { ...featureMatrix[state.userStatus] || featureMatrix.free };
  console.log(`🔧 Features updated for ${state.userStatus}:`, state.features);
};

const getCurrentLimits = (state) => {
  return state.usage.limits[state.userStatus] || state.usage.limits.free;
};

const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window !== 'undefined') {
    // Custom DOM event
    const event = new CustomEvent(eventName, { detail: data });
    window.dispatchEvent(event);
    
    // Event bus (if available)
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, data);
    }
    
    // Vue event bus (if available)
    if (window.Vue?.$bus?.$emit) {
      window.Vue.$bus.$emit(eventName, data);
    }
  }
};

const getUserToken = async () => {
  try {
    const { auth } = await import('@/firebase');
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch (error) {
    console.warn('⚠️ Could not get user token:', error);
    return null;
  }
};

// ✅ ACTION HANDLERS
const actions = {
  // ==================================================
  // INITIALIZATION ACTIONS
  // ==================================================
  
  async initialize({ commit, dispatch, state }) {
    if (state.system.initialized) {
      console.log('ℹ️ Store already initialized');
      return { success: true };
    }
    
    try {
      console.log('🚀 Initializing user store...');
      
      // Load from localStorage
      const storedData = {
        user: localStorage.getItem('currentUser'),
        status: localStorage.getItem('userStatus'),
        preferences: localStorage.getItem('userPreferences'),
        promocodes: localStorage.getItem('appliedPromocodes')
      };
      
      // Restore user data
      if (storedData.user) {
        try {
          const userData = JSON.parse(storedData.user);
          commit('SET_USER', userData);
        } catch (err) {
          console.warn('⚠️ Invalid stored user data');
          localStorage.removeItem('currentUser');
        }
      }
      
      // Restore status
      if (storedData.status) {
        commit('SET_USER_STATUS', storedData.status);
      }
      
      // Restore preferences
      if (storedData.preferences) {
        try {
          const preferences = JSON.parse(storedData.preferences);
          commit('SET_PREFERENCES', preferences);
        } catch (err) {
          console.warn('⚠️ Invalid stored preferences');
        }
      }
      
      // Restore promocodes
      if (storedData.promocodes) {
        try {
          const promocodes = JSON.parse(storedData.promocodes);
          state.promocodes.applied = promocodes;
        } catch (err) {
          console.warn('⚠️ Invalid stored promocodes');
        }
      }
      
      // Load remote data if user exists
      const userId = state.currentUser?.firebaseId || localStorage.getItem('userId');
      if (userId) {
        await Promise.allSettled([
          dispatch('loadUserStatus'),
          dispatch('loadUsage'),
          dispatch('checkMonthlyReset'),
          dispatch('checkPendingPayments')
        ]);
      }
      
      commit('SET_INITIALIZED', true);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      commit('SET_INITIALIZED', false);
      return { success: false, error: error.message };
    }
  },
  
  // ==================================================
  // USER MANAGEMENT ACTIONS - COMPLETELY FIXED FOR SERVER-SIDE
  // ==================================================
  
  async saveUser({ commit, dispatch, state }, { userData, token }) {
    // ✅ SAFETY CHECK: Ensure we always return a valid object
    if (!userData || !token) {
      console.error('❌ Missing userData or token in saveUser');
      return { 
        success: false, 
        error: 'Missing user data or authentication token',
        user: null 
      };
    }

    try {
      console.log('💾 Saving user to backend server...');
      commit('SET_LOADING', { type: 'saving', loading: true });
      
      // Validate API base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        console.error('❌ VITE_API_BASE_URL not configured');
        return { 
          success: false, 
          error: 'API base URL not configured - check environment variables',
          user: null 
        };
      }
      
      // ✅ CORRECT: Use the existing API infrastructure from api.js
      console.log('📤 Loading API module...');
      
      let api;
      try {
        const apiModule = await import('@/api');
        api = apiModule.default;
        
        // Check if api module loaded correctly
        if (!api || typeof api.post !== 'function') {
          throw new Error('API module not properly loaded');
        }
        
        console.log('✅ API module loaded successfully');
      } catch (apiImportError) {
        console.error('❌ Failed to import API module:', apiImportError);
        return { 
          success: false, 
          error: 'Failed to load API module - check your api.js file',
          user: null 
        };
      }
      
      // ✅ PREPARE SERVER PAYLOAD
      const payload = {
        // Firebase user data
        firebaseUserId: userData.uid,
        email: userData.email,
        name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'User',
        displayName: userData.displayName,
        emailVerified: userData.emailVerified,
        photoURL: userData.photoURL,
        
        // Default subscription
        subscriptionPlan: 'free',
        
        // Additional metadata
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      console.log('📤 Sending user data to server:', { 
        url: '/users/save',
        payload: { ...payload, firebaseUserId: '[HIDDEN]' }
      });
      
      // ✅ USE CONFIGURED API INSTANCE WITH ALL INTERCEPTORS
      let response;
      try {
        response = await api.post('/users/save', payload, {
          timeout: 15000,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 Server response received:', {
          status: response.status,
          statusText: response.statusText,
          hasData: !!response.data
        });
        
      } catch (networkError) {
        console.error('❌ Network error during user save:', networkError);
        
        // Handle specific network errors
        let userFriendlyError;
        if (networkError.code === 'ECONNABORTED') {
          userFriendlyError = 'Request timed out. Please check your connection and try again.';
        } else if (networkError.message === 'Network Error') {
          userFriendlyError = 'Network error. Please check your internet connection.';
        } else if (networkError.response) {
          // Server responded with error
          const status = networkError.response.status;
          const serverError = networkError.response.data;
          
          switch (status) {
            case 400:
              userFriendlyError = serverError?.message || serverError?.error || 'Invalid user data provided';
              break;
            case 401:
              userFriendlyError = 'Authentication failed. Please log in again.';
              break;
            case 403:
              userFriendlyError = 'Access denied. Please check your permissions.';
              break;
            case 404:
              userFriendlyError = 'User service not found. Please contact support.';
              break;
            case 409:
              userFriendlyError = serverError?.message || serverError?.error || 'User already exists with different data';
              break;
            case 429:
              userFriendlyError = 'Too many requests. Please wait and try again.';
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              userFriendlyError = 'Server error. Please try again later.';
              break;
            default:
              userFriendlyError = serverError?.message || serverError?.error || `Server error (${status})`;
          }
        } else {
          userFriendlyError = 'Unable to connect to server. Please try again.';
        }
        
        return { 
          success: false, 
          error: userFriendlyError,
          user: null,
          statusCode: networkError.response?.status,
          originalError: networkError.message,
          timestamp: new Date().toISOString()
        };
      }
      
      // ✅ HANDLE SERVER RESPONSE
      const responseData = response.data;
      
      if (!responseData) {
        console.error('❌ Empty response from server');
        return { 
          success: false, 
          error: 'Empty response from server',
          user: null 
        };
      }
      
      console.log('📊 Processing server response:', {
        hasSuccess: 'success' in responseData,
        hasData: 'data' in responseData,
        hasUser: 'user' in responseData,
        responseKeys: Object.keys(responseData)
      });
      
      // ✅ HANDLE DIFFERENT RESPONSE STRUCTURES YOUR BACKEND MIGHT RETURN
      let savedUser;
      if (responseData.success === true && responseData.data) {
        savedUser = responseData.data;
        console.log('✅ Using success+data response structure');
      } else if (responseData.success === true && responseData.user) {
        savedUser = responseData.user;
        console.log('✅ Using success+user response structure');
      } else if (responseData.user) {
        savedUser = responseData.user;
        console.log('✅ Using direct user response structure');
      } else if (responseData._id || responseData.firebaseId) {
        savedUser = responseData;
        console.log('✅ Using direct object response structure');
      } else if (responseData.success === false) {
        console.error('❌ Server returned success: false');
        return { 
          success: false, 
          error: responseData.message || responseData.error || 'Server returned failure status',
          user: null 
        };
      } else {
        console.error('❌ Unknown server response structure:', responseData);
        return { 
          success: false, 
          error: 'Server returned unrecognized response format',
          user: null,
          rawResponse: responseData
        };
      }
      
      // ✅ VALIDATE SERVER RESPONSE
      if (!savedUser || typeof savedUser !== 'object') {
        console.error('❌ Invalid user data from server:', savedUser);
        return { 
          success: false, 
          error: 'Server returned invalid user data',
          user: null 
        };
      }
      
      // ✅ ENSURE USER HAS REQUIRED FIELDS
      const completeUser = {
        // Server data takes precedence
        ...savedUser,
        
        // Ensure essential fields are present
        firebaseId: savedUser.firebaseId || savedUser._id || userData.uid,
        _id: savedUser._id || savedUser.firebaseId,
        email: savedUser.email || userData.email,
        name: savedUser.name || userData.displayName || userData.email?.split('@')[0] || 'User',
        subscriptionPlan: savedUser.subscriptionPlan || 'free',
        
        // Update timestamps
        lastLoginAt: new Date().toISOString(),
        updatedAt: savedUser.updatedAt || new Date().toISOString()
      };
      
      console.log('✅ User saved successfully to server:', {
        id: completeUser._id,
        email: completeUser.email,
        plan: completeUser.subscriptionPlan,
        firebaseId: completeUser.firebaseId
      });
      
      // ✅ UPDATE LOCAL STORE WITH SERVER DATA
      commit('SET_USER', completeUser);
      commit('SET_USER_STATUS', completeUser.subscriptionPlan || 'free');
      
      // Store user ID for future API calls
      const userId = completeUser.firebaseId || completeUser._id;
      if (userId) {
        localStorage.setItem('userId', userId);
        localStorage.setItem('firebaseUserId', userId);
      }
      
      // ✅ LOAD ADDITIONAL USER DATA FROM SERVER (parallel, non-blocking)
      console.log('📊 Loading additional user data from server...');
      
      const additionalDataPromises = [
        dispatch('loadUserStatus'),
        dispatch('loadUsage'), 
        dispatch('checkMonthlyReset'),
        dispatch('checkPendingPayments')
      ];
      
      // Don't await - let them load in background
      Promise.allSettled(additionalDataPromises).then(results => {
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
          console.warn('⚠️ Some additional data loading failed:', failures.map(f => f.reason));
        } else {
          console.log('✅ All additional user data loaded from server');
        }
      });
      
      return { 
        success: true, 
        user: completeUser,
        message: 'User saved successfully to server'
      };
      
    } catch (error) {
      console.error('❌ Unexpected error while saving user:', error);
      
      // ✅ COMPREHENSIVE ERROR CATEGORIZATION
      let userFriendlyError;
      if (error.message?.includes('API module')) {
        userFriendlyError = 'Application configuration error. Please refresh the page.';
      } else if (error.message?.includes('environment')) {
        userFriendlyError = 'Application not properly configured. Please contact support.';
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        userFriendlyError = 'Network connection failed. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        userFriendlyError = 'Request timed out. Please try again.';
      } else if (error.message?.includes('JSON')) {
        userFriendlyError = 'Server returned invalid response. Please try again.';
      } else {
        userFriendlyError = 'An unexpected error occurred while saving user data.';
      }
      
      console.error('❌ Detailed error info:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return { 
        success: false, 
        error: userFriendlyError,
        user: null,
        originalError: error.message,
        timestamp: new Date().toISOString()
      };
      
    } finally {
      commit('SET_LOADING', { type: 'saving', loading: false });
    }
  },
  
  async loadUserStatus({ commit, state }) {
    try {
      commit('SET_LOADING', { type: 'status', loading: true });
      
      const userId = getUserId(state);
      if (!userId) {
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: 'No user ID' };
      }
      
      console.log('🔍 Loading user status from server for:', userId);
      
      // ✅ USE API MODULE FOR CONSISTENCY
      const { getUserStatus } = await import('@/api');
      const result = await getUserStatus(userId);
      
      if (result.success) {
        const status = result.status || result.data?.subscriptionPlan || 'free';
        
        // Update status and subscription
        commit('SET_USER_STATUS', status);
        
        if (result.data?.subscriptionDetails) {
          commit('UPDATE_SUBSCRIPTION', {
            ...result.data.subscriptionDetails,
            plan: status,
            status: status !== 'free' ? 'active' : 'inactive'
          });
        }
        
        console.log('✅ User status loaded from server:', status);
        return { success: true, status };
      } else {
        console.warn('⚠️ Failed to load user status from server:', result.error);
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ Failed to load user status:', error);
      commit('SET_USER_STATUS', 'free');
      return { success: false, error: error.message };
      
    } finally {
      commit('SET_LOADING', { type: 'status', loading: false });
    }
  },
  
  // ==================================================
  // USAGE MANAGEMENT ACTIONS
  // ==================================================
  
  async loadUsage({ commit, state }) {
    try {
      commit('SET_LOADING', { type: 'usage', loading: true });
      
      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'No user ID' };
      }
      
      console.log('📊 Loading usage data from server...');
      
      const usageInfo = await getUserUsage();
      
      if (usageInfo.success) {
        commit('SET_USAGE', usageInfo.usage);
        
        if (usageInfo.plan && usageInfo.plan !== state.userStatus) {
          commit('SET_USER_STATUS', usageInfo.plan);
        }
        
        if (usageInfo.limits) {
          commit('SET_USAGE_LIMITS', { [usageInfo.plan]: usageInfo.limits });
        }
        
        console.log('✅ Usage data loaded from server');
        return { success: true, usage: usageInfo.usage };
      }
      
      return { success: false, error: usageInfo.error };
      
    } catch (error) {
      console.error('❌ Failed to load usage:', error);
      return { success: false, error: error.message };
      
    } finally {
      commit('SET_LOADING', { type: 'usage', loading: false });
    }
  },
  
  async updateUsage({ commit }, { messages = 0, images = 0 }) {
    commit('INCREMENT_USAGE', { messages, images });
    return { success: true };
  },
  
  async checkUsageLimits({ state }, { action = 'message', hasImage = false }) {
    const limits = getCurrentLimits(state);
    const usage = state.usage.current;
    
    // Check message limit
    if (action === 'message' && limits.messages !== -1 && usage.messages >= limits.messages) {
      return {
        allowed: false,
        reason: 'message_limit_exceeded',
        message: `Достигнут лимит сообщений (${limits.messages}) для плана "${state.userStatus}"`
      };
    }
    
    // Check image limit
    if (hasImage && limits.images !== -1 && usage.images >= limits.images) {
      return {
        allowed: false,
        reason: 'image_limit_exceeded',
        message: `Достигнут лимит изображений (${limits.images}) для плана "${state.userStatus}"`
      };
    }
    
    return {
      allowed: true,
      remaining: {
        messages: limits.messages === -1 ? '∞' : Math.max(0, limits.messages - usage.messages),
        images: limits.images === -1 ? '∞' : Math.max(0, limits.images - usage.images)
      }
    };
  },
  
  async checkMonthlyReset({ commit, dispatch, state }) {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
      
      const userId = getUserId(state);
      const lastResetKey = `lastMonthlyReset_${userId}`;
      const lastReset = localStorage.getItem(lastResetKey);
      
      if (!lastReset || lastReset !== currentMonth) {
        console.log('🔄 Monthly reset triggered');
        
        commit('RESET_USAGE');
        localStorage.setItem(lastResetKey, currentMonth);
        
        // Try backend reset
        try {
          await resetMonthlyUsage();
        } catch (err) {
          console.warn('⚠️ Backend reset warning:', err.message);
        }
        
        // Reload usage
        await dispatch('loadUsage');
        
        return { success: true, reset: true };
      }
      
      return { success: true, reset: false };
      
    } catch (error) {
      console.error('❌ Monthly reset check failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==================================================
  // SUBSCRIPTION ACTIONS
  // ==================================================
  
  async updateSubscription({ commit, dispatch }, { plan, source = 'payment', details = {} }) {
    try {
      const subscriptionData = {
        plan,
        status: plan !== 'free' ? 'active' : 'inactive',
        source,
        startDate: new Date().toISOString(),
        details
      };
      
      commit('SET_USER_STATUS', plan);
      commit('UPDATE_SUBSCRIPTION', subscriptionData);
      
      // Reload usage with new limits
      await dispatch('loadUsage');
      
      console.log('✅ Subscription updated:', plan);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to update subscription:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==================================================
  // PROMOCODE ACTIONS
  // ==================================================
  
  async applyPromocode({ commit, state, dispatch }, { promoCode, plan }) {
    try {
      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'Пользователь не найден' };
      }
      
      console.log('🎟️ Applying promocode to server:', { promoCode, plan });
      
      const token = await getUserToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/payments/promo-code`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          plan,
          promoCode: promoCode.trim().toUpperCase()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const oldStatus = state.userStatus;
        
        // Update subscription
        await dispatch('updateSubscription', {
          plan,
          source: 'promocode',
          details: {
            promocode: promoCode.trim().toUpperCase(),
            appliedAt: new Date().toISOString(),
            ...result.data?.subscriptionDetails
          }
        });
        
        // Track promocode
        commit('ADD_PROMOCODE', {
          code: promoCode.trim().toUpperCase(),
          plan,
          oldPlan: oldStatus
        });
        
        // Force update
        commit('FORCE_UPDATE');
        
        console.log(`✅ Promocode applied: ${oldStatus} → ${plan}`);
        
        return {
          success: true,
          message: `Промокод успешно применён! Подписка "${plan.toUpperCase()}" активирована.`,
          oldPlan: oldStatus,
          newPlan: plan
        };
      }
      
      return { success: false, error: result.error || 'Не удалось применить промокод' };
      
    } catch (error) {
      console.error('❌ Promocode application failed:', error);
      
      const errorMessages = {
        400: 'Неверный промокод или данные',
        404: 'Промокод не найден',
        403: 'Промокод уже использован или недоступен'
      };
      
      return {
        success: false,
        error: errorMessages[error.status] || 'Произошла ошибка при применении промокода'
      };
    }
  },
  
  async validatePromocode({ state }, promoCode) {
    try {
      if (!promoCode || promoCode.length <= 3) {
        return { valid: false, error: 'Промокод слишком короткий' };
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(
        `${baseUrl}/api/promocodes/validate/${promoCode.trim().toUpperCase()}`
      );
      const result = await response.json();
      
      if (result.success && result.valid) {
        return {
          valid: true,
          data: result.data,
          message: `Промокод действителен! Предоставляет: ${result.data.grantsPlan?.toUpperCase()} план`
        };
      }
      
      return { valid: false, error: result.error || 'Промокод недействителен' };
      
    } catch (error) {
      console.error('❌ Promocode validation failed:', error);
      
      const errorMessages = {
        404: 'Промокод не найден',
        400: 'Неверный формат промокода'
      };
      
      return {
        valid: false,
        error: errorMessages[error.status] || 'Ошибка проверки промокода'
      };
    }
  },
  
  // ==================================================
  // PAYMENT ACTIONS
  // ==================================================
  
  async checkPendingPayments({ commit, state, dispatch }) {
    try {
      commit('SET_LOADING', { type: 'payments', loading: true });
      
      const userId = getUserId(state);
      if (!userId) return { success: false, error: 'No user ID' };
      
      // Rate limiting
      const now = Date.now();
      const lastCheck = state.payments.lastCheck;
      if (lastCheck && (now - lastCheck) < 300000) { // 5 minutes
        return { success: true, message: 'Recently checked' };
      }
      
      console.log('🔍 Checking pending payments on server...');
      
      const pendingIds = JSON.parse(localStorage.getItem(`pendingPayments_${userId}`) || '[]');
      let statusChanged = false;
      
      for (const transactionId of pendingIds) {
        try {
          const result = await checkPaymentStatus(transactionId, userId);
          
          if (result.success && result.transaction?.state === 2) {
            console.log('✅ Payment completed:', transactionId);
            
            // Determine plan
            let newStatus = 'free';
            if (result.transaction.amount === 260000) newStatus = 'start';
            else if (result.transaction.amount === 455000) newStatus = 'pro';
            
            if (newStatus !== 'free' && newStatus !== state.userStatus) {
              await dispatch('updateSubscription', {
                plan: newStatus,
                source: 'payment',
                details: { transactionId, amount: result.transaction.amount }
              });
              statusChanged = true;
            }
            
            // Remove from pending
            const updatedPending = pendingIds.filter(id => id !== transactionId);
            localStorage.setItem(`pendingPayments_${userId}`, JSON.stringify(updatedPending));
            
            // Add to history
            commit('ADD_PAYMENT', {
              id: transactionId,
              amount: result.transaction.amount,
              status: 'completed',
              timestamp: result.transaction.perform_time || Date.now()
            });
          }
        } catch (err) {
          console.warn(`⚠️ Failed to check transaction ${transactionId}:`, err.message);
        }
      }
      
      commit('SET_PENDING_PAYMENTS', pendingIds);
      
      return { success: true, statusChanged, checkedTransactions: pendingIds.length };
      
    } catch (error) {
      console.error('❌ Failed to check pending payments:', error);
      return { success: false, error: error.message };
      
    } finally {
      commit('SET_LOADING', { type: 'payments', loading: false });
    }
  },
  
  async addPendingPayment({ state }, { transactionId, amount, plan }) {
    try {
      const userId = getUserId(state);
      if (!userId || !transactionId) {
        return { success: false, error: 'Missing required data' };
      }
      
      const pendingKey = `pendingPayments_${userId}`;
      const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
      
      if (!pending.includes(transactionId)) {
        pending.push(transactionId);
        localStorage.setItem(pendingKey, JSON.stringify(pending));
        console.log('📝 Added pending payment:', transactionId);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to add pending payment:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==================================================
  // UTILITY ACTIONS
  // ==================================================
  
  async updatePreferences({ commit }, preferences) {
    commit('SET_PREFERENCES', preferences);
    return { success: true };
  },
  
  async forceUpdate({ commit }) {
    commit('FORCE_UPDATE');
    commit('UPDATE_FEATURES');
    return { success: true };
  },
  
  async logout({ commit }) {
    try {
      console.log('👋 Logging out user...');
      
      commit('CLEAR_USER');
      
      // Clear all localStorage
      const keysToRemove = [
        'userId', 'firebaseUserId', 'currentUser', 'token', 
        'userStatus', 'subscriptionDetails', 'subscriptionExpiry',
        'userPreferences', 'appliedPromocodes'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear pending payments
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pendingPayments_') || key.startsWith('lastMonthlyReset_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Logout complete');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ✅ HELPER FUNCTION FOR USER ID
const getUserId = (state) => {
  return state.currentUser?.firebaseId ||
         state.currentUser?._id ||
         localStorage.getItem('userId') ||
         localStorage.getItem('firebaseUserId');
};

// ✅ GETTER DEFINITIONS
const getters = {
  // ==================================================
  // BASIC USER GETTERS
  // ==================================================
  
  isAuthenticated: (state) => !!state.currentUser,
  getUser: (state) => state.currentUser,
  getUserId: (state) => getUserId(state),
  userName: (state) => state.currentUser?.name || state.currentUser?.displayName || 'Пользователь',
  userEmail: (state) => state.currentUser?.email || '',
  
  // ==================================================
  // SUBSCRIPTION GETTERS
  // ==================================================
  
  userStatus: (state) => state.userStatus,
  subscription: (state) => state.subscription,
  subscriptionDetails: (state) => state.subscription,
  
  // Status checks
  isPremiumUser: (state) => ['premium', 'start', 'pro'].includes(state.userStatus),
  isStartUser: (state) => ['start', 'pro', 'premium'].includes(state.userStatus),
  isProUser: (state) => ['pro', 'premium'].includes(state.userStatus),
  isFreeUser: (state) => state.userStatus === 'free',
  hasActiveSubscription: (state) => state.subscription.status === 'active',
  
  // Subscription metadata
  subscriptionSource: (state) => state.subscription.source || 'free',
  hasPromocodeSubscription: (state) => state.subscription.source === 'promocode',
  subscriptionExpiry: (state) => state.subscription.expiryDate,
  
  // Status text
  statusText: (state) => {
    const statusMap = {
      free: 'Бесплатный',
      start: 'Start',
      pro: 'Pro', 
      premium: 'Premium'
    };
    return statusMap[state.userStatus] || 'Неизвестно';
  },
  
  // ==================================================
  // FEATURE ACCESS GETTERS
  // ==================================================
  
  features: (state) => state.features,
  hasVocabularyAccess: (state) => state.features.vocabulary,
  hasAdvancedFeatures: (state) => state.features.analytics,
  hasUnlimitedLessons: (state) => state.features.unlimited_lessons,
  hasPrioritySupport: (state) => state.features.priority_support,
  hasCustomCourses: (state) => state.features.custom_courses,
  hasOfflineMode: (state) => state.features.offline_mode,
  hasExportProgress: (state) => state.features.export_progress,
  
  // Feature checker function
  hasFeatureAccess: (state) => (feature) => {
    return state.features[feature] || false;
  },
  
  // Content access checker
  canAccessContent: (state) => (contentType = 'basic') => {
    const accessMap = {
      basic: ['free', 'start', 'pro', 'premium'],
      premium: ['start', 'pro', 'premium'],
      pro: ['pro', 'premium'],
      admin: ['premium']
    };
    return accessMap[contentType]?.includes(state.userStatus) || false;
  },
  
  // ==================================================
  // USAGE GETTERS
  // ==================================================
  
  currentUsage: (state) => state.usage.current,
  usageLimits: (state) => state.usage.limits[state.userStatus] || state.usage.limits.free,
  usageHistory: (state) => state.usage.history,
  
  // Remaining usage
  remainingMessages: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return '∞';
    return Math.max(0, limits.messages - state.usage.current.messages);
  },
  
  remainingImages: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return '∞';
    return Math.max(0, limits.images - state.usage.current.images);
  },
  
  // Usage percentages
  messageUsagePercentage: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return 0;
    return Math.min(100, Math.round((state.usage.current.messages / limits.messages) * 100));
  },
  
  imageUsagePercentage: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return 0;
    return Math.min(100, Math.round((state.usage.current.images / limits.images) * 100));
  },
  
  // Limit status
  isMessageLimitReached: (state, getters) => {
    const limits = getters.usageLimits;
    return limits.messages !== -1 && state.usage.current.messages >= limits.messages;
  },
  
  isImageLimitReached: (state, getters) => {
    const limits = getters.usageLimits;
    return limits.images !== -1 && state.usage.current.images >= limits.images;
  },
  
  isNearMessageLimit: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.messages === -1) return false;
    return state.usage.current.messages >= (limits.messages * 0.8);
  },
  
  isNearImageLimit: (state, getters) => {
    const limits = getters.usageLimits;
    if (limits.images === -1) return false;
    return state.usage.current.images >= (limits.images * 0.8);
  },
  
  // Usage summary
  usageSummary: (state, getters) => ({
    plan: state.userStatus,
    planDisplayName: getters.statusText,
    messages: {
      used: state.usage.current.messages,
      limit: getters.usageLimits.messages,
      remaining: getters.remainingMessages,
      percentage: getters.messageUsagePercentage,
      isNearLimit: getters.isNearMessageLimit,
      isLimitReached: getters.isMessageLimitReached
    },
    images: {
      used: state.usage.current.images,
      limit: getters.usageLimits.images,
      remaining: getters.remainingImages,
      percentage: getters.imageUsagePercentage,
      isNearLimit: getters.isNearImageLimit,
      isLimitReached: getters.isImageLimitReached
    },
    lastUpdated: state.usage.current.lastUpdated
  }),
  
  // ==================================================
  // PROMOCODE GETTERS
  // ==================================================
  
  appliedPromocodes: (state) => state.promocodes.applied,
  hasAppliedPromocodes: (state) => state.promocodes.applied.length > 0,
  lastAppliedPromocode: (state) => 
    state.promocodes.applied.length > 0 ? state.promocodes.applied[0] : null,
  lastPromocodeCheck: (state) => state.promocodes.lastCheck,
  
  // ==================================================
  // PAYMENT GETTERS
  // ==================================================
  
  paymentHistory: (state) => state.payments.history,
  pendingPayments: (state) => state.payments.pending,
  lastPaymentCheck: (state) => state.payments.lastCheck,
  hasRecentPayments: (state) => 
    state.payments.history.some(p => p.status === 'completed'),
  
  // ==================================================
  // SYSTEM GETTERS
  // ==================================================
  
  isInitialized: (state) => state.system.initialized,
  isLoading: (state) => (type) => state.system.loading[type] || false,
  isAnyLoading: (state) => Object.values(state.system.loading).some(Boolean),
  lastUpdate: (state) => state.system.lastUpdate,
  forceUpdateCounter: (state) => state.system.forceUpdateCounter,
  
  // ==================================================
  // PREFERENCES GETTERS
  // ==================================================
  
  userPreferences: (state) => state.preferences,
  language: (state) => state.preferences.language,
  theme: (state) => state.preferences.theme,
  notificationsEnabled: (state) => state.preferences.notifications,
  
  // ==================================================
  // SUBSCRIPTION EXPIRY GETTERS
  // ==================================================
  
  isSubscriptionExpiringSoon: (state) => {
    if (!state.subscription.expiryDate || state.userStatus === 'free') return false;
    
    const now = new Date();
    const expiry = new Date(state.subscription.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  },
  
  daysUntilExpiry: (state) => {
    if (!state.subscription.expiryDate || state.userStatus === 'free') return null;
    
    const now = new Date();
    const expiry = new Date(state.subscription.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysUntilExpiry);
  },
  
  // ==================================================
  // UPGRADE RECOMMENDATIONS
  // ==================================================
  
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
  }
};

// ✅ EXPORT STORE MODULE
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};