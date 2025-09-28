<template>
  <section class="aced-section" id="aced">
    <div class="left-content">
      <h1 class="headline">Начни своё обучение <br />уже сегодня</h1>
      <p class="context-text">Выбери курс и начни изучать прямо сейчас</p>
      
      <div class="filter-controls">
        <div class="subject-filter">
          <label>Предмет:</label>
          <select v-model="selectedSubject" @change="filterCourses">
            <option value="">Все предметы</option>
            <option v-for="subject in availableSubjects" :key="subject" :value="subject">
              {{ subject }}
            </option>
          </select>
        </div>
        
        <div class="type-filter">
          <label>Тип:</label>
          <select v-model="selectedType" @change="filterCourses">
            <option value="">Все курсы</option>
            <option value="free">💚 Бесплатные</option>
            <option value="premium">💎 Премиум</option>
            <option value="pro">🌟 Pro</option>
          </select>
        </div>
        
        <button class="refresh-btn" @click="refreshCourses" :disabled="loadingCourses">
          <span class="refresh-icon" :class="{ 'spinning': loadingCourses }">🔄</span>
          {{ loadingCourses ? 'Загрузка...' : 'Обновить' }}
        </button>
      </div>
    </div>

    <div class="courses-grid">
      <div v-if="loadingCourses" class="loading-grid">
        <div class="course-placeholder" v-for="n in 6" :key="n">
          <div class="placeholder-content">⏳</div>
        </div>
      </div>
      
      <div v-else-if="filteredCourses.length > 0" class="courses-container">
        <div 
          v-for="course in displayedCourses" 
          :key="course._id"
          class="course-card"
          :class="[
            `course-${getTopicType(course)}`,
            { 'featured': isFeaturedCourse(course) }
          ]"
          @click="handleCourseClick(course)"
        >
          <div class="course-badge" :class="getTopicType(course)">
            <span class="badge-icon">{{ getTopicTypeIcon(course) }}</span>
            <span class="badge-text">{{ getTopicTypeLabel(course) }}</span>
          </div>
          
          <div class="course-content">
            <div class="course-subject">{{ course.subject || 'Общий' }}</div>
            <h3 class="course-title">{{ getTopicName(course) }}</h3>
            <p class="course-description">{{ getTopicDescription(course) }}</p>
            
            <div class="course-stats">
              <div class="stat-item">
                <span class="stat-icon">📚</span>
                <span class="stat-value">{{ course.lessons?.length || 0 }}</span>
                <span class="stat-label">уроков</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">⏱️</span>
                <span class="stat-value">{{ Math.round((course.totalTime || 0) / 60) || 1 }}ч</span>
                <span class="stat-label">времени</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📈</span>
                <span class="stat-value">{{ course.level || 1 }}</span>
                <span class="stat-label">уровень</span>
              </div>
            </div>
          </div>
          
          <div class="course-actions">
            <button 
              class="start-course-btn"
              :class="getStartButtonClass(course)"
              @click.stop="handleStartCourse(course)"
              :disabled="processingCourse === course._id"
            >
              <span class="btn-icon">{{ getStartButtonIcon(course) }}</span>
              <span class="btn-text">{{ getStartButtonText(course) }}</span>
            </button>
          </div>
          
          <div class="course-hover-overlay"></div>
        </div>
      </div>
      
      <div v-else class="empty-courses">
        <div class="empty-icon">🔍</div>
        <h3>Курсы не найдены</h3>
        <p v-if="selectedSubject || selectedType">
          Попробуйте изменить фильтры поиска
        </p>
        <p v-else>
          Загружаем актуальные курсы...
        </p>
        <button v-if="!loadingCourses" @click="refreshCourses" class="retry-btn">
          🔄 Попробовать снова
        </button>
      </div>
    </div>

    <div v-if="showRegistrationModal" class="modal-overlay" @click="closeRegistrationModal">
      <div class="registration-modal" @click.stop>
        <span class="close-btn" @click="closeRegistrationModal">×</span>
        
        <div class="modal-header">
          <h2>🎓 Премиум доступ</h2>
          <p>Для доступа к этому курсу необходимо зарегистрироваться</p>
        </div>
        
        <div class="course-preview" v-if="selectedCourse">
          <img :src="getCourseIcon(selectedCourse)" class="course-icon" />
          <div class="course-info">
            <h3>{{ getTopicName(selectedCourse) }}</h3>
            <p>{{ getTopicTypeLabel(selectedCourse) }} курс</p>
            <div class="course-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">📚</span>
                <span>{{ selectedCourse.lessons?.length || 0 }} уроков</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🎯</span>
                <span>Практические задания</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🏆</span>
                <span>Сертификат по завершении</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="register-btn" @click="triggerRegistration">
            <span class="btn-icon">🚀</span>
            <span>Зарегистрироваться и начать</span>
          </button>
          <button class="cancel-btn" @click="closeRegistrationModal">
            Пока не готов
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="error-alert">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="retry-error-btn" @click="refreshCourses">🔄 Повторить</button>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";
import { getTopics, getAllLessons } from '@/api';

