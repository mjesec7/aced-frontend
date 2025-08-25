<template>
  <div class="lesson-player-overlay" @click="handleOverlayClick">
    <div class="lesson-player" @click.stop>
      <header class="player-header">
        <button 
          class="close-btn" 
          @click="$emit('close')" 
          aria-label="Закрыть урок"
          title="Закрыть урок"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="header-content">
          <div class="course-info">
            <span class="course-name">{{ courseTitle }}</span>
            <h1 class="lesson-title">{{ currentLessonTitle }}</h1>
          </div>

          <div class="progress-section">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: progressPercentage }"
              ></div>
            </div>
            <span class="progress-text">
              Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}
            </span>
          </div>
        </div>
      </header>

      <main class="player-content">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <h3>Загрузка курса...</h3>
          <p>Подготавливаем материалы для изучения</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Не удалось загрузить курс</h3>
          <p>{{ error }}</p>
          <button @click="loadCourseContent" class="retry-btn">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="currentLesson && hasSteps" class="lesson-content">
          <div 
            v-for="(step, index) in currentLesson.steps" 
            :key="`step-${index}`"
            class="step-container"
          >
            <div class="step-header">
              <div class="step-number">{{ index + 1 }}</div>
              <h2 class="step-title">{{ getStepTitle(step) }}</h2>
            </div>

            <div class="step-body">
              <component 
                :is="getStepComponent(step.type)"
                :step="step"
                :step-index="index"
                @quiz-answer="handleQuizAnswer"
                @pdf-fullscreen="openPdfFullscreen"
              />
            </div>
          </div>
        </div>

        <div v-else-if="currentLesson && !hasSteps" class="empty-lesson">
          <div class="empty-icon">📝</div>
          <h3>Урок пуст</h3>
          <p>Содержание урока еще не добавлено</p>
        </div>

        <div v-else class="no-content">
          <div class="empty-icon">📚</div>
          <h3>Курс недоступен</h3>
          <p>Материалы курса временно недоступны или не загружены</p>
          <button @click="$emit('back-to-courses')" class="back-btn">
            Вернуться к курсам
          </button>
        </div>
      </main>

      <footer class="player-footer" v-if="!loading && !error && lessons.length > 0">
        <button 
          class="nav-btn nav-btn--secondary"
          :disabled="isFirstLesson"
          @click="goToPreviousLesson"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          Предыдущий
        </button>

        <div class="lesson-counter">
          <span class="current-lesson">{{ currentLessonIndex + 1 }}</span>
          <span class="divider">/</span>
          <span class="total-lessons">{{ totalLessons }}</span>
        </div>

        <button 
          v-if="!isLastLesson"
          class="nav-btn nav-btn--primary"
          @click="goToNextLesson"
        >
          Следующий
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        <button 
          v-else
          class="nav-btn nav-btn--success"
          @click="completeCourse"
        >
          Завершить курс
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
      </footer>
    </div>

    <div v-if="fullscreenPdf" class="pdf-modal" @click="closePdfFullscreen">
      <div class="pdf-container" @click.stop>
        <button 
          class="pdf-close-btn"
          @click="closePdfFullscreen"
          aria-label="Закрыть PDF"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <iframe 
          :src="fullscreenPdf" 
          class="pdf-frame"
          title="PDF Viewer"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script>
// ✅ MAIN FRONTEND API IMPORTS - Uses your backend endpoints
import { getCourseById, getCourseContent } from '@/api.js';

