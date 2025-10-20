// src/api/content-processors.js - Content Processing Utilities
import { BASE_URL } from './core';

// =============================================
// 📚 IMAGE PROCESSING
// =============================================

/**
 * Process individual image URL
 */
export function processImageUrl(imageUrl) {
  if (!imageUrl) return null;

  // Handle base64 images
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // Handle relative URLs from backend
  if (imageUrl.startsWith('/uploads/')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';
    return `${baseUrl}${imageUrl}`;
  }

  // Handle other relative URLs
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';
    return `${baseUrl}${imageUrl}`;
  }

  // Handle absolute URLs
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  return imageUrl;
}

/**
 * Process array of images from steps
 */
export function processStepImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .filter(img => img && (img.url || img.base64))
    .map((img, index) => ({
      id: img.id || `img_${index}`,
      url: processImageUrl(img.url || img.base64),
      caption: img.caption || '',
      alt: img.alt || img.caption || `Изображение ${index + 1}`,
      filename: img.filename || `image_${index}`,
      size: img.size || 0,
      order: img.order || index,
      displayOptions: {
        width: img.displayOptions?.width || img.width || 'auto',
        height: img.displayOptions?.height || img.height || 'auto',
        alignment: img.displayOptions?.alignment || img.alignment || 'center',
        zoom: img.displayOptions?.zoom || false
      }
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

// =============================================
// 📝 STEP PROCESSING
// =============================================

/**
 * Process step data with proper image handling
 */
export function processStepData(step, lessonIndex, stepIndex) {
  const baseData = step.data || {};

  switch (step.type) {
    case 'explanation':
    case 'example':
    case 'reading':
      return {
        ...baseData,
        content: baseData.content || step.content || '',
        images: processStepImages(baseData.images || step.images || [])
      };

    case 'image':
      return {
        ...baseData,
        images: processStepImages(baseData.images || step.images || []),
        description: baseData.description || step.description || '',
        caption: baseData.caption || step.caption || ''
      };

    case 'practice':
      return {
        ...baseData,
        instructions: baseData.instructions || step.instructions || step.content || '',
        type: baseData.type || 'guided',
        images: processStepImages(baseData.images || step.images || [])
      };

    case 'quiz':
      if (Array.isArray(baseData) && baseData.length > 0) {
        return baseData.map(quiz => ({
          ...quiz,
          images: processStepImages(quiz.images || [])
        }));
      } else if (step.question || step.content) {
        return [{
          question: step.question || step.content || '',
          type: step.quizType || 'multiple-choice',
          options: (step.options || []).map(opt => ({ text: opt.text || opt })),
          correctAnswer: parseInt(step.correctAnswer) || 0,
          explanation: step.explanation || '',
          images: processStepImages(step.questionImages || [])
        }];
      } else if (step.quizzes && Array.isArray(step.quizzes)) {
        return step.quizzes.map(quiz => ({
          ...quiz,
          images: processStepImages(quiz.images || [])
        }));
      }
      return [];

    default:
      return {
        ...baseData,
        content: baseData.content || step.content || '',
        images: processStepImages(baseData.images || step.images || [])
      };
  }
}

/**
 * Enhanced step data processing with metadata
 */
export function processStepDataEnhanced(step, lessonIndex, stepIndex) {
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
        quizData = baseData.map(quiz => ({
          ...quiz,
          images: processStepImages(quiz.images || [])
        }));
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
        quizData = step.quizzes.map(quiz => ({
          ...quiz,
          images: processStepImages(quiz.images || [])
        }));
      }
      
      return {
        quizzes: quizData,
        questionCount: quizData.length,
        hasQuestions: quizData.length > 0
      };

    default:
      return {
        ...baseData,
        content: baseData.content || step.content || '',
        images: processStepImages(baseData.images || step.images || []),
        hasContent: !!(baseData.content || step.content)
      };
  }
}

/**
 * Process lesson steps with images
 */
export function processSteps(steps, lessonIndex) {
  if (!Array.isArray(steps)) return [];

  return steps.map((step, stepIndex) => ({
    ...step,
    id: step.id || `step_${lessonIndex}_${stepIndex}`,
    type: step.type || 'explanation',
    title: step.title || '',
    description: step.description || '',
    content: step.content || '',
    images: processStepImages(step.images || []),
    data: processStepData(step, lessonIndex, stepIndex)
  }));
}

/**
 * Enhanced step processing with metadata
 */
export function processStepsEnhanced(steps, lessonIndex) {
  if (!Array.isArray(steps)) return [];
  
  return steps.map((step, stepIndex) => ({
    ...step,
    id: step.id || `step_${lessonIndex}_${stepIndex}`,
    type: step.type || 'explanation',
    title: step.title || '',
    description: step.description || '',
    content: step.content || '',
    
    // Enhanced image processing
    images: processStepImages(step.images || []),
    
    // Enhanced data processing
    data: processStepDataEnhanced(step, lessonIndex, stepIndex),
    
    // Computed properties
    hasContent: !!(step.content || step.data?.content),
    hasImages: (step.images || []).length > 0,
    isInteractive: ['quiz', 'practice'].includes(step.type)
  }));
}

/**
 * Process curriculum array with fallback for empty steps
 */
export function processCurriculum(curriculum) {
  if (!Array.isArray(curriculum)) return [];

  return curriculum.map((lesson, lessonIndex) => {
    let stepsToProcess = lesson.steps || [];

    // Fallback logic: If steps are empty but description exists, create virtual step
    if ((!stepsToProcess || stepsToProcess.length === 0) && lesson.description) {
      console.warn(`⚠️ Lesson "${lesson.title}" has no steps. Creating fallback step.`);
      stepsToProcess = [{
        type: 'explanation',
        title: 'Основная информация',
        content: lesson.description.replace(/\n/g, '<br />'),
        data: {
          content: lesson.description.replace(/\n/g, '<br />')
        }
      }];
    }
    
    return {
      ...lesson,
      id: lesson._id || lesson.id || `lesson_${lessonIndex}`,
      title: lesson.title || `Урок ${lessonIndex + 1}`,
      description: lesson.description || '',
      duration: lesson.duration || '30 мин',
      order: lesson.order || lessonIndex,
      steps: processSteps(stepsToProcess, lessonIndex)
    };
  });
}

// =============================================
// 🎨 DEFAULT ASSETS
// =============================================

export function getDefaultThumbnail(category) {
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

export function getDefaultAvatar() {
  return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
}

// =============================================
// 📊 DATA FORMATTING
// =============================================

export function formatDuration(estimatedTime) {
  if (typeof estimatedTime === 'string') return estimatedTime;
  if (estimatedTime?.hours) return `${estimatedTime.hours} часов`;
  return '10 часов';
}

export function extractMinutes(duration) {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  }
  return 30;
}

export function extractHours(duration) {
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 10;
  }
  if (duration?.hours) return duration.hours;
  return 10;
}

