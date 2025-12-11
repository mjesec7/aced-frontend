// src/store/user.js - FIXED USER STORE WITH SERVER-FIRST SUBSCRIPTION

import { auth } from '@/firebase';

// =============================================
// 🔧 HELPER FUNCTIONS
// =============================================

const triggerGlobalEvent = (eventName, data = {}) => {
  if (typeof window === 'undefined') return;

  try {
    const enhancedData = {
      ...data,
      eventName,
      source: 'user-store',
      timestamp: data.timestamp || Date.now(),
      version: '2.0'
    };

    // Custom DOM event
    const customEvent = new CustomEvent(eventName, {
      detail: enhancedData,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(customEvent);

    // Event bus
    if (window.eventBus?.emit) {
      window.eventBus.emit(eventName, enhancedData);
    }

    console.log(`📡 [store/user] Event triggered: ${eventName}`);

  } catch (eventError) {
    console.error(`❌ [store/user] Event trigger error:`, eventError);
  }
};

const updateFeatureMatrix = (state) => {
  const featureMatrix = {
    free: {
      vocabulary: false,
      analytics: false,
      unlimited_lessons: false,
      priority_support: false,
      custom_courses: false,
      offline_mode: false,
      export_progress: false,
      advanced_grammar: false,
      multiple_languages: false,
      ai_tutor: false
    },
    start: {
      vocabulary: true,
      analytics: false,
      unlimited_lessons: false,
      priority_support: true,
      custom_courses: false,
      offline_mode: true,
      export_progress: false,
      advanced_grammar: true,
      multiple_languages: false,
      ai_tutor: false
    },
    pro: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true,
      advanced_grammar: true,
      multiple_languages: true,
      ai_tutor: true
    },
    premium: {
      vocabulary: true,
      analytics: true,
      unlimited_lessons: true,
      priority_support: true,
      custom_courses: true,
      offline_mode: true,
      export_progress: true,
      advanced_grammar: true,
      multiple_languages: true,
      ai_tutor: true
    }
  };

  const userStatus = state.userStatus || 'free';
  state.features = { ...(featureMatrix[userStatus] || featureMatrix.free) };
};

const getUserId = (state) => {
  return state.currentUser?.firebaseId ||
    state.currentUser?.firebaseUserId ||
    state.currentUser?._id ||
    state.currentUser?.uid ||
    localStorage.getItem('userId') ||
    localStorage.getItem('firebaseUserId') ||
    null;
};

const getAuthToken = async () => {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(true);
    }
    return localStorage.getItem('token') || null;
  } catch (error) {
    console.error('[store/user] Error getting auth token:', error);
    return null;
  }
};

// =============================================
// 📦 STATE
// =============================================

const state = () => ({
  currentUser: null,
  userStatus: 'free',

  subscription: {
    plan: 'free',
    status: 'inactive',
    source: null,
    startDate: null,
    expiryDate: null,
    isAutoRenew: false,
    details: {},
    lastSync: null,
    serverFetch: false
  },

  usage: {
    current: {
      messages: 0,
      images: 0,
      lastUpdated: null,
      resetDate: null
    },
    limits: {
      free: { messages: 50, images: 5 },
      start: { messages: -1, images: 20 },
      pro: { messages: -1, images: -1 },
      premium: { messages: -1, images: -1 }
    }
  },

  features: {
    vocabulary: false,
    analytics: false,
    unlimited_lessons: false,
    priority_support: false,
    custom_courses: false,
    offline_mode: false,
    export_progress: false,
    advanced_grammar: false,
    multiple_languages: false,
    ai_tutor: false
  },

  promocodes: {
    applied: [],
    available: [],
    lastCheck: null
  },

  payments: {
    history: [],
    pending: [],
    failed: [],
    lastCheck: null
  },

  system: {
    initialized: false,
    initializationTime: null,
    lastUpdate: Date.now(),
    forceUpdateCounter: 0,
    syncInProgress: false,
    lastServerSync: null,
    loading: {
      status: false,
      usage: false,
      payments: false,
      saving: false,
      sync: false
    },
    errors: {
      lastError: null,
      errorCount: 0
    }
  }
});

// =============================================
// 🔄 MUTATIONS
// =============================================

