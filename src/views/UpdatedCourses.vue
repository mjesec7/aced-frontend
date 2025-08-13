<template>
  <div class="courses-page">
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Современные профессии</h1>
        <p class="hero-subtitle">
          Изучайте актуальные навыки и развивайтесь вместе с технологиями
        </p>
        <p class="hero-description">
          Спокойте для себя курсы по самым востребованным направлениям: ИИ, блокчейн, дизайн, маркетинг и программирование
        </p>
      </div>
    </section>

    <section v-if="!selectedCourse" class="courses-section">
      <div class="container">
        <div class="filter-bar">
          <div class="filter-group">
            <div class="input-wrapper">
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Поиск курсов..."
                @input="debounceFetch"
              />
              <span class="input-icon">🔍</span>
            </div>
          </div>

          <div class="filter-group">
            <select id="category" v-model="selectedCategory" @change="fetchCourses">
              <option value="">Все категории</option>
              <option v-for="cat in availableCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <select id="difficulty" v-model="selectedDifficulty" @change="fetchCourses">
              <option value="">Все уровни</option>
              <option v-for="diff in availableDifficulties" :key="diff" :value="diff">
                {{ getDifficultyIcon(diff) }} {{ diff }}
              </option>
            </select>
          </div>

          <div class="filter-group-buttons">
            <button
              :class="{ active: selectedType === 'free' }"
              @click="toggleType('free')"
            >
              Бесплатные
            </button>
            <button
              :class="{ active: selectedType === 'premium' }"
              @click="toggleType('premium')"
            >
              Премиум
            </button>
          </div>
        </div>
        
        <div class="course-results-label">
          <span># Найдено курсов: {{ sortedCourses.length }}</span>
          <span class="results-source">Обновлено сегодня</span>
        </div>

        <div v-if="loading" class="content-state">
          <div class="spinner"></div>
          <p>Загрузка курсов...</p>
        </div>

        <div v-else-if="error" class="content-state error">
          <div class="state-icon">⚠️</div>
          <h3>Не удалось загрузить курсы</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" @click="fetchCourses">
            Попробовать снова
          </button>
        </div>

        <div v-else-if="sortedCourses.length === 0" class="content-state">
          <div class="state-icon">🔍</div>
          <h3>Курсы не найдены</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос</p>
          <button class="btn btn-secondary" @click="clearFilters">
            Сбросить фильтры
          </button>
        </div>

        <div v-else class="courses-grid">
          <article
            v-for="course in sortedCourses"
            :key="course.id || course._id"
            class="course-card"
            @click="selectCourse(course)"
          >
            <div class="course-image">
              <img
                :src="getValidImageUrl(course.thumbnail || course.image)"
                :alt="course.title"
                loading="lazy"
                @error="handleImageError"
              />
              <div 
                class="course-badge" 
                :class="{ premium: course.isPremium }"
              >
                {{ course.isPremium ? 'ПРЕМИУМ' : 'БЕСПЛАТНО' }}
              </div>
            </div>
            
            <div class="course-content">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ truncateText(course.description, 100) }}</p>
              
              <div class="course-meta">
                <span class="meta-item">
                  <span class="meta-icon">⏱️</span>
                  {{ course.totalTime || "12 часов" }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📚</span>
                  {{ getCourseLength(course) }} {{ getLessonWord(getCourseLength(course)) }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-else class="course-detail-section">
      <div class="container">
        <button class="btn btn-back" @click="selectedCourse = null">
          ← Назад к списку
        </button>
        
        <div class="course-detail">
          <div class="detail-header">
            <div class="detail-image">
              <img 
                :src="getValidImageUrl(selectedCourse.thumbnail || selectedCourse.image)" 
                :alt="selectedCourse.title" 
                @error="handleImageError"
              />
              <div 
                class="detail-badge" 
                :class="{ premium: selectedCourse.isPremium }"
              >
                {{ selectedCourse.isPremium ? 'ПРЕМИУМ КУРС' : 'БЕСПЛАТНЫЙ КУРС' }}
              </div>
            </div>
            
            <div class="detail-info">
              <h1 class="detail-title">{{ selectedCourse.title }}</h1>
              <p class="detail-description">{{ selectedCourse.description }}</p>
              
              <div class="detail-meta">
                <div class="meta-row">
                  <span class="meta-item">
                    <strong>Категория:</strong> {{ selectedCourse.category || 'Общий' }}
                  </span>
                  <span class="meta-item">
                    <strong>Сложность:</strong> 
                    {{ getDifficultyIcon(selectedCourse.difficulty) }} {{ selectedCourse.difficulty || 'Базовый' }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-item">
                    <strong>Длительность:</strong> {{ selectedCourse.duration || '30 мин' }}
                  </span>
                  <span class="meta-item">
                    <strong>Студентов:</strong> {{ selectedCourse.studentsCount || 0 }}
                  </span>
                </div>
              </div>
              
              <div class="detail-actions">
                <button 
                  class="btn btn-primary btn-lg" 
                  @click="startCourse(selectedCourse)"
                  :disabled="selectedCourse.isPremium && !isUserPremium"
                >
                  <span v-if="selectedCourse.isPremium && !isUserPremium">
                    🔒 Требуется премиум подписка
                  </span>
                  <span v-else>
                    ▶️ Начать обучение
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="detail-content">
            <div v-if="loadingContent" class="content-state">
              <div class="spinner"></div>
              <p>Загрузка содержания...</p>
            </div>
            
            <div v-else-if="contentError" class="content-state error">
              <div class="state-icon">⚠️</div>
              <h3>Ошибка загрузки</h3>
              <p>{{ contentError }}</p>
              <button class="btn btn-primary" @click="loadCourseContent(selectedCourse)">
                Попробовать снова
              </button>
            </div>
            
            <div v-else class="lessons-list">
              <h3>
                Содержание курса 
                <span class="lesson-count">({{ courseContent.length }} {{ getLessonWord(courseContent.length) }})</span>
              </h3>
              
              <div class="lessons-container">
                <div
                  v-for="(lesson, index) in courseContent"
                  :key="lesson.id || lesson._id"
                  class="lesson-item"
                  :class="{ 
                    locked: selectedCourse.isPremium && !isUserPremium && index > 0,
                    preview: selectedCourse.isPremium && !isUserPremium && index === 0
                  }"
                  @click="openLesson(lesson, index)"
                >
                  <div class="lesson-left">
                    <span class="lesson-number">{{ index + 1 }}</span>
                    <div class="lesson-info">
                      <h4>
                        {{ lesson.title || lesson.lessonName }}
                        <span v-if="selectedCourse.isPremium && !isUserPremium && index === 0" class="preview-badge">
                          👁️ Предпросмотр
                        </span>
                      </h4>
                      <div class="lesson-meta">
                        <span class="lesson-duration">{{ lesson.duration || '30 мин' }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="lesson-right">
                    <div v-if="selectedCourse.isPremium && !isUserPremium && index > 0" class="lesson-lock">
                      🔒
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="selectedCourse.isPremium && !isUserPremium && courseContent.length > 1" class="premium-upsell">
                <div class="upsell-content">
                  <h4>🔓 Разблокируйте все уроки</h4>
                  <p>Получите доступ ко всем {{ courseContent.length - 1 }} урокам этого курса с премиум подпиской</p>
                  <button class="btn btn-upgrade" @click="upgradeAccount">
                    Обновить до PRO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <LessonPlayer
      v-if="showLessonView && currentLesson"
      :course="selectedCourse"
      :lesson="currentLesson"
      :lesson-index="currentLessonIndex"
      :total-lessons="courseContent.length"
      :is-premium="selectedCourse.isPremium"
      :user-has-access="!selectedCourse.isPremium || isUserPremium"
      @close="closeLessonView"
      @next="nextLesson"
      @previous="previousLesson"
      @complete="completeCourse"
      @upgrade="upgradeAccount"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUpdatedCourses, getCourseContent } from '@/api'
import LessonPlayer from '@/components/Updated/LessonPlayer.vue'

export default {
  name: 'UpdatedCourses',
  components: {
    LessonPlayer
  },
  data() {
    return {
      searchQuery: '',
      selectedCategory: '',
      selectedDifficulty: '',
      selectedType: '',
      
      loading: false,
      error: null,
      selectedCourse: null,
      loadingContent: false,
      contentError: null,

      courses: [],
      courseContent: [],
      availableCategories: [],
      availableDifficulties: [],
      
      showLessonView: false,
      currentLessonIndex: 0,
      
      debounceTimeout: null,
    }
  },
  computed: {
    ...mapGetters('user', ['currentUserPlan']),

    isUserPremium() {
      return this.currentUserPlan && ['start', 'pro', 'premium'].includes(this.currentUserPlan.toLowerCase())
    },
    
    sortedCourses() {
      return this.filterCourses([...this.courses])
    },
    
    currentLesson() {
      return this.courseContent[this.currentLessonIndex] || null
    },
  },
  
  async mounted() {
    await this.fetchCourses()
  },
  
  methods: {
    debounceFetch() {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = setTimeout(this.fetchCourses, 500)
    },

    toggleType(type) {
      this.selectedType = this.selectedType === type ? '' : type
      this.fetchCourses()
    },

    async fetchCourses() {
      this.loading = true
      this.error = null
      
      try {
        const filters = {
          category: this.selectedCategory,
          difficulty: this.selectedDifficulty,
          search: this.searchQuery,
          type: this.selectedType
        }

        const response = await getUpdatedCourses(filters)
        
        if (response.success) {
          this.courses = response.courses || []
          this.availableCategories = response.categories || []
          this.availableDifficulties = response.difficulties || []
        } else {
          throw new Error(response.error || 'Failed to fetch courses')
        }
        
      } catch (e) {
        this.error = e.message || 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.'
      } finally {
        this.loading = false
      }
    },

    filterCourses(courses) {
      let filtered = courses

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(course =>
          (course.title || '').toLowerCase().includes(query) ||
          (course.description || '').toLowerCase().includes(query)
        )
      }

      if (this.selectedCategory) {
        filtered = filtered.filter(course => course.category === this.selectedCategory)
      }

      if (this.selectedDifficulty) {
        filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty)
      }

      if (this.selectedType) {
        if (this.selectedType === 'free') {
          filtered = filtered.filter(course => !course.isPremium)
        } else if (this.selectedType === 'premium') {
          filtered = filtered.filter(course => course.isPremium)
        }
      }

      return filtered
    },

    async selectCourse(course) {
      this.selectedCourse = course
      await this.loadCourseContent(course)
    },

    async loadCourseContent(course) {
      this.loadingContent = true
      this.contentError = null
      this.courseContent = []
      
      try {
        const response = await getCourseContent(course.id || course._id)
        
        if (response.success) {
          this.courseContent = response.data || []
        } else {
          throw new Error(response.error || 'Failed to load course content')
        }
        
      } catch (e) {
        this.contentError = e.message || 'Не удалось загрузить содержание курса.'
      } finally {
        this.loadingContent = false
      }
    },
    
    startCourse(course) {
      if (course.isPremium && !this.isUserPremium) {
        this.upgradeAccount()
      } else if (this.courseContent.length > 0) {
        this.openLesson(this.courseContent[0], 0)
      }
    },

    openLesson(lesson, index) {
      if (this.selectedCourse.isPremium && !this.isUserPremium && index > 0) {
        this.upgradeAccount()
        return
      }
      
      this.currentLessonIndex = index
      this.showLessonView = true
    },

    closeLessonView() {
      this.showLessonView = false
      this.currentLessonIndex = 0
    },

    nextLesson() {
      const nextIndex = this.currentLessonIndex + 1
      
      if (this.selectedCourse.isPremium && !this.isUserPremium && nextIndex > 0) {
        this.upgradeAccount()
        return
      }
      
      if (nextIndex < this.courseContent.length) {
        this.currentLessonIndex = nextIndex
      }
    },

    previousLesson() {
      if (this.currentLessonIndex > 0) {
        this.currentLessonIndex--
      }
    },

    completeCourse() {
      this.showLessonView = false
      this.selectedCourse = null
    },
    
    clearFilters() {
      this.searchQuery = ''
      this.selectedCategory = ''
      this.selectedDifficulty = ''
      this.selectedType = ''
      this.fetchCourses()
    },

    upgradeAccount() {
      this.$router.push('/pricing')
    },

    // Utility methods
    getDifficultyIcon(difficulty) {
      const icons = {
        'Начинающий': '🟢',
        'Базовый': '🟢',
        'Начальный': '🟢',
        'Средний': '🟡',
        'Промежуточный': '🟡',
        'Продвинутый': '🔴',
        'Эксперт': '🔴'
      }
      return icons[difficulty] || '⚪'
    },

    getValidImageUrl(url) {
      if (!url) return 'https://via.placeholder.com/400x250/6366f1/ffffff?text=ACED+Course'
      
      if (url.startsWith('http')) return url
      
      if (url.startsWith('/')) return `https://api.aced.live${url}`
      
      return `https://api.aced.live/${url}`
    },
    
    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/400x250/6366f1/ffffff?text=ACED+Course'
    },

    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },

    getCourseLength(course) {
      return course.curriculum?.length || course.lessonCount || 0
    },

    getLessonWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'урок'
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока'
      return 'уроков'
    },
  }
}
</script>

