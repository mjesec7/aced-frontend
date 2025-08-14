<template>
  <div class="study-page" :key="`study-${componentKey}`">
    <header class="study-header">
      <div class="study-header-content">
        <button @click="goBackToCourses" class="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span>Назад к курсам</span>
        </button>

        <span class="subscription-badge" :class="subscriptionClass">
          {{ subscriptionText }}
        </span>

        <div class="course-info">
          <h1 class="course-title">{{ course?.title || 'Загрузка...' }}</h1>
          <div class="course-meta">
            <span class="course-category">{{ course?.category }}</span>
            <span class="course-level">{{ course?.level }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-text">Прогресс: {{ completedLessons }}/{{ totalLessons }}</span>
            <span class="progress-percent">{{ progressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </header>

    <div class="study-main">
      <aside class="study-sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <div class="sidebar-header">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
              </svg>
            </div>
            <h3 class="text-lg font-medium">{{ course?.title || 'Курс' }}</h3>
          </div>
          <p class="text-sm text-muted-foreground">Полный курс</p>
          <button @click="toggleSidebar" class="sidebar-toggle mobile-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="sidebar-progress">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-muted-foreground">Прогресс</span>
            <span class="text-sm font-medium">{{ completedLessons }}/{{ totalLessons }} Завершено</span>
          </div>
          <div class="w-full bg-muted rounded-full h-2">
            <div 
              class="h-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-purple-light" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
        </div>

        <div class="lessons-list">
          <div class="p-4 space-y-2">
            <div
              v-for="(lesson, index) in lessons"
              :key="lesson.id"
              @click="selectLesson(index)"
              :class="[
                'lesson-item-modern',
                {
                  'current': currentLessonIndex === index,
                  'completed': lesson.completed,
                  'locked': lesson.locked
                }
              ]"
            >
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-0.5">
                  <svg v-if="lesson.completed" class="w-5 h-5 text-brand-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                  <svg v-else-if="lesson.locked" class="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <div v-else-if="currentLessonIndex === index" class="w-5 h-5 rounded-full border-2 border-brand-purple flex items-center justify-center">
                    <div class="w-2 h-2 rounded-full bg-brand-purple"></div>
                  </div>
                  <div v-else class="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs text-muted-foreground font-medium">
                      {{ String(index + 1).padStart(2, '0') }}
                    </span>
                    <span v-if="currentLessonIndex === index" class="text-xs px-2 py-1 bg-brand-purple text-white rounded-full">
                      Текущий
                    </span>
                  </div>
                  <h3 :class="[
                    'text-sm leading-tight mb-2',
                    currentLessonIndex === index ? 'text-brand-purple font-medium' : 'text-foreground'
                  ]">
                    {{ lesson.title }}
                  </h3>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ lesson.duration }}
                    <span v-if="lesson.type === 'workshop'" class="px-2 py-0.5 bg-muted rounded text-xs">Практика</span>
                  </div>
                </div>
                
                <svg v-if="!lesson.locked" class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="study-content">
        <button @click="toggleSidebar" class="sidebar-toggle desktop-hidden">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          <span>Содержание</span>
        </button>

        <div v-if="currentLesson" class="lesson-container-modern">
          <div class="lesson-header-modern">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-purple-dark rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-medium mb-1">{{ currentLesson.title }}</h1>
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {{ currentLesson.duration }}
                  </span>
                  <span>Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
                </div>
              </div>
            </div>
            <p class="text-muted-foreground text-lg">{{ currentLesson.description }}</p>
          </div>

          <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="learning-objectives-modern">
            <h2 class="text-lg font-medium mb-4 text-brand-purple-dark">Цели урока</h2>
            <ul class="space-y-2">
              <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="flex items-start gap-3">
                <div class="w-1.5 h-1.5 rounded-full bg-brand-purple mt-2.5 flex-shrink-0"></div>
                <span class="text-foreground">{{ objective }}</span>
              </li>
            </ul>
          </div>

          <div class="lesson-content-modern">
            <div class="content-prose" v-html="currentLesson.content"></div>

            <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-modern">
              <h3>Материалы урока</h3>
              <div class="resources-grid">
                <a
                  v-for="resource in currentLesson.resources"
                  :key="resource.id"
                  :href="resource.url"
                  download
                  class="resource-item-modern"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>{{ resource.name }}</span>
                  <span class="resource-size">{{ resource.size }}</span>
                </a>
              </div>
            </div>

            <div v-if="currentLesson.quiz" class="quiz-modern">
              <h3>Проверьте себя</h3>
              <div class="quiz-container-modern">
                <div v-if="!quizCompleted" class="quiz-questions">
                  <div class="question-item-modern">
                    <h4>{{ currentLesson.quiz.question }}</h4>
                    <div class="quiz-options-modern">
                      <label
                        v-for="(option, index) in currentLesson.quiz.options"
                        :key="index"
                        class="quiz-option-modern"
                      >
                        <input
                          type="radio"
                          :name="'quiz-' + currentLesson.id"
                          :value="index"
                          v-model="selectedAnswer"
                        />
                        <span>{{ option }}</span>
                      </label>
                    </div>
                    <button
                      @click="submitQuiz"
                      :disabled="selectedAnswer === null"
                      class="quiz-submit-modern"
                    >
                      Проверить ответ
                    </button>
                  </div>
                </div>
                <div v-else class="quiz-result-modern">
                  <div :class="['quiz-feedback-modern', quizCorrect ? 'correct' : 'incorrect']">
                    <svg v-if="quizCorrect" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.08"/>
                      <path d="M22 4L12 14.01l-3-3"/>
                    </svg>
                    <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span v-if="quizCorrect">Правильно! Отличная работа!</span>
                    <span v-else>Неправильно. Попробуйте еще раз!</span>
                  </div>
                  <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-quiz-modern">
                    Попробовать снова
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="lesson-navigation-modern">
            <button
              @click="previousLesson"
              :disabled="currentLessonIndex === 0"
              class="nav-btn-modern prev-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Предыдущий урок
            </button>

            <button
              v-if="!currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
              @click="markLessonCompleted"
              class="complete-btn-modern"
            >
              Завершить урок
            </button>

            <button
              @click="nextLesson"
              :disabled="currentLessonIndex === lessons.length - 1 || lessons[currentLessonIndex + 1]?.locked"
              class="nav-btn-modern next-btn"
            >
              Следующий урок
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  name: 'LessonLoader',
  props: {
    course: {
      type: Object,
      required: true
    }
  },
  emits: ['back-to-courses'],
  data() {
    return {
      lessons: [],
      currentLessonIndex: 0,
      currentLesson: null,
      sidebarOpen: false,
      selectedAnswer: null,
      quizCompleted: false,
      quizCorrect: false,
      componentKey: 0,
      lastUpdateTime: Date.now(),
      forceUpdateCounter: 0
    };
  },

  computed: {
    ...mapGetters('user', ['userStatus']),
    ...mapState(['user']),
    ...mapGetters(['getUser']),

    currentUser() {
      return this.getUser || this.user || {};
    },

    currentUserStatus() {
      const userStatus = this.currentUser?.subscriptionPlan || 
                        localStorage.getItem('userStatus') || 
                        localStorage.getItem('plan') || 
                        'free';
      return userStatus;
    },

    isPremiumUser() {
      const status = this.currentUserStatus;
      return status === 'pro' || status === 'start';
    },

    subscriptionClass() {
      const status = this.currentUserStatus;
      if (status === 'pro') return 'badge-pro';
      if (status === 'start') return 'badge-start';
      return 'badge-free';
    },

    subscriptionText() {
      const status = this.currentUserStatus;
      switch (status) {
        case 'pro': return 'Pro подписка';
        case 'start': return 'Start подписка';
        default: return 'Бесплатный доступ';
      }
    },

    completedLessons() {
      return this.lessons.filter(lesson => lesson.completed).length;
    },
    
    totalLessons() {
      return this.lessons.length;
    },
    
    progressPercent() {
      if (this.totalLessons === 0) return 0;
      return Math.round((this.completedLessons / this.totalLessons) * 100);
    }
  },

  mounted() {
    console.log('📱 LessonLoader: Component mounted');
    this.initializeStudyData();
  },

  methods: {
    initializeStudyData() {
      this.currentLessonIndex = 0;
      this.lessons = this.course.lessons || this.generateSampleLessons();
      this.currentLesson = this.lessons[0];
      this.sidebarOpen = false;
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
    },

    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Введение в курс",
          description: "Обзор курса и что вы изучите",
          duration: "15 мин",
          completed: true,
          locked: false,
          content: `
            <h3>Добро пожаловать в курс!</h3>
            <p>В этом курсе вы изучите основы современных технологий и получите практические навыки, которые помогут вам в карьере.</p>
            <h4>Что вас ждет:</h4>
            <ul>
              <li>Теоретические основы</li>
              <li>Практические задания</li>
              <li>Реальные проекты</li>
              <li>Сертификат о прохождении</li>
            </ul>
            <p>Желаем успехов в обучении!</p>
          `,
          resources: [],
          quiz: {
            question: "Что является основной целью данного курса?",
            options: [
              "Изучение теории без практики",
              "Получение практических навыков для карьеры",
              "Просто потратить время",
              "Получить сертификат любой ценой"
            ],
            correctAnswer: 1
          },
          objectives: [
            "Познакомиться с преподавателями",
            "Оценить структуру курса",
            "Узнать о будущих проектах"
          ],
        },
        {
          id: 2,
          title: "Основные концепции",
          description: "Изучаем ключевые понятия и термины",
          duration: "25 мин",
          completed: false,
          locked: false,
          content: `
            <h3>Основные концепции</h3>
            <p>В этом уроке мы рассмотрим ключевые понятия, которые будут использоваться на протяжении всего курса.</p>
          `,
          resources: [
            { id: 1, name: "Конспект урока.pdf", size: "2.3 MB", url: "#" },
            { id: 2, name: "Дополнительные материалы.zip", size: "5.1 MB", url: "#" }
          ],
          quiz: {
            question: "Что такое API?",
            options: [
              "Язык программирования",
              "Интерфейс для взаимодействия программ",
              "Библиотека для графики",
              "База данных"
            ],
            correctAnswer: 1
          },
          objectives: [
            "Определить основные термины",
            "Понять принципы работы",
            "Разобрать примеры"
          ],
        },
        {
          id: 3,
          title: "Практическое задание",
          description: "Применяем полученные знания на практике",
          duration: "40 мин",
          completed: false,
          locked: true,
          content: `
            <h3>Практическое задание</h3>
            <p>Теперь пришло время применить полученные знания на практике.</p>
          `,
          objectives: [
            "Выполнить первое задание",
            "Проверить свои навыки",
            "Получить обратную связь"
          ],
        }
      ];
    },

    goBackToCourses() {
      this.$emit('back-to-courses');
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    selectLesson(index) {
      if (this.lessons[index].locked) return;
      this.currentLessonIndex = index;
      this.currentLesson = this.lessons[index];
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
      if (window.innerWidth < 1024) {
        this.sidebarOpen = false;
      }
    },

    markLessonCompleted() {
      this.lessons[this.currentLessonIndex].completed = true;
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        this.lessons[this.currentLessonIndex + 1].locked = false;
      }
    },

    submitQuiz() {
      const currentQuiz = this.currentLesson.quiz;
      this.quizCorrect = this.selectedAnswer === currentQuiz.correctAnswer;
      this.quizCompleted = true;

      if (this.quizCorrect) {
        this.markLessonCompleted();
      }
    },

    nextLesson() {
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        this.selectLesson(this.currentLessonIndex + 1);
      }
    },

    previousLesson() {
      if (this.currentLessonIndex > 0) {
        this.selectLesson(this.currentLessonIndex - 1);
      }
    }
  }
};
</script>

