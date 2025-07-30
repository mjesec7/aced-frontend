// src/api.js - UPDATED API WITHOUT PAYME (IMPORTS FROM payments.js)
import axios from 'axios';
import { auth } from '@/firebase';

// ✅ IMPORT ALL PAYMENT FUNCTIONS FROM SEPARATE FILE
import {
  // Main payment functions
  initiatePaymePayment,
  generatePaymeForm,
  applyPromoCode,
  checkPaymentStatus,
  validateUser,
  
  // Utility functions
  getPaymentAmounts,
  formatPaymentAmount,
  getTransactionStateText,
  getPaymeErrorMessage,
  handlePaymentError,
  validatePaymeUrl,
  resetPaymentAttempts,
  
  // Testing functions
  testCleanUrlGeneration,
  testPaymentFlow,
  
  // Aliases
  generatePaymentForm,
  executePaymentFlow
} from './api/payments.js';

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

console.log('✅ Main Website API Base URL:', BASE_URL);

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

// Debounce function to prevent rapid consecutive requests
const debounceRequest = (fn, delay = 500) => {
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
    console.log('🔑 Fresh token obtained');
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
      console.log('🔄 Reusing pending request:', requestKey);
      return pendingRequests.get(requestKey);
    }
    
    // Check request cache
    const cached = requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📋 Using cached response:', requestKey);
      return Promise.resolve(cached.response);
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
    if (response.config?.method && typeof response.config.method === 'string' && response.config.method.toLowerCase() === 'get') {
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
    
    // Enhanced error logging with safe property access
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
      
      console.log(`⏳ Rate limited, retrying in ${delay}ms (attempt ${originalRequest._retryCount})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// =============================================
// 📚 LESSON AND TOPIC API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get all topics with enhanced error handling
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
    
    // Handle different response structures from backend
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

// ✅ COMPLETELY FIXED: Get topic by ID with lessons fallback
export const getTopicById = async (topicId) => {
  try {
    console.log('🔍 API: Fetching topic by ID:', topicId);
    
    // ✅ BULLETPROOF: Validate topicId
    if (!topicId || typeof topicId !== 'string') {
      console.error('❌ Invalid topicId:', topicId);
      return {
        success: false,
        error: 'Invalid topic ID provided',
        code: 400,
        details: 'Topic ID must be a non-empty string'
      };
    }
    
    // ✅ STRATEGY 1: Try the direct topics endpoint first
    try {
      const { data } = await api.get(`/topics/${topicId}`);
      console.log('📘 API: Raw topic response from /topics:', data);
      
      // Handle all possible response structures from your backend
      if (data && data.success === true) {
        if (data.data) {
          console.log('✅ API: Using success+data wrapper format');
          return {
            success: true,
            data: data.data,
            message: data.message,
            source: 'topics-endpoint'
          };
        }
      }
      
      if (data && data.exists === true) {
        if (data.data) {
          console.log('✅ API: Using exists+data wrapper format');
          return {
            success: true,
            exists: true,
            data: data.data,
            source: 'topics-endpoint'
          };
        }
      }
      
      if (data && (data._id || data.name)) {
        console.log('✅ API: Using direct topic object format');
        return {
          success: true,
          data: data,
          source: 'topics-endpoint'
        };
      }
      
    } catch (topicsError) {
      console.warn('⚠️ Topics endpoint failed:', topicsError.response?.status, topicsError.message);
      
      // If it's not a 404, throw the error
      if (topicsError.response?.status !== 404) {
        throw topicsError;
      }
      
      // If it's 404, continue to fallback strategy
      console.log('🔄 Topic not found in /topics, trying lessons fallback...');
    }
    
    // ✅ STRATEGY 2: Fallback - Build topic from lessons (like CataloguePage does)
    try {
      console.log('🔄 Building topic from lessons data...');
      
      // Get all lessons
      const { data: lessonsData } = await api.get('/lessons');
      const allLessons = Array.isArray(lessonsData) ? lessonsData : [];
      
      console.log(`📚 Found ${allLessons.length} total lessons`);
      
      // Filter lessons for this topic
      const topicLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        
        // ✅ BULLETPROOF: Handle different topicId structures safely
        const lessonTopicId = lesson.topicId;
        
        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        } else if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }
        
        return false;
      });
      
      console.log(`📚 Found ${topicLessons.length} lessons for topic ${topicId}`);
      
      if (topicLessons.length === 0) {
        console.log('❌ No lessons found for this topicId');
        return {
          success: false,
          error: 'Topic not found',
          code: 404,
          details: `No lessons found for topic ID: ${topicId}`,
          source: 'lessons-fallback'
        };
      }
      
      // ✅ BUILD TOPIC DATA from lessons (same logic as CataloguePage)
      const firstLesson = topicLessons[0];
      
      // ✅ BULLETPROOF: Extract topic name with proper null checks
      const getTopicName = (lesson) => {
        if (!lesson) return 'Без темы';
        
        try {
          // Check different possible structures
          if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
            return lesson.topic.trim();
          }
          
          const lang = localStorage.getItem('lang') || 'en';
          
          if (lesson.translations && 
              lesson.translations[lang] && 
              lesson.translations[lang].topic &&
              typeof lesson.translations[lang].topic === 'string') {
            return lesson.translations[lang].topic.trim();
          }
          
          if (lesson.topic && typeof lesson.topic === 'object') {
            if (lesson.topic[lang] && typeof lesson.topic[lang] === 'string') {
              return lesson.topic[lang].trim();
            }
            if (lesson.topic.en && typeof lesson.topic.en === 'string') {
              return lesson.topic.en.trim();
            }
          }
          
          // ✅ FALLBACK: Use lesson name if topic name not available
          if (lesson.lessonName && typeof lesson.lessonName === 'string') {
            return `Тема: ${lesson.lessonName.trim()}`;
          }
          
          if (lesson.title && typeof lesson.title === 'string') {
            return `Тема: ${lesson.title.trim()}`;
          }
          
          return 'Без темы';
        } catch (error) {
          console.error('❌ Error getting topic name:', error);
          return 'Без темы';
        }
      };
      
      const topicName = getTopicName(firstLesson);
      
      // Calculate total lessons and time
      const totalLessons = topicLessons.length;
      const estimatedTime = totalLessons * 10; // 10 min per lesson estimate
      
      // ✅ BULLETPROOF: Build the topic object with proper null checks
      const constructedTopic = {
        _id: topicId,
        id: topicId,
        name: topicName,
        topicName: topicName,
        description: `Курс по теме "${topicName}" содержит ${totalLessons} уроков`,
        topicDescription: `Курс по теме "${topicName}" содержит ${totalLessons} уроков`,
        subject: (firstLesson.subject && typeof firstLesson.subject === 'string') ? firstLesson.subject : 'Общий',
        level: (firstLesson.level && typeof firstLesson.level === 'string') ? firstLesson.level : 'Базовый',
        lessonCount: totalLessons,
        totalTime: estimatedTime,
        lessons: topicLessons,
        type: (firstLesson.type && typeof firstLesson.type === 'string') ? firstLesson.type : 'free',
        isActive: true,
        createdAt: firstLesson.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'constructed-from-lessons',
          constructedAt: new Date().toISOString(),
          basedOnLessons: topicLessons.length,
          firstLessonId: firstLesson._id || firstLesson.id
        }
      };
      
      console.log('✅ Successfully constructed topic from lessons:', constructedTopic);
      
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
        details: `Could not find topic ${topicId} in topics or lessons`,
        lessonsError: lessonsError.message,
        source: 'fallback-failed'
      };
    }
    
  } catch (error) {
    console.error('❌ API: Failed to fetch topic by ID:', error);
    
    // ✅ BULLETPROOF: Detailed error handling
    if (error.response?.status === 404) {
      console.log('📍 API: Topic not found (404)');
      return {
        success: false,
        error: 'Topic not found',
        code: 404,
        details: 'The requested topic does not exist'
      };
    }
    
    if (error.response?.status === 403) {
      return {
        success: false,
        error: 'Access denied',
        code: 403,
        details: 'You do not have permission to access this topic'
      };
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return {
        success: false,
        error: 'Network error',
        details: 'Unable to connect to the server'
      };
    }
    
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timeout',
        details: 'The request took too long to complete'
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        success: false,
        error: 'Server error',
        code: error.response.status,
        details: 'Internal server error occurred'
      };
    }
    
    // Generic error handling
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch topic',
      code: error.response?.status,
      details: error.response?.data || error
    };
  }
};

// ✅ COMPLETELY FIXED: Get lessons by topic with comprehensive error handling
export const getLessonsByTopic = async (topicId) => {
  try {
    console.log(`📚 API: Fetching lessons for topic: ${topicId}`);
    
    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    // ✅ STRATEGY 1: Try the enhanced lessons endpoint first
    try {
      console.log('🔄 Strategy 1: Enhanced lessons endpoint...');
      const { data } = await api.get(`/lessons/topic/${topicId}?includeStats=true&sortBy=createdAt&order=asc`);
      
      console.log('📚 Enhanced endpoint raw response:', data);
      
      if (data && data.success) {
        console.log(`✅ Enhanced endpoint success: ${data.lessons?.length || 0} lessons`);
        return {
          success: true,
          data: data.lessons || [],
          stats: data.stats,
          source: 'enhanced-endpoint'
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lessons endpoint failed:', enhancedError.response?.status, enhancedError.message);
      
      // If it's a 501 (Not Implemented), continue to next strategy
      if (enhancedError.response?.status === 501) {
        console.log('📍 501 Not Implemented - endpoint not ready yet');
      }
    }
    
    // ✅ STRATEGY 2: Try legacy topic-specific lessons endpoint
    try {
      console.log('🔄 Strategy 2: Legacy topic lessons endpoint...');
      const { data } = await api.get(`/topics/${topicId}/lessons`);
      
      console.log('📚 Legacy endpoint raw response:', data);
      
      if (data && data.success) {
        console.log(`✅ Legacy endpoint success: ${data.data?.length || data.lessons?.length || 0} lessons`);
        return {
          success: true,
          data: data.data || data.lessons || [],
          source: 'legacy-endpoint'
        };
      } else if (Array.isArray(data)) {
        console.log(`✅ Legacy endpoint (direct array): ${data.length} lessons`);
        return {
          success: true,
          data: data,
          source: 'legacy-direct'
        };
      }
    } catch (legacyError) {
      console.warn('⚠️ Legacy topic lessons endpoint failed:', legacyError.response?.status, legacyError.message);
      
      // If it's a 404, this might mean the topic doesn't exist
      if (legacyError.response?.status === 404) {
        console.log('📍 404 from legacy endpoint - topic might not exist');
      }
    }
    
    // ✅ STRATEGY 3: Final fallback - get all lessons and filter by topicId
    try {
      console.log('🔄 Strategy 3: Fallback - filter all lessons...');
      const { data } = await api.get('/lessons');
      
      console.log(`📚 All lessons response: ${Array.isArray(data) ? data.length : 'not array'} items`);
      
      const allLessons = Array.isArray(data) ? data : [];
      const filteredLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        
        // Handle different topicId structures
        const lessonTopicId = lesson.topicId;
        
        // Direct string comparison
        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        }
        
        // Object with _id or id property
        if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }
        
        // Also check the topic field (legacy)
        if (lesson.topic === topicId) {
          return true;
        }
        
        return false;
      });
      
      console.log(`✅ Fallback filter success: ${filteredLessons.length} lessons found for topic ${topicId}`);
      
      return {
        success: true,
        data: filteredLessons,
        source: 'fallback-filter'
      };
      
    } catch (fallbackError) {
      console.error('❌ Final fallback failed:', fallbackError.message);
    }
    
    // If everything fails, return empty but successful response
    console.log('ℹ️ All strategies failed, returning empty array');
    return {
      success: true,
      data: [],
      message: 'No lessons found for this topic',
      source: 'empty-result'
    };
    
  } catch (error) {
    console.error('❌ API: Failed to fetch lessons by topic:', error);
    
    // Return error response
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch lessons for topic',
      details: error
    };
  }
};

// ✅ FIXED: Get all lessons with enhanced filtering
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

// ✅ FIXED: Get lesson by ID with enhanced error handling
export const getLessonById = async (lessonId) => {
  try {
    const { data } = await api.get(`/lessons/${lessonId}`);
    
    // Handle different response structures from your backend
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
    
    // Provide specific error handling
    if (error.response?.status === 404) {
      throw new Error('Lesson not found');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this lesson');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    
    throw error; // Re-throw for proper error handling in components
  }
};

// =============================================
// 📊 USER PROGRESS API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Submit progress with multiple endpoint fallbacks
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
    
    // Enhanced progress data with all required fields
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
    
    // Try multiple endpoints based on your server.js emergency routes
    const endpoints = [
      `/users/${userId}/progress/save`,
      `/progress`,
      `/users/${userId}/lesson/${progressData.lessonId}`,
      `/user-progress`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const dataToSend = endpoint.includes('/progress') && !endpoint.includes('users') 
          ? enhancedData  // Include userId in data for general progress endpoint
          : { ...enhancedData, userId: undefined }; // Remove userId from data for user-specific endpoints
        
        const { data } = await api.post(endpoint, dataToSend, { headers, timeout: 15000 });
        
        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            endpoint: endpoint
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress save failed via ${endpoint}:`, endpointError.response?.status, endpointError.message);
        continue;
      }
    }
    
    throw new Error('All progress save endpoints failed');
    
  } catch (error) {
    console.error('❌ Failed to save progress:', error);
    throw error;
  }
};

