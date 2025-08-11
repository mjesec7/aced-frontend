<template>
    <div class="courses-page">
      <!-- Modern Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="hero-pattern"></div>
        </div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-icon">🚀</span>
            <span>Актуальные курсы 2025</span>
          </div>
          <h1 class="hero-title">
            Изучай будущее<br>
            <span class="accent">уже сегодня</span>
          </h1>
          <p class="hero-description">
            Освой новейшие технологии с экспертами индустрии. От ИИ до современной разработки — все в одном месте.
          </p>
          <div class="hero-metrics">
            <div class="metric">
              <div class="metric-number">{{ filteredCourses.length }}+</div>
              <div class="metric-label">Курсов</div>
            </div>
            <div class="metric">
              <div class="metric-number">{{ totalDuration }}ч</div>
              <div class="metric-label">Контента</div>
            </div>
            <div class="metric">
              <div class="metric-number">{{ availableCategories.length }}</div>
              <div class="metric-label">Направлений</div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Search and Filters -->
      <section class="search-section">
        <div class="container">
          <div class="search-container">
            <div class="search-box">
              <div class="search-input-wrapper">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Поиск курсов..." 
                  class="search-input"
                />
                <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="filters">
              <div class="filter-group">
                <button 
                  class="filter-toggle"
                  @click="showFilters = !showFilters"
                  :class="{ active: showFilters }"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
                  </svg>
                  Фильтры
                  <span v-if="activeFiltersCount" class="filter-count">{{ activeFiltersCount }}</span>
                </button>
              </div>
              
              <div class="sort-group">
                <select v-model="sortBy" class="sort-select">
                  <option value="newest">Новые</option>
                  <option value="popular">Популярные</option>
                  <option value="duration">По времени</option>
                  <option value="difficulty">По сложности</option>
                </select>
              </div>
            </div>
          </div>
  
          <!-- Expandable Filters -->
          <div v-if="showFilters" class="filters-panel">
            <div class="filter-section">
              <h3>Категория</h3>
              <div class="filter-chips">
                <button 
                  v-for="category in availableCategories" 
                  :key="category"
                  @click="toggleCategory(category)"
                  class="filter-chip"
                  :class="{ active: selectedCategory === category }"
                >
                  {{ getCategoryIcon(category) }}
                  {{ category }}
                </button>
              </div>
            </div>
  
            <div class="filter-section">
              <h3>Уровень</h3>
              <div class="filter-chips">
                <button 
                  v-for="level in availableDifficulties" 
                  :key="level"
                  @click="toggleDifficulty(level)"
                  class="filter-chip"
                  :class="{ active: selectedDifficulty === level }"
                >
                  {{ getDifficultyIcon(level) }}
                  {{ level }}
                </button>
              </div>
            </div>
  
            <div class="filter-actions">
              <button @click="clearAllFilters" class="clear-btn">
                Очистить все
              </button>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Loading State -->
      <section v-if="loading" class="content-section">
        <div class="container">
          <div class="courses-grid">
            <div v-for="n in 6" :key="n" class="course-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Error State -->
      <section v-else-if="error" class="content-section">
        <div class="container">
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Упс! Что-то пошло не так</h3>
            <p>{{ error }}</p>
            <button @click="fetchCourses" class="retry-btn">
              Попробовать снова
            </button>
          </div>
        </div>
      </section>
  
      <!-- Courses Grid -->
      <section v-else class="content-section">
        <div class="container">
          <div v-if="filteredCourses.length > 0" class="courses-header">
            <h2>{{ getSectionTitle() }}</h2>
            <div class="view-toggle">
              <button 
                @click="viewMode = 'grid'" 
                :class="{ active: viewMode === 'grid' }"
                class="view-btn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button 
                @click="viewMode = 'list'" 
                :class="{ active: viewMode === 'list' }"
                class="view-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
  
          <div v-if="filteredCourses.length > 0" class="courses-grid" :class="viewMode">
            <article 
              v-for="course in sortedCourses" 
              :key="course.id"
              class="course-card"
              :class="{ premium: course.isPremium }"
              @click="openCourse(course)"
            >
              <div class="course-image">
                <img :src="course.thumbnail || '/api/placeholder/400/250'" :alt="course.title" />
                <div class="course-badges">
                  <span class="category-badge">{{ course.category }}</span>
                  <span v-if="course.isPremium" class="premium-badge">PRO</span>
                </div>
                <div class="difficulty-indicator" :class="getDifficultyClass(course.difficulty)">
                  {{ getDifficultyIcon(course.difficulty) }}
                </div>
              </div>
              
              <div class="course-info">
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>
                
                <div class="course-tags" v-if="course.tools && course.tools.length">
                  <span 
                    v-for="tool in course.tools.slice(0, 2)" 
                    :key="tool"
                    class="tag"
                  >
                    {{ tool }}
                  </span>
                  <span v-if="course.tools.length > 2" class="tag more">
                    +{{ course.tools.length - 2 }}
                  </span>
                </div>
                
                <div class="course-meta">
                  <div class="meta-item" v-if="course.duration">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    {{ course.duration }}
                  </div>
                  <div class="meta-item" v-if="course.studentsCount">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {{ formatNumber(course.studentsCount) }}
                  </div>
                  <div class="meta-item" v-if="course.rating">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                    </svg>
                    {{ course.rating }}
                  </div>
                </div>
              </div>
  
              <div class="course-footer">
                <div class="instructor" v-if="course.instructor">
                  <img 
                    :src="course.instructor.avatar || '/api/placeholder/32/32'" 
                    :alt="course.instructor.name"
                    class="instructor-avatar"
                  />
                  <span class="instructor-name">{{ course.instructor.name }}</span>
                </div>
                
                <div class="course-actions">
                  <button 
                    @click.stop="toggleBookmark(course)"
                    class="action-btn bookmark"
                    :class="{ bookmarked: course.isBookmarked }"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                  <button 
                    @click.stop="handleCourseStart(course)"
                    class="start-btn"
                    :class="{ premium: course.isPremium && !hasAccessToCourse(course) }"
                  >
                    <span v-if="course.isPremium && !hasAccessToCourse(course)">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <circle cx="12" cy="16" r="1"></circle>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      PRO
                    </span>
                    <span v-else>Начать</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
  
          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 200 200" fill="none">
                <circle cx="100" cy="100" r="80" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="5,5"/>
                <path d="M70 85 Q100 65 130 85" stroke="#9ca3af" stroke-width="2" fill="none"/>
                <circle cx="85" cy="95" r="3" fill="#9ca3af"/>
                <circle cx="115" cy="95" r="3" fill="#9ca3af"/>
              </svg>
            </div>
            <h3>Курсы не найдены</h3>
            <p>Попробуйте изменить критерии поиска</p>
            <button @click="clearAllFilters" class="reset-btn">
              Сбросить фильтры
            </button>
          </div>
        </div>
      </section>
  
      <!-- Course Detail Modal -->
      <div v-if="selectedCourse" class="modal-overlay" @click="closeCourseModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <div class="modal-title-section">
              <h2>{{ selectedCourse.title }}</h2>
              <div class="modal-badges">
                <span class="modal-category">{{ selectedCourse.category }}</span>
                <span v-if="selectedCourse.isPremium" class="modal-premium">PRO</span>
              </div>
            </div>
            <button @click="closeCourseModal" class="modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="modal-image">
              <img :src="selectedCourse.thumbnail || '/api/placeholder/600/300'" :alt="selectedCourse.title" />
            </div>
            
            <div class="modal-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Уровень</span>
                  <span class="detail-value">{{ selectedCourse.difficulty }}</span>
                </div>
                <div class="detail-item" v-if="selectedCourse.duration">
                  <span class="detail-label">Длительность</span>
                  <span class="detail-value">{{ selectedCourse.duration }}</span>
                </div>
                <div class="detail-item" v-if="selectedCourse.studentsCount">
                  <span class="detail-label">Студентов</span>
                  <span class="detail-value">{{ formatNumber(selectedCourse.studentsCount) }}</span>
                </div>
                <div class="detail-item" v-if="selectedCourse.rating">
                  <span class="detail-label">Рейтинг</span>
                  <span class="detail-value">{{ selectedCourse.rating }} ⭐</span>
                </div>
              </div>
              
              <div class="description-section">
                <h3>О курсе</h3>
                <p>{{ selectedCourse.fullDescription || selectedCourse.description }}</p>
              </div>
              
              <div v-if="selectedCourse.tools && selectedCourse.tools.length" class="tools-section">
                <h3>Технологии</h3>
                <div class="tools-list">
                  <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-badge">
                    {{ tool }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <div class="instructor-section" v-if="selectedCourse.instructor">
              <img 
                :src="selectedCourse.instructor.avatar || '/api/placeholder/48/48'" 
                :alt="selectedCourse.instructor.name"
                class="instructor-avatar-large"
              />
              <div class="instructor-info">
                <h4>{{ selectedCourse.instructor.name }}</h4>
                <p v-if="selectedCourse.instructor.bio">{{ selectedCourse.instructor.bio }}</p>
              </div>
            </div>
            
            <div class="modal-actions">
              <button 
                @click="toggleBookmark(selectedCourse)"
                class="modal-btn secondary"
              >
                {{ selectedCourse.isBookmarked ? 'Убрать из избранного' : 'В избранное' }}
              </button>
              <button 
                @click="handleCourseStart(selectedCourse)"
                class="modal-btn primary"
                :class="{ premium: selectedCourse.isPremium && !hasAccessToCourse(selectedCourse) }"
              >
                <span v-if="selectedCourse.isPremium && !hasAccessToCourse(selectedCourse)">
                  🔒 Требуется PRO
                </span>
                <span v-else>Начать обучение</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Payment Modal -->
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
        // UI State
        showFilters: false,
        viewMode: 'grid', // 'grid' or 'list'
        
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
  
      activeFiltersCount() {
        let count = 0;
        if (this.selectedCategory) count++;
        if (this.selectedDifficulty) count++;
        return count;
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
      }
    },
  
    async mounted() {
      await this.fetchCourses();
      // Set up responsive view mode
      this.updateViewMode();
      window.addEventListener('resize', this.updateViewMode);
    },
  
    beforeUnmount() {
      window.removeEventListener('resize', this.updateViewMode);
      document.body.style.overflow = 'auto';
    },
  
    methods: {
      updateViewMode() {
        // Auto-switch to list view on mobile
        if (window.innerWidth < 768) {
          this.viewMode = 'list';
        }
      },
  
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        
        try {
          // Mock data for demo - replace with your API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          this.courses = [
            {
              id: 1,
              title: "Создание ИИ-помощников с GPT-4",
              description: "Изучите, как создавать умных ботов и автоматизировать бизнес-процессы",
              category: "ИИ и автоматизация",
              difficulty: "Средний",
              duration: "12 часов",
              studentsCount: 2847,
              rating: 4.8,
              isPremium: true,
              thumbnail: "/api/placeholder/400/250",
              tools: ["OpenAI API", "Python", "FastAPI", "React"],
              instructor: {
                name: "Алексей Петров",
                avatar: "/api/placeholder/32/32",
                bio: "Senior AI Engineer в Яндексе"
              },
              isBookmarked: false,
              createdAt: "2025-01-01"
            },
            {
              id: 2,
              title: "Современный видеомонтаж в DaVinci Resolve",
              description: "От базовых навыков до профессиональной цветокоррекции",
              category: "Видеомонтаж",
              difficulty: "Начинающий",
              duration: "8 часов",
              studentsCount: 1523,
              rating: 4.6,
              isPremium: false,
              thumbnail: "/api/placeholder/400/250",
              tools: ["DaVinci Resolve", "After Effects"],
              instructor: {
                name: "Мария Сидорова",
                avatar: "/api/placeholder/32/32"
              },
              isBookmarked: true,
              createdAt: "2024-12-15"
            },
            {
              id: 3,
              title: "Web-разработка с Next.js 14",
              description: "Создайте современное веб-приложение с новейшими возможностями",
              category: "Web-разработка",
              difficulty: "Продвинутый",
              duration: "16 часов",
              studentsCount: 892,
              rating: 4.9,
              isPremium: true,
              thumbnail: "/api/placeholder/400/250",
              tools: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma"],
              instructor: {
                name: "Дмитрий Козлов",
                avatar: "/api/placeholder/32/32"
              },
              isBookmarked: false,
              createdAt: "2024-12-20"
            }
          ];
          
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
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          course.isBookmarked = !course.isBookmarked;
          
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
  
      formatNumber(num) {
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
        if (!course.isPremium) return true;
        const plan = this.currentUserPlan;
        return ['start', 'pro'].includes(plan);
      },
  
      handleCourseStart(course) {
        if (course.isPremium && !this.hasAccessToCourse(course)) {
          this.selectedCourseId = course.id.toString();
          this.requiredPlan = 'pro';
          this.showPaymentModal = true;
          this.closeCourseModal();
          return;
        }
        
        this.startCourse(course);
      },
  
      startCourse(course) {
        if (this.$toast) {
          this.$toast.success(`Начинаем курс: ${course.title}`, {
            duration: 3000,
            position: 'top-center'
          });
        }
        
        this.closeCourseModal();
      },
  
      // Filter methods
      toggleCategory(category) {
        this.selectedCategory = this.selectedCategory === category ? '' : category;
      },
  
      toggleDifficulty(difficulty) {
        this.selectedDifficulty = this.selectedDifficulty === difficulty ? '' : difficulty;
      },
  
      clearAllFilters() {
        this.selectedCategory = '';
        this.selectedDifficulty = '';
        this.searchQuery = '';
        this.showFilters = false;
      },
  
      // Modal methods
      openCourse(course) {
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
        
        const course = this.courses.find(c => c.id.toString() === this.selectedCourseId);
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
        return difficulty?.toLowerCase().replace(/[^a-zа-я]/g, '') || '';
      },
  
      getSectionTitle() {
        if (this.searchQuery || this.selectedCategory || this.selectedDifficulty) {
          return `Найдено курсов: ${this.filteredCourses.length}`;
        }
        return 'Все актуальные курсы';
      }
    }
  };
  </script>
  
  <style scoped>
  /* CSS Custom Properties */
