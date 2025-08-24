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
// Mock API calls since the real ones are not provided
// In a real application, you would import these from an actual API file.
const getCourseContent = (courseId) => {
  console.log(`Mock: Fetching course content for ${courseId}`);
  return Promise.resolve({ success: true, data: [] });
};
const getCourseById = (courseId) => {
  console.log(`Mock: Fetching course details for ${courseId}`);
  return Promise.resolve({ success: true, data: {} });
};

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
    // === Data Loading & Processing Methods ===
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
        try {
          const courseResponse = await getCourseById(courseId);
          if (courseResponse.success && courseResponse.data) {
            courseDetails = courseResponse.data;
          }
        } catch (detailError) {
          console.warn('⚠️ LessonPlayer: Failed to load course details:', detailError);
        }
        this.courseData = courseDetails || this.course;

        let lessons = [];
        if (courseDetails && courseDetails.curriculum && courseDetails.curriculum.length > 0) {
          lessons = this.processLessons(courseDetails.curriculum);
        }

        if (lessons.length === 0) {
          try {
            const contentResponse = await getCourseContent(courseId);
            if (contentResponse.success && contentResponse.data && contentResponse.data.length > 0) {
              lessons = this.processLessons(contentResponse.data);
            }
          } catch (contentError) {
            console.warn('⚠️ LessonPlayer: getCourseContent failed:', contentError);
          }
        }

        if (lessons.length === 0 && this.course.curriculum) {
          lessons = this.processLessons(this.course.curriculum);
        }

        if (lessons.length === 0) {
          lessons = this.createDemoLessons();
        }

        this.lessons = lessons;
        console.log(`✅ LessonPlayer: Loaded ${lessons.length} lessons`);
      } catch (error) {
        console.error('❌ LessonPlayer: Error loading course content:', error);
        this.error = 'Не удалось загрузить содержание курса';
      } finally {
        this.loading = false;
      }
    },

    processLessons(lessonsArray) {
      if (!Array.isArray(lessonsArray)) return [];
      return lessonsArray.map((lesson, index) => ({
        ...lesson,
        id: lesson._id || lesson.id || `lesson_${index}`,
        title: lesson.title || lesson.lessonName || `Урок ${index + 1}`,
        steps: this.processSteps(lesson.steps || [])
      }));
    },

    processSteps(steps) {
      if (!Array.isArray(steps)) return [];
      return steps.map((step, index) => ({
        ...step,
        id: step.id || `step_${index}`,
        type: step.type || 'explanation',
        title: step.title || this.getStepTitle(step),
        data: this.processStepData(step)
      }));
    },

    processStepData(step) {
      if (!step.data && !step.content) return {};
      const baseData = step.data || {};
      
      switch (step.type) {
        case 'explanation':
        case 'example':
        case 'reading':
          return {
            ...baseData,
            content: baseData.content || step.content || '',
            images: baseData.images || step.images || []
          };
        case 'video':
          return {
            ...baseData,
            url: baseData.url || step.videoUrl || step.url || '',
            description: baseData.description || step.description || ''
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
            files: baseData.files || step.files || []
          };
        case 'quiz':
          if (Array.isArray(baseData) && baseData.length > 0) {
            return baseData;
          } else if (step.question || step.content) {
            return [{
              question: step.question || step.content || '',
              type: step.quizType || 'multiple-choice',
              options: (step.options || []).map(opt => 
                typeof opt === 'string' ? { text: opt } : opt
              ),
              correctAnswer: parseInt(step.correctAnswer) || 0,
              explanation: step.explanation || ''
            }];
          } else if (step.quizzes && Array.isArray(step.quizzes)) {
            return step.quizzes;
          }
          return [];
        default:
          return {
            ...baseData,
            content: baseData.content || step.content || ''
          };
      }
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

    // === Utility & Demo Methods ===
    getStepTitle(step) {
      if (step.title) return step.title;
      const titles = {
        explanation: '📝 Объяснение', example: '💡 Пример', video: '🎥 Видео',
        pdf: '📄 Материалы', practice: '🎯 Практика', quiz: '❓ Тест', reading: '📚 Чтение'
      };
      return titles[step.type] || '📌 Шаг';
    },

    getStepComponent(type) {
      const components = {
        explanation: 'step-text', example: 'step-text', reading: 'step-text',
        video: 'step-video', pdf: 'step-pdf', practice: 'step-practice', quiz: 'step-quiz'
      };
      return components[type] || 'step-text';
    },

    createDemoLessons() {
      const courseTitle = this.courseData?.title || this.course?.title || 'Курс';
      return [
        {
          id: 'lesson_1',
          title: 'Введение в курс',
          steps: [
            { id: 'step_1_1', type: 'explanation', title: 'Добро пожаловать!', data: { content: `Добро пожаловать на курс "${courseTitle}"!<br><br>В этом курсе вы изучите основные концепции и получите практические навыки.<br><br>Курс состоит из нескольких уроков, каждый из которых включает теоретический материал и практические задания.` } },
            { id: 'step_1_2', type: 'explanation', title: 'Как проходить курс', data: { content: `Рекомендации по изучению курса:<br><br>• Изучайте материал последовательно<br>• Выполняйте все практические задания<br>• Не спешите, важно понимание материала<br>• При необходимости возвращайтесь к предыдущим урокам` } }
          ]
        },
        {
          id: 'lesson_2',
          title: 'Основы',
          steps: [
            { id: 'step_2_1', type: 'explanation', title: 'Теоретические основы', data: { content: `В этом разделе мы рассмотрим основные теоретические концепции курса.<br><br>Эти знания станут фундаментом для дальнейшего изучения более сложных тем.` } },
            { id: 'step_2_2', type: 'quiz', title: 'Проверка знаний', data: [{ question: 'Что является основой успешного изучения курса?', options: [{ text: 'Быстрое прохождение всех уроков', correct: false }, { text: 'Понимание материала и выполнение заданий', correct: true }, { text: 'Запоминание всех терминов наизусть', correct: false }], explanation: 'Качество изучения важнее скорости. Понимание и практика - ключ к успеху.' }] }
          ]
        },
        {
          id: 'lesson_3',
          title: 'Практическое применение',
          steps: [
            { id: 'step_3_1', type: 'practice', title: 'Практическое задание', data: { instructions: 'В этом разделе вы сможете применить полученные знания на практике. Следуйте инструкциям и выполняйте задания поэтапно.', files: [] } }
          ]
        }
      ];
    }
  },

  // === Step Components ===
  components: {
    'step-text': {
      props: ['step'],
      template: `
        <div class="step-text">
          <div class="text-content" v-html="formattedContent"></div>
        </div>
      `,
      computed: {
        formattedContent() {
          const content = this.step.data?.content || this.step.content || 'Содержание не найдено';
          return content.replace(/\n/g, '<br>');
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
          showResult: false
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
                  :disabled="showResult"
                  :class="getOptionClass(quizIndex, index, option)"
                  class="quiz-option"
                >
                  <span class="option-text">{{ getOptionText(option) }}</span>
                  <div v-if="showResult" class="option-indicator">
                    <svg v-if="isCorrectOption(option)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    <svg v-else-if="selectedAnswer === \`\${quizIndex}-\${index}\`" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </button>
              </div>
              <div v-if="showResult && quiz.explanation" class="quiz-explanation">
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
            <p>Тест недоступен</p>
          </div>
        </div>
      `,
      computed: {
        quizData() {
          if (Array.isArray(this.step.data)) return this.step.data;
          if (this.step.data && this.step.data.question) return [this.step.data];
          if (this.step.question) return [{ question: this.step.question, options: this.step.options || [], explanation: this.step.explanation }];
          return [];
        }
      },
      methods: {
        selectAnswer(quizIndex, optionIndex, option) {
          if (this.showResult) return;
          const answerId = `${quizIndex}-${optionIndex}`;
          this.selectedAnswer = answerId;
          this.showResult = true;
          const isCorrect = this.isCorrectOption(option);
          this.$emit('quiz-answer', this.stepIndex, optionIndex, isCorrect);
        },
        getOptionText(option) {
          return typeof option === 'string' ? option : option.text || option.label || 'Опция';
        },
        isCorrectOption(option) {
          return typeof option === 'object' ? option.correct : false;
        },
        getOptionClass(quizIndex, optionIndex, option) {
          const answerId = `${quizIndex}-${optionIndex}`;
          if (!this.showResult) return this.selectedAnswer === answerId ? 'selected' : '';
          if (this.isCorrectOption(option)) return 'correct';
          if (this.selectedAnswer === answerId && !this.isCorrectOption(option)) return 'incorrect';
          return 'disabled';
        }
      }
    }
  }
}
</script>

<style scoped>
/* Modern CSS Variables */
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --secondary: #64748b;
  --success: #10b981;
  --success-dark: #059669;
  --danger: #ef4444;
  --warning: #f59e0b;
  
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  
  --white: #ffffff;
  --black: #000000;
  
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-lg: 1rem;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* === Layout === */
.lesson-player-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.lesson-player {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* === Header === */
.player-header {
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--gray-100);
  border: none;
  border-radius: var(--radius);
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-600);
  cursor: pointer;
  transition: var(--transition);
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-right: 3rem;
}

