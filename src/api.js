// src/api.js - COMPLETE FIXED VERSION FOR FRONTEND-BACKEND MATCHING
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

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
      return pendingRequests.get(requestKey);
    }
    
    // Check request cache
    const cached = requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
        
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        processQueue(null, freshToken);
        isRefreshing = false;
        
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    
    // Handle rate limiting (429) with retry
    if (error.response?.status === 429 && originalRequest._retryCount < MAX_RETRY_ATTEMPTS) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = RETRY_DELAY * originalRequest._retryCount;
      
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
      tiyin: 26000000,  // 260,000 UZS in tiyin
      uzs: 260000,      // 260,000 UZS
      label: 'Start Plan'
    },
    pro: {
      tiyin: 45500000,  // 455,000 UZS in tiyin
      uzs: 455000,      // 455,000 UZS
      label: 'Pro Plan'
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

// ✅ DIRECT PAYME URL GENERATION (GET method)
const generateDirectPaymeUrl = async (userId, plan, options = {}) => {
  try {
    // Get merchant ID with validation
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    
    if (!merchantId || merchantId === 'undefined' || typeof merchantId !== 'string') {
      console.error('❌ VITE_PAYME_MERCHANT_ID not loaded properly');
      console.error('Current value:', merchantId, 'Type:', typeof merchantId);
      throw new Error('PayMe Merchant ID not configured. Check your .env file.');
    }
    
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Plan "${plan}" not found. Available: start, pro`);
    }
    
    // Generate clean order ID (alphanumeric only)
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6);
    const orderId = `aced${timestamp}${randomPart}`;
    
    // Build parameters according to GET documentation
    const params = [];
    params.push(`m=${merchantId}`);
    params.push(`ac.Login=${orderId}`);
    params.push(`a=${planAmount}`);
    
    if (options.lang && ['ru', 'uz', 'en'].includes(options.lang)) {
      params.push(`l=${options.lang}`);
    }
    
    if (options.callback) {
      params.push(`c=${encodeURIComponent(options.callback)}`);
    }
    
    if (options.callback_timeout) {
      params.push(`ct=${options.callback_timeout}`);
    }
    
    // Join with semicolon as per documentation
    const paramString = params.join(';');
    
    // Validate no undefined values
    if (paramString.includes('undefined') || paramString.includes('null')) {
      throw new Error('Parameter string contains invalid values: ' + paramString);
    }
    
    // Base64 encode
    const base64Params = btoa(paramString);
    const paymentUrl = `https://checkout.paycom.uz/${base64Params}`;
    
    // Final verification
    const verification = atob(base64Params);
    
    if (verification !== paramString) {
      throw new Error('URL encoding/decoding mismatch');
    }
    
    return {
      success: true,
      paymentUrl,
      method: 'GET',
      transaction: {
        id: orderId,
        amount: planAmount,
        plan
      }
    };
    
  } catch (error) {
    console.error('❌ GET URL generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ DIRECT PAYME FORM GENERATION (POST method)
const generateDirectPaymeForm = async (userId, plan, options = {}) => {
  try {
    // ✅ CRITICAL FIX: Clean merchant ID
    const merchantId = (import.meta.env.VITE_PAYME_MERCHANT_ID || '68016cc1a5e04614247f7174').trim();
    
    // ✅ VALIDATION: Check merchant ID
    if (!merchantId || merchantId === 'undefined' || merchantId.length < 10) {
      throw new Error('Invalid PayMe Merchant ID configuration');
    }
    
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Unknown plan: ${plan}`);
    }
    
    // ✅ CRITICAL FIX: Generate CLEAN order ID (only alphanumeric)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const orderId = options.Login || `aced${timestamp}${randomStr}`;
    
    // ✅ SANITIZE: Remove any special characters from order ID
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    
    // ✅ Create detail object as per PayMe documentation
    const detail = {
      receipt_type: 0,
      items: [{
        title: `ACED ${plan.toUpperCase()} Subscription`,
        price: planAmount,
        count: 1,
        code: "10899002001000000", // IKPU code for digital services
        vat_percent: 0,
        package_code: "123456"
      }]
    };
    
    // ✅ Safe JSON encoding
    let detailBase64;
    try {
      const detailJson = JSON.stringify(detail);
      detailBase64 = btoa(unescape(encodeURIComponent(detailJson)));
    } catch (encodingError) {
      console.error('❌ Detail encoding failed:', encodingError);
      detailBase64 = ''; // Fallback to empty detail
    }
    
    // ✅ Generate clean callback URL
    const callbackUrl = options.callback || `${window.location.origin}/payment/success`;
    const cleanCallback = encodeURIComponent(callbackUrl);
    
    // ✅ Validate language parameter
    const validLanguages = ['ru', 'uz', 'en'];
    const language = validLanguages.includes(options.lang) ? options.lang : 'ru';
    
    // ✅ Validate timeout parameter
    const callbackTimeout = options.callback_timeout && Number.isInteger(Number(options.callback_timeout)) 
      ? options.callback_timeout 
      : 15000;
    
    // ✅ Generate form HTML exactly as per POST documentation
    const formHtml = `
    <form method="POST" action="https://checkout.paycom.uz/" id="payme-form" style="display: none;">
      <!-- Required fields -->
      <input type="hidden" name="merchant" value="${merchantId}"/>
      <input type="hidden" name="amount" value="${planAmount}"/>
      <input type="hidden" name="account[Login]" value="${cleanOrderId}"/>
      
      <!-- Optional fields -->
      <input type="hidden" name="lang" value="${language}"/>
      <input type="hidden" name="callback" value="${cleanCallback}"/>
      <input type="hidden" name="callback_timeout" value="${callbackTimeout}"/>
      <input type="hidden" name="description" value="ACED ${plan.toUpperCase()} Plan Subscription"/>
      ${detailBase64 ? `<input type="hidden" name="detail" value="${detailBase64}"/>` : ''}
      
      <!-- Submit button (hidden, auto-submit) -->
      <button type="submit" style="display: none;">Pay with PayMe</button>
    </form>
    
    <script>
      // Wait for DOM to be ready
      function submitPaymeForm() {
        const form = document.getElementById('payme-form');
        if (form) {
          form.submit();
        } else {
          console.error('❌ PayMe form not found in DOM');
        }
      }
      
      // Auto-submit after short delay
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(submitPaymeForm, 1000);
        });
      } else {
        setTimeout(submitPaymeForm, 1000);
      }
    </script>
    `;
    
    return {
      success: true,
      formHtml,
      method: 'POST',
      transaction: {
        id: cleanOrderId,
        amount: planAmount,
        plan: plan,
        merchantId: merchantId
      }
    };
    
  } catch (error) {
    console.error('❌ POST form generation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate PayMe POST form'
    };
  }
};

// ✅ PAYMENT INITIATION - ENHANCED VERSION
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
    
    // Try backend endpoint first
    try {
      const response = await api.post('/payments/initiate', {
        userId: userId,
        plan: plan,
        name: additionalData.name || 'User',
        phone: additionalData.phone || '',
        ...additionalData
      });
      
      if (response.data.success) {
        return {
          success: true,
          paymentUrl: response.data.paymentUrl,
          transaction: response.data.transaction,
          method: 'REDIRECT',
          message: response.data.message
        };
      }
    } catch (backendError) {
      console.warn('⚠️ Backend payment endpoint failed, using direct generation:', backendError.message);
    }
    
    // Fallback to direct generation
    const method = additionalData.method || 'get';
    
    if (method === 'get') {
      const result = await generateDirectPaymeUrl(userId, plan, additionalData);
      if (result.success) {
        return {
          success: true,
          paymentUrl: result.paymentUrl,
          transaction: result.transaction,
          method: 'GET',
          message: 'Payment URL generated successfully'
        };
      } else {
        throw new Error(result.error);
      }
    }
    
    if (method === 'post') {
      const result = await generateDirectPaymeForm(userId, plan, additionalData);
      if (result.success) {
        return {
          success: true,
          formHtml: result.formHtml,
          transaction: result.transaction,
          method: 'POST',
          message: 'Payment form generated successfully'
        };
      } else {
        throw new Error(result.error);
      }
    }
    
    // Default fallback to GET method
    const result = await generateDirectPaymeUrl(userId, plan, additionalData);
    if (result.success) {
      return {
        success: true,
        paymentUrl: result.paymentUrl,
        transaction: result.transaction,
        method: 'GET',
        message: 'Payment URL generated successfully (fallback)'
      };
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    
    return {
      success: false,
      error: error.message || 'Ошибка инициации платежа',
      details: error
    };
  }
};

// ✅ PAYME FORM GENERATION FUNCTION
export const generatePaymeForm = async (userId, plan, method = 'post', options = {}) => {
  if (!trackPaymentAttempt(userId, 'form-generation')) {
    throw new Error('Слишком много попыток генерации формы. Подождите несколько секунд.');
  }
  
  try {
    // Try backend endpoint first
    try {
      const response = await api.post('/payments/generate-form', {
        userId: userId,
        plan: plan,
        method: method,
        lang: options.lang || 'ru',
        style: options.style || 'colored',
        qrWidth: options.qrWidth || 250,
        callback: options.callback,
        ...options
      });
      
      if (response.data.success) {
        return {
          success: true,
          method: response.data.method,
          formHtml: response.data.formHtml,
          paymentUrl: response.data.paymentUrl,
          buttonHtml: response.data.buttonHtml,
          qrHtml: response.data.qrHtml,
          transaction: response.data.transaction,
          debug: response.data.debug
        };
      }
    } catch (backendError) {
      console.warn('⚠️ Backend form generation failed, using direct generation:', backendError.message);
    }
    
    // Fallback to direct generation
    if (method === 'get') {
      const result = await generateDirectPaymeUrl(userId, plan, { method, ...options });
      return {
        success: result.success,
        method: 'GET',
        paymentUrl: result.paymentUrl,
        transaction: result.transaction,
        error: result.error
      };
    }
    
    if (method === 'post') {
      const result = await generateDirectPaymeForm(userId, plan, { method, ...options });
      return {
        success: result.success,
        method: 'POST',
        formHtml: result.formHtml,
        transaction: result.transaction,
        error: result.error
      };
    }
    
    // Default fallback
    const result = await generateDirectPaymeUrl(userId, plan, { method: 'get', ...options });
    return {
      success: result.success,
      method: 'GET',
      paymentUrl: result.paymentUrl,
      transaction: result.transaction,
      error: result.error
    };
    
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

// =============================================
// 📚 LESSON AND TOPIC API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get all topics with enhanced error handling
export const getTopics = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/topics?${queryString}` : '/topics';
    
    const { data } = await api.get(url);
    
    // Handle different response structures from backend
    if (data && data.success) {
      return {
        success: true,
        data: data.data || data.topics || []
      };
    } else if (Array.isArray(data)) {
      return {
        success: true,
        data: data
      };
    } else {
      return {
        success: true,
        data: []
      };
    }
  } catch (error) {
    console.error('❌ Failed to fetch topics:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// ✅ COMPLETELY FIXED: Get topic by ID with lessons fallback
export const getTopicById = async (topicId) => {
  try {
    console.log('🔍 API: Fetching topic by ID:', topicId);
    
    if (!topicId) {
      throw new Error('Topic ID is required');
    }
    
    // ✅ STRATEGY 1: Try the direct topics endpoint first
    try {
      const { data } = await api.get(`/topics/${topicId}`);
      console.log('📘 API: Raw topic response from /topics:', data);
      
      // Handle all possible response structures from your backend
      if (data && data.success === true) {
        if (data.data) {
          console.log('✅ API: Using success+data wrapper format');
          return {
            success: true,
            data: data.data,
            message: data.message,
            source: 'topics-endpoint'
          };
        }
      }
      
      if (data && data.exists === true) {
        if (data.data) {
          console.log('✅ API: Using exists+data wrapper format');
          return {
            success: true,
            exists: true,
            data: data.data,
            source: 'topics-endpoint'
          };
        }
      }
      
      if (data && (data._id || data.name)) {
        console.log('✅ API: Using direct topic object format');
        return {
          success: true,
          data: data,
          source: 'topics-endpoint'
        };
      }
      
    } catch (topicsError) {
      console.warn('⚠️ Topics endpoint failed:', topicsError.response?.status, topicsError.message);
      
      // If it's not a 404, throw the error
      if (topicsError.response?.status !== 404) {
        throw topicsError;
      }
      
      // If it's 404, continue to fallback strategy
      console.log('🔄 Topic not found in /topics, trying lessons fallback...');
    }
    
    // ✅ STRATEGY 2: Fallback - Build topic from lessons (like CataloguePage does)
    try {
      console.log('🔄 Building topic from lessons data...');
      
      // Get all lessons
      const { data: lessonsData } = await api.get('/lessons');
      const allLessons = Array.isArray(lessonsData) ? lessonsData : [];
      
      console.log(`📚 Found ${allLessons.length} total lessons`);
      
      // Filter lessons for this topic
      const topicLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        
        // Handle different topicId structures
        const lessonTopicId = lesson.topicId;
        
        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        } else if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }
        
        return false;
      });
      
      console.log(`📚 Found ${topicLessons.length} lessons for topic ${topicId}`);
      
      if (topicLessons.length === 0) {
        console.log('❌ No lessons found for this topicId');
        return {
          success: false,
          error: 'Topic not found',
          code: 404,
          details: `No lessons found for topic ID: ${topicId}`,
          source: 'lessons-fallback'
        };
      }
      
      // ✅ BUILD TOPIC DATA from lessons (same logic as CataloguePage)
      const firstLesson = topicLessons[0];
      
      // Extract topic name (same logic as CataloguePage getTopicName)
      const getTopicName = (lesson) => {
        if (!lesson) return 'Без темы';
        
        try {
          // Check different possible structures
          if (typeof lesson.topic === 'string') {
            return lesson.topic;
          }
          
          const lang = localStorage.getItem('lang') || 'en';
          
          if (lesson.translations && lesson.translations[lang] && lesson.translations[lang].topic) {
            return String(lesson.translations[lang].topic);
          }
          
          if (lesson.topic && typeof lesson.topic === 'object') {
            if (lesson.topic[lang]) {
              return String(lesson.topic[lang]);
            }
            if (lesson.topic.en) {
              return String(lesson.topic.en);
            }
          }
          
          return 'Без темы';
        } catch (error) {
          console.error('❌ Error getting topic name:', error);
          return 'Без темы';
        }
      };
      
      const topicName = getTopicName(firstLesson);
      
      // Calculate total lessons and time
      const totalLessons = topicLessons.length;
      const estimatedTime = totalLessons * 10; // 10 min per lesson estimate
      
      // Build the topic object
      const constructedTopic = {
        _id: topicId,
        id: topicId,
        name: topicName,
        topicName: topicName,
        description: `Курс по теме "${topicName}" содержит ${totalLessons} уроков`,
        topicDescription: `Курс по теме "${topicName}" содержит ${totalLessons} уроков`,
        subject: firstLesson.subject || 'Общий',
        level: firstLesson.level || 'Базовый',
        lessonCount: totalLessons,
        totalTime: estimatedTime,
        lessons: topicLessons,
        type: firstLesson.type || 'free',
        isActive: true,
        createdAt: firstLesson.createdAt,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'constructed-from-lessons',
          constructedAt: new Date().toISOString(),
          basedOnLessons: topicLessons.length,
          firstLessonId: firstLesson._id
        }
      };
      
      console.log('✅ Successfully constructed topic from lessons:', constructedTopic);
      
      return {
        success: true,
        data: constructedTopic,
        source: 'lessons-fallback',
        message: `Topic constructed from ${totalLessons} lessons`
      };
      
    } catch (lessonsError) {
      console.error('❌ Lessons fallback failed:', lessonsError);
      
      return {
        success: false,
        error: 'Topic not found and lessons fallback failed',
        code: 404,
        details: `Could not find topic ${topicId} in topics or lessons`,
        lessonsError: lessonsError.message,
        source: 'fallback-failed'
      };
    }
    
  } catch (error) {
    console.error('❌ API: Failed to fetch topic by ID:', error);
    
    // ✅ ENHANCED: Detailed error handling
    if (error.response?.status === 404) {
      console.log('📍 API: Topic not found (404)');
      return {
        success: false,
        error: 'Topic not found',
        code: 404,
        details: 'The requested topic does not exist'
      };
    }
    
    if (error.response?.status === 403) {
      return {
        success: false,
        error: 'Access denied',
        code: 403,
        details: 'You do not have permission to access this topic'
      };
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return {
        success: false,
        error: 'Network error',
        details: 'Unable to connect to the server'
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout',
        details: 'The request took too long to complete'
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        success: false,
        error: 'Server error',
        code: error.response.status,
        details: 'Internal server error occurred'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch topic',
      code: error.response?.status,
      details: error.response?.data || error
    };
  }
};

