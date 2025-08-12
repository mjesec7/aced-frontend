<template>
  <div class="courses-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Актуальные курсы</h1>
        <p class="hero-subtitle">
          Изучайте новейшие технологии и инструменты с нашими современными курсами
        </p>
      </div>
    </section>

    <!-- Course List Section -->
    <section v-if="!selectedCourse" class="courses-section">
      <div class="container">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <div class="filter-group">
            <label for="search">Поиск</label>
            <div class="input-wrapper">
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                placeholder="Поиск по названию или описанию..."
                @input="debounceFetch"
              />
              <span class="input-icon">🔍</span>
            </div>
          </div>

          <div class="filter-group">
            <label for="category">Категория</label>
            <select id="category" v-model="selectedCategory" @change="fetchCourses">
              <option value="">Все категории</option>
              <option v-for="cat in availableCategories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="difficulty">Сложность</label>
            <select id="difficulty" v-model="selectedDifficulty" @change="fetchCourses">
              <option value="">Любая сложность</option>
              <option v-for="diff in availableDifficulties" :key="diff" :value="diff">
                {{ getDifficultyIcon(diff) }} {{ diff }}
              </option>
            </select>
          </div>
        </div>

        <!-- Content States -->
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

        <!-- Courses Grid -->
        <div v-else class="courses-grid">
          <article
            v-for="course in sortedCourses"
            :key="course.id"
            class="course-card"
            @click="selectCourse(course)"
          >
            <div class="course-image">
              <img
                :src="getValidImageUrl(course.thumbnail)"
                :alt="course.title"
                loading="lazy"
                @error="handleImageError"
              />
              <div class="course-badge" :class="{ premium: course.isPremium }">
                {{ course.isPremium ? 'PRO' : 'БЕСПЛАТНО' }}
              </div>
            </div>
            
            <div class="course-content">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ truncateText(course.description, 100) }}</p>
              
              <div class="course-meta">
                <span class="meta-item">
                  {{ getDifficultyIcon(course.difficulty) }} {{ course.difficulty }}
                </span>
                <span class="meta-item">⏱️ {{ course.duration }}</span>
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
                <button class="btn btn-primary btn-sm">Подробнее</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Course Detail Section -->
    <section v-else-if="selectedCourse && !showLessonView" class="course-detail-section">
      <div class="container">
        <button class="btn btn-back" @click="selectedCourse = null">
          ← Назад к списку
        </button>
        
        <div class="course-detail">
          <div class="detail-header">
            <div class="detail-image">
              <img :src="getValidImageUrl(selectedCourse.thumbnail)" :alt="selectedCourse.title" />
              <div class="detail-badge" :class="{ premium: selectedCourse.isPremium }">
                {{ selectedCourse.isPremium ? 'PRO' : 'БЕСПЛАТНО' }}
              </div>
            </div>
            
            <div class="detail-info">
              <h1 class="detail-title">{{ selectedCourse.title }}</h1>
              <p class="detail-description">{{ selectedCourse.description }}</p>
              
              <div class="detail-meta">
                <span class="meta-item">Категория: {{ selectedCourse.category }}</span>
                <span class="meta-item">
                  Сложность: {{ getDifficultyIcon(selectedCourse.difficulty) }} {{ selectedCourse.difficulty }}
                </span>
                <span class="meta-item">Длительность: {{ selectedCourse.duration }}</span>
              </div>
              
              <div v-if="selectedCourse.instructor" class="instructor-card">
                <img :src="getValidImageUrl(selectedCourse.instructor.avatar)" class="instructor-avatar" />
                <div class="instructor-details">
                  <h4>{{ selectedCourse.instructor.name }}</h4>
                  <p>{{ selectedCourse.instructor.bio }}</p>
                </div>
              </div>
              
              <div class="detail-actions">
                <button class="btn btn-primary btn-lg" @click="startCourse(selectedCourse)">
                  Начать обучение
                </button>
                <button class="btn btn-secondary" @click="toggleBookmark(selectedCourse)">
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
            
            <div v-else-if="contentError" class="content-state error">
              <p>{{ contentError }}</p>
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
                <div class="lesson-type">
                  {{ getLessonTypeIcon(lesson) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Lesson Player -->
    <LessonPlayer
      v-if="showLessonView && currentLesson"
      :course="selectedCourse"
      :lesson="currentLesson"
      :lesson-index="currentLessonIndex"
      :total-lessons="courseContent.length"
      @close="closeLessonView"
      @next="nextLesson"
      @previous="previousLesson"
      @complete="completeCourse"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { getUpdatedCourses, getLessonsByTopic, toggleBookmark } from '@/api'
import LessonPlayer from '@/components/Updated/LessonPlayer.vue'

export default {
  name: 'UpdatedCourses',
  components: {
    LessonPlayer
  },
  data() {
    return {
      // Filter state
      searchQuery: '',
      selectedCategory: '',
      selectedDifficulty: '',
      
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
    }
  },
  computed: {
    ...mapGetters('user', ['currentUserId', 'currentUserPlan']),

    availableCategories() {
      return [...new Set(this.courses.map(c => c.category))].filter(Boolean)
    },
    
    availableDifficulties() {
      return [...new Set(this.courses.map(c => c.difficulty))].filter(Boolean)
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

    async fetchCourses() {
      this.loading = true
      this.error = null
      try {
        const filters = {
          category: this.selectedCategory,
          difficulty: this.selectedDifficulty,
          search: this.searchQuery,
        }
        const response = await getUpdatedCourses(filters)
        if (response.error) throw new Error(response.error)
        this.courses = response.courses
      } catch (e) {
        console.error('Failed to fetch courses:', e)
        this.error = 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.'
        this.courses = this.generateMockCourses()
      } finally {
        this.loading = false
      }
    },

    filterCourses(courses) {
      let filtered = courses

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query)
        )
      }

      if (this.selectedCategory) {
        filtered = filtered.filter(course => course.category === this.selectedCategory)
      }

      if (this.selectedDifficulty) {
        filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty)
      }

      return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    },

    async selectCourse(course) {
      this.selectedCourse = course
      this.loadingContent = true
      this.contentError = null
      this.courseContent = []
      
      try {
        const response = await getLessonsByTopic(course.id)
        if (response.error) throw new Error(response.error)
        this.courseContent = response.data
      } catch (e) {
        console.error('Failed to fetch course content:', e)
        this.contentError = 'Не удалось загрузить содержание курса.'
        this.courseContent = this.generateMockLessons(course)
      } finally {
        this.loadingContent = false
      }
    },
    
    async toggleBookmark(course) {
      const courseId = course.id || course._id
      const wasBookmarked = course.isBookmarked

      try {
        course.isBookmarked = !wasBookmarked
        const response = await toggleBookmark(this.currentUserId, courseId, !wasBookmarked)
        
        if (!response.success) {
          throw new Error('API request failed')
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error)
        course.isBookmarked = wasBookmarked
      }
    },

    startCourse(course) {
      this.openLesson(this.courseContent[0], 0)
    },

    openLesson(lesson, index) {
      this.currentLessonIndex = index
      this.showLessonView = true
    },

    closeLessonView() {
      this.showLessonView = false
      this.currentLessonIndex = 0
    },

    nextLesson() {
      if (this.currentLessonIndex < this.courseContent.length - 1) {
        this.currentLessonIndex++
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
      this.$emit('course-completed', this.selectedCourse)
    },
    
    clearFilters() {
      this.searchQuery = ''
      this.selectedCategory = ''
      this.selectedDifficulty = ''
      this.fetchCourses()
    },

    // Utility methods
    getDifficultyIcon(difficulty) {
      const icons = {
        'Начинающий': '🟢',
        'Средний': '🟡',
        'Продвинутый': '🔴'
      }
      return icons[difficulty] || '⚪'
    },

    getLessonTypeIcon(lesson) {
      if (!lesson.steps) return '📝'
      const types = lesson.steps.map(step => step.type)
      if (types.includes('video')) return '🎥'
      if (types.includes('pdf')) return '📄'
      if (types.includes('practice')) return '🎯'
      if (types.includes('quiz')) return '❓'
      return '📝'
    },

    getValidImageUrl(url) {
      return url || 'https://via.placeholder.com/400x250.png?text=ACED'
    },
    
    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/400x250.png?text=ACED'
    },

    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },

    // Mock data generators
    generateMockCourses() {
      return [
        {
          id: '1',
          title: 'Современный веб-дизайн',
          description: 'Изучите принципы современного веб-дизайна с использованием Figma и CSS',
          category: 'Дизайн',
          difficulty: 'Начинающий',
          duration: '6 часов',
          thumbnail: 'https://via.placeholder.com/400x250.png?text=Web+Design',
          isPremium: false,
          isBookmarked: false,
          instructor: {
            name: 'Анна Петрова',
            avatar: 'https://via.placeholder.com/50x50.png?text=AP',
            bio: 'Опытный UI/UX дизайнер с 8-летним стажем'
          },
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          title: 'React с TypeScript',
          description: 'Полное руководство по разработке React приложений с TypeScript',
          category: 'Программирование',
          difficulty: 'Продвинутый',
          duration: '12 часов',
          thumbnail: 'https://via.placeholder.com/400x250.png?text=React+TS',
          isPremium: true,
          isBookmarked: true,
          instructor: {
            name: 'Максим Иванов',
            avatar: 'https://via.placeholder.com/50x50.png?text=MI',
            bio: 'Senior Frontend разработчик в крупной IT компании'
          },
          createdAt: '2024-02-20'
        }
      ]
    },

    generateMockLessons(course) {
      return [
        {
          id: '1',
          title: 'Введение в курс',
          description: 'Обзор курса и подготовка к изучению',
          steps: [
            {
              type: 'explanation',
              data: {
                content: 'Добро пожаловать на курс! В этом уроке мы рассмотрим основы и подготовимся к изучению материала.'
              }
            }
          ]
        },
        {
          id: '2',
          title: 'Практическое занятие',
          description: 'Применяем полученные знания на практике',
          steps: [
            {
              type: 'practice',
              data: {
                instructions: 'Выполните упражнения из приложенного материала.',
                files: []
              }
            }
          ]
        }
      ]
    }
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
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  padding: 3rem 0;
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

