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
              Изучайте новейшие технологии и инструменты. От создания ИИ-помощников до современных методов редактирования.
            </p>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">{{ filteredCourses.length }}</span>
                <span class="stat-label">Курсов</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ totalDuration }}</span>
                <span class="stat-label">Часов</span>
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
                  placeholder="Поиск по названию или описанию..."
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
          <div class="loading-grid">
            <div v-for="n in 6" :key="n" class="course-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-footer"></div>
              </div>
            </div>
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
                <option value="difficulty">По сложности</option>
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
              @click="openCourse(course)"
              role="button"
              tabindex="0"
              @keydown.enter="openCourse(course)"
              @keydown.space.prevent="openCourse(course)"
            >
              <div class="course-image">
                <img 
                  :src="course.thumbnail || getDefaultThumbnail(course.category)" 
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
                <p class="course-description">{{ course.description }}</p>
                
                <div class="course-meta">
                  <div class="course-tools" v-if="course.tools && course.tools.length">
                    <span 
                      v-for="tool in course.tools.slice(0, 3)" 
                      :key="tool"
                      class="tool-tag"
                    >
                      {{ tool }}
                    </span>
                    <span v-if="course.tools.length > 3" class="tool-more">
                      +{{ course.tools.length - 3 }}
                    </span>
                  </div>
                  
                  <div class="course-stats">
                    <div class="stat" v-if="course.duration">
                      <span class="stat-icon">⏱️</span>
                      <span class="stat-value">{{ course.duration }}</span>
                    </div>
                    <div class="stat" v-if="course.studentsCount">
                      <span class="stat-icon">👥</span>
                      <span class="stat-value">{{ formatNumber(course.studentsCount) }}</span>
                    </div>
                    <div class="stat" v-if="course.rating">
                      <span class="stat-icon">⭐</span>
                      <span class="stat-value">{{ course.rating }}</span>
                    </div>
                  </div>
                </div>
  
                <div class="course-footer">
                  <div class="course-instructor" v-if="course.instructor">
                    <img 
                      :src="course.instructor.avatar || getDefaultAvatar()" 
                      :alt="course.instructor.name" 
                      class="instructor-avatar"
                      loading="lazy"
                      @error="handleAvatarError"
                    />
                    <span class="instructor-name">{{ course.instructor.name }}</span>
                  </div>
                  
                  <div class="course-actions">
                    <button 
                      class="bookmark-btn" 
                      @click.stop="toggleBookmark(course)"
                      type="button"
                      :aria-label="course.isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное'"
                    >
                      {{ course.isBookmarked ? '❤️' : '🤍' }}
                    </button>
                    <button 
                      class="start-btn"
                      :class="{ 'premium-btn': course.isPremium && !hasAccessToCourse(course) }"
                      @click.stop="handleCourseStart(course)"
                      type="button"
                    >
                      <span v-if="course.isPremium && !hasAccessToCourse(course)">🔒 PRO</span>
                      <span v-else>Начать</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
  
          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Курсы не найдены</h3>
            <p>Попробуйте изменить фильтры или поисковый запрос</p>
            <button class="retry-btn" @click="clearFilters" type="button">
              Сбросить фильтры
            </button>
          </div>
        </div>
      </section>
  
      <!-- Course Modal -->
      <Teleport to="body">
        <div 
          v-if="selectedCourse" 
          class="course-modal-overlay" 
          @click="closeCourseModal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="'modal-title-' + (selectedCourse.id || selectedCourse._id)"
        >
          <div class="course-modal" @click.stop>
            <header class="modal-header">
              <h2 :id="'modal-title-' + (selectedCourse.id || selectedCourse._id)">
                {{ selectedCourse.title }}
              </h2>
              <button 
                class="close-btn" 
                @click="closeCourseModal"
                type="button"
                aria-label="Закрыть модальное окно"
              >
                ×
              </button>
            </header>
            
            <div class="modal-content">
              <div class="modal-image">
                <img 
                  :src="selectedCourse.thumbnail || getDefaultThumbnail(selectedCourse.category)" 
                  :alt="selectedCourse.title" 
                  loading="lazy"
                />
                <div v-if="selectedCourse.isPremium" class="modal-premium-badge">PRO КУРС</div>
              </div>
              
              <div class="modal-info">
                <div class="course-details">
                  <div class="detail-item">
                    <span class="detail-label">Категория:</span>
                    <span class="detail-value">{{ selectedCourse.category }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedCourse.difficulty">
                    <span class="detail-label">Уровень:</span>
                    <span class="detail-value">{{ selectedCourse.difficulty }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedCourse.duration">
                    <span class="detail-label">Длительность:</span>
                    <span class="detail-value">{{ selectedCourse.duration }}</span>
                  </div>
                  <div class="detail-item" v-if="selectedCourse.studentsCount">
                    <span class="detail-label">Студентов:</span>
                    <span class="detail-value">{{ formatNumber(selectedCourse.studentsCount) }}</span>
                  </div>
                </div>
                
                <p class="course-full-description" v-if="selectedCourse.fullDescription">
                  {{ selectedCourse.fullDescription }}
                </p>
                
                <div class="course-tools-list" v-if="selectedCourse.tools && selectedCourse.tools.length">
                  <h4>Инструменты и технологии:</h4>
                  <div class="tools-grid">
                    <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-tag-large">
                      {{ tool }}
                    </span>
                  </div>
                </div>
                
                <div class="course-curriculum" v-if="selectedCourse.curriculum && selectedCourse.curriculum.length">
                  <h4>Программа курса:</h4>
                  <div class="curriculum-list">
                    <div v-for="(lesson, index) in selectedCourse.curriculum" :key="index" class="curriculum-item">
                      <div class="lesson-number">{{ index + 1 }}</div>
                      <div class="lesson-info">
                        <h5>{{ lesson.title }}</h5>
                        <p v-if="lesson.description">{{ lesson.description }}</p>
                        <span class="lesson-duration" v-if="lesson.duration">{{ lesson.duration }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <footer class="modal-footer">
              <div class="instructor-info" v-if="selectedCourse.instructor">
                <img 
                  :src="selectedCourse.instructor.avatar || getDefaultAvatar()" 
                  :alt="selectedCourse.instructor.name" 
                  class="instructor-avatar-large"
                  loading="lazy"
                />
                <div class="instructor-details">
                  <h4>{{ selectedCourse.instructor.name }}</h4>
                  <p v-if="selectedCourse.instructor.bio">{{ selectedCourse.instructor.bio }}</p>
                </div>
              </div>
              
              <div class="modal-actions">
                <button 
                  class="bookmark-btn-large" 
                  @click="toggleBookmark(selectedCourse)"
                  type="button"
                >
                  {{ selectedCourse.isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное' }}
                </button>
                <button 
                  class="start-btn-large"
                  :class="{ 'premium-btn': selectedCourse.isPremium && !hasAccessToCourse(selectedCourse) }"
                  @click="handleCourseStart(selectedCourse)"
                  type="button"
                >
                  <span v-if="selectedCourse.isPremium && !hasAccessToCourse(selectedCourse)">
                    🔒 Требуется PRO
                  </span>
                  <span v-else>Начать обучение</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      </Teleport>
  
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
  import PaymentModal from '@/components/Modals/PaymentModal.vue';
  import { mapState, mapGetters } from 'vuex';
  
  export default {
    name: 'UpdatedCourses',
    
    components: {
      PaymentModal
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
      ...mapState(['user']),
      ...mapGetters('user', ['userStatus', 'isPremiumUser', 'isStartUser', 'isProUser']),
  
      currentUserId() {
        return this.user?.uid || this.$store.getters['user/getUserId'] || localStorage.getItem('firebaseUserId');
      },
  
      currentUserPlan() {
        const storeStatus = this.userStatus;
        const localStatus = localStorage.getItem('userStatus');
        const subscriptionData = localStorage.getItem('subscriptionData');
        
        let subscriptionPlan = null;
        if (subscriptionData) {
          try {
            const parsed = JSON.parse(subscriptionData);
            if (parsed.plan && parsed.expiryDate) {
              const now = new Date();
              const expiry = new Date(parsed.expiryDate);
              if (now < expiry && parsed.plan !== 'free') {
                subscriptionPlan = parsed.plan;
              }
            }
          } catch (e) {
            console.error('Error parsing subscription data:', e);
          }
        }
        
        return subscriptionPlan || storeStatus || localStatus || 'free';
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
            course.description?.toLowerCase().includes(query) ||
            course.tools?.some(tool => tool.toLowerCase().includes(query))
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
          case 'difficulty':
            const difficultyOrder = { 'Начинающий': 1, 'Средний': 2, 'Продвинутый': 3 };
            return courses.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
          case 'newest':
          default:
            return courses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
      },
  
      totalDuration() {
        return this.filteredCourses.reduce((total, course) => {
          return total + this.parseDuration(course.duration);
        }, 0);
      },
  
      hasActiveFilters() {
        return !!(this.selectedCategory || this.selectedDifficulty || this.searchQuery);
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
  
    beforeUnmount() {
      // Cleanup
      document.body.style.overflow = 'auto';
    },
  
    methods: {
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        
        try {
          // Fallback data if API fails
          const fallbackCourses = [
            {
              id: '1',
              title: 'Создание ИИ-помощника с ChatGPT API',
              description: 'Научитесь создавать собственного ИИ-помощника используя современные API и инструменты',
              category: 'ИИ и автоматизация',
              difficulty: 'Средний',
              duration: '4 часа',
              thumbnail: null,
              isPremium: false,
              studentsCount: 1234,
              rating: 4.8,
              tools: ['ChatGPT API', 'Python', 'Flask'],
              instructor: {
                name: 'Алексей Иванов',
                avatar: null,
                bio: 'Эксперт по машинному обучению'
              },
              curriculum: [
                { title: 'Введение в ИИ-API', description: 'Основы работы с API', duration: '30 мин' },
                { title: 'Настройка окружения', description: 'Подготовка рабочего места', duration: '45 мин' }
              ],
              fullDescription: 'Полный курс по созданию ИИ-помощника с использованием современных технологий.',
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
              thumbnail: null,
              isPremium: true,
              studentsCount: 567,
              rating: 4.9,
              tools: ['DaVinci Resolve', 'Color Grading', 'Audio Processing'],
              instructor: {
                name: 'Мария Петрова',
                avatar: null,
                bio: 'Профессиональный видеомонтажер'
              },
              curriculum: [
                { title: 'Основы DaVinci Resolve', description: 'Интерфейс и базовые операции', duration: '1 час' },
                { title: 'Цветокоррекция', description: 'Профессиональная цветокоррекция', duration: '2 часа' }
              ],
              fullDescription: 'Комплексный курс по профессиональному видеомонтажу в DaVinci Resolve.',
              createdAt: '2024-01-10T00:00:00Z',
              isBookmarked: false
            }
          ];
  
          // Try to fetch from API
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/updated-courses`, {
              headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`,
                'Content-Type': 'application/json'
              }
            });
  
            if (response.ok) {
              const data = await response.json();
              this.courses = data.courses || fallbackCourses;
            } else {
              console.warn('API request failed, using fallback data');
              this.courses = fallbackCourses;
            }
          } catch (apiError) {
            console.warn('API error, using fallback data:', apiError);
            this.courses = fallbackCourses;
          }
          
          // Clear cache when new data arrives
          this.categoriesCache = [];
          this.difficultiesCache = [];
          
        } catch (error) {
          console.error('Error fetching courses:', error);
          this.error = error.message || 'Произошла ошибка при загрузке курсов';
        } finally {
          this.loading = false;
        }
      },
  
      async toggleBookmark(course) {
        if (!course) return;
        
        try {
          const wasBookmarked = course.isBookmarked;
          
          // Optimistic update
          course.isBookmarked = !wasBookmarked;
          
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${course.id || course._id}/bookmark`, {
            method: wasBookmarked ? 'DELETE' : 'POST',
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
            // Revert on failure
            course.isBookmarked = wasBookmarked;
            throw new Error('Не удалось обновить закладку');
          }
          
          if (this.$toast) {
            const message = course.isBookmarked ? 
              'Курс добавлен в избранное' : 
              'Курс удален из избранного';
            this.$toast.success(message, { duration: 2000 });
          }
        } catch (error) {
          console.error('Error toggling bookmark:', error);
          if (this.$toast) {
            this.$toast.error('Ошибка при обновлении избранного');
          }
        }
      },
  
      getAuthToken() {
        return localStorage.getItem('authToken') || '';
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
          this.closeCourseModal();
          return;
        }
        
        this.startCourse(course);
      },
  
      startCourse(course) {
        if (!course) return;
        
        if (this.$toast) {
          this.$toast.success(`Начинаем курс: ${course.title}`, {
            duration: 3000,
            position: 'top-center'
          });
        }
        
        // Navigate to course content
        if (this.$router) {
          this.$router.push({ 
            name: 'CourseContent', 
            params: { courseId: course.id || course._id } 
          }).catch(err => {
            console.error('Navigation error:', err);
            // Fallback: open course in new tab or show modal with course info
            this.showCourseInfo(course);
          });
        } else {
          this.showCourseInfo(course);
        }
        
        this.closeCourseModal();
      },
  
      showCourseInfo(course) {
        // Fallback method to show course information
        alert(`Курс: ${course.title}\nОписание: ${course.description}`);
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
  
      // Modal methods
      openCourse(course) {
        if (!course) return;
        
        this.selectedCourse = course;
        document.body.style.overflow = 'hidden';
      },
  
      closeCourseModal() {
        this.selectedCourse = null;
        document.body.style.overflow = 'auto';
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
            this.startCourse(course);
          }, 1000);
        }
        
        if (data.plan) {
          this.$store.commit('user/SET_USER_STATUS', data.plan);
          localStorage.setItem('userStatus', data.plan);
        }
      },
  
      handlePaymentInitiated(data) {
        this.closePaymentModal();
      },
  
      // Image handling methods
      handleImageError(event) {
        const img = event.target;
        const category = img.closest('.course-card')?.querySelector('.course-category')?.textContent || 'default';
        img.src = this.getDefaultThumbnail(category);
      },
  
      handleAvatarError(event) {
        event.target.src = this.getDefaultAvatar();
      },
  
      getDefaultThumbnail(category) {
        // Return a simple gradient background as fallback
        return `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="400" height="200" fill="url(#grad)" />
            <text x="200" y="100" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${this.getCategoryIcon(category)}</text>
          </svg>
        `)}`;
      },
  
      getDefaultAvatar() {
        return `data:image/svg+xml;base64,${btoa(`
          <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="30" fill="#e5e7eb"/>
            <circle cx="30" cy="25" r="8" fill="#9ca3af"/>
            <path d="M30 35c-8 0-15 4-15 10v5h30v-5c0-6-7-10-15-10z" fill="#9ca3af"/>
          </svg>
        `)}`;
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
      }
    }
  };
  </script>
  
  <style scoped>
  /* CSS Variables for consistent theming */
  :root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #f59e0b;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;
    --background-primary: #ffffff;
    --background-secondary: #f8fafc;
    --background-tertiary: #f3f4f6;
    --border-color: #e5e7eb;
    --border-light: #d1d5db;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.15);
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
  }
  
  /* Base Styles */
  .updated-courses-container {
    min-height: 100vh;
    background: var(--background-secondary);
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }
  
  /* Hero Section */
  .hero-section {
    background: var(--primary-gradient);
    padding: var(--spacing-2xl) 0;
    color: white;
  }
  
  .hero-content {
    text-align: center;
  }
  
  .hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    margin-bottom: var(--spacing-md);
    line-height: 1.1;
  }
  
  .gradient-text {
    background: linear-gradient(45deg, #ffffff, #e0e7ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-subtitle {
    font-size: clamp(1rem, 3vw, 1.25rem);
    margin-bottom: var(--spacing-xl);
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .hero-stats {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xl);
    flex-wrap: wrap;
  }
  
  .stat-item {
    text-align: center;
    padding: var(--spacing-md);
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(10px);
    min-width: 100px;
    transition: transform 0.2s ease;
  }
  
  .stat-item:hover {
    transform: translateY(-2px);
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
  
  /* Filters Section */
  .filters-section {
    padding: var(--spacing-xl) 0;
    background: var(--background-primary);
    border-bottom: 1px solid var(--border-color);
  }
  
  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }
  
  .filters-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  
  .clear-filters-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .clear-filters-btn:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
  
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-label {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.9rem;
  }
  
  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .filter-chip {
    background: var(--background-tertiary);
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    padding: var(--spacing-sm) 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  
  .filter-chip:hover {
    background: var(--border-color);
    transform: translateY(-1px);
  }
  
  .filter-chip.active {
    background: var(--primary-gradient);
    color: white;
    box-shadow: var(--shadow-sm);
  }
  
  .search-group {
    grid-column: 1 / -1;
  }
  
  .search-input-container {
    position: relative;
  }
  
  .search-input {
    width: 100%;
    padding: 0.75rem var(--spacing-md) 0.75rem 2.5rem;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    font-size: 1rem;
    transition: all 0.2s ease;
    background: var(--background-primary);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }
  
  /* Loading Section */
  .loading-section {
    padding: var(--spacing-xl) 0;
  }
  
  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .course-skeleton {
    background: var(--background-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  
  .skeleton-image {
    height: 200px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  .skeleton-content {
    padding: var(--spacing-md);
  }
  
  .skeleton-title,
  .skeleton-text,
  .skeleton-footer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 0.75rem;
  }
  
  .skeleton-title {
    height: 1.25rem;
  }
  
  .skeleton-text {
    height: 1rem;
  }
  
  .skeleton-text:last-child {
    width: 60%;
  }
  
  .skeleton-footer {
    height: 2rem;
    margin-top: var(--spacing-md);
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Error Section */
  .error-section {
    padding: var(--spacing-2xl) 0;
  }
  
  .error-content {
    text-align: center;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .error-content h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
  }
  
  .error-content p {
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
  }
  
  .retry-btn {
    background: var(--primary-gradient);
    color: white;
    border: none;
    padding: 0.75rem var(--spacing-lg);
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .retry-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  /* Courses Section */
  .courses-section {
    padding: var(--spacing-xl) 0 var(--spacing-2xl);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
    flex-wrap: wrap;
    gap: var(--spacing-md);
  }
  
  .section-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
  
  .sort-select {
    padding: var(--spacing-sm) 0.75rem;
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background: var(--background-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  
  .sort-select:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  /* Courses Grid */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .course-card {
    background: var(--background-primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
  }
  
  .course-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-color);
  }
  
  .course-card:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .course-card.premium-course {
    border-color: var(--accent-color);
  }
  
  .course-card.premium-course:hover {
    border-color: var(--accent-color);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
  }
  
  /* Course Image */
  .course-image {
    position: relative;
    height: 200px;
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
    top: var(--spacing-md);
    left: var(--spacing-md);
    right: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .course-category {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: var(--spacing-xs) 0.75rem;
    border-radius: var(--radius-lg);
    font-size: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }
  
  .premium-badge {
    background: linear-gradient(135deg, var(--accent-color), #d97706);
    color: white;
    padding: var(--spacing-xs) 0.75rem;
    border-radius: var(--radius-lg);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  
  .course-difficulty {
    position: absolute;
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    font-weight: bold;
  }
  
  .course-difficulty.beginner {
    color: #059669;
  }
  
  .course-difficulty.intermediate {
    color: #d97706;
  }
  
  .course-difficulty.advanced {
    color: #dc2626;
  }
  
  /* Course Content */
  .course-content {
    padding: 1.25rem;
  }
  
  .course-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.75rem;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .course-description {
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0 0 var(--spacing-md);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.875rem;
  }
  
  .course-meta {
    margin-bottom: var(--spacing-md);
  }
  
  .course-tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-bottom: 0.75rem;
  }
  
  .tool-tag {
    background: var(--primary-gradient);
    color: white;
    padding: 0.125rem var(--spacing-sm);
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .tool-more {
    background: var(--background-tertiary);
    color: var(--text-secondary);
    padding: 0.125rem var(--spacing-sm);
    border-radius: var(--radius-md);
    font-size: 0.7rem;
    font-weight: 600;
  }
  
  .course-stats {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }
  
  .stat {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .stat-icon {
    font-size: 0.875rem;
  }
  
  /* Course Footer */
  .course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .course-instructor {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
    min-width: 0;
  }
  
  .instructor-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .instructor-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .course-actions {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    flex-shrink: 0;
  }
  
  /* Buttons */
  .bookmark-btn {
    background: var(--background-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.375rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 1rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .bookmark-btn:hover {
    background: var(--border-color);
    transform: scale(1.1);
  }
  
  .start-btn {
    background: var(--primary-gradient);
    color: white;
    border: none;
    padding: var(--spacing-sm) 0.75rem;
    border-radius: var(--radius-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  
  .start-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .start-btn.premium-btn {
    background: linear-gradient(135deg, var(--accent-color), #d97706);
  }
  
  .start-btn.premium-btn:hover {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  .bookmark-btn-large,
  .start-btn-large {
    padding: 0.75rem var(--spacing-lg);
    font-size: 1rem;
    border-radius: var(--radius-md);
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: var(--spacing-2xl) var(--spacing-md);
    color: var(--text-secondary);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
    margin: 0 0 var(--spacing-sm);
    color: var(--text-primary);
  }
  
  .empty-state p {
    margin: 0 0 var(--spacing-lg);
  }
  
  /* Course Modal */
  .course-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-md);
    backdrop-filter: blur(5px);
  }
  
  .course-modal {
    background: var(--background-primary);
    border-radius: var(--radius-xl);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--primary-gradient);
    color: white;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  .modal-content {
    padding: var(--spacing-lg);
  }
  
  .modal-image {
    position: relative;
    border-radius: var(--radius-lg);
    overflow: hidden;
    margin-bottom: var(--spacing-lg);
  }
  
  .modal-image img {
    width: 100%;
    height: 250px;
    object-fit: cover;
  }
  
  .modal-premium-badge {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: linear-gradient(135deg, var(--accent-color), #d97706);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 700;
  }
  
  .course-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--background-secondary);
    border-radius: var(--radius-lg);
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .detail-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 600;
  }
  
  .detail-value {
    font-size: 1rem;
    color: var(--text-primary);
    font-weight: 700;
  }
  
  .course-full-description {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-lg);
  }
  
  .course-tools-list h4,
  .course-curriculum h4 {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-md);
  }
  
  .tools-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }
  
  .tool-tag-large {
    background: var(--primary-gradient);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius-lg);
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .curriculum-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .curriculum-item {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--background-secondary);
    border-radius: var(--radius-lg);
    transition: background-color 0.2s ease;
  }
  
  .curriculum-item:hover {
    background: var(--border-color);
  }
  
  .lesson-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary-gradient);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    flex-shrink: 0;
  }
  
  .lesson-info h5 {
    margin: 0 0 var(--spacing-xs);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .lesson-info p {
    margin: 0 0 var(--spacing-xs);
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .lesson-duration {
    font-size: 0.8rem;
    color: var(--primary-color);
    font-weight: 600;
  }
  
  .modal-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--border-color);
    background: var(--background-secondary);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }
  
  .instructor-info {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-md);
    background: var(--background-primary);
    border-radius: var(--radius-lg);
  }
  
  .instructor-avatar-large {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  
  .instructor-details h4 {
    margin: 0 0 var(--spacing-xs);
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  
  .instructor-details p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .modal-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .container {
      padding: 0 var(--spacing-md);
    }
  
    .hero-section {
      padding: var(--spacing-xl) 0;
    }
  
    .hero-stats {
      gap: var(--spacing-md);
    }
  
    .filters-grid {
      grid-template-columns: 1fr;
    }
  
    .courses-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
  
    .course-modal {
      margin: var(--spacing-sm);
      max-height: 95vh;
    }
  
    .modal-content {
      padding: var(--spacing-md);
    }
  
    .course-details {
      grid-template-columns: 1fr;
    }
  
    .modal-actions {
      flex-direction: column;
    }
  
    .instructor-info {
      flex-direction: column;
      text-align: center;
    }
  
    .section-header {
      flex-direction: column;
      gap: var(--spacing-md);
      align-items: stretch;
    }
  
    .course-footer {
      flex-direction: column;
      gap: var(--spacing-sm);
      align-items: stretch;
    }
  
    .course-actions {
      justify-content: space-between;
    }
  }
  
  @media (max-width: 480px) {
    .hero-section {
      padding: var(--spacing-lg) 0;
    }
  
    .course-card {
      margin: 0;
    }
  
    .course-actions {
      flex-direction: row;
      gap: var(--spacing-xs);
    }
  
    .start-btn {
      font-size: 0.75rem;
      padding: 0.375rem var(--spacing-sm);
    }
  
    .course-modal {
      margin: 0;
      border-radius: 0;
      max-height: 100vh;
    }
  
    .modal-header {
      border-radius: 0;
    }
  
    .modal-footer {
      border-radius: 0;
    }
  
    .filters-header {
      flex-direction: column;
      align-items: stretch;
    }
  
    .clear-filters-btn {
      width: 100%;
    }
  }
  
  /* Accessibility Improvements */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Focus indicators for keyboard navigation */
  .filter-chip:focus,
  .course-card:focus,
  .bookmark-btn:focus,
  .start-btn:focus,
  .retry-btn:focus,
  .clear-filters-btn:focus,
  .close-btn:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  
  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .course-card {
      border: 2px solid var(--text-primary);
    }
    
    .filter-chip.active {
      border: 2px solid var(--background-primary);
    }
  }
  
  /* Print styles */
  @media print {
    .hero-section,
    .filters-section,
    .course-modal-overlay {
      display: none;
    }
    
    .course-card {
      break-inside: avoid;
      box-shadow: none;
      border: 1px solid #000;
    }
  }
</style>