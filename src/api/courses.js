// src/api/courses.js
import api from './core.js';
import { auth } from '@/firebase';
import { processImageUrl, processCurriculum, processSteps, processStepImages, processStepData } from './content-processors.js';

// =============================================
// 🚀 ENHANCED API FUNCTIONS & HELPERS
// =============================================

function getDefaultThumbnail(category) {
  const defaultImages = {
    'ИИ и автоматизация': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    'Видеомонтаж': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
    'Графический дизайн': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop',
    'Web-разработка': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&h=400&fit=crop',
    'Мобильная разработка': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop',
    'Машинное обучение': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop',
    'Дизайн': 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600&h=400&fit=crop',
    'Программирование': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&h=400&fit=crop',
    'Маркетинг': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop'
  };
  return defaultImages[category] || defaultImages.default;
}

function getDefaultAvatar() {
  return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
}

function formatDuration(estimatedTime) {
  if (typeof estimatedTime === 'string') return estimatedTime;
  if (estimatedTime?.hours) return `${estimatedTime.hours} часов`;
  return '10 часов';
}

function isNewCourse(createdAt) {
  if (!createdAt) return false;
  const courseDate = new Date(createdAt);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return courseDate > weekAgo;
}

function hasHomeworkContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson =>
    lesson.steps?.some(step => step.type === 'quiz' || step.type === 'practice')
  );
}

function extractHours(duration) {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
  }
  if (duration?.hours) return duration.hours;
  return 10;
}

function processStepDataEnhanced(step, lessonIndex, stepIndex) {
  const baseData = step.data || {};

  switch (step.type) {
    case 'explanation':
    case 'example':
    case 'reading':
      return {
        ...baseData,
        content: baseData.content || step.content || '',
        images: processStepImages(baseData.images || step.images || []),
        hasContent: !!(baseData.content || step.content)
      };
    case 'image':
      return {
        ...baseData,
        images: processStepImages(baseData.images || step.images || []),
        description: baseData.description || step.description || '',
        caption: baseData.caption || step.caption || '',
        imageCount: (baseData.images || step.images || []).length
      };
    case 'practice':
      return {
        ...baseData,
        instructions: baseData.instructions || step.instructions || step.content || '',
        type: baseData.type || 'guided',
        images: processStepImages(baseData.images || step.images || []),
        hasInstructions: !!(baseData.instructions || step.instructions || step.content)
      };
    case 'quiz':
      let quizData = [];
      if (Array.isArray(baseData) && baseData.length > 0) {
        quizData = baseData.map(quiz => ({ ...quiz, images: processStepImages(quiz.images || []) }));
      } else if (step.question || step.content) {
        quizData = [{
          question: step.question || step.content || '',
          type: step.quizType || 'multiple-choice',
          options: (step.options || []).map(opt => ({ text: opt.text || opt })),
          correctAnswer: parseInt(step.correctAnswer) || 0,
          explanation: step.explanation || '',
          images: processStepImages(step.questionImages || [])
        }];
      } else if (step.quizzes && Array.isArray(step.quizzes)) {
        quizData = step.quizzes.map(quiz => ({ ...quiz, images: processStepImages(quiz.images || []) }));
      }
      return { quizzes: quizData, questionCount: quizData.length, hasQuestions: quizData.length > 0 };
    default:
      return { ...baseData, content: baseData.content || step.content || '', images: processStepImages(baseData.images || step.images || []), hasContent: !!(baseData.content || step.content) };
  }
}

function processStepsEnhanced(steps, lessonIndex) {
  if (!Array.isArray(steps)) return [];
  return steps.map((step, stepIndex) => ({
    ...step,
    id: step.id || `step_${lessonIndex}_${stepIndex}`,
    type: step.type || 'explanation',
    title: step.title || '',
    description: step.description || '',
    content: step.content || '',
    images: processStepImages(step.images || []),
    data: processStepDataEnhanced(step, lessonIndex, stepIndex),
    hasContent: !!(step.content || step.data?.content),
    hasImages: (step.images || []).length > 0,
    isInteractive: ['quiz', 'practice'].includes(step.type)
  }));
}