.course-info {
  flex: 1;
}

.course-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
}

.lesson-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
  line-height: 1.3;
}

.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 180px;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  border-radius: var(--radius);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--gray-600);
  white-space: nowrap;
}

/* === Main Content === */
.player-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.loading-state, .error-state, .no-content, .empty-lesson {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 3rem;
  color: var(--gray-500);
}

.loading-state h3, .error-state h3, .no-content h3, .empty-lesson h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--gray-700);
}

.loading-state p, .error-state p, .no-content p, .empty-lesson p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.error-icon, .empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.retry-btn, .back-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: var(--white);
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.retry-btn:hover, .back-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Spinner */
.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lesson-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step-container {
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  overflow: hidden;
}

.step-header {
  background: var(--gray-50);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-number {
  width: 2rem;
  height: 2rem;
  background: var(--primary);
  color: var(--white);
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
  color: var(--gray-900);
  margin: 0;
}

.step-body {
  padding: 2rem;
}

/* === Footer Navigation === */
.player-footer {
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition);
  min-width: 120px;
  justify-content: center;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.nav-btn--primary {
  background: var(--primary);
  color: var(--white);
}

.nav-btn--primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.nav-btn--secondary {
  background: var(--white);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.nav-btn--secondary:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-1px);
}

.nav-btn--success {
  background: var(--success);
  color: var(--white);
}

