<template>
  <div class="lesson-player">
    <div class="sidebar">
      <div class="course-header">
        <div class="course-icon">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13.431m0 0a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185m-1.378 2.348a2.768 2.768 0 01-1.378-2.348v-2.185m1.378 2.348A2.768 2.768 0 0013.378 17.5v-2.185"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <div>
          <h1 class="course-title">{{ course?.title || 'AI Video Mastery' }}</h1>
          <p class="course-subtitle">Закончить курс</p>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-label">Прогресс</span>
          <span class="progress-count">{{ completedLessons }}/{{ totalLessons }} Завершено</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="lessons-list">
        <div
          v-for="(lesson, index) in lessons"
          :key="lesson.id"
          @click="selectLesson(index)"
          :class="[
            'lesson-item',
            {
              'lesson-completed': lesson.completed,
              'lesson-current': currentLessonIndex === index,
              'lesson-locked': lesson.locked
            }
          ]"
        >
          <div class="lesson-status">
            <div v-if="lesson.completed" class="status-icon completed">
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div v-else-if="currentLessonIndex === index" class="status-icon current">
              <div class="current-dot"></div>
            </div>
            <div v-else class="status-icon default"></div>
          </div>

          <div class="lesson-content">
            <div class="lesson-header">
              <span class="lesson-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <span v-if="currentLessonIndex === index" class="current-badge">Current</span>
            </div>
            <h3 class="lesson-title">{{ lesson.title }}</h3>
            <div class="lesson-meta">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>{{ lesson.readingTime }}</span>
            </div>
          </div>

          <div class="lesson-arrow">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div v-if="currentLesson" class="content-wrapper">
        <div class="lesson-header-section">
          <div class="lesson-icon">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div class="lesson-title-section">
            <h1 class="main-lesson-title">{{ currentLesson.title }}</h1>
            <div class="lesson-meta-info">
              <div class="meta-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <span>{{ currentLesson.readingTime }}</span>
              </div>
              <div class="meta-item">
                <span>Урок {{ currentLessonIndex + 1 }} из {{ totalLessons }}</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="currentLesson.description" class="lesson-description">{{ currentLesson.description }}</p>

        <div v-if="currentLesson.objectives && currentLesson.objectives.length" class="objectives-section">
          <h2 class="objectives-title">Learning Objectives</h2>
          <ul class="objectives-list">
            <li v-for="(objective, index) in currentLesson.objectives" :key="index" class="objective-item">
              <div class="objective-bullet"></div>
              <span>{{ objective }}</span>
            </li>
          </ul>
        </div>

        <div class="lesson-content-section">
          <div class="content-prose" v-html="currentLesson.content"></div>
          
          <div v-if="currentLesson.resources && currentLesson.resources.length" class="resources-section">
            <h3>Lesson Resources</h3>
            <div class="resources-grid">
              <a
                v-for="resource in currentLesson.resources"
                :key="resource.id"
                :href="resource.url"
                download
                class="resource-item"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <div class="resource-details">
                  <span class="resource-name">{{ resource.name }}</span>
                  <span class="resource-size">{{ resource.size }}</span>
                </div>
              </a>
            </div>
          </div>

          <div v-if="currentLesson.quiz" class="quiz-section">
            <h3>Протестируйте свои знания</h3>
            <div class="quiz-container">
              <div v-if="!quizCompleted" class="quiz-questions">
                <div class="question-card">
                  <h4>{{ currentLesson.quiz.question }}</h4>
                  <div class="quiz-options">
                    <label
                      v-for="(option, index) in currentLesson.quiz.options"
                      :key="index"
                      class="quiz-option"
                      :class="{ 'selected': selectedAnswer === index }"
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
                    class="quiz-submit-btn"
                  >
                    Проверить ответ
                  </button>
                </div>
              </div>
              <div v-else class="quiz-result">
                <div class="quiz-feedback" :class="{ 'correct': quizCorrect, 'incorrect': !quizCorrect }">
                  <svg v-if="quizCorrect" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg v-else width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  <span>{{ quizCorrect ? 'Правильно! Отличная работа!' : 'Неправильно. Попробуйте еще раз!' }}</span>
                </div>
                <button v-if="!quizCorrect" @click="quizCompleted = false" class="retry-btn">
                  Попробовать еще раз
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="lesson-navigation">
          <button
            @click="previousLesson"
            :disabled="currentLessonIndex === 0"
            class="nav-btn prev-btn"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Предыдущий урок
          </button>
          
          <button
            v-if="currentLesson && !currentLesson.completed && (!currentLesson.quiz || (currentLesson.quiz && quizCorrect))"
            @click="markLessonCompleted"
            class="complete-btn"
          >
            Завершить урок
          </button>
          
          <button
            @click="nextLesson"
            :disabled="currentLessonIndex === lessons.length - 1 || (lessons[currentLessonIndex + 1] && lessons[currentLessonIndex + 1].locked)"
            class="nav-btn next-btn"
          >
            Следующий урок
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="9,6 15,12 9,18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      currentLessonIndex: 2, // Start at lesson 3 (index 2) to match the image
      currentLesson: null,
      sidebarOpen: false,
      selectedAnswer: null,
      quizCompleted: false,
      quizCorrect: false,
      componentKey: 0,
      isLoading: false,
      contentError: null
    };
  },

  computed: {
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

  watch: {
    course: {
      handler: 'initializeStudyData',
      immediate: true,
      deep: true
    },
    currentLessonIndex: {
      handler: 'updateCurrentLessonContent',
      immediate: true,
    }
  },

  methods: {
    async initializeStudyData() {
      console.log('🚀 Initializing study data for course:', this.course?.title);
      this.isLoading = true;
      this.contentError = null;
      
      // Start with basic lessons structure
      this.lessons = this.course?.lessons || this.generateSampleLessons();
      
      // If course has lessons, try to fetch full content
      if (this.course?.lessons && this.course.lessons.length > 0) {
        try {
          console.log('📚 Fetching full course content...');
          
          // Import API functions dynamically to avoid circular dependencies
          const { getCourseContent } = await import('@/api.js');
          
          // Fetch full course content using the API
          const contentResponse = await getCourseContent(this.course.id || this.course._id);
          
          if (contentResponse.success && contentResponse.data && contentResponse.data.length > 0) {
            console.log('✅ Course content loaded:', contentResponse.data.length, 'lessons');
            
            // Merge the fetched content with existing lessons
            this.lessons = this.lessons.map(lesson => {
              const fullContent = contentResponse.data.find(content => 
                content.id === lesson.id || 
                content._id === lesson.id || 
                content.title === lesson.title ||
                content.lessonName === lesson.title
              );
              
              if (fullContent) {
                return {
                  ...lesson,
                  ...fullContent,
                  // Preserve essential UI properties
                  completed: lesson.completed,
                  locked: lesson.locked,
                  readingTime: lesson.readingTime || fullContent.duration || this.calculateReadingTime(fullContent),
                  // Ensure we have proper content
                  content: fullContent.content || this.processStepsToContent(fullContent.steps) || lesson.content,
                  description: fullContent.description || lesson.description,
                  objectives: fullContent.objectives || lesson.objectives
                };
              }
              
              return lesson;
            });
            
            console.log('✅ Lessons merged with API content successfully');
          } else {
            console.warn('⚠️ No content received from API, using fallback');
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch course content:', error);
          this.contentError = 'Не удалось загрузить содержимое курса';
          // Continue with basic lesson data
        }
      }
      
      this.isLoading = false;
      this.updateCurrentLessonContent();
      this.resetQuizState();
    },
    
    updateCurrentLessonContent() {
      if (this.lessons[this.currentLessonIndex]) {
        this.currentLesson = { ...this.lessons[this.currentLessonIndex] };
        
        // Ensure we have content
        if (!this.currentLesson.content) {
          this.currentLesson.content = this.getLessonContent(this.currentLesson.id);
        }
        
        // Ensure we have description
        if (!this.currentLesson.description) {
          const fallbackDescription = this.getLessonDescription(this.currentLesson.id);
          if (fallbackDescription) {
            this.currentLesson.description = fallbackDescription;
          }
        }
        
        // Ensure we have objectives
        if (!this.currentLesson.objectives || this.currentLesson.objectives.length === 0) {
          const fallbackObjectives = this.getLessonObjectives(this.currentLesson.id);
          if (fallbackObjectives && fallbackObjectives.length > 0) {
            this.currentLesson.objectives = fallbackObjectives;
          }
        }
        
        // Process steps content if available and no content exists
        if (!this.currentLesson.content && this.currentLesson.steps && this.currentLesson.steps.length > 0) {
          this.currentLesson.content = this.processStepsToContent(this.currentLesson.steps);
        }
        
        console.log('📚 Current lesson updated:', this.currentLesson.title);
      } else {
        this.currentLesson = null;
      }
    },
    
    // Calculate reading time based on content length
    calculateReadingTime(lesson) {
      if (!lesson) return '5 мин чтения';
      
      let wordCount = 0;
      
      // Count words in content
      if (lesson.content && typeof lesson.content === 'string') {
        wordCount += lesson.content.split(/\s+/).length;
      }
      
      // Count words in steps
      if (lesson.steps && Array.isArray(lesson.steps)) {
        lesson.steps.forEach(step => {
          if (step.data?.content) {
            wordCount += step.data.content.split(/\s+/).length;
          }
          if (step.data?.instructions) {
            wordCount += step.data.instructions.split(/\s+/).length;
          }
        });
      }
      
      // Average reading speed: 200 words per minute
      const minutes = Math.max(Math.ceil(wordCount / 200), 5);
      return `${minutes} мин чтения`;
    },
    
    // Convert lesson steps to readable content
    processStepsToContent(steps) {
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return '';
      }
      
      let content = '';
      
      steps.forEach((step, index) => {
        if (!step || !step.type) return;
        
        switch (step.type) {
          case 'explanation':
          case 'reading':
            if (step.data?.content) {
              content += `\n\n## ${step.title || `Раздел ${index + 1}`}\n\n`;
              content += step.data.content;
            }
            break;
            
          case 'example':
            if (step.data?.content) {
              content += `\n\n### Пример: ${step.title || `Пример ${index + 1}`}\n\n`;
              content += step.data.content;
            }
            break;
            
          case 'image':
            if (step.data?.description) {
              content += `\n\n### ${step.title || `Изображение ${index + 1}`}\n\n`;
              content += step.data.description;
              
              if (step.data.images && step.data.images.length > 0) {
                content += '\n\n*Включены изображения для визуального представления материала.*\n';
              }
            }
            break;
            
          case 'practice':
            if (step.data?.instructions) {
              content += `\n\n### Практическое задание: ${step.title || `Задание ${index + 1}`}\n\n`;
              content += step.data.instructions;
            }
            break;
            
          case 'quiz':
            if (step.data?.question) {
              content += `\n\n### Контрольный вопрос: ${step.title || `Вопрос ${index + 1}`}\n\n`;
              content += step.data.question;
              
              if (step.data.options && step.data.options.length > 0) {
                content += '\n\n**Варианты ответов:**\n';
                step.data.options.forEach((option, optIndex) => {
                  content += `${optIndex + 1}. ${option}\n`;
                });
              }
            }
            break;
            
          default:
            // Handle unknown step types
            if (step.data?.content || step.content) {
              content += `\n\n### ${step.title || `Раздел ${index + 1}`}\n\n`;
              content += step.data?.content || step.content;
            }
        }
      });
      
      return content.trim() || this.getLessonContent(1); // Fallback to default content
    },

    getLessonContent(lessonId) {
      const contentMap = {
        1: `# Введение в создание AI-видео

Добро пожаловать в мир создания видео с помощью искусственного интеллекта! В этом уроке мы рассмотрим основы и возможности современных AI-инструментов для создания видеоконтента.

## Что такое AI-видео?

AI-видео — это видеоконтент, созданный с помощью алгоритмов машинного обучения и нейронных сетей. Эти технологии позволяют:

• **Генерировать видео из текста** — создавать видеоролики на основе текстовых описаний
• **Анимировать статичные изображения** — превращать фотографии в движущиеся сцены
• **Создавать реалистичных персонажей** — генерировать людей и объекты, которых не существует
• **Автоматизировать монтаж** — ускорять процесс редактирования и пост-продакшена

## Преимущества AI-видео

### Скорость производства
Создание видео, которое раньше занимало дни или недели, теперь можно завершить за несколько часов.

### Снижение затрат
Не нужны дорогое оборудование, актеры или съемочная группа для создания качественного контента.

### Творческие возможности
AI открывает новые горизонты для воплощения самых смелых идей, которые сложно или невозможно снять традиционными методами.

## Области применения

AI-видео находит применение в различных сферах:

- **Маркетинг и реклама** — создание рекламных роликов и промо-материалов
- **Образование** — разработка обучающих видео и интерактивного контента
- **Развлечения** — производство фильмов, анимации и игрового контента
- **Социальные сети** — создание вирусного и персонализированного контента

В следующих уроках мы подробно изучим каждую из популярных платформ и научимся создавать профессиональные AI-видео.`,

        2: `# Понимание платформ AI-видео

Существует множество платформ для создания AI-видео, каждая из которых имеет свои особенности и преимущества. В этом уроке мы рассмотрим основные типы платформ и их возможности.

## Типы AI-видео платформ

### 1. Текст-в-видео платформы
Эти платформы позволяют создавать видео из текстовых описаний:

**Примеры:**
- Runway ML
- Synthesia
- Pictory
- Lumen5

**Особенности:**
- Простой ввод текста
- Автоматический выбор визуалов
- Быстрое создание контента

### 2. Изображение-в-видео платформы
Превращают статичные изображения в движущиеся видео:

**Примеры:**
- Stable Video Diffusion
- Pika Labs
- Runway Gen-2

**Особенности:**
- Анимация фотографий
- Контроль движения
- Высокое качество вывода

### 3. Платформы для создания персонажей
Специализируются на создании виртуальных ведущих и персонажей:

**Примеры:**
- Synthesia
- HeyGen
- D-ID

**Особенности:**
- Реалистичные аватары
- Синхронизация губ
- Многоязычная поддержка

## Критерии выбора платформы

При выборе платформы учитывайте:

### Качество вывода
- Разрешение видео
- Реалистичность изображения
- Плавность анимации

### Простота использования
- Интуитивный интерфейс
- Скорость обучения
- Доступность функций

### Стоимость
- Бесплатные возможности
- Ценовые планы
- Соотношение цена/качество

### Функциональность
- Доступные стили
- Возможности кастомизации
- Интеграция с другими инструментами

В следующих уроках мы подробно изучим работу с каждой из ведущих платформ.`,

        3: `# Runway ML: Начало работы

Runway ML находится в авангарде создания видео с помощью ИИ, предлагая передовые инструменты, которые демократизируют видеопроизводство. В этом уроке мы изучим возможности платформы и получим практический опыт создания ваших первых AI-видео.

## Что такое Runway ML?

Runway ML — это исследовательская компания в области ИИ, которая разрабатывает креативные инструменты нового поколения. Их платформа предлагает различные AI-модели для:

• **Генерации видео из текста** — создание видео на основе письменных описаний
• **Преобразования изображений в видео** — анимация статичных изображений в динамичные видео
• **Редактирования и улучшения видео** — модификация существующего видеоконтента с помощью ИИ
• **Переноса стиля и эффектов** — применение художественных стилей и визуальных эффектов

Платформа произвела революцию в том, как создатели контента, кинематографисты и маркетологи подходят к видеопроизводству, сделав создание профессионального качества доступным для всех.

## Обзор платформы

При первом доступе к Runway ML вы заметите чистый, интуитивно понятный интерфейс, разработанный как для начинающих, так и для профессионалов. Главная панель включает несколько ключевых областей:

### 1. Управление проектами

Система управления проектами позволяет:
- **Создавать и организовывать** ваши видеопроекты в специальных папках
- **Получать доступ к недавним работам** и шаблонам для быстрого старта проектов
- **Сотрудничать с членами команды** через общие рабочие пространства
- **Контролировать версии** для отслеживания различных итераций ваших проектов

### 2. Выбор модели

Runway предлагает несколько мощных AI-моделей, каждая предназначена для конкретных случаев использования:

**Gen-2: Флагманская модель текст-в-видео**
- Основной инструмент для создания видео из текстовых подсказок
- Поддерживает различные стили от фотореалистичных до художественных
- Способна генерировать 4-секундные клипы высокого качества
- Лучше всего для: создания оригинального контента, визуализации концепций

**Gen-1: Преобразование видео-в-видео**
- Преобразует существующие видео с использованием текстовых подсказок
- Сохраняет оригинальную структуру видео, изменяя стиль/содержание
- Отлично подходит для стилистических преобразований
- Лучше всего для: переноса стиля, изменения настроения, художественных интерпретаций

**Инпейнтинг: Селективное редактирование видео**
- Удаление или замена конкретных элементов в видео
- Бесшовное заполнение выбранных областей AI-генерированным контентом
- Точный контроль над тем, что модифицируется
- Лучше всего для: удаления объектов, изменения фона, очистки

**Motion Brush: Контроль направленного движения**
- Рисование направлений движения прямо на вашем видео
- Контроль того, как различные части сцены движутся
- Создание сложных анимаций простыми мазками кисти
- Лучше всего для: добавления конкретных движений, контроля анимации`,

        4: `# Основы преобразования текста в видео

Преобразование текста в видео — это революционная технология, которая позволяет создавать видеоконтент просто описывая то, что вы хотите увидеть. В этом уроке мы изучим фундаментальные принципы и техники этого процесса.

## Как работает текст-в-видео

Процесс преобразования текста в видео основан на сложных нейронных сетях, которые:

### 1. Анализ текста
- Разбор естественного языка
- Выделение ключевых объектов и действий
- Понимание контекста и настроения

### 2. Визуальная интерпретация
- Создание ментальной модели сцены
- Определение композиции и перспективы
- Планирование движения и динамики

### 3. Генерация видео
- Покадровое создание изображений
- Обеспечение плавности переходов
- Добавление реалистичных деталей

## Ключевые принципы успешных промптов

### Конкретность превыше всего
Чем более детально вы описываете желаемую сцену, тем лучше результат:

**Хорошо:** "Красный спортивный автомобиль едет по извилистой горной дороге на закате"
**Плохо:** "Машина едет"

### Структура промпта
Эффективный промпт должен включать:
- **Объект** — что является главным в сцене
- **Действие** — что происходит
- **Обстановка** — где происходит действие
- **Стиль** — как должно выглядеть видео
- **Камера** — с какого ракурса снимать

### Управление стилем
Используйте модификаторы для контроля визуального стиля:
- "Кинематографический" — для пленочного вида
- "Документальный" — для реалистичного стиля
- "Художественный" — для стилизованного изображения

## Технические аспекты

### Длительность видео
- **1-2 секунды** — для тестирования промптов
- **4 секунды** — стандартная длина для большинства платформ
- **8+ секунд** — доступно на премиум-планах

### Соотношение сторон
- **16:9** — стандартный формат для YouTube и ТВ
- **9:16** — вертикальный формат для социальных сетей
- **1:1** — квадратный формат для Instagram

### Качество и разрешение
- **720p** — базовое качество
- **1080p** — HD качество (рекомендуется)
- **4K** — максимальное качество (где доступно)

## Распространенные ошибки и их избежание

### Слишком сложные сцены
Избегайте описания слишком многих элементов в одном промпте. Лучше создать несколько простых сцен.

### Неясные инструкции
Абстрактные понятия плохо переводятся в визуальные образы. Используйте конкретные описания.

### Игнорирование физики
ИИ лучше работает с реалистичными сценариями. Фантастические элементы требуют более детального описания.

## Практические упражнения

1. **Создайте простую сцену** — опишите один объект в действии
2. **Добавьте контекст** — включите обстановку и освещение
3. **Экспериментируйте со стилями** — попробуйте разные визуальные модификаторы
4. **Работайте с движением** — опишите конкретные типы движения камеры

В следующем уроке мы углубимся в продвинутые техники промпт-инжиниринга для создания более сложного и качественного контента.`
      };
      
      return contentMap[lessonId] || `# Урок ${lessonId}

Содержимое этого урока загружается. Пожалуйста, подождите или свяжитесь с поддержкой, если проблема не исчезнет.

## Основная информация

Этот урок является частью курса по созданию AI-видео. Здесь вы изучите важные концепции и практические навыки.

## Что вы изучите

В этом уроке рассматриваются ключевые аспекты работы с современными AI-инструментами для создания видеоконтента.

## Практическое применение

Полученные знания помогут вам создавать профессиональный видеоконтент с использованием искусственного интеллекта.`;
    },
    
    getLessonDescription(lessonId) {
      const descriptionMap = {
        1: "Изучите основы создания видео с помощью искусственного интеллекта и познакомьтесь с возможностями современных AI-платформ.",
        2: "Познакомьтесь с различными типами AI-видео платформ и научитесь выбирать подходящий инструмент для ваших задач.",
        3: "Изучите основы Runway ML, одной из самых мощных платформ для создания видео с искусственным интеллектом, доступных на сегодняшний день.",
        4: "Освойте фундаментальные принципы преобразования текстовых описаний в высококачественные видеоролики."
      };
      return descriptionMap[lessonId] || 'Изучите важные концепции и практические навыки работы с AI-инструментами для создания видеоконтента.';
    },
    
    getLessonObjectives(lessonId) {
      const objectivesMap = {
        1: [
          "Понять основные концепции AI-видео",
          "Изучить преимущества использования ИИ в видеопроизводстве",
          "Познакомиться с областями применения AI-видео",
          "Подготовиться к работе с AI-инструментами"
        ],
        2: [
          "Изучить различные типы AI-видео платформ",
          "Понять критерии выбора подходящей платформы",
          "Сравнить возможности популярных инструментов",
          "Определить оптимальный workflow для ваших задач"
        ],
        3: [
          "Понять интерфейс и навигацию Runway ML",
          "Изучить базовое создание видео из текста",
          "Исследовать различные доступные видеомодели",
          "Попрактиковаться в создании своего первого видео с ИИ"
        ],
        4: [
          "Освоить принципы написания эффективных промптов",
          "Понять технические аспекты генерации видео",
          "Изучить управление стилем и качеством",
          "Избежать распространенных ошибок в промптах"
        ]
      };
      return objectivesMap[lessonId] || [
        "Изучить ключевые концепции урока",
        "Применить полученные знания на практике",
        "Развить навыки работы с AI-инструментами",
        "Подготовиться к следующему этапу обучения"
      ];
    },

    generateSampleLessons() {
      return [
        {
          id: 1,
          title: "Введение в создание AI-видео",
          readingTime: "8 мин чтения",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 2,
          title: "Понимание платформ AI-видео",
          readingTime: "12 мин чтения",
          completed: true,
          locked: false,
          type: "text"
        },
        {
          id: 3,
          title: "Runway ML: Начало работы",
          readingTime: "10 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 4,
          title: "Основы преобразования текста в видео",
          readingTime: "15 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 5,
          title: "Промпт-инжиниринг для видео",
          readingTime: "18 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 6,
          title: "Продвинутые техники Runway",
          readingTime: "20 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 7,
          title: "Midjourney для видеоактивов",
          readingTime: "16 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 8,
          title: "Стабильное видео-распространение",
          readingTime: "19 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 9,
          title: "Редактирование видео с помощью инструментов ИИ",
          readingTime: "22 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 10,
          title: "Комбинирование нескольких платформ",
          readingTime: "25 мин чтения",
          completed: false,
          locked: false,
          type: "text"
        },
        {
          id: 11,
          title: "Создание согласованных персонажей",
          readingTime: "21 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 12,
          title: "Рассказывание историй с AI-видео",
          readingTime: "23 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 13,
          title: "Коммерческие приложения",
          readingTime: "20 мин чтения",
          completed: false,
          locked: true,
          type: "text"
        },
        {
          id: 14,
          title: "Мастер-класс по финальному проекту",
          readingTime: "35 мин чтения",
          completed: false,
          locked: true,
          type: "workshop"
        }
      ];
    },

    resetQuizState() {
      this.selectedAnswer = null;
      this.quizCompleted = false;
      this.quizCorrect = false;
    },

    goBackToCourses() {
      this.$emit('back-to-courses');
    },

    selectLesson(index) {
      if (this.lessons[index] && !this.lessons[index].locked) {
        this.currentLessonIndex = index;
        this.resetQuizState();
      }
    },

    markLessonCompleted() {
      if (this.currentLesson) {
        this.currentLesson.completed = true;
        const lessonInArray = this.lessons.find(l => l.id === this.currentLesson.id);
        if (lessonInArray) {
          lessonInArray.completed = true;
        }

        // Unlock next lesson
        if (this.currentLessonIndex + 1 < this.lessons.length) {
          this.$set(this.lessons[this.currentLessonIndex + 1], 'locked', false);
        }

        // Save progress to backend
        this.saveProgressToBackend();
      }
    },

    async saveProgressToBackend() {
      try {
        // Import API function dynamically to avoid circular dependencies
        const { submitProgress } = await import('@/api.js');
        const { auth } = await import('@/firebase');
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('⚠️ No authenticated user for progress saving');
          return;
        }

        const progressData = {
          lessonId: this.currentLesson.id,
          topicId: this.course.id || this.course._id,
          completed: true,
          progressPercent: 100,
          completedSteps: ['content-read'],
          duration: this.estimateLessonDuration(),
          stars: 3,
          points: 10,
          metadata: {
            lessonTitle: this.currentLesson.title,
            courseTitle: this.course.title,
            completedAt: new Date().toISOString()
          }
        };

        const result = await submitProgress(currentUser.uid, progressData);
        
        if (result.success) {
          console.log('✅ Progress saved successfully');
        } else {
          console.warn('⚠️ Progress save returned false:', result);
        }
      } catch (error) {
        console.warn('⚠️ Failed to save progress:', error);
        // Don't show error to user as this is background operation
      }
    },

    estimateLessonDuration() {
      // Estimate lesson duration based on content length and reading time
      const readingTime = this.currentLesson?.readingTime || '10 мин чтения';
      const minutes = parseInt(readingTime.match(/\d+/)?.[0] || '10');
      return minutes * 60; // Convert to seconds
    },

    submitQuiz() {
      if (!this.currentLesson || !this.currentLesson.quiz) return;
      
      const currentQuiz = this.currentLesson.quiz;
      this.quizCorrect = parseInt(this.selectedAnswer) === currentQuiz.correctAnswer;
      this.quizCompleted = true;

      if (this.quizCorrect) {
        // Auto-complete lesson if quiz is passed
        setTimeout(() => {
          this.markLessonCompleted();
        }, 1500); // Give user time to see the success message
      }
    },

    nextLesson() {
      if (this.currentLessonIndex + 1 < this.lessons.length) {
        const nextLessonCandidate = this.lessons[this.currentLessonIndex + 1];
        if (!nextLessonCandidate.locked) {
          this.selectLesson(this.currentLessonIndex + 1);
        } else {
          // Optional: Show message about locked lesson
          console.info('ℹ️ Next lesson is locked');
        }
      }
    },

    previousLesson() {
      if (this.currentLessonIndex > 0) {
        this.selectLesson(this.currentLessonIndex - 1);
      }
    },

    // Utility method for error handling
    handleError(error, context = 'Operation') {
      console.error(`❌ ${context} failed:`, error);
      this.contentError = `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
    },

    // Method to retry loading content
    async retryLoadContent() {
      this.contentError = null;
      await this.initializeStudyData();
    },

    // Method to check if lesson has quiz
    hasQuiz(lesson) {
      return lesson && lesson.quiz && lesson.quiz.question && lesson.quiz.options && lesson.quiz.options.length > 0;
    },

    // Method to check if lesson can be completed
    canCompleteLesson(lesson) {
      if (!lesson) return false;
      
      // If lesson has quiz, it must be completed correctly
      if (this.hasQuiz(lesson)) {
        return this.quizCompleted && this.quizCorrect;
      }
      
      // If no quiz, lesson can be completed directly
      return true;
    },

    // Method to get lesson status text
    getLessonStatusText(lesson) {
      if (!lesson) return '';
      
      if (lesson.completed) return 'Завершен';
      if (lesson.locked) return 'Заблокирован';
      if (this.currentLessonIndex === this.lessons.indexOf(lesson)) return 'Текущий';
      return 'Доступен';
    },

    // Method to format duration
    formatDuration(seconds) {
      if (!seconds || seconds < 60) return `${seconds || 0} сек`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes} мин ${remainingSeconds} сек` : `${minutes} мин`;
    }
  },

  // Lifecycle hooks for cleanup
  beforeDestroy() {
    // Clean up any intervals or timeouts if needed
    this.resetQuizState();
  },

  // Error handling
  errorCaptured(err, instance, info) {
    console.error('❌ Component error captured:', err, info);
    this.handleError(err, 'Component operation');
    return false; // Prevent error from propagating
  }
};
</script>

