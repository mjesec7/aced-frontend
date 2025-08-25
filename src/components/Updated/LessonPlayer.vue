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
    // Watch course prop changes to reload content
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
          
          // Log the full error for debugging
          if (detailError.response) {
            console.warn('   API Response Status:', detailError.response.status);
            console.warn('   API Response Data:', detailError.response.data);
          }
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
            
            // Log the full error for debugging
            if (contentError.response) {
              console.warn('   Content API Response Status:', contentError.response.status);
              console.warn('   Content API Response Data:', contentError.response.data);
            }
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
          console.log('🔍 Step 4: No real content found, creating demo lessons as last resort...');
          console.warn('⚠️ This indicates a problem with the API or course data structure');
          lessons = this.createDemoLessons();
          console.log('✅ Demo lessons created as fallback:', lessons.length);
          
          // Set error message to inform user this is demo content
          this.error = 'Демонстрационное содержание - реальные материалы курса недоступны';
        }

        // Set course data and lessons
        this.courseData = courseDetails || this.course;
        this.lessons = lessons;

        console.log(`✅ LessonPlayer: Successfully loaded ${lessons.length} lessons for course: ${this.courseData?.title}`);
        
        // Clear error if we successfully loaded content
        if (lessons.length > 0 && !this.error) {
          this.error = null;
        }
        
      } catch (error) {
        console.error('❌ LessonPlayer: Critical error loading course content:', error);
        
        // Provide specific error messages based on error type
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
        
        // Emergency fallback with error message
        try {
          this.lessons = this.createDemoLessons();
          this.error += ' (показано демонстрационное содержание)';
          console.log('🆘 Emergency demo content loaded with error message');
        } catch (demoError) {
          console.error('❌ Even demo content failed:', demoError);
          this.error = 'Критическая ошибка загрузки содержания курса';
        }
      } finally {
        this.loading = false;
      }
    },

    // ✅ COMPLETELY FIXED: Process lessons with proper validation and error handling
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
            title: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
            lessonName: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
            description: lesson.description || '',
            duration: lesson.duration || '30 мин',
            order: lesson.order !== undefined ? lesson.order : index,
            // ✅ KEY FIX: Process steps properly
            steps: this.processSteps(lesson.steps || [])
          };

          processedLessons.push(processedLesson);
          console.log(`✅ Processed lesson ${index + 1}: "${processedLesson.title}" with ${processedLesson.steps.length} steps`);

        } catch (lessonError) {
          console.error(`❌ Error processing lesson ${index}:`, lessonError);
          
          // Add a fallback lesson even if processing failed
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

    // ✅ COMPLETELY FIXED: Process steps with comprehensive type handling
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

          const processedStep = {
            ...step,
            id: step.id || `step_${index}`,
            type: step.type || 'explanation',
            title: step.title || this.getStepTitle(step),
            description: step.description || '',
            content: step.content || '',
            // ✅ CRITICAL FIX: Process step data based on type
            data: this.processStepData(step),
            order: step.order !== undefined ? step.order : index
          };

          processedSteps.push(processedStep);
          
        } catch (stepError) {
          console.error(`❌ Error processing step ${index}:`, stepError);
          
          // Add fallback step
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

    // ✅ COMPLETELY FIXED: Process step data with proper type-specific handling
    processStepData(step) {
      if (!step || typeof step !== 'object') {
        return { content: '', error: 'Invalid step data' };
      }

      const baseData = step.data || {};
      const stepType = step.type || 'explanation';

      try {
        switch (stepType) {
          case 'explanation':
          case 'example':  
          case 'reading':
            const content = baseData.content || step.content || '';
            return {
              ...baseData,
              content: content,
              images: this.processImages(baseData.images || step.images || [])
            };

          case 'image':
            return {
              ...baseData,
              images: this.processImages(baseData.images || step.images || []),
              description: baseData.description || step.description || step.content || '',
              caption: baseData.caption || step.caption || ''
            };

          case 'video':
            return {
              ...baseData,
              url: baseData.url || step.videoUrl || step.url || '',
              description: baseData.description || step.description || '',
              thumbnail: baseData.thumbnail || step.thumbnail
            };

          case 'pdf':
            return {
              ...baseData,
              url: baseData.url || step.pdfUrl || step.url || '',
              description: baseData.description || step.description || ''
            };

          case 'practice':
            return {
              ...baseData,
              instructions: baseData.instructions || step.instructions || step.content || '',
              type: baseData.type || step.practiceType || 'guided',
              files: baseData.files || step.files || [],
              images: this.processImages(baseData.images || step.images || [])
            };

          case 'quiz':
            // Handle multiple quiz data formats
            if (Array.isArray(baseData)) {
              return baseData.map(quiz => ({
                ...quiz,
                images: this.processImages(quiz.images || [])
              }));
            } else if (Array.isArray(baseData.questions)) {
              return baseData.questions.map(quiz => ({
                ...quiz,
                images: this.processImages(quiz.images || [])
              }));
            } else if (step.question || step.content) {
              return [{
                question: step.question || step.content || '',
                type: step.quizType || 'multiple-choice',
                options: (step.options || []).map(opt => 
                  typeof opt === 'string' ? { text: opt, correct: false } : opt
                ),
                correctAnswer: parseInt(step.correctAnswer) || 0,
                explanation: step.explanation || '',
                images: this.processImages(step.questionImages || [])
              }];
            } else if (step.quizzes && Array.isArray(step.quizzes)) {
              return step.quizzes.map(quiz => ({
                ...quiz,
                images: this.processImages(quiz.images || [])
              }));
            } else {
              return [];
            }

          default:
            console.warn(`⚠️ Unknown step type: ${stepType}`);
            return {
              ...baseData,
              content: baseData.content || step.content || '',
              images: this.processImages(baseData.images || step.images || [])
            };
        }
      } catch (dataError) {
        console.error(`❌ Error processing step data for type ${stepType}:`, dataError);
        return {
          content: step.content || 'Ошибка обработки данных шага',
          error: dataError.message
        };
      }
    },

    // ✅ FIXED: Process images with better URL handling
    processImages(images) {
      if (!Array.isArray(images)) return [];

      return images
        .filter(img => img && (img.url || img.base64 || img.src))
        .map((img, index) => {
          try {
            let imageUrl = img.url || img.src || img.base64;
            
            // Process different URL types
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
              caption: img.caption || img.description || '',
              alt: img.alt || img.caption || img.description || `Изображение ${index + 1}`,
              filename: img.filename || `image_${index}`,
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

    // ✅ IMPROVED: Create demo lessons with clear indication they are fallback content
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
              data: {
                content: `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                  <strong>⚠️ Внимание:</strong> Это демонстрационное содержание.<br>
                  Реальные материалы курса "${courseTitle}" временно недоступны.
                </div>
                
                <p>Возможные причины:</p>
                <ul>
                  <li>Материалы курса еще не загружены</li>
                  <li>Проблемы с сетевым подключением</li>
                  <li>Технические неполадки на сервере</li>
                </ul>
                
                <p>Попробуйте:</p>
                <ul>
                  <li>Обновить страницу</li>
                  <li>Проверить подключение к интернету</li>
                  <li>Обратиться к администратору</li>
                </ul>`
              }
            },
            {
              id: 'demo_step_1_2',
              type: 'explanation',
              title: 'Как должен работать курс',
              data: {
                content: `После загрузки реальных материалов курс будет содержать:<br><br>
                • Структурированные уроки с теорией и практикой<br>
                • Интерактивные упражнения и тесты<br>
                • Видеоматериалы и дополнительные ресурсы<br>
                • Систему отслеживания прогресса`
              }
            }
          ]
        },
        {
          id: 'demo_lesson_2',
          _id: 'demo_lesson_2',
          title: 'Тестирование интерфейса',
          lessonName: 'Тестирование интерфейса',
          description: 'Демонстрация функций плеера',
          duration: '10 мин',
          steps: [
            {
              id: 'demo_step_2_1',
              type: 'explanation',
              title: 'Функции плеера',
              data: {
                content: `Этот плеер поддерживает различные типы контента:<br><br>
                • Текстовые объяснения (как этот)<br>
                • Интерактивные тесты<br>
                • Видеоматериалы<br>
                • PDF документы<br>
                • Практические задания`
              }
            },
            {
              id: 'demo_step_2_2',
              type: 'quiz',
              title: 'Пример теста',
              data: [{
                question: 'Это демонстрационное содержание?',
                type: 'multiple-choice',
                options: [
                  { text: 'Да, это временная заглушка', correct: true },
                  { text: 'Нет, это реальный курс', correct: false },
                  { text: 'Не знаю', correct: false }
                ],
                correctAnswer: 0,
                explanation: 'Верно! Это демонстрационное содержание, которое показывается когда реальные материалы курса недоступны.'
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
        explanation: '📝 Объяснение', example: '💡 Пример', video: '🎥 Видео',
        pdf: '📄 Материалы', practice: '🎯 Практика', quiz: '❓ Тест', reading: '📚 Чтение',
        image: '🖼️ Изображение'
      };
      return titles[step.type] || '📌 Шаг';
    },

    getStepComponent(type) {
      const components = {
        explanation: 'step-text', example: 'step-text', reading: 'step-text',
        video: 'step-video', pdf: 'step-pdf', practice: 'step-practice', quiz: 'step-quiz',
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
          const content = this.step.data?.content || this.step.content || 'Содержание не найдено';
          return content.replace(/\n/g, '<br>');
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
          <p v-if="description" class="video-description">{{ description }}</p>
        </div>
      `,
      computed: {
        videoUrl() {
          return this.step.data?.url || this.step.videoUrl || '';
        },
        description() {
          return this.step.data?.description || this.step.description;
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
            <p v-if="description">{{ description }}</p>
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
          return this.step.data?.url || this.step.pdfUrl;
        },
        description() {
          return this.step.data?.description || this.step.description;
        }
      }
    },

    'step-practice': {
      props: ['step'],
      template: `
        <div class="step-practice">
          <div class="practice-header">
            <h3>🎯 Практическое задание</h3>
            <p v-if="instructions">{{ instructions }}</p>
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
          return this.step.data?.instructions || this.step.instructions;
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
          selectedAnswer: null,
          showResult: false,
          selectedQuestions: new Map() // For multiple questions
        }
      },
      template: `
        <div class="step-quiz">
          <div v-if="quizData && quizData.length > 0">
            <div v-for="(quiz, quizIndex) in quizData" :key="quizIndex" class="quiz-item">
              <div class="quiz-header">
                <h3>❓ {{ quiz.question }}</h3>
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
                <p>{{ quiz.explanation }}</p>
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
          // Handle different quiz data formats more robustly
          const stepData = this.step.data;
          
          if (Array.isArray(stepData) && stepData.length > 0) {
            return stepData.filter(quiz => quiz && quiz.question);
          }
          
          if (stepData && Array.isArray(stepData.questions)) {
            return stepData.questions.filter(quiz => quiz && quiz.question);
          }
          
          if (stepData && stepData.question) {
            return [stepData];
          }
          
          if (this.step.question) {
            return [{
              question: this.step.question,
              options: this.step.options || [],
              explanation: this.step.explanation || '',
              correctAnswer: this.step.correctAnswer
            }];
          }
          
          if (Array.isArray(this.step.quizzes)) {
            return this.step.quizzes.filter(quiz => quiz && quiz.question);
          }
          
          return [];
        }
      },
      methods: {
        selectAnswer(quizIndex, optionIndex, option) {
          if (this.isQuizAnswered(quizIndex)) return;
          
          const answerId = `${quizIndex}-${optionIndex}`;
          this.selectedQuestions.set(quizIndex, optionIndex);
          
          const isCorrect = this.isCorrectOption(option);
          this.$emit('quiz-answer', this.stepIndex, optionIndex, isCorrect);
          
          // Force reactivity update
          this.$forceUpdate();
        },
        
        getOptionText(option) {
          if (typeof option === 'string') return option;
          return option.text || option.label || 'Опция';
        },
        
        isCorrectOption(option) {
          if (typeof option === 'object') {
            return Boolean(option.correct);
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
        }
      }
    }
  }
}
</script>
<style scoped>
/* ===== DESIGN SYSTEM VARIABLES (FROM IMAGE ANALYSIS) ===== */
:root {
  --color-sidebar-bg: #FFFFFF;
  --color-main-bg: #F8F8F8;
  --color-border: #E5E7EB;
  --color-text-dark: #1F2937;
  --color-text-medium: #6B7280;
  --color-text-light: #9CA3AF;
  --color-brand-primary: #8B5CF6;
  --color-brand-light: #C4B5FD;
  --color-accent-green: #10B981;
  --color-white: #FFFFFF;
  --color-black: #000000;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* ===== MAIN LAYOUT ===== */
.lesson-player-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif;
  background-color: var(--color-main-bg);
  color: var(--color-text-dark);
  position: fixed;
  top: 0;
  left: 0;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 320px;
  background-color: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-header {
  padding: 1.5rem 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
}

.back-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-medium);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.course-info {
  margin-top: 1rem;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-dark);
}

.course-completed {
  font-size: 0.875rem;
  color: var(--color-text-medium);
  margin: 0;
}

.sidebar-progress {
  padding: 0.5rem 1.5rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-medium);
  margin-bottom: 0.5rem;
}

.progress-bar-wrapper {
  background-color: var(--color-brand-light);
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  background-color: var(--color-brand-primary);
  height: 100%;
  transition: width 0.3s ease-in-out;
  border-radius: inherit;
}

.progress-completion {
  font-size: 0.875rem;
  color: var(--color-text-dark);
  margin-top: 0.5rem;
  text-align: right;
  font-weight: 500;
}

.sidebar-nav {
  flex-grow: 1;
  padding: 0.5rem;
}

.lesson-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  margin-bottom: 0.25rem;
}

.lesson-item:hover {
  background-color: var(--color-main-bg);
}

.lesson-item.is-current {
  background-color: var(--color-brand-light);
  color: var(--color-text-dark);
  font-weight: 600;
}

.lesson-item.is-current .lesson-duration {
  color: var(--color-text-medium);
}

.lesson-status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-main-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-medium);
  flex-shrink: 0;
}

.lesson-item.is-current .lesson-status-icon {
  background-color: var(--color-brand-primary);
  color: var(--color-white);
}

.lesson-item.is-completed .lesson-status-icon {
  background-color: var(--color-brand-primary);
  color: var(--color-white);
}

.lesson-status-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.lesson-details {
  flex-grow: 1;
}

.lesson-name {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.2;
}

.lesson-duration {
  font-size: 0.75rem;
  color: var(--color-text-light);
  margin: 0.25rem 0 0;
}

.lesson-nav-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-light);
  flex-shrink: 0;
}

.lesson-item.is-current .lesson-nav-icon {
  color: var(--color-text-dark);
}

/* ===== MAIN CONTENT AREA ===== */
.main-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 2.5rem;
}

.content-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-brand-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.state-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.state-description {
  font-size: 1rem;
  color: var(--color-text-medium);
  margin: 0 0 1.5rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-brand-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
}

/* ===== LESSON VIEW ===== */
.lesson-view {
  max-width: 900px;
  margin: 0 auto;
}

.lesson-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.lesson-meta-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-brand-light);
  border-radius: var(--border-radius-md);
}

.header-icon {
  stroke: var(--color-brand-primary);
}

.lesson-meta-text {
  flex-grow: 1;
}

.current-lesson-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.lesson-read-time {
  font-size: 0.875rem;
  color: var(--color-text-medium);
}

.lesson-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step-container {
  padding: 1.5rem;
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.lesson-navigation {
  margin-top: 3rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.nav-btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.nav-btn-prev {
  background-color: var(--color-white);
  color: var(--color-text-dark);
  border: 1px solid var(--color-border);
}

.nav-btn-prev:hover:not(:disabled) {
  background-color: var(--color-main-bg);
}

.nav-btn-next {
  background-color: var(--color-brand-primary);
  color: var(--color-white);
}

.nav-btn-next:hover:not(:disabled) {
  background-color: var(--color-brand-dark);
}

.nav-btn-complete {
  background-color: var(--color-accent-green);
  color: var(--color-white);
}

.nav-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== STEP COMPONENT STYLES ===== */

.step-text h1, .step-text h2, .step-text h3, .step-text h4 {
  font-weight: 600;
  margin: 1.5rem 0 1rem;
  color: var(--color-text-dark);
}

.step-text h1 { font-size: 2.25rem; }
.step-text h2 { font-size: 1.75rem; }
.step-text h3 { font-size: 1.5rem; }
.step-text h4 { font-size: 1.25rem; }

.step-text p {
  line-height: 1.6;
  color: var(--color-text-medium);
  margin: 1rem 0;
}

.step-text strong {
  color: var(--color-text-dark);
  font-weight: 600;
}

.step-text ul, .step-text ol {
  padding-left: 1.5rem;
  margin: 1rem 0;
  color: var(--color-text-medium);
}

.step-text li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.step-text pre {
  background-color: var(--color-background-medium);
  color: var(--color-text-dark);
  padding: 1rem;
  border-radius: var(--border-radius-sm);
  overflow-x: auto;
  font-family: monospace;
}

/* Additional styling for images within text content */
.step-images {
  margin-top: 1.5rem;
}

.step-images img {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius-md);
  margin-bottom: 0.5rem;
}

.image-caption {
  font-size: 0.8rem;
  color: var(--color-text-light);
  text-align: center;
}

/* ===== QUIZ COMPONENT STYLES ===== */
.step-quiz {
  margin-top: 2rem;
}

.quiz-item {
  margin-bottom: 2rem;
}

.quiz-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin: 0 0 1rem;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-option {
  width: 100%;
  padding: 1rem;
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quiz-option:hover:not(:disabled) {
  background-color: var(--color-main-bg);
  border-color: var(--color-brand-primary);
}

.quiz-option:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.quiz-option.correct {
  background-color: var(--color-accent-green);
  color: var(--color-white);
  border-color: var(--color-accent-green);
}

.quiz-option.incorrect {
  background-color: #FEE2E2;
  border-color: #F87171;
  color: var(--color-black);
}

.quiz-option.incorrect .option-indicator {
  background-color: #EF4444;
  color: var(--color-white);
}

.option-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quiz-option.correct .option-indicator {
  background-color: var(--color-white);
  color: var(--color-accent-green);
}

.quiz-option.incorrect .option-indicator svg {
  color: var(--color-white);
}

.quiz-explanation {
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--color-brand-light);
  border-radius: var(--border-radius-sm);
}

/* ===== RESPONSIVE DESIGN FOR DIFFERENT DEVICES ===== */
@media (max-width: 768px) {
  .lesson-player-container {
    flex-direction: column;
    position: static;
    height: auto;
    min-height: 100vh;
  }

  .sidebar {
    width: 100%;
    max-height: 100vh;
    overflow-y: hidden;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .main-content {
    padding: 1rem;
    overflow-y: auto;
  }

  .lesson-view {
    padding: 1rem;
  }

  .lesson-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .lesson-meta-info {
    width: 100%;
  }

  .current-lesson-title {
    font-size: 1.125rem;
  }
  
  .lesson-read-time {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
  }

  .lesson-navigation {
    flex-direction: column;
    gap: 0.75rem;
  }

  .nav-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .sidebar-header {
    padding: 1rem;
  }

  .sidebar-progress {
    padding: 0.5rem 1rem 1rem;
  }

  .sidebar-nav {
    padding: 0.5rem;
  }
  
  .lesson-item {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .lesson-name {
    font-size: 0.9rem;
  }
  
  .main-content {
    padding: 0.5rem;
  }

  .lesson-view {
    padding: 0.5rem;
  }
  
  .step-container {
    padding: 1rem;
  }
}
</style>