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

// ✅ FIXED: Replace this function in src/api.js around line 297
const generateDirectPaymeUrl = async (userId, plan, options = {}) => {
  try {
    console.log('🔗 Generating PayMe GET URL - Method 1');
    
    // Get merchant ID with validation
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    
    if (!merchantId || merchantId === 'undefined' || typeof merchantId !== 'string') {
      console.error('❌ VITE_PAYME_MERCHANT_ID not loaded properly');
      console.error('Current value:', merchantId, 'Type:', typeof merchantId);
      throw new Error('PayMe Merchant ID not configured. Check your .env file.');
    }
    
    console.log('✅ Merchant ID loaded:', merchantId.substring(0, 10) + '...');
    
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Plan "${plan}" not found. Available: start, pro`);
    }
    
    // Generate clean order ID (alphanumeric only)
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 6);
    const orderId = `aced${timestamp}${randomPart}`;
    
    console.log('💰 Payment details:', {
      plan,
      orderId,
      amountTiyin: planAmount,
      amountUzs: amounts[plan].uzs
    });
    
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
    console.log('📝 Parameter string:', paramString);
    
    // Validate no undefined values
    if (paramString.includes('undefined') || paramString.includes('null')) {
      throw new Error('Parameter string contains invalid values: ' + paramString);
    }
    
    // Base64 encode
    const base64Params = btoa(paramString);
    const paymentUrl = `https://checkout.paycom.uz/${base64Params}`;
    
    // Final verification
    const verification = atob(base64Params);
    console.log('✅ Verification - decoded:', verification);
    
    if (verification !== paramString) {
      throw new Error('URL encoding/decoding mismatch');
    }
    
    console.log('✅ PayMe GET URL generated successfully');
    
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

// ✅ ADDITIONAL HELPER: Validate PayMe URL before redirect
export const validatePaymeUrl = (url) => {
  try {
    // Extract base64 part
    const base64Part = url.split('/').pop();
    
    // Decode and check
    const decoded = atob(base64Part);
    console.log('🔍 URL validation - decoded:', decoded);
    
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
    
    console.log('🔍 URL validation result:', validation);
    
    return validation;
    
  } catch (error) {
    console.error('❌ URL validation failed:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// ✅ SAFE URL GENERATION TEST
export const testCleanUrlGeneration = async () => {
  try {
    console.log('🧪 Testing clean URL generation...');
    
    const testResult = await generateDirectPaymeUrl('testuser123', 'start', {
      lang: 'ru',
      callback: 'https://aced.live/payment/success'
    });
    
    if (testResult.success) {
      const validation = validatePaymeUrl(testResult.paymentUrl);
      
      console.log('✅ Test URL generated:', testResult.paymentUrl);
      console.log('✅ Validation result:', validation);
      
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

// ✅ FIXED: Generate POST Form (Method 2 from PayMe docs)
const generateDirectPaymeForm = async (userId, plan, options = {}) => {
  try {
    console.log('📝 Generating PayMe POST form - Method 2');
    
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
    
    console.log('🧹 Clean order ID generated:', cleanOrderId);
    
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
      console.log('📝 PayMe POST form auto-submitting...');
      
      // Wait for DOM to be ready
      function submitPaymeForm() {
        const form = document.getElementById('payme-form');
        if (form) {
          console.log('✅ Form found, submitting to PayMe...');
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
    
    console.log('✅ PayMe POST form generated successfully');
    console.log('📋 Form details:', {
      merchantId: merchantId.substring(0, 10) + '...',
      orderId: cleanOrderId,
      amount: planAmount,
      plan: plan,
      language: language,
      callback: callbackUrl
    });
    
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
const generatePaymeButton = async (userId, plan, options = {}) => {
  try {
    console.log('🔘 Generating PayMe Button - Method 3');
    
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    const orderId = `aced${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
    
    // Button HTML exactly as per documentation
    const buttonHtml = `
    <div id="payme-button-container">
      <form id="form-payme" method="POST" action="https://checkout.paycom.uz/">
        <input type="hidden" name="merchant" value="${merchantId}">
        <input type="hidden" name="account[Login]" value="${orderId}">
        <input type="hidden" name="amount" value="${planAmount}">
        <input type="hidden" name="lang" value="${options.lang || 'ru'}">
        <input type="hidden" name="button" data-type="svg" value="${options.style || 'colored'}">
        <div id="button-container"></div>
      </form>
      
      <script src="https://cdn.paycom.uz/integration/js/checkout.min.js"></script>
      
      <script>
        // Wait for PayMe script to load
        function initPaymeButton() {
          if (typeof Paycom !== 'undefined') {
            Paycom.Button('#form-payme', '#button-container');
            console.log('✅ PayMe button generated');
          } else {
            console.warn('PayMe script not loaded, retrying...');
            setTimeout(initPaymeButton, 500);
          }
        }
        
        setTimeout(initPaymeButton, 1000);
      </script>
    </div>
    `;
    
    return {
      success: true,
      buttonHtml,
      method: 'BUTTON',
      transaction: {
        id: orderId,
        amount: planAmount,
        plan
      }
    };
    
  } catch (error) {
    console.error('❌ Button generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ FIXED: Generate QR Code (Method 4 from docs)
const generatePaymeQR = async (userId, plan, options = {}) => {
  try {
    console.log('📱 Generating PayMe QR - Method 4');
    
    const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID;
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    const orderId = `aced${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
    
    // QR HTML exactly as per documentation
    const qrHtml = `
    <div id="payme-qr-container">
      <form id="form-payme-qr" method="POST" action="https://checkout.paycom.uz/">
        <input type="hidden" name="merchant" value="${merchantId}">
        <input type="hidden" name="account[Login]" value="${orderId}">
        <input type="hidden" name="amount" value="${planAmount}">
        <input type="hidden" name="lang" value="${options.lang || 'ru'}">
        <input type="hidden" name="qr" data-width="${options.qrWidth || 250}">
        <div id="qr-container"></div>
      </form>
      
      <script src="https://cdn.paycom.uz/integration/js/checkout.min.js"></script>
      
      <script>
        // Wait for PayMe script to load
        function initPaymeQR() {
          if (typeof Paycom !== 'undefined') {
            Paycom.QR('#form-payme-qr', '#qr-container');
            console.log('✅ PayMe QR generated');
          } else {
            console.warn('PayMe script not loaded, retrying...');
            setTimeout(initPaymeQR, 500);
          }
        }
        
        setTimeout(initPaymeQR, 1000);
      </script>
    </div>
    `;
    
    return {
      success: true,
      qrHtml,
      method: 'QR',
      transaction: {
        id: orderId,
        amount: planAmount,
        plan
      }
    };
    
  } catch (error) {
    console.error('❌ QR generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ DIRECT PAYME FORM GENERATION (for POST method)


export const initiatePaymePayment = async (userId, plan, additionalData = {}) => {
  if (!trackPaymentAttempt(userId, 'payment-initiation')) {
    throw new Error('Слишком много попыток инициации платежа. Подождите несколько секунд.');
  }
  
  try {
    console.log('🚀 Initiating PayMe payment:', { userId, plan, additionalData });
    
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Неизвестный план: ${plan}`);
    }
    
    // ✅ FIXED: Always use direct generation for better reliability
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
    
    // Fallback to GET method
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
    console.log('🎨 Generating PayMe form:', { userId, plan, method, options });
    
    // Always use direct generation for reliability
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
    
    // For button and QR methods, fallback to GET for now
    console.warn('⚠️ Button and QR methods not fully implemented, using GET method');
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