<style scoped>
/* Reset and Base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.lesson-player {
  height: 100vh;
  background: #ffffff;
  display: flex;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Sidebar Styles */
.sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.course-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.course-icon svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.course-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.course-subtitle {
  font-size: 14px;
  color: #717182;
  margin: 0;
}

.progress-section {
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #717182;
}

.progress-count {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ececf0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B5CF6, #A78BFA);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  border: 2px solid transparent;
}

.lesson-item:hover:not(.lesson-locked) {
  background: rgba(139, 92, 246, 0.05);
  border-color: rgba(139, 92, 246, 0.2);
}

.lesson-item.lesson-current {
  background: rgba(139, 92, 246, 0.1);
  border-color: #8B5CF6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.lesson-item.lesson-locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.lesson-status {
  flex-shrink: 0;
}

.status-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.status-icon.completed {
  background: #8B5CF6;
  border-radius: 50%;
  color: white;
}

.status-icon.current {
  border: 2px solid #8B5CF6;
  border-radius: 50%;
}

.current-dot {
  width: 8px;
  height: 8px;
  background: #8B5CF6;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon.default {
  border: 2px solid #717182;
  border-radius: 50%;
}

.lesson-content {
  flex: 1;
  min-width: 0;
}

.lesson-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.lesson-number {
  font-size: 12px;
  font-weight: 500;
  color: #717182;
}

