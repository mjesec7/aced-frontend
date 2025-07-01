// src/api.js - CLEAN AND FIXED VERSION
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

// ========================================
// 🚫 REQUEST DEBOUNCING & LOOP PREVENTION
// ========================================

const requestCache = new Map();
const pendingRequests = new Map();
const CACHE_DURATION = 5000; // 5 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Request deduplication helper
const createRequestKey = (config) => {
  if (!config || !config.method || !config.url) {
    console.warn('⚠️ Invalid config object in createRequestKey:', config);
    return `unknown-${Date.now()}`;
  }
  
  return `${config.method}-${config.url}-${JSON.stringify(config.data || {})}`;
};

// Debounce function to prevent rapid consecutive requests
const debounceRequest = (fn, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

// Request attempt tracking
const requestAttempts = new Map();
const MAX_PAYMENT_ATTEMPTS = 3;
const PAYMENT_COOLDOWN = 5000; // 5 seconds

const trackPaymentAttempt = (userId, operation) => {
  const key = `${userId}-${operation}`;
  const now = Date.now();
  
  if (!requestAttempts.has(key)) {
    requestAttempts.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
    return true;
  }
  
  const attempts = requestAttempts.get(key);
  
  // Reset if cooldown period has passed
  if (now - attempts.lastAttempt > PAYMENT_COOLDOWN) {
    requestAttempts.set(key, { count: 1, firstAttempt: now, lastAttempt: now });
    return true;
  }
  
  // Check if max attempts reached
  if (attempts.count >= MAX_PAYMENT_ATTEMPTS) {
    console.warn(`🚫 Payment attempt limit reached for ${key}`);
    return false;
  }
  
  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;
  requestAttempts.set(key, attempts);
  
  return true;
};

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

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  try {
    const requestKey = createRequestKey(config);
    
    // Check for pending duplicate requests
    if (pendingRequests.has(requestKey)) {
      console.log('🔄 Reusing pending request:', requestKey);
      return pendingRequests.get(requestKey);
    }
    
    // Check request cache
    const cached = requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached response:', requestKey);
      return Promise.resolve(cached.response);
    }
    
    // Special handling for payment endpoints
    if (config.url?.includes('/payment') || config.url?.includes('/payme')) {
      config.headers['X-Request-Source'] = 'frontend';
      config.headers['X-User-Agent'] = navigator.userAgent.substring(0, 50);
    }
    
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

// ✅ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests only
    if (response.config?.method?.toLowerCase() === 'get') {
      try {
        const requestKey = createRequestKey(response.config);
        if (requestKey && requestKey !== `unknown-${Date.now()}`) {
          requestCache.set(requestKey, {
            response: response,
            timestamp: Date.now()
          });
          
          // Clean old cache entries
          if (requestCache.size > 100) {
            const cutoff = Date.now() - CACHE_DURATION;
            for (const [key, value] of requestCache.entries()) {
              if (value.timestamp < cutoff) {
                requestCache.delete(key);
              }
            }
          }
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache error:', cacheError);
      }
    }
    
    // Remove from pending requests
    try {
      const requestKey = createRequestKey(response.config);
      if (requestKey && pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    } catch (pendingError) {
      console.warn('⚠️ Pending request cleanup error:', pendingError);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Remove from pending requests on error
    if (originalRequest) {
      try {
        const requestKey = createRequestKey(originalRequest);
        if (requestKey && pendingRequests.has(requestKey)) {
          pendingRequests.delete(requestKey);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Error cleanup failed:', cleanupError);
      }
    }
    
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
    
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429 && originalRequest._retryCount < MAX_RETRY_ATTEMPTS) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = RETRY_DELAY * originalRequest._retryCount;
      
      console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${originalRequest._retryCount})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// =============================================
// 💳 PAYME PAYMENT API FUNCTIONS
// =============================================

// ✅ PAYME ERROR CODES HANDLER
export const getPaymeErrorMessage = (errorCode) => {
  const errorMessages = {
    '-31601': 'Мерчант не найден или заблокирован',
    '-31610': 'Введено неверное значение поля',
    '-31611': 'Сумма платежа меньше допустимой',
    '-31612': 'Сумма платежа больше допустимой',
    '-31622': 'Сервис мерчанта недоступен',
    '-31623': 'Сервис мерчанта работает некорректно',
    '-31630': 'Ошибка оплаты: недостаточно средств, неверные данные карты или карта заблокирована'
  };
  
  return errorMessages[errorCode] || `Ошибка PayMe: ${errorCode}`;
};

export const getPaymentAmounts = () => {
  return {
    start: {
      tiyin: 26000000,  // 260,000 UZS in tiyin (260,000 * 100)
      uzs: 260000,      // 260,000 UZS  
      label: 'Start'
    },
    pro: {
      tiyin: 45500000,  // 455,000 UZS in tiyin (455,000 * 100)
      uzs: 455000,      // 455,000 UZS
      label: 'Pro'
    }
  };
};

// ✅ FORMAT PAYMENT AMOUNT FUNCTION
export const formatPaymentAmount = (amount, currency = 'UZS') => {
  try {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
      console.warn('⚠️ Invalid amount for formatting:', amount);
      return `${amount} сум`;
    }
    
    if (currency === 'UZS') {
      return new Intl.NumberFormat('uz-UZ', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numAmount) + ' сум';
    }
    
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  } catch (error) {
    console.warn('⚠️ Currency formatting failed, using fallback:', error);
    const numAmount = Number(amount) || 0;
    return `${numAmount.toLocaleString('uz-UZ')} сум`;
  }
};

// ✅ DIRECT PAYME URL GENERATION (for GET method)
// ✅ FIX: Direct PayMe URL generation with proper format
// ✅ CORRECTED Direct PayMe URL generation
const generateDirectPaymeUrl = async (userId, plan, options = {}) => {
  try {
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Неизвестный план: ${plan}`);
    }
    
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    if (!merchantId) {
      throw new Error('Merchant ID not configured');
    }
    
    // Simple order ID
    const orderId = Date.now().toString().substr(-9);
    
    // Build parameters EXACTLY as in documentation
    const params = [];
    params.push(`m=${merchantId}`);
    params.push(`ac.order_id=${orderId}`);
    params.push(`a=${planAmount}`);
    
    if (options.lang) {
      params.push(`l=${options.lang}`);
    }
    
    const paramString = params.join(';');
    console.log('📝 Frontend param string:', paramString);
    
    const base64Params = btoa(paramString);
    const paymentUrl = `https://checkout.paycom.uz/${base64Params}`;
    
    console.log('🔗 Generated PayMe URL:', {
      merchantId,
      orderId,
      amount: planAmount,
      paramString,
      base64Params,
      paymentUrl,
      decoded: atob(base64Params)
    });
    
    return {
      success: true,
      paymentUrl: paymentUrl,
      method: 'get',
      transaction: {
        id: orderId,
        amount: planAmount,
        plan: plan
      }
    };
  } catch (error) {
    console.error('❌ Direct URL generation error:', error);
    return {
      success: false,
      error: error.message || 'Ошибка генерации URL'
    };
  }
};

// ✅ Direct PayMe form generation with IKPU
const generateDirectPaymeForm = async (userId, plan, options = {}) => {
  try {
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Неизвестный план: ${plan}`);
    }
    
    const orderId = Date.now().toString().substr(-9);
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    
    // Create detail object with IKPU
    const detail = {
      receipt_type: 0,
      items: [{
        title: `ACED ${plan.toUpperCase()} Subscription`,
        price: planAmount,
        count: 1,
        code: "10899002001000000", // Your IKPU
        vat_percent: 0,
        package_code: "1"
      }]
    };
    
    const detailBase64 = btoa(JSON.stringify(detail));
    
    const formHtml = `
      <form id="payme-form" method="POST" action="https://checkout.paycom.uz">
        <input type="hidden" name="merchant" value="${merchantId}" />
        <input type="hidden" name="amount" value="${planAmount}" />
        <input type="hidden" name="account[order_id]" value="${orderId}" />
        <input type="hidden" name="lang" value="${options.lang || 'ru'}" />
        <input type="hidden" name="description" value="ACED ${plan} subscription" />
        <input type="hidden" name="detail" value="${detailBase64}" />
        <input type="hidden" name="callback" value="${window.location.origin}/payment/success" />
        <input type="hidden" name="callback_timeout" value="15000" />
      </form>
      <script>
        document.getElementById('payme-form').submit();
      </script>
    `;
    
    return {
      success: true,
      method: 'post',
      formHtml: formHtml,
      transaction: {
        id: orderId,
        amount: planAmount,
        plan: plan
      }
    };
  } catch (error) {
    console.error('❌ Form generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ DIRECT PAYME FORM GENERATION (for POST method)
const generateDirectPaymeForm = async (userId, plan, options = {}) => {
  try {
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Неизвестный план: ${plan}`);
    }
    
    const orderId = `${userId}_${plan}_${Date.now()}`;
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID || 'demo_merchant';
    
    const checkoutUrl = import.meta.env.VITE_PAYME_TEST_MODE === 'true' 
      ? 'https://test.paycom.uz' 
      : 'https://checkout.paycom.uz';
    
    // Generate form HTML according to PayMe documentation
    const formHtml = `
      <form id="payme-form" method="POST" action="${checkoutUrl}">
        <input type="hidden" name="merchant" value="${merchantId}" />
        <input type="hidden" name="amount" value="${planAmount}" />
        <input type="hidden" name="account[user_id]" value="${userId}" />
        <input type="hidden" name="account[plan]" value="${plan}" />
        <input type="hidden" name="account[order_id]" value="${orderId}" />
        <input type="hidden" name="lang" value="${options.lang || 'ru'}" />
        <input type="hidden" name="description" value="Оплата подписки ${plan}" />
        ${options.callback ? `<input type="hidden" name="callback" value="${options.callback}" />` : ''}
        ${options.callback_timeout ? `<input type="hidden" name="callback_timeout" value="${options.callback_timeout}" />` : ''}
        <button type="submit">Оплатить через PayMe</button>
      </form>
    `;
    
    return {
      success: true,
      method: 'post',
      formHtml: formHtml,
      paymentUrl: checkoutUrl,
      transaction: {
        id: orderId,
        amount: planAmount,
        plan: plan
      }
    };
  } catch (error) {
    console.error('❌ Direct form generation error:', error);
    return {
      success: false,
      error: error.message || 'Ошибка генерации формы'
    };
  }
};