<style scoped>
/* CSS Variables */
:root {
  --color-background: #ffffff;
  --color-foreground: #222;
  --color-card: #ffffff;
  --color-card-foreground: #222;
  --color-muted: #f3f3f5;
  --color-muted-foreground: #717182;
  --color-accent: #e9ebef;
  --color-accent-foreground: #222;
  --color-border: rgba(0, 0, 0, 0.1);
  --color-input-background: #f3f3f5;
  --color-ring: #ccc;
  --color-brand: #8b7fbf;
  --color-brand-light: #a599d4;
  --color-brand-dark: #6b5b9a;
  --color-brand-foreground: #ffffff;
  --color-success: #16a34a;
  --color-green-100: #d1fae5;
  --color-green-800: #166534;
  --brand-purple: #8B5CF6;
  --brand-purple-dark: #7C3AED;
  --brand-purple-light: #A78BFA;
  --brand-purple-muted: rgba(139, 92, 246, 0.1);
}

.dark {
  --color-background: #111827;
  --color-foreground: #f9fafb;
  --color-card: #1f2937;
  --color-card-foreground: #f9fafb;
  --color-muted: #374151;
  --color-muted-foreground: #9ca3af;
  --color-accent: #374151;
  --color-accent-foreground: #f9fafb;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-input-background: #1f2937;
  --color-ring: #555;
  --color-brand: #9b8fd9;
  --color-brand-light: #b5a9e4;
  --color-brand-dark: #7b6bbf;
  --color-brand-foreground: #ffffff;
  --color-success: #22c55e;
  --color-green-100: #14532d;
  --color-green-800: #d1fae5;
  --brand-purple: #A78BFA;
  --brand-purple-dark: #8B5CF6;
  --brand-purple-light: #C4B5FD;
  --brand-purple-muted: rgba(167, 139, 250, 0.1);
}

