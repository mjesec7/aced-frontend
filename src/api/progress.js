// src/api/progress.js - Progress Tracking API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 📊 USER PROGRESS API FUNCTIONS
// =============================================

/**
 * Submit progress with multiple endpoint fallbacks
 */
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

    // Try multiple endpoints
    const endpoints = [
      `users/${userId}/progress/save`,
      `progress`,
      `users/${userId}/lesson/${progressData.lessonId}`,
      `user-progress`
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

/**
 * Get lesson progress with multiple endpoint support
 */
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token available for progress');
      return { success: false, data: null };
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try multiple endpoints
    const endpoints = [
      `users/${userId}/progress/lesson/${lessonId}`,
      `user-progress/user/${userId}/lesson/${lessonId}`,
      `user/${userId}/lesson/${lessonId}`,
      `progress?userId=${userId}&lessonId=${lessonId}`,
      `api/progress/${userId}/${lessonId}`,
      `api/user-progress/${userId}/${lessonId}`
    ];

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });

        if (data && typeof data === 'object') {
          const progressData = data.data || data;

          if (progressData && (data.success !== false)) {
            return {
              success: true,
              data: progressData
            };
          }
        }
      } catch (endpointError) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, endpointError.message);

        if (endpointError.response?.status === 404) {
          continue;
        }

        console.warn(`⚠️ Endpoint ${endpoint} error:`, endpointError.response?.status, endpointError.message);
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

/**
 * Get user progress with enhanced support
 */
export const getUserProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try multiple endpoints
    const endpoints = [
      `users/${userId}/progress`,
      `user-progress/user/${userId}`,
      `progress?userId=${userId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });

        if (data && typeof data === 'object') {
          const progressData = data.data || data;

          if (progressData && (data.success !== false)) {
            return {
              success: true,
              data: progressData
            };
          }
        }
      } catch (endpointError) {
        console.warn(`⚠️ Progress endpoint ${endpoint} failed:`, endpointError.message);

        if (endpointError.response?.status === 404) {
          continue;
        }

        console.warn(`⚠️ Progress endpoint ${endpoint} error:`, endpointError.response?.status, endpointError.message);
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

/**
 * Get user progress stats
 */
export const getUserProgressStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress stats:', error);
    throw error;
  }
};

/**
 * Get lesson progress stats
 */
export const getLessonProgressStats = async (userId, lessonId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/progress/lesson/${lessonId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get lesson progress stats:', error);
    throw error;
  }
};

/**
 * Get topics progress
 */
export const getTopicsProgress = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/topics-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get topics progress:', error);
    throw error;
  }
};

/**
 * Get user points
 */
export const getUserPoints = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/points`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user points:', error);
    throw error;
  }
};

/**
 * Get user analytics
 */
export const getUserAnalytics = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const { data } = await api.get(`users/${userId}/analytics`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);

      try {
        const { data } = await api.get(`analytics/${userId}`, { headers });
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

/**
 * Get user stats
 */
export const getUserStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user stats:', error);
    throw error;
  }
};

/**
 * Get user achievements
 */
export const getUserAchievements = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user achievements:', error);
    throw error;
  }
};

/**
 * Get recommendations
 */
export const getRecommendations = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get recommendations:', error);
    throw error;
  }
};