// src/api/utils.js - API Utility Functions
import { BASE_URL } from './core';

// =============================================
// 🔧 ERROR HANDLING
// =============================================

/**
 * General error handler for API calls
 */
export const handleApiError = (error, context = 'API call') => {
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

// =============================================
// 📱 MOBILE APP SUPPORT
// =============================================

/**
 * Detect if running in mobile app context
 */
export const isMobileApp = () => {
  return typeof window !== 'undefined' &&
         (window.navigator.userAgent.includes('ACED-Mobile') ||
          window.cordova ||
          window.PhoneGap ||
          window.phonegap);
};

// =============================================
// 🔄 OFFLINE SUPPORT
// =============================================

/**
 * Check if online
 */
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Queue offline requests
const offlineQueue = [];

/**
 * Queue offline request
 */
export const queueOfflineRequest = (request) => {
  if (!isOnline()) {
    offlineQueue.push(request);
    return true;
  }
  return false;
};

/**
 * Process offline queue when back online
 */
export const processOfflineQueue = async () => {
  if (isOnline() && offlineQueue.length > 0) {
    const requests = [...offlineQueue];
    offlineQueue.length = 0; // Clear queue

    for (const request of requests) {
      try {
        await request();
      } catch (error) {
// Re-queue failed requests
        offlineQueue.push(request);
      }
    }
  }
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue);
  window.addEventListener('offline', () => {
});
}

// =============================================
// 🔍 DIAGNOSTIC TOOLS
// =============================================

/**
 * Diagnostic tool for debugging
 */
export const diagnosticTool = {
  /**
   * Test backend connectivity
   */
  async testBackendConnectivity() {
    try {
      // Test basic health check
      const healthResponse = await fetch(`${BASE_URL}/health`);
      const healthData = await healthResponse.json();

      // Test API health
      const apiHealthResponse = await fetch(`${BASE_URL}/api/health`);
      const apiHealthData = await apiHealthResponse.json();

      // Test routes endpoint
      const routesResponse = await fetch(`${BASE_URL}/api/routes`);
      const routesData = await routesResponse.json();

      return {
        success: true,
        health: healthData,
        apiHealth: apiHealthData,
        routes: routesData
      };

    } catch (error) {
return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Test critical endpoints
   */
  async testCriticalEndpoints() {
    const endpoints = [
      { name: 'Topics List', url: 'topics', method: 'GET' },
      { name: 'Lessons List', url: 'lessons', method: 'GET' },
      { name: 'Topic by ID', url: 'topics/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'Lesson by ID', url: 'lessons/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'Topic Lessons', url: 'lessons/topic/507f1f77bcf86cd799439011', method: 'GET' },
      { name: 'User Status', url: 'users/testuser/status', method: 'GET' }
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}/api/${endpoint.url}`, {
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
} else {
}

      } catch (error) {
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

  /**
   * Test authentication flow
   */
  async testAuthFlow() {
    try {
      const { auth } = await import('@/firebase');
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Test token retrieval
        const token = await currentUser.getIdToken();

        // Test authenticated API call
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
return {
        success: false,
        error: error.message
      };
    }
  }
};

// =============================================
// 📊 FORMATTING UTILITIES
// =============================================

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'UZS') => {
  try {
    const numAmount = Number(amount);
    
    if (isNaN(numAmount)) {
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
const numAmount = Number(amount) || 0;
    return `${numAmount.toLocaleString('uz-UZ')} сум`;
  }
};

/**
 * Format date
 */
export const formatDate = (date, format = 'default') => {
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Invalid date';
    }
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('ru-RU');
      case 'long':
        return d.toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'time':
        return d.toLocaleTimeString('ru-RU');
      case 'datetime':
        return d.toLocaleString('ru-RU');
      default:
        return d.toLocaleDateString('ru-RU');
    }
  } catch (error) {
return date;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format duration (seconds to readable format)
 */
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  } else if (minutes > 0) {
    return `${minutes}м ${secs}с`;
  } else {
    return `${secs}с`;
  }
};

// =============================================
// 🔐 VALIDATION UTILITIES
// =============================================

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Uzbekistan)
 */
export const isValidPhoneUZ = (phone) => {
  const phoneRegex = /^\+998\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// =============================================
// 🎲 UTILITY FUNCTIONS
// =============================================

/**
 * Generate unique ID
 */
export const generateUniqueId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
return obj;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Sleep function (delay)
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Chunk array
 */
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Remove duplicates from array
 */
export const removeDuplicates = (array, key = null) => {
  if (key) {
    return array.filter((item, index, self) =>
      index === self.findIndex((t) => t[key] === item[key])
    );
  }
  return [...new Set(array)];
};

/**
 * Sort array of objects
 */
export const sortByKey = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (order === 'asc') {
      return a[key] > b[key] ? 1 : -1;
    } else {
      return a[key] < b[key] ? 1 : -1;
    }
  });
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Get random item from array
 */
export const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// =============================================
// 🌐 BROWSER UTILITIES
// =============================================

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  } catch (error) {
return false;
  }
};

/**
 * Download file
 */
export const downloadFile = (data, filename, mimeType = 'text/plain') => {
  try {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
return false;
  }
};

/**
 * Get browser info
 */
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1];
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1];
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1];
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1];
  }
  
  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua
  };
};

// =============================================
// 📦 EXPORT ALL
// =============================================

export default {
  // Error handling
  handleApiError,
  
  // Mobile support
  isMobileApp,
  
  // Offline support
  isOnline,
  queueOfflineRequest,
  processOfflineQueue,
  
  // Diagnostics
  diagnosticTool,
  
  // Formatting
  formatCurrency,
  formatDate,
  formatFileSize,
  formatDuration,
  
  // Validation
  isValidEmail,
  isValidPhoneUZ,
  isValidUrl,
  
  // Utilities
  generateUniqueId,
  deepClone,
  debounce,
  throttle,
  sleep,
  chunkArray,
  removeDuplicates,
  sortByKey,
  groupBy,
  calculatePercentage,
  getRandomItem,
  truncateText,
  
  // Browser utilities
  copyToClipboard,
  downloadFile,
  getBrowserInfo
};