// ✅ FIXED: Get lessons by topic with enhanced fallback logic
export const getLessonsByTopic = async (topicId) => {
  try {
    // Try the enhanced lessons endpoint first
    try {
      const { data } = await api.get(`/lessons/topic/${topicId}?includeStats=true&sortBy=createdAt&order=asc`);
      
      if (data && data.success) {
        return {
          success: true,
          data: data.lessons || [],
          stats: data.stats
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lessons endpoint failed:', enhancedError.message);
    }
    
    // Fallback to topic-specific lessons endpoint
    try {
      const { data } = await api.get(`/topics/${topicId}/lessons`);
      
      if (data && data.success) {
        return {
          success: true,
          data: data.data || data.lessons || []
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          data: data
        };
      }
    } catch (fallbackError) {
      console.warn('⚠️ Topic lessons endpoint failed:', fallbackError.message);
    }
    
    // Final fallback - get all lessons and filter by topicId
    try {
      const { data } = await api.get('/lessons');
      const allLessons = Array.isArray(data) ? data : [];
      const filteredLessons = allLessons.filter(lesson => {
        return lesson.topicId === topicId || 
               lesson.topic === topicId ||
               (lesson.topicId && lesson.topicId._id === topicId) ||
               (lesson.topicId && lesson.topicId.toString() === topicId);
      });
      
      return {
        success: true,
        data: filteredLessons
      };
    } catch (finalError) {
      console.error('❌ Final fallback failed:', finalError.message);
    }
    
    return {
      success: true,
      data: []
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch lessons by topic:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// ✅ FIXED: Get all lessons with enhanced filtering
export const getAllLessons = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/lessons?${queryString}` : '/lessons';
    
    const { data } = await api.get(url);
    
    return {
      success: true,
      data: Array.isArray(data) ? data : []
    };
  } catch (error) {
    console.error('❌ Failed to fetch all lessons:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// ✅ FIXED: Get lesson by ID with enhanced error handling
export const getLessonById = async (lessonId) => {
  try {
    const { data } = await api.get(`/lessons/${lessonId}`);
    
    // Handle different response structures from your backend
    if (data && data.success) {
      return {
        success: true,
        data: data.lesson,
        topic: data.topic,
        stats: data.stats
      };
    } else if (data && (data._id || data.lessonName)) {
      return {
        success: true,
        data: data
      };
    } else {
      throw new Error('Invalid lesson data structure');
    }
  } catch (error) {
    console.error('❌ Failed to fetch lesson by ID:', error);
    
    // Provide specific error handling
    if (error.response?.status === 404) {
      throw new Error('Lesson not found');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this lesson');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    
    throw error; // Re-throw for proper error handling in components
  }
};

// =============================================
// 📊 USER PROGRESS API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Submit progress with multiple endpoint fallbacks
export const submitProgress = async (userId, progressData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Enhanced progress data with all required fields
    const enhancedData = {
      userId: userId,
      lessonId: progressData.lessonId,
      topicId: progressData.topicId || progressData.lessonId,
      completedSteps: progressData.completedSteps || [],
      progressPercent: progressData.progressPercent || 0,
      completed: progressData.completed || false,
      mistakes: progressData.mistakes || 0,
      stars: progressData.stars || 0,
      points: progressData.points || 0,
      duration: progressData.duration || progressData.durationSeconds || 0,
      hintsUsed: progressData.hintsUsed || 0,
      submittedHomework: progressData.submittedHomework || false,
      homeworkScore: progressData.homeworkScore || 0,
      medal: progressData.medal || 'none',
      ...progressData
    };
    
    // Try multiple endpoints based on your server.js emergency routes
    const endpoints = [
      `/users/${userId}/progress/save`,
      `/progress`,
      `/users/${userId}/lesson/${progressData.lessonId}`,
      `/user-progress`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const dataToSend = endpoint.includes('/progress') && !endpoint.includes('users') 
          ? enhancedData  // Include userId in data for general progress endpoint
          : { ...enhancedData, userId: undefined }; // Remove userId from data for user-specific endpoints
        
        const { data } = await api.post(endpoint, dataToSend, { headers, timeout: 15000 });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            endpoint: endpoint
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress save failed via ${endpoint}:`, endpointError.response?.status, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All progress save endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to save progress:', error);
    throw error;
  }
};

// ✅ FIXED: Get lesson progress with multiple endpoint support
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token available for progress');
      return { success: false, data: null };
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints as per your backend structure
    const endpoints = [
      `/users/${userId}/progress/lesson/${lessonId}`,
      `/user-progress/user/${userId}/lesson/${lessonId}`,
      `/user/${userId}/lesson/${lessonId}`,
      `/progress?userId=${userId}&lessonId=${lessonId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    // If no endpoint worked, return null progress
    return {
      success: true,
      data: null
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch lesson progress:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

// ✅ FIXED: Get user progress with enhanced support
export const getUserProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints
    const endpoints = [
      `/users/${userId}/progress`,
      `/user-progress/user/${userId}`,
      `/progress?userId=${userId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    return {
      success: true,
      data: []
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch user progress:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

// =============================================
// 📝 TESTS API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get available tests with fallback support
export const getAvailableTests = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      const { data } = await api.get(`/users/${userId}/tests`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User tests endpoint failed, trying direct:', error.message);
      const { data } = await api.get(`/tests`, { headers });
      return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch available tests:', error);
    return { tests: [], error: error.message };
  }
};

// ✅ FIXED: Get test by ID with fallback support
export const getTestById = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      const { data } = await api.get(`/users/${userId}/tests/${testId}`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test endpoint failed, trying direct:', error.message);
      const { data } = await api.get(`/tests/${testId}`, { headers });
      return { test: data };
    }
  } catch (error) {
    console.error('❌ Failed to fetch test by ID:', error);
    throw error;
  }
};

// ✅ FIXED: Submit test result with fallback support
export const submitTestResult = async (userId, testId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    try {
      const { data } = await api.post(`/users/${userId}/tests/${testId}/submit`, { answers }, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test submit endpoint failed, trying direct:', error.message);
      const { data } = await api.post(`/tests/${testId}/submit`, { userId, answers }, { headers });
      return data;
    }
  } catch (error) {
    console.error('❌ Failed to submit test result:', error);
    throw error;
  }
};

// ✅ FIXED: Get test result with enhanced error handling
export const getTestResult = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    const { data } = await api.get(`/users/${userId}/tests/${testId}/result`, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch test result:', error);
    throw error;
  }
};

// ✅ FIXED: Get user test results
export const getUserTestResults = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const { data } = await api.get(`/users/${userId}/tests/results`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test results endpoint failed:', error.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch user test results:', error);
    return { success: false, data: [], error: error.message };
  }
};