<style scoped>
/* CSS Custom Properties */
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --premium-color: #f59e0b;
  --free-color: #10b981;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --border-radius: 8px;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --transition: 150ms ease-in-out;
}

/* Base Styles */
.courses-page {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-secondary);
  min-height: 100vh;
  color: var(--text-primary);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero Section */
.hero {
  background: #2b354b;
  color: white;
  padding: 3rem 0 5rem;
  text-align: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.hero-description {
  font-size: 1rem;
  opacity: 0.7;
  max-width: 800px;
  margin: 1.5rem auto 0;
  line-height: 1.5;
}

/* Filter Bar */
.courses-section {
  position: relative;
  margin-top: -3rem;
}

.filter-bar {
  background-color: var(--bg-primary);
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-group {
  flex: 1;
}

.filter-group-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-group-buttons button {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition);
}

.filter-group-buttons button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  padding-left: 2.75rem;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 1rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition);
}

.course-results-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.results-source {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Content States */
.content-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding: 3rem 0;
  color: var(--text-secondary);
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Course Cards */
.course-card {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid var(--border-color);
  position: relative;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
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
  transition: transform var(--transition);
}

.course-card:hover .course-image img {
  transform: scale(1.05);
}

.course-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50px;
  color: white;
  text-transform: uppercase;
  background-color: var(--free-color);
}

