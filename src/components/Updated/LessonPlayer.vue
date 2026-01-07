// src/components/Updated/LessonPlayer.vue - FIXED ESLint v-if warnings
<template>
  <div class="lesson-player-overlay" @click="handleOverlayClick">
    <div class="lesson-player" @click.stop>
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
            <template v-if="isStructuredFormat">
              <div class="format-indicator">
                <span class="structured-badge">Structured Format</span>
              </div>
            </template>
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

      <template v-if="learningObjectives.length > 0">
        <div class="objectives-container">
          <div class="objectives-card">
            <div class="objectives-header">
              <div class="objectives-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"></path><polyline points="22 4 12 14.01l-3-3"></polyline>
                </svg>
              </div>
              <h2>{{ isStructuredFormat ? 'Цели урока' : 'Цели обучения' }}</h2>
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
      </template>

      <main class="player-content">
        <template v-if="loading">
          <div class="loading-state">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
            <h3>Загрузка курса...</h3>
            <p>{{ isStructuredFormat ? 'Подготовка структурированного контента' : 'Подготовка учебных материалов' }}</p>
          </div>
        </template>

        <template v-else-if="error">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Не удалось загрузить курс</h3>
            <p>{{ error }}</p>
            <button @click="loadCourseContent" class="retry-btn">
              Попробовать снова
            </button>
          </div>
        </template>

        <template v-else-if="isStructuredFormat && currentStructuredLesson">
          <div class="structured-lesson-content">
            <template v-if="currentStructuredLesson.content.theory">
              <div class="content-section theory-section">
                <div class="section-header">
                  <div class="section-icon theory-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  </div>
                  <h2>Теория</h2>
                </div>
                <div class="theory-content">
                  <template v-if="currentStructuredLesson.content.theory.concepts">
                    <div v-for="(concept, index) in currentStructuredLesson.content.theory.concepts" 
                         :key="`concept-${index}`"
                         class="concept-block">
                      <h3 class="concept-title" v-if="concept.title">{{ concept.title }}</h3>
                      <div class="concept-content" v-html="formatContent(concept.content)"></div>
                      <template v-if="concept.images && concept.images.length > 0">
                        <div class="concept-images">
                          <div v-for="image in concept.images" :key="image.id" class="concept-image">
                            <img :src="image.url" :alt="image.alt || 'Concept image'" />
                            <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                  
                  <template v-else-if="typeof currentStructuredLesson.content.theory === 'object'">
                    <div v-for="(section, key) in currentStructuredLesson.content.theory" :key="key" class="theory-subsection">
                      <h3 class="subsection-title">{{ formatSectionTitle(key) }}</h3>
                      <div class="subsection-content">
                        <template v-if="Array.isArray(section)">
                          <div v-for="(item, idx) in section" :key="idx" class="theory-item">
                            <template v-if="typeof item === 'object' && item.content">
                              <div class="structured-item">
                                <h4 v-if="item.title" class="item-title">{{ item.title }}</h4>
                                <div v-html="formatContent(item.content)"></div>
                              </div>
                            </template>
                            <template v-else>
                              <div class="simple-item" v-html="formatContent(item)"></div>
                            </template>
                          </div>
                        </template>
                        <template v-else>
                          <div v-html="formatContent(section)"></div>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <template v-if="currentStructuredLesson.content.practical_examples">
              <div class="content-section examples-section">
                <div class="section-header">
                  <div class="section-icon examples-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  </div>
                  <h2>Практические примеры</h2>
                </div>
                <div class="examples-content">
                  <template v-if="currentStructuredLesson.content.practical_examples.exercises">
                    <div v-for="(exercise, index) in currentStructuredLesson.content.practical_examples.exercises"
                         :key="`exercise-${index}`"
                         class="exercise-block">
                      <h3 class="exercise-title" v-if="exercise.title">{{ exercise.title }}</h3>
                      <div class="exercise-instructions" v-html="formatContent(exercise.instructions)"></div>
                      <template v-if="exercise.images && exercise.images.length > 0">
                        <div class="exercise-images">
                          <div v-for="image in exercise.images" :key="image.id" class="exercise-image">
                            <img :src="image.url" :alt="image.alt || 'Exercise image'" />
                            <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
                          </div>
                        </div>
                      </template>
                    </div>
                  </template>
                  
                  <template v-else-if="typeof currentStructuredLesson.content.practical_examples === 'object'">
                    <div v-for="(section, key) in currentStructuredLesson.content.practical_examples" :key="key" class="examples-subsection">
                      <h3 class="subsection-title">{{ formatSectionTitle(key) }}</h3>
                      <div class="subsection-content">
                        <template v-if="Array.isArray(section)">
                          <div v-for="(item, idx) in section" :key="idx" class="example-item">
                            <template v-if="typeof item === 'object' && item.instructions">
                              <div class="structured-example">
                                <h4 v-if="item.title" class="item-title">{{ item.title }}</h4>
                                <div v-html="formatContent(item.instructions)"></div>
                              </div>
                            </template>
                            <template v-else>
                              <div class="simple-example" v-html="formatContent(item)"></div>
                            </template>
                          </div>
                        </template>
                        <template v-else>
                          <div v-html="formatContent(section)"></div>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <template v-if="currentStructuredLesson.content.homework">
              <div class="content-section homework-section">
                <div class="section-header">
                  <div class="section-icon homework-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon><line x1="3" y1="22" x2="21" y2="22"></line></svg>
                  </div>
                  <h2>Домашнее задание</h2>
                </div>
                <div class="homework-content">
                  <template v-if="currentStructuredLesson.content.homework.theory_questions && currentStructuredLesson.content.homework.theory_questions.length > 0">
                    <div class="homework-subsection">
                      <h3 class="homework-subtitle">Теоретические вопросы</h3>
                      <ol class="theory-questions-list">
                        <li v-for="(question, index) in currentStructuredLesson.content.homework.theory_questions" 
                            :key="`theory-q-${index}`" 
                            class="theory-question">
                          {{ question }}
                        </li>
                      </ol>
                    </div>
                  </template>

                  <template v-if="currentStructuredLesson.content.homework.practical_tasks && currentStructuredLesson.content.homework.practical_tasks.length > 0">
                    <div class="homework-subsection">
                      <h3 class="homework-subtitle">Практические задания</h3>
                      <ol class="practical-tasks-list">
                        <li v-for="(task, index) in currentStructuredLesson.content.homework.practical_tasks" 
                            :key="`practical-task-${index}`" 
                            class="practical-task">
                          {{ task }}
                        </li>
                      </ol>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </template>

        <template v-else-if="!isStructuredFormat && currentLesson && hasSteps">
          <div class="lesson-content">
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
        </template>

        <template v-else>
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>Контент недоступен</h3>
            <p>Содержание этого урока пока недоступно.</p>
          </div>
        </template>
      </main>

      <template v-if="!loading && !error && lessons.length > 0">
        <footer class="player-footer">
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

          <template v-if="!isLastLesson">
            <button 
              class="nav-btn nav-btn--primary"
              @click="goToNextLesson"
            >
              Далее
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </template>

          <template v-else>
            <button 
              class="nav-btn nav-btn--success"
              @click="completeCourse"
            >
              Завершить курс
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </button>
          </template>
        </footer>
      </template>
    </div>
  </div>
