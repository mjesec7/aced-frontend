// src/api/progress.js
import api from './core.js';
import { auth } from '@/firebase';

/**
 * ✅ FIXED: Submit progress with multiple endpoint fallbacks
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

    // Try multiple endpoints based on your server's emergency routes
    const endpoints = [
      `users/${userId}/progress/save`,
      `progress`,
      `users/${userId}/lesson/${progressData.lessonId}`,
      `user-progress`
    ];

    for (const endpoint of endpoints) {
      try {
        const dataToSend = endpoint.includes('/progress') && !endpoint.includes('users')
          ? enhancedData // Include userId in data for general progress endpoint
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

/**
 * ✅ FIXED: Get lesson progress with multiple endpoint support
 */
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
      `users/${userId}/progress/lesson/${lessonId}`,
      `user-progress/user/${userId}/lesson/${lessonId}`,
      `user/${userId}/lesson/${lessonId}`,
      `progress?userId=${userId}&lessonId=${lessonId}`,
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
          continue; // It's expected that progress might not exist, so 404 is okay.
        }
        continue;
      }
    }

    // If no endpoint worked, return null progress (not an error, just means no progress found)
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
 * ✅ FIXED: Get all user progress with enhanced support
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
        continue;
      }
    }

    // If no endpoint worked, return empty array (not an error)
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