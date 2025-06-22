// src/api.js - ENHANCED MAIN WEBSITE API CONFIGURATION WITH PAYMENT INTEGRATION
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined in your .env file!');
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

console.log('✅ Main Website API Base URL:', BASE_URL);

// ✅ ENHANCED TOKEN MANAGEMENT
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getValidToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('⚠️ No Firebase user available');
      return null;
    }
    
    const token = await currentUser.getIdToken(true);
    localStorage.setItem('token', token);
    console.log('🔑 Fresh token obtained');
    return token;
  } catch (error) {
    console.error('❌ Failed to get valid token:', error);
    return null;
  }
};

// ✅ ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  try {
    const token = await getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
});

// ✅ ENHANCED RESPONSE INTERCEPTOR WITH TOKEN REFRESH
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          processQueue(new Error('No user available'), null);
          isRefreshing = false;
          return Promise.reject(error);
        }
        
        const freshToken = await currentUser.getIdToken(true);
        localStorage.setItem('token', freshToken);
        
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        processQueue(null, freshToken);
        isRefreshing = false;
        
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// =============================================
// 💳 PAYMENT API FUNCTIONS
// =============================================

// Enhanced token management for payment requests
const getAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('⚠️ No Firebase user for payment request');
      return null;
    }
    
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('❌ Failed to get auth token for payment:', error);
    return null;
  }
};

// ✅ PROMO CODE APPLICATION
export const applyPromoCode = async (userId, plan, promoCode) => {
  try {
    console.log('🎟️ Applying promo code:', { userId, plan, promoCode });
    
    const response = await api.post('/payments/promo-code', {
      userId,
      plan,
      promoCode
    });
    
    return {
      success: true,
      data: response.data,
      message: response.data.message || 'Промокод успешно применён'
    };
  } catch (error) {
    console.error('❌ Promo code error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Ошибка применения промокода'
    };
  }
};

// ✅ PAYME PAYMENT INITIATION
export const initiatePaymePayment = async (userId, plan, additionalData = {}) => {
  try {
    const payload = {
      userId,
      plan,
      ...additionalData
    };
    
    console.log('🚀 Initiating PayMe payment:', payload);
    
    const response = await api.post('/payments/initiate-payme', payload);
    
    return {
      success: true,
      data: response.data,
      paymentUrl: response.data.paymentUrl,
      transaction: response.data.transaction,
      metadata: response.data.metadata
    };
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Ошибка инициации платежа',
      details: error.response?.data
    };
  }
};

// ✅ PAYMENT STATUS CHECK
export const checkPaymentStatus = async (transactionId, userId = null) => {
  try {
    const url = userId 
      ? `/payments/status/${transactionId}/${userId}`
      : `/payments/status/${transactionId}`;
    
    console.log('🔍 Checking payment status:', { transactionId, userId, url });
    
    const response = await api.get(url);
    
    return {
      success: true,
      data: response.data,
      transaction: response.data.transaction,
      status: response.data.transaction?.state
    };
  } catch (error) {
    console.error('❌ Payment status check error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Ошибка проверки статуса платежа'
    };
  }
};