</template>

<script>
// ✅ ENHANCED: Proper API imports for Updated Courses with structured format support
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
      structuredLessons: [], // ✅ NEW: For structured format
      currentLessonIndex: 0,
      quizAnswers: new Map(),
      fullscreenPdf: null,
      loading: true,
      error: null,
      courseData: null,
      isStructuredFormat: false, // ✅ NEW: Track format type
      structuredCourseData: null // ✅ NEW: Store structured course data
    }
  },

  computed: {
    courseTitle() {
      if (this.structuredCourseData) {
        return this.structuredCourseData.courseTitle;
      }
      return this.courseData?.title || this.course?.title || 'Курс';
    },

    currentLesson() {
      if (this.isStructuredFormat) {
        return null; // Use currentStructuredLesson instead
      }
      return this.lessons[this.currentLessonIndex] || null;
    },

    // ✅ NEW: Current structured lesson
    currentStructuredLesson() {
      if (!this.isStructuredFormat) return null;
      return this.structuredLessons[this.currentLessonIndex] || null;
    },

    currentLessonTitle() {
      if (this.isStructuredFormat && this.currentStructuredLesson) {
        return this.currentStructuredLesson.title || `Урок ${this.currentLessonIndex + 1}`;
      }

      const lesson = this.currentLesson;
      if (!lesson) return 'Загрузка урока...';

      // Handle title
      if (lesson.title && typeof lesson.title === 'string') return lesson.title;

      // Handle multilingual lessonName
      if (lesson.lessonName) {
        if (typeof lesson.lessonName === 'string') return lesson.lessonName;
        if (typeof lesson.lessonName === 'object') {
          const lang = localStorage.getItem('lang') || 'ru';
          const localized = lesson.lessonName[lang] || lesson.lessonName.en || lesson.lessonName.ru || lesson.lessonName.uz;
          if (localized && typeof localized === 'string') return localized;
        }
      }

      return `Урок ${this.currentLessonIndex + 1}`;
    },

    hasSteps() {
      if (this.isStructuredFormat) return true; // Structured format always has content
      return this.currentLesson && this.currentLesson.steps && this.currentLesson.steps.length > 0;
    },

    totalLessons() {
      return this.isStructuredFormat ? this.structuredLessons.length : this.lessons.length;
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
      // ✅ NEW: Enhanced objectives for structured format
      if (this.isStructuredFormat && this.currentStructuredLesson) {
        const content = this.currentStructuredLesson.content;
        const objectives = [];
        
        if (content.theory) {
          objectives.push('Изучение теоретических основ темы');
        }
        if (content.practical_examples) {
          objectives.push('Применение знаний на практических примерах');
        }
        if (content.homework) {
          objectives.push('Выполнение домашних заданий для закрепления материала');
        }
        
        return objectives.length > 0 ? objectives : this.getDefaultObjectives();
      }
      
      // Get objectives from course data
      if (this.courseData?.learningOutcomes && Array.isArray(this.courseData.learningOutcomes)) {
        return this.courseData.learningOutcomes;
      }
      
      return this.getDefaultObjectives();
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
    // ✅ ENHANCED: Load course content with structured format support
    async loadCourseContent() {
      if (!this.course || (!this.course._id && !this.course.id)) {
this.error = 'Неверные данные курса';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const courseId = this.course._id || this.course.id;

        let courseDetails = null;
        let lessons = [];

        // ✅ STRATEGY 1: Try to get structured format first
        try {
          const response = await fetch(`/api/updated-courses/${courseId}?format=structured`);
          const result = await response.json();
          
          if (result.success && result.course) {
this.structuredCourseData = result.course;
            this.isStructuredFormat = true;
            
            // Extract structured lessons
            if (result.course.lessons && Array.isArray(result.course.lessons)) {
              this.structuredLessons = result.course.lessons;
              this.loading = false;
              return;
            }
          }
        } catch (structuredError) {
}

        // ✅ STRATEGY 2: Fall back to standard format
        try {
          const response = await fetch(`/api/updated-courses/${courseId}`);
          const result = await response.json();
          
          if (result.success && result.course) {
            courseDetails = result.course;
            this.isStructuredFormat = false;
            
            // Extract lessons from curriculum or lessons field
            if (courseDetails.curriculum && Array.isArray(courseDetails.curriculum)) {
              lessons = this.processCurriculum(courseDetails.curriculum);
            } else if (courseDetails.lessons && Array.isArray(courseDetails.lessons)) {
              lessons = this.processStructuredLessonsToTraditional(courseDetails.lessons);
            }
          }
        } catch (standardError) {
}

        // ✅ STRATEGY 3: Fallback to general Updated Courses API
        if (!courseDetails && lessons.length === 0) {
          try {
            const coursesResponse = await getUpdatedCourses();
            
            if (coursesResponse && coursesResponse.success && coursesResponse.courses) {
              const foundCourse = coursesResponse.courses.find(c => 
                (c._id || c.id) === courseId || c.title === this.course.title
              );
              
              if (foundCourse) {
                courseDetails = foundCourse;
                
                if (foundCourse.curriculum && Array.isArray(foundCourse.curriculum)) {
                  lessons = this.processCurriculum(foundCourse.curriculum);
                }
              }
            }
          } catch (coursesError) {
}
        }

        // ✅ Set final data
        this.courseData = courseDetails || this.course;
        this.lessons = lessons;

        if (!this.isStructuredFormat && lessons.length === 0) {
          this.error = 'Содержание уроков для этого курса не найдено';
} else {
}
        
      } catch (error) {
this.error = 'Не удалось загрузить содержание курса. Пожалуйста, попробуйте еще раз.';
      } finally {
        this.loading = false;
      }
    },

    // ✅ NEW: Process structured lessons to traditional format for backward compatibility
    processStructuredLessonsToTraditional(structuredLessons) {
      if (!Array.isArray(structuredLessons)) {
return [];
      }

      return structuredLessons.map((lesson, index) => {
        try {
          const processedLesson = {
            id: lesson._id || `lesson_${index}`,
            _id: lesson._id || `lesson_${index}`,
            title: lesson.title || `Урок ${index + 1}`,
            lessonName: lesson.title || `Урок ${index + 1}`,
            description: this.extractLessonDescription(lesson.content),
            duration: lesson.duration || '30 мин',
            order: lesson.lessonNumber - 1 || index,
            steps: this.convertStructuredContentToSteps(lesson.content, index)
          };

          return processedLesson;

        } catch (lessonError) {
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

    // ✅ NEW: Extract lesson description from structured content
    extractLessonDescription(content) {
      if (!content) return '';
      
      // Try to get description from theory content
      if (content.theory?.concepts?.[0]?.content) {
        return content.theory.concepts[0].content.substring(0, 200) + '...';
      }
      
      // Try to get from practical examples
      if (content.practical_examples?.exercises?.[0]?.instructions) {
        return 'Практическое занятие: ' + content.practical_examples.exercises[0].instructions.substring(0, 150) + '...';
      }
      
      return 'Структурированный урок';
    },

    // ✅ NEW: Convert structured content to traditional steps
    convertStructuredContentToSteps(content, lessonIndex) {
      const steps = [];
      let stepIndex = 0;

      // Add theory content as explanation steps
      if (content.theory?.concepts) {
        content.theory.concepts.forEach(concept => {
          steps.push({
            id: `step_${lessonIndex}_${stepIndex++}`,
            type: 'explanation',
            title: concept.title || 'Теория',
            content: concept.content || '',
            data: {
              content: concept.content || '',
              images: concept.images || []
            },
            images: concept.images || []
          });
        });
      } else if (typeof content.theory === 'object' && content.theory) {
        // Handle flexible theory structure
        Object.entries(content.theory).forEach(([key, section]) => {
          steps.push({
            id: `step_${lessonIndex}_${stepIndex++}`,
            type: 'explanation',
            title: this.formatSectionTitle(key),
            content: Array.isArray(section) ? section.join('\n\n') : (typeof section === 'object' ? JSON.stringify(section) : section),
            data: {
              content: Array.isArray(section) ? section.join('\n\n') : (typeof section === 'object' ? JSON.stringify(section) : section)
            }
          });
        });
      }

      // Add practical examples as practice steps
      if (content.practical_examples?.exercises) {
        content.practical_examples.exercises.forEach(exercise => {
          steps.push({
            id: `step_${lessonIndex}_${stepIndex++}`,
            type: 'practice',
            title: exercise.title || 'Практика',
            content: exercise.instructions || '',
            data: {
              instructions: exercise.instructions || '',
              type: 'guided',
              images: exercise.images || []
            },
            images: exercise.images || []
          });
        });
      } else if (typeof content.practical_examples === 'object' && content.practical_examples) {
        // Handle flexible practical examples structure
        Object.entries(content.practical_examples).forEach(([key, section]) => {
          steps.push({
            id: `step_${lessonIndex}_${stepIndex++}`,
            type: 'practice',
            title: this.formatSectionTitle(key),
            content: Array.isArray(section) ? section.join('\n\n') : (typeof section === 'object' ? JSON.stringify(section) : section),
            data: {
              instructions: Array.isArray(section) ? section.join('\n\n') : (typeof section === 'object' ? JSON.stringify(section) : section),
              type: 'guided'
            }
          });
        });
      }

      // Add homework questions as quiz steps
      if (content.homework?.theory_questions?.length > 0) {
        steps.push({
          id: `step_${lessonIndex}_${stepIndex++}`,
          type: 'quiz',
          title: 'Контрольные вопросы',
          content: content.homework.theory_questions[0],
          data: content.homework.theory_questions.map((question, qIndex) => ({
            question: question,
            type: 'multiple-choice',
            options: [
              { text: 'Вариант A' },
              { text: 'Вариант B' },
              { text: 'Вариант C' }
            ],
            correctAnswer: 0,
            explanation: 'Повторите материал урока для правильного ответа.'
          }))
        });
      }

      return steps;
    },

    // ✅ FIXED: Process curriculum from Updated Courses (unchanged)
    processCurriculum(curriculum) {
      if (!Array.isArray(curriculum)) {
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

          return processedLesson;

        } catch (lessonError) {
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

    // ✅ FIXED: Process steps from Updated Course curriculum (unchanged)
    processSteps(steps) {
      if (!Array.isArray(steps)) {
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

          return processedStep;
          
        } catch (stepError) {
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

    // ✅ NEW: Format content for structured display
    formatContent(content) {
      if (!content) return '';
      
      if (typeof content !== 'string') {
        if (typeof content === 'object') {
          return JSON.stringify(content, null, 2);
        }
        return String(content);
      }
      
      // Convert markdown-like formatting to HTML
      return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^(?!<p>)/, '<p>')
        .replace(/(?<!<\/p>)$/, '</p>');
    },

    // ✅ NEW: Format section titles
    formatSectionTitle(key) {
      return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/([a-z])([A-Z])/g, '$1 $2');
    },

    // ✅ NEW: Get default objectives
    getDefaultObjectives() {
      return [
        'Понимание основных концепций, рассматриваемых в этом уроке',
        'Применение практических навыков через практические упражнения',
        'Выполнение оценочных заданий для проверки знаний'
      ];
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

    // Utility methods (for traditional format)
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

  // Step components (for traditional format - unchanged)
  components: {
    'step-text': {
      props: ['step'],
      template: `
        <div class="step-text">
          <div class="text-content" v-html="formattedContent"></div>
          <template v-if="hasImages">
            <div class="step-images">
              <div v-for="image in step.images || []" :key="image.id || image.url" class="step-image">
                <img :src="image.url" :alt="image.alt || 'Изображение урока'" />
                <p v-if="image.caption" class="image-caption">{{ image.caption }}</p>
              </div>
            </div>
          </template>
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
            <template v-if="videoUrl">
              <div class="video-container">
                <iframe v-if="isYouTube" :src="embedUrl" frameborder="0" allowfullscreen></iframe>
                <video v-else controls>
                  <source :src="videoUrl" type="video/mp4">
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              </div>
            </template>
            <template v-else>
              <div class="video-placeholder">
                <p>Видео-контент недоступен</p>
              </div>
            </template>
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
          <template v-if="pdfUrl">
            <div class="pdf-container">
              <iframe :src="pdfUrl" class="pdf-iframe"></iframe>
              <div class="pdf-actions">
                <button @click="$emit('pdf-fullscreen', pdfUrl)" class="pdf-fullscreen-btn">
                  Открыть в полноэкранном режиме
                </button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="pdf-placeholder">
              <p>PDF-контент недоступен</p>
            </div>
          </template>
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
            <template v-if="instructions">
              <div v-html="formattedInstructions"></div>
            </template>
            <template v-else>
              <div>
                <p>Инструкции к практическому упражнению недоступны.</p>
              </div>
            </template>
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
          <template v-if="quizData && quizData.length > 0">
            <div v-for="(quiz, quizIndex) in quizData" :key="quizIndex" class="quiz-item">
              <h3 class="quiz-question">{{ quiz.question }}</h3>
              
              <template v-if="quiz.options && quiz.options.length > 0">
                <div class="quiz-options">
                  <button
                    v-for="(option, index) in quiz.options"
                    :key="index"
                    @click="selectAnswer(quizIndex, index)"
                    :class="getOptionClass(quizIndex, index)"
                    class="quiz-option"
                  >
                    <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
                    <span class="option-text">{{ getOptionText(option) }}</span>
                    <span class="option-icon correct-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    <span class="option-icon incorrect-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                  </button>
                </div>
              </template>
              
              <template v-if="isAnswered(quizIndex) && quiz.explanation">
                <div class="quiz-explanation">
                  <strong>Объяснение:</strong> {{ quiz.explanation }}
                </div>
              </template>
            </div>
          </template>
          
          <template v-else>
            <div class="no-quiz">
              <p>Тест недоступен</p>
            </div>
          </template>
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
          if(this.isAnswered(quizIndex)) return; // Prevent re-answering
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
/* Base styles (unchanged from original) */
.lesson-player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(249, 250, 251, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  overflow-y: auto;
}

.lesson-player {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  min-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  margin: 0 auto;
}

/* Header styles (enhanced) */
.player-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.25rem 2rem;
  position: relative;
  flex-shrink: 0;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
  transform: rotate(90deg);
}

.header-content {
  max-width: calc(100% - 60px);
  padding-right: 1rem;
}

.course-badge {
  display: inline-block;
  background: #4f46e5;
  color: white;
  padding: 0.375rem 0.875rem;
  border-radius: 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

/* ✅ NEW: Format indicator */
.format-indicator {
  margin-top: 0.75rem;
}

.structured-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lesson-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  word-wrap: break-word;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  gap: 1rem;
}

.lesson-counter {
  font-weight: 500;
  color: #4b5563;
  flex-shrink: 0;
}

.progress-text {
  color: #4f46e5;
  font-weight: 600;
  white-space: nowrap;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Learning Objectives (enhanced) */
.objectives-container {
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.objectives-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
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
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.objectives-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.objectives-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #374151;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.objectives-list li svg {
  color: #10b981;
  flex-shrink: 0;
  margin-top: 4px;
}

/* Main Content */
.player-content {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
}

/* ✅ NEW: Structured lesson content styles */
.structured-lesson-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.theory-icon { background: #3b82f6; }
.examples-icon { background: #10b981; }
.homework-icon { background: #f59e0b; }


.section-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* Theory content */
.theory-content,
.examples-content,
.homework-content {
  padding: 1.5rem;
}

.concept-block,
.exercise-block {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.concept-block:last-child,
.exercise-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.concept-title,
.exercise-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.concept-content,
.exercise-instructions {
  font-size: 1rem;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 1rem;
}

.concept-images,
.exercise-images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.concept-image,
.exercise-image {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.concept-image img,
.exercise-image img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.image-caption {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
  background: #f9fafb;
  margin: 0;
  border-top: 1px solid #e5e7eb;
}

/* Flexible content structures */
.theory-subsection,
.examples-subsection {
  margin-bottom: 1.5rem;
}

.subsection-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.subsection-content {
  font-size: 1rem;
  line-height: 1.7;
  color: #374151;
}

.theory-item,
.example-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #4f46e5;
}

.structured-item,
.structured-example {
  margin-bottom: 1rem;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.simple-item,
.simple-example {
  margin-bottom: 0.75rem;
}

/* Homework content */
.homework-subsection {
  margin-bottom: 1.5rem;
}

.homework-subtitle {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.homework-subtitle::before {
  content: '';
  width: 4px;
  height: 1.25rem;
  background: #f59e0b;
  border-radius: 2px;
}

.theory-questions-list,
.practical-tasks-list {
  padding-left: 1.5rem;
  margin: 0;
}

.theory-question,
.practical-task {
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
}

/* Loading/Error States (unchanged) */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 300px;
  padding: 2rem;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state h3, .error-state h3, .empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.loading-state p, .error-state p, .empty-state p {
  color: #4b5563;
  margin: 0 0 1.5rem 0;
}

.retry-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #4338ca;
}

/* Traditional Lesson Content (unchanged) */
.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.step-header {
  background: #f9fafb;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-number {
  width: 36px;
  height: 36px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.step-type {
  font-size: 0.8125rem;
  color: #4f46e5;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.step-content {
  padding: 1.5rem;
}

/* Step Components (unchanged) */
.step-text {
  line-height: 1.7;
}

.text-content {
  color: #374151;
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.text-content p { margin: 0 0 1.25rem 0; }
.text-content p:last-child { margin-bottom: 0; }
.text-content h1, .text-content h2, .text-content h3 {
  color: #111827;
  margin: 1.5rem 0 1rem 0;
}
.text-content ul, .text-content ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}
.text-content li { margin-bottom: 0.5rem; }

.step-images {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0;
}

.step-image {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  border: 1px solid #e5e7eb;
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

.step-video {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}
.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
}
.video-container iframe,
.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #4b5563;
  background: #f9fafb;
}

.step-pdf {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pdf-container {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.pdf-iframe { width: 100%; height: 500px; border: none; }
.pdf-actions { padding: 1rem; background: #f9fafb; text-align: center; }
.pdf-fullscreen-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}
.pdf-fullscreen-btn:hover { background: #4338ca; }
.pdf-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #4b5563;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.step-practice {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}
.practice-content { color: #374151; line-height: 1.7; }

/* === REVAMPED QUIZ STYLES === */
.step-quiz {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.quiz-item {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  background: white;
}

.quiz-question {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  line-height: 1.4;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
}

.quiz-option:hover {
  border-color: #4f46e5;
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.option-letter {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  transition: all 0.2s;
}

.option-text {
  flex-grow: 1;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.option-icon {
  width: 24px;
  height: 24px;
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%) scale(0);
  transition: transform 0.2s ease-in-out;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-option.correct {
  border-color: #10b981;
  background: #f0fdf4;
}
.quiz-option.correct .option-letter {
  background: #10b981;
  color: white;
}
.quiz-option.correct .option-text {
  color: #064e3b;
}
.quiz-option.correct .correct-icon {
  transform: translateY(-50%) scale(1);
  opacity: 1;
  color: #10b981;
}

.quiz-option.incorrect {
  border-color: #ef4444;
  background: #fef2f2;
}
.quiz-option.incorrect .option-letter {
  background: #ef4444;
  color: white;
}
.quiz-option.incorrect .option-text {
  color: #991b1b;
}
.quiz-option.incorrect .incorrect-icon {
  transform: translateY(-50%) scale(1);
  opacity: 1;
  color: #ef4444;
}

.quiz-option.disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.quiz-option.disabled:hover {
  transform: none;
  box-shadow: none;
}
.quiz-option.correct.disabled, .quiz-option.incorrect.disabled {
  opacity: 1;
}


.quiz-explanation {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafb;
  border-left: 4px solid #9ca3af;
  border-radius: 0 6px 6px 0;
  font-size: 0.9375rem;
  color: #374151;
  line-height: 1.6;
}
.quiz-explanation strong {
  color: #111827;
}

.no-quiz {
  text-align: center;
  color: #4b5563;
  padding: 2rem;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
}

/* Footer (enhanced) */
.player-footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  margin-top: auto;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  min-width: 120px;
  justify-content: center;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn--primary {
  background: #4f46e5;
  color: white;
}

.nav-btn--primary:hover:not(:disabled) {
  background: #4338ca;
}

.nav-btn--secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
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

.lesson-nav-info {
  font-weight: 500;
  color: #4b5563;
  font-size: 0.9375rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .lesson-player-overlay { padding: 1rem; }
  .lesson-player { min-height: calc(100vh - 2rem); }
  .player-header, .player-content, .player-footer { padding-left: 1.5rem; padding-right: 1.5rem; }
  .lesson-title { font-size: 1.5rem; }
  .close-btn { top: 1.25rem; right: 1.25rem; }
  .objectives-container { padding: 1rem 1.5rem; }
}

@media (max-width: 480px) {
  .lesson-player-overlay { padding: 0.5rem; }
  .lesson-player { min-height: calc(100vh - 1rem); }
  .player-header, .player-content, .player-footer { padding-left: 1rem; padding-right: 1rem; }
  .lesson-title { font-size: 1.25rem; }
  .step-images, .concept-images, .exercise-images { flex-direction: column; }
  .step-image, .concept-image, .exercise-image { max-width: 100%; }
  .section-header { padding: 1rem; }
  .section-header h2 { font-size: 1.125rem; }
}
</style>