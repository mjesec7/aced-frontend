// src/api/core.js
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

if (!BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined in your .env file!');
}

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
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

// ========================================
// 🚨 INTERCEPTORS
// ========================================

// REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  try {
    const requestKey = createRequestKey(config);

    if (pendingRequests.has(requestKey)) {
      const lastRequestTime = pendingRequests.get(requestKey);
      if (Date.now() - lastRequestTime < 1000) {
        config.headers = { ...config.headers, 'X-Debounced': 'true' };
      }
    }

    pendingRequests.set(requestKey, Date.now());

    if (config.method && config.method.toLowerCase() === 'get') {
      const cached = requestCache.get(requestKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        config.headers = { ...config.headers, 'X-Cache-Status': 'HIT' };
      }
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
}, (error) => {
  console.error('❌ Request interceptor setup error:', error);
  return Promise.reject(error);
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    try {
      const requestKey = createRequestKey(response.config);
      if (requestKey && pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError);
    }

    if (response.config?.method &&
        response.config.method.toLowerCase() === 'get' &&
        response.status === 200 &&
        !response.config.headers['X-Cache-Status']) {
      try {
        const requestKey = createRequestKey(response.config);
        if (requestKey && !requestKey.includes('unknown')) {
          requestCache.set(requestKey, {
            response: response,
            timestamp: Date.now()
          });
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
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

    const errorInfo = {
      url: error.config?.url || 'unknown',
      method: error.config?.method || 'unknown',
      status: error.response?.status || 'unknown',
      message: error.response?.data?.message || error.message || 'Unknown error'
    };
    console.error('API Error:', errorInfo);

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

    if (error.response?.status === 429 && originalRequest._retryCount < MAX_RETRY_ATTEMPTS) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = RETRY_DELAY * originalRequest._retryCount;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export { requestCache, pendingRequests, isRefreshing, failedQueue, BASE_URL };
export default api;