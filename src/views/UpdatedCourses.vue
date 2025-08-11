<template>
    <div class="updated-courses-container">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              <span class="gradient-text">Освойте навыки ИИ в 2024</span>
            </h1>
            <p class="hero-subtitle">
              Оставайтесь впереди с нашими передовыми курсами по ИИ. Получите неограниченный доступ к обучению по подписке и трансформируйте свою карьеру с помощью новейших технологий ИИ.
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
      </div>
  
      <!-- Filters Section -->
      <div class="filters-section">
        <div class="container">
          <div class="filters-header">
            <h2>Популярные курсы по ИИ</h2>
            <div class="courses-found-header">
              <p class="courses-found-text">{{ filteredCourses.length }} курсов найдено</p>
            </div>
          </div>
          
          <div class="filters-grid">
            <!-- Filter Tabs -->
            <div class="filter-group">
              <div class="filter-options">
                <button 
                  class="filter-chip"
                  :class="{ active: !selectedCategory }"
                  @click="setCategory('')"
                >
                  📚 Все курсы
                </button>
                <button 
                  class="filter-chip"
                  :class="{ active: selectedCategory === 'most-popular' }"
                  @click="setCategory('most-popular')"
                >
                  🔥 Самые популярные
                </button>
                <button 
                  class="filter-chip"
                  :class="{ active: selectedCategory === 'latest' }"
                  @click="setCategory('latest')"
                >
                  🕐 Последние
                </button>
                <button 
                  class="filter-chip"
                  :class="{ active: selectedCategory === 'established' }"
                  @click="setCategory('established')"
                >
                  ⭐ Проверенные
                </button>
              </div>
            </div>
  
            <!-- Category Filter -->
            <div class="filter-group">
              <label class="filter-label">Все категории</label>
              <div class="filter-options">
                <button 
                  v-for="category in availableCategories" 
                  :key="category"
                  class="filter-chip"
                  :class="{ active: selectedCategory === category }"
                  @click="setCategory(category)"
                >
                  {{ getCategoryIcon(category) }} {{ category }}
                </button>
              </div>
            </div>
  
            <!-- Search -->
            <div class="filter-group search-group">
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
  
          <div class="clear-filters-container" v-if="hasActiveFilters">
            <button class="clear-filters" @click="clearFilters">
              Очистить все фильтры
            </button>
          </div>
        </div>
      </div>
  
      <!-- Loading State -->
      <div v-if="loading" class="loading-section">
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
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="error-section">
        <div class="container">
          <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Не удалось загрузить курсы</h3>
            <p>{{ error }}</p>
            <button class="retry-btn" @click="fetchCourses">Попробовать снова</button>
          </div>
        </div>
      </div>
  
      <!-- Courses Grid -->
      <div v-else class="courses-section">
        <div class="container">
          <div class="courses-grid" v-if="filteredCourses.length > 0">
            <div 
              v-for="course in sortedCourses" 
              :key="course.id"
              class="course-card"
              :class="{ 'premium-course': course.isPremium }"
            >
              <div class="course-image">
                <img :src="course.thumbnail || '/api/placeholder/400/220'" :alt="course.title" />
                <div class="course-overlay">
                  <div class="course-tags">
                    <div class="tag-new" v-if="course.isNew">НОВЫЙ</div>
                    <div class="tag-popular" v-if="course.isPopular">ПОПУЛЯРНЫЙ</div>
                    <div class="tag-free" v-if="!course.isPremium">БЕСПЛАТНО</div>
                  </div>
                  <div v-if="course.isPremium" class="premium-badge">PRO</div>
                </div>
                <div class="course-difficulty" :class="getDifficultyClass(course.difficulty)">
                  {{ getDifficultyIcon(course.difficulty) }}
                </div>
              </div>
              
              <div class="course-content">
                <div class="course-category-small">{{ course.category }}</div>
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>
                
                <div class="course-stats">
                  <div class="stat" v-if="course.rating">
                    <span class="stat-icon">⭐</span>
                    <span class="stat-value">{{ course.rating }}</span>
                  </div>
                  <div class="stat" v-if="course.studentsCount">
                    <span class="stat-icon">👥</span>
                    <span class="stat-value">{{ formatNumber(course.studentsCount) }}</span>
                  </div>
                  <div class="stat" v-if="course.duration">
                    <span class="stat-icon">⏱️</span>
                    <span class="stat-value">{{ course.duration }}</span>
                  </div>
                </div>
  
                <button 
                  class="view-details-btn"
                  @click="openCourse(course)"
                >
                  Подробнее о курсе
                </button>
              </div>
            </div>
          </div>
  
          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Курсы не найдены</h3>
            <p>Попробуйте изменить фильтры или поисковый запрос</p>
            <button class="btn-primary" @click="clearFilters">Сбросить фильтры</button>
          </div>
        </div>
      </div>
  
      <!-- Subscription Section -->
      <div class="subscription-section">
        <div class="container">
          <div class="subscription-card">
            <div class="subscription-icon">🚀</div>
            <h3>Неограниченный доступ с вашей подпиской</h3>
            <p>Получите доступ ко всем курсам, включая эксклюзивный контент и новые релизы. Некоторые вводные курсы доступны бесплатно, чтобы вы могли начать свое путешествие в мир ИИ.</p>
            <div class="featured-courses">
              <span class="featured-course-tag">Как создать вирусные ИИ-видео в 2024</span>
              <span class="featured-course-tag">Создайте собственного ИИ-чатбота с нуля</span>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Course Modal - Updated to match the design -->
      <div v-if="selectedCourse" class="course-modal-overlay" @click="closeCourseModal">
        <div class="course-modal" @click.stop>
          <!-- Modal Header with Tags -->
          <div class="modal-header-new">
            <div class="modal-tags">
              <div class="tag-free" v-if="!selectedCourse.isPremium">БЕСПЛАТНО</div>
              <div class="tag-new" v-if="selectedCourse.isNew">НОВЫЙ</div>
              <div class="tag-popular" v-if="selectedCourse.isPopular">ПОПУЛЯРНЫЙ</div>
            </div>
            <button class="close-btn-new" @click="closeCourseModal">×</button>
          </div>
  
          <div class="modal-content-new">
            <!-- Course Image -->
            <div class="modal-image-new">
              <img :src="selectedCourse.thumbnail || '/api/placeholder/400/200'" :alt="selectedCourse.title" />
            </div>
            
            <!-- Course Title and Stats -->
            <div class="modal-title-section">
              <h2 class="modal-course-title">{{ selectedCourse.title }}</h2>
              <div class="modal-course-stats">
                <div class="modal-stat" v-if="selectedCourse.rating">
                  <span class="stat-icon">⭐</span>
                  <span class="stat-value">{{ selectedCourse.rating }}</span>
                </div>
                <div class="modal-stat" v-if="selectedCourse.studentsCount">
                  <span class="stat-icon">👥</span>
                  <span class="stat-value">{{ formatNumber(selectedCourse.studentsCount) }} студентов</span>
                </div>
                <div class="modal-stat" v-if="selectedCourse.duration">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-value">{{ selectedCourse.duration }}</span>
                </div>
                <div class="modal-stat" v-if="selectedCourse.difficulty">
                  <span class="stat-icon">📊</span>
                  <span class="stat-value">{{ selectedCourse.difficulty }}</span>
                </div>
              </div>
            </div>
  
            <!-- Course Category and Type Tags -->
            <div class="modal-course-tags">
              <span class="course-category-tag">{{ selectedCourse.category }}</span>
              <span class="course-type-tag" v-if="!selectedCourse.isPremium">Бесплатный курс</span>
              <span class="course-type-tag premium" v-else>Premium курс</span>
            </div>
  
            <!-- Course Overview -->
            <div class="course-overview-section">
              <div class="section-header-icon">
                <span class="icon">📚</span>
                <h3>Обзор курса</h3>
              </div>
              <p class="course-overview-text">
                {{ selectedCourse.description || 'Освойте новейшие инструменты и техники генерации контента с помощью ИИ для создания захватывающего контента, который станет вирусным в социальных сетях.' }}
              </p>
            </div>
  
            <!-- What You'll Learn Section -->
            <div class="what-learn-section">
              <div class="section-header-icon">
                <span class="icon">🎯</span>
                <h3>Что вы изучите</h3>
              </div>
              <div class="learn-content">
                <p v-if="selectedCourse.fullDescription">{{ selectedCourse.fullDescription }}</p>
                <p v-else>
                  Ландшафт создания контента был революционизирован инструментами генерации ИИ-видео. В этом всеобъемлющем курсе вы откроете для себя, как использовать передовые ИИ-платформы, такие как Runway ML, Pika Labs и Stable Video Diffusion, для создания привлекательного видеоконтента, которое привлекает внимание и стимулирует вовлеченность.
                </p>
                <br>
                <p>
                  Мы изучим психологию вирусного контента, технические аспекты генерации ИИ-видео и практические стратегии для оптимизации вашего контента для различных платформ социальных сетей. Вы научитесь создавать эффективные промпты, понимать возможности и ограничения современных инструментов ИИ-видео и разрабатывать рабочий процесс, который позволит вам последовательно создавать высококачественный контент.
                </p>
                <br>
                <p>
                  Курс охватывает все от базовой разработки концепции до продвинутых техник редактирования, гарантируя, что у вас есть все инструменты, необходимые для выделения в переполненном цифровом ландшафте.
                </p>
              </div>
            </div>
  
            <!-- Course Tools and Technologies -->
            <div class="course-tools-section" v-if="selectedCourse.tools && selectedCourse.tools.length">
              <h4>Инструменты и технологии:</h4>
              <div class="tools-grid">
                <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-tag-large">
                  {{ tool }}
                </span>
              </div>
            </div>
            
            <!-- Course Curriculum -->
            <div class="course-curriculum-section" v-if="selectedCourse.curriculum && selectedCourse.curriculum.length">
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
          
          <!-- Modal Footer -->
          <div class="modal-footer-new">
            <div class="instructor-info-new" v-if="selectedCourse.instructor">
              <img 
                :src="selectedCourse.instructor.avatar || '/api/placeholder/60/60'" 
                :alt="selectedCourse.instructor.name" 
                class="instructor-avatar-large" 
              />
              <div class="instructor-details">
                <h4>{{ selectedCourse.instructor.name }}</h4>
                <p v-if="selectedCourse.instructor.bio">{{ selectedCourse.instructor.bio }}</p>
                <p v-else>Эксперт по ИИ и создатель курсов</p>
              </div>
            </div>
            
            <div class="modal-actions-new">
              <button class="btn-secondary-new" @click="toggleBookmark(selectedCourse)">
                <span v-if="selectedCourse.isBookmarked">❤️</span>
                <span v-else>🤍</span>
                {{ selectedCourse.isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное' }}
              </button>
              <button 
                class="btn-primary-new"
                :class="{ 'btn-premium': selectedCourse.isPremium && !hasAccessToCourse(selectedCourse) }"
                @click="handleCourseStart(selectedCourse)"
              >
                <span v-if="selectedCourse.isPremium && !hasAccessToCourse(selectedCourse)">🔒 Требуется PRO</span>
                <span v-else>Начать обучение</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
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
        courses: [
          // Sample data - replace with your API data
          {
            id: 1,
            title: 'Полнофункциональный учебный курс по разработке ИИ',
            description: 'Создавайте полноценные ИИ-приложения от фронтенда до бэкенда, используя современные фреймворки разработки.',
            category: 'Разработка',
            difficulty: 'Продвинутый',
            duration: '12 часов',
            rating: 4.9,
            studentsCount: 1290,
            isNew: true,
            isPopular: true,
            isPremium: false,
            thumbnail: '/api/placeholder/400/220',
            instructor: {
              name: 'Алексей Петров',
              avatar: '/api/placeholder/32/32'
            }
          },
          {
            id: 2,
            title: 'Как создать вирусные ИИ-видео в 2024',
            description: 'Освойте новейшие инструменты и техники генерации видео с помощью ИИ для создания захватывающего контента, который станет вирусным в социальных сетях.',
            category: 'ИИ Видео',
            difficulty: 'Начинающий',
            duration: '4 часа',
            rating: 4.8,
            studentsCount: 15420,
            isNew: true,
            isPopular: true,
            isPremium: false,
            thumbnail: '/api/placeholder/400/220',
            instructor: {
              name: 'Мария Иванова',
              avatar: '/api/placeholder/32/32'
            }
          },
          {
            id: 3,
            title: 'Создайте собственного ИИ-чатбота с нуля',
            description: 'Научитесь создавать интеллектуальных чатботов, используя современные ИИ-фреймворки и разворачивать их для реальных приложений.',
            category: 'Чатботы',
            difficulty: 'Средний',
            duration: '6 часов',
            rating: 4.9,
            studentsCount: 6930,
            isPopular: true,
            isPremium: true,
            thumbnail: '/api/placeholder/400/220',
            instructor: {
              name: 'Денис Козлов',
              avatar: '/api/placeholder/32/32'
            }
          }
        ],
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
          if (this.selectedCategory === 'most-popular') {
            filtered = filtered.filter(course => course.isPopular);
          } else if (this.selectedCategory === 'latest') {
            filtered = filtered.filter(course => course.isNew);
          } else if (this.selectedCategory === 'established') {
            filtered = filtered.filter(course => !course.isNew && course.rating >= 4.5);
          } else {
            filtered = filtered.filter(course => course.category === this.selectedCategory);
          }
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
        return this.selectedCategory || this.selectedDifficulty || this.searchQuery;
      }
    },
  
    async mounted() {
      await this.fetchCourses();
    },
  
    methods: {
      async fetchCourses() {
        this.loading = true;
        this.error = null;
        
        try {
          // Sample implementation - replace with your actual API call
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
          
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
        try {
          // Replace with your actual API endpoint
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${course.id}/bookmark`, {
            method: course.isBookmarked ? 'DELETE' : 'POST',
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (response.ok) {
            course.isBookmarked = !course.isBookmarked;
            
            if (this.$toast) {
              const message = course.isBookmarked ? 
                'Курс добавлен в избранное' : 
                'Курс удален из избранного';
              this.$toast.success(message, { duration: 2000 });
            }
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
        
        // Navigate to course content
        // this.$router.push({ name: 'CourseContent', params: { courseId: course.id } });
        
        this.closeCourseModal();
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
          'Разработка': '💻',
          'ИИ Видео': '🎬',
          'Чатботы': '🤖',
          'Графический дизайн': '🎨',
          'Машинное обучение': '🧠',
          'Дизайн': '🎨',
          'Программирование': '💻',
          'Маркетинг': '📈',
          'Данные': '📊'
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
      }
    },
  
    beforeUnmount() {
      document.body.style.overflow = 'auto';
    }
  };
  </script>
  
  
  <style scoped>
  /* Base Styles */
.updated-courses-container {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  padding: 4rem 0 5rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(45deg, #ffffff, #f0f9ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
}

.hero-subtitle {
  font-size: 1.125rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
  font-weight: 400;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  min-width: 120px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Filters Section */
.filters-section {
  padding: 2rem 0;
  background: white;
  margin-top: -2rem;
  position: relative;
  z-index: 10;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.courses-found-header {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.courses-found-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.filters-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 12px;
}

.filter-chip {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.filter-chip.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.search-group {
  margin-top: 1rem;
}

.search-input-container {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.125rem;
}

.clear-filters-container {
  margin-top: 1.5rem;
  text-align: center;
}

.clear-filters {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.clear-filters:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Courses Section */
.courses-section {
  padding: 3rem 0;
  background: #f8f9fa;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
}

/* Course Cards */
.course-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f1f5f9;
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.course-image {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: #f8f9fa;
}

.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.course-card:hover .course-image img {
  transform: scale(1.05);
}

.course-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.course-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag-new {
  background: #8b5cf6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tag-popular {
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tag-free {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.premium-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.course-difficulty {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid white;
}

/* Course Content */
.course-content {
  padding: 1.5rem;
}

.course-category-small {
  background: #6366f1;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  margin-bottom: 0.75rem;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-description {
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.9rem;
}

.course-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f1f5f9;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-icon {
  font-size: 1rem;
}

.view-details-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  width: 100%;
}

.view-details-btn:hover {
  background: #5856eb;
  transform: translateY(-1px);
}

/* Loading States */
.loading-section {
  padding: 2rem 0;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
}

.course-skeleton {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.skeleton-image {
  height: 220px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1.5rem;
}

.skeleton-title {
  height: 1.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.skeleton-text {
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-footer {
  height: 2.5rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-top: 1rem;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Error Section */
.error-section {
  padding: 3rem 0;
}

.error-content {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
  background: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.error-content p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.retry-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.retry-btn:hover {
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #6b7280;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
  color: #374151;
  font-weight: 700;
}

.empty-state p {
  margin: 0 0 2rem;
  font-size: 1.125rem;
}

.btn-primary {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary:hover {
  background: #5856eb;
  transform: translateY(-1px);
}

/* Subscription Section */
.subscription-section {
  padding: 3rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.subscription-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.subscription-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subscription-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
}

.subscription-card p {
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.featured-courses {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.featured-course-tag {
  background: #10b981;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* New Modal Design */
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
  padding: 1rem;
}

.course-modal {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header-new {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
  border-radius: 16px 16px 0 0;
}

.modal-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.close-btn-new {
  background: #f1f5f9;
  border: none;
  color: #64748b;
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.close-btn-new:hover {
  background: #e2e8f0;
}

.modal-content-new {
  padding: 0;
}

.modal-image-new {
  width: 100%;
  height: 200px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image-new img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-title-section {
  padding: 1.5rem 1.5rem 1rem;
}

.modal-course-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
  line-height: 1.3;
}

.modal-course-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.modal-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.modal-course-tags {
  padding: 0 1.5rem 1rem;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.course-category-tag {
  background: #8b5cf6;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.course-type-tag {
  background: #10b981;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
}

.course-type-tag.premium {
  background: #f59e0b;
}

.course-overview-section,
.what-learn-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.section-header-icon {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.section-header-icon .icon {
  font-size: 1.25rem;
}

.section-header-icon h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.course-overview-text,
.learn-content p {
  color: #374151;
  line-height: 1.6;
  margin: 0;
  font-size: 0.9rem;
}

.learn-content {
  color: #374151;
  line-height: 1.6;
  font-size: 0.9rem;
}

.course-tools-section,
.course-curriculum-section {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.course-tools-section h4,
.course-curriculum-section h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-tag-large {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
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
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.lesson-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.lesson-info h5 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.lesson-info p {
  margin: 0 0 0.25rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.lesson-duration {
  font-size: 0.8rem;
  color: #6366f1;
  font-weight: 600;
}

.modal-footer-new {
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.instructor-info-new {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.instructor-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.instructor-details h4 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.instructor-details p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.modal-actions-new {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary-new {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary-new:hover {
  background: #f3f4f6;
}

.btn-primary-new {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary-new:hover {
  background: #5856eb;
  transform: translateY(-1px);
}

.btn-primary-new.btn-premium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.btn-primary-new.btn-premium:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-stats {
    gap: 1rem;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .filters-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-options {
    justify-content: center;
  }

  .container {
    padding: 0 1rem;
  }

  .course-modal {
    margin: 0.5rem;
    max-height: 95vh;
    max-width: calc(100vw - 1rem);
  }

  .modal-content-new {
    padding: 0;
  }

  .modal-title-section,
  .course-overview-section,
  .what-learn-section,
  .course-tools-section,
  .course-curriculum-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .modal-course-stats {
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-actions-new {
    flex-direction: column;
    gap: 0.75rem;
  }

  .instructor-info-new {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .subscription-card {
    padding: 1.5rem;
  }

  .featured-courses {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 2rem 0 3rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .filters-section {
    padding: 1.5rem 0;
  }

  .filter-options {
    gap: 0.5rem;
  }

  .filter-chip {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .course-content {
    padding: 1.25rem;
  }

  .stat-item {
    padding: 1rem;
    min-width: 90px;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .modal-course-title {
    font-size: 1.25rem;
  }

  .subscription-card {
    padding: 1rem;
  }

  .subscription-card h3 {
    font-size: 1.25rem;
  }

  .modal-tags {
    gap: 0.25rem;
  }

  .modal-header-new {
    padding: 0.75rem;
  }

  .course-overview-section,
  .what-learn-section,
  .course-tools-section,
  .course-curriculum-section {
    padding: 0.75rem;
  }

  .modal-footer-new {
    padding: 1rem;
  }

  .featured-course-tag {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
  }

  .search-input-container {
    max-width: 100%;
  }

  .modal-stat {
    font-size: 0.8rem;
  }

  .course-category-tag,
  .course-type-tag {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }
}
  </style>