export default {
  name: 'LessonPlayer',
  
  props: {
    course: {
      type: Object,
      required: true,
      validator: (course) => course && (course.title || course._id)
    }
  },

  emits: ['close', 'back-to-courses'],

  data() {
    return {
      lessons: [],
      currentLessonIndex: 0,
      quizAnswers: new Map(),
      fullscreenPdf: null,
      loading: true,
      error: null,
      courseData: null
    }
  },

  computed: {
    courseTitle() {
      return this.courseData?.title || this.course?.title || 'Курс';
    },

    currentLesson() {
      return this.lessons[this.currentLessonIndex] || null;
    },

    currentLessonTitle() {
      const lesson = this.currentLesson;
      if (!lesson) return 'Загрузка урока...';
      return lesson.title || lesson.lessonName || `Урок ${this.currentLessonIndex + 1}`;
    },

    hasSteps() {
      return this.currentLesson && this.currentLesson.steps && this.currentLesson.steps.length > 0;
    },

    totalLessons() {
      return this.lessons.length;
    },

    progressPercentage() {
      if (this.totalLessons === 0) return '0%';
      return `${Math.round(((this.currentLessonIndex + 1) / this.totalLessons) * 100)}%`;
    },

    isFirstLesson() {
      return this.currentLessonIndex === 0;
    },

    isLastLesson() {
      return this.currentLessonIndex === this.totalLessons - 1;
    }
  },

  watch: {
    course: {
      handler() {
        this.loadCourseContent();
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
    // ✅ REAL API CALLS: Load course content from backend
    async loadCourseContent() {
      if (!this.course || (!this.course._id && !this.course.id)) {
        console.error('❌ LessonPlayer: Invalid course data:', this.course);
        this.error = 'Неверные данные курса';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const courseId = this.course._id || this.course.id;
        console.log('📚 LessonPlayer: Loading course content for ID:', courseId);

        let courseDetails = null;
        let lessons = [];

        // Step 1: Try to get complete course details from backend
        try {
          console.log('🔍 Step 1: Fetching course details from API...');
          const courseResponse = await getCourseById(courseId);
          
          if (courseResponse && courseResponse.success && courseResponse.data) {
            courseDetails = courseResponse.data;
            console.log('✅ Course details loaded from API:', courseDetails.title);
            
            // Check if course has curriculum in the response
            if (courseDetails.curriculum && Array.isArray(courseDetails.curriculum)) {
              lessons = this.processLessons(courseDetails.curriculum);
              console.log('✅ Lessons extracted from API course curriculum:', lessons.length);
            }
          } else {
            console.warn('⚠️ Course details API returned invalid response:', courseResponse);
          }
        } catch (detailError) {
          console.warn('⚠️ LessonPlayer: Failed to load course details from API:', detailError.message);
        }

        // Step 2: If no lessons from course details, try course content endpoint
        if (lessons.length === 0) {
          try {
            console.log('🔍 Step 2: Fetching course content from API...');
            const contentResponse = await getCourseContent(courseId);
            
            if (contentResponse && contentResponse.success && contentResponse.data) {
              lessons = this.processLessons(contentResponse.data);
              console.log('✅ Lessons loaded from API content endpoint:', lessons.length);
            } else {
              console.warn('⚠️ Course content API returned invalid response:', contentResponse);
            }
          } catch (contentError) {
            console.warn('⚠️ LessonPlayer: getCourseContent API failed:', contentError.message);
          }
        }

        // Step 3: If still no lessons, try from the original course prop
        if (lessons.length === 0 && this.course.curriculum) {
          console.log('🔍 Step 3: Using course prop curriculum (fallback)...');
          lessons = this.processLessons(this.course.curriculum);
          console.log('✅ Lessons extracted from course prop:', lessons.length);
        }

        // Step 4: Final fallback - create demo content ONLY if no real content available
        if (lessons.length === 0) {
          console.log('🔍 Step 4: No real content found, creating demo lessons...');
          lessons = this.createDemoLessons();
          this.error = 'Демонстрационное содержание - реальные материалы курса недоступны';
        }

        // Set course data and lessons
        this.courseData = courseDetails || this.course;
        this.lessons = lessons;

        console.log(`✅ LessonPlayer: Successfully loaded ${lessons.length} lessons for course: ${this.courseData?.title}`);
        
        if (lessons.length > 0 && !this.error) {
          this.error = null;
        }
        
      } catch (error) {
        console.error('❌ LessonPlayer: Critical error loading course content:', error);
        
        if (error.message && error.message.includes('Network Error')) {
          this.error = 'Ошибка сети - проверьте подключение к интернету';
        } else if (error.response?.status === 404) {
          this.error = 'Курс не найден на сервере';
        } else if (error.response?.status === 403) {
          this.error = 'Нет доступа к курсу';
        } else if (error.response?.status >= 500) {
          this.error = 'Ошибка сервера - попробуйте позже';
        } else {
          this.error = 'Не удалось загрузить содержание курса';
        }
        
        try {
          this.lessons = this.createDemoLessons();
          this.error += ' (показано демонстрационное содержание)';
        } catch (demoError) {
          console.error('❌ Even demo content failed:', demoError);
          this.error = 'Критическая ошибка загрузки содержания курса';
        }
      } finally {
        this.loading = false;
      }
    },

    // ✅ FIXED: Process lessons with better content extraction
    processLessons(lessonsArray) {
      if (!Array.isArray(lessonsArray)) {
        console.warn('⚠️ processLessons: Input is not an array:', typeof lessonsArray);
        return [];
      }

      const processedLessons = [];

      lessonsArray.forEach((lesson, index) => {
        try {
          if (!lesson || typeof lesson !== 'object') {
            console.warn(`⚠️ Invalid lesson at index ${index}:`, lesson);
            return;
          }

          const processedLesson = {
            ...lesson,
            id: lesson._id || lesson.id || `lesson_${index}`,
            _id: lesson._id || lesson.id || `lesson_${index}`,
            title: lesson.title || lesson.lessonName || lesson.name || `Урок ${index + 1}`,
            lessonName: lesson.title || lesson.lessonName || lesson.name || `Урок ${index + 1}`,
            description: lesson.description || lesson.desc || '',
            duration: lesson.duration || lesson.estimatedTime || '30 мин',
            order: lesson.order !== undefined ? lesson.order : index,
            steps: this.processSteps(lesson.steps || lesson.content || [])
          };

          processedLessons.push(processedLesson);
          console.log(`✅ Processed lesson ${index + 1}: "${processedLesson.title}" with ${processedLesson.steps.length} steps`);

        } catch (lessonError) {
          console.error(`❌ Error processing lesson ${index}:`, lessonError);
          
          processedLessons.push({
            id: `fallback_lesson_${index}`,
            _id: `fallback_lesson_${index}`,
            title: `Урок ${index + 1} (ошибка загрузки)`,
            lessonName: `Урок ${index + 1} (ошибка загрузки)`,
            description: 'Произошла ошибка при загрузке урока',
            steps: []
          });
        }
      });

      return processedLessons;
    },

    // ✅ COMPLETELY FIXED: Process steps with comprehensive content handling
    processSteps(steps) {
      if (!Array.isArray(steps)) {
        console.warn('⚠️ processSteps: Input is not an array:', typeof steps);
        return [];
      }

      const processedSteps = [];

      steps.forEach((step, index) => {
        try {
          if (!step || typeof step !== 'object') {
            console.warn(`⚠️ Invalid step at index ${index}:`, step);
            return;
          }

          // ✅ CRITICAL FIX: Better step type detection
          const stepType = this.detectStepType(step);
          
          const processedStep = {
            ...step,
            id: step.id || step._id || `step_${index}`,
            type: stepType,
            title: step.title || step.name || this.getStepTitle({ ...step, type: stepType }),
            description: step.description || step.desc || '',
            content: this.extractContent(step), // ✅ NEW: Extract content properly
            data: this.processStepData(step, stepType), // ✅ FIXED: Pass stepType
            order: step.order !== undefined ? step.order : index
          };

          processedSteps.push(processedStep);
          console.log(`✅ Processed step ${index + 1}: "${processedStep.title}" (${stepType}) - Content length: ${processedStep.content?.length || 0}`);
          
        } catch (stepError) {
          console.error(`❌ Error processing step ${index}:`, stepError);
          
          processedSteps.push({
            id: `fallback_step_${index}`,
            type: 'explanation',
            title: '❌ Ошибка загрузки',
            description: 'Произошла ошибка при загрузке шага',
            content: 'Содержание шага недоступно',
            data: { content: 'Содержание шага недоступно' }
          });
        }
      });

      return processedSteps;
    },

    // ✅ NEW: Detect step type more accurately
    detectStepType(step) {
      if (!step) return 'explanation';

      // Direct type property
      if (step.type) {
        return step.type.toLowerCase();
      }

      // Check for specific properties that indicate type
      if (step.question || step.quiz || step.quizzes || (step.data && Array.isArray(step.data))) {
        return 'quiz';
      }

      if (step.videoUrl || step.video || (step.data && step.data.url && step.data.url.includes('youtube'))) {
        return 'video';
      }

      if (step.pdfUrl || step.pdf || (step.data && step.data.url && step.data.url.includes('.pdf'))) {
        return 'pdf';
      }

      if (step.practice || step.practiceType || step.instructions || step.files) {
        return 'practice';
      }

      if (step.images && Array.isArray(step.images) && step.images.length > 0 && !step.content && !step.text) {
        return 'image';
      }

      // Check content for indicators
      const content = step.content || step.text || step.description || '';
      if (typeof content === 'string') {
        if (content.includes('example:') || content.includes('пример:')) {
          return 'example';
        }
        if (content.includes('read:') || content.includes('читать:')) {
          return 'reading';
        }
      }

      // Default to explanation
      return 'explanation';
    },

    // ✅ NEW: Extract content from various possible locations
    extractContent(step) {
      if (!step) return '';

      // Priority order for content extraction
      const contentSources = [
        step.content,
        step.text,
        step.description,
        step.body,
        step.html,
        step.markdown,
        step.data?.content,
        step.data?.text,
        step.data?.description,
        step.data?.body
      ];

      for (const source of contentSources) {
        if (source && typeof source === 'string' && source.trim().length > 0) {
          console.log('📝 Found content:', source.substring(0, 100) + '...');
          return source.trim();
        }
      }

      // If no text content found, create descriptive content based on type
      return this.generateFallbackContent(step);
    },

    // ✅ NEW: Generate fallback content when no text is found
    generateFallbackContent(step) {
      const stepType = this.detectStepType(step);
      
      switch (stepType) {
        case 'video':
          const videoUrl = step.videoUrl || step.video || step.data?.url || '';
          return videoUrl ? `Видеоматериал: ${videoUrl}` : 'Видеоматериал';
          
        case 'pdf':
          const pdfUrl = step.pdfUrl || step.pdf || step.data?.url || '';
          return pdfUrl ? `PDF документ: ${pdfUrl}` : 'PDF документ';
          
        case 'practice':
          const instructions = step.instructions || step.data?.instructions || '';
          return instructions || 'Практическое задание';
          
        case 'quiz':
          const question = step.question || step.data?.question || step.data?.[0]?.question || '';
          return question || 'Интерактивный тест';
          
        case 'image':
          const images = step.images || step.data?.images || [];
          return images.length > 0 ? `Изображения (${images.length})` : 'Изображение';
          
        default:
          return step.title || step.name || 'Содержание шага';
      }
    },

    // ✅ COMPLETELY FIXED: Process step data with proper type-specific handling
    processStepData(step, stepType) {
      if (!step || typeof step !== 'object') {
        return { content: '', error: 'Invalid step data' };
      }

      const baseData = step.data || {};
      const type = stepType || step.type || 'explanation';

      try {
        switch (type) {
          case 'explanation':
          case 'example':  
          case 'reading':
          case 'text':
            return {
              ...baseData,
              content: this.extractContent(step),
              images: this.processImages(baseData.images || step.images || [])
            };

          case 'image':
            return {
              ...baseData,
              images: this.processImages(baseData.images || step.images || []),
              description: baseData.description || step.description || this.extractContent(step),
              caption: baseData.caption || step.caption || ''
            };

          case 'video':
            return {
              ...baseData,
              url: baseData.url || step.videoUrl || step.video || step.url || '',
              description: baseData.description || step.description || this.extractContent(step),
              thumbnail: baseData.thumbnail || step.thumbnail
            };

          case 'pdf':
            return {
              ...baseData,
              url: baseData.url || step.pdfUrl || step.pdf || step.url || '',
              description: baseData.description || step.description || this.extractContent(step)
            };

          case 'practice':
            return {
              ...baseData,
              instructions: baseData.instructions || step.instructions || this.extractContent(step),
              type: baseData.type || step.practiceType || 'guided',
              files: baseData.files || step.files || [],
              images: this.processImages(baseData.images || step.images || [])
            };

          case 'quiz':
            return this.processQuizData(step, baseData);

          default:
            console.warn(`⚠️ Unknown step type: ${type}`);
            return {
              ...baseData,
              content: this.extractContent(step),
              images: this.processImages(baseData.images || step.images || [])
            };
        }
      } catch (dataError) {
        console.error(`❌ Error processing step data for type ${type}:`, dataError);
        return {
          content: this.extractContent(step) || 'Ошибка обработки данных шага',
          error: dataError.message
        };
      }
    },

    // ✅ NEW: Better quiz data processing
    processQuizData(step, baseData) {
      // Handle multiple quiz data formats
      if (Array.isArray(baseData) && baseData.length > 0) {
        return baseData.map(quiz => ({
          ...quiz,
          question: quiz.question || quiz.text || '',
          images: this.processImages(quiz.images || [])
        }));
      } 
      
      if (Array.isArray(baseData.questions)) {
        return baseData.questions.map(quiz => ({
          ...quiz,
          question: quiz.question || quiz.text || '',
          images: this.processImages(quiz.images || [])
        }));
      } 
      
      if (step.question || baseData.question) {
        return [{
          question: step.question || baseData.question || this.extractContent(step),
          type: step.quizType || baseData.type || 'multiple-choice',
          options: this.processQuizOptions(step.options || baseData.options || []),
          correctAnswer: parseInt(step.correctAnswer || baseData.correctAnswer) || 0,
          explanation: step.explanation || baseData.explanation || '',
          images: this.processImages(step.questionImages || step.images || [])
        }];
      } 
      
      if (step.quizzes && Array.isArray(step.quizzes)) {
        return step.quizzes.map(quiz => ({
          ...quiz,
          question: quiz.question || quiz.text || '',
          images: this.processImages(quiz.images || [])
        }));
      }
      
      if (Array.isArray(step.data)) {
        return step.data.map(quiz => ({
          ...quiz,
          question: quiz.question || quiz.text || '',
          images: this.processImages(quiz.images || [])
        }));
      }

      return [];
    },

    // ✅ NEW: Process quiz options properly
    processQuizOptions(options) {
      if (!Array.isArray(options)) return [];
      
      return options.map(opt => {
        if (typeof opt === 'string') {
          return { text: opt, correct: false };
        }
        if (typeof opt === 'object' && opt !== null) {
          return {
            text: opt.text || opt.label || opt.value || String(opt),
            correct: Boolean(opt.correct || opt.isCorrect)
          };
        }
        return { text: String(opt), correct: false };
      });
    },

    // ✅ ENHANCED: Process images with better URL handling
    processImages(images) {
      if (!Array.isArray(images)) return [];

      return images
        .filter(img => img && (img.url || img.base64 || img.src))
        .map((img, index) => {
          try {
            let imageUrl = img.url || img.src || img.base64;
            
            if (imageUrl) {
              // Handle base64 images
              if (imageUrl.startsWith('data:')) {
                // Base64 is ready to use
              } 
              // Handle relative URLs
              else if (imageUrl.startsWith('/uploads/')) {
                const baseUrl = process.env.NODE_ENV === 'production' 
                  ? 'https://api.aced.live'
                  : 'http://localhost:5000';
                imageUrl = `${baseUrl}${imageUrl}`;
              }
              // Handle other relative URLs
              else if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                const baseUrl = process.env.NODE_ENV === 'production' 
                  ? 'https://api.aced.live'
                  : 'http://localhost:5000';
                imageUrl = `${baseUrl}${imageUrl}`;
              }
              // Absolute URLs are used as-is
            }

            return {
              id: img.id || `img_${index}_${Date.now()}`,
              url: imageUrl,
              caption: img.caption || img.description || img.alt || '',
              alt: img.alt || img.caption || img.description || `Изображение ${index + 1}`,
              filename: img.filename || img.name || `image_${index}`,
              size: img.size || 0,
              order: img.order !== undefined ? img.order : index
            };
          } catch (imgError) {
            console.error(`❌ Error processing image ${index}:`, imgError);
            return null;
          }
        })
        .filter(img => img !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    },

    // ✅ ENHANCED: Create demo lessons with rich content
    createDemoLessons() {
      const courseTitle = this.courseData?.title || this.course?.title || 'Курс';
      
      return [
        {
          id: 'demo_lesson_1',
          _id: 'demo_lesson_1',
          title: 'Введение в курс',
          lessonName: 'Введение в курс',
          description: 'Демонстрационное содержание - реальные материалы недоступны',
          duration: '15 мин',
          steps: [
            {
              id: 'demo_step_1_1',
              type: 'explanation',
              title: '⚠️ Демонстрационное содержание',
              content: `Это демонстрационное содержание курса "${courseTitle}".
              
              Возможные причины недоступности материалов:
              • Материалы курса еще не загружены на сервер
              • Проблемы с сетевым подключением к API
              • Технические неполадки на сервере
              • Курс находится в процессе разработки
              
              Что можно сделать:
              • Обновить страницу и попробовать еще раз
              • Проверить подключение к интернету
              • Обратиться к администратору системы
              • Попробовать позже`,
              data: {
                content: `Это демонстрационное содержание курса "${courseTitle}".
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                  <strong>⚠️ Внимание:</strong> Реальные материалы курса временно недоступны.
                </div>
                
                <h3>Возможные причины:</h3>
                <ul>
                  <li>Материалы курса еще не загружены на сервер</li>
                  <li>Проблемы с сетевым подключением к API</li>
                  <li>Технические неполадки на сервере</li>
                  <li>Курс находится в процессе разработки</li>
                </ul>
                
                <h3>Что можно сделать:</h3>
                <ul>
                  <li>Обновить страницу и попробовать еще раз</li>
                  <li>Проверить подключение к интернету</li>
                  <li>Обратиться к администратору системы</li>
                  <li>Попробовать позже</li>
                </ul>`
              }
            },
            {
              id: 'demo_step_1_2',
              type: 'explanation',
              title: 'Как должен работать курс',
              content: `После загрузки реальных материалов курс будет содержать:
              
              • Структурированные уроки с теорией и практикой
              • Интерактивные упражнения и тесты  
              • Видеоматериалы и дополнительные ресурсы
              • Систему отслеживания прогресса
              • Практические задания с файлами
              • Итоговые проверочные работы`,
              data: {
                content: `<h3>После загрузки реальных материалов курс будет содержать:</h3>
                
                <ul>
                  <li><strong>Структурированные уроки</strong> с теорией и практикой</li>
                  <li><strong>Интерактивные упражнения</strong> и тесты</li>
                  <li><strong>Видеоматериалы</strong> и дополнительные ресурсы</li>
                  <li><strong>Систему отслеживания прогресса</strong></li>
                  <li><strong>Практические задания</strong> с файлами</li>
                  <li><strong>Итоговые проверочные работы</strong></li>
                </ul>
                
                <p>Все функции плеера уже готовы для отображения реального контента!</p>`
              }
            }
          ]
        },
        {
          id: 'demo_lesson_2',
          _id: 'demo_lesson_2',
          title: 'Тестирование функций плеера',
          lessonName: 'Тестирование функций плеера',
          description: 'Демонстрация всех возможностей системы',
          duration: '10 мин',
          steps: [
            {
              id: 'demo_step_2_1',
              type: 'explanation',
              title: 'Поддерживаемые типы контента',
              content: `Этот плеер поддерживает различные типы образовательного контента:
              
              • Текстовые объяснения и материалы (как этот)
              • Интерактивные тесты с множественным выбором
              • Видеоматериалы (YouTube, прямые ссылки)
              • PDF документы с возможностью полноэкранного просмотра
              • Практические задания с загружаемыми файлами
              • Изображения с подписями и описаниями
              
              Все типы контента поддерживают адаптивный дизайн и работают на мобильных устройствах.`,
              data: {
                content: `<h3>Этот плеер поддерживает различные типы образовательного контента:</h3>
                
                <ul>
                  <li>📝 <strong>Текстовые объяснения</strong> и материалы (как этот)</li>
                  <li>❓ <strong>Интерактивные тесты</strong> с множественным выбором</li>
                  <li>🎥 <strong>Видеоматериалы</strong> (YouTube, прямые ссылки)</li>
                  <li>📄 <strong>PDF документы</strong> с возможностью полноэкранного просмотра</li>
                  <li>🎯 <strong>Практические задания</strong> с загружаемыми файлами</li>
                  <li>🖼️ <strong>Изображения</strong> с подписями и описаниями</li>
                </ul>
                
                <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0277bd;">
                  <strong>💡 Важно:</strong> Все типы контента поддерживают адаптивный дизайн и работают на мобильных устройствах.
                </div>`
              }
            },
            {
              id: 'demo_step_2_2',
              type: 'quiz',
              title: 'Пример интерактивного теста',
              content: 'Демонстрация работы системы тестирования',
              data: [{
                question: 'Это демонстрационное содержание курса?',
                type: 'multiple-choice',
                options: [
                  { text: 'Да, это временная заглушка для демонстрации возможностей', correct: true },
                  { text: 'Нет, это реальный образовательный курс', correct: false },
                  { text: 'Не знаю, не могу определить', correct: false },
                  { text: 'Это зависит от настроек системы', correct: false }
                ],
                correctAnswer: 0,
                explanation: 'Верно! Это демонстрационное содержание, которое показывается когда реальные материалы курса недоступны. Оно помогает понять, как будет выглядеть и работать настоящий курс.'
              }]
            }
          ]
        }
      ];
    },
    
    // === Navigation Methods ===
    goToPreviousLesson() {
      if (!this.isFirstLesson) {
        this.currentLessonIndex--;
        console.log(`🔙 Previous lesson: ${this.currentLessonIndex + 1}`);
      }
    },

    goToNextLesson() {
      if (!this.isLastLesson) {
        this.currentLessonIndex++;
        console.log(`➡️ Next lesson: ${this.currentLessonIndex + 1}`);
      }
    },

    completeCourse() {
      console.log('🎉 Course completed!');
      if (confirm('Поздравляем с завершением курса! Вернуться к списку курсов?')) {
        this.$emit('back-to-courses');
      }
    },

    // === Event Handlers ===
    handleOverlayClick() {
      this.$emit('close');
    },

    handleQuizAnswer(stepIndex, answerIndex, isCorrect) {
      this.quizAnswers.set(stepIndex, {
        answerIndex,
        isCorrect,
        answered: true
      });
      console.log('📝 Quiz answer recorded:', { stepIndex, answerIndex, isCorrect });
    },

    openPdfFullscreen(pdfUrl) {
      this.fullscreenPdf = pdfUrl;
    },

    closePdfFullscreen() {
      this.fullscreenPdf = null;
    },

    // === Utility Methods ===
    getStepTitle(step) {
      if (step.title) return step.title;
      const titles = {
        explanation: '📝 Объяснение', 
        example: '💡 Пример', 
        text: '📝 Текст',
        reading: '📚 Чтение',
        video: '🎥 Видео',
        pdf: '📄 Материалы', 
        practice: '🎯 Практика', 
        quiz: '❓ Тест',
        image: '🖼️ Изображение'
      };
      return titles[step.type] || '📌 Шаг';
    },

    getStepComponent(type) {
      const components = {
        explanation: 'step-text', 
        example: 'step-text', 
        reading: 'step-text',
        text: 'step-text',
        video: 'step-video', 
        pdf: 'step-pdf', 
        practice: 'step-practice', 
        quiz: 'step-quiz',
        image: 'step-text'
      };
      return components[type] || 'step-text';
    }
  },

  // === Step Components ===
  components: {
    'step-text': {
      props: ['step'],
      template: `
        <div class="step-text">
          <div class="text-content" v-html="formattedContent"></div>
          <div v-if="hasImages" class="step-images">
            <div v-for="image in step.data.images || step.images || []" :key="image.id" class="step-image">
              <img :src="image.url" :alt="image.alt" :title="image.caption" />
              <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
            </div>
          </div>
        </div>
      `,
      computed: {
        formattedContent() {
          // ✅ FIXED: Better content extraction and formatting
          let content = '';
          
          // Try multiple sources for content
          if (this.step.data?.content) {
            content = this.step.data.content;
          } else if (this.step.content) {
            content = this.step.content;
          } else if (this.step.text) {
            content = this.step.text;
          } else if (this.step.description) {
            content = this.step.description;
          } else if (this.step.data?.text) {
            content = this.step.data.text;
          } else if (this.step.data?.description) {
            content = this.step.data.description;
          } else {
            content = 'Содержание не найдено';
          }
          
          // Convert string content to HTML
          if (typeof content === 'string') {
            // Handle different line break formats
            content = content
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>');
              
            // Wrap in paragraphs if not already HTML
            if (!content.includes('<p>') && !content.includes('<div>') && content.length > 0) {
              content = '<p>' + content + '</p>';
            }
          }
          
          console.log('📝 Formatted content length:', content.length);
          return content || '<p>Содержание не найдено</p>';
        },
        hasImages() {
          const images = this.step.data?.images || this.step.images || [];
          return Array.isArray(images) && images.length > 0;
        }
      }
    },

    'step-video': {
      props: ['step'],
      template: `
        <div class="step-video">
          <div class="video-wrapper">
            <div v-if="isYouTube" class="video-embed">
              <iframe 
                :src="embedUrl"
                frameborder="0"
                allowfullscreen
                class="video-iframe"
                title="Video content"
              ></iframe>
            </div>
            <video 
              v-else-if="isDirectVideo"
              controls
              class="video-element"
              :poster="step.data?.thumbnail"
            >
              <source :src="videoUrl" type="video/mp4">
              <source :src="videoUrl" type="video/webm">
              <p>Ваш браузер не поддерживает видео.</p>
            </video>
            <div v-else class="video-placeholder">
              <div class="placeholder-icon">🎥</div>
              <p>Видео недоступно</p>
              <small v-if="videoUrl">URL: {{ videoUrl }}</small>
            </div>
          </div>
          <div v-if="description" class="video-description">
            <div v-html="formattedDescription"></div>
          </div>
        </div>
      `,
      computed: {
        videoUrl() {
          return this.step.data?.url || this.step.videoUrl || this.step.video || this.step.url || '';
        },
        description() {
          return this.step.data?.description || this.step.description || this.step.content || '';
        },
        formattedDescription() {
          return this.description.replace(/\n/g, '<br>');
        },
        isYouTube() {
          return this.videoUrl.includes('youtube.com') || this.videoUrl.includes('youtu.be');
        },
        isDirectVideo() {
          return /\.(mp4|webm|ogg)$/i.test(this.videoUrl) || this.videoUrl.includes('blob:');
        },
        embedUrl() {
          if (this.videoUrl.includes('youtube.com/watch')) {
            const videoId = this.videoUrl.split('v=')[1]?.split('&')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
          }
          if (this.videoUrl.includes('youtu.be/')) {
            const videoId = this.videoUrl.split('youtu.be/')[1]?.split('?')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
          }
          return this.videoUrl;
        }
      }
    },

    'step-pdf': {
      props: ['step'],
      emits: ['pdf-fullscreen'],
      template: `
        <div class="step-pdf">
          <div class="pdf-header">
            <h3>📄 PDF Материал</h3>
            <div v-if="description" v-html="formattedDescription"></div>
          </div>
          
          <div class="pdf-viewer">
            <iframe 
              v-if="pdfUrl"
              :src="pdfUrl" 
              class="pdf-iframe"
              title="PDF Document"
            ></iframe>
            <div v-else class="pdf-placeholder">
              <div class="placeholder-icon">📄</div>
              <p>PDF файл недоступен</p>
            </div>
          </div>

          <div class="pdf-actions" v-if="pdfUrl">
            <a 
              :href="pdfUrl" 
              target="_blank"
              download
              class="action-btn action-btn--secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Скачать
            </a>
            <button 
              @click="$emit('pdf-fullscreen', pdfUrl)"
              class="action-btn action-btn--secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,3 21,3 21,9"></polyline>
                <polyline points="9,21 3,21 3,15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              Полный экран
            </button>
          </div>
        </div>
      `,
      computed: {
        pdfUrl() {
          return this.step.data?.url || this.step.pdfUrl || this.step.pdf || this.step.url;
        },
        description() {
          return this.step.data?.description || this.step.description || this.step.content;
        },
        formattedDescription() {
          return this.description ? this.description.replace(/\n/g, '<br>') : '';
        }
      }
    },

    'step-practice': {
      props: ['step'],
      template: `
        <div class="step-practice">
          <div class="practice-header">
            <h3>🎯 Практическое задание</h3>
            <div v-if="instructions" v-html="formattedInstructions"></div>
          </div>

          <div v-if="hasFiles" class="practice-files">
            <h4>Файлы для скачивания:</h4>
            <div class="file-grid">
              <a 
                v-for="(file, index) in files"
                :key="index"
                :href="file.url"
                class="file-card"
                target="_blank"
                download
              >
                <div class="file-icon">{{ getFileIcon(file.type) }}</div>
                <span class="file-name">{{ file.name }}</span>
                <div class="download-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
              </a>
            </div>
          </div>

          <div v-else class="no-files">
            <p>Выполните задание согласно инструкциям выше</p>
          </div>
        </div>
      `,
      computed: {
        instructions() {
          return this.step.data?.instructions || this.step.instructions || this.step.content || this.step.description;
        },
        formattedInstructions() {
          return this.instructions ? this.instructions.replace(/\n/g, '<br>') : '';
        },
        files() {
          return this.step.data?.files || this.step.files || [];
        },
        hasFiles() {
          return this.files.length > 0;
        }
      },
      methods: {
        getFileIcon(type) {
          const icons = {
            pdf: '📄', doc: '📝', docx: '📝', txt: '📝',
            zip: '📦', rar: '📦', '7z': '📦',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
            mp4: '🎥', mov: '🎥', avi: '🎥', wmv: '🎥',
            mp3: '🎵', wav: '🎵', flac: '🎵'
          };
          return icons[type?.toLowerCase()] || '📎';
        }
      }
    },

    'step-quiz': {
      props: ['step', 'stepIndex'],
      emits: ['quiz-answer'],
      data() {
        return {
          selectedQuestions: new Map()
        }
      },
      template: `
        <div class="step-quiz">
          <div v-if="quizData && quizData.length > 0">
            <div v-for="(quiz, quizIndex) in quizData" :key="quizIndex" class="quiz-item">
              <div class="quiz-header">
                <h3>❓ {{ quiz.question || 'Вопрос не указан' }}</h3>
              </div>
              
              <div v-if="quiz.options && quiz.options.length > 0" class="quiz-options">
                <button
                  v-for="(option, index) in quiz.options"
                  :key="index"
                  @click="selectAnswer(quizIndex, index, option)"
                  :disabled="isQuizAnswered(quizIndex)"
                  :class="getOptionClass(quizIndex, index, option)"
                  class="quiz-option"
                >
                  <span class="option-text">{{ getOptionText(option) }}</span>
                  <div v-if="isQuizAnswered(quizIndex)" class="option-indicator">
                    <svg v-if="isCorrectOption(option)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    <svg v-else-if="getSelectedAnswer(quizIndex) === index" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </button>
              </div>
              
              <div v-if="isQuizAnswered(quizIndex) && quiz.explanation" class="quiz-explanation">
                <div class="explanation-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9,9h6v6H9z"></path>
                  </svg>
                  Объяснение
                </div>
                <div v-html="formattedExplanation(quiz.explanation)"></div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-quiz">
            <div class="placeholder-icon">❓</div>
            <p>Тест недоступен</p>
            <small>Данные теста не загружены или повреждены</small>
          </div>
        </div>
      `,
      computed: {
        quizData() {
          const stepData = this.step.data;
          if (Array.isArray(stepData) && stepData.length > 0) {
            return stepData.filter(quiz => quiz && (quiz.question || quiz.text));
          }
          if (stepData && Array.isArray(stepData.questions)) {
            return stepData.questions.filter(quiz => quiz && (quiz.question || quiz.text));
          }
          if (stepData && (stepData.question || stepData.text)) {
            return [{
              question: stepData.question || stepData.text,
              options: stepData.options || [],
              explanation: stepData.explanation || '',
              correctAnswer: stepData.correctAnswer
            }];
          }
          if (Array.isArray(this.step.quizzes)) {
            return this.step.quizzes.filter(quiz => quiz && (quiz.question || quiz.text));
          }
          if (Array.isArray(this.step.data)) {
            return this.step.data.map(quiz => ({
              ...quiz,
              question: quiz.question || quiz.text || '',
              images: this.processImages(quiz.images || [])
            }));
          }
          return [];
        }
      },
      methods: {
        selectAnswer(quizIndex, optionIndex, option) {
          if (this.isQuizAnswered(quizIndex)) return;
          this.selectedQuestions.set(quizIndex, optionIndex);
          const isCorrect = this.isCorrectOption(option);
          this.$emit('quiz-answer', this.stepIndex, optionIndex, isCorrect);
          this.$forceUpdate();
        },
        getOptionText(option) {
          if (typeof option === 'string') return option;
          return option.text || option.label || option.value || 'Опция';
        },
        isCorrectOption(option) {
          if (typeof option === 'object') {
            return Boolean(option.correct || option.isCorrect);
          }
          return false;
        },
        isQuizAnswered(quizIndex) {
          return this.selectedQuestions.has(quizIndex);
        },
        getSelectedAnswer(quizIndex) {
          return this.selectedQuestions.get(quizIndex);
        },
        getOptionClass(quizIndex, optionIndex, option) {
          const selectedAnswer = this.getSelectedAnswer(quizIndex);
          const isAnswered = this.isQuizAnswered(quizIndex);
          if (!isAnswered) {
            return selectedAnswer === optionIndex ? 'selected' : '';
          }
          if (this.isCorrectOption(option)) {
            return 'correct';
          }
          if (selectedAnswer === optionIndex && !this.isCorrectOption(option)) {
            return 'incorrect';
          }
          return 'disabled';
        },
        formattedExplanation(explanation) {
          return explanation ? explanation.replace(/\n/g, '<br>') : '';
        }
      }
    }
  }
}
</script>
<style scoped>
/* ===== CLEAN MODERN VARIABLES ===== */
:root {
  --primary-blue: #4f46e5;
  --primary-blue-hover: #4338ca;
  --primary-blue-light: #eef2ff;
  
  --success-green: #10b981;
  --success-green-hover: #059669;
  --success-green-light: #ecfdf5;
  
  --danger-red: #ef4444;
  --warning-orange: #f59e0b;
  
  /* Clean grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  --white: #ffffff;
  --black: #000000;
  
  /* Consistent spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border radius */
  --radius-sm: 0.375rem;
  --radius: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Transitions */
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== MAIN OVERLAY - SOLID DARK BACKGROUND ===== */
.lesson-player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.95); /* Solid dark background */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

/* ===== MAIN PLAYER CONTAINER ===== */
.lesson-player {
  background: var(--white); /* Solid white background */
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* ===== HEADER SECTION ===== */
.player-header {
  background: var(--white); /* Solid white */
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-6) var(--space-8);
  display: flex;
  align-items: flex-start;
  gap: var(--space-6);
  position: relative;
  min-height: 120px;
}

.close-btn {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: var(--gray-100);
  border: none;
  border-radius: var(--radius-md);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-600);
  cursor: pointer;
  transition: var(--transition);
  z-index: 10;
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-900);
  transform: scale(1.05);
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  padding-right: var(--space-12);
  gap: var(--space-8);
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-name {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-2);
  opacity: 0.9;
}

