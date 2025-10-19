<template>
  <div class="catalogue-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div>
            <h1 class="page-title">Каталог курсов</h1>
          </div>
        </div>
        <div class="status-badge" :class="`status-${userStatus}`">
          {{ userStatusLabel }}
        </div>
      </div>
    </header>

    <div class="filters-section">
      <div class="filters-content">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Поиск курсов..."
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="filters-row">
          <div class="filter-dropdown">
            <label class="dropdown-label">Предмет:</label>
            <select v-model="selectedSubjectFilter" class="dropdown-select">
              <option :value="null">Все предметы</option>
              <option v-for="subject in availableSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>
          </div>

          <div class="filter-dropdown">
            <label class="dropdown-label">Уровень:</label>
            <select v-model="selectedLevelFilter" class="dropdown-select">
              <option :value="null">Все уровни</option>
              <option v-for="level in availableLevels" :key="level" :value="level">
                Уровень {{ level }}
              </option>
            </select>
          </div>

          <div class="filter-dropdown">
            <label class="dropdown-label">Тип:</label>
            <select v-model="typeFilter" class="dropdown-select">
              <option value="all">Все типы</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div class="filter-dropdown">
            <label class="dropdown-label">Прогресс:</label>
            <select v-model="progressFilter" class="dropdown-select">
              <option value="all">Все</option>
              <option value="not-started">Не начаты</option>
              <option value="in-progress">В процессе</option>
              <option value="completed">Завершены</option>
            </select>
          </div>

          <button v-if="hasActiveFilters" @click="clearFilters" class="clear-all-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Сбросить
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка каталога...</p>
    </div>

    <main v-else class="main-content">
      <div class="results-header">
        <p class="results-count">Найдено курсов: {{ filteredCourses.length }}</p>
      </div>

      <div v-if="filteredCourses.length" class="courses-grid">
        <div v-for="course in filteredCourses" :key="course.topicId" class="course-card">
          <div class="course-header">
            <span :class="['course-type', course.type]">{{ getTypeLabel(course.type) }}</span>
            <button class="add-btn" @click.stop="addToStudyPlan(course)" :disabled="course.inStudyPlan" :title="course.inStudyPlan ? 'Уже в вашем плане' : 'Добавить в план обучения'">
              <svg v-if="course.inStudyPlan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <h3 class="course-title">{{ course.name }}</h3>

          <div class="course-info">
            <div class="info-row">
              <span class="info-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Предмет:
              </span>
              <span class="info-value">{{ course.subject }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Уровень:
              </span>
              <span class="info-value">{{ getLevelDescription(course.level) }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Уроков:
              </span>
              <span class="info-value">{{ course.lessonCount }} {{ getLessonWord(course.lessonCount) }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Время:
              </span>
              <span class="info-value">{{ course.totalTime }} мин</span>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Ваш прогресс</span>
              <span class="progress-value">{{ course.progress }}%</span>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar" :class="getProgressColor(course.progress)" :style="{ width: course.progress + '%' }"></div>
            </div>
          </div>

          <button class="action-btn" :class="getButtonClass(course.progress)" @click="handleCourseAccess(course.topicId, course.type)">
            {{ getButtonText(course.progress) }}
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 class="empty-title">Курсы не найдены</h3>
        <p class="empty-text">Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    </main>

    <transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Добавить в план обучения?</h3>
            <button class="modal-close" @click="showAddModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body" v-if="selectedCourse">
            <div class="course-preview">
              <h4>{{ selectedCourse.name }}</h4>
              <p class="course-desc">{{ selectedCourse.subject }} - {{ getLevelDescription(selectedCourse.level) }}</p>
              <div class="course-preview-stats">
                <span class="preview-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {{ selectedCourse.lessonCount }} уроков
                </span>
                <span class="preview-stat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ selectedCourse.totalTime }} мин
                </span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAddModal = false" class="modal-btn secondary">Отмена</button>
            <button @click="confirmAddToStudyPlan" class="modal-btn primary">Добавить</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
        <div class="modal-container success" @click.stop>
          <div class="success-content">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 class="success-title">Добавлено в план!</h3>
            <p class="success-text">Курс "{{ selectedCourse?.name }}" теперь в вашем плане обучения</p>
            <button @click="showSuccessModal = false" class="modal-btn primary">Отлично!</button>
          </div>
        </div>
      </div>
    </transition>

    <PaymentModal v-if="showPaywall" :user-id="userId" :visible="showPaywall" :requested-topic-id="requestedTopicId" @close="showPaywall = false" @unlocked="handlePaymentSuccess"/>
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

      // Raw API data
      lessons: [],
      userProgress: {},
      studyPlanTopics: [],

      // UI State
      isLoading: true,

      // All courses (no view navigation needed)
      courses: [],

      // Filters
      searchQuery: '',
      selectedSubjectFilter: null,
      selectedLevelFilter: null,
      typeFilter: 'all',
      progressFilter: 'all',

      // Modal State
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
        // Search filter
        if (this.searchQuery && !course.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          return false;
        }

        // Subject filter
        if (this.selectedSubjectFilter && course.subject !== this.selectedSubjectFilter) {
          return false;
        }

        // Level filter
        if (this.selectedLevelFilter && course.level !== this.selectedLevelFilter) {
          return false;
        }

        // Type filter
        if (this.typeFilter === 'free' && course.type !== 'free') return false;
        if (this.typeFilter === 'premium' && course.type === 'free') return false;

        // Progress filter
        const progress = course.progress || 0;
        if (this.progressFilter === 'not-started' && progress !== 0) return false;
        if (this.progressFilter === 'in-progress' && (progress === 0 || progress === 100)) return false;
        if (this.progressFilter === 'completed' && progress !== 100) return false;

        return true;
      });
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
    // --- INITIALIZATION & DATA LOADING ---
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

    // --- DATA PROCESSING ---
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

    // --- UI HANDLERS ---
    clearFilters() {
      this.searchQuery = '';
      this.selectedSubjectFilter = null;
      this.selectedLevelFilter = null;
      this.typeFilter = 'all';
      this.progressFilter = 'all';
    },

    // --- USER ACTIONS ---
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
        const topicId = this.extractTopicId(this.selectedCourse.topicId);
        const result = await addToStudyList(this.userId, { topicId });
        if (result?.success) {
          this.selectedCourse.inStudyPlan = true;
          this.studyPlanTopics.push(topicId);
          const courseIndex = this.courses.findIndex(c => c.topicId === topicId);
          if (courseIndex !== -1) {
            this.courses[courseIndex].inStudyPlan = true;
          }
          this.showAddModal = false;
          this.showSuccessModal = true;
        } else {
          throw new Error('API returned failure on add to study plan');
        }
      } catch (error) {
        console.error('Error adding to study plan:', error);
        alert('Не удалось добавить курс в план обучения');
        this.showAddModal = false;
      }
    },
    handlePaymentSuccess() {
      this.showPaywall = false;
      this.$forceUpdate();
    },

    // --- HELPER METHODS ---
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
      return 'Начать';
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
/* GENERAL STYLES */
.catalogue-page {
  min-height: 100vh;
  background: #fafafa;
  padding-bottom: 2rem;
}

