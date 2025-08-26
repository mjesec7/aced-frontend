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
/* GENERAL LAYOUT & THEME */
.lesson-player-overlay {
  position: fixed;
  inset: 0;
  /* IMPROVED: Slightly darker overlay for better focus on the player */
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.lesson-player {
  background: white;
  border-radius: 16px;
  /* IMPROVED: Enhanced shadow for better depth */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 1200px;
  height: 90vh; /* FIXED: Use height instead of max-height for a consistent size */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

/* HEADER & PROGRESS BAR */
/* FIXED: Header is more compact to give more space to the content */
.player-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
  position: relative;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px; /* Slightly larger for easier clicking */
  height: 36px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.header-content {
  /* FIXED: Use Flexbox to align title and progress side-by-side */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  max-width: calc(100% - 50px);
}

.course-info {
  flex: 1; /* Allow course info to take available space */
  min-width: 0; /* Prevent text overflow issues */
}

.course-badge {
  display: inline-block;
  background: #6366f1;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.lesson-title {
  /* FIXED: Reduced font size and removed margin to compact the header */
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* FIXED: Progress section now has a defined width and better layout */
.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 250px; /* Give the section a fixed width */
  flex-shrink: 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.lesson-counter {
  font-weight: 500;
  color: #475569;
}

.progress-text {
  color: #6366f1;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* CENTRAL CONTENT AREA */
/* FIXED: This new wrapper combines objectives and content into a single scrollable pane */
.central-area {
  flex: 1;
  overflow-y: auto;
  background: #f8fafc; /* Unified background */
  padding: 1.5rem 2rem;
}

/* IMPROVED: Custom scrollbar for better aesthetics */
.central-area::-webkit-scrollbar {
  width: 8px;
}
.central-area::-webkit-scrollbar-track {
  background: #f8fafc;
}
.central-area::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.central-area::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
}

/* LEARNING OBJECTIVES */
/* FIXED: Removed container to be part of the new .central-area */
.objectives-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem; /* Space between objectives and first step */
}

.objectives-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.objectives-icon {
  width: 32px;
  height: 32px;
  background: #6366f1;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.objectives-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.objectives-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #4b5563;
  font-size: 0.9rem;
}

.objectives-list li svg {
  color: #10b981;
  flex-shrink: 0;
}

/* MAIN CONTENT (Now inside .central-area) */
/* REMOVED: .player-content class is no longer needed for layout */

/* Loading/Error States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  min-height: 300px;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

p {
  color: #475569;
  margin: 0 0 1.5rem 0;
}

.retry-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #4f46e5;
}

/* Lesson Content & Steps */
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.step-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}

.step-header {
  background: #f8fafc;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.step-type {
  font-size: 0.75rem;
  color: #6366f1;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.step-content {
  padding: 1.5rem;
}

/* Step Component: Text & Images */
.text-content {
  color: #374151;
  font-size: 1rem;
  line-height: 1.7;
}
.text-content > *:last-child {
  margin-bottom: 0;
}

.step-images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}

.step-image {
  flex: 1 1 250px; /* Allow wrapping */
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.step-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.image-caption {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #475569;
  background: #f8fafc;
  margin: 0;
  border-top: 1px solid #e2e8f0;
}

/* Other Step Components (Video, PDF, etc.) */
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
  border-radius: 8px;
  overflow: hidden;
  background: #1e293b;
}

.video-container iframe, .video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.pdf-iframe {
  width: 100%;
  height: 500px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.pdf-actions {
  padding-top: 1rem;
  text-align: center;
}

/* Quiz Component */
.step-quiz {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz-question {
  margin-bottom: 1.5rem;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-option {
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9375rem;
}
.quiz-option:hover {
  border-color: #6366f1;
  background: #f1f5f9;
}
.quiz-option.correct {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
  font-weight: 500;
}
.quiz-option.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
  font-weight: 500;
}
.quiz-option.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.quiz-explanation {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid #38bdf8;
  font-size: 0.875rem;
  color: #0c4a6e;
}

/* FOOTER */
.player-footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0; /* Prevent footer from shrinking */
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  min-width: 120px;
  justify-content: center;
}
.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f1f5f9;
}

.nav-btn--primary {
  background: #6366f1;
  color: white;
}
.nav-btn--primary:hover:not(:disabled) {
  background: #4f46e5;
}

.nav-btn--secondary {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}
.nav-btn--secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.nav-btn--success {
  background: #10b981;
  color: white;
}
.nav-btn--success:hover:not(:disabled) {
  background: #059669;
}

/* PDF MODAL */
.pdf-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* RESPONSIVE ADJUSTMENTS */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .progress-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .lesson-player-overlay {
    padding: 0;
  }
  .lesson-player {
    height: 100vh;
    border-radius: 0;
  }
  .player-header, .central-area, .player-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .lesson-title {
    font-size: 1.5rem;
  }
  .player-footer {
    flex-direction: column;
  }
  .nav-btn {
    width: 100%;
  }
}
</style>