.lesson-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--gray-900);
  margin: 0;
  line-height: 1.2;
  word-wrap: break-word;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-3);
  min-width: 200px;
  flex-shrink: 0;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-blue), var(--success-green));
  border-radius: var(--radius);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--gray-600);
  white-space: nowrap;
}

/* ===== MAIN CONTENT AREA ===== */
.player-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8);
  background: var(--gray-50); /* Light gray background for content area */
}

/* ===== LOADING & ERROR STATES ===== */
.loading-state, .error-state, .no-content, .empty-lesson {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 400px;
  padding: var(--space-12);
  background: var(--white);
  border-radius: var(--radius-lg);
  margin: var(--space-4) 0;
}

.loading-state h3, .error-state h3, .no-content h3, .empty-lesson h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 var(--space-3) 0;
  color: var(--gray-800);
}

.loading-state p, .error-state p, .no-content p, .empty-lesson p {
  margin: 0 0 var(--space-6) 0;
  font-size: var(--font-size-base);
  color: var(--gray-600);
  max-width: 400px;
  line-height: 1.6;
}

.error-icon, .empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-6);
  opacity: 0.7;
}

.retry-btn, .back-btn {
  padding: var(--space-3) var(--space-6);
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
}

.retry-btn:hover, .back-btn:hover {
  background: var(--primary-blue-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Spinner */
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--primary-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-6);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== LESSON CONTENT ===== */
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.step-container {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.step-container:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--gray-300);
}