// =============================================
// 📚 HOMEWORK API FUNCTIONS - COMPLETELY FIXED
// =============================================

// ✅ HELPER: Build homework list from multiple sources
const buildHomeworkListFallback = async (token, userId, headers) => {
  let allHomeworks = [];
  let lessonsWithHomework = [];
  let userProgress = [];

  // Get standalone homework
  try {
    console.log('📚 Fetching standalone homework...');
    const { data: hwResponse } = await api.get('/homeworks', { headers });
    allHomeworks = hwResponse.data || hwResponse || [];
    console.log(`📚 Found ${allHomeworks.length} standalone homework`);
  } catch (hwError) {
    console.warn('⚠️ Could not fetch standalone homework:', hwError.message);
  }

  // Get lessons with homework
  try {
    console.log('📖 Fetching lessons with homework...');
    const { data: lessonsResponse } = await api.get('/lessons', { headers });
    const allLessons = lessonsResponse.data || lessonsResponse || [];
    lessonsWithHomework = allLessons.filter(lesson => 
      lesson.homework && Array.isArray(lesson.homework) && lesson.homework.length > 0
    );
    console.log(`📖 Found ${lessonsWithHomework.length} lessons with homework`);
  } catch (lessonsError) {
    console.warn('⚠️ Could not fetch lessons:', lessonsError.message);
  }

  // Get user progress
  try {
    console.log('📊 Fetching user progress...');
    
    // Try multiple progress endpoints
    const progressEndpoints = [
      `/users/${userId}/progress`,
      `/progress?userId=${userId}`,
      `/user-progress/${userId}`
    ];
    
    for (const endpoint of progressEndpoints) {
      try {
        const { data: progressResponse } = await api.get(endpoint, { headers });
        userProgress = progressResponse.data || progressResponse || [];
        
        if (Array.isArray(userProgress)) {
          console.log(`📊 Found ${userProgress.length} progress records from ${endpoint}`);
          break;
        }
      } catch (progressError) {
        console.warn(`⚠️ Progress endpoint ${endpoint} failed:`, progressError.message);
        continue;
      }
    }
  } catch (generalProgressError) {
    console.warn('⚠️ Could not fetch user progress:', generalProgressError.message);
  }

  // Combine all sources
  const combinedHomeworks = [];

  // Add standalone homework with progress
  allHomeworks.forEach(hw => {
    const userHwProgress = userProgress.find(up => 
      up.homeworkId === hw._id || 
      (up.metadata && up.metadata.standaloneHomeworkId === hw._id)
    );
    
    combinedHomeworks.push({
      ...hw,
      type: 'standalone',
      hasProgress: !!userHwProgress,
      completed: userHwProgress?.completed || false,
      score: userHwProgress?.score || 0,
      stars: userHwProgress?.stars || 0,
      userProgress: userHwProgress,
      exerciseCount: (hw.exercises || []).length,
      metadata: {
        type: 'standalone',
        homeworkTitle: hw.title,
        hasUserProgress: !!userHwProgress,
        progressId: userHwProgress?._id,
        source: 'fallback-standalone'
      }
    });
  });

  // Add lesson-based homework with progress
  lessonsWithHomework.forEach(lesson => {
    const userLessonProgress = userProgress.find(up => 
      up.lessonId === lesson._id ||
      (up.metadata && up.metadata.lessonId === lesson._id)
    );
    
    combinedHomeworks.push({
      lessonId: lesson._id,
      lessonName: lesson.lessonName || lesson.title,
      title: `Домашнее задание: ${lesson.lessonName || lesson.title}`,
      subject: lesson.subject,
      exercises: lesson.homework || [],
      exerciseCount: (lesson.homework || []).length,
      type: 'lesson',
      hasProgress: !!userLessonProgress,
      completed: userLessonProgress?.completed || false,
      score: userLessonProgress?.score || 0,
      stars: userLessonProgress?.stars || 0,
      userProgress: userLessonProgress,
      metadata: {
        type: 'lesson',
        lessonTitle: lesson.lessonName || lesson.title,
        hasUserProgress: !!userLessonProgress,
        progressId: userLessonProgress?._id,
        source: 'fallback-lesson'
      }
    });
  });

  // Remove duplicates and sort
  const uniqueHomeworks = combinedHomeworks.filter((hw, index, arr) => {
    return index === arr.findIndex(h => 
      (h._id && h._id === hw._id) || 
      (h.lessonId && h.lessonId === hw.lessonId)
    );
  });

  // Sort by priority: in-progress, pending, completed
  uniqueHomeworks.sort((a, b) => {
    const getStatus = (hw) => {
      if (!hw.hasProgress) return 'pending';
      if (!hw.completed) return 'in-progress';
      return 'completed';
    };
    
    const statusPriority = { 'in-progress': 0, 'pending': 1, 'completed': 2 };
    const aStatus = getStatus(a);
    const bStatus = getStatus(b);
    
    if (statusPriority[aStatus] !== statusPriority[bStatus]) {
      return statusPriority[aStatus] - statusPriority[bStatus];
    }
    
    return (a.title || a.lessonName || '').localeCompare(b.title || b.lessonName || '');
  });

  return uniqueHomeworks;
};