function extractMinutes(duration) {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }
  return 30;
}

function processLessonsEnhanced(lessons) {
    if (!Array.isArray(lessons)) return [];
    return lessons.map((lesson, index) => ({
        id: lesson._id?.toString() || `lesson_${index}`,
        _id: lesson._id?.toString() || `lesson_${index}`,
        title: lesson.title,
        lessonName: lesson.title,
        description: lesson.description,
        duration: lesson.duration || '30 мин',
        order: lesson.order || index,
        steps: processStepsEnhanced(lesson.steps || [], index),
        stepCount: (lesson.steps || []).length,
        hasQuiz: (lesson.steps || []).some(step => step.type === 'quiz'),
        hasImages: (lesson.steps || []).some(step => (step.images || []).length > 0),
        estimatedMinutes: extractMinutes(lesson.duration)
    }));
}

function processCurriculumEnhanced(curriculum) {
  if (!Array.isArray(curriculum)) return [];
  return curriculum.map((lesson, index) => ({
    ...lesson,
    id: lesson._id || lesson.id || `lesson_${index}`,
    _id: lesson._id || lesson.id || `lesson_${index}`,
    title: lesson.title || `Урок ${index + 1}`,
    description: lesson.description || '',
    duration: lesson.duration || '30 мин',
    order: lesson.order !== undefined ? lesson.order : index,
    steps: processStepsEnhanced(lesson.steps || [], index),
    stepCount: (lesson.steps || []).length,
    hasQuiz: (lesson.steps || []).some(step => step.type === 'quiz'),
    hasImages: (lesson.steps || []).some(step => step.images?.length > 0),
    estimatedMinutes: extractMinutes(lesson.duration)
  }));
}


function calculateTotalSteps(curriculum) {
  if (!Array.isArray(curriculum)) return 0;
  return curriculum.reduce((total, lesson) => total + (lesson.steps?.length || 0), 0);
}

function hasQuizContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson =>
    lesson.steps?.some(step => step.type === 'quiz')
  );
}

function hasImageContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson =>
    lesson.steps?.some(step => (step.images || []).length > 0)
  );
}

function generateSkillsList(course) {
  if (course.learningOutcomes && course.learningOutcomes.length > 0) {
    return course.learningOutcomes;
  }
  const categorySkills = {
    'ИИ и автоматизация': ['Основы искусственного интеллекта', 'Машинное обучение и нейронные сети', 'Автоматизация процессов', 'Работа с данными'],
    'Web-разработка': ['HTML, CSS и JavaScript', 'Современные фреймворки', 'Адаптивный дизайн', 'Работа с API'],
    'Графический дизайн': ['Принципы дизайна и композиции', 'Работа с цветом и типографикой', 'Создание визуальных концепций', 'Использование профессиональных инструментов']
  };
  return categorySkills[course.category] || ['Практические навыки в выбранной области', 'Современные методы и технологии', 'Решение реальных задач', 'Создание портфолио проектов'];
}

function generateModulesList(course) {
  if (course.curriculum && course.curriculum.length > 0) {
    return course.curriculum.map(lesson => lesson.title);
  }
  return ['Введение в курс', 'Основные концепции', 'Практические задания', 'Продвинутые темы', 'Итоговый проект'];
}