.current-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #8B5CF6;
  color: white;
  border-radius: 12px;
  font-weight: 500;
}

.lesson-title {
  font-size: 14px;
  font-weight: 400;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.lesson-current .lesson-title {
  color: #8B5CF6;
  font-weight: 500;
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #717182;
}

.lesson-meta svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.lesson-arrow {
  flex-shrink: 0;
  color: #717182;
}

.lesson-arrow svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.lesson-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.lesson-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.lesson-icon svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.lesson-title-section {
  flex: 1;
}

.main-lesson-title {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.lesson-meta-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #717182;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.lesson-description {
  font-size: 18px;
  color: #717182;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.objectives-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.objectives-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #8B5CF6;
}

.objectives-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.objective-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.objective-bullet {
  width: 6px;
  height: 6px;
  background: #8B5CF6;
  border-radius: 50%;
  margin-top: 10px;
  flex-shrink: 0;
}

.lesson-content-section {
  margin-bottom: 32px;
}

.content-prose {
  line-height: 1.7;
  color: #1a1a1a;
  font-size: 16px;
}

.content-prose h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 32px 0 16px 0;
  color: #1a1a1a;
}

.content-prose h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 28px 0 12px 0;
  color: #1a1a1a;
}

.content-prose h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 8px 0;
  color: #1a1a1a;
}