// ✅ PAYME PAYMENT INITIATION - MAIN FUNCTION
export const initiatePaymePayment = async (userId, plan, additionalData = {}) => {
  if (!trackPaymentAttempt(userId, 'payment-initiation')) {
    throw new Error('Слишком много попыток инициации платежа. Подождите несколько секунд.');
  }
  
  try {
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Неизвестный план: ${plan}`);
    }
    
    const payload = {
      userId,
      plan,
      amount: planAmount,
      method: additionalData.method || 'post',
      lang: additionalData.lang || 'ru',
      name: additionalData.name || 'User',
      email: additionalData.email || '',
      callback: additionalData.callback || `${window.location.origin}/payment/success`,
      callback_timeout: additionalData.callback_timeout || 15000,
      ...additionalData
    };
    
    console.log('🚀 Initiating PayMe payment:', payload);
    
    // For direct methods, use direct generation
    if (payload.method === 'get') {
      return await generateDirectPaymeUrl(userId, plan, payload);
    }
    
    if (payload.method === 'post') {
      return await generateDirectPaymeForm(userId, plan, payload);
    }
    
    // Try backend API call for other methods
    try {
      const response = await api.post('/payments/initiate', payload);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data,
          paymentUrl: response.data.paymentUrl,
          transaction: response.data.transaction,
          metadata: response.data.metadata
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }
    } catch (backendError) {
      // Fallback to direct generation
      console.warn('⚠️ Backend payment initiation failed, using direct generation');
      return await generateDirectPaymeUrl(userId, plan, payload);
    }
    
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Ошибка инициации платежа',
      details: error.response?.data
    };
  }
};

// ✅ PAYME FORM GENERATION FUNCTION
export const generatePaymeForm = async (userId, plan, method = 'post', options = {}) => {
  if (!trackPaymentAttempt(userId, 'form-generation')) {
    throw new Error('Слишком много попыток генерации формы. Подождите несколько секунд.');
  }
  
  try {
    // Use direct generation for better reliability
    if (method === 'get') {
      const result = await generateDirectPaymeUrl(userId, plan, { method, ...options });
      return {
        success: result.success,
        method: 'get',
        paymentUrl: result.paymentUrl,
        transaction: result.transaction,
        error: result.error
      };
    }
    
    if (method === 'post') {
      const result = await generateDirectPaymeForm(userId, plan, { method, ...options });
      return {
        success: result.success,
        method: 'post',
        formHtml: result.formHtml,
        paymentUrl: result.paymentUrl,
        transaction: result.transaction,
        error: result.error
      };
    }
    
    // For other methods, try backend with fallback
    try {
      const payload = {
        userId,
        plan,
        method,
        lang: options.lang || 'ru',
        style: options.style || 'colored',
        qrWidth: options.qrWidth || 250,
        name: options.name,
        phone: options.phone
      };
      
      const response = await api.post('/payments/generate-form', payload);
      
      if (response.data.success) {
        return {
          success: true,
          method: response.data.method,
          formHtml: response.data.formHtml,
          buttonHtml: response.data.buttonHtml,
          qrHtml: response.data.qrHtml,
          paymentUrl: response.data.paymentUrl,
          transaction: response.data.transaction
        };
      } else {
        throw new Error(response.data.message || 'Form generation failed');
      }
    } catch (backendError) {
      // Fallback to direct generation
      console.warn('⚠️ Backend form generation failed, using direct generation');
      return await generateDirectPaymeUrl(userId, plan, { method: 'get', ...options });
    }
  } catch (error) {
    console.error('❌ Form generation error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Генерация формы оплаты')
    };
  }
};

// ✅ PROMO CODE APPLICATION
export const applyPromoCode = debounceRequest(async (userId, plan, promoCode) => {
  if (!trackPaymentAttempt(userId, 'promo-code')) {
    throw new Error('Слишком много попыток применения промокода. Подождите несколько секунд.');
  }
  
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
}, 1000);

// ✅ PAYMENT STATUS CHECK
export const checkPaymentStatus = async (transactionId, userId = null) => {
  try {
    const url = userId 
      ? `/payments/status/${transactionId}/${userId}`
      : `/payments/status/${transactionId}`;
    
    console.log('🔍 Checking payment status:', { transactionId, userId });
    
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
    console.log('🔍 Validating user:', userId);
    
    const response = await api.get(`/payments/validate-user/${userId}`);
    
    return {
      success: true,
      valid: response.data.valid,
      user: response.data.user,
      source: response.data.source,
      note: response.data.note
    };
  } catch (error) {
    console.error('❌ User validation error:', error);
    return {
      success: false,
      valid: false,
      error: error.response?.data?.error || error.message
    };
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

// ✅ COMPREHENSIVE ERROR HANDLER FOR PAYMENTS
export const handlePaymentError = (error, context = 'Платежная операция') => {
  console.error(`❌ ${context} failed:`, error);
  
  // Check for PayMe specific error codes
  if (error.response?.data?.code && error.response.data.code.toString().startsWith('-316')) {
    return getPaymeErrorMessage(error.response.data.code);
  }
  
  // Check for rate limiting
  if (error.message?.includes('Слишком много попыток')) {
    return error.message;
  }
  
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему для совершения платежа';
  } else if (error.response?.status === 403) {
    return 'Доступ к платежной системе запрещен';
  } else if (error.response?.status === 404) {
    return 'Платежный сервис недоступен. Используется прямая интеграция.';
  } else if (error.response?.status === 429) {
    return 'Слишком много запросов. Подождите несколько секунд и попробуйте снова.';
  } else if (error.response?.status >= 500) {
    return 'Ошибка платежного сервера. Попробуйте позже';
  } else if (error.message?.includes('timeout')) {
    return 'Превышено время ожидания. Проверьте интернет-соединение';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка при обработке платежа';
  }
};

// ✅ PAYMENT ATTEMPT RESET UTILITY
export const resetPaymentAttempts = (userId) => {
  const keysToDelete = [];
  for (const [key] of requestAttempts.entries()) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => requestAttempts.delete(key));
  console.log(`🔄 Payment attempts reset for user ${userId}`);
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
// 📝 TESTS API
// =============================================

export const getAvailableTests = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/tests`);
    return data;
  } catch (error) {
    console.warn('⚠️ User tests endpoint failed, trying direct:', error.message);
    const { data } = await api.get(`/tests`);
    return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
  }
};

