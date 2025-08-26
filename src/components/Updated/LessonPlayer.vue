<template>
  <div class="lesson-player-overlay" @click="handleOverlayClick">
    <div class="lesson-player" @click.stop>
      <!-- Header with progress bar -->
      <header class="player-header">
        <button 
          class="close-btn" 
          @click="$emit('close')" 
          aria-label="Закрыть урок"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="header-content">
          <div class="course-info">
            <div class="course-badge">{{ courseTitle }}</div>
            <h1 class="lesson-title">{{ currentLessonTitle }}</h1>
          </div>

          <div class="progress-section">
            <div class="progress-info">
              <span class="lesson-counter">Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
              <span class="progress-text">{{ Math.round(progressPercentage) }}% завершено</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </header>

      <!-- Learning Objectives Card -->
      <div class="objectives-container" v-if="learningObjectives.length > 0">
        <div class="objectives-card">
          <div class="objectives-header">
            <div class="objectives-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="16,12 12,8 8,12"></polyline>
              </svg>
            </div>
            <h2>Цели обучения</h2>
          </div>
          <ul class="objectives-list">
            <li v-for="(objective, index) in learningObjectives" :key="index">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              {{ objective }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Main content area -->
      <main class="player-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <h3>Загрузка курса...</h3>
          <p>Подготовка учебных материалов</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Не удалось загрузить курс</h3>
          <p>{{ error }}</p>
          <button @click="loadCourseContent" class="retry-btn">
            Попробовать снова
          </button>
        </div>

        <!-- Lesson Content -->
        <div v-else-if="currentLesson && hasSteps" class="lesson-content">
          <div 
            v-for="(step, index) in currentLesson.steps" 
            :key="`step-${index}`"
            class="step-container"
          >
            <div class="step-header">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-info">
                <h3 class="step-title">{{ getStepTitle(step) }}</h3>
                <span class="step-type">{{ getStepTypeLabel(step.type) }}</span>
              </div>
            </div>

            <div class="step-content">
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

        <!-- Empty States -->
        <div v-else class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>Контент недоступен</h3>
          <p>Содержание этого урока пока недоступно.</p>
        </div>
      </main>

      <!-- Navigation Footer -->
      <footer class="player-footer" v-if="!loading && !error && lessons.length > 0">
        <button 
          class="nav-btn nav-btn--secondary"
          :disabled="isFirstLesson"
          @click="goToPreviousLesson"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
          Назад
        </button>

        <div class="lesson-nav-info">
          <span>{{ currentLessonIndex + 1 }} / {{ totalLessons }}</span>
        </div>

        <button 
          v-if="!isLastLesson"
          class="nav-btn nav-btn--primary"
          @click="goToNextLesson"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>

        <button 
          v-else
          class="nav-btn nav-btn--success"
          @click="completeCourse"
        >
          Завершить курс
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
      </footer>
    </div>

    <!-- PDF Fullscreen Modal -->
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
          title="PDF Просмотрщик"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script>
// ✅ FIXED: Proper API imports for Updated Courses
import { getCourseById, getCourseContent, getUpdatedCourses } from '@/api.js';

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
      if (this.totalLessons === 0) return 0;
      return ((this.currentLessonIndex + 1) / this.totalLessons) * 100;
    },

    isFirstLesson() {
      return this.currentLessonIndex === 0;
    },

    isLastLesson() {
      return this.currentLessonIndex === this.totalLessons - 1;
    },

    learningObjectives() {
      // Get objectives from course data
      if (this.courseData?.learningOutcomes && Array.isArray(this.courseData.learningOutcomes)) {
        return this.courseData.learningOutcomes;
      }
      return [
        'Понимание основных концепций, рассматриваемых в этом уроке',
        'Применение практических навыков через практические упражнения',
        'Выполнение оценочных заданий для проверки знаний'
      ];
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
    // ✅ COMPLETELY FIXED: Load Updated Courses content properly
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
        console.log('📚 LessonPlayer: Loading Updated Course content for ID:', courseId);

        let courseDetails = null;
        let lessons = [];

        // ✅ STRATEGY 1: Get specific Updated Course by ID (main method)
        try {
          console.log('🔍 Fetching specific Updated Course by ID...');
          const response = await fetch(`/api/updated-courses/${courseId}`);
          const result = await response.json();
          
          if (result.success && result.course) {
            courseDetails = result.course;
            console.log('✅ Updated Course details loaded:', courseDetails.title);
            
            // Extract lessons from curriculum
            if (courseDetails.curriculum && Array.isArray(courseDetails.curriculum)) {
              lessons = this.processCurriculum(courseDetails.curriculum);
              console.log('✅ Lessons extracted from curriculum:', lessons.length);
            }
          }
        } catch (fetchError) {
          console.warn('⚠️ Direct Updated Course fetch failed:', fetchError.message);
        }

        // ✅ STRATEGY 2: Fallback to general Updated Courses API
        if (!courseDetails && lessons.length === 0) {
          try {
            console.log('🔍 Fallback: Searching in all Updated Courses...');
            const coursesResponse = await getUpdatedCourses();
            
            if (coursesResponse && coursesResponse.success && coursesResponse.courses) {
              const foundCourse = coursesResponse.courses.find(c => 
                (c._id || c.id) === courseId || c.title === this.course.title
              );
              
              if (foundCourse) {
                courseDetails = foundCourse;
                console.log('✅ Found course in Updated Courses list');
                
                if (foundCourse.curriculum && Array.isArray(foundCourse.curriculum)) {
                  lessons = this.processCurriculum(foundCourse.curriculum);
                  console.log('✅ Lessons from Updated Courses curriculum:', lessons.length);
                }
              }
            }
          } catch (coursesError) {
            console.warn('⚠️ Updated Courses fallback failed:', coursesError.message);
          }
        }

        // ✅ STRATEGY 3: Try legacy course endpoints as final fallback
        if (lessons.length === 0) {
          try {
            console.log('🔍 Final fallback: Trying legacy course endpoints...');
            const courseResponse = await getCourseById(courseId);
            
            if (courseResponse && courseResponse.success && courseResponse.data) {
              courseDetails = courseResponse.data;
              
              if (courseResponse.data.curriculum) {
                lessons = this.processCurriculum(courseResponse.data.curriculum);
              }
            }
          } catch (legacyError) {
            console.warn('⚠️ Legacy course endpoints failed:', legacyError.message);
          }
        }

        // ✅ Set final data
        this.courseData = courseDetails || this.course;
        this.lessons = lessons;

        if (lessons.length === 0) {
          this.error = 'Содержание уроков для этого курса не найдено';
          console.warn('⚠️ No lessons found for course:', courseId);
        } else {
          console.log(`✅ Successfully loaded ${lessons.length} lessons`);
        }
        
      } catch (error) {
        console.error('❌ Critical error loading Updated Course:', error);
        this.error = 'Не удалось загрузить содержание курса. Пожалуйста, попробуйте еще раз.';
      } finally {
        this.loading = false;
      }
    },

    // ✅ FIXED: Process curriculum from Updated Courses
    processCurriculum(curriculum) {
      if (!Array.isArray(curriculum)) {
        console.warn('⚠️ Curriculum is not an array:', typeof curriculum);
        return [];
      }

      return curriculum.map((lesson, index) => {
        try {
          const processedLesson = {
            id: lesson._id || lesson.id || `lesson_${index}`,
            _id: lesson._id || lesson.id || `lesson_${index}`,
            title: lesson.title || `Урок ${index + 1}`,
            lessonName: lesson.title || `Урок ${index + 1}`,
            description: lesson.description || '',
            duration: lesson.duration || '30 мин',
            order: lesson.order !== undefined ? lesson.order : index,
            steps: this.processSteps(lesson.steps || [])
          };

          console.log(`✅ Processed lesson ${index + 1}: "${processedLesson.title}" with ${processedLesson.steps.length} steps`);
          return processedLesson;

        } catch (lessonError) {
          console.error(`❌ Error processing lesson ${index}:`, lessonError);
          return {
            id: `error_lesson_${index}`,
            title: `Урок ${index + 1} (Ошибка)`,
            lessonName: `Урок ${index + 1} (Ошибка)`,
            description: 'Ошибка загрузки содержания урока',
            steps: []
          };
        }
      });
    },

    // ✅ FIXED: Process steps from Updated Course curriculum
    processSteps(steps) {
      if (!Array.isArray(steps)) {
        console.warn('⚠️ Steps is not an array:', typeof steps);
        return [];
      }

      return steps.map((step, index) => {
        try {
          const processedStep = {
            id: step.id || `step_${index}`,
            type: step.type || 'explanation',
            title: step.title || '',
            description: step.description || '',
            content: step.content || '',
            data: step.data || {},
            order: step.order !== undefined ? step.order : index,
            images: step.images || []
          };

          // Ensure data has content
          if (!processedStep.data.content && processedStep.content) {
            processedStep.data.content = processedStep.content;
          }

          console.log(`✅ Processed step ${index + 1}: "${processedStep.title}" (${processedStep.type})`);
          return processedStep;
          
        } catch (stepError) {
          console.error(`❌ Error processing step ${index}:`, stepError);
          return {
            id: `error_step_${index}`,
            type: 'explanation',
            title: 'Ошибка загрузки шага',
            content: 'Этот шаг не может быть загружен',
            data: { content: 'Ошибка загрузки содержания шага' }
          };
        }
      });
    },

    // Navigation methods
    goToPreviousLesson() {
      if (!this.isFirstLesson) {
        this.currentLessonIndex--;
      }
    },

    goToNextLesson() {
      if (!this.isLastLesson) {
        this.currentLessonIndex++;
      }
    },

    completeCourse() {
      if (confirm('Поздравляем! Вы завершили курс. Вернуться к курсам?')) {
        this.$emit('back-to-courses');
      }
    },

    // Event handlers
    handleOverlayClick() {
      this.$emit('close');
    },

    handleQuizAnswer(stepIndex, answerIndex, isCorrect) {
      this.quizAnswers.set(stepIndex, {
        answerIndex,
        isCorrect,
        answered: true
      });
    },

    openPdfFullscreen(pdfUrl) {
      this.fullscreenPdf = pdfUrl;
    },

    closePdfFullscreen() {
      this.fullscreenPdf = null;
    },

    // Utility methods
    getStepTitle(step) {
      if (step.title) return step.title;
      
      const titles = {
        explanation: 'Объяснение',
        example: 'Пример',
        practice: 'Практика',
        quiz: 'Тест',
        video: 'Видео',
        pdf: 'Чтение',
        image: 'Изображения'
      };
      
      return titles[step.type] || 'Содержание';
    },

    getStepTypeLabel(type) {
      const labels = {
        explanation: 'Изучение',
        example: 'Пример',
        practice: 'Практика',
        quiz: 'Тест',
        video: 'Просмотр',
        pdf: 'Чтение',
        image: 'Просмотр'
      };
      return labels[type] || 'Шаг';
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

  // Step components
  components: {
    'step-text': {
      props: ['step'],
      template: `
        <div class="step-text">
          <div class="text-content" v-html="formattedContent"></div>
          <div v-if="hasImages" class="step-images">
            <div v-for="image in step.images || []" :key="image.id || image.url" class="step-image">
              <img :src="image.url" :alt="image.alt || 'Изображение урока'" />
              <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
            </div>
          </div>
        </div>
      `,
      computed: {
        formattedContent() {
          let content = this.step.data?.content || this.step.content || '';
          
          if (!content) {
            content = '<p>Содержание недоступно для этого шага.</p>';
          }
          
          if (typeof content === 'string') {
            content = content
              .replace(/\n\n/g, '</p><p>')
              .replace(/\n/g, '<br>');
            
            if (!content.includes('<p>') && !content.includes('<div>')) {
              content = '<p>' + content + '</p>';
            }
          }
          
          return content;
        },
        hasImages() {
          return this.step.images && Array.isArray(this.step.images) && this.step.images.length > 0;
        }
      }
    },

    'step-video': {
      props: ['step'],
      template: `
        <div class="step-video">
          <div class="video-wrapper">
            <div v-if="videoUrl" class="video-container">
              <iframe v-if="isYouTube" :src="embedUrl" frameborder="0" allowfullscreen></iframe>
              <video v-else controls>
                <source :src="videoUrl" type="video/mp4">
                Ваш браузер не поддерживает воспроизведение видео.
              </video>
            </div>
            <div v-else class="video-placeholder">
              <p>Видео-контент недоступен</p>
            </div>
          </div>
        </div>
      `,
      computed: {
        videoUrl() {
          return this.step.data?.url || this.step.videoUrl || '';
        },
        isYouTube() {
          return this.videoUrl.includes('youtube.com') || this.videoUrl.includes('youtu.be');
        },
        embedUrl() {
          if (this.videoUrl.includes('youtube.com/watch')) {
            const videoId = this.videoUrl.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
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
          <div v-if="pdfUrl" class="pdf-container">
            <iframe :src="pdfUrl" class="pdf-iframe"></iframe>
            <div class="pdf-actions">
              <button @click="$emit('pdf-fullscreen', pdfUrl)" class="pdf-fullscreen-btn">
                Открыть в полноэкранном режиме
              </button>
            </div>
          </div>
          <div v-else class="pdf-placeholder">
            <p>PDF-контент недоступен</p>
          </div>
        </div>
      `,
      computed: {
        pdfUrl() {
          return this.step.data?.url || this.step.pdfUrl || '';
        }
      }
    },

    'step-practice': {
      props: ['step'],
      template: `
        <div class="step-practice">
          <div class="practice-content">
            <div v-if="instructions" v-html="formattedInstructions"></div>
            <div v-else>
              <p>Инструкции к практическому упражнению недоступны.</p>
            </div>
          </div>
        </div>
      `,
      computed: {
        instructions() {
          return this.step.data?.instructions || this.step.instructions || this.step.content || '';
        },
        formattedInstructions() {
          return this.instructions.replace(/\n/g, '<br>');
        }
      }
    },

    'step-quiz': {
      props: ['step', 'stepIndex'],
      emits: ['quiz-answer'],
      data() {
        return {
          selectedAnswers: new Map()
        }
      },
      template: `
        <div class="step-quiz">
          <div v-if="quizData && quizData.length > 0">
            <div v-for="(quiz, quizIndex) in quizData" :key="quizIndex" class="quiz-item">
              <h3 class="quiz-question">{{ quiz.question }}</h3>
              
              <div v-if="quiz.options && quiz.options.length > 0" class="quiz-options">
                <button
                  v-for="(option, index) in quiz.options"
                  :key="index"
                  @click="selectAnswer(quizIndex, index)"
                  :class="getOptionClass(quizIndex, index)"
                  class="quiz-option"
                >
                  {{ getOptionText(option) }}
                </button>
              </div>
              
              <div v-if="isAnswered(quizIndex) && quiz.explanation" class="quiz-explanation">
                <strong>Объяснение:</strong> {{ quiz.explanation }}
              </div>
            </div>
          </div>
          
          <div v-else class="no-quiz">
            <p>Тест недоступен</p>
          </div>
        </div>
      `,
      computed: {
        quizData() {
          if (Array.isArray(this.step.data)) {
            return this.step.data;
          }
          if (this.step.data && this.step.data.question) {
            return [this.step.data];
          }
          return [];
        }
      },
      methods: {
        selectAnswer(quizIndex, optionIndex) {
          this.selectedAnswers.set(quizIndex, optionIndex);
          const quiz = this.quizData[quizIndex];
          const isCorrect = quiz.correctAnswer === optionIndex;
          this.$emit('quiz-answer', this.stepIndex, optionIndex, isCorrect);
        },
        getOptionText(option) {
          return typeof option === 'string' ? option : option.text || '';
        },
        isAnswered(quizIndex) {
          return this.selectedAnswers.has(quizIndex);
        },
        getOptionClass(quizIndex, optionIndex) {
          if (!this.isAnswered(quizIndex)) return '';
          
          const quiz = this.quizData[quizIndex];
          const selected = this.selectedAnswers.get(quizIndex);
          
          if (optionIndex === quiz.correctAnswer) return 'correct';
          if (optionIndex === selected && optionIndex !== quiz.correctAnswer) return 'incorrect';
          return 'disabled';
        }
      }
    }
  }
}
</script>

<style scoped>
/* === RESPONSIVE DESIGN === */

/* Large Tablets */
@media (max-width: 1024px) {
  .lesson-player {
    max-width: 95vw;
    margin: 0 auto;
  }
  
  .lesson-title {
    font-size: 1.625rem;
  }
  
  .step-images {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}

/* Tablets */
@media (max-width: 768px) {
  .lesson-player-overlay {
    padding: 0;
    align-items: stretch;
  }
  
  .lesson-player {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    max-width: none;
  }
  
  .player-header {
    padding: 1.25rem 1.5rem;
  }
  
  .header-content {
    padding-right: 3.5rem;
  }
  
  .lesson-title {
    font-size: 1.5rem;
    line-height: 1.3;
  }
  
  .course-badge {
    font-size: 0.75rem;
    padding: 0.375rem 0.875rem;
  }
  
  .player-content {
    padding: 1.5rem;
  }
  
  .lesson-content {
    gap: 1.5rem;
  }
  
  .step-header {
    padding: 1.5rem;
    gap: 1rem;
  }
  
  .step-number {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .step-title {
    font-size: 1.125rem;
  }
  
  .step-content {
    padding: 1.5rem;
  }
  
  .text-content {
    font-size: 1rem;
  }
  
  .player-footer {
    padding: 1.25rem 1.5rem;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .nav-btn {
    min-width: 90px;
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }
  
  .objectives-container {
    padding: 0 1.5rem 1.25rem 1.5rem;
  }
  
  .objectives-card {
    padding: 1.25rem;
  }
  
  .step-images {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .step-image img {
    height: 180px;
  }
  
  .close-btn {
    top: 1rem;
    right: 1rem;
    width: 28px;
    height: 28px;
  }
  
  .pdf-modal {
    padding: 1rem;
  }
  
  .pdf-close-btn {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }
}

/* Mobile Phones */
@media (max-width: 480px) {
  .player-header {
    padding: 1rem 1.25rem;
  }
  
  .header-content {
    padding-right: 2.5rem;
    gap: 1rem;
  }
  
  .lesson-title {
    font-size: 1.25rem;
    line-height: 1.4;
  }
  
  .course-badge {
    font-size: 0.6875rem;
    padding: 0.25rem 0.75rem;
  }
  
  .progress-info {
    font-size: 0.75rem;
  }
  
  .progress-bar {
    height: 6px;
  }
  
  .player-content {
    padding: 1rem 1.25rem 1.5rem 1.25rem;
  }
  
  .objectives-container {
    padding: 0 1.25rem 1rem 1.25rem;
  }
  
  .objectives-card {
    padding: 1rem;
  }
  
  .objectives-header h2 {
    font-size: 0.9375rem;
  }
  
  .objectives-list li {
    font-size: 0.75rem;
  }
  
  .lesson-content {
    gap: 1.25rem;
  }
  
  .step-container {
    border-radius: 12px;
  }
  
  .step-header {
    padding: 1.25rem;
    gap: 0.875rem;
  }
  
  .step-number {
    width: 36px;
    height: 36px;
    font-size: 0.9375rem;
    border-radius: 10px;
  }
  
  .step-title {
    font-size: 1rem;
  }
  
  .step-type {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.625rem;
  }
  
  .step-content {
    padding: 1.25rem;
  }
  
  .text-content {
    font-size: 0.9375rem;
    line-height: 1.7;
  }
  
  .text-content h1 { font-size: 1.5rem; }
  .text-content h2 { font-size: 1.25rem; }
  .text-content h3 { font-size: 1.125rem; }
  
  .step-images {
    gap: 0.875rem;
  }
  
  .step-image img {
    height: 160px;
  }
  
  .image-caption {
    padding: 0.875rem;
    font-size: 0.8125rem;
  }
  
  .video-placeholder, .pdf-placeholder {
    height: 240px;
    font-size: 1rem;
  }
  
  .video-placeholder::before, .pdf-placeholder::before {
    font-size: 2.5rem;
  }
  
  .pdf-iframe {
    height: 400px;
  }
  
  .quiz-question {
    font-size: 1.125rem;
  }
  
  .quiz-option {
    padding: 0.875rem 1.25rem;
    font-size: 0.9375rem;
  }
  
  .player-footer {
    padding: 1rem 1.25rem;
    gap: 0.75rem;
  }
  
  .nav-btn {
    min-width: 80px;
    padding: 0.625rem 0.875rem;
    font-size: 0.75rem;
  }
  
  .lesson-nav-info {
    font-size: 0.75rem;
  }
  
  .close-btn {
    top: 0.75rem;
    right: 0.875rem;
    width: 24px;
    height: 24px;
  }
  
  .close-btn svg {
    width: 16px;
    height: 16px;
  }
  
  .loading-state, .error-state, .empty-state {
    min-height: 300px;
    padding: 2rem 1.5rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
  }
  
  .error-icon, .empty-icon {
    font-size: 3rem;
  }
  
  .loading-state h3, .error-state h3, .empty-state h3 {
    font-size: 1.25rem;
  }
  
  .loading-state p, .error-state p, .empty-state p {
    font-size: 0.9375rem;
  }
  
  .retry-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
  
  .pdf-modal {
    padding: 0.5rem;
  }
  
  .pdf-close-btn {
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
  }
}

/* Extra Small Phones */
@media (max-width: 360px) {
  .lesson-title {
    font-size: 1.125rem;
  }
  
  .step-title {
    font-size: 0.9375rem;
  }
  
  .text-content {
    font-size: 0.875rem;
  }
  
  .step-number {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
  
  .nav-btn {
    min-width: 70px;
    padding: 0.5rem 0.75rem;
    font-size: 0.6875rem;
  }
  
  .quiz-option {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

 
  .lesson-player-overlay {
    background: rgba(0, 0, 0, 0.7);
  }
  
  .lesson-player {
    background: #1e293b;
    border-color: #334155;
  }
  
  .player-header {
    background: #1e293b;
    border-bottom-color: #334155;
  }
  
  .close-btn {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }
  
  .close-btn:hover {
    background: #475569;
    border-color: #64748b;
    color: #f1f5f9;
  }
  
  .lesson-title {
    color: #f1f5f9;
  }
  
  .lesson-counter {
    color: #94a3b8;
  }
  
  .progress-bar {
    background: #334155;
  }
  
  .objectives-card {
    background: #334155;
    border-color: #475569;
  }
  
  .objectives-header h2 {
    color: #f1f5f9;
  }
  
  .objectives-list li {
    color: #cbd5e1;
  }
  
  .player-content {
    background: #0f172a;
  }
  
  .step-container {
    background: #1e293b;
    border-color: #334155;
  }
  
  .step-header {
    background: #334155;
  }
  
  .step-title {
    color: #f1f5f9;
  }
  
  .text-content {
    color: #cbd5e1;
  }
  
  .text-content h1, .text-content h2, .text-content h3 {
    color: #f1f5f9;
  }
  
  .text-content code {
    background: #475569;
    color: #a5b4fc;
  }
  
  .text-content blockquote {
    background: #334155;
    border-left-color: #6366f1;
    color: #cbd5e1;
  }
  
  .step-image {
    border-color: #475569;
  }
  
  .image-caption {
    background: #334155;
    border-top-color: #475569;
    color: #94a3b8;
  }
  
  .video-placeholder, .pdf-placeholder {
    background: #334155;
    border-color: #475569;
    color: #94a3b8;
  }
  
  .step-practice {
    background: #134e4a;
    border-color: #10b981;
  }
  
  .practice-content {
    color: #6ee7b7;
  }
  
  .quiz-item {
    background: #1e293b;
    border-color: #334155;
  }
  
  .quiz-question {
    color: #f1f5f9;
  }
  
  .quiz-option {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }
  
  .quiz-option:hover {
    background: #475569;
    border-color: #6366f1;
  }
  
  .quiz-option.correct {
    background: #134e4a;
    border-color: #10b981;
    color: #6ee7b7;
  }
  
  .quiz-option.incorrect {
    background: #7f1d1d;
    border-color: #ef4444;
    color: #fca5a5;
  }
  
  .quiz-explanation {
    background: #1e3a8a;
    border-color: #3b82f6;
    color: #93c5fd;
  }
  
  .no-quiz {
    background: #334155;
    border-color: #475569;
    color: #94a3b8;
  }
  
  .player-footer {
    background: #1e293b;
    border-top-color: #334155;
  }
  
  .nav-btn--secondary {
    background: #334155;
    color: #cbd5e1;
    border-color: #475569;
  }
  
  .nav-btn--secondary:hover:not(:disabled) {
    background: #475569;
    border-color: #64748b;
  }
  
  .lesson-nav-info {
    color: #94a3b8;
  }
  
  .loading-state, .error-state, .empty-state {
    color: #94a3b8;
  }
  
  .loading-state h3, .error-state h3, .empty-state h3 {
    color: #f1f5f9;
  }
  
  .spinner {
    border-color: #334155;
    border-top-color: #6366f1;
  }
  
  .pdf-modal .pdf-container {
    background: #1e293b;
  }


/* High Contrast Mode */
@media (prefers-contrast: high) {
  .lesson-player {
    border: 2px solid #000000;
  }
  
  .close-btn {
    border: 2px solid #000000;
  }
  
  .course-badge {
    border: 1px solid #000000;
  }
  
  .progress-bar {
    border: 1px solid #000000;
  }
  
  .step-container {
    border: 2px solid #000000;
  }
  
  .step-number {
    border: 2px solid #ffffff;
  }
  
  .nav-btn {
    border: 2px solid #000000;
  }
  
  .quiz-option {
    border: 2px solid #000000;
  }
  
  .quiz-option:hover {
    border: 2px solid #6366f1;
  }
}

/* Reduce Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .progress-fill::after {
    display: none;
  }
  
  .step-number::before {
    display: none;
  }
  
  .quiz-option::before {
    display: none;
  }
  
  .step-container:hover,
  .step-image:hover,
  .nav-btn:hover,
  .quiz-option:hover {
    transform: none;
  }
}

/* Print Styles */
@media print {
  .lesson-player-overlay {
    position: static;
    background: transparent;
    backdrop-filter: none;
  }
  
  .lesson-player {
    box-shadow: none;
    border: 1px solid #000000;
    max-height: none;
    height: auto;
  }
  
  .close-btn {
    display: none;
  }
  
  .player-footer {
    display: none;
  }
  
  .pdf-fullscreen-btn {
    display: none;
  }
  
  .step-container {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .step-header {
    break-after: avoid;
    page-break-after: avoid;
  }
  
  .quiz-option {
    border: 1px solid #000000;
  }
  
  .text-content {
    color: #000000;
  }
  
  .step-title {
    color: #000000;
  }
}

/* Focus Management */
.lesson-player *:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.lesson-player *:focus:not(:focus-visible) {
  outline: none;
}

/* Scrollbar Styling */
.player-content::-webkit-scrollbar {
  width: 8px;
}

.player-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.player-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 4px;
}

.player-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #5855eb 0%, #7c3aed 100%);
}

/* Selection Styling */
.lesson-player ::selection {
  background: rgba(99, 102, 241, 0.2);
  color: inherit;
}

.lesson-player ::-moz-selection {
  background: rgba(99, 102, 241, 0.2);
  color: inherit;
}

/* Animation Keyframes */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInFromRight {
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1); 
    opacity: 1; 
  }
  50% { 
    transform: scale(1.05); 
    opacity: 0.8; 
  }
}

/* Component Entry Animations */
.step-container {
  animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn {
  animation: slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.objectives-card {
  animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both;
}

/* Loading Animation Enhancement */
.loading-spinner {
  animation: pulse 2s ease-in-out infinite;
}

/* Performance Optimizations */
.step-container,
.step-image,
.quiz-option,
.nav-btn {
  will-change: transform;
}

.progress-fill {
  will-change: width;
}

.spinner {
  will-change: transform;
}

/* GPU Acceleration for Smooth Animations */
.step-container:hover,
.step-image:hover,
.nav-btn:hover,
.quiz-option:hover {
  transform: translateZ(0);
}
</style>