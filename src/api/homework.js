// src/api/homework.js - Homework Management API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 🛠️ HELPER FUNCTIONS
// =============================================

/**
 * Build homework list from multiple sources
 */
const buildHomeworkListFallback = async (token, userId, headers) => {
  let allHomeworks = [];
  let lessonsWithHomework = [];
  let userProgress = [];

  // Get standalone homework
  try {
    const { data: hwResponse } = await api.get('homeworks', { headers });
    allHomeworks = hwResponse.data || hwResponse || [];
  } catch (hwError) {
    console.warn('⚠️ Could not fetch standalone homework:', hwError.message);
  }

  // Get lessons with homework
  try {
    const { data: lessonsResponse } = await api.get('lessons', { headers });
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
      `users/${userId}/progress`,
      `progress?userId=${userId}`,
      `user-progress/${userId}`
    ];

    for (const endpoint of progressEndpoints) {
      try {
        const { data: progressResponse } = await api.get(endpoint, { headers });
        userProgress = progressResponse.data || progressResponse || [];

        if (Array.isArray(userProgress)) {
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

// =============================================
// 📚 HOMEWORK API FUNCTIONS
// =============================================

/**
 * Get all homework with comprehensive endpoint support
 */
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

    // STRATEGY 1: Try the enhanced user homework endpoint
    try {
      const { data } = await api.get(`homeworks/user/${userId}`, { headers });

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

    // STRATEGY 2: Try alternative user endpoints
    const alternativeEndpoints = [
      `users/${userId}/homeworks`,
      `homeworks/users/${userId}`,
      `user/${userId}/homework`
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

    // STRATEGY 3: Build homework list from multiple sources (fallback)
    const fallbackHomeworks = await buildHomeworkListFallback(token, userId, headers);

    if (fallbackHomeworks.length > 0) {
      return {
        success: true,
        data: fallbackHomeworks,
        source: 'fallback-aggregation'
      };
    }

    // STRATEGY 4: Return empty list if no errors (valid scenario)
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

/**
 * Get homework by lesson with enhanced support
 */
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

    // Try the enhanced endpoint first
    try {
      const { data } = await api.get(`homeworks/user/${userId}/lesson/${lessonId}`, { headers });

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
      const { data: lessonData } = await api.get(`lessons/${lessonId}`, { headers });

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
          `users/${userId}/progress/lesson/${lessonId}`,
          `progress?userId=${userId}&lessonId=${lessonId}`,
          `user-progress/lesson/${lessonId}?userId=${userId}`
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

/**
 * Get standalone homework
 */
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

    // Try the user-specific endpoint first
    try {
      const { data } = await api.get(`homeworks/user/${userId}/homework/${homeworkId}`, { headers });

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
      const { data: homeworkData } = await api.get(`homeworks/${homeworkId}`, { headers });

      if (!homeworkData || (!homeworkData.exercises && !homeworkData.data?.exercises)) {
        throw new Error('Домашнее задание не содержит упражнений');
      }

      const homework = homeworkData.data || homeworkData;

      // Try to get user progress
      let userProgress = null;
      try {
        const progressEndpoints = [
          `users/${userId}/homework/${homeworkId}/progress`,
          `progress?userId=${userId}&homeworkId=${homeworkId}`,
          `user-progress/homework/${homeworkId}?userId=${userId}`
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

/**
 * Save homework with multiple endpoint support
 */
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

    // Try multiple endpoints
    const endpoints = [
      `homeworks/user/${userId}/save`,
      `users/${userId}/homework/save`,
      `homework/save`
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

/**
 * Submit homework with multiple endpoint support
 */
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

    // Try multiple endpoints
    const endpoints = [
      `homeworks/user/${userId}/lesson/${lessonId}/submit`,
      `users/${userId}/homework/lesson/${lessonId}/submit`,
      `homework/lesson/${lessonId}/submit`
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

/**
 * Save standalone homework
 */
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

    // Try multiple endpoints
    const endpoints = [
      `homeworks/user/${userId}/homework/${homeworkId}/save`,
      `users/${userId}/homework/${homeworkId}/save`,
      `homework/${homeworkId}/save`
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

/**
 * Submit standalone homework
 */
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

    // Try multiple endpoints
    const endpoints = [
      `homeworks/user/${userId}/homework/${homeworkId}/submit`,
      `users/${userId}/homework/${homeworkId}/submit`,
      `homework/${homeworkId}/submit`
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