// src/api.js - COMPLETE UPDATED VERSION WITH PAYME INTEGRATION
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

// Request deduplication helper - FIXED
const createRequestKey = (config) => {
  // Ensure config has required properties
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

// ✅ ENHANCED REQUEST INTERCEPTOR WITH LOOP PREVENTION
api.interceptors.request.use(async (config) => {
  try {
    // Create request key for deduplication
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
    
    // Special handling for payment endpoints - FIXED
    if (config.url?.includes('/payment') || config.url?.includes('/payme')) {
      // Only block specific webhook endpoints that cause loops
      const webhookEndpoints = ['/sandbox', '/payme'];
      const isWebhookEndpoint = webhookEndpoints.some(endpoint => config.url.includes(endpoint));
      
      // Allow legitimate API calls like /payments/validate-user, /payments/initiate, etc.
      const legitimateEndpoints = [
        '/payments/validate-user',
        '/payments/initiate',
        '/payments/status',
        '/payments/promo-code',
        '/payments/initialize',
        '/payments/verify-sms',
        '/payments/complete',
        '/payments/generate-form'
      ];
      
      const isLegitimateEndpoint = legitimateEndpoints.some(endpoint => config.url.includes(endpoint));
      
      if (isWebhookEndpoint && !isLegitimateEndpoint) {
        const userAgent = navigator.userAgent;
        const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome');
        
        if (isBrowser) {
          console.warn('🚫 Blocking webhook request to:', config.url);
          throw new Error('Direct browser access to payment webhook endpoints is not allowed');
        }
      }
      
      // Add special headers for payment requests
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

// ✅ ENHANCED RESPONSE INTERCEPTOR WITH FIXED CACHING
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
    
    // Remove from pending requests on error - with safety check
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
      message: error.response?.data?.message || error.message,
      isPaymentRequest: error.config?.url?.includes('/payment')
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
// 💳 PAYME PAYMENT API FUNCTIONS - COMPLETE IMPLEMENTATION
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

// ✅ PAYME ERROR CODES HANDLER (from documentation)
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

// ✅ PAYMENT METHOD SELECTOR HELPER
export const getOptimalPaymentMethod = (userAgent = navigator.userAgent, screenWidth = window.innerWidth) => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSmallScreen = screenWidth < 768;
  
  if (isMobile || isSmallScreen) {
    return 'qr'; // QR codes work well on mobile
  } else {
    return 'button'; // Buttons work well on desktop
  }
};

// ✅ PAYME FORM GENERATION FUNCTION (matches backend documentation)
export const generatePaymeForm = async (userId, plan, method = 'post', options = {}) => {
  if (!trackPaymentAttempt(userId, 'form-generation')) {
    throw new Error('Слишком много попыток генерации формы. Подождите несколько секунд.');
  }
  
  try {
    const payload = {
      userId,
      plan,
      method, // 'post', 'get', 'button', 'qr'
      lang: options.lang || 'ru',
      style: options.style || 'colored', // 'colored' or 'white'
      qrWidth: options.qrWidth || 250,
      name: options.name,
      phone: options.phone
    };
    
    console.log('🎨 Generating PayMe form:', payload);
    
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
      return {
        success: false,
        error: response.data.message || 'Form generation failed'
      };
    }
  } catch (error) {
    console.error('❌ Form generation error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Генерация формы оплаты')
    };
  }
};

// ✅ PAYME BUTTON INTEGRATION FUNCTION
export const createPaymeButton = async (userId, plan, containerId = 'payme-button-container', options = {}) => {
  try {
    const formResult = await generatePaymeForm(userId, plan, 'button', {
      style: options.style || 'colored', // 'colored' or 'white'
      lang: options.lang || 'ru',
      ...options
    });
    
    if (!formResult.success) {
      throw new Error(formResult.error);
    }
    
    // Insert the button HTML into the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = formResult.buttonHtml;
      
      return {
        success: true,
        message: 'PayMe button created successfully',
        transaction: formResult.transaction
      };
    } else {
      throw new Error(`Container ${containerId} not found`);
    }
  } catch (error) {
    console.error('❌ PayMe button creation error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Создание кнопки PayMe')
    };
  }
};