export default {
  name: "AcedSection",
  data() {
    return {
      // Course data
      allCourses: [],
      filteredCourses: [],
      displayedCourses: [],
      maxDisplayedCourses: 6,
      
      // Filter states
      selectedSubject: '',
      selectedType: '',
      availableSubjects: [],
      
      // Loading states
      loadingCourses: true,
      processingCourse: null,
      
      // Modal states
      showRegistrationModal: false,
      selectedCourse: null,
      
      // Error handling
      errorMessage: null,
      retryCount: 0,
      maxRetries: 3,
      
      // Configuration
      lang: localStorage.getItem('lang') || 'ru'
    };
  },
  
  async mounted() {
    try {
      await this.initializeCourses();
    } catch (error) {
      console.error('❌ AcedSection mount error:', error);
      this.handleError(error);
    }
  },
  
  methods: {
    async initializeCourses() {
      this.loadingCourses = true;
      this.errorMessage = null;
      
      try {
        // Try to get courses from lessons first (same as MainPage)
        let coursesData = await this.fetchCoursesFromLessons();
        
        if (!coursesData || coursesData.length === 0) {
          // Fallback to topics
          coursesData = await this.fetchCoursesFromTopics();
        }
        
        if (coursesData && coursesData.length > 0) {
          this.allCourses = coursesData;
          this.extractSubjects();
          this.filterCourses();
          console.log(`✅ Loaded ${coursesData.length} courses`);
        } else {
          this.allCourses = [];
          this.filteredCourses = [];
          this.displayedCourses = [];
        }
        
      } catch (error) {
        console.error('❌ Error initializing courses:', error);
        this.handleError(error);
      } finally {
        this.loadingCourses = false;
      }
    },
    
    async fetchCoursesFromLessons() {
      try {
        const lessonsResult = await getAllLessons();
        
        if (lessonsResult?.success && Array.isArray(lessonsResult.data) && lessonsResult.data.length > 0) {
          return this.buildCoursesFromLessons(lessonsResult.data);
        }
        return [];
      } catch (error) {
        console.error('❌ Error fetching courses from lessons:', error);
        return [];
      }
    },
    
    async fetchCoursesFromTopics() {
      try {
        const topicsResult = await getTopics({ includeStats: true });
        
        if (topicsResult?.success && Array.isArray(topicsResult.data) && topicsResult.data.length > 0) {
          return topicsResult.data.filter(topic => topic.lessons?.length > 0);
        }
        return [];
      } catch (error) {
        console.error('❌ Error fetching courses from topics:', error);
        return [];
      }
    },
    
    buildCoursesFromLessons(lessons) {
      const coursesMap = new Map();
      
      lessons.forEach(lesson => {
        if (!lesson?.topicId) return;
        
        const topicId = this.extractTopicId(lesson.topicId);
        if (!topicId) return;
        
        const topicName = this.getTopicNameFromLesson(lesson);
        if (!topicName) return;
        
        if (!coursesMap.has(topicId)) {
          coursesMap.set(topicId, {
            _id: topicId,
            name: topicName,
            topicName: topicName,
            description: `Курс по теме "${topicName}"`,
            subject: lesson.subject || 'Общий',
            level: lesson.level || 1,
            type: lesson.type || 'free',
            lessons: [lesson],
            lessonCount: 1,
            totalTime: this.calculateLessonTime(lesson),
            isActive: true,
            hasLessons: true,
            createdAt: lesson.createdAt || new Date().toISOString()
          });
        } else {
          const course = coursesMap.get(topicId);
          course.lessons.push(lesson);
          course.lessonCount++;
          course.totalTime += this.calculateLessonTime(lesson);
        }
      });
      
      return Array.from(coursesMap.values())
        .filter(course => course.lessons.length > 0)
        .sort((a, b) => {
          // Prioritize free courses for non-registered users
          if (a.type !== b.type) {
            if (a.type === 'free') return -1;
            if (b.type === 'free') return 1;
          }
          return a.subject.localeCompare(b.subject);
        });
    },
    
    extractSubjects() {
      const subjects = new Set();
      this.allCourses.forEach(course => {
        if (course.subject) {
          subjects.add(course.subject);
        }
      });
      this.availableSubjects = Array.from(subjects).sort();
    },
    
    filterCourses() {
      let filtered = [...this.allCourses];
      
      // Filter by subject
      if (this.selectedSubject) {
        filtered = filtered.filter(course => course.subject === this.selectedSubject);
      }
      
      // Filter by type
      if (this.selectedType) {
        filtered = filtered.filter(course => this.getTopicType(course) === this.selectedType);
      }
      
      this.filteredCourses = filtered;
      this.updateDisplayedCourses();
    },
    
    updateDisplayedCourses() {
      this.displayedCourses = this.filteredCourses.slice(0, this.maxDisplayedCourses);
    },
    
    async refreshCourses() {
      if (this.retryCount >= this.maxRetries) {
        this.errorMessage = 'Превышено максимальное количество попыток';
        return;
      }
      
      this.retryCount++;
      await this.initializeCourses();
      
      if (!this.errorMessage) {
        this.retryCount = 0;
      }
    },
    
    handleCourseClick(course) {
      // Show course details or start course
      this.handleStartCourse(course);
    },
    
    async handleStartCourse(course) {
      if (!course?._id || this.processingCourse === course._id) {
        return;
      }
      
      this.processingCourse = course._id;
      
      try {
        const topicType = this.getTopicType(course);
        const isAuthenticated = this.checkUserAuthentication();
        
        // Free courses - allow access for everyone
        if (topicType === 'free') {
          await this.$router.push({ 
            name: 'TopicOverview',
            params: { id: course._id },
            query: { source: 'aced-section', guest: isAuthenticated ? 'false' : 'true' }
          });
        } else {
          // Premium/Pro courses - require registration
          this.selectedCourse = course;
          this.showRegistrationModal = true;
        }
        
      } catch (error) {
        console.error('❌ Error starting course:', error);
        this.errorMessage = 'Не удалось открыть курс';
      } finally {
        this.processingCourse = null;
      }
    },
    
    checkUserAuthentication() {
      const auth = getAuth();
      return !!auth.currentUser;
    },
    
    triggerRegistration() {
      const hero = document.getElementById("hero");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          window.dispatchEvent(new Event("open-Login-modal"));
        }, 600);
      } else {
        window.dispatchEvent(new Event("open-Login-modal"));
      }
      
      this.closeRegistrationModal();
    },
    
    closeRegistrationModal() {
      this.showRegistrationModal = false;
      this.selectedCourse = null;
    },
    
    handleError(error) {
      let errorMessage = 'Произошла ошибка при загрузке курсов';
      
      if (error?.response) {
        const status = error.response.status;
        switch (status) {
          case 404:
            errorMessage = 'Курсы не найдены';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Ошибка сервера. Попробуйте позже.';
            break;
          default:
            errorMessage = `Ошибка сервера (${status})`;
        }
      } else if (error?.request) {
        errorMessage = 'Ошибка сети. Проверьте подключение.';
      }
      
      this.errorMessage = errorMessage;
    },
    
    // Utility methods
    getTopicName(course) {
      if (!course) return 'Без названия';
      return course.name || course.topicName || course.topic || course.title || 'Без названия';
    },
    
    getTopicDescription(course) {
      if (!course) return 'Описание отсутствует';
      
      const description = course.description || course.topicDescription;
      if (description && description.length > 100) {
        return description.substring(0, 100) + '...';
      }
      return description || `Изучите ${this.getTopicName(course)} с практическими упражнениями`;
    },
    
    getTopicType(course) {
      if (!course) return 'free';
      
      const type = course.type || course.accessType || course.pricing || 'free';
      const normalizedType = String(type).toLowerCase();
      
      if (normalizedType === 'premium' || normalizedType === 'paid' || normalizedType === 'start') {
        return 'premium';
      }
      if (normalizedType === 'pro' || normalizedType === 'professional') {
        return 'pro';
      }
      return 'free';
    },
    
    getTopicTypeIcon(course) {
      const type = this.getTopicType(course);
      const icons = { free: '💚', premium: '💎', pro: '🌟' };
      return icons[type] || '💚';
    },
    
    getTopicTypeLabel(course) {
      const type = this.getTopicType(course);
      const labels = { free: 'Бесплатно', premium: 'Премиум', pro: 'Pro' };
      return labels[type] || 'Бесплатно';
    },
    
    getStartButtonClass(course) {
      const type = this.getTopicType(course);
      if (type === 'pro') return 'btn-pro';
      if (type === 'premium') return 'btn-premium';
      return 'btn-free';
    },
    
    getStartButtonIcon(course) {
      if (this.processingCourse === course._id) return '⏳';
      const type = this.getTopicType(course);
      if (type === 'free') return '🚀';
      return '🔒';
    },
    
    getStartButtonText(course) {
      if (this.processingCourse === course._id) return 'Открытие...';
      const type = this.getTopicType(course);
      if (type === 'free') return 'Начать бесплатно';
      if (type === 'premium') return 'Получить доступ';
      return 'Pro доступ';
    },
    
    getCourseIcon(course) {
      const subject = course.subject?.toLowerCase() || 'general';
      const iconMap = {
        'история': '/assets/icons/history2.svg',
        'биология': '/assets/icons/biology2.svg',
        'кодинг': '/assets/icons/coding2.svg',
        'математика': '/assets/icons/math2.svg',
        'физика': '/assets/icons/physics2.png'
      };
      return iconMap[subject] || '/assets/icons/coding2.svg';
    },
    
    isFeaturedCourse(course) {
      return course.type === 'free' && course.lessons?.length >= 5;
    },
    
    extractTopicId(topicId) {
      if (typeof topicId === 'string') return topicId;
      if (typeof topicId === 'object' && topicId !== null) {
        return topicId._id || topicId.id || String(topicId);
      }
      return String(topicId);
    },
    
    getTopicNameFromLesson(lesson) {
      if (!lesson) return 'Без темы';
      return lesson.topic || lesson.lessonName || lesson.title || 'Без темы';
    },
    
    calculateLessonTime(lesson) {
      if (lesson.estimatedTime) return parseInt(lesson.estimatedTime, 10);
      if (lesson.duration) return parseInt(lesson.duration, 10);
      return 10; // Default 10 minutes
    }
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

