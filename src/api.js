// src/api.js - ENHANCED MAIN WEBSITE API CONFIGURATION
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    localStorage.setItem('token', token);
    console.log('🔑 Fresh token obtained');
    return token;
  } catch (error) {
    console.error('❌ Failed to get valid token:', error);
    return null;
  }
};

// ✅ ENHANCED REQUEST INTERCEPTOR
api.interceptors.request.use(async (config) => {
  try {
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

// ✅ ENHANCED RESPONSE INTERCEPTOR WITH TOKEN REFRESH
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
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
        localStorage.setItem('token', freshToken);
        
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        processQueue(null, freshToken);
        isRefreshing = false;
        
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ User Progress
export const submitProgress = (userId, progressData) =>
  api.post(`/user-progress`, { userId, ...progressData });

export const getLessonProgress = (userId, lessonId) =>
  api.get(`/user-progress/user/${userId}/lesson/${lessonId}`);

export const getUserProgress = (userId) =>
  api.get(`/user-progress/user/${userId}`);

// ✅ ENHANCED: Tests API with multiple endpoint support
export const getAvailableTests = async (userId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests`);
    return data;
  } catch (error) {
    console.warn('⚠️ User tests endpoint failed, trying direct:', error.message);
    // Fallback to direct tests endpoint
    const { data } = await api.get(`/tests`);
    return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
  }
};

export const getTestById = async (userId, testId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests/${testId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test endpoint failed, trying direct:', error.message);
    // Fallback to direct test endpoint
    const { data } = await api.get(`/tests/${testId}`);
    return { test: data };
  }
};

export const submitTestResult = async (userId, testId, answers) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.post(`/users/${userId}/tests/${testId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User test submit endpoint failed, trying direct:', error.message);
    // Fallback to direct submit endpoint
    const { data } = await api.post(`/tests/${testId}/submit`, { userId, answers });
    return data;
  }
};

export const getTestResult = async (userId, testId) => {
  try {
    // Try user-specific endpoint first
    const { data } = await api.get(`/users/${userId}/tests/${testId}/result`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test result endpoint failed:', error.message);
    // Could implement fallback if needed
    throw error;
  }
};

export const getUserTestResults = async (userId) => {
  try {
    const { data } = await api.get(`/users/${userId}/tests/results`);
    return data;
  } catch (error) {
    console.warn('⚠️ User test results endpoint failed:', error.message);
    return { success: false, data: [] };
  }
};

// ✅ ENHANCED: Homework API with multiple endpoint support
export const getHomeworkByLesson = async (userId, lessonId) => {
  try {
    // Try user-specific lesson homework endpoint
    const { data } = await api.get(`/users/${userId}/homeworks/lesson/${lessonId}`);
    return data;
  } catch (error) {
    console.warn('⚠️ User homework endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework routes
      const { data } = await api.get(`/homeworks/user/${userId}/lesson/${lessonId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const getAllHomeworks = async (userId) => {
  try {
    // Try enhanced user homeworks endpoint
    const { data } = await api.get(`/users/${userId}/homeworks`);
    return data;
  } catch (error) {
    console.warn('⚠️ Enhanced homework endpoint failed, trying legacy:', error.message);
    
    try {
      // Fallback to legacy endpoint
      const { data } = await api.get(`/homeworks/user/${userId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const saveHomework = async (userId, lessonId, answers) => {
  try {
    // Try user-specific save endpoint
    const { data } = await api.post(`/users/${userId}/homeworks/save`, { 
      lessonId, 
      answers, 
      completed: false 
    });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework save endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework save
      const { data } = await api.post(`/homeworks/user/${userId}/save`, { 
        lessonId, 
        answers, 
        completed: false 
      });
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework save endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const submitHomework = async (userId, lessonId, answers) => {
  try {
    // Try user-specific submit endpoint
    const { data } = await api.post(`/users/${userId}/homeworks/lesson/${lessonId}/submit`, { answers });
    return data;
  } catch (error) {
    console.warn('⚠️ User homework submit endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to direct homework submit
      const { data } = await api.post(`/homeworks/user/${userId}/lesson/${lessonId}/submit`, { answers });
      return data;
    } catch (fallbackError) {
      console.error('❌ All homework submit endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

// ✅ ENHANCED: Standalone Homework API (for admin panel created homework)
export const getStandaloneHomework = async (userId, homeworkId) => {
  try {
    const { data } = await api.get(`/users/${userId}/homework/${homeworkId}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to get standalone homework:', error.message);
    throw error;
  }
};

export const saveStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const { data } = await api.post(`/users/${userId}/homework/${homeworkId}/save`, { answers });
    return data;
  } catch (error) {
    console.error('❌ Failed to save standalone homework:', error.message);
    throw error;
  }
};

export const submitStandaloneHomework = async (userId, homeworkId, answers) => {
  try {
    const { data } = await api.post(`/users/${userId}/homework/${homeworkId}/submit`, { answers });
    return data;
  } catch (error) {
    console.error('❌ Failed to submit standalone homework:', error.message);
    throw error;
  }
};

// ✅ User Management
export const getUserInfo = (userId) =>
  api.get(`/users/${userId}`);

export const getUserStatus = (userId) =>
  api.get(`/users/${userId}/status`);

export const saveUser = (userData) =>
  api.post(`/users/save`, userData);

export const updateUserProfile = (userId, profileData) =>
  api.put(`/users/${userId}/profile`, profileData);

// ✅ Study List Management
export const getUserStudyList = (userId) =>
  api.get(`/users/${userId}/study-list`);

export const addToStudyList = (userId, topicData) =>
  api.post(`/users/${userId}/study-list`, topicData);

export const removeFromStudyList = (userId, topicId) =>
  api.delete(`/users/${userId}/study-list/${topicId}`);

export const cleanupStudyList = (userId) =>
  api.post(`/users/${userId}/study-list/cleanup`);

// ✅ Recommendations
export const getRecommendations = (userId) =>
  api.get(`/users/${userId}/recommendations`);

// ✅ Progress Tracking
export const getUserProgressStats = (userId) =>
  api.get(`/users/${userId}/progress`);

export const getLessonProgressStats = (userId, lessonId) =>
  api.get(`/users/${userId}/progress/lesson/${lessonId}`);

export const getTopicsProgress = (userId) =>
  api.get(`/users/${userId}/topics-progress`);

export const getUserPoints = (userId) =>
  api.get(`/users/${userId}/points`);

// ✅ Goals Management
export const getUserGoals = (userId) =>
  api.get(`/users/${userId}/goals`);

export const createUserGoal = (userId, goalData) =>
  api.post(`/users/${userId}/goals`, goalData);

export const updateUserGoal = (userId, goalId, goalData) =>
  api.put(`/users/${userId}/goals/${goalId}`, goalData);

export const deleteUserGoal = (userId, goalId) =>
  api.delete(`/users/${userId}/goals/${goalId}`);

// ✅ Diary Management
export const saveDiaryEntry = (userId, diaryData) =>
  api.post(`/users/${userId}/diary`, diaryData);

export const getDiaryEntries = (userId) =>
  api.get(`/users/${userId}/diary`);

// ✅ ENHANCED: Analytics with fallback support
export const getUserAnalytics = async (userId) => {
  try {
    // Try user-specific analytics endpoint
    const { data } = await api.get(`/users/${userId}/analytics`);
    return data;
  } catch (error) {
    console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
    
    try {
      // Fallback to general analytics endpoint
      const { data } = await api.get(`/analytics/${userId}`);
      return data;
    } catch (fallbackError) {
      console.error('❌ All analytics endpoints failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

export const getUserStats = (userId) =>
  api.get(`/users/${userId}/stats`);

export const getUserAchievements = (userId) =>
  api.get(`/users/${userId}/achievements`);

// ✅ Lessons and Content
export const getLessonById = (lessonId) =>
  api.get(`/lessons/${lessonId}`);

export const getAllLessons = () =>
  api.get(`/lessons`);

export const getTopics = () =>
  api.get(`/topics`);

export const getTopicById = (topicId) =>
  api.get(`/topics/${topicId}`);

export const getSubjects = () =>
  api.get(`/subjects`);

// ✅ Utility Functions
export const healthCheck = () =>
  api.get(`/health`);

export const authTest = () =>
  api.get(`/auth-test`);

// ✅ Error Handler Helper
export const handleApiError = (error, context = 'API call') => {
  console.error(`❌ ${context} failed:`, {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: error.response?.data?.message || error.message,
    data: error.response?.data
  });
  
  // Return user-friendly error message
  if (error.response?.status === 401) {
    return 'Необходимо войти в систему';
  } else if (error.response?.status === 403) {
    return 'Доступ запрещен';
  } else if (error.response?.status === 404) {
    return 'Ресурс не найден';
  } else if (error.response?.status >= 500) {
    return 'Ошибка сервера. Попробуйте позже';
  } else {
    return error.response?.data?.message || error.message || 'Произошла ошибка';
  }
};

// ✅ Batch Operations Helper
export const retryApiCall = async (apiCall, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`⚠️ API call attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default api;