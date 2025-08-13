<template>
  <div class="courses-page">
    <!-- HERO -->
    <section class="hero">
      <div class="container">
        <div class="hero-badge">
          <span>✨ Новые курсы каждую неделю</span>
        </div>
        <h1 class="hero-title">Современные профессии</h1>
        <p class="hero-subtitle">
          Изучайте актуальные навыки и развивайтесь вместе с технологиями
        </p>
        <p class="hero-description">
          Откройте для себя курсы по самым востребованным направлениям: ИИ, блокчейн, дизайн, маркетинг и программирование
        </p>
      </div>
    </section>

    <!-- FILTERS -->
    <section class="courses-section">
      <div class="container">
        <form class="filter-bar" @submit.prevent>
          <div class="filter-group search">
            <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск курсов..."
              @input="debounceFetch"
              aria-label="Поиск курсов"
            />
          </div>
          <div class="filter-group select">
            <select v-model="selectedCategory" @change="fetchCourses">
              <option value="">Все категории</option>
              <option v-for="cat in availableCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="filter-group select">
            <select v-model="selectedDifficulty" @change="fetchCourses">
              <option value="">Все уровни</option>
              <option v-for="diff in availableDifficulties" :key="diff" :value="diff">
                {{ diff }}
              </option>
            </select>
          </div>
          <div class="filter-group-buttons">
            <button
              type="button"
              :class="{ active: selectedType === 'free' }"
              @click="toggleType('free')"
            >Бесплатные</button>
            <button
              type="button"
              :class="{ active: selectedType === 'premium' }"
              @click="toggleType('premium')"
            >Премиум</button>
          </div>
        </form>

        <!-- Results label -->
        <div class="course-results-label">
          <span class="results-found">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Найдено курсов: {{ sortedCourses.length }}
          </span>
          <span class="results-source">Обновлено сегодня</span>
        </div>

        <!-- Main Grid -->
        <div v-if="loading" class="content-state">
          <div class="spinner"></div>
          <p>Загрузка курсов...</p>
        </div>
        <div v-else-if="error" class="content-state error">
          <div class="state-icon">⚠️</div>
          <h3>Не удалось загрузить курсы</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" @click="fetchCourses">Попробовать снова</button>
        </div>
        <div v-else-if="sortedCourses.length === 0" class="content-state">
          <div class="state-icon">🔍</div>
          <h3>Курсы не найдены</h3>
          <p>Попробуйте изменить фильтры или поисковый запрос</p>
          <button class="btn btn-secondary" @click="clearFilters">Сбросить фильтры</button>
        </div>
        <div v-else class="courses-grid">
          <article
            v-for="course in sortedCourses"
            :key="course.id || course._id"
            class="course-card"
            @click="openCourseModal(course)"
            tabindex="0"
          >
            <div class="course-image">
              <img
                :src="getValidImageUrl(course.thumbnail)"
                :alt="course.title"
                loading="lazy"
                @error="handleImageError"
              />
              <div class="course-badges">
                <span class="course-badge" :class="{ premium: course.isPremium }">
                  {{ course.isPremium ? 'Премиум' : 'Бесплатно' }}
                </span>
              </div>
            </div>
            <div class="course-content">
              <div class="course-category">{{ course.category }}</div>
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ course.description }}</p>
              <div class="course-meta">
                <div class="course-meta-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  <span>{{ course.duration || "8 недель" }}</span>
                </div>
                <div class="course-meta-item">
                  <span class="difficulty-badge" :class="getDifficultyClass(course.difficulty)">
                    {{ course.difficulty || 'Средний' }}
                  </span>
                </div>
              </div>
              <div class="course-price">
                <span v-if="course.isPremium && course.price" class="price">
                  от {{ course.price }}
                </span>
                <span v-else-if="course.isPremium" class="price">
                  от {{ course.price || '4900' }}
                </span>
                <span v-else class="price-free">Бесплатно</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- MODAL: Course detail -->
    <div v-if="showCourseModal && selectedCourse" class="modal-overlay" @click.self="closeCourseModal">
      <div class="course-modal">
        <button class="modal-close" @click="closeCourseModal" aria-label="Закрыть">×</button>
        <div class="modal-image">
          <img :src="getValidImageUrl(selectedCourse.thumbnail)" :alt="selectedCourse.title" @error="handleImageError" />
          <span class="modal-badge" :class="{ premium: selectedCourse.isPremium }">
            {{ selectedCourse.isPremium ? 'Премиум' : 'Бесплатно' }}
          </span>
        </div>
        <div class="modal-info">
          <div class="modal-category">{{ selectedCourse.category }}</div>
          <h2 class="modal-title">{{ selectedCourse.title }}</h2>
          <div class="modal-description">{{ selectedCourse.description }}</div>
          <div class="modal-meta">
            <span>
              <svg width="18" height="18" fill="none" stroke="currentColor"><path d="M3 8A5 5 0 1 1 13 8A5 5 0 0 1 3 8Z" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ selectedCourse.duration || "12 недель" }}
            </span>
            <span>
              <svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="7" stroke-width="1.5"/><path d="M8 4v5l3 2" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ getCourseLength(selectedCourse) }} {{ getLessonWord(getCourseLength(selectedCourse)) }}
            </span>
            <span>
              {{ selectedCourse.difficulty }}
            </span>
          </div>
          <div v-if="selectedCourse.isPremium && !isUserPremium" class="modal-locked">
            <span>🔒 Для доступа требуется премиум-подписка</span>
            <button class="btn btn-primary" @click="upgradeAccount">Обновить до PRO</button>
          </div>
          <div v-else>
            <button class="btn btn-primary" @click="openLessonView(selectedCourse)">Начать обучение</button>
          </div>
        </div>
      </div>
    </div>

    <!-- FULLSCREEN LESSON READER: SUBSCRIBERS ONLY -->
    <div v-if="showLessonView && lessonView.loaded" class="lesson-reader-overlay">
      <div class="lesson-reader">
        <button class="reader-close" @click="closeLessonView" aria-label="Закрыть">×</button>
        <div class="reader-header">
          <button class="btn-back" @click="closeLessonView">← Назад к курсу</button>
          <span class="lesson-category">{{ lessonView.course.category }}</span>
          <h1 class="lesson-title">{{ lessonView.lesson.title }}</h1>
          <div class="lesson-meta">
            <span>{{ lessonView.course.title }}</span> •
            <span>{{ lessonView.lesson.duration || '30 мин' }}</span>
            <span v-if="lessonView.course.isPremium" class="lesson-premium">Премиум</span>
          </div>
        </div>
        <div v-if="!lessonView.hasAccess" class="locked-message">
          <div class="locked-icon">🔒</div>
          <p>Этот урок доступен только для пользователей с подпиской.</p>
          <button class="btn btn-primary" @click="upgradeAccount">Обновить до PRO</button>
        </div>
        <div v-else class="reader-content">
          <div class="step-navigation">
            <button class="btn-nav" :disabled="lessonView.stepIndex === 0" @click="prevStep">←</button>
            <span>Шаг {{ lessonView.stepIndex + 1 }} из {{ lessonView.steps.length }}</span>
            <button class="btn-nav" :disabled="lessonView.stepIndex === lessonView.steps.length - 1" @click="nextStep">→</button>
          </div>
          <div class="lesson-step">
            <div v-if="currentStep">
              <h2 v-if="currentStep.title">{{ currentStep.title }}</h2>
              <div v-if="currentStep.data && currentStep.data.content" v-html="currentStep.data.content"></div>
              <div v-else-if="currentStep.content" v-html="currentStep.content"></div>
              <div v-if="currentStep.data && currentStep.data.images && currentStep.data.images.length">
                <div class="img-list">
                  <img 
                    v-for="(img, index) in currentStep.data.images" 
                    :key="img.id || img.url || index"
                    :src="getValidImageUrl(img.url)" 
                    :alt="img.caption || ''"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LESSON LOADING STATE -->
    <div v-if="showLessonView && !lessonView.loaded" class="lesson-reader-overlay">
      <div class="lesson-reader">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Загрузка урока...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getUpdatedCourses, getCourseById, getCourseContent } from '@/api'

