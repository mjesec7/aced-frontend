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
          <span>
            <svg width="20" height="20" style="vertical-align:middle;margin-right:4px" fill="none" stroke="currentColor"><path d="M2 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm3 0v12m10-12v12" stroke-width="1.5" stroke-linecap="round"/></svg>
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
              <span class="course-badge" :class="{ premium: course.isPremium }">
                {{ course.isPremium ? 'Премиум' : 'Бесплатно' }}
              </span>
            </div>
            <div class="course-content">
              <div class="course-category">{{ course.category }}</div>
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ course.description }}</p>
              <div class="course-meta-row">
                <span>
                  <svg width="16" height="16" fill="none" stroke="currentColor"><path d="M3 8A5 5 0 1 1 13 8A5 5 0 0 1 3 8Z" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {{ course.duration || "12 недель" }}
                </span>
                <span>
                  <svg width="16" height="16" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="7" stroke-width="1.5"/><path d="M8 4v5l3 2" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {{ getCourseLength(course) }} {{ getLessonWord(getCourseLength(course)) }}
                </span>
                <span class="difficulty">
                  {{ course.difficulty }}
                </span>
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
    <!-- End MODAL -->

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
                  <img v-for="img in currentStep.data.images" :src="getValidImageUrl(img.url)" :alt="img.caption || ''" />
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
      // Load course and first lesson
      this.lessonView.loaded = false
      try {
        let courseObj = course
        if (!course.curriculum) {
          // fetch full course
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
    }
  }
}
</script>

<style scoped>
:root {
  --primary: #181e29;
  --card-bg: #fff;
  --border: #e5e7eb;
  --shadow: 0 4px 24px 0 rgb(16 30 54 / 4%);
  --radius: 18px;
  --muted: #64748b;
  --gray: #d1d5db;
  --badge-premium: #f59e0b;
  --badge-free: #10b981;
}
.courses-page {
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: #111;
}
.hero {
  background: linear-gradient(180deg, #181e29 60%, #fff 100%);
  color: #fff;
  padding: 60px 0 96px;
  text-align: center;
}
.hero-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  opacity: 0.85;
  margin-bottom: 1.2rem;
}
.hero-title {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 0.75rem;
  line-height: 1.18;
}
.hero-subtitle {
  font-size: 1.25rem;
  font-weight: 500;
  opacity: 1;
  margin-bottom: 0.35rem;
}
.hero-description {
  font-size: 1.1rem;
  opacity: 0.85;
  margin: 0 auto;
  max-width: 600px;
}
.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 2rem;
}
.courses-section {
  margin-top: -64px;
  position: relative;
  z-index: 1;
}
.filter-bar {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}
.filter-group {
  flex: 1;
}
.filter-group.search {
  flex: 2 1 320px;
}
.filter-group.select {
  flex: 1 0 170px;
}
.filter-group-buttons {
  display: flex;
  gap: 0.5rem;
}
.filter-group-buttons button {
  background: #f1f5f9;
  border: 1px solid var(--border);
  color: #181e29;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: .15s;
}
.filter-group-buttons button.active {
  background: #6366f1;
  color: #fff;
  border: 1px solid #6366f1;
}
input[type="text"], select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.8rem 1rem;
  font-size: 1rem;
  background: #f8fafc;
  color: #181e29;
  outline: none;
  margin: 0;
}
input[type="text"]:focus, select:focus {
  border-color: #6366f1;
  background: #fff;
}
.course-results-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 1.08rem;
  margin-bottom: 1.4rem;
}
.results-source {
  font-size: 0.92rem;
}
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
}
.course-card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow .15s, border .15s, transform .15s;
  display: flex;
  flex-direction: column;
}
.course-card:hover {
  box-shadow: 0 8px 32px 0 rgb(16 30 54 / 8%);
  border-color: #6366f1;
  transform: translateY(-3px) scale(1.012);
}
.course-image {
  width: 100%;
  height: 170px;
  position: relative;
  background: #e5e7eb;
  overflow: hidden;
}
.course-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0;
  background: #e5e7eb;
}
.course-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--badge-free);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 16px;
  padding: 0.35em 1.1em;
  z-index: 2;
  text-transform: capitalize;
}
.course-badge.premium {
  background: var(--badge-premium);
}
.course-content {
  padding: 1.2rem 1.4rem 1.2rem 1.4rem;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}
