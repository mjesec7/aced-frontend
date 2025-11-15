// src/api/courses.js - Course Management API
import api from './core';
import { auth } from '@/firebase';
import {
  processImageUrl,
  processCurriculum,
  processCurriculumEnhanced,
  processLessonsEnhanced,
  getDefaultThumbnail,
  getDefaultAvatar,
  formatDuration,
  isNewCourse,
  hasHomeworkContent,
  extractHours,
  calculateTotalSteps,
  hasQuizContent,
  hasImageContent,
  generateSkillsList,
  generateModulesList
} from './content-processors';

// =============================================
// 📚 COURSE API FUNCTIONS
// =============================================

/**
 * Get updated courses with proper image processing
 */
export const getUpdatedCourses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString ? `updated-courses?${queryString}` : 'updated-courses';

    const { data } = await api.get(url);

    if (data.success) {
      const processedCourses = (data.courses || []).map(course => ({
        ...course,
        id: course._id || course.id,
        _id: course._id || course.id,
        thumbnail: processImageUrl(course.thumbnail),
        instructor: {
          ...course.instructor,
          avatar: processImageUrl(course.instructor?.avatar)
        },
        curriculum: course.curriculum || []
      }));

      return {
        success: true,
        courses: processedCourses,
        categories: data.categories || [],
        difficulties: data.difficulties || []
      };
    } else {
      throw new Error(data.error || 'Failed to fetch courses');
    }
  } catch (error) {
    console.error('❌ Failed to fetch updated courses:', error);
    return {
      success: false,
      courses: [],
      error: error.message || 'Network error'
    };
  }
};

/**
 * Get single course by ID with proper image processing
 */
export const getCourseById = async (courseId) => {
  try {
    const { data } = await api.get(`updated-courses/${courseId}`);

    if (data && data.success && data.course) {
      const processedCourse = {
        ...data.course,
        id: data.course._id || data.course.id,
        _id: data.course._id || data.course.id,
        thumbnail: processImageUrl(data.course.thumbnail),
        instructor: {
          ...data.course.instructor,
          avatar: processImageUrl(data.course.instructor?.avatar)
        },
        curriculum: processCurriculum(data.course.curriculum || [])
      };

      return {
        success: true,
        data: processedCourse
      };
    } else {
      throw new Error('Course not found or invalid response');
    }
  } catch (error) {
    console.error('❌ Failed to fetch course by ID:', error);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'Course not found',
        status: 404
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to fetch course'
    };
  }
};

/**
 * Get course in structured format
 */
export const getCourseStructured = async (courseId) => {
  try {
    console.log('🔍 Fetching structured course:', courseId);

    const { data } = await api.get(`updated-courses/${courseId}?format=structured`);

    if (data && data.success && data.course) {
      return {
        success: true,
        data: data.course,
        format: 'structured'
      };
    } else {
      throw new Error('Structured course not found');
    }
  } catch (error) {
    console.error('❌ Failed to fetch structured course:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch structured course'
    };
  }
};

/**
 * Get all courses with format preference
 */
export const getUpdatedCoursesWithFormat = async (filters = {}, preferredFormat = 'standard') => {
  try {
    console.log('🔍 Fetching courses with format preference:', preferredFormat);

    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    if (preferredFormat === 'structured') {
      params.append('format', 'structured');
    }

    const queryString = params.toString();
    const url = queryString ? `updated-courses?${queryString}` : 'updated-courses';

    const { data } = await api.get(url);

    if (data.success) {
      const processedCourses = (data.courses || []).map(course => ({
        ...course,
        id: course._id || course.id,
        _id: course._id || course.id,
        thumbnail: processImageUrl(course.thumbnail) || getDefaultThumbnail(course.category),
        instructor: {
          ...course.instructor,
          name: course.instructor?.name || 'ACED Instructor',
          avatar: processImageUrl(course.instructor?.avatar) || getDefaultAvatar(),
          bio: course.instructor?.bio || 'Experienced instructor'
        },
        duration: course.duration || formatDuration(course.estimatedTime),
        level: course.level || course.difficulty || 'Beginner',
        category: course.category || 'General',
        isPremium: Boolean(course.isPremium || course.premium || course.type === 'premium'),
        curriculum: course.curriculum || [],
        structuredData: course.structuredData || null,
        format: data.format || 'standard',
        studentsCount: course.studentsCount || 0,
        rating: course.rating || 0,
        tags: course.tags || [],
        requirements: course.requirements || [],
        learningOutcomes: course.learningOutcomes || [],
        isNew: isNewCourse(course.createdAt),
        hasHomework: hasHomeworkContent(course.curriculum),
        estimatedHours: extractHours(course.duration || course.estimatedTime)
      }));

      return {
        success: true,
        courses: processedCourses,
        format: data.format || 'standard',
        categories: data.categories || [],
        difficulties: data.difficulties || [],
        pagination: data.pagination || {},
        total: data.pagination?.total || processedCourses.length
      };
    } else {
      throw new Error(data.error || 'Failed to fetch courses');
    }
  } catch (error) {
    console.error('❌ Failed to fetch courses with format:', error);
    return {
      success: false,
      courses: [],
      error: error.message || 'Network error',
      format: preferredFormat
    };
  }
};

/**
 * Get single course with comprehensive data
 */