export default {
  name: 'UpdatedCourses',
  data() {
    return {
      searchQuery: '',
      selectedCategory: '',
      selectedDifficulty: '',
      selectedType: '',
      loading: false,
      error: null,
      courses: [],
      availableCategories: [],
      availableDifficulties: [],
      showCourseModal: false,
      selectedCourse: null,
      debounceTimeout: null,

      // LESSON VIEW MODAL
      showLessonView: false,
      lessonView: {
        loaded: false,
        course: null,
        lesson: null,
        steps: [],
        stepIndex: 0,
        hasAccess: false
      }
    }
  },
  computed: {
    ...mapGetters('user', ['currentUserPlan']),
    isUserPremium() {
      return this.currentUserPlan && ['start','pro','premium'].includes(this.currentUserPlan.toLowerCase())
    },
    sortedCourses() {
      return this.filterCourses([...this.courses])
    },
    currentStep() {
      if (!this.lessonView || !this.lessonView.steps) return null
      return this.lessonView.steps[this.lessonView.stepIndex] || null
    }
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
    openCourseModal(course) {
      this.selectedCourse = course
      this.showCourseModal = true
    },
    closeCourseModal() {
      this.showCourseModal = false
      this.selectedCourse = null
    },
    openLessonView(course) {
      this.showCourseModal = false
      this.lessonView.loaded = false
      this.showLessonView = true
      this.loadLessonView(course)
    },
    async loadLessonView(course) {
      this.lessonView.loaded = false
      try {
        let courseObj = course
        if (!course.curriculum) {
          const res = await getCourseById(course.id || course._id)
          if (!res.success) throw new Error('Курс не найден')
          courseObj = res.data
        }
        const lessonsRes = await getCourseContent(courseObj.id || courseObj._id)
        if (!lessonsRes.success) throw new Error('Содержание курса не найдено')
        const lessons = lessonsRes.data || []
        const lesson = lessons[0]
        this.lessonView.course = courseObj
        this.lessonView.lesson = lesson
        this.lessonView.steps = lesson.steps || []
        this.lessonView.stepIndex = 0
        this.lessonView.hasAccess = !courseObj.isPremium || this.isUserPremium
      } catch (e) {
        this.lessonView.course = course
        this.lessonView.lesson = { title: 'Ошибка', steps: [] }
        this.lessonView.steps = []
        this.lessonView.hasAccess = false
      }
      this.lessonView.loaded = true
    },
    closeLessonView() {
      this.showLessonView = false
      this.lessonView = {
        loaded: false, course: null, lesson: null, steps: [], stepIndex: 0, hasAccess: false
      }
    },
    prevStep() {
      if (this.lessonView.stepIndex > 0) this.lessonView.stepIndex--
    },
    nextStep() {
      if (this.lessonView.stepIndex < this.lessonView.steps.length - 1) this.lessonView.stepIndex++
    },
    upgradeAccount() {
      this.$router.push('/pricing')
    },
    clearFilters() {
      this.searchQuery = ''
      this.selectedCategory = ''
      this.selectedDifficulty = ''
      this.selectedType = ''
      this.fetchCourses()
    },
    getValidImageUrl(url) {
      if (!url) return 'https://via.placeholder.com/600x300/6366f1/ffffff?text=ACED+Course'
      if (url.startsWith('http')) return url
      if (url.startsWith('/')) return `https://api.aced.live${url}`
      return `https://api.aced.live/${url}`
    },
    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/600x300/6366f1/ffffff?text=ACED+Course'
    },
    getCourseLength(course) {
      return course.curriculum?.length || course.lessonCount || 0
    },
    getLessonWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'урок'
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока'
      return 'уроков'
    },
    getDifficultyClass(difficulty) {
      const diff = (difficulty || '').toLowerCase()
      if (diff.includes('начин') || diff === 'легкий') return 'beginner'
      if (diff.includes('средн')) return 'intermediate'
      if (diff.includes('продвин') || diff === 'сложный') return 'advanced'
      return 'intermediate'
    }
  }
}
</script>