/* HEADER */
.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  position: sticky;
  top: 0;
  z-index: 900;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.8);
}
.header-content {
  max-width: 1400px; 
  margin: 0 auto; 
  padding: 0 2rem;
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  gap: 1rem;
}
.header-left { 
  flex: 1; 
  min-width: 0; 
}
.page-title { 
  font-size: 1.875rem; 
  font-weight: 700; 
  color: #111827; 
  margin: 0; 
}
.status-badge {
  padding: 0.5rem 1rem; 
  border-radius: 8px; 
  font-size: 0.75rem;
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
  flex-shrink: 0;
}
.status-badge.status-free { 
  background: #f3f4f6; 
  color: #6b7280; 
}
.status-badge.status-start { 
  background: #faf5ff; 
  color: #a855f7; 
}
.status-badge.status-pro { 
  background: linear-gradient(135deg, #a855f7, #6366f1); 
  color: white; 
}

/* FILTERS */
.filters-section { 
  max-width: 1400px; 
  margin: 0 auto 2rem; 
  padding: 0 2rem; 
}
.filters-content {
  background: white; 
  border: 1px solid #e5e7eb; 
  border-radius: 12px;
  padding: 1.5rem; 
  display: flex; 
  flex-direction: column; 
  gap: 1.25rem;
}
.search-box { 
  position: relative; 
  width: 100%; 
}
.search-icon { 
  position: absolute; 
  left: 1rem; 
  top: 50%; 
  transform: translateY(-50%); 
  width: 1.125rem; 
  height: 1.125rem; 
  color: #9ca3af; 
}
.search-input {
  width: 100%; 
  padding: 0.75rem 3rem; 
  border: 1px solid #e5e7eb;
  border-radius: 10px; 
  font-size: 0.9375rem; 
  transition: all 0.2s; 
  background: #fafafa;
}
.search-input:focus { 
  outline: none; 
  border-color: #a855f7; 
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1); 
  background: white; 
}
.clear-search-btn {
  position: absolute; 
  right: 0.75rem; 
  top: 50%; 
  transform: translateY(-50%);
  width: 1.75rem; 
  height: 1.75rem; 
  border: none; 
  background: #e5e7eb;
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer; 
  transition: all 0.2s; 
  color: #6b7280;
}
.clear-search-btn:hover { 
  background: #d1d5db; 
  color: #111827; 
}
.clear-search-btn svg { 
  width: 1rem; 
  height: 1rem; 
}
.filter-chips { 
  display: flex; 
  flex-direction: column; 
  gap: 1rem; 
}
.filter-group { 
  display: flex; 
  flex-direction: column; 
  gap: 0.625rem; 
}
.filter-label { 
  font-size: 0.8125rem; 
  font-weight: 600; 
  color: #6b7280; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
}
.chips-row { 
  display: flex; 
  gap: 0.5rem; 
  flex-wrap: wrap; 
}
.filter-chip {
  padding: 0.5rem 1rem; 
  border: 1.5px solid #e5e7eb; 
  background: white;
  border-radius: 20px; 
  font-size: 0.875rem; 
  font-weight: 500;
  color: #6b7280; 
  cursor: pointer; 
  transition: all 0.2s;
}
.filter-chip:hover { 
  border-color: #a855f7; 
  color: #a855f7; 
  background: #faf5ff; 
}
.filter-chip.active { 
  background: #a855f7; 
  border-color: #a855f7; 
  color: white; 
}
.clear-all-btn {
  align-self: flex-start; 
  display: flex; 
  align-items: center; 
  gap: 0.5rem;
  padding: 0.625rem 1.125rem; 
  border: 1.5px solid #fca5a5; 
  background: #fef2f2;
  border-radius: 8px; 
  font-size: 0.875rem; 
  font-weight: 500; 
  color: #dc2626;
  cursor: pointer; 
  transition: all 0.2s;
}
.clear-all-btn:hover { 
  background: #fee2e2; 
  border-color: #f87171; 
}
.clear-all-btn svg { 
  width: 1rem; 
  height: 1rem; 
}