const mutations = {
  SET_USER(state, user) {
    const timestamp = Date.now();
    state.currentUser = user ? { ...user, lastUpdate: timestamp } : null;
    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    if (user) {
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userId', user.firebaseId || user.uid || user._id);
        localStorage.setItem('firebaseUserId', user.firebaseId || user.uid);
      } catch (e) {
        console.warn('[store/user] localStorage error:', e);
      }
    }

    triggerGlobalEvent('userUpdated', { user, timestamp });
  },

  CLEAR_USER(state) {
    const timestamp = Date.now();

    state.currentUser = null;
    state.userStatus = 'free';
    state.subscription = {
      plan: 'free',
      status: 'inactive',
      source: null,
      startDate: null,
      expiryDate: null,
      isAutoRenew: false,
      details: {},
      lastSync: null,
      serverFetch: false
    };
    state.usage.current = { messages: 0, images: 0, lastUpdated: null, resetDate: null };
    state.features = Object.keys(state.features).reduce((acc, key) => ({ ...acc, [key]: false }), {});
    state.promocodes.applied = [];
    state.payments.history = [];
    state.system.initialized = false;
    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    // Clear localStorage
    const keysToRemove = [
      'currentUser', 'userStatus', 'subscriptionData', 'subscriptionPlan',
      'userPlan', 'plan', 'subscriptionExpiry', 'userId', 'firebaseUserId'
    ];
    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) { }
    });

    triggerGlobalEvent('userCleared', { timestamp });
  },

  SET_USER_STATUS(state, status) {
    const oldStatus = state.userStatus;
    const validStatuses = ['free', 'start', 'pro', 'premium'];
    const newStatus = validStatuses.includes(status) ? status : 'free';

    console.log(`📝 [store/user] SET_USER_STATUS: ${oldStatus} -> ${newStatus}`);

    state.userStatus = newStatus;
    state.subscription.plan = newStatus;
    state.subscription.status = newStatus !== 'free' ? 'active' : 'inactive';
    state.subscription.lastSync = new Date().toISOString();
    state.system.lastUpdate = Date.now();
    state.system.forceUpdateCounter++;

    // Update features
    updateFeatureMatrix(state);

    // Update localStorage
    try {
      localStorage.setItem('userStatus', newStatus);
      localStorage.setItem('userPlan', newStatus);
      localStorage.setItem('subscriptionPlan', newStatus);
      localStorage.setItem('plan', newStatus);
    } catch (e) {
      console.warn('[store/user] localStorage error:', e);
    }

    // Trigger events
    triggerGlobalEvent('userStatusChanged', { oldStatus, newStatus, timestamp: Date.now() });
    triggerGlobalEvent('subscriptionUpdated', { plan: newStatus, timestamp: Date.now() });
  },

  UPDATE_SUBSCRIPTION(state, subscriptionData) {
    if (!subscriptionData || typeof subscriptionData !== 'object') return;

    const timestamp = Date.now();

    state.subscription = {
      ...state.subscription,
      ...subscriptionData,
      lastSync: new Date().toISOString()
    };

    // Auto-update status if plan changed
    if (subscriptionData.plan && subscriptionData.plan !== state.userStatus) {
      state.userStatus = subscriptionData.plan;
      updateFeatureMatrix(state);
    }

    state.system.lastUpdate = timestamp;
    state.system.forceUpdateCounter++;

    // Persist to localStorage
    try {
      localStorage.setItem('subscriptionData', JSON.stringify(state.subscription));
      if (subscriptionData.expiryDate) {
        localStorage.setItem('subscriptionExpiry', subscriptionData.expiryDate);
      }
    } catch (e) {
      console.warn('[store/user] localStorage error:', e);
    }

    console.log('✅ [store/user] Subscription updated:', state.subscription);
    triggerGlobalEvent('subscriptionUpdated', { subscription: state.subscription, timestamp });
  },

  SET_LOADING(state, { type, loading }) {
    // Defensive check for system object
    if (!state.system) {
      console.warn('⚠️ [store/user] state.system missing in SET_LOADING, re-initializing');
      state.system = {
        loading: {},
        errors: { errorCount: 0, lastError: null },
        initialized: false,
        lastUpdate: Date.now(),
        forceUpdateCounter: 0
      };
    }

    // Defensive check for loading object
    if (!state.system.loading) {
      state.system.loading = {};
    }

    state.system.loading[type] = Boolean(loading);
    state.system.lastUpdate = Date.now();
  },

  SET_INITIALIZED(state, initialized = true) {
    state.system.initialized = Boolean(initialized);
    state.system.initializationTime = initialized ? Date.now() : null;
    state.system.lastUpdate = Date.now();
    console.log(`📦 [store/user] Initialized: ${initialized}`);
  },

  SET_LAST_SERVER_SYNC(state, timestamp) {
    state.system.lastServerSync = timestamp || Date.now();
  },

  FORCE_UPDATE(state) {
    state.system.forceUpdateCounter++;
    state.system.lastUpdate = Date.now();
    triggerGlobalEvent('forceUpdate', { counter: state.system.forceUpdateCounter });
  },

  SET_ERROR(state, error) {
    state.system.errors.lastError = {
      message: error.message || error,
      timestamp: Date.now(),
      context: error.context || null
    };
    state.system.errors.errorCount++;
  },

  ADD_PROMOCODE(state, promocodeData) {
    if (!Array.isArray(state.promocodes.applied)) {
      state.promocodes.applied = [];
    }

    const promocode = {
      id: `promo_${Date.now()}`,
      code: promocodeData.code?.toUpperCase() || '',
      plan: promocodeData.plan || 'free',
      appliedAt: new Date().toISOString(),
      source: promocodeData.source || 'manual'
    };

    state.promocodes.applied.unshift(promocode);

    if (state.promocodes.applied.length > 10) {
      state.promocodes.applied = state.promocodes.applied.slice(0, 10);
    }

    try {
      localStorage.setItem('appliedPromocodes', JSON.stringify(state.promocodes.applied));
    } catch (e) { }

    triggerGlobalEvent('promocodeApplied', { promocode });
  },

  ADD_PAYMENT(state, paymentData) {
    if (!Array.isArray(state.payments.history)) {
      state.payments.history = [];
    }

    const payment = {
      id: paymentData.id || `payment_${Date.now()}`,
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'UZS',
      status: paymentData.status || 'pending',
      plan: paymentData.plan || 'free',
      method: paymentData.method || 'unknown',
      timestamp: paymentData.timestamp || Date.now(),
      createdAt: new Date().toISOString()
    };

    state.payments.history.unshift(payment);

    if (state.payments.history.length > 50) {
      state.payments.history = state.payments.history.slice(0, 50);
    }

    triggerGlobalEvent('paymentUpdated', { payment });
  },

  SET_USAGE(state, usageData) {
    if (!usageData || typeof usageData !== 'object') return;

    state.usage.current = {
      messages: Math.max(0, parseInt(usageData.messages) || 0),
      images: Math.max(0, parseInt(usageData.images) || 0),
      lastUpdated: new Date().toISOString(),
      resetDate: usageData.resetDate || null
    };

    state.system.lastUpdate = Date.now();
    triggerGlobalEvent('usageUpdated', { usage: state.usage.current });
  },

  INCREMENT_USAGE(state, { messages = 0, images = 0 }) {
    state.usage.current.messages = Math.max(0, (state.usage.current.messages || 0) + messages);
    state.usage.current.images = Math.max(0, (state.usage.current.images || 0) + images);
    state.usage.current.lastUpdated = new Date().toISOString();
  }
};