<style scoped>
/* CSS Variables */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e293b;
  --accent-color: #6366f1;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-dark: #1e293b;
  --bg-card: #ffffff;
  
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}

/* Base Styles */
.courses-page {
  background: var(--bg-secondary);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  color: var(--text-primary);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 80px 0 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  line-height: 1.1;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  margin-bottom: 8px;
  opacity: 0.9;
}

.hero-description {
  font-size: 1.1rem;
  opacity: 0.75;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Courses Section */
.courses-section {
  margin-top: -80px;
  position: relative;
  z-index: 10;
}

/* Filter Bar */
.filter-bar {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group.search {
  flex: 2;
  min-width: 300px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  z-index: 1;
}

.filter-group input[type="text"] {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 16px 12px 48px;
  font-size: 16px;
  background: var(--bg-primary);
  transition: all 0.2s ease;
}

.filter-group input[type="text"]:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
}

.filter-group select {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: 16px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
}

.filter-group-buttons {
  display: flex;
  gap: 8px;
}

.filter-group-buttons button {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  padding: 12px 20px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-group-buttons button:hover {
  background: var(--border-light);
}

.filter-group-buttons button.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* Results Label */
.course-results-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  color: var(--text-secondary);
  font-size: 16px;
}

.results-found {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.results-source {
  font-size: 14px;
  color: var(--text-muted);
}

/* Course Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Course Cards */
.course-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--accent-color);
}

