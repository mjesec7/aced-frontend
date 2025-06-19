// src/api/payments.js - NEW FILE FOR PAYMENT-SPECIFIC API CALLS
import axios from 'axios';
import { auth } from '@/firebase';

const PAYMENT_API_BASE = import.meta.env.VITE_API_BASE_URL;

console.log('💳 Payment API Base URL:', PAYMENT_API_BASE);

// Create payment-specific axios instance
const paymentApi = axios.create({
  baseURL: PAYMENT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000 // Extended timeout for payment operations
});

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

// Request interceptor for payments
paymentApi.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('💳 Payment API Request:', {
      url: config.url,
      method: config.method.toUpperCase(),
      hasAuth: !!token
    });
    
    return config;
  } catch (error) {
    console.error('❌ Payment request interceptor error:', error);
    return Promise.reject(error);
  }
});

// Response interceptor for payments
paymentApi.interceptors.response.use(
  (response) => {
    console.log('✅ Payment API Response:', {
      url: response.config.url,
      status: response.status,
      success: response.data.success
    });
    return response;
  },
  (error) => {
    console.error('❌ Payment API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

// ✅ PROMO CODE APPLICATION
export const applyPromoCode = async (userId, plan, promoCode) => {
  try {
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
    
    const response = await paymentApi.post('/payments/initiate-payme', payload);
    
    return {
      success: true,
      data: response.data,
      paymentUrl: response.data.paymentUrl,
      transaction: response.data.transaction,
      metadata: response.data.metadata
    };
  } catch (error) {
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
    
    const response = await paymentApi.get(url);
    
    return {
      success: true,
      data: response.data,
      transaction: response.data.transaction,
      status: response.data.transaction?.state
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Ошибка проверки статуса платежа'
    };
  }
};

// ✅ USER VALIDATION
export const validateUser = async (userId) => {
  try {
    const response = await paymentApi.get(`/payments/validate-user/${userId}`);
    
    return {
      success: true,
      valid: response.data.valid,
      user: response.data.user
    };
  } catch (error) {
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
    const response = await axios.post(`${PAYMENT_API_BASE}/payments/sandbox/account-state`, {
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
    const response = await axios.post(`${PAYMENT_API_BASE}/payments/sandbox/merchant-key`, {
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
    const response = await axios.get(`${PAYMENT_API_BASE}/payments/transactions`);
    
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
    const response = await axios.delete(`${PAYMENT_API_BASE}/payments/transactions/clear`);
    
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

// ✅ PAYMENT UTILITY FUNCTIONS
export const getPaymentAmounts = () => {
  return {
    start: {
      tiyin: 260000,
      uzs: 2600,
      label: 'Start'
    },
    pro: {
      tiyin: 455000,
      uzs: 4550,
      label: 'Pro'
    }
  };
};

export const formatPaymentAmount = (amount, currency = 'UZS') => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount);
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

// ✅ COMPREHENSIVE ERROR HANDLER
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

export default paymentApi;