:root {
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base Styles */
.courses-page {
  min-height: 100vh;
  background: var(--gray-50);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Hero Section */
.hero {
  position: relative;
  background: var(--gradient-primary);
  padding: 4rem 0 6rem;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  opacity: 0.1;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, white 2px, transparent 2px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  color: white;
  padding: 0 1rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.badge-icon {
  font-size: 1rem;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 1.5rem;
}

.accent {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 0 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-metrics {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.metric {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 120px;
}

.metric-number {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  opacity: 0.8;
  font-weight: 500;
}

/* Search Section */
.search-section {
  position: relative;
  z-index: 10;
  margin-top: -3rem;
  padding: 0 0 2rem;
}

.search-container {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--gray-200);
}

.search-box {
  margin-bottom: 1rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: var(--gray-400);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  font-size: 1rem;
  transition: var(--transition);
  background: var(--gray-50);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-500);
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--gray-300);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  z-index: 2;
}

.clear-search:hover {
  background: var(--gray-400);
}

.clear-search svg {
  width: 14px;
  height: 14px;
  color: white;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
  position: relative;
}

.filter-toggle:hover,
.filter-toggle.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
  color: var(--primary-700);
}

.filter-toggle svg {
  width: 18px;
  height: 18px;
}

.filter-count {
  background: var(--primary-500);
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 50px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}

.sort-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
}

