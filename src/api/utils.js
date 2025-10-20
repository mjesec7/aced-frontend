// src/api/utils.js
import api, { BASE_URL, requestCache, pendingRequests, isRefreshing, failedQueue } from './core.js';
import { auth } from '@/firebase';

// =============================================
// 🔧 UTILITY FUNCTIONS
// =============================================

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

export const handleApiError = (error, context = 'API call') => {
  console.error(`❌ ${context} failed:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
  });

  const status = error.response?.status;
  if (status === 401) return 'Необходимо войти в систему';
  if (status === 403) return 'Доступ запрещен';
  if (status === 404) return 'Ресурс не найден';
  if (status === 429) return 'Слишком много запросов. Подождите и попробуйте снова.';
  if (status >= 500) return 'Ошибка сервера. Попробуйте позже';
  return error.response?.data?.message || error.message || 'Произошла ошибка';
};

export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ API call attempt ${attempt} failed:`, error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error; // Don't retry on auth errors
      }
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export const cleanupRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
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
          return await apiCall(); // Retry after token refresh
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        throw new Error('Authentication failed. Please log in again.');
      }
    }
    throw new Error(handleApiError(error, context));
  }
};

// =============================================
// 🧪 DEVELOPMENT & DIAGNOSTIC TOOLS
// =============================================

export const checkApiHealth = async () => {
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
    const apiHealthData = await apiHealthResponse.json();
    return { success: true, health: healthData, apiHealth: apiHealthData };
  } catch (error) {
    console.error('❌ Backend connectivity test failed:', error);
    return { success: false, error: error.message };
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

export const diagnosticTool = {
  async testBackendConnectivity() {
    try {
      const healthResponse = await fetch(`${BASE_URL}/health`);
      const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
      const routesResponse = await fetch(`${BASE_URL}/api/routes`);
      return {
        success: true,
        health: await healthResponse.json(),
        apiHealth: await apiHealthResponse.json(),
        routes: await routesResponse.json()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testAuthFlow() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: false, error: 'No authenticated user' };
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BASE_URL}/api/auth-test`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return { success: true, user: { uid: currentUser.uid }, tokenValid: response.ok, authTest: await response.json() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};


// =============================================
// 📱 MOBILE APP & 🔄 OFFLINE SUPPORT
// =============================================

export const isMobileApp = () => {
  return typeof window !== 'undefined' && window.navigator.userAgent.includes('ACED-Mobile');
};

export const mobileApiCall = async (config) => {
  if (isMobileApp()) {
    config.headers = {
      ...config.headers,
      'X-Mobile-App': 'true',
      'X-App-Version': window.ACED_APP_VERSION || '1.0.0'
    };
  }
  return api(config);
};

export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

const offlineQueue = [];

export const queueOfflineRequest = (request) => {
  if (!isOnline()) {
    offlineQueue.push(request);
    console.log('📦 Request queued for offline processing.');
    return true;
  }
  return false;
};

export const processOfflineQueue = async () => {
  if (isOnline() && offlineQueue.length > 0) {
    console.log(`📡 Back online. Processing ${offlineQueue.length} queued requests...`);
    const requests = [...offlineQueue];
    offlineQueue.length = 0; // Clear queue immediately

    for (const request of requests) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Failed to process offline request:', error);
        offlineQueue.push(request); // Re-queue failed requests
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue);
}