.nav-btn--success:hover:not(:disabled) {
  background: var(--success-dark);
  transform: translateY(-1px);
}

.lesson-counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-weight: 600;
  color: var(--gray-700);
}

.current-lesson {
  color: var(--primary);
}

.divider {
  color: var(--gray-400);
}

/* === Step Components Styles === */
/* Text Step */
.step-text {
  line-height: 1.7;
}

.text-content {
  font-size: 1rem;
  color: var(--gray-700);
}

.text-content p {
  margin: 0 0 1rem 0;
}

.text-content p:last-child {
  margin-bottom: 0;
}

/* Video Step */
.step-video {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-wrapper {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.video-embed {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 */
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
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
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: var(--gray-100);
  border-radius: var(--radius);
  color: var(--gray-500);
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.video-description {
  text-align: center;
  font-style: italic;
  color: var(--gray-600);
  font-size: 0.875rem;
  margin: 0;
}

/* PDF Step */
.step-pdf {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pdf-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.pdf-header p {
  color: var(--gray-600);
  margin: 0;
  line-height: 1.5;
}

.pdf-viewer {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  background: var(--gray-100);
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
}

.pdf-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
}

.action-btn--secondary {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.action-btn--secondary:hover {
  background: var(--gray-200);
  border-color: var(--gray-400);
  transform: translateY(-1px);
}

/* Practice Step */
.step-practice {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.practice-header {
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: var(--radius);
  border: 1px solid var(--gray-200);
}

.practice-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
}

.practice-header p {
  color: var(--gray-600);
  margin: 0;
  line-height: 1.6;
}

.practice-files h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 1rem 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--gray-700);
  transition: var(--transition);
}

.file-card:hover {
  background: var(--gray-50);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.875rem;
}

.download-icon {
  color: var(--gray-400);
  flex-shrink: 0;
}

.no-files {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: 2rem;
}

.no-files p {
  margin: 0;
}

/* Quiz Step */
.step-quiz {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.quiz-item {
  margin-bottom: 2rem;
}

.quiz-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 1rem 0;
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
  justify-content: space-between;
  padding: 1rem;
  background: var(--white);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-700);
  width: 100%;
}

.quiz-option:hover:not(:disabled) {
  background: var(--gray-50);
  border-color: var(--primary);
  transform: translateX(4px);
}

.quiz-option:disabled {
  cursor: not-allowed;
}

.quiz-option.selected {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.05);
}