// ✅ PAYME QR CODE INTEGRATION FUNCTION
export const createPaymeQR = async (userId, plan, containerId = 'payme-qr-container', width = 250, options = {}) => {
  try {
    const formResult = await generatePaymeForm(userId, plan, 'qr', {
      qrWidth: width,
      lang: options.lang || 'ru',
      ...options
    });
    
    if (!formResult.success) {
      throw new Error(formResult.error);
    }
    
    // Insert the QR HTML into the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = formResult.qrHtml;
      
      return {
        success: true,
        message: 'PayMe QR code created successfully',
        transaction: formResult.transaction
      };
    } else {
      throw new Error(`Container ${containerId} not found`);
    }
  } catch (error) {
    console.error('❌ PayMe QR creation error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Создание QR-кода PayMe')
    };
  }
};

// ✅ PAYME GET URL GENERATION
export const generatePaymeUrl = async (userId, plan, options = {}) => {
  try {
    const formResult = await generatePaymeForm(userId, plan, 'get', options);
    
    if (!formResult.success) {
      throw new Error(formResult.error);
    }
    
    return {
      success: true,
      paymentUrl: formResult.paymentUrl,
      transaction: formResult.transaction
    };
  } catch (error) {
    console.error('❌ PayMe URL generation error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Генерация URL PayMe')
    };
  }
};

// ✅ PROMO CODE APPLICATION - WITH DEBOUNCING
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

// ✅ ENHANCED PAYME PAYMENT INITIATION
export const initiatePaymePayment = async (userId, plan, additionalData = {}) => {
  if (!trackPaymentAttempt(userId, 'payment-initiation')) {
    throw new Error('Слишком много попыток инициации платежа. Подождите несколько секунд.');
  }
  
  try {
    const payload = {
      userId,
      plan,
      method: additionalData.method || 'post', // Default to POST method
      ...additionalData
    };
    
    console.log('🚀 Initiating PayMe payment:', payload);
    
    // First try to generate the form if method is specified
    if (payload.method !== 'direct') {
      const formResult = await generatePaymeForm(userId, plan, payload.method, additionalData);
      if (formResult.success) {
        return formResult;
      }
    }
    
    // Fallback to direct payment initiation
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
      return {
        success: false,
        error: response.data.message || 'Payment initiation failed'
      };
    }
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    
    // Special handling for loop prevention errors
    if (error.message?.includes('Direct browser access')) {
      return {
        success: false,
        error: 'Ошибка конфигурации платежной системы. Обратитесь в поддержку.',
        technical: error.message
      };
    }
    
    // Handle 404 errors specifically
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Платежный сервис недоступен. Убедитесь, что сервер запущен.',
        technical: 'Payment endpoint not found',
        details: error.response?.data
      };
    }
    
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

// ✅ PAYMENT STATUS POLLING (useful for monitoring payments)
export const pollPaymentStatus = async (transactionId, userId, options = {}) => {
  const maxAttempts = options.maxAttempts || 30; // 5 minutes with 10s intervals
  const interval = options.interval || 10000; // 10 seconds
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        attempts++;
        const result = await checkPaymentStatus(transactionId, userId);
        
        if (result.success && result.transaction) {
          const state = result.transaction.state;
          
          if (state === 2) { // Paid
            resolve({
              success: true,
              status: 'paid',
              transaction: result.transaction
            });
            return;
          } else if (state === -1 || state === -2) { // Cancelled or refunded
            resolve({
              success: false,
              status: 'cancelled',
              transaction: result.transaction
            });
            return;
          }
        }
        
        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            status: 'timeout',
            message: 'Превышено время ожидания оплаты'
          });
          return;
        }
        
        setTimeout(checkStatus, interval);
        
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(checkStatus, interval);
        }
      }
    };
    
    checkStatus();
  });
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