export const getTestById = async (userId, testId) => {
  try {
    const { data } = await api.get(`/users/${userId}/tests/${testId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test endpoint failed, trying direct:', error.message);
    const { data } = await api.get(`/tests/${testId}`);
    return { test: data };
  }
};

export const submitTestResult = async (userId, testId, answers) => {
  try {
    const { data } = await api.post(`/users/${userId}/tests/${testId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User test submit endpoint failed, trying direct:', error.message);
    const { data } = await api.post(`/tests/${testId}/submit`, { userId, answers });
    return data;
  }
};

export const getTestResult = async (userId, testId) => {
  try {
    const { data } = await api.get(`/users/${userId}/tests/${testId}/result`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test result endpoint failed:', error.message);
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
// 📚 HOMEWORK API
// =============================================

export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    const { data } = await api.get(`/users/${userId}/homeworks/lesson/${lessonId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User homework endpoint failed, trying fallback:', error.message);
    
    try {
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
    const { data } = await api.get(`/users/${userId}/homeworks`);
    return data;
  } catch (error) {
    console.warn('⚠️ Enhanced homework endpoint failed, trying legacy:', error.message);
    
    try {
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
    const { data } = await api.post(`/users/${userId}/homeworks/save`, { 
      lessonId, 
      answers, 
      completed: false 
    });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework save endpoint failed, trying fallback:', error.message);
    
    try {
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
    const { data } = await api.post(`/users/${userId}/homeworks/lesson/${lessonId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework submit endpoint failed, trying fallback:', error.message);
    
    try {
      const { data } = await api.post(`/homeworks/user/${userId}/lesson/${lessonId}/submit`, { answers });
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework submit endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

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
// 📊 ANALYTICS
// =============================================

export const getUserAnalytics = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/analytics`);
    return data;
  } catch (error) {
    console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
    
    try {
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
  
  if (error.response?.data?.code && error.response.data.code.toString().startsWith('-316')) {
    return getPaymeErrorMessage(error.response.data.code);
  }
  
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему';
  } else if (error.response?.status === 403) {
    return 'Доступ запрещен';
  } else if (error.response?.status === 404) {
    return 'Ресурс не найден';
  } else if (error.response?.status === 429) {
    return 'Слишком много запросов. Подождите и попробуйте снова.';
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
      
      if (error.response?.status === 401 || 
          error.response?.status === 403) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// ✅ REQUEST CLEANUP UTILITY
export const cleanupRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
  requestAttempts.clear();
  console.log('🧹 Request cache cleaned');
};

// =============================================
// 🧪 DEVELOPMENT TESTING HELPERS
// =============================================

export const testPaymentFlow = async (userId, plan = 'start') => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Test functions not available in production');
    return;
  }
  
  console.log('🧪 Testing payment flow:', { userId, plan });
  
  try {
    resetPaymentAttempts(userId);
    
    const userValidation = await validateUser(userId);
    console.log('👤 User validation:', userValidation);
    
    const promoResult = await applyPromoCode(userId, plan, 'acedpromocode2406');
    console.log('🎟️ Promo code result:', promoResult);
    
    if (!promoResult.success) {
      const paymentResult = await initiatePaymePayment(userId, plan);
      console.log('💳 Payment initiation:', paymentResult);
      
      if (paymentResult.success && paymentResult.paymentUrl) {
        console.log('✅ Payment URL generated successfully');
        console.log('🔗 URL:', paymentResult.paymentUrl);
      }
    }
    
    return { success: true, message: 'Test completed successfully' };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

export const checkApiHealth = async () => {
  try {
    console.log('🏥 Checking API health...');
    
    const healthResponse = await healthCheck();
    console.log('✅ Health check passed:', healthResponse.data);
    
    try {
      const authResponse = await authTest();
      console.log('✅ Auth test passed:', authResponse.data);
    } catch (authError) {
      console.warn('⚠️ Auth test failed (this is normal if not logged in):', authError.message);
    }
    
    return {
      success: true,
      health: healthResponse.data,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ API health check failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const getSystemStatus = () => {
  return {
    environment: import.meta.env.MODE,
    baseUrl: BASE_URL,
    cacheSize: requestCache.size,
    pendingRequests: pendingRequests.size,
    trackedAttempts: requestAttempts.size,
    auth: {
      hasUser: !!auth.currentUser,
      isRefreshing: isRefreshing,
      queueSize: failedQueue.length
    },
    timestamp: new Date().toISOString()
  };
};

// ✅ ALIASES FOR BACKWARDS COMPATIBILITY
export const generatePaymentForm = generatePaymeForm;
export const executePaymentFlow = initiatePaymePayment;

export default api;