.quiz-option.correct {
  border-color: var(--success);
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-dark);
}

.quiz-option.incorrect {
  border-color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.quiz-option.disabled {
  opacity: 0.6;
}

.option-text {
  flex: 1;
}

.option-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.quiz-explanation {
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: var(--radius);
  border-left: 4px solid var(--primary);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.75rem;
}

.quiz-explanation p {
  margin: 0;
  color: var(--gray-600);
  line-height: 1.6;
  font-style: italic;
}

.no-quiz {
  text-align: center;
  color: var(--gray-500);
  font-style: italic;
  padding: 2rem;
}

/* PDF Fullscreen Modal */
.pdf-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.pdf-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 95vh;
  background: var(--white);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.pdf-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  background: var(--white);
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-600);
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow);
}

.pdf-close-btn:hover {
  background: var(--gray-100);
  color: var(--gray-900);
}

.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* === Responsive Design === */
@media (max-width: 1024px) {
  .lesson-player {
    max-width: 95vw;
  }
  
  .file-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .lesson-player-overlay {
    padding: 0;
  }
  
  .lesson-player {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .player-header {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .close-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    margin-right: 0;
    padding-top: 1rem;
  }
  
  .course-info {
    text-align: center;
  }
  
  .lesson-title {
    font-size: 1.25rem;
  }
  
  .progress-section {
    align-items: stretch;
  }
  
  .player-content {
    padding: 1rem;
  }
  
  .step-body {
    padding: 1rem;
  }
  
  .player-footer {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
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
}

@media (max-width: 480px) {
  .step-header {
    padding: 0.75rem 1rem;
  }
  
  .step-number {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.75rem;
  }
  
  .step-title {
    font-size: 1rem;
  }
  
  .pdf-viewer {
    height: 300px;
  }
  
  .quiz-option {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
  
  .file-card {
    padding: 0.75rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root {
    --white: #1e293b;
    --gray-50: #334155;
    --gray-100: #475569;
    --gray-200: #64748b;
    --gray-300: #94a3b8;
    --gray-400: #cbd5e1;
    --gray-500: #e2e8f0;
    --gray-600: #f1f5f9;
    --gray-700: #f8fafc;
    --gray-800: #ffffff;
    --gray-900: #ffffff;
    --black: #ffffff;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus styles for accessibility */
.close-btn:focus-visible,
.nav-btn:focus-visible,
.quiz-option:focus-visible,
.file-card:focus-visible,
.action-btn:focus-visible,
.retry-btn:focus-visible,
.back-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>