.step-header {
  background: var(--gray-50);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.step-number {
  width: 32px;
  height: 32px;
  background: var(--primary-blue);
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.step-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin: 0;
  line-height: 1.3;
}

.step-body {
  padding: var(--space-8);
  background: var(--white);
}

/* ===== FOOTER NAVIGATION ===== */
.player-footer {
  background: var(--white);
  border-top: 1px solid var(--gray-200);
  padding: var(--space-6) var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  box-shadow: 0 -1px 3px 0 rgb(0 0 0 / 0.05);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition);
  min-width: 140px;
  justify-content: center;
  height: 44px;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.nav-btn--primary {
  background: var(--primary-blue);
  color: var(--white);
  box-shadow: var(--shadow-sm);
}

.nav-btn--primary:hover:not(:disabled) {
  background: var(--primary-blue-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.nav-btn--secondary {
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  box-shadow: var(--shadow-sm);
}

.nav-btn--secondary:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.nav-btn--success {
  background: var(--success-green);
  color: var(--white);
  box-shadow: var(--shadow-sm);
}

.nav-btn--success:hover:not(:disabled) {
  background: var(--success-green-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.lesson-counter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-700);
  font-size: var(--font-size-sm);
}

.current-lesson {
  color: var(--primary-blue);
  font-weight: var(--font-weight-bold);
}

.divider {
  color: var(--gray-400);
  margin: 0 var(--space-1);
}

/* ===== STEP COMPONENT STYLES ===== */

/* Text Step */
.step-text {
  line-height: 1.7;
}

.text-content {
  font-size: var(--font-size-base);
  color: var(--gray-700);
  line-height: 1.7;
}

.text-content p {
  margin: 0 0 var(--space-4) 0;
}

.text-content p:last-child {
  margin-bottom: 0;
}

.text-content ul, .text-content ol {
  margin: var(--space-4) 0;
  padding-left: var(--space-6);
}

.text-content li {
  margin-bottom: var(--space-2);
  line-height: 1.6;
}

.step-images {
  margin-top: var(--space-6);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}

.step-image {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.step-image img {
  width: 100%;
  height: auto;
  display: block;
}

.image-caption {
  padding: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  font-style: italic;
  margin: 0;
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
}

/* Video Step */
.step-video {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.video-embed {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 */
  background: var(--gray-900);
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-element {
  width: 100%;
  height: auto;
  max-height: 500px;
  display: block;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: var(--gray-100);
  color: var(--gray-500);
  border-radius: var(--radius-md);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  opacity: 0.6;
}

.video-description {
  text-align: center;
  font-style: italic;
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  margin: 0;
  padding: 0 var(--space-4);
}

/* PDF Step */
.step-pdf {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.pdf-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin: 0 0 var(--space-2) 0;
}

.pdf-header p {
  color: var(--gray-600);
  margin: 0;
  line-height: 1.6;
}

.pdf-viewer {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: var(--white);
  border: 1px solid var(--gray-200);
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--gray-500);
  background: var(--gray-50);
}

.pdf-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
  justify-content: center;
  height: 40px;
}

.action-btn--secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.action-btn--secondary:hover {
  background: var(--gray-200);
  border-color: var(--gray-400);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Practice Step */
.step-practice {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.practice-header {
  padding: var(--space-6);
  background: var(--primary-blue-light);
  border-radius: var(--radius-md);
  border: 1px solid rgba(79, 70, 229, 0.2);
}

.practice-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin: 0 0 var(--space-3) 0;
}

.practice-header p {
  color: var(--gray-700);
  margin: 0;
  line-height: 1.6;
}

.practice-files h4 {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin: 0 0 var(--space-4) 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.file-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--gray-700);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.file-card:hover {
  background: var(--gray-50);
  border-color: var(--primary-blue);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.file-icon {
  font-size: var(--font-size-2xl);
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.download-icon {
  color: var(--gray-400);
  flex-shrink: 0;
  transition: var(--transition);
}

.file-card:hover .download-icon {
  color: var(--primary-blue);
  transform: translateY(-1px);
}

.no-files {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: var(--space-8);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px dashed var(--gray-300);
}

.no-files p {
  margin: 0;
  font-size: var(--font-size-base);
}

/* Quiz Step */
.step-quiz {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.quiz-item {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.quiz-item + .quiz-item {
  margin-top: var(--space-6);
}

.quiz-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin: 0 0 var(--space-5) 0;
  line-height: 1.4;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quiz-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--white);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--gray-700);
  width: 100%;
  box-shadow: var(--shadow-sm);
}

.quiz-option:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--primary-blue);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.quiz-option:disabled {
  cursor: not-allowed;
}

.quiz-option.selected {
  border-color: var(--primary-blue);
  background: var(--primary-blue-light);
  box-shadow: var(--shadow-md);
}

.quiz-option.correct {
  border-color: var(--success-green);
  background: var(--success-green-light);
  color: var(--success-green-hover);
  box-shadow: var(--shadow-md);
}

.quiz-option.incorrect {
  border-color: var(--danger-red);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-red);
  box-shadow: var(--shadow-md);
}

.quiz-option.disabled {
  opacity: 0.7;
}

.option-text {
  flex: 1;
  line-height: 1.5;
}

.option-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  margin-left: var(--space-3);
}

.quiz-option.correct .option-indicator {
  background: var(--success-green);
  color: var(--white);
}

.quiz-option.incorrect .option-indicator {
  background: var(--danger-red);
  color: var(--white);
}

.quiz-explanation {
  padding: var(--space-5);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--primary-blue);
  margin-top: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-sm);
}

.quiz-explanation p {
  margin: 0;
  color: var(--gray-700);
  line-height: 1.6;
  font-size: var(--font-size-base);
}

.no-quiz {
  text-align: center;
  color: var(--gray-500);
  padding: var(--space-8);
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px dashed var(--gray-300);
}

.no-quiz .placeholder-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
  opacity: 0.6;
}