.content-prose h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 8px 0;
  color: #1a1a1a;
}

.content-prose p {
  margin-bottom: 16px;
  line-height: 1.7;
}

.content-prose ul {
  margin: 16px 0;
  padding-left: 20px;
}

.content-prose li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.content-prose strong {
  font-weight: 600;
}

.resources-section {
  margin-top: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.resources-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #1a1a1a;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  text-decoration: none;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.resource-item:hover {
  background: #f8f9fa;
  border-color: #8B5CF6;
  color: #8B5CF6;
}

.resource-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.resource-details {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  font-size: 14px;
  display: block;
  margin-bottom: 2px;
}

.resource-size {
  font-size: 12px;
  color: #717182;
}

.quiz-section {
  margin-top: 32px;
  padding: 24px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.quiz-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #1a1a1a;
}

.question-card h4 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  line-height: 1.5;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.quiz-option:hover {
  background: #f8f9fa;
  border-color: #8B5CF6;
}

.quiz-option.selected {
  border-color: #8B5CF6;
  background: rgba(139, 92, 246, 0.05);
}

.quiz-option input[type="radio"] {
  margin: 0;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.quiz-option span {
  flex: 1;
  font-size: 14px;
  color: #1a1a1a;
}

.quiz-submit-btn {
  display: block;
  margin: 0 auto;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #8B5CF6;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quiz-submit-btn:hover:not(:disabled) {
  background: #7C3AED;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.quiz-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.quiz-result {
  text-align: center;
}

.quiz-feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.quiz-feedback svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.quiz-feedback.correct {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.quiz-feedback.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.retry-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #8B5CF6;
  color: white;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #7C3AED;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.lesson-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 32px 0 0 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: 32px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
  color: #717182;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
}

.nav-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.nav-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #8B5CF6;
  color: #8B5CF6;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.complete-btn {
  background: #22c55e;
  color: white;
  border-color: #22c55e;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: #16a34a;
  color: white;
}