/* LOADING & EMPTY STATES */
.loading-state, .empty-state {
  max-width: 1400px; 
  margin: 0 auto; 
  padding: 4rem 2rem; 
  display: flex;
  flex-direction: column; 
  align-items: center; 
  justify-content: center;
  text-align: center; 
  min-height: 400px;
}
.spinner {
  width: 3rem; 
  height: 3rem; 
  border: 3px solid #f3f4f6; 
  border-top-color: #a855f7;
  border-radius: 50%; 
  animation: spin 1s linear infinite; 
  margin-bottom: 1rem;
}
@keyframes spin { 
  to { 
    transform: rotate(360deg); 
  } 
}
.loading-state p { 
  color: #6b7280; 
  font-size: 0.875rem; 
}
.empty-icon { 
  width: 4rem; 
  height: 4rem; 
  color: #d1d5db; 
  margin-bottom: 1rem; 
}
.empty-title { 
  font-size: 1.25rem; 
  font-weight: 600; 
  color: #111827; 
  margin: 0 0 0.5rem 0; 
}
.empty-text { 
  color: #6b7280; 
  font-size: 0.875rem; 
  margin: 0; 
}

/* MAIN CONTENT */
.main-content { 
  max-width: 1400px; 
  margin: 0 auto; 
  padding: 0 2rem; 
}
.results-header {
  margin-bottom: 1.5rem;
}
.results-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
}

/* COURSES GRID */
.courses-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); 
  gap: 1.5rem; 
}

