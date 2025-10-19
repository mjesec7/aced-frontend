<template>
  <div class="catalogue-page">
    <!-- Hero Header -->
    <header class="hero-header">
      <div class="hero-content">
        <div class="hero-left">
          <div class="hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Обучение
          </div>
          <h1 class="hero-title">Откройте мир знаний</h1>
          <p class="hero-subtitle">{{ filteredCourses.length }} курсов доступно для изучения</p>
        </div>
        <div class="status-container">
          <div class="status-badge" :class="`status-${userStatus}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            {{ userStatusLabel }}
          </div>
        </div>
      </div>
    </header>

    <!-- Quick Stats -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ courses.length }}</span>
            <span class="stat-label">Всего курсов</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ studyPlanTopics.length }}</span>
            <span class="stat-label">В вашем плане</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ availableSubjects.length }}</span>
            <span class="stat-label">Предметов</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters Bar -->
    <div class="control-section">
      <div class="control-content">
        <!-- Search -->
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Найти курс по названию..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Filter Pills -->
        <div class="filters-pills">
          <div class="filter-pill">
            <label>Предмет</label>
            <select v-model="selectedSubjectFilter">
              <option :value="null">Все</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Уровень</label>
            <select v-model="selectedLevelFilter">
              <option :value="null">Все</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Тип</label>
            <select v-model="typeFilter">
              <option value="all">Все</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div class="filter-pill">
            <label>Прогресс</label>
            <select v-model="progressFilter">
              <option value="all">Все</option>
              <option value="not-started">Не начаты</option>
              <option value="in-progress">В процессе</option>
              <option value="completed">Завершены</option>
            </select>
          </div>

          <button v-if="hasActiveFilters" @click="clearFilters" class="reset-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Сбросить
          </button>

          <button @click="shuffleCourses" class="shuffle-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            Перемешать
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
      <p>Загружаем курсы...</p>
    </div>

    <!-- Main Content -->
    <main v-else class="main-section">
      <!-- Empty State -->
      <div v-if="!paginatedCourses.length" class="empty-container">
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <h3>Курсы не найдены</h3>
        <p>Попробуйте изменить параметры фильтров или поиска</p>
      </div>

      <!-- Courses Grid -->
      <div v-else class="courses-container">
        <div class="courses-grid">
          <article v-for="course in paginatedCourses" :key="course.topicId" class="course-card">
            <!-- Card Header -->
            <div class="card-header">
              <span class="course-badge" :class="course.type">
                {{ getTypeLabel(course.type) }}
              </span>
              <button 
                class="bookmark-btn" 
                :class="{ active: course.inStudyPlan }"
                @click.stop="addToStudyPlan(course)" 
                :disabled="course.inStudyPlan"
              >
                <svg viewBox="0 0 24 24" :fill="course.inStudyPlan ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <h3 class="course-name">{{ course.name }}</h3>
              
              <div class="course-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {{ course.subject }}
                </span>
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  {{ getLevelDescription(course.level) }}
                </span>
              </div>

              <div class="course-stats">
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}
                </div>
                <div class="stat-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ course.totalTime }} мин
                </div>
              </div>

              <!-- Progress -->
              <div class="progress-container">
                <div class="progress-info">
                  <span class="progress-text">Прогресс</span>
                  <span class="progress-percent">{{ course.progress }}%</span>
                </div>
                <div class="progress-track">
                  <div 
                    class="progress-fill" 
                    :class="getProgressColor(course.progress)"
                    :style="{ width: course.progress + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <button 
                class="course-btn" 
                :class="getButtonClass(course.progress)"
                @click="handleCourseAccess(course.topicId, course.type)"
              >
                <span>{{ getButtonText(course.progress) }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div class="pagination-section">
          <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <div class="page-info">
            <span class="page-current">{{ currentPage }}</span>
            <span class="page-separator">/</span>
            <span class="page-total">{{ totalPages }}</span>
          </div>
          
          <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </main>

    <!-- Add to Study Plan Modal -->
    <transition name="modal-fade">
      <div v-if="showAddModal" class="modal-backdrop" @click="showAddModal = false">
        <div class="modal-card" @click.stop>
          <button class="modal-close" @click="showAddModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          
          <h3 class="modal-title">Добавить в план обучения?</h3>
          <p class="modal-text" v-if="selectedCourse">
            Курс <strong>{{ selectedCourse.name }}</strong> будет добавлен в ваш личный план обучения
          </p>
          
          <div class="modal-actions">
            <button @click="showAddModal = false" class="modal-btn secondary">Отмена</button>
            <button @click="confirmAddToStudyPlan" class="modal-btn primary">Добавить</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Success Modal -->
    <transition name="modal-fade">
      <div v-if="showSuccessModal" class="modal-backdrop" @click="showSuccessModal = false">
        <div class="modal-card success" @click.stop>
          <div class="success-animation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          
          <h3 class="modal-title">Успешно добавлено!</h3>
          <p class="modal-text" v-if="selectedCourse">
            {{ selectedCourse.name }}
          </p>
          
          <button @click="showSuccessModal = false" class="modal-btn primary full">Отлично</button>
        </div>
      </div>
    </transition>

    <!-- Paywall Modal -->
    <PaymentModal 
      v-if="showPaywall" 
      :user-id="userId" 
      :visible="showPaywall" 
      :requested-topic-id="requestedTopicId" 
      @close="showPaywall = false" 
      @unlocked="handlePaymentSuccess"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { userStatusMixin } from '@/composables/useUserStatus';
import {
  getAllLessons,
  getUserProgress,
  getUserStudyList,
  addToStudyList
} from '@/api';
import PaymentModal from '@/components/Modals/PaymentModal.vue';

export default {
  name: 'CataloguePage',
  components: { PaymentModal },
  mixins: [userStatusMixin],

  data() {
    return {
      userId: null,
      lang: localStorage.getItem('lang') || 'ru',
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],
      isLoading: true,
      courses: [],
      searchQuery: '',
      selectedSubjectFilter: null,
      selectedLevelFilter: null,
      typeFilter: 'all',
      progressFilter: 'all',
      currentPage: 1,
      coursesPerPage: 20,
      randomSeed: Math.random(),
      showAddModal: false,
      showSuccessModal: false,
      showPaywall: false,
      selectedCourse: null,
      requestedTopicId: null,
    };
  },

  computed: {
    ...mapGetters('user', { vuexUserStatus: 'userStatus' }),
    userStatus() {
      return this.vuexUserStatus || localStorage.getItem('userStatus') || 'free';
    },
    userStatusLabel() {
      const labels = { free: 'Free', start: 'Start', pro: 'Pro' };
      return labels[this.userStatus] || 'Free';
    },
    availableSubjects() {
      const subjects = new Set();
      this.courses.forEach(course => subjects.add(course.subject));
      return Array.from(subjects).sort();
    },
    availableLevels() {
      const levels = new Set();
      this.courses.forEach(course => levels.add(course.level));
      return Array.from(levels).sort((a, b) => Number(a) - Number(b));
    },
    filteredCourses() {
      return this.courses.filter(course => {
        if (this.searchQuery && !course.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }
        if (this.selectedSubjectFilter && course.subject !== this.selectedSubjectFilter) {
          return false;
        }
        if (this.selectedLevelFilter && course.level !== this.selectedLevelFilter) {
          return false;
        }
        if (this.typeFilter === 'free' && course.type !== 'free') return false;
        if (this.typeFilter === 'premium' && course.type === 'free') return false;
        const progress = course.progress || 0;
        if (this.progressFilter === 'not-started' && progress !== 0) return false;
        if (this.progressFilter === 'in-progress' && (progress === 0 || progress === 100)) return false;
        if (this.progressFilter === 'completed' && progress !== 100) return false;
        return true;
      });
    },
    totalPages() {
      return Math.ceil(this.filteredCourses.length / this.coursesPerPage);
    },
    paginatedCourses() {
      const shuffled = [...this.filteredCourses].sort((a, b) => {
        const hashA = this.hashString(a.topicId + this.randomSeed);
        const hashB = this.hashString(b.topicId + this.randomSeed);
        return hashA - hashB;
      });
      const start = (this.currentPage - 1) * this.coursesPerPage;
      const end = start + this.coursesPerPage;
      return shuffled.slice(start, end);
    },
    hasActiveFilters() {
      return !!(
        this.searchQuery || 
        this.selectedSubjectFilter || 
        this.selectedLevelFilter ||
        this.typeFilter !== 'all' || 
        this.progressFilter !== 'all'
      );
    },
  },

  async mounted() {
    await this.initialize();
  },

  methods: {
    async initialize() {
      this.userId = this.$store?.state?.firebaseUserId || localStorage.getItem('firebaseUserId');
      if (!this.userId) {
        this.$router.push('/');
        return;
      }
      await this.loadData();
    },
    async loadData() {
      this.isLoading = true;
      try {
        const [lessonsResult, progressResult, studyListResult] = await Promise.all([
          getAllLessons(),
          getUserProgress(this.userId),
          getUserStudyList(this.userId),
        ]);
        
        this.lessons = lessonsResult?.data || [];
        
        if (progressResult?.success) {
          this.userProgress = this.processProgressData(progressResult.data);
        }
        
        if (studyListResult?.success) {
          this.studyPlanTopics = studyListResult.data.map(item => this.extractTopicId(item.topicId)).filter(Boolean);
        }
        
        this.processAllCourses();
      } catch (error) {
        console.error('Error loading catalogue data:', error);
      } finally {
        this.isLoading = false;
      }
    },
    processProgressData(progressData) {
      const progressMap = {};
      const topicLessonCounts = {};
      progressData.forEach(p => {
        const topicId = this.extractTopicId(p.topicId);
        if (topicId) {
          if (!progressMap[topicId]) progressMap[topicId] = 0;
          if (!topicLessonCounts[topicId]) topicLessonCounts[topicId] = new Set();
          topicLessonCounts[topicId].add(p.lessonId);
          if (p.completed) progressMap[topicId]++;
        }
      });
      const finalProgress = {};
      for (const topicId in progressMap) {
        const completedCount = progressMap[topicId];
        const totalLessons = topicLessonCounts[topicId].size;
        finalProgress[topicId] = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      }
      return finalProgress;
    },
    processAllCourses() {
      const coursesMap = new Map();
      
      this.lessons.forEach(lesson => {
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;
        
        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            topicId,
            name: this.getTopicName(lesson),
            level: String(lesson.level || '1'),
            subject: String(lesson.subject || 'Без категории'),
            lessonCount: 0,
            totalTime: 0,
            type: 'free',
          });
        }
        
        const course = coursesMap.get(topicId);
        course.lessonCount++;
        course.totalTime += this.estimateLessonTime(lesson);
        
        if (['premium', 'start', 'pro'].includes(lesson.type)) {
          course.type = 'premium';
        }
      });
      
      this.courses = Array.from(coursesMap.values()).map(course => ({
        ...course,
        progress: this.userProgress[course.topicId] || 0,
        inStudyPlan: this.studyPlanTopics.includes(course.topicId),
      }));
    },
    clearFilters() {
      this.searchQuery = '';
      this.selectedSubjectFilter = null;
      this.selectedLevelFilter = null;
      this.typeFilter = 'all';
      this.progressFilter = 'all';
      this.currentPage = 1;
    },
    shuffleCourses() {
      this.randomSeed = Math.random();
      this.currentPage = 1;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    },
    handleCourseAccess(topicId, type) {
      if (!this.hasTopicAccess(type)) {
        this.requestedTopicId = topicId;
        this.showPaywall = true;
        return;
      }
      this.$router.push(`/topic/${topicId}/overview`);
    },
    hasTopicAccess(topicType) {
      if (topicType === 'free') return true;
      if (this.userStatus === 'pro') return true;
      if (topicType === 'premium' && this.userStatus === 'start') return true;
      return false;
    },
    addToStudyPlan(course) {
      if (course.inStudyPlan) return;
      this.selectedCourse = course;
      this.showAddModal = true;
    },
    async confirmAddToStudyPlan() {
      if (!this.selectedCourse || !this.userId) return;
      try {
        const topicData = {
          topicId: this.selectedCourse.topicId,
          topic: this.selectedCourse.name,
          subject: this.selectedCourse.subject || 'General',
          level: parseInt(this.selectedCourse.level) || 1,
          lessonCount: this.selectedCourse.lessonCount || 0,
          totalTime: this.selectedCourse.totalTime || 10,
          type: this.selectedCourse.type || 'free'
        };
        
        const result = await addToStudyList(this.userId, topicData);
        
        if (result?.success) {
          this.selectedCourse.inStudyPlan = true;
          this.studyPlanTopics.push(this.selectedCourse.topicId);
          const courseIndex = this.courses.findIndex(c => c.topicId === this.selectedCourse.topicId);
          if (courseIndex !== -1) {
            this.courses[courseIndex].inStudyPlan = true;
          }
          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error(result.error || 'Failed to add to study plan');
        }
      } catch (error) {
        console.error('Error adding to study plan:', error);
        alert(error.message || 'Не удалось добавить курс в план обучения');
        this.showAddModal = false;
      }
    },
    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    },
    extractTopicId(topicId) {
      if (!topicId) return null;
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object') return topicId._id || topicId.id;
      return String(topicId);
    },
    getTopicName(lesson) {
      if (lesson?.topic && typeof lesson.topic === 'string' && lesson.topic.trim()) return lesson.topic.trim();
      return 'Тема без названия';
    },
    estimateLessonTime: (lesson) => lesson.estimatedTime || lesson.duration || 10,
    getLevelDescription(level) {
      const descriptions = { 
        1: 'Начальный', 
        2: 'Элементарный', 
        3: 'Базовый', 
        4: 'Средний', 
        5: 'Продвинутый', 
        6: 'Профессиональный', 
        7: 'Экспертный', 
        8: 'Мастерский', 
        9: 'Виртуозный', 
        10: 'Совершенный' 
      };
      return descriptions[parseInt(level)] || `Уровень ${level}`;
    },
    getProgressColor(progress) {
      if (progress >= 80) return 'high';
      if (progress >= 50) return 'medium';
      if (progress >= 30) return 'low';
      return 'very-low';
    },
    getButtonClass(progress) {
      if (progress === 100) return 'completed';
      if (progress > 0) return 'continue';
      return 'start';
    },
    getButtonText(progress) {
      if (progress === 100) return 'Завершено';
      if (progress > 0) return 'Продолжить';
      return 'Начать курс';
    },
    getTypeLabel(type) {
      return { free: 'Free', premium: 'Premium', pro: 'Pro' }[type] || 'Free';
    },
    getLessonWord(count) {
      if (count % 10 === 1 && count % 100 !== 11) return 'урок';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'урока';
      return 'уроков';
    },
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.catalogue-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
}

