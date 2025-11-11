// src/api/core.js - Core API Setup and Configuration
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

if (!BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined in your .env file!');
}

// Create axios instance
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

// Debounce function
export const debounceRequest = (fn, delay = 500) => {
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

// ========================================
// 🔑 TOKEN MANAGEMENT
// ========================================

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

export const getValidToken = async () => {
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
// 📡 REQUEST INTERCEPTOR
// ========================================

api.interceptors.request.use(async (config) => {
  try {
    const requestKey = createRequestKey(config);

    // Check if we recently made this request
    if (pendingRequests.has(requestKey)) {
      const lastRequestTime = pendingRequests.get(requestKey);
      if (Date.now() - lastRequestTime < 1000) { // 1 second debounce
        // ❌ REMOVE THIS LINE - causing CORS error:
        // config.headers = { ...config.headers, 'X-Debounced': 'true' };
        
        // ✅ Instead, just log it for debugging:
        console.debug('⚡ Debounced request detected:', config.url);
        
        // Or cancel the duplicate request:
        // return Promise.reject({ 
        //   isDuplicate: true, 
        //   message: 'Duplicate request cancelled' 
        // });
      }
    }

    // Track this request
    pendingRequests.set(requestKey, Date.now());

    // Check cache for GET requests
    if (config.method && config.method.toLowerCase() === 'get') {
      const cached = requestCache.get(requestKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        config.headers = { ...config.headers, 'X-Cache-Status': 'HIT' };
      }
    }

    // Add auth token
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

// ========================================
// 📡 RESPONSE INTERCEPTOR
// ========================================

api.interceptors.response.use(
  (response) => {
    // Clean up pending requests
    try {
      const requestKey = createRequestKey(response.config);
      if (requestKey && pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup error:', cleanupError);
    }

    // Cache successful GET requests
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
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Clean up on error
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

// ========================================
// 🛠️ UTILITY FUNCTIONS
// ========================================

export const cleanupRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
};

export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ API call attempt ${attempt} failed:`, error.message);

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export const withErrorHandling = async (apiCall, context = 'API call') => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ ${context} failed:`, error);

    if (error.response?.status === 401) {
      try {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
          return await apiCall();
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error('Authentication failed. Please log in again.');
      }
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error. Please check your connection.');
    }

    throw error;
  }
};

// ========================================
// 🧪 DIAGNOSTIC TOOLS
// ========================================

export const healthCheck = async () => {
  try {
    const { data } = await api.get('health');
    return data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

export const authTest = async () => {
  try {
    const { data } = await api.get('auth-test');
    return data;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
  }
};

export const checkApiHealth = async () => {
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
};

export const getSystemStatus = () => {
  return {
    environment: import.meta.env.MODE,
    baseUrl: BASE_URL,
    cacheSize: requestCache.size,
    pendingRequests: pendingRequests.size,
    auth: {
      hasUser: !!auth.currentUser,
      isRefreshing: isRefreshing,
      queueSize: failedQueue.length
    },
    timestamp: new Date().toISOString()
  };
};

// Export the core API instance
export default api;
export { BASE_URL };