// ✅ COMPLETE PAYMENT FLOW FUNCTION
export const executePaymentFlow = async (userId, plan, options = {}) => {
  try {
    console.log('🔄 Starting complete payment flow:', { userId, plan, options });
    
    // 1. Validate user first
    const userValidation = await validateUser(userId);
    if (!userValidation.success || !userValidation.valid) {
      throw new Error(userValidation.error || 'Пользователь не найден');
    }
    
    // 2. Try promo code if provided
    if (options.promoCode) {
      const promoResult = await applyPromoCode(userId, plan, options.promoCode);
      if (promoResult.success) {
        return {
          success: true,
          method: 'promo',
          message: 'Промокод успешно применён! Подписка активирована.',
          data: promoResult.data
        };
      }
    }
    
    // 3. Determine optimal payment method
    const method = options.method || getOptimalPaymentMethod();
    
    // 4. Generate appropriate payment interface
    switch (method) {
      case 'button':
        return await createPaymeButton(userId, plan, options.containerId, options);
      case 'qr':
        return await createPaymeQR(userId, plan, options.containerId, options.qrWidth, options);
      case 'url':
      case 'get':
        return await generatePaymeUrl(userId, plan, options);
      case 'form':
      case 'post':
      default:
        return await generatePaymeForm(userId, plan, 'post', options);
    }
    
  } catch (error) {
    console.error('❌ Payment flow error:', error);
    return {
      success: false,
      error: handlePaymentError(error, 'Процесс оплаты')
    };
  }
};