.course-category {
  font-size: 0.98rem;
  background: #f3f4f6;
  color: #6366f1;
  display: inline-block;
  padding: 0.13em 0.7em;
  border-radius: 14px;
  margin-bottom: 0.68em;
  font-weight: 500;
}
.course-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.25em;
  line-height: 1.2;
  color: #1e293b;
}
.course-description {
  color: #555;
  font-size: 0.98rem;
  margin-bottom: 1em;
  line-height: 1.5;
  min-height: 48px;
  max-height: 52px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.course-meta-row {
  display: flex;
  gap: 1.1rem;
  color: #9ca3af;
  font-size: 0.97rem;
  align-items: center;
}
.course-meta-row svg {
  margin-right: 3px;
  stroke: #9ca3af;
  vertical-align: middle;
}
.difficulty {
  background: #f3f4f6;
  color: #475569;
  border-radius: 12px;
  padding: 0.13em 0.7em;
  font-size: 0.96rem;
  font-weight: 500;
  margin-left: auto;
}
.content-state {
  text-align: center;
  padding: 3.5em 0;
  color: #6366f1;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #e0e7ef;
  border-top: 4px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.state-icon {
  font-size: 2.5rem;
  margin-bottom: 1.2rem;
  color: #6366f1;
}
/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  z-index: 40;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(40,50,70, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}
.course-modal {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 12px 48px 0 rgb(16 30 54 / 18%);
  max-width: 500px;
  width: 100%;
  padding: 0 0 1.6rem;
  position: relative;
  overflow: hidden;
  animation: modal-in .24s cubic-bezier(.23,.7,.17,1);
}
@keyframes modal-in {
  from { opacity: 0; transform: translateY(40px) scale(0.98); }
  to { opacity: 1; transform: none; }
}
.modal-close {
  position: absolute;
  top: 16px; right: 18px;
  font-size: 2rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  z-index: 2;
}
.modal-image {
  width: 100%;
  height: 190px;
  background: #e5e7eb;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid #f1f1f4;
}
.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.modal-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--badge-free);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 16px;
  padding: 0.42em 1.25em;
  z-index: 2;
  text-transform: capitalize;
}
.modal-badge.premium {
  background: var(--badge-premium);
}
.modal-info {
  padding: 1.4rem 2rem 0.7rem 2rem;
  text-align: left;
}
.modal-category {
  font-size: 1.01rem;
  background: #f3f4f6;
  color: #6366f1;
  display: inline-block;
  padding: 0.13em 0.7em;
  border-radius: 14px;
  margin-bottom: 0.68em;
  font-weight: 500;
}
.modal-title {
  font-size: 1.36rem;
  font-weight: 800;
  margin-bottom: 0.32em;
  line-height: 1.19;
  color: #1e293b;
}
.modal-description {
  color: #555;
  font-size: 1.04rem;
  margin-bottom: 1.24em;
  line-height: 1.55;
  min-height: 40px;
}
.modal-meta {
  display: flex;
  gap: 1.2rem;
  color: #9ca3af;
  font-size: 1.04rem;
  align-items: center;
  margin-bottom: 1.1em;
}
.modal-locked {
  color: #ef4444;
  margin-bottom: 1.1em;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 0.72em 1.25em;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.08rem;
  cursor: pointer;
  border: none;
  background: #6366f1;
  color: #fff;
  transition: background .18s;
}
.btn:hover:not(:disabled) {
  background: #4338ca;
}
.btn-secondary {
  background: #f1f5f9;
  color: #6366f1;
  border: 1px solid #e5e7eb;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
/* LESSON READER FULLSCREEN MODAL */
.lesson-reader-overlay {
  position: fixed;
  z-index: 100;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(40,50,70,0.28);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
}
.lesson-reader {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 12px 48px 0 rgb(16 30 54 / 18%);
  max-width: 720px;
  width: 100%;
  margin: 2.1rem 0 2.1rem 0;
  position: relative;
  min-height: 540px;
  overflow: hidden;
  animation: modal-in .24s cubic-bezier(.23,.7,.17,1);
}
.reader-close {
  position: absolute;
  top: 18px; right: 22px;
  font-size: 2.2rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  z-index: 2;
}
.reader-header {
  border-bottom: 1px solid #f1f1f4;
  padding: 1.3rem 2rem 1rem 2rem;
}
.btn-back {
  background: #f3f4f6;
  color: #6366f1;
  border: none;
  border-radius: 8px;
  padding: 0.4em 0.9em;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.8em;
  cursor: pointer;
}
.lesson-category {
  background: #f3f4f6;
  color: #6366f1;
  padding: 0.13em 0.7em;
  border-radius: 14px;
  font-size: 0.98rem;
  font-weight: 500;
  margin-bottom: 0.4em;
  display: inline-block;
}
.lesson-title {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 0.18em;
  color: #18203d;
}
.lesson-meta {
  color: #888b99;
  font-size: 1.07rem;
  display: flex;
  gap: 1em;
  align-items: center;
}
.lesson-premium {
  background: #fef08a;
  color: #b45309;
  padding: 0.16em 0.8em;
  border-radius: 12px;
  font-weight: 700;
}
.locked-message {
  text-align: center;
  padding: 3em 0;
}
.locked-icon {
  font-size: 3.1em;
  margin-bottom: 1.1em;
}
.reader-content {
  margin-top: 1.2em;
  padding: 0 2em 2em 2em;
}
.step-navigation {
  display: flex;
  align-items: center;
  gap: 1.3em;
  margin-bottom: 1.3em;
  justify-content: center;
}
.btn-nav {
  background: #f3f4f6;
  color: #6366f1;
  border: none;
  border-radius: 8px;
  padding: 0.6em 1.2em;
  font-size: 1.1em;
  font-weight: 700;
  cursor: pointer;
  transition: .15s;
}
.btn-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lesson-step {
  padding: 1.1em 0.5em;
}
.img-list {
  margin-top: 1.5em;
  display: flex;
  flex-direction: column;
  gap: 1.8em;
}
.img-list img {
  max-width: 100%;
  border-radius: 1em;
  box-shadow: 0 2px 8px 0 #e1e8fa;
  background: #eee;
}
.loading-state {
  text-align: center;
  color: #6366f1;
  padding: 6em 0 2em;
}
@media (max-width: 700px) {
  .hero-title { font-size: 2rem; }
  .container { padding: 0 0.7rem; }
  .courses-grid { grid-template-columns: 1fr; }
  .filter-bar { flex-direction: column; gap: 0.7rem; }
  .course-modal { padding: 0 0 1rem; }
  .modal-info { padding: 1rem 1rem 0.7rem 1rem; }
  .lesson-reader { padding: 0; margin: 0.6rem 0; min-height: 320px; }
  .reader-header, .reader-content { padding-left: 0.6em; padding-right: 0.6em; }
  .lesson-title { font-size: 1.3rem; }
}
</style>