.no-quiz p {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.no-quiz small {
  font-size: var(--font-size-sm);
  color: var(--gray-400);
}

/* PDF Fullscreen Modal */
.pdf-modal {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-4);
}

.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 95vh;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.pdf-close-btn {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 10;
  background: var(--white);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-600);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
}

.pdf-close-btn:hover {
  background: var(--gray-100);
  color: var(--gray-900);
  transform: scale(1.05);
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1200px) {
  .lesson-player {
    max-width: 95vw;
  }
  
  .header-content {
    gap: var(--space-6);
  }
  
  .progress-section {
    min-width: 180px;
  }
  
  .progress-bar {
    width: 180px;
  }
}

@media (max-width: 768px) {
  .lesson-player-overlay {
    padding: 0;
  }
  
  .lesson-player {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .player-header {
    padding: var(--space-4);
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
    min-height: auto;
  }
  
  .close-btn {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    width: 36px;
    height: 36px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-4);
    padding-right: 0;
    padding-top: var(--space-4);
  }
  
  .course-info {
    text-align: center;
  }
  
  .lesson-title {
    font-size: var(--font-size-xl);
  }
  
  .progress-section {
    align-items: stretch;
    min-width: auto;
  }
  
  .progress-bar {
    width: 100%;
  }
  
  .progress-text {
    text-align: center;
  }
  
  .player-content {
    padding: var(--space-4);
  }
  
  .step-body {
    padding: var(--space-4);
  }
  
  .step-header {
    padding: var(--space-4);
  }
  
  .player-footer {
    padding: var(--space-4);
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .nav-btn {
    width: 100%;
    min-width: auto;
  }
  
  .lesson-counter {
    order: -1;
    justify-content: center;
  }
  
  .pdf-viewer {
    height: 400px;
  }
  
  .video-embed {
    padding-bottom: 75%; /* 4:3 on mobile */
  }
  
  .file-grid {
    grid-template-columns: 1fr;
  }
  
  .step-images {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .player-header {
    padding: var(--space-3);
  }
  
  .step-header {
    padding: var(--space-3);
    gap: var(--space-3);
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: var(--font-size-xs);
  }
  
  .step-title {
    font-size: var(--font-size-base);
  }
  
  .step-body {
    padding: var(--space-3);
  }
  
  .pdf-viewer {
    height: 300px;
  }
  
  .quiz-option {
    padding: var(--space-3);
    font-size: var(--font-size-sm);
  }
  
  .file-card {
    padding: var(--space-3);
    gap: var(--space-3);
  }
  
  .practice-header {
    padding: var(--space-4);
  }
  
  .quiz-item {
    padding: var(--space-4);
  }
  
  .loading-state, .error-state, .no-content, .empty-lesson {
    padding: var(--space-6);
    min-height: 300px;
  }
  
  .lesson-title {
    font-size: var(--font-size-lg);
  }
  
  .course-name {
    font-size: var(--font-size-xs);
  }
  
  .pdf-modal {
    padding: var(--space-2);
  }
  
  .pdf-close-btn {
    width: 40px;
    height: 40px;
    top: var(--space-2);
    right: var(--space-2);
  }
}

/* ===== ACCESSIBILITY & FOCUS STYLES ===== */
.close-btn:focus-visible,
.nav-btn:focus-visible,
.quiz-option:focus-visible,
.file-card:focus-visible,
.action-btn:focus-visible,
.retry-btn:focus-visible,
.back-btn:focus-visible,
.pdf-close-btn:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.step-container {
  animation: fadeIn 0.3s ease-out;
}

.lesson-content .step-container:nth-child(1) { animation-delay: 0.1s; }
.lesson-content .step-container:nth-child(2) { animation-delay: 0.2s; }
.lesson-content .step-container:nth-child(3) { animation-delay: 0.3s; }
.lesson-content .step-container:nth-child(4) { animation-delay: 0.4s; }
.lesson-content .step-container:nth-child(5) { animation-delay: 0.5s; }

.quiz-option {
  animation: slideIn 0.2s ease-out;
}

.quiz-options .quiz-option:nth-child(1) { animation-delay: 0.1s; }
.quiz-options .quiz-option:nth-child(2) { animation-delay: 0.2s; }
.quiz-options .quiz-option:nth-child(3) { animation-delay: 0.3s; }
.quiz-options .quiz-option:nth-child(4) { animation-delay: 0.4s; }

/* ===== HIGH CONTRAST MODE SUPPORT ===== */
@media (prefers-contrast: high) {
  :root {
    --gray-200: #d1d5db;
    --gray-300: #9ca3af;
    --gray-400: #6b7280;
  }
  
  .step-container,
  .quiz-item,
  .file-card,
  .practice-header {
    border-width: 2px;
  }
}

/* ===== REDUCED MOTION SUPPORT ===== */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .step-container,
  .quiz-option {
    animation: none;
  }
}

/* ===== PRINT STYLES ===== */
@media print {
  .lesson-player-overlay {
    position: static;
    background: none;
    padding: 0;
  }
  
  .lesson-player {
    box-shadow: none;
    border: 1px solid var(--gray-300);
    max-height: none;
  }
  
  .close-btn,
  .player-footer {
    display: none;
  }
  
  .player-content {
    overflow: visible;
  }
  
  .step-container {
    break-inside: avoid;
    margin-bottom: var(--space-6);
  }
  
  .video-wrapper,
  .pdf-viewer {
    display: none;
  }
  
  .video-description {
    display: block;
    text-align: left;
    font-style: normal;
    padding: var(--space-4);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius);
    background: var(--gray-50);
  }
  
  .video-description::before {
    content: "Видео: ";
    font-weight: bold;
  }
}
</style>