// =============================================
// ✅ FIXED API FUNCTIONS FOR COURSES
// =============================================

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
        instructor: { ...course.instructor, avatar: processImageUrl(course.instructor?.avatar) },
        curriculum: course.curriculum || []
      }));
      return { success: true, courses: processedCourses, categories: data.categories || [], difficulties: data.difficulties || [] };
    } else {
      throw new Error(data.error || 'Failed to fetch courses');
    }
  } catch (error) {
    console.error('❌ Failed to fetch updated courses:', error);
    return { success: false, courses: [], error: error.message || 'Network error' };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const { data } = await api.get(`updated-courses/${courseId}`);
    if (data && data.success && data.course) {
      const processedCourse = {
        ...data.course,
        id: data.course._id || data.course.id,
        _id: data.course._id || data.course.id,
        thumbnail: processImageUrl(data.course.thumbnail),
        instructor: { ...data.course.instructor, avatar: processImageUrl(data.course.instructor?.avatar) },
        curriculum: processCurriculum(data.course.curriculum || [])
      };
      return { success: true, data: processedCourse };
    } else {
      throw new Error('Course not found or invalid response');
    }
  } catch (error) {
    console.error('❌ Failed to fetch course by ID:', error);
    if (error.response?.status === 404) return { success: false, error: 'Course not found', status: 404 };
    return { success: false, error: error.message || 'Failed to fetch course' };
  }
};

export const getCourseStructured = async (courseId) => {
  try {
    console.log('🔍 Fetching structured course:', courseId);
    const { data } = await api.get(`updated-courses/${courseId}?format=structured`);
    if (data && data.success && data.course) {
      return { success: true, data: data.course, format: 'structured' };
    } else {
      throw new Error('Structured course not found');
    }
  } catch (error) {
    console.error('❌ Failed to fetch structured course:', error);
    return { success: false, error: error.message || 'Failed to fetch structured course' };
  }
};

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
        instructor: { ...course.instructor, name: course.instructor?.name || 'ACED Instructor', avatar: processImageUrl(course.instructor?.avatar) || getDefaultAvatar(), bio: course.instructor?.bio || 'Experienced instructor' },
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
      return { success: true, courses: processedCourses, format: data.format || 'standard', categories: data.categories || [], difficulties: data.difficulties || [], pagination: data.pagination || {}, total: data.pagination?.total || processedCourses.length };
    } else {
      throw new Error(data.error || 'Failed to fetch courses');
    }
  } catch (error) {
    console.error('❌ Failed to fetch courses with format:', error);
    return { success: false, courses: [], error: error.message || 'Network error', format: preferredFormat };
  }
};

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
        instructor: { ...course.instructor, name: course.instructor?.name || 'ACED Instructor', avatar: processImageUrl(course.instructor?.avatar) || getDefaultAvatar(), bio: course.instructor?.bio || 'Experienced instructor' },
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
      return { success: true, data: enhancedCourse, format: response.format || 'standard' };
    } else {
      throw new Error('Course not found or invalid response');
    }
  } catch (error) {
    console.error('❌ Error fetching enhanced structured course:', error);
    return { success: false, error: error.message || 'Failed to fetch course' };
  }
};

export const getCourseContent = async (courseId) => {
  try {
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
          steps: processSteps(lesson.steps || [], index)
        }));
        return { success: true, data: lessons, source: 'course-lessons-endpoint' };
      }
    } catch (courseError) {
      console.warn('⚠️ Course lessons endpoint failed:', courseError.message);
    }

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
          steps: processSteps(lesson.steps || [], index)
        }));
        return { success: true, data: lessons, source: 'course-curriculum' };
      }
    } catch (detailError) {
      console.warn('⚠️ Course details endpoint failed:', detailError.message);
    }
    return { success: true, data: [], source: 'empty-result' };
  } catch (error) {
    console.error('❌ Failed to fetch course content:', error);
    return { success: false, data: [], error: error.message || 'Failed to fetch course content' };
  }
};

export const toggleBookmark = async (userId, courseId, isBookmarked) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      console.warn('⚠️ No auth token for bookmark toggle');
      return { success: true, bookmarked: isBookmarked, message: 'Bookmark toggled (demo mode)' };
    }
    const headers = { Authorization: `Bearer ${token}` };
    const method = isBookmarked ? 'POST' : 'DELETE';
    const response = await api({ method, url: `updated-courses/${courseId}/bookmark`, headers });
    return { success: true, data: response.data, bookmarked: isBookmarked };
  } catch (error) {
    return { success: true, bookmarked: isBookmarked, message: 'Bookmark toggled (offline mode)' };
  }
};