.course-image {
  position: relative;
  width: 100%;
  height: 200px;
  background: var(--border-light);
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

.course-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: flex-end;
}

.course-badge {
  background: var(--success-color);
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 20px;
  padding: 6px 12px;
  box-shadow: var(--shadow-md);
}

.course-badge.premium {
  background: var(--warning-color);
}

.course-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 16px;
}

.course-category {
  display: inline-block;
  background: var(--bg-secondary);
  color: var(--accent-color);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  align-self: flex-start;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-primary);
  margin: 0;
}

.course-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}

.course-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 14px;
}

.course-meta-item svg {
  width: 16px;
  height: 16px;
}

.difficulty-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}

.difficulty-badge.beginner {
  background: #dcfce7;
  color: #166534;
}

.difficulty-badge.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-badge.advanced {
  background: #fee2e2;
  color: #991b1b;
}

.course-price {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.price-free {
  font-size: 16px;
  font-weight: 600;
  color: var(--success-color);
}

/* Loading and Error States */
.content-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.content-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.content-state p {
  margin-bottom: 24px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-light);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.course-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  cursor: pointer;
  z-index: 1;
  transition: background 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.2);
}

.modal-image {
  position: relative;
  width: 100%;
  height: 200px;
  background: var(--border-light);
}

.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--success-color);
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 20px;
  padding: 6px 12px;
}

.modal-badge.premium {
  background: var(--warning-color);
}

.modal-info {
  padding: 24px;
}

.modal-category {
  display: inline-block;
  background: var(--bg-secondary);
  color: var(--accent-color);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
}

.modal-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.modal-meta {
  display: flex;
  gap: 16px;
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.modal-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-locked {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
  color: var(--danger-color);
  text-align: center;
}

/* Lesson Reader */
.lesson-reader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 60;
  overflow-y: auto;
  padding: 20px;
}

.lesson-reader {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
  width: 100%;
  margin: 20px 0;
  position: relative;
  animation: modalIn 0.3s ease-out;
}

.reader-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  z-index: 1;
}

.reader-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-light);
}

.btn-back {
  background: var(--bg-secondary);
  color: var(--accent-color);
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
}

.lesson-category {
  display: inline-block;
  background: var(--bg-secondary);
  color: var(--accent-color);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  margin-bottom: 12px;
}

.lesson-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.2;
}

.lesson-meta {
  color: var(--text-muted);
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.lesson-premium {
  background: var(--warning-color);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 12px;
}

.locked-message {
  text-align: center;
  padding: 60px 24px;
}

.locked-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.reader-content {
  padding: 24px;
}

.step-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.btn-nav {
  background: var(--bg-secondary);
  color: var(--accent-color);
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-nav:hover:not(:disabled) {
  background: var(--border-light);
}

.lesson-step {
  padding: 20px 0;
  line-height: 1.7;
}

.lesson-step h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.img-list {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.img-list img {
  max-width: 100%;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.loading-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--accent-color);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: auto;
  }
  
  .filter-group.search {
    min-width: auto;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .hero {
    padding: 60px 0 100px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .courses-section {
    margin-top: -60px;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .filter-bar {
    padding: 16px;
    gap: 12px;
  }
  
  .filter-group-buttons {
    flex-wrap: wrap;
  }
  
  .course-modal {
    margin: 0;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .lesson-reader {
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
  }
  
  .lesson-title {
    font-size: 1.5rem;
  }
}
</style>