/* Utility Classes */
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.text-muted-foreground { color: var(--color-muted-foreground); }
.text-foreground { color: var(--color-foreground); }
.text-brand-purple { color: var(--brand-purple); }
.text-brand-purple-dark { color: var(--brand-purple-dark); }
.text-white { color: white; }
.bg-brand-purple { background-color: var(--brand-purple); }
.bg-brand-purple-dark { background-color: var(--brand-purple-dark); }
.bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.from-brand-purple { --tw-gradient-from: var(--brand-purple); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(139, 92, 246, 0)); }
.to-brand-purple-dark { --tw-gradient-to: var(--brand-purple-dark); }
.from-brand-purple-to-brand-purple-light { background: linear-gradient(to right, var(--brand-purple), var(--brand-purple-light)); }
.bg-muted { background-color: var(--color-muted); }
.rounded-lg { border-radius: 0.5rem; }
.rounded-full { border-radius: 9999px; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-3 { width: 0.75rem; }
.h-3 { height: 0.75rem; }
.w-2 { width: 0.5rem; }
.h-2 { height: 0.5rem; }
.w-1\.5 { width: 0.375rem; }
.h-1\.5 { height: 0.375rem; }
.w-full { width: 100%; }
.flex { display: flex; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-2\.5 { margin-top: 0.625rem; }
.p-4 { padding: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-1 { flex: 1 1 0%; }
.min-w-0 { min-width: 0px; }
.leading-tight { line-height: 1.25; }
.border-2 { border-width: 2px; }
.border-brand-purple { border-color: var(--brand-purple); }
.border-muted-foreground { border-color: var(--color-muted-foreground); }

/* SUBSCRIPTION STATUS BADGE STYLES */
.subscription-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subscription-badge.badge-free {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.subscription-badge.badge-start {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.subscription-badge.badge-pro {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

/* MODERN STUDY INTERFACE STYLES */
.study-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-foreground);
}

.study-header {
  background: white;
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.study-header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;
}

@media (max-width: 768px) {
  .study-header-content {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: white;
  color: var(--color-muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.back-button:hover {
  background: var(--color-muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.course-info {
  text-align: center;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--color-foreground);
}

.course-meta {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.course-category,
.course-level {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--brand-purple-muted);
  color: var(--brand-purple);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.progress-section {
  text-align: right;
}

.progress-info {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.progress-text {
  color: var(--color-muted-foreground);
}

.progress-percent {
  color: var(--brand-purple);
  font-weight: 600;
}

.progress-bar {
  height: 8px;
  background: var(--color-muted);
  border-radius: 4px;
  overflow: hidden;
  width: 200px;
  margin-left: auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-purple), var(--brand-purple-light));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.study-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-background);
}

/* MODERN SIDEBAR */
.study-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

@media (max-width: 1023px) {
  .study-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
  }

  .study-sidebar.sidebar-open {
    transform: translateX(0);
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: white;
}

.sidebar-progress {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
}

.lesson-item-modern {
  position: relative;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  border: 2px solid transparent;
}

.lesson-item-modern:hover {
  background: var(--color-muted);
  border-color: rgba(139, 92, 246, 0.2);
}

.lesson-item-modern.current {
  background: var(--brand-purple-muted);
  border-color: var(--brand-purple);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.lesson-item-modern.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.lesson-item-modern.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.mobile-only {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-only {
    display: block;
  }
}

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
}

/* MODERN CONTENT */
.study-content {
  flex: 1;
  overflow-y: auto;
  background: white;
  position: relative;
}

.sidebar-toggle.desktop-hidden {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: white;
  color: var(--color-muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle.desktop-hidden:hover {
  background: var(--color-muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.lesson-container-modern {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 1023px) {
  .lesson-container-modern {
    padding: 5rem 1.5rem 2rem;
  }
}

/* MODERN LESSON HEADER */
.lesson-header-modern {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

/* LEARNING OBJECTIVES */
.learning-objectives-modern {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--brand-purple-muted);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* CONTENT */
.lesson-content-modern {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-prose {
  line-height: 1.7;
  font-size: 1rem;
  color: var(--color-foreground);
}

.content-prose h3 {
  color: var(--color-foreground);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 1rem 0;
}

.content-prose h4 {
  color: var(--color-foreground);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem 0;
}

.content-prose p {
  margin: 0 0 1rem 0;
}

.content-prose ul,
.content-prose ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.content-prose li {
  margin: 0.5rem 0;
}

/* RESOURCES */
.resources-modern {
  background: var(--color-muted);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
}

.resources-modern h3 {
  margin: 0 0 1rem 0;
  color: var(--color-foreground);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.resource-item-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-foreground);
  transition: all 0.2s ease;
}

.resource-item-modern:hover {
  background: var(--color-muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.resource-size {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
  background: var(--color-muted);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

/* QUIZ */
.quiz-modern {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quiz-modern h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-foreground);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.question-item-modern h4 {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  color: var(--color-foreground);
  line-height: 1.5;
  padding: 1rem;
  background: var(--color-muted);
  border-radius: 8px;
}

.quiz-options-modern {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.quiz-option-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.quiz-option-modern:hover {
  background: var(--color-muted);
  border-color: var(--brand-purple);
}

.quiz-option-modern input[type="radio"] {
  margin: 0;
  width: 16px;
  height: 16px;
}

.quiz-option-modern span {
  flex: 1;
  color: var(--color-foreground);
  font-size: 0.875rem;
}

.quiz-submit-modern,
.retry-quiz-modern {
  display: block;
  margin: 1rem auto 0;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--brand-purple);
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-submit-modern:hover,
.retry-quiz-modern:hover {
  background: var(--brand-purple-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quiz-submit-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result-modern {
  text-align: center;
  padding: 1rem;
}

.quiz-feedback-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}

.quiz-feedback-modern.correct {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.quiz-feedback-modern.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* NAVIGATION */
.lesson-navigation-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  border-top: 1px solid var(--color-border);
  margin-top: 2rem;
}

@media (max-width: 640px) {
  .lesson-navigation-modern {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.nav-btn-modern {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: white;
  color: var(--color-muted-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
}

.nav-btn-modern:hover:not(:disabled) {
  background: var(--color-muted);
  border-color: var(--brand-purple);
  color: var(--brand-purple);
}

.nav-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-btn-modern {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
}

.complete-btn-modern:hover {
  background: #16a34a;
  color: white;
}

.next-btn {
  background: var(--brand-purple);
  color: white;
  border-color: var(--brand-purple);
}

.next-btn:hover:not(:disabled) {
  background: var(--brand-purple-dark);
  color: white;
}

@media (max-width: 640px) {
  .nav-btn-modern {
    width: 100%;
    justify-content: center;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .study-header-content {
    gap: 0.75rem;
  }

  .course-title {
    font-size: 1.125rem;
  }

  .progress-section {
    min-width: auto;
  }
}
</style>