// =============================================
// 🎬 ACTIONS
// =============================================

const actions = {
  /**
   * CRITICAL: Initialize store and fetch from server
   */
  async initialize({ commit, dispatch, state }) {
    console.log('🚀 [store/user] Initializing...');

    if (state.system.initialized) {
      console.log('⏭️ [store/user] Already initialized');
      return { success: true, cached: true };
    }

    try {
      commit('SET_INITIALIZED', true);

      // Load from localStorage first (for immediate display)
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData && userData.email) {
            commit('SET_USER', userData);
          }
        } catch (e) { }
      }

      const storedStatus = localStorage.getItem('userStatus');
      if (storedStatus && ['free', 'start', 'pro', 'premium'].includes(storedStatus)) {
        commit('SET_USER_STATUS', storedStatus);
      }

      console.log('✅ [store/user] Initialization complete');
      return { success: true };

    } catch (error) {
      console.error('❌ [store/user] Initialization error:', error);
      commit('SET_ERROR', { message: 'Initialization failed', context: 'initialize' });
      return { success: false, error: error.message };
    }
  },

  /**
   * CRITICAL: Fetch subscription status from server
   * This is the PRIMARY method for getting subscription status
   */
  async fetchStatusFromServer({ commit, state }) {
    console.log('🔄 [store/user] fetchStatusFromServer called');

    try {
      commit('SET_LOADING', { type: 'status', loading: true });

      // Get user ID from multiple sources
      const userId = state.currentUser?.firebaseId ||
        state.currentUser?.firebaseUserId ||
        state.currentUser?._id ||
        state.currentUser?.uid ||
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId');

      if (!userId) {
        console.error('❌ [store/user] No user ID available');
        return { success: false, error: 'No user ID' };
      }

      // Get auth token
      let token = null;
      try {
        const { auth } = await import('@/firebase');
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
      } catch (e) {
        token = localStorage.getItem('token') || localStorage.getItem('authToken');
      }

      if (!token) {
        console.error('❌ [store/user] No auth token available');
        return { success: false, error: 'No auth token' };
      }

      // Direct API call to get user data
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

      console.log('📡 [store/user] Fetching from:', `${baseUrl}/api/users/${userId}`);

      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 [store/user] Server response:', data);

      // Extract user data from various response formats
      const userData = data.user || data.data || data;
      const serverStatus = userData.subscriptionPlan || userData.userStatus || 'free';
      const expiryDate = userData.subscriptionExpiryDate || userData.subscriptionExpiry;
      const subscriptionDuration = userData.subscriptionDuration;

      console.log('✅ [store/user] Server status:', serverStatus, 'Expiry:', expiryDate);

      // Update store with server data
      commit('SET_USER_STATUS', serverStatus);

      // Update subscription object with serverFetch flag
      commit('UPDATE_SUBSCRIPTION', {
        plan: serverStatus,
        status: serverStatus !== 'free' ? 'active' : 'inactive',
        expiryDate: expiryDate || null,
        duration: subscriptionDuration || null,
        lastSync: new Date().toISOString(),
        serverFetch: true  // ✅ CRITICAL: Mark as fetched from server
      });

      // Update localStorage for persistence
      localStorage.setItem('userStatus', serverStatus);
      localStorage.setItem('subscriptionPlan', serverStatus);
      localStorage.setItem('userPlan', serverStatus);
      localStorage.setItem('plan', serverStatus);
      if (expiryDate) {
        localStorage.setItem('subscriptionExpiry', expiryDate);
      }
      localStorage.setItem('lastServerSync', Date.now().toString());

      return {
        success: true,
        status: serverStatus,
        expiryDate: expiryDate,
        duration: subscriptionDuration,
        serverFetch: true
      };

    } catch (error) {
      console.error('❌ [store/user] fetchStatusFromServer error:', error);
      return { success: false, error: error.message };
    } finally {
      commit('SET_LOADING', { type: 'status', loading: false });
    }
  },

  /**
   * Load user status - calls fetchStatusFromServer
   */
  async loadUserStatus({ dispatch, commit, state }) {
    console.log('📥 [store/user] loadUserStatus called');

    // Always try to fetch from server first
    const result = await dispatch('fetchStatusFromServer');

    if (!result.success) {
      console.warn('⚠️ [store/user] Server fetch failed, using local data');

      // Fallback to localStorage
      const localStatus = localStorage.getItem('userStatus');
      if (localStatus && ['free', 'start', 'pro', 'premium'].includes(localStatus)) {
        commit('SET_USER_STATUS', localStatus);
        return { success: true, status: localStatus, source: 'localStorage' };
      }

      // Default to free
      commit('SET_USER_STATUS', 'free');
      return { success: true, status: 'free', defaulted: true };
    }

    return result;
  },

  /**
   * Update user status with server sync
   */
  async updateUserStatus({ commit, state, dispatch }, newStatus) {
    console.log('📝 [store/user] updateUserStatus called:', newStatus);

    const validStatuses = ['free', 'start', 'pro', 'premium'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return { success: false, error: 'Invalid status' };
    }

    const oldStatus = state.userStatus;

    if (oldStatus === newStatus) {
      return { success: true, message: 'Status unchanged', noChange: true };
    }

    try {
      // Update local state first for immediate UI response
      commit('SET_USER_STATUS', newStatus);
      commit('FORCE_UPDATE');

      // Then sync to server
      const userId = getUserId(state);
      if (userId) {
        const { updateUserStatusWithPersistence } = await import('@/api/subscription');
        await updateUserStatusWithPersistence(userId, newStatus, 'manual');
      }

      return {
        success: true,
        oldStatus,
        newStatus,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ [store/user] updateUserStatus error:', error);
      commit('SET_ERROR', { message: error.message, context: 'updateUserStatus' });
      return { success: false, error: error.message };
    }
  },

  /**
   * Update subscription with server sync
   */
  async updateSubscription({ commit, dispatch, state }, { plan, source = 'payment', details = {} }) {
    console.log('💳 [store/user] updateSubscription called:', plan);

    try {
      const validPlans = ['free', 'start', 'pro', 'premium'];
      const validatedPlan = validPlans.includes(plan) ? plan : 'free';
      const oldStatus = state.userStatus;

      // Calculate expiry date
      let expiryDate = null;
      if (validatedPlan !== 'free') {
        const now = new Date();
        const days = source === 'payment' ? 365 : 30;
        expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const subscriptionData = {
        plan: validatedPlan,
        status: validatedPlan !== 'free' ? 'active' : 'inactive',
        startDate: new Date().toISOString(),
        expiryDate: expiryDate,
        source: source,
        details: details,
        serverFetch: false
      };

      // Update store
      commit('SET_USER_STATUS', validatedPlan);
      commit('UPDATE_SUBSCRIPTION', subscriptionData);
      commit('FORCE_UPDATE');

      // Sync to server
      const userId = getUserId(state);
      if (userId) {
        const { saveSubscriptionToServer } = await import('@/api/subscription');
        await saveSubscriptionToServer(userId, subscriptionData);
      }

      return {
        success: true,
        subscriptionData,
        oldStatus,
        newStatus: validatedPlan
      };

    } catch (error) {
      console.error('❌ [store/user] updateSubscription error:', error);
      commit('SET_ERROR', { message: error.message, context: 'updateSubscription' });
      return { success: false, error: error.message };
    }
  },

  /**
   * Apply promocode
   */
  async applyPromocode({ commit, state, dispatch }, { promoCode, plan }) {
    console.log('🎟️ [store/user] applyPromocode called:', promoCode);

    try {
      if (!promoCode || promoCode.trim().length < 3) {
        return { success: false, error: 'Invalid promocode' };
      }

      const normalizedCode = promoCode.trim().toUpperCase();
      const oldStatus = state.userStatus;

      // Import and use API
      const { applyPromocode: applyPromocodeAPI } = await import('@/api/promocodes');
      const result = await applyPromocodeAPI(normalizedCode);

      console.log('📡 [store/user] Promocode API result:', result);

      if (result.success) {
        const newPlan = result.plan || plan || 'pro';
        const expiryDate = result.expiryDate;

        // Update store
        commit('SET_USER_STATUS', newPlan);
        commit('UPDATE_SUBSCRIPTION', {
          plan: newPlan,
          status: 'active',
          expiryDate: expiryDate,
          source: 'promocode',
          lastSync: new Date().toISOString()
        });
        commit('ADD_PROMOCODE', {
          code: normalizedCode,
          plan: newPlan,
          source: 'api'
        });
        commit('FORCE_UPDATE');

        // Update localStorage
        localStorage.setItem('userStatus', newPlan);
        localStorage.setItem('subscriptionPlan', newPlan);
        localStorage.setItem('userPlan', newPlan);
        if (expiryDate) {
          localStorage.setItem('subscriptionExpiry', expiryDate);
        }

        // Trigger events
        triggerGlobalEvent('userStatusChanged', { oldStatus, newStatus: newPlan, source: 'promocode' });

        // Fetch fresh data from server
        dispatch('fetchStatusFromServer');

        return {
          success: true,
          message: result.message || `Promocode applied! ${newPlan.toUpperCase()} activated.`,
          oldPlan: oldStatus,
          newPlan: newPlan,
          expiryDate: expiryDate
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to apply promocode'
        };
      }

    } catch (error) {
      console.error('❌ [store/user] applyPromocode error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate promocode
   */
  async validatePromocode({ state }, promoCode) {
    console.log('🔍 [store/user] validatePromocode called:', promoCode);

    try {
      if (!promoCode || promoCode.trim().length < 3) {
        return { valid: false, error: 'Promocode too short' };
      }

      const { validatePromocode: validatePromocodeAPI } = await import('@/api/promocodes');
      const result = await validatePromocodeAPI(promoCode.trim().toUpperCase());

      return result;

    } catch (error) {
      console.error('❌ [store/user] validatePromocode error:', error);
      return { valid: false, error: error.message };
    }
  },

  /**
   * Save user to backend
   */
  async saveUser({ commit, dispatch }, { userData, token }) {
    console.log('💾 [store/user] saveUser called');

    try {
      commit('SET_LOADING', { type: 'saving', loading: true });

      const { saveUser: saveUserAPI } = await import('@/api/user');

      const payload = {
        firebaseUserId: userData.uid || userData.firebaseId,
        email: userData.email,
        name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'User',
        displayName: userData.displayName || userData.name || '',
        emailVerified: Boolean(userData.emailVerified),
        photoURL: userData.photoURL || null,
        subscriptionPlan: userData.subscriptionPlan || 'free'
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/api/users/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          name: payload.name,
          subscriptionPlan: payload.subscriptionPlan
        })
      });

      const result = await response.json();

      if (result.success && result.user) {
        commit('SET_USER', result.user);
        commit('SET_USER_STATUS', result.user.subscriptionPlan || 'free');

        localStorage.setItem('userId', result.user.firebaseId);
        localStorage.setItem('firebaseUserId', result.user.firebaseId);

        console.log('✅ [store/user] User saved successfully');

        return { success: true, user: result.user };
      } else {
        throw new Error(result.error || 'Failed to save user');
      }

    } catch (error) {
      console.error('❌ [store/user] saveUser error:', error);
      commit('SET_ERROR', { message: error.message, context: 'saveUser' });
      return { success: false, error: error.message };
    } finally {
      commit('SET_LOADING', { type: 'saving', loading: false });
    }
  },

  /**
   * Force update
   */
  async forceUpdate({ commit }) {
    commit('FORCE_UPDATE');
    return { success: true };
  },

  /**
   * Logout
   */
  async logout({ commit }) {
    console.log('🚪 [store/user] logout called');
    commit('CLEAR_USER');
    return { success: true };
  }
};

// =============================================
// 📊 GETTERS
// =============================================

const getters = {
  isAuthenticated: (state) => {
    return !!(state.currentUser && (state.currentUser.firebaseId || state.currentUser._id || state.currentUser.uid));
  },

  getUser: (state) => state.currentUser,

  getUserId: (state) => getUserId(state),

  userName: (state) => {
    return state.currentUser?.name ||
      state.currentUser?.displayName ||
      state.currentUser?.email?.split('@')[0] ||
      'User';
  },

  userEmail: (state) => state.currentUser?.email || '',

  // CRITICAL: Primary getter for subscription status
  userStatus: (state) => {
    // Priority: Store state > Subscription object > localStorage
    if (state.userStatus && state.userStatus !== 'free') {
      return state.userStatus;
    }
    if (state.subscription?.plan && state.subscription.plan !== 'free') {
      return state.subscription.plan;
    }
    return state.userStatus || 'free';
  },

  subscription: (state) => state.subscription,

  subscriptionDetails: (state) => ({
    plan: state.subscription?.plan || state.userStatus || 'free',
    status: state.subscription?.status || 'inactive',
    expiryDate: state.subscription?.expiryDate || null,
    source: state.subscription?.source || null,
    duration: state.subscription?.duration || null,
    serverFetch: state.subscription?.serverFetch || false,
    lastSync: state.subscription?.lastSync || null
  }),

  isPremiumUser: (state, getters) => {
    const status = getters.userStatus;
    return ['premium', 'start', 'pro'].includes(status);
  },

  isStartUser: (state, getters) => {
    const status = getters.userStatus;
    return ['start', 'pro', 'premium'].includes(status);
  },

  isProUser: (state, getters) => {
    const status = getters.userStatus;
    return ['pro', 'premium'].includes(status);
  },

  isFreeUser: (state, getters) => {
    return getters.userStatus === 'free';
  },

  hasActiveSubscription: (state, getters) => {
    return getters.userStatus !== 'free';
  },

  features: (state) => state.features,

  hasFeatureAccess: (state) => (feature) => {
    return Boolean(state.features?.[feature]);
  },

  currentUsage: (state) => state.usage?.current || { messages: 0, images: 0 },

  usageLimits: (state, getters) => {
    const status = getters.userStatus;
    return state.usage?.limits?.[status] || { messages: 50, images: 5 };
  },

  appliedPromocodes: (state) => state.promocodes?.applied || [],

  paymentHistory: (state) => state.payments?.history || [],

  isInitialized: (state) => Boolean(state.system?.initialized),

  isLoading: (state) => (type) => Boolean(state.system?.loading?.[type]),

  isAnyLoading: (state) => {
    const loading = state.system?.loading || {};
    return Object.values(loading).some(Boolean);
  },

  lastServerSync: (state) => state.system?.lastServerSync || null,

  forceUpdateCounter: (state) => state.system?.forceUpdateCounter || 0,

  lastError: (state) => state.system?.errors?.lastError || null
};

// =============================================
// 📤 EXPORT
// =============================================

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};

export { triggerGlobalEvent };