.sort-select:focus {
  outline: none;
  border-color: var(--primary-500);
}

/* Filters Panel */
.filters-panel {
  margin-top: 1rem;
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--gray-200);
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-of-type {
  margin-bottom: 0;
}

.filter-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 0.75rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 2px solid var(--gray-200);
  border-radius: 50px;
  background: white;
  cursor: pointer;
  transition: var(--transition);
  font-weight: 600;
  font-size: 0.875rem;
}

.filter-chip:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
}

.filter-chip.active {
  border-color: var(--primary-500);
  background: var(--primary-500);
  color: white;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.clear-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--error-500);
  color: white;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.clear-btn:hover {
  background: #dc2626;
}

/* Content Section */
.content-section {
  padding: 2rem 0 4rem;
}

.courses-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.courses-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gray-800);
  margin: 0;
}

.view-toggle {
  display: flex;
  background: var(--gray-200);
  border-radius: var(--border-radius);
  padding: 0.25rem;
}

.view-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: calc(var(--border-radius) - 2px);
  cursor: pointer;
  transition: var(--transition);
  color: var(--gray-500);
}

.view-btn.active {
  background: white;
  color: var(--gray-800);
  box-shadow: var(--shadow-sm);
}

.view-btn svg {
  width: 18px;
  height: 18px;
}

