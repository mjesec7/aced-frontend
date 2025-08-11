<template>
  <div class="updated-courses-container">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
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
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <div class="container">
        <div class="filters-header">
          <h2>Найди свой курс</h2>
          <button class="clear-filters" @click="clearFilters" v-if="hasActiveFilters">
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

        <div class="courses-grid" v-if="filteredCourses.length > 0">
          <div 
            v-for="course in sortedCourses" 
            :key="course.id"
            class="course-card"
            :class="{ 'premium-course': course.isPremium }"
            @click="openCourse(course)"
          >
            <div class="course-image">
              <img :src="course.thumbnail || '/default-course-thumbnail.jpg'" :alt="course.title" />
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
                    :src="course.instructor.avatar || '/default-avatar.jpg'" 
                    :alt="course.instructor.name" 
                    class="instructor-avatar" 
                  />
                  <span class="instructor-name">{{ course.instructor.name }}</span>
                </div>
                
                <div class="course-actions">
                  <button class="btn-secondary" @click.stop="toggleBookmark(course)">
                    {{ course.isBookmarked ? '❤️' : '🤍' }}
                  </button>
                  <button 
                    class="btn-primary" 
                    :class="{ 'btn-premium': course.isPremium && !hasAccessToCourse(course) }"
                    @click.stop="handleCourseStart(course)"
                  >
                    <span v-if="course.isPremium && !hasAccessToCourse(course)">🔒 PRO</span>
                    <span v-else>Начать</span>
                  </button>
                </div>
              </div>
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

    <!-- Course Modal -->
    <div v-if="selectedCourse" class="course-modal-overlay" @click="closeCourseModal">
      <div class="course-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedCourse.title }}</h2>
          <button class="close-btn" @click="closeCourseModal">×</button>
        </div>
        
        <div class="modal-content">
          <div class="modal-image">
            <img :src="selectedCourse.thumbnail || '/default-course-thumbnail.jpg'" :alt="selectedCourse.title" />
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
        
        <div class="modal-footer">
          <div class="instructor-info" v-if="selectedCourse.instructor">
            <img 
              :src="selectedCourse.instructor.avatar || '/default-avatar.jpg'" 
              :alt="selectedCourse.instructor.name" 
              class="instructor-avatar-large" 
            />
            <div class="instructor-details">
              <h4>{{ selectedCourse.instructor.name }}</h4>
              <p v-if="selectedCourse.instructor.bio">{{ selectedCourse.instructor.bio }}</p>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" @click="toggleBookmark(selectedCourse)">
              {{ selectedCourse.isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное' }}
            </button>
            <button 
              class="btn-primary btn-large"
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
        // Replace with your actual API endpoint
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/updated-courses`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить курсы');
        }

        const data = await response.json();
        this.courses = data.courses || [];
        
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
      if (this.hasActiveFilters) {
        return `Найдено курсов: ${this.filteredCourses.length}`;
      }
      return 'Все актуальные курсы';
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
  background: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4rem 0;
  color: white;
}

.hero-content {
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.1;
}

.gradient-text {
  background: linear-gradient(45deg, #ffffff, #e0e7ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  min-width: 100px;
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
  padding: 2rem 0;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.clear-filters {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-filters:hover {
  background: #dc2626;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  font-size: 0.9rem;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.filter-chip:hover {
  background: #e5e7eb;
}

.filter-chip.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
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
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

/* Loading Section */
.loading-section {
  padding: 2rem 0;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.course-skeleton {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skeleton-image {
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-title {
  height: 1.25rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
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
  height: 2rem;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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

/* Courses Section */
.courses-section {
  padding: 2rem 0 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
  border-color: #667eea;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.course-card.premium-course {
  border: 2px solid #f59e0b;
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
}

.course-category {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.premium-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.course-difficulty {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.course-content {
  padding: 1.25rem;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-description {
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.875rem;
}

.course-meta {
  margin-bottom: 1rem;
}

.course-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.tool-tag {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tool-more {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.125rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.course-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-icon {
  font-size: 0.875rem;
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-instructor {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.instructor-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.instructor-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-secondary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 0.375rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.8rem;
  white-space: nowrap;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.btn-premium:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-large {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 1.5rem;
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
  padding: 1rem;
}

.course-modal {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 16px 16px 0 0;
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
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-content {
  padding: 1.5rem;
}

.modal-image {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.modal-image img {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.modal-premium-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 700;
}

.course-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.detail-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 700;
}

.course-full-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 1.5rem;
}

.course-tools-list h4,
.course-curriculum h4 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem;
}

.tools-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tool-tag-large {
  background: linear-gradient(135deg, #667eea, #764ba2);
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
  background: linear-gradient(135deg, #667eea, #764ba2);
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
  color: #667eea;
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

.instructor-info {
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

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-stats {
    gap: 1rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .course-modal {
    margin: 0.5rem;
    max-height: 95vh;
  }

  .modal-content {
    padding: 1rem;
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
    gap: 1rem;
    align-items: stretch;
  }

  .container {
    padding: 0 1rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 2rem 0;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .course-card {
    margin: 0;
  }

  .course-actions {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-primary {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}
</style>