// ✅ SANDBOX TESTING FUNCTIONS - ENHANCED SAFETY
export const setSandboxAccountState = async (accountLogin, state) => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Sandbox functions not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    // Use regular axios to avoid potential loops with interceptors
    const response = await axios.post(`${BASE_URL}/payments/sandbox/account-state`, {
      accountLogin,
      state
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Source': 'frontend-sandbox'
      },
      timeout: 10000
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Sandbox account state error:', error);
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
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Source': 'frontend-sandbox'
      },
      timeout: 10000
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
    const response = await axios.get(`${BASE_URL}/payments/transactions`, {
      headers: {
        'X-Request-Source': 'frontend-sandbox'
      },
      timeout: 10000
    });
    
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
    const response = await axios.delete(`${BASE_URL}/payments/transactions/clear`, {
      headers: {
        'X-Request-Source': 'frontend-sandbox'
      },
      timeout: 10000
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

// ✅ PAYMENT UTILITY FUNCTIONS WITH CORRECT AMOUNTS
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

// ✅ FORMAT PAYMENT AMOUNT FUNCTION
export const formatPaymentAmount = (amount, currency = 'UZS') => {
  try {
    // Ensure amount is a number
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
      console.warn('⚠️ Invalid amount for formatting:', amount);
      return `${amount} сум`;
    }
    
    // For UZS, format as decimal with "сум"
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

// ✅ COMPREHENSIVE ERROR HANDLER FOR PAYMENTS - ENHANCED
export const handlePaymentError = (error, context = 'Платежная операция') => {
  console.error(`❌ ${context} failed:`, error);
  
  // Check for PayMe specific error codes
  if (error.response?.data?.code && error.response.data.code.toString().startsWith('-316')) {
    return getPaymeErrorMessage(error.response.data.code);
  }
  
  // Check for loop prevention errors
  if (error.message?.includes('Direct browser access')) {
    return 'Ошибка конфигурации платежной системы. Обратитесь в поддержку.';
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
    return 'Платежный сервис недоступен. Убедитесь, что сервер запущен.';
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

// ✅ GENERAL ERROR HANDLER - ENHANCED
export const handleApiError = (error, context = 'API call') => {
  console.error(`❌ ${context} failed:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });
  
  // Check for PayMe specific error codes
  if (error.response?.data?.code && error.response.data.code.toString().startsWith('-316')) {
    return getPaymeErrorMessage(error.response.data.code);
  }
  
  // Check for loop prevention errors
  if (error.message?.includes('Direct browser access')) {
    return 'Ошибка системы. Обратитесь в поддержку.';
  }
  
  // Return user-friendly error message
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

// ✅ BATCH OPERATIONS HELPER - ENHANCED
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ API call attempt ${attempt} failed:`, error.message);
      
      // Don't retry certain errors
      if (error.response?.status === 401 || 
          error.response?.status === 403 || 
          error.message?.includes('Direct browser access')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
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
// 🧪 DEVELOPMENT TESTING HELPERS - ENHANCED
// =============================================

// Test payment flow in development with safety checks
export const testPaymentFlow = async (userId, plan = 'start') => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Test functions not available in production');
    return;
  }
  
  console.log('🧪 Testing payment flow:', { userId, plan });
  
  try {
    // Clean up any previous attempts
    resetPaymentAttempts(userId);
    
    // 1. Validate user
    const userValidation = await validateUser(userId);
    console.log('👤 User validation:', userValidation);
    
    // 2. Set account state to waiting_payment (avoid direct sandbox calls)
    console.log('🔧 Skipping direct sandbox calls to prevent loops');
    
    // 3. Try promo code first
    const promoResult = await applyPromoCode(userId, plan, 'acedpromocode2406');
    console.log('🎟️ Promo code result:', promoResult);
    
    if (!promoResult.success) {
      // 4. Try payment initiation (using safe endpoint)
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

// Enhanced API health check
export const checkApiHealth = async () => {
  try {
    console.log('🏥 Checking API health...');
    
    const healthResponse = await healthCheck();
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test auth if user is available
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

// Diagnose payment system configuration
export const diagnosePaymentSystem = async () => {
  if (import.meta.env.MODE === 'production') {
    console.warn('⚠️ Diagnostics not available in production');
    return { success: false, error: 'Not available in production' };
  }
  
  try {
    console.log('🔍 Diagnosing payment system...');
    
    const results = {
      apiHealth: null,
      paymentEndpoints: [],
      loopPrevention: null,
      recommendations: []
    };
    
    // Check API health
    try {
      const health = await healthCheck();
      results.apiHealth = health.data;
      
      if (health.data.payme?.loopPrevention === 'Active') {
        results.loopPrevention = 'Active ✅';
      } else {
        results.loopPrevention = 'Inactive ⚠️';
        results.recommendations.push('Enable loop prevention in server');
      }
    } catch (error) {
      results.apiHealth = { error: error.message };
      results.recommendations.push('Fix API health endpoint');
    }
    
    // Test payment endpoints (safe ones only)
    const endpoints = [
      { name: 'Payment Initiation', path: '/payments/initiate' },
      { name: 'Payment Status', path: '/payments/status/test' },
      { name: 'Form Generation', path: '/payments/generate-form' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        // Only test GET endpoints or safe POST endpoints
        if (endpoint.path.includes('/status/')) {
          await axios.get(`${BASE_URL}${endpoint.path}`, {
            timeout: 5000,
            headers: { 'X-Request-Source': 'diagnostic' }
          });
          results.paymentEndpoints.push({ ...endpoint, status: 'Available ✅' });
        }
      } catch (error) {
        const status = error.response?.status === 404 ? 'Not Found ⚠️' : `Error: ${error.message}`;
        results.paymentEndpoints.push({ ...endpoint, status });
      }
    }
    
    // Add general recommendations
    if (results.recommendations.length === 0) {
      results.recommendations.push('System appears to be configured correctly');
    }
    
    console.log('📊 Diagnosis complete:', results);
    return { success: true, data: results };
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    return { success: false, error: error.message };
  }
};

// List all available API functions for debugging
export const getAvailableApiFunctions = () => {
  return {
    payment: [
      'generatePaymeForm',
      'createPaymeButton',
      'createPaymeQR',
      'generatePaymeUrl',
      'applyPromoCode',
      'initiatePaymePayment', 
      'checkPaymentStatus',
      'pollPaymentStatus',
      'validateUser',
      'executePaymentFlow',
      'getPaymentAmounts',
      'formatPaymentAmount',
      'getTransactionStateText',
      'getPaymeErrorMessage',
      'getOptimalPaymentMethod'
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
      'retryApiCall',
      'cleanupRequestCache',
      'resetPaymentAttempts'
    ],
    testing: [
      'testPaymentFlow',
      'checkApiHealth',
      'diagnosePaymentSystem',
      'getAvailableApiFunctions'
    ]
  };
};

// ✅ DEBUGGING HELPER - Show current system status
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

export default api;