/* HERO HEADER */
.hero-header {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  padding: 3rem 0;
  position: relative;
  overflow: hidden;
}
.hero-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
.hero-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}
.hero-left {
  flex: 1;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
.hero-badge svg {
  width: 1rem;
  height: 1rem;
}
.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin: 0 0 1rem 0;
  line-height: 1.1;
}
.hero-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}
.status-container {
  flex-shrink: 0;
}
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.status-badge svg {
  width: 1.25rem;
  height: 1.25rem;
}
.status-badge.status-free {
  color: #6b7280;
}
.status-badge.status-start {
  color: #d97706;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}
.status-badge.status-pro {
  color: white;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

/* STATS SECTION */
.stats-section {
  margin-top: -2rem;
  position: relative;
  z-index: 10;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 2rem;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon svg {
  width: 1.75rem;
  height: 1.75rem;
}
.stat-icon.blue {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #3b82f6;
}
.stat-icon.purple {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #a855f7;
}
.stat-icon.gold {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}
.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* CONTROL SECTION */
.control-section {
  max-width: 1400px;
  margin: 3rem auto 2rem;
  padding: 0 2rem;
}
.control-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.search-container {
  position: relative;
  width: 100%;
}
.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 1rem 3.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}
.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.clear-btn:hover {
  background: #e5e7eb;
  color: #111827;
}
.clear-btn svg {
  width: 1rem;
  height: 1rem;
}

/* FILTER PILLS */
.filters-pills {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}
.filter-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}
.filter-pill:hover {
  border-color: #d1d5db;
}
.filter-pill label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}
.filter-pill select {
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  padding: 0.25rem;
}
.reset-btn, .shuffle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.reset-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fca5a5;
}
.reset-btn:hover {
  background: #fee2e2;
}
.shuffle-btn {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 2px solid #fbbf24;
}
.shuffle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}
.reset-btn svg, .shuffle-btn svg {
  width: 1rem;
  height: 1rem;
}

