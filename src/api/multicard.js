// src/api/multicard.js - Multicard Payment Integration
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

// Create Multicard-specific API instance
const multicardApi = axios.create({
  baseURL: `${BASE_URL}/api/payments/multicard`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

// Request interceptor for auth token
multicardApi.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('❌ Multicard auth token error:', error);
    return config;
  }
});

// Response interceptor for error handling
multicardApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Multicard API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error?.details || error.message
    });
    return Promise.reject(error);
  }
);

// =============================================
// 🔐 AUTHENTICATION
// =============================================

/**
 * Test Multicard authentication
 */
export const testMulticardAuth = async () => {
  try {
    const { data } = await multicardApi.get('/test-connection');
    return data;
  } catch (error) {
    console.error('❌ Multicard auth test failed:', error);
    throw error;
  }
};

// =============================================
// 💳 PAYMENT INITIATION
// =============================================

/**
 * Initiate Multicard payment
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.userId - User ID
 * @param {string} paymentData.plan - Subscription plan (start, pro)
 * @param {number} paymentData.amount - Amount in tiyin
 * @param {Array} paymentData.ofd - OFD data array
 * @param {string} paymentData.lang - Language (ru, uz, en)
 * @param {string} paymentData.sms - Optional SMS number
 */
export const initiateMulticardPayment = async (paymentData) => {
  try {
    console.log('💳 Initiating Multicard payment:', {
      plan: paymentData.plan,
      amount: paymentData.amount
    });

    const { data } = await multicardApi.post('/initiate', paymentData);

    if (data.success) {
      console.log('✅ Payment initiated:', data.data.uuid);
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Payment initiation failed');
    }
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

// =============================================
// 📋 INVOICE MANAGEMENT
// =============================================

/**
 * Get invoice information
 * @param {string} invoiceId - Your internal invoice ID
 */
export const getInvoiceInfo = async (invoiceId) => {
  try {
    const { data } = await multicardApi.get(`/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    console.error('❌ Get invoice error:', error);
    throw error;
  }
};

/**
 * Cancel invoice
 * @param {string} invoiceId - Your internal invoice ID
 */
export const cancelInvoice = async (invoiceId) => {
  try {
    const { data } = await multicardApi.delete(`/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    console.error('❌ Cancel invoice error:', error);
    throw error;
  }
};

// =============================================
// 💳 CARD BINDING (Form-based)
// =============================================

/**
 * Create card binding session
 * @param {Object} bindingData - Card binding information
 * @param {string} bindingData.userId - User ID
 * @param {string} bindingData.redirectUrl - Success redirect URL
 * @param {string} bindingData.redirectDeclineUrl - Decline redirect URL
 * @param {string} bindingData.callbackUrl - Backend callback URL
 */
export const createCardBindingSession = async (bindingData) => {
  try {
    console.log('💳 Creating card binding session...');

    const { data } = await multicardApi.post('/card/bind', bindingData);

    if (data.success) {
      console.log('✅ Card binding session created:', data.data.sessionId);
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Card binding session creation failed');
    }
  } catch (error) {
    console.error('❌ Card binding error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Check card binding status
 * @param {string} sessionId - Card binding session ID
 */
export const checkCardBindingStatus = async (sessionId) => {
  try {
    const { data } = await multicardApi.get(`/card/bind/${sessionId}`);
    return data;
  } catch (error) {
    console.error('❌ Check card binding status error:', error);
    throw error;
  }
};

/**
 * Get card info by token
 * @param {string} cardToken - Card token
 */
export const getCardInfo = async (cardToken) => {
  try {
    const { data } = await multicardApi.get(`/card/${cardToken}`);
    return data;
  } catch (error) {
    console.error('❌ Get card info error:', error);
    throw error;
  }
};

/**
 * Delete card token
 * @param {string} cardToken - Card token to delete
 */
export const deleteCard = async (cardToken) => {
  try {
    const { data } = await multicardApi.delete(`/card/${cardToken}`);
    return data;
  } catch (error) {
    console.error('❌ Delete card error:', error);
    throw error;
  }
};

// =============================================
// 💰 PAYMENT BY CARD TOKEN
// =============================================

/**
 * Create payment by card token
 * @param {Object} paymentData - Payment information
 * @param {Object} paymentData.card - Card information
 * @param {string} paymentData.card.token - Card token
 * @param {number} paymentData.amount - Amount in tiyin
 * @param {string|number} paymentData.storeId - Store ID
 * @param {string} paymentData.invoiceId - Invoice ID
 * @param {string} paymentData.callbackUrl - Optional callback URL
 * @param {Array} paymentData.ofd - OFD data
 */
export const createPaymentByToken = async (paymentData) => {
  try {
    console.log('💳 Creating payment by token...');

    const { data } = await multicardApi.post('/payment', paymentData);

    if (data.success) {
      console.log('✅ Payment created:', data.data.uuid);
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Payment creation failed');
    }
  } catch (error) {
    console.error('❌ Payment by token error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Create payment via payment app (Payme, Click, Uzum, etc.)
 * @param {Object} paymentData
 * @param {string} paymentData.paymentSystem - Payment system (payme, click, uzum, etc.)
 * @param {number} paymentData.amount - Amount in tiyin
 * @param {string|number} paymentData.storeId - Store ID
 * @param {string} paymentData.invoiceId - Invoice ID
 */
export const createPaymentViaApp = async (paymentData) => {
  try {
    console.log('📱 Creating payment via app:', paymentData.paymentSystem);

    const { data } = await multicardApi.post('/payment/via-app', paymentData);

    if (data.success) {
      console.log('✅ Payment app link created');
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } else {
      throw new Error(data.error?.details || 'Payment via app creation failed');
    }
  } catch (error) {
    console.error('❌ Payment via app error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Confirm payment with OTP
 * @param {string} paymentUuid - Payment UUID
 * @param {string} otp - OTP code
 * @param {boolean} debitAvailable - Whether debit is available
 */
export const confirmPayment = async (paymentUuid, otp, debitAvailable = false) => {
  try {
    console.log('✅ Confirming payment with OTP...');

    const { data } = await multicardApi.put(`/payment/${paymentUuid}`, {
      otp,
      debitAvailable
    });

    if (data.success) {
      console.log('✅ Payment confirmed:', data.data.status);
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Payment confirmation failed');
    }
  } catch (error) {
    console.error('❌ Payment confirmation error:', error);
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message,
      code: error.response?.data?.error?.code
    };
  }
};

/**
 * Refund payment
 * @param {string} paymentUuid - Payment UUID
 */
export const refundPayment = async (paymentUuid) => {
  try {
    const { data } = await multicardApi.delete(`/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    console.error('❌ Refund payment error:', error);
    throw error;
  }
};

/**
 * Get payment information
 * @param {string} paymentUuid - Payment UUID
 */
export const getPaymentInfo = async (paymentUuid) => {
  try {
    const { data } = await multicardApi.get(`/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    console.error('❌ Get payment info error:', error);
    throw error;
  }
};

// =============================================
// 📊 STATISTICS & HISTORY
// =============================================

/**
 * Get payment history for a store
 * @param {string|number} storeId - Store ID
 * @param {Object} params - Query parameters
 * @param {number} params.offset - Offset for pagination
 * @param {number} params.limit - Limit (max 100)
 * @param {string} params.startDate - Start date (YYYY-MM-DD HH:mm:ss)
 * @param {string} params.endDate - End date (YYYY-MM-DD HH:mm:ss)
 * @param {string} params.onlyStatus - Filter by status
 */
export const getPaymentHistory = async (storeId, params) => {
  try {
    const { data } = await multicardApi.get(`/store/${storeId}/history`, { params });
    return data;
  } catch (error) {
    console.error('❌ Get payment history error:', error);
    throw error;
  }
};

/**
 * Get payment statistics
 * @param {string|number} storeId - Store ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 */
export const getPaymentStatistics = async (storeId, startDate, endDate) => {
  try {
    const { data } = await multicardApi.get(`/store/${storeId}/statistics`, {
      params: { startDate, endDate }
    });
    return data;
  } catch (error) {
    console.error('❌ Get payment statistics error:', error);
    throw error;
  }
};

/**
 * Get application information
 */
export const getApplicationInfo = async () => {
  try {
    const { data } = await multicardApi.get('/application/info');
    return data;
  } catch (error) {
    console.error('❌ Get application info error:', error);
    throw error;
  }
};

// =============================================
// 🔧 UTILITY FUNCTIONS
// =============================================

/**
 * Format amount to tiyin (1 UZS = 100 tiyin)
 * @param {number} uzs - Amount in UZS
 * @returns {number} Amount in tiyin
 */
export const uzsToTiyin = (uzs) => {
  return Math.round(uzs * 100);
};

/**
 * Format amount from tiyin to UZS
 * @param {number} tiyin - Amount in tiyin
 * @returns {number} Amount in UZS
 */
export const tiyinToUzs = (tiyin) => {
  return tiyin / 100;
};

/**
 * Format price for display
 * @param {number} amount - Amount in tiyin
 * @returns {string} Formatted price
 */
export const formatPrice = (amount) => {
  const uzs = tiyinToUzs(amount);
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(uzs);
};

/**
 * Create OFD data for payment
 * @param {Array} items - Array of items
 * @returns {Array} Formatted OFD data
 */
export const createOfdData = (items) => {
  return items.map(item => ({
    qty: item.quantity || 1,
    price: uzsToTiyin(item.price),
    mxik: item.mxik || '10899002001000000',
    total: uzsToTiyin((item.quantity || 1) * item.price),
    package_code: item.packageCode || '1',
    name: item.name,
    ...(item.vat && { vat: item.vat }),
    ...(item.tin && { tin: item.tin })
  }));
};

/**
 * Get payment status text
 * @param {string} status - Payment status
 * @returns {string} Human-readable status
 */
export const getPaymentStatusText = (status) => {
  const statusMap = {
    draft: 'Черновик',
    progress: 'В процессе',
    billing: 'Выставление счета',
    success: 'Успешно',
    error: 'Ошибка',
    revert: 'Возврат'
  };
  return statusMap[status] || status;
};

/**
 * Get payment system name
 * @param {string} ps - Payment system code
 * @returns {string} Payment system name
 */
export const getPaymentSystemName = (ps) => {
  const psMap = {
    uzcard: 'UZCARD',
    humo: 'HUMO',
    visa: 'Visa',
    mastercard: 'Mastercard',
    unionpay: 'UnionPay',
    payme: 'Payme',
    click: 'Click',
    uzum: 'Uzum',
    anorbank: 'Anorbank',
    alif: 'Alif',
    oson: 'Oson',
    xazna: 'Xazna'
  };
  return psMap[ps] || ps;
};

// Export all functions
export default {
  // Auth
  testMulticardAuth,
  
  // Payment Initiation
  initiateMulticardPayment,
  
  // Invoice Management
  getInvoiceInfo,
  cancelInvoice,
  
  // Card Binding
  createCardBindingSession,
  checkCardBindingStatus,
  getCardInfo,
  deleteCard,
  
  // Payment by Token
  createPaymentByToken,
  createPaymentViaApp,
  confirmPayment,
  refundPayment,
  getPaymentInfo,
  
  // Statistics
  getPaymentHistory,
  getPaymentStatistics,
  getApplicationInfo,
  
  // Utilities
  uzsToTiyin,
  tiyinToUzs,
  formatPrice,
  createOfdData,
  getPaymentStatusText,
  getPaymentSystemName
};