.course-badge.premium {
  background-color: var(--premium-color);
}

.course-content {
  padding: 1.5rem;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.course-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-icon {
  font-size: 1rem;
}

/* Course Detail */
.course-detail-section {
  padding-top: 2rem;
}

.course-detail {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 2rem;
}

.detail-header {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-image {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  background-color: var(--free-color);
}

.detail-badge.premium {
  background-color: var(--premium-color);
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin: 0;
}

.detail-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 1rem;
  color: var(--text-muted);
}

.meta-item strong {
  color: var(--text-primary);
}

.detail-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition);
  border: none;
  text-decoration: none;
  white-space: nowrap;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--secondary-color);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-back {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.btn-upgrade {
  background: linear-gradient(135deg, var(--premium-color), #d97706);
  color: white;
  font-weight: 700;
}

.btn-lg {
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Lessons List */
.lessons-list h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.lesson-count {
  color: var(--text-muted);
  font-weight: 400;
}

.lessons-container {
  margin-bottom: 2rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
  position: relative;
}

.lesson-item:hover {
  background-color: var(--bg-tertiary);
  transform: translateX(4px);
  border-color: var(--primary-color);
}

.lesson-item.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

.lesson-item.preview {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: var(--warning-color);
}

.lesson-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.lesson-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.lesson-item.locked .lesson-number {
  background-color: var(--text-muted);
}

.lesson-item.preview .lesson-number {
  background-color: var(--warning-color);
}

.lesson-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background-color: var(--warning-color);
  color: white;
  border-radius: 12px;
  font-weight: 600;
}

.lesson-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lesson-lock {
  font-size: 1.5rem;
  color: var(--text-muted);
}

/* Premium Upsell */
.premium-upsell {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid var(--premium-color);
  border-radius: var(--border-radius);
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .detail-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .filter-group {
    width: 100%;
  }

  .filter-group-buttons {
    width: 100%;
  }

  .filter-group-buttons button {
    flex: 1;
  }

  .course-results-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }
}

</style>