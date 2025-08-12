<template>
    <div class="updated-courses-container">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">Актуальные курсы</span>
            </h1>
            <p class="hero-subtitle">
              Изучайте новейшие технологии и инструменты
            </p>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">{{ filteredCourses.length }}</span>
                <span class="stat-label">Курсов</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ availableCategories.length }}</span>
                <span class="stat-label">Категорий</span>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Filters Section -->
      <section class="filters-section">
        <div class="container">
          <div class="filters-header">
            <h2>Найди свой курс</h2>
            <button 
              v-if="hasActiveFilters" 
              class="clear-filters-btn" 
              @click="clearFilters"
              type="button"
            >
              Очистить фильтры
            </button>
          </div>
          
          <div class="filters-grid">
            <!-- Category Filter -->
            <div class="filter-group">
              <label class="filter-label">Категория</label>
              <div class="filter-options">
                <button 
                  v-for="category in availableCategories" 
                  :key="category"
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedCategory === category }"
                  @click="setCategory(category)"
                >
                  {{ getCategoryIcon(category) }} {{ category }}
                </button>
              </div>
            </div>
  
            <!-- Difficulty Filter -->
            <div class="filter-group">
              <label class="filter-label">Уровень сложности</label>
              <div class="filter-options">
                <button 
                  v-for="level in availableDifficulties" 
                  :key="level"
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedDifficulty === level }"
                  @click="setDifficulty(level)"
                >
                  {{ getDifficultyIcon(level) }} {{ level }}
                </button>
              </div>
            </div>
  
            <!-- Search -->
            <div class="filter-group search-group">
              <label class="filter-label">Поиск</label>
              <div class="search-input-container">
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Поиск по названию..."
                  class="search-input"
                />
                <div class="search-icon">🔍</div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Loading State -->
      <section v-if="loading" class="loading-section">
        <div class="container">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Загрузка курсов...</p>
          </div>
        </div>
      </section>
  
      <!-- Error State -->
      <section v-else-if="error" class="error-section">
        <div class="container">
          <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Не удалось загрузить курсы</h3>
            <p>{{ error }}</p>
            <button class="retry-btn" @click="fetchCourses" type="button">
              Попробовать снова
            </button>
          </div>
        </div>
      </section>
  
      <!-- Course Detail View -->
      <section v-else-if="selectedCourse && !showLessonView" class="course-detail-section">
        <div class="container">
          <div class="course-detail">
            <!-- Back Button -->
            <button class="back-btn" @click="selectedCourse = null" type="button">
              ← Назад к курсам
            </button>
  
            <div class="course-detail-content">
              <!-- Course Header -->
              <div class="course-header">
                <div class="course-image">
                  <img 
                    :src="getValidImageUrl(selectedCourse.thumbnail)" 
                    :alt="selectedCourse.title"
                    @error="handleImageError"
                  />
                  <div v-if="selectedCourse.isPremium" class="premium-badge">PRO</div>
                </div>
                
                <div class="course-info">
                  <h1>{{ selectedCourse.title }}</h1>
                  <p class="course-description">{{ selectedCourse.description }}</p>
                  
                  <div class="course-meta">
                    <span class="meta-item">
                      <span class="meta-label">Категория:</span>
                      {{ selectedCourse.category }}
                    </span>
                    <span class="meta-item">
                      <span class="meta-label">Сложность:</span>
                      {{ getDifficultyIcon(selectedCourse.difficulty) }} {{ selectedCourse.difficulty }}
                    </span>
                    <span class="meta-item">
                      <span class="meta-label">Длительность:</span>
                      {{ selectedCourse.duration }}
                    </span>
                  </div>
  
                  <div class="course-instructor" v-if="selectedCourse.instructor">
                    <img 
                      :src="getValidImageUrl(selectedCourse.instructor.avatar)" 
                      :alt="selectedCourse.instructor.name" 
                      class="instructor-avatar"
                    />
                    <div class="instructor-info">
                      <h4>{{ selectedCourse.instructor.name }}</h4>
                      <p v-if="selectedCourse.instructor.bio">{{ selectedCourse.instructor.bio }}</p>
                    </div>
                  </div>
  
                  <div class="course-actions">
                    <button 
                      class="action-btn primary"
                      @click="startCourse(selectedCourse)"
                      type="button"
                    >
                      <span v-if="selectedCourse.isPremium && !hasAccessToCourse(selectedCourse)">
                        🔒 Требуется PRO
                      </span>
                      <span v-else>Начать обучение</span>
                    </button>
                    <button 
                      class="action-btn secondary" 
                      @click="toggleBookmark(selectedCourse)"
                      type="button"
                    >
                      {{ selectedCourse.isBookmarked ? '❤️ В избранном' : '🤍 В избранное' }}
                    </button>
                  </div>
                </div>
              </div>
  
              <!-- Course Content -->
              <div v-if="courseContent && courseContent.length > 0" class="course-content">
                <h3>Содержание курса</h3>
                <div class="lessons-list">
                  <div 
                    v-for="(lesson, index) in courseContent" 
                    :key="lesson.id || index"
                    class="lesson-item"
                    @click="openLesson(lesson, index)"
                  >
                    <div class="lesson-number">{{ index + 1 }}</div>
                    <div class="lesson-info">
                      <h4>{{ lesson.title || lesson.lessonName || `Урок ${index + 1}` }}</h4>
                      <p v-if="lesson.description">{{ lesson.description }}</p>
                      <div class="lesson-meta">
                        <span v-if="lesson.duration">⏱️ {{ lesson.duration }}</span>
                        <span v-if="lesson.type">📝 {{ lesson.type }}</span>
                      </div>
                    </div>
                    <div class="lesson-arrow">→</div>
                  </div>
                </div>
              </div>
  
              <!-- Tools and Technologies -->
              <div v-if="selectedCourse.tools && selectedCourse.tools.length" class="course-tools">
                <h3>Инструменты и технологии</h3>
                <div class="tools-grid">
                  <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-tag">
                    {{ tool }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Lesson View -->
      <section v-else-if="showLessonView" class="lesson-view-section">
        <div class="container">
          <div class="lesson-view">
            <!-- Lesson Header -->
            <div class="lesson-header">
              <button class="back-btn" @click="closeLessonView" type="button">
                ← Назад к курсу
              </button>
              <div class="lesson-progress">
                <span>Урок {{ currentLessonIndex + 1 }} из {{ courseContent.length }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: ((currentLessonIndex + 1) / courseContent.length) * 100 + '%' }"
                  ></div>
                </div>
              </div>
            </div>
  
            <div v-if="currentLesson" class="lesson-content">
              <h1>{{ currentLesson.title || currentLesson.lessonName }}</h1>
              
              <div v-if="currentLesson.description" class="lesson-description">
                <p>{{ currentLesson.description }}</p>
              </div>
  
              <!-- Lesson Steps -->
              <div v-if="currentLesson.steps && currentLesson.steps.length" class="lesson-steps">
                <div 
                  v-for="(step, stepIndex) in currentLesson.steps" 
                  :key="stepIndex"
                  class="lesson-step"
                >
                  <div class="step-header">
                    <span class="step-number">{{ stepIndex + 1 }}</span>
                    <h3>{{ getStepTitle(step) }}</h3>
                  </div>
  
                  <div class="step-content">
                    <!-- Text Content -->
                    <div v-if="step.type === 'explanation' || step.type === 'example'" class="step-text">
                      <p>{{ step.data?.content || step.content }}</p>
                    </div>
  
                    <!-- Video Content -->
                    <div v-else-if="step.type === 'video'" class="step-video">
                      <div class="video-container">
                        <video 
                          v-if="isDirectVideoUrl(step.data?.url || step.videoUrl)"
                          controls 
                          class="lesson-video"
                          :poster="step.data?.thumbnail"
                        >
                          <source :src="step.data?.url || step.videoUrl" type="video/mp4">
                          <source :src="step.data?.url || step.videoUrl" type="video/webm">
                          Ваш браузер не поддерживает видео.
                        </video>
                        <div v-else class="video-embed">
                          <iframe 
                            :src="getEmbedUrl(step.data?.url || step.videoUrl)"
                            frameborder="0"
                            allowfullscreen
                            class="lesson-video"
                          ></iframe>
                        </div>
                      </div>
                      <p v-if="step.data?.description || step.description" class="video-description">
                        {{ step.data?.description || step.description }}
                      </p>
                    </div>
  
                    <!-- Practice Content -->
                    <div v-else-if="step.type === 'practice'" class="step-practice">
                      <div class="practice-instructions">
                        <h4>Практическое задание</h4>
                        <p>{{ step.data?.instructions || step.instructions }}</p>
                      </div>
                    </div>
  
                    <!-- Quiz Content -->
                    <div v-else-if="step.type === 'quiz'" class="step-quiz">
                      <div class="quiz-question">
                        <h4>{{ step.data?.question || step.question }}</h4>
                        <div v-if="step.data?.options || step.options" class="quiz-options">
                          <button 
                            v-for="(option, optIndex) in (step.data?.options || step.options)" 
                            :key="optIndex"
                            class="quiz-option"
                            @click="selectQuizOption(stepIndex, optIndex)"
                          >
                            {{ option.text || option }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- Lesson Navigation -->
              <div class="lesson-navigation">
                <button 
                  v-if="currentLessonIndex > 0"
                  class="nav-btn prev"
                  @click="previousLesson"
                  type="button"
                >
                  ← Предыдущий урок
                </button>
                <button 
                  v-if="currentLessonIndex < courseContent.length - 1"
                  class="nav-btn next"
                  @click="nextLesson"
                  type="button"
                >
                  Следующий урок →
                </button>
                <button 
                  v-else
                  class="nav-btn complete"
                  @click="completeCourse"
                  type="button"
                >
                  Завершить курс 🎉
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Courses Grid -->
      <section v-else class="courses-section">
        <div class="container">
          <div class="section-header">
            <h2>{{ getSectionTitle() }}</h2>
            <div class="sort-options">
              <select v-model="sortBy" class="sort-select">
                <option value="newest">Сначала новые</option>
                <option value="popular">По популярности</option>
                <option value="duration">По длительности</option>
              </select>
            </div>
          </div>
  
          <!-- Courses Grid -->
          <div class="courses-grid" v-if="sortedCourses.length > 0">
            <article 
              v-for="course in sortedCourses" 
              :key="course.id || course._id"
              class="course-card"
              :class="{ 'premium-course': course.isPremium }"
              @click="selectCourse(course)"
              role="button"
              tabindex="0"
            >
              <div class="course-image">
                <img 
                  :src="getValidImageUrl(course.thumbnail)" 
                  :alt="course.title" 
                  loading="lazy"
                  @error="handleImageError"
                />
                <div class="course-overlay">
                  <div class="course-category">{{ course.category }}</div>
                  <div v-if="course.isPremium" class="premium-badge">PRO</div>
                </div>
                <div class="course-difficulty" :class="getDifficultyClass(course.difficulty)">
                  {{ getDifficultyIcon(course.difficulty) }}
                </div>
              </div>
              
              <div class="course-content">
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ truncateText(course.description, 100) }}</p>
                
                <div class="course-meta">
                  <div class="course-stats">
                    <div class="stat" v-if="course.duration">
                      <span class="stat-icon">⏱️</span>
                      <span class="stat-value">{{ course.duration }}</span>
                    </div>
                    <div class="stat" v-if="course.studentsCount">
                      <span class="stat-icon">👥</span>
                      <span class="stat-value">{{ formatNumber(course.studentsCount) }}</span>
                    </div>
                  </div>
                </div>
  
                <div class="course-footer">
                  <div class="course-instructor" v-if="course.instructor">
                    <img 
                      :src="getValidImageUrl(course.instructor.avatar)" 
                      :alt="course.instructor.name" 
                      class="instructor-avatar"
                    />
                    <span class="instructor-name">{{ course.instructor.name }}</span>
                  </div>
                  
                  <div class="course-actions">
                    <button 
                      class="start-btn"
                      :class="{ 'premium-btn': course.isPremium && !hasAccessToCourse(course) }"
                      @click.stop="handleCourseStart(course)"
                      type="button"
                    >
                      <span v-if="course.isPremium && !hasAccessToCourse(course)">🔒</span>
                      <span v-else>Открыть</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
  
          <!-- Empty State -->
          <div v-else-if="!loading" class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Курсы не найдены</h3>
            <p>Попробуйте изменить фильтры или поисковый запрос</p>
            <button class="retry-btn" @click="clearFilters" type="button">
              Сбросить фильтры
            </button>
          </div>
        </div>
      </section>
  
      <!-- Payment Modal Integration -->
      <PaymentModal
        v-if="showPaymentModal"
        :visible="showPaymentModal"
        :userId="currentUserId"
        :defaultPlan="requiredPlan"
        :requestedTopicId="selectedCourseId"
        @close="closePaymentModal"
        @unlocked="handleCourseUnlocked"
        @payment-initiated="handlePaymentInitiated"
      />
    </div>
  </template>
  
  <script>
  import { mapState, mapGetters } from 'vuex';
  
  export default {
    name: 'UpdatedCourses',
    
    components: {
      // PaymentModal will be imported if available
    },
    
    data() {
      return {
        // Filter state
        searchQuery: '',
        selectedCategory: '',
        selectedDifficulty: '',
        sortBy: 'newest',
        
        // Modal state
        selectedCourse: null,
        showPaymentModal: false,
        selectedCourseId: null,
        requiredPlan: 'pro',
        
        // Lesson view state
        showLessonView: false,
        currentLessonIndex: 0,
        courseContent: [],
        
        // Data state
        courses: [],
        loading: false,
        error: null,
        
        // Cache for computed values
        categoriesCache: [],
        difficultiesCache: []
      };
    },
    
    computed: {
      currentUserId() {
        return this.$store?.getters?.['user/getUserId'] || 'demo-user';
      },
  
      currentUserPlan() {
        // Simplified plan detection
        return this.$store?.state?.user?.status || 'free';
      },
  
      availableCategories() {
        if (this.categoriesCache.length) return this.categoriesCache;
        const categories = [...new Set(this.courses.map(course => course.category))].filter(Boolean);
        this.categoriesCache = categories;
        return categories;
      },
  
      availableDifficulties() {
        if (this.difficultiesCache.length) return this.difficultiesCache;
        const difficulties = [...new Set(this.courses.map(course => course.difficulty))].filter(Boolean);
        this.difficultiesCache = difficulties;
        return difficulties;
      },
  
      filteredCourses() {
        let filtered = this.courses;
  
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(course => 
            course.title?.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query)
          );
        }
  
        if (this.selectedCategory) {
          filtered = filtered.filter(course => course.category === this.selectedCategory);
        }
  
        if (this.selectedDifficulty) {
          filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty);
        }
  
        return filtered;
      },
  
      sortedCourses() {
        const courses = [...this.filteredCourses];
        
        switch (this.sortBy) {
          case 'popular':
            return courses.sort((a, b) => (b.studentsCount || 0) - (a.studentsCount || 0));
          case 'duration':
            return courses.sort((a, b) => this.parseDuration(a.duration) - this.parseDuration(b.duration));
          case 'newest':
          default:
            return courses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
      },
  
      hasActiveFilters() {
        return !!(this.selectedCategory || this.selectedDifficulty || this.searchQuery);
      },
  
      currentLesson() {
        return this.courseContent[this.currentLessonIndex] || null;
      }
    },
  
    async mounted() {
      try {
        await this.fetchCourses();
      } catch (error) {
        console.error('Error in mounted:', error);
        this.error = 'Ошибка инициализации компонента';
      }
    },
  
    methods: {
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        
        try {
          // Simulate API call or use fallback data
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.courses = this.getFallbackCourses();
          
          // Clear cache when new data arrives
          this.categoriesCache = [];
          this.difficultiesCache = [];
          
        } catch (error) {
          console.error('Error fetching courses:', error);
          this.error = error.message || 'Произошла ошибка при загрузке курсов';
          this.courses = this.getFallbackCourses();
        } finally {
          this.loading = false;
        }
      },
  
      getFallbackCourses() {
        return [
          {
            id: '1',
            title: 'Создание ИИ-помощника с ChatGPT API',
            description: 'Научитесь создавать собственного ИИ-помощника используя современные API и инструменты',
            category: 'ИИ и автоматизация',
            difficulty: 'Средний',
            duration: '4 часа',
            thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
            isPremium: false,
            studentsCount: 1234,
            tools: ['ChatGPT API', 'Python', 'Flask'],
            instructor: {
              name: 'Алексей Иванов',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
              bio: 'Эксперт по машинному обучению'
            },
            createdAt: '2024-01-15T00:00:00Z',
            isBookmarked: false
          },
          {
            id: '2',
            title: 'Профессиональный видеомонтаж в DaVinci Resolve',
            description: 'Освойте профессиональный видеомонтаж от основ до продвинутых техник',
            category: 'Видеомонтаж',
            difficulty: 'Продвинутый',
            duration: '8 часов',
            thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=250&fit=crop',
            isPremium: true,
            studentsCount: 567,
            tools: ['DaVinci Resolve', 'Color Grading'],
            instructor: {
              name: 'Мария Петрова',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
              bio: 'Профессиональный видеомонтажер'
            },
            createdAt: '2024-01-10T00:00:00Z',
            isBookmarked: false
          },
          {
            id: '3',
            title: 'React и TypeScript для начинающих',
            description: 'Изучите современную разработку на React с TypeScript',
            category: 'Web-разработка',
            difficulty: 'Начинающий',
            duration: '6 часов',
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
            isPremium: false,
            studentsCount: 890,
            tools: ['React', 'TypeScript', 'Vite'],
            instructor: {
              name: 'Дмитрий Сидоров',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
              bio: 'Senior Frontend Developer'
            },
            createdAt: '2024-01-20T00:00:00Z',
            isBookmarked: true
          }
        ];
      },
  
      selectCourse(course) {
        this.selectedCourse = course;
        this.fetchCourseContent(course);
      },
  
      async fetchCourseContent(course) {
        try {
          // Simulate fetching course content
          await new Promise(resolve => setTimeout(resolve, 500));
          this.courseContent = this.generateFallbackLessons(course);
        } catch (error) {
          console.error('Error fetching course content:', error);
          this.courseContent = this.generateFallbackLessons(course);
        }
      },
  
      generateFallbackLessons(course) {
        const lessons = [
          {
            id: '1',
            title: 'Введение в курс',
            description: `Знакомство с курсом "${course.title}"`,
            duration: '15 мин',
            type: 'introduction',
            steps: [
              {
                type: 'explanation',
                data: { content: `Добро пожаловать на курс "${course.title}". В этом уроке мы познакомимся с основными концепциями и целями курса.` }
              },
              {
                type: 'video',
                data: { 
                  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  description: 'Вводное видео к курсу'
                }
              }
            ]
          },
          {
            id: '2',
            title: 'Основы и теория',
            description: 'Изучаем основные принципы и методы',
            duration: '30 мин',
            type: 'theory',
            steps: [
              {
                type: 'explanation',
                data: { content: 'В этом уроке мы рассмотрим основные принципы и методы работы с выбранной технологией.' }
              },
              {
                type: 'video',
                data: { 
                  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  description: 'Теоретические основы'
                }
              },
              {
                type: 'practice',
                data: { instructions: 'Попробуйте применить изученные принципы на практике.' }
              }
            ]
          },
          {
            id: '3',
            title: 'Практическое применение',
            description: 'Применяем знания на практике',
            duration: '45 мин',
            type: 'practice',
            steps: [
              {
                type: 'explanation',
                data: { content: 'Теперь применим полученные знания для решения реальных задач.' }
              },
              {
                type: 'video',
                data: { 
                  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  description: 'Практические примеры'
                }
              },
              {
                type: 'quiz',
                data: { 
                  question: 'Какой метод наиболее эффективен для начинающих?',
                  options: ['Метод А', 'Метод Б', 'Метод В'],
                  correctAnswer: 0
                }
              }
            ]
          }
        ];
  
        return lessons;
      },
  
      startCourse(course) {
        if (course.isPremium && !this.hasAccessToCourse(course)) {
          this.selectedCourseId = (course.id || course._id).toString();
          this.requiredPlan = 'pro';
          this.showPaymentModal = true;
          return;
        }
  
        this.selectCourse(course);
      },
  
      openLesson(lesson, index) {
        this.currentLessonIndex = index;
        this.showLessonView = true;
      },
  
      closeLessonView() {
        this.showLessonView = false;
        this.currentLessonIndex = 0;
      },
  
      previousLesson() {
        if (this.currentLessonIndex > 0) {
          this.currentLessonIndex--;
        }
      },
  
      nextLesson() {
        if (this.currentLessonIndex < this.courseContent.length - 1) {
          this.currentLessonIndex++;
        }
      },
  
      completeCourse() {
        alert('🎉 Поздравляем! Вы успешно завершили курс!');
        this.closeLessonView();
        this.selectedCourse = null;
      },
  
      getStepTitle(step) {
        const titles = {
          explanation: '📝 Объяснение',
          video: '🎥 Видео',
          practice: '🎯 Практика',
          quiz: '❓ Викторина',
          example: '💡 Пример'
        };
        return titles[step.type] || 'Шаг';
      },
  
      selectQuizOption(stepIndex, optionIndex) {
        // Handle quiz option selection
        console.log(`Selected option ${optionIndex} for step ${stepIndex}`);
        // You can add quiz logic here
      },
  
      getValidImageUrl(url) {
        if (!url) return this.getDefaultThumbnail();
        
        // Check if it's a valid URL
        try {
          new URL(url);
          return url;
        } catch {
          return this.getDefaultThumbnail();
        }
      },
  
      getDefaultThumbnail(category = 'default') {
        const gradients = {
          'ИИ и автоматизация': '#667eea',
          'Видеомонтаж': '#f093fb',
          'Графический дизайн': '#4facfe',
          'Web-разработка': '#43e97b',
          'default': '#667eea'
        };
  
        const color = gradients[category] || gradients.default;
        const icon = this.getCategoryIcon(category);
  
        return `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="250" fill="${color}" />
            <text x="200" y="125" text-anchor="middle" fill="white" font-size="48" font-family="Arial">${icon}</text>
          </svg>
        `)}`;
      },
  
      getDefaultAvatar() {
        return `data:image/svg+xml;base64,${btoa(`
          <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#e5e7eb"/>
            <circle cx="50" cy="40" r="15" fill="#9ca3af"/>
            <path d="M50 55c-15 0-25 8-25 18v27h50v-27c0-10-10-18-25-18z" fill="#9ca3af"/>
          </svg>
        `)}`;
      },
  
      isDirectVideoUrl(url) {
        if (!url) return false;
        return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('blob:');
      },
  
      getEmbedUrl(url) {
        if (!url) return '';
        
        // YouTube
        if (url.includes('youtube.com/watch')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        
        // Vimeo
        if (url.includes('vimeo.com/')) {
          const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
          return `https://player.vimeo.com/video/${videoId}`;
        }
        
        // If already an embed URL, return as is
        if (url.includes('embed')) {
          return url;
        }
        
        return url;
      },
  
      async toggleBookmark(course) {
        if (!course) return;
        
        try {
          const wasBookmarked = course.isBookmarked;
          
          // Optimistic update
          course.isBookmarked = !wasBookmarked;
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const message = course.isBookmarked ? 
            'Курс добавлен в избранное' : 
            'Курс удален из избранного';
          console.log(message);
          
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          // Revert on failure
          course.isBookmarked = !course.isBookmarked;
        }
      },
  
      formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000) {
          return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
      },
  
      parseDuration(duration) {
        if (!duration) return 0;
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      },
  
      hasAccessToCourse(course) {
        if (!course || !course.isPremium) return true;
        const plan = this.currentUserPlan;
        return ['start', 'pro'].includes(plan);
      },
  
      handleCourseStart(course) {
        if (!course) return;
        
        if (course.isPremium && !this.hasAccessToCourse(course)) {
          this.selectedCourseId = (course.id || course._id).toString();
          this.requiredPlan = 'pro';
          this.showPaymentModal = true;
          return;
        }
        
        this.selectCourse(course);
      },
  
      // Filter methods
      setCategory(category) {
        this.selectedCategory = this.selectedCategory === category ? '' : category;
      },
  
      setDifficulty(difficulty) {
        this.selectedDifficulty = this.selectedDifficulty === difficulty ? '' : difficulty;
      },
  
      clearFilters() {
        this.selectedCategory = '';
        this.selectedDifficulty = '';
        this.searchQuery = '';
      },
  
      closePaymentModal() {
        this.showPaymentModal = false;
        this.selectedCourseId = null;
      },
  
      handleCourseUnlocked(data) {
        this.closePaymentModal();
        
        const course = this.courses.find(c => (c.id || c._id).toString() === this.selectedCourseId);
        if (course) {
          setTimeout(() => {
            this.selectCourse(course);
          }, 1000);
        }
        
        if (data.plan && this.$store) {
          this.$store.commit('user/SET_USER_STATUS', data.plan);
        }
      },
  
      handlePaymentInitiated(data) {
        this.closePaymentModal();
      },
  
      // Image handling methods
      handleImageError(event) {
        const img = event.target;
        const courseCard = img.closest('.course-card');
        const category = courseCard?.querySelector('.course-category')?.textContent || 'default';
        img.src = this.getDefaultThumbnail(category);
      },
  
      // Utility methods
      getCategoryIcon(category) {
        const icons = {
          'ИИ и автоматизация': '🤖',
          'Видеомонтаж': '🎬',
          'Графический дизайн': '🎨',
          'Web-разработка': '💻',
          'Мобильная разработка': '📱',
          'Машинное обучение': '🧠',
          'Дизайн': '🎨',
          'Программирование': '💻',
          'Маркетинг': '📈'
        };
        return icons[category] || '📚';
      },
  
      getDifficultyIcon(difficulty) {
        const icons = {
          'Начинающий': '🟢',
          'Средний': '🟡',
          'Продвинутый': '🔴'
        };
        return icons[difficulty] || '⚪';
      },
  
      getDifficultyClass(difficulty) {
        const classMap = {
          'Начинающий': 'beginner',
          'Средний': 'intermediate', 
          'Продвинутый': 'advanced'
        };
        return classMap[difficulty] || 'unknown';
      },
  
      getSectionTitle() {
        if (this.hasActiveFilters) {
          return `Найдено курсов: ${this.filteredCourses.length}`;
        }
        return 'Все актуальные курсы';
      },
  
      truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      }
    }
  };
  </script>
  
  <style scoped>
  /* Clean Modern Styles for UpdatedCourses.vue */