// =============================================
// 🔍 CONTENT ANALYSIS
// =============================================

export function isNewCourse(createdAt) {
  if (!createdAt) return false;
  const courseDate = new Date(createdAt);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return courseDate > weekAgo;
}

export function hasHomeworkContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson => 
    lesson.steps?.some(step => step.type === 'quiz' || step.type === 'practice')
  );
}

export function calculateTotalSteps(curriculum) {
  if (!Array.isArray(curriculum)) return 0;
  return curriculum.reduce((total, lesson) => total + (lesson.steps?.length || 0), 0);
}

export function hasQuizContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson => 
    lesson.steps?.some(step => step.type === 'quiz')
  );
}

export function hasImageContent(curriculum) {
  if (!Array.isArray(curriculum)) return false;
  return curriculum.some(lesson => 
    lesson.steps?.some(step => (step.images || []).length > 0)
  );
}

// =============================================
// 🎯 CONTENT GENERATION
// =============================================

export function generateSkillsList(course) {
  if (course.learningOutcomes && course.learningOutcomes.length > 0) {
    return course.learningOutcomes;
  }
  
  const categorySkills = {
    'ИИ и автоматизация': [
      'Основы искусственного интеллекта',
      'Машинное обучение и нейронные сети',
      'Автоматизация процессов',
      'Работа с данными'
    ],
    'Web-разработка': [
      'HTML, CSS и JavaScript',
      'Современные фреймворки',
      'Адаптивный дизайн',
      'Работа с API'
    ],
    'Графический дизайн': [
      'Принципы дизайна и композиции',
      'Работа с цветом и типографикой',
      'Создание визуальных концепций',
      'Использование профессиональных инструментов'
    ]
  };
  
  return categorySkills[course.category] || [
    'Практические навыки в выбранной области',
    'Современные методы и технологии',
    'Решение реальных задач',
    'Создание портфолио проектов'
  ];
}

export function generateModulesList(course) {
  if (course.curriculum && course.curriculum.length > 0) {
    return course.curriculum.map(lesson => lesson.title);
  }
  
  return [
    'Введение в курс',
    'Основные концепции',
    'Практические задания',
    'Продвинутые темы',
    'Итоговый проект'
  ];
}

// =============================================
// 📋 ENHANCED PROCESSORS
// =============================================

export function processLessonsEnhanced(lessons) {
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

export function processCurriculumEnhanced(curriculum) {
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