<template>
    <div class="updated-courses-page">
      <section class="page-hero">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">Актуальные курсы</span>
            </h1>
            <p class="hero-subtitle">
              Изучайте новейшие технологии и инструменты с нашими современными курсами.
            </p>
          </div>
        </div>
      </section>
  
      <section v-if="!selectedCourse" class="courses-section">
        <div class="container">
          <div class="filter-bar-wrapper">
            <div class="filter-bar">
              <div class="filter-group">
                <label for="search" class="filter-label">Поиск</label>
                <div class="input-icon-wrapper">
                  <input
                    id="search"
                    v-model="searchQuery"
                    type="text"
                    placeholder="Поиск по названию или описанию..."
                    class="filter-input"
                    @input="debounceFetch"
                  />
                  <span class="input-icon">🔍</span>
                </div>
              </div>
  
              <div class="filter-group">
                <label for="category" class="filter-label">Категория</label>
                <select id="category" v-model="selectedCategory" class="filter-select" @change="fetchCourses">
                  <option value="">Все категории</option>
                  <option v-for="cat in availableCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
  
              <div class="filter-group">
                <label for="difficulty" class="filter-label">Сложность</label>
                <select id="difficulty" v-model="selectedDifficulty" class="filter-select" @change="fetchCourses">
                  <option value="">Любая сложность</option>
                  <option v-for="diff in availableDifficulties" :key="diff" :value="diff">
                    {{ getDifficultyIcon(diff) }} {{ diff }}
                  </option>
                </select>
              </div>
            </div>
          </div>
  
          <div class="courses-grid-wrapper">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Загрузка курсов...</p>
            </div>
  
            <div v-else-if="error" class="error-state">
              <div class="error-icon">⚠️</div>
              <h3>Не удалось загрузить курсы</h3>
              <p>{{ error }}</p>
              <button class="btn-primary" @click="fetchCourses">
                Попробовать снова
              </button>
            </div>
  
            <div v-else-if="sortedCourses.length === 0" class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>Курсы не найдены</h3>
              <p>Попробуйте изменить фильтры или поисковый запрос</p>
              <button class="btn-secondary" @click="clearFilters">
                Сбросить фильтры
              </button>
            </div>
  
            <div v-else class="courses-grid">
              <article
                v-for="course in sortedCourses"
                :key="course.id"
                class="course-card"
                :class="{ 'premium-course': course.isPremium }"
                @click="selectCourse(course)"
              >
                <div class="course-image-wrapper">
                  <img
                    :src="getValidImageUrl(course.thumbnail)"
                    :alt="course.title"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <div class="course-badge" :class="course.isPremium ? 'is-premium' : 'is-free'">
                    {{ course.isPremium ? 'PRO' : 'БЕСПЛАТНО' }}
                  </div>
                </div>
                <div class="course-content">
                  <h3 class="course-title">{{ course.title }}</h3>
                  <p class="course-description">{{ truncateText(course.description, 100) }}</p>
                  <div class="course-meta">
                    <span class="course-difficulty">{{ getDifficultyIcon(course.difficulty) }} {{ course.difficulty }}</span>
                    <span class="course-duration">⏱️ {{ course.duration }}</span>
                  </div>
                  <div class="course-footer">
                    <div class="instructor-info">
                      <img
                        :src="getValidImageUrl(course.instructor.avatar)"
                        :alt="course.instructor.name"
                        class="instructor-avatar"
                      />
                      <span class="instructor-name">{{ course.instructor.name }}</span>
                    </div>
                    <button class="view-btn">
                      Подробнее
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
  
      <section v-else-if="selectedCourse && !showLessonView" class="course-detail-section">
        <div class="container">
          <button class="back-btn" @click="selectedCourse = null">← Назад к списку</button>
          <div class="course-detail-container">
            <div class="detail-header">
              <div class="detail-image-wrapper">
                <img :src="getValidImageUrl(selectedCourse.thumbnail)" :alt="selectedCourse.title" />
                <div class="premium-badge">{{ selectedCourse.isPremium ? 'PRO' : 'БЕСПЛАТНО' }}</div>
              </div>
              <div class="detail-info">
                <h1 class="detail-title">{{ selectedCourse.title }}</h1>
                <p class="detail-description">{{ selectedCourse.description }}</p>
                <div class="detail-meta">
                  <span class="meta-item">Категория: {{ selectedCourse.category }}</span>
                  <span class="meta-item">Сложность: {{ getDifficultyIcon(selectedCourse.difficulty) }} {{ selectedCourse.difficulty }}</span>
                  <span class="meta-item">Длительность: {{ selectedCourse.duration }}</span>
                </div>
                <div class="detail-instructor" v-if="selectedCourse.instructor">
                  <img :src="getValidImageUrl(selectedCourse.instructor.avatar)" class="instructor-avatar" />
                  <div class="instructor-details">
                    <h4>{{ selectedCourse.instructor.name }}</h4>
                    <p>{{ selectedCourse.instructor.bio }}</p>
                  </div>
                </div>
                <div class="detail-actions">
                  <button
                    class="btn-primary"
                    @click="startCourse(selectedCourse)"
                  >
                    Начать обучение
                  </button>
                  <button
                    class="btn-secondary"
                    @click="toggleBookmark(selectedCourse)"
                  >
                    {{ selectedCourse.isBookmarked ? '❤️ В избранном' : '🤍 В избранное' }}
                  </button>
                </div>
              </div>
            </div>
            <div class="detail-content">
              <div v-if="loadingContent" class="content-state">
                <div class="spinner"></div>
                <p>Загрузка содержания...</p>
              </div>
              <div v-else-if="contentError" class="content-state">
                <p class="error-message">{{ contentError }}</p>
              </div>
              <div v-else class="lessons-list">
                <h3>Содержание курса ({{ courseContent.length }} уроков)</h3>
                <div
                  v-for="(lesson, index) in courseContent"
                  :key="lesson.id"
                  class="lesson-item"
                  @click="openLesson(lesson, index)"
                >
                  <span class="lesson-number">{{ index + 1 }}</span>
                  <div class="lesson-info">
                    <h4>{{ lesson.title || lesson.lessonName }}</h4>
                    <p>{{ lesson.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <section v-else-if="showLessonView && currentLesson" class="lesson-player-overlay">
        <div class="lesson-player-modal">
          <div class="player-header">
            <button class="close-btn" @click="closeLessonView">
              <span class="icon">×</span>
            </button>
            <div class="player-title-info">
              <span class="course-title-text">{{ selectedCourse.title }}</span>
              <h2 class="lesson-title">{{ currentLesson.title || currentLesson.lessonName }}</h2>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage }"></div>
              </div>
              <span class="progress-text">Урок {{ currentLessonIndex + 1 }} из {{ courseContent.length }}</span>
            </div>
          </div>
          <div class="player-content">
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
                  <div v-if="step.type === 'explanation' || step.type === 'example'" class="step-text">
                    <p>{{ step.data?.content || step.content }}</p>
                  </div>
  
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
  
                  <div v-else-if="step.type === 'practice'" class="step-practice">
                    <div class="practice-instructions">
                      <h4>Практическое задание</h4>
                      <p>{{ step.data?.instructions || step.instructions }}</p>
                    </div>
                  </div>
  
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
  
            <div class="player-navigation">
              <button
                class="nav-btn prev"
                :disabled="currentLessonIndex === 0"
                @click="previousLesson"
              >
                ← Назад
              </button>
              <button
                v-if="currentLessonIndex < courseContent.length - 1"
                class="nav-btn next"
                @click="nextLesson"
              >
                Далее →
              </button>
              <button
                v-else
                class="nav-btn complete"
                @click="completeCourse"
              >
                Завершить курс 🎉
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </template>
  
  <script>
  import { mapState, mapGetters } from 'vuex';
  import { getUpdatedCourses, getLessonsByTopic, toggleBookmark } from '@/api';
  
  export default {
    name: 'UpdatedCourses',
    data() {
      return {
        // Filter state
        searchQuery: '',
        selectedCategory: '',
        selectedDifficulty: '',
        sortBy: 'newest',
        
        // UI state
        loading: false,
        error: null,
        selectedCourse: null,
        loadingContent: false,
        contentError: null,
  
        // Data state
        courses: [],
        courseContent: [],
        
        // Lesson state
        showLessonView: false,
        currentLessonIndex: 0,
        
        debounceTimeout: null,
      };
    },
    computed: {
      ...mapGetters('user', ['currentUserId', 'currentUserPlan']),
  
      availableCategories() {
        return [...new Set(this.courses.map(c => c.category))].filter(Boolean);
      },
      availableDifficulties() {
        return [...new Set(this.courses.map(c => c.difficulty))].filter(Boolean);
      },
      sortedCourses() {
        const courses = [...this.courses];
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
      currentLesson() {
        return this.courseContent[this.currentLessonIndex] || null;
      },
      progressPercentage() {
        return `${((this.currentLessonIndex + 1) / this.courseContent.length) * 100}%`;
      },
    },
    async mounted() {
      await this.fetchCourses();
    },
    methods: {
      debounceFetch() {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(this.fetchCourses, 500);
      },
  
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        try {
          const filters = {
            category: this.selectedCategory,
            difficulty: this.selectedDifficulty,
            search: this.searchQuery,
            sort: this.sortBy,
          };
          const response = await getUpdatedCourses(filters);
          if (response.error) throw new Error(response.error);
          this.courses = response.courses;
        } catch (e) {
          console.error('Failed to fetch courses:', e);
          this.error = 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.';
        } finally {
          this.loading = false;
        }
      },
  
      async selectCourse(course) {
        this.selectedCourse = course;
        this.loadingContent = true;
        this.contentError = null;
        this.courseContent = [];
        try {
          const response = await getLessonsByTopic(course.id);
          if (response.error) throw new Error(response.error);
          this.courseContent = response.data;
        } catch (e) {
          console.error('Failed to fetch course content:', e);
          this.contentError = 'Не удалось загрузить содержание курса.';
          this.courseContent = this.generateFallbackLessons(course);
        } finally {
          this.loadingContent = false;
        }
      },
      
      async toggleBookmark(course) {
        const courseId = course.id || course._id;
        const wasBookmarked = course.isBookmarked;
  
        try {
          course.isBookmarked = !wasBookmarked;
          const response = await toggleBookmark(this.currentUserId, courseId, !wasBookmarked);
          
          if (!response.success) {
            throw new Error('API request failed');
          }
  
          const message = course.isBookmarked ?
            'Курс добавлен в избранное' :
            'Курс удален из избранного';
          // this.$toast.success(message);
          console.log(message);
  
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          course.isBookmarked = wasBookmarked;
          // this.$toast.error('Не удалось обновить статус избранного.');
          console.log('Не удалось обновить статус избранного.');
        }
      },
  
      startCourse(course) {
        // Logic for checking access and opening lesson
        this.openLesson(this.courseContent[0], 0);
      },
  
      openLesson(lesson, index) {
        this.currentLessonIndex = index;
        this.showLessonView = true;
      },
  
      closeLessonView() {
        this.showLessonView = false;
        this.currentLessonIndex = 0;
      },
  
      nextLesson() {
        if (this.currentLessonIndex < this.courseContent.length - 1) {
          this.currentLessonIndex++;
        }
      },
  
      previousLesson() {
        if (this.currentLessonIndex > 0) {
          this.currentLessonIndex--;
        }
      },
  
      completeCourse() {
        this.showLessonView = false;
        this.selectedCourse = null;
        console.log('Поздравляем! Вы успешно завершили курс!');
      },
      
      clearFilters() {
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedDifficulty = '';
        this.fetchCourses();
      },
  
      parseDuration(duration) {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      },
  
      getDifficultyIcon(difficulty) {
        const icons = {
          'Начинающий': '🟢',
          'Средний': '🟡',
          'Продвинутый': '🔴'
        };
        return icons[difficulty] || '⚪';
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
  
      getValidImageUrl(url) {
        return url || 'https://via.placeholder.com/400x250.png?text=ACED';
      },
      
      handleImageError(event) {
        event.target.src = 'https://via.placeholder.com/400x250.png?text=ACED';
      },
      
      isDirectVideoUrl(url) {
        if (!url) return false;
        return url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('blob:');
      },
  
      getEmbedUrl(url) {
        if (!url) return '';
        if (url.includes('youtube.com/watch')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
      },
  
      truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
      },
  
      generateFallbackLessons(course) {
        // Mock lesson data for when API fails
        return [
          { 
            id: '1', 
            title: 'Введение в курс', 
            steps: [
              { type: 'explanation', data: { content: 'Добро пожаловать на демо-курс! Это первый урок.' } },
              { type: 'video', data: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } }
            ],
          },
          { 
            id: '2', 
            title: 'Основы дизайна', 
            steps: [
              { type: 'explanation', data: { content: 'Здесь мы изучим основные принципы.' } },
              { type: 'practice', data: { instructions: 'Попробуйте создать свой первый макет.' } }
            ],
          },
        ];
      },
    },
  };
  </script>
  
  <style scoped>
  /*
    🎨 Brand Colors
    --brand-primary: #6366f1;
    --brand-secondary: #8b5cf6;
    --brand-accent: #f59e0b;
    --brand-success: #10b981;
    --brand-warning: #f59e0b;
    --brand-error: #ef4444;
  
    🌑 Dark Palette
    --color-dark-1: #1a202c;
    --color-dark-2: #2d3748;
    --color-dark-3: #4a5568;
  
    ⚪ Light Palette
    --color-light-1: #ffffff;
    --color-light-2: #f7fafc;
    --color-light-3: #edf2f7;
  
    🖋️ Typography
    --text-color-primary: #1a202c;
    --text-color-secondary: #4a5568;
    --text-color-muted: #718096;
    --text-color-light: #ffffff;
  
    🖼️ Misc
    --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    --border-radius: 12px;
    --transition: all 0.3s ease-in-out;
  */
  
  .updated-courses-page {
    font-family: 'Inter', sans-serif;
    background-color: var(--color-light-2);
    min-height: 100vh;
  }
  
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  
  /* ================== Hero Section ================== */
  .page-hero {
    background-color: var(--brand-primary);
    background-image: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
    color: var(--text-color-light);
    padding: 4rem 0;
    text-align: center;
  }
  
  .hero-title {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  
  .gradient-text {
    background: linear-gradient(45deg, #ffffff, #e0e7ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    font-weight: 400;
    opacity: 0.9;
  }
  
  /* ================== Filter Bar ================== */
  .courses-section {
    padding: 2rem 0;
  }
  
  .filter-bar-wrapper {
    background-color: var(--color-light-1);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    margin-bottom: 2rem;
  }
  
  .filter-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
  }
  
  .filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
  }
  
  .filter-input,
  .filter-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-light-3);
    border-radius: 8px;
    font-size: 1rem;
    background-color: var(--color-light-2);
    color: var(--text-color-primary);
    transition: border-color 0.2s;
  }
  
  .filter-input:focus,
  .filter-select:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  .input-icon-wrapper {
    position: relative;
  }
  
  .input-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-muted);
  }
  
  .filter-input {
    padding-left: 2.75rem;
  }
  
  /* ================== Course Grid & States ================== */
  .courses-grid-wrapper {
    min-height: 50vh;
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    padding: 4rem 0;
    color: var(--text-color-secondary);
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-light-3);
    border-top: 4px solid var(--brand-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .error-icon, .empty-icon {
    font-size: 3rem;
    color: var(--brand-warning);
  }
  
  .error-state .error-icon {
    color: var(--brand-error);
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
  }
  
  /* ================== Buttons ================== */
  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    border: none;
  }
  
  .btn-primary {
    background-color: var(--brand-primary);
    color: var(--text-color-light);
  }
  
  .btn-primary:hover {
    background-color: var(--brand-secondary);
  }
  
  .btn-secondary {
    background-color: var(--color-light-3);
    color: var(--text-color-primary);
  }
  
  .btn-secondary:hover {
    background-color: var(--color-light-2);
  }
  
  /* ================== Back Button ================== */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-light-3);
    color: var(--text-color-secondary);
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    margin-bottom: 2rem;
  }
  
  .back-btn:hover {
    background-color: var(--color-light-2);
  }
  
  /* ================== Course Card ================== */
  .course-card {
    background-color: var(--color-light-1);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .course-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .course-image-wrapper {
    position: relative;
    height: 200px;
    overflow: hidden;
  }
  
  .course-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .course-card:hover .course-image-wrapper img {
    transform: scale(1.05);
  }
  
  .course-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 9999px;
    color: var(--text-color-light);
  }
  
  .is-premium { background-color: var(--brand-accent); }
  .is-free { background-color: var(--brand-success); }
  
  .course-content {
    padding: 1.5rem;
  }
  
  .course-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color-primary);
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-description {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: var(--text-color-muted);
    margin-bottom: 1.5rem;
  }
  
  .course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-light-3);
  }
  
  .instructor-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .instructor-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .instructor-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color-primary);
  }
  
  .view-btn {
    background-color: var(--brand-primary);
    color: var(--text-color-light);
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    transition: background-color 0.2s;
    border: none;
  }
  
  .view-btn:hover {
    background-color: var(--brand-secondary);
  }
  
  
  /* ================== Course Detail ================== */
  .course-detail-container {
    background-color: var(--color-light-1);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    padding: 2rem;
  }
  
  .detail-header {
    display: flex;
    gap: 2rem;
    border-bottom: 1px solid var(--color-light-3);
    padding-bottom: 2rem;
    margin-bottom: 2rem;
  }
  
  .detail-image-wrapper {
    flex-shrink: 0;
    width: 350px;
    height: 200px;
    border-radius: var(--border-radius);
    overflow: hidden;
    position: relative;
  }
  
  .detail-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .premium-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background-color: var(--brand-accent);
    color: var(--text-color-light);
    padding: 0.3rem 0.8rem;
    border-radius: 9999px;
    font-weight: 700;
  }
  
  .detail-info {
    flex: 1;
  }
  
  .detail-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-color-primary);
    margin-bottom: 0.5rem;
  }
  
  .detail-description {
    font-size: 1rem;
    color: var(--text-color-secondary);
    margin-bottom: 1.5rem;
  }
  
  .detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-color-muted);
    margin-bottom: 1.5rem;
  }
  
  .detail-instructor {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-light-2);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
  
  .detail-instructor .instructor-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .instructor-details h4 {
    font-size: 1rem;
    font-weight: 700;
  }
  
  .instructor-details p {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
  }
  
  .detail-actions {
    display: flex;
    gap: 1rem;
  }
  
  .lessons-list h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color-primary);
    margin-bottom: 1.5rem;
  }
  
  .lesson-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--color-light-2);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .lesson-item:hover {
    background-color: var(--color-light-3);
  }
  
  .lesson-number {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--brand-primary);
  }
  
  .lesson-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color-primary);
  }
  
  .lesson-info p {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
  }
  
  @media (max-width: 992px) {
    .detail-header {
      flex-direction: column;
    }
    .detail-image-wrapper {
      width: 100%;
    }
  }
  
  /* ================== Lesson Player ================== */
  .lesson-player-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .lesson-player-modal {
    background-color: var(--color-light-1);
    border-radius: var(--border-radius);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
    width: 90%;
    max-width: 1000px;
    max-height: 90%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .player-header {
    position: sticky;
    top: 0;
    background-color: var(--color-light-1);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--color-light-3);
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
    z-index: 10;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-color-muted);
    cursor: pointer;
    transition: color 0.2s;
  }
  
  .close-btn:hover {
    color: var(--text-color-primary);
  }
  
  .player-title-info {
    text-align: center;
  }
  
  .course-title-text {
    font-size: 0.875rem;
    color: var(--brand-primary);
    font-weight: 600;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .lesson-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }
  
  .progress-bar-wrapper {
    width: 150px;
    text-align: right;
  }
  
  .progress-bar {
    height: 8px;
    background-color: var(--color-light-3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--brand-success);
    transition: width 0.3s ease-in-out;
  }
  
  .progress-text {
    font-size: 0.8rem;
    color: var(--text-color-muted);
  }
  
  .player-content {
    padding: 2rem;
  }
  
  .lesson-steps {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .lesson-step {
    border: 1px solid var(--color-light-3);
    border-radius: var(--border-radius);
    overflow: hidden;
  }
  
  .step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-light-2);
    border-bottom: 1px solid var(--color-light-3);
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--brand-primary);
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
    color: var(--text-color-primary);
    line-height: 1.6;
  }
  
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
  
  .video-embed {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    overflow: hidden;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
  }
  
  .video-embed iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .lesson-video {
    width: 100%;
    height: auto;
    max-height: 500px;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
  }
  
  .video-description {
    color: var(--text-color-secondary);
    font-style: italic;
    text-align: center;
  }
  
  .step-practice,
  .step-quiz {
    padding: 1rem;
    background: var(--color-light-2);
    border-radius: var(--border-radius);
  }
  
  .practice-instructions h4,
  .quiz-question h4 {
    color: var(--text-color-primary);
    margin-bottom: 1rem;
  }
  
  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .quiz-option {
    background: var(--color-light-1);
    border: 1px solid var(--color-light-3);
    padding: 0.75rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  
  .quiz-option:hover {
    background: var(--color-light-3);
  }
  
  
  .player-navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-light-3);
  }
  
  .nav-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    transition: background-color 0.2s;
    cursor: pointer;
    border: none;
  }
  
  .nav-btn.prev, .nav-btn.next {
    background-color: var(--brand-primary);
    color: var(--text-color-light);
  }
  
  .nav-btn.prev:disabled {
      background-color: var(--text-color-muted);
      cursor: not-allowed;
  }
  
  .nav-btn.prev:hover, .nav-btn.next:hover {
    background-color: var(--brand-secondary);
  }
  
  .nav-btn.complete {
    background-color: var(--brand-success);
    color: var(--text-color-light);
  }
  
  .nav-btn.complete:hover {
    background-color: #0c8861;
  }
  
  /* ================== Responsive Design ================== */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2rem;
    }
    .filter-bar {
      grid-template-columns: 1fr;
    }
    .course-detail-container {
      padding: 1rem;
    }
    .detail-header {
      flex-direction: column;
    }
    .detail-image-wrapper {
      width: 100%;
    }
    .player-header {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      text-align: center;
    }
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
    .progress-bar-wrapper {
      width: 100%;
      text-align: center;
    }
    .player-navigation {
      flex-direction: column;
    }
    .nav-btn {
      width: 100%;
    }
  }
  
  </style>