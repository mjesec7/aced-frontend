// src/api/multicard.js - Multicard Payment Integration (UPDATED & FIXED)
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

// =============================================
// 🔧 CREATE MULTICARD API INSTANCE
// =============================================

const multicardApi = axios.create({
  baseURL: `${BASE_URL}/api/payments`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  maxRedirects: 0, // ✅ ADD THIS LINE

  validateStatus: (status) => status < 500 // Don't throw on 4xx errors
});

// =============================================
// 🔐 REQUEST INTERCEPTOR (AUTH TOKEN)
// =============================================

multicardApi.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================
// 📥 RESPONSE INTERCEPTOR (ERROR HANDLING)
// =============================================

multicardApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.error?.details ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message,
      fullError: error.response?.data
    };
    // Attach detailed error info for better debugging
    error.multicardDetails = errorDetails;

    return Promise.reject(error);
  }
);

// =============================================
// 🔐 AUTHENTICATION & TESTING
// =============================================

/**
 * Test Multicard connection and authentication
 * @returns {Promise<Object>} Test result
 */
export const testMulticardConnection = async () => {
  try {
    const { data } = await multicardApi.post('/multicard/test-connection');
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Legacy alias for backward compatibility
 */
export const testMulticardAuth = testMulticardConnection;

// =============================================
// 💳 PAYMENT INITIATION (MAIN FUNCTION)
// =============================================

/**
 * Initiate Multicard payment with complete error handling
 * @param {Object} paymentData - Payment information
 * @param {string} paymentData.userId - User ID (Firebase UID)
 * @param {string} paymentData.plan - Subscription plan ('start' or 'pro')
 * @param {number} [paymentData.amount] - Optional: Amount in tiyin (auto-calculated if not provided)
 * @param {Array} [paymentData.ofd] - Optional: OFD data (auto-generated if not provided)
 * @param {string} [paymentData.lang='ru'] - Language (ru, uz, en)
 * @param {string} [paymentData.userName] - User name for display
 * @param {string} [paymentData.userEmail] - User email for receipt
 * @returns {Promise<Object>} Payment initiation result
 */
export const initiateMulticardPayment = async (paymentData) => {
  try {
    // Validation
    if (!paymentData.userId) {
      throw new Error('userId is required');
    }

    if (!paymentData.plan) {
      throw new Error('plan is required');
    }

    if (!['start', 'pro', 'test'].includes(paymentData.plan)) {
      throw new Error('plan must be "start", "pro" or "test"');
    }

    // Amount in tiyin (1 UZS = 100 tiyin)
    // Tiers: 1-day=1,000,000 | 1-month=25,000,000 | 3-month=67,500,000 | 6-month=120,000,000
    // Default to 1-month (25,000,000 tiyin) if no amount provided
    const finalAmount = paymentData.amount ||
      (paymentData.plan === 'test' ? 1000000 : 25000000);

    // ✅ CRITICAL: Build OFD data correctly - it should be an array
    const ofdData = Array.isArray(paymentData.ofd) ? paymentData.ofd : [{
      qty: 1,
      price: finalAmount,
      total: finalAmount,
      name: `ACED ${paymentData.plan.toUpperCase()} Plan`,
      package_code: '1236095', // Distance learning services
      vat: 0
    }];

    // Build request payload
    const requestPayload = {
      userId: paymentData.userId,
      plan: paymentData.plan,
      amount: finalAmount,
      ofd: ofdData,
      lang: paymentData.lang || 'ru',
      userName: paymentData.userName || '',
      userEmail: paymentData.userEmail || '',
      provider: 'multicard', // ✅ Add provider field
      ...(paymentData.billingId && { billing_id: paymentData.billingId }) // ✅ Add billing_id if provided
    };

    const { data } = await multicardApi.post('/multicard/initiate', requestPayload);

    // Handle success
    if (data.success && data.data) {
      return {
        success: true,
        data: {
          uuid: data.data.uuid,
          invoiceId: data.data.invoiceId,
          checkoutUrl: data.data.checkoutUrl,
          shortLink: data.data.shortLink,
          deeplink: data.data.deeplink,
          addedOn: data.data.addedOn
        }
      };
    } else {
      // Handle backend errors
      const errorMessage = data.error?.details || data.error || 'Payment initiation failed';
      throw new Error(errorMessage);
    }

  } catch (error) {

    // Extract error message with priority
    let errorMessage = 'Unknown payment error occurred';

    if (error.response?.data?.error) {
      if (typeof error.response.data.error === 'string') {
        errorMessage = error.response.data.error;
      } else if (error.response.data.error.details) {
        errorMessage = error.response.data.error.details;
      } else if (error.response.data.error.message) {
        errorMessage = error.response.data.error.message;
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Check for specific error scenarios
    if (error.response?.status === 404) {
      errorMessage = 'Multicard payment endpoint not found. Please contact support.';
    } else if (errorMessage.includes('временно отключен') ||
      errorMessage.includes('temporarily disabled')) {
      errorMessage = 'Multicard payment is temporarily disabled. Please try PayMe or contact support.';
    }

    // Build detailed error response
    const errorResponse = {
      success: false,
      error: errorMessage,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        code: error.response?.data?.error?.code,
        hint: error.response?.data?.hint,
        timestamp: new Date().toISOString(),
        endpoint: error.config?.url
      }
    };
    return errorResponse;
  }
};

// =============================================
// 📋 INVOICE MANAGEMENT
// =============================================

/**
 * Get invoice information by invoice ID
 * @param {string} invoiceId - Your internal invoice ID
 * @returns {Promise<Object>} Invoice data
 */
export const getInvoiceInfo = async (invoiceId) => {
  try {
    const { data } = await multicardApi.post(`/multicard/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel/delete an invoice
 * @param {string} invoiceId - Your internal invoice ID
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelInvoice = async (invoiceId) => {
  try {
    const { data } = await multicardApi.delete(`/multicard/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 💳 CARD BINDING (SAVE CARDS FOR FUTURE USE)
// =============================================

/**
 * Create card binding session (form-based)
 */
export const createCardBindingSession = async (bindingData) => {
  try {
    if (!bindingData.userId) {
      throw new Error('userId is required');
    }
    if (!bindingData.redirectUrl) {
      throw new Error('redirectUrl is required');
    }
    if (!bindingData.redirectDeclineUrl) {
      throw new Error('redirectDeclineUrl is required');
    }

    const { data } = await multicardApi.post('/multicard/card/bind', bindingData);

    if (data.success) {
      return {
        success: true,
        data: {
          sessionId: data.data.sessionId,
          formUrl: data.data.formUrl,
          expiresIn: data.data.expiresIn
        }
      };
    } else {
      throw new Error(data.error?.details || 'Card binding session creation failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Check card binding status
 */
export const checkCardBindingStatus = async (sessionId) => {
  try {
    const { data } = await multicardApi.post(`/multicard/card/bind/${sessionId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get card information by token
 */
export const getCardInfo = async (cardToken) => {
  try {
    const { data } = await multicardApi.post(`/multicard/card/${cardToken}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete/revoke a card token
 */
export const deleteCard = async (cardToken) => {
  try {
    const { data } = await multicardApi.delete(`/multicard/card/${cardToken}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 💰 PAYMENT BY SAVED CARD
// =============================================

/**
 * Create payment using saved card token
 */
export const createPaymentByToken = async (paymentData) => {
  try {
    if (!paymentData.card?.token) {
      throw new Error('Card token is required');
    }
    if (!paymentData.amount) {
      throw new Error('Amount is required');
    }
    if (!paymentData.storeId) {
      throw new Error('Store ID is required');
    }
    if (!paymentData.invoiceId) {
      throw new Error('Invoice ID is required');
    }

    const { data } = await multicardApi.post('/multicard/payment', paymentData);

    if (data.success) {
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Payment creation failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Create payment via mobile payment app
 */
export const createPaymentViaApp = async (paymentData) => {
  try {
    const validSystems = ['payme', 'click', 'uzum', 'anorbank', 'alif', 'oson', 'xazna', 'beepul'];
    if (!validSystems.includes(paymentData.paymentSystem)) {
      throw new Error(`Invalid payment system. Must be one of: ${validSystems.join(', ')}`);
    }

    const { data } = await multicardApi.post('/multicard/payment/via-app', paymentData);

    if (data.success) {
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } else {
      throw new Error(data.error?.details || 'Payment via app creation failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message
    };
  }
};

/**
 * Confirm payment with OTP code
 */
export const confirmPayment = async (paymentUuid, otp, debitAvailable = false) => {
  try {
    if (!paymentUuid) {
      throw new Error('Payment UUID is required');
    }
    if (!otp || otp.length !== 6) {
      throw new Error('Valid 6-digit OTP is required');
    }

    const { data } = await multicardApi.put(`/multicard/payment/${paymentUuid}`, {
      otp,
      debit_available: debitAvailable
    });

    if (data.success) {
      return {
        success: true,
        data: data.data
      };
    } else {
      throw new Error(data.error?.details || 'Payment confirmation failed');
    }
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error?.details || error.message,
      code: error.response?.data?.error?.code
    };
  }
};

/**
 * Refund/cancel a payment
 */
export const refundPayment = async (paymentUuid) => {
  try {
    const { data } = await multicardApi.delete(`/multicard/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get payment information
 */
export const getPaymentInfo = async (paymentUuid) => {
  try {
    const { data } = await multicardApi.post(`/multicard/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 📊 STATISTICS & REPORTING
// =============================================

export const getPaymentHistory = async (storeId, params) => {
  try {
    const { data } = await multicardApi.post(`/multicard/store/${storeId}/history`, { params });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentStatistics = async (storeId, startDate, endDate) => {
  try {
    const { data } = await multicardApi.post(`/multicard/store/${storeId}/statistics`, {
      params: { startDate, endDate }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

export const getApplicationInfo = async () => {
  try {
    const { data } = await multicardApi.post('/multicard/application/info');
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 🔧 UTILITY FUNCTIONS
// =============================================

export const uzsToTiyin = (uzs) => {
  return Math.round(uzs * 100);
};

export const tiyinToUzs = (tiyin) => {
  return tiyin / 100;
};

export const formatPrice = (amount, locale = 'uz-UZ') => {
  const uzs = tiyinToUzs(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(uzs);
};

export const createOfdData = (items) => {
  return items.map(item => ({
    qty: item.quantity || 1,
    price: typeof item.price === 'number' ? item.price : uzsToTiyin(item.price),
    mxik: item.mxik || '10899002001000000',
    total: (item.quantity || 1) * (typeof item.price === 'number' ? item.price : uzsToTiyin(item.price)),
    package_code: String(item.packageCode || '1236095'),
    name: item.name,
    vat: item.vat || 0,
    ...(item.tin && { tin: item.tin })
  }));
};

export const getPaymentStatusText = (status) => {
  const statusMap = {
    draft: 'Черновик',
    progress: 'В процессе',
    billing: 'Выставление счета',
    success: 'Успешно',
    error: 'Ошибка',
    revert: 'Возврат',
    pending: 'Ожидание'
  };
  return statusMap[status] || status;
};

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
    xazna: 'Xazna',
    beepul: 'Beepul'
  };
  return psMap[ps] || ps;
};

export const isValidInvoiceId = (invoiceId) => {
  return invoiceId && typeof invoiceId === 'string' && invoiceId.length > 5;
};

export const isValidCardToken = (token) => {
  return token && typeof token === 'string' && token.length > 10;
};

// =============================================
// 📤 DEFAULT EXPORT
// =============================================

export default {
  testMulticardConnection,
  testMulticardAuth,
  initiateMulticardPayment,
  getInvoiceInfo,
  cancelInvoice,
  createCardBindingSession,
  checkCardBindingStatus,
  getCardInfo,
  deleteCard,
  createPaymentByToken,
  createPaymentViaApp,
  confirmPayment,
  refundPayment,
  getPaymentInfo,
  getPaymentHistory,
  getPaymentStatistics,
  getApplicationInfo,
  uzsToTiyin,
  tiyinToUzs,
  formatPrice,
  createOfdData,
  getPaymentStatusText,
  getPaymentSystemName,
  isValidInvoiceId,
  isValidCardToken
};