/* COURSE CARDS */
.course-card {
  background: white; 
  border: 1px solid #e5e7eb; 
  border-radius: 12px;
  padding: 1.5rem; 
  transition: all 0.2s; 
  display: flex; 
  flex-direction: column; 
  gap: 1rem;
}
.course-card:hover { 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); 
  border-color: #d1d5db;
}
.course-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  gap: 1rem; 
}
.course-type {
  padding: 0.25rem 0.625rem; 
  border-radius: 6px; 
  font-size: 0.75rem;
  font-weight: 600; 
  text-transform: uppercase; 
  letter-spacing: 0.025em;
}
.course-type.free { 
  background: #f3f4f6; 
  color: #6b7280; 
}
.course-type.premium, 
.course-type.pro { 
  background: #faf5ff; 
  color: #a855f7; 
}
.add-btn {
  width: 2rem; 
  height: 2rem; 
  border: 1.5px solid #e5e7eb; 
  background: white;
  border-radius: 8px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer; 
  transition: all 0.2s; 
  color: #6b7280; 
  flex-shrink: 0;
}
.add-btn:hover:not(:disabled) { 
  border-color: #a855f7; 
  background: #faf5ff; 
  color: #a855f7; 
}
.add-btn:disabled { 
  background: #dcfce7; 
  border-color: #86efac; 
  color: #10b981; 
  cursor: not-allowed; 
}
.add-btn svg { 
  width: 1rem; 
  height: 1rem; 
}
.course-title { 
  font-size: 1.125rem; 
  font-weight: 600; 
  color: #111827; 
  margin: 0; 
  line-height: 1.4; 
}

/* COURSE INFO */
.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #fafafa;
  border-radius: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.info-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}
.info-label svg {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}
.info-value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

