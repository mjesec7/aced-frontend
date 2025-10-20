// src/api/lessons.js
import api from './core.js';

/**
 * ✅ FIXED: Get all topics with enhanced error handling
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
      // Fallback for unexpected but non-error responses
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
 * ✅ COMPLETELY FIXED: Get topic by ID with lessons fallback
 */
export const getTopicById = async (topicId) => {
  try {
    if (!topicId || typeof topicId !== 'string') {
      console.error('❌ Invalid topicId:', topicId);
      return { success: false, error: 'Invalid topic ID provided', code: 400 };
    }

    // STRATEGY 1: Try the direct topics endpoint first
    try {
      const { data } = await api.get(`topics/${topicId}`);
      if (data && (data.success === true || data.exists === true)) {
        if (data.data) return { success: true, data: data.data, source: 'topics-endpoint' };
      }
      if (data && (data._id || data.name)) {
        return { success: true, data: data, source: 'topics-endpoint' };
      }
    } catch (topicsError) {
      console.warn('⚠️ Topics endpoint failed:', topicsError.response?.status, topicsError.message);
      if (topicsError.response?.status !== 404) throw topicsError;
    }

    // STRATEGY 2: Fallback - Build topic from lessons
    try {
      const { data } = await api.get('lessons');
      const allLessons = Array.isArray(data) ? data : [];
      const topicLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        const lessonTopicId = lesson.topicId;
        if (typeof lessonTopicId === 'string') return lessonTopicId === topicId;
        if (typeof lessonTopicId === 'object' && lessonTopicId !== null) return (lessonTopicId._id || lessonTopicId.id) === topicId;
        return false;
      });

      if (topicLessons.length === 0) {
        return { success: false, error: 'Topic not found', code: 404, source: 'lessons-fallback' };
      }

      const firstLesson = topicLessons[0];
      const getTopicName = (lesson) => {
        if (!lesson) return 'Без темы';
        const lang = localStorage.getItem('lang') || 'en';
        if (typeof lesson.topic === 'string' && lesson.topic.trim()) return lesson.topic.trim();
        if (lesson.translations?.[lang]?.topic) return lesson.translations[lang].topic.trim();
        if (lesson.topic?.[lang]) return lesson.topic[lang].trim();
        if (lesson.topic?.en) return lesson.topic.en.trim();
        return `Тема: ${lesson.lessonName?.trim() || lesson.title?.trim() || 'Без названия'}`;
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
        subject: firstLesson.subject || 'Общий',
        level: firstLesson.level || 'Базовый',
        lessonCount: totalLessons,
        totalTime: estimatedTime,
        lessons: topicLessons,
        type: firstLesson.type || 'free',
        isActive: true,
        metadata: { source: 'constructed-from-lessons', basedOnLessons: totalLessons }
      };

      return { success: true, data: constructedTopic, source: 'lessons-fallback' };
    } catch (lessonsError) {
      console.error('❌ Lessons fallback failed:', lessonsError);
      return { success: false, error: 'Topic not found and lessons fallback failed', code: 404 };
    }
  } catch (error) {
    console.error('❌ API: Failed to fetch topic by ID:', error);
    const status = error.response?.status;
    if (status === 404) return { success: false, error: 'Topic not found', code: 404 };
    if (status === 403) return { success: false, error: 'Access denied', code: 403 };
    if (status >= 500) return { success: false, error: 'Server error', code: status };
    return { success: false, error: error.message || 'Failed to fetch topic', code: status };
  }
};

/**
 * ✅ COMPLETELY FIXED: Get lessons by topic with comprehensive error handling
 */
export const getLessonsByTopic = async (topicId) => {
  try {
    if (!topicId) throw new Error('Topic ID is required');

    // Strategy 1: Enhanced lessons endpoint
    try {
      const { data } = await api.get(`lessons/topic/${topicId}?includeStats=true&sortBy=createdAt&order=asc`);
      if (data && data.success) return { success: true, data: data.lessons || [], stats: data.stats, source: 'enhanced-endpoint' };
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced lessons endpoint failed:', enhancedError.response?.status, enhancedError.message);
    }

    // Strategy 2: Legacy topic-specific lessons endpoint
    try {
      const { data } = await api.get(`topics/${topicId}/lessons`);
      if (data && data.success) return { success: true, data: data.data || data.lessons || [], source: 'legacy-endpoint' };
      if (Array.isArray(data)) return { success: true, data: data, source: 'legacy-direct' };
    } catch (legacyError) {
      console.warn('⚠️ Legacy topic lessons endpoint failed:', legacyError.response?.status, legacyError.message);
    }

    // Strategy 3: Final fallback - get all lessons and filter
    try {
      const { data } = await api.get('lessons');
      const allLessons = Array.isArray(data) ? data : [];
      const filteredLessons = allLessons.filter(lesson => {
        if (!lesson) return false;
        const lessonTopicId = lesson.topicId;
        if (typeof lessonTopicId === 'string') return lessonTopicId === topicId;
        if (typeof lessonTopicId === 'object' && lessonTopicId !== null) return (lessonTopicId._id || lessonTopicId.id) === topicId;
        return lesson.topic === topicId;
      });
      return { success: true, data: filteredLessons, source: 'fallback-filter' };
    } catch (fallbackError) {
      console.error('❌ Final fallback failed:', fallbackError.message);
    }

    return { success: true, data: [], message: 'No lessons found for this topic', source: 'empty-result' };
  } catch (error) {
    console.error('❌ API: Failed to fetch lessons by topic:', error);
    return { success: false, data: [], error: error.message || 'Failed to fetch lessons for topic' };
  }
};

/**
 * ✅ FIXED: Get all lessons with enhanced filtering
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
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error('❌ Failed to fetch all lessons:', error);
    return { success: false, data: [], error: error.message };
  }
};

/**
 * ✅ FIXED: Get lesson by ID with enhanced error handling
 */
export const getLessonById = async (lessonId) => {
  try {
    const { data } = await api.get(`lessons/${lessonId}`);
    if (data && data.success) {
      return { success: true, data: data.lesson, topic: data.topic, stats: data.stats };
    } else if (data && (data._id || data.lessonName)) {
      return { success: true, data: data };
    } else {
      throw new Error('Invalid lesson data structure');
    }
  } catch (error) {
    console.error('❌ Failed to fetch lesson by ID:', error);
    if (error.response?.status === 404) throw new Error('Lesson not found');
    throw error;
  }
};

/**
 * ✅ Get all available subjects
 */
export const getSubjects = async () => {
  try {
    const { data } = await api.get('subjects');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error);
    return [];
  }
};