// ✅ FIXED: Get all homework with comprehensive endpoint support
export const getAllHomeworks = async (userId) => {
  try {
    console.log('📥 Fetching all homework for user:', userId);
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ STRATEGY 1: Try the enhanced user homework endpoint
    try {
      console.log('🔄 Trying enhanced user homework endpoint...');
      
      const { data } = await api.get(`/homeworks/user/${userId}`, { headers });
      
      if (data && data.success && Array.isArray(data.data)) {
        console.log(`✅ Enhanced endpoint success: ${data.data.length} homework items`);
        return {
          success: true,
          data: data.data,
          stats: data.stats,
          source: 'enhanced-endpoint'
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced homework endpoint failed:', enhancedError.message);
      
      if (enhancedError.response?.status >= 500) {
        // Server error - don't try fallbacks
        throw new Error('Ошибка сервера при загрузке домашних заданий');
      }
    }
    
    // ✅ STRATEGY 2: Try alternative user endpoints
    const alternativeEndpoints = [
      `/users/${userId}/homeworks`,
      `/homeworks/users/${userId}`,
      `/user/${userId}/homework`
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔄 Trying alternative endpoint: ${endpoint}`);
        
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          const homeworkData = data.data || data;
          
          if (Array.isArray(homeworkData) && homeworkData.length >= 0) {
            console.log(`✅ Alternative endpoint success: ${homeworkData.length} homework items`);
            return {
              success: true,
              data: homeworkData,
              stats: data.stats,
              source: `alternative-${endpoint}`
            };
          }
        }
      } catch (altError) {
        console.warn(`⚠️ Alternative endpoint ${endpoint} failed:`, altError.message);
        continue;
      }
    }
    
    // ✅ STRATEGY 3: Build homework list from multiple sources (fallback)
    console.log('🔄 Building homework list from multiple sources...');
    
    const fallbackHomeworks = await buildHomeworkListFallback(token, userId, headers);
    
    if (fallbackHomeworks.length > 0) {
      console.log(`✅ Fallback success: ${fallbackHomeworks.length} homework items`);
      return {
        success: true,
        data: fallbackHomeworks,
        source: 'fallback-aggregation'
      };
    }
    
    // ✅ STRATEGY 4: Return empty list if no errors (valid scenario)
    console.log('ℹ️ No homework found - returning empty list');
    return {
      success: true,
      data: [],
      source: 'empty-result'
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch all homework:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Ошибка загрузки домашних заданий'
    };
  }
};

// ✅ FIXED: Get homework by lesson with enhanced support
export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    console.log('📥 Fetching homework for lesson:', { userId, lessonId });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ Try the enhanced endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/lesson/${lessonId}`, { headers });
      
      if (data && data.success) {
        console.log('✅ Enhanced lesson homework endpoint success');
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lesson homework endpoint failed:', enhancedError.message);
    }
    
    // ✅ Fallback: Build from lesson data
    try {
      const { data: lessonData } = await api.get(`/lessons/${lessonId}`, { headers });
      
      if (!lessonData.homework || !Array.isArray(lessonData.homework) || lessonData.homework.length === 0) {
        return {
          success: false,
          error: 'В этом уроке нет домашнего задания'
        };
      }
      
      // Try to get user progress
      let userProgress = null;
      try {
        const progressEndpoints = [
          `/users/${userId}/progress/lesson/${lessonId}`,
          `/progress?userId=${userId}&lessonId=${lessonId}`,
          `/user-progress/lesson/${lessonId}?userId=${userId}`
        ];
        
        for (const endpoint of progressEndpoints) {
          try {
            const { data: progressData } = await api.get(endpoint, { headers });
            userProgress = progressData.data || progressData;
            break;
          } catch (progressError) {
            continue;
          }
        }
      } catch (progressError) {
        console.warn('⚠️ Could not fetch lesson progress:', progressError.message);
      }
      
      return {
        success: true,
        data: {
          homework: userProgress,
          questions: lessonData.homework,
          lessonInfo: {
            id: lessonData._id,
            name: lessonData.lessonName || lessonData.title,
            subject: lessonData.subject,
            instructions: lessonData.homeworkInstructions || ''
          }
        }
      };
      
    } catch (lessonError) {
      console.error('❌ Lesson fallback failed:', lessonError);
      throw new Error('Урок не найден или недоступен');
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch homework by lesson:', error);
    throw error;
  }
};

// ✅ FIXED: Get standalone homework
export const getStandaloneHomework = async (userId, homeworkId) => {
  try {
    console.log('📥 Fetching standalone homework:', { userId, homeworkId });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ Try the user-specific endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/homework/${homeworkId}`, { headers });
      
      if (data && data.success) {
        console.log('✅ User-specific standalone homework endpoint success');
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (userError) {
      console.warn('⚠️ User-specific standalone homework endpoint failed:', userError.message);
    }
    
    // ✅ Fallback: Get homework directly and combine with user progress
    try {
      const { data: homeworkData } = await api.get(`/homeworks/${homeworkId}`, { headers });
      
      if (!homeworkData || (!homeworkData.exercises && !homeworkData.data?.exercises)) {
        throw new Error('Домашнее задание не содержит упражнений');
      }
      
      const homework = homeworkData.data || homeworkData;
      
      // Try to get user progress
      let userProgress = null;
      try {
        const progressEndpoints = [
          `/users/${userId}/homework/${homeworkId}/progress`,
          `/progress?userId=${userId}&homeworkId=${homeworkId}`,
          `/user-progress/homework/${homeworkId}?userId=${userId}`
        ];
        
        for (const endpoint of progressEndpoints) {
          try {
            const { data: progressData } = await api.get(endpoint, { headers });
            userProgress = progressData.data || progressData;
            break;
          } catch (progressError) {
            continue;
          }
        }
      } catch (progressError) {
        console.warn('⚠️ Could not fetch homework progress:', progressError.message);
      }
      
      return {
        success: true,
        data: {
          homework: homework,
          userProgress: userProgress,
          questions: homework.exercises || []
        }
      };
      
    } catch (homeworkError) {
      console.error('❌ Homework fallback failed:', homeworkError);
      throw new Error('Домашнее задание не найдено');
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch standalone homework:', error);
    throw error;
  }
};

// ✅ FIXED: Save homework with multiple endpoint support
export const saveHomework = async (userId, lessonId, answers) => {
  try {
    console.log('💾 Saving homework:', { userId, lessonId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { 
      lessonId, 
      answers, 
      completed: false 
    };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/save`,
      `/users/${userId}/homework/save`,
      `/homework/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Homework saved via ${endpoint}`);
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Homework save endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All homework save endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to save homework:', error);
    throw error;
  }
};

// ✅ FIXED: Submit homework with multiple endpoint support
export const submitHomework = async (userId, lessonId, answers) => {
  try {
    console.log('📤 Submitting homework:', { userId, lessonId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/lesson/${lessonId}/submit`,
      `/users/${userId}/homework/lesson/${lessonId}/submit`,
      `/homework/lesson/${lessonId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Homework submitted via ${endpoint}`);
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Homework submit endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All homework submit endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to submit homework:', error);
    throw error;
  }
};

// ✅ FIXED: Standalone homework functions
export const saveStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    console.log('💾 Saving standalone homework:', { userId, homeworkId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/save`,
      `/users/${userId}/homework/${homeworkId}/save`,
      `/homework/${homeworkId}/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Standalone homework saved via ${endpoint}`);
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Standalone homework save endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All standalone homework save endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to save standalone homework:', error);
    throw error;
  }
};

export const submitStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    console.log('📤 Submitting standalone homework:', { userId, homeworkId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/submit`,
      `/users/${userId}/homework/${homeworkId}/submit`,
      `/homework/${homeworkId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Standalone homework submitted via ${endpoint}`);
          return {
            success: true,
            data: data.data || data
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Standalone homework submit endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All standalone homework submit endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to submit standalone homework:', error);
    throw error;
  }
};

// =============================================
// 👤 USER MANAGEMENT API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get user info with multiple endpoint support
export const getUserInfo = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    const { data } = await api.get(`/users/${userId}`, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch user info:', error);
    throw error;
  }
};

// ✅ FIXED: Get user status with multiple endpoint support
export const getUserStatus = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints for user status
    const endpoints = [
      `/users/${userId}/status`,
      `/users/${userId}`,
      `/user/${userId}/status`,
      `/user/${userId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            status: data.status || data.subscriptionPlan || data.data?.subscriptionPlan || 'free'
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Status endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }
    
    // If all fail, return default
    return {
      success: true,
      data: { subscriptionPlan: 'free' },
      status: 'free'
    };
    
  } catch (error) {
    console.error('❌ Failed to get user status:', error);
    return {
      success: false,
      data: { subscriptionPlan: 'free' },
      status: 'free',
      error: error.message
    };
  }
};

// ✅ FIXED: Save user with enhanced error handling
export const saveUser = async (userData) => {
  try {
    // This uses the emergency user save route from server.js
    const { data } = await api.post('/users/save', userData);
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Failed to save user:', error);
    throw error;
  }
};

// ✅ FIXED: Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    const { data } = await api.put(`/users/${userId}/profile`, profileData, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to update user profile:', error);
    throw error;
  }
};

// =============================================
// 📖 STUDY LIST MANAGEMENT - FIXED
// =============================================

export const getUserStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/study-list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get study list:', error);
    throw error;
  }
};

export const addToStudyList = async (userId, topicData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/study-list`, topicData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to add to study list:', error);
    throw error;
  }
};

export const removeFromStudyList = async (userId, topicId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.delete(`/users/${userId}/study-list/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to remove from study list:', error);
    throw error;
  }
};

