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
              <CourseCard
                v-for="course in sortedCourses"
                :key="course.id"
                :course="course"
                @view-details="selectCourse(course)"
              />
            </div>
          </div>
        </div>
      </section>
  
      <section v-else class="course-detail-section">
        <div class="container">
          <button class="back-btn" @click="selectedCourse = null">← Назад к списку</button>
          <CourseDetail
            :course="selectedCourse"
            :course-content="courseContent"
            :loading-content="loadingContent"
            :content-error="contentError"
            @start-lesson="openLesson"
            @toggle-bookmark="toggleBookmark"
            @request-access="handleRequestAccess"
          />
        </div>
      </section>
  
      <PaymentModal
        v-if="showPaymentModal"
        :visible="showPaymentModal"
        :userId="currentUserId"
        :defaultPlan="requiredPlan"
        @close="closePaymentModal"
        @unlocked="handleCourseUnlocked"
      />
  
      <LessonPlayer
        v-if="showLessonView && currentLesson"
        :lesson="currentLesson"
        :course-title="selectedCourse.title"
        :lesson-index="currentLessonIndex"
        :total-lessons="courseContent.length"
        @close="closeLessonView"
        @next-lesson="nextLesson"
        @previous-lesson="previousLesson"
        @complete-course="completeCourse"
      />
    </div>
  </template>
  
  <script>
  import { mapState, mapGetters } from 'vuex';
  import {
    getUpdatedCourses,
    getCourseDetails,
    getLessonsByTopic,
    toggleBookmark,
  } from '@/api'; // Assuming these functions exist in your api.js
  import CourseCard from './components/CourseCard.vue';
  import CourseDetail from './components/CourseDetail.vue';
  import LessonPlayer from './components/LessonPlayer.vue';
  import PaymentModal from './components/PaymentModal.vue'; // Assuming you have a PaymentModal component
  
  export default {
    name: 'UpdatedCourses',
    components: {
      CourseCard,
      CourseDetail,
      LessonPlayer,
      PaymentModal,
    },
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
  
        // Payment state
        showPaymentModal: false,
        requiredPlan: 'pro',
        
        debounceTimeout: null,
      };
    },
    computed: {
      ...mapGetters('user', ['currentUserId', 'currentUserPlan']), // Assuming Vuex module 'user'
  
      availableCategories() {
        return [...new Set(this.courses.map(c => c.category))].filter(Boolean);
      },
      availableDifficulties() {
        return [...new Set(this.courses.map(c => c.difficulty))].filter(Boolean);
      },
      sortedCourses() {
        const courses = [...this.courses];
        // Note: The backend should handle sorting, but this provides a client-side fallback
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
          const { courses, error } = await getUpdatedCourses(filters);
          if (error) throw new Error(error);
          this.courses = courses;
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
          // Fetch detailed course data and lessons
          const { data, error } = await getLessonsByTopic(course.id);
          if (error) throw new Error(error);
          this.courseContent = data;
        } catch (e) {
          console.error('Failed to fetch course content:', e);
          this.contentError = 'Не удалось загрузить содержание курса.';
          // Fallback to mock data if API fails
          this.courseContent = this.generateFallbackLessons(course);
        } finally {
          this.loadingContent = false;
        }
      },
      
      async toggleBookmark(course) {
        const courseId = course.id || course._id;
        const wasBookmarked = course.isBookmarked;
  
        try {
          // Optimistic update
          course.isBookmarked = !wasBookmarked;
          const response = await toggleBookmark(this.currentUserId, courseId, !wasBookmarked);
          
          if (!response.success) {
            throw new Error('API request failed');
          }
  
          const message = course.isBookmarked ?
            'Курс добавлен в избранное' :
            'Курс удален из избранного';
          this.$toast.success(message);
  
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          course.isBookmarked = wasBookmarked; // Revert on error
          this.$toast.error('Не удалось обновить статус избранного.');
        }
      },
  
      handleRequestAccess() {
        this.showPaymentModal = true;
        this.requiredPlan = this.selectedCourse.isPremium ? 'pro' : 'start';
      },
  
      handleCourseUnlocked(plan) {
        this.showPaymentModal = false;
        // Optionally update user state
        this.$store.commit('user/SET_USER_STATUS', plan);
        this.$toast.success('Доступ к курсу разблокирован!');
      },
  
      closePaymentModal() {
        this.showPaymentModal = false;
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
        this.$toast.success('Поздравляем! Вы успешно завершили курс!', { duration: 5000 });
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
  
      generateFallbackLessons(course) {
        // Mock lesson data for when API fails
        return [
          { id: '1', title: 'Введение в курс', content: 'Приветствие и обзор курса.', duration: '15 мин' },
          { id: '2', title: 'Основы дизайна', content: 'Изучение базовых принципов.', duration: '30 мин' },
          { id: '3', title: 'Практика', content: 'Решение практической задачи.', duration: '45 мин' }
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
    transition: var(--transition);
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
    transition: var(--transition);
    margin-bottom: 2rem;
  }
  
  .back-btn:hover {
    background-color: var(--color-light-2);
  }
  </style>