// ✅ FIXED: Get lesson progress with multiple endpoint support
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token available for progress');
      return { success: false, data: null };
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints as per your backend structure
    const endpoints = [
      `/users/${userId}/progress/lesson/${lessonId}`,
      `/user-progress/user/${userId}/lesson/${lessonId}`,
      `/user/${userId}/lesson/${lessonId}`,
      `/progress?userId=${userId}&lessonId=${lessonId}`,
      `/api/progress/${userId}/${lessonId}`,
      `/api/user-progress/${userId}/${lessonId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        const { data } = await api.get(endpoint, { headers });
        
        // Safe check for data structure
        if (data && typeof data === 'object') {
          // Handle different response formats
          const progressData = data.data || data;
          
          if (progressData && (data.success !== false)) {
            console.log(`✅ Progress found via ${endpoint}:`, progressData);
            return {
              success: true,
              data: progressData
            };
          }
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);
        
        // If it's a 404, continue to next endpoint
        if (endpointError.response?.status === 404) {
          continue;
        }
        
        // For other errors, log but continue
        console.warn(`⚠️ Endpoint ${endpoint} error:`, endpointError.response?.status, endpointError.message);
        continue;
      }
    }
    
    // If no endpoint worked, return null progress (not an error)
    console.log('ℹ️ No progress found for lesson, returning null');
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

// ✅ FIXED: Get user progress with enhanced support
export const getUserProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints
    const endpoints = [
      `/users/${userId}/progress`,
      `/user-progress/user/${userId}`,
      `/progress?userId=${userId}`,
      `/api/progress/${userId}`,
      `/api/user-progress/${userId}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying progress endpoint: ${endpoint}`);
        const { data } = await api.get(endpoint, { headers });
        
        // Safe check for data structure
        if (data && typeof data === 'object') {
          const progressData = data.data || data;
          
          if (progressData && (data.success !== false)) {
            console.log(`✅ User progress found via ${endpoint}:`, progressData);
            return {
              success: true,
              data: progressData
            };
          }
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress endpoint ${endpoint} failed:`, endpointError.message);
        
        // If it's a 404, continue to next endpoint
        if (endpointError.response?.status === 404) {
          continue;
        }
        
        // For other errors, log but continue
        console.warn(`⚠️ Progress endpoint ${endpoint} error:`, endpointError.response?.status, endpointError.message);
        continue;
      }
    }
    
    // If no endpoint worked, return empty array (not an error)
    console.log('ℹ️ No user progress found, returning empty array');
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
// 📝 TESTS API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get available tests with fallback support
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

