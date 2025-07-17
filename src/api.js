// src/api.js - COMPLETELY FIXED VERSION
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
    const merchantId = (import.meta.env.VITE_PAYME_MERCHANT_ID || '').trim();
    
    if (!merchantId || merchantId === 'undefined' || merchantId.length < 10) {
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
    const merchantId = (import.meta.env.VITE_PAYME_MERCHANT_ID || '').trim();
    
    if (!merchantId || merchantId === 'undefined' || merchantId.length < 10) {
      throw new Error('Invalid PayMe Merchant ID configuration');
    }
    
    const amounts = getPaymentAmounts();
    const planAmount = amounts[plan]?.tiyin;
    
    if (!planAmount) {
      throw new Error(`Unknown plan: ${plan}`);
    }
    
    // Generate clean order ID (only alphanumeric)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const orderId = options.Login || `aced${timestamp}${randomStr}`;
    
    // Sanitize order ID
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, '');
    
    // Create detail object
    const detail = {
      receipt_type: 0,
      items: [{
        title: `ACED ${plan.toUpperCase()} Subscription`,
        price: planAmount,
        count: 1,
        code: "10899002001000000",
        vat_percent: 0,
        package_code: "123456"
      }]
    };
    
    // Safe JSON encoding
    let detailBase64 = '';
    try {
      const detailJson = JSON.stringify(detail);
      detailBase64 = btoa(unescape(encodeURIComponent(detailJson)));
    } catch (encodingError) {
      console.error('❌ Detail encoding failed:', encodingError);
    }
    
    // Generate clean callback URL
    const callbackUrl = options.callback || `${window.location.origin}/payment/success`;
    const cleanCallback = encodeURIComponent(callbackUrl);
    
    // Validate language parameter
    const validLanguages = ['ru', 'uz', 'en'];
    const language = validLanguages.includes(options.lang) ? options.lang : 'ru';
    
    // Validate timeout parameter
    const callbackTimeout = options.callback_timeout && Number.isInteger(Number(options.callback_timeout)) 
      ? options.callback_timeout 
      : 15000;
    
    // Generate form HTML
    const formHtml = `
    <form method="POST" action="https://checkout.paycom.uz/" id="payme-form" style="display: none;">
      <input type="hidden" name="merchant" value="${merchantId}"/>
      <input type="hidden" name="amount" value="${planAmount}"/>
      <input type="hidden" name="account[Login]" value="${cleanOrderId}"/>
      <input type="hidden" name="lang" value="${language}"/>
      <input type="hidden" name="callback" value="${cleanCallback}"/>
      <input type="hidden" name="callback_timeout" value="${callbackTimeout}"/>
      <input type="hidden" name="description" value="ACED ${plan.toUpperCase()} Plan Subscription"/>
      ${detailBase64 ? `<input type="hidden" name="detail" value="${detailBase64}"/>` : ''}
      <button type="submit" style="display: none;">Pay with PayMe</button>
    </form>
    
    <script>
      function submitPaymeForm() {
        const form = document.getElementById('payme-form');
        if (form) {
          form.submit();
        } else {
          console.error('❌ PayMe form not found in DOM');
        }
      }
      
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

// ✅ PAYMENT INITIATION - MAIN FUNCTION
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
    
    // Default to GET method
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
    
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    
    return {
      success: false,
      error: error.message || 'Ошибка инициации платежа',
      details: error
    };
  }
};

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
      source: response.data.source
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
// 📚 TOPICS AND LESSONS API FUNCTIONS
// =============================================

// ✅ Get all topics
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

// ✅ Get topic by ID with lessons fallback
export const getTopicById = async (topicId) => {
  try {
    console.log('🔍 Fetching topic by ID:', topicId);
    
    if (!topicId) {
      throw new Error('Topic ID is required');
    }
    
    // Try the direct topics endpoint first
    try {
      const { data } = await api.get(`/topics/${topicId}`);
      
      if (data && data.success === true && data.data) {
        return {
          success: true,
          data: data.data,
          message: data.message,
          source: 'topics-endpoint'
        };
      }
      
      if (data && data.exists === true && data.data) {
        return {
          success: true,
          exists: true,
          data: data.data,
          source: 'topics-endpoint'
        };
      }
      
      if (data && (data._id || data.name)) {
        return {
          success: true,
          data: data,
          source: 'topics-endpoint'
        };
      }
      
    } catch (topicsError) {
      console.warn('⚠️ Topics endpoint failed:', topicsError.response?.status, topicsError.message);
      
      if (topicsError.response?.status !== 404) {
        throw topicsError;
      }
    }
    
    // Fallback - Build topic from lessons
    try {
      const { data: lessonsData } = await api.get('/lessons');
      const allLessons = Array.isArray(lessonsData) ? lessonsData : [];
      
      const topicLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        
        const lessonTopicId = lesson.topicId;
        
        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        } else if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }
        
        return false;
      });
      
      if (topicLessons.length === 0) {
        return {
          success: false,
          error: 'Topic not found',
          code: 404,
          source: 'lessons-fallback'
        };
      }
      
      // Build topic from lessons
      const firstLesson = topicLessons[0];
      const getTopicName = (lesson) => {
        if (!lesson) return 'Без темы';
        
        try {
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
      const totalLessons = topicLessons.length;
      const estimatedTime = totalLessons * 10;
      
      const constructedTopic = {
        _id: topicId,
        id: topicId,
        name: topicName,
        topicName: topicName,
        description: `Курс по теме "${topicName}" содержит ${totalLessons} уроков`,
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
          basedOnLessons: topicLessons.length
        }
      };
      
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
        source: 'fallback-failed'
      };
    }
    
  } catch (error) {
    console.error('❌ Failed to fetch topic by ID:', error);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Topic not found',
        code: 404
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch topic',
      code: error.response?.status
    };
  }
};

// ✅ Get lessons by topic
export const getLessonsByTopic = async (topicId) => {
  try {
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    // Try enhanced endpoint first
    try {
      const { data } = await api.get(`/lessons/topic/${topicId}?includeStats=true&sortBy=createdAt&order=asc`);
      
      if (data && data.success) {
        return {
          success: true,
          data: data.lessons || [],
          stats: data.stats,
          source: 'enhanced-endpoint'
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lessons endpoint failed:', enhancedError.message);
    }
    
    // Try legacy endpoint
    try {
      const { data } = await api.get(`/topics/${topicId}/lessons`);
      
      if (data && data.success) {
        return {
          success: true,
          data: data.data || data.lessons || [],
          source: 'legacy-endpoint'
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
          source: 'legacy-direct'
        };
      }
    } catch (legacyError) {
      console.warn('⚠️ Legacy lessons endpoint failed:', legacyError.message);
    }
    
    // Fallback - filter all lessons
    try {
      const { data } = await api.get('/lessons');
      const allLessons = Array.isArray(data) ? data : [];
      
      const filteredLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        
        const lessonTopicId = lesson.topicId;
        
        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        }
        
        if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }
        
        if (lesson.topic === topicId) {
          return true;
        }
        
        return false;
      });
      
      return {
        success: true,
        data: filteredLessons,
        source: 'fallback-filter'
      };
      
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError);
    }
    
    return {
      success: true,
      data: [],
      message: 'No lessons found for this topic',
      source: 'empty-result'
    };
    
  } catch (error) {
    console.error('❌ Failed to fetch lessons by topic:', error);
    
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch lessons for topic'
    };
  }
};

// ✅ Get all lessons
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

// ✅ Get lesson by ID
export const getLessonById = async (lessonId) => {
  try {
    const { data } = await api.get(`/lessons/${lessonId}`);
    
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
    
    if (error.response?.status === 404) {
      throw new Error('Lesson not found');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this lesson');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    
    throw error;
  }
};

// =============================================
// 📊 USER PROGRESS API FUNCTIONS
// =============================================

// ✅ Submit progress
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
    
    const endpoints = [
      `/users/${userId}/progress/save`,
      `/progress`,
      `/users/${userId}/lesson/${progressData.lessonId}`,
      `/user-progress`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const dataToSend = endpoint.includes('/progress') && !endpoint.includes('users') 
          ? enhancedData
          : { ...enhancedData, userId: undefined };
        
        const { data } = await api.post(endpoint, dataToSend, { headers, timeout: 15000 });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            endpoint: endpoint
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress save failed via ${endpoint}:`, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All progress save endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to save progress:', error);
    throw error;
  }
};