export const cleanupStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/study-list/cleanup`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to cleanup study list:', error);
    throw error;
  }
};

// =============================================
// 🎯 RECOMMENDATIONS AND ANALYTICS - FIXED
// =============================================

export const getRecommendations = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get recommendations:', error);
    throw error;
  }
};

export const getUserProgressStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress stats:', error);
    throw error;
  }
};

export const getLessonProgressStats = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/progress/lesson/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get lesson progress stats:', error);
    throw error;
  }
};

export const getTopicsProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/topics-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get topics progress:', error);
    throw error;
  }
};

export const getUserPoints = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/points`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user points:', error);
    throw error;
  }
};

// =============================================
// 🎯 GOALS MANAGEMENT - FIXED
// =============================================

export const getUserGoals = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/goals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user goals:', error);
    throw error;
  }
};

export const createUserGoal = async (userId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/goals`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to create user goal:', error);
    throw error;
  }
};

export const updateUserGoal = async (userId, goalId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.put(`/users/${userId}/goals/${goalId}`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to update user goal:', error);
    throw error;
  }
};

export const deleteUserGoal = async (userId, goalId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.delete(`/users/${userId}/goals/${goalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to delete user goal:', error);
    throw error;
  }
};

// =============================================
// 📔 DIARY MANAGEMENT - FIXED
// =============================================