/* CSS Variables */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --secondary: #8b5cf6;
  --accent: #f59e0b;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --radius: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* Base Styles */
.updated-courses-container {
  min-height: 100vh;
  background: var(--bg-secondary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section - Simplified */
.hero-section {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  padding: 3rem 0 2rem;
  color: white;
}

.hero-content {
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  line-height: 1.1;
}

.gradient-text {
  background: linear-gradient(45deg, #ffffff, #e0e7ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(10px);
  min-width: 80px;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Filters Section - Clean */
.filters-section {
  padding: 1.5rem 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.clear-filters-btn {
  background: var(--error);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: #dc2626;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: var(--border);
}

.filter-chip.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.search-group {
  grid-column: 1 / -1;
}

.search-input-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  background: var(--bg-primary);
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

/* Loading States */
.loading-section {
  padding: 3rem 0;
  text-align: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-section {
  padding: 3rem 0;
  text-align: center;
}

.error-content {
  max-width: 400px;
  margin: 0 auto;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.retry-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: var(--primary-dark);
}

/* Course Detail Section */
.course-detail-section {
  padding: 2rem 0;
}

.back-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--border);
}

.course-detail-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.course-header {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 2rem;
}

.course-image {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  aspect-ratio: 16/9;
}

.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.premium-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--accent);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.75rem;
  font-weight: 600;
}

.course-info h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.course-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.course-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.meta-label {
  color: var(--text-muted);
}

.course-instructor {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  margin-bottom: 1.5rem;
}

.instructor-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.instructor-info h4 {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.course-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.primary {
  background: var(--primary);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-dark);
}

.action-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.action-btn.secondary:hover {
  background: var(--border);
}

/* Course Content */
.course-content {
  padding: 2rem;
  border-top: 1px solid var(--border);
}

.course-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}

.lesson-item:hover {
  background: var(--border);
  transform: translateX(4px);
}

.lesson-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.lesson-info {
  flex: 1;
}

.lesson-info h4 {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.lesson-info p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.lesson-arrow {
  color: var(--text-muted);
  font-weight: 600;
}

.course-tools {
  padding: 2rem;
  border-top: 1px solid var(--border);
}

.course-tools h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-tag {
  background: var(--primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  font-weight: 500;
}

/* Lesson View */
.lesson-view-section {
  padding: 2rem 0;
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.lesson-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  max-width: 300px;
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s ease;
}

.lesson-content {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 2rem;
  box-shadow: var(--shadow);
}

.lesson-content h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.lesson-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.lesson-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.lesson-step {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.step-content {
  padding: 1.5rem;
}

.step-text p {
  color: var(--text-primary);
  line-height: 1.6;
}

/* Video Content - Fixed */
.step-video {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.lesson-video {
  width: 100%;
  height: auto;
  max-height: 500px;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.video-embed {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  overflow: hidden;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.video-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.video-description {
  color: var(--text-secondary);
  font-style: italic;
  text-align: center;
}

/* Practice and Quiz */
.step-practice,
.step-quiz {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius);
}

.practice-instructions h4,
.quiz-question h4 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-option {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  padding: 0.75rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quiz-option:hover {
  background: var(--border);
}

/* Lesson Navigation */
.lesson-navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.nav-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: var(--primary-dark);
}

.nav-btn.complete {
  background: var(--success);
}

.nav-btn.complete:hover {
  background: #059669;
}

/* Courses Grid */
.courses-section {
  padding: 2rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-primary);
  cursor: pointer;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Course Card - Simplified */
.course-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.course-card.premium-course {
  border-color: var(--accent);
}

.course-card.premium-course:hover {
  border-color: var(--accent);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.15);
}

.course-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.course-card:hover .course-image img {
  transform: scale(1.05);
}

.course-overlay {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-category {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.course-difficulty {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  font-size: 0.875rem;
}

.course-difficulty.beginner { color: var(--success); }
.course-difficulty.intermediate { color: var(--warning); }
.course-difficulty.advanced { color: var(--error); }

.course-content {
  padding: 1.25rem;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.instructor-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.instructor-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.start-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.start-btn:hover {
  background: var(--primary-dark);
}

.start-btn.premium-btn {
  background: var(--accent);
}

.start-btn.premium-btn:hover {
  background: #d97706;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .hero-section {
    padding: 2rem 0 1.5rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-stats {
    gap: 1rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .course-header {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .course-image {
    max-width: 400px;
    margin: 0 auto;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .lesson-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .lesson-navigation {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .course-detail-content,
  .lesson-content {
    margin: 0 -1rem;
    border-radius: 0;
  }

  .video-container {
    margin: 0 -1.5rem;
  }

  .lesson-video {
    border-radius: 0;
  }
}

/* Focus states for accessibility */
.course-card:focus,
.filter-chip:focus,
.action-btn:focus,
.start-btn:focus,
.nav-btn:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>