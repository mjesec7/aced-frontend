// src/api/lessons.js - Lessons and Topics Management API
import api from './core';
import { processSteps } from './content-processors';

// =============================================
// 📚 TOPIC API FUNCTIONS
// =============================================

/**
 * Get all topics with enhanced error handling
 */
export const getTopics = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString ? `topics?${queryString}` : 'topics';

    const { data } = await api.get(url);

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

/**
 * Get topic by ID with lessons fallback
 */
export const getTopicById = async (topicId) => {
  try {
    if (!topicId || typeof topicId !== 'string') {
      console.error('❌ Invalid topicId:', topicId);
      return {
        success: false,
        error: 'Invalid topic ID provided',
        code: 400,
        details: 'Topic ID must be a non-empty string'
      };
    }

    // STRATEGY 1: Try the direct topics endpoint first
    try {
      const { data } = await api.get(`topics/${topicId}`);

      if (data && data.success === true) {
        if (data.data) {
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
          return {
            success: true,
            exists: true,
            data: data.data,
            source: 'topics-endpoint'
          };
        }
      }

      if (data && (data._id || data.name)) {
        return {
          success: true,
          data: data,
          source: 'topics-endpoint'
        };
      }

    } catch (topicsError) {
      console.warn('⚠️ Topics endpoint failed:', topicsError.response?.status, topicsError.message);

      if (topicsError.response?.status !== 404) {
        throw topicsError;
      }
    }

    // STRATEGY 2: Fallback - Build topic from lessons
    try {
      const { data } = await api.get('lessons');
      const allLessons = Array.isArray(data) ? data : [];

      const topicLessons = allLessons.filter(lesson => {
        if (!lesson) return false;

        const lessonTopicId = lesson.topicId;

        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        } else if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }

        return false;
      });

      if (topicLessons.length === 0) {
        return {
          success: false,
          error: 'Topic not found',
          code: 404,
          details: `No lessons found for topic ID: ${topicId}`,
          source: 'lessons-fallback'
        };
      }

      const firstLesson = topicLessons[0];

      const getTopicName = (lesson) => {
        if (!lesson) return 'Без темы';
        const lang = localStorage.getItem('lang') || 'en';

        if (typeof lesson.topic === 'string' && lesson.topic.trim()) {
          return lesson.topic.trim();
        }

        if (lesson.translations && lesson.translations[lang] && typeof lesson.translations[lang].topic === 'string' && lesson.translations[lang].topic.trim()) {
          return lesson.translations[lang].topic.trim();
        }

        if (lesson.topic && typeof lesson.topic === 'object') {
          if (typeof lesson.topic[lang] === 'string' && lesson.topic[lang].trim()) {
            return lesson.topic[lang].trim();
          }
          if (typeof lesson.topic.en === 'string' && lesson.topic.en.trim()) {
            return lesson.topic.en.trim();
          }
        }

        if (typeof lesson.lessonName === 'string' && lesson.lessonName.trim()) {
          return `Тема: ${lesson.lessonName.trim()}`;
        }

        if (typeof lesson.title === 'string' && lesson.title.trim()) {
          return `Тема: ${lesson.title.trim()}`;
        }

        return 'Без темы';
      };

      const topicName = getTopicName(firstLesson);
      const totalLessons = topicLessons.length;
      const estimatedTime = totalLessons * 10;

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

    if (error.response?.status === 404) {
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

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch topic',
      code: error.response?.status,
      details: error.response?.data || error
    };
  }
};

/**
 * Get lessons by topic with comprehensive error handling
 */
export const getLessonsByTopic = async (topicId) => {
  try {
    console.log('🔍 API: Fetching lessons for topic:', topicId);

    if (!topicId) {
      throw new Error('Topic ID is required');
    }

    // Strategy 1: Try the enhanced lessons endpoint first
    try {
      const { data } = await api.get(`lessons/topic/${topicId}?includeStats=true&sortBy=createdAt&order=asc`);
      console.log('✅ Enhanced endpoint response:', data);

      if (data && data.success) {
        return {
          success: true,
          data: data.lessons || [],
          stats: data.stats,
          source: 'enhanced-endpoint'
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced endpoint failed:', enhancedError.message);
    }

    // Strategy 2: Try legacy topic-specific lessons endpoint
    try {
      const { data } = await api.get(`topics/${topicId}/lessons`);
      console.log('✅ Legacy endpoint response:', data);

      if (data && data.success) {
        return {
          success: true,
          data: data.data || data.lessons || [],
          source: 'legacy-endpoint'
        };
      } else if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
          source: 'legacy-direct'
        };
      }
    } catch (legacyError) {
      console.warn('⚠️ Legacy endpoint failed:', legacyError.message);
    }

    // Strategy 3: Final fallback - get all lessons and filter by topicId
    try {
      const { data } = await api.get('lessons');
      const allLessons = Array.isArray(data) ? data : [];

      const filteredLessons = allLessons.filter(lesson => {
        if (!lesson) return false;

        const lessonTopicId = lesson.topicId;

        if (typeof lessonTopicId === 'string') {
          return lessonTopicId === topicId;
        }

        if (typeof lessonTopicId === 'object' && lessonTopicId !== null) {
          return (lessonTopicId._id || lessonTopicId.id) === topicId;
        }

        if (lesson.topic === topicId) {
          return true;
        }

        return false;
      });

      console.log('✅ Filtered lessons:', filteredLessons.length);

      return {
        success: true,
        data: filteredLessons,
        source: 'fallback-filter'
      };

    } catch (fallbackError) {
      console.error('❌ Final fallback failed:', fallbackError.message);
    }

    return {
      success: true,
      data: [],
      message: 'No lessons found for this topic',
      source: 'empty-result'
    };

  } catch (error) {
    console.error('❌ API: Failed to fetch lessons:', error);

    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch lessons for topic',
      details: error
    };
  }
};

// =============================================
// 📖 LESSON API FUNCTIONS
// =============================================

/**
 * Get all lessons with enhanced filtering
 */
export const getAllLessons = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString ? `lessons?${queryString}` : 'lessons';

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

/**
 * Get lesson by ID with enhanced error handling
 */
export const getLessonById = async (lessonId) => {
  try {
    const { data } = await api.get(`lessons/${lessonId}`);

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

    if (error.response?.status === 404) {
      throw new Error('Lesson not found');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied to this lesson');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }

    throw error;
  }
};