/* LOADING */
.loading-container {
  max-width: 1400px;
  margin: 4rem auto;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}
.loader {
  position: relative;
  width: 80px;
  height: 80px;
}
.loader-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid transparent;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}
.loader-ring:nth-child(2) {
  border-top-color: #a855f7;
  animation-delay: 0.2s;
  width: 90%;
  height: 90%;
  top: 5%;
  left: 5%;
}
.loader-ring:nth-child(3) {
  border-top-color: #fbbf24;
  animation-delay: 0.4s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-container p {
  font-size: 1.125rem;
  color: #6b7280;
  font-weight: 500;
}

/* EMPTY STATE */
.empty-container {
  max-width: 600px;
  margin: 4rem auto;
  padding: 4rem 2rem;
  text-align: center;
}
.empty-illustration {
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-illustration svg {
  width: 60px;
  height: 60px;
  color: #9ca3af;
}
.empty-container h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}
.empty-container p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* MAIN SECTION */
.main-section {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}
.courses-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* COURSES GRID */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
}

/* COURSE CARD */
.course-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 2px solid transparent;
}
.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: #e5e7eb;
}
.card-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.course-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.course-badge.free {
  background: #f3f4f6;
  color: #6b7280;
}
.course-badge.premium, .course-badge.pro {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}
.bookmark-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
}
.bookmark-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
  transform: scale(1.05);
}
.bookmark-btn.active {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-color: #3b82f6;
  color: #3b82f6;
}
.bookmark-btn:disabled {
  cursor: not-allowed;
}
.bookmark-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.card-body {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.course-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}
.course-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
.meta-item svg {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
}
.course-stats {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 600;
}
.stat-item svg {
  width: 1.125rem;
  height: 1.125rem;
  color: #6b7280;
}