export const getCourseStructuredEnhanced = async (courseId) => {
  try {
    console.log('🔍 Fetching enhanced structured course:', courseId);

    let response = await getCourseStructured(courseId);
    
    if (!response.success) {
      console.warn('⚠️ Structured course fetch failed, trying standard format');
      response = await getCourseById(courseId);
    }
    
    if (response && response.success && response.data) {
      const course = response.data;
      
      const enhancedCourse = {
        ...course,
        id: course._id || course.id,
        _id: course._id || course.id,
        thumbnail: processImageUrl(course.thumbnail) || getDefaultThumbnail(course.category),
        instructor: {
          ...course.instructor,
          name: course.instructor?.name || 'ACED Instructor',
          avatar: processImageUrl(course.instructor?.avatar) || getDefaultAvatar(),
          bio: course.instructor?.bio || 'Experienced instructor'
        },
        curriculum: processCurriculumEnhanced(course.curriculum || []),
        lessons: processLessonsEnhanced(course.lessons || course.curriculum || []),
        format: response.format || 'standard',
        structuredData: response.format === 'structured' ? course : null,
        totalLessons: (course.curriculum || course.lessons || []).length,
        totalSteps: calculateTotalSteps(course.curriculum || course.lessons || []),
        hasQuizzes: hasQuizContent(course.curriculum || course.lessons || []),
        hasImages: hasImageContent(course.curriculum || course.lessons || []),
        skills: generateSkillsList(course),
        modules: generateModulesList(course),
        isBookmarked: false,
        userProgress: null
      };
      
      return {
        success: true,
        data: enhancedCourse,
        format: response.format || 'standard'
      };
    } else {
      throw new Error('Course not found or invalid response');
    }
  } catch (error) {
    console.error('❌ Error fetching enhanced structured course:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch course'
    };
  }
};

/**
 * Get course content/lessons with proper image processing
 */
export const getCourseContent = async (courseId) => {
  try {
    // Try the course-specific lessons endpoint first
    try {
      const { data } = await api.get(`updated-courses/${courseId}/lessons`);

      if (data && data.success) {
        const lessons = (data.lessons || data.data || []).map((lesson, index) => ({
          id: lesson._id || lesson.id || `lesson_${index}`,
          _id: lesson._id || lesson.id || `lesson_${index}`,
          title: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
          lessonName: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
          description: lesson.description || '',
          duration: lesson.duration || '30 мин',
          order: lesson.order || index,
          topicId: courseId,
          subject: lesson.subject || 'General',
          steps: lesson.steps || []
        }));

        return {
          success: true,
          data: lessons,
          source: 'course-lessons-endpoint'
        };
      }
    } catch (courseError) {
      console.warn('⚠️ Course lessons endpoint failed:', courseError.message);
    }

    // Fallback: Get course details and extract curriculum
    try {
      const { data } = await api.get(`updated-courses/${courseId}`);

      if (data && data.success && data.course) {
        const course = data.course;

        const lessons = (course.curriculum || []).map((lesson, index) => ({
          id: lesson._id || lesson.id || `lesson_${index}`,
          _id: lesson._id || lesson.id || `lesson_${index}`,
          title: lesson.title,
          lessonName: lesson.title,
          description: lesson.description,
          duration: lesson.duration || '30 мин',
          order: lesson.order || index,
          topicId: course.id || course._id,
          subject: course.category || 'General',
          steps: lesson.steps || []
        }));

        return {
          success: true,
          data: lessons,
          source: 'course-curriculum'
        };
      }
    } catch (detailError) {
      console.warn('⚠️ Course details endpoint failed:', detailError.message);
    }

    return {
      success: true,
      data: [],
      source: 'empty-result'
    };

  } catch (error) {
    console.error('❌ Failed to fetch course content:', error);
    return {
      success: false,
      data: [],
      error: error.message || 'Failed to fetch course content'
    };
  }
};

/**
 * Toggle bookmark status for a course
 */
export const toggleBookmark = async (userId, courseId, isBookmarked) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for bookmark toggle');
      return {
        success: true,
        bookmarked: isBookmarked,
        message: 'Bookmark toggled (demo mode)'
      };
    }

    const headers = { Authorization: `Bearer ${token}` };
    const method = isBookmarked ? 'POST' : 'DELETE';

    const response = await api({
      method,
      url: `updated-courses/${courseId}/bookmark`,
      headers,
    });

    return {
      success: true,
      data: response.data,
      bookmarked: isBookmarked
    };
  } catch (error) {
    return {
      success: true,
      bookmarked: isBookmarked,
      message: 'Bookmark toggled (offline mode)'
    };
  }
};

/**
 * Get subjects
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

/**
 * Get topics grouped by subject and level (School Mode)
 * Returns structure: { subject: { level: [topics] } }
 */
export const getTopicsGrouped = async () => {
  try {
    const { data } = await api.get('topics/grouped');

    if (data.success) {
      return {
        success: true,
        data: data.data,
        mode: 'school'
      };
    } else {
      throw new Error('Failed to fetch grouped topics');
    }
  } catch (error) {
    console.error('❌ Failed to fetch grouped topics:', error);
    return {
      success: false,
      data: {},
      error: error.message
    };
  }
};

/**
 * Get topics as course cards (Study Centre Mode)
 * @param {Object} filters - Optional filters (search, subject, level)
 */
export const getTopicsAsCourses = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const queryString = params.toString();
    const url = queryString ? `topics/as-courses?${queryString}` : 'topics/as-courses';

    const { data } = await api.get(url);

    if (data.success) {
      return {
        success: true,
        courses: data.data,
        total: data.total,
        mode: 'study-centre'
      };
    } else {
      throw new Error('Failed to fetch courses');
    }
  } catch (error) {
    console.error('❌ Failed to fetch courses:', error);
    return {
      success: false,
      courses: [],
      error: error.message
    };
  }
};