// ✅ USER VALIDATION FOR PAYMENTS
export const validateUser = async (userId) => {
  try {
    console.log('👤 Validating user for payment:', userId);
    
    const response = await api.get(`/payments/validate-user/${userId}`);
    
    return {
      success: true,
      valid: response.data.valid,
      user: response.data.user
    };
  } catch (error) {
    console.error('❌ User validation error:', error);
    return {
      success: false,
      valid: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// ✅ SANDBOX TESTING FUNCTIONS (Development only)
export const setSandboxAccountState = async (accountLogin, state) => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Sandbox functions not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/payments/sandbox/account-state`, {
      accountLogin,
      state
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const setSandboxMerchantKey = async (merchantKey) => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Sandbox functions not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/payments/sandbox/merchant-key`, {
      merchantKey
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const listSandboxTransactions = async () => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Sandbox functions not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/payments/transactions`);
    
    return {
      success: true,
      data: response.data,
      transactions: response.data.transactions
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export const clearSandboxTransactions = async () => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Sandbox functions not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    const response = await axios.delete(`${BASE_URL}/payments/transactions/clear`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// ✅ FIXED: PAYMENT UTILITY FUNCTIONS WITH CORRECT AMOUNTS
export const getPaymentAmounts = () => {
  return {
    start: {
      tiyin: 26000000,  // ✅ 260,000 UZS in tiyin (260000 * 100)
      uzs: 260000,      // ✅ 260,000 UZS  
      label: 'Start'
    },
    pro: {
      tiyin: 45500000,  // ✅ 455,000 UZS in tiyin (455000 * 100)
      uzs: 455000,      // ✅ 455,000 UZS
      label: 'Pro'
    }
  };
};

// ✅ ENHANCED: Format payment amount function with better error handling
export const formatPaymentAmount = (amount, currency = 'UZS') => {
  try {
    // Ensure amount is a number
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
      console.warn('⚠️ Invalid amount for formatting:', amount);
      return `${amount} сум`;
    }
    
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  } catch (error) {
    console.warn('⚠️ Currency formatting failed, using fallback:', error);
    // Fallback formatting
    const numAmount = Number(amount) || 0;
    return `${numAmount.toLocaleString('uz-UZ')} сум`;
  }
};

export const getTransactionStateText = (state) => {
  switch (state) {
    case 1:
      return { text: 'Создана', color: 'warning', icon: '⏳' };
    case 2:
      return { text: 'Оплачена', color: 'success', icon: '✅' };
    case -1:
      return { text: 'Отменена', color: 'error', icon: '❌' };
    case -2:
      return { text: 'Возвращена', color: 'error', icon: '↩️' };
    default:
      return { text: 'Неизвестно', color: 'default', icon: '❓' };
  }
};

// =============================================
// 📊 USER PROGRESS
// =============================================

export const submitProgress = (userId, progressData) =>
  api.post(`/user-progress`, { userId, ...progressData });

export const getLessonProgress = (userId, lessonId) =>
  api.get(`/user-progress/user/${userId}/lesson/${lessonId}`);

export const getUserProgress = (userId) =>
  api.get(`/user-progress/user/${userId}`);

// =============================================
// 📝 TESTS API WITH MULTIPLE ENDPOINT SUPPORT
// =============================================

export const getAvailableTests = async (userId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests`);
    return data;
  } catch (error) {
    console.warn('⚠️ User tests endpoint failed, trying direct:', error.message);
    // Fallback to direct tests endpoint
    const { data } = await api.get(`/tests`);
    return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
  }
};

export const getTestById = async (userId, testId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests/${testId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test endpoint failed, trying direct:', error.message);
    // Fallback to direct test endpoint
    const { data } = await api.get(`/tests/${testId}`);
    return { test: data };
  }
};

export const submitTestResult = async (userId, testId, answers) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.post(`/users/${userId}/tests/${testId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User test submit endpoint failed, trying direct:', error.message);
    // Fallback to direct submit endpoint
    const { data } = await api.post(`/tests/${testId}/submit`, { userId, answers });
    return data;
  }
};

export const getTestResult = async (userId, testId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests/${testId}/result`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test result endpoint failed:', error.message);
    // Could implement fallback if needed
    throw error;
  }
};