// ✅ Get lesson progress
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token available for progress');
      return { success: false, data: null };
    }

    const headers = { Authorization: `Bearer ${token}` };
    
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

// ✅ Get user progress
export const getUserProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
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
// 📚 HOMEWORK API FUNCTIONS
// =============================================

// ✅ Helper: Build homework list from multiple sources
const buildHomeworkListFallback = async (token, userId, headers) => {
  let allHomeworks = [];
  let lessonsWithHomework = [];
  let userProgress = [];

  // Get standalone homework
  try {
    const { data: hwResponse } = await api.get('/homeworks', { headers });
    allHomeworks = hwResponse.data || hwResponse || [];
  } catch (hwError) {
    console.warn('⚠️ Could not fetch standalone homework:', hwError.message);
  }

  // Get lessons with homework
  try {
    const { data: lessonsResponse } = await api.get('/lessons', { headers });
    const allLessons = lessonsResponse.data || lessonsResponse || [];
    lessonsWithHomework = allLessons.filter(lesson => 
      lesson.homework && Array.isArray(lesson.homework) && lesson.homework.length > 0
    );
  } catch (lessonsError) {
    console.warn('⚠️ Could not fetch lessons:', lessonsError.message);
  }

  // Get user progress
  try {
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
          break;
        }
      } catch (progressError) {
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

// ✅ Get all homework
export const getAllHomeworks = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Try enhanced endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}`, { headers });
      
      if (data && data.success && Array.isArray(data.data)) {
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
        throw new Error('Ошибка сервера при загрузке домашних заданий');
      }
    }
    
    // Try alternative endpoints
    const alternativeEndpoints = [
      `/users/${userId}/homeworks`,
      `/homeworks/users/${userId}`,
      `/user/${userId}/homework`
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          const homeworkData = data.data || data;
          
          if (Array.isArray(homeworkData) && homeworkData.length >= 0) {
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
    
    // Build from multiple sources (fallback)
    const fallbackHomeworks = await buildHomeworkListFallback(token, userId, headers);
    
    if (fallbackHomeworks.length > 0) {
      return {
        success: true,
        data: fallbackHomeworks,
        source: 'fallback-aggregation'
      };
    }
    
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

// ✅ Get homework by lesson
export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Try enhanced endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/lesson/${lessonId}`, { headers });
      
      if (data && data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lesson homework endpoint failed:', enhancedError.message);
    }
    
    // Fallback: Build from lesson data
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