export const saveDiaryEntry = async (userId, diaryData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/diary`, diaryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to save diary entry:', error);
    throw error;
  }
};

export const getDiaryEntries = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get diary entries:', error);
    throw error;
  }
};

// =============================================
// 📊 ANALYTICS - FIXED
// =============================================

export const getUserAnalytics = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const { data } = await api.get(`/users/${userId}/analytics`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
      
      try {
        const { data } = await api.get(`/analytics/${userId}`, { headers });
        return data;
      } catch (fallbackError) {
        console.error('❌ All analytics endpoints failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch user analytics:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user stats:', error);
    throw error;
  }
};

export const getUserAchievements = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user achievements:', error);
    throw error;
  }
};

// =============================================
// 📚 SUBJECTS AND CONTENT - FIXED
// =============================================

export const getSubjects = async () => {
  try {
    const { data } = await api.get('/subjects');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error);
    return [];
  }
};

// =============================================
// 🔧 UTILITY FUNCTIONS - FIXED
// =============================================

export const healthCheck = async () => {
  try {
    const { data } = await api.get('/health');
    return data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

export const authTest = async () => {
  try {
    const { data } = await api.get('/auth-test');
    return data;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
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
};

// ✅ ERROR HANDLING WRAPPER
export const withErrorHandling = async (apiCall, context = 'API call') => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ ${context} failed:`, error);
    
    // Handle different error types
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
          return await apiCall();
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error('Authentication failed. Please log in again.');
      }
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

