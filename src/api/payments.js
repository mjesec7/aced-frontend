// src/api/payments.js - EXTRACTED WORKING PAYME PAYMENT FUNCTIONALITY
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

// Create payment-specific axios instance
const paymentApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

// ========================================
// 🔧 PAYMENT REQUEST TRACKING & DEBOUNCING
// ========================================

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

// Enhanced token management for payments
const getValidToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('⚠️ No Firebase user available for payment');
      return null;
    }
    
    const token = await currentUser.getIdToken(true);
    localStorage.setItem('token', token);
    console.log('🔑 Fresh payment token obtained');
    return token;
  } catch (error) {
    console.error('❌ Failed to get valid payment token:', error);
    return null;
  }
};

// Payment API interceptors
paymentApi.interceptors.request.use(async (config) => {
  try {
    // Special handling for payment endpoints
    config.headers['X-Request-Source'] = 'frontend';
    config.headers['X-User-Agent'] = navigator.userAgent.substring(0, 50);
    
    const token = await getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  } catch (error) {
    console.error('❌ Payment request interceptor error:', error);
    return Promise.reject(error);
  }
});

paymentApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Payment API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    // Handle 401 errors with token refresh for payments
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const freshToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', freshToken);
          error.config.headers.Authorization = `Bearer ${freshToken}`;
          return paymentApi(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Payment token refresh failed:', refreshError);
        localStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

// =============================================
// 💳 PAYME PAYMENT CONSTANTS & UTILITIES
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
// 🔗 DIRECT PAYME URL GENERATION (GET METHOD)
// =============================================

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

// =============================================
// 📝 DIRECT PAYME FORM GENERATION (POST METHOD)
// =============================================

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

// =============================================
// 🎯 MAIN PAYMENT API FUNCTIONS
// =============================================

// ✅ MAIN PAYMENT INITIATION FUNCTION
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
    
    const response = await paymentApi.post('/payments/promo-code', {
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
    
    const response = await paymentApi.get(url);
    
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
    
    const response = await paymentApi.get(`/payments/validate-user/${userId}`);
    
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

// =============================================
// 🔧 PAYMENT UTILITY FUNCTIONS
// =============================================

// ✅ PAYMENT URL VALIDATION
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
// 🧪 TESTING AND DEVELOPMENT FUNCTIONS
// =============================================

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

// ✅ PAYMENT FLOW TEST
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

// ✅ ALIASES FOR BACKWARDS COMPATIBILITY
export const generatePaymentForm = generatePaymeForm;
export const executePaymentFlow = initiatePaymePayment;

// Export the payment API