export const getUserTestResults = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/tests/results`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test results endpoint failed:', error.message);
    return { success: false, data: [] };
  }
};

// =============================================
// 📚 HOMEWORK API WITH MULTIPLE ENDPOINT SUPPORT
// =============================================

export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    // Try user-specific lesson homework endpoint
    const { data } = await api.get(`/users/${userId}/homeworks/lesson/${lessonId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User homework endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework routes
      const { data } = await api.get(`/homeworks/user/${userId}/lesson/${lessonId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const getAllHomeworks = async (userId) => {
  try {
    // Try enhanced user homeworks endpoint
    const { data } = await api.get(`/users/${userId}/homeworks`);
    return data;
  } catch (error) {
    console.warn('⚠️ Enhanced homework endpoint failed, trying legacy:', error.message);
    
    try {
      // Fallback to legacy endpoint
      const { data } = await api.get(`/homeworks/user/${userId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const saveHomework = async (userId, lessonId, answers) => {
  try {
    // Try user-specific save endpoint
    const { data } = await api.post(`/users/${userId}/homeworks/save`, { 
      lessonId, 
      answers, 
      completed: false 
    });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework save endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework save
      const { data } = await api.post(`/homeworks/user/${userId}/save`, { 
        lessonId, 
        answers, 
        completed: false 
      });
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework save endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const submitHomework = async (userId, lessonId, answers) => {
  try {
    // Try user-specific submit endpoint
    const { data } = await api.post(`/users/${userId}/homeworks/lesson/${lessonId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework submit endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework submit
      const { data } = await api.post(`/homeworks/user/${userId}/lesson/${lessonId}/submit`, { answers });
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework submit endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

// ✅ ENHANCED: Standalone Homework API (for admin panel created homework)
export const getStandaloneHomework = async (userId, homeworkId) => {
  try {
    const { data } = await api.get(`/users/${userId}/homework/${homeworkId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get standalone homework:', error.message);
    throw error;
  }
};

export const saveStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const { data } = await api.post(`/users/${userId}/homework/${homeworkId}/save`, { answers });
    return data;
  } catch (error) {
    console.error('❌ Failed to save standalone homework:', error.message);
    throw error;
  }
};

export const submitStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const { data } = await api.post(`/users/${userId}/homework/${homeworkId}/submit`, { answers });
    return data;
  } catch (error) {
    console.error('❌ Failed to submit standalone homework:', error.message);
    throw error;
  }
};

// =============================================
// 👤 USER MANAGEMENT
// =============================================

export const getUserInfo = (userId) =>
  api.get(`/users/${userId}`);

export const getUserStatus = (userId) =>
  api.get(`/users/${userId}/status`);

export const saveUser = (userData) =>
  api.post(`/users/save`, userData);

export const updateUserProfile = (userId, profileData) =>
  api.put(`/users/${userId}/profile`, profileData);

// =============================================
// 📖 STUDY LIST MANAGEMENT
// =============================================

export const getUserStudyList = (userId) =>
  api.get(`/users/${userId}/study-list`);

export const addToStudyList = (userId, topicData) =>
  api.post(`/users/${userId}/study-list`, topicData);

export const removeFromStudyList = (userId, topicId) =>
  api.delete(`/users/${userId}/study-list/${topicId}`);

export const cleanupStudyList = (userId) =>
  api.post(`/users/${userId}/study-list/cleanup`);

// =============================================
// 🎯 RECOMMENDATIONS
// =============================================

export const getRecommendations = (userId) =>
  api.get(`/users/${userId}/recommendations`);

// =============================================
// 📈 PROGRESS TRACKING
// =============================================

export const getUserProgressStats = (userId) =>
  api.get(`/users/${userId}/progress`);

export const getLessonProgressStats = (userId, lessonId) =>
  api.get(`/users/${userId}/progress/lesson/${lessonId}`);

export const getTopicsProgress = (userId) =>
  api.get(`/users/${userId}/topics-progress`);

export const getUserPoints = (userId) =>
  api.get(`/users/${userId}/points`);

// =============================================
// 🎯 GOALS MANAGEMENT
// =============================================

export const getUserGoals = (userId) =>
  api.get(`/users/${userId}/goals`);

export const createUserGoal = (userId, goalData) =>
  api.post(`/users/${userId}/goals`, goalData);

export const updateUserGoal = (userId, goalId, goalData) =>
  api.put(`/users/${userId}/goals/${goalId}`, goalData);

export const deleteUserGoal = (userId, goalId) =>
  api.delete(`/users/${userId}/goals/${goalId}`);

// =============================================
// 📔 DIARY MANAGEMENT
// =============================================

export const saveDiaryEntry = (userId, diaryData) =>
  api.post(`/users/${userId}/diary`, diaryData);

export const getDiaryEntries = (userId) =>
  api.get(`/users/${userId}/diary`);

// =============================================
// 📊 ANALYTICS WITH FALLBACK SUPPORT
// =============================================

export const getUserAnalytics = async (userId) => {
  try {
    // Try user-specific analytics endpoint
    const { data } = await api.get(`/users/${userId}/analytics`);
    return data;
  } catch (error) {
    console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to general analytics endpoint
      const { data } = await api.get(`/analytics/${userId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All analytics endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const getUserStats = (userId) =>
  api.get(`/users/${userId}/stats`);

export const getUserAchievements = (userId) =>
  api.get(`/users/${userId}/achievements`);

// =============================================
// 📚 LESSONS AND CONTENT
// =============================================

export const getLessonById = (lessonId) =>
  api.get(`/lessons/${lessonId}`);

export const getAllLessons = () =>
  api.get(`/lessons`);

export const getTopics = () =>
  api.get(`/topics`);

export const getTopicById = (topicId) =>
  api.get(`/topics/${topicId}`);

export const getSubjects = () =>
  api.get(`/subjects`);

// =============================================
// 🔧 UTILITY FUNCTIONS
// =============================================

export const healthCheck = () =>
  api.get(`/health`);

export const authTest = () =>
  api.get(`/auth-test`);

// ✅ COMPREHENSIVE ERROR HANDLER FOR PAYMENTS
export const handlePaymentError = (error, context = 'Платежная операция') => {
  console.error(`❌ ${context} failed:`, error);
  
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему для совершения платежа';
  } else if (error.response?.status === 403) {
    return 'Доступ к платежной системе запрещен';
  } else if (error.response?.status === 404) {
    return 'Платежный сервис недоступен';
  } else if (error.response?.status >= 500) {
    return 'Ошибка платежного сервера. Попробуйте позже';
  } else if (error.message?.includes('timeout')) {
    return 'Превышено время ожидания. Проверьте интернет-соединение';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка при обработке платежа';
  }
};

// ✅ GENERAL ERROR HANDLER
export const handleApiError = (error, context = 'API call') => {
  console.error(`❌ ${context} failed:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });
  
  // Return user-friendly error message
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему';
  } else if (error.response?.status === 403) {
    return 'Доступ запрещен';
  } else if (error.response?.status === 404) {
    return 'Ресурс не найден';
  } else if (error.response?.status >= 500) {
    return 'Ошибка сервера. Попробуйте позже';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка';
  }
};

// ✅ BATCH OPERATIONS HELPER
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// =============================================
// 🧪 DEVELOPMENT TESTING HELPERS
// =============================================

// Test payment flow in development
export const testPaymentFlow = async (userId, plan = 'start') => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Test functions not available in production');
    return;
  }
  
  console.log('🧪 Testing payment flow:', { userId, plan });
  
  try {
    // 1. Validate user
    const userValidation = await validateUser(userId);
    console.log('👤 User validation:', userValidation);
    
    // 2. Set account state to waiting_payment
    const accountState = await setSandboxAccountState(userId, 'waiting_payment');
    console.log('🔧 Account state set:', accountState);
    
    // 3. Try promo code
    const promoResult = await applyPromoCode(userId, plan, 'acedpromocode2406');
    console.log('🎟️ Promo code result:', promoResult);
    
    if (!promoResult.success) {
      // 4. Try payment initiation
      const paymentResult = await initiatePaymePayment(userId, plan);
      console.log('💳 Payment initiation:', paymentResult);
    }
    
    return { success: true, message: 'Test completed' };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// List all available API functions for debugging
export const getAvailableApiFunctions = () => {
  return {
    payment: [
      'applyPromoCode',
      'initiatePaymePayment', 
      'checkPaymentStatus',
      'validateUser',
      'getPaymentAmounts',
      'formatPaymentAmount',
      'getTransactionStateText'
    ],
    sandbox: [
      'setSandboxAccountState',
      'setSandboxMerchantKey', 
      'listSandboxTransactions',
      'clearSandboxTransactions'
    ],
    user: [
      'getUserInfo',
      'getUserStatus', 
      'saveUser',
      'updateUserProfile'
    ],
    content: [
      'getLessonById',
      'getAllLessons',
      'getTopics',
      'getTopicById',
      'getSubjects'
    ],
    homework: [
      'getHomeworkByLesson',
      'getAllHomeworks',
      'saveHomework',
      'submitHomework',
      'getStandaloneHomework',
      'saveStandaloneHomework',
      'submitStandaloneHomework'
    ],
    tests: [
      'getAvailableTests',
      'getTestById', 
      'submitTestResult',
      'getTestResult',
      'getUserTestResults'
    ],
    progress: [
      'submitProgress',
      'getLessonProgress',
      'getUserProgress',
      'getUserProgressStats',
      'getLessonProgressStats',
      'getTopicsProgress',
      'getUserPoints'
    ],
    analytics: [
      'getUserAnalytics',
      'getUserStats',
      'getUserAchievements'
    ],
    utility: [
      'healthCheck',
      'authTest',
      'handleApiError',
      'handlePaymentError',
      'retryApiCall'
    ]
  };
};

export default api;