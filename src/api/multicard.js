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
      
      console.log('🔵 Multicard Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullUrl: `${config.baseURL}${config.url}`,
        hasAuth: !!config.headers.Authorization,
        hasData: !!config.data
      });
      
      return config;
    } catch (error) {
      console.error('❌ Multicard auth token error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// =============================================
// 📥 RESPONSE INTERCEPTOR (ERROR HANDLING)
// =============================================

multicardApi.interceptors.response.use(
  (response) => {
    console.log('✅ Multicard Response:', {
      status: response.status,
      url: response.config.url,
      success: response.data?.success,
      hasData: !!response.data?.data
    });
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
    
    console.error('❌ Multicard API Error:', errorDetails);
    
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
    console.log('🧪 Testing Multicard connection...');
    const { data } = await multicardApi.post('/multicard/test-connection');
    console.log('✅ Connection test successful:', data);
    return data;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
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
    console.log('💳 Initiating Multicard payment...', {
      plan: paymentData.plan,
      userId: paymentData.userId,
      hasAmount: !!paymentData.amount
    });

    // Validation
    if (!paymentData.userId) {
      throw new Error('userId is required');
    }

    if (!paymentData.plan) {
      throw new Error('plan is required');
    }

    if (!['start', 'pro'].includes(paymentData.plan)) {
      throw new Error('plan must be "start" or "pro"');
    }

    // ✅ CORRECT AMOUNT CALCULATION
    // 1 UZS = 100 tiyin
    // Pro: 455,000 UZS = 45,500,000 tiyin
    // Start: 260,000 UZS = 26,000,000 tiyin
    const finalAmount = paymentData.amount || 
      (paymentData.plan === 'pro' ? 45500000 : 26000000);

    // ✅ CRITICAL: Build OFD data correctly - it should be an array
    const ofdData = Array.isArray(paymentData.ofd) ? paymentData.ofd : [{
      qty: 1,
      price: finalAmount,
      total: finalAmount,
      name: `ACED ${paymentData.plan.toUpperCase()} Plan Subscription`,
      mxik: '10899002001000000',
      package_code: '1873404',
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
      provider: 'multicard' // ✅ Add provider field
    };

    console.log('📤 Sending payment request:', {
      ...requestPayload,
      amountUZS: finalAmount / 100,
      ofdArray: Array.isArray(ofdData)
    });

const { data } = await multicardApi({
  method: 'POST',
  url: '/multicard/initiate',
  data: requestPayload
});
    console.log('📥 Backend response received:', {
      success: data.success,
      hasData: !!data.data,
      hasCheckoutUrl: !!data.data?.checkoutUrl,
      error: data.error
    });

    // Handle success
    if (data.success && data.data) {
      console.log('✅ Payment initiated successfully:', {
        uuid: data.data.uuid,
        invoiceId: data.data.invoiceId,
        checkoutUrl: data.data.checkoutUrl?.substring(0, 50) + '...'
      });
      
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
    console.error('❌ Payment initiation error:', error);
    console.error('❌ Detailed error response:', error.response?.data);
    
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

    console.error('❌ Final error response:', errorResponse);

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
    console.log('📋 Getting invoice info:', invoiceId);
    const { data } = await multicardApi.post(`/multicard/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    console.error('❌ Get invoice error:', error);
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
    console.log('🗑️ Canceling invoice:', invoiceId);
    const { data } = await multicardApi.delete(`/multicard/invoice/${invoiceId}`);
    return data;
  } catch (error) {
    console.error('❌ Cancel invoice error:', error);
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
    console.log('💳 Creating card binding session...');

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
      console.log('✅ Card binding session created:', {
        sessionId: data.data.sessionId,
        expiresIn: data.data.expiresIn
      });
      
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
    console.error('❌ Card binding error:', error);
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
    console.log('🔍 Checking card binding status:', sessionId);
    const { data } = await multicardApi.post(`/multicard/card/bind/${sessionId}`);
    return data;
  } catch (error) {
    console.error('❌ Check card binding status error:', error);
    throw error;
  }
};

/**
 * Get card information by token
 */
export const getCardInfo = async (cardToken) => {
  try {
    console.log('💳 Getting card info...');
    const { data } = await multicardApi.post(`/multicard/card/${cardToken}`);
    return data;
  } catch (error) {
    console.error('❌ Get card info error:', error);
    throw error;
  }
};

/**
 * Delete/revoke a card token
 */
export const deleteCard = async (cardToken) => {
  try {
    console.log('🗑️ Deleting card token...');
    const { data } = await multicardApi.delete(`/multicard/card/${cardToken}`);
    return data;
  } catch (error) {
    console.error('❌ Delete card error:', error);
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
    console.log('💳 Creating payment by saved card token...');

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
      console.log('✅ Payment created:', {
        uuid: data.data.uuid,
        status: data.data.status,
        requiresOtp: !!data.data.otp_hash
      });
      
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
 * Create payment via mobile payment app
 */
export const createPaymentViaApp = async (paymentData) => {
  try {
    console.log('📱 Creating payment via app:', paymentData.paymentSystem);

    const validSystems = ['payme', 'click', 'uzum', 'anorbank', 'alif', 'oson', 'xazna', 'beepul'];
    if (!validSystems.includes(paymentData.paymentSystem)) {
      throw new Error(`Invalid payment system. Must be one of: ${validSystems.join(', ')}`);
    }

    const { data } = await multicardApi.post('/multicard/payment/via-app', paymentData);

    if (data.success) {
      console.log('✅ Payment app link created:', {
        checkoutUrl: data.data.checkout_url?.substring(0, 50) + '...'
      });
      
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
 * Confirm payment with OTP code
 */
export const confirmPayment = async (paymentUuid, otp, debitAvailable = false) => {
  try {
    console.log('✅ Confirming payment with OTP...');

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
      console.log('✅ Payment confirmed:', {
        status: data.data.status,
        transactionId: data.data.ps_uniq_id
      });
      
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
 * Refund/cancel a payment
 */
export const refundPayment = async (paymentUuid) => {
  try {
    console.log('🔄 Refunding payment:', paymentUuid);
    const { data } = await multicardApi.delete(`/multicard/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    console.error('❌ Refund payment error:', error);
    throw error;
  }
};

/**
 * Get payment information
 */
export const getPaymentInfo = async (paymentUuid) => {
  try {
    console.log('🔍 Getting payment info:', paymentUuid);
    const { data } = await multicardApi.post(`/multicard/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    console.error('❌ Get payment info error:', error);
    throw error;
  }
};

// =============================================
// 📊 STATISTICS & REPORTING
// =============================================

export const getPaymentHistory = async (storeId, params) => {
  try {
    console.log('📊 Getting payment history for store:', storeId);
    const { data } = await multicardApi.post(`/multicard/store/${storeId}/history`, { params });
    return data;
  } catch (error) {
    console.error('❌ Get payment history error:', error);
    throw error;
  }
};

export const getPaymentStatistics = async (storeId, startDate, endDate) => {
  try {
    console.log('📈 Getting payment statistics...');
    const { data } = await multicardApi.post(`/multicard/store/${storeId}/statistics`, {
      params: { startDate, endDate }
    });
    return data;
  } catch (error) {
    console.error('❌ Get payment statistics error:', error);
    throw error;
  }
};

export const getApplicationInfo = async () => {
  try {
    console.log('ℹ️ Getting application info...');
    const { data } = await multicardApi.post('/multicard/application/info');
    return data;
  } catch (error) {
    console.error('❌ Get application info error:', error);
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
    package_code: item.packageCode || '1873404',
    name: item.name,
    ...(item.vat !== undefined && { vat: item.vat }),
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