// ✅ FIXED: Get test by ID with fallback support
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

// ✅ FIXED: Submit test result with fallback support
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

// ✅ FIXED: Get test result with enhanced error handling
export const getTestResult = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    const { data } = await api.get(`/users/${userId}/tests/${testId}/result`, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch test result:', error);
    throw error;
  }
};

// ✅ FIXED: Get user test results
export const getUserTestResults = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const { data } = await api.get(`/users/${userId}/tests/results`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test results endpoint failed:', error.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch user test results:', error);
    return { success: false, data: [], error: error.message };
  }
};

// =============================================
// 📚 HOMEWORK API FUNCTIONS - COMPLETELY FIXED
// =============================================

// ✅ HELPER: Build homework list from multiple sources
const buildHomeworkListFallback = async (token, userId, headers) => {
  let allHomeworks = [];
  let lessonsWithHomework = [];
  let userProgress = [];

  // Get standalone homework
  try {
    console.log('📚 Fetching standalone homework...');
    const { data: hwResponse } = await api.get('/homeworks', { headers });
    allHomeworks = hwResponse.data || hwResponse || [];
    console.log(`📚 Found ${allHomeworks.length} standalone homework`);
  } catch (hwError) {
    console.warn('⚠️ Could not fetch standalone homework:', hwError.message);
  }

  // Get lessons with homework
  try {
    console.log('📖 Fetching lessons with homework...');
    const { data: lessonsResponse } = await api.get('/lessons', { headers });
    const allLessons = lessonsResponse.data || lessonsResponse || [];
    lessonsWithHomework = allLessons.filter(lesson => 
      lesson.homework && Array.isArray(lesson.homework) && lesson.homework.length > 0
    );
    console.log(`📖 Found ${lessonsWithHomework.length} lessons with homework`);
  } catch (lessonsError) {
    console.warn('⚠️ Could not fetch lessons:', lessonsError.message);
  }

  // Get user progress
  try {
    console.log('📊 Fetching user progress...');
    
    // Try multiple progress endpoints
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
          console.log(`📊 Found ${userProgress.length} progress records from ${endpoint}`);
          break;
        }
      } catch (progressError) {
        console.warn(`⚠️ Progress endpoint ${endpoint} failed:`, progressError.message);
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

// ✅ FIXED: Get all homework with comprehensive endpoint support
export const getAllHomeworks = async (userId) => {
  try {
    console.log('📥 Fetching all homework for user:', userId);
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ STRATEGY 1: Try the enhanced user homework endpoint
    try {
      console.log('🔄 Trying enhanced user homework endpoint...');
      
      const { data } = await api.get(`/homeworks/user/${userId}`, { headers });
      
      if (data && data.success && Array.isArray(data.data)) {
        console.log(`✅ Enhanced endpoint success: ${data.data.length} homework items`);
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
        // Server error - don't try fallbacks
        throw new Error('Ошибка сервера при загрузке домашних заданий');
      }
    }
    
    // ✅ STRATEGY 2: Try alternative user endpoints
    const alternativeEndpoints = [
      `/users/${userId}/homeworks`,
      `/homeworks/users/${userId}`,
      `/user/${userId}/homework`
    ];
    
    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔄 Trying alternative endpoint: ${endpoint}`);
        
        const { data } = await api.get(endpoint, { headers });
        
        if (data && (data.success !== false)) {
          const homeworkData = data.data || data;
          
          if (Array.isArray(homeworkData) && homeworkData.length >= 0) {
            console.log(`✅ Alternative endpoint success: ${homeworkData.length} homework items`);
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
    
    // ✅ STRATEGY 3: Build homework list from multiple sources (fallback)
    console.log('🔄 Building homework list from multiple sources...');
    
    const fallbackHomeworks = await buildHomeworkListFallback(token, userId, headers);
    
    if (fallbackHomeworks.length > 0) {
      console.log(`✅ Fallback success: ${fallbackHomeworks.length} homework items`);
      return {
        success: true,
        data: fallbackHomeworks,
        source: 'fallback-aggregation'
      };
    }
    
    // ✅ STRATEGY 4: Return empty list if no errors (valid scenario)
    console.log('ℹ️ No homework found - returning empty list');
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

// ✅ FIXED: Get homework by lesson with enhanced support
export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    console.log('📥 Fetching homework for lesson:', { userId, lessonId });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ Try the enhanced endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/lesson/${lessonId}`, { headers });
      
      if (data && data.success) {
        console.log('✅ Enhanced lesson homework endpoint success');
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lesson homework endpoint failed:', enhancedError.message);
    }
    
    // ✅ Fallback: Build from lesson data
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
      try {
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
      } catch (progressError) {
        console.warn('⚠️ Could not fetch lesson progress:', progressError.message);
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

// ✅ FIXED: Get standalone homework
export const getStandaloneHomework = async (userId, homeworkId) => {
  try {
    console.log('📥 Fetching standalone homework:', { userId, homeworkId });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // ✅ Try the user-specific endpoint first
    try {
      const { data } = await api.get(`/homeworks/user/${userId}/homework/${homeworkId}`, { headers });
      
      if (data && data.success) {
        console.log('✅ User-specific standalone homework endpoint success');
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      }
    } catch (userError) {
      console.warn('⚠️ User-specific standalone homework endpoint failed:', userError.message);
    }
    
    // ✅ Fallback: Get homework directly and combine with user progress
    try {
      const { data: homeworkData } = await api.get(`/homeworks/${homeworkId}`, { headers });
      
      if (!homeworkData || (!homeworkData.exercises && !homeworkData.data?.exercises)) {
        throw new Error('Домашнее задание не содержит упражнений');
      }
      
      const homework = homeworkData.data || homeworkData;
      
      // Try to get user progress
      let userProgress = null;
      try {
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
      } catch (progressError) {
        console.warn('⚠️ Could not fetch homework progress:', progressError.message);
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

// ✅ FIXED: Save homework with multiple endpoint support
export const saveHomework = async (userId, lessonId, answers) => {
  try {
    console.log('💾 Saving homework:', { userId, lessonId, answerCount: answers.length });
    
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
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/save`,
      `/users/${userId}/homework/save`,
      `/homework/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Homework saved via ${endpoint}`);
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

// ✅ FIXED: Submit homework with multiple endpoint support
export const submitHomework = async (userId, lessonId, answers) => {
  try {
    console.log('📤 Submitting homework:', { userId, lessonId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/lesson/${lessonId}/submit`,
      `/users/${userId}/homework/lesson/${lessonId}/submit`,
      `/homework/lesson/${lessonId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Homework submitted via ${endpoint}`);
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

// ✅ FIXED: Standalone homework functions
export const saveStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    console.log('💾 Saving standalone homework:', { userId, homeworkId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/save`,
      `/users/${userId}/homework/${homeworkId}/save`,
      `/homework/${homeworkId}/save`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Standalone homework saved via ${endpoint}`);
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

export const submitStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    console.log('📤 Submitting standalone homework:', { userId, homeworkId, answerCount: answers.length });
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const requestData = { answers };
    
    // Try multiple endpoints
    const endpoints = [
      `/homeworks/user/${userId}/homework/${homeworkId}/submit`,
      `/users/${userId}/homework/${homeworkId}/submit`,
      `/homework/${homeworkId}/submit`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, requestData, { headers });
        
        if (data && (data.success !== false)) {
          console.log(`✅ Standalone homework submitted via ${endpoint}`);
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
// 👤 USER MANAGEMENT API FUNCTIONS - FIXED
// =============================================

// ✅ FIXED: Get user info with multiple endpoint support
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

// ✅ FIXED: Get user status with multiple endpoint support
export const getUserStatus = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    // Try multiple endpoints for user status
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
    
    // If all fail, return default
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

// ✅ FIXED: Save user with enhanced error handling
export const saveUser = async (userData) => {
  try {
    // This uses the emergency user save route from server.js
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

// ✅ FIXED: Update user profile
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
// 📖 STUDY LIST MANAGEMENT - FIXED
// =============================================

export const getUserStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/study-list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {
      success: true,
      data: data.data || data || [],
      message: data.message
    };
  } catch (error) {
    console.error('❌ Failed to get study list:', error);
    
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: 'Study list not found, returning empty list'
      };
    }
    
    return {
      success: false,
      data: [],
      error: error.response?.data?.error || error.message
    };
  }
};

export const addToStudyList = async (userId, topicData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No token');
    
    const data = {
      topicId: topicData.topicId || topicData._id,
      topic: topicData.topic || topicData.topicName || topicData.name,
      subject: topicData.subject || 'General',
      level: topicData.level || 1,
      lessonCount: topicData.lessonCount || 0,
      totalTime: topicData.totalTime || 10,
      type: topicData.type || 'free'
    };
    
    const response = await api.post(`/users/${userId}/study-list`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {
      success: true,
      data: response.data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

export const removeFromStudyList = async (userId, topicId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    await api.delete(`/users/${userId}/study-list/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

export const cleanupStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const { data } = await api.post(`/users/${userId}/study-list/cleanup`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to cleanup study list:', error);
    throw error;
  }
};

// =============================================
// 🎯 RECOMMENDATIONS AND ANALYTICS - FIXED
// =============================================

export const getRecommendations = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get recommendations:', error);
    throw error;
  }
};

export const getUserProgressStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress stats:', error);
    throw error;
  }
};

export const getLessonProgressStats = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/progress/lesson/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get lesson progress stats:', error);
    throw error;
  }
};

export const getTopicsProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/topics-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get topics progress:', error);
    throw error;
  }
};

export const getUserPoints = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/points`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user points:', error);
    throw error;
  }
};

// =============================================
// 🎯 GOALS MANAGEMENT - FIXED
// =============================================

export const getUserGoals = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/goals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user goals:', error);
    throw error;
  }
};

export const createUserGoal = async (userId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/goals`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to create user goal:', error);
    throw error;
  }
};

export const updateUserGoal = async (userId, goalId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.put(`/users/${userId}/goals/${goalId}`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to update user goal:', error);
    throw error;
  }
};

export const deleteUserGoal = async (userId, goalId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.delete(`/users/${userId}/goals/${goalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to delete user goal:', error);
    throw error;
  }
};

// =============================================
// 📔 DIARY MANAGEMENT - FIXED
// =============================================

export const saveDiaryEntry = async (userId, diaryData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.post(`/users/${userId}/diary`, diaryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to save diary entry:', error);
    throw error;
  }
};

export const getDiaryEntries = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get diary entries:', error);
    throw error;
  }
};

// =============================================
// 📊 ANALYTICS - FIXED
// =============================================

export const getUserAnalytics = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const { data } = await api.get(`/users/${userId}/analytics`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
      
      try {
        const { data } = await api.get(`/analytics/${userId}`, { headers });
        return data;
      } catch (fallbackError) {
        console.error('❌ All analytics endpoints failed:', fallbackError.message);
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch user analytics:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user stats:', error);
    throw error;
  }
};

export const getUserAchievements = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');
    
    const { data } = await api.get(`/users/${userId}/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user achievements:', error);
    throw error;
  }
};

// =============================================
// 📚 SUBJECTS AND CONTENT - FIXED
// =============================================

export const getSubjects = async () => {
  try {
    const { data } = await api.get('/subjects');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error);
    return [];
  }
};

// =============================================
// 🔧 UTILITY FUNCTIONS - FIXED
// =============================================

export const healthCheck = async () => {
  try {
    const { data } = await api.get('/health');
    return data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    throw error;
  }
};

export const authTest = async () => {
  try {
    const { data } = await api.get('/auth-test');
    return data;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
  }
};

// ✅ GENERAL ERROR HANDLER
export const handleApiError = (error, context = 'API call') => {
  console.error(`❌ ${context} failed:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });
  
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

// ✅ BATCH OPERATIONS HELPER
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

// ✅ REQUEST CLEANUP UTILITY
export const cleanupRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
  console.log('🧹 Request cache cleaned');
};

// ✅ ERROR HANDLING WRAPPER
export const withErrorHandling = async (apiCall, context = 'API call') => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ ${context} failed:`, error);
    
    // Handle different error types
    if (error.response?.status === 401) {
      // Try to refresh token
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

// =============================================
// 🧪 DEVELOPMENT TESTING HELPERS
// =============================================

export const checkApiHealth = async () => {
  try {
    console.log('🏥 Checking API health...');
    
    const healthResponse = await healthCheck();
    console.log('✅ Health check passed:', healthResponse);
    
    try {
      const authResponse = await authTest();
      console.log('✅ Auth test passed:', authResponse);
    } catch (authError) {
      console.warn('⚠️ Auth test failed (this is normal if not logged in):', authError.message);
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

// =============================================
// 📱 MOBILE APP SUPPORT
// =============================================

// Detect if running in mobile app context
export const isMobileApp = () => {
  return typeof window !== 'undefined' && 
         (window.navigator.userAgent.includes('ACED-Mobile') ||
          window.cordova ||
          window.PhoneGap ||
          window.phonegap);
};

// Mobile-optimized API calls
export const mobileApiCall = async (endpoint, options = {}) => {
  if (isMobileApp()) {
    // Add mobile-specific headers
    options.headers = {
      ...options.headers,
      'X-Mobile-App': 'true',
      'X-App-Version': window.ACED_APP_VERSION || '1.0.0'
    };
  }
  
  return api(endpoint, options);
};

// =============================================
// 🔄 OFFLINE SUPPORT
// =============================================

// Check if online
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Queue offline requests
const offlineQueue = [];

export const queueOfflineRequest = (request) => {
  if (!isOnline()) {
    offlineQueue.push(request);
    return true;
  }
  return false;
};

// Process offline queue when back online
export const processOfflineQueue = async () => {
  if (isOnline() && offlineQueue.length > 0) {
    console.log(`📶 Processing ${offlineQueue.length} offline requests...`);
    const requests = [...offlineQueue];
    offlineQueue.length = 0; // Clear queue
    
    for (const request of requests) {
      try {
        await request();
      } catch (error) {
        console.error('❌ Failed to process offline request:', error);
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
    console.log('📵 Device went offline');
  });
}

// =============================================
// 🔍 DIAGNOSTIC TOOLS FOR DEBUGGING
// =============================================

export const diagnosticTool = {
  
  // Test backend connectivity
  async testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    
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
      { name: 'User Status', url: '/api/users/testuser/status', method: 'GET' }
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
      console.error('❌ Auth flow test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// =============================================
// 💳 RE-EXPORT ALL PAYMENT FUNCTIONS
// =============================================

// ✅ Export all imported payment functions so they can be used from this main API file
export {
  // Main payment functions
  initiatePaymePayment,
  generatePaymeForm,
  applyPromoCode,
  checkPaymentStatus,
  validateUser,
  
  // Utility functions
  getPaymentAmounts,
  formatPaymentAmount,
  getTransactionStateText,
  getPaymeErrorMessage,
  handlePaymentError,
  validatePaymeUrl,
  resetPaymentAttempts,
  
  // Testing functions
  testCleanUrlGeneration,
  testPaymentFlow,
  
  // Aliases
  generatePaymentForm,
  executePaymentFlow
};

// ✅ FINAL EXPORT
export default api;