.next-btn {
  background: #8B5CF6;
  color: white;
  border-color: #8B5CF6;
}

.next-btn:hover:not(:disabled) {
  background: #7C3AED;
  color: white;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .lesson-player {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    max-height: 40vh;
    order: 2;
  }
  
  .main-content {
    order: 1;
    flex: 1;
  }
  
  .content-wrapper {
    padding: 16px;
  }
  
  .lesson-navigation {
    flex-direction: column;
    gap: 12px;
  }
  
  .nav-btn, .complete-btn {
    width: 100%;
    justify-content: center;
  }
  
  .lessons-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .lesson-header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .lesson-meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .course-header {
    padding: 16px;
  }
  
  .progress-section {
    padding: 16px;
  }
  
  .lessons-list {
    padding: 8px;
  }
  
  .lesson-item {
    padding: 12px;
  }
  
  .content-wrapper {
    padding: 12px;
  }
  
  .main-lesson-title {
    font-size: 20px;
  }
  
  .lesson-description {
    font-size: 16px;
  }
  
  .objectives-section,
  .resources-section,
  .quiz-section {
    padding: 16px;
  }
  
  .resources-grid {
    grid-template-columns: 1fr;
  }
}

/* Scrollbar Styling */
.lessons-list::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 6px;
}

.lessons-list::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: #8B5CF6;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb:hover,
.main-content::-webkit-scrollbar-thumb:hover {
  background: #7C3AED;
}

/* Focus States for Accessibility */
.nav-btn:focus,
.quiz-submit-btn:focus,
.retry-btn:focus,
.complete-btn:focus {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}

.lesson-item:focus {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}

.quiz-option:focus-within {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
}
</style>