.aced-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(40px, 6vw, 60px);
  padding: clamp(40px, 8vw, 80px) clamp(20px, 5vw, 80px);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  min-height: 100vh;
  color: #1e293b;
  font-family: 'Inter', sans-serif;
}

.left-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.headline {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: clamp(15px, 3vw, 25px);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.context-text {
  font-size: clamp(1.1rem, 2.5vw, 1.3rem);
  color: #64748b;
  margin-bottom: clamp(25px, 4vw, 40px);
  font-weight: 400;
}

.filter-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.subject-filter, .type-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-controls label {
  font-weight: 500;
  color: #475569;
  font-size: 0.9rem;
}

.filter-controls select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 140px;
}

.filter-controls select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.courses-grid {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.loading-grid, .courses-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.course-placeholder {
  height: 320px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.course-card {
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 24px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  height: 320px;
  display: flex;
  flex-direction: column;
}

.course-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(99, 102, 241, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.course-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.course-card:hover::before {
  opacity: 1;
}

.course-card.course-free {
  border-left: 4px solid #10b981;
}

.course-card.course-premium {
  border-left: 4px solid #8b5cf6;
}

.course-card.course-pro {
  border-left: 4px solid #f59e0b;
}

.course-card.featured {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(255, 255, 255, 0.9));
}

.course-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 2;
}

.course-badge.free {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.course-badge.premium {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.course-badge.pro {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-subject {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  margin: 0;
}

.course-description {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

.course-stats {
  display: flex;
  gap: 16px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
}

.stat-icon {
  font-size: 1rem;
}

.stat-value {
  font-weight: 600;
  color: #1e293b;
}

.stat-label {
  color: #64748b;
}

.course-actions {
  margin-top: 16px;
}

.start-course-btn {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.start-course-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-free {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-free:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.btn-premium:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.btn-pro {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-pro:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
}

.course-hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: 24px;
}

.course-card:hover .course-hover-overlay {
  opacity: 1;
}

.empty-courses {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 2px dashed rgba(226, 232, 240, 0.8);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-courses h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.empty-courses p {
  color: #64748b;
  margin-bottom: 24px;
  font-size: 1rem;
}

.retry-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.registration-modal {
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s ease;
  background: none;
  border: none;
  padding: 4px;
}

.close-btn:hover {
  color: #1e293b;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.modal-header p {
  color: #64748b;
  font-size: 1rem;
}

.course-preview {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.course-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
  background: white;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.course-info p {
  color: #6366f1;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.course-benefits {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #475569;
}

.benefit-icon {
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.register-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.register-btn:hover {
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

.cancel-btn {
  padding: 12px 24px;
  background: transparent;
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(248, 250, 252, 0.8);
  border-color: rgba(203, 213, 225, 0.8);
  color: #475569;
}

/* Error Alert */
.error-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(239, 68, 68, 0.95);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from { 
    opacity: 0;
    transform: translateX(100%);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

.error-icon {
  font-size: 1.2rem;
}

.error-text {
  flex: 1;
  font-weight: 500;
}

.retry-error-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-error-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .aced-section {
    padding: 40px 20px;
    gap: 30px;
  }
  
  .headline {
    font-size: 2.5rem;
  }
  
  .context-text {
    font-size: 1.1rem;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .subject-filter, .type-filter {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-controls select {
    min-width: 160px;
  }
  
  .courses-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .course-card {
    height: auto;
    min-height: 280px;
  }
  
  .registration-modal {
    margin: 20px;
    padding: 24px;
  }
  
  .course-preview {
    flex-direction: column;
    text-align: center;
  }
  
  .error-alert {
    position: relative;
    top: auto;
    right: auto;
    margin: 20px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .headline {
    font-size: 2rem;
  }
  
  .filter-controls {
    padding: 12px;
  }
  
  .course-card {
    padding: 20px;
  }
  
  .registration-modal {
    padding: 20px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .aced-section {
    background: #ffffff;
  }
  
  .course-card {
    border: 2px solid #1e293b;
    background: #ffffff;
  }
  
  .headline {
    -webkit-text-fill-color: #1e293b;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .course-card,
  .start-course-btn,
  .refresh-btn,
  .retry-btn {
    transition: none;
  }
  
  .course-card:hover {
    transform: none;
  }
  
  .refresh-icon.spinning {
    animation: none;
  }
  
  @keyframes fadeIn {
  from, to { 
    opacity: 1;
    transform: none;
  }
}

@keyframes slideUp {
  from, to { 
    opacity: 1;
    transform: none;
  }
}

@keyframes slideInRight {
  from, to { 
    opacity: 1;
    transform: none;
  }
}

@keyframes pulse {
  from, to { 
    opacity: 1;
    transform: none;
  }
}

@keyframes spin {
  from, to { 
    opacity: 1;
    transform: none;
  }
}
}
</style>