/* PROGRESS & ACTION BUTTONS */
.progress-section { 
  margin-top: auto; 
}
.progress-header { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 0.5rem; 
  font-size: 0.8125rem; 
}
.progress-label { 
  color: #6b7280; 
  font-weight: 500; 
}
.progress-value { 
  color: #111827; 
  font-weight: 600; 
}
.progress-bar-wrapper { 
  width: 100%; 
  height: 6px; 
  background: #f3f4f6; 
  border-radius: 9999px; 
  overflow: hidden; 
}
.progress-bar { 
  height: 100%; 
  border-radius: 9999px; 
  transition: width 0.5s ease; 
}
.progress-bar.high { 
  background: linear-gradient(to right, #10b981, #059669); 
}
.progress-bar.medium { 
  background: linear-gradient(to right, #3b82f6, #2563eb); 
}
.progress-bar.low { 
  background: linear-gradient(to right, #f59e0b, #d97706); 
}
.progress-bar.very-low { 
  background: linear-gradient(to right, #ef4444, #dc2626); 
}
.action-btn { 
  width: 100%; 
  padding: 0.75rem; 
  border: none; 
  border-radius: 8px; 
  font-size: 0.875rem; 
  font-weight: 600; 
  cursor: pointer; 
  transition: all 0.2s; 
}
.action-btn.start { 
  background: linear-gradient(135deg, #a855f7, #9333ea); 
  color: white; 
}
.action-btn.start:hover { 
  transform: translateY(-1px); 
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3); 
}
.action-btn.continue { 
  background: linear-gradient(135deg, #3b82f6, #2563eb); 
  color: white; 
}
.action-btn.continue:hover { 
  transform: translateY(-1px); 
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); 
}
.action-btn.completed { 
  background: #f3f4f6; 
  color: #6b7280; 
  cursor: default; 
}

/* MODALS */
.modal-overlay {
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.5); 
  backdrop-filter: blur(4px);
  display: flex; 
  align-items: center; 
  justify-content: center; 
  z-index: 1000; 
  padding: 1rem;
}
.modal-container {
  background: white; 
  border-radius: 16px; 
  max-width: 28rem; 
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); 
  animation: modalSlide 0.3s ease-out;
}
@keyframes modalSlide { 
  from { 
    opacity: 0; 
    transform: scale(0.95) translateY(-20px); 
  } 
  to { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  } 
}
.modal-header { 
  padding: 1.5rem 1.5rem 1rem; 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  border-bottom: 1px solid #f3f4f6; 
}
.modal-title { 
  font-size: 1.125rem; 
  font-weight: 600; 
  color: #111827; 
  margin: 0; 
  flex: 1; 
}
.modal-close {
  width: 2rem; 
  height: 2rem; 
  border: none; 
  background: #f9fafb; 
  border-radius: 6px;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  cursor: pointer;
  color: #9ca3af; 
  transition: all 0.2s; 
  flex-shrink: 0;
}
.modal-close:hover { 
  background: #f3f4f6; 
  color: #111827; 
}
.modal-close svg { 
  width: 1.125rem; 
  height: 1.125rem; 
}
.modal-body { 
  padding: 1.5rem; 
}
.course-preview { 
  background: #fafafa; 
  border: 1px solid #e5e7eb; 
  border-radius: 10px; 
  padding: 1.5rem; 
  text-align: center; 
}
.course-preview h4 { 
  font-size: 1.125rem; 
  font-weight: 600; 
  color: #111827; 
  margin: 0 0 0.5rem 0; 
}
.course-desc { 
  font-size: 0.875rem; 
  color: #6b7280; 
  margin: 0 0 1rem 0; 
}
.course-preview-stats { 
  display: flex; 
  gap: 1rem; 
  justify-content: center; 
  flex-wrap: wrap; 
}
.preview-stat { 
  display: flex; 
  align-items: center; 
  gap: 0.375rem; 
  font-size: 0.8125rem; 
  color: #6b7280; 
}
.preview-stat svg { 
  width: 0.875rem; 
  height: 0.875rem; 
}
.modal-footer { 
  padding: 1rem 1.5rem 1.5rem; 
  display: flex; 
  gap: 0.75rem; 
}
.modal-btn { 
  flex: 1; 
  padding: 0.75rem 1.5rem; 
  border-radius: 8px; 
  font-weight: 500; 
  font-size: 0.9375rem; 
  cursor: pointer; 
  transition: all 0.2s; 
  border: none; 
}
.modal-btn.secondary { 
  background: white; 
  color: #6b7280; 
  border: 1.5px solid #e5e7eb; 
}
.modal-btn.secondary:hover { 
  background: #f9fafb; 
  border-color: #d1d5db; 
}
.modal-btn.primary { 
  background: #a855f7; 
  color: white; 
}
.modal-btn.primary:hover { 
  background: #9333ea; 
}
.modal-container.success { 
  max-width: 24rem; 
}
.success-content { 
  padding: 2rem; 
  text-align: center; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 1rem; 
}
.success-icon { 
  width: 4rem; 
  height: 4rem; 
  background: #dcfce7; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #10b981; 
}
.success-icon svg { 
  width: 2rem; 
  height: 2rem; 
}
.success-title { 
  font-size: 1.25rem; 
  font-weight: 600; 
  color: #10b981; 
  margin: 0; 
}
.success-text { 
  color: #6b7280; 
  font-size: 0.875rem; 
  margin: 0; 
  line-height: 1.6; 
}
.modal-enter-active, 
.modal-leave-active { 
  transition: opacity 0.3s ease; 
}
.modal-enter-active .modal-container, 
.modal-leave-active .modal-container { 
  transition: all 0.3s ease; 
}
.modal-enter-from, 
.modal-leave-to { 
  opacity: 0; 
}
.modal-enter-from .modal-container, 
.modal-leave-to .modal-container { 
  transform: scale(0.95) translateY(-20px); 
  opacity: 0; 
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header { 
    padding: 1rem 0; 
  }
  .header-content { 
    padding: 0 1.5rem; 
    flex-direction: column; 
    align-items: flex-start; 
  }
  .page-title { 
    font-size: 1.5rem; 
  }
  .filters-section, 
  .main-content { 
    padding: 0 1.5rem; 
  }
  .filters-content { 
    padding: 1.25rem; 
  }
  .courses-grid { 
    grid-template-columns: 1fr; 
  }
  .modal-footer { 
    flex-direction: column; 
  }
  .modal-btn { 
    width: 100%; 
  }
}
@media (max-width: 640px) {
  .page-header { 
    margin-bottom: 1.5rem; 
  }
  .header-content, 
  .filters-section, 
  .main-content { 
    padding: 0 1rem; 
  }
  .page-title { 
    font-size: 1.25rem; 
  }
}

/* ACCESSIBILITY */
.search-input:focus-visible, 
.filter-chip:focus-visible, 
.clear-all-btn:focus-visible, 
.add-btn:focus-visible, 
.action-btn:focus-visible, 
.modal-close:focus-visible, 
.modal-btn:focus-visible {
  outline: 2px solid #a855f7; 
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) { 
  * { 
    animation-duration: 0.01ms !important; 
    transition-duration: 0.01ms !important; 
  } 
}
</style>