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

    // Try endpoints that actually exist on the backend
    const endpoints = [
      'progress',        // POST /api/progress (primary - with verifyToken)
      'user-progress'    // POST /api/user-progress (legacy alias)
    ];

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.post(endpoint, enhancedData, { headers, timeout: 15000 });

        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            endpoint: endpoint
          };
        }
      } catch (endpointError) {
        continue;
      }
    }

    throw new Error('All progress save endpoints failed');

  } catch (error) {
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
      return { success: false, data: null };
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try endpoints that actually exist on the backend
    const endpoints = [
      `progress?userId=${userId}&lessonId=${lessonId}`,             // GET /api/progress?userId=X&lessonId=Y
      `progress/lesson/${lessonId}/user/${userId}`,                  // GET /api/progress/lesson/:lessonId/user/:userId
      `progress/user/${userId}/lesson/${lessonId}`                   // GET /api/progress/user/:userId/lesson/:lessonId
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
        if (endpointError.response?.status === 404) {
          continue;
        }
        continue;
      }
    }

    return {
      success: true,
      data: null
    };

  } catch (error) {
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

    // Try endpoints that actually exist on the backend
    const endpoints = [
      `progress?userId=${userId}`,                // GET /api/progress?userId=X (primary)
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
        if (endpointError.response?.status === 404) {
          continue;
        }
        continue;
      }
    }

    return {
      success: true,
      data: []
    };

  } catch (error) {
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
    throw error;
  }
};

/**
 * Get user analytics - comprehensive progress and performance data
 * Tries multiple endpoints for backwards compatibility
 */
export const getUserAnalytics = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try the new dedicated user-analytics endpoint first (most comprehensive)
    try {
      const { data } = await api.get(`user-analytics/${userId}`, { headers });
      if (data.success) {
        return data;
      }
    } catch (e) {
      console.log('user-analytics endpoint not available, trying fallbacks...');
    }

    // Fallback 1: users/:userId/analytics
    try {
      const { data } = await api.get(`users/${userId}/analytics`, { headers });
      return data;
    } catch (error) {
      // Fallback 2: analytics/:userId
      try {
        const { data } = await api.get(`analytics/${userId}`, { headers });
        return data;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  } catch (error) {
    console.error('Failed to fetch user analytics:', error);
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
    throw error;
  }
};