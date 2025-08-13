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

          <div class="filter-group">
            <label for="type">Тип</label>
            <select id="type" v-model="selectedType" @change="fetchCourses">
              <option value="">Все</option>
              <option value="free">Бесплатные</option>
              <option value="premium">Премиум</option>
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
            :key="course.id || course._id"
            class="course-card"
            :class="{ 'premium-course': course.isPremium }"
            @click="selectCourse(course)"
          >
            <div class="course-image">
              <img
                :src="getValidImageUrl(course.thumbnail)"
                :alt="course.title"
                loading="lazy"
                @error="handleImageError"
              />
              <div 
                class="course-badge" 
                :class="{ 
                  premium: course.isPremium,
                  free: !course.isPremium 
                }"
              >
                <span class="badge-icon">{{ course.isPremium ? '👑' : '🆓' }}</span>
                {{ course.isPremium ? 'ПРЕМИУМ' : 'БЕСПЛАТНО' }}
              </div>
              
              <!-- Premium Lock Overlay -->
              <div v-if="course.isPremium && !isUserPremium" class="premium-overlay">
                <div class="lock-icon">🔒</div>
                <span class="premium-text">Требуется подписка</span>
              </div>
            </div>
            
            <div class="course-content">
              <h3 class="course-title">{{ course.title }}</h3>
              <p class="course-description">{{ truncateText(course.description, 100) }}</p>
              
              <div class="course-meta">
                <span class="meta-item">
                  <span class="meta-icon">{{ getDifficultyIcon(course.difficulty) }}</span>
                  {{ course.difficulty }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">⏱️</span>
                  {{ course.duration }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">👥</span>
                  {{ course.studentsCount || 0 }}
                </span>
              </div>

              <!-- Course Stats -->
              <div class="course-stats">
                <div class="stat-item">
                  <span class="star-rating">
                    <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= (course.rating || 0) }">⭐</span>
                  </span>
                  <span class="rating-text">{{ course.rating ? course.rating.toFixed(1) : 'Новый' }}</span>
                </div>
                <div class="stat-item">
                  <span class="lesson-count">{{ getCourseLength(course) }} уроков</span>
                </div>
              </div>
              
              <div class="course-footer">
                <div class="instructor-info">
                  <img
                    :src="getValidImageUrl(course.instructor?.avatar)"
                    :alt="course.instructor?.name || 'Instructor'"
                    class="instructor-avatar"
                    @error="handleAvatarError"
                  />
                  <span class="instructor-name">{{ course.instructor?.name || 'ACED Team' }}</span>
                </div>
                <button 
                  class="btn btn-primary btn-sm"
                  :disabled="course.isPremium && !isUserPremium"
                >
                  <span v-if="course.isPremium && !isUserPremium">🔒 Требуется PRO</span>
                  <span v-else>Подробнее</span>
                </button>
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
              <img 
                :src="getValidImageUrl(selectedCourse.thumbnail)" 
                :alt="selectedCourse.title" 
                @error="handleImageError"
              />
              <div 
                class="detail-badge" 
                :class="{ 
                  premium: selectedCourse.isPremium,
                  free: !selectedCourse.isPremium 
                }"
              >
                <span class="badge-icon">{{ selectedCourse.isPremium ? '👑' : '🆓' }}</span>
                {{ selectedCourse.isPremium ? 'ПРЕМИУМ КУРС' : 'БЕСПЛАТНЫЙ КУРС' }}
              </div>

              <!-- Access Status -->
              <div class="access-status" :class="{ 
                accessible: !selectedCourse.isPremium || isUserPremium,
                restricted: selectedCourse.isPremium && !isUserPremium 
              }">
                <span v-if="!selectedCourse.isPremium || isUserPremium" class="access-icon">✅</span>
                <span v-else class="access-icon">🔒</span>
                <span class="access-text">
                  {{ getAccessText(selectedCourse) }}
                </span>
              </div>
            </div>
            
            <div class="detail-info">
              <h1 class="detail-title">{{ selectedCourse.title }}</h1>
              <p class="detail-description">{{ selectedCourse.description }}</p>
              
              <div class="detail-meta">
                <div class="meta-row">
                  <span class="meta-item">
                    <strong>Категория:</strong> {{ selectedCourse.category }}
                  </span>
                  <span class="meta-item">
                    <strong>Сложность:</strong> 
                    {{ getDifficultyIcon(selectedCourse.difficulty) }} {{ selectedCourse.difficulty }}
                  </span>
                </div>
                <div class="meta-row">
                  <span class="meta-item">
                    <strong>Длительность:</strong> {{ selectedCourse.duration }}
                  </span>
                  <span class="meta-item">
                    <strong>Студентов:</strong> {{ selectedCourse.studentsCount || 0 }}
                  </span>
                </div>
                <div v-if="selectedCourse.tools && selectedCourse.tools.length" class="meta-row">
                  <span class="meta-item tools">
                    <strong>Инструменты:</strong>
                    <span class="tool-tags">
                      <span v-for="tool in selectedCourse.tools" :key="tool" class="tool-tag">
                        {{ tool }}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
              
              <div v-if="selectedCourse.instructor" class="instructor-card">
                <img 
                  :src="getValidImageUrl(selectedCourse.instructor.avatar)" 
                  class="instructor-avatar"
                  @error="handleAvatarError"
                />
                <div class="instructor-details">
                  <h4>{{ selectedCourse.instructor.name }}</h4>
                  <p>{{ selectedCourse.instructor.bio || 'Опытный преподаватель ACED' }}</p>
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
                
                <button class="btn btn-secondary" @click="toggleBookmark(selectedCourse)">
                  {{ selectedCourse.isBookmarked ? '❤️ В избранном' : '🤍 В избранное' }}
                </button>

                <!-- Upgrade button for premium courses -->
                <button 
                  v-if="selectedCourse.isPremium && !isUserPremium" 
                  class="btn btn-upgrade"
                  @click="upgradeAccount"
                >
                  ⬆️ Обновить до PRO
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
                      <p>{{ lesson.description || 'Описание урока' }}</p>
                      <div class="lesson-meta">
                        <span class="lesson-duration">{{ lesson.duration || '30 мин' }}</span>
                        <span class="lesson-steps">{{ (lesson.steps || []).length }} шагов</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="lesson-right">
                    <div class="lesson-type">
                      {{ getLessonTypeIcon(lesson) }}
                    </div>
                    <div v-if="selectedCourse.isPremium && !isUserPremium && index > 0" class="lesson-lock">
                      🔒
                    </div>
                  </div>
                </div>
              </div>

              <!-- Premium Upsell for locked lessons -->
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

    <!-- Lesson Player -->
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
import { mapState, mapGetters } from 'vuex'
import { getCourseContent, toggleBookmark } from '@/api'
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
      selectedType: '',
      
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

    isUserPremium() {
      return this.currentUserPlan && ['start', 'pro', 'premium'].includes(this.currentUserPlan.toLowerCase())
    },

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
        console.log('🔄 Fetching updated courses...')
        
        const filters = {
          category: this.selectedCategory,
          difficulty: this.selectedDifficulty,
          search: this.searchQuery,
        }

        // Use the correct API endpoint for updated courses
        const response = await this.$api.get('/updated-courses', { params: filters })
        
        if (response.data.success) {
          this.courses = response.data.courses || []
          console.log(`✅ Loaded ${this.courses.length} courses`)
        } else {
          throw new Error(response.data.error || 'Failed to fetch courses')
        }
        
      } catch (e) {
        console.error('❌ Failed to fetch courses:', e)
        this.error = e.response?.data?.message || e.message || 'Не удалось загрузить курсы. Пожалуйста, попробуйте позже.'
        
        // Fallback to mock data for development
        if (process.env.NODE_ENV === 'development') {
          this.courses = this.generateMockCourses()
        }
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
          course.description.toLowerCase().includes(query) ||
          (course.instructor?.name || '').toLowerCase().includes(query)
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

      return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
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
        console.log('📥 Loading course content for:', course.title)
        
        // Use the correct API function for getting course content
        const response = await getCourseContent(course.id || course._id)
        
        if (response.success) {
          this.courseContent = response.data || []
          console.log(`✅ Loaded ${this.courseContent.length} lessons`)
        } else {
          throw new Error(response.error || 'Failed to load course content')
        }
        
      } catch (e) {
        console.error('❌ Failed to fetch course content:', e)
        this.contentError = e.message || 'Не удалось загрузить содержание курса.'
        
        // Fallback to mock lessons for development
        if (process.env.NODE_ENV === 'development') {
          this.courseContent = this.generateMockLessons(course)
        }
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
      if (course.isPremium && !this.isUserPremium) {
        // Allow access to first lesson only
        this.openLesson(this.courseContent[0], 0)
      } else {
        this.openLesson(this.courseContent[0], 0)
      }
    },

    openLesson(lesson, index) {
      // Check access for premium courses
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
      
      // Check access for premium content
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
      this.$emit('course-completed', this.selectedCourse)
    },
    
    clearFilters() {
      this.searchQuery = ''
      this.selectedCategory = ''
      this.selectedDifficulty = ''
      this.selectedType = ''
      this.fetchCourses()
    },

    upgradeAccount() {
      // Navigate to upgrade page or show upgrade modal
      this.$router.push('/pricing')
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
      if (!lesson.steps || !lesson.steps.length) return '📝'
      
      const types = lesson.steps.map(step => step.type)
      if (types.includes('quiz')) return '❓'
      if (types.includes('practice')) return '🎯'
      if (types.includes('image')) return '🖼️'
      if (types.includes('reading')) return '📖'
      return '📝'
    },

    getValidImageUrl(url) {
      if (!url) return 'https://via.placeholder.com/400x250/6366f1/ffffff?text=ACED+Course'
      if (url.startsWith('http')) return url
      return `https://api.aced.live${url}`
    },
    
    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/400x250/6366f1/ffffff?text=ACED+Course'
    },

    handleAvatarError(event) {
      event.target.src = 'https://via.placeholder.com/50x50/8b5cf6/ffffff?text=👤'
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

    getAccessText(course) {
      if (!course.isPremium) return 'Полный доступ'
      if (this.isUserPremium) return 'Полный доступ'
      return 'Требуется подписка'
    },

    // Mock data generators (for development)
    generateMockCourses() {
      return [
        {
          id: '1',
          _id: '1',
          title: 'Современный веб-дизайн',
          description: 'Изучите принципы современного веб-дизайна с использованием Figma и CSS. Полный курс от основ до продвинутых техник.',
          category: 'Дизайн',
          difficulty: 'Начинающий',
          duration: '6 часов',
          thumbnail: 'https://via.placeholder.com/400x250/6366f1/ffffff?text=Web+Design',
          isPremium: false,
          isBookmarked: false,
          studentsCount: 1250,
          rating: 4.8,
          tools: ['Figma', 'CSS', 'HTML'],
          instructor: {
            name: 'Анна Петрова',
            avatar: 'https://via.placeholder.com/50x50/8b5cf6/ffffff?text=AP',
            bio: 'Опытный UI/UX дизайнер с 8-летним стажем в ведущих IT компаниях'
          },
          curriculum: Array(8).fill().map((_, i) => ({ title: `Урок ${i + 1}`, _id: `lesson_${i}` })),
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          _id: '2',
          title: 'React с TypeScript',
          description: 'Полное руководство по разработке React приложений с TypeScript. От основ до продвинутых паттернов.',
          category: 'Программирование',
          difficulty: 'Продвинутый',
          duration: '12 часов',
          thumbnail: 'https://via.placeholder.com/400x250/10b981/ffffff?text=React+TS',
          isPremium: true,
          isBookmarked: true,
          studentsCount: 890,
          rating: 4.9,
          tools: ['React', 'TypeScript', 'Webpack'],
          instructor: {
            name: 'Максим Иванов',
            avatar: 'https://via.placeholder.com/50x50/f59e0b/ffffff?text=MI',
            bio: 'Senior Frontend разработчик в крупной IT компании, контрибьютор в React'
          },
          curriculum: Array(15).fill().map((_, i) => ({ title: `Урок ${i + 1}`, _id: `lesson_${i}` })),
          createdAt: '2024-02-20'
        },
        {
          id: '3',
          _id: '3',
          title: 'Машинное обучение для начинающих',
          description: 'Введение в мир машинного обучения. Изучите основные алгоритмы и создайте свои первые модели.',
          category: 'Машинное обучение',
          difficulty: 'Средний',
          duration: '10 часов',
          thumbnail: 'https://via.placeholder.com/400x250/ef4444/ffffff?text=ML+Course',
          isPremium: true,
          isBookmarked: false,
          studentsCount: 2100,
          rating: 4.7,
          tools: ['Python', 'Scikit-learn', 'Pandas'],
          instructor: {
            name: 'Дмитрий Козлов',
            avatar: 'https://via.placeholder.com/50x50/10b981/ffffff?text=DK',
            bio: 'Кандидат технических наук, специалист по машинному обучению и анализу данных'
          },
          curriculum: Array(12).fill().map((_, i) => ({ title: `Урок ${i + 1}`, _id: `lesson_${i}` })),
          createdAt: '2024-03-10'
        }
      ]
    },

    generateMockLessons(course) {
      const lessonCount = course.curriculum?.length || 8
      return Array(lessonCount).fill().map((_, index) => ({
        id: `lesson_${index}`,
        _id: `lesson_${index}`,
        title: `Урок ${index + 1}: ${this.generateLessonTitle(course.category, index)}`,
        description: `Подробное изучение темы урока ${index + 1}. Практические примеры и упражнения.`,
        duration: `${20 + Math.floor(Math.random() * 40)} мин`,
        order: index,
        steps: this.generateLessonSteps(index)
      }))
    },

    generateLessonTitle(category, index) {
      const titles = {
        'Дизайн': [
          'Основы композиции',
          'Цветовая теория',
          'Типографика',
          'Создание макетов',
          'Прототипирование',
          'Пользовательский опыт',
          'Адаптивный дизайн',
          'Финальный проект'
        ],
        'Программирование': [
          'Введение в TypeScript',
          'Компоненты и Props',
          'Состояние и хуки',
          'Маршрутизация',
          'Управление состоянием',
          'Тестирование',
          'Оптимизация',
          'Деплой приложения'
        ],
        'Машинное обучение': [
          'Введение в ML',
          'Подготовка данных',
          'Линейная регрессия',
          'Классификация',
          'Кластеризация',
          'Нейронные сети',
          'Валидация моделей',
          'Практический проект'
        ]
      }
      
      const categoryTitles = titles[category] || titles['Дизайн']
      return categoryTitles[index] || `Урок ${index + 1}`
    },

    generateLessonSteps(lessonIndex) {
      const stepTypes = ['explanation', 'example', 'reading', 'image', 'practice', 'quiz']
      const stepCount = 3 + Math.floor(Math.random() * 4)
      
      return Array(stepCount).fill().map((_, stepIndex) => ({
        id: `step_${lessonIndex}_${stepIndex}`,
        type: stepTypes[stepIndex % stepTypes.length],
        title: `Шаг ${stepIndex + 1}`,
        description: `Описание шага ${stepIndex + 1}`,
        data: this.generateStepData(stepTypes[stepIndex % stepTypes.length])
      }))
    },

    generateStepData(type) {
      switch (type) {
        case 'explanation':
          return {
            content: 'Подробное объяснение концепции с примерами и иллюстрациями.',
            images: []
          }
        case 'example':
          return {
            content: 'Практический пример применения изученного материала.',
            images: []
          }
        case 'reading':
          return {
            content: 'Дополнительный материал для углубленного изучения темы.',
            images: []
          }
        case 'image':
          return {
            images: [{
              url: 'https://via.placeholder.com/800x400/6366f1/ffffff?text=Lesson+Image',
              caption: 'Иллюстрация к уроку'
            }],
            description: 'Визуальный материал для лучшего понимания'
          }
        case 'practice':
          return {
            instructions: 'Выполните практическое задание для закрепления материала.',
            type: 'guided'
          }
        case 'quiz':
          return [{
            question: 'Проверочный вопрос по пройденному материалу',
            type: 'multiple-choice',
            options: [
              { text: 'Вариант ответа 1' },
              { text: 'Вариант ответа 2' },
              { text: 'Правильный ответ' },
              { text: 'Вариант ответа 4' }
            ],
            correctAnswer: 2,
            explanation: 'Объяснение правильного ответа'
          }]
        default:
          return {}
      }
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.course-card.premium-course {
  border: 2px solid var(--premium-color);
}

.course-card.premium-course::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--premium-color), var(--warning-color));
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
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.course-badge.free {
  background: linear-gradient(135deg, var(--free-color), #059669);
}

.course-badge.premium {
  background: linear-gradient(135deg, var(--premium-color), #d97706);
}

.badge-icon {
  font-size: 1rem;
}

.premium-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity var(--transition);
}

.course-card:hover .premium-overlay {
  opacity: 1;
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.premium-text {
  font-size: 0.875rem;
  font-weight: 600;
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
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.meta-icon {
  font-size: 1rem;
}

.course-stats {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.star-rating {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 0.875rem;
  opacity: 0.3;
  transition: opacity var(--transition);
}

.star.filled {
  opacity: 1;
}

.rating-text {
  font-weight: 600;
  color: var(--text-secondary);
}

.lesson-count {
  color: var(--text-muted);
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

.btn-upgrade {
  background: linear-gradient(135deg, var(--premium-color), #d97706);
  color: white;
  font-weight: 700;
}

.btn-upgrade:hover {
  background: linear-gradient(135deg, #d97706, var(--premium-color));
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.detail-badge.free {
  background: linear-gradient(135deg, var(--free-color), #059669);
}

.detail-badge.premium {
  background: linear-gradient(135deg, var(--premium-color), #d97706);
}

.access-status {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.access-status.accessible {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.access-status.restricted {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.access-icon {
  font-size: 1.25rem;
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

.tools {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.tool-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tool-tag {
  padding: 0.25rem 0.75rem;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
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

.lesson-item.locked:hover {
  transform: none;
  border-color: var(--border-color);
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

.lesson-info {
  flex: 1;
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

.lesson-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.lesson-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lesson-type {
  font-size: 1.25rem;
  opacity: 0.7;
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

.upsell-content h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.upsell-content p {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
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

  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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

  .detail-actions {
    flex-direction: column;
  }

  .meta-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .lesson-left {
    gap: 0.75rem;
  }

  .lesson-meta {
    flex-direction: column;
    gap: 0.25rem;
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
  
  .lesson-item {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .lesson-number {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .course-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .course-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
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
select:focus-visible,
.lesson-item:focus-visible,
.course-card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.course-card.loading {
  animation: pulse 2s infinite;
}
</style>