.progress-container {
  margin-top: auto;
}
.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.progress-text {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}
.progress-percent {
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 700;
}
.progress-track {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 100px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-fill.high {
  background: linear-gradient(90deg, #10b981, #059669);
}
.progress-fill.medium {
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}
.progress-fill.low {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}
.progress-fill.very-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.card-footer {
  padding: 0 1.5rem 1.5rem;
}
.course-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.course-btn svg {
  width: 1.125rem;
  height: 1.125rem;
}
.course-btn.start {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.course-btn.start:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(168, 85, 247, 0.3);
}
.course-btn.continue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}
.course-btn.continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}
.course-btn.completed {
  background: #f3f4f6;
  color: #6b7280;
  cursor: default;
}

/* PAGINATION */
.pagination-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}
.page-btn {
  width: 3rem;
  height: 3rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  border-color: #6366f1;
  background: #eef2ff;
  color: #6366f1;
  transform: scale(1.05);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}
.page-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
}
.page-current {
  color: #6366f1;
}
.page-separator {
  color: #d1d5db;
}
.page-total {
  color: #9ca3af;
}

/* MODALS */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal-card {
  background: white;
  border-radius: 24px;
  max-width: 28rem;
  width: 100%;
  padding: 2rem;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.modal-card.success {
  text-align: center;
}
.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}
.modal-close:hover {
  background: #e5e7eb;
  color: #111827;
}
.modal-close svg {
  width: 1.125rem;
  height: 1.125rem;
}
.modal-icon {
  width: 4rem;
  height: 4rem;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #3b82f6;
}
.modal-icon svg {
  width: 2rem;
  height: 2rem;
}
.success-animation {
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #10b981;
  animation: successPulse 0.6s ease-out;
}
@keyframes successPulse {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.success-animation svg {
  width: 2.5rem;
  height: 2.5rem;
}
.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
}
.modal-text {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}
.modal-text strong {
  color: #111827;
  font-weight: 600;
}
.modal-actions {
  display: flex;
  gap: 1rem;
}
.modal-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-btn.secondary {
  background: #f3f4f6;
  color: #6b7280;
}
.modal-btn.secondary:hover {
  background: #e5e7eb;
}
.modal-btn.primary {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  color: white;
}
.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(168, 85, 247, 0.3);
}
.modal-btn.full {
  width: 100%;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-card, 
.modal-fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from .modal-card, 
.modal-fade-leave-to .modal-card {
  transform: scale(0.9) translateY(-20px);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 0 1.5rem;
  }
  .stats-section {
    padding: 0 1.5rem;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .control-section, .main-section {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .filters-pills {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-pill {
    width: 100%;
  }
  .courses-grid {
    grid-template-columns: 1fr;
  }
  .modal-actions {
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>