/* Courses Grid */
.courses-grid {
  display: grid;
  gap: 1.5rem;
}

.courses-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.courses-grid.list {
  grid-template-columns: 1fr;
}

.courses-grid.list .course-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.courses-grid.list .course-image {
  width: 200px;
  flex-shrink: 0;
}

.courses-grid.list .course-info {
  flex: 1;
}

/* Course Cards */
.course-card {
  background: white;
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  transition: var(--transition);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-200);
}

.course-card.premium {
  border-color: var(--warning-500);
  border-width: 2px;
}

.course-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.course-card:hover .course-image img {
  transform: scale(1.05);
}

.course-badges {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.category-badge {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.premium-badge {
  background: var(--gradient-secondary);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.difficulty-indicator {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.course-info {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 0.75rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-description {
  color: var(--gray-600);
  line-height: 1.5;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.tag {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 0.25rem 0.625rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tag.more {
  background: var(--gray-200);
  color: var(--gray-600);
}

.course-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--gray-500);
  font-weight: 500;
}

.meta-item svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.instructor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.instructor-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gray-200);
}

.instructor-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  padding: 0.5rem;
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  border-color: var(--gray-300);
  background: var(--gray-50);
}

.action-btn.bookmark.bookmarked {
  border-color: var(--error-500);
  background: var(--error-50);
  color: var(--error-500);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.start-btn {
  padding: 0.625rem 1rem;
  border: none;
  border-radius: var(--border-radius);
  background: var(--gradient-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.start-btn.premium {
  background: var(--gradient-secondary);
}

.start-btn svg {
  width: 16px;
  height: 16px;
}

/* Loading State */
.course-skeleton {
  background: white;
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-300) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1.5rem;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-300) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-600);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 0.5rem;
}

.error-state p {
  margin: 0 0 2rem;
  font-size: 1.125rem;
}

.retry-btn {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  background: var(--gradient-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--gray-600);
}

.empty-illustration {
  margin-bottom: 2rem;
}

.empty-illustration svg {
  width: 120px;
  height: 120px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 0.5rem;
}

.empty-state p {
  margin: 0 0 2rem;
  font-size: 1.125rem;
}

.reset-btn {
  padding: 0.875rem 1.5rem;
  border: 2px solid var(--primary-500);
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--primary-500);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
}

.reset-btn:hover {
  background: var(--primary-500);
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: var(--border-radius-xl);
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 2rem;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.modal-title-section h2 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.75rem;
  line-height: 1.2;
}

.modal-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.modal-category {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.modal-premium {
  background: var(--gradient-secondary);
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-close svg {
  width: 24px;
  height: 24px;
}

.modal-content {
  padding: 2rem;
  flex: 1;
}

.modal-image {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  margin-bottom: 2rem;
}

.modal-image img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: var(--gray-50);
  border-radius: var(--border-radius-lg);
  margin-bottom: 2rem;
}

.detail-item {
  text-align: center;
}

.detail-label {
  display: block;
  font-size: 0.875rem;
  color: var(--gray-500);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-size: 1.125rem;
  color: var(--gray-800);
  font-weight: 700;
}

.description-section,
.tools-section {
  margin-bottom: 2rem;
}

.description-section h3,
.tools-section h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 1rem;
}

.description-section p {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--gray-700);
  margin: 0;
}

.tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-badge {
  background: var(--gradient-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 2rem;
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

.instructor-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--gray-200);
}

.instructor-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--gray-200);
  flex-shrink: 0;
}

.instructor-info h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 0.25rem;
}

.instructor-info p {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.875rem 1.5rem;
  border-radius: var(--border-radius);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-btn.secondary {
  border: 2px solid var(--gray-300);
  background: white;
  color: var(--gray-700);
}

.modal-btn.secondary:hover {
  border-color: var(--gray-400);
  background: var(--gray-50);
}

.modal-btn.primary {
  border: none;
  background: var(--gradient-primary);
  color: white;
}

.modal-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.modal-btn.premium {
  background: var(--gradient-secondary);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .courses-grid.grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .container {
    padding: 0 1.5rem;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 0 4rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-description {
    font-size: 1.125rem;
  }
  
  .hero-metrics {
    gap: 1rem;
  }
  
  .metric {
    padding: 1rem;
    min-width: 100px;
  }
  
  .metric-number {
    font-size: 1.5rem;
  }
  
  .search-container {
    padding: 1rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .courses-grid.grid {
    grid-template-columns: 1fr;
  }
  
  .courses-grid.list .course-card {
    flex-direction: column;
  }
  
  .courses-grid.list .course-image {
    width: 100%;
    height: 200px;
  }
  
  .courses-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .view-toggle {
    align-self: center;
  }
  
  .modal {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1.5rem;
  }
  
  .modal-content {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .instructor-section {
    flex-direction: column;
    text-align: center;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .detail-item {
    padding: 0.75rem;
    background: white;
    border-radius: var(--border-radius);
  }
  
  .container {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 2rem 0 3rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
  
  .hero-metrics {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .metric {
    width: 100%;
    max-width: 200px;
  }
  
  .search-input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .course-card {
    margin: 0 -0.5rem;
  }
  
  .course-info {
    padding: 1rem;
  }
  
  .course-footer {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .course-actions {
    justify-content: space-between;
  }
  
  .start-btn {
    flex: 1;
    justify-content: center;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-title-section h2 {
    font-size: 1.25rem;
  }
  
  .container {
    padding: 0 0.75rem;
  }
}

/* Animation for smooth transitions */
@media (prefers-reduced-motion: no-preference) {
  .course-card,
  .filter-chip,
  .action-btn,
  .start-btn,
  .modal-btn {
    transition: var(--transition);
  }
  
  .course-card:hover {
    animation: cardHover 0.3s ease-out;
  }
}

@keyframes cardHover {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(-4px);
  }
}

/* Focus styles for accessibility */
.search-input:focus,
.filter-toggle:focus,
.sort-select:focus,
.filter-chip:focus,
.action-btn:focus,
.start-btn:focus,
.modal-btn:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .course-card {
    border-width: 2px;
  }
  
  .filter-chip,
  .action-btn {
    border-width: 2px;
  }
  
  .start-btn {
    border: 2px solid var(--primary-700);
  }
}

/* Print styles */
@media print {
  .hero,
  .search-section,
  .modal-overlay {
    display: none;
  }
  
  .course-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid var(--gray-400);
  }
  
  .courses-grid {
    gap: 1rem;
  }
}

/* Dark mode support (if needed) */
@media (prefers-color-scheme: dark) {
  :root {
    --gray-50: #18181b;
    --gray-100: #27272a;
    --gray-200: #3f3f46;
    --gray-300: #52525b;
    --gray-400: #71717a;
    --gray-500: #a1a1aa;
    --gray-600: #d4d4d8;
    --gray-700: #e4e4e7;
    --gray-800: #f4f4f5;
    --gray-900: #fafafa;
  }
  
  .courses-page {
    background: var(--gray-50);
    color: var(--gray-800);
  }
  
  .course-card,
  .search-container,
  .filters-panel {
    background: var(--gray-100);
    border-color: var(--gray-300);
  }
}
  </style>