// =============================================
// 🧪 DEVELOPMENT TESTING HELPERS
// =============================================

export const testPaymentFlow = async (userId, plan = 'start') => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Test functions not available in production');
    return;
  }
  
  try {
    resetPaymentAttempts(userId);
    
    const userValidation = await validateUser(userId);
    
    const promoResult = await applyPromoCode(userId, plan, 'acedpromocode2406');
    
    if (!promoResult.success) {
      const paymentResult = await initiatePaymePayment(userId, plan);
      
      if (paymentResult.success && paymentResult.paymentUrl) {
        console.log('✅ Payment URL generated successfully');
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
    const healthResponse = await healthCheck();
    
    try {
      const authResponse = await authTest();
    } catch (authError) {
      console.warn('⚠️ Auth test failed (this is normal if not logged in):', authError.message);
    }
    
    return {
      success: true,
      health: healthResponse,
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

// ✅ PAYMENT ATTEMPT RESET UTILITY
export const resetPaymentAttempts = (userId) => {
  const keysToDelete = [];
  for (const [key] of requestAttempts.entries()) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => requestAttempts.delete(key));
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

// =============================================
// 🔍 DIAGNOSTIC TOOLS FOR DEBUGGING
// =============================================

export const diagnosticTool = {
  
  // Test backend connectivity
  async testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    
    try {
      // Test basic health check
      const healthResponse = await fetch(`${BASE_URL}/health`);
      const healthData = await healthResponse.json();
      
      // Test API health
      const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
      const apiHealthData = await apiHealthResponse.json();
      
      // Test routes endpoint
      const routesResponse = await fetch(`${BASE_URL}/api/routes`);
      const routesData = await routesResponse.json();
      
      return {
        success: true,
        health: healthData,
        apiHealth: apiHealthData,
        routes: routesData
      };
      
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Test critical endpoints
  async testCriticalEndpoints() {
    const endpoints = [
      { name: 'Topics List', url: '/api/topics', method: 'GET' },
      { name: 'Lessons List', url: '/api/lessons', method: 'GET' },
      { name: 'Topic by ID', url: '/api/topics/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'Lesson by ID', url: '/api/lessons/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'Topic Lessons', url: '/api/lessons/topic/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'User Status', url: '/api/users/testuser/status', method: 'GET' },
      { name: 'Payment Validation', url: '/api/payments/validate-user/testuser', method: 'GET' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        results[endpoint.name] = {
          status: response.status,
          success: response.ok,
          data: data,
          url: endpoint.url
        };
        
        if (response.ok) {
          console.log(`✅ ${endpoint.name}: Working`);
        } else {
          console.warn(`⚠️ ${endpoint.name}: ${response.status} - ${data.error || data.message || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.error(`❌ ${endpoint.name}: ${error.message}`);
        results[endpoint.name] = {
          status: 'ERROR',
          success: false,
          error: error.message,
          url: endpoint.url
        };
      }
    }
    
    return results;
  },
  
  // Test authentication flow
  async testAuthFlow() {
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Test token retrieval
        const token = await currentUser.getIdToken();
        
        // Test authenticated API call
        const response = await fetch(`${BASE_URL}/api/auth-test`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        return {
          success: true,
          user: {
            uid: currentUser.uid,
            email: currentUser.email
          },
          tokenValid: response.ok,
          authTest: data
        };
      } else {
        return {
          success: false,
          error: 'No authenticated user',
          message: 'Please log in first'
        };
      }
      
    } catch (error) {
      console.error('❌ Auth flow test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Test specific component endpoints
  async testComponentEndpoints(topicId, lessonId, userId) {
    const results = {};
    
    // Test topic loading (TopicOverview.vue)
    if (topicId) {
      try {
        const topicResult = await getTopicById(topicId);
        results.topicLoad = {
          success: topicResult.success,
          data: topicResult.data ? 'Data received' : 'No data',
          error: topicResult.error
        };
        
        if (topicResult.success) {
          const lessonsResult = await getLessonsByTopic(topicId);
          results.topicLessons = {
            success: lessonsResult.success,
            count: lessonsResult.data?.length || 0,
            error: lessonsResult.error
          };
        }
      } catch (error) {
        results.topicLoad = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Test lesson loading (LessonPage.vue)
    if (lessonId) {
      try {
        const lessonResult = await getLessonById(lessonId);
        results.lessonLoad = {
          success: true,
          data: lessonResult.data ? 'Data received' : 'No data',
          steps: lessonResult.data?.steps?.length || 0
        };
      } catch (error) {
        results.lessonLoad = {
          success: false,
          error: error.message
        };
      }
    }
    
    // Test user-specific endpoints
    if (userId) {
      try {
        const userStatusResult = await getUserStatus(userId);
        results.userStatus = {
          success: userStatusResult.success,
          status: userStatusResult.status,
          error: userStatusResult.error
        };
        
        if (lessonId) {
          const progressResult = await getLessonProgress(userId, lessonId);
          results.lessonProgress = {
            success: progressResult.success,
            hasProgress: !!progressResult.data,
            error: progressResult.error
          };
        }
      } catch (error) {
        results.userEndpoints = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  },
  
  // Test homework endpoints specifically
  async testHomeworkEndpoints(userId) {
    console.log('🔍 Testing homework endpoints for user:', userId);
    
    const results = {};
    
    // Test homework list endpoint
    try {
      const homeworkListResult = await getAllHomeworks(userId);
      results.homeworkList = {
        success: homeworkListResult.success,
        count: homeworkListResult.data?.length || 0,
        source: homeworkListResult.source,
        error: homeworkListResult.error
      };
    } catch (error) {
      results.homeworkList = {
        success: false,
        error: error.message
      };
    }
    
    // Test individual homework fetching if we have some homework
    if (results.homeworkList.success && results.homeworkList.count > 0) {
      try {
        const homeworkData = await getAllHomeworks(userId);
        const firstHomework = homeworkData.data[0];
        
        if (firstHomework.type === 'lesson' && firstHomework.lessonId) {
          const lessonHomeworkResult = await getHomeworkByLesson(userId, firstHomework.lessonId);
          results.lessonHomework = {
            success: lessonHomeworkResult.success,
            hasQuestions: !!lessonHomeworkResult.data?.questions?.length,
            error: lessonHomeworkResult.error
          };
        } else if (firstHomework.type === 'standalone' && firstHomework._id) {
          const standaloneResult = await getStandaloneHomework(userId, firstHomework._id);
          results.standaloneHomework = {
            success: standaloneResult.success,
            hasQuestions: !!standaloneResult.data?.questions?.length,
            error: standaloneResult.error
          };
        }
      } catch (error) {
        results.individualHomework = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }
};

// ✅ ALIASES FOR BACKWARDS COMPATIBILITY
export const generatePaymentForm = generatePaymeForm;
export const executePaymentFlow = initiatePaymePayment;

// =============================================
// 📱 MOBILE APP SUPPORT
// =============================================

// Detect if running in mobile app context
export const isMobileApp = () => {
  return typeof window !== 'undefined' && 
         (window.navigator.userAgent.includes('ACED-Mobile') ||
          window.cordova ||
          window.PhoneGap ||
          window.phonegap);
};

// Mobile-optimized API calls
export const mobileApiCall = async (endpoint, options = {}) => {
  if (isMobileApp()) {
    // Add mobile-specific headers
    options.headers = {
      ...options.headers,
      'X-Mobile-App': 'true',
      'X-App-Version': window.ACED_APP_VERSION || '1.0.0'
    };
  }
  
  return api(endpoint, options);
};

// =============================================
// 🔄 OFFLINE SUPPORT
// =============================================

// Check if online
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Queue offline requests
const offlineQueue = [];

export const queueOfflineRequest = (request) => {
  if (!isOnline()) {
    offlineQueue.push(request);
    return true;
  }
  return false;
};

// Process offline queue when back online
export const processOfflineQueue = async () => {
  if (isOnline() && offlineQueue.length > 0) {
    console.log(`📶 Processing ${offlineQueue.length} offline requests...`);
    const requests = [...offlineQueue];
    offlineQueue.length = 0; // Clear queue
    
    for (const request of requests) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Failed to process offline request:', error);
        // Re-queue failed requests
        offlineQueue.push(request);
      }
    }
  }
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue);
  window.addEventListener('offline', () => {
    console.log('📵 Device went offline');
  });
}

// ✅ VALIDATION HELPERS
export const validatePaymeUrl = (url) => {
  try {
    // Extract base64 part
    const base64Part = url.split('/').pop();
    
    // Decode and check
    const decoded = atob(base64Part);
    
    // Check for required parameters
    const hasValidMerchant = decoded.includes('m=') && !decoded.includes('m=undefined');
    const hasValidAmount = decoded.includes('a=') && /a=\d+/.test(decoded);
    const hasValidOrderId = decoded.includes('ac.Login=') && !decoded.includes('ac.Login=undefined');
    
    // Check for corruption
    const isCorrupted = decoded.includes('�') || 
                       decoded.includes('\f') || 
                       decoded.includes('\0') ||
                       decoded.includes('[object Object]');
    
    const validation = {
      isValid: hasValidMerchant && hasValidAmount && hasValidOrderId && !isCorrupted,
      hasValidMerchant,
      hasValidAmount,
      hasValidOrderId,
      isCorrupted,
      decodedParams: decoded
    };
    
    return validation;
    
  } catch (error) {
    console.error('❌ URL validation failed:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// ✅ TEST FUNCTIONS
export const testCleanUrlGeneration = async () => {
  try {
    const testResult = await generateDirectPaymeUrl('testuser123', 'start', {
      lang: 'ru',
      callback: 'https://aced.live/payment/success'
    });
    
    if (testResult.success) {
      const validation = validatePaymeUrl(testResult.paymentUrl);
      
      return {
        success: validation.isValid,
        url: testResult.paymentUrl,
        validation
      };
    } else {
      throw new Error(testResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ FINAL EXPORT
export default api;