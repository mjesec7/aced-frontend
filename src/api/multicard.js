// src/api/multicard.js - Multicard Payment Integration (COMPLETE & FIXED)
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

// =============================================
// 🔧 CREATE MULTICARD API INSTANCE
// =============================================

const multicardApi = axios.create({
  baseURL: `${BASE_URL}/api/payments/multicard`,
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
    const { data } = await multicardApi.get('/test-connection');
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

    // Build OFD data with correct amount
    const ofdData = paymentData.ofd || [{
      qty: 1,
      price: finalAmount, // This should be 45500000 for pro plan
      total: finalAmount, // This should be 45500000 for pro plan
      name: `ACED ${paymentData.plan.toUpperCase()} Plan Subscription`,
      mxik: '10899002001000000',
      package_code: '1873404',
      vat: 0
    }];

    // Build request payload
    const requestPayload = {
      userId: paymentData.userId,
      plan: paymentData.plan,
      amount: finalAmount, // This should be 45500000 for pro plan
      ofd: ofdData,
      lang: paymentData.lang || 'ru',
      userName: paymentData.userName || '',
      userEmail: paymentData.userEmail || ''
    };

    console.log('📤 Sending payment request:', {
      ...requestPayload,
      amountUZS: finalAmount / 100 // This should show 455000 UZS
    });

    // ✅ CRITICAL FIX: Use POST, not GET
    const { data } = await multicardApi.post('/initiate', requestPayload);
    // NOT: await multicardApi.get('/initiate', requestPayload);

    console.log('📥 Backend response received:', {
      success: data.success,
      hasData: !!data.data,
      hasCheckoutUrl: !!data.data?.checkoutUrl
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
      throw new Error(data.error?.details || data.error || 'Payment initiation failed');
    }

  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    
    // Extract error message
    const errorMessage = 
      error.multicardDetails?.message ||
      error.response?.data?.error?.details || 
      error.response?.data?.error?.message ||
      error.response?.data?.error || 
      error.response?.data?.message ||
      error.message ||
      'Unknown payment error occurred';

    // Build detailed error response
    const errorResponse = {
      success: false,
      error: errorMessage,
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        code: error.response?.data?.error?.code,
        timestamp: new Date().toISOString()
      }
    };

    console.error('❌ Detailed error response:', errorResponse);

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
    const { data } = await multicardApi.get(`/invoice/${invoiceId}`);
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
    const { data } = await multicardApi.delete(`/invoice/${invoiceId}`);
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
 * @param {Object} bindingData - Card binding parameters
 * @param {string} bindingData.userId - User ID
 * @param {string} bindingData.redirectUrl - Success redirect URL
 * @param {string} bindingData.redirectDeclineUrl - Decline redirect URL
 * @param {string} [bindingData.callbackUrl] - Optional backend callback URL
 * @returns {Promise<Object>} Binding session data with form URL
 */
export const createCardBindingSession = async (bindingData) => {
  try {
    console.log('💳 Creating card binding session...');

    // Validation
    if (!bindingData.userId) {
      throw new Error('userId is required');
    }
    if (!bindingData.redirectUrl) {
      throw new Error('redirectUrl is required');
    }
    if (!bindingData.redirectDeclineUrl) {
      throw new Error('redirectDeclineUrl is required');
    }

    const { data } = await multicardApi.post('/card/bind', bindingData);

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
 * @param {string} sessionId - Card binding session ID
 * @returns {Promise<Object>} Binding status
 */
export const checkCardBindingStatus = async (sessionId) => {
  try {
    console.log('🔍 Checking card binding status:', sessionId);
    const { data } = await multicardApi.get(`/card/bind/${sessionId}`);
    return data;
  } catch (error) {
    console.error('❌ Check card binding status error:', error);
    throw error;
  }
};

/**
 * Get card information by token
 * @param {string} cardToken - Card token
 * @returns {Promise<Object>} Card information
 */
export const getCardInfo = async (cardToken) => {
  try {
    console.log('💳 Getting card info...');
    const { data } = await multicardApi.get(`/card/${cardToken}`);
    return data;
  } catch (error) {
    console.error('❌ Get card info error:', error);
    throw error;
  }
};

/**
 * Delete/revoke a card token
 * @param {string} cardToken - Card token to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteCard = async (cardToken) => {
  try {
    console.log('🗑️ Deleting card token...');
    const { data } = await multicardApi.delete(`/card/${cardToken}`);
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
 * @param {Object} paymentData - Payment details
 * @param {Object} paymentData.card - Card information
 * @param {string} paymentData.card.token - Saved card token
 * @param {number} paymentData.amount - Amount in tiyin
 * @param {string|number} paymentData.storeId - Store ID
 * @param {string} paymentData.invoiceId - Unique invoice ID
 * @param {string} [paymentData.callbackUrl] - Optional callback URL
 * @param {Array} paymentData.ofd - OFD fiscalization data
 * @returns {Promise<Object>} Payment result
 */
export const createPaymentByToken = async (paymentData) => {
  try {
    console.log('💳 Creating payment by saved card token...');

    // Validation
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

    const { data } = await multicardApi.post('/payment', paymentData);

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
 * Create payment via mobile payment app (Payme, Click, Uzum, etc.)
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.paymentSystem - Payment system (payme, click, uzum, anorbank, etc.)
 * @param {number} paymentData.amount - Amount in tiyin
 * @param {string|number} paymentData.storeId - Store ID
 * @param {string} paymentData.invoiceId - Unique invoice ID
 * @param {string} [paymentData.callbackUrl] - Optional callback URL
 * @param {Array} paymentData.ofd - OFD fiscalization data
 * @param {string} [paymentData.successUrl] - Redirect URL on success
 * @param {string} [paymentData.declineUrl] - Redirect URL on decline
 * @returns {Promise<Object>} Payment app redirect URL
 */
export const createPaymentViaApp = async (paymentData) => {
  try {
    console.log('📱 Creating payment via app:', paymentData.paymentSystem);

    const validSystems = ['payme', 'click', 'uzum', 'anorbank', 'alif', 'oson', 'xazna', 'beepul'];
    if (!validSystems.includes(paymentData.paymentSystem)) {
      throw new Error(`Invalid payment system. Must be one of: ${validSystems.join(', ')}`);
    }

    const { data } = await multicardApi.post('/payment/via-app', paymentData);

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
 * Confirm payment with OTP code (required after createPaymentByToken)
 * @param {string} paymentUuid - Payment UUID from createPaymentByToken response
 * @param {string} otp - 6-digit OTP code from SMS
 * @param {boolean} [debitAvailable=false] - Whether debit is available
 * @returns {Promise<Object>} Confirmation result
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

    const { data } = await multicardApi.put(`/payment/${paymentUuid}`, {
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
 * @param {string} paymentUuid - Payment UUID to refund
 * @returns {Promise<Object>} Refund result
 */
export const refundPayment = async (paymentUuid) => {
  try {
    console.log('🔄 Refunding payment:', paymentUuid);
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
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentInfo = async (paymentUuid) => {
  try {
    console.log('🔍 Getting payment info:', paymentUuid);
    const { data } = await multicardApi.get(`/payment/${paymentUuid}`);
    return data;
  } catch (error) {
    console.error('❌ Get payment info error:', error);
    throw error;
  }
};

// =============================================
// 📊 STATISTICS & REPORTING
// =============================================

/**
 * Get payment history for a store
 * @param {string|number} storeId - Store ID
 * @param {Object} params - Query parameters
 * @param {number} [params.offset=0] - Pagination offset
 * @param {number} [params.limit=100] - Results limit (max 100)
 * @param {string} params.startDate - Start date (YYYY-MM-DD HH:mm:ss)
 * @param {string} params.endDate - End date (YYYY-MM-DD HH:mm:ss)
 * @param {string} [params.onlyStatus] - Filter by status
 * @returns {Promise<Object>} Payment history
 */
export const getPaymentHistory = async (storeId, params) => {
  try {
    console.log('📊 Getting payment history for store:', storeId);
    const { data } = await multicardApi.get(`/store/${storeId}/history`, { params });
    return data;
  } catch (error) {
    console.error('❌ Get payment history error:', error);
    throw error;
  }
};

/**
 * Get payment statistics for a date range
 * @param {string|number} storeId - Store ID
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Object>} Payment statistics
 */
export const getPaymentStatistics = async (storeId, startDate, endDate) => {
  try {
    console.log('📈 Getting payment statistics...');
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
 * Get application/merchant information
 * @returns {Promise<Object>} Application details
 */
export const getApplicationInfo = async () => {
  try {
    console.log('ℹ️ Getting application info...');
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
 * Convert UZS to tiyin (Multicard uses tiyin)
 * @param {number} uzs - Amount in UZS
 * @returns {number} Amount in tiyin (1 UZS = 100 tiyin)
 */
export const uzsToTiyin = (uzs) => {
  return Math.round(uzs * 100);
};

/**
 * Convert tiyin to UZS
 * @param {number} tiyin - Amount in tiyin
 * @returns {number} Amount in UZS
 */
export const tiyinToUzs = (tiyin) => {
  return tiyin / 100;
};

/**
 * Format price for display
 * @param {number} amount - Amount in tiyin
 * @param {string} [locale='uz-UZ'] - Locale for formatting
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, locale = 'uz-UZ') => {
  const uzs = tiyinToUzs(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(uzs);
};

/**
 * Create OFD (fiscalization) data array
 * @param {Array} items - Array of purchase items
 * @returns {Array} Formatted OFD data
 */
export const createOfdData = (items) => {
  return items.map(item => ({
    qty: item.quantity || 1,
    price: typeof item.price === 'number' ? item.price : uzsToTiyin(item.price),
    mxik: item.mxik || '10899002001000000', // Default: digital services
    total: (item.quantity || 1) * (typeof item.price === 'number' ? item.price : uzsToTiyin(item.price)),
    package_code: item.packageCode || '1873404', // Your package code
    name: item.name,
    ...(item.vat !== undefined && { vat: item.vat }),
    ...(item.tin && { tin: item.tin })
  }));
};

/**
 * Get human-readable payment status
 * @param {string} status - Payment status code
 * @returns {string} Localized status text
 */
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

/**
 * Get payment system display name
 * @param {string} ps - Payment system code
 * @returns {string} Display name
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
    xazna: 'Xazna',
    beepul: 'Beepul'
  };
  return psMap[ps] || ps;
};

/**
 * Validate invoice ID format
 * @param {string} invoiceId - Invoice ID to validate
 * @returns {boolean} Is valid
 */
export const isValidInvoiceId = (invoiceId) => {
  return invoiceId && typeof invoiceId === 'string' && invoiceId.length > 5;
};

/**
 * Validate card token format
 * @param {string} token - Card token to validate
 * @returns {boolean} Is valid
 */
export const isValidCardToken = (token) => {
  return token && typeof token === 'string' && token.length > 10;
};

// =============================================
// 📤 DEFAULT EXPORT
// =============================================

export default {
  // Core
  testMulticardConnection,
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
  
  // Payment Operations
  createPaymentByToken,
  createPaymentViaApp,
  confirmPayment,
  refundPayment,
  getPaymentInfo,
  
  // Statistics & Reporting
  getPaymentHistory,
  getPaymentStatistics,
  getApplicationInfo,
  
  // Utilities
  uzsToTiyin,
  tiyinToUzs,
  formatPrice,
  createOfdData,
  getPaymentStatusText,
  getPaymentSystemName,
  isValidInvoiceId,
  isValidCardToken
};