/* Filter Bar */
.filter-bar {
  background-color: var(--bg-primary);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
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

input:focus, select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

.content-state.error {
  color: var(--error-color);
}

.state-icon {
  font-size: 3rem;
  opacity: 0.6;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: var(--success-color);
}

.course-badge.premium {
  background-color: var(--warning-color);
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
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
  border: 2px solid var(--border-color);
}

.instructor-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
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

.btn-secondary:hover:not(:disabled) {
  background-color: var(--border-color);
  transform: translateY(-1px);
}

.btn-back {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.btn-back:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

/* Course Detail */
.course-detail {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 2rem;
}

.detail-header {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.detail-image {
  position: relative;
  width: 100%;
  height: 250px;
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
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  background-color: var(--success-color);
}

.detail-badge.premium {
  background-color: var(--warning-color);
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
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 1rem;
  color: var(--text-muted);
}

.instructor-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
}

.instructor-card .instructor-avatar {
  width: 60px;
  height: 60px;
}

.instructor-details h4 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.instructor-details p {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Lessons List */
.lessons-list h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
}

.lesson-item:hover {
  background-color: var(--bg-tertiary);
  transform: translateX(4px);
  border-color: var(--primary-color);
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

.lesson-info {
  flex: 1;
}

.lesson-info h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.lesson-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.lesson-type {
  font-size: 1.25rem;
  opacity: 0.7;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .detail-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .detail-image {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.125rem;
  }
  
  .filter-bar {
    grid-template-columns: 1fr;
  }
  
  .courses-grid {
    grid-template-columns: 1fr;
  }
  
  .course-detail {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 0.75rem;
  }
  
  .hero {
    padding: 2rem 0;
  }
  
  .hero-title {
    font-size: 1.5rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .filter-bar {
    padding: 1rem;
  }
  
  .detail-actions {
    flex-direction: column;
  }
  
  .lesson-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .lesson-number {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.btn:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
</style>