// ✅ Get standalone homework
export const getStandaloneHomework = async (userId, homeworkId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Try user-specific endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/homework/${homeworkId}`, { headers });
      
      if (data && data.success) {
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (userError) {
      console.warn('⚠️ User-specific standalone homework endpoint failed:', userError.message);
    }
    
    // Fallback: Get homework directly and combine with user progress
    try {
      const { data: homeworkData } = await api.get(`/homeworks/${homeworkId}`, { headers });
      
      if (!homeworkData || (!homeworkData.exercises && !homeworkData.data?.exercises)) {
        throw new Error('Домашнее задание не содержит упражнений');
      }
      
      const homework = homeworkData.data || homeworkData;
      
      // Try to get user progress
      let userProgress = null;
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

// ✅ Save homework
export const saveHomework = async (userId, lessonId, answers) => {
  try {
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
    
    const endpoints = [
      `/homeworks/user/${userId}/save`,
      `/users/${userId}/homework/save`,
      `/homework/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
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

// ✅ Submit homework
export const submitHomework = async (userId, lessonId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    const endpoints = [
      `/homeworks/user/${userId}/lesson/${lessonId}/submit`,
      `/users/${userId}/homework/lesson/${lessonId}/submit`,
      `/homework/lesson/${lessonId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
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

// ✅ Save standalone homework
export const saveStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/save`,
      `/users/${userId}/homework/${homeworkId}/save`,
      `/homework/${homeworkId}/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
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

// ✅ Submit standalone homework
export const submitStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/submit`,
      `/users/${userId}/homework/${homeworkId}/submit`,
      `/homework/${homeworkId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
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
// 👤 USER MANAGEMENT API FUNCTIONS
// =============================================

// ✅ Get user info
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

// ✅ Get user status
export const getUserStatus = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
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

// ✅ Save user
export const saveUser = async (userData) => {
  try {
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

// ✅ Update user profile
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
// 📖 STUDY LIST MANAGEMENT
// =============================================

// ✅ Get user study list
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

// ✅ Add to study list
export const addToStudyList = async (userId, topicData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const studyListData = {
      topicId: String(topicData.topicId || topicData._id || ''),
      subject: String(topicData.subject || 'General'),
      level: parseInt(topicData.level) || 1,
      topic: String(topicData.topic || topicData.topicName || topicData.name || 'Без названия'),
      topicName: String(topicData.topicName || topicData.topic || topicData.name || 'Без названия'),
      lessonCount: parseInt(topicData.lessonCount) || 0,
      totalTime: parseInt(topicData.totalTime) || 10,
      type: String(topicData.type || 'free'),
      description: String(topicData.description || ''),
      isActive: true,
      addedAt: new Date().toISOString()
    };
    
    if (!studyListData.topicId) {
      throw new Error('Topic ID is required');
    }
    
    if (!studyListData.topic || studyListData.topic === 'Без названия') {
      throw new Error('Topic name is required');
    }
    
    // Try to add to study list with force flag
    try {
      const { data } = await api.post(`/users/${userId}/study-list`, {
        ...studyListData,
        forceAdd: true,
        createTopicData: {
          _id: studyListData.topicId,
          name: {
            en: studyListData.topic,
            ru: studyListData.topic,
            uz: studyListData.topic
          },
          subject: studyListData.subject,
          level: studyListData.level,
          type: studyListData.type,
          lessonCount: studyListData.lessonCount,
          totalTime: studyListData.totalTime,
          isActive: true
        }
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return data;
      
    } catch (error) {
      console.error('❌ Study list add failed:', error);
      
      // Fallback with minimal data
      const minimalData = {
        topicId: studyListData.topicId,
        topic: studyListData.topic,
        subject: studyListData.subject,
        level: studyListData.level,
        type: studyListData.type
      };
      
      const { data } = await api.post(`/users/${userId}/study-list`, minimalData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return data;
    }
    
  } catch (error) {
    console.error('❌ Failed to add to study list:', error);
    
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    
    if (error.response?.status === 400) {
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        throw new Error('Этот курс уже добавлен в ваш список');
      } else {
        throw new Error('Ошибка добавления курса. Попробуйте еще раз.');
      }
    }
    
    if (error.response?.status === 401) {
      throw new Error('Необходимо войти в аккаунт');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Ошибка сервера. Попробуйте позже');
    }
    
    throw new Error('Не удалось добавить курс. Попробуйте еще раз.');
  }
};

// ✅ Remove from study list
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

// =============================================
// 🧪 TESTS API FUNCTIONS
// =============================================

// ✅ Get available tests
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

// ✅ Get test by ID
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

// ✅ Submit test result
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

// =============================================
// 🔧 UTILITY FUNCTIONS
// =============================================

// ✅ Health check
export const healthCheck = async () => {
  try {
    const { data } = await api.get('/health');
    return data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

// ✅ Auth test
export const authTest = async () => {
  try {
    const { data } = await api.get('/auth-test');
    return data;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
  }
};

// ✅ Get subjects
export const getSubjects = async () => {
  try {
    const { data } = await api.get('/subjects');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error);
    return [];
  }
};

// ✅ Get transaction state text
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

// ✅ General error handler
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

// ✅ Payment error handler
export const handlePaymentError = (error, context = 'Платежная операция') => {
  console.error(`❌ ${context} failed:`, error);
  
  if (error.response?.data?.code && error.response.data.code.toString().startsWith('-316')) {
    return getPaymeErrorMessage(error.response.data.code);
  }
  
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

// ✅ Retry API call helper
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

// ✅ Request cleanup utility
export const cleanupRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
  requestAttempts.clear();
};

// ✅ Reset payment attempts
export const resetPaymentAttempts = (userId) => {
  const keysToDelete = [];
  for (const [key] of requestAttempts.entries()) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => requestAttempts.delete(key));
};

// ✅ Validate PayMe URL
export const validatePaymeUrl = (url) => {
  try {
    const base64Part = url.split('/').pop();
    const decoded = atob(base64Part);
    
    const hasValidMerchant = decoded.includes('m=') && !decoded.includes('m=undefined');
    const hasValidAmount = decoded.includes('a=') && /a=\d+/.test(decoded);
    const hasValidOrderId = decoded.includes('ac.Login=') && !decoded.includes('ac.Login=undefined');
    
    const isCorrupted = decoded.includes('�') || 
                       decoded.includes('\f') || 
                       decoded.includes('\0') ||
                       decoded.includes('[object Object]');
    
    return {
      isValid: hasValidMerchant && hasValidAmount && hasValidOrderId && !isCorrupted,
      hasValidMerchant,
      hasValidAmount,
      hasValidOrderId,
      isCorrupted,
      decodedParams: decoded
    };
    
  } catch (error) {
    console.error('❌ URL validation failed:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// ✅ Test clean URL generation
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
    console.error('❌ Test clean URL generation failed:', error);
    return { success: false, error: error.message };
  }
};

// ✅ System status
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

// ✅ Check API health
export const checkApiHealth = async () => {
  try {
    const healthResponse = await healthCheck();
    
    try {
      const authResponse = await authTest();
    } catch (authError) {
      console.warn('⚠️ Auth test failed (normal if not logged in):', authError.message);
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

// ✅ Detect mobile app
export const isMobileApp = () => {
  return typeof window !== 'undefined' && 
         (window.navigator.userAgent.includes('ACED-Mobile') ||
          window.cordova ||
          window.PhoneGap ||
          window.phonegap);
};

// ✅ Check if online
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// ✅ Offline support
const offlineQueue = [];

export const queueOfflineRequest = (request) => {
  if (!isOnline()) {
    offlineQueue.push(request);
    return true;
  }
  return false;
};

export const processOfflineQueue = async () => {
  if (isOnline() && offlineQueue.length > 0) {
    console.log(`📶 Processing ${offlineQueue.length} offline requests...`);
    const requests = [...offlineQueue];
    offlineQueue.length = 0;
    
    for (const request of requests) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Failed to process offline request:', error);
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

// =============================================
// 🔍 DIAGNOSTIC TOOLS
// =============================================

export const diagnosticTool = {
  
  // Test backend connectivity
  async testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    
    try {
      const healthResponse = await fetch(`${BASE_URL}/health`);
      const healthData = await healthResponse.json();
      
      const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
      const apiHealthData = await apiHealthResponse.json();
      
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
        const token = await currentUser.getIdToken();
        
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
  
  // Test homework endpoints
  async testHomeworkEndpoints(userId) {
    console.log('🔍 Testing homework endpoints for user:', userId);
    
    const results = {};
    
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

// =============================================
// 📱 BACKWARDS COMPATIBILITY & ALIASES
// =============================================

// Keep old function names for compatibility
export const fetchTopics = getTopics;
export const generatePaymentForm = initiatePaymePayment;
export const executePaymentFlow = initiatePaymePayment;
export const applyPromoCode = async (userId, plan, promoCode) => {
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
};

// ✅ FINAL EXPORT
export default api;