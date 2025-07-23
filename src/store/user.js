// src/store/user.js - COMPLETELY FIXED WITH BULLETPROOF ERROR HANDLING
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
    status: 'inactive',
    source: null,
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
  
  // Promocodes tracking - ✅ ENSURE NEVER NULL/UNDEFINED
  promocodes: {
    applied: [], // Always array, never null
    lastCheck: null
  },
  
  // Payment history - ✅ ENSURE NEVER NULL/UNDEFINED
  payments: {
    history: [], // Always array, never null
    pending: [], // Always array, never null
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

// ✅ MUTATION HANDLERS WITH BULLETPROOF SAFETY
const mutations = {
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
    
    // ✅ BULLETPROOF: Ensure arrays are always arrays
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
  
  SET_USER_STATUS(state, status) {
    const oldStatus = state.userStatus;
    state.userStatus = status || 'free'; // ✅ BULLETPROOF: Never allow null/undefined
    state.subscription.plan = state.userStatus;
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // Update feature access
    updateFeatureMatrix(state);
    
    // Persist to localStorage
    localStorage.setItem('userStatus', state.userStatus);
    
    console.log(`🔄 Status updated: ${oldStatus} → ${state.userStatus}`);
    
    // Trigger global events
    triggerGlobalEvent('userStatusChanged', {
      oldStatus,
      newStatus: state.userStatus,
      timestamp: Date.now(),
      features: { ...state.features }
    });
  },

  setUserStatus(state, status) {
    const oldStatus = state.userStatus;
    
    // ✅ BULLETPROOF: Never allow null/undefined status
    state.userStatus = status || 'free';
    state.subscription.plan = state.userStatus;
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;
    
    // Store in localStorage
    localStorage.setItem('userStatus', state.userStatus);
    
    // Update feature access when status changes
    updateFeatureMatrix(state);
    
    console.log(`🔄 User status updated: ${oldStatus} → ${state.userStatus}`);
    
    // Trigger reactivity manually if needed
    if (typeof window !== 'undefined') {
      if (window.Vue?.nextTick) {
        window.Vue.nextTick(() => {
          console.log('🔄 Forced Vue reactivity update');
        });
      }
      
      const reactivityEvent = new CustomEvent('vueReactivityUpdate', {
        detail: { mutation: 'setUserStatus', oldStatus, newStatus: state.userStatus }
      });
      window.dispatchEvent(reactivityEvent);
    }
    
    triggerGlobalEvent('userStatusChanged', {
      oldStatus,
      newStatus: state.userStatus,
      timestamp: Date.now(),
      features: { ...state.features }
    });
  },
  
  // ✅ BULLETPROOF: Ensure promocodes array is always safe
  ADD_PROMOCODE(state, promocodeData) {
    // Ensure applied array exists and is an array
    if (!Array.isArray(state.promocodes.applied)) {
      state.promocodes.applied = [];
    }
    
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
  
  // ✅ BULLETPROOF: Ensure payment arrays are always safe
  ADD_PAYMENT(state, payment) {
    // Ensure history array exists and is an array
    if (!Array.isArray(state.payments.history)) {
      state.payments.history = [];
    }
    
    state.payments.history.unshift(payment);
    
    // Keep only last 20 payments
    if (state.payments.history.length > 20) {
      state.payments.history = state.payments.history.slice(0, 20);
    }
    
    state.system.lastUpdate = Date.now();
  },
  
  SET_PENDING_PAYMENTS(state, pendingIds) {
    // ✅ BULLETPROOF: Ensure pendingIds is always an array
    state.payments.pending = Array.isArray(pendingIds) ? pendingIds : [];
    state.payments.lastCheck = Date.now();
  },
  
  // ... other mutations remain the same but with safety checks
  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    state.subscription = { ...state.subscription, ...(subscriptionData || {}) };
    state.system.lastUpdate = Date.now();
    
    if (subscriptionData?.plan && subscriptionData.plan !== state.userStatus) {
      mutations.SET_USER_STATUS(state, subscriptionData.plan);
    }
    
    localStorage.setItem('subscriptionDetails', JSON.stringify(state.subscription));
  },
  
  SET_USAGE(state, usageData) {
    state.usage.current = {
      messages: 0,
      images: 0,
      lastUpdated: null,
      ...(usageData || {}),
      lastUpdated: new Date().toISOString()
    };
    state.system.lastUpdate = Date.now();
  },
  
  INCREMENT_USAGE(state, { messages = 0, images = 0 }) {
    // ✅ BULLETPROOF: Ensure usage object exists
    if (!state.usage.current) {
      state.usage.current = { messages: 0, images: 0, lastUpdated: null };
    }
    
    state.usage.current.messages = (state.usage.current.messages || 0) + messages;
    state.usage.current.images = (state.usage.current.images || 0) + images;
    state.usage.current.lastUpdated = new Date().toISOString();
    state.system.lastUpdate = Date.now();
    
    triggerGlobalEvent('usageUpdated', {
      usage: { ...state.usage.current },
      limits: getCurrentLimits(state)
    });
  },
  
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
  
  SET_LOADING(state, { type, loading }) {
    if (state.system.loading) {
      state.system.loading[type] = Boolean(loading);
    }
  },
  
  SET_INITIALIZED(state, initialized = true) {
    state.system.initialized = Boolean(initialized);
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
  }
};

// ✅ BULLETPROOF ACTION HANDLERS
const actions = {
  // ✅ COMPLETELY FIXED: saveUser action with bulletproof error handling
  async saveUser({ commit, dispatch, state }, { userData, token }) {
    console.log('💾 🔥 BULLETPROOF saveUser starting...', {
      hasUserData: !!userData,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    // ✅ BULLETPROOF: Always return a valid object
    const createErrorResult = (error, details = {}) => ({
      success: false,
      error: error || 'Unknown error occurred',
      user: null,
      timestamp: new Date().toISOString(),
      ...details
    });
    
    const createSuccessResult = (user, message = 'User saved successfully') => ({
      success: true,
      user: user || null,
      message,
      timestamp: new Date().toISOString()
    });
    
    // ✅ BULLETPROOF: Input validation
    if (!userData || typeof userData !== 'object') {
      console.error('❌ Invalid userData provided to saveUser');
      return createErrorResult('Missing or invalid user data', {
        hasUserData: !!userData,
        userDataType: typeof userData
      });
    }
    
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error('❌ Invalid token provided to saveUser');
      return createErrorResult('Missing or invalid authentication token', {
        hasToken: !!token,
        tokenType: typeof token,
        tokenLength: token?.length || 0
      });
    }

    try {
      console.log('🔄 Setting loading state...');
      commit('SET_LOADING', { type: 'saving', loading: true });
      
      // ✅ BULLETPROOF: Environment validation
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl || typeof baseUrl !== 'string') {
        console.error('❌ VITE_API_BASE_URL not configured properly');
        return createErrorResult('Application configuration error - API base URL not set', {
          hasBaseUrl: !!baseUrl,
          baseUrlType: typeof baseUrl
        });
      }
      
      console.log('📤 Loading API module...');
      
      // ✅ BULLETPROOF: API module loading
      let api;
      try {
        const apiModule = await import('@/api');
        api = apiModule.default || apiModule;
        
        if (!api || typeof api.post !== 'function') {
          throw new Error('API module does not have post method');
        }
        
        console.log('✅ API module loaded successfully');
      } catch (apiImportError) {
        console.error('❌ Failed to import API module:', apiImportError);
        return createErrorResult('Failed to load API module - application error', {
          isApiImportError: true,
          originalError: apiImportError.message
        });
      }
      
      // ✅ BULLETPROOF: Payload preparation
      const payload = {
        firebaseUserId: userData.uid || userData.firebaseId,
        email: userData.email || '',
        name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'User',
        displayName: userData.displayName || userData.name || '',
        emailVerified: Boolean(userData.emailVerified),
        photoURL: userData.photoURL || null,
        subscriptionPlan: userData.subscriptionPlan || 'free',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      // ✅ BULLETPROOF: Validate essential payload fields
      if (!payload.firebaseUserId || !payload.email) {
        console.error('❌ Missing essential user data:', {
          hasFirebaseId: !!payload.firebaseUserId,
          hasEmail: !!payload.email
        });
        return createErrorResult('Missing essential user information (ID or email)', {
          payload: { ...payload, firebaseUserId: '[PRESENT]' }
        });
      }
      
      console.log('📤 Sending user data to server...', {
        url: '/users/save',
        hasPayload: true,
        firebaseUserId: payload.firebaseUserId.substring(0, 8) + '...'
      });
      
      // ✅ BULLETPROOF: API call with comprehensive error handling
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
          status: response?.status,
          statusText: response?.statusText,
          hasData: !!response?.data,
          dataType: typeof response?.data
        });
        
      } catch (networkError) {
        console.error('❌ Network error during user save:', networkError);
        
        // ✅ BULLETPROOF: Detailed network error handling
        let userFriendlyError = 'Network error occurred';
        let statusCode = null;
        
        if (networkError.code === 'ECONNABORTED') {
          userFriendlyError = 'Request timed out. Please check your connection and try again.';
        } else if (networkError.message === 'Network Error') {
          userFriendlyError = 'Network error. Please check your internet connection.';
        } else if (networkError.response) {
          statusCode = networkError.response.status;
          const serverError = networkError.response.data || {};
          
          switch (statusCode) {
            case 400:
              userFriendlyError = serverError.message || serverError.error || 'Invalid user data provided';
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
              userFriendlyError = serverError.message || serverError.error || 'User already exists with different data';
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
              userFriendlyError = serverError.message || serverError.error || `Server error (${statusCode})`;
          }
        } else {
          userFriendlyError = 'Unable to connect to server. Please try again.';
        }
        
        return createErrorResult(userFriendlyError, {
          statusCode,
          isNetworkError: true,
          originalError: networkError.message
        });
      }
      
      // ✅ BULLETPROOF: Response validation
      if (!response || typeof response !== 'object') {
        console.error('❌ Invalid response object from server');
        return createErrorResult('Invalid response from server', {
          hasResponse: !!response,
          responseType: typeof response
        });
      }
      
      const responseData = response.data;
      if (!responseData || typeof responseData !== 'object') {
        console.error('❌ Empty or invalid response data from server');
        return createErrorResult('Empty or invalid response from server', {
          hasResponseData: !!responseData,
          responseDataType: typeof responseData
        });
      }
      
      console.log('📊 Processing server response...', {
        hasSuccess: 'success' in responseData,
        hasData: 'data' in responseData,
        hasUser: 'user' in responseData,
        responseKeys: Object.keys(responseData)
      });
      
      // ✅ BULLETPROOF: Handle different response structures
      let savedUser = null;
      
      if (responseData.success === true) {
        if (responseData.data && typeof responseData.data === 'object') {
          savedUser = responseData.data;
          console.log('✅ Using success+data response structure');
        } else if (responseData.user && typeof responseData.user === 'object') {
          savedUser = responseData.user;
          console.log('✅ Using success+user response structure');
        } else {
          console.error('❌ Success response but no valid user data');
          return createErrorResult('Server returned success but no user data', {
            responseStructure: Object.keys(responseData)
          });
        }
      } else if (responseData.user && typeof responseData.user === 'object') {
        savedUser = responseData.user;
        console.log('✅ Using direct user response structure');
      } else if ((responseData._id || responseData.firebaseId) && responseData.email) {
        savedUser = responseData;
        console.log('✅ Using direct object response structure');
      } else if (responseData.success === false) {
        console.error('❌ Server returned success: false');
        return createErrorResult(
          responseData.message || responseData.error || 'Server returned failure status',
          { serverResponse: responseData }
        );
      } else {
        console.error('❌ Unknown server response structure:', responseData);
        return createErrorResult('Server returned unrecognized response format', {
          rawResponse: responseData
        });
      }
      
      // ✅ BULLETPROOF: Validate saved user object
      if (!savedUser || typeof savedUser !== 'object') {
        console.error('❌ Invalid user object from server:', savedUser);
        return createErrorResult('Server returned invalid user data', {
          savedUserType: typeof savedUser,
          hasSavedUser: !!savedUser
        });
      }
      
      // ✅ BULLETPROOF: Ensure user has all required fields
      const completeUser = {
        ...savedUser,
        firebaseId: savedUser.firebaseId || savedUser._id || userData.uid,
        _id: savedUser._id || savedUser.firebaseId,
        email: savedUser.email || userData.email,
        name: savedUser.name || userData.displayName || userData.email?.split('@')[0] || 'User',
        subscriptionPlan: savedUser.subscriptionPlan || 'free',
        lastLoginAt: new Date().toISOString(),
        updatedAt: savedUser.updatedAt || new Date().toISOString()
      };
      
      // ✅ BULLETPROOF: Final validation of complete user
      if (!completeUser.firebaseId || !completeUser.email) {
        console.error('❌ Completed user missing essential fields:', {
          hasFirebaseId: !!completeUser.firebaseId,
          hasEmail: !!completeUser.email
        });
        return createErrorResult('Server user data missing essential fields', {
          userFields: Object.keys(completeUser)
        });
      }
      
      console.log('✅ User saved successfully to server:', {
        id: completeUser._id,
        email: completeUser.email,
        plan: completeUser.subscriptionPlan,
        firebaseId: completeUser.firebaseId
      });
      
      // ✅ BULLETPROOF: Update local store with server data
      try {
        commit('SET_USER', completeUser);
        commit('SET_USER_STATUS', completeUser.subscriptionPlan || 'free');
        
        // Store user ID for future API calls
        const userId = completeUser.firebaseId || completeUser._id;
        if (userId) {
          localStorage.setItem('userId', userId);
          localStorage.setItem('firebaseUserId', userId);
        }
        
        console.log('✅ Local store updated with server data');
      } catch (storeError) {
        console.error('❌ Failed to update local store:', storeError);
        // Don't fail the entire operation if store update fails
      }
      
      // ✅ BULLETPROOF: Load additional user data (non-blocking)
      console.log('📊 Loading additional user data from server...');
      
      const additionalDataPromises = [
        dispatch('loadUserStatus'),
        dispatch('loadUsage'), 
        dispatch('checkMonthlyReset'),
        dispatch('checkPendingPayments')
      ];
      
      // Don't await - let them load in background
      Promise.allSettled(additionalDataPromises)
        .then(results => {
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            console.warn('⚠️ Some additional data loading failed:', failures.map(f => f.reason));
          } else {
            console.log('✅ All additional user data loaded from server');
          }
        })
        .catch(error => {
          console.warn('⚠️ Additional data loading error:', error);
        });
      
      return createSuccessResult(completeUser, 'User saved successfully to server');
      
    } catch (error) {
      console.error('❌ Unexpected error in saveUser:', error);
      
      // ✅ BULLETPROOF: Comprehensive error categorization
      let userFriendlyError = 'An unexpected error occurred while saving user data.';
      
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
      }
      
      console.error('❌ Detailed error info:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return createErrorResult(userFriendlyError, {
        isUnexpectedError: true,
        originalError: error.message
      });
      
    } finally {
      // ✅ BULLETPROOF: Always clear loading state
      try {
        commit('SET_LOADING', { type: 'saving', loading: false });
      } catch (loadingError) {
        console.warn('⚠️ Failed to clear loading state:', loadingError);
      }
    }
  },
  
  // ✅ BULLETPROOF: Other actions with proper error handling
  async loadUserStatus({ commit, state }) {
    try {
      commit('SET_LOADING', { type: 'status', loading: true });
      
      const userId = getUserId(state);
      if (!userId) {
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: 'No user ID' };
      }
      
      console.log('🔍 Loading user status from server for:', userId);
      
      const { getUserStatus } = await import('@/api');
      const result = await getUserStatus(userId);
      
      if (result?.success) {
        const status = result.status || result.data?.subscriptionPlan || 'free';
        
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
        console.warn('⚠️ Failed to load user status from server:', result?.error);
        commit('SET_USER_STATUS', 'free');
        return { success: false, error: result?.error || 'Unknown error' };
      }
      
    } catch (error) {
      console.error('❌ Failed to load user status:', error);
      commit('SET_USER_STATUS', 'free');
      return { success: false, error: error.message };
      
    } finally {
      commit('SET_LOADING', { type: 'status', loading: false });
    }
  },
  
  // ✅ BULLETPROOF: Initialize with proper error handling
  async initialize({ commit, dispatch, state }) {
    if (state.system.initialized) {
      console.log('ℹ️ Store already initialized');
      return { success: true };
    }
    
    try {
      console.log('🚀 Initializing user store...');
      
      // ✅ BULLETPROOF: Load from localStorage with error handling
      const storedData = {
        user: null,
        status: null,
        preferences: null,
        promocodes: null
      };
      
      try {
        storedData.user = localStorage.getItem('currentUser');
        storedData.status = localStorage.getItem('userStatus');
        storedData.preferences = localStorage.getItem('userPreferences');
        storedData.promocodes = localStorage.getItem('appliedPromocodes');
      } catch (storageError) {
        console.warn('⚠️ LocalStorage access error:', storageError);
      }
      
      // ✅ BULLETPROOF: Restore user data with validation
      if (storedData.user) {
        try {
          const userData = JSON.parse(storedData.user);
          if (userData && typeof userData === 'object') {
            commit('SET_USER', userData);
          }
        } catch (parseError) {
          console.warn('⚠️ Invalid stored user data, clearing...');
          localStorage.removeItem('currentUser');
        }
      }
      
      // ✅ BULLETPROOF: Restore status with validation
      if (storedData.status && typeof storedData.status === 'string') {
        commit('SET_USER_STATUS', storedData.status);
      }
      
      // ✅ BULLETPROOF: Restore preferences with validation
      if (storedData.preferences) {
        try {
          const preferences = JSON.parse(storedData.preferences);
          if (preferences && typeof preferences === 'object') {
            commit('SET_PREFERENCES', preferences);
          }
        } catch (parseError) {
          console.warn('⚠️ Invalid stored preferences, using defaults');
        }
      }
      
      // ✅ BULLETPROOF: Restore promocodes with validation
      if (storedData.promocodes) {
        try {
          const promocodes = JSON.parse(storedData.promocodes);
          if (Array.isArray(promocodes)) {
            state.promocodes.applied = promocodes;
          }
        } catch (parseError) {
          console.warn('⚠️ Invalid stored promocodes, resetting to empty array');
          state.promocodes.applied = [];
        }
      }
      
      // ✅ BULLETPROOF: Load remote data if user exists
      const userId = state.currentUser?.firebaseId || localStorage.getItem('userId');
      if (userId) {
        const promises = [
          dispatch('loadUserStatus'),
          dispatch('loadUsage'),
          dispatch('checkMonthlyReset'),
          dispatch('checkPendingPayments')
        ];
        
        // Don't fail initialization if remote data fails
        try {
          await Promise.allSettled(promises);
        } catch (remoteError) {
          console.warn('⚠️ Some remote data failed to load:', remoteError);
        }
      }
      
      commit('SET_INITIALIZED', true);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      commit('SET_INITIALIZED', false);
      return { success: false, error: error.message };
    }
  },
  
  // ✅ BULLETPROOF: Load usage with error handling
  async loadUsage({ commit, state }) {
    try {
      commit('SET_LOADING', { type: 'usage', loading: true });
      
      const userId = getUserId(state);
      if (!userId) {
        return { success: false, error: 'No user ID' };
      }
      
      console.log('📊 Loading usage data from server...');
      
      const usageInfo = await getUserUsage();
      
      if (usageInfo?.success) {
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
      
      return { success: false, error: usageInfo?.error || 'Unknown error' };
      
    } catch (error) {
      console.error('❌ Failed to load usage:', error);
      return { success: false, error: error.message };
      
    } finally {
      commit('SET_LOADING', { type: 'usage', loading: false });
    }
  },
  
  // ✅ BULLETPROOF: Apply promocode with comprehensive error handling
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
      if (!baseUrl) {
        return { success: false, error: 'API configuration error' };
      }
      
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
      
      if (result?.success) {
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
          message: result.message || `Промокод успешно применён! Подписка "${plan.toUpperCase()}" активирована.`,
          oldPlan: oldStatus,
          newPlan: plan
        };
      }
      
      return { 
        success: false, 
        error: result?.error || 'Не удалось применить промокод' 
      };
      
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
  
  // ✅ BULLETPROOF: Validate promocode with error handling
  async validatePromocode({ state }, promoCode) {
    try {
      if (!promoCode || promoCode.length <= 3) {
        return { valid: false, error: 'Промокод слишком короткий' };
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!baseUrl) {
        return { valid: false, error: 'API configuration error' };
      }
      
      const response = await fetch(
        `${baseUrl}/api/promocodes/validate/${promoCode.trim().toUpperCase()}`
      );
      
      const result = await response.json();
      
      if (result?.success && result.valid) {
        return {
          valid: true,
          data: result.data,
          message: `Промокод действителен! Предоставляет: ${result.data?.grantsPlan?.toUpperCase()} план`
        };
      }
      
      return { 
        valid: false, 
        error: result?.error || 'Промокод недействителен' 
      };
      
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
  // Add this method to your actions object in src/store/user.js
async updateSubscription({ commit, dispatch }, { plan, source = 'payment', details = {} }) {
  try {
    console.log('🔄 Updating subscription:', { plan, source, details });
    
    const subscriptionData = {
      plan: plan || 'free',
      status: (plan && plan !== 'free') ? 'active' : 'inactive',
      source,
      startDate: new Date().toISOString(),
      expiryDate: source === 'promocode' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      details: details || {}
    };
    
    // Update all related state
    commit('SET_USER_STATUS', plan || 'free');
    commit('UPDATE_SUBSCRIPTION', subscriptionData);
    commit('UPDATE_FEATURES');
    commit('FORCE_UPDATE');
    
    // Persistent storage
    localStorage.setItem('userStatus', plan || 'free');
    localStorage.setItem('subscriptionDetails', JSON.stringify(subscriptionData));
    
    // Global event broadcasting
    if (typeof window !== 'undefined' && window.eventBus) {
      window.eventBus.emit('userStatusChanged', {
        oldStatus: 'free', // Track this if needed
        newStatus: plan || 'free',
        source,
        timestamp: Date.now(),
        subscriptionDetails: subscriptionData
      });
    }
    
    // Custom DOM event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('userSubscriptionChanged', {
        detail: {
          plan: plan || 'free',
          source,
          subscriptionData,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
    
    await dispatch('loadUsage');
    
    console.log('✅ Subscription updated successfully:', subscriptionData);
    return { success: true, subscriptionData };
    
  } catch (error) {
    console.error('❌ Failed to update subscription:', error);
    return { success: false, error: error.message };
  }
},
  
  // ✅ BULLETPROOF: Check monthly reset
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
  
  // ✅ BULLETPROOF: Check pending payments
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
          
          if (result?.success && result.transaction?.state === 2) {
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
  
  // ✅ BULLETPROOF: Update subscription
  async updateSubscription({ commit, dispatch }, { plan, source = 'payment', details = {} }) {
    try {
      const subscriptionData = {
        plan: plan || 'free',
        status: (plan && plan !== 'free') ? 'active' : 'inactive',
        source,
        startDate: new Date().toISOString(),
        details: details || {}
      };
      
      commit('SET_USER_STATUS', plan || 'free');
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
  
  // ✅ BULLETPROOF: Force update
  async forceUpdate({ commit }) {
    try {
      commit('FORCE_UPDATE');
      commit('UPDATE_FEATURES');
      return { success: true };
    } catch (error) {
      console.error('❌ Force update failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ✅ BULLETPROOF: Logout
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
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (storageError) {
          console.warn(`⚠️ Failed to remove ${key} from localStorage:`, storageError);
        }
      });
      
      // Clear pending payments
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pendingPayments_') || key.startsWith('lastMonthlyReset_')) {
          try {
            localStorage.removeItem(key);
          } catch (storageError) {
            console.warn(`⚠️ Failed to remove ${key} from localStorage:`, storageError);
          }
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

// ✅ HELPER FUNCTIONS WITH BULLETPROOF SAFETY
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
  
  // ✅ BULLETPROOF: Ensure valid user status
  const userStatus = state.userStatus || 'free';
  state.features = { ...(featureMatrix[userStatus] || featureMatrix.free) };
  console.log(`🔧 Features updated for ${userStatus}:`, state.features);
};

const getCurrentLimits = (state) => {
  const userStatus = state.userStatus || 'free';
  return state.usage.limits[userStatus] || state.usage.limits.free;
};

const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window !== 'undefined') {
    try {
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
    } catch (eventError) {
      console.warn('⚠️ Failed to trigger global event:', eventError);
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

const getUserId = (state) => {
  return state.currentUser?.firebaseId ||
         state.currentUser?._id ||
         localStorage.getItem('userId') ||
         localStorage.getItem('firebaseUserId');
};

// ✅ BULLETPROOF GETTER DEFINITIONS WITH NULL SAFETY
const getters = {
  // Basic user getters with null safety
  isAuthenticated: (state) => !!state.currentUser,
  getUser: (state) => state.currentUser,
  getUserId: (state) => getUserId(state),
  userName: (state) => state.currentUser?.name || state.currentUser?.displayName || 'Пользователь',
  userEmail: (state) => state.currentUser?.email || '',
  
  // Subscription getters with null safety
  userStatus: (state) => state.userStatus || 'free',
  subscription: (state) => state.subscription || { plan: 'free', status: 'inactive' },
  subscriptionDetails: (state) => state.subscription || { plan: 'free', status: 'inactive' },
  
  // Status checks
  isPremiumUser: (state) => ['premium', 'start', 'pro'].includes(state.userStatus || 'free'),
  isStartUser: (state) => ['start', 'pro', 'premium'].includes(state.userStatus || 'free'),
  isProUser: (state) => ['pro', 'premium'].includes(state.userStatus || 'free'),
  isFreeUser: (state) => (state.userStatus || 'free') === 'free',
  hasActiveSubscription: (state) => (state.subscription?.status || 'inactive') === 'active',
  
  // Subscription metadata
  subscriptionSource: (state) => state.subscription?.source || 'free',
  hasPromocodeSubscription: (state) => (state.subscription?.source || '') === 'promocode',
  subscriptionExpiry: (state) => state.subscription?.expiryDate || null,
  
  // Feature access getters with null safety
  features: (state) => state.features || {},
  hasVocabularyAccess: (state) => (state.features || {}).vocabulary || false,
  hasAdvancedFeatures: (state) => (state.features || {}).analytics || false,
  hasUnlimitedLessons: (state) => (state.features || {}).unlimited_lessons || false,
  hasPrioritySupport: (state) => (state.features || {}).priority_support || false,
  hasCustomCourses: (state) => (state.features || {}).custom_courses || false,
  hasOfflineMode: (state) => (state.features || {}).offline_mode || false,
  hasExportProgress: (state) => (state.features || {}).export_progress || false,
  
  // Feature checker function
  hasFeatureAccess: (state) => (feature) => {
    return (state.features || {})[feature] || false;
  },
  
  // Usage getters with null safety
  currentUsage: (state) => state.usage?.current || { messages: 0, images: 0, lastUpdated: null },
  usageLimits: (state) => {
    const userStatus = state.userStatus || 'free';
    return (state.usage?.limits || {})[userStatus] || { messages: 50, images: 5 };
  },
  usageHistory: (state) => state.usage?.history || [],
  
  // ✅ BULLETPROOF: Promocode getters with array safety
  appliedPromocodes: (state) => {
    // Ensure it's always an array
    const promocodes = state.promocodes?.applied;
    return Array.isArray(promocodes) ? promocodes : [];
  },
  
  hasAppliedPromocodes: (state, getters) => {
    const promocodes = getters.appliedPromocodes;
    return Array.isArray(promocodes) && promocodes.length > 0;
  },
  
  lastAppliedPromocode: (state, getters) => {
    const promocodes = getters.appliedPromocodes;
    return (Array.isArray(promocodes) && promocodes.length > 0) ? promocodes[0] : null;
  },
  
  // ✅ BULLETPROOF: Payment getters with array safety
  paymentHistory: (state) => {
    const history = state.payments?.history;
    return Array.isArray(history) ? history : [];
  },
  
  pendingPayments: (state) => {
    const pending = state.payments?.pending;
    return Array.isArray(pending) ? pending : [];
  },
  
  lastPaymentCheck: (state) => state.payments?.lastCheck || null,
  
  hasRecentPayments: (state, getters) => {
    const history = getters.paymentHistory;
    return Array.isArray(history) && history.some(p => p.status === 'completed');
  },
  
  // System getters
  isInitialized: (state) => state.system?.initialized || false,
  isLoading: (state) => (type) => (state.system?.loading || {})[type] || false,
  isAnyLoading: (state) => {
    const loading = state.system?.loading || {};
    return Object.values(loading).some(Boolean);
  },
  lastUpdate: (state) => state.system?.lastUpdate || null,
  forceUpdateCounter: (state) => state.system?.forceUpdateCounter || 0,
  
  // Preferences getters
  userPreferences: (state) => state.preferences || {},
  language: (state) => (state.preferences || {}).language || 'ru',
  theme: (state) => (state.preferences || {}).theme || 'light',
  notificationsEnabled: (state) => (state.preferences || {}).notifications !== false
};

// ✅ EXPORT STORE MODULE
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};